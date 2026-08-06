import type {
  MotionStudioGeneratedMusicCandidateRequestV1,
  MotionStudioGeneratedMusicCapabilityField,
  MotionStudioGeneratedMusicCapabilitySnapshotV1,
  MotionStudioMusicFoleyCapabilitySupport,
  MotionStudioSynchronizedFoleyCandidateRequestV1,
  MotionStudioSynchronizedFoleyCapabilityField,
  MotionStudioSynchronizedFoleyCapabilitySnapshotV1,
  MotionStudioVersionReference,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS,
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS,
  motionStudioGeneratedMusicCandidateRequestV1Schema,
  motionStudioGeneratedMusicCapabilitySnapshotV1Schema,
  motionStudioSynchronizedFoleyCandidateRequestV1Schema,
  motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'

export interface MotionStudioMusicFoleyProtocolFixtureInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  createdAt: string
}

export interface MotionStudioMusicFoleyProtocolFixture {
  musicCapabilitySnapshot: MotionStudioGeneratedMusicCapabilitySnapshotV1
  musicRequest: MotionStudioGeneratedMusicCandidateRequestV1
  foleyCapabilitySnapshot: MotionStudioSynchronizedFoleyCapabilitySnapshotV1
  foleyRequest: MotionStudioSynchronizedFoleyCandidateRequestV1
}

