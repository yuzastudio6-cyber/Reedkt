import { execFile } from 'node:child_process'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { buildOcrAssetSelectionManifest, selectedOcrModelAssetRelativePaths, selectedOcrModelAssets } from './ocr-model-asset-registry'
import {
  buildComputedOcrChecksumManifest,
  checksumOcrModelFiles,
} from './ocr-model-checksum-manifest'
import { OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS } from './ocr-model-download-blocker-policy'
import {
  OCR_MODEL_DOWNLOAD_BUCKET,
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  validateOcrModelDownloadExecutionEnv,
} from './ocr-model-download-policy'
import {
  buildOcrModelDownloadArtifactMap,
  writeOcrModelDownloadArtifacts,
} from './ocr-model-download-manifest-writer'
import {
  buildOcrModelDownloadReport,
  buildOcrPrivateGcsUploadReport,
} from './ocr-model-download-report-builder'
import { buildOcrModelTreeManifest } from './ocr-model-tree-manifest'
import {
  collectOcrModelLicenseEvidence,
} from './ocr-model-license-evidence'
import { collectOcrModelSourceEvidence } from './ocr-model-source-evidence'
import type {
  ApprovedOcrModelDownloadEvidence,
  OcrModelDownloadExecutionResult,
  OcrUploadedObjectEvidence,
} from './ocr-model-download-types'

const execFileAsync = promisify(execFile)
const UPLOAD_RELATIVE_PATHS = [
  ...selectedOcrModelAssets.map((asset) => asset.gcsRelativePath),
  ...OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
] as const

