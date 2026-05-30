import { filmFutureScope } from './film-future-scope'
import { filmLicenseReview } from './film-license-review'
import { filmSlowmotionApprovalPolicy, filmSlowmotionCommandPlans } from './film-slowmotion-approval-policy'
import { filmModelEvidence, getRecommendedFilmPhase38BArtifact } from './film-source-evidence'
import { filmRiskRegister } from './film-risk-register'
import type { FilmApprovalReport } from './film-slowmotion-approval-types'

export function buildFilmSlowmotionApprovalReport(): FilmApprovalReport {
  const warningRisks = filmRiskRegister
    .filter((risk) => risk.severity === 'warning')
    .map((risk) => `${risk.riskId}: ${risk.currentStatus}`)
  const recommendedArtifact = getRecommendedFilmPhase38BArtifact()

  return {
    phase: '38A',
    reportId: 'activation-phase-38a-film-slowmotion-approval',
    createdAt: new Date().toISOString(),
    track: 'A visual/video',
    status: 'approval_review_complete',
    modelEvidence: filmModelEvidence,
    licenseReview: filmLicenseReview,
    stagingPlanningDecision: filmSlowmotionApprovalPolicy.filmStagingPlanningDecision,
    recommendedPhase38BArtifact: recommendedArtifact,
    riskRegister: filmRiskRegister,
    futureScope: filmFutureScope,
    commandPlans: filmSlowmotionCommandPlans,
    blockers: [],
    warnings: Array.from(new Set([
      ...warningRisks,
      'FILM repository is archived/read-only; Phase 38C must pin and validate a dedicated runtime dependency stack.',
      'No FILM checkpoint checksum exists until Phase 38B downloads the approved artifact tree into temp storage and computes checksums.',
      'Phase 38A approves staging planning only; download, runtime, slow motion, media processing, production, and beta remain blocked.',
    ])),
    phase38BReadiness: {
      ready: true,
      nextPhase: 'Phase 38B FILM download/load',
      reason: 'Official FILM source/license/provenance evidence is clear enough for exact artifact download/load planning, and execution remains blocked until later phases.',
      blockers: [],
      criteria: [
        'Official source and license evidence is recorded.',
        'Exact first artifact candidate is selected: film_net/Style/saved_model from the official README Google Drive TF2 Saved Models folder.',
        'Private staging storage prefix is documented.',
        'Phase 38B must compute checksums and commit no model files.',
        'Runtime and media execution remain blocked until Phase 38C/38D.',
      ],
    },
    filmPlanningAllowed: filmSlowmotionApprovalPolicy.filmPlanningAllowed,
    filmDownloadAllowed: false,
    filmRuntimeAllowed: false,
    slowMotionAllowed: false,
    realVideoSlowMotionAllowed: false,
    fullVideoInterpolationAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeFilmSlowmotionApprovalReport(report: FilmApprovalReport): string {
  return [
    `Phase: ${report.phase}`,
    `Report: ${report.reportId}`,
    `Track: ${report.track}`,
    `Status: ${report.status}`,
    `Codex decision: ${report.stagingPlanningDecision}`,
    `Tool family: ${report.modelEvidence.toolFamily}`,
    `Official repo: ${report.modelEvidence.upstreamRepo}`,
    `Project page: ${report.modelEvidence.projectPage}`,
    `License: ${report.licenseReview.licenseName}`,
    `Repo archived/read-only: ${report.modelEvidence.repoArchivedReadOnly}`,
    `Recommended Phase38B artifact: ${report.recommendedPhase38BArtifact.modelPath}`,
    `Checkpoint source: ${report.recommendedPhase38BArtifact.sourceUrl}`,
    `Checksum status: ${report.recommendedPhase38BArtifact.checksumStatus}`,
    `Film planning allowed: ${report.filmPlanningAllowed}`,
    `Film download allowed: ${report.filmDownloadAllowed}`,
    `Film runtime allowed: ${report.filmRuntimeAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Real-video slow motion allowed: ${report.realVideoSlowMotionAllowed}`,
    `Full-video interpolation allowed: ${report.fullVideoInterpolationAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Phase 38B ready: ${report.phase38BReadiness.ready}`,
    `Phase 38B reason: ${report.phase38BReadiness.reason}`,
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
