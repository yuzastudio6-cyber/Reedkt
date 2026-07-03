export type SecondControlledCandidateApprovalDecision =
  | 'approved_for_future_second_controlled_candidate_dry_run'
  | 'blocked_pending_second_candidate_scope_review'
  | 'blocked_pending_sound_music_audio_route_review'
  | 'blocked_pending_plan_snapshot_requirements'
  | 'blocked_pending_worker_handoff_review'
  | 'blocked_pending_artifact_scope_policy'
  | 'blocked_pending_fail_closed_policy'
  | 'blocked_pending_observability_cost_audit'
  | 'rejected_due_runtime_safety_risk'

export type SecondControlledBooleanFlags = Record<
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

export interface SecondControlledCandidate {
  candidateId: string
  candidateClass: 'fixture_report_validation_route_variant'
  ownerLane: 'SOUND_MUSIC_AUDIO'
  sourceFixtureId: string
  sourceRouteCandidateId: string
  expectedInput: string
  expectedOutput: string
  approvedPlanSnapshotRef: string
  privatePlaceholderRefs: string[]
  selectedForSecondControlledDryRunApproval: boolean
  executionFlags: SecondControlledBooleanFlags
}

export interface SecondControlledCandidateApprovalReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preApprovalRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  secondCandidateScopeReview: Record<string, unknown>
  soundMusicAudioRouteReview: Record<string, unknown>
  approvedPlanSnapshotRequirements: Record<string, unknown>
  workerHandoffReview: Record<string, unknown>
  artifactGuardrails: Record<string, unknown>
  failClosedPolicy: Record<string, unknown>
  observabilityCostAuditRequirements: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
