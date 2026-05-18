import type {
  AdaptiveEditStrategyPlan,
  AdaptiveSegmentStrategy,
  AssetColorMatchPlan,
  AudioPipelinePlan,
  CompiledEditingIntent,
  CharacterConsistencyPlan,
  ColorPipelinePlan,
  DataVizPlan,
  DepthAwareOverlayPlan,
  DepthAwareOverlayPlanItem,
  DocumentaryFactSafetyPlan,
  FrameLayoutPlan,
  MapAnimationPlan,
  PlannerInput,
  ProfessionalEditingDirective,
  PromptConstraint,
  ProviderModel,
  ProviderPromptPlan,
  RenderStrategyPlan,
  RenderStrategyPlanItem,
  RenderStrategyType,
  RendererCompositionPlan,
  SegmentEditPlan,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  ToolStrategyPlan,
  ToolStrategyPlanItem,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { styleModes, type StyleMode } from './style-modes'

type BasePromptParams = {
  asset: VisualAssetPlanItem
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  frameTemplate?: FrameLayoutPlan
  styleMode?: StyleMode
  segment?: SegmentEditPlan
  rendererCompositionPlan?: RendererCompositionPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  speakerVisualLayoutItem?: SpeakerVisualLayoutPlanItem
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  depthAwareOverlayItem?: DepthAwareOverlayPlanItem
  renderStrategyPlan?: RenderStrategyPlan
  renderStrategyItem?: RenderStrategyPlanItem
  toolStrategyPlan?: ToolStrategyPlan
  toolStrategyItems?: ToolStrategyPlanItem[]
  colorPipelinePlan?: ColorPipelinePlan
  assetColorMatchPlan?: AssetColorMatchPlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}

type BuildEditPromptPlansParams = {
  input: PlannerInput
  visualAssetPlan: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  rendererCompositionPlan?: RendererCompositionPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}

const cardAssetTypes = ['fact_card', 'name_card', 'character_card', 'list_card', 'timeline_card'] as const

function compactLines(lines: Array<string | undefined | false>) {
  return lines.filter(Boolean).join('\n')
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function zoneLabel(zone: SpeakerVisualLayoutPlanItem['visualZone'] | SpeakerVisualLayoutPlanItem['speakerZone'] | SpeakerVisualLayoutPlanItem['captionZone']) {
  if (!zone) {
    return 'none'
  }

  return `${zone.label ?? 'zone'} ${zone.width}x${zone.height} at ${zone.x},${zone.y}`
}

function layoutItemForAsset(params: {
  asset: VisualAssetPlanItem
  segment?: SegmentEditPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
}) {
  const { asset, segment, speakerVisualLayoutPlan } = params

  return speakerVisualLayoutPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.id === asset.speakerVisualLayoutItemId ||
    item.id === segment?.speakerVisualLayoutItemId,
  )
}

function depthItemForAsset(params: {
  asset: VisualAssetPlanItem
  segment?: SegmentEditPlan
  speakerVisualLayoutItem?: SpeakerVisualLayoutPlanItem
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
}) {
  const { asset, depthAwareOverlayPlan, segment, speakerVisualLayoutItem } = params

  return depthAwareOverlayPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.speakerVisualLayoutItemId === speakerVisualLayoutItem?.id ||
    item.id === asset.depthAwareOverlayItemId ||
    item.id === segment?.depthAwareOverlayItemId,
  )
}

function renderStrategyForPrompt(params: {
  asset: VisualAssetPlanItem
  segment?: SegmentEditPlan
  renderStrategyPlan?: RenderStrategyPlan
}): RenderStrategyPlanItem | undefined {
  const { asset, renderStrategyPlan, segment } = params

  return renderStrategyPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.id === asset.renderStrategyItemId ||
    Boolean(item.assetPlanItemId && segment?.visualAssetPlanItemIds.includes(item.assetPlanItemId)),
  )
}

function toolStrategyForPrompt(params: {
  asset: VisualAssetPlanItem
  renderStrategyItem?: RenderStrategyPlanItem
  segment?: SegmentEditPlan
  toolStrategyPlan?: ToolStrategyPlan
}) {
  const { asset, renderStrategyItem, segment, toolStrategyPlan } = params

  return toolStrategyPlan?.items.filter((item) =>
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.renderStrategyItemId === renderStrategyItem?.id ||
    Boolean(asset.toolStrategyItemIds?.includes(item.id)) ||
    Boolean(segment?.toolStrategyItemIds?.includes(item.id)) ||
    Boolean(renderStrategyItem?.toolStrategyItemIds?.includes(item.id)),
  ) ?? []
}

function colorMatchPlanForPrompt(params: {
  asset: VisualAssetPlanItem
  colorPipelinePlan?: ColorPipelinePlan
}) {
  const { asset, colorPipelinePlan } = params

  return colorPipelinePlan?.assetMatchPlans.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.id === asset.colorMatchPlanId,
  )
}

function adaptiveStrategyForPrompt(params: {
  asset: VisualAssetPlanItem
  segment?: SegmentEditPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
}): AdaptiveSegmentStrategy | undefined {
  const { adaptiveEditStrategyPlan, asset, segment } = params

  return adaptiveEditStrategyPlan?.segmentStrategies.find((strategy) =>
    strategy.segmentId === segment?.id ||
    Boolean(strategy.clipId && segment?.sourceClipIds.includes(strategy.clipId)) ||
    strategy.recommendedAssetType === asset.assetType ||
    strategy.recommendedSignatureSystem === asset.signatureSystem ||
    asset.reason.toLowerCase().includes(strategy.decisionKind.replaceAll('_', ' ')),
  )
}

function getStyleMode(styleModeId?: string) {
  return styleModes.find((styleMode) => styleMode.id === styleModeId)
}

function resolveFrameTemplate(input: PlannerInput, asset?: VisualAssetPlanItem) {
  const templateType = asset?.frameTemplateType ?? input.frameTemplateType

  if (templateType && templateType !== 'let_ai_decide') {
    return getFrameLayoutTemplate(templateType)
  }

  return getDefaultFrameTemplateForAspectRatio(input.aspectRatio)
}

function segmentForAsset(segments: SegmentEditPlan[] | undefined, assetId: string) {
  return segments?.find((segment) => segment.visualAssetPlanItemIds.includes(assetId))
}

function targetProviderForModel(model: ProviderModel): ProviderPromptPlan['targetProvider'] {
  if (model === 'gpt_image_2') {
    return 'gpt_image_2'
  }

  if (model.startsWith('wan')) {
    return 'wan'
  }

  if (model.startsWith('hailuo')) {
    return 'hailuo'
  }

  if (model === 'veo_3_1_lite') {
    return 'veo'
  }

  if (model === 'remotion_editor_motion') {
    return 'remotion'
  }

  if (model === 'svg_lottie_renderer') {
    return 'editor_motion'
  }

  return 'none'
}

