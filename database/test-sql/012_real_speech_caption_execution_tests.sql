-- Draft SQL checks for Milestone 13 real speech/caption execution.

select 'transcript_json artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%transcript_json%'
);

select 'word_timestamps_json artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%word_timestamps_json%'
);

select 'caption_segments_json caption files documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%caption_segments_json%'
    and d.description ilike '%captionFormat%'
);

select 'speech caption QA gates documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%transcript_alignment%'
    and d.description ilike '%caption_timing%'
    and d.description ilike '%caption_readability%'
    and d.description ilike '%caption_safe_zone%'
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

select 'caption artifacts private before preview/export documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%Caption files remain private before preview/export%'
);

select 'production transcription model weight policy documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'model_weight_manifests'
    and d.description ilike '%faster-whisper%'
    and d.description ilike '%modelWeightManifestId%'
    and d.description ilike '%block production transcription%'
);

select 'no model downloads documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'model_weight_manifests'
    and d.description ilike '%Model downloads are not allowed%'
);
