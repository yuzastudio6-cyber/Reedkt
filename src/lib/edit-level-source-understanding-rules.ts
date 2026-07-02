import type {
  EditLevelMarkerContextPolicy,
  EditLevelQwenContextPolicy,
  EditLevelSourceLayerRequiredness,
  EditLevelSourceLayerStatus,
  EditLevelSourceUnderstandingDepth,
  EditLevelSourceUnderstandingLayerDefinition,
  EditLevelSourceUnderstandingLayerId,
  EditLevelSourceUnderstandingLayerRoute,
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingSideEffectFlags,
  ReEditProCanonicalEditLevel,
} from '../types'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'

export const EDIT_LEVEL_SOURCE_UNDERSTANDING_LAYER_DEFINITIONS: EditLevelSourceUnderstandingLayerDefinition[] = [
  layer('source_metadata', 'Source metadata', 'browser/mock project metadata', 'Duration, dimensions, aspect ratio, audio presence, and export-fit metadata.', 'available_mock'),
  layer('browser_local_playback', 'Browser local playback', 'browser preview surface', 'User-visible playback context for source order, source truth, and marker review.', 'available_beta'),
  layer('media_extraction_metadata', 'Media extraction metadata', 'future media extraction worker', 'Future ffprobe/metadata extraction plan for richer technical source facts.', 'worker_required'),
  layer('keyframe_sampling_plan', 'Keyframe sampling plan', 'future keyframe sampler', 'Future keyframe/sample plan for visible moments and marker windows.', 'future_gated'),
  layer('speech_transcript', 'Speech transcript', 'future transcript worker', 'Transcript and speech timing context for meaning-safe planning.', 'worker_required'),
  layer('qwen25vl_visual_segments', 'Qwen2.5-VL visual segments', 'future Qwen2.5-VL visual route', 'Visual/video specialist context for key moments, scenes, visible text, objects, and layout.', 'provider_required'),
  layer('qwen25vl_marker_windows', 'Qwen2.5-VL marker windows', 'future Qwen2.5-VL marker route', 'Visual context around Edit Brief markers and user timestamp questions.', 'provider_required'),
  layer('audio_soundsync_segments', 'Audio / SoundSync segments', 'future SoundSync/audio worker', 'Voice, music, SFX, ambience, ducking, timing, and sound-design context.', 'worker_required'),
  layer('graphic_text_segments', 'Graphic/text segments', 'mock graphic/text policy', 'Visible text, caption safety, card, layout, and graphic direction observations.', 'available_mock'),
  layer('preference_dna_context', 'Preference DNA context', 'mock Edit Preference/DNA policy', 'Style, brand, reference, and preference context for source-aware planning.', 'available_mock'),
  layer('edit_brief_marker_context', 'Edit Brief marker context', 'mock Edit Brief marker policy', 'Creative direction, constraints, and marker instructions supplied by the user.', 'available_mock'),
  layer('marker_context_package', 'Marker Context Package', 'mock marker context policy', 'Time-windowed source context around an Edit Brief marker.', 'available_mock'),
  layer('source_video_understanding_package', 'Source Video Understanding Package', 'future source-understanding worker package', 'Combined source metadata, transcript, visual, audio, graphic/text, marker, QA, and plan-hint context.', 'future_gated'),
  layer('qwen3_reasoning_context', 'Qwen 3.7 reasoning context', 'future Qwen 3.7 prompt context', 'Future prompt-context package for the main reasoning brain.', 'runtime_disabled'),
]

export function createEditLevelSourceUnderstandingSideEffectFlags(): EditLevelSourceUnderstandingSideEffectFlags {
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
    sourceUnderstandingToolExecuted: false,
  }
}

export function listEditLevelSourceUnderstandingLayerDefinitions(): EditLevelSourceUnderstandingLayerDefinition[] {
  return [...EDIT_LEVEL_SOURCE_UNDERSTANDING_LAYER_DEFINITIONS]
}

export function getEditLevelSourceUnderstandingLayerDefinition(
  layerId: EditLevelSourceUnderstandingLayerId,
): EditLevelSourceUnderstandingLayerDefinition {
  const definition = EDIT_LEVEL_SOURCE_UNDERSTANDING_LAYER_DEFINITIONS.find((item) => item.layerId === layerId)

  if (!definition) {
    throw new Error(`Missing Edit Level source understanding layer definition: ${layerId}`)
  }

  return definition
}

