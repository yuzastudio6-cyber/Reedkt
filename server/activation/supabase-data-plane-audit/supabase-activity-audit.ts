import { createClient } from '@supabase/supabase-js'
import { supabaseDataPlaneAuditTables } from './supabase-data-plane-audit-policy'
import type { SupabaseActivityAudit } from './supabase-data-plane-audit-types'

export async function runSupabaseRemoteActivityAudit(source: NodeJS.ProcessEnv = process.env): Promise<SupabaseActivityAudit> {
  const supabaseUrl = source.SUPABASE_URL?.trim() || source.VITE_SUPABASE_URL?.trim()
  const serviceRole = source.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceRole) {
    return {
      status: 'blocked',
      credentialSource: 'unavailable',
      tablesChecked: [],
      rowPayloadStored: false,
      dbUrlPrinted: false,
      serviceRoleValuePrinted: false,
      blockers: ['Remote activity audit blocked: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not both available to the backend execution environment.'],
      warnings: ['Static repo audit still completed; remote activity evidence must be supplied in Phase 51B or a rerun with read-only audit credentials.'],
    }
  }

  const client = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const tablesChecked = []
  for (const tableName of supabaseDataPlaneAuditTables) {
    try {
      const { count, error } = await client.from(tableName).select('*', { count: 'exact', head: true })
      if (error) {
        tablesChecked.push({ tableName, count: null, status: 'blocked' as const, reason: sanitizeError(error.message) })
      } else {
        tablesChecked.push({ tableName, count: count ?? 0, status: 'counted' as const })
      }
    } catch (error) {
      tablesChecked.push({ tableName, count: null, status: 'blocked' as const, reason: sanitizeError(error instanceof Error ? error.message : String(error)) })
    }
  }
  const blocked = tablesChecked.filter((entry) => entry.status === 'blocked')
  return {
    status: blocked.length === tablesChecked.length ? 'blocked' : 'completed',
    attemptedAt: new Date().toISOString(),
    credentialSource: 'env_service_role',
    tablesChecked,
    rowPayloadStored: false,
    dbUrlPrinted: false,
    serviceRoleValuePrinted: false,
    blockers: blocked.length === tablesChecked.length ? ['Remote activity audit could not count any target table through Supabase REST.'] : [],
    warnings: blocked.map((entry) => `Remote count blocked for ${entry.tableName}: ${entry.reason ?? 'unknown reason'}`),
  }
}

export function buildPlannedSupabaseRemoteActivityAudit(): SupabaseActivityAudit {
  return {
    status: 'not_attempted',
    credentialSource: 'unavailable',
    tablesChecked: [],
    rowPayloadStored: false,
    dbUrlPrinted: false,
    serviceRoleValuePrinted: false,
    blockers: ['Remote activity audit is not attempted in static report mode.'],
    warnings: ['Run Phase 51A with REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT=true and backend Supabase credentials to collect count-only remote activity evidence.'],
  }
}

function sanitizeError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/eyJ[a-zA-Z0-9._-]+/g, '<redacted-token>')
    .slice(0, 240)
}
