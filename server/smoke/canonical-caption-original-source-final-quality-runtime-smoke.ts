import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import {
  mkdir,
  open,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import {
  CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateMediaArtifact,
  persistCanonicalPrivateMediaArtifactStream,
} from '../services/canonical-private-media-artifact-storage'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
  activatePrivateOfflineMediaBinaryRuntime,
  prepareOfflineMediaBinaryDockerRuntime,
  validateOfflineFfmpegStreamingExecutionRequest,
  validateOfflineFfprobeStreamingExecutionRequest,
  type OfflineMediaBinaryServerInjectedInput,
} from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../tool-execution/libass-caption-execution'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'

const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const SOURCE_START_FRAME = 242
const DURATION_FRAMES = 127
const SOURCE_END_FRAME_EXCLUSIVE = SOURCE_START_FRAME + DURATION_FRAMES
const ORIGINAL_SOURCE_FPS = 29.97003
const FPS = 30
const OUTPUT_WIDTH = 2_160
const OUTPUT_HEIGHT = 3_840
const sourcePath = resolve(
  process.env.REEDITPRO_CAPTION_FINAL_SOURCE_PATH?.trim()
    || join(homedir(), 'Documents/test video/internal testing.MP4'),
)
const outputRoot = resolve(
  process.env.REEDITPRO_CAPTION_FINAL_SOURCE_OUTPUT_ROOT?.trim()
    || join(
      homedir(),
      '.codex/private_caption_evidence',
      'caption-original-source-final-quality-2026-08-07-v1',
    ),
)
const artifactRoot = join(outputRoot, 'canonical-artifacts')
const finalFileName = 'caption-original-source-final-quality.mp4'
const inspectionIndexFileName =
  'caption-original-source-final-quality-runtime-index.json'

await mkdir(outputRoot, { recursive: true, mode: 0o700 })
const sourceCommitment = await fileCommitment(sourcePath)
assert.equal(sourceCommitment.sha256, ORIGINAL_SOURCE_SHA256)
assert.ok(sourceCommitment.byteLength > 256 * 1024 * 1024)

const preparedMedia = await prepareOfflineMediaBinaryDockerRuntime()
const media = await activatePrivateOfflineMediaBinaryRuntime()
assert.equal(media.image.imageIdentityHash, preparedMedia.imageIdentityHash)

const sourceInput = privateMediaFileInput(sourcePath, sourceCommitment)
const sourceProbe = await media.executeServerInjected(
  validateOfflineFfprobeStreamingExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'source_intake_v1',
      // Source intake only needs immutable stream metadata here. A full
      // `-count_frames` scan would decode the entire 400 MB HEVC upload before
      // the bounded approved frame range is processed below.
      countFrames: false,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/mp4',
      sourceByteLength: sourceCommitment.byteLength,
      sourceSha256: sourceCommitment.sha256,
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  }),
  sourceInput,
)
assert.ok('resultJson' in sourceProbe)
const sourceStreams = sourceProbe.resultJson.document.streams as
  Array<Record<string, unknown>>
const sourceVideo = sourceStreams.find((stream) => stream.codecType === 'video')
const sourceAudio = sourceStreams.find((stream) => stream.codecType === 'audio')
assert.deepEqual({
  codecName: sourceVideo?.codecName,
  width: sourceVideo?.width,
  height: sourceVideo?.height,
  fps: sourceVideo?.fps,
}, {
  codecName: 'hevc',
  width: 1_728,
  height: 3_072,
  fps: ORIGINAL_SOURCE_FPS,
})
assert.equal(sourceAudio?.codecName, 'aac')
assert.equal(sourceVideo?.readFrameCount, undefined)

