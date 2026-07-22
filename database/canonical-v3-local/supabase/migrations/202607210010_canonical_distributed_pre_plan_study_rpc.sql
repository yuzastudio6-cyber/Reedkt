-- Canonical V3 local-only distributed pre-plan study transaction proof.
-- This forward migration binds the fixed seven-operation server RPC contract
-- to the existing V6 long-form tables. It is intentionally non-production:
-- no remote Supabase project, provider, cloud worker, object read, billing, or
-- approved-edit snapshot/credit authority is created here.

alter table public.preference_long_form_study_runs
  drop constraint preference_long_form_study_runs_revision_check,
  add constraint preference_long_form_study_runs_revision_check check (revision >= 0),
  drop constraint preference_long_form_study_runs_status_check,
  add constraint preference_long_form_study_runs_status_check check (
    status in (
      'queued', 'running', 'paused', 'cancellation_requested', 'completed',
      'failed', 'cancelled', 'needs_operator_review'
    )
  );

alter table public.preference_long_form_study_work_items
  drop constraint preference_long_form_study_work_items_status_check,
  add constraint preference_long_form_study_work_items_status_check check (
    status in (
      'queued', 'leased', 'running', 'retry_wait', 'paused', 'completed',
      'failed', 'cancelled', 'blocked'
    )
  );

alter table public.preference_long_form_study_attempts
  drop constraint preference_long_form_study_attempts_status_check,
  add constraint preference_long_form_study_attempts_status_check check (
    status in ('running', 'completed', 'failed', 'timed_out', 'cancelled', 'unknown')
  ),
  alter column usage_digest drop not null,
  alter column finished_at drop not null,
  alter column internal_cost_micros set default 0;

alter table public.preference_long_form_study_work_outputs
  drop constraint preference_long_form_study_work_outputs_study_work_item_id_key,
  alter column storage_generation drop not null,
  alter column storage_etag drop not null;

alter table public.preference_long_form_study_plans
  add column external_plan_id text,
  add column external_plan_version text,
  add column seed_hash text,
  add column study_identity_hash text,
  add column controller_identity_evidence_hash text,
  add column study_usage_approval_id text,
  add column study_usage_approval_digest_sha256 text,
  add column internal_cost_budget_id text,
  add column source_storage_object_id text,
  add column source_storage_object_identity_hash text,
  add column source_size_bytes bigint,
  add column source_duration_milliseconds bigint,
  add column source_mime_type text;

alter table public.preference_long_form_study_runs
  add column external_run_id text,
  add column study_identity_hash text,
  add column audit_chain_head_hash text;

alter table public.preference_long_form_study_work_items
  add column external_work_item_id text,
  add column seed_json jsonb,
  add column stage_id text,
  add column required boolean,
  add column weight_basis_points integer,
  add column execution_kind text,
  add column worker_class text,
  add column maximum_attempts integer,
  add column lease_duration_ms integer,
  add column attempt_deadline_duration_ms integer,
  add column latest_checkpoint_json jsonb,
  add column completed_output_hashes text[] not null default '{}'::text[],
  add column cumulative_internal_cost_micros bigint not null default 0,
  add column active_attempt_id uuid,
  add column blocker_code text;

alter table public.preference_long_form_study_attempts
  add column external_attempt_id text,
  add column lease_id text,
  add column lease_credential_hash_sha256 text,
  add column attempt_start_json jsonb,
  add column attempt_start_hash text,
  add column heartbeat_at timestamptz,
  add column heartbeat_count bigint not null default 0,
  add column lease_expires_at timestamptz,
  add column attempt_deadline_at timestamptz,
  add column latest_checkpoint_json jsonb,
  add column terminal_json jsonb,
  add column worker_identity_evidence_hash text,
  add column worker_receipt_hash text;

alter table public.preference_long_form_study_checkpoints
  add column checkpoint_json jsonb,
  add column progress_basis_points integer;

alter table public.preference_long_form_study_work_outputs
  add column external_output_id text,
  add column output_json jsonb,
  add column storage_object_identity_hash text,
  add column byte_length bigint,
  add column mime_type text,
  add column lineage_hash text;

create unique index preference_long_form_plan_external_identity
  on public.preference_long_form_study_plans(workspace_id, external_plan_id)
  where external_plan_id is not null;
create unique index preference_long_form_run_external_identity
  on public.preference_long_form_study_runs(workspace_id, external_run_id)
  where external_run_id is not null;
create unique index preference_long_form_work_external_identity
  on public.preference_long_form_study_work_items(study_run_id, external_work_item_id)
  where external_work_item_id is not null;
create unique index preference_long_form_attempt_external_identity
  on public.preference_long_form_study_attempts(study_run_id, external_attempt_id)
  where external_attempt_id is not null;
create unique index preference_long_form_output_external_identity
  on public.preference_long_form_study_work_outputs(study_work_item_id, external_output_id)
  where external_output_id is not null;
create unique index preference_long_form_output_storage_identity
  on public.preference_long_form_study_work_outputs(
    workspace_id, storage_object_identity_hash
  )
  where storage_object_identity_hash is not null;
create unique index preference_long_form_one_active_attempt
  on public.preference_long_form_study_attempts(study_work_item_id)
  where status = 'running';

alter table public.preference_long_form_study_runs
  add constraint preference_long_form_run_workspace_identity
  unique (id, workspace_id);
alter table public.preference_long_form_study_attempts
  add constraint preference_long_form_attempt_run_workspace_identity
  unique (id, study_run_id, workspace_id);

create table public.preference_long_form_study_idempotency_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  study_run_id uuid not null,
  operation text not null check (
    operation in (
      'enqueue', 'claim_and_start', 'heartbeat_and_checkpoint', 'complete',
      'fail', 'control', 'recover_expired_lease'
    )
  ),
  idempotency_key_hash text not null check (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  response_json jsonb not null,
  lease_escrow_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, study_run_id, idempotency_key_hash),
  foreign key (study_run_id, workspace_id)
    references public.preference_long_form_study_runs(id, workspace_id) on delete restrict
);

create table public.preference_long_form_study_lease_escrow (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  study_run_id uuid not null,
  study_attempt_id uuid not null,
  lease_credential_hash_sha256 text not null check (lease_credential_hash_sha256 ~ '^[a-f0-9]{64}$'),
  encrypted_credential bytea not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (study_attempt_id),
  foreign key (study_run_id, workspace_id)
    references public.preference_long_form_study_runs(id, workspace_id) on delete restrict,
  foreign key (study_attempt_id, study_run_id, workspace_id)
    references public.preference_long_form_study_attempts(id, study_run_id, workspace_id) on delete restrict
);

alter table public.preference_long_form_study_idempotency_receipts
  add constraint preference_long_form_study_idempotency_escrow_fk
  foreign key (lease_escrow_id)
  references public.preference_long_form_study_lease_escrow(id) on delete restrict;

create table public.preference_long_form_study_audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  study_run_id uuid not null,
  revision bigint not null check (revision >= 1),
  operation text not null,
  transaction_id text not null,
  previous_event_hash text not null check (previous_event_hash ~ '^[a-f0-9]{64}$'),
  event_hash text not null check (event_hash ~ '^[a-f0-9]{64}$'),
  work_item_id uuid,
  attempt_id uuid,
  created_at timestamptz not null,
  unique (study_run_id, revision),
  unique (event_hash),
  foreign key (study_run_id, workspace_id)
    references public.preference_long_form_study_runs(id, workspace_id) on delete restrict
);

drop trigger preference_long_form_attempts_immutable
  on public.preference_long_form_study_attempts;

create or replace function public.reeditpro_lock_pre_plan_attempt()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '55000', message = 'REEDITPRO_PRE_PLAN_ATTEMPT_DELETE_FORBIDDEN';
  end if;
  if old.status <> 'running'
    or new.status not in ('running', 'completed', 'failed', 'timed_out', 'cancelled') then
    raise exception using errcode = '55000', message = 'REEDITPRO_PRE_PLAN_ATTEMPT_MUTATION_INVALID';
  end if;
  if old.id <> new.id
    or old.workspace_id <> new.workspace_id
    or old.study_run_id <> new.study_run_id
    or old.study_work_item_id <> new.study_work_item_id
    or old.external_attempt_id <> new.external_attempt_id
    or old.attempt_start_hash <> new.attempt_start_hash then
    raise exception using errcode = '55000', message = 'REEDITPRO_PRE_PLAN_ATTEMPT_IDENTITY_CHANGED';
  end if;
  if new.status = 'running' and new.terminal_json is not null then
    raise exception using errcode = '55000', message = 'REEDITPRO_PRE_PLAN_RUNNING_TERMINAL_INVALID';
  end if;
  return new;
end;
$$;

create trigger preference_long_form_attempts_terminal_lock
  before update or delete on public.preference_long_form_study_attempts
  for each row execute function public.reeditpro_lock_pre_plan_attempt();

create trigger preference_long_form_idempotency_immutable
  before update or delete on public.preference_long_form_study_idempotency_receipts
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_escrow_immutable
  before update or delete on public.preference_long_form_study_lease_escrow
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_long_form_audit_immutable
  before update or delete on public.preference_long_form_study_audit_events
  for each row execute function public.reeditpro_reject_row_mutation();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'preference_long_form_study_idempotency_receipts',
    'preference_long_form_study_lease_escrow',
    'preference_long_form_study_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format(
      'revoke all on table public.%I from public, anon, authenticated, service_role',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.reeditpro_pre_plan_hash(p_domain text, p_payload jsonb)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', p_domain,
    'payload', p_payload
  ));
$$;

create or replace function public.reeditpro_pre_plan_idempotency_key_hash(p_value text)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_pre_plan_study_idempotency_key_v1',
    'value', p_value
  ));
$$;

create or replace function public.reeditpro_pre_plan_lease_hash(p_value text)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_pre_plan_study_lease_credential_v1',
    'value', p_value
  ));
$$;

create or replace function public.reeditpro_pre_plan_request_hash(
  p_operation text,
  p_request jsonb
)
returns text
language plpgsql
immutable
strict
set search_path = pg_catalog, public
as $$
declare payload jsonb;
begin
  payload := p_request - 'idempotencyKey' - 'requestHash' - 'leaseCredential';
  if p_request ? 'leaseCredential' then
    payload := payload || jsonb_build_object(
      'leaseCredentialHashSha256',
      public.reeditpro_pre_plan_lease_hash(p_request->>'leaseCredential')
    );
  end if;
  return public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_pre_plan_study_request_v1',
    'operation', p_operation,
    'payload', payload
  ));
end;
$$;

create or replace function public.reeditpro_constant_time_hex_equal(
  p_left text,
  p_right text
)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  position_index integer;
  difference integer := 0;
