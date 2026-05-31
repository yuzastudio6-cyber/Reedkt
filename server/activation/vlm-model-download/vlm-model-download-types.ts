export type VlmModelDownloadStatus = 'not_started' | 'planned' | 'downloaded' | 'verified' | 'blocked' | 'failed'
export type VlmModelDownloadReportStatus = 'private_staging_verified' | 'exact_asset_selection_download_pending' | 'blocked'
export type VlmModelFileRole = 'model_weight' | 'config' | 'tokenizer' | 'processor' | 'model_card'
export type VlmModelFileRequiredStatus = 'required_for_phase39c_runtime' | 'required_for_source_license_evidence'
export type VlmChecksumStatus = 'pending_until_download' | 'computed'

export interface VlmModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  region?: string
  env?: string
  downloadConfirmation?: string
  privateGcsUploadConfirmation?: string
  bucketName?: string
  targetPrefix?: string
  revision?: string
  localTempDir?: string
  providerExecutionEnabled?: string
  vlmRuntimeExecutionEnabled?: string
  transformersInferenceEnabled?: string
  gpuJobEnabled?: string
  mediaProcessingEnabled?: string
  productionReady?: string
  internalBetaReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
  trackAExecutionEnabled?: string
  publicOutputEnabled?: string
}

export interface VlmModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface VlmHfSiblingMetadata {
  rfilename: string
  size?: number
  blobId?: string
  lfsSha256?: string
}

export interface VlmExactRevisionManifest {
  phase: '39B'
  manifestId: 'qwen3_vl_8b_instruct_exact_revision_manifest_v1'
  collectedAt: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  modelFamily: 'Qwen3-VL'
  revision: string
  sourceApiUrl: string
  modelCardUrl: string
  lastModified?: string
  private: boolean
  gated: boolean | string | null
  disabled: boolean
  pipelineTag?: string
  libraryName?: string
  tags: string[]
  authenticationRequired: boolean
  authenticationAvailable: boolean
  repoFileCount: number
  expectedRepoFileCount: number
  revisionPinned: boolean
  licenseTagPresent: boolean
  architectureTagPresent: boolean
  siblings: VlmHfSiblingMetadata[]
  blockers: string[]
  warnings: string[]
}

export interface VlmModelAssetRecord {
  relativePath: string
  role: VlmModelFileRole
  requiredStatus: VlmModelFileRequiredStatus
  sourceUrl: string
  gcsUri: string
  expectedSizeBytes: number
  blobId?: string
  lfsSha256?: string
  selectionReason: string
}

export interface VlmSourceEvidence {
  phase: '39B'
  collectedAt: string
  phase39APr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62'
  phase39ACommit: '698410e'
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  modelCardUrl: string
  qwenRepoUrl: string
  vllmSupportedModelsUrl: string
  qwenVllmDocsUrl: string
  sourceVerificationMethod: string
  exactRevisionResolved: boolean
  fileListResolved: boolean
  authenticationRequired: boolean
  authenticationAvailable: boolean
  blockers: string[]
  warnings: string[]
}

export interface VlmLicenseEvidence {
  phase: '39B'
  collectedAt: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  licenseName: 'apache-2.0' | 'missing_or_changed'
  licenseTagPresent: boolean
  modelCardEvidenceUrl: string
  qwenRepoEvidenceUrl: string
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'vlm_license_review_required'
  humanLegalReviewRequiredBeforePhase39C: boolean
  productionLegalApprovalComplete: false
  blockers: string[]
  warnings: string[]
}

