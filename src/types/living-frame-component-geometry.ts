import type {
  LivingFrameAlphaSourceExpectation,
  LivingFrameComponentRole,
  LivingFrameDepthBand,
  LivingFrameFocalRole,
  LivingFrameTransparencyExpectation,
} from './living-frame'

export const LIVING_FRAME_COMPONENT_GEOMETRY_VERSION =
  'living-frame-component-geometry-v1' as const

export const LIVING_FRAME_COMPONENT_GEOMETRY_PROFILE =
  'normalized_component_depth_graph_v1' as const

export const LIVING_FRAME_COMPONENT_GEOMETRY_CLASS =
  'controlled_non_promotable_component_geometry_bundle' as const

export const LIVING_FRAME_GEOMETRY_COMPONENT_KINDS = [
  'visual_component',
  'virtual_camera',
] as const
export type LivingFrameGeometryComponentKind =
  (typeof LIVING_FRAME_GEOMETRY_COMPONENT_KINDS)[number]

export const LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS = [
  'caption',
  'face',
  'gesture',
  'contact_object',
  'source_text',
  'map_label',
  'data_label',
] as const
export type LivingFrameGeometrySafeRegionKind =
  (typeof LIVING_FRAME_GEOMETRY_SAFE_REGION_KINDS)[number]

export const LIVING_FRAME_GEOMETRY_COLLISION_POLICIES = [
  'base_layer_coverage',
  'avoid_all_protected_regions',
  'contact_region_overlap_only',
  'no_surface',
] as const
export type LivingFrameGeometryCollisionPolicy =
  (typeof LIVING_FRAME_GEOMETRY_COLLISION_POLICIES)[number]

export const LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS = [
  'opaque',
  'still_alpha_artifact_required',
  'temporal_mask_artifact_required',
  'procedural_alpha_artifact_required',
  'additive_effect_artifact_required',
] as const
export type LivingFrameGeometryMaskExpectation =
  (typeof LIVING_FRAME_GEOMETRY_MASK_EXPECTATIONS)[number]

export const LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS = [
  'in_front_of',
  'contact_preserves_foreground',
  'depth_transition_required',
] as const
export type LivingFrameGeometryOcclusionKind =
  (typeof LIVING_FRAME_GEOMETRY_OCCLUSION_KINDS)[number]

export interface LivingFrameNormalizedPoint {
  readonly x: number
  readonly y: number
}

export interface LivingFrameNormalizedRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface LivingFrameGeometryExpectationRef {
  readonly refId: string
  readonly version: string
  readonly digestSha256: string
  readonly currentAuthorityRevalidationRequired: true
}

export interface LivingFrameGeometryOutputFrameExpectation {
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly pixelAspectRatioNumerator: number
  readonly pixelAspectRatioDenominator: number
  readonly confirmedOutputFrameRevalidationRequired: true
}

export interface LivingFrameGeometryMotionBinding {
  readonly motionBundleDigestSha256: string
  readonly motionBundleClass: 'controlled_non_promotable_motion_sample_bundle'
  readonly motionSceneId: string
  readonly motionComponentIds: readonly string[]
  readonly motionTracks: readonly {
    readonly trackId: string
    readonly componentId: string
  }[]
  readonly canonicalTimingRevalidationRequired: true
}

export interface LivingFrameGeometrySafeRegion {
  readonly regionId: string
  readonly order: number
  readonly kind: LivingFrameGeometrySafeRegionKind
  readonly rect: LivingFrameNormalizedRect
  readonly evidenceRef: LivingFrameGeometryExpectationRef
}

export interface LivingFrameGeometryComponentDraft {
  readonly componentId: string
  readonly order: number
  readonly kind: LivingFrameGeometryComponentKind
  readonly role: LivingFrameComponentRole | 'virtual_camera'
  readonly focalRole: LivingFrameFocalRole
  readonly depthBand: LivingFrameDepthBand | null
  readonly rect: LivingFrameNormalizedRect | null
  readonly pivot: LivingFrameNormalizedPoint | null
  readonly parentComponentId: string | null
  readonly anchorComponentId: string | null
  readonly anchorPoint: LivingFrameNormalizedPoint | null
  readonly collisionPolicy: LivingFrameGeometryCollisionPolicy
  readonly transparencyExpectation: LivingFrameTransparencyExpectation | null
  readonly alphaSourceExpectation: LivingFrameAlphaSourceExpectation | null
  readonly maskExpectation: LivingFrameGeometryMaskExpectation | null
}

export interface LivingFrameCompiledGeometryComponent
  extends LivingFrameGeometryComponentDraft {
  readonly depthRank: number | null
  readonly relativeDepthOrder: number | null
  readonly linkedMotionTrackIds: readonly string[]
  readonly intersectingSafeRegionIds: readonly string[]
}

export interface LivingFrameGeometryOcclusionExpectation {
  readonly relationId: string
  readonly order: number
  readonly kind: LivingFrameGeometryOcclusionKind
  readonly foregroundComponentId: string
  readonly backgroundComponentId: string
  readonly downstreamDepthTransitionCompilationRequired: boolean
}

export interface LivingFrameGeometryMetrics {
  readonly componentCount: number
  readonly visualComponentCount: number
  readonly motionBoundComponentCount: number
  readonly staticComponentCount: number
  readonly safeRegionCount: number
  readonly occlusionExpectationCount: number
  readonly unresolvedDepthTransitionCount: number
  readonly protectedCollisionCount: 0
  readonly focalPrimaryCount: 1
}

export interface LivingFrameComponentGeometryAuthorityBoundary {
  readonly deterministicGeometryCompilationOnly: true
  readonly outputFrameAuthority: false
  readonly layoutPlanningAuthority: false
  readonly depthEvidenceAuthority: false
  readonly maskEvidenceAuthority: false
  readonly alphaQaAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComponentGeometryBundleDraft {
  readonly contractVersion: typeof LIVING_FRAME_COMPONENT_GEOMETRY_VERSION
  readonly geometryProfile: typeof LIVING_FRAME_COMPONENT_GEOMETRY_PROFILE
  readonly bundleClass: typeof LIVING_FRAME_COMPONENT_GEOMETRY_CLASS
  readonly outputFrameExpectation: LivingFrameGeometryOutputFrameExpectation
  readonly motionBinding: LivingFrameGeometryMotionBinding
  readonly safeRegions: readonly LivingFrameGeometrySafeRegion[]
  readonly components: readonly LivingFrameCompiledGeometryComponent[]
  readonly occlusionExpectations:
    readonly LivingFrameGeometryOcclusionExpectation[]
  readonly relativeDepthOrderComponentIds: readonly string[]
  readonly metrics: LivingFrameGeometryMetrics
  readonly authorityBoundary: LivingFrameComponentGeometryAuthorityBoundary
  readonly containsMediaOrRawInstructions: false
  readonly containsProviderToolOrWorkRoute: false
  readonly currentSafeRegionEvidenceRevalidationStillRequired: true
  readonly currentAlphaAndMaskEvidenceStillRequired: true
  readonly canonicalRendererProjectionStillRequired: true
}

export interface LivingFrameComponentGeometryBundle
  extends LivingFrameComponentGeometryBundleDraft {
  readonly bundleDigestSha256: string
}
