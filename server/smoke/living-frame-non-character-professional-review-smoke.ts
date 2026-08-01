import assert from 'node:assert/strict'

import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
  type LivingFrameNonCharacterProfessionalCheckEvidence,
  type LivingFrameNonCharacterProfessionalCheckId,
  type LivingFrameNonCharacterProfessionalReviewRequest,
} from '../../src/types/living-frame-non-character-professional-review'
import {
  compileLivingFrameNonCharacterProfessionalReview,
  verifyLivingFrameNonCharacterProfessionalReview,
} from '../living-frame/living-frame-non-character-professional-review'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()

const acceptedInput = {
  ownerScopeAmendment,
  request: requestWithChecks({}),
}
const accepted =
  compileLivingFrameNonCharacterProfessionalReview(
    acceptedInput,
  )
assert.equal(accepted.disposition, 'accepted')
assert.equal(accepted.professionalVisualAcceptancePassed, true)
assert.equal(
  accepted.acceptedOutputMayProceedToCanonicalReconciliation,
  true,
)
assert.equal(
  accepted.pausedAnimationEvidenceUsedForAcceptance,
  false,
)
assert.equal(
  verifyLivingFrameNonCharacterProfessionalReview(
    accepted,
    acceptedInput,
  ),
  true,
)

const repair =
  compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: requestWithChecks({
      motion_semantics_timing_easing_hold_and_settle:
        failure(
          'motion_semantics_timing_easing_hold_and_settle',
          'repairable_failure',
          'The archive camera settles late and shortens the final reading hold.',
        ),
    }),
  })
assert.equal(repair.disposition, 'repair_required')
assert.equal(repair.localRepairPermitted, true)
assert.equal(repair.repairedOutputRequiresCompleteReinspection, true)
assert.equal(repair.rejectedOrRepairOutputBlocksDownstreamUse, true)

const rejected =
  compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: requestWithChecks({
      narrative_point_and_visual_comprehension:
        failure(
          'narrative_point_and_visual_comprehension',
          'blocking_failure',
          'The visual hierarchy obscures the relationship the narration is explaining.',
        ),
      composition_safe_zones_caption_and_label_priority:
        failure(
          'composition_safe_zones_caption_and_label_priority',
          'blocking_failure',
          'The foreground document collides with the caption and hides a required label.',
        ),
    }),
  })
assert.equal(rejected.disposition, 'rejected')
assert.equal(rejected.fullSceneReplanOrFallbackRequired, true)
assert.equal(rejected.professionalVisualAcceptancePassed, false)

const technicalFailure =
  compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: {
      ...requestWithChecks({}),
      technicalQaRef: {
        ...requestWithChecks({}).technicalQaRef,
        technicalExecutionPassed: false,
      },
    },
  })
assert.equal(technicalFailure.disposition, 'rejected')
assert.equal(technicalFailure.technicalExecutionPassed, false)

assert.throws(
  () => compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: {
      ...requestWithChecks({}),
      checks: requestWithChecks({}).checks.slice(1),
    },
  }),
  /request is invalid/,
)
assert.throws(
  () => compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: {
      ...requestWithChecks({}),
      activeScopeAssertions: {
        ...requestWithChecks({}).activeScopeAssertions,
        containsMechanicalRigging: true,
      } as unknown as LivingFrameNonCharacterProfessionalReviewRequest[
        'activeScopeAssertions'
      ],
    },
  }),
  /request is invalid/,
)
assert.throws(
  () => compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: {
      ...requestWithChecks({}),
      inspection: {
        ...requestWithChecks({}).inspection,
        performedBy: 'owner',
      } as unknown as LivingFrameNonCharacterProfessionalReviewRequest[
        'inspection'
      ],
    },
  }),
  /request is invalid/,
)
assert.equal(
  verifyLivingFrameNonCharacterProfessionalReview({
    ...accepted,
    disposition: 'rejected',
  }, acceptedInput),
  false,
)
assert.throws(
  () => compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: {
      ...requestWithChecks({}),
      rawPrompt: 'forbidden',
    } as unknown as LivingFrameNonCharacterProfessionalReviewRequest,
  }),
  /request is invalid/,
)
assert.throws(
  () => compileLivingFrameNonCharacterProfessionalReview({
    ownerScopeAmendment,
    request: requestWithChecks({
      overall_professional_polish_and_style_coherence: {
        ...pass(
          'overall_professional_polish_and_style_coherence',
        ),
        observationSummary:
          'Read private evidence from /tmp/forbidden before approving.',
      },
    }),
  }),
  /request is invalid/,
)

console.log(JSON.stringify({
  smoke: 'living_frame_non_character_professional_review',
  status: 'passed_source_only',
  checkCount:
    LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.length,
  acceptedDisposition: accepted.disposition,
  repairDisposition: repair.disposition,
  rejectedDisposition: rejected.disposition,
  technicalFailureDisposition: technicalFailure.disposition,
  headIntelligenceInspectionRequired: true,
  technicalMetricsAloneCanApproveVisualQuality: false,
  extraRequestFieldsRejected: true,
  unsafeReviewTextRejected: true,
  staticIllustrationRemainsAllowedWhenUnanimated: true,
  pausedAnimationEvidenceUsedForAcceptance: false,
  operationRegistered: false,
  dispatchGranted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  productionReady: false,
}))

