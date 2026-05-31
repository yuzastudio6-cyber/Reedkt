import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { finished } from 'node:stream/promises'
import { promisify } from 'node:util'
import {
  VLM_MODEL_DOWNLOAD_BUCKET,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
  VLM_MODEL_DOWNLOAD_PAYLOAD_DIR,
  VLM_MODEL_DOWNLOAD_REPORT_DIR,
  VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  VLM_MODEL_DOWNLOAD_TEMP_ROOT,
} from './vlm-model-download-config'
import {
  VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
  vlmModelDownloadBlockers,
  vlmModelDownloadNotReadyFor,
} from './vlm-model-download-blocker-policy'
import { buildVlmModelDownloadCommandPlan, buildVlmModelDownloadIamPlan } from './vlm-model-download-command-plan'
import {
  validateVlmModelDownloadExecutionEnv,
  validateVlmModelDownloadStaticPlan,
} from './vlm-model-download-policy'
import { resolveVlmExactRevision } from './vlm-model-exact-revision-resolver'
import {
  VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES,
  buildVlmSelectedAssetsFromSiblings,
} from './vlm-model-file-registry'
import { buildVlmModelDownloadSourceEvidence } from './vlm-model-source-evidence'
import { buildVlmModelDownloadLicenseEvidence } from './vlm-model-license-evidence'
import { buildVlmPhase39AEvidenceReview } from './vlm-model-phase39a-evidence'
import {
  buildComputedVlmChecksumManifest,
  buildPendingVlmChecksumManifest,
} from './vlm-model-checksum-manifest'
import { buildVlmModelTreeManifest } from './vlm-model-tree-manifest'
import {
  buildPendingVlmModelDownloadEvidence,
  buildVlmAssetSelectionManifest,
  buildVlmCostRiskUpdate,
  buildVlmModelDownloadReport,
  buildVlmPrivateGcsUploadReport,
  buildVlmRuntimeHandoffManifest,
} from './vlm-model-download-report-builder'
import { getApprovedVlmModelDownloadEvidence } from './approved-vlm-model-download-evidence'
import {
  buildVlmModelDownloadArtifactMap,
  writeVlmModelDownloadArtifacts,
} from './vlm-model-download-manifest-writer'
import type {
  ApprovedVlmModelDownloadEvidence,
  VlmModelAssetRecord,
  VlmModelDownloadExecutionResult,
  VlmModelDownloadReport,
  VlmUploadedObjectEvidence,
} from './vlm-model-download-types'

const execFileAsync = promisify(execFile)

type VlmPreflightResult = {
  allowed: boolean
  blockers: string[]
  warnings: string[]
  activeAccount: string
  activeProject: string
}

const selectedUploadPaths = VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS

