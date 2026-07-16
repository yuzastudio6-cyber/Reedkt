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

/**
 * The first snapshot-bound long-form bridge intentionally remains smaller than
 * the product duration contract. It proves ordered chunk render, per-chunk QA,
 * private reconciliation, and one final merge without weakening the direct
 * composition ceilings above.
 */
export const CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID =
  'canonical_private_4k_chunk_merge_1920_frames_v1' as const
export const CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE =
  'private_chunk_merged_source_sequence_caption_4k_delivery_master_v1' as const
export const CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES + 1
export const CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES *
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS
export const CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS =
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS

/**
 * The second private long-form profile adds exact execution slices inside one
 * already-approved source cleanup range. It deliberately remains bounded to
 * sixteen independently rendered and QA-reconciled chunks while the deployed
 * distributed/object-mezzanine path is still unproven.
 */
export const CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID =
  'canonical_private_4k_source_slice_chunk_merge_3840_frames_v2' as const
export const CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES + 1
export const CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS = 16
export const CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES *
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS

/**
 * V3 keeps the exact v2 source-slice planning bounds while replacing the
 * serial full-program Remotion re-render with a separately approved FFmpeg
 * compatibility preflight, H.264 stream-copy mux, and one continuous
 * approved-source audio encode. The profile remains private/local evidence;
 * distributed placement and object-store finalization are separate gates.
 */
export const CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID =
  'canonical_private_4k_source_slice_mezzanine_finalize_3840_frames_v3' as const
export const CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MINIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES
export const CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS =
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS
export const CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES =
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES

export type CanonicalPrivateLongFormCapacityProfileId =
  | typeof CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
  | typeof CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID
  | typeof CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID

export const CANONICAL_PRIVATE_LONG_FORM_CAPACITY = {
  profileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  minimumFrames: CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
  maximumFrames: CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  minimumChunkFrames: CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  maximumChunkFrames: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  maximumChunks: CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
  chunkBoundaryPolicy: 'approved_source_boundaries_only',
  perChunkActualRenderQaReconciliationRequired: true,
  finalMergeActualRenderQaReconciliationRequired: true,
  singleSourceSlicingReady: false,
  distributedObjectMergeReady: false,
} as const

export const CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY = {
  profileId: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  minimumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MINIMUM_FRAMES,
  maximumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES,
  minimumChunkFrames: CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  maximumChunkFrames: CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  maximumChunks: CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS,
  sourceCount: 1,
  chunkBoundaryPolicy: 'continuous_approved_source_slices_only',
  exactSourceFrameLineageRequired: true,
  decoderPrerollAllowedWithoutTimelineFrameDrift: true,
  perChunkActualRenderQaReconciliationRequired: true,
  finalMergeActualRenderQaReconciliationRequired: true,
  sourceSlicePlanningReady: true,
  distributedObjectMergeReady: false,
  professionalScaleReady: false,
} as const

export const CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY = {
  profileId: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  minimumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MINIMUM_FRAMES,
  maximumFrames: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES,
  minimumChunkFrames: CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  maximumChunkFrames: CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  maximumChunks: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS,
  sourceCount: 1,
  chunkBoundaryPolicy: 'continuous_approved_source_slices_only',
  videoFinalizationPolicy: 'compatible_h264_stream_copy_v1',
  audioFinalizationPolicy: 'single_approved_source_audio_encode_v1',
  exactSourceFrameLineageRequired: true,
  exactChunkCodecCompatibilityRequired: true,
  fullProgramVideoReencodeRequired: false,
  perChunkActualRenderQaReconciliationRequired: true,
  finalMuxActualQaReconciliationRequired: true,
  attemptLevelInternalCostEvidenceRequired: true,
  failedStartedAttemptInternalCostPreserved: true,
  originalApprovedFourKEstimateAndReservationReused: true,
  secondExportEstimateOrChargeAllowed: false,
  privateLocalFinalizationReady: true,
  distributedObjectFinalizationReady: false,
  professionalScaleReady: false,
} as const

export const CANONICAL_PRIVATE_COMPOSITION_CAPACITY = {
  profileId: CANONICAL_PRIVATE_COMPOSITION_CAPACITY_PROFILE_ID,
  minimumFrames: CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  maximumSingleSourceFrames: CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  maximumSourceSequenceFrames: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  maximumSourceSequenceItems: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
  maximumHardCuts: CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS,
  longerDurationRequiresChunkRenderQaAndMerge: true,
  longFormProfileId: CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  sourceSliceLongFormProfileId:
    CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  sourceSliceMezzanineProfileId:
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
} as const
