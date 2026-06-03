-- Prompt 20B local-only RLS smoke test.
-- Production-never: do not run against staging, remote, or production Supabase.
-- Fixtures are deterministic synthetic records inside a transaction that rolls back.
-- No secrets, signed URLs, provider keys, Stripe data, private media, storage transfer,
-- provider/tool/worker/render/media execution, credit mutation, or production data.

\set ON_ERROR_STOP on

begin;

set local statement_timeout = '15s';
set local idle_in_transaction_session_timeout = '30s';

do $$
declare
  missing text[];
begin
  select coalesce(array_agg(name), '{}'::text[])
  into missing
  from (
    values
      ('auth.users', to_regclass('auth.users') is not null),
      ('public.profiles', to_regclass('public.profiles') is not null),
      ('public.workspaces', to_regclass('public.workspaces') is not null),
      ('public.workspace_members', to_regclass('public.workspace_members') is not null),
      ('public.projects', to_regclass('public.projects') is not null),
      ('public.profiles.user_id', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
      )),
      ('public.workspaces.owner_id', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'workspaces' and column_name = 'owner_id'
      )),
      ('public.workspace_members.user_id', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'workspace_members' and column_name = 'user_id'
      )),
      ('public.workspace_members.role', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'workspace_members' and column_name = 'role'
      )),
      ('public.projects.workspace_id', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'projects' and column_name = 'workspace_id'
      )),
      ('public.projects.owner_id', exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'projects' and column_name = 'owner_id'
      )),
      ('policy profiles_select_own', exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
      )),
      ('policy workspaces_select_member', exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'workspaces' and policyname = 'workspaces_select_member'
      )),
      ('policy workspace_members_select_member', exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'workspace_members_select_member'
      )),
      ('policy workspace_members_manage_owner_admin', exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'workspace_members_manage_owner_admin'
      )),
      ('policy projects_select_member', exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_member'
      ))
  ) as checks(name, ok)
  where not ok;

  if array_length(missing, 1) is not null then
    raise exception 'Prompt 20B local RLS precondition failed. Missing: %', array_to_string(missing, ', ');
  end if;
end $$;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0020-000b-0000-000000000001',
    'authenticated',
    'authenticated',
    'prompt20b-owner.local@example.invalid',
    crypt('prompt20b-local-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"fixture":"prompt20b-owner"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0020-000b-0000-000000000002',
    'authenticated',
    'authenticated',
    'prompt20b-member.local@example.invalid',
    crypt('prompt20b-local-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"fixture":"prompt20b-member"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0020-000b-0000-000000000003',
    'authenticated',
    'authenticated',
    'prompt20b-non-member.local@example.invalid',
    crypt('prompt20b-local-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"fixture":"prompt20b-non-member"}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (id, user_id, display_name, metadata_json)
values
  (
    '00000000-0020-000b-0000-000000000301',
    '00000000-0020-000b-0000-000000000001',
    'Prompt 20B Owner',
    '{"fixture":"prompt20b"}'::jsonb
  ),
  (
    '00000000-0020-000b-0000-000000000302',
    '00000000-0020-000b-0000-000000000002',
    'Prompt 20B Member',
    '{"fixture":"prompt20b"}'::jsonb
  ),
  (
    '00000000-0020-000b-0000-000000000303',
    '00000000-0020-000b-0000-000000000003',
    'Prompt 20B Non Member',
    '{"fixture":"prompt20b"}'::jsonb
  );

insert into public.workspaces (id, owner_id, name, metadata_json)
values
  (
    '00000000-0020-000b-0000-000000000101',
    '00000000-0020-000b-0000-000000000001',
    'Prompt 20B Workspace',
    '{"fixture":"prompt20b"}'::jsonb
  ),
  (
    '00000000-0020-000b-0000-000000000102',
    '00000000-0020-000b-0000-000000000003',
    'Prompt 20B Other Workspace',
    '{"fixture":"prompt20b"}'::jsonb
  );

insert into public.workspace_members (id, workspace_id, user_id, role)
values
  (
    '00000000-0020-000b-0000-000000000401',
    '00000000-0020-000b-0000-000000000101',
    '00000000-0020-000b-0000-000000000001',
    'owner'
  ),
  (
    '00000000-0020-000b-0000-000000000402',
    '00000000-0020-000b-0000-000000000101',
    '00000000-0020-000b-0000-000000000002',
    'editor'
  ),
  (
    '00000000-0020-000b-0000-000000000403',
    '00000000-0020-000b-0000-000000000102',
    '00000000-0020-000b-0000-000000000003',
    'owner'
  );

insert into public.projects (id, workspace_id, owner_id, title, editing_category, status, metadata_json)
values
  (
    '00000000-0020-000b-0000-000000000201',
    '00000000-0020-000b-0000-000000000101',
    '00000000-0020-000b-0000-000000000001',
    'Prompt 20B Project',
    'local_rls_smoke',
    'draft',
    '{"fixture":"prompt20b"}'::jsonb
  ),
  (
    '00000000-0020-000b-0000-000000000202',
    '00000000-0020-000b-0000-000000000102',
    '00000000-0020-000b-0000-000000000003',
    'Prompt 20B Other Project',
    'local_rls_smoke',
    'draft',
    '{"fixture":"prompt20b"}'::jsonb
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '00000000-0020-000b-0000-000000000001', true);

do $$
begin
  if not exists (
    select 1 from public.profiles where user_id = '00000000-0020-000b-0000-000000000001'
  ) then
    raise exception 'APW-RLS-01 failed: owner cannot select own profile';
  end if;

  if exists (
    select 1 from public.profiles where user_id = '00000000-0020-000b-0000-000000000002'
  ) then
    raise exception 'APW-RLS-02 failed: owner can select another user profile';
  end if;

  if not exists (
    select 1 from public.workspaces where id = '00000000-0020-000b-0000-000000000101'
  ) then
    raise exception 'APW-RLS-07 failed: owner cannot select own workspace';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0020-000b-0000-000000000002', true);

do $$
declare
  privileged_insert_allowed boolean := false;
begin
  if not exists (
    select 1 from public.workspaces where id = '00000000-0020-000b-0000-000000000101'
  ) then
    raise exception 'APW-RLS-08 failed: member cannot select assigned workspace';
  end if;

  if not exists (
    select 1 from public.projects where id = '00000000-0020-000b-0000-000000000201'
  ) then
    raise exception 'APW-RLS-15 failed: member cannot select assigned project';
  end if;

  begin
    insert into public.workspace_members (id, workspace_id, user_id, role)
    values (
      '00000000-0020-000b-0000-000000000499',
      '00000000-0020-000b-0000-000000000101',
      '00000000-0020-000b-0000-000000000003',
      'owner'
    );
    privileged_insert_allowed := true;
  exception
    when others then
      privileged_insert_allowed := false;
  end;

  if privileged_insert_allowed then
    raise exception 'APW-RLS-11 failed: normal member can create privileged membership';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0020-000b-0000-000000000003', true);

do $$
begin
  if exists (
    select 1 from public.workspaces where id = '00000000-0020-000b-0000-000000000101'
  ) then
    raise exception 'APW-RLS-09 failed: non-member can select assigned workspace';
  end if;

  if exists (
    select 1 from public.projects where id = '00000000-0020-000b-0000-000000000201'
  ) then
    raise exception 'APW-RLS-16 failed: non-member can select assigned project';
  end if;
end $$;

reset role;

rollback;
