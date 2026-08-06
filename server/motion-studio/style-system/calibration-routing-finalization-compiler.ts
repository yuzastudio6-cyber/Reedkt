import { z } from 'zod'

import { styleCalibrationCandidateEvidenceSchema } from '../../../src/lib/motion-studio/contracts'
import type {
  ProjectVideoRoutingProfile,
  StyleCalibrationCandidateEvidence,
  StyleCalibrationReel,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createProjectVideoRoutingProfile } from './authority'
import {
  createStyleCalibrationCandidateEvidence,
  createStyleCalibrationReel,
  verifyStyleCalibrationCandidateEvidenceDigest,
} from './calibration-evidence'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_FIXTURE_CALIBRATION_HISTORY_RECEIPT_VERSION =
  'motion-studio.fixture-calibration-history-receipt.v1' as const
export const MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPILER_VERSION =
  'motion-studio.calibration-routing-finalization-compiler.v1' as const
export const MOTION_STUDIO_CALIBRATION_FINALIZATION_ENVELOPE_VERSION =
  'motion-studio.calibration-routing-finalization-envelope.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

const fixtureTerminalHistoryFenceSchema = z.object({
  packageRecordId: stableIdSchema,
  packageHash: digestSchema,
  workGraphHash: digestSchema,
  queueHistoryRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  historyClosedAt: timestampSchema,
  attemptCount: z.number().int().min(5).max(64),
  attemptSequenceNumbers: z.array(z.number().int().positive())
    .min(5).max(64).readonly(),
  orderedAttemptIds: z.array(stableIdSchema).min(5).max(64).readonly(),
  orderedCandidateDigests: z.array(digestSchema).min(5).max(64).readonly(),
  orderedCostEvidenceDigests: z.array(digestSchema).min(5).max(64).readonly(),
  queueHistoryReadbackDigest: digestSchema,
  allAttemptsTerminal: z.literal(true),
  packageTerminal: z.literal(true),
  laterAttemptAppendAllowed: z.literal(false),
  canonicalBackendHistoryFenceVerified: z.literal(false),
  terminalFenceDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const arrays = [
    value.attemptSequenceNumbers,
    value.orderedAttemptIds,
    value.orderedCandidateDigests,
    value.orderedCostEvidenceDigests,
  ]
  const monotonic = value.attemptSequenceNumbers.every(
    (sequence, index) => sequence === index + 1,
  )
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.terminalFenceDigest
  if (
    arrays.some((array) => array.length !== value.attemptCount) ||
    new Set(value.orderedAttemptIds).size !== value.attemptCount ||
    new Set(value.orderedCandidateDigests).size !== value.attemptCount ||
    new Set(value.orderedCostEvidenceDigests).size !== value.attemptCount ||
    !monotonic ||
    sha256CanonicalJson(unsigned) !== value.terminalFenceDigest
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Fixture calibration terminal-history fence failed order, count, or digest reconciliation.',
    })
  }
})

export const fixtureCalibrationHistoryReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_FIXTURE_CALIBRATION_HISTORY_RECEIPT_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_private_candidate_history_test_fixture',
  ),
  evidenceClass: z.literal('private_candidate_history_test_fixture'),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  historyFence: fixtureTerminalHistoryFenceSchema,
  candidates: z.array(styleCalibrationCandidateEvidenceSchema)
    .min(5).max(64).readonly(),
  candidateCount: z.number().int().min(5).max(64),
  candidateSetDigest: digestSchema,
  sourceAuthorityReadbackDigest: digestSchema,
  fixtureAttemptHistoryComplete: z.literal(true),
  canonicalBackendAttemptHistoryVerified: z.literal(false),
  canonicalPersistenceAllowed: z.literal(false),
  canonicalReviewProjectionAllowed: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  historyReceiptDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const candidateIds = value.candidates.map((candidate) => candidate.id)
  const candidateDigests = value.candidates.map(
    (candidate) => candidate.candidateDigest,
  )
  const attemptIds = value.candidates.map(
    (candidate) => candidate.sourceEvidence.sourceAttemptId,
  )
  const costDigests = value.candidates.map(
    (candidate) => candidate.cost.costEvidenceDigest,
  )
  const candidatesMatchReceiptScope = value.candidates.every((candidate) =>
    candidate.workspaceId === value.workspaceId &&
    candidate.projectId === value.projectId &&
    candidate.editSessionId === value.editSessionId &&
    candidate.productionId === value.productionId &&
    candidate.calibrationPlanDigest === value.approvedCalibrationPlanDigest &&
    candidate.creativeReview.decision === 'pending' &&
    verifyStyleCalibrationCandidateEvidenceDigest(candidate))
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.historyReceiptDigest
  if (
    value.candidateCount !== value.candidates.length ||
    new Set(candidateIds).size !== candidateIds.length ||
    new Set(candidateDigests).size !== candidateDigests.length ||
    new Set(attemptIds).size !== attemptIds.length ||
    new Set(costDigests).size !== costDigests.length ||
    !candidatesMatchReceiptScope ||
    value.candidateSetDigest !== sha256CanonicalJson(value.candidates) ||
    sha256CanonicalJson(attemptIds) !==
      sha256CanonicalJson(value.historyFence.orderedAttemptIds) ||
    sha256CanonicalJson(candidateDigests) !==
      sha256CanonicalJson(value.historyFence.orderedCandidateDigests) ||
    sha256CanonicalJson(costDigests) !==
      sha256CanonicalJson(value.historyFence.orderedCostEvidenceDigests) ||
    sha256CanonicalJson(unsigned) !== value.historyReceiptDigest
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Fixture calibration history receipt failed identity, order, or digest reconciliation.',
    })
  }
})

export type FixtureCalibrationHistoryReceipt = z.infer<
  typeof fixtureCalibrationHistoryReceiptSchema
>

const calibrationFinalizationReviewBindingSchema = z.object({
  sourceCandidateId: stableIdSchema,
  sourceCandidateDigest: digestSchema,
  attemptOutcome: z.enum(['succeeded', 'failed', 'unknown']),
  disposition: z.enum([
    'fixture_reviewed_non_promotable',
    'no_review_non_success_terminal',
  ]),
  reviewRecordDigest: digestSchema.optional(),
  reviewedCandidateDigest: digestSchema.optional(),
  creativeDecision: z.enum(['accepted', 'rejected']).optional(),
}).strict().superRefine((value, context) => {
  const succeeded = value.attemptOutcome === 'succeeded'
  const reviewed = value.disposition === 'fixture_reviewed_non_promotable'
  if (
    succeeded !== reviewed ||
    succeeded !== (value.reviewRecordDigest !== undefined) ||
    succeeded !== (value.reviewedCandidateDigest !== undefined) ||
    succeeded !== (value.creativeDecision !== undefined)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration finalization review binding failed terminal-outcome disposition reconciliation.',
    })
  }
})

export type CalibrationFinalizationReviewBinding = z.infer<
  typeof calibrationFinalizationReviewBindingSchema
>

export const calibrationRoutingFinalizationEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_FINALIZATION_ENVELOPE_VERSION,
  ),
  compilerVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPILER_VERSION,
  ),
  evidenceClass: z.literal('private_contract_fixture_non_promotable'),
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  historyReceiptDigest: digestSchema,
  terminalHistoryFenceDigest: digestSchema,
  candidateSetDigest: digestSchema,
  reviewBindings: z.array(calibrationFinalizationReviewBindingSchema)
    .min(5).max(64).readonly(),
  reviewBindingSetDigest: digestSchema,
  reelDigest: digestSchema,
  routingProfileDigest: digestSchema,
  candidateCount: z.number().int().min(5).max(64),
  reviewedCandidateCount: z.number().int().nonnegative().max(64),
  failedCandidateCount: z.number().int().nonnegative().max(64),
  unknownCandidateCount: z.number().int().nonnegative().max(64),
  canonicalSourceProvenanceVerified: z.literal(false),
  authenticatedReviewProvenanceVerified: z.literal(false),
  canonicalPersistenceAllowed: z.literal(false),
  canonicalReviewProjectionAllowed: z.literal(false),
  bulkGenerationAllowed: z.literal(false),
  runtimeExecutionAuthorized: z.literal(false),
  providerExecutionAuthorized: z.literal(false),
  customerCommercialAuthorityGranted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderOrExportPerformed: z.literal(false),
  promotionAuthorized: z.literal(false),
  productionReady: z.literal(false),
  envelopeDigest: digestSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const reviewedBindings = value.reviewBindings.filter((binding) =>
    binding.disposition === 'fixture_reviewed_non_promotable')
  const failedBindings = value.reviewBindings.filter((binding) =>
    binding.attemptOutcome === 'failed')
  const unknownBindings = value.reviewBindings.filter((binding) =>
    binding.attemptOutcome === 'unknown')
  const reviewRecordDigests = reviewedBindings.map((binding) =>
    binding.reviewRecordDigest as string)
  const reviewedCandidateDigests = reviewedBindings.map((binding) =>
    binding.reviewedCandidateDigest as string)
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.envelopeDigest
  if (
    value.reviewBindings.length !== value.candidateCount ||
    new Set(value.reviewBindings.map((binding) => binding.sourceCandidateId))
      .size !== value.candidateCount ||
    new Set(value.reviewBindings.map((binding) => binding.sourceCandidateDigest))
      .size !== value.candidateCount ||
    new Set(reviewRecordDigests).size !== reviewedBindings.length ||
    new Set(reviewedCandidateDigests).size !== reviewedBindings.length ||
    value.reviewedCandidateCount !== reviewedBindings.length ||
    value.failedCandidateCount !== failedBindings.length ||
    value.unknownCandidateCount !== unknownBindings.length ||
    value.reviewedCandidateCount + value.failedCandidateCount +
      value.unknownCandidateCount !== value.candidateCount ||
    sha256CanonicalJson(value.reviewBindings) !== value.reviewBindingSetDigest ||
    sha256CanonicalJson(unsigned) !== value.envelopeDigest
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration finalization envelope failed count or digest reconciliation.',
    })
  }
})

export type CalibrationRoutingFinalizationEnvelope = z.infer<
  typeof calibrationRoutingFinalizationEnvelopeSchema
>

export interface CalibrationRoutingFinalizationFixtureResult {
  readonly historyReceipt: FixtureCalibrationHistoryReceipt
  readonly reviewBindings: readonly CalibrationFinalizationReviewBinding[]
  readonly reel: StyleCalibrationReel
  readonly routingProfile: ProjectVideoRoutingProfile
  readonly envelope: CalibrationRoutingFinalizationEnvelope
}

/**
 * Creates a strictly non-promotable closed-history fixture. There is no
 * caller-selected evidence class and this receipt can never enter canonical
 * persistence or review projection.
 */
