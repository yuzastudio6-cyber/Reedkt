import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID } from
  '../../edit-architecture/professional-long-form-object-execution-plan'
import { OFFLINE_REMOTION_RENDER_OPERATION } from
  './offline-remotion-render-execution-protocol'

export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_REQUEST_PROTOCOL =
  'offline-remotion-delivery-h264-chunk-stream-execution-v1' as const
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_CONTAINER_PROTOCOL =
  'offline-remotion-delivery-h264-chunk-stream-execution-container-v1' as const
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE =
  'approved_long_form_delivery_h264_video_chunk_v1' as const
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_COMPOSITION_PROFILE =
  'approved_long_form_delivery_h264_video_chunk_v1' as const
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_INPUT_MODE =
  'server_injected_private_stream_v1' as const
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE =
  'delivery_h264_chunk_cpu_4vcpu_8gib_v1' as const

export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_MANIFEST_BYTES =
  64 * 1024
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_SOURCE_BYTES =
  512 * 1024 * 1024
export const OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES =
  3 * 1024 * 1024 * 1024

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const APPROVED_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])

export interface OfflineRemotionDeliveryH264ChunkPlanningPayload {
  recipeProfileId: typeof OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE
  compositionProfileId:
    typeof OFFLINE_REMOTION_DELIVERY_H264_CHUNK_COMPOSITION_PROFILE
  longFormCapacityProfileId:
    typeof PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID
  chunkId: string
  chunkAuthorityHash: string
  sourceVp9ObjectIdentity: string
  expectedOutputIdentity: string
  chunkIndex: number
  chunkCount: number
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 30
  durationFrames: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  sourceVideoPolicy: 'exact_passed_vp9_object_chunk_v2'
  transcodePolicy: 'h264_high_crf18_medium_frame_preserving_v1'
  outputContainer: 'mp4'
  outputVideoCodec: 'h264'
  outputVideoProfile: 'high'
  outputCrf: 18
  outputPreset: 'medium'
  outputPixelFormat: 'yuv420p'
  outputColorRange: 'tv'
  outputColorSpace: 'bt709'
  outputColorTransfer: 'bt709'
  outputColorPrimaries: 'bt709'
  outputAudioPolicy: 'video_only_no_audio'
  renderPurpose: 'private_4k_customer_delivery_video_chunk_v1'
  deliveryProfileId: 'uhd_2160'
  estimateCostBasisProfileId: 'uhd_2160'
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineRemotionDeliveryH264ChunkSourceCommitment {
  inputId: string
  mimeType: 'video/x-matroska'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionDeliveryH264ChunkRequest {
  schemaVersion: typeof OFFLINE_REMOTION_DELIVERY_H264_CHUNK_REQUEST_PROTOCOL
  toolId: 'remotion'
  operationId: typeof OFFLINE_REMOTION_RENDER_OPERATION
  inputMode: typeof OFFLINE_REMOTION_DELIVERY_H264_CHUNK_INPUT_MODE
  payload: OfflineRemotionDeliveryH264ChunkPlanningPayload
  inputs: {
    source: OfflineRemotionDeliveryH264ChunkSourceCommitment
  }
}

export function buildOfflineRemotionDeliveryH264ChunkRequest(input: {
  planningPayload: unknown
  source: OfflineRemotionDeliveryH264ChunkSourceCommitment
}): OfflineRemotionDeliveryH264ChunkRequest {
  return validateOfflineRemotionDeliveryH264ChunkRequest({
    schemaVersion: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { source: input.source },
  })
}

export function validateOfflineRemotionDeliveryH264ChunkRequest(
  value: unknown,
): OfflineRemotionDeliveryH264ChunkRequest {
  const request = exactRecord(value, [
    'schemaVersion',
    'toolId',
    'operationId',
    'inputMode',
    'payload',
    'inputs',
  ], 'delivery H.264 chunk request')
  if (
    request.schemaVersion !==
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_REQUEST_PROTOCOL ||
    request.toolId !== 'remotion' ||
    request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    request.inputMode !== OFFLINE_REMOTION_DELIVERY_H264_CHUNK_INPUT_MODE
  ) throw invalid('Delivery H.264 chunk request identity is unsupported.')

  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(request.inputs, ['source'], 'delivery chunk inputs')
  const source = validateSourceCommitment(inputs.source)
  const normalized: OfflineRemotionDeliveryH264ChunkRequest = {
    schemaVersion: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_INPUT_MODE,
    payload,
    inputs: { source },
  }
  if (
    Buffer.byteLength(JSON.stringify(normalized), 'utf8') >
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_MANIFEST_BYTES
  ) throw invalid('Delivery H.264 chunk manifest exceeds its fixed ceiling.')
  return normalized
}

export function offlineRemotionDeliveryH264ChunkInputCommitments(
  request: OfflineRemotionDeliveryH264ChunkRequest,
): [OfflineRemotionDeliveryH264ChunkSourceCommitment] {
  return [validateOfflineRemotionDeliveryH264ChunkRequest(request).inputs.source]
}

export function offlineRemotionDeliveryH264ChunkRequestSha256(
  request: OfflineRemotionDeliveryH264ChunkRequest,
): string {
  return createHash('sha256')
    .update(JSON.stringify(validateOfflineRemotionDeliveryH264ChunkRequest(
      request,
    )))
    .digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineRemotionDeliveryH264ChunkPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId',
    'compositionProfileId',
    'longFormCapacityProfileId',
    'chunkId',
    'chunkAuthorityHash',
    'sourceVp9ObjectIdentity',
    'expectedOutputIdentity',
    'chunkIndex',
    'chunkCount',
    'width',
    'height',
    'fps',
    'durationFrames',
    'globalStartFrame',
    'globalEndFrameExclusive',
    'sourceVideoPolicy',
    'transcodePolicy',
    'outputContainer',
    'outputVideoCodec',
    'outputVideoProfile',
    'outputCrf',
    'outputPreset',
    'outputPixelFormat',
    'outputColorRange',
    'outputColorSpace',
    'outputColorTransfer',
    'outputColorPrimaries',
    'outputAudioPolicy',
    'renderPurpose',
    'deliveryProfileId',
    'estimateCostBasisProfileId',
    'sourceQualityPolicy',
    'usesApprovedEditReservation',
    'requiresSeparateExportEstimate',
    'allowsAdditionalExportCharge',
  ], 'delivery H.264 chunk planning payload')
  const chunkId = safeIdentity(payload.chunkId, 'chunkId')
  const chunkAuthorityHash = checksum(payload.chunkAuthorityHash,
    'chunkAuthorityHash')
  const sourceVp9ObjectIdentity = checksum(payload.sourceVp9ObjectIdentity,
    'sourceVp9ObjectIdentity')
  const expectedOutputIdentity = checksum(payload.expectedOutputIdentity,
    'expectedOutputIdentity')
  const chunkIndex = integer(payload.chunkIndex, 1, 124, 'chunkIndex')
  const chunkCount = integer(payload.chunkCount, 2, 124, 'chunkCount')
  const width = integer(payload.width, 2160, 3840, 'width')
  const height = integer(payload.height, 2160, 3840, 'height')
  const durationFrames = integer(payload.durationFrames, 1_350, 5_400,
    'durationFrames')
  const globalStartFrame = integer(payload.globalStartFrame, 0, 647_999,
    'globalStartFrame')
  const globalEndFrameExclusive = integer(
    payload.globalEndFrameExclusive,
    1,
    648_000,
    'globalEndFrameExclusive',
  )
  if (
    payload.recipeProfileId !==
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE ||
    payload.compositionProfileId !==
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_COMPOSITION_PROFILE ||
    payload.longFormCapacityProfileId !==
      PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID ||
    chunkIndex > chunkCount ||
    !APPROVED_FRAMES.has(`${width}x${height}`) ||
    payload.fps !== 30 ||
    globalEndFrameExclusive - globalStartFrame !== durationFrames ||
    payload.sourceVideoPolicy !== 'exact_passed_vp9_object_chunk_v2' ||
    payload.transcodePolicy !==
      'h264_high_crf18_medium_frame_preserving_v1' ||
    payload.outputContainer !== 'mp4' ||
    payload.outputVideoCodec !== 'h264' ||
    payload.outputVideoProfile !== 'high' ||
    payload.outputCrf !== 18 ||
    payload.outputPreset !== 'medium' ||
    payload.outputPixelFormat !== 'yuv420p' ||
    payload.outputColorRange !== 'tv' ||
    payload.outputColorSpace !== 'bt709' ||
    payload.outputColorTransfer !== 'bt709' ||
    payload.outputColorPrimaries !== 'bt709' ||
    payload.outputAudioPolicy !== 'video_only_no_audio' ||
    payload.renderPurpose !==
      'private_4k_customer_delivery_video_chunk_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !==
      'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Delivery H.264 chunk policy is unsupported.')
  return {
    recipeProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
    compositionProfileId:
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_COMPOSITION_PROFILE,
    longFormCapacityProfileId:
      PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
    chunkId,
    chunkAuthorityHash,
    sourceVp9ObjectIdentity,
    expectedOutputIdentity,
    chunkIndex,
    chunkCount,
    width: width as 2160 | 2880 | 3840,
    height: height as 2160 | 2700 | 3840,
    fps: 30,
    durationFrames,
    globalStartFrame,
    globalEndFrameExclusive,
    sourceVideoPolicy: 'exact_passed_vp9_object_chunk_v2',
    transcodePolicy: 'h264_high_crf18_medium_frame_preserving_v1',
    outputContainer: 'mp4',
    outputVideoCodec: 'h264',
    outputVideoProfile: 'high',
    outputCrf: 18,
    outputPreset: 'medium',
    outputPixelFormat: 'yuv420p',
    outputColorRange: 'tv',
    outputColorSpace: 'bt709',
    outputColorTransfer: 'bt709',
    outputColorPrimaries: 'bt709',
    outputAudioPolicy: 'video_only_no_audio',
    renderPurpose: 'private_4k_customer_delivery_video_chunk_v1',
    deliveryProfileId: 'uhd_2160',
    estimateCostBasisProfileId: 'uhd_2160',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

function validateSourceCommitment(
  value: unknown,
): OfflineRemotionDeliveryH264ChunkSourceCommitment {
  const source = exactRecord(value, [
    'inputId',
    'mimeType',
    'byteLength',
    'sha256',
  ], 'delivery H.264 chunk source commitment')
  const inputId = safeIdentity(source.inputId, 'source inputId')
  const byteLength = integer(
    source.byteLength,
    64,
    OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_SOURCE_BYTES,
    'source byteLength',
  )
  if (source.mimeType !== 'video/x-matroska') {
    throw invalid('Delivery H.264 chunk source must be one Matroska object.')
  }
  return {
    inputId,
    mimeType: 'video/x-matroska',
    byteLength,
    sha256: checksum(source.sha256, 'source sha256'),
  }
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} must be an object.`)
  }
  const result = value as Record<string, unknown>
  if (Object.keys(result).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return result
}

function safeIdentity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || !SAFE_IDENTITY.test(value) ||
    value !== value.trim() || value.includes('..')
  ) throw invalid(`Delivery H.264 chunk ${label} is invalid.`)
  return value
}

function checksum(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`Delivery H.264 chunk ${label} is invalid.`)
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
  ) throw invalid(`Delivery H.264 chunk ${label} is outside bounds.`)
  return Number(value)
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
