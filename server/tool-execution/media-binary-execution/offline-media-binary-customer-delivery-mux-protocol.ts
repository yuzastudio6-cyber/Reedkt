import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES } from
  '../remotion-render-execution/offline-remotion-delivery-h264-chunk-protocol'
import { OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES } from
  './offline-media-binary-continuous-program-audio-protocol'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_PROTOCOL =
  'offline-media-binary-customer-delivery-mux-v1' as const
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAGIC =
  'REEDITPRO_FFMPEG_CUSTOMER_DELIVERY_MUX_V1' as const
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_INPUT_MODE =
  'server_injected_private_h264_chunks_and_program_flac_v1' as const
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE =
  'approved_long_form_delivery_h264_aac_master_v1' as const
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MINIMUM_CHUNKS = 2
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNKS = 124
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNK_BYTES =
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_AUDIO_BYTES =
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES
export const OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES =
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNKS *
    OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNK_BYTES +
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_AUDIO_BYTES

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const FOUR_K_FRAMES = new Set([
  '3840x2160', '2160x3840', '2160x2160', '2160x2700', '2880x2160',
])

export interface OfflineCustomerDeliveryMuxChunkPlan {
  chunkId: string
  chunkIndex: number
  chunkCount: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  objectIdentity: string
  independentQaHash: string
}

export interface OfflineCustomerDeliveryMuxPlanningPayload {
  recipeProfileId:
    typeof OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE
  muxAuthorityHash: string
  expectedObjectIdentity: string
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 30
  totalFrames: number
  chunks: OfflineCustomerDeliveryMuxChunkPlan[]
  continuousProgramAudioObjectIdentity: string
  continuousProgramAudioQaHash: string
  videoAssemblyPolicy: 'ordered_compatible_h264_chunk_stream_copy_v1'
  audioAssemblyPolicy: 'encode_exact_continuous_flac_program_audio_to_aac_once_v1'
  timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1'
  compatibilityPolicy: 'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1'
  outputContainer: 'mp4'
  outputVideoCodec: 'copy_h264'
  outputAudioCodec: 'aac_lc'
  outputAudioBitrate: 192000
  outputAudioSampleRate: 48000
  outputAudioChannels: 2
  frontLoadedInitializationMetadataRequired: true
  fullProgramVideoReencodeAllowed: false
  audioEncodeCount: 1
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  renderPurpose: 'private_4k_customer_delivery_master_v1'
}

export interface OfflineCustomerDeliveryMuxChunkCommitment {
  inputId: string
  chunkId: string
  chunkIndex: number
  objectIdentity: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
}

export interface OfflineCustomerDeliveryMuxAudioCommitment {
  inputId: string
  objectIdentity: string
  mimeType: 'audio/flac'
  byteLength: number
  sha256: string
}

export interface OfflineMediaBinaryCustomerDeliveryMuxRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_INPUT_MODE
  payload: OfflineCustomerDeliveryMuxPlanningPayload
  inputs: {
    chunks: OfflineCustomerDeliveryMuxChunkCommitment[]
    programAudio: OfflineCustomerDeliveryMuxAudioCommitment
  }
}

export function buildOfflineMediaBinaryCustomerDeliveryMuxRequest(input: {
  planningPayload: unknown
  chunks: OfflineCustomerDeliveryMuxChunkCommitment[]
  programAudio: OfflineCustomerDeliveryMuxAudioCommitment
}): OfflineMediaBinaryCustomerDeliveryMuxRequest {
  return validateOfflineMediaBinaryCustomerDeliveryMuxRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { chunks: input.chunks, programAudio: input.programAudio },
  })
}

