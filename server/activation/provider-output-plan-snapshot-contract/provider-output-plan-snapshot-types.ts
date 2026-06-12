export type ProviderOutputPlanSnapshotStatus = 'not_attempted' | 'passed' | 'blocked'

export type ProviderOutputPlanSnapshotDecision =
  | 'provider_output_plan_snapshot_contract_passed_ready_for_worker_runtime_audit'
  | 'blocked_missing_provider_dry_run_evidence'
  | 'blocked_provider_dry_run_schema_mismatch'
  | 'blocked_unsafe_execution_flags'
  | 'blocked_missing_owner_routes'
  | 'blocked_private_artifact_upload_failed'
  | 'not_attempted'

export type PlanSnapshotOwnerRoute =
  | 'MODEL_ORCHESTRATION'
  | 'COORDINATOR_PRODUCER_QA'
  | 'WORKER_RUNTIME_JOBS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'MAP_GEOSPATIAL'
  | 'SOUND_MUSIC_AUDIO'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'COMPLIANCE_SECURITY'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'FRONTEND_PRODUCT_UX'
  | 'BILLING_STRIPE_CREDITS'
  | 'PUBLIC_ARTIFACT_SIGNED_URL_POLICY'

export interface ProviderDryRunEvidenceResult {
  caseId: string
  provider: 'qwen_dashscope' | 'deepseek'
  modelId: string
  schemaId: 'plan_snapshot_candidate_v1' | 'agent_findings_v1'
  status: 'passed' | 'blocked'
  normalizedOutput: Record<string, unknown>
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  rawProviderResponseStored: false
  rawProviderResponsePrinted: false
  secretPayloadPrinted: false
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  routeExecutionAllowed: false
  publicArtifactsAllowed: false
  signedUrlsAllowed: false
  rawPromptForwardingAllowed: false
  directMutationAllowed: false
  productionMutationAllowed: false
}

export interface ProviderOutputEvidenceContext {
  phase: 'PLAN_SNAPSHOT_1'
  sourceProviderRunId: 'modeldryrun1-20260612T174538'
  sourceDecision: 'provider_dry_run_passed_ready_for_plan_snapshot_contract' | string
  sourcePlanSnapshotContractReady: boolean
  qwen: ProviderDryRunEvidenceResult | undefined
  deepseek: ProviderDryRunEvidenceResult | undefined
  sourceArtifactRefs: {
    generatedPrefix?: string
    qaPrefix?: string
  }
  sourceReports: Array<{ path: string; present: boolean }>
  rawProviderResponsesStored: false
  rawPromptPayloadsStored: false
  secretPayloadsStored: false
  activeBlockers: string[]
}

export interface SelectedIntent {
  intentId: string
  sourceSchema: 'plan_snapshot_candidate_v1'
  sourceCaseId: string
  routeLabel: string
  selectedReason: string
  ownerRoute: PlanSnapshotOwnerRoute
  executionAllowed: false
  routeExecutionAllowed: false
  ownerReviewRequired: true
}

export interface ImplementationProposalRef {
  proposalId: string
  sourceSchema: 'agent_findings_v1'
  sourceCaseId: string
  finding: string
  riskLevel: 'low' | 'medium' | 'high' | 'unknown'
  ownerRoute: PlanSnapshotOwnerRoute
  executionAllowed: false
  ownerReviewRequired: true
}

export interface OwnerRouteEntry {
  owner: PlanSnapshotOwnerRoute
  routePurpose: string
  source: 'qwen_plan_candidate' | 'deepseek_implementation_findings' | 'policy_required_review'
  status: 'handoff_required' | 'review_required' | 'blocked_future_policy'
  executionAllowed: false
  runtimeReady: false
  requiredBeforeRuntimeApproval: true
}

