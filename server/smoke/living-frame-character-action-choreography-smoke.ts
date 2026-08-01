import assert from 'node:assert/strict'

import type {
  LivingFrameAi2dCharacterMotionEvidence,
} from '../../src/types/living-frame-ai-2d-character-motion'
import type {
  LivingFrameCharacterActionChoreographyInput,
} from '../../src/types/living-frame-character-action-choreography'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameCharacterActionChoreography,
  verifyLivingFrameCharacterActionChoreography,
} from '../living-frame/living-frame-character-action-choreography'

const strategy =
  compileLivingFrameAi2dCharacterMotionStrategy(
    evidence(),
  )
const timingDraft = {
  sourceOwner: 'StoryTiming' as const,
  artifactId:
    'timing.airship.raise-spyglass.v1',
  version: 1,
  masterTimingPlanId:
    'master-timing.airship.v1',
  masterTimingDigestSha256:
    '1'.repeat(64),
  segmentId:
    'segment.airship.raise-spyglass',
  actionStartFrame: 100,
  actionEndFrameExclusive: 140,
  keyposeEvents: [
    {
      phaseId: 'phase.start',
      role: 'start' as const,
      frame: 100,
      minimumHoldFrames: 1,
    },
    {
      phaseId: 'phase.anticipation',
      role: 'anticipation' as const,
      frame: 105,
      minimumHoldFrames: 1,
    },
    {
      phaseId: 'phase.contact',
      role: 'contact' as const,
      frame: 112,
      minimumHoldFrames: 2,
    },
    {
      phaseId: 'phase.settle',
      role: 'settle' as const,
      frame: 126,
      minimumHoldFrames: 6,
    },
  ],
}
const authoritativeTimingRef = {
  ...timingDraft,
  digestSha256:
    sha256AuthorityValue(timingDraft),
}
const input:
  LivingFrameCharacterActionChoreographyInput = {
    choreographyId:
      'choreography.airship.raise-spyglass.v1',
    strategy,
    canonicalScope: {
      workspaceId:
        'workspace.internal.living-frame',
      projectId:
        'project.internal.ai-2d-feasibility',
      editSessionId:
        'edit.internal.airship-action',
      sceneId: strategy.evidence.sceneId,
      componentId:
        strategy.evidence.componentId,
    },
    actionDirection: {
      actionKind: 'prop_interaction',
      actionSummary:
        strategy.evidence.requestedActionSummary,
      forceProfile: 'medium',
      anticipationRequired: true,
      contactRequired: true,
      followThroughRequired: false,
      propInteractionRequired: true,
      centerOfMassContinuityRequired:
        true,
      handPropContinuityRequired: true,
      identityCostumeAndAttachmentContinuityRequired:
        true,
      selectedKeyposeCountProfessionallySufficientForAction:
        true,
      headIntelligenceActionMechanicsReviewPerformed:
        true,
    },
    phases: [
      {
        order: 0,
        phaseId: 'phase.start',
        role: 'start',
        semanticPurpose:
          'Establish the navigator holding the spyglass below eye level before the action begins.',
        keyposeSelectionReason:
          'This pose defines the initial silhouette hand placement and prop orientation.',
        bodyMechanicIntent:
          'Keep weight centered with elbows relaxed and shoulders level.',
        propConstraint:
          'maintain_prop_contact',
        transitionToNext: {
          minimumFrames: 4,
          maximumFrames: 6,
          motionCurve: 'restrained_ease',
        },
      },
      {
        order: 1,
        phaseId: 'phase.anticipation',
        role: 'anticipation',
        semanticPurpose:
          'Lift the elbows and rotate the torso slightly before raising the spyglass.',
        keyposeSelectionReason:
          'The anticipatory pose makes the following prop movement feel intentional and weighted.',
        bodyMechanicIntent:
          'Shift the upper body toward the sightline while preserving balanced hips and shoulders.',
        propConstraint: 'grasp_prop',
        transitionToNext: {
          minimumFrames: 6,
          maximumFrames: 8,
          motionCurve:
            'accelerate_to_contact',
        },
      },
      {
        order: 2,
        phaseId: 'phase.contact',
        role: 'contact',
        semanticPurpose:
          'Seat the spyglass at the eye with both hands visibly supporting the prop.',
        keyposeSelectionReason:
          'This contact pose carries the narrative action and must preserve hand eye and prop alignment.',
        bodyMechanicIntent:
          'Align head neck shoulders wrists and sightline without stretching the arms.',
        propConstraint:
          'maintain_prop_contact',
        transitionToNext: {
          minimumFrames: 12,
          maximumFrames: 16,
          motionCurve:
            'decelerate_into_hold',
        },
      },
      {
        order: 3,
        phaseId: 'phase.settle',
        role: 'settle',
        semanticPurpose:
          'Hold the observation pose with a stable silhouette after the spyglass reaches the eye.',
        keyposeSelectionReason:
          'The settled pose gives the audience time to read the completed action before the next beat.',
        bodyMechanicIntent:
          'Maintain the final center of mass and avoid drifting limbs clothing or prop attachment.',
        propConstraint:
          'maintain_prop_contact',
        transitionToNext: null,
      },
    ],
    authoritativeTimingRef,
    uniformSpacingJustification: null,
    containsRawChatPromptPathUrlModelBytesCredentialCommandOrEnvironment:
      false,
  }

