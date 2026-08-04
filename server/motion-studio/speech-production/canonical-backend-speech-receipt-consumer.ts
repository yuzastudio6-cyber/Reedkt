import { z } from 'zod'

import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../../edit-architecture/canonical-provider-lifecycle-policy'
import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  resolveCanonicalProviderOperationV2,
} from '../../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../../errors/api-error'
import {
  projectCanonicalPrivateProviderAttemptConsumerReceiptV2,
  type ProjectCanonicalPrivateProviderAttemptConsumerReceiptV2Input,
} from '../../services/canonical-private-provider-attempt-consumer-receipt-service'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../../validation/canonical-provider-attempt-consumer-receipt-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioCanonicalBackendSpeechOperationRequirement,
  type MotionStudioCanonicalBackendSpeechOperationRequirementV1,
} from './canonical-backend-speech-operation-requirement'

export const MOTION_STUDIO_CANONICAL_SPEECH_RECEIPT_CONSUMPTION_VERSION =
  'motion-studio.canonical-speech-receipt-consumption.v1' as const
export const MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN_VERSION =
  'motion-studio.canonical-speech-backend-source-pin.v1' as const

const canonicalSpeechBackendSourcePinBase = {
  schemaVersion: MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN_VERSION,
  backendBranch: 'codex/backend-workflow-pipeline-continuation',
  backendCommitSha: 'aa27e55a2126fc0dd7ec3e674f958d8750182e58',
  backendTreeSha: '04f8b87ad975ac03d55f8162ad0caa3db69580cd',
  verdict:
    'CANONICAL_STORYTELLING_SPEECH_MULTI_OUTPUT_PRIVATE_INJECTED_ACCEPTED_TRANSPORT_BLOCKED',
  aggregatePipelinePassedPhases: 43,
  aggregatePipelineTotalPhases: 43,
  sourceFiles: {
    receiptSchemaSha256:
      'eb958eaa3a9ba4e646c9a68518b010057cf431ff1690ca99379f7d3778428a00',
    receiptServiceSha256:
      '0d868d12f88054083caebfdb28cbf3f05a4cc50293a3c9084b9e356393abe3d3',
    lifecyclePolicySha256:
      '410d4925ae5474673ecdb61bcab7f14a361b21bd3385c29e04f21960296afc57',
    candidateStoreSha256:
      '61e1f5f1d236bef10487a043c16e050977f860d068e6fe4cadbf428d08cf5ad8',
    providerAttemptCostSha256:
      '90bdef09d385713f940ff97a12b5c038efd89a1909ccb633c646972ee78dbf92',
    workAuthoritySha256:
      '48f29aadf161479d9000fffafcd91c5a0809a799ce84727584d516b6f31a9c1a',
    lifecycleServiceSha256:
      '41a94dbdfadfd0cb425072446930cc4360313dcaa0f935bf8ad849a92f634884',
    dispatchSchemasSha256:
      'b1f5e3f8c6216371324b370bb13cf7862dd8ff42f9cc25ca5667fbdb664f52f8',
    verificationSha256:
      '809ff589750324c8a50780bddbc1df3749ebc8b1a8bd72b33a04c8bfbac929d3',
    focusedSmokeSha256:
      '8828186a9d9f7895026678eeb8406183309c96091a3d8db47fbc29fd320764e6',
  },
  contractSourcePinned: true,
  providerTransportActivated: false,
  productionPromotionAuthorized: false,
} as const

