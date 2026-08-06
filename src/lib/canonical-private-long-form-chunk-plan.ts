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
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  type CanonicalPrivateLongFormCapacityProfileId,
} from '../types/canonical-private-composition-capacity'

export interface CanonicalPrivateLongFormSourceSegment {
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
  sourceSliceKey?: string
  sourceSliceIndex?: number
  sourceSliceCount?: number
}

export interface CanonicalPrivateLongFormChunk {
  chunkIndex: number
  chunkCount: number
  outputKey: string
  globalStartFrame: number
  globalEndFrameExclusive: number
  durationFrames: number
  sourceSegments: CanonicalPrivateLongFormSourceSegment[]
}

export interface CanonicalPrivateLongFormChunkPlan {
  profileId: CanonicalPrivateLongFormCapacityProfileId
  totalFrames: number
  chunkCount: number
  chunks: CanonicalPrivateLongFormChunk[]
}

export interface CanonicalPrivateSourceSliceLongFormChunkPlan
  extends CanonicalPrivateLongFormChunkPlan {
  profileId: typeof CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
}

export interface CanonicalPrivateSourceSliceMezzanineChunkPlan
  extends CanonicalPrivateLongFormChunkPlan {
  profileId: typeof CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
}

export type CanonicalPrivateLongFormChunkPlanResult =
  | { ok: true; plan: CanonicalPrivateLongFormChunkPlan }
  | { ok: false; blocker: string }

/**
 * Partitions only on already-approved source boundaries. This first profile
 * deliberately refuses to split one source decision; a later profile must add
 * exact source-slice work items and their own execution evidence.
 */
export function planCanonicalPrivateLongFormChunks(input: {
  totalFrames: number
  sourceSegments: CanonicalPrivateLongFormSourceSegment[]
}): CanonicalPrivateLongFormChunkPlanResult {
  if (
    !Number.isSafeInteger(input.totalFrames) ||
    input.totalFrames < CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES ||
    input.totalFrames > CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES
  ) {
    return {
      ok: false,
      blocker: `The first private long-form profile requires ${CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES} through ${CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES} approved frames.`,
    }
  }
  if (
    input.sourceSegments.length < 2 ||
    input.sourceSegments.length > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS
  ) {
    return {
      ok: false,
      blocker: 'The first private long-form profile requires two through eight ordered approved source ranges.',
    }
  }

  const sourceIds = new Set<string>()
  let expectedTimelineStart = 0
  for (const segment of input.sourceSegments) {
    const sourceDuration = segment.sourceEndFrameExclusive - segment.sourceStartFrame
    const timelineDuration = segment.timelineEndFrameExclusive - segment.timelineStartFrame
    if (
      !segment.sourceSequenceItemId ||
      sourceIds.has(segment.sourceSequenceItemId) ||
      !Number.isSafeInteger(segment.sourceStartFrame) ||
      !Number.isSafeInteger(segment.sourceEndFrameExclusive) ||
      !Number.isSafeInteger(segment.timelineStartFrame) ||
      !Number.isSafeInteger(segment.timelineEndFrameExclusive) ||
      segment.sourceStartFrame < 0 ||
      segment.sourceEndFrameExclusive <= segment.sourceStartFrame ||
      segment.timelineStartFrame !== expectedTimelineStart ||
      segment.timelineEndFrameExclusive <= segment.timelineStartFrame ||
      sourceDuration !== timelineDuration ||
      timelineDuration > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
    ) {
      return {
        ok: false,
        blocker: 'Long-form source ranges must be unique, contiguous, duration preserving, and within the proven source-operation ceiling.',
      }
    }
    sourceIds.add(segment.sourceSequenceItemId)
    expectedTimelineStart = segment.timelineEndFrameExclusive
  }
  if (expectedTimelineStart !== input.totalFrames) {
    return {
      ok: false,
      blocker: 'Long-form source ranges do not cover the complete approved timeline.',
    }
  }

  const boundaries = findChunkBoundaries(input.sourceSegments)
  if (!boundaries || boundaries.length < 2) {
    return {
      ok: false,
      blocker: 'The approved timeline cannot be partitioned into 24-to-480-frame chunks at source boundaries; exact source-slice execution evidence is required.',
    }
  }
  const chunkCount = boundaries.length
  const chunks = boundaries.map(({ startIndex, endIndexExclusive }, chunkOffset) => {
    const globalStartFrame = input.sourceSegments[startIndex]!.timelineStartFrame
    const globalEndFrameExclusive = input.sourceSegments[endIndexExclusive - 1]!
      .timelineEndFrameExclusive
    return {
      chunkIndex: chunkOffset + 1,
      chunkCount,
      outputKey: `composition-chunk-${chunkOffset + 1}-mp4`,
      globalStartFrame,
      globalEndFrameExclusive,
      durationFrames: globalEndFrameExclusive - globalStartFrame,
      sourceSegments: input.sourceSegments
        .slice(startIndex, endIndexExclusive)
        .map((segment) => ({
          ...segment,
          timelineStartFrame: segment.timelineStartFrame - globalStartFrame,
          timelineEndFrameExclusive: segment.timelineEndFrameExclusive - globalStartFrame,
        })),
    }
  })
  return {
    ok: true,
    plan: {
      profileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
      totalFrames: input.totalFrames,
      chunkCount,
      chunks,
    },
  }
}

