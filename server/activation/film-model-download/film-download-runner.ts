import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildFilmChecksumManifest, checksumFilmFiles } from './film-checksum'
import { buildFilmModelTreeManifest } from './film-gcs-manifest'
import { collectFilmSourceEvidence } from './film-source-evidence'
import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_EXPECTED_MODEL_FILE_PATHS,
  FILM_EXPECTED_UPLOAD_MANIFEST_FILES,
  FILM_LICENSE_NAME,
  FILM_MODEL_DOWNLOAD_BUCKET,
  FILM_MODEL_DOWNLOAD_GCS_PATH,
  FILM_MODEL_DOWNLOAD_LOCAL_DIR,
  FILM_MODEL_DOWNLOAD_TARGET_PREFIX,
  FILM_MODEL_ID,
  FILM_PROJECT_PAGE_URL,
  FILM_SELECTED_ARTIFACT_ROOT,
  FILM_SOURCE_REPO_URL,
  FILM_TOOL_FAMILY,
  validateFilmModelDownloadExecutionEnv,
} from './film-model-download-policy'
import type {
  ApprovedFilmModelDownloadEvidence,
  FilmDownloadExecutionResult,
  FilmDriveFile,
  FilmUploadedObjectEvidence,
} from './film-model-download-types'

const execFileAsync = promisify(execFile)

