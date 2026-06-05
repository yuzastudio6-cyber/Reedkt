import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { attachQaSafetyGateSummary, buildMultiAgentDryRunManifest } from './agent-dry-run-manifest-builder'
import { multiAgentDryRunScenarios } from './agent-dry-run-scenarios'
import { generateMultiAgentFindings, validateFindingSchemaCompliance } from './agent-finding-generator'
import { generateEditIntentCandidates, validateEditIntentSchemaCompliance } from './edit-intent-candidate-generator'
import { buildMultiAgentEvidenceContext } from './multi-agent-evidence-resolver'
import { buildMultiAgentDryRunCommandPlan } from './multi-agent-dry-run-command-plan'
import { buildMultiAgentDryRunIamPlan } from './multi-agent-dry-run-iam-plan'
import { makeMultiAgentDryRunRunId } from './multi-agent-dry-run-policy'
import { buildMultiAgentDryRunQaSummary } from './multi-agent-dry-run-qa-summary'
import { buildNotAttemptedPhase52CSyncResult } from './multi-agent-supabase-sync'
import { runProducerGate, validateProducerGate } from './producer-gate-runner'
import { runQaSafetyGate } from './qa-safety-gate-runner'
import type {
  MultiAgentDryRunExecutionReport,
  MultiAgentDryRunReport,
} from './multi-agent-dry-run-types'

export const MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH = path.join(
  process.cwd(),
  'activation-logs',
  'multi-agent-dry-run',
  'phase52c',
  'job-execution',
  'phase52c-report.json',
)

export function buildMultiAgentDryRunReport(): MultiAgentDryRunReport {
  const executionReport = readLatestExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-52c-multi-agent-dry-run',
      createdAt: new Date().toISOString(),
      phase: '52C',
      status: executionReport.status,
      evidenceContext: executionReport.evidenceContext,
      scenarios: executionReport.scenarios,
      findings: executionReport.findings,
      editIntents: executionReport.editIntents,
      producerGateResults: executionReport.producerGateResults,
      qaSafetyGateResults: executionReport.qaSafetyGateResults,
      manifest: executionReport.manifest,
      qa: executionReport.qa,
      commandPlan: executionReport.commandPlan,
      iamPlan: executionReport.iamPlan,
      executionReport,
      phase52DReadiness: executionReport.phase52DReadiness,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const runId = makeMultiAgentDryRunRunId(new Date('2026-06-05T00:00:00Z'))
  const evidenceContext = buildMultiAgentEvidenceContext()
  const scenarios = multiAgentDryRunScenarios
  const findings = generateMultiAgentFindings(scenarios, '2026-06-05T00:00:00.000Z')
  const editIntents = generateEditIntentCandidates(scenarios, evidenceContext.capabilities)
  const producerGateResults = runProducerGate(editIntents, evidenceContext.capabilities)
  const findingSchema = validateFindingSchemaCompliance(findings)
  const intentSchema = validateEditIntentSchemaCompliance(editIntents)
  const producerGate = validateProducerGate(producerGateResults)
  const manifestWithoutQa = buildMultiAgentDryRunManifest({
    runId,
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    sourceOfTruthPolicy: evidenceContext.sourceOfTruthRules,
  })
  const qaSafetyGateResults = runQaSafetyGate({ manifest: manifestWithoutQa, supabaseSyncStatus: 'completed' })
  const manifest = attachQaSafetyGateSummary(manifestWithoutQa, {
    passed: qaSafetyGateResults.filter((item) => item.status === 'passed').length,
    blocked: qaSafetyGateResults.filter((item) => item.status === 'blocked').length,
  })
  const syncResult = buildNotAttemptedPhase52CSyncResult({ warnings: ['Static report does not read Supabase credentials or write the milestone registry.'] })
  const qa = buildMultiAgentDryRunQaSummary({
    packageScripts: readMultiAgentDryRunPackageScripts(),
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    qaSafetyGateResults,
    manifest,
    findingSchemaBlockers: findingSchema.blockers,
    intentSchemaBlockers: intentSchema.blockers,
    producerGateBlockers: producerGate.blockers,
    supabaseSyncResult: syncResult,
    executionMode: false,
  })
  return {
    reportId: 'activation-phase-52c-multi-agent-dry-run',
    createdAt: new Date().toISOString(),
    phase: '52C',
    status: 'planned',
    evidenceContext,
    scenarios,
    findings,
    editIntents,
    producerGateResults,
    qaSafetyGateResults,
    manifest,
    qa,
    commandPlan: buildMultiAgentDryRunCommandPlan(),
    iamPlan: buildMultiAgentDryRunIamPlan(),
    phase52DReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeMultiAgentDryRunReport(report: MultiAgentDryRunReport): string {
  const allowed = report.producerGateResults.filter((item) => item.decision === 'allowed_candidate_plan_only').length
  const blocked = report.producerGateResults.filter((item) => item.decision === 'blocked').length
  const lines = [
    `Phase ${report.phase} multi-agent dry-run on existing evidence`,
    `Status: ${report.status}`,
    `Scenarios: ${report.scenarios.length}`,
    `Findings: ${report.findings.length}`,
    `Edit intents: ${report.editIntents.length}`,
    `Agent coverage: ${report.manifest.agentCoverage.length}`,
    `Producer gate allowed/blocked: ${allowed}/${blocked}`,
    `QA: ${report.qa.status}`,
    `Phase52D readiness: ${report.phase52DReadiness}`,
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

export function readMultiAgentDryRunPackageScripts(): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
    return pkg.scripts ?? {}
  } catch {
    return {}
  }
}

function readLatestExecutionReport(): MultiAgentDryRunExecutionReport | undefined {
  if (!existsSync(MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(MULTI_AGENT_DRY_RUN_LOCAL_REPORT_PATH, 'utf8')) as MultiAgentDryRunExecutionReport
  } catch {
    return undefined
  }
}
