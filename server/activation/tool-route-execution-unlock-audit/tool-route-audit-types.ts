export type ToolRouteAuditStatus = 'passed' | 'blocked' | 'not_attempted'

export type ToolRouteAuditDecision =
  | 'tool_route_execution_unlock_audit_passed_ready_for_route_dry_run_planning'
  | 'blocked_missing_source_evidence'
  | 'blocked_route_mapping_incomplete'
  | 'blocked_tool_study_prerequisites_missing'
  | 'blocked_unsafe_execution_scope'
  | 'not_attempted'

export type ToolRouteEvidenceSummary = {
  runId: string
  status: string
  decision: string
  readiness?: string
  candidatePlanId?: string
}

export type ToolRouteSourceFile = {
  path: string
  exists: boolean
  required: boolean
  purpose: string
}

export type ToolRouteSourceAudit = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  sourceEvidence: {
    worker1: ToolRouteEvidenceSummary
    worker0: ToolRouteEvidenceSummary
    planSnapshot1: ToolRouteEvidenceSummary
    modelDryRun1: ToolRouteEvidenceSummary
  }
  sourceFiles: ToolRouteSourceFile[]
  absentOptionalTrees: ToolRouteSourceFile[]
  currentBranch: string
  baseBranch: string
  prStack: Array<{
    pr: number
    title: string
    expectedRunId: string
  }>
  supabaseUpdateClassification: ToolRouteSupabaseClassification
  activeBlockers: string[]
}

export type WorkerDryRunRouteResolution = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  sourceWorkerRunId: string
  sourceBatchId: string
  sourcePlanId: string
  dryRunOnly: boolean
  approvedForRuntime: boolean
  routeReviews: ToolRouteResolvedReview[]
  dependencyCount: number
  activeBlockers: string[]
}

export type ToolRouteResolvedReview = {
  jobId: string
  jobType: string
  sourceRefs: string[]
  worker1OwnerRoute: string
  routeLabel: string
  primaryRouteFamilyId: ToolRouteFamilyId
  relatedRouteFamilyIds: ToolRouteFamilyId[]
  executionAllowed: false
  toolStudyRequiredBeforeExecution: boolean
  ownerAcceptanceRequired: boolean
}

export type ToolRouteFamilyId =
  | 'provider_model_planning'
  | 'track_a_render_export'
  | 'track_b_media_audio_model'
  | 'ai_tools_creative_graphics'
  | 'map_geospatial'
  | 'web_search_capture'
  | 'sound_music_audio'
  | 'supabase_metadata_storage'
  | 'public_artifact_signed_url_delivery'
  | 'billing_credits'
  | 'observability_audit_cost'
  | 'compliance_security'
  | 'worker_runtime_jobs'
  | 'frontend_product_ux'

export type ToolRouteFamily = {
  familyId: ToolRouteFamilyId
  label: string
  owner: string
  sourceEvidence: string[]
  toolStudy0Required: boolean
  capabilityRoutingRequiredBeforeExecution: true
  ownerAcceptanceRequired: true
  routeExecutionAllowed: false
  runtimeReady: false
  currentStatus: 'mapped_blocked' | 'mapped_review_only'
}

export type ToolRouteFamilyMap = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  families: ToolRouteFamily[]
  routeFamilyCount: number
  allFamiliesMapped: boolean
  activeBlockers: string[]
}

export type ToolStudyPrerequisite = {
  owner: string
  routeFamilyIds: ToolRouteFamilyId[]
  status: 'missing_required_tool_study_0' | 'prompt_created_for_tool_study_0' | 'prerequisite_recorded_no_file_requested'
  promptPath?: string
  executionAllowedBeforeToolStudy: false
  requiredBeforeExecution: true
}

export type ToolStudyPrerequisiteMap = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  prerequisites: ToolStudyPrerequisite[]
  missingToolStudyCount: number
  promptCreatedCount: number
  activeBlockers: string[]
}

export type ToolRouteBlockedUse = {
  blockedUseId: string
  owner: string
  blocked: true
  executionAllowed: false
  reason: string
}

export type ToolRouteBlockedUseRegister = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  blockedUses: ToolRouteBlockedUse[]
  allExecutionBlocked: boolean
  activeBlockers: string[]
}

export type ToolStudyOwnerPrompt = {
  owner: string
  path: string
  title: string
  ownedTools: string[]
  explicitlyNotOwned: string[]
  relatedWorkstreams: string[]
  allowedScope: string[]
  blockedScope: string[]
  requiredDocs: string[]
  diagnostics: string[]
  validation: string[]
  finalResponseFormat: string[]
  body: string
}

export type ToolStudyOwnerPromptMap = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  prompts: ToolStudyOwnerPrompt[]
  promptCount: number
  activeBlockers: string[]
}

export type ToolRouteGap = {
  gapId: string
  owner: string
  status: 'blocked_until_tool_study_0' | 'blocked_until_owner_acceptance' | 'blocked_until_future_runtime_approval'
  nextAction: string
}

export type ToolRouteGapMap = {
  phase: 'TOOL_ROUTE_0'
  status: ToolRouteAuditStatus
  gaps: ToolRouteGap[]
  toolRoute1Readiness: 'ready for route dry-run planning' | 'blocked'
  activeBlockers: string[]
}

export type ToolRouteNextPhasePlan = {
  phase: 'TOOL_ROUTE_0'
  nextPhase: 'TOOL_ROUTE_1'
  readiness: 'ready for route dry-run planning' | 'blocked'
  requiredBeforeExecution: string[]
  blockedScope: string[]
}

export type ToolRouteSupabaseClassification = {
  updateRequired: 'docs/status only'
  updateStatus: 'docs_only'
  environmentTouched: 'none'
  sqlExecuted: 'none'
  migrationDeployed: 'no'
  evidenceDocs: string[]
  blockers: string[]
  nextSupabaseAction: 'none'
}

export type ToolRouteSafetyFlags = {
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
}

export type ToolRouteAuditQa = {
  phase: 'TOOL_ROUTE_0'
  runId: string
  status: ToolRouteAuditStatus
  decision: ToolRouteAuditDecision
  gates: Record<string, unknown>
  safetyFlags: ToolRouteSafetyFlags
  passed: boolean
}

export type ToolRouteAuditBundle = {
  sourceAudit: ToolRouteSourceAudit
  routeResolution: WorkerDryRunRouteResolution
  familyMap: ToolRouteFamilyMap
  prerequisiteMap: ToolStudyPrerequisiteMap
  blockedUseRegister: ToolRouteBlockedUseRegister
  ownerPromptMap: ToolStudyOwnerPromptMap
  gapMap: ToolRouteGapMap
  nextPhasePlan: ToolRouteNextPhasePlan
  qa: ToolRouteAuditQa
  report: Record<string, unknown>
  summary: Record<string, unknown>
  docs: Record<string, string>
  activeBlockers: string[]
}
