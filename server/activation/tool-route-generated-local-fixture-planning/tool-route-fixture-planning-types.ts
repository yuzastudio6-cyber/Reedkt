export type ToolRouteFixturePlanningStatus = 'passed' | 'blocked' | 'not_attempted'

export type ToolRouteFixturePlanningDecision =
  | 'tool_route_generated_local_fixture_planning_passed_ready_for_tool_route_3_generated_local_fixture_contract_tests'
  | 'blocked_missing_source_evidence'
  | 'blocked_fixture_contract_incomplete'
  | 'blocked_unsafe_execution_scope'
  | 'not_attempted'

export type ToolRouteFixturePlanningExecutionStatus =
  | 'not_attempted'
  | 'completed_local_docs_only'

export type ToolRouteFixtureRouteFamilyId =
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

export type ToolRouteFixtureFamilyId =
  | 'provider_model_planning_fixture'
  | 'worker_runtime_job_planning_fixture'
  | 'web_search_capture_fixture'
  | 'map_geospatial_fixture'
  | 'ai_tools_creative_graphics_fixture'
  | 'track_a_render_export_fixture'
  | 'track_b_media_processing_fixture'
  | 'sound_music_audio_fixture'
  | 'supabase_metadata_storage_fixture'
  | 'observability_audit_cost_fixture'
  | 'compliance_security_fixture'
  | 'frontend_product_ux_fixture'
  | 'billing_stripe_credits_fixture'
  | 'public_artifact_signed_url_delivery_blocked_fixture'

export type ToolRouteFixtureOwner =
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

export type ToolRouteFixtureSafetyFlags = {
  executionAllowed: false
  workerExecutionAllowed: false
  toolExecutionAllowed: false
  providerCallsAllowed: false
  modelCallsAllowed: false
  routeExecutionAllowed: false
  mediaProcessingAllowed: false
  browserCaptureAllowed: false
  mapRenderingAllowed: false
  audioGenerationAllowed: false
  renderExportAllowed: false
  publicArtifactsAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptExecutionAllowed: false
  supabaseMutationAllowed: false
  sqlExecutionAllowed: false
  migrationDeploymentAllowed: false
  googleCloudApiCallsAllowed: false
  secretManagerApiCallsAllowed: false
  gcsStorageTransferAllowed: false
  creditMutationAllowed: false
  stripeProcessingAllowed: false
  internalBetaUnlockAllowed: false
  externalBetaUnlockAllowed: false
  productionUnlockAllowed: false
  dependencyMutationAllowed: false
  finalRenderExportAllowed: false
  broadServiceRoleHandlerAllowed: false
}

export type ToolRouteFixtureSupabaseClassification = {
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

export type ToolRouteFixtureSourceFile = {
  path: string
  exists: boolean
  required: boolean
  purpose: string
  status?: 'present' | 'missing_on_base'
}

export type ToolRouteFixtureEvidenceSummary = {
  runId: string
  status: string
  decision: string
  readiness?: string
  mergeSha?: string
  path?: string
}

export type ToolRouteFixtureSourceAudit = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  baseBranch: string
  currentBranch: string
  sourceEvidence: {
    modelDryRun1: ToolRouteFixtureEvidenceSummary
    planSnapshot1: ToolRouteFixtureEvidenceSummary
    worker0: ToolRouteFixtureEvidenceSummary
    worker1: ToolRouteFixtureEvidenceSummary
    toolRoute0: ToolRouteFixtureEvidenceSummary
    toolRoute1: ToolRouteFixtureEvidenceSummary
    toolStudies: ToolRouteFixtureEvidenceSummary[]
  }
  sourceFiles: ToolRouteFixtureSourceFile[]
  optionalMissingPaths: ToolRouteFixtureSourceFile[]
  prStack: Array<{
    pr: number
    title: string
    mergeSha: string
    expectedRunId?: string
  }>
  supabaseUpdateClassification: ToolRouteFixtureSupabaseClassification
  activeBlockers: string[]
}

export type ToolRoute1EvidenceContext = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  runId: 'toolroute1-20260613T141131'
  decision: string
  readiness: string
  routeFamilyIds: ToolRouteFixtureRouteFamilyId[]
  ownerIds: ToolRouteFixtureOwner[]
  routeFamilyCount: number
  ownerRouteCount: number
  artifactContractCount: number
  qaGateCount: number
  allExecutionBlocked: boolean
  evidencePaths: string[]
  activeBlockers: string[]
}

export type ToolStudyFixtureEvidence = {
  owner: Extract<
    ToolRouteFixtureOwner,
    | 'WEB_SEARCH_CAPTURE'
    | 'MAP_GEOSPATIAL'
    | 'AI_TOOLS_CREATIVE_GRAPHICS'
    | 'TRACK_A_RENDER_EXPORT'
    | 'TRACK_B_MEDIA_PROCESSING'
    | 'SOUND_MUSIC_AUDIO'
  >
  status: ToolRouteFixturePlanningStatus
  mergeSha: string
  sourceContracts: string[]
  capabilityMapPath: string
  routingPolicyPath: string
  handoffContractPath: string
  blockedUseRegisterPath: string
  validationResultsPath: string
  implementationPromptPath: string
  ownerReviewOnly: true
  executionAllowed: false
  activeBlockers: string[]
}

export type ToolStudyFixtureEvidenceContext = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  studies: ToolStudyFixtureEvidence[]
  completedStudyCount: number
  requiredStudyCount: 6
  allRequiredStudiesPresent: boolean
  activeBlockers: string[]
}

