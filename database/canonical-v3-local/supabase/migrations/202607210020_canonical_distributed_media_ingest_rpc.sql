-- ReEditPro canonical V3 local baseline: durable distributed large-media ingest.
--
-- This migration belongs only to the isolated canonical-v3-local chain. It is
-- not a production migration and must never be copied into supabase/migrations.
-- The seven queue mutations below implement the frozen V1 state-port contract.
-- Immutable source registration is a prerequisite, not an eighth queue action.

create table public.canonical_media_ingest_source_authorities (
  job_id text primary key check (job_id ~ '^media-ingest-[a-f0-9]{48}$'),
  workspace_id uuid not null,
  project_id uuid not null,
  owner_user_id uuid not null,
  upload_intent_id text not null check (length(upload_intent_id) between 1 and 240),
  upload_purpose text not null check (upload_purpose in ('source_media', 'reference_media')),
  expected_size_bytes bigint not null check (expected_size_bytes > 0 and expected_size_bytes <= 1099511627776),
  upload_authority_fingerprint_sha256 text not null check (upload_authority_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
  ingest_identity_sha256 text not null check (ingest_identity_sha256 ~ '^[a-f0-9]{64}$'),
  policy_sha256 text not null check (policy_sha256 ~ '^[a-f0-9]{64}$'),
  seed_sha256 text not null check (seed_sha256 ~ '^[a-f0-9]{64}$'),
  seed_json jsonb not null,
  registration_idempotency_key_sha256 text not null check (registration_idempotency_key_sha256 ~ '^[a-f0-9]{64}$'),
  registration_request_sha256 text not null check (registration_request_sha256 ~ '^[a-f0-9]{64}$'),
  registration_transaction_id uuid not null,
  registered_at timestamptz not null,
  unique (job_id, workspace_id, project_id, owner_user_id),
  unique (workspace_id, upload_intent_id),
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete restrict,
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create table public.canonical_media_ingest_jobs (
  job_id text primary key,
  workspace_id uuid not null,
  project_id uuid not null,
  owner_user_id uuid not null,
  revision bigint not null default 0 check (revision >= 0),
  job_json jsonb,
  active_attempt_id text,
  controller_identity_evidence_sha256 text check (controller_identity_evidence_sha256 ~ '^[a-f0-9]{64}$'),
  audit_chain_head_sha256 text not null check (audit_chain_head_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (job_id, workspace_id, project_id, owner_user_id),
  foreign key (job_id, workspace_id, project_id, owner_user_id)
    references public.canonical_media_ingest_source_authorities(
      job_id, workspace_id, project_id, owner_user_id
    ) on delete restrict
);

create table public.canonical_media_ingest_attempts (
  attempt_id text primary key check (attempt_id ~ '^mediaingestattempt-[a-f0-9]{48}$'),
  job_id text not null,
  workspace_id uuid not null,
  project_id uuid not null,
  owner_user_id uuid not null,
  attempt_number integer not null check (attempt_number between 1 and 3),
  state text not null check (state in ('running', 'cancellation_requested', 'completed', 'failed', 'timed_out')),
  attempt_json jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (job_id, attempt_number),
  unique (attempt_id, job_id),
  foreign key (job_id, workspace_id, project_id, owner_user_id)
    references public.canonical_media_ingest_jobs(
      job_id, workspace_id, project_id, owner_user_id
    ) on delete restrict
);

alter table public.canonical_media_ingest_jobs
  add constraint canonical_media_ingest_jobs_active_attempt_fk
  foreign key (active_attempt_id, job_id)
  references public.canonical_media_ingest_attempts(attempt_id, job_id)
  deferrable initially deferred;

create unique index canonical_media_ingest_one_active_attempt
  on public.canonical_media_ingest_attempts(job_id)
  where state in ('running', 'cancellation_requested');

create table public.canonical_media_ingest_idempotency_receipts (
  receipt_id uuid primary key default extensions.gen_random_uuid(),
  job_id text not null,
  workspace_id uuid not null,
  project_id uuid not null,
  owner_user_id uuid not null,
  operation text not null check (operation in (
    'enqueue', 'claim_and_start', 'record_progress', 'reconcile_completion',
    'reconcile_failure', 'request_cancellation', 'finalize_expired_attempt'
  )),
  idempotency_key_sha256 text not null check (idempotency_key_sha256 ~ '^[a-f0-9]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[a-f0-9]{64}$'),
  result_json jsonb not null,
  response_sha256 text not null check (response_sha256 ~ '^[a-f0-9]{64}$'),
  committed_at timestamptz not null,
  unique (job_id, operation, idempotency_key_sha256),
  foreign key (job_id, workspace_id, project_id, owner_user_id)
    references public.canonical_media_ingest_jobs(
      job_id, workspace_id, project_id, owner_user_id
    ) on delete restrict
);

create table public.canonical_media_ingest_audit_events (
  job_id text not null,
  workspace_id uuid not null,
  project_id uuid not null,
  owner_user_id uuid not null,
  revision bigint not null check (revision > 0),
  operation text not null check (operation in (
    'enqueue', 'claim_and_start', 'record_progress', 'reconcile_completion',
    'reconcile_failure', 'request_cancellation', 'finalize_expired_attempt'
  )),
  transaction_id text not null,
  attempt_id text,
  previous_event_sha256 text not null check (previous_event_sha256 ~ '^[a-f0-9]{64}$'),
  event_sha256 text not null unique check (event_sha256 ~ '^[a-f0-9]{64}$'),
  committed_at timestamptz not null,
  primary key (job_id, revision),
  foreign key (job_id, workspace_id, project_id, owner_user_id)
    references public.canonical_media_ingest_jobs(
      job_id, workspace_id, project_id, owner_user_id
    ) on delete restrict
);

create index canonical_media_ingest_sources_tenant_lookup
  on public.canonical_media_ingest_source_authorities(workspace_id, project_id, job_id);
create index canonical_media_ingest_attempts_job_lookup
  on public.canonical_media_ingest_attempts(workspace_id, job_id, attempt_number);
create index canonical_media_ingest_receipts_job_lookup
  on public.canonical_media_ingest_idempotency_receipts(workspace_id, job_id, operation);
create index canonical_media_ingest_audit_job_lookup
  on public.canonical_media_ingest_audit_events(workspace_id, job_id, revision);

alter table public.canonical_media_ingest_source_authorities enable row level security;
alter table public.canonical_media_ingest_source_authorities force row level security;
alter table public.canonical_media_ingest_jobs enable row level security;
alter table public.canonical_media_ingest_jobs force row level security;
alter table public.canonical_media_ingest_attempts enable row level security;
alter table public.canonical_media_ingest_attempts force row level security;
alter table public.canonical_media_ingest_idempotency_receipts enable row level security;
alter table public.canonical_media_ingest_idempotency_receipts force row level security;
alter table public.canonical_media_ingest_audit_events enable row level security;
alter table public.canonical_media_ingest_audit_events force row level security;

create policy canonical_media_ingest_sources_member_read
  on public.canonical_media_ingest_source_authorities for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));
create policy canonical_media_ingest_jobs_member_read
  on public.canonical_media_ingest_jobs for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));
create policy canonical_media_ingest_attempts_member_read
  on public.canonical_media_ingest_attempts for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));
create policy canonical_media_ingest_receipts_member_read
  on public.canonical_media_ingest_idempotency_receipts for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));
create policy canonical_media_ingest_audit_member_read
  on public.canonical_media_ingest_audit_events for select to authenticated
  using (public.reeditpro_is_workspace_member(workspace_id));

revoke all on table
  public.canonical_media_ingest_source_authorities,
  public.canonical_media_ingest_jobs,
  public.canonical_media_ingest_attempts,
  public.canonical_media_ingest_idempotency_receipts,
  public.canonical_media_ingest_audit_events
from public, anon, authenticated, service_role;

