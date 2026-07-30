import type {
  LivingFrameEnvironmentalParticleAppearance,
  LivingFrameEnvironmentalParticleEffectFamily,
  LivingFrameEnvironmentalParticlePhysics,
  LivingFrameEnvironmentalParticleProfileId,
  LivingFrameEnvironmentalParticleStateTrack,
} from './living-frame-environmental-particle-kernel'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityDepthStyle,
  LivingFrameVisualContinuityMotionDensity,
} from './living-frame-visual-continuity'

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION =
  'living-frame-environmental-particle-operation-materialization-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_REQUEST_VERSION =
  'living-frame-environmental-particle-private-pixijs-request-v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_CLASS =
  'process_bound_single_use_private_time_sampled_particle_operation_request_candidate' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE =
  'private_request_lease_created_operation_unregistered_dispatch_blocked' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID =
  'pixijs' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID =
  'tool.pixijs.render_living_frame_environmental_particles.v1' as const

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_OPEN_GATES = [
  'canonical_selected_scene_profile_and_timing_binding_required',
  'canonical_pixi_operation_registration_required',
  'qualified_time_sampled_transparent_runtime_required',
  'canonical_work_graph_and_asset_manifest_binding_required',
  'canonical_attempt_cost_binding_required',
  'canonical_remotion_time_sampled_overlay_adapter_required',
  'canonical_procedural_alpha_and_destination_composite_qa_required',
  'canonical_private_review_and_release_evidence_required',
] as const

export type LivingFrameEnvironmentalParticleOperationOpenGate =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_OPEN_GATES)[number]

