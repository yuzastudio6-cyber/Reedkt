import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'

export type ProviderModelApprovalStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type ProviderModelApprovalReadiness = 'ready_for_provider_fixture_adapters_normalizers' | 'blocked'

export interface ProviderModelApprovalConfig {
  phase: 'PROVIDER-1'
  mode: 'deepseek_qwen_api_approval_policy'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  provider0EvidenceBranch: 'codex/rp-provider-0-provider-gateway-models-repo-audit'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-provider-gateway/provider1'
  branch: 'codex/rp-provider-1-deepseek-qwen-api-approval-policy'
  baseBranch: 'codex/rp-provider-0-provider-gateway-models-repo-audit'
}

export interface ProviderModelApprovalSafetyFlags extends SupabaseMilestoneSyncPolicy {
  providerModelApprovalPolicyAllowed: true
  policyOnlyAllowed: true
  deepSeekProviderCallsAllowed: false
  qwenProviderCallsAllowed: false
  providerSecretsAddedAllowed: false
  providerSecretValueReadsAllowed: false
  toolExecutionAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  browserCaptureAllowed: false
  mapRenderingAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  sqlExecutionAllowed: false
  schemaChangesAllowed: false
  supabaseWritesLimitedToProvider1Milestone: boolean
}

export interface ProviderApprovalEvidence {
  evidenceId: string
  provider: 'deepseek' | 'qwen'
  sourceName: string
  sourceUrl: string
  sourceType: 'official_docs'
  observedFacts: string[]
  policyImpact: string
  reverifyBeforeLiveValidation: true
}

export interface ProviderRoleApproval {
  roleId: 'deepseek_v4_pro_coding_specialist' | 'deepseek_v4_flash_coding_fallback' | 'qwen_3_7_max_head_planning_agent'
  provider: 'deepseek' | 'qwen'
  providerModelIds: string[]
  status: 'approved_policy_only' | 'recorded_future_candidate'
  intendedRole: string
  allowedOutputs: string[]
  blockedActions: string[]
  storagePolicy: string
}

export interface ProviderSecretPolicy {
  policyId: 'provider1_secret_policy'
  deepSeekSecretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME'
  deepSeekProviderKeySemantics: 'DEEPSEEK_API_KEY'
  qwenSecretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME'
  qwenProviderKeySemantics: 'DASHSCOPE_API_KEY'
  alternateQwenEnvNameRecorded: 'QWEN_API_KEY'
  allowedStorage: string[]
  blockedStorage: string[]
  secretManagerOnly: true
  backendProviderGatewayOnly: true
  frontendExposureAllowed: false
  secretValuesResolvedInProvider1: false
  secretManagerMetadataCheckedInProvider1: false
}

export interface ProviderDataPolicy {
  policyId: 'provider1_data_policy'
  qwenAllowedData: string[]
  qwenBlockedData: string[]
  deepSeekAllowedData: string[]
  deepSeekBlockedData: string[]
  globalBlockedData: string[]
  rawProviderPayloadStorageAllowed: false
  signedUrlSourceOfTruthAllowed: false
}

export interface ProviderCostPolicy {
  policyId: 'provider1_cost_policy'
  provider1BudgetUsd: 0
  providerCallsBlockedByDefault: true
  liveValidationDefaults: {
    maxCallsPerPhase: 1
    retryLimit: 0
    timeoutMs: 60000
    automaticFallbackAllowed: false
    productionPaidCallsAllowed: false
    sanitizedSummaryStorageOnly: true
    officialPricingRecheckRequired: true
  }
  futureControls: string[]
}

export interface ProviderRoutingPolicy {
  policyId: 'provider1_routing_policy'
  qwenAllowedRole: 'head_editing_planning_decision_agent_candidate'
  deepSeekAllowedRole: 'coding_spec_tool_implementation_proposal_specialist'
  qwenCanExecuteToolsOrWorkers: false
  deepSeekCanExecuteCodeOrTools: false
  providerChainingAllowed: false
  rawPromptExecutionAllowed: false
  workerExecutionSource: 'approved_plan_snapshots_only'
  gatewayEnforcement: string[]
}

export interface ProviderStoragePolicy {
  policyId: 'provider1_storage_policy'
  supabaseAllowed: string[]
  gcsAllowed: string[]
  blockedStorage: string[]
  privateGcsOnly: true
  publicArtifactsAllowed: false
  signedUrlsAsSourceOfTruthAllowed: false
}

export interface ProviderRiskRegisterItem {
  riskId: string
  severity: 'medium' | 'high' | 'critical'
  risk: string
  mitigation: string
  ownerWorkstream: string
}

export interface ProviderNextPhasePlanItem {
  phaseId: 'PROVIDER-2' | 'PROVIDER-3' | 'PROVIDER-4' | 'PROVIDER-5' | 'PROVIDER-6'
  name: string
  scope: string
  allowed: string[]
  blocked: string[]
  readinessRequired: string[]
}

