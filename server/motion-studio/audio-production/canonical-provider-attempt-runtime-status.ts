import { z } from 'zod'

import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
} from '../../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../../errors/api-error'
import {
  canonicalProviderAttemptRuntimeLocatorSchema,
  readCanonicalProviderAttemptRuntimeRecord,
  type CanonicalProviderAttemptRuntimeLocator,
  type CanonicalProviderAttemptRuntimeRecordSourcePort,
} from '../../services/canonical-provider-attempt-runtime-record-port'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_PROVIDER_ATTEMPT_RUNTIME_STATUS_VERSION =
  'motion-studio.provider-attempt-runtime-status.v1' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const providerIdentity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const operationIdSchema = z.enum([
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
])

const attemptOutcomeSchema = z.enum([
  'never_submitted',
  'completed',
  'failed',
  'cancelled',
  'unknown_reconciliation_required',
  'unknown_reconciled_completed',
  'unknown_reconciled_failed',
])

const outputSummarySchema = z.object({
  outputId: identity,
  role: identity,
  assetVersionId: identity,
  contentSha256: digest,
  byteLength: z.number().int().positive().max(256 * 1024 * 1024),
  mimeType: z.enum([
    'audio/wav',
    'video/mp4',
    'audio/mpeg',
    'application/json',
  ]),
  providerGenerated: z.boolean(),
}).strict()

const motionBlockerSchema = z.enum([
  'provider_attempt_never_submitted',
  'provider_attempt_cancelled',
  'provider_attempt_failed',
  'provider_attempt_unknown_reconciliation_required',
  'private_injected_source_evidence',
  'canonical_backend_runtime_release_required',
  'provider_transport_qualification_required',
  'provider_usage_or_cost_reconciliation_required',
  'worker_infrastructure_cost_reconciliation_required',
  'consumer_owned_production_binding_required',
  'authenticated_private_artifact_readback_required',
])

