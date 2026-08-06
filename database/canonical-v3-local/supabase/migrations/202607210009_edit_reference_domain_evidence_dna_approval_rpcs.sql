-- Canonical V3 local: bounded evidence-study, Preference DNA, QA, and approval
-- domain commands. The raw historical supabase/migrations chain remains frozen.
-- Prepared server records are accepted only through a service-role RPC, are
-- rebound to the locked tenant/study/revision, and never replace an aggregate.

alter table public.preference_skill_runs
  add column record_json jsonb;

create table public.preference_dna_lifecycle_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  edit_reference_id uuid not null,
  study_session_id uuid not null,
  dna_version_id uuid not null,
  event_type text not null check (event_type in ('approved', 'superseded')),
  qa_result_id uuid,
  event_json jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (dna_version_id, event_type),
  unique (id, dna_version_id, study_session_id, edit_reference_id, workspace_id),
  foreign key (edit_reference_id, workspace_id)
    references public.edit_references(id, workspace_id) on delete restrict,
  foreign key (study_session_id, edit_reference_id, workspace_id)
    references public.preference_study_sessions(id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (dna_version_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_dna_versions(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  foreign key (qa_result_id, study_session_id, edit_reference_id, workspace_id)
    references public.preference_dna_qa_results(id, study_session_id, edit_reference_id, workspace_id) on delete restrict,
  check (
    (event_type = 'approved' and qa_result_id is not null and event_json ? 'approval')
    or (event_type = 'superseded' and qa_result_id is null and event_json ? 'supersededAt')
  )
);

alter table public.preference_dna_lifecycle_events enable row level security;
alter table public.preference_dna_lifecycle_events force row level security;
revoke all on public.preference_dna_lifecycle_events from public, anon, authenticated, service_role;

create trigger preference_dna_lifecycle_events_immutable
  before update or delete on public.preference_dna_lifecycle_events
  for each row execute function public.reeditpro_reject_row_mutation();

-- DNA content remains immutable. Only the lifecycle projection columns may
-- advance through the canonical command transaction so the existing exact-edit
-- application RPCs can re-read approved/superseded authority without trusting
-- record_json or a browser-shaped aggregate.
create or replace function public.reeditpro_guard_preference_dna_lifecycle_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth, extensions
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '55000', message = 'REEDITPRO_IMMUTABLE_ROW';
  end if;
  if row(
      new.id, new.workspace_id, new.edit_reference_id, new.study_session_id,
      new.version, new.content_digest, new.record_json, new.created_at
    ) is distinct from row(
      old.id, old.workspace_id, old.edit_reference_id, old.study_session_id,
      old.version, old.content_digest, old.record_json, old.created_at
    )
    or not (
      (old.status = 'review_required' and new.status = 'approved'
        and old.approval_id is null
        and new.approval_id ~ '^[a-f0-9-]{36}$')
      or (old.status in ('draft', 'review_required') and new.status = 'superseded'
        and new.approval_id is not distinct from old.approval_id)
      or (old.status = 'approved' and new.status = 'superseded'
        and old.approval_id is not null
        and new.approval_id = old.approval_id)
    )
  then
    raise exception using errcode = '55000', message = 'REEDITPRO_IMMUTABLE_DNA_CONTENT';
  end if;
  return new;
end;
$$;

drop trigger preference_dna_versions_immutable on public.preference_dna_versions;
create trigger preference_dna_versions_immutable
  before update or delete on public.preference_dna_versions
  for each row execute function public.reeditpro_guard_preference_dna_lifecycle_update();
revoke all on function public.reeditpro_guard_preference_dna_lifecycle_update()
  from public, anon, authenticated, service_role;

create or replace function public.reeditpro_build_edit_reference_domain_aggregate_v2(
  p_actor_user_id uuid,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  aggregate_json jsonb;
begin
  aggregate_json := public.reeditpro_build_edit_reference_domain_aggregate(
    p_actor_user_id,
    p_workspace_id
  );
  if aggregate_json is null then return null; end if;

  aggregate_json := jsonb_set(
    aggregate_json,
    '{skillRuns}',
    coalesce((
      select jsonb_agg(run.record_json order by run.created_at, run.id)
      from public.preference_skill_runs run
      join public.edit_references reference
        on reference.id = run.edit_reference_id
       and reference.workspace_id = run.workspace_id
      where run.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and run.record_json is not null
        and run.record_json ? 'orchestrationId'
    ), '[]'::jsonb),
    true
  );

  aggregate_json := jsonb_set(
    aggregate_json,
    '{dnaVersions}',
    coalesce((
      select jsonb_agg(
        dna.record_json
        || jsonb_build_object(
          'status', case
            when superseded.id is not null then 'superseded'
            when approved.id is not null then 'approved'
            else dna.record_json->>'status'
          end
        )
        || case when qa.id is null then '{}'::jsonb else jsonb_build_object(
          'qaStatus', qa.status,
          'qaResultId', qa.id::text
        ) end
        || case when approved.id is null then '{}'::jsonb else jsonb_build_object(
          'approval', approved.event_json->'approval'
        ) end
        || case when superseded.id is null then '{}'::jsonb else jsonb_build_object(
          'supersededAt', public.reeditpro_iso_timestamp(superseded.created_at)
        ) end
        order by dna.version, dna.id
      )
      from public.preference_dna_versions dna
      join public.edit_references reference
        on reference.id = dna.edit_reference_id
       and reference.workspace_id = dna.workspace_id
      left join public.preference_dna_qa_results qa
        on qa.dna_version_id = dna.id
       and qa.study_session_id = dna.study_session_id
       and qa.edit_reference_id = dna.edit_reference_id
       and qa.workspace_id = dna.workspace_id
      left join public.preference_dna_lifecycle_events approved
        on approved.dna_version_id = dna.id
       and approved.event_type = 'approved'
      left join public.preference_dna_lifecycle_events superseded
        on superseded.dna_version_id = dna.id
       and superseded.event_type = 'superseded'
      where dna.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and dna.record_json ? 'synthesisVersion'
    ), '[]'::jsonb),
    true
  );

  aggregate_json := jsonb_set(
    aggregate_json,
    '{dnaQaResults}',
    coalesce((
      select jsonb_agg(qa.record_json order by qa.created_at, qa.id)
      from public.preference_dna_qa_results qa
      join public.edit_references reference
        on reference.id = qa.edit_reference_id
       and reference.workspace_id = qa.workspace_id
      where qa.workspace_id = p_workspace_id
        and reference.owner_user_id = p_actor_user_id
        and qa.record_json ? 'qaVersion'
    ), '[]'::jsonb),
    true
  );
  return aggregate_json;
end;
$$;

create or replace function public.read_edit_reference_domain_aggregate_v2(
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
  if p_read_version <> 'edit-reference-domain-aggregate-read-v2'
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

  aggregate_json := public.reeditpro_build_edit_reference_domain_aggregate_v2(actor_id, workspace_uuid);
  if aggregate_json is null then return; end if;
  return next jsonb_build_object(
    'aggregate', aggregate_json,
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid)
  );
end;
$$;

create or replace function public.read_edit_reference_domain_idempotency_v1(
  p_actor_user_id uuid,
  p_workspace_id uuid,
  p_operation text,
  p_idempotency_key_hash_sha256 text,
  p_request_hash_sha256 text
)
returns setof jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  receipt_row public.edit_reference_domain_idempotency_receipts%rowtype;
  aggregate_json jsonb;
begin
  if length(p_operation) not between 1 and 240
    or p_idempotency_key_hash_sha256 !~ '^[a-f0-9]{64}$'
    or p_request_hash_sha256 !~ '^[a-f0-9]{64}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_IDEMPOTENCY_LOOKUP_INVALID'; end if;
  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = p_actor_user_id
      and member.role in ('owner', 'admin', 'editor')
  ) then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;

  select * into receipt_row
  from public.edit_reference_domain_idempotency_receipts receipt
  where receipt.workspace_id = p_workspace_id
    and receipt.actor_user_id = p_actor_user_id
    and receipt.idempotency_key_hash_sha256 = p_idempotency_key_hash_sha256;
  if not found then return; end if;
  if receipt_row.operation <> p_operation
    or receipt_row.request_hash_sha256 <> p_request_hash_sha256
  then raise exception using errcode = '23505', message = 'REEDITPRO_IDEMPOTENCY_CONFLICT'; end if;
  aggregate_json := public.reeditpro_build_edit_reference_domain_aggregate_v2(
    p_actor_user_id,
    p_workspace_id
  );
  if aggregate_json is null
  then raise exception using errcode = '55000', message = 'REEDITPRO_DOMAIN_STATE_MISSING'; end if;
  return next jsonb_build_object(
    'aggregate', aggregate_json,
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(p_actor_user_id, p_workspace_id),
    'receipt', receipt_row.receipt_json,
    'replayed', true
  );
end;
$$;

create or replace function public.mutate_edit_reference_domain_command_v2(
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
  operation_name text;
  request_json jsonb;
  input_json jsonb;
  prepared_json jsonb;
  workspace_uuid uuid;
  study_uuid uuid;
  reference_uuid uuid;
  dna_uuid uuid;
  qa_uuid uuid;
  message_uuid uuid;
  usage_uuid uuid;
  audit_uuid uuid;
  receipt_uuid uuid;
  lifecycle_uuid uuid;
  domain_state public.edit_reference_domain_states%rowtype;
  existing_receipt public.edit_reference_domain_idempotency_receipts%rowtype;
  study_row public.preference_study_sessions%rowtype;
  reference_row public.edit_references%rowtype;
  dna_row public.preference_dna_versions%rowtype;
  qa_row public.preference_dna_qa_results%rowtype;
  legacy_result jsonb;
  record_value jsonb;
  message_json jsonb;
  usage_json jsonb;
  dna_json jsonb;
  qa_json jsonb;
  approval_json jsonb;
  study_record jsonb;
  reference_record jsonb;
  result_json jsonb;
  receipt_json jsonb;
  stable_ids jsonb := '[]'::jsonb;
  committed_at timestamptz := clock_timestamp();
  next_revision bigint;
  next_audit_sequence bigint;
  next_receipt_sequence bigint;
  next_message_sequence bigint;
  expected_study_revision bigint;
  skill_attempt integer;
  audit_event_type text;
  study_status text;
  evidence_status text;
begin
  if p_contract_version <> 'edit-reference-domain-command-v2'
    or jsonb_typeof(p_command) <> 'object'
    or p_command->>'schemaVersion' <> 'edit-reference-domain-command-v2'
    or p_idempotency_key_hash_sha256 !~ '^[a-f0-9]{64}$'
    or p_request_hash_sha256 !~ '^[a-f0-9]{64}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_COMMAND_INVALID'; end if;

  operation_name := p_command->>'operation';
  request_json := p_command->'request';
  if jsonb_typeof(request_json) <> 'object'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_COMMAND_INVALID'; end if;

  if operation_name in (
    'edit_reference.create', 'edit_reference.update',
    'preference_study.create', 'preference_study.update',
    'preference_study.message.append', 'preference_study.evidence.add'
  ) then
    workspace_uuid := case when operation_name = 'edit_reference.create'
      then (request_json->>'workspaceId')::uuid
      else (request_json->'input'->>'workspaceId')::uuid end;
    if operation_name in ('preference_study.message.append', 'preference_study.evidence.add') then
      input_json := request_json->'input';
      if request_json->>'studyId' !~ '^[a-f0-9-]{36}$'
        or (input_json->>'expectedStudyRevision') !~ '^[0-9]+$'
      then raise exception using errcode = '22023', message = 'REEDITPRO_EVIDENCE_COMMAND_INVALID'; end if;
      study_uuid := (request_json->>'studyId')::uuid;
      expected_study_revision := (input_json->>'expectedStudyRevision')::bigint;
      if not exists (
        select 1 from public.workspace_members member
        where member.workspace_id = workspace_uuid
          and member.user_id = actor_id
          and member.role in ('owner', 'admin', 'editor')
      ) then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;
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
      if not found then
        select * into study_row from public.preference_study_sessions study
        where study.id = study_uuid and study.workspace_id = workspace_uuid
        for update;
        if not found or study_row.revision <> expected_study_revision
        then raise exception using errcode = '40001', message = 'REEDITPRO_STUDY_REVISION_CONFLICT'; end if;
        select * into reference_row from public.edit_references reference
        where reference.id = study_row.edit_reference_id
          and reference.workspace_id = workspace_uuid
          and reference.owner_user_id = actor_id
        for update;
        if not found then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;

        insert into public.preference_dna_lifecycle_events (
          workspace_id, edit_reference_id, study_session_id, dna_version_id,
          event_type, event_json, created_at
        )
        select workspace_uuid, reference_row.id, study_uuid, dna.id, 'superseded',
          jsonb_build_object(
            'supersededAt', public.reeditpro_iso_timestamp(committed_at),
            'reason', 'preference_evidence_revised'
          ), committed_at
        from public.preference_dna_versions dna
        where dna.study_session_id = study_uuid
          and dna.status <> 'superseded'
          and not exists (
            select 1 from public.preference_dna_lifecycle_events event
            where event.dna_version_id = dna.id and event.event_type = 'superseded'
          );
        update public.preference_dna_versions dna
        set status = 'superseded'
        where dna.study_session_id = study_uuid
          and dna.status <> 'superseded'
          and exists (
            select 1 from public.preference_dna_lifecycle_events event
            where event.dna_version_id = dna.id and event.event_type = 'superseded'
          );
      end if;
    end if;
    select value into legacy_result
    from public.mutate_edit_reference_domain_command_v1(
      'edit-reference-domain-command-v1', actor_id,
      jsonb_set(p_command, '{schemaVersion}', '"edit-reference-domain-command-v1"'::jsonb),
      p_idempotency_key_hash_sha256, p_request_hash_sha256
    ) as value;
    return next jsonb_set(
      legacy_result,
      '{aggregate}',
      public.reeditpro_build_edit_reference_domain_aggregate_v2(actor_id, workspace_uuid),
      true
    );
    return;
  end if;

  if operation_name not in (
    'preference_study.evidence.run',
    'preference_study.dna.synthesize',
    'preference_study.dna.qa.run',
    'preference_study.dna.approve'
  ) then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_OPERATION_UNSUPPORTED'; end if;

  input_json := request_json->'input';
  prepared_json := request_json->'prepared';
  if jsonb_typeof(input_json) <> 'object'
    or jsonb_typeof(prepared_json) <> 'object'
    or input_json->>'workspaceId' !~ '^[a-f0-9-]{36}$'
    or request_json->>'studyId' !~ '^[a-f0-9-]{36}$'
  then raise exception using errcode = '22023', message = 'REEDITPRO_DOMAIN_COMMAND_INVALID'; end if;
  workspace_uuid := (input_json->>'workspaceId')::uuid;
  study_uuid := (request_json->>'studyId')::uuid;

  if not exists (
    select 1 from public.workspace_members member
    where member.workspace_id = workspace_uuid
      and member.user_id = actor_id
      and member.role in ('owner', 'admin', 'editor')
  ) then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;

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
      'aggregate', public.reeditpro_build_edit_reference_domain_aggregate_v2(actor_id, workspace_uuid),
      'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid),
      'receipt', existing_receipt.receipt_json,
      'replayed', true
    );
    return;
  end if;

  select * into study_row
  from public.preference_study_sessions study
  where study.id = study_uuid and study.workspace_id = workspace_uuid
  for update;
  if not found then raise exception using errcode = 'P0002', message = 'REEDITPRO_STUDY_NOT_FOUND'; end if;
  select * into reference_row
  from public.edit_references reference
  where reference.id = study_row.edit_reference_id
    and reference.workspace_id = workspace_uuid
    and reference.owner_user_id = actor_id
  for update;
  if not found then raise exception using errcode = '42501', message = 'REEDITPRO_DOMAIN_WRITE_DENIED'; end if;
  reference_uuid := reference_row.id;
  expected_study_revision := (input_json->>'expectedStudyRevision')::bigint;
  if expected_study_revision is null or study_row.revision <> expected_study_revision
  then raise exception using errcode = '40001', message = 'REEDITPRO_STUDY_REVISION_CONFLICT'; end if;
  if reference_row.status = 'archived' or study_row.status = 'archived'
  then raise exception using errcode = '22023', message = 'REEDITPRO_STUDY_ARCHIVED'; end if;
  if prepared_json->>'referenceId' <> reference_uuid::text
  then raise exception using errcode = '22023', message = 'REEDITPRO_PREPARED_REFERENCE_INVALID'; end if;

  next_revision := domain_state.revision + 1;
  next_audit_sequence := domain_state.audit_event_count + 1;
  next_receipt_sequence := domain_state.idempotency_receipt_count + 1;
  select coalesce(max(message.sequence), 0) + 1 into next_message_sequence
  from public.preference_study_messages message
  where message.study_session_id = study_uuid;

  message_json := prepared_json->'assistantMessage';
  usage_json := prepared_json->'usageLog';
  if jsonb_typeof(message_json) <> 'object'
    or message_json->>'id' !~ '^[a-f0-9-]{36}$'
    or message_json->>'workspaceId' <> workspace_uuid::text
    or message_json->>'editReferenceId' <> reference_uuid::text
    or message_json->>'studySessionId' <> study_uuid::text
    or message_json->>'role' <> 'assistant'
    or (message_json->>'sequence')::bigint <> next_message_sequence
    or length(btrim(message_json->>'content')) not between 1 and 8000
    or jsonb_typeof(usage_json) <> 'object'
    or usage_json->>'id' !~ '^[a-f0-9-]{36}$'
    or usage_json->>'workspaceId' <> workspace_uuid::text
    or usage_json->>'editReferenceId' <> reference_uuid::text
  then raise exception using errcode = '22023', message = 'REEDITPRO_PREPARED_PROJECTION_INVALID'; end if;
  message_uuid := (message_json->>'id')::uuid;
  usage_uuid := (usage_json->>'id')::uuid;

  if operation_name = 'preference_study.evidence.run' then
    if study_row.status <> 'ready_to_study'
      or prepared_json->>'preparationClass' <> 'manual_deterministic_no_media_no_provider'
      or coalesce((prepared_json->>'providerCallMade')::boolean, true)
      or coalesce((prepared_json->>'modelCallMade')::boolean, true)
      or coalesce((prepared_json->>'fileBytesRead')::boolean, true)
      or coalesce((prepared_json->>'mediaProcessingStarted')::boolean, true)
      or coalesce((prepared_json->>'workerJobCreated')::boolean, true)
      or coalesce((prepared_json->>'remoteMutationMade')::boolean, true)
      or jsonb_typeof(prepared_json->'derivedEvidence') <> 'array'
      or jsonb_array_length(prepared_json->'derivedEvidence') not between 1 and 256
      or jsonb_typeof(prepared_json->'skillRuns') <> 'array'
      or jsonb_array_length(prepared_json->'skillRuns') not between 1 and 256
      or prepared_json->>'orchestrationId' is null
      or prepared_json->>'studyStatus' not in ('evidence_ready', 'needs_clarification', 'needs_user_review')
      or prepared_json->>'evidenceStatus' not in ('evidence_ready', 'needs_clarification')
      or not exists (
        select 1 from public.preference_evidence evidence
        where evidence.study_session_id = study_uuid
          and evidence.evidence_type = 'manual_user_evidence'
      )
      or exists (
        select 1 from public.preference_evidence evidence
        where evidence.study_session_id = study_uuid
          and evidence.evidence_type not in ('manual_user_evidence', 'derived_skill_evidence')
      )
      or exists (
        select 1 from public.preference_evidence_assets asset
        where asset.study_session_id = study_uuid
      )
    then raise exception using errcode = '22023', message = 'REEDITPRO_EVIDENCE_STUDY_PREPARED_RESULT_INVALID'; end if;

    for record_value in select value from jsonb_array_elements(prepared_json->'derivedEvidence') loop
      if record_value->>'id' !~ '^[a-f0-9-]{36}$'
        or record_value->>'workspaceId' <> workspace_uuid::text
        or record_value->>'editReferenceId' <> reference_uuid::text
        or record_value->>'studySessionId' <> study_uuid::text
        or record_value->>'orchestrationId' <> prepared_json->>'orchestrationId'
        or record_value->>'sourceType' <> 'derived_skill_evidence'
        or record_value->'provenance'->>'runtimeSource' in ('verified_live', 'verified_local')
      then raise exception using errcode = '22023', message = 'REEDITPRO_DERIVED_EVIDENCE_INVALID'; end if;
      insert into public.preference_evidence (
        id, workspace_id, edit_reference_id, study_session_id, revision,
        content_digest, evidence_type, evidence_json, created_at
      ) values (
        (record_value->>'id')::uuid, workspace_uuid, reference_uuid, study_uuid,
        (record_value->>'revision')::bigint,
        public.reeditpro_sha256_json(record_value), 'derived_skill_evidence', record_value,
        (record_value->>'createdAt')::timestamptz
      );
      stable_ids := stable_ids || jsonb_build_array(record_value->>'id');
    end loop;

    for record_value in select value from jsonb_array_elements(prepared_json->'skillRuns') loop
      if record_value->>'id' !~ '^[a-f0-9-]{36}$'
        or record_value->>'workspaceId' <> workspace_uuid::text
        or record_value->>'editReferenceId' <> reference_uuid::text
        or record_value->>'studySessionId' <> study_uuid::text
        or record_value->>'orchestrationId' <> prepared_json->>'orchestrationId'
        or coalesce((record_value->>'providerCallMade')::boolean, true)
        or coalesce((record_value->>'modelCallMade')::boolean, true)
        or coalesce((record_value->>'fileBytesRead')::boolean, true)
        or coalesce((record_value->>'mediaProcessingStarted')::boolean, true)
        or coalesce((record_value->>'workerJobCreated')::boolean, true)
      then raise exception using errcode = '22023', message = 'REEDITPRO_SKILL_RUN_INVALID'; end if;
      select coalesce(max(run.attempt), 0) + 1 into skill_attempt
      from public.preference_skill_runs run
      where run.study_session_id = study_uuid and run.skill_id = record_value->>'skillId';
      insert into public.preference_skill_runs (
        id, workspace_id, edit_reference_id, study_session_id, skill_id,
        attempt, status, result_digest, internal_cost_micros, record_json, created_at
      ) values (
        (record_value->>'id')::uuid, workspace_uuid, reference_uuid, study_uuid,
        record_value->>'skillId', skill_attempt, record_value->>'status',
        public.reeditpro_sha256_json(record_value),
        coalesce(nullif(record_value->'runtimeAttempt'->>'meteredInternalCostMicros', '')::bigint, 0),
        record_value, (record_value->>'createdAt')::timestamptz
      );
      stable_ids := stable_ids || jsonb_build_array(record_value->>'id');
    end loop;
    study_status := prepared_json->>'studyStatus';
    evidence_status := prepared_json->>'evidenceStatus';
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{status}', to_jsonb(study_status)),
      '{evidenceStatus}', to_jsonb(evidence_status)),
      '{revision}', to_jsonb(study_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set status = study_status,
      revision = revision + 1, record_json = study_record, updated_at = committed_at
    where id = study_uuid;
    reference_record := jsonb_set(jsonb_set(
      reference_row.record_json, '{evidenceStatus}', to_jsonb(evidence_status)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    audit_event_type := 'preference_evidence_study_completed';

  elsif operation_name = 'preference_study.dna.synthesize' then
    dna_json := prepared_json->'dnaVersion';
    if study_row.status <> 'evidence_ready'
      or study_row.record_json->>'evidenceStatus' <> 'evidence_ready'
      or jsonb_typeof(dna_json) <> 'object'
      or dna_json->>'id' !~ '^[a-f0-9-]{36}$'
      or dna_json->>'workspaceId' <> workspace_uuid::text
      or dna_json->>'editReferenceId' <> reference_uuid::text
      or dna_json->>'studySessionId' <> study_uuid::text
      or dna_json->>'status' <> 'review_required'
      or dna_json->>'synthesisVersion' <> 'edit-reference-dna-synthesis-v1'
      or dna_json->>'runtimeSource' <> 'verified_mock'
      or dna_json->>'qaStatus' <> 'not_run'
      or dna_json->>'contentDigest' !~ '^[a-f0-9]{64}$'
      or coalesce((dna_json->>'providerCallMade')::boolean, true)
      or coalesce((dna_json->>'modelCallMade')::boolean, true)
      or coalesce((dna_json->>'mediaProcessingStarted')::boolean, true)
      or coalesce((dna_json->>'workerJobCreated')::boolean, true)
      or coalesce((dna_json->>'generationRequestCreated')::boolean, true)
      or coalesce((dna_json->>'renderJobCreated')::boolean, true)
      or coalesce((dna_json->>'creditReservedOrSpent')::boolean, true)
      or jsonb_typeof(dna_json->'inputEvidenceRevisions') <> 'array'
      or jsonb_array_length(dna_json->'inputEvidenceRevisions') < 1
      or (dna_json->>'version')::bigint <> coalesce((
        select max(dna.version) + 1 from public.preference_dna_versions dna
        where dna.study_session_id = study_uuid
      ), 1)
      or exists (
        select 1 from jsonb_array_elements(dna_json->'inputEvidenceRevisions') item
        where item->>'evidenceId' !~ '^[a-f0-9-]{36}$'
          or not exists (
            select 1 from public.preference_evidence evidence
            where evidence.id = (item->>'evidenceId')::uuid
              and evidence.study_session_id = study_uuid
              and evidence.revision = (item->>'revision')::bigint
          )
      )
      or not exists (
        select 1 from public.preference_skill_runs run
        where run.study_session_id = study_uuid
          and run.skill_id = 'edit_reference.transferability.copy_safety'
          and run.status = 'completed'
          and run.record_json is not null
      )
    then raise exception using errcode = '22023', message = 'REEDITPRO_DNA_PREPARED_RESULT_INVALID'; end if;
    dna_uuid := (dna_json->>'id')::uuid;
    insert into public.preference_dna_lifecycle_events (
      workspace_id, edit_reference_id, study_session_id, dna_version_id,
      event_type, event_json, created_at
    )
    select workspace_uuid, reference_uuid, study_uuid, dna.id, 'superseded',
      jsonb_build_object('supersededAt', public.reeditpro_iso_timestamp(committed_at)), committed_at
    from public.preference_dna_versions dna
    where dna.study_session_id = study_uuid
      and not exists (
        select 1 from public.preference_dna_lifecycle_events event
        where event.dna_version_id = dna.id and event.event_type in ('approved', 'superseded')
      );
    update public.preference_dna_versions dna
    set status = 'superseded'
    where dna.study_session_id = study_uuid
      and dna.status in ('draft', 'review_required')
      and exists (
        select 1 from public.preference_dna_lifecycle_events event
        where event.dna_version_id = dna.id and event.event_type = 'superseded'
      );
    insert into public.preference_dna_versions (
      id, workspace_id, edit_reference_id, study_session_id, version,
      content_digest, status, record_json, created_at
    ) values (
      dna_uuid, workspace_uuid, reference_uuid, study_uuid,
      (dna_json->>'version')::bigint, dna_json->>'contentDigest',
      'review_required', dna_json, (dna_json->>'createdAt')::timestamptz
    );
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{status}', '"dna_ready"'::jsonb),
      '{dnaStatus}', '"review_required"'::jsonb),
      '{qaStatus}', '"not_run"'::jsonb),
      '{revision}', to_jsonb(study_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set status = 'dna_ready', revision = revision + 1,
      record_json = study_record, updated_at = committed_at where id = study_uuid;
    reference_record := jsonb_set(jsonb_set(jsonb_set(
      reference_row.record_json, '{dnaStatus}', '"review_required"'::jsonb),
      '{qaStatus}', '"not_run"'::jsonb),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    stable_ids := stable_ids || jsonb_build_array(dna_uuid::text);
    audit_event_type := 'preference_dna_version_created';

  elsif operation_name = 'preference_study.dna.qa.run' then
    if request_json->>'dnaVersionId' !~ '^[a-f0-9-]{36}$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_DNA_ID_INVALID'; end if;
    dna_uuid := (request_json->>'dnaVersionId')::uuid;
    select * into dna_row from public.preference_dna_versions dna
    where dna.id = dna_uuid and dna.study_session_id = study_uuid;
    if not found
      or exists (select 1 from public.preference_dna_lifecycle_events event where event.dna_version_id = dna_uuid)
      or exists (select 1 from public.preference_dna_qa_results qa where qa.dna_version_id = dna_uuid)
      or dna_row.content_digest <> input_json->>'expectedDNAContentDigest'
    then raise exception using errcode = '40001', message = 'REEDITPRO_DNA_QA_STATE_CONFLICT'; end if;
    qa_json := prepared_json->'qaResult';
    if jsonb_typeof(qa_json) <> 'object'
      or qa_json->>'id' !~ '^[a-f0-9-]{36}$'
      or qa_json->>'workspaceId' <> workspace_uuid::text
      or qa_json->>'editReferenceId' <> reference_uuid::text
      or qa_json->>'studySessionId' <> study_uuid::text
      or qa_json->>'dnaVersionId' <> dna_uuid::text
      or qa_json->>'dnaContentDigest' <> dna_row.content_digest
      or qa_json->>'status' not in ('passed', 'blocked', 'requires_user_review')
      or qa_json->>'contentDigest' !~ '^[a-f0-9]{64}$'
      or coalesce((qa_json->>'providerCallMade')::boolean, true)
      or coalesce((qa_json->>'modelCallMade')::boolean, true)
      or coalesce((qa_json->>'fileBytesRead')::boolean, true)
      or coalesce((qa_json->>'externalUrlFetched')::boolean, true)
      or coalesce((qa_json->>'mediaProcessingStarted')::boolean, true)
      or coalesce((qa_json->>'workerJobCreated')::boolean, true)
      or coalesce((qa_json->>'generationRequestCreated')::boolean, true)
      or coalesce((qa_json->>'renderJobCreated')::boolean, true)
      or coalesce((qa_json->>'creditReservedOrSpent')::boolean, true)
    then raise exception using errcode = '22023', message = 'REEDITPRO_DNA_QA_PREPARED_RESULT_INVALID'; end if;
    qa_uuid := (qa_json->>'id')::uuid;
    insert into public.preference_dna_qa_results (
      id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
      dna_content_digest, status, result_digest, record_json, created_at
    ) values (
      qa_uuid, workspace_uuid, reference_uuid, study_uuid, dna_uuid,
      dna_row.content_digest, qa_json->>'status', qa_json->>'contentDigest',
      qa_json, (qa_json->>'createdAt')::timestamptz
    );
    study_status := case when qa_json->>'status' = 'blocked' then 'qa_blocked' else 'needs_user_review' end;
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{status}', to_jsonb(study_status)),
      '{qaStatus}', to_jsonb(qa_json->>'status')),
      '{revision}', to_jsonb(study_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set status = study_status, revision = revision + 1,
      record_json = study_record, updated_at = committed_at where id = study_uuid;
    reference_record := jsonb_set(jsonb_set(
      reference_row.record_json, '{qaStatus}', to_jsonb(qa_json->>'status')),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    stable_ids := stable_ids || jsonb_build_array(qa_uuid::text);
    audit_event_type := 'preference_dna_qa_completed';

  else
    if request_json->>'dnaVersionId' !~ '^[a-f0-9-]{36}$'
    then raise exception using errcode = '22023', message = 'REEDITPRO_DNA_ID_INVALID'; end if;
    dna_uuid := (request_json->>'dnaVersionId')::uuid;
    select * into dna_row from public.preference_dna_versions dna
    where dna.id = dna_uuid and dna.study_session_id = study_uuid;
    select * into qa_row from public.preference_dna_qa_results qa
    where qa.id = (input_json->>'qaResultId')::uuid
      and qa.dna_version_id = dna_uuid and qa.study_session_id = study_uuid;
    qa_uuid := qa_row.id;
    approval_json := prepared_json->'approval';
    if dna_row.id is null
      or qa_row.id is null
      or exists (select 1 from public.preference_dna_lifecycle_events event where event.dna_version_id = dna_uuid)
      or dna_row.content_digest <> input_json->>'expectedDNAContentDigest'
      or qa_row.status = 'blocked'
      or (qa_row.status = 'requires_user_review' and coalesce((input_json->>'acknowledgeQAReview')::boolean, false) is not true)
      or coalesce((input_json->>'acknowledgeAdaptNotCopy')::boolean, false) is not true
      or jsonb_typeof(approval_json) <> 'object'
      or approval_json->>'id' !~ '^[a-f0-9-]{36}$'
      or approval_json->>'qaResultId' <> qa_row.id::text
      or coalesce((approval_json->>'acknowledgedAdaptNotCopy')::boolean, false) is not true
      or approval_json->>'approvedBy' <> 'authenticated_user'
    then raise exception using errcode = '40001', message = 'REEDITPRO_DNA_APPROVAL_STATE_CONFLICT'; end if;
    insert into public.preference_dna_lifecycle_events (
      workspace_id, edit_reference_id, study_session_id, dna_version_id,
      event_type, event_json, created_at
    )
    select workspace_uuid, reference_uuid, study_uuid, dna.id, 'superseded',
      jsonb_build_object('supersededAt', public.reeditpro_iso_timestamp(committed_at)), committed_at
    from public.preference_dna_versions dna
    join public.preference_dna_lifecycle_events approved
      on approved.dna_version_id = dna.id and approved.event_type = 'approved'
    where dna.study_session_id = study_uuid and dna.id <> dna_uuid
      and not exists (
        select 1 from public.preference_dna_lifecycle_events prior
        where prior.dna_version_id = dna.id and prior.event_type = 'superseded'
      );
    update public.preference_dna_versions dna
    set status = 'superseded'
    where dna.study_session_id = study_uuid
      and dna.id <> dna_uuid
      and dna.status = 'approved'
      and exists (
        select 1 from public.preference_dna_lifecycle_events event
        where event.dna_version_id = dna.id and event.event_type = 'superseded'
      );
    lifecycle_uuid := extensions.gen_random_uuid();
    insert into public.preference_dna_lifecycle_events (
      id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
      event_type, qa_result_id, event_json, created_at
    ) values (
      lifecycle_uuid, workspace_uuid, reference_uuid, study_uuid, dna_uuid,
      'approved', qa_row.id, jsonb_build_object('approval', approval_json), committed_at
    );
    update public.preference_dna_versions
    set status = 'approved', approval_id = approval_json->>'id'
    where id = dna_uuid;
    study_record := jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
      study_row.record_json, '{status}', '"approved"'::jsonb),
      '{dnaStatus}', '"approved"'::jsonb),
      '{qaStatus}', to_jsonb(qa_row.status)),
      '{revision}', to_jsonb(study_row.revision + 1)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.preference_study_sessions set status = 'approved', revision = revision + 1,
      record_json = study_record, updated_at = committed_at where id = study_uuid;
    reference_record := jsonb_set(jsonb_set(jsonb_set(
      reference_row.record_json, '{dnaStatus}', '"approved"'::jsonb),
      '{qaStatus}', to_jsonb(qa_row.status)),
      '{updatedAt}', to_jsonb(public.reeditpro_iso_timestamp(committed_at)));
    update public.edit_references set record_json = reference_record,
      updated_at = committed_at where id = reference_uuid;
    audit_event_type := 'preference_dna_version_approved';
  end if;

  insert into public.preference_study_messages (
    id, workspace_id, edit_reference_id, study_session_id, sequence,
    role, content, content_digest, runtime_source, created_at
  ) values (
    message_uuid, workspace_uuid, reference_uuid, study_uuid, next_message_sequence,
    'assistant', message_json->>'content',
    encode(extensions.digest(convert_to(message_json->>'content', 'UTF8'), 'sha256'), 'hex'),
    message_json->>'runtimeSource', (message_json->>'createdAt')::timestamptz
  );
  insert into public.preference_usage_events (
    id, workspace_id, edit_reference_id, event_type, event_digest, event_json, created_at
  ) values (
    usage_uuid, workspace_uuid, reference_uuid, usage_json->>'eventType',
    public.reeditpro_sha256_json(usage_json), usage_json, (usage_json->>'createdAt')::timestamptz
  );
  stable_ids := jsonb_build_array(reference_uuid::text, study_uuid::text)
    || stable_ids || jsonb_build_array(message_uuid::text, usage_uuid::text);

  audit_uuid := extensions.gen_random_uuid();
  insert into public.edit_reference_domain_audit_events (
    id, workspace_id, actor_user_id, sequence, aggregate_revision,
    event_type, edit_reference_id, study_session_id, event_json, created_at
  ) values (
    audit_uuid, workspace_uuid, actor_id, next_audit_sequence, next_revision,
    audit_event_type, reference_uuid, study_uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'id', audit_uuid::text,
      'sequence', next_audit_sequence,
      'eventType', audit_event_type,
      'actorUserId', actor_id::text,
      'editReferenceId', reference_uuid::text,
      'studySessionId', study_uuid::text,
      'dnaVersionId', dna_uuid::text,
      'dnaQaResultId', qa_uuid::text,
      'aggregateRevision', next_revision,
      'createdAt', public.reeditpro_iso_timestamp(committed_at)
    )), committed_at
  );

  update public.edit_reference_domain_states set
    revision = next_revision,
    audit_event_count = next_audit_sequence,
    idempotency_receipt_count = next_receipt_sequence,
    updated_at = committed_at
  where workspace_id = workspace_uuid and owner_user_id = actor_id;

  result_json := jsonb_build_object(
    'resultKind', 'edit_reference_detail',
    'editReferenceId', reference_uuid::text,
    'studySessionId', study_uuid::text,
    'stableResultIds', stable_ids
  );
  result_json := result_json || jsonb_build_object(
    'resultDigestSha256', public.reeditpro_sha256_json(result_json)
  );
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
    'aggregate', public.reeditpro_build_edit_reference_domain_aggregate_v2(actor_id, workspace_uuid),
    'auditEvents', public.reeditpro_read_edit_reference_domain_audit_events(actor_id, workspace_uuid),
    'receipt', receipt_json,
    'replayed', false
  );
end;
$$;

revoke all on function public.reeditpro_build_edit_reference_domain_aggregate_v2(uuid, uuid) from public, anon, authenticated;
revoke all on function public.read_edit_reference_domain_aggregate_v2(text, jsonb) from public, anon, authenticated;
revoke all on function public.read_edit_reference_domain_idempotency_v1(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.mutate_edit_reference_domain_command_v2(text, uuid, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.read_edit_reference_domain_aggregate_v2(text, jsonb) to service_role;
grant execute on function public.read_edit_reference_domain_idempotency_v1(uuid, uuid, text, text, text) to service_role;
grant execute on function public.mutate_edit_reference_domain_command_v2(text, uuid, jsonb, text, text) to service_role;
