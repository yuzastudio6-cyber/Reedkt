import { createSkillCapabilityManifest } from '../core/skill-capability-manifest-hash'
import type {
  SkillCapabilityEntryDefinition,
  SkillExactRouteReference,
  SkillQaReference,
  SkillRouteDefinition,
} from '../core/skill-capability-manifest-types'
import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import {
  MUSIC_CONTRACT_VERSION,
  MUSIC_JOB_TYPES,
  MUSIC_SKILL_VERSION,
} from '../../music/music-contracts'
import { MUSIC_TOOL_ROUTE_MANIFESTS, type MusicToolRouteManifest } from '../../music/music-tool-routes'

export const MUSIC_SKILL_KEY = 'music' as const

export const MUSIC_UNSUPPORTED_JOB_TYPES = [
  'generate_foley', 'generate_generic_sfx', 'generate_non_musical_ambience',
  'generate_room_tone', 'repair_dialogue_directly', 'clone_voice', 'generate_voiceover',
  'transcribe_speech', 'generate_captions', 'own_primary_visual',
  'create_visual_transition', 'final_mux', 'final_render', 'final_export',
  'delivery', 'publishing',
] as const

export const MUSIC_ACCEPTED_ARTIFACT_TYPES = Object.freeze(Array.from(new Set([
  'music_assignment_v2', 'music_context_manifest_v2', 'approved_timeline_manifest',
  'approved_private_music_audio', 'untrusted_music_candidate', 'music_composition_brief_v2',
  'music_candidate_analysis_v2', 'music_cue_grouping_plan_v3', 'music_cue_sheet_v2', 'music_editorial_plan_v2',
  'music_placement_manifest_v2', 'music_qa_report_v2', 'transcript_speech_evidence',
  'visual_intelligence_evidence', 'scene_map_evidence', 'existing_sound_plan_evidence',
  ...MUSIC_TOOL_ROUTE_MANIFESTS.flatMap((route) => route.requiredInputs),
])))

export const MUSIC_PRODUCED_ARTIFACT_TYPES = Object.freeze(Array.from(new Set([
  'music_plan_v2', 'music_result_v2', 'music_context_study_v2', 'music_need_decision_v2',
  'music_soundtrack_segmentation_plan_v3', 'music_cue_grouping_plan_v3', 'music_cue_policy_conflict_v3',
  'intentional_silence_decision_v2', 'music_narrative_arc_v2', 'music_cue_strategy_v2',
  'music_cue_sheet_v2', 'canonical_music_cue_v2', 'music_motif_plan_v2',
  'music_continuity_plan_v2', 'music_existing_study_v2', 'music_user_intake_v2',
  'music_rights_decision_v2', 'music_reference_study_v2', 'music_reference_dna_v2',
  'music_acquisition_plan_v2', 'music_cue_route_decision_v2', 'music_composition_brief_v2',
  'music_provider_prompt_plan_v2', 'music_provider_attempt_v2', 'untrusted_music_candidate',
  'music_candidate_analysis_v2', 'music_candidate_selection_decision_v2',
  'music_beat_phrase_map_v2', 'music_editorial_plan_v2', 'music_placement_manifest_v2',
  'music_mix_intent_manifest_v2', 'music_sound_support_request_v2',
  'music_sound_support_receipt_v2', 'music_technical_qa_v2', 'music_qa_report_v2',
  'music_continuity_report_v2', 'music_revision_plan_v2', 'music_revision_receipt_v2',
  'music_project_asset_v2', 'music_library_candidate_v2',
  'music_final_composition_handoff_v2', 'intentional_no_music_handoff_v2',
  'music_ambience_only_handoff_v2', 'approved_music_selection_v2',
  'processed_music_audio_v2', 'music_stem_audio_v2',
  'music_crossfade_plan_v3', 'music_crossfade_audio', 'music_crossfade_receipt_v3',
  'music_sound_operation_receipt_v3',
  ...MUSIC_TOOL_ROUTE_MANIFESTS.flatMap((route) => route.producedArtifactTypes),
])))