export interface ProviderNextPhasePlan {
  roadmapId: 'provider1_next_phase_plan'
  provider2Readiness: ProviderModelApprovalReadiness
  items: ProviderNextPhasePlanItem[]
}

export interface ProviderModelApprovalManifest {
  manifestId: 'provider1_provider_model_approval_manifest'
  runId: string
  phase: 'PROVIDER-1'
  provider0EvidenceBranch: ProviderModelApprovalConfig['provider0EvidenceBranch']
  evidence: ProviderApprovalEvidence[]
  roleApprovals: ProviderRoleApproval[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  routingPolicy: ProviderRoutingPolicy
  storagePolicy: ProviderStoragePolicy
  riskRegister: ProviderRiskRegisterItem[]
  nextPhasePlan: ProviderNextPhasePlan
  crossChatOwnershipCheck: ProviderOwnershipCheck
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  provider2Readiness: ProviderModelApprovalReadiness
}

export interface ProviderOwnershipCheck {
  owner: 'PROVIDER_GATEWAY_MODELS'
  relatedWorkstreams: string[]
  explicitlyNotOwned: string[]
  integrationPoints: string[]
}

export interface ProviderModelApprovalQaGate {
  gateId:
    | 'provider0_evidence'
    | 'model_identity_recorded'
    | 'deepseek_policy_defined'
    | 'qwen_policy_defined'
    | 'secret_policy'
    | 'data_policy'
    | 'cost_policy'
    | 'routing_policy'
    | 'storage_policy'
    | 'blocked_features'
    | 'supabase_milestone_sync'
  passed: boolean
  mandatory: true
  summary: string
}

export interface ProviderModelApprovalQaSummary {
  status: 'passed' | 'blocked'
  gates: ProviderModelApprovalQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ProviderModelApprovalCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noProviderCalls: true
  noRuntimeExecution: true
}

export interface ProviderModelApprovalIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    migrationsAllowed: false
    schemaChangesAllowed: false
    unrelatedRowsAllowed: false
  }
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  providerSecretPlan: Array<{
    secretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME' | 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME'
    providerKeySemantics: 'DEEPSEEK_API_KEY' | 'DASHSCOPE_API_KEY'
    status: 'reference_name_recorded_only_not_created_or_read_in_provider1'
  }>
  blockedRoles: string[]
}

export interface ProviderModelApprovalArtifact {
  artifactId: string
  artifactType: string
  localPath?: string
  gcsUri: string
  sha256: string
  privateArtifact: true
}

export interface ProviderModelApprovalSupabaseSyncResult {
  status: 'completed' | 'blocked' | 'not_attempted'
  schemaPresent: boolean
  inputValidated: boolean
  bundleValidated: boolean
  milestoneWrite: SupabaseMilestoneWriteVerification
  activationRunReadback: boolean
  writesLimitedToMilestoneRegistry: true
  migrationsApplied: false
  schemaChangesApplied: false
  historicalBackfillRerun: false
  unrelatedSupabaseRowsWritten: false
  blockers: string[]
  warnings: string[]
}

export interface ProviderModelApprovalExecutionReport {
  ok: boolean
  phase: 'PROVIDER-1'
  runId: string
  createdAt: string
  status: ProviderModelApprovalStatus
  evidence: ProviderApprovalEvidence[]
  roleApprovals: ProviderRoleApproval[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  routingPolicy: ProviderRoutingPolicy
  storagePolicy: ProviderStoragePolicy
  riskRegister: ProviderRiskRegisterItem[]
  nextPhasePlan: ProviderNextPhasePlan
  crossChatOwnershipCheck: ProviderOwnershipCheck
  manifest: ProviderModelApprovalManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: ProviderModelApprovalSupabaseSyncResult
  commandPlan: ProviderModelApprovalCommandPlan
  iamPlan: ProviderModelApprovalIamPlan
  qa: ProviderModelApprovalQaSummary
  artifacts: ProviderModelApprovalArtifact[]
  provider2Readiness: ProviderModelApprovalReadiness
  blockers: string[]
  warnings: string[]
}

export interface ProviderModelApprovalReport extends Omit<ProviderModelApprovalExecutionReport, 'ok' | 'createdAt' | 'schemaVerification'> {
  reportId: 'activation-provider-1-deepseek-qwen-api-approval-policy'
  createdAt: string
  schemaVerification?: SupabaseRegistrySchemaVerification
  executionReport?: ProviderModelApprovalExecutionReport
}

export interface ProviderModelApprovalRunnerInput {
  execute: boolean
  runId?: string
}

export interface ProviderModelApprovalSupabaseReadbackInput {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}
