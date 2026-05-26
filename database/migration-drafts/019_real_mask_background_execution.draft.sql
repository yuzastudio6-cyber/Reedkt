-- Draft only: Milestone 15C real mask/background/text-behind-subject execution.
-- Prefer existing tool_runs, tool_artifacts, render_manifests, and quality_gate_results.

comment on table tool_artifacts is
  'M15C mask execution writes private mask_image, mask_sequence, rgba_cutout, qa_report, optional preview_video, and render_manifest depth-composition metadata. Source/proxy media are immutable, signed URLs are not persisted, and final_export is not produced.';

comment on table quality_gate_results is
  'M15C mask QA emits mask_edge_quality, mask_temporal_stability, mask_subject_coverage, and render_asset_integrity gates. Blocking mask QA prevents text-behind-subject preview and later final export.';

comment on table tool_runs is
  'M15C mask runs require approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, no raw_prompt, no model downloads, no final render, and modelWeightManifestId approval for BiRefNet/SAM2 production execution.';

-- Optional future helper tables for reviewed migrations:
-- create table mask_execution_runs (...);
-- create table mask_execution_operations (...);
-- create table mask_tracking_results (...);
-- create table text_behind_subject_manifests (...);
-- create table mask_quality_gate_results (...);
