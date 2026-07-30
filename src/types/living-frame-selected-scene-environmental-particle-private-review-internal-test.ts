export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_VERSION =
  'living-frame-selected-scene-environmental-particle-private-review-internal-test-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_procedural_particle_review_evidence' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_STATE =
  'selected_scene_particle_private_review_evidence_green_canonical_reconciliation_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_OPEN_GATES = [
  'canonical_scene_evidence_procedural_primitive_discharge_extension_required',
  'canonical_private_review_procedural_timeline_extension_required',
  'canonical_asset_manifest_reconciliation_required',
] as const

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_STATE
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
    readonly sceneQaReportDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
    readonly finalPackagedReviewDigestSha256: string
    readonly privateObjectIdentityHash: string
  }
  readonly privateReviewArtifact: {
    readonly contentType: 'video/mp4'
    readonly byteLength: number
    readonly sha256: string
    readonly privateStreamReopened: true
    readonly fullStreamByteLengthReverified: true
    readonly fullStreamSha256Reverified: true
    readonly rawBytesIncluded: false
    readonly storagePathIncluded: false
  }
  readonly reviewEvidence: {
    readonly selectedSceneLineageRevalidated: true
    readonly masterTimingLineageRevalidated: true
    readonly confirmedOutputFrameLineageRevalidated: true
    readonly exact105FrameMediaQaPassed: true
    readonly proceduralAlphaQaPassed: true
    readonly destinationCompositeQaPassed: true
    readonly captionPlanePriorityPassed: true
    readonly remotionFinalCanvasPassed: true
    readonly privateReviewEvidenceCompiled: true
    readonly privateInternalReviewEvidencePassed: true
  }
  readonly canonicalReviewDisposition: {
    readonly canonicalCompiler:
      'compileCanonicalLivingFramePrivateReviewEvidence'
    readonly canonicalCompilerSupportsStaticRgbaWorkChain: true
    readonly canonicalCompilerSupportsProceduralTimelineWorkChain: false
    readonly sharedInterfaceConflictCode:
      'canonical_private_review_v1_requires_static_sharp_rgba_component_and_has_no_procedural_timeline_artifact_contract'
    readonly canonicalOwnerReconciliationRequired: true
    readonly existingCanonicalPrivateReviewAuthorityRemainsSoleAuthority: true
    readonly noParallelPrivateReviewOwnerCreated: true
  }
  readonly authorityBoundary: {
    readonly privateInternalReviewEvidenceIntegrationAuthority: true
    readonly selectedSceneAuthority: false
    readonly timingAuthority: false
    readonly workGraphAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly externalBetaAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_OPEN_GATES
  readonly fullTimelineReportRevalidated: true
  readonly persistenceReportRevalidated: true
  readonly sceneQaReportRevalidated: true
  readonly privateReviewArtifactLeaseConsumedExactlyOnce: true
  readonly privateInternalParticleSliceEndToEndPassed: true
  readonly assetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly furtherRenderAuthorized: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly containsRenderedVideoBytes: false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment: false
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReport
  extends LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReportDraft {
  readonly reportDigestSha256: string
}