function requestWithChecks(
  overrides: Partial<Record<
    LivingFrameNonCharacterProfessionalCheckId,
    LivingFrameNonCharacterProfessionalCheckEvidence
  >>,
): LivingFrameNonCharacterProfessionalReviewRequest {
  const optional = new Set<
  LivingFrameNonCharacterProfessionalCheckId>([
    'source_speaker_contact_object_and_product_preservation',
    'sound_narration_protection_spatial_fit_and_restraint',
  ])
  return {
    reviewId: 'review.archive.evidence-parallax.v1',
    sceneId: 'scene.archive.evidence-parallax',
    mode: 'living_archive',
    sourceBindings: {
      ownerScopeAmendmentVersion:
        ownerScopeAmendment.contractVersion,
      ownerScopeAmendmentDigestSha256:
        ownerScopeAmendment.amendmentDigestSha256,
      selectedSceneBindingDigestSha256: 'a'.repeat(64),
      approvedSnapshotId: 'snapshot.archive.review.v1',
      approvedSnapshotHashSha256: 'b'.repeat(64),
      currentMasterTimingDigestSha256: 'c'.repeat(64),
      rendererBindingDigestSha256: 'd'.repeat(64),
      confirmedOutputFrameDigestSha256: 'e'.repeat(64),
    },
    activeScopeAssertions: {
      reviewedUnderActiveNonCharacterScope: true,
      containsAnimatedLivingOrOrganicSubject: false,
      containsCharacterKeyposeOrInterpolationOutput: false,
      containsLivingSubjectRigging: false,
      containsMechanicalRigging: false,
      staticIllustrationIfPresentRemainsUnanimated: true,
      simpleRigidComponentTransformMayBePresent: false,
    },
    sceneEvidence: {
      movingSourceSpeakerPresent: false,
      exactMapDiagramDataOrDocumentPresent: true,
      soundPresent: false,
      expansionOrReturnTransitionPresent: true,
      deliberateNonUseRangePresent: false,
    },
    renderedArtifact: {
      privateObjectIdentityHash: 'f'.repeat(64),
      contentType: 'video/mp4',
      byteLength: 840_000,
      sha256: '1'.repeat(64),
      widthPixels: 1920,
      heightPixels: 1080,
      fps: 24,
      frameCount: 120,
      boundedPrivateReviewOnly: true,
      finalCanvasOwnedByRemotion: true,
      publicDeliveryCandidate: false,
    },
    confirmedFrame: {
      widthPixels: 1920,
      heightPixels: 1080,
      fps: 24,
    },
    technicalQaRef: {
      contractVersion:
        'living-frame-non-character-scene-technical-qa-v1',
      version: 1,
      digestSha256: '2'.repeat(64),
      technicalExecutionPassed: true,
    },
    inspection: {
      performedBy: 'head_intelligence',
      actualRenderedClipInspected: true,
      actualMotionAtPlaybackSpeedInspected: true,
      completeAudioTrackAuditionedWhenPresent: true,
      sampledFrameNumbers: [0, 24, 60, 96, 119],
      entryPeakHoldSettleAndExitCovered: true,
      fullDurationCovered: true,
    },
    checks:
      LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.map(
        (checkId) => overrides[checkId]
          ?? (optional.has(checkId)
            ? notApplicable(checkId)
            : pass(checkId)),
      ),
    containsRawChatTranscriptMediaBytesPathUrlCredentialPromptCommandOrEnvironment:
      false,
  }
}

function pass(
  checkId: LivingFrameNonCharacterProfessionalCheckId,
): LivingFrameNonCharacterProfessionalCheckEvidence {
  return {
    checkId,
    applicable: true,
    outcome: 'pass',
    observationSummary:
      'The complete rendered scene passes this professional inspection check.',
    evidenceRefIds: [`review.${checkId}.pass.v1`],
  }
}

function notApplicable(
  checkId: LivingFrameNonCharacterProfessionalCheckId,
): LivingFrameNonCharacterProfessionalCheckEvidence {
  return {
    checkId,
    applicable: false,
    outcome: 'not_applicable',
    observationSummary:
      'This check is not applicable to the approved archive scene evidence.',
    evidenceRefIds: [`review.${checkId}.not-applicable.v1`],
  }
}

function failure(
  checkId: LivingFrameNonCharacterProfessionalCheckId,
  outcome: 'repairable_failure' | 'blocking_failure',
  observationSummary: string,
): LivingFrameNonCharacterProfessionalCheckEvidence {
  return {
    checkId,
    applicable: true,
    outcome,
    observationSummary,
    evidenceRefIds: [`review.${checkId}.failure.v1`],
  }
}