const colorRequest = validateOfflineFfmpegStreamingExecutionRequest({
  schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  toolId: 'ffmpeg',
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_source_color_delivery_matroska_v2',
    timestampPolicy: 'normalize_from_zero',
    overwriteExistingArtifact: false,
    allowUnreviewedCodec: false,
    trimStartFrame: SOURCE_START_FRAME,
    trimEndFrameExclusive: SOURCE_END_FRAME_EXCLUSIVE,
    frameRate: FPS,
    colorGradeStyle: 'clean_natural',
    intensity: 'balanced',
    approvedColorOperationIds: [
      'caption-final-source-contrast-curve',
      'caption-final-source-exposure-correction',
      'caption-final-source-highlight-recovery',
      'caption-final-source-qa-histogram-check',
      'caption-final-source-saturation',
      'caption-final-source-white-balance',
    ],
    approvedColorOperationKinds: [
      'contrast_curve',
      'exposure_correction',
      'highlight_recovery',
      'qa_histogram_check',
      'saturation',
      'white_balance',
    ],
    analysisProfileId: 'approved_three_frame_rgb_stats_v1',
    correctionProfileId: 'bounded_professional_source_color_v1',
    outputColorSpace: 'bt709',
    outputPixelFormat: 'yuv420p',
    preserveAudio: false,
    mimeType: 'video/mp4',
    sourceByteLength: sourceCommitment.byteLength,
    sourceSha256: sourceCommitment.sha256,
    sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  },
})
const colorIdentity = hashText([
  'caption-original-source-professional-color-intermediate-v1',
  sourceCommitment.sha256,
  String(SOURCE_START_FRAME),
  String(SOURCE_END_FRAME_EXCLUSIVE),
].join('\n'))
const color = await media.executeServerInjectedStreamingOutput(
  colorRequest,
  sourceInput,
  {
    maximumBytes: CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
    async persist(output) {
      assert.equal(output.mimeType, 'video/x-matroska')
      const persisted = await persistCanonicalPrivateMediaArtifactStream({
        localStorageRoot: artifactRoot,
        privateObjectIdentityHash: colorIdentity,
        mediaFormat: 'mkv',
        stream: output.stream,
        expectedByteLength: output.expectedByteLength,
        expectedSha256: output.expectedSha256,
      })
      return {
        byteLength: persisted.byteLength,
        sha256: persisted.sha256,
      }
    },
  },
)
assert.equal(color.resultArtifact.mimeType, 'video/x-matroska')
assert.equal(color.evidence.semanticEvidence.outputFrameCount, DURATION_FRAMES)
assert.equal(color.evidence.semanticEvidence.outputColorSpace, 'bt709')
assert.equal(color.evidence.semanticEvidence.outputPixelFormat, 'yuv420p')
assert.equal(color.evidence.semanticEvidence.histogramQaPassed, true)
assert.equal(color.evidence.semanticEvidence.clippingProtectionVerified, true)
assert.equal(color.evidence.semanticEvidence.outputProbeVerified, true)
const storedColor = await inspectCanonicalPrivateMediaArtifact({
  localStorageRoot: artifactRoot,
  privateObjectIdentityHash: colorIdentity,
})
assert.ok(storedColor)
assert.equal(storedColor.sha256, color.resultArtifact.sha256)

