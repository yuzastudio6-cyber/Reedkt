import type {
  LivingFrameAi2dCharacterMotionStrategyRecord,
} from './living-frame-ai-2d-character-motion'

export const LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_VERSION =
  'living-frame-character-action-choreography-v1' as const

export const LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_CLASS =
  'head_directed_action_specific_keypose_and_storytiming_binding' as const

export const LIVING_FRAME_CHARACTER_ACTION_KINDS = [
  'prop_interaction',
  'directed_gesture',
  'body_turn',
  'locomotion',
  'impact_or_strike',
  'emotional_reaction',
  'mechanical_interaction',
  'composite_action',
] as const

export type LivingFrameCharacterActionKind =
  (typeof LIVING_FRAME_CHARACTER_ACTION_KINDS)[number]

export const LIVING_FRAME_CHARACTER_ACTION_PHASE_ROLES = [
  'start',
  'anticipation',
  'initiation',
  'contact',
  'action_apex',
  'passing',
  'reaction_apex',
  'follow_through',
  'hold',
  'recovery',
  'settle',
] as const

export type LivingFrameCharacterActionPhaseRole =
  (typeof LIVING_FRAME_CHARACTER_ACTION_PHASE_ROLES)[number]

export type LivingFrameCharacterActionPropConstraint =
  | 'none'
  | 'approach_prop'
  | 'grasp_prop'
  | 'maintain_prop_contact'
  | 'release_prop'
  | 'receive_prop_force'

export type LivingFrameCharacterActionMotionCurve =
  | 'restrained_ease'
  | 'accelerate_to_contact'
  | 'decelerate_into_hold'
  | 'weighted_follow_through'
  | 'overshoot_and_recover'
  | 'constant_only_when_explicitly_justified'

export interface LivingFrameCharacterActionPhaseInput {
  readonly order: number
  readonly phaseId: string
  readonly role:
    LivingFrameCharacterActionPhaseRole
  readonly semanticPurpose: string
  readonly keyposeSelectionReason: string
  readonly bodyMechanicIntent: string
  readonly propConstraint:
    LivingFrameCharacterActionPropConstraint
  readonly transitionToNext: {
    readonly minimumFrames: number
    readonly maximumFrames: number
    readonly motionCurve:
      LivingFrameCharacterActionMotionCurve
  } | null
}

export interface LivingFrameCharacterActionTimingRef {
  readonly sourceOwner: 'StoryTiming'
  readonly artifactId: string
  readonly version: number
  readonly digestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingDigestSha256:
    string
  readonly segmentId: string
  readonly actionStartFrame: number
  readonly actionEndFrameExclusive: number
  readonly keyposeEvents: readonly {
    readonly phaseId: string
    readonly role:
      LivingFrameCharacterActionPhaseRole
    readonly frame: number
    readonly minimumHoldFrames: number
  }[]
}

export interface LivingFrameCharacterActionChoreographyInput {
  readonly choreographyId: string
  readonly strategy:
    LivingFrameAi2dCharacterMotionStrategyRecord
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly actionDirection: {
    readonly actionKind:
      LivingFrameCharacterActionKind
    readonly actionSummary: string
    readonly forceProfile:
      | 'low'
      | 'medium'
      | 'high'
    readonly anticipationRequired: boolean
    readonly contactRequired: boolean
    readonly followThroughRequired:
      boolean
    readonly propInteractionRequired:
      boolean
    readonly centerOfMassContinuityRequired:
      true
    readonly handPropContinuityRequired:
      boolean
    readonly identityCostumeAndAttachmentContinuityRequired:
      true
    readonly selectedKeyposeCountProfessionallySufficientForAction:
      true
    readonly headIntelligenceActionMechanicsReviewPerformed:
      true
  }
  readonly phases:
    readonly LivingFrameCharacterActionPhaseInput[]
  readonly authoritativeTimingRef:
    LivingFrameCharacterActionTimingRef
  readonly uniformSpacingJustification:
    string | null
  readonly containsRawChatPromptPathUrlModelBytesCredentialCommandOrEnvironment:
    false
}

export interface LivingFrameCharacterActionPhaseDirective
  extends Omit<
    LivingFrameCharacterActionPhaseInput,
    'transitionToNext'
  > {
  readonly storyTimingFrame: number
  readonly minimumHoldFrames: number
  readonly transitionToNext:
    LivingFrameCharacterActionPhaseInput['transitionToNext']
  readonly phaseDigestSha256: string
}

export interface LivingFrameCharacterActionTransitionDirective {
  readonly order: number
  readonly fromPhaseId: string
  readonly toPhaseId: string
  readonly startFrame: number
  readonly endFrame: number
  readonly durationFrames: number
  readonly motionCurve:
    LivingFrameCharacterActionMotionCurve
  readonly timingWithinDirectedRange:
    true
  readonly transitionDigestSha256:
    string
}

export interface LivingFrameCharacterActionChoreographyDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_CLASS
  readonly choreographyState:
    'source_only_action_specific_keyposes_storytiming_bound_runtime_blocked'
  readonly choreographyId: string
  readonly canonicalScope:
    LivingFrameCharacterActionChoreographyInput['canonicalScope']
  readonly sourceBindings: {
    readonly motionStrategyVersion:
      LivingFrameAi2dCharacterMotionStrategyRecord['contractVersion']
    readonly motionStrategyDigestSha256:
      string
    readonly storyTimingArtifactId: string
    readonly storyTimingArtifactVersion:
      number
    readonly storyTimingArtifactDigestSha256:
      string
    readonly masterTimingPlanId: string
    readonly masterTimingDigestSha256:
      string
    readonly segmentId: string
  }
  readonly actionDirection:
    LivingFrameCharacterActionChoreographyInput['actionDirection']
  readonly actionFrameRange: {
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
  }
  readonly phaseDirectives:
    readonly LivingFrameCharacterActionPhaseDirective[]
  readonly transitionDirectives:
    readonly LivingFrameCharacterActionTransitionDirective[]
  readonly timingAnalysis: {
    readonly transitionDurationsFrames:
      readonly number[]
    readonly uniformSpacingDetected:
      boolean
    readonly uniformSpacingExplicitlyJustified:
      boolean
    readonly actionTimingWasChosenFromMechanics:
      true
    readonly exactFramesOwnedByStoryTiming:
      true
    readonly parallelClockCreated: false
  }
  readonly gatingPolicy: {
    readonly genericStartMiddleEndPlanningForbidden:
      true
    readonly evenlySpacedDefaultTimingForbidden:
      true
    readonly everyKeyposeRequiresSemanticAndMechanicalReason:
      true
    readonly actionMustBeReroutedWhenSelectedKeyposeCountCannotExpressMechanics:
      true
    readonly contactAndPropConstraintsMustRemainContinuous:
      true
    readonly interpolationMustUseExactDirectedKeyposeFrames:
      true
    readonly renderedMotionTimingRequiresActualVisualInspection:
      true
    readonly technicalTimingChecksCannotApproveProfessionalMotion:
      true
  }
  readonly authorityBoundary: {
    readonly privatePlanningEvidenceAuthority:
      true
    readonly masterTimingAuthority: false
    readonly storyTimingAuthority: false
    readonly workGraphAuthority: false
    readonly providerAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterActionChoreography
  extends LivingFrameCharacterActionChoreographyDraft {
  readonly choreographyDigestSha256:
    string
}
