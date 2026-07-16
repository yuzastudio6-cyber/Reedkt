import { createHash } from 'node:crypto'

import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
} from '../../../src/types/canonical-private-composition-capacity'
import { ApiError } from '../../errors/api-error'
import { OFFLINE_REMOTION_RENDER_OPERATION } from './offline-remotion-render-execution-protocol'

export const OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_PROTOCOL =
  'offline-remotion-long-form-merge-stream-execution-v1' as const
export const OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_CONTAINER_PROTOCOL =
  'offline-remotion-long-form-merge-stream-execution-container-v1' as const
export const OFFLINE_REMOTION_LONG_FORM_MERGE_INPUT_MODE =
  'server_injected_private_stream_v1' as const
export const OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID =
  'approved_4k_composition_chunk_merge_final_v1' as const
export const OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_MANIFEST_BYTES =
  256 * 1024
export const OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_CHUNK_BYTES =
  256 * 1024 * 1024
export const OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_COMBINED_CHUNK_BYTES =
  640 * 1024 * 1024

const SHA256 = /^[a-f0-9]{64}$/u
const FOUR_K_MASTER_FRAMES = new Set([
  '3840x2160',
  '2160x3840',
  '2160x2160',
  '2160x2700',
  '2880x2160',
])

export interface OfflineRemotionLongFormMergeChunkPlanningPayload {
  outputKey: string
  chunkIndex: number
  chunkCount: number
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}

export interface OfflineRemotionLongFormMergeBoundaryTransitionPlanningPayload {
  transitionTimingItemId: string
  refinedTransitionTimingItemId: string
  fromSourceSequenceItemId: string
  toSourceSequenceItemId: string
  boundaryFrame: number
}

