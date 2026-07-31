import assert from 'node:assert/strict'

import type {
  LivingFrameAi2dCharacterMotionEvidence,
} from '../../src/types/living-frame-ai-2d-character-motion'
import type {
  LivingFrameAi2dFeasibilityScenario,
} from '../../src/types/living-frame-ai-2d-feasibility-sprint'
import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS,
  type LivingFrameCompleteCharacterKeyposeCheck,
} from '../../src/types/living-frame-complete-character-keypose-review'
import type {
  LivingFrameCompleteCharacterKeyposeInput,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameAi2dFeasibilitySprint,
  type CompileLivingFrameAi2dFeasibilityFixtureInput,
} from '../living-frame/living-frame-ai-2d-feasibility-sprint'
import {
  compileLivingFrameAi2dInterpolationQualification,
} from '../living-frame/living-frame-ai-2d-interpolation-qualification'
import {
  compileLivingFrameCharacterMotionToolPolicy,
} from '../living-frame/living-frame-character-motion-tool-policy'
import {
  compileLivingFrameCompleteCharacterInterpolationAdmission,
  verifyLivingFrameCompleteCharacterInterpolationAdmission,
} from '../living-frame/living-frame-complete-character-interpolation-admission'
import {
  compileLivingFrameCompleteCharacterKeyposePlan,
} from '../living-frame/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameCompleteCharacterKeyposeReview,
  compileLivingFrameCompleteCharacterKeyposeReviewSet,
} from '../living-frame/living-frame-complete-character-keypose-review'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const fixtures = [
  fixture({
    order: 0,
    scenario:
      'complete_character_prop_interaction',
    slug: 'navigator-spyglass-admission',
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
    slug: 'courier-turn-admission',
    action:
      'The complete courier turns into a reveal pose while anatomy clothing and identity remain stable.',
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
    slug: 'historian-map-admission',
    action:
      'The complete illustrated historian enters beside the speaker and transfers attention into the map.',
    keyposeCount: 3,
    widthPixels: 1920,
    heightPixels: 1080,
    aspectNumerator: 16,
    aspectDenominator: 9,
  }),
] as const
const sprintInput = {
  sprintId:
    'sprint.living-frame.ai-2d.interpolation-admission.v1',
  toolPolicy:
    compileLivingFrameCharacterMotionToolPolicy(),
  fixtures,
}
const sprint =
  compileLivingFrameAi2dFeasibilitySprint(
    sprintInput,
  )
const keyposePlan = fixtures[0].keyposePlan
const acceptedReviews = keyposePlan.keyposeUnits.map(
  (unit) =>
    compileLivingFrameCompleteCharacterKeyposeReview(
      reviewRequest(
        unit,
        allPassChecks(unit.role),
      ),
    ),
)
const reviewSetInput = {
  setId:
    'review-set.navigator.interpolation-admission.v1',
  keyposePlan,
  keyposePlanInput:
    fixtures[0].keyposePlanInput,
  reviews: acceptedReviews,
}
const reviewSet =
  compileLivingFrameCompleteCharacterKeyposeReviewSet(
    reviewSetInput,
  )
const qualification =
  compileLivingFrameAi2dInterpolationQualification()
const timingRefDraft = {
  sourceOwner: 'StoryTiming' as const,
  artifactId:
    'timing-artifact.navigator.accepted-keyposes.v1',
  version: 1,
  masterTimingPlanId:
    fixtures[0].masterTimingRef.planId,
  masterTimingDigestSha256:
    fixtures[0].masterTimingRef
      .digestSha256,
  segmentId:
    fixtures[0].masterTimingRef.segmentId,
  keyposes:
    keyposePlan.keyposeUnits.map(
      (unit, order) => ({
        keyposeUnitId:
          unit.keyposeUnitId,
        role: unit.role,
        frame: [
          0,
          8,
          16,
        ][order]!,
      }),
    ),
}
const timingRef = {
  ...timingRefDraft,
  digestSha256:
    sha256AuthorityValue(
      timingRefDraft,
    ),
}
const admissionInput = {
  admissionId:
    'admission.navigator.tooncrafter.v1',
  sprint,
  sprintInput,
  fixtureId: fixtures[0].fixtureId,
  reviewSet,
  reviewSetInput,
  qualification,
  authoritativeKeyposeTimingRef:
    timingRef,
}
const admission =
  compileLivingFrameCompleteCharacterInterpolationAdmission(
    admissionInput,
  )

