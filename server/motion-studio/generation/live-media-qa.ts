import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  persistCanonicalPrivateGeneratedMedia,
  readCanonicalPrivateGeneratedMedia,
  type CanonicalGeneratedMediaMimeType,
} from '../../services/canonical-private-generated-media-storage'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioLiveOperationKind } from '../live-generation/types'

const MAXIMUM_MEDIA_BYTES = 100 * 1024 * 1024
const MAXIMUM_TOOL_OUTPUT_BYTES = 16 * 1024 * 1024
const ANALYSIS_WIDTH = 64
const ANALYSIS_HEIGHT = 36
const ANALYSIS_FRAME_BYTES = ANALYSIS_WIDTH * ANALYSIS_HEIGHT

export const MOTION_STUDIO_LIVE_MEDIA_QA_VERSION = 'motion-studio-live-media-qa-v1' as const
export const MOTION_STUDIO_LIVE_MEDIA_QA_THRESHOLDS_VERSION =
  'motion-studio-live-media-qa-thresholds-2026-07-15-v1' as const
export const MOTION_STUDIO_LIVE_VIDEO_NORMALIZATION_VERSION =
  'motion-studio-live-video-normalization-no-audio-faststart-v1' as const
export const MOTION_STUDIO_LIVE_HAILUO_VIDEO_NORMALIZATION_VERSION =
  'motion-studio-live-hailuo-1364x768-to-1360x768-center-crop-24fps-144f-endpad-h264-no-audio-faststart-v2' as const

export type MotionStudioLiveVideoNormalizationVersion =
  | typeof MOTION_STUDIO_LIVE_VIDEO_NORMALIZATION_VERSION
  | typeof MOTION_STUDIO_LIVE_HAILUO_VIDEO_NORMALIZATION_VERSION

export type MotionStudioLiveMediaProfile =
  | 'gpt_image_2_png_1280x720'
  | 'wan_2_7_i2v_1280x720_30fps_6s'
  | 'hailuo_2_3_fast_i2v_1360x768_24fps_6s'

export interface MotionStudioLiveMediaQaEvidenceV1 {
  schemaVersion: typeof MOTION_STUDIO_LIVE_MEDIA_QA_VERSION
  thresholdsVersion: typeof MOTION_STUDIO_LIVE_MEDIA_QA_THRESHOLDS_VERSION
  operationKind: MotionStudioLiveOperationKind
  profile: MotionStudioLiveMediaProfile
  mediaSha256: string
  byteLength: number
  mimeType: CanonicalGeneratedMediaMimeType
  width: number
  height: number
  codec: 'png' | 'h264'
  pixelFormat?: 'yuv420p'
  durationFrames?: number
  durationMicros?: number
  fpsNumerator?: number
  fpsDenominator?: 1
  audioStreamCount: number
  extractedFirstFrameSha256?: string
  approvedFirstFrameSha256?: string
  metrics?: {
    firstFrameLumaMae: number
    firstFrameLumaPsnrDb: number
    firstFrameGlobalLumaSsim: number
    blackFrameCount: number
    blackFrameRatio: number
    longestFrozenRunFrames: number
    motionPairRatio: number
    meanConsecutiveLumaMae: number
  }
  thresholds?: {
    maximumFirstFrameLumaMae: 32
    minimumFirstFrameGlobalLumaSsim: 0.75
    maximumBlackFrameRatio: 0.02
    frozenPairLumaMae: 0.15
    maximumFrozenRunFramesExclusive: number
    minimumMotionPairRatio: 0.05
    minimumMeanConsecutiveLumaMae: 0.15
  }
  gates: readonly {
    id: string
    status: 'passed' | 'rejected'
    measuredValue: number | string | boolean
    requiredValue: number | string | boolean
  }[]
  technicalComplete: true
  automatedQaDecision: 'passed' | 'rejected'
  humanReviewRequired: true
  humanReviewDimensions: readonly [
    'intent_alignment',
    'reference_adherence',
    'continuity',
    'visible_artifacts',
    'safety',
  ]
  deterministicOverlayOwnership: 'remotion'
}

export interface MotionStudioVerifiedLiveMedia {
  qaEvidence: MotionStudioLiveMediaQaEvidenceV1
  qaEvidenceDigest: string
  mediaSha256: string
  byteLength: number
  mimeType: CanonicalGeneratedMediaMimeType
  width: number
  height: number
  durationFrames?: number
  fpsNumerator?: number
  fpsDenominator?: 1
  extractedFirstFrame?: {
    bytes: Buffer
    sha256: string
    width: number
    height: number
  }
}

