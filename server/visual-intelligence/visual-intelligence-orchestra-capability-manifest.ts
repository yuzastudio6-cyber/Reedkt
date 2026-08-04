import type {
  OrchestraExecutionPhase,
  OrchestraSkillScope,
  SkillCapabilityManifest,
  SkillJobCapability,
  SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  type VisualIntelligenceOperation,
  type VisualIntelligenceProfile,
} from '../../src/types/visual-intelligence'
import {
  computeSkillCapabilityDefinitionDigest,
  createSkillCapabilityManifest,
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
  type SkillCapabilityManifestDefinitionInput,
} from '../orchestra/orchestra-skill-capability-contract'

export const VISUAL_INTELLIGENCE_ORCHESTRA_SKILL_VERSION =
  'visual-intelligence-skill-v2' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_CONTRACT_VERSION =
  'visual-intelligence-orchestra-contract-v1' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_MANIFEST_ID =
  'visual-intelligence-orchestra-capability-manifest' as const
export const VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID =
  'visual-intelligence-orchestra-source-candidate-qualification' as const

export interface VisualIntelligenceOrchestraJobDefinition
  extends SkillJobCapability {
  readonly operation: VisualIntelligenceOperation
  readonly allowedPhases: readonly OrchestraExecutionPhase[]
  readonly admissionClassByPhase: Readonly<Partial<Record<
    OrchestraExecutionPhase,
    'planning_evidence' | 'approved_edit_inspection'
  >>>
}

const VIDEO_JOBS = [
  route('final_render_visual_review_support', 'review_complete_final_render',
    ['video'], 'inspect_edit', ['final_render_visual_qa'],
    ['postrender_inspection', 'revision_inspection', 'private_review']),
  route('reference_preference_analysis', 'derive_reference_preference_dna',
    ['video'], 'analyze_media', ['reference_preference_dna'], ['planning']),
  route('screen_content_video_analysis', 'understand_screen_content_video',
    ['video'], 'analyze_media', ['screen_content_analysis'], ['planning']),
  route('source_video_understanding', 'understand_complete_source_video',
    ['video'], 'analyze_media', ['source_edit_planning'], ['planning']),
  route('story_structure_analysis', 'understand_story_structure',
    ['video'], 'analyze_media', ['story_structure'], ['planning']),
  route('video_subject_object_action_index',
    'index_video_subjects_objects_and_actions', ['video'], 'analyze_media',
    ['subject_object_action_index'], ['planning']),
  route('video_visual_style_analysis', 'understand_video_visual_style',
    ['video'], 'analyze_media', ['visual_style'], ['planning']),
]

const SCENE_JOBS = [
  route('scene_primary_subject_identification',
    'identify_scene_primary_subject', ['scene'], 'query_range',
    ['identify_primary_subject'], ['planning', 'approved_execution']),
  route('scene_safe_zone_analysis', 'find_and_verify_scene_safe_zones',
    ['scene'], 'query_range',
    ['verify_safe_zone'],
    ['planning', 'approved_execution']),
  route('scene_screen_text_analysis', 'verify_scene_visible_text', ['scene'],
    'query_range', ['verify_screen_text'], ['planning', 'approved_execution']),
  route('scene_semantic_analysis', 'understand_bounded_scene_meaning', ['scene'],
    'query_range', ['explain_visible_action'],
    ['planning', 'approved_execution']),
  route('scene_subject_occlusion_analysis', 'check_scene_subject_occlusion',
    ['scene'], 'query_range', ['check_subject_occlusion'],
    ['planning', 'approved_execution', 'postrender_inspection']),
  route('scene_version_comparison', 'compare_scene_versions', ['scene'],
    'compare_media', ['preview_vs_revised_preview'],
    ['revision_inspection']),
  route('scene_visible_action_explanation', 'explain_scene_visible_action',
    ['scene'], 'query_range', ['explain_visible_action'],
    ['planning', 'approved_execution']),
  route('scene_visual_defect_analysis', 'inspect_scene_visual_defect', ['scene'],
    'query_range', ['inspect_visual_defect'],
    ['postrender_inspection', 'revision_inspection']),
  route('skill_output_visual_inspection', 'inspect_skill_visual_output',
    ['scene'], 'inspect_edit', [
      'aspect_ratio_adaptation_qa',
      'caption_layout_qa',
      'color_context_qa',
      'compositing_qa',
      'graphics_layout_qa',
      'living_frame_qa',
      'motion_graphics_qa',
    ], ['postrender_inspection', 'revision_inspection']),
]