begin
  if p_left !~ '^[a-f0-9]{64}$' or p_right !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  for position_index in 1..64 loop
    difference := difference |
      (ascii(substr(p_left, position_index, 1)) #
       ascii(substr(p_right, position_index, 1)));
  end loop;
  return difference = 0;
end;
$$;

create or replace function public.reeditpro_pre_plan_assert_local_internal_authority(
  p_request jsonb
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  headers jsonb;
  host_value text;
  port_value text;
  provided_signature text;
  local_secret text;
  expected_signature text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    headers := null;
  end;
  host_value := lower(coalesce(headers->>'x-forwarded-host', ''));
  port_value := coalesce(headers->>'x-forwarded-port', '');
  provided_signature := lower(coalesce(
    headers->>'x-reeditpro-local-pre-plan-authority', ''
  ));
  local_secret := nullif(current_setting('app.settings.jwt_secret', true), '');
  if host_value not in ('127.0.0.1', 'localhost')
    or port_value <> '57431'
    or coalesce(length(local_secret), 0) < 32
    or provided_signature !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '42501', message = 'PRE_PLAN_LOCAL_INTERNAL_AUTHORITY_REQUIRED';
  end if;
  expected_signature := encode(extensions.hmac(
    'canonical_pre_plan_local_internal_v1:'
      || (p_request->>'requestHash') || ':'
      || public.reeditpro_pre_plan_idempotency_key_hash(
        p_request->>'idempotencyKey'
      ),
    local_secret,
    'sha256'
  ), 'hex');
  if not public.reeditpro_constant_time_hex_equal(
    provided_signature,
    expected_signature
  ) then
    raise exception using
      errcode = '42501', message = 'PRE_PLAN_LOCAL_INTERNAL_AUTHORITY_REQUIRED';
  end if;
end;
$$;

create or replace function public.reeditpro_pre_plan_escrow_secret()
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  local_secret text;
begin
  local_secret := nullif(current_setting('reeditpro.local_pre_plan_escrow_key', true), '');
  if coalesce(length(local_secret), 0) < 32 then
    local_secret := nullif(current_setting('app.settings.jwt_secret', true), '');
  end if;
  if length(local_secret) >= 32 then
    return public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_pre_plan_local_escrow_session_v1',
      'secret', local_secret
    ));
  end if;
  raise exception using errcode = '42501', message = 'PRE_PLAN_LOCAL_ESCROW_AUTHORITY_REQUIRED';
end;
$$;

create or replace function public.reeditpro_pre_plan_boundaries()
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'serviceOnly', true,
    'authorityClass', 'pre_plan_edit_reference_long_form_study',
    'authenticatedTenantDerivedServerSide', true,
    'exactReferenceStudySourceAndPlanBindingRequired', true,
    'approvedPlanSnapshotRequired', false,
    'approvedCreditReservationRequired', false,
    'approvedEditAuthorityFabricated', false,
    'workGraphServerDerived', true,
    'callerSelectedWorkItemAttemptLeaseExpiryCostOrRetryAllowed', false,
    'oneActiveDigestOnlyLeasePerWorkItem', true,
    'heartbeatAndCheckpointShareTransaction', true,
    'terminalOutputAndUsageShareTransaction', true,
    'exactDurableResponseAssociationRequired', true,
    'rawMediaSignedUrlProviderCredentialOrLocalPathPersisted', false,
    'providerAndInfrastructureInternalCostSeparated', true,
    'customerPriceCreditsServiceFeeWalletBillingOrSettlementIncluded', false,
    'automaticRetryStarted', false,
    'browserClaimAllowed', false,
    'browserSessionRequiredForCompletion', false,
    'fixedWholeStudyTimeoutApplied', false,
    'workerDispatchPerformed', false,
    'providerCallPerformed', false,
    'cloudCallPerformed', false,
    'productionAuthority', false
  );
$$;

create or replace function public.reeditpro_pre_plan_attempt_view(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  attempt_row public.preference_long_form_study_attempts%rowtype;
  value_without_hash jsonb;
begin
  select * into strict attempt_row
  from public.preference_long_form_study_attempts
  where id = p_attempt_id;
  value_without_hash := jsonb_build_object(
    'attemptStart', attempt_row.attempt_start_json,
    'state', attempt_row.status,
    'heartbeatAt', public.reeditpro_iso_timestamp(attempt_row.heartbeat_at),
    'heartbeatCount', attempt_row.heartbeat_count,
    'leaseExpiresAt', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at),
    'latestCheckpoint', attempt_row.latest_checkpoint_json,
    'terminal', attempt_row.terminal_json
  );
  return value_without_hash || jsonb_build_object(
    'attemptHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_attempt_view_v1',
      value_without_hash
    )
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_work_item_view(p_work_item_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  work_row public.preference_long_form_study_work_items%rowtype;
  active_external_id text;
begin
  select * into strict work_row
  from public.preference_long_form_study_work_items
  where id = p_work_item_id;
  if work_row.active_attempt_id is not null then
    select external_attempt_id into active_external_id
    from public.preference_long_form_study_attempts
    where id = work_row.active_attempt_id;
  end if;
  return jsonb_build_object(
    'workItemId', work_row.external_work_item_id,
    'sequence', work_row.sequence,
    'stageId', work_row.stage_id,
    'required', work_row.required,
    'workerClass', work_row.worker_class,
    'dependencyWorkItemIds', coalesce(
      work_row.seed_json->'dependencyWorkItemIds', '[]'::jsonb
    ),
    'state', case work_row.status
      when 'leased' then 'running'
      when 'paused' then 'queued'
      when 'failed' then 'blocked'
      else work_row.status
    end,
    'attemptCount', work_row.attempt_count,
    'maximumAttempts', work_row.maximum_attempts,
    'remainingAttempts', greatest(0, work_row.maximum_attempts - work_row.attempt_count),
    'latestCheckpoint', work_row.latest_checkpoint_json,
    'completedOutputHashes', to_jsonb(work_row.completed_output_hashes),
    'cumulativeInternalCostMicros', work_row.cumulative_internal_cost_micros::text,
    'activeAttemptId', active_external_id,
    'blockerCode', work_row.blocker_code,
    'workItemHash', work_row.seed_json->>'workItemHash'
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_run_view(p_run_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  value_without_hash jsonb;
  total_count bigint;
  completed_count bigint;
  running_count bigint;
  blocked_count bigint;
  completed_weight bigint;
  cumulative_cost bigint;
begin
  select * into strict run_row
  from public.preference_long_form_study_runs
  where id = p_run_id;
  select * into strict plan_row
  from public.preference_long_form_study_plans
  where id = run_row.study_plan_id;
  select
    count(*),
    count(*) filter (where status = 'completed'),
    count(*) filter (where status in ('leased', 'running')),
    count(*) filter (where status in ('blocked', 'failed')),
    coalesce(sum(weight_basis_points) filter (where status = 'completed'), 0),
    coalesce(sum(cumulative_internal_cost_micros), 0)
  into total_count, completed_count, running_count, blocked_count,
    completed_weight, cumulative_cost
  from public.preference_long_form_study_work_items
  where study_run_id = p_run_id;
  value_without_hash := jsonb_build_object(
    'runId', run_row.external_run_id,
    'planId', plan_row.external_plan_id,
    'planDigestSha256', plan_row.plan_digest,
    'studyIdentityHash', run_row.study_identity_hash,
    'state', case run_row.status when 'failed' then 'needs_operator_review' else run_row.status end,
    'revision', run_row.revision,
    'totalWorkItemCount', total_count,
    'completedWorkItemCount', completed_count,
    'runningWorkItemCount', running_count,
    'blockedWorkItemCount', blocked_count,
    'completedWeightBasisPoints', completed_weight,
    'cumulativeInternalCostMicros', cumulative_cost::text,
    'maximumAuthorizedInternalCostMicros',
      plan_row.maximum_authorized_internal_cost_micros::text,
    'pauseRequestedAt', case when run_row.pause_requested_at is null then null
      else public.reeditpro_iso_timestamp(run_row.pause_requested_at) end,
    'cancelRequestedAt', case when run_row.cancel_requested_at is null then null
      else public.reeditpro_iso_timestamp(run_row.cancel_requested_at) end,
    'recoveryGeneration', run_row.recovery_generation,
    'automaticRetryStarted', false,
    'browserSessionRequiredForCompletion', false,
    'wholeStudyTimeoutApplied', false
  );
  return value_without_hash || jsonb_build_object(
    'runHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_run_view_v1',
      value_without_hash
    )
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_replay(
  p_run_id uuid,
  p_operation text,
  p_idempotency_key_hash text,
  p_request_hash text,
  p_include_lease boolean
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  receipt_row public.preference_long_form_study_idempotency_receipts%rowtype;
  escrow_row public.preference_long_form_study_lease_escrow%rowtype;
  credential text;
begin
  select * into receipt_row
  from public.preference_long_form_study_idempotency_receipts
  where study_run_id = p_run_id
    and idempotency_key_hash = p_idempotency_key_hash;
  if not found then return null; end if;
  if receipt_row.operation <> p_operation or receipt_row.request_hash <> p_request_hash then
    raise exception using errcode = '40001', message = 'PRE_PLAN_IDEMPOTENCY_CONFLICT';
  end if;
  credential := null;
  if p_include_lease and receipt_row.lease_escrow_id is not null then
    select * into strict escrow_row
    from public.preference_long_form_study_lease_escrow
    where id = receipt_row.lease_escrow_id;
    if escrow_row.expires_at <= clock_timestamp()
      or not exists (
        select 1
        from public.preference_long_form_study_attempts attempt
        where attempt.id = escrow_row.study_attempt_id
          and attempt.status = 'running'
      ) then
      raise exception using
        errcode = '40001', message = 'PRE_PLAN_LEASE_REPLAY_EXPIRED_OR_TERMINAL';
    end if;
    credential := extensions.pgp_sym_decrypt(
      escrow_row.encrypted_credential,
      public.reeditpro_pre_plan_escrow_secret()
    );
    if public.reeditpro_pre_plan_lease_hash(credential)
      <> escrow_row.lease_credential_hash_sha256 then
      raise exception using errcode = '55000', message = 'PRE_PLAN_ESCROW_INTEGRITY_FAILED';
    end if;
  end if;
  return jsonb_build_object(
    'idempotencyStatus', 'exact_replay',
    'response', receipt_row.response_json,
    'transientLeaseCredential', credential
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_commit_mutation(
  p_run_id uuid,
  p_operation text,
  p_request jsonb,
  p_work_item_id uuid,
  p_attempt_id uuid,
  p_committed_at timestamptz,
  p_revision_before bigint,
  p_transient_lease_credential text default null,
  p_credential_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  workspace_uuid uuid;
  transaction_id text;
  previous_audit_hash text;
  audit_event_hash text;
  idempotency_hash text;
  transaction_without_hash jsonb;
  transaction_value jsonb;
  response_without_hash jsonb;
  response_value jsonb;
  escrow_uuid uuid;
begin
  update public.preference_long_form_study_runs
  set revision = p_revision_before + 1,
      updated_at = clock_timestamp()
  where id = p_run_id and revision = p_revision_before
  returning * into run_row;
  if not found then
    raise exception using errcode = '40001', message = 'PRE_PLAN_RUN_REVISION_CHANGED';
  end if;
  workspace_uuid := run_row.workspace_id;
  idempotency_hash := public.reeditpro_pre_plan_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  transaction_id := 'pre_plan_study_tx-' || substr(public.reeditpro_sha256_json(
    jsonb_build_object(
      'runId', run_row.external_run_id,
      'operation', p_operation,
      'revisionAfter', run_row.revision,
      'requestHash', p_request->>'requestHash'
    )
  ), 1, 48);
  previous_audit_hash := run_row.audit_chain_head_hash;
  audit_event_hash := public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_pre_plan_study_audit_event_v1',
    'previousAuditEventHash', previous_audit_hash,
    'runId', run_row.external_run_id,
    'studyIdentityHash', run_row.study_identity_hash,
    'operation', p_operation,
    'transactionId', transaction_id,
    'workItemId', case when p_work_item_id is null then null else
      (select external_work_item_id from public.preference_long_form_study_work_items
       where id = p_work_item_id) end,
    'attemptId', case when p_attempt_id is null then null else
      (select external_attempt_id from public.preference_long_form_study_attempts
       where id = p_attempt_id) end,
    'revisionAfter', run_row.revision
  ));
  update public.preference_long_form_study_runs
    set audit_chain_head_hash = audit_event_hash
    where id = p_run_id;
  insert into public.preference_long_form_study_audit_events (
    workspace_id, study_run_id, revision, operation, transaction_id,
    previous_event_hash, event_hash, work_item_id, attempt_id, created_at
  ) values (
    workspace_uuid, p_run_id, run_row.revision, p_operation, transaction_id,
    previous_audit_hash, audit_event_hash, p_work_item_id, p_attempt_id, p_committed_at
  );
  transaction_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-transaction-v1',
    'transactionId', transaction_id,
    'operation', p_operation,
    'runId', run_row.external_run_id,
    'studyIdentityHash', run_row.study_identity_hash,
    'revisionBefore', p_revision_before,
    'revisionAfter', run_row.revision,
    'requestHash', p_request->>'requestHash',
    'idempotencyKeyHash', idempotency_hash,
    'auditEventHash', audit_event_hash,
    'committedAt', public.reeditpro_iso_timestamp(p_committed_at)
  );
  transaction_value := transaction_without_hash || jsonb_build_object(
    'transactionHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_transaction_v1',
      transaction_without_hash
    )
  );
  response_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-state-response-v1',
    'operation', p_operation,
    'transaction', transaction_value,
    'run', public.reeditpro_pre_plan_run_view(p_run_id),
    'workItem', case when p_work_item_id is null then null
      else public.reeditpro_pre_plan_work_item_view(p_work_item_id) end,
    'attempt', case when p_attempt_id is null then null
      else public.reeditpro_pre_plan_attempt_view(p_attempt_id) end,
    'boundaries', public.reeditpro_pre_plan_boundaries()
  );
  response_value := response_without_hash || jsonb_build_object(
    'responseHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_mutation_response_v1',
      response_without_hash
    )
  );
  if p_transient_lease_credential is not null then
    if p_credential_expires_at is null
      or public.reeditpro_pre_plan_lease_hash(p_transient_lease_credential)
        <> (select lease_credential_hash_sha256
            from public.preference_long_form_study_attempts where id = p_attempt_id) then
      raise exception using errcode = '55000', message = 'PRE_PLAN_LEASE_ESCROW_BINDING_INVALID';
    end if;
    insert into public.preference_long_form_study_lease_escrow (
      workspace_id, study_run_id, study_attempt_id,
      lease_credential_hash_sha256, encrypted_credential, expires_at
    ) values (
      workspace_uuid, p_run_id, p_attempt_id,
      public.reeditpro_pre_plan_lease_hash(p_transient_lease_credential),
      extensions.pgp_sym_encrypt(
        p_transient_lease_credential,
        public.reeditpro_pre_plan_escrow_secret(),
        'cipher-algo=aes256,compress-algo=0'
      ),
      p_credential_expires_at
    ) returning id into escrow_uuid;
  end if;
  insert into public.preference_long_form_study_idempotency_receipts (
    workspace_id, study_run_id, operation, idempotency_key_hash,
    request_hash, response_json, lease_escrow_id
  ) values (
    workspace_uuid, p_run_id, p_operation, idempotency_hash,
    p_request->>'requestHash', response_value, escrow_uuid
  );
  return jsonb_build_object(
    'idempotencyStatus', 'inserted',
    'response', response_value,
    'transientLeaseCredential', p_transient_lease_credential
  );
