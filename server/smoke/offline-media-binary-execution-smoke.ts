import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
} from '../../src/types/canonical-private-composition-capacity'

import {
  deriveCanonicalStorytellingSpeechSourceAuthorityDigest,
} from '../edit-architecture/canonical-storytelling-speech-normalization-authority'
import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineMediaBinaryMezzanineFinalizationRequest,
  deriveOfflineMediaBinaryRuntimeStorageScope,
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_ROOT,
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_SCOPE_HASH,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  type OfflineMediaBinaryStreamingOutputSink,
} from '../tool-execution/media-binary-execution'
import {
  PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC,
  normalizePrivateMediaCgroupResourceObservation,
} from '../tool-execution/media-binary-execution/private-media-cgroup-resource-observation'
import type {
  PrivateEmbeddedProcessResourceObservation,
} from '../tool-execution/private-embedded-process-resource-observation'

const hashBytes = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex')
const hashText = (value: string) => hashBytes(Buffer.from(value, 'utf8'))
const privateStreamInput = (bytes: Buffer) => Object.freeze({
  inputMode: 'private_verified_stream_v1' as const,
  byteLength: bytes.byteLength,
  sha256: hashBytes(bytes),
  async openStream() { return Readable.from([bytes]) },
})

const fixturePath = join('/tmp', `reeditpro-offline-ffprobe-${process.pid}.mp4`)
const generated = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=24:d=2',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
  '-threads', '1', '-y', fixturePath,
], { encoding: 'utf8' })
assert.equal(generated.status, 0, generated.stderr)
const sourceBytes = await readFile(fixturePath)
await rm(fixturePath, { force: true })
const sourceAuthority = {
  mimeType: 'video/mp4' as const,
  sourceByteLength: sourceBytes.byteLength,
  sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
  sourceBytesBase64: sourceBytes.toString('base64'),
}

const matchFixturePath = join('/tmp', `reeditpro-offline-ffmpeg-match-${process.pid}.mp4`)
const generatedMatch = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=0x0010F0:s=320x180:r=24:d=2',
  '-f', 'lavfi', '-i', 'sine=frequency=520:sample_rate=48000:duration=2',
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
  '-threads', '1', '-y', matchFixturePath,
], { encoding: 'utf8' })
assert.equal(generatedMatch.status, 0, generatedMatch.stderr)
const matchSourceBytes = await readFile(matchFixturePath)
await rm(matchFixturePath, { force: true })
const matchSourceAuthority = {
  mimeType: 'video/mp4' as const,
  sourceByteLength: matchSourceBytes.byteLength,
  sourceSha256: createHash('sha256').update(matchSourceBytes).digest('hex'),
  sourceBytesBase64: matchSourceBytes.toString('base64'),
}
assert.notEqual(matchSourceAuthority.sourceSha256, sourceAuthority.sourceSha256)

const runtime = await activatePrivateOfflineMediaBinaryRuntime()
const foreignCheckoutScope = deriveOfflineMediaBinaryRuntimeStorageScope(
  'file:///Volumes/REeditproWork/foreign-checkout/server/tool-execution/media-binary-execution/offline-media-binary-runtime.ts',
)
assert.notEqual(
  foreignCheckoutScope.scopeHash,
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_SCOPE_HASH,
)
assert.notEqual(
  foreignCheckoutScope.storageRoot,
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_ROOT,
)
assert.equal(
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_ROOT.endsWith(
    OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_SCOPE_HASH.slice(0, 24),
  ),
  true,
)
const request = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffprobe' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
  payload: {
    inspectionProfileId: 'source_intake_v1' as const,
    countFrames: true,
    verifyDurationAndSync: true as const,
    emitMachineJsonOnly: true as const,
    ...sourceAuthority,
  },
}
const result = await runtime.execute(request)
assert.equal(result.evidence.toolId, 'ffprobe')
assert.equal(result.evidence.binaryVersion, '8.1.2')
assert.equal(result.evidence.sourceSha256, sourceAuthority.sourceSha256)
assert.equal(result.evidence.containerExitCode, 0)
assert.equal(result.evidence.oomKilled, false)
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.evidence.confinement.callerMountsPresent, false)
assert.equal(result.evidence.confinement.serverDerivedArgumentsOnly, true)
assert.equal(
  result.evidence.confinement.resourceObserverEntrypoint,
  '/usr/local/bin/reeditpro-media-cgroup-resource-observer',
)
assert.equal(result.evidence.confinement.cgroupV2ResourceObservationRequired, true)
assertMediaAttemptResourceObservation(
  result.evidence.resourceObservation,
  result.evidence.confinement.memoryLimitBytes,
)
assert.equal(result.readiness.productReady, false)
assert.equal(result.image.productReady, false)
assert.equal(result.image.h264Encoding, 'blocked_not_compiled')
assert.equal(result.resultJson.document.streamCount, 2)
assert.equal(result.resultJson.document.durationSeconds, 2)
assert.equal(result.resultJson.sha256, createHash('sha256').update(result.resultJson.bytes).digest('hex'))

const ffmpegRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_trim_transcode_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    trimStartFrame: 12,
    trimEndFrameExclusive: 36,
    frameRate: 24 as const,
    ...sourceAuthority,
  },
}
const ffmpegResult = await runtime.execute(ffmpegRequest)
assert.equal(ffmpegResult.evidence.toolId, 'ffmpeg')
assert.equal(ffmpegResult.evidence.binaryVersion, '8.1.2')
assert.equal(ffmpegResult.evidence.sourceSha256, sourceAuthority.sourceSha256)
assert.equal(ffmpegResult.resultArtifact.mimeType, 'video/x-nut')
assert.ok(ffmpegResult.resultArtifact.byteLength > 64)
assert.equal(ffmpegResult.resultArtifact.sha256,
  createHash('sha256').update(ffmpegResult.resultArtifact.bytes).digest('hex'))
assert.equal(ffmpegResult.evidence.semanticEvidence.outputFrameCount, 24)
assert.equal(ffmpegResult.evidence.semanticEvidence.outputContainer, 'nut')
assert.equal(ffmpegResult.evidence.semanticEvidence.outputVideoCodec, 'ffv1')
assert.equal(ffmpegResult.evidence.semanticEvidence.outputProbeVerified, true)
assert.equal(ffmpegResult.evidence.confinement.serverOwnedEntrypoint,
  '/opt/reeditpro-ffmpeg/bin/ffmpeg')
assertMediaAttemptResourceObservation(
  ffmpegResult.evidence.resourceObservation,
  ffmpegResult.evidence.confinement.memoryLimitBytes,
)
const ffmpegReplay = await runtime.execute(ffmpegRequest)
assert.equal(ffmpegReplay.resultArtifact.sha256, ffmpegResult.resultArtifact.sha256)

const frameRateNormalizedTrimRequest = {
  ...ffmpegRequest,
  payload: {
    ...ffmpegRequest.payload,
    trimStartFrame: 15,
    trimEndFrameExclusive: 45,
    frameRate: 30 as const,
  },
}
const frameRateNormalizedTrim = await runtime.execute(
  frameRateNormalizedTrimRequest,
)
assert.equal(
  frameRateNormalizedTrim.evidence.semanticEvidence.outputFrameCount,
  30,
)
assert.equal(
  frameRateNormalizedTrim.evidence.semanticEvidence.outputProbeVerified,
  true,
)

const voiceDeliveryRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_voice_delivery_wav_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    trimStartFrame: 12,
    trimEndFrameExclusive: 36,
    frameRate: 24 as const,
    sampleRate: 48_000 as const,
    channelMode: 'stereo' as const,
    targetLufs: -14 as const,
    truePeakDbtp: -1 as const,
    loudnessRangeLufs: 7 as const,
    highpassHz: 70 as const,
    compressorPreset: 'gentle_voice_v1' as const,
    ...sourceAuthority,
  },
}
const voiceDeliveryResult = await runtime.execute(voiceDeliveryRequest)
assert.equal(voiceDeliveryResult.resultArtifact.mimeType, 'audio/wav')
assert.equal(voiceDeliveryResult.resultArtifact.bytes.subarray(0, 4).toString('ascii'), 'RIFF')
assert.equal(voiceDeliveryResult.resultArtifact.bytes.subarray(8, 12).toString('ascii'), 'WAVE')
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.recipeProfileId, 'approved_voice_delivery_wav_v1')
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.outputAudioCodec, 'pcm_s16le')
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.outputSampleRate, 48_000)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.outputChannels, 2)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.highpassApplied, true)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.gentleCompressionApplied, true)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.loudnessNormalizationApplied, true)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.truePeakLimiterApplied, true)
assert.equal(voiceDeliveryResult.evidence.semanticEvidence.outputProbeVerified, true)
const voiceDeliveryReplay = await runtime.execute(voiceDeliveryRequest)
assert.equal(voiceDeliveryReplay.resultArtifact.sha256, voiceDeliveryResult.resultArtifact.sha256)

