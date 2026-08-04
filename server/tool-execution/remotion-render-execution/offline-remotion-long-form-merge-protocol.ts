import { createHash } from 'node:crypto'

import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES,
  type CanonicalPrivateLongFormCapacityProfileId,
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
  sourceSliceKey?: string
  sourceStartFrame?: number
  sourceEndFrameExclusive?: number
}

export interface OfflineRemotionLongFormMergeBoundaryTransitionPlanningPayload {
  transitionTimingItemId: string
  refinedTransitionTimingItemId: string
  fromSourceSequenceItemId: string
  toSourceSequenceItemId: string
  boundaryFrame: number
}

export interface OfflineRemotionLongFormMergeBoundaryContinuityPlanningPayload {
  sourceSequenceItemId: string
  sourceCleanupDecisionId: string
  boundaryFrame: number
  previousSourceEndFrameExclusive: number
  nextSourceStartFrame: number
  fromSourceSliceKey: string
  toSourceSliceKey: string
}

interface OfflineRemotionLongFormMergePlanningPayloadBase {
  compositionProfileId: typeof OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID
  longFormCapacityProfileId: CanonicalPrivateLongFormCapacityProfileId
  width: 2160 | 2880 | 3840
  height: 2160 | 2700 | 3840
  fps: 24 | 30
  durationFrames: number
  chunks: OfflineRemotionLongFormMergeChunkPlanningPayload[]
  audioPolicy: 'preserve_approved_chunk_audio'
  renderPurpose: 'private_4k_delivery_master_v1'
  deliveryProfileId: 'uhd_2160'
  estimateCostBasisProfileId: 'uhd_2160'
  sourceQualityPolicy: 'immutable_source_master_no_proxy_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
}

export interface OfflineRemotionLongFormSourceBoundaryMergePlanningPayload
  extends OfflineRemotionLongFormMergePlanningPayloadBase {
  longFormCapacityProfileId: typeof CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
  mergePolicy: 'approved_contiguous_4k_chunks_v1'
  transitionPolicy: 'approved_hard_cuts_only'
  chunkBoundaryTransitions: OfflineRemotionLongFormMergeBoundaryTransitionPlanningPayload[]
  frameContinuityPolicy: 'exact_integer_frame_boundaries_v1'
}

export interface OfflineRemotionLongFormSourceSliceMergePlanningPayload
  extends OfflineRemotionLongFormMergePlanningPayloadBase {
  longFormCapacityProfileId:
    typeof CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
  mergePolicy: 'approved_contiguous_source_slice_4k_chunks_v2'
  transitionPolicy: 'continuous_approved_source_slices_only'
  chunkBoundaryTransitions: []
  chunkBoundaryContinuity:
    OfflineRemotionLongFormMergeBoundaryContinuityPlanningPayload[]
  frameContinuityPolicy: 'exact_integer_frame_and_source_slice_boundaries_v2'
}