export type GeneratedLocalFixture = {
  fixtureId: ToolRouteFixtureFamilyId
  routeFamilyId: ToolRouteFixtureRouteFamilyId
  ownerWorkstream: ToolRouteFixtureOwner
  sourceToolStudyContract: string
  sourceToolRoute1RoutePlan: string
  sourceWorker1JobReference: string[]
  fixturePurpose: string
  syntheticInputOnly: true
  allowedSyntheticInput: string[]
  blockedInput: string[]
  expectedOutputManifest: string
  expectedOutputArtifactContract: string
  sourceOfTruthRule: string
  privateArtifactRule: string
  checksumProvenanceRequirement: string
  qaGates: string[]
  requiredOwnerApproval: 'owner_review_required_before_tool_route_3'
  nextPhase: 'TOOL_ROUTE_3_generated_local_fixture_contract_tests'
  internalBetaBlocker: string
  externalBetaBlocker: string
  productionBlocker: string
  executionFlags: ToolRouteFixtureSafetyFlags
}

export type GeneratedLocalFixtureCatalog = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  fixtures: GeneratedLocalFixture[]
  fixtureCount: number
  allFixturesMapped: boolean
  allInputsSyntheticOnly: boolean
  activeBlockers: string[]
}

export type FixtureInputOutputContract = {
  fixtureId: ToolRouteFixtureFamilyId
  routeFamilyId: ToolRouteFixtureRouteFamilyId
  owner: ToolRouteFixtureOwner
  fixtureInputManifest: string
  expectedOutputManifest: string
  expectedOutputArtifactContract: string
  sourceOfTruthRule: string
  downstreamConsumer: 'TOOL_ROUTE_3_generated_local_fixture_contract_tests'
  checksumProvenanceRequirement: string
  privateArtifactRule: string
  publicArtifactAllowed: false
  signedUrlSourceOfTruthAllowed: false
  rawPromptAllowed: false
  cleanupRollbackRequirement: string
  qaGateList: string[]
}

export type FixtureInputOutputContractMap = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  contracts: FixtureInputOutputContract[]
  contractCount: number
  allContractsPrivateSyntheticOnly: boolean
  activeBlockers: string[]
}

export type OwnerFixtureHandoff = {
  owner: ToolRouteFixtureOwner
  fixtureIds: ToolRouteFixtureFamilyId[]
  sourceContracts: string[]
  responsibilities: string[]
  handoffType: 'review_planning_only'
  ownerApprovalRequired: true
  executionAuthorized: false
  nextAction: string
}

export type OwnerFixtureHandoffMap = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  handoffs: OwnerFixtureHandoff[]
  ownerCount: number
  allRequiredOwnersMapped: boolean
  activeBlockers: string[]
}

export type FixtureQaGate = {
  gateId: string
  status: ToolRouteFixturePlanningStatus
  evidence: string[]
  required: true
}

export type FixtureQaGateMap = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  gates: FixtureQaGate[]
  gateCount: number
  allRequiredGatesPassed: boolean
  activeBlockers: string[]
}

export type FixtureBlockedExecutionValidation = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  blockedCategories: string[]
  safetyFlags: ToolRouteFixtureSafetyFlags
  allExecutionBlocked: true
  noScopeStatement: string
  activeBlockers: string[]
}

export type ToolRouteFixtureGap = {
  gapId: string
  owner: ToolRouteFixtureOwner
  status: 'ready_for_contract_tests' | 'blocked_until_future_phase'
  nextAction: string
}

export type ToolRouteFixtureGapMap = {
  phase: 'TOOL_ROUTE_2'
  status: ToolRouteFixturePlanningStatus
  gaps: ToolRouteFixtureGap[]
  toolRoute3Readiness:
    | 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests'
    | 'blocked'
  activeBlockers: string[]
}

export type ToolRouteFixtureNextPhasePlan = {
  phase: 'TOOL_ROUTE_2'
  nextPhase: 'TOOL_ROUTE_3'
  readiness:
    | 'ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests'
    | 'blocked'
  promptPath: 'docs/implementation-prompts/prompt-tool-route-3-generated-local-fixture-contract-tests.md'
  requiredBeforeExecution: string[]
  blockedScope: string[]
}

export type ToolRouteFixtureQa = {
  phase: 'TOOL_ROUTE_2'
  runId: string
  status: ToolRouteFixturePlanningStatus
  decision: ToolRouteFixturePlanningDecision
  gates: FixtureQaGateMap
  safetyFlags: ToolRouteFixtureSafetyFlags
  passed: boolean
}

export type ToolRouteFixturePlanningBundle = {
  sourceAudit: ToolRouteFixtureSourceAudit
  toolRoute1Evidence: ToolRoute1EvidenceContext
  toolStudyEvidence: ToolStudyFixtureEvidenceContext
  fixtureCatalog: GeneratedLocalFixtureCatalog
  inputOutputContractMap: FixtureInputOutputContractMap
  ownerFixtureHandoffMap: OwnerFixtureHandoffMap
  qaGateMap: FixtureQaGateMap
  blockedExecutionValidation: FixtureBlockedExecutionValidation
  gapMap: ToolRouteFixtureGapMap
  nextPhasePlan: ToolRouteFixtureNextPhasePlan
  qa: ToolRouteFixtureQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
  docs: Record<string, string>
  activeBlockers: string[]
}
