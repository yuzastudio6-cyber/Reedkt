import type {
  AspectRatio,
  AudioPipelinePlan,
  ColorPipelinePlan,
  DataVizPlan,
  DepthAwareOverlayPlan,
  DepthAwareOverlayPlanItem,
  EditLevel,
  FrameLayoutPlan,
  LayerFitMode,
  MapAnimationPlan,
  RectZone,
  RenderStrategyPlan,
  RenderStrategyPlanItem,
  RendererCompositionPlan,
  RendererLayerPlan,
  RendererLayerType,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  TargetPlatform,
  ToolStrategyPlan,
  ToolStrategyPlanItem,
  VisualAssetPlanItem,
  VisualAssetType,
} from '../types/reeditpro'

type CreateRendererCompositionPlanParams = {
  visualAssetPlan: VisualAssetPlanItem[]
  frameTemplate: FrameLayoutPlan
  aspectRatio: AspectRatio
  targetPlatform: TargetPlatform
  editLevel: EditLevel
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}

const cardLayerTypes: Partial<Record<VisualAssetType, RendererLayerType>> = {
  fact_card: 'fact_card',
  name_card: 'name_card',
  character_card: 'character_card',
  list_card: 'list_card',
  timeline_card: 'timeline_card',
}

export function getLayerTypeForAssetType(assetType: VisualAssetType): RendererLayerType {
  if (assetType === 'animated_scene' || assetType === 'real_motion_scene') {
    return 'ai_video_panel'
  }

  if (assetType === 'still_scene' || assetType === 'still_with_editor_motion') {
    return 'still_image'
  }

  if (assetType === 'graphic_design_frame') {
    return 'graphic_design'
  }

  if (assetType === 'motion_design_scene') {
    return 'motion_design'
  }

  if (assetType === 'transition_scene') {
    return 'transition'
  }

  return cardLayerTypes[assetType] ?? 'graphic_design'
}

export function getMotionPresetForAsset(asset: VisualAssetPlanItem) {
  if (asset.assetType === 'transition_scene') {
    return 'transition_wipe'
  }

  if (asset.assetType === 'motion_design_scene') {
    return asset.actionIntensity === 'high' || asset.actionIntensity === 'extreme' ? 'arrow_flow' : 'diagram_build'
  }

  if (asset.assetType === 'graphic_design_frame') {
    return asset.actionIntensity === 'medium' ? 'highlight' : 'card_slide_in'
  }

  if (cardLayerTypes[asset.assetType]) {
    return asset.actionIntensity === 'low' ? 'card_slide_in' : 'card_pop'
  }

  if (asset.assetType === 'still_scene' || asset.assetType === 'still_with_editor_motion') {
    if (asset.actionIntensity === 'high' || asset.actionIntensity === 'extreme') {
      return 'slide_in'
    }

    return asset.actionIntensity === 'medium' ? 'slow_zoom' : 'hold'
  }

  if (asset.assetType === 'real_motion_scene') {
    return 'panel_hold'
  }

  return 'hold'
}

export function getDisplayDurationForAsset(asset: VisualAssetPlanItem) {
  if (asset.recommendedDurationSeconds > 0) {
    return asset.recommendedDurationSeconds
  }

  return 3
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function layoutItemForAsset(asset: VisualAssetPlanItem, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan) {
  return speakerVisualLayoutPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    Boolean(item.segmentId && asset.speakerVisualLayoutItemId === item.id),
  )
}

function depthItemForAsset(asset: VisualAssetPlanItem, depthAwareOverlayPlan?: DepthAwareOverlayPlan) {
  return depthAwareOverlayPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.speakerVisualLayoutItemId === asset.speakerVisualLayoutItemId ||
    item.id === asset.depthAwareOverlayItemId,
  )
}

function renderStrategyItemForAsset(asset: VisualAssetPlanItem, renderStrategyPlan?: RenderStrategyPlan) {
  return renderStrategyPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.id === asset.renderStrategyItemId,
  )
}

function toolStrategyItemsForAsset(asset: VisualAssetPlanItem, renderStrategyItem?: RenderStrategyPlanItem, toolStrategyPlan?: ToolStrategyPlan) {
  return toolStrategyPlan?.items.filter((item) =>
    item.assetPlanItemId === asset.id ||
    item.renderStrategyItemId === renderStrategyItem?.id ||
    asset.toolStrategyItemIds?.includes(item.id) ||
    renderStrategyItem?.toolStrategyItemIds?.includes(item.id),
  ) ?? []
}

