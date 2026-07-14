import { createHash } from 'node:crypto'

export const OFFLINE_MEDIA_BINARY_PROTOCOL = 'offline-media-binary-execution-v1' as const
export const OFFLINE_MEDIA_BINARY_OPERATIONS = Object.freeze({
  ffmpeg: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  ffprobe: 'tool.ffprobe.inspect_approved_media.v1',
} as const)

interface OfflineFfmpegCommonPlanningPayload {
  timestampPolicy: 'normalize_from_zero'
  overwriteExistingArtifact: false
  allowUnreviewedCodec: false
  trimStartFrame: number
  trimEndFrameExclusive: number
  frameRate: 24 | 25 | 30 | 50 | 60
}

export interface OfflineFfmpegTrimPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_trim_transcode_v1'
}

export interface OfflineFfmpegVoiceDeliveryPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_voice_delivery_wav_v1'
  sampleRate: 48_000
  channelMode: 'stereo'
  targetLufs: -14
  truePeakDbtp: -1
  loudnessRangeLufs: 7
  highpassHz: 70
  compressorPreset: 'gentle_voice_v1'
}

export type OfflineFfmpegPlanningPayload =
  | OfflineFfmpegTrimPlanningPayload
  | OfflineFfmpegVoiceDeliveryPlanningPayload

export interface OfflineFfprobePlanningPayload {
  inspectionProfileId: 'source_intake_v1' | 'pre_render_v1' | 'final_export_v1'
  countFrames: boolean
  verifyDurationAndSync: true
  emitMachineJsonOnly: true
}

export interface OfflineFfprobeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffprobe'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  payload: OfflineFfprobePlanningPayload & {
    mimeType: 'video/mp4'
    sourceByteLength: number
    sourceSha256: string
    sourceBytesBase64: string
  }
}

export interface OfflineFfmpegExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  payload: OfflineFfmpegPlanningPayload & {
    mimeType: 'video/mp4'
    sourceByteLength: number
    sourceSha256: string
    sourceBytesBase64: string
  }
}

export function validateOfflineFfmpegPlanningPayload(value: unknown): OfflineFfmpegPlanningPayload {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  const voiceDelivery = candidate?.recipeProfileId === 'approved_voice_delivery_wav_v1'
  const payload = exactObject(value, [
    'recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact', 'allowUnreviewedCodec',
    'trimStartFrame', 'trimEndFrameExclusive', 'frameRate',
    ...(voiceDelivery
      ? [
          'sampleRate', 'channelMode', 'targetLufs', 'truePeakDbtp',
          'loudnessRangeLufs', 'highpassHz', 'compressorPreset',
        ]
      : []),
  ])
  if (
    !['approved_trim_transcode_v1', 'approved_voice_delivery_wav_v1'].includes(
      String(payload.recipeProfileId),
    ) ||
    payload.timestampPolicy !== 'normalize_from_zero' ||
    payload.overwriteExistingArtifact !== false || payload.allowUnreviewedCodec !== false ||
    !Number.isSafeInteger(payload.trimStartFrame) || Number(payload.trimStartFrame) < 0 ||
    !Number.isSafeInteger(payload.trimEndFrameExclusive) ||
    Number(payload.trimEndFrameExclusive) <= Number(payload.trimStartFrame) ||
    Number(payload.trimEndFrameExclusive) > 100_000_001 ||
    ![24, 25, 30, 50, 60].includes(Number(payload.frameRate))
  ) throw invalid()
  const common = {
    timestampPolicy: 'normalize_from_zero',
    overwriteExistingArtifact: false,
    allowUnreviewedCodec: false,
    trimStartFrame: Number(payload.trimStartFrame),
    trimEndFrameExclusive: Number(payload.trimEndFrameExclusive),
    frameRate: Number(payload.frameRate) as OfflineFfmpegPlanningPayload['frameRate'],
  } as const
  if (!voiceDelivery) {
    return { recipeProfileId: 'approved_trim_transcode_v1', ...common }
  }
  if (
    payload.sampleRate !== 48_000 || payload.channelMode !== 'stereo' ||
    payload.targetLufs !== -14 || payload.truePeakDbtp !== -1 ||
    payload.loudnessRangeLufs !== 7 || payload.highpassHz !== 70 ||
    payload.compressorPreset !== 'gentle_voice_v1'
  ) throw invalid()
  return {
    recipeProfileId: 'approved_voice_delivery_wav_v1',
    ...common,
    sampleRate: 48_000,
    channelMode: 'stereo',
    targetLufs: -14,
    truePeakDbtp: -1,
    loudnessRangeLufs: 7,
    highpassHz: 70,
    compressorPreset: 'gentle_voice_v1',
  }
}

