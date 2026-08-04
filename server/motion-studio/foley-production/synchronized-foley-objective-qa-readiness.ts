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
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  MOTION_STUDIO_AUDIO_MIX_PROFILE,
  parseMotionStudioPcmWave,
} from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_READINESS_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-objective-qa-readiness.v1' as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE =
  'motion_studio_synchronized_foley_objective_qa_v1' as const

const SHA256 = /^[a-f0-9]{64}$/
const digestSchema = z.string().regex(SHA256)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
}).strict().refine((value) => value.endFrame > value.startFrame, {
  message: 'Frame range end must follow its start.',
})
const qaGateSchema = z.enum([
  'request_integrity',
  'source_video_binding',
  'private_audio_integrity',
  'format_and_duration',
  'non_silent_signal',
  'transient_detection',
  'expected_event_coverage',
  'frame_alignment',
  'unplanned_event_control',
  'sample_peak_and_clipping',
  'speech_window_energy',
  'private_create_only_readback',
  'deterministic_replay',
  'visible_event_semantics',
  'forbidden_content_semantics',
  'room_and_style_fit',
  'candidate_rights_and_provenance',
  'human_listening_review',
])

const OBJECTIVE_GATES = [
  'request_integrity',
  'source_video_binding',
  'private_audio_integrity',
  'format_and_duration',
  'non_silent_signal',
  'transient_detection',
  'expected_event_coverage',
  'frame_alignment',
  'unplanned_event_control',
  'sample_peak_and_clipping',
  'speech_window_energy',
  'private_create_only_readback',
  'deterministic_replay',
] as const
const SEMANTIC_AND_HUMAN_GATES = [
  'visible_event_semantics',
  'forbidden_content_semantics',
  'room_and_style_fit',
  'candidate_rights_and_provenance',
  'human_listening_review',
] as const

const qaGateResultSchema = z.object({
  gate: qaGateSchema,
  result: z.enum(['passed', 'not_evaluated']),
  blocking: z.literal(true),
  evidenceDigest: digestSchema,
  note: z.string().trim().min(1).max(500),
}).strict()

