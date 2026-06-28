import type {
  EditLevelQAGateCategory,
  EditLevelQAGateDefinition,
  EditLevelQAGateId,
  EditLevelQAGatePackage,
  EditLevelQAGateRequiredness,
  EditLevelQAGateRoute,
  EditLevelQAGateSideEffectFlags,
  EditLevelQAGateStatus,
  EditLevelQAGateStrictness,
  EditLevelQAReadinessStatus,
  ReEditProCanonicalEditLevel,
} from '../types'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'

type GateSpec = {
  gateId: EditLevelQAGateId
  requiredness: EditLevelQAGateRequiredness
  status?: EditLevelQAGateStatus
  blocksPlan?: boolean
  blocksRenderFuture?: boolean
  fallback: string
  userFacingSummary: string
  technicalNotes?: string[]
}

export const EDIT_LEVEL_QA_GATE_DEFINITIONS: EditLevelQAGateDefinition[] = [
  gate('safety_do_not_copy', 'Do-not-copy safety', 'safety', 'Checks that the plan avoids copying a reference video, creator, brand, or protected style too closely.', 'available_mock'),
  gate('copy_risk', 'Copy-risk review', 'safety', 'Checks copy-risk language, similarity risk, and reference-video boundaries.', 'available_mock'),
  gate('source_video_present', 'Source video present', 'source', 'Checks that a source video or source package is expected before planning.', 'storage_required'),
  gate('source_metadata_ready', 'Source metadata ready', 'source', 'Checks basic source metadata and setup context readiness.', 'available_mock'),
  gate('export_settings_valid', 'Export settings valid', 'export', 'Checks target platform, frame, and export settings policy.', 'available_mock'),
  gate('caption_safe_zone', 'Caption safe zone', 'caption', 'Checks that planned captions avoid important faces, products, labels, panels, and safe-zone conflicts.', 'available_mock'),
  gate('caption_readability', 'Caption readability', 'caption', 'Checks caption size, density, contrast, and hold-time policy.', 'available_mock'),
  gate('audio_basic_sanity', 'Basic audio sanity', 'audio', 'Checks voice-first audio cleanliness policy.', 'available_mock'),
  gate('audio_music_ducking', 'Music ducking', 'audio', 'Checks that future music and ducking policy protects speech clarity.', 'worker_required'),
  gate('sfx_restraint', 'SFX restraint', 'audio', 'Checks that SFX are cue-based and do not cover speech.', 'worker_required'),
  gate('sound_design_coherence', 'Sound design coherence', 'audio', 'Checks future sound-design coherence and layered audio intent.', 'worker_required'),
  gate('marker_missing_asset', 'Marker missing asset', 'marker', 'Checks Edit Brief marker references for missing required assets.', 'storage_required'),
  gate('marker_needs_clarification', 'Marker needs clarification', 'marker', 'Checks whether a marker needs a user clarification before planning.', 'available_mock'),
  gate('marker_conflict', 'Marker conflict', 'marker', 'Checks conflicting Edit Brief markers, avoid notes, or must-use instructions.', 'available_mock'),
  gate('marker_time_range_valid', 'Marker time range valid', 'marker', 'Checks marker time ranges for basic validity.', 'available_mock'),
  gate('edit_brief_priority_consistency', 'Edit Brief priority consistency', 'marker', 'Checks whether Edit Brief marker priority is coherent with level policy.', 'available_mock'),
  gate('preference_dna_match', 'Preference DNA match', 'preference', 'Checks whether planned creative choices match Edit Preference/DNA policy.', 'available_mock'),
  gate('qwen_response_validation', 'Qwen response validation', 'qwen', 'Checks future Qwen response shape and policy compliance without calling Qwen.', 'runtime_disabled'),
  gate('qwen25vl_visual_confidence', 'Qwen2.5-VL visual confidence', 'visual', 'Checks future Qwen2.5-VL visual confidence policy without calling a model.', 'provider_required'),
  gate('transcript_coverage', 'Transcript coverage', 'transcript', 'Checks transcript coverage policy when speech exists.', 'worker_required'),
  gate('source_context_coverage', 'Source context coverage', 'source', 'Checks whether source-understanding context is deep enough for the selected level.', 'worker_required'),
  gate('broll_timing', 'B-roll timing', 'planning', 'Checks that B-roll supports meaning and lands at planned moments.', 'available_mock'),
  gate('pacing_consistency', 'Pacing consistency', 'planning', 'Checks pacing and story rhythm against the selected level.', 'available_mock'),
  gate('story_arc_quality', 'Story arc quality', 'planning', 'Checks narrative arc quality for deeper creative treatments.', 'available_mock'),
  gate('style_consistency', 'Style consistency', 'planning', 'Checks that visual, caption, color, pacing, and sound choices stay stylistically coherent.', 'available_mock'),
  gate('graphic_layout_consistency', 'Graphic layout consistency', 'visual', 'Checks graphic/card/layout consistency and text-safe visual planning.', 'available_mock'),
  gate('plan_completeness', 'Plan completeness', 'planning', 'Checks whether the future edit plan has enough structured planning detail.', 'available_mock'),
  gate('render_readiness_future', 'Render readiness future', 'render', 'Future render-readiness gate; no render job is created in this milestone.', 'future_gated'),
  gate('revision_budget_future', 'Revision budget future', 'render', 'Future revision-budget gate; no revision or render budget is enforced here.', 'future_gated'),
  gate('credit_gate_future', 'Credit gate future', 'credits', 'Future credit gate; no credit reservation or spend happens in this milestone.', 'future_gated'),
]

