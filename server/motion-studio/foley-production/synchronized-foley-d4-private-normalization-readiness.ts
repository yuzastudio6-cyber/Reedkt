import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { MotionStudioSynchronizedFoleyCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioSynchronizedFoleyCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import {
  persistCanonicalPrivateGeneratedMedia,
  readCanonicalPrivateGeneratedMedia,
} from '../../services/canonical-private-generated-media-storage'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineSynchronizedFoleyCandidateNormalizeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import { parseMotionStudioPcmWave } from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyD4NormalizationHandoffPlan,
  type MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1,
} from './synchronized-foley-d4-normalization-handoff-plan'
import {
  assertMotionStudioSynchronizedFoleyD4Preflight,
  type MotionStudioSynchronizedFoleyD4PreflightV1,
} from './synchronized-foley-d4-preflight'
import {
  assertMotionStudioSynchronizedFoleyD4ProviderOutputEvidence,
  type MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1,
} from './synchronized-foley-d4-provider-output-evidence'
import {
  proveMotionStudioSynchronizedFoleyObjectiveQaReadiness,
} from './synchronized-foley-objective-qa-readiness'
import { proveMotionStudioSynchronizedFoleyReviewReadiness } from './synchronized-foley-review-readiness'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PRIVATE_NORMALIZATION_READINESS_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-d4-private-normalization-readiness.v1' as const

const REMAINING_BLOCKERS = [
  'actual_private_provider_mp4_absent',
  'actual_provider_attempt_and_audio_probe_absent',
  'canonical_provider_lease_dispatch_and_cost_reconciliation_absent',
  'actual_candidate_semantic_rights_and_human_reviews_absent',
] as const

const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })

export const motionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1Schema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PRIVATE_NORMALIZATION_READINESS_SCHEMA_VERSION,
  ),
  evidenceId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  createdAt: isoDate,
  sourceRequestId: stableId,
  sourceRequestDigest: digest,
  sourcePreflightId: stableId,
  sourcePreflightDigest: digest,
  sourceProviderOutputEvidenceId: stableId,
  sourceProviderOutputEvidenceDigest: digest,
  sourceHandoffPlanId: stableId,
  sourceHandoffPlanDigest: digest,
  state: z.literal(
    'shared_profile_private_local_integration_ready_actual_provider_candidate_absent',
  ),
  runtime: z.object({
    operationId: z.literal(OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg),
    recipeProfileId: z.literal(OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE),
    profileRegistrationState: z.literal('registered_under_existing_canonical_operation'),
    runtimeAuthorityHash: digest,
    imageIdentityHash: digest,
    privateInternalExecutionReady: z.literal(true),
    productReady: z.literal(false),
    finalExportReady: z.literal(false),
  }).strict(),
  sourceFixture: z.object({
    evidenceClass: z.literal('synthetic_private_nonprovider_provider_shaped_mp4'),
    privateObjectIdentityHash: digest,
    mimeType: z.literal('video/mp4'),
    byteLength: z.number().int().min(64).max(67_108_864),
    sha256: digest,
    createOnlyReadbackVerified: z.literal(true),
    videoStreamCount: z.literal(1),
    audioStreamCount: z.literal(1),
    audioCodec: z.string().trim().min(1).max(40),
    audioSampleRateHertz: z.number().int().min(8_000).max(192_000),
    audioChannelCount: z.number().int().min(1).max(8),
    probedDurationMilliseconds: z.number().int().positive().max(31_000),
    sourceProbeDigest: digest,
    providerResponseReceived: z.literal(false),
    providerAttemptPresent: z.literal(false),
    providerUrlPersisted: z.literal(false),
  }).strict(),
  normalizedArtifact: z.object({
    privateObjectIdentityHash: digest,
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    fps: z.union([z.literal(24), z.literal(30)]),
    durationFrames: z.number().int().positive().max(900),
    sampleCountPerChannel: z.number().int().positive().max(1_440_000),
    durationMilliseconds: z.number().int().positive().max(30_000),
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sha256: digest,
    normalizationAttestationHash: digest,
    normalizationRequestEnvelopeSha256: digest,
    outputProbeDigest: digest,
    deterministicReplayVerified: z.literal(true),
    privateCreateOnlyReadbackVerified: z.literal(true),
    silencePaddingApplied: z.literal(false),
    metadataStripped: z.literal(true),
  }).strict(),
  objectiveQa: z.object({
    evidenceId: stableId,
    evidenceDigest: digest,
    analysisDigest: digest,
    objectiveGateCount: z.literal(13),
    objectiveQaPassed: z.literal(true),
    actualProviderCandidateQaComplete: z.literal(false),
    semanticRightsAndHumanGateCount: z.literal(5),
    semanticRightsAndHumanReviewComplete: z.literal(false),
  }).strict(),
  reviewIntake: z.object({
    reviewReadinessId: stableId,
    recordDigest: digest,
    state: z.literal('review_intake_contract_ready_actual_candidate_absent'),
    requiredGateCount: z.literal(5),
    readyForHumanReview: z.literal(false),
    readyForSelectionDecision: z.literal(false),
  }).strict(),
  localIntegrationChecks: z.tuple([
    z.literal('shared_profile_registered'),
    z.literal('synthetic_private_mp4_create_only_readback'),
    z.literal('exact_one_audio_stream_private_probe'),
    z.literal('fixed_frame_derived_pcm_normalization'),
    z.literal('normalized_wav_create_only_readback'),
    z.literal('deterministic_normalization_replay'),
    z.literal('objective_qa_and_review_intake_chained'),
  ]).readonly(),
  remainingBlockers: z.tuple([
    z.literal('actual_private_provider_mp4_absent'),
    z.literal('actual_provider_attempt_and_audio_probe_absent'),
    z.literal('canonical_provider_lease_dispatch_and_cost_reconciliation_absent'),
    z.literal('actual_candidate_semantic_rights_and_human_reviews_absent'),
  ]).readonly(),
  cost: z.object({
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: z.null(),
    accountingState: z.literal(
      'synthetic_local_test_infrastructure_not_metered_or_attributed_to_candidate',
    ),
    observedCpuMemoryGpuUsagePresent: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCreated: z.literal(false),
    syntheticSourcePersisted: z.literal(true),
    privateNormalizedFixturePersisted: z.literal(true),
    objectiveQaEvidencePersisted: z.literal(true),
    reviewReadinessEvidencePersisted: z.literal(true),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  readiness: z.object({
    sharedProfileRegistered: z.literal(true),
    privateLocalIntegrationReady: z.literal(true),
    actualProviderCandidatePresent: z.literal(false),
    canonicalProviderAttemptAuthorityPresent: z.literal(false),
    actualCandidateReviewComplete: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digest,
  }).strict(),
  immutable: z.literal(true),
  evidenceDigest: digest,
}).strict().superRefine((value, context) => {
  if (value.remainingBlockers.join('|') !== REMAINING_BLOCKERS.join('|')) {
    context.addIssue({
      code: 'custom',
      path: ['remainingBlockers'],
      message: 'D4 private normalization readiness must preserve every actual-evidence blocker.',
    })
  }
  const expectedSamples = value.normalizedArtifact.durationFrames *
    (48_000 / value.normalizedArtifact.fps)
  if (value.normalizedArtifact.sampleCountPerChannel !== expectedSamples) {
    context.addIssue({
      code: 'custom',
      path: ['normalizedArtifact', 'sampleCountPerChannel'],
      message: 'D4 normalized samples must derive exactly from frame authority.',
    })
  }
})

export type MotionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1 =
  z.infer<typeof motionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1Schema>