function primaryVisualZone(frameTemplate: FrameLayoutPlan, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan): RectZone {
  return speakerVisualLayoutPlan?.items.find((item) => item.visualZone)?.visualZone ?? frameTemplate.animationZone
}

function primarySpeakerZone(frameTemplate: FrameLayoutPlan, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan): RectZone {
  return speakerVisualLayoutPlan?.items.find((item) => item.speakerZone)?.speakerZone ??
    frameTemplate.speakerZone ??
    {
      x: 0,
      y: 0,
      width: frameTemplate.canvasWidth,
      height: frameTemplate.canvasHeight,
      label: 'Source video zone',
      notes: 'Source footage may act as background or primary footage for full-panel layouts.',
    }
}

function layoutSummaryNotes(layoutItem?: SpeakerVisualLayoutPlanItem) {
  if (!layoutItem) {
    return ['No explicit speaker/visual layout item is linked to this asset.']
  }

  return [
    `Layout mode: ${formatLabel(layoutItem.layoutMode)}.`,
    `Speaker presence: ${formatLabel(layoutItem.speakerPresence)}.`,
    `Visual dominance: ${formatLabel(layoutItem.visualDominance)}.`,
    ...layoutItem.remotionNotes.slice(0, 2),
  ]
}

function depthSummaryNotes(depthItem?: DepthAwareOverlayPlanItem) {
  if (!depthItem) {
    return ['No explicit depth-aware overlay item is linked to this asset.']
  }

  return [
    `Depth compositing mode: ${formatLabel(depthItem.depthCompositingMode)}.`,
    `Mask strategy: ${formatLabel(depthItem.maskStrategy)} (${depthItem.maskRisk} risk).`,
    depthItem.foregroundObjects.length
      ? `Planned foreground objects: ${depthItem.foregroundObjects.map((object) => object.label).join(', ')}.`
      : 'No foreground objects are planned for this depth item.',
    ...depthItem.remotionLayerNotes.slice(0, 3),
  ]
}

function renderStrategySummaryNotes(renderStrategyItem?: RenderStrategyPlanItem) {
  if (!renderStrategyItem) {
    return ['No explicit render strategy item is linked to this asset.']
  }

  return [
    `Render strategy: ${formatLabel(renderStrategyItem.strategyType)}.`,
    renderStrategyItem.selectedRemotionCapabilities.length
      ? `Remotion capabilities: ${renderStrategyItem.selectedRemotionCapabilities.map(formatLabel).join(', ')}.`
      : 'No Remotion capabilities selected.',
    renderStrategyItem.selectedOpenSourceTools.length
      ? `Expected open-source tool outputs: ${renderStrategyItem.selectedOpenSourceTools.map(formatLabel).join(', ')}.`
      : 'No open-source tool output is required.',
    renderStrategyItem.selectedProviderModels.length
      ? `Referenced provider models: ${renderStrategyItem.selectedProviderModels.map(formatLabel).join(', ')}.`
      : 'No provider model output is required.',
    renderStrategyItem.needsWorkerPreprocess ? 'Future worker preprocess output is required before Remotion placement.' : undefined,
    renderStrategyItem.needsWorkerPostprocess ? 'Future worker postprocess is planned after a future render/export.' : undefined,
    renderStrategyItem.fallbackStrategyType
      ? `Fallback render strategy: ${formatLabel(renderStrategyItem.fallbackStrategyType)}.`
      : undefined,
    'Render strategy is planning only; no Remotion render or external tool execution is performed.',
  ].filter(Boolean) as string[]
}

function toolStrategySummaryNotes(toolStrategyItems: ToolStrategyPlanItem[]) {
  if (toolStrategyItems.length === 0) {
    return ['No explicit tool strategy item is linked to this layer.']
  }

  return [
    `Tool strategy chains: ${toolStrategyItems.map((item) => formatLabel(item.chainId)).join(', ')}.`,
    `Planned tools: ${Array.from(new Set(toolStrategyItems.flatMap((item) => item.selectedToolIds))).map(formatLabel).join(', ')}.`,
    ...toolStrategyItems.slice(0, 3).map((item) => {
      if (item.chainId === 'remotion_layout_chain') return `${item.label}: layer can be built directly by Remotion.`
      if (item.chainId === 'color_pipeline_chain' || item.chainId === 'audio_pipeline_chain') return `${item.label}: processing happens before/after Remotion in a future worker, not as a visual layer.`
      return `${item.label}: layer expects future output from ${formatLabel(item.chainId)}.`
    }),
    'Tool strategy is planning only; no tool package is installed or executed.',
  ]
}