export function createFixtureCalibrationHistoryReceipt(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  candidates: readonly StyleCalibrationCandidateEvidence[]
  packageRecordId: string
  packageHash: string
  workGraphHash: string
  queueHistoryRevision: number
  historyClosedAt: string
  queueHistoryReadbackDigest: string
  sourceAuthorityReadbackDigest: string
}): FixtureCalibrationHistoryReceipt {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const candidates = input.candidates.map((candidate) =>
    styleCalibrationCandidateEvidenceSchema.parse(candidate))
  assertFixtureCandidateHistory({ planSource: input.approvedPlanSource, candidates })
  const attemptIds = candidates.map(
    (candidate) => candidate.sourceEvidence.sourceAttemptId,
  )
  const candidateDigests = candidates.map(
    (candidate) => candidate.candidateDigest,
  )
  const costDigests = candidates.map(
    (candidate) => candidate.cost.costEvidenceDigest,
  )
  const fenceBase = {
    packageRecordId: stableIdSchema.parse(input.packageRecordId),
    packageHash: digestSchema.parse(input.packageHash),
    workGraphHash: digestSchema.parse(input.workGraphHash),
    queueHistoryRevision: z.number().int().positive().parse(
      input.queueHistoryRevision,
    ),
    historyClosedAt: timestampSchema.parse(input.historyClosedAt),
    attemptCount: candidates.length,
    attemptSequenceNumbers: candidates.map((_, index) => index + 1),
    orderedAttemptIds: attemptIds,
    orderedCandidateDigests: candidateDigests,
    orderedCostEvidenceDigests: costDigests,
    queueHistoryReadbackDigest: digestSchema.parse(
      input.queueHistoryReadbackDigest,
    ),
    allAttemptsTerminal: true as const,
    packageTerminal: true as const,
    laterAttemptAppendAllowed: false as const,
    canonicalBackendHistoryFenceVerified: false as const,
    immutable: true as const,
  }
  const historyFence = fixtureTerminalHistoryFenceSchema.parse({
    ...fenceBase,
    terminalFenceDigest: sha256CanonicalJson(fenceBase),
  })
  const base = {
    schemaVersion: MOTION_STUDIO_FIXTURE_CALIBRATION_HISTORY_RECEIPT_VERSION,
    sourceAuthority:
      'motion_studio_private_candidate_history_test_fixture' as const,
    evidenceClass: 'private_candidate_history_test_fixture' as const,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    productionId: plan.productionId,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    historyFence,
    candidates,
    candidateCount: candidates.length,
    candidateSetDigest: sha256CanonicalJson(candidates),
    sourceAuthorityReadbackDigest: digestSchema.parse(
      input.sourceAuthorityReadbackDigest,
    ),
    fixtureAttemptHistoryComplete: true as const,
    canonicalBackendAttemptHistoryVerified: false as const,
    canonicalPersistenceAllowed: false as const,
    canonicalReviewProjectionAllowed: false as const,
    runtimeExecutionAuthorized: false as const,
    providerExecutionAuthorized: false as const,
    customerCommercialAuthorityGranted: false as const,
    promotionAuthorized: false as const,
    productionReady: false as const,
    immutable: true as const,
  }
  return deepFreeze(fixtureCalibrationHistoryReceiptSchema.parse({
    ...base,
    historyReceiptDigest: sha256CanonicalJson(base),
  }))
}

/**
 * Exercises the deterministic finalization compiler only. Its Reel is blocked,
 * its routing profile is draft, and the metadata-only envelope is permanently
 * non-promotable. Real canonical finalization remains fail-closed until the
 * backend supplies a trusted sealed history reader and authenticated reviews.
 */
