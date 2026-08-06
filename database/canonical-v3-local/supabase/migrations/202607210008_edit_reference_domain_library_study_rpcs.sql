-- Canonical V3 local: explicit Edit Reference library/study domain commands.
-- This migration is isolated from the frozen historical supabase/migrations
-- chain. It deliberately does not accept an aggregate replacement.

create table public.edit_reference_domain_states (
  workspace_id uuid not null,
  owner_user_id uuid not null,
  revision bigint not null default 0 check (revision >= 0),
  audit_event_count bigint not null default 0 check (audit_event_count >= 0),
  idempotency_receipt_count bigint not null default 0 check (idempotency_receipt_count >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, owner_user_id),
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create table public.edit_reference_domain_audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  actor_user_id uuid not null,
  sequence bigint not null check (sequence >= 1),
  aggregate_revision bigint not null check (aggregate_revision >= 1),
  event_type text not null check (length(event_type) between 1 and 160),
  edit_reference_id uuid,
  study_session_id uuid,
  event_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, actor_user_id, sequence),
  foreign key (workspace_id, actor_user_id)
    references public.edit_reference_domain_states(workspace_id, owner_user_id) on delete restrict,
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

create table public.edit_reference_domain_idempotency_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  actor_user_id uuid not null,
  ledger_sequence bigint not null check (ledger_sequence >= 1),
  operation text not null check (length(operation) between 1 and 240),
  idempotency_key_hash_sha256 text not null check (idempotency_key_hash_sha256 ~ '^[a-f0-9]{64}$'),
  request_hash_sha256 text not null check (request_hash_sha256 ~ '^[a-f0-9]{64}$'),
  committed_revision bigint not null check (committed_revision >= 1),
  result_json jsonb not null,
  receipt_json jsonb not null,
  receipt_digest_sha256 text not null check (receipt_digest_sha256 ~ '^[a-f0-9]{64}$'),
  completed_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, actor_user_id, ledger_sequence),
  unique (workspace_id, actor_user_id, idempotency_key_hash_sha256),
  foreign key (workspace_id, actor_user_id)
    references public.edit_reference_domain_states(workspace_id, owner_user_id) on delete restrict
);

-- PreferenceAssetRecord is the saved study-source/evidence identity. The
-- existing preference_assets table is reserved for immutable storage and
-- worker artifacts with generation/etag/checksum lineage.
create table public.preference_evidence_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  storage_object_record_id text,
  media_asset_id text,
  record_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (id, study_session_id, edit_reference_id, workspace_id),
  check ((storage_object_record_id is null) = (media_asset_id is null)),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict
);

alter table public.edit_reference_domain_states enable row level security;
alter table public.edit_reference_domain_states force row level security;
alter table public.edit_reference_domain_audit_events enable row level security;
alter table public.edit_reference_domain_audit_events force row level security;
alter table public.edit_reference_domain_idempotency_receipts enable row level security;
alter table public.edit_reference_domain_idempotency_receipts force row level security;
alter table public.preference_evidence_assets enable row level security;
alter table public.preference_evidence_assets force row level security;

revoke all on public.edit_reference_domain_states,
  public.edit_reference_domain_audit_events,
  public.edit_reference_domain_idempotency_receipts,
  public.preference_evidence_assets from public, anon, authenticated, service_role;

create trigger edit_reference_domain_audit_events_immutable
  before update or delete on public.edit_reference_domain_audit_events
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger edit_reference_domain_idempotency_receipts_immutable
  before update or delete on public.edit_reference_domain_idempotency_receipts
  for each row execute function public.reeditpro_reject_row_mutation();
create trigger preference_evidence_assets_immutable
  before update or delete on public.preference_evidence_assets
  for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_edit_reference_domain_scope_hash(
  p_actor_user_id uuid,
  p_workspace_id uuid
)
returns text
language sql
immutable
strict
set search_path = pg_catalog, extensions
as $$
  select encode(
    extensions.digest(
      convert_to(p_actor_user_id::text, 'UTF8')
        || decode('00', 'hex')
        || convert_to(p_workspace_id::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.reeditpro_edit_reference_domain_message_json(
  p_id uuid,
  p_workspace_id uuid,
  p_edit_reference_id uuid,
  p_study_session_id uuid,
  p_role text,
  p_content text,
  p_sequence bigint,
  p_client_message_id text,
  p_runtime_source text,
  p_created_at timestamptz
)
returns jsonb
language sql
immutable
set search_path = pg_catalog, public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p_id::text,
    'workspaceId', p_workspace_id::text,
    'editReferenceId', p_edit_reference_id::text,
    'studySessionId', p_study_session_id::text,
    'role', p_role,
    'content', p_content,
    'sequence', p_sequence,
    'clientMessageId', p_client_message_id,
    'runtimeSource', p_runtime_source,
    'createdAt', public.reeditpro_iso_timestamp(p_created_at)
  ));
$$;

create or replace function public.reeditpro_build_edit_reference_domain_aggregate(
  p_actor_user_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  domain_state public.edit_reference_domain_states%rowtype;
begin
  select * into domain_state
  from public.edit_reference_domain_states state
  where state.workspace_id = p_workspace_id
    and state.owner_user_id = p_actor_user_id;
  if not found then return null; end if;

  return jsonb_build_object(
    'schemaVersion', 'edit-reference-private-v2',
    'ownerUserId', p_actor_user_id::text,
    'workspaceId', p_workspace_id::text,
    'scopeHash', public.reeditpro_edit_reference_domain_scope_hash(p_actor_user_id, p_workspace_id),
    'revision', domain_state.revision,
    'references', coalesce((
      select jsonb_agg(reference.record_json order by reference.created_at, reference.id)
      from public.edit_references reference
      where reference.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and reference.record_json ? 'currentStudyId'
    ), '[]'::jsonb),
    'studies', coalesce((
      select jsonb_agg(study.record_json order by study.created_at, study.id)
      from public.preference_study_sessions study
      join public.edit_references reference
        on reference.id = study.edit_reference_id
       and reference.workspace_id = study.workspace_id
      where study.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and study.record_json ? 'initialGoals'
    ), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(
        public.reeditpro_edit_reference_domain_message_json(
          message.id, message.workspace_id, message.edit_reference_id,
          message.study_session_id, message.role, message.content,
          message.sequence, message.client_message_id, message.runtime_source,
          message.created_at
        ) order by message.study_session_id, message.sequence
      )
      from public.preference_study_messages message
      join public.edit_references reference
        on reference.id = message.edit_reference_id
       and reference.workspace_id = message.workspace_id
      where message.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
    ), '[]'::jsonb),
    'reasoningAttempts', '[]'::jsonb,
    'reasoningProviderRequests', '[]'::jsonb,
    'reasoningProviderCheckbacks', '[]'::jsonb,
    'reasoningProviderWorkflows', '[]'::jsonb,
    'reasoningInternalCostAuthorities', '[]'::jsonb,
    'preferenceDnaReasoningAttempts', '[]'::jsonb,
    'evidence', coalesce((
      select jsonb_agg(evidence.evidence_json order by evidence.created_at, evidence.id)
      from public.preference_evidence evidence
      join public.edit_references reference
        on reference.id = evidence.edit_reference_id
       and reference.workspace_id = evidence.workspace_id
      where evidence.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and evidence.evidence_json ? 'provenance'
    ), '[]'::jsonb),
    'assets', coalesce((
      select jsonb_agg(asset.record_json order by asset.created_at, asset.id)
      from public.preference_evidence_assets asset
      join public.edit_references reference
        on reference.id = asset.edit_reference_id
       and reference.workspace_id = asset.workspace_id
      where asset.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
    ), '[]'::jsonb),
    'skillRuns', '[]'::jsonb,
    'dnaVersions', coalesce((
      select jsonb_agg(dna.record_json order by dna.created_at, dna.id)
      from public.preference_dna_versions dna
      join public.edit_references reference
        on reference.id = dna.edit_reference_id
       and reference.workspace_id = dna.workspace_id
      where dna.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and dna.record_json ? 'synthesisVersion'
    ), '[]'::jsonb),
    'dnaQaResults', coalesce((
      select jsonb_agg(qa.record_json order by qa.created_at, qa.id)
      from public.preference_dna_qa_results qa
      join public.edit_references reference
        on reference.id = qa.edit_reference_id
       and reference.workspace_id = qa.workspace_id
      where qa.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and qa.record_json ? 'qaVersion'
    ), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(application.record_json order by application.created_at, application.id)
      from public.preference_applications application
      join public.edit_references reference
        on reference.id = application.edit_reference_id
       and reference.workspace_id = application.workspace_id
      where application.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and application.record_json ? 'applicationVersion'
    ), '[]'::jsonb),
    'usageLogs', coalesce((
      select jsonb_agg(usage.event_json order by usage.created_at, usage.id)
      from public.preference_usage_events usage
      join public.edit_references reference
        on reference.id = usage.edit_reference_id
       and reference.workspace_id = usage.workspace_id
      where usage.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and usage.event_json ? 'eventType'
    ), '[]'::jsonb),
    'auditState', jsonb_build_object(
      'eventCount', domain_state.audit_event_count,
      'lastSequence', domain_state.audit_event_count
    ),
    'idempotencyState', jsonb_build_object(
      'receiptCount', domain_state.idempotency_receipt_count,
      'lastSequence', domain_state.idempotency_receipt_count,
      'archivedReceiptCount', domain_state.idempotency_receipt_count,
      'compactionCount', case when domain_state.idempotency_receipt_count > 0 then 1 else 0 end
    ),
    'idempotencyReceipts', '[]'::jsonb,
    'createdAt', public.reeditpro_iso_timestamp(domain_state.created_at),
    'updatedAt', public.reeditpro_iso_timestamp(domain_state.updated_at),
    'privateInternalOnly', true
  );