function colorPipelineLayerNotes(colorPipelinePlan?: ColorPipelinePlan, asset?: VisualAssetPlanItem) {
  if (!colorPipelinePlan) {
    return ['No project color pipeline was provided to the renderer planner.']
  }

  const matchPlan = asset
    ? colorPipelinePlan.assetMatchPlans.find((plan) => plan.assetPlanItemId === asset.id)
    : undefined

  return [
    `Color pipeline: ${formatLabel(colorPipelinePlan.colorGradeStyle)} (${colorPipelinePlan.intensity}).`,
    'Final color pipeline is planned separately; Remotion composes color-matched assets and does not replace full professional grading.',
    matchPlan
      ? `Layer color match: ${matchPlan.id} with ${matchPlan.operations.map((operation) => formatLabel(operation.operation)).join(', ')}.`
      : 'No asset-specific color match plan is linked to this layer.',
  ]
}

function audioPipelineLayerNotes(audioPipelinePlan?: AudioPipelinePlan, asset?: VisualAssetPlanItem) {
  if (!audioPipelinePlan) {
    return ['No project audio pipeline was provided to the renderer planner.']
  }

  const cueMatches = audioPipelinePlan.soundSyncCues
    .filter((cue) => cue.linkedVisualAssetId === asset?.id)
    .slice(0, 2)

  return [
    `Audio pipeline: ${formatLabel(audioPipelinePlan.soundStyle)} (${audioPipelinePlan.audioIntensity}).`,
    'SoundSync cues guide timing of captions, visual reveals, transitions, and SFX; Remotion previews timing but is not the full audio processing engine.',
    cueMatches.length
      ? `Layer SoundSync cues: ${cueMatches.map((cue) => `${formatLabel(cue.cueType)} at ${cue.timeSeconds}s`).join(', ')}.`
      : 'No asset-specific SoundSync cue is linked to this layer.',
  ]
}

function mapAnimationLayerNotes(mapAnimationPlan?: MapAnimationPlan, asset?: VisualAssetPlanItem) {
  if (!mapAnimationPlan?.active) {
    return ['No active map/location plan is linked to this layer.']
  }

  const mapItem = mapAnimationPlan.items.find((item) =>
    item.visualAssetPlanItemId === asset?.id ||
    item.assetPlanItemId === asset?.id,
  )

  if (!mapItem) {
    return ['Map/location plan is active, but this layer has no map-specific item.']
  }

  return [
    `Map plan: ${formatLabel(mapItem.mapVisualType)} using ${mapItem.toolIds.map(formatLabel).join(', ')}.`,
    `Map style ${formatLabel(mapItem.style.styleFamily)}; layout ${formatLabel(mapItem.layout.layoutMode)}.`,
    `Location wording: ${mapItem.locations.map((location) => location.safeWording).join(', ')}.`,
    'Layer expects future MapLibre/Turf output; Remotion composes the final map layer and captions.',
    mapItem.layout.foregroundMaskAware
      ? 'Map labels must avoid the expected foreground/contact-object zone; future mask worker required for real depth compositing.'
      : 'Map labels must stay inside safe label and caption zones.',
  ]
}

function dataVizLayerNotes(dataVizPlan?: DataVizPlan, asset?: VisualAssetPlanItem) {
  if (!dataVizPlan?.active) {
    return ['No active chart/diagram plan is linked to this layer.']
  }

  const dataVizItem = dataVizPlan.items.find((item) =>
    item.visualAssetPlanItemId === asset?.id ||
    item.assetPlanItemId === asset?.id,
  )

  if (!dataVizItem) {
    return ['Chart/diagram plan is active, but this layer has no dataviz-specific item.']
  }

  return [
    `Chart/diagram plan: ${formatLabel(dataVizItem.visualType)} using ${dataVizItem.toolIds.map(formatLabel).join(', ')}.`,
    `Data confidence: ${formatLabel(dataVizItem.dataPlan.confidence)}; wording: ${dataVizItem.dataPlan.safeWording}.`,
    `Diagram style ${formatLabel(dataVizItem.style.styleFamily)}; layout ${formatLabel(dataVizItem.layout.layoutMode)}.`,
    'Layer expects future D3/ECharts/Vega-Lite-spec output when needed; Remotion composes the final chart/diagram layer.',
    'Exact labels, numbers, arrows, and source wording stay controlled and are not generated as AI video.',
  ]
}