export const motionStudioProviderAttemptRuntimeStatusSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_PROVIDER_ATTEMPT_RUNTIME_STATUS_VERSION,
  ),
  statusId: identity,
  productionId: identity,
  projectedAt: timestamp,
  uiState: z.enum([
    'not_started',
    'cancelled',
    'private_evidence_only',
    'unreleased_runtime_blocked',
    'failed_review_required',
    'recovery_required',
    'ready_for_private_production_binding',
  ]),
  nextAction: z.enum([
    'await_approved_submission',
    'review_cancelled_attempt',
    'await_released_provider_runtime',
    'review_failed_attempt',
    'reconcile_unknown_outcome',
    'verify_motion_production_and_private_artifact_binding',
  ]),
  locator: canonicalProviderAttemptRuntimeLocatorSchema,
  canonicalRecord: z.object({
    recordId: identity,
    recordDigest: digest,
    recordKind: z.enum(['provider_attempt', 'provider_non_execution']),
    attemptOutcome: attemptOutcomeSchema,
    state: z.enum([
      'non_execution',
      'non_promotable_private_injected',
      'validated_unreleased_runtime_blocked',
      'canonical_backend_verified_runtime',
    ]),
    evidenceClass: z.enum([
      'non_execution',
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
      'canonical_backend_verified_runtime',
    ]),
    promotionClass: z.enum([
      'none',
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
      'released_private_provider_runtime',
    ]),
  }).strict(),
  providerAttempt: z.object({
    operationId: operationIdSchema,
    providerRouteId: identity,
    providerModelId: providerIdentity,
    providerRequestStarted: z.boolean(),
    providerRequestCount: z.union([z.literal(0), z.literal(1)]),
    outputSetDigest: digest,
    outputs: z.array(outputSummarySchema).max(8),
    providerCostMicros: safeMicros.nullable(),
    providerUsageAndCostReconciled: z.boolean(),
    workerInfrastructureCostMicros: safeMicros.nullable(),
    workerInfrastructureCostProvisional: z.boolean(),
    workerInfrastructureCostReconciled: z.boolean(),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  motionBinding: z.object({
    productionId: identity,
    locatorDigest: digest,
    exactCanonicalEditIdentityVerified: z.literal(true),
    expectedOperationOutputShapeVerified: z.boolean(),
    consumerOwnedProductionBindingVerified: z.literal(false),
    authenticatedPrivateArtifactReadbackVerified: z.literal(false),
  }).strict(),
  blockers: z.array(motionBlockerSchema).max(12).readonly(),
  readiness: z.object({
    canonicalRuntimeLocatorVerified: z.literal(true),
    exactCanonicalProviderRecordLocated: z.literal(true),
    canonicalBackendVerifiedRuntime: z.boolean(),
    providerTransportVerified: z.boolean(),
    actualProviderCandidatePresent: z.boolean(),
    privateCandidateIngestAuthorized: z.literal(false),
    objectiveQaAuthorized: z.literal(false),
    humanReviewAuthorized: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  boundaries: z.object({
    serverOnly: z.literal(true),
    readOnlyProjection: z.literal(true),
    browserAuthorityIncluded: z.literal(false),
    rawCredentialIncluded: z.literal(false),
    rawPromptOrRequestBodyIncluded: z.literal(false),
    providerUrlIncluded: z.literal(false),
    localPathIncluded: z.literal(false),
    automaticRetryAllowed: z.literal(false),
    automaticFallbackAllowed: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    billingAuthorityIncluded: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    canonicalRuntimeRecordReadCount: z.literal(1),
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    costMutationCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  statusDigest: digest,
}).strict().superRefine((value, context) => {
  const verified = value.canonicalRecord.state ===
    'canonical_backend_verified_runtime'
  const expectedReady = verified && [
    'completed',
    'unknown_reconciled_completed',
  ].includes(value.canonicalRecord.attemptOutcome) &&
    value.motionBinding.expectedOperationOutputShapeVerified
  if (
    value.readiness.canonicalBackendVerifiedRuntime !== verified ||
    value.readiness.providerTransportVerified !== verified ||
    value.readiness.actualProviderCandidatePresent !== expectedReady ||
    (expectedReady && (
      value.uiState !== 'ready_for_private_production_binding' ||
      value.nextAction !==
        'verify_motion_production_and_private_artifact_binding' ||
      !value.blockers.includes('consumer_owned_production_binding_required') ||
      !value.blockers.includes('authenticated_private_artifact_readback_required')
    )) ||
    value.readiness.privateCandidateIngestAuthorized ||
    value.readiness.objectiveQaAuthorized ||
    value.readiness.humanReviewAuthorized ||
    value.readiness.selectionEligible ||
    value.readiness.finalMixEligible ||
    value.readiness.timelineEligible
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Motion Studio provider runtime status is internally inconsistent.',
    })
  }
})

export type MotionStudioProviderAttemptRuntimeStatus = z.infer<
  typeof motionStudioProviderAttemptRuntimeStatusSchema
>

/**
 * Reads the canonical server-only provider-attempt locator. This adapter does
 * not accept a caller-shaped runtime record and never turns the bounded
 * canonical projection into candidate-ingest authority. A released record
 * still needs the Motion production binding plus authenticated private-object
 * readback before the existing ingest/QA/review chain may run.
 */
export async function readMotionStudioProviderAttemptRuntimeStatus(input: {
  authorizedOwnerUserId: string
  productionId: string
  hosted: boolean
  port: CanonicalProviderAttemptRuntimeRecordSourcePort
  locator: CanonicalProviderAttemptRuntimeLocator
  projectedAt: string
}): Promise<MotionStudioProviderAttemptRuntimeStatus> {
  const ownerUserId = identity.parse(input.authorizedOwnerUserId)
  const productionId = identity.parse(input.productionId)
  const locator = canonicalProviderAttemptRuntimeLocatorSchema.parse(
    input.locator,
  )
  if (ownerUserId !== locator.ownerUserId) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Provider-attempt runtime locator is outside the authorized owner scope.',
      403,
    )
  }
  const runtime = await readCanonicalProviderAttemptRuntimeRecord({
    hosted: input.hosted,
    port: input.port,
    locator,
    projectedAt: input.projectedAt,
  })
  const projectedAt = exactIso(input.projectedAt)
  const canonical = runtime.recordKind === 'provider_attempt'
    ? {
        recordId: runtime.recordId,
        recordDigest: runtime.recordDigest,
        recordKind: runtime.recordKind,
        attemptOutcome: runtime.attemptOutcome,
        state: runtime.state,
        evidenceClass: runtime.evidenceClass,
        promotionClass: runtime.promotionClass,
      }
    : {
        recordId: runtime.recordId,
        recordDigest: runtime.recordDigest,
        recordKind: runtime.recordKind,
        attemptOutcome: runtime.attemptOutcome,
        state: 'non_execution' as const,
        evidenceClass: 'non_execution' as const,
        promotionClass: 'none' as const,
      }
  const outputs = runtime.recordKind === 'provider_attempt'
    ? runtime.consumerProjection.privateOutputs.map((output) => ({
        outputId: output.outputId,
        role: output.role,
        assetVersionId: output.assetVersionId,
        contentSha256: output.contentSha256,
        byteLength: output.byteLength,
        mimeType: output.mimeType,
        providerGenerated: output.providerGenerated,
      }))
    : []
  const successful = runtime.attemptOutcome === 'completed' ||
    runtime.attemptOutcome === 'unknown_reconciled_completed'
  const outputShapeVerified = successful
    ? expectedOutputShapeMatches(locator.operationId, outputs)
    : outputs.length === 0
  if (successful && !outputShapeVerified) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical provider output set does not match the exact Motion Studio operation.',
      400,
      { requiredGate: 'motion_studio_provider_runtime_output_shape' },
    )
  }
  const verified = runtime.recordKind === 'provider_attempt' &&
    runtime.state === 'canonical_backend_verified_runtime'
  const state = projectUiState(runtime.attemptOutcome, verified)
  const blockers = projectBlockers(runtime, verified)
  const providerAttempt = runtime.recordKind === 'provider_attempt'
    ? {
        operationId: runtime.consumerProjection.operationId,
        providerRouteId: runtime.consumerProjection.providerRouteId,
        providerModelId: runtime.consumerProjection.providerModelId,
        providerRequestStarted:
          runtime.consumerProjection.providerRequestStarted,
        providerRequestCount: runtime.consumerProjection.providerRequestCount,
        outputSetDigest: runtime.consumerProjection.outputSetDigest,
        outputs,
        providerCostMicros: runtime.consumerProjection.providerCostMicros,
        providerUsageAndCostReconciled:
          runtime.consumerProjection.providerUsageAndCostReconciled,
        workerInfrastructureCostMicros:
          runtime.consumerProjection.workerInfrastructureCostMicros,
        workerInfrastructureCostProvisional:
          runtime.consumerProjection.workerInfrastructureCostProvisional,
        workerInfrastructureCostReconciled:
          runtime.consumerProjection.workerInfrastructureCostReconciled,
        failedOrUnknownAttemptCostRetained:
          runtime.consumerProjection.failedOrUnknownAttemptCostRetained,
      }
    : {
        operationId: runtime.consumerProjection.operationId,
        providerRouteId: runtime.consumerProjection.providerRouteId,
        providerModelId: runtime.consumerProjection.providerModelId,
        providerRequestStarted:
          runtime.consumerProjection.providerRequestStarted,
        providerRequestCount: runtime.consumerProjection.providerRequestCount,
        outputSetDigest: locator.expectedOutputSetDigest,
        outputs,
        providerCostMicros: null,
        providerUsageAndCostReconciled: false,
        workerInfrastructureCostMicros: null,
        workerInfrastructureCostProvisional: false,
        workerInfrastructureCostReconciled: false,
        failedOrUnknownAttemptCostRetained:
          runtime.consumerProjection.failedOrUnknownAttemptCostRetained,
      }
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_ATTEMPT_RUNTIME_STATUS_VERSION,
    statusId: `motion-provider-runtime-${runtime.recordDigest.slice(0, 40)}`,
    productionId,
    projectedAt,
    uiState: state.uiState,
    nextAction: state.nextAction,
    locator,
    canonicalRecord: canonical,
    providerAttempt,
    motionBinding: {
      productionId,
      locatorDigest: locator.locatorDigest,
      exactCanonicalEditIdentityVerified: true as const,
      expectedOperationOutputShapeVerified: outputShapeVerified,
      consumerOwnedProductionBindingVerified: false as const,
      authenticatedPrivateArtifactReadbackVerified: false as const,
    },
    blockers,
    readiness: {
      canonicalRuntimeLocatorVerified: true as const,
      exactCanonicalProviderRecordLocated: true as const,
      canonicalBackendVerifiedRuntime: verified,
      providerTransportVerified: verified,
      actualProviderCandidatePresent: verified && successful &&
        outputShapeVerified,
      privateCandidateIngestAuthorized: false as const,
      objectiveQaAuthorized: false as const,
      humanReviewAuthorized: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      productReady: false as const,
    },
    boundaries: {
      serverOnly: true as const,
      readOnlyProjection: true as const,
      browserAuthorityIncluded: false as const,
      rawCredentialIncluded: false as const,
      rawPromptOrRequestBodyIncluded: false as const,
      providerUrlIncluded: false as const,
      localPathIncluded: false as const,
      automaticRetryAllowed: false as const,
      automaticFallbackAllowed: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      billingAuthorityIncluded: false as const,
      productionReady: false as const,
    },
    sideEffects: {
      canonicalRuntimeRecordReadCount: 1 as const,
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      costMutationCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioProviderAttemptRuntimeStatusSchema.parse({
    ...base,
    statusDigest: sha256CanonicalJson(base),
  }))
}

