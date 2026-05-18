import type {
  AdaptiveEditStrategyPlan,
  AdaptiveSegmentStrategy,
  CompiledEditingIntent,
  DepthAwareOverlayPlan,
  DepthAwareOverlayPlanItem,
  OpenSourceToolId,
  PlannerInput,
  ProviderModel,
  RemotionCapabilityId,
  RenderStrategyComplexity,
  RenderStrategyPlan,
  RenderStrategyPlanItem,
  RenderStrategyType,
  SegmentEditPlan,
  SpeakerVisualLayoutMode,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  ToolInputType,
  ToolOutputType,
  ToolRegistrySummary,
  ToolStrategyHint,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualAssetType,
} from '../types/reeditpro'
import {
  getCapabilitiesForAssetType,
  getCapabilitiesForLayout,
  getDefaultCapabilitiesForStrategy,
  getRemotionCapability,
} from './remotion-capability-matrix'

export function createRenderStrategyPlan(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  toolRegistrySummary?: ToolRegistrySummary
  segmentEditPlans?: SegmentEditPlan[]
}): RenderStrategyPlan {
  const visualAssetPlan = params.visualAssetPlan ?? []
  const items = visualAssetPlan.map((asset, index) => createRenderStrategyItem(asset, index, params))
  const strategyCounts = createStrategyCounts(items)
  const remotionCapabilitiesUsed = unique(items.flatMap((item) => item.selectedRemotionCapabilities))
  const openSourceToolsUsed = unique(items.flatMap((item) => item.selectedOpenSourceTools))
  const providerModelsReferenced = unique(items.flatMap((item) => item.selectedProviderModels))
  const controlledToolCount = items.filter((item) => item.needsOpenSourceTool || item.strategyType === 'remotion_only').length
  const aiVideoCount = items.filter((item) => item.needsAiVideo).length

  return {
    id: `render-strategy-${params.input.editingCategory}-${params.input.editLevel}`,
    summary: items.length
      ? `${items.length} render strateg${items.length === 1 ? 'y' : 'ies'} planned: ${controlledToolCount} controlled/Remotion-first, ${aiVideoCount} AI-video eligible.`
      : 'No visual assets require render strategy items yet.',
    items,
    remotionCapabilitiesUsed,
    openSourceToolsUsed,
    providerModelsReferenced,
    strategyCounts,
    globalRules: [
      'Remotion owns final canvas, timeline, captions, layout, and composition.',
      'AI models generate assets or clips only.',
      'Controlled tools and Remotion are preferred for exact maps, charts, labels, captions, cards, screen captures, and diagrams.',
      'Basic and Pro cannot use Veo.',
      'Premium may reference Veo only as final fallback/rescue.',
      'No generated route defaults to 1080P.',
      'AI video generation uses matching panel backgrounds by default.',
      'This render strategy is mock planning only; no Remotion render, package install, provider call, or tool execution happens here.',
    ],
    qaChecks: [
      'Every visual asset has a render strategy item.',
      'Exact charts, maps, labels, captions, cards, and screenshots stay controlled unless a reasoned exception exists.',
      'AI video is reserved for organic/generative motion beats.',
      'Worker preprocess/postprocess strategies include future-worker notes and do not imply frontend execution.',
      'Remotion owns final composition for all visual-layer strategies.',
    ],
    notes: [
      params.toolRegistrySummary
        ? `Tool registry available: ${params.toolRegistrySummary.launchCoreToolCount} launch-core tools, ${params.toolRegistrySummary.needsLicenseReviewCount} license-review item(s).`
        : 'Tool registry summary was not supplied; strategy remains planning-only.',
      params.compiledIntent?.goalSummary ? `Compiled goal: ${params.compiledIntent.goalSummary}` : 'No compiled goal supplied to render strategy planner.',
      'Provider models remain separate from open-source tool IDs.',
    ],
  }
}

