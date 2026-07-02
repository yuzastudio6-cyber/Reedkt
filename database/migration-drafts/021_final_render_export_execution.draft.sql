-- Draft only: Milestone 16A final render/export execution.
-- Prefer existing render_manifests, tool_artifacts, tool_runs, and quality_gate_results.

comment on table tool_artifacts is
  'M16A final render/export execution writes private render_manifest, preview_video, final_export, and qa_report artifacts. final_export remains private before delivery/share, signed URLs are not persisted, source/proxy artifacts are immutable, and Revideo is not a production render engine.';

comment on table quality_gate_results is
  'M16A render/export QA emits render_asset_integrity, render_timeline_integrity, export_codec_format, export_duration_sync, audio_sync, and final_delivery gates, plus upstream layer gates as applicable. final_delivery passes only when final_export exists and blocking QA gates pass.';

comment on table tool_runs is
  'M16A render runs require approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, no raw_prompt, no signed URLs, no arbitrary FFmpeg/Remotion/libass args, and no Revideo production execution.';

-- Optional future helper tables for reviewed migrations:
-- create table render_execution_runs (...);
-- create table render_command_plans (...);
-- create table final_export_records (...);
-- create table render_quality_gate_results (...);
-- create table delivery_quality_gate_results (...);
