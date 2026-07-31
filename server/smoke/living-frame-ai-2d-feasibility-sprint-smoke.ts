import assert from 'node:assert/strict'

import type {
  LivingFrameAi2dCharacterMotionEvidence,
} from '../../src/types/living-frame-ai-2d-character-motion'
import type {
  LivingFrameAi2dFeasibilityScenario,
} from '../../src/types/living-frame-ai-2d-feasibility-sprint'
import type {
  LivingFrameCompleteCharacterKeyposeInput,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameAi2dFeasibilitySprint,
  type CompileLivingFrameAi2dFeasibilityFixtureInput,
  verifyLivingFrameAi2dFeasibilitySprint,
} from '../living-frame/living-frame-ai-2d-feasibility-sprint'
import {
  compileLivingFrameCharacterMotionToolPolicy,
} from '../living-frame/living-frame-character-motion-tool-policy'
import {
  compileLivingFrameCompleteCharacterKeyposePlan,
} from '../living-frame/living-frame-complete-character-keypose-plan'

const toolPolicy =
  compileLivingFrameCharacterMotionToolPolicy()
const fixtures = [
  fixture({
    order: 0,
    scenario:
      'complete_character_prop_interaction',
    slug: 'navigator-spyglass',
    action:
      'The complete navigator raises and settles a spyglass while both hands and the prop remain attached.',
    keyposeCount: 3,
    widthPixels: 1920,
    heightPixels: 1080,
    aspectNumerator: 16,
    aspectDenominator: 9,
  }),
  fixture({
    order: 1,
    scenario:
      'complete_character_meaningful_pose_change',
    slug: 'courier-turn-reveal',
    action:
      'The complete courier turns from guarded posture into a clear reveal pose and settles without anatomy drift.',
    keyposeCount: 4,
    widthPixels: 1080,
    heightPixels: 1920,
    aspectNumerator: 9,
    aspectDenominator: 16,
  }),
  fixture({
    order: 2,
    scenario:
      'complete_character_a_roll_or_documentary_integration',
    slug: 'historian-map-handoff',
    action:
      'The complete illustrated historical figure enters beside the speaker and transfers attention into the approved map.',
    keyposeCount: 3,
    widthPixels: 1920,
    heightPixels: 1080,
    aspectNumerator: 16,
    aspectDenominator: 9,
  }),
] as const

const input = {
  sprintId:
    'sprint.living-frame.ai-2d-character-feasibility.v1',
  toolPolicy,
  fixtures,
}
const sprint =
  compileLivingFrameAi2dFeasibilitySprint(
    input,
  )

