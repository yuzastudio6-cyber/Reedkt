import {
  LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_CLASS,
  LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_VERSION,
  LIVING_FRAME_CHARACTER_ACTION_KINDS,
  LIVING_FRAME_CHARACTER_ACTION_PHASE_ROLES,
  type LivingFrameCharacterActionChoreography,
  type LivingFrameCharacterActionChoreographyDraft,
  type LivingFrameCharacterActionChoreographyInput,
  type LivingFrameCharacterActionPhaseDirective,
  type LivingFrameCharacterActionPhaseInput,
  type LivingFrameCharacterActionTransitionDirective,
} from '../../src/types/living-frame-character-action-choreography'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameAi2dCharacterMotionStrategy,
} from './living-frame-ai-2d-character-motion'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export function compileLivingFrameCharacterActionChoreography(
  input: LivingFrameCharacterActionChoreographyInput,
): LivingFrameCharacterActionChoreography {
  assertInput(input)
  const timing = input.authoritativeTimingRef
  const phaseDirectives = input.phases.map(
    (phase, order) =>
      compilePhase(
        phase,
        timing.keyposeEvents[order]!,
      ),
  )
  const transitionDirectives =
    phaseDirectives.slice(0, -1).map(
      (phase, order) =>
        compileTransition(
          phase,
          phaseDirectives[order + 1]!,
        ),
    )
  const transitionDurationsFrames =
    transitionDirectives.map(
      (transition) =>
        transition.durationFrames,
    )
  const uniformSpacingDetected =
    transitionDurationsFrames.length > 1
    && new Set(
      transitionDurationsFrames,
    ).size === 1
  const draft:
    LivingFrameCharacterActionChoreographyDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_ACTION_CHOREOGRAPHY_CLASS,
      choreographyState:
        'source_only_action_specific_keyposes_storytiming_bound_runtime_blocked',
      choreographyId: input.choreographyId,
      canonicalScope:
        structuredClone(input.canonicalScope),
      sourceBindings: {
        motionStrategyVersion:
          input.strategy.contractVersion,
        motionStrategyDigestSha256:
          input.strategy.strategyDigestSha256,
        storyTimingArtifactId:
          timing.artifactId,
        storyTimingArtifactVersion:
          timing.version,
        storyTimingArtifactDigestSha256:
          timing.digestSha256,
        masterTimingPlanId:
          timing.masterTimingPlanId,
        masterTimingDigestSha256:
          timing.masterTimingDigestSha256,
        segmentId: timing.segmentId,
      },
      actionDirection:
        structuredClone(input.actionDirection),
      actionFrameRange: {
        startFrame:
          timing.actionStartFrame,
        endFrameExclusive:
          timing.actionEndFrameExclusive,
        durationFrames:
          timing.actionEndFrameExclusive
          - timing.actionStartFrame,
      },
      phaseDirectives,
      transitionDirectives,
      timingAnalysis: {
        transitionDurationsFrames,
        uniformSpacingDetected,
        uniformSpacingExplicitlyJustified:
          uniformSpacingDetected
          && input.uniformSpacingJustification !== null,
        actionTimingWasChosenFromMechanics:
          true,
        exactFramesOwnedByStoryTiming:
          true,
        parallelClockCreated: false,
      },
      gatingPolicy: {
        genericStartMiddleEndPlanningForbidden:
          true,
        evenlySpacedDefaultTimingForbidden:
          true,
        everyKeyposeRequiresSemanticAndMechanicalReason:
          true,
        actionMustBeReroutedWhenSelectedKeyposeCountCannotExpressMechanics:
          true,
        contactAndPropConstraintsMustRemainContinuous:
          true,
        interpolationMustUseExactDirectedKeyposeFrames:
          true,
        renderedMotionTimingRequiresActualVisualInspection:
          true,
        technicalTimingChecksCannotApproveProfessionalMotion:
          true,
      },
      authorityBoundary: {
        privatePlanningEvidenceAuthority:
          true,
        masterTimingAuthority: false,
        storyTimingAuthority: false,
        workGraphAuthority: false,
        providerAuthority: false,
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
    choreographyDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCharacterActionChoreography(
  value: unknown,
  input: LivingFrameCharacterActionChoreographyInput,
): value is LivingFrameCharacterActionChoreography {
  try {
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(
        compileLivingFrameCharacterActionChoreography(
          input,
        ),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: LivingFrameCharacterActionChoreographyInput,
): void {
  if (
    !hasExactKeys(input, [
      'choreographyId',
      'strategy',
      'canonicalScope',
      'actionDirection',
      'phases',
      'authoritativeTimingRef',
      'uniformSpacingJustification',
      'containsRawChatPromptPathUrlModelBytesCredentialCommandOrEnvironment',
    ])
    || !SAFE_ID.test(input.choreographyId)
    || !verifyLivingFrameAi2dCharacterMotionStrategy(
      input.strategy,
    )
    || input.strategy.decision.selectedStrategy !==
      'ai_2d_complete_keyposes'
    || input.strategy.decision.strategyState !==
      'source_only_ai_2d_feasibility_candidate'
    || input.strategy.evidence.sceneId !==
      input.canonicalScope.sceneId
    || input.strategy.evidence.componentId !==
      input.canonicalScope.componentId
    || input.actionDirection.actionSummary !==
      input.strategy.evidence.requestedActionSummary
    || input.phases.length !==
      input.strategy.decision.completeKeyposeCount
    || ![
      3,
      4,
    ].includes(input.phases.length)
    || input
      .containsRawChatPromptPathUrlModelBytesCredentialCommandOrEnvironment !==
        false
    || !validScope(input.canonicalScope)
    || !validActionDirection(
      input.actionDirection,
    )
    || !validPhases(input.phases)
    || !validTiming(
      input.authoritativeTimingRef,
      input.phases,
    )
    || !validActionMechanics(input)
  ) fail()
  const spans =
    input.authoritativeTimingRef
      .keyposeEvents.slice(0, -1)
      .map(
        (event, order) =>
          input.authoritativeTimingRef
            .keyposeEvents[order + 1]!
            .frame - event.frame,
      )
  const uniform = spans.length > 1
    && new Set(spans).size === 1
  if (
    uniform
    && !validOptionalExplanation(
      input.uniformSpacingJustification,
    )
  ) fail()
  if (
    !uniform
    && input.uniformSpacingJustification !== null
  ) fail()
}

function validActionDirection(
  value: LivingFrameCharacterActionChoreographyInput['actionDirection'],
): boolean {
  return hasExactKeys(value, [
    'actionKind',
    'actionSummary',
    'forceProfile',
    'anticipationRequired',
    'contactRequired',
    'followThroughRequired',
    'propInteractionRequired',
    'centerOfMassContinuityRequired',
    'handPropContinuityRequired',
    'identityCostumeAndAttachmentContinuityRequired',
    'selectedKeyposeCountProfessionallySufficientForAction',
    'headIntelligenceActionMechanicsReviewPerformed',
  ])
    && LIVING_FRAME_CHARACTER_ACTION_KINDS.includes(
      value.actionKind,
    )
    && validExplanation(value.actionSummary)
    && [
      'low',
      'medium',
      'high',
    ].includes(value.forceProfile)
    && typeof value.anticipationRequired ===
      'boolean'
    && typeof value.contactRequired ===
      'boolean'
    && typeof value.followThroughRequired ===
      'boolean'
    && typeof value.propInteractionRequired ===
      'boolean'
    && value.centerOfMassContinuityRequired ===
      true
    && typeof value.handPropContinuityRequired ===
      'boolean'
    && value.identityCostumeAndAttachmentContinuityRequired ===
      true
    && value.selectedKeyposeCountProfessionallySufficientForAction ===
      true
    && value.headIntelligenceActionMechanicsReviewPerformed ===
      true
}

function validPhases(
  phases: readonly LivingFrameCharacterActionPhaseInput[],
): boolean {
  const ids = new Set<string>()
  const roles = new Set<string>()
  return phases.every(
    (phase, order) => {
      if (
        !hasExactKeys(phase, [
          'order',
          'phaseId',
          'role',
          'semanticPurpose',
          'keyposeSelectionReason',
          'bodyMechanicIntent',
          'propConstraint',
          'transitionToNext',
        ])
        || phase.order !== order
        || !SAFE_ID.test(phase.phaseId)
        || ids.has(phase.phaseId)
        || roles.has(phase.role)
        || !LIVING_FRAME_CHARACTER_ACTION_PHASE_ROLES.includes(
          phase.role,
        )
        || !validExplanation(
          phase.semanticPurpose,
        )
        || !validExplanation(
          phase.keyposeSelectionReason,
        )
        || !validExplanation(
          phase.bodyMechanicIntent,
        )
        || ![
          'none',
          'approach_prop',
          'grasp_prop',
          'maintain_prop_contact',
          'release_prop',
          'receive_prop_force',
        ].includes(phase.propConstraint)
        || !validTransition(
          phase.transitionToNext,
          order === phases.length - 1,
        )
      ) return false
      ids.add(phase.phaseId)
      roles.add(phase.role)
      return true
    },
  )
    && phases[0]?.role === 'start'
    && [
      'recovery',
      'settle',
    ].includes(phases.at(-1)?.role ?? '')
}

function validTransition(
  value: LivingFrameCharacterActionPhaseInput['transitionToNext'],
  isLast: boolean,
): boolean {
  if (isLast) return value === null
  return hasExactKeys(value, [
    'minimumFrames',
    'maximumFrames',
    'motionCurve',
  ])
    && Number.isSafeInteger(value.minimumFrames)
    && Number.isSafeInteger(value.maximumFrames)
    && value.minimumFrames >= 2
    && value.maximumFrames >=
      value.minimumFrames
    && value.maximumFrames <= 120
    && [
      'restrained_ease',
      'accelerate_to_contact',
      'decelerate_into_hold',
      'weighted_follow_through',
      'overshoot_and_recover',
      'constant_only_when_explicitly_justified',
    ].includes(value.motionCurve)
}

function validTiming(
  value: LivingFrameCharacterActionChoreographyInput['authoritativeTimingRef'],
  phases: readonly LivingFrameCharacterActionPhaseInput[],
): boolean {
  if (
    !hasExactKeys(value, [
      'sourceOwner',
      'artifactId',
      'version',
      'digestSha256',
      'masterTimingPlanId',
      'masterTimingDigestSha256',
      'segmentId',
      'actionStartFrame',
      'actionEndFrameExclusive',
      'keyposeEvents',
    ])
    || value.sourceOwner !== 'StoryTiming'
    || !SAFE_ID.test(value.artifactId)
    || !Number.isSafeInteger(value.version)
    || value.version < 1
    || !SHA256.test(value.digestSha256)
    || !SAFE_ID.test(value.masterTimingPlanId)
    || !SHA256.test(
      value.masterTimingDigestSha256,
    )
    || !SAFE_ID.test(value.segmentId)
    || !Number.isSafeInteger(
      value.actionStartFrame,
    )
    || !Number.isSafeInteger(
      value.actionEndFrameExclusive,
    )
    || value.actionStartFrame < 0
    || value.actionEndFrameExclusive <=
      value.actionStartFrame
    || value.keyposeEvents.length !==
      phases.length
  ) return false
  const {
    digestSha256,
    ...contentAddressedTiming
  } = value
  if (
    sha256AuthorityValue(
      contentAddressedTiming,
    ) !== digestSha256
  ) return false
  let previousFrame = -1
  return value.keyposeEvents.every(
    (event, order) => {
      const phase = phases[order]
      const next = value.keyposeEvents[order + 1]
      if (
        phase == null
        || !hasExactKeys(event, [
          'phaseId',
          'role',
          'frame',
          'minimumHoldFrames',
        ])
        || event.phaseId !== phase.phaseId
        || event.role !== phase.role
        || !Number.isSafeInteger(event.frame)
        || !Number.isSafeInteger(
          event.minimumHoldFrames,
        )
        || event.minimumHoldFrames < 0
        || event.frame <
          value.actionStartFrame
        || event.frame >=
          value.actionEndFrameExclusive
        || event.frame <= previousFrame
        || (
          order === 0
          && event.frame !==
            value.actionStartFrame
        )
        || (
          next != null
          && event.frame
            + event.minimumHoldFrames >=
              next.frame
        )
        || (
          next == null
          && event.frame
            + event.minimumHoldFrames >=
              value.actionEndFrameExclusive
        )
      ) return false
      if (next != null) {
        const transition =
          phase.transitionToNext!
        const duration =
          next.frame - event.frame
        if (
          duration < transition.minimumFrames
          || duration > transition.maximumFrames
        ) return false
      }
      previousFrame = event.frame
      return true
    },
  )
}

function validActionMechanics(
  input: LivingFrameCharacterActionChoreographyInput,
): boolean {
  const roles = input.phases.map(
    (phase) => phase.role,
  )
  const props = input.phases.map(
    (phase) => phase.propConstraint,
  )
  const action = input.actionDirection
  if (
    action.anticipationRequired
    && !roles.includes('anticipation')
  ) return false
  if (
    action.contactRequired
    && !roles.includes('contact')
  ) return false
  if (
    action.followThroughRequired
    && !roles.some(
      (role) => [
        'follow_through',
        'recovery',
      ].includes(role),
    )
  ) return false
  if (
    action.propInteractionRequired
    && (
      !action.handPropContinuityRequired
      || !roles.includes('contact')
      || !props.some(
        (constraint) =>
          constraint !== 'none',
      )
    )
  ) return false
  if (
    [
      'prop_interaction',
      'mechanical_interaction',
    ].includes(action.actionKind)
    && !action.propInteractionRequired
  ) return false
  if (
    action.actionKind === 'impact_or_strike'
    && (
      action.forceProfile !== 'high'
      || !action.anticipationRequired
      || !action.contactRequired
      || !action.followThroughRequired
    )
  ) return false
  if (
    action.actionKind ===
      'emotional_reaction'
    && !roles.some(
      (role) => [
        'reaction_apex',
        'action_apex',
      ].includes(role),
    )
  ) return false
  return true
}

function compilePhase(
  phase: LivingFrameCharacterActionPhaseInput,
  timing: LivingFrameCharacterActionChoreographyInput['authoritativeTimingRef']['keyposeEvents'][number],
): LivingFrameCharacterActionPhaseDirective {
  const draft = {
    order: phase.order,
    phaseId: phase.phaseId,
    role: phase.role,
    semanticPurpose:
      phase.semanticPurpose,
    keyposeSelectionReason:
      phase.keyposeSelectionReason,
    bodyMechanicIntent:
      phase.bodyMechanicIntent,
    propConstraint:
      phase.propConstraint,
    storyTimingFrame: timing.frame,
    minimumHoldFrames:
      timing.minimumHoldFrames,
    transitionToNext:
      structuredClone(
        phase.transitionToNext,
      ),
  }
  return deepFreeze({
    ...draft,
    phaseDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function compileTransition(
  from: LivingFrameCharacterActionPhaseDirective,
  to: LivingFrameCharacterActionPhaseDirective,
): LivingFrameCharacterActionTransitionDirective {
  const transition =
    from.transitionToNext!
  const draft = {
    order: from.order,
    fromPhaseId: from.phaseId,
    toPhaseId: to.phaseId,
    startFrame: from.storyTimingFrame,
    endFrame: to.storyTimingFrame,
    durationFrames:
      to.storyTimingFrame
      - from.storyTimingFrame,
    motionCurve:
      transition.motionCurve,
    timingWithinDirectedRange:
      true as const,
  }
  return deepFreeze({
    ...draft,
    transitionDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function validScope(
  value: LivingFrameCharacterActionChoreographyInput['canonicalScope'],
): boolean {
  return hasExactKeys(value, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'sceneId',
    'componentId',
  ])
    && Object.values(value).every(
      (entry) =>
        typeof entry === 'string'
        && SAFE_ID.test(entry),
    )
}

function validExplanation(
  value: unknown,
): value is string {
  return typeof value === 'string'
    && value.length >= 8
    && value.length <= 360
    && !UNSAFE_TEXT.test(value)
}

function validOptionalExplanation(
  value: unknown,
): value is string {
  return validExplanation(value)
}

function hasExactKeys(
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
    && stableAuthorityStringify(
      Object.keys(value).sort(),
    ) === stableAuthorityStringify(
      [...expected].sort(),
    )
}

function fail(): never {
  throw new Error(
    'Living Frame character action choreography input is invalid.',
  )
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