export interface MotionStudioPrivateLiveMediaIngestResult extends MotionStudioVerifiedLiveMedia {
  privateObjectIdentityHash: string
  firstFramePrivateObjectIdentityHash?: string
  providerSourceMediaSha256?: string
  normalizationVersion?: MotionStudioLiveVideoNormalizationVersion
  provenanceDigest: string
  sourceUrlPersisted: false
  providerResponsePersisted: false
  humanReviewRequired: true
}

export async function verifyMotionStudioLiveProviderMedia(input: {
  operationKind: MotionStudioLiveOperationKind
  bytes: Buffer
  mimeType: CanonicalGeneratedMediaMimeType
  expectedSha256: string
  approvedFirstFrame?: { bytes: Buffer; sha256: string; width: 1280; height: 720 }
  ffmpegBin: string
  ffprobeBin: string
}): Promise<MotionStudioVerifiedLiveMedia> {
  assertBoundedMedia(input.bytes, input.expectedSha256)
  if (input.operationKind === 'gpt_image_generation' || input.operationKind === 'gpt_image_edit') {
    return verifyLivePng({ ...input, operationKind: input.operationKind })
  }
  return verifyLiveVideo({ ...input, operationKind: input.operationKind })
}

export async function ingestMotionStudioLiveProviderMedia(input: {
  localStorageRoot: string
  operationId: string
  operationKind: MotionStudioLiveOperationKind
  providerAdapterId:
    | 'openai_gpt_image_2_live_v1'
    | 'alibaba_wan_2_7_i2v_live_v1'
    | 'minimax_hailuo_2_3_fast_i2v_live_v1'
  providerModelVersion: string
  requestDigest: string
  responseDigest: string
  bytes: Buffer
  mimeType: CanonicalGeneratedMediaMimeType
  expectedSha256: string
  approvedFirstFrame?: { bytes: Buffer; sha256: string; width: 1280; height: 720 }
  ffmpegBin: string
  ffprobeBin: string
}): Promise<MotionStudioPrivateLiveMediaIngestResult> {
  assertStableReference(input.operationId, 'operationId')
  assertStableReference(input.providerModelVersion, 'providerModelVersion')
  assertDigest(input.requestDigest, 'requestDigest')
  assertDigest(input.responseDigest, 'responseDigest')
  assertBoundedMedia(input.bytes, input.expectedSha256)
  const videoOperationKind = input.operationKind === 'wan_image_to_video' ||
    input.operationKind === 'hailuo_image_to_video_fallback'
    ? input.operationKind
    : undefined
  if (input.mimeType === 'video/mp4' && !videoOperationKind) {
    throw rejected('Only video-generation operations may ingest provider MP4 media.')
  }
  const normalized = input.mimeType === 'video/mp4' && videoOperationKind
    ? await normalizeLiveProviderVideo(input.ffmpegBin, input.bytes, videoOperationKind)
    : undefined
  const mediaBytes = normalized?.bytes ?? input.bytes
  const verified = await verifyMotionStudioLiveProviderMedia({
    ...input,
    bytes: mediaBytes,
    expectedSha256: sha256(mediaBytes),
  })
  const privateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_live_provider_media_v1',
    operationId: input.operationId,
    operationKind: input.operationKind,
    providerAdapterId: input.providerAdapterId,
    providerModelVersion: input.providerModelVersion,
    requestDigest: input.requestDigest,
    responseDigest: input.responseDigest,
    providerSourceMediaSha256: normalized?.sourceMediaSha256 ?? null,
    normalizationVersion: normalized?.normalizationVersion ?? null,
    mediaSha256: verified.mediaSha256,
  })
  await persistCanonicalPrivateGeneratedMedia({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
    mimeType: input.mimeType,
    bytes: mediaBytes,
    expectedSha256: verified.mediaSha256,
  })
  await assertPrivateReadback({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
    mimeType: input.mimeType,
    expectedSha256: verified.mediaSha256,
    expectedByteLength: verified.byteLength,
  })

  let firstFramePrivateObjectIdentityHash: string | undefined
  if (verified.extractedFirstFrame) {
    firstFramePrivateObjectIdentityHash = sha256CanonicalJson({
      domain: 'motion_studio_live_provider_first_frame_evidence_v1',
      operationId: input.operationId,
      mediaSha256: verified.mediaSha256,
      firstFrameSha256: verified.extractedFirstFrame.sha256,
    })
    await persistCanonicalPrivateGeneratedMedia({
      localStorageRoot: input.localStorageRoot,
      privateObjectIdentityHash: firstFramePrivateObjectIdentityHash,
      mimeType: 'image/png',
      bytes: verified.extractedFirstFrame.bytes,
      expectedSha256: verified.extractedFirstFrame.sha256,
    })
    await assertPrivateReadback({
      localStorageRoot: input.localStorageRoot,
      privateObjectIdentityHash: firstFramePrivateObjectIdentityHash,
      mimeType: 'image/png',
      expectedSha256: verified.extractedFirstFrame.sha256,
      expectedByteLength: verified.extractedFirstFrame.bytes.byteLength,
    })
  }

  const provenanceDigest = sha256CanonicalJson({
    sourceKind: 'live_provider_ingest',
    operationId: input.operationId,
    operationKind: input.operationKind,
    providerAdapterId: input.providerAdapterId,
    providerModelVersion: input.providerModelVersion,
    requestDigest: input.requestDigest,
    responseDigest: input.responseDigest,
    providerSourceMediaSha256: normalized?.sourceMediaSha256 ?? null,
    normalizationVersion: normalized?.normalizationVersion ?? null,
    privateObjectIdentityHash,
    mediaSha256: verified.mediaSha256,
    qaEvidenceDigest: verified.qaEvidenceDigest,
    firstFramePrivateObjectIdentityHash: firstFramePrivateObjectIdentityHash ?? null,
    providerCallMade: true,
    outputIsProviderGenerated: true,
    finalCanvasOwnedByRemotion: true,
  })
  return {
    ...verified,
    privateObjectIdentityHash,
    ...(firstFramePrivateObjectIdentityHash ? { firstFramePrivateObjectIdentityHash } : {}),
    ...(normalized ? {
      providerSourceMediaSha256: normalized.sourceMediaSha256,
      normalizationVersion: normalized.normalizationVersion,
    } : {}),
    provenanceDigest,
    sourceUrlPersisted: false,
    providerResponsePersisted: false,
    humanReviewRequired: true,
  }
}

