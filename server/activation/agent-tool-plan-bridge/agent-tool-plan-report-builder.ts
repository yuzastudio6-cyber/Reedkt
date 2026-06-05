import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildCandidateApprovedPlanSnapshots, buildBlockedPlanRecords } from './approved-plan-candidate-builder'
import { buildAgentToolPlanBridgeCommandPlan } from './agent-tool-plan-command-plan'
import { buildAgentToolPlanBridgeIamPlan } from './agent-tool-plan-iam-plan'
import { buildAgentToolPlanBridgeManifest } from './agent-tool-plan-manifest-builder'
import { makeAgentToolPlanBridgeRunId } from './agent-tool-plan-bridge-policy'
import { buildAgentToolPlanBridgeQaSummary } from './agent-tool-plan-qa-summary'
import { buildNotAttemptedPhase52DSyncResult, buildPhase52DSupabaseMilestoneBundle, buildPhase52DSupabaseSyncInput } from './agent-tool-plan-supabase-sync'
import { buildAgentToolPlanSourceAudit } from './agent-tool-plan-source-audit'
import { resolveAgentToolPlanEvidenceContext } from './agent-tool-plan-evidence-resolver'
import { buildCrossTrackHandoffPackets } from './cross-track-handoff-builder'
import { runAgentToolPlanProducerGate, validateAgentToolPlanProducerGate } from './producer-plan-gate'
import { runAgentToolPlanQaGate } from './qa-plan-gate'
import { validateAgentToolPlanScope } from './plan-scope-validator'
import type { AgentToolPlanBridgeExecutionReport, AgentToolPlanBridgeReport } from './agent-tool-plan-bridge-types'

export const AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'agent-tool-plan-bridge',
  'phase52d',
  'job-execution',
  'phase52d-report.json',
)

