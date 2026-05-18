import type {
  AdaptiveEditStrategyPlan,
  AdaptiveSegmentStrategy,
  AudioPipelinePlan,
  ColorPipelinePlan,
  DataVizPlan,
  DepthAwareOverlayPlan,
  EditLevel,
  MapAnimationPlan,
  OpenSourceToolId,
  PlannerInput,
  RenderStrategyPlan,
  RenderStrategyPlanItem,
  SegmentEditPlan,
  SpeakerVisualLayoutPlan,
  ToolAdoptionStage,
  ToolChainId,
  ToolChainStep,
  ToolInputType,
  ToolOutputType,
  ToolSettingValue,
  ToolStrategyPlan,
  ToolStrategyPlanItem,
  ToolStrategyPurpose,
  ToolStrategyStatus,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import {
  getLaunchCoreTools,
  getPreset,
  getToolProfile,
  getToolsNeedingLicenseReview,
} from './tool-registry'

type CreateToolStrategyPlanParams = {
  input: PlannerInput
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  renderStrategyPlan?: RenderStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}

type ChainDefinition = {
  chainId: ToolChainId
  purpose: ToolStrategyPurpose
  primaryToolId: OpenSourceToolId
  toolIds: OpenSourceToolId[]
  fallbackToolIds: OpenSourceToolId[]
  presetIds: string[]
  whyNotAiVideo?: string
  whyNotRemotionOnly?: string
  creditImpact: ToolStrategyPlanItem['creditImpact']
  userFacingSummary: string
}

const providerModelIds = ['gpt_image_2', 'wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02', 'veo_3_1_lite'] as const

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function allPlanningText(params: CreateToolStrategyPlanParams) {
  return [
    params.input.customInstructions,
    params.videoUnderstandingReport?.overallSummary,
    ...(params.videoUnderstandingReport?.visualUnderstanding.contactObjectOpportunities ?? []),
    ...(params.videoUnderstandingReport?.visualUnderstanding.depthCompositionOpportunities ?? []),
    ...(params.videoUnderstandingReport?.visualSupportOpportunities.map((opportunity) => `${opportunity.opportunityType} ${opportunity.reason}`) ?? []),
    ...(params.adaptiveEditStrategyPlan?.segmentStrategies.flatMap((strategy) => [
      strategy.label,
      strategy.decisionKind,
      strategy.recommendedVisualSupport,
      ...strategy.recommendedToolHints,
      ...strategy.reasons.map((reason) => reason.explanation),
    ]) ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function segmentForItem(item: RenderStrategyPlanItem, segmentEditPlans?: SegmentEditPlan[]) {
  return segmentEditPlans?.find((segment) =>
    segment.id === item.segmentId ||
    Boolean(item.assetPlanItemId && segment.visualAssetPlanItemIds.includes(item.assetPlanItemId)),
  )
}

function assetForItem(item: RenderStrategyPlanItem, visualAssetPlan?: VisualAssetPlanItem[]) {
  return visualAssetPlan?.find((asset) => asset.id === item.assetPlanItemId)
}

function adaptiveStrategyForItem(params: {
  item: RenderStrategyPlanItem
  segment?: SegmentEditPlan
  asset?: VisualAssetPlanItem
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
}) {
  const { adaptiveEditStrategyPlan, asset, item, segment } = params

  return adaptiveEditStrategyPlan?.segmentStrategies.find((strategy) =>
    strategy.segmentId === item.segmentId ||
    strategy.segmentId === segment?.id ||
    Boolean(strategy.clipId && segment?.sourceClipIds.includes(strategy.clipId)) ||
    strategy.recommendedAssetType === asset?.assetType ||
    strategy.recommendedSignatureSystem === asset?.signatureSystem,
  )
}

function stageRank(stage: ToolAdoptionStage) {
  const ranks: Record<ToolAdoptionStage, number> = {
    launch_core: 0,
    planned: 1,
    future: 2,
    experimental: 3,
    needs_license_review: 4,
  }

  return ranks[stage]
}

function highestAdoptionStage(toolIds: OpenSourceToolId[]): ToolAdoptionStage {
  const stages = toolIds
    .map((toolId) => getToolProfile(toolId)?.adoptionStage)
    .filter((stage): stage is ToolAdoptionStage => Boolean(stage))

  return stages.sort((a, b) => stageRank(b) - stageRank(a))[0] ?? 'launch_core'
}

function tierAllowedForChain(chainId: ToolChainId, editLevel: EditLevel) {
  if (chainId === 'premium_rescue_chain') {
    return { basic: false, pro: false, premium: editLevel === 'premium' }
  }

  if (chainId === 'visual_qa_chain' || chainId === 'color_pipeline_chain' || chainId === 'audio_pipeline_chain') {
    return { basic: true, pro: true, premium: true }
  }

  if (chainId === 'map_route_chain' || chainId === 'chart_diagram_chain' || chainId === 'browser_capture_chain') {
    return { basic: true, pro: true, premium: true }
  }

  return { basic: true, pro: true, premium: true }
}

function statusForTools(toolIds: OpenSourceToolId[], chainId: ToolChainId, editLevel: EditLevel): ToolStrategyStatus {
  if (chainId === 'premium_rescue_chain' && editLevel !== 'premium') {
    return 'not_available_in_tier'
  }

  if (toolIds.some((toolId) => getToolsNeedingLicenseReview().some((tool) => tool.id === toolId))) {
    return 'needs_license_review'
  }

  if (toolIds.some((toolId) => {
    const stage = getToolProfile(toolId)?.adoptionStage
    return stage === 'future' || stage === 'experimental'
  })) {
    return 'future_only'
  }

  return 'planned'
}

function defaultSetting(settingId: string, value: unknown, source: ToolSettingValue['source'] = 'planner', notes?: string): ToolSettingValue {
  return { settingId, value, source, notes }
}

function remotionSettings(input: PlannerInput, asset?: VisualAssetPlanItem): ToolSettingValue[] {
  const isVertical = input.aspectRatio === '9:16'
  const isSquare = input.aspectRatio === '1:1'
  const width = isVertical ? 1080 : isSquare ? 1080 : 1920
  const height = isVertical ? 1920 : isSquare ? 1080 : 1080

  return [
    defaultSetting('compositionWidth', width, 'planner'),
    defaultSetting('compositionHeight', height, 'planner'),
    defaultSetting('fps', 30, 'planner'),
    defaultSetting('aspectRatio', input.aspectRatio, 'user_request'),
    defaultSetting('frameTemplate', asset?.frameTemplateType ?? input.frameTemplateType ?? 'auto', 'planner'),
    defaultSetting('motionPreset', asset?.renderStrategyType === 'remotion_only' ? 'controlled_layer_reveal' : 'panel_placement', 'planner'),
    defaultSetting('captionSafeZone', 'preserve frame-layout caption safe zone', 'qa_requirement'),
    defaultSetting('panelBackgroundColor', '#f8fafc', 'planner', 'Use matching panel background; no transparent AI-video default.'),
  ]
}

function mapSettings(input: PlannerInput, mapAnimationPlan?: MapAnimationPlan): ToolSettingValue[] {
  if (mapAnimationPlan?.active && mapAnimationPlan.items.length > 0) {
    const item = mapAnimationPlan.items[0]
    const firstLocation = item.locations[0]

    return [
      defaultSetting('mapStyle', item.style.styleFamily, 'planner'),
      defaultSetting('mapVisualType', item.mapVisualType, 'planner'),
      defaultSetting('mapDataSource', firstLocation?.dataSource ?? 'unknown', 'planner'),
      defaultSetting('locationConfidence', firstLocation?.confidence ?? 'unknown', 'qa_requirement'),
      defaultSetting('sourceNeeded', item.locations.some((location) => location.sourceNeeded), 'qa_requirement'),
      defaultSetting('safeLocationWording', item.locations.map((location) => location.safeWording).join(', '), 'qa_requirement'),
      defaultSetting('centerCoordinates', item.camera.center ?? 'planned from approved location references', 'planner'),
      defaultSetting('zoom', item.camera.zoom ?? (input.editLevel === 'basic' ? 10 : 12), 'planner'),
      defaultSetting('bearing', item.camera.bearing ?? 0, 'planner'),
      defaultSetting('pitch', item.camera.pitch ?? 0, 'planner'),
      defaultSetting('flyDuration', item.camera.flyDurationMs ? item.camera.flyDurationMs / 1000 : input.editLevel === 'basic' ? 2.5 : 3.5, 'planner'),
      defaultSetting('routeLineColor', item.route?.routeLineColor ?? item.style.routeColor, 'planner'),
      defaultSetting('routeLineWidth', item.route?.routeLineWidth ?? (input.editLevel === 'basic' ? 4 : 5), 'planner'),
      defaultSetting('routeRevealDuration', item.route?.routeRevealDurationMs ?? 0, 'planner'),
      defaultSetting('pinStyle', { style: 'clean_pin', labelSafe: true, sourceNeeded: firstLocation?.sourceNeeded ?? true }, 'planner'),
      defaultSetting('labelStyle', { density: item.style.labelDensity, avoidZones: item.layout.labelAvoidZones.length }, 'planner'),
      defaultSetting('fitBounds', item.camera.fitBounds ?? 'planned route or region bounds', 'planner'),
      defaultSetting('padding', item.camera.fitBounds?.padding ?? 96, 'qa_requirement'),
      defaultSetting('foregroundMaskAwareness', item.layout.foregroundMaskAware, 'qa_requirement'),
    ]
  }

  const instructions = input.customInstructions.toLowerCase()
  const mapStyle =
    input.editingCategory === 'documentary_case_study' ? 'muted_evidence_map' :
    includesAny(instructions, ['real estate', 'neighborhood', 'property']) ? 'clean_neighborhood_map' :
    includesAny(instructions, ['travel', 'route']) ? 'warm_route_map' :
    'reeditpro_clean_map'

  return [
    defaultSetting('mapStyle', mapStyle, 'planner'),
    defaultSetting('centerCoordinates', 'planned from approved location references', 'planner'),
    defaultSetting('zoom', input.editLevel === 'basic' ? 10 : 12, 'planner'),
    defaultSetting('bearing', input.editLevel === 'basic' ? 0 : 18, 'planner'),
    defaultSetting('pitch', input.editLevel === 'premium' ? 45 : input.editLevel === 'pro' ? 30 : 0, 'planner'),
    defaultSetting('flyDuration', input.editLevel === 'basic' ? 2.5 : 3.5, 'planner'),
    defaultSetting('routeLineColor', 'brand_cyan', 'planner'),
    defaultSetting('routeLineWidth', input.editLevel === 'basic' ? 4 : 5, 'planner'),
    defaultSetting('pinStyle', { style: 'clean_pin', labelSafe: true }, 'planner'),
    defaultSetting('labelStyle', { density: input.editLevel === 'basic' ? 'low' : 'medium', avoidSpeakerZone: true }, 'planner'),
    defaultSetting('fitBounds', 'planned route or region bounds', 'planner'),
    defaultSetting('padding', { top: 72, right: 72, bottom: 160, left: 72 }, 'qa_requirement'),
  ]
}

function chartSettings(input: PlannerInput, adaptiveStrategy?: AdaptiveSegmentStrategy, dataVizPlan?: DataVizPlan): ToolSettingValue[] {
  if (dataVizPlan?.active && dataVizPlan.items.length > 0) {
    const item = dataVizPlan.items[0]

    return [
      defaultSetting('visualizationType', item.visualType, 'planner'),
      defaultSetting('dataSourceType', item.dataPlan.dataSourceType, 'planner'),
      defaultSetting('dataConfidence', item.dataPlan.confidence, 'qa_requirement'),
      defaultSetting('sourceNeeded', item.dataPlan.sourceNeeded, 'qa_requirement'),
      defaultSetting('safeWording', item.dataPlan.safeWording, 'qa_requirement'),
      defaultSetting('mockDataFlag', item.dataPlan.mockData, 'qa_requirement'),
      defaultSetting('fictionalDataFlag', item.dataPlan.fictionalData, 'qa_requirement'),
      defaultSetting('dataFields', item.dataPlan.dataPoints.map((point) => point.label), 'planner'),
      defaultSetting('nodes', item.dataPlan.nodes.map((node) => ({ id: node.id, label: node.label, confidence: node.confidence })), 'planner'),
      defaultSetting('edges', item.dataPlan.edges.map((edge) => ({ from: edge.fromNodeId, to: edge.toNodeId, label: edge.label, confidence: edge.confidence })), 'planner'),
      defaultSetting('chartType', item.visualType.includes('chart') ? item.visualType : 'diagram', 'planner'),
      defaultSetting('diagramType', item.visualType, 'planner'),
      defaultSetting('colorPalette', item.style.colorPalette, 'planner'),
      defaultSetting('highlightColor', item.style.highlightColor, 'planner'),
      defaultSetting('labelDensity', item.style.labelDensity, 'planner'),
      defaultSetting('labelPlacement', { avoidCaptions: true, avoidSpeaker: true, maxLabelCount: item.layout.maxLabelCount }, 'qa_requirement'),
      defaultSetting('animationType', item.animation.animationType, 'planner'),
      defaultSetting('animationDuration', item.animation.durationMs, 'planner'),
      defaultSetting('revealOrder', item.animation.revealOrder, 'planner'),
      defaultSetting('soundSyncCueId', item.animation.soundSyncCueIds.join(', ') || 'none', 'planner'),
      defaultSetting('preferredTool', item.preferredTool, 'planner'),
      defaultSetting('panelBackgroundColor', item.layout.panelBackgroundColor, 'planner'),
    ]
  }

  const text = `${input.customInstructions} ${adaptiveStrategy?.label ?? ''} ${adaptiveStrategy?.reasons.map((reason) => reason.explanation).join(' ') ?? ''}`.toLowerCase()
  const visualizationType = includesAny(text, ['money', 'flow', 'scam', 'account']) ? 'money_flow_diagram' :
    includesAny(text, ['step', 'process', 'how']) ? 'step_flow_diagram' :
    'structured_chart'

  return [
    defaultSetting('visualizationType', visualizationType, 'adaptive_strategy'),
    defaultSetting('dataFields', 'planned labels and values from approved script/data', 'planner'),
    defaultSetting('scales', { exactLabels: true, noInventedData: true }, 'qa_requirement'),
    defaultSetting('axes', { readable: true, simplifiedForMobile: input.aspectRatio === '9:16' }, 'planner'),
    defaultSetting('colorScale', ['brand_blue', 'brand_cyan', 'brand_violet'], 'planner'),
    defaultSetting('transitionDuration', input.editLevel === 'basic' ? 500 : 800, 'planner'),
    defaultSetting('easing', 'easeOutCubic', 'planner'),
    defaultSetting('labelPlacement', { avoidCaptions: true, avoidSpeaker: true }, 'qa_requirement'),
    defaultSetting('annotationStyle', { concise: true, neutralFactSafety: input.editingCategory === 'documentary_case_study' }, 'qa_requirement'),
    defaultSetting('chartType', includesAny(text, ['line']) ? 'line' : includesAny(text, ['bar']) ? 'bar' : 'diagram', 'planner'),
  ]
}

function browserSettings(input: PlannerInput): ToolSettingValue[] {
  const isVertical = input.aspectRatio === '9:16'
  const isSquare = input.aspectRatio === '1:1'

  return [
    defaultSetting('url', 'approved user-provided or internal URL only', 'user_request'),
    defaultSetting('viewportWidth', isVertical ? 390 : isSquare ? 1080 : 1440, 'planner'),
    defaultSetting('viewportHeight', isVertical ? 844 : isSquare ? 1080 : 900, 'planner'),
    defaultSetting('deviceScaleFactor', 2, 'planner'),
    defaultSetting('fullPage', false, 'planner'),
    defaultSetting('selector', 'optional approved capture target', 'planner'),
    defaultSetting('imageFormat', 'png', 'planner'),
    defaultSetting('quality', 92, 'planner'),
    defaultSetting('waitForSelector', 'planned only; future worker must verify selector', 'planner'),
    defaultSetting('resizeWidth', isVertical ? 1080 : 1440, 'planner'),
    defaultSetting('resizeHeight', isVertical ? 1400 : 900, 'planner'),
    defaultSetting('fitMode', 'contain', 'planner'),
  ]
}

function colorSettings(input: PlannerInput, colorPipelinePlan?: ColorPipelinePlan): ToolSettingValue[] {
  if (colorPipelinePlan) {
    const operations = colorPipelinePlan.projectOperations.map((operation) => operation.operation)

    return [
      defaultSetting('colorGradeStyle', colorPipelinePlan.colorGradeStyle, 'planner'),
      defaultSetting('lookIntensity', colorPipelinePlan.intensity, 'planner'),
      defaultSetting('colorBalance', 'planned from ColorPipelinePlan project/clip operations', 'planner'),
      defaultSetting('colorLevels', operations.includes('highlight_recovery') ? 'highlight recovery planned' : 'clean legal/social-safe levels', 'planner'),
      defaultSetting('lutStrength', colorPipelinePlan.intensity === 'strong' ? 0.45 : colorPipelinePlan.intensity === 'subtle' ? 0.15 : 0.25, 'planner'),
      defaultSetting('brightness', operations.includes('exposure_correction') ? 'exposure correction planned' : 0, 'planner'),
      defaultSetting('contrast', operations.includes('contrast_curve') ? 'planned contrast curve' : 'natural contrast', 'planner'),
      defaultSetting('saturation', colorPipelinePlan.colorGradeStyle === 'documentary_neutral' ? 'restrained documentary saturation' : 'controlled saturation', 'planner'),
      defaultSetting('skinToneProtection', operations.includes('skin_tone_protection'), 'qa_requirement'),
      defaultSetting('shotMatchingEnabled', operations.includes('shot_matching'), 'qa_requirement'),
      defaultSetting('generatedAssetColorMatch', colorPipelinePlan.assetMatchPlans.length > 0, 'qa_requirement'),
      defaultSetting('aiVideoAssetColorMatch', colorPipelinePlan.assetMatchPlans.some((plan) => plan.operations.some((operation) => operation.operation === 'ai_video_asset_match')), 'qa_requirement'),
      defaultSetting('pixelFormat', 'yuv420p', 'planner'),
      defaultSetting('outputColorSpace', 'delivery_rec709_placeholder', 'planner'),
      defaultSetting('acesPipelineEnabled', colorPipelinePlan.toolsPlanned.includes('opencolorio'), 'planner', 'OpenColorIO remains planned/future only.'),
    ]
  }

  return [
    defaultSetting('colorBalance', input.editLevel === 'basic' ? 'clean natural balance' : 'shot match and skin/product protection', 'planner'),
    defaultSetting('colorLevels', 'protect highlights and readable overlays', 'planner'),
    defaultSetting('lutStrength', input.editLevel === 'premium' ? 0.45 : 0.25, 'planner'),
    defaultSetting('brightness', 0, 'planner'),
    defaultSetting('contrast', input.editLevel === 'basic' ? 1.05 : 1.12, 'planner'),
    defaultSetting('saturation', input.editingCategory === 'documentary_case_study' ? 0.95 : 1.05, 'planner'),
    defaultSetting('pixelFormat', 'yuv420p', 'planner'),
    defaultSetting('outputColorSpace', 'delivery_rec709_placeholder', 'planner'),
    defaultSetting('acesPipelineEnabled', input.editLevel === 'premium', 'planner', 'OpenColorIO remains planned/future only.'),
  ]
}

function audioSettings(input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan): ToolSettingValue[] {
  if (audioPipelinePlan) {
    const operationIds = audioPipelinePlan.projectOperations.map((operation) => operation.operation)

    return [
      defaultSetting('soundStyle', audioPipelinePlan.soundStyle, 'planner'),
      defaultSetting('audioIntensity', audioPipelinePlan.audioIntensity, 'planner'),
      defaultSetting('musicPolicy', audioPipelinePlan.musicBedPlan.policy, 'planner'),
      defaultSetting('duckingEnabled', audioPipelinePlan.musicBedPlan.duckingEnabled, 'planner'),
      defaultSetting('duckingStrength', audioPipelinePlan.musicBedPlan.duckingStrength, 'planner'),
      defaultSetting('sfxPolicy', audioPipelinePlan.sfxPlan.policy, 'planner'),
      defaultSetting('sfxIntensity', audioPipelinePlan.sfxPlan.intensity, 'planner'),
      defaultSetting('maxSfxPerMinute', audioPipelinePlan.sfxPlan.maxSfxPerMinute, 'planner'),
      defaultSetting('beatGridEnabled', audioPipelinePlan.beatSyncPlan.strategy !== 'none', 'planner'),
      defaultSetting('bpmDetection', audioPipelinePlan.beatSyncPlan.bpmDetectionPlanned, 'planner'),
      defaultSetting('onsetDetection', audioPipelinePlan.beatSyncPlan.onsetDetectionPlanned, 'planner'),
      defaultSetting('loudnessTarget', input.editLevel === 'basic' ? -16 : -14, 'planner'),
      defaultSetting('truePeakTarget', -1, 'planner'),
      defaultSetting('audioNormalization', operationIds.includes('loudness_normalization'), 'planner'),
      defaultSetting('silenceDetection', operationIds.includes('silence_cleanup'), 'planner'),
      defaultSetting('avoidRandomSfx', true, 'qa_requirement'),
      defaultSetting('musicMustNotOverpowerVoice', true, 'qa_requirement'),
    ]
  }

  return [
    defaultSetting('loudnessTarget', input.editLevel === 'basic' ? -16 : -14, 'planner'),
    defaultSetting('truePeakTarget', -1, 'planner'),
    defaultSetting('audioNormalization', true, 'planner'),
    defaultSetting('silenceDetection', true, 'planner'),
    defaultSetting('bpmDetection', input.editLevel !== 'basic', 'planner'),
    defaultSetting('onsetDetection', input.editLevel !== 'basic', 'planner'),
    defaultSetting('loudness', { voiceFirst: true, duckMusic: true }, 'planner'),
    defaultSetting('energy', input.editLevel === 'premium' ? 'subtle_sound_sync_energy_map' : 'basic_voice_energy', 'planner'),
    defaultSetting('mood', input.moodStyle, 'user_request'),
  ]
}

function qaSettings(input: PlannerInput, depthAwareOverlayPlan?: DepthAwareOverlayPlan): ToolSettingValue[] {
  return [
    defaultSetting('safeZoneCollisionThreshold', 0.08, 'qa_requirement'),
    defaultSetting('panelBackgroundMatchTolerance', 12, 'qa_requirement'),
    defaultSetting('blurThreshold', input.editLevel === 'premium' ? 90 : 70, 'qa_requirement'),
    defaultSetting('cropSafetyMargin', input.aspectRatio === '9:16' ? 96 : 72, 'qa_requirement'),
    defaultSetting('faceDetectionConfidence', 0.75, 'qa_requirement'),
    defaultSetting('objectDetectionThreshold', depthAwareOverlayPlan?.active ? 0.72 : 0.6, 'qa_requirement'),
  ]
}

function settingsForChain(chainId: ToolChainId, input: PlannerInput, params: {
  asset?: VisualAssetPlanItem
  adaptiveStrategy?: AdaptiveSegmentStrategy
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}) {
  if (chainId === 'map_route_chain') return mapSettings(input, params.mapAnimationPlan)
  if (chainId === 'chart_diagram_chain') return chartSettings(input, params.adaptiveStrategy, params.dataVizPlan)
  if (chainId === 'browser_capture_chain') return browserSettings(input)
  if (chainId === 'color_pipeline_chain') return colorSettings(input, params.colorPipelinePlan)
  if (chainId === 'audio_pipeline_chain') return audioSettings(input, params.audioPipelinePlan)
  if (chainId === 'visual_qa_chain') return qaSettings(input, params.depthAwareOverlayPlan)
  return remotionSettings(input, params.asset)
}

function definitionForChain(chainId: ToolChainId, input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan): ChainDefinition {
  switch (chainId) {
    case 'map_route_chain':
      return {
        chainId,
        purpose: 'map_animation',
        primaryToolId: 'maplibre',
        toolIds: ['maplibre', 'turf', 'remotion'],
        fallbackToolIds: ['remotion'],
        presetIds: includesAny(input.customInstructions.toLowerCase(), ['real estate', 'neighborhood']) ? ['real_estate_neighborhood_map'] : ['map_route_reveal'],
        whyNotAiVideo: 'Map/location visuals need controlled labels, pins, camera motion, and geography. AI video could invent inaccurate maps.',
        whyNotRemotionOnly: 'Remotion composes the map, but MapLibre/Turf-style planning is needed for map tiles, route bounds, and geography.',
        creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
        userFacingSummary: 'Map route/reveal planned with controlled geography and Remotion placement.',
      }
    case 'chart_diagram_chain':
      return {
        chainId,
        purpose: 'chart_diagram',
        primaryToolId: 'd3',
        toolIds: ['d3', 'echarts', 'remotion'],
        fallbackToolIds: ['echarts', 'remotion'],
        presetIds: ['money_flow_diagram'],
        whyNotAiVideo: 'Diagrams need exact labels, arrows, and data structure. AI video is less reliable for exact information.',
        whyNotRemotionOnly: 'Remotion can place and animate the diagram, but D3/ECharts-style specs keep labels and data structure controlled.',
        creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
        userFacingSummary: 'Chart/diagram planned as controlled data visual instead of generated video.',
      }
    case 'browser_capture_chain':
      return {
        chainId,
        purpose: 'browser_capture',
        primaryToolId: 'playwright',
        toolIds: ['playwright', 'sharp', 'remotion'],
        fallbackToolIds: ['sharp', 'remotion'],
        presetIds: ['browser_dashboard_capture'],
        whyNotAiVideo: 'Website/app visuals should be captured or represented accurately instead of generated.',
        whyNotRemotionOnly: 'Remotion frames the capture, but a future browser/image prep worker is needed for accurate screenshots.',
        creditImpact: 'medium',
        userFacingSummary: 'Website or dashboard capture planned as future controlled screenshot asset.',
      }
    case 'color_pipeline_chain':
      return {
        chainId,
        purpose: 'color_processing',
        primaryToolId: 'ffmpeg',
        toolIds: input.editLevel === 'premium' ? ['ffmpeg', 'opencolorio'] : ['ffmpeg'],
        fallbackToolIds: ['ffmpeg'],
        presetIds: [input.editingCategory === 'documentary_case_study' ? 'documentary_neutral_color_pass' : input.editLevel === 'premium' ? 'premium_clean_color_pass' : 'clean_natural_color_pass'],
        whyNotAiVideo: 'Color grading should be deterministic and consistent across clips.',
        creditImpact: input.editLevel === 'basic' ? 'none' : 'low',
        userFacingSummary: 'Color cleanup planned as deterministic future processing, not generation.',
      }
    case 'audio_pipeline_chain':
      {
        const needsStretch = audioPipelinePlan?.toolsPlanned.includes('signalsmith_stretch') ?? false
        const toolIds: OpenSourceToolId[] = input.editLevel === 'basic'
          ? ['ffmpeg']
          : needsStretch
            ? ['ffmpeg', 'audioflux', 'signalsmith_stretch']
            : ['ffmpeg', 'audioflux']

        return {
          chainId,
          purpose: 'audio_processing',
          primaryToolId: 'ffmpeg',
          toolIds,
          fallbackToolIds: ['ffmpeg'],
          presetIds: [input.editLevel === 'premium' ? 'soundsync_subtle_premium' : 'voice_cleanup_basic'],
          whyNotAiVideo: 'Audio cleanup, beat detection, and time stretching are deterministic audio worker tasks, not AI video tasks.',
          creditImpact: input.editLevel === 'basic' ? 'none' : 'low',
          userFacingSummary: needsStretch
            ? 'Voice cleanup, SoundSync timing, and music stretch/pitch fitting planned as future audio worker tasks.'
            : 'Voice cleanup and SoundSync timing planned as future audio pipeline.',
        }
      }
    case 'visual_qa_chain':
      return {
        chainId,
        purpose: 'visual_qa',
        primaryToolId: 'opencv',
        toolIds: ['opencv', 'sharp'],
        fallbackToolIds: ['sharp'],
        presetIds: ['foreground_safe_zone_qa', 'panel_background_match_qa'],
        whyNotAiVideo: 'Safe-zone, crop, blur, and panel-match QA should be measured rather than generated.',
        whyNotRemotionOnly: 'Remotion can enforce layout, but future QA tools check collisions and visual quality.',
        creditImpact: input.editLevel === 'premium' ? 'medium' : 'low',
        userFacingSummary: 'Visual QA planned for face/object safe zones, captions, and panel matching.',
      }
    case 'ai_animation_asset_chain':
      return {
        chainId,
        purpose: 'ai_asset_generation_support',
        primaryToolId: 'remotion',
        toolIds: ['remotion'],
        fallbackToolIds: ['remotion'],
        presetIds: ['premium_lower_panel'],
        creditImpact: input.editLevel === 'premium' ? 'high' : 'medium',
        userFacingSummary: 'AI animation is treated as an asset; Remotion composes it into the final canvas.',
      }
    case 'premium_rescue_chain':
      return {
        chainId,
        purpose: 'ai_asset_generation_support',
        primaryToolId: 'remotion',
        toolIds: ['remotion'],
        fallbackToolIds: ['remotion'],
        presetIds: ['premium_lower_panel'],
        creditImpact: 'premium',
        userFacingSummary: 'Premium rescue is provider fallback only; Remotion still owns placement.',
      }
    case 'remotion_layout_chain':
    default:
      return {
        chainId: 'remotion_layout_chain',
        purpose: 'layout_composition',
        primaryToolId: 'remotion',
        toolIds: ['remotion'],
        fallbackToolIds: [],
        presetIds: ['clean_social_caption_layout', input.editLevel === 'premium' ? 'premium_lower_panel' : 'clean_social_caption_layout'],
        whyNotAiVideo: 'Captions, cards, labels, and layout need exact text and safe zones, so controlled Remotion motion is preferred.',
        creditImpact: 'none',
        userFacingSummary: 'Remotion layout planned directly for exact captions, cards, panels, and safe zones.',
      }
  }
}

function chainFromRenderItem(item: RenderStrategyPlanItem, adaptiveStrategy: AdaptiveSegmentStrategy | undefined, params: CreateToolStrategyPlanParams): ToolChainId {
  const hints = adaptiveStrategy?.recommendedToolHints ?? []
  const text = `${item.label} ${item.purpose} ${item.reason} ${params.input.customInstructions}`.toLowerCase()

  if (hints.includes('map_tool') || item.selectedOpenSourceTools.some((tool) => tool === 'maplibre' || tool === 'turf') || includesAny(text, ['map', 'route', 'city', 'location', 'travel', 'real estate'])) {
    return 'map_route_chain'
  }

  if (hints.includes('chart_tool') || item.selectedOpenSourceTools.some((tool) => tool === 'd3' || tool === 'echarts') || includesAny(text, ['chart', 'diagram', 'money', 'flow', 'account', 'timeline', 'data'])) {
    return 'chart_diagram_chain'
  }

  if (hints.includes('browser_capture_tool') || item.selectedOpenSourceTools.includes('playwright') || includesAny(text, ['website', 'dashboard', 'app', 'saas', 'browser', 'screen'])) {
    return 'browser_capture_chain'
  }

  if (item.strategyType === 'ai_video_then_remotion' || item.strategyType === 'hybrid_generation_then_remotion') {
    return item.selectedProviderModels.includes('veo_3_1_lite') && params.input.editLevel === 'premium'
      ? 'premium_rescue_chain'
      : 'ai_animation_asset_chain'
  }

  if (item.strategyType === 'worker_preprocess_then_remotion' && item.selectedOpenSourceTools.includes('opencv')) {
    return 'visual_qa_chain'
  }

  return 'remotion_layout_chain'
}

function stepForTool(params: {
  chainId: ToolChainId
  toolId: OpenSourceToolId
  order: number
  presetIds: string[]
  settings: ToolSettingValue[]
  status: ToolStrategyStatus
  purpose: ToolStrategyPurpose
  reason: string
}) {
  const { chainId, order, presetIds, purpose, reason, settings, status, toolId } = params
  const profile = getToolProfile(toolId)

  return {
    id: `${chainId}-step-${order}-${toolId}`,
    order,
    toolId,
    label: profile?.label ?? label(toolId),
    executionMode: profile?.executionMode ?? 'planning_only',
    purpose,
    inputTypes: profile?.inputTypes ?? ['none'],
    outputTypes: profile?.outputTypes ?? ['none'],
    presetIds: presetIds.filter((presetId) => getPreset(presetId)?.toolIds.includes(toolId)),
    settings,
    status,
    reason,
    qaChecks: [
      ...(profile?.qaChecks.slice(0, 3) ?? []),
      'Planning only; no package is installed and no tool is executed in this frontend demo.',
    ],
    workerNotes: [
      profile?.executionMode === 'inside_remotion'
        ? 'Runs as Remotion/browser-compatible planning only in this milestone.'
        : 'Future worker execution would require approved plan snapshot and backend worker milestone.',
      ...(profile?.productionNotes.slice(0, 2) ?? []),
    ],
  } satisfies ToolChainStep
}

function createToolStrategyItem(params: {
  chainId: ToolChainId
  index: number
  input: PlannerInput
  renderItem?: RenderStrategyPlanItem
  adaptiveStrategy?: AdaptiveSegmentStrategy
  asset?: VisualAssetPlanItem
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}) {
  const { adaptiveStrategy, asset, audioPipelinePlan, chainId, colorPipelinePlan, dataVizPlan, depthAwareOverlayPlan, index, input, mapAnimationPlan, renderItem } = params
  const definition = definitionForChain(chainId, input, audioPipelinePlan)
  const status = statusForTools(definition.toolIds, chainId, input.editLevel)
  const settings = settingsForChain(chainId, input, { adaptiveStrategy, asset, audioPipelinePlan, colorPipelinePlan, dataVizPlan, depthAwareOverlayPlan, mapAnimationPlan })
  const steps = definition.toolIds.map((toolId, toolIndex) => stepForTool({
    chainId,
    order: toolIndex + 1,
    presetIds: definition.presetIds,
    purpose: definition.purpose,
    reason: toolId === 'remotion'
      ? 'Remotion owns final canvas, timing, layers, and placement.'
      : `${label(toolId)} is planned because ${definition.userFacingSummary}`,
    settings: toolIndex === 0 ? settings : settings.filter((setting) => ['planningOnly', 'requiresApproval', 'panelBackgroundColor', 'captionSafeZone'].includes(setting.settingId)),
    status,
    toolId,
  }))
  const expectedInputs = unique(steps.flatMap((step) => step.inputTypes)) as ToolInputType[]
  const expectedOutputs = unique(steps.flatMap((step) => step.outputTypes)) as ToolOutputType[]
  const licenseNotes = definition.toolIds.flatMap((toolId) => getToolProfile(toolId)?.licenseNotes ?? [])

  return {
    id: renderItem ? `tool-strategy-${renderItem.id}` : `tool-strategy-global-${chainId}-${index + 1}`,
    segmentId: renderItem?.segmentId,
    assetPlanItemId: renderItem?.assetPlanItemId,
    renderStrategyItemId: renderItem?.id,
    adaptiveStrategyItemId: adaptiveStrategy?.id,
    chainId,
    label: renderItem ? `${renderItem.label} tool chain` : label(chainId),
    purpose: definition.purpose,
    selectedToolIds: definition.toolIds,
    primaryToolId: definition.primaryToolId,
    fallbackToolIds: definition.fallbackToolIds,
    steps,
    expectedInputs,
    expectedOutputs,
    settingsSummary: settings.map((setting) => `${setting.settingId}: ${String(setting.value)}`).slice(0, 8).join('; '),
    reason: renderItem
      ? `${definition.userFacingSummary} Render strategy is ${label(renderItem.strategyType)} because ${renderItem.reason}`
      : definition.userFacingSummary,
    whyNotAiVideo: definition.whyNotAiVideo,
    whyNotRemotionOnly: definition.whyNotRemotionOnly,
    tierAllowed: tierAllowedForChain(chainId, input.editLevel),
    status,
    adoptionStage: highestAdoptionStage(definition.toolIds),
    creditImpact: definition.creditImpact,
    fallbackStrategy: [
      ...(adaptiveStrategy?.fallbackStrategy.slice(0, 2) ?? []),
      chainId === 'map_route_chain' ? 'Use a static map card or lower visual panel if animated map planning is too complex.' : undefined,
      chainId === 'chart_diagram_chain' ? 'Use a simplified chart/card if custom diagram planning is too complex.' : undefined,
      chainId === 'browser_capture_chain' ? 'Use a designed product card if approved capture inputs are missing.' : undefined,
      chainId === 'ai_animation_asset_chain' ? 'Convert to still/card or controlled motion design if AI video is too costly or risky.' : undefined,
      chainId === 'premium_rescue_chain' ? 'Use Wan/Hailuo retries and simplification before Premium final Veo fallback.' : undefined,
    ].filter(Boolean) as string[],
    qaChecks: [
      'Tool strategy is planning-only and does not run tools before approval.',
      'Provider models remain separate from open-source tool IDs.',
      ...(renderItem?.qaChecks.slice(0, 3) ?? []),
      ...(adaptiveStrategy?.qaChecks.slice(0, 2) ?? []),
    ],
    licenseNotes,
    userFacingSummary: definition.userFacingSummary,
    developerNotes: [
      'No package is installed or imported by this planner.',
      'Future worker execution must use the approved plan snapshot.',
      chainId === 'premium_rescue_chain' ? 'Veo is Premium-only final fallback and not an open-source tool.' : undefined,
      providerModelIds.some((providerId) => definition.toolIds.includes(providerId as unknown as OpenSourceToolId))
        ? 'Invalid provider/tool mix detected.'
        : 'Provider models are not selectedToolIds.',
    ].filter(Boolean) as string[],
  } satisfies ToolStrategyPlanItem
}

function hasColorNeed(params: CreateToolStrategyPlanParams) {
  return Boolean(params.colorPipelinePlan) ||
    Boolean(params.videoUnderstandingReport?.visualUnderstanding.colorLightingIssues.some((issue) => issue !== 'none')) ||
    Boolean(params.input.professionalEditingDirective?.colorGradeStyle) ||
    params.input.editLevel !== 'basic'
}

function hasAudioNeed(params: CreateToolStrategyPlanParams) {
  return Boolean(params.audioPipelinePlan) ||
    Boolean(params.videoUnderstandingReport?.audioUnderstanding.cleanupNeeded) ||
    Boolean(params.videoUnderstandingReport?.audioUnderstanding.audioIssues.some((issue) => issue !== 'none')) ||
    params.input.editLevel !== 'basic'
}

function hasVisualQaNeed(params: CreateToolStrategyPlanParams) {
  return Boolean(params.depthAwareOverlayPlan?.active) ||
    Boolean(params.videoUnderstandingReport?.visualUnderstanding.faceSafeZoneNotes.length) ||
    Boolean(params.videoUnderstandingReport?.visualUnderstanding.productSafeZoneNotes.length) ||
    allPlanningText(params).includes('caption safe')
}

function planLevelItems(params: CreateToolStrategyPlanParams, startingIndex: number) {
  const items: ToolStrategyPlanItem[] = []
  const chains: ToolChainId[] = []

  if (hasColorNeed(params)) chains.push('color_pipeline_chain')
  if (hasAudioNeed(params)) chains.push('audio_pipeline_chain')
  if (hasVisualQaNeed(params)) chains.push('visual_qa_chain')

  chains.forEach((chainId, index) => {
    items.push(createToolStrategyItem({
      chainId,
      index: startingIndex + index,
      input: params.input,
      depthAwareOverlayPlan: params.depthAwareOverlayPlan,
      audioPipelinePlan: params.audioPipelinePlan,
      colorPipelinePlan: params.colorPipelinePlan,
      dataVizPlan: params.dataVizPlan,
      mapAnimationPlan: params.mapAnimationPlan,
    }))
  })

  return items
}

function summarizeAvoidedGeneration(items: ToolStrategyPlanItem[]) {
  return unique(items
    .map((item) => item.whyNotAiVideo)
    .filter((reason): reason is string => Boolean(reason)))
}

export function createToolStrategyPlan(params: CreateToolStrategyPlanParams): ToolStrategyPlan {
  const renderItems = params.renderStrategyPlan?.items ?? []
  const items = renderItems.map((renderItem, index) => {
    const segment = segmentForItem(renderItem, params.segmentEditPlans)
    const asset = assetForItem(renderItem, params.visualAssetPlan)
    const adaptiveStrategy = adaptiveStrategyForItem({
      adaptiveEditStrategyPlan: params.adaptiveEditStrategyPlan,
      asset,
      item: renderItem,
      segment,
    })
    const chainId = chainFromRenderItem(renderItem, adaptiveStrategy, params)

    return createToolStrategyItem({
      adaptiveStrategy,
      asset,
      audioPipelinePlan: params.audioPipelinePlan,
      chainId,
      colorPipelinePlan: params.colorPipelinePlan,
      dataVizPlan: params.dataVizPlan,
      depthAwareOverlayPlan: params.depthAwareOverlayPlan,
      mapAnimationPlan: params.mapAnimationPlan,
      index,
      input: params.input,
      renderItem,
    })
  })

  const hasRemotion = items.some((item) => item.chainId === 'remotion_layout_chain')
  const withPlanLevelItems = [
    ...(hasRemotion || renderItems.length === 0
      ? items
      : [
          createToolStrategyItem({
            chainId: 'remotion_layout_chain',
            audioPipelinePlan: params.audioPipelinePlan,
            colorPipelinePlan: params.colorPipelinePlan,
            dataVizPlan: params.dataVizPlan,
            mapAnimationPlan: params.mapAnimationPlan,
            index: items.length,
            input: params.input,
          }),
          ...items,
        ]),
    ...planLevelItems(params, items.length + 1),
  ]
  const toolIdsUsed = unique(withPlanLevelItems.flatMap((item) => item.selectedToolIds))
  const chainIdsUsed = unique(withPlanLevelItems.map((item) => item.chainId))
  const presetsUsed = unique(withPlanLevelItems.flatMap((item) => item.steps.flatMap((step) => step.presetIds)))
  const launchCoreToolIds = getLaunchCoreTools().map((tool) => tool.id)
  const launchCoreToolsUsed = toolIdsUsed.filter((toolId) => launchCoreToolIds.includes(toolId))
  const futureToolsReferenced = toolIdsUsed.filter((toolId) => {
    const stage = getToolProfile(toolId)?.adoptionStage
    return stage === 'future' || stage === 'experimental' || stage === 'planned'
  })
  const toolsNeedingLicenseReview = toolIdsUsed.filter((toolId) => getToolsNeedingLicenseReview().some((tool) => tool.id === toolId))
  const aiGenerationAvoidedReasons = summarizeAvoidedGeneration(withPlanLevelItems)

  return {
    id: `tool-strategy-${params.input.editingCategory}-${params.input.editLevel}`,
    summary: withPlanLevelItems.length
      ? `${withPlanLevelItems.length} tool strateg${withPlanLevelItems.length === 1 ? 'y' : 'ies'} planned across ${chainIdsUsed.length} chain${chainIdsUsed.length === 1 ? '' : 's'}; controlled tools stay planning-only.`
      : 'No tool strategy items are needed yet; provider models remain separate from open-source tools.',
    items: withPlanLevelItems,
    toolIdsUsed,
    chainIdsUsed,
    presetsUsed,
    launchCoreToolsUsed,
    futureToolsReferenced,
    toolsNeedingLicenseReview,
    aiGenerationAvoidedReasons,
    globalRules: [
      'Tool strategy is segment/asset-specific and planning-only.',
      'Controlled tools are preferred for exact maps, charts, labels, captions, screenshots, color, audio, and QA.',
      'Provider models such as GPT-Image-2, Wan, Hailuo, and Veo are not open-source tools.',
      'Remotion owns final canvas/composition.',
      'No packages are installed and no tools are executed in this frontend demo.',
      'Tool execution in future workers requires approved plan snapshots and credit approval.',
      params.input.editLevel === 'premium' ? 'Premium may reference Veo only as final fallback/rescue.' : 'Basic/Pro cannot use Veo.',
    ],
    qaChecks: [
      'Every selected tool has a reason and structured settings.',
      'Exact map/chart/screen work does not default to AI video.',
      'License-review or future-only tools are flagged.',
      'Tool strategy does not bypass plan or credit approval.',
      'No selectedToolIds contain provider model IDs.',
    ],
    notes: [
      params.renderStrategyPlan ? `Render strategy source: ${params.renderStrategyPlan.summary}` : 'No render strategy plan was supplied; only global tool planning is available.',
      params.videoUnderstandingReport ? 'Video understanding cues informed tool strategy selection.' : 'No video understanding report supplied to tool strategy planner.',
      'This module imports registry/settings metadata only; it does not import FFmpeg, OpenCV, MapLibre, D3, ECharts, Playwright, Sharp/libvips, OpenColorIO, AudioFlux, Signalsmith Stretch, Essentia, Remotion, or provider SDKs.',
    ],
  }
}
