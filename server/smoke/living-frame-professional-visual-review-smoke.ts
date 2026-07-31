import assert from 'node:assert/strict'

import {
  LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS,
  type LivingFrameProfessionalVisualCheckEvidence,
  type LivingFrameProfessionalVisualCheckId,
  type LivingFrameProfessionalVisualReviewRequest,
} from '../../src/types/living-frame-professional-visual-review'
import {
  compileLivingFrameProfessionalVisualReview,
  verifyLivingFrameProfessionalVisualReview,
} from '../living-frame/living-frame-professional-visual-review'

const rejected =
  compileLivingFrameProfessionalVisualReview(
    requestWithChecks({
      anatomy_and_limb_count:
        failure(
          'anatomy_and_limb_count',
          'blocking_failure',
          'The extended arm has implausible length and segmented anatomy.',
        ),
      joint_and_silhouette_continuity:
        failure(
          'joint_and_silhouette_continuity',
          'blocking_failure',
          'Visible shoulder elbow wrist and neck sockets break the silhouette.',
        ),
      hand_and_prop_attachment:
        failure(
          'hand_and_prop_attachment',
          'blocking_failure',
          'The hand and spyglass attachment is visually unclear.',
        ),
      secondary_part_attachment:
        failure(
          'secondary_part_attachment',
          'blocking_failure',
          'The detached coat flap reads as a floating object.',
        ),
    }),
  )
assert.equal(
  rejected.technicalExecutionPassed,
  true,
)
assert.equal(
  rejected.disposition,
  'rejected',
)
assert.equal(
  rejected
    .professionalVisualAcceptancePassed,
  false,
)
assert.equal(
  rejected
    .acceptedOutputMayProceedToCanonicalReconciliation,
  false,
)
assert.equal(
  rejected
    .rejectedOrRepairOutputBlocksDownstreamUse,
  true,
)
assert.deepEqual(
  rejected.failedCheckIds,
  [
    'anatomy_and_limb_count',
    'joint_and_silhouette_continuity',
    'hand_and_prop_attachment',
    'secondary_part_attachment',
  ],
)
assert.equal(
  verifyLivingFrameProfessionalVisualReview(
    rejected,
  ),
  true,
)
assert.equal(
  verifyLivingFrameProfessionalVisualReview({
    ...rejected,
    disposition: 'accepted',
    professionalVisualAcceptancePassed:
      true,
  }),
  false,
)

const repair =
  compileLivingFrameProfessionalVisualReview(
    requestWithChecks({
      temporal_flicker_and_texture_crawl:
        failure(
          'temporal_flicker_and_texture_crawl',
          'repairable_failure',
          'A small texture crawl remains in the coat edge during the hold.',
        ),
    }),
  )
assert.equal(
  repair.disposition,
  'repair_required',
)
assert.equal(
  repair
    .professionalVisualAcceptancePassed,
  false,
)

const accepted =
  compileLivingFrameProfessionalVisualReview(
    requestWithChecks({}),
  )
assert.equal(
  accepted.disposition,
  'accepted',
)
assert.equal(
  accepted
    .professionalVisualAcceptancePassed,
  true,
)
assert.equal(
  accepted
    .acceptedOutputMayProceedToCanonicalReconciliation,
  true,
)
assert.equal(
  accepted.canonicalQaApproved,
  false,
)

assert.throws(
  () =>
    compileLivingFrameProfessionalVisualReview({
      ...requestWithChecks({}),
      checks:
        requestWithChecks({})
          .checks.slice(1),
    }),
  /request is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameProfessionalVisualReview({
      ...requestWithChecks({}),
      inspection: {
        ...requestWithChecks({})
          .inspection,
        sampledFrameNumbers: [
          0,
          30,
          30,
          59,
        ],
      },
    }),
  /request is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameProfessionalVisualReview({
      ...requestWithChecks({}),
      renderedArtifact: {
        ...requestWithChecks({})
          .renderedArtifact,
        finalCanvasClaimed:
          true,
      } as unknown as
        LivingFrameProfessionalVisualReviewRequest['renderedArtifact'],
    }),
  /request is invalid/,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_professional_visual_review',
  status: 'passed_source_only',
  technicallyGreenBadVisualDisposition:
    rejected.disposition,
  rejectedFailureCount:
    rejected.failedCheckIds.length,
  repairDisposition:
    repair.disposition,
  acceptedDisposition:
    accepted.disposition,
  technicalMetricsAloneCanApprove:
    false,
  actualRenderedClipInspectionRequired:
    accepted.request.inspection
      .actualRenderedClipInspected,
  canonicalQaApproved: false,
  operationRegistered: false,
  dispatchGranted: false,
  assetCreated: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function requestWithChecks(
  overrides: Partial<
    Record<
      LivingFrameProfessionalVisualCheckId,
      LivingFrameProfessionalVisualCheckEvidence
    >
  >,
): LivingFrameProfessionalVisualReviewRequest {
  return {
    reviewId:
      'review.airship.rejected-articulated-motion.v1',
    sceneId:
      'scene.airship-navigator.spyglass-survey',
    componentId:
      'airship.navigator.character',
    motionStrategyRef: {
      contractVersion:
        'living-frame-ai-2d-character-motion-strategy-v1',
      version: 1,
      digestSha256: 'a'.repeat(64),
    },
    renderedArtifact: {
      privateObjectIdentityHash:
        'b'.repeat(64),
      contentType: 'video/mp4',
      byteLength: 42_019,
      sha256:
        'd2426d8e6aca2812d22b3dedfdfffed7c6cd653b3447aef34e75b300c8ae8d36',
      widthPixels: 640,
      heightPixels: 360,
      fps: 30,
      frameCount: 60,
      boundedReviewProxy: true,
      finalCanvasClaimed: false,
    },
    technicalQaRef: {
      contractVersion:
        'living-frame-articulated-puppet-remotion-review-internal-test-v1',
      version: 1,
      digestSha256: 'c'.repeat(64),
      technicalExecutionPassed:
        true,
    },
    inspection: {
      performedBy:
        'head_intelligence_and_owner',
      actualRenderedClipInspected:
        true,
      actualMotionAtPlaybackSpeedInspected:
        true,
      sampledFrameNumbers: [
        0,
        15,
        30,
        45,
        59,
      ],
      fullDurationCovered: true,
    },
    checks:
      LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS
        .map((checkId) =>
          overrides[checkId]
          ?? pass(checkId)),
    containsRawChatTranscriptMediaBytesPathUrlCredentialCommandOrEnvironment:
      false,
  }
}

function pass(
  checkId:
    LivingFrameProfessionalVisualCheckId,
): LivingFrameProfessionalVisualCheckEvidence {
  return {
    checkId,
    outcome: 'pass',
    observationSummary:
      'The inspected rendered motion passes this professional visual check.',
    evidenceRefIds: [
      `visual.${checkId}.sampled-review-v1`,
    ],
  }
}

function failure(
  checkId:
    LivingFrameProfessionalVisualCheckId,
  outcome:
    'repairable_failure'
    | 'blocking_failure',
  observationSummary: string,
): LivingFrameProfessionalVisualCheckEvidence {
  return {
    checkId,
    outcome,
    observationSummary,
    evidenceRefIds: [
      `visual.${checkId}.rejected-sample-v1`,
    ],
  }
}
