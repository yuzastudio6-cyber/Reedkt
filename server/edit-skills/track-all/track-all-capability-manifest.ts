import { createSkillCapabilityManifest } from '../core/skill-capability-manifest-hash'
import type { SkillQaReference } from '../core/skill-capability-manifest-types'
import {
  TRACK_ALL_ACCEPTED_ARTIFACT_TYPES,
  TRACK_ALL_PRODUCED_ARTIFACT_TYPES,
} from './track-all-artifact-types'
import {
  TRACK_ALL_INTEGRATION_QA_KEYS,
  TRACK_ALL_OUTPUT_QA_KEYS,
  TRACK_ALL_PLANNING_QA_KEYS,
} from './track-all-qa-policy'
import { TRACK_ALL_QUALIFICATION_FIXTURES } from './track-all-qualification'

export const TRACK_ALL_SKILL_VERSION = '1.0.0' as const
export const TRACK_ALL_CONTRACT_VERSION = 'track_all.skill_contract.v1' as const

export const TRACK_ALL_JOB_TYPES = [
  'track_all.plan_assignment',
  'track_all.produce_selected_target_graph',
  'track_all.produce_concept_instance_graph',
  'track_all.produce_scene_geometry_graph',
  'track_all.track_planar_region',
  'track_all.apply_privacy_redaction',
  'track_all.apply_tracked_focus',
  'track_all.prepare_tracked_reframe',
  'track_all.repair_track',
  'track_all.validate_track_graph',
  'track_all.prepare_composition_layer',
  'track_all.integrate_preview',
  'track_all.no_action',
  'track_all.project_result',
] as const

export const TRACK_ALL_PHASES = [
  'approved_plan_snapshot',
  'skill_planning',
  'plan_validation',
  'source_inspection',
  'geometry_analysis',
  'model_execution',
  'mask_normalization',
  'identity_reconciliation',
  'treatment_compilation',
  'private_preview_render',
  'skill_output_qa',
  'integration_qa',
  'result_projection',
  'peer_skill_geometry_consumption',
] as const

export const TRACK_ALL_TOOL_OPERATIONS = [
  'tool.ffprobe.inspect_approved_media.v1',
  'tool.ffmpeg.execute_approved_media_recipe.v1',
  'tool.pyscenedetect.detect_scene_boundaries.v1',
  'tool.opencv.analyze_approved_visual_artifacts.v1',
  'tool.kornia.refine_mask.v1',
  'tool.polars.transform_approved_artifact_tables.v1',
  'tool.duckdb.query_approved_artifact_tables.v1',
  'tool.opentimelineio.interchange_approved_timeline.v1',
  'tool.remotion.render_approved_composition.v1',
  'tool.sharp.prepare_approved_image_asset.v1',
] as const

export const TRACK_ALL_SAM_OPERATION_V2 = 'tool.sam3_1.track_masklets.v2' as const
export const TRACK_ALL_NO_ACTION_OPERATION = 'track_all.no_action.v1' as const

