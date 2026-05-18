import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  ColorPipelinePlan,
  CreditEstimate,
  CreditEstimateAssetSummary,
  CreditEstimatePolicyNote,
  CreditEstimateRiskLevel,
  DataVizPlan,
  DepthAwareOverlayPlan,
  EditLevel,
  LowerCostAlternative,
  MapAnimationPlan,
  PlannerInput,
  RenderStrategyPlan,
  RendererCompositionPlan,
  SignatureSystem,
  SpeakerVisualLayoutPlan,
  ToolStrategyPlan,
  VisualAssetPlanItem,
  VisualAssetType,
} from '../types/reeditpro'

type CreateCreditEstimateParams = {
  visualAssetPlan: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}

const editLevelLabels: Record<EditLevel, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
}

const signatureLabels: Record<SignatureSystem, string> = {
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design / VisualExplain',
  real_motion: 'Real Motion',
  sound_sync: 'SoundSync',
  none: 'None',
}

const assetTypeLabels: Record<VisualAssetType, string> = {
  animated_scene: 'AI animation scenes',
  still_scene: 'Still scenes',
  fact_card: 'Fact cards',
  name_card: 'Name cards',
  character_card: 'Character cards',
  list_card: 'List cards',
  timeline_card: 'Timeline cards',
  graphic_design_frame: 'Graphic design frames',
  motion_design_scene: 'Motion design scenes',
  real_motion_scene: 'Real Motion scenes',
  still_with_editor_motion: 'Stills with editor motion',
  transition_scene: 'Transition scenes',
}

const tierBaseCredits: Record<EditLevel, { planning: number; sourceMapping: number; captions: number; cleanup: number }> = {
  basic: { planning: 4, sourceMapping: 0, captions: 8, cleanup: 14 },
  pro: { planning: 6, sourceMapping: 4, captions: 10, cleanup: 18 },
  premium: { planning: 10, sourceMapping: 6, captions: 12, cleanup: 24 },
}

const stillAssetTypes: VisualAssetType[] = [
  'still_scene',
  'fact_card',
  'name_card',
  'list_card',
  'timeline_card',
  'still_with_editor_motion',
]

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1
    return counts
  }, {} as Record<T, number>)
}

function countAssets(visualAssetPlan: VisualAssetPlanItem[]) {
  return countBy(visualAssetPlan.map((asset) => asset.assetType))
}

function countSystems(visualAssetPlan: VisualAssetPlanItem[]) {
  return countBy(visualAssetPlan.map((asset) => asset.signatureSystem))
}

function pricePerStill(editLevel: EditLevel) {
  if (editLevel === 'premium') return 7
  if (editLevel === 'pro') return 5
  return 3
}

function pricePerCharacter(editLevel: EditLevel) {
  if (editLevel === 'premium') return 10
  if (editLevel === 'pro') return 7
  return 4
}

function pricePerGraphicFrame(editLevel: EditLevel) {
  if (editLevel === 'premium') return 12
  if (editLevel === 'pro') return 8
  return 5
}

function pricePerMotionDesign(editLevel: EditLevel) {
  if (editLevel === 'premium') return 18
  if (editLevel === 'pro') return 12
  return 6
}

function pricePerStrokeMotion(editLevel: EditLevel) {
  if (editLevel === 'premium') return 28
  if (editLevel === 'pro') return 18
  return 10
}

function pricePerRealMotion(editLevel: EditLevel) {
  if (editLevel === 'premium') return 50
  if (editLevel === 'pro') return 34
  return 26
}

function soundSyncCredits(editLevel: EditLevel) {
  if (editLevel === 'premium') return 12
  if (editLevel === 'pro') return 8
  return 6
}

function containsVeoRoute(visualAssetPlan: VisualAssetPlanItem[]) {
  return visualAssetPlan.some((asset) => {
    const route = asset.providerRoute
    return (
      route.primaryModel === 'veo_3_1_lite' ||
      route.fallbackModels.includes('veo_3_1_lite') ||
      route.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')
    )
  })
}

function countAiVideoScenes(visualAssetPlan: VisualAssetPlanItem[]) {
  return visualAssetPlan.filter((asset) => asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene').length
}

function fallbackAllowanceCredits(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]) {
  const fallbackRouteCount = visualAssetPlan.filter((asset) => asset.providerRoute.fallbackModels.length > 0 || asset.providerRoute.fallbackSteps.length > 0).length
  const aiVideoCount = countAiVideoScenes(visualAssetPlan)

  if (input.editLevel === 'premium') {
    return Math.min(40, 24 + aiVideoCount * 4 + Math.max(0, fallbackRouteCount - 2) * 2)
  }

  if (input.editLevel === 'pro') {
    return Math.min(16, 10 + Math.max(0, fallbackRouteCount - 1) * 2)
  }

  return Math.min(5, Math.max(0, fallbackRouteCount))
}

