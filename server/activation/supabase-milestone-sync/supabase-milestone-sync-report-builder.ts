import { existsSync, readFileSync } from 'node:fs'
import { buildPhase51DSelfSyncInput, buildSupabaseMilestoneBundleFromSyncInput } from './activation-milestone-bundle-builder'
import { validateActivationMilestoneSyncBundle, validateActivationMilestoneSyncInput } from './activation-milestone-sanitizer'
import { buildSupabaseMilestoneSyncCommandPlan } from './supabase-milestone-sync-command-plan'
import { buildSupabaseMilestoneSyncIamPlan } from './supabase-milestone-sync-iam-plan'
import { supabaseMilestoneSyncConfig, supabaseMilestoneSyncSafetyFlags } from './supabase-milestone-sync-policy'
import { buildSupabaseMilestoneSyncQaSummary } from './supabase-milestone-sync-qa-summary'
import type { SupabaseMilestoneSyncExecutionReport, SupabaseMilestoneSyncReport, SupabaseMilestoneSyncResult } from './supabase-milestone-sync-types'
import { buildPlannedSchemaVerification, buildNotAttemptedWriteVerification } from '../supabase-milestone-registry'

export const SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH = 'activation-logs/supabase-milestone-sync/phase51d/job-execution/phase51d-report.json'

export function buildSupabaseMilestoneSyncReport(): SupabaseMilestoneSyncReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const runId = 'phase51d-planned'
  const syncInput = buildPhase51DSelfSyncInput(runId)
  const milestoneBundle = buildSupabaseMilestoneBundleFromSyncInput(syncInput)
  const inputValidation = validateActivationMilestoneSyncInput(syncInput)
  const bundleValidation = validateActivationMilestoneSyncBundle(milestoneBundle)
  const schemaVerification = buildPlannedSchemaVerification()
  const syncResult = buildPlannedSyncResult(schemaVerification.allTablesPresent)
  const qa = buildSupabaseMilestoneSyncQaSummary({
    phase51cEvidencePresent: detectPhase51CEvidence(),
    inputValidation,
    bundleValidation,
    schemaVerification,
    syncResult,
    docsPresent: true,
    scriptsPresent: true,
  })
  return {
    reportId: 'activation-phase-51d-supabase-milestone-sync',
    createdAt: new Date().toISOString(),
    phase: '51D',
    status: 'planned',
    config: supabaseMilestoneSyncConfig,
    syncInput,
    milestoneBundle,
    schemaVerification,
    syncResult,
    commandPlan: buildSupabaseMilestoneSyncCommandPlan(),
    iamPlan: buildSupabaseMilestoneSyncIamPlan(),
    qa,
    safetyFlags: supabaseMilestoneSyncSafetyFlags,
    phase52AReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSupabaseMilestoneSyncReport(report: SupabaseMilestoneSyncReport): string {
  return [
    'Phase 51D automatic Supabase milestone sync',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.syncInput.runId}`,
    `Sync contract: ActivationMilestoneSyncInput`,
    `Registry write: ${report.syncResult.writeVerification.status}`,
    `Readback matched: ${report.syncResult.readbackMatched}`,
    `Phase52A readiness: ${report.phase52AReadiness}`,
    'Migrations/schema/RLS changes: false',
    'Historical backfill rerun: false',
    'Production/external beta/broad media/public artifacts/signed URL truth/raw prompt execution: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function detectPhase51CEvidence(): boolean {
  if (!existsSync('docs/activation-phase-51c-supabase-historical-backfill-results.md')) return false
  const text = readFileSync('docs/activation-phase-51c-supabase-historical-backfill-results.md', 'utf8')
  return text.includes('phase51c-20260605T022737') && text.includes('Phase51D readiness')
}

function executionToReport(executionReport: SupabaseMilestoneSyncExecutionReport): SupabaseMilestoneSyncReport {
  return {
    reportId: 'activation-phase-51d-supabase-milestone-sync',
    createdAt: new Date().toISOString(),
    phase: '51D',
    status: executionReport.ok ? 'completed' : executionReport.syncResult.writeVerification.status === 'completed' ? 'partial' : 'blocked',
    config: supabaseMilestoneSyncConfig,
    executionReport,
    syncInput: executionReport.syncInput,
    milestoneBundle: executionReport.milestoneBundle,
    schemaVerification: executionReport.schemaVerification,
    syncResult: executionReport.syncResult,
    commandPlan: executionReport.commandPlan,
    iamPlan: executionReport.iamPlan,
    qa: executionReport.qa,
    safetyFlags: executionReport.safetyFlags,
    phase52AReadiness: executionReport.phase52AReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function buildPlannedSyncResult(schemaPresent: boolean): SupabaseMilestoneSyncResult {
  return {
    status: 'blocked',
    inputValidated: true,
    bundleValidated: true,
    schemaPresent,
    writeVerification: buildNotAttemptedWriteVerification(['Static report mode does not write to Supabase.']),
    readbackMatched: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    historicalBackfillRerun: false,
    blockers: ['Static report mode does not write to Supabase.'],
    warnings: ['Confirmed execution requires REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true.'],
  }
}

function readLocalExecutionReport(): SupabaseMilestoneSyncExecutionReport | undefined {
  if (!existsSync(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH, 'utf8')) as SupabaseMilestoneSyncExecutionReport
  } catch {
    return undefined
  }
}
