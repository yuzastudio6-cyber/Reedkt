import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'

export type ProviderModelsAuditStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type ProviderModelsAuditReadiness = 'ready_for_provider_registry_secret_metadata_fixture' | 'blocked'

export interface ProviderModelsAuditConfig {
  phase: 'PROVIDER-0'
  mode: 'provider_gateway_models_repo_audit'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase53ARunId: 'phase53a-20260606T171318'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-provider-gateway/provider0'
  branch: 'codex/rp-provider-0-provider-gateway-models-repo-audit'
  baseBranch: 'codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit'
}

export interface ProviderModelsAuditSafetyFlags extends SupabaseMilestoneSyncPolicy {
  providerGatewayModelsAuditAllowed: true
  repoAuditOnlyAllowed: true
  deepSeekProviderCallsAllowed: false
  qwenProviderCallsAllowed: false
  providerSecretsAddedAllowed: false
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
  supabaseWritesLimitedToProvider0Milestone: boolean
}

export interface ProviderOfficialEvidence {
  evidenceId: string
  provider: 'deepseek' | 'qwen' | 'reuters_context' | 'supabase_context'
  sourceName: string
  sourceUrl: string
  sourceType: 'official_docs' | 'secondary_reporting' | 'official_changelog'
  observedFacts: string[]
  integrationImpact: string
}

export interface ProviderModelDecision {
  internalModelName: 'qwen_3_7_max' | 'deepseek_v4_pro' | 'deepseek_v4_flash'
  providerModelId: 'qwen3.7-max' | 'deepseek-v4-pro' | 'deepseek-v4-flash'
  pinnedSnapshotCandidates: string[]
  intendedRole: string
  executionStatus: 'audit_only_blocked_for_runtime'
}

export interface ProviderGatewayRepoSurface {
  path: string
  present: boolean
  category: 'required_contract' | 'optional_context' | 'implementation_surface'
  finding: string
}

export interface ProviderGatewayRepoAudit {
  auditId: 'provider0_provider_gateway_repo_audit'
  workstream: 'PROVIDER_GATEWAY_MODELS'
  phase53ARunId: 'phase53a-20260606T171318'
  providerGatewayMockOnly: boolean
  realProviderCallsBlocked: boolean
  providerGatewayRoutesPresent: boolean
  providerGatewayConfigPresent: boolean
  approvedPlanSnapshotRequiredForFutureExecution: boolean
  rawPromptExecutionBlocked: boolean
  signedUrlSourceOfTruthBlocked: boolean
  sourceSurfaces: ProviderGatewayRepoSurface[]
  findings: string[]
  blockers: string[]
  warnings: string[]
}

export interface ProviderSecretPolicy {
  policyId: 'provider0_secret_policy'
  qwenSecretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME'
  qwenProviderKeySemantics: 'DASHSCOPE_API_KEY'
  deepSeekSecretReferenceEnv: 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME'
  deepSeekProviderKeySemantics: 'DEEPSEEK_API_KEY'
  allowedStorage: string[]
  blockedStorage: string[]
  frontendExposureAllowed: false
  secretValuesResolvedInProvider0: false
}

export interface ProviderDataPolicy {
  policyId: 'provider0_data_policy'
  qwenAllowedData: string[]
  deepSeekAllowedData: string[]
  blockedData: string[]
  rawProviderResponseStorageAllowed: false
  signedUrlSourceOfTruthAllowed: false
}

export interface ProviderCostPolicy {
  policyId: 'provider0_cost_policy'
  providerBudgetsDefaultToZero: true
  providerCallsBlockedByDefault: true
  requiredFutureControls: string[]
}

export interface ProviderExecutionPolicy {
  policyId: 'provider0_execution_policy'
  deepSeekCanDirectlyExecuteCode: false
  qwenCanDirectlyExecuteWorkersOrTools: false
  toolCallsAreModelOutputOnly: true
  approvedPlanSnapshotsRequiredBeforeAnyFutureRuntime: true
  runtimeUnlockStageRequiredBeforeExecution: 'repo_audit_passed_or_later_with_explicit_owner_phase'
}

