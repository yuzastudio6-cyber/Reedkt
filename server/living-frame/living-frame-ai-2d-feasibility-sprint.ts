import {
  LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS,
  LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_CLASS,
  LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_VERSION,
  type LivingFrameAi2dFeasibilityFixtureInput,
  type LivingFrameAi2dFeasibilityFixturePlan,
  type LivingFrameAi2dFeasibilitySprint,
  type LivingFrameAi2dFeasibilitySprintDraft,
} from '../../src/types/living-frame-ai-2d-feasibility-sprint'
import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION,
  type LivingFrameCharacterMotionToolPolicy,
} from '../../src/types/living-frame-character-motion-tool-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameCharacterMotionToolPolicy,
} from './living-frame-character-motion-tool-policy'
import {
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
  verifyLivingFrameCompleteCharacterKeyposePlan,
} from './living-frame-complete-character-keypose-plan'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export interface CompileLivingFrameAi2dFeasibilityFixtureInput
  extends LivingFrameAi2dFeasibilityFixtureInput {
  readonly keyposePlanInput:
    CreateLivingFrameCompleteCharacterKeyposePlanInput
}

export interface CompileLivingFrameAi2dFeasibilitySprintInput {
  readonly sprintId: string
  readonly toolPolicy:
    LivingFrameCharacterMotionToolPolicy
  readonly fixtures:
    readonly CompileLivingFrameAi2dFeasibilityFixtureInput[]
}