const strictnessByLevel: Record<ReEditProCanonicalEditLevel, EditLevelQAGateStrictness> = {
  normal: 'baseline',
  premium: 'premium',
  ultra_premium: 'ultra',
}

const readinessByLevel: Record<ReEditProCanonicalEditLevel, EditLevelQAReadinessStatus> = {
  normal: 'ready_for_mock_planning',
  premium: 'ready_with_warnings',
  ultra_premium: 'blocked_by_future_runtime_gate',
}

export function createEditLevelQAGateSideEffectFlags(): EditLevelQAGateSideEffectFlags {
  return {
    mockOnly: true,
    providerCallMade: false,
    qwenCallMade: false,
    qwen25vlCallMade: false,
    deepseekCallMade: false,
    plannerExecuted: false,
    editPlanCreated: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    fileBytesRead: false,
    externalUrlFetched: false,
  }
}

export function listEditLevelQAGateDefinitions(): EditLevelQAGateDefinition[] {
  return [...EDIT_LEVEL_QA_GATE_DEFINITIONS]
}

export function getEditLevelQAGateDefinition(gateId: EditLevelQAGateId): EditLevelQAGateDefinition {
  const definition = EDIT_LEVEL_QA_GATE_DEFINITIONS.find((item) => item.gateId === gateId)

  if (!definition) {
    throw new Error(`Missing Edit Level QA gate definition: ${gateId}`)
  }

  return definition
}