export const motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_READINESS_SCHEMA_VERSION),
  evidenceId: stableIdSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  sourceSoundEventId: stableIdSchema,
  sourceVideoAssetVersionId: stableIdSchema,
  sourceVideoContentDigest: digestSchema,
  pictureLockContentDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  state: z.literal('objective_qa_profile_ready_route_closed'),
  createdAt: isoDateSchema,
  profile: z.object({
    profileId: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE),
    fps: z.union([z.literal(24), z.literal(30)]),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    bitsPerSample: z.literal(16),
    samplesPerFrame: z.union([z.literal(2_000), z.literal(1_600)]),
    alignmentToleranceFrames: z.literal(2),
    minimumTransientPeakDbfs: z.literal(-24),
    maximumAdaptiveTransientThresholdDbfs: z.literal(-6),
    transientBaselineMultiplier: z.literal(4),
    maximumSamplePeakDbfs: z.literal(-1),
    projectedFoleyMixGainDb: z.literal(-20),
    maximumProjectedSpeechWindowRmsDbfs: z.literal(-30),
    minimumSignalRmsDbfs: z.literal(-60),
    analysisClass: z.literal('deterministic_private_pcm_frame_analysis'),
  }).strict(),
  timing: z.object({
    candidateFrameRange: frameRangeSchema,
    sourceVideoFrameRange: frameRangeSchema,
    expectedHitFrames: z.array(z.number().int().nonnegative()).min(1).max(16).readonly(),
    speechFrameRanges: z.array(frameRangeSchema).max(32).readonly(),
  }).strict(),
  syntheticFixture: z.object({
    evidenceClass: z.literal('synthetic_private_nonprovider_normalized_pcm_wave'),
    privateObjectIdentityHash: digestSchema,
    sha256: digestSchema,
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sampleCountPerChannel: z.number().int().positive(),
    durationMilliseconds: z.number().int().positive(),
    providerResponseReceived: z.literal(false),
    providerRequestCount: z.literal(0),
    rawProviderPayloadPersisted: z.literal(false),
  }).strict(),
  measurements: z.object({
    durationFrames: z.number().int().positive(),
    overallRmsDbfs: z.number().finite().max(0),
    samplePeakDbfs: z.number().finite().max(0),
    clippingSampleCount: z.literal(0),
    adaptiveTransientThresholdDbfs: z.number().finite().max(0),
    detectedTransientFrames: z.array(z.number().int().nonnegative()).min(1).max(64).readonly(),
    expectedHits: z.array(z.object({
      expectedAbsoluteFrame: z.number().int().nonnegative(),
      expectedRelativeFrame: z.number().int().nonnegative(),
      detectedRelativeFrame: z.number().int().nonnegative(),
      offsetFrames: z.number().int().min(-2).max(2),
      alignmentPassed: z.literal(true),
    }).strict()).min(1).max(16).readonly(),
    unplannedTransientFrames: z.array(z.number().int().nonnegative()).length(0).readonly(),
    speechWindowRawRmsDbfs: z.number().finite().max(0).nullable(),
    speechWindowProjectedMixRmsDbfs: z.number().finite().max(-30).nullable(),
    bestUsableTrim: z.object({
      candidateStartFrame: z.number().int().nonnegative(),
      candidateHitFrame: z.number().int().nonnegative(),
      candidateEndFrame: z.number().int().positive(),
      hitOffsetInsideTrimFrames: z.number().int().nonnegative(),
      placementCorrectionFrames: z.number().int().min(-2).max(2),
      fadeInFrames: z.literal(1),
      fadeOutFrames: z.literal(2),
      timelineStartFrame: z.number().int().nonnegative(),
      timelineHitFrame: z.number().int().nonnegative(),
      timelineEndFrame: z.number().int().positive(),
    }).strict(),
    analysisDigest: digestSchema,
  }).strict(),
  qa: z.object({
    gateResults: z.array(qaGateResultSchema).length(18).readonly(),
    objectiveQaPassed: z.literal(true),
    semanticQaComplete: z.literal(false),
    humanListeningComplete: z.literal(false),
    futureAuthorizedCandidateAnalysisReady: z.literal(true),
    actualProviderCandidateQaComplete: z.literal(false),
    reviewEligible: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    qaDigest: digestSchema,
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    syntheticFixturePersisted: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    createOnly: z.literal(true),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  cost: z.object({
    providerCostMicros: z.literal(0),
    projectProductionAttemptCostMicros: z.literal(0),
    localFixtureAccountingState: z.literal('test_infrastructure_not_attributed_to_provider_candidate'),
    customerPricingIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCreated: z.literal(false),
    syntheticFixtureCreated: z.literal(true),
    executionAuthorityIssued: z.literal(false),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  synchronizedFoleyRouteOpen: z.literal(false),
  providerExecutionAllowed: z.literal(false),
  singleUseAuthorityIssued: z.literal(false),
  privateProviderCandidateCreated: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  evidenceDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const gates = value.qa.gateResults.map((entry) => entry.gate)
  if (new Set(gates).size !== gates.length) {
    context.addIssue({ code: 'custom', path: ['qa', 'gateResults'], message: 'Foley QA gates must be unique.' })
  }
  for (const gate of OBJECTIVE_GATES) {
    if (value.qa.gateResults.find((entry) => entry.gate === gate)?.result !== 'passed') {
      context.addIssue({ code: 'custom', path: ['qa', 'gateResults'], message: `Objective Foley gate ${gate} must pass.` })
    }
  }
  for (const gate of SEMANTIC_AND_HUMAN_GATES) {
    if (value.qa.gateResults.find((entry) => entry.gate === gate)?.result !== 'not_evaluated') {
      context.addIssue({ code: 'custom', path: ['qa', 'gateResults'], message: `Foley gate ${gate} must remain unevaluated.` })
    }
  }
})

export type MotionStudioSynchronizedFoleyObjectiveQaReadinessV1 =
  z.infer<typeof motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema>

export function analyzeMotionStudioSynchronizedFoleyObjectiveCandidate(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  normalizedWavBytes: Buffer
  fps: 24 | 30
  expectedHitFrames: readonly number[]
  speechFrameRanges: readonly { startFrame: number; endFrame: number }[]
}) {
  const request = parseRequest(input.request)
  assertProtocolOnlyRequest(request)
  if (!Buffer.isBuffer(input.normalizedWavBytes)) {
    invalid('Synchronized-Foley objective analysis requires exact private PCM WAV bytes.')
  }
  const timing = validateTiming({
    request,
    fps: input.fps,
    expectedHitFrames: input.expectedHitFrames,
    speechFrameRanges: input.speechFrameRanges,
  })
  const analysis = analyzeObjectiveFoley({
    bytes: input.normalizedWavBytes,
    request,
    timing,
    fps: input.fps,
  })
  const replay = analyzeObjectiveFoley({
    bytes: input.normalizedWavBytes,
    request,
    timing,
    fps: input.fps,
  })
  if (sha256CanonicalJson(analysis) !== sha256CanonicalJson(replay)) {
    blocked('Synchronized-Foley objective analysis replay changed deterministic evidence.')
  }
  return deepFreeze({
    requestDigest: sha256CanonicalJson(request),
    timing,
    analysis,
    deterministicReplayVerified: true as const,
  })
}

export async function proveMotionStudioSynchronizedFoleyObjectiveQaReadiness(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  syntheticNormalizedWavBytes: Buffer
  fps: 24 | 30
  expectedHitFrames: readonly number[]
  speechFrameRanges: readonly { startFrame: number; endFrame: number }[]
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioSynchronizedFoleyObjectiveQaReadinessV1> {
  const request = parseRequest(input.request)
  const createdAt = exactIso(input.createdAt)
  if (!/^\/tmp\/reeditpro-motion-studio-foley-objective-qa-[A-Za-z0-9._-]+$/.test(input.localStorageRoot)) {
    invalid('Synchronized-Foley objective QA requires its bounded server-owned local root.')
  }
  assertProtocolOnlyRequest(request)
  const timing = validateTiming({
    request,
    fps: input.fps,
    expectedHitFrames: input.expectedHitFrames,
    speechFrameRanges: input.speechFrameRanges,
  })
  if (!Buffer.isBuffer(input.syntheticNormalizedWavBytes)) {
    invalid('Synchronized-Foley objective QA requires exact private PCM WAV bytes.')
  }

  const requestDigest = sha256CanonicalJson(request)
  const sourceSha256 = sha256(input.syntheticNormalizedWavBytes)
  const privateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_objective_qa_fixture_v1',
    requestDigest,
    sourceSha256,
  })
  await persistCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
    bytes: input.syntheticNormalizedWavBytes,
    expectedSha256: sourceSha256,
  })
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
  })
  if (!stored || stored.sha256 !== sourceSha256 || !stored.bytes.equals(input.syntheticNormalizedWavBytes)) {
    blocked('Synchronized-Foley private fixture changed after create-only persistence.')
  }

  const analysis = analyzeObjectiveFoley({
    bytes: stored.bytes,
    request,
    timing,
    fps: input.fps,
  })
  const replay = analyzeObjectiveFoley({
    bytes: stored.bytes,
    request,
    timing,
    fps: input.fps,
  })
  if (sha256CanonicalJson(analysis) !== sha256CanonicalJson(replay)) {
    blocked('Synchronized-Foley objective QA replay changed deterministic analysis evidence.')
  }

  const qaGateResults = createQaGateResults({
    requestDigest,
    sourceSha256,
    analysisDigest: analysis.analysisDigest,
    privateObjectIdentityHash,
  })
  const qaDigest = sha256CanonicalJson(qaGateResults)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_synchronized_foley_objective_qa_readiness_evidence_v1',
    requestDigest,
    sourceSha256,
    qaDigest,
  })
  const samplesPerFrame = 48_000 / input.fps
  const base = {
    schemaVersion: MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_READINESS_SCHEMA_VERSION,
    evidenceId: `ms012d4-objective-qa-${evidenceObjectIdentityHash.slice(0, 32)}`,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    sourceRequestId: request.foleyRequestId,
    sourceRequestDigest: requestDigest,
    sourceSoundEventId: request.soundEvent.soundEventId,
    sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
    sourceVideoContentDigest: request.sourceVideoAssetVersion.contentDigest,
    pictureLockContentDigest: request.pictureLockContentDigest,
    timingAuthorityDigest: request.timingAuthorityDigest,
    state: 'objective_qa_profile_ready_route_closed' as const,
    createdAt,
    profile: {
      profileId: MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE,
      fps: input.fps,
      sampleRateHertz: 48_000 as const,
      channelCount: 2 as const,
      bitsPerSample: 16 as const,
      samplesPerFrame: samplesPerFrame as 2_000 | 1_600,
      alignmentToleranceFrames: 2 as const,
      minimumTransientPeakDbfs: -24 as const,
      maximumAdaptiveTransientThresholdDbfs: -6 as const,
      transientBaselineMultiplier: 4 as const,
      maximumSamplePeakDbfs: -1 as const,
      projectedFoleyMixGainDb: -20 as const,
      maximumProjectedSpeechWindowRmsDbfs: -30 as const,
      minimumSignalRmsDbfs: -60 as const,
      analysisClass: 'deterministic_private_pcm_frame_analysis' as const,
    },
    timing: {
      candidateFrameRange: { startFrame: request.range.startFrame, endFrame: request.range.endFrame },
      sourceVideoFrameRange: {
        startFrame: request.sourceFrameRange.startFrame,
        endFrame: request.sourceFrameRange.endFrame,
      },
      expectedHitFrames: timing.expectedHitFrames,
      speechFrameRanges: timing.speechFrameRanges,
    },
    syntheticFixture: {
      evidenceClass: 'synthetic_private_nonprovider_normalized_pcm_wave' as const,
      privateObjectIdentityHash,
      sha256: stored.sha256,
      byteLength: stored.byteLength,
      sampleCountPerChannel: analysis.sampleCountPerChannel,
      durationMilliseconds: analysis.durationMilliseconds,
      providerResponseReceived: false as const,
      providerRequestCount: 0 as const,
      rawProviderPayloadPersisted: false as const,
    },
    measurements: {
      durationFrames: analysis.durationFrames,
      overallRmsDbfs: analysis.overallRmsDbfs,
      samplePeakDbfs: analysis.samplePeakDbfs,
      clippingSampleCount: 0 as const,
      adaptiveTransientThresholdDbfs: analysis.adaptiveTransientThresholdDbfs,
      detectedTransientFrames: analysis.detectedTransientFrames,
      expectedHits: analysis.expectedHits,
      unplannedTransientFrames: [] as const,
      speechWindowRawRmsDbfs: analysis.speechWindowRawRmsDbfs,
      speechWindowProjectedMixRmsDbfs: analysis.speechWindowProjectedMixRmsDbfs,
      bestUsableTrim: analysis.bestUsableTrim,
      analysisDigest: analysis.analysisDigest,
    },
    qa: {
      gateResults: qaGateResults,
      objectiveQaPassed: true as const,
      semanticQaComplete: false as const,
      humanListeningComplete: false as const,
      futureAuthorizedCandidateAnalysisReady: true as const,
      actualProviderCandidateQaComplete: false as const,
      reviewEligible: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      qaDigest,
    },
    persistence: {
      privateLocalOnly: true as const,
      syntheticFixturePersisted: true as const,
      evidenceRecordPersisted: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      createOnly: true as const,
      evidenceObjectIdentityHash,
    },
    cost: {
      providerCostMicros: 0 as const,
      projectProductionAttemptCostMicros: 0 as const,
      localFixtureAccountingState: 'test_infrastructure_not_attributed_to_provider_candidate' as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      billingMutationPerformed: false as const,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCreated: false as const,
      syntheticFixtureCreated: true as const,
      executionAuthorityIssued: false as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    synchronizedFoleyRouteOpen: false as const,
    providerExecutionAllowed: false as const,
    singleUseAuthorityIssued: false as const,
    privateProviderCandidateCreated: false as const,
    automaticSelectionAllowed: false as const,
    finalMixAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }
  const evidence = parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) },
    motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema)
  await persistEvidenceRecord(input.localStorageRoot, evidence)
  return evidence
}