create trigger canonical_media_ingest_sources_immutable
before update or delete on public.canonical_media_ingest_source_authorities
for each row execute function public.reeditpro_reject_row_mutation();
create trigger canonical_media_ingest_receipts_immutable
before update or delete on public.canonical_media_ingest_idempotency_receipts
for each row execute function public.reeditpro_reject_row_mutation();
create trigger canonical_media_ingest_audit_immutable
before update or delete on public.canonical_media_ingest_audit_events
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_media_ingest_idempotency_key_hash(
  p_value text
)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_media_ingest_idempotency_key_v1',
    'value', p_value
  ));
$$;

create or replace function public.reeditpro_media_ingest_request_hash(
  p_operation text,
  p_request jsonb
)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_media_ingest_request_v1',
    'operation', p_operation,
    'payload', p_request - 'idempotencyKey' - 'requestHash'
  ));
$$;

create or replace function public.reeditpro_media_ingest_identifier(
  p_prefix text,
  p_value jsonb
)
returns text
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select p_prefix || '-' || substr(public.reeditpro_sha256_json(p_value), 1, 48);
$$;

create or replace function public.reeditpro_media_ingest_empty_audit_hash()
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_media_ingest_empty_audit_v1'
  ));
$$;

create or replace function public.reeditpro_media_ingest_boundaries()
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'serviceOnly', true,
    'authorityClass', 'pre_plan_technical_media_ingest',
    'uploadAuthorityDerivedServerSide', true,
    'approvedPlanSnapshotRequired', false,
    'approvedCreditReservationRequired', false,
    'approvedSnapshotOrCreditReservationFabricated', false,
    'executionLimitedToHashProbeAndCanonicalSourceFinalization', true,
    'editingGenerationRenderingOrProviderExecutionAllowed', false,
    'capacityAdmissionRequiredBeforeAttemptStart', true,
    'attemptLeaseAndProgressShareTransactionalAuthority', true,
    'callerSelectedAttemptLeaseExpiryCostOrRetryAllowed', false,
    'exactDurableResponseAssociationRequired', true,
    'plaintextLeaseCredentialBearerTokenOrIdempotencyKeyPersisted', false,
    'rawMediaPromptPathSignedUrlProviderUrlOrCredentialPersisted', false,
    'customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded', false,
    'automaticRetryStarted', false,
    'cloudCallPerformed', false,
    'providerCallPerformed', false,
    'productionAuthority', false
  );
$$;

create or replace function public.reeditpro_media_ingest_assert_local_internal_authority(
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
    headers->>'x-reeditpro-local-media-ingest-authority', ''
  ));
  local_secret := nullif(current_setting('app.settings.jwt_secret', true), '');
  if host_value not in ('127.0.0.1', 'localhost')
    or port_value <> '57431'
    or coalesce(length(local_secret), 0) < 32
    or provided_signature !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '42501', message = 'MEDIA_INGEST_LOCAL_INTERNAL_AUTHORITY_REQUIRED';
  end if;
  expected_signature := encode(extensions.hmac(
    'canonical_media_ingest_local_internal_v1:'
      || coalesce(p_request->>'requestHash', '') || ':'
      || public.reeditpro_media_ingest_idempotency_key_hash(
        coalesce(p_request->>'idempotencyKey', '')
      ),
    local_secret,
    'sha256'
  ), 'hex');
  if not public.reeditpro_constant_time_hex_equal(
    provided_signature,
    expected_signature
  ) then
    raise exception using
      errcode = '42501', message = 'MEDIA_INGEST_LOCAL_INTERNAL_AUTHORITY_INVALID';
  end if;
end;
$$;

