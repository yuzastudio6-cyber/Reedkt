export type SecondControlledCandidateDryRunDecision =
  | 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review'
  | 'blocked_pending_selected_second_candidate_guard'
  | 'blocked_pending_plan_snapshot_fixture'
  | 'blocked_pending_sound_music_audio_fixture_validation'
  | 'blocked_pending_candidate_execution'
  | 'blocked_pending_artifact_scope_validation'
  | 'blocked_pending_execution_blocker_validation'
  | 'blocked_pending_fail_closed_validation'
  | 'blocked_pending_observability_cost_audit'
  | 'rejected_due_runtime_safety_risk'

export type SecondControlledDryRunFlags = Record<
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

export interface SecondControlledPrEvidence {
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

export interface SecondControlledDryRunCandidate {
  candidateId: string
  candidateClass: 'fixture_report_validation_route_variant'
  ownerLane: 'SOUND_MUSIC_AUDIO'
  sourceFixtureId: string
  sourceRouteCandidateId: string
  approvedPlanSnapshotRef: string
  privatePlaceholderRefs: string[]
  executionFlags: SecondControlledDryRunFlags
}

export interface SecondControlledDryRunReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preExecutionRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  selectedSecondCandidateGuard: Record<string, unknown>
  approvedPlanSnapshotFixture: Record<string, unknown>
  soundMusicAudioMetadataRouteFixture: Record<string, unknown>
  selectedSecondCandidateExecution: Record<string, unknown>
  artifactSourceOfTruthValidation: Record<string, unknown>
  executionBlockerValidation: Record<string, unknown>
  failClosedValidation: Record<string, unknown>
  observabilityCostAudit: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