const speechMp3Path = join('/tmp', `reeditpro-storytelling-speech-${process.pid}.mp3`)
const generatedSpeechMp3 = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'sine=frequency=330:sample_rate=48000:duration=1',
  '-map', '0:a:0', '-vn', '-ar', '48000', '-ac', '1',
  '-c:a', 'libmp3lame', '-b:a', '96k', '-threads', '1', '-y', speechMp3Path,
], { encoding: 'utf8' })
assert.equal(generatedSpeechMp3.status, 0, generatedSpeechMp3.stderr)
const speechMp3Bytes = await readFile(speechMp3Path)
await rm(speechMp3Path, { force: true })
const speechAuthorityBase = {
  recipeProfileId: 'approved_storytelling_speech_take_normalization_v1' as const,
  timestampPolicy: 'normalize_from_zero' as const,
  overwriteExistingArtifact: false as const,
  allowUnreviewedCodec: false as const,
  sampleRate: 48_000 as const,
  channelMode: 'mono' as const,
  sampleFormat: 'pcm_s16le' as const,
  metadataPolicy: 'strip_all' as const,
  maximumDurationSeconds: 30 as const,
  productionId: 'storytelling-production-fixture',
  productionAuthorityHash: hashText('storytelling-production-authority'),
  preparedScriptSegmentId: 'prepared-script-segment-fixture',
  sceneId: 'storytelling-scene-fixture',
  voiceBibleVersionId: 'voice-bible-version-fixture',
  voiceBibleContentDigest: hashText('voice-bible-content'),
  spokenTextDigest: hashText('spoken-text'),
  timingAuthorityDigest: hashText('speech-timing-authority'),
  startFrame: 0,
  endFrameExclusive: 24,
  frameRate: 24 as const,
  sourceProviderOperationId:
    'provider.elevenlabs.generate_storytelling_speech_candidate.v1' as const,
  sourceAudioRole: 'provider_storytelling_speech_audio_mp3' as const,
  sourceAlignmentRole: 'provider_storytelling_speech_alignment_json' as const,
  alignmentBoundToExactSourceAudio: true as const,
}
const speechPlanningPayload = {
  ...speechAuthorityBase,
  sourceAuthorityDigest:
    deriveCanonicalStorytellingSpeechSourceAuthorityDigest(speechAuthorityBase),
}
const speechMp3Sha256 = hashBytes(speechMp3Bytes)
const speechNormalizationRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    ...speechPlanningPayload,
    mimeType: 'audio/mpeg' as const,
    sourceByteLength: speechMp3Bytes.byteLength,
    sourceSha256: speechMp3Sha256,
    sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  },
}
let normalizedSpeechBytes = Buffer.alloc(0)
const speechNormalizationResult = await runtime.executeServerInjectedStreamingOutput(
  speechNormalizationRequest,
  privateStreamInput(speechMp3Bytes), {
  maximumBytes: OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
  async persist(output) {
    const chunks: Buffer[] = []
    for await (const chunk of output.stream) chunks.push(Buffer.from(chunk))
    normalizedSpeechBytes = Buffer.concat(chunks)
    assert.equal(normalizedSpeechBytes.byteLength, output.expectedByteLength)
    assert.equal(hashBytes(normalizedSpeechBytes), output.expectedSha256)
    assert.equal(output.mimeType, 'audio/wav')
    return {
      byteLength: normalizedSpeechBytes.byteLength,
      sha256: hashBytes(normalizedSpeechBytes),
    }
  },
  },
)
assert.equal(speechNormalizationResult.resultArtifact.mimeType, 'audio/wav')
assert.equal(normalizedSpeechBytes.subarray(0, 4).toString('ascii'), 'RIFF')
assert.equal(speechNormalizationResult.evidence.semanticEvidence.outputChannels, 1)
assert.equal(speechNormalizationResult.evidence.semanticEvidence.outputSampleRate, 48_000)
assert.equal(speechNormalizationResult.evidence.semanticEvidence.metadataStripped, true)
assert.equal(speechNormalizationResult.evidence.semanticEvidence.timeStretchApplied, false)
assert.equal(
  speechNormalizationResult.evidence.semanticEvidence.sourceAuthorityDigest,
  speechPlanningPayload.sourceAuthorityDigest,
)
assertMediaAttemptResourceObservation(
  speechNormalizationResult.evidence.resourceObservation,
  speechNormalizationResult.evidence.confinement.memoryLimitBytes,
)

const colorDeliveryRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_source_color_delivery_matroska_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    trimStartFrame: 0,
    trimEndFrameExclusive: 48,
    frameRate: 24 as const,
    colorGradeStyle: 'premium_clean' as const,
    intensity: 'balanced' as const,
    approvedColorOperationIds: [
      'color-fixture-clarity',
      'color-fixture-contrast-curve',
      'color-fixture-exposure-correction',
      'color-fixture-highlight-recovery',
      'color-fixture-look-transform',
      'color-fixture-qa-histogram-check',
      'color-fixture-white-balance',
    ],
    approvedColorOperationKinds: [
      'clarity' as const,
      'contrast_curve' as const,
      'exposure_correction' as const,
      'highlight_recovery' as const,
      'look_transform' as const,
      'qa_histogram_check' as const,
      'white_balance' as const,
    ],
    analysisProfileId: 'approved_three_frame_rgb_stats_v1' as const,
    correctionProfileId: 'bounded_professional_source_color_v1' as const,
    outputColorSpace: 'bt709' as const,
    outputPixelFormat: 'yuv420p' as const,
    preserveAudio: false as const,
    ...sourceAuthority,
  },
}
const colorDeliveryResult = await runtime.execute(colorDeliveryRequest)
const colorEvidence = colorDeliveryResult.evidence.semanticEvidence
assert.equal(colorDeliveryResult.resultArtifact.mimeType, 'video/x-matroska')
assert.deepEqual(
  [...colorDeliveryResult.resultArtifact.bytes.subarray(0, 4)],
  [0x1a, 0x45, 0xdf, 0xa3],
)
assert.equal(colorEvidence.recipeProfileId, 'approved_source_color_delivery_matroska_v1')
assert.equal(colorEvidence.outputFrameCount, 48)
assert.equal(colorEvidence.outputContainer, 'matroska')
assert.equal(colorEvidence.outputVideoCodec, 'vp9')
assert.equal(colorEvidence.outputColorSpace, 'bt709')
assert.equal(colorEvidence.outputPixelFormat, 'yuv420p')
assert.equal(colorEvidence.sourcePixelAnalysisExecuted, true)
assert.equal(colorEvidence.outputPixelAnalysisExecuted, true)
assert.equal(colorEvidence.boundedAutoExposureApplied, true)
assert.equal(colorEvidence.boundedWhiteBalanceApplied, true)
assert.equal(colorEvidence.plannedLookApplied, true)
assert.equal(colorEvidence.lgplColorChannelMixerApplied, true)
assert.equal(colorEvidence.lgplColorLevelsApplied, true)
assert.equal(colorEvidence.lgplClarityFilterApplied, true)
assert.equal(colorEvidence.clippingProtectionVerified, true)
assert.equal(colorEvidence.histogramQaPassed, true)
assert.equal(colorEvidence.outputProbeVerified, true)
assert.deepEqual(colorEvidence.approvedColorOperationIds,
  colorDeliveryRequest.payload.approvedColorOperationIds)
