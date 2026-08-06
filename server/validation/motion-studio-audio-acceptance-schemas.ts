import { z } from 'zod'

import { motionStudioAudioSelectionManifestV1Schema } from '../../src/lib/motion-studio/contracts'
import type {
  CreateMotionStudioAudioIntegrationBindingRequestV1,
  CreateMotionStudioAudioSelectionRequestV1,
  MotionStudioAudioIntegrationBindingReceiptDtoV1,
  MotionStudioAudioSelectionCommitReceiptDtoV1,
} from '../../src/types/motion-studio'

export const CANONICAL_MOTION_STUDIO_AUDIO_SELECTION_SOURCE_VERSION =
  'canonical-motion-studio-audio-selection-source-v1' as const
export const CANONICAL_MOTION_STUDIO_AUDIO_SELECTION_COMMIT_VERSION =
  'canonical-motion-studio-audio-selection-commit-v1' as const
export const CANONICAL_MOTION_STUDIO_AUDIO_INTEGRATION_BINDING_VERSION =
  'canonical-motion-studio-audio-integration-binding-v1' as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)
const safeText = z.string().trim().min(8).max(1_000)
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/iu.test(value), {
    message: 'Selection reasons cannot contain URLs, URI payloads, or relative paths.',
  })

const narrationChoiceSchema = z.object({
  voiceSegmentId: stableId,
  selectedTakeId: stableId,
  decisionReason: safeText,
}).strict()

const selectedRoleDecisionSchema = z.object({
  role: z.enum(['music', 'foley', 'ambience', 'exact_sfx']),
  decision: z.literal('selected'),
  candidateIds: z.array(stableId).min(1).max(64).readonly(),
  decisionReason: safeText,
}).strict()

const emptyRoleDecisionSchema = z.object({
  role: z.enum(['music', 'foley', 'ambience', 'exact_sfx']),
  decision: z.enum(['not_selected', 'not_needed']),
  candidateIds: z.array(z.never()).length(0).readonly(),
  decisionReason: safeText,
}).strict()

const expectedCurrentSelectionSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('none'),
    nextSelectionManifestVersion: z.literal(1),
  }).strict(),
  z.object({
    state: z.literal('current'),
    selectionManifestId: stableId,
    selectionManifestVersion: positiveSafeInteger,
    selectionManifestDigest: digest,
    nextSelectionManifestVersion: positiveSafeInteger,
  }).strict().superRefine((value, context) => {
    if (value.nextSelectionManifestVersion !== value.selectionManifestVersion + 1) {
      context.addIssue({
        code: 'custom',
        path: ['nextSelectionManifestVersion'],
        message: 'The next audio-selection version must advance exactly once.',
      })
    }
  }),
])

export const createMotionStudioAudioSelectionRequestV1Schema:
z.ZodType<CreateMotionStudioAudioSelectionRequestV1> = z.object({
  expectedCurrentSelection: expectedCurrentSelectionSchema,
  narrationChoices: z.array(narrationChoiceSchema).min(1).max(512).readonly(),
  optionalRoleDecisions: z.array(z.discriminatedUnion('decision', [
    selectedRoleDecisionSchema,
    emptyRoleDecisionSchema,
  ])).length(4).readonly(),
  decisionReason: safeText,
}).strict().superRefine((value, context) => {
  const voiceSegmentIds = value.narrationChoices.map((choice) => choice.voiceSegmentId)
  const narrationCandidateIds = value.narrationChoices.map((choice) => choice.selectedTakeId)
  const roles = value.optionalRoleDecisions.map((decision) => decision.role)
  const optionalCandidateIds = value.optionalRoleDecisions.flatMap((decision) =>
    decision.candidateIds)
  if (!allUnique(voiceSegmentIds) || !allUnique(narrationCandidateIds)) {
    context.addIssue({
      code: 'custom',
      path: ['narrationChoices'],
      message: 'Each voice segment and narration candidate can be selected only once.',
    })
  }
  if (!sameSet(roles, ['music', 'foley', 'ambience', 'exact_sfx'])) {
    context.addIssue({
      code: 'custom',
      path: ['optionalRoleDecisions'],
      message: 'Every optional audio role requires exactly one explicit decision.',
    })
  }
  if (!allUnique([...narrationCandidateIds, ...optionalCandidateIds])) {
    context.addIssue({
      code: 'custom',
      path: ['optionalRoleDecisions'],
      message: 'A reviewed candidate cannot be selected into multiple audio roles.',
    })
  }
})