export function buildRendererNotes(
  asset: VisualAssetPlanItem,
  frameTemplate: FrameLayoutPlan,
  layoutItem?: SpeakerVisualLayoutPlanItem,
  depthItem?: DepthAwareOverlayPlanItem,
  renderStrategyItem?: RenderStrategyPlanItem,
  toolStrategyItems: ToolStrategyPlanItem[] = [],
  colorPipelinePlan?: ColorPipelinePlan,
  audioPipelinePlan?: AudioPipelinePlan,
  mapAnimationPlan?: MapAnimationPlan,
  dataVizPlan?: DataVizPlan,
) {
  const notes = [
    'Remotion places this asset inside the approved frame template.',
    'AI models generate assets/clips only; they do not own the final canvas.',
    ...renderStrategySummaryNotes(renderStrategyItem),
    ...toolStrategySummaryNotes(toolStrategyItems),
    ...colorPipelineLayerNotes(colorPipelinePlan, asset),
    ...audioPipelineLayerNotes(audioPipelinePlan, asset),
    ...mapAnimationLayerNotes(mapAnimationPlan, asset),
    ...dataVizLayerNotes(dataVizPlan, asset),
    ...layoutSummaryNotes(layoutItem),
    ...depthSummaryNotes(depthItem),
  ]

  if (asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene') {
    notes.push(`AI clip is generated on matching panel background ${frameTemplate.panelBackgroundColor}.`)
  }

  if (asset.assetType === 'motion_design_scene' || asset.assetType === 'graphic_design_frame') {
    notes.push('Graphic Design / VisualExplain motion stays controlled by ReeditPro.')
  }

  return notes
}

function layerZoneForAsset(asset: VisualAssetPlanItem, frameTemplate: FrameLayoutPlan, layoutItem?: SpeakerVisualLayoutPlanItem): RectZone {
  if (layoutItem?.visualZone) {
    return layoutItem.visualZone
  }

  if (asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene') {
    return frameTemplate.animationZone
  }

  if (asset.assetType === 'transition_scene') {
    return {
      x: 0,
      y: 0,
      width: frameTemplate.canvasWidth,
      height: frameTemplate.canvasHeight,
      label: 'Full canvas transition',
      notes: 'Transition overlays are controlled by ReeditPro.',
    }
  }

  return frameTemplate.animationZone
}

function fitModeForLayer(layerType: RendererLayerType): LayerFitMode {
  if (layerType === 'ai_video_panel') {
    return 'panel_contain'
  }

  if (layerType === 'source_video' || layerType === 'speaker_video') {
    return 'cover'
  }

  if (layerType === 'background_panel') {
    return 'fill'
  }

  if (layerType === 'caption') {
    return 'safe_contain'
  }

  if (layerType === 'foreground_mask') {
    return 'safe_contain'
  }

  return 'safe_contain'
}

function zIndexForLayer(layerType: RendererLayerType) {
  if (layerType === 'source_video' || layerType === 'speaker_video') {
    return 10
  }

  if (layerType === 'background_panel') {
    return 20
  }

  if (layerType === 'caption') {
    return 80
  }

  if (layerType === 'foreground_mask') {
    return 70
  }

  if (layerType === 'transition') {
    return 100
  }

  return 50
}

function depthPlanNotes(depthAwareOverlayPlan?: DepthAwareOverlayPlan) {
  if (!depthAwareOverlayPlan) {
    return ['No depth-aware overlay plan was provided.']
  }

  if (!depthAwareOverlayPlan.active) {
    return ['Depth-aware overlay plan is inactive for this edit.']
  }

  const modes = Array.from(new Set(depthAwareOverlayPlan.items.map((item) => formatLabel(item.depthCompositingMode)))).join(', ')
  const riskyFallbacks = depthAwareOverlayPlan.items
    .filter((item) => item.maskRisk === 'high' || item.maskRisk === 'premium')
    .map((item) => item.fallbackLayoutMode ? `${formatLabel(item.depthCompositingMode)} fallback ${formatLabel(item.fallbackLayoutMode)}` : formatLabel(item.depthCompositingMode))

  return [
    `Depth-aware overlay modes: ${modes}.`,
    'Depth layer planning is mock-only; future mask/segmentation workers are required for real foreground masks.',
    'Layer stack: base source video, overlay graphic/card/map layer, future foreground subject/object mask layer, captions/top text layer.',
    'Captions remain above graphics and masks.',
    ...(riskyFallbacks.length ? [`Risky depth fallbacks: ${riskyFallbacks.join('; ')}.`] : []),
  ]
}

