import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'
import type {
  GoNoGoArtifact,
  GoNoGoSourceAudit,
  OwnerHandoffPromptPacket,
  WorkstreamGoNoGoDecision,
  WorkstreamId,
} from '../controlled-internal-test-go-no-go'

export type { WorkstreamId }

export type CrossWorkstreamHandoffStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type Phase52IReadiness = 'ready_for_owner_response_intake_update' | 'pause_pending_owner_responses' | 'blocked'
export type OwnerResponseStatus = 'pending' | 'accepted' | 'accepted_with_blockers' | 'blocked' | 'rejected' | 'superseded' | 'needs_clarification'

export interface CrossWorkstreamHandoffConfig {
  phase: '52H'
  mode: 'cross_workstream_handoff_tracking_owner_response_intake'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  canonicalPhase52GRunId: 'phase52g-20260606T033152'
  canonicalPhase52GCommit: 'f2cce03'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-agents/phase52h'
  branch: 'codex/rp-activation-52h-cross-workstream-handoff-tracking'
  baseBranch: 'codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch'
}

export interface CrossWorkstreamHandoffSafetyFlags extends SupabaseMilestoneSyncPolicy {
  repoAuditRequired: true
  handoffTrackingAllowed: true
  ownerResponseIntakeAllowed: true
  ownerPromptExecutionAllowed: false
  toolRuntimeAllowed: false
  workerExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  mapRenderingAllowed: false
  browserCaptureAllowed: false
  approvedPlanSnapshotExecutionAllowed: false
  crossTrackHandoffGenerationAllowed: true
  supabaseMilestoneSyncAllowed: true
  supabaseWritesLimitedToPhase52H: true
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  schemaChangesAllowed: false
}

export interface CrossWorkstreamSourceAudit extends Omit<GoNoGoSourceAudit, 'auditId'> {
  auditId: 'phase52h_repo_ownership_audit'
  duplicateHandoffTrackingImplementationDetected: boolean
  phase52GBaseCrossChatDocsPresent: false
  phase52HCreatesCrossChatDocs: boolean
}

export interface CrossWorkstreamEvidenceContext {
  evidenceId: 'phase52h_cross_workstream_handoff_evidence'
  phase52GRunId: 'phase52g-20260606T033152'
  phase52GPr: 219
  phase52GStatus: 'completed'
  phase52GQa: 'passed'
  phase52GSupabaseSync: 'completed'
  phase52HReadinessFromPhase52G: 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake'
  phase52GArtifactPrefixes: {
    generatedAssets: string
    qaArtifacts: string
  }
  workstreamDecisions: WorkstreamGoNoGoDecision[]
  ownerPromptPackets: OwnerHandoffPromptPacket[]
  blockers: string[]
  warnings: string[]
}

export interface OwnerResponseSchema {
  schemaId: 'phase52h_owner_response_schema'
  requiredFields: string[]
  allowedStatuses: OwnerResponseStatus[]
  blockedBooleanDefaults: {
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadMediaAllowed: false
    publicArtifactAllowed: false
    rawPromptExecutionAllowed: false
    signedUrlSourceOfTruthAllowed: false
  }
  notes: string[]
}

export interface OwnerPromptPacketReference {
  workstream: WorkstreamId
  owner: string
  packetId: string
  fileName: string
  gcsPath: string
  summary: string
  nextRequiredResponse: string
  prohibitedActions: string[]
  responseTemplatePath: string
  supabaseRefs: string[]
}

