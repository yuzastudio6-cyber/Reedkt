-- Draft SQL checks for Milestone 7 speech/caption foundation.
-- These are intended for migration review smoke checks, not active production execution.

select 'transcript_json artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%transcript_json%'
);

select 'word_timestamps_json artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%word_timestamps_json%'
);

select 'caption_segments_json artifact type documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%caption_segments_json%'
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

select 'caption QA gates documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%caption_readability%'
    and d.description ilike '%caption_timing%'
    and d.description ilike '%caption_safe_zone%'
    and d.description ilike '%transcript_alignment%'
);

select 'tool_artifacts has no signed_url column' as check_name
where not exists (
  select 1
  from information_schema.columns
  where table_name = 'tool_artifacts'
    and column_name = 'signed_url'
);

select 'caption artifacts private before preview/export documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%private artifacts before preview/export%'
);

select 'blocked transcription model weights supported' as check_name
where exists (
  select 1
  from information_schema.columns
  where table_name = 'model_weight_manifests'
    and column_name = 'commercial_use_allowed'
)
and exists (
  select 1
  from information_schema.columns
  where table_name = 'model_weight_manifests'
    and column_name = 'review_status'
);

select 'production transcription model weight policy documented' as check_name
where exists (
  select 1
  from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'model_weight_manifests'
    and d.description ilike '%faster-whisper%'
    and d.description ilike '%commercial-safe%'
);