export type OfflineRemotionLongFormMergePlanningPayload =
  | OfflineRemotionLongFormSourceBoundaryMergePlanningPayload
  | OfflineRemotionLongFormSourceSliceMergePlanningPayload

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
  const raw = record(value, 'long-form merge planning payload')
  const sourceSliceProfile = raw.longFormCapacityProfileId ===
    CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
  const payload = exactRecord(value, [
    'compositionProfileId', 'longFormCapacityProfileId',
    'width', 'height', 'fps', 'durationFrames', 'chunks',
    'mergePolicy', 'transitionPolicy', 'chunkBoundaryTransitions',
    ...(sourceSliceProfile ? ['chunkBoundaryContinuity'] : []),
    'audioPolicy', 'frameContinuityPolicy',
    'renderPurpose', 'deliveryProfileId', 'estimateCostBasisProfileId',
    'sourceQualityPolicy', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  ], 'long-form merge planning payload')
  const capacity = longFormCapacity(payload.longFormCapacityProfileId)
  if (
    payload.compositionProfileId !== OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID ||
    !capacity ||
    !Number.isSafeInteger(payload.width) || !Number.isSafeInteger(payload.height) ||
    !FOUR_K_MASTER_FRAMES.has(`${String(payload.width)}x${String(payload.height)}`) ||
    ![24, 30].includes(Number(payload.fps)) ||
    !Number.isSafeInteger(payload.durationFrames) ||
    Number(payload.durationFrames) < capacity.minimumFrames ||
    Number(payload.durationFrames) > capacity.maximumFrames ||
    payload.audioPolicy !== 'preserve_approved_chunk_audio' ||
    payload.renderPurpose !== 'private_4k_delivery_master_v1' ||
    payload.deliveryProfileId !== 'uhd_2160' ||
    payload.estimateCostBasisProfileId !== 'uhd_2160' ||
    payload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Long-form merge planning authority is unsupported.')

  const chunks = validateChunks(
    payload.chunks,
    Number(payload.durationFrames),
    capacity.profileId,
  )
  const common = {
    compositionProfileId:
      OFFLINE_REMOTION_LONG_FORM_MERGE_COMPOSITION_PROFILE_ID,
    width: Number(payload.width) as OfflineRemotionLongFormMergePlanningPayload['width'],
    height: Number(payload.height) as OfflineRemotionLongFormMergePlanningPayload['height'],
    fps: Number(payload.fps) as 24 | 30,
    durationFrames: Number(payload.durationFrames),
    chunks,
    audioPolicy: 'preserve_approved_chunk_audio' as const,
    renderPurpose: 'private_4k_delivery_master_v1' as const,
    deliveryProfileId: 'uhd_2160' as const,
    estimateCostBasisProfileId: 'uhd_2160' as const,
    sourceQualityPolicy: 'immutable_source_master_no_proxy_v1' as const,
    usesApprovedEditReservation: true as const,
    requiresSeparateExportEstimate: false as const,
    allowsAdditionalExportCharge: false as const,
  }
  if (capacity.profileId === CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID) {
    if (
      payload.mergePolicy !== 'approved_contiguous_4k_chunks_v1' ||
      payload.transitionPolicy !== 'approved_hard_cuts_only' ||
      payload.frameContinuityPolicy !== 'exact_integer_frame_boundaries_v1'
    ) throw invalid('Long-form source-boundary merge policy is unsupported.')
    return {
      ...common,
      longFormCapacityProfileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
      mergePolicy: 'approved_contiguous_4k_chunks_v1',
      transitionPolicy: 'approved_hard_cuts_only',
      chunkBoundaryTransitions: validateBoundaryTransitions(
        payload.chunkBoundaryTransitions,
        chunks,
      ),
      frameContinuityPolicy: 'exact_integer_frame_boundaries_v1',
    }
  }
  if (
    payload.mergePolicy !== 'approved_contiguous_source_slice_4k_chunks_v2' ||
    payload.transitionPolicy !== 'continuous_approved_source_slices_only' ||
    payload.frameContinuityPolicy !==
      'exact_integer_frame_and_source_slice_boundaries_v2' ||
    !Array.isArray(payload.chunkBoundaryTransitions) ||
    payload.chunkBoundaryTransitions.length !== 0
  ) throw invalid('Long-form source-slice merge policy is unsupported.')
  return {
    ...common,
    longFormCapacityProfileId:
      CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
    mergePolicy: 'approved_contiguous_source_slice_4k_chunks_v2',
    transitionPolicy: 'continuous_approved_source_slices_only',
    chunkBoundaryTransitions: [],
    chunkBoundaryContinuity: validateBoundaryContinuity(
      payload.chunkBoundaryContinuity,
      chunks,
    ),
    frameContinuityPolicy: 'exact_integer_frame_and_source_slice_boundaries_v2',
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
  profileId: CanonicalPrivateLongFormCapacityProfileId,
): OfflineRemotionLongFormMergeChunkPlanningPayload[] {
  const capacity = longFormCapacity(profileId)
  if (!capacity) throw invalid('Long-form capacity profile is unsupported.')
  if (
    !Array.isArray(value) || value.length < 2 ||
    value.length > capacity.maximumChunks
  ) throw invalid(`Long-form merge requires two through ${capacity.maximumChunks} approved chunks.`)
  const outputKeys = new Set<string>()
  const sourceIds = new Set<string>()
  const cleanupIds = new Set<string>()
  let expectedStart = 0
  const chunks = value.map((candidate, index) => {
    const chunk = exactRecord(candidate, [
      'outputKey', 'chunkIndex', 'chunkCount',
      'globalStartFrame', 'globalEndFrameExclusive', 'durationFrames',
      'sourceSequenceItemIds', 'sourceCleanupDecisionIds',
      ...(profileId === CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
        ? ['sourceSliceKey', 'sourceStartFrame', 'sourceEndFrameExclusive']
        : []),
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
        capacity.maximumChunkFrames,
        'chunk durationFrames',
      ),
      sourceSequenceItemIds,
      sourceCleanupDecisionIds,
      ...(profileId === CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
        ? {
            sourceSliceKey: identity(chunk.sourceSliceKey, 'chunk sourceSliceKey'),
            sourceStartFrame: integer(
              chunk.sourceStartFrame,
              0,
              Number.MAX_SAFE_INTEGER - 1,
              'chunk sourceStartFrame',
            ),
            sourceEndFrameExclusive: integer(
              chunk.sourceEndFrameExclusive,
              1,
              Number.MAX_SAFE_INTEGER,
              'chunk sourceEndFrameExclusive',
            ),
          }
        : {}),
    }
    if (
      normalized.chunkIndex !== index + 1 ||
      normalized.globalStartFrame !== expectedStart ||
      normalized.globalEndFrameExclusive <= normalized.globalStartFrame ||
      normalized.durationFrames !==
        normalized.globalEndFrameExclusive - normalized.globalStartFrame ||
      sourceSequenceItemIds.length !== sourceCleanupDecisionIds.length ||
      outputKeys.has(normalized.outputKey) ||
      (profileId === CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID &&
        (sourceSequenceItemIds.some((sourceId) => sourceIds.has(sourceId)) ||
          sourceCleanupDecisionIds.some((decisionId) => cleanupIds.has(decisionId)))) ||
      (profileId === CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID && (
        normalized.sourceEndFrameExclusive! - normalized.sourceStartFrame! !==
          normalized.durationFrames ||
        normalized.sourceSliceKey !==
          `source-slice-${index + 1}-of-${value.length}`
      ))
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
    profileId === CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID &&
    chunks.some((chunk, index) => index > 0 &&
      chunk.sourceStartFrame !== chunks[index - 1]!.sourceEndFrameExclusive)
  ) {
    throw invalid('Source-slice merge chunks do not preserve exact approved source-frame continuity.')
  }
  const validSourceLineage = profileId === CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
    ? sourceIds.size >= 2 &&
      sourceIds.size <= CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS &&
      cleanupIds.size === sourceIds.size
    : sourceIds.size === 1 && cleanupIds.size === 1 && chunks.every((chunk) =>
      chunk.sourceSequenceItemIds.length === 1 &&
      chunk.sourceCleanupDecisionIds.length === 1 &&
      chunk.sourceSequenceItemIds[0] === chunks[0]!.sourceSequenceItemIds[0] &&
      chunk.sourceCleanupDecisionIds[0] === chunks[0]!.sourceCleanupDecisionIds[0])
  if (!validSourceLineage) {
    throw invalid(profileId === CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
      ? 'Long-form merge requires two through eight ordered approved sources.'
      : 'Source-slice merge requires one exact approved source and cleanup identity across every chunk.')
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

function validateBoundaryContinuity(
  value: unknown,
  chunks: OfflineRemotionLongFormMergeChunkPlanningPayload[],
): OfflineRemotionLongFormMergeBoundaryContinuityPlanningPayload[] {
  if (!Array.isArray(value) || value.length !== chunks.length - 1) {
    throw invalid('Source-slice merge requires one exact continuity record per chunk boundary.')
  }
  const sliceKeys = new Set<string>()
  let expectedFromSliceKey: string | undefined
  return value.map((candidate, index) => {
    const continuity = exactRecord(candidate, [
      'sourceSequenceItemId', 'sourceCleanupDecisionId', 'boundaryFrame',
      'previousSourceEndFrameExclusive', 'nextSourceStartFrame',
      'fromSourceSliceKey', 'toSourceSliceKey',
    ], `long-form source-slice continuity ${index + 1}`)
    const fromChunk = chunks[index]!
    const toChunk = chunks[index + 1]!
    const normalized = {
      sourceSequenceItemId: identity(
        continuity.sourceSequenceItemId,
        'sourceSequenceItemId',
      ),
      sourceCleanupDecisionId: identity(
        continuity.sourceCleanupDecisionId,
        'sourceCleanupDecisionId',
      ),
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
      toSourceSliceKey: identity(
        continuity.toSourceSliceKey,
        'toSourceSliceKey',
      ),
    }
    if (
      normalized.boundaryFrame !== fromChunk.globalEndFrameExclusive ||
      normalized.boundaryFrame !== toChunk.globalStartFrame ||
      normalized.sourceSequenceItemId !== fromChunk.sourceSequenceItemIds[0] ||
      normalized.sourceSequenceItemId !== toChunk.sourceSequenceItemIds[0] ||
      normalized.sourceCleanupDecisionId !== fromChunk.sourceCleanupDecisionIds[0] ||
      normalized.sourceCleanupDecisionId !== toChunk.sourceCleanupDecisionIds[0] ||
      normalized.previousSourceEndFrameExclusive !== fromChunk.sourceEndFrameExclusive ||
      normalized.nextSourceStartFrame !== toChunk.sourceStartFrame ||
      normalized.fromSourceSliceKey !== fromChunk.sourceSliceKey ||
      normalized.toSourceSliceKey !== toChunk.sourceSliceKey ||
      normalized.previousSourceEndFrameExclusive !== normalized.nextSourceStartFrame ||
      sliceKeys.has(normalized.fromSourceSliceKey) ||
      normalized.fromSourceSliceKey === normalized.toSourceSliceKey ||
      (expectedFromSliceKey !== undefined &&
        normalized.fromSourceSliceKey !== expectedFromSliceKey)
    ) throw invalid('Long-form source-slice continuity diverges from a chunk boundary.')
    sliceKeys.add(normalized.fromSourceSliceKey)
    expectedFromSliceKey = normalized.toSourceSliceKey
    if (index === value.length - 1) {
      if (sliceKeys.has(normalized.toSourceSliceKey)) {
        throw invalid('Long-form source-slice identities are not unique and ordered.')
      }
      sliceKeys.add(normalized.toSourceSliceKey)
    }
    return normalized
  })
}

function longFormCapacity(value: unknown): {
  profileId: CanonicalPrivateLongFormCapacityProfileId
  minimumFrames: number
  maximumFrames: number
  maximumChunks: number
  maximumChunkFrames: number
} | undefined {
  if (value === CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID) {
    return {
      profileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
      minimumFrames: CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
      maximumFrames: CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
      maximumChunks: CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
      maximumChunkFrames: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
    }
  }
  if (value === CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID) {
    return {
      profileId: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
      minimumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES,
      maximumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES,
      maximumChunks: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS,
      maximumChunkFrames: CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
    }
  }
  return undefined
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
  const result = record(value, label)
  if (Object.keys(result).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return result
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