function commonConstraints(params: BasePromptParams, providerModel: ProviderModel): PromptConstraint[] {
  const {
    asset,
    adaptiveEditStrategyPlan,
    characterConsistencyPlan,
    compiledIntent,
    depthAwareOverlayItem,
    documentaryFactSafetyPlan,
    frameTemplate,
    input,
    professionalDirective,
    renderStrategyItem,
    speakerVisualLayoutItem,
    styleMode,
    toolStrategyItems = [],
    colorPipelinePlan,
    audioPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    assetColorMatchPlan,
    videoUnderstandingReport,
  } = params
  const panelBackground = frameTemplate?.panelBackgroundColor ?? '#FFFFFF'
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)
  const report = videoUnderstandingReport ?? input.videoUnderstandingReport
  const adaptiveStrategy = adaptiveStrategyForPrompt({ adaptiveEditStrategyPlan, asset, segment: params.segment })
  const constraints: PromptConstraint[] = [
    {
      id: `${asset.id}-constraint-story`,
      label: 'Story purpose',
      instruction: `Support this beat only: ${asset.storyPurpose}`,
      source: 'user_intent',
      required: true,
    },
    {
      id: `${asset.id}-constraint-style`,
      label: 'Professional direction',
      instruction: `Use ${label(professionalDirective?.editStyle)} editing style, ${label(professionalDirective?.colorGradeStyle)} color direction, and avoid random visuals.`,
      source: 'professional_editing_directive',
      required: true,
    },
    {
      id: `${asset.id}-constraint-style-mode`,
      label: 'Style mode',
      instruction: styleMode?.promptNotes ?? 'Use the selected visual style mode without drifting.',
      source: 'style_mode',
      required: Boolean(styleMode),
    },
    {
      id: `${asset.id}-constraint-frame`,
      label: 'Frame panel',
      instruction: `Use matching panel background ${panelBackground}; keep action inside safe margins and animation panel.`,
      source: 'frame_layout',
      required: true,
    },
    {
      id: `${asset.id}-constraint-speaker-visual-layout`,
      label: 'Speaker/visual layout',
      instruction: speakerVisualLayoutItem
        ? `Layout mode: ${label(speakerVisualLayoutItem.layoutMode)}. Speaker presence: ${label(speakerVisualLayoutItem.speakerPresence)}. Visual dominance: ${label(speakerVisualLayoutItem.visualDominance)}. Visual zone: ${zoneLabel(speakerVisualLayoutItem.visualZone)}. Caption zone: ${zoneLabel(speakerVisualLayoutItem.captionZone)}.`
        : 'Use the approved frame layout and do not assume one fixed layout for every segment.',
      source: 'frame_layout',
      required: true,
    },
    {
      id: `${asset.id}-constraint-video-understanding`,
      label: 'Video understanding',
      instruction: report
        ? `Use the mock understanding only as planning context: ${report.visualSupportOpportunities
            .slice(0, 2)
            .map((opportunity) => `${opportunity.opportunityType.replaceAll('_', ' ')} because ${opportunity.reason}`)
            .join(' ')}`
        : 'No video understanding report is attached; do not infer real media analysis.',
      source: 'video_understanding',
      required: Boolean(report),
    },
    {
      id: `${asset.id}-constraint-adaptive-strategy`,
      label: 'Adaptive strategy',
      instruction: adaptiveStrategy
        ? `Decision: ${label(adaptiveStrategy.decisionKind)}. Generation restraint: ${label(adaptiveStrategy.generationRestraint)}. Use ${label(adaptiveStrategy.recommendedVisualSupport)} because ${adaptiveStrategy.reasons.map((reason) => reason.explanation).slice(0, 2).join(' ')}`
        : 'No adaptive segment strategy is attached; do not add visuals without a reason.',
      source: 'adaptive_strategy',
      required: Boolean(adaptiveStrategy),
    },
    {
      id: `${asset.id}-constraint-render-strategy`,
      label: 'Render strategy',
      instruction: renderStrategyItem
        ? `Render strategy: ${label(renderStrategyItem.strategyType)}. Remotion capabilities: ${renderStrategyItem.selectedRemotionCapabilities.map(label).join(', ') || 'none'}. Tools: ${renderStrategyItem.selectedOpenSourceTools.map(label).join(', ') || 'none'}. Needs GPT-Image: ${renderStrategyItem.needsGptImage ? 'yes' : 'no'}. Needs AI video: ${renderStrategyItem.needsAiVideo ? 'yes' : 'no'}. Remotion owns final composition.`
        : 'No render strategy item is attached; keep provider output asset-scoped and let Remotion own final composition.',
      source: 'render_strategy',
      required: Boolean(renderStrategyItem),
    },
    {
      id: `${asset.id}-constraint-tool-strategy`,
      label: 'Tool strategy',
      instruction: toolStrategyItems.length
        ? `Tool chains: ${toolStrategyItems.map((item) => `${label(item.chainId)} using ${item.selectedToolIds.map(label).join(', ')}`).join('; ')}. ${toolStrategyItems.map((item) => item.whyNotAiVideo).filter(Boolean).join(' ')} Planning only; no tool execution.`
        : 'No tool strategy item is attached; do not invent tool execution.',
      source: 'tool_strategy',
      required: toolStrategyItems.length > 0,
    },
    {
      id: `${asset.id}-constraint-color-pipeline`,
      label: 'Color pipeline',
      instruction: colorPipelinePlan
        ? `Match the planned ${label(colorPipelinePlan.colorGradeStyle)} ${colorPipelinePlan.intensity} color pipeline. ${assetColorMatchPlan ? `Asset color match plan: ${assetColorMatchPlan.operations.map((operation) => label(operation.operation)).join(', ')}.` : 'Use the project color rules.'} No real color processing is implied.`
        : 'No color pipeline plan is attached; preserve clean professional color and matching panel background.',
      source: 'color_pipeline',
      required: Boolean(colorPipelinePlan),
    },
    {
      id: `${asset.id}-constraint-audio-pipeline`,
      label: 'Audio + SoundSync',
      instruction: audioPipelinePlan
        ? `SoundSync plan: ${label(audioPipelinePlan.soundStyle)} ${audioPipelinePlan.audioIntensity}. Music policy: ${label(audioPipelinePlan.musicBedPlan.policy)}. SFX policy: ${label(audioPipelinePlan.sfxPlan.policy)}. Cues guide timing only; most image/video provider assets should stay silent unless a future route explicitly supports audio.`
        : 'No audio pipeline plan is attached; keep provider output visual-only and do not invent audio generation.',
      source: 'audio_pipeline',
      required: Boolean(audioPipelinePlan),
    },
    {
      id: `${asset.id}-constraint-map-animation`,
      label: 'Map + location plan',
      instruction: mapAnimationPlan?.active
        ? `Map plan is active with ${mapAnimationPlan.items.length} item(s). Exact maps use controlled MapLibre/Turf/Remotion planning, not AI video. ${mapAnimationPlan.items.map((item) => `${label(item.mapVisualType)}: ${item.locations.map((location) => `${location.safeWording} (${label(location.confidence)})`).join(', ')}`).slice(0, 2).join(' ')}`
        : 'No active map/location plan is attached; do not invent exact map geography.',
      source: 'map_animation',
      required: Boolean(mapAnimationPlan?.active),
    },
    {
      id: `${asset.id}-constraint-dataviz`,
      label: 'Chart + diagram plan',
      instruction: dataVizPlan?.active
        ? `Chart/diagram plan is active with ${dataVizPlan.items.length} item(s). Exact charts, labels, arrows, numbers, timelines, and data use controlled D3/ECharts/Remotion planning, not AI video. ${dataVizPlan.items.map((item) => `${label(item.visualType)}: ${item.dataPlan.safeWording} (${label(item.dataPlan.confidence)})`).slice(0, 2).join(' ')}`
        : 'No active chart/diagram plan is attached; do not invent exact charts, data, labels, arrows, or numbers.',
      source: 'dataviz_plan',
      required: Boolean(dataVizPlan?.active),
    },
    {
      id: `${asset.id}-constraint-route`,
      label: 'Provider route',
      instruction: `Provider model: ${providerModel}. Resolution: ${asset.providerRoute.resolution}. Duration: ${asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds || 0}s.`,
      source: 'provider_route',
      required: true,
    },
    {
      id: `${asset.id}-constraint-depth-aware-overlay`,
      label: 'Depth-aware composition',
      instruction: depthAwareOverlayItem
        ? `Depth mode: ${label(depthAwareOverlayItem.depthCompositingMode)}. Mask strategy: ${label(depthAwareOverlayItem.maskStrategy)}. Caption rule: ${depthAwareOverlayItem.captionLayerRule} This is planning only; do not solve real masking in the provider output.`
        : 'No depth-aware overlay is planned unless the approved layout/depth plan says so.',
      source: 'frame_layout',
      required: Boolean(depthAwareOverlayItem),
    },
    {
      id: `${asset.id}-constraint-tier`,
      label: 'Tier policy',
      instruction:
        input.editLevel === 'premium'
          ? 'Premium may use Veo Lite only as final fallback/rescue when explicitly routed.'
          : 'Basic and Pro cannot use Veo Lite.',
      source: 'tier_policy',
      required: true,
    },
    {
      id: `${asset.id}-constraint-safety`,
      label: 'Safety and QA',
      instruction: 'No random extra characters, unrelated scenery, style drift, face/product obstruction, transparent AI-video route by default, or generated-video 1080P route.',
      source: 'qa',
      required: true,
    },
  ]

  if (compiledIntent?.avoidRules.length) {
    constraints.push({
      id: `${asset.id}-constraint-avoid`,
      label: 'Avoid rules',
      instruction: compiledIntent.avoidRules.slice(0, 4).join(' '),
      source: 'user_intent',
      required: true,
    })
  }

  if (characterPacks.length > 0) {
    constraints.push({
      id: `${asset.id}-constraint-character-pack`,
      label: 'Character consistency',
      instruction: characterPacks.map((pack) => `${pack.displayName}: preserve ${pack.importance} pack identity, outfit/silhouette/style, and expression range.`).join(' '),
      source: 'safety',
      required: true,
    })
  }

  if (factSafetyItems.length > 0) {
    constraints.push({
      id: `${asset.id}-constraint-fact-safety`,
      label: 'Fact safety',
      instruction: factSafetyItems.map((item) => `${item.claimStatus}: ${item.safeWording}; visual treatment ${item.visualTreatment}.`).join(' '),
      source: 'safety',
      required: true,
    })
  }

  return constraints
}