export interface ProviderPhaseRoadmapItem {
  phaseId: string
  name: string
  scope: string
  allowed: string[]
  blocked: string[]
}

export interface ProviderPhaseRoadmap {
  roadmapId: 'provider0_phase_roadmap'
  items: ProviderPhaseRoadmapItem[]
  provider1Readiness: ProviderModelsAuditReadiness
}

export interface ProviderQuestionAnswer {
  questionId: string
  question: string
  answer: string
}

export interface ProviderModelsAuditManifest {
  manifestId: 'provider0_provider_gateway_models_audit_manifest'
  runId: string
  phase: 'PROVIDER-0'
  repoAudit: ProviderGatewayRepoAudit
  evidence: ProviderOfficialEvidence[]
  modelDecisions: ProviderModelDecision[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  executionPolicy: ProviderExecutionPolicy
  phaseRoadmap: ProviderPhaseRoadmap
  answers: ProviderQuestionAnswer[]
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  provider1Readiness: ProviderModelsAuditReadiness
}

export interface ProviderModelsAuditQaGate {
  gateId:
    | 'official_provider_evidence'
    | 'repo_contract_audit'
    | 'model_name_decisions'
    | 'secret_policy'
    | 'data_policy'
    | 'cost_policy'
    | 'execution_policy'
    | 'phase_roadmap'
    | 'supabase_milestone_sync'
    | 'blocked_features'
  passed: boolean
  mandatory: true
  summary: string
}

export interface ProviderModelsAuditQaSummary {
  status: 'passed' | 'blocked'
  gates: ProviderModelsAuditQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ProviderModelsAuditCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noProviderCalls: true
  noRuntimeExecution: true
}

export interface ProviderModelsAuditIamPlan {
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
    secretReferenceEnv: 'GOOGLE_SECRET_QWEN_DASHSCOPE_API_KEY_NAME' | 'GOOGLE_SECRET_DEEPSEEK_API_KEY_NAME'
    status: 'future_metadata_only_not_created_or_read_in_provider0'
  }>
  blockedRoles: string[]
}

export interface ProviderModelsAuditArtifact {
  artifactId: string
  artifactType: string
  localPath?: string
  gcsUri: string
  sha256: string
  privateArtifact: true
}

export interface ProviderModelsAuditSupabaseSyncResult {
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

export interface ProviderModelsAuditExecutionReport {
  ok: boolean
  phase: 'PROVIDER-0'
  runId: string
  createdAt: string
  status: ProviderModelsAuditStatus
  evidence: ProviderOfficialEvidence[]
  repoAudit: ProviderGatewayRepoAudit
  modelDecisions: ProviderModelDecision[]
  secretPolicy: ProviderSecretPolicy
  dataPolicy: ProviderDataPolicy
  costPolicy: ProviderCostPolicy
  executionPolicy: ProviderExecutionPolicy
  phaseRoadmap: ProviderPhaseRoadmap
  answers: ProviderQuestionAnswer[]
  manifest: ProviderModelsAuditManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: ProviderModelsAuditSupabaseSyncResult
  commandPlan: ProviderModelsAuditCommandPlan
  iamPlan: ProviderModelsAuditIamPlan
  qa: ProviderModelsAuditQaSummary
  artifacts: ProviderModelsAuditArtifact[]
  provider1Readiness: ProviderModelsAuditReadiness
  blockers: string[]
  warnings: string[]
}

export interface ProviderModelsAuditReport extends Omit<ProviderModelsAuditExecutionReport, 'ok' | 'createdAt' | 'schemaVerification'> {
  reportId: 'activation-provider-0-provider-gateway-models-audit'
  createdAt: string
  schemaVerification?: SupabaseRegistrySchemaVerification
  executionReport?: ProviderModelsAuditExecutionReport
}

export interface ProviderModelsAuditRunnerInput {
  execute: boolean
  runId?: string
}

export interface ProviderModelsAuditSupabaseReadbackInput {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}
