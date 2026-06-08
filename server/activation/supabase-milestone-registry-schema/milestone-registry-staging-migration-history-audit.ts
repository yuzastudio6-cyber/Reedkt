import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH,
} from './index'
import {
  SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
} from './milestone-registry-supabase-plugin-deploy-plan'

export const SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION =
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT'

export const SUPABASE_STAGING_MIGRATION_HISTORY_REPORTS = [
  'staging_migration_history_audit_report.json',
  'staging_local_remote_migration_comparison_report.json',
  'staging_migration_deploy_strategy_after_history_audit.json',
  'staging_schema_dry_run_after_history_audit_report.json',
  'staging_schema_deploy_after_history_audit_report.json',
  'staging_schema_verify_after_history_audit_report.json',
] as const

export type SupabaseMigrationHistoryBlocker =
  | 'staging_migration_history_audit_not_confirmed'
  | 'staging_migration_history_list_failed'
  | 'blocked_pending_migration_history_repair_approval'
  | 'blocked_pending_manual_review'
  | 'staging_dry_run_contains_unapproved_migrations'
  | 'staging_history_claims_applied_but_schema_missing'
  | 'staging_schema_dry_run_failed'
  | 'staging_schema_deploy_not_run'
  | 'staging_schema_verification_not_run'

export type SupabaseMigrationDeployStrategy =
  | 'full_repo_migrations_dry_run'
  | 'temp_context_with_history_stub'
  | 'include_all_dry_run_only'
  | 'blocked_pending_migration_history_repair_approval'
  | 'blocked_pending_manual_review'

export interface SanitizedCommandReport {
  status: 'passed' | 'blocked' | 'skipped' | 'planned'
  exitCode: number | null
  command: string
  args: string[]
  cwd: string
  stdoutSummary: {
    byteLength: number
    lineCount: number
    secretPatternDetected: boolean
  }
  stderrSummary: {
    byteLength: number
    lineCount: number
    secretPatternDetected: boolean
  }
  outputContainsExpectedMigrationId?: boolean
  outputMigrationIds?: string[]
  errorCategory?: string
}

export interface ParsedMigrationHistory {
  jsonParsed: boolean
  parseMode: 'json' | 'text' | 'none'
  localIdsFromCli: string[]
  remoteIds: string[]
}

export interface LocalMigrationInventory {
  migrationDir: string
  migrationFiles: string[]
  localIds: string[]
  targetMigrationId: string
  targetMigrationFile: string
  targetMigrationExists: boolean
}

export function buildLocalMigrationInventory(
  migrationDir = path.join('supabase', 'migrations'),
): LocalMigrationInventory {
  const migrationFiles = existsSync(migrationDir)
    ? readdirSync(migrationDir).filter((file) => /^\d{12}_.+\.sql$/.test(file)).sort()
    : []
  return {
    migrationDir,
    migrationFiles,
    localIds: migrationFiles.map((file) => file.slice(0, 12)),
    targetMigrationId: SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID,
    targetMigrationFile: path.basename(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH),
    targetMigrationExists: existsSync(SUPABASE_MILESTONE_REGISTRY_MIGRATION_PATH),
  }
}

export function parseSupabaseMigrationListOutput(stdout: string): ParsedMigrationHistory {
  const localIds = new Set<string>()
  const remoteIds = new Set<string>()
  try {
    const parsed = JSON.parse(stdout || '{}') as unknown
    collectMigrationIdsFromJson(parsed, localIds, remoteIds)
    return {
      jsonParsed: true,
      parseMode: 'json',
      localIdsFromCli: [...localIds].sort(),
      remoteIds: [...remoteIds].sort(),
    }
  } catch {
    parseMigrationListText(stdout, localIds, remoteIds)
    return {
      jsonParsed: false,
      parseMode: localIds.size > 0 || remoteIds.size > 0 ? 'text' : 'none',
      localIdsFromCli: [...localIds].sort(),
      remoteIds: [...remoteIds].sort(),
    }
  }
}

export function extractMigrationIds(output: string): string[] {
  return [...new Set([...output.matchAll(/\b(20\d{10})\b/g)].map((match) => match[1]))].sort()
}

