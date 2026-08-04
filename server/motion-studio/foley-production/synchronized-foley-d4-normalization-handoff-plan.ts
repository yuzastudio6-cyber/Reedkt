import { z } from 'zod'

import type { MotionStudioSynchronizedFoleyCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioSynchronizedFoleyCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyD4Preflight,
  motionStudioSynchronizedFoleyD4PreflightV1Schema,
  type MotionStudioSynchronizedFoleyD4PreflightV1,
} from './synchronized-foley-d4-preflight'
import {
  assertMotionStudioSynchronizedFoleyD4ProviderOutputEvidence,
  motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema,
  type MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1,
} from './synchronized-foley-d4-provider-output-evidence'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_HANDOFF_PLAN_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-d4-normalization-handoff-plan.v1' as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_PROFILE_ID =
  'approved_synchronized_foley_candidate_normalization_v1' as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_CANONICAL_FFMPEG_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_BLOCKER_CODES = [
  'canonical_shared_normalization_profile_not_registered',
  'actual_private_provider_mp4_absent',
  'private_audio_stream_probe_absent',
  'canonical_job_attempt_lease_and_infrastructure_cost_authority_absent',
] as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const upstreamBlockerCode = z.enum([
  'immutable_model_revision_not_published',
  'exact_output_audio_codec_sample_rate_and_channels_require_private_probe',
  'enterprise_ready_or_excluded_model_designation_not_published',
  'commercial_rights_conflict_requires_provider_or_legal_attestation',
  'account_access_prepaid_funds_quota_and_rate_card_not_verified',
  'canonical_provider_dispatch_lease_single_use_and_cost_runtime_absent',
  'private_acl_expiration_ingest_and_cleanup_runtime_not_proven',
  'no_retry_no_fallback_and_unknown_outcome_runtime_not_proven',
  'actual_candidate_semantic_rights_and_human_reviews_absent',
])
export const motionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_HANDOFF_PLAN_SCHEMA_VERSION),
  planId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  createdAt: isoDate,
  sourceFoleyRequestId: stableId,
  sourceFoleyRequestDigest: digest,
  sourcePreflightId: stableId,
  sourcePreflightDigest: digest,
  sourceProviderOutputEvidenceId: stableId,
  sourceProviderOutputEvidenceDigest: digest,
  soundEventId: stableId,
  sourceVideoAssetVersionId: stableId,
  sourceVideoContentDigest: digest,
  pictureLockContentDigest: digest,
  timingAuthorityDigest: digest,
  canonicalExecutionTarget: z.object({
    operationId: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_CANONICAL_FFMPEG_OPERATION_ID),
    recipeProfileId: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_PROFILE_ID),
    operationOwner: z.literal('canonical_backend_media_binary_runtime'),
    registryOwner: z.literal('existing_reeditpro_tool_registry'),
    profileRegistrationState: z.literal('proposed_pending_backend_shared_registration'),
    runtimeImplementationPresent: z.literal(false),
    newOperationRequired: z.literal(false),
    newQueueRequired: z.literal(false),
    motionOwnedRuntimeAllowed: z.literal(false),
    callerSelectedArgumentsAllowed: z.literal(false),
    callerSelectedExecutableAllowed: z.literal(false),
    callerSelectedEnvironmentAllowed: z.literal(false),
  }).strict(),
  requiredPrivateProviderArtifact: z.object({
    artifactKind: z.literal('private_provider_mmaudio_mp4_with_synchronized_audio_v1'),
    role: z.literal('video_with_synchronized_audio'),
    mimeType: z.literal('video/mp4'),
    container: z.literal('mp4'),
    maximumByteLength: z.literal(67_108_864),
    privateAssetVersionRequired: z.literal(true),
    exactContentDigestRequired: z.literal(true),
    exactByteLengthRequired: z.literal(true),
    exactProviderAttemptLineageRequired: z.literal(true),
    ownerOnlyReadAuthorityRequired: z.literal(true),
    providerUrlAcceptedAsInputAuthority: z.literal(false),
    providerUrlRetained: z.literal(false),
    sourceBytesEmbeddedInPlan: z.literal(false),
    actualPrivateArtifactPresent: z.literal(false),
    actualAssetVersionId: z.null(),
    actualContentDigest: z.null(),
    actualByteLength: z.null(),
  }).strict(),
  probeAndStreamPolicy: z.object({
    privateProbeRequired: z.literal(true),
    probeOwnedByNormalizationProfilePreflight: z.literal(true),
    probeResultPresent: z.literal(false),
    requiredAudioStreamCount: z.literal(1),
    rejectMissingAudioStream: z.literal(true),
    rejectMultipleAudioStreams: z.literal(true),
    callerSelectedStreamIndexAllowed: z.literal(false),
    exactProviderAudioCodec: z.literal('unknown_until_private_probe'),
    exactProviderSampleRateHertz: z.null(),
    exactProviderChannelCount: z.null(),
    decodableByApprovedImageRequired: z.literal(true),
    providerContainerMayEnterCanonicalAudioQa: z.literal(false),
  }).strict(),
  durationAndOutputPolicy: z.object({
    fps: z.union([z.literal(24), z.literal(30)]),
    durationFrames: z.number().int().positive().max(900),
    requestedDurationMilliseconds: z.number().int().positive().max(30_000),
    samplesPerFrame: z.number().int().positive(),
    exactOutputSampleCountPerChannel: z.number().int().positive().max(1_440_000),
    minimumResampledInputSampleCountPerChannel: z.number().int().positive().max(1_440_000),
    maximumResampledInputSampleCountPerChannel: z.number().int().positive().max(1_442_000),
    silencePaddingAllowed: z.literal(false),
    trimAtMostOneFrameOfExcessAllowed: z.literal(true),
    outputRole: z.literal('extracted_normalized_foley_candidate'),
    outputContainer: z.literal('wav'),
    outputCodec: z.literal('pcm_s16le'),
    outputSampleRateHertz: z.literal(48_000),
    outputChannelCount: z.literal(2),
    outputChannelPolicy: z.literal('deterministic_stereo_decode_or_downmix'),
    metadataPolicy: z.literal('strip_all'),
    loudnessGainApplied: z.literal(false),
    dynamicProcessingApplied: z.literal(false),
    creativeTransformAllowed: z.literal(false),
  }).strict(),
  privateOutputPolicy: z.object({
    createOnly: z.literal(true),
    overwriteExistingArtifact: z.literal(false),
    privateAssetRequired: z.literal(true),
    exactOutputDigestRequired: z.literal(true),
    exactOutputByteLengthRequired: z.literal(true),
    exactMediaProbeRequired: z.literal(true),
    sourceAndOutputLineageRequired: z.literal(true),
    objectiveQaRequiredBeforeReview: z.literal(true),
    automaticSelectionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    finalMixMutationAllowed: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    providerChargeBelongsToNormalizationAttempt: z.literal(false),
    infrastructureCostEvidenceRequired: z.literal(true),
    infrastructureRateCardState: z.literal('pending_canonical_backend_rate_card'),
    observedResourceEvidenceState: z.literal('pending_canonical_runtime_meter'),
    failedAttemptCostRetentionRequired: z.literal(true),
    actualInfrastructureCostMicros: z.literal(0),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  upstreamProviderBlockerCodes: z.array(upstreamBlockerCode).length(9).readonly(),
  normalizationBlockerCodes: z.tuple([
    z.literal('canonical_shared_normalization_profile_not_registered'),
    z.literal('actual_private_provider_mp4_absent'),
    z.literal('private_audio_stream_probe_absent'),
    z.literal('canonical_job_attempt_lease_and_infrastructure_cost_authority_absent'),
  ]).readonly(),
  readiness: z.object({
    localHandoffContractComplete: z.literal(true),
    sharedProfileRegistered: z.literal(false),
    actualPrivateProviderArtifactPresent: z.literal(false),
    privateProbeComplete: z.literal(false),
    canonicalAttemptAuthorityPresent: z.literal(false),
    readyForCanonicalDispatch: z.literal(false),
    normalizationExecutionAllowed: z.literal(false),
    objectiveQaAllowed: z.literal(false),
    humanReviewAllowed: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    credentialReadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    binaryDownloadCount: z.literal(0),
    privateArtifactReadCount: z.literal(0),
    mediaProbeCount: z.literal(0),
    normalizationExecutionCount: z.literal(0),
    mediaBytesCreated: z.literal(0),
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.literal(0),
    selectionPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  planDigest: digest,
}).strict().superRefine((value, context) => {
  const expectedSamples = value.durationAndOutputPolicy.durationFrames * value.durationAndOutputPolicy.samplesPerFrame
  if (
    value.durationAndOutputPolicy.exactOutputSampleCountPerChannel !== expectedSamples ||
    value.durationAndOutputPolicy.minimumResampledInputSampleCountPerChannel !== expectedSamples ||
    value.durationAndOutputPolicy.maximumResampledInputSampleCountPerChannel !==
      expectedSamples + value.durationAndOutputPolicy.samplesPerFrame
  ) {
    context.addIssue({
      code: 'custom',
      path: ['durationAndOutputPolicy'],
      message: 'Foley normalization must preserve one exact frame-derived PCM duration with at most one frame of excess trim.',
    })
  }
})

export type MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1 =
  z.infer<typeof motionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1Schema>

export function createMotionStudioSynchronizedFoleyD4NormalizationHandoffPlan(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  providerOutputEvidence: MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1
  createdAt: string
}): MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1 {
  const request = motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse(input.request)
  const preflight = motionStudioSynchronizedFoleyD4PreflightV1Schema.parse(input.preflight)
  const outputEvidence = motionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1Schema.parse(
    input.providerOutputEvidence,
  )
  assertMotionStudioSynchronizedFoleyD4Preflight(preflight)
  assertMotionStudioSynchronizedFoleyD4ProviderOutputEvidence(outputEvidence)
  const createdAt = exactIso(input.createdAt)

  assertExactLineage({ request, preflight, outputEvidence })
  if (createdAt < outputEvidence.capturedAt || createdAt >= preflight.expiresAt) {
    blocked('D4 normalization handoff plan must be created while its exact provider-output evidence is current.')
  }

  const fps = preflight.timing.fps
  const samplesPerFrame = 48_000 / fps
  const durationFrames = preflight.timing.durationFrames
  const exactOutputSampleCountPerChannel = durationFrames * samplesPerFrame
  const requestedDurationMilliseconds = Math.round(preflight.timing.requestedDurationSeconds * 1_000)
  if (!Number.isSafeInteger(samplesPerFrame) || !Number.isSafeInteger(exactOutputSampleCountPerChannel)) {
    blocked('D4 normalization handoff requires an exact integer frame-to-sample mapping.')
  }

  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_HANDOFF_PLAN_SCHEMA_VERSION,
    planId: `ms012d4-normalization-${outputEvidence.evidenceDigest.slice(0, 16)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    createdAt,
    sourceFoleyRequestId: request.foleyRequestId,
    sourceFoleyRequestDigest: sha256CanonicalJson(request),
    sourcePreflightId: preflight.preflightId,
    sourcePreflightDigest: preflight.preflightDigest,
    sourceProviderOutputEvidenceId: outputEvidence.evidenceId,
    sourceProviderOutputEvidenceDigest: outputEvidence.evidenceDigest,
    soundEventId: request.soundEvent.soundEventId,
    sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
    sourceVideoContentDigest: request.sourceVideoAssetVersion.contentDigest,
    pictureLockContentDigest: request.pictureLockContentDigest,
    timingAuthorityDigest: request.timingAuthorityDigest,
    canonicalExecutionTarget: {
      operationId: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_CANONICAL_FFMPEG_OPERATION_ID,
      recipeProfileId: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_PROFILE_ID,
      operationOwner: 'canonical_backend_media_binary_runtime' as const,
      registryOwner: 'existing_reeditpro_tool_registry' as const,
      profileRegistrationState: 'proposed_pending_backend_shared_registration' as const,
      runtimeImplementationPresent: false as const,
      newOperationRequired: false as const,
      newQueueRequired: false as const,
      motionOwnedRuntimeAllowed: false as const,
      callerSelectedArgumentsAllowed: false as const,
      callerSelectedExecutableAllowed: false as const,
      callerSelectedEnvironmentAllowed: false as const,
    },
    requiredPrivateProviderArtifact: {
      artifactKind: 'private_provider_mmaudio_mp4_with_synchronized_audio_v1' as const,
      role: outputEvidence.providerOutput.role,
      mimeType: 'video/mp4' as const,
      container: outputEvidence.providerOutput.container,
      maximumByteLength: preflight.transportBudgetProposal.maximumBinaryDownloadBytes,
      privateAssetVersionRequired: true as const,
      exactContentDigestRequired: true as const,
      exactByteLengthRequired: true as const,
      exactProviderAttemptLineageRequired: true as const,
      ownerOnlyReadAuthorityRequired: true as const,
      providerUrlAcceptedAsInputAuthority: false as const,
      providerUrlRetained: false as const,
      sourceBytesEmbeddedInPlan: false as const,
      actualPrivateArtifactPresent: false as const,
      actualAssetVersionId: null,
      actualContentDigest: null,
      actualByteLength: null,
    },
    probeAndStreamPolicy: {
      privateProbeRequired: true as const,
      probeOwnedByNormalizationProfilePreflight: true as const,
      probeResultPresent: false as const,
      requiredAudioStreamCount: 1 as const,
      rejectMissingAudioStream: true as const,
      rejectMultipleAudioStreams: true as const,
      callerSelectedStreamIndexAllowed: false as const,
      exactProviderAudioCodec: outputEvidence.providerOutput.exactAudioCodec,
      exactProviderSampleRateHertz: outputEvidence.providerOutput.exactSampleRateHertz,
      exactProviderChannelCount: outputEvidence.providerOutput.exactChannelCount,
      decodableByApprovedImageRequired: true as const,
      providerContainerMayEnterCanonicalAudioQa: false as const,
    },
    durationAndOutputPolicy: {
      fps,
      durationFrames,
      requestedDurationMilliseconds,
      samplesPerFrame,
      exactOutputSampleCountPerChannel,
      minimumResampledInputSampleCountPerChannel: exactOutputSampleCountPerChannel,
      maximumResampledInputSampleCountPerChannel: exactOutputSampleCountPerChannel + samplesPerFrame,
      silencePaddingAllowed: false as const,
      trimAtMostOneFrameOfExcessAllowed: true as const,
      outputRole: outputEvidence.canonicalAudioTarget.role,
      outputContainer: outputEvidence.canonicalAudioTarget.container,
      outputCodec: outputEvidence.canonicalAudioTarget.codec,
      outputSampleRateHertz: outputEvidence.canonicalAudioTarget.sampleRateHertz,
      outputChannelCount: outputEvidence.canonicalAudioTarget.channelCount,
      outputChannelPolicy: 'deterministic_stereo_decode_or_downmix' as const,
      metadataPolicy: 'strip_all' as const,
      loudnessGainApplied: false as const,
      dynamicProcessingApplied: false as const,
      creativeTransformAllowed: false as const,
    },
    privateOutputPolicy: {
      createOnly: true as const,
      overwriteExistingArtifact: false as const,
      privateAssetRequired: true as const,
      exactOutputDigestRequired: true as const,
      exactOutputByteLengthRequired: true as const,
      exactMediaProbeRequired: true as const,
      sourceAndOutputLineageRequired: true as const,
      objectiveQaRequiredBeforeReview: true as const,
      automaticSelectionAllowed: false as const,
      timelineMutationAllowed: false as const,
      finalMixMutationAllowed: false as const,
    },
    costBoundary: {
      providerChargeBelongsToNormalizationAttempt: false as const,
      infrastructureCostEvidenceRequired: true as const,
      infrastructureRateCardState: 'pending_canonical_backend_rate_card' as const,
      observedResourceEvidenceState: 'pending_canonical_runtime_meter' as const,
      failedAttemptCostRetentionRequired: true as const,
      actualInfrastructureCostMicros: 0 as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationAllowed: false as const,
      billingAllowed: false as const,
    },
    upstreamProviderBlockerCodes: outputEvidence.blockingGateCodes,
    normalizationBlockerCodes: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_NORMALIZATION_BLOCKER_CODES,
    readiness: {
      localHandoffContractComplete: true as const,
      sharedProfileRegistered: false as const,
      actualPrivateProviderArtifactPresent: false as const,
      privateProbeComplete: false as const,
      canonicalAttemptAuthorityPresent: false as const,
      readyForCanonicalDispatch: false as const,
      normalizationExecutionAllowed: false as const,
      objectiveQaAllowed: false as const,
      humanReviewAllowed: false as const,
      productReady: false as const,
    },
    sideEffects: {
      credentialReadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      binaryDownloadCount: 0 as const,
      privateArtifactReadCount: 0 as const,
      mediaProbeCount: 0 as const,
      normalizationExecutionCount: 0 as const,
      mediaBytesCreated: 0 as const,
      providerCostMicros: 0 as const,
      infrastructureCostMicros: 0 as const,
      selectionPerformed: false as const,
      timelineMutationPerformed: false as const,
      finalMixMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    immutable: true as const,
  }

  return parseAndFreeze(
    { ...base, planDigest: sha256CanonicalJson(base) },
    motionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1Schema,
  )
}

export function assertMotionStudioSynchronizedFoleyD4NormalizationHandoffPlan(
  input: MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1,
): void {
  const plan = motionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1Schema.parse(input)
  const base = { ...plan } as Record<string, unknown>
  delete base.planDigest
  if (sha256CanonicalJson(base) !== plan.planDigest) {
    blocked('D4 normalization handoff plan failed immutable digest verification.')
  }
  if (
    plan.canonicalExecutionTarget.runtimeImplementationPresent ||
    plan.requiredPrivateProviderArtifact.actualPrivateArtifactPresent ||
    plan.probeAndStreamPolicy.probeResultPresent ||
    plan.readiness.readyForCanonicalDispatch ||
    plan.readiness.normalizationExecutionAllowed ||
    plan.readiness.objectiveQaAllowed ||
    plan.readiness.humanReviewAllowed ||
    plan.readiness.productReady ||
    plan.sideEffects.normalizationExecutionCount !== 0 ||
    plan.sideEffects.mediaBytesCreated !== 0 ||
    plan.sideEffects.infrastructureCostMicros !== 0
  ) {
    blocked('D4 normalization handoff plan crossed its shared-runtime, media, cost, QA, review or readiness boundary.')
  }
}

export function assertMotionStudioSynchronizedFoleyD4NormalizationDispatchReady(
  input: MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1,
): never {
  assertMotionStudioSynchronizedFoleyD4NormalizationHandoffPlan(input)
  blocked(
    'D4 Foley normalization dispatch remains blocked until the canonical shared profile, actual private provider artifact, private probe, and exact canonical attempt authority exist.',
  )
}

function assertExactLineage(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  outputEvidence: MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1
}): void {
  const { request, preflight, outputEvidence } = input
  const requestDigest = sha256CanonicalJson(request)
  if (
    request.workspaceId !== preflight.workspaceId || request.workspaceId !== outputEvidence.workspaceId ||
    request.projectId !== preflight.projectId || request.projectId !== outputEvidence.projectId ||
    request.editSessionId !== preflight.editSessionId || request.editSessionId !== outputEvidence.editSessionId ||
    request.productionId !== preflight.productionId || request.productionId !== outputEvidence.productionId ||
    preflight.sourceFoleyRequestId !== request.foleyRequestId ||
    preflight.sourceFoleyRequestDigest !== requestDigest ||
    outputEvidence.sourceFoleyRequestId !== request.foleyRequestId ||
    outputEvidence.sourceFoleyRequestDigest !== requestDigest ||
    outputEvidence.sourcePreflightId !== preflight.preflightId ||
    outputEvidence.sourcePreflightDigest !== preflight.preflightDigest
  ) {
    blocked('D4 normalization handoff must bind one exact request, preflight and provider-output evidence lineage.')
  }
  if (
    outputEvidence.requiredPrivatePipeline.deterministicNormalizationProfileId !== null ||
    outputEvidence.requiredPrivatePipeline.deterministicNormalizationRuntimeProven ||
    outputEvidence.providerOutput.mayBeTreatedAsDirectAudioOutput ||
    outputEvidence.requiredPrivatePipeline.providerContainerMayEnterCanonicalAudioQa
  ) {
    blocked('D4 normalization handoff cannot rewrite the frozen provider-output boundary or promote the provider MP4.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('D4 normalization handoff creation time must be canonical ISO-8601.')
  }
  return value
}

function parseAndFreeze<T>(value: unknown, schema: z.ZodType<T>): T {
  return deepFreeze(schema.parse(value))
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
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