export const createMotionStudioAudioIntegrationBindingRequestV1Schema:
z.ZodType<CreateMotionStudioAudioIntegrationBindingRequestV1> = z.object({
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
}).strict()

export const canonicalMotionStudioAudioSelectionPreparedSourceSchema = z.object({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_AUDIO_SELECTION_SOURCE_VERSION),
  sourceAuthorityDigest: digest,
  evidenceClass: z.literal('canonical_backend_verified_runtime'),
  releaseClass: z.literal('private_audio_selection_release'),
  exactCurrentAuthorityReverified: z.literal(true),
  dependencyAcceptanceReverified: z.literal(true),
  selectedCandidateEvidenceReverified: z.literal(true),
  selectionCompilationAuthorized: z.literal(true),
  compilerInput: z.unknown(),
}).strict()

export const canonicalMotionStudioAudioSelectionCommitReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_AUDIO_SELECTION_COMMIT_VERSION),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  selectionManifest: motionStudioAudioSelectionManifestV1Schema,
  selectionManifestDigest: digest,
  sourceAuthorityDigest: digest,
  requestHash: digest,
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  authorizationBeforeIdempotency: z.literal(true),
  compareAndSwapVerified: z.literal(true),
  createOnly: z.literal(true),
  immutable: z.literal(true),
  selectionExplicit: z.literal(true),
  firstOrOnlyCandidateAutoSelected: z.literal(false),
  mixStarted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict()

const internalIntegrationJobSchema = z.object({
  stage: z.enum(['narration_assembly', 'integrated_audio_mix']),
  jobId: stableId,
  approvedWorkItemId: stableId,
  workerClass: z.enum([
    'motion_studio_narration_assembly_worker',
    'motion_studio_audio_mix_worker',
  ]),
  status: z.enum([
    'blocked', 'queued', 'ready', 'running', 'succeeded', 'failed',
    'reconciliation_required', 'cancelled',
  ]),
  dependencyJobIds: z.array(stableId).max(1).readonly(),
  costBudgetId: stableId,
  maximumAuthorizedInternalCostMicros: positiveSafeInteger,
  currency: z.literal('USD'),
  maximumAttempts: z.literal(1),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
  automaticSubstitution: z.literal(false),
}).strict()

export const canonicalMotionStudioAudioIntegrationBindingReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_MOTION_STUDIO_AUDIO_INTEGRATION_BINDING_VERSION),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  bindingId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  requestedByActorId: stableId,
  requestHash: digest,
  sourceAuthorityDigest: digest,
  packageRecordId: stableId,
  workGraphDigest: digest,
  maximumAuthorizedInternalCostMicros: positiveSafeInteger,
  currency: z.literal('USD'),
  jobs: z.tuple([internalIntegrationJobSchema, internalIntegrationJobSchema]).readonly(),
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  authorizationBeforeIdempotency: z.literal(true),
  selectionRevalidated: z.literal(true),
  existingReservationReused: z.literal(true),
  graphCreatedAtomically: z.literal(true),
  canonicalPackageQueue: z.literal(true),
  automaticCandidateSelectionPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  videoMuxPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  publicDeliveryPerformed: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict().superRefine((value, context) => {
  const [assembly, mix] = value.jobs
  if (
    assembly.stage !== 'narration_assembly' ||
    assembly.workerClass !== 'motion_studio_narration_assembly_worker' ||
    assembly.dependencyJobIds.length !== 0 ||
    mix.stage !== 'integrated_audio_mix' ||
    mix.workerClass !== 'motion_studio_audio_mix_worker' ||
    mix.dependencyJobIds.length !== 1 ||
    mix.dependencyJobIds[0] !== assembly.jobId ||
    assembly.jobId === mix.jobId ||
    assembly.approvedWorkItemId === mix.approvedWorkItemId ||
    assembly.maximumAuthorizedInternalCostMicros +
      mix.maximumAuthorizedInternalCostMicros >
      value.maximumAuthorizedInternalCostMicros
  ) {
    context.addIssue({
      code: 'custom',
      path: ['jobs'],
      message: 'Audio integration requires exactly narration assembly followed by integrated mix within the approved internal-cost ceiling.',
    })
  }
})