const BOUNDARY_JOBS = [
  route('caption_boundary_readability_analysis',
    'inspect_caption_boundary_readability', ['boundary'], 'inspect_edit',
    ['caption_layout_qa'], ['postrender_inspection', 'revision_inspection']),
  route('color_boundary_context_analysis', 'inspect_color_boundary_context',
    ['boundary'], 'inspect_edit', ['color_context_qa'],
    ['postrender_inspection', 'revision_inspection']),
  route('cut_boundary_continuity_analysis', 'inspect_cut_boundary_continuity',
    ['boundary'], 'inspect_edit', ['continuity_qa'],
    ['postrender_inspection', 'revision_inspection']),
  route('motion_boundary_analysis', 'inspect_motion_boundary', ['boundary'],
    'inspect_edit', ['motion_graphics_qa'],
    ['postrender_inspection', 'revision_inspection']),
  route('transition_boundary_inspection', 'inspect_transition_boundary',
    ['boundary'], 'query_range', ['inspect_transition_window'],
    ['postrender_inspection', 'revision_inspection']),
]

const SUPPORT_JOBS = [
  route('compare_preview_revision', 'compare_preview_with_revision',
    ['video', 'scene'], 'compare_media', ['preview_vs_revised_preview'],
    ['revision_inspection']),
  route('find_graphic_space', 'find_space_for_graphics', ['scene'],
    'query_range', ['find_available_graphic_space'],
    ['planning', 'approved_execution']),
  route('inspect_aspect_ratio_adaptation', 'inspect_confirmed_frame_adaptation',
    ['video', 'scene'], 'compare_media',
    ['aspect_ratio_source_vs_adaptation'],
    ['postrender_inspection', 'revision_inspection']),
  route('inspect_composite_result', 'inspect_before_after_composite', ['scene'],
    'compare_media', ['before_vs_after_composite'],
    ['postrender_inspection', 'revision_inspection']),
  route('inspect_tracking_result', 'inspect_tracking_result', ['scene'],
    'inspect_edit', ['compositing_qa'],
    ['approved_execution', 'postrender_inspection']),
  route('validate_expected_visual_outcome', 'validate_expected_visual_outcome',
    ['scene'], 'compare_media', ['expected_vs_rendered_motion'],
    ['postrender_inspection', 'revision_inspection']),
  route('validate_subject_preservation', 'validate_subject_preservation',
    ['video', 'scene'], 'compare_media', [
      'aspect_ratio_source_vs_adaptation',
      'source_vs_preview',
    ], ['postrender_inspection', 'revision_inspection']),
  route('validate_visual_hierarchy', 'validate_visual_hierarchy', ['scene'],
    'inspect_edit', ['caption_layout_qa', 'graphics_layout_qa'],
    ['postrender_inspection', 'revision_inspection']),
]

const JOB_DEFINITIONS: readonly VisualIntelligenceOrchestraJobDefinition[] =
  Object.freeze([
    ...VIDEO_JOBS,
    ...SCENE_JOBS,
    ...BOUNDARY_JOBS,
    ...SUPPORT_JOBS,
  ].sort((left, right) => compare(left.jobType, right.jobType)))

const ALL_JOB_TYPES = ids(...JOB_DEFINITIONS.map((item) => item.jobType))
const PLANNING_JOB_TYPES = ids(...JOB_DEFINITIONS
  .filter((item) => item.allowedPhases.some((phase) =>
    phase === 'planning' || phase === 'preapproval'))
  .map((item) => item.jobType))
const INSPECTION_JOB_TYPES = ids(...JOB_DEFINITIONS
  .filter((item) => item.allowedPhases.some((phase) =>
    !['planning', 'preapproval'].includes(phase)))
  .map((item) => item.jobType))
const TRACKING_DEPENDENT_JOB_TYPES = ids(
  'inspect_composite_result',
  'inspect_tracking_result',
  'scene_subject_occlusion_analysis',
  'validate_subject_preservation',
)

const BLOCKERS = ids(
  'canonical_orchestra_application_mount_not_observed',
  'exact_video_scene_boundary_media_transport_not_qualified',
  'live_gemini_3_1_pro_high_release_not_reread',
)