assert.deepEqual(colorEvidence.approvedColorOperationKinds,
  colorDeliveryRequest.payload.approvedColorOperationKinds)
assert.notDeepEqual(colorEvidence.sourcePixelAnalysis, colorEvidence.outputPixelAnalysis)
assert.notEqual(colorDeliveryResult.resultArtifact.sha256, sourceAuthority.sourceSha256)
const colorDeliveryReplay = await runtime.execute(colorDeliveryRequest)
assert.equal(colorDeliveryReplay.resultArtifact.sha256, colorDeliveryResult.resultArtifact.sha256)

const frameRateNormalizedColorRequest = {
  ...colorDeliveryRequest,
  payload: {
    ...colorDeliveryRequest.payload,
    trimEndFrameExclusive: 60,
    frameRate: 30 as const,
  },
}
const frameRateNormalizedColor = await runtime.execute(
  frameRateNormalizedColorRequest,
)
assert.equal(
  frameRateNormalizedColor.evidence.semanticEvidence.outputFrameCount,
  60,
)
assert.equal(
  frameRateNormalizedColor.evidence.semanticEvidence
    .timelineFrameRateNormalizationApplied,
  true,
)
assert.equal(
  frameRateNormalizedColor.evidence.semanticEvidence.outputProbeVerified,
  true,
)
const independentlyProbedNormalizedColor = spawnSync('ffprobe', [
  '-v', 'error', '-count_frames',
  '-show_entries', 'stream=codec_name,avg_frame_rate,nb_read_frames',
  '-of', 'json', '-i', 'pipe:0',
], {
  input: frameRateNormalizedColor.resultArtifact.bytes,
  maxBuffer: 4 * 1024 * 1024,
})
assert.equal(
  independentlyProbedNormalizedColor.status,
  0,
  independentlyProbedNormalizedColor.stderr.toString('utf8'),
)
const normalizedColorProbe = JSON.parse(
  independentlyProbedNormalizedColor.stdout.toString('utf8'),
) as {
  streams: Array<{
    codec_name?: string
    avg_frame_rate?: string
    nb_read_frames?: string
  }>
}
assert.deepEqual(normalizedColorProbe.streams[0], {
  codec_name: 'vp9',
  avg_frame_rate: '30/1',
  nb_read_frames: '60',
})

const colorMatchRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_source_color_match_delivery_matroska_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    trimStartFrame: 0,
    trimEndFrameExclusive: 48,
    frameRate: 24 as const,
    colorGradeStyle: 'premium_clean' as const,
    intensity: 'balanced' as const,
    approvedColorOperationIds: [
      ...colorDeliveryRequest.payload.approvedColorOperationIds,
      'color-fixture-shot-matching',
    ].sort(),
    approvedColorOperationKinds: [
      ...colorDeliveryRequest.payload.approvedColorOperationKinds,
      'shot_matching' as const,
    ].sort(),
    analysisProfileId: 'approved_three_frame_rgb_stats_v1' as const,
    correctionProfileId: 'bounded_reference_matched_professional_source_color_v1' as const,
    shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1' as const,
    referenceSourceSequenceItemId: 'fixture-reference-source',
    referenceDurationFrames: 48,
    referenceOutputKey: 'fixture-reference-color-mkv',
    outputColorSpace: 'bt709' as const,
    outputPixelFormat: 'yuv420p' as const,
    preserveAudio: false as const,
    ...matchSourceAuthority,
    referenceMimeType: 'video/x-matroska' as const,
    referenceSourceByteLength: colorDeliveryResult.resultArtifact.byteLength,
    referenceSourceSha256: colorDeliveryResult.resultArtifact.sha256,
    referenceSourceBytesBase64: colorDeliveryResult.resultArtifact.bytes.toString('base64'),
  },
}
const colorMatchResult = await runtime.execute(colorMatchRequest)
const colorMatchEvidence = colorMatchResult.evidence.semanticEvidence
assert.equal(colorMatchResult.resultArtifact.mimeType, 'video/x-matroska')
assert.equal(colorMatchResult.evidence.referenceSourceSha256,
  colorDeliveryResult.resultArtifact.sha256)
assert.equal(colorMatchEvidence.referenceBoundShotMatchingApplied, true)
assert.equal(colorMatchEvidence.referenceSourceSequenceItemId, 'fixture-reference-source')
assert.equal(colorMatchEvidence.referenceOutputKey, 'fixture-reference-color-mkv')
assert.equal(colorMatchEvidence.referencePixelAnalysisExecuted, true)
assert.equal(
  (colorMatchEvidence.referenceMatchQa as { passed: boolean }).passed,
  true,
)
assert.notEqual(colorMatchResult.resultArtifact.sha256, matchSourceAuthority.sourceSha256)
const colorMatchReplay = await runtime.execute(colorMatchRequest)
assert.equal(colorMatchReplay.resultArtifact.sha256, colorMatchResult.resultArtifact.sha256)

const mezzanineFrameRate = 24 as const
const mezzanineChunkFrames = 121
const mezzanineDurationFrames = mezzanineChunkFrames * 2
const mezzanineChunkAudioDurationSeconds =
  mezzanineChunkFrames / mezzanineFrameRate + 0.05