end;
$$;

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
end;
$$;

create or replace function public.reeditpro_enqueue_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  seed jsonb;
  identity_value jsonb;
  workspace_uuid uuid;
  reference_uuid uuid;
  study_uuid uuid;
  source_asset_uuid uuid;
  plan_uuid uuid;
  run_uuid uuid;
  existing_run public.preference_long_form_study_runs%rowtype;
  replay jsonb;
  work_value jsonb;
  plan_version_number bigint;
  dependency_count bigint;
  declared_dependency_count bigint;
  weight_total bigint;
  maximum_cost bigint;
  work_budget bigint;
  source_row public.preference_assets%rowtype;
begin
  perform public.reeditpro_pre_plan_assert_request(
    p_contract_version, 'enqueue', p_request
  );
  seed := p_request->'seed';
  identity_value := seed->'identity';
  begin
    workspace_uuid := (identity_value->>'workspaceId')::uuid;
    reference_uuid := (identity_value->>'editReferenceId')::uuid;
    study_uuid := (identity_value->>'studySessionId')::uuid;
    source_asset_uuid := (identity_value->>'sourceAssetId')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'PRE_PLAN_LOCAL_IDENTITY_UUID_REQUIRED';
  end;
  if auth.uid() is null
    or auth.uid()::text <> identity_value->>'ownerUserId'
    or not public.reeditpro_has_workspace_write_access(workspace_uuid) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  if identity_value->>'authorityClass' <> 'pre_plan_edit_reference_long_form_study'
    or identity_value->>'persistenceContractVersion' <>
      'edit-reference-production-persistence-contract-v6'
    or identity_value->>'identityHash' <> public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_identity_v1',
      identity_value - 'identityHash'
    )
    or seed->>'seedHash' <> public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_seed_v1', seed - 'seedHash'
    )
    or p_request->>'studyIdentityHash' <> identity_value->>'identityHash'
    or p_request->>'runId' <> seed->>'runId'
    or seed->>'currency' <> 'USD'
    or coalesce((seed->>'wholeStudyTimeoutApplied')::boolean, true)
    or coalesce((seed->>'browserSessionRequiredForCompletion')::boolean, true)
    or jsonb_array_length(coalesce(seed->'workItems', '[]'::jsonb)) not between 1 and 256 then
    raise exception using errcode = '22023', message = 'PRE_PLAN_SEED_AUTHORITY_INVALID';
  end if;
  select * into strict source_row
  from public.preference_assets
  where id = source_asset_uuid
    and workspace_id = workspace_uuid
    and edit_reference_id = reference_uuid
    and study_session_id = study_uuid;
  if source_row.storage_object_id <> identity_value->>'sourceStorageObjectId'
    or source_row.checksum_sha256 <> identity_value->>'sourceChecksumSha256'
    or source_row.asset_kind <> 'source'
    or coalesce(identity_value->>'sourceMimeType', '')
      !~ '^video/[A-Za-z0-9.+-]{1,120}$'
    or coalesce(identity_value->>'sourceSizeBytes', '') !~ '^[1-9][0-9]*$'
    or coalesce(identity_value->>'sourceDurationMilliseconds', '')
      !~ '^[1-9][0-9]*$'
    or coalesce(source_row.metadata_json->>'sizeBytes', '') !~ '^[1-9][0-9]*$'
    or coalesce(source_row.metadata_json->>'durationSeconds', '')
      !~ '^[1-9][0-9]*$'
    or (source_row.metadata_json->>'sizeBytes')::bigint <>
      (identity_value->>'sourceSizeBytes')::bigint
    or (source_row.metadata_json->>'durationSeconds')::bigint * 1000 <>
      (identity_value->>'sourceDurationMilliseconds')::bigint
    or identity_value->>'sourceStorageObjectIdentityHash' <>
      public.reeditpro_pre_plan_hash(
        'canonical_v3_local_preference_asset_storage_identity_v1',
        jsonb_build_object(
          'workspaceId', source_row.workspace_id::text,
          'assetId', source_row.id::text,
          'storageObjectId', source_row.storage_object_id,
          'storageGeneration', source_row.storage_generation,
          'storageEtag', source_row.storage_etag,
          'checksumSha256', source_row.checksum_sha256
        )
      )
    or not exists (
      select 1 from public.edit_references reference
      where reference.id = reference_uuid
        and reference.workspace_id = workspace_uuid
        and reference.owner_user_id = auth.uid()
    ) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_SOURCE_LINEAGE_INVALID';
  end if;
  select coalesce(sum((item->>'weightBasisPoints')::bigint), 0),
    coalesce(sum(
      (item->>'maximumAttempts')::bigint
      * (item->>'maximumAuthorizedInternalCostMicrosPerAttempt')::bigint
    ), 0)
  into weight_total, work_budget
  from jsonb_array_elements(seed->'workItems') item;
  maximum_cost := (seed->>'maximumAuthorizedInternalCostMicros')::bigint;
  if weight_total <> 10000 or work_budget > maximum_cost or maximum_cost <= 0 then
    raise exception using errcode = '22023', message = 'PRE_PLAN_WORK_GRAPH_BUDGET_INVALID';
  end if;
  for work_value in select value from jsonb_array_elements(seed->'workItems') loop
    if work_value->>'workItemHash' <> public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_work_item_v1',
      work_value - 'workItemHash'
    )
      or (work_value->>'sequence')::integer not between 1 and 256
      or (work_value->>'maximumAttempts')::integer not between 1 and 10
      or (work_value->>'leaseDurationMs')::integer not between 30000 and 900000
      or (work_value->>'attemptDeadlineDurationMs')::integer <
        (work_value->>'leaseDurationMs')::integer
      or (work_value->>'executionKind' = 'deterministic_tool') <>
        (work_value->>'modelId' is null)
      or jsonb_array_length(work_value->'dependencyWorkItemIds') <>
        (select count(distinct dependency.value)
         from jsonb_array_elements_text(
           work_value->'dependencyWorkItemIds'
         ) dependency)
      or exists (
        select 1
        from jsonb_array_elements_text(work_value->'dependencyWorkItemIds') dependency
        where dependency.value = work_value->>'workItemId'
          or not exists (
            select 1 from jsonb_array_elements(seed->'workItems') candidate
            where candidate->>'workItemId' = dependency.value
              and (candidate->>'sequence')::integer < (work_value->>'sequence')::integer
          )
      ) then
      raise exception using errcode = '22023', message = 'PRE_PLAN_WORK_GRAPH_INVALID';
    end if;
  end loop;

  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select run.* into existing_run
  from public.preference_long_form_study_runs run
  where run.workspace_id = workspace_uuid
    and run.external_run_id = p_request->>'runId';
  if found then
    select public.reeditpro_pre_plan_replay(
      existing_run.id,
      'enqueue',
      public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
      p_request->>'requestHash',
      false
    ) into replay;
    if replay is not null then return replay; end if;
    raise exception using errcode = '40001', message = 'PRE_PLAN_RUN_ALREADY_EXISTS';
  end if;

  select coalesce(max(plan_version), 0) + 1 into plan_version_number
  from public.preference_long_form_study_plans
  where study_session_id = study_uuid;
  insert into public.preference_long_form_study_plans (
    workspace_id, edit_reference_id, study_session_id, source_asset_id,
    plan_version, plan_digest, source_checksum_sha256,
    rate_card_snapshot_digest, maximum_authorized_internal_cost_micros,
    currency, study_usage_approval_status, plan_json, external_plan_id,
    external_plan_version, seed_hash, study_identity_hash,
    controller_identity_evidence_hash, study_usage_approval_id,
    study_usage_approval_digest_sha256, internal_cost_budget_id,
    source_storage_object_id, source_storage_object_identity_hash,
    source_size_bytes, source_duration_milliseconds, source_mime_type
  ) values (
    workspace_uuid, reference_uuid, study_uuid, source_asset_uuid,
    plan_version_number, seed->>'planDigestSha256',
    identity_value->>'sourceChecksumSha256',
    public.reeditpro_sha256_json(jsonb_build_object(
      'provider', (select jsonb_agg(item->>'providerRateCardSnapshotDigestSha256'
        order by (item->>'sequence')::integer) from jsonb_array_elements(seed->'workItems') item),
      'infrastructure', (select jsonb_agg(item->>'infrastructureRateCardSnapshotDigestSha256'
        order by (item->>'sequence')::integer) from jsonb_array_elements(seed->'workItems') item)
    )),
    maximum_cost, 'USD', 'approved', seed,
    seed->>'planId', seed->>'planVersion', seed->>'seedHash',
    identity_value->>'identityHash', p_request->>'controllerIdentityEvidenceHash',
    seed->>'studyUsageApprovalId', seed->>'studyUsageApprovalDigestSha256',
    seed->>'internalCostBudgetId', identity_value->>'sourceStorageObjectId',
    identity_value->>'sourceStorageObjectIdentityHash',
    (identity_value->>'sourceSizeBytes')::bigint,
    (identity_value->>'sourceDurationMilliseconds')::bigint,
    identity_value->>'sourceMimeType'
  ) returning id into plan_uuid;

  insert into public.preference_long_form_study_runs (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    revision, status, external_run_id, study_identity_hash, audit_chain_head_hash
  ) values (
    workspace_uuid, reference_uuid, study_uuid, plan_uuid,
    0, 'queued', seed->>'runId', identity_value->>'identityHash',
    public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_distributed_pre_plan_study_audit_genesis_v1',
      'runId', seed->>'runId',
      'seedHash', seed->>'seedHash'
    ))
  ) returning id into run_uuid;

  insert into public.preference_long_form_study_work_items (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, sequence, work_type, dependency_digest,
    idempotency_key_hash, status, maximum_authorized_internal_cost_micros,
    external_work_item_id, seed_json, stage_id, required,
    weight_basis_points, execution_kind, worker_class, maximum_attempts,
    lease_duration_ms, attempt_deadline_duration_ms
  )
  select
    workspace_uuid, reference_uuid, study_uuid, plan_uuid, run_uuid,
    (item->>'sequence')::bigint, item->>'operationId',
    public.reeditpro_sha256_json(coalesce(item->'dependencyWorkItemIds', '[]'::jsonb)),
    public.reeditpro_pre_plan_idempotency_key_hash(item->>'workItemId'),
    'queued', (item->>'maximumAuthorizedInternalCostMicrosPerAttempt')::bigint,
    item->>'workItemId', item, item->>'stageId', (item->>'required')::boolean,
    (item->>'weightBasisPoints')::integer, item->>'executionKind',
    item->>'workerClass', (item->>'maximumAttempts')::integer,
    (item->>'leaseDurationMs')::integer,
    (item->>'attemptDeadlineDurationMs')::integer
  from jsonb_array_elements(seed->'workItems') item;

  update public.preference_long_form_study_work_items work
  set dependency_ids = coalesce((
        select array_agg(dependency.id order by dependency.sequence)
        from jsonb_array_elements_text(work.seed_json->'dependencyWorkItemIds') declared
        join public.preference_long_form_study_work_items dependency
          on dependency.study_run_id = run_uuid
         and dependency.external_work_item_id = declared.value
      ), '{}'::uuid[]),
      dependency_sequences = coalesce((
        select array_agg(dependency.sequence order by dependency.sequence)
        from jsonb_array_elements_text(work.seed_json->'dependencyWorkItemIds') declared
        join public.preference_long_form_study_work_items dependency
          on dependency.study_run_id = run_uuid
         and dependency.external_work_item_id = declared.value
      ), '{}'::bigint[])
  where work.study_run_id = run_uuid;
  select count(*), coalesce(sum(jsonb_array_length(seed_json->'dependencyWorkItemIds')), 0)
  into dependency_count, declared_dependency_count
  from public.preference_long_form_study_work_items
  where study_run_id = run_uuid;
  if exists (
    select 1 from public.preference_long_form_study_work_items
    where study_run_id = run_uuid
      and cardinality(dependency_ids) <> jsonb_array_length(seed_json->'dependencyWorkItemIds')
  ) then
    raise exception using errcode = '22023', message = 'PRE_PLAN_DEPENDENCY_BINDING_INVALID';
  end if;
  return public.reeditpro_pre_plan_commit_mutation(
    run_uuid, 'enqueue', p_request, null, null,
    (p_request->>'requestedAt')::timestamptz, 0
  );
