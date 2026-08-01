import type {
  ProfessionalSkillDefinition,
} from './professional-skills'

export const LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_VERSION =
  'living-frame-active-professional-skill-policy-projection-v1' as const

export const LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_CLASS =
  'byte_free_non_executable_professional_skill_policy_delta' as const

export const LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID =
  'motion.living_frame_storytelling' as const

export const LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES = [
  'living_frame_component_required_before_approval',
  'living_frame_non_use_allowed',
  'canonical_timing_revalidation_required',
  'alpha_provenance_verification_required',
] as const

export const LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA = [
  'owner_scope_amendment_required',
  'paused_character_and_mechanical_routes_non_admissible',
  'complete_time_postrender_visual_evidence_required',
  'separate_verified_audio_evidence_required',
  'kimi_primary_terra_fallback_head_qa_recommendation_required',
  'n_plus_one_repair_and_reinspection_required',
  'canonical_private_review_required',
] as const

export type LivingFrameCurrentProfessionalSkillQaGate =
  typeof LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES[number]

export type LivingFrameActiveProfessionalSkillQaGateDelta =
  typeof LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA[number]

export interface LivingFrameActiveProfessionalSkillPolicyAuthorityBoundary {
  readonly sourcePolicyProjectionOnly: true
  readonly professionalSkillRegistryAuthority: false
  readonly plannerSelectionAuthority: false
  readonly publicationAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly toolAuthority: false
  readonly providerAuthority: false
  readonly runtimeAuthority: false
  readonly dispatchAuthority: false
  readonly costAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameActiveProfessionalSkillPolicyProjectionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_VERSION
  readonly projectionClass:
    typeof LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_CLASS
  readonly projectionState:
    'feature_branch_policy_delta_frozen_canonical_one_writer_reconciliation_pending'
  readonly canonicalSkillId:
    typeof LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID
  readonly canonicalSkillDefinitionVersion: null
  readonly canonicalSkillDefinitionVersionState:
    'shared_definition_has_no_explicit_version_field'
  readonly canonicalSkillDefinitionSnapshot: ProfessionalSkillDefinition
  readonly canonicalSkillDefinitionDigestSha256: string
  readonly observedRegistryDefinitionCount: 110
  readonly observedRegistryDefinitionCountIsProductCap: false
  readonly canonicalLivingFrameDefinitionCount: 1
  readonly currentQaGates:
    readonly LivingFrameCurrentProfessionalSkillQaGate[]
  readonly additiveOrderedQaGateDelta:
    readonly LivingFrameActiveProfessionalSkillQaGateDelta[]
  readonly projectedQaGates:
    readonly (
      LivingFrameCurrentProfessionalSkillQaGate
      | LivingFrameActiveProfessionalSkillQaGateDelta
    )[]
  readonly projectedQaGateSetDigestSha256: string
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly hiddenAdapterToolNames: readonly []
  readonly backendIntents: readonly []
  readonly executionModes: readonly ['plan_only']
  readonly currentCanonicalRegistryAlreadyEmitsDelta: false
  readonly sharedRegistryMutatedByProjection: false
  readonly canonicalConsumptionPending: true
  readonly canonicalOneWriterReconciliationRequired: true
  readonly selectionPublicationAndApprovedSnapshotDigestPropagationRequired:
    true
  readonly fullCanonicalPlannerRegistryRegressionRequired: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly authorityBoundary:
    LivingFrameActiveProfessionalSkillPolicyAuthorityBoundary
  readonly toolSelected: false
  readonly providerSelected: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly costAdmitted: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameActiveProfessionalSkillPolicyProjection
  extends LivingFrameActiveProfessionalSkillPolicyProjectionDraft {
  readonly projectionDigestSha256: string
}