export async function buildVlmModelDownloadReportFromCurrentMetadata(createdAt = new Date().toISOString()): Promise<VlmModelDownloadReport> {
  const revisionManifest = await resolveVlmExactRevision(createdAt)
  const phase39AReview = buildVlmPhase39AEvidenceReview(createdAt)
  const selectedAssets = buildVlmSelectedAssetsFromSiblings(revisionManifest.siblings, revisionManifest.revision)
  const sourceEvidence = buildVlmModelDownloadSourceEvidence(revisionManifest, createdAt)
  const licenseEvidence = buildVlmModelDownloadLicenseEvidence(revisionManifest, createdAt)
  const staticPlan = validateVlmModelDownloadStaticPlan({
    bucketName: VLM_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
    revision: revisionManifest.revision,
  })
  const approvedEvidence = getApprovedVlmModelDownloadEvidence()
  if (approvedEvidence.status === 'verified' && approvedEvidence.revision === revisionManifest.revision) {
    const assetSelectionManifest = buildVlmAssetSelectionManifest({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      revision: revisionManifest.revision,
      selectedAssets: approvedEvidence.selectedAssets,
      excludedRepoFiles: [...VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES],
      downloadExecuted: true,
      privateGcsUploadVerified: approvedEvidence.blockers.length === 0,
      blockers: approvedEvidence.blockers,
      warnings: approvedEvidence.warnings,
    })
    const checksumManifest = buildComputedVlmChecksumManifest({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      revision: revisionManifest.revision,
      selectedAssets: approvedEvidence.selectedAssets,
      checksums: approvedEvidence.assetSha256,
      sizes: approvedEvidence.assetSizeBytes,
      blockers: approvedEvidence.aggregateSha256 ? [] : ['Approved Phase 39B evidence is missing aggregate SHA256.'],
    })
    const privateGcsUploadReport = buildVlmPrivateGcsUploadReport({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      uploadedObjects: approvedEvidence.uploadedObjects,
      uploadVerified: approvedEvidence.blockers.length === 0,
      blockers: approvedEvidence.blockers,
    })
    const runtimeHandoffManifest = buildVlmRuntimeHandoffManifest({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      revision: revisionManifest.revision,
      checksumVerified: approvedEvidence.blockers.length === 0,
      blockers: approvedEvidence.blockers,
    })
    const costRiskUpdate = buildVlmCostRiskUpdate({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      selectedFileCount: approvedEvidence.fileCount ?? approvedEvidence.selectedAssets.length,
      selectedTotalSizeBytes: approvedEvidence.selectedTotalSizeBytes ?? Object.values(approvedEvidence.assetSizeBytes).reduce((sum, size) => sum + size, 0),
    })
    const modelTreeManifest = buildVlmModelTreeManifest({
      createdAt: approvedEvidence.verifiedAt ?? createdAt,
      revision: revisionManifest.revision,
      localTempPath: approvedEvidence.sanitizedLocalTempPath ?? `${VLM_MODEL_DOWNLOAD_TEMP_ROOT}/<verified-run>/${VLM_MODEL_DOWNLOAD_PAYLOAD_DIR}`,
      selectedAssets: approvedEvidence.selectedAssets,
      fileSha256: approvedEvidence.assetSha256,
      fileSizes: approvedEvidence.assetSizeBytes,
      aggregateSha256: approvedEvidence.aggregateSha256 ?? checksumManifest.aggregateSha256 ?? '',
    })
    return buildVlmModelDownloadReport({
      createdAt,
      evidence: approvedEvidence,
      exactRevisionManifest: revisionManifest,
      sourceEvidence,
      licenseEvidence,
      assetSelectionManifest,
      checksumManifest,
      modelTreeManifest,
      privateGcsUploadReport,
      runtimeHandoffManifest,
      costRiskUpdate,
    })
  }
  const blockers = [
    ...phase39AReview.blockers,
    ...revisionManifest.blockers,
    ...sourceEvidence.blockers,
    ...licenseEvidence.blockers,
    ...staticPlan.blockers,
    ...vlmModelDownloadBlockers,
  ]
  const assetSelectionManifest = buildVlmAssetSelectionManifest({
    createdAt,
    revision: revisionManifest.revision,
    selectedAssets,
    excludedRepoFiles: [...VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES],
    blockers: blockers.filter((blocker) => blocker.includes('file') || blocker.includes('revision')),
    warnings: ['Phase 39B selected files are exact metadata until guarded download verifies local bytes.'],
  })
  const checksumManifest = buildPendingVlmChecksumManifest({
    createdAt,
    revision: revisionManifest.revision,
    selectedAssets,
    blockers: ['Checksum generation is pending guarded Phase 39B download execution.'],
  })
  const privateGcsUploadReport = buildVlmPrivateGcsUploadReport({ createdAt })
  const evidence = buildPendingVlmModelDownloadEvidence({
    createdAt,
    revision: revisionManifest.revision,
    selectedAssets,
    blockers,
  })
  const runtimeHandoffManifest = buildVlmRuntimeHandoffManifest({
    createdAt,
    revision: revisionManifest.revision,
    checksumVerified: false,
  })
  const costRiskUpdate = buildVlmCostRiskUpdate({
    createdAt,
    selectedFileCount: selectedAssets.length,
    selectedTotalSizeBytes: selectedAssets.reduce((sum, asset) => sum + asset.expectedSizeBytes, 0),
  })
  const modelTreeManifest = buildVlmModelTreeManifest({
    createdAt,
    revision: revisionManifest.revision,
    localTempPath: `${VLM_MODEL_DOWNLOAD_TEMP_ROOT}/<run-id>/${VLM_MODEL_DOWNLOAD_PAYLOAD_DIR}`,
    selectedAssets,
    fileSha256: {},
    fileSizes: Object.fromEntries(selectedAssets.map((asset) => [asset.relativePath, asset.expectedSizeBytes])),
    aggregateSha256: 'pending_until_download',
  })

  return buildVlmModelDownloadReport({
    createdAt,
    evidence,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    runtimeHandoffManifest,
    costRiskUpdate,
  })
}