const mezzanineChunkPaths = [
  join('/tmp', `reeditpro-mezzanine-chunk-1-${process.pid}.mp4`),
  join('/tmp', `reeditpro-mezzanine-chunk-2-${process.pid}.mp4`),
]
for (const [index, path] of mezzanineChunkPaths.entries()) {
  const videoOnlyPath = `${path}.video-only.mp4`
  const generatedVideo = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `color=c=${index === 0 ? '0x2646A8' : '0xA84626'}:s=2160x2160:r=24`,
    '-frames:v', String(mezzanineChunkFrames),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-x264-params',
    `keyint=${mezzanineChunkFrames}:min-keyint=${mezzanineChunkFrames}:scenecut=0:open-gop=0:colorprim=bt709:transfer=bt709:colormatrix=bt709`,
    '-bf', '0', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-an', '-movflags', '+faststart', '-threads', '1', '-y', videoOnlyPath,
  ], { encoding: 'utf8' })
  assert.equal(generatedVideo.status, 0, generatedVideo.stderr)
  const muxedChunk = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-i', videoOnlyPath,
    '-f', 'lavfi', '-i',
    `sine=frequency=${index === 0 ? 540 : 720}:sample_rate=48000:duration=${mezzanineChunkAudioDurationSeconds.toFixed(9)}`,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-ac', '2',
    '-t', mezzanineChunkAudioDurationSeconds.toFixed(9),
    '-movflags', '+faststart', '-threads', '1', '-y', path,
  ], { encoding: 'utf8' })
  await rm(videoOnlyPath, { force: true })
  assert.equal(muxedChunk.status, 0, muxedChunk.stderr)
}
const mezzanineChunkBytes = await Promise.all(
  mezzanineChunkPaths.map((path) => readFile(path)),
)
await Promise.all(mezzanineChunkPaths.map((path) => rm(path, { force: true })))
const mezzanineSourcePath = join(
  '/tmp',
  `reeditpro-mezzanine-source-${process.pid}.mp4`,
)
const mezzanineDurationSeconds = mezzanineDurationFrames / mezzanineFrameRate
const generatedMezzanineSource = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i',
  `color=c=black:s=320x180:r=24:d=${mezzanineDurationSeconds.toFixed(9)}`,
  '-f', 'lavfi', '-i',
  `sine=frequency=660:sample_rate=48000:duration=${mezzanineDurationSeconds.toFixed(9)}`,
  '-map', '0:v:0', '-map', '1:a:0',
  '-frames:v', String(mezzanineDurationFrames),
  '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
  '-movflags', '+faststart', '-threads', '1', '-y', mezzanineSourcePath,
], { encoding: 'utf8' })
assert.equal(generatedMezzanineSource.status, 0, generatedMezzanineSource.stderr)
const mezzanineSourceBytes = await readFile(mezzanineSourcePath)
await rm(mezzanineSourcePath, { force: true })
const mezzaninePlanningPayload = {
  recipeProfileId: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE,
  capacityProfileId: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  width: 2160 as const,
  height: 2160 as const,
  fps: mezzanineFrameRate,
  durationFrames: mezzanineDurationFrames,
  sourceSequenceItemId: 'mezzanine-source-fixture',
  sourceCleanupDecisionId: 'mezzanine-cleanup-fixture',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: mezzanineDurationFrames,
  chunks: [
    {
      outputKey: 'mezzanine-chunk-output-1', chunkIndex: 1, chunkCount: 2,
      globalStartFrame: 0, globalEndFrameExclusive: mezzanineChunkFrames,
      durationFrames: mezzanineChunkFrames, sourceSliceKey: 'source-slice-1-of-2',
      sourceStartFrame: 0, sourceEndFrameExclusive: mezzanineChunkFrames,
    },
    {
      outputKey: 'mezzanine-chunk-output-2', chunkIndex: 2, chunkCount: 2,
      globalStartFrame: mezzanineChunkFrames,
      globalEndFrameExclusive: mezzanineDurationFrames,
      durationFrames: mezzanineChunkFrames, sourceSliceKey: 'source-slice-2-of-2',
      sourceStartFrame: mezzanineChunkFrames,
      sourceEndFrameExclusive: mezzanineDurationFrames,
    },
  ],
  chunkBoundaryContinuity: [{
    boundaryFrame: mezzanineChunkFrames,
    previousSourceEndFrameExclusive: mezzanineChunkFrames,
    nextSourceStartFrame: mezzanineChunkFrames,
    fromSourceSliceKey: 'source-slice-1-of-2',
    toSourceSliceKey: 'source-slice-2-of-2',
  }],
  videoFinalizationPolicy: 'compatible_h264_stream_copy_v1' as const,
  audioFinalizationPolicy: 'single_approved_source_audio_encode_v1' as const,
  codecCompatibilityPolicy: 'exact_h264_extradata_timebase_frame_color_v1' as const,
  timestampPolicy: 'normalize_from_zero' as const,
  outputContainer: 'mp4' as const,
  outputVideoCodec: 'copy_h264' as const,
  outputAudioCodec: 'aac_lc' as const,
  audioSampleRate: 48_000 as const,
  audioChannels: 2 as const,
  audioBitrateKbps: 192 as const,
  renderPurpose: 'private_4k_delivery_master_v1' as const,
  deliveryProfileId: 'uhd_2160' as const,
  estimateCostBasisProfileId: 'uhd_2160' as const,
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1' as const,
  usesApprovedEditReservation: true as const,
  requiresSeparateExportEstimate: false as const,
  allowsAdditionalExportCharge: false as const,
}
const mezzanineRequest = buildOfflineMediaBinaryMezzanineFinalizationRequest({
  planningPayload: mezzaninePlanningPayload,
  chunks: mezzanineChunkBytes.map((bytes, index) => ({
    inputId: `mezzanine-chunk-input-${index + 1}`,
    outputKey: `mezzanine-chunk-output-${index + 1}`,
    chunkIndex: index + 1,
    mimeType: 'video/mp4' as const,
    byteLength: bytes.byteLength,
    sha256: hashBytes(bytes),
  })),
  source: {
    inputId: 'mezzanine-source-input',
    sourceSequenceItemId: 'mezzanine-source-fixture',
    mimeType: 'video/mp4' as const,
    byteLength: mezzanineSourceBytes.byteLength,
    sha256: hashBytes(mezzanineSourceBytes),
  },
})
const mezzanineInputs = {
  chunks: mezzanineChunkBytes.map(privateStreamInput),
  source: privateStreamInput(mezzanineSourceBytes),
}
let mezzanineOutputBytes: Buffer = Buffer.alloc(0)
const createMezzanineOutputSink = (capture: (bytes: Buffer) => void) => ({
  maximumBytes: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
  async persist(input: {
    stream: Readable
    mimeType: 'video/x-matroska' | 'audio/wav' | 'video/mp4'
    expectedByteLength: number
    expectedSha256: string
  }) {
    assert.equal(input.mimeType, 'video/mp4')
    const chunks: Buffer[] = []
    for await (const chunk of input.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const bytes = Buffer.concat(chunks)
    assert.equal(bytes.byteLength, input.expectedByteLength)
    assert.equal(hashBytes(bytes), input.expectedSha256)
    capture(bytes)
    return { byteLength: bytes.byteLength, sha256: hashBytes(bytes) }
  },
})
const mezzanineResult = await runtime.executeMezzanineFinalizationServerInjected(
  mezzanineRequest,
  mezzanineInputs,
  createMezzanineOutputSink((bytes) => { mezzanineOutputBytes = bytes }),
)
assert.equal(mezzanineResult.resultArtifact.mimeType, 'video/mp4')
assert.equal(mezzanineResult.resultArtifact.outputMode, 'server_committed_private_stream_v1')
assert.equal(mezzanineResult.resultArtifact.sha256, hashBytes(mezzanineOutputBytes))
assert.equal(mezzanineOutputBytes.subarray(4, 8).toString('ascii'), 'ftyp')
assert.equal(
  mezzanineResult.image.aacEncoding,
  'private_source_slice_finalizer_and_customer_delivery_mux_only',
)
assert.equal(
  mezzanineResult.image.mp4Mux,
  'private_source_slice_finalizer_and_customer_delivery_mux_only',
)
assert.equal(mezzanineResult.evidence.confinement.serverOwnedEntrypoint,
  '/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer')
assert.equal(mezzanineResult.evidence.confinement.memoryLimitBytes, 4_294_967_296)
assert.equal(mezzanineResult.evidence.confinement.tmpfsSizeBytes, 1_342_177_280)
assert.equal(
  mezzanineResult.evidence.semanticEvidence.h264VideoStreamCopiedWithoutDecodeOrReencode,
  true,
)
assert.equal(mezzanineResult.evidence.semanticEvidence.sourceAudioDecodedAndEncodedOnce, true)
assert.equal(mezzanineResult.evidence.semanticEvidence.chunkBoundaryContinuityVerified, true)
assert.equal(mezzanineResult.evidence.semanticEvidence.frameDerivedConcatDurationsApplied, true)
assert.equal(
  mezzanineResult.evidence.semanticEvidence
    .outputTimestampsNormalizedFromZeroWithinOneFrame,
  true,
)
assert.equal(mezzanineResult.evidence.semanticEvidence.additionalExportChargeAllowed, false)
const independentMezzanineProbe = spawnSync('ffprobe', [
  '-v', 'error', '-count_frames', '-show_entries',
  'format=format_name,duration:stream=codec_name,codec_type,width,height,avg_frame_rate,nb_read_frames,sample_rate,channels',
  '-of', 'json', '-i', 'pipe:0',
], { input: mezzanineOutputBytes, maxBuffer: 4 * 1024 * 1024 })
assert.equal(independentMezzanineProbe.status, 0,
  independentMezzanineProbe.stderr.toString('utf8'))
const independentMezzanineDocument = JSON.parse(
  independentMezzanineProbe.stdout.toString('utf8'),
) as {
  streams: Array<Record<string, string | number>>
  format: Record<string, string>
}
const independentMezzanineVideo = independentMezzanineDocument.streams.find(
  (stream) => stream.codec_type === 'video',
)
const independentMezzanineAudio = independentMezzanineDocument.streams.find(
  (stream) => stream.codec_type === 'audio',
)
assert.equal(independentMezzanineVideo?.codec_name, 'h264')
assert.equal(Number(independentMezzanineVideo?.nb_read_frames), mezzanineDurationFrames)
assert.equal(independentMezzanineAudio?.codec_name, 'aac')
assert.equal(Number(independentMezzanineAudio?.sample_rate), 48_000)
assert.equal(Number(independentMezzanineAudio?.channels), 2)
let replayMezzanineOutput: Buffer = Buffer.alloc(0)
const mezzanineReplay = await runtime.executeMezzanineFinalizationServerInjected(
  mezzanineRequest,
  mezzanineInputs,
  createMezzanineOutputSink((bytes) => { replayMezzanineOutput = bytes }),
)
assert.equal(mezzanineReplay.resultArtifact.sha256, mezzanineResult.resultArtifact.sha256)
assert.equal(hashBytes(replayMezzanineOutput), hashBytes(mezzanineOutputBytes))
assert.throws(() => buildOfflineMediaBinaryMezzanineFinalizationRequest({
  planningPayload: {
    ...mezzaninePlanningPayload,
    command: 'ffmpeg -i caller.mp4',
  },
  chunks: mezzanineRequest.inputs.chunks,
  source: mezzanineRequest.inputs.source,
}))
assert.throws(() => buildOfflineMediaBinaryMezzanineFinalizationRequest({
  planningPayload: mezzaninePlanningPayload,
  chunks: [...mezzanineRequest.inputs.chunks].reverse(),
  source: mezzanineRequest.inputs.source,
}))
await assertRejects(() => runtime.executeMezzanineFinalizationServerInjected(
  mezzanineRequest,
  {
    ...mezzanineInputs,
    chunks: [
      { ...mezzanineInputs.chunks[0]!, sha256: 'f'.repeat(64) },
      mezzanineInputs.chunks[1]!,
    ],
  },
  createMezzanineOutputSink(() => undefined),
))

const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
assert(authority)
assert.equal(
  authority.storageScopeHash,
  OFFLINE_MEDIA_BINARY_RUNTIME_STORAGE_SCOPE_HASH,
)
assert.equal(authority.readiness.privateInternalExecutionReady, true)
assert.equal(authority.readiness.privateGenericMediaResourceObservationReady, true)
assert.equal(
  authority.readiness.privateInternalStorytellingSpeechNormalizationReady,
  true,
)
assert.equal(authority.readiness.finalExportReady, false)
assert.deepEqual(
  authority.supportedOperations.map((operation) => operation.operationId),
  [
    OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix,
    OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
  ],
)
assert.equal(
  authority.image.imageTag,
  'reeditpro/ffmpeg-lgpl-internal:8.1.2-object-chunk-v8-local',
)
assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash)
const reopened = await openPrivateOfflineMediaBinaryRuntime()
assert.equal(reopened.image.imageIdentityHash, runtime.image.imageIdentityHash)
const replay = await reopened.execute(request)
assert.equal(replay.resultJson.sha256, result.resultJson.sha256)

