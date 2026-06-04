import { existsSync, readFileSync } from 'node:fs'
import { buildPlannedSupabaseRemoteActivityAudit } from './supabase-activity-audit'
import { buildSupabaseBetaReadinessImpact } from './supabase-beta-readiness-impact'
import { buildSupabaseDataModelGapAnalysis } from './supabase-data-model-gap-analysis'
import { buildSupabaseDataPlaneCommandPlan } from './supabase-data-plane-command-plan'
import { supabaseDataPlaneAuditConfig, supabaseDataPlaneSafetyFlags } from './supabase-data-plane-audit-policy'
import { buildSupabaseDataPlaneQaSummary } from './supabase-data-plane-qa-summary'
import { buildSupabaseEnvSecretAudit } from './supabase-env-secret-audit'
import { buildSupabaseMigrationAudit } from './supabase-migration-audit'
import { resolveSupabaseRepoSchema } from './supabase-repo-schema-resolver'
import { buildSupabaseRlsPolicyAudit } from './supabase-rls-policy-audit'
import { buildSupabaseRuntimeIntegrationAudit } from './supabase-runtime-integration-audit'
import { buildPlannedSupabaseSecretManagerAudit } from './supabase-secret-manager-audit'
import { buildSupabaseStoryTimingRlsTriage } from './supabase-storytiming-rls-triage'
import type { SupabaseDataPlaneAuditReport, SupabaseDataPlaneExecutionReport } from './supabase-data-plane-audit-types'

export const SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH = 'activation-logs/supabase-data-plane-audit/phase51a/job-execution/phase51a-report.json'

