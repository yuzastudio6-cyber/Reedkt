-- ReeditPro schema health checks.
-- Safe read-only checks for local validation. Do not add credentials here.

-- Public tables.
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- Public enum types and values.
select
  n.nspname as schema_name,
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;

-- RLS-enabled public tables.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Tables missing primary keys.
select
  c.table_schema,
  c.table_name
from information_schema.tables c
where c.table_schema = 'public'
  and c.table_type = 'BASE TABLE'
  and not exists (
    select 1
    from information_schema.table_constraints tc
    where tc.table_schema = c.table_schema
      and tc.table_name = c.table_name
      and tc.constraint_type = 'PRIMARY KEY'
  )
order by c.table_name;

-- Foreign keys.
select
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- Indexes.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- Updated-at triggers and other triggers.
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;

-- Policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Views and security_invoker option visibility.
select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname = 'public'
order by viewname;

-- Key table existence checks.
select *
from (
  values
    ('plans', to_regclass('public.plans')),
    ('user_profiles', to_regclass('public.user_profiles')),
    ('workspaces', to_regclass('public.workspaces')),
    ('projects', to_regclass('public.projects')),
    ('chat_sessions', to_regclass('public.chat_sessions')),
    ('chat_messages', to_regclass('public.chat_messages')),
    ('media_assets', to_regclass('public.media_assets')),
    ('source_clip_sequences', to_regclass('public.source_clip_sequences')),
    ('source_clip_sequence_items', to_regclass('public.source_clip_sequence_items')),
    ('intent_analyses', to_regclass('public.intent_analyses')),
    ('edit_plans', to_regclass('public.edit_plans')),
    ('edit_quality_profiles', to_regclass('public.edit_quality_profiles')),
    ('credit_wallets', to_regclass('public.credit_wallets')),
    ('credit_estimates', to_regclass('public.credit_estimates')),
    ('credit_approvals', to_regclass('public.credit_approvals')),
    ('credit_reservations', to_regclass('public.credit_reservations')),
    ('job_batches', to_regclass('public.job_batches')),
    ('jobs', to_regclass('public.jobs')),
    ('stroke_motion_plans', to_regclass('public.stroke_motion_plans')),
    ('stroke_motion_meaning_expansions', to_regclass('public.stroke_motion_meaning_expansions')),
    ('generation_providers', to_regclass('public.generation_providers')),
    ('generation_requests', to_regclass('public.generation_requests')),
    ('generated_assets', to_regclass('public.generated_assets')),
    ('render_jobs', to_regclass('public.render_jobs')),
    ('renders', to_regclass('public.renders')),
    ('preview_reviews', to_regclass('public.preview_reviews')),
    ('revision_requests', to_regclass('public.revision_requests')),
    ('qa_reports', to_regclass('public.qa_reports')),
    ('exports', to_regclass('public.exports'))
) as required_tables(table_name, regclass_value)
order by table_name;

-- Key relationship checks.
select
  'projects.current_chat_session_id -> chat_sessions.id' as relationship,
  exists (
    select 1
    from pg_constraint
    where conname = 'projects_current_chat_session_id_fkey'
  ) as exists;

select
  'projects.current_edit_plan_id -> edit_plans.id' as relationship,
  exists (
    select 1
    from pg_constraint
    where conname = 'projects_current_edit_plan_id_fkey'
  ) as exists;

select
  'edit_plans.credit_estimate_id -> credit_estimates.id' as relationship,
  exists (
    select 1
    from pg_constraint
    where conname = 'edit_plans_credit_estimate_id_fkey'
  ) as exists;

select
  'signature_routes.generation_request_id -> generation_requests.id' as relationship,
  exists (
    select 1
    from pg_constraint
    where conname = 'signature_routes_generation_request_id_fkey'
  ) as exists;

select
  'stroke_motion_generation_specs.generation_request_id -> generation_requests.id' as relationship,
  exists (
    select 1
    from pg_constraint
    where conname = 'stroke_motion_generation_specs_generation_request_id_fkey'
  ) as exists;

-- Approval gate helpers.
select
  proname,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'is_workspace_member',
    'has_workspace_role',
    'is_workspace_owner_or_admin',
    'can_start_generation',
    'can_run_job',
    'can_export_render'
  )
order by proname;

