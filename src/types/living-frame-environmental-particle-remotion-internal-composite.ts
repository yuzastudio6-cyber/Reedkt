export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION =
  'living-frame-environmental-particle-remotion-internal-composite-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_CLASS =
  'actual_private_internal_pixijs_sequence_remotion_composite_qualification' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_STATE =
  'actual_private_internal_composite_green_canonical_release_gates_closed' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_OPEN_GATES = [
  'canonical_selected_scene_profile_and_timing_binding_required',
  'canonical_pixi_operation_registration_required',
  'canonical_time_sampled_overlay_contract_required',
  'canonical_work_graph_and_asset_manifest_binding_required',
  'canonical_attempt_cost_binding_required',
  'canonical_private_artifact_and_review_binding_required',
  'canonical_scene_qa_and_release_evidence_required',
] as const

export type LivingFrameEnvironmentalParticleRemotionInternalCompositeOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_OPEN_GATES)[number]

export interface LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement {
  readonly order: number
  readonly absoluteFrame: number
  readonly expectedActiveParticleCount: number
  readonly sourcePlateVisible: true
  readonly captionPlaneVisibleAboveParticleLayer: true
  readonly particleVisible: boolean
  readonly sampledRgbDigestSha256: string
  readonly renderedParticleCentroid: {
    readonly xNormalized: number | null
    readonly yNormalized: number | null
  }
  readonly expectedAlphaCentroid: {
    readonly xNormalized: number | null
    readonly yNormalized: number | null
  }
  readonly centroidErrorNormalized: number | null
  readonly expectationMatched: true
}

export interface LivingFrameEnvironmentalParticleRemotionInternalCompositeReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_STATE
  readonly qualificationId: string
  readonly sourceBindings: {
    readonly pixiJsRuntimeReportDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly remotionRequestDigestSha256: string
    readonly remotionArtifactDigestSha256: string
  }
  readonly runtimeIdentity: {
    readonly toolId: 'remotion'
    readonly operationId:
      'tool.remotion.render_approved_composition.v1'
    readonly packageName: 'remotion+@remotion/renderer'
    readonly packageVersion: '4.0.487'
    readonly existingCanonicalRuntimeReused: true
    readonly sharedRuntimeSourceMutated: false
    readonly privateServerInjectedStreamingUsed: true
    readonly actualRemotionMediaRenderExecuted: true
  }
  readonly imageEvidence: {
    readonly imageTag: string
    readonly imageId: string
    readonly imageIdentityHash: string
    readonly sourceTreeSha256: string
    readonly imageUser: '10001:10001'
  }
  readonly confinementEvidence: {
    readonly networkMode: 'none'
    readonly readOnlyRootFilesystem: true
    readonly capDropAll: true
    readonly noNewPrivileges: true
    readonly privileged: false
    readonly callerCommandPresent: false
    readonly callerBindsPresent: false
    readonly callerMountsPresent: false
    readonly callerEnvironmentPresent: false
  }
  readonly compositionIdentity: {
    readonly generatedParticleWidthPixels: number
    readonly generatedParticleHeightPixels: number
    readonly internalReviewWidthPixels: 640
    readonly internalReviewHeightPixels: 360
    readonly confirmedOutputRatioPreservedInInternalReview: true
    readonly fps: number
    readonly durationFrames: number
    readonly particleStartFrame: number
    readonly particleEndFrameExclusive: number
    readonly frameImageCount: number
    readonly overlayAdapter:
      'bounded_two_frame_alpha_gate_overlays_v1'
    readonly sourcePolicy:
      'server_derived_static_private_qualification_plate_v1'
    readonly captionPolicy:
      'server_derived_full_frame_rgba_qualification_caption_v1'
    readonly livingFramePolicy:
      'approved_rgba_over_source_below_captions_v1'
    readonly finalCustomerCanvas: false
  }
  readonly frameMeasurements:
    readonly LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement[]
  readonly aggregateMeasurement: {
    readonly exactConfirmedOutputParticleFramesConsumed: true
    readonly confirmedOutputRatioPreservedInInternalReview: true
    readonly exactFpsAndDurationRendered: true
    readonly everyParticleFrameTimeSampled: true
    readonly everyFrameExpectationMatched: true
    readonly firstParticleFrameTransparentInComposite: true
    readonly lastParticleFrameTransparentInComposite: true
    readonly activeParticleFramesVisible: true
    readonly temporalParticleVariationVisible: true
    readonly alphaCentroidMotionPreserved: true
    readonly sourcePlateVisibleAcrossSequence: true
    readonly captionPlaneVisibleAboveParticlesAcrossSequence: true
    readonly remotionSemanticEvidencePassed: true
  }
  readonly authorityBoundary: {
    readonly privateInternalCompositeQualificationAuthority: true
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
    readonly LivingFrameEnvironmentalParticleRemotionInternalCompositeOpenGate[]
  readonly containsRawSourceVideoBytes: false
  readonly containsRawPngBytes: false
  readonly containsRenderedVideoBytes: false
  readonly containsPathUrlCredentialCommandOrEnvironment: false
  readonly selectedSceneBound: false
  readonly canonicalTimingBound: false
  readonly operationRegistered: false
  readonly canonicalDispatchIntegrated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly internalTestReady: true
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleRemotionInternalCompositeReport
  extends LivingFrameEnvironmentalParticleRemotionInternalCompositeReportDraft {
  readonly reportDigestSha256: string
}