async function verifyLivePng(input: {
  operationKind: 'gpt_image_generation' | 'gpt_image_edit'
  bytes: Buffer
  mimeType: CanonicalGeneratedMediaMimeType
  expectedSha256: string
  ffmpegBin: string
}): Promise<MotionStudioVerifiedLiveMedia> {
  if (input.mimeType !== 'image/png') throw rejected('GPT Image 2 output must declare image/png.')
  const dimensions = parsePngDimensions(input.bytes)
  if (dimensions.width !== 1280 || dimensions.height !== 720) {
    throw rejected('GPT Image 2 output must be exactly 1280x720.')
  }
  const rgba = await decodePngRgba(input.ffmpegBin, input.bytes, dimensions.width, dimensions.height)
  let opaque = true
  for (let index = 3; index < rgba.byteLength; index += 4) {
    if (rgba[index] !== 255) { opaque = false; break }
  }
  if (!opaque) throw rejected('GPT Image 2 output must be fully opaque.')
  const mediaSha256 = sha256(input.bytes)
  const gates = [
    gate('png_signature', true, true),
    gate('exact_dimensions', `${dimensions.width}x${dimensions.height}`, '1280x720'),
    gate('fully_opaque', true, true),
    gate('checksum', mediaSha256, input.expectedSha256),
  ] as const
  const qaEvidence: MotionStudioLiveMediaQaEvidenceV1 = {
    schemaVersion: MOTION_STUDIO_LIVE_MEDIA_QA_VERSION,
    thresholdsVersion: MOTION_STUDIO_LIVE_MEDIA_QA_THRESHOLDS_VERSION,
    operationKind: input.operationKind,
    profile: 'gpt_image_2_png_1280x720',
    mediaSha256,
    byteLength: input.bytes.byteLength,
    mimeType: 'image/png',
    width: dimensions.width,
    height: dimensions.height,
    codec: 'png',
    audioStreamCount: 0,
    gates,
    technicalComplete: true,
    automatedQaDecision: 'passed',
    humanReviewRequired: true,
    humanReviewDimensions: humanReviewDimensions(),
    deterministicOverlayOwnership: 'remotion',
  }
  return {
    qaEvidence,
    qaEvidenceDigest: sha256CanonicalJson(qaEvidence),
    mediaSha256,
    byteLength: input.bytes.byteLength,
    mimeType: 'image/png',
    width: dimensions.width,
    height: dimensions.height,
  }
}

