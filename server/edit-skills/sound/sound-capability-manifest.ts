import { createSkillCapabilityManifest } from '../core/skill-capability-manifest-hash'
import type {
  SkillCapabilityEntryDefinition,
  SkillExactRouteReference,
  SkillQaReference,
  SkillRouteDefinition,
} from '../core/skill-capability-manifest-types'
import type { SkillQualificationStatus } from '../core/edit-skill-ids'
import { SOUND_TOOL_ROUTE_MANIFESTS } from '../../sound/sound-tool-routes'

export const SOUND_SKILL_KEY = 'sound' as const
export const SOUND_SKILL_VERSION = '3.0.0' as const
export const SOUND_MANIFEST_CONTRACT_VERSION = 'sound.skill_contract.v3' as const

export const SOUND_SUPPORTED_JOB_TYPES = [
  'study_source_audio', 'study_reference_sound', 'study_visual_sound_events', 'create_sound_dna',
  'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
  'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
  'support_transition_sound', 'support_graphic_design_sound', 'search_sound_library',
  'extract_project_owned_sound', 'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
  'generate_foley', 'generate_ambience', 'extend_ambience', 'repair_audio', 'clean_dialogue',
  'reduce_noise', 'edit_audio', 'trim_audio', 'fade_audio', 'adjust_gain', 'normalize_audio',
  'resample_audio', 'convert_audio_channels', 'loop_audio', 'time_stretch_audio', 'pitch_shift_audio',
  'sync_audio_to_visual', 'align_sound_transient', 'mix_sound_layers', 'create_sound_stem',
  'qa_sound', 'revise_sound', 'handoff_sound_to_final_composition',
] as const

export type SoundSupportedJobType = (typeof SOUND_SUPPORTED_JOB_TYPES)[number]

export const SOUND_UNSUPPORTED_JOB_TYPES = [
  'compose_music', 'select_music_genre', 'generate_primary_music_soundtrack', 'own_music_emotional_arc',
  'generate_primary_visual', 'own_primary_visual_edit', 'unrestricted_visual_retime', 'generate_captions',
  'own_transcription', 'generate_or_clone_voice', 'final_video_mux', 'final_video_render', 'final_export',
  'public_delivery', 'direct_social_publishing',
] as const

export const SOUND_ACCEPTED_ARTIFACT_TYPES = [
  'sound_assignment_v2', 'sound_context_manifest_v2', 'approved_source_video', 'approved_source_audio',
  'bounded_private_visual_proxy', 'transcript_speech_evidence', 'scene_manifest', 'clip_manifest',
  'approved_timeline_manifest', 'visual_event_manifest', 'tracking_motion_manifest',
  'read_only_music_context', 'sound_cue_manifest_v2', 'sound_audio_artifact_v2',
  'reference_sound_asset', 'provider_attempt_evidence',
] as const

export const SOUND_PRODUCED_ARTIFACT_TYPES = [
  'sound_plan_v2', 'sound_result_v2', 'sound_study_report_v2', 'visual_sound_event_study_v2',
  'reference_sound_dna_v2', 'sound_design_plan_v2', 'sound_no_sound_decision_v2',
  'sound_cue_manifest_v2', 'sound_audio_artifact_v2', 'sound_mix_automation_manifest_v2',
  'sound_qa_report_v2', 'sound_continuity_report_v2', 'sound_provenance_report_v2',
  'sound_caller_receipt_v2', 'sound_final_composition_handoff_v2',
] as const

const PLANNING_JOBS = new Set<string>([
  'study_visual_sound_events', 'design_scene_sound', 'design_boundary_sound',
  'full_video_sound_pass', 'support_living_frame_sound', 'support_3d_sound',
  'support_motion_design_sound', 'support_transition_sound', 'support_graphic_design_sound',
  'search_sound_library', 'revise_sound',
])
const FIXTURE_JOBS = new Set<string>([
  'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx', 'generate_foley',
  'generate_ambience',
])

const activeRoutes = SOUND_TOOL_ROUTE_MANIFESTS.filter(
  (route) => route.routeKey !== 'sound.route.generate.video_sfx.mmaudio.v1',
)