const DEFINITION: SkillCapabilityManifestDefinitionInput = {
  schemaVersion: ORCHESTRA_SKILL_CAPABILITY_MANIFEST_VERSION,
  manifestId: VISUAL_INTELLIGENCE_ORCHESTRA_MANIFEST_ID,
  skillKey: VISUAL_INTELLIGENCE_CAPABILITY_ID,
  skillVersion: VISUAL_INTELLIGENCE_ORCHESTRA_SKILL_VERSION,
  contractVersion: VISUAL_INTELLIGENCE_ORCHESTRA_CONTRACT_VERSION,
  skillClass: 'analysis_support',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canOwnPrimaryAnalysis: true,
  canActAsSupport: true,
  canOperateAtVideoLevel: true,
  canOperateAtSceneLevel: true,
  canOperateAtBoundaryLevel: true,
  supportedJobTypes: JOB_DEFINITIONS.map((item) => ({
    jobType: item.jobType,
    purposeCode: item.purposeCode,
    supportedScopeTypes: [...item.supportedScopeTypes],
    internalOperationId: item.internalOperationId,
    requiredProfileIds: [...item.requiredProfileIds],
    partialResultAllowed: item.partialResultAllowed,
  })),
  unsupportedJobTypes: ids(
    'approve_final_qa',
    'create_edit_plan',
    'dispatch_peer_skill',
    'generate_primary_visual',
    'mutate_timeline',
    'own_caption_layout',
    'own_color_processing',
    'own_final_canvas',
    'own_tracking_artifact',
    'render_final_canvas',
  ),
  requiredInputs: [
    input('exact_authorized_media', 'private_immutable_media', ALL_JOB_TYPES, 1,
      64),
  ],
  optionalInputs: [
    input('approved_expected_outcomes', 'expected_visual_outcome_ref',
      INSPECTION_JOB_TYPES, 0, 512),
    input('comparison_media', 'private_comparison_media', ids(
      'compare_preview_revision',
      'inspect_aspect_ratio_adaptation',
      'inspect_composite_result',
      'scene_version_comparison',
      'validate_expected_visual_outcome',
      'validate_subject_preservation',
    ), 0, 64),
  ].sort(by('requirementId')),
  requiredSceneContext: [{
    requirementId: 'exact_scene_or_boundary_context',
    requiredForJobTypes: ids(...JOB_DEFINITIONS
      .filter((item) => item.supportedScopeTypes.some((scope) =>
        scope === 'scene' || scope === 'boundary'))
      .map((item) => item.jobType)),
    requiredAtScopeTypes: ['scene', 'boundary'],
    exactSnapshotRequired: true,
  }],
  requiredSourceEvidence: [
    evidence('deterministic_media_evidence', 'deterministic_media_evidence',
      ALL_JOB_TYPES),
    evidence(
      'edit_reference_consumer_result_binding',
      'edit_reference_visual_intelligence_orchestra_binding_request_v1',
      ids('reference_preference_analysis'),
    ),
    evidence('exact_media_probe', 'canonical_media_probe', ALL_JOB_TYPES),
    evidence('finalized_private_media', 'finalized_private_media_authority',
      ALL_JOB_TYPES),
    evidence('meaning_bearing_transcript', 'verified_transcript_evidence', ids(
      'caption_boundary_readability_analysis',
      'cut_boundary_continuity_analysis',
      'final_render_visual_review_support',
      'reference_preference_analysis',
      'screen_content_video_analysis',
      'source_video_understanding',
      'story_structure_analysis',
    )),
  ].sort(by('requirementId')),
  visualIntelligenceRequirements: {
    mode: 'self',
    providerNeutralConsumerContract: true,
    internalSemanticProviderAllowed: true,
    deterministicEvidenceRequired: true,
    resultMustReturnThroughOrchestra: true,
  },
  trackingRequirements: [{
    requirementId: 'track_all_exact_subject_geometry',
    requiredForJobTypes: TRACKING_DEPENDENT_JOB_TYPES,
    trackingSkillKey: 'track_all',
    trackingArtifactTypes: ids(
      'exact_subject_mask_sequence',
      'object_track_evidence',
      'occlusion_geometry_evidence',
    ),
    optional: false,
  }],
  acceptedArtifactTypes: ids(
    'confirmed_output_frame',
    'deterministic_media_evidence',
    'expected_visual_outcome',
    'private_comparison_image',
    'private_comparison_video',
    'private_source_image',
    'private_source_video',
    'scene_context_snapshot',
    'tracking_evidence',
    'verified_transcript_evidence',
  ),
  producedArtifactTypes: ids(
    'visual_intelligence_analysis_report',
    'visual_intelligence_comparison_report',
    'visual_intelligence_followup_proposal',
    'visual_intelligence_inspection_evidence',
  ),
  planningPhase: 'planning',
  allowedExecutionPhases: [
    'planning',
    'preapproval',
    'approved_execution',
    'postrender_inspection',
    'revision_inspection',
    'private_review',
  ],
  mustRunBefore: [
    dependency('source-understanding-before-b-roll', 'b_roll',
      ['source_video_understanding']),
    dependency('source-understanding-before-captions', 'captions',
      ['source_video_understanding']),
    dependency('source-understanding-before-color',
      'color_grading_correction', ['source_video_understanding']),
    dependency('source-understanding-before-living-frame', 'living_frame',
      ['source_video_understanding']),
    dependency('source-understanding-before-motion', 'motion_graphic_design',
      ['source_video_understanding']),
    dependency('source-understanding-before-sound', 'sound',
      ['source_video_understanding']),
    dependency('source-understanding-before-three-d', 'three_d',
      ['source_video_understanding']),
    dependency('source-understanding-before-transitions', 'transitions',
      ['source_video_understanding']),
  ].sort(by('ruleId')),
  mustRunAfter: [
    dependency('tracking-evidence-before-tracking-inspection', 'track_all',
      TRACKING_DEPENDENT_JOB_TYPES),
  ],
  conflictsWith: [
    conflict('legacy-edit-reference-semantic-owner-conflict',
      'edit_reference_visual_understanding', ALL_JOB_TYPES,
      'duplicate_semantic_visual_owner_forbidden'),
    conflict('legacy-qwen-visual-owner-conflict', 'legacy_qwen_visual',
      ALL_JOB_TYPES, 'retired_visual_provider_path_forbidden'),
  ].sort(by('ruleId')),
  mayOverlapWith: [
    overlap('b-roll-analysis-support', 'b_roll', ALL_JOB_TYPES),
    overlap('caption-analysis-support', 'captions', ALL_JOB_TYPES),
    overlap('color-analysis-support', 'color_grading_correction', ALL_JOB_TYPES),
    overlap('living-frame-analysis-support', 'living_frame', ALL_JOB_TYPES),
    overlap('motion-analysis-support', 'motion_graphic_design', ALL_JOB_TYPES),
    overlap('three-d-analysis-support', 'three_d', ALL_JOB_TYPES),
    overlap('transition-analysis-support', 'transitions', ALL_JOB_TYPES),
  ].sort(by('ruleId')),
  ownershipRequirements: {
    orchestraOwnsInvocation: true,
    orchestraOwnsWorkGraph: true,
    skillOwnsProducedArtifacts: true,
    skillOwnsPrimaryVisual: false,
    skillOwnsAnalysisReport: true,
    requestingSkillOwnsRepair: true,
    finalQaOwnedElsewhere: true,
  },
  timeEstimator: {
    estimatorId: 'visual-intelligence-time-estimator',
    estimatorVersion: 'visual-intelligence-time-estimator-v1',
    inputFactors: ids(
      'artifact_count',
      'authorized_frame_count',
      'comparison_count',
      'high_resolution_media_count',
      'job_type',
      'provider_cold_start',
      'required_deterministic_routes',
      'requested_range_count',
    ),
  },
  creditEstimator: {
    estimatorId: 'visual-intelligence-credit-estimator',
    estimatorVersion: 'visual-intelligence-credit-estimator-v1',
    inputFactors: ids(
      'account_effective_provider_input_rate',
      'account_effective_provider_output_rate',
      'approved_attempt_count',
      'estimated_input_tokens',
      'estimated_output_and_thinking_tokens',
      'gpu_evidence_attempt_cost',
      'service_fee_settlement_policy',
    ),
  },
  attemptPolicy: {
    maximumPlannedPasses: 2,
    maximumAttemptsPerPass: 1,
    automaticRetryOnUnknownOutcome: false,
    maximumAutomaticRepairCycles: 2,
    scopeExpansionRequiresNewOrchestraCall: true,
  },
  toolRoutes: [
    tool('faster-whisper-a100-primary', PLANNING_JOB_TYPES, 'gpu_model',
      'tool.faster_whisper.transcribe_verified_source.v1',
      'a100_80gb_gpu_heavy', 'faster_whisper'),
    tool('faster-whisper-l4-qualified-fallback', PLANNING_JOB_TYPES,
      'gpu_model', 'tool.faster_whisper.transcribe_verified_source.v1',
      'l4_gpu_standard', 'faster_whisper'),
    tool('ffmpeg-l4-media-evidence', ALL_JOB_TYPES, 'deterministic_tool',
      'tool.ffmpeg.prepare_visual_evidence.v1', 'l4_gpu_standard', 'ffmpeg'),
    tool('ffprobe-l4-colocated-evidence', ALL_JOB_TYPES, 'deterministic_tool',
      'tool.ffprobe.probe_private_media.v1', 'l4_gpu_standard', 'ffprobe'),
    tool('gemini-3-1-pro-high-managed-provider', ALL_JOB_TYPES,
      'managed_provider', 'provider.vertex.gemini_3_1_pro.visual_intelligence.v1',
      'managed_provider', 'vertex_gemini_pro'),
    tool('opencv-l4-visual-evidence', ALL_JOB_TYPES, 'deterministic_tool',
      'tool.opencv.measure_visual_geometry.v1', 'l4_gpu_standard', 'opencv'),
    tool('paddleocr-l4-visible-text-evidence', ids(
      'caption_boundary_readability_analysis',
      'final_render_visual_review_support',
      'scene_screen_text_analysis',
      'screen_content_video_analysis',
      'validate_visual_hierarchy',
    ), 'gpu_model', 'tool.paddleocr.extract_visible_text.v1',
      'l4_gpu_standard', 'paddleocr'),
    tool('pyscenedetect-l4-scene-evidence', PLANNING_JOB_TYPES,
      'deterministic_tool', 'tool.pyscenedetect.detect_scene_changes.v1',
      'l4_gpu_standard', 'pyscenedetect'),
  ].sort(by('routeId')),
  fallbackRoutes: [
    fallback('faster-whisper-classified-l4-fallback', PLANNING_JOB_TYPES,
      ['a100_capacity_unavailable', 'a100_release_classified_failure'],
      'classified_gpu_fallback', 'faster-whisper-l4-qualified-fallback', true),
    fallback('provider-unresolved-return-to-orchestra', ALL_JOB_TYPES,
      ['provider_outcome_unknown', 'provider_release_unavailable'],
      'return_to_orchestra', null, true),
    fallback('semantic-route-blocked-deterministic-only', ALL_JOB_TYPES,
      ['semantic_provider_not_qualified'], 'deterministic_only', null, true),
  ].sort(by('routeId')),
  lowerCostRoutes: [
    lowerCost('exact-cache-reuse', ALL_JOB_TYPES,
      'reuse_exact_request_manifest_qualification_and_artifact_digest'),
    lowerCost('same-call-range-batching', ALL_JOB_TYPES,
      'batch_only_ranges_already_authorized_by_the_same_orchestra_call'),
  ].sort(by('routeId')),
  planningQa: qa('visual-intelligence-planning-qa', ids(
    'bounded_scope_matches_orchestra_call',
    'deterministic_evidence_exact_reread',
    'media_commands_treated_as_untrusted_content',
    'meaning_preservation_evidence_present',
    'provider_high_policy_exact',
  )),
  outputQa: qa('visual-intelligence-output-qa', ids(
    'citations_resolve_to_authorized_evidence',
    'findings_stay_inside_authorized_ranges',
    'no_edit_render_or_approval_claim',
    'strict_structured_result_valid',
    'uncertainty_preserved',
  )),
  integrationQa: qa('visual-intelligence-integration-qa', ids(
    'exact_manifest_and_qualification_reread',
    'orchestra_call_digest_and_budget_match',
    'peer_support_request_does_not_grant_execution',
    'result_returns_only_to_orchestra',
    'scope_expansion_requires_new_call',
  )),
  invalidationRules: [
    invalidation('approved-snapshot-changed', 'approved_snapshot', ALL_JOB_TYPES),
    invalidation('expected-outcome-changed', 'expected_visual_outcome',
      INSPECTION_JOB_TYPES),
    invalidation('manifest-or-qualification-changed', 'skill_qualification',
      ALL_JOB_TYPES),
    invalidation('media-or-generation-changed', 'private_media_artifact',
      ALL_JOB_TYPES),
    invalidation('orchestra-scope-changed', 'orchestra_skill_call',
      ALL_JOB_TYPES),
    invalidation('output-frame-changed', 'confirmed_output_frame',
      INSPECTION_JOB_TYPES),
    invalidation('provider-release-or-pricing-changed',
      'provider_release_and_pricing', ALL_JOB_TYPES),
    invalidation('scene-context-changed', 'scene_context_snapshot',
      ids(...JOB_DEFINITIONS.filter((item) =>
        item.supportedScopeTypes.includes('scene')
        || item.supportedScopeTypes.includes('boundary'))
        .map((item) => item.jobType))),
  ].sort(by('ruleId')),
  revisionRules: [
    revision('orchestra-authorizes-followup-range', ALL_JOB_TYPES,
      'orchestra', false, 0),
    revision('requesting-skill-owns-repair', INSPECTION_JOB_TYPES,
      'requesting_skill', true, 2),
  ].sort(by('ruleId')),
  qualificationFixtures: [
    fixture('boundary-scope-transport', BOUNDARY_JOBS),
    fixture('complete-source-instruction-understanding', VIDEO_JOBS),
    fixture('gemini-pro-high-managed-provider', JOB_DEFINITIONS),
    fixture('peer-skill-support-roundtrip', SUPPORT_JOBS),
    fixture('scene-scope-transport', SCENE_JOBS),
  ].sort(by('fixtureId')),
  knownLimitations: [
    'AI visual review is sampled semantic judgment and never replaces deterministic complete-time technical QA.',
    'Commands spoken or shown inside media are untrusted evidence; the Orchestra and owning edit skill decide whether they become edit intent.',
    'Exact visible-text claims remain blocked unless the separately qualified OCR evidence route is present.',
    'Gemini provider preprocessing is provider-owned; the skill may claim exact approved media supplied but not exact internal pixel inspection.',
    'Scope expansion and every targeted follow-up require a new Orchestra call and approved time and credit budgets.',
    'Tracking and mask artifacts must come from Track All; Visual Intelligence may inspect them but cannot create or mutate them directly.',
    'Visual Intelligence owns analysis reports only and never owns the timeline, primary visuals, final canvas, repairs, or final approval.',
  ],
  invocationPolicy: {
    orchestraDispatchRequired: true,
    directUserInvocationAllowed: false,
    directPeerSkillInvocationAllowed: false,
    peerSkillSupportRequestAllowed: true,
    internalProviderInvocationAllowed: true,
  },
  resultContract: {
    resultSchemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultArtifactTypes: ids(
      'visual_intelligence_analysis_report',
      'visual_intelligence_comparison_report',
      'visual_intelligence_followup_proposal',
      'visual_intelligence_inspection_evidence',
    ),
    resultReturnsToOrchestra: true,
    directMutationResultAllowed: false,
  },
  failureSemantics: {
    failClosed: true,
    partialResultAllowedForJobTypes: ids(...JOB_DEFINITIONS
      .filter((item) => item.partialResultAllowed)
      .map((item) => item.jobType)),
    hiddenFallbackAllowed: false,
    unresolvedResultReturnsToOrchestra: true,
  },
  securityPolicyRef: orchestraEvidenceRef(
    'visual-intelligence-private-media-security-policy',
    orchestraDigest({
      policy: 'visual-intelligence-private-media-security-policy-v1',
      browserMediaAccessAllowed: false,
      callerCredentialsAccepted: false,
      mediaCommandsTrusted: false,
    }),
  ),
}