export function assertMotionStudioSynchronizedFoleyObjectiveQaReadiness(
  input: MotionStudioSynchronizedFoleyObjectiveQaReadinessV1,
): void {
  const parsed = motionStudioSynchronizedFoleyObjectiveQaReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.evidenceDigest
  if (
    sha256CanonicalJson(base) !== parsed.evidenceDigest ||
    sha256CanonicalJson(parsed.qa.gateResults) !== parsed.qa.qaDigest ||
    parsed.synchronizedFoleyRouteOpen || parsed.providerExecutionAllowed ||
    parsed.singleUseAuthorityIssued || parsed.privateProviderCandidateCreated ||
    parsed.qa.semanticQaComplete || parsed.qa.humanListeningComplete ||
    parsed.qa.reviewEligible || parsed.qa.selectionEligible || parsed.finalMixAllowed ||
    parsed.productReady
  ) blocked('Synchronized-Foley objective QA readiness failed its immutable fail-closed boundary.')
}

export interface MotionStudioSynchronizedFoleyValidatedTiming {
  expectedHitFrames: readonly number[]
  speechFrameRanges: readonly { startFrame: number; endFrame: number }[]
}

function parseRequest(input: MotionStudioSynchronizedFoleyCandidateRequestV1) {
  return motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse(input) as MotionStudioSynchronizedFoleyCandidateRequestV1
}

