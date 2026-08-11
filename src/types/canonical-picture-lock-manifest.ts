export const CANONICAL_PICTURE_LOCK_MANIFEST_VERSION =
  'canonical-picture-lock-manifest-v1' as const

export interface CanonicalPictureLockRef {
  id: string
  version: string
  contentHash: string
}

export type CanonicalPictureLockDependencyCode =
  | 'timeline'
  | 'source_ranges'
  | 'shot_order'
  | 'shot_durations'
  | 'speed_changes'
  | 'transitions'
  | 'master_timing'
  | 'confirmed_output_frame'
  | 'crop_reframe'
  | 'broll_layout'
  | 'living_frame_layout'
  | 'graphics_maps_charts'
  | 'lower_thirds'
  | 'mask_tracking_anchor'
  | 'occupancy'
  | 'near_final_visual_proxy'
  | 'color_look'
  | 'source_asset_manifest'
  | 'renderer_plan'

export interface CanonicalPictureLockManifest {
  schemaVersion: typeof CANONICAL_PICTURE_LOCK_MANIFEST_VERSION
  manifestId: string
  manifestDigestSha256: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planVersionId: string
    approvedSnapshotRef: CanonicalPictureLockRef
  }
  confirmedOutputFrame: {
    outputId: string
    width: number
    height: number
    aspectRatioNumerator: number
    aspectRatioDenominator: number
    fpsNumerator: number
    fpsDenominator: number
    totalFrames: number
    confirmedOutputFrameDigestSha256: string
  }
  timelineBindings: {
    timelineVersionRef: CanonicalPictureLockRef
    sourceRangesRef: CanonicalPictureLockRef
    shotOrderRef: CanonicalPictureLockRef
    shotDurationsRef: CanonicalPictureLockRef
    speedChangesRef: CanonicalPictureLockRef
    transitionsRef: CanonicalPictureLockRef
    masterTimingRef: CanonicalPictureLockRef
  }
  compositionBindings: {
    cropReframeRef: CanonicalPictureLockRef
    brollLayoutRef: CanonicalPictureLockRef
    livingFrameLayoutRef: CanonicalPictureLockRef
    graphicsMapsChartsRef: CanonicalPictureLockRef
    lowerThirdsRef: CanonicalPictureLockRef
    maskTrackingAnchorRef: CanonicalPictureLockRef
    occupancyRef: CanonicalPictureLockRef
    nearFinalVisualProxyRef: CanonicalPictureLockRef
    colorLookRef: CanonicalPictureLockRef
    rendererPlanRef: CanonicalPictureLockRef
  }
  sourceAssetManifestRef: CanonicalPictureLockRef
  lockedSceneIds: string[]
  lockState: 'locked' | 'locked_with_approved_exceptions'
  approvedExceptions: Array<{
    exceptionId: string
    dependencyCode: CanonicalPictureLockDependencyCode
    affectedSceneIds: string[]
    reasonCode: string
    approvalRef: CanonicalPictureLockRef
  }>
  lockedAt: string
  lockedByRef: CanonicalPictureLockRef
  immutable: true
  sharedEditArchitectureOwner: 'canonical_edit_picture_lock'
  captionOwnsPictureLock: false
  rawChatIncluded: false
  mediaBytesIncluded: false
  privateArtifact: true
  publicDeliveryAuthorityClaimed: false
  productionAuthorityClaimed: false
}