const voiceRequest = validateOfflineFfmpegStreamingExecutionRequest({
  schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  toolId: 'ffmpeg',
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_voice_delivery_wav_v1',
    timestampPolicy: 'normalize_from_zero',
    overwriteExistingArtifact: false,
    allowUnreviewedCodec: false,
    trimStartFrame: SOURCE_START_FRAME,
    trimEndFrameExclusive: SOURCE_END_FRAME_EXCLUSIVE,
    frameRate: FPS,
    sampleRate: 48_000,
    channelMode: 'stereo',
    targetLufs: -14,
    truePeakDbtp: -1,
    loudnessRangeLufs: 7,
    highpassHz: 70,
    compressorPreset: 'gentle_voice_v1',
    mimeType: 'video/mp4',
    sourceByteLength: sourceCommitment.byteLength,
    sourceSha256: sourceCommitment.sha256,
    sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  },
})
let voiceBytes = Buffer.alloc(0)
const voice = await media.executeServerInjectedStreamingOutput(
  voiceRequest,
  sourceInput,
  {
    maximumBytes: OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
    async persist(output) {
      assert.equal(output.mimeType, 'audio/wav')
      const chunks: Buffer[] = []
      for await (const chunk of output.stream) chunks.push(Buffer.from(chunk))
      voiceBytes = Buffer.concat(chunks)
      assert.equal(voiceBytes.byteLength, output.expectedByteLength)
      assert.equal(hashBytes(voiceBytes), output.expectedSha256)
      return {
        byteLength: voiceBytes.byteLength,
        sha256: hashBytes(voiceBytes),
      }
    },
  },
)
assert.equal(voice.resultArtifact.mimeType, 'audio/wav')
assert.equal(voice.evidence.semanticEvidence.outputLoudnessQaPassed, true)
assert.equal(
  voice.evidence.semanticEvidence.exactPictureLockSampleCount,
  DURATION_FRAMES * 1_600,
)

const preparedLibass = await prepareOfflineLibassDockerRuntime()
const libass = await activatePrivateOfflineLibassCaptionRuntime()
assert.equal(libass.image.imageIdentityHash, preparedLibass.imageIdentityHash)
const captionCues = [
  {
    outputKey: 'caption-final-source-cue-1',
    startFrame: 5,
    endFrameExclusive: 38,
    caption: 'Hey guys — today.',
  },
  {
    outputKey: 'caption-final-source-cue-2',
    startFrame: 38,
    endFrameExclusive: 123,
    caption: "I'm launching my new AI software.",
  },
] as const
const captionOverlays = []
for (const cue of captionCues) {
  const result = await libass.execute({
    schemaVersion: 'offline-libass-caption-execution-v1',
    toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v2',
      collisionPolicy: 'fail_on_reserved_zone_collision',
      preserveSpeechTiming: true,
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      timestampMs: Math.round(cue.startFrame / FPS * 1_000),
      fontSize: 152,
      marginV: 360,
      alignment: 2,
      caption: cue.caption,
    },
  })
  assert.equal(result.imageArtifact.width, OUTPUT_WIDTH)
  assert.equal(result.imageArtifact.height, OUTPUT_HEIGHT)
  assert.ok(result.imageArtifact.nonTransparentPixelCount > 1_000)
  assert.ok(result.imageArtifact.alphaBoundingBox.left >= 108)
  assert.ok(
    result.imageArtifact.alphaBoundingBox.left
      + result.imageArtifact.alphaBoundingBox.width <= OUTPUT_WIDTH - 108,
  )
  assert.ok(
    result.imageArtifact.alphaBoundingBox.top
      + result.imageArtifact.alphaBoundingBox.height <= OUTPUT_HEIGHT - 192,
  )
  captionOverlays.push({
    cue,
    bytes: result.imageArtifact.bytes,
    byteLength: result.imageArtifact.byteLength,
    sha256: result.imageArtifact.sha256,
    alphaBoundingBox: result.imageArtifact.alphaBoundingBox,
  })
}

