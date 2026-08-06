import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'
import {
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
} from './offline-media-binary-object-mezzanine-chunk-protocol'
import {
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
} from './offline-media-binary-continuous-program-audio-protocol'

export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_PROTOCOL =
  'offline-media-binary-long-form-master-assembly-v1' as const
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_MAGIC =
  'REEDITPRO_FFMPEG_LONG_FORM_MASTER_ASSEMBLY_V1' as const
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_INPUT_MODE =
  'server_injected_private_object_chunks_and_program_audio_v1' as const
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE =
  'approved_long_form_vp9_flac_matroska_master_v1' as const
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MINIMUM_CHUNKS = 2
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS = 124
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNK_BYTES =
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_AUDIO_BYTES =
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_COMBINED_CHUNK_BYTES =
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS *
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNK_BYTES
export const OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES =
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_COMBINED_CHUNK_BYTES +
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_AUDIO_BYTES

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const FOUR_K_FRAMES = new Set([
  '3840x2160', '2160x3840', '2160x2160', '2160x2700', '2880x2160',
])

export interface OfflineLongFormMasterChunkPlan {
  chunkId: string
  chunkIndex: number
  chunkCount: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  objectIdentity: string
  boundaryBefore:
    | 'timeline_start'
    | 'approved_hard_cut'
    | 'continuous_technical_split'
}

export interface OfflineLongFormMasterAssemblyPlanningPayload {
  recipeProfileId: typeof OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE
  assemblyAuthorityHash: string
  expectedObjectIdentity: string
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 30
  totalFrames: number
  chunks: OfflineLongFormMasterChunkPlan[]
  crossChunkColorValidationHash: string
  continuousProgramAudioQaHash: string
  videoAssemblyPolicy: 'ordered_vp9_object_chunk_stream_copy_v1'
  audioAssemblyPolicy: 'continuous_flac_program_audio_stream_copy_v1'
  timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1'
  compatibilityPolicy: 'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1'
  outputContainer: 'matroska'
  outputVideoCodec: 'copy_vp9'
  outputAudioCodec: 'copy_flac'
  renderPurpose: 'private_4k_long_form_review_master_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  mediaReencodingAllowed: false
}

export interface OfflineLongFormMasterChunkCommitment {
  inputId: string
  chunkId: string
  chunkIndex: number
  objectIdentity: string
  mimeType: 'video/x-matroska'
  byteLength: number
  sha256: string
}

export interface OfflineLongFormMasterAudioCommitment {
  inputId: string
  objectIdentity: string
  mimeType: 'audio/flac'
  byteLength: number
  sha256: string
}

export interface OfflineMediaBinaryLongFormMasterAssemblyRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_INPUT_MODE
  payload: OfflineLongFormMasterAssemblyPlanningPayload
  inputs: {
    chunks: OfflineLongFormMasterChunkCommitment[]
    programAudio: OfflineLongFormMasterAudioCommitment
  }
}

export function buildOfflineMediaBinaryLongFormMasterAssemblyRequest(input: {
  planningPayload: unknown
  chunks: OfflineLongFormMasterChunkCommitment[]
  programAudio: OfflineLongFormMasterAudioCommitment
}): OfflineMediaBinaryLongFormMasterAssemblyRequest {
  return validateOfflineMediaBinaryLongFormMasterAssemblyRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { chunks: input.chunks, programAudio: input.programAudio },
  })
}

