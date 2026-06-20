import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'
import type { WorkstreamId } from '../controlled-internal-test-go-no-go'

export type { WorkstreamId }

export type RuntimeUnlockStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type Phase53BReadiness = 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' | 'blocked'
export type RuntimeUnlockStageId =
  | 'blocked'
  | 'owner_accepted'
  | 'repo_audit_passed'
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'
  | 'staging_fixture_passed'
  | 'controlled_private_sample_passed'
  | 'internal_beta_candidate'
  | 'external_beta_candidate'
  | 'production_candidate'

export interface RuntimeUnlockConfig {
  phase: '53A'
  mode: 'runtime_unlock_roadmap_owner_acceptance_audit'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52HRunId: 'phase52h-20260606T130257'
  canonicalPhase52HCommit: '03680b3'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-runtime-unlock/phase53a'
  branch: 'codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit'
  baseBranch: 'codex/rp-activation-52h-cross-workstream-handoff-tracking'
}

export interface RuntimeUnlockSafetyFlags extends SupabaseMilestoneSyncPolicy {
  runtimeUnlockRoadmapAllowed: true
  ownerAcceptanceAuditAllowed: true
  ownerRepoAuditPromptGenerationAllowed: true
  toolRuntimeAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  providerCallsAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  browserCaptureAllowed: false
  mapRenderingAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  sqlExecutionAllowed: false
  schemaChangesAllowed: false
  supabaseWritesLimitedToPhase53A: true
}

export interface RuntimeUnlockSourceAudit {
  auditId: 'phase53a_repo_ownership_audit'
  phase52HRunId: 'phase52h-20260606T130257'
  phase52HEvidencePresent: boolean
  phase52HStatus: 'completed' | 'missing'
  phase52HSupabaseSync: 'completed' | 'unknown'
  requiredContracts: Record<string, boolean>
  optionalFoundationDocs: Record<string, boolean>
  ownershipFindings: string[]
  duplicateRuntimeUnlockImplementationDetected: boolean
  blockers: string[]
  warnings: string[]
}

export interface RuntimeUnlockLadderStage {
  stageIndex: number
  stageId: RuntimeUnlockStageId
  displayName: string
  exitCriteria: string[]
  maySkip: false
}

export interface RuntimeUnlockLadder {
  ladderId: 'phase53a_runtime_unlock_ladder'
  stages: RuntimeUnlockLadderStage[]
  noStageSkippingWithoutExplicitPolicyAndQa: true
}

export interface BlockedScopeRule {
  scope: string
  blockedByDefault: true
  unlockPath: string
  permanentPolicy?: string
}

export interface RuntimeUnlockBlockedScopePolicy {
  policyId: 'phase53a_blocked_scope_policy'
  rules: BlockedScopeRule[]
  rawPromptExecutionPolicy: 'blocked_as_direct_execution_forever'
  approvedPlanSnapshotExecutionPolicy: 'replacement_path_only_after_later_owner_runtime_gates'
  signedUrlSourceOfTruthPolicy: 'blocked_forever'
  signedUrlTemporaryAccessPolicy: 'future_temporary_access_link_only_not_source_of_truth'
}

export interface OwnerAcceptanceMatrixRow {
  workstream: WorkstreamId
  owner: string
  currentStatusFromPhase52H: 'pending_owner_response' | 'accepted_partial_with_blockers'
  currentUnlockStage: RuntimeUnlockStageId
  unlockableScopes: string[]
  blockedScopes: string[]
  nextRequiredPrompt: string
  repoAuditPromptName: string
  acceptanceCriteria: string[]
  prohibitedActions: string[]
  supabaseUpdateClassification: {
    updateRequired: 'staging_update_candidate'
    updateStatus: 'ready_for_staging_review'
    environmentTouched: 'staging'
    sqlExecuted: false
    migrationDeployed: false
    nextSupabaseAction: 'milestone sync only through Phase 51D contract'
  }
  evidenceRequired: string[]
}

export interface OwnerAcceptanceMatrix {
  matrixId: 'phase53a_owner_acceptance_matrix'
  rows: OwnerAcceptanceMatrixRow[]
  pendingOwners: WorkstreamId[]
  acceptedPartialWithBlockersOwners: WorkstreamId[]
}

export interface OwnerAcceptanceChecklist {
  checklistId: 'phase53a_owner_acceptance_checklist'
  requiredItems: string[]
  phase53BHandling: string[]
}

