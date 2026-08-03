import type {
  SkillAttemptPolicy,
  SkillCapabilityEntry,
  SkillCapabilityManifest,
  SkillCallerType,
  SkillInvalidationRule,
  SkillPlanningPhase,
  SkillQualificationStatus,
  SkillRevisionRule,
  SkillRouteDefinition,
  SkillScopeLevel,
  UnpublishedSkillCapabilityManifest,
} from '../../src/types/skill-capability-manifest'
import {
  publishSkillCapabilityManifest,
} from '../orchestra/skill-capability-manifest'
import { canonicalSkillCapabilityRegistry } from '../orchestra/skill-capability-registry'
import {
  SOUND_CREDIT_ESTIMATOR_KEY,
  SOUND_TIME_ESTIMATOR_KEY,
} from './sound-estimators'
import { SOUND_TOOL_ROUTE_MANIFESTS } from './sound-tool-routes'

export const SOUND_SKILL_KEY = 'sound'
export const SOUND_SKILL_VERSION = '1.0.0'
export const SOUND_MANIFEST_CONTRACT_VERSION = 'sound-contract-v1'
export const SOUND_MANIFEST_ID = 'sound.capability-manifest.1.0.0'

export const SOUND_SUPPORTED_JOB_TYPES = [
  'study_source_audio',
  'study_reference_sound',
  'study_visual_sound_events',
  'create_sound_dna',
  'design_scene_sound',
  'design_boundary_sound',
  'full_video_sound_pass',
  'support_living_frame_sound',
  'support_3d_sound',
  'support_motion_design_sound',
  'support_transition_sound',
  'support_graphic_design_sound',
  'search_sound_library',
  'extract_project_owned_sound',
  'generate_video_conditioned_sfx',
  'generate_text_conditioned_sfx',
  'generate_foley',
  'generate_ambience',
  'extend_ambience',
  'repair_audio',
  'clean_dialogue',
  'reduce_noise',
  'edit_audio',
  'trim_audio',
  'fade_audio',
  'adjust_gain',
  'normalize_audio',
  'resample_audio',
  'convert_audio_channels',
  'loop_audio',
  'time_stretch_audio',
  'pitch_shift_audio',
  'sync_audio_to_visual',
  'align_sound_transient',
  'mix_sound_layers',
  'create_sound_stem',
  'qa_sound',
  'revise_sound',
  'handoff_sound_to_final_composition',
] as const

export type SoundSupportedJobType = (typeof SOUND_SUPPORTED_JOB_TYPES)[number]

export const SOUND_UNSUPPORTED_JOB_TYPES = [
  'compose_music',
  'select_music_genre',
  'generate_primary_music_soundtrack',
  'own_music_emotional_arc',
  'generate_primary_visual',
  'own_primary_visual_edit',
  'unrestricted_visual_retime',
  'generate_captions',
  'own_transcription',
  'generate_or_clone_voice',
  'final_video_mux',
  'final_video_render',
  'final_export',
  'public_delivery',
  'direct_social_publishing',
] as const

export const SOUND_ACCEPTED_ARTIFACT_TYPES = [
  'approved_source_video',
  'approved_source_audio',
  'bounded_private_visual_proxy',
  'transcript_speech_evidence',
  'scene_manifest',
  'clip_manifest',
  'approved_timeline_manifest',
  'visual_event_manifest',
  'tracking_motion_manifest',
  'living_frame_artifact',
  'three_d_artifact',
  'motion_design_artifact',
  'transition_artifact',
  'graphic_design_artifact',
  'read_only_music_context',
  'sound_cue_manifest',
  'private_sound_stem',
  'reference_sound_asset',
  'provider_attempt_evidence',
] as const

export const SOUND_PRODUCED_ARTIFACT_TYPES = [
  'sound_study_report',
  'visual_sound_event_study',
  'reference_sound_dna',
  'sound_design_plan',
  'no_sound_decision',
  'sound_cue_manifest',
  'candidate_sfx_asset',
  'candidate_foley_asset',
  'ambience_asset',
  'repaired_audio_asset',
  'cleaned_dialogue_asset',
  'edited_audio_asset_version',
  'private_sound_stem',
  'mix_automation_manifest',
  'sound_qa_report',
  'provenance_report',
  'head_of_orchestra_receipt',
  'peer_skill_receipt',
  'visual_retime_proposal',
  'final_composition_sound_handoff',
] as const

const EVIDENCE = {
  manifest: 'sound.manifest.smoke.v1',
  scope: 'sound.scope-guard.smoke.v1',
  controller: 'sound.controller.smoke.v1',
  localRuntime: 'sound.local-audio.real-bytes.v1',
  localQa: 'sound.local-audio.qa.v1',
  mireloFixture: 'sound.mirelo.injected-transport.v1',
  mireloOfficial: 'sound.mirelo.official-profile.2026-08-03',
  mireloPrivacy: 'sound.mirelo.privacy-review.2026-08-03',
  handoff: 'sound.handoff.smoke.v1',
} as const

const planningQa = [
  'assignment_authority',
  'required_input_evidence',
  'source_version_validity',
  'phase_validity',
  'ownership_conflicts',
  'credit_estimate',
  'provider_qualification',
  'route_qualification',
  'no_sound_consideration',
  'cue_density_review',
]
const outputQa = [
  'file_integrity',
  'audio_format',
  'sample_rate',
  'channel_layout',
  'clipping',
  'true_peak',
  'loudness',
  'synchronization',
  'semantic_event_match',
  'material_realism',
  'perspective',
  'speech_safety',
  'music_compatibility',
  'naturalness',
  'room_ambience_fit',
  'provenance',
  'private_artifact_policy',
]
const integrationQa = [
  'modified_ranges_authorized',
  'caller_request_resolved',
  'locked_layers_unchanged',
  'visual_version_binding_valid',
  'no_stale_sound_on_changed_visuals',
  'final_composition_handoff_complete',
  'no_final_render_ownership',
  'no_music_composition',
  'peer_authority_not_escalated',
  'caller_receipt_complete',
]

