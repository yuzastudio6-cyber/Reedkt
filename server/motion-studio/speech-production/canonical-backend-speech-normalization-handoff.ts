import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioCanonicalBackendSpeechOperationRequirement,
  type MotionStudioCanonicalBackendSpeechOperationRequirementV1,
} from './canonical-backend-speech-operation-requirement'
import {
  assertMotionStudioCanonicalSpeechReceiptConsumption,
  type MotionStudioCanonicalSpeechReceiptConsumptionV1,
} from './canonical-backend-speech-receipt-consumer'

export const MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_HANDOFF_VERSION =
  'motion-studio.canonical-speech-normalization-handoff.v1' as const
export const MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_PROFILE_ID =
  'approved_storytelling_speech_take_normalization_v1' as const
export const MOTION_STUDIO_REQUESTED_SPEECH_NORMALIZATION_WORK_ITEM_TYPE =
  'normalize_storytelling_speech_take' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const requiredCommonSourceBlockers = [
  'canonical_backend_runtime_receipt_release_required',
  'immutable_provider_revision_qualification_required',
  'exact_production_rate_authority_required',
  'production_account_entitlement_required',
  'production_zero_retention_entitlement_required',
  'provider_transport_qualification_required',
  'production_multi_segment_continuity_required',
  'consumer_owned_production_authority_release_required',
] as const