export async function runFilmModelDownload(input: {
  execute: boolean
  cleanup?: boolean
  localDir?: string
}): Promise<FilmDownloadExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 38B FILM model download/upload flow.')
  const localDir = input.localDir ?? FILM_MODEL_DOWNLOAD_LOCAL_DIR
  const preflight = await runFilmModelDownloadPreflight(localDir)
  if (!preflight.allowed) throw new Error(`FILM model download preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const { sourceEvidence, licenseEvidence } = await collectFilmSourceEvidence()
  if (sourceEvidence.blockers.length > 0 || licenseEvidence.blockers.length > 0 || !sourceEvidence.resolvedDriveTree) {
    const blockers = [...sourceEvidence.blockers, ...licenseEvidence.blockers]
    if (!sourceEvidence.resolvedDriveTree) blockers.push('Official Google Drive tree was not resolved; FILM download is blocked.')
    throw new Error(`FILM source/license evidence blocked download:\n- ${Array.from(new Set(blockers)).join('\n- ')}`)
  }

  await rm(localDir, { recursive: true, force: true })
  await mkdir(localDir, { recursive: true })
  for (const file of sourceEvidence.resolvedDriveTree.files) {
    await downloadGoogleDriveFile(file, join(localDir, file.relativePath))
  }

  await assertExpectedLocalFiles(localDir)
  const downloadedAt = new Date().toISOString()
  const checksumEntries = await checksumFilmFiles(localDir, FILM_EXPECTED_MODEL_FILE_PATHS)
  const checksumManifest = buildFilmChecksumManifest(checksumEntries)
  const checksumManifestPath = join(localDir, 'file_checksums_sha256.txt')
  await writeFile(checksumManifestPath, checksumManifest, 'utf8')
  const modelTreeManifest = buildFilmModelTreeManifest({ files: checksumEntries, createdAt: downloadedAt })
  const modelTreeManifestPath = join(localDir, 'model_tree_manifest.json')
  await writeFile(modelTreeManifestPath, `${JSON.stringify(modelTreeManifest, null, 2)}\n`, 'utf8')
  const sourceEvidencePath = join(localDir, 'source_evidence.json')
  await writeFile(sourceEvidencePath, `${JSON.stringify(sourceEvidence, null, 2)}\n`, 'utf8')
  const licenseEvidencePath = join(localDir, 'license_evidence.json')
  await writeFile(licenseEvidencePath, `${JSON.stringify(licenseEvidence, null, 2)}\n`, 'utf8')
  const downloadReportPath = join(localDir, 'download_report.json')
  await writeFile(downloadReportPath, `${JSON.stringify({
    phase: '38B',
    status: 'downloaded_pending_upload_verification',
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    targetGcsPath: FILM_MODEL_DOWNLOAD_GCS_PATH,
    fileCount: checksumEntries.length,
    aggregateSha256: modelTreeManifest.aggregateSha256,
    downloadedAt,
    filmRuntimeAllowed: false,
    slowMotionAllowed: false,
    realVideoSlowMotionAllowed: false,
    fullVideoInterpolationAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }, null, 2)}\n`, 'utf8')

  await uploadFilesToGcs(localDir)
  const uploadedAt = new Date().toISOString()
  const uploadedObjects = await verifyUploadedObjects()
  const verifiedAt = new Date().toISOString()

  const evidence: ApprovedFilmModelDownloadEvidence = {
    phase: '38B',
    track: 'A visual/video',
    toolFamily: FILM_TOOL_FAMILY,
    modelId: FILM_MODEL_ID,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    status: 'verified',
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    projectPageUrl: FILM_PROJECT_PAGE_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    licenseName: FILM_LICENSE_NAME,
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    targetGcsPath: FILM_MODEL_DOWNLOAD_GCS_PATH,
    aggregateSha256: modelTreeManifest.aggregateSha256,
    fileCount: checksumEntries.length,
    uploadedObjectCount: uploadedObjects.length,
    downloadedAt,
    uploadedAt,
    verifiedAt,
    gcsManifestPath: `${FILM_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
    gcsChecksumPath: `${FILM_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
    gcsSourceEvidencePath: `${FILM_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
    gcsLicenseEvidencePath: `${FILM_MODEL_DOWNLOAD_GCS_PATH}license_evidence.json`,
    gcsDownloadReportPath: `${FILM_MODEL_DOWNLOAD_GCS_PATH}download_report.json`,
    sanitizedLocalTempPath: localDir,
    fileChecksums: checksumEntries,
    uploadedObjects,
    iamChanges: ['none; Phase 38C runtime service-account objectViewer access is deferred.'],
    blockers: [],
    warnings: [
      'Phase 38B downloaded and uploaded only the official FILM film_net/Style/saved_model tree; it did not run FILM or process media.',
      'The official repository is archived/read-only; Phase 38C must separately validate runtime dependencies before generated-frame verification.',
      'Runtime service-account access is deferred to Phase 38C unless that phase explicitly approves it.',
    ],
  }

  if (input.cleanup !== false) await rm(localDir, { recursive: true, force: true })

  return {
    evidence,
    sourceEvidence,
    licenseEvidence,
    localArtifacts: {
      tempDir: localDir,
      artifactRootDir: join(localDir, FILM_SELECTED_ARTIFACT_ROOT),
      checksumManifestPath,
      modelTreeManifestPath,
      sourceEvidencePath,
      licenseEvidencePath,
      downloadReportPath,
    },
  }
}

export async function runFilmModelDownloadPreflight(localDir = FILM_MODEL_DOWNLOAD_LOCAL_DIR) {
  const [activeAccount, activeProject, projectDescribe, bucketDescribe, bucketIamPolicy, existingObjects] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${FILM_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${FILM_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloudAllowFailure(['storage', 'objects', 'list', `${FILM_MODEL_DOWNLOAD_GCS_PATH}`, '--recursive', '--limit=20']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  if (projectDescribe.trim() !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
  if (/allUsers|allAuthenticatedUsers/.test(bucketIamPolicy)) blockers.push('Target bucket IAM includes a public principal.')
  if (existingObjects.trim()) warnings.push('Target FILM prefix already contains objects; Phase 38B will verify required objects after upload but will not delete pre-existing objects.')

  try {
    const bucket = parseGcloudJson(bucketDescribe) as {
      iamConfiguration?: {
        uniformBucketLevelAccess?: { enabled?: boolean }
        publicAccessPrevention?: string
      }
      publicAccessPrevention?: string
    }
    const ubla = bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled
    const pap = bucket.iamConfiguration?.publicAccessPrevention ?? bucket.publicAccessPrevention
    if (ubla === false) blockers.push('Uniform bucket-level access is disabled on target bucket.')
    if (pap && pap !== 'enforced') blockers.push('Public access prevention is not enforced on target bucket.')
    if (ubla === undefined) warnings.push('Uniform bucket-level access metadata was not present in bucket describe output.')
    if (pap === undefined) warnings.push('Public access prevention metadata was not present in bucket describe output.')
  } catch {
    warnings.push('Could not parse bucket metadata for public access prevention/uniform bucket-level access; IAM public-principal check still passed.')
  }

  const envValidation = validateFilmModelDownloadExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProject.trim(),
    authenticatedAccount: activeAccount.trim(),
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD,
    bucketName: FILM_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: FILM_MODEL_DOWNLOAD_TARGET_PREFIX,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    localTempDir: localDir,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings: [...envValidation.warnings, ...warnings],
    activeAccount: activeAccount.trim(),
    activeProject: activeProject.trim(),
  }
}

async function downloadGoogleDriveFile(file: FilmDriveFile, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true })
  const initialUrl = `https://drive.google.com/uc?export=download&id=${file.fileId}`
  const initialResponse = await fetch(initialUrl)
  if (!initialResponse.ok) throw new Error(`Failed to start Google Drive download for ${file.relativePath}: HTTP ${initialResponse.status}`)

  const initialContentType = initialResponse.headers.get('content-type') ?? ''
  if (!initialContentType.includes('text/html')) {
    await writeFile(destination, Buffer.from(await initialResponse.arrayBuffer()))
    return
  }

  const html = await initialResponse.text()
  const confirmUrl = buildGoogleDriveConfirmUrl(html)
  if (!confirmUrl) throw new Error(`Google Drive did not provide a public non-authenticated confirm URL for ${file.relativePath}.`)
  const confirmedResponse = await fetch(confirmUrl)
  if (!confirmedResponse.ok) throw new Error(`Failed confirmed Google Drive download for ${file.relativePath}: HTTP ${confirmedResponse.status}`)
  const confirmedContentType = confirmedResponse.headers.get('content-type') ?? ''
  if (confirmedContentType.includes('text/html')) throw new Error(`Confirmed Google Drive download for ${file.relativePath} returned HTML instead of the artifact.`)
  await writeFile(destination, Buffer.from(await confirmedResponse.arrayBuffer()))
}

function buildGoogleDriveConfirmUrl(html: string): string | undefined {
  const action = /<form[^>]*id="download-form"[^>]*action="([^"]+)"/.exec(html)?.[1]
  const id = hiddenInput(html, 'id')
  const exportValue = hiddenInput(html, 'export')
  const confirm = hiddenInput(html, 'confirm')
  const uuid = hiddenInput(html, 'uuid')
  if (!action || !id || !exportValue || !confirm) return undefined
  const params = new URLSearchParams({ id, export: exportValue, confirm })
  if (uuid) params.set('uuid', uuid)
  return `${action.replace(/&amp;/g, '&')}?${params.toString()}`
}

