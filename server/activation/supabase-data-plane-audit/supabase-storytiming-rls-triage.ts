import { readFile } from './supabase-repo-schema-resolver'
import type { SupabaseMigrationAudit, SupabaseStoryTimingRlsTriage, SupabaseStoryTimingRlsTriageRecord } from './supabase-data-plane-audit-types'

const STORYTIMING_MIGRATION_FILE = 'supabase/migrations/202605190002_storytiming_master_tables.sql'
const STORYTIMING_TABLES = [
  'master_timing_maps',
  'story_timing_segments',
  'timing_anchors',
  'timing_events',
  'timing_dependencies',
  'timing_conflicts',
  'timing_conflict_resolutions',
  'story_timing_qa_checks',
  'render_timing_manifests',
  'render_timing_manifest_tracks',
  'render_timing_manifest_events',
] as const

export function buildSupabaseStoryTimingRlsTriage(migrationAudit: SupabaseMigrationAudit): SupabaseStoryTimingRlsTriage {
  const migrationText = readFile(STORYTIMING_MIGRATION_FILE)
  const blockers: string[] = []
  const warnings: string[] = []
  if (!migrationText) blockers.push('StoryTiming migration file was not found for RLS triage.')

  const dynamicBlockTables = findDynamicStoryTimingRlsTables(migrationText)
  const dynamicPolicyTables = findDynamicStoryTimingPolicyTables(migrationText)
  const enabled = new Set(migrationAudit.enabledRlsTables)
  const policyTables = new Set(migrationAudit.policyTables)
  const records: SupabaseStoryTimingRlsTriageRecord[] = STORYTIMING_TABLES.map((tableName) => {
    const tableBody = extractCreateTableBody(migrationText, tableName)
    const ownershipColumns = {
      workspaceId: /\bworkspace_id\b/i.test(tableBody),
      projectId: /\bproject_id\b/i.test(tableBody),
      userId: /\buser_id\b/i.test(tableBody) || /\bapproved_by_user_id\b/i.test(tableBody),
      orgId: /\borg_id\b/i.test(tableBody),
    }
    const literalEnableStatement = new RegExp(`alter\\s+table\\s+(?:only\\s+)?public\\.${tableName}\\s+enable\\s+row\\s+level\\s+security`, 'i').test(migrationText)
    const dynamicDoBlockEnable = dynamicBlockTables.has(tableName)
    const dynamicPolicyBlock = dynamicPolicyTables.has(tableName)
    const policyDirectionFound = dynamicPolicyBlock || policyTables.has(tableName)
    const rlsCleared = literalEnableStatement || dynamicDoBlockEnable || enabled.has(tableName)
    const classification = rlsCleared && policyDirectionFound ? 'false_positive' : ownershipColumns.workspaceId || ownershipColumns.projectId ? 'P0_beta_blocker' : 'requires_human_admin_review'
    return {
      tableName,
      migrationFile: STORYTIMING_MIGRATION_FILE,
      flaggedReason: 'Initial Phase 51A regex only recognized literal ALTER TABLE statements and missed dynamic StoryTiming RLS statements inside a DO block.',
      schemaExposure: 'public_schema_private_project_data',
      storesUserProjectData: ownershipColumns.workspaceId || ownershipColumns.projectId || ownershipColumns.userId,
      ownershipColumns,
      rlsEvidence: {
        literalEnableStatement,
        dynamicDoBlockEnable,
        dynamicPolicyBlock,
        policyDirectionFound,
      },
      classification,
      phase51BMigrationNeeded: false,
      phase51CMigrationNeeded: classification !== 'false_positive',
      suggestedPolicyDirection: policyDirectionFound
        ? 'Keep workspace-member select, owner/admin/editor insert/update, no normal-user delete, and service-role worker/backend writes; add a Phase 51C remote RLS smoke if runtime evidence remains incomplete.'
        : 'Add explicit StoryTiming RLS policies in a Phase 51C hardening migration after local/staging review.',
    }
  })

  const p0BetaBlockerCount = records.filter((record) => record.classification === 'P0_beta_blocker').length
  const falsePositiveCount = records.filter((record) => record.classification === 'false_positive').length
  if (p0BetaBlockerCount > 0) blockers.push(`${p0BetaBlockerCount} StoryTiming tables still lack clear RLS evidence after dynamic SQL triage.`)
  if (falsePositiveCount === records.length) warnings.push('StoryTiming RLS gap is classified as a static parser false positive; committed dynamic SQL enables RLS and policies for the 11 tables.')

  return {
    status: blockers.length === 0 ? 'completed' : 'blocked',
    migrationFile: STORYTIMING_MIGRATION_FILE,
    flaggedTableCount: records.length,
    falsePositiveCount,
    p0BetaBlockerCount,
    records,
    blockers,
    warnings,
  }
}

function findDynamicStoryTimingRlsTables(migrationText: string): Set<string> {
  const tables = new Set<string>()
  for (const block of migrationText.matchAll(/foreach\s+table_name\s+in\s+array\s+array\[(?<tables>[\s\S]*?)\]\s+loop(?<body>[\s\S]*?)end\s+loop/gi)) {
    const body = block.groups?.body ?? ''
    if (!/enable\s+row\s+level\s+security/i.test(body)) continue
    for (const match of (block.groups?.tables ?? '').matchAll(/'([a-z0-9_]+)'/gi)) tables.add(match[1])
  }
  return tables
}

function findDynamicStoryTimingPolicyTables(migrationText: string): Set<string> {
  const tables = new Set<string>()
  for (const block of migrationText.matchAll(/foreach\s+table_name\s+in\s+array\s+array\[(?<tables>[\s\S]*?)\]\s+loop(?<body>[\s\S]*?)end\s+loop/gi)) {
    const body = block.groups?.body ?? ''
    if (!/create\s+policy/i.test(body)) continue
    for (const match of (block.groups?.tables ?? '').matchAll(/'([a-z0-9_]+)'/gi)) tables.add(match[1])
  }
  return tables
}

function extractCreateTableBody(migrationText: string, tableName: string): string {
  const match = new RegExp(`create\\s+table\\s+public\\.${tableName}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i').exec(migrationText)
  return match?.[1] ?? ''
}
