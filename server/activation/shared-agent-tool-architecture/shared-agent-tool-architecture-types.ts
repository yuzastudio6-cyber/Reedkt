import type {
  ActivationMilestoneSyncInput,
  SupabaseMilestoneSyncPolicy,
} from '../supabase-milestone-sync'
import type {
  SupabaseMilestoneBundle,
  SupabaseMilestoneWriteVerification,
  SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'

export type SharedAgentToolArchitectureStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type Phase52BReadiness = 'ready_for_tool_capability_registry_audit' | 'blocked'

export type AgentId =
  | 'director'
  | 'editor'
  | 'cinematographer'
  | 'colorist'
  | 'compositor_vfx'
  | 'motion'
  | 'audio'
  | 'search_research'
  | 'map_location'
  | 'graphics_design'
  | 'producer'
  | 'qa_safety'

export type ToolOwnerId = 'this_chat' | 'ai_tools_chat' | 'track_b' | 'track_a_visual_video'

export type SharedAgentToolArchitectureQaGateId =
  | 'agent_roles_defined'
  | 'tool_ownership_defined'
  | 'capability_manifest_schema'
  | 'agent_finding_schema'
  | 'edit_intent_schema'
  | 'approved_plan_snapshot_schema'
  | 'routing_policy'
  | 'source_of_truth_policy'
  | 'cross_track_handoff_template'
  | 'supabase_milestone_sync'
  | 'blocked_features'

export interface SpecialistAgentRole {
  agentId: AgentId
  displayName: string
  purpose: string
  allowedEvidence: string[]
  allowedIntentTypes: string[]
  forbiddenActions: string[]
  ownedDecisions: string[]
  downstreamToolFamilies: string[]
  readinessDependencies: string[]
  cannotExecuteToolsDirectly: true
  cannotAuthorizeRawPromptExecution: true
  structuredFindingsAndIntentsOnly: true
  mustRespectApprovedPlanSnapshotPolicy: true
}

export interface ToolOwnershipGroup {
  ownerId: ToolOwnerId
  displayName: string
  owns: string[]
  consumerNotes: string[]
  forbiddenClaims: string[]
}

export interface ToolOwnershipMap {
  mapId: 'phase52a-tool-ownership-map'
  groups: ToolOwnershipGroup[]
  rules: string[]
}

export interface SchemaDefinition {
  schemaId: string
  description: string
  requiredFields: string[]
  forbiddenFields?: string[]
  requiredDefaults?: Record<string, string | boolean | number>
  examples?: Record<string, unknown>[]
  policyNotes: string[]
}

export interface AgentToolRoutingPolicy {
  policyId: 'phase52a-agent-tool-routing-policy'
  steps: string[]
  constraints: string[]
  ownerRouting: Array<{
    agentId: AgentId
    routesTo: ToolOwnerId | ToolOwnerId[]
    notes: string
  }>
  blockedRoutes: string[]
}

export interface SourceOfTruthPolicy {
  policyId: 'phase52a-artifact-source-of-truth-policy'
  domains: Array<{
    domain: 'video' | 'map_geospatial' | 'web_search' | 'graphics' | 'audio' | 'supabase'
    sourceOfTruth: string[]
    reviewArtifactsOnly: string[]
    rules: string[]
  }>
  signedUrlsSourceOfTruthAllowed: false
  publicArtifactsAllowed: false
}

export interface CrossTrackHandoffTemplate {
  templateId: 'phase52a-cross-track-handoff-template'
  requiredSections: string[]
  rules: string[]
}

export interface SharedAgentToolArchitectureSafetyFlags {
  architectureDocsOnly: true
  privateGcsArtifactUploadAllowed: true
  supabaseMilestoneSyncAllowed: true
  toolRuntimeExecutionAllowed: false
  modelInferenceAllowed: false
  mediaProcessingAllowed: false
  webSearchAllowed: false
  mapRenderingAllowed: false
  browserCaptureAllowed: false
  providerCallsAllowed: false
  gcpMutationAllowed: false
  broadGcpMutationAllowed: false
  cloudRunDeployAllowed: false
  migrationsAllowed: false
  historicalBackfillAllowed: false
  dockerBuildAllowed: false
  rawPromptExecutionAllowed: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface SharedAgentToolArchitectureCommandPlan {
  planId: 'phase52a-shared-agent-tool-architecture-command-plan'
  defaultMode: 'static_report_only'
  executionMode: 'guarded_private_artifact_and_supabase_sync'
  commands: Array<{
    commandId: string
    command: string
    mutating: false | 'guarded_private_artifact_and_milestone_write'
    description: string
  }>
  blockedAlways: string[]
}

export interface SharedAgentToolArchitectureQaGate {
  gateId: SharedAgentToolArchitectureQaGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface SharedAgentToolArchitectureQaSummary {
  status: 'passed' | 'blocked'
  gates: SharedAgentToolArchitectureQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SharedAgentToolArchitectureIamPlan {
  defaultMutationAllowed: false
  storagePlan: Array<{
    bucket: string
    prefix: string
    role: 'roles/storage.objectCreator'
    condition: string
    mutationAllowedByDefault: false
  }>
  supabasePlan: {
    writesAllowedOnlyToMilestoneRegistry: true
    migrationsAllowed: false
    historicalBackfillAllowed: false
    productRowWritesAllowed: false
  }
  secretPlan: Array<{
    secretName: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
    access: 'backend_resolution_only'
    mutationAllowedByDefault: false
  }>
  blockedRoles: string[]
}

export interface SharedAgentToolArchitectureArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SharedAgentToolArchitectureSupabaseSyncResult {
  status: 'completed' | 'blocked'
  inputValidated: boolean
  bundleValidated: boolean
  schemaPresent: boolean
  writeVerification: SupabaseMilestoneWriteVerification
  readbackMatched: boolean
  writesLimitedToMilestoneRegistry: true
  migrationsApplied: false
  historicalBackfillRerun: false
  blockers: string[]
  warnings: string[]
}

export interface SharedAgentToolArchitectureExecutionReport {
  ok: boolean
  phase: '52A'
  runId: string
  createdAt: string
  mode: 'shared_agent_tool_ownership_architecture'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  agentRegistry: SpecialistAgentRole[]
  toolOwnershipMap: ToolOwnershipMap
  capabilityManifestSchema: SchemaDefinition
  agentFindingSchema: SchemaDefinition
  editIntentSchema: SchemaDefinition
  approvedPlanSnapshotSchema: SchemaDefinition
  routingPolicy: AgentToolRoutingPolicy
  sourceOfTruthPolicy: SourceOfTruthPolicy
  crossTrackHandoffTemplate: CrossTrackHandoffTemplate
  commandPlan: SharedAgentToolArchitectureCommandPlan
  iamPlan: SharedAgentToolArchitectureIamPlan
  schemaVerification: SupabaseRegistrySchemaVerification
  supabaseSyncInput: ActivationMilestoneSyncInput
  supabaseMilestoneBundle: SupabaseMilestoneBundle
  supabaseSyncPolicy: SupabaseMilestoneSyncPolicy
  supabaseSyncResult: SharedAgentToolArchitectureSupabaseSyncResult
  qa: SharedAgentToolArchitectureQaSummary
  safetyFlags: SharedAgentToolArchitectureSafetyFlags
  artifacts: SharedAgentToolArchitectureArtifact[]
  phase52BReadiness: Phase52BReadiness
  blockers: string[]
  warnings: string[]
}

export interface SharedAgentToolArchitectureReport {
  reportId: 'activation-phase-52a-shared-agent-tool-architecture'
  createdAt: string
  phase: '52A'
  status: SharedAgentToolArchitectureStatus
  runId: string
  executionReport?: SharedAgentToolArchitectureExecutionReport
  agentRegistry: SpecialistAgentRole[]
  toolOwnershipMap: ToolOwnershipMap
  capabilityManifestSchema: SchemaDefinition
  agentFindingSchema: SchemaDefinition
  editIntentSchema: SchemaDefinition
  approvedPlanSnapshotSchema: SchemaDefinition
  routingPolicy: AgentToolRoutingPolicy
  sourceOfTruthPolicy: SourceOfTruthPolicy
  crossTrackHandoffTemplate: CrossTrackHandoffTemplate
  commandPlan: SharedAgentToolArchitectureCommandPlan
  iamPlan: SharedAgentToolArchitectureIamPlan
  supabaseSyncResult: SharedAgentToolArchitectureSupabaseSyncResult
  qa: SharedAgentToolArchitectureQaSummary
  safetyFlags: SharedAgentToolArchitectureSafetyFlags
  phase52BReadiness: Phase52BReadiness
  blockers: string[]
  warnings: string[]
}