const invalidationRules: SkillInvalidationRule[] = [
  ['source_video', 'source_video_hash_changed', 'invalidate_affected_ranges'],
  ['source_audio', 'source_audio_hash_changed', 'invalidate_affected_ranges'],
  ['visual_version', 'visual_artifact_version_changed', 'invalidate_affected_ranges'],
  ['visual_timing', 'visual_timing_changed', 'invalidate_affected_ranges'],
  ['transition_timing', 'transition_timing_changed', 'invalidate_affected_ranges'],
  ['tracking', 'tracking_changed', 'invalidate_affected_ranges'],
  ['motion_path', 'motion_path_changed', 'invalidate_affected_ranges'],
  ['material', 'material_metadata_changed', 'invalidate_affected_ranges'],
  ['speech_timing', 'speech_timing_changed', 'invalidate_affected_ranges'],
  ['dialogue_ranges', 'dialogue_ranges_changed', 'recheck_qa'],
  ['music_context', 'music_context_changed', 'recheck_qa'],
  ['authorized_range', 'authorized_range_changed', 'block_execution'],
  ['locked_layers', 'locked_layer_state_changed', 'block_execution'],
  ['provider_profile', 'provider_profile_changed', 'invalidate_affected_ranges'],
  ['tool_profile', 'tool_profile_changed', 'invalidate_affected_ranges'],
  ['manifest_version', 'manifest_version_changed', 'invalidate_all'],
  ['manifest_hash', 'manifest_hash_changed', 'invalidate_all'],
  ['approval_snapshot', 'approval_snapshot_changed', 'block_execution'],
  ['provenance', 'provenance_status_changed', 'block_execution'],
].map(([suffix, trigger, effect]) => ({
  ruleKey: `sound.invalidate.${suffix}`,
  trigger: trigger as SkillInvalidationRule['trigger'],
  effect: effect as SkillInvalidationRule['effect'],
  appliesToPhases: [
    'approved_private_execution', 'provider_generation', 'synchronization',
    'mixing', 'qa', 'handoff', 'revision',
  ],
}))

const revisionRules: SkillRevisionRule[] = [
  'preserve_unaffected_cues',
  'preserve_valid_asset_versions',
  'reprocess_invalidated_ranges_only',
  'update_cue_manifest',
  'update_mix_manifest',
  'rerun_affected_qa',
  'update_caller_receipt',
  'maintain_revision_lineage',
].map((behavior) => ({
  ruleKey: `sound.revision.${behavior}`,
  behavior: behavior as SkillRevisionRule['behavior'],
}))

const attemptPolicies: SkillAttemptPolicy[] = [
  {
    attemptPolicyKey: 'sound.attempt.planning',
    attemptPolicyVersion: 'sound-attempt-v1',
    operationClass: 'planning',
    defaultCandidateCount: 0,
    maximumCandidateCount: 0,
    maximumAttempts: 1,
    retryEligibility: 'not_applicable',
    fallbackEligibility: 'not_applicable',
    unknownOutcomeBehavior: 'not_applicable',
    cancellationBehavior: 'Cancel without external side effects.',
    timeoutSeconds: 60,
    idempotencyRequired: true,
    failedAttemptsMayRetainCost: false,
    freshApprovalRequiredAfterExhaustion: false,
  },
  {
    attemptPolicyKey: 'sound.attempt.local',
    attemptPolicyVersion: 'sound-attempt-v1',
    operationClass: 'deterministic_local',
    defaultCandidateCount: 1,
    maximumCandidateCount: 1,
    maximumAttempts: 2,
    retryEligibility: 'idempotent_only',
    fallbackEligibility: 'not_applicable',
    unknownOutcomeBehavior: 'not_applicable',
    cancellationBehavior: 'Terminate the bounded process and discard its unpublished temporary output.',
    timeoutSeconds: 600,
    idempotencyRequired: true,
    failedAttemptsMayRetainCost: true,
    freshApprovalRequiredAfterExhaustion: true,
  },
  {
    attemptPolicyKey: 'sound.attempt.provider',
    attemptPolicyVersion: 'sound-attempt-v1',
    operationClass: 'provider_generation',
    defaultCandidateCount: 1,
    maximumCandidateCount: 4,
    maximumAttempts: 2,
    retryEligibility: 'reconciled_failure_only',
    fallbackEligibility: 'after_reconciled_failure',
    unknownOutcomeBehavior: 'reconcile_without_resubmission',
    cancellationBehavior: 'Cancel only when the provider confirms cancellation; otherwise reconcile.',
    timeoutSeconds: 600,
    idempotencyRequired: true,
    failedAttemptsMayRetainCost: true,
    freshApprovalRequiredAfterExhaustion: true,
  },
]

function routeCategory(routeKey: string): SkillRouteDefinition['category'] {
  if (routeKey === 'sound.route.acquire.internal_library.v1') return 'internal_library'
  if (routeKey === 'sound.route.acquire.project_source.v1') return 'project_extraction'
  if (routeKey.includes('.generate.') || routeKey.includes('.ambience.')) return 'provider'
  if (routeKey === 'sound.route.no_sound.v1') return 'no_output'
  return 'local_processing'
}

const routes: SkillRouteDefinition[] = SOUND_TOOL_ROUTE_MANIFESTS.map((route) => ({
  routeKey: route.routeKey,
  routeVersion: route.routeVersion,
  category: routeCategory(route.routeKey),
  displayName: route.routeKey.split('.').slice(2).join(' '),
  qualificationStatus: route.qualificationByMode.planning,
  qualificationEvidenceRefs: route.routeKey.includes('mmaudio')
    ? []
    : route.routeKey.includes('mirelo') ||
      route.routeKey === 'sound.route.generate.text_sfx.v1' || route.routeKey.includes('.ambience.')
    ? [EVIDENCE.mireloFixture, EVIDENCE.mireloOfficial, EVIDENCE.mireloPrivacy]
    : route.qualificationByMode.planning === 'planning_qualified'
      ? [EVIDENCE.controller]
      : route.qualificationByMode.planning === 'blocked'
        ? []
        : [EVIDENCE.localRuntime, EVIDENCE.localQa],
  serverOwned: true,
  paid: route.orderedOrGraphSteps.some((step) =>
    step.toolKey === 'mirelo_sfx' || step.toolKey === 'mmaudio_v2'),
  ...(route.orderedOrGraphSteps.some((step) => step.toolKey === 'mirelo_sfx')
    ? { providerProfileKey: 'mirelo.sfx.1.6.v1' }
    : route.orderedOrGraphSteps.some((step) => step.toolKey === 'mmaudio_v2')
      ? { providerProfileKey: 'mmaudio.v2.declared' }
      : {}),
  toolOperationProfileKeys: route.orderedOrGraphSteps.map((step) => step.operationProfileKey),
  knownLimitations: [...route.knownLimitations],
}))