export function buildMigrationHistoryAuditReport(input: {
  phase: string
  runId: string
  command: SanitizedCommandReport
  parsedHistory: ParsedMigrationHistory
  localInventory: LocalMigrationInventory
  confirmationPresent: boolean
}) {
  const blockers: SupabaseMigrationHistoryBlocker[] = []
  if (!input.confirmationPresent) blockers.push('staging_migration_history_audit_not_confirmed')
  if (input.command.status !== 'passed' || input.parsedHistory.remoteIds.length === 0) {
    blockers.push('staging_migration_history_list_failed')
  }
  return {
    phase: input.phase,
    runId: input.runId,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    auditMode: 'supabase_migration_list_db_url_redacted',
    confirmationRequired: SUPABASE_STAGING_MIGRATION_HISTORY_AUDIT_CONFIRMATION,
    confirmationPresent: input.confirmationPresent,
    command: input.command,
    jsonParsed: input.parsedHistory.jsonParsed,
    parseMode: input.parsedHistory.parseMode,
    localMigrationCount: input.localInventory.localIds.length,
    remoteMigrationCount: input.parsedHistory.remoteIds.length,
    targetMigrationId: input.localInventory.targetMigrationId,
    targetMigrationFile: input.localInventory.targetMigrationFile,
    targetMigrationExists: input.localInventory.targetMigrationExists,
    targetMigrationRemoteApplied: input.parsedHistory.remoteIds.includes(input.localInventory.targetMigrationId),
    remoteHistoryListed: input.command.status === 'passed',
    secretPayloadsPrinted: false,
    dbUrlPrinted: false,
    productionAffected: false,
    directManualSqlRun: false,
    migrationRepairRun: false,
    blockers,
  }
}

export function buildLocalRemoteMigrationComparisonReport(input: {
  phase: string
  runId: string
  localInventory: LocalMigrationInventory
  parsedHistory: ParsedMigrationHistory
  auditStatus: string
}) {
  const localIds = new Set(input.localInventory.localIds)
  const remoteIds = new Set(input.parsedHistory.remoteIds)
  const target = input.localInventory.targetMigrationId
  const remoteUnknownMigrationIds = [...remoteIds].filter((id) => !localIds.has(id)).sort()
  const missingRemoteLocalIds = [...localIds].filter((id) => !remoteIds.has(id)).sort()
  const olderLocalMigrationsAbsentRemotely = missingRemoteLocalIds.filter((id) => id < target)
  const targetMigrationPending = input.localInventory.targetMigrationExists && !remoteIds.has(target)
  const targetMigrationRemoteApplied = remoteIds.has(target)
  const blockers: SupabaseMigrationHistoryBlocker[] = []
  if (input.auditStatus !== 'passed') blockers.push('staging_migration_history_list_failed')
  if (remoteUnknownMigrationIds.length > 0) blockers.push('blocked_pending_migration_history_repair_approval')

  return {
    phase: input.phase,
    runId: input.runId,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    targetMigrationId: target,
    targetMigrationFile: input.localInventory.targetMigrationFile,
    targetMigrationPending,
    targetMigrationRemoteApplied,
    localMigrationIds: input.localInventory.localIds,
    remoteMigrationIds: input.parsedHistory.remoteIds,
    remoteUnknownMigrationIds,
    localIdsMissingRemotely: missingRemoteLocalIds,
    olderLocalMigrationsAbsentRemotely,
    olderLocalMigrationsAbsentRemotelyCount: olderLocalMigrationsAbsentRemotely.length,
    remoteHasUnknownMigrations: remoteUnknownMigrationIds.length > 0,
    remoteHistoryListed: input.auditStatus === 'passed',
    secretPayloadsPrinted: false,
    dbUrlPrinted: false,
    productionAffected: false,
    directManualSqlRun: false,
    migrationRepairRun: false,
    blockers,
  }
}