const jobContract: Record<(typeof TRACK_ALL_JOB_TYPES)[number], {
  phase: (typeof TRACK_ALL_PHASES)[number]
  required: string[]
  produced: string
  primary?: boolean
  minimum?: 'planning_qualified' | 'internal_execution_qualified'
}> = {
  'track_all.plan_assignment': { phase: 'plan_validation', required: ['track_all_assignment_v1'], produced: 'track_all_plan_v1', minimum: 'planning_qualified' },
  'track_all.produce_selected_target_graph': { phase: 'model_execution', required: ['track_all_plan_v1', 'track_all_target_specification_v1'], produced: 'track_graph_v2' },
  'track_all.produce_concept_instance_graph': { phase: 'model_execution', required: ['track_all_plan_v1', 'visual_intelligence_target_evidence_v1'], produced: 'track_graph_v2' },
  'track_all.produce_scene_geometry_graph': { phase: 'geometry_analysis', required: ['track_all_plan_v1', 'source_frame_authority_v1'], produced: 'camera_motion_graph_v1' },
  'track_all.track_planar_region': { phase: 'geometry_analysis', required: ['track_all_plan_v1', 'track_all_target_specification_v1'], produced: 'planar_track_graph_v1' },
  'track_all.apply_privacy_redaction': { phase: 'treatment_compilation', required: ['track_graph_v2', 'privacy_policy_snapshot_v1'], produced: 'tracked_redaction_result_v1', primary: true },
  'track_all.apply_tracked_focus': { phase: 'treatment_compilation', required: ['track_graph_v2'], produced: 'tracked_focus_result_v1', primary: true },
  'track_all.prepare_tracked_reframe': { phase: 'treatment_compilation', required: ['track_graph_v2', 'caption_reserved_zones_v1'], produced: 'tracked_reframe_result_v1', primary: true },
  'track_all.repair_track': { phase: 'identity_reconciliation', required: ['track_graph_v2', 'prior_track_repair_evidence_v1'], produced: 'track_all_repair_receipt_v1' },
  'track_all.validate_track_graph': { phase: 'skill_output_qa', required: ['track_graph_v2'], produced: 'track_all_temporal_qa_report_v1' },
  'track_all.prepare_composition_layer': { phase: 'treatment_compilation', required: ['track_graph_v2'], produced: 'track_all_cross_skill_handoff_v1' },
  'track_all.integrate_preview': { phase: 'private_preview_render', required: ['track_graph_v2'], produced: 'track_all_integration_qa_report_v1', primary: true },
  'track_all.no_action': { phase: 'result_projection', required: ['track_all_plan_v1'], produced: 'track_all_result_receipt_v1', minimum: 'planning_qualified' },
  'track_all.project_result': { phase: 'result_projection', required: ['track_all_plan_v1'], produced: 'track_all_result_receipt_v1', minimum: 'planning_qualified' },
}

function supported(jobType: (typeof TRACK_ALL_JOB_TYPES)[number]) {
  const contract = jobContract[jobType]
  return {
    jobType,
    planningAllowed: true,
    executionAllowed: true,
    allowedPhases: [contract.phase],
    requiredArtifactTypes: contract.required,
    producedArtifactTypes: [contract.produced],
    primaryVisualOwnershipPossible: contract.primary ?? false,
    runtimeBindingRequired: true,
    minimumQualificationStatus: contract.minimum ?? 'internal_execution_qualified' as const,
  }
}

function qaRefs(keys: readonly string[], severity: SkillQaReference['severity'] = 'blocking') {
  return keys.map((qaKey) => ({ qaKey, severity, description: `Track All ${qaKey.split('.').at(-1)?.replaceAll('_', ' ')} validation.` }))
}

function route(input: {
  routeKey: string
  operationIds: readonly string[]
  supportedJobTypes: readonly (typeof TRACK_ALL_JOB_TYPES)[number][]
  requiredArtifactTypes: readonly string[]
  priority: number
  description: string
  minimumQualificationStatus?: 'planning_qualified' | 'internal_execution_qualified' | 'production_qualified'
  routeKind?: 'tool' | 'source' | 'no_action'
  requiresApproval?: boolean
}) {
  return {
    ...input,
    routeKind: input.routeKind ?? 'tool' as const,
    minimumQualificationStatus: input.minimumQualificationStatus ?? 'internal_execution_qualified' as const,
    requiresApproval: input.requiresApproval ?? true,
    callerSelectable: false as const,
    automaticRetry: false as const,
    automaticAlternateProviderFallback: false as const,
  }
}