function layoutPlanningCredits(input: PlannerInput, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan) {
  const advancedLayoutCount = (speakerVisualLayoutPlan?.items ?? []).filter((item) =>
    item.complexity === 'advanced' ||
    item.complexity === 'premium' ||
    item.riskLevel === 'high' ||
    item.riskLevel === 'premium',
  ).length

  if (advancedLayoutCount === 0) {
    return 0
  }

  if (input.editLevel === 'basic') {
    return 0
  }

  if (input.editLevel === 'premium') {
    return Math.min(6, 3 + advancedLayoutCount)
  }

  return Math.min(4, 2 + Math.max(0, advancedLayoutCount - 1))
}

function depthPlanningCredits(input: PlannerInput, depthAwareOverlayPlan?: DepthAwareOverlayPlan) {
  if (!depthAwareOverlayPlan?.active) {
    return 0
  }

  if (input.editLevel === 'basic') {
    return 0
  }

  const itemCredits: number[] = depthAwareOverlayPlan.items.map((item) => {
    if (item.depthCompositingMode === 'graphic_on_top' || item.maskStrategy === 'none') return input.editLevel === 'premium' ? 1 : 0
    if (item.maskStrategy === 'subject_mask') return input.editLevel === 'premium' ? 4 : 3
    if (item.maskStrategy === 'subject_plus_contact_object_mask') return input.editLevel === 'premium' ? 7 : 5
    if (item.maskStrategy === 'hero_object_mask' || item.depthCompositingMode === 'object_anchored_overlay') return input.editLevel === 'premium' ? 8 : 5
    if (item.maskStrategy === 'multi_object_depth_mask' || item.maskStrategy === 'full_cutout_composition') return input.editLevel === 'premium' ? 12 : 0
    return input.editLevel === 'premium' ? 4 : 3
  })

  const total = itemCredits.reduce((sum, credits) => sum + credits, 0)
  return input.editLevel === 'premium' ? Math.min(18, total) : Math.min(10, total)
}

function depthPlanningReason(depthAwareOverlayPlan?: DepthAwareOverlayPlan) {
  const items = depthAwareOverlayPlan?.items ?? []
  const hasContact = items.some((item) => item.maskStrategy === 'subject_plus_contact_object_mask')
  const hasFallback = items.some((item) => item.fallbackLayoutMode)

  return [
    hasContact
      ? 'Plans foreground subject/contact object preservation for integrated map/card overlays.'
      : 'Plans foreground-aware composition for integrated map/card overlays.',
    hasFallback ? 'Includes fallback layout because mask risk is medium/high.' : undefined,
    'Frontend mock only; real segmentation/rendering is not implemented.',
  ].filter(Boolean).join(' ')
}

function adaptiveStrategyPlanningCredits(input: PlannerInput, adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan) {
  if (!adaptiveEditStrategyPlan) {
    return 0
  }

  const aiVideoStrategies = adaptiveEditStrategyPlan.segmentStrategies.filter((strategy) =>
    strategy.generationRestraint === 'allow_generation' ||
    strategy.generationRestraint === 'prefer_generation' ||
    strategy.generationRestraint === 'premium_fallback_only',
  ).length

  if (input.editLevel === 'basic') {
    return 0
  }

  if (input.editLevel === 'premium') {
    return Math.min(4, aiVideoStrategies)
  }

  return aiVideoStrategies >= 2 ? 2 : 0
}

function adaptiveStrategyPlanningReason(adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan) {
  const strategies = adaptiveEditStrategyPlan?.segmentStrategies ?? []
  const avoidCount = strategies.filter((strategy) => strategy.generationRestraint === 'avoid_generation').length
  const aiCount = strategies.filter((strategy) => strategy.generationRestraint !== 'avoid_generation').length
  const exactToolCount = strategies.filter((strategy) =>
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool'),
  ).length

  return [
    `${strategies.length} adaptive segment strateg${strategies.length === 1 ? 'y' : 'ies'} planned with reasons.`,
    `${avoidCount} avoid generation; ${aiCount} allow or reserve generation where motion helps.`,
    exactToolCount ? `${exactToolCount} exact map/chart/screen strateg${exactToolCount === 1 ? 'y prefers' : 'ies prefer'} controlled tools/Remotion.` : undefined,
  ].filter(Boolean).join(' ')
}

