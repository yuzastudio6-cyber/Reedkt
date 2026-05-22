import { access } from 'node:fs/promises'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceContext } from '../types'

export const E2E_RLS_TABLES = [
  'approved_plan_snapshots',
  'api_idempotency_keys',
  'upload_intents',
  'storage_object_records',
  'signed_url_events',
  'worker_job_claims',
  'tool_runtime_checks',
  'provider_request_attempts',
  'provider_webhook_events',
] as const

export interface RlsAuthAuditResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  checkedAt: string
  mode: string
  tables: Array<{
    table: string
    rlsEnabled?: boolean
    policyCount?: number
    status: 'passed' | 'failed' | 'unknown'
  }>
  localArtifacts: Array<{ path: string; exists: boolean }>
  warnings: string[]
  blockers: string[]
}

const LOCAL_RLS_ARTIFACTS = [
  'supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql',
  'supabase/migrations/202605210002_e2e_service_role_runtime_rpcs.sql',
  'supabase/migrations/202605210003_e2e_production_service_path_hardening.sql',
  'migration-review-and-rls-hardening.md',
  'rls-hardening-matrix.md',
]

export async function runRlsAuthAudit(context: ServiceContext): Promise<RlsAuthAuditResult> {
  const localArtifacts = await Promise.all(LOCAL_RLS_ARTIFACTS.map(async (path) => ({
    path,
    exists: await fileExists(path),
  })))
  const missingArtifacts = localArtifacts.filter((artifact) => !artifact.exists).map((artifact) => artifact.path)

  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return {
      ok: missingArtifacts.length === 0,
      status: missingArtifacts.length === 0 ? 'skipped' : 'failed',
      checkedAt: new Date().toISOString(),
      mode: context.env.supabaseE2eSmokeMode,
      tables: E2E_RLS_TABLES.map((table) => ({ table, status: 'unknown' })),
      localArtifacts,
      warnings: ['Supabase E2E smoke mode is disabled; live RLS status was not queried.'],
      blockers: missingArtifacts.map((path) => `Missing local RLS/readiness artifact: ${path}`),
    }
  }

  if (!context.clients.admin || !context.env.hasSupabaseAdmin) {
    return {
      ok: false,
      status: 'failed',
      checkedAt: new Date().toISOString(),
      mode: context.env.supabaseE2eSmokeMode,
      tables: E2E_RLS_TABLES.map((table) => ({ table, status: 'unknown' })),
      localArtifacts,
      warnings: [],
      blockers: ['Supabase admin client is required for live RLS/auth audit.'],
    }
  }

  const live = await readLiveRlsStatus(context.clients.admin)
  const blockers = [
    ...missingArtifacts.map((path) => `Missing local RLS/readiness artifact: ${path}`),
    ...live.tables.filter((table) => table.status === 'failed').map((table) => `${table.table} does not have confirmed RLS/policy coverage.`),
  ]

  return {
    ok: blockers.length === 0,
    status: blockers.length === 0 ? 'passed' : 'failed',
    checkedAt: new Date().toISOString(),
    mode: context.env.supabaseE2eSmokeMode,
    tables: live.tables,
    localArtifacts,
    warnings: live.warnings,
    blockers,
  }
}

async function readLiveRlsStatus(client: SupabaseClient): Promise<Pick<RlsAuthAuditResult, 'tables' | 'warnings'>> {
  const warnings: string[] = []
  try {
    const { data, error } = await client
      .schema('pg_catalog')
      .from('pg_tables')
      .select('tablename,rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', [...E2E_RLS_TABLES])

    if (error) {
      warnings.push(`pg_tables RLS lookup unavailable: ${error.message}`)
      return fallbackUnknown(warnings)
    }

    const policyCounts = await readPolicyCounts(client, warnings)
    const tableMap = new Map((data ?? []).map((row) => [
      String((row as { tablename?: unknown }).tablename ?? ''),
      Boolean((row as { rowsecurity?: unknown }).rowsecurity),
    ]))

    return {
      tables: E2E_RLS_TABLES.map((table) => {
        const rlsEnabled = tableMap.get(table)
        const policyCount = policyCounts.get(table)
        const passed = rlsEnabled === true && typeof policyCount === 'number' && policyCount > 0
        return {
          table,
          rlsEnabled,
          policyCount,
          status: passed ? 'passed' : 'failed',
        }
      }),
      warnings,
    }
  } catch (error) {
    warnings.push(`Live RLS audit threw: ${error instanceof Error ? error.message : 'unknown error'}`)
    return fallbackUnknown(warnings)
  }
}

async function readPolicyCounts(client: SupabaseClient, warnings: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  try {
    const { data, error } = await client
      .schema('pg_catalog')
      .from('pg_policies')
      .select('tablename,policyname')
      .eq('schemaname', 'public')
      .in('tablename', [...E2E_RLS_TABLES])

    if (error) {
      warnings.push(`pg_policies lookup unavailable: ${error.message}`)
      return counts
    }

    for (const row of data ?? []) {
      const table = String((row as { tablename?: unknown }).tablename ?? '')
      if (!table) continue
      counts.set(table, (counts.get(table) ?? 0) + 1)
    }
  } catch (error) {
    warnings.push(`pg_policies lookup threw: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
  return counts
}

function fallbackUnknown(warnings: string[]): Pick<RlsAuthAuditResult, 'tables' | 'warnings'> {
  return {
    tables: E2E_RLS_TABLES.map((table) => ({ table, status: 'unknown' })),
    warnings,
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
