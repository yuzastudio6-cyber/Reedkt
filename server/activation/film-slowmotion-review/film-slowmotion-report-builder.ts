import { listFilmSlowMotionFutureCommandPlans } from './film-slowmotion-command-plan'
import { getFilmSlowMotionModelEvidence } from './film-slowmotion-model-evidence'
import { getFilmSlowMotionPolicyGates, PHASE_34D_ENHANCEMENT_SAMPLE_REFERENCE } from './film-slowmotion-review-policy'
import { listFilmSlowMotionRisks } from './film-slowmotion-risk-register'
import { getFilmSlowMotionFutureTestScope } from './film-slowmotion-test-scope'
import type { FilmSlowMotionReviewReport } from './film-slowmotion-review-types'

export const PHASE_34E_BASE_BRANCH = 'codex/rp-activation-34d-real-video-enhancement-sample'

export const PHASE_34E_FUTURE_READINESS_CRITERIA = [
  'Human approves the need for slow motion.',
  'Exact FILM source and checkpoint are selected.',
  'License and provenance are reviewed.',
  'Checkpoint checksum is known and recorded.',
  'Private model storage path is planned.',
  'Runtime has no external model download path.',
  'A bounded short-clip test scope is approved.',
  'QA gates are defined for motion artifacts, sync, flicker, and subject deformation.',
]

export function buildFilmSlowMotionReviewReport(): FilmSlowMotionReviewReport {
  const policy = getFilmSlowMotionPolicyGates()
  const modelEvidence = getFilmSlowMotionModelEvidence()
  const riskRegister = listFilmSlowMotionRisks()
  const commandPlans = listFilmSlowMotionFutureCommandPlans()
  const blockers = [
    ...modelEvidence.blockers,
    ...riskRegister.filter((risk) => risk.severity === 'blocker').map((risk) => `${risk.riskId}: ${risk.requiredEvidence}`),
  ]
  const warnings = riskRegister.filter((risk) => risk.severity === 'warning').map((risk) => `${risk.riskId}: ${risk.requiredEvidence}`)

  return {
    phase: '34E',
    status: 'review_complete',
    base: PHASE_34E_BASE_BRANCH,
    patchType: 'non-mutating FILM/slow-motion review gate',
    phase34DReference: PHASE_34D_ENHANCEMENT_SAMPLE_REFERENCE,
    policy,
    modelEvidence,
    riskRegister,
    futureBoundedTestScope: getFilmSlowMotionFutureTestScope(),
    commandPlans,
    blockers,
    warnings,
    futureReadinessCriteria: [...PHASE_34E_FUTURE_READINESS_CRITERIA],
    packageLockChangeRequired: false,
  }
}

export function summarizeFilmSlowMotionReviewPlan(report = buildFilmSlowMotionReviewReport()): string {
  return [
    `Phase: ${report.phase}`,
    `Status: blocked_for_execution / ${report.status}`,
    `Base: ${report.base}`,
    `FILM status: ${report.modelEvidence.currentStatus}`,
    `Slow motion allowed: ${report.policy.slowMotionAllowed}`,
    `FILM download allowed: ${report.policy.filmDownloadAllowed}`,
    `FILM runtime allowed: ${report.policy.filmRuntimeAllowed}`,
    `Full-video interpolation allowed: ${report.policy.fullVideoInterpolationAllowed}`,
    `Future bounded test: one approved clip, <= ${report.futureBoundedTestScope.maxDurationSeconds}s, blocked until human approval`,
    '',
    'Future command plans:',
    ...report.commandPlans.map((plan) => `- ${plan.planId}: allowedInPhase34E=${plan.allowedInPhase34E}, textOnlyByDefault=${plan.textOnlyByDefault}, requiresHumanApproval=${plan.requiresHumanApproval}`),
  ].join('\n')
}

