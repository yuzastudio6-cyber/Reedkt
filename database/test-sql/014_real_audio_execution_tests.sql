-- Draft SQL checks for Milestone 15A real audio execution.

select 'cleaned_audio artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%cleaned_audio%'
);

select 'separated_audio_stem artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%separated_audio_stem%'
);

select 'audio_analysis_json artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%audio_analysis_json%'
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

select 'audio QA gates documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%audio_loudness%'
    and d.description ilike '%audio_sync%'
    and d.description ilike '%audio_naturalness%'
    and d.description ilike '%music_over_voice%'
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

select 'no final_export artifact required for M15A' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%No final_export artifact is required%'
);

select 'source audio immutability documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'tool_artifacts'
    and d.description ilike '%source audio/media is never overwritten%'
);

select 'production model audio requires model weight approval' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'tool_execution_plans'
    and d.description ilike '%modelWeightManifestId%'
    and d.description ilike '%DeepFilterNet/Demucs%'
);
