import { createSkillCapabilityManifest } from '../core/skill-capability-manifest-hash'
import type { SkillQaReference } from '../core/skill-capability-manifest-types'
import { BROLL_ACCEPTED_ARTIFACT_TYPES, BROLL_PRODUCED_ARTIFACT_TYPES } from './b-roll-artifact-types'
import {
  BROLL_INTEGRATION_QA_KEYS,
  BROLL_OUTPUT_QA_KEYS,
  BROLL_PLANNING_QA_KEYS,
} from './b-roll-qa-policy'
import { BROLL_QUALIFICATION_FIXTURES } from './b-roll-qualification'

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
  'tool.ffprobe.inspect_media.v1',
  'tool.ffmpeg.execute_approved_media_recipe.v1',
  'tool.remotion.render_private_preview.v1',
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

export const BROLL_CAPABILITY_MANIFEST = createSkillCapabilityManifest({
  schemaVersion: 'skill-capability-manifest-v1',
  skillKey: 'b_roll',
  skillVersion: '1.0.0',
  contractVersion: 'b_roll.skill_contract.v1',
  qualificationStatus: 'implementation_pending',
  skillClass: 'creative_visual_asset_skill',
  coordinationCritical: true,
  canOwnPrimaryVisual: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: 'context_read_only',
  canOperateAtSceneLevel: 'bounded_plan_and_execution',
  canOperateAtBoundaryLevel: 'coordination_only',
  supportedJobTypes: [...BROLL_JOB_TYPES],
  unsupportedJobTypes: [
    'generate_verified_proof',
    'mutate_outside_authorized_range',
    'author_final_captions',
    'mix_final_audio',
    'grade_final_color',
    'execute_specialized_transition',
    'perform_object_tracking',
    'render_final_export',
    'search_unqualified_stock_library',
    'select_caller_provider_route',
    'execute_caller_command',
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
    { key: 'visual_intelligence', artifactType: 'visual_intelligence_report_v1', description: 'Validated semantic visual context.', minimumCount: 0, maximumCount: 1 },
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
    'immutable_source_identity', 'source_sha256', 'source_generation_or_create_only_identity',
    'rights_status', 'privacy_status', 'proof_classification', 'crop_feasibility',
  ],
  visualIntelligenceRequirements: [
    'semantic_relevance', 'speaker_action_protection', 'scene_continuity',
    'candidate_semantic_alignment', 'candidate_visual_integrity',
  ],
  trackingRequirements: [
    'consume_track_graph_v1_only', 'never_import_tracking_implementation',
    'return_needs_other_skill_when_required_graph_missing',
  ],
  acceptedArtifactTypes: [...BROLL_ACCEPTED_ARTIFACT_TYPES],
  producedArtifactTypes: [...BROLL_PRODUCED_ARTIFACT_TYPES],
  planningPhase: 'skill_planning',
  allowedExecutionPhases: [
    'plan_validation', 'provider_generation', 'media_inspection', 'media_normalization',
    'skill_output_qa', 'layer_preparation', 'private_preview_render', 'integration_qa', 'result_projection',
  ],
  mustRunBefore: ['final_composition'],
  mustRunAfter: ['orchestra_assignment'],
  conflictsWith: [],
  mayOverlapWith: ['captions', 'color', 'render', 'sound', 'track_all', 'transition'],
  ownershipRequirements: [
    'one_exclusive_primary_visual_owner_per_frame', 'support_overlap_requires_density_budget',
    'caption_reserved_zones_remain_caption_owned', 'write_range_must_be_subset_of_assignment',
    'whole_video_context_is_read_only',
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
    { routeKey: 'inspect_candidate', routeKind: 'tool', operationRef: 'tool.ffprobe.inspect_media.v1', priority: 10, requiresApproval: true, description: 'Inspect the exact private candidate.' },
    { routeKey: 'normalize_candidate', routeKind: 'tool', operationRef: 'tool.ffmpeg.execute_approved_media_recipe.v1', priority: 20, requiresApproval: true, description: 'Normalize an approved bounded candidate.' },
    { routeKey: 'render_private_preview', routeKind: 'tool', operationRef: 'tool.remotion.render_private_preview.v1', priority: 30, requiresApproval: true, description: 'Render the range-bounded private preview.' },
    { routeKey: 'existing_project_source', routeKind: 'source', operationRef: 'b_roll.source.existing_project_clip.v1', priority: 2, requiresApproval: true, description: 'Use meaning-matched project source.' },
    { routeKey: 'approved_user_asset', routeKind: 'source', operationRef: 'b_roll.source.approved_user_asset.v1', priority: 3, requiresApproval: true, description: 'Use a rights/privacy-approved user asset.' },
    { routeKey: 'gemini_omni_edit', routeKind: 'provider', operationRef: 'provider.google.generate_b_roll_candidate.v1', priority: 4, requiresApproval: true, description: 'Edit one approved bounded video source where eligible.' },
    { routeKey: 'gemini_omni_image_to_video', routeKind: 'provider', operationRef: 'provider.google.generate_b_roll_candidate.v1', priority: 5, requiresApproval: true, description: 'Create an illustrative candidate from approved images.' },
    { routeKey: 'gemini_omni_text_to_video', routeKind: 'provider', operationRef: 'provider.google.generate_b_roll_candidate.v1', priority: 6, requiresApproval: true, description: 'Create an illustrative candidate from the approved shot specification.' },
  ],
  fallbackRoutes: [
    { routeKey: 'fallback_existing_source', routeKind: 'source', operationRef: 'b_roll.source.existing_project_clip.v1', priority: 100, requiresApproval: true, description: 'Fallback to an eligible existing source without provider work.' },
    { routeKey: 'fallback_no_action', routeKind: 'no_action', operationRef: 'b_roll.no_action.v1', priority: 101, requiresApproval: false, description: 'Keep the base footage when no professional candidate remains.' },
  ],
  lowerCostRoutes: [
    { routeKey: 'lower_cost_existing_source', routeKind: 'source', operationRef: 'b_roll.source.existing_project_clip.v1', priority: 1, requiresApproval: true, description: 'Prefer existing source with no provider request.' },
    { routeKey: 'lower_cost_no_action', routeKind: 'no_action', operationRef: 'b_roll.no_action.v1', priority: 0, requiresApproval: false, description: 'Use no B-roll when the base scene is stronger.' },
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
    'Gemini Omni is a public preview model and production qualification requires a real private canary plus current account evidence.',
    'Native Gemini Omni output aspect ratios are limited to 16:9 and 9:16; other confirmed frames require a crop-safe deterministic composition plan.',
    'Uploaded-video editing is unavailable in EEA, Switzerland, and the United Kingdom and must fail closed when region eligibility is absent.',
    'Reference-video inputs are not an active dependable route because preview documentation does not establish correct processing.',
    'Multiple video inputs, video extension, video interpolation, voice editing, YouTube sources, and uploaded audio references are unsupported.',
    'Only one initial provider submission and one eligible refinement are allowed; there is no automatic retry or alternate provider fallback.',
    'Generated candidates are illustrative, contextual, atmospheric, or symbolic and can never be verified proof.',
    'B-roll does not own final captions, sound mix, color grade, specialized transitions, tracking, final render composition, or export.',
    'Tracking requires a separately produced model-neutral track_graph_v1 artifact.',
    'No stock-library runtime route is qualified.',
  ],
})
