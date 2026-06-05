import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncPolicy } from '../supabase-milestone-sync'

export type ToolCapabilityRegistryStatus =
  | 'ready_for_internal_testing'
  | 'ready_for_internal_beta_candidate'
  | 'restricted_internal_ready'
  | 'implemented_but_blocked'
  | 'blocked_pending_model_provenance'
  | 'blocked_pending_runtime_resolution'
  | 'excluded_for_initial_internal_testing'
  | 'future_scoped'
  | 'external_track_owned_pending_manifest'
  | 'evidence_missing'

export type ToolCapabilityTrack =
  | 'track_a_visual_video'
  | 'web_search'
  | 'map_geospatial'
  | 'supabase'
  | 'ai_tools'
  | 'track_b'

export type ToolCapabilityRegistryQaGateId =
  | 'phase52a_evidence'
  | 'capability_schema_compliance'
  | 'track_a_capabilities'
  | 'web_search_capabilities'
  | 'map_geospatial_capabilities'
  | 'supabase_capabilities'
  | 'ai_tools_placeholders'
  | 'track_b_placeholders'
  | 'ownership_boundaries'
  | 'supabase_tool_capability_sync'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface ToolCapabilityEvidenceRef {
  phaseId: string
  runId: string
  evidenceType: 'committed_doc' | 'private_gcs' | 'supabase_milestone' | 'external_track_placeholder'
  reference: string
}

export interface ToolCapabilityRecord {
  manifestVersion: 'phase52b_tool_capability_registry_v1'
  track: ToolCapabilityTrack
  subsystem: string
  toolId: string
  displayName: string
  owner: 'this_chat' | 'track_a' | 'track_b' | 'ai_tools'
  owningTrack: string
  owningChat: 'this_chat' | 'track_a' | 'track_b' | 'ai_tools'
  status: ToolCapabilityRegistryStatus
  internalTestingReady: boolean
  internalBetaCandidateReady: boolean
  productionReady: false
  runtimeExecutionAllowed: false
  frontendExecutionAllowed: false
  providerCallAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptExecutionAllowed: false
  capabilities: string[]
  inputs: string[]
  outputs: string[]
  artifactPolicy: {
    privateGcsOnly: boolean
    sourceOfTruth: string[]
    reviewArtifactsOnly: string[]
    publicArtifactsAllowed: false
    signedUrlsAsSourceOfTruthAllowed: false
  }
  runtimeRequirements: string[]
  dependencyRequirements: string[]
  secretsRequired: string[]
  modelArtifactsRequired: string[]
  privacyConstraints: string[]
  costConstraints: string[]
  failureModes: string[]
  blockedUses: string[]
  allowedConsumers: string[]
  readinessEvidence: ToolCapabilityEvidenceRef[]
  testCommands: string[]
  lastValidatedPhase: string
  lastValidatedRunId: string
  supabaseMilestoneRefs: string[]
  notes: string[]
  blockerReason?: string
  futureRequiredAction?: string
}

export interface ToolCapabilityRegistrySummary {
  totalRecords: number
  byTrack: Record<ToolCapabilityTrack, number>
  byStatus: Record<ToolCapabilityRegistryStatus, number>
  internalTestingReadyCount: number
  internalBetaCandidateReadyCount: number
  productionReadyCount: 0
  duplicateKeys: string[]
}

export interface ToolCapabilityRegistryValidation {
  ok: boolean
  recordCount: number
  summary: ToolCapabilityRegistrySummary
  blockers: string[]
  warnings: string[]
}

export interface ToolCapabilityRegistryQaGate {
  gateId: ToolCapabilityRegistryQaGateId
  passed: boolean
  mandatory: true
  summary: string
}

export interface ToolCapabilityRegistryQaSummary {
  status: 'passed' | 'blocked'
  gates: ToolCapabilityRegistryQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface ToolCapabilityRegistryArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ToolCapabilityRegistrySupabaseSyncResult {
  status: 'completed' | 'blocked' | 'not_attempted'
  schemaPresent: boolean
  inputValidated: boolean
  bundleValidated: boolean
  milestoneWrite: SupabaseMilestoneWriteVerification
  activationRunReadback: boolean
  toolCapabilityReadbackCount: number
  toolCapabilityReadbackExpected: number
  readinessSnapshotReadback: boolean
  migrationsApplied: false
  schemaChangesApplied: false
  blockers: string[]
  warnings: string[]
}

export interface ToolCapabilityRegistryIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    toolCapabilitiesUpsertAllowed: true
    migrationsAllowed: false
    schemaChangesAllowed: false
    productRowWritesAllowed: false
  }
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  blockedRoles: string[]
}

export interface ToolCapabilityRegistryCommandPlan {
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_and_supabase_registry_sync'
  allowedCommands: string[]
  blockedAlways: string[]
  noMigrationCommands: true
  noToolRuntimeExecution: true
}

export interface ToolCapabilityRegistryExecutionReport {
  ok: boolean
  phase: '52B'
  runId: string
  createdAt: string
  status: 'completed' | 'blocked'
  registry: ToolCapabilityRecord[]
  registrySummary: ToolCapabilityRegistrySummary
  validation: ToolCapabilityRegistryValidation
  qa: ToolCapabilityRegistryQaSummary
  commandPlan: ToolCapabilityRegistryCommandPlan
  iamPlan: ToolCapabilityRegistryIamPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncInput: ActivationMilestoneSyncInput
  supabaseMilestoneBundle: SupabaseMilestoneBundle
  supabaseSyncPolicy: SupabaseMilestoneSyncPolicy
  supabaseSyncResult: ToolCapabilityRegistrySupabaseSyncResult
  artifacts: ToolCapabilityRegistryArtifact[]
  safetyFlags: ToolCapabilityRegistrySafetyFlags
  phase52CReadiness: 'ready_for_multi_agent_dry_run_on_existing_evidence' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface ToolCapabilityRegistryReport {
  reportId: 'activation-phase-52b-tool-capability-registry-audit'
  createdAt: string
  phase: '52B'
  status: 'planned' | 'completed' | 'blocked'
  registry: ToolCapabilityRecord[]
  registrySummary: ToolCapabilityRegistrySummary
  validation: ToolCapabilityRegistryValidation
  qa: ToolCapabilityRegistryQaSummary
  commandPlan: ToolCapabilityRegistryCommandPlan
  iamPlan: ToolCapabilityRegistryIamPlan
  executionReport?: ToolCapabilityRegistryExecutionReport
  phase52CReadiness: 'ready_for_multi_agent_dry_run_on_existing_evidence' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface ToolCapabilityRegistrySafetyFlags extends SupabaseMilestoneSyncPolicy {
  registryAuditOnly: true
  privateGcsArtifactUploadAllowed: true
  supabaseToolCapabilitySyncAllowed: true
  toolRuntimeExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  mapRenderingAllowed: false
  browserCaptureAllowed: false
  providerCallsAllowed: false
  dockerBuildAllowed: false
  cloudRunDeployAllowed: false
  migrationsAllowed: false
  schemaChangesAllowed: false
  historicalBackfillAllowed: false
}
