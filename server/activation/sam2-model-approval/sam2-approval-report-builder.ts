import { sam2FutureScope } from './sam2-future-scope'
import { sam2LicenseReview } from './sam2-license-review'
import { sam2ModelApprovalCommandPlans, sam2ModelApprovalPolicy } from './sam2-model-approval-policy'
import { sam2ModelEvidence } from './sam2-model-evidence'
import { sam2RiskRegister } from './sam2-risk-register'
import type { Sam2ApprovalReport } from './sam2-model-approval-types'

export function buildSam2ModelApprovalReport(): Sam2ApprovalReport {
  const blockerRisks = sam2RiskRegister
    .filter((risk) => risk.severity === 'blocker')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)
  const warningRisks = sam2RiskRegister
    .filter((risk) => risk.severity === 'warning')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)

  const blockers = [
    ...blockerRisks,
    ...sam2LicenseReview.evidenceRequired.map((item) => `license_review_required: ${item}`),
  ]

  return {
    phase: '35A',
    reportId: 'activation-phase-35a-sam2-model-approval',
    createdAt: new Date().toISOString(),
    status: 'blocked_pending_human_review',
    modelEvidence: sam2ModelEvidence,
    licenseReview: sam2LicenseReview,
    approvalDecision: sam2ModelApprovalPolicy.approvalDecision,
    riskRegister: sam2RiskRegister,
    futureScope: sam2FutureScope,
    commandPlans: sam2ModelApprovalCommandPlans,
    blockers,
    warnings: Array.from(new Set([
      ...warningRisks,
      'SAM2 is appropriate to continue evaluating for temporal mask tracking, but only as a future staging-controlled workflow.',
      'BiRefNet remains the only mask model runtime-proven so far, and only for generated image plus one representative real-video frame.',
    ])),
    phase35BReadiness: {
      ready: false,
      nextPhase: 'Phase 35B SAM2 download/load',
      blockers: [
        'Human legal/model approval is not recorded for SAM2.',
        'No exact SAM2 checkpoint is approved.',
        'No SAM2 checkpoint checksum is recorded.',
        'No private SAM2 model storage artifact exists.',
      ],
      criteria: [
        'Model/source/license/provenance evidence is sufficient.',
        'Human legal/model approval is recorded or explicitly waived by project policy.',
        'Exact checkpoint candidate is selected.',
        'Private storage plan exists.',
        'Checksum plan exists.',
        'All execution remains blocked until Phase 35B.',
      ],
    },
    sam2DownloadAllowed: false,
    sam2RuntimeAllowed: false,
    sam2TemporalTrackingAllowed: false,
    sam2FullVideoMaskAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeSam2ModelApprovalReport(report: Sam2ApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Approval decision: ${report.approvalDecision}`,
    `Model family: ${report.modelEvidence.modelFamily}`,
    `Candidates: ${report.modelEvidence.candidates.map((candidate) => candidate.modelName).join(', ')}`,
    `License identified: ${report.licenseReview.licenseIdentified}`,
    `Human approval recorded: ${report.licenseReview.humanApprovalRecorded}`,
    `SAM2 planning recommendation allowed: ${report.futureScope.sam2PlanningRecommendationAllowed}`,
    `SAM2 download allowed: ${report.sam2DownloadAllowed}`,
    `SAM2 runtime allowed: ${report.sam2RuntimeAllowed}`,
    `SAM2 temporal tracking allowed: ${report.sam2TemporalTrackingAllowed}`,
    `Full-video mask allowed: ${report.sam2FullVideoMaskAllowed}`,
    `Full-video text-behind-subject allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Phase 35B ready: ${report.phase35BReadiness.ready}`,
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
