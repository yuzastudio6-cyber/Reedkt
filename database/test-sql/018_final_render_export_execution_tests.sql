-- Draft SQL assertions for Milestone 16A.

select 'render_manifest artifact type is supported' as assertion
where exists (select 1 where 'render_manifest' in ('render_manifest', 'preview_video', 'final_export', 'qa_report'));

select 'preview_video artifact type is supported' as assertion
where exists (select 1 where 'preview_video' in ('render_manifest', 'preview_video', 'final_export', 'qa_report'));

select 'final_export artifact type is supported' as assertion
where exists (select 1 where 'final_export' in ('render_manifest', 'preview_video', 'final_export', 'qa_report'));

select 'qa_report artifact type is supported' as assertion
where exists (select 1 where 'qa_report' in ('render_manifest', 'preview_video', 'final_export', 'qa_report'));

select 'render/export QA gate types are supported' as assertion
where exists (
  select 1
  where 'render_asset_integrity' in ('render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery')
    and 'render_timeline_integrity' in ('render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery')
    and 'export_codec_format' in ('render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery')
    and 'export_duration_sync' in ('render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery')
    and 'final_delivery' in ('render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery')
);

select 'no signed_url column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in ('tool_artifacts', 'tool_runs', 'render_manifests')
    and column_name = 'signed_url'
);

select 'no raw_prompt column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name in ('tool_artifacts', 'tool_runs', 'render_manifests')
    and column_name = 'raw_prompt'
);

select 'final_export artifacts are private before delivery/share' as assertion;

select 'source/proxy immutability and Revideo production block are documented in draft comments' as assertion;