const PLANNING_QA = [
  'music.qa.planning.authority.v2', 'music.qa.planning.need_and_silence.v2',
  'music.qa.planning.rights.v2', 'music.qa.planning.route.v2', 'music.qa.planning.cost.v2',
] as const
const OUTPUT_QA = [
  'music.qa.output.technical.v2', 'music.qa.output.structural_sync.v2',
  'music.qa.output.speech_safety.v2', 'music.qa.output.narrative_fit_needs_review.v2',
  'music.qa.output.vocal_lyric.v2', 'music.qa.output.reference_copy_risk.v2',
  'music.qa.output.culture_needs_review.v2', 'music.qa.output.continuity.v2',
  'music.qa.output.provenance.v2', 'music.qa.output.subjective_needs_review.v2',
] as const
const INTEGRATION_QA = [
  'music.qa.integration.authority.v2', 'music.qa.integration.timeline.v2',
  'music.qa.integration.sound_boundary.v2', 'music.qa.integration.handoff.v2',
] as const

function routeKind(route: MusicToolRouteManifest): SkillRouteDefinition['routeKind'] {
  if (route.routeRole === 'no_music') return 'no_action'
  if (route.routeKey.includes('.lyria.')) return 'provider'
  if (route.routeKey.includes('.acquire.') || route.routeKey.includes('.study.existing') || route.routeKey.includes('.study.user')) return 'source'
  return 'tool'
}

function costClass(route: MusicToolRouteManifest): NonNullable<SkillRouteDefinition['costClass']> {
  if (route.routeRole === 'no_music' || route.routeKey.includes('ambience_only')) return 'zero'
  if (route.routeKey.includes('.lyria.')) return 'provider'
  return route.qualificationByMode.privateInternalExecution === 'internal_execution_qualified' ? 'local' : 'zero'
}

function routeDefinition(route: MusicToolRouteManifest, priority: number): SkillRouteDefinition {
  return {
    routeKey: route.routeKey,
    routeKind: routeKind(route),
    operationRef: route.routeKey,
    priority,
    requiresApproval: route.routeRole !== 'no_music',
    description: `Canonical Music ${route.routeRole} route ${route.routeKey}.`,
    routeVersion: route.routeVersion,
    routeHash: route.routeHash,
    supportedJobTypes: route.supportedJobTypes,
    requiredInputs: route.requiredInputs,
    producedArtifactTypes: route.producedArtifactTypes,
    costClass: costClass(route),
  }
}

const routeDefinitions = MUSIC_TOOL_ROUTE_MANIFESTS.map(routeDefinition)
const primaryRouteDefinitions = routeDefinitions.filter((route) => {
  const role = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === route.routeKey)!.routeRole
  return role === 'primary' || role === 'support' || role === 'qa'
})
const fallbackRouteDefinitions = routeDefinitions.filter((route) =>
  MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === route.routeKey)!.routeRole === 'fallback')
const lowerCostRouteDefinitions = routeDefinitions.filter((route) => {
  const role = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === route.routeKey)!.routeRole
  return role === 'lower_cost' || role === 'no_music'
})

function exact(route: MusicToolRouteManifest): SkillExactRouteReference {
  return { routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash }
}

function routeRefs(job: string, roles: MusicToolRouteManifest['routeRole'][]): SkillExactRouteReference[] {
  return MUSIC_TOOL_ROUTE_MANIFESTS.filter((route) =>
    route.supportedJobTypes.includes(job) && roles.includes(route.routeRole)).map(exact)
}

const qualificationRank: Record<SkillQualificationStatus, number> = {
  blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
  planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
}

function routeQualification(route: MusicToolRouteManifest): SkillQualificationStatus {
  if (route.qualificationByMode.privateInternalExecution === 'internal_execution_qualified') return 'internal_execution_qualified'
  if (route.qualificationByMode.fixtureExecution === 'planning_qualified') return 'planning_qualified'
  return route.qualificationByMode.planning
}