function commonSafeMarginNotes(
  frameTemplate?: FrameLayoutPlan,
  layoutItem?: SpeakerVisualLayoutPlanItem,
  depthItem?: DepthAwareOverlayPlanItem,
  videoUnderstandingReport?: VideoUnderstandingReport,
) {
  return [
    `Frame template: ${frameTemplate?.templateType ?? 'auto frame'}.`,
    `Panel background: ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
    `Safe margin: ${frameTemplate?.safeMargin ?? 0}px in the final ReeditPro frame plan.`,
    layoutItem ? `Speaker/visual layout mode: ${label(layoutItem.layoutMode)}.` : 'Speaker/visual layout mode: auto.',
    layoutItem ? `Visual zone: ${zoneLabel(layoutItem.visualZone)}.` : undefined,
    layoutItem ? `Caption zone: ${zoneLabel(layoutItem.captionZone)}.` : undefined,
    'Keep important action inside the animation panel and away from caption/face/product zones.',
    'Use matching panel background; do not depend on transparent AI-video background.',
    depthItem ? `Depth overlay: keep key labels away from ${depthItem.overlayShouldSitBehind.join(', ') || 'planned foreground masks'}.` : undefined,
    depthItem ? depthItem.captionLayerRule : undefined,
    ...(videoUnderstandingReport?.visualUnderstanding.faceSafeZoneNotes.slice(0, 2) ?? []),
    ...(videoUnderstandingReport?.visualUnderstanding.productSafeZoneNotes.slice(0, 1) ?? []),
  ].filter(Boolean) as string[]
}

function commonTierNotes(input: PlannerInput, providerModel: ProviderModel) {
  if (providerModel === 'veo_3_1_lite') {
    return input.editLevel === 'premium'
      ? ['Veo Lite is Premium-only final fallback/rescue.', 'Veo is not primary or default.']
      : ['Veo Lite is Premium-only final fallback.', `${input.editLevel} cannot use Veo.`]
  }

  return [
    input.editLevel === 'premium' ? 'Premium fallback depth applies after primary/normal fallback paths.' : 'Basic/Pro prompt plans exclude Veo.',
    'No provider prompt defaults to 1080P.',
  ]
}

function commonQaNotes(params: BasePromptParams) {
  const {
    asset,
    adaptiveEditStrategyPlan,
    characterConsistencyPlan,
    compiledIntent,
    depthAwareOverlayItem,
    documentaryFactSafetyPlan,
    frameTemplate,
    input,
    renderStrategyItem,
    speakerVisualLayoutItem,
    toolStrategyItems = [],
    colorPipelinePlan,
    audioPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    assetColorMatchPlan,
    videoUnderstandingReport,
  } = params
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)
  const report = videoUnderstandingReport ?? input.videoUnderstandingReport
  const adaptiveStrategy = adaptiveStrategyForPrompt({ adaptiveEditStrategyPlan, asset, segment: params.segment })

  return [
    ...asset.qaChecks,
    ...(adaptiveStrategy
      ? [
          `Adaptive strategy QA: ${label(adaptiveStrategy.decisionKind)} with ${label(adaptiveStrategy.generationRestraint)}.`,
          ...adaptiveStrategy.qaChecks.slice(0, 3),
        ]
      : []),
    ...(report?.qaConcerns.slice(0, 3) ?? []),
    ...(report?.visualUnderstanding.faceSafeZoneNotes.slice(0, 2) ?? []),
    ...(report?.audioUnderstanding.cleanupNeeded ? ['Audio cleanup need from video understanding is reflected in sound planning.'] : []),
    ...(report?.transcriptMeaning.captionDensityRecommendation
      ? [`Caption density target: ${report.transcriptMeaning.captionDensityRecommendation}.`]
      : []),
    ...(compiledIntent?.qaImplications.slice(0, 3) ?? []),
    ...characterPacks.flatMap((pack) => pack.qaChecks.slice(0, 2)),
    ...factSafetyItems.flatMap((item) => item.qaChecks.slice(0, 2)),
    'No random extra characters or unrelated scenery.',
    'No style drift.',
    'Do not obstruct faces, products, captions, or AI panels.',
    ...(speakerVisualLayoutItem?.qaChecks.slice(0, 4) ?? []),
    ...(speakerVisualLayoutItem?.promptImplications.slice(0, 3) ?? []),
    ...(depthAwareOverlayItem?.qaChecks.slice(0, 5) ?? []),
    ...(depthAwareOverlayItem?.promptImplications.slice(0, 4) ?? []),
    ...(renderStrategyItem
      ? [
          `Render strategy QA: ${label(renderStrategyItem.strategyType)}; Remotion owns final composition.`,
          ...renderStrategyItem.qaChecks.slice(0, 4),
        ]
      : []),
    ...(toolStrategyItems.length
      ? [
          `Tool strategy QA: ${toolStrategyItems.map((item) => label(item.chainId)).join(', ')}; no real tool execution.`,
          ...toolStrategyItems.flatMap((item) => item.qaChecks.slice(0, 2)).slice(0, 4),
        ]
      : []),
    ...(colorPipelinePlan
      ? [
          `Color pipeline QA: ${label(colorPipelinePlan.colorGradeStyle)} ${colorPipelinePlan.intensity}; no real color processing.`,
          ...colorPipelinePlan.qaChecks.slice(0, 3),
        ]
      : []),
    ...(assetColorMatchPlan
      ? [
          `Asset color match QA: ${assetColorMatchPlan.operations.map((operation) => label(operation.operation)).join(', ')}.`,
          ...assetColorMatchPlan.qaChecks.slice(0, 2),
        ]
      : []),
    ...(audioPipelinePlan
      ? [
          `Audio pipeline QA: ${label(audioPipelinePlan.soundStyle)} ${audioPipelinePlan.audioIntensity}; no real audio processing.`,
          ...audioPipelinePlan.qaChecks.slice(0, 3),
        ]
      : []),
    ...(mapAnimationPlan?.active
      ? [
          `Map/location QA: ${mapAnimationPlan.items.length} controlled map item(s); no real map rendering.`,
          ...mapAnimationPlan.qaChecks.slice(0, 3),
        ]
      : []),
    ...(dataVizPlan?.active
      ? [
          `Chart/diagram QA: ${dataVizPlan.items.length} controlled dataviz item(s); no real D3/ECharts/Vega-Lite rendering.`,
          ...dataVizPlan.qaChecks.slice(0, 3),
        ]
      : []),
    `Generated background must match panel background ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
  ]
}

function commonWorkerNotes(
  providerModel: ProviderModel,
  layoutItem?: SpeakerVisualLayoutPlanItem,
  depthItem?: DepthAwareOverlayPlanItem,
  adaptiveStrategy?: AdaptiveSegmentStrategy,
  renderStrategyItem?: RenderStrategyPlanItem,
  toolStrategyItems: ToolStrategyPlanItem[] = [],
  colorPipelinePlan?: ColorPipelinePlan,
  assetColorMatchPlan?: AssetColorMatchPlan,
  audioPipelinePlan?: AudioPipelinePlan,
  mapAnimationPlan?: MapAnimationPlan,
  dataVizPlan?: DataVizPlan,
) {
  const layoutNotes = layoutItem
    ? [
        `Layout mode: ${label(layoutItem.layoutMode)}.`,
        `Speaker presence: ${label(layoutItem.speakerPresence)}.`,
        `Visual dominance: ${label(layoutItem.visualDominance)}.`,
        'Remotion owns final layout/composition.',
      ]
    : []
  const depthNotes = depthItem
    ? [
        `Depth mode: ${label(depthItem.depthCompositingMode)}.`,
        `Mask strategy: ${label(depthItem.maskStrategy)}; ${depthItem.maskRisk} risk.`,
        'Future mask/segmentation worker handles foreground masks after approval.',
        'Provider output must not attempt final depth composition.',
        ...depthItem.workerNotes.slice(0, 2),
      ]
    : []
  const strategyNotes = adaptiveStrategy
    ? [
        `Adaptive strategy: ${label(adaptiveStrategy.decisionKind)}.`,
        `Generation restraint: ${label(adaptiveStrategy.generationRestraint)}.`,
        ...adaptiveStrategy.fallbackStrategy.slice(0, 2),
      ]
    : []
  const renderStrategyNotes = renderStrategyItem
    ? [
        `Render strategy: ${label(renderStrategyItem.strategyType)}.`,
        `Remotion capabilities: ${renderStrategyItem.selectedRemotionCapabilities.map(label).join(', ') || 'none'}.`,
        renderStrategyItem.selectedOpenSourceTools.length
          ? `Open-source tool outputs are planned only: ${renderStrategyItem.selectedOpenSourceTools.map(label).join(', ')}.`
          : undefined,
        renderStrategyItem.needsWorkerPreprocess ? 'Future worker preprocess is required before Remotion placement.' : undefined,
        renderStrategyItem.needsWorkerPostprocess ? 'Future worker postprocess is planned after a future render.' : undefined,
        ...renderStrategyItem.workerNotes.slice(0, 3),
      ].filter(Boolean) as string[]
    : []
  const toolStrategyNotes = toolStrategyItems.length
    ? [
        `Tool strategy chains: ${toolStrategyItems.map((item) => label(item.chainId)).join(', ')}.`,
        `Planned tools only: ${Array.from(new Set(toolStrategyItems.flatMap((item) => item.selectedToolIds))).map(label).join(', ')}.`,
        ...toolStrategyItems.map((item) => item.userFacingSummary).slice(0, 2),
        'Tool strategy does not install or execute tools in this frontend demo.',
      ]
    : []
  const colorNotes = colorPipelinePlan
    ? [
        `Color pipeline: ${label(colorPipelinePlan.colorGradeStyle)} ${colorPipelinePlan.intensity}.`,
        assetColorMatchPlan ? `Asset color match: ${assetColorMatchPlan.id}.` : 'Use project color rules.',
        'Color pipeline is planning-only; no FFmpeg/OpenColorIO/OpenCV/Sharp work runs in the frontend.',
      ]
    : []
  const audioNotes = audioPipelinePlan
    ? [
        `Audio pipeline: ${label(audioPipelinePlan.soundStyle)} ${audioPipelinePlan.audioIntensity}.`,
        `Music policy: ${label(audioPipelinePlan.musicBedPlan.policy)}; SFX policy: ${label(audioPipelinePlan.sfxPlan.policy)}.`,
        audioPipelinePlan.soundSyncCues.length
          ? `SoundSync cues guide timing: ${audioPipelinePlan.soundSyncCues.slice(0, 3).map((cue) => label(cue.cueType)).join(', ')}.`
          : 'No asset-specific SoundSync cue required.',
        'Audio pipeline is planning-only; no FFmpeg/AudioFlux/Signalsmith Stretch/Essentia/librosa/Rubber Band/whisper.cpp work runs in the frontend.',
      ]
    : []
  const mapNotes = mapAnimationPlan?.active
    ? [
        `Map/location plan: ${mapAnimationPlan.items.length} controlled item(s).`,
        `Map tools planned only: ${mapAnimationPlan.mapToolsPlanned.map(label).join(', ')}.`,
        ...mapAnimationPlan.items.slice(0, 2).map((item) => `${label(item.mapVisualType)} uses ${label(item.style.styleFamily)}; ${item.locations.map((location) => location.safeWording).join(', ')}.`),
        'Exact geography should use MapLibre/Turf/Remotion planning, not AI video.',
        'No map rendering, geocoding, tile calls, or Mapbox API usage is implied.',
      ]
    : []
  const dataVizNotes = dataVizPlan?.active
    ? [
        `Chart/diagram plan: ${dataVizPlan.items.length} controlled item(s).`,
        `Dataviz tools planned only: ${dataVizPlan.toolsPlanned.map(label).join(', ')}.`,
        ...dataVizPlan.items.slice(0, 2).map((item) => `${label(item.visualType)} uses ${label(item.preferredTool)}; ${item.dataPlan.safeWording}.`),
        'Exact chart data, arrows, labels, and numbers should use D3/ECharts/Remotion planning, not AI video.',
        'No D3, ECharts, Vega-Lite, chart rendering, or data verification is implied.',
      ]
    : []

  if (providerModel === 'remotion_editor_motion' || providerModel === 'svg_lottie_renderer') {
    return ['Controlled renderer/editor motion only.', 'No AI-video provider call is implied by this brief.', ...strategyNotes, ...renderStrategyNotes, ...toolStrategyNotes, ...colorNotes, ...audioNotes, ...mapNotes, ...dataVizNotes, ...layoutNotes, ...depthNotes]
  }

  if (providerModel === 'gpt_image_2') {
    return ['Creates image/card/keyframe assets only.', 'Does not own final canvas or final edit order.', ...strategyNotes, ...renderStrategyNotes, ...toolStrategyNotes, ...colorNotes, ...audioNotes, ...mapNotes, ...dataVizNotes, ...layoutNotes, ...depthNotes]
  }

  if (providerModel === 'veo_3_1_lite') {
    return ['Premium final fallback/rescue only.', 'Do not send unless approved fallback conditions are met.', ...strategyNotes, ...renderStrategyNotes, ...toolStrategyNotes, ...colorNotes, ...audioNotes, ...mapNotes, ...dataVizNotes, ...layoutNotes, ...depthNotes]
  }

  return ['Creates silent AI video clip/asset only unless a future approved route explicitly supports audio.', 'ReeditPro/Remotion owns final canvas and timeline placement.', ...strategyNotes, ...renderStrategyNotes, ...toolStrategyNotes, ...colorNotes, ...audioNotes, ...mapNotes, ...dataVizNotes, ...layoutNotes, ...depthNotes]
}

