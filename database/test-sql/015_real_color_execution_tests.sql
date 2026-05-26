-- Draft SQL checks for Milestone 15B real color execution.

select 'color_analysis_json artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%color_analysis_json%'
);

select 'color_grade_recipe artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%color_grade_recipe%'
);

select 'graded_preview artifact type documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%graded_preview%'
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

select 'color QA gates documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'quality_gate_results'
    and d.description ilike '%color_exposure%'
    and d.description ilike '%color_skin_tone%'
    and d.description ilike '%color_export_space%'
    and d.description ilike '%color_shot_match%'
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

select 'no final_export artifact required for M15B' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
  where c.relname = 'tool_artifacts'
    and a.attname = 'artifact_type'
    and d.description ilike '%No final_export artifact is required%'
);

select 'source proxy immutability documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'tool_artifacts'
    and d.description ilike '%source/proxy media is never overwritten%'
);

select 'opencolorio openimageio readiness documented' as check_name
where exists (
  select 1 from pg_description d
  join pg_class c on c.oid = d.objoid
  where c.relname = 'tool_execution_plans'
    and d.description ilike '%OpenColorIO/OpenImageIO readiness/manual review%'
);