await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, sourceSha256: 'f'.repeat(64) },
}))
await assertRejects(() => runtime.executeServerInjectedStreamingOutput({
  ...speechNormalizationRequest,
  payload: {
    ...speechNormalizationRequest.payload,
    sourceAuthorityDigest: 'f'.repeat(64),
  },
}, privateStreamInput(speechMp3Bytes), rejectStreamingSink()))
await assertRejects(() => runtime.executeServerInjectedStreamingOutput({
  ...speechNormalizationRequest,
  payload: {
    ...speechNormalizationRequest.payload,
    mimeType: 'video/mp4',
  },
}, privateStreamInput(speechMp3Bytes), rejectStreamingSink()))
await assertRejects(() => runtime.execute({
  ...colorMatchRequest,
  payload: {
    ...colorMatchRequest.payload,
    referenceSourceSha256: 'f'.repeat(64),
  },
}))
await assertRejects(() => runtime.execute({
  ...ffmpegRequest,
  payload: { ...ffmpegRequest.payload, recipeProfileId: 'final_export_h264_aac_v1' },
}))
await assertRejects(() => runtime.execute({
  ...ffmpegRequest,
  payload: { ...ffmpegRequest.payload, trimEndFrameExclusive: 12 },
}))
await assertRejects(() => runtime.execute({
  ...voiceDeliveryRequest,
  payload: { ...voiceDeliveryRequest.payload, targetLufs: -9 },
}))
await assertRejects(() => runtime.execute({
  ...colorDeliveryRequest,
  payload: {
    ...colorDeliveryRequest.payload,
    approvedColorOperationKinds: colorDeliveryRequest.payload.approvedColorOperationKinds
      .filter((kind) => kind !== 'white_balance'),
  },
}))
await assertRejects(() => runtime.execute({
  ...colorDeliveryRequest,
  payload: { ...colorDeliveryRequest.payload, arbitraryFilter: 'negate' },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, command: 'ffprobe -version' },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, path: '/tmp/source.mp4' },
}))
await assertRejects(() => runtime.execute({
  ...request,
  operationId: 'tool.ffprobe.unapproved.v1',
}))