const allCallers: SkillCallerType[] = [
  'head_of_orchestra', 'living_frame', 'three_d', 'motion_design', 'transitions',
  'graphic_design', 'typed_peer_skill',
]
const allScopes: SkillScopeLevel[] = [
  'clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video',
]

type CapabilityClass =
  | 'study'
  | 'design'
  | 'peer'
  | 'acquisition'
  | 'provider'
  | 'local'
  | 'sync'
  | 'mix'
  | 'qa'
  | 'revision'
  | 'handoff'

const capabilityClassByJob: Record<SoundSupportedJobType, CapabilityClass> = {
  study_source_audio: 'study',
  study_reference_sound: 'study',
  study_visual_sound_events: 'study',
  create_sound_dna: 'study',
  design_scene_sound: 'design',
  design_boundary_sound: 'design',
  full_video_sound_pass: 'design',
  support_living_frame_sound: 'peer',
  support_3d_sound: 'peer',
  support_motion_design_sound: 'peer',
  support_transition_sound: 'peer',
  support_graphic_design_sound: 'peer',
  search_sound_library: 'acquisition',
  extract_project_owned_sound: 'acquisition',
  generate_video_conditioned_sfx: 'provider',
  generate_text_conditioned_sfx: 'provider',
  generate_foley: 'provider',
  generate_ambience: 'provider',
  extend_ambience: 'local',
  repair_audio: 'local',
  clean_dialogue: 'local',
  reduce_noise: 'local',
  edit_audio: 'local',
  trim_audio: 'local',
  fade_audio: 'local',
  adjust_gain: 'local',
  normalize_audio: 'local',
  resample_audio: 'local',
  convert_audio_channels: 'local',
  loop_audio: 'local',
  time_stretch_audio: 'local',
  pitch_shift_audio: 'local',
  sync_audio_to_visual: 'sync',
  align_sound_transient: 'sync',
  mix_sound_layers: 'mix',
  create_sound_stem: 'mix',
  qa_sound: 'qa',
  revise_sound: 'revision',
  handoff_sound_to_final_composition: 'handoff',
}

function entryPhase(capabilityClass: CapabilityClass, job: SoundSupportedJobType): SkillPlanningPhase {
  if (capabilityClass === 'study') return 'early_study'
  if (job === 'design_boundary_sound' || job === 'support_transition_sound') return 'boundary_planning'
  if (capabilityClass === 'peer' || capabilityClass === 'provider') return 'post_visual_generation_support'
  if (capabilityClass === 'sync') return 'post_visual_timing_lock_synchronization'
  if (capabilityClass === 'mix') return 'pre_final_composition_mixing'
  if (capabilityClass === 'qa' || capabilityClass === 'handoff') return 'qa'
  if (capabilityClass === 'revision') return 'revision'
  return 'scene_planning'
}

const qualificationRank: Record<SkillQualificationStatus, number> = {
  blocked: 0,
  deprecated: 0,
  declared: 1,
  planning_qualified: 2,
  fixture_qualified: 3,
  private_internal_qualified: 4,
  production_qualified: 5,
}

function derivedCapabilityQualificationByMode(
  primaryRouteKeys: string[],
): SkillCapabilityEntry['qualificationByExecutionMode'] {
  const primaryRoutes = primaryRouteKeys.map((routeKey) => {
    const route = SOUND_TOOL_ROUTE_MANIFESTS.find((candidate) => candidate.routeKey === routeKey)
    if (!route) throw new Error(`Sound capability references missing canonical route ${routeKey}.`)
    return route
  })
  const best = (mode: keyof SkillCapabilityEntry['qualificationByExecutionMode']) =>
    primaryRoutes.map((route) => route.qualificationByMode[mode])
      .sort((left, right) => qualificationRank[right] - qualificationRank[left])[0] ?? 'blocked'
  return {
    planning: best('planning'),
    preview_execution: best('preview_execution'),
    final_execution: best('final_execution'),
  }
}