export function renderFilmSlowMotionReviewReportMarkdown(report = buildFilmSlowMotionReviewReport()): string {
  return [
    '# Activation Phase 34E FILM Slow-Motion Review Results',
    '',
    `- phase: ${report.phase}`,
    `- status: blocked_for_execution / ${report.status}`,
    `- base: ${report.base}`,
    `- patchType: ${report.patchType}`,
    `- FILM status: ${report.modelEvidence.currentStatus}`,
    `- slowMotionAllowed: ${report.policy.slowMotionAllowed}`,
    `- filmDownloadAllowed: ${report.policy.filmDownloadAllowed}`,
    `- filmRuntimeAllowed: ${report.policy.filmRuntimeAllowed}`,
    `- modelApprovalRequired: ${report.policy.modelApprovalRequired}`,
    `- checkpointApprovalRequired: ${report.policy.checkpointApprovalRequired}`,
    `- licenseReviewRequired: ${report.policy.licenseReviewRequired}`,
    `- checksumRequired: ${report.policy.checksumRequired}`,
    `- privateStorageRequired: ${report.policy.privateStorageRequired}`,
    `- futureBoundedClipTestRequired: ${report.policy.futureBoundedClipTestRequired}`,
    `- humanVisualReviewRequired: ${report.policy.humanVisualReviewRequired}`,
    `- productionReadyAllowed: ${report.policy.productionReadyAllowed}`,
    `- externalBetaAllowed: ${report.policy.externalBetaAllowed}`,
    `- broadRealUserMediaAllowed: ${report.policy.broadRealUserMediaAllowed}`,
    `- fullVideoInterpolationAllowed: ${report.policy.fullVideoInterpolationAllowed}`,
    `- fullVideoEnhancementAllowed: ${report.policy.fullVideoEnhancementAllowed}`,
    `- fullFrameEnhancementAllowed: ${report.policy.fullFrameEnhancementAllowed}`,
    `- providersAllowed: ${report.policy.providersAllowed}`,
    `- revideoAllowed: ${report.policy.revideoAllowed}`,
    '',
    '## Phase 34D Reference',
    '',
    `- Run ID: ${report.phase34DReference.runId}`,
    `- Source Phase 33D run: ${report.phase34DReference.sourcePhase33DRunId}`,
    `- Source frame: ${report.phase34DReference.sourceFrameGcsUri}`,
    `- Source frame dimensions: ${report.phase34DReference.sourceFrameDimensions.width}x${report.phase34DReference.sourceFrameDimensions.height}`,
    `- Sample crop: ${report.phase34DReference.sampleCrop.width}x${report.phase34DReference.sampleCrop.height} at x=${report.phase34DReference.sampleCrop.x}, y=${report.phase34DReference.sampleCrop.y}`,
    `- Enhanced output: ${report.phase34DReference.enhancedOutputDimensions.width}x${report.phase34DReference.enhancedOutputDimensions.height}`,
    `- Model: ${report.phase34DReference.model}`,
    `- Bounded sample only: ${report.phase34DReference.boundedSampleOnly}`,
    '',
    '## Model Evidence',
    '',
    `- Tool: ${report.modelEvidence.toolName}`,
    `- Likely upstream: ${report.modelEvidence.likelyUpstream}`,
    `- Intended capability: ${report.modelEvidence.intendedCapability}`,
    `- FILM approved: ${report.modelEvidence.filmApproved}`,
    `- Checkpoint approved: ${report.modelEvidence.checkpointApproved}`,
    `- Approved checksum recorded: ${report.modelEvidence.approvedChecksumRecorded}`,
    `- Approved storage path recorded: ${report.modelEvidence.approvedStoragePathRecorded}`,
    `- Approved runtime image/job: ${report.modelEvidence.approvedRuntimeImageOrJob}`,
    '',
    '## Blockers',
    '',
    ...report.blockers.map((blocker) => `- ${blocker}`),
    '',
    '## Warnings',
    '',
    ...report.warnings.map((warning) => `- ${warning}`),
    '',
    '## Future Readiness Criteria',
    '',
    'Ready only after:',
    '',
    ...report.futureReadinessCriteria.map((criterion) => `- ${criterion}`),
    '',
    '## Future Command Plans',
    '',
    ...report.commandPlans.map((plan) => `- ${plan.planId}: ${plan.description} allowedInPhase34E=${plan.allowedInPhase34E}; textOnlyByDefault=${plan.textOnlyByDefault}; requiresHumanApproval=${plan.requiresHumanApproval}; blockedReason=${plan.blockedReason}`),
    '',
    '## Phase 34E Non-Execution Statement',
    '',
    'No model download, model execution, slow motion, GPU job, media processing, Cloud Run job, Docker build or push, GCP mutation, provider call, public URL, secret, package lock update, production unlock, external beta unlock, broad real media unlock, full-video enhancement, full-frame enhancement, full-video interpolation, or Revideo production path occurred in Phase 34E.',
  ].join('\n')
}
