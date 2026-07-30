import type {
  LivingFrameNormalizedPoint,
  LivingFrameNormalizedRect,
} from './living-frame-component-geometry'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityCameraCharacter,
  LivingFrameVisualContinuityColorRole,
  LivingFrameVisualContinuityDepthStyle,
  LivingFrameVisualContinuityDetailDensity,
  LivingFrameVisualContinuityEdgeTreatment,
  LivingFrameVisualContinuityLightingCharacter,
  LivingFrameVisualContinuityLightingDirection,
  LivingFrameVisualContinuityLineLanguage,
  LivingFrameVisualContinuityMotionCharacter,
  LivingFrameVisualContinuityMotionDensity,
  LivingFrameVisualContinuityPaletteMode,
  LivingFrameVisualContinuityTextureTreatment,
} from './living-frame-visual-continuity'

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_VERSION =
  'living-frame-environmental-particle-kernel-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_CLASS =
  'controlled_subject_neutral_typed_particle_profile_and_deterministic_state_kernel_candidate' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_STATE =
  'profile_catalog_and_deterministic_sampling_green_selected_scene_binding_pending' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS = [
  'restrained_airborne_dust_settle_v1',
  'restrained_smoke_rise_v1',
  'restrained_mist_drift_v1',
  'restrained_ember_lift_v1',
  'restrained_rainfall_v1',
  'restrained_snowfall_v1',
  'restrained_water_spray_v1',
] as const

export type LivingFrameEnvironmentalParticleProfileId =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PROFILE_IDS)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EFFECT_FAMILIES = [
  'airborne_dust',
  'rising_smoke',
  'drifting_mist',
  'lifting_embers',
  'rainfall',
  'snowfall',
  'water_spray',
] as const

export type LivingFrameEnvironmentalParticleEffectFamily =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EFFECT_FAMILIES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SHAPES = [
  'soft_circle',
  'soft_streak',
  'soft_flake',
  'soft_spark',
  'soft_droplet',
] as const

export type LivingFrameEnvironmentalParticleShape =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_SHAPES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EMITTER_SHAPES = [
  'area',
  'lower_area',
  'upper_area',
  'line_top',
  'line_bottom',
  'radial_anchor',
] as const

export type LivingFrameEnvironmentalParticleEmitterShape =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_EMITTER_SHAPES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_OPEN_GATES = [
  'canonical_environmental_profile_selection_owner_required',
  'canonical_selected_scene_immutable_profile_ref_required',
  'canonical_master_timing_and_motion_phase_domain_reconciliation_required',
  'canonical_pixi_environmental_operation_extension_required',
  'canonical_transparent_time_sampled_artifact_contract_required',
  'canonical_remotion_time_sampled_overlay_adapter_required',
  'canonical_work_graph_asset_cost_qa_and_private_review_binding_required',
] as const

