import type {
  LivingFrameAi2dCharacterMotionStrategyRecord,
} from './living-frame-ai-2d-character-motion'
import type {
  LivingFrameCharacterActionChoreographyInput,
  LivingFrameCharacterActionPhaseRole,
  LivingFrameCharacterActionPropConstraint,
} from './living-frame-character-action-choreography'

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION =
  'living-frame-complete-character-keypose-plan-v2' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS =
  'server_derived_non_executable_complete_character_keypose_plan' as const

export type LivingFrameCompleteCharacterKeyposeRole =
  LivingFrameCharacterActionPhaseRole

export interface LivingFrameCompleteCharacterKeyposeInput {
  readonly order: number
  readonly role:
    LivingFrameCompleteCharacterKeyposeRole
  readonly poseControlArtifactId: string
  readonly poseControlDigestSha256: string
  readonly approvedWorkItemId: string
  readonly plannedAssetManifestEntryId: string
  readonly outputKey: string
}

export interface LivingFrameCompleteCharacterKeyposeUnit {
  readonly order: number
  readonly role:
    LivingFrameCompleteCharacterKeyposeRole
  readonly keyposeUnitId: string
  readonly sourceArtifactId: string
  readonly styleReferenceArtifactId:
    string
  readonly poseControlArtifactId: string
  readonly poseControlDigestSha256: string
  readonly approvedWorkItemId: string
  readonly plannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly actionPhaseId: string
  readonly actionDescription: string
  readonly keyposeSelectionReason:
    string
  readonly bodyMechanicIntent: string
  readonly propConstraint:
    LivingFrameCharacterActionPropConstraint
  readonly storyTimingFrame: number
  readonly minimumHoldFrames: number
  readonly generationRoute: {
    readonly optionalDesignOrRepairProviderRoute:
      'gpt_image_2'
    readonly controlledPoseHostToolId:
      'comfyui'
    readonly controlledPoseOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly poseControlRequired: true
    readonly completeCharacterReferenceRequired:
      true
    readonly styleReferenceRequired: true
    readonly optionalLoRaAllowed: true
    readonly genericIpAdapterAllowed: true
    readonly controlNetAllowed: true
    readonly faceIdOrInsightFaceAllowed: false
    readonly oneSupervisedGpuAttempt: true
    readonly exactModelRoleCount: 5
  }
  readonly generationCanvas: {
    readonly canvasClass:
      'isolated_complete_character_square_1024'
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly callerSelectedDimensionsAllowed:
      false
    readonly finalCanvasCreatedByGenerationTool:
      false
  }
  readonly characterIntegrity: {
    readonly completeCharacterRequired: true
    readonly detachedLimbOutputForbidden:
      true
    readonly visiblePuppetJointOutputForbidden:
      true
    readonly identityCostumeBodyAndPropContinuityRequired:
      true
    readonly correctHandsAndLimbCountRequired:
      true
    readonly secondaryPartsMustRemainAttached:
      true
  }
  readonly privateOutput: {
    readonly contentType: 'image/png'
    readonly outputCount: 1
    readonly privateArtifactRequired: true
    readonly byteFreePlan: true
    readonly professionalVisualReviewDisposition:
      'pending'
  }
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly keyposeUnitDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposePlanDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS
  readonly planState:
    'source_only_complete_keypose_plan_runtime_and_visual_qa_pending'
  readonly planId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly motionStrategyVersion:
      typeof import('./living-frame-ai-2d-character-motion').LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_VERSION
    readonly motionStrategyDigestSha256:
      string
    readonly actionChoreographyVersion:
      'living-frame-character-action-choreography-v1'
    readonly actionChoreographyDigestSha256:
      string
    readonly authoritativeActionTimingArtifactId:
      string
    readonly authoritativeActionTimingDigestSha256:
      string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256:
      string
    readonly currentMasterTimingDigestSha256:
      string
    readonly confirmedOutputFrameExpectationDigestSha256:
      string
    readonly completeCharacterSourceArtifactId:
      string
    readonly completeCharacterSourceDigestSha256:
      string
    readonly styleReferenceArtifactId:
      string
    readonly styleReferenceDigestSha256:
      string
  }
  readonly selectedStrategy:
    Extract<
      LivingFrameAi2dCharacterMotionStrategyRecord['decision']['selectedStrategy'],
      'ai_2d_complete_keyposes'
    >
  readonly keyposeUnits:
    readonly LivingFrameCompleteCharacterKeyposeUnit[]
  readonly sequencePolicy: {
    readonly keyposeCount: 3 | 4
    readonly everyPoseIsCompleteCharacter:
      true
    readonly everyPoseRequiresProfessionalVisualAcceptance:
      true
    readonly interpolationBlockedUntilEveryPoseAccepted:
      true
    readonly actionSpecificKeyposeSelectionRequired:
      true
    readonly genericStartMiddleEndPlanningForbidden:
      true
    readonly storyTimingOwnsExactKeyposeFrames:
      true
    readonly evenlySpacedDefaultTimingForbidden:
      true
    readonly independentPerFrameGenerationForbidden:
      true
    readonly toonCrafterEvaluationMayBegin:
      false
    readonly rifeEvaluationMayBegin: false
    readonly remotionFinalCompositionMayBegin:
      false
  }
  readonly openGateCodes: readonly [
    'qualified_comfyui_complete_keypose_runtime_required',
    'gpt_image_2_source_or_repair_route_approval_required_when_used',
    'create_only_private_keypose_persistence_required',
    'every_complete_keypose_professional_visual_acceptance_required',
    'tooncrafter_interpolation_qualification_required',
    'rendered_motion_professional_visual_acceptance_required',
    'optional_rife_cadence_qualification_required',
    'remotion_final_composition_required',
  ]
  readonly authorityBoundary: {
    readonly privatePlanningEvidenceAuthority:
      true
    readonly providerAuthority: false
    readonly operationRegistryAuthority:
      false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposePlan
  extends LivingFrameCompleteCharacterKeyposePlanDraft {
  readonly planDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposeChoreographyBinding {
  readonly actionChoreographyInput:
    LivingFrameCharacterActionChoreographyInput
}
