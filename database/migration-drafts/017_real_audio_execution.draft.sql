-- Draft only: Milestone 15A real audio cleanup, loudness, music ducking, SoundSync, and audio QA execution.
-- Do not apply directly without migration/RLS/storage/readiness review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 15A writes cleaned_audio, separated_audio_stem, audio_analysis_json SoundSync metadata, and qa_report artifacts. Signed URLs are never persistent source of truth, and source audio/media is never overwritten.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 15A cleaned_audio, separated_audio_stem, audio_analysis_json, and qa_report artifacts. No final_export artifact is required or produced in M15A.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for real audio execution artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table quality_gate_results is
  'Milestone 15A audio execution gates include audio_loudness, audio_sync, audio_naturalness, and music_over_voice. These gates block future preview/final export when loudness, naturalness, source immutability, music-over-voice, or model approval issues are unresolved.';

comment on table tool_execution_plans is
  'Real audio execution requires approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, no raw_prompt, no model downloads, no final mux, and modelWeightManifestId approval for DeepFilterNet/Demucs production execution.';

create index if not exists idx_tool_artifacts_real_audio_execution_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('cleaned_audio', 'separated_audio_stem', 'audio_analysis_json', 'qa_report');

create index if not exists idx_quality_gate_results_real_audio_execution_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice');

-- Optional future helper tables if query shape requires them:
-- audio_execution_runs, audio_execution_operations, audio_loudness_results, audio_cleanup_artifacts, audio_soundsync_artifacts.
-- For Milestone 15A, tool_artifacts, quality_gate_results, and tool_execution_plans remain the intended source tables.