export const MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN = deepFreeze({
  ...canonicalSpeechBackendSourcePinBase,
  sourcePinDigest: sha256CanonicalJson(canonicalSpeechBackendSourcePinBase),
})

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeMicrosSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const motionStudioCanonicalSpeechBackendSourcePinV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN_VERSION,
  ),
  backendBranch: z.literal('codex/backend-workflow-pipeline-continuation'),
  backendCommitSha: z.literal('aa27e55a2126fc0dd7ec3e674f958d8750182e58'),
  backendTreeSha: z.literal('04f8b87ad975ac03d55f8162ad0caa3db69580cd'),
  verdict: z.literal(
    'CANONICAL_STORYTELLING_SPEECH_MULTI_OUTPUT_PRIVATE_INJECTED_ACCEPTED_TRANSPORT_BLOCKED',
  ),
  aggregatePipelinePassedPhases: z.literal(43),
  aggregatePipelineTotalPhases: z.literal(43),
  sourceFiles: z.object({
    receiptSchemaSha256: z.literal(
      'eb958eaa3a9ba4e646c9a68518b010057cf431ff1690ca99379f7d3778428a00',
    ),
    receiptServiceSha256: z.literal(
      '0d868d12f88054083caebfdb28cbf3f05a4cc50293a3c9084b9e356393abe3d3',
    ),
    lifecyclePolicySha256: z.literal(
      '410d4925ae5474673ecdb61bcab7f14a361b21bd3385c29e04f21960296afc57',
    ),
    candidateStoreSha256: z.literal(
      '61e1f5f1d236bef10487a043c16e050977f860d068e6fe4cadbf428d08cf5ad8',
    ),
    providerAttemptCostSha256: z.literal(
      '90bdef09d385713f940ff97a12b5c038efd89a1909ccb633c646972ee78dbf92',
    ),
    workAuthoritySha256: z.literal(
      '48f29aadf161479d9000fffafcd91c5a0809a799ce84727584d516b6f31a9c1a',
    ),
    lifecycleServiceSha256: z.literal(
      '41a94dbdfadfd0cb425072446930cc4360313dcaa0f935bf8ad849a92f634884',
    ),
    dispatchSchemasSha256: z.literal(
      'b1f5e3f8c6216371324b370bb13cf7862dd8ff42f9cc25ca5667fbdb664f52f8',
    ),
    verificationSha256: z.literal(
      '809ff589750324c8a50780bddbc1df3749ebc8b1a8bd72b33a04c8bfbac929d3',
    ),
    focusedSmokeSha256: z.literal(
      '8828186a9d9f7895026678eeb8406183309c96091a3d8db47fbc29fd320764e6',
    ),
  }).strict(),
  contractSourcePinned: z.literal(true),
  providerTransportActivated: z.literal(false),
  productionPromotionAuthorized: z.literal(false),
  sourcePinDigest: z.literal(
    MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN.sourcePinDigest,
  ),
}).strict().superRefine((value, context) => {
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.sourcePinDigest
  if (sha256CanonicalJson(unsigned) !== value.sourcePinDigest) {
    context.addIssue({
      code: 'custom',
      path: ['sourcePinDigest'],
      message: 'Canonical Speech backend source pin failed immutable digest verification.',
    })
  }
})

const outputProjectionBase = {
  outputId: stableIdSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  artifactEvidenceDigest: digestSchema,
  storageEvidenceHash: digestSchema,
  sourceReadbackEvidenceHash: digestSchema,
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
} as const

const outputProjectionSchema = z.discriminatedUnion('role', [
  z.object({
    ...outputProjectionBase,
    role: z.literal('provider_storytelling_speech_audio_mp3'),
    byteLength: z.number().int().positive().max(16_777_216),
    mimeType: z.literal('audio/mpeg'),
  }).strict(),
  z.object({
    ...outputProjectionBase,
    role: z.literal('provider_storytelling_speech_alignment_json'),
    byteLength: z.number().int().positive().max(1_048_576),
    mimeType: z.literal('application/json'),
  }).strict(),
])

const blockerSchema = z.enum([
  'source_evidence_private_injected_nonprovider_test',
  'source_evidence_canonical_backend_runtime_unreleased',
  'canonical_backend_runtime_receipt_release_required',
  'immutable_provider_revision_qualification_required',
  'exact_production_rate_authority_required',
  'production_account_entitlement_required',
  'production_zero_retention_entitlement_required',
  'provider_transport_qualification_required',
  'production_multi_segment_continuity_required',
  'consumer_owned_production_authority_release_required',
  'provider_attempt_failed',
  'provider_attempt_unknown_reconciliation_required',
  'provider_or_infrastructure_cost_reconciliation_required',
  'provider_or_infrastructure_cost_exceeds_authorized_ceiling',
])