const DEFINITION_DIGEST = computeSkillCapabilityDefinitionDigest(DEFINITION)

export function createVisualIntelligenceOrchestraQualificationSnapshot():
SkillQualificationSnapshot {
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: VISUAL_INTELLIGENCE_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID,
    skillKey: VISUAL_INTELLIGENCE_CAPABILITY_ID,
    skillVersion: VISUAL_INTELLIGENCE_ORCHESTRA_SKILL_VERSION,
    contractVersion: VISUAL_INTELLIGENCE_ORCHESTRA_CONTRACT_VERSION,
    capabilityDefinitionDigestSha256: DEFINITION_DIGEST,
    observedReleaseRef: orchestraEvidenceRef(
      'visual-intelligence-orchestra-source-candidate-v1',
      orchestraDigest({
        sourceCandidateVersion:
          'visual-intelligence-orchestra-source-candidate-v1',
        liveGeminiCallObserved: false,
        orchestraApplicationMountObserved: false,
        exactSceneTransportObserved: false,
      }),
    ),
    observedAt: '2026-08-03T00:00:00.000Z',
    overall: 'blocked',
    jobQualifications: JOB_DEFINITIONS.map((item) => ({
      jobType: item.jobType,
      status: 'blocked' as const,
      blockerCodes: blockersFor(item),
      qualifiedRouteIds: [],
      qualificationEvidenceRefs: [],
    })),
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

export function createVisualIntelligenceOrchestraCapabilityManifest():
SkillCapabilityManifest {
  const qualificationSnapshot =
    createVisualIntelligenceOrchestraQualificationSnapshot()
  return createVisualIntelligenceOrchestraCapabilityManifestForQualification(
    qualificationSnapshot,
  )
}

export function createVisualIntelligenceOrchestraCapabilityManifestForQualification(
  qualificationSnapshot: SkillQualificationSnapshot,
): SkillCapabilityManifest {
  return parseSkillCapabilityManifest({
    value: createSkillCapabilityManifest({
      definition: DEFINITION,
      qualificationSnapshot,
    }),
    qualificationSnapshot,
  })
}

export function listVisualIntelligenceOrchestraJobDefinitions():
readonly VisualIntelligenceOrchestraJobDefinition[] {
  return JOB_DEFINITIONS
}

export function getVisualIntelligenceOrchestraJobDefinition(
  jobType: string,
): VisualIntelligenceOrchestraJobDefinition {
  const result = JOB_DEFINITIONS.find((item) => item.jobType === jobType)
  if (!result) throw new TypeError(
    'Orchestra requested an unsupported Visual Intelligence job type.',
  )
  return result
}

export function assertVisualIntelligenceOrchestraJobScope(
  definition: VisualIntelligenceOrchestraJobDefinition,
  phase: OrchestraExecutionPhase,
  scope: OrchestraSkillScope,
): void {
  if (
    !definition.supportedScopeTypes.includes(scope.scopeType)
    || !definition.allowedPhases.includes(phase)
    || !definition.admissionClassByPhase[phase]
  ) throw new TypeError(
    'Visual Intelligence job is not valid for the Orchestra phase and scope.',
  )
}

function route(
  jobType: string,
  purposeCode: string,
  scopes: Array<OrchestraSkillScope['scopeType']>,
  operation: VisualIntelligenceOperation,
  profiles: VisualIntelligenceProfile[],
  phases: OrchestraExecutionPhase[],
): VisualIntelligenceOrchestraJobDefinition {
  const allowedPhases = Object.freeze([...new Set(phases)])
  return Object.freeze({
    jobType,
    purposeCode,
    supportedScopeTypes: Object.freeze([...new Set(scopes)]),
    internalOperationId: `visual_intelligence.${operation}`,
    requiredProfileIds: Object.freeze(ids(...profiles)),
    partialResultAllowed: false,
    operation,
    allowedPhases,
    admissionClassByPhase: Object.freeze(Object.fromEntries(
      allowedPhases.map((phase) => [phase,
        ['planning', 'preapproval'].includes(phase)
          ? 'planning_evidence'
          : 'approved_edit_inspection']),
    )),
  })
}

function blockersFor(
  definition: VisualIntelligenceOrchestraJobDefinition,
): string[] {
  return ids(
    ...BLOCKERS,
    ...(definition.requiredProfileIds.includes('verify_screen_text')
      || definition.requiredProfileIds.includes('screen_content_analysis')
      || definition.requiredProfileIds.includes('caption_layout_qa')
      || definition.requiredProfileIds.includes('graphics_layout_qa')
      ? ['exact_l4_ocr_route_not_qualified'] : []),
    ...(TRACKING_DEPENDENT_JOB_TYPES.includes(definition.jobType)
      ? ['track_all_manifest_and_exact_artifact_route_not_observed'] : []),
    ...(definition.jobType === 'final_render_visual_review_support'
      ? ['complete_time_deterministic_qa_and_private_review_remain_separate']
      : []),
  )
}

function input(
  requirementId: string,
  artifactType: string,
  requiredForJobTypes: string[],
  minimumCount: number,
  maximumCount: number,
) {
  return {
    requirementId,
    artifactType,
    requiredForJobTypes,
    minimumCount,
    maximumCount,
    immutableRereadRequired: true as const,
  }
}

function evidence(
  requirementId: string,
  evidenceType: string,
  requiredForJobTypes: string[],
) {
  return {
    requirementId,
    evidenceType,
    requiredForJobTypes,
    exactRereadRequired: true as const,
  }
}

function dependency(ruleId: string, otherSkillKey: string, jobs: string[]) {
  return {
    ruleId,
    otherSkillKey,
    appliesToJobTypes: ids(...jobs),
    conditionCode: 'orchestra_scene_graph_requires_dependency',
  }
}

function conflict(
  ruleId: string,
  otherSkillKey: string,
  jobs: string[],
  reasonCode: string,
) {
  return { ruleId, otherSkillKey, appliesToJobTypes: ids(...jobs), reasonCode }
}

function overlap(ruleId: string, otherSkillKey: string, jobs: string[]) {
  return {
    ruleId,
    otherSkillKey,
    appliesToJobTypes: ids(...jobs),
    ownershipBoundaryCode: 'analysis_only_primary_skill_retains_ownership',
  }
}

function tool(
  routeId: string,
  jobs: string[],
  routeKind: 'deterministic_tool' | 'managed_provider' | 'gpu_model',
  operationId: string,
  executionClass:
    | 'managed_provider'
    | 'l4_gpu_standard'
    | 'a100_80gb_gpu_heavy',
  toolOrProviderId: string,
) {
  return {
    routeId,
    jobTypes: ids(...jobs),
    routeKind,
    operationId,
    executionClass,
    toolOrProviderId,
    currentQualificationRequired: true as const,
    accountEffectivePricingRequired: true,
  }
}

function fallback(
  routeId: string,
  jobs: string[],
  triggerCodes: string[],
  routeKind:
    | 'classified_gpu_fallback'
    | 'deterministic_only'
    | 'human_review'
    | 'return_to_orchestra',
  targetRouteId: string | null,
  newOrchestraAuthorizationRequired: boolean,
) {
  return {
    routeId,
    jobTypes: ids(...jobs),
    triggerCodes: ids(...triggerCodes),
    routeKind,
    targetRouteId,
    qualityReductionAllowed: false as const,
    newOrchestraAuthorizationRequired,
  }
}

function lowerCost(routeId: string, jobs: string[], optimizationCode: string) {
  return {
    routeId,
    jobTypes: ids(...jobs),
    optimizationCode,
    qualityReductionAllowed: false as const,
    newOrchestraAuthorizationRequired: false,
  }
}

function qa(policyId: string, checks: string[]) {
  return {
    policyId,
    policyVersion: `${policyId}-v1`,
    requiredCheckIds: checks,
    blockingFailureCodes: ids(...checks.map((check) => `${check}_failed`)),
    independentQaOwnerRequired: true,
  }
}

function invalidation(ruleId: string, changed: string, jobs: string[]) {
  return {
    ruleId,
    changedAuthorityType: changed,
    invalidatesJobTypes: ids(...jobs),
    newOrchestraCallRequired: true as const,
  }
}

function revision(
  ruleId: string,
  jobs: string[],
  revisionOwner: 'requesting_skill' | 'orchestra' | 'human_review',
  newApprovedSnapshotRequired: boolean,
  maximumAutomaticCycles: number,
) {
  return {
    ruleId,
    appliesToJobTypes: ids(...jobs),
    revisionOwner,
    newApprovedSnapshotRequired,
    maximumAutomaticCycles,
  }
}

function fixture(
  fixtureId: string,
  jobs: readonly VisualIntelligenceOrchestraJobDefinition[],
) {
  return {
    fixtureId,
    fixtureVersion: `${fixtureId}-v1`,
    jobTypes: ids(...jobs.map((item) => item.jobType)),
    requiredEvidenceTypes: ids(
      'canonical_result_reread',
      'exact_orchestra_call',
      'provider_or_tool_runtime_evidence',
      'visual_qa_evidence',
    ),
    currentEvidenceRef: null,
  }
}

function ids(...values: string[]): string[] {
  return [...new Set(values)].sort(compare)
}

function by(key: string) {
  return (left: Record<string, unknown>, right: Record<string, unknown>) =>
    compare(String(left[key]), String(right[key]))
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