export async function proveMotionStudioSynchronizedFoleyD4PrivateNormalizationReadiness(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  providerOutputEvidence: MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1
  handoffPlan: MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1
  syntheticProviderShapedMp4Bytes: Buffer
  expectedHitFrames: readonly number[]
  speechFrameRanges: readonly { startFrame: number; endFrame: number }[]
  localStorageRoot: string
  objectiveQaLocalStorageRoot: string
  createdAt: string
}): Promise<MotionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1> {
  const request = motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse(input.request)
  assertMotionStudioSynchronizedFoleyD4Preflight(input.preflight)
  assertMotionStudioSynchronizedFoleyD4ProviderOutputEvidence(input.providerOutputEvidence)
  assertMotionStudioSynchronizedFoleyD4NormalizationHandoffPlan(input.handoffPlan)
  assertExactLineage(input)
  const createdAt = exactIso(input.createdAt)
  if (
    Date.parse(createdAt) < Date.parse(input.handoffPlan.createdAt) ||
    Date.parse(createdAt) >= Date.parse(input.preflight.expiresAt)
  ) blocked('D4 private normalization readiness must remain inside its exact synthetic evidence window.')
  if (!/^\/tmp\/reeditpro-motion-studio-foley-d4-private-normalization-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('D4 private normalization readiness requires its bounded server-owned local root.')
  }
  if (!/^\/tmp\/reeditpro-motion-studio-foley-objective-qa-[A-Za-z0-9._-]+$/u
    .test(input.objectiveQaLocalStorageRoot)) {
    invalid('D4 private normalization readiness requires its bounded objective-QA root.')
  }
  if (
    !Buffer.isBuffer(input.syntheticProviderShapedMp4Bytes) ||
    input.syntheticProviderShapedMp4Bytes.byteLength < 64 ||
    input.syntheticProviderShapedMp4Bytes.byteLength >
      input.handoffPlan.requiredPrivateProviderArtifact.maximumByteLength
  ) invalid('D4 synthetic provider-shaped MP4 exceeds the exact private input contract.')

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
    !runtimeAuthority.supportedRecipeProfiles.includes(
      OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
    )
  ) blocked('The canonical private FFmpeg runtime has not registered the frozen synchronized-Foley profile.')
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
    blocked('The canonical FFmpeg image changed after D4 profile registration.')
  }

  const sourceSha256 = sha256(input.syntheticProviderShapedMp4Bytes)
  const sourcePrivateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_d4_synthetic_provider_shaped_mp4_v1',
    handoffPlanDigest: input.handoffPlan.planDigest,
    sourceSha256,
  })
  await persistCanonicalPrivateGeneratedMedia({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: sourcePrivateObjectIdentityHash,
    mimeType: 'video/mp4',
    bytes: input.syntheticProviderShapedMp4Bytes,
    expectedSha256: sourceSha256,
  })
  const storedSource = await readCanonicalPrivateGeneratedMedia({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: sourcePrivateObjectIdentityHash,
    mimeType: 'video/mp4',
  })
  if (
    !storedSource || storedSource.sha256 !== sourceSha256 ||
    !storedSource.bytes.equals(input.syntheticProviderShapedMp4Bytes)
  ) blocked('D4 synthetic provider-shaped MP4 changed after create-only private persistence.')

  const normalizationRequest = validateOfflineSynchronizedFoleyCandidateNormalizeExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
      mimeType: 'video/mp4',
      sourceByteLength: storedSource.byteLength,
      sourceSha256: storedSource.sha256,
      sourceBytesBase64: storedSource.bytes.toString('base64'),
      fps: input.handoffPlan.durationAndOutputPolicy.fps,
      durationFrames: input.handoffPlan.durationAndOutputPolicy.durationFrames,
      exactOutputSampleCountPerChannel:
        input.handoffPlan.durationAndOutputPolicy.exactOutputSampleCountPerChannel,
      outputContainer: 'wav',
      outputCodec: 'pcm_s16le',
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      metadataPolicy: 'strip_all',
      silencePaddingAllowed: false,
      trimAtMostOneFrameOfExcessAllowed: true,
      overwriteExistingArtifact: false,
    },
  })
  const normalized = await runtime.execute(normalizationRequest)
  const replay = await runtime.execute(normalizationRequest)
  if (
    replay.resultArtifact.sha256 !== normalized.resultArtifact.sha256 ||
    !replay.resultArtifact.bytes.equals(normalized.resultArtifact.bytes)
  ) blocked('D4 synchronized-Foley normalization replay produced different bytes.')
  const wave = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  if (
    wave.sampleRateHertz !== 48_000 || wave.channelCount !== 2 ||
    wave.sampleCountPerChannel !==
      input.handoffPlan.durationAndOutputPolicy.exactOutputSampleCountPerChannel ||
    wave.sampleCountPerChannel !== normalized.resultArtifact.sampleCountPerChannel
  ) blocked('D4 normalized WAV changed the exact frame-derived PCM authority.')

  const normalizedPrivateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_d4_private_normalized_fixture_v1',
    handoffPlanDigest: input.handoffPlan.planDigest,
    sourcePrivateObjectIdentityHash,
    normalizationRequestEnvelopeSha256: normalized.evidence.requestEnvelopeSha256,
    normalizedSha256: normalized.resultArtifact.sha256,
  })
  await persistCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
    bytes: normalized.resultArtifact.bytes,
    expectedSha256: normalized.resultArtifact.sha256,
  })
  const storedNormalized = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
  })
  if (
    !storedNormalized || storedNormalized.sha256 !== normalized.resultArtifact.sha256 ||
    !storedNormalized.bytes.equals(normalized.resultArtifact.bytes)
  ) blocked('D4 normalized WAV changed after create-only private persistence.')

  const objectiveQa = await proveMotionStudioSynchronizedFoleyObjectiveQaReadiness({
    request,
    syntheticNormalizedWavBytes: storedNormalized.bytes,
    fps: input.handoffPlan.durationAndOutputPolicy.fps,
    expectedHitFrames: input.expectedHitFrames,
    speechFrameRanges: input.speechFrameRanges,
    localStorageRoot: input.objectiveQaLocalStorageRoot,
    createdAt,
  })
  const reviewReadiness = await proveMotionStudioSynchronizedFoleyReviewReadiness({
    objectiveQaReadiness: objectiveQa,
    localStorageRoot: input.objectiveQaLocalStorageRoot,
    createdAt: new Date(Date.parse(createdAt) + 1_000).toISOString(),
  })

  const sourceProbe = record(normalized.evidence.semanticEvidence.sourceProbe)
  const outputProbe = record(normalized.evidence.semanticEvidence.outputProbe)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_d4_private_normalization_readiness_v1',
    handoffPlanDigest: input.handoffPlan.planDigest,
    runtimeAuthorityHash: runtimeAuthority.authorityHash,
    sourcePrivateObjectIdentityHash,
    normalizedPrivateObjectIdentityHash,
    objectiveQaEvidenceDigest: objectiveQa.evidenceDigest,
    reviewReadinessDigest: reviewReadiness.recordDigest,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_D4_PRIVATE_NORMALIZATION_READINESS_SCHEMA_VERSION,
    evidenceId: `ms012d4-private-normalization-${evidenceObjectIdentityHash.slice(0, 24)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    createdAt,
    sourceRequestId: request.foleyRequestId,
    sourceRequestDigest: sha256CanonicalJson(request),
    sourcePreflightId: input.preflight.preflightId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    sourceProviderOutputEvidenceId: input.providerOutputEvidence.evidenceId,
    sourceProviderOutputEvidenceDigest: input.providerOutputEvidence.evidenceDigest,
    sourceHandoffPlanId: input.handoffPlan.planId,
    sourceHandoffPlanDigest: input.handoffPlan.planDigest,
    state: 'shared_profile_private_local_integration_ready_actual_provider_candidate_absent' as const,
    runtime: {
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      recipeProfileId: OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
      profileRegistrationState: 'registered_under_existing_canonical_operation' as const,
      runtimeAuthorityHash: runtimeAuthority.authorityHash,
      imageIdentityHash: runtime.image.imageIdentityHash,
      privateInternalExecutionReady: true as const,
      productReady: false as const,
      finalExportReady: false as const,
    },
    sourceFixture: {
      evidenceClass: 'synthetic_private_nonprovider_provider_shaped_mp4' as const,
      privateObjectIdentityHash: sourcePrivateObjectIdentityHash,
      mimeType: 'video/mp4' as const,
      byteLength: storedSource.byteLength,
      sha256: storedSource.sha256,
      createOnlyReadbackVerified: true as const,
      videoStreamCount: 1 as const,
      audioStreamCount: 1 as const,
      audioCodec: exactText(sourceProbe.audioCodec, 'source audio codec'),
      audioSampleRateHertz: exactInteger(sourceProbe.sampleRateHertz, 'source audio sample rate'),
      audioChannelCount: exactInteger(sourceProbe.channelCount, 'source audio channel count'),
      probedDurationMilliseconds: exactInteger(
        sourceProbe.durationMilliseconds,
        'source media duration',
      ),
      sourceProbeDigest: sha256CanonicalJson(sourceProbe),
      providerResponseReceived: false as const,
      providerAttemptPresent: false as const,
      providerUrlPersisted: false as const,
    },
    normalizedArtifact: {
      privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
      mimeType: 'audio/wav' as const,
      codec: 'pcm_s16le' as const,
      sampleRateHertz: 48_000 as const,
      channelCount: 2 as const,
      fps: input.handoffPlan.durationAndOutputPolicy.fps,
      durationFrames: input.handoffPlan.durationAndOutputPolicy.durationFrames,
      sampleCountPerChannel: normalized.resultArtifact.sampleCountPerChannel,
      durationMilliseconds: normalized.resultArtifact.durationMilliseconds,
      byteLength: storedNormalized.byteLength,
      sha256: storedNormalized.sha256,
      normalizationAttestationHash: normalized.attestation.attestationHash,
      normalizationRequestEnvelopeSha256: normalized.evidence.requestEnvelopeSha256,
      outputProbeDigest: sha256CanonicalJson(outputProbe),
      deterministicReplayVerified: true as const,
      privateCreateOnlyReadbackVerified: true as const,
      silencePaddingApplied: false as const,
      metadataStripped: true as const,
    },
    objectiveQa: {
      evidenceId: objectiveQa.evidenceId,
      evidenceDigest: objectiveQa.evidenceDigest,
      analysisDigest: objectiveQa.measurements.analysisDigest,
      objectiveGateCount: 13 as const,
      objectiveQaPassed: true as const,
      actualProviderCandidateQaComplete: false as const,
      semanticRightsAndHumanGateCount: 5 as const,
      semanticRightsAndHumanReviewComplete: false as const,
    },
    reviewIntake: {
      reviewReadinessId: reviewReadiness.reviewReadinessId,
      recordDigest: reviewReadiness.recordDigest,
      state: 'review_intake_contract_ready_actual_candidate_absent' as const,
      requiredGateCount: 5 as const,
      readyForHumanReview: false as const,
      readyForSelectionDecision: false as const,
    },
    localIntegrationChecks: [
      'shared_profile_registered',
      'synthetic_private_mp4_create_only_readback',
      'exact_one_audio_stream_private_probe',
      'fixed_frame_derived_pcm_normalization',
      'normalized_wav_create_only_readback',
      'deterministic_normalization_replay',
      'objective_qa_and_review_intake_chained',
    ] as const,
    remainingBlockers: REMAINING_BLOCKERS,
    cost: {
      providerCostMicros: 0 as const,
      infrastructureCostMicros: null,
      accountingState:
        'synthetic_local_test_infrastructure_not_metered_or_attributed_to_candidate' as const,
      observedCpuMemoryGpuUsagePresent: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      billingMutationPerformed: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCreated: false as const,
      syntheticSourcePersisted: true as const,
      privateNormalizedFixturePersisted: true as const,
      objectiveQaEvidencePersisted: true as const,
      reviewReadinessEvidencePersisted: true as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    readiness: {
      sharedProfileRegistered: true as const,
      privateLocalIntegrationReady: true as const,
      actualProviderCandidatePresent: false as const,
      canonicalProviderAttemptAuthorityPresent: false as const,
      actualCandidateReviewComplete: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    immutable: true as const,
  }
  const evidence = parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  await persistEvidenceRecord(input.localStorageRoot, evidence)
  return evidence
}

export function assertMotionStudioSynchronizedFoleyD4PrivateNormalizationReadiness(
  input: MotionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1,
): void {
  const parsed = motionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.evidenceDigest
  if (
    sha256CanonicalJson(base) !== parsed.evidenceDigest ||
    parsed.readiness.actualProviderCandidatePresent ||
    parsed.readiness.canonicalProviderAttemptAuthorityPresent ||
    parsed.readiness.actualCandidateReviewComplete || parsed.readiness.selectionEligible ||
    parsed.readiness.finalMixEligible || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.sideEffects.providerCandidateCreated ||
    parsed.sideEffects.selectionPerformed || parsed.sideEffects.finalMixMutationPerformed ||
    parsed.sideEffects.timelineMutationPerformed || parsed.sideEffects.remoteMutationPerformed
  ) blocked('D4 private normalization readiness failed its immutable fail-closed boundary.')
}

function assertExactLineage(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  preflight: MotionStudioSynchronizedFoleyD4PreflightV1
  providerOutputEvidence: MotionStudioSynchronizedFoleyD4ProviderOutputEvidenceV1
  handoffPlan: MotionStudioSynchronizedFoleyD4NormalizationHandoffPlanV1
}): void {
  const requestDigest = sha256CanonicalJson(input.request)
  const scope = [
    input.request.workspaceId,
    input.request.projectId,
    input.request.editSessionId,
    input.request.productionId,
  ].join('|')
  const scopes = [input.preflight, input.providerOutputEvidence, input.handoffPlan]
    .map((entry) => [entry.workspaceId, entry.projectId, entry.editSessionId, entry.productionId].join('|'))
  if (
    scopes.some((candidate) => candidate !== scope) ||
    input.preflight.sourceFoleyRequestId !== input.request.foleyRequestId ||
    input.preflight.sourceFoleyRequestDigest !== requestDigest ||
    input.providerOutputEvidence.sourceFoleyRequestId !== input.request.foleyRequestId ||
    input.providerOutputEvidence.sourceFoleyRequestDigest !== requestDigest ||
    input.providerOutputEvidence.sourcePreflightId !== input.preflight.preflightId ||
    input.providerOutputEvidence.sourcePreflightDigest !== input.preflight.preflightDigest ||
    input.handoffPlan.sourceFoleyRequestId !== input.request.foleyRequestId ||
    input.handoffPlan.sourceFoleyRequestDigest !== requestDigest ||
    input.handoffPlan.sourcePreflightId !== input.preflight.preflightId ||
    input.handoffPlan.sourcePreflightDigest !== input.preflight.preflightDigest ||
    input.handoffPlan.sourceProviderOutputEvidenceId !== input.providerOutputEvidence.evidenceId ||
    input.handoffPlan.sourceProviderOutputEvidenceDigest !== input.providerOutputEvidence.evidenceDigest ||
    input.handoffPlan.sourceVideoAssetVersionId !== input.request.sourceVideoAssetVersion.assetVersionId ||
    input.handoffPlan.sourceVideoContentDigest !== input.request.sourceVideoAssetVersion.contentDigest ||
    input.handoffPlan.pictureLockContentDigest !== input.request.pictureLockContentDigest ||
    input.handoffPlan.timingAuthorityDigest !== input.request.timingAuthorityDigest
  ) blocked('D4 private normalization readiness must bind one exact request, preflight, output boundary and handoff.')
}

async function persistEvidenceRecord(
  root: string,
  evidence: MotionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1,
): Promise<void> {
  const relativePath = `motion-studio/synchronized-foley-d4-private-normalization-readiness/${
    evidence.persistence.evidenceObjectIdentityHash.slice(0, 2)
  }/${evidence.persistence.evidenceObjectIdentityHash}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('D4 private normalization readiness evidence changed after create-only persistence.')
  }
}

function parseAndFreeze(
  value: unknown,
): MotionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1 {
  return deepFreeze(motionStudioSynchronizedFoleyD4PrivateNormalizationReadinessV1Schema.parse(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('D4 private normalization runtime omitted required probe evidence.')
  }
  return value as Readonly<Record<string, unknown>>
}

function exactInteger(value: unknown, label: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    blocked(`D4 private normalization runtime omitted its exact ${label}.`)
  }
  return parsed
}

function exactText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 40) {
    blocked(`D4 private normalization runtime omitted its exact ${label}.`)
  }
  return value
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value) {
    invalid('D4 private normalization readiness requires an exact UTC timestamp.')
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
