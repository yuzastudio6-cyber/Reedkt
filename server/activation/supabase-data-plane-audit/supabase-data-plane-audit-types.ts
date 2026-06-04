export type SupabaseDataPlaneAuditStatus = 'planned' | 'completed' | 'partial' | 'blocked'
export type SupabaseDataPlaneAuditMode = 'supabase_data_plane_readonly_audit'
export type RemoteActivityAuditStatus = 'not_attempted' | 'completed' | 'blocked'
export type GapSeverity = 'P0' | 'P1' | 'P2'
export type Phase51BReadiness = 'ready_for_schema_migration_hardening_plan' | 'blocked'

export type SupabaseDataPlaneQaGateId =
  | 'repo_supabase_discovery'
  | 'env_secret_audit'
  | 'migration_schema_audit'
  | 'rls_security_audit'
  | 'runtime_integration_audit'
  | 'remote_activity_audit'
  | 'data_model_gap_analysis'
  | 'beta_readiness_impact'
  | 'blocked_features'

export interface SupabaseDataPlaneAuditConfig {
  phase: '51A'
  mode: SupabaseDataPlaneAuditMode
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  generatedAssetsBucket: string
  qaBucket: string
  artifactPrefixBase: 'activation-supabase/phase51a'
  baseBranch: 'codex/rp-activation-50g-map-geospatial-internal-readiness'
}

export interface SupabaseDataPlaneSafetyFlags {
  readOnlyAuditOnly: true
  migrationsAllowed: false
  sqlMutationAllowed: false
  supabaseLifecycleAllowed: false
  remoteSchemaMutationAllowed: false
  rowWritesAllowed: false
  secretValueLoggingAllowed: false
  signedUrlCreationAllowed: false
  providerCallsAllowed: false
  mediaProcessingAllowed: false
  dockerAllowed: false
  deploymentAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadMediaAllowed: false
}

export interface SupabaseRepoSchemaDiscovery {
  repoRoot: string
  keyPaths: Array<{ path: string; exists: boolean; purpose: string }>
  migrationFiles: string[]
  supabaseConfigTomlPresent: boolean
  packageHasSupabaseJs: boolean
  docsState: 'local_review_ready_only' | 'unknown'
  blockers: string[]
  warnings: string[]
}

