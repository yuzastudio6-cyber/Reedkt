import type {
  EditLevelQwenPlanningDimensionDefinition,
  EditLevelQwenPlanningDimensionId,
  EditLevelQwenPlanningDimensionRoute,
  EditLevelQwenPlanningPassPolicy,
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningRequiredness,
  EditLevelQwenPlanningSideEffectFlags,
  EditLevelQwenPlanningStatus,
  EditLevelQwenPromptPolicy,
  EditLevelQwenReasoningDepth,
  EditLevelQwenStructuredOutputPolicy,
  ReEditProCanonicalEditLevel,
} from '../types'
import { mapCanonicalEditLevelToPublicLabel } from './edit-level-compatibility-mappers'
import { createEditLevelSourceUnderstandingPolicyPackage } from './edit-level-source-understanding-rules'

export const EDIT_LEVEL_QWEN_PLANNING_DIMENSION_DEFINITIONS: EditLevelQwenPlanningDimensionDefinition[] = [
  dimension('qwen_reasoning_depth', 'Qwen reasoning depth', 'How deeply future Qwen 3.7 should reason for the selected level.', 'runtime_disabled'),
  dimension('planning_pass_count', 'Planning pass count', 'Expected future Qwen planning pass shape.', 'available_mock'),
  dimension('prompt_context_budget', 'Prompt context budget', 'How much context the future prompt package may include.', 'available_mock'),
  dimension('source_context_depth', 'Source context depth', 'How RP06 source-understanding context is summarized for future Qwen.', 'available_mock'),
  dimension('marker_context_depth', 'Marker context depth', 'How marker windows and marker context packages influence future reasoning.', 'available_mock'),
  dimension('edit_brief_marker_priority', 'Edit Brief marker priority', 'How much weight Edit Brief markers receive in future Qwen planning.', 'available_mock'),
  dimension('preference_dna_usage', 'Preference DNA usage', 'How strongly Edit Preference/DNA informs future Qwen reasoning.', 'available_mock'),
  dimension('qwen25vl_visual_summary_usage', 'Qwen2.5-VL visual summary usage', 'How future Qwen consumes visual summaries produced elsewhere.', 'provider_required'),
  dimension('transcript_usage', 'Transcript usage', 'How future Qwen consumes transcript summaries when speech exists.', 'worker_required'),
  dimension('audio_context_usage', 'Audio context usage', 'How future Qwen consumes audio/music/SFX context.', 'worker_required'),
  dimension('graphic_text_context_usage', 'Graphic/text context usage', 'How future Qwen consumes graphic, text, card, and layout context.', 'available_mock'),
  dimension('qa_warning_usage', 'QA warning usage', 'How future Qwen uses QA warnings during planning.', 'available_mock'),
  dimension('plan_hint_complexity', 'Plan hint complexity', 'Expected structured plan-hint complexity, without creating a real plan.', 'available_mock'),
  dimension('fallback_behavior', 'Fallback behavior', 'How deterministic fallback behaves when Qwen or context tools are unavailable.', 'available_mock'),
  dimension('usage_estimate_policy', 'Usage estimate policy', 'Low, medium, or high estimate-only policy for future Qwen planning.', 'available_mock'),
  dimension('credit_behavior', 'Credit behavior', 'Estimate-only credit behavior; no reservation or spend.', 'future_gated'),
]

export function createEditLevelQwenPlanningSideEffectFlags(): EditLevelQwenPlanningSideEffectFlags {
  return {
    mockOnly: true,
    providerCallMade: false,
    qwenCallMade: false,
    qwen25vlCallMade: false,
    deepseekCallMade: false,
    plannerExecuted: false,
    editPlanCreated: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    fileBytesRead: false,
    externalUrlFetched: false,
  }
}

export function listEditLevelQwenPlanningDimensionDefinitions(): EditLevelQwenPlanningDimensionDefinition[] {
  return [...EDIT_LEVEL_QWEN_PLANNING_DIMENSION_DEFINITIONS]
}