export interface VlmAssetSelectionManifest {
  phase: '39B'
  manifestId: 'qwen3_vl_8b_instruct_exact_asset_selection_v1'
  selectedAt: string
  selectedBy: 'codex_phase39b_huggingface_revision_registry'
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  modelFamily: 'Qwen3-VL'
  revision: string
  targetGcsPath: string
  selectedAssets: VlmModelAssetRecord[]
  excludedRepoFiles: string[]
  selectedFileCount: number
  selectedTotalSizeBytes: number
  exactRevisionPinned: boolean
  downloadExecuted: boolean
  privateGcsUploadVerified: boolean
  runtimeAutoDownloadAllowed: false
  vlmRuntimeAllowed: false
  inferenceAllowed: false
  mediaProcessingAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface VlmModelDownloadExecutionCommandPlan {
  commandId: string
  phase: 'preflight' | 'metadata' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  commandString: string
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD' | 'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface VlmChecksumEntry {
  relativePath: string
  role: VlmModelFileRole
  sizeBytes?: number
  sha256?: string
  gcsUri: string
  checksumStatus: VlmChecksumStatus
}

export interface VlmChecksumManifest {
  phase: '39B'
  manifestId: 'qwen3_vl_8b_instruct_checksum_manifest_v1'
  generatedAt: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  status: VlmChecksumStatus
  entries: VlmChecksumEntry[]
  aggregateSha256?: string
  totalSizeBytes: number
  fileCount: number
  blockers: string[]
  warnings: string[]
}

export interface VlmModelTreeManifest {
  phase: '39B'
  manifestId: 'qwen3_vl_8b_instruct_model_tree_manifest_v1'
  createdAt: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  modelFamily: 'Qwen3-VL'
  revision: string
  targetGcsPath: string
  localTempPath: string
  selectedAssets: VlmModelAssetRecord[]
  fileSha256: Record<string, string>
  fileSizes: Record<string, number | null>
  aggregateSha256: string
  downloadAllowedInPhase39B: true
  privateGcsUploadAllowedInPhase39B: true
  runtimeAutoDownloadAllowed: false
  vlmRuntimeAllowed: false
  inferenceAllowed: false
  mediaProcessingAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  internalBetaAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  trackAExecutionAllowed: false
}

export interface VlmUploadedObjectEvidence {
  gcsUri: string
  relativePath: string
  sizeBytes: number
  localSha256?: string
  contentType?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
  updated?: string
}

export interface VlmPrivateGcsUploadReport {
  phase: '39B'
  reportId: 'qwen3_vl_8b_instruct_private_gcs_upload_report_v1'
  createdAt: string
  targetGcsPath: string
  privateStorageRequired: true
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  sourceMediaBucketAllowed: false
  uploadedObjects: VlmUploadedObjectEvidence[]
  uploadVerified: boolean
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeHandoffManifest {
  phase: '39B'
  nextPhase: '39C'
  manifestId: 'qwen3_vl_8b_instruct_phase39c_runtime_handoff_v1'
  createdAt: string
  phase39CReadyForGeneratedRuntimeVerification: boolean
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  privateGcsPath: string
  requiredRuntimeRules: string[]
  blockedScopes: string[]
  blockers: string[]
  warnings: string[]
}

export interface VlmCostRiskUpdate {
  phase: '39B'
  reportId: 'qwen3_vl_8b_instruct_cost_risk_update_v1'
  createdAt: string
  selectedTotalSizeBytes: number
  selectedFileCount: number
  gpuRuntimeApprovedNow: false
  runtimeCostReviewed: false
  warnings: string[]
  blockers: string[]
}

export interface ApprovedVlmModelDownloadEvidence {
  phase: '39B'
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  modelFamily: 'Qwen3-VL'
  revision: string
  status: VlmModelDownloadStatus
  licenseName: 'apache-2.0' | 'missing_or_changed'
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started' | 'vlm_license_review_required'
  humanLegalReviewRequiredBeforePhase39C: boolean
  productionLegalApprovalComplete: false
  targetGcsPath: string
  selectedAssets: VlmModelAssetRecord[]
  assetSha256: Record<string, string>
  aggregateSha256?: string
  assetSizeBytes: Record<string, number>
  fileCount?: number
  selectedTotalSizeBytes?: number
  uploadedObjectCount?: number
  downloadedAt?: string
  uploadedAt?: string
  verifiedAt?: string
  gcsPhaseReportPath?: string
  sanitizedLocalTempPath?: string
  uploadedObjects: VlmUploadedObjectEvidence[]
  blockers: string[]
  warnings: string[]
}

export interface VlmModelDownloadReport {
  reportId: 'activation-phase-39b-qwen3-vl-exact-assets-private-staging'
  createdAt: string
  status: VlmModelDownloadReportStatus
  downloadEvidence: ApprovedVlmModelDownloadEvidence
  exactRevisionManifest: VlmExactRevisionManifest
  sourceEvidence: VlmSourceEvidence
  licenseEvidence: VlmLicenseEvidence
  assetSelectionManifest: VlmAssetSelectionManifest
  checksumManifest: VlmChecksumManifest
  modelTreeManifest: VlmModelTreeManifest
  privateGcsUploadReport: VlmPrivateGcsUploadReport
  runtimeHandoffManifest: VlmRuntimeHandoffManifest
  costRiskUpdate: VlmCostRiskUpdate
  executionCommandPlans: VlmModelDownloadExecutionCommandPlan[]
  expectedArtifacts: string[]
  blockers: string[]
  warnings: string[]
  phase39CReadiness: {
    readyForGeneratedVlmRuntimeVerification: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  notReadyFor: string[]
  modelDownloadCompleted: boolean
  exactAssetSelectionApproved: boolean
  vlmRuntimeAllowed: false
  vlmInferenceAllowed: false
  transformersInferenceAllowed: false
  vllmRuntimeAllowed: false
  runtimeAutoDownloadAllowed: false
  providerAllowed: false
  mediaProcessingAllowed: false
  realMediaProcessingAllowed: false
  gpuJobAllowed: false
  publicOutputAllowed: false
  signedUrlSourceOfTruthAllowed: false
  gcpIamMutationAllowed: false
  cloudRunDeployAllowed: false
  dockerBuildPushAllowed: false
  productionReadyAllowed: false
  internalBetaAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  trackAExecutionAllowed: false
}

export interface VlmModelDownloadExecutionResult {
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
  localArtifacts: {
    runRoot: string
    downloadDir: string
    reportDir: string
    phaseReportPath: string
  }
}
