export type ModelApprovalStatus =
  | 'candidate_for_phase28'
  | 'recommended_for_first_test'
  | 'candidate'
  | 'evaluated_only'
  | 'upstream_evidence'
  | 'staging_approved'
  | 'blocked'

export type ModelApprovalSourceType =
  | 'github'
  | 'huggingface'
  | 'package_registry'
  | 'docs'
  | 'manual_review'

export type ModelApprovalCommercialUseClaim =
  | 'likely_allowed'
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'requires_manual_review'

export type ModelApprovalRedistributionClaim =
  | 'likely_allowed'
  | 'allowed'
  | 'blocked'
  | 'unknown'
  | 'requires_manual_review'

export type ModelApprovalReviewStatus =
  | 'staging_approved'
  | 'candidate'
  | 'evaluated_only'
  | 'upstream_evidence'
  | 'blocked'

export interface ModelLicenseEvidence {
  evidenceId: string
  modelCandidateId: string
  sourceName: string
  sourceUrl: string
  sourceType: ModelApprovalSourceType
  licenseClaim: string
  commercialUseClaim: ModelApprovalCommercialUseClaim
  redistributionClaim: ModelApprovalRedistributionClaim
  attributionRequirements: string[]
  fetchedAt?: string
  reviewedAt: string
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export interface ModelCandidateRecord {
  candidateId: string
  toolId: string
  runtime?: string
  modelName: string
  modelVersion?: string
  status: ModelApprovalStatus
  purpose: string
  sourceUrl?: string
  upstreamModelName?: string
  expectedPath?: string
  stagingStoragePath?: string
  requiredForPhase28: boolean
  canApproveForStagingSpeechCaption: boolean
  approvedFor: string[]
  blockedReason?: string
  notes: string[]
}

export interface ModelApprovalDecision {
  candidateId: string
  modelName: string
  reviewStatus: ModelApprovalReviewStatus
  stagingSpeechCaptionAllowed: boolean
  productionAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  blockers: string[]
  warnings: string[]
}

export interface ModelStoragePlan {
  storagePlanId: string
  modelCandidateId: string
  expectedRuntimePath: string
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

export interface ModelDownloadCommandPlan {
  commandId: string
  modelCandidateId: string
  commandString: string
  executionMode: 'text_only'
  requiresFutureExecutionFlag: true
  futureExecutionFlag: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD'
  safeToRunNow: false
  doesNotDo: string[]
  warnings: string[]
}

export interface ModelWeightManifestRecord {
  modelWeightManifestId: string
  toolId: string
  modelName: string
  modelVersion: string
  resolvedRevision?: string
  source: string
  sourceUrl: string
  expectedPath: string
  stagingStoragePath: string
  license: string
  commercialUseAllowed: boolean
  redistributionAllowed: boolean
  requiresAttribution: boolean
  reviewStatus: ModelApprovalReviewStatus
  productionStatus: 'production_blocked'
  externalBetaStatus: 'blocked'
  paidProductionStatus: 'blocked'
  riskNotes: string[]
  checksum: 'missing_until_download' | string
  fileCount?: number
  totalSizeBytes?: number
  downloadedAt?: string
  uploadedAt?: string
  gcsManifestPath?: string
  createdAt: string
  reviewedAt: string
  approvedFor: string[]
}

export interface ModelApprovalPhase27Readiness {
  readyForGpuDeploy: false
  optionalForTinySpeechCaption: boolean
  blockers: string[]
  warnings: string[]
}

export interface ModelApprovalPhase28Readiness {
  readyForPlanning: boolean
  readyForExecution: boolean
  blockers: string[]
  warnings: string[]
}

export interface ModelApprovalReport {
  reportId: string
  createdAt: string
  approvedModels: ModelWeightManifestRecord[]
  blockedModels: ModelWeightManifestRecord[]
  evaluatedOnlyModels: ModelCandidateRecord[]
  evidenceSummary: ModelLicenseEvidence[]
  storagePlan: ModelStoragePlan
  downloadCommandPlan: ModelDownloadCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase27Readiness: ModelApprovalPhase27Readiness
  phase28Readiness: ModelApprovalPhase28Readiness
  modelDownloadExecuted: boolean
  providerExecuted: false
  gpuDeployed: false
  realUserMediaProcessed: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