export function createMotionStudioMusicFoleyProtocolFixture(
  input: MotionStudioMusicFoleyProtocolFixtureInput,
): MotionStudioMusicFoleyProtocolFixture {
  const scope = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
  }
  const id = (label: string) => deterministicId(input.approvedSnapshotDigest, label)
  const version = (label: string): MotionStudioVersionReference => ({
    artifactId: id(`${label}:artifact`),
    versionId: id(`${label}:version`),
    versionNumber: 1,
    contentDigest: sha256CanonicalJson({ scope, label, version: 1 }),
  })
  const createdAt = new Date(input.createdAt).toISOString()
  const musicCapabilityBase = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-capability-snapshot.v1' as const,
    capabilitySnapshotId: id('music-capability-snapshot'),
    intent: 'generated_music_candidate' as const,
    configuredRouteId: 'lyria_3_pro' as const,
    discoveryKind: 'protocol_fixture' as const,
    providerIdentityStatus: 'unverified_protocol_fixture' as const,
    lifecycleStatus: 'protocol_fixture_only' as const,
    discoveryAuthorityDigests: [],
    evidenceSourceCodes: ['ms_012d0_music_protocol_fixture'],
    fields: MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS.map((field) => ({
      field,
      support: musicProtocolSupport(field),
      evidenceCode: `protocol_music_${field}_${musicProtocolSupport(field)}`,
    })),
    capturedAt: createdAt,
    externalDiscoveryPerformed: false,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  const musicCapabilitySnapshot = motionStudioGeneratedMusicCapabilitySnapshotV1Schema.parse({
    ...musicCapabilityBase,
    evidenceDigest: sha256CanonicalJson(musicCapabilityBase),
  }) as MotionStudioGeneratedMusicCapabilitySnapshotV1
  const foleyCapabilityBase = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-capability-snapshot.v1' as const,
    capabilitySnapshotId: id('foley-capability-snapshot'),
    intent: 'synchronized_foley_candidate' as const,
    configuredRouteId: 'mmaudio' as const,
    discoveryKind: 'protocol_fixture' as const,
    providerIdentityStatus: 'unverified_protocol_fixture' as const,
    lifecycleStatus: 'protocol_fixture_only' as const,
    discoveryAuthorityDigests: [],
    evidenceSourceCodes: ['ms_012d0_foley_protocol_fixture'],
    fields: MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS.map((field) => ({
      field,
      support: foleyProtocolSupport(field),
      evidenceCode: `protocol_foley_${field}_${foleyProtocolSupport(field)}`,
    })),
    capturedAt: createdAt,
    externalDiscoveryPerformed: false,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  const foleyCapabilitySnapshot = motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema.parse({
    ...foleyCapabilityBase,
    evidenceDigest: sha256CanonicalJson(foleyCapabilityBase),
  }) as MotionStudioSynchronizedFoleyCapabilitySnapshotV1

  const musicBibleArtifactVersion = version('music-bible')
  const pictureLockArtifactVersion = version('picture-lock')
  const musicRange = {
    startTimingAnchorId: id('music-start-anchor'),
    endTimingAnchorId: id('music-end-anchor'),
    startFrame: 48,
    endFrame: 288,
  }
  const musicCue = {
    ...scope,
    schemaVersion: 'motion-studio.music-cue.v2' as const,
    cueId: id('music-cue'),
    musicBibleArtifactVersion,
    stemId: id('music-protocol-stem'),
    sceneIds: [id('music-scene')],
    timingAuthorityDigest: sha256CanonicalJson({ scope, authority: 'fixture-timing-v1' }),
    range: musicRange,
    narrativePurpose: 'Build restrained tension while preserving narration clarity.',
    emotionalDirection: 'Measured documentary tension with a clean resolve.',
    speechOverlapPolicy: 'duck_below_narration' as const,
    immutable: true as const,
  }
  const commonApproval = {
    approvedSnapshotId: input.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedSnapshotDigest,
    approvedPlanReviewId: id('approved-plan-review'),
    approvedCreditEstimateId: id('approved-credit-estimate'),
    activeNoncommercialTestReservationId: id('active-test-reservation'),
    approvalLocked: true as const,
    commercialMutationAllowed: false as const,
  }
  const commonCost = {
    costBudgetId: id('protocol-cost-budget'),
    rateCardVersionId: id('protocol-zero-rate-card'),
    rateCardDigest: sha256CanonicalJson({ scope, rate: 'protocol-zero' }),
    maximumAuthorizedProviderCostMicros: 0 as const,
    maximumAuthorizedLocalComputeCostMicros: 0 as const,
    maximumAuthorizedTotalInternalCostMicros: 0 as const,
    currency: 'USD' as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    customerBillingAllowed: false as const,
  }
  const commonAttemptPolicy = {
    maximumSubmissions: 1 as const,
    maximumCandidates: 1 as const,
    automaticRetry: false as const,
    automaticFallback: false as const,
    automaticVariantGeneration: false as const,
  }
  const executionBoundary = {
    protocolSimulatorOnly: true as const,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    providerSubmissionMaximum: 0 as const,
    statusRequestMaximum: 0 as const,
    downloadRequestMaximum: 0 as const,
    mediaExecutionAllowed: false as const,
    privateIngestExecutionAllowed: false as const,
    humanReviewPerformed: false as const,
    selectionAllowed: false as const,
    finalMixAllowed: false as const,
    timelineMutationAllowed: false as const,
    renderAllowed: false as const,
    exportAllowed: false as const,
    productReady: false as const,
  }
  const musicRequest = motionStudioGeneratedMusicCandidateRequestV1Schema.parse({
    ...scope,
    schemaVersion: 'motion-studio.generated-music-candidate-request.v1',
    intent: 'generated_music_candidate',
    musicRequestId: id('music-request'),
    approval: commonApproval,
    work: {
      approvedWorkItemId: id('music-work-item'),
      jobId: id('music-job'),
      attemptId: id('music-attempt'),
      leaseId: id('music-lease'),
      idempotencyKeyHash: sha256CanonicalJson({ scope, operation: 'music-protocol-fixture' }),
    },
    cost: { ...commonCost, costBudgetId: id('music-cost-budget') },
    musicBibleArtifactVersion,
    musicBibleContentDigest: musicBibleArtifactVersion.contentDigest,
    cue: musicCue,
    pictureLockArtifactVersion,
    pictureLockContentDigest: pictureLockArtifactVersion.contentDigest,
    timingAuthorityDigest: musicCue.timingAuthorityDigest,
    range: musicRange,
    direction: {
      narrativePurpose: musicCue.narrativePurpose,
      emotionalDirection: musicCue.emotionalDirection,
      mood: ['restrained', 'serious'],
      instrumentation: ['soft low strings', 'subtle pulse', 'warm restrained texture'],
      energyArc: ['minimal opening', 'measured build', 'clean resolve'],
      endingBehavior: 'clean_resolve',
      speechSafety: musicCue.speechOverlapPolicy,
      doNotCopy: ['No artist imitation', 'No song imitation', 'No melody copying', 'No reference continuation'],
      instrumentalOnly: true,
      vocalsAllowed: false,
      lyricsAllowed: false,
      artistImitationAllowed: false,
      songImitationAllowed: false,
      melodyCopyingAllowed: false,
      referenceAudioContinuationAllowed: false,
    },
    rightsEvidenceIds: [id('music-rights-evidence')],
    capabilitySnapshotId: musicCapabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: musicCapabilitySnapshot.evidenceDigest,
    configuredRouteId: 'lyria_3_pro',
    output: { container: 'wav', codec: 'pcm_s16le', sampleRateHertz: 48_000, channelCount: 2 },
    attemptPolicy: commonAttemptPolicy,
    executionBoundary,
    immutable: true,
  }) as MotionStudioGeneratedMusicCandidateRequestV1

  const foleyRange = {
    startTimingAnchorId: id('foley-start-anchor'),
    endTimingAnchorId: id('foley-end-anchor'),
    startFrame: 312,
    endFrame: 384,
  }
  const soundEvent = {
    ...scope,
    schemaVersion: 'motion-studio.sound-event.v1' as const,
    soundEventId: id('foley-event'),
    role: 'foley' as const,
    stemId: id('foley-protocol-stem'),
    sceneId: id('foley-scene'),
    timingAuthorityDigest: musicCue.timingAuthorityDigest,
    range: foleyRange,
    reasonKind: 'visible_action' as const,
    reason: 'A paper map is unfolded visibly on the table.',
    sourceEventId: id('visible-map-unfold-event'),
    speechOverlapPolicy: 'duck_below_narration' as const,
    immutable: true as const,
  }
  const foleyRequest = motionStudioSynchronizedFoleyCandidateRequestV1Schema.parse({
    ...scope,
    schemaVersion: 'motion-studio.synchronized-foley-candidate-request.v1',
    intent: 'synchronized_foley_candidate',
    foleyRequestId: id('foley-request'),
    approval: commonApproval,
    work: {
      approvedWorkItemId: id('foley-work-item'),
      jobId: id('foley-job'),
      attemptId: id('foley-attempt'),
      leaseId: id('foley-lease'),
      idempotencyKeyHash: sha256CanonicalJson({ scope, operation: 'foley-protocol-fixture' }),
    },
    cost: { ...commonCost, costBudgetId: id('foley-cost-budget') },
    soundEvent,
    sourceVideoAssetVersion: {
      assetId: id('source-video'),
      assetVersionId: id('source-video-version'),
      contentDigest: sha256CanonicalJson({ scope, fixture: 'private-source-video' }),
      provenanceRecordId: id('source-video-provenance'),
      rightsEvidenceIds: [id('source-video-rights')],
      mimeType: 'video/mp4',
      privateAsset: true,
      browserDirectProviderAccessAllowed: false,
    },
    sourceFrameRange: {
      startTimingAnchorId: id('source-video-start-anchor'),
      endTimingAnchorId: id('source-video-end-anchor'),
      startFrame: 120,
      endFrame: 192,
    },
    pictureLockArtifactVersion,
    pictureLockContentDigest: pictureLockArtifactVersion.contentDigest,
    timingAuthorityDigest: soundEvent.timingAuthorityDigest,
    range: foleyRange,
    direction: {
      expectedAudibleEvents: ['restrained paper movement synchronized to the visible unfold'],
      environment: 'quiet interior planning room',
      texture: 'natural paper movement with a short clean tail',
      intensity: 'restrained',
      speechSafety: soundEvent.speechOverlapPolicy,
      doNotInvent: ['No unseen action', 'No dialogue or narration', 'No music or exact named sound'],
      dialogueAllowed: false,
      narrationAllowed: false,
      musicAllowed: false,
      exactNamedSoundAllowed: false,
      unseenActionAllowed: false,
      factualAdditionAllowed: false,
    },
    capabilitySnapshotId: foleyCapabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: foleyCapabilitySnapshot.evidenceDigest,
    configuredRouteId: 'mmaudio',
    output: { container: 'wav', codec: 'pcm_s16le', sampleRateHertz: 48_000, channelCount: 2 },
    attemptPolicy: commonAttemptPolicy,
    executionBoundary,
    immutable: true,
  }) as MotionStudioSynchronizedFoleyCandidateRequestV1

  return { musicCapabilitySnapshot, musicRequest, foleyCapabilitySnapshot, foleyRequest }
}

function musicProtocolSupport(
  field: MotionStudioGeneratedMusicCapabilityField,
): MotionStudioMusicFoleyCapabilitySupport {
  return [
    'text_prompt', 'negative_instructions', 'instrumental_only',
    'duration_control', 'wav_output',
  ].includes(field) ? 'supported' : 'unknown'
}

function foleyProtocolSupport(
  field: MotionStudioSynchronizedFoleyCapabilityField,
): MotionStudioMusicFoleyCapabilitySupport {
  return [
    'video_conditioning', 'text_prompt', 'visible_event_grounding',
    'dialogue_suppression', 'music_suppression', 'exact_sound_suppression',
    'duration_control', 'wav_output',
  ].includes(field) ? 'supported' : 'unknown'
}

function deterministicId(inputDigest: string, label: string): string {
  const hex = sha256CanonicalJson({ inputDigest, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
