import { existsSync, readFileSync } from 'node:fs'
import { getApprovedVlmBlockerResolutionEvidence } from './approved-vlm-blocker-resolution-evidence'
import { resolvePhase47AEvidence, resolveVlmBlockerEvidence } from './vlm-blocker-evidence-resolver'
import { buildVlmExclusionPolicy } from './vlm-exclusion-policy'
import { vlmBlockerResolutionConfig } from './vlm-blocker-resolution-policy'
import { buildVlmBlockerResolutionQaSummary } from './vlm-blocker-qa-summary'
import { buildVlmRuntimeDecision } from './vlm-runtime-decision'
import { buildVlmSystemReadinessImpact } from './vlm-system-readiness-impact'
import type {
  ApprovedVlmBlockerResolutionEvidence,
  VlmBlockerResolutionExecutionReport,
  VlmBlockerResolutionReport,
} from './vlm-blocker-resolution-types'

export const VLM_BLOCKER_RESOLUTION_LOCAL_REPORT_PATH = 'activation-logs/vlm-blocker-resolution/phase47b/job-execution/phase47b-report.json'

export function buildVlmBlockerResolutionReport(input: {
  executionReport?: VlmBlockerResolutionExecutionReport
  reportPath?: string
} = {}): VlmBlockerResolutionReport {
  const approvedEvidence = getApprovedVlmBlockerResolutionEvidence()
  const executionReport = input.executionReport ?? readVlmBlockerResolutionExecutionReport(input.reportPath ?? VLM_BLOCKER_RESOLUTION_LOCAL_REPORT_PATH)
  const phase47a = resolvePhase47AEvidence()
  const blockerEvidence = executionReport?.blockerEvidence ?? resolveVlmBlockerEvidence()
  const runtimeDecision = executionReport?.decision ?? buildVlmRuntimeDecision()
  const exclusionPolicy = executionReport?.exclusionPolicy ?? buildVlmExclusionPolicy(blockerEvidence)
  const systemReadinessImpact = executionReport?.systemReadinessImpact ?? buildVlmSystemReadinessImpact(exclusionPolicy)
  const qa = executionReport?.qa ?? buildVlmBlockerResolutionQaSummary({
    phase47aEvidencePassed: phase47a.blockers.length === 0,
    blockerEvidence,
    runtimeDecision,
    exclusionPolicy,
    systemReadinessImpact,
    publicAccessBlocked: true,
    productionBetaGatesBlocked: true,
  })
  const blockers = executionReport ? executionReport.blockers : [...approvedEvidence.blockers, ...phase47a.blockers, ...qa.blockers]
  const warnings = Array.from(new Set([
    ...approvedEvidence.warnings,
    ...blockerEvidence.warnings,
    ...qa.warnings,
    ...(executionReport?.warnings ?? []),
  ]))
  const completed = executionReport?.ok === true || approvedEvidence.status === 'completed'

  return {
    reportId: 'activation-phase-47b-vlm-blocker-resolution',
    createdAt: new Date().toISOString(),
    config: vlmBlockerResolutionConfig,
    approvedEvidence,
    executionReport,
    status: completed ? 'completed' : blockers.length ? 'blocked' : 'planned',
    decision: runtimeDecision.decision,
    blockerEvidence,
    runtimeDecision,
    exclusionPolicy,
    systemReadinessImpact,
    qa,
    blockers: Array.from(new Set(blockers)),
    warnings,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeVlmBlockerResolutionReport(report: VlmBlockerResolutionReport): string {
  return [
    `VLM blocker resolution report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `VLM blocker: ${report.blockerEvidence.exactBlocker}`,
    `Runtime fix: ${report.runtimeDecision.runtimeFixAttempted ? 'attempted' : 'not attempted'} - ${report.runtimeDecision.runtimeFixResult}`,
    `Exclusion applied: ${report.exclusionPolicy.vlmIncludedInInitialInternalTesting === false}`,
    `Phase47C readiness: ${report.systemReadinessImpact.phase47CReadiness}`,
    `System testing may proceed without VLM: ${report.systemReadinessImpact.systemLevelInternalTestingMayProceedWithoutVlm}`,
    `Report artifact: ${report.approvedEvidence.phase47bReportUri ?? report.executionReport?.artifacts.find((artifact) => artifact.id === 'phase47b_report')?.gcsUri ?? 'not recorded'}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Known future actions:',
    ...report.exclusionPolicy.requiredFutureAction.map((action) => `- ${action}`),
  ].join('\n')
}

export function readVlmBlockerResolutionExecutionReport(path: string): VlmBlockerResolutionExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as VlmBlockerResolutionExecutionReport
}

export function vlmBlockerResolutionEvidenceToTypeScript(evidence: ApprovedVlmBlockerResolutionEvidence): string {
  return `import type { ApprovedVlmBlockerResolutionEvidence } from './vlm-blocker-resolution-types'\n\nexport const approvedVlmBlockerResolutionEvidence: ApprovedVlmBlockerResolutionEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedVlmBlockerResolutionEvidence(): ApprovedVlmBlockerResolutionEvidence {\n  return {\n    ...approvedVlmBlockerResolutionEvidence,\n    blockers: [...approvedVlmBlockerResolutionEvidence.blockers],\n    warnings: [...approvedVlmBlockerResolutionEvidence.warnings],\n  }\n}\n`
}
