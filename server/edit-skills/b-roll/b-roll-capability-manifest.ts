import { createSkillCapabilityManifest } from '../core/skill-capability-manifest-hash'
import type { SkillQaReference } from '../core/skill-capability-manifest-types'
import { BROLL_ACCEPTED_ARTIFACT_TYPES, BROLL_PRODUCED_ARTIFACT_TYPES } from './b-roll-artifact-types'
import {
  BROLL_INTEGRATION_QA_KEYS,
  BROLL_OUTPUT_QA_KEYS,
  BROLL_PLANNING_QA_KEYS,
} from './b-roll-qa-policy'
import { BROLL_QUALIFICATION_FIXTURES } from './b-roll-qualification'
import { BROLL_CANONICAL_WORK_DEFINITIONS } from './b-roll-work-graph-compiler'
import { BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE } from './b-roll-visual-intelligence-dependency'

export const BROLL_JOB_TYPES = [
  'validate_b_roll_assignment',
  'validate_b_roll_range_authority',
  'validate_b_roll_source',
  'prepare_b_roll_source',
  'generate_b_roll_candidate',
  'inspect_b_roll_candidate_with_ffprobe',
  'normalize_b_roll_candidate_with_ffmpeg',
  'run_b_roll_technical_qa',
  'run_b_roll_semantic_visual_qa',
  'prepare_b_roll_remotion_layer',
  'render_b_roll_preview',
  'run_b_roll_preview_qa',
  'project_b_roll_result_receipt',
] as const

export const BROLL_PHASES = [
  'orchestra_assignment',
  'skill_planning',
  'plan_validation',
  'provider_generation',
  'media_inspection',
  'media_normalization',
  'skill_output_qa',
  'layer_preparation',
  'private_preview_render',
  'integration_qa',
  'result_projection',
  'final_composition',
] as const

export const BROLL_TOOL_OPERATIONS = [
  'tool.ffprobe.inspect_approved_media.v1',
  'tool.ffmpeg.execute_approved_media_recipe.v1',
  'tool.remotion.render_approved_composition.v1',
] as const

export const BROLL_PROVIDER_OPERATIONS = [
  'provider.google.generate_b_roll_candidate.v1',
] as const

export const BROLL_SOURCE_OPERATIONS = [
  'b_roll.source.existing_project_clip.v1',
  'b_roll.source.approved_user_asset.v1',
] as const

export const BROLL_NO_ACTION_OPERATIONS = ['b_roll.no_action.v1'] as const

function qaRefs(
  keys: readonly string[],
  severity: SkillQaReference['severity'] = 'blocking',
): SkillQaReference[] {
  return keys.map((qaKey) => ({ qaKey, severity, description: `B-roll ${qaKey.split('.').at(-1)?.replaceAll('_', ' ')} validation.` }))
}

const PRIMARY_VISUAL_MEDIA_JOBS = new Set([
  'prepare_b_roll_source',
  'generate_b_roll_candidate',
  'normalize_b_roll_candidate_with_ffmpeg',
  'render_b_roll_preview',
])

const workDefinitionByJob = new Map(
  BROLL_CANONICAL_WORK_DEFINITIONS.map((definition) => [definition.jobType, definition]),
)

function supportedJobCapability(jobType: (typeof BROLL_JOB_TYPES)[number]) {
  const definition = workDefinitionByJob.get(jobType)
  if (!definition) throw new Error(`B-roll manifest job ${jobType} has no canonical work definition.`)
  return {
    jobType,
    planningAllowed: true,
    executionAllowed: true,
    allowedPhases: [definition.allowedPhase],
    requiredArtifactTypes: [...definition.inputArtifactTypes],
    producedArtifactTypes: [definition.output],
    primaryVisualOwnershipPossible: PRIMARY_VISUAL_MEDIA_JOBS.has(jobType),
    runtimeBindingRequired: true,
    minimumQualificationStatus: 'internal_execution_qualified' as const,
  }
}

