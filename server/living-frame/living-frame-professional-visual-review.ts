import {
  LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS,
  LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_CLASS,
  LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_VERSION,
  type LivingFrameProfessionalVisualCheckId,
  type LivingFrameProfessionalVisualReviewDraft,
  type LivingFrameProfessionalVisualReviewRecord,
  type LivingFrameProfessionalVisualReviewRequest,
} from '../../src/types/living-frame-professional-visual-review'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export function compileLivingFrameProfessionalVisualReview(
  request:
    LivingFrameProfessionalVisualReviewRequest,
): LivingFrameProfessionalVisualReviewRecord {
  assertRequest(request)
  const blockingFailures =
    request.checks.filter(
      (check) =>
        check.outcome ===
          'blocking_failure',
    )
  const repairableFailures =
    request.checks.filter(
      (check) =>
        check.outcome ===
          'repairable_failure',
    )
  const disposition =
    blockingFailures.length > 0
      ? 'rejected' as const
      : repairableFailures.length > 0
        ? 'repair_required' as const
        : 'accepted' as const
  const failedCheckIds =
    request.checks
      .filter(
        (check) =>
          check.outcome !== 'pass',
      )
      .map(
        (check) =>
          check.checkId,
      )
  const draft:
    LivingFrameProfessionalVisualReviewDraft = {
      contractVersion:
        LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_VERSION,
      resultClass:
        LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_CLASS,
      request:
        structuredClone(request),
      disposition,
      failedCheckIds,
      technicalExecutionPassed:
        request.technicalQaRef
          .technicalExecutionPassed,
      professionalVisualAcceptancePassed:
        disposition === 'accepted',
      technicalMetricsAloneCannotApproveVisualQuality:
        true,
      acceptedOutputMayProceedToCanonicalReconciliation:
        disposition === 'accepted',
      rejectedOrRepairOutputBlocksDownstreamUse:
        disposition !== 'accepted',
      authorityBoundary: {
        privateVisualReviewEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvalAuthority: false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        assetAuthority: false,
        assetManifestAuthority:
          false,
        canonicalQaApprovalAuthority:
          false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reviewDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameProfessionalVisualReview(
  value: unknown,
): value is LivingFrameProfessionalVisualReviewRecord {
  if (
    !isRecord(value)
    || typeof value.reviewDigestSha256
      !== 'string'
  ) return false
  const {
    reviewDigestSha256,
    ...draft
  } = value
  try {
    const expected =
      compileLivingFrameProfessionalVisualReview(
        draft.request as
          LivingFrameProfessionalVisualReviewRequest,
      )
    return reviewDigestSha256
      === sha256AuthorityValue(draft)
      && stableAuthorityStringify(
        value,
      ) === stableAuthorityStringify(
        expected,
      )
  } catch {
    return false
  }
}

function assertRequest(
  request:
    LivingFrameProfessionalVisualReviewRequest,
): void {
  const checkIds =
    request.checks?.map(
      (check) => check.checkId,
    ) ?? []
  const sortedExpected = [
    ...LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS,
  ].sort().join('|')
  if (
    !isRecord(request)
    || !SAFE_ID.test(request.reviewId)
    || !SAFE_ID.test(request.sceneId)
    || !SAFE_ID.test(request.componentId)
    || !isRecord(request.motionStrategyRef)
    || typeof request.motionStrategyRef
      .contractVersion !== 'string'
    || !SAFE_ID.test(
      request.motionStrategyRef
        .contractVersion,
    )
    || !Number.isSafeInteger(
      request.motionStrategyRef.version,
    )
    || request.motionStrategyRef.version < 1
    || !SHA256.test(
      request.motionStrategyRef
        .digestSha256,
    )
    || !isRecord(request.renderedArtifact)
    || !SHA256.test(
      request.renderedArtifact
        .privateObjectIdentityHash,
    )
    || request.renderedArtifact
      .contentType !== 'video/mp4'
    || !Number.isSafeInteger(
      request.renderedArtifact.byteLength,
    )
    || request.renderedArtifact
      .byteLength < 1
    || !SHA256.test(
      request.renderedArtifact.sha256,
    )
    || !positiveInteger(
      request.renderedArtifact.widthPixels,
    )
    || !positiveInteger(
      request.renderedArtifact.heightPixels,
    )
    || !positiveInteger(
      request.renderedArtifact.fps,
    )
    || !positiveInteger(
      request.renderedArtifact.frameCount,
    )
    || request.renderedArtifact
      .finalCanvasClaimed !== false
    || !isRecord(request.technicalQaRef)
    || typeof request.technicalQaRef
      .contractVersion !== 'string'
    || !SAFE_ID.test(
      request.technicalQaRef
        .contractVersion,
    )
    || !positiveInteger(
      request.technicalQaRef.version,
    )
    || !SHA256.test(
      request.technicalQaRef.digestSha256,
    )
    || typeof request.technicalQaRef
      .technicalExecutionPassed !==
        'boolean'
    || !isRecord(request.inspection)
    || request.inspection
      .actualRenderedClipInspected !==
        true
    || request.inspection
      .actualMotionAtPlaybackSpeedInspected
      !== true
    || request.inspection
      .fullDurationCovered !== true
    || !Array.isArray(
      request.inspection
        .sampledFrameNumbers,
    )
    || request.inspection
      .sampledFrameNumbers.length < 3
    || request.inspection
      .sampledFrameNumbers.some(
        (frame, index, frames) =>
          !Number.isSafeInteger(frame)
          || frame < 0
          || frame >= request
            .renderedArtifact.frameCount
          || (
            index > 0
            && frame <= frames[index - 1]!
          ),
      )
    || !Array.isArray(request.checks)
    || checkIds.length !==
      LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS.length
    || [...checkIds].sort()
      .join('|') !== sortedExpected
    || request.checks.some(
      (check) =>
        !isRecord(check)
        || !LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS
          .includes(
            check.checkId as
              LivingFrameProfessionalVisualCheckId,
          )
        || ![
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
        || !Array.isArray(
          check.evidenceRefIds,
        )
        || check.evidenceRefIds.length < 1
        || check.evidenceRefIds.some(
          (reference) =>
            typeof reference !== 'string'
            || !SAFE_ID.test(reference),
        ),
    )
    || request
      .containsRawChatTranscriptMediaBytesPathUrlCredentialCommandOrEnvironment
      !== false
  ) {
    throw new Error(
      'Living Frame professional visual-review request is invalid.',
    )
  }
}

function positiveInteger(
  value: unknown,
): value is number {
  return Number.isSafeInteger(value)
    && Number(value) > 0
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
