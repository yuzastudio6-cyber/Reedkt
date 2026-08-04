-- Canonical V3 local-only forward repair: enqueue allocates plan versions per
-- study session, so its serialization boundary must be the study session too.
-- A run-scoped lock alone allows two different runs to calculate the same
-- (study_session_id, plan_version). Keep the existing run lock as a narrower
-- replay fence and acquire this study fence first for every enqueue request.

create or replace function public.reeditpro_pre_plan_assert_request(
  p_contract_version text,
  p_operation text,
  p_request jsonb
)
returns void
language plpgsql
volatile
strict
set search_path = pg_catalog, public
as $$
declare
  study_session_uuid uuid;
begin
  if p_contract_version <> 'canonical-distributed-pre-plan-study-state-port-v1'
    or jsonb_typeof(p_request) <> 'object'
    or coalesce(p_request->>'runId', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    or coalesce(p_request->>'studyIdentityHash', '') !~ '^[a-f0-9]{64}$'
    or length(coalesce(p_request->>'idempotencyKey', '')) < 16
    or length(coalesce(p_request->>'idempotencyKey', '')) > 240
    or coalesce(p_request->>'idempotencyKey', '')
      !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    or coalesce(p_request->>'idempotencyKey', '') like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_pre_plan_request_hash(p_operation, p_request) then
    raise exception using errcode = '22023', message = 'PRE_PLAN_REQUEST_CONTRACT_INVALID';
  end if;

  perform public.reeditpro_pre_plan_assert_local_internal_authority(p_request);

  if p_operation = 'enqueue' then
    begin
      study_session_uuid :=
        (p_request->'seed'->'identity'->>'studySessionId')::uuid;
    exception when others then
      raise exception using
        errcode = '22023', message = 'PRE_PLAN_STUDY_CONCURRENCY_IDENTITY_INVALID';
    end;
    if study_session_uuid is null then
      raise exception using
        errcode = '22023', message = 'PRE_PLAN_STUDY_CONCURRENCY_IDENTITY_INVALID';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(
      'canonical_pre_plan_study_enqueue:' || study_session_uuid::text,
      0
    ));
  end if;
end;
$$;

revoke all on function public.reeditpro_pre_plan_assert_request(text, text, jsonb)
  from public, anon, authenticated, service_role;
