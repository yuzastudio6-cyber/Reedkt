-- Draft SQL checks for Milestone 8 smart cut/timeline foundation.

select 'timeline_manifest artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%timeline_manifest%'
);

select 'opentimelineio_manifest artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%opentimelineio_manifest%'
);

select 'qa_report artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%qa_report%'
);

select 'smart cut timeline QA gates documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%cut_smoothness%'
    and d.description ilike '%transcript_alignment%'
    and d.description ilike '%render_timeline_integrity%'
);

select 'timeline formats documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'timeline_manifests'
    and d.description ilike '%reeditpro_timeline%'
    and d.description ilike '%opentimelineio%'
    and d.description ilike '%hyperframe_timeline%'
    and d.description ilike '%remotion_composition_manifest%'
);

select 'tool_artifacts has no signed_url column' as check_name
where not exists (
  select 1
  from information_schema.columns
  where table_name = 'tool_artifacts'
    and column_name = 'signed_url'
);

select 'final_export not required for M8 documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%final_export is not required%'
);

select 'source immutability documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'media_analysis_reports'
    and d.description ilike '%Source media is immutable%'
);

select 'approved snapshot remains required for timeline manifests' as check_name
where exists (
  select 1
  from information_schema.columns
  where table_name = 'timeline_manifests'
    and column_name = 'approved_snapshot_id'
    and is_nullable = 'NO'
);
