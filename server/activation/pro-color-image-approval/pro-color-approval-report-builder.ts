import { proColorImageApprovalPolicy, proColorImageCommandPlans } from './pro-color-image-approval-policy'
import { proColorImageFutureScope } from './pro-color-future-scope'
import { proColorImageLicenseReviews } from './pro-color-license-review'
import { proColorImageRiskRegister } from './pro-color-risk-register'
import { proColorImageToolEvidence } from './pro-color-tool-evidence'
import { proColorImageToolScopeOwnership } from './pro-color-tool-scope'
import type { ProColorImageApprovalReport } from './pro-color-image-approval-types'

export function buildProColorImageApprovalReport(): ProColorImageApprovalReport {
  const warningRisks = proColorImageRiskRegister
    .filter((risk) => risk.severity === 'warning')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)

  return {
    phase: '40A',
    reportId: 'activation-phase-40a-pro-color-image-approval',
    createdAt: new Date().toISOString(),
    track: 'A visual/video',
    status: 'approval_review_complete',
    baseBranch: proColorImageApprovalPolicy.actualBaseBranch,
    preferredBaseUnavailable: proColorImageApprovalPolicy.preferredBaseUnavailable,
    planningDecision: proColorImageApprovalPolicy.planningDecision,
    toolEvidence: proColorImageToolEvidence,
    licenseReviews: proColorImageLicenseReviews,
    toolScopeOwnership: proColorImageToolScopeOwnership,
    riskRegister: proColorImageRiskRegister,
    futureScope: proColorImageFutureScope,
    commandPlans: proColorImageCommandPlans,
    blockers: [],
    warnings: Array.from(new Set([
      ...warningRisks,
      'Preferred Phase 38E base branch was unavailable after fetch; Phase 40A is based on completed Phase 38D and records this fallback.',
      'Phase 40A approves staging planning only; runtime installation, media processing, Docker/GCP mutation, providers, Revideo, production, and beta remain blocked.',
      'Kornia is approved only for local helper/metric planning; model/provider-style Kornia features remain blocked.',
    ])),
    phase40BReadiness: {
      ready: true,
      nextPhase: 'Phase 40B generated-fixture pro color/image runtime verification',
      reason: 'Official OpenColorIO, OpenImageIO, and Kornia source/license evidence is clear enough for generated-fixture runtime planning only; Phase 40A does not install or execute any runtime.',
      blockers: [],
      criteria: [
        'Official source and license evidence is recorded for all three tools.',
        'Tool scope ownership is explicit: OCIO for color transforms, OIIO for image I/O and metadata, Kornia for local helper metrics, FFmpeg/FFprobe for existing media probe/extraction roles.',
        'Future command plans are text-only and blocked in Phase 40A.',
        'Phase 40B must use generated fixtures only and preserve private artifacts.',
        'Real-video, final delivery, providers, Revideo, production, beta, paid production, and broad media remain blocked.',
      ],
    },
    proColorImagePlanningAllowed: true,
    openColorIOPlanningAllowed: true,
    openImageIOPlanningAllowed: true,
    korniaPlanningAllowed: true,
    runtimeInstallAllowed: false,
    proColorImageRuntimeAllowed: false,
    generatedFixtureRuntimeAllowed: false,
    realVideoProColorAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeProColorImageApprovalReport(report: ProColorImageApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Track: ${report.track}`,
    `Status: ${report.status}`,
    `Codex decision: ${report.planningDecision}`,
    `Base branch: ${report.baseBranch}`,
    `Preferred Phase 38E base unavailable: ${report.preferredBaseUnavailable}`,
    '',
    'Tools:',
    ...report.toolEvidence.map((tool) => `- ${tool.displayName}: ${tool.licenseName}; ${tool.recommendedPhase40Role}`),
    '',
    `Pro color/image planning allowed: ${report.proColorImagePlanningAllowed}`,
    `OpenColorIO planning allowed: ${report.openColorIOPlanningAllowed}`,
    `OpenImageIO planning allowed: ${report.openImageIOPlanningAllowed}`,
    `Kornia planning allowed: ${report.korniaPlanningAllowed}`,
    `Runtime install allowed: ${report.runtimeInstallAllowed}`,
    `Pro color/image runtime allowed: ${report.proColorImageRuntimeAllowed}`,
    `Generated-fixture runtime allowed now: ${report.generatedFixtureRuntimeAllowed}`,
    `Real-video pro color allowed: ${report.realVideoProColorAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Phase 40B ready: ${report.phase40BReadiness.ready}`,
    `Phase 40B reason: ${report.phase40BReadiness.reason}`,
    '',
    'Future scope:',
    ...report.futureScope.phaseSequence.map((phase) => `- Phase ${phase.phase}: ${phase.name}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}
