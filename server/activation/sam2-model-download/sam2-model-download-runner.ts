import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildSam2ChecksumManifest, checksumSam2Files } from './sam2-model-checksum'
import { buildSam2ModelTreeManifest } from './sam2-model-gcs-manifest'
import { collectSam2SourceEvidence } from './sam2-model-source-evidence'
import {
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_FILE_NAME,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_MODEL_DOWNLOAD_BUCKET,
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  SAM2_MODEL_DOWNLOAD_LOCAL_DIR,
  SAM2_MODEL_DOWNLOAD_TARGET_PREFIX,
  validateSam2ModelDownloadExecutionEnv,
} from './sam2-model-download-policy'
import type {
  ApprovedSam2ModelDownloadEvidence,
  Sam2DownloadExecutionResult,
  Sam2UploadedObjectEvidence,
} from './sam2-model-download-types'

const execFileAsync = promisify(execFile)
const UPLOAD_FILE_NAMES = [
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CONFIG_FILE_NAME,
  'file_checksums_sha256.txt',
  'model_tree_manifest.json',
  'source_evidence.json',
] as const

export async function runSam2ModelDownload(input: {
  execute: boolean
  cleanup?: boolean
  localDir?: string
}): Promise<Sam2DownloadExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 35B SAM2 model download/upload flow.')
  const localDir = input.localDir ?? SAM2_MODEL_DOWNLOAD_LOCAL_DIR
  const preflight = await runSam2ModelDownloadPreflight(localDir)
  if (!preflight.allowed) throw new Error(`SAM2 model download preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const sourceEvidence = await collectSam2SourceEvidence()
  if (sourceEvidence.blockers.length > 0) {
    throw new Error(`SAM2 source/license evidence blocked download:\n- ${sourceEvidence.blockers.join('\n- ')}`)
  }

  await rm(localDir, { recursive: true, force: true })
  await mkdir(localDir, { recursive: true })
  await downloadFile(SAM2_CHECKPOINT_SOURCE_URL, join(localDir, SAM2_CHECKPOINT_FILE_NAME))
  await downloadFile(SAM2_CONFIG_SOURCE_URL, join(localDir, SAM2_CONFIG_FILE_NAME))

  const downloadedAt = new Date().toISOString()
  const checksumEntries = await checksumSam2Files(localDir, [SAM2_CHECKPOINT_FILE_NAME, SAM2_CONFIG_FILE_NAME])
  const checksumManifest = buildSam2ChecksumManifest(checksumEntries)
  const checksumManifestPath = join(localDir, 'file_checksums_sha256.txt')
  await writeFile(checksumManifestPath, checksumManifest, 'utf8')
  const modelTreeManifest = buildSam2ModelTreeManifest({ files: checksumEntries, createdAt: downloadedAt })
  const modelTreeManifestPath = join(localDir, 'model_tree_manifest.json')
  await writeFile(modelTreeManifestPath, `${JSON.stringify(modelTreeManifest, null, 2)}\n`, 'utf8')
  const sourceEvidencePath = join(localDir, 'source_evidence.json')
  await writeFile(sourceEvidencePath, `${JSON.stringify(sourceEvidence, null, 2)}\n`, 'utf8')

  await assertExpectedLocalFiles(localDir)
  await uploadFilesToGcs(localDir)
  const uploadedAt = new Date().toISOString()
  const uploadedObjects = await verifyUploadedObjects()
  const verifiedAt = new Date().toISOString()

  const checkpoint = checksumEntries.find((entry) => entry.relativePath === SAM2_CHECKPOINT_FILE_NAME)
  const config = checksumEntries.find((entry) => entry.relativePath === SAM2_CONFIG_FILE_NAME)
  if (!checkpoint || !config) throw new Error('Expected SAM2 checkpoint/config checksum entries are missing.')

  const evidence: ApprovedSam2ModelDownloadEvidence = {
    phase: '35B',
    modelFamily: 'SAM2 / Segment Anything Model 2',
    modelId: 'sam2.1_hiera_tiny',
    checkpointFileName: SAM2_CHECKPOINT_FILE_NAME,
    configFileName: SAM2_CONFIG_FILE_NAME,
    status: 'verified',
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
    licenseName: 'Apache-2.0',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    targetGcsPath: SAM2_MODEL_DOWNLOAD_GCS_PATH,
    checkpointSha256: checkpoint.sha256,
    configSha256: config.sha256,
    aggregateSha256: modelTreeManifest.aggregateSha256,
    checkpointSizeBytes: checkpoint.sizeBytes,
    configSizeBytes: config.sizeBytes,
    fileCount: checksumEntries.length,
    uploadedObjectCount: uploadedObjects.length,
    downloadedAt,
    uploadedAt,
    verifiedAt,
    gcsManifestPath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
    gcsChecksumPath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
    gcsSourceEvidencePath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
    sanitizedLocalTempPath: localDir,
    uploadedObjects,
    iamChanges: ['none; Phase 35C runtime service-account objectViewer access is deferred.'],
    blockers: [],
    warnings: [
      'Phase 35B downloaded and uploaded SAM2.1 tiny weights/config only; it did not run SAM2 runtime or process media.',
      'Runtime service-account access is deferred to Phase 35C unless a runtime verification phase explicitly approves it.',
    ],
  }

  if (input.cleanup !== false) await rm(localDir, { recursive: true, force: true })

  return {
    evidence,
    sourceEvidence,
    localArtifacts: {
      tempDir: localDir,
      checksumManifestPath,
      modelTreeManifestPath,
      sourceEvidencePath,
    },
  }
}

export async function runSam2ModelDownloadPreflight(localDir = SAM2_MODEL_DOWNLOAD_LOCAL_DIR) {
  const [activeAccount, activeProject, projectDescribe, bucketDescribe, bucketIamPolicy] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${SAM2_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${SAM2_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  if (projectDescribe.trim() !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
  if (/allUsers|allAuthenticatedUsers/.test(bucketIamPolicy)) blockers.push('Target bucket IAM includes a public principal.')

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

  const envValidation = validateSam2ModelDownloadExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProject.trim(),
    authenticatedAccount: activeAccount.trim(),
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD,
    bucketName: SAM2_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: SAM2_MODEL_DOWNLOAD_TARGET_PREFIX,
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
    localTempDir: localDir,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
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
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`SAM2 local artifact set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}

