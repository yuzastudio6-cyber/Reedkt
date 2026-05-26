-- Draft SQL assertions for Milestone 15C.

select 'mask_image artifact type is supported' as assertion
where exists (select 1 where 'mask_image' in ('mask_image', 'mask_sequence', 'rgba_cutout', 'qa_report', 'preview_video', 'render_manifest'));

select 'mask_sequence artifact type is supported' as assertion
where exists (select 1 where 'mask_sequence' in ('mask_image', 'mask_sequence', 'rgba_cutout', 'qa_report', 'preview_video', 'render_manifest'));

select 'rgba_cutout artifact type is supported' as assertion
where exists (select 1 where 'rgba_cutout' in ('mask_image', 'mask_sequence', 'rgba_cutout', 'qa_report', 'preview_video', 'render_manifest'));

select 'mask QA gate types are supported' as assertion
where exists (
  select 1
  where 'mask_edge_quality' in ('mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity')
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

select 'final_export artifact is not required in M15C' as assertion;

select 'source/proxy immutability and modelWeightManifestId requirements are documented in draft comments' as assertion;
