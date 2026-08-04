import type {
  LivingFrameGeometryCollisionPolicy,
  LivingFrameGeometryMaskExpectation,
  LivingFrameGeometryOcclusionExpectation,
  LivingFrameGeometrySafeRegion,
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from './living-frame-component-geometry'
import type {
  LivingFrameAlphaSourceExpectation,
  LivingFrameComponentRole,
  LivingFrameDepthBand,
  LivingFrameFocalRole,
  LivingFrameTransparencyExpectation,
} from './living-frame'
import type {
  LivingFrameCompiledMotionTrack,
} from './living-frame-deterministic-motion'
import type {
  LivingFrameSceneArtifactRef,
  LivingFrameSceneContinuityExpectation,
} from './living-frame-scene-evidence-package'

export const LIVING_FRAME_RENDER_PROJECTION_VERSION =
  'living-frame-render-projection-v1' as const

export const LIVING_FRAME_RENDER_PROJECTION_PROFILE =
  'remotion_adapter_candidate_v1' as const

export const LIVING_FRAME_RENDER_PROJECTION_CLASS =
  'controlled_non_executable_renderer_projection_candidate' as const

export const LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES = [
  'opaque_raster_layer',
  'rgba_raster_layer',
  'temporally_masked_raster_layer',
  'temporally_masked_source_layer',
  'procedural_alpha_layer',
  'additive_effect_layer',
] as const
export type LivingFrameProjectedLayerPrimitive =
  (typeof LIVING_FRAME_PROJECTED_LAYER_PRIMITIVES)[number]

export const LIVING_FRAME_RENDER_PROJECTION_STATES = [
  'candidate_pending_canonical_renderer_adapter',
  'blocked_on_primitive_or_depth_qa',
] as const
export type LivingFrameRenderProjectionState =
  (typeof LIVING_FRAME_RENDER_PROJECTION_STATES)[number]

export const LIVING_FRAME_RENDER_PROJECTION_OPEN_GATES = [
  'current_evidence_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_artifact_qa_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_renderer_plan_projection_required',
  'canonical_caption_layering_required',
  'canonical_private_remotion_review_required',
  'procedural_primitive_qa_required',
  'additive_effect_qa_required',
  'depth_transition_compilation_required',
] as const
export type LivingFrameRenderProjectionOpenGate =
  (typeof LIVING_FRAME_RENDER_PROJECTION_OPEN_GATES)[number]

export interface LivingFrameProjectedLayer {
  readonly componentId: string
  readonly projectionOrder: number
  readonly role: LivingFrameComponentRole
  readonly focalRole: LivingFrameFocalRole
  readonly primitive: LivingFrameProjectedLayerPrimitive
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly continuityExpectation: LivingFrameSceneContinuityExpectation
  readonly depthBand: LivingFrameDepthBand
  readonly depthRank: number
  readonly relativeDepthOrder: number
  readonly rect: LivingFrameNormalizedRect
  readonly pivot: LivingFrameNormalizedPoint
  readonly parentComponentId: string | null
  readonly anchorComponentId: string | null
  readonly anchorPoint: LivingFrameNormalizedPoint
  readonly collisionPolicy: LivingFrameGeometryCollisionPolicy
  readonly transparencyExpectation: LivingFrameTransparencyExpectation
  readonly alphaSourceExpectation: LivingFrameAlphaSourceExpectation
  readonly maskExpectation: LivingFrameGeometryMaskExpectation
  readonly motionTracks: readonly LivingFrameCompiledMotionTrack[]
  readonly intersectingSafeRegionIds: readonly string[]
}

export interface LivingFrameProjectedCamera {
  readonly componentId: string
  readonly motionTracks: readonly LivingFrameCompiledMotionTrack[]
}

export interface LivingFrameRenderProjectionMetrics {
  readonly projectedLayerCount: number
  readonly projectedCameraCount: number
  readonly projectedMotionTrackCount: number
  readonly projectedMotionSampleCount: number
  readonly maskedLayerCount: number
  readonly alphaLayerCount: number
  readonly proceduralLayerCount: number
  readonly additiveLayerCount: number
  readonly unresolvedDepthTransitionCount: number
}

export interface LivingFrameRenderProjectionAuthorityBoundary {
  readonly projectionCandidateOnly: true
  readonly rendererPlanAuthority: false
  readonly rendererLayerIdAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactQaAuthority: false
  readonly captionAuthority: false
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
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRenderProjectionDraft {
  readonly contractVersion: typeof LIVING_FRAME_RENDER_PROJECTION_VERSION
  readonly projectionProfile: typeof LIVING_FRAME_RENDER_PROJECTION_PROFILE
  readonly projectionClass: typeof LIVING_FRAME_RENDER_PROJECTION_CLASS
  readonly sceneId: string
  readonly sceneStartFrame: number
  readonly sceneEndFrame: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly outputFrame: {
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly pixelAspectRatioNumerator: number
    readonly pixelAspectRatioDenominator: number
  }
  readonly sourceBindings: {
    readonly motionBundleDigestSha256: string
    readonly componentGeometryBundleDigestSha256: string
    readonly sceneEvidencePackageDigestSha256: string
  }
  readonly projectedLayers: readonly LivingFrameProjectedLayer[]
  readonly projectedCameras: readonly LivingFrameProjectedCamera[]
  readonly safeRegions: readonly LivingFrameGeometrySafeRegion[]
  readonly occlusionExpectations:
    readonly LivingFrameGeometryOcclusionExpectation[]
  readonly captionLayerRequirement: {
    readonly canonicalCaptionLayerMustRemainAboveProjectedComponents: true
    readonly canonicalCaptionSafeRegionsMustBeRevalidated: true
  }
  readonly projectionState: LivingFrameRenderProjectionState
  readonly openGateCodes: readonly LivingFrameRenderProjectionOpenGate[]
  readonly metrics: LivingFrameRenderProjectionMetrics
  readonly authorityBoundary: LivingFrameRenderProjectionAuthorityBoundary
  readonly containsExecutableCodeOrCommands: false
  readonly containsMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolWorkQueueOrAssetManifestRoute: false
  readonly canonicalRendererAdapterStillRequired: true
  readonly remotionExecutionStillForbidden: true
}

export interface LivingFrameRenderProjection
  extends LivingFrameRenderProjectionDraft {
  readonly projectionDigestSha256: string
}
