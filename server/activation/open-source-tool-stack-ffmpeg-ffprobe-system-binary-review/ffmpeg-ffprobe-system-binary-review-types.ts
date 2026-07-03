export type FfmpegFfprobeSystemBinaryReviewDecision =
  | 'ffmpeg_ffprobe_system_binary_review_passed_ready_for_version_probe_approval'
  | 'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge'
  | 'ffmpeg_ffprobe_system_binary_review_passed_ready_for_worker_container_handoff'
  | 'blocked_pending_tracka_runtime_path_source_of_truth'
  | 'blocked_pending_system_binary_source_selection'
  | 'blocked_pending_worker_container_policy'
  | 'blocked_pending_license_provenance_review'
  | 'rejected_due_runtime_safety_risk'

export type FfmpegFfprobeSystemBinaryReviewReportSet = {
  sourceOfTruthAudit: Record<string, unknown>
  evidenceRevalidationReport: Record<string, unknown>
  trackaPr463ReferenceReview: Record<string, unknown>
  strategySelectionReview: Record<string, unknown>
  futureVersionProbeScope: Record<string, unknown>
  ownerHandoffReview: Record<string, unknown>
  internalBetaImpactReview: Record<string, unknown>
  decision: Record<string, unknown>
  readinessReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
