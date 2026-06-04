import { findLineMatches, listFilesUnder } from './supabase-repo-schema-resolver'
import type { SupabaseEnvSecretAudit } from './supabase-data-plane-audit-types'

const ENV_KEYS: SupabaseEnvSecretAudit['envKeys'] = [
  { key: 'GCP_PROJECT_ID', configured: false, classification: 'gcp_context', mayPrintValue: false },
  { key: 'GCP_REGION', configured: false, classification: 'gcp_context', mayPrintValue: false },
  { key: 'REEDITPRO_ENV', configured: false, classification: 'gcp_context', mayPrintValue: false },
  { key: 'REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT', configured: false, classification: 'confirmation', mayPrintValue: false },
  { key: 'SUPABASE_URL', configured: false, classification: 'server_secret', mayPrintValue: false },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', configured: false, classification: 'server_secret', mayPrintValue: false },
  { key: 'SUPABASE_ANON_KEY', configured: false, classification: 'public_anon', mayPrintValue: false },
  { key: 'VITE_SUPABASE_URL', configured: false, classification: 'public_anon', mayPrintValue: false },
  { key: 'VITE_SUPABASE_ANON_KEY', configured: false, classification: 'public_anon', mayPrintValue: false },
  { key: 'SUPABASE_DB_URL', configured: false, classification: 'db_url', mayPrintValue: false },
  { key: 'SUPABASE_PROJECT_REF', configured: false, classification: 'project_ref', mayPrintValue: false },
]

export function buildSupabaseEnvSecretAudit(
  source: NodeJS.ProcessEnv = process.env,
  options: { secretManagerCredentialReady?: boolean } = {},
): SupabaseEnvSecretAudit {
  const srcFiles = listFilesUnder(['src', 'server'], ['.ts', '.tsx'])
  const frontendFiles = srcFiles.filter((file) => file.startsWith('src/') && !file.startsWith('src/server/'))
  const serverFiles = srcFiles.filter((file) => file.startsWith('server/'))
  const frontendServiceRoleReferences = findLineMatches(frontendFiles, [/SUPABASE_SERVICE_ROLE_KEY/])
    .filter((entry) => !entry.path.endsWith('supabase-admin-placeholder.ts'))
  const serverServiceRoleReferences = findLineMatches(serverFiles, [/SUPABASE_SERVICE_ROLE_KEY/, /service[_-]?role/i])
  const envKeys = ENV_KEYS.map((entry) => ({ ...entry, configured: Boolean(source[entry.key]?.trim()) }))
  const hasUrl = Boolean(source.SUPABASE_URL?.trim() || source.VITE_SUPABASE_URL?.trim())
  const hasServiceRole = Boolean(source.SUPABASE_SERVICE_ROLE_KEY?.trim())
  const remoteCredentialReady = (hasUrl && hasServiceRole) || options.secretManagerCredentialReady === true
  const blockers: string[] = []
  const warnings: string[] = []

  if (frontendServiceRoleReferences.length > 0) blockers.push('Frontend code references service-role material outside the explicit admin placeholder.')
  if (!remoteCredentialReady) warnings.push('Remote activity audit cannot run unless SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available to the backend execution environment or Google Secret Manager.')
  if (!hasUrl && !hasServiceRole && options.secretManagerCredentialReady) warnings.push('Supabase audit credentials are available through backend-only Google Secret Manager, not process env.')
  if (source.SUPABASE_DB_URL?.trim()) warnings.push('SUPABASE_DB_URL is configured but Phase 51A does not print or use DB URLs for mutation or lifecycle commands.')

  return {
    envKeys,
    frontendServiceRoleReferences,
    serverServiceRoleReferences,
    secretValueExposureDetected: frontendServiceRoleReferences.length > 0,
    remoteAuditCredentialReady: remoteCredentialReady,
    remoteAuditCredentialBlocker: remoteCredentialReady ? undefined : 'Missing backend read-only audit credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    blockers,
    warnings,
  }
}
