import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import {
  auditSupabaseSecurityDirectory,
  auditSupabaseSecuritySources,
  type SupabaseSecurityMigrationSource,
} from '../supabase/security-audit'
import { createSupabaseProductionReadinessPlan } from '../../src/lib/supabase-production-readiness'

const insecureFixture: SupabaseSecurityMigrationSource[] = [
  {
    filePath: 'supabase/migrations/202605130001_insecure_foundation.sql',
    sql: `
      create table public.projects (
        id uuid primary key,
        workspace_id uuid not null
      );
      create table public.jobs (
        id uuid primary key,
        workspace_id uuid,
        project_id uuid references public.projects(id)
      );
      create table public.credit_wallets (
        id uuid primary key,
        workspace_id uuid not null
      );
      create table public.worker_leases (
        id uuid primary key,
        workspace_id uuid,
        project_id uuid references public.projects(id),
        lease_token text not null
      );
      create table public.backend_runtime_messages (
        id uuid primary key,
        workspace_id uuid,
        project_id uuid references public.projects(id),
        payload jsonb,
        response_payload jsonb,
        error_payload jsonb
      );
      create table public.profiles (id uuid primary key);
      create table public.user_profiles (id uuid primary key);

      alter table public.projects enable row level security;
      alter table public.jobs enable row level security;
      alter table public.credit_wallets enable row level security;
      alter table public.worker_leases enable row level security;
      alter table public.backend_runtime_messages enable row level security;
      alter table public.profiles enable row level security;
      alter table public.user_profiles enable row level security;

      create policy projects_select on public.projects for select to authenticated using (true);
      create policy jobs_write on public.jobs for all to authenticated using (true) with check (true);
      create policy credit_wallets_write on public.credit_wallets for all to authenticated using (true) with check (true);
      create policy worker_leases_read on public.worker_leases for select to authenticated using (true);
      create policy runtime_messages_read on public.backend_runtime_messages for select to authenticated using (true);
      create policy profiles_read on public.profiles for select to authenticated using (true);
      create policy user_profiles_read on public.user_profiles for select to authenticated using (true);

      grant select, insert, update on table public.jobs to authenticated;
      grant select, insert, update on table public.credit_wallets to authenticated;
      grant select on table public.worker_leases to authenticated;
      grant select on table public.backend_runtime_messages to authenticated;

      create function public.claim_job()
      returns void
      language plpgsql
      security definer
      set search_path = public
      as $$ begin null; end; $$;

      create view public.job_status as select id from public.jobs;

      create policy "legacy_project_objects" on storage.objects
      for select to authenticated using ((storage.foldername(name))[1] is not null);
      create policy "workspace_project_objects" on storage.objects
      for select to authenticated using (
        (storage.foldername(name))[1] = 'workspace'
        and (storage.foldername(name))[3] = 'project'
        and public.is_project_member(public.safe_uuid((storage.foldername(name))[4]))
      );

      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('source-media', 'source-media', false, null, null);
    `,
  },
  {
    filePath: 'supabase/migrations/202605180001_parallel_foundation.sql',
    sql: `
      create table if not exists public.projects (id uuid primary key, owner_id uuid not null);
      create table if not exists public.approved_plan_snapshots (id uuid primary key);
      alter table public.approved_plan_snapshots enable row level security;
      create policy approved_plan_read on public.approved_plan_snapshots for select to authenticated using (true);
    `,
  },
  {
    filePath: 'supabase/migrations/202605210001_later_dependency.sql',
    sql: `
      alter table public.jobs add column approved_snapshot_id uuid references public.approved_plan_snapshots(id);
    `,
  },
]

const insecureReport = auditSupabaseSecuritySources(insecureFixture)
const insecureFindingIds = new Set(insecureReport.findings.map((finding) => finding.id))