export type LivingFrameEnvironmentalParticleKernelOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_OPEN_GATES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_ISSUE_CODES = [
  'input_invalid',
  'visual_continuity_pack_invalid',
  'scene_design_sheet_invalid',
  'environment_sheet_invalid',
  'profile_not_allowlisted',
  'motion_budget_invalid',
  'palette_binding_invalid',
  'frame_binding_invalid',
  'deterministic_sequence_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameEnvironmentalParticleKernelIssueCode =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_ISSUE_CODES)[number]

export interface LivingFrameEnvironmentalParticleKernelAuthority {
  readonly typedProfileCatalogAuthority: true
  readonly deterministicSamplingKernelAuthority: true
  readonly selectedSceneAuthority: false
  readonly environmentalProfileSelectionAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly timingAuthority: false
  readonly motionBudgetAuthority: false
  readonly geometryAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolRegistryAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameEnvironmentalParticleKernelFrameBinding {
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly emitterRect: LivingFrameNormalizedRect
  readonly anchorPoint: LivingFrameNormalizedPoint
  readonly confirmedOutputFrameDigestSha256: string
  readonly masterTimingDigestSha256: string
  readonly serverSeedDigestSha256: string
  readonly confirmedOutputFrameRevalidationRequired: true
  readonly masterTimingRevalidationRequired: true
}

export interface LivingFrameEnvironmentalParticleVector {
  readonly x: number
  readonly y: number
}

export interface LivingFrameEnvironmentalParticlePhysics {
  readonly emitterShape:
    LivingFrameEnvironmentalParticleEmitterShape
  readonly directionNormalized:
    LivingFrameEnvironmentalParticleVector
  readonly spreadDegrees: number
  readonly speedNormalizedPerSecond: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly gravityNormalizedPerSecondSquared:
    LivingFrameEnvironmentalParticleVector
  readonly turbulenceNormalized: number
  readonly lifetimeFrames: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly fadeInFraction: number
  readonly fadeOutFraction: number
}

export interface LivingFrameEnvironmentalParticleAppearance {
  readonly particleShape:
    LivingFrameEnvironmentalParticleShape
  readonly radiusNormalized: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly opacity: {
    readonly minimum: number
    readonly maximum: number
  }
  readonly colorId: string
  readonly colorHex: string
  readonly colorRole: LivingFrameVisualContinuityColorRole
  readonly blendMode: 'normal' | 'screen' | 'multiply'
}

export interface LivingFrameEnvironmentalParticleInitialState {
  readonly position: LivingFrameNormalizedPoint
  readonly velocityNormalizedPerSecond:
    LivingFrameEnvironmentalParticleVector
  readonly radiusNormalized: number
  readonly opacity: number
  readonly phaseOffsetRadians: number
}

export interface LivingFrameEnvironmentalParticleFrameState {
  readonly frame: number
  readonly lifeProgressNormalized: number
  readonly position: LivingFrameNormalizedPoint
  readonly radiusNormalized: number
  readonly opacity: number
}

export interface LivingFrameEnvironmentalParticleStateTrack {
  readonly particleId: string
  readonly order: number
  readonly birthFrame: number
  readonly endFrameExclusive: number
  readonly initialState:
    LivingFrameEnvironmentalParticleInitialState
  readonly frameStates:
    readonly LivingFrameEnvironmentalParticleFrameState[]
}

export interface LivingFrameEnvironmentalParticleKernelCandidateDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_CLASS
  readonly candidateState:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_KERNEL_STATE
  readonly kernelCandidateId: string
  readonly sourceBindings: {
    readonly visualContinuityPackDigestSha256: string
    readonly styleBibleDigestSha256: string
    readonly sceneDesignSheetDigestSha256: string
    readonly environmentSheetDigestSha256: string
    readonly motionLanguageSheetDigestSha256: string
    readonly frameBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly serverSeedDigestSha256: string
  }
  readonly profileSelection: {
    readonly profileId:
      LivingFrameEnvironmentalParticleProfileId
    readonly effectFamily:
      LivingFrameEnvironmentalParticleEffectFamily
    readonly allowlistedProfileSelected: true
    readonly selectedByCanonicalOwner: false
    readonly selectedSceneBindingPresent: false
    readonly componentSummaryParsingUsed: false
    readonly componentIdParsingUsed: false
    readonly subjectOrGenreRoutingUsed: false
  }
  readonly visualContinuityBinding: {
    readonly assetTreatment:
      LivingFrameVisualContinuityAssetTreatment
    readonly lineLanguage:
      LivingFrameVisualContinuityLineLanguage
    readonly paletteMode:
      LivingFrameVisualContinuityPaletteMode
    readonly lightingDirection:
      LivingFrameVisualContinuityLightingDirection
    readonly lightingCharacter:
      LivingFrameVisualContinuityLightingCharacter
    readonly edgeTreatment:
      LivingFrameVisualContinuityEdgeTreatment
    readonly textureTreatment:
      LivingFrameVisualContinuityTextureTreatment
    readonly detailDensity:
      LivingFrameVisualContinuityDetailDensity
    readonly depthStyle:
      LivingFrameVisualContinuityDepthStyle
    readonly motionCharacter:
      LivingFrameVisualContinuityMotionCharacter
    readonly motionDensity:
      LivingFrameVisualContinuityMotionDensity
    readonly cameraCharacter:
      LivingFrameVisualContinuityCameraCharacter
    readonly maximumSimultaneousPrimaryMotions: 1
    readonly ambientEffectDoesNotConsumePrimaryMotionSlot: true
    readonly subjectSpecificSummariesEmbedded: false
  }
  readonly exactFrameBinding: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly emitterRect: LivingFrameNormalizedRect
    readonly anchorPoint: LivingFrameNormalizedPoint
  }
  readonly typedProfile: {
    readonly profileId:
      LivingFrameEnvironmentalParticleProfileId
    readonly effectFamily:
      LivingFrameEnvironmentalParticleEffectFamily
    readonly particleCount: number
    readonly motionDensityParticleCap: number
    readonly particleCountWithinMotionBudget: true
    readonly motionBudgetRole: 'ambient'
    readonly oneShotNonLoopingSequence: true
    readonly stillnessOutsideBoundFrameRangeRequired: true
    readonly physics: LivingFrameEnvironmentalParticlePhysics
    readonly appearance:
      LivingFrameEnvironmentalParticleAppearance
  }
  readonly deterministicStateSequence: {
    readonly sequenceId: string
    readonly algorithm:
      'xorshift32_analytic_particle_state_v1'
    readonly particleCount: number
    readonly frameStateCount: number
    readonly stateTracks:
      readonly LivingFrameEnvironmentalParticleStateTrack[]
    readonly sequenceDigestSha256: string
    readonly callerSeedUsed: false
    readonly callerPhysicsOrAppearanceValuesUsed: false
    readonly allBirthFramesWithinBoundRange: true
    readonly allStateFramesWithinBoundRange: true
    readonly allParticlesSettleByEndFrameExclusive: true
    readonly noLoopingState: true
  }
  readonly candidateOperationDisposition: {
    readonly existingToolId: 'pixijs'
    readonly candidateOperationId:
      'tool.pixijs.render_living_frame_environmental_particles.v1'
    readonly separateToolIdentityRequired: false
    readonly operationRegistered: false
    readonly operationDispatchable: false
    readonly remotionRemainsFinalCanvas: true
  }
  readonly openGateCodes:
    readonly LivingFrameEnvironmentalParticleKernelOpenGate[]
  readonly authorityBoundary:
    LivingFrameEnvironmentalParticleKernelAuthority
  readonly selectedSceneBound: false
  readonly canonicalTimingBound: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly rendererMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsExecutableCode: false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly containsSubjectSpecificSummaries: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleKernelCandidate
  extends LivingFrameEnvironmentalParticleKernelCandidateDraft {
  readonly kernelCandidateDigestSha256: string
}

export interface LivingFrameEnvironmentalParticleKernelIssue {
  readonly code:
    LivingFrameEnvironmentalParticleKernelIssueCode
  readonly path: string
}
