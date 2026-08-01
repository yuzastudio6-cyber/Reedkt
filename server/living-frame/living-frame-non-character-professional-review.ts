import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_CLASS,
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_VERSION,
  type LivingFrameNonCharacterProfessionalCheckId,
  type LivingFrameNonCharacterProfessionalReviewDraft,
  type LivingFrameNonCharacterProfessionalReviewRecord,
  type LivingFrameNonCharacterProfessionalReviewRequest,
} from '../../src/types/living-frame-non-character-professional-review'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|(?:^|\s)\/(?:Users|Volumes|tmp|var|home|etc|opt|private)\b|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

const ALWAYS_APPLICABLE_CHECKS = new Set<
LivingFrameNonCharacterProfessionalCheckId>([
  'narrative_point_and_visual_comprehension',
  'focal_hierarchy_attention_handoff_and_restoration',
  'composition_safe_zones_caption_and_label_priority',
  'depth_occlusion_anchor_perspective_and_parallax',
  'motion_semantics_timing_easing_hold_and_settle',
  'color_light_texture_grain_and_source_integration',
  'edge_flicker_compression_artifact_and_output_integrity',
  'overall_professional_polish_and_style_coherence',
])

export interface CompileLivingFrameNonCharacterProfessionalReviewInput {
  readonly ownerScopeAmendment:
    LivingFrameOwnerScopeAmendment
  readonly request:
    LivingFrameNonCharacterProfessionalReviewRequest
}