export function buildNegativePrompt(params: {
  asset: VisualAssetPlanItem
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  styleMode?: StyleMode
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}) {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, input, professionalDirective, styleMode } = params
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)
  const avoidRules = [
    ...(compiledIntent?.avoidRules ?? []),
    ...(professionalDirective?.avoidRules ?? []),
    ...(styleMode?.avoidUseCases.map((avoidUseCase) => `avoid ${avoidUseCase}`) ?? []),
    'no random characters',
    'no unrelated background',
    cardAssetTypes.includes(asset.assetType as (typeof cardAssetTypes)[number]) ? undefined : 'no extra text unless requested',
    'no style drift',
    asset.signatureSystem === 'stroke_motion' ? 'no photorealism for Stroke Motion' : undefined,
    /serious|documentary|professional|premium/i.test(input.customInstructions) ? 'no childish or cartoonish visuals' : undefined,
    'no face or product obstruction',
    asset.signatureSystem === 'stroke_motion' ? 'no 3D if 2D stroke is requested' : undefined,
    'no camera movement if static frame is requested',
    'no transparent background default',
    'no gore or blood if symbolic graphic treatment is enough',
    input.editingCategory === 'documentary_case_study' ? 'no defamatory visual implication for claims or allegations' : undefined,
    characterPacks.length > 0 ? 'no character identity drift' : undefined,
    characterPacks.some((pack) => pack.realityStatus === 'real_named_person' || pack.realityStatus === 'unknown') ? 'no realistic likeness by default' : undefined,
    factSafetyItems.length > 0 ? 'no guilt-implying documentary visuals' : undefined,
    factSafetyItems.some((item) => item.sourceNeeded) ? 'no verified-fact framing for source-needed claims' : undefined,
  ]

  return Array.from(new Set(avoidRules.filter(Boolean))).join('; ')
}

function basePromptPlan(params: BasePromptParams & {
  idSuffix: string
  planType: ProviderPromptPlan['planType']
  providerModel: ProviderModel
  title: string
  prompt: string
  tierAllowed?: boolean
  negativePrompt?: string
}): ProviderPromptPlan {
  const {
    asset,
    frameTemplate,
    idSuffix,
    input,
    negativePrompt,
    planType,
    professionalDirective,
    providerModel,
    prompt,
    segment,
    styleMode,
    tierAllowed = true,
    title,
  } = params
  const adaptiveStrategy = adaptiveStrategyForPrompt({
    adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
    asset,
    segment,
  })

  return {
    id: `${asset.id}-${idSuffix}`,
    assetPlanItemId: asset.id,
    segmentId: segment?.id,
    planType,
    targetProvider: targetProviderForModel(providerModel),
    providerModel,
    title,
    prompt,
    negativePrompt,
    constraints: commonConstraints(params, providerModel),
    frameTemplateType: frameTemplate?.templateType ?? asset.frameTemplateType,
    panelBackgroundColor: frameTemplate?.panelBackgroundColor ?? '#FFFFFF',
    safeMarginNotes: commonSafeMarginNotes(
      frameTemplate,
      params.speakerVisualLayoutItem,
      params.depthAwareOverlayItem,
      params.videoUnderstandingReport ?? input.videoUnderstandingReport,
    ),
    styleModeId: styleMode?.id ?? asset.styleModeId,
    professionalEditStyle: professionalDirective?.editStyle,
    durationSeconds: asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds,
    resolution: providerModel === 'veo_3_1_lite' ? '720P' : asset.providerRoute.resolution,
    tierAllowed,
    tierPolicyNotes: commonTierNotes(input, providerModel),
    qaNotes: commonQaNotes(params),
    workerNotes: commonWorkerNotes(providerModel, params.speakerVisualLayoutItem, params.depthAwareOverlayItem, adaptiveStrategy, params.renderStrategyItem, params.toolStrategyItems ?? [], params.colorPipelinePlan, params.assetColorMatchPlan, params.audioPipelinePlan, params.mapAnimationPlan, params.dataVizPlan),
    promptVersion: adaptiveStrategy ? 'mock-v4-adaptive-strategy' : params.depthAwareOverlayItem ? 'mock-v3-depth' : 'mock-v2-layout',
    characterPackIds: asset.characterPackIds,
    factSafetyItemIds: asset.factSafetyItemIds,
    colorPipelineNotes: [
      ...(params.colorPipelinePlan
        ? [
            `Color grade: ${label(params.colorPipelinePlan.colorGradeStyle)} (${params.colorPipelinePlan.intensity}).`,
            ...params.colorPipelinePlan.generatedAssetRules.slice(0, 2),
          ]
        : []),
      ...(params.assetColorMatchPlan
        ? [`Asset color match: ${params.assetColorMatchPlan.id}; ${params.assetColorMatchPlan.qaChecks.slice(0, 2).join(' ')}`]
        : []),
    ],
    audioPipelineNotes: [
      ...(params.audioPipelinePlan
        ? [
            `Audio + SoundSync: ${label(params.audioPipelinePlan.soundStyle)} (${params.audioPipelinePlan.audioIntensity}).`,
            `Music ${label(params.audioPipelinePlan.musicBedPlan.policy)}; SFX ${label(params.audioPipelinePlan.sfxPlan.policy)}.`,
            ...params.audioPipelinePlan.soundSyncCues.slice(0, 2).map((cue) => `${label(cue.cueType)} cue at ${cue.timeSeconds}s.`),
          ]
        : []),
    ],
    mapPlanNotes: [
      ...(params.mapAnimationPlan?.active
        ? [
            `Map plan active: ${params.mapAnimationPlan.items.length} item(s).`,
            `Map tools planned only: ${params.mapAnimationPlan.mapToolsPlanned.map(label).join(', ')}.`,
            ...params.mapAnimationPlan.items.slice(0, 2).map((item) => `${label(item.mapVisualType)} / ${label(item.style.styleFamily)} / ${item.locations.map((location) => location.safeWording).join(', ')}.`),
          ]
        : []),
    ],
    dataVizPlanNotes: [
      ...(params.dataVizPlan?.active
        ? [
            `Chart/diagram plan active: ${params.dataVizPlan.items.length} item(s).`,
            `Dataviz tools planned only: ${params.dataVizPlan.toolsPlanned.map(label).join(', ')}.`,
            ...params.dataVizPlan.items.slice(0, 2).map((item) => `${label(item.visualType)} / ${label(item.preferredTool)} / ${item.dataPlan.safeWording}.`),
          ]
        : []),
    ],
  }
}

function styleModeLines(styleMode?: StyleMode) {
  if (!styleMode) {
    return 'Visual style mode: auto selected by ReeditPro.'
  }

  return compactLines([
    `Visual style mode: ${styleMode.label}.`,
    `Line/color rule: ${styleMode.strokeColorRule}`,
    `Fill rule: ${styleMode.fillRule}`,
    `Motion behavior: ${styleMode.motionBehavior}`,
    `Background rule: ${styleMode.backgroundRule}`,
    `Prompt notes: ${styleMode.promptNotes}`,
  ])
}

function professionalLines(directive?: ProfessionalEditingDirective) {
  if (!directive) {
    return 'Professional editing direction: clean professional default.'
  }

  return compactLines([
    `Professional edit style: ${label(directive.editStyle)}.`,
    `Pacing: ${label(directive.pacingStyle)}; cut intensity: ${label(directive.cutIntensity)}.`,
    `Color grade direction: ${label(directive.colorGradeStyle)}.`,
    `Caption direction: ${label(directive.captionStyle)}.`,
    directive.mustFollowRules.length ? `Must follow: ${directive.mustFollowRules.slice(0, 4).join('; ')}.` : undefined,
    directive.avoidRules.length ? `Avoid: ${directive.avoidRules.slice(0, 4).join('; ')}.` : undefined,
  ])
}