function evidenceLevel(job: string): SkillCapabilityEntryDefinition['evidenceLevel'] {
  if (FIXTURE_JOBS.has(job)) return 'fixture'
  if (PLANNING_JOBS.has(job)) return 'planning'
  return 'internal_execution'
}

function routeKind(routeKey: string): SkillRouteDefinition['routeKind'] {
  if (routeKey === 'sound.route.no_sound.v1') return 'no_action'
  if (routeKey.includes('.mirelo.')) return 'provider'
  if (routeKey.includes('.acquire.')) return 'source'
  return 'tool'
}

function costClass(routeKey: string): NonNullable<SkillRouteDefinition['costClass']> {
  if (routeKey === 'sound.route.no_sound.v1') return 'zero'
  if (routeKey === 'sound.route.acquire.internal_library.v1') return 'zero'
  if (activeRoutes.find((route) => route.routeKey === routeKey)?.orderedOrGraphSteps
    .some((step) => step.toolKey === 'mirelo_sfx' || step.toolKey === 'mmaudio_v2')) return 'provider'
  return 'local'
}

function routeDefinition(route: (typeof activeRoutes)[number], priority: number): SkillRouteDefinition {
  return {
    routeKey: route.routeKey,
    routeKind: routeKind(route.routeKey),
    operationRef: route.routeKey,
    priority,
    requiresApproval: route.routeRole !== 'no_sound',
    description: `Sound-owned ${route.routeRole} route ${route.routeKey}.`,
    routeVersion: route.routeVersion,
    routeHash: route.routeHash,
    supportedJobTypes: [...route.supportedJobTypes],
    requiredInputs: [...route.requiredInputs],
    producedArtifactTypes: [...route.producedArtifactTypes],
    costClass: costClass(route.routeKey),
  }
}

const routeDefinitions = activeRoutes.map((route, index) => routeDefinition(route, index + 1))
const primaryRouteDefinitions = routeDefinitions.filter((route) => {
  const role = activeRoutes.find((candidate) => candidate.routeKey === route.routeKey)!.routeRole
  return role === 'primary' || role === 'support' || role === 'qa'
})
const fallbackRouteDefinitions = routeDefinitions.filter((route) =>
  activeRoutes.find((candidate) => candidate.routeKey === route.routeKey)!.routeRole === 'fallback')
const lowerCostRouteDefinitions = routeDefinitions.filter((route) => {
  const role = activeRoutes.find((candidate) => candidate.routeKey === route.routeKey)!.routeRole
  return role === 'lower_cost' || role === 'no_sound'
})

const PLANNING_QA_KEYS = [
  'sound.qa.planning.authority.v2', 'sound.qa.planning.inputs.v2', 'sound.qa.planning.route.v2',
  'sound.qa.planning.cost.v2', 'sound.qa.planning.no_sound.v2',
] as const
const OUTPUT_QA_KEYS = [
  'sound.qa.output.technical.v2', 'sound.qa.output.synchronization.v2', 'sound.qa.output.mix.v2',
  'sound.qa.output.continuity.v2', 'sound.qa.output.perceptual_needs_review.v2',
  'sound.qa.output.provenance.v2',
] as const
const INTEGRATION_QA_KEYS = [
  'sound.qa.integration.authority.v2', 'sound.qa.integration.visual_immutability.v2',
  'sound.qa.integration.music_boundary.v2', 'sound.qa.integration.handoff.v2',
] as const

function qaRefs(keys: readonly string[], severity: SkillQaReference['severity']): SkillQaReference[] {
  return keys.map((qaKey) => ({ qaKey, severity, description: `Canonical Sound ${qaKey.split('.').at(-1)?.replaceAll('_', ' ')} gate.` }))
}

function matchingRouteRefs(job: string, roles?: readonly string[]): SkillExactRouteReference[] {
  return activeRoutes.filter((route) => route.supportedJobTypes.includes(job) &&
    (!roles || roles.includes(route.routeRole))).sort((left, right) => {
      const costOrder = { zero: 0, local: 1, provider: 2, unavailable: 3 } as const
      return costOrder[costClass(left.routeKey)] - costOrder[costClass(right.routeKey)]
    }).map((route) => ({
      routeKey: route.routeKey,
      routeVersion: route.routeVersion,
      routeHash: route.routeHash,
    }))
}