end;
$$;

create or replace function public.reeditpro_read_edit_reference_domain_audit_events(
  p_actor_user_id uuid,
  p_workspace_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(jsonb_agg(event.event_json order by event.sequence), '[]'::jsonb)
  from public.edit_reference_domain_audit_events event
  where event.workspace_id = p_workspace_id
    and event.actor_user_id = p_actor_user_id;
$$;

create or replace function public.read_edit_reference_domain_aggregate_v1(
  p_read_version text,
  p_scope jsonb
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid;
  workspace_uuid uuid;
  aggregate_json jsonb;
begin
  if p_read_version <> 'edit-reference-domain-aggregate-read-v1'
    or jsonb_typeof(p_scope) <> 'object'
    or p_scope->>'actorUserId' !~ '^[a-f0-9-]{36}$'
    or p_scope->>'workspaceId' !~ '^[a-f0-9-]{36}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_READ_INVALID'; end if;
  actor_id := (p_scope->>'actorUserId')::uuid;
  workspace_uuid := (p_scope->>'workspaceId')::uuid;
  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = workspace_uuid and member.user_id = actor_id
  ) then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_READ_DENIED'; end if;

  aggregate_json := public.reeditpro_build_edit_reference_domain_aggregate(actor_id, workspace_uuid);
  if aggregate_json is null then return; end if;
  return next jsonb_build_object(
    'aggregate', aggregate_json,
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid)
  );
end;
$$;

