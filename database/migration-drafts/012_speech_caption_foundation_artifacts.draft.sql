-- Draft only: Milestone 7 speech, transcript, word timestamp, and caption foundation.
-- Do not apply directly without the normal migration/RLS/storage review process.

comment on table tool_artifacts is
  'Production tool artifacts store private storage references only. Milestone 7 adds transcript_json, word_timestamps_json, caption_segments_json, caption file metadata, and caption QA artifacts. Signed URLs are never persistent source of truth.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 7 speech/caption artifacts: transcript_json, word_timestamps_json, caption_segments_json, and qa_report. Caption files remain private artifacts before preview/export.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for transcript/caption artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table quality_gate_results is
  'Milestone 7 caption quality gates include caption_readability, caption_timing, caption_safe_zone, and transcript_alignment. Blocking gates may block preview or final export later.';

comment on table model_weight_manifests is
  'Production faster-whisper transcription requires reviewed commercial-safe model weights. Unknown, non-commercial, or blocked weights must not run in paid production.';

create index if not exists idx_tool_artifacts_speech_caption_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('transcript_json', 'word_timestamps_json', 'caption_segments_json', 'qa_report');

create index if not exists idx_quality_gate_results_caption_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('caption_readability', 'caption_timing', 'caption_safe_zone', 'transcript_alignment');

-- Optional helper tables may be introduced in a later active migration if artifact/query volume needs them:
-- speech_analysis_runs, caption_analysis_runs, caption_file_artifacts, caption_quality_gate_results.
-- For Milestone 7, the source of truth remains tool_artifacts and quality_gate_results.