assert.equal(
  verifyLivingFrameCompleteCharacterInterpolationAdmission(
    admission,
    admissionInput,
  ),
  true,
)
assert.equal(
  admission.transitionUnits.length,
  keyposePlan.keyposeUnits.length - 1,
)
assert.deepEqual(
  admission.transitionUnits.map(
    (unit) =>
      unit.requestedMotionSpanFrames,
  ),
  [
    8,
    8,
  ],
)
assert.equal(
  admission.transitionUnits.every(
    (unit) =>
      unit.route.proposedToolId ===
        'tooncrafter'
      && unit.route
        .acceptedCompleteKeyposeInputsOnly
      && unit.route.serverOwnedSeedRequired
      && unit.route
        .serverDerivedMotionPromptRequired
      && !unit.route
        .callerSeedPromptModelDimensionsPathsUrlsBytesCredentialsCommandsOrEnvironmentAllowed
      && !unit.outputPolicy
        .alphaOrTransparencyAssumed
      && !unit.outputPolicy
        .anatomyIdentityOrAttachmentRepairClaimAllowed
      && !unit.outputPolicy
        .finalCanvasClaimAllowed
      && unit.outputPolicy
        .remotionOwnsFinalCanvas,
  ),
  true,
)
assert.equal(
  admission.sequencingPolicy
    .everyInputKeyposeProfessionallyAccepted,
  true,
)
assert.equal(
  admission.sequencingPolicy
    .interpolationCannotBeginUntilToonCrafterQualificationReleased,
  true,
)
assert.equal(
  admission.admissionState,
  'source_only_candidate_blocked_pending_tooncrafter_release_and_private_runtime',
)
assert.equal(
  admission.canonicalScope.workspaceId,
  keyposePlan.canonicalScope.workspaceId,
)
assert.equal(
  admission.sourceBindings
    .approvedSnapshotHashSha256,
  keyposePlan.sourceBindings
    .approvedSnapshotHashSha256,
)

const repairReview =
  compileLivingFrameCompleteCharacterKeyposeReview({
    ...reviewRequest(
      keyposePlan.keyposeUnits[1]!,
      allPassChecks(
        keyposePlan.keyposeUnits[1]!.role,
      ),
    ),
    checks: checksWithFailure(
      keyposePlan.keyposeUnits[1]!.role,
      'hand_and_prop_attachment',
    ),
  })
const repairSetInput = {
  ...reviewSetInput,
  setId:
    'review-set.navigator.repair.interpolation-admission.v1',
  reviews: [
    acceptedReviews[0]!,
    repairReview,
    acceptedReviews[2]!,
  ],
}
const repairSet =
  compileLivingFrameCompleteCharacterKeyposeReviewSet(
    repairSetInput,
  )
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      reviewSet: repairSet,
      reviewSetInput: repairSetInput,
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      authoritativeKeyposeTimingRef: {
        ...timingRef,
        digestSha256: '0'.repeat(64),
      },
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      fixtureId: fixtures[1].fixtureId,
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      authoritativeKeyposeTimingRef: {
        ...timingRef,
        sourceOwner:
          'LivingFrame' as 'StoryTiming',
      },
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      authoritativeKeyposeTimingRef: {
        ...timingRef,
        keyposes:
          timingRef.keyposes.map(
            (entry, order) => ({
              ...entry,
              frame: [
                0,
                16,
                8,
              ][order]!,
            }),
          ),
      },
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      qualification: {
        ...qualification,
        candidates:
          qualification.candidates.map(
            (candidate, order) =>
              order === 0
                ? {
                  ...candidate,
                  operationRegistered:
                    true as const,
                }
                : candidate,
          ),
      } as unknown as typeof qualification,
    }),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      callerSeed: 42,
    } as unknown as typeof admissionInput),
  /admission input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterInterpolationAdmission({
      ...admissionInput,
      dimensions: {
        width: 1024,
        height: 1024,
      },
    } as unknown as typeof admissionInput),
  /admission input is invalid/,
)
assert.equal(admission.operationRegistered, false)
assert.equal(admission.dispatchGranted, false)
assert.equal(admission.runtimeExecuted, false)
assert.equal(admission.assetCreated, false)
assert.equal(admission.canonicalQaApproved, false)
assert.equal(admission.productionReady, false)