function storyLines(asset: VisualAssetPlanItem, input: PlannerInput) {
  const report = input.videoUnderstandingReport
  const relevantOpportunities = report?.visualSupportOpportunities
    .filter((opportunity) =>
      opportunity.label.toLowerCase().includes(asset.beatLabel.toLowerCase()) ||
      asset.reason.toLowerCase().includes(opportunity.opportunityType.replaceAll('_', ' ')) ||
      asset.storyPurpose.toLowerCase().includes(opportunity.opportunityType.replaceAll('_', ' ')),
    )
    .slice(0, 2)
  const topOpportunities = relevantOpportunities?.length
    ? relevantOpportunities
    : report?.visualSupportOpportunities.slice(0, 2)

  return compactLines([
    `Editing category: ${label(input.editingCategory)}.`,
    `Beat label: ${asset.beatLabel}.`,
    `Story purpose: ${asset.storyPurpose}.`,
    `Narrative phase: ${asset.narrativePhase}; emotion: ${asset.emotion}; action intensity: ${asset.actionIntensity}.`,
    `Asset type: ${label(asset.assetType)}; signature system: ${label(asset.signatureSystem)}.`,
    report ? `Video understanding: ${report.overallSummary}` : undefined,
    topOpportunities?.length
      ? `Understanding opportunities: ${topOpportunities.map((opportunity) => `${label(opportunity.opportunityType)} (${opportunity.reason})`).join(' ')}`
      : undefined,
    report?.visualUnderstanding.faceSafeZoneNotes[0]
      ? `Safe-zone context: ${report.visualUnderstanding.faceSafeZoneNotes[0]}`
      : undefined,
    topOpportunities?.flatMap((opportunity) => opportunity.suggestedToolHints).length
      ? `Tool hints only, no execution: ${Array.from(
          new Set(topOpportunities.flatMap((opportunity) => opportunity.suggestedToolHints)),
        )
          .map(label)
          .join(', ')}.`
      : undefined,
  ])
}

function strategyLines(params: BasePromptParams) {
  const strategy = adaptiveStrategyForPrompt({
    adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
    asset: params.asset,
    segment: params.segment,
  })

  if (!strategy) {
    return 'Adaptive strategy: no segment strategy attached; keep visual choices restrained and reason-based.'
  }

  return compactLines([
    `Adaptive strategy decision: ${label(strategy.decisionKind)}.`,
    `Reason to use visual: ${strategy.reasons.map((reason) => reason.explanation).slice(0, 2).join(' ')}`,
    `Generation restraint: ${label(strategy.generationRestraint)}.`,
    `Recommended support: ${label(strategy.recommendedVisualSupport)}; layout ${label(strategy.recommendedLayoutMode)}.`,
    strategy.recommendedToolHints.length ? `Tool hints only, no execution: ${strategy.recommendedToolHints.map(label).join(', ')}.` : undefined,
    strategy.generationRestraint === 'avoid_generation'
      ? 'Do not create AI-video output for this strategy; prefer controlled graphic/editor/Remotion planning.'
      : undefined,
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool')
      ? 'Exact maps, charts, labels, screens, and data visuals should stay controlled rather than generated as AI video.'
      : undefined,
    strategy.avoidRules.slice(0, 3).length ? `Avoid: ${strategy.avoidRules.slice(0, 3).join(' ')}` : undefined,
  ])
}

function renderStrategyLines(params: BasePromptParams) {
  const renderStrategyItem = params.renderStrategyItem

  if (!renderStrategyItem) {
    return 'Render strategy: no item attached; default to asset-scoped output and Remotion final composition.'
  }

  return compactLines([
    `Render strategy: ${label(renderStrategyItem.strategyType)}.`,
    `Reason: ${renderStrategyItem.reason}`,
    renderStrategyItem.selectedRemotionCapabilities.length
      ? `Remotion capabilities: ${renderStrategyItem.selectedRemotionCapabilities.map(label).join(', ')}.`
      : undefined,
    renderStrategyItem.selectedOpenSourceTools.length
      ? `Open-source tools planned only, no execution: ${renderStrategyItem.selectedOpenSourceTools.map(label).join(', ')}.`
      : undefined,
    renderStrategyItem.needsGptImage ? 'GPT-Image-2 may create still/card/keyframe assets only.' : undefined,
    renderStrategyItem.needsAiVideo ? 'AI video may create a clip asset only; it must not create the final canvas.' : undefined,
    renderStrategyItem.needsWorkerPreprocess ? 'Future worker preprocess is required before final Remotion placement.' : undefined,
    renderStrategyItem.needsWorkerPostprocess ? 'Future worker postprocess is planned after a future render/export.' : undefined,
    renderStrategyItem.strategyType === 'remotion_only'
      ? 'Do not create image/video provider output for this item; use Remotion/editor motion brief only.'
      : undefined,
    renderStrategyItem.strategyType === 'open_source_tool_then_remotion'
      ? 'Create a controlled tool/render brief, not an AI-video prompt.'
      : undefined,
    renderStrategyItem.fallbackStrategyType
      ? `Fallback: ${label(renderStrategyItem.fallbackStrategyType)} because ${renderStrategyItem.fallbackReason ?? 'strategy fallback is required'}.`
      : undefined,
  ])
}

function colorPipelineLines(params: BasePromptParams) {
  const colorPipelinePlan = params.colorPipelinePlan
  const assetColorMatchPlan = params.assetColorMatchPlan

  if (!colorPipelinePlan) {
    return 'Color pipeline: preserve clean professional color and matching panel background.'
  }

  return compactLines([
    `Color pipeline: ${label(colorPipelinePlan.colorGradeStyle)} (${colorPipelinePlan.intensity}).`,
    `Stages: ${colorPipelinePlan.stages.map(label).join(', ')}.`,
    assetColorMatchPlan
      ? `Asset color matching: ${assetColorMatchPlan.operations.map((operation) => label(operation.operation)).join(', ')}.`
      : 'Use the project color pipeline for this asset.',
    assetColorMatchPlan?.matchPanelBackgroundColor
      ? `Match panel background ${assetColorMatchPlan.matchPanelBackgroundColor}.`
      : undefined,
    colorPipelinePlan.generatedAssetRules.slice(0, 2).join(' '),
    'Do not introduce lighting/style drift. No real color processing is implied by this prompt.',
  ])
}

function audioPipelineLines(params: BasePromptParams) {
  const audioPipelinePlan = params.audioPipelinePlan

  if (!audioPipelinePlan) {
    return 'Audio/SoundSync: keep provider output visual-only; do not invent audio generation.'
  }

  const linkedCues = audioPipelinePlan.soundSyncCues
    .filter((cue) =>
      cue.linkedVisualAssetId === params.asset.id ||
      cue.linkedSegmentId === params.segment?.id,
    )
    .slice(0, 3)

  return compactLines([
    `Audio/SoundSync plan: ${label(audioPipelinePlan.soundStyle)} (${audioPipelinePlan.audioIntensity}).`,
    `Music policy: ${label(audioPipelinePlan.musicBedPlan.policy)}; SFX policy: ${label(audioPipelinePlan.sfxPlan.policy)}.`,
    linkedCues.length
      ? `Timing cues: ${linkedCues.map((cue) => `${label(cue.cueType)} at ${cue.timeSeconds}s`).join(', ')}.`
      : 'No asset-specific SoundSync cue required.',
    'Provider visual assets should stay silent/no-audio by default; SoundSync is handled by ReeditPro timing/audio planning.',
  ])
}

function mapAnimationLines(params: BasePromptParams) {
  const mapAnimationPlan = params.mapAnimationPlan

  if (!mapAnimationPlan?.active) {
    return 'Map/location: no exact map plan is active; do not invent map geography.'
  }

  const linkedItems = mapAnimationPlan.items
    .filter((item) =>
      item.visualAssetPlanItemId === params.asset.id ||
      item.assetPlanItemId === params.asset.id ||
      item.segmentId === params.segment?.id,
    )
  const items = linkedItems.length ? linkedItems : mapAnimationPlan.items.slice(0, 1)

  return compactLines([
    `Map/location plan: ${items.map((item) => label(item.mapVisualType)).join(', ')}.`,
    `Map style: ${items.map((item) => label(item.style.styleFamily)).join(', ')}.`,
    `Layout: ${items.map((item) => label(item.layout.layoutMode)).join(', ')}; Remotion composes final map layer.`,
    `Location wording: ${items.flatMap((item) => item.locations.map((location) => `${location.safeWording} (${label(location.confidence)})`)).join(', ')}.`,
    items.some((item) => item.layout.foregroundMaskAware)
      ? 'Map behind subject/contact object: avoid labels in foreground/object zones and keep captions above map and masks.'
      : 'Keep map labels inside safe label zones and away from captions.',
    'Exact maps should use controlled MapLibre/Turf planning, not AI video. No geocoding or map rendering is implied.',
  ])
}