export interface OwnerResponseRecord {
  responseId: string
  workstream: WorkstreamId
  ownerChat: string
  sourcePhase: '52G'
  sourceRunId: 'phase52g-20260606T033152'
  handoffPacketRef: string
  responseStatus: OwnerResponseStatus
  ownerDecision: string
  acceptedScope: string[]
  blockedScope: string[]
  nextPrompt: string
  evidenceRefs: string[]
  blockers: string[]
  risks: string[]
  contractsChanged: false
  supabaseUpdateClassification: {
    updateRequired: 'milestone_status_only' | 'owner_response_pending'
    updateStatus: 'ready_for_staging_review' | 'applied_to_staging_after_phase52h_sync'
    environmentTouched: 'staging'
    sqlExecuted: false
    migrationDeployed: false
    nextSupabaseAction: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  publicArtifactAllowed: false
  rawPromptExecutionAllowed: false
  signedUrlSourceOfTruthAllowed: false
  createdAt: string
  updatedAt: string
}

export interface OwnerResponseLedger {
  ledgerId: 'phase52h_owner_response_tracking_ledger'
  runId: string
  sourceRunId: 'phase52g-20260606T033152'
  records: OwnerResponseRecord[]
  pendingResponses: WorkstreamId[]
  acceptedResponses: WorkstreamId[]
  blockedResponses: WorkstreamId[]
  acceptedWithBlockersResponses: WorkstreamId[]
  notes: string[]
}

export interface OwnerResponseTemplate {
  templateId: 'phase52h_owner_response_template'
  format: 'json'
  fields: Record<string, unknown>
  instructions: string[]
  prohibitedActions: string[]
}

export interface OwnerResponseIntakeInstructions {
  instructionsId: 'phase52h_owner_response_intake_instructions'
  responseSubmissionMode: 'private_artifact_or_follow_up_prompt'
  requiredOwnerActions: string[]
  prohibitedOwnerActions: string[]
  validationExpectations: string[]
  phase52IHandling: string[]
}

export interface CrossWorkstreamHandoffManifest {
  manifestId: 'phase52h_cross_workstream_handoff_tracking_manifest'
  runId: string
  phase: '52H'
  repoOwnershipAudit: CrossWorkstreamSourceAudit
  ownerResponseSchema: OwnerResponseSchema
  ownerResponseLedger: OwnerResponseLedger
  ownerPromptPacketRefs: OwnerPromptPacketReference[]
  pendingResponses: WorkstreamId[]
  acceptedResponses: WorkstreamId[]
  blockedResponses: WorkstreamId[]
  responseIntakeInstructions: OwnerResponseIntakeInstructions
  supabaseMilestoneRefs: string[]
  blockedFeatures: string[]
  warnings: string[]
  blockers: string[]
  phase52IReadiness: Phase52IReadiness
}

export interface CrossWorkstreamQaGate {
  gateId:
    | 'source_of_truth_repo_audit'
    | 'phase52g_evidence'
    | 'owner_response_schema'
    | 'owner_response_ledger'
    | 'owner_prompt_references'
    | 'owner_response_statuses'
    | 'handoff_tracking_policy'
    | 'source_of_truth_policy'
    | 'supabase_milestone_sync'
    | 'blocked_features'
  passed: boolean
  mandatory: true
  summary: string
}

export interface CrossWorkstreamQaSummary {
  status: 'passed' | 'blocked'
  gates: CrossWorkstreamQaGate[]
  blockers: string[]
  warnings: string[]
}

export type CrossWorkstreamArtifact = GoNoGoArtifact

export interface CrossWorkstreamSupabaseSyncResult {
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

export interface CrossWorkstreamCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_handoff_tracking_artifact_upload_and_single_milestone_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noOwnerPromptExecution: true
  noToolRuntimeExecution: true
  noWorkerExecution: true
  noProviderCalls: true
  noMigrations: true
  noHistoricalBackfill: true
}

export interface CrossWorkstreamIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    phase52HOnly: true
    migrationsAllowed: false
    schemaChangesAllowed: false
    productRowWritesAllowed: false
    historicalBackfillAllowed: false
  }
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  blockedRoles: string[]
}

export interface CrossWorkstreamExecutionReport {
  ok: boolean
  phase: '52H'
  runId: string
  createdAt: string
  status: Exclude<CrossWorkstreamHandoffStatus, 'planned'>
  repoOwnershipAudit: CrossWorkstreamSourceAudit
  evidenceContext: CrossWorkstreamEvidenceContext
  ownerResponseSchema: OwnerResponseSchema
  ownerResponseTemplate: OwnerResponseTemplate
  ownerPromptPacketRefs: OwnerPromptPacketReference[]
  ownerResponseLedger: OwnerResponseLedger
  responseIntakeInstructions: OwnerResponseIntakeInstructions
  intakeManifest: CrossWorkstreamHandoffManifest
  syncInput: ActivationMilestoneSyncInput
  milestoneBundle: SupabaseMilestoneBundle
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncResult: CrossWorkstreamSupabaseSyncResult
  commandPlan: CrossWorkstreamCommandPlan
  iamPlan: CrossWorkstreamIamPlan
  qa: CrossWorkstreamQaSummary
  artifacts: CrossWorkstreamArtifact[]
  phase52IReadiness: Phase52IReadiness
  blockers: string[]
  warnings: string[]
}

export interface CrossWorkstreamReport extends Omit<CrossWorkstreamExecutionReport, 'ok' | 'status' | 'runId' | 'createdAt' | 'schemaVerification' | 'artifacts'> {
  reportId: 'activation-phase-52h-cross-workstream-handoff-tracking'
  createdAt: string
  status: CrossWorkstreamHandoffStatus
  runId: string
  schemaVerification?: SupabaseRegistrySchemaVerification
  artifacts: CrossWorkstreamArtifact[]
  executionReport?: CrossWorkstreamExecutionReport
}