export function validateOfflineMediaBinaryLongFormMasterAssemblyRequest(
  value: unknown,
): OfflineMediaBinaryLongFormMasterAssemblyRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'long-form master request')
  if (
    request.schemaVersion !==
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !==
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_INPUT_MODE
  ) throw invalid('Long-form master request identity is unsupported.')
  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(
    request.inputs,
    ['chunks', 'programAudio'],
    'long-form master inputs',
  )
  if (!Array.isArray(inputs.chunks) || inputs.chunks.length !== payload.chunks.length) {
    throw invalid('Long-form master chunk commitments are incomplete.')
  }
  let combinedBytes = 0
  const inputIds = new Set<string>()
  const chunks = inputs.chunks.map((value, index) => {
    const record = exactRecord(value, [
      'inputId', 'chunkId', 'chunkIndex', 'objectIdentity', 'mimeType',
      'byteLength', 'sha256',
    ], `long-form master chunk ${index + 1}`)
    const planned = payload.chunks[index]!
    const normalized: OfflineLongFormMasterChunkCommitment = {
      inputId: identity(record.inputId, 'chunk inputId'),
      chunkId: identity(record.chunkId, 'chunkId'),
      chunkIndex: integer(record.chunkIndex, 1,
        OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS, 'chunkIndex'),
      objectIdentity: identity(record.objectIdentity, 'chunk objectIdentity'),
      mimeType: record.mimeType as 'video/x-matroska',
      byteLength: integer(record.byteLength, 1_024,
        OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNK_BYTES,
        'chunk byteLength'),
      sha256: hash(record.sha256, 'chunk sha256'),
    }
    if (
      normalized.mimeType !== 'video/x-matroska' ||
      normalized.chunkId !== planned.chunkId ||
      normalized.chunkIndex !== planned.chunkIndex ||
      normalized.objectIdentity !== planned.objectIdentity ||
      inputIds.has(normalized.inputId)
    ) throw invalid('Long-form master chunk diverged from approved order.')
    inputIds.add(normalized.inputId)
    combinedBytes += normalized.byteLength
    return normalized
  })
  if (
    !Number.isSafeInteger(combinedBytes) ||
    combinedBytes >
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_COMBINED_CHUNK_BYTES
  ) throw invalid('Long-form master chunks exceed the bounded object ceiling.')
  const audioValue = exactRecord(inputs.programAudio, [
    'inputId', 'objectIdentity', 'mimeType', 'byteLength', 'sha256',
  ], 'long-form master program audio')
  const programAudio: OfflineLongFormMasterAudioCommitment = {
    inputId: identity(audioValue.inputId, 'audio inputId'),
    objectIdentity: identity(audioValue.objectIdentity, 'audio objectIdentity'),
    mimeType: audioValue.mimeType as 'audio/flac',
    byteLength: integer(audioValue.byteLength, 1_024,
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_AUDIO_BYTES,
      'audio byteLength'),
    sha256: hash(audioValue.sha256, 'audio sha256'),
  }
  if (programAudio.mimeType !== 'audio/flac' || inputIds.has(programAudio.inputId)) {
    throw invalid('Long-form master program audio commitment is invalid.')
  }
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_INPUT_MODE,
    payload,
    inputs: { chunks, programAudio },
  }
}