const observerNonce = 'a'.repeat(48)
const observerMarker = [
  PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC,
  observerNonce,
  '1784592000000000000',
  '1784592000100000000',
  '1000',
  '9000',
  '1048576',
  '2097152',
  '1572864',
  '3145728',
].join('\t')
const normalizedObserver = normalizePrivateMediaCgroupResourceObservation({
  stderr: Buffer.from(`${observerMarker}\n`, 'ascii'),
  nonce: observerNonce,
  containerId: 'b'.repeat(64),
  imageId: `sha256:${'c'.repeat(64)}`,
  measurementAgentDigest: 'd'.repeat(64),
})
assert.equal(normalizedObserver.sanitizedStderr.byteLength, 0)
assert.equal(normalizedObserver.observation.observerKind, 'media_container_cgroup_v2_v1')
assert.throws(() => normalizePrivateMediaCgroupResourceObservation({
  stderr: Buffer.from(`${observerMarker}\n${observerMarker}\n`, 'ascii'),
  nonce: observerNonce,
  containerId: 'b'.repeat(64),
  imageId: `sha256:${'c'.repeat(64)}`,
  measurementAgentDigest: 'd'.repeat(64),
}))
assert.throws(() => normalizePrivateMediaCgroupResourceObservation({
  stderr: Buffer.from(`${observerMarker.replace('\t9000\t', '\t999\t')}\n`, 'ascii'),
  nonce: observerNonce,
  containerId: 'b'.repeat(64),
  imageId: `sha256:${'c'.repeat(64)}`,
  measurementAgentDigest: 'd'.repeat(64),
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pinned_ffmpeg_8_1_2_lgpl_image_identity',
    'actual_ffprobe_approved_source_inspection',
    'actual_ffmpeg_approved_frame_trim_to_ffv1_nut_intermediate',
    'actual_ffmpeg_approved_voice_delivery_pcm_wav',
    'actual_storytelling_speech_mp3_to_pcm_s16le_48khz_mono_wav',
    'storytelling_speech_exact_provider_and_alignment_authority_bound',
    'storytelling_speech_cgroup_v2_resource_observation',
    'storytelling_speech_mime_and_authority_tamper_rejected',
    'actual_ffmpeg_approved_source_color_delivery_lossless_vp9_matroska',
    'actual_three_frame_rgb_pixel_analysis_before_and_after_color_processing',
    'bounded_professional_exposure_white_balance_contrast_saturation_and_clarity_chain',
    'approved_color_operation_ids_and_kinds_preserved_in_execution_evidence',
    'color_output_reprobed_for_vp9_matroska_yuv420p_bt709_frame_count_and_rate',
    'color_histogram_and_clipping_qa_passed',
    'color_delivery_deterministic_reexecution_result',
    'actual_reference_artifact_bound_shot_match_delivery',
    'reference_output_pixel_analysis_and_objective_match_qa_passed',
    'shot_match_target_and_reference_hash_tamper_rejected',
    'shot_match_delivery_deterministic_reexecution_result',
    'voice_highpass_compression_loudness_and_true_peak_chain',
    'voice_delivery_output_reprobed_for_pcm_rate_channels_and_duration',
    'ffmpeg_output_reprobed_for_codec_container_frame_count_and_rate',
    'ffmpeg_deterministic_reexecution_result',
    'server_injected_source_checksum_and_byte_length',
    'machine_json_duration_stream_and_frame_count_normalization',
    'networkless_readonly_nonroot_no_mount_confinement',
    'exact_cgroup_v2_cpu_memory_observation_for_generic_ffmpeg_and_ffprobe',
    'multi_container_media_attempt_resource_aggregation_is_source_bound',
    'missing_duplicate_and_nonmonotonic_observer_markers_fail_closed',
    'server_owned_entrypoint_and_fixed_argument_derivation',
    'color_capable_image_tag_and_runtime_authority_namespace_are_revision_isolated',
    'checkout_scoped_runtime_authority_prevents_parallel_branch_overwrite',
    'output_sink_file_handles_close_on_success_rejection_and_early_return',
    'exact_source_slice_mezzanine_finalizer_stream_copies_h264_video',
    'exact_source_slice_mezzanine_finalizer_encodes_continuous_source_audio_once',
    'frame_derived_concat_duration_prevents_chunk_container_timing_gaps',
    'finalizer_output_reprobed_for_exact_frames_timestamps_bt709_h264_aac',
    'finalizer_replay_is_byte_identical_and_input_mutations_fail_closed',
    'original_approved_estimate_reused_without_second_export_charge',
    'checksum_protected_runtime_authority_and_restart_safe_open',
    'deterministic_reexecution_result',
    'caller_command_path_operation_and_source_tamper_rejected',
    'generic_h264_encoding_and_caller_selected_final_export_remain_blocked',
    'private_internal_only_without_product_beta_or_production_promotion',
  ],
}))