export interface SupabaseEnvSecretAudit {
  envKeys: Array<{
    key: string
    configured: boolean
    classification: 'public_anon' | 'server_secret' | 'db_url' | 'project_ref' | 'confirmation' | 'gcp_context'
    mayPrintValue: false
  }>
  frontendServiceRoleReferences: Array<{ path: string; line: number; snippet: string }>
  serverServiceRoleReferences: Array<{ path: string; line: number; snippet: string }>
  secretValueExposureDetected: boolean
  remoteAuditCredentialReady: boolean
  remoteAuditCredentialBlocker?: string
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMigrationTableRecord {
  tableName: string
  migrationFile: string
  hasPrimaryKey: boolean
  hasWorkspaceId: boolean
  hasUserId: boolean
  hasCreatedAt: boolean
  hasUpdatedAt: boolean
}

export interface SupabaseMigrationAudit {
  migrationFileCount: number
  createdTables: SupabaseMigrationTableRecord[]
  enabledRlsTables: string[]
  policyTables: string[]
  policyCount: number
  serviceRoleGrantTables: string[]
  functionNames: string[]
  storagePolicyMentions: string[]
  signedUrlTables: string[]
  remoteMigrationExecutionRecorded: false
  categoriesCovered: Array<{ category: string; tables: string[]; covered: boolean }>
  blockers: string[]
  warnings: string[]
}

export interface SupabaseRlsPolicyAudit {
  rlsEnabledTableCount: number
  policyTableCount: number
  missingRlsTables: string[]
  missingPolicyTables: string[]
  serviceRoleOnlyTables: string[]
  signedUrlValueStorageBlocked: boolean
  storagePoliciesPresent: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseRuntimeIntegrationAudit {
  frontendPublicClient: 'configured_by_vite_env' | 'not_found'
  serverAdminClient: 'service_role_guarded' | 'not_found'
  serverPublicClient: 'anon_guarded' | 'not_found'
  runtimeEnvSummary: {
    supabaseUrlConfigured: boolean
    supabaseAnonKeyConfigured: boolean
    supabaseServiceRoleConfigured: boolean
    mockOnlyLikely: boolean
  }
  tableReferences: Array<{ tableName: string; files: string[] }>
  apiRouteRequiresSupabase: Array<{ routeFile: string; requiresSupabaseCount: number }>
  whyLowOrNoActivity: string[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseRemoteTableActivity {
  tableName: string
  count: number | null
  status: 'counted' | 'blocked'
  reason?: string
}

export interface SupabaseActivityAudit {
  status: RemoteActivityAuditStatus
  attemptedAt?: string
  credentialSource: 'env_service_role' | 'unavailable'
  tablesChecked: SupabaseRemoteTableActivity[]
  rowPayloadStored: false
  dbUrlPrinted: false
  serviceRoleValuePrinted: false
  blockers: string[]
  warnings: string[]
}

export interface SupabaseDataModelGap {
  gapId: string
  severity: GapSeverity
  category:
    | 'user_project_persistence'
    | 'approved_plan_snapshots'
    | 'jobs_workers'
    | 'artifacts_storage'
    | 'signed_url_audit'
    | 'providers_tools'
    | 'rls_security'
    | 'runtime_integration'
    | 'activity_visibility'
  summary: string
  evidence: string[]
  recommendedPhase51BAction: string
}

export interface SupabaseDataModelGapAnalysis {
  gaps: SupabaseDataModelGap[]
  p0Count: number
  canRunLocalSql: boolean
  canProceedToPrompt20B: boolean
  blockers: string[]
  warnings: string[]
}

export interface SupabaseBetaReadinessImpact {
  controlledInternalBetaBlocked: boolean
  reason: string
  p0Blockers: string[]
  phase51BReadiness: Phase51BReadiness
  blockers: string[]
  warnings: string[]
}

export interface SupabaseDataPlaneCommandPlan {
  planId: 'phase51a-supabase-data-plane-command-plan'
  defaultMode: 'static_report_only'
  commands: Array<{
    commandId: string
    description: string
    command: string
    mutating: boolean
    allowedInPhase51A: boolean
  }>
  blockedAlways: string[]
}

export interface SupabaseDataPlaneIamPlan {
  phase: '51A'
  mode: 'report_only'
  defaultMutationAllowed: false
  generatedAssetsPrefix: string
  qaPrefix: string
  conditionalBindingsIfUploadBlocked: Array<{
    role: 'roles/storage.objectCreator'
    bucket: string
    prefixCondition: string
    principal: 'current_authenticated_executor'
  }>
  forbiddenBindings: string[]
}

export interface SupabaseDataPlaneQaGate {
  gateId: SupabaseDataPlaneQaGateId
  severity: 'mandatory'
  passed: boolean
  summary: string
}

export interface SupabaseDataPlaneQaSummary {
  status: 'passed' | 'partial' | 'blocked'
  gates: SupabaseDataPlaneQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface SupabaseDataPlaneArtifact {
  id: string
  kind: 'private_json'
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface SupabaseDataPlaneExecutionReport {
  ok: boolean
  phase: '51A'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  mode: SupabaseDataPlaneAuditMode
  repoDiscovery: SupabaseRepoSchemaDiscovery
  envSecretAudit: SupabaseEnvSecretAudit
  migrationAudit: SupabaseMigrationAudit
  rlsPolicyAudit: SupabaseRlsPolicyAudit
  runtimeIntegrationAudit: SupabaseRuntimeIntegrationAudit
  remoteActivityAudit: SupabaseActivityAudit
  dataModelGapAnalysis: SupabaseDataModelGapAnalysis
  betaReadinessImpact: SupabaseBetaReadinessImpact
  commandPlan: SupabaseDataPlaneCommandPlan
  qa: SupabaseDataPlaneQaSummary
  artifacts: SupabaseDataPlaneArtifact[]
  safetyFlags: SupabaseDataPlaneSafetyFlags
  canRunLocalSql: boolean
  canProceedToPrompt20B: boolean
  phase51BReadiness: Phase51BReadiness
  blockers: string[]
  warnings: string[]
}

export interface SupabaseDataPlaneAuditReport {
  reportId: 'activation-phase-51a-supabase-data-plane-audit'
  createdAt: string
  phase: '51A'
  status: SupabaseDataPlaneAuditStatus
  config: SupabaseDataPlaneAuditConfig
  executionReport?: SupabaseDataPlaneExecutionReport
  repoDiscovery: SupabaseRepoSchemaDiscovery
  envSecretAudit: SupabaseEnvSecretAudit
  migrationAudit: SupabaseMigrationAudit
  rlsPolicyAudit: SupabaseRlsPolicyAudit
  runtimeIntegrationAudit: SupabaseRuntimeIntegrationAudit
  remoteActivityAudit: SupabaseActivityAudit
  dataModelGapAnalysis: SupabaseDataModelGapAnalysis
  betaReadinessImpact: SupabaseBetaReadinessImpact
  commandPlan: SupabaseDataPlaneCommandPlan
  qa: SupabaseDataPlaneQaSummary
  safetyFlags: SupabaseDataPlaneSafetyFlags
  canRunLocalSql: boolean
  canProceedToPrompt20B: boolean
  phase51BReadiness: Phase51BReadiness
  blockers: string[]
  warnings: string[]
}
