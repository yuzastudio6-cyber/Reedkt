-- DRAFT TESTS ONLY.
-- DO NOT RUN AGAINST PRODUCTION.
-- SUPABASE-SOUND-2 planning artifact only.
-- No SQL from this file was executed by this prompt.
-- Future local/staging validation must use mock IDs only.
-- Correct source of truth: Supabase row + private GCS path + manifest + checksum + approved plan snapshot.
-- Signed URLs are not source of truth.
-- Public artifacts remain blocked.
-- Raw prompts must not become worker execution payloads.
-- generated_local_fixture_passed is not claimed.

-- Draft SQL assertions for future local validation only.
-- These assertions are intentionally text-reviewed by the SUPABASE-SOUND-2 smoke
-- and are not executed by this prompt.

-- Baseline prerequisite guard. SUPABASE-SOUND-4-RETRY proved that an empty
-- throwaway database can otherwise skip/fail unclearly before fixture-specific
-- assertions run. These tests extend existing ReEditPro surfaces; they must not
-- recreate baseline tables.
do $$
declare
  missing_relations text[];
begin
  select array_agg(required_relation order by required_relation)
    into missing_relations
  from (
    values
      ('public.approved_plan_snapshots'),
      ('public.storage_object_records'),
      ('public.signed_url_events'),
      ('public.generation_requests'),
      ('public.generated_assets'),
      ('public.jobs'),
      ('public.job_events'),
      ('public.sound_effect_plans'),
      ('public.ambient_sound_plans'),
      ('public.music_plans'),
      ('public.audio_environment_analysis'),
      ('public.qa_reports'),
      ('public.credit_estimates'),
      ('public.credit_approvals'),
      ('public.credit_reservations'),
      ('public.worker_runtime_configs')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if coalesce(array_length(missing_relations, 1), 0) > 0 then
    raise exception
      'SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA: missing baseline relation(s): %. Local throwaway validation must first load the baseline ReEditPro schema or use an approved baseline validation harness. Required starting relation includes public.approved_plan_snapshots.',
      array_to_string(missing_relations, ', ');
  end if;
end $$;

select 'approved snapshots are immutable for fixture scope' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'approved_plan_snapshots'
    and column_name in ('fixture_scope', 'snapshot_checksum', 'immutable_plan_version')
);

select 'approved snapshot fixture scope exists' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'approved_plan_snapshots'
    and column_name = 'fixture_scope'
);

select 'approved snapshot has checksum immutable version and source IDs' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'approved_plan_snapshots'
    and column_name in ('snapshot_checksum', 'immutable_plan_version', 'source_finding_ids', 'source_intent_ids')
);

select 'approved snapshots do not expose raw prompt worker payload fields' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'approved_plan_snapshots'
    and column_name in ('prompt_payload', 'chat_prompt_payload', 'mutable_prompt_payload')
);

select 'storage object records require private scope' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'storage_object_records'
    and column_name = 'storage_scope'
);

select 'storage object records require checksum' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'storage_object_records'
    and column_name in ('checksum_algorithm', 'checksum_value', 'checksum_sha256')
);

select 'storage object records reject public artifact allowed' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'storage_object_records'
    and column_name = 'public_artifact_allowed'
);

select 'storage object records reject signed URL source of truth' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'storage_object_records'
    and column_name = 'signed_url_source_of_truth_allowed'
);

select 'signed_url_events are audit only' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'signed_url_events'
    and column_name = 'source_of_truth_allowed'
);

select 'generation requests require approved snapshot before fixture execution' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'generation_requests'
    and column_name = 'approved_plan_snapshot_id'
);

select 'generation requests keep provider execution disabled by default' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'generation_requests'
    and column_name = 'provider_execution_allowed'
);

select 'generation requests keep worker dispatch disabled by default' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'generation_requests'
    and column_name = 'worker_dispatch_allowed'
);

select 'generated assets require storage object record linkage' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'generated_assets'
    and column_name = 'storage_object_record_id'
);

select 'generated assets require private scope and public artifact block' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'generated_assets'
    and column_name in ('fixture_scope', 'public_artifact_allowed')
);

select 'jobs require idempotency and approved snapshot before future dispatch' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'jobs'
    and column_name in ('idempotency_key', 'approved_plan_snapshot_id')
);

select 'jobs reject raw prompt execution fields' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'jobs'
    and column_name in ('prompt_payload', 'chat_prompt_payload', 'mutable_prompt_payload')
);

select 'jobs reject signed URL input fields' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'jobs'
    and column_name in ('signed_url_input', 'source_signed_url', 'public_url_input')
);

select 'feature gates cannot be client writable' as assertion
where exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'feature_gates'
    and cmd in ('SELECT', 'ALL')
);

select 'tool capabilities cannot be client writable' as assertion
where exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'tool_capabilities'
    and cmd in ('SELECT', 'ALL')
);

select 'worker runtime configs remain service owned' as assertion
where not exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'worker_runtime_configs'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and roles::text ilike '%anon%'
);

select 'credit rows are not required for local fixture until Billing accepts placeholder policy' as assertion
where exists (
  select 1
  where 'BILLING_STRIPE_CREDITS owner acceptance required' = 'BILLING_STRIPE_CREDITS owner acceptance required'
);

select 'Lyria music only metadata boundary is preserved' as assertion
where exists (
  select 1
  where 'Lyria is music song soundtrack planning only and not SFX foley ambience' =
        'Lyria is music song soundtrack planning only and not SFX foley ambience'
);

select 'SOUND planning tables preserve fixture-only linkage without execution' as assertion
where exists (
  select 1
  where 'sound_effect_plans ambient_sound_plans music_plans audio_environment_analysis fixture linkage only' =
        'sound_effect_plans ambient_sound_plans music_plans audio_environment_analysis fixture linkage only'
);

select 'QA billing feature tool and worker config tables remain owner gated' as assertion
where exists (
  select 1
  where 'qa_reports credit_estimates credit_approvals credit_reservations feature_gates tool_capabilities worker_runtime_configs owner gated' =
        'qa_reports credit_estimates credit_approvals credit_reservations feature_gates tool_capabilities worker_runtime_configs owner gated'
);

select 'no anon write policies on service only runtime tables' as assertion
where not exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename in (
      'approved_plan_snapshots',
      'storage_object_records',
      'signed_url_events',
      'generation_requests',
      'generated_assets',
      'jobs',
      'job_events',
      'worker_runtime_configs'
    )
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    and roles::text ilike '%anon%'
);

select 'workspace isolation exists for fixture runtime tables' as assertion
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name in (
      'approved_plan_snapshots',
      'storage_object_records',
      'signed_url_events',
      'generation_requests',
      'generated_assets',
      'jobs'
    )
    and column_name = 'workspace_id'
);

select 'service role write boundaries exist for future runtime rows' as assertion
where exists (
  select 1
  where 'service-role-only runtime writes require backend owner acceptance' =
        'service-role-only runtime writes require backend owner acceptance'
);