export const LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_ISSUE_CODES = [
  'input_invalid',
  'kernel_candidate_invalid',
  'kernel_authority_invalid',
  'private_request_invalid',
  'request_size_invalid',
  'lease_invalid',
  'lease_reused',
  'receipt_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameEnvironmentalParticleOperationIssueCode =
  (typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_ISSUE_CODES)[number]

export interface LivingFrameEnvironmentalParticleOperationAuthority {
  readonly privateOperationRequestMaterializationAuthority: true
  readonly particleKernelAuthority: false
  readonly selectedSceneAuthority: false
  readonly environmentalProfileSelectionAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly timingAuthority: false
  readonly motionBudgetAuthority: false
  readonly geometryAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
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

export interface LivingFrameEnvironmentalParticlePrivatePixiJsRequest {
  readonly schemaVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_REQUEST_VERSION
  readonly requestClass:
    'server_derived_private_time_sampled_transparent_particle_primitive_request_v1'
  readonly toolId:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID
  readonly operationId:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID
  readonly materializationCandidateId: string
  readonly kernelCandidateId: string
  readonly sourceBindings: {
    readonly kernelCandidateDigestSha256: string
    readonly deterministicStateSequenceDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly sceneDesignSheetDigestSha256: string
    readonly environmentSheetDigestSha256: string
    readonly frameBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly serverSeedDigestSha256: string
  }
  readonly renderCanvas: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly backgroundMode: 'transparent'
    readonly alphaMode: 'straight_alpha_png'
    readonly exactConfirmedOutputFrameRequired: true
    readonly finalVideoCanvas: false
  }
  readonly approvedStyleBinding: {
    readonly assetTreatment:
      LivingFrameVisualContinuityAssetTreatment
    readonly depthStyle:
      LivingFrameVisualContinuityDepthStyle
    readonly motionDensity:
      LivingFrameVisualContinuityMotionDensity
    readonly colorId: string
    readonly colorHex: string
  }
  readonly particleProfile: {
    readonly profileId:
      LivingFrameEnvironmentalParticleProfileId
    readonly effectFamily:
      LivingFrameEnvironmentalParticleEffectFamily
    readonly particleCount: number
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
    readonly sequenceDigestSha256: string
    readonly stateTracks:
      readonly LivingFrameEnvironmentalParticleStateTrack[]
  }
  readonly supervisedRendererPolicy: {
    readonly serverOwnedTemplateId:
      'living_frame_environmental_particles_v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly oneRequestOneAttempt: true
    readonly networkAllowed: false
    readonly callerCodeAllowed: false
    readonly callerShadersAllowed: false
    readonly callerTexturesOrAssetsAllowed: false
    readonly callerHtmlCssScriptsAllowed: false
    readonly arbitrarySaveOrPreviewAllowed: false
    readonly arbitraryPathsUrlsCredentialsCommandsOrEnvironmentAllowed:
      false
    readonly emitTransparentFrameForEveryBoundFrame: true
  }
  readonly outputPolicy: {
    readonly logicalBundleCount: 1
    readonly bundleClass:
      'private_transparent_rgba_png_frame_sequence_bundle_v1'
    readonly frameImageContentType: 'image/png'
    readonly frameImageCount: number
    readonly manifestRequired: true
    readonly byteOutputMayExistOnlyAfterQualifiedRuntime: true
    readonly createOnlyArtifactPersistenceRequired: true
    readonly generatedPrimitiveRemainsInputToRemotion: true
    readonly remotionOwnsFinalComposition: true
  }
  readonly operationRegistered: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly finalCanvasAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticlePrivateRequestLease {
  readonly leaseClass:
    'process_bound_single_use_environmental_particle_pixijs_request_lease_v1'
  readonly leaseId: string
  readonly materializationDigestSha256: string
  readonly materializationCandidateId: string
  readonly privateRequestDigestSha256: string
  readonly callerSerializable: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly artifactAuthority: false
  readonly finalCanvasAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleOperationMaterializationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_CLASS
  readonly materializationState:
    typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE
  readonly materializationCandidateId: string
  readonly sourceBindings: {
    readonly kernelContractVersion:
      'living-frame-environmental-particle-kernel-v1'
    readonly kernelCandidateId: string
    readonly kernelCandidateDigestSha256: string
    readonly deterministicStateSequenceDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly frameBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly masterTimingDigestSha256: string
  }
  readonly requestReceipt: {
    readonly leaseId: string
    readonly privateRequestDigestSha256: string
    readonly serializedPrivateRequestByteLength: number
    readonly stateTrackCount: number
    readonly frameStateCount: number
    readonly rawStateTracksIncludedInReceipt: false
    readonly rawPromptOrTranscriptIncludedInReceipt: false
    readonly mediaBytesIncludedInReceipt: false
    readonly pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
      false
    readonly leaseConsumed: false
  }
  readonly renderEnvelope: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly profileId:
      LivingFrameEnvironmentalParticleProfileId
    readonly effectFamily:
      LivingFrameEnvironmentalParticleEffectFamily
    readonly assetTreatment:
      LivingFrameVisualContinuityAssetTreatment
    readonly depthStyle:
      LivingFrameVisualContinuityDepthStyle
    readonly motionDensity:
      LivingFrameVisualContinuityMotionDensity
    readonly transparentFrameSequenceRequested: true
    readonly exactConfirmedOutputFramePreserved: true
    readonly squareSubstitutionApplied: false
    readonly finalCanvasClaimed: false
  }
  readonly operationDisposition: {
    readonly existingToolId:
      typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID
    readonly candidateOperationId:
      typeof LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID
    readonly separateToolIdentityRequired: false
    readonly registryExpansionRequired: false
    readonly operationRegistered: false
    readonly dispatchable: false
    readonly oneLeaseRepresentsOneFuturePixiJsAttempt: true
    readonly oneLogicalOutputBundlePerAttempt: true
    readonly remotionRemainsFinalCanvas: true
  }
  readonly authorityBoundary:
    LivingFrameEnvironmentalParticleOperationAuthority
  readonly openGateCodes:
    readonly LivingFrameEnvironmentalParticleOperationOpenGate[]
  readonly selectedSceneBound: false
  readonly canonicalTimingBound: false
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly rendererMutated: false
  readonly qaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsExecutableCode: false
  readonly containsSubjectSpecificSummaries: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameEnvironmentalParticleOperationMaterialization
  extends LivingFrameEnvironmentalParticleOperationMaterializationDraft {
  readonly materializationDigestSha256: string
}

export interface LivingFrameEnvironmentalParticleOperationMaterializationResult {
  readonly receipt:
    LivingFrameEnvironmentalParticleOperationMaterialization
  readonly privateRequestLease:
    LivingFrameEnvironmentalParticlePrivateRequestLease
}

export interface LivingFrameEnvironmentalParticleOperationIssue {
  readonly code:
    LivingFrameEnvironmentalParticleOperationIssueCode
  readonly path: string
}