export function validateOfflineMediaBinaryCustomerDeliveryMuxRequest(
  value: unknown,
): OfflineMediaBinaryCustomerDeliveryMuxRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'customer-delivery mux request')
  if (
    request.schemaVersion !==
      OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !==
      OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_INPUT_MODE
  ) throw invalid('Customer-delivery mux request identity is unsupported.')
  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(
    request.inputs,
    ['chunks', 'programAudio'],
    'customer-delivery mux inputs',
  )
  if (
    !Array.isArray(inputs.chunks) ||
    inputs.chunks.length !== payload.chunks.length
  ) throw invalid('Customer-delivery mux chunk commitments are incomplete.')
  let combinedBytes = 0
  const inputIds = new Set<string>()
  const chunks = inputs.chunks.map((value, index) => {
    const record = exactRecord(value, [
      'inputId', 'chunkId', 'chunkIndex', 'objectIdentity', 'mimeType',
      'byteLength', 'sha256',
    ], `customer-delivery mux chunk ${index + 1}`)
    const planned = payload.chunks[index]!
    const normalized: OfflineCustomerDeliveryMuxChunkCommitment = {
      inputId: identity(record.inputId, 'chunk inputId'),
      chunkId: identity(record.chunkId, 'chunkId'),
      chunkIndex: integer(
        record.chunkIndex,
        1,
        OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNKS,
        'chunkIndex',
      ),
      objectIdentity: hash(record.objectIdentity, 'chunk objectIdentity'),
      mimeType: record.mimeType as 'video/mp4',
      byteLength: integer(
        record.byteLength,
        1_024,
        OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNK_BYTES,
        'chunk byteLength',
      ),
      sha256: hash(record.sha256, 'chunk sha256'),
    }
    if (
      normalized.mimeType !== 'video/mp4' ||
      normalized.chunkId !== planned.chunkId ||
      normalized.chunkIndex !== planned.chunkIndex ||
      normalized.objectIdentity !== planned.objectIdentity ||
      inputIds.has(normalized.inputId)
    ) throw invalid('Customer-delivery mux chunk changed from approved order.')
    inputIds.add(normalized.inputId)
    combinedBytes += normalized.byteLength
    return normalized
  })
  if (!Number.isSafeInteger(combinedBytes)) {
    throw invalid('Customer-delivery mux input bytes exceed the safe bound.')
  }
  const audioRecord = exactRecord(inputs.programAudio, [
    'inputId', 'objectIdentity', 'mimeType', 'byteLength', 'sha256',
  ], 'customer-delivery mux program audio')
  const programAudio: OfflineCustomerDeliveryMuxAudioCommitment = {
    inputId: identity(audioRecord.inputId, 'audio inputId'),
    objectIdentity: hash(audioRecord.objectIdentity, 'audio objectIdentity'),
    mimeType: audioRecord.mimeType as 'audio/flac',
    byteLength: integer(
      audioRecord.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_AUDIO_BYTES,
      'audio byteLength',
    ),
    sha256: hash(audioRecord.sha256, 'audio sha256'),
  }
  if (
    programAudio.mimeType !== 'audio/flac' ||
    programAudio.objectIdentity !==
      payload.continuousProgramAudioObjectIdentity ||
    inputIds.has(programAudio.inputId)
  ) throw invalid('Customer-delivery mux program-audio commitment is invalid.')
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_INPUT_MODE,
    payload,
    inputs: { chunks, programAudio },
  }
}

