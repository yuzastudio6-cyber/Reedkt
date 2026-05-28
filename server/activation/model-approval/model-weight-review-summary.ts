import { listModelApprovalCandidates } from './model-candidate-registry'
import { listModelLicenseEvidence } from './model-license-evidence'

export function buildModelWeightReviewSummary() {
  const candidates = listModelApprovalCandidates()
  const evidence = listModelLicenseEvidence()
  const approvedCandidate = candidates.find((candidate) => candidate.candidateId === 'systran_faster_whisper_tiny')

  return {
    reportId: 'activation-phase-26-model-weight-review-summary',
    approvedCandidate: approvedCandidate?.modelName,
    approvedScope: approvedCandidate?.approvedFor ?? [],
    evidenceRecords: evidence.length,
    blockedCandidates: candidates.filter((candidate) => candidate.status === 'blocked').map((candidate) => candidate.modelName),
    evaluatedOnlyCandidates: candidates.filter((candidate) => candidate.status === 'evaluated_only').map((candidate) => candidate.modelName),
    modelDownloadExecuted: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeModelWeightReviewSummary(summary: ReturnType<typeof buildModelWeightReviewSummary>): string {
  return [
    `Model weight review summary: ${summary.reportId}`,
    `Approved candidate: ${summary.approvedCandidate ?? '(none)'}`,
    `Approved scope: ${summary.approvedScope.join(', ') || '(none)'}`,
    `Evidence records: ${summary.evidenceRecords}`,
    `Blocked candidates: ${summary.blockedCandidates.length}`,
    `Evaluated-only candidates: ${summary.evaluatedOnlyCandidates.length}`,
    `Model download executed: ${summary.modelDownloadExecuted}`,
    `Production ready allowed: ${summary.productionReadyAllowed}`,
    `External beta allowed: ${summary.externalBetaAllowed}`,
    `Real user media testing allowed: ${summary.realUserMediaTestingAllowed}`,
  ].join('\n')
}