end;
$$;

create or replace function public.reeditpro_claim_and_start_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  attempt_uuid uuid;
  attempt_number_value integer;
  attempt_external_id text;
  lease_id_value text;
  lease_credential text;
  lease_hash text;
  started_at_value timestamptz;
  initial_expiry timestamptz;
  deadline_at timestamptz;
  attempt_start_without_hash jsonb;
  attempt_start_value jsonb;
  replay jsonb;
begin
  perform public.reeditpro_pre_plan_assert_request(
    p_contract_version, 'claim_and_start', p_request
  );
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select run.* into strict run_row
  from public.preference_long_form_study_runs run
  where run.external_run_id = p_request->>'runId'
    and run.study_identity_hash = p_request->>'studyIdentityHash';
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'claim_and_start',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', true
  ) into replay;
  if replay is not null then return replay; end if;
  if run_row.status not in ('queued', 'running') then
    raise exception using errcode = '40001', message = 'PRE_PLAN_RUN_NOT_CLAIMABLE';
  end if;
  select work.* into work_row
  from public.preference_long_form_study_work_items work
  where work.study_run_id = run_row.id
    and work.status in ('queued', 'retry_wait')
    and work.worker_class = p_request->>'workerClass'
    and work.active_attempt_id is null
    and not exists (
      select 1 from unnest(work.dependency_ids) dependency_id
      join public.preference_long_form_study_work_items dependency
        on dependency.id = dependency_id
      where dependency.status <> 'completed'
    )
  order by work.sequence, work.external_work_item_id
  for update skip locked
  limit 1;
  if not found or work_row.attempt_count >= work_row.maximum_attempts then
    raise exception using errcode = '40001', message = 'PRE_PLAN_WORK_NOT_READY';
  end if;
  attempt_number_value := work_row.attempt_count + 1;
  started_at_value := (p_request->>'acceptedAt')::timestamptz;
  initial_expiry := started_at_value + make_interval(
    secs => work_row.lease_duration_ms::double precision / 1000.0
  );
  deadline_at := started_at_value + make_interval(
    secs => work_row.attempt_deadline_duration_ms::double precision / 1000.0
  );
  attempt_external_id := 'pre_plan_study_attempt-' || substr(public.reeditpro_sha256_json(
    jsonb_build_object(
      'runId', run_row.external_run_id,
      'workItemId', work_row.external_work_item_id,
      'attemptNumber', attempt_number_value
    )
  ), 1, 48);
  lease_id_value := 'pre_plan_study_lease-' || substr(public.reeditpro_sha256_json(
    jsonb_build_object('attemptId', attempt_external_id)
  ), 1, 48);
  lease_credential := 'rppsl_v1_' || encode(extensions.gen_random_bytes(32), 'hex');
  lease_hash := public.reeditpro_pre_plan_lease_hash(lease_credential);
  attempt_start_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-attempt-start-v1',
    'attemptId', attempt_external_id,
    'workItemId', work_row.external_work_item_id,
    'attemptNumber', attempt_number_value,
    'leaseId', lease_id_value,
    'leaseCredentialHashSha256', lease_hash,
    'workerClass', p_request->>'workerClass',
    'workerIdentityEvidenceHash', p_request->>'workerIdentityEvidenceHash',
    'workerReceiptHash', p_request->>'workerReceiptHash',
    'capacityAdmissionEvidenceHash', p_request->>'capacityAdmissionEvidenceHash',
    'workItemHash', work_row.seed_json->>'workItemHash',
    'inputBindingHash', work_row.seed_json->>'inputBindingHash',
    'providerRateCardSnapshotDigestSha256',
      work_row.seed_json->>'providerRateCardSnapshotDigestSha256',
    'infrastructureRateCardSnapshotDigestSha256',
      work_row.seed_json->>'infrastructureRateCardSnapshotDigestSha256',
    'maximumAuthorizedInternalCostMicros',
      work_row.seed_json->>'maximumAuthorizedInternalCostMicrosPerAttempt',
    'startedAt', public.reeditpro_iso_timestamp(started_at_value),
    'initialLeaseExpiresAt', public.reeditpro_iso_timestamp(initial_expiry),
    'attemptDeadlineAt', public.reeditpro_iso_timestamp(deadline_at),
    'resumeCheckpointHash', work_row.latest_checkpoint_json->>'checkpointHash',
    'approvedPlanSnapshotRequired', false,
    'approvedCreditReservationRequired', false
  );
  attempt_start_value := attempt_start_without_hash || jsonb_build_object(
    'attemptStartHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_attempt_start_v1',
      attempt_start_without_hash
    )
  );
  insert into public.preference_long_form_study_attempts (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, attempt_number, status, usage_digest,
    provider_cost_micros, infrastructure_cost_micros, internal_cost_micros,
    currency, started_at, finished_at, external_attempt_id, lease_id,
    lease_credential_hash_sha256, attempt_start_json, attempt_start_hash,
    heartbeat_at, heartbeat_count, lease_expires_at, attempt_deadline_at,
    worker_identity_evidence_hash, worker_receipt_hash
  ) values (
    run_row.workspace_id, run_row.edit_reference_id, run_row.study_session_id,
    run_row.study_plan_id, run_row.id, work_row.id, attempt_number_value,
    'running', null, 0, 0, 0, 'USD', started_at_value, null,
    attempt_external_id, lease_id_value, lease_hash, attempt_start_value,
    attempt_start_value->>'attemptStartHash', started_at_value, 0,
    initial_expiry, deadline_at, p_request->>'workerIdentityEvidenceHash',
    p_request->>'workerReceiptHash'
  ) returning id into attempt_uuid;
  update public.preference_long_form_study_work_items
  set status = 'running', attempt_count = attempt_number_value,
      lease_owner_digest = p_request->>'workerIdentityEvidenceHash',
      lease_token_digest = lease_hash, lease_expires_at = initial_expiry,
      active_attempt_id = attempt_uuid, blocker_code = null,
      updated_at = clock_timestamp()
  where id = work_row.id;
  update public.preference_long_form_study_runs
    set status = 'running', updated_at = clock_timestamp()
    where id = run_row.id;
  return public.reeditpro_pre_plan_commit_mutation(
    run_row.id, 'claim_and_start', p_request, work_row.id, attempt_uuid,
    started_at_value, run_row.revision, lease_credential, deadline_at
  );
