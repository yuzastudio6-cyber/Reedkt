import type {
  ProjectVideoRoutingProfile,
  StyleCalibrationCandidateEvidence,
  StyleCalibrationReel,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createProjectVideoRoutingProfile } from './authority'
import {
  calibrationAttemptHistoryCompositionReceiptSchema,
  calibrationFinalizationCompositionReviewBindingSchema,
  calibrationRoutingFinalizationCompositionEnvelopeSchema,
  MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_ENVELOPE_VERSION,
  MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_SERVICE_VERSION,
  type CalibrationAttemptHistoryCompositionReceipt,
  type CalibrationFinalizationCompositionReviewBinding,
  type CalibrationRoutingFinalizationCompositionEnvelope,
} from './calibration-routing-finalization-contract'
import { createStyleCalibrationReel } from './calibration-evidence'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import type {
  PrivateCalibrationReviewDecisionRecord,
  PrivateCalibrationReviewDecisionStore,
} from './private-calibration-review-decision-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

/**
 * Compatibility filename only: this reader is deliberately a controlled-local
 * injected test port. A structural implementation can prove composition shape,
 * but it cannot prove canonical backend provenance or authorize persistence.
 */
export interface CalibrationAttemptHistoryCompositionReader {
  readonly evidenceClass: 'controlled_local_injected_nonpromotable'
  readonly readerId: string
  readClosedHistory(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  }): Promise<CalibrationAttemptHistoryCompositionReceipt>
}

export interface CalibrationRoutingFinalizationCompositionResult {
  readonly historyReceipt: CalibrationAttemptHistoryCompositionReceipt
  readonly reviewBindings: readonly CalibrationFinalizationCompositionReviewBinding[]
  readonly reel: StyleCalibrationReel
  readonly routingProfile: ProjectVideoRoutingProfile
  readonly envelope: CalibrationRoutingFinalizationCompositionEnvelope
}

export interface CalibrationRoutingFinalizationCompositionService {
  assess(input: {
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  }): Promise<CalibrationRoutingFinalizationCompositionResult>
}

/**
 * Exercises the finalization composition against injected, non-promotable
 * server-port fixtures. It reopens history and review records twice so shape,
 * order, replay, and race behavior can be tested, but it never persists a Reel,
 * projects canonical review, enables bulk routing, or grants runtime authority.
 * A later module-owned backend resolver must replace this test port.
 */
export function createCalibrationRoutingFinalizationCompositionService(input: {
  historyReader: CalibrationAttemptHistoryCompositionReader
  reviewDecisionStore: PrivateCalibrationReviewDecisionStore
}): CalibrationRoutingFinalizationCompositionService {
  if (
    input.historyReader.evidenceClass !==
      'controlled_local_injected_nonpromotable' ||
    !input.historyReader.readerId
  ) {
    throw invalid(
      'Calibration finalization composition requires its controlled-local non-promotable history adapter.',
    )
  }

  return {
    async assess(value) {
      const compiled = await compileFromInjectedSources({
        ...input,
        approvedPlanSource: value.approvedPlanSource,
      })
      const historyReadback = await readAndVerifyHistory({
        reader: input.historyReader,
        approvedPlanSource: value.approvedPlanSource,
      })
      if (
        historyReadback.historyReceiptDigest !==
          compiled.historyReceipt.historyReceiptDigest
      ) {
        throw conflict(
          'Calibration attempt history changed during composition assessment.',
        )
      }
      return deepFreeze(compiled)
    },
  }
}