function expectedOutputShapeMatches(
  operationId: z.infer<typeof operationIdSchema>,
  outputs: readonly z.infer<typeof outputSummarySchema>[],
): boolean {
  const expected = operationId === CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID
    ? [{ role: 'generated_instrumental_score_candidate', mimeType: 'audio/wav' }]
    : operationId ===
        CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID
      ? [
          { role: 'provider_storytelling_speech_audio_mp3', mimeType: 'audio/mpeg' },
          {
            role: 'provider_storytelling_speech_alignment_json',
            mimeType: 'application/json',
          },
        ]
      : operationId === CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID
        ? [{ role: 'provider_synchronized_audio_mp4', mimeType: 'video/mp4' }]
        : [{ role: 'provider_visual_calibration_video_mp4', mimeType: 'video/mp4' }]
  return outputs.length === expected.length && expected.every((entry, index) =>
    outputs[index]?.role === entry.role &&
    outputs[index]?.mimeType === entry.mimeType)
}

function projectUiState(
  outcome: z.infer<typeof attemptOutcomeSchema>,
  verified: boolean,
): Pick<MotionStudioProviderAttemptRuntimeStatus, 'uiState' | 'nextAction'> {
  if (outcome === 'never_submitted') return {
    uiState: 'not_started',
    nextAction: 'await_approved_submission',
  }
  if (outcome === 'cancelled') return {
    uiState: 'cancelled',
    nextAction: 'review_cancelled_attempt',
  }
  if (outcome === 'unknown_reconciliation_required') return {
    uiState: 'recovery_required',
    nextAction: 'reconcile_unknown_outcome',
  }
  if (outcome === 'failed' || outcome === 'unknown_reconciled_failed') return {
    uiState: 'failed_review_required',
    nextAction: 'review_failed_attempt',
  }
  if (verified) return {
    uiState: 'ready_for_private_production_binding',
    nextAction: 'verify_motion_production_and_private_artifact_binding',
  }
  return {
    uiState: 'private_evidence_only',
    nextAction: 'await_released_provider_runtime',
  }
}

