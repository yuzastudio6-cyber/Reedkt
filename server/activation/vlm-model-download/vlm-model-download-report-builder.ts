import {
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
} from './vlm-model-download-config'
import {
  VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
  vlmModelDownloadBlockers,
  vlmModelDownloadNotReadyFor,
  vlmModelDownloadWarnings,
} from './vlm-model-download-blocker-policy'
import { buildVlmModelDownloadCommandPlan } from './vlm-model-download-command-plan'
import { buildVlmModelDownloadReadiness } from './vlm-model-download-readiness'
import type {
  ApprovedVlmModelDownloadEvidence,
  VlmAssetSelectionManifest,
  VlmChecksumManifest,
  VlmCostRiskUpdate,
  VlmExactRevisionManifest,
  VlmLicenseEvidence,
  VlmModelAssetRecord,
  VlmModelDownloadReport,
  VlmModelTreeManifest,
  VlmPrivateGcsUploadReport,
  VlmRuntimeHandoffManifest,
  VlmSourceEvidence,
  VlmUploadedObjectEvidence,
} from './vlm-model-download-types'

export function buildVlmAssetSelectionManifest(input: {
  createdAt: string
  revision: string
  selectedAssets: VlmModelAssetRecord[]
  excludedRepoFiles: string[]
  blockers?: string[]
  warnings?: string[]
  downloadExecuted?: boolean
  privateGcsUploadVerified?: boolean
}): VlmAssetSelectionManifest {
  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_exact_asset_selection_v1',
    selectedAt: input.createdAt,
    selectedBy: 'codex_phase39b_huggingface_revision_registry',
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
    revision: input.revision,
    targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    selectedAssets: input.selectedAssets,
    excludedRepoFiles: input.excludedRepoFiles,
    selectedFileCount: input.selectedAssets.length,
    selectedTotalSizeBytes: input.selectedAssets.reduce((sum, asset) => sum + asset.expectedSizeBytes, 0),
    exactRevisionPinned: input.revision === VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
    downloadExecuted: input.downloadExecuted ?? false,
    privateGcsUploadVerified: input.privateGcsUploadVerified ?? false,
    runtimeAutoDownloadAllowed: false,
    vlmRuntimeAllowed: false,
    inferenceAllowed: false,
    mediaProcessingAllowed: false,
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
  }
}

export function buildVlmPrivateGcsUploadReport(input: {
  createdAt: string
  uploadedObjects?: VlmUploadedObjectEvidence[]
  uploadVerified?: boolean
  blockers?: string[]
  warnings?: string[]
}): VlmPrivateGcsUploadReport {
  const uploadVerified = input.uploadVerified === true
  return {
    phase: '39B',
    reportId: 'qwen3_vl_8b_instruct_private_gcs_upload_report_v1',
    createdAt: input.createdAt,
    targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    privateStorageRequired: true,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    sourceMediaBucketAllowed: false,
    uploadedObjects: input.uploadedObjects ?? [],
    uploadVerified,
    blockers: input.blockers ?? (uploadVerified ? [] : ['Private GCS upload/verification is pending guarded Phase 39B execution.']),
    warnings: input.warnings ?? ['GCS object metadata is recorded with generation, CRC32C, and MD5 when available; SHA256 comes from the local checksum manifest.'],
  }
}

