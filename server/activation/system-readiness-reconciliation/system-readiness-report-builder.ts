import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildControlledInternalTestPlan } from './controlled-internal-test-plan-builder'
import { reconcileSystemFeatureGates } from './feature-gate-reconciliation'
import { buildSystemHandoffPackets } from './system-handoff-builder'
import { buildSystemReadinessIamPlan } from './system-readiness-iam-plan'
import { buildSystemReadinessManifest } from './system-readiness-manifest-builder'
import { makeSystemReadinessRunId } from './system-readiness-reconciliation-policy'
import { buildSystemReadinessQaSummary } from './system-readiness-qa-summary'
import { buildSystemReadinessCommandPlan } from './system-readiness-command-plan'
import { buildSystemRiskRegister } from './system-risk-register'
import { resolveSystemEvidenceContext } from './system-evidence-resolver'
import { buildSystemSourceAudit } from './system-source-audit'
import { buildSystemBlockerInventory } from './workstream-blocker-inventory'
import { resolveWorkstreamReadiness } from './workstream-readiness-resolver'
import { buildNotAttemptedPhase52FSyncResult, buildPhase52FSupabaseMilestoneBundle, buildPhase52FSupabaseSyncInput } from './system-readiness-supabase-sync'
import type { SystemReadinessExecutionReport, SystemReadinessReport } from './system-readiness-reconciliation-types'

export const SYSTEM_READINESS_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'system-readiness-reconciliation',
  'phase52f',
  'job-execution',
  'phase52f-report.json',
)

export function buildSystemReadinessReport(): SystemReadinessReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-52f-system-readiness-reconciliation',
      createdAt: new Date().toISOString(),
      phase: '52F',
      status: executionReport.status,
      repoOwnershipAudit: executionReport.repoOwnershipAudit,
      evidenceContext: executionReport.evidenceContext,
      workstreamReadiness: executionReport.workstreamReadiness,
      controlledInternalTestPlan: executionReport.controlledInternalTestPlan,
      blockerInventory: executionReport.blockerInventory,
      featureGateReconciliation: executionReport.featureGateReconciliation,
      systemRiskRegister: executionReport.systemRiskRegister,
      handoffPackets: executionReport.handoffPackets,
      manifest: executionReport.manifest,
      syncInput: executionReport.syncInput,
      milestoneBundle: executionReport.milestoneBundle,
      schemaVerification: executionReport.schemaVerification,
      supabaseSyncResult: executionReport.supabaseSyncResult,
      commandPlan: executionReport.commandPlan,
      iamPlan: executionReport.iamPlan,
      qa: executionReport.qa,
      executionReport,
      phase52GReadiness: executionReport.phase52GReadiness,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const runId = makeSystemReadinessRunId(new Date('2026-06-05T00:00:00Z'))
  const repoOwnershipAudit = buildSystemSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
  const evidenceContext = resolveSystemEvidenceContext(repoOwnershipAudit)
  const workstreamReadiness = resolveWorkstreamReadiness(evidenceContext)
  const controlledInternalTestPlan = buildControlledInternalTestPlan(workstreamReadiness)
  const blockerInventory = buildSystemBlockerInventory(repoOwnershipAudit)
  const featureGateReconciliation = reconcileSystemFeatureGates()
  const systemRiskRegister = buildSystemRiskRegister()
  const handoffPackets = buildSystemHandoffPackets({ readiness: workstreamReadiness, blockers: blockerInventory })
  const syncResult = buildNotAttemptedPhase52FSyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const manifestBeforeQa = buildSystemReadinessManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    warnings: syncResult.warnings,
  })
  const qa = buildSystemReadinessQaSummary({
    packageScripts: readSystemReadinessPackageScripts(),
    docsPresent: readSystemReadinessDocsPresent(),
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    manifest: manifestBeforeQa,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const manifest = buildSystemReadinessManifest({
    runId,
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    qa,
    warnings: syncResult.warnings,
  })
  const syncInput = buildPhase52FSupabaseSyncInput(runId, qa)
  const milestoneBundle = buildPhase52FSupabaseMilestoneBundle(syncInput)
  return {
    reportId: 'activation-phase-52f-system-readiness-reconciliation',
    createdAt: new Date().toISOString(),
    phase: '52F',
    status: 'planned',
    repoOwnershipAudit,
    evidenceContext,
    workstreamReadiness,
    controlledInternalTestPlan,
    blockerInventory,
    featureGateReconciliation,
    systemRiskRegister,
    handoffPackets,
    manifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: syncResult,
    commandPlan: buildSystemReadinessCommandPlan(),
    iamPlan: buildSystemReadinessIamPlan(),
    qa,
    phase52GReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeSystemReadinessReport(report: SystemReadinessReport): string {
  const lines = [
    `Phase ${report.phase} system readiness reconciliation`,
    `Status: ${report.status}`,
    `Workstreams: ${report.workstreamReadiness.length}`,
    `Controlled test lanes: ${report.controlledInternalTestPlan.length}`,
    `Blockers: ${report.blockerInventory.length}`,
    `Handoff packets: ${report.handoffPackets.length}`,
    `QA: ${report.qa.status}`,
    `Phase52G readiness: ${report.phase52GReadiness}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Supabase sync: ${report.executionReport.supabaseSyncResult.status}`)
    lines.push(`Artifacts: ${report.executionReport.artifacts.length}`)
  }
  if (report.blockers.length) lines.push(`Report blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readSystemReadinessPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readSystemReadinessDocsPresent(): Record<string, boolean> {
  return {
    'docs/agents/system-readiness-reconciliation-runbook.md': existsSync('docs/agents/system-readiness-reconciliation-runbook.md'),
    'docs/agents/system-readiness-reconciliation-policy.md': existsSync('docs/agents/system-readiness-reconciliation-policy.md'),
    'docs/agents/system-readiness-reconciliation-qa-policy.md': existsSync('docs/agents/system-readiness-reconciliation-qa-policy.md'),
    'docs/activation-phase-52f-system-readiness-reconciliation-results.md': existsSync('docs/activation-phase-52f-system-readiness-reconciliation-results.md'),
  }
}

function readLatestExecutionReport(): SystemReadinessExecutionReport | null {
  try {
    if (!existsSync(SYSTEM_READINESS_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(SYSTEM_READINESS_LOCAL_REPORT_PATH, 'utf8')) as SystemReadinessExecutionReport
  } catch {
    return null
  }
}