export const TRACK_ALL_CAPABILITY_MANIFEST = createSkillCapabilityManifest({
  schemaVersion: 'skill-capability-manifest-v2',
  skillKey: 'track_all',
  skillVersion: TRACK_ALL_SKILL_VERSION,
  contractVersion: TRACK_ALL_CONTRACT_VERSION,
  qualificationStatus: 'planning_qualified',
  skillClass: 'temporal_visual_geometry_skill',
  coordinationCritical: true,
  canOwnPrimaryVisual: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: 'bounded_plan_and_execution',
  canOperateAtSceneLevel: 'bounded_plan_and_execution',
  canOperateAtBoundaryLevel: 'bounded_plan_and_execution',
  supportedJobTypes: TRACK_ALL_JOB_TYPES.map(supported),
  unsupportedJobTypes: [
    ['track_all.real_world_identity_recognition', 'Anonymous geometry only; real-world identity is prohibited.', 'reject'],
    ['track_all.unbounded_library_wide_tracking', 'Every job requires one bounded assignment.', 'reject'],
    ['track_all.unbounded_full_video_session', 'Long ranges are split into approved chunks.', 'reject'],
    ['track_all.caller_selected_model', 'The manifest owns the model route.', 'reject'],
    ['track_all.caller_selected_gpu', 'The admitted worker authority owns placement.', 'reject'],
    ['track_all.caller_selected_command', 'Executables and arguments are server owned.', 'reject'],
    ['track_all.raw_chat_to_gpu', 'Raw chat is compiled to a bounded target specification.', 'reject'],
    ['track_all.automatic_privacy_qa_override', 'Privacy QA is independently derived and cannot be overridden.', 'reject'],
    ['track_all.automatic_cross_shot_identity_claim', 'Shot changes terminate identity unless separately qualified.', 'reject'],
    ['track_all.final_caption_design', 'Captions owns final caption design.', 'delegate', 'captions'],
    ['track_all.final_motion_design', 'Graphic Design owns elaborate final motion design.', 'delegate', 'graphic_design'],
    ['track_all.final_color_grade', 'Color owns final grade.', 'delegate', 'color'],
    ['track_all.final_audio_mix', 'Sound owns final audio.', 'delegate', 'sound'],
    ['track_all.specialized_transition_design', 'Transition owns specialized scene boundaries.', 'delegate', 'transition'],
    ['track_all.final_export', 'Render owns final export.', 'delegate', 'render'],
    ['track_all.public_delivery', 'Public delivery is outside Track All.', 'reject'],
    ['track_all.sam2_new_execution', 'SAM2 is historical evidence only.', 'reject'],
    ['track_all.sam2_fallback', 'No alternate tracking model fallback exists.', 'reject'],
    ['track_all.unqualified_model_fallback', 'Unqualified model routes fail closed.', 'reject'],
    ['track_all.outside_authorized_range_mutation', 'Write authority never expands implicitly.', 'reject'],
  ].map(([jobType, reason, resolution, alternateOwnerSkillKey]) => ({
    jobType: jobType!, reason: reason!, resolution: resolution as 'reject' | 'delegate',
    ...(alternateOwnerSkillKey ? { alternateOwnerSkillKey: alternateOwnerSkillKey as 'captions' } : {}),
  })),
  requiredInputs: [
    ['assignment', 'track_all_assignment_v1', 'Immutable Track All assignment and write authority.'],
    ['target', 'track_all_target_specification_v1', 'Compiled target identity and grounding authority.'],
    ['source_inventory', 'source_inventory_v1', 'Checksum-bound source inventory.'],
    ['master_timing', 'master_timing_plan_v1', 'Frame-exact timing authority.'],
    ['source_frames', 'source_frame_authority_v1', 'Exact source geometry and checksum authority.'],
    ['visual_ownership', 'visual_ownership_manifest_v1', 'Per-frame ownership authority.'],
    ['scene_context', 'track_all_scene_context_v1', 'Read-only context and bounded write-range distinction.'],
  ].map(([key, artifactType, description]) => ({ key, artifactType, description, minimumCount: 1, maximumCount: 1 })),
  optionalInputs: TRACK_ALL_ACCEPTED_ARTIFACT_TYPES.filter((value) => ![
    'track_all_assignment_v1', 'track_all_target_specification_v1', 'source_inventory_v1',
    'master_timing_plan_v1', 'source_frame_authority_v1', 'visual_ownership_manifest_v1',
    'track_all_scene_context_v1',
  ].includes(value)).map((artifactType) => ({ key: artifactType, artifactType, description: `Optional qualified ${artifactType} authority.`, minimumCount: 0, maximumCount: artifactType.startsWith('approved_') ? 100 : 1 })),
  requiredSceneContext: [
    { key: 'authorized_write_range', required: true, readScope: 'assignment_range', description: 'Only this range may be mutated.' },
    { key: 'adjacent_reentry_context', required: true, readScope: 'adjacent_scenes', description: 'Read-only occlusion and re-entry context.' },
    { key: 'whole_video_semantic_context', required: false, readScope: 'whole_video_read_only', description: 'Read-only semantic context never grants mutation.' },
  ],
  requiredSourceEvidence: [
    { requirementKey: 'immutable_source_checksum', acceptedArtifactTypes: ['source_inventory_v1', 'source_frame_authority_v1'], condition: 'always', missingBehavior: 'block' },
    { requirementKey: 'exact_fps_and_range', acceptedArtifactTypes: ['master_timing_plan_v1', 'source_frame_authority_v1'], condition: 'always', missingBehavior: 'block' },
    { requirementKey: 'private_source_media', acceptedArtifactTypes: ['source_media_artifact_v1'], condition: 'execution_selected', missingBehavior: 'block' },
    { requirementKey: 'target_rights_privacy', acceptedArtifactTypes: ['privacy_policy_snapshot_v1', 'approved_reference_image_v1'], condition: 'privacy_or_reference_target', missingBehavior: 'needs_user_confirmation' },
  ],
  visualIntelligenceRequirements: [
    { requirementKey: 'semantic_target_grounding', requiredArtifactType: 'visual_intelligence_target_evidence_v1', requiredForPhase: 'skill_planning', condition: 'natural_language_or_concept_target_without_exact_selection', semanticQaRequirement: 'required_for_target_grounding', wholeVideoEvidencePermission: 'read_only', productionAcceptanceRequirement: 'production_qualified_producer', injectedTestOnlyBehavior: 'reject_for_production' },
    { requirementKey: 'tracking_result_inspection', requiredArtifactType: 'visual_intelligence_tracking_qa_v1', requiredForPhase: 'skill_output_qa', condition: 'production_tracking_acceptance', semanticQaRequirement: 'required_for_tracking_output_qa', wholeVideoEvidencePermission: 'read_only', productionAcceptanceRequirement: 'production_qualified_producer', injectedTestOnlyBehavior: 'reject_for_production' },
  ],
  trackingRequirements: [
    { requirementKey: 'existing_track_continuation', condition: 'existing_track_or_repair_requested', acceptedArtifactType: 'track_graph_v2', ownerSkill: 'track_all', missingDependencyBehavior: 'block', modelSpecificDependencyAllowed: false, requiredForPhase: 'skill_planning' },
  ],
  acceptedArtifactTypes: [...TRACK_ALL_ACCEPTED_ARTIFACT_TYPES],
  producedArtifactTypes: [...TRACK_ALL_PRODUCED_ARTIFACT_TYPES],
  planningPhase: { phase: 'skill_planning', condition: 'assignment_received', blockingBehavior: 'block', approvedPlanRequired: false },
  allowedExecutionPhases: TRACK_ALL_PHASES.filter((phase) => ![
    'skill_planning', 'approved_plan_snapshot', 'peer_skill_geometry_consumption',
  ].includes(phase)).map((phase) => ({ phase, condition: 'approved_work_graph_contains_phase', blockingBehavior: phase === 'skill_output_qa' ? 'return_dependency' as const : 'block' as const, approvedPlanRequired: true })),
  mustRunBefore: [
    { ruleKey: 'before_peer_geometry_consumers', targetKind: 'phase', target: 'peer_skill_geometry_consumption', condition: 'handoff_requested', blockingBehavior: 'block' },
    { ruleKey: 'before_final_render', targetKind: 'skill', target: 'render', condition: 'visible_treatment_selected', blockingBehavior: 'block' },
  ],
  mustRunAfter: [
    { ruleKey: 'after_approved_plan', targetKind: 'phase', target: 'approved_plan_snapshot', condition: 'execution_selected', blockingBehavior: 'block' },
    { ruleKey: 'after_visual_intelligence_grounding', targetKind: 'skill', target: 'visual_intelligence', condition: 'semantic_target_requires_grounding', blockingBehavior: 'return_dependency' },
  ],
  conflictsWith: [
    { ruleKey: 'exclusive_primary_owner', targetKind: 'ownership_window', target: 'primary_visual_owner', condition: 'another_exclusive_primary_owner_same_frames', resolution: 'preserve_existing_owner', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'outside_range', targetKind: 'assignment', target: 'authorized_write_range', condition: 'requested_output_extends_outside_range', resolution: 'reject_assignment', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
    { ruleKey: 'privacy_policy', targetKind: 'artifact', target: 'privacy_policy_snapshot', condition: 'privacy_treatment_without_policy', resolution: 'reject_assignment', ownershipBehavior: 'deny_primary_ownership', blockingBehavior: 'block' },
  ],
  mayOverlapWith: [
    ['b_roll', 'track_graph_and_geometry_support', 'track_all_before_b_roll', 'track_all_support'],
    ['captions', 'safe_zones_and_masks_only', 'track_all_below_captions', 'track_all_support'],
    ['color', 'selective_mask_handoff', 'track_all_before_color', 'track_all_support'],
    ['graphic_design', 'anchor_handoff', 'track_all_before_graphic_design', 'track_all_support'],
    ['sound', 'timing_cue_handoff', 'visual_audio_independent', 'track_all_support'],
    ['transition', 'occluder_handoff', 'track_all_before_transition', 'target_primary'],
    ['render', 'layer_handoff', 'track_all_before_render', 'track_all_primary'],
  ].map(([targetSkill, condition, requiredLayerOrder, ownershipBehavior], index) => ({ ruleKey: `track_all_overlap_${index}`, targetSkill: targetSkill as 'b_roll', condition, requiredLayerOrder, visualDensityBehavior: 'support_only' as const, ownershipBehavior: ownershipBehavior as 'track_all_support' })),
  ownershipRequirements: [
    { ruleKey: 'exact_write_range', condition: 'any_output', requiredBehavior: 'output_range_subset_of_assignment', violationBehavior: 'block' },
    { ruleKey: 'whole_video_read_only', condition: 'whole_video_context_used', requiredBehavior: 'context_never_grants_mutation', violationBehavior: 'block' },
    { ruleKey: 'anonymous_identity', condition: 'person_or_sensitive_target', requiredBehavior: 'anonymous_track_ids_only', violationBehavior: 'block' },
    { ruleKey: 'peer_domain_ownership', condition: 'cross_skill_handoff', requiredBehavior: 'geometry_only_no_peer_final_design', violationBehavior: 'block' },
  ],
  timeEstimator: 'track_all.time.v1',
  creditEstimator: 'track_all.credit.v1',
  attemptPolicy: { maximumInitialAttempts: 1, maximumRefinements: 1, automaticRetryAllowed: false, alternateProviderFallbackAllowed: false, unknownOutcomeRequiresReconciliation: true },
  toolRoutes: [
    route({ routeKey: 'source_truth', operationIds: ['tool.ffprobe.inspect_approved_media.v1'], supportedJobTypes: ['track_all.produce_scene_geometry_graph', 'track_all.track_planar_region', 'track_all.apply_privacy_redaction'], requiredArtifactTypes: ['source_media_artifact_v1'], priority: 1, description: 'Inspect exact source facts during approved canonical-private execution.' }),
    route({ routeKey: 'shot_detection', operationIds: ['tool.pyscenedetect.detect_scene_boundaries.v1'], supportedJobTypes: ['track_all.produce_scene_geometry_graph'], requiredArtifactTypes: ['source_frame_authority_v1'], priority: 2, description: 'Derive shot-boundary candidates.' }),
    route({ routeKey: 'opencv_geometry', operationIds: ['tool.opencv.analyze_approved_visual_artifacts.v1'], supportedJobTypes: ['track_all.produce_scene_geometry_graph', 'track_all.track_planar_region', 'track_all.validate_track_graph'], requiredArtifactTypes: ['source_frame_authority_v1'], priority: 3, description: 'Compute deterministic temporal and planar geometry.' }),
    route({ routeKey: 'sam3_1_masklets', operationIds: [TRACK_ALL_SAM_OPERATION_V2], supportedJobTypes: ['track_all.produce_selected_target_graph', 'track_all.produce_concept_instance_graph'], requiredArtifactTypes: ['track_all_plan_v1', 'source_media_artifact_v1'], priority: 4, description: 'Execute qualified private SAM 3.1 masklets.', minimumQualificationStatus: 'internal_execution_qualified' }),
    route({ routeKey: 'ffmpeg_treatments', operationIds: ['tool.ffmpeg.execute_approved_media_recipe.v1'], supportedJobTypes: ['track_all.apply_privacy_redaction', 'track_all.integrate_preview'], requiredArtifactTypes: ['tracked_redaction_plan_v1'], priority: 5, description: 'Apply and flatten deterministic private redaction.' }),
    route({ routeKey: 'remotion_preview', operationIds: ['tool.remotion.render_approved_composition.v1'], supportedJobTypes: ['track_all.apply_tracked_focus', 'track_all.prepare_tracked_reframe', 'track_all.integrate_preview'], requiredArtifactTypes: ['track_graph_v2'], priority: 6, description: 'Render an approved private focus or reframe integration preview.' }),
  ],
  fallbackRoutes: [
    route({ routeKey: 'fail_closed_no_action', routeKind: 'no_action', operationIds: [TRACK_ALL_NO_ACTION_OPERATION], supportedJobTypes: ['track_all.no_action'], requiredArtifactTypes: ['track_all_plan_v1'], priority: 100, description: 'Create no media when tracking is not justified or authorized.', minimumQualificationStatus: 'planning_qualified', requiresApproval: true }),
  ],
  lowerCostRoutes: [
    route({ routeKey: 'deterministic_existing_graph', routeKind: 'source', operationIds: ['track_all.existing_track_graph.v1'], supportedJobTypes: ['track_all.validate_track_graph'], requiredArtifactTypes: ['track_graph_v2'], priority: 0, description: 'Reuse an exact qualified existing graph without GPU work.', minimumQualificationStatus: 'planning_qualified' }),
  ],
  planningQa: qaRefs(TRACK_ALL_PLANNING_QA_KEYS),
  outputQa: qaRefs(TRACK_ALL_OUTPUT_QA_KEYS),
  integrationQa: qaRefs(TRACK_ALL_INTEGRATION_QA_KEYS),
  invalidationRules: [
    ['manifest_changed', 'manifest_hash_changed'], ['range_changed', 'authorized_range_changed'],
    ['source_changed', 'source_checksum_changed'], ['target_changed', 'target_specification_changed'],
    ['timing_changed', 'master_timing_changed'], ['ownership_changed', 'visual_ownership_changed'],
    ['privacy_changed', 'privacy_policy_changed'], ['qualification_changed', 'route_qualification_changed'],
    ['preflight_changed', 'preflight_observation_changed'], ['sam_profile_changed', 'sam_runtime_profile_changed'],
  ].map(([ruleKey, trigger]) => ({ ruleKey, trigger, invalidates: ['plan', 'approval', 'work_graph', 'qa', 'result'], requiresNewApproval: true })),
  revisionRules: [
    { ruleKey: 'target_change', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'A changed target creates a new plan.' },
    { ruleKey: 'range_reduction', changeClass: 'scope_reducing', requiresReestimate: true, requiresNewApproval: true, description: 'A smaller range is recompiled and reapproved.' },
    { ruleKey: 'deterministic_repair', changeClass: 'non_material', requiresReestimate: false, requiresNewApproval: false, description: 'One pre-approved deterministic repair may run.' },
    { ruleKey: 'prompt_refinement', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'One bounded prompt refinement creates new lineage.' },
  ],
  qualificationFixtures: TRACK_ALL_QUALIFICATION_FIXTURES,
  knownLimitations: [
    { limitationKey: 'sam_external_gate', affectedJobTypes: ['track_all.produce_selected_target_graph', 'track_all.produce_concept_instance_graph'], reason: 'Real internal SAM execution requires gated checkpoint, strict compatibility, image, GPU, quality, cost, and private-output evidence; production requires the additional production gates.', behavior: 'fail_closed' },
    { limitationKey: 'cross_shot_identity', affectedJobTypes: ['track_all.produce_selected_target_graph', 'track_all.produce_concept_instance_graph'], reason: 'Cross-shot identity is optional, confidence-qualified, and never assumed.', behavior: 'bounded_support' },
    { limitationKey: 'ocr_landmark_gates', affectedJobTypes: ['track_all.apply_privacy_redaction', 'track_all.apply_tracked_focus'], reason: 'OCR and landmark support remain conditional until Track All route evidence exists.', behavior: 'fail_closed' },
    { limitationKey: 'production_worker_absent', affectedJobTypes: [...TRACK_ALL_JOB_TYPES], reason: 'Production worker bindings remain absent until production qualification.', behavior: 'requires_production_qualification' },
    { limitationKey: 'final_peer_ownership', affectedJobTypes: ['track_all.prepare_composition_layer'], reason: 'Peer skills own final caption, color, sound, motion, transition, and render work.', behavior: 'delegate' },
  ],
})