export function createEditLevelQAGateRoute(input: {
  level: ReEditProCanonicalEditLevel
  gateId: EditLevelQAGateId
  requiredness: EditLevelQAGateRequiredness
  status?: EditLevelQAGateStatus
  blocksPlan?: boolean
  blocksRenderFuture?: boolean
  fallback: string
  userFacingSummary: string
  technicalNotes?: string[]
}): EditLevelQAGateRoute {
  const definition = getEditLevelQAGateDefinition(input.gateId)
  const sideEffectFlags = createEditLevelQAGateSideEffectFlags()

  return {
    level: input.level,
    gateId: input.gateId,
    displayName: definition.displayName,
    category: definition.category,
    requiredness: input.requiredness,
    strictness: strictnessByLevel[input.level],
    status: input.status ?? definition.defaultStatus,
    blocksPlan: input.blocksPlan ?? false,
    blocksRenderFuture: input.blocksRenderFuture ?? false,
    purpose: definition.purpose,
    fallback: input.fallback,
    userFacingSummary: input.userFacingSummary,
    technicalNotes: [
      ...(input.technicalNotes ?? []),
      'RP-EDITLEVEL-08 resolves QA gate policy only.',
      'No Qwen, Qwen2.5-VL, DeepSeek, provider, planner, edit-plan, media worker, render, Supabase, file-byte, external-fetch, or credit operation runs.',
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createNormalQAGatePackage(): EditLevelQAGatePackage {
  return createPackage('normal', normalGateSpecs)
}

export function createPremiumQAGatePackage(): EditLevelQAGatePackage {
  return createPackage('premium', premiumGateSpecs)
}

export function createUltraPremiumQAGatePackage(): EditLevelQAGatePackage {
  return createPackage('ultra_premium', ultraGateSpecs)
}

export function createEditLevelQAGatePackage(level: ReEditProCanonicalEditLevel): EditLevelQAGatePackage {
  if (level === 'normal') return createNormalQAGatePackage()
  if (level === 'premium') return createPremiumQAGatePackage()
  return createUltraPremiumQAGatePackage()
}

export function createAllEditLevelQAGatePackages(): EditLevelQAGatePackage[] {
  return [
    createNormalQAGatePackage(),
    createPremiumQAGatePackage(),
    createUltraPremiumQAGatePackage(),
  ]
}

export function createEditLevelQAGateBoundarySummary(): string[] {
  return [
    'QA gate policy only; no QA tool executes.',
    'No Qwen, Qwen2.5-VL, DeepSeek, provider, planner, edit-plan, media worker, render, Supabase, file-byte read, external fetch, or credit operation runs.',
    'Render, revision, and credit gates are future-gated policy checks only.',
  ]
}

export function createEditLevelQAFallbackPolicy(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') {
    return [
      'Normal uses baseline deterministic QA and asks for clarification when source, marker, or copy-risk context is unclear.',
      'If deeper visual/audio/runtime gates are unavailable, Normal stays on a clean professional edit path.',
    ]
  }

  if (level === 'premium') {
    return [
      'Premium keeps stronger creative QA warnings visible when visual, transcript, audio, or Qwen context is unavailable.',
      'If a recommended future gate is unavailable, Premium can continue with a degraded capability notice and user review where needed.',
    ]
  }

  return [
    'Ultra Premium is studio-level and blocks readiness on future runtime gates until source, visual, render, revision, and credit systems exist.',
    'Ultra Premium may degrade to Premium-safe QA policy when future Qwen2.5-VL, transcript, audio, render, revision, or credit gates are unavailable.',
  ]
}

function createPackage(
  level: ReEditProCanonicalEditLevel,
  specs: GateSpec[],
): EditLevelQAGatePackage {
  const sideEffectFlags = createEditLevelQAGateSideEffectFlags()
  const gates = specs.map((spec) => createEditLevelQAGateRoute({ level, ...spec }))
  const displayName = mapCanonicalEditLevelToPublicLabel(level)

  return {
    level,
    selectedLevel: level,
    displayName,
    qaStrictness: strictnessByLevel[level],
    readinessStatus: readinessByLevel[level],
    gates,
    requiredGates: gates.filter((gateRoute) => gateRoute.requiredness === 'required').map((gateRoute) => gateRoute.gateId),
    recommendedGates: gates.filter((gateRoute) => gateRoute.requiredness === 'recommended').map((gateRoute) => gateRoute.gateId),
    warningOnlyGates: gates.filter((gateRoute) => gateRoute.requiredness === 'warning_only').map((gateRoute) => gateRoute.gateId),
    blockingGates: gates.filter((gateRoute) => gateRoute.blocksPlan || gateRoute.blocksRenderFuture).map((gateRoute) => gateRoute.gateId),
    futureOnlyGates: gates.filter((gateRoute) => gateRoute.requiredness === 'future_only').map((gateRoute) => gateRoute.gateId),
    degradedGates: gates
      .filter((gateRoute) => ['runtime_disabled', 'provider_required', 'worker_required', 'future_gated', 'storage_required', 'degraded_fallback'].includes(gateRoute.status))
      .map((gateRoute) => gateRoute.gateId),
    fallbackPolicy: createEditLevelQAFallbackPolicy(level),
    readinessSummary: readinessSummaryForLevel(level),
    userFacingSummary: userSummaryForLevel(level),
    technicalSummary: `${displayName} QA package has ${gates.length} deterministic gate routes and all side-effect flags remain false.`,
    warnings: warningsForLevel(level),
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

function gate(
  gateId: EditLevelQAGateId,
  displayName: string,
  category: EditLevelQAGateCategory,
  purpose: string,
  defaultStatus: EditLevelQAGateStatus,
): EditLevelQAGateDefinition {
  return {
    gateId,
    displayName,
    category,
    purpose,
    defaultStatus,
    mockOnly: true,
  }
}

function route(
  gateId: EditLevelQAGateId,
  requiredness: EditLevelQAGateRequiredness,
  status: EditLevelQAGateStatus,
  userFacingSummary: string,
  fallback: string,
  blocksPlan = false,
  blocksRenderFuture = false,
): GateSpec {
  return {
    gateId,
    requiredness,
    status,
    blocksPlan,
    blocksRenderFuture,
    fallback,
    userFacingSummary,
  }
}

function readinessSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'Ready for mock planning with baseline QA gates.'
  if (level === 'premium') return 'Ready with warnings because stronger creative QA depends on future runtime context.'
  return 'Blocked by future runtime gates until studio-level source, visual, render, revision, and credit systems exist.'
}

function userSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') {
    return 'Normal uses baseline QA for a clean professional edit: safety, source readiness, export sanity, captions, basic audio, and obvious marker conflicts.'
  }

  if (level === 'premium') {
    return 'Premium uses stronger creative QA for polish: marker conflicts, B-roll timing, caption readability, music/SFX guidance, Preference DNA match, and plan completeness.'
  }

  return 'Ultra Premium uses studio-level strict QA: safety, story quality, style consistency, visual/audio/design confidence, deep DNA checks, and stricter plan readiness.'
}

function warningsForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') {
    return [
      'Missing asset, marker clarification, and marker conflict checks are warning-only in the mock/local Normal package.',
      'Render, revision, and credit gates are future-only and do not execute.',
    ]
  }

  if (level === 'premium') {
    return [
      'Premium exposes warnings for source context, transcript, Qwen2.5-VL visual confidence, and future render/credit gates.',
      'Recommended Qwen and media confidence gates remain mock/local policy only.',
    ]
  }

  return [
    'Ultra Premium is blocked by future runtime gates because studio-level QA needs future source, model, render, revision, and credit systems.',
    'Premium-safe degraded fallback is shown when future runtime gates are unavailable.',
  ]
}

