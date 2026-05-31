export type VlmCandidateId =
  | 'qwen3_vl_8b_instruct'
  | 'qwen3_vl_family'
  | 'vllm'
  | 'transformers'
  | 'qwen_vl_utils'

export type VlmSourceType = 'github' | 'huggingface' | 'docs' | 'pypi' | 'runtime_docs'
export type VlmEvidenceConfidence = 'high' | 'medium' | 'low'
export type VlmApprovalDecision = 'staging_planning_approved'
export type VlmPhase39BReadinessStatus = 'ready_for_exact_revision_and_file_selection'
export type VlmFutureReadinessStatus =
  | 'blocked_until_phase39b_private_model_assets'
  | 'blocked_until_phase39c_generated_runtime'
  | 'blocked_until_phase39d_controlled_real_frame'

export interface VlmSourceEvidence {
  evidenceId: string
  sourceName: string
  sourceUrl: string
  sourceType: VlmSourceType
  claim: string
  evidenceSummary: string
  reviewedAt: string
  confidence: VlmEvidenceConfidence
  notes: string[]
}

export interface VlmCandidateRecord {
  candidateId: VlmCandidateId
  displayName: string
  modelId?: 'Qwen/Qwen3-VL-8B-Instruct'
  family?: 'Qwen3-VL'
  role: string
  runtimeRole: 'primary_runtime_candidate' | 'fallback_runtime_planning' | 'model_family' | 'model_candidate' | 'utility_dependency'
  taskScope: string[]
  firstReeditProScope: string[]
  sourceUrls: string[]
  licenseName: string
  reviewStatus: 'staging_approved_for_track_b_planning' | 'planning_only' | 'blocked_until_exact_revision_selected'
  downloadStatus: 'blocked_until_phase39b' | 'not_applicable'
  runtimeStatus: 'blocked_until_phase39c' | 'planning_only'
  noDownloadInPhase39A: true
  noRuntimeInPhase39A: true
  noMediaProcessingInPhase39A: true
  evidence: VlmSourceEvidence[]
}

export interface VlmLicenseEvidenceRecord {
  candidateId: VlmCandidateId
  packageOrModelName: string
  licenseIdentified: boolean
  licenseName: string
  commercialUseClaim: true | false | 'requires_human_review'
  redistributionClaim: true | false | 'requires_human_review'
  modelAssetLicenseClear: true | 'deferred_until_exact_revision_selected' | 'not_applicable'
  humanLegalReviewRequiredBeforePhase39B: boolean
  evidenceRequired: string[]
  notes: string[]
}

export interface VlmRuntimeSupportEvidence {
  runtimeId: 'vllm' | 'transformers'
  runtimeName: string
  role: 'primary' | 'fallback_planning_only'
  qwen3VlSupported: boolean | 'supported_by_model_definition_only'
  minVersionEvidence: string
  localPathRequired: true
  defaultExternalDownloadRisk: true
  gpuRequiredForPracticalRuntime: boolean | 'expected_for_vllm'
  cpuOnlyPlanningAllowed: boolean
  evidence: VlmSourceEvidence[]
  blockers: string[]
  warnings: string[]
}

export interface VlmModelApprovalPolicy {
  phase: '39A'
  track: 'B'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPlanningScope: 'track_b_vlm_model_runtime_approval_planning'
  phase39BPlanningAllowed: true
  phase39CPlanningAllowed: true
  phase39DPlanningAllowed: true
  phase39EPlanningAllowed: true
  modelDownloadAllowed: false
  tokenizerDownloadAllowed: false
  processorDownloadAllowed: false
  runtimeExecutionAllowed: false
  vllmExecutionAllowed: false
  transformersExecutionAllowed: false
  sglangExecutionAllowed: false
  gpuJobAllowed: false
  mediaProcessingAllowed: false
  imageProcessingAllowed: false
  videoProcessingAllowed: false
  arbitraryFileProcessingAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  gcpMutationAllowed: false
  iamMutationAllowed: false
  cloudRunDeployAllowed: false
  dockerBuildPushAllowed: false
  trackAExecutionAllowed: false
  productionReadyAllowed: false
  internalBetaAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}

export interface VlmStoragePlan {
  storagePlanId: string
  futurePhase: '39B'
  baseStagingPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/<revision>/'
  privateStorageRequired: true
  sourceMediaBucketAllowed: false
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  committedToGitAllowed: false
  exactRevisionRequiredBeforeDownload: true
  exactFileManifestRequiredBeforeDownload: true
  checksumRequiredAfterDownload: true
  noRuntimeAutoDownloadRequired: true
  expectedAssetClasses: string[]
  notes: string[]
}

export interface VlmHandoffPlan {
  planId: string
  futurePhase: '39B' | '39C' | '39D' | '39E'
  description: string
  executionMode: 'text_only'
  safeToRunNow: false
  executableCommand: null
  requiresFutureApproval: true
  requiredConfirmations: string[]
  privateArtifactPrefix?: string
  blockedReason: string
  allowedOnlyAfter: string[]
  stillBlocked: string[]
  warnings: string[]
}

export interface VlmGeneratedFixturePlan {
  planId: string
  futurePhase: '39C'
  fixtureIds: string[]
  requiredOutputFormat: 'json_only'
  boundedPromptTemplatesRequired: true
  realMediaAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  qaMetrics: string[]
  blockers: string[]
  warnings: string[]
}