function assertProtocolOnlyRequest(request: MotionStudioSynchronizedFoleyCandidateRequestV1): void {
  if (
    request.soundEvent.role === 'exact_sfx' || request.soundEvent.reasonKind === 'exact_named_sound' ||
    request.soundEvent.timingAuthorityDigest !== request.timingAuthorityDigest ||
    request.pictureLockArtifactVersion.contentDigest !== request.pictureLockContentDigest ||
    !request.sourceVideoAssetVersion.privateAsset ||
    request.sourceVideoAssetVersion.browserDirectProviderAccessAllowed ||
    request.direction.dialogueAllowed || request.direction.narrationAllowed || request.direction.musicAllowed ||
    request.direction.exactNamedSoundAllowed || request.direction.unseenActionAllowed ||
    request.direction.factualAdditionAllowed ||
    !request.executionBoundary.protocolSimulatorOnly || request.executionBoundary.providerExecutionAllowed ||
    request.executionBoundary.externalTransportAllowed || request.executionBoundary.mediaExecutionAllowed ||
    request.cost.maximumAuthorizedProviderCostMicros !== 0 ||
    request.cost.maximumAuthorizedLocalComputeCostMicros !== 0 ||
    request.cost.maximumAuthorizedTotalInternalCostMicros !== 0 ||
    request.output.container !== 'wav' || request.output.codec !== 'pcm_s16le' ||
    request.output.sampleRateHertz !== 48_000 || request.output.channelCount !== 2
  ) blocked('Synchronized-Foley objective QA requires the exact fail-closed D0 request authority.')
}

