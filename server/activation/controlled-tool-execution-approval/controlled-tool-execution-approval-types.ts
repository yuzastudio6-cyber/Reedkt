export type ControlledToolExecutionApprovalDecision =
  | 'approved_for_future_first_controlled_tool_execution_dry_run'
  | 'blocked_pending_first_candidate_review'
  | 'blocked_pending_plan_snapshot_requirements'
  | 'blocked_pending_worker_handoff_review'
  | 'blocked_pending_artifact_scope_policy'
  | 'blocked_pending_fail_closed_policy'
  | 'blocked_pending_observability_cost_audit'
  | 'rejected_due_runtime_safety_risk'

export type ControlledToolOwnerId =
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'SOUND_MUSIC_AUDIO'
  | 'AI_TOOLS_CREATIVE_GRAPHICS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'CONTROLLED_TOOL_EXECUTION'

export type ControlledToolBooleanFlags = Record<
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

export interface ControlledToolPrEvidence {
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

export interface ControlledToolCandidate {
  candidateId: string
  candidateClass: 'fixture_report_validation_route'
  owner: ControlledToolOwnerId
  sourceFixtureId: string
  sourceRouteCandidateId: string
  approvedPlanSnapshotRef: string
  privatePlaceholderRefs: string[]
  selectedForFirstControlledDryRun: boolean
  reason: string
  executionFlags: ControlledToolBooleanFlags
}

export interface ControlledToolApprovalReportSet {
  sourceOfTruthAudit: Record<string, unknown>
  preApprovalRevalidation: Record<string, unknown>
  evidenceInventory: Record<string, unknown>
  firstCandidateReview: Record<string, unknown>
  scopePolicy: Record<string, unknown>
  approvedPlanSnapshotRequirements: Record<string, unknown>
  workerHandoffRequirements: Record<string, unknown>
  artifactGuardrails: Record<string, unknown>
  failClosedPolicy: Record<string, unknown>
  observabilityCostAuditRequirements: Record<string, unknown>
  decision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