create or replace function public.reeditpro_media_ingest_require_request(
  p_operation text,
  p_request jsonb
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if jsonb_typeof(p_request) <> 'object'
    or coalesce(p_request->>'jobId', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$'
    or coalesce(p_request->>'idempotencyKey', '') !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{15,239}$'
    or coalesce(p_request->>'idempotencyKey', '') like '%..%'
    or coalesce(p_request->>'requestHash', '') !~ '^[a-f0-9]{64}$'
    or p_request->>'requestHash' <>
      public.reeditpro_media_ingest_request_hash(p_operation, p_request) then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_REQUEST_INVALID';
  end if;
  perform public.reeditpro_media_ingest_assert_local_internal_authority(p_request);
end;
$$;

create or replace function public.reeditpro_register_media_ingest_source_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  seed jsonb := p_request->'seed';
  identity_value jsonb := seed->'identity';
  policy_value jsonb := seed->'policy';
  job_value text := p_request->>'jobId';
  workspace_uuid uuid;
  project_uuid uuid;
  owner_uuid uuid;
  expected_size bigint;
  idempotency_hash text;
  existing public.canonical_media_ingest_source_authorities%rowtype;
  transaction_uuid uuid;
  committed_at timestamptz;
  disposition text := 'inserted';
  expected_identity_hash text;
  expected_policy_hash text;
  expected_seed_hash text;
  expected_job_id text;
begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  perform public.reeditpro_media_ingest_require_request('register_source', p_request);
  if jsonb_typeof(seed) <> 'object'
    or jsonb_typeof(identity_value) <> 'object'
    or jsonb_typeof(policy_value) <> 'object' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_SOURCE_SEED_INVALID';
  end if;
  begin
    workspace_uuid := (p_request->>'workspaceId')::uuid;
    project_uuid := (p_request->>'projectId')::uuid;
    owner_uuid := (p_request->>'ownerUserId')::uuid;
    expected_size := (p_request->>'expectedSizeBytes')::bigint;
  exception when others then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_SOURCE_SCOPE_INVALID';
  end;
  job_value := seed->>'jobId';
  expected_identity_hash := public.reeditpro_sha256_json(identity_value - 'identityHash');
  expected_policy_hash := public.reeditpro_sha256_json(policy_value - 'policyHash');
  expected_seed_hash := public.reeditpro_sha256_json(seed - 'seedHash');
  expected_job_id := public.reeditpro_media_ingest_identifier(
    'media-ingest',
    jsonb_build_object(
      'domain', 'canonical_distributed_media_ingest_job_v1',
      'identityHash', identity_value->>'identityHash'
    )
  );
  if seed->>'schemaVersion' <> 'canonical-distributed-media-ingest-seed-v1'
    or job_value <> expected_job_id
    or p_request->>'ownerUserId' <> identity_value->>'ownerUserId'
    or p_request->>'workspaceId' <> identity_value->>'workspaceId'
    or p_request->>'projectId' <> identity_value->>'projectId'
    or p_request->>'uploadIntentId' <> identity_value->>'uploadIntentId'
    or p_request->>'uploadPurpose' <> identity_value->>'uploadPurpose'
    or expected_size <> (identity_value->>'expectedSizeBytes')::bigint
    or p_request->>'uploadAuthorityFingerprint' <>
      identity_value->>'uploadAuthorityFingerprint'
    or identity_value->>'identityHash' <> expected_identity_hash
    or policy_value->>'policyHash' <> expected_policy_hash
    or seed->>'seedHash' <> expected_seed_hash
    or identity_value->>'authorityClass' <> 'pre_plan_technical_media_ingest'
    or identity_value->>'operationId' <> 'internal.media.finalize_large_upload.v1'
    or identity_value->>'processingPolicyId' <>
      'generation_bound_checkpointed_hash_probe_finalize_v1'
    or identity_value->>'storageMode' <> 'gcs'
    or identity_value->>'uploadPurpose' not in ('source_media', 'reference_media')
    or expected_size <= 0 or expected_size > 1099511627776
    or policy_value->>'workerClass' <> 'media_ingest_worker'
    or policy_value->>'region' <> 'us-east1'
    or (policy_value->>'maximumAttempts')::integer <> 3
    or (policy_value->>'leaseDurationMs')::bigint <> 300000
    or (policy_value->>'attemptDeadlineDurationMs')::bigint < 60000
    or (policy_value->>'attemptDeadlineDurationMs')::bigint > 86400000
    or (policy_value->>'minimumHeadroomBytes')::bigint <= 0
    or policy_value#>>'{resourceEnvelope,vcpuCount}' <> '4'
    or policy_value#>>'{resourceEnvelope,memoryGib}' <> '8'
    or policy_value#>>'{resourceEnvelope,gpuCount}' <> '0'
    or policy_value->>'workloadProfileId' <> 'large_media_ingest_cpu_4vcpu_8gib_v1'
    or policy_value->>'rateCardVersion' <> 'rp-ratecard-01-mock-safe'
    or policy_value->>'rateCardHash' <>
      '6ab9c0b36158e9c42521577ef31e4368753eb5e5c628e8974551d6395468ee6a'
    or coalesce(identity_value->>'uploadAuthorityFingerprint', '') !~ '^[a-f0-9]{64}$'
    or auth.uid() is null or auth.uid() <> owner_uuid
    or not public.reeditpro_has_workspace_write_access(workspace_uuid)
    or not exists (
      select 1 from public.projects project_source
      where project_source.id = project_uuid
        and project_source.workspace_id = workspace_uuid
    ) then
    raise exception using errcode = '42501', message = 'MEDIA_INGEST_SOURCE_AUTHORITY_INVALID';
  end if;
  idempotency_hash := public.reeditpro_media_ingest_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  perform pg_advisory_xact_lock(hashtextextended(job_value, 0));
  select * into existing
  from public.canonical_media_ingest_source_authorities source_authority
  where source_authority.job_id = job_value;
  if found then
    if existing.seed_sha256 <> seed->>'seedHash'
      or existing.registration_idempotency_key_sha256 <> idempotency_hash
      or existing.registration_request_sha256 <> p_request->>'requestHash' then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_SOURCE_IDEMPOTENCY_CONFLICT';
    end if;
    transaction_uuid := existing.registration_transaction_id;
    committed_at := existing.registered_at;
    disposition := 'idempotent_replay';
  else
    transaction_uuid := extensions.gen_random_uuid();
    committed_at := (p_request->>'requestedAt')::timestamptz;
    insert into public.canonical_media_ingest_source_authorities (
      job_id, workspace_id, project_id, owner_user_id, upload_intent_id,
      upload_purpose, expected_size_bytes, upload_authority_fingerprint_sha256,
      ingest_identity_sha256, policy_sha256, seed_sha256, seed_json,
      registration_idempotency_key_sha256, registration_request_sha256,
      registration_transaction_id, registered_at
    ) values (
      job_value, workspace_uuid, project_uuid, owner_uuid,
      identity_value->>'uploadIntentId', identity_value->>'uploadPurpose', expected_size,
      identity_value->>'uploadAuthorityFingerprint', identity_value->>'identityHash',
      policy_value->>'policyHash', seed->>'seedHash', seed, idempotency_hash,
      p_request->>'requestHash', transaction_uuid, committed_at
    );
  end if;
  return jsonb_build_object(
    'schemaVersion', 'canonical-v3-local-media-ingest-source-registration-receipt-v1',
    'jobId', job_value,
    'seedHash', seed->>'seedHash',
    'status', 'registered',
    'disposition', disposition,
    'transaction', jsonb_build_object(
      'transactionId', transaction_uuid::text,
      'committedAt', public.reeditpro_iso_timestamp(committed_at),
      'authenticatedTenantRlsVerified', true,
      'databaseTransactionVerified', true
    ),
    'boundaries', jsonb_build_object(
      'localLoopbackOnly', true,
      'uploadAuthorityDerivedServerSide', true,
      'browserSuppliedUploadAuthorityAccepted', false,
      'rawMediaPathSignedUrlUploadCredentialOrBytesPersisted', false,
      'remoteMutationAllowed', false,
      'cloudDispatchAllowed', false,
      'liveGcsObjectReadPerformed', false,
      'productionAuthority', false
    )
  );
end;
$$;

create or replace function public.reeditpro_media_ingest_create_terminal(
  p_seed jsonb,
  p_attempt jsonb,
  p_terminal_kind text,
  p_terminal_evidence_sha256 text,
  p_failure_category text,
  p_sanitized_failure_code text,
  p_completion_result jsonb,
  p_terminal_at text,
  p_queue_disposition text
)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  started_at timestamptz;
  finished_at timestamptz;
  wall_time_milliseconds bigint;
  billable_milliseconds bigint;
  billable_seconds double precision;
  expected_size_bytes bigint;
  temp_storage_gib_hours double precision;
  render_micros bigint := 0;
  cpu_micros bigint;
  memory_micros bigint;
  gpu_micros bigint := 0;
  temp_storage_micros bigint;
  output_storage_micros bigint := 0;
  network_egress_micros bigint := 0;
  raw_total_micros bigint;
  breakdown jsonb;
  usage_evidence_sha256 text;
  cost_payload jsonb;
  terminal_payload jsonb;
  retry_disposition text;
begin
  started_at := (p_attempt#>>'{attemptStart,startedAt}')::timestamptz;
  finished_at := p_terminal_at::timestamptz;
  wall_time_milliseconds := round(
    extract(epoch from (finished_at - started_at)) * 1000
  )::bigint;
  if wall_time_milliseconds <= 0
    or wall_time_milliseconds > (p_seed#>>'{policy,attemptDeadlineDurationMs}')::bigint
    or p_terminal_kind not in ('completion', 'failure', 'timeout')
    or p_queue_disposition not in (
      'completed', 'retry_available', 'attempts_exhausted',
      'terminal_source_or_validation_failure', 'cancelled'
    ) then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_TERMINAL_WINDOW_INVALID';
  end if;
  expected_size_bytes := (p_seed#>>'{identity,expectedSizeBytes}')::bigint;
  billable_milliseconds := greatest(
    1000::bigint,
    ceil(wall_time_milliseconds::numeric / 100)::bigint * 100
  );
  billable_seconds := billable_milliseconds::double precision / 1000.0;
  temp_storage_gib_hours :=
    (expected_size_bytes::double precision / 1073741824.0)
    * (wall_time_milliseconds::double precision / 3600000.0);
  cpu_micros := ceil(4.0 * billable_seconds * 140.0)::bigint;
  memory_micros := ceil(8.0 * billable_seconds * 40.0)::bigint;
  temp_storage_micros := ceil(temp_storage_gib_hours * 60.0)::bigint;
  raw_total_micros := render_micros + cpu_micros + memory_micros
    + gpu_micros + temp_storage_micros + output_storage_micros
    + network_egress_micros;
  breakdown := jsonb_build_object(
    'renderMicros', render_micros,
    'cpuMicros', cpu_micros,
    'memoryMicros', memory_micros,
    'gpuMicros', gpu_micros,
    'tempStorageMicros', temp_storage_micros,
    'outputStorageMicros', output_storage_micros,
    'networkEgressMicros', network_egress_micros,
    'rawTotalMicros', raw_total_micros,
    'computeAdjustedTotalMicros', raw_total_micros
  );
  usage_evidence_sha256 := public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_media_ingest_usage_v1',
    'attemptId', p_attempt->>'attemptId',
    'attemptStartEvidenceHash', p_attempt#>>'{attemptStart,evidenceHash}',
    'startedAt', p_attempt#>>'{attemptStart,startedAt}',
    'finishedAt', p_terminal_at,
    'wallTimeMilliseconds', wall_time_milliseconds,
    'tempStorageGibHours', to_jsonb(temp_storage_gib_hours),
    'resourceEnvelope', p_seed#>'{policy,resourceEnvelope}',
    'checkpointHash', p_attempt#>>'{latestCheckpoint,checkpointHash}'
  ));
  cost_payload := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-media-ingest-terminal-cost-v1',
    'attemptStartEvidenceHash', p_attempt#>>'{attemptStart,evidenceHash}',
    'usageEvidenceHash', usage_evidence_sha256,
    'rateCardVersion', p_seed#>>'{policy,rateCardVersion}',
    'rateCardHash', p_seed#>>'{policy,rateCardHash}',
    'workloadProfileId', p_seed#>>'{policy,workloadProfileId}',
    'billableMilliseconds', billable_milliseconds,
    'vcpuCount', 4,
    'memoryGib', 8,
    'gpuCount', 0,
    'tempStorageGibHours', to_jsonb(temp_storage_gib_hours),
    'actualInternalCostMicros', raw_total_micros,
    'breakdownHash', public.reeditpro_sha256_json(breakdown),
    'outcome', case p_terminal_kind
      when 'completion' then 'completed'
      when 'failure' then 'failed'
      else 'timeout'
    end,
    'finishedAt', p_terminal_at,
    'customerPriceCreditsServiceFeeWalletOrBillingIncluded', false,
    'invoiceReconciled', false
  );
  retry_disposition := case
    when p_queue_disposition = 'retry_available'
      then 'explicit_same_source_retry_available'
    when p_queue_disposition in (
      'attempts_exhausted', 'terminal_source_or_validation_failure'
    ) then 'fresh_upload_or_manual_review_required'
    else 'not_applicable'
  end;
  terminal_payload := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-media-ingest-terminal-v1',
    'terminalKind', p_terminal_kind,
    'terminalEvidenceHash', p_terminal_evidence_sha256,
    'terminalCost', cost_payload || jsonb_build_object(
      'evidenceHash', public.reeditpro_sha256_json(cost_payload)
    ),
    'queueDisposition', p_queue_disposition,
    'retryDisposition', retry_disposition,
    'automaticRetryStarted', false,
    'failureCategory', p_failure_category,
    'sanitizedFailureCode', p_sanitized_failure_code,
    'completionResult', p_completion_result,
    'terminalAt', p_terminal_at
  );
  return terminal_payload || jsonb_build_object(
    'terminalHash', public.reeditpro_sha256_json(terminal_payload)
  );
end;
$$;

create or replace function public.reeditpro_media_ingest_mutate(
  p_operation text,
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  source_record public.canonical_media_ingest_source_authorities%rowtype;
  job_record public.canonical_media_ingest_jobs%rowtype;
  attempt_record public.canonical_media_ingest_attempts%rowtype;
  existing_receipt public.canonical_media_ingest_idempotency_receipts%rowtype;
  seed jsonb;
  identity_value jsonb;
  policy_value jsonb;
  job_value text := p_request->>'jobId';
  idempotency_hash text;
  request_hash text := p_request->>'requestHash';
  current_job jsonb;
  response_attempt jsonb := null;
  active_attempt_value text;
  controller_hash text;
  current_revision bigint;
  previous_audit_hash text;
  revision_after bigint;
  transaction_id text;
  audit_hash text;
  transaction_payload jsonb;
  response_payload jsonb;
  response_value jsonb;
  committed_at_text text;
  committed_at_value timestamptz;
  attempt_number integer;
  attempt_id_value text;
  lease_id_value text;
  attempt_start_payload jsonb;
  attempt_value jsonb;
  resume_checkpoint jsonb;
  accepted_at timestamptz;
  deadline_at timestamptz;
  expires_at timestamptz;
  minimum_reserve bigint;
  required_available bigint;
  admission jsonb;
  admission_payload jsonb;
  prior_checkpoint jsonb;
  checkpoint_payload jsonb;
  checkpoint_value jsonb;
  previous_phase text;
  next_phase text;
  previous_rank integer;
  next_rank integer;
  previous_offset bigint;
  next_offset bigint;
  mutation_time timestamptz;
  completion_payload jsonb;
  completion_value jsonb;
  terminal_value jsonb;
  queue_disposition text;
  retryable boolean;
  job_state text;
begin
  if p_operation not in (
    'enqueue', 'claim_and_start', 'record_progress', 'reconcile_completion',
    'reconcile_failure', 'request_cancellation'
  ) then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_OPERATION_INVALID';
  end if;
  perform public.reeditpro_media_ingest_require_request(p_operation, p_request);
  perform pg_advisory_xact_lock(hashtextextended(job_value, 0));
  idempotency_hash := public.reeditpro_media_ingest_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  select * into source_record
  from public.canonical_media_ingest_source_authorities source_authority
  where source_authority.job_id = job_value;
  if not found or auth.uid() is null or auth.uid() <> source_record.owner_user_id
    or not public.reeditpro_has_workspace_write_access(source_record.workspace_id) then
    raise exception using errcode = '42501', message = 'MEDIA_INGEST_TENANT_AUTHORITY_INVALID';
  end if;
  select * into existing_receipt
  from public.canonical_media_ingest_idempotency_receipts receipt
  where receipt.job_id = job_value
    and receipt.operation = p_operation
    and receipt.idempotency_key_sha256 = idempotency_hash;
  if found then
    if existing_receipt.request_sha256 <> request_hash then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'idempotencyStatus', 'exact_replay',
      'response', existing_receipt.result_json
    );
  end if;
  seed := source_record.seed_json;
  identity_value := seed->'identity';
  policy_value := seed->'policy';
  select * into job_record
  from public.canonical_media_ingest_jobs job
  where job.job_id = job_value
  for update;
  if p_operation = 'enqueue' then
    if found then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_ALREADY_ENQUEUED';
    end if;
    controller_hash := p_request->>'controllerIdentityEvidenceHash';
    if coalesce(controller_hash, '') !~ '^[a-f0-9]{64}$' then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTROLLER_INVALID';
    end if;
    current_job := jsonb_build_object(
      'jobId', job_value,
      'state', 'queued',
      'attemptCount', 0,
      'maximumAttempts', 3,
      'remainingAttempts', 3,
      'sourceObjectIdentityEvidenceHash', null,
      'latestDurableCheckpoint', null,
      'cancellationRequestedAt', null,
      'automaticRetryStarted', false
    );
    current_revision := 0;
    active_attempt_value := null;
    previous_audit_hash := public.reeditpro_media_ingest_empty_audit_hash();
    committed_at_text := p_request->>'requestedAt';
    begin committed_at_value := committed_at_text::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    insert into public.canonical_media_ingest_jobs (
      job_id, workspace_id, project_id, owner_user_id, revision, job_json,
      active_attempt_id, controller_identity_evidence_sha256,
      audit_chain_head_sha256, created_at, updated_at
    ) values (
      job_value, source_record.workspace_id, source_record.project_id,
      source_record.owner_user_id, 0, current_job, null, controller_hash,
      previous_audit_hash, committed_at_value, committed_at_value
    );
  else
    if not found or job_record.job_json is null then
      raise exception using errcode = 'P0002', message = 'MEDIA_INGEST_JOB_NOT_FOUND';
    end if;
    current_job := job_record.job_json;
    current_revision := job_record.revision;
    active_attempt_value := job_record.active_attempt_id;
    controller_hash := job_record.controller_identity_evidence_sha256;
    previous_audit_hash := job_record.audit_chain_head_sha256;
  end if;

  if p_operation = 'claim_and_start' then
    if p_request->>'controllerIdentityEvidenceHash' <> controller_hash
      or current_job->>'state' not in ('queued', 'retry_available')
      or active_attempt_value is not null
      or (current_job->>'attemptCount')::integer >= 3 then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_CLAIM_NOT_AVAILABLE';
    end if;
    admission := p_request->'capacityAdmission';
    minimum_reserve := greatest(
      (policy_value->>'minimumHeadroomBytes')::bigint,
      ceil(source_record.expected_size_bytes::numeric * 0.1)::bigint
    );
    required_available := source_record.expected_size_bytes + minimum_reserve;
    admission_payload := admission - 'evidenceHash';
    if jsonb_typeof(admission) <> 'object'
      or admission->>'policyId' <> 'large_media_worker_capacity_v1'
      or (admission->>'expectedSourceBytes')::bigint <> source_record.expected_size_bytes
      or (admission->>'sourceStagingBytes')::bigint <> source_record.expected_size_bytes
      or (admission->>'safetyReserveBytes')::bigint <> minimum_reserve
      or (admission->>'requiredAvailableBytes')::bigint <> required_available
      or (admission->>'observedAvailableBytes')::bigint < required_available
      or admission->>'byteTraversalAuthorized' <> 'true'
      or admission->>'evidenceHash' <> public.reeditpro_sha256_json(
        jsonb_build_object(
          'domain', 'canonical_distributed_media_ingest_capacity_admission_v1',
          'ingestIdentityHash', source_record.ingest_identity_sha256
        ) || admission_payload
      ) then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_CAPACITY_INVALID';
    end if;
    if current_job->>'sourceObjectIdentityEvidenceHash' is not null
      and current_job->>'sourceObjectIdentityEvidenceHash' <>
        p_request->>'sourceObjectIdentityEvidenceHash' then
      raise exception using errcode = '23514', message = 'MEDIA_INGEST_SOURCE_CHANGED';
    end if;
    attempt_number := (current_job->>'attemptCount')::integer + 1;
    attempt_id_value := public.reeditpro_media_ingest_identifier(
      'mediaingestattempt',
      jsonb_build_object(
        'identityHash', source_record.ingest_identity_sha256,
        'attemptNumber', attempt_number
      )
    );
    lease_id_value := public.reeditpro_media_ingest_identifier(
      'mediaingestlease',
      jsonb_build_object(
        'attemptId', attempt_id_value,
        'workerIdentityEvidenceHash', p_request->>'workerIdentityEvidenceHash'
      )
    );
    begin accepted_at := (p_request->>'acceptedAt')::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    deadline_at := accepted_at
      + interval '1 millisecond' * (policy_value->>'attemptDeadlineDurationMs')::bigint;
    expires_at := least(
      accepted_at + interval '1 millisecond' * (policy_value->>'leaseDurationMs')::bigint,
      deadline_at
    );
    resume_checkpoint := current_job->'latestDurableCheckpoint';
    attempt_start_payload := jsonb_build_object(
      'schemaVersion', 'canonical-distributed-media-ingest-attempt-start-v1',
      'workerIdentityEvidenceHash', p_request->>'workerIdentityEvidenceHash',
      'workerReceiptHash', p_request->>'workerReceiptHash',
      'capacityAdmissionEvidenceHash', admission->>'evidenceHash',
      'capacityReservationIdentityHash', admission->>'reservationIdentityHash',
      'requiredAvailableBytes', required_available,
      'sourceObjectIdentityEvidenceHash', p_request->>'sourceObjectIdentityEvidenceHash',
      'workloadProfileId', policy_value->>'workloadProfileId',
      'rateCardVersion', policy_value->>'rateCardVersion',
      'rateCardHash', policy_value->>'rateCardHash',
      'resourceEnvelope', policy_value->'resourceEnvelope',
      'resumeOffsetBytes', coalesce((resume_checkpoint->>'verifiedByteOffset')::bigint, 0),
      'resumeCheckpointHash', resume_checkpoint->>'checkpointHash',
      'startedAt', p_request->>'acceptedAt',
      'approvedPlanSnapshotOrCreditReservationRequired', false,
      'customerPriceCreditsServiceFeeWalletOrBillingIncluded', false
    );
    attempt_value := jsonb_build_object(
      'attemptId', attempt_id_value,
      'jobId', job_value,
      'attemptNumber', attempt_number,
      'leaseId', lease_id_value,
      'leaseHash', public.reeditpro_sha256_json(jsonb_build_object(
        'domain', 'canonical_distributed_media_ingest_lease_v1',
        'leaseId', lease_id_value,
        'attemptId', attempt_id_value
      )),
      'state', 'running',
      'heartbeatAt', p_request->>'acceptedAt',
      'heartbeatCount', 0,
      'leaseExpiresAt', public.reeditpro_iso_timestamp(expires_at),
      'attemptDeadlineAt', public.reeditpro_iso_timestamp(deadline_at),
      'attemptStart', attempt_start_payload || jsonb_build_object(
        'evidenceHash', public.reeditpro_sha256_json(attempt_start_payload)
      ),
      'latestCheckpoint', resume_checkpoint,
      'terminal', null
    );
    current_job := current_job || jsonb_build_object(
      'state', 'running',
      'attemptCount', attempt_number,
      'remainingAttempts', 3 - attempt_number,
      'sourceObjectIdentityEvidenceHash', p_request->>'sourceObjectIdentityEvidenceHash',
      'cancellationRequestedAt', null
    );
    active_attempt_value := attempt_id_value;
    insert into public.canonical_media_ingest_attempts (
      attempt_id, job_id, workspace_id, project_id, owner_user_id,
      attempt_number, state, attempt_json, created_at, updated_at
    ) values (
      attempt_id_value, job_value, source_record.workspace_id,
      source_record.project_id, source_record.owner_user_id, attempt_number,
      'running', attempt_value, accepted_at, accepted_at
    );
    response_attempt := attempt_value;
    committed_at_text := p_request->>'acceptedAt';
    committed_at_value := accepted_at;
  elsif p_operation = 'record_progress' then
    if current_job->>'state' <> 'running'
      or active_attempt_value is null
      or active_attempt_value <> p_request->>'attemptId' then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_PROGRESS_NOT_ACTIVE';
    end if;
    select * into attempt_record
    from public.canonical_media_ingest_attempts attempt
    where attempt.attempt_id = active_attempt_value and attempt.job_id = job_value
    for update;
    if not found
      or attempt_record.attempt_json#>>'{attemptStart,workerIdentityEvidenceHash}' <>
        p_request->>'workerIdentityEvidenceHash'
      or attempt_record.attempt_json#>>'{attemptStart,workerReceiptHash}' <>
        p_request->>'workerReceiptHash' then
      raise exception using errcode = '42501', message = 'MEDIA_INGEST_WORKER_AUTHORITY_INVALID';
    end if;
    begin mutation_time := (p_request->>'heartbeatAt')::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    if mutation_time <= (attempt_record.attempt_json->>'heartbeatAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'leaseExpiresAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'attemptDeadlineAt')::timestamptz then
      raise exception using errcode = '55000', message = 'MEDIA_INGEST_LEASE_EXPIRED';
    end if;
    prior_checkpoint := attempt_record.attempt_json->'latestCheckpoint';
    previous_phase := prior_checkpoint->>'phase';
    next_phase := p_request->>'phase';
    previous_rank := case previous_phase
      when 'hashing' then 1 when 'hash_complete' then 2
      when 'probe_complete' then 3 when 'canonical_commit_ready' then 4 else 0 end;
    next_rank := case next_phase
      when 'hashing' then 1 when 'hash_complete' then 2
      when 'probe_complete' then 3 when 'canonical_commit_ready' then 4 else -1 end;
    previous_offset := coalesce((prior_checkpoint->>'verifiedByteOffset')::bigint, 0);
    next_offset := (p_request->>'verifiedByteOffset')::bigint;
    if next_rank < previous_rank or next_offset < previous_offset
      or (next_phase = 'hashing' and not (
        next_offset > previous_offset and next_offset < source_record.expected_size_bytes
      ))
      or (next_phase <> 'hashing' and next_offset <> source_record.expected_size_bytes)
      or (next_phase = 'hashing' and next_rank not in (previous_rank, previous_rank + 1))
      or (next_phase <> 'hashing' and next_rank <> previous_rank + 1) then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_PROGRESS_NON_MONOTONIC';
    end if;
    checkpoint_payload := jsonb_build_object(
      'schemaVersion', 'canonical-distributed-media-ingest-checkpoint-v1',
      'checkpointSequence', coalesce((prior_checkpoint->>'checkpointSequence')::bigint, 0) + 1,
      'phase', next_phase,
      'verifiedByteOffset', next_offset,
      'continuationStateObjectIdentityHash', p_request->>'continuationStateObjectIdentityHash',
      'checkpointEvidenceHash', p_request->>'checkpointEvidenceHash',
      'sourceObjectIdentityEvidenceHash',
        attempt_record.attempt_json#>>'{attemptStart,sourceObjectIdentityEvidenceHash}',
      'recordedAt', p_request->>'heartbeatAt'
    );
    checkpoint_value := checkpoint_payload || jsonb_build_object(
      'checkpointHash', public.reeditpro_sha256_json(checkpoint_payload)
    );
    expires_at := least(
      mutation_time + interval '1 millisecond' * (policy_value->>'leaseDurationMs')::bigint,
      (attempt_record.attempt_json->>'attemptDeadlineAt')::timestamptz
    );
    attempt_value := attempt_record.attempt_json || jsonb_build_object(
      'heartbeatAt', p_request->>'heartbeatAt',
      'heartbeatCount', (attempt_record.attempt_json->>'heartbeatCount')::bigint + 1,
      'leaseExpiresAt', public.reeditpro_iso_timestamp(expires_at),
      'latestCheckpoint', checkpoint_value
    );
    current_job := current_job || jsonb_build_object(
      'latestDurableCheckpoint', checkpoint_value
    );
    update public.canonical_media_ingest_attempts
    set attempt_json = attempt_value, updated_at = mutation_time
    where attempt_id = attempt_record.attempt_id;
    response_attempt := attempt_value;
    committed_at_text := p_request->>'heartbeatAt';
    committed_at_value := mutation_time;
  elsif p_operation = 'reconcile_completion' then
    if current_job->>'state' <> 'running'
      or active_attempt_value is null
      or active_attempt_value <> p_request->>'attemptId' then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_COMPLETION_NOT_ACTIVE';
    end if;
    select * into attempt_record from public.canonical_media_ingest_attempts attempt
    where attempt.attempt_id = active_attempt_value and attempt.job_id = job_value for update;
    if not found
      or attempt_record.attempt_json#>>'{attemptStart,workerIdentityEvidenceHash}' <>
        p_request->>'workerIdentityEvidenceHash'
      or attempt_record.attempt_json#>>'{attemptStart,workerReceiptHash}' <>
        p_request->>'workerReceiptHash' then
      raise exception using errcode = '42501', message = 'MEDIA_INGEST_WORKER_AUTHORITY_INVALID';
    end if;
    begin mutation_time := (p_request->>'completedAt')::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    if mutation_time < (attempt_record.attempt_json->>'heartbeatAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'leaseExpiresAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'attemptDeadlineAt')::timestamptz then
      raise exception using errcode = '55000', message = 'MEDIA_INGEST_LEASE_EXPIRED';
    end if;
    prior_checkpoint := attempt_record.attempt_json->'latestCheckpoint';
    if prior_checkpoint->>'phase' <> 'canonical_commit_ready'
      or (prior_checkpoint->>'verifiedByteOffset')::bigint <> source_record.expected_size_bytes
      or (p_request->>'sizeBytes')::bigint <> source_record.expected_size_bytes
      or p_request->>'generationIdentityHash' <>
        attempt_record.attempt_json#>>'{attemptStart,sourceObjectIdentityEvidenceHash}' then
      raise exception using errcode = '55000', message = 'MEDIA_INGEST_COMPLETION_DEPENDENCY_NOT_READY';
    end if;
    completion_payload := jsonb_build_object(
      'schemaVersion', 'canonical-distributed-media-ingest-completion-v1',
      'uploadIntentId', source_record.upload_intent_id,
      'mediaAssetId', p_request->>'mediaAssetId',
      'storageObjectRecordId', p_request->>'storageObjectRecordId',
      'sizeBytes', source_record.expected_size_bytes,
      'checksumSha256', p_request->>'checksumSha256',
      'sourceMetadataHash', p_request->>'sourceMetadataHash',
      'generationIdentityHash', p_request->>'generationIdentityHash',
      'canonicalOutcomeHash', p_request->>'canonicalOutcomeHash',
      'privateCreateOnlyReadbackVerified', true,
      'rawPathSignedUrlOrProviderUrlPersisted', false
    );
    completion_value := completion_payload || jsonb_build_object(
      'resultHash', public.reeditpro_sha256_json(completion_payload)
    );
    terminal_value := public.reeditpro_media_ingest_create_terminal(
      seed, attempt_record.attempt_json, 'completion',
      p_request->>'canonicalOutcomeHash', null, null, completion_value,
      p_request->>'completedAt', 'completed'
    );
    attempt_value := attempt_record.attempt_json || jsonb_build_object(
      'state', 'completed', 'terminal', terminal_value
    );
    current_job := current_job || jsonb_build_object('state', 'completed');
    active_attempt_value := null;
    update public.canonical_media_ingest_attempts
    set state = 'completed', attempt_json = attempt_value, updated_at = mutation_time
    where attempt_id = attempt_record.attempt_id;
    response_attempt := attempt_value;
    committed_at_text := p_request->>'completedAt';
    committed_at_value := mutation_time;
  elsif p_operation = 'reconcile_failure' then
    if active_attempt_value is null or active_attempt_value <> p_request->>'attemptId' then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_FAILURE_NOT_ACTIVE';
    end if;
    select * into attempt_record from public.canonical_media_ingest_attempts attempt
    where attempt.attempt_id = active_attempt_value and attempt.job_id = job_value for update;
    if not found
      or attempt_record.attempt_json#>>'{attemptStart,workerIdentityEvidenceHash}' <>
        p_request->>'workerIdentityEvidenceHash'
      or attempt_record.attempt_json#>>'{attemptStart,workerReceiptHash}' <>
        p_request->>'workerReceiptHash' then
      raise exception using errcode = '42501', message = 'MEDIA_INGEST_WORKER_AUTHORITY_INVALID';
    end if;
    begin mutation_time := (p_request->>'failedAt')::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    if mutation_time < (attempt_record.attempt_json->>'heartbeatAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'leaseExpiresAt')::timestamptz
      or mutation_time >= (attempt_record.attempt_json->>'attemptDeadlineAt')::timestamptz then
      raise exception using errcode = '55000', message = 'MEDIA_INGEST_LEASE_EXPIRED';
    end if;
    if ((p_request->>'failureCategory') = 'cancelled') <>
      ((current_job->>'state') = 'cancellation_requested') then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_CANCELLATION_MISMATCH';
    end if;
    retryable := p_request->>'failureCategory' in ('reeditpro_error_absorbed', 'unknown');
    queue_disposition := case
      when p_request->>'failureCategory' = 'cancelled' then 'cancelled'
      when retryable and (current_job->>'remainingAttempts')::integer > 0 then 'retry_available'
      when retryable then 'attempts_exhausted'
      else 'terminal_source_or_validation_failure'
    end;
    terminal_value := public.reeditpro_media_ingest_create_terminal(
      seed, attempt_record.attempt_json, 'failure',
      p_request->>'failureEvidenceHash', p_request->>'failureCategory',
      p_request->>'sanitizedFailureCode', null, p_request->>'failedAt',
      queue_disposition
    );
    attempt_value := attempt_record.attempt_json || jsonb_build_object(
      'state', 'failed', 'terminal', terminal_value
    );
    job_state := case
      when queue_disposition = 'retry_available' then 'retry_available'
      when queue_disposition = 'cancelled' then 'cancelled'
      else 'failed_terminal'
    end;
    current_job := current_job || jsonb_build_object(
      'state', job_state, 'cancellationRequestedAt', null
    );
    active_attempt_value := null;
    update public.canonical_media_ingest_attempts
    set state = 'failed', attempt_json = attempt_value, updated_at = mutation_time
    where attempt_id = attempt_record.attempt_id;
    response_attempt := attempt_value;
    committed_at_text := p_request->>'failedAt';
    committed_at_value := mutation_time;
  elsif p_operation = 'request_cancellation' then
    if p_request->>'controllerIdentityEvidenceHash' <> controller_hash then
      raise exception using errcode = '42501', message = 'MEDIA_INGEST_CONTROLLER_INVALID';
    end if;
    begin mutation_time := (p_request->>'requestedAt')::timestamptz;
    exception when others then
      raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
    end;
    if current_job->>'state' in ('queued', 'retry_available') then
      current_job := current_job || jsonb_build_object(
        'state', 'cancelled', 'cancellationRequestedAt', null
      );
      response_attempt := null;
    elsif current_job->>'state' = 'running' and active_attempt_value is not null then
      select * into attempt_record from public.canonical_media_ingest_attempts attempt
      where attempt.attempt_id = active_attempt_value and attempt.job_id = job_value for update;
      if not found
        or mutation_time < (attempt_record.attempt_json->>'heartbeatAt')::timestamptz
        or mutation_time >= (attempt_record.attempt_json->>'leaseExpiresAt')::timestamptz
        or mutation_time >= (attempt_record.attempt_json->>'attemptDeadlineAt')::timestamptz then
        raise exception using errcode = '55000', message = 'MEDIA_INGEST_LEASE_EXPIRED';
      end if;
      attempt_value := attempt_record.attempt_json || jsonb_build_object(
        'state', 'cancellation_requested'
      );
      current_job := current_job || jsonb_build_object(
        'state', 'cancellation_requested',
        'cancellationRequestedAt', p_request->>'requestedAt'
      );
      update public.canonical_media_ingest_attempts
      set state = 'cancellation_requested', attempt_json = attempt_value,
        updated_at = mutation_time
      where attempt_id = attempt_record.attempt_id;
      response_attempt := attempt_value;
    else
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_CANCELLATION_NOT_AVAILABLE';
    end if;
    committed_at_text := p_request->>'requestedAt';
    committed_at_value := mutation_time;
  end if;

  revision_after := current_revision + 1;
  transaction_id := public.reeditpro_media_ingest_identifier(
    'mediaingesttx',
    jsonb_build_object(
      'identityHash', source_record.ingest_identity_sha256,
      'operation', p_operation,
      'revisionAfter', revision_after,
      'requestHash', request_hash
    )
  );
  audit_hash := public.reeditpro_sha256_json(jsonb_build_object(
    'domain', 'canonical_distributed_media_ingest_audit_v1',
    'previousEventHash', previous_audit_hash,
    'identityHash', source_record.ingest_identity_sha256,
    'operation', p_operation,
    'transactionId', transaction_id,
    'attemptId', response_attempt->>'attemptId',
    'revision', revision_after
  ));
  transaction_payload := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-media-ingest-transaction-v1',
    'transactionId', transaction_id,
    'operation', p_operation,
    'ingestIdentityHash', source_record.ingest_identity_sha256,
    'revisionBefore', current_revision,
    'revisionAfter', revision_after,
    'requestHash', request_hash,
    'idempotencyKeyHash', idempotency_hash,
    'auditEventHash', audit_hash,
    'committedAt', committed_at_text
  );
  response_payload := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-media-ingest-state-response-v1',
    'operation', p_operation,
    'transaction', transaction_payload || jsonb_build_object(
      'transactionHash', public.reeditpro_sha256_json(transaction_payload)
    ),
    'job', current_job,
    'attempt', response_attempt,
    'boundaries', public.reeditpro_media_ingest_boundaries()
  );
  response_value := response_payload || jsonb_build_object(
    'responseHash', public.reeditpro_sha256_json(response_payload)
  );
  update public.canonical_media_ingest_jobs
  set revision = revision_after, job_json = current_job,
    active_attempt_id = active_attempt_value,
    audit_chain_head_sha256 = audit_hash,
    updated_at = committed_at_value
  where job_id = job_value;
  insert into public.canonical_media_ingest_audit_events (
    job_id, workspace_id, project_id, owner_user_id, revision, operation,
    transaction_id, attempt_id, previous_event_sha256, event_sha256, committed_at
  ) values (
    job_value, source_record.workspace_id, source_record.project_id,
    source_record.owner_user_id, revision_after, p_operation, transaction_id,
    response_attempt->>'attemptId', previous_audit_hash, audit_hash, committed_at_value
  );
  insert into public.canonical_media_ingest_idempotency_receipts (
    job_id, workspace_id, project_id, owner_user_id, operation,
    idempotency_key_sha256, request_sha256, result_json, response_sha256, committed_at
  ) values (
    job_value, source_record.workspace_id, source_record.project_id,
    source_record.owner_user_id, p_operation, idempotency_hash, request_hash,
    response_value, response_value->>'responseHash', committed_at_value
  );
  return jsonb_build_object('idempotencyStatus', 'inserted', 'response', response_value);