async function uploadFilesToGcs(localDir: string): Promise<void> {
  const args = ['storage', 'cp', ...UPLOAD_FILE_NAMES.map((file) => join(localDir, file)), SAM2_MODEL_DOWNLOAD_GCS_PATH]
  await runGcloud(args)
}

async function verifyUploadedObjects(): Promise<Sam2UploadedObjectEvidence[]> {
  const objects: Sam2UploadedObjectEvidence[] = []
  for (const fileName of UPLOAD_FILE_NAMES) {
    const gcsUri = `${SAM2_MODEL_DOWNLOAD_GCS_PATH}${fileName}`
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
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
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

export function sam2ModelDownloadEvidenceToTypeScript(evidence: ApprovedSam2ModelDownloadEvidence): string {
  return [
    'import type { ApprovedSam2ModelDownloadEvidence } from \'./sam2-model-download-types\'',
    '',
    'export const approvedSam2ModelDownloadEvidence: ApprovedSam2ModelDownloadEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedSam2ModelDownloadEvidence(): ApprovedSam2ModelDownloadEvidence {',
    '  return {',
    '    ...approvedSam2ModelDownloadEvidence,',
    '    uploadedObjects: approvedSam2ModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),',
    '    iamChanges: [...approvedSam2ModelDownloadEvidence.iamChanges],',
    '    blockers: [...approvedSam2ModelDownloadEvidence.blockers],',
    '    warnings: [...approvedSam2ModelDownloadEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}

export function safeFileNameFromGcsUri(gcsUri: string): string {
  return basename(gcsUri)
}
