import type {
  LayerFitMode,
  RendererLayerType,
} from './reeditpro'
import type {
  LivingFrameProjectedLayerPrimitive,
  LivingFrameRenderProjectionState,
} from './living-frame-render-projection'
import type {
  LivingFrameSceneArtifactRef,
} from './living-frame-scene-evidence-package'

export const LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION =
  'living-frame-renderer-plan-binding-v1' as const

export const LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS =
  'controlled_non_executable_existing_renderer_plan_binding_candidate' as const

export const LIVING_FRAME_RENDERER_PLAN_BINDING_STATES = [
  'candidate_pending_canonical_snapshot_projection',
  'blocked_by_living_frame_projection_gates',
] as const
export type LivingFrameRendererPlanBindingState =
  (typeof LIVING_FRAME_RENDERER_PLAN_BINDING_STATES)[number]

export const LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES = [
  'current_renderer_plan_reread_required',
  'current_living_frame_projection_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_renderer_layer_id_admission_required',
  'canonical_renderer_layer_extension_required',
  'canonical_caption_layering_revalidation_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_work_graph_projection_required',
  'canonical_artifact_qa_required',
  'canonical_private_remotion_review_required',
  'living_frame_projection_blockers_must_resolve',
] as const
export type LivingFrameRendererPlanBindingOpenGate =
  (typeof LIVING_FRAME_RENDERER_PLAN_BINDING_OPEN_GATES)[number]

export interface LivingFrameRendererLayerBindingDraft {
  readonly order: number
  readonly projectedComponentId: string
  readonly rendererLayerId: string
}

export interface LivingFrameRendererLayerBinding {
  readonly order: number
  readonly projectedComponentId: string
  readonly rendererLayerId: string
  readonly rendererLayerType: RendererLayerType
  readonly fitMode: LayerFitMode
  readonly zIndex: number
  readonly primitive: LivingFrameProjectedLayerPrimitive
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly motionTrackIds: readonly string[]
  readonly motionSampleCount: number
  readonly zonePixels: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}

export interface LivingFrameRendererCameraBinding {
  readonly projectedComponentId: string
  readonly motionTrackIds: readonly string[]
  readonly motionSampleCount: number
}

export interface LivingFrameRendererPlanBindingMetrics {
  readonly projectedLayerBindingCount: number
  readonly projectedCameraBindingCount: number
  readonly projectedMotionTrackCount: number
  readonly projectedMotionSampleCount: number
  readonly captionLayerCount: number
  readonly unresolvedProjectionGateCount: number
}

export interface LivingFrameRendererPlanBindingAuthorityBoundary {
  readonly bindingCandidateOnly: true
  readonly rendererPlanAuthority: false
  readonly rendererLayerIdAuthority: false
  readonly rendererLayerMutationAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactQaAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRendererPlanBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_RENDERER_PLAN_BINDING_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_RENDERER_PLAN_BINDING_CLASS
  readonly sceneId: string
  readonly sourceBindings: {
    readonly livingFrameProjectionDigestSha256: string
    readonly deterministicMotionBundleDigestSha256: string
    readonly rendererCompositionPlanId: string
    readonly rendererCompositionPlanDigestSha256: string
    readonly masterTimingPlanId: string
    readonly masterTimingPlanDigestSha256: string
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
  }
  readonly projectionState: LivingFrameRenderProjectionState
  readonly layerBindings: readonly LivingFrameRendererLayerBinding[]
  readonly cameraBindings: readonly LivingFrameRendererCameraBinding[]
  readonly captionLayerIds: readonly string[]
  readonly bindingState: LivingFrameRendererPlanBindingState
  readonly openGateCodes:
    readonly LivingFrameRendererPlanBindingOpenGate[]
  readonly metrics: LivingFrameRendererPlanBindingMetrics
  readonly authorityBoundary:
    LivingFrameRendererPlanBindingAuthorityBoundary
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolWorkQueueOrCostRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly existingRendererCompositionPlanRemainsAuthority: true
  readonly canonicalSnapshotAdapterStillRequired: true
  readonly remotionExecutionStillForbidden: true
}

export interface LivingFrameRendererPlanBinding
  extends LivingFrameRendererPlanBindingDraft {
  readonly bindingDigestSha256: string
}
