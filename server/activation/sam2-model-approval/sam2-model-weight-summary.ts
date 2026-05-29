import { buildSam2ModelApprovalReport } from './sam2-approval-report-builder'

export function buildSam2ModelWeightSummary(): string {
  const report = buildSam2ModelApprovalReport()
  return [
    'SAM2 model weight summary',
    `Approval decision: ${report.approvalDecision}`,
    `Candidates: ${report.modelEvidence.candidates.length}`,
    ...report.modelEvidence.candidates.map((candidate) => `- ${candidate.candidateId}: ${candidate.modelName} (${candidate.currentStatus})`),
    '',
    'Approved checkpoint: none',
    'Approved checksum: none',
    'Approved private storage path: none',
    'Approved runtime image/job: none',
    `SAM2 download allowed: ${report.sam2DownloadAllowed}`,
    `SAM2 runtime allowed: ${report.sam2RuntimeAllowed}`,
    `SAM2 temporal tracking allowed: ${report.sam2TemporalTrackingAllowed}`,
    `Phase 35B ready: ${report.phase35BReadiness.ready}`,
    ...(report.phase35BReadiness.blockers.length
      ? report.phase35BReadiness.blockers.map((blocker) => `- ${blocker}`)
      : ['- none']),
  ].join('\n')
}