const qualificationRank: Record<SkillQualificationStatus, number> = {
  blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
  planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
}

export function deriveSoundRouteReferenceQualification(
  refs: readonly SkillExactRouteReference[],
): SkillQualificationStatus {
  let best: SkillQualificationStatus = 'blocked'
  for (const ref of refs) {
    const route = activeRoutes.find((candidate) =>
      candidate.routeKey === ref.routeKey && candidate.routeVersion === ref.routeVersion &&
      candidate.routeHash === ref.routeHash)
    if (!route) continue
    const status = qualificationRank[route.qualificationByMode.final_execution] >=
      qualificationRank.internal_execution_qualified
      ? route.qualificationByMode.final_execution
      : qualificationRank[route.qualificationByMode.planning] >= qualificationRank.planning_qualified
        ? 'planning_qualified'
        : 'blocked'
    if (qualificationRank[status] > qualificationRank[best]) best = status
  }
  return best
}

export function deriveCanonicalSoundQualification(
  entries: readonly SkillCapabilityEntryDefinition[],
): SkillQualificationStatus {
  return entries.reduce<SkillQualificationStatus>((lowest, entry) =>
    qualificationRank[entry.qualificationStatus] < qualificationRank[lowest]
      ? entry.qualificationStatus : lowest, 'production_qualified')
}

const capabilityEntries: SkillCapabilityEntryDefinition[] = SOUND_SUPPORTED_JOB_TYPES.map((job) => {
  const primary = matchingRouteRefs(job, ['primary', 'support', 'qa'])
  const lower = matchingRouteRefs(job, ['lower_cost', 'no_sound'])
  const fallback = matchingRouteRefs(job, ['fallback'])
  if (primary.length === 0 && lower.length > 0) primary.push(lower[0]!)
  if (primary.length === 0) throw new Error(`Sound capability ${job} has no exact registered route.`)
  const primaryKeys = new Set(primary.map((route) => route.routeKey))
  const actualLower = lower.filter((route) => !primaryKeys.has(route.routeKey))
  return {
    capabilityKey: `sound.${job}`,
    capabilityVersion: '3.0.0',
    displayName: job.replaceAll('_', ' '),
    description: `Canonical Sound capability for ${job.replaceAll('_', ' ')}.`,
    qualificationStatus: deriveSoundRouteReferenceQualification(primary),
    evidenceLevel: evidenceLevel(job),
    supportedJobTypes: [job],
    supportedScopes: ['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'],
    acceptedCallerTypes: ['orchestra', 'living_frame', 'three_d', 'motion_design', 'transitions', 'graphic_design', 'typed_peer_skill'],
    requiredInputs: ['sound_assignment_v2', 'sound_context_manifest_v2', 'approved_timeline_manifest'],
    optionalInputs: ['approved_source_video', 'approved_source_audio', 'visual_event_manifest', 'read_only_music_context'],
    acceptedArtifactTypes: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
    producedArtifactTypes: [...SOUND_PRODUCED_ARTIFACT_TYPES],
    primaryRouteRefs: primary,
    fallbackRouteRefs: fallback.length > 0 ? fallback : matchingRouteRefs(job, ['no_sound']),
    lowerCostRouteRefs: actualLower,
    planningQa: [...PLANNING_QA_KEYS],
    outputQa: [...OUTPUT_QA_KEYS],
    integrationQa: [...INTEGRATION_QA_KEYS],
    knownLimitations: FIXTURE_JOBS.has(job)
      ? ['Mirelo is fixture-qualified and production activation remains fail-closed.']
      : PLANNING_JOBS.has(job)
        ? ['Creative or perceptual judgment remains planning-qualified unless backed by actual output evidence.']
        : [],
  }
})