end;
$$;

create or replace function public.reeditpro_heartbeat_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  attempt_row public.preference_long_form_study_attempts%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  heartbeat_value timestamptz;
  new_expiry timestamptz;
  checkpoint_without_hash jsonb;
  checkpoint_value jsonb;
  replay jsonb;
begin
  perform public.reeditpro_pre_plan_assert_request(
    p_contract_version, 'heartbeat_and_checkpoint', p_request
  );
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select * into strict run_row
  from public.preference_long_form_study_runs
  where external_run_id = p_request->>'runId'
    and study_identity_hash = p_request->>'studyIdentityHash';
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'heartbeat_and_checkpoint',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', false
  ) into replay;
  if replay is not null then return replay; end if;
  select attempt.* into strict attempt_row
  from public.preference_long_form_study_attempts attempt
  where attempt.study_run_id = run_row.id
    and attempt.external_attempt_id = p_request->>'attemptId'
  for update;
  select * into strict work_row
  from public.preference_long_form_study_work_items
  where id = attempt_row.study_work_item_id
  for update;
  heartbeat_value := (p_request->>'heartbeatAt')::timestamptz;
  if attempt_row.status <> 'running'
    or work_row.active_attempt_id <> attempt_row.id
    or attempt_row.worker_identity_evidence_hash <> p_request->>'workerIdentityEvidenceHash'
    or attempt_row.worker_receipt_hash <> p_request->>'workerReceiptHash'
    or attempt_row.lease_credential_hash_sha256 <>
      public.reeditpro_pre_plan_lease_hash(p_request->>'leaseCredential')
    or heartbeat_value <= attempt_row.heartbeat_at
    or heartbeat_value >= attempt_row.lease_expires_at
    or heartbeat_value > attempt_row.attempt_deadline_at
    or (p_request->'checkpoint'->>'checkpointSequence')::bigint <>
      coalesce((work_row.latest_checkpoint_json->>'checkpointSequence')::bigint, 0) + 1
    or (p_request->'checkpoint'->>'progressBasisPoints')::integer <=
      coalesce((work_row.latest_checkpoint_json->>'progressBasisPoints')::integer, 0) then
    raise exception using errcode = '40001', message = 'PRE_PLAN_HEARTBEAT_AUTHORITY_CHANGED';
  end if;
  new_expiry := least(
    heartbeat_value + make_interval(
      secs => work_row.lease_duration_ms::double precision / 1000.0
    ),
    attempt_row.attempt_deadline_at
  );
  if new_expiry <= heartbeat_value then
    raise exception using errcode = '40001', message = 'PRE_PLAN_LEASE_EXPIRED';
  end if;
  checkpoint_without_hash := (p_request->'checkpoint') || jsonb_build_object(
    'attemptId', attempt_row.external_attempt_id,
    'recordedAt', public.reeditpro_iso_timestamp(heartbeat_value)
  );
  checkpoint_value := checkpoint_without_hash || jsonb_build_object(
    'checkpointHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_checkpoint_v1',
      checkpoint_without_hash
    )
  );
  insert into public.preference_long_form_study_checkpoints (
    workspace_id, edit_reference_id, study_session_id, study_plan_id,
    study_run_id, study_work_item_id, study_attempt_id, sequence,
    checkpoint_digest, completed_unit_count, heartbeat_at,
    checkpoint_json, progress_basis_points
  ) values (
    run_row.workspace_id, run_row.edit_reference_id, run_row.study_session_id,
    run_row.study_plan_id, run_row.id, work_row.id, attempt_row.id,
    (p_request->'checkpoint'->>'checkpointSequence')::bigint,
    p_request->'checkpoint'->>'checkpointPayloadDigestSha256',
    (p_request->'checkpoint'->>'progressBasisPoints')::bigint,
    heartbeat_value, checkpoint_value,
    (p_request->'checkpoint'->>'progressBasisPoints')::integer
  );
  update public.preference_long_form_study_attempts
  set heartbeat_at = heartbeat_value,
      heartbeat_count = heartbeat_count + 1,
      lease_expires_at = new_expiry,
      latest_checkpoint_json = checkpoint_value
  where id = attempt_row.id;
  update public.preference_long_form_study_work_items
  set checkpoint_sequence = (p_request->'checkpoint'->>'checkpointSequence')::bigint,
      lease_expires_at = new_expiry,
      latest_checkpoint_json = checkpoint_value,
      updated_at = clock_timestamp()
  where id = work_row.id;
  return public.reeditpro_pre_plan_commit_mutation(
    run_row.id, 'heartbeat_and_checkpoint', p_request, work_row.id,
    attempt_row.id, heartbeat_value, run_row.revision
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_assert_terminal_cost(
  p_run_id uuid,
  p_work_item_id uuid,
  p_attempt_id uuid,
  p_cost jsonb,
  p_finished_at timestamptz,
  p_expected_status text
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  attempt_row public.preference_long_form_study_attempts%rowtype;
  aggregate_cost bigint;
begin
  select * into strict run_row from public.preference_long_form_study_runs where id = p_run_id;
  select * into strict plan_row from public.preference_long_form_study_plans where id = run_row.study_plan_id;
  select * into strict work_row from public.preference_long_form_study_work_items where id = p_work_item_id;
  select * into strict attempt_row from public.preference_long_form_study_attempts where id = p_attempt_id;
  select coalesce(sum(cumulative_internal_cost_micros), 0) into aggregate_cost
  from public.preference_long_form_study_work_items where study_run_id = p_run_id;
  if p_cost->>'evidenceHash' <> public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_attempt_cost_v1',
      p_cost - 'evidenceHash'
    )
    or p_cost->>'schemaVersion' <> 'canonical-distributed-pre-plan-study-attempt-cost-v1'
    or p_cost->>'evidenceStatus' <> p_expected_status
    or p_cost->>'attemptId' <> attempt_row.external_attempt_id
    or p_cost->>'attemptStartHash' <> attempt_row.attempt_start_hash
    or (p_cost->>'startedAt')::timestamptz <> attempt_row.started_at
    or (p_cost->>'finishedAt')::timestamptz <> p_finished_at
    or p_cost->>'approvedUsageEstimateId' <> plan_row.study_usage_approval_id
    or p_cost->>'internalCostBudgetId' <> plan_row.internal_cost_budget_id
    or (p_cost->>'maximumAuthorizedInternalCostMicros')::bigint <>
      work_row.maximum_authorized_internal_cost_micros
    or p_cost->>'providerRateCardSnapshotDigestSha256' <>
      work_row.seed_json->>'providerRateCardSnapshotDigestSha256'
    or p_cost->>'infrastructureRateCardSnapshotDigestSha256' <>
      work_row.seed_json->>'infrastructureRateCardSnapshotDigestSha256'
    or (p_cost->>'providerCostMicros')::bigint
      + (p_cost->>'infrastructureCostMicros')::bigint <>
        (p_cost->>'totalInternalCostMicros')::bigint
    or (p_cost->>'providerCostMicros')::bigint < 0
    or (p_cost->>'infrastructureCostMicros')::bigint < 0
    or (p_cost->>'totalInternalCostMicros')::bigint < 0
    or (p_cost->>'totalInternalCostMicros')::bigint >
      work_row.maximum_authorized_internal_cost_micros
    or aggregate_cost + (p_cost->>'totalInternalCostMicros')::bigint >
      plan_row.maximum_authorized_internal_cost_micros
    or coalesce((p_cost->>'failedOrUnknownAttemptCostRetained')::boolean, false) is not true
    or coalesce((p_cost->>'invoiceReconciled')::boolean, true)
    or coalesce((p_cost->>'customerPriceCalculated')::boolean, true)
    or coalesce((p_cost->>'customerCreditsMutated')::boolean, true)
    or coalesce((p_cost->>'serviceFeeIncluded')::boolean, true)
    or jsonb_array_length(coalesce(p_cost->'usageEventIds', '[]'::jsonb))
      not between 1 and 128
    or jsonb_array_length(coalesce(p_cost->'internalCostRecordIds', '[]'::jsonb))
      not between 1 and 128
    or jsonb_array_length(p_cost->'usageEventIds') <>
      (select count(distinct value)
       from jsonb_array_elements_text(p_cost->'usageEventIds'))
    or jsonb_array_length(p_cost->'internalCostRecordIds') <>
      (select count(distinct value)
       from jsonb_array_elements_text(p_cost->'internalCostRecordIds'))
    or exists (
      select 1
      from public.preference_long_form_study_attempts prior,
        lateral jsonb_array_elements_text(
          coalesce(prior.terminal_json->'costEvidence'->'usageEventIds', '[]'::jsonb)
        ) used
      where prior.study_run_id = p_run_id
        and used.value in (
          select value from jsonb_array_elements_text(p_cost->'usageEventIds')
        )
    )
    or exists (
      select 1
      from public.preference_long_form_study_attempts prior,
        lateral jsonb_array_elements_text(
          coalesce(prior.terminal_json->'costEvidence'->'internalCostRecordIds', '[]'::jsonb)
        ) used
      where prior.study_run_id = p_run_id
        and used.value in (
          select value from jsonb_array_elements_text(p_cost->'internalCostRecordIds')
        )
    ) then
    raise exception using errcode = '40001', message = 'PRE_PLAN_TERMINAL_COST_AUTHORITY_INVALID';
  end if;
end;
$$;

create or replace function public.reeditpro_complete_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  attempt_row public.preference_long_form_study_attempts%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  completed_at_value timestamptz;
  terminal_without_hash jsonb;
  terminal_value jsonb;
  output_value jsonb;
  output_hashes text[];
  replay jsonb;
  required_remaining bigint;
  active_remaining bigint;
begin
  perform public.reeditpro_pre_plan_assert_request(p_contract_version, 'complete', p_request);
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select * into strict run_row from public.preference_long_form_study_runs
    where external_run_id = p_request->>'runId'
      and study_identity_hash = p_request->>'studyIdentityHash';
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'complete',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', false
  ) into replay;
  if replay is not null then return replay; end if;
  select * into strict attempt_row from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and external_attempt_id = p_request->>'attemptId'
    for update;
  select * into strict work_row from public.preference_long_form_study_work_items
    where id = attempt_row.study_work_item_id for update;
  completed_at_value := (p_request->>'completedAt')::timestamptz;
  if attempt_row.status <> 'running'
    or work_row.active_attempt_id <> attempt_row.id
    or attempt_row.worker_identity_evidence_hash <> p_request->>'workerIdentityEvidenceHash'
    or attempt_row.worker_receipt_hash <> p_request->>'workerReceiptHash'
    or attempt_row.lease_credential_hash_sha256 <>
      public.reeditpro_pre_plan_lease_hash(p_request->>'leaseCredential')
    or completed_at_value <= attempt_row.heartbeat_at
    or completed_at_value >= attempt_row.lease_expires_at
    or completed_at_value > attempt_row.attempt_deadline_at
    or jsonb_array_length(coalesce(p_request->'outputs', '[]'::jsonb)) not between 1 and 32
    or (select count(distinct value->>'outputId') from jsonb_array_elements(p_request->'outputs'))
      <> jsonb_array_length(p_request->'outputs') then
    raise exception using errcode = '40001', message = 'PRE_PLAN_COMPLETION_AUTHORITY_CHANGED';
  end if;
  perform public.reeditpro_pre_plan_assert_terminal_cost(
    run_row.id, work_row.id, attempt_row.id, p_request->'costEvidence',
    completed_at_value, 'final'
  );
  for output_value in select value from jsonb_array_elements(p_request->'outputs') loop
    if output_value->>'outputHash' <> public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_private_output_v1',
      output_value - 'outputHash'
    )
      or coalesce((output_value->>'privateCreateOnlyReadbackVerified')::boolean, false) is not true
      or coalesce((output_value->>'providerUrlPersisted')::boolean, true)
      or coalesce((output_value->>'localPathPersisted')::boolean, true) then
      raise exception using errcode = '22023', message = 'PRE_PLAN_OUTPUT_AUTHORITY_INVALID';
    end if;
  end loop;
  select array_agg(value->>'outputHash' order by ordinality)
  into output_hashes
  from jsonb_array_elements(p_request->'outputs') with ordinality;
  terminal_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-attempt-terminal-v1',
    'terminalKind', 'completion',
    'terminalEvidenceHash', p_request->>'completionEvidenceHash',
    'costEvidence', p_request->'costEvidence',
    'outputs', p_request->'outputs',
    'failureCategory', null,
    'sanitizedFailureCode', null,
    'queueDisposition', 'completed',
    'automaticRetryStarted', false,
    'unknownOutcomeReconciliationRequired', false,
    'terminalAt', public.reeditpro_iso_timestamp(completed_at_value)
  );
  terminal_value := terminal_without_hash || jsonb_build_object(
    'terminalHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_terminal_v1', terminal_without_hash
    )
  );
  update public.preference_long_form_study_attempts
  set status = 'completed', usage_digest = p_request->'costEvidence'->>'evidenceHash',
      provider_cost_micros = (p_request->'costEvidence'->>'providerCostMicros')::bigint,
      infrastructure_cost_micros =
        (p_request->'costEvidence'->>'infrastructureCostMicros')::bigint,
      internal_cost_micros = (p_request->'costEvidence'->>'totalInternalCostMicros')::bigint,
      heartbeat_at = completed_at_value, finished_at = completed_at_value,
      terminal_json = terminal_value
  where id = attempt_row.id;
  for output_value in select value from jsonb_array_elements(p_request->'outputs') loop
    insert into public.preference_long_form_study_work_outputs (
      workspace_id, edit_reference_id, study_session_id, study_plan_id,
      study_run_id, study_work_item_id, study_attempt_id, output_type,
      output_digest, storage_object_id, storage_generation, storage_etag,
      checksum_sha256, external_output_id, output_json,
      storage_object_identity_hash, byte_length, mime_type, lineage_hash
    ) values (
      run_row.workspace_id, run_row.edit_reference_id, run_row.study_session_id,
      run_row.study_plan_id, run_row.id, work_row.id, attempt_row.id,
      output_value->>'outputKind', output_value->>'outputHash',
      output_value->>'storageObjectId', null,
      null, output_value->>'checksumSha256',
      output_value->>'outputId', output_value,
      output_value->>'storageObjectIdentityHash',
      (output_value->>'byteLength')::bigint, output_value->>'mimeType',
      output_value->>'lineageHash'
    );
  end loop;
  update public.preference_long_form_study_work_items
  set status = 'completed', active_attempt_id = null,
      lease_owner_digest = null, lease_token_digest = null, lease_expires_at = null,
      completed_output_hashes = output_hashes,
      cumulative_internal_cost_micros = cumulative_internal_cost_micros
        + (p_request->'costEvidence'->>'totalInternalCostMicros')::bigint,
      updated_at = clock_timestamp()
  where id = work_row.id;
  if run_row.status = 'cancellation_requested' then
    update public.preference_long_form_study_work_items
      set status = 'cancelled', blocker_code = null, updated_at = clock_timestamp()
      where study_run_id = run_row.id and status in ('queued', 'retry_wait');
    select count(*) into active_remaining
    from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and status = 'running';
    update public.preference_long_form_study_runs
      set status = case when active_remaining = 0 then 'cancelled'
        else 'cancellation_requested' end
      where id = run_row.id;
  else
    select count(*) into required_remaining
    from public.preference_long_form_study_work_items
    where study_run_id = run_row.id and required and status <> 'completed';
    update public.preference_long_form_study_runs
      set status = case when required_remaining = 0 then 'completed'
        when status = 'paused' then 'paused' else 'running' end,
          pause_requested_at = case when required_remaining = 0 then null
            else pause_requested_at end
      where id = run_row.id;
  end if;
  return public.reeditpro_pre_plan_commit_mutation(
    run_row.id, 'complete', p_request, work_row.id, attempt_row.id,
    completed_at_value, run_row.revision
  );