export function compileLivingFrameAi2dFeasibilitySprint(
  input:
    CompileLivingFrameAi2dFeasibilitySprintInput,
): LivingFrameAi2dFeasibilitySprint {
  assertInput(input)
  const fixturePlans =
    input.fixtures.map(
      compileFixture,
    )
  const draft:
    LivingFrameAi2dFeasibilitySprintDraft = {
      contractVersion:
        LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_VERSION,
      resultClass:
        LIVING_FRAME_AI_2D_FEASIBILITY_SPRINT_CLASS,
      sprintState:
        'source_only_three_fixture_plan_runtime_and_visual_evidence_pending',
      sprintId: input.sprintId,
      toolPolicyRef: {
        version:
          LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION,
        digestSha256:
          input.toolPolicy
            .policyDigestSha256,
      },
      fixturePlans,
      exactScenarioCoverage:
        LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS,
      reviewProtocol: {
        inspectEveryCompleteKeypose:
          true,
        inspectFullMotionAtIntendedPlaybackSpeed:
          true,
        inspectRepresentativeAndProblemFrames:
          true,
        inspectFinalRemotionComposite:
          true,
        technicalMetricsCannotSubstituteForVisualReview:
          true,
        headIntelligenceDispositionRequired:
          true,
        userMayReviewEvidenceBeforeKeepDecision:
          true,
      },
      keepOrDropPolicy: {
        currentCharacterAnimationDisposition:
          'disabled_pending_three_fixture_professional_visual_evidence',
        allThreeFixturesMustPass:
          true,
        fixtureResultsCannotBeAveraged:
          true,
        routineManualRepaintMeansAutomatedBranchFailed:
          true,
        anyBlockingFailureKeepsAutomatedCharacterAnimationDisabled:
          true,
        failedCharacterBranchDoesNotDisableOtherLivingFrameModes:
          true,
        fallback:
          'accepted_complete_still_with_camera_parallax_environment_editorial_motion_and_sound_or_deliberate_non_use',
      },
      noFixtureMayBeWaived: true,
      containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
        false,
      authorityBoundary: {
        approvedSnapshotAuthority:
          false,
        masterTimingAuthority: false,
        operationRegistryAuthority:
          false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    sprintDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameAi2dFeasibilitySprint(
  value: unknown,
  input:
    CompileLivingFrameAi2dFeasibilitySprintInput,
): value is LivingFrameAi2dFeasibilitySprint {
  if (
    !isRecord(value)
    || typeof value.sprintDigestSha256
      !== 'string'
  ) return false
  try {
    return stableAuthorityStringify(
      value,
    ) === stableAuthorityStringify(
      compileLivingFrameAi2dFeasibilitySprint(
        input,
      ),
    )
  } catch {
    return false
  }
}

function compileFixture(
  input:
    CompileLivingFrameAi2dFeasibilityFixtureInput,
): LivingFrameAi2dFeasibilityFixturePlan {
  const draft = {
    order: input.order,
    fixtureId: input.fixtureId,
    scenario: input.scenario,
    sceneId:
      input.keyposePlan
        .canonicalScope.sceneId,
    componentId:
      input.keyposePlan
        .canonicalScope.componentId,
    expectedActionSummary:
      input.expectedActionSummary,
    keyposePlanRef: {
      planId:
        input.keyposePlan.planId,
      version:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION,
      digestSha256:
        input.keyposePlan
          .planDigestSha256,
      keyposeCount:
        input.keyposePlan
          .sequencePolicy.keyposeCount,
    },
    confirmedOutputFrameRef:
      structuredClone(
        input.confirmedOutputFrameRef,
      ),
    masterTimingRef:
      structuredClone(
        input.masterTimingRef,
      ),
    styleProfileRef:
      structuredClone(
        input.styleProfileRef,
      ),
    requiredVisualEvidence:
      structuredClone(
        input.requiredVisualEvidence,
      ),
    attemptPolicy: {
      maximumAttemptsPerKeyposeRole:
        3 as const,
      maximumTotalKeyposeAttempts:
        (
          input.keyposePlan
            .sequencePolicy
            .keyposeCount * 3
        ) as 9 | 12,
      repairOnlyFailedPose: true as const,
      rejectedAttemptCannotBecomeFallbackAsset:
        true as const,
    },
    stageState: {
      completeKeyposeGeneration:
        'pending_qualified_comfyui_runtime' as const,
      completeKeyposeVisualReview:
        'blocked_until_private_keypose_outputs_exist' as const,
      toonCrafterInterpolation:
        'blocked_until_every_complete_keypose_is_accepted' as const,
      interpolatedMotionVisualReview:
        'blocked_until_private_interpolated_motion_exists' as const,
      optionalRifeCadenceSmoothing:
        'blocked_until_underlying_motion_is_accepted' as const,
      pixiJsSupportMotion:
        'blocked_until_primary_character_motion_is_accepted' as const,
      remotionFinalComposition:
        'blocked_until_all_required_motion_assets_are_accepted' as const,
      finalCompositeVisualReview:
        'blocked_until_private_remotion_composite_exists' as const,
    },
    fixtureDisposition:
      'pending_private_visual_evidence' as const,
  }
  return deepFreeze({
    ...draft,
    fixtureDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertInput(
  input:
    CompileLivingFrameAi2dFeasibilitySprintInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(input.sprintId)
    || !verifyLivingFrameCharacterMotionToolPolicy(
      input.toolPolicy,
    )
    || input.fixtures.length !== 3
    || input.fixtures.some(
      (fixture, order) =>
        !isValidFixture(
          fixture,
          order,
        ),
    )
    || stableAuthorityStringify(
      input.fixtures.map(
        (fixture) => fixture.scenario,
      ),
    ) !== stableAuthorityStringify(
      LIVING_FRAME_AI_2D_FEASIBILITY_SCENARIOS,
    )
    || new Set(
      input.fixtures.map(
        (fixture) =>
          fixture.fixtureId,
      ),
    ).size !== 3
    || new Set(
      input.fixtures.map(
        (fixture) =>
          fixture.keyposePlan
            .canonicalScope.sceneId,
      ),
    ).size !== 3
    || new Set(
      input.fixtures.map(
        (fixture) =>
          fixture.keyposePlan
            .planDigestSha256,
      ),
    ).size !== 3
  ) {
    throw new Error(
      'Living Frame AI 2D feasibility sprint input is invalid.',
    )
  }
}

function isValidFixture(
  fixture: unknown,
  expectedOrder: number,
): fixture is CompileLivingFrameAi2dFeasibilityFixtureInput {
  if (
    !isRecord(fixture)
    || !isRecord(fixture.keyposePlan)
    || !isRecord(
      fixture.keyposePlanInput,
    )
  ) return false
  const candidate =
    fixture as unknown as
      CompileLivingFrameAi2dFeasibilityFixtureInput
  if (
    candidate.order !== expectedOrder
    || typeof candidate.fixtureId !==
      'string'
    || !SAFE_ID.test(
      candidate.fixtureId,
    )
    || candidate.keyposePlan.contractVersion !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION
    || candidate.keyposePlan.resultClass !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS
    || candidate.keyposePlan.planState !==
      'source_only_complete_keypose_plan_runtime_and_visual_qa_pending'
    || candidate.keyposePlan.selectedStrategy !==
      'ai_2d_complete_keyposes'
    || candidate.keyposePlan
      .sequencePolicy
      .everyPoseIsCompleteCharacter !==
        true
    || candidate.keyposePlan
      .sequencePolicy
      .interpolationBlockedUntilEveryPoseAccepted !==
        true
    || !SHA256.test(
      candidate.keyposePlan
        .planDigestSha256,
    )
    || candidate.keyposePlan
      .operationRegistered
    || candidate.keyposePlan
      .dispatchGranted
    || candidate.keyposePlan
      .runtimeExecuted
    || candidate.keyposePlan.assetCreated
    || candidate.keyposePlan
      .canonicalQaApproved
    || !verifyLivingFrameCompleteCharacterKeyposePlan(
      candidate.keyposePlan,
      candidate.keyposePlanInput,
    )
    || candidate.keyposePlanInput
      .planId !== candidate.keyposePlan
        .planId
    || candidate.keyposePlanInput
      .canonicalScope.sceneId !==
        candidate.keyposePlan
          .canonicalScope.sceneId
    || candidate.keyposePlanInput
      .canonicalScope.componentId !==
        candidate.keyposePlan
          .canonicalScope.componentId
    || typeof candidate
      .expectedActionSummary !==
        'string'
    || candidate.expectedActionSummary
      .length < 12
    || candidate.expectedActionSummary
      .length > 320
    || UNSAFE_TEXT.test(
      candidate.expectedActionSummary,
    )
    || !isValidFrameRef(
      candidate.confirmedOutputFrameRef,
    )
    || !isValidTimingRef(
      candidate.masterTimingRef,
    )
    || !isValidStyleRef(
      candidate.styleProfileRef,
    )
    || candidate.keyposePlan
      .sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
        candidate.confirmedOutputFrameRef
          .digestSha256
    || candidate.keyposePlan
      .sourceBindings
      .currentMasterTimingDigestSha256 !==
        candidate.masterTimingRef
          .digestSha256
    || !Array.isArray(
      candidate.requiredVisualEvidence,
    )
    || candidate.requiredVisualEvidence
      .length < 3
    || candidate.requiredVisualEvidence
      .some(
        (entry) =>
          typeof entry !== 'string'
          || !SAFE_ID.test(entry),
      )
  ) return false
  const frame =
    candidate.confirmedOutputFrameRef
  const actionTiming =
    candidate.keyposePlanInput
      .actionChoreographyInput
      .authoritativeTimingRef
  const actionDirection =
    candidate.keyposePlanInput
      .actionChoreographyInput
      .actionDirection
  if (
    actionDirection.actionSummary !==
      candidate.expectedActionSummary
    || actionTiming.masterTimingPlanId !==
      candidate.masterTimingRef.planId
    || actionTiming.masterTimingDigestSha256 !==
      candidate.masterTimingRef.digestSha256
    || actionTiming.segmentId !==
      candidate.masterTimingRef.segmentId
    || actionTiming.actionStartFrame <
      candidate.masterTimingRef.startFrame
    || actionTiming.actionEndFrameExclusive >
      candidate.masterTimingRef.endFrameExclusive
    || candidate.keyposePlan.keyposeUnits.some(
      (unit) =>
        unit.storyTimingFrame <
          candidate.masterTimingRef.startFrame
        || unit.storyTimingFrame >=
      candidate.masterTimingRef.endFrameExclusive,
    )
  ) return false
  if (
    candidate.scenario ===
      'complete_character_prop_interaction'
    && (
      actionDirection.actionKind !==
        'prop_interaction'
      || !actionDirection
        .propInteractionRequired
      || !actionDirection
        .handPropContinuityRequired
      || !candidate.keyposePlan
        .keyposeUnits.some(
          (unit) =>
            unit.role === 'contact'
            && unit.propConstraint !==
              'none',
        )
    )
  ) return false
  const expectedHeight =
    frame.widthPixels
    * frame.aspectDenominator
  const actualHeight =
    frame.heightPixels
    * frame.aspectNumerator
  return expectedHeight ===
    actualHeight
}

function isValidFrameRef(
  value: unknown,
): value is LivingFrameAi2dFeasibilityFixtureInput['confirmedOutputFrameRef'] {
  return isRecord(value)
    && typeof value.id === 'string'
    && SAFE_ID.test(value.id)
    && Number.isInteger(
      value.widthPixels,
    )
    && Number(value.widthPixels) > 0
    && Number.isInteger(
      value.heightPixels,
    )
    && Number(value.heightPixels) > 0
    && Number(value.widthPixels) <= 4096
    && Number(value.heightPixels) <= 4096
    && Number(value.widthPixels)
      * Number(value.heightPixels)
      <= 8_294_400
    && Number.isInteger(
      value.aspectNumerator,
    )
    && Number(value.aspectNumerator) > 0
    && Number.isInteger(
      value.aspectDenominator,
    )
    && Number(value.aspectDenominator) > 0
    && typeof value.digestSha256 ===
      'string'
    && SHA256.test(value.digestSha256)
}

function isValidTimingRef(
  value: unknown,
): value is LivingFrameAi2dFeasibilityFixtureInput['masterTimingRef'] {
  return isRecord(value)
    && typeof value.planId === 'string'
    && SAFE_ID.test(
      value.planId,
    )
    && typeof value.segmentId ===
      'string'
    && SAFE_ID.test(
      value.segmentId,
    )
    && Number.isInteger(
      value.startFrame,
    )
    && Number(value.startFrame) >= 0
    && Number.isInteger(
      value.endFrameExclusive,
    )
    && Number(value.endFrameExclusive)
      > Number(value.startFrame)
    && typeof value.digestSha256 ===
      'string'
    && SHA256.test(value.digestSha256)
}

function isValidStyleRef(
  value: unknown,
): value is LivingFrameAi2dFeasibilityFixtureInput['styleProfileRef'] {
  return isRecord(value)
    && typeof value.id === 'string'
    && SAFE_ID.test(value.id)
    && Number.isInteger(value.version)
    && Number(value.version) > 0
    && typeof value.digestSha256 ===
      'string'
    && SHA256.test(value.digestSha256)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(nested)
  return value
}
