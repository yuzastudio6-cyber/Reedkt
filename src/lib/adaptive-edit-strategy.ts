import type {
  AdaptiveDecisionKind,
  AdaptiveEditStrategy,
  AdaptiveEditStrategyPlan,
  AdaptivePacingStrategy,
  AdaptiveSegmentStrategy,
  AdaptiveStrategyItem,
  AdaptiveStrategyReason,
  AdaptiveVisualStrategySummary,
  ClipUnderstandingItem,
  CompiledEditingIntent,
  CreativeIntensity,
  GenerationRestraint,
  PlannerInput,
  ProfessionalEditingDirective,
  SignatureSystem,
  SpeakerPresenceMode,
  SpeakerVisualLayoutMode,
  ToolStrategyHint,
  VideoUnderstandingReport,
  VisualAssetType,
  VisualDominanceMode,
  VisualSupportOpportunity,
  VisualSupportOpportunityType,
} from '../types/reeditpro'
import { getToolStrategyDetailsForHint } from './tool-registry'

type CreateAdaptiveEditStrategyParams = {
  input: PlannerInput
  opportunities: VisualSupportOpportunity[]
  compiledIntent?: CompiledEditingIntent
}

type CreateAdaptiveEditStrategyPlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  professionalDirective?: ProfessionalEditingDirective
}

function labelForOpportunity(type: VisualSupportOpportunityType): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function layoutForOpportunity(type: VisualSupportOpportunityType): SpeakerVisualLayoutMode | undefined {
  switch (type) {
    case 'map_animation':
      return 'full_map_takeover'
    case 'screen_capture':
      return 'screen_capture_with_speaker_pip'
    case 'evidence_board':
      return 'full_evidence_board'
    case 'graphic_explainer':
    case 'chart_or_diagram':
      return 'full_graphic_explainer'
    case 'timeline_card':
    case 'fact_card':
    case 'name_card':
    case 'full_visual_takeover':
      return 'voiceover_visual_takeover'
    case 'stroke_motion':
      return 'full_stroke_motion_scene'
    case 'lower_panel_visual':
      return 'lower_visual_panel'
    case 'picture_in_picture':
      return 'picture_in_picture_speaker'
    case 'b_roll_cutaway':
      return 'b_roll_cutaway'
    case 'caption_only':
    case 'no_extra_visual':
      return 'full_speaker'
    default:
      return undefined
  }
}

function toolHintsForOpportunity(
  type: VisualSupportOpportunityType,
  currentHints: ToolStrategyHint[],
): ToolStrategyHint[] {
  const defaultHints: ToolStrategyHint[] = (() => {
    switch (type) {
      case 'map_animation':
        return ['map_tool', 'remotion_layout']
      case 'screen_capture':
        return ['browser_capture_tool', 'remotion_layout']
      case 'chart_or_diagram':
      case 'graphic_explainer':
        return ['chart_tool', 'gpt_image_asset', 'remotion_layout']
      case 'evidence_board':
      case 'timeline_card':
      case 'fact_card':
      case 'name_card':
        return ['gpt_image_asset', 'remotion_layout']
      case 'stroke_motion':
        return ['gpt_image_asset', 'wan_animation', 'hailuo_fallback']
      case 'real_motion':
        return ['gpt_image_asset', 'wan_animation', 'hailuo_fallback']
      case 'caption_only':
      case 'no_extra_visual':
        return ['remotion_layout']
      default:
        return ['remotion_layout']
    }
  })()

  return Array.from(new Set([...currentHints, ...defaultHints]))
}

function signatureForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): SignatureSystem {
  if (type === 'stroke_motion') return 'stroke_motion'
  if (type === 'real_motion') return input.editLevel === 'basic' ? 'graphic_design' : 'real_motion'
  if (type === 'caption_only' || type === 'no_extra_visual' || type === 'b_roll_cutaway') return 'none'
  return 'graphic_design'
}

function decisionKindForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): AdaptiveDecisionKind {
  if (type === 'real_motion' && input.editLevel === 'basic') return 'simplify_for_tier'

  switch (type) {
    case 'caption_only':
      return 'use_captions_only'
    case 'no_extra_visual':
      return 'use_no_extra_visual'
    case 'b_roll_cutaway':
      return 'use_b_roll'
    case 'still_card':
    case 'fact_card':
    case 'name_card':
    case 'timeline_card':
      return 'use_still_card'
    case 'graphic_explainer':
    case 'full_visual_takeover':
    case 'lower_panel_visual':
    case 'picture_in_picture':
      return 'use_graphic_explainer'
    case 'chart_or_diagram':
      return 'use_chart_or_diagram'
    case 'map_animation':
      return 'use_map'
    case 'screen_capture':
      return 'use_screen_capture'
    case 'stroke_motion':
      return 'use_stroke_motion'
    case 'real_motion':
      return 'use_real_motion'
    default:
      return 'custom'
  }
}

function assetTypeForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): VisualAssetType | undefined {
  switch (type) {
    case 'still_card':
      return 'still_scene'
    case 'fact_card':
      return 'fact_card'
    case 'name_card':
      return 'name_card'
    case 'timeline_card':
      return 'timeline_card'
    case 'evidence_board':
    case 'screen_capture':
      return 'graphic_design_frame'
    case 'graphic_explainer':
    case 'chart_or_diagram':
    case 'map_animation':
      return 'motion_design_scene'
    case 'stroke_motion':
      return input.editLevel === 'basic' ? 'still_with_editor_motion' : 'animated_scene'
    case 'real_motion':
      return input.editLevel === 'basic' ? 'graphic_design_frame' : 'real_motion_scene'
    case 'b_roll_cutaway':
      return 'still_with_editor_motion'
    case 'lower_panel_visual':
    case 'picture_in_picture':
    case 'full_visual_takeover':
      return 'graphic_design_frame'
    case 'caption_only':
    case 'no_extra_visual':
      return undefined
    default:
      return undefined
  }
}

function speakerPresenceForLayout(mode?: SpeakerVisualLayoutMode): SpeakerPresenceMode | undefined {
  switch (mode) {
    case 'full_speaker':
      return 'full_speaker'
    case 'picture_in_picture_speaker':
    case 'screen_capture_with_speaker_pip':
      return 'picture_in_picture'
    case 'side_by_side_speaker_visual':
      return 'side_panel_speaker'
    case 'lower_visual_panel':
    case 'vertical_speaker_top_visual_bottom':
    case 'vertical_visual_top_speaker_bottom':
    case 'speaker_cutout_overlay':
    case 'object_anchored_callout':
      return 'partial_speaker'
    case 'voiceover_visual_takeover':
    case 'full_graphic_explainer':
    case 'full_stroke_motion_scene':
    case 'full_map_takeover':
    case 'full_evidence_board':
    case 'b_roll_cutaway':
    case 'split_screen_comparison':
    case 'before_after_panel':
      return 'voice_only'
    default:
      return undefined
  }
}

function visualDominanceForLayout(mode?: SpeakerVisualLayoutMode): VisualDominanceMode | undefined {
  switch (mode) {
    case 'full_speaker':
      return 'none'
    case 'lower_visual_panel':
      return 'support'
    case 'side_by_side_speaker_visual':
    case 'vertical_speaker_top_visual_bottom':
    case 'vertical_visual_top_speaker_bottom':
      return 'balanced'
    case 'picture_in_picture_speaker':
    case 'screen_capture_with_speaker_pip':
    case 'b_roll_cutaway':
    case 'speaker_cutout_overlay':
    case 'object_anchored_callout':
      return 'dominant'
    case 'voiceover_visual_takeover':
    case 'full_graphic_explainer':
    case 'full_stroke_motion_scene':
    case 'full_map_takeover':
    case 'full_evidence_board':
    case 'split_screen_comparison':
    case 'before_after_panel':
      return 'full_takeover'
    default:
      return undefined
  }
}

function generationRestraintForOpportunity(
  type: VisualSupportOpportunityType,
  input: PlannerInput,
): GenerationRestraint {
  if (
    type === 'caption_only' ||
    type === 'no_extra_visual' ||
    type === 'b_roll_cutaway' ||
    type === 'chart_or_diagram' ||
    type === 'map_animation' ||
    type === 'screen_capture' ||
    type === 'graphic_explainer'
  ) {
    return 'avoid_generation'
  }

  if (type === 'real_motion') {
    if (input.editLevel === 'basic') return 'avoid_generation'
    return input.editLevel === 'premium' ? 'premium_fallback_only' : 'allow_generation'
  }

  if (type === 'stroke_motion') {
    if (input.editLevel === 'basic') return 'use_generation_only_if_needed'
    return 'allow_generation'
  }

  if (type === 'still_card' || type === 'fact_card' || type === 'name_card' || type === 'timeline_card' || type === 'evidence_board') {
    return 'use_generation_only_if_needed'
  }

  return 'use_generation_only_if_needed'
}

function creativeIntensityForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): CreativeIntensity {
  const instructions = input.customInstructions.toLowerCase()

  if (/calm|natural|minimal|not too viral|restrained/.test(instructions) || input.visualPreference === 'keep_visuals_minimal' || input.visualPreference === 'no_extra_visuals') {
    return 'restrained'
  }

  if (type === 'real_motion' || input.moodStyle === 'cinematic') return 'cinematic'
  if (type === 'stroke_motion') return input.editLevel === 'premium' ? 'expressive' : 'balanced'
  if (type === 'caption_only' || type === 'no_extra_visual') return 'minimal'
  if (input.workflowType === 'social_short_viral_clip' || input.moodStyle === 'viral_fast_paced') return 'high_impact'
  return 'balanced'
}

function costForOpportunity(type: VisualSupportOpportunityType, restraint: GenerationRestraint, input: PlannerInput): AdaptiveSegmentStrategy['costComplexity'] {
  if (type === 'caption_only' || type === 'no_extra_visual' || type === 'b_roll_cutaway') return 'none'
  if (restraint === 'avoid_generation') return input.editLevel === 'basic' ? 'low' : 'medium'
  if (type === 'real_motion') return input.editLevel === 'premium' ? 'premium' : 'high'
  if (type === 'stroke_motion') return input.editLevel === 'basic' ? 'low' : 'medium'
  if (input.editLevel === 'premium' && (type === 'evidence_board' || type === 'full_visual_takeover')) return 'high'
  return 'low'
}

function roleForOpportunity(type: VisualSupportOpportunityType): AdaptiveSegmentStrategy['segmentRole'] {
  switch (type) {
    case 'b_roll_cutaway':
      return 'b_roll_support'
    case 'fact_card':
    case 'name_card':
    case 'timeline_card':
    case 'evidence_board':
      return 'evidence_card'
    case 'graphic_explainer':
    case 'chart_or_diagram':
    case 'map_animation':
    case 'screen_capture':
    case 'full_visual_takeover':
      return 'visual_explainer'
    case 'stroke_motion':
    case 'real_motion':
      return 'emotional_beat'
    case 'caption_only':
    case 'no_extra_visual':
      return 'context'
    default:
      return 'custom'
  }
}

function fallbackStrategyForOpportunity(type: VisualSupportOpportunityType, input: PlannerInput): string[] {
  const tierFallback = input.editLevel === 'basic'
    ? 'Basic fallback: simplify to speaker-first captions, uploaded b-roll, still card, or lower panel.'
    : input.editLevel === 'premium'
      ? 'Premium fallback: try controlled simplification first; Veo is final fallback only when already allowed by route policy.'
      : 'Pro fallback: use Remotion/editor motion, still card, or Hailuo where routed; never Veo.'

  switch (type) {
    case 'map_animation':
      return ['Fallback to side-by-side or lower-panel static map if map motion is too busy.', tierFallback]
    case 'chart_or_diagram':
      return ['Fallback to a simpler controlled diagram with fewer labels.', tierFallback]
    case 'screen_capture':
      return ['Fallback to a static product frame or labeled screenshot-style graphic.', tierFallback]
    case 'stroke_motion':
      return ['Fallback to still-with-editor-motion if generation is unnecessary or fails QA.', tierFallback]
    case 'real_motion':
      return ['Fallback to Graphic Design / VisualExplain or still card if Real Motion is too expensive or risky.', tierFallback]
    case 'caption_only':
    case 'no_extra_visual':
      return ['Fallback is already the simplest speaker/source-led treatment.']
    default:
      return [tierFallback]
  }
}

function opportunityFromClip(
  clip: ClipUnderstandingItem,
  input: PlannerInput,
  index: number,
): VisualSupportOpportunity {
  const type = clip.visualSupportOpportunities[0] ?? 'caption_only'

  return {
    id: `adaptive-clip-opportunity-${index + 1}`,
    clipId: clip.clipId,
    opportunityType: type,
    label: `${clip.fileName} strategy`,
    reason: `${clip.detectedRole.replaceAll('_', ' ')} clip: ${clip.visualSummary}`,
    suggestedSignatureSystem: signatureForOpportunity(type, input),
    suggestedLayoutMode: layoutForOpportunity(type),
    suggestedToolHints: toolHintsForOpportunity(type, clip.toolStrategyHints),
    creditImpact: type === 'caption_only' || type === 'no_extra_visual' ? 'none' : input.editLevel === 'premium' ? 'medium' : 'low',
    priority: clip.roleConfidence === 'high' ? 'high' : 'medium',
    qaChecks: [
      'Confirm this clip-level strategy supports the real segment meaning once future analysis exists.',
      'Do not claim real clip analysis has run.',
    ],
  }
}