function validateTiming(input: {
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  fps: 24 | 30
  expectedHitFrames: readonly number[]
  speechFrameRanges: readonly { startFrame: number; endFrame: number }[]
}): MotionStudioSynchronizedFoleyValidatedTiming {
  if (![24, 30].includes(input.fps)) invalid('Synchronized-Foley QA requires a 24/1 or 30/1 timebase.')
  const durationFrames = input.request.range.endFrame - input.request.range.startFrame
  const sourceDurationFrames = input.request.sourceFrameRange.endFrame - input.request.sourceFrameRange.startFrame
  if (durationFrames <= 0 || durationFrames !== sourceDurationFrames || durationFrames > input.fps * 30) {
    blocked('Synchronized-Foley candidate and source-video frame authorities must have one exact bounded duration.')
  }
  const expectedHitFrames = [...input.expectedHitFrames]
  if (
    expectedHitFrames.length === 0 || expectedHitFrames.length > 16 ||
    new Set(expectedHitFrames).size !== expectedHitFrames.length ||
    expectedHitFrames.some((frame) => !Number.isSafeInteger(frame) ||
      frame < input.request.range.startFrame || frame >= input.request.range.endFrame)
  ) invalid('Synchronized-Foley expected hit frames must be unique and inside the exact candidate range.')
  expectedHitFrames.sort((left, right) => left - right)
  const speechFrameRanges = input.speechFrameRanges.map((range) => ({ ...range }))
  if (speechFrameRanges.length > 32) {
    invalid('Synchronized-Foley QA supports at most 32 speech-protection ranges.')
  }
  for (const range of speechFrameRanges) {
    if (
      !Number.isSafeInteger(range.startFrame) || !Number.isSafeInteger(range.endFrame) ||
      range.startFrame < input.request.range.startFrame || range.endFrame > input.request.range.endFrame ||
      range.endFrame <= range.startFrame
    ) invalid('Synchronized-Foley speech ranges must be ordered inside the exact candidate range.')
  }
  speechFrameRanges.sort((left, right) => left.startFrame - right.startFrame)
  for (let index = 1; index < speechFrameRanges.length; index += 1) {
    if (speechFrameRanges[index]!.startFrame < speechFrameRanges[index - 1]!.endFrame) {
      invalid('Synchronized-Foley speech ranges must not overlap.')
    }
  }
  if (
    input.request.direction.speechSafety === 'avoid_speech_overlap' &&
    expectedHitFrames.some((frame) => speechFrameRanges.some((range) => frame >= range.startFrame && frame < range.endFrame))
  ) blocked('Synchronized-Foley avoid-speech authority cannot place an expected hit inside speech.')
  return { expectedHitFrames, speechFrameRanges }
}

