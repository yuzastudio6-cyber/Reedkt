import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_SET_VERSION,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_VERSION,
  type LivingFrameCompleteCharacterKeyposeReview,
  type LivingFrameCompleteCharacterKeyposeReviewDraft,
  type LivingFrameCompleteCharacterKeyposeReviewRequest,
  type LivingFrameCompleteCharacterKeyposeReviewSet,
  type LivingFrameCompleteCharacterKeyposeReviewSetDraft,
} from '../../src/types/living-frame-complete-character-keypose-review'
import type {
  LivingFrameCompleteCharacterKeyposePlan,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
  verifyLivingFrameCompleteCharacterKeyposePlan,
} from './living-frame-complete-character-keypose-plan'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const KEYPOSE_ROLES = [
  'start',
  'anticipation',
  'action_apex',
  'settle',
] as const
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export function compileLivingFrameCompleteCharacterKeyposeReview(
  request:
    LivingFrameCompleteCharacterKeyposeReviewRequest,
): LivingFrameCompleteCharacterKeyposeReview {
  assertRequest(request)
  const blocking =
    request.checks.filter(
      (check) =>
        check.outcome ===
          'blocking_failure',
    )
  const repairable =
    request.checks.filter(
      (check) =>
        check.outcome ===
          'repairable_failure',
    )
  const disposition =
    blocking.length > 0
      ? 'rejected' as const
      : repairable.length > 0
        ? 'repair_required' as const
        : 'accepted' as const
  const failedCheckIds = [
    ...blocking,
    ...repairable,
  ].map(
    (check) => check.checkId,
  )
  const draft:
    LivingFrameCompleteCharacterKeyposeReviewDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_VERSION,
      resultClass:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_CLASS,
      reviewId: request.reviewId,
      keyposePlanRef:
        structuredClone(
          request.keyposePlanRef,
        ),
      keyposeUnitRef:
        structuredClone(
          request.keyposeUnitRef,
        ),
      privateArtifactRef:
        structuredClone(
          request.privateArtifact,
        ),
      technicalImageQaRef:
        structuredClone(
          request.technicalImageQaRef,
        ),
      headIntelligenceActualImageInspectionPerformed:
        true,
      checks:
        structuredClone(request.checks),
      disposition,
      failedCheckIds,
      technicalMetricsAloneCanApprove:
        false,
      interpolationAuthorized: false,
      canonicalQaApproved: false,
      containsImageBytesPathUrlCredentialCommandOrEnvironment:
        false,
    }
  return deepFreeze({
    ...draft,
    reviewDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCompleteCharacterKeyposeReview(
  value: unknown,
): value is LivingFrameCompleteCharacterKeyposeReview {
  if (
    !isRecord(value)
    || !isRecord(value.keyposePlanRef)
    || !isRecord(value.keyposeUnitRef)
    || !isRecord(value.privateArtifactRef)
    || !isRecord(value.technicalImageQaRef)
    || !Array.isArray(value.checks)
  ) return false
  try {
    const review =
      value as unknown as
        LivingFrameCompleteCharacterKeyposeReview
    const expected =
      compileLivingFrameCompleteCharacterKeyposeReview({
        reviewId: review.reviewId,
        keyposePlanRef:
          review.keyposePlanRef,
        keyposeUnitRef:
          review.keyposeUnitRef,
        privateArtifact:
          review.privateArtifactRef,
        technicalImageQaRef:
          review.technicalImageQaRef,
        headIntelligenceActualImageInspectionPerformed:
          review.headIntelligenceActualImageInspectionPerformed,
        checks: review.checks,
      })
    return stableAuthorityStringify(
      value,
    ) === stableAuthorityStringify(
      expected,
    )
  } catch {
    return false
  }
}

export interface CompileLivingFrameCompleteCharacterKeyposeReviewSetInput {
  readonly setId: string
  readonly keyposePlan:
    LivingFrameCompleteCharacterKeyposePlan
  readonly keyposePlanInput:
    CreateLivingFrameCompleteCharacterKeyposePlanInput
  readonly reviews:
    readonly LivingFrameCompleteCharacterKeyposeReview[]
}

export function compileLivingFrameCompleteCharacterKeyposeReviewSet(
  input:
    CompileLivingFrameCompleteCharacterKeyposeReviewSetInput,
): LivingFrameCompleteCharacterKeyposeReviewSet {
  assertSetInput(input)
  const rejectedOrRepairRequiredReviewIds =
    input.reviews.filter(
      (review) =>
        review.disposition !==
          'accepted',
    ).map(
      (review) => review.reviewId,
    )
  const everyPoseAccepted =
    rejectedOrRepairRequiredReviewIds
      .length === 0
  const draft:
    LivingFrameCompleteCharacterKeyposeReviewSetDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_SET_VERSION,
      setClass:
        'complete_character_keypose_review_set',
      setId: input.setId,
      keyposePlanRef: {
        planId:
          input.keyposePlan.planId,
        version:
          input.keyposePlan
            .contractVersion,
        digestSha256:
          input.keyposePlan
            .planDigestSha256,
      },
      reviews:
        structuredClone(input.reviews),
      exactRoleOrder:
        input.keyposePlan
          .keyposeUnits.map(
            (unit) => unit.role,
          ),
      everyPlannedPoseReviewed: true,
      everyPoseAccepted,
      interpolationAdmissionCandidateMayBeMaterialized:
        everyPoseAccepted,
      rejectedOrRepairRequiredReviewIds,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reviewSetDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCompleteCharacterKeyposeReviewSet(
  value: unknown,
  input:
    CompileLivingFrameCompleteCharacterKeyposeReviewSetInput,
): value is LivingFrameCompleteCharacterKeyposeReviewSet {
  try {
    return stableAuthorityStringify(
      value,
    ) === stableAuthorityStringify(
      compileLivingFrameCompleteCharacterKeyposeReviewSet(
        input,
      ),
    )
  } catch {
    return false
  }
}

function assertRequest(
  request:
    LivingFrameCompleteCharacterKeyposeReviewRequest,
): void {
  const checkIds = request.checks.map(
    (check) => check.checkId,
  )
  if (
    !SAFE_ID.test(request.reviewId)
    || !SAFE_ID.test(
      request.keyposePlanRef.planId,
    )
    || request.keyposePlanRef.version !==
      'living-frame-complete-character-keypose-plan-v1'
    || !SHA256.test(
      request.keyposePlanRef
        .digestSha256,
    )
    || !SAFE_ID.test(
      request.keyposeUnitRef.unitId,
    )
    || !SHA256.test(
      request.keyposeUnitRef
        .unitDigestSha256,
    )
    || !Number.isSafeInteger(
      request.keyposeUnitRef.order,
    )
    || request.keyposeUnitRef.order < 0
    || !KEYPOSE_ROLES.includes(
      request.keyposeUnitRef.role,
    )
    || !SAFE_ID.test(
      request.privateArtifact
        .artifactId,
    )
    || !SAFE_ID.test(
      request.privateArtifact
        .approvedWorkItemId,
    )
    || !SAFE_ID.test(
      request.privateArtifact
        .plannedAssetManifestEntryId,
    )
    || !SAFE_ID.test(
      request.privateArtifact
        .outputKey,
    )
    || !SHA256.test(
      request.privateArtifact
        .privateObjectIdentityHash,
    )
    || request.privateArtifact
      .contentType !== 'image/png'
    || !Number.isSafeInteger(
      request.privateArtifact
        .byteLength,
    )
    || request.privateArtifact
      .byteLength < 1
    || !SHA256.test(
      request.privateArtifact.sha256,
    )
    || request.privateArtifact
      .widthPixels !== 1024
    || request.privateArtifact
      .heightPixels !== 1024
    || request.privateArtifact
      .actualDecodedImageInspected !==
        true
    || request.privateArtifact
      .sourceBytesIncludedInReviewRecord !==
        false
    || !Number.isSafeInteger(
      request.technicalImageQaRef
        .version,
    )
    || request.technicalImageQaRef
      .version < 1
    || !SHA256.test(
      request.technicalImageQaRef
        .digestSha256,
    )
    || request.technicalImageQaRef
      .artifactId !== request
        .privateArtifact.artifactId
    || request.technicalImageQaRef
      .artifactSha256 !== request
        .privateArtifact.sha256
    || request.technicalImageQaRef
      .decodePassed !== true
    || request.technicalImageQaRef
      .expectedDimensionsPassed !== true
    || request.technicalImageQaRef
      .noUnexpectedCropPassed !== true
    || request
      .headIntelligenceActualImageInspectionPerformed !==
        true
    || request.checks.length !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS.length
    || stableAuthorityStringify(
      checkIds,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS,
    )
    || request.checks.some(
      (check) =>
        ![
          'pass',
          'repairable_failure',
          'blocking_failure',
        ].includes(check.outcome)
        || typeof check
          .observationSummary !== 'string'
        || check.observationSummary
          .length < 4
        || check.observationSummary
          .length > 320
        || UNSAFE_TEXT.test(
          check.observationSummary,
        )
        || check.evidenceRefIds
          .length < 1
        || check.evidenceRefIds.some(
          (reference) =>
            !SAFE_ID.test(reference),
        ),
    )
  ) {
    throw new Error(
      'Living Frame complete-character keypose visual review request is invalid.',
    )
  }
}

function assertSetInput(
  input:
    CompileLivingFrameCompleteCharacterKeyposeReviewSetInput,
): void {
  if (
    !SAFE_ID.test(input.setId)
    || !verifyLivingFrameCompleteCharacterKeyposePlan(
      input.keyposePlan,
      input.keyposePlanInput,
    )
    || input.reviews.length !==
      input.keyposePlan.keyposeUnits
        .length
    || input.reviews.some(
      (review, order) => {
        const unit =
          input.keyposePlan
            .keyposeUnits[order]
        return unit == null
          || !verifyLivingFrameCompleteCharacterKeyposeReview(
            review,
          )
          || review.keyposePlanRef
            .planId !== input.keyposePlan
              .planId
          || review.keyposePlanRef
            .digestSha256 !==
              input.keyposePlan
                .planDigestSha256
          || review.keyposeUnitRef
            .unitId !== unit.keyposeUnitId
          || review.keyposeUnitRef
            .unitDigestSha256 !==
              unit.keyposeUnitDigestSha256
          || review.keyposeUnitRef.order !==
            unit.order
          || review.keyposeUnitRef.role !==
            unit.role
          || review.privateArtifactRef
            .approvedWorkItemId !==
              unit.approvedWorkItemId
          || review.privateArtifactRef
            .plannedAssetManifestEntryId !==
              unit.plannedAssetManifestEntryId
          || review.privateArtifactRef
            .outputKey !== unit.outputKey
      },
    )
    || new Set(
      input.reviews.map(
        (review) =>
          review.reviewId,
      ),
    ).size !== input.reviews.length
    || !hasUniqueArtifactLineage(
      input.reviews,
    )
  ) {
    throw new Error(
      'Living Frame complete-character keypose review set input is invalid.',
    )
  }
}

function hasUniqueArtifactLineage(
  reviews:
    readonly LivingFrameCompleteCharacterKeyposeReview[],
): boolean {
  const identities = reviews.map(
    (review) => [
      review.privateArtifactRef
        .artifactId,
      review.privateArtifactRef
        .privateObjectIdentityHash,
      review.privateArtifactRef.sha256,
      review.privateArtifactRef
        .outputKey,
    ],
  )
  return [
    0,
    1,
    2,
    3,
  ].every(
    (fieldIndex) => {
      const values = identities.map(
        (fields) => fields[fieldIndex]!,
      )
      return new Set(values).size ===
        values.length
    },
  )
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
