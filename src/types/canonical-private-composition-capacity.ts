/**
 * Versioned, evidence-bound limits for the current private canonical Remotion
 * bridge. These are execution limits, not ReEditPro product-duration limits.
 * Longer edits remain blocked until snapshot-bound chunk render, QA, and merge
 * evidence exists.
 */
export const CANONICAL_PRIVATE_COMPOSITION_CAPACITY_PROFILE_ID =
  'canonical_private_4k_source_sequence_480_frames_v1' as const

export const CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES = 24
export const CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES = 240
export const CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES = 480
export const CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS = 8
export const CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS =
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS - 1

export const CANONICAL_PRIVATE_COMPOSITION_CAPACITY = {
  profileId: CANONICAL_PRIVATE_COMPOSITION_CAPACITY_PROFILE_ID,
  minimumFrames: CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  maximumSingleSourceFrames: CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  maximumSourceSequenceFrames: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  maximumSourceSequenceItems: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
  maximumHardCuts: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS,
  longerDurationRequiresChunkRenderQaAndMerge: true,
} as const