end;
$$;

create or replace function public.reeditpro_media_ingest_finalize_timeout(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  source_record public.canonical_media_ingest_source_authorities%rowtype;
  job_record public.canonical_media_ingest_jobs%rowtype;
  attempt_record public.canonical_media_ingest_attempts%rowtype;
  existing_receipt public.canonical_media_ingest_idempotency_receipts%rowtype;
  job_value text := p_request->>'jobId';
  request_hash text := p_request->>'requestHash';
  idempotency_hash text;
  observed_at timestamptz;
  current_job jsonb;
  attempt_value jsonb := null;
  terminal_value jsonb;
  queue_disposition text;
  job_state text;
  response_payload jsonb;
  response_value jsonb;
  transaction_value jsonb := null;
  transaction_payload jsonb;
  transaction_id text;
  audit_hash text;
  revision_after bigint;
  terminal_at_text text;
  terminal_at_value timestamptz;
begin
  perform public.reeditpro_media_ingest_require_request(
    'finalize_expired_attempt', p_request
  );
  perform pg_advisory_xact_lock(hashtextextended(job_value, 0));
  idempotency_hash := public.reeditpro_media_ingest_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  select * into source_record
  from public.canonical_media_ingest_source_authorities source_authority
  where source_authority.job_id = job_value;
  if not found or auth.uid() is null or auth.uid() <> source_record.owner_user_id
    or not public.reeditpro_has_workspace_write_access(source_record.workspace_id) then
    raise exception using errcode = '42501', message = 'MEDIA_INGEST_TENANT_AUTHORITY_INVALID';
  end if;
  select * into existing_receipt
  from public.canonical_media_ingest_idempotency_receipts receipt
  where receipt.job_id = job_value
    and receipt.operation = 'finalize_expired_attempt'
    and receipt.idempotency_key_sha256 = idempotency_hash;
  if found then
    if existing_receipt.request_sha256 <> request_hash then
      raise exception using errcode = '23505', message = 'MEDIA_INGEST_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'idempotencyStatus', 'exact_replay',
      'response', existing_receipt.result_json
    );
  end if;
  select * into job_record
  from public.canonical_media_ingest_jobs job
  where job.job_id = job_value
  for update;
  if not found or job_record.job_json is null then
    raise exception using errcode = 'P0002', message = 'MEDIA_INGEST_JOB_NOT_FOUND';
  end if;
  if p_request->>'controllerIdentityEvidenceHash' <>
    job_record.controller_identity_evidence_sha256 then
    raise exception using errcode = '42501', message = 'MEDIA_INGEST_CONTROLLER_INVALID';
  end if;
  begin observed_at := (p_request->>'observedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_TIMESTAMP_INVALID';
  end;
  current_job := job_record.job_json;
  if job_record.active_attempt_id is not null then
    select * into attempt_record
    from public.canonical_media_ingest_attempts attempt
    where attempt.attempt_id = job_record.active_attempt_id
      and attempt.job_id = job_value
    for update;
  end if;
  if job_record.active_attempt_id is not null
    and found
    and attempt_record.state in ('running', 'cancellation_requested')
    and (attempt_record.attempt_json->>'leaseExpiresAt')::timestamptz <= observed_at then
    terminal_at_text := attempt_record.attempt_json->>'leaseExpiresAt';
    terminal_at_value := terminal_at_text::timestamptz;
    queue_disposition := case
      when current_job->>'state' = 'cancellation_requested' then 'cancelled'
      when (current_job->>'remainingAttempts')::integer > 0 then 'retry_available'
      else 'attempts_exhausted'
    end;
    terminal_value := public.reeditpro_media_ingest_create_terminal(
      source_record.seed_json,
      attempt_record.attempt_json,
      'timeout',
      public.reeditpro_sha256_json(jsonb_build_object(
        'domain', 'canonical_distributed_media_ingest_timeout_v1',
        'attemptId', attempt_record.attempt_json->>'attemptId',
        'leaseHash', attempt_record.attempt_json->>'leaseHash',
        'heartbeatAt', attempt_record.attempt_json->>'heartbeatAt',
        'leaseExpiresAt', attempt_record.attempt_json->>'leaseExpiresAt',
        'checkpointHash', attempt_record.attempt_json#>>'{latestCheckpoint,checkpointHash}'
      )),
      null, null, null, terminal_at_text, queue_disposition
    );
    attempt_value := attempt_record.attempt_json || jsonb_build_object(
      'state', 'timed_out', 'terminal', terminal_value
    );
    job_state := case
      when queue_disposition = 'retry_available' then 'retry_available'
      when queue_disposition = 'cancelled' then 'cancelled'
      else 'failed_terminal'
    end;
    current_job := current_job || jsonb_build_object(
      'state', job_state, 'cancellationRequestedAt', null
    );
    update public.canonical_media_ingest_attempts
    set state = 'timed_out', attempt_json = attempt_value,
      updated_at = terminal_at_value
    where attempt_id = attempt_record.attempt_id;
    revision_after := job_record.revision + 1;
    transaction_id := public.reeditpro_media_ingest_identifier(
      'mediaingesttimeouttx',
      jsonb_build_object(
        'identityHash', source_record.ingest_identity_sha256,
        'revisionAfter', revision_after,
        'requestHash', request_hash
      )
    );
    audit_hash := public.reeditpro_sha256_json(jsonb_build_object(
      'domain', 'canonical_distributed_media_ingest_audit_v1',
      'previousEventHash', job_record.audit_chain_head_sha256,
      'identityHash', source_record.ingest_identity_sha256,
      'operation', 'finalize_expired_attempt',
      'transactionId', transaction_id,
      'attemptId', attempt_record.attempt_id,
      'revision', revision_after
    ));
    transaction_payload := jsonb_build_object(
      'transactionId', transaction_id,
      'revisionBefore', job_record.revision,
      'revisionAfter', revision_after,
      'auditEventHash', audit_hash,
      'committedAt', terminal_at_text
    );
    transaction_value := transaction_payload || jsonb_build_object(
      'transactionHash', public.reeditpro_sha256_json(transaction_payload)
    );
    update public.canonical_media_ingest_jobs
    set revision = revision_after, job_json = current_job,
      active_attempt_id = null, audit_chain_head_sha256 = audit_hash,
      updated_at = terminal_at_value
    where job_id = job_value;
    insert into public.canonical_media_ingest_audit_events (
      job_id, workspace_id, project_id, owner_user_id, revision, operation,
      transaction_id, attempt_id, previous_event_sha256, event_sha256, committed_at
    ) values (
      job_value, source_record.workspace_id, source_record.project_id,
      source_record.owner_user_id, revision_after, 'finalize_expired_attempt',
      transaction_id, attempt_record.attempt_id,
      job_record.audit_chain_head_sha256, audit_hash, terminal_at_value
    );
  end if;
  response_payload := jsonb_build_object(
    'schemaVersion', 'canonical-distributed-media-ingest-timeout-response-v1',
    'operation', 'finalize_expired_attempt',
    'jobId', job_value,
    'ingestIdentityHash', source_record.ingest_identity_sha256,
    'requestHash', request_hash,
    'idempotencyKeyHash', idempotency_hash,
    'observedAt', p_request->>'observedAt',
    'expiredAttemptReconciled', transaction_value is not null,
    'job', current_job,
    'attempt', attempt_value,
    'transaction', transaction_value,
    'boundaries', public.reeditpro_media_ingest_boundaries() || jsonb_build_object(
      'activeAttemptSelectedByTransaction', true,
      'callerSelectedAttemptOrExpiryAllowed', false,
      'terminalCostBoundedAtImmutableLeaseExpiry', true
    )
  );
  response_value := response_payload || jsonb_build_object(
    'responseHash', public.reeditpro_sha256_json(response_payload)
  );
  insert into public.canonical_media_ingest_idempotency_receipts (
    job_id, workspace_id, project_id, owner_user_id, operation,
    idempotency_key_sha256, request_sha256, result_json, response_sha256, committed_at
  ) values (
    job_value, source_record.workspace_id, source_record.project_id,
    source_record.owner_user_id, 'finalize_expired_attempt', idempotency_hash,
    request_hash, response_value, response_value->>'responseHash', observed_at
  );
  return jsonb_build_object('idempotencyStatus', 'inserted', 'response', response_value);
end;
$$;

create or replace function public.reeditpro_enqueue_media_ingest_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('enqueue', p_request);
end; $$;

create or replace function public.reeditpro_claim_and_start_media_ingest_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('claim_and_start', p_request);
end; $$;

create or replace function public.reeditpro_record_media_ingest_progress_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('record_progress', p_request);
end; $$;

create or replace function public.reeditpro_reconcile_media_ingest_completion_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('reconcile_completion', p_request);
end; $$;

create or replace function public.reeditpro_reconcile_media_ingest_failure_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('reconcile_failure', p_request);
end; $$;

create or replace function public.reeditpro_request_media_ingest_cancellation_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_mutate('request_cancellation', p_request);
end; $$;

create or replace function public.reeditpro_finalize_expired_media_ingest_attempt_v1(
  p_contract_version text, p_request jsonb
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$ begin
  if p_contract_version <> 'canonical-distributed-media-ingest-state-port-v1' then
    raise exception using errcode = '22023', message = 'MEDIA_INGEST_CONTRACT_VERSION_INVALID';
  end if;
  return public.reeditpro_media_ingest_finalize_timeout(p_request);
end; $$;

revoke all on function public.reeditpro_media_ingest_idempotency_key_hash(text)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_request_hash(text,jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_identifier(text,jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_empty_audit_hash()
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_boundaries()
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_assert_local_internal_authority(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_require_request(text,jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_create_terminal(
  jsonb,jsonb,text,text,text,text,jsonb,text,text
) from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_mutate(text,jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.reeditpro_media_ingest_finalize_timeout(jsonb)
  from public, anon, authenticated, service_role;

revoke all on function public.reeditpro_register_media_ingest_source_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_register_media_ingest_source_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_enqueue_media_ingest_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_enqueue_media_ingest_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_claim_and_start_media_ingest_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_claim_and_start_media_ingest_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_record_media_ingest_progress_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_record_media_ingest_progress_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_reconcile_media_ingest_completion_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_reconcile_media_ingest_completion_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_reconcile_media_ingest_failure_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_reconcile_media_ingest_failure_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_request_media_ingest_cancellation_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_request_media_ingest_cancellation_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_finalize_expired_media_ingest_attempt_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_finalize_expired_media_ingest_attempt_v1(text,jsonb)
  to authenticated;