function dataVizLines(params: BasePromptParams) {
  const dataVizPlan = params.dataVizPlan

  if (!dataVizPlan?.active) {
    return 'Chart/diagram: no exact dataviz plan is active; do not invent charts, labels, arrows, timelines, or data.'
  }

  const linkedItems = dataVizPlan.items
    .filter((item) =>
      item.visualAssetPlanItemId === params.asset.id ||
      item.assetPlanItemId === params.asset.id ||
      item.segmentId === params.segment?.id,
    )
  const items = linkedItems.length ? linkedItems : dataVizPlan.items.slice(0, 1)

  return compactLines([
    `Chart/diagram plan: ${items.map((item) => label(item.visualType)).join(', ')}.`,
    `Tools: ${items.map((item) => label(item.preferredTool)).join(', ')}; Remotion composes final dataviz layer.`,
    `Data wording: ${items.map((item) => `${item.dataPlan.safeWording} (${label(item.dataPlan.confidence)})`).join(', ')}.`,
    `Style/layout: ${items.map((item) => `${label(item.style.styleFamily)} in ${label(item.layout.layoutMode)}`).join(', ')}.`,
    `Label density: ${items.map((item) => item.style.labelDensity).join(', ')}; keep labels inside safe zones and away from captions/faces.`,
    items.some((item) => item.dataPlan.mockData || item.dataPlan.fictionalData)
      ? 'Mock or fictional data must be visually marked as mock/example/fictional where shown.'
      : undefined,
    'Exact charts, numbers, arrows, labels, accounts, dates, and timelines should use controlled D3/ECharts/Remotion planning, not AI video.',
    'No D3, ECharts, Vega-Lite rendering, data processing, or external verification is implied.',
  ])
}

function frameLines(frameTemplate?: FrameLayoutPlan) {
  return compactLines([
    `Use a plain matching panel background: ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
    `Frame template: ${frameTemplate?.templateType ?? 'auto'}.`,
    `Keep important action inside safe margins (${frameTemplate?.safeMargin ?? 0}px) and inside the planned animation panel.`,
    'Do not depend on transparent AI-video backgrounds.',
    'Provider generates an asset/clip only; ReeditPro owns the final canvas.',
  ])
}

function layoutLines(layoutItem?: SpeakerVisualLayoutPlanItem) {
  if (!layoutItem) {
    return 'Speaker/visual layout: follow the approved frame plan and do not assume one fixed layout for every segment.'
  }

  return compactLines([
    `Speaker/visual layout mode: ${label(layoutItem.layoutMode)}.`,
    `Speaker presence: ${label(layoutItem.speakerPresence)}; visual dominance: ${label(layoutItem.visualDominance)}.`,
    `Visual zone: ${zoneLabel(layoutItem.visualZone)}.`,
    `Speaker zone: ${zoneLabel(layoutItem.speakerZone)}.`,
    `Caption zone: ${zoneLabel(layoutItem.captionZone)}.`,
    `Safe margin: ${layoutItem.safeMargin}px; matching panel background: ${layoutItem.panelBackgroundColor ?? '#FFFFFF'}.`,
    layoutItem.layoutMode === 'lower_visual_panel'
      ? 'Fit the asset into a compact lower panel with large readable labels.'
      : undefined,
    layoutItem.visualDominance === 'full_takeover'
      ? 'Full visual takeover is allowed, but preserve caption safe zone and clear hierarchy.'
      : undefined,
    layoutItem.layoutMode === 'side_by_side_speaker_visual'
      ? 'Design for the visual side and leave the speaker side clean.'
      : undefined,
    layoutItem.speakerPresence === 'picture_in_picture'
      ? 'Leave a safe corner or edge for speaker picture-in-picture.'
      : undefined,
    layoutItem.layoutMode === 'full_evidence_board'
      ? 'Use clear documentary/evidence hierarchy and neutral claim treatment.'
      : undefined,
    layoutItem.layoutMode === 'full_map_takeover'
      ? 'Map labels, pins, and routes must stay readable.'
      : undefined,
    layoutItem.layoutMode === 'voiceover_visual_takeover'
      ? 'The asset should carry the visual explanation clearly without needing speaker face.'
      : undefined,
    ...layoutItem.promptImplications.slice(0, 3),
    'Remotion will composite final video; provider output is an asset or clip only.',
  ])
}

function depthLines(depthItem?: DepthAwareOverlayPlanItem) {
  if (!depthItem) {
    return 'Depth-aware overlay: none planned for this asset.'
  }

  const foregroundLabels = depthItem.foregroundObjects
    .filter((object) => object.preserveInFrontOfOverlay)
    .map((object) => object.label)
  const contactObjects = depthItem.foregroundObjects
    .filter((object) => object.kind === 'contact_object')
    .map((object) => object.label)

  return compactLines([
    `Depth-aware overlay mode: ${label(depthItem.depthCompositingMode)}.`,
    `Mask strategy: ${label(depthItem.maskStrategy)}; risk: ${depthItem.maskRisk}; tracking: ${label(depthItem.trackingRequirement)}.`,
    `Overlay layer: ${depthItem.overlayLayerDescription}`,
    foregroundLabels.length ? `Keep important text away from planned foreground: ${foregroundLabels.join(', ')}.` : undefined,
    depthItem.overlayShouldSitBehind.length ? `Overlay should sit behind: ${depthItem.overlayShouldSitBehind.join(', ')}.` : undefined,
    depthItem.overlayShouldSitInFrontOf.length ? `Overlay should sit in front of: ${depthItem.overlayShouldSitInFrontOf.join(', ')}.` : undefined,
    depthItem.depthCompositingMode === 'full_visual_replacement'
      ? 'Full visual replacement can use the full visual frame, but must preserve caption safe zone.'
      : undefined,
    depthItem.depthCompositingMode === 'object_anchored_overlay'
      ? 'Design callout graphics with clear anchor space; future worker handles object confirmation/tracking.'
      : undefined,
    contactObjects.length
      ? `Contact object preservation planned: ${contactObjects.join(', ')}. Keep map/card labels clear of that object.`
      : undefined,
    depthItem.captionLayerRule,
    ...depthItem.promptImplications.slice(0, 4),
    'Do not ask Wan, Hailuo, Veo, or GPT-Image-2 to solve real masking; Remotion and future mask workers handle final composition.',
  ])
}

function linkedCharacterPacks(asset: VisualAssetPlanItem, characterConsistencyPlan?: CharacterConsistencyPlan) {
  const ids = asset.characterPackIds ?? []

  if (!characterConsistencyPlan || ids.length === 0) {
    return []
  }

  return characterConsistencyPlan.packs.filter((pack) => ids.includes(pack.id))
}

function linkedFactSafetyItems(asset: VisualAssetPlanItem, documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan) {
  const ids = asset.factSafetyItemIds ?? []

  if (!documentaryFactSafetyPlan || ids.length === 0) {
    return []
  }

  return documentaryFactSafetyPlan.claimItems.filter((item) => ids.includes(item.id))
}

function characterLines(asset: VisualAssetPlanItem, characterConsistencyPlan?: CharacterConsistencyPlan) {
  const packs = linkedCharacterPacks(asset, characterConsistencyPlan)

  if (packs.length === 0) {
    return asset.needsCharacterConsistency
      ? 'Character consistency: preserve planned character references and avoid identity drift.'
      : undefined
  }

  return compactLines([
    'Character consistency:',
    ...packs.map((pack) => [
      `- ${pack.displayName}: ${pack.roleInStory}; importance ${pack.importance}; reality status ${pack.realityStatus}.`,
      `  Preserve appearance: ${pack.appearance.visualDescription}`,
      `  Rules: ${pack.consistencyRules.slice(0, 2).join(' ')}`,
      `  Avoid: ${pack.avoidRules.slice(0, 2).join(' ')}`,
    ].join('\n')),
  ])
}

function factSafetyLines(asset: VisualAssetPlanItem, documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan) {
  const items = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)

  if (!documentaryFactSafetyPlan?.active && items.length === 0) {
    return undefined
  }

  if (items.length === 0) {
    return 'Documentary fact safety: keep names, claims, and evidence visually neutral unless verified and approved.'
  }

  return compactLines([
    'Documentary fact safety:',
    ...items.map((item) => [
      `- Claim status ${item.claimStatus}: ${item.safeWording}`,
      `  Visual treatment: ${item.visualTreatment}.`,
      item.sourceNeeded ? '  Source needed; do not frame this as verified fact.' : undefined,
      `  Avoid: ${item.avoidRules.slice(0, 2).join(' ')}`,
    ].filter(Boolean).join('\n')),
  ])
}

export function buildImagePromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const cardNeedsText = cardAssetTypes.includes(asset.assetType as (typeof cardAssetTypes)[number])
  const planType: ProviderPromptPlan['planType'] = cardNeedsText
    ? 'still_card_prompt'
    : asset.assetType === 'graphic_design_frame'
      ? 'graphic_design_prompt'
      : 'image_prompt'
  const prompt = compactLines([
    'Create a production-ready image asset for ReeditPro.',
    storyLines(asset, input),
    strategyLines(params),
    renderStrategyLines(params),
    professionalLines(professionalDirective),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    cardNeedsText
      ? 'Design a readable card with clean hierarchy, intentional text only, and no clutter.'
      : 'Do not add random text; use clean composition and safe margins.',
    asset.needsCharacterConsistency ? 'Preserve character consistency from planned references.' : undefined,
    input.editingCategory === 'documentary_case_study' ? 'Treat names, claims, and people neutrally unless verified.' : undefined,
    compiledIntent?.goalSummary ? `Compiled goal: ${compiledIntent.goalSummary}.` : undefined,
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${planType}-gpt-image-2`,
    negativePrompt: buildNegativePrompt(params),
    planType,
    prompt,
    providerModel: 'gpt_image_2',
    title: `${asset.beatLabel} / GPT-Image-2 asset`,
  })
}

