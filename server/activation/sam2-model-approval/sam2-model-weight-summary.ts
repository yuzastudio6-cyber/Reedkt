import { buildSam2ModelApprovalReport } from './sam2-approval-report-builder'
import { getApprovedSam2ModelDownloadEvidence } from '../sam2-model-download/approved-sam2-model-download-evidence'

export function buildSam2ModelWeightSummary(): string {
  const report = buildSam2ModelApprovalReport()
  const downloadEvidence = getApprovedSam2ModelDownloadEvidence()
  const verified = downloadEvidence.status === 'verified'
  return [
    'SAM2 model weight summary',
    `Approval decision: ${report.approvalDecision}`,
    `Phase 35B Codex license/download decision: ${downloadEvidence.codexLicenseDecision}`,
    `Candidates: ${report.modelEvidence.candidates.length}`,
    ...report.modelEvidence.candidates.map((candidate) => `- ${candidate.candidateId}: ${candidate.modelName} (${candidate.currentStatus})`),
    '',
    `Approved checkpoint: ${verified ? downloadEvidence.checkpointFileName : 'none'}`,
    `Approved checkpoint checksum: ${downloadEvidence.checkpointSha256 ?? 'none'}`,
    `Approved config checksum: ${downloadEvidence.configSha256 ?? 'none'}`,
    `Approved private storage path: ${verified ? downloadEvidence.targetGcsPath : 'none'}`,
    'Approved runtime image/job: none',
    `SAM2 download allowed: ${report.sam2DownloadAllowed}`,
    `SAM2 runtime allowed: ${report.sam2RuntimeAllowed}`,
    `SAM2 temporal tracking allowed: ${report.sam2TemporalTrackingAllowed}`,
    `Phase 35B download status: ${downloadEvidence.status}`,
    `Phase 35C generated/synthetic runtime planning ready: ${verified}`,
    ...(verified
      ? ['- SAM2.1 tiny checkpoint/config are verified in private staging storage.']
      : report.phase35BReadiness.blockers.map((blocker) => `- ${blocker}`)),
  ].join('\n')
}
