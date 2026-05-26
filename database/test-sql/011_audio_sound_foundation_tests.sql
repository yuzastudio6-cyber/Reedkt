-- Draft SQL checks for Milestone 9 audio/sound foundation.

select 'audio_analysis_json artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%audio_analysis_json%'
);

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
  select 1
  from information_schema.columns
  where table_name = 'tool_artifacts'
    and column_name = 'signed_url'
);

select 'cleaned audio private source immutability documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%new private artifacts%'
    and d.description ilike '%must not overwrite source audio%'
);

select 'audio source immutability documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'media_analysis_reports'
    and d.description ilike '%Source audio/media is immutable%'
);

select 'blocked audio model weights supported' as check_name
where exists (
  select 1 from information_schema.columns
  where table_name = 'model_weight_manifests'
    and column_name = 'commercial_use_allowed'
)
and exists (
  select 1 from information_schema.columns
  where table_name = 'model_weight_manifests'
    and column_name = 'review_status'
);

select 'production audio model weight policy documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'model_weight_manifests'
    and d.description ilike '%DeepFilterNet%'
    and d.description ilike '%Demucs%'
    and d.description ilike '%commercial-safe%'
);
