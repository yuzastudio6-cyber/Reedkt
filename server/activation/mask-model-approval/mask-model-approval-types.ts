export type MaskModelApprovalSourceType =
  | 'github'
  | 'huggingface'
  | 'package_registry'
  | 'docs'
  | 'manual_review'

export type MaskModelApprovalClaim =
  | 'likely_allowed'
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'requires_manual_review'

export type MaskModelCandidateStatus =
  | 'candidate_for_phase33_mask_test'
  | 'recommended_for_first_mask_test'
  | 'evaluated_only'
  | 'upstream_evidence'
  | 'blocked'

export type MaskModelReviewStatus =
  | 'staging_approved_for_single_frame_mask_test'
  | 'evaluated_only'
  | 'upstream_evidence'
  | 'blocked'

export interface MaskModelLicenseEvidence {
  evidenceId: string
  modelCandidateId: string
  sourceName: string
  sourceUrl: string
  sourceType: MaskModelApprovalSourceType
  licenseClaim: string
  commercialUseClaim: MaskModelApprovalClaim
  redistributionClaim: MaskModelApprovalClaim
  attributionRequirements: string[]
  fetchedAt?: string
  reviewedAt: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface MaskModelCandidateRecord {
  candidateId: string
  toolId: string
  modelName: string
  statuses: MaskModelCandidateStatus[]
  purpose: string
  task: string
  sourceUrl?: string
  officialGithubUrl?: string
  expectedPath?: string
  runtimeTempPath?: string
  stagingStoragePath?: string
  targetFuturePhases: string[]
  canApproveForStagingSingleFrameBackgroundRemoval: boolean
  approvedFor: string[]
  blockedReason?: string
  notes: string[]
}

export interface MaskModelApprovalDecision {
  candidateId: string
  modelName: string
  reviewStatus: MaskModelReviewStatus
  stagingSingleFrameBackgroundRemovalAllowed: boolean
  sam2ExecutionAllowed: false
  textBehindSubjectExecutionAllowed: false
  productionAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface MaskModelStoragePlan {
  storagePlanId: string
  modelCandidateId: string
  expectedRuntimePath: string
  runtimeTempPath: string
  stagingStoragePath: string
  privateStorageRequired: true
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  committedToGitAllowed: false
  sourceMediaBucketAllowed: false
  retentionNotes: string[]
  cleanupNotes: string[]
  warnings: string[]
}

export interface MaskModelDownloadCommandPlan {
  commandId: string
  modelCandidateId: string
  commandString: string
  executionMode: 'text_only'
  requiresFutureExecutionFlag: true
  futureExecutionFlag: 'REEDITPRO_CONFIRM_MASK_MODEL_WEIGHT_DOWNLOAD'
  safeToRunNow: false
  doesNotDo: string[]
  warnings: string[]
}

export interface MaskModelWeightManifestRecord {
  modelWeightManifestId: string
  toolId: string
  modelName: string
  modelVersion: string
  resolvedRevision?: string
  source: string
  sourceUrl: string
  expectedPath: string
  runtimeTempPath?: string
  stagingStoragePath: string
  license: string
  commercialUseAllowed: 'likely_allowed_after_review' | 'blocked' | 'unknown'
  redistributionAllowed: 'likely_allowed_after_review' | 'blocked' | 'unknown'
  requiresAttribution: boolean
  reviewStatus: MaskModelReviewStatus
  productionStatus: 'production_blocked'
  externalBetaStatus: 'blocked'
  paidProductionStatus: 'blocked'
  broadRealMediaStatus: 'blocked'
  riskNotes: string[]
  checksum: 'missing_until_download' | string
  createdAt: string
  reviewedAt: string
  approvedFor: string[]
}

export interface MaskModelApprovalReadiness {
  ready: boolean
  blockers: string[]
  warnings: string[]
}

export interface MaskModelApprovalReport {
  reportId: string
  createdAt: string
  approvedModels: MaskModelWeightManifestRecord[]
  blockedModels: MaskModelWeightManifestRecord[]
  evaluatedOnlyModels: MaskModelCandidateRecord[]
  evidenceSummary: MaskModelLicenseEvidence[]
  storagePlan: MaskModelStoragePlan
  downloadCommandPlan: MaskModelDownloadCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase33BReadiness: MaskModelApprovalReadiness
  phase33CReadiness: MaskModelApprovalReadiness
  phase33DReadiness: MaskModelApprovalReadiness
  modelDownloadExecuted: boolean
  providerExecuted: false
  gpuDeployed: false
  frameOrVideoProcessed: false
  maskExecutionRan: false
  textBehindSubjectExecutionRan: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