create or replace function public.mutate_edit_reference_domain_command_v1(
  p_contract_version text,
  p_actor_user_id uuid,
  p_command jsonb,
  p_idempotency_key_hash_sha256 text,
  p_request_hash_sha256 text
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  actor_id uuid := p_actor_user_id;
  workspace_uuid uuid;
  operation_name text;
  request_json jsonb;
  input_json jsonb;
  domain_state public.edit_reference_domain_states%rowtype;
  existing_receipt public.edit_reference_domain_idempotency_receipts%rowtype;
  reference_row public.edit_references%rowtype;
  study_row public.preference_study_sessions%rowtype;
  existing_evidence public.preference_evidence%rowtype;
  committed_at timestamptz := clock_timestamp();
  next_revision bigint;
  next_audit_sequence bigint;
  next_receipt_sequence bigint;
  reference_uuid uuid;
  study_uuid uuid;
  message_one_uuid uuid;
  message_two_uuid uuid;
  evidence_uuid uuid;
  asset_uuid uuid;
  usage_one_uuid uuid;
  usage_two_uuid uuid;
  audit_uuid uuid;
  receipt_uuid uuid;
  name_value text;
  title_value text;
  description_value text;
  status_value text;
  content_value text;
  assistant_content text;
  source_type text;
  category_value text;
  transferability_value text;
  evidence_record jsonb;
  asset_record jsonb;
  reference_record jsonb;
  study_record jsonb;
  result_json jsonb;
  receipt_json jsonb;
  stable_ids jsonb := '[]'::jsonb;
  appended_ids jsonb;
  expected_revision bigint;
  next_message_sequence bigint;
  current_study_uuid uuid;
begin
  if p_contract_version <> 'edit-reference-domain-command-v1'
    or jsonb_typeof(p_command) <> 'object'
    or p_command->>'schemaVersion' <> 'edit-reference-domain-command-v1'
    or p_idempotency_key_hash_sha256 !~ '^[a-f0-9]{64}$'
    or p_request_hash_sha256 !~ '^[a-f0-9]{64}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_COMMAND_INVALID'; end if;

  operation_name := p_command->>'operation';
  request_json := p_command->'request';
  if operation_name not in (
    'edit_reference.create', 'edit_reference.update',
    'preference_study.create', 'preference_study.update',
    'preference_study.message.append', 'preference_study.evidence.add'
  ) or jsonb_typeof(request_json) <> 'object'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_OPERATION_UNSUPPORTED'; end if;

  input_json := case when operation_name = 'edit_reference.create'
    then request_json else request_json->'input' end;
  if jsonb_typeof(input_json) <> 'object'
    or input_json->>'workspaceId' !~ '^[a-f0-9-]{36}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_WORKSPACE_INVALID'; end if;
  workspace_uuid := (input_json->>'workspaceId')::uuid;

  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = workspace_uuid
      and member.user_id = actor_id
      and member.role in ('owner', 'admin', 'editor')
  ) then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;

  if operation_name = 'edit_reference.create' then
    insert into public.edit_reference_domain_states (workspace_id, owner_user_id)
    values (workspace_uuid, actor_id)
    on conflict (workspace_id, owner_user_id) do nothing;
  end if;
  select * into domain_state
  from public.edit_reference_domain_states state
  where state.workspace_id = workspace_uuid and state.owner_user_id = actor_id
  for update;
  if not found then raise exception using errcode = '55000', message = 'REEDITPRO_DOMAIN_STATE_MISSING'; end if;

  select * into existing_receipt
  from public.edit_reference_domain_idempotency_receipts receipt
  where receipt.workspace_id = workspace_uuid
    and receipt.actor_user_id = actor_id
    and receipt.idempotency_key_hash_sha256 = p_idempotency_key_hash_sha256;
  if found then
    if existing_receipt.operation <> operation_name
      or existing_receipt.request_hash_sha256 <> p_request_hash_sha256
    then raise exception using errcode = '23505', message = 'REEDITPRO_IDEMPOTENCY_CONFLICT'; end if;
    return next jsonb_build_object(
      'aggregate', public.reeditpro_build_edit_reference_domain_aggregate(actor_id, workspace_uuid),
      'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid),
      'receipt', existing_receipt.receipt_json,
      'replayed', true
    );
    return;
  end if;

  next_revision := domain_state.revision + 1;
  next_audit_sequence := domain_state.audit_event_count + 1;
  next_receipt_sequence := domain_state.idempotency_receipt_count + 1;

  if operation_name = 'edit_reference.create' then
    name_value := btrim(input_json->>'name');
    description_value := nullif(btrim(coalesce(input_json->>'description', '')), '');
    if length(name_value) not between 1 and 120
      or (description_value is not null and length(description_value) > 2000)
      or jsonb_typeof(input_json->'initialGoals') <> 'array'
      or jsonb_array_length(input_json->'initialGoals') not between 1 and 7
      or exists (
        select 1 from jsonb_array_elements_text(input_json->'initialGoals') goal
        where goal not in ('visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics')
      )
      or (select count(*) from jsonb_array_elements_text(input_json->'initialGoals'))
        <> (select count(distinct goal) from jsonb_array_elements_text(input_json->'initialGoals') goal)
    then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_CREATE_INVALID'; end if;

    reference_uuid := extensions.gen_random_uuid();
    study_uuid := extensions.gen_random_uuid();
    message_one_uuid := extensions.gen_random_uuid();
    message_two_uuid := extensions.gen_random_uuid();
    usage_one_uuid := extensions.gen_random_uuid();
    usage_two_uuid := extensions.gen_random_uuid();
    title_value := case when lower(name_value) ~ 'study$' then name_value else name_value || ' study' end;
    reference_record := jsonb_strip_nulls(jsonb_build_object(
      'id', reference_uuid::text, 'workspaceId', workspace_uuid::text,
      'name', name_value, 'description', description_value, 'status', 'active',
      'initialGoals', input_json->'initialGoals', 'currentStudyId', study_uuid::text,
      'revision', 1, 'createdAt', public.reeditpro_iso_timestamp(committed_at),
      'updatedAt', public.reeditpro_iso_timestamp(committed_at),
      'runtimeSource', 'canonical_supabase_transactional',
      'evidenceStatus', 'not_complete', 'dnaStatus', 'not_generated', 'qaStatus', 'not_run'
    ));
    study_record := jsonb_build_object(
      'id', study_uuid::text, 'workspaceId', workspace_uuid::text,
      'editReferenceId', reference_uuid::text, 'title', title_value,
      'status', 'collecting_evidence', 'initialGoals', input_json->'initialGoals',
      'revision', 1, 'createdAt', public.reeditpro_iso_timestamp(committed_at),
      'updatedAt', public.reeditpro_iso_timestamp(committed_at),
      'runtimeSource', 'canonical_supabase_transactional',
      'evidenceStatus', 'not_complete', 'dnaStatus', 'not_generated', 'qaStatus', 'not_run'
    );
    insert into public.edit_references (
      id, workspace_id, owner_user_id, revision, status, name, description, record_json, created_at, updated_at
    ) values (
      reference_uuid, workspace_uuid, actor_id, 1, 'active', name_value, description_value,
      reference_record, committed_at, committed_at
    );
    insert into public.preference_study_sessions (
      id, workspace_id, edit_reference_id, revision, status, title, record_json, created_at, updated_at
    ) values (
      study_uuid, workspace_uuid, reference_uuid, 1, 'collecting_evidence', title_value,
      study_record, committed_at, committed_at
    );
    content_value := 'This study uses only evidence you deliberately add. Saving video details does not mean the video itself has been studied.';
    insert into public.preference_study_messages (
      id, workspace_id, edit_reference_id, study_session_id, sequence, role, content,
      content_digest, runtime_source, created_at
    ) values (
      message_one_uuid, workspace_uuid, reference_uuid, study_uuid, 1, 'system', content_value,
      encode(extensions.digest(convert_to(content_value, 'UTF8'), 'sha256'), 'hex'),
      'deterministic_setup', committed_at
    );
    content_value := format(
      'Let’s build “%s.” Tell me how you want ReEditPro to edit, upload a reference video you like, or use one of your approved edits. I’ll study the editing choices deeply and show you what I learned before anything can be used.',
      name_value
    );
    insert into public.preference_study_messages (
      id, workspace_id, edit_reference_id, study_session_id, sequence, role, content,
      content_digest, runtime_source, created_at
    ) values (
      message_two_uuid, workspace_uuid, reference_uuid, study_uuid, 2, 'assistant', content_value,
      encode(extensions.digest(convert_to(content_value, 'UTF8'), 'sha256'), 'hex'),
      'deterministic_setup', committed_at
    );
    insert into public.preference_usage_events (id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at)
    values
      (usage_one_uuid, workspace_uuid, reference_uuid, 'created',
        public.reeditpro_sha256_json(jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text, 'eventType', 'created', 'createdAt', public.reeditpro_iso_timestamp(committed_at))),
        jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text, 'eventType', 'created', 'createdAt', public.reeditpro_iso_timestamp(committed_at)), committed_at),
      (usage_two_uuid, workspace_uuid, reference_uuid, 'study_created',
        public.reeditpro_sha256_json(jsonb_build_object('id', usage_two_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text, 'eventType', 'study_created', 'createdAt', public.reeditpro_iso_timestamp(committed_at))),
        jsonb_build_object('id', usage_two_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text, 'eventType', 'study_created', 'createdAt', public.reeditpro_iso_timestamp(committed_at)), committed_at);
    stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text, message_one_uuid::text, message_two_uuid::text, usage_one_uuid::text, usage_two_uuid::text);

  elsif operation_name = 'edit_reference.update' then
    if request_json->>'referenceId' !~ '^[a-f0-9-]{36}$'
      or (input_json->>'expectedReferenceRevision') !~ '^[0-9]+$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_UPDATE_INVALID'; end if;
    reference_uuid := (request_json->>'referenceId')::uuid;
    expected_revision := (input_json->>'expectedReferenceRevision')::bigint;
    select * into reference_row from public.edit_references reference
    where reference.id = reference_uuid and reference.workspace_id = workspace_uuid
      and reference.owner_user_id = actor_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'REEDITPRO_REFERENCE_NOT_FOUND'; end if;
    if reference_row.revision <> expected_revision then raise exception using errcode = '40001', message = 'REEDITPRO_REFERENCE_REVISION_CONFLICT'; end if;
    reference_record := reference_row.record_json;
    if input_json ? 'name' then
      name_value := btrim(input_json->>'name');
      if length(name_value) not between 1 and 120 then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_NAME_INVALID'; end if;
      reference_record := jsonb_set(reference_record, '{name}', to_jsonb(name_value));
    else name_value := reference_row.name; end if;
    if input_json ? 'description' then
      description_value := nullif(btrim(input_json->>'description'), '');
      if description_value is not null and length(description_value) > 2000 then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_DESCRIPTION_INVALID'; end if;
      reference_record := case when description_value is null then reference_record - 'description'
        else jsonb_set(reference_record, '{description}', to_jsonb(description_value)) end;
    else description_value := reference_row.description; end if;
    status_value := coalesce(input_json->>'status', reference_row.status);
    if status_value not in ('active', 'archived') then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_STATUS_INVALID'; end if;
    reference_record := jsonb_set(jsonb_set(jsonb_set(
      reference_record, '{status}', to_jsonb(status_value)),
      '{revision}', to_jsonb(reference_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    if status_value = 'archived' and reference_row.status <> 'archived' then
      current_study_uuid := (reference_record->>'currentStudyId')::uuid;
      select * into study_row from public.preference_study_sessions study
      where study.id = current_study_uuid and study.edit_reference_id = reference_uuid
        and study.workspace_id = workspace_uuid for update;
      if not found then raise exception using errcode = '55000', message = 'REEDITPRO_CURRENT_STUDY_MISSING'; end if;
      study_record := jsonb_set(jsonb_set(jsonb_set(
        study_row.record_json, '{status}', '"archived"'::jsonb),
        '{revision}', to_jsonb(study_row.revision + 1)),
        '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
      update public.preference_study_sessions set status = 'archived', revision = revision + 1,
        record_json = study_record, updated_at = committed_at where id = study_row.id;
    else current_study_uuid := (reference_record->>'currentStudyId')::uuid; end if;
    study_uuid := current_study_uuid;
    update public.edit_references set name = name_value, description = description_value,
      status = status_value, revision = revision + 1, record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    usage_one_uuid := extensions.gen_random_uuid();
    insert into public.preference_usage_events (id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at)
    values (usage_one_uuid, workspace_uuid, reference_uuid,
      case when status_value = 'archived' then 'archived' else 'updated' end,
      public.reeditpro_sha256_json(jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
        'eventType', case when status_value = 'archived' then 'archived' else 'updated' end,
        'createdAt', public.reeditpro_iso_timestamp(committed_at))),
      jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
        'eventType', case when status_value = 'archived' then 'archived' else 'updated' end,
        'createdAt', public.reeditpro_iso_timestamp(committed_at)), committed_at);
    stable_ids := jsonb_build_array(reference_uuid::text, current_study_uuid::text, usage_one_uuid::text);

  elsif operation_name = 'preference_study.create' then
    if request_json->>'referenceId' !~ '^[a-f0-9-]{36}$'
      or (input_json->>'expectedReferenceRevision') !~ '^[0-9]+$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_CREATE_INVALID'; end if;
    reference_uuid := (request_json->>'referenceId')::uuid;
    expected_revision := (input_json->>'expectedReferenceRevision')::bigint;
    title_value := btrim(input_json->>'title');
    if length(title_value) not between 1 and 160 then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_TITLE_INVALID'; end if;
    select * into reference_row from public.edit_references reference
    where reference.id = reference_uuid and reference.workspace_id = workspace_uuid
      and reference.owner_user_id = actor_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'REEDITPRO_REFERENCE_NOT_FOUND'; end if;
    if reference_row.status = 'archived' then raise exception using errcode = '55000', message = 'REEDITPRO_REFERENCE_ARCHIVED'; end if;
    if reference_row.revision <> expected_revision then raise exception using errcode = '40001', message = 'REEDITPRO_REFERENCE_REVISION_CONFLICT'; end if;
    study_uuid := extensions.gen_random_uuid();
    message_one_uuid := extensions.gen_random_uuid();
    message_two_uuid := extensions.gen_random_uuid();
    usage_one_uuid := extensions.gen_random_uuid();
    study_record := jsonb_build_object(
      'id', study_uuid::text, 'workspaceId', workspace_uuid::text,
      'editReferenceId', reference_uuid::text, 'title', title_value,
      'status', 'collecting_evidence', 'initialGoals', reference_row.record_json->'initialGoals',
      'revision', 1, 'createdAt', public.reeditpro_iso_timestamp(committed_at),
      'updatedAt', public.reeditpro_iso_timestamp(committed_at),
      'runtimeSource', 'canonical_supabase_transactional',
      'evidenceStatus', 'not_complete', 'dnaStatus', 'not_generated', 'qaStatus', 'not_run'
    );
    insert into public.preference_study_sessions (
      id, workspace_id, edit_reference_id, revision, status, title, record_json, created_at, updated_at
    ) values (study_uuid, workspace_uuid, reference_uuid, 1, 'collecting_evidence', title_value, study_record, committed_at, committed_at);
    content_value := 'This study uses only evidence you deliberately add. Saving video details does not mean the video itself has been studied.';
    insert into public.preference_study_messages (id, workspace_id, edit_reference_id, study_session_id, sequence, role, content, content_digest, runtime_source, created_at)
    values (message_one_uuid, workspace_uuid, reference_uuid, study_uuid, 1, 'system', content_value,
      encode(extensions.digest(convert_to(content_value, 'UTF8'), 'sha256'), 'hex'), 'deterministic_setup', committed_at);
    content_value := format('Let’s build “%s.” Tell me how you want ReEditPro to edit, upload a reference video you like, or use one of your approved edits. I’ll study the editing choices deeply and show you what I learned before anything can be used.', reference_row.name);
    insert into public.preference_study_messages (id, workspace_id, edit_reference_id, study_session_id, sequence, role, content, content_digest, runtime_source, created_at)
    values (message_two_uuid, workspace_uuid, reference_uuid, study_uuid, 2, 'assistant', content_value,
      encode(extensions.digest(convert_to(content_value, 'UTF8'), 'sha256'), 'hex'), 'deterministic_setup', committed_at);
    reference_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      reference_row.record_json, '{currentStudyId}', to_jsonb(study_uuid::text)),
      '{evidenceStatus}', '"not_complete"'::jsonb), '{dnaStatus}', '"not_generated"'::jsonb),
      '{qaStatus}', '"not_run"'::jsonb), '{revision}', to_jsonb(reference_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set revision = revision + 1, record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    insert into public.preference_usage_events (id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at)
    values (usage_one_uuid, workspace_uuid, reference_uuid, 'study_created',
      public.reeditpro_sha256_json(jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
        'eventType', 'study_created', 'createdAt', public.reeditpro_iso_timestamp(committed_at))),
      jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
        'eventType', 'study_created', 'createdAt', public.reeditpro_iso_timestamp(committed_at)), committed_at);
    stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text, message_one_uuid::text, message_two_uuid::text, usage_one_uuid::text);

  elsif operation_name = 'preference_study.update' then
    if request_json->>'studyId' !~ '^[a-f0-9-]{36}$'
      or (input_json->>'expectedStudyRevision') !~ '^[0-9]+$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_UPDATE_INVALID'; end if;
    study_uuid := (request_json->>'studyId')::uuid;
    expected_revision := (input_json->>'expectedStudyRevision')::bigint;
    select study.* into study_row from public.preference_study_sessions study
    join public.edit_references reference on reference.id = study.edit_reference_id and reference.workspace_id = study.workspace_id
    where study.id = study_uuid and study.workspace_id = workspace_uuid and reference.owner_user_id = actor_id for update of study;
    if not found then raise exception using errcode = 'P0002', message = 'REEDITPRO_STUDY_NOT_FOUND'; end if;
    if study_row.revision <> expected_revision then raise exception using errcode = '40001', message = 'REEDITPRO_STUDY_REVISION_CONFLICT'; end if;
    title_value := coalesce(nullif(btrim(input_json->>'title'), ''), study_row.title);
    status_value := coalesce(input_json->>'status', study_row.status);
    if length(title_value) not between 1 and 160
      or status_value not in ('draft', 'collecting_evidence', 'ready_to_study', 'needs_clarification', 'archived')
      or (status_value <> study_row.status and not (
        (study_row.status = 'draft' and status_value in ('collecting_evidence', 'archived'))
        or (study_row.status = 'collecting_evidence' and status_value in ('ready_to_study', 'needs_clarification', 'archived'))
        or (study_row.status = 'ready_to_study' and status_value in ('collecting_evidence', 'needs_clarification', 'archived'))
        or (study_row.status = 'needs_clarification' and status_value in ('collecting_evidence', 'ready_to_study', 'archived'))
      ))
    then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_TRANSITION_INVALID'; end if;
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{title}', to_jsonb(title_value)), '{status}', to_jsonb(status_value)),
      '{revision}', to_jsonb(study_row.revision + 1)), '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set title = title_value, status = status_value,
      revision = revision + 1, record_json = study_record, updated_at = committed_at where id = study_uuid;
    reference_uuid := study_row.edit_reference_id;
    select * into reference_row from public.edit_references where id = reference_uuid for update;
    reference_record := jsonb_set(reference_row.record_json, '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record, updated_at = committed_at where id = reference_uuid;
    stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text);

  elsif operation_name in ('preference_study.message.append', 'preference_study.evidence.add') then
    if request_json->>'studyId' !~ '^[a-f0-9-]{36}$'
      or (input_json->>'expectedStudyRevision') !~ '^[0-9]+$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_EVIDENCE_COMMAND_INVALID'; end if;
    study_uuid := (request_json->>'studyId')::uuid;
    expected_revision := (input_json->>'expectedStudyRevision')::bigint;
    select study.* into study_row from public.preference_study_sessions study
    join public.edit_references reference on reference.id = study.edit_reference_id and reference.workspace_id = study.workspace_id
    where study.id = study_uuid and study.workspace_id = workspace_uuid and reference.owner_user_id = actor_id for update of study;
    if not found then raise exception using errcode = 'P0002', message = 'REEDITPRO_STUDY_NOT_FOUND'; end if;
    if study_row.revision <> expected_revision then raise exception using errcode = '40001', message = 'REEDITPRO_STUDY_REVISION_CONFLICT'; end if;
    reference_uuid := study_row.edit_reference_id;
    select * into reference_row from public.edit_references where id = reference_uuid for update;
    if reference_row.status = 'archived' or study_row.status = 'archived'
    then raise exception using errcode = '55000', message = 'REEDITPRO_STUDY_ARCHIVED'; end if;
    if (reference_row.record_json->>'currentStudyId')::uuid <> study_uuid
    then raise exception using errcode = '55000', message = 'REEDITPRO_STUDY_NOT_CURRENT'; end if;
    if exists (
      select 1 from public.preference_dna_versions dna
      where dna.workspace_id = workspace_uuid and dna.study_session_id = study_uuid
        and dna.status not in ('superseded')
    ) then raise exception using errcode = '55000', message = 'REEDITPRO_DOMAIN_DNA_REQUIRES_DEDICATED_COMMAND'; end if;

    evidence_uuid := extensions.gen_random_uuid();
    message_one_uuid := extensions.gen_random_uuid();
    usage_one_uuid := extensions.gen_random_uuid();
    select coalesce(max(message.sequence), 0) + 1 into next_message_sequence
    from public.preference_study_messages message where message.study_session_id = study_uuid;

    if operation_name = 'preference_study.message.append' then
      content_value := btrim(input_json->>'content');
      if length(content_value) not between 1 and 8000
        or length(btrim(input_json->>'clientMessageId')) not between 1 and 160
        or exists (
          select 1 from public.preference_study_messages message
          where message.workspace_id = workspace_uuid and message.client_message_id = btrim(input_json->>'clientMessageId')
        )
      then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_MESSAGE_INVALID'; end if;
      if input_json ? 'findingCorrectionEvidenceId' then
        if input_json->>'findingCorrectionEvidenceId' !~ '^[a-f0-9-]{36}$'
        then raise exception using errcode = '22023', message = 'REEDITPRO_CORRECTION_EVIDENCE_INVALID'; end if;
        select * into existing_evidence from public.preference_evidence evidence
        where evidence.id = (input_json->>'findingCorrectionEvidenceId')::uuid
          and evidence.study_session_id = study_uuid and evidence.workspace_id = workspace_uuid;
        if not found or existing_evidence.evidence_type <> 'manual_user_evidence'
          or exists (
            select 1 from public.preference_evidence correction
            where correction.evidence_json->>'supersedesEvidenceId' = existing_evidence.id::text
          )
        then raise exception using errcode = '40001', message = 'REEDITPRO_CORRECTION_EVIDENCE_CONFLICT'; end if;
        title_value := left(existing_evidence.evidence_json->>'title' || ' — Study Chat correction', 160);
        category_value := existing_evidence.evidence_json->>'category';
        transferability_value := case when existing_evidence.evidence_json->>'transferability' = 'unknown'
          then 'requires_user_review' else existing_evidence.evidence_json->>'transferability' end;
        evidence_record := jsonb_build_object(
          'id', evidence_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'supersedesEvidenceId', existing_evidence.id::text,
          'sourceType', 'manual_user_evidence', 'category', category_value, 'title', title_value,
          'summary', content_value, 'revision', 1, 'confidence', 0.65,
          'confidenceBasis', 'user_asserted', 'transferability', transferability_value,
          'provenance', jsonb_build_object('runtimeSource', 'user_input', 'sourceEvidenceIds', jsonb_build_array(existing_evidence.id::text),
            'mediaStudyStatus', 'not_applicable', 'toolIds', '[]'::jsonb, 'skillIds', '[]'::jsonb,
            'fallbackUsed', false, 'notes', jsonb_build_array('Saved as user-described evidence. No media or model analysis is implied.')),
          'createdAt', public.reeditpro_iso_timestamp(committed_at), 'updatedAt', public.reeditpro_iso_timestamp(committed_at)
        );
        assistant_content := format('Your Study Chat correction replaced “%s” as a new evidence version. Run the evidence study again before generating or using Preference DNA.', existing_evidence.evidence_json->>'title');
      else
        select 'Study Chat direction ' || (count(*) + 1)::text into title_value
        from public.preference_evidence evidence where evidence.study_session_id = study_uuid
          and evidence.evidence_type = 'manual_user_evidence';
        evidence_record := jsonb_build_object(
          'id', evidence_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'sourceType', 'manual_user_evidence', 'category', 'all_goals',
          'title', title_value, 'summary', content_value, 'revision', 1, 'confidence', 0.65,
          'confidenceBasis', 'user_asserted', 'transferability', 'transferable',
          'provenance', jsonb_build_object('runtimeSource', 'user_input', 'sourceEvidenceIds', '[]'::jsonb,
            'mediaStudyStatus', 'not_applicable', 'toolIds', '[]'::jsonb, 'skillIds', '[]'::jsonb,
            'fallbackUsed', false, 'notes', jsonb_build_array('Saved as user-described evidence. No media or model analysis is implied.')),
          'createdAt', public.reeditpro_iso_timestamp(committed_at), 'updatedAt', public.reeditpro_iso_timestamp(committed_at)
        );
        assistant_content := format('Got it — I saved that direction for “%s.” Keep describing the style, or add a reference video when an example would help. Nothing will be applied until you review and approve the finished preference.', reference_row.name);
      end if;
      insert into public.preference_study_messages (id, workspace_id, edit_reference_id, study_session_id, sequence, role, content, content_digest, client_message_id, runtime_source, created_at)
      values (message_one_uuid, workspace_uuid, reference_uuid, study_uuid, next_message_sequence, 'user', content_value,
        encode(extensions.digest(convert_to(content_value, 'UTF8'), 'sha256'), 'hex'), btrim(input_json->>'clientMessageId'), 'user_input', committed_at);
      message_two_uuid := extensions.gen_random_uuid();
      insert into public.preference_study_messages (id, workspace_id, edit_reference_id, study_session_id, sequence, role, content, content_digest, runtime_source, created_at)
      values (message_two_uuid, workspace_uuid, reference_uuid, study_uuid, next_message_sequence + 1, 'assistant', assistant_content,
        encode(extensions.digest(convert_to(assistant_content, 'UTF8'), 'sha256'), 'hex'), 'deterministic_evidence', committed_at);
      appended_ids := jsonb_build_array(message_one_uuid::text, message_two_uuid::text);
      stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text, message_one_uuid::text, message_two_uuid::text, evidence_uuid::text, usage_one_uuid::text);
    else
      source_type := input_json->>'sourceType';
      title_value := btrim(input_json->>'title');
      if source_type not in ('manual_user_evidence', 'reference_video_metadata', 'previous_approved_edit_snapshot')
        or length(title_value) not between 1 and 160
      then raise exception using errcode = '22023', message = 'REEDITPRO_EVIDENCE_INPUT_INVALID'; end if;
      if source_type = 'manual_user_evidence' then
        content_value := btrim(input_json->>'summary');
        category_value := input_json->>'category';
        transferability_value := input_json->>'intendedUse';
        if length(content_value) not between 1 and 4000
          or category_value not in ('all_goals', 'visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics')
          or transferability_value not in ('transferable', 'non_transferable', 'do_not_copy', 'requires_user_review')
        then raise exception using errcode = '22023', message = 'REEDITPRO_MANUAL_EVIDENCE_INVALID'; end if;
        if input_json ? 'supersedesEvidenceId' then
          if input_json->>'supersedesEvidenceId' !~ '^[a-f0-9-]{36}$'
          then raise exception using errcode = '22023', message = 'REEDITPRO_SUPERSEDED_EVIDENCE_INVALID'; end if;
          select * into existing_evidence from public.preference_evidence evidence
          where evidence.id = (input_json->>'supersedesEvidenceId')::uuid
            and evidence.study_session_id = study_uuid and evidence.evidence_type = 'manual_user_evidence';
          if not found or exists (
            select 1 from public.preference_evidence correction
            where correction.evidence_json->>'supersedesEvidenceId' = existing_evidence.id::text
          ) then raise exception using errcode = '40001', message = 'REEDITPRO_SUPERSEDED_EVIDENCE_CONFLICT'; end if;
        end if;
        evidence_record := jsonb_strip_nulls(jsonb_build_object(
          'id', evidence_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'supersedesEvidenceId', input_json->>'supersedesEvidenceId',
          'sourceType', source_type, 'category', category_value, 'title', title_value, 'summary', content_value,
          'revision', 1, 'confidence', 0.65, 'confidenceBasis', 'user_asserted',
          'transferability', transferability_value,
          'provenance', jsonb_build_object('runtimeSource', 'user_input',
            'sourceEvidenceIds', case when input_json ? 'supersedesEvidenceId' then jsonb_build_array(input_json->>'supersedesEvidenceId') else '[]'::jsonb end,
            'mediaStudyStatus', 'not_applicable', 'toolIds', '[]'::jsonb, 'skillIds', '[]'::jsonb,
            'fallbackUsed', false, 'notes', jsonb_build_array('Saved as user-described evidence. No media or model analysis is implied.')),
          'createdAt', public.reeditpro_iso_timestamp(committed_at), 'updatedAt', public.reeditpro_iso_timestamp(committed_at)
        ));
      elsif source_type = 'reference_video_metadata' then
        if length(btrim(input_json->>'sourceLabel')) not between 1 and 240
          or input_json->>'rightsBasis' not in ('user_owned', 'licensed_or_authorized', 'reference_only')
          or ((input_json ? 'storageObjectRecordId') <> (input_json ? 'mediaAssetId'))
          or ((input_json ? 'storageObjectRecordId') and coalesce((request_json->>'privateMediaAuthorityChecked')::boolean, false) is not true)
        then raise exception using errcode = '22023', message = 'REEDITPRO_REFERENCE_MEDIA_EVIDENCE_INVALID'; end if;
        asset_uuid := extensions.gen_random_uuid();
        asset_record := jsonb_strip_nulls(jsonb_build_object(
          'id', asset_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text,
          'privateAssetId', coalesce(input_json->>'mediaAssetId', extensions.gen_random_uuid()::text),
          'storageObjectRecordId', input_json->>'storageObjectRecordId', 'mediaAssetId', input_json->>'mediaAssetId',
          'assetKind', 'reference_video_metadata', 'label', btrim(input_json->>'sourceLabel'),
          'rightsBasis', input_json->>'rightsBasis', 'mediaStudyStatus', 'media_not_studied',
          'mediaMetadata', jsonb_strip_nulls(jsonb_build_object(
            'durationSeconds', input_json->'durationSeconds', 'width', input_json->'width', 'height', input_json->'height',
            'hasAudio', input_json->'hasAudio', 'orientation', case
              when not (input_json ? 'width') or not (input_json ? 'height') then 'unknown'
              when (input_json->>'width')::bigint = (input_json->>'height')::bigint then 'square'
              when (input_json->>'width')::bigint > (input_json->>'height')::bigint then 'landscape'
              else 'portrait' end
          )),
          'createdAt', public.reeditpro_iso_timestamp(committed_at)
        ));
        content_value := case when input_json ? 'storageObjectRecordId'
          then btrim(input_json->>'sourceLabel') || ' was stored as a private reference asset. Its media has not been studied yet.'
          else btrim(input_json->>'sourceLabel') || ' metadata was supplied for this study. The media itself has not been studied.' end;
        evidence_record := jsonb_build_object(
          'id', evidence_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'sourceType', source_type, 'category', 'media_structure',
          'title', title_value, 'summary', content_value, 'revision', 1, 'confidence', 1,
          'confidenceBasis', 'metadata_verified', 'transferability', 'requires_user_review',
          'mediaMetadata', asset_record->'mediaMetadata',
          'provenance', jsonb_build_object('runtimeSource', 'user_input', 'sourceEvidenceIds', '[]'::jsonb,
            'privateAssetId', asset_record->>'privateAssetId', 'sourceLabel', btrim(input_json->>'sourceLabel'),
            'rightsBasis', input_json->>'rightsBasis', 'mediaStudyStatus', 'media_not_studied',
            'toolIds', '[]'::jsonb, 'skillIds', '[]'::jsonb, 'fallbackUsed', false,
            'notes', jsonb_build_array(case when input_json ? 'storageObjectRecordId'
              then 'Only canonical private asset identities were persisted. No signed URL, filesystem path, raw frame, transcript, or provider payload was stored.'
              else 'No URL, path, media bytes, frames, transcript, audio, or provider payload was accepted or persisted.' end)),
          'createdAt', public.reeditpro_iso_timestamp(committed_at), 'updatedAt', public.reeditpro_iso_timestamp(committed_at)
        );
      else
        if input_json->>'rightsBasis' <> 'workspace_approved_edit'
          or input_json->>'projectId' is null or input_json->>'editSessionId' is null
          or input_json->>'approvedSnapshotId' is null
        then raise exception using errcode = '22023', message = 'REEDITPRO_APPROVED_EDIT_EVIDENCE_INVALID'; end if;
        asset_uuid := extensions.gen_random_uuid();
        asset_record := jsonb_build_object(
          'id', asset_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'privateAssetId', extensions.gen_random_uuid()::text,
          'assetKind', 'previous_approved_edit_snapshot', 'label', title_value,
          'rightsBasis', 'workspace_approved_edit', 'mediaStudyStatus', 'approved_edit_identity_not_verified',
          'projectId', input_json->>'projectId', 'editSessionId', input_json->>'editSessionId',
          'approvedSnapshotId', input_json->>'approvedSnapshotId', 'createdAt', public.reeditpro_iso_timestamp(committed_at)
        );
        content_value := coalesce(nullif(btrim(input_json->>'summary'), ''), 'A previous approved edit identity was supplied for future private study.');
        evidence_record := jsonb_build_object(
          'id', evidence_uuid::text, 'workspaceId', workspace_uuid::text, 'editReferenceId', reference_uuid::text,
          'studySessionId', study_uuid::text, 'sourceType', source_type, 'category', 'media_structure',
          'title', title_value, 'summary', content_value, 'revision', 1, 'confidence', 0.5,
          'confidenceBasis', 'user_asserted', 'transferability', 'requires_user_review',
          'provenance', jsonb_build_object('runtimeSource', 'user_input', 'sourceEvidenceIds', '[]'::jsonb,
            'privateAssetId', asset_record->>'privateAssetId', 'projectId', input_json->>'projectId',
            'editSessionId', input_json->>'editSessionId', 'approvedSnapshotId', input_json->>'approvedSnapshotId',
            'rightsBasis', 'workspace_approved_edit', 'mediaStudyStatus', 'approved_edit_identity_not_verified',
            'toolIds', '[]'::jsonb, 'skillIds', '[]'::jsonb, 'fallbackUsed', false,
            'notes', jsonb_build_array('Exact identity was saved. No project history, approved snapshot content, preview, or media bytes were opened.')),
          'createdAt', public.reeditpro_iso_timestamp(committed_at), 'updatedAt', public.reeditpro_iso_timestamp(committed_at)
        );
      end if;
      assistant_content := format('“%s” was added to this study.%s You can study the saved evidence now or add more context first.',
        title_value, case when source_type = 'reference_video_metadata' then ' Only the details you entered were saved; the video itself was not studied.'
          when source_type = 'previous_approved_edit_snapshot' then ' Its identity was recorded, but no project history, snapshot content, or media was opened.' else '' end);
      insert into public.preference_study_messages (id, workspace_id, edit_reference_id, study_session_id, sequence, role, content, content_digest, runtime_source, created_at)
      values (message_one_uuid, workspace_uuid, reference_uuid, study_uuid, next_message_sequence, 'assistant', assistant_content,
        encode(extensions.digest(convert_to(assistant_content, 'UTF8'), 'sha256'), 'hex'), 'deterministic_evidence', committed_at);
      stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text, message_one_uuid::text, evidence_uuid::text, usage_one_uuid::text);
    end if;

    insert into public.preference_evidence (
      id, workspace_id, edit_reference_id, study_session_id, revision,
      content_digest, evidence_type, evidence_json, created_at
    ) values (
      evidence_uuid, workspace_uuid, reference_uuid, study_uuid, 1,
      public.reeditpro_sha256_json(evidence_record), evidence_record->>'sourceType', evidence_record, committed_at
    );
    if asset_record is not null then
      insert into public.preference_evidence_assets (
        id, workspace_id, edit_reference_id, study_session_id,
        storage_object_record_id, media_asset_id, record_json, created_at
      ) values (
        asset_uuid, workspace_uuid, reference_uuid, study_uuid,
        asset_record->>'storageObjectRecordId', asset_record->>'mediaAssetId', asset_record, committed_at
      );
      stable_ids := stable_ids || jsonb_build_array(asset_uuid::text);
    end if;
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{status}', '"ready_to_study"'::jsonb),
      '{evidenceStatus}', '"ready_to_study"'::jsonb), '{dnaStatus}', '"not_generated"'::jsonb),
      '{qaStatus}', '"not_run"'::jsonb), '{revision}', to_jsonb(study_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set status = 'ready_to_study', revision = revision + 1,
      record_json = study_record, updated_at = committed_at where id = study_uuid;
    reference_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      reference_row.record_json, '{evidenceStatus}', '"ready_to_study"'::jsonb),
      '{dnaStatus}', '"not_generated"'::jsonb), '{qaStatus}', '"not_run"'::jsonb),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record, updated_at = committed_at where id = reference_uuid;
    insert into public.preference_usage_events (id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at)
    values (usage_one_uuid, workspace_uuid, reference_uuid,
      case when operation_name = 'preference_study.message.append' then 'message_appended' else 'evidence_added' end,
      public.reeditpro_sha256_json(jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text,
        'editReferenceId', reference_uuid::text,
        'eventType', case when operation_name = 'preference_study.message.append' then 'message_appended' else 'evidence_added' end,
        'createdAt', public.reeditpro_iso_timestamp(committed_at))),
      jsonb_build_object('id', usage_one_uuid::text, 'workspaceId', workspace_uuid::text,
        'editReferenceId', reference_uuid::text,
        'eventType', case when operation_name = 'preference_study.message.append' then 'message_appended' else 'evidence_added' end,
        'createdAt', public.reeditpro_iso_timestamp(committed_at)), committed_at);
  end if;

  audit_uuid := extensions.gen_random_uuid();
  insert into public.edit_reference_domain_audit_events (
    id, workspace_id, actor_user_id, sequence, aggregate_revision,
    event_type, edit_reference_id, study_session_id, event_json, created_at
  ) values (
    audit_uuid, workspace_uuid, actor_id, next_audit_sequence, next_revision,
    case operation_name
      when 'edit_reference.create' then 'edit_reference_created'
      when 'edit_reference.update' then case when status_value = 'archived' then 'edit_reference_archived' else 'edit_reference_updated' end
      when 'preference_study.create' then 'preference_study_created'
      when 'preference_study.update' then 'preference_study_updated'
      when 'preference_study.message.append' then 'preference_study_message_appended'
      else 'preference_evidence_added' end,
    reference_uuid, study_uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'id', audit_uuid::text, 'sequence', next_audit_sequence,
      'eventType', case operation_name
        when 'edit_reference.create' then 'edit_reference_created'
        when 'edit_reference.update' then case when status_value = 'archived' then 'edit_reference_archived' else 'edit_reference_updated' end
        when 'preference_study.create' then 'preference_study_created'
        when 'preference_study.update' then 'preference_study_updated'
        when 'preference_study.message.append' then 'preference_study_message_appended'
        else 'preference_evidence_added' end,
      'actorUserId', actor_id::text, 'editReferenceId', reference_uuid::text,
      'studySessionId', study_uuid::text, 'aggregateRevision', next_revision,
      'createdAt', public.reeditpro_iso_timestamp(committed_at)
    )), committed_at
  );

  update public.edit_reference_domain_states set
    revision = next_revision,
    audit_event_count = next_audit_sequence,
    idempotency_receipt_count = next_receipt_sequence,
    updated_at = committed_at
  where workspace_id = workspace_uuid and owner_user_id = actor_id;

  result_json := jsonb_strip_nulls(jsonb_build_object(
    'resultKind', 'edit_reference_detail',
    'editReferenceId', reference_uuid::text,
    'studySessionId', study_uuid::text,
    'stableResultIds', stable_ids,
    'appendedMessageIds', appended_ids
  ));
  result_json := result_json || jsonb_build_object('resultDigestSha256', public.reeditpro_sha256_json(result_json));
  receipt_uuid := extensions.gen_random_uuid();
  receipt_json := jsonb_build_object(
    'receiptVersion', 'edit-reference-idempotency-receipt-v2',
    'receiptId', receipt_uuid::text,
    'ledgerSequence', next_receipt_sequence,
    'operation', operation_name,
    'idempotencyKeyHashSha256', p_idempotency_key_hash_sha256,
    'requestHashSha256', p_request_hash_sha256,
    'result', result_json,
    'committedRevision', next_revision,
    'completedAt', public.reeditpro_iso_timestamp(committed_at)
  );
  insert into public.edit_reference_domain_idempotency_receipts (
    id, workspace_id, actor_user_id, ledger_sequence, operation,
    idempotency_key_hash_sha256, request_hash_sha256, committed_revision,
    result_json, receipt_json, receipt_digest_sha256, completed_at
  ) values (
    receipt_uuid, workspace_uuid, actor_id, next_receipt_sequence, operation_name,
    p_idempotency_key_hash_sha256, p_request_hash_sha256, next_revision,
    result_json, receipt_json, public.reeditpro_sha256_json(receipt_json), committed_at
  );

  return next jsonb_build_object(
    'aggregate', public.reeditpro_build_edit_reference_domain_aggregate(actor_id, workspace_uuid),
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid),
    'receipt', receipt_json,
    'replayed', false
  );
end;
$$;

revoke all on function public.reeditpro_edit_reference_domain_scope_hash(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reeditpro_edit_reference_domain_message_json(uuid, uuid, uuid, uuid, text, text, bigint, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.reeditpro_build_edit_reference_domain_aggregate(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reeditpro_read_edit_reference_domain_audit_events(uuid, uuid) from public, anon, authenticated;
revoke all on function public.read_edit_reference_domain_aggregate_v1(text, jsonb) from public, anon, authenticated;
revoke all on function public.mutate_edit_reference_domain_command_v1(text, uuid, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.read_edit_reference_domain_aggregate_v1(text, jsonb) to service_role;
grant execute on function public.mutate_edit_reference_domain_command_v1(text, uuid, jsonb, text, text) to service_role;