export const motionStudioAudioSelectionCommitReceiptDtoV1Schema:
z.ZodType<MotionStudioAudioSelectionCommitReceiptDtoV1> = z.object({
  schemaVersion: z.literal('motion-studio.audio-selection-commit-receipt.dto.v1'),
  productionId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  state: z.literal('selected_pending_integration'),
  selectedNarrationSegmentCount: positiveSafeInteger,
  selectedOptionalStemCount: z.number().int().nonnegative().max(256),
  optionalRoleDecisions: z.array(z.object({
    role: z.enum(['music', 'foley', 'ambience', 'exact_sfx']),
    decision: z.enum(['selected', 'not_selected', 'not_needed']),
    selectedCandidateCount: z.number().int().nonnegative().max(64),
  }).strict()).length(4).readonly(),
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  immutable: z.literal(true),
  selectionExplicit: z.literal(true),
  firstOrOnlyCandidateAutoSelected: z.literal(false),
  mixStarted: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict()

export const motionStudioAudioIntegrationBindingReceiptDtoV1Schema:
z.ZodType<MotionStudioAudioIntegrationBindingReceiptDtoV1> = z.object({
  schemaVersion: z.literal('motion-studio.audio-integration-binding-receipt.dto.v1'),
  productionId: stableId,
  bindingId: stableId,
  selectionManifestId: stableId,
  selectionManifestVersion: positiveSafeInteger,
  selectionManifestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  state: z.enum([
    'queued_private_audio_integration',
    'resumable_private_audio_integration',
  ]),
  jobs: z.tuple([
    z.object({
      stage: z.enum(['narration_assembly', 'integrated_audio_mix']),
      jobId: stableId,
      status: z.enum([
        'blocked', 'queued', 'ready', 'running', 'succeeded', 'failed',
        'reconciliation_required', 'cancelled',
      ]),
      dependencyJobIds: z.array(stableId).max(1).readonly(),
    }).strict(),
    z.object({
      stage: z.enum(['narration_assembly', 'integrated_audio_mix']),
      jobId: stableId,
      status: z.enum([
        'blocked', 'queued', 'ready', 'running', 'succeeded', 'failed',
        'reconciliation_required', 'cancelled',
      ]),
      dependencyJobIds: z.array(stableId).max(1).readonly(),
    }).strict(),
  ]).readonly(),
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  canonicalPackageQueue: z.literal(true),
  selectionRevalidated: z.literal(true),
  existingReservationReused: z.literal(true),
  graphCreatedAtomically: z.literal(true),
  automaticCandidateSelectionPerformed: z.literal(false),
  providerCallPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  videoMuxPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  exportPerformed: z.literal(false),
  publicDeliveryPerformed: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
}).strict()

export type CanonicalMotionStudioAudioSelectionPreparedSource = z.infer<
  typeof canonicalMotionStudioAudioSelectionPreparedSourceSchema
>
export type CanonicalMotionStudioAudioSelectionCommitReceipt = z.infer<
  typeof canonicalMotionStudioAudioSelectionCommitReceiptSchema
>
export type CanonicalMotionStudioAudioIntegrationBindingReceipt = z.infer<
  typeof canonicalMotionStudioAudioIntegrationBindingReceiptSchema
>

function allUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return allUnique(left) && allUnique(right) && left.length === right.length &&
    left.every((value) => right.includes(value))
}
