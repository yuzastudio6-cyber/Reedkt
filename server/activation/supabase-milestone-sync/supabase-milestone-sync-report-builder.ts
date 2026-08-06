import { existsSync, readFileSync } from 'node:fs'
import { buildActivationMilestoneBundle, buildPhase51DSelfSyncInput } from './activation-milestone-bundle-builder'
import { enforceActivationMilestoneSyncPolicy } from './activation-milestone-sanitizer'
import { buildSupabaseMilestoneSyncCommandPlan } from './supabase-milestone-sync-command-plan'
import { buildSupabaseMilestoneSyncIamPlan } from './supabase-milestone-sync-iam-plan'
import { supabaseMilestoneSyncArtifactPrefix, supabaseMilestoneSyncConfig, supabaseMilestoneSyncSafetyFlags } from './supabase-milestone-sync-policy'
import { buildSupabaseMilestoneSyncQaSummary } from './supabase-milestone-sync-qa-summary'
import type { ActivationMilestoneReadbackVerification, SupabaseMilestoneSyncExecutionReport, SupabaseMilestoneSyncReport } from './supabase-milestone-sync-types'
import { buildNotAttemptedWriteVerification, validateSupabaseMilestoneBundle, type SupabaseRegistrySchemaVerification } from '../supabase-milestone-registry'

export const SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH = 'activation-logs/supabase-milestone-sync/phase51d/job-execution/phase51d-report.json'

export function buildSupabaseMilestoneSyncReport(): SupabaseMilestoneSyncReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)
  const runId = 'phase51d-planned'
  const syncInput = buildPhase51DSelfSyncInput({ runId, artifactPrefix: supabaseMilestoneSyncArtifactPrefix(runId), completedAt: null })
  const milestoneBundle = buildActivationMilestoneBundle({ ...syncInput, status: 'partial', qaStatus: 'warning', readinessStatus: 'supabase_milestone_sync_planned_not_executed', completedAt: null })
  const bundleValidation = validateSupabaseMilestoneBundle(milestoneBundle)
  const sanitizer = enforceActivationMilestoneSyncPolicy({ syncInput, bundle: milestoneBundle })
  const schemaVerification = plannedSchemaVerification()
  const writeVerification = buildNotAttemptedWriteVerification(['Static report mode does not write Supabase milestone rows.'])
  const readbackVerification = plannedReadback(runId)
  const commandPlan = buildSupabaseMilestoneSyncCommandPlan()
  const iamPlan = buildSupabaseMilestoneSyncIamPlan(runId)
  const qa = buildSupabaseMilestoneSyncQaSummary({
    phase51cEvidencePresent: detectPhase51CEvidence(),
    schemaVerification,
    bundleValidation,
    sanitizer,
    writeVerification,
    readbackVerification,
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
    bundleValidation,
    sanitizer,
    schemaVerification,
    writeVerification,
    readbackVerification,
    commandPlan,
    iamPlan,
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
    `Sync contract: ${report.syncInput.supabaseSyncPolicy.mode}`,
    `Report adapter: present`,
    `Sanitizer: ${report.sanitizer.ok ? 'passed' : 'blocked'}`,
    `Schema verification: ${report.schemaVerification.status}`,
    `Self-sync write: ${report.writeVerification.status}`,
    `Readback: ${report.readbackVerification.status}`,
    `Phase52A readiness: ${report.phase52AReadiness}`,
    'Writes: milestone registry only',
    'Migrations/historical backfill/production/external beta/broad media/public artifacts/signed URL truth/raw prompt execution: blocked',
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
  return text.includes('phase51c-20260605T022737') && text.includes('ready_for_automatic_per_phase_supabase_milestone_sync')
}

function readLocalExecutionReport(): SupabaseMilestoneSyncExecutionReport | null {
  if (!existsSync(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH)) return null
  return JSON.parse(readFileSync(SUPABASE_MILESTONE_SYNC_LOCAL_REPORT_PATH, 'utf8')) as SupabaseMilestoneSyncExecutionReport
}

function plannedSchemaVerification(): SupabaseRegistrySchemaVerification {
  return {
    status: 'not_attempted',
    tables: [],
    allTablesPresent: false,
    serviceRoleRestUsed: false,
    ddlUsedThroughRest: false,
    blockers: ['Static report mode does not inspect remote Supabase registry tables.'],
    warnings: [],
  }
}

function plannedReadback(runId: string): ActivationMilestoneReadbackVerification {
  return { status: 'not_attempted', phaseId: '51D', runId, readbackMatched: false, activationRunId: null, blockers: ['Static report mode does not read back Supabase rows.'], warnings: [] }
}

function executionToReport(executionReport: SupabaseMilestoneSyncExecutionReport): SupabaseMilestoneSyncReport {
  return {
    reportId: 'activation-phase-51d-supabase-milestone-sync',
    createdAt: new Date().toISOString(),
    phase: '51D',
    status: executionReport.ok ? 'completed' : executionReport.writeVerification.status === 'not_attempted' ? 'partial' : 'blocked',
    config: supabaseMilestoneSyncConfig,
    executionReport,
    syncInput: executionReport.syncInput,
    milestoneBundle: executionReport.milestoneBundle,
    bundleValidation: executionReport.bundleValidation,
    sanitizer: executionReport.sanitizer,
    schemaVerification: executionReport.schemaVerification,
    writeVerification: executionReport.writeVerification,
    readbackVerification: executionReport.readbackVerification,
    commandPlan: executionReport.commandPlan,
    iamPlan: executionReport.iamPlan,
    qa: executionReport.qa,
    safetyFlags: executionReport.safetyFlags,
    phase52AReadiness: executionReport.phase52AReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}