export function compileLivingFrameNonCharacterProfessionalReview(
  input:
    CompileLivingFrameNonCharacterProfessionalReviewInput,
): LivingFrameNonCharacterProfessionalReviewRecord {
  assertInput(input)
  const blockingFailures = input.request.checks.filter(
    (check) => check.outcome === 'blocking_failure',
  )
  const repairableFailures = input.request.checks.filter(
    (check) => check.outcome === 'repairable_failure',
  )
  const technicalExecutionPassed =
    input.request.technicalQaRef.technicalExecutionPassed
  const disposition = !technicalExecutionPassed
    || blockingFailures.length > 0
    ? 'rejected' as const
    : repairableFailures.length > 0
      ? 'repair_required' as const
      : 'accepted' as const
  const failedCheckIds = input.request.checks
    .filter((check) =>
      check.outcome === 'blocking_failure'
      || check.outcome === 'repairable_failure')
    .map((check) => check.checkId)
  const notApplicableCheckIds = input.request.checks
    .filter((check) => check.outcome === 'not_applicable')
    .map((check) => check.checkId)
  const accepted = disposition === 'accepted'
  const draft:
    LivingFrameNonCharacterProfessionalReviewDraft = {
      contractVersion:
        LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_VERSION,
      resultClass:
        LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_CLASS,
      reviewState:
        'actual_non_character_scene_inspected_technical_and_visual_results_separated',
      request: structuredClone(input.request),
      disposition,
      failedCheckIds,
      notApplicableCheckIds,
      technicalExecutionPassed,
      professionalVisualAcceptancePassed: accepted,
      technicalMetricsAloneCannotApproveVisualQuality: true,
      headIntelligenceInspectionRequired: true,
      localRepairPermitted:
        disposition === 'repair_required',
      fullSceneReplanOrFallbackRequired:
        disposition === 'rejected',
      repairedOutputRequiresCompleteReinspection:
        disposition === 'repair_required',
      acceptedOutputMayProceedToCanonicalReconciliation:
        accepted,
      rejectedOrRepairOutputBlocksDownstreamUse:
        !accepted,
      pausedAnimationEvidenceUsedForAcceptance: false,
      authorityBoundary: {
        privateProfessionalReviewEvidenceAuthority: true,
        livingFrameSelectionAuthority: false,
        layoutAuthority: false,
        masterTimingAuthority: false,
        soundSyncAuthority: false,
        approvedSnapshotAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        assetAuthority: false,
        assetManifestAuthority: false,
        canonicalQaApprovalAuthority: false,
        rendererAuthority: false,
        finalCanvasAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reviewDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameNonCharacterProfessionalReview(
  value: unknown,
  input:
    CompileLivingFrameNonCharacterProfessionalReviewInput,
): value is LivingFrameNonCharacterProfessionalReviewRecord {
  if (
    !isRecord(value)
    || typeof value.reviewDigestSha256 !== 'string'
  ) return false
  try {
    const expected =
      compileLivingFrameNonCharacterProfessionalReview(input)
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameNonCharacterProfessionalReviewInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'ownerScopeAmendment',
      'request',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(
      input.ownerScopeAmendment,
    )
  ) throw new Error('Invalid Living Frame non-character review input.')
  const request = input.request
  if (
    !isRecord(request)
    || !hasExactKeys(request, [
      'reviewId',
      'sceneId',
      'mode',
      'sourceBindings',
      'activeScopeAssertions',
      'sceneEvidence',
      'renderedArtifact',
      'confirmedFrame',
      'technicalQaRef',
      'inspection',
      'checks',
      'containsRawChatTranscriptMediaBytesPathUrlCredentialPromptCommandOrEnvironment',
    ])
    || !SAFE_ID.test(request.reviewId)
    || !SAFE_ID.test(request.sceneId)
    || ![
      'living_a_roll',
      'living_still',
      'living_archive',
      'living_diagram',
      'hybrid_expansion',
    ].includes(request.mode)
    || !isRecord(request.sourceBindings)
    || !hasExactKeys(request.sourceBindings, [
      'ownerScopeAmendmentVersion',
      'ownerScopeAmendmentDigestSha256',
      'selectedSceneBindingDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'currentMasterTimingDigestSha256',
      'rendererBindingDigestSha256',
      'confirmedOutputFrameDigestSha256',
    ])
    || request.sourceBindings.ownerScopeAmendmentVersion
      !== input.ownerScopeAmendment.contractVersion
    || request.sourceBindings.ownerScopeAmendmentDigestSha256
      !== input.ownerScopeAmendment.amendmentDigestSha256
    || !SAFE_ID.test(request.sourceBindings.approvedSnapshotId)
    || !allSha256([
      request.sourceBindings.selectedSceneBindingDigestSha256,
      request.sourceBindings.approvedSnapshotHashSha256,
      request.sourceBindings.currentMasterTimingDigestSha256,
      request.sourceBindings.rendererBindingDigestSha256,
      request.sourceBindings.confirmedOutputFrameDigestSha256,
    ])
    || !isRecord(request.activeScopeAssertions)
    || !hasExactKeys(request.activeScopeAssertions, [
      'reviewedUnderActiveNonCharacterScope',
      'containsAnimatedLivingOrOrganicSubject',
      'containsCharacterKeyposeOrInterpolationOutput',
      'containsLivingSubjectRigging',
      'containsMechanicalRigging',
      'staticIllustrationIfPresentRemainsUnanimated',
      'simpleRigidComponentTransformMayBePresent',
    ])
    || request.activeScopeAssertions.reviewedUnderActiveNonCharacterScope
      !== true
    || request.activeScopeAssertions.containsAnimatedLivingOrOrganicSubject
      !== false
    || request.activeScopeAssertions.containsCharacterKeyposeOrInterpolationOutput
      !== false
    || request.activeScopeAssertions.containsLivingSubjectRigging !== false
    || request.activeScopeAssertions.containsMechanicalRigging !== false
    || request.activeScopeAssertions.staticIllustrationIfPresentRemainsUnanimated
      !== true
    || typeof request.activeScopeAssertions.simpleRigidComponentTransformMayBePresent
      !== 'boolean'
    || !isRecord(request.sceneEvidence)
    || !hasExactKeys(request.sceneEvidence, [
      'movingSourceSpeakerPresent',
      'exactMapDiagramDataOrDocumentPresent',
      'soundPresent',
      'expansionOrReturnTransitionPresent',
      'deliberateNonUseRangePresent',
    ])
    || Object.values(request.sceneEvidence).some(
      (value) => typeof value !== 'boolean',
    )
    || !isRecord(request.renderedArtifact)
    || !hasExactKeys(request.renderedArtifact, [
      'privateObjectIdentityHash',
      'contentType',
      'byteLength',
      'sha256',
      'widthPixels',
      'heightPixels',
      'fps',
      'frameCount',
      'boundedPrivateReviewOnly',
      'finalCanvasOwnedByRemotion',
      'publicDeliveryCandidate',
    ])
    || !SHA256.test(request.renderedArtifact.privateObjectIdentityHash)
    || request.renderedArtifact.contentType !== 'video/mp4'
    || !positiveInteger(request.renderedArtifact.byteLength)
    || !SHA256.test(request.renderedArtifact.sha256)
    || !positiveInteger(request.renderedArtifact.widthPixels)
    || !positiveInteger(request.renderedArtifact.heightPixels)
    || !positiveInteger(request.renderedArtifact.fps)
    || !positiveInteger(request.renderedArtifact.frameCount)
    || request.renderedArtifact.boundedPrivateReviewOnly !== true
    || request.renderedArtifact.finalCanvasOwnedByRemotion !== true
    || request.renderedArtifact.publicDeliveryCandidate !== false
    || !isRecord(request.confirmedFrame)
    || !hasExactKeys(request.confirmedFrame, [
      'widthPixels',
      'heightPixels',
      'fps',
    ])
    || request.confirmedFrame.widthPixels
      !== request.renderedArtifact.widthPixels
    || request.confirmedFrame.heightPixels
      !== request.renderedArtifact.heightPixels
    || request.confirmedFrame.fps !== request.renderedArtifact.fps
    || !isRecord(request.technicalQaRef)
    || !hasExactKeys(request.technicalQaRef, [
      'contractVersion',
      'version',
      'digestSha256',
      'technicalExecutionPassed',
    ])
    || !SAFE_ID.test(request.technicalQaRef.contractVersion)
    || !positiveInteger(request.technicalQaRef.version)
    || !SHA256.test(request.technicalQaRef.digestSha256)
    || typeof request.technicalQaRef.technicalExecutionPassed
      !== 'boolean'
    || !validInspection(request)
    || !validChecks(request)
    || request.containsRawChatTranscriptMediaBytesPathUrlCredentialPromptCommandOrEnvironment
      !== false
  ) throw new Error('Living Frame non-character professional review request is invalid.')
}

function validInspection(
  request: LivingFrameNonCharacterProfessionalReviewRequest,
): boolean {
  const inspection = request.inspection
  const frames = inspection?.sampledFrameNumbers ?? []
  return isRecord(inspection)
    && hasExactKeys(inspection, [
      'performedBy',
      'actualRenderedClipInspected',
      'actualMotionAtPlaybackSpeedInspected',
      'completeAudioTrackAuditionedWhenPresent',
      'sampledFrameNumbers',
      'entryPeakHoldSettleAndExitCovered',
      'fullDurationCovered',
    ])
    && [
      'head_intelligence',
      'head_intelligence_and_owner',
    ].includes(inspection.performedBy)
    && inspection.actualRenderedClipInspected === true
    && inspection.actualMotionAtPlaybackSpeedInspected === true
    && inspection.completeAudioTrackAuditionedWhenPresent === true
    && inspection.entryPeakHoldSettleAndExitCovered === true
    && inspection.fullDurationCovered === true
    && Array.isArray(frames)
    && frames.length >= 5
    && frames[0] === 0
    && frames[frames.length - 1]
      === request.renderedArtifact.frameCount - 1
    && frames.every((frame, index) =>
      Number.isSafeInteger(frame)
      && frame >= 0
      && frame < request.renderedArtifact.frameCount
      && (index === 0 || frame > frames[index - 1]!))
}

function validChecks(
  request: LivingFrameNonCharacterProfessionalReviewRequest,
): boolean {
  if (!Array.isArray(request.checks)) return false
  const validCheckIds = new Set<string>(
    LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
  )
  const validOutcomes = new Set<string>([
    'pass',
    'repairable_failure',
    'blocking_failure',
    'not_applicable',
  ])
  const byId = new Map(
    request.checks.map((check) => [check.checkId, check]),
  )
  if (
    request.checks.length
      !== LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS.length
    || byId.size !== request.checks.length
  ) return false
  for (const check of request.checks) {
    if (
      !isRecord(check)
      || !hasExactKeys(check, [
        'checkId',
        'applicable',
        'outcome',
        'observationSummary',
        'evidenceRefIds',
      ])
      || typeof check.checkId !== 'string'
      || !validCheckIds.has(check.checkId)
      || typeof check.applicable !== 'boolean'
      || typeof check.outcome !== 'string'
      || !validOutcomes.has(check.outcome)
      || (check.applicable && check.outcome === 'not_applicable')
      || (!check.applicable && check.outcome !== 'not_applicable')
      || typeof check.observationSummary !== 'string'
      || check.observationSummary.length < 8
      || check.observationSummary.length > 360
      || UNSAFE_TEXT.test(check.observationSummary)
      || !Array.isArray(check.evidenceRefIds)
      || check.evidenceRefIds.length < 1
      || check.evidenceRefIds.some((reference) =>
        typeof reference !== 'string' || !SAFE_ID.test(reference))
    ) return false
  }
  if ([...ALWAYS_APPLICABLE_CHECKS].some(
    (id) => byId.get(id)?.applicable !== true,
  )) return false
  if (
    request.mode === 'living_a_roll'
    && (
      request.sceneEvidence.movingSourceSpeakerPresent !== true
      || byId.get(
        'source_speaker_contact_object_and_product_preservation',
      )?.applicable !== true
    )
  ) return false
  if (
    request.sceneEvidence.exactMapDiagramDataOrDocumentPresent
    && byId.get(
      'map_diagram_document_typography_and_label_accuracy',
    )?.applicable !== true
  ) return false
  if (
    request.sceneEvidence.soundPresent
    && byId.get(
      'sound_narration_protection_spatial_fit_and_restraint',
    )?.applicable !== true
  ) return false
  if (
    request.sceneEvidence.expansionOrReturnTransitionPresent
    && byId.get(
      'transition_expansion_return_and_scene_continuity',
    )?.applicable !== true
  ) return false
  return true
}

function allSha256(values: readonly unknown[]): boolean {
  return values.every(
    (value) => typeof value === 'string' && SHA256.test(value),
  )
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
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
    const child of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(child)
  return value
}
