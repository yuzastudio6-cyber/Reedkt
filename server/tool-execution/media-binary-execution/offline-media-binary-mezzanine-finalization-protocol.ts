import { createHash } from 'node:crypto'

import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MINIMUM_FRAMES,
} from '../../../src/types/canonical-private-composition-capacity'
import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_PROTOCOL =
  'offline-media-binary-mezzanine-finalization-v2' as const
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAGIC =
  'REEDITPRO_FFMPEG_SOURCE_SLICE_FINALIZER_V2' as const
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_INPUT_MODE =
  'server_injected_private_multi_stream_v1' as const
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE =
  'approved_4k_source_slice_mezzanine_finalize_v1' as const
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_MANIFEST_BYTES =
  256 * 1024
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_SOURCE_BYTES =
  192 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES =
  256 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_COMBINED_CHUNK_BYTES =
  640 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES =
  256 * 1024 * 1024

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u
const FOUR_K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])

export interface OfflineMediaBinaryMezzanineChunkPlanningPayload {
  outputKey: string
  chunkIndex: number
  chunkCount: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  sourceSliceKey: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
}

export interface OfflineMediaBinaryMezzanineBoundaryContinuityPlanningPayload {
  boundaryFrame: number
  previousSourceEndFrameExclusive: number
  nextSourceStartFrame: number
  fromSourceSliceKey: string
  toSourceSliceKey: string
}

export interface OfflineMediaBinaryMezzanineFinalizationPlanningPayload {
  recipeProfileId: typeof OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE
  capacityProfileId: typeof CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 24 | 30
  durationFrames: number
  sourceSequenceItemId: string
  sourceCleanupDecisionId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  chunks: OfflineMediaBinaryMezzanineChunkPlanningPayload[]
  chunkBoundaryContinuity:
    OfflineMediaBinaryMezzanineBoundaryContinuityPlanningPayload[]
  videoFinalizationPolicy: 'compatible_h264_stream_copy_v1'
  audioFinalizationPolicy:
    | 'single_approved_source_audio_encode_v1'
    | 'single_approved_voice_delivery_audio_encode_v2'
  approvedVoiceOutputKey?: string
  codecCompatibilityPolicy: 'exact_h264_extradata_timebase_frame_color_v1'
  timestampPolicy: 'normalize_from_zero'
  outputContainer: 'mp4'
  outputVideoCodec: 'copy_h264'
  outputAudioCodec: 'aac_lc'
  audioSampleRate: 48_000
  audioChannels: 2
  audioBitrateKbps: 192
  renderPurpose: 'private_4k_delivery_master_v1'
  deliveryProfileId: 'uhd_2160'
  estimateCostBasisProfileId: 'uhd_2160'
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineMediaBinaryMezzanineChunkCommitment {
  inputId: string
  outputKey: string
  chunkIndex: number
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
}

export interface OfflineMediaBinaryMezzanineSourceCommitment {
  inputId: string
  sourceSequenceItemId: string
  mimeType: 'video/mp4' | 'audio/wav'
  byteLength: number
  sha256: string
  outputKey?: string
  durationFrames?: number
}

export interface OfflineMediaBinaryMezzanineFinalizationRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_INPUT_MODE
  payload: OfflineMediaBinaryMezzanineFinalizationPlanningPayload
  inputs: {
    chunks: OfflineMediaBinaryMezzanineChunkCommitment[]
    source: OfflineMediaBinaryMezzanineSourceCommitment
  }
}

