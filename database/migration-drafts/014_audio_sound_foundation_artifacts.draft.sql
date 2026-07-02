-- Draft only: Milestone 9 audio cleanup, loudness, music/speech, and SoundSync foundation.
-- Do not apply directly without migration/RLS/storage review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 9 uses audio_analysis_json, cleaned_audio, separated_audio_stem, and qa_report artifacts. Signed URLs are never persistent source of truth.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 9 audio_analysis_json, cleaned_audio, separated_audio_stem, and qa_report. cleaned_audio and separated_audio_stem are new private artifacts and must not overwrite source audio.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for audio artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table quality_gate_results is
  'Milestone 9 audio quality gates include audio_loudness, audio_sync, audio_naturalness, and music_over_voice. Blocking gates must prevent future preview/render/export.';

comment on table model_weight_manifests is
  'Production DeepFilterNet and Demucs execution requires reviewed commercial-safe model weights. Unknown, non-commercial, or blocked weights must not run in paid production.';

comment on table media_analysis_reports is
  'Source audio/media is immutable. Milestone 9 consumes extracted_audio and media analysis records to create audio planning metadata only.';

create index if not exists idx_tool_artifacts_audio_sound_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('audio_analysis_json', 'cleaned_audio', 'separated_audio_stem', 'qa_report');

create index if not exists idx_quality_gate_results_audio_sound_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice');

-- Optional future helper tables if volume/query shape requires them:
-- audio_analysis_runs, audio_cleanup_plans, audio_quality_gate_results, soundsync_cue_plans.
-- For Milestone 9, tool_artifacts and quality_gate_results remain the intended source tables.
