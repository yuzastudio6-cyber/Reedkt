import type {
  LivingFrameEnvironmentalParticleProfileId,
} from './living-frame-environmental-particle-kernel'
import type {
  LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease,
} from './living-frame-environmental-particle-pixijs-internal-runtime'

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION =
  'living-frame-selected-scene-environmental-particle-internal-test-v1' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_full_range_pixijs_sequence_qualification' as const

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_STATE =
  'selected_scene_full_particle_range_executed_remotion_timeline_pending' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_PROFILE_BINDING_IDS = [
  'internal-test.environmental-particle.restrained-airborne-dust-settle.v1',
] as const

export type LivingFrameEnvironmentalParticleInternalTestProfileBindingId =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_PROFILE_BINDING_IDS)[number]

export const LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_OPEN_GATES = [
  'full_duration_remotion_time_sampled_composite_required',
  'canonical_work_asset_persistence_binding_required',
  'canonical_scene_qa_and_private_review_binding_required',
] as const

export type LivingFrameSelectedSceneEnvironmentalParticleInternalTestOpenGate =
  (typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_OPEN_GATES)[number]

export interface LivingFrameSelectedSceneEnvironmentalParticleInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly environmentalAdmissionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly livingFrameComponentDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly kernelCandidateDigestSha256: string
    readonly materializationDigestSha256: string
    readonly pixiJsRuntimeReportDigestSha256: string
    readonly pixiJsSequenceDigestSha256: string
  }
  readonly explicitInternalProfileBinding: {
    readonly profileBindingId:
      LivingFrameEnvironmentalParticleInternalTestProfileBindingId
    readonly profileId: LivingFrameEnvironmentalParticleProfileId
    readonly source:
      'server_owned_private_internal_test_profile_binding_v1'
    readonly componentSummaryParsingUsed: false
    readonly componentIdParsingUsed: false
    readonly subjectOrGenreRoutingUsed: false
    readonly canonicalProfileSelectionAuthority: false
    readonly productionProfileSelectionAuthority: false
  }
  readonly visualContinuityBinding: {
    readonly sceneDesignSheetId: string
    readonly environmentSheetId: string
    readonly selectedSceneModeMatchesContinuitySceneMode: true
    readonly workspaceProjectEditSessionMatch: true
    readonly outputFrameDigestMatches: true
    readonly selectedComponentDigestMatches: true
  }
  readonly exactExecutionRange: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly firstAndLastFramesTransparent: true
    readonly allFramesEmitted: true
    readonly temporalVariationPresent: true
    readonly alphaCentroidMovementPresent: true
  }
  readonly runtimeIdentity: {
    readonly toolId: 'pixijs'
    readonly operationId:
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly actualPackageEntrypointExecuted: true
    readonly oneRequestOneAttemptVerified: true
    readonly exactSelectedSceneFrameRangeExecuted: true
  }
  readonly authorityBoundary: {
    readonly privateInternalSelectedSceneQualificationAuthority: true
    readonly selectedSceneSelectionAuthority: false
    readonly environmentalProfileSelectionAuthority: false
    readonly timingMutationAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly assetManifestAuthority: false
    readonly rendererAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly externalBetaAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    readonly LivingFrameSelectedSceneEnvironmentalParticleInternalTestOpenGate[]
  readonly selectedSceneBound: true
  readonly canonicalTimingBound: true
  readonly fullSelectedEnvironmentalRangeExecuted: true
  readonly remotionCompositeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsRawPngBytes: false
  readonly containsRawChatTranscriptMediaPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly internalTestReadyForRemotion: true
  readonly externalBetaReady: false
  readonly productionReady: false
}

export interface LivingFrameSelectedSceneEnvironmentalParticleInternalTestReport
  extends LivingFrameSelectedSceneEnvironmentalParticleInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameSelectedSceneEnvironmentalParticleInternalTestExecution {
  readonly report:
    LivingFrameSelectedSceneEnvironmentalParticleInternalTestReport
  readonly privateSequenceOutputLease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
}