export function validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
  value: unknown,
): OfflineMediaBinaryMezzanineFinalizationPlanningPayload {
  const hasApprovedVoiceOutputKey = Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'approvedVoiceOutputKey'),
  )
  const payload = exactRecord(value, [
    'recipeProfileId', 'capacityProfileId', 'width', 'height', 'fps',
    'durationFrames', 'sourceSequenceItemId', 'sourceCleanupDecisionId',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'chunks',
    'chunkBoundaryContinuity', 'videoFinalizationPolicy',
    'audioFinalizationPolicy', 'codecCompatibilityPolicy', 'timestampPolicy',
    'outputContainer', 'outputVideoCodec', 'outputAudioCodec',
    'audioSampleRate', 'audioChannels', 'audioBitrateKbps', 'renderPurpose',
    'deliveryProfileId', 'estimateCostBasisProfileId', 'sourceQualityPolicy',
    'usesApprovedEditReservation', 'requiresSeparateExportEstimate',
    'allowsAdditionalExportCharge',
    ...(hasApprovedVoiceOutputKey ? ['approvedVoiceOutputKey'] : []),
  ], 'mezzanine finalization planning payload')
  const width = integer(payload.width, 2160, 3840, 'width')
  const height = integer(payload.height, 2160, 3840, 'height')
  const fps = integer(payload.fps, 24, 30, 'fps')
  const durationFrames = integer(
    payload.durationFrames,
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MINIMUM_FRAMES,
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES,
    'durationFrames',
  )
  const sourceSequenceItemId = identity(
    payload.sourceSequenceItemId,
    'sourceSequenceItemId',
  )
  const sourceCleanupDecisionId = identity(
    payload.sourceCleanupDecisionId,
    'sourceCleanupDecisionId',
  )
  const sourceStartFrame = integer(
    payload.sourceStartFrame,
    0,
    Number.MAX_SAFE_INTEGER - 1,
    'sourceStartFrame',
  )
  const sourceEndFrameExclusive = integer(
    payload.sourceEndFrameExclusive,
    1,
    Number.MAX_SAFE_INTEGER,
    'sourceEndFrameExclusive',
  )
  const approvedVoiceOutputKey = hasApprovedVoiceOutputKey
    ? identity(payload.approvedVoiceOutputKey, 'approvedVoiceOutputKey')
    : undefined
  const approvedSourceAudio =
    payload.audioFinalizationPolicy ===
      'single_approved_source_audio_encode_v1'
  const approvedVoiceAudio =
    payload.audioFinalizationPolicy ===
      'single_approved_voice_delivery_audio_encode_v2'
  if (
    payload.recipeProfileId !== OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE ||
    payload.capacityProfileId !==
      CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID ||
    !FOUR_K_MASTER_FRAMES.has(`${width}x${height}`) ||
    ![24, 30].includes(fps) ||
    sourceEndFrameExclusive - sourceStartFrame !== durationFrames ||
    payload.videoFinalizationPolicy !== 'compatible_h264_stream_copy_v1' ||
    (!approvedSourceAudio && !approvedVoiceAudio) ||
    (approvedSourceAudio && approvedVoiceOutputKey !== undefined) ||
    (approvedVoiceAudio && approvedVoiceOutputKey === undefined) ||
    payload.codecCompatibilityPolicy !==
      'exact_h264_extradata_timebase_frame_color_v1' ||
    payload.timestampPolicy !== 'normalize_from_zero' ||
    payload.outputContainer !== 'mp4' ||
    payload.outputVideoCodec !== 'copy_h264' ||
    payload.outputAudioCodec !== 'aac_lc' ||
    payload.audioSampleRate !== 48_000 ||
    payload.audioChannels !== 2 ||
    payload.audioBitrateKbps !== 192 ||
    payload.renderPurpose !== 'private_4k_delivery_master_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Mezzanine finalization planning authority is unsupported.')

  const chunks = validateChunks(
    payload.chunks,
    durationFrames,
    sourceStartFrame,
    sourceEndFrameExclusive,
  )
  return {
    recipeProfileId: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_RECIPE,
    capacityProfileId:
      CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
    width: width as OfflineMediaBinaryMezzanineFinalizationPlanningPayload['width'],
    height: height as OfflineMediaBinaryMezzanineFinalizationPlanningPayload['height'],
    fps: fps as 24 | 30,
    durationFrames,
    sourceSequenceItemId,
    sourceCleanupDecisionId,
    sourceStartFrame,
    sourceEndFrameExclusive,
    chunks,
    chunkBoundaryContinuity: validateContinuity(
      payload.chunkBoundaryContinuity,
      chunks,
    ),
    videoFinalizationPolicy: 'compatible_h264_stream_copy_v1',
    audioFinalizationPolicy: approvedVoiceAudio
      ? 'single_approved_voice_delivery_audio_encode_v2'
      : 'single_approved_source_audio_encode_v1',
    ...(approvedVoiceOutputKey ? { approvedVoiceOutputKey } : {}),
    codecCompatibilityPolicy: 'exact_h264_extradata_timebase_frame_color_v1',
    timestampPolicy: 'normalize_from_zero',
    outputContainer: 'mp4',
    outputVideoCodec: 'copy_h264',
    outputAudioCodec: 'aac_lc',
    audioSampleRate: 48_000,
    audioChannels: 2,
    audioBitrateKbps: 192,
    renderPurpose: 'private_4k_delivery_master_v1',
    deliveryProfileId: 'uhd_2160',
    estimateCostBasisProfileId: 'uhd_2160',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

export function buildOfflineMediaBinaryMezzanineFinalizationRequest(input: {
  planningPayload: unknown
  chunks: OfflineMediaBinaryMezzanineChunkCommitment[]
  source: OfflineMediaBinaryMezzanineSourceCommitment
}): OfflineMediaBinaryMezzanineFinalizationRequest {
  return validateOfflineMediaBinaryMezzanineFinalizationRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { chunks: input.chunks, source: input.source },
  })
}

