import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import {
  LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_CLASS,
  LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_VERSION,
  type LivingFrameRepresentativeAssetRole,
  type LivingFrameRepresentativeContentKind,
  type LivingFrameRepresentativeMotionPolicy,
  type LivingFrameRepresentativeVisualFixtureCase,
  type LivingFrameRepresentativeVisualFixtureManifest,
  type LivingFrameRepresentativeVisualFixtureManifestDraft,
} from '../../src/types/living-frame-representative-visual-fixture'
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

interface CaseDefinition {
  readonly contentKind: LivingFrameRepresentativeContentKind
  readonly requiredAssetRoles: readonly LivingFrameRepresentativeAssetRole[]
  readonly motionPolicy: LivingFrameRepresentativeMotionPolicy
}

const CASE_DEFINITIONS = [
  definition('real_source_a_roll_with_integrated_visual', ['approved_source_video', 'approved_temporal_mask_or_safe_space_fallback', 'approved_caption_projection'], 'source_motion_plus_integrated_non_character_visuals'),
  definition('approved_static_illustration_without_subject_animation', ['approved_static_illustration', 'approved_caption_projection'], 'no_illustrated_subject_animation'),
  definition('source_bound_non_character_still_with_selective_environmental_motion', ['approved_non_character_still', 'approved_caption_projection'], 'selective_environmental_or_editorial_motion_only'),
  definition('source_verified_archive_document_composition', ['approved_archive_source', 'approved_document_source', 'approved_caption_projection'], 'document_camera_and_layer_motion_only'),
  definition('source_verified_diagram_or_process_visual', ['approved_diagram_source', 'approved_caption_projection'], 'diagram_reveal_and_relationship_motion_only'),
  definition('real_source_a_roll_to_non_character_visual_expansion_and_return', ['approved_source_video', 'approved_non_character_still', 'approved_caption_projection'], 'expansion_return_and_attention_motion_only'),
  definition('source_verified_map_route_or_literal_data_graphic', ['approved_map_source', 'approved_data_source', 'approved_caption_projection'], 'literal_map_route_or_data_reveal_only'),
  definition('real_scene_attention_focus_and_semantic_scale_demonstration', ['approved_source_video', 'approved_non_character_still', 'approved_caption_projection'], 'focus_camera_and_semantic_scale_only'),
  definition('real_scene_camera_depth_occlusion_and_mask_demonstration', ['approved_source_video', 'approved_temporal_mask_or_safe_space_fallback', 'approved_caption_projection'], 'camera_depth_occlusion_and_approved_mask_only'),
  definition('non_character_environmental_editorial_or_preapproved_rigid_support_motion', ['approved_non_character_still', 'approved_caption_projection'], 'preapproved_rigid_transform_without_rig_inference'),
  definition('real_narration_caption_and_soundsync_coordination_demonstration', ['approved_source_video', 'approved_caption_projection', 'approved_soundsync_mix'], 'caption_and_soundsync_timing_only'),
  definition('exact_final_remotion_artifact_professional_review_and_repair', ['approved_remotion_final_artifact', 'approved_caption_projection', 'approved_soundsync_mix'], 'no_new_motion_review_exact_final_artifact'),
] as const satisfies readonly CaseDefinition[]