export async function runOcrModelDownload(input: {
  execute: boolean
  cleanup?: boolean
  localDir?: string
}): Promise<OcrModelDownloadExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 37B PaddleOCR model download/upload flow.')
  const localDir = input.localDir ?? OCR_MODEL_DOWNLOAD_LOCAL_DIR
  const preflight = await runOcrModelDownloadPreflight(localDir)
  if (!preflight.allowed) throw new Error(`OCR model download preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const [sourceEvidence, licenseEvidence] = await Promise.all([
    collectOcrModelSourceEvidence(),
    collectOcrModelLicenseEvidence(),
  ])
  const evidenceBlockers = [...sourceEvidence.blockers, ...licenseEvidence.blockers]
  if (evidenceBlockers.length > 0) {
    throw new Error(`OCR source/license evidence blocked download:\n- ${evidenceBlockers.join('\n- ')}`)
  }

  await rm(localDir, { recursive: true, force: true })
  await mkdir(localDir, { recursive: true })
  for (const asset of selectedOcrModelAssets) {
    await downloadFile(asset.sourceUrl, join(localDir, asset.localRelativePath))
  }

  const downloadedAt = new Date().toISOString()
  const checksumEntries = await checksumOcrModelFiles(localDir, selectedOcrModelAssetRelativePaths)
  const checksumManifest = buildComputedOcrChecksumManifest(checksumEntries, downloadedAt)
  const modelTreeManifest = buildOcrModelTreeManifest({
    files: checksumEntries,
    createdAt: downloadedAt,
    localTempPath: localDir,
  })
  const assetSelectionManifest = buildOcrAssetSelectionManifest(downloadedAt)
  assetSelectionManifest.downloadExecuted = true
  assetSelectionManifest.blockers = ['Private GCS upload has not been verified yet.']

  const assetSha256 = Object.fromEntries(checksumEntries.map((entry) => [entry.relativePath, entry.sha256 ?? '']))
  const assetSizeBytes = Object.fromEntries(checksumEntries.map((entry) => [entry.relativePath, entry.sizeBytes ?? 0]))
  const downloadedEvidence: ApprovedOcrModelDownloadEvidence = {
    phase: '37B',
    modelFamily: 'PP-OCRv5',
    assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
    status: 'downloaded',
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: assetSelectionManifest.optionalDeferredAssets.map((asset) => ({ ...asset })),
    licenseName: 'Apache-2.0',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    productionLegalApprovalComplete: false,
    exactAssetSelectionApproved: true,
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    assetSha256,
    aggregateSha256: checksumManifest.aggregateSha256,
    assetSizeBytes,
    fileCount: checksumEntries.length,
    downloadedAt,
    sanitizedLocalTempPath: localDir,
    uploadedObjects: [],
    iamChanges: ['none; Phase 37C runtime service-account objectViewer access is deferred.'],
    blockers: ['Private GCS upload has not been verified yet.'],
    warnings: [
      'Phase 37B downloaded selected PP-OCRv5 assets only; it did not run PaddleOCR or process media.',
      'Runtime service-account access is deferred to Phase 37C unless generated OCR runtime verification explicitly approves it.',
    ],
  }
  const initialUploadReport = buildOcrPrivateGcsUploadReport({ createdAt: downloadedAt })
  const initialPhaseReport = buildOcrModelDownloadReport({
    evidence: downloadedEvidence,
    checksumManifest,
    privateGcsUploadReport: initialUploadReport,
  })
  await writeOcrModelDownloadArtifacts(localDir, buildOcrModelDownloadArtifactMap({
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport: initialUploadReport,
    phaseReport: initialPhaseReport,
  }))

  await assertExpectedLocalFiles(localDir)
  assertPrivateGcsUploadConfirmation()
  await uploadFilesToGcs(localDir)
  const uploadedAt = new Date().toISOString()
  let uploadedObjects = await verifyUploadedObjects()
  let privateGcsUploadReport = buildOcrPrivateGcsUploadReport({
    createdAt: uploadedAt,
    uploadedObjects,
    uploadVerified: true,
  })

  let evidence: ApprovedOcrModelDownloadEvidence = {
    ...downloadedEvidence,
    status: 'verified',
    uploadedObjectCount: uploadedObjects.length,
    uploadedAt,
    verifiedAt: new Date().toISOString(),
    gcsAssetSelectionManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}asset_selection_manifest.json`,
    gcsChecksumManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}checksum_manifest.json`,
    gcsChecksumTextPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
    gcsModelTreeManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
    gcsSourceEvidencePath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
    gcsLicenseEvidencePath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}license_evidence.json`,
    gcsDownloadReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}download_report.json`,
    gcsPrivateUploadReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}private_gcs_upload_report.json`,
    gcsPhaseReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}phase_37b_ocr_model_download_report.json`,
    uploadedObjects,
    blockers: [],
  }
  assetSelectionManifest.privateGcsUploadVerified = true
  assetSelectionManifest.blockers = []
  const finalPhaseReport = buildOcrModelDownloadReport({
    evidence,
    checksumManifest,
    privateGcsUploadReport,
  })
  await writeOcrModelDownloadArtifacts(localDir, buildOcrModelDownloadArtifactMap({
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    phaseReport: finalPhaseReport,
  }))
  await uploadFilesToGcs(localDir)
  uploadedObjects = await verifyUploadedObjects()
  privateGcsUploadReport = buildOcrPrivateGcsUploadReport({
    createdAt: new Date().toISOString(),
    uploadedObjects,
    uploadVerified: true,
  })
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
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    localArtifacts: {
      tempDir: localDir,
      sourceEvidencePath: join(localDir, 'source_evidence.json'),
      licenseEvidencePath: join(localDir, 'license_evidence.json'),
      assetSelectionManifestPath: join(localDir, 'asset_selection_manifest.json'),
      checksumManifestPath: join(localDir, 'checksum_manifest.json'),
      checksumTextPath: join(localDir, 'file_checksums_sha256.txt'),
      modelTreeManifestPath: join(localDir, 'model_tree_manifest.json'),
      downloadReportPath: join(localDir, 'download_report.json'),
      privateGcsUploadReportPath: join(localDir, 'private_gcs_upload_report.json'),
      phaseReportPath: join(localDir, 'phase_37b_ocr_model_download_report.json'),
    },
  }
}

export async function runOcrModelDownloadPreflight(localDir = OCR_MODEL_DOWNLOAD_LOCAL_DIR) {
  const [activeAccount, activeProject, projectDescribe, bucketDescribe, bucketIamPolicy, existingObjects] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${OCR_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${OCR_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloudAllowingFailure(['storage', 'objects', 'list', OCR_MODEL_DOWNLOAD_GCS_PATH, '--recursive', '--limit=50']),
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

  const envValidation = validateOcrModelDownloadExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProject.trim(),
    authenticatedAccount: activeAccount.trim(),
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    downloadConfirmation: process.env.REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD,
    privateGcsUploadConfirmation: process.env.REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD,
    bucketName: OCR_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
    assetUrls: selectedOcrModelAssets.map((asset) => asset.sourceUrl),
    localTempDir: localDir,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    betaReady: process.env.REEDITPRO_BETA_READY ?? 'false',
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
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, Buffer.from(await response.arrayBuffer()))
}

async function assertExpectedLocalFiles(localDir: string): Promise<void> {
  const files = await collectRelativeFiles(localDir)
  const expected = [...UPLOAD_RELATIVE_PATHS].sort()
  const unexpected = files.filter((file) => !expected.includes(file as typeof UPLOAD_RELATIVE_PATHS[number]))
  const missing = expected.filter((file) => !files.includes(file))
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`OCR local artifact set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}

