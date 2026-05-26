-- Draft only: Milestone 15B real color correction, shot match, look transform, and color QA execution.
-- Do not apply directly without migration/RLS/storage/readiness review.

comment on table tool_artifacts is
  'Production artifacts store private storage references only. Milestone 15B writes color_analysis_json, color_grade_recipe, graded_preview when actually produced, and qa_report artifacts. Signed URLs are never persistent source of truth, and source/proxy media is never overwritten.';

comment on column tool_artifacts.artifact_type is
  'Includes Milestone 15B color_analysis_json, color_grade_recipe, graded_preview, and qa_report artifacts. No final_export artifact is required or produced in M15B.';

comment on column tool_artifacts.storage_object_path is
  'Private storage object path for real color execution artifacts. This column must not store signed URLs, raw provider URLs, or public delivery URLs.';

comment on table quality_gate_results is
  'Milestone 15B color execution gates include color_exposure, color_skin_tone, color_export_space, and color_shot_match. These gates block future preview/final export when exposure, skin tone, color-space, LUT, or shot-match issues are unresolved.';

comment on table tool_execution_plans is
  'Real color execution requires approvedSnapshotId, toolExecutionPlanId, idempotencyKey, private artifact refs, no raw_prompt, no final export, no arbitrary FFmpeg/LUT args, source/proxy immutability, and OpenColorIO/OpenImageIO readiness/manual review when selected.';

create index if not exists idx_tool_artifacts_real_color_execution_types
  on tool_artifacts (workspace_id, project_id, media_asset_id, artifact_type)
  where artifact_type in ('color_analysis_json', 'color_grade_recipe', 'graded_preview', 'qa_report');

create index if not exists idx_quality_gate_results_real_color_execution_gates
  on quality_gate_results (workspace_id, project_id, media_asset_id, gate_type, status)
  where gate_type in ('color_exposure', 'color_skin_tone', 'color_export_space', 'color_shot_match');

-- Optional future helper tables if query shape requires them:
-- color_execution_runs, color_execution_operations, color_grade_recipes, color_preview_artifacts, color_quality_gate_results.
-- For Milestone 15B, tool_artifacts, quality_gate_results, and tool_execution_plans remain the intended source tables.
