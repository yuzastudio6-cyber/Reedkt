export type ToolRouteApprovalDecision =
  | 'approved_for_future_tool_route_metadata_dry_run_execution'
  | 'blocked_pending_tool_study_source_of_truth'
  | 'blocked_pending_owner_study_diagnostics'
  | 'blocked_pending_route_manifest_review'
  | 'blocked_pending_worker_noop_evidence'
  | 'blocked_pending_artifact_source_of_truth_policy'
  | 'blocked_pending_fail_closed_policy'
  | 'rejected_due_runtime_safety_risk'

export type ToolRouteOwnerId =
  | 'WEB_SEARCH_CAPTURE'
  | 'MAP_GEOSPATIAL'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SOUND_MUSIC_AUDIO'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'

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

export interface ToolRoutePrEvidence {
  number: number
  title: string
  state: string
  mergedAt: string | null
  isDraft: boolean
  baseRefName: string
  headRefName: string
  headRefOid: string
  mergeStateStatus: string
  url: string
}

export interface ToolRouteDiagnosticResult {
  command: string
  status: 'passed' | 'blocked'
  exitCode: number
  summary: string
}

export interface ToolRouteFixture {
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

export interface ToolRouteApprovalReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  sourceRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  scopePolicy: Record<string, unknown>
  fixtures: { schema: string; fixtures: ToolRouteFixture[] }
  metadataResolutionPolicy: Record<string, unknown>
  artifactGuardrails: Record<string, unknown>
  failClosedPolicy: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
