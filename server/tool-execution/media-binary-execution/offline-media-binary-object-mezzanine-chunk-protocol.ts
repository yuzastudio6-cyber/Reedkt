import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_PROTOCOL =
  'offline-media-binary-object-mezzanine-chunk-v1' as const
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAGIC =
  'REEDITPRO_FFMPEG_OBJECT_MEZZANINE_CHUNK_V1' as const
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_INPUT_MODE =
  'server_injected_private_multi_source_stream_v1' as const
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE =
  'approved_4k_object_mezzanine_chunk_stream_copy_v1' as const
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SOURCE_COUNT = 8
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SLICE_COUNT = 16
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SOURCE_BYTES =
  192 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_COMBINED_SOURCE_BYTES =
  768 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES =
  192 * 1024 * 1024

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const FOUR_K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])

export interface OfflineMediaBinaryObjectMezzanineChunkSourceSlice {
  sliceIndex: number
  segmentId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceObjectGeneration: string
  sourceSha256: string
  sourceCleanupDecisionId: string
  sourceStartFrame: 0
  sourceEndFrameExclusive: number
  globalTimelineStartFrame: number
  globalTimelineEndFrameExclusive: number
  chunkLocalStartFrame: number
  chunkLocalEndFrameExclusive: number
  boundaryBefore: 'timeline_start' | 'approved_hard_cut'
}

export interface OfflineMediaBinaryObjectMezzanineChunkPlanningPayload {
  recipeProfileId: typeof OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE
  chunkId: string
  chunkAuthorityHash: string
  expectedObjectIdentity: string
  chunkIndex: 1
  chunkCount: number
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 30
  durationFrames: number
  globalStartFrame: 0
  globalEndFrameExclusive: number
  sourceSlices: OfflineMediaBinaryObjectMezzanineChunkSourceSlice[]
  videoAssemblyPolicy: 'compatible_h264_mp4_slice_concat_stream_copy_v1'
  audioPolicy: 'separate_continuous_program_audio_v1'
  codecCompatibilityPolicy: 'exact_h264_extradata_frame_color_v1'
  timestampPolicy: 'normalize_from_zero'
  outputContainer: 'matroska'
  outputVideoCodec: 'copy_h264'
  outputPixelFormat: 'yuv420p'
  outputColorSpace: 'bt709'
  renderPurpose: 'private_4k_object_mezzanine_chunk_v1'
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineMediaBinaryObjectMezzanineChunkSourceCommitment {
  inputId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceObjectGeneration: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
}

export interface OfflineMediaBinaryObjectMezzanineChunkRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_INPUT_MODE
  payload: OfflineMediaBinaryObjectMezzanineChunkPlanningPayload
  inputs: {
    sources: OfflineMediaBinaryObjectMezzanineChunkSourceCommitment[]
  }
}

export function buildOfflineMediaBinaryObjectMezzanineChunkRequest(input: {
  planningPayload: unknown
  sources: OfflineMediaBinaryObjectMezzanineChunkSourceCommitment[]
}): OfflineMediaBinaryObjectMezzanineChunkRequest {
  return validateOfflineMediaBinaryObjectMezzanineChunkRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { sources: input.sources },
  })
}

export function validateOfflineMediaBinaryObjectMezzanineChunkRequest(
  value: unknown,
): OfflineMediaBinaryObjectMezzanineChunkRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'object-mezzanine chunk request')
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !== OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_INPUT_MODE
  ) throw invalid('Object-mezzanine chunk request authority is unsupported.')
  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(request.inputs, ['sources'], 'object-mezzanine inputs')
  if (!Array.isArray(inputs.sources)) {
    throw invalid('Object-mezzanine source commitments are invalid.')
  }
  const sources = inputs.sources.map((source, index) =>
    validateSourceCommitment(source, index))
  if (
    sources.length < 2 ||
    sources.length > OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SOURCE_COUNT ||
    new Set(sources.map((source) => source.inputId)).size !== sources.length ||
    new Set(sources.map((source) => source.sourceSequenceItemId)).size !== sources.length
  ) throw invalid('Object-mezzanine source commitment cardinality is invalid.')
  const combinedBytes = sources.reduce((total, source) => total + source.byteLength, 0)
  if (
    !Number.isSafeInteger(combinedBytes) ||
    combinedBytes >
      OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_COMBINED_SOURCE_BYTES
  ) throw invalid('Object-mezzanine source commitments exceed the combined bound.')
  const sourceBySequenceId = new Map(sources.map((source) => [
    source.sourceSequenceItemId,
    source,
  ]))
  for (const slice of payload.sourceSlices) {
    const source = sourceBySequenceId.get(slice.sourceSequenceItemId)
    if (
      !source ||
      source.mediaAssetId !== slice.mediaAssetId ||
      source.sourceObjectGeneration !== slice.sourceObjectGeneration ||
      source.sha256 !== slice.sourceSha256
    ) throw invalid('Object-mezzanine slice lost exact immutable source commitment.')
  }
  const usedSourceIds = new Set(payload.sourceSlices.map((slice) =>
    slice.sourceSequenceItemId))
  if (sources.some((source) => !usedSourceIds.has(source.sourceSequenceItemId))) {
    throw invalid('Object-mezzanine request contains an unreferenced source commitment.')
  }
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_INPUT_MODE,
    payload,
    inputs: { sources },
  }
}