export interface OwnerRepoAuditPrompt {
  promptId: string
  title: string
  workstream: WorkstreamId
  owner: string
  crossChatOwnershipCheck: string[]
  filesAndContractsToInspect: string[]
  noImplementationUntilAudit: true
  blockedScopes: string[]
  supabaseClassification: OwnerAcceptanceMatrixRow['supabaseUpdateClassification']
  finalResponseFormat: string[]
}

export interface RuntimeUnlockRisk {
  riskId: string
  category: string
  risk: string
  ownerWorkstreams: WorkstreamId[]
  mitigation: string
  blocksExternalBetaOrProduction: boolean
}

export interface RuntimeUnlockRiskRegister {
  registerId: 'phase53a_runtime_unlock_risk_register'
  risks: RuntimeUnlockRisk[]
}

export interface RuntimeUnlockRoadmap {
  roadmapId: 'phase53a_runtime_unlock_roadmap'
  purpose: string
  ladder: RuntimeUnlockLadder
  ownerAcceptanceMatrix: OwnerAcceptanceMatrix
  blockedScopePolicy: RuntimeUnlockBlockedScopePolicy
  phase53BReadiness: Phase53BReadiness
}

export interface RuntimeUnlockManifest {
  manifestId: 'phase53a_runtime_unlock_roadmap_manifest'
  runId: string
  phase: '53A'
  sourceAudit: RuntimeUnlockSourceAudit
  roadmap: RuntimeUnlockRoadmap
  ownerAcceptanceChecklist: OwnerAcceptanceChecklist
  ownerRepoAuditPrompts: OwnerRepoAuditPrompt[]
  riskRegister: RuntimeUnlockRiskRegister
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase53BReadiness: Phase53BReadiness
}

export interface RuntimeUnlockQaGate {
  gateId:
    | 'source_of_truth_repo_audit'
    | 'phase52h_evidence'
    | 'unlock_ladder_defined'
    | 'blocked_scope_policy'
    | 'owner_acceptance_matrix'
    | 'owner_repo_audit_prompts'
    | 'raw_prompt_execution_policy'
    | 'signed_url_source_of_truth_policy'
    | 'supabase_milestone_sync'
    | 'blocked_features'
  passed: boolean
  mandatory: true
  summary: string
}

export interface RuntimeUnlockQaSummary {
  status: 'passed' | 'blocked'
  gates: RuntimeUnlockQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface RuntimeUnlockArtifact {
  artifactId: string
  artifactType: string
  localPath?: string
  gcsUri: string
  sha256: string
  privateArtifact: true
}

export interface RuntimeUnlockSupabaseSyncResult {
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

export interface RuntimeUnlockCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noRuntimeExecution: true
}

export interface RuntimeUnlockIamPlan {
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
  blockedRoles: string[]
}

export interface RuntimeUnlockExecutionReport {
  ok: boolean
  phase: '53A'
  runId: string
  createdAt: string
  status: RuntimeUnlockStatus
  sourceAudit: RuntimeUnlockSourceAudit
  ladder: RuntimeUnlockLadder
  blockedScopePolicy: RuntimeUnlockBlockedScopePolicy
  ownerAcceptanceMatrix: OwnerAcceptanceMatrix
  ownerAcceptanceChecklist: OwnerAcceptanceChecklist
  ownerRepoAuditPrompts: OwnerRepoAuditPrompt[]
  riskRegister: RuntimeUnlockRiskRegister
  roadmap: RuntimeUnlockRoadmap
  manifest: RuntimeUnlockManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: RuntimeUnlockSupabaseSyncResult
  commandPlan: RuntimeUnlockCommandPlan
  iamPlan: RuntimeUnlockIamPlan
  qa: RuntimeUnlockQaSummary
  artifacts: RuntimeUnlockArtifact[]
  phase53BReadiness: Phase53BReadiness
  blockers: string[]
  warnings: string[]
}

export interface RuntimeUnlockReport extends Omit<RuntimeUnlockExecutionReport, 'ok' | 'createdAt' | 'schemaVerification'> {
  reportId: 'activation-phase-53a-runtime-unlock-roadmap'
  createdAt: string
  schemaVerification?: SupabaseRegistrySchemaVerification
  executionReport?: RuntimeUnlockExecutionReport
}

export interface RuntimeUnlockRunnerInput {
  execute: boolean
  runId?: string
}

export interface RuntimeUnlockSupabaseReadbackInput {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}