export function buildDeployStrategyAfterHistoryAuditReport(input: {
  phase: string
  runId: string
  comparisonReport: Record<string, unknown>
  dryRunReport?: Record<string, unknown>
}) {
  const comparison = input.comparisonReport as {
    status?: string
    targetMigrationPending?: boolean
    targetMigrationRemoteApplied?: boolean
    remoteUnknownMigrationIds?: string[]
    olderLocalMigrationsAbsentRemotely?: string[]
    blockers?: SupabaseMigrationHistoryBlocker[]
  }
  const dryRun = input.dryRunReport as {
    status?: string
    approvedMigrationIds?: string[]
    unapprovedMigrationIds?: string[]
    dryRunPerformed?: boolean
    blockers?: SupabaseMigrationHistoryBlocker[]
  } | undefined
  const blockers = new Set<SupabaseMigrationHistoryBlocker>(comparison.blockers ?? [])
  let selectedStrategy: SupabaseMigrationDeployStrategy
  let deployAllowed = false
  let deployNeeded = false
  let verifyOnly = false
  let reason: string

  if ((comparison.remoteUnknownMigrationIds ?? []).length > 0) {
    selectedStrategy = 'blocked_pending_migration_history_repair_approval'
    blockers.add('blocked_pending_migration_history_repair_approval')
    reason = 'remote_history_contains_migration_ids_absent_from_local_repo'
  } else if (comparison.targetMigrationRemoteApplied === true) {
    selectedStrategy = 'full_repo_migrations_dry_run'
    deployAllowed = false
    deployNeeded = false
    verifyOnly = true
    reason = 'target_migration_already_remote_applied_verify_only'
  } else if (comparison.targetMigrationPending === true && dryRun?.status === 'passed') {
    selectedStrategy = 'full_repo_migrations_dry_run'
    deployAllowed = true
    deployNeeded = true
    reason = 'full_repo_dry_run_approved_exact_target_migration'
  } else if (comparison.targetMigrationPending === true && dryRun?.dryRunPerformed === true) {
    selectedStrategy = 'blocked_pending_manual_review'
    for (const blocker of dryRun.blockers ?? []) blockers.add(blocker)
    if ((dryRun.unapprovedMigrationIds ?? []).length > 0) blockers.add('staging_dry_run_contains_unapproved_migrations')
    reason = 'full_repo_dry_run_did_not_prove_exact_reviewed_migration_set'
  } else if (comparison.status !== 'passed') {
    selectedStrategy = 'blocked_pending_migration_history_repair_approval'
    blockers.add('staging_migration_history_list_failed')
    reason = 'migration_history_audit_or_comparison_blocked'
  } else {
    selectedStrategy = 'blocked_pending_manual_review'
    blockers.add('blocked_pending_manual_review')
    reason = 'migration_history_state_needs_manual_review'
  }

  return {
    phase: input.phase,
    runId: input.runId,
    status: deployAllowed || verifyOnly ? 'passed' : 'blocked',
    selectedStrategy,
    deployAllowed,
    deployNeeded,
    verifyOnly,
    reason,
    allowedStrategies: [
      'full_repo_migrations_dry_run',
      'temp_context_with_history_stub',
      'include_all_dry_run_only',
      'blocked_pending_migration_history_repair_approval',
      'blocked_pending_manual_review',
    ],
    tempContextWithHistoryStubUsed: false,
    includeAllDryRunOnly: false,
    includeAllApplyAllowed: false,
    migrationRepairAllowed: false,
    migrationRepairRun: false,
    directManualSqlAllowed: false,
    trackBRowsWritten: false,
    productionAffected: false,
    blockers: [...blockers],
  }
}

