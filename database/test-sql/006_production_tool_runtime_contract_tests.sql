-- ReeditPro manual SQL smoke tests.
-- Do not run in production.
-- Use only in local/staging Supabase testing after reviewing and applying:
-- database/migration-drafts/009_production_tool_runtime_contracts.draft.sql

-- Production tool runtime table existence.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'media_analysis_reports',
    'tool_recipes',
    'tool_execution_plans',
    'tool_runs',
    'tool_artifacts',
    'quality_gate_results',
    'fallback_decisions',
    'timeline_manifests',
    'render_manifests',
    'model_weight_manifests',
    'license_review_records'
  )
order by table_name;

-- Approved snapshot ID is required before production tool execution can happen.
select
  table_name,
  column_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('tool_execution_plans', 'timeline_manifests', 'render_manifests')
  and column_name = 'approved_snapshot_id'
order by table_name;

-- This should return true when execution tables require approved_snapshot_id.
select
  bool_and(is_nullable = 'NO') as approved_snapshot_id_required_for_execution
from information_schema.columns
where table_schema = 'public'
  and table_name in ('tool_execution_plans', 'timeline_manifests', 'render_manifests')
  and column_name = 'approved_snapshot_id';

-- Tool artifacts require private canonical storage references.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name in (
    'storage_bucket_purpose',
    'storage_object_path',
    'is_private',
    'source_of_truth'
  )
order by column_name;

-- Canonical tool artifacts must not have persistent signed URL columns.
select
  count(*) = 0 as tool_artifacts_have_no_persistent_signed_url_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name ilike '%signed%url%';

-- Tool artifact constraints should reject URL-shaped source-of-truth paths
-- and enforce private/source_of_truth storage refs.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'tool_artifacts'
  and c.contype = 'c'
order by conname;

-- Quality gates can be blocking and can block final export.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'quality_gate_results'
  and column_name in (
    'required',
    'blocking',
    'blocks_preview',
    'blocks_final_export',
    'human_review_required'
  )
order by column_name;

-- Model weights can be marked as commercial-use blocked.
select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'model_weight_manifests'
  and column_name in ('commercial_use_allowed', 'review_status');

-- License records can be marked needs_review or blocked.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'license_review_records'
  and c.contype = 'c'
  and pg_get_constraintdef(c.oid) ilike '%needs_review%'
  and pg_get_constraintdef(c.oid) ilike '%blocked%';

-- Revideo must remain evaluation-only in the render manifest engine constraint.
select
  conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'render_manifests'
  and c.contype = 'c'
  and pg_get_constraintdef(c.oid) ilike '%evaluation_revideo%';
