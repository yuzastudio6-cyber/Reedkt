import type {
  AdaptiveEditStrategyPlan,
  AspectRatio,
  CompiledEditingIntent,
  FrameLayoutPlan,
  FrameTemplateType,
  PlannerInput,
  RectZone,
  RendererCompositionPlan,
  SegmentEditPlan,
  SpeakerVisualLayoutMode,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  VideoUnderstandingReport,
  VisualSupportOpportunityType,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { getDefaultLayoutForAsset, getSpeakerVisualLayoutMode } from './speaker-visual-layouts'

type CreateSpeakerVisualLayoutPlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  rendererCompositionPlan?: RendererCompositionPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}

type LayoutSeed = {
  segment?: SegmentEditPlan
  asset?: VisualAssetPlanItem
  index: number
}

const fullTakeoverModes: SpeakerVisualLayoutMode[] = [
  'voiceover_visual_takeover',
  'full_graphic_explainer',
  'full_stroke_motion_scene',
  'full_map_takeover',
  'full_evidence_board',
  'split_screen_comparison',
]

function frameTemplateTypeForLayout(mode: SpeakerVisualLayoutMode, aspectRatio: AspectRatio, requested?: FrameTemplateType): FrameTemplateType {
  if (requested && requested !== 'let_ai_decide') {
    return requested
  }

  if (aspectRatio === '16:9') {
    return mode === 'lower_visual_panel' || mode === 'vertical_speaker_top_visual_bottom'
      ? 'youtube_lower_panel'
      : 'youtube_side_panel'
  }

  if (aspectRatio === '1:1') {
    return 'square_center_panel'
  }

  if (aspectRatio === '4:5') {
    return 'portrait_feed_lower_panel'
  }

  if (aspectRatio === '4:3') {
    return 'classic_documentary_center_panel'
  }

  if (fullTakeoverModes.includes(mode) || mode === 'screen_capture_with_speaker_pip') {
    return 'vertical_full_panel'
  }

  return 'vertical_talking_head_lower_panel'
}

function resolveFrameTemplate(input: PlannerInput, mode: SpeakerVisualLayoutMode, rendererCompositionPlan?: RendererCompositionPlan) {
  if (rendererCompositionPlan?.frameTemplate) {
    return rendererCompositionPlan.frameTemplate
  }

  if (input.aspectRatioFramePlan?.status === 'confirmed' && input.aspectRatioFramePlan.frameTemplateType) {
    return getFrameLayoutTemplate(input.aspectRatioFramePlan.frameTemplateType)
  }

  const templateType = frameTemplateTypeForLayout(mode, input.aspectRatio, input.frameTemplateType)

  if (templateType !== 'let_ai_decide') {
    return getFrameLayoutTemplate(templateType)
  }

  return getDefaultFrameTemplateForAspectRatio(input.aspectRatio)
}

function fullCanvas(frameTemplate: FrameLayoutPlan, label = 'Full canvas visual zone'): RectZone {
  return {
    x: frameTemplate.safeMargin,
    y: frameTemplate.safeMargin,
    width: frameTemplate.canvasWidth - frameTemplate.safeMargin * 2,
    height: frameTemplate.canvasHeight - frameTemplate.safeMargin * 2,
    label,
    notes: 'Full visual zone inside ReeditPro safe margins.',
  }
}

function pipZone(frameTemplate: FrameLayoutPlan): RectZone {
  const width = Math.round(frameTemplate.canvasWidth * 0.24)
  const height = Math.round(frameTemplate.canvasHeight * 0.22)

  return {
    x: frameTemplate.canvasWidth - width - frameTemplate.safeMargin,
    y: frameTemplate.safeMargin,
    width,
    height,
    label: 'Speaker PIP zone',
    notes: 'Speaker picture-in-picture placement remains caption-safe.',
  }
}

function speakerLowerZone(frameTemplate: FrameLayoutPlan): RectZone {
  return {
    x: frameTemplate.safeMargin,
    y: Math.round(frameTemplate.canvasHeight * 0.58),
    width: frameTemplate.canvasWidth - frameTemplate.safeMargin * 2,
    height: Math.round(frameTemplate.canvasHeight * 0.28),
    label: 'Lower speaker/source zone',
    notes: 'Speaker remains visible below the visual in a vertical split.',
  }
}