function requirementsFor(job: SoundSupportedJobType, capabilityClass: CapabilityClass) {
  if (job === 'study_reference_sound' || job === 'create_sound_dna') {
    return { inputs: ['reference_sound_asset'], evidence: ['reference_sound_hash'] }
  }
  if (job === 'study_visual_sound_events') {
    return {
      inputs: ['approved_source_video', 'visual_event_manifest'],
      evidence: ['source_video_hash', 'visual_version_hash'],
    }
  }
  if (capabilityClass === 'peer') {
    const artifact = job === 'support_living_frame_sound' ? 'living_frame_artifact' :
      job === 'support_3d_sound' ? 'three_d_artifact' :
        job === 'support_motion_design_sound' ? 'motion_design_artifact' :
          job === 'support_transition_sound' ? 'transition_artifact' : 'graphic_design_artifact'
    return {
      inputs: [artifact, 'approved_timeline_manifest'],
      evidence: ['parent_authority_hash', 'visual_version_hash', 'timeline_hash'],
    }
  }
  if (capabilityClass === 'provider') {
    const videoConditioned = job === 'generate_video_conditioned_sfx' || job === 'generate_foley'
    return {
      inputs: videoConditioned
        ? ['bounded_private_visual_proxy', 'visual_event_manifest', 'approved_timeline_manifest']
        : ['visual_event_manifest', 'approved_timeline_manifest'],
      evidence: [
        'approved_snapshot', 'credit_reservation', 'timeline_hash',
        ...(videoConditioned ? ['visual_version_hash'] : []),
        'provider_privacy_approval',
      ],
    }
  }
  if (capabilityClass === 'sync') {
    return {
      inputs: ['approved_source_audio', 'visual_event_manifest', 'approved_timeline_manifest'],
      evidence: ['approved_snapshot', 'source_audio_hash', 'visual_version_hash', 'timeline_hash'],
    }
  }
  if (capabilityClass === 'mix') {
    return {
      inputs: ['approved_source_audio', 'sound_cue_manifest', 'approved_timeline_manifest', 'read_only_music_context'],
      evidence: ['approved_snapshot', 'source_audio_hash', 'timeline_hash', 'music_context_hash'],
    }
  }
  if (capabilityClass === 'qa') {
    return {
      inputs: ['private_sound_stem', 'sound_cue_manifest', 'approved_timeline_manifest'],
      evidence: ['approved_snapshot', 'timeline_hash', 'provenance_status'],
    }
  }
  if (capabilityClass === 'handoff') {
    return {
      inputs: ['private_sound_stem', 'sound_cue_manifest', 'sound_qa_report'],
      evidence: ['approved_snapshot', 'timeline_hash', 'provenance_status'],
    }
  }
  if (capabilityClass === 'local' || job === 'extract_project_owned_sound') {
    return {
      inputs: ['approved_source_audio'],
      evidence: ['approved_snapshot', 'source_audio_hash'],
    }
  }
  if (capabilityClass === 'revision') {
    return {
      inputs: ['sound_cue_manifest', 'private_sound_stem'],
      evidence: ['approved_snapshot', 'revision_lineage', 'invalidation_reason'],
    }
  }
  if (capabilityClass === 'design') {
    return {
      inputs: [
        job === 'full_video_sound_pass' ? 'approved_source_video' : 'scene_manifest',
        'approved_timeline_manifest',
      ],
      evidence: ['source_video_hash', 'timeline_hash'],
    }
  }
  if (job === 'search_sound_library') {
    return { inputs: ['visual_event_manifest'], evidence: ['project_provenance_policy'] }
  }
  return { inputs: ['approved_source_audio'], evidence: ['source_audio_hash'] }
}

function routesFor(job: SoundSupportedJobType, capabilityClass: CapabilityClass) {
  const lowCost = [
    'sound.route.acquire.project_source.v1',
    'sound.route.acquire.internal_library.v1',
    'sound.route.edit.deterministic.v1',
    'sound.route.no_sound.v1',
  ]
  if (capabilityClass === 'provider') {
    const primary = job === 'generate_video_conditioned_sfx' || job === 'generate_foley'
      ? 'sound.route.generate.video_sfx.mirelo.v1'
      : job === 'generate_ambience'
        ? 'sound.route.ambience.generate_or_extend.v1'
        : 'sound.route.generate.text_sfx.v1'
    return {
      primary: [primary],
      fallback: primary === 'sound.route.generate.video_sfx.mirelo.v1'
        ? ['sound.route.generate.video_sfx.mmaudio.v1', 'sound.route.no_sound.v1']
        : ['sound.route.acquire.internal_library.v1', 'sound.route.no_sound.v1'],
      lower: lowCost,
      attempt: 'sound.attempt.provider',
    }
  }
  if (capabilityClass === 'local') {
    const primary = job === 'extend_ambience' || job === 'loop_audio'
      ? 'sound.route.ambience.generate_or_extend.v1'
      : job === 'repair_audio' || job === 'clean_dialogue' || job === 'reduce_noise'
        ? 'sound.route.repair.dialogue_gentle.v1'
        : job === 'time_stretch_audio' || job === 'pitch_shift_audio'
          ? 'sound.route.retime.pitch_preserved.v1'
          : 'sound.route.edit.deterministic.v1'
    return {
      primary: [primary],
      fallback: [],
      lower: lowCost,
      attempt: 'sound.attempt.local',
    }
  }
  if (capabilityClass === 'sync') {
    return { primary: ['sound.route.sync.visual_event.v1'], fallback: [], lower: lowCost, attempt: 'sound.attempt.local' }
  }
  if (capabilityClass === 'mix') {
    return { primary: ['sound.route.mix.scene.v1'], fallback: [], lower: lowCost, attempt: 'sound.attempt.local' }
  }
  if (capabilityClass === 'qa' || capabilityClass === 'handoff') {
    return { primary: ['sound.route.qa.final_sound.v1'], fallback: [], lower: [], attempt: 'sound.attempt.local' }
  }
  if (capabilityClass === 'study') {
    const primary = job === 'study_source_audio'
      ? 'sound.route.study.source_audio.v1'
      : job === 'study_visual_sound_events'
        ? 'sound.route.study.visual_events.v1'
        : 'sound.route.study.reference_sound.v1'
    return { primary: [primary], fallback: [], lower: [], attempt: 'sound.attempt.local' }
  }
  if (capabilityClass === 'acquisition') {
    return {
      primary: job === 'search_sound_library'
        ? ['sound.route.acquire.internal_library.v1']
        : ['sound.route.acquire.project_source.v1'],
      fallback: ['sound.route.no_sound.v1'],
      lower: lowCost,
      attempt: 'sound.attempt.planning',
    }
  }
  if (capabilityClass === 'revision') {
    return {
      primary: ['sound.route.revision.v1'],
      fallback: [], lower: lowCost, attempt: 'sound.attempt.local',
    }
  }
  return {
    primary: ['sound.route.design.plan.v1'],
    fallback: ['sound.route.no_sound.v1'],
    lower: lowCost,
    attempt: 'sound.attempt.planning',
  }
}

