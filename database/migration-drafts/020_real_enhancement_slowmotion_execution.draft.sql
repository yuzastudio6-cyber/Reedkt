-- Draft only: Milestone 15D real enhancement and slow-motion execution.
-- Prefer existing tool_runs, tool_artifacts, and quality_gate_results.

comment on table tool_artifacts is
  'M15D enhancement/slow-motion execution writes private enhanced_video, interpolated_video, representative_frame, optional preview_video, and qa_report artifacts. Source/proxy media are immutable, signed URLs are not persisted, model downloads are forbidden, and final_export is not produced.';

comment on table quality_gate_results is
  'M15D QA emits enhancement_artifacts, slow_motion_artifacts, and render_asset_integrity gates. Enhancement QA is sample-first; slow-motion QA checks ghosting, warping, duplicated objects, trails, and selected-clip validity.';

comment on table tool_runs is
  'M15D enhancement/slow-motion runs require approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, no raw_prompt, no final render/export, no model downloads, and modelWeightManifestId approval for Real-ESRGAN/FILM production execution.';

-- Optional future helper tables for reviewed migrations:
-- create table enhancement_execution_runs (...);
-- create table enhancement_sample_results (...);
-- create table slow_motion_execution_runs (...);
-- create table slow_motion_interpolation_results (...);
-- create table enhancement_quality_gate_results (...);
