import type { SupabaseClient } from '@supabase/supabase-js'
import type { RuntimeEnv } from '../config/env'
import { checkSupabaseLiveEnv } from './live-env-readiness'
import { readMigrationManifest, type MigrationManifestEntry } from './migration-manifest'
import { checkE2EServiceRoleRpcReadiness } from './rpc-readiness'
import { checkSupabaseTableReadiness } from './table-readiness'

export interface LikelyMissingMigration {
  file: string
  purpose: string
  missingTables: string[]
  missingRpcs: string[]
  remoteApplyRequiredFor: string[]
  rollbackRisk: string
}

export interface SupabaseLiveMigrationStatusResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  checkedAt: string
  mode: string
  missingTables: string[]
  missingRpcs: string[]
  likelyMissingMigrations: LikelyMissingMigration[]
  warnings: string[]
  blockers: string[]
}

export async function checkSupabaseLiveMigrationStatus(
  env: RuntimeEnv,
  client: SupabaseClient | null,
  rootDir = process.cwd(),
): Promise<SupabaseLiveMigrationStatusResult> {
  const envCheck = checkSupabaseLiveEnv(env, process.env)
  const checkedAt = new Date().toISOString()

  if (env.supabaseE2eSmokeMode !== 'live') {
    return {
      ok: envCheck.blockers.length === 0,
      status: envCheck.blockers.length === 0 ? 'skipped' : 'failed',
      checkedAt,
      mode: env.supabaseE2eSmokeMode,
      missingTables: [],
      missingRpcs: [],
      likelyMissingMigrations: [],
      warnings: ['Supabase E2E smoke mode is disabled; live migration status was not queried.', ...envCheck.warnings],
      blockers: envCheck.blockers,
    }
  }

  if (!envCheck.ok) {
    return {
      ok: false,
      status: 'failed',
      checkedAt,
      mode: env.supabaseE2eSmokeMode,
      missingTables: [],
      missingRpcs: [],
      likelyMissingMigrations: [],
      warnings: envCheck.warnings,
      blockers: envCheck.blockers,
    }
  }

  if (!client) {
    return {
      ok: false,
      status: 'failed',
      checkedAt,
      mode: env.supabaseE2eSmokeMode,
      missingTables: [],
      missingRpcs: [],
      likelyMissingMigrations: [],
      warnings: envCheck.warnings,
      blockers: ['Supabase admin client is unavailable; live migration status cannot be checked.'],
    }
  }

  const manifest = await readMigrationManifest(rootDir)
  const [tableStatus, rpcStatus] = await Promise.all([
    checkSupabaseTableReadiness(client),
    checkE2EServiceRoleRpcReadiness(client),
  ])
  const likelyMissingMigrations = mapMissingToMigrations(
    manifest.migrations,
    tableStatus.missingTables,
    rpcStatus.missingRpcs,
  )
  const warnings = [
    ...envCheck.warnings,
    ...tableStatus.warnings,
    ...rpcStatus.warnings,
  ]
  const blockers = [
    ...envCheck.blockers,
    ...(tableStatus.ok ? [] : ['One or more required Supabase tables are missing or unreadable.']),
    ...(rpcStatus.ok ? [] : ['One or more required E2E service-role RPCs are missing or unreadable.']),
  ]

  return {
    ok: blockers.length === 0,
    status: blockers.length === 0 ? 'passed' : 'failed',
    checkedAt,
    mode: env.supabaseE2eSmokeMode,
    missingTables: tableStatus.missingTables,
    missingRpcs: rpcStatus.missingRpcs,
    likelyMissingMigrations,
    warnings,
    blockers,
  }
}

function mapMissingToMigrations(
  migrations: MigrationManifestEntry[],
  missingTables: string[],
  missingRpcs: string[],
): LikelyMissingMigration[] {
  const missingTableSet = new Set(missingTables)
  const missingRpcSet = new Set(missingRpcs)

  return migrations
    .map((entry) => ({
      file: entry.file,
      purpose: entry.purpose,
      missingTables: entry.createsTables.filter((table) => missingTableSet.has(table)),
      missingRpcs: entry.createsRpcs.filter((rpc) => missingRpcSet.has(rpc)),
      remoteApplyRequiredFor: entry.remoteApplyRequiredFor,
      rollbackRisk: entry.rollbackRisk,
    }))
    .filter((entry) => entry.missingTables.length > 0 || entry.missingRpcs.length > 0)
}