function analyzeObjectiveFoley(input: {
  bytes: Buffer
  request: MotionStudioSynchronizedFoleyCandidateRequestV1
  timing: MotionStudioSynchronizedFoleyValidatedTiming
  fps: 24 | 30
}) {
  const wave = parseMotionStudioPcmWave(input.bytes)
  if (wave.channelCount !== 2) blocked('Synchronized-Foley objective QA requires normalized stereo PCM.')
  const samplesPerFrame = 48_000 / input.fps
  const durationFrames = input.request.range.endFrame - input.request.range.startFrame
  const expectedSampleCount = durationFrames * samplesPerFrame
  if (wave.sampleCountPerChannel !== expectedSampleCount) {
    blocked('Synchronized-Foley PCM duration does not equal the exact frame authority.')
  }

  const overall = sampleMetrics(wave.interleavedSamples)
  if (overall.rmsDbfs < -60) blocked('Synchronized-Foley objective fixture is effectively silent.')
  if (overall.peakDbfs > -1 || overall.clippingSampleCount > 0) {
    blocked('Synchronized-Foley objective fixture exceeds the fixed sample-peak or clipping limit.')
  }
  const frameStats = Array.from({ length: durationFrames }, (_, frame) => {
    const start = frame * samplesPerFrame * wave.channelCount
    const end = start + samplesPerFrame * wave.channelCount
    const metrics = sampleMetrics(wave.interleavedSamples.subarray(start, end))
    return { frame, rmsDbfs: metrics.rmsDbfs, peakDbfs: metrics.peakDbfs }
  })
  const baselineLinear = median(frameStats.map((entry) => dbToLinear(entry.rmsDbfs)))
  const adaptiveThresholdLinear = Math.min(
    dbToLinear(-6),
    Math.max(dbToLinear(-24), baselineLinear * 4),
  )
  const adaptiveTransientThresholdDbfs = rounded(linearToDb(adaptiveThresholdLinear))
  const activeFrames = frameStats.filter((entry) => dbToLinear(entry.peakDbfs) >= adaptiveThresholdLinear)
  const detectedTransientFrames = groupTransientFrames(activeFrames)
  if (detectedTransientFrames.length === 0) {
    blocked('Synchronized-Foley objective QA found no usable transient.')
  }

  const expectedHits = input.timing.expectedHitFrames.map((expectedAbsoluteFrame) => {
    const expectedRelativeFrame = expectedAbsoluteFrame - input.request.range.startFrame
    const detectedRelativeFrame = nearestFrame(detectedTransientFrames, expectedRelativeFrame)
    const offsetFrames = detectedRelativeFrame - expectedRelativeFrame
    if (Math.abs(offsetFrames) > 2) {
      blocked('Synchronized-Foley transient falls outside the fixed frame-alignment tolerance.')
    }
    return {
      expectedAbsoluteFrame,
      expectedRelativeFrame,
      detectedRelativeFrame,
      offsetFrames,
      alignmentPassed: true as const,
    }
  })
  const unplannedTransientFrames = detectedTransientFrames.filter((detectedFrame) =>
    !expectedHits.some((hit) => Math.abs(detectedFrame - hit.expectedRelativeFrame) <= 2))

  const speechSamples = collectRangeSamples({
    samples: wave.interleavedSamples,
    channelCount: wave.channelCount,
    samplesPerFrame,
    candidateStartFrame: input.request.range.startFrame,
    ranges: input.timing.speechFrameRanges,
  })
  const speechWindowRawRmsDbfs = speechSamples.length > 0 ? sampleMetrics(speechSamples).rmsDbfs : null
  const projectedFoleyMixGainDb = rounded(linearToDb(MOTION_STUDIO_AUDIO_MIX_PROFILE.gains.foley))
  if (projectedFoleyMixGainDb !== -20) {
    blocked('Synchronized-Foley objective QA no longer matches the accepted speech-safe mix gain.')
  }
  const speechWindowProjectedMixRmsDbfs = speechWindowRawRmsDbfs === null
    ? null
    : rounded(speechWindowRawRmsDbfs + projectedFoleyMixGainDb)
  if (speechWindowProjectedMixRmsDbfs !== null && speechWindowProjectedMixRmsDbfs > -30) {
    blocked('Synchronized-Foley projected mix energy inside the approved speech window exceeds the fixed safety threshold.')
  }
  if (unplannedTransientFrames.length > 0) {
    blocked('Synchronized-Foley objective QA found an unplanned transient outside every expected event window.')
  }

  const firstHit = expectedHits[0]!
  const lastHit = expectedHits[expectedHits.length - 1]!
  const placementCorrectionFrames = firstHit.offsetFrames
  if (expectedHits.some((hit) => Math.abs(hit.offsetFrames - placementCorrectionFrames) > 2)) {
    blocked('Synchronized-Foley transients cannot share one deterministic placement correction.')
  }
  const candidateStartFrame = Math.max(
    0,
    firstHit.detectedRelativeFrame - 4,
    firstHit.detectedRelativeFrame - firstHit.expectedRelativeFrame,
  )
  const hitOffsetInsideTrimFrames = firstHit.detectedRelativeFrame - candidateStartFrame
  const timelineStartFrame = firstHit.expectedAbsoluteFrame - hitOffsetInsideTrimFrames
  const maximumCandidateEndFrame = candidateStartFrame + input.request.range.endFrame - timelineStartFrame
  const candidateEndFrame = Math.min(
    durationFrames,
    lastHit.detectedRelativeFrame + 9,
    maximumCandidateEndFrame,
  )
  if (candidateEndFrame - lastHit.detectedRelativeFrame < 2) {
    blocked('Synchronized-Foley aligned trim cannot preserve the fixed two-frame tail and fade authority.')
  }
  const bestUsableTrim = {
    candidateStartFrame,
    candidateHitFrame: firstHit.detectedRelativeFrame,
    candidateEndFrame,
    hitOffsetInsideTrimFrames,
    placementCorrectionFrames,
    fadeInFrames: 1 as const,
    fadeOutFrames: 2 as const,
    timelineStartFrame,
    timelineHitFrame: firstHit.expectedAbsoluteFrame,
    timelineEndFrame: timelineStartFrame + candidateEndFrame - candidateStartFrame,
  }
  const analysisBase = {
    sampleCountPerChannel: wave.sampleCountPerChannel,
    durationMilliseconds: wave.durationMilliseconds,
    durationFrames,
    overallRmsDbfs: overall.rmsDbfs,
    samplePeakDbfs: overall.peakDbfs,
    clippingSampleCount: overall.clippingSampleCount,
    adaptiveTransientThresholdDbfs,
    detectedTransientFrames,
    expectedHits,
    unplannedTransientFrames,
    speechWindowRawRmsDbfs,
    speechWindowProjectedMixRmsDbfs,
    bestUsableTrim,
  }
  return { ...analysisBase, analysisDigest: sha256CanonicalJson(analysisBase) }
}