async function collectRelativeFiles(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await collectRelativeFiles(root, relativePath))
    else files.push(relativePath)
  }
  return files.sort()
}

function assertPrivateGcsUploadConfirmation(): void {
  if (process.env.REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true is required before uploading Phase 37B OCR assets to private GCS.')
  }
}

async function uploadFilesToGcs(localDir: string): Promise<void> {
  for (const relativePath of UPLOAD_RELATIVE_PATHS) {
    await runGcloud(['storage', 'cp', join(localDir, relativePath), `${OCR_MODEL_DOWNLOAD_GCS_PATH}${relativePath}`])
  }
}

async function verifyUploadedObjects(): Promise<OcrUploadedObjectEvidence[]> {
  const objects: OcrUploadedObjectEvidence[] = []
  for (const relativePath of UPLOAD_RELATIVE_PATHS) {
    const gcsUri = `${OCR_MODEL_DOWNLOAD_GCS_PATH}${relativePath}`
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

export function ocrModelDownloadEvidenceToTypeScript(evidence: ApprovedOcrModelDownloadEvidence): string {
  return [
    'import type { ApprovedOcrModelDownloadEvidence } from \'./ocr-model-download-types\'',
    '',
    'export const approvedOcrModelDownloadEvidence: ApprovedOcrModelDownloadEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedOcrModelDownloadEvidence(): ApprovedOcrModelDownloadEvidence {',
    '  return {',
    '    ...approvedOcrModelDownloadEvidence,',
    '    selectedAssets: approvedOcrModelDownloadEvidence.selectedAssets.map((asset) => ({ ...asset })),',
    '    optionalDeferredAssets: approvedOcrModelDownloadEvidence.optionalDeferredAssets.map((asset) => ({ ...asset })),',
    '    assetSha256: { ...approvedOcrModelDownloadEvidence.assetSha256 },',
    '    assetSizeBytes: { ...approvedOcrModelDownloadEvidence.assetSizeBytes },',
    '    uploadedObjects: approvedOcrModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),',
    '    iamChanges: [...approvedOcrModelDownloadEvidence.iamChanges],',
    '    blockers: [...approvedOcrModelDownloadEvidence.blockers],',
    '    warnings: [...approvedOcrModelDownloadEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}

export function safeOcrModelFileNameFromGcsUri(gcsUri: string): string {
  return basename(gcsUri)
}