/**
 * Partitions one approved cleanup range into balanced, frame-exact execution
 * slices. These are technical render boundaries only: they do not create cuts,
 * change the approved source range, or reinterpret timing/meaning.
 */
export function planCanonicalPrivateSourceSliceLongFormChunks(input: {
  totalFrames: number
  sourceSegments: CanonicalPrivateLongFormSourceSegment[]
}): CanonicalPrivateLongFormChunkPlanResult {
  if (
    !Number.isSafeInteger(input.totalFrames) ||
    input.totalFrames < CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES ||
    input.totalFrames > CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES
  ) {
    return {
      ok: false,
      blocker: `The private source-slice profile requires ${CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES} through ${CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES} approved frames.`,
    }
  }
  if (input.sourceSegments.length !== 1) {
    return {
      ok: false,
      blocker: 'The private source-slice profile currently requires exactly one approved source cleanup range.',
    }
  }
  const source = input.sourceSegments[0]!
  const sourceDuration = source.sourceEndFrameExclusive - source.sourceStartFrame
  const timelineDuration = source.timelineEndFrameExclusive - source.timelineStartFrame
  if (
    !source.sourceSequenceItemId ||
    !Number.isSafeInteger(source.sourceStartFrame) ||
    !Number.isSafeInteger(source.sourceEndFrameExclusive) ||
    !Number.isSafeInteger(source.timelineStartFrame) ||
    !Number.isSafeInteger(source.timelineEndFrameExclusive) ||
    source.sourceStartFrame < 0 ||
    source.sourceEndFrameExclusive <= source.sourceStartFrame ||
    source.timelineStartFrame !== 0 ||
    source.timelineEndFrameExclusive !== input.totalFrames ||
    sourceDuration !== timelineDuration ||
    sourceDuration !== input.totalFrames ||
    source.sourceSliceKey !== undefined ||
    source.sourceSliceIndex !== undefined ||
    source.sourceSliceCount !== undefined
  ) {
    return {
      ok: false,
      blocker: 'The source-slice profile requires one exact duration-preserving approved range covering the complete timeline.',
    }
  }

  const chunkCount = Math.ceil(
    input.totalFrames / CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  )
  if (chunkCount < 2 ||
    chunkCount > CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS) {
    return {
      ok: false,
      blocker: 'The source-slice profile cannot represent the approved range inside its fixed chunk ceiling.',
    }
  }
  const baseDuration = Math.floor(input.totalFrames / chunkCount)
  const remainder = input.totalFrames % chunkCount
  if (
    baseDuration < CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES ||
    baseDuration + (remainder > 0 ? 1 : 0) >
      CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
  ) {
    return {
      ok: false,
      blocker: 'The source-slice profile cannot create balanced chunks inside its proven frame limits.',
    }
  }

  let globalStartFrame = 0
  let approvedSourceStartFrame = source.sourceStartFrame
  const chunks: CanonicalPrivateLongFormChunk[] = Array.from(
    { length: chunkCount },
    (_unused, offset) => {
      const durationFrames = baseDuration + (offset < remainder ? 1 : 0)
      const globalEndFrameExclusive = globalStartFrame + durationFrames
      const approvedSourceEndFrameExclusive = approvedSourceStartFrame + durationFrames
      const chunkIndex = offset + 1
      const sourceSliceKey = `source-slice-${chunkIndex}-of-${chunkCount}`
      const chunk: CanonicalPrivateLongFormChunk = {
        chunkIndex,
        chunkCount,
        outputKey: `composition-chunk-${chunkIndex}-mp4`,
        globalStartFrame,
        globalEndFrameExclusive,
        durationFrames,
        sourceSegments: [{
          sourceSequenceItemId: source.sourceSequenceItemId,
          sourceStartFrame: approvedSourceStartFrame,
          sourceEndFrameExclusive: approvedSourceEndFrameExclusive,
          timelineStartFrame: 0,
          timelineEndFrameExclusive: durationFrames,
          sourceSliceKey,
          sourceSliceIndex: chunkIndex,
          sourceSliceCount: chunkCount,
        }],
      }
      globalStartFrame = globalEndFrameExclusive
      approvedSourceStartFrame = approvedSourceEndFrameExclusive
      return chunk
    },
  )
  if (
    globalStartFrame !== input.totalFrames ||
    approvedSourceStartFrame !== source.sourceEndFrameExclusive
  ) {
    return {
      ok: false,
      blocker: 'The source-slice profile failed to conserve exact source and timeline frames.',
    }
  }
  return {
    ok: true,
    plan: {
      profileId: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
      totalFrames: input.totalFrames,
      chunkCount,
      chunks,
    } satisfies CanonicalPrivateSourceSliceLongFormChunkPlan,
  }
}

