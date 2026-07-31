import assert from 'node:assert/strict'

import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS,
  type LivingFrameCompleteCharacterKeyposeCheck,
  type LivingFrameCompleteCharacterKeyposeReviewRequest,
} from '../../src/types/living-frame-complete-character-keypose-review'
import type {
  LivingFrameCompleteCharacterKeyposeInput,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameAi2dCharacterMotionStrategy,
} from '../living-frame/living-frame-ai-2d-character-motion'
import {
  compileLivingFrameCompleteCharacterKeyposePlan,
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
} from '../living-frame/living-frame-complete-character-keypose-plan'
import {
  compileLivingFrameCompleteCharacterKeyposeReview,
  compileLivingFrameCompleteCharacterKeyposeReviewSet,
  verifyLivingFrameCompleteCharacterKeyposeReview,
  verifyLivingFrameCompleteCharacterKeyposeReviewSet,
} from '../living-frame/living-frame-complete-character-keypose-review'

const strategy =
  compileLivingFrameAi2dCharacterMotionStrategy({
    evidenceId: 'evidence.navigator.keypose-review.v1',
    sceneId: 'scene.navigator.keypose-review.v1',
    componentId: 'character.navigator.keypose-review.v1',
    sourceArtifactId: 'artifact.navigator.complete-character.v1',
    illustrativeNotArchivalEvidence: true,
    requestedMotionMagnitude: 'moderate_pose_change',
    requestedActionSummary:
      'Raise and settle the spyglass while preserving a coherent complete illustrated navigator.',
    completeCharacterReferenceAvailable: true,
    styleReferenceAvailable: true,
    poseControlAvailable: true,
    requiresNewPixelsOrHiddenAnatomy: true,
    continuousNaturalMotionRequired: false,
    restrainedRigidMotionPreservesSilhouette: false,
    professionallyAuthoredOpenToonzRigAvailable: false,
    professionallyAuthoredBlenderRigAvailable: false,
    visibleJointHardwarePresent: false,
    jointSeamsConcealedAcrossPoseRange: false,
    anatomicalProportionsReviewedAcrossPoseRange: false,
    handPropAttachmentReviewedAcrossPoseRange: false,
    secondaryPartsAnchoredAcrossPoseRange: false,
    protectedFaceAndIdentityRegionsDefined: true,
    priorRejectedVisualProofRefs: [
      'proof.airship.blender-remotion.visual-rejected.v1',
    ],
    rawChatPromptPathUrlModelCodeOrBytesIncluded: false,
  })
const keyposePlanInput:
CreateLivingFrameCompleteCharacterKeyposePlanInput = {
  planId: 'plan.navigator.keypose-review.v1',
  strategy,
  canonicalScope: {
    workspaceId: 'workspace.internal.living-frame',
    projectId: 'project.internal.ai-2d-feasibility',
    editSessionId: 'edit.internal.navigator-keypose-review',
    sceneId: strategy.evidence.sceneId,
    componentId: strategy.evidence.componentId,
  },
  sourceBindings: {
    approvedSnapshotId: 'snapshot.navigator.keypose-review.v1',
    approvedSnapshotHashSha256: '1'.repeat(64),
    selectedSceneBindingDigestSha256: '2'.repeat(64),
    currentMasterTimingDigestSha256: '3'.repeat(64),
    confirmedOutputFrameExpectationDigestSha256: '4'.repeat(64),
    completeCharacterSourceArtifactId:
      strategy.evidence.sourceArtifactId,
    completeCharacterSourceDigestSha256: '5'.repeat(64),
    styleReferenceArtifactId: 'artifact.navigator.style.v1',
    styleReferenceDigestSha256: '6'.repeat(64),
  },
  keyposes: keyposes(),
}
const plan =
  compileLivingFrameCompleteCharacterKeyposePlan(
    keyposePlanInput,
  )
const acceptedReviews =
  plan.keyposeUnits.map(
    (unit) =>
      compileLivingFrameCompleteCharacterKeyposeReview(
        reviewRequest(
          unit,
          allPassChecks(unit.role),
        ),
      ),
  )
const acceptedSetInput = {
  setId: 'review-set.navigator.accepted.v1',
  keyposePlan: plan,
  keyposePlanInput,
  reviews: acceptedReviews,
}
const acceptedSet =
  compileLivingFrameCompleteCharacterKeyposeReviewSet(
    acceptedSetInput,
  )