function deriveQualification(refs: readonly SkillExactRouteReference[]): SkillQualificationStatus {
  let best: SkillQualificationStatus = 'blocked'
  for (const ref of refs) {
    const route = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) =>
      item.routeKey === ref.routeKey && item.routeVersion === ref.routeVersion && item.routeHash === ref.routeHash)
    if (route && qualificationRank[routeQualification(route)] > qualificationRank[best]) best = routeQualification(route)
  }
  return best
}

function evidenceLevel(job: string, qualification: SkillQualificationStatus): SkillCapabilityEntryDefinition['evidenceLevel'] {
  if (job === 'generate_original_music' || job === 'generate_music_variation') return 'fixture'
  if (qualification === 'internal_execution_qualified') return 'internal_execution'
  if (qualification === 'blocked') return 'blocked'
  return 'planning'
}

export const musicCapabilityEntries: readonly SkillCapabilityEntryDefinition[] = Object.freeze(
  MUSIC_JOB_TYPES.map((job): SkillCapabilityEntryDefinition => {
    const primary = routeRefs(job, ['primary', 'support', 'qa'])
    const noMusic = routeRefs(job, ['no_music'])
    if (primary.length === 0) primary.push(...noMusic)
    if (primary.length === 0) throw new Error(`Music capability ${job} has no exact route.`)
    const fallback = routeRefs(job, ['fallback'])
    const lowerCost = routeRefs(job, ['lower_cost', 'no_music']).filter((candidate) =>
      !primary.some((item) => item.routeKey === candidate.routeKey))
    const qualificationStatus = deriveQualification(primary)
    return {
      capabilityKey: `music.${job}`,
      capabilityVersion: MUSIC_SKILL_VERSION,
      displayName: job.replaceAll('_', ' '),
      description: `Canonical Music capability for ${job.replaceAll('_', ' ')}.`,
      qualificationStatus,
      evidenceLevel: evidenceLevel(job, qualificationStatus),
      supportedJobTypes: [job],
      supportedScopes: ['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'],
      acceptedCallerTypes: ['orchestra', 'motion_studio', 'living_frame', 'three_d', 'transitions', 'graphic_design', 'typed_peer_skill'],
      requiredInputs: ['music_assignment_v2', 'approved_timeline_manifest'],
      optionalInputs: ['approved_private_music_audio', 'transcript_speech_evidence', 'visual_intelligence_evidence', 'scene_map_evidence'],
      acceptedArtifactTypes: MUSIC_ACCEPTED_ARTIFACT_TYPES,
      producedArtifactTypes: MUSIC_PRODUCED_ARTIFACT_TYPES,
      primaryRouteRefs: primary,
      fallbackRouteRefs: fallback.length > 0 ? fallback : noMusic,
      lowerCostRouteRefs: lowerCost,
      planningQa: PLANNING_QA,
      outputQa: OUTPUT_QA,
      integrationQa: INTEGRATION_QA,
      knownLimitations: job === 'generate_original_music' || job === 'generate_music_variation'
        ? ['Lyria 3 uses real private fixture bytes through injected transport; live mode remains fail-closed.']
        : qualificationStatus === 'planning_qualified'
          ? ['Subjective or supervisory output is planning-qualified and may require review; it is not measured media evidence.'] : [],
    }
  }),
)

function deriveTopQualification(entries: readonly SkillCapabilityEntryDefinition[]): SkillQualificationStatus {
  return entries.reduce<SkillQualificationStatus>((lowest, entry) =>
    qualificationRank[entry.qualificationStatus] < qualificationRank[lowest]
      ? entry.qualificationStatus : lowest, 'production_qualified')
}

function qaRefs(keys: readonly string[], severity: SkillQaReference['severity']): SkillQaReference[] {
  return keys.map((qaKey) => ({ qaKey, severity, description: `Canonical Music ${qaKey.split('.').at(-1)?.replaceAll('_', ' ')} gate.` }))
}