/**
 * Uses the already-proven exact v2 slice partition while freezing the
 * separately versioned v3 finalization authority into the approved graph.
 */
export function planCanonicalPrivateSourceSliceMezzanineChunks(input: {
  totalFrames: number
  sourceSegments: CanonicalPrivateLongFormSourceSegment[]
}): CanonicalPrivateLongFormChunkPlanResult {
  const planned = planCanonicalPrivateSourceSliceLongFormChunks(input)
  if (!planned.ok) return planned
  return {
    ok: true,
    plan: {
      ...planned.plan,
      profileId: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
    } satisfies CanonicalPrivateSourceSliceMezzanineChunkPlan,
  }
}

function findChunkBoundaries(
  segments: CanonicalPrivateLongFormSourceSegment[],
): Array<{ startIndex: number; endIndexExclusive: number }> | null {
  const memo = new Map<number, Array<{ startIndex: number; endIndexExclusive: number }> | null>()
  const visit = (startIndex: number): Array<{ startIndex: number; endIndexExclusive: number }> | null => {
    if (startIndex === segments.length) return []
    if (memo.has(startIndex)) return memo.get(startIndex) ?? null
    const globalStart = segments[startIndex]!.timelineStartFrame
    for (let endIndexExclusive = segments.length; endIndexExclusive > startIndex; endIndexExclusive -= 1) {
      const globalEnd = segments[endIndexExclusive - 1]!.timelineEndFrameExclusive
      const durationFrames = globalEnd - globalStart
      if (durationFrames > CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES) continue
      if (durationFrames < CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES) break
      const tail = visit(endIndexExclusive)
      if (tail && tail.length + 1 <= CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS) {
        const result = [{ startIndex, endIndexExclusive }, ...tail]
        memo.set(startIndex, result)
        return result
      }
    }
    memo.set(startIndex, null)
    return null
  }
  return visit(0)
}
