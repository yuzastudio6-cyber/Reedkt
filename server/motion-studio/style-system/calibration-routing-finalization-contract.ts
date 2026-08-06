import { z } from 'zod'

import { styleCalibrationCandidateEvidenceSchema } from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { verifyStyleCalibrationCandidateEvidenceDigest } from './calibration-evidence'

export const MOTION_STUDIO_CALIBRATION_COMPOSITION_HISTORY_RECEIPT_VERSION =
  'motion-studio.calibration-composition-history-receipt.v1' as const
export const MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_SERVICE_VERSION =
  'motion-studio.calibration-routing-finalization-composition-service.v1' as const
export const MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_ENVELOPE_VERSION =
  'motion-studio.calibration-routing-finalization-composition-envelope.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

const calibrationCompositionTerminalHistoryFenceSchema = z.object({
  packageRecordId: stableIdSchema,
  packageHash: digestSchema,
  workGraphHash: digestSchema,
  queueDefinitionHash: digestSchema,
  queueAggregateHash: digestSchema,
  queueHistoryRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  queueEventCount: z.number().int().positive().max(8_192),
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
      message: 'Calibration composition terminal-history fence failed order, count, or digest reconciliation.',
    })
  }
})

export const calibrationAttemptHistoryCompositionReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_COMPOSITION_HISTORY_RECEIPT_VERSION,
  ),
  sourceAuthority: z.literal(
    'motion_studio_calibration_history_test_adapter',
  ),
  evidenceClass: z.literal('controlled_local_injected_nonpromotable'),
  readerId: stableIdSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  historyFence: calibrationCompositionTerminalHistoryFenceSchema,
  candidates: z.array(styleCalibrationCandidateEvidenceSchema)
    .min(5).max(64).readonly(),
  candidateCount: z.number().int().min(5).max(64),
  candidateSetDigest: digestSchema,
  sourceAuthorityReadbackDigest: digestSchema,
  sourceRepositoryReverified: z.literal(false),
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
      message: 'Calibration composition history receipt failed identity, order, or digest reconciliation.',
    })
  }
})

export type CalibrationAttemptHistoryCompositionReceipt = z.infer<
  typeof calibrationAttemptHistoryCompositionReceiptSchema
>

export const calibrationFinalizationCompositionReviewBindingSchema = z.object({
  sourceCandidateId: stableIdSchema,
  sourceCandidateDigest: digestSchema,
  sourceAttemptId: stableIdSchema,
  sourceCostEvidenceDigest: digestSchema,
  attemptOutcome: z.enum(['succeeded', 'failed', 'unknown']),
  disposition: z.enum([
    'injected_review_shape_nonpromotable',
    'no_review_non_success_terminal',
  ]),
  reviewRecordDigest: digestSchema.optional(),
  reviewVerificationDigest: digestSchema.optional(),
  reviewedCandidateDigest: digestSchema.optional(),
  creativeDecision: z.enum(['accepted', 'rejected']).optional(),
}).strict().superRefine((value, context) => {
  const succeeded = value.attemptOutcome === 'succeeded'
  const reviewed = value.disposition === 'injected_review_shape_nonpromotable'
  if (
    succeeded !== reviewed ||
    succeeded !== (value.reviewRecordDigest !== undefined) ||
    succeeded !== (value.reviewVerificationDigest !== undefined) ||
    succeeded !== (value.reviewedCandidateDigest !== undefined) ||
    succeeded !== (value.creativeDecision !== undefined)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration composition review binding failed terminal-outcome disposition reconciliation.',
    })
  }
})

export type CalibrationFinalizationCompositionReviewBinding = z.infer<
  typeof calibrationFinalizationCompositionReviewBindingSchema
>

export const calibrationRoutingFinalizationCompositionEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_ENVELOPE_VERSION,
  ),
  serviceVersion: z.literal(
    MOTION_STUDIO_CALIBRATION_FINALIZATION_COMPOSITION_SERVICE_VERSION,
  ),
  evidenceClass: z.literal('controlled_local_injected_nonpromotable'),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedCalibrationPlanDigest: digestSchema,
  historyReaderId: stableIdSchema,
  historyReceiptDigest: digestSchema,
  terminalHistoryFenceDigest: digestSchema,
  candidateSetDigest: digestSchema,
  reviewBindings: z.array(calibrationFinalizationCompositionReviewBindingSchema)
    .min(5).max(64).readonly(),
  reviewBindingSetDigest: digestSchema,
  reelDigest: digestSchema,
  routingProfileDigest: digestSchema,
  candidateCount: z.number().int().min(5).max(64),
  reviewedCandidateCount: z.number().int().nonnegative().max(64),
  acceptedCandidateCount: z.literal(5),
  rejectedCandidateCount: z.number().int().nonnegative().max(64),
  failedCandidateCount: z.number().int().nonnegative().max(64),
  unknownCandidateCount: z.literal(0),
  canonicalSourceProvenanceVerified: z.literal(false),
  authenticatedReviewProvenanceVerified: z.literal(false),
  injectedHistoryReverified: z.literal(true),
  injectedReviewBindingsReverified: z.literal(true),
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
    binding.disposition === 'injected_review_shape_nonpromotable')
  const acceptedBindings = reviewedBindings.filter((binding) =>
    binding.creativeDecision === 'accepted')
  const rejectedBindings = reviewedBindings.filter((binding) =>
    binding.creativeDecision === 'rejected')
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
    new Set(value.reviewBindings.map((binding) => binding.sourceAttemptId))
      .size !== value.candidateCount ||
    new Set(value.reviewBindings.map((binding) => binding.sourceCostEvidenceDigest))
      .size !== value.candidateCount ||
    new Set(reviewRecordDigests).size !== reviewedBindings.length ||
    new Set(reviewedCandidateDigests).size !== reviewedBindings.length ||
    value.reviewedCandidateCount !== reviewedBindings.length ||
    value.acceptedCandidateCount !== acceptedBindings.length ||
    value.rejectedCandidateCount !== rejectedBindings.length ||
    value.failedCandidateCount !== failedBindings.length ||
    value.unknownCandidateCount !== unknownBindings.length ||
    value.reviewedCandidateCount + value.failedCandidateCount +
      value.unknownCandidateCount !== value.candidateCount ||
    sha256CanonicalJson(value.reviewBindings) !== value.reviewBindingSetDigest ||
    sha256CanonicalJson(unsigned) !== value.envelopeDigest
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Calibration finalization composition envelope failed count or digest reconciliation.',
    })
  }
})

export type CalibrationRoutingFinalizationCompositionEnvelope = z.infer<
  typeof calibrationRoutingFinalizationCompositionEnvelopeSchema
>
