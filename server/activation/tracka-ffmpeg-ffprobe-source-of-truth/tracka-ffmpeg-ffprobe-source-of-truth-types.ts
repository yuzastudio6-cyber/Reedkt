export type TrackaFfmpegFfprobeSourceOfTruthDecision =
  | 'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval'
  | 'tracka_ffmpeg_ffprobe_source_of_truth_merge_passed_ready_for_version_probe_approval'
  | 'blocked_pending_pr_463_diff_replay'
  | 'blocked_pending_central_presence_check'
  | 'blocked_pending_dockerfile_source_policy'
  | 'blocked_pending_owner_handoff'
  | 'rejected_due_runtime_safety_risk'

export type TrackaFfmpegFfprobeSourceOfTruthReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  pr463DiffReview: Record<string, unknown>
  centralPresenceCheck: Record<string, unknown>
  reconciliationMethod: Record<string, unknown>
  ffmpegFfprobeCentralEvidence: Record<string, unknown>
  futureVersionProbeBoundary: Record<string, unknown>
  ownerHandoffAndBlockerReview: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