export function buildVlmRuntimeHandoffManifest(input: {
  createdAt: string
  revision: string
  checksumVerified: boolean
  blockers?: string[]
  warnings?: string[]
}): VlmRuntimeHandoffManifest {
  return {
    phase: '39B',
    nextPhase: '39C',
    manifestId: 'qwen3_vl_8b_instruct_phase39c_runtime_handoff_v1',
    createdAt: input.createdAt,
    phase39CReadyForGeneratedRuntimeVerification: input.checksumVerified,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    revision: input.revision,
    privateGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    requiredRuntimeRules: [
      'Phase 39C must copy only these private staged assets and verify SHA256 before runtime.',
      'Phase 39C must start vLLM with a local model path, not the Hugging Face model id.',
      'Phase 39C must disable and guard against vLLM/Hugging Face/ModelScope runtime auto-download.',
      'Phase 39C may run generated fixtures only with bounded prompt templates and JSON-only output.',
      'Phase 39C must block raw prompt execution, provider calls, arbitrary images/videos, real media, broad media, beta, and production.',
      'Phase 39C must report hallucination, coordinate, grounding, and safety QA before Phase 39D.',
    ],
    blockedScopes: vlmModelDownloadNotReadyFor,
    blockers: input.blockers ?? (input.checksumVerified ? [] : ['Phase 39C remains blocked until private staged model assets and upload verification pass.']),
    warnings: input.warnings ?? ['Qwen/vLLM docs require local-path discipline because runtimes may auto-download when given a model id or missing local path.'],
  }
}

export function buildVlmCostRiskUpdate(input: {
  createdAt: string
  selectedTotalSizeBytes: number
  selectedFileCount: number
  blockers?: string[]
  warnings?: string[]
}): VlmCostRiskUpdate {
  return {
    phase: '39B',
    reportId: 'qwen3_vl_8b_instruct_cost_risk_update_v1',
    createdAt: input.createdAt,
    selectedTotalSizeBytes: input.selectedTotalSizeBytes,
    selectedFileCount: input.selectedFileCount,
    gpuRuntimeApprovedNow: false,
    runtimeCostReviewed: false,
    warnings: input.warnings ?? [
      'Phase 39B downloads/stages approximately 16.34 GiB of assets but does not run GPU jobs.',
      'Phase 39C must separately size GPU memory, max tokens, batch size, image size, and timeout before runtime execution.',
    ],
    blockers: input.blockers ?? ['GPU/runtime cost review remains blocked until Phase 39C runtime planning.'],
  }
}

export function buildPendingVlmModelDownloadEvidence(input: {
  createdAt: string
  revision: string
  selectedAssets: VlmModelAssetRecord[]
  blockers?: string[]
  warnings?: string[]
}): ApprovedVlmModelDownloadEvidence {
  return {
    phase: '39B',
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
    revision: input.revision,
    status: 'planned',
    licenseName: 'apache-2.0',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLegalReviewRequiredBeforePhase39C: false,
    productionLegalApprovalComplete: false,
    targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    selectedAssets: input.selectedAssets,
    assetSha256: {},
    assetSizeBytes: Object.fromEntries(input.selectedAssets.map((asset) => [asset.relativePath, asset.expectedSizeBytes])),
    fileCount: input.selectedAssets.length,
    selectedTotalSizeBytes: input.selectedAssets.reduce((sum, asset) => sum + asset.expectedSizeBytes, 0),
    uploadedObjects: [],
    blockers: input.blockers ?? vlmModelDownloadBlockers,
    warnings: input.warnings ?? vlmModelDownloadWarnings,
  }
}