const normalGateSpecs: GateSpec[] = [
  route('safety_do_not_copy', 'required', 'available_mock', 'Baseline safety checks prevent copying a reference or protected style too closely.', 'Ask for safer creative direction if copy risk is unclear.', true),
  route('copy_risk', 'required', 'available_mock', 'Baseline copy-risk review keeps Normal professional and safe.', 'Use safer style language and ask for clarification when needed.', true),
  route('source_video_present', 'required', 'storage_required', 'A source video or source package is required before planning.', 'Ask the user to upload or select source footage.', true),
  route('source_metadata_ready', 'required', 'available_mock', 'Basic source metadata is checked for mock planning readiness.', 'Use setup context and ask one clarifying question if metadata is missing.'),
  route('export_settings_valid', 'required', 'available_mock', 'Output platform and frame settings must be valid before planning.', 'Ask the user to confirm the output frame and platform.'),
  route('caption_safe_zone', 'required', 'available_mock', 'Caption safe-zone policy protects faces, products, labels, and proof.', 'Use safer caption placement defaults.'),
  route('caption_readability', 'optional', 'available_mock', 'Caption readability is checked with simple defaults for Normal.', 'Use clean readable caption defaults.'),
  route('audio_basic_sanity', 'required', 'available_mock', 'Basic audio sanity keeps speech clear and levels professional.', 'Use voice-first audio defaults.'),
  route('audio_music_ducking', 'not_used', 'not_required', 'Deep music-ducking QA is not required for Normal.', 'Stay on basic voice-first audio policy.'),
  route('sfx_restraint', 'optional', 'worker_required', 'SFX restraint is optional and cue-based for Normal.', 'Avoid SFX unless clearly justified.'),
  route('sound_design_coherence', 'not_used', 'not_required', 'Layered sound-design QA is not required for Normal.', 'Use simple clean audio defaults.'),
  route('marker_missing_asset', 'warning_only', 'storage_required', 'Missing marker assets are surfaced as warnings in Normal.', 'Ask the user to provide or remove the missing asset marker.'),
  route('marker_needs_clarification', 'warning_only', 'available_mock', 'Unclear markers are surfaced as warning-only clarification prompts.', 'Ask a targeted clarification if the marker changes the edit.'),
  route('marker_conflict', 'warning_only', 'available_mock', 'Obvious marker conflicts are shown as warnings for Normal.', 'Prefer explicit must-follow instructions and ask if conflict remains.'),
  route('marker_time_range_valid', 'required', 'available_mock', 'Marker time ranges need basic validity.', 'Ask the user to correct invalid marker time ranges.'),
  route('edit_brief_priority_consistency', 'optional', 'available_mock', 'Edit Brief priority consistency is optional for Normal.', 'Use setup answers when the brief is incomplete.'),
  route('preference_dna_match', 'optional', 'available_mock', 'Preference DNA is used only as safe style hints for Normal.', 'Use clean professional defaults if DNA is missing.'),
  route('qwen_response_validation', 'optional', 'runtime_disabled', 'Future Qwen response validation is optional policy only for Normal.', 'Use deterministic mock validation.'),
  route('qwen25vl_visual_confidence', 'not_used', 'provider_required', 'Deep visual confidence QA is not required for Normal.', 'Use source metadata and user markers.'),
  route('transcript_coverage', 'optional', 'worker_required', 'Transcript coverage is targeted only when speech meaning matters.', 'Ask for clarification when speech meaning is unclear.'),
  route('source_context_coverage', 'optional', 'worker_required', 'Normal checks source context only when needed for a clean edit.', 'Use metadata plus targeted source context.'),
  route('broll_timing', 'not_used', 'not_required', 'Deep B-roll timing QA is not required for Normal.', 'Use simple uploaded B-roll first.'),
  route('pacing_consistency', 'optional', 'available_mock', 'Baseline pacing consistency protects the professional edit standard.', 'Use clean professional pacing defaults.'),
  route('story_arc_quality', 'not_used', 'not_required', 'Deep story-arc QA is not required for Normal.', 'Use straightforward story structure.'),
  route('style_consistency', 'not_used', 'not_required', 'Deep style-consistency QA is not required for Normal.', 'Use simple consistent styling.'),
  route('graphic_layout_consistency', 'not_used', 'not_required', 'Styled graphic/card QA is not required for Normal.', 'Use minimal text-safe graphics only when needed.'),
  route('plan_completeness', 'optional', 'available_mock', 'Plan completeness is checked at a simple professional level.', 'Use concise deterministic plan hints.'),
  route('render_readiness_future', 'future_only', 'future_gated', 'Future render-readiness gate is documented only.', 'Do not create a render job.', false, true),
  route('revision_budget_future', 'future_only', 'future_gated', 'Future revision-budget gate is documented only.', 'Do not reserve revision budget.', false, true),
  route('credit_gate_future', 'future_only', 'future_gated', 'Future credit gate is documented only.', 'Do not reserve or spend credits.', false, true),
]