const sourceBlocker = z.enum([
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

const providerOutputIdentity = z.object({
  outputId: stableId,
  assetId: stableId,
  assetVersionId: stableId,
  privateObjectIdentityHash: digest,
  contentSha256: digest,
  byteLength: z.number().int().positive(),
  artifactEvidenceDigest: digest,
  storageEvidenceHash: digest,
  sourceReadbackEvidenceHash: digest,
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
}).strict()

export const motionStudioCanonicalSpeechNormalizationHandoffV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_HANDOFF_VERSION,
  ),
  handoffId: stableId,
  createdAt: timestamp,
  state: z.literal(
    'source_verified_normalization_admission_pending',
  ),
  exactScope: z.object({
    workspaceId: stableId,
    projectId: stableId,
    editSessionId: stableId,
    productionId: stableId,
    approvedSnapshotId: stableId,
    approvedSnapshotDigest: digest,
    preparedScriptArtifactId: stableId,
    preparedScriptVersionId: stableId,
    preparedScriptContentDigest: digest,
    preparedScriptSegmentId: stableId,
    voiceBibleArtifactId: stableId,
    voiceBibleVersionId: stableId,
    voiceBibleContentDigest: digest,
    voiceSegmentId: stableId,
    voiceBindingId: stableId,
    voiceIdentityHash: digest,
    timingAuthorityDigest: digest,
    speechRequestId: stableId,
    speechRequestDigest: digest,
  }).strict(),
  sourceProviderAttempt: z.object({
    requirementId: stableId,
    requirementDigest: digest,
    consumptionId: stableId,
    consumptionDigest: digest,
    receiptId: stableId,
    receiptHash: digest,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
    ]),
    providerOperationId: z.literal(
      'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
    ),
    providerBoundaryProfileId: z.literal(
      'elevenlabs_eleven_v3_storytelling_speech_provider_boundary',
    ),
    providerRouteId: z.literal(
      'elevenlabs_eleven_v3_storytelling_speech',
    ),
    providerModelId: z.literal('eleven_v3'),
    outputSetDigest: digest,
    queueJobId: stableId,
    queueAttemptId: stableId,
    queueLeaseId: stableId,
    dispatchAttemptId: stableId,
    consumerContextDigest: digest,
    sourceIdempotencyKeyHash: digest,
  }).strict(),
  normalizationInput: z.object({
    audio: providerOutputIdentity.extend({
      role: z.literal('provider_storytelling_speech_audio_mp3'),
      mimeType: z.literal('audio/mpeg'),
      byteLength: z.number().int().positive().max(16_777_216),
    }).strict(),
    alignment: providerOutputIdentity.extend({
      role: z.literal('provider_storytelling_speech_alignment_json'),
      mimeType: z.literal('application/json'),
      byteLength: z.number().int().positive().max(1_048_576),
    }).strict(),
    rawAudioBytesEmbedded: z.literal(false),
    rawAlignmentEmbedded: z.literal(false),
    providerUrlAccepted: z.literal(false),
    localPathAccepted: z.literal(false),
    exactPrivateReadbackRequiredAtDispatch: z.literal(true),
  }).strict(),
  canonicalExecutionRequest: z.object({
    registryOwner: z.literal('canonical_backend'),
    coordinatorOwner: z.literal(
      'canonical_private_media_binary_execution_coordinator',
    ),
    operationId: z.literal(
      MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_OPERATION_ID,
    ),
    recipeProfileId: z.literal(
      MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_PROFILE_ID,
    ),
    requestedWorkItemType: z.literal(
      MOTION_STUDIO_REQUESTED_SPEECH_NORMALIZATION_WORK_ITEM_TYPE,
    ),
    requestedWorkerClass: z.literal('audio_processing_worker'),
    dependencyRole: z.literal('provider_storytelling_speech_audio_mp3'),
    dependencyOutputId: stableId,
    dependencyContentSha256: digest,
    separateCanonicalAttemptRequired: z.literal(true),
    oneUseToolDispatchRequired: z.literal(true),
    activeClaimAndLeaseRequired: z.literal(true),
    serverBuiltPayloadRequired: z.literal(true),
    callerSelectedExecutableAllowed: z.literal(false),
    callerSelectedArgumentsAllowed: z.literal(false),
    callerSelectedInputBytesAllowed: z.literal(false),
    expectedOutput: z.object({
      role: z.literal('normalized_storytelling_speech_take'),
      assetRole: z.literal('processed'),
      mimeType: z.literal('audio/wav'),
      container: z.literal('wav'),
      codec: z.literal('pcm_s16le'),
      sampleRateHertz: z.literal(48_000),
      channelCount: z.literal(1),
      maximumDurationMilliseconds: z.literal(30_000),
      metadataPolicy: z.literal('strip_all'),
      createOnly: z.literal(true),
      checksumReadbackRequired: z.literal(true),
      independentProbeRequired: z.literal(true),
    }).strict(),
    sharedAdmissionState: z.literal(
      'backend_owned_work_item_and_coordinator_admission_pending',
    ),
  }).strict(),
  alignmentAndMeaningBinding: z.object({
    sourceAudioOutputId: stableId,
    sourceAudioContentSha256: digest,
    alignmentOutputId: stableId,
    alignmentContentSha256: digest,
    preparedScriptSegmentId: stableId,
    preparedScriptContentDigest: digest,
    speechRequestDigest: digest,
    voiceSegmentId: stableId,
    voiceIdentityHash: digest,
    timingAuthorityDigest: digest,
    alignmentMayBeReplacedByNormalizedAudio: z.literal(false),
    normalizedAudioMayChangeSpokenMeaning: z.literal(false),
    rawProviderOutputMayEnterSelectionMixOrTimeline: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    currency: z.literal('USD'),
    providerCostMicros: safeMicros,
    providerWorkerInfrastructureCostMicros: safeMicros,
    providerAttemptTotalInternalCostMicros: safeMicros,
    maximumAuthorizedProviderCostMicros: safeMicros,
    maximumAuthorizedProviderWorkerCostMicros: safeMicros,
    maximumAuthorizedTotalInternalCostMicros: safeMicros,
    normalizationInfrastructureCostRequiresSeparateReceipt: z.literal(true),
    providerCostMayBeChargedToNormalizationAttempt: z.literal(false),
    normalizationCostMayBeCollapsedIntoProviderAttempt: z.literal(false),
    failedNormalizationAttemptCostMustBeRetained: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  sourceBlockers: z.array(sourceBlocker).min(9).max(14).readonly(),
  normalizationBlockers: z.tuple([
    z.literal('canonical_speech_normalization_work_item_admission_required'),
    z.literal('canonical_speech_normalization_attempt_receipt_required'),
  ]).readonly(),
  readiness: z.object({
    handoffContractReady: z.literal(true),
    exactProviderOutputSetSourceVerified: z.literal(true),
    canonicalProfileProven: z.literal(true),
    canonicalBackendRuntimeReceiptReleased: z.literal(false),
    actualProviderCandidateAvailableForNormalization: z.literal(false),
    canonicalNormalizationWorkItemAdmitted: z.literal(false),
    canonicalNormalizationDispatchAuthorized: z.literal(false),
    normalizedPrivateArtifactPresent: z.literal(false),
    normalizationCostReconciled: z.literal(false),
    continuityEligible: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    ms012cAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  ownershipBoundary: z.object({
    duplicateProviderRegistryCreated: z.literal(false),
    duplicateQueueCreated: z.literal(false),
    duplicateLeaseStoreCreated: z.literal(false),
    duplicateToolDispatchCreated: z.literal(false),
    duplicateMediaCoordinatorCreated: z.literal(false),
    duplicateArtifactStoreCreated: z.literal(false),
    duplicateCostAuthorityCreated: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    privateArtifactReadCount: z.literal(0),
    normalizationExecutionCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    costMutationCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  handoffDigest: digest,
}).strict().superRefine((value, context) => {
  const expectedTotal = value.costBoundary.providerCostMicros +
    value.costBoundary.providerWorkerInfrastructureCostMicros
  const expectedEvidenceBlocker = value.sourceProviderAttempt.evidenceClass ===
    'private_injected_nonprovider_test'
    ? 'source_evidence_private_injected_nonprovider_test'
    : 'source_evidence_canonical_backend_runtime_unreleased'
  const expectedPromotionClass = value.sourceProviderAttempt.evidenceClass ===
    'private_injected_nonprovider_test'
    ? 'non_promotable_private_injected'
    : 'unreleased_runtime_not_production'
  const blockersAreUnique = new Set(value.sourceBlockers).size ===
    value.sourceBlockers.length
  const requiredBlockersPresent = requiredCommonSourceBlockers.every(
    (blocker) => value.sourceBlockers.includes(blocker),
  ) && value.sourceBlockers.includes(expectedEvidenceBlocker)
  const exactOutputBinding =
    value.canonicalExecutionRequest.dependencyOutputId ===
      value.normalizationInput.audio.outputId &&
    value.canonicalExecutionRequest.dependencyContentSha256 ===
      value.normalizationInput.audio.contentSha256 &&
    value.alignmentAndMeaningBinding.sourceAudioOutputId ===
      value.normalizationInput.audio.outputId &&
    value.alignmentAndMeaningBinding.sourceAudioContentSha256 ===
      value.normalizationInput.audio.contentSha256 &&
    value.alignmentAndMeaningBinding.alignmentOutputId ===
      value.normalizationInput.alignment.outputId &&
    value.alignmentAndMeaningBinding.alignmentContentSha256 ===
      value.normalizationInput.alignment.contentSha256
  const exactMeaningBinding =
    value.alignmentAndMeaningBinding.preparedScriptSegmentId ===
      value.exactScope.preparedScriptSegmentId &&
    value.alignmentAndMeaningBinding.preparedScriptContentDigest ===
      value.exactScope.preparedScriptContentDigest &&
    value.alignmentAndMeaningBinding.speechRequestDigest ===
      value.exactScope.speechRequestDigest &&
    value.alignmentAndMeaningBinding.voiceSegmentId ===
      value.exactScope.voiceSegmentId &&
    value.alignmentAndMeaningBinding.voiceIdentityHash ===
      value.exactScope.voiceIdentityHash &&
    value.alignmentAndMeaningBinding.timingAuthorityDigest ===
      value.exactScope.timingAuthorityDigest
  const costWithinCeilings =
    value.costBoundary.providerCostMicros <=
      value.costBoundary.maximumAuthorizedProviderCostMicros &&
    value.costBoundary.providerWorkerInfrastructureCostMicros <=
      value.costBoundary.maximumAuthorizedProviderWorkerCostMicros &&
    value.costBoundary.providerAttemptTotalInternalCostMicros <=
      value.costBoundary.maximumAuthorizedTotalInternalCostMicros
  if (
    value.costBoundary.providerAttemptTotalInternalCostMicros !== expectedTotal ||
    !exactOutputBinding ||
    !exactMeaningBinding ||
    !costWithinCeilings ||
    value.sourceProviderAttempt.promotionClass !== expectedPromotionClass ||
    !blockersAreUnique ||
    !requiredBlockersPresent
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical Speech normalization handoff lineage is inconsistent.',
    })
  }
})

export type MotionStudioCanonicalSpeechNormalizationHandoffV1 = z.infer<
  typeof motionStudioCanonicalSpeechNormalizationHandoffV1Schema
>

/**
 * Freezes the exact dependent-normalization request for the shared backend.
 * It deliberately cannot dispatch work or promote the current injected or
 * unreleased provider receipt. The shared backend must later source-verify and
 * admit the exact work item through its existing queue, lease, tool dispatch,
 * media coordinator, artifact, QA, and attempt-cost authorities.
 */
export function createMotionStudioCanonicalSpeechNormalizationHandoff(input: {
  requirement: MotionStudioCanonicalBackendSpeechOperationRequirementV1
  consumption: MotionStudioCanonicalSpeechReceiptConsumptionV1
  createdAt: string
}): MotionStudioCanonicalSpeechNormalizationHandoffV1 {
  const requirement = assertMotionStudioCanonicalBackendSpeechOperationRequirement(
    input.requirement,
  )
  const consumption = assertMotionStudioCanonicalSpeechReceiptConsumption(
    input.consumption,
  )
  const createdAt = canonicalIso(input.createdAt)
  assertExactSourceLineage({ requirement, consumption })
  if (
    !['succeeded', 'unknown_reconciled_succeeded'].includes(
      consumption.provider.terminalState,
    ) ||
    consumption.privateOutputs.length !== 2 ||
    !consumption.internalCost.costWithinRequirementCeilings ||
    consumption.internalCost.providerCostMicros === null ||
    consumption.internalCost.totalInternalProductionCostMicros === null
  ) {
    blocked(
      'Speech normalization handoff requires one successful, cost-reconciled private MP3 and alignment output set.',
    )
  }

  const audio = consumption.privateOutputs[0]
  const alignment = consumption.privateOutputs[1]
  if (
    !audio || audio.role !== 'provider_storytelling_speech_audio_mp3' ||
    audio.mimeType !== 'audio/mpeg' ||
    !alignment ||
    alignment.role !== 'provider_storytelling_speech_alignment_json' ||
    alignment.mimeType !== 'application/json'
  ) {
    blocked('Speech normalization handoff requires the exact ordered MP3 and alignment output roles.')
  }
  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_HANDOFF_VERSION,
    handoffId: `speech-normalization-handoff-${consumption.consumptionDigest.slice(0, 40)}`,
    createdAt,
    state: 'source_verified_normalization_admission_pending' as const,
    exactScope: {
      workspaceId: requirement.exactScope.workspaceId,
      projectId: requirement.exactScope.projectId,
      editSessionId: requirement.exactScope.editSessionId,
      productionId: requirement.exactScope.productionId,
      approvedSnapshotId: requirement.exactScope.approvedSnapshotId,
      approvedSnapshotDigest: requirement.exactScope.approvedSnapshotDigest,
      preparedScriptArtifactId: requirement.exactScope.preparedScriptArtifactId,
      preparedScriptVersionId: requirement.exactScope.preparedScriptVersionId,
      preparedScriptContentDigest: requirement.exactScope.preparedScriptContentDigest,
      preparedScriptSegmentId: requirement.exactScope.preparedScriptSegmentId,
      voiceBibleArtifactId: requirement.exactScope.voiceBibleArtifactId,
      voiceBibleVersionId: requirement.exactScope.voiceBibleVersionId,
      voiceBibleContentDigest: requirement.exactScope.voiceBibleContentDigest,
      voiceSegmentId: requirement.exactScope.voiceSegmentId,
      voiceBindingId: requirement.exactScope.voiceBindingId,
      voiceIdentityHash: requirement.exactScope.voiceIdentityHash,
      timingAuthorityDigest: requirement.exactScope.timingAuthorityDigest,
      speechRequestId: requirement.exactScope.speechRequestId,
      speechRequestDigest: requirement.exactScope.speechRequestDigest,
    },
    sourceProviderAttempt: {
      requirementId: requirement.requirementId,
      requirementDigest: requirement.requirementDigest,
      consumptionId: consumption.consumptionId,
      consumptionDigest: consumption.consumptionDigest,
      receiptId: consumption.sourceProjection.receiptId,
      receiptHash: consumption.sourceProjection.receiptHash,
      evidenceClass: consumption.sourceProjection.evidenceClass,
      promotionClass: consumption.sourceProjection.promotionClass,
      providerOperationId: consumption.provider.operationId,
      providerBoundaryProfileId: consumption.provider.providerBoundaryProfileId,
      providerRouteId: consumption.provider.providerRouteId,
      providerModelId: consumption.provider.providerModelId,
      outputSetDigest: consumption.sourceProjection.outputSetDigest,
      queueJobId: consumption.sourceProjection.queueJobId,
      queueAttemptId: consumption.sourceProjection.queueAttemptId,
      queueLeaseId: consumption.sourceProjection.queueLeaseId,
      dispatchAttemptId: consumption.sourceProjection.dispatchAttemptId,
      consumerContextDigest: consumption.sourceProjection.consumerContextDigest,
      sourceIdempotencyKeyHash: consumption.requirementBinding.idempotencyKeyHash,
    },
    normalizationInput: {
      audio,
      alignment,
      rawAudioBytesEmbedded: false as const,
      rawAlignmentEmbedded: false as const,
      providerUrlAccepted: false as const,
      localPathAccepted: false as const,
      exactPrivateReadbackRequiredAtDispatch: true as const,
    },
    canonicalExecutionRequest: {
      registryOwner: 'canonical_backend' as const,
      coordinatorOwner:
        'canonical_private_media_binary_execution_coordinator' as const,
      operationId: MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_OPERATION_ID,
      recipeProfileId: MOTION_STUDIO_CANONICAL_SPEECH_NORMALIZATION_PROFILE_ID,
      requestedWorkItemType:
        MOTION_STUDIO_REQUESTED_SPEECH_NORMALIZATION_WORK_ITEM_TYPE,
      requestedWorkerClass: 'audio_processing_worker' as const,
      dependencyRole: 'provider_storytelling_speech_audio_mp3' as const,
      dependencyOutputId: audio.outputId,
      dependencyContentSha256: audio.contentSha256,
      separateCanonicalAttemptRequired: true as const,
      oneUseToolDispatchRequired: true as const,
      activeClaimAndLeaseRequired: true as const,
      serverBuiltPayloadRequired: true as const,
      callerSelectedExecutableAllowed: false as const,
      callerSelectedArgumentsAllowed: false as const,
      callerSelectedInputBytesAllowed: false as const,
      expectedOutput: {
        role: 'normalized_storytelling_speech_take' as const,
        assetRole: 'processed' as const,
        mimeType: 'audio/wav' as const,
        container: 'wav' as const,
        codec: 'pcm_s16le' as const,
        sampleRateHertz: 48_000 as const,
        channelCount: 1 as const,
        maximumDurationMilliseconds: 30_000 as const,
        metadataPolicy: 'strip_all' as const,
        createOnly: true as const,
        checksumReadbackRequired: true as const,
        independentProbeRequired: true as const,
      },
      sharedAdmissionState:
        'backend_owned_work_item_and_coordinator_admission_pending' as const,
    },
    alignmentAndMeaningBinding: {
      sourceAudioOutputId: audio.outputId,
      sourceAudioContentSha256: audio.contentSha256,
      alignmentOutputId: alignment.outputId,
      alignmentContentSha256: alignment.contentSha256,
      preparedScriptSegmentId: requirement.exactScope.preparedScriptSegmentId,
      preparedScriptContentDigest: requirement.exactScope.preparedScriptContentDigest,
      speechRequestDigest: requirement.exactScope.speechRequestDigest,
      voiceSegmentId: requirement.exactScope.voiceSegmentId,
      voiceIdentityHash: requirement.exactScope.voiceIdentityHash,
      timingAuthorityDigest: requirement.exactScope.timingAuthorityDigest,
      alignmentMayBeReplacedByNormalizedAudio: false as const,
      normalizedAudioMayChangeSpokenMeaning: false as const,
      rawProviderOutputMayEnterSelectionMixOrTimeline: false as const,
    },
    costBoundary: {
      currency: 'USD' as const,
      providerCostMicros: consumption.internalCost.providerCostMicros,
      providerWorkerInfrastructureCostMicros:
        consumption.internalCost.workerInfrastructureCostMicros,
      providerAttemptTotalInternalCostMicros:
        consumption.internalCost.totalInternalProductionCostMicros,
      maximumAuthorizedProviderCostMicros:
        requirement.costBoundary.maximumAuthorizedProviderCostMicros,
      maximumAuthorizedProviderWorkerCostMicros:
        requirement.costBoundary.maximumAuthorizedInfrastructureCostMicros,
      maximumAuthorizedTotalInternalCostMicros:
        requirement.costBoundary.maximumAuthorizedTotalInternalCostMicros,
      normalizationInfrastructureCostRequiresSeparateReceipt: true as const,
      providerCostMayBeChargedToNormalizationAttempt: false as const,
      normalizationCostMayBeCollapsedIntoProviderAttempt: false as const,
      failedNormalizationAttemptCostMustBeRetained: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingAllowed: false as const,
    },
    sourceBlockers: consumption.blockers,
    normalizationBlockers: [
      'canonical_speech_normalization_work_item_admission_required',
      'canonical_speech_normalization_attempt_receipt_required',
    ] as const,
    readiness: {
      handoffContractReady: true as const,
      exactProviderOutputSetSourceVerified: true as const,
      canonicalProfileProven: true as const,
      canonicalBackendRuntimeReceiptReleased: false as const,
      actualProviderCandidateAvailableForNormalization: false as const,
      canonicalNormalizationWorkItemAdmitted: false as const,
      canonicalNormalizationDispatchAuthorized: false as const,
      normalizedPrivateArtifactPresent: false as const,
      normalizationCostReconciled: false as const,
      continuityEligible: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      ms012cAccepted: false as const,
      productReady: false as const,
    },
    ownershipBoundary: {
      duplicateProviderRegistryCreated: false as const,
      duplicateQueueCreated: false as const,
      duplicateLeaseStoreCreated: false as const,
      duplicateToolDispatchCreated: false as const,
      duplicateMediaCoordinatorCreated: false as const,
      duplicateArtifactStoreCreated: false as const,
      duplicateCostAuthorityCreated: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactReadCount: 0 as const,
      normalizationExecutionCount: 0 as const,
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
  return assertMotionStudioCanonicalSpeechNormalizationHandoff({
    ...base,
    handoffDigest: sha256CanonicalJson(base),
  })
}

export function assertMotionStudioCanonicalSpeechNormalizationHandoff(
  input: MotionStudioCanonicalSpeechNormalizationHandoffV1,
): MotionStudioCanonicalSpeechNormalizationHandoffV1 {
  const parsed = motionStudioCanonicalSpeechNormalizationHandoffV1Schema
    .parse(input)
  const unsigned = { ...parsed } as Record<string, unknown>
  delete unsigned.handoffDigest
  if (sha256CanonicalJson(unsigned) !== parsed.handoffDigest) {
    blocked('Canonical Speech normalization handoff failed immutable digest verification.')
  }
  if (
    parsed.readiness.canonicalBackendRuntimeReceiptReleased ||
    parsed.readiness.actualProviderCandidateAvailableForNormalization ||
    parsed.readiness.canonicalNormalizationWorkItemAdmitted ||
    parsed.readiness.canonicalNormalizationDispatchAuthorized ||
    parsed.readiness.normalizedPrivateArtifactPresent ||
    parsed.readiness.normalizationCostReconciled ||
    parsed.readiness.continuityEligible ||
    parsed.readiness.selectionEligible ||
    parsed.readiness.finalMixEligible ||
    parsed.readiness.timelineEligible ||
    parsed.readiness.ms012cAccepted ||
    parsed.readiness.productReady ||
    Object.values(parsed.sideEffects).some((value) => value !== 0)
  ) {
    blocked('Canonical Speech normalization handoff crossed its no-execution boundary.')
  }
  return deepFreeze(parsed)
}

function assertExactSourceLineage(input: {
  requirement: MotionStudioCanonicalBackendSpeechOperationRequirementV1
  consumption: MotionStudioCanonicalSpeechReceiptConsumptionV1
}): void {
  const { requirement, consumption } = input
  if (
    consumption.requirementBinding.requirementId !== requirement.requirementId ||
    consumption.requirementBinding.requirementDigest !== requirement.requirementDigest ||
    consumption.requirementBinding.productionId !== requirement.exactScope.productionId ||
    consumption.requirementBinding.preparedScriptSegmentId !==
      requirement.exactScope.preparedScriptSegmentId ||
    consumption.requirementBinding.voiceSegmentId !==
      requirement.exactScope.voiceSegmentId ||
    consumption.requirementBinding.voiceBindingId !==
      requirement.exactScope.voiceBindingId ||
    consumption.requirementBinding.voiceIdentityHash !==
      requirement.exactScope.voiceIdentityHash ||
    consumption.requirementBinding.timingAuthorityDigest !==
      requirement.exactScope.timingAuthorityDigest ||
    consumption.requirementBinding.jobId !== requirement.exactScope.jobId ||
    consumption.requirementBinding.motionAttemptId !==
      requirement.exactScope.attemptId ||
    consumption.requirementBinding.motionLeaseId !== requirement.exactScope.leaseId ||
    consumption.requirementBinding.costBudgetId !==
      requirement.exactScope.costBudgetId ||
    consumption.requirementBinding.idempotencyKeyHash !==
      requirement.exactScope.idempotencyKeyHash ||
    consumption.sourceProjection.queueJobId !== requirement.exactScope.jobId ||
    consumption.provider.operationId !==
      requirement.requestedOperation.providerOperationId ||
    consumption.provider.providerBoundaryProfileId !==
      requirement.requestedOperation.providerBoundaryProfileId ||
    consumption.provider.providerRouteId !==
      requirement.requestedOperation.providerRouteId ||
    consumption.provider.providerModelId !==
      requirement.requestedOperation.providerModelId ||
    consumption.requirementBinding.consumerContextDigest !==
      consumption.sourceProjection.consumerContextDigest ||
    consumption.requirementBinding.sourceReceiptHash !==
      consumption.sourceProjection.receiptHash
  ) {
    blocked('Speech normalization handoff source does not match the exact requirement lineage.')
  }
}

function canonicalIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Speech normalization handoff time must be canonical ISO-8601.',
      400,
    )
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

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'canonical_speech_normalization_work_item_admission',
  })
}
