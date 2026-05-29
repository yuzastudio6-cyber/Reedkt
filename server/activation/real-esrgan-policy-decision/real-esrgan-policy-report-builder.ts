import { phase34DRealEsrganEvidence } from './real-esrgan-phase34d-evidence'
import { realEsrganNextSampleScope } from './real-esrgan-next-sample-scope'
import { realEsrganPolicyCommandPlans, realEsrganPolicyDecision } from './real-esrgan-policy-decision-policy'
import { realEsrganPolicyRiskRegister } from './real-esrgan-risk-register'
import { realEsrganHumanVisualReviewPolicy } from './real-esrgan-visual-review-policy'
import type { RealEsrganPolicyDecisionReport } from './real-esrgan-policy-decision-types'

export function buildRealEsrganPolicyDecisionReport(): RealEsrganPolicyDecisionReport {
  const blockers = realEsrganPolicyRiskRegister
    .filter((risk) => risk.severity === 'blocker')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)
  const warnings = [
    ...realEsrganPolicyRiskRegister
      .filter((risk) => risk.severity === 'warning')
      .map((risk) => `${risk.riskId}: ${risk.currentStatus}`),
    ...phase34DRealEsrganEvidence.qaSummary.warnings,
  ]

  return {
    phase: '34E',
    reportId: 'activation-phase-34e-real-esrgan-policy-decision',
    createdAt: new Date().toISOString(),
    status: realEsrganPolicyDecision.status,
    phase34DEvidence: phase34DRealEsrganEvidence,
    humanVisualReview: realEsrganHumanVisualReviewPolicy,
    riskRegister: realEsrganPolicyRiskRegister,
    nextSampleScope: realEsrganNextSampleScope,
    commandPlans: realEsrganPolicyCommandPlans,
    decisionSummary: [
      'Real-ESRGAN remains limited to the completed Phase 34D bounded sample evidence.',
      'Full-frame enhancement is not allowed.',
      'Full-video enhancement and blind full-video enhancement are not allowed.',
      'Human visual review is required before any broader Real-ESRGAN scope is planned.',
      'A future additional bounded sample may be planned only as a separate approved phase.',
    ],
    allowedNextPlanning: [
      'human visual review of the Phase 34D before/after sample',
      'one additional bounded crop/sample from the existing approved chain, only after separate approval',
      'one selected short segment frame-sample sequence, only after separate approval and temporal QA definition',
      'never blind full-video enhancement',
    ],
    blockers,
    warnings: Array.from(new Set(warnings)),
    phase35AReadiness: {
      ready: true,
      nextPhase: realEsrganPolicyDecision.nextPhase,
      criteria: [
        'Phase 34E policy report exists.',
        'Phase 34D evidence is linked.',
        'No broader Real-ESRGAN scope was unlocked.',
        'Roadmap points next to SAM2 approval workflow.',
        'Production, external beta, and broad media remain blocked.',
      ],
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    realEsrganFullFrameAllowed: false,
    realEsrganFullVideoAllowed: false,
    blindFullVideoEnhancementAllowed: false,
    slowMotionAllowed: false,
    filmAllowed: false,
    providerAllowed: false,
    publicAccessAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeRealEsrganPolicyDecisionReport(report: RealEsrganPolicyDecisionReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Phase 34D run: ${report.phase34DEvidence.phase34DRunId}`,
    `Source Phase 33D run: ${report.phase34DEvidence.sourcePhase33DRunId}`,
    `Source frame: ${report.phase34DEvidence.sourceFrameGcsUri}`,
    `Sample crop: ${report.phase34DEvidence.sampleCrop.width}x${report.phase34DEvidence.sampleCrop.height} at x=${report.phase34DEvidence.sampleCrop.x}, y=${report.phase34DEvidence.sampleCrop.y}`,
    `Enhanced sample: ${report.phase34DEvidence.enhancedSample.width}x${report.phase34DEvidence.enhancedSample.height}`,
    `Model: ${report.phase34DEvidence.model.name}`,
    `Human visual review required: ${report.humanVisualReview.humanVisualReviewRequired}`,
    `Human visual review completed: ${report.humanVisualReview.humanVisualReviewCompleted}`,
    `Full-frame enhancement allowed: ${report.realEsrganFullFrameAllowed}`,
    `Full-video enhancement allowed: ${report.realEsrganFullVideoAllowed}`,
    `Blind full-video enhancement allowed: ${report.blindFullVideoEnhancementAllowed}`,
    `Additional bounded sample planning allowed: ${report.nextSampleScope.realEsrganAdditionalBoundedSamplePlanningAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Roadmap next phase: ${report.phase35AReadiness.nextPhase}`,
    '',
    'Decision:',
    ...report.decisionSummary.map((item) => `- ${item}`),
    '',
    'Blockers:',
    ...report.blockers.map((item) => `- ${item}`),
    '',
    'Warnings:',
    ...report.warnings.map((item) => `- ${item}`),
  ].join('\n')
}