function renderStrategyPlanningCredits(input: PlannerInput, renderStrategyPlan?: RenderStrategyPlan) {
  if (!renderStrategyPlan) {
    return 0
  }

  if (input.editLevel === 'basic') {
    return 0
  }

  const advancedCount = renderStrategyPlan.items.filter((item) =>
    item.complexity === 'advanced' ||
    item.complexity === 'premium' ||
    item.strategyType === 'hybrid_generation_then_remotion' ||
    item.needsWorkerPreprocess ||
    item.needsWorkerPostprocess,
  ).length
  const aiVideoCount = renderStrategyPlan.items.filter((item) => item.needsAiVideo).length
  const toolCount = renderStrategyPlan.items.filter((item) => item.needsOpenSourceTool).length

  if (advancedCount === 0 && toolCount === 0 && aiVideoCount === 0) {
    return 0
  }

  if (input.editLevel === 'premium') {
    return Math.min(4, Math.max(1, advancedCount + Math.floor((toolCount + aiVideoCount) / 2)))
  }

  return Math.min(2, Math.max(1, Math.floor((advancedCount + toolCount + aiVideoCount) / 3)))
}

function renderStrategyPlanningReason(renderStrategyPlan?: RenderStrategyPlan) {
  const items = renderStrategyPlan?.items ?? []
  const toolItems = items.filter((item) => item.needsOpenSourceTool).length
  const aiVideoItems = items.filter((item) => item.needsAiVideo).length
  const remotionOnlyItems = items.filter((item) => item.strategyType === 'remotion_only').length

  return [
    `${items.length} render strateg${items.length === 1 ? 'y' : 'ies'} planned.`,
    `${remotionOnlyItems} Remotion-only; ${toolItems} controlled-tool; ${aiVideoItems} AI-video eligible.`,
    'Frontend mock only; no real Remotion render, tool execution, provider call, or worker cost is applied.',
  ].join(' ')
}

function toolStrategyPlanningCredits(input: PlannerInput, toolStrategyPlan?: ToolStrategyPlan) {
  if (!toolStrategyPlan) {
    return 0
  }

  const mediumChains = toolStrategyPlan.items.filter((item) =>
    item.chainId === 'map_route_chain' ||
    item.chainId === 'chart_diagram_chain' ||
    item.chainId === 'browser_capture_chain',
  ).length
  const advancedChains = toolStrategyPlan.items.filter((item) =>
    item.chainId === 'visual_qa_chain' ||
    item.chainId === 'premium_rescue_chain' ||
    item.status === 'future_only' ||
    item.status === 'needs_license_review',
  ).length

  if (input.editLevel === 'basic') {
    return 0
  }

  if (input.editLevel === 'premium') {
    return Math.min(4, Math.max(1, Math.ceil((mediumChains + advancedChains) / 2)))
  }

  return mediumChains + advancedChains >= 2 ? 1 : 0
}

function toolStrategyPlanningReason(toolStrategyPlan?: ToolStrategyPlan) {
  const items = toolStrategyPlan?.items ?? []
  const controlledChains = items.filter((item) =>
    item.chainId === 'map_route_chain' ||
    item.chainId === 'chart_diagram_chain' ||
    item.chainId === 'browser_capture_chain' ||
    item.chainId === 'remotion_layout_chain',
  ).length
  const futureChains = items.filter((item) => item.status === 'future_only' || item.status === 'needs_license_review').length

  return [
    `${items.length} tool strateg${items.length === 1 ? 'y' : 'ies'} planned.`,
    `${controlledChains} controlled/Remotion-first chain${controlledChains === 1 ? '' : 's'}; ${futureChains} future/license-review chain${futureChains === 1 ? '' : 's'}.`,
    'Tool execution is planned only; this frontend demo does not run tools or install packages.',
  ].join(' ')
}

function colorPipelinePlanningCredits(input: PlannerInput, colorPipelinePlan?: ColorPipelinePlan) {
  if (!colorPipelinePlan) {
    return 0
  }

  if (input.editLevel === 'basic') {
    return 0
  }

  const assetMatchCount = colorPipelinePlan.assetMatchPlans.length
  const advancedToolCount = colorPipelinePlan.toolsPlanned.filter((tool) =>
    tool === 'opencolorio' ||
    tool === 'openimageio' ||
    tool === 'opencv' ||
    tool === 'sharp',
  ).length

  if (input.editLevel === 'premium') {
    return Math.min(5, Math.max(2, Math.ceil((assetMatchCount + advancedToolCount) / 3)))
  }

  return assetMatchCount > 2 || advancedToolCount > 1 ? 2 : 1
}

