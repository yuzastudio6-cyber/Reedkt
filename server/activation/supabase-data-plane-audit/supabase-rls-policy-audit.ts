import type { SupabaseMigrationAudit, SupabaseRlsPolicyAudit } from './supabase-data-plane-audit-types'

export function buildSupabaseRlsPolicyAudit(migrationAudit: SupabaseMigrationAudit): SupabaseRlsPolicyAudit {
  const createdTables = migrationAudit.createdTables.map((table) => table.tableName)
  const enabled = new Set(migrationAudit.enabledRlsTables)
  const policyTables = new Set(migrationAudit.policyTables)
  const missingRlsTables = createdTables.filter((table) => !enabled.has(table)).sort()
  const missingPolicyTables = createdTables.filter((table) => !policyTables.has(table)).sort()
  const serviceRoleOnlyTables = createdTables
    .filter((table) => migrationAudit.serviceRoleGrantTables.includes(table) && !policyTables.has(table))
    .sort()
  const blockers: string[] = []
  const warnings: string[] = []

  if (missingRlsTables.length > 0) blockers.push(`${missingRlsTables.length} parsed tables do not have explicit row level security enablement in migrations.`)
  if (missingPolicyTables.length > 0) warnings.push(`${missingPolicyTables.length} parsed tables do not have parsed create policy statements; some may be service-role-only or policy syntax may need manual review.`)
  if (!migrationAudit.storagePolicyMentions.length) blockers.push('No storage or signed URL policy migration evidence was found.')
  if (!migrationAudit.signedUrlTables.includes('signed_url_events')) blockers.push('signed_url_events audit table was not parsed from migrations.')

  return {
    rlsEnabledTableCount: migrationAudit.enabledRlsTables.length,
    policyTableCount: migrationAudit.policyTables.length,
    missingRlsTables,
    missingPolicyTables,
    serviceRoleOnlyTables,
    signedUrlValueStorageBlocked: true,
    storagePoliciesPresent: migrationAudit.storagePolicyMentions.length > 0,
    blockers,
    warnings,
  }
}
