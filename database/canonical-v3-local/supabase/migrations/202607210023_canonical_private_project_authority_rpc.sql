-- ReEditPro canonical V3 local baseline: signed-in private project creation.
--
-- This migration belongs only to the isolated canonical-v3-local chain. It is
-- not a production migration and must never be copied into supabase/migrations.
-- Browser principals retain read-only RLS access to projects. Creation is
-- exposed only through one authenticated, loopback-server-signed, idempotent
-- RPC so downstream upload-intent foreign keys have a durable canonical parent.

create table public.canonical_private_project_idempotency_receipts (
  receipt_id uuid primary key default extensions.gen_random_uuid(),
  owner_user_id uuid not null,
  workspace_id uuid not null,
  project_id uuid not null,
  idempotency_key_sha256 text not null check (
    idempotency_key_sha256 ~ '^[a-f0-9]{64}$'
  ),
  request_sha256 text not null check (request_sha256 ~ '^[a-f0-9]{64}$'),
  result_json jsonb not null,
  result_sha256 text not null check (result_sha256 ~ '^[a-f0-9]{64}$'),
  committed_at timestamptz not null,
  unique (owner_user_id, workspace_id, idempotency_key_sha256),
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete restrict,
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict,
  check (result_json->>'resultHash' = result_sha256),
  check (result_json#>>'{project,id}' = project_id::text),
  check (result_json#>>'{project,workspaceId}' = workspace_id::text),
  check (result_json#>>'{project,ownerUserId}' = owner_user_id::text),
  check (result_json::text !~* (
    '"(authorization|accessToken|serviceRole|credential|secret|'
    || 'uploadUrl|uploadHeaders|sessionUri)"[[:space:]]*:'
  ))
);

create index canonical_private_project_receipts_scope_lookup
  on public.canonical_private_project_idempotency_receipts(
    workspace_id, owner_user_id, project_id
  );

alter table public.canonical_private_project_idempotency_receipts
  enable row level security;
alter table public.canonical_private_project_idempotency_receipts
  force row level security;

revoke all on table public.canonical_private_project_idempotency_receipts
  from public, anon, authenticated, service_role;

create trigger canonical_private_project_receipts_immutable
before update or delete on public.canonical_private_project_idempotency_receipts
for each row execute function public.reeditpro_reject_row_mutation();

create or replace function public.reeditpro_assert_local_project_authority_v1(
  p_function_name text,
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
  host_value := lower(split_part(coalesce(headers->>'x-forwarded-host', ''), ':', 1));
  port_value := coalesce(headers->>'x-forwarded-port', '');
  provided_signature := lower(coalesce(
    headers->>'x-reeditpro-local-project-authority', ''
  ));
  local_secret := nullif(current_setting('app.settings.jwt_secret', true), '');
  if host_value not in ('127.0.0.1', 'localhost')
    or port_value <> '57431'
    or coalesce(length(local_secret), 0) < 32
    or provided_signature !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '42501', message = 'PRIVATE_PROJECT_LOCAL_AUTHORITY_REQUIRED';
  end if;
  expected_signature := encode(extensions.hmac(
    'canonical_private_project_local_internal_v1:' || p_function_name || ':'
      || public.reeditpro_sha256_json(p_request),
    local_secret,
    'sha256'
  ), 'hex');
  if not public.reeditpro_constant_time_hex_equal(
    provided_signature,
    expected_signature
  ) then
    raise exception using
      errcode = '42501', message = 'PRIVATE_PROJECT_LOCAL_AUTHORITY_INVALID';
  end if;
end;
$$;

create or replace function public.reeditpro_create_private_project_v1(
  p_contract_version text,
  p_request jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  owner_id uuid;
  workspace_id_value uuid;
  project_id_value uuid;
  idempotency_hash text;
  request_hash text;
  title_value text;
  description_digest text;
  requested_at_value timestamptz;
  committed_at_value timestamptz;
  stored_receipt public.canonical_private_project_idempotency_receipts%rowtype;
  result_without_hash jsonb;
  result_value jsonb;
begin
  if p_contract_version <> 'canonical-private-project-authority-port-v1' then
    raise exception using
      errcode = '22023', message = 'PRIVATE_PROJECT_CONTRACT_VERSION_INVALID';
  end if;
  perform public.reeditpro_upload_target_require_keys(
    p_request,
    array[
      'schemaVersion',
      'workspaceId',
      'ownerUserId',
      'title',
      'descriptionDigestSha256',
      'idempotencyKey',
      'requestSha256',
      'requestedAt'
    ],
    'PRIVATE_PROJECT_CREATE_REQUEST'
  );
  perform public.reeditpro_assert_local_project_authority_v1(
    'reeditpro_create_private_project_v1', p_request
  );

  if p_request->>'schemaVersion'
      <> 'canonical-private-project-authority-request-v1'
    or coalesce(p_request->>'idempotencyKey', '')
      !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    or coalesce(p_request->>'requestSha256', '') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_request->'title') <> 'string'
    or length(p_request->>'title') not between 1 and 120
    or p_request->>'title' <> btrim(p_request->>'title')
    or p_request->>'title' ~ '[[:cntrl:]]'
    or (
      p_request->'descriptionDigestSha256' <> 'null'::jsonb
      and coalesce(p_request->>'descriptionDigestSha256', '')
        !~ '^[a-f0-9]{64}$'
    ) then
    raise exception using
      errcode = '22023', message = 'PRIVATE_PROJECT_CREATE_REQUEST_INVALID';
  end if;

  begin
    owner_id := (p_request->>'ownerUserId')::uuid;
    workspace_id_value := (p_request->>'workspaceId')::uuid;
    requested_at_value := (p_request->>'requestedAt')::timestamptz;
  exception when others then
    raise exception using
      errcode = '22023', message = 'PRIVATE_PROJECT_CREATE_REQUEST_INVALID';
  end;
  if requested_at_value is null then
    raise exception using
      errcode = '22023', message = 'PRIVATE_PROJECT_CREATE_REQUEST_INVALID';
  end if;

  perform public.reeditpro_upload_target_assert_actor(
    owner_id, workspace_id_value, null
  );
  if not public.reeditpro_has_workspace_write_access(workspace_id_value) then
    raise exception using
      errcode = '42501', message = 'PRIVATE_PROJECT_WORKSPACE_WRITE_DENIED';
  end if;

  idempotency_hash := public.reeditpro_upload_target_idempotency_key_hash(
    p_request->>'idempotencyKey'
  );
  request_hash := p_request->>'requestSha256';
  title_value := p_request->>'title';
  description_digest := p_request->>'descriptionDigestSha256';

  perform pg_advisory_xact_lock(hashtextextended(
    owner_id::text || ':' || workspace_id_value::text || ':' || idempotency_hash,
    0
  ));

  select * into stored_receipt
  from public.canonical_private_project_idempotency_receipts
  where owner_user_id = owner_id
    and workspace_id = workspace_id_value
    and idempotency_key_sha256 = idempotency_hash;

  if found then
    if stored_receipt.request_sha256 <> request_hash then
      raise exception using
        errcode = '23505', message = 'PRIVATE_PROJECT_IDEMPOTENCY_CONFLICT';
    end if;
    if stored_receipt.result_sha256
        <> public.reeditpro_sha256_json(stored_receipt.result_json - 'resultHash')
      or stored_receipt.result_json->>'resultHash'
        <> stored_receipt.result_sha256 then
      raise exception using
        errcode = '55000', message = 'PRIVATE_PROJECT_RECEIPT_HASH_INVALID';
    end if;
    return stored_receipt.result_json;
  end if;

  project_id_value := extensions.gen_random_uuid();
  committed_at_value := clock_timestamp();
  insert into public.projects (
    id,
    workspace_id,
    owner_user_id,
    title,
    editing_category,
    status,
    revision,
    created_at,
    updated_at
  ) values (
    project_id_value,
    workspace_id_value,
    owner_id,
    title_value,
    null,
    'draft',
    1,
    committed_at_value,
    committed_at_value
  );

  result_without_hash := jsonb_build_object(
    'schemaVersion', 'canonical-private-project-authority-result-v1',
    'state', 'persisted',
    'project', jsonb_build_object(
      'id', project_id_value,
      'workspaceId', workspace_id_value,
      'ownerUserId', owner_id,
      'title', title_value,
      'status', 'draft',
      'revision', 1,
      'createdAt', to_char(
        committed_at_value at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      ),
      'updatedAt', to_char(
        committed_at_value at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      )
    ),
    'descriptionDigestSha256', description_digest,
    'customerCreditsMutated', false,
    'providerCallMade', false,
    'workerJobCreated', false,
    'renderJobCreated', false,
    'productionAuthority', false
  );
  result_value := public.reeditpro_upload_target_with_hash(
    result_without_hash, 'resultHash'
  );

  insert into public.canonical_private_project_idempotency_receipts (
    owner_user_id,
    workspace_id,
    project_id,
    idempotency_key_sha256,
    request_sha256,
    result_json,
    result_sha256,
    committed_at
  ) values (
    owner_id,
    workspace_id_value,
    project_id_value,
    idempotency_hash,
    request_hash,
    result_value,
    result_value->>'resultHash',
    committed_at_value
  );

  return result_value;
end;
$$;

revoke all on function public.reeditpro_create_private_project_v1(text,jsonb)
  from public, anon, service_role;
grant execute on function public.reeditpro_create_private_project_v1(text,jsonb)
  to authenticated;
revoke all on function public.reeditpro_assert_local_project_authority_v1(
  text, jsonb
) from public, anon, authenticated, service_role;