function projectBlockers(
  runtime: Awaited<ReturnType<typeof readCanonicalProviderAttemptRuntimeRecord>>,
  verified: boolean,
): MotionStudioProviderAttemptRuntimeStatus['blockers'] {
  const blockers: z.infer<typeof motionBlockerSchema>[] = []
  if (runtime.attemptOutcome === 'never_submitted') {
    blockers.push('provider_attempt_never_submitted')
  } else if (runtime.attemptOutcome === 'cancelled') {
    blockers.push('provider_attempt_cancelled')
  } else if (runtime.attemptOutcome === 'unknown_reconciliation_required') {
    blockers.push('provider_attempt_unknown_reconciliation_required')
  } else if (
    runtime.attemptOutcome === 'failed' ||
    runtime.attemptOutcome === 'unknown_reconciled_failed'
  ) {
    blockers.push('provider_attempt_failed')
  }
  if (runtime.recordKind === 'provider_attempt') {
    if (runtime.state === 'non_promotable_private_injected') {
      blockers.push('private_injected_source_evidence')
    }
    if (!verified) {
      blockers.push(
        'canonical_backend_runtime_release_required',
        'provider_transport_qualification_required',
      )
    }
    if (
      runtime.consumerProjection.providerRequestStarted &&
      !runtime.consumerProjection.providerUsageAndCostReconciled
    ) blockers.push('provider_usage_or_cost_reconciliation_required')
    if (!runtime.consumerProjection.workerInfrastructureCostReconciled) {
      blockers.push('worker_infrastructure_cost_reconciliation_required')
    }
  }
  if (verified) {
    blockers.push(
      'consumer_owned_production_binding_required',
      'authenticated_private_artifact_readback_required',
    )
  }
  return [...new Set(blockers)]
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new ApiError('VALIDATION_FAILED', 'Projection time is invalid.', 400)
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}
