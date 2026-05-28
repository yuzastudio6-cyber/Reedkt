export type EnhancementModelApprovalSourceType =
  | 'github'
  | 'huggingface'
  | 'package_registry'
  | 'release_asset'
  | 'docs'
  | 'manual_review'

export type EnhancementModelApprovalClaim =
  | 'likely_allowed'
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'requires_manual_review'

export type EnhancementModelCandidateStatus =
  | 'candidate_for_phase34_enhancement_test'
  | 'recommended_for_first_enhancement_test'
  | 'evaluated_only'
  | 'blocked'

export type EnhancementModelReviewStatus =
  | 'staging_approved_for_sample_first_enhancement'
  | 'evaluated_only'
  | 'blocked'

export interface EnhancementModelLicenseEvidence {
  evidenceId: string
  modelCandidateId: string
  sourceName: string
  sourceUrl: string
  sourceType: EnhancementModelApprovalSourceType
  licenseClaim: string
  commercialUseClaim: EnhancementModelApprovalClaim
  redistributionClaim: EnhancementModelApprovalClaim
  attributionRequirements: string[]
  fetchedAt?: string
  reviewedAt: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface EnhancementModelCandidateRecord {
  candidateId: string
  toolId: string
  modelName: string
  statuses: EnhancementModelCandidateStatus[]
  purpose: string
  task: string
  sourceUrl?: string
  releaseAssetUrl?: string
  expectedPath?: string
  runtimeTempPath?: string
  stagingStoragePath?: string
  targetFuturePhases: string[]
  canApproveForStagingSampleFirstEnhancement: boolean
  approvedFor: string[]
  blockedReason?: string
  notes: string[]
}

export interface EnhancementModelApprovalDecision {
  candidateId: string
  modelName: string
  reviewStatus: EnhancementModelReviewStatus
  stagingSampleFirstEnhancementAllowed: boolean
  realEsrganExecutionAllowed: false
  fullVideoEnhancementAllowed: false
  filmExecutionAllowed: false
  filmDownloadAllowed: false
  slowMotionExecutionAllowed: false
  productionAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface EnhancementModelStoragePlan {
  storagePlanId: string
  modelCandidateId: string
  expectedRuntimePath: string
  runtimeTempPath: string
  stagingStoragePath: string
  filmFutureStoragePath: string
  privateStorageRequired: true
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  committedToGitAllowed: false
  sourceMediaBucketAllowed: false
  retentionNotes: string[]
  cleanupNotes: string[]
  warnings: string[]
}

export interface EnhancementModelDownloadCommandPlan {
  commandId: string
  modelCandidateId: string
  commandString: string
  executionMode: 'text_only'
  requiresFutureExecutionFlag: true
  futureExecutionFlag: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD'
  safeToRunNow: false
  doesNotDo: string[]
  warnings: string[]
}

export interface EnhancementModelWeightManifestRecord {
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
  reviewStatus: EnhancementModelReviewStatus
  executionStatus: 'blocked'
  downloadStatus: 'blocked' | 'future_phase_only'
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

export interface EnhancementModelApprovalReadiness {
  ready: boolean
  blockers: string[]
  warnings: string[]
}

export interface EnhancementModelApprovalReport {
  reportId: string
  createdAt: string
  approvedModels: EnhancementModelWeightManifestRecord[]
  blockedModels: EnhancementModelWeightManifestRecord[]
  evaluatedOnlyModels: EnhancementModelCandidateRecord[]
  evidenceSummary: EnhancementModelLicenseEvidence[]
  storagePlan: EnhancementModelStoragePlan
  downloadCommandPlan: EnhancementModelDownloadCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase34BReadiness: EnhancementModelApprovalReadiness
  phase34CReadiness: EnhancementModelApprovalReadiness
  phase34DReadiness: EnhancementModelApprovalReadiness
  modelDownloadExecuted: boolean
  providerExecuted: false
  gpuDeployed: false
  frameOrVideoProcessed: false
  enhancementExecutionRan: false
  slowMotionExecutionRan: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