export function validateOfflineFfprobePlanningPayload(value: unknown): OfflineFfprobePlanningPayload {
  const payload = exactObject(value, [
    'inspectionProfileId', 'countFrames', 'verifyDurationAndSync', 'emitMachineJsonOnly',
  ])
  if (
    !['source_intake_v1', 'pre_render_v1', 'final_export_v1'].includes(String(payload.inspectionProfileId)) ||
    typeof payload.countFrames !== 'boolean' ||
    payload.verifyDurationAndSync !== true ||
    payload.emitMachineJsonOnly !== true
  ) throw invalid()
  return {
    inspectionProfileId: payload.inspectionProfileId as OfflineFfprobePlanningPayload['inspectionProfileId'],
    countFrames: payload.countFrames,
    verifyDurationAndSync: true,
    emitMachineJsonOnly: true,
  }
}

export function validateOfflineFfprobeExecutionRequest(value: unknown): OfflineFfprobeExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL ||
    request.toolId !== 'ffprobe' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'inspectionProfileId', 'countFrames', 'verifyDurationAndSync', 'emitMachineJsonOnly',
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ])
  const planning = validateOfflineFfprobePlanningPayload({
    inspectionProfileId: payload.inspectionProfileId,
    countFrames: payload.countFrames,
    verifyDurationAndSync: payload.verifyDurationAndSync,
    emitMachineJsonOnly: payload.emitMachineJsonOnly,
  })
  if (
    payload.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength ||
    bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256
  ) throw invalid()
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      ...planning,
      mimeType: 'video/mp4',
      sourceByteLength: bytes.byteLength,
      sourceSha256: payload.sourceSha256,
      sourceBytesBase64: payload.sourceBytesBase64,
    },
  }
}

export function validateOfflineFfmpegExecutionRequest(value: unknown): OfflineFfmpegExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact', 'allowUnreviewedCodec',
    'trimStartFrame', 'trimEndFrameExclusive', 'frameRate',
    ...(
      request.payload && typeof request.payload === 'object' &&
      !Array.isArray(request.payload) &&
      (request.payload as Record<string, unknown>).recipeProfileId === 'approved_voice_delivery_wav_v1'
        ? [
            'sampleRate', 'channelMode', 'targetLufs', 'truePeakDbtp',
            'loudnessRangeLufs', 'highpassHz', 'compressorPreset',
          ]
        : []
    ),
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ])
  const planning = validateOfflineFfmpegPlanningPayload({
    recipeProfileId: payload.recipeProfileId,
    timestampPolicy: payload.timestampPolicy,
    overwriteExistingArtifact: payload.overwriteExistingArtifact,
    allowUnreviewedCodec: payload.allowUnreviewedCodec,
    trimStartFrame: payload.trimStartFrame,
    trimEndFrameExclusive: payload.trimEndFrameExclusive,
    frameRate: payload.frameRate,
    ...(payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
      ? {
          sampleRate: payload.sampleRate,
          channelMode: payload.channelMode,
          targetLufs: payload.targetLufs,
          truePeakDbtp: payload.truePeakDbtp,
          loudnessRangeLufs: payload.loudnessRangeLufs,
          highpassHz: payload.highpassHz,
          compressorPreset: payload.compressorPreset,
        }
      : {}),
  })
  const source = validateSource(payload)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: { ...planning, ...source },
  }
}

function validateSource(payload: Record<string, unknown>) {
  if (
    payload.mimeType !== 'video/mp4' || !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 || Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256
  ) throw invalid()
  return {
    mimeType: 'video/mp4' as const,
    sourceByteLength: bytes.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: payload.sourceBytesBase64,
  }
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid()
  return record
}

function invalid(): Error {
  return new Error('Offline FFprobe request is outside its fixed structured contract.')
}