async function compileFromInjectedSources(input: {
  historyReader: CalibrationAttemptHistoryCompositionReader
  reviewDecisionStore: PrivateCalibrationReviewDecisionStore
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
}): Promise<CalibrationRoutingFinalizationCompositionResult> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const historyReceipt = await readAndVerifyHistory({
    reader: input.historyReader,
    approvedPlanSource: input.approvedPlanSource,
  })
  assertCompleteScenarioHistory({
    approvedPlanSource: input.approvedPlanSource,
    historyReceipt,
  })

  const reviewedCandidates: StyleCalibrationCandidateEvidence[] = []
  const reviewBindings: CalibrationFinalizationCompositionReviewBinding[] = []
  for (const sourceCandidate of historyReceipt.candidates) {
    if (sourceCandidate.attemptOutcome === 'succeeded') {
      const reviewRecord = await input.reviewDecisionStore.read({
        approvedPlanSource: input.approvedPlanSource,
        candidate: sourceCandidate,
      })
      assertNonPromotableReviewRecord(sourceCandidate, reviewRecord)
      reviewedCandidates.push(reviewRecord.reviewedCandidate)
      reviewBindings.push(calibrationFinalizationCompositionReviewBindingSchema.parse({
        sourceCandidateId: sourceCandidate.id,
        sourceCandidateDigest: sourceCandidate.candidateDigest,
        sourceAttemptId: sourceCandidate.sourceEvidence.sourceAttemptId,
        sourceCostEvidenceDigest: sourceCandidate.cost.costEvidenceDigest,
        attemptOutcome: sourceCandidate.attemptOutcome,
        disposition: 'injected_review_shape_nonpromotable',
        reviewRecordDigest: reviewRecord.recordDigest,
        reviewVerificationDigest:
          reviewRecord.privateReviewVerification.verificationDigest,
        reviewedCandidateDigest: reviewRecord.reviewedCandidateDigest,
        creativeDecision: reviewRecord.decision.decision,
      }))
    } else {
      reviewedCandidates.push(sourceCandidate)
      reviewBindings.push(calibrationFinalizationCompositionReviewBindingSchema.parse({
        sourceCandidateId: sourceCandidate.id,
        sourceCandidateDigest: sourceCandidate.candidateDigest,
        sourceAttemptId: sourceCandidate.sourceEvidence.sourceAttemptId,
        sourceCostEvidenceDigest: sourceCandidate.cost.costEvidenceDigest,
        attemptOutcome: sourceCandidate.attemptOutcome,
        disposition: 'no_review_non_success_terminal',
      }))
    }
  }

  if (historyReceipt.candidates.some((candidate) =>
    candidate.attemptOutcome === 'unknown')) {
    throw notReady(
      'Calibration finalization cannot assess routing while an attempt outcome remains unknown.',
      'canonical_storytelling_calibration_unknown_attempt_reconciliation',
    )
  }

  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const reviewBindingSetDigest = sha256CanonicalJson(reviewBindings)
  const finalizationSeed = sha256CanonicalJson({
    serviceVersion:
      MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_SERVICE_VERSION,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    historyReceiptDigest: historyReceipt.historyReceiptDigest,
    reviewBindingSetDigest,
  })
  let reel: StyleCalibrationReel
  let routingProfile: ProjectVideoRoutingProfile
  try {
    reel = createStyleCalibrationReel({
      plan,
      candidates: reviewedCandidates,
      reel: {
        id: `composition-style-calibration-reel-${finalizationSeed}`,
        state: 'blocked',
      },
    })
    routingProfile = createProjectVideoRoutingProfile({
      workspaceId: plan.workspaceId,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      id: `composition-project-video-routing-${finalizationSeed}`,
      productionId: plan.productionId,
      calibrationPlanDigest: plan.planDigest,
      styleProfile: plan.styleProfile,
      motionDnaVersion: plan.motionDnaVersion,
      routePolicyId: plan.routePolicy.policyId,
      routePolicyDigest: sha256CanonicalJson(plan.routePolicy),
      state: 'draft',
    }, plan, reel)
  } catch (error) {
    throw notReady(
      error instanceof Error
        ? error.message
        : 'Calibration composition evidence is not ready for assessment.',
      'canonical_storytelling_calibration_five_scenario_acceptance',
    )
  }

  const acceptedCandidateCount = reviewBindings.filter((binding) =>
    binding.creativeDecision === 'accepted').length
  if (acceptedCandidateCount !== 5) {
    throw notReady(
      'Storytelling calibration composition requires exactly five accepted scenario shapes.',
      'canonical_storytelling_calibration_five_scenario_acceptance',
    )
  }
  const envelopeBase = {
    schemaVersion:
      MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_ENVELOPE_VERSION,
    serviceVersion:
      MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_SERVICE_VERSION,
    evidenceClass: 'controlled_local_injected_nonpromotable' as const,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    historyReaderId: historyReceipt.readerId,
    historyReceiptDigest: historyReceipt.historyReceiptDigest,
    terminalHistoryFenceDigest:
      historyReceipt.historyFence.terminalFenceDigest,
    candidateSetDigest: historyReceipt.candidateSetDigest,
    reviewBindings,
    reviewBindingSetDigest,
    reelDigest: reel.reelDigest,
    routingProfileDigest: routingProfile.profileDigest,
    candidateCount: historyReceipt.candidateCount,
    reviewedCandidateCount: reviewBindings.filter((binding) =>
      binding.disposition === 'injected_review_shape_nonpromotable').length,
    acceptedCandidateCount: 5 as const,
    rejectedCandidateCount: reviewBindings.filter((binding) =>
      binding.creativeDecision === 'rejected').length,
    failedCandidateCount: historyReceipt.candidates.filter((candidate) =>
      candidate.attemptOutcome === 'failed').length,
    unknownCandidateCount: 0 as const,
    canonicalSourceProvenanceVerified: false as const,
    authenticatedReviewProvenanceVerified: false as const,
    injectedHistoryReverified: true as const,
    injectedReviewBindingsReverified: true as const,
    canonicalPersistenceAllowed: false as const,
    canonicalReviewProjectionAllowed: false as const,
    bulkGenerationAllowed: false as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    timelineMutationPerformed: false as const,
    renderOrExportPerformed: false as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  const envelope = calibrationRoutingFinalizationCompositionEnvelopeSchema.parse({
    ...envelopeBase,
    envelopeDigest: sha256CanonicalJson(envelopeBase),
  })
  return deepFreeze({
    historyReceipt,
    reviewBindings,
    reel,
    routingProfile,
    envelope,
  })
}