assert.equal(insecureReport.status, 'blocked_by_security_findings')
assert.equal(insecureReport.safeToTreatAsProductionSecure, false)
assert.equal(insecureReport.remoteDatabaseVerified, false)
assert(insecureFindingIds.has('migration_baseline_unreconciled'))
assert(insecureFindingIds.has('authenticated_credit_control_mutation'))
assert(insecureFindingIds.has('authenticated_control_plane_mutation'))
assert(insecureFindingIds.has('worker_lease_token_member_readable'))
assert(insecureFindingIds.has('runtime_payloads_member_readable'))
assert(insecureFindingIds.has('security_definer_unsafe_search_path'))
assert(insecureFindingIds.has('security_definer_public_execute_not_revoked'))
assert(insecureFindingIds.has('views_missing_security_invoker'))
assert(insecureFindingIds.has('storage_policy_composition_overlap'))
assert(insecureFindingIds.has('storage_workspace_segment_not_bound_to_project'))
assert(insecureFindingIds.has('storage_upload_constraints_missing'))
assert(insecureFindingIds.has('workspace_project_ids_not_composite_bound'))
assert(insecureFindingIds.has('identity_contract_drift'))

const hardenedFixture = auditSupabaseSecuritySources([
  ...insecureFixture,
  {
    filePath: 'supabase/migrations/202605220001_targeted_hardening.sql',
    sql: `
      drop policy if exists jobs_write on public.jobs;
      drop policy if exists credit_wallets_write on public.credit_wallets;
      drop policy if exists worker_leases_read on public.worker_leases;
      drop policy if exists runtime_messages_read on public.backend_runtime_messages;
      revoke all on table public.jobs from authenticated;
      revoke all on table public.credit_wallets from authenticated;
      revoke all on table public.worker_leases from authenticated;
      revoke all on table public.backend_runtime_messages from authenticated;
      drop policy if exists "legacy_project_objects" on storage.objects;
      create or replace function public.claim_job()
      returns void
      language plpgsql
      security definer
      set search_path = ''
      as $$ begin null; end; $$;
      revoke execute on function public.claim_job() from public, anon;
      create or replace view public.job_status with (security_invoker = true)
      as select id from public.jobs;
    `,
  },
])
const hardenedFindingIds = new Set(hardenedFixture.findings.map((finding) => finding.id))

assert(!hardenedFindingIds.has('authenticated_credit_control_mutation'))
assert(!hardenedFindingIds.has('authenticated_control_plane_mutation'))
assert(!hardenedFindingIds.has('worker_lease_token_member_readable'))
assert(!hardenedFindingIds.has('runtime_payloads_member_readable'))
assert(!hardenedFindingIds.has('security_definer_unsafe_search_path'))
assert(!hardenedFindingIds.has('security_definer_public_execute_not_revoked'))
assert(!hardenedFindingIds.has('views_missing_security_invoker'))
assert(!hardenedFindingIds.has('storage_policy_composition_overlap'))

const migrationDirectory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))
const repositoryReport = auditSupabaseSecurityDirectory(migrationDirectory)
const repositoryFindingIds = new Set(repositoryReport.findings.map((finding) => finding.id))
const pinnedRemoteDefaultMigrationCount = 24

assert.equal(repositoryReport.status, 'blocked_by_security_findings')
assert.equal(repositoryReport.safeToTreatAsProductionSecure, false)
assert.equal(repositoryReport.staticSourceReviewOnly, true)
assert.equal(repositoryReport.remoteDatabaseVerified, false)
assert.equal(repositoryReport.migrationFileCount, pinnedRemoteDefaultMigrationCount)
assert(repositoryFindingIds.has('migration_baseline_unreconciled'))
assert(repositoryFindingIds.has('workspace_project_ids_not_composite_bound'))
assert(repositoryReport.blockers.length > 0)
const readinessPlan = createSupabaseProductionReadinessPlan()
assert.equal(readinessPlan.securitySourceStatus, repositoryReport.status)
assert.equal(readinessPlan.status, 'production_blocked')

console.log(JSON.stringify({
  ok: true,
  fixtureDetectedKnownBlockers: [...insecureFindingIds].sort(),
  sequentialHardeningRecognized: [
    'authenticated_credit_control_mutation',
    'authenticated_control_plane_mutation',
    'worker_lease_token_member_readable',
    'runtime_payloads_member_readable',
    'security_definer_unsafe_search_path',
    'security_definer_public_execute_not_revoked',
    'views_missing_security_invoker',
    'storage_policy_composition_overlap',
  ].every((findingId) => !hardenedFindingIds.has(findingId)),
  repositoryStatus: repositoryReport.status,
  repositoryCriticalFindings: repositoryReport.criticalFindingCount,
  repositoryHighFindings: repositoryReport.highFindingCount,
  repositoryFindingIds: [...repositoryFindingIds].sort(),
}))