const preparedRemotion = await prepareOfflineRemotionDockerRuntime()
const remotion = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(remotion.image.imageIdentityHash, preparedRemotion.imageIdentityHash)
const remotionRequest = buildOfflineRemotionFinalCompositionStreamingRequest({
  planningPayload: {
    compositionProfileId: 'approved_source_caption_track_final_v1',
    width: OUTPUT_WIDTH,
    height: OUTPUT_HEIGHT,
    fps: FPS,
    durationFrames: DURATION_FRAMES,
    sourceStartFrame: 0,
    sourceEndFrameExclusive: DURATION_FRAMES,
    sourceFit: 'contain',
    panelBackground: '#000000',
    audioPolicy: 'replace_with_approved_voice_tracks',
    sourceMediaPolicy: 'approved_professional_color_intermediate_v1',
    renderPurpose: 'private_4k_delivery_master_v1',
    deliveryProfileId: 'uhd_2160',
    estimateCostBasisProfileId: 'uhd_2160',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    voiceTracks: [{
      sourceSequenceItemId: 'caption-final-source-sequence-1',
      outputKey: 'caption-final-source-voice-1',
      durationFrames: DURATION_FRAMES,
    }],
    captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
    captionOverlayCues: captionCues.map((cue) => ({
      outputKey: cue.outputKey,
      startFrame: cue.startFrame,
      endFrameExclusive: cue.endFrameExclusive,
    })),
  },
  source: {
    inputId: 'caption-final-source-color-intermediate',
    mimeType: 'video/x-matroska',
    byteLength: storedColor.byteLength,
    sha256: storedColor.sha256,
  },
  captionOverlays: captionOverlays.map((overlay, index) => ({
    inputId: `caption-final-source-overlay-${index + 1}`,
    outputKey: overlay.cue.outputKey,
    mimeType: 'image/png',
    byteLength: overlay.byteLength,
    sha256: overlay.sha256,
  })),
  voiceTracks: [{
    inputId: 'caption-final-source-voice',
    sourceSequenceItemId: 'caption-final-source-sequence-1',
    outputKey: 'caption-final-source-voice-1',
    durationFrames: DURATION_FRAMES,
    mimeType: 'audio/wav',
    byteLength: voiceBytes.byteLength,
    sha256: hashBytes(voiceBytes),
  }],
})
assert.doesNotMatch(
  JSON.stringify(remotionRequest),
  /bytesBase64|filePath|sourceUrl|https?:\/\//u,
)
const remotionInputs: OfflineRemotionServerInjectedInput[] = [
  {
    inputMode: 'private_verified_stream_v1',
    inputId: 'caption-final-source-color-intermediate',
    mimeType: 'video/x-matroska',
    byteLength: storedColor.byteLength,
    sha256: storedColor.sha256,
    openStream: () => storedColor.openStream(),
  },
  ...captionOverlays.map((overlay, index) => ({
    inputMode: 'private_verified_stream_v1' as const,
    inputId: `caption-final-source-overlay-${index + 1}`,
    mimeType: 'image/png' as const,
    byteLength: overlay.byteLength,
    sha256: overlay.sha256,
    async openStream() { return Readable.from([overlay.bytes]) },
  })),
  {
    inputMode: 'private_verified_stream_v1',
    inputId: 'caption-final-source-voice',
    mimeType: 'audio/wav',
    byteLength: voiceBytes.byteLength,
    sha256: hashBytes(voiceBytes),
    async openStream() { return Readable.from([voiceBytes]) },
  },
]
const finalIdentity = hashText([
  'caption-original-source-final-quality-remotion-v1',
  sourceCommitment.sha256,
  storedColor.sha256,
  ...captionOverlays.map((overlay) => overlay.sha256),
  hashBytes(voiceBytes),
].join('\n'))
const final = await remotion.executeServerInjected(
  remotionRequest,
  remotionInputs,
  {
    maximumBytes: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
    async persist(output) {
      const persisted = await persistCanonicalPrivateRemotionArtifactStream({
        localStorageRoot: artifactRoot,
        privateObjectIdentityHash: finalIdentity,
        stream: output.stream,
        expectedByteLength: output.expectedByteLength,
        expectedSha256: output.expectedSha256,
      })
      return {
        byteLength: persisted.byteLength,
        sha256: persisted.sha256,
      }
    },
  },
)
assert.equal(final.artifact.width, OUTPUT_WIDTH)
assert.equal(final.artifact.height, OUTPUT_HEIGHT)
assert.equal(final.artifact.fps, FPS)
assert.equal(final.artifact.durationFrames, DURATION_FRAMES)
assert.equal(final.evidence.semanticEvidence.approvedSourceBytesVerified, true)
assert.equal(final.evidence.semanticEvidence.approvedCaptionOverlayBytesVerified, true)
assert.equal(final.evidence.semanticEvidence.approvedCaptionTrackTimingApplied, true)
assert.equal(final.evidence.semanticEvidence.approvedVoiceTrackTimelineApplied, true)
assert.equal(final.evidence.semanticEvidence.base64MediaTransportAvoided, true)
const storedFinal = await inspectCanonicalPrivateRemotionArtifact({
  localStorageRoot: artifactRoot,
  privateObjectIdentityHash: finalIdentity,
})
assert.ok(storedFinal)
assert.equal(storedFinal.sha256, final.artifact.sha256)

