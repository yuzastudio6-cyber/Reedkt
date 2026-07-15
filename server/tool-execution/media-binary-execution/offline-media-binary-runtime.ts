import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfprobeExecutionRequest,
  type OfflineFfmpegExecutionRequest,
  type OfflineFfprobeExecutionRequest,
} from './offline-media-binary-protocol'
import type {
  OfflineFfmpegExecutionResult,
  OfflineFfprobeExecutionResult,
  OfflineMediaBinaryConfinementEvidence,
  OfflineMediaBinaryImageEvidence,
} from './offline-media-binary-types'

const IMAGE_TAG = 'reeditpro/ffmpeg-lgpl-internal:8.1.2-color-v1-local' as const
const FFPROBE_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffprobe' as const
const FFMPEG_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffmpeg' as const
const SOURCE_VERSION = '8.1.2' as const
const SOURCE_SHA256 = '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c' as const
const STORAGE_ROOT = '/tmp/reeditpro-offline-media-binary-execution-color-v1' as const
const AUTHORITY_PATH = 'runtime-authority/offline-media-binary-runtime-color-v1.json' as const
const TIMEOUT_MS = 30_000

export interface OfflineMediaBinaryRuntimeAuthority {
  schemaVersion: 'offline-media-binary-runtime-authority-v1'
  source: 'private_local_pinned_ffmpeg_lgpl_runtime'
  activatedAt: string
  image: OfflineMediaBinaryImageEvidence
  supportedOperations: readonly [
    { toolId: 'ffmpeg'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
    { toolId: 'ffprobe'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
  ]
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalExportReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}

export interface PrivateOfflineMediaBinaryRuntime {
  readonly image: OfflineMediaBinaryImageEvidence
  execute(request: OfflineFfprobeExecutionRequest): Promise<OfflineFfprobeExecutionResult>
  execute(request: OfflineFfmpegExecutionRequest): Promise<OfflineFfmpegExecutionResult>
  execute(request: unknown): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult>
}

export async function activatePrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary activation accepts no caller input.')
  const image = await inspectImage()
  await persistAuthority(image)
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  return Object.freeze({ image, execute: executeBound })
}

export async function openPrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary runtime open accepts no caller input.')
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (!authority) throw unavailable('Media binary runtime authority is unavailable.')
  const image = await inspectImage()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw unavailable('Pinned media binary image changed after runtime activation.')
  }
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  return Object.freeze({ image, execute: executeBound })
}

export async function readPersistedOfflineMediaBinaryRuntimeAuthority():
Promise<OfflineMediaBinaryRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw unavailable('Media binary runtime authority is invalid JSON.') }
  const envelope = record(parsed)
  const authority = record(envelope.authority)
  if (
    envelope.recordVersion !== 'offline-media-binary-runtime-authority-record-v1' ||
    envelope.source !== 'private_local_checksum_protected_media_binary_runtime' ||
    envelope.checksumSha256 !== sha256AuthorityValue(authority)
  ) throw unavailable('Media binary runtime authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-media-binary-runtime-authority-v1' ||
    authority.source !== 'private_local_pinned_ffmpeg_lgpl_runtime' ||
    record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).productReady !== false ||
    record(authority.readiness).finalExportReady !== false
  ) throw unavailable('Media binary runtime authority boundary is invalid.')
  return authority as unknown as OfflineMediaBinaryRuntimeAuthority
}