assert.equal(acceptedSet.everyPlannedPoseReviewed, true)
assert.equal(acceptedSet.everyPoseAccepted, true)
assert.equal(
  acceptedSet.interpolationAdmissionCandidateMayBeMaterialized,
  true,
)
assert.equal(
  verifyLivingFrameCompleteCharacterKeyposeReviewSet(
    acceptedSet,
    acceptedSetInput,
  ),
  true,
)
assert.equal(
  acceptedReviews.every(
    (review) =>
      review.disposition === 'accepted'
      && review.headIntelligenceActualImageInspectionPerformed
      && !review.technicalMetricsAloneCanApprove
      && !review.interpolationAuthorized
      && !review.canonicalQaApproved,
  ),
  true,
)

const repairReview =
  compileLivingFrameCompleteCharacterKeyposeReview(
    reviewRequest(
      plan.keyposeUnits[1]!,
      checksWithFailure(
        plan.keyposeUnits[1]!.role,
        'hand_and_prop_attachment',
        'repairable_failure',
      ),
    ),
  )
const repairSetInput = {
  ...acceptedSetInput,
  setId: 'review-set.navigator.repair.v1',
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
assert.equal(repairReview.disposition, 'repair_required')
assert.equal(repairSet.everyPoseAccepted, false)
assert.equal(
  repairSet.interpolationAdmissionCandidateMayBeMaterialized,
  false,
)

const rejectedReview =
  compileLivingFrameCompleteCharacterKeyposeReview(
    reviewRequest(
      plan.keyposeUnits[1]!,
      checksWithFailure(
        plan.keyposeUnits[1]!.role,
        'anatomy_and_limb_count',
        'blocking_failure',
      ),
    ),
  )
assert.equal(rejectedReview.disposition, 'rejected')
assert.equal(
  verifyLivingFrameCompleteCharacterKeyposeReview({
    ...rejectedReview,
    disposition: 'accepted',
  }),
  false,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReviewSet({
      ...acceptedSetInput,
      reviews: [
        acceptedReviews[1]!,
        acceptedReviews[0]!,
        acceptedReviews[2]!,
      ],
    }),
  /review set input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReview({
      ...reviewRequest(
        plan.keyposeUnits[0]!,
        allPassChecks(
          plan.keyposeUnits[0]!.role,
        ),
      ),
      technicalImageQaRef: {
        ...reviewRequest(
          plan.keyposeUnits[0]!,
          allPassChecks(
            plan.keyposeUnits[0]!.role,
          ),
        ).technicalImageQaRef,
        decodePassed: false,
      },
    }),
  /visual review request is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReview({
      ...reviewRequest(
        plan.keyposeUnits[0]!,
        allPassChecks(
          plan.keyposeUnits[0]!.role,
        ),
      ),
      technicalImageQaRef: {
        ...reviewRequest(
          plan.keyposeUnits[0]!,
          allPassChecks(
            plan.keyposeUnits[0]!.role,
          ),
        ).technicalImageQaRef,
        artifactSha256: '0'.repeat(64),
      },
    }),
  /visual review request is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReviewSet({
      ...acceptedSetInput,
      reviews: [
        acceptedReviews[0]!,
        compileLivingFrameCompleteCharacterKeyposeReview({
          ...reviewRequest(
            plan.keyposeUnits[1]!,
            allPassChecks(
              plan.keyposeUnits[1]!.role,
            ),
          ),
          privateArtifact: {
            ...reviewRequest(
              plan.keyposeUnits[1]!,
              allPassChecks(
                plan.keyposeUnits[1]!.role,
              ),
            ).privateArtifact,
            artifactId:
              acceptedReviews[0]!
                .privateArtifactRef.artifactId,
          },
          technicalImageQaRef: {
            ...reviewRequest(
              plan.keyposeUnits[1]!,
              allPassChecks(
                plan.keyposeUnits[1]!.role,
              ),
            ).technicalImageQaRef,
            artifactId:
              acceptedReviews[0]!
                .privateArtifactRef.artifactId,
          },
        }),
        acceptedReviews[2]!,
      ],
    }),
  /review set input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReview({
      ...reviewRequest(
        plan.keyposeUnits[0]!,
        allPassChecks(
          plan.keyposeUnits[0]!.role,
        ),
      ),
      checks: [
        ...allPassChecks(
          plan.keyposeUnits[0]!.role,
        ),
      ].reverse(),
    }),
  /visual review request is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameCompleteCharacterKeyposeReview({
      ...reviewRequest(
        plan.keyposeUnits[0]!,
        allPassChecks(
          plan.keyposeUnits[0]!.role,
        ),
      ),
      keyposeUnitRef: {
        ...reviewRequest(
          plan.keyposeUnits[0]!,
          allPassChecks(
            plan.keyposeUnits[0]!.role,
          ),
        ).keyposeUnitRef,
        role: 'unknown' as 'start',
      },
    }),
  /visual review request is invalid/,
)

console.log(JSON.stringify({
  smoke: 'living_frame_complete_character_keypose_review',
  status: 'passed_source_only',
  keyposeCount: plan.keyposeUnits.length,
  checkCountPerPose:
    LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS.length,
  acceptedSetInterpolationCandidate:
    acceptedSet.interpolationAdmissionCandidateMayBeMaterialized,
  repairSetInterpolationCandidate:
    repairSet.interpolationAdmissionCandidateMayBeMaterialized,
  blockingFailureDisposition: rejectedReview.disposition,
  actualDecodedImageInspectionRequired: true,
  technicalMetricsAloneCanApprove: false,
  technicalImageQaMustPassBeforeVisualAcceptance: true,
  canonicalCheckOrderRequired: true,
  exactWorkManifestOutputLineageRequired: true,
  crossPoseArtifactReuseRejected: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  productionReady: false,
}))

function reviewRequest(
  unit: (typeof plan.keyposeUnits)[number],
  checks: readonly LivingFrameCompleteCharacterKeyposeCheck[],
): LivingFrameCompleteCharacterKeyposeReviewRequest {
  return {
    reviewId: `review.navigator.${unit.role}.v1`,
    keyposePlanRef: {
      planId: plan.planId,
      version: plan.contractVersion,
      digestSha256: plan.planDigestSha256,
    },
    keyposeUnitRef: {
      unitId: unit.keyposeUnitId,
      unitDigestSha256: unit.keyposeUnitDigestSha256,
      order: unit.order,
      role: unit.role,
    },
    privateArtifact: {
      artifactId: `artifact.navigator.${unit.role}.private.v1`,
      approvedWorkItemId:
        unit.approvedWorkItemId,
      plannedAssetManifestEntryId:
        unit.plannedAssetManifestEntryId,
      outputKey: unit.outputKey,
      privateObjectIdentityHash: digestFor(unit.order, '7'),
      contentType: 'image/png',
      byteLength: 100_000 + unit.order,
      sha256: digestFor(unit.order, 'a'),
      widthPixels: 1024,
      heightPixels: 1024,
      actualDecodedImageInspected: true,
      sourceBytesIncludedInReviewRecord: false,
    },
    technicalImageQaRef: {
      version: 1,
      digestSha256: digestFor(unit.order, 'd'),
      artifactId:
        `artifact.navigator.${unit.role}.private.v1`,
      artifactSha256:
        digestFor(unit.order, 'a'),
      decodePassed: true,
      expectedDimensionsPassed: true,
      noUnexpectedCropPassed: true,
    },
    headIntelligenceActualImageInspectionPerformed: true,
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
        `visual.navigator.${role}.${checkId}`,
      ],
    }),
  )
}