export function compileLivingFrameRepresentativeVisualFixtureManifest(
  ownerScopeAmendment: LivingFrameOwnerScopeAmendment,
): LivingFrameRepresentativeVisualFixtureManifest {
  if (!verifyLivingFrameOwnerScopeAmendment(ownerScopeAmendment)) {
    throw new Error('Invalid Living Frame owner scope amendment.')
  }
  if (
    ownerScopeAmendment.activeScope.length !== CASE_DEFINITIONS.length
    || ownerScopeAmendment.activeScope.length
      !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.length
  ) throw new Error('Living Frame representative fixture case set is incomplete.')

  const cases = ownerScopeAmendment.activeScope.map(
    (activeScope, order): LivingFrameRepresentativeVisualFixtureCase => {
      const definition = CASE_DEFINITIONS[order]!
      const base = {
        caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]!,
        order,
        activeScope,
        contentKind: definition.contentKind,
        requiredAssetRoles: [...definition.requiredAssetRoles],
        motionPolicy: definition.motionPolicy,
        sourceRequirements: {
          realOrSourceVerifiedRepresentativeMediaRequired: true as const,
          geometryOnlyProbeMayCountAsProfessionalEvidence: false as const,
          syntheticRectanglesMayCountAsProfessionalEvidence: false as const,
          placeholderMayReachFinalReview: false as const,
          exactSourceProvenanceRequired: true as const,
          immutableSourceRereadRequired: true as const,
          confirmedOutputFrameRequired: true as const,
          canonicalMasterTimingRequired: true as const,
          canonicalWorkAndManifestLineageRequired: true as const,
          generatedVideoFallbackPermitted: false as const,
        },
        reviewRequirements: {
          exactProfessionalCheckIds: [
            ...LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
          ],
          completePlaybackInspectionRequired: true as const,
          completeTimeQwenVisualEvidenceRequired: true as const,
          separateVerifiedAudioEvidenceRequired: true as const,
          kimiPrimaryTerraFallbackRecommendationRequired: true as const,
          canonicalPrivateReviewRequired: true as const,
          metricsOnlyAcceptancePermitted: false as const,
          callerAssertionAcceptancePermitted: false as const,
          failedArtifactMayBeReusedAfterRepair: false as const,
          nPlusOneRepairAndCompleteReinspectionRequired: true as const,
        },
        ownerScopeAmendmentDigestSha256:
          ownerScopeAmendment.amendmentDigestSha256,
        narrativeIntentRefDigestSha256: sha256AuthorityValue({
          caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order],
          ref: 'canonical_narrative_intent_pending',
        }),
        styleProfileRefDigestSha256: sha256AuthorityValue({
          caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order],
          ref: 'canonical_style_profile_pending',
        }),
        confirmedFrameRefDigestSha256: sha256AuthorityValue({
          caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order],
          ref: 'canonical_confirmed_frame_pending',
        }),
        masterTimingRefDigestSha256: sha256AuthorityValue({
          caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order],
          ref: 'canonical_master_timing_pending',
        }),
      }
      return deepFreeze({
        ...base,
        caseDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const draft: LivingFrameRepresentativeVisualFixtureManifestDraft = {
    contractVersion: LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_VERSION,
    fixtureClass: LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_CLASS,
    state: 'representative_media_required_engineering_geometry_is_not_acceptance_evidence',
    ownerScopeAmendmentVersion: ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      ownerScopeAmendment.amendmentDigestSha256,
    cases,
    activeCaseCount: 12,
    pausedScopesRejected: [...ownerScopeAmendment.pausedScope],
    pausedScopeCount: 7,
    engineeringGeometryProbeMayApproveProfessionalQuality: false,
    currentEngineeringAggregateMayApproveProfessionalQuality: false,
    representativeMediaRuntimeExecuted: false,
    qwenProviderCallMade: false,
    headQaRecommendationMade: false,
    canonicalPrivateReviewApproved: false,
    canonicalConsumptionPending: true,
    createsPlannerSnapshotTimingWorkAssetRendererQaOrReviewOwner: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    caseSetDigestSha256:
      sha256AuthorityValue(cases.map((entry) => entry.caseDigestSha256)),
    manifestDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeVisualFixtureManifest(
  value: unknown,
  ownerScopeAmendment: LivingFrameOwnerScopeAmendment,
): value is LivingFrameRepresentativeVisualFixtureManifest {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeVisualFixtureManifest(
          ownerScopeAmendment,
        ),
      )
  } catch {
    return false
  }
}

function definition(
  contentKind: LivingFrameRepresentativeContentKind,
  requiredAssetRoles: readonly LivingFrameRepresentativeAssetRole[],
  motionPolicy: LivingFrameRepresentativeMotionPolicy,
): CaseDefinition {
  return { contentKind, requiredAssetRoles, motionPolicy }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