end;
$$;

create or replace function public.reeditpro_fail_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  attempt_row public.preference_long_form_study_attempts%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  failed_at_value timestamptz;
  unknown_outcome boolean;
  cancelled boolean;
  attempts_exhausted boolean;
  queue_disposition text;
  next_work_state text;
  next_run_state text;
  blocker_value text;
  expected_cost_status text;
  terminal_without_hash jsonb;
  terminal_value jsonb;
  replay jsonb;
  active_remaining bigint;
begin
  perform public.reeditpro_pre_plan_assert_request(p_contract_version, 'fail', p_request);
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select * into strict run_row from public.preference_long_form_study_runs
    where external_run_id = p_request->>'runId'
      and study_identity_hash = p_request->>'studyIdentityHash';
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'fail',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', false
  ) into replay;
  if replay is not null then return replay; end if;
  select * into strict attempt_row from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and external_attempt_id = p_request->>'attemptId'
    for update;
  select * into strict work_row from public.preference_long_form_study_work_items
    where id = attempt_row.study_work_item_id for update;
  failed_at_value := (p_request->>'failedAt')::timestamptz;
  unknown_outcome := p_request->>'failureCategory' = 'provider_unknown_outcome';
  cancelled := p_request->>'failureCategory' = 'cancelled';
  if attempt_row.status <> 'running'
    or work_row.active_attempt_id <> attempt_row.id
    or attempt_row.worker_identity_evidence_hash <> p_request->>'workerIdentityEvidenceHash'
    or attempt_row.worker_receipt_hash <> p_request->>'workerReceiptHash'
    or attempt_row.lease_credential_hash_sha256 <>
      public.reeditpro_pre_plan_lease_hash(p_request->>'leaseCredential')
    or failed_at_value <= attempt_row.heartbeat_at
    or failed_at_value >= attempt_row.lease_expires_at
    or failed_at_value > attempt_row.attempt_deadline_at
    or (cancelled and run_row.status <> 'cancellation_requested')
    or (run_row.status = 'cancellation_requested' and not cancelled and not unknown_outcome) then
    raise exception using errcode = '40001', message = 'PRE_PLAN_FAILURE_AUTHORITY_CHANGED';
  end if;
  expected_cost_status := case when unknown_outcome
    then 'provisional_provider_reconciliation_required' else 'final' end;
  perform public.reeditpro_pre_plan_assert_terminal_cost(
    run_row.id, work_row.id, attempt_row.id, p_request->'costEvidence',
    failed_at_value, expected_cost_status
  );
  attempts_exhausted := work_row.attempt_count >= work_row.maximum_attempts;
  queue_disposition := case
    when unknown_outcome then 'blocked_unknown_outcome'
    when cancelled then 'cancelled'
    when attempts_exhausted then 'attempts_exhausted'
    else 'retry_available'
  end;
  next_work_state := case
    when cancelled then 'cancelled'
    when unknown_outcome or attempts_exhausted then 'blocked'
    else 'retry_wait'
  end;
  blocker_value := case
    when unknown_outcome then 'PROVIDER_UNKNOWN_OUTCOME_RECONCILIATION_REQUIRED'
    when attempts_exhausted then 'STUDY_ATTEMPTS_EXHAUSTED'
    else null
  end;
  terminal_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-attempt-terminal-v1',
    'terminalKind', 'failure',
    'terminalEvidenceHash', p_request->>'failureEvidenceHash',
    'costEvidence', p_request->'costEvidence',
    'outputs', '[]'::jsonb,
    'failureCategory', p_request->>'failureCategory',
    'sanitizedFailureCode', p_request->>'sanitizedFailureCode',
    'queueDisposition', queue_disposition,
    'automaticRetryStarted', false,
    'unknownOutcomeReconciliationRequired', unknown_outcome,
    'terminalAt', public.reeditpro_iso_timestamp(failed_at_value)
  );
  terminal_value := terminal_without_hash || jsonb_build_object(
    'terminalHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_terminal_v1', terminal_without_hash
    )
  );
  update public.preference_long_form_study_attempts
  set status = 'failed',
      usage_digest = p_request->'costEvidence'->>'evidenceHash',
      provider_cost_micros = (p_request->'costEvidence'->>'providerCostMicros')::bigint,
      infrastructure_cost_micros =
        (p_request->'costEvidence'->>'infrastructureCostMicros')::bigint,
      internal_cost_micros = (p_request->'costEvidence'->>'totalInternalCostMicros')::bigint,
      failure_class = p_request->>'failureCategory',
      heartbeat_at = failed_at_value, finished_at = failed_at_value,
      terminal_json = terminal_value
  where id = attempt_row.id;
  update public.preference_long_form_study_work_items
  set status = next_work_state, active_attempt_id = null,
      lease_owner_digest = null, lease_token_digest = null, lease_expires_at = null,
      cumulative_internal_cost_micros = cumulative_internal_cost_micros
        + (p_request->'costEvidence'->>'totalInternalCostMicros')::bigint,
      blocker_code = blocker_value, updated_at = clock_timestamp()
  where id = work_row.id;
  if cancelled then
    update public.preference_long_form_study_work_items
      set status = 'cancelled', blocker_code = null, updated_at = clock_timestamp()
      where study_run_id = run_row.id and status in ('queued', 'retry_wait');
    select count(*) into active_remaining
    from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and status = 'running';
    next_run_state := case when active_remaining = 0 then 'cancelled'
      else 'cancellation_requested' end;
  elsif unknown_outcome or attempts_exhausted then
    next_run_state := 'needs_operator_review';
  elsif run_row.status = 'cancellation_requested' then
    next_run_state := 'cancellation_requested';
  elsif run_row.status = 'paused' then
    next_run_state := 'paused';
  else
    next_run_state := 'running';
  end if;
  update public.preference_long_form_study_runs
  set status = next_run_state,
      pause_requested_at = case when next_run_state = 'paused'
        then pause_requested_at else null end,
      updated_at = clock_timestamp()
  where id = run_row.id;
  return public.reeditpro_pre_plan_commit_mutation(
    run_row.id, 'fail', p_request, work_row.id, attempt_row.id,
    failed_at_value, run_row.revision
  );