function wanPromptText(params: BasePromptParams, providerModel: ProviderModel) {
  const { asset, characterConsistencyPlan, frameTemplate, input, professionalDirective, documentaryFactSafetyPlan, styleMode } = params
  const hasEndFrame = asset.needsStartFrame && asset.needsEndFrame

  return compactLines([
    hasEndFrame
      ? 'Create a fast silent 2D stroke-motion storytelling animation between the provided first frame and last frame.'
      : 'Animate from the provided start frame as a silent 2D story asset.',
    storyLines(asset, input),
    strategyLines(params),
    renderStrategyLines(params),
    professionalLines(professionalDirective),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    hasEndFrame ? 'Clearly transition from first frame to last frame in 5 seconds.' : 'Describe motion clearly and keep the final emotional/action goal readable.',
    'Preserve style, characters, composition, and matching panel background.',
    'No new characters unless planned. No realism unless this route is Real Motion. No audio by default.',
    providerModel === 'wan_2_2_kf2v_flash' ? 'Output 720P. Duration 5 seconds.' : 'Output 720P. Duration 2-15 seconds as routed.',
  ])
}

export function buildStrokeMotionVideoPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const providerModel = params.asset.providerRoute.primaryModel.startsWith('wan') ? params.asset.providerRoute.primaryModel : 'wan_2_6_i2v_flash'

  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-stroke-motion`,
    negativePrompt: buildNegativePrompt(params),
    planType: 'stroke_motion_video_prompt',
    prompt: wanPromptText(params, providerModel),
    providerModel,
    title: `${params.asset.beatLabel} / Wan Stroke Motion clip`,
  })
}

export function buildGraphicDesignPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const providerModel = asset.providerRoute.primaryModel === 'svg_lottie_renderer' ? 'svg_lottie_renderer' : 'remotion_editor_motion'
  const planType: ProviderPromptPlan['planType'] = asset.assetType === 'motion_design_scene' ? 'motion_design_prompt' : 'graphic_design_prompt'
  const prompt = compactLines([
    'Create a controlled Graphic Design / VisualExplain prompt plan for ReeditPro.',
    storyLines(asset, input),
    strategyLines(params),
    renderStrategyLines(params),
    professionalLines(professionalDirective),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Use exact readable hierarchy, labels, arrows, timeline structure, or cards only where planned.',
    'Text must be legible and intentional. No random text. No clutter.',
    'This creates a graphic/design asset or controlled motion brief, not a full final video.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${planType}-${providerModel}`,
    negativePrompt: buildNegativePrompt(params),
    planType,
    prompt,
    providerModel,
    title: `${asset.beatLabel} / VisualExplain prompt`,
  })
}

export function buildRealMotionPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const providerModel = asset.providerRoute.primaryModel.startsWith('wan') ? asset.providerRoute.primaryModel : 'wan_2_6_i2v_flash'
  const prompt = compactLines([
    'Create a silent Real Motion asset/clip for ReeditPro, not the final canvas.',
    storyLines(asset, input),
    strategyLines(params),
    renderStrategyLines(params),
    professionalLines(professionalDirective),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Use realistic object/product/proof motion only where it improves the segment.',
    'Keep faces safe. Keep motion overlay-first and credit-aware.',
    'Preserve matching panel background and safe margins. Output 720P.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-real-motion`,
    negativePrompt: buildNegativePrompt(params),
    planType: 'real_motion_video_prompt',
    prompt,
    providerModel,
    title: `${asset.beatLabel} / Real Motion clip`,
  })
}

function hailuoPromptText(params: BasePromptParams, providerModel: ProviderModel) {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, styleMode } = params

  return compactLines([
    providerModel === 'hailuo_02'
      ? 'Create a direct start-frame plus end-frame animation transition.'
      : 'Create a direct start-frame-only animation fallback.',
    `Beat: ${asset.beatLabel}. Purpose: ${asset.storyPurpose}.`,
    strategyLines(params),
    renderStrategyLines(params),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    `Style: ${styleMode?.label ?? label(asset.signatureSystem)}. Category: ${label(input.editingCategory)}.`,
    `Motion: ${asset.emotion}, ${asset.actionIntensity} intensity, readable without audio.`,
    `Use matching panel background ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}; no transparent default.`,
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Preserve style. Use static camera unless a small movement is planned. Output 768P.',
  ])
}