const renderStrategyTypes: RenderStrategyType[] = [
  'remotion_only',
  'gpt_image_then_remotion',
  'open_source_tool_then_remotion',
  'ai_video_then_remotion',
  'hybrid_generation_then_remotion',
  'worker_preprocess_then_remotion',
  'remotion_then_worker_postprocess',
  'qa_tool_only',
  'none',
]

const cardAssetTypes: VisualAssetType[] = ['fact_card', 'name_card', 'character_card', 'list_card', 'timeline_card']

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function createStrategyCounts(items: RenderStrategyPlanItem[]): Record<RenderStrategyType, number> {
  return renderStrategyTypes.reduce<Record<RenderStrategyType, number>>((counts, strategyType) => {
    counts[strategyType] = items.filter((item) => item.strategyType === strategyType).length
    return counts
  }, {} as Record<RenderStrategyType, number>)
}

function segmentForAsset(asset: VisualAssetPlanItem, segmentEditPlans?: SegmentEditPlan[]) {
  return segmentEditPlans?.find((segment) => segment.visualAssetPlanItemIds.includes(asset.id))
}

function layoutItemForAsset(asset: VisualAssetPlanItem, segment?: SegmentEditPlan, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan) {
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
  layoutItem?: SpeakerVisualLayoutPlanItem
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
}) {
  const { asset, depthAwareOverlayPlan, layoutItem, segment } = params

  return depthAwareOverlayPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.segmentId === segment?.id ||
    item.speakerVisualLayoutItemId === layoutItem?.id ||
    item.id === asset.depthAwareOverlayItemId ||
    item.id === segment?.depthAwareOverlayItemId,
  )
}