async function readAndVerifyHistory(input: {
  reader: CalibrationAttemptHistoryCompositionReader
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
}): Promise<CalibrationAttemptHistoryCompositionReceipt> {
  const receipt = calibrationAttemptHistoryCompositionReceiptSchema.parse(
    await input.reader.readClosedHistory({
      approvedPlanSource: input.approvedPlanSource,
    }),
  )
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  if (
    receipt.readerId !== input.reader.readerId ||
    receipt.workspaceId !== plan.workspaceId ||
    receipt.projectId !== plan.projectId ||
    receipt.editSessionId !== plan.editSessionId ||
    receipt.productionId !== plan.productionId ||
    receipt.approvedSnapshotId !== input.approvedPlanSource.approvedSnapshotId ||
    receipt.approvedSnapshotDigest !==
      input.approvedPlanSource.approvedSnapshotDigest ||
    receipt.approvedCalibrationPlanDigest !== plan.planDigest
  ) {
    throw conflict(
      'Calibration composition history changed reader, project, edit, snapshot, or plan identity.',
    )
  }
  return deepFreeze(receipt)
}

function assertCompleteScenarioHistory(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  historyReceipt: CalibrationAttemptHistoryCompositionReceipt
}): void {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const scenarios = new Map(plan.scenarios.map((scenario) => [
    scenario.id,
    scenario,
  ]))
  const coveredScenarioIds = new Set<string>()
  for (const candidate of input.historyReceipt.candidates) {
    const scenario = scenarios.get(candidate.scenarioId)
    if (
      !scenario ||
      scenario.kind !== candidate.scenarioKind ||
      scenario.productionMode !== candidate.productionMode ||
      !['canonical_tool_attempt', 'canonical_provider_attempt'].includes(
        candidate.sourceEvidence.kind,
      ) ||
      candidate.sourceEvidence.readiness !==
        'canonical_private_routing_eligible' ||
      !candidate.sourceEvidence.sourceVerified
    ) {
      throw conflict(
        'Calibration composition history changed scenario or source-attempt shape.',
      )
    }
    coveredScenarioIds.add(candidate.scenarioId)
  }
  if (plan.scenarios.some((scenario) => !coveredScenarioIds.has(scenario.id))) {
    throw notReady(
      'Calibration composition history does not cover all five approved scenarios.',
      'canonical_storytelling_calibration_five_scenario_history',
    )
  }
}

function assertNonPromotableReviewRecord(
  sourceCandidate: StyleCalibrationCandidateEvidence,
  record: PrivateCalibrationReviewDecisionRecord,
): void {
  if (
    record.canonicalCompilationAllowed ||
    record.sourceEvidenceClass !== 'private_source_verifier_test_fixture' ||
    record.reviewEvidenceClass !== 'private_authenticated_review_test_fixture' ||
    record.sourceCandidateId !== sourceCandidate.id ||
    record.sourceCandidateDigest !== sourceCandidate.candidateDigest ||
    sha256CanonicalJson(record.sourceCandidate) !==
      sha256CanonicalJson(sourceCandidate) ||
    record.candidateSourceVerification.sourceAttemptId !==
      sourceCandidate.sourceEvidence.sourceAttemptId ||
    record.candidateSourceVerification.costEvidenceDigest !==
      sourceCandidate.cost.costEvidenceDigest ||
    record.privateReviewVerification.candidateDigest !==
      sourceCandidate.candidateDigest ||
    !record.authenticatedCompletePlaybackReverified
  ) {
    throw conflict(
      'Calibration composition review changed source, attempt, cost, playback, or non-promotable evidence class.',
    )
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409)
}

function notReady(message: string, requiredGate: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate,
    canonicalPersistenceAllowed: false,
    canonicalReviewProjectionAllowed: false,
    bulkGenerationAllowed: false,
    runtimeExecutionAuthorized: false,
    providerExecutionAuthorized: false,
    productionReady: false,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}