function fallbackOpportunities(input: PlannerInput, report?: VideoUnderstandingReport): VisualSupportOpportunity[] {
  if (report?.clips.length) {
    return report.clips.slice(0, 5).map((clip, index) => opportunityFromClip(clip, input, index))
  }

  const type: VisualSupportOpportunityType =
    input.visualPreference === 'no_extra_visuals'
      ? 'no_extra_visual'
      : input.editingCategory === 'education_explainer'
        ? 'graphic_explainer'
        : input.editingCategory === 'documentary_case_study'
          ? 'evidence_board'
          : input.editingCategory === 'business_brand'
            ? 'screen_capture'
            : 'caption_only'

  return [
    {
      id: 'adaptive-fallback-opportunity-1',
      opportunityType: type,
      label: 'Default adaptive beat',
      reason: 'No richer video-understanding opportunity was available, so the planner uses the safest beat-specific default.',
      suggestedSignatureSystem: signatureForOpportunity(type, input),
      suggestedLayoutMode: layoutForOpportunity(type),
      suggestedToolHints: toolHintsForOpportunity(type, []),
      creditImpact: type === 'caption_only' || type === 'no_extra_visual' ? 'none' : 'low',
      priority: 'low',
      qaChecks: ['Confirm this default does not become a rigid category template.'],
    },
  ]
}

function strategyReasons(params: {
  opportunity: VisualSupportOpportunity
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  restraint: GenerationRestraint
}): AdaptiveStrategyReason[] {
  const { compiledIntent, input, opportunity, restraint } = params
  const reasons: AdaptiveStrategyReason[] = [
    {
      id: `${opportunity.id}-reason-user-intent`,
      source: 'user_intent',
      explanation:
        compiledIntent?.goalSummary ||
        input.customInstructions ||
        'User intent is inferred from setup choices and workflow context.',
      priority: 'high',
    },
    {
      id: `${opportunity.id}-reason-understanding`,
      source: 'video_understanding',
      explanation: opportunity.reason,
      priority: opportunity.priority === 'high' ? 'high' : 'medium',
    },
    {
      id: `${opportunity.id}-reason-tier`,
      source: 'edit_level',
      explanation:
        input.editLevel === 'basic'
          ? 'Basic keeps the strategy professional, safer, and lower-compute.'
          : input.editLevel === 'premium'
            ? 'Premium allows deeper QA and fallback, but still keeps Veo final fallback only.'
            : 'Pro allows richer visual planning while keeping Veo unavailable.',
      priority: 'medium',
    },
    {
      id: `${opportunity.id}-reason-generation-restraint`,
      source: 'model_policy',
      explanation: `Generation restraint is ${restraint.replaceAll('_', ' ')} so exact visuals, tier policy, and provider boundaries stay controlled.`,
      priority: restraint === 'avoid_generation' ? 'high' : 'medium',
    },
    {
      id: `${opportunity.id}-reason-platform`,
      source: 'platform',
      explanation: `Platform ${input.targetPlatform.replaceAll('_', ' ')} and aspect ${input.aspectRatio} shape the layout and safe-zone choice.`,
      priority: 'medium',
    },
  ]

  if (input.referenceUrl.trim()) {
    reasons.push({
      id: `${opportunity.id}-reason-reference`,
      source: 'reference_dna',
      explanation: 'Reference DNA can influence rhythm and visual taste but must not be copied shot-for-shot.',
      priority: 'medium',
    })
  }

  return reasons
}