export interface OfflineRemotionLongFormMergePlanningPayload {
  compositionProfileId: typeof OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID
  longFormCapacityProfileId: typeof CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 24 | 30
  durationFrames: number
  chunks: OfflineRemotionLongFormMergeChunkPlanningPayload[]
  mergePolicy: 'approved_contiguous_4k_chunks_v1'
  transitionPolicy: 'approved_hard_cuts_only'
  chunkBoundaryTransitions: OfflineRemotionLongFormMergeBoundaryTransitionPlanningPayload[]
  audioPolicy: 'preserve_approved_chunk_audio'
  frameContinuityPolicy: 'exact_integer_frame_boundaries_v1'
  renderPurpose: 'private_4k_delivery_master_v1'
  deliveryProfileId: 'uhd_2160'
  estimateCostBasisProfileId: 'uhd_2160'
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineRemotionLongFormMergeChunkCommitment {
  inputId: string
  outputKey: string
  chunkIndex: number
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionLongFormMergeStreamingRequest {
  schemaVersion: typeof OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_PROTOCOL
  toolId: 'remotion'
  operationId: typeof OFFLINE_REMOTION_RENDER_OPERATION
  inputMode: typeof OFFLINE_REMOTION_LONG_FORM_MERGE_INPUT_MODE
  payload: OfflineRemotionLongFormMergePlanningPayload
  inputs: {
    chunks: OfflineRemotionLongFormMergeChunkCommitment[]
  }
}

export function validateOfflineRemotionLongFormMergePlanningPayload(
  value: unknown,
): OfflineRemotionLongFormMergePlanningPayload {
  const payload = exactRecord(value, [
    'compositionProfileId', 'longFormCapacityProfileId',
    'width', 'height', 'fps', 'durationFrames', 'chunks',
    'mergePolicy', 'transitionPolicy', 'chunkBoundaryTransitions',
    'audioPolicy', 'frameContinuityPolicy',
    'renderPurpose', 'deliveryProfileId', 'estimateCostBasisProfileId',
    'sourceQualityPolicy', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  ], 'long-form merge planning payload')
  if (
    payload.compositionProfileId !== OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID ||
    payload.longFormCapacityProfileId !== CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID ||
    !Number.isSafeInteger(payload.width) || !Number.isSafeInteger(payload.height) ||
    !FOUR_K_MASTER_FRAMES.has(`${String(payload.width)}x${String(payload.height)}`) ||
    ![24, 30].includes(Number(payload.fps)) ||
    !Number.isSafeInteger(payload.durationFrames) ||
    Number(payload.durationFrames) < CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES ||
    Number(payload.durationFrames) > CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES ||
    payload.mergePolicy !== 'approved_contiguous_4k_chunks_v1' ||
    payload.transitionPolicy !== 'approved_hard_cuts_only' ||
    payload.audioPolicy !== 'preserve_approved_chunk_audio' ||
    payload.frameContinuityPolicy !== 'exact_integer_frame_boundaries_v1' ||
    payload.renderPurpose !== 'private_4k_delivery_master_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Long-form merge planning authority is unsupported.')

  const chunks = validateChunks(payload.chunks, Number(payload.durationFrames))
  const transitions = validateBoundaryTransitions(
    payload.chunkBoundaryTransitions,
    chunks,
  )
  return {
    compositionProfileId: OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID,
    longFormCapacityProfileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
    width: Number(payload.width) as OfflineRemotionLongFormMergePlanningPayload['width'],
    height: Number(payload.height) as OfflineRemotionLongFormMergePlanningPayload['height'],
    fps: Number(payload.fps) as 24 | 30,
    durationFrames: Number(payload.durationFrames),
    chunks,
    mergePolicy: 'approved_contiguous_4k_chunks_v1',
    transitionPolicy: 'approved_hard_cuts_only',
    chunkBoundaryTransitions: transitions,
    audioPolicy: 'preserve_approved_chunk_audio',
    frameContinuityPolicy: 'exact_integer_frame_boundaries_v1',
    renderPurpose: 'private_4k_delivery_master_v1',
    deliveryProfileId: 'uhd_2160',
    estimateCostBasisProfileId: 'uhd_2160',
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
  }
}

export function buildOfflineRemotionLongFormMergeStreamingRequest(input: {
  planningPayload: unknown
  chunks: Array<{
    inputId: string
    outputKey: string
    chunkIndex: number
    mimeType: 'video/mp4'
    byteLength: number
    sha256: string
  }>
}): OfflineRemotionLongFormMergeStreamingRequest {
  return validateOfflineRemotionLongFormMergeStreamingRequest({
    schemaVersion: OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_LONG_FORM_MERGE_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { chunks: input.chunks },
  })
}

export function validateOfflineRemotionLongFormMergeStreamingRequest(
  value: unknown,
): OfflineRemotionLongFormMergeStreamingRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'long-form merge streaming request')
  if (
    request.schemaVersion !== OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_PROTOCOL ||
    request.toolId !== 'remotion' ||
    request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    request.inputMode !== OFFLINE_REMOTION_LONG_FORM_MERGE_INPUT_MODE
  ) throw invalid('Long-form merge streaming request identity is unsupported.')
  const payload = validateOfflineRemotionLongFormMergePlanningPayload(request.payload)
  const inputs = exactRecord(request.inputs, ['chunks'], 'long-form merge inputs')
  if (!Array.isArray(inputs.chunks) || inputs.chunks.length !== payload.chunks.length) {
    throw invalid('Long-form merge chunk commitments are incomplete.')
  }
  let combinedBytes = 0
  const inputIds = new Set<string>()
  const commitments = inputs.chunks.map((value, index) => {
    const commitment = exactRecord(value, [
      'inputId', 'outputKey', 'chunkIndex', 'mimeType', 'byteLength', 'sha256',
    ], `long-form merge chunk commitment ${index + 1}`)
    const planned = payload.chunks[index]!
    const normalized = {
      inputId: identity(commitment.inputId, 'chunk inputId'),
      outputKey: identity(commitment.outputKey, 'chunk outputKey'),
      chunkIndex: integer(commitment.chunkIndex, 1, payload.chunks.length, 'chunkIndex'),
      mimeType: commitment.mimeType,
      byteLength: integer(
        commitment.byteLength,
        1_024,
        OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_CHUNK_BYTES,
        'chunk byteLength',
      ),
      sha256: commitment.sha256,
    }
    if (
      normalized.mimeType !== 'video/mp4' ||
      typeof normalized.sha256 !== 'string' || !SHA256.test(normalized.sha256) ||
      normalized.outputKey !== planned.outputKey ||
      normalized.chunkIndex !== planned.chunkIndex ||
      inputIds.has(normalized.inputId)
    ) throw invalid('Long-form merge chunk commitment diverges from its approved chunk.')
    inputIds.add(normalized.inputId)
    combinedBytes += normalized.byteLength
    return normalized as OfflineRemotionLongFormMergeChunkCommitment
  })
  if (
    !Number.isSafeInteger(combinedBytes) ||
    combinedBytes > OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_COMBINED_CHUNK_BYTES
  ) throw invalid('Long-form merge chunk commitments exceed the confined combined ceiling.')
  const normalized: OfflineRemotionLongFormMergeStreamingRequest = {
    schemaVersion: OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_LONG_FORM_MERGE_INPUT_MODE,
    payload,
    inputs: { chunks: commitments },
  }
  if (
    Buffer.byteLength(JSON.stringify(normalized)) >
    OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_MANIFEST_BYTES
  ) throw invalid('Long-form merge manifest exceeds its fixed metadata ceiling.')
  return normalized
}

