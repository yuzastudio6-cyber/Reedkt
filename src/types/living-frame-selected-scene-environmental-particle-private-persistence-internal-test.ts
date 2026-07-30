export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION =
  'living-frame-selected-scene-environmental-particle-private-persistence-internal-test-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_particle_remotion_create_only_persistence_evidence' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE =
  'selected_scene_particle_remotion_review_persisted_scene_qa_and_review_pending' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_OPEN_GATES = [
  'canonical_asset_manifest_reconciliation_required',
  'canonical_scene_evidence_qa_required',
  'canonical_private_review_required',
] as const

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE
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
    readonly selectedSceneInternalTestReportDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly pixiJsRuntimeReportDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
    readonly finalPackagedReviewDigestSha256: string
  }
  readonly persistedArtifact: {
    readonly storageOwner:
      'persistCanonicalPrivateRemotionArtifactStream'
    readonly inspectionOwner:
      'inspectCanonicalPrivateRemotionArtifact'
    readonly contentType: 'video/mp4'
    readonly privateObjectIdentityHash: string
    readonly byteLength: number
    readonly sha256: string
    readonly createOnlyPersistenceUsed: true
    readonly exactStreamCommitmentVerified: true
    readonly exactReadbackVerified: true
    readonly replayedExistingArtifact: false
    readonly storagePathIncluded: false
    readonly rawBytesIncluded: false
  }
  readonly authorityBoundary: {
    readonly privateInternalPersistenceIntegrationAuthority: true
    readonly selectedSceneAuthority: false
    readonly timingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly externalBetaAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_OPEN_GATES
  readonly fullTimelineReportRevalidated: true
  readonly privateOutputLeaseConsumedExactlyOnce: true
  readonly artifactPersisted: true
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsRenderedVideoBytes: false
  readonly containsStoragePathUrlCredentialCommandOrEnvironment: false
  readonly internalTestReadyForSceneEvidenceAndPrivateReview: true
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport
  extends LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_particle_persisted_artifact_lease_v1'
  readonly leaseId: string
  readonly persistenceReportDigestSha256: string
  readonly privateObjectIdentityHash: string
  readonly expectedByteLength: number
  readonly sha256: string
  readonly contentType: 'video/mp4'
  readonly callerSerializable: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestExecution {
  readonly report:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport
  readonly privatePersistedArtifactLease:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease
}