function checksWithFailure(
  role: string,
  failedId: LivingFrameCompleteCharacterKeyposeCheck['checkId'],
  outcome: LivingFrameCompleteCharacterKeyposeCheck['outcome'],
): readonly LivingFrameCompleteCharacterKeyposeCheck[] {
  return allPassChecks(role).map(
    (check) => check.checkId === failedId
      ? {
        ...check,
        outcome,
        observationSummary:
          `The ${role} pose failed ${failedId} during actual image inspection.`,
      }
      : check,
  )
}

function keyposes():
readonly LivingFrameCompleteCharacterKeyposeInput[] {
  return [
    'start',
    'action_apex',
    'settle',
  ].map((role, order) => ({
    order,
    role: role as LivingFrameCompleteCharacterKeyposeInput['role'],
    poseControlArtifactId: `artifact.navigator.pose.${role}.v1`,
    poseControlDigestSha256: digestFor(order, '1'),
    approvedWorkItemId: `work.navigator.pose.${role}.v1`,
    plannedAssetManifestEntryId: `asset.navigator.pose.${role}.v1`,
    outputKey: `output.navigator.pose.${role}.v1`,
    actionDescription:
      `Render one complete coherent navigator in the ${role} pose with stable anatomy identity clothing hands and spyglass.`,
  }))
}

function digestFor(
  order: number,
  first: '1' | '7' | 'a' | 'd',
): string {
  const rows = {
    '1': ['1', '2', '3'],
    '7': ['7', '8', '9'],
    a: ['a', 'b', 'c'],
    d: ['d', 'e', 'f'],
  } as const
  return rows[first][order]!.repeat(64)
}