async function verifyLiveVideo(input: {
  operationKind: 'wan_image_to_video' | 'hailuo_image_to_video_fallback'
  bytes: Buffer
  mimeType: CanonicalGeneratedMediaMimeType
  expectedSha256: string
  approvedFirstFrame?: { bytes: Buffer; sha256: string; width: 1280; height: 720 }
  ffmpegBin: string
  ffprobeBin: string
}): Promise<MotionStudioVerifiedLiveMedia> {
  if (input.mimeType !== 'video/mp4') throw rejected('Live video output must declare video/mp4.')
  if (!input.approvedFirstFrame) throw rejected('Video QA requires the exact approved edited keyframe.')
  assertBoundedMedia(input.approvedFirstFrame.bytes, input.approvedFirstFrame.sha256)
  const approvedDimensions = parsePngDimensions(input.approvedFirstFrame.bytes)
  if (approvedDimensions.width !== 1280 || approvedDimensions.height !== 720) {
    throw rejected('Approved video keyframe must be exactly 1280x720 PNG media.')
  }
  const profile = profileFor(input.operationKind)
  const analysis = await withPrivateTempMediaFile(input.bytes, async (mediaPath) => {
    const facts = await probeLiveMp4(input.ffprobeBin, mediaPath)
    if (
      facts.videoStreamCount !== 1 || facts.audioStreamCount !== 0 ||
      facts.codec !== 'h264' || facts.pixelFormat !== 'yuv420p' ||
      facts.width !== profile.width || facts.height !== profile.height ||
      facts.fpsNumerator !== profile.fps || facts.fpsDenominator !== 1 ||
      facts.durationFrames !== profile.frames ||
      Math.abs(facts.durationSeconds - 6) > (0.5 / profile.fps)
    ) {
      throw rejected('Live video container facts do not match the exact provider evidence profile.')
    }
    const extractedFirstFrameBytes = await extractFirstFramePng(input.ffmpegBin, mediaPath)
    const videoLuma = await decodeVideoLuma(input.ffmpegBin, mediaPath, profile.frames)
    return { facts, extractedFirstFrameBytes, videoLuma }
  })
  const { facts, extractedFirstFrameBytes, videoLuma } = analysis

  const extractedDimensions = parsePngDimensions(extractedFirstFrameBytes)
  if (extractedDimensions.width !== profile.width || extractedDimensions.height !== profile.height) {
    throw rejected('Extracted first-frame dimensions do not match the provider profile.')
  }
  const approvedLuma = await decodePngLuma(input.ffmpegBin, input.approvedFirstFrame.bytes)
  const firstFrameLuma = videoLuma.subarray(0, ANALYSIS_FRAME_BYTES)
  const firstFrameMetrics = compareLuma(approvedLuma, firstFrameLuma)
  const temporal = temporalMetrics(videoLuma, profile.frames, profile.fps)
  const thresholds = {
    maximumFirstFrameLumaMae: 32 as const,
    minimumFirstFrameGlobalLumaSsim: 0.75 as const,
    maximumBlackFrameRatio: 0.02 as const,
    frozenPairLumaMae: 0.15 as const,
    maximumFrozenRunFramesExclusive: profile.fps * 2,
    minimumMotionPairRatio: 0.05 as const,
    minimumMeanConsecutiveLumaMae: 0.15 as const,
  }
  const gates = [
    gate('mp4_h264_yuv420p', `${facts.codec}/${facts.pixelFormat}`, 'h264/yuv420p'),
    gate('exact_dimensions', `${facts.width}x${facts.height}`, `${profile.width}x${profile.height}`),
    gate('exact_timing', `${facts.durationFrames}@${facts.fpsNumerator}/${facts.fpsDenominator}`, `${profile.frames}@${profile.fps}/1`),
    gate('no_audio_stream', facts.audioStreamCount, 0),
    thresholdGate('first_frame_luma_mae', firstFrameMetrics.mae, thresholds.maximumFirstFrameLumaMae, 'maximum'),
    thresholdGate('first_frame_global_luma_ssim', firstFrameMetrics.globalSsim, thresholds.minimumFirstFrameGlobalLumaSsim, 'minimum'),
    thresholdGate('black_frame_ratio', temporal.blackFrameRatio, thresholds.maximumBlackFrameRatio, 'maximum'),
    thresholdGate('longest_frozen_run_frames', temporal.longestFrozenRunFrames, thresholds.maximumFrozenRunFramesExclusive, 'exclusive_maximum'),
    thresholdGate('motion_pair_ratio', temporal.motionPairRatio, thresholds.minimumMotionPairRatio, 'minimum'),
    thresholdGate('mean_consecutive_luma_mae', temporal.meanConsecutiveLumaMae, thresholds.minimumMeanConsecutiveLumaMae, 'minimum'),
  ]
  const automatedQaDecision = gates.every((candidate) => candidate.status === 'passed') ? 'passed' : 'rejected'
  const mediaSha256 = sha256(input.bytes)
  const extractedFirstFrameSha256 = sha256(extractedFirstFrameBytes)
  const qaEvidence: MotionStudioLiveMediaQaEvidenceV1 = {
    schemaVersion: MOTION_STUDIO_LIVE_MEDIA_QA_VERSION,
    thresholdsVersion: MOTION_STUDIO_LIVE_MEDIA_QA_THRESHOLDS_VERSION,
    operationKind: input.operationKind,
    profile: profile.id,
    mediaSha256,
    byteLength: input.bytes.byteLength,
    mimeType: 'video/mp4',
    width: facts.width,
    height: facts.height,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    durationFrames: facts.durationFrames,
    durationMicros: Math.round(facts.durationSeconds * 1_000_000),
    fpsNumerator: facts.fpsNumerator,
    fpsDenominator: 1,
    audioStreamCount: facts.audioStreamCount,
    extractedFirstFrameSha256,
    approvedFirstFrameSha256: input.approvedFirstFrame.sha256,
    metrics: {
      firstFrameLumaMae: firstFrameMetrics.mae,
      firstFrameLumaPsnrDb: firstFrameMetrics.psnrDb,
      firstFrameGlobalLumaSsim: firstFrameMetrics.globalSsim,
      blackFrameCount: temporal.blackFrameCount,
      blackFrameRatio: temporal.blackFrameRatio,
      longestFrozenRunFrames: temporal.longestFrozenRunFrames,
      motionPairRatio: temporal.motionPairRatio,
      meanConsecutiveLumaMae: temporal.meanConsecutiveLumaMae,
    },
    thresholds,
    gates,
    technicalComplete: true,
    automatedQaDecision,
    humanReviewRequired: true,
    humanReviewDimensions: humanReviewDimensions(),
    deterministicOverlayOwnership: 'remotion',
  }
  return {
    qaEvidence,
    qaEvidenceDigest: sha256CanonicalJson(qaEvidence),
    mediaSha256,
    byteLength: input.bytes.byteLength,
    mimeType: 'video/mp4',
    width: facts.width,
    height: facts.height,
    durationFrames: facts.durationFrames,
    fpsNumerator: facts.fpsNumerator,
    fpsDenominator: 1,
    extractedFirstFrame: {
      bytes: extractedFirstFrameBytes,
      sha256: extractedFirstFrameSha256,
      width: extractedDimensions.width,
      height: extractedDimensions.height,
    },
  }
}