function productsFor(job: SoundSupportedJobType, capabilityClass: CapabilityClass): string[] {
  if (job === 'study_source_audio') return ['sound_study_report']
  if (job === 'study_visual_sound_events') return ['visual_sound_event_study']
  if (job === 'study_reference_sound' || job === 'create_sound_dna') return ['reference_sound_dna']
  if (capabilityClass === 'provider') {
    if (job === 'generate_foley') return ['candidate_foley_asset', 'sound_cue_manifest', 'provenance_report']
    if (job === 'generate_ambience') return ['ambience_asset', 'sound_cue_manifest', 'provenance_report']
    return ['candidate_sfx_asset', 'sound_cue_manifest', 'provenance_report']
  }
  if (capabilityClass === 'local') {
    if (job === 'repair_audio') return ['repaired_audio_asset', 'provenance_report']
    if (job === 'clean_dialogue' || job === 'reduce_noise') return ['cleaned_dialogue_asset', 'provenance_report']
    return ['edited_audio_asset_version', 'provenance_report']
  }
  if (capabilityClass === 'sync') return ['sound_cue_manifest', 'mix_automation_manifest']
  if (capabilityClass === 'mix') return ['private_sound_stem', 'mix_automation_manifest']
  if (capabilityClass === 'qa') return ['sound_qa_report']
  if (capabilityClass === 'handoff') return ['final_composition_sound_handoff', 'head_of_orchestra_receipt']
  if (capabilityClass === 'peer') return ['sound_design_plan', 'peer_skill_receipt', 'visual_retime_proposal']
  if (capabilityClass === 'acquisition') return ['sound_cue_manifest', 'no_sound_decision', 'provenance_report']
  return ['sound_design_plan', 'no_sound_decision', 'sound_cue_manifest']
}

