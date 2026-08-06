import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  compileOfflineFinalMasterAudioObjectiveEvidence,
  compileOfflineFinalMasterVideoObjectiveEvidence,
} from '../final-master-qa'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineFinalMasterAudioQaRequest,
  buildOfflineFinalMasterVideoQaRequest,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
  offlineFinalMasterAudioQaRequestSha256,
  offlineFinalMasterVideoQaRequestSha256,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  sealOfflineFinalMasterAudioExceptionManifest,
  sealOfflineFinalMasterVisualExceptionManifest,
} from '../tool-execution/media-binary-execution'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  beginPrivateInternalAttemptCostEvidence,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const fps = 30 as const
const width = 1_920
const height = 1_080
const totalFrames = 120
const fixturePath = join(
  '/tmp',
  `reeditpro-final-master-objective-qa-${process.pid}.mp4`,
)
const silentFixturePath = join(
  '/tmp',
  `reeditpro-final-master-objective-qa-silent-${process.pid}.mp4`,
)
const longAudioTimestampFixturePath = join(
  '/tmp',
  `reeditpro-final-master-objective-qa-long-audio-${process.pid}.mp4`,
)
const longAudioTimestampRegressionSeconds = 65
const longAudioTimestampRegressionFrames =
  longAudioTimestampRegressionSeconds * fps
const longAudioTimestampRegressionWidth = 1_080
const longAudioTimestampRegressionHeight = 1_080
const costRoot = await mkdtemp(join(
  '/tmp',
  `reeditpro-final-master-objective-qa-cost-${process.pid}-`,
))

