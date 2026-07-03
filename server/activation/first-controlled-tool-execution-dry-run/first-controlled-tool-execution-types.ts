export type FirstControlledToolExecutionDecision =
  | 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
  | 'blocked_pending_selected_candidate_guard'
  | 'blocked_pending_plan_snapshot_fixture'
  | 'blocked_pending_candidate_execution'
  | 'blocked_pending_artifact_scope_validation'
  | 'blocked_pending_execution_blocker_validation'
  | 'blocked_pending_fail_closed_validation'
  | 'blocked_pending_observability_cost_audit'
  | 'rejected_due_runtime_safety_risk'

export type FirstControlledToolOwnerId =
  | 'CONTROLLED_TOOL_EXECUTION'
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SOUND_MUSIC_AUDIO'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'UNKNOWN'

export type FirstControlledToolBooleanFlags = Record<
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

export interface FirstControlledToolPrEvidence {
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

export interface FirstControlledToolCandidate {
  candidateId: string
  candidateClass: 'fixture_report_validation_route'
  owner: 'CONTROLLED_TOOL_EXECUTION'
  sourceFixtureId: string
  sourceRouteCandidateId: string
  approvedPlanSnapshotRef: string
  privatePlaceholderRefs: string[]
  selectedForFirstControlledDryRun: boolean
  executionFlags: FirstControlledToolBooleanFlags
}

export interface FirstControlledToolReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preExecutionRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  selectedCandidateGuard: Record<string, unknown>
  approvedPlanSnapshotFixture: Record<string, unknown>
  selectedCandidateExecution: Record<string, unknown>
  artifactSourceOfTruthValidation: Record<string, unknown>
  executionBlockerValidation: Record<string, unknown>
  failClosedValidation: Record<string, unknown>
  observabilityCostAudit: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
