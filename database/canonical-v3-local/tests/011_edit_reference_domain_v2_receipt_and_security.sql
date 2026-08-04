\set ON_ERROR_STOP on
\echo 'canonical-v3-local: Edit Reference domain V2 receipt lookup, tenant isolation, and RPC boundaries'

begin;
\ir _fixture.sql

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  created jsonb;
  aggregate_read jsonb;
  committed_lookup jsonb;
  missing_lookup_count integer;
begin
  select * into created
  from public.mutate_edit_reference_domain_command_v2(
    'edit-reference-domain-command-v2',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'schemaVersion', 'edit-reference-domain-command-v2',
      'operation', 'edit_reference.create',
      'request', jsonb_build_object(
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'name', 'V2 receipt authority',
        'description', 'A bounded local command used to prove replay before preparation.',
        'initialGoals', jsonb_build_array('visual_language', 'story_and_pacing')
      )
    ),
    repeat('6', 64),
    repeat('a', 64)
  );

  if created->>'replayed' <> 'false'
    or created->'aggregate'->>'schemaVersion' <> 'edit-reference-private-v2'
    or created->'receipt'->>'operation' <> 'edit_reference.create'
    or jsonb_array_length(created->'aggregate'->'references') <> 1
  then raise exception 'EDIT_REFERENCE_DOMAIN_V2_CREATE_INVALID_%', created; end if;

  select * into committed_lookup
  from public.read_edit_reference_domain_idempotency_v1(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'edit_reference.create',
    repeat('6', 64),
    repeat('a', 64)
  );
  if committed_lookup->>'replayed' <> 'true'
    or committed_lookup->'receipt' <> created->'receipt'
    or committed_lookup->'aggregate' <> created->'aggregate'
  then raise exception 'EDIT_REFERENCE_DOMAIN_V2_LOOKUP_CHANGED'; end if;

  select count(*) into missing_lookup_count
  from public.read_edit_reference_domain_idempotency_v1(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'edit_reference.create',
    repeat('7', 64),
    repeat('a', 64)
  );
  if missing_lookup_count <> 0
  then raise exception 'EDIT_REFERENCE_DOMAIN_V2_MISSING_LOOKUP_RETURNED_ROW'; end if;

  begin
    perform * from public.read_edit_reference_domain_idempotency_v1(
      '11111111-1111-4111-8111-111111111111',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'edit_reference.create',
      repeat('6', 64),
      repeat('b', 64)
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_V2_LOOKUP_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;

  select * into aggregate_read
  from public.read_edit_reference_domain_aggregate_v2(
    'edit-reference-domain-aggregate-read-v2',
    jsonb_build_object(
      'actorUserId', '11111111-1111-4111-8111-111111111111',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  );
  if aggregate_read->'aggregate' <> created->'aggregate'
    or aggregate_read->'auditEvents' <> created->'auditEvents'
    or aggregate_read::text ~* '(signed.?url|service.?role.?key|access.?token|raw.?frame|raw.?provider.?payload)'
  then raise exception 'EDIT_REFERENCE_DOMAIN_V2_READ_INVALID_%', aggregate_read; end if;

  begin
    perform * from public.read_edit_reference_domain_aggregate_v2(
      'edit-reference-domain-aggregate-read-v2',
      jsonb_build_object(
        'actorUserId', '22222222-2222-4222-8222-222222222222',
        'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      )
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_V2_CROSS_WORKSPACE_READ_ALLOWED';
  exception when insufficient_privilege then null;
  end;

  begin
    perform * from public.read_edit_reference_domain_idempotency_v1(
      '22222222-2222-4222-8222-222222222222',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'edit_reference.create',
      repeat('6', 64),
      repeat('a', 64)
    );
    raise exception 'EDIT_REFERENCE_DOMAIN_V2_CROSS_WORKSPACE_RECEIPT_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.mutate_edit_reference_domain_command_v2(text,uuid,jsonb,text,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.read_edit_reference_domain_aggregate_v2(text,jsonb)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.read_edit_reference_domain_idempotency_v1(uuid,uuid,text,text,text)',
    'EXECUTE'
  ) then raise exception 'EDIT_REFERENCE_DOMAIN_V2_RPC_ROLE_BOUNDARY_TOO_BROAD'; end if;

  if has_table_privilege('authenticated', 'public.preference_dna_lifecycle_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.preference_dna_lifecycle_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.preference_dna_lifecycle_events', 'DELETE')
  then raise exception 'EDIT_REFERENCE_DNA_LIFECYCLE_DIRECT_MUTATION_ALLOWED'; end if;

  if not exists (
    select 1 from pg_trigger trigger_row
    join pg_class relation on relation.oid = trigger_row.tgrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'preference_dna_lifecycle_events'
      and trigger_row.tgname = 'preference_dna_lifecycle_events_immutable'
      and not trigger_row.tgisinternal
  ) then raise exception 'EDIT_REFERENCE_DNA_LIFECYCLE_IMMUTABILITY_TRIGGER_MISSING'; end if;
end;
$$;

rollback;
\echo 'PASS 011_edit_reference_domain_v2_receipt_and_security'