const premiumGateSpecs: GateSpec[] = [
  route('safety_do_not_copy', 'required', 'available_mock', 'Premium keeps copy and reference safety required.', 'Ask for safer creative direction if copy risk is unclear.', true),
  route('copy_risk', 'required', 'available_mock', 'Premium performs stronger copy-risk review before creative layering.', 'Use safer style language and ask for clarification when needed.', true),
  route('source_video_present', 'required', 'storage_required', 'Premium requires source footage or a source package.', 'Ask the user to upload or select source footage.', true),
  route('source_metadata_ready', 'required', 'available_mock', 'Premium checks source metadata before deeper creative planning.', 'Use setup context and ask for missing metadata.'),
  route('export_settings_valid', 'required', 'available_mock', 'Premium keeps target platform and output frame valid before planning.', 'Ask the user to confirm output frame and platform.'),
  route('caption_safe_zone', 'required', 'available_mock', 'Premium caption safe zones protect faces, products, cards, charts, and proof.', 'Use safer caption placement defaults.'),
  route('caption_readability', 'required', 'available_mock', 'Premium requires caption readability and hold-time policy.', 'Simplify captions or ask for style adjustment.'),
  route('audio_basic_sanity', 'required', 'available_mock', 'Premium keeps speech clarity and clean levels required.', 'Use voice-first audio defaults.'),
  route('audio_music_ducking', 'recommended', 'worker_required', 'Premium recommends music ducking QA to protect speech.', 'Use conservative music levels until audio workers exist.'),
  route('sfx_restraint', 'recommended', 'worker_required', 'Premium recommends cue-based SFX restraint.', 'Avoid SFX unless tied to planned visual/story cues.'),
  route('sound_design_coherence', 'optional', 'worker_required', 'Premium may review sound-design coherence when audio context exists.', 'Use basic audio fallback and show degraded notice.'),
  route('marker_missing_asset', 'required', 'storage_required', 'Premium treats missing marker assets as a planning blocker.', 'Ask the user to provide, replace, or remove the missing asset marker.', true),
  route('marker_needs_clarification', 'warning_only', 'available_mock', 'Premium surfaces unclear markers as warning-only review prompts.', 'Ask targeted clarification if the marker changes the edit.'),
  route('marker_conflict', 'required', 'available_mock', 'Premium treats marker conflicts as blockers before creative planning.', 'Resolve conflicting must-use, avoid, or priority markers.', true),
  route('marker_time_range_valid', 'required', 'available_mock', 'Premium requires valid marker time ranges.', 'Ask the user to correct invalid marker time ranges.'),
  route('edit_brief_priority_consistency', 'recommended', 'available_mock', 'Premium recommends Edit Brief marker priority consistency.', 'Use explicit must-follow markers over soft style preferences.'),
  route('preference_dna_match', 'recommended', 'available_mock', 'Premium checks Preference DNA match for stronger creative fit.', 'Use safe style hints if DNA context is missing.'),
  route('qwen_response_validation', 'recommended', 'runtime_disabled', 'Premium validates future Qwen response policy as mock/local rules.', 'Use deterministic fallback while Qwen is disabled.'),
  route('qwen25vl_visual_confidence', 'warning_only', 'provider_required', 'Premium shows Qwen2.5-VL visual-confidence gaps as warnings.', 'Use source markers and key-moment fallback.'),
  route('transcript_coverage', 'warning_only', 'worker_required', 'Premium shows transcript coverage warnings when speech exists.', 'Use source summary and ask clarification for speech-critical edits.'),
  route('source_context_coverage', 'warning_only', 'worker_required', 'Premium warns when source context is below key-moment depth.', 'Use key-moment fallback and degraded notice.'),
  route('broll_timing', 'recommended', 'available_mock', 'Premium recommends B-roll timing QA for creative polish.', 'Prefer uploaded B-roll and meaning-timed placement.'),
  route('pacing_consistency', 'recommended', 'available_mock', 'Premium recommends pacing consistency for stronger rhythm.', 'Use balanced pacing defaults.'),
  route('story_arc_quality', 'optional', 'available_mock', 'Premium can review story arc quality when narrative structure matters.', 'Use clear beginning, development, and payoff defaults.'),
  route('style_consistency', 'optional', 'available_mock', 'Premium can review style consistency across visuals and sound.', 'Use consistent caption, color, graphic, and pacing defaults.'),
  route('graphic_layout_consistency', 'recommended', 'available_mock', 'Premium recommends styled graphic/card layout QA.', 'Use text-safe graphic/card defaults.'),
  route('plan_completeness', 'required', 'available_mock', 'Premium requires a complete layered creative plan before future execution.', 'Use deterministic layered plan hints.', true),
  route('render_readiness_future', 'future_only', 'future_gated', 'Future render-readiness gate remains policy only for Premium.', 'Do not create a render job.', false, true),
  route('revision_budget_future', 'future_only', 'future_gated', 'Future revision-budget gate remains policy only for Premium.', 'Do not reserve revision budget.', false, true),
  route('credit_gate_future', 'future_only', 'future_gated', 'Future credit gate remains policy only for Premium.', 'Do not reserve or spend credits.', false, true),
]