end;
$$;

create or replace function public.reeditpro_control_pre_plan_study_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  replay jsonb;
  requested_at_value timestamptz;
  active_count bigint;
begin
  perform public.reeditpro_pre_plan_assert_request(p_contract_version, 'control', p_request);
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select * into strict run_row from public.preference_long_form_study_runs
    where external_run_id = p_request->>'runId'
      and study_identity_hash = p_request->>'studyIdentityHash'
    for update;
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'control',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', false
  ) into replay;
  if replay is not null then return replay; end if;
  if run_row.revision <> (p_request->>'expectedRunRevision')::bigint
    or (select controller_identity_evidence_hash
        from public.preference_long_form_study_plans where id = run_row.study_plan_id)
      <> p_request->>'controllerIdentityEvidenceHash' then
    raise exception using errcode = '40001', message = 'PRE_PLAN_CONTROL_AUTHORITY_CHANGED';
  end if;
  requested_at_value := (p_request->>'requestedAt')::timestamptz;
  if p_request->>'action' = 'pause' then
    if run_row.status not in ('queued', 'running') then
      raise exception using errcode = '40001', message = 'PRE_PLAN_PAUSE_INVALID';
    end if;
    update public.preference_long_form_study_runs
      set status = 'paused', pause_requested_at = requested_at_value
      where id = run_row.id;
  elsif p_request->>'action' = 'resume' then
    if run_row.status <> 'paused' then
      raise exception using errcode = '40001', message = 'PRE_PLAN_RESUME_INVALID';
    end if;
    select count(*) into active_count
    from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and status = 'running';
    update public.preference_long_form_study_runs
      set status = case when active_count > 0 then 'running' else 'queued' end,
          pause_requested_at = null
      where id = run_row.id;
  elsif p_request->>'action' = 'cancel' then
    if run_row.status in ('completed', 'cancelled', 'needs_operator_review') then
      raise exception using errcode = '40001', message = 'PRE_PLAN_CANCEL_INVALID';
    end if;
    update public.preference_long_form_study_work_items
      set status = 'cancelled', blocker_code = null, updated_at = clock_timestamp()
      where study_run_id = run_row.id and status in ('queued', 'retry_wait');
    select count(*) into active_count
    from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and status = 'running';
    update public.preference_long_form_study_runs
      set status = case when active_count > 0 then 'cancellation_requested'
        else 'cancelled' end,
          cancel_requested_at = requested_at_value,
          pause_requested_at = null
      where id = run_row.id;
  else
    raise exception using errcode = '22023', message = 'PRE_PLAN_CONTROL_ACTION_INVALID';
  end if;
  return public.reeditpro_pre_plan_commit_mutation(
    run_row.id, 'control', p_request, null, null,
    requested_at_value, run_row.revision
  );
end;
$$;

create or replace function public.reeditpro_pre_plan_commit_recovery(
  p_run_id uuid,
  p_request jsonb,
  p_work_item_id uuid,
  p_attempt_id uuid,
  p_recovered boolean,
  p_committed_at timestamptz,
  p_revision_before bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  idempotency_hash text;
  transaction_id text;
  previous_audit_hash text;
  audit_event_hash text;
  transaction_without_hash jsonb;
  transaction_value jsonb;
  response_without_hash jsonb;
  response_value jsonb;
begin
  select * into strict run_row from public.preference_long_form_study_runs where id = p_run_id;
  idempotency_hash := public.reeditpro_pre_plan_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  transaction_value := null;
  if p_recovered then
    update public.preference_long_form_study_runs
      set revision = p_revision_before + 1, updated_at = clock_timestamp()
      where id = p_run_id and revision = p_revision_before
      returning * into run_row;
    if not found then
      raise exception using errcode = '40001', message = 'PRE_PLAN_RUN_REVISION_CHANGED';
    end if;
    transaction_id := 'pre_plan_study_recovery_tx-' || substr(
      public.reeditpro_sha256_json(jsonb_build_object(
        'runId', run_row.external_run_id,
        'revisionAfter', run_row.revision,
        'requestHash', p_request->>'requestHash'
      )), 1, 48
    );
    previous_audit_hash := run_row.audit_chain_head_hash;
    audit_event_hash := public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_distributed_pre_plan_study_audit_event_v1',
      'previousAuditEventHash', previous_audit_hash,
      'runId', run_row.external_run_id,
      'studyIdentityHash', run_row.study_identity_hash,
      'operation', 'recover_expired_lease',
      'transactionId', transaction_id,
      'workItemId', (select external_work_item_id
        from public.preference_long_form_study_work_items where id = p_work_item_id),
      'attemptId', (select external_attempt_id
        from public.preference_long_form_study_attempts where id = p_attempt_id),
      'revisionAfter', run_row.revision
    ));
    update public.preference_long_form_study_runs
      set audit_chain_head_hash = audit_event_hash where id = p_run_id;
    insert into public.preference_long_form_study_audit_events (
      workspace_id, study_run_id, revision, operation, transaction_id,
      previous_event_hash, event_hash, work_item_id, attempt_id, created_at
    ) values (
      run_row.workspace_id, p_run_id, run_row.revision, 'recover_expired_lease',
      transaction_id, previous_audit_hash, audit_event_hash,
      p_work_item_id, p_attempt_id, p_committed_at
    );
    transaction_without_hash := jsonb_build_object(
      'schemaVersion', 'canonical-distributed-pre-plan-study-transaction-v1',
      'transactionId', transaction_id,
      'operation', 'recover_expired_lease',
      'runId', run_row.external_run_id,
      'studyIdentityHash', run_row.study_identity_hash,
      'revisionBefore', p_revision_before,
      'revisionAfter', run_row.revision,
      'requestHash', p_request->>'requestHash',
      'idempotencyKeyHash', idempotency_hash,
      'auditEventHash', audit_event_hash,
      'committedAt', public.reeditpro_iso_timestamp(p_committed_at)
    );
    transaction_value := transaction_without_hash || jsonb_build_object(
      'transactionHash', public.reeditpro_pre_plan_hash(
        'canonical_distributed_pre_plan_study_transaction_v1', transaction_without_hash
      )
    );
  end if;
  response_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-recovery-response-v1',
    'operation', 'recover_expired_lease',
    'runId', run_row.external_run_id,
    'studyIdentityHash', run_row.study_identity_hash,
    'requestHash', p_request->>'requestHash',
    'idempotencyKeyHash', idempotency_hash,
    'observedAt', p_request->>'observedAt',
    'transaction', transaction_value,
    'run', public.reeditpro_pre_plan_run_view(p_run_id),
    'workItem', case when p_recovered
      then public.reeditpro_pre_plan_work_item_view(p_work_item_id) else null end,
    'attempt', case when p_recovered
      then public.reeditpro_pre_plan_attempt_view(p_attempt_id) else null end,
    'expiredAttemptRecovered', p_recovered,
    'boundaries', public.reeditpro_pre_plan_boundaries() || jsonb_build_object(
      'expiredAttemptSelectedByTransaction', true,
      'callerSelectedAttemptOrExpiryAllowed', false,
      'unknownProviderOutcomeMustReconcileBeforeRetry', true
    )
  );
  response_value := response_without_hash || jsonb_build_object(
    'responseHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_recovery_response_v1',
      response_without_hash
    )
  );
  insert into public.preference_long_form_study_idempotency_receipts (
    workspace_id, study_run_id, operation, idempotency_key_hash,
    request_hash, response_json
  ) values (
    run_row.workspace_id, p_run_id, 'recover_expired_lease', idempotency_hash,
    p_request->>'requestHash', response_value
  );
  return jsonb_build_object(
    'idempotencyStatus', 'inserted',
    'response', response_value,
    'transientLeaseCredential', null
  );
end;
$$;