export async function runVlmModelDownload(input: {
  execute: boolean
  cleanup?: boolean
  runId?: string
  localRoot?: string
}): Promise<VlmModelDownloadExecutionResult> {
  if (!input.execute) throw new Error('Pass --execute to run Phase 39B Qwen3-VL exact asset download/private staging.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? buildVlmModelDownloadRunId(createdAt)
  const runRoot = input.localRoot ?? join(VLM_MODEL_DOWNLOAD_TEMP_ROOT, runId)
  const downloadDir = join(runRoot, VLM_MODEL_DOWNLOAD_PAYLOAD_DIR)
  const reportDir = join(runRoot, VLM_MODEL_DOWNLOAD_REPORT_DIR)

  const revisionManifest = await resolveVlmExactRevision(createdAt)
  const selectedAssets = buildVlmSelectedAssetsFromSiblings(revisionManifest.siblings, revisionManifest.revision)
  const totalSelectedBytes = selectedAssets.reduce((sum, asset) => sum + asset.expectedSizeBytes, 0)
  const phase39AReview = buildVlmPhase39AEvidenceReview(createdAt)
  const sourceEvidence = buildVlmModelDownloadSourceEvidence(revisionManifest, createdAt)
  const licenseEvidence = buildVlmModelDownloadLicenseEvidence(revisionManifest, createdAt)
  const preflight = await runVlmModelDownloadPreflight({
    downloadDir,
    revision: revisionManifest.revision,
    selectedAssets,
    totalSelectedBytes,
  })
  const evidenceBlockers = [
    ...phase39AReview.blockers,
    ...revisionManifest.blockers,
    ...sourceEvidence.blockers,
    ...licenseEvidence.blockers,
    ...preflight.blockers,
  ]
  if (evidenceBlockers.length > 0) {
    throw new Error(`Phase 39B VLM model download blocked:\n- ${evidenceBlockers.join('\n- ')}`)
  }

  await rm(runRoot, { recursive: true, force: true })
  await mkdir(downloadDir, { recursive: true })
  await mkdir(reportDir, { recursive: true })

  const assetSha256: Record<string, string> = {}
  const assetSizeBytes: Record<string, number> = {}
  for (const asset of selectedAssets) {
    const downloaded = await downloadHfAsset(asset, join(downloadDir, asset.relativePath))
    if (asset.expectedSizeBytes !== downloaded.sizeBytes) {
      throw new Error(`Downloaded size mismatch for ${asset.relativePath}: expected ${asset.expectedSizeBytes}, got ${downloaded.sizeBytes}.`)
    }
    assetSha256[asset.relativePath] = downloaded.sha256
    assetSizeBytes[asset.relativePath] = downloaded.sizeBytes
  }

  const downloadedAt = new Date().toISOString()
  const checksumManifest = buildComputedVlmChecksumManifest({
    createdAt: downloadedAt,
    revision: revisionManifest.revision,
    selectedAssets,
    checksums: assetSha256,
    sizes: assetSizeBytes,
    warnings: [
      'SHA256 was computed locally while streaming Hugging Face resolve URLs.',
      'No VLM runtime or inference was imported or executed.',
    ],
  })
  const modelTreeManifest = buildVlmModelTreeManifest({
    createdAt: downloadedAt,
    revision: revisionManifest.revision,
    localTempPath: downloadDir,
    selectedAssets,
    fileSha256: assetSha256,
    fileSizes: assetSizeBytes,
    aggregateSha256: checksumManifest.aggregateSha256 ?? '',
  })
  let assetSelectionManifest = buildVlmAssetSelectionManifest({
    createdAt: downloadedAt,
    revision: revisionManifest.revision,
    selectedAssets,
    excludedRepoFiles: [...VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES],
    downloadExecuted: true,
    blockers: ['Private GCS upload has not been verified yet.'],
    warnings: ['Downloaded local files were not committed; only safe metadata may be committed.'],
  })
  let privateGcsUploadReport = buildVlmPrivateGcsUploadReport({ createdAt: downloadedAt })
  const runtimeHandoffManifest = buildVlmRuntimeHandoffManifest({
    createdAt: downloadedAt,
    revision: revisionManifest.revision,
    checksumVerified: false,
  })
  const costRiskUpdate = buildVlmCostRiskUpdate({
    createdAt: downloadedAt,
    selectedFileCount: selectedAssets.length,
    selectedTotalSizeBytes: totalSelectedBytes,
  })
  const downloadedEvidence: ApprovedVlmModelDownloadEvidence = {
    phase: '39B',
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: 'Qwen3-VL',
    revision: revisionManifest.revision,
    status: 'downloaded',
    licenseName: 'apache-2.0',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLegalReviewRequiredBeforePhase39C: false,
    productionLegalApprovalComplete: false,
    targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    selectedAssets,
    assetSha256,
    aggregateSha256: checksumManifest.aggregateSha256,
    assetSizeBytes,
    fileCount: selectedAssets.length,
    selectedTotalSizeBytes: totalSelectedBytes,
    downloadedAt,
    sanitizedLocalTempPath: runRoot,
    uploadedObjects: [],
    blockers: ['Private GCS upload has not been verified yet.'],
    warnings: [
      'Phase 39B downloaded selected Qwen3-VL assets only; it did not run VLM runtime or inference.',
      'Generated VLM runtime remains blocked until Phase 39C verifies local private assets and no runtime auto-download.',
    ],
  }
  const initialReport = buildVlmModelDownloadReport({
    createdAt: downloadedAt,
    evidence: downloadedEvidence,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    runtimeHandoffManifest,
    costRiskUpdate,
  })
  await writeVlmModelDownloadArtifacts(reportDir, buildArtifacts({
    phaseReport: initialReport,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    runtimeHandoffManifest,
    costRiskUpdate,
    createdAt: downloadedAt,
  }))

  await assertExpectedLocalPayloads(downloadDir, selectedAssets)
  await assertPrivateGcsUploadConfirmation()
  await uploadSelectedAssetsToGcs(downloadDir, selectedAssets)
  await uploadReportsToGcs(reportDir)
  let uploadedObjects = await verifyUploadedObjects({ selectedAssets, reportDir, assetSha256 })

  const verifiedAt = new Date().toISOString()
  privateGcsUploadReport = buildVlmPrivateGcsUploadReport({
    createdAt: verifiedAt,
    uploadedObjects,
    uploadVerified: true,
    blockers: [],
  })
  assetSelectionManifest = buildVlmAssetSelectionManifest({
    createdAt: verifiedAt,
    revision: revisionManifest.revision,
    selectedAssets,
    excludedRepoFiles: [...VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES],
    downloadExecuted: true,
    privateGcsUploadVerified: true,
    blockers: [],
    warnings: ['Private GCS verification passed for selected assets and JSON/text manifests.'],
  })
  const runtimeHandoffVerified = buildVlmRuntimeHandoffManifest({
    createdAt: verifiedAt,
    revision: revisionManifest.revision,
    checksumVerified: true,
    blockers: [],
  })
  const evidence: ApprovedVlmModelDownloadEvidence = {
    ...downloadedEvidence,
    status: 'verified',
    uploadedAt: verifiedAt,
    verifiedAt,
    uploadedObjectCount: uploadedObjects.length,
    gcsPhaseReportPath: `${VLM_MODEL_DOWNLOAD_GCS_PATH}phase_39b_vlm_model_download_report.json`,
    uploadedObjects,
    blockers: [],
  }
  const finalReport = buildVlmModelDownloadReport({
    createdAt: verifiedAt,
    evidence,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    runtimeHandoffManifest: runtimeHandoffVerified,
    costRiskUpdate,
  })
  await writeVlmModelDownloadArtifacts(reportDir, buildArtifacts({
    phaseReport: finalReport,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    runtimeHandoffManifest: runtimeHandoffVerified,
    costRiskUpdate,
    createdAt: verifiedAt,
  }))
  await uploadReportsToGcs(reportDir)
  uploadedObjects = await verifyUploadedObjects({ selectedAssets, reportDir, assetSha256 })
  evidence.uploadedObjects = uploadedObjects
  evidence.uploadedObjectCount = uploadedObjects.length
  evidence.verifiedAt = new Date().toISOString()

  if (input.cleanup !== false) await rm(runRoot, { recursive: true, force: true })

  return {
    evidence,
    exactRevisionManifest: revisionManifest,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport: buildVlmPrivateGcsUploadReport({
      createdAt: evidence.verifiedAt,
      uploadedObjects,
      uploadVerified: true,
      blockers: [],
    }),
    runtimeHandoffManifest: runtimeHandoffVerified,
    costRiskUpdate,
    localArtifacts: {
      runRoot,
      downloadDir,
      reportDir,
      phaseReportPath: join(reportDir, 'phase_39b_vlm_model_download_report.json'),
    },
  }
}

export async function runVlmModelDownloadPreflight(input: {
  downloadDir: string
  revision: string
  selectedAssets: VlmModelAssetRecord[]
  totalSelectedBytes: number
}): Promise<VlmPreflightResult> {
  const [activeAccount, activeProject, bucketDescribe, bucketIamPolicy, existingObjects, diskSpace] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${VLM_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${VLM_MODEL_DOWNLOAD_BUCKET}`, '--format=json']),
    runGcloudAllowingFailure(['storage', 'objects', 'list', VLM_MODEL_DOWNLOAD_GCS_PATH, '--format=json', '--limit=200']),
    runDf('/tmp'),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  if (activeProject.stdout.trim() !== 'reeditpro') blockers.push(`Active gcloud project must be reeditpro; got ${activeProject.stdout.trim() || 'unknown'}.`)
  if (!activeAccount.stdout.trim()) blockers.push('No active gcloud account is available.')
  if (/allUsers|allAuthenticatedUsers/.test(bucketIamPolicy.stdout)) blockers.push('Target bucket IAM includes a public principal.')
  warnings.push(...collectCommandWarnings([activeAccount, activeProject, bucketDescribe, bucketIamPolicy, existingObjects]))

  try {
    const bucket = parseGcloudJson(bucketDescribe.stdout) as {
      iamConfiguration?: {
        uniformBucketLevelAccess?: { enabled?: boolean }
        publicAccessPrevention?: string
      }
      publicAccessPrevention?: string
      public_access_prevention?: string
      uniform_bucket_level_access?: boolean
      location?: string
      name?: string
    }
    const ubla = bucket.iamConfiguration?.uniformBucketLevelAccess?.enabled ?? bucket.uniform_bucket_level_access
    const pap = bucket.iamConfiguration?.publicAccessPrevention ?? bucket.publicAccessPrevention ?? bucket.public_access_prevention
    if (bucket.name && bucket.name !== VLM_MODEL_DOWNLOAD_BUCKET) blockers.push('gcloud bucket describe returned an unexpected bucket.')
    if (ubla === false) blockers.push('Uniform bucket-level access is disabled on target bucket.')
    if (pap !== 'enforced') blockers.push('Public access prevention is not enforced on target bucket.')
  } catch (error) {
    blockers.push(`private_gcs_bucket_metadata_unreadable: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const parsedObjects = existingObjects.stdout.trim() ? parseGcloudJson(existingObjects.stdout) : []
    const objectNames = Array.isArray(parsedObjects)
      ? parsedObjects.map((object) => stringValue((object as Record<string, unknown>).name ?? (object as Record<string, unknown>).url)).filter((value): value is string => Boolean(value))
      : []
    const allowedSuffixes = new Set([
      ...input.selectedAssets.map((asset) => asset.relativePath),
      ...VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
    ])
    const unexpected = objectNames.filter((name) => {
      const suffix = name.startsWith(VLM_MODEL_DOWNLOAD_TARGET_PREFIX) ? name.slice(VLM_MODEL_DOWNLOAD_TARGET_PREFIX.length) : name.replace(VLM_MODEL_DOWNLOAD_GCS_PATH, '')
      return suffix && !allowedSuffixes.has(suffix)
    })
    if (unexpected.length > 0) blockers.push(`unexpected_existing_gcs_objects: ${unexpected.join(', ')}`)
    if (objectNames.length > 0) warnings.push(`Existing objects under target prefix are allowed only if they match Phase 39B selected files/reports; found ${objectNames.length}.`)
  } catch (error) {
    warnings.push(`Could not parse existing object list; upload verification will still fail closed if objects cannot be described: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (diskSpace.availableBytes < requiredDiskBytes(input.totalSelectedBytes)) {
    blockers.push(`insufficient_disk: /tmp has ${diskSpace.availableBytes} bytes available, requires at least ${requiredDiskBytes(input.totalSelectedBytes)} bytes.`)
  }

  const envValidation = validateVlmModelDownloadExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProject.stdout.trim(),
    authenticatedAccount: activeAccount.stdout.trim(),
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    downloadConfirmation: process.env.REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD,
    privateGcsUploadConfirmation: process.env.REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD,
    bucketName: VLM_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
    revision: input.revision,
    localTempDir: input.downloadDir,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    vlmRuntimeExecutionEnabled: process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE ?? 'false',
    transformersInferenceEnabled: process.env.REEDITPRO_CONFIRM_TRANSFORMERS_INFERENCE ?? 'false',
    gpuJobEnabled: process.env.REEDITPRO_GPU_JOB_ENABLED ?? 'false',
    mediaProcessingEnabled: process.env.REEDITPRO_MEDIA_PROCESSING_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    internalBetaReady: process.env.REEDITPRO_INTERNAL_BETA_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
    trackAExecutionEnabled: process.env.REEDITPRO_TRACK_A_EXECUTION_ENABLED ?? 'false',
    publicOutputEnabled: process.env.REEDITPRO_PUBLIC_OUTPUT_ENABLED ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && envValidation.allowed,
    blockers: [...envValidation.blockers, ...blockers],
    warnings: [...envValidation.warnings, ...warnings],
    activeAccount: activeAccount.stdout.trim(),
    activeProject: activeProject.stdout.trim(),
  }
}

function buildArtifacts(input: {
  createdAt: string
  exactRevisionManifest: VlmModelDownloadReport['exactRevisionManifest']
  sourceEvidence: VlmModelDownloadReport['sourceEvidence']
  licenseEvidence: VlmModelDownloadReport['licenseEvidence']
  assetSelectionManifest: VlmModelDownloadReport['assetSelectionManifest']
  checksumManifest: VlmModelDownloadReport['checksumManifest']
  modelTreeManifest: VlmModelDownloadReport['modelTreeManifest']
  privateGcsUploadReport: VlmModelDownloadReport['privateGcsUploadReport']
  runtimeHandoffManifest: VlmModelDownloadReport['runtimeHandoffManifest']
  costRiskUpdate: VlmModelDownloadReport['costRiskUpdate']
  phaseReport: VlmModelDownloadReport
}) {
  return buildVlmModelDownloadArtifactMap({
    modelDownloadPlan: {
      phase: '39B',
      reportId: 'phase_39b_vlm_model_download_plan',
      createdAt: input.createdAt,
      modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
      revision: input.exactRevisionManifest.revision,
      targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
      selectedFileCount: input.assetSelectionManifest.selectedFileCount,
      selectedTotalSizeBytes: input.assetSelectionManifest.selectedTotalSizeBytes,
      commandPlan: buildVlmModelDownloadCommandPlan(),
      iamPlan: buildVlmModelDownloadIamPlan(input.createdAt),
      noInference: true,
      noMediaProcessing: true,
      noProviderCalls: true,
      noGpuJobs: true,
      noTrackA: true,
      noBetaProduction: true,
    },
    exactRevisionManifest: input.exactRevisionManifest,
    sourceEvidence: input.sourceEvidence,
    licenseEvidence: input.licenseEvidence,
    assetSelectionManifest: input.assetSelectionManifest,
    downloadCommandPlan: buildVlmModelDownloadCommandPlan(),
    checksumManifest: input.checksumManifest,
    modelTreeManifest: input.modelTreeManifest,
    privateGcsUploadReport: input.privateGcsUploadReport,
    runtimeHandoffManifest: input.runtimeHandoffManifest,
    costRiskUpdate: input.costRiskUpdate,
    blockerReport: {
      phase: '39B',
      reportId: 'phase_39b_vlm_blocker_report',
      createdAt: input.createdAt,
      blockers: input.phaseReport.blockers,
      warnings: input.phaseReport.warnings,
      stillBlocked: vlmModelDownloadNotReadyFor,
    },
    phaseReport: input.phaseReport,
  })
}

async function downloadHfAsset(asset: VlmModelAssetRecord, destination: string): Promise<{ sizeBytes: number; sha256: string }> {
  const token = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_HUB_TOKEN
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(asset.sourceUrl, { headers })
  if (!response.ok || !response.body) throw new Error(`Failed to download ${asset.relativePath} from Hugging Face: HTTP ${response.status}.`)
  await mkdir(dirname(destination), { recursive: true })
  const writer = createWriteStream(destination, { flags: 'w' })
  const reader = response.body.getReader()
  const hash = createHash('sha256')
  let sizeBytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      hash.update(value)
      sizeBytes += value.byteLength
      if (!writer.write(Buffer.from(value))) await new Promise<void>((resolve) => writer.once('drain', () => resolve()))
    }
    writer.end()
    await finished(writer)
  } catch (error) {
    writer.destroy()
    throw error
  }
  return { sizeBytes, sha256: hash.digest('hex') }
}

async function assertExpectedLocalPayloads(downloadDir: string, selectedAssets: VlmModelAssetRecord[]): Promise<void> {
  const files = await collectRelativeFiles(downloadDir)
  const expected = selectedAssets.map((asset) => asset.relativePath).sort()
  const unexpected = files.filter((file) => !expected.includes(file))
  const missing = expected.filter((file) => !files.includes(file))
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(`VLM local payload set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
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

async function assertPrivateGcsUploadConfirmation(): Promise<void> {
  if (process.env.REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD !== 'true') {
    throw new Error('The current-shell VLM private GCS upload confirmation is required before uploading Phase 39B Qwen3-VL assets to private GCS.')
  }
}

async function uploadSelectedAssetsToGcs(downloadDir: string, selectedAssets: VlmModelAssetRecord[]): Promise<void> {
  for (const asset of selectedAssets) {
    await runGcloud(['storage', 'cp', join(downloadDir, asset.relativePath), `${VLM_MODEL_DOWNLOAD_GCS_PATH}${asset.relativePath}`])
  }
}

async function uploadReportsToGcs(reportDir: string): Promise<void> {
  for (const relativePath of selectedUploadPaths) {
    await runGcloud(['storage', 'cp', join(reportDir, relativePath), `${VLM_MODEL_DOWNLOAD_GCS_PATH}${relativePath}`])
  }
}

async function verifyUploadedObjects(input: {
  selectedAssets: VlmModelAssetRecord[]
  reportDir: string
  assetSha256: Record<string, string>
}): Promise<VlmUploadedObjectEvidence[]> {
  const objects: VlmUploadedObjectEvidence[] = []
  for (const asset of input.selectedAssets) {
    const gcsUri = `${VLM_MODEL_DOWNLOAD_GCS_PATH}${asset.relativePath}`
    const output = await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])
    const parsed = parseGcloudJson(output.stdout) as Record<string, unknown>
    const sizeBytes = Number(parsed.size ?? parsed.contentLength ?? 0)
    if (sizeBytes !== asset.expectedSizeBytes) throw new Error(`Uploaded object ${gcsUri} size mismatch: expected ${asset.expectedSizeBytes}, got ${sizeBytes}.`)
    objects.push(buildUploadedObjectEvidence(parsed, gcsUri, asset.relativePath, input.assetSha256[asset.relativePath]))
  }
  for (const relativePath of selectedUploadPaths) {
    const localPath = join(input.reportDir, relativePath)
    const localStat = await stat(localPath)
    const gcsUri = `${VLM_MODEL_DOWNLOAD_GCS_PATH}${relativePath}`
    const output = await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])
    const parsed = parseGcloudJson(output.stdout) as Record<string, unknown>
    const sizeBytes = Number(parsed.size ?? parsed.contentLength ?? 0)
    if (sizeBytes !== localStat.size) throw new Error(`Uploaded report ${gcsUri} size mismatch: expected ${localStat.size}, got ${sizeBytes}.`)
    objects.push(buildUploadedObjectEvidence(parsed, gcsUri, relativePath))
  }
  return objects
}