export function buildSupabaseDataPlaneAuditReport(): SupabaseDataPlaneAuditReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const repoDiscovery = resolveSupabaseRepoSchema()
  const secretManagerAudit = buildPlannedSupabaseSecretManagerAudit()
  const envSecretAudit = buildSupabaseEnvSecretAudit()
  const migrationAudit = buildSupabaseMigrationAudit(repoDiscovery.migrationFiles)
  const rlsPolicyAudit = buildSupabaseRlsPolicyAudit(migrationAudit)
  const storyTimingRlsTriage = buildSupabaseStoryTimingRlsTriage(migrationAudit)
  const runtimeIntegrationAudit = buildSupabaseRuntimeIntegrationAudit()
  const remoteActivityAudit = buildPlannedSupabaseRemoteActivityAudit()
  const dataModelGapAnalysis = buildSupabaseDataModelGapAnalysis({
    migrationAudit,
    rlsPolicyAudit,
    runtimeIntegrationAudit,
    remoteActivityAudit,
  })
  const betaReadinessImpact = buildSupabaseBetaReadinessImpact(dataModelGapAnalysis, storyTimingRlsTriage)
  const commandPlan = buildSupabaseDataPlaneCommandPlan()
  const qa = buildSupabaseDataPlaneQaSummary({
    repoDiscovery,
    envSecretAudit,
    migrationAudit,
    rlsPolicyAudit,
    storyTimingRlsTriage,
    runtimeIntegrationAudit,
    remoteActivityAudit,
    dataModelGapAnalysis,
    betaReadinessImpact,
    docsPresent: true,
    scriptsPresent: true,
  })
  return {
    reportId: 'activation-phase-51a-supabase-data-plane-audit',
    createdAt: new Date().toISOString(),
    phase: '51A',
    status: 'planned',
    config: supabaseDataPlaneAuditConfig,
    repoDiscovery,
    envSecretAudit,
    secretManagerAudit,
    migrationAudit,
    rlsPolicyAudit,
    storyTimingRlsTriage,
    runtimeIntegrationAudit,
    remoteActivityAudit,
    dataModelGapAnalysis,
    betaReadinessImpact,
    commandPlan,
    qa,
    safetyFlags: supabaseDataPlaneSafetyFlags,
    canRunLocalSql: dataModelGapAnalysis.canRunLocalSql,
    canProceedToPrompt20B: dataModelGapAnalysis.canProceedToPrompt20B,
    phase51BReadiness: betaReadinessImpact.phase51BReadiness,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSupabaseDataPlaneAuditReport(report: SupabaseDataPlaneAuditReport): string {
  return [
    'Phase 51A Supabase data-plane audit',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Migration files: ${report.migrationAudit.migrationFileCount}`,
    `Parsed tables: ${report.migrationAudit.createdTables.length}`,
    `RLS-enabled tables: ${report.rlsPolicyAudit.rlsEnabledTableCount}`,
    `StoryTiming RLS triage: ${report.storyTimingRlsTriage.status} (${report.storyTimingRlsTriage.falsePositiveCount}/${report.storyTimingRlsTriage.flaggedTableCount} parser false positives)`,
    `Runtime table references: ${report.runtimeIntegrationAudit.tableReferences.length}`,
    `Remote activity audit: ${report.remoteActivityAudit.status}`,
    `P0 data-plane gaps: ${report.dataModelGapAnalysis.p0Count}`,
    `canRunLocalSql: ${report.canRunLocalSql}`,
    `canProceedToPrompt20B: ${report.canProceedToPrompt20B}`,
    `Phase51B readiness: ${report.phase51BReadiness}`,
    'Writes/migrations/production/beta: blocked',
    '',
    'Why Supabase may show low/no activity:',
    ...report.runtimeIntegrationAudit.whyLowOrNoActivity.map((reason) => `- ${reason}`),
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'P0 blockers:',
    ...(report.betaReadinessImpact.p0Blockers.length ? report.betaReadinessImpact.p0Blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

function executionToReport(executionReport: SupabaseDataPlaneExecutionReport): SupabaseDataPlaneAuditReport {
  const hydrated = hydrateExecutionReport(executionReport)
  return {
    reportId: 'activation-phase-51a-supabase-data-plane-audit',
    createdAt: new Date().toISOString(),
    phase: '51A',
    status: hydrated.ok ? 'completed' : hydrated.remoteActivityAudit.status === 'completed' ? 'blocked' : 'partial',
    config: supabaseDataPlaneAuditConfig,
    executionReport: hydrated,
    repoDiscovery: hydrated.repoDiscovery,
    envSecretAudit: hydrated.envSecretAudit,
    secretManagerAudit: hydrated.secretManagerAudit,
    migrationAudit: hydrated.migrationAudit,
    rlsPolicyAudit: hydrated.rlsPolicyAudit,
    storyTimingRlsTriage: hydrated.storyTimingRlsTriage,
    runtimeIntegrationAudit: hydrated.runtimeIntegrationAudit,
    remoteActivityAudit: hydrated.remoteActivityAudit,
    dataModelGapAnalysis: hydrated.dataModelGapAnalysis,
    betaReadinessImpact: hydrated.betaReadinessImpact,
    commandPlan: hydrated.commandPlan,
    qa: hydrated.qa,
    safetyFlags: hydrated.safetyFlags,
    canRunLocalSql: hydrated.canRunLocalSql,
    canProceedToPrompt20B: hydrated.canProceedToPrompt20B,
    phase51BReadiness: hydrated.phase51BReadiness,
    blockers: hydrated.blockers,
    warnings: hydrated.warnings,
  }
}

function hydrateExecutionReport(executionReport: SupabaseDataPlaneExecutionReport): SupabaseDataPlaneExecutionReport {
  const storyTimingRlsTriage = executionReport.storyTimingRlsTriage ?? buildSupabaseStoryTimingRlsTriage(executionReport.migrationAudit)
  const secretManagerAudit = executionReport.secretManagerAudit ?? buildPlannedSupabaseSecretManagerAudit()
  const phase51BReadiness = executionReport.betaReadinessImpact.phase51BReadiness as string
  const betaReadinessImpact = phase51BReadiness === 'ready_for_schema_migration_hardening_plan'
    ? buildSupabaseBetaReadinessImpact(executionReport.dataModelGapAnalysis, storyTimingRlsTriage)
    : executionReport.betaReadinessImpact
  return {
    ...executionReport,
    secretManagerAudit,
    storyTimingRlsTriage,
    betaReadinessImpact,
    phase51BReadiness: betaReadinessImpact.phase51BReadiness,
  }
}

function readLocalExecutionReport(): SupabaseDataPlaneExecutionReport | undefined {
  if (!existsSync(SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SUPABASE_DATA_PLANE_LOCAL_REPORT_PATH, 'utf8')) as SupabaseDataPlaneExecutionReport
  } catch {
    return undefined
  }
}