export const motionStudioCanonicalSpeechReceiptConsumptionV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_SPEECH_RECEIPT_CONSUMPTION_VERSION,
  ),
  consumptionId: stableIdSchema,
  state: z.enum([
    'validated_non_promotable_private_injected',
    'validated_unreleased_runtime_blocked',
  ]),
  sourceProjection: z.object({
    service: z.literal('projectCanonicalPrivateProviderAttemptConsumerReceiptV2'),
    source: z.literal('verified_private_canonical_provider_attempt_stores'),
    receiptId: stableIdSchema,
    receiptHash: digestSchema,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
    ]),
    consumerContextDigest: digestSchema,
    outputSetDigest: digestSchema,
    providerAttemptEvidenceHash: digestSchema,
    workerResourceEvidenceHash: digestSchema,
    queueJobId: stableIdSchema,
    queueAttemptId: stableIdSchema,
    queueLeaseId: stableIdSchema,
    dispatchAttemptId: stableIdSchema,
  }).strict(),
  frozenBackendSourcePin: motionStudioCanonicalSpeechBackendSourcePinV1Schema,
  requirementBinding: z.object({
    requirementId: stableIdSchema,
    requirementDigest: digestSchema,
    productionId: stableIdSchema,
    preparedScriptSegmentId: stableIdSchema,
    voiceSegmentId: stableIdSchema,
    voiceBindingId: stableIdSchema,
    voiceIdentityHash: digestSchema,
    timingAuthorityDigest: digestSchema,
    jobId: stableIdSchema,
    motionAttemptId: stableIdSchema,
    motionLeaseId: stableIdSchema,
    costBudgetId: stableIdSchema,
    idempotencyKeyHash: digestSchema,
    consumerContextDigest: digestSchema,
    sourceReceiptHash: digestSchema,
    bindingDigest: digestSchema,
  }).strict(),
  provider: z.object({
    operationId: z.literal(
      CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
    ),
    operationProfileHash: digestSchema,
    lifecyclePolicyHash: digestSchema,
    providerBoundaryProfileId: z.literal(
      'elevenlabs_eleven_v3_storytelling_speech_provider_boundary',
    ),
    providerRouteId: z.literal('elevenlabs_eleven_v3_storytelling_speech'),
    providerModelId: z.literal('eleven_v3'),
    terminalState: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
  }).strict(),
  privateOutputs: z.tuple([
    outputProjectionSchema,
    outputProjectionSchema,
  ]).or(z.tuple([])),
  internalCost: z.object({
    providerUsageEvidenceDigest: digestSchema.nullable(),
    providerRateCardDigest: digestSchema,
    providerCostMicros: safeMicrosSchema.nullable(),
    workerInfrastructureEvidenceDigest: digestSchema,
    workerInfrastructureRateCardDigest: digestSchema,
    workerInfrastructureCostMicros: safeMicrosSchema,
    totalInternalProductionCostMicros: safeMicrosSchema.nullable(),
    costWithinRequirementCeilings: z.boolean(),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    internalProductionCostOnly: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  verification: z.object({
    canonicalSourceProjectionInvokedDirectly: z.literal(true),
    canonicalQueueDispatchCostResourceAndOutputStoresReverified: z.literal(true),
    receiptHashVerified: z.literal(true),
    sourceOutputSetDigestVerified: z.literal(true),
    exactSpeechRequirementScopeMatched: z.literal(true),
    exactOperationProfileAndLifecycleMatched: z.literal(true),
    orderedAudioAndAlignmentOutputsMatched: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    canonicalBackendRuntimeReceiptReleased: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict(),
  blockers: z.array(blockerSchema).min(9).max(14).readonly(),
  readiness: z.object({
    canonicalSpeechOperationIdentityFrozen: z.literal(true),
    canonicalMultiOutputLifecycleAdmitted: z.literal(true),
    directSameTreeSourceProjectionVerified: z.literal(true),
    actualProviderCandidatePresent: z.literal(false),
    normalizationAuthorized: z.literal(false),
    productionContinuityEligible: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    ms012cAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    canonicalSourceProjectionCount: z.literal(1),
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
  consumptionDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const expectedState = value.sourceProjection.evidenceClass ===
    'private_injected_nonprovider_test'
    ? 'validated_non_promotable_private_injected'
    : 'validated_unreleased_runtime_blocked'
  const expectedPromotion = value.sourceProjection.evidenceClass ===
    'private_injected_nonprovider_test'
    ? 'non_promotable_private_injected'
    : 'unreleased_runtime_not_production'
  const requiredBlockers = [
    value.sourceProjection.evidenceClass === 'private_injected_nonprovider_test'
      ? 'source_evidence_private_injected_nonprovider_test'
      : 'source_evidence_canonical_backend_runtime_unreleased',
    'canonical_backend_runtime_receipt_release_required',
    'immutable_provider_revision_qualification_required',
    'exact_production_rate_authority_required',
    'production_account_entitlement_required',
    'production_zero_retention_entitlement_required',
    'provider_transport_qualification_required',
    'production_multi_segment_continuity_required',
    'consumer_owned_production_authority_release_required',
  ]
  const successful = value.provider.terminalState === 'succeeded' ||
    value.provider.terminalState === 'unknown_reconciled_succeeded'
  const outputOrderValid = !successful || (
    value.privateOutputs.length === 2 &&
    value.privateOutputs[0]?.role === 'provider_storytelling_speech_audio_mp3' &&
    value.privateOutputs[0]?.mimeType === 'audio/mpeg' &&
    value.privateOutputs[1]?.role ===
      'provider_storytelling_speech_alignment_json' &&
    value.privateOutputs[1]?.mimeType === 'application/json'
  )
  const expectedTotal = value.internalCost.providerCostMicros === null
    ? null
    : value.internalCost.providerCostMicros +
      value.internalCost.workerInfrastructureCostMicros
  if (
    value.state !== expectedState ||
    value.sourceProjection.promotionClass !== expectedPromotion ||
    requiredBlockers.some((blocker) => !value.blockers.includes(
      blocker as z.infer<typeof blockerSchema>,
    )) ||
    value.requirementBinding.consumerContextDigest !==
      value.sourceProjection.consumerContextDigest ||
    value.requirementBinding.sourceReceiptHash !==
      value.sourceProjection.receiptHash ||
    successful !== (value.privateOutputs.length === 2) ||
    !outputOrderValid ||
    value.internalCost.totalInternalProductionCostMicros !== expectedTotal
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical Storytelling Speech receipt consumption is inconsistent.',
    })
  }
})

export type MotionStudioCanonicalSpeechReceiptConsumptionV1 = z.infer<
  typeof motionStudioCanonicalSpeechReceiptConsumptionV1Schema
>

export async function consumeMotionStudioCanonicalSpeechAttemptFromSourceStores(
  input: {
    authorizedOwnerUserId: string
    requirement: MotionStudioCanonicalBackendSpeechOperationRequirementV1
    sourceProjection: ProjectCanonicalPrivateProviderAttemptConsumerReceiptV2Input
  },
): Promise<MotionStudioCanonicalSpeechReceiptConsumptionV1> {
  const ownerUserId = stableIdSchema.parse(input.authorizedOwnerUserId)
  const requirement = assertMotionStudioCanonicalBackendSpeechOperationRequirement(
    input.requirement,
  )
  const receipt = canonicalProviderAttemptConsumerReceiptSchema.parse(
    await projectCanonicalPrivateProviderAttemptConsumerReceiptV2(
      input.sourceProjection,
    ),
  )
  verifyReceiptHash(receipt)
  const profile = resolveCanonicalProviderOperationV2(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  )
  const lifecyclePolicy = resolveCanonicalProviderLifecyclePolicy(
    CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  )
  assertExactRequirementAndReceipt({
    ownerUserId,
    profile,
    lifecyclePolicyHash: lifecyclePolicy.policyHash,
    receipt,
    requirement,
  })

  const successful = isSuccessfulTerminal(receipt.dispatch.terminalState)
  const costReconciled = receipt.internalCost.providerCostReconciled &&
    receipt.internalCost.providerCostMicros !== null &&
    receipt.internalCost.selectedTotalInternalCostMicros !== null
  const costWithinRequirementCeilings = costReconciled &&
    receipt.internalCost.providerCostMicros! <=
      requirement.costBoundary.maximumAuthorizedProviderCostMicros &&
    receipt.internalCost.selectedInfrastructureCostMicros <=
      requirement.costBoundary.maximumAuthorizedInfrastructureCostMicros &&
    receipt.internalCost.selectedTotalInternalCostMicros! <=
      requirement.costBoundary.maximumAuthorizedTotalInternalCostMicros
  const blockers: z.infer<typeof blockerSchema>[] = [
    receipt.evidenceClass === 'private_injected_nonprovider_test'
      ? 'source_evidence_private_injected_nonprovider_test'
      : 'source_evidence_canonical_backend_runtime_unreleased',
    'canonical_backend_runtime_receipt_release_required',
    'immutable_provider_revision_qualification_required',
    'exact_production_rate_authority_required',
    'production_account_entitlement_required',
    'production_zero_retention_entitlement_required',
    'provider_transport_qualification_required',
    'production_multi_segment_continuity_required',
    'consumer_owned_production_authority_release_required',
  ]
  if (receipt.dispatch.terminalState === 'unknown_reconciliation_required') {
    blockers.push('provider_attempt_unknown_reconciliation_required')
  } else if (!successful) {
    blockers.push('provider_attempt_failed')
  }
  if (!costReconciled) {
    blockers.push('provider_or_infrastructure_cost_reconciliation_required')
  } else if (!costWithinRequirementCeilings) {
    blockers.push('provider_or_infrastructure_cost_exceeds_authorized_ceiling')
  }

  const requirementBindingBase = {
    requirementId: requirement.requirementId,
    requirementDigest: requirement.requirementDigest,
    productionId: requirement.exactScope.productionId,
    preparedScriptSegmentId: requirement.exactScope.preparedScriptSegmentId,
    voiceSegmentId: requirement.exactScope.voiceSegmentId,
    voiceBindingId: requirement.exactScope.voiceBindingId,
    voiceIdentityHash: requirement.exactScope.voiceIdentityHash,
    timingAuthorityDigest: requirement.exactScope.timingAuthorityDigest,
    jobId: requirement.exactScope.jobId,
    motionAttemptId: requirement.exactScope.attemptId,
    motionLeaseId: requirement.exactScope.leaseId,
    costBudgetId: requirement.exactScope.costBudgetId,
    idempotencyKeyHash: requirement.exactScope.idempotencyKeyHash,
    consumerContextDigest: receipt.consumerContext.consumerContextDigest,
    sourceReceiptHash: receipt.receiptHash,
  }
  const requirementBinding = {
    ...requirementBindingBase,
    bindingDigest: sha256CanonicalJson(requirementBindingBase),
  }
  const privateOutputs:
    MotionStudioCanonicalSpeechReceiptConsumptionV1['privateOutputs'] = successful
      ? [
          outputProjectionSchema.parse(receipt.privateOutputs[0]),
          outputProjectionSchema.parse(receipt.privateOutputs[1]),
        ]
      : []
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_SPEECH_RECEIPT_CONSUMPTION_VERSION,
    consumptionId: `speech-receipt-consumption-${receipt.receiptHash.slice(0, 40)}`,
    state: receipt.evidenceClass === 'private_injected_nonprovider_test'
      ? 'validated_non_promotable_private_injected' as const
      : 'validated_unreleased_runtime_blocked' as const,
    sourceProjection: {
      service: 'projectCanonicalPrivateProviderAttemptConsumerReceiptV2' as const,
      source: receipt.source,
      receiptId: receipt.receiptId,
      receiptHash: receipt.receiptHash,
      evidenceClass: receipt.evidenceClass,
      promotionClass: receipt.promotionClass,
      consumerContextDigest: receipt.consumerContext.consumerContextDigest,
      outputSetDigest: receipt.outputSet.outputSetDigest,
      providerAttemptEvidenceHash:
        receipt.internalCost.providerAttemptEvidenceHash,
      workerResourceEvidenceHash:
        receipt.internalCost.workerResourceEvidenceHash,
      queueJobId: receipt.identity.queueJobId,
      queueAttemptId: receipt.queue.queueAttemptId,
      queueLeaseId: receipt.queue.leaseId,
      dispatchAttemptId: receipt.dispatch.dispatchAttemptId,
    },
    frozenBackendSourcePin: MOTION_STUDIO_CANONICAL_SPEECH_BACKEND_SOURCE_PIN,
    requirementBinding,
    provider: {
      operationId: CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
      operationProfileHash: receipt.provider.operationProfileHash,
      lifecyclePolicyHash: receipt.provider.lifecyclePolicyHash,
      providerBoundaryProfileId:
        'elevenlabs_eleven_v3_storytelling_speech_provider_boundary' as const,
      providerRouteId: 'elevenlabs_eleven_v3_storytelling_speech' as const,
      providerModelId: 'eleven_v3' as const,
      terminalState: receipt.dispatch.terminalState,
      retryCount: receipt.dispatch.retryCount,
      fallbackCount: receipt.dispatch.fallbackCount,
    },
    privateOutputs,
    internalCost: {
      providerUsageEvidenceDigest:
        receipt.internalCost.providerUsageEvidenceDigest,
      providerRateCardDigest: receipt.internalCost.providerRateCardDigest,
      providerCostMicros: receipt.internalCost.providerCostMicros,
      workerInfrastructureEvidenceDigest:
        receipt.internalCost.workerInfrastructureEvidenceDigest,
      workerInfrastructureRateCardDigest:
        receipt.internalCost.workerInfrastructureRateCardDigest,
      workerInfrastructureCostMicros:
        receipt.internalCost.selectedInfrastructureCostMicros,
      totalInternalProductionCostMicros:
        receipt.internalCost.selectedTotalInternalCostMicros,
      costWithinRequirementCeilings,
      failedOrUnknownAttemptCostRetained:
        receipt.internalCost.failedOrUnknownAttemptCostRetained,
      internalProductionCostOnly: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    verification: {
      canonicalSourceProjectionInvokedDirectly: true as const,
      canonicalQueueDispatchCostResourceAndOutputStoresReverified: true as const,
      receiptHashVerified: true as const,
      sourceOutputSetDigestVerified: true as const,
      exactSpeechRequirementScopeMatched: true as const,
      exactOperationProfileAndLifecycleMatched: true as const,
      orderedAudioAndAlignmentOutputsMatched: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      canonicalBackendRuntimeReceiptReleased: false as const,
      productionAuthorityGranted: false as const,
    },
    blockers: [...new Set(blockers)],
    readiness: {
      canonicalSpeechOperationIdentityFrozen: true as const,
      canonicalMultiOutputLifecycleAdmitted: true as const,
      directSameTreeSourceProjectionVerified: true as const,
      actualProviderCandidatePresent: false as const,
      normalizationAuthorized: false as const,
      productionContinuityEligible: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      ms012cAccepted: false as const,
      productReady: false as const,
    },
    sideEffects: {
      canonicalSourceProjectionCount: 1 as const,
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
  return assertMotionStudioCanonicalSpeechReceiptConsumption({
    ...base,
    consumptionDigest: sha256CanonicalJson(base),
  })
}

export function assertMotionStudioCanonicalSpeechReceiptConsumption(
  input: MotionStudioCanonicalSpeechReceiptConsumptionV1,
): MotionStudioCanonicalSpeechReceiptConsumptionV1 {
  const consumption = motionStudioCanonicalSpeechReceiptConsumptionV1Schema
    .parse(input)
  const unsigned = { ...consumption } as Record<string, unknown>
  delete unsigned.consumptionDigest
  if (sha256CanonicalJson(unsigned) !== consumption.consumptionDigest) {
    blocked('Canonical Storytelling Speech consumption failed immutable digest verification.')
  }
  const bindingUnsigned = { ...consumption.requirementBinding } as
    Record<string, unknown>
  delete bindingUnsigned.bindingDigest
  if (sha256CanonicalJson(bindingUnsigned) !==
      consumption.requirementBinding.bindingDigest) {
    blocked('Canonical Storytelling Speech requirement binding failed immutable digest verification.')
  }
  return deepFreeze(consumption)
}

function verifyReceiptHash(receipt: CanonicalProviderAttemptConsumerReceipt): void {
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptHash
  if (sha256AuthorityValue(unsigned) !== receipt.receiptHash) {
    blocked('Canonical Storytelling Speech receipt failed immutable hash verification.')
  }
}

function assertExactRequirementAndReceipt(input: {
  ownerUserId: string
  profile: ReturnType<typeof resolveCanonicalProviderOperationV2>
  lifecyclePolicyHash: string
  receipt: CanonicalProviderAttemptConsumerReceipt
  requirement: MotionStudioCanonicalBackendSpeechOperationRequirementV1
}): void {
  const { ownerUserId, profile, lifecyclePolicyHash, receipt, requirement } = input
  const scope = requirement.exactScope
  const expectedOutputs = requirement.requestedOperation.expectedRawOutputs
  const successful = isSuccessfulTerminal(receipt.dispatch.terminalState)
  const exactOutputs = !successful || (
    receipt.privateOutputs.length === 2 &&
    receipt.privateOutputs.every((output, index) => {
      const expected = expectedOutputs[index]
      const profileOutput = profile.expectedOutputs[index]
      return Boolean(expected && profileOutput) &&
        output.role === expected!.role &&
        output.role === profileOutput!.role &&
        output.mimeType === expected!.mimeType &&
        output.mimeType === profileOutput!.contentType &&
        output.byteLength <= expected!.maximumByteLength &&
        output.byteLength <= profileOutput!.maximumByteLength
    })
  )
  if (
    receipt.identity.ownerUserId !== ownerUserId ||
    receipt.identity.workspaceId !== scope.workspaceId ||
    receipt.identity.projectId !== scope.projectId ||
    receipt.identity.editSessionId !== scope.editSessionId ||
    receipt.identity.approvedPlanSnapshotId !== scope.approvedSnapshotId ||
    receipt.identity.approvedPlanSnapshotHash !== scope.approvedSnapshotDigest ||
    receipt.identity.approvedWorkItemId !== scope.approvedWorkItemId ||
    receipt.identity.queueJobId !== scope.jobId ||
    receipt.identity.sourceRequestId !== scope.speechRequestId ||
    receipt.identity.sourceRequestDigest !== scope.speechRequestDigest ||
    receipt.identity.idempotencyKeyHash !== scope.idempotencyKeyHash ||
    receipt.provider.operationId !== profile.operationId ||
    receipt.provider.operationId !==
      requirement.requestedOperation.providerOperationId ||
    receipt.provider.operationProfileHash !== profile.profileHash ||
    receipt.provider.providerBoundaryProfileId !== profile.providerBoundaryProfileId ||
    receipt.provider.providerRouteId !== profile.providerRouteId ||
    receipt.provider.providerModelId !== profile.providerModelId ||
    receipt.provider.lifecyclePolicyHash !== lifecyclePolicyHash ||
    receipt.consumerContext.derivation !==
      'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output_set' ||
    receipt.outputSet.sourceAuthorityClass !==
      'forward_multi_output_same_attempt_source' ||
    !receipt.outputSet.multiOutputProviderOperationAdmitted ||
    receipt.outputSet.outputCount !== receipt.privateOutputs.length ||
    receipt.requestAccounting.ceilings.generationSubmissionCount !== 1 ||
    receipt.requestAccounting.ceilings.totalLifecycleHttpRequestCount !== 1 ||
    receipt.dispatch.retryCount !== 0 ||
    receipt.dispatch.fallbackCount !== 0 ||
    !exactOutputs ||
    receipt.boundaries.canonicalBackendVerifiedRuntime ||
    receipt.boundaries.promotionAuthorized ||
    receipt.boundaries.productionReady
  ) {
    blocked('Canonical Storytelling Speech receipt does not match the exact Motion requirement.')
  }
}

function isSuccessfulTerminal(
  state: CanonicalProviderAttemptConsumerReceipt['dispatch']['terminalState'],
): boolean {
  return state === 'succeeded' || state === 'unknown_reconciled_succeeded'
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

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_storytelling_speech_receipt',
  })
}
