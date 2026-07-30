export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_VERSION =
  'living-frame-selected-scene-environmental-particle-scene-qa-internal-test-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_procedural_particle_artifact_and_composite_qa_evidence' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_STATE =
  'selected_scene_particle_private_scene_qa_green_private_review_compilation_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_OPEN_GATES = [
  'canonical_scene_evidence_procedural_primitive_discharge_extension_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_private_review_evidence_compilation_required',
] as const

export interface LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly fullTimelineReportDigestSha256: string
    readonly persistenceReportDigestSha256: string
    readonly selectedSceneInternalTestReportDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly pixiJsRuntimeReportDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
    readonly finalPackagedReviewDigestSha256: string
    readonly privateObjectIdentityHash: string
  }
  readonly artifactIntegrityQa: {
    readonly canonicalPrivateStorageReRead: true
    readonly exactByteLengthVerified: true
    readonly exactSha256Verified: true
    readonly serverInjectedPrivateStreamUsed: true
    readonly rawBytesExcludedFromReport: true
    readonly storagePathExcludedFromReport: true
  }
  readonly persistedMediaQa: {
    readonly toolId: 'ffprobe'
    readonly operationId:
      'tool.ffprobe.inspect_approved_media.v1'
    readonly inspectionProfileId:
      'final_export_v1'
    readonly actualRuntimeExecuted: true
    readonly codecName: 'h264'
    readonly widthPixels: 640
    readonly heightPixels: 360
    readonly fps: 30
    readonly readFrameCount: 105
    readonly pixelFormat: string
    readonly probeEvidenceDigestSha256: string
  }
  readonly proceduralAlphaQa: {
    readonly exactSelectedFrameRangePreserved: true
    readonly everyParticleFrameTimeSampled: true
    readonly everyFrameExpectationMatched: true
    readonly transparentEndpointsVerified: true
    readonly activeParticleFramesVisible: true
    readonly subPerceptualTransitionFramesPreserved: true
    readonly temporalVariationVerified: true
    readonly alphaCentroidMotionVerified: true
    readonly perceptibleParticleFrameCount: number
    readonly subPerceptualTransitionFrameCount: number
  }
  readonly destinationCompositeQa: {
    readonly everyFinalFrameCompositedByRemotion: true
    readonly sourcePlateVisibleAcrossTimeline: true
    readonly captionPlaneVisibleAboveParticlesAcrossTimeline: true
    readonly remotionRemainsFinalCanvas: true
    readonly confirmedOutputRatioPreserved: true
  }
  readonly timingQa: {
    readonly startFrame: 30
    readonly endFrameExclusive: 135
    readonly durationFrames: 105
    readonly fps: 30
    readonly masterTimingLineageRevalidated: true
  }
  readonly sceneEvidenceDisposition: {
    readonly genericSceneEvidencePackageContractVersion:
      'living-frame-scene-evidence-package-v1'
    readonly genericPackageStillMarksProceduralPrimitivePending: true
    readonly actualNamespacedProceduralQaCompleted: true
    readonly sharedInterfaceConflictCode:
      'scene_evidence_v1_has_primitive_expectation_only_no_actual_procedural_qa_discharge'
    readonly canonicalOwnerReconciliationRequired: true
    readonly noParallelSceneEvidenceOwnerCreated: true
  }
  readonly authorityBoundary: {
    readonly privateInternalSceneQaIntegrationAuthority: true
    readonly selectedSceneAuthority: false
    readonly timingAuthority: false
    readonly workGraphAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly externalBetaAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_OPEN_GATES
  readonly fullTimelineReportRevalidated: true
  readonly persistenceReportRevalidated: true
  readonly privatePersistedArtifactLeaseConsumedExactlyOnce: true
  readonly privateInternalSceneQaPassed: true
  readonly canonicalQaApproved: false
  readonly assetManifestMutated: false
  readonly privateReviewEvidenceReady: true
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsRenderedVideoBytes: false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment: false
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport
  extends LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_particle_private_review_artifact_lease_v1'
  readonly leaseId: string
  readonly sceneQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly privateObjectIdentityHash: string
  readonly expectedByteLength: number
  readonly sha256: string
  readonly contentType: 'video/mp4'
  readonly callerSerializable: false
  readonly assetManifestAuthority: false
  readonly canonicalQaApprovalAuthority: false
  readonly privateReviewApprovalAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestExecution {
  readonly report:
    LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport
  readonly privateReviewArtifactLease:
    LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease
}