function colorPipelinePlanningReason(colorPipelinePlan?: ColorPipelinePlan) {
  if (!colorPipelinePlan) {
    return 'No color pipeline plan is attached.'
  }

  return [
    `Professional ${colorPipelinePlan.colorGradeStyle.replaceAll('_', ' ')} color plan with ${colorPipelinePlan.clipPlans.length} clip plan${colorPipelinePlan.clipPlans.length === 1 ? '' : 's'}.`,
    `${colorPipelinePlan.assetMatchPlans.length} generated/AI asset color match plan${colorPipelinePlan.assetMatchPlans.length === 1 ? '' : 's'}.`,
    'Basic clean correction is baseline; future color tool execution is planned only and does not run in this demo.',
  ].join(' ')
}

function audioPipelinePlanningCredits(input: PlannerInput, audioPipelinePlan?: AudioPipelinePlan) {
  if (!audioPipelinePlan) {
    return 0
  }

  if (input.editLevel === 'basic') {
    return 0
  }

  const cueCount = audioPipelinePlan.soundSyncCues.length
  const futureToolCount = audioPipelinePlan.toolsPlanned.filter((tool) =>
    tool === 'essentia' ||
    tool === 'librosa' ||
    tool === 'rubber_band' ||
    tool === 'whisper_cpp',
  ).length

  if (input.editLevel === 'premium') {
    return Math.min(5, Math.max(2, Math.ceil((cueCount + futureToolCount) / 3)))
  }

  return cueCount > 3 || futureToolCount > 1 ? 2 : 1
}

function audioPipelinePlanningReason(audioPipelinePlan?: AudioPipelinePlan) {
  if (!audioPipelinePlan) {
    return 'No audio pipeline plan is attached.'
  }

  return [
    `Professional ${audioPipelinePlan.soundStyle.replaceAll('_', ' ')} audio plan with ${audioPipelinePlan.clipPlans.length} clip plan${audioPipelinePlan.clipPlans.length === 1 ? '' : 's'}.`,
    `${audioPipelinePlan.soundSyncCues.length} SoundSync cue${audioPipelinePlan.soundSyncCues.length === 1 ? '' : 's'} for captions, reveals, transitions, and SFX timing.`,
    'Voice cleanup and loudness are professional baseline; future audio tool execution is planned only and does not run in this demo.',
  ].join(' ')
}

function mapAnimationPlanningCredits(input: PlannerInput, mapAnimationPlan?: MapAnimationPlan) {
  if (!mapAnimationPlan?.active) {
    return 0
  }

  const highComplexity = mapAnimationPlan.items.some((item) =>
    item.mapVisualType === 'map_behind_subject' ||
    item.mapVisualType === 'map_behind_subject_and_contact_object' ||
    item.mapVisualType.includes('future'),
  )
  const routeCount = mapAnimationPlan.items.filter((item) =>
    item.mapVisualType === 'route_reveal' ||
    item.mapVisualType === 'travel_route' ||
    item.mapVisualType === 'multi_location_sequence' ||
    item.mapVisualType === 'money_movement_map',
  ).length

  if (input.editLevel === 'basic') {
    return highComplexity ? 2 : 1
  }

  if (input.editLevel === 'premium') {
    return highComplexity ? 5 : Math.max(2, routeCount + 1)
  }

  return highComplexity ? 3 : routeCount > 0 ? 2 : 1
}

function mapAnimationPlanningReason(mapAnimationPlan?: MapAnimationPlan) {
  if (!mapAnimationPlan?.active) {
    return 'No active map/location plan is attached.'
  }

  return [
    `${mapAnimationPlan.items.length} map/location item${mapAnimationPlan.items.length === 1 ? '' : 's'} planned with ${mapAnimationPlan.mapToolsPlanned.map((tool) => tool.replaceAll('_', ' ')).join(', ')}.`,
    'Plans map style, location confidence, route/pin animation, layout, and QA.',
    'No MapLibre/Turf execution, geocoding, tile calls, or real map rendering runs in this frontend demo.',
  ].join(' ')
}

