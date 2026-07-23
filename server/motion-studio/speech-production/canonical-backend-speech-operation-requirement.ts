import { z } from 'zod'

import {
  motionStudioSpeechSegmentRequestV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import {
  assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity,
} from './official-capability'

export const MOTION_STUDIO_CANONICAL_BACKEND_SPEECH_OPERATION_REQUIREMENT_VERSION =
  'motion-studio.canonical-backend-speech-operation-requirement.v1' as const

export const MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_OPERATION_ID =
  'provider.elevenlabs.generate_storytelling_speech_candidate.v1' as const
export const MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_BOUNDARY_PROFILE_ID =
  'elevenlabs_eleven_v3_storytelling_speech_provider_boundary' as const
export const MOTION_STUDIO_REQUESTED_SPEECH_WORK_ITEM_TYPE =
  'generate_storytelling_speech_candidate' as const
export const MOTION_STUDIO_REQUESTED_SPEECH_WORKER_CLASS = 'provider_worker' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const identitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })
const safeMicrosSchema = z.number().int().positive().max(250_000)

const rawOutputSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('provider_storytelling_speech_audio_mp3'),
    mimeType: z.literal('audio/mpeg'),
    maximumByteLength: z.literal(16_777_216),
    privateCreateOnly: z.literal(true),
  }).strict(),
  z.object({
    role: z.literal('provider_storytelling_speech_alignment_json'),
    mimeType: z.literal('application/json'),
    maximumByteLength: z.literal(1_048_576),
    privateCreateOnly: z.literal(true),
  }).strict(),
])

