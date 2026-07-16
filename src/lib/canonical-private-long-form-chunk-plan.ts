import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
} from '../types/canonical-private-composition-capacity'

export interface CanonicalPrivateLongFormSourceSegment {
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
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
  profileId: typeof CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
  totalFrames: number
  chunkCount: number
  chunks: CanonicalPrivateLongFormChunk[]
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