export const soundSkillCapabilityManifest = createSkillCapabilityManifest({
  schemaVersion: 'skill-capability-manifest-v1',
  skillKey: SOUND_SKILL_KEY,
  skillVersion: SOUND_SKILL_VERSION,
  contractVersion: SOUND_MANIFEST_CONTRACT_VERSION,
  qualificationStatus: deriveCanonicalSoundQualification(capabilityEntries),
  skillClass: 'audio_sound_department',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canActAsSupport: true,
  canOperateAtVideoLevel: 'context_read_only',
  canOperateAtSceneLevel: 'bounded_plan_and_execution',
  canOperateAtBoundaryLevel: 'coordination_only',
  supportedJobTypes: [...SOUND_SUPPORTED_JOB_TYPES],
  unsupportedJobTypes: [...SOUND_UNSUPPORTED_JOB_TYPES],
  requiredInputs: [
    { key: 'assignment', artifactType: 'sound_assignment_v2', description: 'Exact Sound caller and range authority.', minimumCount: 1, maximumCount: 1 },
    { key: 'context', artifactType: 'sound_context_manifest_v2', description: 'Read-only scene and whole-video Sound context.', minimumCount: 1, maximumCount: 1 },
    { key: 'timeline', artifactType: 'approved_timeline_manifest', description: 'Hash-bound exact rational timeline authority.', minimumCount: 1, maximumCount: 1 },
  ],
  optionalInputs: [
    { key: 'source_video', artifactType: 'approved_source_video', description: 'Approved immutable visual bytes.', minimumCount: 0, maximumCount: 100 },
    { key: 'source_audio', artifactType: 'approved_source_audio', description: 'Approved immutable project audio.', minimumCount: 0, maximumCount: 100 },
    { key: 'visual_events', artifactType: 'visual_event_manifest', description: 'Structured visual/action evidence.', minimumCount: 0, maximumCount: 1 },
    { key: 'music_context', artifactType: 'read_only_music_context', description: 'Read-only Music collision and ducking context.', minimumCount: 0, maximumCount: 1 },
  ],
  requiredSceneContext: [
    { key: 'authorized_audio_ranges', required: true, readScope: 'assignment_range', description: 'Exact writable audio ranges.' },
    { key: 'adjacent_acoustic_context', required: true, readScope: 'adjacent_scenes', description: 'Boundary continuity evidence.' },
    { key: 'whole_video_continuity', required: true, readScope: 'whole_video_read_only', description: 'Read-only continuity, density, silence, dialogue, and Music context.' },
  ],
  requiredSourceEvidence: ['source_identity', 'source_version', 'source_sha256', 'timeline_sha256', 'timeline_rational_rate', 'approved_snapshot', 'work_item_authority'],
  visualIntelligenceRequirements: ['structured_visual_event_evidence', 'scene_identity', 'material_evidence_when_available', 'perspective_evidence_when_available'],
  trackingRequirements: ['consume_model_neutral_tracking_only', 'no_tracking_ownership'],
  acceptedArtifactTypes: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
  producedArtifactTypes: [...SOUND_PRODUCED_ARTIFACT_TYPES],
  planningPhase: 'skill_planning',
  allowedExecutionPhases: ['plan_validation', 'provider_generation', 'media_inspection', 'media_normalization', 'skill_output_qa', 'integration_qa', 'result_projection'],
  mustRunBefore: ['final_composition'],
  mustRunAfter: ['orchestra_assignment'],
  conflictsWith: [],
  mayOverlapWith: ['b_roll', 'captions', 'color', 'graphic_design', 'real_motion', 'render', 'stroke_motion', 'track_all', 'transition'],
  ownershipRequirements: ['audio_write_ranges_are_exact', 'whole_video_context_is_read_only', 'locked_layers_unchanged', 'music_is_read_only', 'final_render_outside_sound'],
  timeEstimator: 'sound.time.v3',
  creditEstimator: 'sound.credit.v3',
  attemptPolicy: {
    maximumInitialAttempts: 1, maximumRefinements: 1, automaticRetryAllowed: false,
    alternateProviderFallbackAllowed: false, unknownOutcomeRequiresReconciliation: true,
  },
  toolRoutes: primaryRouteDefinitions,
  fallbackRoutes: fallbackRouteDefinitions,
  lowerCostRoutes: lowerCostRouteDefinitions,
  planningQa: qaRefs(PLANNING_QA_KEYS, 'blocking'),
  outputQa: qaRefs(OUTPUT_QA_KEYS, 'blocking').map((qa) =>
    qa.qaKey.includes('perceptual') ? { ...qa, severity: 'needs_review' as const } : qa),
  integrationQa: qaRefs(INTEGRATION_QA_KEYS, 'blocking'),
  invalidationRules: [
    { ruleKey: 'sound_manifest_changed', trigger: 'manifest_hash_changed', invalidates: ['assignment', 'plan', 'approval', 'execution'], requiresNewApproval: true },
    { ruleKey: 'sound_timeline_changed', trigger: 'timeline_hash_or_rate_changed', invalidates: ['plan', 'sync', 'mix', 'qa', 'result'], requiresNewApproval: true },
    { ruleKey: 'sound_source_changed', trigger: 'source_version_or_hash_changed', invalidates: ['proxy', 'candidate', 'stem', 'qa', 'result'], requiresNewApproval: true },
    { ruleKey: 'sound_authority_changed', trigger: 'authorized_range_changed', invalidates: ['plan', 'approval', 'execution', 'result'], requiresNewApproval: true },
    { ruleKey: 'sound_visual_timing_changed', trigger: 'visual_timing_changed', invalidates: ['proxy', 'cue', 'sync', 'mix', 'qa'], requiresNewApproval: true },
  ],
  revisionRules: [
    { ruleKey: 'sound_localized_revision', changeClass: 'material', requiresReestimate: true, requiresNewApproval: true, description: 'Reprocess only invalidated Sound ranges and preserve unaffected artifacts.' },
    { ruleKey: 'sound_scope_reduction', changeClass: 'scope_reducing', requiresReestimate: true, requiresNewApproval: true, description: 'Publish a new smaller Sound plan.' },
    { ruleKey: 'sound_technical_normalization', changeClass: 'non_material', requiresReestimate: false, requiresNewApproval: false, description: 'Repeat the exact admitted deterministic normalization profile.' },
  ],
  qualificationFixtures: [
    { fixtureKey: 'sound.shared_kernel.v3', minimumStatus: 'planning_qualified', description: 'Shared registry, immutable hash, typed operation graph, and exact route closure evidence.' },
    { fixtureKey: 'sound.local_real_bytes.v3', minimumStatus: 'internal_execution_qualified', description: 'Per-range real private FFmpeg/FFprobe execution, mutation receipts, and measured output QA evidence.' },
    { fixtureKey: 'sound.mirelo.injected_route.v3', minimumStatus: 'planning_qualified', description: 'Per-cue fixture-only injected transport using the canonical dependency-driven route graph.' },
  ],
  knownLimitations: [
    'Mirelo is fixture-qualified only; live production activation requires external account, privacy, retention, rate, deployment, and canary evidence.',
    'Perceptual naturalness, material realism, emotional fit, and advanced room matching remain needs-review without a qualified evidence-backed evaluator.',
    'Sound does not compose Music or own final mux, render, export, delivery, or publishing.',
    'Global skill selection, scheduling, approvals, cost aggregation, and cross-skill conflict resolution remain future Orchestra responsibilities.',
  ],
  capabilityEntries,
})

export const SOUND_ROUTE_OPERATION_REFS = Object.freeze(routeDefinitions.map((route) => ({
  routeKey: route.routeKey,
  routeKind: route.routeKind,
  operationRef: route.operationRef,
})))

export const SOUND_QA_KEYS = Object.freeze([
  ...PLANNING_QA_KEYS, ...OUTPUT_QA_KEYS, ...INTEGRATION_QA_KEYS,
])

export const SOUND_PHASES = Object.freeze([
  'orchestra_assignment', 'skill_planning', 'plan_validation', 'provider_generation', 'media_inspection',
  'media_normalization', 'skill_output_qa', 'integration_qa', 'result_projection', 'final_composition',
])