export function offlineRemotionLongFormMergeInputCommitments(
  request: OfflineRemotionLongFormMergeStreamingRequest,
): OfflineRemotionLongFormMergeChunkCommitment[] {
  return validateOfflineRemotionLongFormMergeStreamingRequest(request).inputs.chunks
    .map((chunk) => ({ ...chunk }))
}

export function offlineRemotionLongFormMergeRequestSha256(
  request: OfflineRemotionLongFormMergeStreamingRequest,
): string {
  const normalized = validateOfflineRemotionLongFormMergeStreamingRequest(request)
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

function validateChunks(
  value: unknown,
  totalFrames: number,
): OfflineRemotionLongFormMergeChunkPlanningPayload[] {
  if (
    !Array.isArray(value) || value.length < 2 ||
    value.length > CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS
  ) throw invalid('Long-form merge requires two through eight approved chunks.')
  const outputKeys = new Set<string>()
  const sourceIds = new Set<string>()
  const cleanupIds = new Set<string>()
  let expectedStart = 0
  const chunks = value.map((candidate, index) => {
    const chunk = exactRecord(candidate, [
      'outputKey', 'chunkIndex', 'chunkCount',
      'globalStartFrame', 'globalEndFrameExclusive', 'durationFrames',
      'sourceSequenceItemIds', 'sourceCleanupDecisionIds',
    ], `long-form merge chunk ${index + 1}`)
    const sourceSequenceItemIds = identities(
      chunk.sourceSequenceItemIds,
      'sourceSequenceItemIds',
    )
    const sourceCleanupDecisionIds = identities(
      chunk.sourceCleanupDecisionIds,
      'sourceCleanupDecisionIds',
    )
    const normalized = {
      outputKey: identity(chunk.outputKey, 'chunk outputKey'),
      chunkIndex: integer(chunk.chunkIndex, 1, value.length, 'chunkIndex'),
      chunkCount: integer(chunk.chunkCount, value.length, value.length, 'chunkCount'),
      globalStartFrame: integer(chunk.globalStartFrame, 0, totalFrames - 1, 'globalStartFrame'),
      globalEndFrameExclusive: integer(
        chunk.globalEndFrameExclusive,
        1,
        totalFrames,
        'globalEndFrameExclusive',
      ),
      durationFrames: integer(
        chunk.durationFrames,
        CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
        CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
        'chunk durationFrames',
      ),
      sourceSequenceItemIds,
      sourceCleanupDecisionIds,
    }
    if (
      normalized.chunkIndex !== index + 1 ||
      normalized.globalStartFrame !== expectedStart ||
      normalized.globalEndFrameExclusive <= normalized.globalStartFrame ||
      normalized.durationFrames !==
        normalized.globalEndFrameExclusive - normalized.globalStartFrame ||
      sourceSequenceItemIds.length !== sourceCleanupDecisionIds.length ||
      outputKeys.has(normalized.outputKey) ||
      sourceSequenceItemIds.some((sourceId) => sourceIds.has(sourceId)) ||
      sourceCleanupDecisionIds.some((decisionId) => cleanupIds.has(decisionId))
    ) throw invalid('Long-form merge chunks are not unique, contiguous, and duration preserving.')
    outputKeys.add(normalized.outputKey)
    sourceSequenceItemIds.forEach((sourceId) => sourceIds.add(sourceId))
    sourceCleanupDecisionIds.forEach((decisionId) => cleanupIds.add(decisionId))
    expectedStart = normalized.globalEndFrameExclusive
    return normalized
  })
  if (expectedStart !== totalFrames) {
    throw invalid('Long-form merge chunks do not cover the exact approved duration.')
  }
  if (
    sourceIds.size < 2 ||
    sourceIds.size > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS ||
    cleanupIds.size !== sourceIds.size
  ) {
    throw invalid('Long-form merge requires two through eight ordered approved sources.')
  }
  return chunks
}

function validateBoundaryTransitions(
  value: unknown,
  chunks: OfflineRemotionLongFormMergeChunkPlanningPayload[],
): OfflineRemotionLongFormMergeBoundaryTransitionPlanningPayload[] {
  if (!Array.isArray(value) || value.length !== chunks.length - 1) {
    throw invalid('Long-form merge requires one approved hard cut per chunk boundary.')
  }
  const timingIds = new Set<string>()
  const refinedIds = new Set<string>()
  return value.map((candidate, index) => {
    const transition = exactRecord(candidate, [
      'transitionTimingItemId', 'refinedTransitionTimingItemId',
      'fromSourceSequenceItemId', 'toSourceSequenceItemId', 'boundaryFrame',
    ], `long-form chunk boundary transition ${index + 1}`)
    const fromChunk = chunks[index]!
    const toChunk = chunks[index + 1]!
    const normalized = {
      transitionTimingItemId: identity(
        transition.transitionTimingItemId,
        'transitionTimingItemId',
      ),
      refinedTransitionTimingItemId: identity(
        transition.refinedTransitionTimingItemId,
        'refinedTransitionTimingItemId',
      ),
      fromSourceSequenceItemId: identity(
        transition.fromSourceSequenceItemId,
        'fromSourceSequenceItemId',
      ),
      toSourceSequenceItemId: identity(
        transition.toSourceSequenceItemId,
        'toSourceSequenceItemId',
      ),
      boundaryFrame: integer(
        transition.boundaryFrame,
        1,
        chunks.at(-1)!.globalEndFrameExclusive - 1,
        'boundaryFrame',
      ),
    }
    if (
      timingIds.has(normalized.transitionTimingItemId) ||
      refinedIds.has(normalized.refinedTransitionTimingItemId) ||
      normalized.boundaryFrame !== fromChunk.globalEndFrameExclusive ||
      normalized.boundaryFrame !== toChunk.globalStartFrame ||
      normalized.fromSourceSequenceItemId !== fromChunk.sourceSequenceItemIds.at(-1) ||
      normalized.toSourceSequenceItemId !== toChunk.sourceSequenceItemIds[0]
    ) throw invalid('Long-form merge hard-cut authority diverges from a chunk boundary.')
    timingIds.add(normalized.transitionTimingItemId)
    refinedIds.add(normalized.refinedTransitionTimingItemId)
    return normalized
  })
}

function identities(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw invalid(`${label} is outside its fixed bound.`)
  }
  const result = value.map((candidate) => identity(candidate, label))
  if (new Set(result).size !== result.length) throw invalid(`${label} must be unique.`)
  return result
}

function identity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 200 ||
    value !== value.trim() || value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value)
  ) throw invalid(`${label} is invalid.`)
  return value
}

function integer(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw invalid(`${label} is outside its fixed bound.`)
  }
  return Number(value)
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} must be an object.`)
  }
  const result = value as Record<string, unknown>
  if (Object.keys(result).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return result
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
