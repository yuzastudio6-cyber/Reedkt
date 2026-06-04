import { readFile } from './supabase-repo-schema-resolver'
import type { SupabaseMigrationAudit, SupabaseMigrationTableRecord } from './supabase-data-plane-audit-types'

const CATEGORY_TABLES = [
  { category: 'user_project_persistence', tables: ['user_profiles', 'workspaces', 'workspace_members', 'projects', 'chat_sessions', 'chat_messages'] },
  { category: 'approved_plan_snapshots', tables: ['approved_plan_snapshots', 'approval_records', 'credit_approvals'] },
  { category: 'jobs_workers', tables: ['jobs', 'job_events', 'worker_job_claims', 'worker_leases', 'job_claim_attempts'] },
  { category: 'artifacts_storage', tables: ['media_assets', 'generated_assets', 'storage_object_records', 'upload_intents'] },
  { category: 'signed_url_audit', tables: ['signed_url_events'] },
  { category: 'providers_tools', tables: ['tool_runtime_checks', 'provider_request_attempts', 'provider_webhook_events'] },
] as const

export function buildSupabaseMigrationAudit(migrationFiles: string[]): SupabaseMigrationAudit {
  const createdTables: SupabaseMigrationTableRecord[] = []
  const enabledRlsTables = new Set<string>()
  const policyTables = new Set<string>()
  const serviceRoleGrantTables = new Set<string>()
  const functionNames = new Set<string>()
  const storagePolicyMentions = new Set<string>()
  const signedUrlTables = new Set<string>()
  let policyCount = 0

  for (const migrationFile of migrationFiles) {
    const text = readFile(migrationFile)
    for (const match of text.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)\s*\(([\s\S]*?)\n\);/gi)) {
      const tableName = match[1]
      const body = match[2] ?? ''
      createdTables.push({
        tableName,
        migrationFile,
        hasPrimaryKey: /\bprimary\s+key\b/i.test(body),
        hasWorkspaceId: /\bworkspace_id\b/i.test(body),
        hasUserId: /\buser_id\b/i.test(body) || /\bowner_id\b/i.test(body),
        hasCreatedAt: /\bcreated_at\b/i.test(body),
        hasUpdatedAt: /\bupdated_at\b/i.test(body),
      })
      if (/signed_url/i.test(tableName)) signedUrlTables.add(tableName)
    }
    for (const match of text.matchAll(/alter\s+table\s+(?:only\s+)?public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) enabledRlsTables.add(match[1])
    for (const match of text.matchAll(/create\s+policy\s+["']?([^"'\n]+)["']?\s+on\s+public\.([a-z0-9_]+)/gi)) {
      policyTables.add(match[2])
      policyCount += 1
    }
    for (const block of text.matchAll(/foreach\s+table_name\s+in\s+array\s+array\[(?<tables>[\s\S]*?)\]\s+loop(?<body>[\s\S]*?)end\s+loop/gi)) {
      const tables = Array.from((block.groups?.tables ?? '').matchAll(/'([a-z0-9_]+)'/gi)).map((match) => match[1])
      const body = block.groups?.body ?? ''
      if (/enable\s+row\s+level\s+security/i.test(body)) {
        for (const table of tables) enabledRlsTables.add(table)
      }
      if (/create\s+policy/i.test(body)) {
        for (const table of tables) policyTables.add(table)
        policyCount += tables.length
      }
    }
    for (const match of text.matchAll(/grant\s+[\s\S]*?\s+on\s+(?:table\s+)?public\.([a-z0-9_]+)\s+to\s+service_role/gi)) serviceRoleGrantTables.add(match[1])
    for (const match of text.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)/gi)) functionNames.add(match[1])
    if (/storage\.objects|storage\.buckets|bucket_id|signed url|signed_url/i.test(text)) storagePolicyMentions.add(migrationFile)
  }

  const createdNames = new Set(createdTables.map((table) => table.tableName))
  const categoriesCovered = CATEGORY_TABLES.map((entry) => ({
    category: entry.category,
    tables: entry.tables.filter((table) => createdNames.has(table)),
    covered: entry.tables.some((table) => createdNames.has(table)),
  }))
  const blockers: string[] = []
  const warnings: string[] = []

  if (migrationFiles.length === 0) blockers.push('No migration files found.')
  if (createdTables.length === 0) blockers.push('No public tables were parsed from migrations.')
  if (!categoriesCovered.every((entry) => entry.covered)) blockers.push('One or more required beta data-plane categories has no migration table coverage.')
  warnings.push('Repo migration evidence is local/review-ready only; Phase 51A does not prove remote application.')

  return {
    migrationFileCount: migrationFiles.length,
    createdTables,
    enabledRlsTables: Array.from(enabledRlsTables).sort(),
    policyTables: Array.from(policyTables).sort(),
    policyCount,
    serviceRoleGrantTables: Array.from(serviceRoleGrantTables).sort(),
    functionNames: Array.from(functionNames).sort(),
    storagePolicyMentions: Array.from(storagePolicyMentions).sort(),
    signedUrlTables: Array.from(signedUrlTables).sort(),
    remoteMigrationExecutionRecorded: false,
    categoriesCovered,
    blockers,
    warnings,
  }
}
