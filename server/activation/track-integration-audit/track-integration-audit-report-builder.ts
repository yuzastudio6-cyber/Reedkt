import { existsSync, readFileSync } from 'node:fs'
import { getApprovedTrackIntegrationAuditEvidence } from './approved-track-integration-audit-evidence'
import { buildTrackIntegrationDocsReconciliation, buildTrackIntegrationRegistryReconciliation } from './track-integration-audit-consistency'
import { buildTrackIntegrationOwnershipMatrix } from './track-integration-audit-ownership'
import { trackIntegrationAuditConfig } from './track-integration-audit-policy'
import { buildTrackIntegrationTrackASummary } from './track-integration-audit-track-a-resolver'
import { buildTrackIntegrationTrackBSummary } from './track-integration-audit-track-b-resolver'
import type {
  ApprovedTrackIntegrationAuditEvidence,
  TrackIntegrationAuditExecutionReport,
  TrackIntegrationAuditReport,
  TrackIntegrationReadinessDecision,
} from './track-integration-audit-types'

export const TRACK_INTEGRATION_AUDIT_LOCAL_REPORT_PATH = 'activation-logs/track-integration-audit/phase47a/job-execution/phase47a-report.json'

export function buildTrackIntegrationAuditReport(input: {
  executionReport?: TrackIntegrationAuditExecutionReport
  reportPath?: string
} = {}): TrackIntegrationAuditReport {
  const approvedEvidence = getApprovedTrackIntegrationAuditEvidence()
  const executionReport = input.executionReport ?? readTrackIntegrationAuditExecutionReport(input.reportPath ?? TRACK_INTEGRATION_AUDIT_LOCAL_REPORT_PATH)
  const trackA = executionReport?.trackA ?? buildTrackIntegrationTrackASummary()
  const trackB = executionReport?.trackB ?? buildTrackIntegrationTrackBSummary()
  const ownershipMatrix = executionReport?.ownershipMatrix ?? buildTrackIntegrationOwnershipMatrix()
  const registryReconciliation = executionReport?.registryReconciliation ?? buildTrackIntegrationRegistryReconciliation()
  const docsReconciliation = executionReport?.docsReconciliation ?? buildTrackIntegrationDocsReconciliation()
  const readinessDecision = executionReport?.readinessDecision ?? buildIntegrationReadinessDecision(trackA, trackB)
  const blockers = executionReport
    ? executionReport.blockers
    : [
        ...approvedEvidence.blockers,
        ...(trackA.status === 'ready' ? [] : trackA.blockers),
        ...(trackB.status === 'partial' ? [] : trackB.blockers),
        ...ownershipMatrix.conflicts,
        ...Object.values(registryReconciliation).flatMap((check) => check.blockers),
        ...Object.values(docsReconciliation).flatMap((check) => check.blockers),
      ]
  const warnings = Array.from(new Set([
    ...approvedEvidence.warnings,
    ...trackA.warnings,
    ...trackB.warnings,
    ...(executionReport?.warnings ?? []),
  ]))
  const auditCompleted = executionReport?.ok === true || approvedEvidence.status === 'completed'

  return {
    reportId: 'activation-phase-47a-track-integration-audit',
    createdAt: new Date().toISOString(),
    config: trackIntegrationAuditConfig,
    approvedEvidence,
    executionReport,
    status: auditCompleted ? 'completed' : blockers.length ? 'blocked' : 'planned',
    trackA,
    trackB,
    ownershipMatrix,
    registryReconciliation,
    docsReconciliation,
    readinessDecision,
    blockers: Array.from(new Set(blockers)),
    warnings,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}

export function buildIntegrationReadinessDecision(
  trackA: Pick<TrackIntegrationAuditReport['trackA'], 'status'>,
  trackB: Pick<TrackIntegrationAuditReport['trackB'], 'status' | 'blockers'>,
): TrackIntegrationReadinessDecision {
  if (trackA.status !== 'ready') {
    return {
      status: 'blocked',
      reason: 'System-level internal testing gate is blocked because Track A is not ready.',
      remainingBlockers: ['Track A Phase 45F readiness is not ready.'],
    }
  }
  if (trackB.status !== 'partial') {
    return {
      status: 'blocked',
      reason: 'System-level internal testing gate is blocked because Track B evidence is missing or ambiguous.',
      remainingBlockers: trackB.blockers,
    }
  }
  return {
    status: 'blocked',
    reason: 'Track A is ready and Track B is explicitly partial, but full system-level internal testing remains blocked until Track B VLM is resolved or explicitly excluded in a later approval phase.',
    remainingBlockers: [
      'Track B VLM Phase 39C remains blocked on L4/vLLM CUDA OOM before generated fixture inference.',
      'Demucs remains blocked until pretrained-model license/provenance is approved; keep it outside active runtime/download scope.',
    ],
  }
}

export function summarizeTrackIntegrationAuditReport(report: TrackIntegrationAuditReport): string {
  return [
    `Track integration audit report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track A: ${report.trackA.status} - ${report.trackA.summary}`,
    `Track B: ${report.trackB.status} - ${report.trackB.summary}`,
    `Integration readiness: ${report.readinessDecision.status}`,
    `Integration readiness reason: ${report.readinessDecision.reason}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    '',
    'Track A evidence:',
    ...report.trackA.evidence.map((item) => `- ${item.phase} ${item.label}: ${item.status}; run=${item.runId ?? 'n/a'}`),
    '',
    'Track B evidence:',
    ...report.trackB.evidence.map((item) => `- ${item.phase} ${item.label}: ${item.status}; run=${item.runId ?? 'n/a'}; blockers=${item.blockers.length}`),
    '',
    'Remaining integration blockers:',
    ...(report.readinessDecision.remainingBlockers.length ? report.readinessDecision.remainingBlockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Audit blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function readTrackIntegrationAuditExecutionReport(path: string): TrackIntegrationAuditExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as TrackIntegrationAuditExecutionReport
}

export function trackIntegrationAuditEvidenceToTypeScript(evidence: ApprovedTrackIntegrationAuditEvidence): string {
  return `import type { ApprovedTrackIntegrationAuditEvidence } from './track-integration-audit-types'\n\nexport const approvedTrackIntegrationAuditEvidence: ApprovedTrackIntegrationAuditEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedTrackIntegrationAuditEvidence(): ApprovedTrackIntegrationAuditEvidence {\n  return {\n    ...approvedTrackIntegrationAuditEvidence,\n    trackAReadiness: { ...approvedTrackIntegrationAuditEvidence.trackAReadiness },\n    trackBReadiness: { ...approvedTrackIntegrationAuditEvidence.trackBReadiness },\n    integrationReadiness: {\n      ...approvedTrackIntegrationAuditEvidence.integrationReadiness,\n      remainingBlockers: [...approvedTrackIntegrationAuditEvidence.integrationReadiness.remainingBlockers],\n    },\n    blockers: [...approvedTrackIntegrationAuditEvidence.blockers],\n    warnings: [...approvedTrackIntegrationAuditEvidence.warnings],\n  }\n}\n`
}