function dataVizPlanningCredits(input: PlannerInput, dataVizPlan?: DataVizPlan) {
  if (!dataVizPlan?.active) {
    return 0
  }

  const complexCount = dataVizPlan.items.filter((item) =>
    item.visualType === 'money_flow_diagram' ||
    item.visualType === 'account_flow_diagram' ||
    item.visualType === 'network_graph' ||
    item.visualType === 'evidence_flow_diagram' ||
    item.visualType === 'claim_support_diagram' ||
    item.creditImpact === 'high' ||
    item.creditImpact === 'premium',
  ).length
  const standardChartCount = dataVizPlan.items.filter((item) =>
    item.preferredTool === 'echarts' ||
    item.visualType === 'process_step_diagram' ||
    item.visualType === 'timeline_diagram' ||
    item.visualType === 'feature_comparison',
  ).length

  if (input.editLevel === 'basic') {
    return complexCount ? 2 : 1
  }

  if (input.editLevel === 'premium') {
    return complexCount ? 5 : Math.max(2, standardChartCount + 1)
  }

  return complexCount ? 3 : standardChartCount > 0 ? 2 : 1
}

function dataVizPlanningReason(dataVizPlan?: DataVizPlan) {
  if (!dataVizPlan?.active) {
    return 'No active chart/diagram plan is attached.'
  }

  return [
    `${dataVizPlan.items.length} chart/diagram item${dataVizPlan.items.length === 1 ? '' : 's'} planned with ${dataVizPlan.toolsPlanned.map((tool) => tool.replaceAll('_', ' ')).join(', ')}.`,
    'Plans data source certainty, safe wording, diagram style, tool chain, layout, animation, and QA.',
    'No D3/ECharts/Vega-Lite execution, data verification, or real chart rendering runs in this frontend demo.',
  ].join(' ')
}