assert.equal(
  verifyLivingFrameAi2dFeasibilitySprint(
    sprint,
    input,
  ),
  true,
)
assert.equal(
  sprint.fixturePlans.length,
  3,
)
assert.deepEqual(
  sprint.fixturePlans.map(
    (entry) => entry.scenario,
  ),
  [
    'complete_character_prop_interaction',
    'complete_character_meaningful_pose_change',
    'complete_character_a_roll_or_documentary_integration',
  ],
)
assert.deepEqual(
  sprint.fixturePlans.map(
    (entry) =>
      entry.attemptPolicy
        .maximumTotalKeyposeAttempts,
  ),
  [
    9,
    12,
    9,
  ],
)
assert.equal(
  sprint.fixturePlans.every(
    (entry) =>
      entry.stageState
        .toonCrafterInterpolation ===
          'blocked_until_every_complete_keypose_is_accepted'
      && entry.stageState
        .optionalRifeCadenceSmoothing ===
          'blocked_until_underlying_motion_is_accepted'
      && entry.stageState
        .remotionFinalComposition ===
          'blocked_until_all_required_motion_assets_are_accepted'
      && entry.fixtureDisposition ===
        'pending_private_visual_evidence',
  ),
  true,
)
assert.equal(
  sprint.keepOrDropPolicy
    .currentCharacterAnimationDisposition,
  'disabled_pending_three_fixture_professional_visual_evidence',
)
assert.equal(
  sprint.keepOrDropPolicy
    .allThreeFixturesMustPass,
  true,
)
assert.equal(
  sprint.keepOrDropPolicy
    .fixtureResultsCannotBeAveraged,
  true,
)
assert.equal(
  sprint.reviewProtocol
    .headIntelligenceDispositionRequired,
  true,
)
assert.equal(
  sprint.reviewProtocol
    .userMayReviewEvidenceBeforeKeepDecision,
  true,
)
assert.throws(
  () =>
    compileLivingFrameAi2dFeasibilitySprint({
      ...input,
      fixtures: [
        fixtures[1],
        fixtures[0],
        fixtures[2],
      ],
    }),
  /input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameAi2dFeasibilitySprint({
      ...input,
      fixtures: [
        fixtures[0],
        fixtures[1],
        {
          ...fixtures[2],
          confirmedOutputFrameRef: {
            ...fixtures[2]
              .confirmedOutputFrameRef,
            widthPixels: 1080,
            heightPixels: 1080,
          },
        },
      ],
    }),
  /input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameAi2dFeasibilitySprint({
      ...input,
      fixtures: [
        fixtures[0],
        fixtures[1],
        {
          ...fixtures[2],
          keyposePlan:
            fixtures[1].keyposePlan,
        },
      ],
    }),
  /input is invalid/,
)
assert.equal(
  verifyLivingFrameAi2dFeasibilitySprint({
    ...sprint,
    keepOrDropPolicy: {
      ...sprint.keepOrDropPolicy,
      currentCharacterAnimationDisposition:
        'enabled_without_evidence',
    },
  }, input),
  false,
)
assert.equal(
  sprint.operationRegistered,
  false,
)
assert.equal(
  sprint.dispatchGranted,
  false,
)
assert.equal(
  sprint.runtimeExecuted,
  false,
)
assert.equal(
  sprint.assetCreated,
  false,
)
assert.equal(
  sprint.canonicalQaApproved,
  false,
)
assert.equal(
  sprint.productionReady,
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_ai_2d_feasibility_sprint',
  status: 'passed_source_only',
  fixtureCount:
    sprint.fixturePlans.length,
  scenarios:
    sprint.fixturePlans.map(
      (entry) => entry.scenario,
    ),
  maximumAttempts:
    sprint.fixturePlans.map(
      (entry) =>
        entry.attemptPolicy
          .maximumTotalKeyposeAttempts,
    ),
  currentCharacterAnimationDisposition:
    sprint.keepOrDropPolicy
      .currentCharacterAnimationDisposition,
  allThreeFixturesMustPass:
    sprint.keepOrDropPolicy
      .allThreeFixturesMustPass,
  visualReviewRequiredAtEveryStage:
    sprint.reviewProtocol
      .headIntelligenceDispositionRequired,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function fixture(input: {
  readonly order: 0 | 1 | 2
  readonly scenario:
    LivingFrameAi2dFeasibilityScenario
  readonly slug: string
  readonly action: string
  readonly keyposeCount: 3 | 4
  readonly widthPixels: number
  readonly heightPixels: number
  readonly aspectNumerator: number
  readonly aspectDenominator: number
}): CompileLivingFrameAi2dFeasibilityFixtureInput {
  const evidence =
    strategyEvidence(input)
  const strategy =
    compileLivingFrameAi2dCharacterMotionStrategy(
      evidence,
    )
  const keyposePlanInput = {
    planId:
      `plan.${input.slug}.complete-keyposes.v1`,
    strategy,
    canonicalScope: {
      workspaceId:
        'workspace.internal.living-frame',
      projectId:
        'project.internal.ai-2d-feasibility',
      editSessionId:
        `edit.internal.${input.slug}`,
      sceneId: evidence.sceneId,
      componentId:
        evidence.componentId,
    },
    sourceBindings: {
      approvedSnapshotId:
        `snapshot.${input.slug}.v1`,
      approvedSnapshotHashSha256:
        digestCharacter(input.order, '1'),
      selectedSceneBindingDigestSha256:
        digestCharacter(input.order, '4'),
      currentMasterTimingDigestSha256:
        digestCharacter(input.order, '7'),
      confirmedOutputFrameExpectationDigestSha256:
        digestCharacter(input.order, 'a'),
      completeCharacterSourceArtifactId:
        evidence.sourceArtifactId,
      completeCharacterSourceDigestSha256:
        digestCharacter(input.order, 'd'),
      styleReferenceArtifactId:
        `artifact.${input.slug}.style.v1`,
      styleReferenceDigestSha256:
        digestCharacter(input.order, 'f'),
    },
    keyposes:
      keyposes(
        input.slug,
        input.keyposeCount,
      ),
    }
  const keyposePlan =
    compileLivingFrameCompleteCharacterKeyposePlan(
      keyposePlanInput,
    )
  return {
    order: input.order,
    fixtureId:
      `fixture.${input.slug}.v1`,
    scenario: input.scenario,
    keyposePlan,
    keyposePlanInput,
    expectedActionSummary:
      input.action,
    confirmedOutputFrameRef: {
      id:
        `frame.${input.slug}.v1`,
      widthPixels: input.widthPixels,
      heightPixels: input.heightPixels,
      aspectNumerator:
        input.aspectNumerator,
      aspectDenominator:
        input.aspectDenominator,
      digestSha256:
        digestCharacter(input.order, 'a'),
    },
    masterTimingRef: {
      planId:
        `timing.${input.slug}.v1`,
      segmentId:
        `segment.${input.slug}.v1`,
      startFrame: input.order * 120,
      endFrameExclusive:
        input.order * 120 + 90,
      digestSha256:
        digestCharacter(input.order, '7'),
    },
    styleProfileRef: {
      id:
        `style.${input.slug}.v1`,
      version: 1,
      digestSha256:
        digestCharacter(input.order, 'e'),
    },
    requiredVisualEvidence: [
      `visual.${input.slug}.keyposes`,
      `visual.${input.slug}.motion`,
      `visual.${input.slug}.composite`,
    ],
  }
}

function strategyEvidence(input: {
  readonly order: 0 | 1 | 2
  readonly slug: string
  readonly action: string
  readonly keyposeCount: 3 | 4
}): LivingFrameAi2dCharacterMotionEvidence {
  return {
    evidenceId:
      `evidence.${input.slug}.v1`,
    sceneId:
      `scene.${input.slug}.v1`,
    componentId:
      `character.${input.slug}.v1`,
    sourceArtifactId:
      `artifact.${input.slug}.complete-character.v1`,
    illustrativeNotArchivalEvidence:
      true,
    requestedMotionMagnitude:
      input.keyposeCount === 4
        ? 'large_pose_change'
        : 'moderate_pose_change',
    requestedActionSummary:
      input.action,
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
      input.order === 0,
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
    priorRejectedVisualProofRefs:
      input.order === 0
        ? [
          'proof.airship.blender-remotion.visual-rejected.v1',
        ]
        : [],
    rawChatPromptPathUrlModelCodeOrBytesIncluded:
      false,
  }
}

function keyposes(
  slug: string,
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
        `artifact.${slug}.pose.${role}.v1`,
      poseControlDigestSha256:
        [
          '2',
          '5',
          '8',
          'b',
        ][order]!.repeat(64),
      approvedWorkItemId:
        `work.${slug}.pose.${role}.v1`,
      plannedAssetManifestEntryId:
        `asset.${slug}.pose.${role}.v1`,
      outputKey:
        `output.${slug}.pose.${role}.v1`,
      actionDescription:
        `Render the complete coherent ${slug} character in the ${role} pose with stable anatomy identity costume and attachments.`,
    }),
  )
}

function digestCharacter(
  order: 0 | 1 | 2,
  base: string,
): string {
  const character = [
    base,
    String.fromCharCode(
      base.charCodeAt(0) + 1,
    ),
    String.fromCharCode(
      base.charCodeAt(0) + 2,
    ),
  ][order]!
  return /^[a-f0-9]$/u.test(character)
    ? character.repeat(64)
    : '0'.repeat(64)
}