export async function buildAgentToolPlanBridgeReport(): Promise<AgentToolPlanBridgeReport> {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-52d-agent-tool-plan-bridge',
      createdAt: new Date().toISOString(),
      phase: '52D',
      status: executionReport.status,
      repoOwnershipAudit: executionReport.repoOwnershipAudit,
      evidenceContext: executionReport.evidenceContext,
      candidatePlans: executionReport.candidatePlans,
      blockedPlans: executionReport.blockedPlans,
      producerGateResults: executionReport.producerGateResults,
      qaPlanGateResults: executionReport.qaPlanGateResults,
      handoffPackets: executionReport.handoffPackets,
      manifest: executionReport.manifest,
      qa: executionReport.qa,
      commandPlan: executionReport.commandPlan,
      iamPlan: executionReport.iamPlan,
      executionReport,
      phase52EReadiness: executionReport.phase52EReadiness,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const runId = makeAgentToolPlanBridgeRunId(new Date('2026-06-05T00:00:00Z'))
  const createdAt = '2026-06-05T00:00:00.000Z'
  const repoOwnershipAudit = buildAgentToolPlanSourceAudit(new Date(createdAt))
  const evidenceContext = await resolveAgentToolPlanEvidenceContext()
  const candidatePlans = buildCandidateApprovedPlanSnapshots({
    runId,
    createdAt,
    findings: evidenceContext.sourceAgentFindings,
    intents: evidenceContext.sourceEditIntents,
    producerGateResults: evidenceContext.sourceProducerGateResults,
  })
  const blockedPlans = buildBlockedPlanRecords({
    findings: evidenceContext.sourceAgentFindings,
    intents: evidenceContext.sourceEditIntents,
    producerGateResults: evidenceContext.sourceProducerGateResults,
  })
  const scopeValidation = validateAgentToolPlanScope({ candidatePlans, blockedPlans })
  const producerGateResults = runAgentToolPlanProducerGate({ candidatePlans, blockedPlans })
  const producerGate = validateAgentToolPlanProducerGate(producerGateResults)
  const handoffPackets = buildCrossTrackHandoffPackets({ runId, candidatePlans, blockedPlans })
  const manifestBeforeQa = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults: [],
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: 'not_attempted',
    blockers: [...repoOwnershipAudit.blockers, ...evidenceContext.blockers, ...scopeValidation.blockers, ...producerGate.blockers],
    warnings: [...repoOwnershipAudit.warnings, ...evidenceContext.warnings, ...scopeValidation.warnings],
  })
  const qaPlanGateResults = runAgentToolPlanQaGate({ manifest: manifestBeforeQa, supabaseSyncStatus: 'completed' })
  const manifest = buildAgentToolPlanBridgeManifest({
    runId,
    repoOwnershipAudit,
    findingCount: evidenceContext.sourceAgentFindings.length,
    editIntentCount: evidenceContext.sourceEditIntents.length,
    capabilityRecordCount: evidenceContext.capabilityRecords.length,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    producerGateResults,
    qaPlanGateResults,
    sourceOfTruthSummary: evidenceContext.sourceOfTruthRules,
    supabaseMilestoneSyncStatus: 'not_attempted',
    blockers: [...repoOwnershipAudit.blockers, ...evidenceContext.blockers, ...scopeValidation.blockers, ...producerGate.blockers],
    warnings: [...repoOwnershipAudit.warnings, ...evidenceContext.warnings, ...scopeValidation.warnings],
  })
  const syncResult = buildNotAttemptedPhase52DSyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const qa = buildAgentToolPlanBridgeQaSummary({
    packageScripts: readAgentToolPlanBridgePackageScripts(),
    docsPresent: readAgentToolPlanBridgeDocsPresent(),
    repoOwnershipAudit,
    candidatePlans,
    blockedPlans,
    producerGateResults,
    qaPlanGateResults,
    handoffPackets,
    manifest,
    scopeValidationBlockers: scopeValidation.blockers,
    producerGateBlockers: producerGate.blockers,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  const syncInput = buildPhase52DSupabaseSyncInput(runId, qa)
  buildPhase52DSupabaseMilestoneBundle(syncInput)
  return {
    reportId: 'activation-phase-52d-agent-tool-plan-bridge',
    createdAt: new Date().toISOString(),
    phase: '52D',
    status: 'planned',
    repoOwnershipAudit,
    evidenceContext,
    candidatePlans,
    blockedPlans,
    producerGateResults,
    qaPlanGateResults,
    handoffPackets,
    manifest,
    qa,
    commandPlan: buildAgentToolPlanBridgeCommandPlan(),
    iamPlan: buildAgentToolPlanBridgeIamPlan(),
    phase52EReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeAgentToolPlanBridgeReport(report: AgentToolPlanBridgeReport): string {
  const lines = [
    `Phase ${report.phase} agent-to-tool plan bridge`,
    `Status: ${report.status}`,
    `Candidate plans: ${report.candidatePlans.length}`,
    `Blocked/handoff records: ${report.blockedPlans.length}`,
    `Handoff packets: ${report.handoffPackets.length}`,
    `QA: ${report.qa.status}`,
    `Phase52E readiness: ${report.phase52EReadiness}`,
  ]
  if (report.executionReport) {
    lines.push(`Run ID: ${report.executionReport.runId}`)
    lines.push(`Supabase sync: ${report.executionReport.supabaseSyncResult.status}`)
    lines.push(`Artifacts: ${report.executionReport.artifacts.length}`)
  }
  if (report.blockers.length) lines.push(`Blockers: ${report.blockers.join('; ')}`)
  if (report.warnings.length) lines.push(`Warnings: ${report.warnings.join('; ')}`)
  return lines.join('\n')
}

export function readAgentToolPlanBridgePackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

export function readAgentToolPlanBridgeDocsPresent(): Record<string, boolean> {
  return {
    'docs/agents/agent-tool-plan-bridge-runbook.md': existsSync('docs/agents/agent-tool-plan-bridge-runbook.md'),
    'docs/agents/agent-tool-plan-bridge-policy.md': existsSync('docs/agents/agent-tool-plan-bridge-policy.md'),
    'docs/agents/agent-tool-plan-bridge-qa-policy.md': existsSync('docs/agents/agent-tool-plan-bridge-qa-policy.md'),
    'docs/activation-phase-52d-agent-tool-plan-bridge-results.md': existsSync('docs/activation-phase-52d-agent-tool-plan-bridge-results.md'),
  }
}

function readLatestExecutionReport(): AgentToolPlanBridgeExecutionReport | null {
  try {
    if (!existsSync(AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH)) return null
    return JSON.parse(readFileSync(AGENT_TOOL_PLAN_BRIDGE_LOCAL_REPORT_PATH, 'utf8')) as AgentToolPlanBridgeExecutionReport
  } catch {
    return null
  }
}