const finalProbe = await media.executeServerInjected(
  validateOfflineFfprobeStreamingExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'final_export_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/mp4',
      sourceByteLength: storedFinal.byteLength,
      sourceSha256: storedFinal.sha256,
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  }),
  {
    inputMode: 'private_verified_stream_v1',
    byteLength: storedFinal.byteLength,
    sha256: storedFinal.sha256,
    openStream: () => storedFinal.openStream(),
  },
)
assert.ok('resultJson' in finalProbe)
const finalStreams = finalProbe.resultJson.document.streams as
  Array<Record<string, unknown>>
const finalVideo = finalStreams.find((stream) => stream.codecType === 'video')
const finalAudio = finalStreams.find((stream) => stream.codecType === 'audio')
assert.deepEqual({
  codecName: finalVideo?.codecName,
  width: finalVideo?.width,
  height: finalVideo?.height,
  fps: finalVideo?.fps,
  readFrameCount: finalVideo?.readFrameCount,
  pixelFormat: finalVideo?.pixelFormat,
  colorSpace: finalVideo?.colorSpace,
  colorTransfer: finalVideo?.colorTransfer,
  colorPrimaries: finalVideo?.colorPrimaries,
  colorRange: finalVideo?.colorRange,
}, {
  codecName: 'h264',
  width: OUTPUT_WIDTH,
  height: OUTPUT_HEIGHT,
  fps: FPS,
  readFrameCount: DURATION_FRAMES,
  pixelFormat: 'yuv420p',
  colorSpace: 'bt709',
  colorTransfer: 'bt709',
  colorPrimaries: 'bt709',
  colorRange: 'tv',
})
assert.equal(finalAudio?.codecName, 'aac')
assert.equal(finalAudio?.sampleRate, 48_000)

