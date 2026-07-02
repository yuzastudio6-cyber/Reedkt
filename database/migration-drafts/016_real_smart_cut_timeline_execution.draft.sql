-- Draft only: Milestone 14 real smart cut and media timeline execution.
-- Do not apply directly without migration/RLS/storage/readiness review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 14 writes smart cut execution plan metadata through timeline_manifest artifacts, opentimelineio_manifest artifacts, local-dev preview_video artifacts when actually produced, and qa_report artifacts. Signed URLs are never persistent source of truth.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 14 timeline_manifest, opentimelineio_manifest, preview_video, and qa_report artifacts. No final_export artifact is required or produced in M14.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for smart cut/timeline execution artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table timeline_manifests is
  'Milestone 14 timeline execution manifests preserve source/proxy refs, clip source ranges, timeline ranges, caption refs, preview notes, QA refs, and source media immutability. Source media is never overwritten.';

comment on table quality_gate_results is
  'Milestone 14 smart cut/timeline execution gates include cut_smoothness, transcript_alignment, render_timeline_integrity, export_duration_sync, audio_sync placeholder, and final_delivery blocked/out-of-scope.';

comment on table tool_execution_plans is
  'Real smart cut/timeline execution requires approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, and approved cut/timeline QA. Workers execute approved plan snapshots, not raw_prompt or raw chat fields.';

create index if not exists idx_tool_artifacts_real_smart_cut_timeline_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('timeline_manifest', 'opentimelineio_manifest', 'preview_video', 'qa_report');

create index if not exists idx_quality_gate_results_real_smart_cut_timeline_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('cut_smoothness', 'transcript_alignment', 'render_timeline_integrity', 'export_duration_sync');

-- Optional future helper tables if query shape requires them:
-- smart_cut_execution_plans, smart_cut_execution_operations, timeline_execution_manifests, smart_cut_preview_artifacts.
-- For Milestone 14, tool_artifacts, timeline_manifests, quality_gate_results, and tool_execution_plans remain the intended source tables.