function sourceLayer(
  frameTemplate: FrameLayoutPlan,
  totalDuration: number,
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): RendererLayerPlan {
  const zone = primarySpeakerZone(frameTemplate, speakerVisualLayoutPlan)
  const layoutItems = speakerVisualLayoutPlan?.items ?? []
  const visibleSpeaker = layoutItems.some((item) => item.speakerPresence !== 'voice_only' && item.speakerPresence !== 'hidden')
  const layerType: RendererLayerType = visibleSpeaker || frameTemplate.templateType === 'vertical_talking_head_lower_panel' || frameTemplate.speakerZone ? 'speaker_video' : 'source_video'

  return {
    id: 'renderer-layer-source-video',
    layerType,
    label: layerType === 'speaker_video' ? 'Speaker/source video' : 'Source video base',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer(layerType),
    zone,
    fitMode: fitModeForLayer(layerType),
    notes: [
      'User/source footage remains under ReeditPro layout control.',
      'Speaker visibility is planned per segment by the speaker/visual layout strategy.',
      ...(layoutItems.length ? [`Layout modes used: ${Array.from(new Set(layoutItems.map((item) => formatLabel(item.layoutMode)))).join(', ')}.`] : []),
      ...depthPlanNotes(depthAwareOverlayPlan).slice(0, 2),
    ],
  }
}

function backgroundPanelLayer(
  frameTemplate: FrameLayoutPlan,
  totalDuration: number,
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): RendererLayerPlan {
  return {
    id: 'renderer-layer-background-panel',
    layerType: 'background_panel',
    label: 'Matching AI visual panel background',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer('background_panel'),
    zone: primaryVisualZone(frameTemplate, speakerVisualLayoutPlan),
    fitMode: 'fill',
    backgroundColor: frameTemplate.panelBackgroundColor,
    notes: [
      'Panel color matches the default AI video generation background.',
      'Background panel follows the speaker/visual layout strategy when a visual takeover or lower panel is planned.',
      ...(depthAwareOverlayPlan?.active ? ['Panel/background remains below overlay and future foreground mask layers.'] : []),
    ],
  }
}

function captionLayer(
  frameTemplate: FrameLayoutPlan,
  totalDuration: number,
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): RendererLayerPlan | undefined {
  const captionZone = speakerVisualLayoutPlan?.items.find((item) => item.captionZone)?.captionZone ?? frameTemplate.captionSafeZone

  if (!captionZone) {
    return undefined
  }

  return {
    id: 'renderer-layer-captions',
    layerType: 'caption',
    label: 'Caption safe zone',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer('caption'),
    zone: captionZone,
    fitMode: 'safe_contain',
    notes: [
      'Captions stay inside ReeditPro safe zones and avoid faces/panel text.',
      'Caption placement must respect speaker/visual layout mode per segment.',
      ...(depthAwareOverlayPlan?.active ? ['Captions remain above future foreground masks and depth overlay graphics.'] : []),
    ],
  }
}

function foregroundMaskLayer(
  frameTemplate: FrameLayoutPlan,
  totalDuration: number,
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): RendererLayerPlan | undefined {
  if (!depthAwareOverlayPlan?.active) {
    return undefined
  }

  const contactObjects = depthAwareOverlayPlan.items
    .flatMap((item) => item.foregroundObjects)
    .filter((object) => object.kind === 'contact_object')
    .map((object) => object.label)

  return {
    id: 'renderer-layer-future-foreground-mask',
    layerType: 'foreground_mask',
    label: 'Future foreground subject/object masks',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer('foreground_mask'),
    zone: primarySpeakerZone(frameTemplate, speakerVisualLayoutPlan),
    fitMode: 'safe_contain',
    notes: [
      'Placeholder layer only: no real mask, segmentation, background removal, or tracking is executed.',
      'Future mask/segmentation worker required before real depth-aware compositing.',
      'Graphic/card/map layer should sit behind the planned foreground group.',
      ...(contactObjects.length ? [`Contact objects preserved in front of overlays: ${Array.from(new Set(contactObjects)).join(', ')}.`] : []),
      'Captions remain above this future mask layer.',
    ],
  }
}