function strategyFromOpportunity(
  opportunity: VisualSupportOpportunity,
  input: PlannerInput,
  compiledIntent: CompiledEditingIntent | undefined,
  directive: ProfessionalEditingDirective | undefined,
  index: number,
): AdaptiveSegmentStrategy {
  const opportunityType =
    input.editLevel === 'basic' && opportunity.opportunityType === 'real_motion'
      ? 'still_card'
      : opportunity.opportunityType
  const layoutMode = opportunity.suggestedLayoutMode ?? layoutForOpportunity(opportunityType)
  const restraint = generationRestraintForOpportunity(opportunityType, input)
  const signatureSystem = signatureForOpportunity(opportunityType, input)
  const toolHints = toolHintsForOpportunity(opportunityType, opportunity.suggestedToolHints)
  const toolStrategyHintsDetailed = toolHints.flatMap((hint) =>
    getToolStrategyDetailsForHint(hint, {
      editLevel: input.editLevel,
      layoutMode,
    }),
  )
  const hasProviderModelHint = toolHints.some((hint) =>
    hint === 'gpt_image_asset' ||
    hint === 'wan_animation' ||
    hint === 'hailuo_fallback' ||
    hint === 'veo_premium_fallback_only',
  )

  return {
    id: `adaptive-segment-strategy-${index + 1}`,
    clipId: opportunity.clipId,
    segmentId: opportunity.segmentId,
    label: opportunity.label,
    segmentRole: roleForOpportunity(opportunityType),
    decisionKind: decisionKindForOpportunity(opportunityType, input),
    creativeIntensity: creativeIntensityForOpportunity(opportunityType, input),
    generationRestraint: restraint,
    recommendedVisualSupport: opportunityType,
    recommendedSignatureSystem: signatureSystem,
    recommendedLayoutMode: layoutMode,
    recommendedSpeakerPresence: speakerPresenceForLayout(layoutMode),
    recommendedVisualDominance: visualDominanceForLayout(layoutMode),
    recommendedToolHints: toolHints,
    toolStrategyHintsDetailed,
    recommendedAssetType: assetTypeForOpportunity(opportunityType, input),
    recommendedTransitionFamilies: directive?.transitionFamilies ?? ['clean_cut_transitions'],
    recommendedColorGrade: directive?.colorGradeStyle ?? 'clean_natural',
    recommendedCaptionStyle: directive?.captionStyle ?? 'clean_subtitle',
    recommendedBrollPolicy: directive?.brollPolicy ?? 'support_key_points',
    costComplexity: costForOpportunity(opportunityType, restraint, input),
    reasons: strategyReasons({ compiledIntent, input, opportunity, restraint }),
    mustFollowRules: [
      'Use this decision because the segment needs it, not because of category alone.',
      'Keep plan and credit approval before any generation or rendering.',
      ...(compiledIntent?.mustFollowRules.slice(0, 3) ?? []),
    ],
    avoidRules: [
      ...avoidRulesForOpportunity(input, opportunityType),
      ...(restraint === 'avoid_generation' ? ['Do not create an AI-video prompt for this strategy.'] : []),
      ...(toolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool')
        ? ['Prefer controlled tool/Remotion planning for exact maps, charts, labels, screen captures, and data visuals.']
        : []),
      ...(hasProviderModelHint ? ['Provider model hints remain separate from the open-source tool registry.'] : []),
    ],
    fallbackStrategy: fallbackStrategyForOpportunity(opportunityType, input),
    qaChecks: [
      'Strategy has a clear user-intent and video-understanding reason.',
      'No visual is added without beat-level purpose.',
      'Generation restraint is respected by provider prompt planning.',
      'Chosen layout leaves captions, faces, products, and labels readable.',
      ...(toolStrategyHintsDetailed.length > 0
        ? ['Open-source tool hints are planning-only and do not install or execute packages.']
        : []),
      ...(hasProviderModelHint
        ? ['GPT-Image-2, Wan, Hailuo, and Veo are provider/model routes, not OpenSourceToolId entries.']
        : []),
      ...(opportunity.qaChecks ?? []),
    ],
  }
}

function hookStrategy(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  report?: VideoUnderstandingReport
}) {
  const { compiledIntent, input, report } = params
  const text = `${input.customInstructions} ${compiledIntent?.goalSummary ?? ''}`.toLowerCase()
  const hookClip = report?.clips.find((clip) => clip.detectedRole === 'hook_candidate' || clip.hookCandidates.length > 0)
  const selectedLine = report?.transcriptMeaning.hookLines[0]
  const avoidHook = /no hook|no viral|calm|natural|not too viral/.test(text) || input.workflowType === 'simple_clean_edit'
  const requiredHook = !avoidHook && (input.workflowType === 'social_short_viral_clip' || input.workflowType === 'marketing_ad')
  const policy = avoidHook ? 'avoid' : requiredHook ? 'required' : input.targetPlatform === 'tiktok_reels_shorts' ? 'recommended' : 'optional'

  return {
    policy,
    recommendation:
      policy === 'avoid'
        ? 'Use a natural opening and do not force a viral-style hook.'
        : policy === 'required'
          ? 'Open with the strongest problem, result, or emotional line before context.'
          : 'Use a soft hook only if it makes the viewer entry point clearer.',
    selectedClipId: hookClip?.clipId,
    selectedLine,
    reason:
      selectedLine
        ? `Mock transcript suggests a hook line: ${selectedLine}`
        : 'Hook choice is based on workflow, platform, user tone, and source clip role.',
    alternatives: [
      'Natural source-order opening if hook feels forced.',
      'Problem/benefit hook for business or education.',
      'Case setup hook for documentary.',
    ],
  } satisfies AdaptiveEditStrategyPlan['hookStrategy']
}

