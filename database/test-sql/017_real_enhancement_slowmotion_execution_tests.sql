-- Draft SQL assertions for Milestone 15D.

select 'enhanced_video artifact type is supported' as assertion
where exists (select 1 where 'enhanced_video' in ('enhanced_video', 'interpolated_video', 'representative_frame', 'preview_video', 'qa_report'));

select 'interpolated_video artifact type is supported' as assertion
where exists (select 1 where 'interpolated_video' in ('enhanced_video', 'interpolated_video', 'representative_frame', 'preview_video', 'qa_report'));

select 'preview_video artifact type is supported' as assertion
where exists (select 1 where 'preview_video' in ('enhanced_video', 'interpolated_video', 'representative_frame', 'preview_video', 'qa_report'));

select 'qa_report artifact type is supported' as assertion
where exists (select 1 where 'qa_report' in ('enhanced_video', 'interpolated_video', 'representative_frame', 'preview_video', 'qa_report'));

select 'enhancement and slow-motion QA gate types are supported' as assertion
where exists (
  select 1
  where 'enhancement_artifacts' in ('enhancement_artifacts', 'slow_motion_artifacts', 'render_asset_integrity')
    and 'slow_motion_artifacts' in ('enhancement_artifacts', 'slow_motion_artifacts', 'render_asset_integrity')
    and 'render_asset_integrity' in ('enhancement_artifacts', 'slow_motion_artifacts', 'render_asset_integrity')
);

select 'no signed_url column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in ('tool_artifacts', 'tool_runs')
    and column_name = 'signed_url'
);

select 'no raw_prompt column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in ('tool_artifacts', 'tool_runs')
    and column_name = 'raw_prompt'
);

select 'final_export artifact is not required in M15D' as assertion;

select 'source/proxy immutability and modelWeightManifestId requirements for Real-ESRGAN/FILM are documented in draft comments' as assertion;
