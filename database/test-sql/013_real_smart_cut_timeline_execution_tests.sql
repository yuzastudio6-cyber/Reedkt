-- Draft SQL checks for Milestone 14 real smart cut and media timeline execution.

select 'timeline_manifest artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%timeline_manifest%'
);

select 'opentimelineio_manifest artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%opentimelineio_manifest%'
);

select 'preview_video artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%preview_video%'
);

select 'qa_report artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%qa_report%'
);

select 'smart cut timeline QA gates documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%cut_smoothness%'
    and d.description ilike '%transcript_alignment%'
    and d.description ilike '%render_timeline_integrity%'
    and d.description ilike '%export_duration_sync%'
);

select 'tool_artifacts has no signed_url column' as check_name
where not exists (
  select 1 from information_schema.columns
  where table_name = 'tool_artifacts'
    and column_name = 'signed_url'
);

select 'tool_execution_plans has no raw_prompt column' as check_name
where not exists (
  select 1 from information_schema.columns
  where table_name = 'tool_execution_plans'
    and column_name = 'raw_prompt'
);

select 'no final_export artifact required for M14' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%No final_export artifact is required%'
);

select 'source media immutability documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'timeline_manifests'
    and d.description ilike '%Source media is never overwritten%'
);

select 'approved snapshot remains required for worker execution' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'tool_execution_plans'
    and d.description ilike '%approvedSnapshotId%'
    and d.description ilike '%Workers execute approved plan snapshots%'
);
