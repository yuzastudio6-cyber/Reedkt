import type {
  LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement,
} from './living-frame-environmental-particle-remotion-internal-composite'

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION =
  'living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_full_particle_timeline_remotion_composite_qualification' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_STATE =
  'selected_scene_full_particle_timeline_remotion_composite_green_persistence_and_review_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_OPEN_GATES = [
  'canonical_work_asset_persistence_binding_required',
  'canonical_scene_qa_and_private_review_binding_required',
] as const

export type LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestOpenGate =
  (typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_OPEN_GATES)[number]

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineChunk {
  readonly order: number
  readonly sourceStartFrame: number
  readonly sourceEndFrameExclusive: number
  readonly sourceFrameCount: number
  readonly localRenderedDurationFrames: 24
  readonly localOverlayCount: number
  readonly maximumCanonicalOverlayCount: 16
  readonly remotionRequestDigestSha256: string
  readonly remotionArtifactDigestSha256: string
  readonly exactSourceFramesRetainedDuringPackaging: true
  readonly fillerFramesDiscardedDuringPackaging: number
}

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneInternalTestReportDigestSha256: string
    readonly environmentalAdmissionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly livingFrameComponentDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly pixiJsRuntimeReportDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
    readonly finalPackagedReviewDigestSha256: string
  }
  readonly compositionIdentity: {
    readonly sourceParticleWidthPixels: number
    readonly sourceParticleHeightPixels: number
    readonly internalReviewWidthPixels: 640
    readonly internalReviewHeightPixels: 360
    readonly confirmedOutputRatioPreserved: true
    readonly fps: 30
    readonly selectedStartFrame: number
    readonly selectedEndFrameExclusive: number
    readonly selectedDurationFrames: number
    readonly finalReviewDurationFrames: number
    readonly finalPackagedReviewByteLength: number
    readonly frameImageCount: number
    readonly remotionChunkCount: number
    readonly maximumOverlaysPerChunk: 16
    readonly localMinimumRenderDurationFrames: 24
    readonly overlayAdapter:
      'bounded_remotion_chunks_with_exact_frame_packaging_v1'
    readonly packagingTool: 'ffmpeg'
    readonly packagingOnly: true
    readonly everyFinalFrameCompositedByRemotion: true
    readonly remotionRemainsFinalCanvas: true
    readonly finalCustomerCanvas: false
  }
  readonly chunkReceipts:
    readonly LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineChunk[]
  readonly frameMeasurements:
    readonly LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement[]
  readonly aggregateMeasurement: {
    readonly exactSelectedSceneParticleFramesConsumed: true
    readonly exactSelectedSceneFrameRangePreserved: true
    readonly exactFpsAndDurationRendered: true
    readonly everyParticleFrameTimeSampled: true
    readonly everyFrameExpectationMatched: true
    readonly firstParticleFrameTransparentInComposite: true
    readonly lastParticleFrameTransparentInComposite: true
    readonly activeParticleFramesVisible: true
    readonly perceptibleParticleFrameCount: number
    readonly subPerceptualTransitionFrameCount: number
    readonly subPerceptualTransitionFramesPreserved: true
    readonly temporalParticleVariationVisible: true
    readonly alphaCentroidMotionPreserved: true
    readonly sourcePlateVisibleAcrossTimeline: true
    readonly captionPlaneVisibleAboveParticlesAcrossTimeline: true
    readonly allChunkSemanticEvidencePassed: true
    readonly finalPackagedReviewIndependentlyProbed: true
  }
  readonly runtimeIdentity: {
    readonly toolId: 'remotion'
    readonly operationId:
      'tool.remotion.render_approved_composition.v1'
    readonly packageName: 'remotion+@remotion/renderer'
    readonly packageVersion: '4.0.487'
    readonly actualRemotionRenderCount: number
    readonly sharedRuntimeSourceMutated: false
    readonly existingCanonicalRuntimeReused: true
  }
  readonly authorityBoundary: {
    readonly privateInternalFullTimelineQualificationAuthority: true
    readonly selectedSceneAuthority: false
    readonly timingAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly assetManifestAuthority: false
    readonly finalRendererAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly externalBetaAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    readonly LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestOpenGate[]
  readonly selectedSceneBound: true
  readonly canonicalTimingBound: true
  readonly fullSelectedEnvironmentalRangeComposited: true
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsRawSourceVideoBytes: false
  readonly containsRawPngBytes: false
  readonly containsRenderedVideoBytes: false
  readonly containsPathUrlCredentialCommandOrEnvironment: false
  readonly internalTestReadyForPersistenceAndReview: true
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  extends LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_particle_remotion_private_review_output_lease_v1'
  readonly leaseId: string
  readonly reportDigestSha256: string
  readonly finalPackagedReviewDigestSha256: string
  readonly expectedByteLength: number
  readonly contentType: 'video/mp4'
  readonly callerSerializable: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestExecution {
  readonly report:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  readonly privateReviewOutputLease:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease
}