export const motionStudioCanonicalBackendSpeechOperationRequirementV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_BACKEND_SPEECH_OPERATION_REQUIREMENT_VERSION,
  ),
  requirementId: identitySchema,
  createdAt: timestampSchema,
  intent: z.literal('storytelling_speech_candidate'),
  evidenceClass: z.literal('motion_requirement_contract_only'),
  exactScope: z.object({
    workspaceId: identitySchema,
    projectId: identitySchema,
    editSessionId: identitySchema,
    productionId: identitySchema,
    approvedSnapshotId: identitySchema,
    approvedSnapshotDigest: digestSchema,
    approvedWorkItemId: identitySchema,
    preparedScriptArtifactId: identitySchema,
    preparedScriptVersionId: identitySchema,
    preparedScriptContentDigest: digestSchema,
    preparedScriptSegmentId: identitySchema,
    voiceBibleArtifactId: identitySchema,
    voiceBibleVersionId: identitySchema,
    voiceBibleContentDigest: digestSchema,
    voiceSegmentId: identitySchema,
    voiceBindingId: identitySchema,
    voiceIdentityHash: digestSchema,
    timingAuthorityDigest: digestSchema,
    speechRequestId: identitySchema,
    speechRequestDigest: digestSchema,
    jobId: identitySchema,
    attemptId: identitySchema,
    leaseId: identitySchema,
    costBudgetId: identitySchema,
    idempotencyKeyHash: digestSchema,
  }).strict(),
  sourceAuthority: z.object({
    capabilitySnapshotId: identitySchema,
    capabilitySnapshotDigest: digestSchema,
    capabilityCapturedAt: timestampSchema,
    capabilityExpiresAt: timestampSchema,
    executionAuthorityId: identitySchema,
    executionAuthorityDigest: digestSchema,
    preflightDigest: digestSchema,
    credentialBindingDigest: digestSchema,
    providerRateCardSnapshotId: identitySchema,
    accountUsageBaselineEvidenceId: identitySchema,
    zeroRetentionEntitlementRequired: z.literal(true),
    currentProductionEntitlementEvidencePresent: z.literal(false),
    currentProductionContinuityEvidencePresent: z.literal(false),
  }).strict(),
  requestedOperation: z.object({
    state: z.literal('motion_requirement_frozen_backend_admission_pending'),
    registryOwner: z.literal('canonical_backend'),
    providerOperationId: z.literal(MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_OPERATION_ID),
    providerBoundaryProfileId: z.literal(
      MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_BOUNDARY_PROFILE_ID,
    ),
    providerOwnerCode: z.literal('elevenlabs'),
    providerRouteId: z.literal('elevenlabs_eleven_v3_storytelling_speech'),
    providerModelId: z.literal('eleven_v3'),
    immutableProviderModelRevision: z.null(),
    exactCapabilitySnapshotRequiredAtAttempt: z.literal(true),
    endpointOrigin: z.literal('https://api.elevenlabs.io'),
    endpointPathTemplate: z.literal(
      '/v1/text-to-speech/{private_provider_voice_id}/with-timestamps',
    ),
    method: z.literal('POST'),
    workItemType: z.literal(MOTION_STUDIO_REQUESTED_SPEECH_WORK_ITEM_TYPE),
    workerClass: z.literal(MOTION_STUDIO_REQUESTED_SPEECH_WORKER_CLASS),
    requestLifecycle: z.literal('synchronous_json_with_base64_audio_and_alignment'),
    outputFormat: z.literal('mp3_44100_128'),
    expectedRawOutputs: z.tuple([
      rawOutputSchema,
      rawOutputSchema,
    ]).superRefine((outputs, context) => {
      if (
        outputs[0].role !== 'provider_storytelling_speech_audio_mp3' ||
        outputs[1].role !== 'provider_storytelling_speech_alignment_json'
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Speech provider output order must remain audio then alignment.',
        })
      }
    }),
    multiplePrivateOutputsRequired: z.literal(true),
    providerRegistryEntryPresent: z.literal(false),
    currentReceiptAuthority: z.literal(false),
  }).strict(),
  attemptPolicy: z.object({
    maximumSecretPayloadReads: z.literal(1),
    maximumGenerationSubmissions: z.literal(1),
    maximumResponseReads: z.literal(1),
    maximumNetworkRequests: z.literal(1),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    maximumRedirects: z.literal(0),
    maximumElapsedMilliseconds: z.literal(60_000),
    maximumCapturedResponseBytes: z.literal(16_777_216),
    automaticRetriesAllowed: z.literal(false),
    automaticFallbacksAllowed: z.literal(false),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacExecutionAllowed: z.literal(false),
    resubmissionWithinAttemptAllowed: z.literal(false),
    unknownOutcomeMustReconcileBeforeAnyNewSubmission: z.literal(true),
    anyNewSubmissionRequiresFreshApprovedPackageAndAttempt: z.literal(true),
  }).strict(),
  dataPolicy: z.object({
    backendOnlyCredentialResolutionRequired: z.literal(true),
    credentialMayEnterQueueTaskOrBrowser: z.literal(false),
    rawProviderVoiceIdMayEnterQueueTaskOrBrowser: z.literal(false),
    rawRequestBodyMayEnterQueueTaskOrBrowser: z.literal(false),
    voiceIdentityHashRequiredInAuthority: z.literal(true),
    providerLoggingEnabled: z.literal(false),
    productionZeroRetentionEntitlementRequired: z.literal(true),
    standardRetentionMayPromoteSyntheticHistory: z.literal(false),
    voiceCloningAllowed: z.literal(false),
    dubbingAllowed: z.literal(false),
    providerUrlMayBecomeDurableProjectReference: z.literal(false),
    immediatePrivateSplitIngestAndChecksumReadbackRequired: z.literal(true),
    browserReadableRawAlignmentAllowed: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('input_character'),
    maximumAuthorizedProviderCostMicros: safeMicrosSchema,
    maximumAuthorizedInfrastructureCostMicros: safeMicrosSchema,
    maximumAuthorizedTotalInternalCostMicros: safeMicrosSchema,
    immutableExecutionRateCardPresent: z.literal(false),
    providerAndInfrastructureCostMustRemainSeparate: z.literal(true),
    failedAndUnknownAttemptCostMustBeRetained: z.literal(true),
    providerUsageMustBeReconciledBeforeCompletion: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  downstreamNormalization: z.object({
    separateDependentAttemptRequired: z.literal(true),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    recipeProfileId: z.literal('approved_storytelling_speech_take_normalization_v1'),
    expectedOutputRole: z.literal('normalized_storytelling_speech_take'),
    expectedMimeType: z.literal('audio/wav'),
    expectedCodec: z.literal('pcm_s16le'),
    expectedSampleRateHertz: z.literal(48_000),
    expectedChannelCount: z.literal(1),
    providerAndNormalizationAttemptCostMayBeCollapsed: z.literal(false),
    alignmentMustRemainBoundToExactSourceAudioAndSpokenText: z.literal(true),
    providerResponseMayEnterSelectionMixOrTimelineDirectly: z.literal(false),
  }).strict(),
  backendAdmission: z.object({
    motionRequirementFrozen: z.literal(true),
    canonicalProviderOperationAdmitted: z.literal(false),
    canonicalMultipleOutputProviderLifecycleImplemented: z.literal(false),
    canonicalPackageQueueClaimAndLeaseReady: z.literal(false),
    canonicalOneUseProviderDispatchReady: z.literal(false),
    canonicalRuntimeReceiptVerifierIntegrated: z.literal(false),
    installedWorkerResourceObserverProven: z.literal(false),
    providerTransportActivated: z.literal(false),
    actualProductionCandidatePresent: z.literal(false),
    executionAllowed: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  ownershipBoundary: z.object({
    motionOwnsRequestPolicyVoiceTimingCandidateAndQaSemantics: z.literal(true),
    canonicalBackendOwnsRegistryPackageQueueLeaseDispatchAndAttemptCost: z.literal(true),
    motionQueueCreated: z.literal(false),
    motionProviderRegistryCreated: z.literal(false),
    motionLeaseStoreCreated: z.literal(false),
    motionWorkerMeterCreated: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    credentialReadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.literal(0),
    selectionCount: z.literal(0),
    mixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  requirementDigest: digestSchema,
}).strict().superRefine((value, context) => {
  if (
    value.costBoundary.maximumAuthorizedTotalInternalCostMicros !==
      value.costBoundary.maximumAuthorizedProviderCostMicros +
      value.costBoundary.maximumAuthorizedInfrastructureCostMicros
  ) {
    context.addIssue({
      code: 'custom',
      path: ['costBoundary', 'maximumAuthorizedTotalInternalCostMicros'],
      message: 'Speech provider and infrastructure ceilings must reconcile exactly.',
    })
  }
  if (
    value.requestedOperation.providerOperationId.startsWith('tool.') ||
    value.downstreamNormalization.operationId.startsWith('provider.')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Speech provider submission and deterministic normalization must remain separate operations.',
    })
  }
})

export type MotionStudioCanonicalBackendSpeechOperationRequirementV1 = z.infer<
  typeof motionStudioCanonicalBackendSpeechOperationRequirementV1Schema
>

export function createMotionStudioCanonicalBackendSpeechOperationRequirement(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  createdAt: string
}): MotionStudioCanonicalBackendSpeechOperationRequirementV1 {
  const request = motionStudioSpeechSegmentRequestV1Schema.parse(input.request)
  const capability = assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity(
    input.capabilitySnapshot,
  )
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    request,
    capability,
  )
  const createdAt = canonicalIso(input.createdAt)
  assertCurrentSourceAuthority({ request, capability, authority, createdAt })
  const capabilityExpiresAt = capability.expiresAt
  if (!capabilityExpiresAt) {
    blocked('Canonical backend Speech operation requirement requires expiring capability evidence.')
  }

  const base = {
    schemaVersion: MOTION_STUDIO_CANONICAL_BACKEND_SPEECH_OPERATION_REQUIREMENT_VERSION,
    requirementId: `ms012c-canonical-backend-speech-operation-${authority.authorityDigest.slice(0, 16)}`,
    createdAt,
    intent: 'storytelling_speech_candidate' as const,
    evidenceClass: 'motion_requirement_contract_only' as const,
    exactScope: {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
      productionId: request.productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      approvedSnapshotDigest: request.approvedSnapshotDigest,
      approvedWorkItemId: request.approvedWorkItemId,
      preparedScriptArtifactId: request.preparedScriptArtifactVersion.artifactId,
      preparedScriptVersionId: request.preparedScriptArtifactVersion.versionId,
      preparedScriptContentDigest: request.preparedScriptArtifactVersion.contentDigest,
      preparedScriptSegmentId: request.preparedScriptSegmentId,
      voiceBibleArtifactId: request.voiceBibleArtifactVersion.artifactId,
      voiceBibleVersionId: request.voiceBibleArtifactVersion.versionId,
      voiceBibleContentDigest: request.voiceBibleContentDigest,
      voiceSegmentId: request.voiceSegmentId,
      voiceBindingId: request.voice.voiceBindingId,
      voiceIdentityHash: request.voice.voiceIdentityHash,
      timingAuthorityDigest: request.timingAuthorityDigest,
      speechRequestId: request.speechRequestId,
      speechRequestDigest: authority.speechRequestDigest,
      jobId: request.jobId,
      attemptId: request.attemptId,
      leaseId: request.leaseId,
      costBudgetId: request.costBudgetId,
      idempotencyKeyHash: request.idempotencyKeyHash,
    },
    sourceAuthority: {
      capabilitySnapshotId: capability.capabilitySnapshotId,
      capabilitySnapshotDigest: capability.evidenceDigest,
      capabilityCapturedAt: capability.capturedAt,
      capabilityExpiresAt,
      executionAuthorityId: authority.authorityId,
      executionAuthorityDigest: authority.authorityDigest,
      preflightDigest: authority.preflightDigest,
      credentialBindingDigest: authority.credentialBindingDigest,
      providerRateCardSnapshotId: authority.providerRateCardSnapshotId,
      accountUsageBaselineEvidenceId: authority.accountUsageBaselineEvidenceId,
      zeroRetentionEntitlementRequired: true as const,
      currentProductionEntitlementEvidencePresent: false as const,
      currentProductionContinuityEvidencePresent: false as const,
    },
    requestedOperation: {
      state: 'motion_requirement_frozen_backend_admission_pending' as const,
      registryOwner: 'canonical_backend' as const,
      providerOperationId: MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_OPERATION_ID,
      providerBoundaryProfileId: MOTION_STUDIO_REQUESTED_SPEECH_PROVIDER_BOUNDARY_PROFILE_ID,
      providerOwnerCode: 'elevenlabs' as const,
      providerRouteId: 'elevenlabs_eleven_v3_storytelling_speech' as const,
      providerModelId: 'eleven_v3' as const,
      immutableProviderModelRevision: null,
      exactCapabilitySnapshotRequiredAtAttempt: true as const,
      endpointOrigin: 'https://api.elevenlabs.io' as const,
      endpointPathTemplate:
        '/v1/text-to-speech/{private_provider_voice_id}/with-timestamps' as const,
      method: 'POST' as const,
      workItemType: MOTION_STUDIO_REQUESTED_SPEECH_WORK_ITEM_TYPE,
      workerClass: MOTION_STUDIO_REQUESTED_SPEECH_WORKER_CLASS,
      requestLifecycle: 'synchronous_json_with_base64_audio_and_alignment' as const,
      outputFormat: 'mp3_44100_128' as const,
      expectedRawOutputs: [
        {
          role: 'provider_storytelling_speech_audio_mp3' as const,
          mimeType: 'audio/mpeg' as const,
          maximumByteLength: 16_777_216 as const,
          privateCreateOnly: true as const,
        },
        {
          role: 'provider_storytelling_speech_alignment_json' as const,
          mimeType: 'application/json' as const,
          maximumByteLength: 1_048_576 as const,
          privateCreateOnly: true as const,
        },
      ],
      multiplePrivateOutputsRequired: true as const,
      providerRegistryEntryPresent: false as const,
      currentReceiptAuthority: false as const,
    },
    attemptPolicy: {
      maximumSecretPayloadReads: 1 as const,
      maximumGenerationSubmissions: 1 as const,
      maximumResponseReads: 1 as const,
      maximumNetworkRequests: 1 as const,
      maximumAddressConnectionAttemptsPerRequest: 1 as const,
      maximumRedirects: 0 as const,
      maximumElapsedMilliseconds: 60_000 as const,
      maximumCapturedResponseBytes: 16_777_216 as const,
      automaticRetriesAllowed: false as const,
      automaticFallbacksAllowed: false as const,
      addressFallbackAllowed: false as const,
      proxyOrPacExecutionAllowed: false as const,
      resubmissionWithinAttemptAllowed: false as const,
      unknownOutcomeMustReconcileBeforeAnyNewSubmission: true as const,
      anyNewSubmissionRequiresFreshApprovedPackageAndAttempt: true as const,
    },
    dataPolicy: {
      backendOnlyCredentialResolutionRequired: true as const,
      credentialMayEnterQueueTaskOrBrowser: false as const,
      rawProviderVoiceIdMayEnterQueueTaskOrBrowser: false as const,
      rawRequestBodyMayEnterQueueTaskOrBrowser: false as const,
      voiceIdentityHashRequiredInAuthority: true as const,
      providerLoggingEnabled: false as const,
      productionZeroRetentionEntitlementRequired: true as const,
      standardRetentionMayPromoteSyntheticHistory: false as const,
      voiceCloningAllowed: false as const,
      dubbingAllowed: false as const,
      providerUrlMayBecomeDurableProjectReference: false as const,
      immediatePrivateSplitIngestAndChecksumReadbackRequired: true as const,
      browserReadableRawAlignmentAllowed: false as const,
    },
    costBoundary: {
      currency: 'USD' as const,
      providerBillingUnit: 'input_character' as const,
      maximumAuthorizedProviderCostMicros: authority.maximumAuthorizedProviderCostMicros,
      maximumAuthorizedInfrastructureCostMicros:
        authority.maximumAuthorizedLocalComputeCostMicros,
      maximumAuthorizedTotalInternalCostMicros:
        authority.maximumAuthorizedTotalInternalCostMicros,
      immutableExecutionRateCardPresent: false as const,
      providerAndInfrastructureCostMustRemainSeparate: true as const,
      failedAndUnknownAttemptCostMustBeRetained: true as const,
      providerUsageMustBeReconciledBeforeCompletion: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingAllowed: false as const,
    },
    downstreamNormalization: {
      separateDependentAttemptRequired: true as const,
      operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
      recipeProfileId: 'approved_storytelling_speech_take_normalization_v1' as const,
      expectedOutputRole: 'normalized_storytelling_speech_take' as const,
      expectedMimeType: 'audio/wav' as const,
      expectedCodec: 'pcm_s16le' as const,
      expectedSampleRateHertz: 48_000 as const,
      expectedChannelCount: 1 as const,
      providerAndNormalizationAttemptCostMayBeCollapsed: false as const,
      alignmentMustRemainBoundToExactSourceAudioAndSpokenText: true as const,
      providerResponseMayEnterSelectionMixOrTimelineDirectly: false as const,
    },
    backendAdmission: {
      motionRequirementFrozen: true as const,
      canonicalProviderOperationAdmitted: false as const,
      canonicalMultipleOutputProviderLifecycleImplemented: false as const,
      canonicalPackageQueueClaimAndLeaseReady: false as const,
      canonicalOneUseProviderDispatchReady: false as const,
      canonicalRuntimeReceiptVerifierIntegrated: false as const,
      installedWorkerResourceObserverProven: false as const,
      providerTransportActivated: false as const,
      actualProductionCandidatePresent: false as const,
      executionAllowed: false as const,
      productReady: false as const,
    },
    ownershipBoundary: {
      motionOwnsRequestPolicyVoiceTimingCandidateAndQaSemantics: true as const,
      canonicalBackendOwnsRegistryPackageQueueLeaseDispatchAndAttemptCost: true as const,
      motionQueueCreated: false as const,
      motionProviderRegistryCreated: false as const,
      motionLeaseStoreCreated: false as const,
      motionWorkerMeterCreated: false as const,
    },
    sideEffects: {
      credentialReadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      providerCostMicros: 0 as const,
      infrastructureCostMicros: 0 as const,
      selectionCount: 0 as const,
      mixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioCanonicalBackendSpeechOperationRequirementV1Schema.parse({
    ...base,
    requirementDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioCanonicalBackendSpeechOperationRequirement(
  input: MotionStudioCanonicalBackendSpeechOperationRequirementV1,
): MotionStudioCanonicalBackendSpeechOperationRequirementV1 {
  const parsed = motionStudioCanonicalBackendSpeechOperationRequirementV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.requirementDigest
  if (sha256CanonicalJson(base) !== parsed.requirementDigest) {
    blocked('Canonical backend Speech operation requirement failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function assertCurrentSourceAuthority(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capability: MotionStudioSpeechCapabilitySnapshotV1
  authority: MotionStudioSpeechC2ExecutionAuthorityV1
  createdAt: string
}): void {
  const createdAt = Date.parse(input.createdAt)
  if (
    !input.capability.expiresAt ||
    createdAt < Date.parse(input.authority.issuedAt) ||
    createdAt >= Date.parse(input.authority.expiresAt) ||
    createdAt < Date.parse(input.capability.capturedAt) ||
    createdAt >= Date.parse(input.capability.expiresAt)
  ) {
    blocked('Canonical backend Speech operation requirement requires current capability and authority evidence.')
  }
  if (
    input.request.modelSelection.requestedModelId !== 'eleven_v3' ||
    input.request.modelSelection.fallbackAllowed ||
    input.request.modelSelection.automaticFallback ||
    input.request.executionBoundary.protocolSimulatorOnly ||
    !input.request.executionBoundary.providerExecutionAllowed ||
    input.request.executionBoundary.providerCallMaximum !== 1 ||
    input.authority.modelId !== 'eleven_v3' ||
    input.authority.providerOutputFormat !== 'mp3_44100_128' ||
    input.authority.maximumProviderCalls !== 1 ||
    input.authority.enableProviderLogging ||
    input.authority.automaticRetryAllowed ||
    input.authority.automaticFallbackAllowed ||
    input.authority.timelineMutationAllowed ||
    input.authority.finalSelectionAllowed
  ) {
    blocked('Canonical backend Speech operation requirement cannot widen the exact one-take authority.')
  }
}

function canonicalIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Canonical backend Speech operation requirement time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_canonical_backend_speech_operation_requirement',
  })
}