function visualTopZone(frameTemplate: FrameLayoutPlan): RectZone {
  return {
    x: frameTemplate.safeMargin,
    y: frameTemplate.safeMargin,
    width: frameTemplate.canvasWidth - frameTemplate.safeMargin * 2,
    height: Math.round(frameTemplate.canvasHeight * 0.48),
    label: 'Top visual zone',
    notes: 'Visual leads the segment while preserving a lower speaker zone.',
  }
}

function layoutZones(mode: SpeakerVisualLayoutMode, frameTemplate: FrameLayoutPlan) {
  const defaultSpeaker = frameTemplate.speakerZone ?? fullCanvas(frameTemplate, 'Speaker/source zone')
  const defaultVisual = frameTemplate.animationZone

  if (mode === 'full_speaker') {
    return {
      speakerZone: defaultSpeaker,
      visualZone: undefined,
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'picture_in_picture_speaker' || mode === 'screen_capture_with_speaker_pip') {
    return {
      speakerZone: pipZone(frameTemplate),
      visualZone: fullCanvas(frameTemplate, mode === 'screen_capture_with_speaker_pip' ? 'Screen capture visual zone' : 'Dominant visual zone'),
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'side_by_side_speaker_visual') {
    return {
      speakerZone: defaultSpeaker,
      visualZone: defaultVisual,
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'vertical_visual_top_speaker_bottom') {
    return {
      speakerZone: speakerLowerZone(frameTemplate),
      visualZone: visualTopZone(frameTemplate),
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'vertical_speaker_top_visual_bottom' || mode === 'lower_visual_panel') {
    return {
      speakerZone: defaultSpeaker,
      visualZone: defaultVisual,
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'speaker_cutout_overlay' || mode === 'object_anchored_callout') {
    return {
      speakerZone: defaultSpeaker,
      visualZone: fullCanvas(frameTemplate, mode === 'object_anchored_callout' ? 'Future object callout zone' : 'Future speaker cutout composite zone'),
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  if (mode === 'b_roll_cutaway' || mode === 'before_after_panel') {
    return {
      speakerZone: undefined,
      visualZone: fullCanvas(frameTemplate, mode === 'b_roll_cutaway' ? 'B-roll cutaway zone' : 'Before/after panel zone'),
      captionZone: frameTemplate.captionSafeZone,
    }
  }

  return {
    speakerZone: undefined,
    visualZone: fullCanvas(frameTemplate),
    captionZone: frameTemplate.captionSafeZone,
  }
}

function segmentSeeds(segmentEditPlans: SegmentEditPlan[] | undefined, visualAssetPlan: VisualAssetPlanItem[] | undefined): LayoutSeed[] {
  if (segmentEditPlans?.length) {
    return segmentEditPlans.map((segment, index) => ({
      segment,
      asset: visualAssetPlan?.find((asset) => segment.visualAssetPlanItemIds.includes(asset.id)),
      index,
    }))
  }

  return (visualAssetPlan ?? []).map((asset, index) => ({ asset, index }))
}

function modeNeedsFallback(mode: SpeakerVisualLayoutMode) {
  const definition = getSpeakerVisualLayoutMode(mode)

  return Boolean(
    definition &&
      (definition.complexity === 'moderate' ||
        definition.complexity === 'advanced' ||
        definition.complexity === 'premium' ||
        definition.riskLevel === 'medium' ||
        definition.riskLevel === 'high' ||
        definition.riskLevel === 'premium'),
  )
}

function fallbackFor(mode: SpeakerVisualLayoutMode, aspectRatio: AspectRatio): SpeakerVisualLayoutMode | undefined {
  const definition = getSpeakerVisualLayoutMode(mode)

  if (mode === 'side_by_side_speaker_visual' && aspectRatio === '9:16') {
    return 'lower_visual_panel'
  }

  return definition?.fallbackLayoutMode ?? (modeNeedsFallback(mode) ? 'lower_visual_panel' : undefined)
}

function reportOpportunityTypes(report?: VideoUnderstandingReport): VisualSupportOpportunityType[] {
  if (!report) return []
  return Array.from(new Set(report.visualSupportOpportunities.map((opportunity) => opportunity.opportunityType)))
}

function hasOpportunity(types: VisualSupportOpportunityType[], candidates: VisualSupportOpportunityType[]) {
  return candidates.some((candidate) => types.includes(candidate))
}

function layoutModeFromVideoUnderstanding(params: {
  input: PlannerInput
  report?: VideoUnderstandingReport
  seed: LayoutSeed
}): SpeakerVisualLayoutMode | undefined {
  const { input, report, seed } = params
  const types = reportOpportunityTypes(report)
  const seedText = `${seed.segment?.label ?? ''} ${seed.segment?.storyPurpose ?? ''} ${seed.asset?.beatLabel ?? ''} ${seed.asset?.storyPurpose ?? ''} ${seed.asset?.reason ?? ''}`.toLowerCase()

  if (!report || types.length === 0) {
    return undefined
  }

  if (hasOpportunity(types, ['screen_capture']) || /screen|dashboard|website|app|browser|saas/.test(seedText)) {
    return 'screen_capture_with_speaker_pip'
  }

  if (hasOpportunity(types, ['map_animation']) || /map|route|location|city|geography|neighborhood/.test(seedText)) {
    return input.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'full_map_takeover'
  }

  if (
    hasOpportunity(types, ['evidence_board']) ||
    /evidence|claim|proof|source|case|investigation/.test(seedText)
  ) {
    return 'full_evidence_board'
  }

  if (
    hasOpportunity(types, ['chart_or_diagram', 'graphic_explainer', 'timeline_card', 'fact_card']) ||
    /diagram|chart|flow|framework|timeline|explain/.test(seedText)
  ) {
    return input.aspectRatio === '9:16' && input.editLevel === 'basic'
      ? 'lower_visual_panel'
      : 'full_graphic_explainer'
  }

  if (
    hasOpportunity(types, ['lower_panel_visual']) ||
    report.visualUnderstanding.emptySpaceOpportunities.some((note) => /lower panel/i.test(note))
  ) {
    return 'lower_visual_panel'
  }

  if (
    hasOpportunity(types, ['stroke_motion']) &&
    (report.transcriptMeaning.emotionalLines.length > 0 || /emotion|reaction|story|trust/.test(seedText))
  ) {
    return 'full_speaker'
  }

  if (report.visualUnderstanding.depthCompositionOpportunities.length > 0 && input.editLevel !== 'basic') {
    return input.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'picture_in_picture_speaker'
  }

  return undefined
}

function strategyForSeed(plan: AdaptiveEditStrategyPlan | undefined, seed: LayoutSeed) {
  if (!plan) {
    return undefined
  }

  return plan.segmentStrategies.find((strategy, index) =>
    strategy.segmentId === seed.segment?.id ||
    Boolean(strategy.clipId && seed.segment?.sourceClipIds.includes(strategy.clipId)) ||
    strategy.recommendedAssetType === seed.asset?.assetType ||
    index === seed.index,
  )
}

function reasonForItem(params: {
  mode: SpeakerVisualLayoutMode
  input: PlannerInput
  asset?: VisualAssetPlanItem
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  segment?: SegmentEditPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}) {
  const { adaptiveEditStrategyPlan, asset, input, mode, segment, videoUnderstandingReport } = params
  const adaptiveStrategy = adaptiveEditStrategyPlan?.segmentStrategies.find((strategy) =>
    strategy.segmentId === segment?.id ||
    Boolean(strategy.clipId && segment?.sourceClipIds.includes(strategy.clipId)) ||
    strategy.recommendedAssetType === asset?.assetType,
  )
  const parts = [
    segment ? `${segment.label} asks what the viewer needs to see during this segment.` : undefined,
    asset ? `${asset.beatLabel} uses ${asset.assetType.replaceAll('_', ' ')} because ${asset.reason}` : undefined,
    adaptiveStrategy ? `Adaptive strategy recommends ${adaptiveStrategy.recommendedLayoutMode?.replaceAll('_', ' ') ?? 'layout auto'} because ${adaptiveStrategy.reasons[0]?.explanation}` : undefined,
    input.editLevel === 'basic'
      ? 'Basic keeps the layout professional and lower-compute.'
      : input.editLevel === 'premium'
        ? 'Premium can plan stronger layout variety while keeping fallback-only Veo policy.'
        : 'Pro can use richer layout planning while keeping Veo locked.',
    `Selected layout mode: ${mode.replaceAll('_', ' ')}.`,
    videoUnderstandingReport
      ? `Video understanding influence: ${videoUnderstandingReport.visualSupportOpportunities.slice(0, 2).map((opportunity) => opportunity.opportunityType.replaceAll('_', ' ')).join(', ') || 'speaker/source footage carries the beat'}.`
      : undefined,
  ]

  return parts.filter(Boolean).join(' ')
}

function itemFromSeed(params: {
  seed: LayoutSeed
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  rendererCompositionPlan?: RendererCompositionPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}): SpeakerVisualLayoutPlanItem {
  const { adaptiveEditStrategyPlan, compiledIntent, input, rendererCompositionPlan, seed, videoUnderstandingReport } = params
  const adaptiveStrategy = strategyForSeed(adaptiveEditStrategyPlan, seed)
  const defaultDefinition = getDefaultLayoutForAsset({
    asset: seed.asset,
    input,
    segment: seed.segment,
  })
  const understandingMode =
    adaptiveStrategy?.recommendedLayoutMode ??
    layoutModeFromVideoUnderstanding({ input, report: videoUnderstandingReport, seed }) ??
    defaultDefinition.id
  const definition = getSpeakerVisualLayoutMode(understandingMode) ?? defaultDefinition
  const frameTemplate = resolveFrameTemplate(input, definition.id, rendererCompositionPlan)
  const zones = layoutZones(definition.id, frameTemplate)
  const fallbackLayoutMode = fallbackFor(definition.id, input.aspectRatio)
  const frameGateNotes = input.aspectRatioFramePlan?.status === 'confirmed'
    ? [`Confirmed output frame: ${input.aspectRatioFramePlan.selectedAspectRatio} / ${input.aspectRatioFramePlan.canvasWidth}x${input.aspectRatioFramePlan.canvasHeight}.`]
    : ['Draft layout only until the output frame is confirmed.']
  const futurePlanningNotes =
    definition.id === 'speaker_cutout_overlay' || definition.id === 'object_anchored_callout'
      ? ['This is placeholder planning only; no real masking, depth-aware contact preservation, or object tracking is executed.']
      : []

  return {
    id: `speaker-visual-layout-${seed.segment?.id ?? seed.asset?.id ?? seed.index + 1}`,
    segmentId: seed.segment?.id,
    assetPlanItemId: seed.asset?.id,
    layoutMode: definition.id,
    speakerPresence: definition.defaultSpeakerPresence,
    visualDominance: definition.defaultVisualDominance,
    frameTemplateType: frameTemplate.templateType,
    platformFit: input.targetPlatform,
    recommendedForAspectRatio: frameTemplate.aspectRatio,
    speakerZone: zones.speakerZone,
    visualZone: zones.visualZone,
    captionZone: zones.captionZone,
    safeMargin: frameTemplate.safeMargin,
    panelBackgroundColor: frameTemplate.panelBackgroundColor,
    complexity: definition.complexity,
    riskLevel: definition.riskLevel,
    tierAvailability: definition.tierAvailability,
    preferredTools: definition.preferredTools,
    reason: reasonForItem({
      adaptiveEditStrategyPlan,
      asset: seed.asset,
      input,
      mode: definition.id,
      segment: seed.segment,
      videoUnderstandingReport,
    }),
    avoidRules: [
      ...definition.avoidUseCases.map((avoidUseCase) => `Avoid ${avoidUseCase}.`),
      ...(compiledIntent?.avoidRules.slice(0, 2) ?? []),
    ],
    fallbackLayoutMode,
    promptImplications: [
      ...frameGateNotes,
      ...definition.promptImplications,
      ...(videoUnderstandingReport
        ? [
            `Video understanding context: ${videoUnderstandingReport.visualSupportOpportunities
              .slice(0, 2)
              .map((opportunity) => opportunity.label)
              .join('; ') || 'speaker/source footage remains primary'}.`,
          ]
        : []),
      ...(adaptiveStrategy
        ? [
            `Adaptive strategy decision: ${adaptiveStrategy.decisionKind.replaceAll('_', ' ')}; visual support ${adaptiveStrategy.recommendedVisualSupport.replaceAll('_', ' ')}.`,
          ]
        : []),
      ...futurePlanningNotes,
    ],
    remotionNotes: [
      ...frameGateNotes,
      ...definition.remotionNotes,
      'Remotion owns final layout/composition; AI models generate assets or clips only.',
      ...futurePlanningNotes,
    ],
    qaChecks: [
      ...definition.qaChecks,
      'Captions do not cover face, visual text, or important objects.',
      'Layout matches the approved aspect ratio and frame safe zones.',
      'Panel background matches generated asset background.',
      ...(fallbackLayoutMode ? ['Fallback layout is planned for this layout mode.'] : []),
    ],
  }
}

export function createSpeakerVisualLayoutPlan(params: CreateSpeakerVisualLayoutPlanParams): SpeakerVisualLayoutPlan {
  const { adaptiveEditStrategyPlan, compiledIntent, input, rendererCompositionPlan, segmentEditPlans, videoUnderstandingReport, visualAssetPlan } = params
  const seeds = segmentSeeds(segmentEditPlans, visualAssetPlan)
  const items = seeds.map((seed) =>
    itemFromSeed({ adaptiveEditStrategyPlan, compiledIntent, input, rendererCompositionPlan, seed, videoUnderstandingReport }),
  )
  const modes = Array.from(new Set(items.map((item) => item.layoutMode)))
  const visibleSpeakerCount = items.filter((item) => item.speakerPresence !== 'voice_only' && item.speakerPresence !== 'hidden').length
  const fullTakeoverCount = items.filter((item) => item.visualDominance === 'full_takeover').length

  return {
    id: `speaker-visual-layout-plan-${input.editingCategory}-${input.editLevel}`,
    summary:
      items.length > 0
        ? `${items.length} segment-based layout decision${items.length === 1 ? '' : 's'} planned across ${modes.length} mode${modes.length === 1 ? '' : 's'}; ${visibleSpeakerCount} keep speaker visible and ${fullTakeoverCount} use full visual takeover.`
        : 'No speaker/visual layout items were needed for this mock plan.',
    items,
    globalRules: [
      'Ask what the viewer needs to see in each segment.',
      'Keep speaker visible when trust, emotion, authenticity, or personal story matters.',
      'Let visuals take over when explanation, evidence, map, chart, timeline, diagram, or screen capture needs space.',
      'Basic uses safer layout modes; Pro and Premium can plan richer layouts when useful.',
      'Remotion owns final layout/composition; AI models generate assets or clips only.',
      'Future depth-aware masking, speaker cutouts, and object tracking are not implemented in this milestone.',
    ],
    qaChecks: [
      'Speaker visible when required by layout strategy.',
      'Speaker hidden or voice-only when full visual takeover is intended.',
      'Visual has enough space for detail and readable text.',
      'Captions avoid speaker, visual text, and important objects.',
      'Layout mode fits aspect ratio and platform.',
      'Fallback layout exists for risky modes.',
      'Basic avoids advanced risky layouts.',
    ],
    notes: [
      'Deterministic frontend mock only.',
      input.aspectRatioFramePlan?.status === 'confirmed'
        ? `Layouts use confirmed output frame ${input.aspectRatioFramePlan.selectedAspectRatio}.`
        : 'Layouts are draft until the user confirms the output frame.',
      'No real segmentation, masking, tracking, OpenCV processing, rendering, or provider calls are performed.',
      input.editLevel === 'premium'
        ? 'Premium may plan advanced layout ideas, but Veo remains final fallback only.'
        : 'Basic/Pro layout planning keeps Veo unavailable.',
    ],
  }
}