export function validateOfflineMediaBinaryMezzanineFinalizationRequest(
  value: unknown,
): OfflineMediaBinaryMezzanineFinalizationRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'mezzanine finalization request')
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !== OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_INPUT_MODE
  ) throw invalid('Mezzanine finalization request identity is unsupported.')
  const payload = validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
    request.payload,
  )
  const inputs = exactRecord(request.inputs, ['chunks', 'source'], 'finalization inputs')
  if (!Array.isArray(inputs.chunks) || inputs.chunks.length !== payload.chunks.length) {
    throw invalid('Mezzanine chunk commitments are incomplete.')
  }
  const inputIds = new Set<string>()
  let combinedChunkBytes = 0
  const chunks = inputs.chunks.map((candidate, index) => {
    const commitment = exactRecord(candidate, [
      'inputId', 'outputKey', 'chunkIndex', 'mimeType', 'byteLength', 'sha256',
    ], `mezzanine chunk commitment ${index + 1}`)
    const planned = payload.chunks[index]!
    const normalized: OfflineMediaBinaryMezzanineChunkCommitment = {
      inputId: identity(commitment.inputId, 'chunk inputId'),
      outputKey: identity(commitment.outputKey, 'chunk outputKey'),
      chunkIndex: integer(commitment.chunkIndex, 1, payload.chunks.length, 'chunkIndex'),
      mimeType: commitment.mimeType as 'video/mp4',
      byteLength: integer(
        commitment.byteLength,
        1_024,
        OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES,
        'chunk byteLength',
      ),
      sha256: hash(commitment.sha256, 'chunk sha256'),
    }
    if (
      normalized.mimeType !== 'video/mp4' ||
      normalized.outputKey !== planned.outputKey ||
      normalized.chunkIndex !== planned.chunkIndex ||
      inputIds.has(normalized.inputId)
    ) throw invalid('Mezzanine chunk commitment diverges from its approved chunk.')
    inputIds.add(normalized.inputId)
    combinedChunkBytes += normalized.byteLength
    return normalized
  })
  if (
    !Number.isSafeInteger(combinedChunkBytes) ||
    combinedChunkBytes >
      OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_COMBINED_CHUNK_BYTES
  ) throw invalid('Mezzanine chunks exceed their combined private-input ceiling.')
  const voiceAudio =
    payload.audioFinalizationPolicy ===
      'single_approved_voice_delivery_audio_encode_v2'
  const sourceValue = exactRecord(inputs.source, [
    'inputId', 'sourceSequenceItemId', 'mimeType', 'byteLength', 'sha256',
    ...(voiceAudio ? ['outputKey', 'durationFrames'] : []),
  ], 'mezzanine source commitment')
  const source: OfflineMediaBinaryMezzanineSourceCommitment = {
    inputId: identity(sourceValue.inputId, 'source inputId'),
    sourceSequenceItemId: identity(
      sourceValue.sourceSequenceItemId,
      'source commitment sourceSequenceItemId',
    ),
    mimeType: sourceValue.mimeType as 'video/mp4' | 'audio/wav',
    byteLength: integer(
      sourceValue.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_SOURCE_BYTES,
      'source byteLength',
    ),
    sha256: hash(sourceValue.sha256, 'source sha256'),
    ...(voiceAudio
      ? {
          outputKey: identity(sourceValue.outputKey, 'voice outputKey'),
          durationFrames: integer(
            sourceValue.durationFrames,
            payload.durationFrames,
            payload.durationFrames,
            'voice durationFrames',
          ),
        }
      : {}),
  }
  if (
    (voiceAudio
      ? (
          source.mimeType !== 'audio/wav' ||
          source.outputKey !== payload.approvedVoiceOutputKey ||
          source.durationFrames !== payload.durationFrames
        )
      : source.mimeType !== 'video/mp4') ||
    source.sourceSequenceItemId !== payload.sourceSequenceItemId ||
    inputIds.has(source.inputId)
  ) throw invalid('Mezzanine source commitment diverges from approved source authority.')
  const normalized: OfflineMediaBinaryMezzanineFinalizationRequest = {
    schemaVersion: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_INPUT_MODE,
    payload,
    inputs: { chunks, source },
  }
  if (
    Buffer.byteLength(JSON.stringify(normalized)) >
    OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_MANIFEST_BYTES
  ) throw invalid('Mezzanine finalization manifest exceeds its fixed metadata ceiling.')
  return normalized
}

