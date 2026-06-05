import { existsSync, readFileSync } from 'node:fs'
import { supabaseHistoricalBackfillCanonicalPhases } from './supabase-backfill-canonical-phases'
import { buildSupabaseHistoricalBundleRecords } from './supabase-backfill-bundle-builder'
import { buildSupabaseHistoricalBackfillCommandPlan } from './supabase-backfill-command-plan'
import { resolveSupabaseHistoricalEvidence } from './supabase-backfill-evidence-resolver'
import { buildSupabaseHistoricalBackfillIamPlan } from './supabase-backfill-iam-plan'
import { buildSupabaseHistoricalBackfillQaSummary } from './supabase-backfill-qa-summary'
import { buildSupabaseHistoricalBackfillSummary, phase51DReadinessFromSummary } from './supabase-backfill-verifier'
import { supabaseHistoricalBackfillConfig, supabaseHistoricalBackfillSafetyFlags } from './supabase-historical-backfill-policy'
import type {
  SupabaseHistoricalBackfillExecutionReport,
  SupabaseHistoricalBackfillPlan,
  SupabaseHistoricalBackfillReport,
} from './supabase-historical-backfill-types'
import { buildPlannedSchemaVerification } from '../supabase-milestone-registry'

export const SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH = 'activation-logs/supabase-historical-backfill/phase51c/job-execution/phase51c-report.json'

export function buildSupabaseHistoricalBackfillPlan(): SupabaseHistoricalBackfillPlan {
  const p0Phases = supabaseHistoricalBackfillCanonicalPhases.filter((phase) => phase.priority === 'P0').map((phase) => phase.phaseId)
  const p1OptionalPhases = supabaseHistoricalBackfillCanonicalPhases.filter((phase) => phase.priority === 'P1').map((phase) => phase.phaseId)
  return {
    phase: '51C',
    mode: supabaseHistoricalBackfillConfig.mode,
    p0Phases,
    p1OptionalPhases,
    writesPerformedByDefault: false,
    migrationsApplied: false,
    schemaMutationAllowed: false,
    broadBackfillAllowed: false,
    blockers: [],
    warnings: ['Static report mode does not write to Supabase. Confirmed execution backfills P0 phases and opportunistic P1 phases only.'],
  }
}

export function buildSupabaseHistoricalBackfillReport(): SupabaseHistoricalBackfillReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const plan = buildSupabaseHistoricalBackfillPlan()
  const evidence = resolveSupabaseHistoricalEvidence(supabaseHistoricalBackfillCanonicalPhases)
  const bundleRecords = buildSupabaseHistoricalBundleRecords({ phases: supabaseHistoricalBackfillCanonicalPhases, evidence })
  const summary = buildSupabaseHistoricalBackfillSummary({ runId: 'phase51c-planned', records: bundleRecords })
  const commandPlan = buildSupabaseHistoricalBackfillCommandPlan()
  const iamPlan = buildSupabaseHistoricalBackfillIamPlan()
  const schemaVerification = buildPlannedSchemaVerification()
  const qa = buildSupabaseHistoricalBackfillQaSummary({
    phase51bEvidencePresent: detectPhase51BEvidence(),
    schemaVerification,
    plan,
    records: bundleRecords,
    summary,
    docsPresent: true,
    scriptsPresent: true,
  })
  return {
    reportId: 'activation-phase-51c-supabase-historical-backfill',
    createdAt: new Date().toISOString(),
    phase: '51C',
    status: 'planned',
    config: supabaseHistoricalBackfillConfig,
    plan,
    evidence,
    bundleRecords,
    summary,
    commandPlan,
    iamPlan,
    qa,
    safetyFlags: supabaseHistoricalBackfillSafetyFlags,
    phase51DReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSupabaseHistoricalBackfillReport(report: SupabaseHistoricalBackfillReport): string {
  return [
    'Phase 51C Supabase historical activation evidence backfill',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.summary.runId}`,
    `P0 phases: ${report.plan.p0Phases.join(', ')}`,
    `P1 optional phases: ${report.plan.p1OptionalPhases.join(', ')}`,
    `Phases written: ${report.summary.writtenPhases.length ? report.summary.writtenPhases.join(', ') : 'none'}`,
    `Phases skipped: ${report.summary.skippedPhases.length ? report.summary.skippedPhases.map((item) => item.phaseId).join(', ') : 'none'}`,
    `Phase51D readiness: ${report.phase51DReadiness}`,
    `Writes performed: ${report.summary.writesPerformed}`,
    'Migrations/schema/RLS mutations: false',
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

export function detectPhase51BEvidence(): boolean {
  if (!existsSync('docs/activation-phase-51b-supabase-milestone-registry-results.md')) return false
  const text = readFileSync('docs/activation-phase-51b-supabase-milestone-registry-results.md', 'utf8')
  return text.includes('phase51b-20260605T013720') && text.includes('Phase51C readiness: ready')
}

function executionToReport(executionReport: SupabaseHistoricalBackfillExecutionReport): SupabaseHistoricalBackfillReport {
  return {
    reportId: 'activation-phase-51c-supabase-historical-backfill',
    createdAt: new Date().toISOString(),
    phase: '51C',
    status: executionReport.ok ? 'completed' : executionReport.summary.writesPerformed ? 'partial' : 'blocked',
    config: supabaseHistoricalBackfillConfig,
    executionReport,
    plan: executionReport.plan,
    evidence: executionReport.evidence,
    bundleRecords: executionReport.bundleRecords,
    summary: executionReport.summary,
    commandPlan: executionReport.commandPlan,
    iamPlan: executionReport.iamPlan,
    qa: executionReport.qa,
    safetyFlags: executionReport.safetyFlags,
    phase51DReadiness: phase51DReadinessFromSummary(executionReport.summary),
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): SupabaseHistoricalBackfillExecutionReport | undefined {
  if (!existsSync(SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SUPABASE_HISTORICAL_BACKFILL_LOCAL_REPORT_PATH, 'utf8')) as SupabaseHistoricalBackfillExecutionReport
  } catch {
    return undefined
  }
}
