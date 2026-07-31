import assert from 'node:assert/strict'

import type {
  LivingFrameAi2dCharacterMotionEvidence,
} from '../../src/types/living-frame-ai-2d-character-motion'
import type {
  LivingFrameCompleteCharacterKeyposeInput,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameCompleteCharacterKeyposePlan,
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
  verifyLivingFrameCompleteCharacterKeyposePlan,
} from '../living-frame/living-frame-complete-character-keypose-plan'

const strategy =
  compileLivingFrameAi2dCharacterMotionStrategy(
    strategyEvidence(),
  )
const input = planInput(
  strategy,
  keyposes(3),
)
const plan =
  compileLivingFrameCompleteCharacterKeyposePlan(
    input,
  )

assert.equal(
  plan.selectedStrategy,
  'ai_2d_complete_keyposes',
)
assert.equal(
  plan.keyposeUnits.length,
  3,
)
assert.deepEqual(
  plan.keyposeUnits.map(
    (unit) => unit.role,
  ),
  [
    'start',
    'action_apex',
    'settle',
  ],
)
assert.equal(
  plan.keyposeUnits.every(
    (unit) =>
      unit.characterIntegrity
        .completeCharacterRequired
      && unit.characterIntegrity
        .detachedLimbOutputForbidden
      && unit.characterIntegrity
        .visiblePuppetJointOutputForbidden
      && unit.generationRoute
        .oneSupervisedGpuAttempt
      && unit.generationRoute
        .exactModelRoleCount === 5
      && unit.generationCanvas
        .widthPixels === 1024
      && unit.generationCanvas
        .heightPixels === 1024
      && !unit.generationCanvas
        .finalCanvasCreatedByGenerationTool,
  ),
  true,
)
assert.equal(
  plan.sequencePolicy
    .interpolationBlockedUntilEveryPoseAccepted,
  true,
)
assert.equal(
  plan.sequencePolicy
    .toonCrafterEvaluationMayBegin,
  false,
)
assert.equal(
  plan.sequencePolicy
    .rifeEvaluationMayBegin,
  false,
)
assert.equal(
  plan.sequencePolicy
    .remotionFinalCompositionMayBegin,
  false,
)
assert.equal(
  verifyLivingFrameCompleteCharacterKeyposePlan(
    plan,
    input,
  ),
  true,
)
assert.equal(
  verifyLivingFrameCompleteCharacterKeyposePlan({
    ...plan,
    keyposeUnits:
      plan.keyposeUnits.map(
        (unit, index) =>
          index === 1
            ? {
              ...unit,
              characterIntegrity: {
                ...unit.characterIntegrity,
                detachedLimbOutputForbidden:
                  false,
              },
            }
            : unit,
      ),
  }, input),
  false,
)

assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposePlan({
      ...input,
      keyposes: [
        input.keyposes[0]!,
        {
          ...input.keyposes[1]!,
          role: 'settle',
        },
        input.keyposes[2]!,
      ],
    }),
  /order or role is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposePlan({
      ...input,
      sourceBindings: {
        ...input.sourceBindings,
        completeCharacterSourceArtifactId:
          'artifact.cross-scene.character',
      },
    }),
  /strategy lineage is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposePlan({
      ...input,
      keyposes:
        input.keyposes.map(
          (keypose, index) =>
            index === 1
              ? {
                ...keypose,
                actionDescription:
                  'Load https://untrusted.example/pose',
              }
              : keypose,
        ),
    }),
  /input is invalid/,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_complete_character_keypose_plan',
  status: 'passed_source_only',
  selectedStrategy:
    plan.selectedStrategy,
  keyposeRoles:
    plan.keyposeUnits.map(
      (unit) => unit.role,
    ),
  everyPoseCompleteCharacter:
    plan.sequencePolicy
      .everyPoseIsCompleteCharacter,
  independentPerFrameGenerationForbidden:
    plan.sequencePolicy
      .independentPerFrameGenerationForbidden,
  interpolationMayBegin:
    plan.sequencePolicy
      .toonCrafterEvaluationMayBegin,
  comfyUiHostIdentityCount: 1,
  modelRolesInsideAttempt: 5,
  finalCanvasOwner: 'remotion',
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function planInput(
  resolvedStrategy:
    ReturnType<
      typeof compileLivingFrameAi2dCharacterMotionStrategy
    >,
  resolvedKeyposes:
    readonly LivingFrameCompleteCharacterKeyposeInput[],
): CreateLivingFrameCompleteCharacterKeyposePlanInput {
  return {
    planId:
      'plan.airship.complete-keyposes.v1',
    strategy: resolvedStrategy,
    canonicalScope: {
      workspaceId:
        'workspace.internal.living-frame',
      projectId:
        'project.internal.ai-2d-feasibility',
      editSessionId:
        'edit.internal.airship-keyposes',
      sceneId:
        resolvedStrategy.evidence.sceneId,
      componentId:
        resolvedStrategy.evidence
          .componentId,
    },
    sourceBindings: {
      approvedSnapshotId:
        'approved-snapshot.internal.airship-keyposes.v1',
      approvedSnapshotHashSha256:
        '1'.repeat(64),
      selectedSceneBindingDigestSha256:
        '2'.repeat(64),
      currentMasterTimingDigestSha256:
        '3'.repeat(64),
      confirmedOutputFrameExpectationDigestSha256:
        '4'.repeat(64),
      completeCharacterSourceArtifactId:
        resolvedStrategy.evidence
          .sourceArtifactId,
      completeCharacterSourceDigestSha256:
        '5'.repeat(64),
      styleReferenceArtifactId:
        'artifact.airship.style-reference.v1',
      styleReferenceDigestSha256:
        '6'.repeat(64),
    },
    keyposes: resolvedKeyposes,
  }
}

function keyposes(
  count: 3 | 4,
): readonly LivingFrameCompleteCharacterKeyposeInput[] {
  const roles = count === 3
    ? [
      'start',
      'action_apex',
      'settle',
    ] as const
    : [
      'start',
      'anticipation',
      'action_apex',
      'settle',
    ] as const
  return roles.map(
    (role, order) => ({
      order,
      role,
      poseControlArtifactId:
        `artifact.airship.pose-control.${role}.v1`,
      poseControlDigestSha256:
        [
          '7',
          '8',
          '9',
          'a',
        ][order]!.repeat(64),
      approvedWorkItemId:
        `work.airship.complete-keypose.${role}.v1`,
      plannedAssetManifestEntryId:
        `asset-plan.airship.complete-keypose.${role}.v1`,
      outputKey:
        `output.airship.complete-keypose.${role}.v1`,
      actionDescription:
        `Render one coherent complete character in the ${role} pose while preserving identity clothing anatomy hands and spyglass attachment.`,
    }),
  )
}

function strategyEvidence():
LivingFrameAi2dCharacterMotionEvidence {
  return {
    evidenceId:
      'evidence.airship.complete-keyposes.v1',
    sceneId:
      'scene.airship-navigator.spyglass-survey',
    componentId:
      'airship.navigator.character',
    sourceArtifactId:
      'artifact.airship.navigator.complete-character-reference.v1',
    illustrativeNotArchivalEvidence:
      true,
    requestedMotionMagnitude:
      'moderate_pose_change',
    requestedActionSummary:
      'Raise the spyglass while preserving one coherent illustrated character.',
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
      true,
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