async function assertRejects(action: () => Promise<unknown>): Promise<void> {
  let rejected = false
  try { await action() } catch { rejected = true }
  assert.equal(rejected, true)
}

function rejectStreamingSink(): OfflineMediaBinaryStreamingOutputSink {
  return {
    maximumBytes: OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
    async persist() {
      throw new Error('Invalid Speech request unexpectedly reached output persistence.')
    },
  }
}

function assertMediaAttemptResourceObservation(
  observation: PrivateEmbeddedProcessResourceObservation,
  memoryLimitBytes: number,
): void {
  assert.equal(
    observation.observerKind,
    'media_container_cgroup_v2_attempt_aggregate_v1',
  )
  assert.equal(
    observation.measurementAgentVersion,
    'embedded_media_cgroup_v2_attempt_aggregate_v1',
  )
  assert.equal(observation.start.cpuUsageNanoseconds, 0)
  assert.ok(observation.finish.cpuUsageNanoseconds > 0)
  assert.ok(
    Date.parse(observation.finish.capturedAt)
    > Date.parse(observation.start.capturedAt),
  )
  assert.ok(observation.finish.memoryPeakBytes > 0)
  assert.ok(observation.finish.memoryPeakBytes <= memoryLimitBytes)
  assert.match(observation.containerIdentityDigest, /^[a-f0-9]{64}$/u)
  assert.match(observation.measurementAgentDigest, /^[a-f0-9]{64}$/u)
  assert.match(observation.observationHash, /^[a-f0-9]{64}$/u)
}
