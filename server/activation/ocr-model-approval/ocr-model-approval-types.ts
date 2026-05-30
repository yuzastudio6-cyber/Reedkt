export type OcrCandidateId = 'paddleocr' | 'paddlepaddle' | 'pp_ocrv5'
export type OcrApprovalStatus = 'candidate_for_phase37_ocr_safe_zone' | 'required_runtime_candidate' | 'model_family_candidate'
export type OcrReviewStatus = 'staging_approved_for_ocr_safe_zone_planning' | 'planning_only' | 'blocked_until_exact_assets_selected'
export type OcrReadinessStatus = 'ready_for_exact_asset_selection' | 'blocked_until_phase37b_assets' | 'blocked_until_phase37c_runtime'

export interface OcrSourceEvidence {
  evidenceId: string
  sourceName: string
  sourceUrl: string
  licenseClaim: string
  evidenceSummary: string
  confidence: 'high' | 'medium' | 'low'
}

export interface OcrModelCandidateRecord {
  candidateId: OcrCandidateId
  toolName: string
  statuses: OcrApprovalStatus[]
  recommendedForFirstSafeZoneTest: boolean
  officialRepoUrl: string
  licenseName: string
  role: string
  taskScope: string[]
  firstReeditProScope: string[]
  evidence: OcrSourceEvidence[]
  reviewStatus: OcrReviewStatus
  downloadStatus: 'not_applicable' | 'blocked_until_exact_assets_selected'
  runtimeStatus: 'planning_only' | 'blocked_until_phase37c'
  noExecutionInPhase37A: true
}

export interface OcrLicenseEvidenceRecord {
  candidateId: OcrCandidateId
  licenseIdentified: boolean
  licenseName: string
  packageOrRuntimeLicenseClear: boolean
  modelAssetLicenseClear: boolean | 'deferred_until_exact_assets_selected'
  humanLegalReviewRequiredBeforePhase37B: boolean
  evidenceRequired: string[]
  notes: string[]
}

export interface OcrApprovalPolicy {
  phase: '37A'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPlanningScope: 'staging_generated_ocr_safe_zone_planning'
  phase37BPlanningAllowed: true
  phase37CPlanningAllowed: true
  phase37DPlanningAllowed: true
  ocrExecutionAllowed: false
  ocrModelDownloadAllowed: false
  runtimeAutoDownloadAllowed: false
  realMediaOcrAllowed: false
  realVideoOcrAllowed: false
  gpuDeploymentAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}

export interface OcrStoragePlan {
  storagePlanId: string
  baseStagingPath: string
  detectionModelPath: string
  recognitionModelPath: string
  classifierModelPath: string
  privateStorageRequired: true
  sourceMediaBucketAllowed: false
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  committedToGitAllowed: false
  checksumRequiredAfterDownload: true
  exactModelAssetVersionsRequiredBeforeRuntime: true
  notes: string[]
}

export interface OcrDownloadCommandPlan {
  commandId: string
  futurePhase: '37B'
  description: string
  commandText: string
  executableCommand: null
  executionMode: 'text_only'
  safeToRunNow: false
  requiresFutureApproval: true
  blockedReason: string
  warnings: string[]
}

export interface OcrRuntimeImagePlan {
  imagePlanId: string
  futurePhase: '37C'
  dockerfilePath: 'docker/prod/ocr-runtime/Dockerfile'
  requirementsPath: 'docker/prod/ocr-runtime/requirements.ocr.txt'
  runtimeBase: 'python_cpu_first'
  cpuFirst: true
  gpuAllowedOnlyAfterLaterApproval: true
  runtimeRequirements: string[]
  forbidsRuntimeModelDownload: true
  providerAllowed: false
  publicAccessAllowed: false
  revideoAllowed: false
}

export interface OcrManifestRecord {
  manifestId: 'ocr_paddleocr_ppocrv5_staging_plan_v1' | 'paddlepaddle_runtime_staging_plan_v1'
  toolId?: 'paddleocr'
  runtimeId: 'paddlepaddle'
  modelFamily?: 'PP-OCRv5'
  purpose: string
  source: string
  sourceUrl: string
  stagingStoragePath?: string
  expectedRuntimePath?: string
  license: 'Apache-2.0'
  reviewStatus: OcrReviewStatus
  downloadStatus: 'blocked_until_exact_assets_selected' | 'not_applicable_until_image_build'
  runtimeStatus: 'blocked_until_phase37C' | 'planning_only'
  productionStatus: 'production_blocked' | 'blocked'
  externalBetaStatus: 'blocked'
  broadRealMediaStatus: 'blocked'
  checksum: 'missing_until_download' | 'not_applicable_until_image_build'
  approvedFor: string[]
}

export interface OcrPhaseReadiness {
  ready: boolean
  nextPhase: string
  status: OcrReadinessStatus
  blockers: string[]
  criteria: string[]
}

export interface OcrModelApprovalReport {
  phase: '37A'
  reportId: 'activation-phase-37a-paddleocr-model-runtime-approval'
  createdAt: string
  status: 'staging_planning_approved'
  approvedPlanningScopes: string[]
  blockedExecutionScopes: string[]
  toolEvidenceSummary: OcrModelCandidateRecord[]
  licenseEvidence: OcrLicenseEvidenceRecord[]
  runtimeEvidenceSummary: OcrModelCandidateRecord[]
  modelFamilySummary: OcrModelCandidateRecord[]
  storagePlan: OcrStoragePlan
  downloadCommandPlan: OcrDownloadCommandPlan[]
  runtimeImagePlan: OcrRuntimeImagePlan
  manifests: OcrManifestRecord[]
  blockers: string[]
  warnings: string[]
  phase37BReadiness: OcrPhaseReadiness
  phase37CReadiness: OcrPhaseReadiness
  phase37DReadiness: OcrPhaseReadiness
  ocrExecutionAllowed: false
  ocrModelDownloadAllowed: false
  runtimeAutoDownloadAllowed: false
  realMediaOcrAllowed: false
  realVideoOcrAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  revideoAllowed: false
}