function adaptiveStrategyForAsset(params: {
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

function strategyFromHints(hints: ToolStrategyHint[], adaptiveStrategy?: AdaptiveSegmentStrategy): RenderStrategyType | undefined {
  if (hints.includes('map_tool') || hints.includes('chart_tool')) {
    return 'open_source_tool_then_remotion'
  }

  if (hints.includes('browser_capture_tool')) {
    return 'worker_preprocess_then_remotion'
  }

  if (hints.includes('color_pipeline')) {
    return 'remotion_then_worker_postprocess'
  }

  if (hints.includes('audio_pipeline') || hints.includes('qa_vision_tool')) {
    return 'qa_tool_only'
  }

  if (hints.includes('gpt_image_asset')) {
    return 'gpt_image_then_remotion'
  }

  if (hints.includes('wan_animation')) {
    return 'ai_video_then_remotion'
  }

  if (adaptiveStrategy?.generationRestraint === 'avoid_generation' && hints.includes('remotion_layout')) {
    return 'remotion_only'
  }

  return undefined
}

function defaultStrategyForAsset(asset: VisualAssetPlanItem, input: PlannerInput, adaptiveStrategy?: AdaptiveSegmentStrategy): RenderStrategyType {
  const avoidsGeneration = adaptiveStrategy?.generationRestraint === 'avoid_generation'
  const hasStartEndFrames = asset.needsStartFrame || asset.needsEndFrame

  if (asset.assetType === 'transition_scene') {
    return 'remotion_only'
  }

  if (cardAssetTypes.includes(asset.assetType)) {
    return asset.assetType === 'character_card' || asset.needsCharacterConsistency ? 'gpt_image_then_remotion' : 'remotion_only'
  }

  if (asset.assetType === 'graphic_design_frame' || asset.assetType === 'motion_design_scene') {
    if (asset.providerRoute.primaryModel === 'gpt_image_2') {
      return 'gpt_image_then_remotion'
    }

    return 'remotion_only'
  }

  if (asset.assetType === 'still_scene' || asset.assetType === 'still_with_editor_motion') {
    return asset.providerRoute.primaryModel === 'remotion_editor_motion' ? 'remotion_only' : 'gpt_image_then_remotion'
  }

  if (asset.assetType === 'animated_scene') {
    if (avoidsGeneration || input.editLevel === 'basic') {
      return hasStartEndFrames ? 'gpt_image_then_remotion' : 'remotion_only'
    }

    return hasStartEndFrames ? 'hybrid_generation_then_remotion' : 'ai_video_then_remotion'
  }

  if (asset.assetType === 'real_motion_scene') {
    if (input.editLevel === 'basic' || avoidsGeneration) {
      return 'gpt_image_then_remotion'
    }

    return hasStartEndFrames ? 'hybrid_generation_then_remotion' : 'ai_video_then_remotion'
  }

  return 'remotion_only'
}

function chooseStrategy(params: {
  asset: VisualAssetPlanItem
  adaptiveStrategy?: AdaptiveSegmentStrategy
  depthItem?: DepthAwareOverlayPlanItem
  input: PlannerInput
}): RenderStrategyType {
  const hints = params.adaptiveStrategy?.recommendedToolHints ?? []
  const hintedStrategy = strategyFromHints(hints, params.adaptiveStrategy)

  if (hintedStrategy) {
    return hintedStrategy
  }

  if (params.depthItem?.depthCompositingMode === 'object_anchored_overlay') {
    return 'worker_preprocess_then_remotion'
  }

  return defaultStrategyForAsset(params.asset, params.input, params.adaptiveStrategy)
}

function toolsForStrategy(strategyType: RenderStrategyType, hints: ToolStrategyHint[], input: PlannerInput): OpenSourceToolId[] {
  const tools: OpenSourceToolId[] = []

  if (strategyType === 'remotion_only' || strategyType === 'gpt_image_then_remotion' || strategyType === 'ai_video_then_remotion' || strategyType === 'hybrid_generation_then_remotion') {
    tools.push('remotion')
  }

  if (hints.includes('map_tool')) {
    tools.push('maplibre', 'turf', 'remotion')
  }

  if (hints.includes('chart_tool')) {
    tools.push('d3', 'echarts', 'remotion')
  }

  if (hints.includes('browser_capture_tool')) {
    tools.push('playwright', 'sharp', 'remotion')
  }

  if (hints.includes('color_pipeline')) {
    tools.push('ffmpeg')
    if (input.editLevel === 'premium') {
      tools.push('opencolorio')
    }
  }

  if (hints.includes('audio_pipeline')) {
    tools.push('ffmpeg', 'audioflux')
  }

  if (hints.includes('qa_vision_tool')) {
    tools.push('opencv')
  }

  if (strategyType === 'open_source_tool_then_remotion' && tools.length === 0) {
    tools.push('remotion')
  }

  if (strategyType === 'worker_preprocess_then_remotion' && tools.length === 0) {
    tools.push('sharp', 'remotion')
  }

  if (strategyType === 'remotion_then_worker_postprocess') {
    tools.push('remotion', 'ffmpeg')
  }

  return unique(tools)
}

function capabilitiesForStrategy(params: {
  asset: VisualAssetPlanItem
  strategyType: RenderStrategyType
  layoutItem?: SpeakerVisualLayoutPlanItem
  depthItem?: DepthAwareOverlayPlanItem
  hints: ToolStrategyHint[]
}): RemotionCapabilityId[] {
  const capabilities = new Set<RemotionCapabilityId>()

  getDefaultCapabilitiesForStrategy(params.strategyType).forEach((capabilityItem) => capabilities.add(capabilityItem.id))

  if (cardAssetTypes.includes(params.asset.assetType)) {
    getCapabilitiesForAssetType(params.asset.assetType)
      .filter((capabilityItem) =>
        capabilityItem.id === 'fact_card' ||
        capabilityItem.id === 'name_card' ||
        capabilityItem.id === 'list_card' ||
        capabilityItem.id === 'timeline_card' ||
        capabilityItem.id === 'evidence_board',
      )
      .slice(0, 2)
      .forEach((capabilityItem) => capabilities.add(capabilityItem.id))
  }

  if (params.asset.assetType === 'still_scene' || params.asset.assetType === 'still_with_editor_motion') {
    capabilities.add('still_image_motion')
  }

  if (params.asset.assetType === 'motion_design_scene' || params.asset.assetType === 'graphic_design_frame') {
    capabilities.add('graphic_panel')
    capabilities.add('motion_design')
  }

  if (params.layoutItem) {
    getCapabilitiesForLayout(params.layoutItem.layoutMode).slice(0, 2).forEach((capabilityItem) => capabilities.add(capabilityItem.id))
  }

  if (params.layoutItem?.layoutMode === 'picture_in_picture_speaker' || params.layoutItem?.layoutMode === 'screen_capture_with_speaker_pip') {
    capabilities.add('picture_in_picture')
  }

  if (params.layoutItem?.layoutMode === 'side_by_side_speaker_visual') {
    capabilities.add('side_by_side_layout')
  }

  if (params.layoutItem?.layoutMode === 'lower_visual_panel') {
    capabilities.add('lower_visual_panel')
  }

  if (params.layoutItem?.layoutMode === 'full_map_takeover' || params.hints.includes('map_tool')) {
    capabilities.add('map_layer_placement')
  }

  if (params.hints.includes('chart_tool')) {
    capabilities.add('chart_layer_placement')
    capabilities.add('diagram_build')
    capabilities.add('arrow_flow')
  }

  if (params.hints.includes('browser_capture_tool') || params.layoutItem?.layoutMode === 'screen_capture_with_speaker_pip') {
    capabilities.add('screen_capture_placement')
    capabilities.add('picture_in_picture')
  }

  if (params.asset.assetType === 'animated_scene' || params.asset.assetType === 'real_motion_scene') {
    capabilities.add('ai_video_panel_placement')
  }

  if (params.depthItem) {
    capabilities.add('depth_layer_composition')
  }

  capabilities.add('safe_zone_layout')

  return Array.from(capabilities)
}

function providerModelsForStrategy(asset: VisualAssetPlanItem, strategyType: RenderStrategyType, input: PlannerInput): ProviderModel[] {
  const models: ProviderModel[] = []
  const routeModels = [
    asset.providerRoute.primaryModel,
    ...asset.providerRoute.fallbackModels,
    ...asset.providerRoute.fallbackSteps.map((step) => step.model).filter(Boolean),
  ].filter((model): model is ProviderModel => Boolean(model && model !== 'none'))

  if (strategyType === 'gpt_image_then_remotion' || strategyType === 'hybrid_generation_then_remotion') {
    models.push('gpt_image_2')
  }

  if (strategyType === 'ai_video_then_remotion' || strategyType === 'hybrid_generation_then_remotion') {
    routeModels.forEach((model) => {
      if (model.startsWith('wan') || model.startsWith('hailuo')) {
        models.push(model)
      }

      if (model === 'veo_3_1_lite' && input.editLevel === 'premium' && asset.providerRoute.primaryModel !== 'veo_3_1_lite') {
        models.push(model)
      }
    })
  }

  if (strategyType === 'remotion_only') {
    models.push(asset.providerRoute.primaryModel === 'svg_lottie_renderer' ? 'svg_lottie_renderer' : 'remotion_editor_motion')
  }

  return unique(models)
}

function inputsForStrategy(strategyType: RenderStrategyType, tools: OpenSourceToolId[]): ToolInputType[] {
  const inputs: ToolInputType[] = ['frame_layout']

  if (strategyType === 'gpt_image_then_remotion') inputs.push('generated_image')
  if (strategyType === 'ai_video_then_remotion') inputs.push('ai_video_clip')
  if (strategyType === 'hybrid_generation_then_remotion') inputs.push('generated_image', 'ai_video_clip')
  if (tools.some((tool) => tool === 'maplibre' || tool === 'turf')) inputs.push('geojson', 'json_data')
  if (tools.some((tool) => tool === 'd3' || tool === 'echarts')) inputs.push('json_data')
  if (tools.includes('playwright')) inputs.push('url', 'html')
  if (tools.includes('ffmpeg')) inputs.push('source_video', 'audio')
  if (tools.includes('opencv')) inputs.push('source_video', 'image')

  return unique(inputs)
}

function outputsForStrategy(strategyType: RenderStrategyType, tools: OpenSourceToolId[]): ToolOutputType[] {
  const outputs: ToolOutputType[] = ['renderer_layer']

  if (strategyType === 'gpt_image_then_remotion' || strategyType === 'hybrid_generation_then_remotion') outputs.push('image_asset')
  if (tools.some((tool) => tool === 'maplibre' || tool === 'turf')) outputs.push('map_visual', 'json_spec')
  if (tools.some((tool) => tool === 'd3' || tool === 'echarts')) outputs.push('chart_visual', 'svg_visual', 'json_spec')
  if (tools.includes('playwright')) outputs.push('screenshot_asset')
  if (tools.includes('ffmpeg')) outputs.push('processed_video', 'processed_audio')
  if (strategyType === 'qa_tool_only' || tools.includes('opencv')) outputs.push('qa_report')
  if (tools.includes('audioflux') || tools.includes('essentia')) outputs.push('timing_map')

  return unique(outputs)
}

function complexityForStrategy(strategyType: RenderStrategyType, depthItem: DepthAwareOverlayPlanItem | undefined, input: PlannerInput): RenderStrategyComplexity {
  if (depthItem?.maskRisk === 'premium' || strategyType === 'hybrid_generation_then_remotion') {
    return 'premium'
  }

  if (depthItem?.maskRisk === 'high' || strategyType === 'worker_preprocess_then_remotion' || strategyType === 'remotion_then_worker_postprocess') {
    return 'advanced'
  }

  if (strategyType === 'open_source_tool_then_remotion' || strategyType === 'ai_video_then_remotion') {
    return input.editLevel === 'basic' ? 'moderate' : 'advanced'
  }

  if (strategyType === 'gpt_image_then_remotion') {
    return 'moderate'
  }

  return 'simple'
}

function creditImpactForComplexity(complexity: RenderStrategyComplexity): RenderStrategyPlanItem['creditImpact'] {
  if (complexity === 'premium') return 'premium'
  if (complexity === 'advanced') return 'high'
  if (complexity === 'moderate') return 'medium'
  return 'low'
}

function tierAllowedForStrategy(strategyType: RenderStrategyType, complexity: RenderStrategyComplexity) {
  return {
    basic: !(
      complexity === 'premium' ||
      strategyType === 'hybrid_generation_then_remotion' ||
      strategyType === 'remotion_then_worker_postprocess'
    ),
    pro: strategyType !== 'remotion_then_worker_postprocess' || complexity !== 'premium',
    premium: true,
  }
}

function fallbackForStrategy(strategyType: RenderStrategyType, complexity: RenderStrategyComplexity, layoutMode?: SpeakerVisualLayoutMode): {
  fallbackStrategyType?: RenderStrategyType
  fallbackReason?: string
} {
  if (complexity === 'simple') {
    return {}
  }

  if (strategyType === 'ai_video_then_remotion' || strategyType === 'hybrid_generation_then_remotion') {
    return {
      fallbackStrategyType: 'gpt_image_then_remotion',
      fallbackReason: 'Convert the beat to a still/keyframe asset with Remotion motion if AI video is too costly or fails QA.',
    }
  }

  if (strategyType === 'open_source_tool_then_remotion') {
    return {
      fallbackStrategyType: 'remotion_only',
      fallbackReason: 'Use a simpler static map, chart, or card built directly in Remotion if the tool output is too complex.',
    }
  }

  if (strategyType === 'worker_preprocess_then_remotion') {
    return {
      fallbackStrategyType: layoutMode === 'screen_capture_with_speaker_pip' ? 'remotion_only' : 'gpt_image_then_remotion',
      fallbackReason: 'Use a controlled card/lower panel if future worker preprocessing is not available.',
    }
  }

  return {
    fallbackStrategyType: 'remotion_only',
    fallbackReason: 'Simplify to controlled Remotion layout and motion.',
  }
}

function settingsForStrategy(params: {
  asset: VisualAssetPlanItem
  adaptiveStrategy?: AdaptiveSegmentStrategy
  layoutItem?: SpeakerVisualLayoutPlanItem
  strategyType: RenderStrategyType
  tools: OpenSourceToolId[]
}) {
  const presetIds = params.adaptiveStrategy?.toolStrategyHintsDetailed
    ?.flatMap((detail) => detail.suggestedPresetIds) ?? []

  return {
    frameTemplateType: params.asset.frameTemplateType,
    layoutMode: params.layoutItem?.layoutMode,
    speakerPresence: params.layoutItem?.speakerPresence,
    visualDominance: params.layoutItem?.visualDominance,
    panelBackgroundColor: params.layoutItem?.panelBackgroundColor,
    suggestedPresetIds: unique(presetIds),
    strategyType: params.strategyType,
    selectedOpenSourceTools: params.tools,
  }
}

function qaChecksForStrategy(params: {
  strategyType: RenderStrategyType
  capabilities: RemotionCapabilityId[]
  tools: OpenSourceToolId[]
  depthItem?: DepthAwareOverlayPlanItem
  input: PlannerInput
}) {
  const capabilityChecks = params.capabilities.flatMap((id) => getRemotionCapability(id)?.qaChecks.slice(0, 1) ?? [])

  return unique([
    'Render strategy exists for the visual asset.',
    'Remotion owns final canvas and placement.',
    params.strategyType === 'open_source_tool_then_remotion'
      ? 'Exact map/chart/tool output should not be recreated as AI video.'
      : undefined,
    params.strategyType === 'ai_video_then_remotion' || params.strategyType === 'hybrid_generation_then_remotion'
      ? 'AI video is used only for organic or generative motion and remains an asset/clip.'
      : undefined,
    params.tools.length ? `Open-source tools are planning-only: ${params.tools.map(label).join(', ')}.` : undefined,
    params.depthItem ? 'Depth-aware strategy includes future mask-worker note and caption-above-all QA.' : undefined,
    params.input.editLevel === 'premium' ? 'Premium keeps Veo final fallback only.' : 'Basic/Pro cannot use Veo.',
    ...capabilityChecks,
  ].filter(Boolean) as string[])
}

function workerNotesForStrategy(params: {
  strategyType: RenderStrategyType
  tools: OpenSourceToolId[]
  depthItem?: DepthAwareOverlayPlanItem
}) {
  return [
    'Mock planning only: no packages are installed and no tools are executed.',
    'Remotion owns final layout/composition after approved assets or tool outputs exist.',
    params.strategyType === 'worker_preprocess_then_remotion'
      ? 'Future worker preprocess output is required before Remotion placement.'
      : undefined,
    params.strategyType === 'remotion_then_worker_postprocess'
      ? 'Future worker postprocess output happens after a future Remotion render.'
      : undefined,
    params.strategyType === 'open_source_tool_then_remotion'
      ? 'Open-source tool output is planned as a future asset/spec for Remotion, not executed in the frontend.'
      : undefined,
    params.tools.some((tool) => tool === 'd3' || tool === 'echarts' || tool === 'vega_lite')
      ? 'Chart/diagram layers expect future D3/ECharts/Vega-Lite-spec output and Remotion composes final placement.'
      : undefined,
    params.depthItem
      ? 'Future segmentation/mask worker required for any real depth-aware overlay; no masking is executed here.'
      : undefined,
    params.depthItem?.maskStrategy === 'subject_plus_contact_object_mask'
      ? 'Preserve planned contact objects in front of the overlay when future masks are produced.'
      : undefined,
    params.tools.length ? `Tool IDs are registry IDs only: ${params.tools.join(', ')}.` : undefined,
  ].filter(Boolean) as string[]
}

function createRenderStrategyItem(
  asset: VisualAssetPlanItem,
  index: number,
  params: Parameters<typeof createRenderStrategyPlan>[0],
): RenderStrategyPlanItem {
  const segment = segmentForAsset(asset, params.segmentEditPlans)
  const layoutItem = layoutItemForAsset(asset, segment, params.speakerVisualLayoutPlan)
  const depthItem = depthItemForAsset({
    asset,
    depthAwareOverlayPlan: params.depthAwareOverlayPlan,
    layoutItem,
    segment,
  })
  const adaptiveStrategy = adaptiveStrategyForAsset({
    adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
    asset,
    segment,
  })
  const hints = adaptiveStrategy?.recommendedToolHints ?? []
  const strategyType = chooseStrategy({ adaptiveStrategy, asset, depthItem, input: params.input })
  const tools = toolsForStrategy(strategyType, hints, params.input)
  const capabilities = capabilitiesForStrategy({ asset, depthItem, hints, layoutItem, strategyType })
  const complexity = complexityForStrategy(strategyType, depthItem, params.input)
  const fallback = fallbackForStrategy(strategyType, complexity, layoutItem?.layoutMode)
  const selectedProviderModels = providerModelsForStrategy(asset, strategyType, params.input)
  const needsGptImage = strategyType === 'gpt_image_then_remotion' || strategyType === 'hybrid_generation_then_remotion'
  const needsAiVideo = strategyType === 'ai_video_then_remotion' || strategyType === 'hybrid_generation_then_remotion'
  const needsOpenSourceTool = strategyType === 'open_source_tool_then_remotion' || tools.some((tool) => tool !== 'remotion')
  const needsWorkerPreprocess = strategyType === 'worker_preprocess_then_remotion' || Boolean(depthItem && depthItem.maskStrategy !== 'none')
  const needsWorkerPostprocess = strategyType === 'remotion_then_worker_postprocess'

  return {
    id: `render-strategy-item-${index + 1}-${asset.id}`,
    segmentId: segment?.id,
    assetPlanItemId: asset.id,
    layoutItemId: layoutItem?.id,
    depthAwareOverlayItemId: depthItem?.id,
    strategyType,
    label: asset.beatLabel,
    purpose: asset.storyPurpose,
    selectedRemotionCapabilities: capabilities,
    selectedOpenSourceTools: tools,
    selectedProviderModels,
    requiredInputs: inputsForStrategy(strategyType, tools),
    expectedOutputs: outputsForStrategy(strategyType, tools),
    complexity,
    creditImpact: strategyType === 'remotion_only' || strategyType === 'qa_tool_only'
      ? 'none'
      : creditImpactForComplexity(complexity),
    tierAllowed: tierAllowedForStrategy(strategyType, complexity),
    needsGptImage,
    needsAiVideo,
    needsOpenSourceTool,
    needsWorkerPreprocess,
    needsWorkerPostprocess,
    remotionOwnsFinalComposition: strategyType !== 'none',
    reason: [
      `Asset type ${label(asset.assetType)} with ${label(asset.signatureSystem)} needs ${label(strategyType)}.`,
      adaptiveStrategy ? `Adaptive strategy: ${label(adaptiveStrategy.decisionKind)} with ${label(adaptiveStrategy.generationRestraint)}.` : undefined,
      hints.length ? `Tool hints: ${hints.map(label).join(', ')}.` : undefined,
      depthItem ? `Depth plan adds ${label(depthItem.depthCompositingMode)} with future mask-worker planning.` : undefined,
      params.input.editLevel === 'basic' ? 'Basic favors simpler, lower-compute render strategies.' : undefined,
    ].filter(Boolean).join(' '),
    ...fallback,
    settings: settingsForStrategy({ adaptiveStrategy, asset, layoutItem, strategyType, tools }),
    qaChecks: qaChecksForStrategy({ capabilities, depthItem, input: params.input, strategyType, tools }),
    workerNotes: workerNotesForStrategy({ depthItem, strategyType, tools }),
  }
}