export function offlineMediaBinaryLongFormMasterAssemblyRequestSha256(
  request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
): string {
  return createHash('sha256')
    .update(JSON.stringify(validateOfflineMediaBinaryLongFormMasterAssemblyRequest(request)))
    .digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineLongFormMasterAssemblyPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId', 'assemblyAuthorityHash', 'expectedObjectIdentity',
    'width', 'height', 'fps', 'totalFrames', 'chunks',
    'crossChunkColorValidationHash', 'continuousProgramAudioQaHash',
    'videoAssemblyPolicy', 'audioAssemblyPolicy', 'timestampPolicy',
    'compatibilityPolicy', 'outputContainer', 'outputVideoCodec',
    'outputAudioCodec', 'renderPurpose', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
    'mediaReencodingAllowed',
  ], 'long-form master planning payload')
  const width = integer(payload.width, 2_160, 3_840, 'width')
  const height = integer(payload.height, 2_160, 3_840, 'height')
  const totalFrames = integer(payload.totalFrames, 1_350, 648_000, 'totalFrames')
  if (!Array.isArray(payload.chunks)) throw invalid('Master chunks are invalid.')
  const chunkCount = payload.chunks.length
  if (
    chunkCount < OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MINIMUM_CHUNKS ||
    chunkCount > OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS
  ) throw invalid('Master chunk count is outside the bounded profile.')
  let expectedStart = 0
  const chunks = payload.chunks.map((value, index) => {
    const record = exactRecord(value, [
      'chunkId', 'chunkIndex', 'chunkCount', 'globalStartFrame',
      'globalEndFrameExclusive', 'durationFrames', 'objectIdentity',
      'boundaryBefore',
    ], `master chunk plan ${index + 1}`)
    const start = integer(record.globalStartFrame, 0, 647_999, 'chunk start')
    const end = integer(record.globalEndFrameExclusive, 1, 648_000, 'chunk end')
    const duration = integer(record.durationFrames, 1_350, 5_400, 'chunk duration')
    const boundary = record.boundaryBefore
    if (
      start !== expectedStart || end - start !== duration ||
      record.chunkIndex !== index + 1 || record.chunkCount !== chunkCount ||
      (index === 0 ? boundary !== 'timeline_start' :
        !['approved_hard_cut', 'continuous_technical_split'].includes(String(boundary)))
    ) throw invalid('Master chunk plan lost contiguous timeline authority.')
    expectedStart = end
    return {
      chunkId: identity(record.chunkId, 'chunkId'),
      chunkIndex: index + 1,
      chunkCount,
      globalStartFrame: start,
      globalEndFrameExclusive: end,
      durationFrames: duration,
      objectIdentity: identity(record.objectIdentity, 'objectIdentity'),
      boundaryBefore: boundary as OfflineLongFormMasterChunkPlan['boundaryBefore'],
    }
  })
  if (
    expectedStart !== totalFrames ||
    payload.recipeProfileId !== OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE ||
    !FOUR_K_FRAMES.has(`${width}x${height}`) || payload.fps !== 30 ||
    payload.videoAssemblyPolicy !== 'ordered_vp9_object_chunk_stream_copy_v1' ||
    payload.audioAssemblyPolicy !== 'continuous_flac_program_audio_stream_copy_v1' ||
    payload.timestampPolicy !== 'normalize_from_zero_preserve_frame_and_sample_time_v1' ||
    payload.compatibilityPolicy !== 'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1' ||
    payload.outputContainer !== 'matroska' || payload.outputVideoCodec !== 'copy_vp9' ||
    payload.outputAudioCodec !== 'copy_flac' ||
    payload.renderPurpose !== 'private_4k_long_form_review_master_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false ||
    payload.mediaReencodingAllowed !== false
  ) throw invalid('Long-form master planning policy is unsupported.')
  return {
    recipeProfileId: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_RECIPE,
    assemblyAuthorityHash: hash(payload.assemblyAuthorityHash, 'assembly hash'),
    expectedObjectIdentity: identity(payload.expectedObjectIdentity, 'output identity'),
    width: width as OfflineLongFormMasterAssemblyPlanningPayload['width'],
    height: height as OfflineLongFormMasterAssemblyPlanningPayload['height'],
    fps: 30,
    totalFrames,
    chunks,
    crossChunkColorValidationHash: hash(payload.crossChunkColorValidationHash, 'color hash'),
    continuousProgramAudioQaHash: hash(payload.continuousProgramAudioQaHash, 'audio QA hash'),
    videoAssemblyPolicy: 'ordered_vp9_object_chunk_stream_copy_v1',
    audioAssemblyPolicy: 'continuous_flac_program_audio_stream_copy_v1',
    timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1',
    compatibilityPolicy: 'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1',
    outputContainer: 'matroska', outputVideoCodec: 'copy_vp9',
    outputAudioCodec: 'copy_flac',
    renderPurpose: 'private_4k_long_form_review_master_v1',
    usesApprovedEditReservation: true, requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false, mediaReencodingAllowed: false,
  }
}

function exactRecord(value: unknown, keys: string[], label: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} is invalid.`)
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return record
}
function identity(value: unknown, label: string): string {
  if (typeof value !== 'string' || !IDENTITY.test(value) || value.includes('..')) throw invalid(`${label} is invalid.`)
  return value
}
function hash(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) throw invalid(`${label} is invalid.`)
  return value
}
function integer(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) throw invalid(`${label} is invalid.`)
  return Number(value)
}
function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'offline_media_binary_long_form_master_assembly_contract',
  })
}