function visualLayer(
  asset: VisualAssetPlanItem,
  frameTemplate: FrameLayoutPlan,
  startTimeSeconds: number,
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
  renderStrategyPlan?: RenderStrategyPlan,
  toolStrategyPlan?: ToolStrategyPlan,
  colorPipelinePlan?: ColorPipelinePlan,
  audioPipelinePlan?: AudioPipelinePlan,
  mapAnimationPlan?: MapAnimationPlan,
  dataVizPlan?: DataVizPlan,
): RendererLayerPlan {
  const layerType = getLayerTypeForAssetType(asset.assetType)
  const duration = getDisplayDurationForAsset(asset)
  const layoutItem = layoutItemForAsset(asset, speakerVisualLayoutPlan)
  const depthItem = depthItemForAsset(asset, depthAwareOverlayPlan)
  const renderStrategyItem = renderStrategyItemForAsset(asset, renderStrategyPlan)
  const toolStrategyItems = toolStrategyItemsForAsset(asset, renderStrategyItem, toolStrategyPlan)

  return {
    id: `renderer-layer-${asset.id}`,
    assetPlanItemId: asset.id,
    layerType,
    label: asset.beatLabel,
    startTimeSeconds,
    endTimeSeconds: startTimeSeconds + duration,
    zIndex: zIndexForLayer(layerType),
    zone: layerZoneForAsset(asset, frameTemplate, layoutItem),
    fitMode: fitModeForLayer(layerType),
    backgroundColor: layerType === 'ai_video_panel' ? frameTemplate.panelBackgroundColor : undefined,
    motionPreset: getMotionPresetForAsset(asset),
    notes: buildRendererNotes(asset, frameTemplate, layoutItem, depthItem, renderStrategyItem, toolStrategyItems, colorPipelinePlan, audioPipelinePlan, mapAnimationPlan, dataVizPlan),
  }
}

function renderStrategyPlanNotes(renderStrategyPlan?: RenderStrategyPlan, toolStrategyPlan?: ToolStrategyPlan, colorPipelinePlan?: ColorPipelinePlan, audioPipelinePlan?: AudioPipelinePlan, mapAnimationPlan?: MapAnimationPlan, dataVizPlan?: DataVizPlan) {
  if (!renderStrategyPlan) {
    return ['No render strategy plan was provided.']
  }

  const counts = Object.entries(renderStrategyPlan.strategyCounts)
    .filter(([, count]) => count > 0)
    .map(([strategyType, count]) => `${formatLabel(strategyType)}: ${count}`)
    .join(', ')

  return [
    `Render strategy plan: ${renderStrategyPlan.summary}`,
    counts ? `Render strategy counts: ${counts}.` : undefined,
    renderStrategyPlan.remotionCapabilitiesUsed.length
      ? `Remotion capabilities used: ${renderStrategyPlan.remotionCapabilitiesUsed.map(formatLabel).join(', ')}.`
      : undefined,
    renderStrategyPlan.openSourceToolsUsed.length
      ? `Open-source tool outputs expected later: ${renderStrategyPlan.openSourceToolsUsed.map(formatLabel).join(', ')}.`
      : undefined,
    renderStrategyPlan.providerModelsReferenced.length
      ? `Provider models referenced as asset routes: ${renderStrategyPlan.providerModelsReferenced.map(formatLabel).join(', ')}.`
      : undefined,
    toolStrategyPlan
      ? `Tool strategy plan: ${toolStrategyPlan.summary}`
      : 'No tool strategy plan was provided.',
    toolStrategyPlan?.items.length
      ? `Tool chains planned: ${toolStrategyPlan.chainIdsUsed.map(formatLabel).join(', ')}.`
      : undefined,
    colorPipelinePlan
      ? `Color pipeline plan: ${formatLabel(colorPipelinePlan.colorGradeStyle)} ${colorPipelinePlan.intensity}; tools planned ${colorPipelinePlan.toolsPlanned.map(formatLabel).join(', ')}.`
      : 'No color pipeline plan was provided.',
    audioPipelinePlan
      ? `Audio pipeline plan: ${formatLabel(audioPipelinePlan.soundStyle)} ${audioPipelinePlan.audioIntensity}; ${audioPipelinePlan.soundSyncCues.length} SoundSync cue(s) guide timing.`
      : 'No audio pipeline plan was provided.',
    mapAnimationPlan?.active
      ? `Map/location plan: ${mapAnimationPlan.items.length} item(s); tools planned ${mapAnimationPlan.mapToolsPlanned.map(formatLabel).join(', ')}.`
      : 'No active map/location plan was provided.',
    dataVizPlan?.active
      ? `Chart/diagram plan: ${dataVizPlan.items.length} item(s); tools planned ${dataVizPlan.toolsPlanned.map(formatLabel).join(', ')}.`
      : 'No active chart/diagram plan was provided.',
    'Remotion composes color-matched assets but is not the full professional color grading engine.',
    'Remotion previews SoundSync timing but is not the full audio processing engine.',
    'Remotion composes map assets/specs but does not render real maps in this milestone.',
    'Remotion composes chart/diagram assets/specs but does not render real D3/ECharts/Vega-Lite charts in this milestone.',
    'Render strategy does not install packages, execute tools, call providers, or render video.',
  ].filter(Boolean) as string[]
}

