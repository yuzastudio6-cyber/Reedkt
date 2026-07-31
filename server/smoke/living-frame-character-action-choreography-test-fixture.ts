import type {
  LivingFrameAi2dCharacterMotionStrategyRecord,
} from '../../src/types/living-frame-ai-2d-character-motion'
import type {
  LivingFrameCharacterActionChoreographyInput,
  LivingFrameCharacterActionKind,
} from '../../src/types/living-frame-character-action-choreography'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export function actionChoreographyTestInput(
  input: {
    readonly slug: string
    readonly strategy:
      LivingFrameAi2dCharacterMotionStrategyRecord
    readonly canonicalScope:
      LivingFrameCharacterActionChoreographyInput['canonicalScope']
    readonly masterTimingDigestSha256:
      string
    readonly masterTimingPlanId?: string
    readonly segmentId?: string
    readonly actionStartFrame?: number
    readonly actionKind?:
      LivingFrameCharacterActionKind
    readonly relativeFrames?:
      readonly number[]
  },
): LivingFrameCharacterActionChoreographyInput {
  const actionKind =
    input.actionKind ?? 'directed_gesture'
  const propInteraction = [
    'prop_interaction',
    'mechanical_interaction',
  ].includes(actionKind)
  const roles = input.strategy.decision
    .completeKeyposeCount === 4
    ? propInteraction
      ? [
        'start',
        'anticipation',
        'contact',
        'settle',
      ] as const
      : [
        'start',
        'anticipation',
        'action_apex',
        'settle',
      ] as const
    : propInteraction
      ? [
        'start',
        'contact',
        'settle',
      ] as const
      : [
        'start',
        'action_apex',
        'settle',
      ] as const
  const baseFrames =
    input.relativeFrames
    ?? (
      roles.length === 4
        ? [
          0,
          5,
          12,
          26,
        ]
        : [
          0,
          5,
          16,
        ]
    )
  if (
    baseFrames.length !== roles.length
    || baseFrames.some(
      (frame, order) =>
        !Number.isSafeInteger(frame)
        || frame < 0
        || (
          order > 0
          && frame <= baseFrames[order - 1]!
        ),
    )
  ) {
    throw new Error(
      'Action choreography test frames are invalid.',
    )
  }
  const actionStartFrame =
    input.actionStartFrame ?? 0
  const frames = baseFrames.map(
    (frame) => frame + actionStartFrame,
  )
  const phases = roles.map(
    (role, order) => ({
      order,
      phaseId:
        `phase.${input.slug}.${role}`,
      role,
      semanticPurpose:
        `Show the complete ${input.slug} character at the action-specific ${role} phase.`,
      keyposeSelectionReason:
        `The ${role} phase changes the readable silhouette or narrative state and cannot be inferred safely from a generic midpoint.`,
      bodyMechanicIntent:
        `Preserve believable balance anatomy clothing and attachment continuity through the ${role} phase.`,
      propConstraint:
        propInteraction
          ? 'maintain_prop_contact' as const
          : 'none' as const,
      transitionToNext:
        order === roles.length - 1
          ? null
          : {
            minimumFrames:
              frames[order + 1]!
              - frames[order]!,
            maximumFrames:
              frames[order + 1]!
              - frames[order]!
              + 2,
            motionCurve:
              roles[order + 1] ===
                'contact'
                ? 'accelerate_to_contact' as const
                : roles[order + 1] ===
                    'settle'
                  ? 'decelerate_into_hold' as const
                  : 'restrained_ease' as const,
          },
    }),
  )
  const timingDraft = {
    sourceOwner: 'StoryTiming' as const,
    artifactId:
      `timing.${input.slug}.action.v1`,
    version: 1,
    masterTimingPlanId:
      input.masterTimingPlanId
      ?? `master-timing.${input.slug}.v1`,
    masterTimingDigestSha256:
      input.masterTimingDigestSha256,
    segmentId:
      input.segmentId
      ?? `segment.${input.slug}.action`,
    actionStartFrame,
    actionEndFrameExclusive:
      frames.at(-1)! + 10,
    keyposeEvents: phases.map(
      (phase, order) => ({
        phaseId: phase.phaseId,
        role: phase.role,
        frame: frames[order]!,
        minimumHoldFrames:
          order === phases.length - 1
            ? 4
            : 1,
      }),
    ),
  }
  return {
    choreographyId:
      `choreography.${input.slug}.v1`,
    strategy: input.strategy,
    canonicalScope: input.canonicalScope,
    actionDirection: {
      actionKind,
      actionSummary:
        input.strategy.evidence
          .requestedActionSummary,
      forceProfile: 'medium',
      anticipationRequired:
        roles.length === 4,
      contactRequired: propInteraction,
      followThroughRequired: false,
      propInteractionRequired:
        propInteraction,
      centerOfMassContinuityRequired:
        true,
      handPropContinuityRequired:
        propInteraction,
      identityCostumeAndAttachmentContinuityRequired:
        true,
      selectedKeyposeCountProfessionallySufficientForAction:
        true,
      headIntelligenceActionMechanicsReviewPerformed:
        true,
    },
    phases,
    authoritativeTimingRef: {
      ...timingDraft,
      digestSha256:
        sha256AuthorityValue(timingDraft),
    },
    uniformSpacingJustification: null,
    containsRawChatPromptPathUrlModelBytesCredentialCommandOrEnvironment:
      false,
  }
}