export function compileFixtureCalibrationRoutingFinalization(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  historyReceipt: FixtureCalibrationHistoryReceipt
  reviews: readonly {
    sourceCandidate: StyleCalibrationCandidateEvidence
    reviewedCandidate?: StyleCalibrationCandidateEvidence
    reviewRecordDigest?: string
  }[]
}): CalibrationRoutingFinalizationFixtureResult {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const historyReceipt = fixtureCalibrationHistoryReceiptSchema.parse(
    input.historyReceipt,
  )
  assertHistoryScope(input.approvedPlanSource, historyReceipt)
  if (input.reviews.length !== historyReceipt.candidates.length) {
    throw new Error('Calibration finalization requires one ordered review disposition per attempt.')
  }
  const reviewedCandidates: StyleCalibrationCandidateEvidence[] = []
  const reviewBindings: CalibrationFinalizationReviewBinding[] = []
  for (const [index, sourceCandidate] of historyReceipt.candidates.entries()) {
    const review = input.reviews[index]
    if (!review ||
        review.sourceCandidate.candidateDigest !== sourceCandidate.candidateDigest) {
      throw new Error('Calibration finalization review order changed the closed attempt history.')
    }
    if (sourceCandidate.attemptOutcome === 'succeeded') {
      if (!review.reviewedCandidate || !review.reviewRecordDigest) {
        throw new Error('Every successful calibration attempt requires one immutable review binding.')
      }
      const reviewedCandidate = assertReviewedCandidate({
        approvedPlanSource: input.approvedPlanSource,
        sourceCandidate,
        reviewedCandidate: review.reviewedCandidate,
      })
      reviewedCandidates.push(reviewedCandidate)
      reviewBindings.push(calibrationFinalizationReviewBindingSchema.parse({
        sourceCandidateId: sourceCandidate.id,
        sourceCandidateDigest: sourceCandidate.candidateDigest,
        attemptOutcome: sourceCandidate.attemptOutcome,
        disposition: 'fixture_reviewed_non_promotable',
        reviewRecordDigest: digestSchema.parse(review.reviewRecordDigest),
        reviewedCandidateDigest: reviewedCandidate.candidateDigest,
        creativeDecision: reviewedCandidate.creativeReview.decision,
      }))
    } else {
      if (review.reviewedCandidate || review.reviewRecordDigest) {
        throw new Error('Failed or unknown calibration attempts cannot carry a creative-review binding.')
      }
      reviewedCandidates.push(sourceCandidate)
      reviewBindings.push(calibrationFinalizationReviewBindingSchema.parse({
        sourceCandidateId: sourceCandidate.id,
        sourceCandidateDigest: sourceCandidate.candidateDigest,
        attemptOutcome: sourceCandidate.attemptOutcome,
        disposition: 'no_review_non_success_terminal',
      }))
    }
  }
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const reviewBindingSetDigest = sha256CanonicalJson(reviewBindings)
  const finalizationSeed = sha256CanonicalJson({
    compilerVersion: MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPILER_VERSION,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
    historyReceiptDigest: historyReceipt.historyReceiptDigest,
    reviewBindingSetDigest,
  })
  const reel = createStyleCalibrationReel({
    plan,
    candidates: reviewedCandidates,
    reel: {
      id: `fixture-style-calibration-reel-${finalizationSeed}`,
      state: 'blocked',
    },
  })
  const routingProfile = createProjectVideoRoutingProfile({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    id: `fixture-project-video-routing-${finalizationSeed}`,
    productionId: plan.productionId,
    calibrationPlanDigest: plan.planDigest,
    styleProfile: plan.styleProfile,
    motionDnaVersion: plan.motionDnaVersion,
    routePolicyId: plan.routePolicy.policyId,
    routePolicyDigest: sha256CanonicalJson(plan.routePolicy),
    state: 'draft',
  }, plan, reel)
  const envelopeBase = {
    schemaVersion: MOTION_STUDIO_CALIBRATION_FINALIZATION_ENVELOPE_VERSION,
    compilerVersion: MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPILER_VERSION,
    evidenceClass: 'private_contract_fixture_non_promotable' as const,
    approvedSnapshotId: input.approvedPlanSource.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedPlanSource.approvedSnapshotDigest,
    approvedCalibrationPlanDigest: plan.planDigest,
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
      binding.disposition === 'fixture_reviewed_non_promotable').length,
    failedCandidateCount: historyReceipt.candidates.filter((candidate) =>
      candidate.attemptOutcome === 'failed').length,
    unknownCandidateCount: historyReceipt.candidates.filter((candidate) =>
      candidate.attemptOutcome === 'unknown').length,
    canonicalSourceProvenanceVerified: false as const,
    authenticatedReviewProvenanceVerified: false as const,
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
  const envelope = calibrationRoutingFinalizationEnvelopeSchema.parse({
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

export function requireCanonicalCalibrationRoutingFinalization(): never {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Fixture and injected composition checks cannot perform canonical calibration routing. A module-owned released backend resolver must supply closed history, candidate-source, cost, and authenticated-review authority.',
    503,
    {
      requiredGate:
        'canonical_storytelling_calibration_released_runtime_receipt_adapters',
      productionReady: false,
    },
  )
}

function assertFixtureCandidateHistory(input: {
  planSource: CanonicalApprovedStorytellingStylePlanSource
  candidates: readonly StyleCalibrationCandidateEvidence[]
}): void {
  const plan = input.planSource.approvedCalibrationPlan
  const scenarioById = new Map(plan.scenarios.map((scenario) => [
    scenario.id,
    scenario,
  ]))
  const coveredScenarioIds = new Set<string>()
  const candidateIds = new Set<string>()
  const candidateDigests = new Set<string>()
  const attemptIds = new Set<string>()
  const costEvidenceDigests = new Set<string>()
  for (const candidate of input.candidates) {
    const scenario = scenarioById.get(candidate.scenarioId)
    if (
      !scenario ||
      scenario.kind !== candidate.scenarioKind ||
      scenario.productionMode !== candidate.productionMode ||
      candidate.workspaceId !== plan.workspaceId ||
      candidate.projectId !== plan.projectId ||
      candidate.editSessionId !== plan.editSessionId ||
      candidate.productionId !== plan.productionId ||
      candidate.calibrationPlanDigest !== plan.planDigest ||
      candidate.creativeReview.decision !== 'pending' ||
      !verifyStyleCalibrationCandidateEvidenceDigest(candidate)
    ) {
      throw new Error('Fixture calibration history changed scope, scenario, plan, or pending-review authority.')
    }
    candidateIds.add(candidate.id)
    candidateDigests.add(candidate.candidateDigest)
    attemptIds.add(candidate.sourceEvidence.sourceAttemptId)
    costEvidenceDigests.add(candidate.cost.costEvidenceDigest)
    coveredScenarioIds.add(candidate.scenarioId)
  }
  if (
    candidateIds.size !== input.candidates.length ||
    candidateDigests.size !== input.candidates.length ||
    attemptIds.size !== input.candidates.length ||
    costEvidenceDigests.size !== input.candidates.length ||
    plan.scenarios.some((scenario) => !coveredScenarioIds.has(scenario.id))
  ) {
    throw new Error('Fixture calibration history is duplicate or does not cover all five scenarios.')
  }
}

function assertHistoryScope(
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource,
  history: FixtureCalibrationHistoryReceipt,
): void {
  const plan = approvedPlanSource.approvedCalibrationPlan
  if (
    history.workspaceId !== plan.workspaceId ||
    history.projectId !== plan.projectId ||
    history.editSessionId !== plan.editSessionId ||
    history.productionId !== plan.productionId ||
    history.approvedSnapshotId !== approvedPlanSource.approvedSnapshotId ||
    history.approvedSnapshotDigest !== approvedPlanSource.approvedSnapshotDigest ||
    history.approvedCalibrationPlanDigest !== plan.planDigest
  ) {
    throw new Error('Fixture calibration history does not match the exact approved snapshot and plan.')
  }
}

function assertReviewedCandidate(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  sourceCandidate: StyleCalibrationCandidateEvidence
  reviewedCandidate: StyleCalibrationCandidateEvidence
}): StyleCalibrationCandidateEvidence {
  const reviewed = styleCalibrationCandidateEvidenceSchema.parse(
    input.reviewedCandidate,
  )
  if (!['accepted', 'rejected'].includes(reviewed.creativeReview.decision)) {
    throw new Error('Successful fixture candidates require an accepted or rejected review decision.')
  }
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const scenario = plan.scenarios.find((entry) =>
    entry.id === input.sourceCandidate.scenarioId)
  if (!scenario) {
    throw new Error('Reviewed fixture candidate lost its exact approved scenario.')
  }
  const expected = createStyleCalibrationCandidateEvidence({
    plan,
    scenario,
    candidate: {
      workspaceId: input.sourceCandidate.workspaceId,
      projectId: input.sourceCandidate.projectId,
      editSessionId: input.sourceCandidate.editSessionId,
      id: input.sourceCandidate.id,
      productionId: input.sourceCandidate.productionId,
      routeCandidateId: input.sourceCandidate.routeCandidateId,
      sourceEvidence: input.sourceCandidate.sourceEvidence,
      attemptOutcome: input.sourceCandidate.attemptOutcome,
      output: input.sourceCandidate.output,
      technicalQa: input.sourceCandidate.technicalQa,
      creativeReview: reviewed.creativeReview,
      knownFailureModes: input.sourceCandidate.knownFailureModes,
      measuredLatencyMilliseconds:
        input.sourceCandidate.measuredLatencyMilliseconds,
      cost: {
        providerCostMicros: input.sourceCandidate.cost.providerCostMicros,
        infrastructureCostMicros:
          input.sourceCandidate.cost.infrastructureCostMicros,
        costEvidenceDigest: input.sourceCandidate.cost.costEvidenceDigest,
      },
    },
  })
  if (sha256CanonicalJson(expected) !== sha256CanonicalJson(reviewed)) {
    throw new Error('Reviewed fixture candidate changed attempt, output, QA, cost, or scenario authority.')
  }
  return reviewed
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
