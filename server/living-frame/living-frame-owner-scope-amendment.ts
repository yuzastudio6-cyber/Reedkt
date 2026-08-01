import {
  LIVING_FRAME_OWNER_SCOPE_AMENDMENT_CLASS,
  LIVING_FRAME_OWNER_SCOPE_AMENDMENT_VERSION,
  type LivingFrameOwnerScopeAmendment,
  type LivingFrameOwnerScopeAmendmentDraft,
} from '../../src/types/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const ACTIVE_SCOPE = [
  'living_a_roll_compositing',
  'static_illustration_without_character_animation',
  'living_still_non_character_selective_motion',
  'living_archive',
  'living_diagram',
  'hybrid_expansion_non_character',
  'maps_routes_and_data_graphics',
  'attention_focus_and_semantic_scale',
  'camera_depth_occlusion_and_masks',
  'environmental_editorial_and_rigid_support_motion',
  'sound_story_timing_and_caption_coordination',
  'remotion_composition_qa_and_private_review',
] as const satisfies LivingFrameOwnerScopeAmendmentDraft['activeScope']

const PAUSED_SCOPE = [
  'illustrated_character_animation',
  'living_or_organic_subject_animation',
  'complete_character_keypose_generation',
  'character_pose_interpolation',
  'character_frame_cadence_smoothing',
  'living_or_organic_subject_rigging',
  'mechanical_object_rigging',
] as const satisfies LivingFrameOwnerScopeAmendmentDraft['pausedScope']

export function compileLivingFrameOwnerScopeAmendment():
LivingFrameOwnerScopeAmendment {
  const draft: LivingFrameOwnerScopeAmendmentDraft = {
    contractVersion:
      LIVING_FRAME_OWNER_SCOPE_AMENDMENT_VERSION,
    resultClass:
      LIVING_FRAME_OWNER_SCOPE_AMENDMENT_CLASS,
    policyState:
      'non_illustration_living_frame_active_animation_routes_paused',
    ownerDecision: {
      staticIllustrationMayRemainAsAStillVisualElement: true,
      illustratedCharacterAnimationPaused: true,
      livingOrOrganicSubjectAnimationPaused: true,
      livingOrOrganicSubjectRiggingForbidden: true,
      mechanicalRiggingPausedPendingSeparateOwnerSpecification: true,
      priorCharacterAnimationResearchMayAuthorizeAdmission: false,
      resumeRequiresExplicitFutureOwnerSpecification: true,
    },
    activeScope: structuredClone(ACTIVE_SCOPE),
    pausedScope: structuredClone(PAUSED_SCOPE),
    routingRules: {
      activeNonIllustrationWorkMustContinue: true,
      characterKeyposeAdmissionWrapperMayBeCompiled: false,
      completeCharacterControlledImageOperationMayBeAdmitted: false,
      toonCrafterCharacterInterpolationMayBeAdmitted: false,
      rifeCharacterCadenceSmoothingMayBeAdmitted: false,
      blenderOrOpenToonzLivingSubjectRigMayBeAdmitted: false,
      mechanicalRigOperationMayBeAdmitted: false,
      unknownSubjectMayDefaultToMechanical: false,
      genericSelectedSceneComfyUiRequestContractRemainsUnchanged: true,
      remotionOwnsFinalCanvas: true,
      masterTimingRemainsCanonical: true,
    },
    evidencePolicy: {
      rejectedGenericCharacterRigRendersRemainNegativeEvidenceOnly: true,
      priorSourceContractsRemainResearchNotActiveAdmission: true,
      technicalMetricsCannotApproveVisualQuality: true,
      headIntelligenceMustInspectEveryRenderedFixture: true,
    },
    authorityBoundary: {
      operationRegistryAuthority: false,
      providerAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      assetAuthority: false,
      qaApprovalAuthority: false,
      renderAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    },
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    canonicalQaApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    amendmentDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameOwnerScopeAmendment(
  value: unknown,
): value is LivingFrameOwnerScopeAmendment {
  if (
    !isRecord(value)
    || typeof value.amendmentDigestSha256 !== 'string'
  ) return false
  const expected = compileLivingFrameOwnerScopeAmendment()
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(expected)
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
