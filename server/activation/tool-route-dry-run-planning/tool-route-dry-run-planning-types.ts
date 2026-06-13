export type ToolRouteDryRunStatus = 'passed' | 'blocked' | 'not_attempted'

export type ToolRouteDryRunDecision =
  | 'tool_route_dry_run_planning_passed_ready_for_tool_route_2_generated_local_fixture_planning'
  | 'blocked_missing_source_evidence'
  | 'blocked_owner_study_contract_incomplete'
  | 'blocked_route_dry_run_contract_incomplete'
  | 'blocked_unsafe_execution_scope'
  | 'not_attempted'

export type ToolRouteDryRunExecutionStatus =
  | 'not_attempted'
  | 'completed_local_docs_only'

export type ToolRouteDryRunFamilyId =
  | 'provider_model_planning'
  | 'worker_runtime_job_planning'
  | 'web_search_capture'
  | 'map_geospatial'
  | 'ai_tools_creative_graphics'
  | 'track_a_render_export'
  | 'track_b_media_processing'
  | 'sound_music_audio'
  | 'supabase_metadata_storage'
  | 'observability_audit_cost'
  | 'compliance_security'
  | 'frontend_product_ux'
  | 'billing_stripe_credits'
  | 'public_artifact_signed_url_delivery_blocked'

export type ToolRouteDryRunOwner =
  | 'WEB_SEARCH_CAPTURE'
  | 'MAP_GEOSPATIAL'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SOUND_MUSIC_AUDIO'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'COMPLIANCE_SECURITY'
  | 'FRONTEND_PRODUCT_UX'
  | 'BILLING_STRIPE_CREDITS'

export type ToolRouteDryRunSafetyFlags = {
  toolExecution: false
  workerExecution: false
  routeExecution: false
  providerModelCalls: false
  mediaProcessing: false
  browserMapWeb: false
  supabaseMutation: false
  sqlMigrationsSchemaRls: false
  googleCloudApiCalls: false
  secretManagerApiCalls: false
  gcsStorageTransfer: false
  publicArtifacts: false
  signedUrls: false
  rawPromptExecution: false
  production: false
  externalBeta: false
  paidProduction: false
  broadMedia: false
  stripeCredits: false
  dependencyMutation: false
  finalRenderExport: false
  audioSfxMusicGeneration: false
  ffmpegFfprobeExecution: false
  demucsRuntime: false
  qwenVlmVllmRuntime: false
}

export type ToolRouteDryRunSupabaseClassification = {
  updateRequired: 'docs/status only'
  updateStatus: 'docs_only'
  environmentTouched: 'none'
  sqlExecuted: 'none'
  migrationDeployed: 'no'
  milestoneSync: 'blocked_current_branch_missing_sync_layer'
  evidenceDocs: string[]
  blockers: string[]
  nextSupabaseAction: 'none'
}

export type ToolRouteDryRunEvidenceSummary = {
  runId: string
  status: string
  decision: string
  mergeSha?: string
  readiness?: string
  candidatePlanId?: string
}

export type ToolRouteDryRunSourceFile = {
  path: string
  exists: boolean
  required: boolean
  purpose: string
}

export type ToolRouteDryRunSourceAudit = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  baseBranch: string
  currentBranch: string
  sourceEvidence: {
    modelDryRun1: ToolRouteDryRunEvidenceSummary
    planSnapshot1: ToolRouteDryRunEvidenceSummary
    worker0: ToolRouteDryRunEvidenceSummary
    worker1: ToolRouteDryRunEvidenceSummary
    toolRoute0: ToolRouteDryRunEvidenceSummary
    toolStudies: ToolRouteDryRunEvidenceSummary[]
  }
  sourceFiles: ToolRouteDryRunSourceFile[]
  absentOptionalTrees: ToolRouteDryRunSourceFile[]
  prStack: Array<{
    pr: number
    title: string
    mergeSha: string
    expectedRunId?: string
  }>
  supabaseUpdateClassification: ToolRouteDryRunSupabaseClassification
  activeBlockers: string[]
}

export type ToolRouteOwnerStudyContract = {
  owner: Extract<
    ToolRouteDryRunOwner,
    | 'WEB_SEARCH_CAPTURE'
    | 'MAP_GEOSPATIAL'
    | 'AI_TOOLS_CREATIVE_GRAPHICS'
    | 'TRACK_A_RENDER_EXPORT'
    | 'TRACK_B_MEDIA_PROCESSING'
    | 'SOUND_MUSIC_AUDIO'
  >
  status: ToolRouteDryRunStatus
  mergeSha: string
  requiredPaths: ToolRouteDryRunSourceFile[]
  capabilityMapPath: string
  routingPolicyPath: string
  handoffContractPath: string
  blockedUseRegisterPath: string
  validationResultsPath: string
  implementationPromptPath: string
  executionAllowed: false
  ownerReviewOnly: true
  activeBlockers: string[]
}

export type ToolRouteOwnerStudyContext = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  studies: ToolRouteOwnerStudyContract[]
  completedStudyCount: number
  requiredStudyCount: 6
  allRequiredStudiesPresent: boolean
  activeBlockers: string[]
}