export function createEditLevelSourceUnderstandingLayerRoute(input: {
  level: ReEditProCanonicalEditLevel
  layerId: EditLevelSourceUnderstandingLayerId
  requiredness: EditLevelSourceLayerRequiredness
  status?: EditLevelSourceLayerStatus
  purpose: string
  fallback: string
  userFacingSummary: string
  technicalNotes?: string[]
}): EditLevelSourceUnderstandingLayerRoute {
  const definition = getEditLevelSourceUnderstandingLayerDefinition(input.layerId)
  const sideEffectFlags = createEditLevelSourceUnderstandingSideEffectFlags()

  return {
    level: input.level,
    layerId: input.layerId,
    displayName: definition.displayName,
    requiredness: input.requiredness,
    status: input.status ?? definition.defaultStatus,
    sourceTool: definition.sourceTool,
    purpose: input.purpose,
    fallback: input.fallback,
    userFacingSummary: input.userFacingSummary,
    technicalNotes: [
      ...(input.technicalNotes ?? []),
      'RP-EDITLEVEL-06 resolves source-understanding policy only.',
      'No source-understanding tool, media analysis, model, worker, render, or credit operation runs.',
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createNormalSourceUnderstandingPolicyPackage(): EditLevelSourceUnderstandingPolicyPackage {
  return createPackage('normal', createNormalSourceUnderstandingRoutes())
}

export function createPremiumSourceUnderstandingPolicyPackage(): EditLevelSourceUnderstandingPolicyPackage {
  return createPackage('premium', createPremiumSourceUnderstandingRoutes())
}

export function createUltraPremiumSourceUnderstandingPolicyPackage(): EditLevelSourceUnderstandingPolicyPackage {
  return createPackage('ultra_premium', createUltraPremiumSourceUnderstandingRoutes())
}

export function createEditLevelSourceUnderstandingPolicyPackage(
  level: ReEditProCanonicalEditLevel,
): EditLevelSourceUnderstandingPolicyPackage {
  if (level === 'normal') return createNormalSourceUnderstandingPolicyPackage()
  if (level === 'premium') return createPremiumSourceUnderstandingPolicyPackage()
  return createUltraPremiumSourceUnderstandingPolicyPackage()
}

export function createEditLevelMarkerContextPolicy(
  level: ReEditProCanonicalEditLevel,
): EditLevelMarkerContextPolicy {
  if (level === 'normal') {
    return {
      level,
      windowBeforeSeconds: 5,
      windowAfterSeconds: 5,
      includeTranscript: 'if_available',
      includeVisualContext: 'targeted',
      includeAudioContext: 'targeted',
      includeGraphicTextContext: 'basic',
      includeNearbyMarkers: true,
      includePreferenceDNA: false,
      includeQAWarnings: false,
      includeMarkerConflicts: false,
      includePlanHintHistory: false,
      userFacingSummary: 'Normal uses a 5s marker window with nearby markers and targeted context only when needed.',
      mockOnly: true,
    }
  }

  if (level === 'premium') {
    return {
      level,
      windowBeforeSeconds: 10,
      windowAfterSeconds: 10,
      includeTranscript: 'when_speech_exists',
      includeVisualContext: 'marker_window',
      includeAudioContext: 'if_available',
      includeGraphicTextContext: 'if_relevant',
      includeNearbyMarkers: true,
      includePreferenceDNA: true,
      includeQAWarnings: true,
      includeMarkerConflicts: false,
      includePlanHintHistory: false,
      userFacingSummary: 'Premium uses a 10s marker window with transcript, visual, audio, Preference DNA, nearby markers, and QA warnings when available.',
      mockOnly: true,
    }
  }

  return {
    level,
    windowBeforeSeconds: 15,
    windowAfterSeconds: 15,
    includeTranscript: 'required_when_speech',
    includeVisualContext: 'scene_level',
    includeAudioContext: 'sound_design',
    includeGraphicTextContext: 'scene_level',
    includeNearbyMarkers: true,
    includePreferenceDNA: true,
    includeQAWarnings: true,
    includeMarkerConflicts: true,
    includePlanHintHistory: true,
    userFacingSummary: 'Ultra Premium uses a 15s marker window with scene-level source context, Preference DNA, QA guardrails, conflicts, and plan-hint history.',
    mockOnly: true,
  }
}

export function createEditLevelQwenContextPolicy(
  level: ReEditProCanonicalEditLevel,
): EditLevelQwenContextPolicy {
  if (level === 'normal') {
    return {
      level,
      qwenContextDepth: 'compact',
      includeSourceSummary: true,
      includeTranscriptWindow: false,
      includeVisualSummary: false,
      includeAudioSummary: false,
      includeGraphicTextSummary: false,
      includePreferenceDNA: false,
      includeQAWarnings: false,
      includePlanHistory: false,
      maxContextWindowSeconds: 10,
      userFacingSummary: 'Future Qwen 3.7 context stays compact: source summary, marker note, export settings, and targeted context only.',
      mockOnly: true,
    }
  }

  if (level === 'premium') {
    return {
      level,
      qwenContextDepth: 'enhanced',
      includeSourceSummary: true,
      includeTranscriptWindow: true,
      includeVisualSummary: true,
      includeAudioSummary: true,
      includeGraphicTextSummary: true,
      includePreferenceDNA: true,
      includeQAWarnings: true,
      includePlanHistory: false,
      maxContextWindowSeconds: 20,
      userFacingSummary: 'Future Qwen 3.7 context includes source summary, transcript/visual/audio key moments, marker context, Preference DNA, and QA warnings.',
      mockOnly: true,
    }
  }

  return {
    level,
    qwenContextDepth: 'studio',
    includeSourceSummary: true,
    includeTranscriptWindow: true,
    includeVisualSummary: true,
    includeAudioSummary: true,
    includeGraphicTextSummary: true,
    includePreferenceDNA: true,
    includeQAWarnings: true,
    includePlanHistory: true,
    maxContextWindowSeconds: 30,
    userFacingSummary: 'Future Qwen 3.7 context uses scene-level source understanding, transcript, visual, audio, graphic context, Preference DNA, strict QA warnings, and planning priority policy.',
    mockOnly: true,
  }
}

export function createEditLevelSourceUnderstandingBoundarySummary(): string[] {
  return [
    'Source understanding routing only; no tools execute.',
    'No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, transcript, media extraction, audio, graphic, worker, render, progress, Supabase, file-byte, external-fetch, or credit operation runs.',
    'No unavailable tool is claimed to have run; fallbacks and degraded notices are explicit.',
  ]
}

function createNormalSourceUnderstandingRoutes(): EditLevelSourceUnderstandingLayerRoute[] {
  const level = 'normal'

  return [
    route(level, 'source_metadata', 'required', 'available_mock', 'Normal needs duration, dimensions, aspect ratio, audio presence, and export-fit metadata.', 'Use project/setup metadata and user confirmation.', 'Metadata and export fit are required.'),
    route(level, 'browser_local_playback', 'recommended', 'available_beta', 'Playback helps users confirm source order and source truth without analysis.', 'Use uploaded order and user review state.', 'Browser playback is recommended.'),
    route(level, 'media_extraction_metadata', 'future_only', 'worker_required', 'Worker extraction is not needed for Normal unless future runtime asks for it.', 'Use browser/project metadata only.', 'Media extraction is future-gated.'),
    route(level, 'keyframe_sampling_plan', 'targeted', 'future_gated', 'Normal requests keyframe samples only when a marker or ambiguity needs visual clarification.', 'Ask a concise clarification or use visible metadata.', 'Targeted keyframe plan only when needed.'),
    route(level, 'speech_transcript', 'targeted', 'worker_required', 'Normal requests transcript only when speech clarity or meaning changes the edit.', 'Use user instructions and source summary; ask when speech meaning is unclear.', 'Targeted transcript only when needed.'),
    route(level, 'qwen25vl_visual_segments', 'targeted', 'provider_required', 'Normal requests Qwen2.5-VL visual context only when a marker or user ambiguity requires it.', 'Use visible-context fallback or ask for clarification.', 'Targeted visual context only when needed.'),
    route(level, 'qwen25vl_marker_windows', 'targeted', 'provider_required', 'Normal uses marker-window visual context only for visual questions or vague requests.', 'Use marker note and source summary without claiming visual analysis ran.', 'Targeted marker windows.'),
    route(level, 'audio_soundsync_segments', 'targeted', 'worker_required', 'Normal keeps audio policy basic and voice-first.', 'Use basic audio cleanup and timing assumptions.', 'Basic audio policy only.'),
    route(level, 'graphic_text_segments', 'targeted', 'available_mock', 'Normal checks basic visible text and caption safety only.', 'Use clean text-safe layout defaults.', 'Basic visible text and caption safety.'),
    route(level, 'preference_dna_context', 'optional', 'available_mock', 'Normal applies safe preference hints when present.', 'Use clean professional defaults.', 'Preference DNA optional.'),
    route(level, 'edit_brief_marker_context', 'optional', 'available_mock', 'Edit Brief markers are optional for Normal.', 'Use setup answers and direct instructions.', 'Edit Brief optional.'),
    route(level, 'marker_context_package', 'optional', 'available_mock', 'Normal can summarize nearby marker context without requiring a full package.', 'Use marker note and nearby markers only.', 'Marker package optional.'),
    route(level, 'source_video_understanding_package', 'future_only', 'future_gated', 'Normal does not require a source understanding package before plan hints.', 'Use clean metadata and targeted clarification.', 'Full source package not required.'),
    route(level, 'qwen3_reasoning_context', 'required', 'runtime_disabled', 'Normal future Qwen context stays compact and targeted.', 'Use deterministic compact summary; no Qwen call.', 'Compact future Qwen context.'),
  ]
}

function createPremiumSourceUnderstandingRoutes(): EditLevelSourceUnderstandingLayerRoute[] {
  const level = 'premium'

  return [
    route(level, 'source_metadata', 'required', 'available_mock', 'Premium needs duration, dimensions, aspect ratio, audio presence, and export-fit metadata.', 'Use project/setup metadata and user confirmation.', 'Metadata and export fit are required.'),
    route(level, 'browser_local_playback', 'recommended', 'available_beta', 'Playback supports marker-window review and source-truth confidence.', 'Use uploaded order and user review state.', 'Browser playback recommended.'),
    route(level, 'media_extraction_metadata', 'recommended', 'worker_required', 'Premium recommends richer metadata for key moments and future worker planning.', 'Use available metadata and mark extraction unavailable.', 'Richer metadata recommended.'),
    route(level, 'keyframe_sampling_plan', 'recommended', 'future_gated', 'Premium recommends keyframe/key-moment planning for visual beats and marker windows.', 'Use key-moment mock fallback.', 'Key moments and marker windows.'),
    route(level, 'speech_transcript', 'recommended', 'worker_required', 'Premium recommends a timecoded transcript when speech exists.', 'Use source summary and ask for clarification when speech meaning matters.', 'Transcript-aware planning when speech exists.'),
    route(level, 'qwen25vl_visual_segments', 'recommended', 'provider_required', 'Premium routes Qwen2.5-VL key visual moments where available.', 'Use key-moment mock fallback and clarify visual ambiguity.', 'Key visual moments recommended.'),
    route(level, 'qwen25vl_marker_windows', 'recommended', 'provider_required', 'Premium routes Qwen2.5-VL visual summaries around marker windows.', 'Use marker note, source summary, and mock key moments.', 'Marker window visual context recommended.'),
    route(level, 'audio_soundsync_segments', 'recommended', 'worker_required', 'Premium recommends audio, music, SFX, ambience, and ducking guidance where available.', 'Use basic audio fallback and do not claim SoundSync analysis ran.', 'Audio/music/SFX guidance recommended.'),
    route(level, 'graphic_text_segments', 'recommended', 'available_mock', 'Premium observes graphic/text/card/caption opportunities where relevant.', 'Use styled caption/card fallback.', 'Graphic and text observations recommended.'),
    route(level, 'preference_dna_context', 'recommended', 'available_mock', 'Premium includes Edit Preference/DNA summary for style-aware marker and plan hints.', 'Use safe style hints when Preference DNA is missing.', 'Preference DNA recommended.'),
    route(level, 'edit_brief_marker_context', 'recommended', 'available_mock', 'Edit Brief markers are recommended for Premium creative control.', 'Use setup answers when no brief exists.', 'Edit Brief recommended.'),
    route(level, 'marker_context_package', 'recommended', 'available_mock', 'Premium recommends context-aware Marker Chat and marker package summaries.', 'Use marker notes and QA warnings when available.', 'Marker Context Package recommended.'),
    route(level, 'source_video_understanding_package', 'recommended', 'future_gated', 'Premium recommends a source understanding package to inform QA and plan hints.', 'Use key-moment mock fallback and clarify when needed.', 'Source understanding package recommended.'),
    route(level, 'qwen3_reasoning_context', 'required', 'runtime_disabled', 'Premium future Qwen context includes source, transcript, visual, audio, marker, Preference DNA, and QA warnings.', 'Use deterministic enhanced summary; no Qwen call.', 'Enhanced future Qwen context.'),
  ]
}

function createUltraPremiumSourceUnderstandingRoutes(): EditLevelSourceUnderstandingLayerRoute[] {
  const level = 'ultra_premium'

  return [
    route(level, 'source_metadata', 'required', 'available_mock', 'Ultra Premium needs duration, dimensions, aspect ratio, audio presence, and export-fit metadata.', 'Use project/setup metadata and user confirmation.', 'Metadata and export fit are required.'),
    route(level, 'browser_local_playback', 'recommended', 'available_beta', 'Playback supports scene-level review and source-truth confidence.', 'Use uploaded order and user review state.', 'Browser playback recommended.'),
    route(level, 'media_extraction_metadata', 'recommended', 'worker_required', 'Ultra Premium recommends richer technical metadata for scene-level context.', 'Use available metadata and mark extraction unavailable.', 'Richer metadata recommended.'),
    route(level, 'keyframe_sampling_plan', 'recommended', 'future_gated', 'Ultra Premium plans scene-level keyframes and continuity notes when future workers exist.', 'Use Premium-safe key-moment fallback.', 'Scene-level keyframe plan.'),
    route(level, 'speech_transcript', 'required', 'worker_required', 'Ultra Premium requires transcript-aware planning when speech exists.', 'Use source summary and require clarification when speech meaning is unclear.', 'Transcript required when speech exists.'),
    route(level, 'qwen25vl_visual_segments', 'required', 'provider_required', 'Ultra Premium routes scene-level Qwen2.5-VL visual analysis when future access exists.', 'Degrade to Premium-safe visual context and show a degraded capability notice.', 'Scene-level visual analysis.'),
    route(level, 'qwen25vl_marker_windows', 'required', 'provider_required', 'Ultra Premium routes scene-level marker-window context for precise creative and source-truth decisions.', 'Use Premium-safe marker-window fallback and strict clarification.', 'Scene-level marker windows.'),
    route(level, 'audio_soundsync_segments', 'recommended', 'worker_required', 'Ultra Premium plans audio, music, SFX, ambience, timing, and sound design context.', 'Use Premium audio fallback without claiming SoundSync analysis ran.', 'Sound design audio context.'),
    route(level, 'graphic_text_segments', 'recommended', 'available_mock', 'Ultra Premium includes graphic/text/layout/card/motion-direction observations.', 'Use styled caption/card/layout fallback.', 'Graphic, layout, and motion-direction observations.'),
    route(level, 'preference_dna_context', 'recommended', 'available_mock', 'Ultra Premium includes Preference DNA and consistency guardrails.', 'Use Premium-safe DNA fallback when preference data is missing.', 'Preference DNA and QA guardrails.'),
    route(level, 'edit_brief_marker_context', 'recommended', 'available_mock', 'Edit Brief markers are strongly recommended for Ultra Premium direction.', 'Use setup answers but show strongest control requires a brief.', 'Edit Brief strongly recommended.'),
    route(level, 'marker_context_package', 'recommended', 'available_mock', 'Ultra Premium strongly recommends context-aware Marker Chat with conflicts and plan-hint history.', 'Use Premium-safe marker package fallback.', 'Marker Context Package strongly recommended.'),
    route(level, 'source_video_understanding_package', 'recommended', 'future_gated', 'Ultra Premium strongly recommends scene-level source understanding to inform strict QA and plan hints.', 'Degrade to Premium-safe context and show degraded capability notice.', 'Scene-level source package strongly recommended.'),
    route(level, 'qwen3_reasoning_context', 'required', 'runtime_disabled', 'Ultra Premium future Qwen context includes scene-level source summary, transcript, visual, audio, graphic context, Preference DNA, strict QA warnings, and priority policy.', 'Use deterministic studio summary; no Qwen call.', 'Studio future Qwen context.'),
  ]
}

function createPackage(
  level: ReEditProCanonicalEditLevel,
  layers: EditLevelSourceUnderstandingLayerRoute[],
): EditLevelSourceUnderstandingPolicyPackage {
  const sideEffectFlags = createEditLevelSourceUnderstandingSideEffectFlags()
  const markerContextPolicy = createEditLevelMarkerContextPolicy(level)
  const qwenContextPolicy = createEditLevelQwenContextPolicy(level)

  return {
    level,
    selectedLevel: level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    sourceUnderstandingDepth: depthForLevel(level),
    layers,
    requiredLayers: idsByRequiredness(layers, 'required'),
    recommendedLayers: idsByRequiredness(layers, 'recommended'),
    optionalLayers: idsByRequiredness(layers, 'optional'),
    targetedLayers: idsByRequiredness(layers, 'targeted'),
    futureOnlyLayers: idsByRequiredness(layers, 'future_only'),
    degradedLayers: layers
      .filter((item) => ['provider_required', 'worker_required', 'storage_required', 'future_gated', 'runtime_disabled', 'degraded_fallback'].includes(item.status))
      .map((item) => item.layerId),
    markerContextPolicy,
    qwenContextPolicy,
    fallbackPolicy: fallbackPolicyForLevel(level),
    userFacingSummary: userFacingSummaryForLevel(level),
    technicalSummary: technicalSummaryForLevel(level, layers),
    warnings: [
      'Mock/local source-understanding routing package only.',
      'No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, transcript, media extraction, audio, graphic, worker, render, progress, Supabase, file-byte, external-fetch, or credit operation is executed.',
      ...warningsForLevel(level),
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

function layer(
  layerId: EditLevelSourceUnderstandingLayerId,
  displayName: string,
  sourceTool: string,
  purpose: string,
  defaultStatus: EditLevelSourceLayerStatus,
): EditLevelSourceUnderstandingLayerDefinition {
  return {
    layerId,
    displayName,
    sourceTool,
    purpose,
    defaultStatus,
    mockOnly: true,
  }
}

function route(
  level: ReEditProCanonicalEditLevel,
  layerId: EditLevelSourceUnderstandingLayerId,
  requiredness: EditLevelSourceLayerRequiredness,
  status: EditLevelSourceLayerStatus,
  purpose: string,
  fallback: string,
  userFacingSummary: string,
): EditLevelSourceUnderstandingLayerRoute {
  return createEditLevelSourceUnderstandingLayerRoute({
    level,
    layerId,
    requiredness,
    status,
    purpose,
    fallback,
    userFacingSummary,
  })
}

function depthForLevel(level: ReEditProCanonicalEditLevel): EditLevelSourceUnderstandingDepth {
  if (level === 'normal') return 'metadata_and_targeted_context'
  if (level === 'premium') return 'key_moments_and_marker_windows'
  return 'scene_level_deep_context'
}

function idsByRequiredness(
  layers: EditLevelSourceUnderstandingLayerRoute[],
  requiredness: EditLevelSourceLayerRequiredness,
): EditLevelSourceUnderstandingLayerId[] {
  return layers.filter((item) => item.requiredness === requiredness).map((item) => item.layerId)
}

function fallbackPolicyForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') {
    return [
      'Use browser metadata and deterministic summaries.',
      'Ask a concise clarification when targeted transcript or visual context is unavailable and would change the edit.',
      'Do not claim Qwen2.5-VL, transcript, media extraction, or SoundSync ran.',
    ]
  }

  if (level === 'premium') {
    return [
      'Use key-moment mock fallback and ask for clarification when needed.',
      'Use source summary and marker notes when Qwen2.5-VL or transcript is unavailable.',
      'Do not claim unavailable visual/audio/media workers ran.',
    ]
  }

  return [
    'Degrade to Premium-safe context and show degraded capability notice.',
    'Require clarification when speech meaning, visual continuity, or marker conflicts cannot be resolved.',
    'Do not claim unavailable scene-level, transcript, audio, graphic, or source package tools ran.',
  ]
}

function userFacingSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') {
    return 'Normal uses a clean professional source pass: video metadata, export fit, and targeted context only when needed.'
  }

  if (level === 'premium') {
    return 'Premium uses deeper source understanding: key visual moments, transcript-aware planning, audio/music/SFX guidance, styled captions/cards, and stronger context for markers.'
  }

  return 'Ultra Premium uses studio-level source understanding: scene-level visual analysis, transcript and audio timing, graphic/layout observations, advanced B-roll strategy, and strict context-aware QA.'
}

function technicalSummaryForLevel(
  level: ReEditProCanonicalEditLevel,
  layers: EditLevelSourceUnderstandingLayerRoute[],
): string {
  return `${mapCanonicalEditLevelToPublicLabel(level)} source-understanding policy resolves ${layers.length} layer routes with depth ${depthForLevel(level)}; all side-effect flags remain false and no tools execute.`
}

function warningsForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') return ['Normal does not require a full source understanding package before plan hints.']
  if (level === 'premium') return ['Premium source package, transcript, visual, audio, and media layers are recommended policy only until workers/providers exist.']
  return ['Ultra Premium scene-level context is strongly recommended policy only and degrades to Premium-safe context when tools are unavailable.']
}