function routeCapability(input: {
  routeKey: string
  routeKind: 'tool' | 'provider' | 'source' | 'no_action'
  supportedJobTypes: readonly (typeof BROLL_JOB_TYPES)[number][]
  operationIds: readonly string[]
  requiredArtifactTypes: readonly string[]
  priority: number
  requiresApproval: boolean
  description: string
}) {
  return {
    ...input,
    minimumQualificationStatus: 'internal_execution_qualified' as const,
    callerSelectable: false as const,
    automaticRetry: false as const,
    automaticAlternateProviderFallback: false as const,
  }
}

export const BROLL_CAPABILITY_MANIFEST = createSkillCapabilityManifest({
  schemaVersion: 'skill-capability-manifest-v2',
  skillKey: 'b_roll',
  skillVersion: '1.0.0',
  contractVersion: 'b_roll.skill_contract.v1',
  qualificationStatus: 'internal_execution_qualified',
  skillClass: 'creative_visual_asset_skill',
  coordinationCritical: true,
  canOwnPrimaryVisual: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: 'context_read_only',
  canOperateAtSceneLevel: 'bounded_plan_and_execution',
  canOperateAtBoundaryLevel: 'coordination_only',
  supportedJobTypes: BROLL_JOB_TYPES.map(supportedJobCapability),
  unsupportedJobTypes: [
    { jobType: 'generate_verified_proof', reason: 'Generated media cannot establish verified proof.', resolution: 'reject' },
    { jobType: 'mutate_outside_authorized_range', reason: 'B-roll write authority is bounded to the assigned range.', resolution: 'reject' },
    { jobType: 'author_final_captions', reason: 'Captions owns final caption authorship and layout.', resolution: 'delegate', alternateOwnerSkillKey: 'captions' },
    { jobType: 'mix_final_audio', reason: 'Sound owns final audio mix authority.', resolution: 'delegate', alternateOwnerSkillKey: 'sound' },
    { jobType: 'grade_final_color', reason: 'Color owns final grade authority.', resolution: 'delegate', alternateOwnerSkillKey: 'color' },
    { jobType: 'execute_specialized_transition', reason: 'Transition owns scene-boundary transition execution.', resolution: 'delegate', alternateOwnerSkillKey: 'transition' },
    { jobType: 'perform_object_tracking', reason: 'Track All owns model-neutral tracking execution.', resolution: 'delegate', alternateOwnerSkillKey: 'track_all' },
    { jobType: 'render_final_export', reason: 'Render owns final composition and export.', resolution: 'delegate', alternateOwnerSkillKey: 'render' },
    { jobType: 'search_unqualified_stock_library', reason: 'No rights-aware stock integration is qualified.', resolution: 'reject' },
    { jobType: 'select_caller_provider_route', reason: 'Provider and tool executables are selected only by the approved manifest.', resolution: 'reject' },
    { jobType: 'execute_caller_command', reason: 'Caller-selected executables are prohibited.', resolution: 'reject' },
  ],
  requiredInputs: [
    { key: 'assignment', artifactType: 'b_roll_assignment_v1', description: 'Immutable orchestra assignment and write-range authority.', minimumCount: 1, maximumCount: 1 },
    { key: 'context', artifactType: 'b_roll_context_manifest_v1', description: 'Read-only whole-video and adjacent-scene context.', minimumCount: 1, maximumCount: 1 },
    { key: 'source_inventory', artifactType: 'source_inventory_v1', description: 'Checksum-bound eligible project sources.', minimumCount: 1, maximumCount: 1 },
    { key: 'master_timing', artifactType: 'master_timing_plan_v1', description: 'Frame-exact approved planning timing authority.', minimumCount: 1, maximumCount: 1 },
    { key: 'visual_ownership', artifactType: 'visual_ownership_manifest_v1', description: 'Exclusive primary and support-layer ownership windows.', minimumCount: 1, maximumCount: 1 },
  ],
  optionalInputs: [
    { key: 'transcript', artifactType: 'transcript_evidence_v1', description: 'Meaning and phrase anchors.', minimumCount: 0, maximumCount: 1 },
    { key: 'visual_intelligence_candidate_qa', artifactType: BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE, description: 'Model-neutral semantic QA for an exact generated or provider-edited candidate.', minimumCount: 0, maximumCount: 1 },
    { key: 'edit_preference', artifactType: 'edit_preference_snapshot_v1', description: 'Exact edit preference authority.', minimumCount: 0, maximumCount: 1 },
    { key: 'reference_dna', artifactType: 'reference_dna_v1', description: 'Style influence with do-not-copy constraints.', minimumCount: 0, maximumCount: 1 },
    { key: 'caption_zones', artifactType: 'caption_reserved_zones_v1', description: 'Caption ownership and reserved layout windows.', minimumCount: 0, maximumCount: 1 },
    { key: 'track_graph', artifactType: 'track_graph_v1', description: 'Model-neutral tracking dependency only.', minimumCount: 0, maximumCount: 1 },
    { key: 'prior_b_roll', artifactType: 'prior_b_roll_result_v1', description: 'Prior concept and repetition evidence.', minimumCount: 0, maximumCount: 100 },
    { key: 'approved_user_asset', artifactType: 'approved_user_asset_v1', description: 'User-approved source with rights/privacy evidence.', minimumCount: 0, maximumCount: 100 },
    { key: 'source_media', artifactType: 'source_media_artifact_v1', description: 'Private immutable source bytes by reference.', minimumCount: 0, maximumCount: 100 },
  ],
  requiredSceneContext: [
    { key: 'authorized_scene', required: true, readScope: 'assignment_range', description: 'Exact mutable scene range.' },
    { key: 'adjacent_story_continuity', required: true, readScope: 'adjacent_scenes', description: 'Read-only entry and exit context.' },
    { key: 'whole_video_story', required: true, readScope: 'whole_video_read_only', description: 'Read-only story, repetition, and prior B-roll context.' },
  ],
  requiredSourceEvidence: [
    { requirementKey: 'immutable_source_identity', acceptedArtifactTypes: ['source_inventory_v1', 'source_media_artifact_v1'], condition: 'source_route_selected', missingBehavior: 'block' },
    { requirementKey: 'source_checksum', acceptedArtifactTypes: ['source_media_artifact_v1', 'approved_user_asset_v1'], condition: 'source_or_reference_asset_selected', missingBehavior: 'block' },
    { requirementKey: 'rights_privacy_and_proof', acceptedArtifactTypes: ['source_inventory_v1', 'approved_user_asset_v1'], condition: 'non_project_or_generated_input_selected', missingBehavior: 'needs_user_confirmation' },
    { requirementKey: 'crop_feasibility', acceptedArtifactTypes: ['source_inventory_v1'], condition: 'existing_source_selected', missingBehavior: 'use_no_action' },
  ],
  visualIntelligenceRequirements: [
    {
      requirementKey: 'candidate_semantic_acceptance',
      requiredArtifactType: BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE,
      requiredForPhase: 'skill_output_qa',
      condition: 'generated_or_provider_edited_candidate',
      semanticQaRequirement: 'required_for_generated_or_provider_edited',
      wholeVideoEvidencePermission: 'read_only',
      productionAcceptanceRequirement: 'production_qualified_producer',
      injectedTestOnlyBehavior: 'reject_for_production',
    },
  ],
  trackingRequirements: [
    {
      requirementKey: 'model_neutral_track_graph',
      condition: 'motion_locked_placement_requires_tracking',
      acceptedArtifactType: 'track_graph_v1',
      ownerSkill: 'track_all',
      missingDependencyBehavior: 'needs_other_skill',
      modelSpecificDependencyAllowed: false,
      requiredForPhase: 'layer_preparation',
    },
  ],
  acceptedArtifactTypes: [...BROLL_ACCEPTED_ARTIFACT_TYPES],
  producedArtifactTypes: [...BROLL_PRODUCED_ARTIFACT_TYPES],
  planningPhase: {
    phase: 'skill_planning',
    condition: 'assignment_received',
    blockingBehavior: 'block',
    approvedPlanRequired: false,
  },
  allowedExecutionPhases: [
    'plan_validation', 'provider_generation', 'media_inspection', 'media_normalization',
    'skill_output_qa', 'layer_preparation', 'private_preview_render', 'integration_qa', 'result_projection',
  ].map((phase) => ({
    phase,
    condition: 'approved_work_graph_contains_phase',
    blockingBehavior: phase === 'skill_output_qa' ? 'return_dependency' as const : 'block' as const,
    approvedPlanRequired: true,
  })),
  mustRunBefore: [
    { ruleKey: 'before_final_composition', targetKind: 'phase', target: 'final_composition', condition: 'b_roll_result_selected', blockingBehavior: 'block' },
  ],
  mustRunAfter: [
    { ruleKey: 'after_orchestra_assignment', targetKind: 'phase', target: 'orchestra_assignment', condition: 'always', blockingBehavior: 'block' },
  ],
  conflictsWith: [
    { ruleKey: 'exclusive_primary_owner_conflict', targetKind: 'ownership_window', target: 'primary_visual_owner', condition: 'another_exclusive_primary_owner_same_frames', resolution: 'preserve_existing_owner', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'no_extra_visuals_preference', targetKind: 'preference', target: 'no_extra_visuals', condition: 'user_preference_enabled', resolution: 'use_no_action', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'locked_evidence_visibility', targetKind: 'artifact', target: 'locked_evidence_footage', condition: 'evidence_cannot_be_hidden', resolution: 'preserve_existing_owner', ownershipBehavior: 'preserve_existing_owner', blockingBehavior: 'needs_user_confirmation' },
    { ruleKey: 'other_skill_hero_visual', targetKind: 'ownership_window', target: 'deliberate_full_frame_hero_visual', condition: 'other_skill_owns_hero_frames', resolution: 'preserve_existing_owner', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'independent_b_roll_assignment_overlap', targetKind: 'assignment', target: 'overlapping_b_roll_primary_assignment', condition: 'independent_assignment_same_frames', resolution: 'reject_assignment', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'transition_scene_boundary', targetKind: 'skill', target: 'transition', condition: 'scene_boundary_owned_by_transition', resolution: 'preserve_existing_owner', ownershipBehavior: 'reserve_target_area', blockingBehavior: 'return_dependency' },
    { ruleKey: 'caption_safe_area', targetKind: 'skill', target: 'captions', condition: 'caption_safe_area_reserved', resolution: 'preserve_existing_owner', ownershipBehavior: 'reserve_target_area', blockingBehavior: 'block' },
  ],
  mayOverlapWith: [
    { ruleKey: 'overlap_captions', targetSkill: 'captions', condition: 'caption_safe_area_preserved', requiredLayerOrder: 'b_roll_below_captions', visualDensityBehavior: 'reserve_target_area', ownershipBehavior: 'b_roll_primary' },
    { ruleKey: 'overlap_color', targetSkill: 'color', condition: 'color_operates_on_composite', requiredLayerOrder: 'color_after_b_roll', visualDensityBehavior: 'support_only', ownershipBehavior: 'b_roll_primary' },
    { ruleKey: 'overlap_render', targetSkill: 'render', condition: 'render_consumes_approved_layer', requiredLayerOrder: 'b_roll_before_render', visualDensityBehavior: 'support_only', ownershipBehavior: 'b_roll_primary' },
    { ruleKey: 'overlap_sound', targetSkill: 'sound', condition: 'sound_handoff_preserves_voice', requiredLayerOrder: 'visual_and_audio_independent', visualDensityBehavior: 'support_only', ownershipBehavior: 'b_roll_primary' },
    { ruleKey: 'overlap_track_all', targetSkill: 'track_all', condition: 'track_graph_consumed_as_dependency', requiredLayerOrder: 'track_graph_before_b_roll_layer', visualDensityBehavior: 'support_only', ownershipBehavior: 'b_roll_primary' },
    { ruleKey: 'overlap_transition', targetSkill: 'transition', condition: 'ranges_exclude_transition_boundary', requiredLayerOrder: 'transition_above_b_roll_at_boundary', visualDensityBehavior: 'enforce_budget', ownershipBehavior: 'target_primary' },
  ],
  ownershipRequirements: [
    { ruleKey: 'exclusive_primary_visual_owner', condition: 'primary_b_roll_requested', requiredBehavior: 'one_primary_owner_per_frame', violationBehavior: 'block' },
    { ruleKey: 'support_density_budget', condition: 'support_layer_overlap', requiredBehavior: 'visual_density_budget_must_pass', violationBehavior: 'use_no_action' },
    { ruleKey: 'caption_zone_ownership', condition: 'caption_reserved_zone_present', requiredBehavior: 'caption_area_remains_caption_owned', violationBehavior: 'block' },
    { ruleKey: 'assignment_range_authority', condition: 'any_b_roll_mutation', requiredBehavior: 'write_range_subset_of_assignment', violationBehavior: 'block' },
    { ruleKey: 'whole_video_read_only', condition: 'whole_video_context_consumed', requiredBehavior: 'no_whole_video_mutation', violationBehavior: 'block' },
  ],
  timeEstimator: 'b_roll.time.v1',
  creditEstimator: 'b_roll.credit.v1',
  attemptPolicy: {
    maximumInitialAttempts: 1,
    maximumRefinements: 1,
    automaticRetryAllowed: false,
    alternateProviderFallbackAllowed: false,
    unknownOutcomeRequiresReconciliation: true,
  },
  toolRoutes: [
    routeCapability({ routeKey: 'inspect_candidate', routeKind: 'tool', supportedJobTypes: ['inspect_b_roll_candidate_with_ffprobe'], operationIds: ['tool.ffprobe.inspect_approved_media.v1'], requiredArtifactTypes: ['b_roll_candidate_media_manifest_v1'], priority: 10, requiresApproval: true, description: 'Inspect the exact private candidate represented by its strict media manifest.' }),
    routeCapability({ routeKey: 'normalize_candidate', routeKind: 'tool', supportedJobTypes: ['normalize_b_roll_candidate_with_ffmpeg'], operationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'], requiredArtifactTypes: ['b_roll_candidate_media_manifest_v1', 'b_roll_candidate_manifest_v1'], priority: 20, requiresApproval: true, description: 'Normalize an approved bounded candidate without exposing private bytes.' }),
    routeCapability({ routeKey: 'render_private_preview', routeKind: 'tool', supportedJobTypes: ['render_b_roll_preview'], operationIds: ['tool.remotion.render_approved_composition.v1'], requiredArtifactTypes: ['b_roll_candidate_version_v1', 'b_roll_remotion_layer_manifest_v1'], priority: 30, requiresApproval: true, description: 'Render the range-bounded private preview.' }),
    routeCapability({ routeKey: 'existing_project_source', routeKind: 'source', supportedJobTypes: ['prepare_b_roll_source'], operationIds: ['b_roll.source.existing_project_clip.v1'], requiredArtifactTypes: ['source_media_artifact_v1'], priority: 2, requiresApproval: true, description: 'Use meaning-matched project source.' }),
    routeCapability({ routeKey: 'approved_user_asset', routeKind: 'source', supportedJobTypes: ['prepare_b_roll_source'], operationIds: ['b_roll.source.approved_user_asset.v1'], requiredArtifactTypes: ['approved_user_asset_v1', 'source_media_artifact_v1'], priority: 3, requiresApproval: true, description: 'Use a rights/privacy-approved user asset.' }),
    routeCapability({ routeKey: 'gemini_omni_edit', routeKind: 'provider', supportedJobTypes: ['generate_b_roll_candidate'], operationIds: ['provider.google.generate_b_roll_candidate.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_provider_request_specification_v1', 'source_media_artifact_v1'], priority: 4, requiresApproval: true, description: 'Edit one approved bounded video source where eligible.' }),
    routeCapability({ routeKey: 'gemini_omni_image_to_video', routeKind: 'provider', supportedJobTypes: ['generate_b_roll_candidate'], operationIds: ['provider.google.generate_b_roll_candidate.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_provider_request_specification_v1', 'approved_user_asset_v1'], priority: 5, requiresApproval: true, description: 'Create one illustrative candidate from one approved checksum-bound first-frame image.' }),
    routeCapability({ routeKey: 'gemini_omni_reference_to_video', routeKind: 'provider', supportedJobTypes: ['generate_b_roll_candidate'], operationIds: ['provider.google.generate_b_roll_candidate.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_provider_request_specification_v1', 'approved_user_asset_v1'], priority: 6, requiresApproval: true, description: 'Create one illustrative candidate from one to six approved checksum-bound reference images.' }),
    routeCapability({ routeKey: 'gemini_omni_text_to_video', routeKind: 'provider', supportedJobTypes: ['generate_b_roll_candidate'], operationIds: ['provider.google.generate_b_roll_candidate.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_provider_request_specification_v1'], priority: 7, requiresApproval: true, description: 'Create an illustrative candidate from the approved shot specification.' }),
  ],
  fallbackRoutes: [
    routeCapability({ routeKey: 'fallback_existing_source', routeKind: 'source', supportedJobTypes: ['prepare_b_roll_source'], operationIds: ['b_roll.source.existing_project_clip.v1'], requiredArtifactTypes: ['source_media_artifact_v1'], priority: 100, requiresApproval: true, description: 'Fallback to an eligible existing source without provider work.' }),
    routeCapability({ routeKey: 'fallback_no_action', routeKind: 'no_action', supportedJobTypes: ['project_b_roll_result_receipt'], operationIds: ['b_roll.no_action.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_planning_qa_report_v1'], priority: 101, requiresApproval: false, description: 'Keep the base footage when no professional candidate remains.' }),
  ],
  lowerCostRoutes: [
    routeCapability({ routeKey: 'lower_cost_existing_source', routeKind: 'source', supportedJobTypes: ['prepare_b_roll_source'], operationIds: ['b_roll.source.existing_project_clip.v1'], requiredArtifactTypes: ['source_media_artifact_v1'], priority: 1, requiresApproval: true, description: 'Prefer existing source with no provider request.' }),
    routeCapability({ routeKey: 'lower_cost_no_action', routeKind: 'no_action', supportedJobTypes: ['project_b_roll_result_receipt'], operationIds: ['b_roll.no_action.v1'], requiredArtifactTypes: ['b_roll_plan_v1', 'b_roll_planning_qa_report_v1'], priority: 0, requiresApproval: false, description: 'Use no B-roll when the base scene is stronger.' }),
  ],
  planningQa: qaRefs(BROLL_PLANNING_QA_KEYS),
  outputQa: qaRefs(BROLL_OUTPUT_QA_KEYS),
  integrationQa: qaRefs(BROLL_INTEGRATION_QA_KEYS),
  invalidationRules: [
    { ruleKey: 'manifest_changed', trigger: 'manifest_hash_changed', invalidates: ['assignment', 'plan', 'approval', 'execution'], requiresNewApproval: true },
    { ruleKey: 'range_changed', trigger: 'authorized_range_changed', invalidates: ['plan', 'estimate', 'approval', 'preview', 'result'], requiresNewApproval: true },
    { ruleKey: 'master_timing_changed', trigger: 'master_timing_hash_changed', invalidates: ['assignment', 'plan', 'estimate', 'approval', 'work_graph'], requiresNewApproval: true },
    { ruleKey: 'source_changed', trigger: 'source_identity_or_checksum_changed', invalidates: ['source_selection', 'plan', 'qa', 'preview', 'result'], requiresNewApproval: true },
    { ruleKey: 'aspect_ratio_changed', trigger: 'confirmed_output_frame_changed', invalidates: ['plan', 'crop', 'estimate', 'approval', 'layer', 'preview'], requiresNewApproval: true },
    { ruleKey: 'ownership_changed', trigger: 'visual_ownership_changed', invalidates: ['coordination', 'plan', 'approval', 'layer'], requiresNewApproval: true },
    { ruleKey: 'caption_zones_changed', trigger: 'caption_reserved_zones_changed', invalidates: ['composition', 'integration_qa', 'preview'], requiresNewApproval: true },
    { ruleKey: 'provider_request_changed', trigger: 'provider_request_specification_changed', invalidates: ['attempt', 'candidate', 'qa', 'result'], requiresNewApproval: true },
    { ruleKey: 'proof_status_changed', trigger: 'proof_or_rights_status_changed', invalidates: ['source_selection', 'plan', 'qa', 'approval'], requiresNewApproval: true },
  ],
  revisionRules: [
    { ruleKey: 'remove_b_roll', changeClass: 'scope_reducing', requiresReestimate: true, requiresNewApproval: true, description: 'Remove B-roll and publish a new restraint result.' },
    { ruleKey: 'change_source', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Select and QA a different exact source.' },
    { ruleKey: 'change_timing', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Recompile exact timing and all dependent work.' },
    { ruleKey: 'change_treatment', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Replan layout, captions, ownership, and integration.' },
    { ruleKey: 'add_generation', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Add a provider candidate only through new approval.' },
    { ruleKey: 'refine_candidate', changeClass: 'material', requiresReestimate: false, requiresNewApproval: false, description: 'Use the one pre-approved refinement ceiling after eligible QA rejection.' },
    { ruleKey: 'normalize_candidate', changeClass: 'non_material', requiresReestimate: false, requiresNewApproval: false, description: 'Apply the exact approved deterministic normalization recipe.' },
  ],
  qualificationFixtures: [...BROLL_QUALIFICATION_FIXTURES],
  knownLimitations: [
    { limitationKey: 'gemini_preview_production_gate', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Gemini Omni production use requires a real private canary and current account evidence.', behavior: 'requires_production_qualification' },
    { limitationKey: 'native_aspect_ratios', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Native provider output is bounded to 16:9 and 9:16; other frames require crop-safe deterministic composition.', behavior: 'bounded_support' },
    { limitationKey: 'uploaded_video_region_gate', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Uploaded-video editing fails closed where current provider region eligibility is absent.', behavior: 'fail_closed' },
    { limitationKey: 'reference_image_ceiling', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Reference-to-video accepts one to six exact approved images; the six-image ceiling is the bounded ReeditPro contract demonstrated by the current official provider guide.', behavior: 'bounded_support' },
    { limitationKey: 'video_reference_not_active', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Provider schema admission does not prove useful processing: current official guidance says video references up to three seconds are accepted but not processed correctly.', behavior: 'fail_closed' },
    { limitationKey: 'uploaded_audio_reference_not_active', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Current official guidance does not support uploaded audio references.', behavior: 'fail_closed' },
    { limitationKey: 'unsupported_provider_transformations', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Multiple-video reasoning, video extension, frame interpolation, voice editing, and YouTube sources are unsupported.', behavior: 'fail_closed' },
    { limitationKey: 'provider_output_contract', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Provider output is bounded to 3-10 seconds, 720p, 24 fps, and native 16:9 or 9:16.', behavior: 'bounded_support' },
    { limitationKey: 'provider_person_identity_safety', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Recognizable-person and minor-image availability remains provider- and region-limited; B-roll rights, privacy, proof, and production qualification gates remain mandatory.', behavior: 'fail_closed' },
    { limitationKey: 'provider_interaction_retention', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'The initial interaction is stored only to authorize one conversational refinement; store-disabled or missing previous-interaction state cannot be refined.', behavior: 'bounded_support' },
    { limitationKey: 'provider_attempt_ceiling', affectedJobTypes: ['generate_b_roll_candidate'], reason: 'Only one initial provider submission and one eligible refinement are allowed.', behavior: 'bounded_support' },
    { limitationKey: 'generated_media_not_proof', affectedJobTypes: ['generate_b_roll_candidate', 'run_b_roll_semantic_visual_qa'], reason: 'Generated candidates are illustrative and can never be verified proof.', behavior: 'fail_closed' },
    { limitationKey: 'cross_skill_final_ownership', affectedJobTypes: ['prepare_b_roll_remotion_layer', 'project_b_roll_result_receipt'], reason: 'Captions, sound, color, transition, tracking, render, and export remain externally owned.', behavior: 'delegate' },
    { limitationKey: 'tracking_external_dependency', affectedJobTypes: ['prepare_b_roll_remotion_layer'], reason: 'Tracking requires an exact model-neutral track_graph_v1 artifact from Track All.', behavior: 'delegate' },
    { limitationKey: 'stock_route_unqualified', affectedJobTypes: [], reason: 'No rights-aware stock-library runtime route is qualified.', behavior: 'fail_closed' },
  ],
})