function profileFor(operationKind: 'wan_image_to_video' | 'hailuo_image_to_video_fallback') {
  return operationKind === 'wan_image_to_video'
    ? { id: 'wan_2_7_i2v_1280x720_30fps_6s' as const, width: 1280, height: 720, fps: 30, frames: 180 }
    : { id: 'hailuo_2_3_fast_i2v_1360x768_24fps_6s' as const, width: 1360, height: 768, fps: 24, frames: 144 }
}

async function probeLiveMp4(binary: string, mediaPath: string): Promise<{
  videoStreamCount: number
  audioStreamCount: number
  codec: string
  pixelFormat: string
  width: number
  height: number
  durationFrames: number
  durationSeconds: number
  fpsNumerator: number
  fpsDenominator: number
}> {
  const output = await runBinary(binary, [
    '-v', 'error', '-count_frames',
    '-show_entries', 'stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames,duration:format=duration',
    '-of', 'json', mediaPath,
  ], undefined, MAXIMUM_TOOL_OUTPUT_BYTES, 'FFprobe')
  let parsed: unknown
  try { parsed = JSON.parse(output.toString('utf8')) } catch { throw rejected('FFprobe returned malformed JSON.') }
  if (!isRecord(parsed) || !Array.isArray(parsed.streams)) throw rejected('FFprobe omitted stream facts.')
  const streams = parsed.streams.filter(isRecord)
  const videoStreams = streams.filter((stream) => stream.codec_type === 'video')
  const audioStreamCount = streams.filter((stream) => stream.codec_type === 'audio').length
  if (videoStreams.length !== 1) throw rejected('Live video must contain exactly one video stream.')
  const video = videoStreams[0]!
  const frameRate = typeof video.avg_frame_rate === 'string' ? video.avg_frame_rate.split('/') : []
  const durationValue = positiveDecimal(video.duration) ?? (
    isRecord(parsed.format) ? positiveDecimal(parsed.format.duration) : undefined
  )
  if (durationValue === undefined) throw rejected('FFprobe omitted exact video duration.')
  return {
    videoStreamCount: videoStreams.length,
    audioStreamCount,
    codec: requiredString(video.codec_name, 'codec'),
    pixelFormat: requiredString(video.pix_fmt, 'pixel format'),
    width: positiveInteger(video.width, 'width'),
    height: positiveInteger(video.height, 'height'),
    durationFrames: positiveInteger(video.nb_read_frames, 'frame count'),
    durationSeconds: durationValue,
    fpsNumerator: positiveInteger(frameRate[0], 'frame-rate numerator'),
    fpsDenominator: positiveInteger(frameRate[1], 'frame-rate denominator'),
  }
}