function pacingStrategy(params: {
  input: PlannerInput
  directive?: ProfessionalEditingDirective
  report?: VideoUnderstandingReport
}): AdaptivePacingStrategy {
  const { directive, input, report } = params
  const instructions = input.customInstructions.toLowerCase()
  const calm = /calm|natural|not too viral|minimal|slow/.test(instructions)
  const fast = /fast|high retention|viral|tight|snappy/.test(instructions)
  const creativeIntensity: CreativeIntensity = calm
    ? 'restrained'
    : fast
      ? 'high_impact'
      : input.editLevel === 'premium'
        ? 'cinematic'
        : input.editLevel === 'basic'
          ? 'minimal'
          : 'balanced'

  return {
    pacingStyle: directive?.pacingStyle ?? (calm ? 'natural' : fast ? 'high_retention' : 'clean_tight'),
    cutIntensity: directive?.cutIntensity ?? (calm ? 'minimal' : fast ? 'tight' : 'balanced'),
    creativeIntensity,
    reason:
      report?.transcriptMeaning.captionDensityRecommendation === 'high'
        ? 'Pacing keeps explanation readable while supporting the transcript density.'
        : 'Pacing balances the user tone, edit level, and professional directive.',
    keepPausesWhere: [
      'Keep human emotional beats where trust, reaction, or clarity matters.',
      input.editLevel === 'premium' ? 'Premium can preserve more nuanced story pauses.' : 'Avoid dead air while preserving natural speech.',
    ],
    tightenWhere: [
      'Tighten filler, dead space, repeated setup, and visual waits that do not add meaning.',
      report?.audioUnderstanding.cleanupNeeded ? 'Reflect mock audio cleanup need in timing and sound plan.' : 'Maintain clean timing.',
    ],
    avoidRules: [
      calm ? 'Avoid aggressive zooms, glitchy transitions, and overly viral pacing.' : 'Avoid random transition energy.',
      'Do not let pacing override explicit user instructions.',
    ],
  }
}

function visualStrategySummary(strategies: AdaptiveSegmentStrategy[]): AdaptiveVisualStrategySummary {
  const speakerLedSegments = strategies.filter((strategy) =>
    strategy.recommendedLayoutMode === 'full_speaker' ||
    strategy.recommendedVisualSupport === 'caption_only' ||
    strategy.recommendedVisualSupport === 'no_extra_visual',
  ).length
  const visualTakeoverSegments = strategies.filter((strategy) => strategy.recommendedVisualDominance === 'full_takeover').length
  const brollSegments = strategies.filter((strategy) => strategy.decisionKind === 'use_b_roll').length
  const graphicSegments = strategies.filter((strategy) => strategy.recommendedSignatureSystem === 'graphic_design').length
  const mapOrChartSegments = strategies.filter((strategy) => strategy.decisionKind === 'use_map' || strategy.decisionKind === 'use_chart_or_diagram').length
  const aiVideoSegments = strategies.filter((strategy) =>
    (strategy.recommendedSignatureSystem === 'stroke_motion' || strategy.recommendedSignatureSystem === 'real_motion') &&
    strategy.generationRestraint !== 'avoid_generation',
  ).length
  const stillCardSegments = strategies.filter((strategy) =>
    strategy.decisionKind === 'use_still_card' ||
    strategy.recommendedAssetType === 'still_scene' ||
    strategy.recommendedAssetType === 'still_with_editor_motion' ||
    strategy.recommendedAssetType === 'fact_card' ||
    strategy.recommendedAssetType === 'name_card' ||
    strategy.recommendedAssetType === 'timeline_card',
  ).length
  const noExtraVisualSegments = strategies.filter((strategy) =>
    strategy.decisionKind === 'use_no_extra_visual' ||
    strategy.decisionKind === 'use_captions_only',
  ).length

  return {
    speakerLedSegments,
    visualTakeoverSegments,
    brollSegments,
    graphicSegments,
    mapOrChartSegments,
    aiVideoSegments,
    stillCardSegments,
    noExtraVisualSegments,
    summary: `${speakerLedSegments} speaker-led, ${visualTakeoverSegments} visual takeover, ${graphicSegments} graphic/tool-led, and ${aiVideoSegments} AI-video-eligible segment strateg${strategies.length === 1 ? 'y' : 'ies'} planned.`,
  }
}

function modelPolicyNotes(input: PlannerInput, strategies: AdaptiveSegmentStrategy[]) {
  const exactToolCount = strategies.filter((strategy) =>
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool'),
  ).length

  return [
    input.editLevel === 'premium'
      ? 'Premium can include Veo 3.1 Lite only as final fallback/rescue; never primary/default.'
      : 'Basic and Pro cannot use Veo.',
    'Wan remains primary animation route where AI video is actually useful; Hailuo is fallback/alternate.',
    exactToolCount > 0
      ? `${exactToolCount} exact map/chart/screen strateg${exactToolCount === 1 ? 'y prefers' : 'ies prefer'} controlled tool or Remotion planning over AI video.`
      : 'No exact map/chart/screen strategy requires tool preference in this plan.',
  ]
}