try {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `color=c=0x174EA6:s=${width}x${height}:r=${fps}:d=4`,
    '-f', 'lavfi', '-i',
    'sine=frequency=440:sample_rate=48000:duration=4',
    '-map', '0:v:0', '-map', '1:a:0',
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'high',
    '-x264-params',
    `keyint=${totalFrames}:min-keyint=${totalFrames}:scenecut=0:open-gop=0:` +
      'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off',
    '-bf', '2', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-color_range', 'tv',
    '-af', 'loudnorm=I=-14:LRA=7:TP=-1',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', '4', '-avoid_negative_ts', 'make_zero',
    '-fflags', '+bitexact', '-flags:a', '+bitexact',
    '-map_metadata', '-1', '-map_chapters', '-1',
    '-movflags',
    '+frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets',
    '-threads', '1',
    '-y', fixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const generatedSilent = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `color=c=0x174EA6:s=${width}x${height}:r=${fps}:d=2`,
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo:d=2',
    '-map', '0:v:0', '-map', '1:a:0', '-frames:v', '60',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-x264-params',
    'keyint=60:min-keyint=60:scenecut=0:open-gop=0:' +
      'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off',
    '-bf', '0', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', '2', '-movflags', '+faststart', '-threads', '1',
    '-y', silentFixturePath,
  ], { encoding: 'utf8' })
  assert.equal(generatedSilent.status, 0, generatedSilent.stderr)
  const generatedLongAudioTimestampFixture = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `color=c=0x174EA6:s=${longAudioTimestampRegressionWidth}x${longAudioTimestampRegressionHeight}:r=${fps}:d=${longAudioTimestampRegressionSeconds}`,
    '-f', 'lavfi', '-i',
    `sine=frequency=440:sample_rate=48000:duration=${longAudioTimestampRegressionSeconds}`,
    '-map', '0:v:0', '-map', '1:a:0',
    '-frames:v', String(longAudioTimestampRegressionFrames),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-profile:v', 'high',
    '-x264-params',
    `keyint=${longAudioTimestampRegressionFrames}:min-keyint=${longAudioTimestampRegressionFrames}:scenecut=0:open-gop=0:` +
      'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off',
    '-bf', '2', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-color_range', 'tv',
    '-af',
    `atrim=duration=${longAudioTimestampRegressionSeconds},` +
      'asetpts=PTS-STARTPTS,' +
      'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', String(longAudioTimestampRegressionSeconds),
    '-avoid_negative_ts', 'make_zero',
    '-fflags', '+bitexact', '-flags:a', '+bitexact',
    '-map_metadata', '-1', '-map_chapters', '-1',
    '-movflags',
    '+frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets',
    '-threads', '1', '-y', longAudioTimestampFixturePath,
  ], { encoding: 'utf8' })
  assert.equal(
    generatedLongAudioTimestampFixture.status,
    0,
    generatedLongAudioTimestampFixture.stderr,
  )

  const bytes = await readFile(fixturePath)
  const sourceSha256 = sha256(bytes)
  const artifactId = 'final-master-artifact-smoke-1'
  const objectIdentityHash = sha256Text('private-final-master-object-smoke-1')
  const finalMaster = {
    inputId: 'final-master' as const,
    artifactId,
    objectIdentityHash,
    mimeType: 'video/mp4' as const,
    byteLength: bytes.byteLength,
    sha256: sourceSha256,
    privateObject: true as const,
    placeholder: false as const,
    publicObject: false as const,
  }
  const common = {
    qaRunId: 'final-master-qa-smoke-1',
    approvedPlanSnapshotId: 'approved-snapshot-smoke-1',
    approvedPlanSnapshotHash: sha256Text('approved-snapshot-smoke-1'),
    approvedExecutionPackageHash: sha256Text('approved-package-smoke-1'),
    approvedEstimateId: 'approved-estimate-smoke-1',
    creditReservationId: 'credit-reservation-smoke-1',
    approvedDeliverableId: 'approved-deliverable-smoke-1',
    expectedEvidenceIdentity: 'expected-final-master-evidence-smoke-1',
    finalMasterArtifactId: artifactId,
    finalMasterObjectIdentityHash: objectIdentityHash,
    width,
    height,
    fps,
    totalFrames,
    mediaPolicyId: 'approved_h264_aac_yuv420p_bt709_web_master_v1' as const,
    usesApprovedEditReservation: true as const,
    requiresSeparateExportEstimate: false as const,
    allowsAdditionalExportCharge: false as const,
    mediaMutationAllowed: false as const,
    providerCallAllowed: false as const,
  }
  const commonCostIdentity = {
    localStorageRoot: costRoot,
    workspaceId: 'workspace-final-master-qa-smoke-1',
    projectId: 'project-final-master-qa-smoke-1',
    editSessionId: 'edit-session-final-master-qa-smoke-1',
    approvedPlanSnapshotId: common.approvedPlanSnapshotId,
    retryAttempt: 0,
    toolId: 'ffmpeg' as const,
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
  }
  const approvedFreezeManifest = sealOfflineFinalMasterVisualExceptionManifest([{
    exceptionId: 'approved-intentional-static-hold-smoke-1',
    kind: 'approved_freeze_hold',
    startFrame: 0,
    endFrameExclusive: totalFrames,
    approvalEvidenceHash: sha256Text('approved-static-hold-evidence-smoke-1'),
  }])
  const videoRequest = buildOfflineFinalMasterVideoQaRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
      ...common,
      anomalyPolicyId: 'approved_objective_visual_anomaly_policy_v1',
      blackMinimumDurationFrames: 2,
      freezeMinimumDurationFrames: 60,
      flashSceneChangeThreshold: 0.8,
      visualExceptionManifest: approvedFreezeManifest,
    },
    finalMaster,
  })
  const audioRequest = buildOfflineFinalMasterAudioQaRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
      ...common,
      audioPolicyId: 'approved_web_delivery_audio_policy_v1',
      sampleRate: 48_000,
      channels: 2,
      targetIntegratedLufs: -14,
      integratedLufsTolerance: 1,
      maximumTruePeakDbtp: -1,
      maximumLoudnessRangeLufs: 7,
      maximumAvSyncDriftFrames: 2,
      silenceMinimumDurationFrames: 30,
      speechClarityEvidenceHash:
        sha256Text('separate-speech-clarity-evidence-smoke-1'),
      speechClarityStatus: 'passed',
      audioExceptionManifest: sealOfflineFinalMasterAudioExceptionManifest([]),
    },
    finalMaster,
  })
  const videoRequestEnvelopeSha256 =
    offlineFinalMasterVideoQaRequestSha256(videoRequest)
  const audioRequestEnvelopeSha256 =
    offlineFinalMasterAudioQaRequestSha256(audioRequest)
  const privateInput = Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sourceSha256,
    async openStream() { return Readable.from([bytes]) },
  })

  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  const expectedRuntimeImageIdentityHash = runtime.image.imageIdentityHash
  const persistedAuthority =
    await readPersistedOfflineMediaBinaryRuntimeAuthority()
  assert.equal(
    persistedAuthority?.readiness.privateInternalFinalMasterDecodedVideoQaReady,
    true,
  )
  assert.equal(
    persistedAuthority?.readiness.privateInternalFinalMasterDecodedAudioQaReady,
    true,
  )
  assert.equal(
    persistedAuthority?.readiness.longFormFinalMasterQaCheckpointingReady,
    false,
  )
  const reopenedRuntime = await openPrivateOfflineMediaBinaryRuntime()
  assert.equal(
    typeof reopenedRuntime.executeFinalMasterVideoQaServerInjected,
    'function',
  )
  assert.equal(
    typeof reopenedRuntime.executeFinalMasterAudioQaServerInjected,
    'function',
  )
  const videoCostInput = {
    ...commonCostIdentity,
    approvedWorkItemId: 'work-item-final-master-decoded-video-qa-smoke-1',
    jobId: 'job-final-master-decoded-video-qa-smoke-1',
    executionAttemptId: 'attempt-final-master-decoded-video-qa-smoke-1',
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  }
  const videoCostMeter = await beginPrivateInternalAttemptCostEvidence(
    videoCostInput,
  )
  const videoResult = await runtime.executeFinalMasterVideoQaServerInjected(
    videoRequest,
    privateInput,
  )
  const videoAttemptCost = await videoCostMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: videoResult.resultJson.byteLength,
    linkedCanonicalOutcomeHash: videoResult.resultJson.sha256,
  })
  assert.equal(videoAttemptCost.idempotencyStatus, 'inserted')
  assertInternalAttemptCost(
    videoAttemptCost.evidence,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  )
  const persistedVideoAttemptCost =
    await readPrivateInternalAttemptCostEvidence({
      localStorageRoot: costRoot,
      workspaceId: commonCostIdentity.workspaceId,
      projectId: commonCostIdentity.projectId,
      executionAttemptId: videoCostInput.executionAttemptId,
    })
  assert.deepEqual(persistedVideoAttemptCost, videoAttemptCost.evidence)
  const replayVideoCostMeter = await beginPrivateInternalAttemptCostEvidence(
    videoCostInput,
  )
  const replayVideoAttemptCost = await replayVideoCostMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: videoResult.resultJson.byteLength,
    linkedCanonicalOutcomeHash: videoResult.resultJson.sha256,
  })
  assert.equal(replayVideoAttemptCost.idempotencyStatus, 'duplicate_returned')
  assert.deepEqual(replayVideoAttemptCost.evidence, videoAttemptCost.evidence)
  const videoObjectiveAuthority = {
    workspaceId: commonCostIdentity.workspaceId,
    projectId: commonCostIdentity.projectId,
    editSessionId: commonCostIdentity.editSessionId,
    qaRunId: common.qaRunId,
    approvedPlanSnapshotId: common.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: common.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: common.approvedExecutionPackageHash,
    approvedEstimateId: common.approvedEstimateId,
    creditReservationId: common.creditReservationId,
    approvedDeliverableId: common.approvedDeliverableId,
    expectedEvidenceIdentity: common.expectedEvidenceIdentity,
    approvedWorkItemId: videoCostInput.approvedWorkItemId,
    jobId: videoCostInput.jobId,
    executionAttemptId: videoCostInput.executionAttemptId,
    sourceMasterArtifactId: artifactId,
    sourceMasterObjectIdentityHash: objectIdentityHash,
    sourceMasterSha256: sourceSha256,
    sourceMasterByteLength: bytes.byteLength,
    expectedDurationFrames: totalFrames,
    approvedExceptionManifestHash: approvedFreezeManifest.manifestHash,
    approvedExceptionManifest: approvedFreezeManifest,
    expectedRequestEnvelopeSha256: videoRequestEnvelopeSha256,
    expectedRuntimeImageIdentityHash,
  }
  const videoObjectiveEvidence =
    compileOfflineFinalMasterVideoObjectiveEvidence({
      authority: videoObjectiveAuthority,
      runnerResult: videoResult,
      attemptCostEvidence: videoAttemptCost.evidence,
    })
  assert.equal(videoObjectiveEvidence.outcome, 'passed')
  assert.equal(videoObjectiveEvidence.metrics.decodedFrameCount, totalFrames)
  assert.equal(videoObjectiveEvidence.metrics.unexpectedFreezeFrameCount, 0)
  assert.equal(
    videoObjectiveEvidence.internalCostEvidenceSetHash.length,
    64,
  )
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: videoObjectiveAuthority,
    runnerResult: {
      ...videoResult,
      evidence: {
        ...videoResult.evidence,
        sourceSha256: sha256Text('substituted-final-master-source'),
      },
    },
    attemptCostEvidence: videoAttemptCost.evidence,
  }))
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: videoObjectiveAuthority,
    runnerResult: videoResult,
    attemptCostEvidence: {
      ...videoAttemptCost.evidence,
      linkedCanonicalOutcomeHash:
        sha256Text('substituted-final-master-cost-outcome'),
    },
  }))
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: {
      ...videoObjectiveAuthority,
      approvedPlanSnapshotHash:
        sha256Text('substituted-approved-plan-snapshot'),
    },
    runnerResult: videoResult,
    attemptCostEvidence: videoAttemptCost.evidence,
  }))
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: {
      ...videoObjectiveAuthority,
      approvedExceptionManifest: {
        ...approvedFreezeManifest,
        ranges: approvedFreezeManifest.ranges.map((range) => ({
          ...range,
          approvalEvidenceHash:
            sha256Text('substituted-approved-exception-evidence'),
        })),
      },
    },
    runnerResult: videoResult,
    attemptCostEvidence: videoAttemptCost.evidence,
  }))
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: {
      ...videoObjectiveAuthority,
      expectedRequestEnvelopeSha256:
        sha256Text('substituted-final-master-request'),
    },
    runnerResult: videoResult,
    attemptCostEvidence: videoAttemptCost.evidence,
  }))
  assert.throws(() => compileOfflineFinalMasterVideoObjectiveEvidence({
    authority: {
      ...videoObjectiveAuthority,
      expectedRuntimeImageIdentityHash:
        sha256Text('substituted-final-master-runtime-image'),
    },
    runnerResult: videoResult,
    attemptCostEvidence: videoAttemptCost.evidence,
  }))
  const videoDocument = videoResult.resultJson.document
  const roundTrippedVideoDocument = JSON.parse(
    stableAuthorityStringify(videoDocument),
  ) as Record<string, unknown>
  assert.equal(
    sha256AuthorityValue(roundTrippedVideoDocument),
    sha256AuthorityValue(videoDocument),
  )
  assert.equal(
    sha256(Buffer.from(`${stableAuthorityStringify(videoDocument)}\n`)),
    videoResult.resultJson.sha256,
  )
  assert.notEqual(
    sha256AuthorityValue(videoDocument),
    videoResult.resultJson.sha256,
  )
  assert.equal(videoResult.evidence.resultSha256, videoResult.resultJson.sha256)
  assert.equal(
    videoAttemptCost.evidence.linkedCanonicalOutcomeHash,
    videoResult.resultJson.sha256,
  )
  assert.equal(
    videoAttemptCost.evidence.resourceUsage.outputByteLength,
    videoResult.resultJson.byteLength,
  )
  assert.equal(
    videoObjectiveEvidence.evidenceArtifactHash,
    videoResult.resultJson.sha256,
  )
  const technicalProbe = record(videoDocument.technicalProbe)
  const technicalProbeVideo = record(technicalProbe.video)
  const decodedVideo = record(videoDocument.decodedFrameIntegrity)
  const anomalyScan = record(videoDocument.visualAnomalyScan)
  assert.equal(videoDocument.outcome, 'passed')
  assert.equal(technicalProbeVideo.frameCount, totalFrames)
  assert.equal(technicalProbeVideo.nominalFrameRate, fps)
  assert.equal(decodedVideo.decodedFrameCount, totalFrames)
  assert.equal(decodedVideo.expectedFrameCount, totalFrames)
  assert.equal(decodedVideo.sequentialDtsPtsVerified, true)
  assert.equal(
    decodedVideo.checksumTimestampNormalization,
    'decoded_frame_ordinal_no_drop_or_duplication_v1',
  )
  assert.equal(
    decodedVideo.originalTimestampAuthority,
    'independent_exact_technical_probe_v1',
  )
  assert.equal(decodedVideo.firstFrameDurationTicks, 3)
  assert.equal(decodedVideo.maximumFirstFrameDurationTicks, 3)
  assert.equal(decodedVideo.firstFrameDurationWithinApprovedStartOffset, true)
  assert.equal(decodedVideo.subsequentOneFrameDurationsVerified, true)
  assert.equal(decodedVideo.perFrameSha256Verified, true)
  assert.equal(decodedVideo.retainedPerFramePayloads, false)
  assert.equal(anomalyScan.unexpectedFindingCount, 0)
  assert.equal(anomalyScan.approvedExceptionFindingCount, 1)
  assert.equal(videoResult.evidence.confinement.technicalProbe.networkMode, 'none')
  assert.equal(
    videoResult.evidence.confinement.decodedFrameIntegrity.serverOwnedEntrypoint,
    '/opt/reeditpro-ffmpeg/bin/ffmpeg',
  )
  assert.equal(videoResult.readiness.exactPrivateArtifactDecoded, true)
  assert.equal(videoResult.readiness.longFormCheckpointingReady, false)
  assert.equal(videoResult.readiness.googleCloudWorkerReady, false)
  assert.equal(videoResult.readiness.publicDeliveryReady, false)
  assert.equal(videoResult.readiness.productReady, false)

  const audioCostInput = {
    ...commonCostIdentity,
    approvedWorkItemId: 'work-item-final-master-decoded-audio-qa-smoke-1',
    jobId: 'job-final-master-decoded-audio-qa-smoke-1',
    executionAttemptId: 'attempt-final-master-decoded-audio-qa-smoke-1',
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  }
  const audioCostMeter = await beginPrivateInternalAttemptCostEvidence(
    audioCostInput,
  )
  const audioResult = await runtime.executeFinalMasterAudioQaServerInjected(
    audioRequest,
    privateInput,
  )
  const audioAttemptCost = await audioCostMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: audioResult.resultJson.byteLength,
    linkedCanonicalOutcomeHash: audioResult.resultJson.sha256,
  })
  assert.equal(audioAttemptCost.idempotencyStatus, 'inserted')
  assertInternalAttemptCost(
    audioAttemptCost.evidence,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  )
  const audioObjectiveEvidence =
    compileOfflineFinalMasterAudioObjectiveEvidence({
      authority: {
        workspaceId: commonCostIdentity.workspaceId,
        projectId: commonCostIdentity.projectId,
        editSessionId: commonCostIdentity.editSessionId,
        qaRunId: common.qaRunId,
        approvedPlanSnapshotId: common.approvedPlanSnapshotId,
        approvedPlanSnapshotHash: common.approvedPlanSnapshotHash,
        approvedExecutionPackageHash: common.approvedExecutionPackageHash,
        approvedEstimateId: common.approvedEstimateId,
        creditReservationId: common.creditReservationId,
        approvedDeliverableId: common.approvedDeliverableId,
        expectedEvidenceIdentity: common.expectedEvidenceIdentity,
        approvedWorkItemId: audioCostInput.approvedWorkItemId,
        jobId: audioCostInput.jobId,
        executionAttemptId: audioCostInput.executionAttemptId,
        sourceMasterArtifactId: artifactId,
        sourceMasterObjectIdentityHash: objectIdentityHash,
        sourceMasterSha256: sourceSha256,
        sourceMasterByteLength: bytes.byteLength,
        expectedDurationFrames: totalFrames,
        approvedExceptionManifestHash:
          audioRequest.payload.audioExceptionManifest.manifestHash,
        approvedExceptionManifest: audioRequest.payload.audioExceptionManifest,
        expectedRequestEnvelopeSha256: audioRequestEnvelopeSha256,
        expectedRuntimeImageIdentityHash,
      },
      runnerResult: audioResult,
      attemptCostEvidence: audioAttemptCost.evidence,
    })
  assert.equal(audioObjectiveEvidence.outcome, 'passed')
  assert.equal(audioObjectiveEvidence.metrics.unexpectedClippedSampleCount, 0)
  assert.equal(
    audioObjectiveEvidence.metrics.unexpectedDigitalSilenceFrameCount,
    0,
  )
  const audioDocument = audioResult.resultJson.document
  const roundTrippedAudioDocument = JSON.parse(
    stableAuthorityStringify(audioDocument),
  ) as Record<string, unknown>
  assert.equal(
    sha256AuthorityValue(roundTrippedAudioDocument),
    sha256AuthorityValue(audioDocument),
  )
  assert.equal(
    sha256(Buffer.from(`${stableAuthorityStringify(audioDocument)}\n`)),
    audioResult.resultJson.sha256,
  )
  assert.notEqual(
    sha256AuthorityValue(audioDocument),
    audioResult.resultJson.sha256,
  )
  assert.equal(audioResult.evidence.resultSha256, audioResult.resultJson.sha256)
  assert.equal(
    audioAttemptCost.evidence.linkedCanonicalOutcomeHash,
    audioResult.resultJson.sha256,
  )
  assert.equal(
    audioAttemptCost.evidence.resourceUsage.outputByteLength,
    audioResult.resultJson.byteLength,
  )
  assert.equal(
    audioObjectiveEvidence.evidenceArtifactHash,
    audioResult.resultJson.sha256,
  )
  const decodedAudio = record(audioDocument.decodedAudioIntegrity)
  const audioQuality = record(audioDocument.audioQualityScan)
  const speechClarity = record(audioDocument.speechClarity)
  assert.equal(audioDocument.outcome, 'passed')
  assert.equal(decodedAudio.contiguousDtsPtsVerified, true)
  assert.equal(
    decodedAudio.checksumTimestampNormalization,
    'decoded_sample_ordinal_no_drop_or_duplication_v1',
  )
  assert.equal(
    decodedAudio.originalTimestampAuthority,
    'independent_exact_technical_probe_v1',
  )
  assert.equal(decodedAudio.perPacketSha256Verified, true)
  assert.equal(decodedAudio.avSyncOutcome, 'passed')
  assert.ok(Number(decodedAudio.avSyncDriftFrames) <= 2)
  assert.equal(audioQuality.integratedLufsWithinPolicy, true)
  assert.equal(audioQuality.truePeakWithinPolicy, true)
  assert.equal(audioQuality.loudnessRangeWithinPolicy, true)
  assert.equal(audioQuality.decodedSignalFinite, true)
  assert.equal(audioQuality.unexpectedClippedSampleCount, 0)
  assert.equal(audioQuality.unexpectedSilenceCount, 0)
  assert.equal(speechClarity.ffmpegClaimedSpeechUnderstanding, false)
  assert.equal(audioResult.readiness.speechClarityEvidenceReconciled, true)
  assert.equal(audioResult.readiness.productReady, false)

  const longAudioBytes = await readFile(longAudioTimestampFixturePath)
  const longAudioArtifactId =
    'final-master-artifact-smoke-long-audio-timestamp-1'
  const longAudioObjectIdentityHash =
    sha256Text('private-final-master-object-smoke-long-audio-timestamp-1')
  const longAudioFinalMaster = {
    ...finalMaster,
    artifactId: longAudioArtifactId,
    objectIdentityHash: longAudioObjectIdentityHash,
    byteLength: longAudioBytes.byteLength,
    sha256: sha256(longAudioBytes),
  }
  const longAudioRequest = buildOfflineFinalMasterAudioQaRequest({
    planningPayload: {
      ...common,
      qaRunId: 'final-master-qa-smoke-long-audio-timestamp-1',
      expectedEvidenceIdentity:
        'expected-final-master-evidence-smoke-long-audio-timestamp-1',
      finalMasterArtifactId: longAudioArtifactId,
      finalMasterObjectIdentityHash: longAudioObjectIdentityHash,
      width: longAudioTimestampRegressionWidth,
      height: longAudioTimestampRegressionHeight,
      totalFrames: longAudioTimestampRegressionFrames,
      recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
      audioPolicyId: 'approved_web_delivery_audio_policy_v1',
      sampleRate: 48_000,
      channels: 2,
      targetIntegratedLufs: -14,
      integratedLufsTolerance: 1,
      maximumTruePeakDbtp: -1,
      maximumLoudnessRangeLufs: 7,
      maximumAvSyncDriftFrames: 2,
      silenceMinimumDurationFrames: 30,
      speechClarityEvidenceHash:
        sha256Text('separate-speech-clarity-long-audio-timestamp-smoke-1'),
      speechClarityStatus: 'passed',
      audioExceptionManifest: sealOfflineFinalMasterAudioExceptionManifest([]),
    },
    finalMaster: longAudioFinalMaster,
  })
  const longAudioResult =
    await runtime.executeFinalMasterAudioQaServerInjected(
      longAudioRequest,
      Object.freeze({
        inputMode: 'private_verified_stream_v1' as const,
        byteLength: longAudioBytes.byteLength,
        sha256: longAudioFinalMaster.sha256,
        async openStream() { return Readable.from([longAudioBytes]) },
      }),
    )
  const longAudioDocument = longAudioResult.resultJson.document
  const longAudioDecoded = record(longAudioDocument.decodedAudioIntegrity)
  assert.ok(Number(longAudioDecoded.packetCount) > 3_003)
  assert.ok(
    Number(longAudioDecoded.decodedSampleCount) >=
      longAudioTimestampRegressionSeconds * 48_000,
  )
  assert.equal(longAudioDecoded.contiguousDtsPtsVerified, true)
  assert.equal(
    longAudioDecoded.checksumTimestampNormalization,
    'decoded_sample_ordinal_no_drop_or_duplication_v1',
  )
  assert.equal(longAudioDecoded.avSyncOutcome, 'passed')
  assert.ok(Number(longAudioDecoded.avSyncDriftFrames) <= 2)

  const silentBytes = await readFile(silentFixturePath)
  const silentSha256 = sha256(silentBytes)
  const silentArtifactId = 'final-master-artifact-smoke-silent-1'
  const silentObjectIdentityHash =
    sha256Text('private-final-master-object-smoke-silent-1')
  const silentFinalMaster = {
    ...finalMaster,
    artifactId: silentArtifactId,
    objectIdentityHash: silentObjectIdentityHash,
    byteLength: silentBytes.byteLength,
    sha256: silentSha256,
  }
  const silentAudioRequest = buildOfflineFinalMasterAudioQaRequest({
    planningPayload: {
      ...audioRequest.payload,
      qaRunId: 'final-master-qa-smoke-silent-1',
      expectedEvidenceIdentity: 'expected-final-master-evidence-smoke-silent-1',
      finalMasterArtifactId: silentArtifactId,
      finalMasterObjectIdentityHash: silentObjectIdentityHash,
      totalFrames: 60,
      speechClarityEvidenceHash:
        sha256Text('separate-speech-clarity-evidence-smoke-silent-1'),
      audioExceptionManifest: sealOfflineFinalMasterAudioExceptionManifest([{
        exceptionId: 'approved-digital-silence-smoke-1',
        kind: 'approved_digital_silence',
        startFrame: 0,
        endFrameExclusive: 60,
        approvalEvidenceHash:
          sha256Text('approved-digital-silence-evidence-smoke-1'),
      }]),
    },
    finalMaster: silentFinalMaster,
  })
  const silentAudioRequestEnvelopeSha256 =
    offlineFinalMasterAudioQaRequestSha256(silentAudioRequest)
  const silentAudioCostInput = {
    ...commonCostIdentity,
    approvedWorkItemId:
      'work-item-final-master-decoded-audio-qa-silent-smoke-1',
    jobId: 'job-final-master-decoded-audio-qa-silent-smoke-1',
    executionAttemptId:
      'attempt-final-master-decoded-audio-qa-silent-smoke-1',
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  }
  const silentAudioCostMeter = await beginPrivateInternalAttemptCostEvidence(
    silentAudioCostInput,
  )
  const silentAudioResult =
    await runtime.executeFinalMasterAudioQaServerInjected(
      silentAudioRequest,
      Object.freeze({
        inputMode: 'private_verified_stream_v1' as const,
        byteLength: silentBytes.byteLength,
        sha256: silentSha256,
        async openStream() { return Readable.from([silentBytes]) },
      }),
    )
  const silentAudioAttemptCost = await silentAudioCostMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: silentAudioResult.resultJson.byteLength,
    linkedCanonicalOutcomeHash: silentAudioResult.resultJson.sha256,
  })
  assert.equal(silentAudioAttemptCost.evidence.outcome.status, 'completed')
  assertInternalAttemptCost(
    silentAudioAttemptCost.evidence,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
  )
  const silentAudioObjectiveEvidence =
    compileOfflineFinalMasterAudioObjectiveEvidence({
      authority: {
        workspaceId: commonCostIdentity.workspaceId,
        projectId: commonCostIdentity.projectId,
        editSessionId: commonCostIdentity.editSessionId,
        qaRunId: 'final-master-qa-smoke-silent-1',
        approvedPlanSnapshotId: common.approvedPlanSnapshotId,
        approvedPlanSnapshotHash: common.approvedPlanSnapshotHash,
        approvedExecutionPackageHash: common.approvedExecutionPackageHash,
        approvedEstimateId: common.approvedEstimateId,
        creditReservationId: common.creditReservationId,
        approvedDeliverableId: common.approvedDeliverableId,
        expectedEvidenceIdentity:
          'expected-final-master-evidence-smoke-silent-1',
        approvedWorkItemId: silentAudioCostInput.approvedWorkItemId,
        jobId: silentAudioCostInput.jobId,
        executionAttemptId: silentAudioCostInput.executionAttemptId,
        sourceMasterArtifactId: silentArtifactId,
        sourceMasterObjectIdentityHash: silentObjectIdentityHash,
        sourceMasterSha256: silentSha256,
        sourceMasterByteLength: silentBytes.byteLength,
        expectedDurationFrames: 60,
        approvedExceptionManifestHash:
          silentAudioRequest.payload.audioExceptionManifest.manifestHash,
        approvedExceptionManifest:
          silentAudioRequest.payload.audioExceptionManifest,
        expectedRequestEnvelopeSha256: silentAudioRequestEnvelopeSha256,
        expectedRuntimeImageIdentityHash,
      },
      runnerResult: silentAudioResult,
      attemptCostEvidence: silentAudioAttemptCost.evidence,
    })
  assert.equal(silentAudioObjectiveEvidence.outcome, 'needs_user_review')
  assert.ok(
    [
      silentAudioObjectiveEvidence.metrics.integratedLufs,
      silentAudioObjectiveEvidence.metrics.truePeakDbtp,
      silentAudioObjectiveEvidence.metrics.loudnessRangeLufs,
    ].includes('negative_infinity'),
  )
  const silentAudioQuality = record(
    silentAudioResult.resultJson.document.audioQualityScan,
  )
  assert.equal(
    silentAudioResult.resultJson.document.outcome,
    'needs_user_review',
  )
  assert.equal(silentAudioQuality.integratedLufsWithinPolicy, false)
  assert.equal(silentAudioQuality.truePeakWithinPolicy, false)
  assert.equal(silentAudioQuality.detectedSilenceCount, 1)
  assert.equal(silentAudioQuality.unexpectedSilenceCount, 0)

  const reviewVideoCostInput = {
    ...commonCostIdentity,
    approvedWorkItemId:
      'work-item-final-master-decoded-video-qa-review-smoke-1',
    jobId: 'job-final-master-decoded-video-qa-review-smoke-1',
    executionAttemptId:
      'attempt-final-master-decoded-video-qa-review-smoke-1',
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  }
  const reviewVideoCostMeter = await beginPrivateInternalAttemptCostEvidence(
    reviewVideoCostInput,
  )
  const reviewVisualExceptionManifest =
    sealOfflineFinalMasterVisualExceptionManifest([])
  const reviewVideoRequest = buildOfflineFinalMasterVideoQaRequest({
    planningPayload: {
      ...videoRequest.payload,
      visualExceptionManifest: reviewVisualExceptionManifest,
    },
    finalMaster,
  })
  const reviewVideoRequestEnvelopeSha256 =
    offlineFinalMasterVideoQaRequestSha256(reviewVideoRequest)
  const reviewResult = await runtime.executeFinalMasterVideoQaServerInjected(
    reviewVideoRequest,
    privateInput,
  )
  const reviewVideoAttemptCost = await reviewVideoCostMeter.finalize({
    status: 'completed',
    failureCategory: 'none',
    outputByteLength: reviewResult.resultJson.byteLength,
    linkedCanonicalOutcomeHash: reviewResult.resultJson.sha256,
  })
  assert.equal(reviewVideoAttemptCost.evidence.outcome.status, 'completed')
  assertInternalAttemptCost(
    reviewVideoAttemptCost.evidence,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  )
  const reviewVideoObjectiveEvidence =
    compileOfflineFinalMasterVideoObjectiveEvidence({
      authority: {
        workspaceId: commonCostIdentity.workspaceId,
        projectId: commonCostIdentity.projectId,
        editSessionId: commonCostIdentity.editSessionId,
        qaRunId: common.qaRunId,
        approvedPlanSnapshotId: common.approvedPlanSnapshotId,
        approvedPlanSnapshotHash: common.approvedPlanSnapshotHash,
        approvedExecutionPackageHash: common.approvedExecutionPackageHash,
        approvedEstimateId: common.approvedEstimateId,
        creditReservationId: common.creditReservationId,
        approvedDeliverableId: common.approvedDeliverableId,
        expectedEvidenceIdentity: common.expectedEvidenceIdentity,
        approvedWorkItemId: reviewVideoCostInput.approvedWorkItemId,
        jobId: reviewVideoCostInput.jobId,
        executionAttemptId: reviewVideoCostInput.executionAttemptId,
        sourceMasterArtifactId: artifactId,
        sourceMasterObjectIdentityHash: objectIdentityHash,
        sourceMasterSha256: sourceSha256,
        sourceMasterByteLength: bytes.byteLength,
        expectedDurationFrames: totalFrames,
        approvedExceptionManifestHash:
          reviewVisualExceptionManifest.manifestHash,
        approvedExceptionManifest: reviewVisualExceptionManifest,
        expectedRequestEnvelopeSha256: reviewVideoRequestEnvelopeSha256,
        expectedRuntimeImageIdentityHash,
      },
      runnerResult: reviewResult,
      attemptCostEvidence: reviewVideoAttemptCost.evidence,
    })
  assert.equal(reviewVideoObjectiveEvidence.outcome, 'needs_user_review')
  assert.ok(reviewVideoObjectiveEvidence.metrics.unexpectedFreezeFrameCount > 0)
  assert.equal(reviewResult.resultJson.document.outcome, 'needs_user_review')
  assert.ok(
    Number(record(reviewResult.resultJson.document.visualAnomalyScan)
      .unexpectedFindingCount) > 0,
  )

  assert.throws(() => buildOfflineFinalMasterVideoQaRequest({
    planningPayload: { ...videoRequest.payload, command: 'caller ffmpeg command' },
    finalMaster,
  }))
  assert.throws(() => buildOfflineFinalMasterAudioQaRequest({
    planningPayload: {
      ...audioRequest.payload,
      allowsAdditionalExportCharge: true,
    },
    finalMaster,
  }))
  assert.throws(() => buildOfflineFinalMasterVideoQaRequest({
    planningPayload: videoRequest.payload,
    finalMaster: {
      ...finalMaster,
      privateObject: false,
      publicObject: true,
    } as unknown as typeof finalMaster,
  }))

  const tamperedBytes = Buffer.from(bytes)
  tamperedBytes[tamperedBytes.length - 1] ^= 1
  const tamperedVideoCostInput = {
    ...commonCostIdentity,
    approvedWorkItemId:
      'work-item-final-master-decoded-video-qa-tampered-smoke-1',
    jobId: 'job-final-master-decoded-video-qa-tampered-smoke-1',
    executionAttemptId:
      'attempt-final-master-decoded-video-qa-tampered-smoke-1',
    workloadProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  }
  const tamperedVideoCostMeter = await beginPrivateInternalAttemptCostEvidence(
    tamperedVideoCostInput,
  )
  await assert.rejects(() =>
    runtime.executeFinalMasterVideoQaServerInjected(
      videoRequest,
      Object.freeze({
        ...privateInput,
        async openStream() { return Readable.from([tamperedBytes]) },
      }),
    ), /exact|checksum|commitment|verification/iu)
  const tamperedVideoAttemptCost = await tamperedVideoCostMeter.finalize({
    status: 'failed',
    failureCategory: 'validation_error',
    outputByteLength: null,
    linkedCanonicalOutcomeHash: null,
  })
  assert.equal(tamperedVideoAttemptCost.evidence.outcome.status, 'failed')
  assert.equal(
    tamperedVideoAttemptCost.evidence.outcome.failureCategory,
    'validation_error',
  )
  assertInternalAttemptCost(
    tamperedVideoAttemptCost.evidence,
    PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
  )

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: 'offline-final-master-objective-qa-runtime-smoke-v1',
    realFixture: {
      container: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width,
      height,
      fps,
      totalFrames,
      byteLength: bytes.byteLength,
      sha256: sourceSha256,
    },
    longAudioTimestampRegression: {
      durationSeconds: longAudioTimestampRegressionSeconds,
      packetCount: longAudioDecoded.packetCount,
      decodedSampleCount: longAudioDecoded.decodedSampleCount,
      avSyncDriftFrames: longAudioDecoded.avSyncDriftFrames,
      contiguousDtsPtsVerified: longAudioDecoded.contiguousDtsPtsVerified,
    },
    videoOutcome: videoDocument.outcome,
    audioOutcome: audioDocument.outcome,
    silentMasterOutcome: silentAudioResult.resultJson.document.outcome,
    unapprovedIntentionalFreezeOutcome:
      reviewResult.resultJson.document.outcome,
    exactInputTamperRejected: true,
    internalAttemptCostEvidence: {
      boundary: 'internal_production_cost_only',
      rateCardVersion: videoAttemptCost.evidence.rateCardVersion,
      decodedVideoPassedAttemptMicros:
        videoAttemptCost.evidence.actualInternalCostMicros,
      decodedAudioPassedAttemptMicros:
        audioAttemptCost.evidence.actualInternalCostMicros,
      decodedVideoReviewAttemptMicros:
        reviewVideoAttemptCost.evidence.actualInternalCostMicros,
      decodedAudioReviewAttemptMicros:
        silentAudioAttemptCost.evidence.actualInternalCostMicros,
      decodedVideoFailedAttemptMicros:
        tamperedVideoAttemptCost.evidence.actualInternalCostMicros,
      exactReplayReturnedSameEvidence: true,
      canonicalReconciliationReady: false,
    },
    objectiveEvidenceCompiler: {
      decodedVideoPassed: videoObjectiveEvidence.outcome,
      decodedAudioPassed: audioObjectiveEvidence.outcome,
      decodedVideoReview: reviewVideoObjectiveEvidence.outcome,
      decodedAudioSilentReview: silentAudioObjectiveEvidence.outcome,
      exactRunnerSourceSubstitutionRejected: true,
      exactAttemptCostSubstitutionRejected: true,
      exactSnapshotHashSubstitutionRejected: true,
      exactRequestEnvelopeSubstitutionRejected: true,
      exactRuntimeImageSubstitutionRejected: true,
      exactApprovedExceptionSubstitutionRejected: true,
      internalCostEvidenceBound: true,
      canonicalPackageLeaseDispatchReconciliationReady: false,
    },
    originalApprovedEditReservationUsed: true,
    separateExportEstimateRequired: false,
    additionalExportChargeAllowed: false,
    mediaMutationPerformed: false,
    providerCallPerformed: false,
    longFormCheckpointingReady: false,
    googleCloudWorkerReady: false,
    publicDeliveryReady: false,
    productReady: false,
    productionReady: false,
  }, null, 2))
} finally {
  await Promise.all([
    rm(fixturePath, { force: true }),
    rm(silentFixturePath, { force: true }),
    rm(longAudioTimestampFixturePath, { force: true }),
    rm(costRoot, { recursive: true, force: true }),
  ])
}