async function extractFirstFramePng(binary: string, mediaPath: string): Promise<Buffer> {
  const output = await runBinary(binary, [
    '-v', 'error', '-i', mediaPath, '-map', '0:v:0', '-frames:v', '1',
    '-an', '-c:v', 'png', '-f', 'image2pipe', 'pipe:1',
  ], undefined, MAXIMUM_TOOL_OUTPUT_BYTES, 'FFmpeg first-frame extraction')
  parsePngDimensions(output)
  return output
}

async function decodeVideoLuma(binary: string, mediaPath: string, frameCount: number): Promise<Buffer> {
  const expectedBytes = frameCount * ANALYSIS_FRAME_BYTES
  const output = await runBinary(binary, [
    '-v', 'error', '-i', mediaPath, '-map', '0:v:0', '-an',
    '-vf', `scale=${ANALYSIS_WIDTH}:${ANALYSIS_HEIGHT}:flags=area,format=gray`,
    '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1',
  ], undefined, expectedBytes + ANALYSIS_FRAME_BYTES, 'FFmpeg luma analysis')
  if (output.byteLength !== expectedBytes) throw rejected('FFmpeg luma frame count diverges from FFprobe evidence.')
  return output
}

async function decodePngLuma(binary: string, bytes: Buffer): Promise<Buffer> {
  const output = await runBinary(binary, [
    '-v', 'error', '-i', 'pipe:0', '-map', '0:v:0', '-frames:v', '1',
    '-vf', `scale=${ANALYSIS_WIDTH}:${ANALYSIS_HEIGHT}:flags=area,format=gray`,
    '-f', 'rawvideo', 'pipe:1',
  ], bytes, ANALYSIS_FRAME_BYTES, 'FFmpeg PNG luma decode')
  if (output.byteLength !== ANALYSIS_FRAME_BYTES) throw rejected('PNG luma decode did not return one exact analysis frame.')
  return output
}

async function decodePngRgba(binary: string, bytes: Buffer, width: number, height: number): Promise<Buffer> {
  const expectedBytes = width * height * 4
  const output = await runBinary(binary, [
    '-v', 'error', '-i', 'pipe:0', '-map', '0:v:0', '-frames:v', '1',
    '-vf', 'format=rgba', '-f', 'rawvideo', 'pipe:1',
  ], bytes, expectedBytes, 'FFmpeg PNG opacity decode')
  if (output.byteLength !== expectedBytes) throw rejected('PNG decode did not return one exact RGBA frame.')
  return output
}

async function runBinary(
  binary: string,
  args: readonly string[],
  input: Buffer | undefined,
  maximumOutputBytes: number,
  label: string,
): Promise<Buffer> {
  if (!binary || binary.includes('\0') || maximumOutputBytes < 1 || maximumOutputBytes > MAXIMUM_TOOL_OUTPUT_BYTES) {
    throw rejected(`${label} configuration is invalid.`)
  }
  return new Promise((resolve, rejectPromise) => {
    const child = spawn(binary, [...args], { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'], shell: false })
    const output: Buffer[] = []
    const errors: Buffer[] = []
    let outputBytes = 0
    let errorBytes = 0
    let killedForLimit = false
    const stdout = child.stdout
    const stderr = child.stderr
    if (!stdout || !stderr) {
      child.kill('SIGKILL')
      rejectPromise(rejected(`${label} did not expose bounded output streams.`))
      return
    }
    stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.byteLength
      if (outputBytes > maximumOutputBytes) {
        killedForLimit = true
        child.kill('SIGKILL')
      } else output.push(Buffer.from(chunk))
    })
    stderr.on('data', (chunk: Buffer) => {
      if (errorBytes < 64_000) {
        const accepted = chunk.subarray(0, Math.max(0, 64_000 - errorBytes))
        errors.push(Buffer.from(accepted))
        errorBytes += accepted.byteLength
      }
    })
    child.on('error', (error) => rejectPromise(rejected(`${label} could not start: ${safeErrorMessage(error)}`)))
    child.on('close', (code) => {
      if (code !== 0 || killedForLimit) {
        rejectPromise(rejected(`${label} rejected media (${code ?? 'signal'}): ${Buffer.concat(errors).toString('utf8').slice(0, 500)}`))
      } else resolve(Buffer.concat(output, outputBytes))
    })
    if (input && child.stdin) {
      child.stdin.on('error', (error: NodeJS.ErrnoException) => {
        // Single-frame decoders may close stdin after consuming the first frame.
        // EPIPE is therefore terminal-process flow, not failed QA; close status
        // and the exact output-size checks remain authoritative.
        if (error.code !== 'EPIPE') rejectPromise(rejected(`${label} input failed: ${safeErrorMessage(error)}`))
      })
      child.stdin.end(input)
    }
  })
}