const finalPath = join(outputRoot, finalFileName)
await persistNamedCreateOnlyOrExactReplay({
  path: finalPath,
  openStream: () => storedFinal.openStream(),
  expectedByteLength: storedFinal.byteLength,
  expectedSha256: storedFinal.sha256,
})
const index = {
  schemaVersion:
    'canonical-caption-original-source-final-quality-runtime-index-v1',
  source: {
    artifactId: 'caption.original-source.internal-testing-video',
    sha256: sourceCommitment.sha256,
    byteLength: sourceCommitment.byteLength,
    mimeType: 'video/mp4',
    codec: 'hevc',
    width: 1_728,
    height: 3_072,
    fps: ORIGINAL_SOURCE_FPS,
    sourceStartFrame: SOURCE_START_FRAME,
    sourceEndFrameExclusive: SOURCE_END_FRAME_EXCLUSIVE,
    immutableSourceMasterNoProxy: true,
  },
  professionalColorIntermediate: {
    sha256: storedColor.sha256,
    byteLength: storedColor.byteLength,
    frameCount: DURATION_FRAMES,
    outputColorSpace: 'bt709',
    outputPixelFormat: 'yuv420p',
    histogramQaPassed: true,
    clippingProtectionVerified: true,
  },
  captions: captionOverlays.map((overlay) => ({
    outputKey: overlay.cue.outputKey,
    startFrame: overlay.cue.startFrame,
    endFrameExclusive: overlay.cue.endFrameExclusive,
    sha256: overlay.sha256,
    byteLength: overlay.byteLength,
    alphaBoundingBox: overlay.alphaBoundingBox,
  })),
  audio: {
    sha256: hashBytes(voiceBytes),
    byteLength: voiceBytes.byteLength,
    exactPictureLockSampleCount: DURATION_FRAMES * 1_600,
    loudnessQaPassed: true,
  },
  finalArtifact: {
    fileName: finalFileName,
    sha256: storedFinal.sha256,
    byteLength: storedFinal.byteLength,
    width: OUTPUT_WIDTH,
    height: OUTPUT_HEIGHT,
    fps: FPS,
    frameCount: DURATION_FRAMES,
    videoCodec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    audioCodec: 'aac',
    audioSampleRate: 48_000,
  },
  runtime: {
    mediaImageIdentityHash: preparedMedia.imageIdentityHash,
    libassImageIdentityHash: preparedLibass.imageIdentityHash,
    remotionImageIdentityHash: preparedRemotion.imageIdentityHash,
    sourceStreamInputVerified: true,
    colorOutputStreamedAndPersistedCreateOnly: true,
    remotionInputsStreamedWithoutBase64: true,
    finalOutputStreamedAndPersistedCreateOnly: true,
  },
  directVisualInspection: {
    required: true,
    completed: false,
    receiptRef: null,
  },
  authority: {
    privateInternalOnly: true,
    providerCallMade: false,
    modelCallMade: false,
    captionRuntimeAuthorityGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
    terminalQualificationClaimed: false,
  },
}
await writeCreateOnlyOrExactReplay(
  join(outputRoot, inspectionIndexFileName),
  Buffer.from(`${JSON.stringify(index, null, 2)}\n`),
)

process.stdout.write(`${JSON.stringify({
  status: 'actual_private_original_source_final_quality_render_completed_pending_direct_visual_inspection',
  outputRoot,
  finalFileName,
  inspectionIndexFileName,
  sourceSha256: sourceCommitment.sha256,
  colorIntermediateSha256: storedColor.sha256,
  finalArtifactSha256: storedFinal.sha256,
  finalArtifactByteLength: storedFinal.byteLength,
  outputFrame: `${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}@${FPS}`,
  durationFrames: DURATION_FRAMES,
  directVisualInspectionCompleted: false,
  terminalQualificationClaimed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)

async function fileCommitment(path: string): Promise<{
  byteLength: number
  sha256: string
}> {
  const fileStat = await stat(path)
  const checksum = createHash('sha256')
  let byteLength = 0
  for await (const chunk of createReadStream(path)) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    checksum.update(bytes)
  }
  assert.equal(byteLength, fileStat.size)
  return { byteLength, sha256: checksum.digest('hex') }
}

function privateMediaFileInput(
  path: string,
  commitment: { byteLength: number; sha256: string },
): OfflineMediaBinaryServerInjectedInput {
  return {
    inputMode: 'private_verified_stream_v1',
    byteLength: commitment.byteLength,
    sha256: commitment.sha256,
    async openStream() { return createReadStream(path) },
  }
}

async function persistNamedCreateOnlyOrExactReplay(input: {
  path: string
  openStream(): Promise<Readable>
  expectedByteLength: number
  expectedSha256: string
}): Promise<void> {
  try {
    const handle = await open(input.path, 'wx', 0o600)
    await handle.close()
    await pipeline(await input.openStream(), createWriteStream(input.path, {
      flags: 'r+',
      mode: 0o600,
    }))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }
  const persisted = await fileCommitment(input.path)
  assert.deepEqual(persisted, {
    byteLength: input.expectedByteLength,
    sha256: input.expectedSha256,
  })
}

async function writeCreateOnlyOrExactReplay(
  path: string,
  bytes: Buffer,
): Promise<void> {
  try {
    await writeFile(path, bytes, { flag: 'wx', mode: 0o600 })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    assert.deepEqual(await readFile(path), bytes)
  }
}

function hashBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