function getFallbackPolicyNotes(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimatePolicyNote[] {
  const notes: CreditEstimatePolicyNote[] = [
    {
      label: 'Approval gate',
      tone: 'success',
      message: 'Credits are estimated before generation and deducted only after approval.',
    },
    {
      label: 'Provider cost privacy',
      tone: 'info',
      message: 'Provider costs are internal; users see Reedit Credits.',
    },
  ]

  if (input.editLevel === 'premium') {
    notes.push({
      label: 'Premium fallback policy',
      tone: 'warning',
      message: 'Veo Lite is available only as final fallback/rescue.',
    })
  } else {
    notes.push({
      label: `${editLevelLabels[input.editLevel]} model policy`,
      tone: 'info',
      message: 'Veo Lite is locked for this tier.',
    })
  }

  if (input.editLevel !== 'premium' && containsVeoRoute(visualAssetPlan)) {
    notes.push({
      label: 'Planner warning',
      tone: 'warning',
      message: 'Planner warning: Veo route removed because this tier cannot use Veo.',
    })
  }

  return notes
}

function creditBreakdown(input: PlannerInput, params: CreateCreditEstimateParams, fallbackCredits: number): CreditEstimate['breakdown'] {
  const base = tierBaseCredits[input.editLevel]
  const assetCounts = countAssets(params.visualAssetPlan)
  const stillCount = stillAssetTypes.reduce((sum, assetType) => sum + (assetCounts[assetType] ?? 0), 0)
  const characterCount = assetCounts.character_card ?? 0
  const graphicFrameCount = assetCounts.graphic_design_frame ?? 0
  const motionDesignCount = assetCounts.motion_design_scene ?? 0
  const strokeMotionCount = params.visualAssetPlan.filter((asset) => asset.assetType === 'animated_scene' && asset.signatureSystem === 'stroke_motion').length
  const realMotionCount = params.visualAssetPlan.filter((asset) => asset.assetType === 'real_motion_scene' || asset.signatureSystem === 'real_motion').length
  const breakdown: CreditEstimate['breakdown'] = [
    { label: 'Planning and story/transcript analysis', credits: base.planning, reason: `${editLevelLabels[input.editLevel]} planning depth for story, transcript, and intent analysis.` },
    { label: 'Source sequence mapping', credits: base.sourceMapping, reason: 'Reviews uploaded order before any edit order changes are proposed.' },
    { label: 'Captions', credits: base.captions, reason: 'Editable captions aligned with StoryTiming and safe zones.' },
    { label: 'Edit cleanup', credits: base.cleanup, reason: 'Trim dead space, smooth pacing, and keep the edit professional.' },
  ]

  const adaptiveCredits = adaptiveStrategyPlanningCredits(input, params.adaptiveEditStrategyPlan)

  if (params.adaptiveEditStrategyPlan) {
    breakdown.push({
      label: 'Adaptive edit strategy planning',
      credits: adaptiveCredits,
      reason: adaptiveStrategyPlanningReason(params.adaptiveEditStrategyPlan),
    })
  }

  if (stillCount > 0) {
    breakdown.push({
      label: 'GPT-Image-2 still/card/keyframe assets',
      credits: stillCount * pricePerStill(input.editLevel),
      reason: `${stillCount} still, card, keyframe, or editor-motion asset${stillCount === 1 ? '' : 's'} selected by story beat.`,
    })
  }

  if (characterCount > 0) {
    breakdown.push({
      label: 'Character reference/card assets',
      credits: characterCount * pricePerCharacter(input.editLevel),
      reason: 'Character cards support consistency across still and animation planning.',
    })
  }

  if (graphicFrameCount > 0) {
    breakdown.push({
      label: 'Graphic Design / VisualExplain frames',
      credits: graphicFrameCount * pricePerGraphicFrame(input.editLevel),
      reason: 'Controlled graphic frames for readable labels, proof, lists, or diagrams.',
    })
  }

  if (motionDesignCount > 0) {
    breakdown.push({
      label: 'Controlled Remotion motion design',
      credits: motionDesignCount * pricePerMotionDesign(input.editLevel),
      reason: 'Editor-controlled motion for exact diagrams, highlights, arrows, and timing.',
    })
  }

  if (strokeMotionCount > 0) {
    breakdown.push({
      label: 'Stroke Motion AI video scenes',
      credits: strokeMotionCount * pricePerStrokeMotion(input.editLevel),
      reason: `${strokeMotionCount} story/action/emotion beat${strokeMotionCount === 1 ? '' : 's'} where motion improves the story.`,
    })
  }

  if (realMotionCount > 0) {
    breakdown.push({
      label: 'Real Motion scenes',
      credits: realMotionCount * pricePerRealMotion(input.editLevel),
      reason: 'Credit-heavy object/proof motion remains overlay-first and face-safe.',
    })
  }

  breakdown.push({
    label: 'SoundSync support',
    credits: soundSyncCredits(input.editLevel),
    reason: 'Timing support for music, SFX cues, ducking, and beat placement.',
  })

  if (params.rendererCompositionPlan) {
    breakdown.push({
      label: 'Remotion composition plan placeholder',
      credits: 0,
      reason: 'Rendering is planned but not implemented in this frontend milestone.',
    })
  }

  const renderStrategyCredits = renderStrategyPlanningCredits(input, params.renderStrategyPlan)

  if (params.renderStrategyPlan) {
    breakdown.push({
      label: 'Render strategy planning',
      credits: renderStrategyCredits,
      reason: renderStrategyPlanningReason(params.renderStrategyPlan),
    })
  }

  if (params.toolStrategyPlan) {
    breakdown.push({
      label: 'Tool strategy planning',
      credits: toolStrategyPlanningCredits(input, params.toolStrategyPlan),
      reason: toolStrategyPlanningReason(params.toolStrategyPlan),
    })
  }

  if (params.colorPipelinePlan) {
    breakdown.push({
      label: 'Color pipeline planning',
      credits: colorPipelinePlanningCredits(input, params.colorPipelinePlan),
      reason: colorPipelinePlanningReason(params.colorPipelinePlan),
    })
  }

  if (params.audioPipelinePlan) {
    breakdown.push({
      label: 'Audio + SoundSync planning',
      credits: audioPipelinePlanningCredits(input, params.audioPipelinePlan),
      reason: audioPipelinePlanningReason(params.audioPipelinePlan),
    })
  }

  if (params.mapAnimationPlan?.active) {
    breakdown.push({
      label: 'Map/location planning',
      credits: mapAnimationPlanningCredits(input, params.mapAnimationPlan),
      reason: mapAnimationPlanningReason(params.mapAnimationPlan),
    })
  }

  if (params.dataVizPlan?.active) {
    breakdown.push({
      label: 'Chart/diagram planning',
      credits: dataVizPlanningCredits(input, params.dataVizPlan),
      reason: dataVizPlanningReason(params.dataVizPlan),
    })
  }

  const layoutCredits = layoutPlanningCredits(input, params.speakerVisualLayoutPlan)

  if (layoutCredits > 0 || (params.speakerVisualLayoutPlan?.items ?? []).some((item) => item.complexity === 'advanced' || item.complexity === 'premium')) {
    breakdown.push({
      label: 'Advanced layout planning',
      credits: layoutCredits,
      reason: 'Speaker/visual layout and fallback composition planning.',
    })
  }

  const depthCredits = depthPlanningCredits(input, params.depthAwareOverlayPlan)

  if ((params.depthAwareOverlayPlan?.active && params.depthAwareOverlayPlan.items.length > 0) || depthCredits > 0) {
    breakdown.push({
      label: 'Depth-aware compositing plan',
      credits: depthCredits,
      reason: depthPlanningReason(params.depthAwareOverlayPlan),
    })
  }

  if (fallbackCredits > 0) {
    const label =
      input.editLevel === 'premium'
        ? 'Premium fallback allowance'
        : input.editLevel === 'pro'
          ? 'Pro Hailuo fallback allowance'
          : 'Basic fallback allowance'
    const reason =
      input.editLevel === 'premium'
        ? 'Hailuo fallback plus Premium-only final Veo Lite rescue allowance; Veo is not default.'
        : input.editLevel === 'pro'
          ? 'Hailuo fallback allowance. Veo Lite is locked for Pro.'
          : 'Low retry depth. Veo Lite is locked for Basic.'

    breakdown.push({ label, credits: fallbackCredits, reason })
  }

  return breakdown
}

function assetTypeSummary(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimateAssetSummary[] {
  const counts = countAssets(visualAssetPlan)

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([assetType, count]) => {
      const typedAssetType = assetType as VisualAssetType
      const perAsset =
        typedAssetType === 'motion_design_scene'
          ? pricePerMotionDesign(input.editLevel)
          : typedAssetType === 'animated_scene'
            ? pricePerStrokeMotion(input.editLevel)
            : typedAssetType === 'real_motion_scene'
              ? pricePerRealMotion(input.editLevel)
              : typedAssetType === 'character_card'
                ? pricePerCharacter(input.editLevel)
                : typedAssetType === 'graphic_design_frame'
                  ? pricePerGraphicFrame(input.editLevel)
                  : pricePerStill(input.editLevel)

      return {
        label: assetTypeLabels[typedAssetType],
        count,
        credits: count * perAsset,
        reason: `${count} planned ${assetTypeLabels[typedAssetType].toLowerCase()}.`,
      }
    })
}

function visualSystemSummary(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimateAssetSummary[] {
  const counts = countSystems(visualAssetPlan)

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([signatureSystem, count]) => {
      const typedSystem = signatureSystem as SignatureSystem
      const credits = visualAssetPlan
        .filter((asset) => asset.signatureSystem === typedSystem)
        .reduce((sum, asset) => {
          if (asset.assetType === 'real_motion_scene') return sum + pricePerRealMotion(input.editLevel)
          if (asset.assetType === 'animated_scene') return sum + pricePerStrokeMotion(input.editLevel)
          if (asset.assetType === 'motion_design_scene') return sum + pricePerMotionDesign(input.editLevel)
          if (asset.assetType === 'graphic_design_frame') return sum + pricePerGraphicFrame(input.editLevel)
          if (asset.assetType === 'character_card') return sum + pricePerCharacter(input.editLevel)
          return sum + pricePerStill(input.editLevel)
        }, 0)

      return {
        label: signatureLabels[typedSystem],
        count,
        credits,
        reason: `${signatureLabels[typedSystem]} appears in ${count} planned visual beat${count === 1 ? '' : 's'}.`,
      }
    })
}

function estimateRisk(
  input: PlannerInput,
  visualAssetPlan: VisualAssetPlanItem[],
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): CreditEstimateRiskLevel {
  const aiVideoCount = countAiVideoScenes(visualAssetPlan)
  const realMotionCount = visualAssetPlan.filter((asset) => asset.signatureSystem === 'real_motion' || asset.assetType === 'real_motion_scene').length
  const advancedLayoutCount = (speakerVisualLayoutPlan?.items ?? []).filter((item) =>
    item.complexity === 'advanced' ||
    item.complexity === 'premium' ||
    item.riskLevel === 'high' ||
    item.riskLevel === 'premium',
  ).length
  const advancedDepthCount = (depthAwareOverlayPlan?.items ?? []).filter((item) =>
    item.maskRisk === 'high' ||
    item.maskRisk === 'premium' ||
    item.maskStrategy === 'subject_plus_contact_object_mask' ||
    item.maskStrategy === 'multi_object_depth_mask' ||
    item.maskStrategy === 'full_cutout_composition',
  ).length

  if (input.editLevel === 'premium' && (aiVideoCount >= 2 || realMotionCount > 0 || advancedLayoutCount > 0 || advancedDepthCount > 0)) {
    return 'premium'
  }

  if (realMotionCount > 0 || advancedLayoutCount > 0 || advancedDepthCount > 0 || (input.editLevel === 'pro' && aiVideoCount >= 3)) {
    return 'high'
  }

  if (input.editLevel === 'pro' || aiVideoCount > 0 || visualAssetPlan.length >= 4) {
    return 'medium'
  }

  return 'low'
}

function lowerCostAlternatives(
  input: PlannerInput,
  visualAssetPlan: VisualAssetPlanItem[],
  fallbackCredits: number,
  riskLevel: CreditEstimateRiskLevel,
  depthAwareOverlayPlan?: DepthAwareOverlayPlan,
): LowerCostAlternative[] {
  const alternatives: LowerCostAlternative[] = []
  const hasAnimation = visualAssetPlan.some((asset) => asset.assetType === 'animated_scene')
  const hasMotionDesign = visualAssetPlan.some((asset) => asset.assetType === 'motion_design_scene')
  const hasRealMotion = visualAssetPlan.some((asset) => asset.assetType === 'real_motion_scene' || asset.signatureSystem === 'real_motion')

  if (hasAnimation) {
    alternatives.push({
      label: 'Convert one animation beat to a still card',
      estimatedSavings: input.editLevel === 'premium' ? 18 : input.editLevel === 'pro' ? 12 : 7,
      tradeoff: 'Less generated motion, but the story beat stays clear with a designed still/card.',
      actionHint: 'Use GPT-Image-2 still/card output with editor motion.',
    })
  }

  if (hasMotionDesign) {
    alternatives.push({
      label: 'Use simpler editor motion for one diagram',
      estimatedSavings: input.editLevel === 'premium' ? 8 : 5,
      tradeoff: 'Less elaborate animation, but exact text and labels remain controlled.',
      actionHint: 'Simplify the VisualExplain motion preset.',
    })
  }

  if (hasRealMotion) {
    alternatives.push({
      label: 'Remove Real Motion',
      estimatedSavings: input.editLevel === 'premium' ? 35 : 24,
      tradeoff: 'Loses realistic object/proof motion, but keeps a lower-cost proof visual.',
      actionHint: 'Replace with Graphic Design / VisualExplain or still-with-editor-motion.',
    })
  }

  if (fallbackCredits > 0) {
    alternatives.push({
      label: 'Reduce fallback allowance',
      estimatedSavings: Math.min(fallbackCredits, input.editLevel === 'premium' ? 12 : 6),
      tradeoff: 'Lower retry/fallback depth if a generated asset fails QA.',
      actionHint: 'Use fewer retries and convert failed beats to stills or motion design.',
    })
  }

  if (depthAwareOverlayPlan?.active && input.editLevel !== 'basic') {
    alternatives.push({
      label: 'Use a safer lower panel instead of depth overlay',
      estimatedSavings: Math.min(depthPlanningCredits(input, depthAwareOverlayPlan), input.editLevel === 'premium' ? 10 : 6),
      tradeoff: 'Loses the integrated behind-subject look, but keeps the explanation readable and lower-risk.',
      actionHint: 'Switch depth-aware items to lower visual panel, PIP, or side-by-side fallback.',
    })
  }

  if (input.editLevel === 'premium') {
    alternatives.push({
      label: 'Use Pro routing if Premium rescue is not needed',
      estimatedSavings: 16,
      tradeoff: 'Removes Premium fallback depth and final rescue options.',
      actionHint: 'Switch to Pro if the scene does not need Premium consistency checks.',
    })
  }

  if (riskLevel === 'low') {
    return alternatives.slice(0, 1)
  }

  return alternatives.slice(0, 3)
}

export function createCreditEstimate(input: PlannerInput, params: CreateCreditEstimateParams): CreditEstimate {
  const fallbackCredits = fallbackAllowanceCredits(input, params.visualAssetPlan)
  const breakdown = creditBreakdown(input, params, fallbackCredits)
  const total = breakdown.reduce((sum, item) => sum + item.credits, 0)
  const riskLevel = estimateRisk(input, params.visualAssetPlan, params.speakerVisualLayoutPlan, params.depthAwareOverlayPlan)

  return {
    total,
    breakdown,
    editLevel: input.editLevel,
    editingCategory: input.editingCategory,
    visualSystemSummary: visualSystemSummary(input, params.visualAssetPlan),
    assetTypeSummary: assetTypeSummary(input, params.visualAssetPlan),
    fallbackAllowanceCredits: fallbackCredits,
    fallbackPolicyNotes: getFallbackPolicyNotes(input, params.visualAssetPlan),
    lowerCostAlternatives: lowerCostAlternatives(input, params.visualAssetPlan, fallbackCredits, riskLevel, params.depthAwareOverlayPlan),
    riskLevel,
    approvalCopy: 'Approve the edit plan and credit estimate before mock progress can begin.',
    estimateVersion: 'mock-vs-05',
  }
}