export function offlineMediaBinaryMezzanineFinalizationRequestSha256(
  request: OfflineMediaBinaryMezzanineFinalizationRequest,
): string {
  const normalized = validateOfflineMediaBinaryMezzanineFinalizationRequest(request)
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

function validateChunks(
  value: unknown,
  totalFrames: number,
  approvedSourceStartFrame: number,
  approvedSourceEndFrameExclusive: number,
): OfflineMediaBinaryMezzanineChunkPlanningPayload[] {
  if (
    !Array.isArray(value) || value.length < 2 ||
    value.length > CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS
  ) throw invalid('Mezzanine finalization requires two through sixteen chunks.')
  const outputKeys = new Set<string>()
  let expectedGlobalStart = 0
  let expectedSourceStart = approvedSourceStartFrame
  const chunks = value.map((candidate, index) => {
    const chunk = exactRecord(candidate, [
      'outputKey', 'chunkIndex', 'chunkCount', 'globalStartFrame',
      'globalEndFrameExclusive', 'durationFrames', 'sourceSliceKey',
      'sourceStartFrame', 'sourceEndFrameExclusive',
    ], `mezzanine chunk ${index + 1}`)
    const normalized: OfflineMediaBinaryMezzanineChunkPlanningPayload = {
      outputKey: identity(chunk.outputKey, 'chunk outputKey'),
      chunkIndex: integer(chunk.chunkIndex, 1, value.length, 'chunkIndex'),
      chunkCount: integer(chunk.chunkCount, value.length, value.length, 'chunkCount'),
      globalStartFrame: integer(
        chunk.globalStartFrame,
        0,
        totalFrames - 1,
        'globalStartFrame',
      ),
      globalEndFrameExclusive: integer(
        chunk.globalEndFrameExclusive,
        1,
        totalFrames,
        'globalEndFrameExclusive',
      ),
      durationFrames: integer(
        chunk.durationFrames,
        CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
        CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
        'durationFrames',
      ),
      sourceSliceKey: identity(chunk.sourceSliceKey, 'sourceSliceKey'),
      sourceStartFrame: integer(
        chunk.sourceStartFrame,
        approvedSourceStartFrame,
        approvedSourceEndFrameExclusive - 1,
        'chunk sourceStartFrame',
      ),
      sourceEndFrameExclusive: integer(
        chunk.sourceEndFrameExclusive,
        approvedSourceStartFrame + 1,
        approvedSourceEndFrameExclusive,
        'chunk sourceEndFrameExclusive',
      ),
    }
    if (
      normalized.chunkIndex !== index + 1 ||
      normalized.globalStartFrame !== expectedGlobalStart ||
      normalized.sourceStartFrame !== expectedSourceStart ||
      normalized.globalEndFrameExclusive - normalized.globalStartFrame !==
        normalized.durationFrames ||
      normalized.sourceEndFrameExclusive - normalized.sourceStartFrame !==
        normalized.durationFrames ||
      normalized.sourceSliceKey !==
        `source-slice-${index + 1}-of-${value.length}` ||
      outputKeys.has(normalized.outputKey)
    ) throw invalid('Mezzanine chunks are not exact, ordered, and duration preserving.')
    outputKeys.add(normalized.outputKey)
    expectedGlobalStart = normalized.globalEndFrameExclusive
    expectedSourceStart = normalized.sourceEndFrameExclusive
    return normalized
  })
  if (
    expectedGlobalStart !== totalFrames ||
    expectedSourceStart !== approvedSourceEndFrameExclusive
  ) throw invalid('Mezzanine chunks do not conserve the complete approved range.')
  return chunks
}

function validateContinuity(
  value: unknown,
  chunks: OfflineMediaBinaryMezzanineChunkPlanningPayload[],
): OfflineMediaBinaryMezzanineBoundaryContinuityPlanningPayload[] {
  if (!Array.isArray(value) || value.length !== chunks.length - 1) {
    throw invalid('Mezzanine finalization requires one continuity record per boundary.')
  }
  return value.map((candidate, index) => {
    const continuity = exactRecord(candidate, [
      'boundaryFrame', 'previousSourceEndFrameExclusive',
      'nextSourceStartFrame', 'fromSourceSliceKey', 'toSourceSliceKey',
    ], `mezzanine continuity ${index + 1}`)
    const from = chunks[index]!
    const to = chunks[index + 1]!
    const normalized: OfflineMediaBinaryMezzanineBoundaryContinuityPlanningPayload = {
      boundaryFrame: integer(
        continuity.boundaryFrame,
        1,
        chunks.at(-1)!.globalEndFrameExclusive - 1,
        'boundaryFrame',
      ),
      previousSourceEndFrameExclusive: integer(
        continuity.previousSourceEndFrameExclusive,
        1,
        Number.MAX_SAFE_INTEGER,
        'previousSourceEndFrameExclusive',
      ),
      nextSourceStartFrame: integer(
        continuity.nextSourceStartFrame,
        0,
        Number.MAX_SAFE_INTEGER - 1,
        'nextSourceStartFrame',
      ),
      fromSourceSliceKey: identity(
        continuity.fromSourceSliceKey,
        'fromSourceSliceKey',
      ),
      toSourceSliceKey: identity(continuity.toSourceSliceKey, 'toSourceSliceKey'),
    }
    if (
      normalized.boundaryFrame !== from.globalEndFrameExclusive ||
      normalized.boundaryFrame !== to.globalStartFrame ||
      normalized.previousSourceEndFrameExclusive !== from.sourceEndFrameExclusive ||
      normalized.nextSourceStartFrame !== to.sourceStartFrame ||
      normalized.previousSourceEndFrameExclusive !== normalized.nextSourceStartFrame ||
      normalized.fromSourceSliceKey !== from.sourceSliceKey ||
      normalized.toSourceSliceKey !== to.sourceSliceKey
    ) throw invalid('Mezzanine continuity diverges from exact chunk authority.')
    return normalized
  })
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

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string' || !IDENTITY.test(value)) {
    throw invalid(`${label} is invalid.`)
  }
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
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw invalid(`${label} is outside its fixed bound.`)
  }
  return Number(value)
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