function assertInternalAttemptCost(
  evidence: PrivateInternalAttemptCostEvidence,
  workloadProfileId: string,
): void {
  assert.equal(evidence.boundary, 'internal_production_cost_only')
  assert.equal(evidence.evidenceClassification, 'provisional_local_metered')
  assert.ok('workloadProfileId' in evidence.identity)
  assert.equal(evidence.identity.workloadProfileId, workloadProfileId)
  assert.equal(evidence.resourceUsage.vcpuCount, 2)
  assert.equal(evidence.resourceUsage.memoryGib, 2)
  assert.equal(evidence.resourceUsage.gpuCount, 0)
  assert.equal(evidence.resourceUsage.networkEgressMib, 0)
  assert.ok(Number.isSafeInteger(evidence.actualInternalCostMicros))
  assert.ok(evidence.actualInternalCostMicros > 0)
  assert.equal(evidence.persistence.privateLocalCreateOnly, true)
  assert.equal(evidence.persistence.databaseBacked, false)
  assert.equal(evidence.persistence.productionDurability, false)
  assert.equal(evidence.persistence.invoiceReconciled, false)
  assertNoCommercialKeys(evidence)
}

function assertNoCommercialKeys(value: unknown): void {
  const keys: string[] = []
  visitKeys(value, keys)
  const forbidden = keys.filter((key) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    return normalized.includes('customerprice') ||
      normalized.includes('customercredit') ||
      normalized.includes('servicefee') ||
      normalized.includes('markup') || normalized.includes('margin') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') ||
      normalized.includes('toolcostcredit') || normalized === 'credits'
  })
  assert.deepEqual(forbidden, [])
}

function visitKeys(value: unknown, keys: string[]): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry) => visitKeys(entry, keys))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    keys.push(key)
    visitKeys(entry, keys)
  }
}

function record(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256Text(value: string): string {
  return sha256(Buffer.from(value, 'utf8'))
}