create or replace function public.reeditpro_recover_expired_pre_plan_study_lease_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  run_row public.preference_long_form_study_runs%rowtype;
  attempt_row public.preference_long_form_study_attempts%rowtype;
  work_row public.preference_long_form_study_work_items%rowtype;
  plan_row public.preference_long_form_study_plans%rowtype;
  replay jsonb;
  observed_at_value timestamptz;
  provider_execution boolean;
  cancellation_requested boolean;
  attempts_exhausted boolean;
  evidence_status text;
  queue_disposition text;
  next_work_state text;
  next_run_state text;
  blocker_value text;
  cost_without_hash jsonb;
  cost_value jsonb;
  terminal_without_hash jsonb;
  terminal_value jsonb;
  active_remaining bigint;
begin
  perform public.reeditpro_pre_plan_assert_request(
    p_contract_version, 'recover_expired_lease', p_request
  );
  perform pg_advisory_xact_lock(hashtextextended(p_request->>'runId', 0));
  select * into strict run_row from public.preference_long_form_study_runs
    where external_run_id = p_request->>'runId'
      and study_identity_hash = p_request->>'studyIdentityHash'
    for update;
  if not public.reeditpro_has_workspace_write_access(run_row.workspace_id) then
    raise exception using errcode = '42501', message = 'PRE_PLAN_TENANT_WRITE_DENIED';
  end if;
  select public.reeditpro_pre_plan_replay(
    run_row.id, 'recover_expired_lease',
    public.reeditpro_pre_plan_idempotency_key_hash(p_request->>'idempotencyKey'),
    p_request->>'requestHash', false
  ) into replay;
  if replay is not null then return replay; end if;
  select * into strict plan_row
  from public.preference_long_form_study_plans where id = run_row.study_plan_id;
  if plan_row.controller_identity_evidence_hash <>
    p_request->>'controllerIdentityEvidenceHash' then
    raise exception using errcode = '42501', message = 'PRE_PLAN_CONTROLLER_AUTHORITY_INVALID';
  end if;
  observed_at_value := (p_request->>'observedAt')::timestamptz;
  select attempt.* into attempt_row
  from public.preference_long_form_study_attempts attempt
  where attempt.study_run_id = run_row.id
    and attempt.status = 'running'
    and attempt.lease_expires_at <= observed_at_value
  order by attempt.lease_expires_at, attempt.external_attempt_id
  for update skip locked
  limit 1;
  if not found then
    return public.reeditpro_pre_plan_commit_recovery(
      run_row.id, p_request, null, null, false,
      observed_at_value, run_row.revision
    );
  end if;
  select * into strict work_row
  from public.preference_long_form_study_work_items
  where id = attempt_row.study_work_item_id
    and active_attempt_id = attempt_row.id
  for update;
  provider_execution := work_row.execution_kind <> 'deterministic_tool';
  cancellation_requested := run_row.status = 'cancellation_requested';
  attempts_exhausted := work_row.attempt_count >= work_row.maximum_attempts;
  evidence_status := case when provider_execution
    then 'provisional_provider_reconciliation_required' else 'final' end;
  queue_disposition := case
    when provider_execution then 'blocked_unknown_outcome'
    when cancellation_requested then 'cancelled'
    when attempts_exhausted then 'attempts_exhausted'
    else 'retry_available'
  end;
  next_work_state := case
    when provider_execution then 'blocked'
    when cancellation_requested then 'cancelled'
    when attempts_exhausted then 'blocked'
    else 'retry_wait'
  end;
  blocker_value := case
    when provider_execution then 'PROVIDER_UNKNOWN_OUTCOME_RECONCILIATION_REQUIRED'
    when attempts_exhausted then 'STUDY_ATTEMPTS_EXHAUSTED'
    else null
  end;
  cost_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-attempt-cost-v1',
    'evidenceStatus', evidence_status,
    'attemptId', attempt_row.external_attempt_id,
    'attemptStartHash', attempt_row.attempt_start_hash,
    'startedAt', public.reeditpro_iso_timestamp(attempt_row.started_at),
    'finishedAt', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at),
    'approvedUsageEstimateId', plan_row.study_usage_approval_id,
    'internalCostBudgetId', plan_row.internal_cost_budget_id,
    'maximumAuthorizedInternalCostMicros',
      work_row.maximum_authorized_internal_cost_micros::text,
    'providerUsageEvidenceDigestSha256', public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_pre_plan_study_local_timeout_provider_usage_v1',
      'attemptId', attempt_row.external_attempt_id,
      'finishedAt', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at),
      'providerRequestPerformed', false
    )),
    'providerRateCardSnapshotDigestSha256',
      work_row.seed_json->>'providerRateCardSnapshotDigestSha256',
    'providerCostMicros', '0',
    'infrastructureUsageEvidenceDigestSha256', public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_pre_plan_study_local_timeout_infrastructure_usage_v1',
      'attemptId', attempt_row.external_attempt_id,
      'startedAt', public.reeditpro_iso_timestamp(attempt_row.started_at),
      'finishedAt', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at),
      'liveResourceMeterPerformed', false
    )),
    'infrastructureRateCardSnapshotDigestSha256',
      work_row.seed_json->>'infrastructureRateCardSnapshotDigestSha256',
    'infrastructureCostMicros', '0',
    'totalInternalCostMicros', '0',
    'usageEventIds', jsonb_build_array(
      'pre_plan_study_usage-' || substr(public.reeditpro_sha256_json(jsonb_build_object(
        'attemptId', attempt_row.external_attempt_id
      )), 1, 48)
    ),
    'internalCostRecordIds', jsonb_build_array(
      'pre_plan_study_cost-' || substr(public.reeditpro_sha256_json(jsonb_build_object(
        'attemptId', attempt_row.external_attempt_id
      )), 1, 48)
    ),
    'failedOrUnknownAttemptCostRetained', true,
    'invoiceReconciled', false,
    'customerPriceCalculated', false,
    'customerCreditsMutated', false,
    'serviceFeeIncluded', false
  );
  cost_value := cost_without_hash || jsonb_build_object(
    'evidenceHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_attempt_cost_v1', cost_without_hash
    )
  );
  terminal_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-pre-plan-study-attempt-terminal-v1',
    'terminalKind', 'timeout',
    'terminalEvidenceHash', public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_distributed_pre_plan_study_timeout_evidence_v1',
      'attemptStartHash', attempt_row.attempt_start_hash,
      'immutableLeaseExpiry', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at),
      'observedAt', p_request->>'observedAt'
    )),
    'costEvidence', cost_value,
    'outputs', '[]'::jsonb,
    'failureCategory', 'execution_timeout',
    'sanitizedFailureCode', 'ATTEMPT_LEASE_EXPIRED',
    'queueDisposition', queue_disposition,
    'automaticRetryStarted', false,
    'unknownOutcomeReconciliationRequired', provider_execution,
    'terminalAt', public.reeditpro_iso_timestamp(attempt_row.lease_expires_at)
  );
  terminal_value := terminal_without_hash || jsonb_build_object(
    'terminalHash', public.reeditpro_pre_plan_hash(
      'canonical_distributed_pre_plan_study_terminal_v1', terminal_without_hash
    )
  );
  update public.preference_long_form_study_attempts
  set status = 'timed_out', usage_digest = cost_value->>'evidenceHash',
      provider_cost_micros = 0, infrastructure_cost_micros = 0,
      internal_cost_micros = 0, failure_class = 'execution_timeout',
      heartbeat_at = lease_expires_at, finished_at = lease_expires_at,
      terminal_json = terminal_value
  where id = attempt_row.id;
  update public.preference_long_form_study_work_items
  set status = next_work_state, active_attempt_id = null,
      lease_owner_digest = null, lease_token_digest = null, lease_expires_at = null,
      blocker_code = blocker_value, updated_at = clock_timestamp()
  where id = work_row.id;
  update public.preference_long_form_study_runs
    set recovery_generation = recovery_generation + 1 where id = run_row.id;
  if provider_execution or attempts_exhausted then
    next_run_state := 'needs_operator_review';
  elsif cancellation_requested then
    update public.preference_long_form_study_work_items
      set status = 'cancelled', blocker_code = null, updated_at = clock_timestamp()
      where study_run_id = run_row.id and status in ('queued', 'retry_wait');
    select count(*) into active_remaining
    from public.preference_long_form_study_attempts
    where study_run_id = run_row.id and status = 'running';
    next_run_state := case when active_remaining = 0 then 'cancelled'
      else 'cancellation_requested' end;
  elsif run_row.status = 'paused' then
    next_run_state := 'paused';
  else
    next_run_state := 'running';
  end if;
  update public.preference_long_form_study_runs
  set status = next_run_state,
      pause_requested_at = case when next_run_state = 'paused'
        then pause_requested_at else null end,
      updated_at = clock_timestamp()
  where id = run_row.id;
  return public.reeditpro_pre_plan_commit_recovery(
    run_row.id, p_request, work_row.id, attempt_row.id, true,
    attempt_row.lease_expires_at, run_row.revision
  );
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'reeditpro_enqueue_pre_plan_study_v1(text,jsonb)',
    'reeditpro_claim_and_start_pre_plan_study_v1(text,jsonb)',
    'reeditpro_heartbeat_pre_plan_study_v1(text,jsonb)',
    'reeditpro_complete_pre_plan_study_v1(text,jsonb)',
    'reeditpro_fail_pre_plan_study_v1(text,jsonb)',
    'reeditpro_control_pre_plan_study_v1(text,jsonb)',
    'reeditpro_recover_expired_pre_plan_study_lease_v1(text,jsonb)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, service_role', signature);
    execute format('grant execute on function public.%s to authenticated', signature);
  end loop;
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'reeditpro_pre_plan_hash(text,jsonb)',
    'reeditpro_pre_plan_idempotency_key_hash(text)',
    'reeditpro_pre_plan_lease_hash(text)',
    'reeditpro_pre_plan_request_hash(text,jsonb)',
    'reeditpro_constant_time_hex_equal(text,text)',
    'reeditpro_pre_plan_assert_local_internal_authority(jsonb)',
    'reeditpro_pre_plan_escrow_secret()',
    'reeditpro_pre_plan_boundaries()',
    'reeditpro_pre_plan_attempt_view(uuid)',
    'reeditpro_pre_plan_work_item_view(uuid)',
    'reeditpro_pre_plan_run_view(uuid)',
    'reeditpro_pre_plan_replay(uuid,text,text,text,boolean)',
    'reeditpro_pre_plan_commit_mutation(uuid,text,jsonb,uuid,uuid,timestamptz,bigint,text,timestamptz)',
    'reeditpro_pre_plan_assert_request(text,text,jsonb)',
    'reeditpro_pre_plan_assert_terminal_cost(uuid,uuid,uuid,jsonb,timestamptz,text)',
    'reeditpro_pre_plan_commit_recovery(uuid,jsonb,uuid,uuid,boolean,timestamptz,bigint)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated, service_role', signature);
  end loop;
end;
$$;
