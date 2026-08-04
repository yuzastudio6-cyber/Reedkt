import type {
  StyleCalibrationCandidateEvidence,
  StyleCalibrationPlan,
  StyleCalibrationReel,
  StyleCalibrationScenario,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION,
  MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION,
} from '../../../src/types/motion-studio'
import {
  styleCalibrationCandidateEvidenceSchema,
  styleCalibrationReelSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'

type CandidateCostInput = Pick<StyleCalibrationCandidateEvidence['cost'],
  'providerCostMicros' | 'infrastructureCostMicros' | 'costEvidenceDigest'>

type CandidateDraft = Omit<StyleCalibrationCandidateEvidence,
  'schemaVersion' | 'calibrationPlanDigest' | 'scenarioId' | 'scenarioKind' |
  'productionMode' | 'cost' | 'costPerAcceptedSecondMicros' |
  'routingEligible' | 'candidateDigest' | 'immutable'> & {
    cost: CandidateCostInput
  }

type ReelDraft = Pick<StyleCalibrationReel, 'id' | 'state'>

/**
 * Creates one append-only calibration candidate from references to the exact
 * canonical attempt, private output, QA, review, and cost authorities. This
 * record never authorizes a provider/tool call or performs selection itself.
 */
export function createStyleCalibrationCandidateEvidence(input: {
  plan: StyleCalibrationPlan
  scenario: StyleCalibrationScenario
  candidate: CandidateDraft
}): StyleCalibrationCandidateEvidence {
  const { candidate, plan, scenario } = input
  assertCalibrationPlan(plan)
  if (plan.approvalAuthority.state !== 'approved_bounded_execution') {
    throw new Error('Style Calibration candidate evidence requires an approved bounded calibration plan.')
  }
  const exactScenario = plan.scenarios.find((entry) => entry.id === scenario.id)
  if (!exactScenario || sha256CanonicalJson(exactScenario) !== sha256CanonicalJson(scenario)) {
    throw new Error('Style Calibration candidate does not match an exact approved scenario.')
  }
  assertSameOwnership(candidate, plan, 'Style Calibration candidate')
  if (candidate.productionId !== plan.productionId) {
    throw new Error('Style Calibration candidate changed the exact production identity.')
  }
  if (scenario.deterministicTextDataRequired &&
      candidate.routeCandidateId !== 'deterministic_reeditpro_composition') {
    throw new Error('Deterministic calibration routing requires the exact text/data scenario and deterministic ReEditPro composition.')
  }
  if (candidate.routeCandidateId === 'deterministic_reeditpro_composition') {
    if (!scenario.deterministicTextDataRequired ||
        (candidate.sourceEvidence.readiness === 'canonical_private_routing_eligible' &&
         candidate.sourceEvidence.kind !== 'canonical_tool_attempt')) {
      throw new Error('Deterministic calibration routing requires the exact text/data scenario and canonical tool evidence.')
    }
  } else if (scenario.requiresGeneratedMedia) {
    const admitted = plan.routePolicy.candidates.some((entry) =>
      entry.providerRoute === candidate.routeCandidateId)
    if (!admitted) throw new Error('Generated calibration candidate route is outside the approved route policy.')
    if (candidate.sourceEvidence.readiness === 'canonical_private_routing_eligible' &&
        candidate.sourceEvidence.kind !== 'canonical_provider_attempt') {
      throw new Error('Generated calibration routing requires canonical provider-attempt evidence.')
    }
  } else {
    throw new Error('Calibration candidate route is not compatible with the approved scenario.')
  }

  const total = candidate.cost.providerCostMicros === null
    ? null
    : safeAdd(candidate.cost.providerCostMicros, candidate.cost.infrastructureCostMicros)
  const frameRateRatio = candidate.output ? timingAuthorityFrameRateRatio(candidate.output.timingAuthority) : null
  if (candidate.output && !frameRateRatio) {
    throw new Error('Style Calibration candidate output timing authority is invalid or internally inconsistent.')
  }
  const costPerAcceptedSecondMicros = candidate.creativeReview.decision === 'accepted' &&
    candidate.output && total !== null && frameRateRatio
      ? safeCeilDivide(
          safeMultiply(total, frameRateRatio.numerator),
          safeMultiply(candidate.output.timingAuthority.durationFrames, frameRateRatio.denominator),
        )
      : null
  const routingEligible = candidate.attemptOutcome === 'succeeded' && candidate.output !== undefined &&
    candidate.technicalQa.status === 'passed' && candidate.creativeReview.decision === 'accepted' &&
    candidate.sourceEvidence.readiness === 'canonical_private_routing_eligible' &&
    candidate.sourceEvidence.sourceVerified && total !== null
  const { output, ...candidateWithoutOutput } = candidate
  const base = {
    schemaVersion: MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION,
    ...candidateWithoutOutput,
    ...(output ? { output } : {}),
    calibrationPlanDigest: plan.planDigest,
    scenarioId: scenario.id,
    scenarioKind: scenario.kind,
    productionMode: scenario.productionMode,
    cost: {
      ...candidate.cost,
      totalInternalProductionCostMicros: total,
      reconciled: total !== null,
      failedOrUnknownAttemptCostRetained: true as const,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    costPerAcceptedSecondMicros,
    routingEligible,
    immutable: true as const,
  }
  return parseAndFreeze(styleCalibrationCandidateEvidenceSchema, {
    ...base,
    candidateDigest: sha256CanonicalJson(base),
  })
}

/**
 * Reconciles all candidate attempts, including rejected, failed, and unknown
 * cost, into one approval-bound Calibration Reel. Selection is derived only
 * from human-accepted, QA-passed, routing-eligible evidence.
 */
export function createStyleCalibrationReel(input: {
  plan: StyleCalibrationPlan
  candidates: readonly StyleCalibrationCandidateEvidence[]
  reel: ReelDraft
}): StyleCalibrationReel {
  const { candidates, plan, reel } = input
  assertCalibrationPlan(plan)
  const authority = plan.approvalAuthority
  if (authority.state !== 'approved_bounded_execution' ||
      !authority.approvedPlanSnapshotId || !authority.approvedPlanSnapshotDigest ||
      authority.maximumAuthorizedInternalCostMicros === undefined) {
    throw new Error('Style Calibration Reel requires exact approved plan, snapshot, and cost authority.')
  }
  const scenarioById = new Map(plan.scenarios.map((scenario) => [scenario.id, scenario]))
  for (const candidate of candidates) {
    if (!verifyStyleCalibrationCandidateEvidenceDigest(candidate)) {
      throw new Error('Style Calibration Reel candidate failed immutable digest verification.')
    }
    assertSameOwnership(candidate, plan, 'Style Calibration Reel candidate')
    if (candidate.productionId !== plan.productionId || candidate.calibrationPlanDigest !== plan.planDigest) {
      throw new Error('Style Calibration Reel candidate changed production or plan authority.')
    }
    const scenario = scenarioById.get(candidate.scenarioId)
    if (!scenario || scenario.kind !== candidate.scenarioKind ||
        scenario.productionMode !== candidate.productionMode) {
      throw new Error('Style Calibration Reel candidate does not match an exact scenario.')
    }
  }

  const selected = new Map<StyleCalibrationScenario['kind'], StyleCalibrationCandidateEvidence>()
  for (const candidate of candidates) {
    if (!candidate.routingEligible) continue
    if (selected.has(candidate.scenarioKind)) {
      throw new Error(`Style Calibration scenario has more than one accepted route: ${candidate.scenarioKind}`)
    }
    selected.set(candidate.scenarioKind, candidate)
  }
  const decisions = plan.scenarios.flatMap((scenario) => {
    const candidate = selected.get(scenario.kind)
    if (!candidate?.output || !candidate.technicalQa.evidenceDigest ||
        !candidate.creativeReview.selectionReason ||
        candidate.cost.totalInternalProductionCostMicros === null ||
        candidate.costPerAcceptedSecondMicros === null) return []
    const frameRateRatio = timingAuthorityFrameRateRatio(candidate.output.timingAuthority)
    if (!frameRateRatio) return []
    return [{
      scenarioKind: scenario.kind,
      calibrationCandidateId: candidate.id,
      candidateEvidenceDigest: candidate.candidateDigest,
      routeCandidateId: candidate.routeCandidateId,
      productionMode: candidate.productionMode,
      outputPerformanceDigest: candidate.technicalQa.evidenceDigest,
      technicalQaStatus: 'passed' as const,
      creativeDecision: 'accepted' as const,
      selectionReason: candidate.creativeReview.selectionReason,
      knownFailureModes: candidate.knownFailureModes,
      acceptedDurationFrames: candidate.output.timingAuthority.durationFrames,
      fpsNumerator: frameRateRatio.numerator,
      fpsDenominator: frameRateRatio.denominator,
      measuredLatencyMilliseconds: candidate.measuredLatencyMilliseconds,
      internalProductionCostMicros: candidate.cost.totalInternalProductionCostMicros,
      costPerAcceptedSecondMicros: candidate.costPerAcceptedSecondMicros,
    }]
  })
  const totalActualInternalProductionCostMicros = candidates.reduce((sum, candidate) =>
    safeAdd(sum, candidate.cost.totalInternalProductionCostMicros ?? 0), 0)
  const unreconciledCostCandidateCount = candidates.filter((candidate) => !candidate.cost.reconciled).length
  const rejectedCandidateCount = candidates.filter((candidate) => candidate.creativeReview.decision === 'rejected').length
  const failedCandidateCount = candidates.filter((candidate) => candidate.attemptOutcome === 'failed').length
  const unknownCandidateCount = candidates.filter((candidate) => candidate.attemptOutcome === 'unknown').length
  const allRequiredScenariosAccepted = plan.scenarios.every((scenario) => selected.has(scenario.kind))
  const succeeded = candidates.filter((candidate) => candidate.attemptOutcome === 'succeeded')
  const humanReviewComplete = succeeded.length > 0 &&
    succeeded.every((candidate) => candidate.creativeReview.decision !== 'pending')
  const costWithinAuthority = unreconciledCostCandidateCount === 0 &&
    totalActualInternalProductionCostMicros <= authority.maximumAuthorizedInternalCostMicros
  const productionScaleRoutingApproved = reel.state === 'approved' && allRequiredScenariosAccepted &&
    humanReviewComplete && costWithinAuthority && unknownCandidateCount === 0
  if (reel.state === 'approved' && !productionScaleRoutingApproved) {
    throw new Error('Style Calibration Reel cannot be approved without five accepted routes, complete review, reconciled cost, and no unknown attempt.')
  }

  const base = {
    schemaVersion: MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    id: reel.id,
    productionId: plan.productionId,
    calibrationPlanDigest: plan.planDigest,
    approvedPlanSnapshotId: authority.approvedPlanSnapshotId,
    approvedPlanSnapshotDigest: authority.approvedPlanSnapshotDigest,
    candidates,
    decisions,
    state: reel.state,
    totalActualInternalProductionCostMicros,
    maximumAuthorizedInternalCostMicros: authority.maximumAuthorizedInternalCostMicros,
    costWithinAuthority,
    unreconciledCostCandidateCount,
    rejectedCandidateCount,
    failedCandidateCount,
    unknownCandidateCount,
    allRequiredScenariosAccepted,
    humanReviewComplete,
    productionScaleRoutingApproved,
    acceptedAndRejectedOutputsRetained: true as const,
    automaticSelectionAllowed: false as const,
    automaticFallbackAllowed: false as const,
    runtimeExecutionAuthorized: false as const,
    customerPriceIncluded: false as const,
    customerCreditsMutated: false as const,
    immutable: true as const,
  }
  return parseAndFreeze(styleCalibrationReelSchema, {
    ...base,
    reelDigest: sha256CanonicalJson(base),
  })
}

export function verifyStyleCalibrationCandidateEvidenceDigest(
  value: StyleCalibrationCandidateEvidence,
): boolean {
  return styleCalibrationCandidateEvidenceSchema.safeParse(value).success &&
    ownDigest(value, 'candidateDigest') === value.candidateDigest
}

export function verifyStyleCalibrationReelDigest(value: StyleCalibrationReel): boolean {
  return styleCalibrationReelSchema.safeParse(value).success &&
    ownDigest(value, 'reelDigest') === value.reelDigest &&
    value.candidates.every(verifyStyleCalibrationCandidateEvidenceDigest)
}

function assertCalibrationPlan(plan: StyleCalibrationPlan): void {
  if (ownDigest(plan, 'planDigest') !== plan.planDigest) {
    throw new Error('Style Calibration Plan failed immutable digest verification.')
  }
}

function assertSameOwnership(
  candidate: { workspaceId: string; projectId: string; editSessionId: string },
  authority: { workspaceId: string; projectId: string; editSessionId: string },
  label: string,
): void {
  if (candidate.workspaceId !== authority.workspaceId || candidate.projectId !== authority.projectId ||
      candidate.editSessionId !== authority.editSessionId) {
    throw new Error(`${label} must preserve the exact workspace, project, and edit identity.`)
  }
}

function safeAdd(left: number, right: number): number {
  const value = left + right
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Calibration internal cost exceeds the safe monetary range.')
  return value
}

function safeMultiply(left: number, right: number): number {
  const value = left * right
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Calibration cost-per-second math exceeds the safe monetary range.')
  return value
}

function safeCeilDivide(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(denominator) || denominator <= 0) throw new Error('Calibration accepted duration is invalid.')
  return Math.ceil(numerator / denominator)
}

function timingAuthorityFrameRateRatio(
  value: { frameRate: number; timebase: string },
): { numerator: number; denominator: number } | null {
  const [frameDurationNumeratorText, frameDurationDenominatorText, ...extra] = value.timebase.split('/')
  if (extra.length > 0 || frameDurationNumeratorText === undefined || frameDurationDenominatorText === undefined) {
    return null
  }
  const denominator = Number(frameDurationNumeratorText)
  const numerator = Number(frameDurationDenominatorText)
  if (!Number.isSafeInteger(numerator) || numerator <= 0 ||
      !Number.isSafeInteger(denominator) || denominator <= 0) return null
  const derived = numerator / denominator
  const tolerance = Math.max(1e-9, derived * 1e-9)
  return Math.abs(derived - value.frameRate) <= tolerance ? { numerator, denominator } : null
}

function ownDigest<T extends object, K extends keyof T>(value: T, key: K): string {
  const base = { ...value }
  delete base[key]
  return sha256CanonicalJson(base)
}

function parseAndFreeze<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  return deepFreeze(schema.parse(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