function hiddenInput(html: string, name: string): string | undefined {
  const pattern = new RegExp(`<input type="hidden" name="${escapeRegExp(name)}" value="([^"]*)">`)
  return pattern.exec(html)?.[1]?.replace(/&amp;/g, '&')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function assertExpectedLocalFiles(localDir: string): Promise<void> {
  const files = await listFilesRecursive(localDir)
  const localFiles = files.filter((file) => !FILM_EXPECTED_UPLOAD_MANIFEST_FILES.includes(file as typeof FILM_EXPECTED_UPLOAD_MANIFEST_FILES[number]))
  const expected = [...FILM_EXPECTED_MODEL_FILE_PATHS].sort()
  const unexpected = localFiles.filter((file) => !expected.includes(file as typeof FILM_EXPECTED_MODEL_FILE_PATHS[number]))
  const missing = expected.filter((file) => !localFiles.includes(file))
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`FILM local artifact set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}

async function listFilesRecursive(root: string, subdir = ''): Promise<string[]> {
  const dir = join(root, subdir)
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relativePath = subdir ? `${subdir}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await listFilesRecursive(root, relativePath))
    else if (entry.isFile()) files.push(relativePath)
  }
  return files.sort()
}

async function uploadFilesToGcs(localDir: string): Promise<void> {
  await runGcloud(['storage', 'cp', '--recursive', join(localDir, 'film_net'), FILM_MODEL_DOWNLOAD_GCS_PATH])
  await runGcloud(['storage', 'cp', ...FILM_EXPECTED_UPLOAD_MANIFEST_FILES.map((file) => join(localDir, file)), FILM_MODEL_DOWNLOAD_GCS_PATH])
}

async function verifyUploadedObjects(): Promise<FilmUploadedObjectEvidence[]> {
  const objects: FilmUploadedObjectEvidence[] = []
  const expectedObjects = [
    ...FILM_EXPECTED_MODEL_FILE_PATHS.map((path) => `${FILM_MODEL_DOWNLOAD_GCS_PATH}${path}`),
    ...FILM_EXPECTED_UPLOAD_MANIFEST_FILES.map((path) => `${FILM_MODEL_DOWNLOAD_GCS_PATH}${path}`),
  ]
  for (const gcsUri of expectedObjects) {
    const output = await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])
    const parsed = parseGcloudJson(output) as Record<string, string | number | undefined>
    const sizeBytes = Number(parsed.size ?? parsed.contentLength ?? 0)
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) throw new Error(`Uploaded object ${gcsUri} has invalid size ${String(parsed.size)}.`)
    objects.push({
      gcsUri,
      sizeBytes,
      contentType: stringValue(parsed.contentType),
      generation: stringValue(parsed.generation),
      metageneration: stringValue(parsed.metageneration),
      crc32c: stringValue(parsed.crc32c_hash ?? parsed.crc32cHash),
      md5Hash: stringValue(parsed.md5_hash ?? parsed.md5Hash),
      updated: stringValue(parsed.updated ?? parsed.updateTime),
    })
  }
  return objects
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gcloud', args, {
    maxBuffer: 50 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

async function runGcloudAllowFailure(args: string[]): Promise<string> {
  try {
    return await runGcloud(args)
  } catch {
    return ''
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 120)}`)
  return JSON.parse(output.slice(jsonStart))
}

export function filmModelDownloadEvidenceToTypeScript(evidence: ApprovedFilmModelDownloadEvidence): string {
  return [
    'import type { ApprovedFilmModelDownloadEvidence } from \'./film-model-download-types\'',
    '',
    'export const approvedFilmModelDownloadEvidence: ApprovedFilmModelDownloadEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedFilmModelDownloadEvidence(): ApprovedFilmModelDownloadEvidence {',
    '  return {',
    '    ...approvedFilmModelDownloadEvidence,',
    '    fileChecksums: approvedFilmModelDownloadEvidence.fileChecksums.map((entry) => ({ ...entry })),',
    '    uploadedObjects: approvedFilmModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),',
    '    iamChanges: [...approvedFilmModelDownloadEvidence.iamChanges],',
    '    blockers: [...approvedFilmModelDownloadEvidence.blockers],',
    '    warnings: [...approvedFilmModelDownloadEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
