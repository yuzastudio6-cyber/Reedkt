import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import {
  auditSupabaseMigrationDirectory,
  auditSupabaseMigrationSources,
} from '../supabase/migration-baseline-audit'
import { createSupabaseProductionReadinessPlan } from '../../src/lib/supabase-production-readiness'

const reproducibleFixture = auditSupabaseMigrationSources([
  {
    filePath: 'supabase/migrations/202601010001_core.sql',
    sql: 'create table public.projects (id uuid primary key, title text not null);',
  },
  {
    filePath: 'supabase/migrations/202601020001_add_status.sql',
    sql: "alter table public.projects add column status text not null default 'draft';",
  },
])

assert.equal(reproducibleFixture.status, 'reproducible')
assert.equal(reproducibleFixture.safeToRunRawMigrationDirectory, true)

const parallelFixture = auditSupabaseMigrationSources([
  {
    filePath: 'supabase/migrations/202605130001_legacy.sql',
    sql: [
      'create table public.projects (id uuid primary key, title text not null);',
      'create table public.jobs (id uuid primary key, project_id uuid references public.projects(id));',
    ].join('\n'),
  },
  {
    filePath: 'supabase/migrations/202605180001_rp_data_04.sql',
    sql: [
      'create table if not exists public.projects (id uuid primary key, owner_id uuid not null);',
      'create table if not exists public.approved_plan_snapshots (id uuid primary key);',
    ].join('\n'),
  },
  {
    filePath: 'supabase/migrations/202605210001_runtime.sql',
    sql: [
      'alter table public.jobs add column approved_snapshot_id uuid references public.approved_plan_snapshots(id);',
      'alter table public.approved_plan_snapshots add column project_id uuid references public.projects(id);',
    ].join('\n'),
  },
])

assert.equal(parallelFixture.status, 'blocked_by_parallel_foundations')
assert.equal(parallelFixture.safeToRunRawMigrationDirectory, false)
assert.deepEqual(parallelFixture.incompatibleOverlappingTables, ['projects'])
assert.deepEqual(parallelFixture.laterLegacyOnlyDependencies, ['jobs'])
assert.deepEqual(parallelFixture.laterRpData04OnlyDependencies, ['approved_plan_snapshots'])

const repositoryMigrationDirectory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))
const repositoryReport = auditSupabaseMigrationDirectory(repositoryMigrationDirectory)
const pinnedRemoteDefaultMigrationCount = 24

assert.equal(repositoryReport.status, 'blocked_by_parallel_foundations')
assert.equal(repositoryReport.safeToRunRawMigrationDirectory, false)
assert.equal(repositoryReport.migrationFileCount, pinnedRemoteDefaultMigrationCount)
assert(repositoryReport.legacyFoundationFiles.length === 8)
assert(repositoryReport.rpData04FoundationFiles.length === 8)
assert(repositoryReport.incompatibleOverlappingTables.includes('projects'))
assert(repositoryReport.incompatibleOverlappingTables.includes('workspace_members'))
assert(repositoryReport.laterLegacyOnlyDependencies.includes('edit_plans'))
assert(repositoryReport.laterRpData04OnlyDependencies.includes('approved_plan_snapshots'))
assert(repositoryReport.blockers.length > 0)

const readinessPlan = createSupabaseProductionReadinessPlan()
assert.equal(readinessPlan.status, 'production_blocked')
assert.equal(readinessPlan.migrationBaselineStatus, repositoryReport.status)
assert.deepEqual(readinessPlan.activeMigrationFiles, repositoryReport.migrationFiles)
assert.equal(
  readinessPlan.checks.find((check) => check.id === 'supabase-readiness-migration-baseline-reproducible')?.passed,
  false,
)
assert(readinessPlan.productionBlockers.some((blocker) => /migration baseline/i.test(blocker)))

console.log(JSON.stringify({
  ok: true,
  status: repositoryReport.status,
  migrationFileCount: repositoryReport.migrationFileCount,
  incompatibleOverlappingTables: repositoryReport.incompatibleOverlappingTables,
  laterLegacyOnlyDependencies: repositoryReport.laterLegacyOnlyDependencies,
  laterRpData04OnlyDependencies: repositoryReport.laterRpData04OnlyDependencies,
}))
