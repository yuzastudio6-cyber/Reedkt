import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildControlledInternalTestPacket, classifyInternalTestScopes } from './internal-test-scope-classifier'
import { buildGoNoGoBlockerInventory } from './go-no-go-blocker-inventory'
import { buildGoNoGoCommandPlan } from './go-no-go-command-plan'
import { buildGoNoGoDecisionPacket } from './go-no-go-decision-packet'
import { buildGoNoGoExposureRegister } from './go-no-go-risk-register'
import { buildGoNoGoIamPlan } from './go-no-go-iam-plan'
import { makeGoNoGoRunId } from './controlled-internal-test-go-no-go-policy'
import { buildGoNoGoQaSummary } from './go-no-go-qa-summary'
import { resolveGoNoGoEvidenceContext } from './go-no-go-evidence-resolver'
import { buildGoNoGoSourceAudit } from './go-no-go-source-audit'
import { buildNotAttemptedPhase52GSyncResult, buildPhase52GSupabaseMilestoneBundle, buildPhase52GSupabaseSyncInput } from './go-no-go-supabase-sync'
import { buildOwnerHandoffDispatchManifest } from './owner-handoff-dispatch-manifest'
import { buildOwnerHandoffPromptPackets } from './owner-handoff-prompt-builder'
import { evaluateWorkstreamGoNoGo } from './workstream-go-no-go-evaluator'
import type { GoNoGoExecutionReport, GoNoGoReport } from './controlled-internal-test-go-no-go-types'

export const GO_NO_GO_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'controlled-internal-test-go-no-go',
  'phase52g',
  'job-execution',
  'phase52g-report.json',
)

export function buildGoNoGoReport(): GoNoGoReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      ...executionReport,
      reportId: 'activation-phase-52g-controlled-internal-test-go-no-go',
      executionReport,
    }
  }

  const runId = makeGoNoGoRunId(new Date('2026-06-05T00:00:00Z'))
  const repoOwnershipAudit = buildGoNoGoSourceAudit(new Date('2026-06-05T00:00:00.000Z'))
  const evidenceContext = resolveGoNoGoEvidenceContext(repoOwnershipAudit)
  const workstreamDecisions = evaluateWorkstreamGoNoGo(evidenceContext)
  const scopeClassifications = classifyInternalTestScopes(workstreamDecisions)
  const decisionPacket = buildGoNoGoDecisionPacket(runId, workstreamDecisions)
  const controlledInternalTestPacket = buildControlledInternalTestPacket(workstreamDecisions)
  const ownerPromptPackets = buildOwnerHandoffPromptPackets(workstreamDecisions, runId)
  const blockerInventory = buildGoNoGoBlockerInventory(repoOwnershipAudit)
  const exposureRegister = buildGoNoGoExposureRegister()
  const syncResult = buildNotAttemptedPhase52GSyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const dispatchManifest = buildOwnerHandoffDispatchManifest({
    runId,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    warnings: [...repoOwnershipAudit.warnings, ...evidenceContext.warnings, ...syncResult.warnings],
  })
  const qa = buildGoNoGoQaSummary({
    packageScripts: readGoNoGoPackageScripts(),
    docsPresent: readGoNoGoDocsPresent(),
    repoOwnershipAudit,
    decisionPacket,
    workstreamDecisions,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    dispatchManifest,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildPhase52GSupabaseSyncInput(runId, qa)
  const milestoneBundle = buildPhase52GSupabaseMilestoneBundle(syncInput)
  return {
    reportId: 'activation-phase-52g-controlled-internal-test-go-no-go',
    createdAt: new Date().toISOString(),
    phase: '52G',
    runId,
    status: 'planned',
    repoOwnershipAudit,
    evidenceContext,
    scopeClassifications,
    decisionPacket,
    controlledInternalTestPacket,
    ownerPromptPackets,
    blockerInventory,
    exposureRegister,
    dispatchManifest,
    syncInput,
    milestoneBundle,
    supabaseSyncResult: syncResult,
    commandPlan: buildGoNoGoCommandPlan(),
    iamPlan: buildGoNoGoIamPlan(),
    qa,
    artifacts: [],
    phase52HReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeGoNoGoReport(report: GoNoGoReport): string {
  const lines = [
    `Phase ${report.phase} controlled internal test go/no-go`,
    `Status: ${report.status}`,
    `Top-level decision: ${report.decisionPacket.topLevelDecision.positive.join(', ')}; ${report.decisionPacket.topLevelDecision.blocked.join(', ')}`,
    `Workstream decisions: ${report.decisionPacket.workstreamDecisions.length}`,
    `Owner prompt packets: ${report.ownerPromptPackets.length}`,
    `Blockers: ${report.blockerInventory.length}`,
    `QA: ${report.qa.status}`,
    `Phase52H readiness: ${report.phase52HReadiness}`,
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

export function readGoNoGoPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readGoNoGoDocsPresent(): Record<string, boolean> {
  return {
    'docs/agents/controlled-internal-test-go-no-go-runbook.md': existsSync('docs/agents/controlled-internal-test-go-no-go-runbook.md'),
    'docs/agents/controlled-internal-test-go-no-go-policy.md': existsSync('docs/agents/controlled-internal-test-go-no-go-policy.md'),
    'docs/agents/controlled-internal-test-go-no-go-qa-policy.md': existsSync('docs/agents/controlled-internal-test-go-no-go-qa-policy.md'),
    'docs/activation-phase-52g-controlled-internal-test-go-no-go-results.md': existsSync('docs/activation-phase-52g-controlled-internal-test-go-no-go-results.md'),
  }
}

function readLatestExecutionReport(): GoNoGoExecutionReport | null {
  try {
    if (!existsSync(GO_NO_GO_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(GO_NO_GO_LOCAL_REPORT_PATH, 'utf8')) as GoNoGoExecutionReport
  } catch {
    return null
  }
}