export function getEditLevelQwenPlanningDimensionDefinition(
  dimensionId: EditLevelQwenPlanningDimensionId,
): EditLevelQwenPlanningDimensionDefinition {
  const definition = EDIT_LEVEL_QWEN_PLANNING_DIMENSION_DEFINITIONS.find((item) => item.dimensionId === dimensionId)

  if (!definition) {
    throw new Error(`Missing Edit Level Qwen planning dimension definition: ${dimensionId}`)
  }

  return definition
}

export function createEditLevelQwenPlanningDimensionRoute(input: {
  level: ReEditProCanonicalEditLevel
  dimensionId: EditLevelQwenPlanningDimensionId
  requiredness: EditLevelQwenPlanningRequiredness
  status?: EditLevelQwenPlanningStatus
  policyValue: string
  purpose: string
  fallback: string
  userFacingSummary: string
  technicalNotes?: string[]
}): EditLevelQwenPlanningDimensionRoute {
  const definition = getEditLevelQwenPlanningDimensionDefinition(input.dimensionId)
  const sideEffectFlags = createEditLevelQwenPlanningSideEffectFlags()

  return {
    level: input.level,
    dimensionId: input.dimensionId,
    displayName: definition.displayName,
    requiredness: input.requiredness,
    status: input.status ?? definition.defaultStatus,
    policyValue: input.policyValue,
    purpose: input.purpose,
    fallback: input.fallback,
    userFacingSummary: input.userFacingSummary,
    technicalNotes: [
      ...(input.technicalNotes ?? []),
      'RP-EDITLEVEL-07 resolves Qwen planning policy only.',
      'No Qwen, Qwen2.5-VL, DeepSeek, provider, planner, edit-plan, worker, render, or credit operation runs.',
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

export function createNormalQwenPlanningProfilePackage(): EditLevelQwenPlanningProfilePackage {
  return createPackage('normal', createNormalQwenPlanningDimensionRoutes())
}

export function createPremiumQwenPlanningProfilePackage(): EditLevelQwenPlanningProfilePackage {
  return createPackage('premium', createPremiumQwenPlanningDimensionRoutes())
}

export function createUltraPremiumQwenPlanningProfilePackage(): EditLevelQwenPlanningProfilePackage {
  return createPackage('ultra_premium', createUltraQwenPlanningDimensionRoutes())
}

export function createEditLevelQwenPlanningProfilePackage(
  level: ReEditProCanonicalEditLevel,
): EditLevelQwenPlanningProfilePackage {
  if (level === 'normal') return createNormalQwenPlanningProfilePackage()
  if (level === 'premium') return createPremiumQwenPlanningProfilePackage()
  return createUltraPremiumQwenPlanningProfilePackage()
}

export function createEditLevelQwenPromptPolicy(
  level: ReEditProCanonicalEditLevel,
): EditLevelQwenPromptPolicy {
  if (level === 'normal') {
    return {
      level,
      promptContextPolicy: 'compact',
      includeUserPrompt: true,
      includeSourceSummary: true,
      includeMarkerContext: false,
      includeEditBriefMarkers: true,
      includePreferenceDNA: false,
      includeQwen25VLVisualSummary: false,
      includeTranscriptSummary: false,
      includeAudioSummary: false,
      includeGraphicTextSummary: false,
      includeQAWarnings: false,
      includePlanHistory: false,
      maxPromptContextTokensEstimate: 1200,
      userFacingSummary: 'Compact future Qwen prompt context: user prompt, selected level, export target, basic source metadata, optional preference summary, and important Edit Brief markers only.',
      mockOnly: true,
    }
  }

  if (level === 'premium') {
    return {
      level,
      promptContextPolicy: 'enhanced',
      includeUserPrompt: true,
      includeSourceSummary: true,
      includeMarkerContext: true,
      includeEditBriefMarkers: true,
      includePreferenceDNA: true,
      includeQwen25VLVisualSummary: true,
      includeTranscriptSummary: true,
      includeAudioSummary: true,
      includeGraphicTextSummary: true,
      includeQAWarnings: true,
      includePlanHistory: false,
      maxPromptContextTokensEstimate: 2600,
      userFacingSummary: 'Enhanced future Qwen prompt context: source key moments, marker windows, transcript/audio/graphic summaries, Preference DNA, Edit Brief priorities, and QA warnings.',
      mockOnly: true,
    }
  }

  return {
    level,
    promptContextPolicy: 'studio',
    includeUserPrompt: true,
    includeSourceSummary: true,
    includeMarkerContext: true,
    includeEditBriefMarkers: true,
    includePreferenceDNA: true,
    includeQwen25VLVisualSummary: true,
    includeTranscriptSummary: true,
    includeAudioSummary: true,
    includeGraphicTextSummary: true,
    includeQAWarnings: true,
    includePlanHistory: true,
    maxPromptContextTokensEstimate: 4200,
    userFacingSummary: 'Studio future Qwen prompt context: scene-level source context, visual summaries, transcript and speech timing, audio/sound design, graphic/layout context, Preference DNA, QA guardrails, marker conflicts, and plan-hint history.',
    mockOnly: true,
  }
}

export function createEditLevelQwenPlanningBoundarySummary(): string[] {
  return [
    'Qwen planning profile only; no Qwen call is made.',
    'No Qwen2.5-VL, DeepSeek, provider, real planner, edit plan creation, media worker, render, progress, Supabase, file-byte, external-fetch, or credit operation runs.',
    'Usage policy is estimate only; no credits are reserved or spent.',
  ]
}

function createNormalQwenPlanningDimensionRoutes(): EditLevelQwenPlanningDimensionRoute[] {
  const level = 'normal'

  return [
    route(level, 'qwen_reasoning_depth', 'required', 'runtime_disabled', 'standard', 'Normal uses standard future Qwen 3.7 reasoning for a clean professional edit.', 'Use deterministic professional fallback.', 'Standard reasoning.'),
    route(level, 'planning_pass_count', 'required', 'available_mock', 'single_pass', 'Normal expects one concise future planning pass.', 'Use deterministic single-pass plan hints.', 'Single-pass planning policy.'),
    route(level, 'prompt_context_budget', 'required', 'available_mock', 'compact', 'Normal future prompt context stays compact.', 'Use compact deterministic context.', 'Compact context budget.'),
    route(level, 'source_context_depth', 'required', 'available_mock', 'metadata + targeted context', 'Normal consumes metadata plus targeted RP06 source context.', 'Use metadata and marker note fallback.', 'Metadata + targeted context.'),
    route(level, 'marker_context_depth', 'optional', 'available_mock', 'targeted clarification', 'Normal uses Marker Chat for targeted clarification only.', 'Use direct user instruction summary.', 'Targeted Marker Chat.'),
    route(level, 'edit_brief_marker_priority', 'optional', 'available_mock', 'important markers only', 'Normal uses important Edit Brief markers when present.', 'Use setup answers when no brief exists.', 'Important markers only.'),
    route(level, 'preference_dna_usage', 'optional', 'available_mock', 'safe style hints', 'Normal applies safe style hints only.', 'Use clean professional defaults.', 'Safe style hints.'),
    route(level, 'qwen25vl_visual_summary_usage', 'optional', 'provider_required', 'targeted when needed', 'Normal consumes visual summaries only when ambiguity requires it.', 'Use source metadata and marker note fallback.', 'Targeted visual summary usage.'),
    route(level, 'transcript_usage', 'optional', 'worker_required', 'targeted when speech matters', 'Normal consumes transcript summary only when speech meaning changes the edit.', 'Ask a concise clarification when speech meaning is unclear.', 'Targeted transcript usage.'),
    route(level, 'audio_context_usage', 'optional', 'worker_required', 'basic audio context', 'Normal keeps audio context voice-first and basic.', 'Use basic audio policy fallback.', 'Basic audio context.'),
    route(level, 'graphic_text_context_usage', 'optional', 'available_mock', 'basic caption/text safety', 'Normal uses graphic/text context for caption safety.', 'Use clean text-safe defaults.', 'Basic text safety.'),
    route(level, 'qa_warning_usage', 'optional', 'available_mock', 'concise risk warnings', 'Normal uses concise QA explanation.', 'Use baseline QA summary.', 'Concise QA warnings.'),
    route(level, 'plan_hint_complexity', 'required', 'available_mock', 'simple professional plan hints', 'Normal structured output is simple professional plan hints.', 'Use deterministic simple hints.', 'Simple professional plan hints.'),
    route(level, 'fallback_behavior', 'required', 'available_mock', 'deterministic fallback acceptable', 'Normal can use deterministic professional fallback if Qwen is unavailable.', 'Use deterministic professional fallback.', 'Deterministic fallback acceptable.'),
    route(level, 'usage_estimate_policy', 'required', 'available_mock', 'low estimate', 'Normal Qwen planning profile uses low estimate-only policy.', 'Show estimate-only copy.', 'Low estimate only.'),
    route(level, 'credit_behavior', 'required', 'future_gated', 'estimate_only_no_spend', 'Normal reserves or spends no credits in this milestone.', 'No credit reservation or spend.', 'Estimate only; no credits.'),
  ]
}

function createPremiumQwenPlanningDimensionRoutes(): EditLevelQwenPlanningDimensionRoute[] {
  const level = 'premium'

  return [
    route(level, 'qwen_reasoning_depth', 'required', 'runtime_disabled', 'deep', 'Premium uses deeper future Qwen 3.7 reasoning for creative planning.', 'Use deterministic fallback with degraded capability notice.', 'Deep creative reasoning.'),
    route(level, 'planning_pass_count', 'required', 'available_mock', 'two_pass', 'Premium expects two future planning passes.', 'Use deterministic two-pass-style plan hints.', 'Two-pass planning policy.'),
    route(level, 'prompt_context_budget', 'required', 'available_mock', 'enhanced', 'Premium future prompt context is enhanced.', 'Use enhanced deterministic context.', 'Enhanced context budget.'),
    route(level, 'source_context_depth', 'required', 'available_mock', 'key moments + marker windows', 'Premium consumes key moments and marker windows from RP06 source context.', 'Use key-moment fallback and clarify if needed.', 'Key moments + marker windows.'),
    route(level, 'marker_context_depth', 'recommended', 'available_mock', 'context-aware marker reasoning', 'Premium uses context-aware marker reasoning.', 'Use marker notes and degraded notice.', 'Context-aware Marker Chat.'),
    route(level, 'edit_brief_marker_priority', 'recommended', 'available_mock', 'prioritized markers', 'Premium prioritizes Edit Brief markers.', 'Use setup answers when no brief exists.', 'Edit Brief recommended.'),
    route(level, 'preference_dna_usage', 'recommended', 'available_mock', 'strong DNA application', 'Premium applies Preference DNA strongly.', 'Use safe style hints when DNA is missing.', 'Strong DNA application.'),
    route(level, 'qwen25vl_visual_summary_usage', 'recommended', 'provider_required', 'key visual moments and marker windows', 'Premium consumes future Qwen2.5-VL key visual summaries.', 'Use key-moment fallback and ask clarification if needed.', 'Visual summaries recommended.'),
    route(level, 'transcript_usage', 'recommended', 'worker_required', 'transcript summary when speech exists', 'Premium consumes transcript summary when speech exists.', 'Use source summary and clarify speech meaning.', 'Transcript summary recommended.'),
    route(level, 'audio_context_usage', 'recommended', 'worker_required', 'audio/SFX/music summary when available', 'Premium consumes audio, SFX, music, and ducking context.', 'Use basic audio fallback.', 'Audio/music/SFX context.'),
    route(level, 'graphic_text_context_usage', 'recommended', 'available_mock', 'graphic/text/card observations', 'Premium consumes graphic/text/card observations.', 'Use styled caption/card fallback.', 'Graphic/text context.'),
    route(level, 'qa_warning_usage', 'recommended', 'available_mock', 'detailed but concise QA warnings', 'Premium uses QA-aware warnings in future reasoning.', 'Use premium QA summary.', 'Detailed concise QA warnings.'),
    route(level, 'plan_hint_complexity', 'required', 'available_mock', 'layered creative plan hints', 'Premium structured output is layered creative plan hints.', 'Use deterministic layered hints.', 'Layered creative plan hints.'),
    route(level, 'fallback_behavior', 'required', 'available_mock', 'deterministic fallback with degraded notice', 'Premium fallback includes degraded capability notice.', 'Use deterministic fallback and show degraded notice.', 'Degraded fallback notice.'),
    route(level, 'usage_estimate_policy', 'required', 'available_mock', 'medium estimate', 'Premium Qwen planning profile uses medium estimate-only policy.', 'Show estimate-only copy.', 'Medium estimate only.'),
    route(level, 'credit_behavior', 'required', 'future_gated', 'estimate_only_no_spend', 'Premium reserves or spends no credits in this milestone.', 'No credit reservation or spend.', 'Estimate only; no credits.'),
  ]
}

function createUltraQwenPlanningDimensionRoutes(): EditLevelQwenPlanningDimensionRoute[] {
  const level = 'ultra_premium'

  return [
    route(level, 'qwen_reasoning_depth', 'required', 'runtime_disabled', 'multi_pass', 'Ultra Premium uses studio-level multi-pass future Qwen 3.7 reasoning.', 'Degrade to Premium-safe reasoning and show clear notice.', 'Studio multi-pass reasoning.'),
    route(level, 'planning_pass_count', 'required', 'available_mock', 'studio_multi_pass', 'Ultra Premium expects studio multi-pass future planning.', 'Use Premium-safe deterministic multi-layer hints.', 'Studio multi-pass planning policy.'),
    route(level, 'prompt_context_budget', 'required', 'available_mock', 'studio', 'Ultra Premium future prompt context is studio depth.', 'Use Premium-safe deterministic context.', 'Studio context budget.'),
    route(level, 'source_context_depth', 'required', 'available_mock', 'scene-level deep context', 'Ultra Premium consumes scene-level deep RP06 source context.', 'Degrade to Premium visual context and show notice.', 'Scene-level deep context.'),
    route(level, 'marker_context_depth', 'recommended', 'available_mock', 'context-aware + QA-aware + plan-aware', 'Ultra Premium uses context-aware, QA-aware, and plan-aware marker reasoning.', 'Use Premium-safe marker reasoning fallback.', 'Context/QA/plan-aware Marker Chat.'),
    route(level, 'edit_brief_marker_priority', 'recommended', 'available_mock', 'strongly prioritized markers and conflicts', 'Ultra Premium strongly prioritizes Edit Brief markers and conflicts.', 'Use setup answers but show strongest control requires a brief.', 'Edit Brief strongly recommended.'),
    route(level, 'preference_dna_usage', 'recommended', 'available_mock', 'deep DNA application', 'Ultra Premium deeply applies Preference DNA.', 'Use Premium-safe DNA fallback.', 'Deep DNA application.'),
    route(level, 'qwen25vl_visual_summary_usage', 'recommended', 'provider_required', 'scene-level visual summaries', 'Ultra Premium consumes scene-level future Qwen2.5-VL summaries.', 'Degrade to Premium visual context and show notice.', 'Scene-level visual summary usage.'),
    route(level, 'transcript_usage', 'recommended', 'worker_required', 'transcript + speech timing', 'Ultra Premium consumes transcript and speech timing.', 'Clarify speech meaning when unavailable.', 'Transcript and speech timing.'),
    route(level, 'audio_context_usage', 'recommended', 'worker_required', 'audio/music/SFX/sound design context', 'Ultra Premium consumes sound design context.', 'Use Premium audio fallback.', 'Sound design context.'),
    route(level, 'graphic_text_context_usage', 'recommended', 'available_mock', 'graphic/text/layout context', 'Ultra Premium consumes graphic, text, and layout context.', 'Use styled layout fallback.', 'Graphic/text/layout context.'),
    route(level, 'qa_warning_usage', 'recommended', 'available_mock', 'strict and detailed QA warnings', 'Ultra Premium uses strict and detailed QA warnings.', 'Use strict QA summary.', 'Strict QA warnings.'),
    route(level, 'plan_hint_complexity', 'required', 'available_mock', 'studio multi-layer plan hints', 'Ultra Premium structured output is studio multi-layer plan hints.', 'Use deterministic studio hints.', 'Studio multi-layer plan hints.'),
    route(level, 'fallback_behavior', 'required', 'available_mock', 'degrade to Premium-safe reasoning', 'Ultra Premium fallback degrades to Premium-safe reasoning.', 'Degrade to Premium-safe reasoning with clear notice.', 'Premium-safe degraded fallback.'),
    route(level, 'usage_estimate_policy', 'required', 'available_mock', 'high estimate', 'Ultra Premium Qwen planning profile uses high estimate-only policy.', 'Show estimate-only copy.', 'High estimate only.'),
    route(level, 'credit_behavior', 'required', 'future_gated', 'estimate_only_no_spend', 'Ultra Premium reserves or spends no credits in this milestone.', 'No credit reservation or spend.', 'Estimate only; no credits.'),
  ]
}

function createPackage(
  level: ReEditProCanonicalEditLevel,
  dimensions: EditLevelQwenPlanningDimensionRoute[],
): EditLevelQwenPlanningProfilePackage {
  const sideEffectFlags = createEditLevelQwenPlanningSideEffectFlags()
  const sourcePackage = createEditLevelSourceUnderstandingPolicyPackage(level)
  const promptPolicy = createEditLevelQwenPromptPolicy(level)

  return {
    level,
    selectedLevel: level,
    displayName: mapCanonicalEditLevelToPublicLabel(level),
    qwenReasoningDepth: reasoningDepthForLevel(level),
    planningPassPolicy: planningPassForLevel(level),
    promptPolicy,
    promptContextPolicy: promptPolicy.promptContextPolicy,
    structuredOutputPolicy: structuredOutputForLevel(level),
    markerChatPolicy: markerChatPolicyForLevel(level),
    editBriefPolicy: editBriefPolicyForLevel(level),
    sourceContextPolicy: sourcePackage.sourceUnderstandingDepth,
    preferenceDNAPolicy: preferenceDNAPolicyForLevel(level),
    qaExplanationPolicy: qaExplanationPolicyForLevel(level),
    dimensions,
    requiredDimensions: idsByRequiredness(dimensions, 'required'),
    recommendedDimensions: idsByRequiredness(dimensions, 'recommended'),
    futureOnlyDimensions: idsByRequiredness(dimensions, 'future_only'),
    degradedDimensions: dimensions
      .filter((item) => ['runtime_disabled', 'provider_required', 'worker_required', 'future_gated', 'degraded_fallback'].includes(item.status))
      .map((item) => item.dimensionId),
    fallbackPolicy: fallbackPolicyForLevel(level),
    usageEstimatePolicy: usageEstimateForLevel(level),
    creditBehavior: 'estimate_only_no_spend',
    userFacingSummary: userFacingSummaryForLevel(level),
    technicalSummary: `${mapCanonicalEditLevelToPublicLabel(level)} Qwen planning profile resolves ${dimensions.length} dimensions with ${reasoningDepthForLevel(level)} reasoning and ${planningPassForLevel(level)} policy; all side-effect flags remain false and no planners execute.`,
    warnings: [
      'Mock/local Qwen planning profile only.',
      'No Qwen 3.7, Qwen2.5-VL, DeepSeek, provider, planner, edit-plan, worker, render, progress, Supabase, file-byte, external-fetch, or credit operation is executed.',
      ...warningsForLevel(level),
    ],
    ...sideEffectFlags,
    sideEffectFlags,
  }
}

function dimension(
  dimensionId: EditLevelQwenPlanningDimensionId,
  displayName: string,
  purpose: string,
  defaultStatus: EditLevelQwenPlanningStatus,
): EditLevelQwenPlanningDimensionDefinition {
  return {
    dimensionId,
    displayName,
    purpose,
    defaultStatus,
    mockOnly: true,
  }
}

function route(
  level: ReEditProCanonicalEditLevel,
  dimensionId: EditLevelQwenPlanningDimensionId,
  requiredness: EditLevelQwenPlanningRequiredness,
  status: EditLevelQwenPlanningStatus,
  policyValue: string,
  purpose: string,
  fallback: string,
  userFacingSummary: string,
): EditLevelQwenPlanningDimensionRoute {
  return createEditLevelQwenPlanningDimensionRoute({
    level,
    dimensionId,
    requiredness,
    status,
    policyValue,
    purpose,
    fallback,
    userFacingSummary,
  })
}

function idsByRequiredness(
  dimensions: EditLevelQwenPlanningDimensionRoute[],
  requiredness: EditLevelQwenPlanningRequiredness,
): EditLevelQwenPlanningDimensionId[] {
  return dimensions.filter((item) => item.requiredness === requiredness).map((item) => item.dimensionId)
}

function reasoningDepthForLevel(level: ReEditProCanonicalEditLevel): EditLevelQwenReasoningDepth {
  if (level === 'normal') return 'standard'
  if (level === 'premium') return 'deep'
  return 'multi_pass'
}

function planningPassForLevel(level: ReEditProCanonicalEditLevel): EditLevelQwenPlanningPassPolicy {
  if (level === 'normal') return 'single_pass'
  if (level === 'premium') return 'two_pass'
  return 'studio_multi_pass'
}

function structuredOutputForLevel(level: ReEditProCanonicalEditLevel): EditLevelQwenStructuredOutputPolicy {
  if (level === 'normal') return 'simple_professional_plan_hints'
  if (level === 'premium') return 'layered_creative_plan_hints'
  return 'studio_multi_layer_plan_hints'
}

function markerChatPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'targeted clarification'
  if (level === 'premium') return 'context-aware marker reasoning'
  return 'context-aware + QA-aware + plan-aware'
}

function editBriefPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'optional'
  if (level === 'premium') return 'recommended'
  return 'strongly recommended'
}

function preferenceDNAPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'safe style hints'
  if (level === 'premium') return 'strong DNA application'
  return 'deep DNA application'
}

function qaExplanationPolicyForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') return 'concise'
  if (level === 'premium') return 'detailed but concise'
  return 'strict and detailed'
}

function usageEstimateForLevel(level: ReEditProCanonicalEditLevel): 'low_estimate' | 'medium_estimate' | 'high_estimate' {
  if (level === 'normal') return 'low_estimate'
  if (level === 'premium') return 'medium_estimate'
  return 'high_estimate'
}

function fallbackPolicyForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') {
    return [
      'Deterministic professional fallback is acceptable.',
      'Use source metadata and marker note fallback when Qwen2.5-VL is unavailable.',
      'Do not claim Qwen, Qwen2.5-VL, transcript, audio, graphic, or planner execution ran.',
    ]
  }

  if (level === 'premium') {
    return [
      'Use deterministic fallback plus degraded capability notice.',
      'Use key-moment fallback and ask clarification when Qwen2.5-VL or transcript context is unavailable.',
      'Do not claim unavailable model, media, transcript, audio, graphic, or planner execution ran.',
    ]
  }

  return [
    'Degrade to Premium-safe reasoning and show clear notice.',
    'Degrade to Premium visual context when scene-level visual summaries are unavailable.',
    'Ask clarifying questions where unavailable transcript/audio/graphic context would change the edit.',
  ]
}

function userFacingSummaryForLevel(level: ReEditProCanonicalEditLevel): string {
  if (level === 'normal') {
    return 'Normal uses standard Qwen reasoning for a clean professional edit, with compact context and targeted clarification when needed.'
  }

  if (level === 'premium') {
    return 'Premium uses deeper Qwen reasoning with source context, marker windows, Edit Preference DNA, and stronger creative planning.'
  }

  return 'Ultra Premium uses studio-level Qwen reasoning with scene-level context, Preference DNA, strict QA, and multi-layer creative planning.'
}

function warningsForLevel(level: ReEditProCanonicalEditLevel): string[] {
  if (level === 'normal') return ['Normal Qwen policy is a compact future reasoning profile only.']
  if (level === 'premium') return ['Premium Qwen policy is deeper future reasoning metadata only and shows degraded notices when runtime is unavailable.']
  return ['Ultra Premium Qwen policy is studio multi-pass future reasoning metadata only and degrades to Premium-safe reasoning when runtime/tools are unavailable.']
}