function buildHailuoPromptPlan(params: BasePromptParams, providerModel: ProviderModel): ProviderPromptPlan {
  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-fallback`,
    negativePrompt: buildNegativePrompt(params),
    planType: params.asset.signatureSystem === 'real_motion' ? 'real_motion_video_prompt' : 'stroke_motion_video_prompt',
    prompt: hailuoPromptText(params, providerModel).slice(0, 1900),
    providerModel,
    title: `${params.asset.beatLabel} / Hailuo fallback`,
  })
}

export function buildVeoFallbackPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const routeIncludesVeo = asset.providerRoute.fallbackModels.includes('veo_3_1_lite') ||
    asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')
  const tierAllowed = input.editLevel === 'premium' && routeIncludesVeo
  const prompt = tierAllowed
    ? compactLines([
        'Premium final fallback/rescue prompt for Veo 3.1 Lite. Do not treat as primary/default.',
        storyLines(asset, input),
        strategyLines(params),
        renderStrategyLines(params),
        professionalLines(professionalDirective),
        colorPipelineLines(params),
        audioPipelineLines(params),
        mapAnimationLines(params),
        dataVizLines(params),
        styleModeLines(styleMode),
        frameLines(frameTemplate),
        layoutLines(params.speakerVisualLayoutItem),
        depthLines(params.depthAwareOverlayItem),
        characterLines(asset, characterConsistencyPlan),
        factSafetyLines(asset, documentaryFactSafetyPlan),
        'Use a clear story timeline, style consistency, safe margins, and matching panel background.',
        'Readable without audio. No random extra elements. Provider creates a clip asset only.',
      ])
    : 'Not available for this tier. Veo Lite is Premium-only final fallback.'

  return basePromptPlan({
    ...params,
    idSuffix: 'veo-final-fallback',
    negativePrompt: tierAllowed ? buildNegativePrompt(params) : undefined,
    planType: 'veo_fallback_prompt',
    prompt,
    providerModel: 'veo_3_1_lite',
    tierAllowed,
    title: tierAllowed ? `${asset.beatLabel} / Veo final fallback` : 'Veo locked for this tier',
  })
}

export function buildRemotionMotionBrief(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, rendererCompositionPlan, segment, styleMode } = params
  const linkedLayers = rendererCompositionPlan?.layers.filter((layer) => layer.assetPlanItemId === asset.id) ?? []
  const prompt = compactLines([
    'Create a Remotion/editor motion brief. No AI-video provider is needed for this brief.',
    storyLines(asset, input),
    strategyLines(params),
    renderStrategyLines(params),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    segment ? `Segment: ${segment.label}, final time ${segment.finalTimeRange.startSeconds}-${segment.finalTimeRange.endSeconds}s.` : undefined,
    linkedLayers.length ? `Renderer layers: ${linkedLayers.map((layer) => `${layer.label} (${layer.motionPreset ?? layer.fitMode})`).join('; ')}.` : undefined,
    'Include layer timing, motion preset, card/graphic behavior, safe zones, captions, panel layout, and transition timing.',
    'Exact text, captions, and final composition are controlled by ReeditPro.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: 'remotion-motion-brief',
    planType: 'remotion_motion_brief',
    prompt,
    providerModel: asset.providerRoute.primaryModel === 'svg_lottie_renderer' ? 'svg_lottie_renderer' : 'remotion_editor_motion',
    title: `${asset.beatLabel} / Remotion motion brief`,
  })
}

function buildRenderStrategyQANotesPlan(params: BasePromptParams): ProviderPromptPlan {
  const renderStrategyItem = params.renderStrategyItem
  const prompt = compactLines([
    'Create QA/tool planning notes for the render strategy. No provider generation and no tool execution are implied.',
    storyLines(params.asset, params.input),
    strategyLines(params),
    renderStrategyLines(params),
    colorPipelineLines(params),
    audioPipelineLines(params),
    mapAnimationLines(params),
    dataVizLines(params),
    layoutLines(params.speakerVisualLayoutItem),
    depthLines(params.depthAwareOverlayItem),
    renderStrategyItem?.qaChecks.length ? `Render QA: ${renderStrategyItem.qaChecks.join(' ')}` : undefined,
    renderStrategyItem?.workerNotes.length ? `Worker notes: ${renderStrategyItem.workerNotes.join(' ')}` : undefined,
  ])

  return basePromptPlan({
    ...params,
    idSuffix: 'render-strategy-qa-notes',
    planType: 'qa_prompt_notes',
    prompt,
    providerModel: 'none',
    title: `${params.asset.beatLabel} / render strategy QA notes`,
  })
}

function startEndFramePlans(params: BasePromptParams) {
  const plans: ProviderPromptPlan[] = []

  if (params.asset.needsStartFrame) {
    plans.push(basePromptPlan({
      ...params,
      idSuffix: 'start-frame-gpt-image-2',
      negativePrompt: buildNegativePrompt(params),
      planType: 'start_frame_prompt',
      prompt: compactLines([
        'Create the start frame for a planned ReeditPro animation asset.',
        storyLines(params.asset, params.input),
        strategyLines(params),
        renderStrategyLines(params),
        professionalLines(params.professionalDirective),
        colorPipelineLines(params),
        audioPipelineLines(params),
        mapAnimationLines(params),
        dataVizLines(params),
        styleModeLines(params.styleMode),
        frameLines(params.frameTemplate),
        layoutLines(params.speakerVisualLayoutItem),
        depthLines(params.depthAwareOverlayItem),
        characterLines(params.asset, params.characterConsistencyPlan),
        factSafetyLines(params.asset, params.documentaryFactSafetyPlan),
        'This frame must match the future animation panel and preserve character/style continuity.',
      ]),
      providerModel: 'gpt_image_2',
      title: `${params.asset.beatLabel} / start frame`,
    }))
  }

  if (params.asset.needsEndFrame) {
    plans.push(basePromptPlan({
      ...params,
      idSuffix: 'end-frame-gpt-image-2',
      negativePrompt: buildNegativePrompt(params),
      planType: 'end_frame_prompt',
      prompt: compactLines([
        'Create the end frame for a planned ReeditPro animation asset.',
        storyLines(params.asset, params.input),
        strategyLines(params),
        renderStrategyLines(params),
        professionalLines(params.professionalDirective),
        colorPipelineLines(params),
        audioPipelineLines(params),
        mapAnimationLines(params),
        dataVizLines(params),
        styleModeLines(params.styleMode),
        frameLines(params.frameTemplate),
        layoutLines(params.speakerVisualLayoutItem),
        depthLines(params.depthAwareOverlayItem),
        characterLines(params.asset, params.characterConsistencyPlan),
        factSafetyLines(params.asset, params.documentaryFactSafetyPlan),
        'This end frame must resolve the action/emotion while matching the start frame style and panel background.',
      ]),
      providerModel: 'gpt_image_2',
      title: `${params.asset.beatLabel} / end frame`,
    }))
  }

  return plans
}

function shouldUseImagePrompt(asset: VisualAssetPlanItem) {
  return [
    'still_scene',
    'fact_card',
    'name_card',
    'character_card',
    'list_card',
    'timeline_card',
    'graphic_design_frame',
    'still_with_editor_motion',
  ].includes(asset.assetType)
}

function shouldUseRemotionBrief(asset: VisualAssetPlanItem) {
  return ['motion_design_scene', 'graphic_design_frame', 'still_with_editor_motion', 'fact_card', 'name_card', 'character_card', 'list_card', 'timeline_card', 'transition_scene'].includes(asset.assetType) ||
    asset.providerRoute.primaryModel === 'remotion_editor_motion' ||
    asset.providerRoute.primaryModel === 'svg_lottie_renderer'
}

function renderStrategyNeedsImage(strategyType?: RenderStrategyType) {
  return strategyType === 'gpt_image_then_remotion' || strategyType === 'hybrid_generation_then_remotion'
}

function renderStrategyNeedsAiVideo(strategyType?: RenderStrategyType) {
  return strategyType === 'ai_video_then_remotion' || strategyType === 'hybrid_generation_then_remotion'
}

function renderStrategyIsControlledOnly(strategyType?: RenderStrategyType) {
  return strategyType === 'remotion_only' ||
    strategyType === 'open_source_tool_then_remotion' ||
    strategyType === 'worker_preprocess_then_remotion' ||
    strategyType === 'remotion_then_worker_postprocess'
}

function toolStrategyIsControlledOnly(toolStrategyItems: ToolStrategyPlanItem[] = []) {
  return toolStrategyItems.some((item) =>
    item.chainId === 'remotion_layout_chain' ||
    item.chainId === 'map_route_chain' ||
    item.chainId === 'chart_diagram_chain' ||
    item.chainId === 'browser_capture_chain' ||
    item.chainId === 'color_pipeline_chain' ||
    item.chainId === 'audio_pipeline_chain' ||
    item.chainId === 'visual_qa_chain',
  ) && !toolStrategyItems.some((item) => item.chainId === 'ai_animation_asset_chain' || item.chainId === 'premium_rescue_chain')
}

function dataVizPlanIsControlledOnly(params: {
  asset: VisualAssetPlanItem
  dataVizPlan?: DataVizPlan
  segment?: SegmentEditPlan
}) {
  const { asset, dataVizPlan, segment } = params

  if (!dataVizPlan?.active) {
    return false
  }

  return dataVizPlan.items.some((item) =>
    item.visualAssetPlanItemId === asset.id ||
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.id === asset.dataVizPlanItemId ||
    Boolean(segment?.dataVizPlanItemIds?.includes(item.id)),
  )
}

export function buildPromptPlansForAsset(params: BasePromptParams): ProviderPromptPlan[] {
  const { asset } = params
  const plans: ProviderPromptPlan[] = []
  const adaptiveStrategy = adaptiveStrategyForPrompt({
    adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
    asset,
    segment: params.segment,
  })
  const avoidAiVideoForStrategy = adaptiveStrategy?.generationRestraint === 'avoid_generation'
  const renderStrategyType = params.renderStrategyItem?.strategyType
  const controlledToolOnly = toolStrategyIsControlledOnly(params.toolStrategyItems) ||
    dataVizPlanIsControlledOnly({ asset, dataVizPlan: params.dataVizPlan, segment: params.segment })

  if (renderStrategyType === 'none') {
    return []
  }

  if (renderStrategyType === 'qa_tool_only') {
    return [buildRenderStrategyQANotesPlan(params)]
  }

  if (controlledToolOnly || renderStrategyIsControlledOnly(renderStrategyType)) {
    plans.push(buildRemotionMotionBrief(params))

    if (controlledToolOnly || renderStrategyType === 'worker_preprocess_then_remotion' || renderStrategyType === 'remotion_then_worker_postprocess') {
      plans.push(buildRenderStrategyQANotesPlan(params))
    }

    return plans
  }

  if (renderStrategyNeedsImage(renderStrategyType) || (!renderStrategyType && shouldUseImagePrompt(asset))) {
    plans.push(buildImagePromptPlan(params))
  }

  if (!renderStrategyType || renderStrategyType === 'hybrid_generation_then_remotion' || renderStrategyType === 'gpt_image_then_remotion') {
    plans.push(...startEndFramePlans(params))
  }

  if (!renderStrategyType && (asset.assetType === 'motion_design_scene' || asset.assetType === 'graphic_design_frame')) {
    plans.push(buildGraphicDesignPromptPlan(params))
  }

  const canCreateAiVideoPrompt = !avoidAiVideoForStrategy && (!renderStrategyType || renderStrategyNeedsAiVideo(renderStrategyType))

  if (canCreateAiVideoPrompt && asset.signatureSystem === 'stroke_motion' && asset.providerRoute.primaryModel.startsWith('wan')) {
    plans.push(buildStrokeMotionVideoPromptPlan(params))
  }

  if (canCreateAiVideoPrompt && (asset.signatureSystem === 'real_motion' || asset.assetType === 'real_motion_scene')) {
    plans.push(buildRealMotionPromptPlan(params))
  }

  if (canCreateAiVideoPrompt) {
    asset.providerRoute.fallbackModels
      .filter((model) => model.startsWith('hailuo'))
      .forEach((model) => plans.push(buildHailuoPromptPlan(params, model)))
  }

  if (canCreateAiVideoPrompt && asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model?.startsWith('hailuo'))) {
    asset.providerRoute.fallbackSteps
      .map((fallbackStep) => fallbackStep.model)
      .filter((model): model is ProviderModel => Boolean(model?.startsWith('hailuo')))
      .forEach((model) => {
        if (!plans.some((plan) => plan.providerModel === model && plan.targetProvider === 'hailuo')) {
          plans.push(buildHailuoPromptPlan(params, model))
        }
      })
  }

  if (canCreateAiVideoPrompt && (asset.providerRoute.fallbackModels.includes('veo_3_1_lite') || asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite'))) {
    plans.push(buildVeoFallbackPromptPlan(params))
  }

  if (shouldUseRemotionBrief(asset) || Boolean(renderStrategyType)) {
    plans.push(buildRemotionMotionBrief(params))
  }

  return plans
}

export function buildProviderPromptPlansForEditPlan(params: BuildEditPromptPlansParams): ProviderPromptPlan[] {
  const {
    characterConsistencyPlan,
    compiledIntent,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    adaptiveEditStrategyPlan,
    input,
    professionalDirective,
    rendererCompositionPlan,
    renderStrategyPlan,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    audioPipelinePlan,
    colorPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    videoUnderstandingReport,
    visualAssetPlan,
  } = params
  const promptInput = videoUnderstandingReport ? { ...input, videoUnderstandingReport } : input

  return visualAssetPlan.flatMap((asset) => {
    const frameTemplate = resolveFrameTemplate(promptInput, asset)
    const styleMode = getStyleMode(asset.styleModeId)
    const segment = segmentForAsset(segmentEditPlans, asset.id)
    const speakerVisualLayoutItem = layoutItemForAsset({ asset, segment, speakerVisualLayoutPlan })
    const depthAwareOverlayItem = depthItemForAsset({
      asset,
      depthAwareOverlayPlan,
      segment,
      speakerVisualLayoutItem,
    })
    const renderStrategyItem = renderStrategyForPrompt({
      asset,
      renderStrategyPlan,
      segment,
    })
    const toolStrategyItems = toolStrategyForPrompt({
      asset,
      renderStrategyItem,
      segment,
      toolStrategyPlan,
    })
    const assetColorMatchPlan = colorMatchPlanForPrompt({
      asset,
      colorPipelinePlan,
    })

    return buildPromptPlansForAsset({
      asset,
      compiledIntent,
      characterConsistencyPlan,
      depthAwareOverlayItem,
      depthAwareOverlayPlan,
      documentaryFactSafetyPlan,
      adaptiveEditStrategyPlan,
      frameTemplate,
      input: promptInput,
      professionalDirective,
      rendererCompositionPlan,
      renderStrategyItem,
      renderStrategyPlan,
      segment,
      speakerVisualLayoutItem,
      speakerVisualLayoutPlan,
      styleMode,
      assetColorMatchPlan,
      audioPipelinePlan,
      colorPipelinePlan,
      mapAnimationPlan,
      dataVizPlan,
      toolStrategyItems,
      toolStrategyPlan,
      videoUnderstandingReport,
    }).filter((promptPlan) => promptPlan.tierAllowed)
  })
}