function createQaGateResults(input: {
  requestDigest: string
  sourceSha256: string
  analysisDigest: string
  privateObjectIdentityHash: string
}): MotionStudioSynchronizedFoleyObjectiveQaReadinessV1['qa']['gateResults'] {
  return [
    ...OBJECTIVE_GATES.map((gate) => ({
      gate,
      result: 'passed' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input, result: 'passed' }),
      note: gate === 'deterministic_replay'
        ? 'The same private PCM bytes produced the same frame-analysis digest on replay.'
        : 'The synthetic private fixture passed this objective synchronized-Foley gate.',
    })),
    ...SEMANTIC_AND_HUMAN_GATES.map((gate) => ({
      gate,
      result: 'not_evaluated' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input, result: 'not_evaluated' }),
      note: 'Requires an actual authorized private candidate plus visual, semantic, and human listening review.',
    })),
  ]
}

function sampleMetrics(samples: Int16Array): {
  rmsDbfs: number
  peakDbfs: number
  clippingSampleCount: number
} {
  if (samples.length === 0) return { rmsDbfs: -120, peakDbfs: -120, clippingSampleCount: 0 }
  let sumSquares = 0
  let peak = 0
  let clippingSampleCount = 0
  for (const sample of samples) {
    const magnitude = Math.abs(sample)
    const linear = magnitude / 32_768
    sumSquares += linear * linear
    peak = Math.max(peak, linear)
    if (magnitude >= 32_767) clippingSampleCount += 1
  }
  return {
    rmsDbfs: rounded(linearToDb(Math.sqrt(sumSquares / samples.length))),
    peakDbfs: rounded(linearToDb(peak)),
    clippingSampleCount,
  }
}