export function buildVlmModelDownloadReport(input: {
  createdAt: string
  evidence: ApprovedVlmModelDownloadEvidence
  exactRevisionManifest: VlmExactRevisionManifest
  sourceEvidence: VlmSourceEvidence
  licenseEvidence: VlmLicenseEvidence
  assetSelectionManifest: VlmAssetSelectionManifest
  checksumManifest: VlmChecksumManifest
  modelTreeManifest: VlmModelTreeManifest
  privateGcsUploadReport: VlmPrivateGcsUploadReport
  runtimeHandoffManifest: VlmRuntimeHandoffManifest
  costRiskUpdate: VlmCostRiskUpdate
}): VlmModelDownloadReport {
  const readiness = buildVlmModelDownloadReadiness(input.evidence)
  const blockers = [
    ...input.evidence.blockers,
    ...input.exactRevisionManifest.blockers,
    ...input.sourceEvidence.blockers,
    ...input.licenseEvidence.blockers,
    ...input.assetSelectionManifest.blockers,
    ...input.checksumManifest.blockers,
    ...input.privateGcsUploadReport.blockers,
    ...input.runtimeHandoffManifest.blockers,
  ]
  const warnings = [
    ...input.evidence.warnings,
    ...input.exactRevisionManifest.warnings,
    ...input.sourceEvidence.warnings,
    ...input.licenseEvidence.warnings,
    ...input.assetSelectionManifest.warnings,
    ...input.checksumManifest.warnings,
    ...input.privateGcsUploadReport.warnings,
    ...input.runtimeHandoffManifest.warnings,
    ...input.costRiskUpdate.warnings,
  ]
  const verified = input.evidence.status === 'verified' && input.privateGcsUploadReport.uploadVerified && blockers.length === 0
  return {
    reportId: 'activation-phase-39b-qwen3-vl-exact-assets-private-staging',
    createdAt: input.createdAt,
    status: verified ? 'private_staging_verified' : input.exactRevisionManifest.revisionPinned ? 'exact_asset_selection_download_pending' : 'blocked',
    downloadEvidence: input.evidence,
    exactRevisionManifest: input.exactRevisionManifest,
    sourceEvidence: input.sourceEvidence,
    licenseEvidence: input.licenseEvidence,
    assetSelectionManifest: input.assetSelectionManifest,
    checksumManifest: input.checksumManifest,
    modelTreeManifest: input.modelTreeManifest,
    privateGcsUploadReport: input.privateGcsUploadReport,
    runtimeHandoffManifest: input.runtimeHandoffManifest,
    costRiskUpdate: input.costRiskUpdate,
    executionCommandPlans: buildVlmModelDownloadCommandPlan(),
    expectedArtifacts: [...VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS],
    blockers,
    warnings,
    phase39CReadiness: {
      readyForGeneratedVlmRuntimeVerification: readiness.phase39CReadyForGeneratedRuntimeVerification,
      readyForRuntimeExecution: false,
      reason: readiness.reason,
    },
    notReadyFor: vlmModelDownloadNotReadyFor,
    modelDownloadCompleted: input.evidence.status === 'downloaded' || input.evidence.status === 'verified',
    exactAssetSelectionApproved: input.exactRevisionManifest.revisionPinned && input.assetSelectionManifest.blockers.length === 0,
    vlmRuntimeAllowed: false,
    vlmInferenceAllowed: false,
    transformersInferenceAllowed: false,
    vllmRuntimeAllowed: false,
    runtimeAutoDownloadAllowed: false,
    providerAllowed: false,
    mediaProcessingAllowed: false,
    realMediaProcessingAllowed: false,
    gpuJobAllowed: false,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    gcpIamMutationAllowed: false,
    cloudRunDeployAllowed: false,
    dockerBuildPushAllowed: false,
    productionReadyAllowed: false,
    internalBetaAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    trackAExecutionAllowed: false,
  }
}

export function summarizeVlmModelDownloadReport(report: VlmModelDownloadReport): string {
  return [
    'Phase 39B Qwen3-VL exact asset private staging',
    `Status: ${report.status}`,
    `Model: ${report.downloadEvidence.modelId}`,
    `Revision: ${report.downloadEvidence.revision}`,
    `Selected files: ${report.assetSelectionManifest.selectedFileCount}`,
    `Selected bytes: ${report.assetSelectionManifest.selectedTotalSizeBytes}`,
    `Private GCS prefix: ${report.downloadEvidence.targetGcsPath}`,
    `Checksum status: ${report.checksumManifest.status}`,
    `Upload verified: ${report.privateGcsUploadReport.uploadVerified}`,
    `Phase 39C generated runtime ready: ${report.phase39CReadiness.readyForGeneratedVlmRuntimeVerification}`,
    `VLM runtime allowed: ${report.vlmRuntimeAllowed}`,
    `VLM inference allowed: ${report.vlmInferenceAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Media processing allowed: ${report.mediaProcessingAllowed}`,
    `GPU job allowed: ${report.gpuJobAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `Track A execution allowed: ${report.trackAExecutionAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}
