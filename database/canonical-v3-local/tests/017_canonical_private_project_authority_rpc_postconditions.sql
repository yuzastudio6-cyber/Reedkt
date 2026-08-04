\set ON_ERROR_STOP on
\echo 'canonical-v3-local: private project authority RPC postconditions'

do $$
declare
  receipt public.canonical_private_project_idempotency_receipts%rowtype;
begin
  if not exists (
    select 1
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'canonical_private_project_idempotency_receipts'
      and relation.relkind = 'r'
      and relation.relrowsecurity
      and relation.relforcerowsecurity
  ) then
    raise exception 'PRIVATE_PROJECT_RECEIPT_RLS_NOT_FORCED';
  end if;

  if has_table_privilege(
      'anon',
      'public.canonical_private_project_idempotency_receipts',
      'SELECT,INSERT,UPDATE,DELETE'
    )
    or has_table_privilege(
      'authenticated',
      'public.canonical_private_project_idempotency_receipts',
      'SELECT,INSERT,UPDATE,DELETE'
    )
    or has_table_privilege(
      'service_role',
      'public.canonical_private_project_idempotency_receipts',
      'SELECT,INSERT,UPDATE,DELETE'
    ) then
    raise exception 'PRIVATE_PROJECT_RECEIPT_DIRECT_GRANT_PRESENT';
  end if;

  if has_function_privilege(
      'anon',
      'public.reeditpro_create_private_project_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_create_private_project_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_create_private_project_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.reeditpro_assert_local_project_authority_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'authenticated',
      'public.reeditpro_assert_local_project_authority_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_assert_local_project_authority_v1(text,jsonb)',
      'EXECUTE'
    ) then
    raise exception 'PRIVATE_PROJECT_RPC_ROLE_BOUNDARY_INVALID';
  end if;

  if (select count(*) from public.canonical_private_project_idempotency_receipts)
      <> 1 then
    raise exception 'PRIVATE_PROJECT_EXACT_RECEIPT_COUNT_INVALID';
  end if;
  select * into receipt
  from public.canonical_private_project_idempotency_receipts;

  if receipt.result_sha256
      <> public.reeditpro_sha256_json(receipt.result_json - 'resultHash')
    or receipt.result_json->>'resultHash' <> receipt.result_sha256
    or receipt.result_json->>'state' <> 'persisted'
    or receipt.result_json->>'productionAuthority' <> 'false'
    or not exists (
      select 1
      from public.projects project
      where project.id = receipt.project_id
        and project.workspace_id = receipt.workspace_id
        and project.owner_user_id = receipt.owner_user_id
        and project.title = 'Canonical restart-safe upload project'
        and project.status = 'draft'
        and project.revision = 1
    ) then
    raise exception 'PRIVATE_PROJECT_RECEIPT_LINEAGE_INVALID';
  end if;
  if receipt.result_json::text ~* (
    '"(authorization|accessToken|serviceRole|credential|secret|'
    || 'uploadUrl|uploadHeaders|sessionUri)"[[:space:]]*:'
  ) then
    raise exception 'PRIVATE_PROJECT_RECEIPT_SECRET_LIKE_FIELD_PRESENT';
  end if;

  begin
    update public.canonical_private_project_idempotency_receipts
      set result_sha256 = repeat('f', 64);
    raise exception 'PRIVATE_PROJECT_RECEIPT_MUTATION_ALLOWED';
  exception when sqlstate '55000' then null;
  end;
end;
$$;

begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
do $$
begin
  begin
    insert into public.projects (
      workspace_id, owner_user_id, title
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Forbidden direct browser project write'
    );
    raise exception 'PRIVATE_PROJECT_DIRECT_INSERT_ALLOWED';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.reeditpro_create_private_project_v1(
      'canonical-private-project-authority-port-v1',
      jsonb_build_object(
        'schemaVersion', 'canonical-private-project-authority-request-v1',
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'ownerUserId', '11111111-1111-4111-8111-111111111111',
        'title', 'Unsigned project RPC',
        'descriptionDigestSha256', null,
        'idempotencyKey', 'unsigned-project-rpc-v1',
        'requestSha256', repeat('a', 64),
        'requestedAt', '2026-07-29T15:00:00.000Z'
      )
    );
    raise exception 'PRIVATE_PROJECT_UNSIGNED_RPC_ALLOWED';
  exception when sqlstate '42501' then null;
  end;
end;
$$;
rollback;

\echo 'PASS 017_canonical_private_project_authority_rpc_postconditions'
