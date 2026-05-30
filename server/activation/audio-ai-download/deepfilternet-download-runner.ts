import { execFile } from 'node:child_process'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { promisify } from 'node:util'
import {
  assertDeepFilterNetSelectedArtifactSet,
  findDeepFilterNetCliChecksum,
  findDeepFilterNetModelArchiveChecksum,
} from './deepfilternet-artifact-resolver'
import {
  buildDeepFilterNetChecksumManifest,
  checksumDeepFilterNetFiles,
} from './deepfilternet-checksum'
import { buildDeepFilterNetModelTreeManifest } from './deepfilternet-gcs-manifest'
import {
  collectDeepFilterNetLicenseEvidence,
  collectDeepFilterNetSourceEvidence,
} from './deepfilternet-source-evidence'
import {
  DEEPFILTERNET_CLI_FILE_NAME,
  DEEPFILTERNET_DOWNLOAD_BUCKET,
  DEEPFILTERNET_DOWNLOAD_GCS_PATH,
  DEEPFILTERNET_DOWNLOAD_LOCAL_DIR,
  DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX,
  DEEPFILTERNET_LICENSE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
  DEEPFILTERNET_SELECTED_VERSION,
  DEEPFILTERNET_TOOL_FAMILY,
  DEEPFILTERNET_TOOL_ID,
  selectedDeepFilterNetArtifacts,
  validateDeepFilterNetDownloadExecutionEnv,
} from './deepfilternet-download-policy'
import type {
  ApprovedDeepFilterNetDownloadEvidence,
  DeepFilterNetDownloadExecutionResult,
  DeepFilterNetUploadedObjectEvidence,
} from './audio-ai-download-types'

const execFileAsync = promisify(execFile)
const UPLOAD_FILE_NAMES = [
  DEEPFILTERNET_CLI_FILE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
  'file_checksums_sha256.txt',
  'model_tree_manifest.json',
  'source_evidence.json',
  'license_evidence.json',
  'download_report.json',
] as const
const SELECTED_ARTIFACT_FILE_NAMES = [DEEPFILTERNET_CLI_FILE_NAME, DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME] as const

