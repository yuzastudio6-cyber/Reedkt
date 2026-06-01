import { audioAiFutureScope } from './audio-ai-future-scope'
import { audioAiLicenseReviews } from './audio-ai-license-review'
import { audioAiApprovalCommandPlans, audioAiApprovalPolicy } from './audio-ai-approval-policy'
import { audioAiEvidenceReview } from './audio-ai-tool-evidence'
import { audioAiRiskRegister } from './audio-ai-risk-register'
import type { AudioAiApprovalReport } from './audio-ai-approval-types'

export function buildAudioAiApprovalReport(): AudioAiApprovalReport {
  const blockerRisks = audioAiRiskRegister
    .filter((risk) => risk.severity === 'blocker')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)
  const warningRisks = audioAiRiskRegister
    .filter((risk) => risk.severity === 'warning')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)
  const licenseRequirements = audioAiLicenseReviews.flatMap((review) =>
    review.evidenceRequired.map((item) => `${review.toolId}_license_review_required: ${item}`),
  )

  return {
    phase: '36A',
    reportId: 'activation-phase-36a-audio-ai-approval',
    createdAt: new Date().toISOString(),
    status: 'blocked_missing_artifact_evidence',
    approvalDecision: audioAiApprovalPolicy.approvalDecision,
    evidenceReview: audioAiEvidenceReview,
    licenseReviews: audioAiLicenseReviews,
    riskRegister: audioAiRiskRegister,
    futureScope: audioAiFutureScope,
    commandPlans: audioAiApprovalCommandPlans,
    blockers: Array.from(new Set([
      ...blockerRisks,
      ...licenseRequirements,
      'phase36b_blocked_missing_artifact_evidence: exact DeepFilterNet artifact source and checksum plan are not selected.',
    ])),
    warnings: Array.from(new Set([
      ...warningRisks,
      'DeepFilterNet is the first planning recommendation, but Phase 36A does not approve downloads or runtime.',
      'RNNoise remains fallback planning only because build-time model download behavior must be pinned.',
      'Demucs remains restricted/deferred because pretrained model provenance and source-separation scope need additional review.',
    ])),
    phase36BReadiness: {
      ready: false,
      nextPhase: 'Phase 36B audio AI download/load',
      status: 'blocked_missing_artifact_evidence',
      blockers: [
        'Exact DeepFilterNet model/tool artifact source is not selected.',
        'No DeepFilterNet artifact checksum is recorded.',
        'No private audio AI model storage artifact exists.',
        'No runtime no-network-download constraint is proven.',
      ],
      criteria: [
        'DeepFilterNet remains the first planning recommendation.',
        'Exact official artifact source is identified.',
        'Checksum plan exists.',
        'Private staging GCS target exists.',
        'Dependency/license review is complete.',
        'All execution remains blocked until Phase 36B.',
      ],
    },
    audioAiDownloadAllowed: false,
    audioAiRuntimeAllowed: false,
    realVideoAudioAiCleanupAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeAudioAiApprovalReport(report: AudioAiApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Approval decision: ${report.approvalDecision}`,
    `Planning recommendation: ${report.futureScope.audioAiPlanningRecommendation}`,
    `Tools: ${report.evidenceReview.tools.map((tool) => `${tool.toolName} (${tool.currentStatus})`).join(', ')}`,
    `No model weights downloaded: ${report.evidenceReview.noModelWeightsDownloaded}`,
    `No runtime executed: ${report.evidenceReview.noRuntimeExecuted}`,
    `No audio processed: ${report.evidenceReview.noAudioProcessed}`,
    `Audio AI download allowed: ${report.audioAiDownloadAllowed}`,
    `Audio AI runtime allowed: ${report.audioAiRuntimeAllowed}`,
    `Real-video audio AI cleanup allowed: ${report.realVideoAudioAiCleanupAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Phase 36B ready: ${report.phase36BReadiness.ready}`,
    `Phase 36B readiness status: ${report.phase36BReadiness.status}`,
    '',
    'Future scope:',
    ...report.futureScope.phaseSequence.map((phase) => `- Phase ${phase.phase}: ${phase.name}`),
    '',
    'Blockers:',
    ...report.blockers.map((blocker) => `- ${blocker}`),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}
