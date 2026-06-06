-- Prompt 26E-1 local RLS no-policy advisor remediation candidate.
-- Local/review candidate only. Do not deploy to staging, remote, or production Supabase.
-- Targets only the six Prompt 26D/26E RLS-enabled/no-policy advisor tables.
-- This migration enables RLS when each table exists and installs explicit deny policies
-- for anon and authenticated clients. Backend/service-role access remains controlled by
-- backend key handling and is not browser-safe.
-- No grants, helper functions, indexes, table definitions, positive client policies, or
-- service-role handlers are added here.

do $$
declare
  seed record;
begin
  for seed in
    select *
    from (
      values
        (
          'activation_artifacts',
          'activation_artifacts_select_backend_only',
          'activation_artifacts_insert_backend_only',
          'activation_artifacts_update_backend_only',
          'activation_artifacts_delete_backend_only',
          'backend_service_role_only'
        ),
        (
          'activation_qa_gates',
          'activation_qa_gates_select_backend_only',
          'activation_qa_gates_insert_backend_only',
          'activation_qa_gates_update_backend_only',
          'activation_qa_gates_delete_backend_only',
          'backend_service_role_only'
        ),
        (
          'activation_runs',
          'activation_runs_select_backend_only',
          'activation_runs_insert_backend_only',
          'activation_runs_update_backend_only',
          'activation_runs_delete_backend_only',
          'backend_service_role_only'
        ),
        (
          'feature_gates',
          'feature_gates_select_no_client_access',
          'feature_gates_insert_backend_only',
          'feature_gates_update_backend_only',
          'feature_gates_delete_backend_only',
          'no_client_access'
        ),
        (
          'readiness_snapshots',
          'readiness_snapshots_select_backend_only',
          'readiness_snapshots_insert_backend_only',
          'readiness_snapshots_update_backend_only',
          'readiness_snapshots_delete_backend_only',
          'backend_service_role_only'
        ),
        (
          'tool_capabilities',
          'tool_capabilities_select_no_client_access',
          'tool_capabilities_insert_backend_only',
          'tool_capabilities_update_backend_only',
          'tool_capabilities_delete_backend_only',
          'no_client_access'
        )
    ) as policies(
      table_name,
      select_policy,
      insert_policy,
      update_policy,
      delete_policy,
      access_model
    )
  loop
    if to_regclass(format('public.%I', seed.table_name)) is null then
      raise notice 'Prompt 26E-1 skipped public.% because table is absent in the local schema.', seed.table_name;
    else
      execute format('alter table public.%I enable row level security', seed.table_name);

      execute format('drop policy if exists %I on public.%I', seed.select_policy, seed.table_name);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (false)',
        seed.select_policy,
        seed.table_name
      );

      execute format('drop policy if exists %I on public.%I', seed.insert_policy, seed.table_name);
      execute format(
        'create policy %I on public.%I for insert to anon, authenticated with check (false)',
        seed.insert_policy,
        seed.table_name
      );

      execute format('drop policy if exists %I on public.%I', seed.update_policy, seed.table_name);
      execute format(
        'create policy %I on public.%I for update to anon, authenticated using (false) with check (false)',
        seed.update_policy,
        seed.table_name
      );

      execute format('drop policy if exists %I on public.%I', seed.delete_policy, seed.table_name);
      execute format(
        'create policy %I on public.%I for delete to anon, authenticated using (false)',
        seed.delete_policy,
        seed.table_name
      );

      raise notice 'Prompt 26E-1 installed explicit deny policies for public.% (%).', seed.table_name, seed.access_model;
    end if;
  end loop;
end
$$;