function creditStrategyNotes(input: PlannerInput, strategies: AdaptiveSegmentStrategy[]) {
  const avoidCount = strategies.filter((strategy) => strategy.generationRestraint === 'avoid_generation').length
  const aiCount = strategies.filter((strategy) =>
    strategy.generationRestraint === 'allow_generation' ||
    strategy.generationRestraint === 'prefer_generation' ||
    strategy.generationRestraint === 'premium_fallback_only',
  ).length

  return [
    `${avoidCount} segment strateg${avoidCount === 1 ? 'y avoids' : 'ies avoid'} generation where controlled tools, captions, b-roll, or speaker footage are better.`,
    `${aiCount} segment strateg${aiCount === 1 ? 'y allows' : 'ies allow'} AI-video only where motion improves the beat.`,
    input.editLevel === 'basic'
      ? 'Basic should reduce complexity instead of adding premium fallback costs.'
      : input.editLevel === 'premium'
        ? 'Premium may include fallback allowance, but Veo remains final fallback only.'
        : 'Pro can budget for Wan/Hailuo paths without Veo.',
  ]
}

export function createAdaptiveEditStrategyPlan({
  compiledIntent,
  input,
  professionalDirective,
  videoUnderstandingReport,
}: CreateAdaptiveEditStrategyPlanParams): AdaptiveEditStrategyPlan {
  const directive = professionalDirective ?? compiledIntent?.professionalEditingDirective ?? input.professionalEditingDirective
  const report = videoUnderstandingReport ?? input.videoUnderstandingReport
  const opportunities = (report?.visualSupportOpportunities.length ? report.visualSupportOpportunities : fallbackOpportunities(input, report))
    .slice(0, input.editLevel === 'basic' ? 6 : 9)
  const segmentStrategies = opportunities.map((opportunity, index) =>
    strategyFromOpportunity(opportunity, input, compiledIntent, directive, index),
  )
  const visualSummary = visualStrategySummary(segmentStrategies)
  const modelNotes = modelPolicyNotes(input, segmentStrategies)

  return {
    id: `adaptive-edit-strategy-plan-${input.editingCategory}-${input.editLevel}`,
    summary:
      segmentStrategies.length > 0
        ? `Adaptive strategy uses ${segmentStrategies.length} segment-level decision${segmentStrategies.length === 1 ? '' : 's'} from user intent and video understanding, balancing speaker focus, controlled visuals, and generation restraint for ${input.editLevel}.`
        : 'Adaptive strategy keeps the plan clean because no useful visual support decision was found.',
    hookStrategy: hookStrategy({ compiledIntent, input, report }),
    pacingStrategy: pacingStrategy({ directive, input, report }),
    visualStrategySummary: visualSummary,
    segmentStrategies,
    globalMustFollowRules: [
      'Use both user intent and video understanding before choosing visual/tool strategy.',
      'Explain why each segment uses speaker, visual, both, b-roll, card, map, chart, Stroke Motion, Real Motion, captions only, or no visual.',
      'Keep plan and credit approval before generation, rendering, or workers.',
      'Remotion owns final canvas/composition; providers generate assets or clips only.',
    ],
    globalAvoidRules: [
      'Do not apply visual systems by category alone.',
      'Do not add visuals without a segment reason.',
      'Do not use random b-roll, random transitions, random captions, or random visual effects.',
      'Do not use AI video for exact maps, charts, labels, screen captures, or data visuals when controlled tools/Remotion are better.',
    ],
    tierConstraints: [
      input.editLevel === 'basic'
        ? 'Basic is professional and lower-compute; avoid premium-risk generation and Veo.'
        : input.editLevel === 'premium'
          ? 'Premium allows deeper QA/fallback, but Veo is final fallback only.'
          : 'Pro is the balanced production tier with Wan primary, Hailuo fallback, and no Veo.',
    ],
    modelPolicyNotes: modelNotes,
    creditStrategyNotes: creditStrategyNotes(input, segmentStrategies),
    qaChecks: [
      'Every segment strategy has at least one user-intent and video-understanding reason.',
      'No visual is planned without a beat-level reason.',
      'Exact map/chart/screen strategies prefer controlled tools or Remotion over AI video.',
      'Basic and Pro do not use Veo; Premium keeps Veo final fallback only.',
      'Reference DNA guides style only and never overrides explicit instructions.',
    ],
    limitations: [
      'Mock-only adaptive strategy; no real media analysis has been run.',
      'No tools, providers, rendering, masks, tracking, backend, FFmpeg, OpenCV, Playwright, MapLibre, D3, or ECharts are executed.',
    ],
  }
}

