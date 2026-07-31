export const LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_VERSION =
  'living-frame-non-illustration-readiness-audit-v1' as const

export const LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_CLASS =
  'server_derived_source_only_non_illustration_end_to_end_gap_audit' as const

export type LivingFrameNonIllustrationReadinessStatus =
  | 'verified_source_contract'
  | 'recorded_private_fixture_requires_reinspection'
  | 'open_internal_implementation'
  | 'canonical_owner_reconciliation_pending'
  | 'deferred_by_owner'
  | 'not_required_for_active_scope'

export type LivingFrameNonIllustrationReadinessRequirementId =
  | 'composite_parent_five_modes_and_deliberate_non_use'
  | 'semantic_scene_selection_and_restraint'
  | 'confirmed_frame_master_timing_and_selected_scene_lineage'
  | 'five_mode_private_render_record'
  | 'general_non_character_professional_visual_review'
  | 'component_role_activation_selective_motion_derivation'
  | 'semantic_soundsync_exact_timing_and_mix_lineage'
  | 'advanced_temporal_living_a_roll_mask'
  | 'procedural_artifact_scene_evidence_and_private_review_reconciliation'
  | 'exact_map_diagram_archive_and_hybrid_lineage'
  | 'caption_direction_public_boundary_reconciliation'
  | 'active_scope_private_internal_aggregate'
  | 'professional_non_illustration_fixture_breadth_and_inspection'
  | 'illustrated_character_animation'
  | 'mechanical_object_rigging'
  | 'character_keypose_interpolation_and_identity_stack'

export interface LivingFrameNonIllustrationReadinessRequirement {
  readonly order: number
  readonly requirementId:
    LivingFrameNonIllustrationReadinessRequirementId
  readonly status:
    LivingFrameNonIllustrationReadinessStatus
  readonly evidenceRefs: readonly string[]
  readonly remainingWork: readonly string[]
  readonly blocksActivePrivateInternalReadiness: boolean
  readonly pausedEvidenceMayCountTowardActiveCompletion: false
}

export interface LivingFrameNonIllustrationReadinessAuditDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_NON_ILLUSTRATION_READINESS_AUDIT_CLASS
  readonly auditState:
    'active_non_illustration_scope_audited_implementation_gaps_open'
  readonly sourceBindings: {
    readonly ownerScopeAmendmentVersion:
      'living-frame-owner-scope-amendment-v1'
    readonly ownerScopeAmendmentDigestSha256: string
    readonly historicalReleaseAuditStatus:
      'superseded_for_active_completion_by_owner_scope_amendment'
    readonly historicalAggregateCaseCountMayDefineActiveCompletion:
      false
  }
  readonly activeModeStatus: {
    readonly livingARoll:
      'safe_space_private_fixture_recorded_advanced_temporal_mask_open'
    readonly livingStill:
      'non_character_private_fixture_recorded_reinspection_required'
    readonly livingArchive:
      'private_fixture_recorded_reinspection_required'
    readonly livingDiagram:
      'deterministic_private_fixture_recorded_exact_route_breadth_open'
    readonly hybridExpansion:
      'non_character_private_fixture_recorded_reinspection_required'
    readonly deliberateNonUse:
      'private_fixture_recorded'
  }
  readonly requirements:
    readonly LivingFrameNonIllustrationReadinessRequirement[]
  readonly metrics: {
    readonly requirementCount: number
    readonly verifiedSourceContractCount: number
    readonly recordedPrivateFixtureCount: number
    readonly openInternalImplementationCount: number
    readonly canonicalOwnerReconciliationPendingCount: number
    readonly deferredByOwnerCount: number
    readonly notRequiredForActiveScopeCount: number
    readonly activeBlockingRequirementCount: number
  }
  readonly activePrivateInternalReady: false
  readonly nextRequiredMilestone:
    'general_non_character_professional_visual_review'
  readonly pausedIllustrationAnimationCanResumeWithoutNewOwnerSpecification:
    false
  readonly pausedMechanicalRiggingCanResumeWithoutNewOwnerSpecification:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameNonIllustrationReadinessAudit
  extends LivingFrameNonIllustrationReadinessAuditDraft {
  readonly auditDigestSha256: string
}