export function offlineMediaBinaryCustomerDeliveryMuxRequestSha256(
  request: OfflineMediaBinaryCustomerDeliveryMuxRequest,
): string {
  return createHash('sha256')
    .update(JSON.stringify(
      validateOfflineMediaBinaryCustomerDeliveryMuxRequest(request),
    ))
    .digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineCustomerDeliveryMuxPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId', 'muxAuthorityHash', 'expectedObjectIdentity',
    'width', 'height', 'fps', 'totalFrames', 'chunks',
    'continuousProgramAudioObjectIdentity', 'continuousProgramAudioQaHash',
    'videoAssemblyPolicy', 'audioAssemblyPolicy', 'timestampPolicy',
    'compatibilityPolicy', 'outputContainer', 'outputVideoCodec',
    'outputAudioCodec', 'outputAudioBitrate', 'outputAudioSampleRate',
    'outputAudioChannels', 'frontLoadedInitializationMetadataRequired',
    'fullProgramVideoReencodeAllowed', 'audioEncodeCount',
    'usesApprovedEditReservation', 'requiresSeparateExportEstimate',
    'allowsAdditionalExportCharge', 'renderPurpose',
  ], 'customer-delivery mux planning payload')
  const width = integer(payload.width, 2_160, 3_840, 'width')
  const height = integer(payload.height, 2_160, 3_840, 'height')
  const totalFrames = integer(payload.totalFrames, 2_700, 648_000, 'totalFrames')
  if (!Array.isArray(payload.chunks)) {
    throw invalid('Customer-delivery mux chunks are invalid.')
  }
  const chunkCount = payload.chunks.length
  if (
    chunkCount < OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MINIMUM_CHUNKS ||
    chunkCount > OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_CHUNKS
  ) throw invalid('Customer-delivery mux chunk count is outside its bound.')
  let expectedStart = 0
  const chunks = payload.chunks.map((value, index) => {
    const record = exactRecord(value, [
      'chunkId', 'chunkIndex', 'chunkCount', 'globalStartFrame',
      'globalEndFrameExclusive', 'durationFrames', 'objectIdentity',
      'independentQaHash',
    ], `customer-delivery mux chunk plan ${index + 1}`)
    const start = integer(record.globalStartFrame, 0, 647_999, 'chunk start')
    const end = integer(record.globalEndFrameExclusive, 1, 648_000, 'chunk end')
    const duration = integer(record.durationFrames, 1_350, 5_400, 'chunk duration')
    if (
      start !== expectedStart || end - start !== duration ||
      record.chunkIndex !== index + 1 || record.chunkCount !== chunkCount
    ) throw invalid('Customer-delivery mux lost contiguous timeline authority.')
    expectedStart = end
    return {
      chunkId: identity(record.chunkId, 'chunkId'),
      chunkIndex: index + 1,
      chunkCount,
      globalStartFrame: start,
      globalEndFrameExclusive: end,
      durationFrames: duration,
      objectIdentity: hash(record.objectIdentity, 'chunk objectIdentity'),
      independentQaHash: hash(record.independentQaHash, 'chunk QA hash'),
    }
  })
  if (
    expectedStart !== totalFrames ||
    payload.recipeProfileId !==
      OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE ||
    !FOUR_K_FRAMES.has(`${width}x${height}`) || payload.fps !== 30 ||
    payload.videoAssemblyPolicy !==
      'ordered_compatible_h264_chunk_stream_copy_v1' ||
    payload.audioAssemblyPolicy !==
      'encode_exact_continuous_flac_program_audio_to_aac_once_v1' ||
    payload.timestampPolicy !==
      'normalize_from_zero_preserve_frame_and_sample_time_v1' ||
    payload.compatibilityPolicy !==
      'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1' ||
    payload.outputContainer !== 'mp4' ||
    payload.outputVideoCodec !== 'copy_h264' ||
    payload.outputAudioCodec !== 'aac_lc' ||
    payload.outputAudioBitrate !== 192_000 ||
    payload.outputAudioSampleRate !== 48_000 ||
    payload.outputAudioChannels !== 2 ||
    payload.frontLoadedInitializationMetadataRequired !== true ||
    payload.fullProgramVideoReencodeAllowed !== false ||
    payload.audioEncodeCount !== 1 ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false ||
    payload.renderPurpose !== 'private_4k_customer_delivery_master_v1'
  ) throw invalid('Customer-delivery mux planning policy is unsupported.')
  return {
    recipeProfileId: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE,
    muxAuthorityHash: hash(payload.muxAuthorityHash, 'mux authority hash'),
    expectedObjectIdentity: hash(
      payload.expectedObjectIdentity,
      'output object identity',
    ),
    width: width as OfflineCustomerDeliveryMuxPlanningPayload['width'],
    height: height as OfflineCustomerDeliveryMuxPlanningPayload['height'],
    fps: 30,
    totalFrames,
    chunks,
    continuousProgramAudioObjectIdentity: hash(
      payload.continuousProgramAudioObjectIdentity,
      'program-audio object identity',
    ),
    continuousProgramAudioQaHash: hash(
      payload.continuousProgramAudioQaHash,
      'program-audio QA hash',
    ),
    videoAssemblyPolicy: 'ordered_compatible_h264_chunk_stream_copy_v1',
    audioAssemblyPolicy:
      'encode_exact_continuous_flac_program_audio_to_aac_once_v1',
    timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1',
    compatibilityPolicy:
      'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1',
    outputContainer: 'mp4',
    outputVideoCodec: 'copy_h264',
    outputAudioCodec: 'aac_lc',
    outputAudioBitrate: 192_000,
    outputAudioSampleRate: 48_000,
    outputAudioChannels: 2,
    frontLoadedInitializationMetadataRequired: true,
    fullProgramVideoReencodeAllowed: false,
    audioEncodeCount: 1,
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    renderPurpose: 'private_4k_customer_delivery_master_v1',
  }
}

function exactRecord(value: unknown, keys: string[], label: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} is invalid.`)
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return record
}

function identity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || !IDENTITY.test(value) || value.includes('..')
  ) throw invalid(`${label} is invalid.`)
  return value
}

function hash(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`${label} is invalid.`)
  }
  return value
}

function integer(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (
    !Number.isSafeInteger(value) || Number(value) < minimum ||
    Number(value) > maximum
  ) throw invalid(`${label} is invalid.`)
  return Number(value)
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'offline_media_binary_customer_delivery_mux_contract',
  })
}