async function execute(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult> {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  return candidate?.toolId === 'ffmpeg'
    ? executeFfmpeg(image, value)
    : executeFfprobe(image, value)
}

async function executeFfprobe(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult> {
  let request: OfflineFfprobeExecutionRequest
  try { request = validateOfflineFfprobeExecutionRequest(value) } catch {
    throw invalid('Structured FFprobe execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  const command = ffprobeArguments(request)
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFPROBE_ENTRYPOINT, command)
    const started = await dockerBuffer(['start', '--attach', '--interactive', container.id], sourceBytes, 4 * 1024 * 1024)
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      started.exitCode !== 0 || started.stderr.length > 0 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || state.OOMKilled !== false
    ) throw unavailable('Confined FFprobe operation failed closed.')
    const document = normalizeProbe(started.stdout, request)
    const canonical = stableAuthorityStringify(document)
    const bytes = Buffer.from(canonical, 'utf8')
    const resultSha256 = sha256(bytes)
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffprobe' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      sourceSha256: request.payload.sourceSha256,
      resultSha256,
      confinement,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    return {
      resultJson: {
        mimeType: 'application/json', bytes, document,
        sha256: resultSha256, byteLength: bytes.byteLength,
      },
      evidence: {
        toolId: 'ffprobe', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue({
          ...request,
          payload: { ...request.payload, sourceBytesBase64: '[server-injected-approved-bytes]' },
        }),
        sourceSha256: request.payload.sourceSha256,
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          machineJsonOnly: true,
          durationAndSyncVerified: true,
          streamCount: Array.isArray(document.streams) ? document.streams.length : 0,
          frameCountsRequested: request.payload.countFrames,
        },
        confinement,
        containerExitCode: 0,
        oomKilled: false,
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function executeFfmpeg(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfmpegExecutionResult> {
  let request: OfflineFfmpegExecutionRequest
  try { request = validateOfflineFfmpegExecutionRequest(value) } catch {
    throw invalid('Structured FFmpeg execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  const voiceDelivery = request.payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
  const colorDelivery = request.payload.recipeProfileId ===
    'approved_source_color_delivery_matroska_v1'
  const voiceDeliveryPayload = request.payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
    ? request.payload
    : undefined
  const colorDeliveryPayload = request.payload.recipeProfileId ===
    'approved_source_color_delivery_matroska_v1'
    ? request.payload
    : undefined
  const trimDurationFrames = request.payload.trimEndFrameExclusive - request.payload.trimStartFrame
  const sourceColorAnalysis = colorDelivery
    ? await analyzeVideoColor({
        image,
        bytes: sourceBytes,
        startFrame: request.payload.trimStartFrame,
        endFrameExclusive: request.payload.trimEndFrameExclusive,
      })
    : undefined
  const colorCorrection = sourceColorAnalysis && colorDeliveryPayload
    ? deriveColorCorrection(sourceColorAnalysis, colorDeliveryPayload.colorGradeStyle,
        colorDeliveryPayload.intensity)
    : undefined
  const command = voiceDelivery
    ? voiceDeliveryCommand(request)
    : colorDelivery && colorCorrection
      ? colorDeliveryCommand(request, colorCorrection)
      : [
        '-hide_banner', '-loglevel', 'error', '-nostdin',
        '-i', 'pipe:0', '-map', '0:v:0',
        '-vf', `trim=start_frame=${request.payload.trimStartFrame}:end_frame=${request.payload.trimEndFrameExclusive},setpts=PTS-STARTPTS`,
        '-an', '-threads', '1', '-c:v', 'ffv1', '-level', '3', '-f', 'nut', 'pipe:1',
      ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFMPEG_ENTRYPOINT, command)
    const started = await dockerBuffer(['start', '--attach', '--interactive', container.id], sourceBytes, 32 * 1024 * 1024)
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      started.exitCode !== 0 || started.stderr.length > 0 || started.stdout.byteLength < 64 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || state.OOMKilled !== false
    ) throw unavailable(
      'Confined FFmpeg operation failed closed ' +
      `(exit=${started.exitCode};stderrBytes=${started.stderr.length};` +
      `stdoutBytes=${started.stdout.byteLength};state=${String(state.Status)};` +
      `stateExit=${String(state.ExitCode)};oomKilled=${String(state.OOMKilled)};` +
      `diagnostic=${safeFfmpegDiagnostic(started.stderr)}).`,
    )
    if (voiceDelivery ? !isPcmWave(started.stdout) : colorDelivery
      ? !isMatroska(started.stdout)
      : !started.stdout.subarray(0, 25).toString('ascii').includes('nut/multimedia')) {
      throw unavailable(voiceDelivery
        ? 'FFmpeg voice-delivery output is not the fixed PCM WAV artifact.'
        : colorDelivery
          ? 'FFmpeg professional color output is not the fixed Matroska intermediate container.'
          : 'FFmpeg output is not the fixed NUT intermediate container.')
    }
    const outputProbe = voiceDelivery
      ? await probeFfmpegVoiceDeliveryOutput(
          image,
          started.stdout,
          trimDurationFrames / request.payload.frameRate,
        )
      : await probeFfmpegOutput(
          image,
          started.stdout,
          trimDurationFrames,
          request.payload.frameRate,
          colorDelivery,
        )
    const outputColorAnalysis = colorDelivery
      ? await analyzeVideoColor({
          image,
          bytes: started.stdout,
          startFrame: 0,
          endFrameExclusive: trimDurationFrames,
        })
      : undefined
    if (
      colorDelivery && (
        !sourceColorAnalysis || !outputColorAnalysis || !colorCorrection ||
        outputColorAnalysis.sampledFrameCount !== sourceColorAnalysis.sampledFrameCount ||
        outputColorAnalysis.meanLuma <= 8 || outputColorAnalysis.meanLuma >= 247 ||
        outputColorAnalysis.blackLumaFraction >= 0.98 ||
        outputColorAnalysis.whiteLumaFraction >= 0.98 ||
        started.stdout.equals(sourceBytes)
      )
    ) throw unavailable(
      'FFmpeg professional color output failed bounded pixel QA ' +
      `(source=${JSON.stringify(sourceColorAnalysis)};` +
      `output=${JSON.stringify(outputColorAnalysis)}).`,
    )
    const resultSha256 = sha256(started.stdout)
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt, imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      sourceSha256: request.payload.sourceSha256,
      resultSha256, confinement, outputProbe,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: voiceDelivery
          ? 'audio/wav'
          : colorDelivery
            ? 'video/x-matroska'
            : 'video/x-nut',
        bytes: started.stdout,
        sha256: resultSha256, byteLength: started.stdout.byteLength,
      },
      evidence: {
        toolId: 'ffmpeg', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue({
          ...request,
          payload: { ...request.payload, sourceBytesBase64: '[server-injected-approved-bytes]' },
        }),
        sourceSha256: request.payload.sourceSha256,
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          fixedRecipeExecuted: true,
          recipeProfileId: request.payload.recipeProfileId,
          trimStartFrame: request.payload.trimStartFrame,
          trimEndFrameExclusive: request.payload.trimEndFrameExclusive,
          ...(voiceDelivery
            ? {
                outputContainer: 'wav', outputAudioCodec: 'pcm_s16le',
                outputSampleRate: 48_000, outputChannels: 2,
                highpassApplied: true, gentleCompressionApplied: true,
                loudnessNormalizationApplied: true, truePeakLimiterApplied: true,
                targetLufs: voiceDeliveryPayload!.targetLufs,
                truePeakDbtp: voiceDeliveryPayload!.truePeakDbtp,
                sourceVideoRemoved: true,
              }
            : colorDelivery
              ? {
                  outputFrameCount: trimDurationFrames,
                  outputContainer: 'matroska', outputVideoCodec: 'vp9', audioRemoved: true,
                  colorGradeStyle: colorDeliveryPayload!.colorGradeStyle,
                  colorIntensity: colorDeliveryPayload!.intensity,
                  approvedColorOperationIds:
                    colorDeliveryPayload!.approvedColorOperationIds,
                  approvedColorOperationKinds:
                    colorDeliveryPayload!.approvedColorOperationKinds,
                  sourcePixelAnalysisExecuted: true,
                  sourcePixelAnalysis: sourceColorAnalysis,
                  derivedCorrection: colorCorrection,
                  outputPixelAnalysisExecuted: true,
                  outputPixelAnalysis: outputColorAnalysis,
                  boundedAutoExposureApplied: true,
                  boundedWhiteBalanceApplied: true,
                  plannedLookApplied: true,
                  lgplColorChannelMixerApplied: true,
                  lgplColorLevelsApplied: true,
                  lgplClarityFilterApplied: colorCorrection!.clarityApplied,
                  clippingProtectionVerified: true,
                  histogramQaPassed: true,
                  outputColorSpace: 'bt709',
                  outputPixelFormat: 'yuv420p',
                }
              : {
                outputFrameCount: trimDurationFrames,
                outputContainer: 'nut', outputVideoCodec: 'ffv1', audioRemoved: true,
              }),
          outputProbeVerified: true,
        },
        confinement, containerExitCode: 0, oomKilled: false,
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

function voiceDeliveryCommand(request: OfflineFfmpegExecutionRequest): string[] {
  if (request.payload.recipeProfileId !== 'approved_voice_delivery_wav_v1') {
    throw invalid('Voice-delivery command requires its exact approved recipe.')
  }
  const startSeconds = (request.payload.trimStartFrame / request.payload.frameRate).toFixed(9)
  const endSeconds = (request.payload.trimEndFrameExclusive / request.payload.frameRate).toFixed(9)
  const filters = [
    `atrim=start=${startSeconds}:end=${endSeconds}`,
    'asetpts=PTS-STARTPTS',
    `highpass=f=${request.payload.highpassHz}`,
    'acompressor=threshold=0.125:ratio=2:attack=20:release=250:makeup=1.5',
    `loudnorm=I=${request.payload.targetLufs}:LRA=${request.payload.loudnessRangeLufs}:TP=${request.payload.truePeakDbtp}:linear=true`,
    'alimiter=limit=0.891251:attack=5:release=50',
    'aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo',
  ].join(',')
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:a:0', '-vn', '-af', filters,
    '-ar', '48000', '-ac', '2', '-threads', '1',
    '-c:a', 'pcm_s16le', '-f', 'wav', 'pipe:1',
  ]
}

type ColorPixelAnalysis = {
  sampledFrameCount: number
  sampledPixelCount: number
  meanRed: number
  meanGreen: number
  meanBlue: number
  meanLuma: number
  minimumLuma: number
  maximumLuma: number
  blackLumaFraction: number
  whiteLumaFraction: number
}

type DerivedColorCorrection = {
  redMultiplier: number
  greenMultiplier: number
  blueMultiplier: number
  contrast: number
  saturation: number
  channelSpread: number
  exposureProtectionFactor: number
  exposureShift: number
  inputBlackPoint: number
  inputWhitePoint: number
  outputBlackPoint: number
  outputWhitePoint: number
  clarityApplied: boolean
}

async function analyzeVideoColor(input: {
  image: OfflineMediaBinaryImageEvidence
  bytes: Buffer
  startFrame: number
  endFrameExclusive: number
}): Promise<ColorPixelAnalysis> {
  const finalFrame = input.endFrameExclusive - 1
  const middleFrame = input.startFrame + Math.floor(
    (input.endFrameExclusive - input.startFrame - 1) / 2,
  )
  const selectedFrames = [...new Set([input.startFrame, middleFrame, finalFrame])]
  const expression = selectedFrames.map((frame) => `eq(n\\,${frame})`).join('+')
  const command = [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:v:0',
    '-vf', `select=${expression},scale=64:64:flags=area,format=rgb24`,
    '-fps_mode', 'passthrough', '-frames:v', String(selectedFrames.length),
    '-threads', '1', '-f', 'rawvideo', 'pipe:1',
  ]
  const container = await createContainer(input.image, FFMPEG_ENTRYPOINT, command)
  try {
    validateConfinement(
      await inspectContainer(container.id),
      input.image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const result = await dockerBuffer(
      ['start', '--attach', '--interactive', container.id],
      input.bytes,
      256 * 1024,
    )
    const expectedBytes = selectedFrames.length * 64 * 64 * 3
    if (
      result.exitCode !== 0 || result.stderr.length > 0 ||
      result.stdout.byteLength !== expectedBytes
    ) throw unavailable('FFmpeg source color analysis failed closed.')
    return colorPixelAnalysis(result.stdout, selectedFrames.length)
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

function colorPixelAnalysis(bytes: Buffer, sampledFrameCount: number): ColorPixelAnalysis {
  let red = 0
  let green = 0
  let blue = 0
  let luma = 0
  let minimumLuma = 255
  let maximumLuma = 0
  let blackPixels = 0
  let whitePixels = 0
  const pixelCount = bytes.byteLength / 3
  for (let offset = 0; offset < bytes.byteLength; offset += 3) {
    const r = bytes[offset]!
    const g = bytes[offset + 1]!
    const b = bytes[offset + 2]!
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    red += r
    green += g
    blue += b
    luma += y
    minimumLuma = Math.min(minimumLuma, y)
    maximumLuma = Math.max(maximumLuma, y)
    if (y <= 8) blackPixels += 1
    if (y >= 247) whitePixels += 1
  }
  return {
    sampledFrameCount,
    sampledPixelCount: pixelCount,
    meanRed: roundedTo(red / pixelCount, 4),
    meanGreen: roundedTo(green / pixelCount, 4),
    meanBlue: roundedTo(blue / pixelCount, 4),
    meanLuma: roundedTo(luma / pixelCount, 4),
    minimumLuma: roundedTo(minimumLuma, 4),
    maximumLuma: roundedTo(maximumLuma, 4),
    blackLumaFraction: roundedTo(blackPixels / pixelCount, 6),
    whiteLumaFraction: roundedTo(whitePixels / pixelCount, 6),
  }
}

function deriveColorCorrection(
  analysis: ColorPixelAnalysis,
  style: 'clean_natural' | 'premium_clean',
  intensity: 'subtle' | 'balanced',
): DerivedColorCorrection {
  const neutralMean = (analysis.meanRed + analysis.meanGreen + analysis.meanBlue) / 3
  const channelMultiplier = (channel: number) => clamp(
    neutralMean / Math.max(16, channel),
    0.94,
    1.06,
  )
  const targetLuma = style === 'premium_clean' ? 132 : 128
  const intensityOffset = intensity === 'balanced' ? 0.01 : 0
  const contrast = style === 'premium_clean' ? 1.04 + intensityOffset : 1.025
  const channelSpread = Math.max(analysis.meanRed, analysis.meanGreen, analysis.meanBlue) -
    Math.min(analysis.meanRed, analysis.meanGreen, analysis.meanBlue)
  const exposureProtectionFactor = clamp(1 - channelSpread / 192, 0.1, 1)
  const exposureShift = clamp((targetLuma - analysis.meanLuma) / 255, -0.06, 0.06) *
    exposureProtectionFactor
  const halfInputRange = 0.5 / contrast
  const baseInputBlackPoint = 0.5 - halfInputRange
  const baseInputWhitePoint = 0.5 + halfInputRange
  return {
    redMultiplier: roundedTo(channelMultiplier(analysis.meanRed), 5),
    greenMultiplier: roundedTo(channelMultiplier(analysis.meanGreen), 5),
    blueMultiplier: roundedTo(channelMultiplier(analysis.meanBlue), 5),
    contrast: roundedTo(contrast, 5),
    saturation: roundedTo(style === 'premium_clean' ? 1.04 + intensityOffset : 1.02, 5),
    channelSpread: roundedTo(channelSpread, 4),
    exposureProtectionFactor: roundedTo(exposureProtectionFactor, 5),
    exposureShift: roundedTo(exposureShift, 5),
    inputBlackPoint: roundedTo(clamp(
      baseInputBlackPoint - exposureShift / 2,
      0,
      0.08,
    ), 5),
    inputWhitePoint: roundedTo(clamp(
      baseInputWhitePoint - exposureShift / 2,
      0.9,
      1,
    ), 5),
    outputBlackPoint: roundedTo(clamp(Math.max(0, exposureShift) * 0.25, 0, 0.02), 5),
    outputWhitePoint: roundedTo(clamp(
      (style === 'premium_clean' ? 0.985 : 0.99) + Math.min(0, exposureShift) * 0.25,
      0.96,
      0.995,
    ), 5),
    clarityApplied: style === 'premium_clean',
  }
}

function colorDeliveryCommand(
  request: OfflineFfmpegExecutionRequest,
  correction: DerivedColorCorrection,
): string[] {
  if (request.payload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1') {
    throw invalid('Color-delivery command requires its exact approved recipe.')
  }
  const saturationMatrix = colorSaturationMatrix(correction.saturation)
  const filters = [
    `trim=start_frame=${request.payload.trimStartFrame}:end_frame=${request.payload.trimEndFrameExclusive}`,
    'setpts=PTS-STARTPTS',
    `colorchannelmixer=rr=${correction.redMultiplier}:gg=${correction.greenMultiplier}:bb=${correction.blueMultiplier}:pc=lum:pa=0.75`,
    `colorchannelmixer=${saturationMatrix}`,
    'colorlevels=' + [
      `rimin=${correction.inputBlackPoint}`,
      `gimin=${correction.inputBlackPoint}`,
      `bimin=${correction.inputBlackPoint}`,
      `rimax=${correction.inputWhitePoint}`,
      `gimax=${correction.inputWhitePoint}`,
      `bimax=${correction.inputWhitePoint}`,
      `romin=${correction.outputBlackPoint}`,
      `gomin=${correction.outputBlackPoint}`,
      `bomin=${correction.outputBlackPoint}`,
      `romax=${correction.outputWhitePoint}`,
      `gomax=${correction.outputWhitePoint}`,
      `bomax=${correction.outputWhitePoint}`,
      'preserve=lum',
    ].join(':'),
    ...(correction.clarityApplied ? ['unsharp=5:5:0.35:3:3:0'] : []),
    'format=yuv420p',
    'setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709',
  ].join(',')
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:v:0', '-vf', filters,
    '-an', '-threads', '1', '-c:v', 'libvpx-vp9',
    '-lossless', '1', '-deadline', 'good', '-cpu-used', '2',
    '-row-mt', '0', '-auto-alt-ref', '0', '-lag-in-frames', '0',
    '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-color_range', 'tv',
    '-fflags', '+bitexact', '-flags:v', '+bitexact', '-map_metadata', '-1',
    '-metadata', 'creation_time=1970-01-01T00:00:00Z',
    '-f', 'matroska', 'pipe:1',
  ]
}

function isMatroska(bytes: Buffer): boolean {
  return bytes.byteLength >= 4 &&
    bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
}

function safeFfmpegDiagnostic(stderr: Buffer): string {
  const normalized = stderr.toString('utf8')
    .replace(/0x[0-9a-f]+/gi, '0x[redacted]')
    .replace(/[^\x20-\x7e]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return JSON.stringify(normalized.slice(0, 600))
}

function colorSaturationMatrix(saturation: number): string {
  const inverse = 1 - saturation
  const red = 0.2126 * inverse
  const green = 0.7152 * inverse
  const blue = 0.0722 * inverse
  return [
    `rr=${roundedTo(red + saturation, 6)}`,
    `rg=${roundedTo(green, 6)}`,
    `rb=${roundedTo(blue, 6)}`,
    `gr=${roundedTo(red, 6)}`,
    `gg=${roundedTo(green + saturation, 6)}`,
    `gb=${roundedTo(blue, 6)}`,
    `br=${roundedTo(red, 6)}`,
    `bg=${roundedTo(green, 6)}`,
    `bb=${roundedTo(blue + saturation, 6)}`,
  ].join(':')
}

function isPcmWave(bytes: Buffer): boolean {
  return pcmWaveDetails(bytes) !== undefined
}

function pcmWaveDetails(bytes: Buffer): {
  sampleRate: number
  channels: number
  bitsPerSample: number
  sampleFrameCount: number
  durationSeconds: number
} | undefined {
  if (
    bytes.byteLength < 44 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) return undefined
  const formatOffset = bytes.indexOf(Buffer.from('fmt '))
  const dataOffset = bytes.indexOf(Buffer.from('data'))
  if (
    formatOffset < 12 || dataOffset <= formatOffset || formatOffset + 24 > bytes.byteLength ||
    dataOffset + 8 > bytes.byteLength || bytes.readUInt16LE(formatOffset + 8) !== 1
  ) return undefined
  const channels = bytes.readUInt16LE(formatOffset + 10)
  const sampleRate = bytes.readUInt32LE(formatOffset + 12)
  const blockAlign = bytes.readUInt16LE(formatOffset + 20)
  const bitsPerSample = bytes.readUInt16LE(formatOffset + 22)
  const dataByteLength = bytes.byteLength - (dataOffset + 8)
  if (
    ![1, 2].includes(channels) || sampleRate !== 48_000 || bitsPerSample !== 16 ||
    blockAlign !== channels * (bitsPerSample / 8) || dataByteLength <= 0 ||
    dataByteLength % blockAlign !== 0
  ) return undefined
  const sampleFrameCount = dataByteLength / blockAlign
  return {
    sampleRate, channels, bitsPerSample, sampleFrameCount,
    durationSeconds: sampleFrameCount / sampleRate,
  }
}

async function probeFfmpegOutput(
  image: OfflineMediaBinaryImageEvidence,
  bytes: Buffer,
  expectedFrameCount: number,
  expectedFrameRate: number,
  expectProfessionalColor = false,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-count_frames', '-show_entries',
    'format=format_name,duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate,nb_read_frames,pix_fmt,color_space,color_transfer,color_primaries,color_range',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command)
    const result = await dockerBuffer(['start', '--attach', '--interactive', container.id], bytes, 2 * 1024 * 1024)
    if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFmpeg output verification failed closed.')
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const video = streams.find((stream) => stream.codec_type === 'video')
    if (
      !video || video.codec_name !== (expectProfessionalColor ? 'vp9' : 'ffv1') ||
      !String(format.format_name ?? '').includes(
        expectProfessionalColor ? 'matroska' : 'nut',
      ) ||
      optionalInteger(video.nb_read_frames) !== expectedFrameCount ||
      rational(video.avg_frame_rate) !== expectedFrameRate ||
      (expectProfessionalColor && (
        video.pix_fmt !== 'yuv420p' || video.color_space !== 'bt709' ||
        video.color_transfer !== 'bt709' || video.color_primaries !== 'bt709'
      ))
    ) throw unavailable('FFmpeg intermediate output failed codec, container, frame-count, or rate verification.')
    return {
      container: expectProfessionalColor ? 'matroska' : 'nut',
      videoCodec: expectProfessionalColor ? 'vp9' : 'ffv1',
      frameCount: expectedFrameCount,
      frameRate: expectedFrameRate,
      width: optionalInteger(video.width), height: optionalInteger(video.height),
      pixelFormat: safeText(video.pix_fmt), colorSpace: safeText(video.color_space),
      colorTransfer: safeText(video.color_transfer),
      colorPrimaries: safeText(video.color_primaries), colorRange: safeText(video.color_range),
      durationSeconds: optionalNumber(format.duration), sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundedTo(value: number, digits: number): number {
  return Number(value.toFixed(digits))
}

async function probeFfmpegVoiceDeliveryOutput(
  image: OfflineMediaBinaryImageEvidence,
  bytes: Buffer,
  expectedDurationSeconds: number,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-show_entries',
    'format=format_name,duration,size:stream=codec_name,codec_type,sample_rate,channels,channel_layout,duration',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command)
    const result = await dockerBuffer(['start', '--attach', '--interactive', container.id], bytes, 2 * 1024 * 1024)
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('FFmpeg voice-delivery output verification failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const audio = streams.find((stream) => stream.codec_type === 'audio')
    const wave = pcmWaveDetails(bytes)
    if (!wave) throw unavailable('FFmpeg voice-delivery output failed its PCM WAV structure verification.')
    const durationSeconds = wave.durationSeconds
    const durationToleranceSeconds = 2 / 48_000
    if (
      streams.length !== 1 || !audio || audio.codec_name !== 'pcm_s16le' ||
      !String(format.format_name ?? '').includes('wav') ||
      optionalInteger(audio.sample_rate) !== 48_000 || optionalInteger(audio.channels) !== 2 ||
      wave.sampleRate !== 48_000 || wave.channels !== 2 || wave.bitsPerSample !== 16 ||
      Math.abs(durationSeconds - expectedDurationSeconds) > durationToleranceSeconds
    ) throw unavailable('FFmpeg voice-delivery output failed WAV, PCM, channel, rate, or duration verification.')
    return {
      container: 'wav', audioCodec: 'pcm_s16le', sampleRate: 48_000,
      channels: 2, channelLayout: String(audio.channel_layout ?? 'stereo'),
      sampleFrameCount: wave.sampleFrameCount, durationSeconds, expectedDurationSeconds,
      durationToleranceSeconds, sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function inspectImage(): Promise<OfflineMediaBinaryImageEvidence> {
  const inspected = await dockerBuffer(['image', 'inspect', IMAGE_TAG], undefined, 8 * 1024 * 1024)
  if (inspected.exitCode !== 0 || inspected.stderr.length > 0) throw unavailable('Pinned FFmpeg LGPL image is unavailable.')
  const parsed = JSON.parse(inspected.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('Pinned media image inspection is invalid.')
  const image = record(parsed[0])
  const config = record(image.Config)
  const labels = stringRecord(config.Labels)
  if (
    image.Os !== 'linux' || typeof image.Architecture !== 'string' ||
    typeof image.Id !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(image.Id) ||
    config.User !== '65532:65532' || labels['org.opencontainers.image.version'] !== SOURCE_VERSION ||
    labels['reeditpro.product-ready'] !== 'false' ||
    labels['reeditpro.h264-encoding'] !== 'blocked_not_compiled'
  ) throw unavailable('Pinned media image identity or safety labels are invalid.')
  const sourcePolicyHashes = await policyHashes()
  const imageIdentityHash = sha256AuthorityValue({
    imageId: image.Id, architecture: image.Architecture, os: image.Os,
    user: config.User, labels, sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256, sourcePolicyHashes,
  })
  return {
    imageTag: IMAGE_TAG,
    imageId: image.Id,
    imageIdentityHash,
    architecture: image.Architecture,
    os: 'linux',
    user: '65532:65532',
    sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256,
    productReady: false,
    h264Encoding: 'blocked_not_compiled',
    sourcePolicyHashes,
  }
}

async function persistAuthority(image: OfflineMediaBinaryImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-media-binary-runtime-authority-v1' as const,
    source: 'private_local_pinned_ffmpeg_lgpl_runtime' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: [
      { toolId: 'ffmpeg' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
      { toolId: 'ffprobe' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
    ] as const,
    readiness: {
      privateInternalExecutionReady: true as const,
      exactStructuredPayloadOnly: true as const,
      canonicalDispatchMayReference: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      finalExportReady: false as const,
    },
    blockers: [
      'Private single-host evidence is not deployed worker-fleet or production authority.',
      'The reviewed LGPL image has unresolved base-image CVEs and legal/distribution review gates.',
      'H.264/MP4 encoding and final export are intentionally not compiled or authorized.',
    ] as const,
  }
  const authority: OfflineMediaBinaryRuntimeAuthority = {
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: AUTHORITY_PATH,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-media-binary-runtime-authority-record-v1',
      source: 'private_local_checksum_protected_media_binary_runtime',
      authority,
      checksumSha256: sha256AuthorityValue(authority),
    })}\n`,
  })
}

function ffprobeArguments(request: OfflineFfprobeExecutionRequest): string[] {
  return [
    '-v', 'error',
    ...(request.payload.countFrames ? ['-count_frames'] : []),
    '-show_entries',
    'format=format_name,duration,size:stream=index,codec_name,codec_type,width,height,avg_frame_rate,r_frame_rate,duration,pix_fmt,color_space,sample_rate,channels,nb_read_frames',
    '-print_format', 'json',
    '-i', 'pipe:0',
  ]
}

async function createContainer(
  image: OfflineMediaBinaryImageEvidence,
  entrypoint: typeof FFPROBE_ENTRYPOINT | typeof FFMPEG_ENTRYPOINT,
  command: string[],
) {
  const created = await dockerBuffer([
    'create', '--interactive', '--network', 'none', '--read-only',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '128', '--memory', '512m', '--memory-swap', '512m', '--cpus', '2',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=67108864,mode=1777',
    '--user', '65532:65532', '--entrypoint', entrypoint,
    image.imageId, ...command,
  ], undefined, 64 * 1024)
  const id = created.stdout.toString('utf8').trim()
  if (created.exitCode !== 0 || created.stderr.length > 0 || !/^[a-f0-9]{64}$/.test(id)) {
    throw unavailable('Confined FFprobe container could not be created.')
  }
  return { id }
}

function validateConfinement(
  inspect: Record<string, unknown>,
  image: OfflineMediaBinaryImageEvidence,
  entrypoint: typeof FFPROBE_ENTRYPOINT | typeof FFMPEG_ENTRYPOINT,
  command: string[],
): OfflineMediaBinaryConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const tmpfs = stringRecord(host.Tmpfs)
  const security = stringArray(host.SecurityOpt)
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true ||
    host.Privileged !== false || stringArray(host.CapDrop).join('|') !== 'ALL' ||
    !security.some((value) => value.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 128 || Number(host.Memory) !== 536_870_912 ||
    Number(host.MemorySwap) !== 536_870_912 || Number(host.NanoCpus) !== 2_000_000_000 ||
    config.User !== '65532:65532' || stringArray(config.Entrypoint).join('|') !== entrypoint ||
    stableAuthorityStringify(stringArray(config.Cmd)) !== stableAuthorityStringify(command) ||
    (Array.isArray(inspect.Mounts) && inspect.Mounts.length > 0) ||
    (Array.isArray(host.Binds) && host.Binds.length > 0) ||
    !String(tmpfs['/tmp'] ?? '').includes('noexec')
  ) throw unavailable('FFprobe container confinement does not match server policy.')
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true,
    noNewPrivileges: true, privileged: false, pidsLimit: 128,
    memoryLimitBytes: 536_870_912, memoryAndSwapLimitBytes: 536_870_912,
    nanoCpus: 2_000_000_000, tmpfsPath: '/tmp', user: '65532:65532',
    callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false,
    serverOwnedEntrypoint: entrypoint, serverDerivedArgumentsOnly: true,
  }
}

function normalizeProbe(bytes: Buffer, request: OfflineFfprobeExecutionRequest): Readonly<Record<string, unknown>> {
  let raw: Record<string, unknown>
  try { raw = record(JSON.parse(bytes.toString('utf8'))) } catch { throw unavailable('FFprobe did not return valid JSON.') }
  const rawStreams = Array.isArray(raw.streams) ? raw.streams.slice(0, 32).map(record) : []
  const rawFormat = record(raw.format)
  const streams = rawStreams.map((stream) => ({
    index: safeInteger(stream.index),
    codecName: safeText(stream.codec_name),
    codecType: safeText(stream.codec_type),
    width: optionalInteger(stream.width),
    height: optionalInteger(stream.height),
    fps: rational(stream.avg_frame_rate ?? stream.r_frame_rate),
    durationSeconds: optionalNumber(stream.duration),
    pixelFormat: optionalText(stream.pix_fmt),
    colorSpace: optionalText(stream.color_space),
    sampleRate: optionalNumber(stream.sample_rate),
    channels: optionalInteger(stream.channels),
    readFrameCount: request.payload.countFrames ? optionalInteger(stream.nb_read_frames) : undefined,
  }))
  if (streams.length === 0 || !streams.some((stream) => stream.codecType === 'video' || stream.codecType === 'audio')) {
    throw unavailable('FFprobe found no supported media streams.')
  }
  const durationSeconds = optionalNumber(rawFormat.duration) ??
    Math.max(...streams.map((stream) => stream.durationSeconds ?? 0))
  if (!durationSeconds || durationSeconds <= 0) throw unavailable('FFprobe found no positive media duration.')
  const streamDurations = streams.map((stream) => stream.durationSeconds).filter((value): value is number => Boolean(value))
  if (streamDurations.length > 1 && Math.max(...streamDurations) - Math.min(...streamDurations) > 1) {
    throw unavailable('FFprobe detected source stream duration drift above the fixed tolerance.')
  }
  return {
    profileId: request.payload.inspectionProfileId,
    formatName: safeText(rawFormat.format_name),
    durationSeconds: rounded(durationSeconds),
    sizeBytes: optionalInteger(rawFormat.size) ?? request.payload.sourceByteLength,
    streamCount: streams.length,
    streams,
  }
}

async function inspectContainer(id: string): Promise<Record<string, unknown>> {
  const result = await dockerBuffer(['inspect', id], undefined, 8 * 1024 * 1024)
  if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFprobe container inspection failed.')
  const parsed = JSON.parse(result.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('FFprobe container inspection is invalid.')
  return record(parsed[0])
}

async function policyHashes(): Promise<Record<string, string>> {
  const directory = join(process.cwd(), 'docker/prod/ffmpeg-lgpl-runtime')
  const names = [
    'Dockerfile', 'source-provenance.lock', 'configure-flags.txt',
    'allowed-encoders.txt', 'allowed-decoders.txt', 'allowed-filters.txt',
    'allowed-demuxers.txt', 'allowed-muxers.txt', 'allowed-protocols.txt', 'allowed-bsfs.txt',
  ]
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, sha256(await readFile(join(directory, name)))])))
}

function dockerBuffer(args: string[], input: Buffer | undefined, maximumBytes: number): Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '' } })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(unavailable('Docker media operation timed out.')) }, TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes > maximumBytes) child.kill('SIGKILL')
      else stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
      else stderr.push(chunk)
    })
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (stdoutBytes > maximumBytes || stderrBytes > 512 * 1024) return reject(unavailable('Docker media output exceeded its fixed bound.'))
      resolve({ exitCode: code ?? 1, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) })
    })
    if (input) child.stdin.end(input)
    else child.stdin.end()
  })
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Media runtime record is invalid.')
  return value as Record<string, unknown>
}
function stringRecord(value: unknown): Record<string, string> {
  const output = record(value)
  if (Object.values(output).some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string record is invalid.')
  return output as Record<string, string>
}
function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string array is invalid.')
  return value
}
function safeInteger(value: unknown): number { const parsed = optionalInteger(value); if (parsed === undefined) throw unavailable('FFprobe integer is invalid.'); return parsed }
function optionalInteger(value: unknown): number | undefined { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined }
function optionalNumber(value: unknown): number | undefined { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? rounded(parsed) : undefined }
function rational(value: unknown): number | undefined { const [a, b] = String(value ?? '').split('/').map(Number); return Number.isFinite(a) && Number.isFinite(b) && b ? rounded(a / b) : undefined }
function safeText(value: unknown): string { const text = String(value ?? 'unknown'); return /^[A-Za-z0-9,._ -]{1,160}$/.test(text) ? text : 'unknown' }
function optionalText(value: unknown): string | undefined { return value === undefined ? undefined : safeText(value) }
function rounded(value: number): number { return Number(value.toFixed(6)) }
function sha256(value: Buffer): string { return createHash('sha256').update(value).digest('hex') }
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
function unavailable(message: string): ApiError { return new ApiError('TOOL_NOT_READY', message, 503) }