function groupTransientFrames(activeFrames: readonly { frame: number; peakDbfs: number }[]): number[] {
  const groups: { frame: number; peakDbfs: number }[][] = []
  for (const entry of activeFrames) {
    const current = groups[groups.length - 1]
    if (!current || entry.frame > current[current.length - 1]!.frame + 1) groups.push([entry])
    else current.push(entry)
  }
  return groups.map((group) => [...group].sort((left, right) => right.peakDbfs - left.peakDbfs)[0]!.frame)
}

function collectRangeSamples(input: {
  samples: Int16Array
  channelCount: 1 | 2
  samplesPerFrame: number
  candidateStartFrame: number
  ranges: readonly { startFrame: number; endFrame: number }[]
}): Int16Array {
  const sampleArrays = input.ranges.map((range) => {
    const relativeStart = range.startFrame - input.candidateStartFrame
    const relativeEnd = range.endFrame - input.candidateStartFrame
    return input.samples.subarray(
      relativeStart * input.samplesPerFrame * input.channelCount,
      relativeEnd * input.samplesPerFrame * input.channelCount,
    )
  })
  const length = sampleArrays.reduce((total, samples) => total + samples.length, 0)
  const combined = new Int16Array(length)
  let offset = 0
  for (const samples of sampleArrays) {
    combined.set(samples, offset)
    offset += samples.length
  }
  return combined
}

function nearestFrame(frames: readonly number[], target: number): number {
  return [...frames].sort((left, right) => Math.abs(left - target) - Math.abs(right - target))[0]!
}

async function persistEvidenceRecord(
  localStorageRoot: string,
  evidence: MotionStudioSynchronizedFoleyObjectiveQaReadinessV1,
): Promise<void> {
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const identity = evidence.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/synchronized-foley-objective-qa-readiness/${identity.slice(0, 2)}/${identity}.json`
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: localStorageRoot, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Synchronized-Foley objective QA evidence changed after create-only persistence.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Synchronized-Foley objective QA time must be canonical ISO-8601.')
  }
  return value
}
function median(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right)
  const middle = Math.floor(ordered.length / 2)
  return ordered.length % 2 === 0
    ? (ordered[middle - 1]! + ordered[middle]!) / 2
    : ordered[middle]!
}
function dbToLinear(value: number): number { return 10 ** (value / 20) }
function linearToDb(value: number): number { return 20 * Math.log10(Math.max(value, Number.EPSILON)) }
function rounded(value: number): number { return Number(value.toFixed(9)) }
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function parseAndFreeze<T>(value: unknown, schema: z.ZodType<T>): T { return deepFreeze(schema.parse(value)) }
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
function invalid(message: string): never { throw new ApiError('VALIDATION_FAILED', message, 400) }
function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_synchronized_foley_objective_qa_readiness',
  })
}