function decisionForOpportunity(type: VisualSupportOpportunityType): string {
  switch (type) {
    case 'caption_only':
      return 'Keep this beat speaker-first with clean captions instead of adding a decorative visual.'
    case 'no_extra_visual':
      return 'Avoid extra visuals for this beat unless the user later asks for more visual density.'
    case 'b_roll_cutaway':
      return 'Use relevant uploaded b-roll when it clarifies the spoken point better than a generated asset.'
    case 'map_animation':
      return 'Plan a map-based visual only where geography, route, or location clarity improves the story.'
    case 'screen_capture':
      return 'Use a screen/product capture style visual for the exact interface or dashboard moment.'
    case 'chart_or_diagram':
      return 'Use a structured diagram or chart because the viewer needs relationships, flow, or numbers.'
    case 'evidence_board':
      return 'Use an evidence board only where names, timeline, source context, or claims need visual structure.'
    case 'stroke_motion':
      return 'Use Stroke Motion only if the beat benefits from emotional or narrative visualization.'
    case 'real_motion':
      return 'Consider Real Motion only when source-like motion improves the segment and tier/credits allow it.'
    case 'lower_panel_visual':
      return 'Keep the speaker primary and place the supporting visual in a compact panel.'
    case 'picture_in_picture':
      return 'Keep speaker presence while giving the visual most of the frame.'
    default:
      return `Use ${labelForOpportunity(type).toLowerCase()} only where it answers what the viewer needs to see.`
  }
}

function avoidRulesForOpportunity(input: PlannerInput, type: VisualSupportOpportunityType): string[] {
  const rules = [
    'Do not apply this visual because of category alone; it must support the exact beat.',
    'Do not override explicit user instructions, tier policy, safety rules, or approval gates.',
    'Do not execute tools or generate media in the frontend mock planner.',
  ]

  if (input.editLevel !== 'premium') {
    rules.push('Do not route Basic or Pro plans to Veo.')
  }

  if (type === 'caption_only' || type === 'no_extra_visual') {
    rules.push('Do not add an AI visual if the speaker, source video, and captions already carry the point.')
  }

  return rules
}

export function createAdaptiveEditStrategy({
  input,
  opportunities,
  compiledIntent,
}: CreateAdaptiveEditStrategyParams): AdaptiveEditStrategy {
  const uniqueOpportunities = opportunities.slice(0, 8)
  const items: AdaptiveStrategyItem[] = uniqueOpportunities.map((opportunity, index) => {
    const layoutMode = opportunity.suggestedLayoutMode ?? layoutForOpportunity(opportunity.opportunityType)
    const toolHints = toolHintsForOpportunity(
      opportunity.opportunityType,
      opportunity.suggestedToolHints,
    )

    return {
      id: `adaptive-strategy-${index + 1}`,
      clipId: opportunity.clipId,
      segmentId: opportunity.segmentId,
      label: opportunity.label,
      decision: decisionForOpportunity(opportunity.opportunityType),
      reason: opportunity.reason,
      userIntentInfluence:
        compiledIntent?.goalSummary ??
        input.customInstructions ??
        'User intent is inferred from the selected workflow, category, and edit settings.',
      videoUnderstandingInfluence: `The mock report identified a ${labelForOpportunity(
        opportunity.opportunityType,
      ).toLowerCase()} opportunity with ${opportunity.priority} priority.`,
      recommendedVisualSupport: opportunity.opportunityType,
      recommendedLayoutMode: layoutMode,
      recommendedToolHints: toolHints,
      avoidRules: avoidRulesForOpportunity(input, opportunity.opportunityType),
      qaChecks: [
        'Confirm the visual choice supports the spoken meaning for this beat.',
        'Confirm the chosen layout leaves captions and important subjects readable.',
        'Confirm credit impact matches the approved edit level.',
        ...opportunity.qaChecks,
      ],
    }
  })

  return {
    id: 'adaptive-edit-strategy-v1',
    summary:
      items.length > 0
        ? `Adaptive strategy uses ${items.length} video-specific opportunity${items.length === 1 ? '' : 's'} instead of a fixed ${input.editingCategory} template.`
        : 'Adaptive strategy keeps the edit clean because no extra visual opportunity was useful in the mock report.',
    items,
    globalRules: [
      'Select visuals per beat, not by category template.',
      'Explicit user instructions stay above mock video understanding.',
      'Use the simplest visual that clearly answers what the viewer needs to see.',
      'Keep provider generation and rendering behind approval and future worker boundaries.',
    ],
    notes: [
      'This strategy is deterministic mock planning only.',
      'Future media-analysis workers can replace the mock report while preserving this decision shape.',
    ],
  }
}