export type ToolRouteWorkerDryRunContext = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  sourceRunId: 'worker1-20260612T193823'
  batchId: string
  sourcePlanId: string
  jobCount: number
  dependencyCount: number
  routeReviewJobIds: string[]
  workerJobRefs: Record<string, string[]>
  dryRunOnly: boolean
  approvedForRuntime: false
  allExecutionFlagsFalse: boolean
  blockedRouteValidationPath: string
  activeBlockers: string[]
}

export type ToolRouteDryRunFamily = {
  familyId: ToolRouteDryRunFamilyId
  owner: ToolRouteDryRunOwner
  sourceContracts: string[]
  worker1Refs: string[]
  routePurpose: string
  allowedInput: string[]
  blockedInput: string[]
  outputArtifactContract: string
  sourceOfTruthRule: string
  qaGates: string[]
  ownerApproval: 'owner_review_required_before_tool_route_2'
  nextPhase: 'TOOL_ROUTE_2_generated_local_fixture_planning'
  betaProductionBlockers: string[]
  executionFlags: ToolRouteDryRunSafetyFlags
}

export type ToolRouteFamilyDryRunPlan = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  families: ToolRouteDryRunFamily[]
  routeFamilyCount: number
  allFamiliesMapped: boolean
  activeBlockers: string[]
}

export type ToolRouteOwnerRoutePlan = {
  owner: ToolRouteDryRunOwner
  familyIds: ToolRouteDryRunFamilyId[]
  sourceContracts: string[]
  routeResponsibilities: string[]
  reviewOnly: true
  ownerApprovalRequired: true
  runtimeReady: false
  executionAuthorized: false
  nextAction: string
}

export type ToolRouteOwnerRoutePlanMap = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  ownerRoutes: ToolRouteOwnerRoutePlan[]
  ownerRouteCount: number
  allRequiredOwnersMapped: boolean
  activeBlockers: string[]
}

export type ToolRouteArtifactContract = {
  artifactId: string
  familyId: ToolRouteDryRunFamilyId
  owner: ToolRouteDryRunOwner
  contractName: string
  allowedSourceOfTruth: string[]
  blockedSourceOfTruth: string[]
  requiredFields: string[]
  privateOnly: true
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptAllowed: false
  runtimeExecutionRequired: false
}

export type ToolRouteArtifactContractMap = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  artifacts: ToolRouteArtifactContract[]
  artifactContractCount: number
  allContractsPrivatePlanningOnly: boolean
  activeBlockers: string[]
}

export type ToolRouteQaGate = {
  gateId: string
  status: ToolRouteDryRunStatus
  evidence: string[]
  required: true
}

export type ToolRouteQaGateMap = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  gates: ToolRouteQaGate[]
  gateCount: number
  allRequiredGatesPassed: boolean
  activeBlockers: string[]
}

export type ToolRouteBlockedExecutionValidation = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  blockedCategories: string[]
  safetyFlags: ToolRouteDryRunSafetyFlags
  allExecutionBlocked: true
  noScopeStatement: string
  activeBlockers: string[]
}

export type ToolRouteDryRunGap = {
  gapId: string
  owner: ToolRouteDryRunOwner
  status: 'blocked_until_future_phase' | 'ready_for_fixture_planning'
  nextAction: string
}

export type ToolRouteDryRunGapMap = {
  phase: 'TOOL_ROUTE_1'
  status: ToolRouteDryRunStatus
  gaps: ToolRouteDryRunGap[]
  toolRoute2Readiness:
    | 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning'
    | 'blocked'
  activeBlockers: string[]
}

export type ToolRouteDryRunNextPhasePlan = {
  phase: 'TOOL_ROUTE_1'
  nextPhase: 'TOOL_ROUTE_2'
  readiness:
    | 'ready_for_TOOL_ROUTE_2_generated_local_fixture_planning'
    | 'blocked'
  promptPath: 'docs/implementation-prompts/prompt-tool-route-2-generated-local-fixture-planning.md'
  requiredBeforeExecution: string[]
  blockedScope: string[]
}

export type ToolRouteDryRunQa = {
  phase: 'TOOL_ROUTE_1'
  runId: string
  status: ToolRouteDryRunStatus
  decision: ToolRouteDryRunDecision
  gates: ToolRouteQaGateMap
  safetyFlags: ToolRouteDryRunSafetyFlags
  passed: boolean
}

export type ToolRouteDryRunBundle = {
  sourceAudit: ToolRouteDryRunSourceAudit
  ownerStudyContext: ToolRouteOwnerStudyContext
  workerDryRunContext: ToolRouteWorkerDryRunContext
  routeFamilyPlan: ToolRouteFamilyDryRunPlan
  ownerRoutePlan: ToolRouteOwnerRoutePlanMap
  artifactContractMap: ToolRouteArtifactContractMap
  qaGateMap: ToolRouteQaGateMap
  blockedExecutionValidation: ToolRouteBlockedExecutionValidation
  gapMap: ToolRouteDryRunGapMap
  nextPhasePlan: ToolRouteDryRunNextPhasePlan
  qa: ToolRouteDryRunQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
  docs: Record<string, string>
  activeBlockers: string[]
}
