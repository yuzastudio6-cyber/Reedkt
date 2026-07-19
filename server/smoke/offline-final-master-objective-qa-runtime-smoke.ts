import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineFinalMasterAudioQaRequest,
  buildOfflineFinalMasterVideoQaRequest,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  sealOfflineFinalMasterAudioExceptionManifest,
  sealOfflineFinalMasterVisualExceptionManifest,
} from '../tool-execution/media-binary-execution'

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

try {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `color=c=0x174EA6:s=${width}x${height}:r=${fps}:d=4`,
    '-f', 'lavfi', '-i',
    'sine=frequency=440:sample_rate=48000:duration=4',
    '-map', '0:v:0', '-map', '1:a:0',
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-x264-params',
    `keyint=${totalFrames}:min-keyint=${totalFrames}:scenecut=0:open-gop=0:` +
      'colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off',
    '-bf', '0', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709',
    '-color_trc', 'bt709', '-color_range', 'tv',
    '-af', 'loudnorm=I=-14:LRA=7:TP=-1',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', '4', '-movflags', '+faststart', '-threads', '1',
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
  const privateInput = Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sourceSha256,
    async openStream() { return Readable.from([bytes]) },
  })

  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
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
  const videoResult = await runtime.executeFinalMasterVideoQaServerInjected(
    videoRequest,
    privateInput,
  )
  const videoDocument = videoResult.resultJson.document
  const decodedVideo = record(videoDocument.decodedFrameIntegrity)
  const anomalyScan = record(videoDocument.visualAnomalyScan)
  assert.equal(videoDocument.outcome, 'passed')
  assert.equal(decodedVideo.decodedFrameCount, totalFrames)
  assert.equal(decodedVideo.expectedFrameCount, totalFrames)
  assert.equal(decodedVideo.sequentialDtsPtsVerified, true)
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

  const audioResult = await runtime.executeFinalMasterAudioQaServerInjected(
    audioRequest,
    privateInput,
  )
  const audioDocument = audioResult.resultJson.document
  const decodedAudio = record(audioDocument.decodedAudioIntegrity)
  const audioQuality = record(audioDocument.audioQualityScan)
  const speechClarity = record(audioDocument.speechClarity)
  assert.equal(audioDocument.outcome, 'passed')
  assert.equal(decodedAudio.contiguousDtsPtsVerified, true)
  assert.equal(decodedAudio.perPacketSha256Verified, true)
  assert.equal(decodedAudio.avSyncOutcome, 'passed')
  assert.ok(Number(decodedAudio.avSyncDriftFrames) <= 2)
  assert.equal(audioQuality.integratedLufsWithinPolicy, true)
  assert.equal(audioQuality.truePeakWithinPolicy, true)
  assert.equal(audioQuality.loudnessRangeWithinPolicy, true)
  assert.equal(audioQuality.decodedSignalFinite, true)
  assert.equal(audioQuality.unexpectedSilenceCount, 0)
  assert.equal(speechClarity.ffmpegClaimedSpeechUnderstanding, false)
  assert.equal(audioResult.readiness.speechClarityEvidenceReconciled, true)
  assert.equal(audioResult.readiness.productReady, false)

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

  const reviewResult = await runtime.executeFinalMasterVideoQaServerInjected(
    buildOfflineFinalMasterVideoQaRequest({
      planningPayload: {
        ...videoRequest.payload,
        visualExceptionManifest:
          sealOfflineFinalMasterVisualExceptionManifest([]),
      },
      finalMaster,
    }),
    privateInput,
  )
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
  await assert.rejects(() =>
    runtime.executeFinalMasterVideoQaServerInjected(
      videoRequest,
      Object.freeze({
        ...privateInput,
        async openStream() { return Readable.from([tamperedBytes]) },
      }),
    ), /exact|checksum|commitment|verification/iu)

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
    videoOutcome: videoDocument.outcome,
    audioOutcome: audioDocument.outcome,
    silentMasterOutcome: silentAudioResult.resultJson.document.outcome,
    unapprovedIntentionalFreezeOutcome:
      reviewResult.resultJson.document.outcome,
    exactInputTamperRejected: true,
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
  ])
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
