export type WorkerRuntimeAuditStatus = 'passed' | 'blocked' | 'not_attempted'

export type WorkerRuntimeAuditDecision =
  | 'worker_runtime_repo_audit_passed_ready_for_worker1_dry_run'
  | 'blocked_missing_plan_snapshot_evidence'
  | 'blocked_missing_worker_schema_contracts'
  | 'blocked_unsafe_runtime_execution_flags'
  | 'blocked_private_artifact_upload_failed'
  | 'not_attempted'

export type WorkerRuntimeAuditArea =
  | 'source_of_truth'
  | 'worker_schema'
  | 'approved_plan_intake'
  | 'worker_claim_lease'
  | 'private_artifact_scope'
  | 'job_event_log'
  | 'gap_map'
  | 'worker1_next_phase'

export interface WorkerRuntimePathCheck {
  path: string
  exists: boolean
  required: boolean
  purpose: string
}

export interface WorkerRuntimeFactCheck {
  name: string
  status: 'present' | 'missing' | 'not_required'
  source: string
  required: boolean
  notes?: string
}

export interface WorkerRuntimeSourceAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  sourcePr: number
  sourceRunId: string
  sourceDecision: string
  sourceEvidenceStatus: string
  planSnapshotExecutionStatus: string
  planSnapshotApprovedForRuntime: boolean
  candidatePlanId: string
  ownerRouteCount: number
  evidenceFiles: WorkerRuntimePathCheck[]
  supabaseMilestoneSync: WorkerRuntimeSupabaseSyncStatus
  activeBlockers: string[]
}

export interface WorkerSchemaAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  migrations: WorkerRuntimePathCheck[]
  requiredTables: WorkerRuntimeFactCheck[]
  requiredFunctions: WorkerRuntimeFactCheck[]
  rlsAndGrantSignals: WorkerRuntimeFactCheck[]
  workerSchemaReadiness: 'present_for_audit' | 'blocked_missing_required_contracts'
  activeBlockers: string[]
}

export interface ApprovedPlanIntakeAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  sourcePlanSnapshotRunId: string
  candidateContractCompatibleForReview: boolean
  runtimeApproved: false
  intakeContracts: WorkerRuntimePathCheck[]
  serviceBoundaries: WorkerRuntimeFactCheck[]
  requiredWorkerSnapshotFields: WorkerRuntimeFactCheck[]
  activeBlockers: string[]
}

export interface WorkerClaimLeaseAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  claimExecutionStatus: 'blocked_until_future_transactional_backend_runtime'
  mockLocalBoundaryPresent: boolean
  serviceRoleBoundaryPresent: boolean
  transactionRpcRaceWindowTodosPresent: boolean
  files: WorkerRuntimePathCheck[]
  serviceSignals: WorkerRuntimeFactCheck[]
  futureRuntimeBlockers: string[]
  activeBlockers: string[]
}

export interface WorkerArtifactScopeAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  privateGcsRefsOnly: boolean
  signedUrlsSourceOfTruth: false
  publicArtifactsAllowed: false
  artifactContracts: WorkerRuntimePathCheck[]
  storageSignals: WorkerRuntimeFactCheck[]
  activeBlockers: string[]
}

export interface WorkerEventLogAudit {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  eventLogReadiness: 'present_for_future_dry_run' | 'blocked_missing_event_log_contracts'
  eventLogContracts: WorkerRuntimePathCheck[]
  requiredEventTables: WorkerRuntimeFactCheck[]
  serviceSignals: WorkerRuntimeFactCheck[]
  activeBlockers: string[]
}

export interface WorkerRuntimeGap {
  id: string
  area: WorkerRuntimeAuditArea
  severity: 'future_blocker' | 'dry_run_constraint' | 'documentation'
  status: 'bounded_for_worker1_dry_run' | 'must_resolve_before_real_runtime' | 'documented'
  description: string
  worker1Handling: string
}

export interface WorkerRuntimeGapMap {
  phase: 'WORKER_0'
  status: WorkerRuntimeAuditStatus
  worker1Readiness: 'ready for approved-plan snapshot dry-run' | 'blocked'
  gaps: WorkerRuntimeGap[]
  activeBlockers: string[]
}

export interface WorkerRuntimeNextPhasePlan {
  phase: 'WORKER_1'
  title: 'Approved-plan snapshot worker dry-run'
  readiness: 'ready for approved-plan snapshot dry-run' | 'blocked'
  allowedActions: string[]
  blockedActions: string[]
  requiredInputs: string[]
  successCriteria: string[]
  supersedingApprovalRequiredForRealRuntime: boolean
}

export interface WorkerRuntimeSupabaseSyncStatus {
  requested: boolean
  status: 'not_attempted_current_branch_missing_sync_layer'
  syncLayerPresent: false
  sqlExecuted: false
  migrationDeployed: false
  unrelatedRowsWritten: false
  syncLayerDirectoryPresent: boolean
}

export interface WorkerRuntimeSafetyFlags {
  workerExecution: false
  toolExecution: false
  providerCalls: false
  routeExecution: false
  runtimeExecution: false
  mediaProcessing: false
  browserMapWeb: false
  sqlMigrationsSchemaRls: false
  supabaseProductRows: false
  publicArtifacts: false
  signedUrls: false
  rawPrompts: false
  rawProviderResponses: false
  production: false
  externalBeta: false
  broadMedia: false
}

export interface WorkerRuntimeArtifactUploadStatus {
  status: 'not_attempted' | 'uploaded' | 'blocked_private_artifact_upload_failed'
  generatedPrefix: string
  qaPrefix: string
  artifacts?: Array<Record<string, unknown>>
  blocker?: string
  publicArtifacts: false
  signedUrls: false
  rawPromptPayloadsStored: false
  rawProviderResponsesStored: false
  secretPayloadsStored: false
}

export interface WorkerRuntimeJobsAuditQa {
  phase: 'WORKER_0'
  runId: string
  status: WorkerRuntimeAuditStatus
  decision: WorkerRuntimeAuditDecision
  gates: Record<string, unknown>
  safetyFlags: WorkerRuntimeSafetyFlags
  passed: boolean
}

export interface WorkerRuntimeJobsAuditManifest {
  phase: 'WORKER_0'
  runId: string
  reportDir: string
  branch: string
  baseBranch: string
  generatedArtifactPrefix: string
  qaArtifactPrefix: string
  expectedGeneratedArtifacts: readonly string[]
  expectedQaArtifacts: readonly string[]
  privateArtifactUpload: WorkerRuntimeArtifactUploadStatus
  supabaseMilestoneSync: WorkerRuntimeSupabaseSyncStatus
  safetyFlags: WorkerRuntimeSafetyFlags
}

export interface WorkerRuntimeJobsAuditReportBundle {
  sourceAudit: WorkerRuntimeSourceAudit
  workerSchemaAudit: WorkerSchemaAudit
  approvedPlanIntakeAudit: ApprovedPlanIntakeAudit
  workerClaimLeaseAudit: WorkerClaimLeaseAudit
  workerArtifactScopeAudit: WorkerArtifactScopeAudit
  workerEventLogAudit: WorkerEventLogAudit
  gapMap: WorkerRuntimeGapMap
  nextPhasePlan: WorkerRuntimeNextPhasePlan
  manifest: WorkerRuntimeJobsAuditManifest
  qa: WorkerRuntimeJobsAuditQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
}