function buildUploadedObjectEvidence(
  parsed: Record<string, unknown>,
  gcsUri: string,
  relativePath: string,
  localSha256?: string,
): VlmUploadedObjectEvidence {
  return {
    gcsUri,
    relativePath,
    sizeBytes: Number(parsed.size ?? parsed.contentLength ?? 0),
    localSha256,
    contentType: stringValue(parsed.contentType),
    generation: stringValue(parsed.generation),
    metageneration: stringValue(parsed.metageneration),
    crc32c: stringValue(parsed.crc32c_hash ?? parsed.crc32cHash),
    md5Hash: stringValue(parsed.md5_hash ?? parsed.md5Hash),
    updated: stringValue(parsed.updated ?? parsed.updateTime),
  }
}

async function runDf(path: string): Promise<{ availableBytes: number; stderr: string }> {
  const result = await execFileAsync('df', ['-Pk', path], { maxBuffer: 1024 * 1024 })
  const lines = result.stdout.trim().split(/\r?\n/)
  const fields = lines[1]?.trim().split(/\s+/) ?? []
  return {
    availableBytes: Number(fields[3] ?? 0) * 1024,
    stderr: result.stderr,
  }
}

function requiredDiskBytes(totalSelectedBytes: number): number {
  const tenGiB = 10 * 1024 * 1024 * 1024
  return Math.ceil(totalSelectedBytes + tenGiB)
}