const choreography =
  compileLivingFrameCharacterActionChoreography(
    input,
  )

assert.equal(
  verifyLivingFrameCharacterActionChoreography(
    choreography,
    input,
  ),
  true,
)
assert.deepEqual(
  choreography.phaseDirectives.map(
    (phase) => phase.role,
  ),
  [
    'start',
    'anticipation',
    'contact',
    'settle',
  ],
)
assert.deepEqual(
  choreography.timingAnalysis
    .transitionDurationsFrames,
  [
    5,
    7,
    14,
  ],
)
assert.equal(
  choreography.timingAnalysis
    .uniformSpacingDetected,
  false,
)
assert.equal(
  choreography.timingAnalysis
    .exactFramesOwnedByStoryTiming,
  true,
)
assert.equal(
  choreography.gatingPolicy
    .genericStartMiddleEndPlanningForbidden,
  true,
)
assert.equal(
  choreography.gatingPolicy
    .actionMustBeReroutedWhenSelectedKeyposeCountCannotExpressMechanics,
  true,
)
assert.equal(
  choreography.gatingPolicy
    .technicalTimingChecksCannotApproveProfessionalMotion,
  true,
)

assert.throws(
  () =>
    compileLivingFrameCharacterActionChoreography({
      ...input,
      actionDirection: {
        ...input.actionDirection,
        selectedKeyposeCountProfessionallySufficientForAction:
          false as true,
      },
    }),
  /choreography input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCharacterActionChoreography({
      ...input,
      phases: input.phases.map(
        (phase) => phase.role === 'contact'
          ? {
            ...phase,
            role: 'action_apex' as const,
          }
          : phase,
      ),
    }),
  /choreography input is invalid/,
)
assert.throws(
  () => {
    const uniformTimingDraft = {
      ...timingDraft,
      keyposeEvents:
        timingDraft.keyposeEvents.map(
          (event, order) => ({
            ...event,
            frame: 100 + order * 8,
          }),
        ),
    }
    return compileLivingFrameCharacterActionChoreography({
      ...input,
      authoritativeTimingRef: {
        ...uniformTimingDraft,
        digestSha256:
          sha256AuthorityValue(
            uniformTimingDraft,
          ),
      },
    })
  },
  /choreography input is invalid/,
)
assert.equal(
  verifyLivingFrameCharacterActionChoreography(
    choreography,
    {
      ...input,
      authoritativeTimingRef: {
        ...authoritativeTimingRef,
        digestSha256: 'f'.repeat(64),
      },
    },
  ),
  false,
)
assert.throws(
  () =>
    compileLivingFrameCharacterActionChoreography({
      ...input,
      phases: input.phases.map(
        (phase, order) => order === 1
          ? {
            ...phase,
            semanticPurpose:
              'Fetch https://untrusted.example/pose',
          }
          : phase,
      ),
    }),
  /choreography input is invalid/,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_action_choreography',
  status: 'passed_source_only',
  actionKind:
    choreography.actionDirection.actionKind,
  keyposeRoles:
    choreography.phaseDirectives.map(
      (phase) => phase.role,
    ),
  storyTimingFrames:
    choreography.phaseDirectives.map(
      (phase) => phase.storyTimingFrame,
    ),
  transitionDurationsFrames:
    choreography.timingAnalysis
      .transitionDurationsFrames,
  uniformSpacingDetected:
    choreography.timingAnalysis
      .uniformSpacingDetected,
  genericStartMiddleEndPlanningForbidden:
    choreography.gatingPolicy
      .genericStartMiddleEndPlanningForbidden,
  exactFramesOwnedByStoryTiming:
    choreography.timingAnalysis
      .exactFramesOwnedByStoryTiming,
  technicalTimingChecksCanApproveProfessionalMotion:
    false,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function evidence():
LivingFrameAi2dCharacterMotionEvidence {
  return {
    evidenceId:
      'evidence.airship.action-choreography.v1',
    sceneId:
      'scene.airship-navigator.spyglass-survey',
    componentId:
      'airship.navigator.character',
    sourceArtifactId:
      'artifact.airship.navigator.complete-character-reference.v1',
    illustrativeNotArchivalEvidence:
      true,
    requestedMotionMagnitude:
      'large_pose_change',
    requestedActionSummary:
      'Raise the spyglass to the eye while preserving believable hand prop and body mechanics.',
    completeCharacterReferenceAvailable:
      true,
    styleReferenceAvailable: true,
    poseControlAvailable: true,
    requiresNewPixelsOrHiddenAnatomy:
      true,
    continuousNaturalMotionRequired:
      false,
    restrainedRigidMotionPreservesSilhouette:
      false,
    professionallyAuthoredOpenToonzRigAvailable:
      false,
    professionallyAuthoredBlenderRigAvailable:
      false,
    visibleJointHardwarePresent:
      false,
    jointSeamsConcealedAcrossPoseRange:
      false,
    anatomicalProportionsReviewedAcrossPoseRange:
      false,
    handPropAttachmentReviewedAcrossPoseRange:
      false,
    secondaryPartsAnchoredAcrossPoseRange:
      false,
    protectedFaceAndIdentityRegionsDefined:
      true,
    priorRejectedVisualProofRefs: [
      'proof.airship.blender-remotion.visual-rejected.v1',
    ],
    rawChatPromptPathUrlModelCodeOrBytesIncluded:
      false,
  }
}
