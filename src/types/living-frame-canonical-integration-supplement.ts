export const LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_VERSION =
  'living-frame-canonical-integration-supplement-v1' as const

export const LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_CLASS =
  'byte_free_non_executable_whole_pipeline_handoff_manifest' as const

export const LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS = [
  'professional_skill_selection_and_plan_publication',
  'approved_snapshot',
  'master_timing_and_story_timing',
  'speaker_layout_depth_occlusion_and_masks',
  'soundsync',
  'caption_direction',
  'estimate_and_actual_cost',
  'approved_work_graph',
  'asset_manifest_and_reconciliation',
  'remotion_final_canvas',
  'deterministic_final_qa',
  'postrender_qwen_visual_evidence',
  'separate_verified_audio_and_head_qa',
  'n_plus_one_repair_and_reinspection',
  'canonical_private_review_and_chat_presentation',
] as const

export type LivingFrameCanonicalConsumptionPointId =
  typeof LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS[number]

export const LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS = [
  'shared_professional_skill_policy_not_reconciled',
  'chat_presentation_not_consumed_or_persisted',
  'motion_v3_not_consumed_by_canonical_work_and_renderer',
  'soundsync_exact_cue_mix_response_not_released',
  'postrender_qwen_work_provider_and_complete_time_runtime_not_released',
  'separate_audio_to_head_qa_to_private_review_chain_not_released',
  'sam2_hardened_l4_temporal_mask_persistence_and_qa_open',
  'procedural_timeline_generic_artifact_reconciliation_open',
  'map_archive_diagram_hybrid_canonical_reread_and_execution_open',
  'caption_public_boundary_canonical_reconciliation_open',
  'active_twelve_case_runtime_aggregate_open',
  'representative_professional_visual_inspection_and_repair_open',
] as const

export type LivingFrameCanonicalIntegrationBlockerId =
  typeof LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS[number]

export type LivingFrameCanonicalIntegrationSourceRefId =
  | 'owner_scope_amendment'
  | 'active_professional_skill_policy_projection'
  | 'active_non_illustration_aggregate'
  | 'active_non_illustration_evidence_admission'
  | 'non_character_content_lineage'
  | 'postrender_visual_inspection_contract'
  | 'chat_plan_presentation'
  | 'caption_direction_public_boundary'
  | 'canonical_motion_v3'
  | 'semantic_soundsync_reconciliation'

export interface LivingFrameCanonicalIntegrationSourceRef {
  readonly sourceRefId:
    LivingFrameCanonicalIntegrationSourceRefId
  readonly contractVersion: string
  readonly digestSha256: string
  readonly digestClass:
    | 'owner_policy_object'
    | 'verified_policy_projection'
    | 'representative_source_regression'
    | 'contract_identity'
  readonly canonicalRereadRequired: boolean
  readonly sourceRefDigestSha256: string
}

export interface LivingFrameCanonicalConsumptionPoint {
  readonly order: number
  readonly consumptionPointId:
    LivingFrameCanonicalConsumptionPointId
  readonly canonicalOwner: string
  readonly consumes: readonly string[]
  readonly mustProduceOrPreserve: readonly string[]
  readonly sourceRefIds:
    readonly LivingFrameCanonicalIntegrationSourceRefId[]
  readonly currentState:
    | 'verified_source_boundary_canonical_consumption_pending'
    | 'canonical_runtime_or_provider_evidence_open'
  readonly createsParallelOwner: false
  readonly consumptionPointDigestSha256: string
}

export interface LivingFrameCanonicalToolRoute {
  readonly order: number
  readonly toolId: string
  readonly operationId: string | null
  readonly identityState:
    | 'existing_production_identity'
    | 'existing_non_e2e_capability_identity'
  readonly currentScopeUse: string
  readonly operationRegistrationOrDispatchGrantedBySupplement: false
  readonly createsNewIdentity: false
}

export interface LivingFrameControlledGenerationRole {
  readonly order: number
  readonly roleId:
    | 'comfyui_host'
    | 'controlnet_aux_preparation'
    | 'controlnet_conditioning'
    | 'generic_ip_adapter_clip_vision'
    | 'peft_lora_adapter'
    | 'auraface_optional_cpu_qa'
  readonly executableIdentityOwner:
    | 'comfyui'
    | 'future_auraface_cpu_qa_identity'
  readonly separateToolIdentityRequired: boolean
  readonly separateChargeEventRequired: boolean
  readonly activeOwnerScopeAdmission:
    | 'static_illustration_only_release_gates_open'
    | 'not_admissible_under_current_owner_scope'
}

export interface LivingFrameCanonicalIntegrationSupplementDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_VERSION
  readonly supplementClass:
    typeof LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_CLASS
  readonly supplementState:
    'whole_pipeline_source_handoff_complete_canonical_consumption_and_runtime_evidence_pending'
  readonly sourceRefs:
    readonly LivingFrameCanonicalIntegrationSourceRef[]
  readonly sourceRefSetDigestSha256: string
  readonly canonicalConsumptionPoints:
    readonly LivingFrameCanonicalConsumptionPoint[]
  readonly canonicalConsumptionPointSetDigestSha256: string
  readonly toolRoutes: readonly LivingFrameCanonicalToolRoute[]
  readonly toolRouteSetDigestSha256: string
  readonly controlledGenerationRoles:
    readonly LivingFrameControlledGenerationRole[]
  readonly controlledGenerationRoleSetDigestSha256: string
  readonly observedRegistryState: {
    readonly productionIdentityCount: number
    readonly nonE2ECapabilityIdentityCount: number
    readonly registryCountIsNotProductCap: true
    readonly expansionPermittedForDistinctReleasedExecutable: true
    readonly modelWeightsAdaptersLibrariesAndCapabilitiesAreNotIdentities:
      true
  }
  readonly specialistModelRoles: {
    readonly visualEvidenceSpecialist:
      'qwen2_5_vl_visual_understanding'
    readonly headQaPrimary: 'kimi_k3_main_edit_agent'
    readonly headQaFallback:
      'gpt_5_6_terra_fallback_edit_agent'
    readonly qwenMayApproveOrSetDirection: false
    readonly headQaMayReplaceCanonicalPrivateReview: false
  }
  readonly activeScopeCount: 12
  readonly pausedScopeCount: 7
  readonly staticIllustrationWithoutCharacterAnimationAllowed: true
  readonly pausedCharacterAndMechanicalRoutesNonAdmissible: true
  readonly blockerIds:
    readonly LivingFrameCanonicalIntegrationBlockerId[]
  readonly blockerSetDigestSha256: string
  readonly exactSharedInterfaceBlockerCount: 12
  readonly canonicalConsumptionPending: true
  readonly sharedRegistryMutated: false
  readonly sharedPlannerMutated: false
  readonly sharedUiMutated: false
  readonly directPrivateReviewAdapterClaimed: false
  readonly createsReadinessApprovalWorkAssetTimingRendererOrReviewOwner:
    false
  readonly containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
    false
  readonly operationRegistered: false
  readonly providerCallMade: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly artifactCreated: false
  readonly costAdmitted: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCanonicalIntegrationSupplement
  extends LivingFrameCanonicalIntegrationSupplementDraft {
  readonly supplementDigestSha256: string
}