export async function runDeepFilterNetDownload(input: {
  execute: boolean
  cleanup?: boolean
  localDir?: string
}): Promise<DeepFilterNetDownloadExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 36B DeepFilterNet artifact download/upload flow.')
  const localDir = input.localDir ?? DEEPFILTERNET_DOWNLOAD_LOCAL_DIR
  const preflight = await runDeepFilterNetDownloadPreflight(localDir)
  if (!preflight.allowed) throw new Error(`DeepFilterNet artifact download preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const [sourceEvidence, licenseEvidence] = await Promise.all([
    collectDeepFilterNetSourceEvidence(),
    collectDeepFilterNetLicenseEvidence(),
  ])
  const evidenceBlockers = [...sourceEvidence.blockers, ...licenseEvidence.blockers]
  if (evidenceBlockers.length > 0) {
    throw new Error(`DeepFilterNet source/license evidence blocked download:\n- ${evidenceBlockers.join('\n- ')}`)
  }

  await rm(localDir, { recursive: true, force: true })
  await mkdir(localDir, { recursive: true })
  for (const artifact of selectedDeepFilterNetArtifacts) {
    await downloadFile(artifact.sourceUrl, join(localDir, artifact.fileName))
  }

  const downloadedAt = new Date().toISOString()
  const checksumEntries = await checksumDeepFilterNetFiles(localDir, [...SELECTED_ARTIFACT_FILE_NAMES])
  const checksumManifest = buildDeepFilterNetChecksumManifest(checksumEntries)
  const checksumManifestPath = join(localDir, 'file_checksums_sha256.txt')
  await writeFile(checksumManifestPath, checksumManifest, 'utf8')
  const modelTreeManifest = buildDeepFilterNetModelTreeManifest({ files: checksumEntries, createdAt: downloadedAt })
  const modelTreeManifestPath = join(localDir, 'model_tree_manifest.json')
  await writeFile(modelTreeManifestPath, `${JSON.stringify(modelTreeManifest, null, 2)}\n`, 'utf8')
  const sourceEvidencePath = join(localDir, 'source_evidence.json')
  await writeFile(sourceEvidencePath, `${JSON.stringify(sourceEvidence, null, 2)}\n`, 'utf8')
  const licenseEvidencePath = join(localDir, 'license_evidence.json')
  await writeFile(licenseEvidencePath, `${JSON.stringify(licenseEvidence, null, 2)}\n`, 'utf8')

  const cli = findDeepFilterNetCliChecksum(checksumEntries)
  const modelArchive = findDeepFilterNetModelArchiveChecksum(checksumEntries)
  if (!cli || !modelArchive) throw new Error('Expected DeepFilterNet artifact checksum entries are missing.')

  const plannedEvidence: ApprovedDeepFilterNetDownloadEvidence = {
    phase: '36B',
    toolFamily: DEEPFILTERNET_TOOL_FAMILY,
    toolId: DEEPFILTERNET_TOOL_ID,
    selectedVersion: DEEPFILTERNET_SELECTED_VERSION,
    status: 'downloaded',
    selectedArtifacts: selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact })),
    licenseName: DEEPFILTERNET_LICENSE_NAME,
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    targetGcsPath: DEEPFILTERNET_DOWNLOAD_GCS_PATH,
    cliSha256: cli.sha256,
    modelArchiveSha256: modelArchive.sha256,
    aggregateSha256: modelTreeManifest.aggregateSha256,
    cliSizeBytes: cli.sizeBytes,
    modelArchiveSizeBytes: modelArchive.sizeBytes,
    fileCount: checksumEntries.length,
    downloadedAt,
    sanitizedLocalTempPath: localDir,
    uploadedObjects: [],
    iamChanges: ['none; Phase 36C generated-audio runtime service-account objectViewer access is deferred.'],
    blockers: [],
    warnings: [
      'Phase 36B downloaded selected DeepFilterNet v0.5.6 artifacts only; it did not run DeepFilterNet or process audio/media.',
      'Runtime service-account access is deferred to Phase 36C unless generated-audio runtime verification explicitly approves it.',
    ],
  }

  const downloadReportPath = join(localDir, 'download_report.json')
  await writeFile(downloadReportPath, `${JSON.stringify({ evidence: plannedEvidence, sourceEvidence, licenseEvidence }, null, 2)}\n`, 'utf8')

  await assertExpectedLocalFiles(localDir)
  await uploadFilesToGcs(localDir)
  const uploadedAt = new Date().toISOString()
  let uploadedObjects = await verifyUploadedObjects()

  let evidence: ApprovedDeepFilterNetDownloadEvidence = {
    ...plannedEvidence,
    status: 'verified',
    uploadedObjectCount: uploadedObjects.length,
    uploadedAt,
    verifiedAt: new Date().toISOString(),
    gcsManifestPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
    gcsChecksumPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
    gcsSourceEvidencePath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}source_evidence.json`,
    gcsLicenseEvidencePath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}license_evidence.json`,
    gcsDownloadReportPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}download_report.json`,
    uploadedObjects,
  }
  await writeFile(downloadReportPath, `${JSON.stringify({ evidence, sourceEvidence, licenseEvidence }, null, 2)}\n`, 'utf8')
  await runGcloud(['storage', 'cp', downloadReportPath, `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}download_report.json`])
  uploadedObjects = await verifyUploadedObjects()
  evidence = {
    ...evidence,
    uploadedObjects,
    uploadedObjectCount: uploadedObjects.length,
    verifiedAt: new Date().toISOString(),
  }

  if (input.cleanup !== false) await rm(localDir, { recursive: true, force: true })

  return {
    evidence,
    sourceEvidence,
    licenseEvidence,
    localArtifacts: {
      tempDir: localDir,
      checksumManifestPath,
      modelTreeManifestPath,
      sourceEvidencePath,
      licenseEvidencePath,
      downloadReportPath,
    },
  }
}