async function normalizeLiveProviderVideo(
  binary: string,
  sourceBytes: Buffer,
  operationKind: 'wan_image_to_video' | 'hailuo_image_to_video_fallback',
): Promise<{
  bytes: Buffer
  sourceMediaSha256: string
  normalizationVersion: MotionStudioLiveVideoNormalizationVersion
}> {
  const bytes = await withPrivateTempDirectory(async (directory) => {
    const inputPath = join(directory, 'provider-source.mp4')
    const outputPath = join(directory, 'normalized.mp4')
    await writeFile(inputPath, sourceBytes, { flag: 'wx', mode: 0o600 })
    const args = operationKind === 'hailuo_image_to_video_fallback'
      ? [
          '-v', 'error', '-nostdin', '-i', inputPath,
          '-map', '0:v:0', '-map_metadata', '-1',
          '-vf', 'crop=1360:768:2:0,fps=24,tpad=stop_mode=clone:stop_duration=0.125,trim=end_frame=144,setpts=N/(24*TB),format=yuv420p',
          '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
          '-r', '24', '-fps_mode', 'cfr', '-an', '-movflags', '+faststart',
          '-f', 'mp4', outputPath,
        ]
      : [
          '-v', 'error', '-nostdin', '-i', inputPath,
          '-map', '0:v:0', '-map_metadata', '-1', '-c:v', 'copy', '-an',
          '-movflags', '+faststart', '-f', 'mp4', outputPath,
        ]
    await runBinary(binary, args, undefined, 64_000, 'FFmpeg provider-video normalization')
    await chmod(outputPath, 0o600)
    const normalized = await readFile(outputPath)
    assertBoundedMedia(normalized, sha256(normalized))
    if (normalized.byteLength < 12 || normalized.toString('ascii', 4, 8) !== 'ftyp') {
      throw rejected('Normalized provider video is not an MP4 container.')
    }
    return normalized
  })
  return {
    bytes,
    sourceMediaSha256: sha256(sourceBytes),
    normalizationVersion: operationKind === 'hailuo_image_to_video_fallback'
      ? MOTION_STUDIO_LIVE_HAILUO_VIDEO_NORMALIZATION_VERSION
      : MOTION_STUDIO_LIVE_VIDEO_NORMALIZATION_VERSION,
  }
}

async function withPrivateTempMediaFile<T>(bytes: Buffer, action: (mediaPath: string) => Promise<T>): Promise<T> {
  return withPrivateTempDirectory(async (directory) => {
    const mediaPath = join(directory, 'media.mp4')
    await writeFile(mediaPath, bytes, { flag: 'wx', mode: 0o600 })
    return action(mediaPath)
  })
}

async function withPrivateTempDirectory<T>(action: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'reeditpro-live-media-'))
  await chmod(directory, 0o700)
  try {
    return await action(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function temporalMetrics(luma: Buffer, frameCount: number, fps: number) {
  let blackFrameCount = 0
  let motionPairs = 0
  let motionMaeSum = 0
  let currentFrozenRun = 1
  let longestFrozenRunFrames = 1
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const frame = luma.subarray(frameIndex * ANALYSIS_FRAME_BYTES, (frameIndex + 1) * ANALYSIS_FRAME_BYTES)
    const stats = lumaStats(frame)
    if (stats.mean <= 5 && stats.standardDeviation <= 2) blackFrameCount += 1
    if (frameIndex === 0) continue
    const prior = luma.subarray((frameIndex - 1) * ANALYSIS_FRAME_BYTES, frameIndex * ANALYSIS_FRAME_BYTES)
    const mae = lumaMae(prior, frame)
    motionMaeSum += mae
    if (mae >= 0.15) {
      motionPairs += 1
      currentFrozenRun = 1
    } else {
      currentFrozenRun += 1
      longestFrozenRunFrames = Math.max(longestFrozenRunFrames, currentFrozenRun)
    }
  }
  const pairCount = Math.max(1, frameCount - 1)
  return {
    blackFrameCount,
    blackFrameRatio: rounded(blackFrameCount / frameCount),
    longestFrozenRunFrames: Math.min(longestFrozenRunFrames, fps * 100),
    motionPairRatio: rounded(motionPairs / pairCount),
    meanConsecutiveLumaMae: rounded(motionMaeSum / pairCount),
  }
}

function compareLuma(expected: Buffer, actual: Buffer) {
  if (expected.byteLength !== actual.byteLength || expected.byteLength < 1) throw rejected('First-frame luma vectors are not comparable.')
  let sumExpected = 0
  let sumActual = 0
  let absoluteError = 0
  let squaredError = 0
  for (let index = 0; index < expected.byteLength; index += 1) {
    const left = expected[index]!
    const right = actual[index]!
    const delta = left - right
    sumExpected += left
    sumActual += right
    absoluteError += Math.abs(delta)
    squaredError += delta * delta
  }
  const count = expected.byteLength
  const meanExpected = sumExpected / count
  const meanActual = sumActual / count
  let varianceExpected = 0
  let varianceActual = 0
  let covariance = 0
  for (let index = 0; index < count; index += 1) {
    const leftDelta = expected[index]! - meanExpected
    const rightDelta = actual[index]! - meanActual
    varianceExpected += leftDelta * leftDelta
    varianceActual += rightDelta * rightDelta
    covariance += leftDelta * rightDelta
  }
  varianceExpected /= count
  varianceActual /= count
  covariance /= count
  const mse = squaredError / count
  const c1 = (0.01 * 255) ** 2
  const c2 = (0.03 * 255) ** 2
  const globalSsim = ((2 * meanExpected * meanActual + c1) * (2 * covariance + c2)) /
    ((meanExpected ** 2 + meanActual ** 2 + c1) * (varianceExpected + varianceActual + c2))
  return {
    mae: rounded(absoluteError / count),
    psnrDb: rounded(mse === 0 ? 99 : Math.min(99, 10 * Math.log10((255 ** 2) / mse))),
    globalSsim: rounded(Math.max(-1, Math.min(1, globalSsim))),
  }
}

function lumaStats(frame: Buffer) {
  let sum = 0
  for (const value of frame) sum += value
  const mean = sum / frame.byteLength
  let variance = 0
  for (const value of frame) variance += (value - mean) ** 2
  return { mean, standardDeviation: Math.sqrt(variance / frame.byteLength) }
}

function lumaMae(left: Buffer, right: Buffer): number {
  let total = 0
  for (let index = 0; index < left.byteLength; index += 1) total += Math.abs(left[index]! - right[index]!)
  return total / left.byteLength
}

function parsePngDimensions(bytes: Buffer): { width: number; height: number } {
  if (
    bytes.byteLength < 67 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
    bytes.toString('ascii', 12, 16) !== 'IHDR' || !bytes.includes(Buffer.from('IEND'))
  ) throw rejected('Live still is not a bounded PNG.')
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width < 1 || height < 1 || width > 3840 || height > 3840) throw rejected('PNG dimensions are outside the live evidence profile.')
  return { width, height }
}

