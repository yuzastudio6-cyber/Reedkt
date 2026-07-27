import type {
  LivingFrameAlphaSourceExpectation,
  LivingFrameComponentRole,
  LivingFrameDepthBand,
  LivingFrameFocalRole,
  LivingFrameTransparencyExpectation,
} from './living-frame'
import type {
  LivingFrameGeometryComponentKind,
  LivingFrameGeometryMaskExpectation,
  LivingFrameGeometryOcclusionKind,
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from './living-frame-component-geometry'
import type {
  LivingFrameMotionProperty,
  LivingFrameMotionTrackRole,
} from './living-frame-deterministic-motion'

export const LIVING_FRAME_COMPONENT_RIG_VERSION =
  'living-frame-component-rig-v1' as const

export const LIVING_FRAME_COMPONENT_RIG_PROFILE =
  'deterministic_component_hierarchy_v1' as const

export const LIVING_FRAME_COMPONENT_RIG_CLASS =
  'controlled_non_promotable_component_rig_spec' as const

export const LIVING_FRAME_RIG_NODE_KINDS = [
  'static_visual',
  'animated_visual',
  'virtual_camera',
] as const
export type LivingFrameRigNodeKind =
  (typeof LIVING_FRAME_RIG_NODE_KINDS)[number]

export interface LivingFrameRigSourceBindings {
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly geometryBundleDigestSha256: string
  readonly motionBundleDigestSha256: string
}

export interface LivingFrameRigMotionTrackBinding {
  readonly order: number
  readonly trackId: string
  readonly property: LivingFrameMotionProperty
  readonly role: LivingFrameMotionTrackRole
  readonly firstFrame: number
  readonly lastFrame: number
}

export interface LivingFrameRigNode {
  readonly order: number
  readonly componentId: string
  readonly nodeKind: LivingFrameRigNodeKind
  readonly geometryKind: LivingFrameGeometryComponentKind
  readonly role: LivingFrameComponentRole | 'virtual_camera'
  readonly focalRole: LivingFrameFocalRole
  readonly depthBand: LivingFrameDepthBand | null
  readonly depthRank: number | null
  readonly relativeDepthOrder: number | null
  readonly rect: LivingFrameNormalizedRect | null
  readonly pivot: LivingFrameNormalizedPoint | null
  readonly parentNodeId: string | null
  readonly anchorNodeId: string | null
  readonly anchorPoint: LivingFrameNormalizedPoint | null
  readonly dependencyNodeIds: readonly string[]
  readonly transparencyExpectation:
    LivingFrameTransparencyExpectation | null
  readonly alphaSourceExpectation: LivingFrameAlphaSourceExpectation | null
  readonly maskExpectation: LivingFrameGeometryMaskExpectation | null
  readonly motionTracks: readonly LivingFrameRigMotionTrackBinding[]
}

export interface LivingFrameRigOcclusionRelation {
  readonly order: number
  readonly relationId: string
  readonly kind: LivingFrameGeometryOcclusionKind
  readonly foregroundNodeId: string
  readonly backgroundNodeId: string
  readonly downstreamDepthTransitionCompilationRequired: boolean
}

export interface LivingFrameRigArtifactExpectation {
  readonly workItemTypeExpectation: 'build_component_rig'
  readonly artifactTypeExpectation:
    'living_frame_component_rig_spec_json'
  readonly assetRoleExpectation: 'processed'
  readonly contentTypeExpectation: 'application/json'
  readonly canonicalWorkItemCreationStillRequired: true
  readonly canonicalAssetManifestEntryStillRequired: true
  readonly canonicalArtifactQaStillRequired: true
}

export interface LivingFrameComponentRigMetrics {
  readonly nodeCount: number
  readonly rootNodeCount: number
  readonly staticVisualNodeCount: number
  readonly animatedVisualNodeCount: number
  readonly virtualCameraNodeCount: number
  readonly motionTrackBindingCount: number
  readonly occlusionRelationCount: number
  readonly focalPrimaryCount: 1
}

export interface LivingFrameComponentRigAuthorityBoundary {
  readonly deterministicRigCompilationOnly: true
  readonly selectedSceneAuthority: false
  readonly outputFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComponentRigSpecDraft {
  readonly contractVersion: typeof LIVING_FRAME_COMPONENT_RIG_VERSION
  readonly rigProfile: typeof LIVING_FRAME_COMPONENT_RIG_PROFILE
  readonly rigClass: typeof LIVING_FRAME_COMPONENT_RIG_CLASS
  readonly sourceBindings: LivingFrameRigSourceBindings
  readonly nodes: readonly LivingFrameRigNode[]
  readonly rootNodeIds: readonly string[]
  readonly topologicalNodeIds: readonly string[]
  readonly occlusionRelations: readonly LivingFrameRigOcclusionRelation[]
  readonly artifactExpectation: LivingFrameRigArtifactExpectation
  readonly metrics: LivingFrameComponentRigMetrics
  readonly authorityBoundary: LivingFrameComponentRigAuthorityBoundary
  readonly containsExecutableCodeOrCommands: false
  readonly containsProviderToolOrDispatchRoute: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly currentSourceLineageRevalidationStillRequired: true
  readonly canonicalWorkAndAssetAdmissionStillRequired: true
}

export interface LivingFrameComponentRigSpec
  extends LivingFrameComponentRigSpecDraft {
  readonly rigDigestSha256: string
}