export function createRendererCompositionPlan({
  visualAssetPlan,
  frameTemplate,
  aspectRatio,
  targetPlatform,
  editLevel,
  speakerVisualLayoutPlan,
  depthAwareOverlayPlan,
  renderStrategyPlan,
  toolStrategyPlan,
  colorPipelinePlan,
  audioPipelinePlan,
  mapAnimationPlan,
  dataVizPlan,
}: CreateRendererCompositionPlanParams): RendererCompositionPlan {
  const visualLayers: RendererLayerPlan[] = []
  let cursor = 0

  visualAssetPlan.forEach((asset) => {
    const layer = visualLayer(asset, frameTemplate, cursor, speakerVisualLayoutPlan, depthAwareOverlayPlan, renderStrategyPlan, toolStrategyPlan, colorPipelinePlan, audioPipelinePlan, mapAnimationPlan, dataVizPlan)
    visualLayers.push(layer)
    cursor = layer.endTimeSeconds
  })

  const durationSeconds = Math.max(cursor, 3)
  const caption = captionLayer(frameTemplate, durationSeconds, speakerVisualLayoutPlan, depthAwareOverlayPlan)
  const foregroundMask = foregroundMaskLayer(frameTemplate, durationSeconds, speakerVisualLayoutPlan, depthAwareOverlayPlan)
  const layers = [
    sourceLayer(frameTemplate, durationSeconds, speakerVisualLayoutPlan, depthAwareOverlayPlan),
    backgroundPanelLayer(frameTemplate, durationSeconds, speakerVisualLayoutPlan, depthAwareOverlayPlan),
    ...visualLayers,
    ...(foregroundMask ? [foregroundMask] : []),
    ...(caption ? [caption] : []),
  ].sort((a, b) => a.zIndex - b.zIndex)
  const layoutModes = speakerVisualLayoutPlan
    ? Array.from(new Set(speakerVisualLayoutPlan.items.map((item) => formatLabel(item.layoutMode)))).join(', ')
    : 'none'

  return {
    id: `renderer-composition-${frameTemplate.templateType}`,
    engine: 'remotion',
    frameTemplate,
    durationSeconds,
    fps: 30,
    layers,
    captionSafeZone: frameTemplate.captionSafeZone,
    panelBackgroundColor: frameTemplate.panelBackgroundColor,
    rendererNotes: [
      'Remotion owns final canvas and timing.',
      'AI models generate assets/clips only.',
      'AI video panels use matching background color by default.',
      `Speaker/visual layout modes: ${layoutModes}.`,
      'Speaker presence, visual dominance, PIP, side-by-side, lower panels, and takeovers are structured plans only.',
      ...renderStrategyPlanNotes(renderStrategyPlan, toolStrategyPlan, colorPipelinePlan, audioPipelinePlan, mapAnimationPlan, dataVizPlan),
      ...depthPlanNotes(depthAwareOverlayPlan),
      'Do not render before plan and credit estimate approval.',
      `Planning context: ${targetPlatform}, ${aspectRatio}, ${editLevel}.`,
    ],
    approvalRequired: true,
    renderReady: false,
  }
}