export function buildDryRunAfterHistoryAuditReport(input: {
  phase: string
  runId: string
  command: SanitizedCommandReport | null
  comparisonReport: Record<string, unknown>
}) {
  const comparison = input.comparisonReport as {
    status?: string
    targetMigrationId?: string
    targetMigrationPending?: boolean
    targetMigrationRemoteApplied?: boolean
    remoteUnknownMigrationIds?: string[]
    olderLocalMigrationsAbsentRemotely?: string[]
    blockers?: SupabaseMigrationHistoryBlocker[]
  }
  const target = String(comparison.targetMigrationId ?? SUPABASE_PLUGIN_STAGING_DEPLOY_MIGRATION_ID)
  if (comparison.targetMigrationRemoteApplied === true) {
    return {
      phase: input.phase,
      runId: input.runId,
      status: 'passed',
      dryRunPerformed: false,
      reason: 'target_migration_already_remote_applied_verify_only',
      approvedMigrationIds: [],
      unapprovedMigrationIds: [],
      targetMigrationId: target,
      deployAllowedByDryRun: false,
      verifyOnly: true,
      credentialPayloadsPrinted: false,
      dbUrlPrinted: false,
      directManualSqlRun: false,
      migrationRepairRun: false,
      blockers: [],
    }
  }
  if (!input.command) {
    const blockers = new Set<SupabaseMigrationHistoryBlocker>(comparison.blockers ?? [])
    blockers.add(comparison.status === 'passed' ? 'staging_schema_dry_run_failed' : 'staging_migration_history_list_failed')
    return {
      phase: input.phase,
      runId: input.runId,
      status: 'blocked',
      dryRunPerformed: false,
      reason: 'dry_run_not_run_because_history_audit_blocked',
      approvedMigrationIds: [],
      unapprovedMigrationIds: [],
      targetMigrationId: target,
      deployAllowedByDryRun: false,
      credentialPayloadsPrinted: false,
      dbUrlPrinted: false,
      directManualSqlRun: false,
      migrationRepairRun: false,
      blockers: [...blockers],
    }
  }

  const outputMigrationIds = input.command.outputMigrationIds ?? []
  const approvedMigrationIds = outputMigrationIds.filter((id) => id === target)
  const unapprovedMigrationIds = outputMigrationIds.filter((id) => id !== target)
  const blockers = new Set<SupabaseMigrationHistoryBlocker>()
  if (input.command.status !== 'passed') blockers.add('staging_schema_dry_run_failed')
  if (
    input.command.status !== 'passed' &&
    (comparison.olderLocalMigrationsAbsentRemotely ?? []).length > 0
  ) {
    blockers.add('blocked_pending_migration_history_repair_approval')
  }
  if (unapprovedMigrationIds.length > 0) blockers.add('staging_dry_run_contains_unapproved_migrations')
  if (input.command.status === 'passed' && comparison.targetMigrationPending === true && approvedMigrationIds.length === 0) {
    blockers.add('staging_history_claims_applied_but_schema_missing')
  }

  return {
    phase: input.phase,
    runId: input.runId,
    status: blockers.size === 0 && approvedMigrationIds.length === 1 ? 'passed' : 'blocked',
    dryRunPerformed: true,
    command: input.command,
    targetMigrationId: target,
    olderLocalMigrationsAbsentRemotely: comparison.olderLocalMigrationsAbsentRemotely ?? [],
    olderLocalMigrationsAbsentRemotelyCount: (comparison.olderLocalMigrationsAbsentRemotely ?? []).length,
    approvedMigrationIds,
    unapprovedMigrationIds,
    dryRunOutputMigrationIds: outputMigrationIds,
    deployAllowedByDryRun: blockers.size === 0 && approvedMigrationIds.length === 1,
    verifyOnly: false,
    credentialPayloadsPrinted: false,
    dbUrlPrinted: false,
    directManualSqlRun: false,
    migrationRepairRun: false,
    blockers: [...blockers],
  }
}

function collectMigrationIdsFromJson(value: unknown, localIds: Set<string>, remoteIds: Set<string>, context = '') {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMigrationIdsFromJson(item, localIds, remoteIds, context))
    return
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const ids = extractMigrationIds(String(value))
    if (/remote/i.test(context)) ids.forEach((id) => remoteIds.add(id))
    if (/local/i.test(context)) ids.forEach((id) => localIds.add(id))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextContext = `${context}.${key}`
    if (/remote/i.test(key)) {
      extractMigrationIds(JSON.stringify(nested)).forEach((id) => remoteIds.add(id))
    }
    if (/local/i.test(key)) {
      extractMigrationIds(JSON.stringify(nested)).forEach((id) => localIds.add(id))
    }
    collectMigrationIdsFromJson(nested, localIds, remoteIds, nextContext)
  }
}

function parseMigrationListText(stdout: string, localIds: Set<string>, remoteIds: Set<string>) {
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.includes('|')) continue
    const columns = line.split('|').map((part) => part.trim())
    const local = columns[0]?.match(/\b(20\d{10})\b/)?.[1]
    const remote = columns[1]?.match(/\b(20\d{10})\b/)?.[1]
    if (local) localIds.add(local)
    if (remote) remoteIds.add(remote)
  }
}