async function runGcloud(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync('gcloud', args, {
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return { stdout, stderr }
}

async function runGcloudAllowingFailure(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    return await runGcloud(args)
  } catch (error) {
    const maybe = error as { stdout?: string; stderr?: string }
    return { stdout: maybe.stdout ?? '', stderr: maybe.stderr ?? String(error) }
  }
}

function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const starts = [objectStart, arrayStart].filter((index) => index >= 0)
  const jsonStart = starts.length ? Math.min(...starts) : -1
  if (jsonStart < 0) throw new Error(`gcloud did not return JSON: ${output.slice(0, 200)}`)
  return JSON.parse(output.slice(jsonStart))
}

function collectCommandWarnings(outputs: Array<{ stderr?: string }>): string[] {
  return outputs
    .flatMap((output) => (output.stderr ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean))
    .filter((line) => !/^\s*$/.test(line))
    .map((line) => `gcloud warning: ${line}`)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function buildVlmModelDownloadRunId(createdAt: string): string {
  return `phase39b-${createdAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function vlmModelDownloadEvidenceToTypeScript(evidence: ApprovedVlmModelDownloadEvidence): string {
  return [
    'import type { ApprovedVlmModelDownloadEvidence } from \'./vlm-model-download-types\'',
    '',
    'export const approvedVlmModelDownloadEvidence: ApprovedVlmModelDownloadEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedVlmModelDownloadEvidence(): ApprovedVlmModelDownloadEvidence {',
    '  return {',
    '    ...approvedVlmModelDownloadEvidence,',
    '    selectedAssets: approvedVlmModelDownloadEvidence.selectedAssets.map((asset) => ({ ...asset })),',
    '    assetSha256: { ...approvedVlmModelDownloadEvidence.assetSha256 },',
    '    assetSizeBytes: { ...approvedVlmModelDownloadEvidence.assetSizeBytes },',
    '    uploadedObjects: approvedVlmModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),',
    '    blockers: [...approvedVlmModelDownloadEvidence.blockers],',
    '    warnings: [...approvedVlmModelDownloadEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
