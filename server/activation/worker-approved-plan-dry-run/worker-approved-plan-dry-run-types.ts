export type WorkerApprovedPlanDryRunStatus = 'passed' | 'blocked' | 'not_attempted'

export type WorkerApprovedPlanDryRunDecision =
  | 'worker_approved_plan_dry_run_passed_ready_for_tool_route_0_unlock_audit'
  | 'blocked_missing_source_evidence'
  | 'blocked_invalid_plan_snapshot'
  | 'blocked_unsafe_dry_run_scope'
  | 'blocked_private_artifact_upload_failed'
  | 'not_attempted'

export interface WorkerDryRunPathCheck {
  path: string
  exists: boolean
  required: boolean
  purpose: string
}

export interface WorkerDryRunSafetyFlags {
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
  paidProduction: false
  broadMedia: false
}

export interface WorkerDryRunSupabaseStatus {
  requested: boolean
  status: 'not_attempted_current_branch_missing_sync_layer'
  syncLayerPresent: false
  syncLayerDirectoryPresent: boolean
  sqlExecuted: false
  migrationDeployed: false
  unrelatedRowsWritten: false
}

export interface WorkerDryRunArtifactUploadStatus {
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

export interface WorkerDryRunSourceAudit {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  worker0: {
    runId: string
    decision: string
    status: string
    worker1Readiness: string
    privateArtifactUploadStatus: string
  }
  planSnapshot1: {
    runId: string
    decision: string
    status: string
    candidatePlanId: string
    executionStatus: string
    approvedForRuntime: boolean
  }
  modelDryRun1: {
    runId: string
    decision: string
    status: string
    planSnapshotContractReady: boolean
  }
  sourceFiles: WorkerDryRunPathCheck[]
  absentOptionalTrees: WorkerDryRunPathCheck[]
  supabaseMilestoneSync: WorkerDryRunSupabaseStatus
  activeBlockers: string[]
}

export interface WorkerDryRunSelectedIntent {
  intentId: string
  routeLabel: string
  ownerRoute: string
  executionAllowed: boolean
  routeExecutionAllowed: boolean
  ownerReviewRequired: boolean
}

export interface WorkerDryRunImplementationProposalRef {
  proposalId: string
  ownerRoute: string
  executionAllowed: boolean
  ownerReviewRequired: boolean
  riskLevel?: string
}

export interface WorkerDryRunOwnerRoute {
  owner: string
  routePurpose: string
  status: string
  executionAllowed: boolean
  runtimeReady: boolean
  requiredBeforeRuntimeApproval: boolean
}

export interface WorkerDryRunCandidateSnapshot {
  planId: string
  executionStatus: string
  approvedForRuntime: boolean
  workerExecutionAllowed: boolean
  toolExecutionAllowed: boolean
  routeExecutionAllowed: boolean
  providerExecutionAllowed: boolean
  publicArtifactAllowed: boolean
  signedUrlSourceOfTruthAllowed: boolean
  rawPromptExecution: boolean
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  broadMediaAllowed: boolean
  selectedIntents: WorkerDryRunSelectedIntent[]
  implementationProposalRefs: WorkerDryRunImplementationProposalRef[]
  ownerRoutes: WorkerDryRunOwnerRoute[]
  artifactPolicy: Record<string, unknown>
  rollbackPolicy: string[]
  blockedActions: string[]
}

export interface WorkerDryRunEvidenceContext {
  phase: 'WORKER_1'
  sourceWorker0RunId: string
  sourcePlanSnapshotRunId: string
  sourceModelDryRunId: string
  candidatePlanId: string
  candidateSnapshot: WorkerDryRunCandidateSnapshot
  sourceAudit: WorkerDryRunSourceAudit
  rawPromptPayloadsStored: false
  rawProviderResponsesStored: false
  secretPayloadsStored: false
  activeBlockers: string[]
}

export interface WorkerDryRunValidation {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  acceptedForDryRunOnly: boolean
  realWorkerValidationInvoked: false
  requiredFieldsPresent: boolean
  executionFlagsAllFalse: boolean
  activeBlockers: string[]
}

export interface WorkerDryRunJob {
  jobId: string
  jobType:
    | 'snapshot_intake_validation'
    | 'selected_intent_route_review'
    | 'implementation_proposal_review'
    | 'artifact_blocked_route_event_validation'
  ownerRoute: string
  sourceRefs: string[]
  dependencyIds: string[]
  dryRunOnly: true
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  providerCallsAllowed: false
  routeExecutionAllowed: false
  approvedForRuntime: false
  status: 'planned_not_executed'
}

export interface WorkerDryRunDependency {
  dependencyId: string
  jobId: string
  dependsOnJobId: string
  reason: string
  dryRunOnly: true
}

export interface WorkerDryRunArtifactScope {
  scopeId: string
  ownerRoute: string
  gcsPrefix: string
  privateOnly: true
  checksumRequired: true
  manifestRequired: true
  cleanupRollbackRequired: true
  signedUrlSourceOfTruthAllowed: false
  publicArtifactAllowed: false
}

export interface WorkerDryRunAgentRunPlan {
  agentRunId: string
  jobId: string
  agentType: 'worker_runtime_dry_run_validator'
  status: 'planned_not_executed'
  dryRunOnly: true
}

export interface WorkerDryRunEventLogEntry {
  eventId: string
  jobId?: string
  eventType: string
  message: string
  persistToDatabase: false
  dryRunOnly: true
}

export interface WorkerDryRunJobBatchPlan {
  phase: 'WORKER_1'
  batchId: string
  sourcePlanId: string
  jobs: WorkerDryRunJob[]
  dependencies: WorkerDryRunDependency[]
  eventLogPlan: WorkerDryRunEventLogEntry[]
  agentRunPlan: WorkerDryRunAgentRunPlan[]
  artifactScopes: WorkerDryRunArtifactScope[]
  ownerRoutes: WorkerDryRunOwnerRoute[]
  blockedRoutes: string[]
  rollbackPlan: string[]
  idempotencyKey: string
  dryRunOnly: true
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  providerCallsAllowed: false
  routeExecutionAllowed: false
  approvedForRuntime: false
}

export interface WorkerDryRunDependencyPlan {
  phase: 'WORKER_1'
  batchId: string
  dependencies: WorkerDryRunDependency[]
  dependencyCount: number
  allDependenciesDryRunOnly: true
}

export interface WorkerDryRunClaimLeaseResult {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  claimAttempted: false
  simulatedClaim: true
  leaseDurationRecommendation: '15 minutes'
  heartbeatRecommendation: '60 seconds'
  requeuePolicy: string
  staleLeasePolicy: string
  workerIdentityRequirement: string
  serviceAccountRequirement: string
  transactionalRpcRequired: true
  blockerForRealRuntime: 'blocked_until_future_transactional_backend_runtime'
  activeBlockers: string[]
}

export interface WorkerDryRunArtifactScopeValidation {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  privateGsPrefixesOnly: boolean
  noPublicArtifacts: boolean
  noSignedUrlSourceOfTruth: boolean
  manifestRequired: boolean
  checksumRequired: boolean
  cleanupRollbackRequired: boolean
  ownerRouteRequired: boolean
  activeBlockers: string[]
}

export interface WorkerDryRunBlockedRoute {
  routeId: string
  owner: string
  executionAllowed: false
  blockedReason: string
}

export interface WorkerDryRunBlockedRouteValidation {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  blockedRoutes: WorkerDryRunBlockedRoute[]
  allExecutionBlocked: boolean
  activeBlockers: string[]
}

export interface WorkerDryRunEventLogPlan {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  batchId: string
  eventLogPlan: WorkerDryRunEventLogEntry[]
  agentRunPlan: WorkerDryRunAgentRunPlan[]
  persistToDatabase: false
  activeBlockers: string[]
}

export interface WorkerDryRunGap {
  id: string
  area: string
  severity: 'future_blocker' | 'dry_run_constraint' | 'documentation'
  status: 'bounded_for_tool_route_0_audit' | 'must_resolve_before_real_runtime' | 'documented'
  description: string
  nextPhaseHandling: string
}

export interface WorkerDryRunGapMap {
  phase: 'WORKER_1'
  status: WorkerApprovedPlanDryRunStatus
  toolRoute0Readiness: 'ready for tool-route execution unlock audit' | 'blocked'
  gaps: WorkerDryRunGap[]
  activeBlockers: string[]
}

export interface WorkerDryRunNextPhasePlan {
  phase: 'TOOL_ROUTE_0'
  title: 'Tool-route execution unlock audit'
  readiness: 'ready for tool-route execution unlock audit' | 'blocked'
  allowedActions: string[]
  blockedActions: string[]
  requiredInputs: string[]
  successCriteria: string[]
  ownerAcceptanceRequired: true
}

export interface WorkerApprovedPlanDryRunQa {
  phase: 'WORKER_1'
  runId: string
  status: WorkerApprovedPlanDryRunStatus
  decision: WorkerApprovedPlanDryRunDecision
  gates: Record<string, unknown>
  safetyFlags: WorkerDryRunSafetyFlags
  passed: boolean
}

export interface WorkerApprovedPlanDryRunManifest {
  phase: 'WORKER_1'
  runId: string
  reportDir: string
  branch: string
  baseBranch: string
  generatedArtifactPrefix: string
  qaArtifactPrefix: string
  expectedGeneratedArtifacts: readonly string[]
  expectedQaArtifacts: readonly string[]
  privateArtifactUpload: WorkerDryRunArtifactUploadStatus
  supabaseMilestoneSync: WorkerDryRunSupabaseStatus
  safetyFlags: WorkerDryRunSafetyFlags
}

export interface WorkerApprovedPlanDryRunReportBundle {
  sourceAudit: WorkerDryRunSourceAudit
  evidenceContext: WorkerDryRunEvidenceContext
  snapshotValidation: WorkerDryRunValidation
  jobBatchPlan: WorkerDryRunJobBatchPlan
  dependencyPlan: WorkerDryRunDependencyPlan
  simulatedClaimLeaseResult: WorkerDryRunClaimLeaseResult
  artifactScopeValidation: WorkerDryRunArtifactScopeValidation
  blockedRouteValidation: WorkerDryRunBlockedRouteValidation
  eventLogPlan: WorkerDryRunEventLogPlan
  gapMap: WorkerDryRunGapMap
  nextPhasePlan: WorkerDryRunNextPhasePlan
  manifest: WorkerApprovedPlanDryRunManifest
  qa: WorkerApprovedPlanDryRunQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
}
