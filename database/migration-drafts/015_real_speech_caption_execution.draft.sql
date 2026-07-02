-- Draft only: Milestone 13 real speech, transcript, word timestamp, and caption execution.
-- Do not apply directly without migration/RLS/storage/model-weight review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 13 writes transcript_json, word_timestamps_json, caption_segments_json, caption file metadata represented as caption_segments_json, optional preview_video, and qa_report artifacts. Signed URLs are never persistent source of truth.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 13 transcript_json, word_timestamps_json, caption_segments_json, qa_report, and optional preview_video artifacts. Caption files remain private before preview/export and may be represented as caption_segments_json with captionFormat metadata.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for speech/caption execution artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table quality_gate_results is
  'Milestone 13 caption/speech execution quality gates include transcript_alignment, caption_timing, caption_readability, and caption_safe_zone.';

comment on table model_weight_manifests is
  'Production faster-whisper transcription requires modelWeightManifestId with approved commercial-safe model weights. Unknown, non-commercial, missing, or needs-review weights block production transcription. Model downloads are not allowed.';

comment on table tool_execution_plans is
  'Real speech/caption execution must reference approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, and approved modelWeightManifestId. Workers execute approved plan snapshots, not raw_prompt or raw chat fields.';

create index if not exists idx_tool_artifacts_real_speech_caption_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('transcript_json', 'word_timestamps_json', 'caption_segments_json', 'qa_report', 'preview_video');

create index if not exists idx_quality_gate_results_real_speech_caption_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('transcript_alignment', 'caption_timing', 'caption_readability', 'caption_safe_zone');

-- Optional future helper tables if volume/query shape requires them:
-- speech_execution_runs, caption_execution_runs, speech_caption_execution_results, caption_file_artifacts.
-- For Milestone 13, tool_artifacts, quality_gate_results, model_weight_manifests, and tool_execution_plans remain the intended source tables.