export interface VlmControlledRealFramePlan {
  planId: string
  futurePhase: '39D'
  approvedSampleCount: 1
  selectedSamplePolicy: 'one_approved_private_controlled_frame_or_bounded_sample_only'
  frameCount: 'decided_by_phase39d_gate'
  sourceMediaBytesAllowedInPhase39A: false
  comparisonInputs: string[]
  blockers: string[]
  warnings: string[]
}

export interface VlmToolPlanningIntegrationPlan {
  planId: string
  futurePhase: '39E'
  integrationMode: 'structured_planning_hints_only'
  directToolExecutionAllowed: false
  rawPromptExecutionAllowed: false
  userFacingProductionAllowed: false
  lowConfidenceAutomaticActionsAllowed: false
  allowedHintTypes: string[]
  blockedHintTypes: string[]
  handoffNotes: string[]
}

export interface VlmPrivacySecurityPolicyReport {
  reportId: string
  metadataOnly: true
  privateArtifactsOnly: true
  publicArtifactPathsAllowed: false
  signedUrlsAllowed: false
  credentialsOrSecretsAllowed: false
  mediaBytesAllowed: false
  modelBytesAllowed: false
  generatedReportsSafeToCommit: true
  blockedInputs: string[]
  retentionNotes: string[]
}

export interface VlmGpuCostRiskReport {
  reportId: string
  gpuRuntimeApprovedNow: false
  likelyGpuNeed: 'high'
  candidateRuntime: 'vLLM'
  risks: Array<{
    riskId: string
    severity: 'blocker' | 'warning'
    currentStatus: string
    mitigation: string
    evidenceRequiredToClear: string
  }>
}

export interface VlmApprovalBlockerReport {
  reportId: string
  blockers: string[]
  warnings: string[]
  blockedScopes: string[]
  requiredHumanReviews: string[]
}

export interface VlmArtifactManifestRecord {
  artifactName: string
  reportKey: keyof VlmModelApprovalArtifacts
  safeToCommit: true
  containsModelBytes: false
  containsMediaBytes: false
  containsSecrets: false
  containsSignedUrls: false
  description: string
}

export interface VlmPrivateArtifactManifest {
  manifestId: 'phase39a_vlm_model_approval_metadata_manifest'
  createdAt: string
  artifactCount: number
  localOnly: true
  gcsUploadAllowed: false
  artifacts: VlmArtifactManifestRecord[]
}

export interface VlmReadiness {
  ready: boolean
  nextPhase: string
  status: VlmPhase39BReadinessStatus | VlmFutureReadinessStatus
  blockers: string[]
  criteria: string[]
}

export interface VlmModelApprovalPlan {
  phase: '39A'
  track: 'B'
  reportId: 'phase_39a_vlm_model_approval_plan'
  createdAt: string
  approvalDecision: VlmApprovalDecision
  candidateModel: 'Qwen/Qwen3-VL-8B-Instruct'
  candidateFamily: 'Qwen3-VL'
  runtimeCandidate: 'vLLM'
  fallbackRuntimePlanningOnly: 'local Transformers'
  expectedArtifacts: string[]
  futureSequence: Array<'39B' | '39C' | '39D' | '39E'>
  blockedScopes: string[]
  safety: {
    metadataOnly: true
    modelDownloadExecuted: false
    tokenizerDownloadExecuted: false
    processorDownloadExecuted: false
    runtimeExecuted: false
    mediaProcessed: false
    gpuJobExecuted: false
    gcpMutated: false
    trackATouched: false
    betaAllowed: false
    productionAllowed: false
  }
}

export interface VlmModelApprovalArtifacts {
  plan: VlmModelApprovalPlan
  candidateRegistry: VlmCandidateRecord[]
  sourceEvidence: VlmSourceEvidence[]
  licenseEvidence: VlmLicenseEvidenceRecord[]
  runtimeSupportEvidence: VlmRuntimeSupportEvidence[]
  storagePlan: VlmStoragePlan
  downloadHandoffPlan: VlmHandoffPlan[]
  runtimeHandoffPlan: VlmHandoffPlan[]
  generatedFixturePlan: VlmGeneratedFixturePlan
  controlledRealFramePlan: VlmControlledRealFramePlan
  toolPlanningIntegrationPlan: VlmToolPlanningIntegrationPlan
  privacySecurityPolicyReport: VlmPrivacySecurityPolicyReport
  gpuCostRiskReport: VlmGpuCostRiskReport
  approvalBlockerReport: VlmApprovalBlockerReport
  privateArtifactManifest: VlmPrivateArtifactManifest
}

export interface VlmModelApprovalReport extends VlmModelApprovalArtifacts {
  phase: '39A'
  track: 'B'
  reportId: 'phase_39a_vlm_model_approval_report'
  createdAt: string
  status: 'staging_planning_approved'
  approvedPlanningScopes: string[]
  blockers: string[]
  warnings: string[]
  phase39BReadiness: VlmReadiness
  phase39CReadiness: VlmReadiness
  phase39DReadiness: VlmReadiness
  phase39EReadiness: VlmReadiness
  modelDownloadAllowed: false
  tokenizerDownloadAllowed: false
  processorDownloadAllowed: false
  runtimeExecutionAllowed: false
  vllmExecutionAllowed: false
  transformersExecutionAllowed: false
  sglangExecutionAllowed: false
  gpuJobAllowed: false
  mediaProcessingAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  gcpMutationAllowed: false
  iamMutationAllowed: false
  cloudRunDeployAllowed: false
  dockerBuildPushAllowed: false
  trackAExecutionAllowed: false
  productionReadyAllowed: false
  internalBetaAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}

export interface VlmModelApprovalRunnerResult {
  report: VlmModelApprovalReport
  localArtifactDir: string
  writtenArtifacts: string[]
}
