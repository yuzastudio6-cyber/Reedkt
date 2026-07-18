import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_PROTOCOL =
  'offline-media-binary-cross-chunk-color-continuity-v1' as const
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_INPUT_MODE =
  'server_injected_private_adjacent_object_chunks_v1' as const
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE =
  'approved_cross_chunk_color_continuity_rgb_sample_v1' as const
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY =
  'bt709_adjacent_chunk_boundary_rgb_policy_v1' as const
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_MAXIMUM_CHUNK_BYTES =
  512 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES =
  30 as const
export const OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_FRAMES_PER_SIDE =
  3 as const

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const FOUR_K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])

export type OfflineMediaBinaryCrossChunkColorBoundary =
  | 'continuous_technical_split'
  | 'approved_hard_cut'

export interface OfflineMediaBinaryCrossChunkColorChunkCommitment {
  inputId: 'left-chunk' | 'right-chunk'
  chunkId: string
  chunkIndex: number
  objectIdentity: string
  mimeType: 'video/x-matroska'
  byteLength: number
  sha256: string
  frameCount: number
}

export interface OfflineMediaBinaryCrossChunkColorContinuityPlanningPayload {
  recipeProfileId:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE
  continuityPolicyId:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY
  colorAuthorityHash: string
  expectedEvidenceIdentity: string
  leftChunkIndex: number
  rightChunkIndex: number
  boundaryBefore: OfflineMediaBinaryCrossChunkColorBoundary
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 30
  sampleWindowFrames:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES
  sampleFramesPerSide:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_FRAMES_PER_SIDE
  sourcePolicy: 'independently_qa_passed_private_vp9_bt709_chunks_v1'
  technicalSplitMismatchDisposition: 'block_finalization'
  editorialCutMismatchDisposition: 'review_required'
  mediaMutationAllowed: false
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineMediaBinaryCrossChunkColorContinuityRequest {
  schemaVersion:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode:
    typeof OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_INPUT_MODE
  payload: OfflineMediaBinaryCrossChunkColorContinuityPlanningPayload
  inputs: {
    left: OfflineMediaBinaryCrossChunkColorChunkCommitment & {
      inputId: 'left-chunk'
    }
    right: OfflineMediaBinaryCrossChunkColorChunkCommitment & {
      inputId: 'right-chunk'
    }
  }
}

export function buildOfflineMediaBinaryCrossChunkColorContinuityRequest(input: {
  planningPayload: unknown
  left: OfflineMediaBinaryCrossChunkColorChunkCommitment
  right: OfflineMediaBinaryCrossChunkColorChunkCommitment
}): OfflineMediaBinaryCrossChunkColorContinuityRequest {
  return validateOfflineMediaBinaryCrossChunkColorContinuityRequest({
    schemaVersion:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { left: input.left, right: input.right },
  })
}

export function validateOfflineMediaBinaryCrossChunkColorContinuityRequest(
  value: unknown,
): OfflineMediaBinaryCrossChunkColorContinuityRequest {
  const request = exactRecord(value, [
    'schemaVersion',
    'toolId',
    'operationId',
    'inputMode',
    'payload',
    'inputs',
  ], 'cross-chunk color-continuity request')
  if (
    request.schemaVersion !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_INPUT_MODE
  ) throw invalid('Cross-chunk color-continuity request authority is unsupported.')

  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(
    request.inputs,
    ['left', 'right'],
    'cross-chunk color-continuity inputs',
  )
  const left = validateChunkCommitment(inputs.left, 'left-chunk')
  const right = validateChunkCommitment(inputs.right, 'right-chunk')
  if (
    left.chunkIndex !== payload.leftChunkIndex ||
    right.chunkIndex !== payload.rightChunkIndex ||
    left.chunkIndex + 1 !== right.chunkIndex ||
    left.objectIdentity === right.objectIdentity ||
    (left.sha256 === right.sha256 && left.chunkId === right.chunkId)
  ) throw invalid('Cross-chunk color-continuity pair lost adjacent chunk identity.')
  return {
    schemaVersion:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_INPUT_MODE,
    payload,
    inputs: { left, right },
  }
}

export function offlineMediaBinaryCrossChunkColorContinuityRequestSha256(
  request: OfflineMediaBinaryCrossChunkColorContinuityRequest,
): string {
  const validated =
    validateOfflineMediaBinaryCrossChunkColorContinuityRequest(request)
  return createHash('sha256')
    .update(stableStringify(validated))
    .digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineMediaBinaryCrossChunkColorContinuityPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId',
    'continuityPolicyId',
    'colorAuthorityHash',
    'expectedEvidenceIdentity',
    'leftChunkIndex',
    'rightChunkIndex',
    'boundaryBefore',
    'width',
    'height',
    'fps',
    'sampleWindowFrames',
    'sampleFramesPerSide',
    'sourcePolicy',
    'technicalSplitMismatchDisposition',
    'editorialCutMismatchDisposition',
    'mediaMutationAllowed',
    'usesApprovedEditReservation',
    'requiresSeparateExportEstimate',
    'allowsAdditionalExportCharge',
  ], 'cross-chunk color-continuity planning payload')
  const leftChunkIndex = integer(payload.leftChunkIndex, 1, 123, 'leftChunkIndex')
  const rightChunkIndex = integer(payload.rightChunkIndex, 2, 124, 'rightChunkIndex')
  const width = integer(payload.width, 2160, 3840, 'width')
  const height = integer(payload.height, 2160, 3840, 'height')
  if (
    payload.recipeProfileId !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE ||
    payload.continuityPolicyId !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY ||
    rightChunkIndex !== leftChunkIndex + 1 ||
    ![
      'continuous_technical_split',
      'approved_hard_cut',
    ].includes(String(payload.boundaryBefore)) ||
    !FOUR_K_MASTER_FRAMES.has(`${width}x${height}`) ||
    payload.fps !== 30 ||
    payload.sampleWindowFrames !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES ||
    payload.sampleFramesPerSide !==
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_FRAMES_PER_SIDE ||
    payload.sourcePolicy !==
      'independently_qa_passed_private_vp9_bt709_chunks_v1' ||
    payload.technicalSplitMismatchDisposition !== 'block_finalization' ||
    payload.editorialCutMismatchDisposition !== 'review_required' ||
    payload.mediaMutationAllowed !== false ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Cross-chunk color-continuity planning authority is unsupported.')
  return {
    recipeProfileId:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE,
    continuityPolicyId:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY,
    colorAuthorityHash: sha256(payload.colorAuthorityHash, 'colorAuthorityHash'),
    expectedEvidenceIdentity: identity(
      payload.expectedEvidenceIdentity,
      'expectedEvidenceIdentity',
    ),
    leftChunkIndex,
    rightChunkIndex,
    boundaryBefore: payload.boundaryBefore as OfflineMediaBinaryCrossChunkColorBoundary,
    width: width as OfflineMediaBinaryCrossChunkColorContinuityPlanningPayload['width'],
    height: height as OfflineMediaBinaryCrossChunkColorContinuityPlanningPayload['height'],
    fps: 30,
    sampleWindowFrames:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES,
    sampleFramesPerSide:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_FRAMES_PER_SIDE,
    sourcePolicy: 'independently_qa_passed_private_vp9_bt709_chunks_v1',
    technicalSplitMismatchDisposition: 'block_finalization',
    editorialCutMismatchDisposition: 'review_required',
    mediaMutationAllowed: false,
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

function validateChunkCommitment<T extends 'left-chunk' | 'right-chunk'>(
  value: unknown,
  expectedInputId: T,
): OfflineMediaBinaryCrossChunkColorChunkCommitment & {
  inputId: T
} {
  const chunk = exactRecord(value, [
    'inputId',
    'chunkId',
    'chunkIndex',
    'objectIdentity',
    'mimeType',
    'byteLength',
    'sha256',
    'frameCount',
  ], `${expectedInputId} commitment`)
  if (chunk.inputId !== expectedInputId || chunk.mimeType !== 'video/x-matroska') {
    throw invalid('Cross-chunk color-continuity media commitment is unsupported.')
  }
  return {
    inputId: expectedInputId,
    chunkId: identity(chunk.chunkId, 'chunkId'),
    chunkIndex: integer(chunk.chunkIndex, 1, 124, 'chunkIndex'),
    objectIdentity: sha256(chunk.objectIdentity, 'objectIdentity'),
    mimeType: 'video/x-matroska',
    byteLength: integer(
      chunk.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_MAXIMUM_CHUNK_BYTES,
      'byteLength',
    ),
    sha256: sha256(chunk.sha256, 'sha256'),
    frameCount: integer(chunk.frameCount, 1_350, 5_400, 'frameCount'),
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
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} fields are invalid.`)
  }
  return record
}

function integer(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw invalid(`${label} is outside the fixed bound.`)
  }
  return Number(value)
}

function identity(value: unknown, label: string): string {
  if (typeof value !== 'string' || !IDENTITY.test(value) || value.includes('..')) {
    throw invalid(`${label} is invalid.`)
  }
  return value
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`${label} is invalid.`)
  }
  return value
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'offline_media_binary_cross_chunk_color_continuity',
  })
}
