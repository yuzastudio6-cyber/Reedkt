export type ToolRouteMetadataDryRunDecision =
  | 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval'
  | 'blocked_pending_fixture_validation'
  | 'blocked_pending_owner_coverage_validation'
  | 'blocked_pending_route_metadata_resolution'
  | 'blocked_pending_artifact_scope_validation'
  | 'blocked_pending_fail_closed_validation'
  | 'blocked_pending_observability_cost_audit'
  | 'rejected_due_runtime_safety_risk'

export type ToolRouteOwnerId =
  | 'WEB_SEARCH_CAPTURE'
  | 'MAP_GEOSPATIAL'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SOUND_MUSIC_AUDIO'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'

export type ToolRouteLifecycleState =
  | 'received'
  | 'fixture_validated'
  | 'owner_study_validated'
  | 'route_metadata_resolved'
  | 'artifact_scope_validated'
  | 'execution_blocked'
  | 'no_op_completed'
  | 'failed_closed'

export type ToolRouteBooleanFlags = Record<
  | 'routeExecutionAllowed'
  | 'runtimeExecutionAllowed'
  | 'toolExecutionAllowed'
  | 'workerExecutionAllowed'
  | 'providerExecutionAllowed'
  | 'mediaProcessingAllowed'
  | 'audioProcessingAllowed'
  | 'renderExecutionAllowed'
  | 'exportExecutionAllowed'
  | 'imageGenerationAllowed'
  | 'imageEditingAllowed'
  | 'browserCaptureAllowed'
  | 'mapRenderingAllowed'
  | 'supabaseWritesAllowed'
  | 'sqlAllowed'
  | 'gcsUploadAllowed'
  | 'publicArtifactsAllowed'
  | 'signedUrlsAsSourceOfTruthAllowed'
  | 'dependencyMutationAllowed'
  | 'rawPromptExecutionAllowed'
  | 'externalBetaUnlockAllowed'
  | 'paidProductionUnlockAllowed'
  | 'productionUnlockAllowed'
  | 'githubPrMergeAllowed'
  | 'secretPayloadAccessed'
  | 'secretPayloadPrinted'
  | 'secretPayloadCommitted',
  boolean
>

export interface ToolRouteApprovalFixture {
  fixtureId: string
  fixtureClass: 'valid' | 'invalid'
  owner: ToolRouteOwnerId | 'UNKNOWN'
  inputKind: string
  expectedOutcome: 'accepted_metadata_only' | 'failed_closed'
  approvedPlanSnapshotRef: string | null
  privatePlaceholderRefs: string[]
  flags: ToolRouteBooleanFlags
  blockedReasons: string[]
}

export interface ToolRouteDiagnosticResult {
  command: string
  status: 'passed' | 'blocked' | 'missing_script'
  exitCode: number | null
  summary: string
}

export interface ToolRoutePrEvidence {
  number: number
  title: string
  state: string
  mergedAt: string | null
  isDraft: boolean
  baseRefName: string
  headRefName: string
  headRefOid: string
  mergeStateStatus?: string
  url: string
}

export interface ToolRouteMetadataDryRunReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preExecutionRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  fixtureValidation: Record<string, unknown>
  ownerCoverageValidation: Record<string, unknown>
  metadataResolution: Record<string, unknown>
  artifactScopeValidation: Record<string, unknown>
  lifecycleSimulation: Record<string, unknown>
  failClosedValidation: Record<string, unknown>
  observabilityCostAudit: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