const ultraGateSpecs: GateSpec[] = [
  route('safety_do_not_copy', 'required', 'available_mock', 'Ultra Premium keeps strict do-not-copy safety required.', 'Ask for safer creative direction if copy risk is unclear.', true),
  route('copy_risk', 'required', 'available_mock', 'Ultra Premium applies strict copy-risk QA before studio treatment.', 'Use safer style language and require user review for copy-risk ambiguity.', true),
  route('source_video_present', 'required', 'storage_required', 'Ultra Premium requires a source package before studio QA can pass.', 'Ask the user to upload or select source footage.', true),
  route('source_metadata_ready', 'required', 'available_mock', 'Ultra Premium requires source metadata before studio-level planning.', 'Ask for missing setup metadata.'),
  route('export_settings_valid', 'required', 'available_mock', 'Ultra Premium requires valid target platform, frame, and export policy.', 'Ask the user to confirm output frame and platform.'),
  route('caption_safe_zone', 'required', 'available_mock', 'Ultra Premium requires strict caption safe-zone protection.', 'Use safer caption placement defaults.'),
  route('caption_readability', 'required', 'available_mock', 'Ultra Premium requires strict caption readability.', 'Simplify captions or adjust layout.'),
  route('audio_basic_sanity', 'required', 'available_mock', 'Ultra Premium requires clean speech and baseline audio sanity.', 'Use voice-first audio defaults.'),
  route('audio_music_ducking', 'required', 'worker_required', 'Ultra Premium requires future music ducking QA.', 'Degrade to Premium-safe audio policy until audio workers exist.', true),
  route('sfx_restraint', 'required', 'worker_required', 'Ultra Premium requires cue-based SFX restraint.', 'Degrade to Premium-safe SFX restraint until audio workers exist.', true),
  route('sound_design_coherence', 'required', 'worker_required', 'Ultra Premium requires future studio sound-design coherence.', 'Degrade to Premium-safe audio policy until sound workers exist.', true),
  route('marker_missing_asset', 'required', 'storage_required', 'Ultra Premium treats missing marker assets as blockers.', 'Ask the user to provide, replace, or remove the missing asset marker.', true),
  route('marker_needs_clarification', 'required', 'available_mock', 'Ultra Premium requires clarification for ambiguous high-priority markers.', 'Ask targeted clarification before studio treatment.'),
  route('marker_conflict', 'required', 'available_mock', 'Ultra Premium treats marker conflicts as blockers.', 'Resolve conflicting must-use, avoid, or priority markers.', true),
  route('marker_time_range_valid', 'required', 'available_mock', 'Ultra Premium requires valid marker time ranges.', 'Ask the user to correct invalid marker time ranges.'),
  route('edit_brief_priority_consistency', 'required', 'available_mock', 'Ultra Premium requires strict Edit Brief marker priority consistency.', 'Use explicit must-follow markers and ask for conflict review.', true),
  route('preference_dna_match', 'required', 'available_mock', 'Ultra Premium requires deep Preference DNA matching.', 'Degrade to Premium-safe style policy when DNA context is missing.', true),
  route('qwen_response_validation', 'required', 'runtime_disabled', 'Ultra Premium requires future Qwen response validation policy.', 'Degrade to deterministic Premium-safe validation while Qwen is disabled.', true),
  route('qwen25vl_visual_confidence', 'required', 'provider_required', 'Ultra Premium requires future Qwen2.5-VL visual confidence.', 'Degrade to Premium-safe visual context until Qwen2.5-VL exists.', true),
  route('transcript_coverage', 'required', 'worker_required', 'Ultra Premium requires transcript coverage when speech exists.', 'Degrade to Premium-safe transcript summary and ask for review.', true),
  route('source_context_coverage', 'required', 'worker_required', 'Ultra Premium requires scene-level source context coverage.', 'Degrade to Premium-safe key-moment source context until workers exist.', true),
  route('broll_timing', 'required', 'available_mock', 'Ultra Premium requires B-roll timing QA.', 'Use meaning-timed B-roll placement.'),
  route('pacing_consistency', 'required', 'available_mock', 'Ultra Premium requires strict pacing consistency.', 'Use studio pacing defaults and ask review for ambiguity.'),
  route('story_arc_quality', 'required', 'available_mock', 'Ultra Premium requires story arc quality review.', 'Use stronger narrative structure or ask for direction.'),
  route('style_consistency', 'required', 'available_mock', 'Ultra Premium requires strict style consistency.', 'Use consistent caption, color, graphic, pacing, and sound rules.'),
  route('graphic_layout_consistency', 'required', 'available_mock', 'Ultra Premium requires graphic/card/layout consistency.', 'Use text-safe graphic/card defaults and ask review for dense layouts.'),
  route('plan_completeness', 'required', 'available_mock', 'Ultra Premium requires strict studio plan completeness.', 'Use studio multi-layer plan hints and block if key sections are missing.', true),
  route('render_readiness_future', 'future_only', 'future_gated', 'Ultra Premium render readiness is future-gated and blocks final studio readiness.', 'Do not create a render job.', false, true),
  route('revision_budget_future', 'future_only', 'future_gated', 'Ultra Premium revision budget is future-gated and blocks final studio readiness.', 'Do not reserve revision budget.', false, true),
  route('credit_gate_future', 'future_only', 'future_gated', 'Ultra Premium credit gate is future-gated and blocks final studio readiness.', 'Do not reserve or spend credits.', false, true),
]
