import type {
  LivingFrameNonIllustrationReadinessAudit,
  LivingFrameNonIllustrationReadinessAuditDraft,
  LivingFrameNonIllustrationReadinessRequirement,
  LivingFrameNonIllustrationReadinessStatus,
} from '../../src/types/living-frame-non-illustration-readiness-audit'
import {
  LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_CLASS,
  LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_VERSION,
} from '../../src/types/living-frame-non-illustration-readiness-audit'
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

const REQUIREMENTS = [
  requirement({
    requirementId:
      'composite_parent_five_modes_and_deliberate_non_use',
    status: 'verified_source_contract',
    evidenceRefs: [
      'living-frame-professional-skill-component-v1',
      'living-frame-subject-neutral-capability-matrix',
    ],
  }),
  requirement({
    requirementId:
      'semantic_scene_selection_and_restraint',
    status: 'verified_source_contract',
    evidenceRefs: [
      'living-frame-semantic-scene-proposal-binding-v1',
      'living-frame-selected-scene-admission-v1',
    ],
  }),
  requirement({
    requirementId:
      'confirmed_frame_master_timing_and_selected_scene_lineage',
    status: 'verified_source_contract',
    evidenceRefs: [
      'canonical-living-frame-timing-binding-v1',
      'living-frame-selected-scene-binding-v1',
      'living-frame-approved-lineage-binding-v1',
    ],
  }),
  requirement({
    requirementId: 'five_mode_private_render_record',
    status:
      'recorded_private_fixture_requires_reinspection',
    evidenceRefs: [
      'living-frame-five-mode-private-render-internal-test',
      'living-frame-confirmed-ratio-private-render-internal-test',
    ],
    remainingWork: [
      'reinspect_actual_non_character_artifacts_under_general_scene_review',
      'do_not_infer_professional_acceptance_from_pixel_metrics',
    ],
  }),
  requirement({
    requirementId:
      'general_non_character_professional_visual_review',
    status: 'open_internal_implementation',
    evidenceRefs: [
      'living-frame-professional-visual-review-v1-character_specific',
    ],
    remainingWork: [
      'add_scene_level_non_character_review_checks',
      'require_head_intelligence_full_playback_and_sampled_frame_inspection',
      'block_downstream_reconciliation_on_reject_or_repair',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'component_role_activation_selective_motion_derivation',
    status: 'canonical_owner_reconciliation_pending',
    evidenceRefs: [
      'living-frame-selected-scene-selective-motion-reconciliation-v1',
    ],
    remainingWork: [
      'derive_tracks_from_component_role_and_linked_activation',
      'remove_scene_verb_rotation_broadcast',
      'preserve_static_anchors_and_environmental_component_semantics',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'semantic_soundsync_exact_timing_and_mix_lineage',
    status: 'canonical_owner_reconciliation_pending',
    evidenceRefs: [
      'living-frame-semantic-sound-timing-reconciliation-v1',
    ],
    remainingWork: [
      'carry_semantic_trigger_identity_and_motion_lineage',
      'resolve_exact_hit_envelope_asset_mix_and_narration_protection',
      'persist_storytiming_soundsync_snapshot_and_work_lineage',
    ],
    blocks: true,
  }),
  requirement({
    requirementId: 'advanced_temporal_living_a_roll_mask',
    status: 'open_internal_implementation',
    evidenceRefs: [
      'canonical-backend-temporal-mask-admission-576ca54b',
      'canonical-backend-sam2-runtime-bridge-3e59ce45',
    ],
    remainingWork: [
      'release_hardened_sam2_runtime_contract',
      'run_real_l4_temporal_mask_inference',
      'persist_and_measure_edge_temporal_coverage_and_contact_object_qa',
      'retain_safe_space_fallback_when_mask_risk_is_high',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'procedural_artifact_scene_evidence_and_private_review_reconciliation',
    status: 'canonical_owner_reconciliation_pending',
    evidenceRefs: [
      'living-frame-selected-scene-environmental-particle-scene-qa-internal-test-v1',
      'living-frame-selected-scene-environmental-particle-private-review-internal-test-v1',
    ],
    remainingWork: [
      'add_canonical_procedural_timeline_artifact_discharge',
      'bind_generic_scene_evidence_and_private_review_without_parallel_owner',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'exact_map_diagram_archive_and_hybrid_lineage',
    status: 'open_internal_implementation',
    evidenceRefs: [
      'living-frame-five-mode-private-render-internal-test',
      'canonical-map-dataviz-remotion-ownership',
    ],
    remainingWork: [
      'add_exact_source_bound_map_or_route_fixture',
      'add_readable_archive_document_and_exact_diagram_fixture',
      'bind_each_to_snapshot_work_asset_timing_renderer_qa_and_review',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'caption_direction_public_boundary_reconciliation',
    status: 'canonical_owner_reconciliation_pending',
    evidenceRefs: [
      'caption-direction-living-frame-adapter-v1',
      'caption-motion-handoff-plan-v1',
    ],
    remainingWork: [
      'merge_or_adapt_public_types_at_canonical_one_writer_boundary',
      'preserve_caption_and_living_frame_ownership_separation',
      'verify_shared_occupancy_attention_and_storytiming_lineage',
    ],
    blocks: true,
  }),
  requirement({
    requirementId: 'active_scope_private_internal_aggregate',
    status: 'open_internal_implementation',
    evidenceRefs: [
      'living-frame-private-internal-end-to-end-audit-historical',
    ],
    remainingWork: [
      'create_non_illustration_aggregate',
      'exclude_all_paused_character_animation_and_rigging_cases',
      'fail_closed_on_any_paused_evidence_counted_as_active_completion',
    ],
    blocks: true,
  }),
  requirement({
    requirementId:
      'professional_non_illustration_fixture_breadth_and_inspection',
    status: 'open_internal_implementation',
    evidenceRefs: [
      'living-frame-five-mode-private-render-internal-test',
    ],
    remainingWork: [
      'render_representative_non_illustration_scenes_at_confirmed_frames',
      'inspect_every_full_clip_and_required_sample_frame',
      'repair_or_reject_every_non_professional_result',
    ],
    blocks: true,
  }),
  requirement({
    requirementId: 'illustrated_character_animation',
    status: 'deferred_by_owner',
    evidenceRefs: [
      'living-frame-owner-scope-amendment-v1',
    ],
    remainingWork: [
      'wait_for_explicit_future_owner_animation_specification',
    ],
  }),
  requirement({
    requirementId: 'mechanical_object_rigging',
    status: 'deferred_by_owner',
    evidenceRefs: [
      'living-frame-owner-scope-amendment-v1',
    ],
    remainingWork: [
      'wait_for_separate_explicit_owner_mechanical_rig_specification',
    ],
  }),
  requirement({
    requirementId:
      'character_keypose_interpolation_and_identity_stack',
    status: 'not_required_for_active_scope',
    evidenceRefs: [
      'living-frame-owner-scope-amendment-v1',
    ],
    remainingWork: [
      'preserve_as_non_admissible_research_only',
    ],
  }),
] as const satisfies readonly Omit<
  LivingFrameNonIllustrationReadinessRequirement,
  'order'
>[]

export interface CompileLivingFrameNonIllustrationReadinessAuditInput {
  readonly ownerScopeAmendment:
    LivingFrameOwnerScopeAmendment
}

export function compileLivingFrameNonIllustrationReadinessAudit(
  input:
    CompileLivingFrameNonIllustrationReadinessAuditInput,
): LivingFrameNonIllustrationReadinessAudit {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['ownerScopeAmendment'])
    || !verifyLivingFrameOwnerScopeAmendment(
      input.ownerScopeAmendment,
    )
  ) throw new Error('Invalid Living Frame owner scope amendment.')
  const requirements = REQUIREMENTS.map(
    (entry, order) => ({ ...structuredClone(entry), order }),
  )
  const count = (
    status: LivingFrameNonIllustrationReadinessStatus,
  ) => requirements.filter(
    (entry) => entry.status === status,
  ).length
  const activeBlockingRequirementCount =
    requirements.filter(
      (entry) =>
        entry.blocksActivePrivateInternalReadiness,
    ).length
  const draft:
    LivingFrameNonIllustrationReadinessAuditDraft = {
      contractVersion:
        LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_VERSION,
      resultClass:
        LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_CLASS,
      auditState:
        'active_non_illustration_scope_audited_implementation_gaps_open',
      sourceBindings: {
        ownerScopeAmendmentVersion:
          input.ownerScopeAmendment.contractVersion,
        ownerScopeAmendmentDigestSha256:
          input.ownerScopeAmendment.amendmentDigestSha256,
        historicalReleaseAuditStatus:
          'superseded_for_active_completion_by_owner_scope_amendment',
        historicalAggregateCaseCountMayDefineActiveCompletion:
          false,
      },
      activeModeStatus: {
        livingARoll:
          'safe_space_private_fixture_recorded_advanced_temporal_mask_open',
        livingStill:
          'non_character_private_fixture_recorded_reinspection_required',
        livingArchive:
          'private_fixture_recorded_reinspection_required',
        livingDiagram:
          'deterministic_private_fixture_recorded_exact_route_breadth_open',
        hybridExpansion:
          'non_character_private_fixture_recorded_reinspection_required',
        deliberateNonUse:
          'private_fixture_recorded',
      },
      requirements,
      metrics: {
        requirementCount: requirements.length,
        verifiedSourceContractCount:
          count('verified_source_contract'),
        recordedPrivateFixtureCount:
          count('recorded_private_fixture_requires_reinspection'),
        openInternalImplementationCount:
          count('open_internal_implementation'),
        canonicalOwnerReconciliationPendingCount:
          count('canonical_owner_reconciliation_pending'),
        deferredByOwnerCount:
          count('deferred_by_owner'),
        notRequiredForActiveScopeCount:
          count('not_required_for_active_scope'),
        activeBlockingRequirementCount,
      },
      activePrivateInternalReady: false,
      nextRequiredMilestone:
        'general_non_character_professional_visual_review',
      pausedIllustrationAnimationCanResumeWithoutNewOwnerSpecification:
        false,
      pausedMechanicalRiggingCanResumeWithoutNewOwnerSpecification:
        false,
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
    auditDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameNonIllustrationReadinessAudit(
  value: unknown,
  input:
    CompileLivingFrameNonIllustrationReadinessAuditInput,
): value is LivingFrameNonIllustrationReadinessAudit {
  if (
    !isRecord(value)
    || typeof value.auditDigestSha256 !== 'string'
  ) return false
  try {
    const expected =
      compileLivingFrameNonIllustrationReadinessAudit(input)
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function requirement(input: {
  readonly requirementId:
    LivingFrameNonIllustrationReadinessRequirement['requirementId']
  readonly status:
    LivingFrameNonIllustrationReadinessRequirement['status']
  readonly evidenceRefs: readonly string[]
  readonly remainingWork?: readonly string[]
  readonly blocks?: boolean
}): Omit<LivingFrameNonIllustrationReadinessRequirement, 'order'> {
  return {
    requirementId: input.requirementId,
    status: input.status,
    evidenceRefs: input.evidenceRefs,
    remainingWork: input.remainingWork ?? [],
    blocksActivePrivateInternalReadiness:
      input.blocks ?? false,
    pausedEvidenceMayCountTowardActiveCompletion: false,
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every(
      (key, index) => key === expected[index],
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
    const child of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(child)
  return value
}
