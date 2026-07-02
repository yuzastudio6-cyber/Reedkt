-- Draft only: Milestone 8 smart cut and timeline foundation.
-- Do not apply directly without migration/RLS/storage review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 8 uses timeline_manifest, opentimelineio_manifest, and qa_report artifacts for smart cut/timeline metadata. Signed URLs are never persistent source of truth.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 8 timeline_manifest, opentimelineio_manifest, and qa_report. final_export is not required or produced by Milestone 8.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path. Smart cut/timeline artifacts must not store signed URLs or public delivery URLs.';

comment on table timeline_manifests is
  'Timeline manifests preserve approved snapshot references and may use reeditpro_timeline, opentimelineio, hyperframe_timeline, or remotion_composition_manifest formats. Milestone 8 creates metadata only and does not render/export.';

comment on table quality_gate_results is
  'Milestone 8 smart cut/timeline quality gates include cut_smoothness, transcript_alignment, audio_sync, and render_timeline_integrity. Blocking gates must prevent future preview/render/export.';

comment on table media_analysis_reports is
  'Source media is immutable. Milestone 8 consumes media duration, scene placeholders, silence signals, and transcript/caption evidence to create edit-decision metadata only.';

create index if not exists idx_tool_artifacts_smart_cut_timeline_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('timeline_manifest', 'opentimelineio_manifest', 'qa_report');

create index if not exists idx_quality_gate_results_smart_cut_timeline_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity');

create index if not exists idx_timeline_manifests_approved_snapshot
  on timeline_manifests (workspace_id, project_id, approved_snapshot_id, media_asset_id);

-- Optional future helper tables if volume/query shape requires them:
-- smart_cut_plans, smart_cut_segment_scores, timeline_manifest_records, edit_decision_records.
-- For Milestone 8, tool_artifacts, timeline_manifests, and quality_gate_results remain the intended source tables.
