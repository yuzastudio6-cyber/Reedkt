import type { RuntimeEnv } from '../config/env'

export interface SupabaseLiveEnvCheckResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  mode: string
  checks: Record<string, boolean>
  warnings: string[]
  blockers: string[]
}

export function checkSupabaseLiveEnv(env: RuntimeEnv, source: NodeJS.ProcessEnv = process.env): SupabaseLiveEnvCheckResult {
  const warnings: string[] = []
  const blockers: string[] = []
  const checks = {
    smokeModeConfigured: env.supabaseE2eSmokeMode === 'disabled' || env.supabaseE2eSmokeMode === 'live',
    liveMode: env.supabaseE2eSmokeMode === 'live',
    supabaseUrlConfigured: Boolean(env.supabaseUrl),
    supabaseAnonKeyConfigured: Boolean(env.supabaseAnonKey),
    supabaseServiceRoleConfigured: Boolean(env.supabaseServiceRoleKey),
    serviceRoleIsServerOnly: !hasViteServiceRole(source),
    writesExplicitlyAllowed: env.supabaseE2eAllowWrites,
    smokeUserConfigured: Boolean(env.supabaseE2eUserId),
    cleanupEnabled: env.supabaseE2eCleanup,
  }

  if (!checks.serviceRoleIsServerOnly) blockers.push('Do not configure service-role credentials in any VITE_* environment variable.')
  if (!checks.cleanupEnabled) warnings.push('SUPABASE_E2E_CLEANUP=false; live smoke records will remain for manual inspection.')

  if (env.supabaseE2eSmokeMode !== 'live') {
    return {
      ok: blockers.length === 0,
      status: blockers.length === 0 ? 'skipped' : 'failed',
      mode: env.supabaseE2eSmokeMode,
      checks,
      warnings: ['Supabase E2E smoke mode is disabled; no live Supabase validation was attempted.', ...warnings],
      blockers,
    }
  }

  if (!checks.supabaseUrlConfigured) blockers.push('SUPABASE_URL is required in live mode.')
  if (!checks.supabaseAnonKeyConfigured) warnings.push('SUPABASE_ANON_KEY is recommended for route auth validation in live mode.')
  if (!checks.supabaseServiceRoleConfigured) blockers.push('SUPABASE_SERVICE_ROLE_KEY is required in live mode.')
  if (checks.writesExplicitlyAllowed && !checks.smokeUserConfigured) {
    blockers.push('SUPABASE_E2E_USER_ID must reference an existing safe staging auth user when live writes are enabled.')
  }
  if (!checks.writesExplicitlyAllowed) warnings.push('Live mode is configured, but SUPABASE_E2E_ALLOW_WRITES is not true; write smokes will remain blocked.')

  return {
    ok: blockers.length === 0,
    status: blockers.length === 0 ? 'passed' : 'failed',
    mode: env.supabaseE2eSmokeMode,
    checks,
    warnings,
    blockers,
  }
}

function hasViteServiceRole(source: NodeJS.ProcessEnv): boolean {
  return Object.keys(source).some((key) => /^VITE_.*SERVICE.*ROLE/i.test(key) && Boolean(source[key]?.trim()))
}