export interface CandidateApprovedPlanSnapshot {
  planId: string
  planVersion: 1
  sourceProviderRunId: 'modeldryrun1-20260612T174538'
  qwenModel: 'qwen3.7-plus'
  deepseekModel: 'deepseek-v4-flash'
  sourceSchemas: ['plan_snapshot_candidate_v1', 'agent_findings_v1']
  selectedIntents: SelectedIntent[]
  implementationProposalRefs: ImplementationProposalRef[]
  ownerRoutes: OwnerRouteEntry[]
  requiredCapabilities: string[]
  inputArtifactScope: {
    committedSanitizedProviderDryRunReportsOnly: true
    rawProviderResponsesAllowed: false
    rawPromptPayloadsAllowed: false
    secretPayloadsAllowed: false
    mediaPayloadsAllowed: false
  }
  outputArtifactScope: {
    candidatePlanSnapshotJson: true
    privateGcsJsonOnly: true
    publicArtifactsAllowed: false
    signedUrlsAllowed: false
    runtimeDispatchAllowed: false
  }
  artifactPolicy: {
    privateGeneratedPrefix: string
    privateQaPrefix: string
    publicArtifactAllowed: false
    signedUrlSourceOfTruthAllowed: false
    rawPromptStored: false
    rawProviderResponseStored: false
    secretPayloadStored: false
  }
  qaRequirements: string[]
  privacyLimits: string[]
  costLimits: string[]
  runtimeLimits: string[]
  rollbackPolicy: string[]
  blockedActions: string[]
  handoffRequired: true
  nextOwner: 'WORKER_RUNTIME_JOBS'
  supabaseMilestoneSyncPolicy: {
    requested: boolean
    status: 'not_attempted_current_branch_missing_sync_layer'
    syncLayerPresent: false
    sqlExecuted: false
    migrationDeployed: false
    unrelatedRowsWritten: false
  }
  executionStatus: 'candidate_only'
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  routeExecutionAllowed: false
  providerExecutionAllowed: false
  rawPromptExecution: false
  approvedForRuntime: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  requiresWorkerRuntimeOwnerApproval: true
}

export interface PlanSnapshotSchemaValidation {
  phase: 'PLAN_SNAPSHOT_1'
  status: ProviderOutputPlanSnapshotStatus
  requiredFieldsPresent: boolean
  qwenSchemaAccepted: boolean
  deepseekSchemaAccepted: boolean
  sourceProviderRunIdAccepted: boolean
  ownerRoutesComplete: boolean
  activeBlockers: string[]
}

export interface ExecutionBlockValidation {
  phase: 'PLAN_SNAPSHOT_1'
  status: ProviderOutputPlanSnapshotStatus
  allExecutionFlagsFalse: boolean
  approvedForRuntime: false
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  routeExecutionAllowed: false
  providerExecutionAllowed: false
  rawPromptExecution: false
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  shellCommandExecutionInstructions: false
  providerToolWorkerRouteRequests: false
  activeBlockers: string[]
}

export interface WorkerRuntimeHandoff {
  phase: 'PLAN_SNAPSHOT_1'
  status: 'ready_for_worker_runtime_repo_audit' | 'blocked'
  runtimeReady: false
  approvedForRuntime: false
  nextOwner: 'WORKER_RUNTIME_JOBS'
  allowedAction: 'review_candidate_contract_only'
  blockedUntil: string[]
  sourceSnapshotPlanId: string
  executionAllowed: false
}

export interface OwnerReviewHandoff {
  phase: 'PLAN_SNAPSHOT_1'
  status: 'owner_review_required' | 'blocked'
  runtimeReady: false
  ownerRoutes: OwnerRouteEntry[]
  executionAllowed: false
}

export interface ProviderOutputPlanSnapshotQa {
  phase: 'PLAN_SNAPSHOT_1'
  runId: string
  status: ProviderOutputPlanSnapshotStatus
  decision: ProviderOutputPlanSnapshotDecision
  gates: Record<string, unknown>
  passed: boolean
}

export interface ProviderOutputPlanSnapshotReportBundle {
  sourceAudit: Record<string, unknown>
  evidenceContext: ProviderOutputEvidenceContext
  candidateSnapshot: CandidateApprovedPlanSnapshot
  schemaValidation: PlanSnapshotSchemaValidation
  executionBlockValidation: ExecutionBlockValidation
  ownerRouteMap: { phase: 'PLAN_SNAPSHOT_1'; status: ProviderOutputPlanSnapshotStatus; ownerRoutes: OwnerRouteEntry[] }
  workerRuntimeHandoff: WorkerRuntimeHandoff
  ownerReviewHandoff: OwnerReviewHandoff
  manifest: Record<string, unknown>
  qa: ProviderOutputPlanSnapshotQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
}