export function offlineMediaBinaryObjectMezzanineChunkRequestSha256(
  request: OfflineMediaBinaryObjectMezzanineChunkRequest,
): string {
  const validated = validateOfflineMediaBinaryObjectMezzanineChunkRequest(request)
  return createHash('sha256').update(stableStringify(validated)).digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineMediaBinaryObjectMezzanineChunkPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId', 'chunkId', 'chunkAuthorityHash',
    'expectedObjectIdentity', 'chunkIndex', 'chunkCount', 'width', 'height',
    'fps', 'durationFrames', 'globalStartFrame', 'globalEndFrameExclusive',
    'sourceSlices', 'videoAssemblyPolicy', 'audioPolicy',
    'codecCompatibilityPolicy', 'timestampPolicy', 'outputContainer',
    'outputVideoCodec', 'outputPixelFormat', 'outputColorSpace',
    'renderPurpose', 'sourceQualityPolicy', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  ], 'object-mezzanine planning payload')
  const chunkId = identity(payload.chunkId, 'chunkId')
  const chunkAuthorityHash = sha256(payload.chunkAuthorityHash, 'chunkAuthorityHash')
  const expectedObjectIdentity = sha256(
    payload.expectedObjectIdentity,
    'expectedObjectIdentity',
  )
  const chunkCount = integer(payload.chunkCount, 1, 124, 'chunkCount')
  const width = integer(payload.width, 2160, 3840, 'width')
  const height = integer(payload.height, 2160, 3840, 'height')
  const durationFrames = integer(payload.durationFrames, 1_350, 5_400, 'durationFrames')
  const globalEndFrameExclusive = integer(
    payload.globalEndFrameExclusive,
    1_350,
    5_400,
    'globalEndFrameExclusive',
  )
  if (
    payload.recipeProfileId !==
      OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE ||
    payload.chunkIndex !== 1 ||
    !FOUR_K_MASTER_FRAMES.has(`${width}x${height}`) ||
    payload.fps !== 30 ||
    payload.globalStartFrame !== 0 ||
    globalEndFrameExclusive !== durationFrames ||
    payload.videoAssemblyPolicy !==
      'compatible_h264_mp4_slice_concat_stream_copy_v1' ||
    payload.audioPolicy !== 'separate_continuous_program_audio_v1' ||
    payload.codecCompatibilityPolicy !== 'exact_h264_extradata_frame_color_v1' ||
    payload.timestampPolicy !== 'normalize_from_zero' ||
    payload.outputContainer !== 'matroska' ||
    payload.outputVideoCodec !== 'copy_h264' ||
    payload.outputPixelFormat !== 'yuv420p' ||
    payload.outputColorSpace !== 'bt709' ||
    payload.renderPurpose !== 'private_4k_object_mezzanine_chunk_v1' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Object-mezzanine planning authority is unsupported.')
  if (!Array.isArray(payload.sourceSlices)) {
    throw invalid('Object-mezzanine source slices are invalid.')
  }
  const sourceSlices = payload.sourceSlices.map((slice, index) =>
    validateSourceSlice(slice, index, durationFrames))
  if (
    sourceSlices.length < 2 ||
    sourceSlices.length > OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SLICE_COUNT
  ) throw invalid('Object-mezzanine slice cardinality is invalid.')
  let expectedLocalStart = 0
  let expectedGlobalStart = 0
  sourceSlices.forEach((slice, index) => {
    const expectedBoundary = index === 0 ? 'timeline_start' : 'approved_hard_cut'
    if (
      slice.sliceIndex !== index + 1 ||
      slice.chunkLocalStartFrame !== expectedLocalStart ||
      slice.globalTimelineStartFrame !== expectedGlobalStart ||
      slice.boundaryBefore !== expectedBoundary
    ) throw invalid('Object-mezzanine slices are not exact, ordered hard cuts.')
    expectedLocalStart = slice.chunkLocalEndFrameExclusive
    expectedGlobalStart = slice.globalTimelineEndFrameExclusive
  })
  if (expectedLocalStart !== durationFrames || expectedGlobalStart !== durationFrames) {
    throw invalid('Object-mezzanine slices do not cover the complete chunk.')
  }
  return {
    recipeProfileId: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE,
    chunkId,
    chunkAuthorityHash,
    expectedObjectIdentity,
    chunkIndex: 1,
    chunkCount,
    width: width as OfflineMediaBinaryObjectMezzanineChunkPlanningPayload['width'],
    height: height as OfflineMediaBinaryObjectMezzanineChunkPlanningPayload['height'],
    fps: 30,
    durationFrames,
    globalStartFrame: 0,
    globalEndFrameExclusive,
    sourceSlices,
    videoAssemblyPolicy: 'compatible_h264_mp4_slice_concat_stream_copy_v1',
    audioPolicy: 'separate_continuous_program_audio_v1',
    codecCompatibilityPolicy: 'exact_h264_extradata_frame_color_v1',
    timestampPolicy: 'normalize_from_zero',
    outputContainer: 'matroska',
    outputVideoCodec: 'copy_h264',
    outputPixelFormat: 'yuv420p',
    outputColorSpace: 'bt709',
    renderPurpose: 'private_4k_object_mezzanine_chunk_v1',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

function validateSourceSlice(
  value: unknown,
  index: number,
  durationFrames: number,
): OfflineMediaBinaryObjectMezzanineChunkSourceSlice {
  const slice = exactRecord(value, [
    'sliceIndex', 'segmentId', 'sourceSequenceItemId', 'mediaAssetId',
    'sourceObjectGeneration', 'sourceSha256', 'sourceCleanupDecisionId',
    'sourceStartFrame', 'sourceEndFrameExclusive',
    'globalTimelineStartFrame', 'globalTimelineEndFrameExclusive',
    'chunkLocalStartFrame', 'chunkLocalEndFrameExclusive', 'boundaryBefore',
  ], `object-mezzanine source slice ${index + 1}`)
  const sourceEndFrameExclusive = integer(
    slice.sourceEndFrameExclusive,
    1,
    durationFrames,
    'sourceEndFrameExclusive',
  )
  const globalTimelineStartFrame = integer(
    slice.globalTimelineStartFrame,
    0,
    durationFrames - 1,
    'globalTimelineStartFrame',
  )
  const globalTimelineEndFrameExclusive = integer(
    slice.globalTimelineEndFrameExclusive,
    1,
    durationFrames,
    'globalTimelineEndFrameExclusive',
  )
  const chunkLocalStartFrame = integer(
    slice.chunkLocalStartFrame,
    0,
    durationFrames - 1,
    'chunkLocalStartFrame',
  )
  const chunkLocalEndFrameExclusive = integer(
    slice.chunkLocalEndFrameExclusive,
    1,
    durationFrames,
    'chunkLocalEndFrameExclusive',
  )
  if (
    slice.sourceStartFrame !== 0 ||
    sourceEndFrameExclusive !==
      globalTimelineEndFrameExclusive - globalTimelineStartFrame ||
    sourceEndFrameExclusive !==
      chunkLocalEndFrameExclusive - chunkLocalStartFrame ||
    !['timeline_start', 'approved_hard_cut'].includes(String(slice.boundaryBefore))
  ) throw invalid('Object-mezzanine slice timing is unsupported.')
  return {
    sliceIndex: integer(slice.sliceIndex, 1,
      OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SLICE_COUNT,
      'sliceIndex'),
    segmentId: identity(slice.segmentId, 'segmentId'),
    sourceSequenceItemId: identity(slice.sourceSequenceItemId, 'sourceSequenceItemId'),
    mediaAssetId: identity(slice.mediaAssetId, 'mediaAssetId'),
    sourceObjectGeneration: generation(slice.sourceObjectGeneration),
    sourceSha256: sha256(slice.sourceSha256, 'sourceSha256'),
    sourceCleanupDecisionId: identity(
      slice.sourceCleanupDecisionId,
      'sourceCleanupDecisionId',
    ),
    sourceStartFrame: 0,
    sourceEndFrameExclusive,
    globalTimelineStartFrame,
    globalTimelineEndFrameExclusive,
    chunkLocalStartFrame,
    chunkLocalEndFrameExclusive,
    boundaryBefore: slice.boundaryBefore as
      OfflineMediaBinaryObjectMezzanineChunkSourceSlice['boundaryBefore'],
  }
}

function validateSourceCommitment(
  value: unknown,
  index: number,
): OfflineMediaBinaryObjectMezzanineChunkSourceCommitment {
  const source = exactRecord(value, [
    'inputId', 'sourceSequenceItemId', 'mediaAssetId',
    'sourceObjectGeneration', 'mimeType', 'byteLength', 'sha256',
  ], `object-mezzanine source commitment ${index + 1}`)
  if (source.mimeType !== 'video/mp4') {
    throw invalid('Object-mezzanine sources must be immutable MP4 masters.')
  }
  return {
    inputId: identity(source.inputId, 'inputId'),
    sourceSequenceItemId: identity(source.sourceSequenceItemId, 'sourceSequenceItemId'),
    mediaAssetId: identity(source.mediaAssetId, 'mediaAssetId'),
    sourceObjectGeneration: generation(source.sourceObjectGeneration),
    mimeType: 'video/mp4',
    byteLength: integer(
      source.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_SOURCE_BYTES,
      'byteLength',
    ),
    sha256: sha256(source.sha256, 'sha256'),
  }
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} is malformed.`)
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return record
}

function identity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    !IDENTITY.test(value) ||
    value.includes('..')
  ) throw invalid(`Object-mezzanine ${label} is invalid.`)
  return value
}

function generation(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,30}$/u.test(value)) {
    throw invalid('Object-mezzanine source generation is invalid.')
  }
  return value
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`Object-mezzanine ${label} is invalid.`)
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
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  ) throw invalid(`Object-mezzanine ${label} is outside its fixed bound.`)
  return Number(value)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'offline_media_binary_object_mezzanine_chunk_contract',
  })
}
