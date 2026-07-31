import type {
  LivingFrameCompleteCharacterKeyposePlan,
} from './living-frame-complete-character-keypose-plan'

export const LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_VERSION =
  'living-frame-ai-2d-feasibility-sprint-v1' as const

export const LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_CLASS =
  'server_derived_non_executable_three_fixture_ai_2d_feasibility_sprint' as const

export const LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS = [
  'complete_character_prop_interaction',
  'complete_character_meaningful_pose_change',
  'complete_character_a_roll_or_documentary_integration',
] as const

export type LivingFrameAi2dFeasibilityScenario =
  (typeof LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS)[number]

export interface LivingFrameAi2dFeasibilityFixtureInput {
  readonly order: 0 | 1 | 2
  readonly fixtureId: string
  readonly scenario:
    LivingFrameAi2dFeasibilityScenario
  readonly keyposePlan:
    LivingFrameCompleteCharacterKeyposePlan
  readonly expectedActionSummary: string
  readonly confirmedOutputFrameRef: {
    readonly id: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly aspectNumerator: number
    readonly aspectDenominator: number
    readonly digestSha256: string
  }
  readonly masterTimingRef: {
    readonly planId: string
    readonly segmentId: string
    readonly startFrame: number
    readonly endFrameExclusive:
      number
    readonly digestSha256: string
  }
  readonly styleProfileRef: {
    readonly id: string
    readonly version: number
    readonly digestSha256: string
  }
  readonly requiredVisualEvidence: readonly string[]
}

export interface LivingFrameAi2dFeasibilityFixturePlan {
  readonly order: 0 | 1 | 2
  readonly fixtureId: string
  readonly scenario:
    LivingFrameAi2dFeasibilityScenario
  readonly sceneId: string
  readonly componentId: string
  readonly expectedActionSummary: string
  readonly keyposePlanRef: {
    readonly planId: string
    readonly version:
      'living-frame-complete-character-keypose-plan-v1'
    readonly digestSha256: string
    readonly keyposeCount: 3 | 4
  }
  readonly confirmedOutputFrameRef:
    LivingFrameAi2dFeasibilityFixtureInput['confirmedOutputFrameRef']
  readonly masterTimingRef:
    LivingFrameAi2dFeasibilityFixtureInput['masterTimingRef']
  readonly styleProfileRef:
    LivingFrameAi2dFeasibilityFixtureInput['styleProfileRef']
  readonly requiredVisualEvidence:
    readonly string[]
  readonly attemptPolicy: {
    readonly maximumAttemptsPerKeyposeRole:
      3
    readonly maximumTotalKeyposeAttempts:
      9 | 12
    readonly repairOnlyFailedPose: true
    readonly rejectedAttemptCannotBecomeFallbackAsset:
      true
  }
  readonly stageState: {
    readonly completeKeyposeGeneration:
      'pending_qualified_comfyui_runtime'
    readonly completeKeyposeVisualReview:
      'blocked_until_private_keypose_outputs_exist'
    readonly toonCrafterInterpolation:
      'blocked_until_every_complete_keypose_is_accepted'
    readonly interpolatedMotionVisualReview:
      'blocked_until_private_interpolated_motion_exists'
    readonly optionalRifeCadenceSmoothing:
      'blocked_until_underlying_motion_is_accepted'
    readonly pixiJsSupportMotion:
      'blocked_until_primary_character_motion_is_accepted'
    readonly remotionFinalComposition:
      'blocked_until_all_required_motion_assets_are_accepted'
    readonly finalCompositeVisualReview:
      'blocked_until_private_remotion_composite_exists'
  }
  readonly fixtureDisposition:
    'pending_private_visual_evidence'
  readonly fixtureDigestSha256: string
}

export interface LivingFrameAi2dFeasibilitySprintDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_CLASS
  readonly sprintState:
    'source_only_three_fixture_plan_runtime_and_visual_evidence_pending'
  readonly sprintId: string
  readonly toolPolicyRef: {
    readonly version:
      'living-frame-character-motion-tool-policy-v1'
    readonly digestSha256: string
  }
  readonly fixturePlans:
    readonly LivingFrameAi2dFeasibilityFixturePlan[]
  readonly exactScenarioCoverage:
    typeof LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS
  readonly reviewProtocol: {
    readonly inspectEveryCompleteKeypose:
      true
    readonly inspectFullMotionAtIntendedPlaybackSpeed:
      true
    readonly inspectRepresentativeAndProblemFrames:
      true
    readonly inspectFinalRemotionComposite:
      true
    readonly technicalMetricsCannotSubstituteForVisualReview:
      true
    readonly headIntelligenceDispositionRequired:
      true
    readonly userMayReviewEvidenceBeforeKeepDecision:
      true
  }
  readonly keepOrDropPolicy: {
    readonly currentCharacterAnimationDisposition:
      'disabled_pending_three_fixture_professional_visual_evidence'
    readonly allThreeFixturesMustPass:
      true
    readonly fixtureResultsCannotBeAveraged:
      true
    readonly routineManualRepaintMeansAutomatedBranchFailed:
      true
    readonly anyBlockingFailureKeepsAutomatedCharacterAnimationDisabled:
      true
    readonly failedCharacterBranchDoesNotDisableOtherLivingFrameModes:
      true
    readonly fallback:
      'accepted_complete_still_with_camera_parallax_environment_editorial_motion_and_sound_or_deliberate_non_use'
  }
  readonly noFixtureMayBeWaived: true
  readonly containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
    false
  readonly authorityBoundary: {
    readonly approvedSnapshotAuthority:
      false
    readonly masterTimingAuthority: false
    readonly operationRegistryAuthority:
      false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority:
      false
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

export interface LivingFrameAi2dFeasibilitySprint
  extends LivingFrameAi2dFeasibilitySprintDraft {
  readonly sprintDigestSha256: string
}