function assertBoundedMedia(bytes: Buffer, expectedSha256: string): void {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 67 || bytes.byteLength > MAXIMUM_MEDIA_BYTES) {
    throw rejected('Live provider media is empty or exceeds its byte ceiling.')
  }
  assertDigest(expectedSha256, 'expectedSha256')
  if (sha256(bytes) !== expectedSha256) throw rejected('Live provider media checksum does not match download evidence.')
}

async function assertPrivateReadback(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
  mimeType: CanonicalGeneratedMediaMimeType
  expectedSha256: string
  expectedByteLength: number
}): Promise<void> {
  const stored = await readCanonicalPrivateGeneratedMedia(input)
  if (!stored || stored.sha256 !== input.expectedSha256 || stored.byteLength !== input.expectedByteLength) {
    throw rejected('Private live-provider media failed immutable checksum readback.')
  }
}

function gate(id: string, measuredValue: number | string | boolean, requiredValue: number | string | boolean) {
  return { id, status: measuredValue === requiredValue ? 'passed' as const : 'rejected' as const, measuredValue, requiredValue }
}

function thresholdGate(
  id: string,
  measuredValue: number,
  requiredValue: number,
  comparison: 'minimum' | 'maximum' | 'exclusive_maximum',
) {
  const passed = comparison === 'minimum' ? measuredValue >= requiredValue
    : comparison === 'maximum' ? measuredValue <= requiredValue
      : measuredValue < requiredValue
  return {
    id,
    status: passed ? 'passed' as const : 'rejected' as const,
    measuredValue,
    requiredValue: `${comparison}:${requiredValue}`,
  }
}

function humanReviewDimensions(): MotionStudioLiveMediaQaEvidenceV1['humanReviewDimensions'] {
  return ['intent_alignment', 'reference_adherence', 'continuity', 'visible_artifacts', 'safety']
}

function positiveInteger(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : Number.NaN
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw rejected(`FFprobe ${label} is invalid.`)
  return parsed
}

function positiveDecimal(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value || value.length > 64) throw rejected(`FFprobe ${label} is invalid.`)
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function rounded(value: number): number { return Math.round(value * 1_000_000) / 1_000_000 }
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }

function assertDigest(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw rejected(`${label} must be a lowercase SHA-256 digest.`)
}

function assertStableReference(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value) || value.includes('..')) {
    throw rejected(`${label} is not a stable reference.`)
  }
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : 'unknown tool failure'
}

function rejected(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_CONFLICT', message, 409, {
    requiredGate: 'motion_studio_live_provider_media_qa',
    providerRetryAllowed: false,
    humanReviewRequired: true,
  })
}
