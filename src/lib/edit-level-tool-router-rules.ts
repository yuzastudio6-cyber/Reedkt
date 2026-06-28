import type {
  EditLevelToolCapabilityDefinition,
  EditLevelToolCapabilityId,
  EditLevelToolCapabilityStatus,
  EditLevelToolRequiredness,
  EditLevelToolRoute,
  EditLevelToolRouterSideEffectFlags,
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../types'
import type { OpenSourceToolId } from '../types/reeditpro'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'
import { createEditLevelQAProfileDefinition } from './edit-level-profile-mappers'

export const EDIT_LEVEL_TOOL_CAPABILITY_DEFINITIONS: EditLevelToolCapabilityDefinition[] = [
  capability('qwen_3_reasoning', 'Qwen 3.7 reasoning', 'reasoning', 'Main reasoning brain for intent, planning, marker decisions, and QA explanation.', 'runtime_disabled', [], ['qwen_3_7_provider_boundary']),
  capability('qwen25vl_visual_understanding', 'Qwen2.5-VL visual understanding', 'visual_understanding', 'Visual/video understanding specialist for visible context, marker windows, text, layout, and scene summaries.', 'provider_required', [], ['qwen2_5_vl_7b_instruct_provider_boundary']),
  capability('speech_transcript', 'Speech transcript', 'transcript', 'Transcript and speech timing plan for speech-aware edits and captions.', 'worker_required', ['whisper_cpp'], ['faster_whisper', 'whisper_cpp']),
  capability('media_extraction', 'Media extraction', 'media_metadata', 'Metadata, duration, dimensions, keyframes, waveform, and future extraction planning.', 'worker_required', ['ffmpeg', 'sharp'], ['ffmpeg', 'ffprobe', 'pyav', 'pyscenedetect']),
  capability('audio_soundsync', 'Audio / SoundSync', 'audio', 'Voice cleanup, music, SFX, ducking, beat, energy, and SoundSync planning.', 'worker_required', ['audioflux', 'signalsmith_stretch'], ['audioflux', 'signalsmith_stretch', 'deepfilternet', 'rnnoise']),
  capability('graphic_design_understanding', 'Graphic/design understanding', 'graphics', 'Caption, card, layout, chart, map, and motion graphics direction.', 'available_mock', ['remotion', 'd3', 'echarts', 'sharp', 'playwright'], ['remotion', 'sharp', 'd3', 'echarts', 'playwright']),
  capability('preference_dna', 'Edit Preference DNA', 'preference', 'Style, brand, reference, and preference application by level.', 'available_mock', [], ['preference_dna_policy_boundary']),
  capability('edit_brief', 'Edit Brief', 'edit_brief', 'Structured creative direction and constraints for the future plan.', 'available_mock', [], ['edit_brief_policy_boundary']),
  capability('edit_brief_marker_chat', 'Edit Brief marker chat', 'edit_brief', 'Marker-level chat guidance and clarification planning.', 'available_mock', [], ['edit_brief_marker_chat_boundary']),
  capability('edit_brief_marker_qa', 'Edit Brief marker QA', 'edit_brief', 'Marker-level QA and conflict review planning.', 'available_mock', [], ['edit_brief_marker_qa_boundary']),
  capability('edit_brief_plan_hints', 'Edit Brief plan hints', 'edit_brief', 'Plan hints extracted from Edit Brief markers and preferences.', 'available_mock', [], ['edit_brief_plan_hint_boundary']),
  capability('source_video_playback', 'Source video playback', 'media_metadata', 'Source playback context for user-visible review and planning reference.', 'available_beta', ['remotion'], ['hyperframe', 'remotion']),
  capability('source_video_understanding_package', 'Source understanding package', 'visual_understanding', 'Future source package combining metadata, transcript, visual, audio, and marker context.', 'future_gated', ['ffmpeg', 'opencv', 'audioflux'], ['ffmpeg', 'ffprobe', 'faster_whisper', 'opencv', 'audioflux']),
  capability('media_asset_repository', 'Media asset repository', 'storage', 'Mock/local media asset references and future persisted asset catalog.', 'available_mock', [], ['media_asset_repository_boundary']),
  capability('storage_runtime', 'Storage runtime', 'storage', 'Future private storage runtime for source/proxy/generated/render artifacts.', 'storage_required', [], ['supabase_storage_or_gcs_runtime_boundary']),
  capability('deepseek_tool_code', 'DeepSeek V4 Pro tool-code', 'coding', 'Future coding/tool-code/Remotion draft agent only; not user reasoning.', 'future_gated', [], ['deepseek_v4_pro_tool_code_boundary']),
  capability('render_worker', 'Render worker', 'render', 'Future Remotion/render/export worker path after approval and required assets.', 'future_gated', ['remotion', 'ffmpeg'], ['remotion', 'ffmpeg', 'libass', 'opentimelineio']),
  capability('credit_gate', 'Credit gate', 'credits', 'Estimate-only planning now; future reservation/spend gates after approval.', 'future_gated', [], ['credit_gate_runtime_boundary']),
]

export function createEditLevelToolRouterSideEffectFlags(): EditLevelToolRouterSideEffectFlags {
  return {
    mockOnly: true,
    providerCallMade: false,
    qwen3CallMade: false,
    qwen25vlCallMade: false,
    deepSeekCallMade: false,
    mediaProcessingStarted: false,
    transcriptStarted: false,
    workerJobCreated: false,
    renderJobCreated: false,
    progressStarted: false,
    creditReservedOrSpent: false,
    supabaseReadMade: false,
    supabaseWriteMade: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    toolExecutionStarted: false,
  }
}

export function listEditLevelToolCapabilityDefinitions(): EditLevelToolCapabilityDefinition[] {
  return [...EDIT_LEVEL_TOOL_CAPABILITY_DEFINITIONS]
}

export function getEditLevelToolCapabilityDefinition(
  capabilityId: EditLevelToolCapabilityId,
): EditLevelToolCapabilityDefinition {
  const definition = EDIT_LEVEL_TOOL_CAPABILITY_DEFINITIONS.find((item) => item.capabilityId === capabilityId)

  if (!definition) {
    throw new Error(`Missing Edit Level tool capability definition: ${capabilityId}`)
  }

  return definition
}

export function createEditLevelToolRoute(input: {
  level: ReEditProCanonicalEditLevel
  capabilityId: EditLevelToolCapabilityId
  requiredness: EditLevelToolRequiredness
  status?: EditLevelToolCapabilityStatus
  reason: string
  fallback: string
  userFacingSummary: string
  technicalNotes?: string[]
}): EditLevelToolRoute {
  const definition = getEditLevelToolCapabilityDefinition(input.capabilityId)
  const sideEffectFlags = createEditLevelToolRouterSideEffectFlags()

  return {
    level: input.level,
    capabilityId: input.capabilityId,
    displayName: definition.displayName,
    category: definition.category,
    requiredness: input.requiredness,
    status: input.status ?? definition.defaultStatus,
    reason: input.reason,
    fallback: input.fallback,
    userFacingSummary: input.userFacingSummary,
    technicalNotes: [
      ...(input.technicalNotes ?? []),
      'RP-EDITLEVEL-05 resolves routing metadata only.',
    ],
    browserSafeToolIds: definition.browserSafeToolIds,
    productionToolIds: definition.productionToolIds,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createNormalEditLevelToolRoutes(): EditLevelToolRoute[] {
  const level = 'normal'

  return [
    route(level, 'qwen_3_reasoning', 'required', 'runtime_disabled', 'Normal uses a standard Qwen 3.7 reasoning profile for clean professional planning.', 'Use deterministic reasoning fallback and show that Qwen 3.7 did not run.', 'Standard reasoning plan; no Qwen call is made.'),
    route(level, 'qwen25vl_visual_understanding', 'optional', 'provider_required', 'Normal uses targeted visual clarification only when ambiguity or a marker needs it.', 'Use visible-context fallback or ask a concise clarification.', 'Targeted visual understanding only when useful.'),
    route(level, 'speech_transcript', 'optional', 'worker_required', 'Transcript is optional or targeted for Normal when speech meaning changes the edit.', 'Use source summary and ask the user when speech meaning is unclear.', 'Transcript-aware planning is optional.'),
    route(level, 'media_extraction', 'optional', 'worker_required', 'Normal only needs basic duration, dimensions, aspect ratio, and metadata planning.', 'Use existing source metadata and avoid claiming extraction ran.', 'Basic metadata only; worker extraction is future-gated.'),
    route(level, 'audio_soundsync', 'optional', 'worker_required', 'Normal keeps audio policy basic and voice-first.', 'Use simple audio policy fallback without beat or waveform claims.', 'Basic audio guidance.'),
    route(level, 'graphic_design_understanding', 'optional', 'available_mock', 'Normal uses basic caption/text safety and clean professional layout guidance.', 'Use simple captions and text-safe layout fallback.', 'Basic captions and clean text treatment.'),
    route(level, 'preference_dna', 'optional', 'available_mock', 'Normal applies safe style hints without deep DNA expansion.', 'Use generic professional style defaults.', 'Safe style hints.'),
    route(level, 'edit_brief', 'optional', 'available_mock', 'Edit Brief is optional for Normal.', 'Continue with setup answers and user instructions.', 'Edit Brief optional.'),
    route(level, 'edit_brief_marker_chat', 'optional', 'available_mock', 'Marker chat can clarify a Normal edit when the user supplies markers.', 'Use general instruction summary if markers are absent.', 'Marker chat optional.'),
    route(level, 'edit_brief_marker_qa', 'optional', 'available_mock', 'Marker QA stays baseline for Normal.', 'Use baseline QA when markers are absent.', 'Baseline marker QA.'),
    route(level, 'edit_brief_plan_hints', 'optional', 'available_mock', 'Normal uses light plan hints from an Edit Brief when present.', 'Use concise planning defaults.', 'Light plan hints.'),
    route(level, 'source_video_playback', 'recommended', 'available_beta', 'Source playback helps verify order and context without processing media.', 'Use uploaded order and user review state.', 'Source playback recommended.'),
    route(level, 'source_video_understanding_package', 'future_only', 'future_gated', 'A full source understanding package is beyond Normal mock routing.', 'Use basic source summary and targeted clarification.', 'Full source package future-gated.'),
    route(level, 'media_asset_repository', 'optional', 'available_mock', 'Mock/local records can reference source and planned assets.', 'Keep local references only.', 'Mock asset repository only.'),
    route(level, 'storage_runtime', 'future_only', 'storage_required', 'Private storage runtime is future backend infrastructure.', 'Stay local/mock and do not read file bytes.', 'Storage runtime future-gated.'),
    route(level, 'deepseek_tool_code', 'future_only', 'future_gated', 'DeepSeek is not used for user reasoning and is unnecessary for Normal tool-code planning now.', 'Use deterministic summaries and existing Remotion planning notes.', 'DeepSeek not used for user reasoning.'),
    route(level, 'render_worker', 'future_only', 'future_gated', 'Render workers remain future-gated for all levels.', 'Stay in plan-only mode.', 'Render worker future-gated.'),
    route(level, 'credit_gate', 'future_only', 'future_gated', 'Normal uses credit estimate-only metadata in this milestone.', 'Show estimate-only copy and reserve no credits.', 'Credit gate estimate only.'),
  ]
}

export function createPremiumEditLevelToolRoutes(): EditLevelToolRoute[] {
  const level = 'premium'

  return [
    route(level, 'qwen_3_reasoning', 'required', 'runtime_disabled', 'Premium uses deeper Qwen 3.7 reasoning for story, style, marker, and source-summary decisions.', 'Use deterministic deep-planning fallback and show that Qwen 3.7 did not run.', 'Deep reasoning profile; no Qwen call is made.'),
    route(level, 'qwen25vl_visual_understanding', 'recommended', 'provider_required', 'Premium routes visual understanding for key moments and marker windows.', 'Use lower visual depth and source-summary fallback when Qwen2.5-VL is unavailable.', 'Key moments and marker windows.'),
    route(level, 'speech_transcript', 'recommended', 'worker_required', 'Premium recommends transcript-aware planning when speech exists.', 'Use source summary and ask for clarification when speech meaning matters.', 'Transcript recommended when speech exists.'),
    route(level, 'media_extraction', 'recommended', 'worker_required', 'Premium plans metadata plus key moments and keyframes.', 'Use available metadata and mark keyframe extraction as future-gated.', 'Metadata plus keyframe plan.'),
    route(level, 'audio_soundsync', 'recommended', 'worker_required', 'Premium plans music, SFX, ducking, and SoundSync recommendations.', 'Use basic audio policy fallback and do not claim analysis ran.', 'Music/SFX/ducking guidance.'),
    route(level, 'graphic_design_understanding', 'recommended', 'available_mock', 'Premium adds styled captions, cards, and controlled graphic direction.', 'Use clean captions/cards when advanced graphics are unavailable.', 'Styled captions and cards.'),
    route(level, 'preference_dna', 'recommended', 'available_mock', 'Premium strongly applies Edit Preference DNA to style and polish.', 'Use safe style hints when DNA is missing.', 'Strong Preference DNA application.'),
    route(level, 'edit_brief', 'recommended', 'available_mock', 'Edit Brief is recommended for Premium control.', 'Continue with setup answers if the brief is absent.', 'Edit Brief recommended.'),
    route(level, 'edit_brief_marker_chat', 'recommended', 'available_mock', 'Premium uses marker chat to prioritize important beats and style notes.', 'Use user instruction summary when markers are absent.', 'Marker chat recommended.'),
    route(level, 'edit_brief_marker_qa', 'recommended', 'available_mock', 'Premium marker QA checks conflicts and source-truth risks.', 'Use premium QA summary without marker-specific claims.', 'Marker QA recommended.'),
    route(level, 'edit_brief_plan_hints', 'recommended', 'available_mock', 'Premium converts marker and brief details into stronger plan hints.', 'Use general premium planning hints.', 'Plan hints recommended.'),
    route(level, 'source_video_playback', 'recommended', 'available_beta', 'Source playback supports user review and marker-window planning.', 'Use uploaded order and source-summary context.', 'Source playback recommended.'),
    route(level, 'source_video_understanding_package', 'recommended', 'future_gated', 'Premium expects a source understanding package when future workers are available.', 'Use source summary with targeted clarification.', 'Source package future-gated.'),
    route(level, 'media_asset_repository', 'recommended', 'available_mock', 'Premium benefits from a mock asset repository for planned cards, screenshots, and source references.', 'Keep local references only.', 'Mock asset repository recommended.'),
    route(level, 'storage_runtime', 'future_only', 'storage_required', 'Private storage runtime is future backend infrastructure.', 'Stay local/mock and do not read file bytes.', 'Storage runtime future-gated.'),
    route(level, 'deepseek_tool_code', 'future_only', 'future_gated', 'DeepSeek remains coding/tool-code/Remotion draft only, not user reasoning.', 'Use deterministic tool-code notes instead.', 'DeepSeek future tool-code only.'),
    route(level, 'render_worker', 'future_only', 'future_gated', 'Render workers remain future-gated for Premium.', 'Stay in plan-only mode.', 'Render worker future-gated.'),
    route(level, 'credit_gate', 'future_only', 'future_gated', 'Premium uses estimate-only credit policy in this milestone.', 'Show estimate-only copy and reserve no credits.', 'Credit gate estimate only.'),
  ]
}

export function createUltraPremiumEditLevelToolRoutes(): EditLevelToolRoute[] {
  const level = 'ultra_premium'

  return [
    route(level, 'qwen_3_reasoning', 'required', 'runtime_disabled', 'Ultra Premium uses a multi-pass Qwen 3.7 reasoning profile for studio-level direction and QA explanation.', 'Use deterministic multi-pass-style fallback and show that Qwen 3.7 did not run.', 'Multi-pass reasoning profile; no Qwen call is made.'),
    route(level, 'qwen25vl_visual_understanding', 'required', 'provider_required', 'Ultra Premium routes scene-level/deep visual analysis when future model access exists.', 'Use Premium-safe visual fallback and show degraded capability notice.', 'Scene-level visual understanding.'),
    route(level, 'speech_transcript', 'required', 'worker_required', 'Ultra Premium requires transcript-aware planning when speech exists.', 'Use source summary and require clarification when speech meaning is unclear.', 'Transcript required when speech exists.'),
    route(level, 'media_extraction', 'recommended', 'worker_required', 'Ultra Premium plans deeper keyframe and waveform extraction for future workers.', 'Use available metadata and show that extraction is future-gated.', 'Deeper keyframe/waveform plan.'),
    route(level, 'audio_soundsync', 'recommended', 'worker_required', 'Ultra Premium plans sound design, audio continuity, ducking, and SFX direction.', 'Use Premium audio fallback without claiming SoundSync analysis ran.', 'Sound design planning.'),
    route(level, 'graphic_design_understanding', 'recommended', 'available_mock', 'Ultra Premium adds motion graphics, layout direction, card polish, and visual consistency guidance.', 'Use styled caption/card fallback when advanced motion graphics are unavailable.', 'Motion graphics and layout direction.'),
    route(level, 'preference_dna', 'recommended', 'available_mock', 'Ultra Premium deeply applies Preference DNA and style consistency checks.', 'Use Premium-safe DNA fallback when preference data is missing.', 'Deep Preference DNA application.'),
    route(level, 'edit_brief', 'recommended', 'available_mock', 'Edit Brief is strongly recommended for Ultra Premium direction.', 'Continue with setup answers but show that strongest control comes from a brief.', 'Edit Brief strongly recommended.'),
    route(level, 'edit_brief_marker_chat', 'recommended', 'available_mock', 'Ultra Premium uses marker chat for precise creative and source-truth decisions.', 'Use project-level instruction summary when markers are absent.', 'Marker chat strongly recommended.'),
    route(level, 'edit_brief_marker_qa', 'recommended', 'available_mock', 'Ultra Premium marker QA is strict and checks conflicts, completeness, and source truth.', 'Use strict QA summary without marker-specific claims.', 'Strict marker QA.'),
    route(level, 'edit_brief_plan_hints', 'recommended', 'available_mock', 'Ultra Premium converts markers into studio-level plan hints and revision guidance.', 'Use high-level studio planning defaults.', 'Studio plan hints.'),
    route(level, 'source_video_playback', 'recommended', 'available_beta', 'Source playback supports scene-level review and source-truth confidence.', 'Use uploaded order and visible user review context.', 'Source playback recommended.'),
    route(level, 'source_video_understanding_package', 'recommended', 'future_gated', 'Ultra Premium expects the deepest source understanding package when future workers are available.', 'Use Premium-safe source package fallback.', 'Deep source package future-gated.'),
    route(level, 'media_asset_repository', 'recommended', 'available_mock', 'Ultra Premium benefits from richer asset and planned visual references.', 'Keep local/mock records only.', 'Mock asset repository recommended.'),
    route(level, 'storage_runtime', 'future_only', 'storage_required', 'Private storage runtime is future backend infrastructure.', 'Stay local/mock and do not read file bytes.', 'Storage runtime future-gated.'),
    route(level, 'deepseek_tool_code', 'future_only', 'future_gated', 'DeepSeek is future Remotion/tool-code support only and must not reason with users.', 'Use deterministic tool-code notes instead.', 'DeepSeek future Remotion/tool-code only, not user reasoning.'),
    route(level, 'render_worker', 'future_only', 'future_gated', 'Ultra Premium render/export budget is highest future metadata only.', 'Stay in plan-only mode.', 'Render worker future-gated.'),
    route(level, 'credit_gate', 'future_only', 'future_gated', 'Ultra Premium uses estimate-only credit policy in this milestone.', 'Show estimate-only copy and reserve no credits.', 'Credit gate estimate only.'),
  ]
}

export function createEditLevelToolRoutingPackage(
  level: ReEditProCanonicalEditLevel,
): EditLevelToolRoutingPackage {
  const routes = routesForLevel(level)
  const displayName = mapCanonicalEditLevelToPublicLabel(level)
  const qaProfile = createEditLevelQAProfileDefinition(level).qaProfile
  const sideEffectFlags = createEditLevelToolRouterSideEffectFlags()

  return {
    level,
    selectedLevel: level,
    displayName,
    toolDepth: level === 'normal' ? 'normal_clean' : level === 'premium' ? 'premium_enhanced' : 'ultra_studio',
    qaProfile,
    routes,
    requiredCapabilities: idsByRequiredness(routes, 'required'),
    recommendedCapabilities: idsByRequiredness(routes, 'recommended'),
    optionalCapabilities: idsByRequiredness(routes, 'optional'),
    futureOnlyCapabilities: idsByRequiredness(routes, 'future_only'),
    blockedCapabilities: routes
      .filter((item) => ['runtime_disabled', 'provider_required', 'worker_required', 'storage_required', 'future_gated'].includes(item.status))
      .map((item) => item.capabilityId),
    degradedCapabilities: routes
      .filter((item) => item.status !== 'available_mock' && item.status !== 'available_beta' && item.status !== 'not_required')
      .map((item) => item.capabilityId),
    fallbacks: routes
      .filter((item) => item.fallback)
      .map((item) => `${item.displayName}: ${item.fallback}`),
    userFacingSummary: userFacingSummaryForLevel(level),
    technicalSummary: technicalSummaryForLevel(level, routes),
    warnings: [
      'Mock/local routing package only.',
      'No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, worker, media, render, progress, Supabase, or credit operation is executed.',
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createEditLevelToolRouterBoundarySummary(): string[] {
  return [
    'Tool capabilities shown here are planning routes, not execution.',
    'Available now means mock/local or beta UI context only.',
    'Future-gated capabilities need later backend, storage, worker, provider, render, or credit milestones.',
    'Selecting a level does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, ffmpeg, Whisper, SoundSync, render, or credits.',
  ]
}

function capability(
  capabilityId: EditLevelToolCapabilityId,
  displayName: string,
  category: EditLevelToolCapabilityDefinition['category'],
  description: string,
  defaultStatus: EditLevelToolCapabilityStatus,
  browserSafeToolIds: OpenSourceToolId[],
  productionToolIds: string[],
): EditLevelToolCapabilityDefinition {
  return {
    capabilityId,
    displayName,
    category,
    description,
    defaultStatus,
    browserSafeToolIds,
    productionToolIds,
    mockOnly: true,
  }
}

function route(
  level: ReEditProCanonicalEditLevel,
  capabilityId: EditLevelToolCapabilityId,
  requiredness: EditLevelToolRequiredness,
  status: EditLevelToolCapabilityStatus,
  reason: string,
  fallback: string,
  userFacingSummary: string,
): EditLevelToolRoute {
  return createEditLevelToolRoute({
    level,
    capabilityId,
    requiredness,
    status,
    reason,
    fallback,
    userFacingSummary,
    technicalNotes: [
      `requiredness=${requiredness}`,
      `status=${status}`,
    ],
  })
}

function routesForLevel(level: ReEditProCanonicalEditLevel): EditLevelToolRoute[] {
  if (level === 'normal') return createNormalEditLevelToolRoutes()
  if (level === 'premium') return createPremiumEditLevelToolRoutes()
  return createUltraPremiumEditLevelToolRoutes()
}

function idsByRequiredness(
  routes: EditLevelToolRoute[],
  requiredness: EditLevelToolRequiredness,
): EditLevelToolCapabilityId[] {
  return routes
    .filter((item) => item.requiredness === requiredness)
    .map((item) => item.capabilityId)
}

function userFacingSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') {
    return 'Normal uses standard reasoning, targeted visual clarification, optional transcript/audio support, basic caption/design guidance, baseline QA, and estimate-only future render/credit gates.'
  }

  if (level === 'premium') {
    return 'Premium uses deeper reasoning, key visual moments, transcript-aware planning when speech exists, styled captions/cards, music/SFX guidance, premium QA, and future-gated render/credit routes.'
  }

  return 'Ultra Premium uses multi-pass reasoning, scene-level visual policy, transcript-required-when-speech planning, sound design direction, motion graphics guidance, strict QA, and highest future-gated render/credit routes.'
}

function technicalSummaryForLevel(
  level: ReEditProCanonicalEditLevel,
  routes: EditLevelToolRoute[],
): string {
  const statusCounts = routes.reduce<Record<string, number>>((counts, routeItem) => ({
    ...counts,
    [routeItem.status]: (counts[routeItem.status] ?? 0) + 1,
  }), {})

  return `${mapCanonicalEditLevelToPublicLabel(level)} routes ${routes.length} capabilities with statuses ${Object.entries(statusCounts)
    .map(([status, count]) => `${status}:${count}`)
    .join(', ')}; all side-effect flags remain false.`
}
