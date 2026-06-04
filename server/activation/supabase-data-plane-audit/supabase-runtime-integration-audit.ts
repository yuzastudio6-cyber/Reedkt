import { loadRuntimeEnv } from '../../config/env'
import { findLineMatches, listFilesUnder, readFile } from './supabase-repo-schema-resolver'
import type { SupabaseRuntimeIntegrationAudit } from './supabase-data-plane-audit-types'

export function buildSupabaseRuntimeIntegrationAudit(source: NodeJS.ProcessEnv = process.env): SupabaseRuntimeIntegrationAudit {
  const files = listFilesUnder(['server', 'src/backend'], ['.ts', '.tsx'])
  const tableReferenceMap = new Map<string, Set<string>>()
  for (const filePath of files) {
    const text = readFile(filePath)
    for (const match of text.matchAll(/\.from\(\s*['"`]([a-z0-9_]+)['"`]\s*\)/gi)) {
      const tableName = match[1]
      const entry = tableReferenceMap.get(tableName) ?? new Set<string>()
      entry.add(filePath)
      tableReferenceMap.set(tableName, entry)
    }
  }

  const apiRouteRequiresSupabase = listFilesUnder(['src/backend/api/routes'], ['.ts'])
    .map((routeFile) => ({
      routeFile,
      requiresSupabaseCount: (readFile(routeFile).match(/requiresSupabase:\s*true/g) ?? []).length,
    }))
    .filter((entry) => entry.requiresSupabaseCount > 0)

  const env = loadRuntimeEnv(source)
  const frontendPublicClient = readFile('src/backend/supabase/supabase-client.ts').includes('getSupabasePublicConfig') ? 'configured_by_vite_env' : 'not_found'
  const serverAdminClient = readFile('server/supabase/admin-client.ts').includes('SUPABASE_SERVICE_ROLE_KEY') || readFile('server/supabase/admin-client.ts').includes('supabaseServiceRoleKey')
    ? 'service_role_guarded'
    : 'not_found'
  const serverPublicClient = readFile('server/supabase/public-client.ts').includes('supabaseAnonKey') ? 'anon_guarded' : 'not_found'
  const whyLowOrNoActivity = [
    'Most current product flows are mock/static activation gates and explicitly avoid Supabase writes.',
    'Server runtime marks itself mock-only when service-role Supabase admin env is unavailable.',
    'Frontend Supabase client uses only public Vite URL/anon key and can stay not-configured in local/dev environments.',
    'Migrations are committed as local/review-ready SQL; repo docs do not show remote migration application.',
    'Worker/job/provider routes are contract/readiness layers unless future backend/service-role execution is enabled.',
  ]
  const blockers: string[] = []
  const warnings: string[] = []
  const frontendSecrets = findLineMatches(listFilesUnder(['src'], ['.ts', '.tsx']), [/SUPABASE_SERVICE_ROLE_KEY/])
    .filter((entry) => !entry.path.startsWith('src/server/'))
    .filter((entry) => !entry.path.endsWith('supabase-admin-placeholder.ts'))

  if (frontendPublicClient === 'not_found') blockers.push('Frontend Supabase anon client surface was not found.')
  if (serverAdminClient === 'not_found') blockers.push('Server Supabase admin client surface was not found.')
  if (frontendSecrets.length > 0) blockers.push('Frontend code references SUPABASE_SERVICE_ROLE_KEY.')
  if (tableReferenceMap.size === 0) warnings.push('No runtime Supabase table references were parsed from server/src backend files.')
  if (env.mockOnly) warnings.push('Current runtime env summary indicates mock-only behavior unless service-role Supabase env is configured.')

  return {
    frontendPublicClient,
    serverAdminClient,
    serverPublicClient,
    runtimeEnvSummary: {
      supabaseUrlConfigured: Boolean(env.supabaseUrl),
      supabaseAnonKeyConfigured: Boolean(env.supabaseAnonKey),
      supabaseServiceRoleConfigured: env.hasSupabaseAdmin,
      mockOnlyLikely: env.mockOnly,
    },
    tableReferences: Array.from(tableReferenceMap.entries())
      .map(([tableName, fileSet]) => ({ tableName, files: Array.from(fileSet).sort() }))
      .sort((a, b) => a.tableName.localeCompare(b.tableName)),
    apiRouteRequiresSupabase,
    whyLowOrNoActivity,
    blockers,
    warnings,
  }
}