function makeCapabilityEntry(job: SoundSupportedJobType): SkillCapabilityEntry {
  const capabilityClass = capabilityClassByJob[job]
  const requirements = requirementsFor(job, capabilityClass)
  const routePolicy = routesFor(job, capabilityClass)
  const qualificationByExecutionMode = derivedCapabilityQualificationByMode(routePolicy.primary)
  const qualification = qualificationByExecutionMode.planning
  const phase = entryPhase(capabilityClass, job)
  const synchronized = capabilityClass === 'sync' || capabilityClass === 'mix' || capabilityClass === 'qa' || capabilityClass === 'handoff'
  const provider = capabilityClass === 'provider'
  const evidenceRefs = provider
    ? [EVIDENCE.mireloFixture, EVIDENCE.mireloOfficial, EVIDENCE.mireloPrivacy]
    : capabilityClass === 'local' || synchronized || capabilityClass === 'study'
      ? [EVIDENCE.localRuntime, EVIDENCE.localQa]
      : [EVIDENCE.controller, EVIDENCE.scope]
  return {
    capabilityKey: `sound.${job}`,
    capabilityVersion: '1.0.0',
    displayName: job.split('_').map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`).join(' '),
    description: `Canonical Sound capability for ${job.replaceAll('_', ' ')}.`,
    supportedJobType: job,
    qualificationStatus: qualification,
    qualificationByExecutionMode,
    qualificationEvidenceRefs: evidenceRefs,
    supportedScopeLevels: job === 'full_video_sound_pass' ? ['video'] :
      job === 'design_boundary_sound' || job === 'support_transition_sound' ? ['boundary', 'range'] : allScopes,
    acceptedCallerTypes: job === 'full_video_sound_pass' || job === 'handoff_sound_to_final_composition'
      ? ['head_of_orchestra']
      : allCallers,
    requiredInputs: requirements.inputs,
    optionalInputs: [
      'transcript_speech_evidence', 'read_only_music_context', 'reference_sound_asset',
      'tracking_motion_manifest', 'sound_cue_manifest',
    ].filter((value) => !requirements.inputs.includes(value)),
    requiredEvidence: requirements.evidence,
    acceptedArtifactTypes: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
    producedArtifactTypes: productsFor(job, capabilityClass),
    requiredContext: ['authorized_ranges', 'locked_layers', 'neighboring_scene_context'],
    visualIntelligenceRequirements: provider || capabilityClass === 'peer' || capabilityClass === 'sync'
      ? ['exact_visual_event', 'material_perspective_environment', 'versioned_visual_timing']
      : ['read_only_visual_context_when_relevant'],
    trackingRequirements: job === 'generate_foley' || job === 'sync_audio_to_visual'
      ? ['versioned_event_anchors']
      : [],
    planningPhase: phase,
    allowedExecutionPhases: provider ? ['planning', 'provider_generation', 'qa'] :
      capabilityClass === 'sync' ? ['planning', 'synchronization', 'qa'] :
        capabilityClass === 'mix' ? ['planning', 'mixing', 'qa'] :
          capabilityClass === 'qa' ? ['qa'] :
            capabilityClass === 'handoff' ? ['handoff'] :
              capabilityClass === 'revision' ? ['revision', 'qa'] :
                capabilityClass === 'local' ? ['planning', 'approved_private_execution', 'qa'] : ['planning'],
    mustRunBefore: capabilityClass === 'qa' ? ['final_composition'] :
      capabilityClass === 'handoff' ? ['final_video_render'] :
        synchronized ? ['sound_qa'] : [],
    mustRunAfter: capabilityClass === 'peer' || provider
      ? ['versioned_visual_artifact']
      : capabilityClass === 'sync'
        ? ['visual_timing_lock']
        : capabilityClass === 'mix'
          ? ['visual_timing_lock', 'approved_music_context']
          : capabilityClass === 'qa'
            ? ['sound_mix']
            : capabilityClass === 'handoff'
              ? ['sound_qa']
              : [],
    conflictsWith: [
      'sound_duplicate_authority', 'music_composition_owner', 'final_render_owner',
      'concurrent_destructive_audio_mutation', 'uncoordinated_visual_retime',
    ],
    mayOverlapWith: [
      { skillKey: 'living_frame', mode: 'parallel_planning' },
      { skillKey: 'three_d', mode: 'parallel_planning' },
      { skillKey: 'motion_design', mode: 'parallel_planning' },
      { skillKey: 'transitions', mode: 'ordered_execution' },
      { skillKey: 'graphic_design', mode: 'parallel_planning' },
      { skillKey: 'music', mode: 'read_only_overlap' },
      { skillKey: 'captions', mode: 'read_only_overlap' },
      { skillKey: 'visual_analysis', mode: 'read_only_overlap' },
    ],
    ownershipRequirements: [
      'exact_authorized_audio_ranges', 'source_artifact_versions', 'timeline_hash',
      'caller_authority', 'locked_layer_declarations', 'private_output_scope',
      'final_composition_handoff_only',
      ...(provider || ['local', 'sync', 'mix', 'qa', 'handoff'].includes(capabilityClass)
        ? ['approved_snapshot_for_execution'] : []),
      ...(provider ? ['credit_reservation_for_provider_work'] : []),
    ],
    timeEstimatorKey: SOUND_TIME_ESTIMATOR_KEY,
    creditEstimatorKey: SOUND_CREDIT_ESTIMATOR_KEY,
    attemptPolicyKey: routePolicy.attempt,
    primaryToolRoutes: routePolicy.primary,
    fallbackRoutes: routePolicy.fallback,
    lowerCostRoutes: routePolicy.lower,
    planningQa,
    outputQa,
    integrationQa,
    invalidationRules: invalidationRules.map((rule) => rule.ruleKey),
    revisionRules: revisionRules.map((rule) => rule.ruleKey),
    qualificationFixtures: evidenceRefs,
    knownLimitations: provider
      ? ['Fixture-qualified provider transport; live production execution remains blocked.']
      : qualification === 'planning_qualified'
        ? ['Planning-qualified only; execution requires a separately qualified operation route.']
        : ['Private/internal qualification does not imply public production deployment.'],
  }
}

const capabilityEntries = SOUND_SUPPORTED_JOB_TYPES.map(makeCapabilityEntry)

const unpublishedSoundManifest: UnpublishedSkillCapabilityManifest = {
  manifestSchemaVersion: 'skill-capability-manifest-v1',
  manifestId: SOUND_MANIFEST_ID,
  skillKey: SOUND_SKILL_KEY,
  skillVersion: SOUND_SKILL_VERSION,
  contractVersion: SOUND_MANIFEST_CONTRACT_VERSION,
  qualificationStatus: capabilityEntries.map((entry) => entry.qualificationStatus)
    .sort((left, right) => qualificationRank[left] - qualificationRank[right])[0] ?? 'blocked',
  qualificationByExecutionMode: {
    planning: capabilityEntries.map((entry) => entry.qualificationByExecutionMode.planning)
      .sort((left, right) => qualificationRank[left] - qualificationRank[right])[0] ?? 'blocked',
    preview_execution: capabilityEntries.map((entry) => entry.qualificationByExecutionMode.preview_execution)
      .sort((left, right) => qualificationRank[left] - qualificationRank[right])[0] ?? 'blocked',
    final_execution: capabilityEntries.map((entry) => entry.qualificationByExecutionMode.final_execution)
      .sort((left, right) => qualificationRank[left] - qualificationRank[right])[0] ?? 'blocked',
  },
  qualificationEvidenceRefs: [
    {
      evidenceId: EVIDENCE.manifest,
      evidenceType: 'smoke_test',
      location: 'server/smoke/sound-capability-manifest-smoke.ts',
      assertion: 'Manifest schema, hash, registry, assignment, scheduling, estimation, QA, and invalidation behavior.',
    },
    {
      evidenceId: EVIDENCE.scope,
      evidenceType: 'smoke_test',
      location: 'server/smoke/canonical-sound-skill-smoke.ts',
      assertion: 'Caller, scope, range, locked-layer, cycle, planning, mix, and handoff enforcement.',
    },
    {
      evidenceId: EVIDENCE.controller,
      evidenceType: 'smoke_test',
      location: 'server/smoke/canonical-sound-skill-smoke.ts',
      assertion: 'Canonical controller acquisition order, no-Sound, cue aggregation, and peer receipts.',
    },
    {
      evidenceId: EVIDENCE.localRuntime,
      evidenceType: 'runtime',
      location: 'server/smoke/canonical-sound-local-audio-smoke.ts',
      assertion: 'Actual decoded audio bytes pass through bounded analysis, edit, transform, mix, and private artifact operations.',
    },
    {
      evidenceId: EVIDENCE.localQa,
      evidenceType: 'qa',
      location: 'server/smoke/canonical-sound-local-audio-smoke.ts',
      assertion: 'Checksum, source immutability, file integrity, format, loudness, transient, and unsafe-operation checks.',
    },
    {
      evidenceId: EVIDENCE.mireloFixture,
      evidenceType: 'fixture',
      location: 'server/smoke/canonical-sound-mirelo-smoke.ts',
      assertion: 'Injected transport covers official request shapes, success, failure, timeout, unknown outcome, reconciliation, private ingest, and no blind fallback.',
    },
    {
      evidenceId: EVIDENCE.mireloOfficial,
      evidenceType: 'runtime',
      location: 'https://www.mirelo.ai/api-docs',
      assertion: 'Provider profile reviewed against the official SFX 1.6 API on 2026-08-03.',
    },
    {
      evidenceId: EVIDENCE.mireloPrivacy,
      evidenceType: 'privacy',
      location: 'https://www.mirelo.ai/privacy',
      assertion: 'Privacy and training-use terms reviewed; production remains approval-gated.',
    },
    {
      evidenceId: EVIDENCE.handoff,
      evidenceType: 'smoke_test',
      location: 'server/smoke/canonical-sound-skill-smoke.ts',
      assertion: 'Final-composition handoff is complete without final-render ownership.',
    },
  ],
  skillClass: 'professional_audio_post_production_and_sound_design',
  coordinationCritical: true,
  canOwnPrimaryVisual: false,
  canActAsSupport: true,
  canOperateAtVideoLevel: true,
  canOperateAtSceneLevel: true,
  canOperateAtBoundaryLevel: true,
  supportedJobTypes: [...SOUND_SUPPORTED_JOB_TYPES],
  unsupportedJobTypes: [...SOUND_UNSUPPORTED_JOB_TYPES],
  requiredInputs: ['caller_authority', 'assignment_scope', 'manifest_binding'],
  optionalInputs: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
  requiredSceneContext: [
    'neighboring_scene_context', 'speech_importance', 'existing_sound_layers',
    'read_only_music_context_when_relevant', 'locked_layers',
  ],
  requiredSourceEvidence: [
    'source_artifact_versions', 'source_hashes', 'timeline_hash', 'authorized_ranges',
  ],
  visualIntelligenceRequirements: [
    'versioned_visual_event_evidence_for_synchronized_sound',
    'material_perspective_environment_for_foley',
  ],
  trackingRequirements: ['versioned_event_anchors_when_motion_tracking_is_required'],
  acceptedArtifactTypes: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
  producedArtifactTypes: [...SOUND_PRODUCED_ARTIFACT_TYPES],
  planningPhase: 'scene_planning',
  allowedExecutionPhases: [
    'planning', 'approved_private_execution', 'provider_generation', 'synchronization',
    'mixing', 'qa', 'handoff', 'revision',
  ],
  mustRunBefore: ['final_composition', 'final_video_render'],
  mustRunAfter: [],
  conflictsWith: [
    'sound_duplicate_authority', 'music_composition_owner', 'final_render_owner',
    'concurrent_destructive_audio_mutation', 'uncoordinated_visual_retime',
  ],
  mayOverlapWith: [
    { skillKey: 'living_frame', mode: 'parallel_planning' },
    { skillKey: 'three_d', mode: 'parallel_planning' },
    { skillKey: 'motion_design', mode: 'parallel_planning' },
    { skillKey: 'transitions', mode: 'ordered_execution' },
    { skillKey: 'graphic_design', mode: 'parallel_planning' },
    { skillKey: 'music', mode: 'read_only_overlap' },
    { skillKey: 'captions', mode: 'read_only_overlap' },
    { skillKey: 'visual_analysis', mode: 'read_only_overlap' },
  ],
  ownershipRequirements: [
    'exact_authorized_audio_ranges', 'separate_visual_write_authority',
    'source_artifact_versions', 'timeline_hash', 'caller_authority',
    'locked_layer_declarations', 'approved_snapshot_for_execution',
    'credit_reservation_for_paid_work', 'private_output_scope',
    'final_composition_handoff_not_final_render',
  ],
  timeEstimator: {
    estimatorKey: SOUND_TIME_ESTIMATOR_KEY,
    estimatorVersion: 'sound-estimate-v1',
    factors: [
      'duration', 'range_count', 'visual_event_count', 'source_audio_complexity',
      'speech_density', 'candidate_count', 'provider_duration', 'local_operations',
      'qa_depth', 'revision_count', 'expected_fallbacks',
    ],
  },
  creditEstimator: {
    estimatorKey: SOUND_CREDIT_ESTIMATOR_KEY,
    estimatorVersion: 'sound-estimate-v1',
    factors: [
      'local_tool_execution', 'provider_requests', 'candidate_count', 'audio_duration',
      'video_conditioned_duration', 'cleanup', 'analysis', 'mixing', 'qa',
      'infrastructure', 'fallbacks', 'unknown_attempt_cost',
    ],
  },
  attemptPolicies,
  toolRoutes: routes,
  fallbackRoutes: ['sound.route.mmaudio_v2_fallback'],
  lowerCostRoutes: [
    'sound.route.preserve_project_source', 'sound.route.internal_library',
    'sound.route.project_extraction', 'sound.route.local_processing',
    'sound.route.mmaudio_v2_fallback', 'sound.route.mirelo_sfx_1_6',
    'sound.route.no_sound',
  ],
  planningQa,
  outputQa,
  integrationQa,
  invalidationRules,
  revisionRules,
  qualificationFixtures: [
    EVIDENCE.manifest, EVIDENCE.scope, EVIDENCE.controller, EVIDENCE.localRuntime,
    EVIDENCE.localQa, EVIDENCE.mireloFixture, EVIDENCE.handoff,
  ],
  knownLimitations: [
    'Mirelo is fixture-qualified only; live production generation is fail-closed.',
    'MMAudio fallback is declared but blocked pending independent qualification.',
    'Local deterministic processing is private/internal qualified, not public production deployed.',
    'Sound does not compose Music, own the primary visual, mux/render/export, or publish.',
    'Perceptual ranking uses structured evidence and QA; no live learned ranking service is activated.',
  ],
  capabilityEntries,
}

export const soundSkillCapabilityManifest: Readonly<SkillCapabilityManifest> =
  publishSkillCapabilityManifest(unpublishedSoundManifest)

export interface SoundMiniSkillManifest {
  miniSkillKey: string
  miniSkillVersion: string
  qualificationStatus: SkillQualificationStatus
  supportedOperations: string[]
  requiredInputs: string[]
  optionalInputs: string[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  toolRoutes: string[]
  fallbackRoutes: string[]
  lowerCostRoutes: string[]
  attemptPolicyKey: string
  planningQa: string[]
  outputQa: string[]
  invalidationRules: string[]
  knownLimitations: string[]
}

type MiniSeed = Pick<
  SoundMiniSkillManifest,
  'miniSkillKey' | 'qualificationStatus' | 'supportedOperations' | 'toolRoutes' | 'producedArtifactTypes'
> & Partial<SoundMiniSkillManifest>

function mini(seed: MiniSeed): Readonly<SoundMiniSkillManifest> {
  return Object.freeze({
    miniSkillVersion: '1.0.0',
    requiredInputs: [],
    optionalInputs: [],
    acceptedArtifactTypes: [...SOUND_ACCEPTED_ARTIFACT_TYPES],
    fallbackRoutes: [],
    lowerCostRoutes: [
      'sound.route.preserve_project_source', 'sound.route.internal_library',
      'sound.route.project_extraction', 'sound.route.no_sound',
    ],
    attemptPolicyKey: seed.toolRoutes.includes('sound.route.mirelo_sfx_1_6')
      ? 'sound.attempt.provider'
      : seed.qualificationStatus === 'private_internal_qualified'
        ? 'sound.attempt.local'
        : 'sound.attempt.planning',
    planningQa,
    outputQa,
    invalidationRules: invalidationRules.map((rule) => rule.ruleKey),
    knownLimitations: [],
    ...seed,
  })
}

export const soundMiniSkillManifests: Readonly<Record<string, Readonly<SoundMiniSkillManifest>>> =
  Object.freeze(Object.fromEntries([
    mini({ miniSkillKey: 'sound_scope_guard', qualificationStatus: 'private_internal_qualified', supportedOperations: ['validate_request', 'validate_authority', 'validate_ranges', 'prevent_cycles'], toolRoutes: [], producedArtifactTypes: ['head_of_orchestra_receipt', 'peer_skill_receipt'] }),
    mini({ miniSkillKey: 'source_sound_study', qualificationStatus: 'private_internal_qualified', supportedOperations: ['decode', 'loudness', 'silence', 'transients', 'continuity'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['sound_study_report'] }),
    mini({ miniSkillKey: 'visual_action_study', qualificationStatus: 'planning_qualified', supportedOperations: ['study_actions', 'study_material', 'study_perspective', 'study_environment'], toolRoutes: [], producedArtifactTypes: ['visual_sound_event_study'] }),
    mini({ miniSkillKey: 'reference_sound_study', qualificationStatus: 'private_internal_qualified', supportedOperations: ['analyze_reference'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['reference_sound_dna'] }),
    mini({ miniSkillKey: 'sound_dna', qualificationStatus: 'private_internal_qualified', supportedOperations: ['derive_sound_dna'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['reference_sound_dna'] }),
    mini({ miniSkillKey: 'sound_design_director', qualificationStatus: 'planning_qualified', supportedOperations: ['preserve', 'repair', 'search', 'extract', 'generate', 'layer', 'choose_no_sound', 'control_density'], toolRoutes: ['sound.route.preserve_project_source', 'sound.route.internal_library', 'sound.route.project_extraction', 'sound.route.mirelo_sfx_1_6', 'sound.route.no_sound'], producedArtifactTypes: ['sound_design_plan', 'no_sound_decision', 'sound_cue_manifest'] }),
    mini({ miniSkillKey: 'internal_library_acquisition', qualificationStatus: 'planning_qualified', supportedOperations: ['search', 'rank', 'validate_provenance'], toolRoutes: ['sound.route.internal_library'], producedArtifactTypes: ['sound_cue_manifest', 'provenance_report'] }),
    mini({ miniSkillKey: 'project_source_extraction', qualificationStatus: 'private_internal_qualified', supportedOperations: ['extract', 'repair'], toolRoutes: ['sound.route.project_extraction'], producedArtifactTypes: ['edited_audio_asset_version', 'provenance_report'] }),
    mini({ miniSkillKey: 'video_conditioned_sfx', qualificationStatus: 'fixture_qualified', supportedOperations: ['generate_video_conditioned_sfx'], toolRoutes: ['sound.route.mirelo_sfx_1_6'], fallbackRoutes: ['sound.route.mmaudio_v2_fallback'], producedArtifactTypes: ['candidate_sfx_asset', 'provenance_report'], knownLimitations: ['Live provider activation is blocked.'] }),
    mini({ miniSkillKey: 'text_conditioned_sfx', qualificationStatus: 'fixture_qualified', supportedOperations: ['generate_text_conditioned_sfx'], toolRoutes: ['sound.route.mirelo_sfx_1_6'], fallbackRoutes: ['sound.route.mmaudio_v2_fallback'], producedArtifactTypes: ['candidate_sfx_asset', 'provenance_report'], knownLimitations: ['Live provider activation is blocked.'] }),
    mini({ miniSkillKey: 'foley', qualificationStatus: 'fixture_qualified', supportedOperations: ['generate_foley'], toolRoutes: ['sound.route.mirelo_sfx_1_6'], fallbackRoutes: ['sound.route.mmaudio_v2_fallback'], producedArtifactTypes: ['candidate_foley_asset'], knownLimitations: ['Live provider activation is blocked.'] }),
    mini({ miniSkillKey: 'ambience', qualificationStatus: 'private_internal_qualified', supportedOperations: ['generate_ambience_plan', 'loop', 'extend', 'room_tone'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['ambience_asset'] }),
    mini({ miniSkillKey: 'audio_repair', qualificationStatus: 'private_internal_qualified', supportedOperations: ['gentle_cleanup', 'noise_reduction', 'hum_reduction', 'click_repair', 'channel_repair'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['repaired_audio_asset'] }),
    mini({ miniSkillKey: 'dialogue_cleanup', qualificationStatus: 'private_internal_qualified', supportedOperations: ['gentle_dialogue_cleanup', 'speech_safe_qa'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['cleaned_dialogue_asset'] }),
    mini({ miniSkillKey: 'audio_editing', qualificationStatus: 'private_internal_qualified', supportedOperations: ['trim', 'fade', 'gain', 'normalize', 'resample', 'channel_convert', 'loop'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['edited_audio_asset_version'] }),
    mini({ miniSkillKey: 'audio_retiming', qualificationStatus: 'private_internal_qualified', supportedOperations: ['time_stretch', 'pitch_shift', 'exact_length_fit'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['edited_audio_asset_version'] }),
    mini({ miniSkillKey: 'sound_sync', qualificationStatus: 'private_internal_qualified', supportedOperations: ['transient_detection', 'hit_alignment', 'frame_sync', 'tail_policy', 'speech_safe_placement'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['sound_cue_manifest', 'mix_automation_manifest'] }),
    mini({ miniSkillKey: 'sound_mix', qualificationStatus: 'private_internal_qualified', supportedOperations: ['gain_automation', 'ducking', 'eq', 'limiting', 'panning', 'room_match', 'stem_render'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['private_sound_stem', 'mix_automation_manifest'] }),
    mini({ miniSkillKey: 'sound_qa', qualificationStatus: 'private_internal_qualified', supportedOperations: ['technical_qa', 'sync_qa', 'perceptual_qa', 'mix_qa', 'continuity_qa', 'provenance_qa'], toolRoutes: ['sound.route.local_processing'], producedArtifactTypes: ['sound_qa_report', 'final_composition_sound_handoff'] }),
  ].map((manifest) => [manifest.miniSkillKey, manifest])))

export function registerCanonicalSoundSkill(): Readonly<SkillCapabilityManifest> {
  canonicalSkillCapabilityRegistry.register(soundSkillCapabilityManifest)
  return soundSkillCapabilityManifest
}

registerCanonicalSoundSkill()