console.log(JSON.stringify({
  smoke:
    'living_frame_complete_character_interpolation_admission',
  status: 'passed_source_only',
  admissionState:
    admission.admissionState,
  transitionCount:
    admission.transitionUnits.length,
  transitionSpans:
    admission.transitionUnits.map(
      (unit) =>
        unit.requestedMotionSpanFrames,
    ),
  everyInputKeyposeProfessionallyAccepted:
    admission.sequencingPolicy
      .everyInputKeyposeProfessionallyAccepted,
  storyTimingOwnsFrames: true,
  storyTimingFrameListContentAddressed: true,
  approvedSnapshotLineageBound: true,
  toonCrafterReleased: false,
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
  const evidence = strategyEvidence(input)
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
        'project.internal.ai-2d-interpolation-admission',
      editSessionId:
        `edit.internal.${input.slug}`,
      sceneId: evidence.sceneId,
      componentId: evidence.componentId,
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
    expectedActionSummary: input.action,
    confirmedOutputFrameRef: {
      id: `frame.${input.slug}.v1`,
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
      planId: `timing.${input.slug}.v1`,
      segmentId:
        `segment.${input.slug}.v1`,
      startFrame: input.order * 120,
      endFrameExclusive:
        input.order * 120 + 90,
      digestSha256:
        digestCharacter(input.order, '7'),
    },
    styleProfileRef: {
      id: `style.${input.slug}.v1`,
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
    evidenceId: `evidence.${input.slug}.v1`,
    sceneId: `scene.${input.slug}.v1`,
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
    requestedActionSummary: input.action,
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

function reviewRequest(
  unit:
    (typeof keyposePlan.keyposeUnits)[number],
  checks:
    readonly LivingFrameCompleteCharacterKeyposeCheck[],
) {
  const artifactId =
    `artifact.interpolation.${unit.role}.private.v1`
  const artifactSha256 =
    reviewDigest(unit.order, 'a')
  return {
    reviewId:
      `review.interpolation.${unit.role}.v1`,
    keyposePlanRef: {
      planId: keyposePlan.planId,
      version: keyposePlan.contractVersion,
      digestSha256:
        keyposePlan.planDigestSha256,
    },
    keyposeUnitRef: {
      unitId: unit.keyposeUnitId,
      unitDigestSha256:
        unit.keyposeUnitDigestSha256,
      order: unit.order,
      role: unit.role,
    },
    privateArtifact: {
      artifactId,
      approvedWorkItemId:
        unit.approvedWorkItemId,
      plannedAssetManifestEntryId:
        unit.plannedAssetManifestEntryId,
      outputKey: unit.outputKey,
      privateObjectIdentityHash:
        reviewDigest(unit.order, '7'),
      contentType: 'image/png' as const,
      byteLength: 120_000 + unit.order,
      sha256: artifactSha256,
      widthPixels: 1024 as const,
      heightPixels: 1024 as const,
      actualDecodedImageInspected:
        true as const,
      sourceBytesIncludedInReviewRecord:
        false as const,
    },
    technicalImageQaRef: {
      version: 1,
      digestSha256:
        reviewDigest(unit.order, 'd'),
      artifactId,
      artifactSha256,
      decodePassed: true,
      expectedDimensionsPassed: true,
      noUnexpectedCropPassed: true,
    },
    headIntelligenceActualImageInspectionPerformed:
      true as const,
    checks,
  }
}

function allPassChecks(
  role: string,
): readonly LivingFrameCompleteCharacterKeyposeCheck[] {
  return LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS.map(
    (checkId) => ({
      checkId,
      outcome: 'pass' as const,
      observationSummary:
        `The ${role} pose passes ${checkId} visual inspection.`,
      evidenceRefIds: [
        `visual.interpolation.${role}.${checkId}`,
      ],
    }),
  )
}

function checksWithFailure(
  role: string,
  failedId:
    LivingFrameCompleteCharacterKeyposeCheck['checkId'],
): readonly LivingFrameCompleteCharacterKeyposeCheck[] {
  return allPassChecks(role).map(
    (check) => check.checkId === failedId
      ? {
        ...check,
        outcome:
          'repairable_failure' as const,
        observationSummary:
          `The ${role} pose requires repair for ${failedId}.`,
      }
      : check,
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

function reviewDigest(
  order: number,
  first: '7' | 'a' | 'd',
): string {
  const rows = {
    '7': ['7', '8', '9'],
    a: ['a', 'b', 'c'],
    d: ['d', 'e', 'f'],
  } as const
  return rows[first][order]!.repeat(64)
}
