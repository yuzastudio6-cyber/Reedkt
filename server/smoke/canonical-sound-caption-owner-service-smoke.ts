import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCaptionSoundSupportBundle,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from '../captions-specialist/caption-sound-support'
import {
  runCanonicalSoundController,
} from '../sound/sound-controller'
import {
  canonicalSoundRequestSchema,
  canonicalSoundResultSchema,
  type SoundArtifactRef,
} from '../sound/sound-contracts'
import { hashSkillValue } from
  '../edit-skills/core/skill-capability-manifest-hash'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalSoundCaptionExecutionReadPort,
  createCanonicalSoundCaptionListeningReviewReadPort,
  createCanonicalSoundCaptionOwnerService,
} from '../services/canonical-sound-caption-owner-service'
import {
  CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION,
  completeCanonicalSoundCaptionListeningReview,
  createCanonicalSoundCaptionListeningPlaybackDerivation,
  createCanonicalSoundCaptionListeningReviewerSubmission,
  createCanonicalSoundCaptionListeningReviewRepository,
} from '../services/canonical-sound-caption-listening-review-completion'
import {
  buildSoundRequest,
} from './sound-test-fixtures'
import {
  CAP_11_APPROVAL_ENVELOPE_REF,
  CAP_11_SCENE_GRAPH_FIXTURE,
} from './captions-specialist-cap-11-smoke'
import {
  CAP_12_MOTION_LOCK_FIXTURE,
  CAP_12_MOTION_PLAN_FIXTURE,
  CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
} from './captions-specialist-cap-12-smoke'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}
async function reject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  checks += 1
}
function sha(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

const root = await mkdtemp(join(tmpdir(), 'caption-sound-owner-smoke-'))
try {
  const context: CaptionSoundContext = {
    sceneGraph: CAP_11_SCENE_GRAPH_FIXTURE,
    motionPlan: CAP_12_MOTION_PLAN_FIXTURE,
    motionLock: CAP_12_MOTION_LOCK_FIXTURE,
    storyTimingResolution: CAP_12_STORYTIMING_RESOLUTION_FIXTURE,
    approvedCaptionEnvelopeRef: CAP_11_APPROVAL_ENVELOPE_REF,
  }
  const requestId = 'caption.sound.owner.smoke'
  const callRef = {
    id: 'caption.sound.owner.call',
    version: 'orchestra-skill-call-v1',
    contentHash: sha('caption.sound.owner.call'),
  }
  const bundle = createCaptionSoundSupportBundle({
    requestId,
    idempotencyKey: 'caption.sound.owner.idempotency',
    originalCallRef: callRef,
    context,
    dialogueTrackRef: ref('dialogue.track', 'canonical-dialogue-track-v1'),
    dialogueActivityRef: ref(
      'dialogue.activity', 'canonical-dialogue-activity-v1'),
    maximumRequestedCueCount: 4,
  })
  const caption = bundle.payload
  assert.ok(caption.canonicalScope.approvedSnapshotRef)
  assert.ok(caption.canonicalScope.sceneId)
  const requestedIntents = caption.cueIntents.filter((intent) =>
    intent.decision === 'request_cue'
    && intent.eligibility !== 'sound_forbidden')
  assert.ok(requestedIntents.length > 0)
  const ranges = caption.canonicalScope.authorizedFrameRanges.map(
    (range, index) => ({
      rangeId: `caption-range-${index + 1}`,
      startFrame: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
    }))
  const rawRequest = buildSoundRequest({
    job: 'support_motion_design_sound',
    callerType: 'typed_peer_skill',
    mode: 'private_internal',
    audioRanges: ranges,
    callerOwnedAudioRanges: ranges,
    eventFrames: requestedIntents.map((_, index) =>
      ranges[0]!.startFrame + 4 + index * 8),
    inspectWholeVideo: false,
  })
  rawRequest.requestId = 'canonical.sound.caption.owner.smoke'
  rawRequest.callerSkillKey = 'captions'
  rawRequest.idempotencyKey = caption.idempotencyKey
  rawRequest.assignmentScope.sceneIds = [caption.canonicalScope.sceneId]
  rawRequest.assignmentScope.inspectRanges = ranges
  rawRequest.timelineManifestHash = caption.masterTimingRef.contentHash
  rawRequest.timelineManifestRef = {
    ...rawRequest.timelineManifestRef,
    checksumSha256: caption.masterTimingRef.contentHash,
  }
  rawRequest.visualDependencies = rawRequest.visualDependencies.map(
    (dependency) => ({
      ...dependency,
      timingManifestHash: caption.masterTimingRef.contentHash,
    }))
  rawRequest.assignmentScope.sourceArtifactVersions =
    rawRequest.assignmentScope.sourceArtifactVersions.map((artifact) =>
      artifact.artifactId === rawRequest.timelineManifestRef.artifactId
        ? { ...artifact, checksumSha256: caption.masterTimingRef.contentHash }
        : artifact)
  rawRequest.assignmentScope.sourceTimelineHash =
    caption.masterTimingRef.contentHash
  rawRequest.executionAuthority.approvedPlanSnapshotId =
    caption.canonicalScope.approvedSnapshotRef.id
  rawRequest.executionAuthority.approvedPlanSnapshotHash =
    caption.canonicalScope.approvedSnapshotRef.contentHash
  rawRequest.eventAnchors = requestedIntents.map((intent, index) => ({
    ...rawRequest.eventAnchors[index]!,
    anchorId: intent.storyTimingEventRef.id,
    frame: ranges[0]!.startFrame + 4 + index * 8,
    endFrameExclusive: ranges[0]!.startFrame + 10 + index * 8,
    sceneId: caption.canonicalScope.sceneId!,
  }))
  const canonicalRequest = canonicalSoundRequestSchema.parse(rawRequest)
  const planned = runCanonicalSoundController(canonicalRequest, {
    protectedSpeechRanges: ranges,
    sourceMatches: canonicalRequest.eventAnchors.map((event) => ({
      anchorId: event.anchorId,
      artifact: canonicalRequest.sourceAudioRefs[0]!,
      usable: true,
      requiresRepair: false,
    })),
  }).result
  const finalBytes = Buffer.from('canonical private sound fixture bytes')
  const finalPath = join(root, 'final-sound.wav')
  await writeFile(finalPath, finalBytes, { mode: 0o600 })
  const finalArtifact: SoundArtifactRef = {
    artifactId: 'canonical.sound.final.fixture',
    artifactType: 'private_sound_stem',
    version: 1,
    checksumSha256: sha(finalBytes),
    storageObjectId: 'private:caption-sound-owner:final:v1',
    private: true,
    contentType: 'audio/wav',
    durationFrames: ranges[0]!.endFrameExclusive - ranges[0]!.startFrame,
    timelineRate: canonicalRequest.timelineRate,
  }
  const placements = planned.cueManifest.cues.map((cue, index) => {
    const core = {
      placementId: `sound.placement.${index + 1}`,
      cueId: cue.cueId,
      sourceArtifactId: finalArtifact.artifactId,
      requestedEventFrame: cue.hitFrame!,
      detectedTransientFrame: cue.hitFrame!,
      appliedOffsetFrames: 0,
      resultingTransientFrame: cue.hitFrame!,
      residualErrorFrames: 0,
      timelineRate: canonicalRequest.timelineRate,
    }
    return { ...core, placementManifestHash: hashSkillValue(core) }
  })
  const pass = (key: string) => ({
    key,
    disposition: 'pass',
    summary: `${key} passed.`,
    evidence: {},
  })
  const qaCore = {
    schemaVersion: 'canonical-sound-execution-qa-v1',
    reportId: 'canonical.sound.qa.caption.owner.smoke',
    planningQa: [pass('planning.authority')],
    technicalOutputQa: [pass('technical.decode')],
    synchronizationQa: planned.cueManifest.cues.map((cue) =>
      pass(`sync.${cue.cueId}`)),
    mixQa: [pass('mix.measured_ducking.fixture')],
    continuityQa: [pass('continuity.whole_video')],
    perceptualMaterialQa: [{
      key: 'perceptual.material_realism',
      disposition: 'needs_review',
      summary: 'Independent listening review required.',
      evidence: { automatedClaim: false },
    }],
    provenanceQa: [pass('provenance.private_lineage')],
    integrationQa: [pass('integration.authority')],
    status: 'needs_review',
  }
  const qaReport = { ...qaCore, evidenceHash: hashSkillValue(qaCore) }
  const handoff = {
    handoffId: 'canonical.sound.handoff.caption.owner.smoke',
    soundArtifactIds: [finalArtifact.artifactId],
    finalSoundArtifactReferences: [finalArtifact],
    intentionalNoSound: false,
    authorizedRanges: ranges,
    cueManifestId: planned.cueManifest.cueManifestId,
    mixManifestId: planned.mixAutomationManifest.mixManifestId,
    qaEvidenceHash: qaReport.evidenceHash,
    timelineManifestHash: caption.masterTimingRef.contentHash,
    timelineRate: canonicalRequest.timelineRate,
    finalRenderOwnedBySound: false,
  }
  const canonicalResult = canonicalSoundResultSchema.parse({
    ...planned,
    qualificationStatusUsed: 'internal_execution_qualified',
    status: 'completed',
    qaReport,
    synchronizationPlacements: placements,
    selectedAssetVersions: [finalArtifact],
    privateSoundStemArtifacts: [finalArtifact],
    modifiedAudioRanges: ranges,
    sourceTimingHash: caption.masterTimingRef.contentHash,
    workerStatus: 'completed',
    artifactStatus: 'private_ready',
    qaStatus: 'warning',
    actualExecutionEvidence: {
      routeExecutionId: 'canonical.sound.execution.caption.owner.smoke',
      elapsedMilliseconds: 1,
      actualCreditsCharged: 0,
      actualLocalInfrastructureCostUsd: 0,
      toolRuntimeEvidenceIds: ['sound.runtime.fixture'],
      outputArtifactHashes: [finalArtifact.checksumSha256],
      stepOutputBundles: [],
      stepEvidence: [],
    },
    finalCompositionHandoff: handoff,
  })
  const canonicalRequestRef = ref(
    canonicalRequest.requestId,
    canonicalRequest.schemaVersion,
    contractDigest(canonicalRequest),
  )
  const canonicalResultRef = ref(
    `sound.result.${canonicalResult.requestId}`,
    canonicalResult.schemaVersion,
    contractDigest(canonicalResult),
  )
  const captionRequestRef = ref(
    caption.requestId, caption.schemaVersion, caption.requestDigestSha256)
  const finalMixArtifactRef = ref(
    finalArtifact.artifactId,
    `${finalArtifact.artifactType}.v${finalArtifact.version}`,
    finalArtifact.checksumSha256,
  )
  const inspectionPackageRef = ref(
    'caption.sound.private-runtime.inspection.smoke',
    CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION,
    sha('caption.sound.private-runtime.inspection.smoke'),
  )
  const reviewerSubmission =
    createCanonicalSoundCaptionListeningReviewerSubmission({
      schemaVersion:
        'canonical-sound-caption-listening-reviewer-submission-v1',
      submissionId: 'canonical.sound.listening.submission.caption.owner.smoke',
      inspectionPackageRef,
      captionSoundRequestRef: captionRequestRef,
      canonicalSoundRequestRef: canonicalRequestRef,
      canonicalSoundResultRef: canonicalResultRef,
      finalMixArtifactRefs: [finalMixArtifactRef],
      playbackArtifactRef: finalMixArtifactRef,
      playbackDerivationReceiptRef: null,
      reviewerClass: 'direct_private_human',
      disposition: 'accepted',
      completePlaybackCount: 1,
      actualAudioPlaybackCompleted: true,
      everyRequestedRangeReviewed: true,
      voiceClarityPassed: true,
      noCueMasksDialogue: true,
      cueTimingAndRestraintPassed: true,
      noUnexpectedAudioDefectsPassed: true,
      observationCodes: [
        'complete_time_coverage',
        'voice_clarity',
        'dialogue_masking',
        'cue_timing_and_restraint',
        'unexpected_audio_defects',
      ],
      warningCodes: [],
      reviewedAt: '2026-08-05T20:00:00.000Z',
      independentFromSoundExecutionRuntime: true,
      sourceBytesIncluded: false,
      mediaLocatorIncluded: false,
      rawChatIncluded: false,
      providerCallMade: false,
      runtimeAuthorityGrantedToCaption: false,
      assetAuthorityGrantedToCaption: false,
      mixAuthorityGrantedToCaption: false,
      costOrBillingAuthorityGrantedToCaption: false,
      finalQaApprovalGrantedToCaption: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    })
  const listeningRecord = completeCanonicalSoundCaptionListeningReview({
    inspectionPackageRef,
    captionSoundRequest: caption,
    canonicalSoundRequest: jsonClone(canonicalRequest),
    canonicalSoundResult: jsonClone(canonicalResult),
    reviewerSubmission,
  })
  const listeningReview = listeningRecord.listeningReview
  check(listeningReview.schemaVersion
    === 'canonical-sound-caption-listening-review-v1'
    && listeningRecord.completionReceipt
      .independentReviewProjectedIntoCanonicalSoundOwner,
  'The independent reviewer submission must project into the existing Sound owner review.')
  const values = new Map<string, Buffer>()
  const objectPort = memoryObjectPort(values)
  const listeningRepository =
    createCanonicalSoundCaptionListeningReviewRepository({
      objectPort,
      prefix: 'private/smoke/canonical-sound-caption-listening-review',
    })
  check(await listeningRepository.persistCreateOnly(listeningRecord)
    === 'created'
    && await listeningRepository.persistCreateOnly(listeningRecord)
      === 'identical_replay',
  'The Sound listening record must persist create-only with exact replay.')
  check((await listeningRepository.rereadExact({
    captionSoundRequestRef: captionRequestRef,
    canonicalSoundRequestRef: canonicalRequestRef,
    canonicalSoundResultRef: canonicalResultRef,
  }))?.recordDigestSha256 === listeningRecord.recordDigestSha256,
  'The Sound owner must reread the exact persisted listening record.')
  const tamperedRecord = structuredClone(listeningRecord)
  tamperedRecord.reviewerSubmission.warningCodes = ['forged_warning']
  await reject(() => listeningRepository.persistCreateOnly(tamperedRecord))
  const incompleteRecord = structuredClone(listeningRecord) as unknown as
    Record<string, unknown>
  delete incompleteRecord.playbackDerivationReceipt
  await reject(() => listeningRepository.persistCreateOnly(
    incompleteRecord as unknown as typeof listeningRecord))
  const playbackProxyRef = ref(
    'canonical.sound.listening.proxy.caption.owner.smoke',
    'private-audio-pcm-s16le-v1',
    sha('canonical sound listening proxy bytes'),
  )
  const playbackDerivation =
    createCanonicalSoundCaptionListeningPlaybackDerivation({
      schemaVersion:
        'canonical-sound-caption-listening-playback-derivation-v1',
      derivationId:
        'canonical.sound.listening.derivation.caption.owner.smoke',
      sourceFinalMixArtifactRef: finalMixArtifactRef,
      playbackArtifactRef: playbackProxyRef,
      conversionOperationRef: ref(
        'canonical.sound.listening.conversion.caption.owner.smoke',
        'tool.ffmpeg.execute_approved_media_recipe.v1'),
      transformProfile: 'pcm_bit_depth_compatibility_proxy',
      sourceSampleRate: 48_000,
      playbackSampleRate: 48_000,
      sourceChannelCount: 2,
      playbackChannelCount: 2,
      completeDurationPreserved: true,
      channelLayoutPreserved: true,
      resamplingPerformed: false,
      trimmingPerformed: false,
      gainOrDynamicsProcessingPerformed: false,
      networkAccessUsed: false,
      sourceArtifactRereadBeforeConversion: true,
      playbackArtifactRereadAfterConversion: true,
      mediaBytesIncluded: false,
      mediaLocatorIncluded: false,
      providerCallMade: false,
      finalQaApprovalGranted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    })
  const { submissionDigestSha256: _submissionDigest, ...submissionCore } =
    reviewerSubmission
  void _submissionDigest
  const proxySubmission =
    createCanonicalSoundCaptionListeningReviewerSubmission({
      ...submissionCore,
      submissionId:
        'canonical.sound.listening.proxy-submission.caption.owner.smoke',
      playbackArtifactRef: playbackProxyRef,
      playbackDerivationReceiptRef: ref(
        playbackDerivation.derivationId,
        playbackDerivation.schemaVersion,
        playbackDerivation.derivationDigestSha256,
      ),
    })
  const proxyRecord = completeCanonicalSoundCaptionListeningReview({
    inspectionPackageRef,
    captionSoundRequest: caption,
    canonicalSoundRequest: jsonClone(canonicalRequest),
    canonicalSoundResult: jsonClone(canonicalResult),
    reviewerSubmission: proxySubmission,
    playbackDerivationReceipt: playbackDerivation,
  })
  check(proxyRecord.playbackDerivationReceipt?.derivationDigestSha256
    === playbackDerivation.derivationDigestSha256,
  'A format-compatibility playback proxy must preserve exact derivation lineage.')
  assert.throws(() => completeCanonicalSoundCaptionListeningReview({
    inspectionPackageRef,
    captionSoundRequest: caption,
    canonicalSoundRequest: jsonClone(canonicalRequest),
    canonicalSoundResult: jsonClone(canonicalResult),
    reviewerSubmission: proxySubmission,
  }))
  checks += 1
  const { derivationDigestSha256: _derivationDigest, ...derivationCore } =
    playbackDerivation
  void _derivationDigest
  const crossedDerivation =
    createCanonicalSoundCaptionListeningPlaybackDerivation({
      ...derivationCore,
      sourceFinalMixArtifactRef: ref(
        'crossed.sound.final', 'private_sound_stem.v1'),
    })
  assert.throws(() => completeCanonicalSoundCaptionListeningReview({
    inspectionPackageRef,
    captionSoundRequest: caption,
    canonicalSoundRequest: jsonClone(canonicalRequest),
    canonicalSoundResult: jsonClone(canonicalResult),
    reviewerSubmission: proxySubmission,
    playbackDerivationReceipt: crossedDerivation,
  }))
  checks += 1
  const service = createCanonicalSoundCaptionOwnerService({
    objectPort,
    executionReadPort: createCanonicalSoundCaptionExecutionReadPort(
      async () => ({
        request: jsonClone(canonicalRequest),
        result: jsonClone(canonicalResult),
      })),
    listeningReviewReadPort: listeningRepository.listeningReviewReadPort,
    artifactResolver: {
      async resolve(artifact) {
        assert.equal(artifact.checksumSha256, finalArtifact.checksumSha256)
        return { artifact, absolutePath: finalPath, approvedRoot: root }
      },
      async privateOutputRoot() { return root },
    },
    prefix: 'private/smoke/canonical-sound-caption-owner',
  })
  const result = await service.readExact({
    supportRequest: bundle.supportRequest,
    captionSoundRequest: caption,
  })
  check(parseCaptionSoundSupportResult(result, bundle, context)
    .resultDigestSha256 === result.resultDigestSha256,
  'The owner projection must pass the exact Caption Sound parser.')
  check(result.evidenceMode === 'authenticated_private_runtime'
    && result.actualSoundRuntimeObserved
    && result.actualAudioAssetReread
    && result.actualDialogueProtectedFinalMixQaCompleted,
  'Actual canonical execution, artifact reread, and listening QA stay distinct.')
  check(result.cueResults.some((cue) => cue.disposition === 'admitted')
    && result.cueResults.filter((cue) => cue.disposition === 'admitted')
      .every((cue) => cue.selectedSoundAssetRef
        && cue.trimAndAlignmentRef
        && cue.mixPlanRef
        && cue.dialogueProtectionRef),
  'Every admitted cue must have exact Sound-owned asset, sync, mix, and dialogue evidence.')
  check(!result.runtimeAuthorityGrantedToCaption
    && !result.assetAuthorityGrantedToCaption
    && !result.mixAuthorityGrantedToCaption
    && !result.finalQaApprovalGrantedToCaption
    && !result.publicDeliveryGranted
    && !result.productionAuthorityGranted,
  'The owner projection must grant Caption no Sound or external authority.')

  const crossed = structuredClone(canonicalResult)
  crossed.sourceTimingHash = sha('crossed-master-timing')
  const crossedService = createCanonicalSoundCaptionOwnerService({
    objectPort: memoryObjectPort(new Map()),
    executionReadPort: createCanonicalSoundCaptionExecutionReadPort(
      async () => ({
        request: jsonClone(canonicalRequest),
        result: jsonClone(crossed),
      })),
    listeningReviewReadPort:
      createCanonicalSoundCaptionListeningReviewReadPort(async () =>
        listeningReview),
    artifactResolver: {
      async resolve(artifact) {
        return { artifact, absolutePath: finalPath, approvedRoot: root }
      },
      async privateOutputRoot() { return root },
    },
  })
  await reject(() => crossedService.readExact({
    supportRequest: bundle.supportRequest,
    captionSoundRequest: caption,
  }))

  const noReviewService = createCanonicalSoundCaptionOwnerService({
    objectPort: memoryObjectPort(new Map()),
    executionReadPort: createCanonicalSoundCaptionExecutionReadPort(
      async () => ({
        request: jsonClone(canonicalRequest),
        result: jsonClone(canonicalResult),
      })),
    listeningReviewReadPort:
      createCanonicalSoundCaptionListeningReviewReadPort(async () => {
        throw new Error('independent review unavailable')
      }),
    artifactResolver: {
      async resolve(artifact) {
        return { artifact, absolutePath: finalPath, approvedRoot: root }
      },
      async privateOutputRoot() { return root },
    },
  })
  await reject(() => noReviewService.readExact({
    supportRequest: bundle.supportRequest,
    captionSoundRequest: caption,
  }))

  console.log(JSON.stringify({
    smoke: 'canonical-sound-caption-owner-service',
    status: 'passed',
    checks,
    actualMediaRuntimeExecuted: false,
    syntheticPrivateBytesReread: true,
    independentListeningReviewRequired: true,
    terminalQualificationClaimed: false,
    soundExecutionOwnedByCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function ref(id: string, version: string, contentHash = sha(id)):
CaptionDomainRef {
  return { id, version, contentHash }
}

function contractDigest(value: unknown): string {
  return calculateSkillContractDigest({ value: jsonClone(value), digest: '' },
    'digest')
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function memoryObjectPort(values: Map<string, Buffer>):
CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(sha(input.body), input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