export const musicSkillCapabilityManifest = createSkillCapabilityManifest({
  schemaVersion: 'skill-capability-manifest-v1',
  skillKey: MUSIC_SKILL_KEY,
  skillVersion: MUSIC_SKILL_VERSION,
  contractVersion: MUSIC_CONTRACT_VERSION,
  qualificationStatus: deriveTopQualification(musicCapabilityEntries),
  skillClass: 'music_supervision_soundtrack_composition',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canActAsSupport: true,
  canOperateAtVideoLevel: 'context_read_only',
  canOperateAtSceneLevel: 'bounded_plan_and_execution',
  canOperateAtBoundaryLevel: 'coordination_only',
  supportedJobTypes: MUSIC_JOB_TYPES,
  unsupportedJobTypes: MUSIC_UNSUPPORTED_JOB_TYPES,
  requiredInputs: [
    { key: 'assignment', artifactType: 'music_assignment_v2', description: 'Hash-bound canonical Music request and exact authority.', minimumCount: 1, maximumCount: 1 },
    { key: 'timeline', artifactType: 'approved_timeline_manifest', description: 'Approved exact rational timeline binding.', minimumCount: 1, maximumCount: 1 },
  ],
  optionalInputs: [
    { key: 'music_audio', artifactType: 'approved_private_music_audio', description: 'Rights-bound source, upload, library, reference, or provider audio.', minimumCount: 0, maximumCount: 1_000 },
    { key: 'speech', artifactType: 'transcript_speech_evidence', description: 'Exact protected speech ranges.', minimumCount: 0, maximumCount: 1 },
    { key: 'visual_intelligence', artifactType: 'visual_intelligence_evidence', description: 'Read-only scene and visual rhythm evidence.', minimumCount: 0, maximumCount: 1 },
  ],
  requiredSceneContext: [
    { key: 'music_write_authority', required: true, readScope: 'assignment_range', description: 'Exact writable Music ranges.' },
    { key: 'boundary_context', required: true, readScope: 'adjacent_scenes', description: 'Neighboring soundtrack continuity.' },
    { key: 'whole_video_music_context', required: true, readScope: 'whole_video_read_only', description: 'Read-only story, dialogue, ambience, Sound, and soundtrack continuity context.' },
  ],
  requiredSourceEvidence: ['approved_snapshot', 'timeline_hash', 'timeline_rational_rate', 'parent_authority', 'rights_when_media_used'],
  visualIntelligenceRequirements: ['scene_identity', 'visual_rhythm_evidence_when_available', 'transition_evidence_when_available'],
  trackingRequirements: ['consume_model_neutral_timing_only', 'no_visual_tracking_ownership'],
  acceptedArtifactTypes: MUSIC_ACCEPTED_ARTIFACT_TYPES,
  producedArtifactTypes: MUSIC_PRODUCED_ARTIFACT_TYPES,
  planningPhase: 'skill_planning',
  allowedExecutionPhases: ['plan_validation', 'music_supervision', 'provider_generation', 'media_inspection', 'music_sync', 'sound_support', 'skill_output_qa', 'integration_qa', 'result_projection'],
  mustRunBefore: ['final_composition'],
  mustRunAfter: ['orchestra_assignment'],
  conflictsWith: [],
  mayOverlapWith: ['sound', 'b_roll', 'captions', 'color', 'graphic_design', 'real_motion', 'render', 'stroke_motion', 'track_all', 'transition'],
  ownershipRequirements: ['music_write_ranges_are_exact', 'whole_video_context_is_read_only', 'sound_technical_execution_via_public_port', 'final_render_outside_music'],
  timeEstimator: 'music.time.v2',
  creditEstimator: 'music.credit.v2',
  attemptPolicy: {
    maximumInitialAttempts: 1, maximumRefinements: 2, automaticRetryAllowed: false,
    alternateProviderFallbackAllowed: false, unknownOutcomeRequiresReconciliation: true,
  },
  toolRoutes: primaryRouteDefinitions,
  fallbackRoutes: fallbackRouteDefinitions,
  lowerCostRoutes: lowerCostRouteDefinitions,
  planningQa: qaRefs(PLANNING_QA, 'blocking'),
  outputQa: qaRefs(OUTPUT_QA, 'blocking').map((qa) =>
    qa.qaKey.includes('needs_review') ? { ...qa, severity: 'needs_review' as const } : qa),
  integrationQa: qaRefs(INTEGRATION_QA, 'blocking'),
  invalidationRules: [
    { ruleKey: 'music_manifest_changed', trigger: 'manifest_hash_changed', invalidates: ['assignment', 'plan', 'approval', 'execution'], requiresNewApproval: true },
    { ruleKey: 'music_timeline_changed', trigger: 'timeline_hash_or_rate_changed', invalidates: ['cue_sheet', 'music_sync', 'sound_support', 'qa', 'handoff'], requiresNewApproval: true },
    { ruleKey: 'music_source_changed', trigger: 'source_music_hash_changed', invalidates: ['analysis', 'selection', 'sound_support', 'qa', 'handoff'], requiresNewApproval: true },
    { ruleKey: 'music_rights_changed', trigger: 'rights_or_provider_terms_changed', invalidates: ['selection', 'execution', 'handoff'], requiresNewApproval: true },
    { ruleKey: 'music_speech_changed', trigger: 'transcript_or_speech_ranges_changed', invalidates: ['cue_sheet', 'mix_intent', 'sound_support', 'speech_qa'], requiresNewApproval: true },
  ],
  revisionRules: [
    { ruleKey: 'music_localized_revision', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Re-execute only invalidated cues and neighboring continuity boundaries.' },
    { ruleKey: 'music_scope_reduction', changeClass: 'scope_reducing', requiresReestimate: true, requiresNewApproval: true, description: 'Publish a new reduced Music plan.' },
    { ruleKey: 'music_exact_replay', changeClass: 'non_material', requiresReestimate: false, requiresNewApproval: false, description: 'Replay an identical admitted deterministic local unit.' },
  ],
  qualificationFixtures: [
    { fixtureKey: 'music.shared_kernel.v2', minimumStatus: 'planning_qualified', description: 'Music publishes through the neutral shared skill kernel.' },
    { fixtureKey: 'music.private_audio_analysis.v2', minimumStatus: 'internal_execution_qualified', description: 'Real private decoded audio analysis, rational MusicSync, Sound v4 support, and measured QA.' },
    { fixtureKey: 'music.lyria3.injected.v2', minimumStatus: 'planning_qualified', description: 'Current Lyria 3 contract with real private fixture bytes through the canonical graph.' },
  ],
  knownLimitations: [
    'Lyria 3 is public preview and live activation remains blocked pending external account, privacy, retention, commercial, rate, deployment, and private-canary evidence.',
    'Emotional perfection, artistic originality, culture nuance, advanced harmonic fit, vocal certainty, and copyright clearance are not automatic guarantees.',
    'Actual global skill selection, scheduling, approvals, persistence, and cost aggregation remain future Orchestra responsibilities.',
    'Music does not own Sound effects, non-musical ambience generation, final mux, render, export, delivery, or publishing.',
  ],
  capabilityEntries: musicCapabilityEntries,
})

export const MUSIC_QA_KEYS = Object.freeze([...PLANNING_QA, ...OUTPUT_QA, ...INTEGRATION_QA])
export const MUSIC_PHASES = Object.freeze([
  'orchestra_assignment', 'skill_planning', 'plan_validation', 'music_supervision',
  'provider_generation', 'media_inspection', 'music_sync', 'sound_support',
  'skill_output_qa', 'integration_qa', 'result_projection', 'final_composition',
])
export const MUSIC_ROUTE_OPERATION_REFS = Object.freeze(routeDefinitions.map((definition) => ({
  routeKey: definition.routeKey,
  routeKind: definition.routeKind,
  operationRef: definition.operationRef,
})))