export async function runDeepFilterNetDownloadPreflight(localDir = DEEPFILTERNET_DOWNLOAD_LOCAL_DIR) {
  const [activeAccount, activeProject, projectDescribe, bucketDescribe, bucketIamPolicy, existingObjects] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${DEEPFILTERNET_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${DEEPFILTERNET_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloudAllowingFailure(['storage', 'objects', 'list', `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}`, '--recursive', '--limit=50']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  if (projectDescribe.trim() !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
  if (/allUsers|allAuthenticatedUsers/.test(bucketIamPolicy)) blockers.push('Target bucket IAM includes a public principal.')
  if (existingObjects.stderr.trim()) warnings.push(`Existing object listing warning: ${existingObjects.stderr.trim()}`)

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

  const envValidation = validateDeepFilterNetDownloadExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProject.trim(),
    authenticatedAccount: activeAccount.trim(),
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD,
    bucketName: DEEPFILTERNET_DOWNLOAD_BUCKET,
    targetPrefix: DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX,
    artifactUrls: selectedDeepFilterNetArtifacts.map((artifact) => artifact.sourceUrl),
    localTempDir: localDir,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings: [...envValidation.warnings, ...warnings],
    activeAccount: activeAccount.trim(),
    activeProject: activeProject.trim(),
  }
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: HTTP ${response.status}`)
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
}

async function assertExpectedLocalFiles(localDir: string): Promise<void> {
  const files = (await readdir(localDir)).sort()
  const expected = [...UPLOAD_FILE_NAMES].sort()
  const unexpected = files.filter((file) => !expected.includes(file as typeof UPLOAD_FILE_NAMES[number]))
  const missing = expected.filter((file) => !files.includes(file))
  assertDeepFilterNetSelectedArtifactSet(files.filter((file) => SELECTED_ARTIFACT_FILE_NAMES.includes(file as typeof SELECTED_ARTIFACT_FILE_NAMES[number])))
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`DeepFilterNet local artifact set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}

async function uploadFilesToGcs(localDir: string): Promise<void> {
  const args = ['storage', 'cp', ...UPLOAD_FILE_NAMES.map((file) => join(localDir, file)), DEEPFILTERNET_DOWNLOAD_GCS_PATH]
  await runGcloud(args)
}

async function verifyUploadedObjects(): Promise<DeepFilterNetUploadedObjectEvidence[]> {
  const objects: DeepFilterNetUploadedObjectEvidence[] = []
  for (const fileName of UPLOAD_FILE_NAMES) {
    const gcsUri = `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}${fileName}`
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
    maxBuffer: 30 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

async function runGcloudAllowingFailure(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('gcloud', args, {
      maxBuffer: 30 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    })
    return { stdout, stderr }
  } catch (error) {
    const maybe = error as { stdout?: string; stderr?: string }
    return { stdout: maybe.stdout ?? '', stderr: maybe.stderr ?? String(error) }
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

export function deepFilterNetDownloadEvidenceToTypeScript(evidence: ApprovedDeepFilterNetDownloadEvidence): string {
  return [
    'import type { ApprovedDeepFilterNetDownloadEvidence } from \'./audio-ai-download-types\'',
    '',
    'export const approvedDeepFilterNetDownloadEvidence: ApprovedDeepFilterNetDownloadEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedDeepFilterNetDownloadEvidence(): ApprovedDeepFilterNetDownloadEvidence {',
    '  return {',
    '    ...approvedDeepFilterNetDownloadEvidence,',
    '    selectedArtifacts: approvedDeepFilterNetDownloadEvidence.selectedArtifacts.map((artifact) => ({ ...artifact })),',
    '    uploadedObjects: approvedDeepFilterNetDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),',
    '    iamChanges: [...approvedDeepFilterNetDownloadEvidence.iamChanges],',
    '    blockers: [...approvedDeepFilterNetDownloadEvidence.blockers],',
    '    warnings: [...approvedDeepFilterNetDownloadEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}

export function safeDeepFilterNetFileNameFromGcsUri(gcsUri: string): string {
  return basename(gcsUri)
}
