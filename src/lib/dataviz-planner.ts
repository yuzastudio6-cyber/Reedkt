import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  CompiledEditingIntent,
  DataConfidence,
  DataSourceType,
  DataVizAnimationPlan,
  DataVizAnimationType,
  DataVizDataPlan,
  DataVizLayoutPlan,
  DataVizPlan,
  DataVizPlanItem,
  DataVizStyleFamily,
  DataVizStylePlan,
  DataVizToolPreference,
  DataVizVisualType,
  DiagramFlowDirection,
  OpenSourceToolId,
  PlannerInput,
  RectZone,
  RemotionCapabilityId,
  RenderStrategyPlan,
  SegmentEditPlan,
  SpeakerVisualLayoutMode,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  ToolStrategyPlan,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import {
  getDataVizStylePreset,
  getDataVizVisualPreset,
  getDefaultDataVizStyleForCategory,
  getPreferredToolForVisualType,
} from './dataviz-presets'

type CreateDataVizPlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  audioPipelinePlan?: AudioPipelinePlan
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'data visual'
}

function allText(params: CreateDataVizPlanParams) {
  return [
    params.input.projectName,
    params.input.workflowType,
    params.input.editingCategory,
    params.input.customInstructions,
    params.compiledIntent?.goalSummary,
    params.videoUnderstandingReport?.overallSummary,
    ...(params.videoUnderstandingReport?.visualSupportOpportunities.map((opportunity) => `${opportunity.opportunityType} ${opportunity.label} ${opportunity.reason}`) ?? []),
    ...(params.adaptiveEditStrategyPlan?.segmentStrategies.flatMap((strategy) => [
      strategy.label,
      strategy.decisionKind,
      strategy.recommendedVisualSupport,
      ...strategy.recommendedToolHints,
      ...strategy.reasons.map((reason) => reason.explanation),
    ]) ?? []),
    ...(params.visualAssetPlan?.flatMap((asset) => [asset.beatLabel, asset.storyPurpose, asset.reason, asset.assetType]) ?? []),
    ...(params.input.clips.flatMap((clip) => [clip.fileName, clip.detectedType, clip.notes ?? '']) ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function isDataVizText(text: string) {
  return /\b(chart|graph|diagram|timeline|money flow|account|account flow|step|process|comparison|before and after|before\/after|metric|number|percentage|data|dashboard|results|evidence|claim|funnel|sales|growth|revenue|framework|arrows?|table|network|document breakdown|pros|cons)\b/.test(text)
}

function hasDataVizSignal(params: CreateDataVizPlanParams) {
  const text = allText(params)

  return isDataVizText(text) ||
    Boolean(params.videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'chart_or_diagram')) ||
    Boolean(params.adaptiveEditStrategyPlan?.segmentStrategies.some((strategy) => strategy.recommendedToolHints.includes('chart_tool'))) ||
    Boolean(params.toolStrategyPlan?.items.some((item) => item.chainId === 'chart_diagram_chain')) ||
    Boolean(params.renderStrategyPlan?.items.some((item) => item.selectedOpenSourceTools.some((tool) => tool === 'd3' || tool === 'echarts' || tool === 'vega_lite')))
}

function assetText(asset: VisualAssetPlanItem) {
  return `${asset.beatLabel} ${asset.storyPurpose} ${asset.reason} ${asset.assetType}`.toLowerCase()
}

function dataVizAssets(params: CreateDataVizPlanParams) {
  const assets = params.visualAssetPlan ?? []
  const filtered = assets.filter((asset) =>
    isDataVizText(assetText(asset)) ||
    asset.assetType === 'timeline_card' ||
    asset.assetType === 'fact_card' ||
    asset.assetType === 'list_card' ||
    asset.assetType === 'graphic_design_frame' ||
    asset.assetType === 'motion_design_scene' ||
    asset.toolStrategyItemIds?.some((id) => params.toolStrategyPlan?.items.find((item) => item.id === id)?.chainId === 'chart_diagram_chain') ||
    asset.renderStrategyItemId && params.renderStrategyPlan?.items.find((item) => item.id === asset.renderStrategyItemId)?.selectedOpenSourceTools.some((tool) => tool === 'd3' || tool === 'echarts'),
  )

  if (filtered.length > 0) {
    return filtered.slice(0, params.input.editLevel === 'premium' ? 4 : 2)
  }

  return assets.slice(0, 1)
}

function visualTypeFromText(text: string, input: PlannerInput): DataVizVisualType {
  if (/money|transfer|payment|wire|funds|revenue movement/.test(text)) return 'money_flow_diagram'
  if (/account|fake account|bank|wallet/.test(text)) return 'account_flow_diagram'
  if (/step|process|framework|tutorial|how it works|workflow/.test(text)) return 'process_step_diagram'
  if (/timeline|date|sequence|chronology|when/.test(text)) return 'timeline_diagram'
  if (/before.*after|before\/after|result|transformation/.test(text)) return 'before_after_comparison'
  if (/bar chart|bar graph/.test(text)) return 'bar_chart'
  if (/line chart|line graph|trend|growth over time/.test(text)) return 'line_chart'
  if (/area chart/.test(text)) return 'area_chart'
  if (/pie|donut|share|breakdown/.test(text)) return 'pie_or_donut_chart'
  if (/funnel/.test(text)) return 'funnel_chart'
  if (/gauge/.test(text)) return 'gauge_chart'
  if (/metric|number|percentage|revenue|growth|sales|results|kpi/.test(text)) return 'metric_card'
  if (/feature|plan|product|compare|comparison/.test(text)) return 'feature_comparison'
  if (/pros|cons/.test(text)) return 'pros_cons_comparison'
  if (/hierarchy|org chart|team structure/.test(text)) return 'hierarchy_tree'
  if (/network|relationship|connections/.test(text)) return 'network_graph'
  if (/cause|effect|because|leads to/.test(text)) return 'cause_effect_diagram'
  if (/document|source|receipt|statement|breakdown/.test(text)) return 'document_breakdown_card'
  if (/claim|support|alleged|proof/.test(text)) return input.editingCategory === 'documentary_case_study' ? 'claim_support_diagram' : 'evidence_flow_diagram'
  if (input.editingCategory === 'documentary_case_study') return 'evidence_flow_diagram'
  if (input.editingCategory === 'business_brand') return 'feature_comparison'
  if (input.editingCategory === 'education_explainer') return 'process_step_diagram'
  return 'custom_visual_explain'
}

function dataSourceForText(text: string): DataSourceType {
  if (/fictional|made up|imaginary/.test(text)) return 'fictional_story_data'
  if (/mock|demo|example|sample/.test(text)) return 'mock_demo_data'
  if (/uploaded document|document|receipt|statement/.test(text)) return 'uploaded_document'
  if (/user provided|provided data|csv|spreadsheet|verified/.test(text)) return 'user_provided'
  if (/transcript|said|spoken/.test(text)) return 'transcript_claim'
  if (/claim|reported|alleged|scam|fraud|case/.test(text)) return 'script_claim'
  return 'unknown'
}

function confidenceForSource(sourceType: DataSourceType, text: string, input: PlannerInput): DataConfidence {
  if (sourceType === 'fictional_story_data') return 'fictional'
  if (sourceType === 'mock_demo_data') return 'mock'
  if (/verified|confirmed|source provided/.test(text) && sourceType === 'user_provided') return 'verified'
  if (/reported/.test(text)) return 'reported'
  if (/approximate|about|around|roughly/.test(text)) return 'approximate'
  if (/claim|claimed|alleged/.test(text) || input.editingCategory === 'documentary_case_study') return 'claimed'
  return 'unknown'
}

function safeWordingFor(confidence: DataConfidence) {
  if (confidence === 'verified') return 'verified data'
  if (confidence === 'reported') return 'reported data'
  if (confidence === 'claimed') return 'claimed data'
  if (confidence === 'approximate') return 'approximate data'
  if (confidence === 'fictional') return 'fictional story data'
  if (confidence === 'mock') return 'mock demo data'
  return 'source-needed data'
}

function nodeTypeForVisualType(visualType: DataVizVisualType) {
  if (visualType === 'money_flow_diagram' || visualType === 'account_flow_diagram') return 'account'
  if (visualType === 'process_step_diagram') return 'step'
  if (visualType === 'document_breakdown_card') return 'document'
  if (visualType === 'claim_support_diagram' || visualType === 'evidence_flow_diagram') return 'claim'
  if (visualType === 'metric_card' || visualType.includes('chart')) return 'metric'
  return 'custom'
}

function dataLabelsForVisualType(visualType: DataVizVisualType) {
  if (visualType === 'money_flow_diagram' || visualType === 'account_flow_diagram') return ['source account', 'intermediate account', 'destination account']
  if (visualType === 'process_step_diagram') return ['step 1', 'step 2', 'step 3']
  if (visualType === 'timeline_diagram') return ['first event', 'turning point', 'result']
  if (visualType === 'feature_comparison') return ['feature A', 'feature B', 'benefit']
  if (visualType === 'before_after_comparison') return ['before', 'after']
  if (visualType === 'document_breakdown_card') return ['source detail', 'key claim', 'context']
  if (visualType === 'claim_support_diagram' || visualType === 'evidence_flow_diagram') return ['claim', 'source', 'context']
  if (visualType === 'metric_card') return ['planned metric']
  return ['data point A', 'data point B', 'data point C']
}

function flowDirectionForVisualType(visualType: DataVizVisualType): DiagramFlowDirection {
  if (visualType === 'timeline_diagram') return 'timeline'
  if (visualType === 'network_graph') return 'network'
  if (visualType === 'hierarchy_tree') return 'top_to_bottom'
  return 'left_to_right'
}

function dataPlan(params: {
  input: PlannerInput
  visualType: DataVizVisualType
  text: string
  index: number
}): DataVizDataPlan {
  const dataSourceType = dataSourceForText(params.text)
  const confidence = confidenceForSource(dataSourceType, params.text, params.input)
  const fictionalData = confidence === 'fictional'
  const mockData = confidence === 'mock' || confidence === 'unknown' || confidence === 'claimed' || confidence === 'approximate'
  const sourceNeeded = !fictionalData && confidence !== 'verified'
  const labels = dataLabelsForVisualType(params.visualType)
  const nodeType = nodeTypeForVisualType(params.visualType)
  const direction = flowDirectionForVisualType(params.visualType)
  const sourceLabel = sourceNeeded ? 'Source or user confirmation needed before treating values as exact.' : undefined

  return {
    id: `dataviz-data-${params.index + 1}`,
    dataSourceType,
    confidence,
    sourceNeeded,
    sourceLabel,
    safeWording: safeWordingFor(confidence),
    mockData,
    fictionalData,
    dataPoints: labels.map((itemLabel, itemIndex) => ({
      id: `dataviz-point-${params.index + 1}-${itemIndex + 1}`,
      label: label(itemLabel),
      value: mockData ? `example ${itemIndex + 1}` : undefined,
      confidence,
      sourceLabel,
      notes: [
        mockData ? 'Mock/example value; do not present as verified data.' : 'Value follows the approved source confidence.',
      ],
    })),
    nodes: labels.map((itemLabel, itemIndex) => ({
      id: `dataviz-node-${params.index + 1}-${itemIndex + 1}`,
      label: label(itemLabel),
      nodeType,
      confidence,
      sourceLabel,
      visualRole: itemIndex === 0 ? 'primary' : 'supporting',
      notes: ['Node label must stay exact and readable.'],
    })),
    edges: labels.slice(1).map((_itemLabel, itemIndex) => ({
      id: `dataviz-edge-${params.index + 1}-${itemIndex + 1}`,
      fromNodeId: `dataviz-node-${params.index + 1}-${itemIndex + 1}`,
      toNodeId: `dataviz-node-${params.index + 1}-${itemIndex + 2}`,
      label: params.visualType.includes('flow') ? 'reported flow' : undefined,
      direction,
      confidence,
      sourceLabel,
      notes: ['Arrow/connection direction must not imply more certainty than the data plan.'],
    })),
    qaChecks: [
      'Data confidence and safe wording are visible in the plan.',
      mockData ? 'Mock data is clearly marked.' : 'Exact data should match approved source values.',
      sourceNeeded ? 'Source-needed warning remains until data is verified.' : 'Verified/fictional status is explicit.',
    ],
    notes: [
      'No external data verification has run.',
      'Future chart worker must use approved data snapshot, not raw chat.',
    ],
  }
}

function stylePlan(styleFamily: DataVizStyleFamily, input: PlannerInput): DataVizStylePlan {
  const preset = getDataVizStylePreset(styleFamily)
  const labelDensity = input.editLevel === 'basic' && preset.labelDensity === 'high' ? 'medium' : preset.labelDensity

  return {
    styleFamily,
    colorPalette: preset.colorPalette,
    highlightColor: preset.highlightColor,
    labelDensity,
    typographyScale: input.aspectRatio === '9:16' ? 'large' : preset.typographyScale,
    lineWeight: preset.lineWeight,
    cardStyle: preset.cardStyle,
    documentaryNeutrality: preset.documentaryNeutrality,
    brandColorUse: preset.brandColorUse,
    playfulElementsAllowed: input.editingCategory !== 'documentary_case_study' && preset.playfulElementsAllowed,
    notes: [
      preset.description,
      ...preset.avoidRules.slice(0, 2),
    ],
  }
}

function animationForVisualType(visualType: DataVizVisualType, input: PlannerInput): DataVizAnimationType {
  if (input.editLevel === 'basic') {
    if (visualType === 'metric_card') return 'count_up'
    if (visualType === 'process_step_diagram') return 'step_reveal'
    return 'card_pop'
  }

  return getDataVizVisualPreset(visualType).defaultAnimationType
}

function soundSyncCueIdsFor(params: {
  audioPipelinePlan?: AudioPipelinePlan
  visualType: DataVizVisualType
}) {
  const cueTypes = params.visualType === 'metric_card'
    ? ['count_up', 'visual_reveal']
    : params.visualType === 'timeline_diagram'
      ? ['transition', 'visual_reveal']
      : ['visual_reveal', 'card_reveal', 'count_up']

  return params.audioPipelinePlan?.soundSyncCues
    .filter((cue) => cueTypes.includes(cue.cueType))
    .map((cue) => cue.id)
    .slice(0, 3) ?? []
}

function animationPlan(params: {
  input: PlannerInput
  visualType: DataVizVisualType
  dataPlan: DataVizDataPlan
  audioPipelinePlan?: AudioPipelinePlan
}): DataVizAnimationPlan {
  const soundSyncCueIds = soundSyncCueIdsFor({ audioPipelinePlan: params.audioPipelinePlan, visualType: params.visualType })
  const animationType = animationForVisualType(params.visualType, params.input)

  return {
    animationType,
    durationMs: params.input.editLevel === 'basic' ? 1200 : params.input.editLevel === 'premium' ? 3200 : 2200,
    revealOrder: [
      ...params.dataPlan.nodes.map((node) => node.id),
      ...params.dataPlan.edges.map((edge) => edge.id),
    ].slice(0, 6),
    easing: 'easeOutCubic',
    soundSyncCueIds,
    notes: [
      'Animation is planned as controlled chart/diagram motion, not AI video.',
      soundSyncCueIds.length ? 'SoundSync cues can guide reveals in Remotion.' : 'No specific SoundSync cue is required.',
    ],
  }
}

function defaultLayoutMode(visualType: DataVizVisualType, input: PlannerInput): SpeakerVisualLayoutMode {
  if (visualType === 'before_after_comparison') return 'before_after_panel'
  if (visualType === 'feature_comparison' || visualType === 'pros_cons_comparison') return 'split_screen_comparison'
  if (visualType === 'evidence_flow_diagram' || visualType === 'claim_support_diagram' || visualType === 'document_breakdown_card') return 'full_evidence_board'
  if (input.aspectRatio === '9:16' && input.editLevel === 'basic') return 'lower_visual_panel'
  if (input.aspectRatio === '16:9' && input.editLevel !== 'basic') return 'full_graphic_explainer'
  return 'voiceover_visual_takeover'
}

function layoutPlan(params: {
  input: PlannerInput
  visualType: DataVizVisualType
  layoutItem?: SpeakerVisualLayoutPlanItem
  style: DataVizStylePlan
}): DataVizLayoutPlan {
  const layoutMode = params.layoutItem?.layoutMode ?? defaultLayoutMode(params.visualType, params.input)
  const frameTemplateType = params.layoutItem?.frameTemplateType ?? params.input.frameTemplateType ?? getDefaultFrameTemplateForAspectRatio(params.input.aspectRatio).templateType
  const frameTemplate = frameTemplateType === 'let_ai_decide'
    ? getDefaultFrameTemplateForAspectRatio(params.input.aspectRatio)
    : getFrameLayoutTemplate(frameTemplateType)
  const visualZone = params.layoutItem?.visualZone ?? frameTemplate.animationZone
  const captionSafeZone = params.layoutItem?.captionZone ?? frameTemplate.captionSafeZone
  const speakerZone = params.layoutItem?.speakerZone ?? frameTemplate.speakerZone
  const compactMode = layoutMode === 'lower_visual_panel' || params.input.aspectRatio === '9:16'

  return {
    layoutMode,
    frameTemplateType,
    visualZone,
    speakerZone,
    captionSafeZone,
    safeMargins: params.layoutItem?.safeMargin ?? frameTemplate.safeMargin,
    panelBackgroundColor: params.layoutItem?.panelBackgroundColor ?? frameTemplate.panelBackgroundColor,
    labelAvoidZones: [captionSafeZone, speakerZone].filter(Boolean) as RectZone[],
    maxLabelCount: compactMode ? 4 : params.style.labelDensity === 'high' ? 12 : 8,
    compactMode,
    fullTakeoverMode: layoutMode === 'full_graphic_explainer' || layoutMode === 'voiceover_visual_takeover' || layoutMode === 'full_evidence_board',
    notes: [
      compactMode ? 'Use fewer/larger labels for compact or vertical layout.' : 'Detailed chart/diagram layout is allowed with safe zones.',
      'Captions stay above chart/diagram layers.',
    ],
  }
}

function toolIdsFor(preference: DataVizToolPreference): OpenSourceToolId[] {
  if (preference === 'd3') return ['d3', 'remotion']
  if (preference === 'echarts') return ['echarts', 'remotion']
  if (preference === 'vega_lite_future') return ['vega_lite', 'remotion']
  if (preference === 'remotion_only' || preference === 'gpt_image_frame_only') return ['remotion']
  return ['d3', 'echarts', 'remotion']
}

function capabilitiesFor(visualType: DataVizVisualType, layout: DataVizLayoutPlan): RemotionCapabilityId[] {
  return unique([
    'chart_layer_placement',
    'diagram_build',
    visualType.includes('flow') || visualType === 'network_graph' ? 'arrow_flow' : undefined,
    visualType === 'timeline_diagram' ? 'timeline_card' : undefined,
    layout.layoutMode === 'side_by_side_speaker_visual' ? 'side_by_side_layout' : undefined,
    layout.layoutMode === 'lower_visual_panel' ? 'lower_visual_panel' : undefined,
    layout.layoutMode === 'picture_in_picture_speaker' ? 'picture_in_picture' : undefined,
    layout.fullTakeoverMode ? 'full_visual_takeover_layout' : undefined,
    'safe_zone_layout',
  ].filter(Boolean) as RemotionCapabilityId[])
}

function creditImpactFor(input: PlannerInput, visualType: DataVizVisualType): DataVizPlanItem['creditImpact'] {
  if (input.editLevel === 'basic') return 'low'
  if (input.editLevel === 'premium' && (visualType === 'network_graph' || visualType === 'money_flow_diagram' || visualType === 'evidence_flow_diagram')) return 'premium'
  if (visualType === 'network_graph' || visualType === 'money_flow_diagram' || visualType === 'account_flow_diagram' || visualType === 'evidence_flow_diagram') return 'high'
  if (visualType === 'process_step_diagram' || visualType === 'timeline_diagram' || visualType.includes('chart')) return 'medium'
  return 'low'
}

function tierAllowedFor(visualType: DataVizVisualType) {
  const complex = visualType === 'network_graph' || visualType === 'hierarchy_tree'

  return {
    basic: !complex,
    pro: true,
    premium: true,
  }
}

function findLayoutItem(params: {
  asset?: VisualAssetPlanItem
  segment?: SegmentEditPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
}) {
  return params.speakerVisualLayoutPlan?.items.find((item) =>
    item.assetPlanItemId === params.asset?.id ||
    item.segmentId === params.segment?.id ||
    item.id === params.asset?.speakerVisualLayoutItemId ||
    item.id === params.segment?.speakerVisualLayoutItemId,
  )
}

function segmentForAsset(asset: VisualAssetPlanItem | undefined, segments?: SegmentEditPlan[]) {
  if (!asset) return undefined
  return segments?.find((segment) => segment.visualAssetPlanItemIds.includes(asset.id))
}

function renderItemForAsset(asset: VisualAssetPlanItem | undefined, renderStrategyPlan?: RenderStrategyPlan) {
  if (!asset) return undefined
  return renderStrategyPlan?.items.find((item) => item.assetPlanItemId === asset.id || item.id === asset.renderStrategyItemId)
}

function toolStrategyItemForAsset(asset: VisualAssetPlanItem | undefined, toolStrategyPlan?: ToolStrategyPlan) {
  if (!asset) return undefined
  return toolStrategyPlan?.items.find((item) => item.assetPlanItemId === asset.id || asset.toolStrategyItemIds?.includes(item.id))
}

function createItem(params: {
  asset?: VisualAssetPlanItem
  index: number
  input: PlannerInput
  text: string
  segment?: SegmentEditPlan
  layoutItem?: SpeakerVisualLayoutPlanItem
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  audioPipelinePlan?: AudioPipelinePlan
}): DataVizPlanItem {
  const visualType = visualTypeFromText(params.text, params.input)
  const data = dataPlan({ index: params.index, input: params.input, text: params.text, visualType })
  const style = stylePlan(getDefaultDataVizStyleForCategory({
    category: params.input.editingCategory,
    customInstructions: params.text,
  }), params.input)
  const layout = layoutPlan({ input: params.input, layoutItem: params.layoutItem, style, visualType })
  const animation = animationPlan({ audioPipelinePlan: params.audioPipelinePlan, dataPlan: data, input: params.input, visualType })
  const preferredTool = getPreferredToolForVisualType(visualType)
  const visualPreset = getDataVizVisualPreset(visualType)
  const toolIds = toolIdsFor(preferredTool)

  return {
    id: `dataviz-item-${params.index + 1}`,
    segmentId: params.segment?.id,
    assetPlanItemId: params.asset?.id,
    visualAssetPlanItemId: params.asset?.id,
    speakerVisualLayoutItemId: params.layoutItem?.id,
    renderStrategyItemId: renderItemForAsset(params.asset, params.renderStrategyPlan)?.id,
    toolStrategyItemId: toolStrategyItemForAsset(params.asset, params.toolStrategyPlan)?.id,
    visualType,
    title: `${label(visualType)} plan`,
    purpose: params.asset?.storyPurpose ?? `Use a controlled ${label(visualType)} to clarify exact structured information.`,
    dataPlan: data,
    style,
    animation,
    layout,
    preferredTool,
    toolChain: 'chart_diagram_chain',
    toolIds,
    remotionCapabilities: capabilitiesFor(visualType, layout),
    creditImpact: creditImpactFor(params.input, visualType),
    tierAllowed: tierAllowedFor(visualType),
    reason: `Exact ${label(visualType)} work needs controlled labels, source wording, safe zones, and Remotion composition.`,
    whyNotAiVideo: 'AI video should not invent exact charts, labels, arrows, accounts, dates, numbers, or diagram structure.',
    fallbackStrategy: [
      ...visualPreset.fallback,
      'Use a simpler Remotion-only card if D3/ECharts planning is too dense.',
      'Reduce label count for lower-panel or Basic layouts.',
    ],
    qaChecks: [
      ...visualPreset.qaChecks,
      ...data.qaChecks,
      'Chart/diagram does not cover captions, face, product, or key source footage.',
      'No Veo or AI-video route is used for exact chart/diagram rendering.',
    ],
    workerNotes: [
      `Preferred tool: ${label(preferredTool)}; tools planned only: ${toolIds.map(label).join(', ')}.`,
      'No D3, ECharts, Vega-Lite, Remotion render, or data processing runs in this frontend mock.',
      'Future chart workers must use approved data/source snapshot, not raw chat.',
    ],
  }
}

function createItems(params: CreateDataVizPlanParams) {
  const assets = dataVizAssets(params)
  const planText = allText(params)

  return assets.map((asset, index) => {
    const segment = segmentForAsset(asset, params.segmentEditPlans)
    const layoutItem = findLayoutItem({ asset, segment, speakerVisualLayoutPlan: params.speakerVisualLayoutPlan })
    const text = `${planText} ${assetText(asset)} ${segment?.storyPurpose ?? ''}`

    return createItem({
      asset,
      audioPipelinePlan: params.audioPipelinePlan,
      index,
      input: params.input,
      layoutItem,
      renderStrategyPlan: params.renderStrategyPlan,
      segment,
      text,
      toolStrategyPlan: params.toolStrategyPlan,
    })
  })
}

export function createDataVizPlan(params: CreateDataVizPlanParams): DataVizPlan {
  const active = hasDataVizSignal(params)
  const items = active ? createItems(params) : []
  const toolsPlanned = unique(items.flatMap((item) => item.toolIds))

  return {
    id: `dataviz-plan-${params.input.editingCategory}-${params.input.editLevel}`,
    active,
    summary: active
      ? `${items.length} chart/diagram item${items.length === 1 ? '' : 's'} planned with ${toolsPlanned.map(label).join(', ') || 'controlled Remotion'}; exact data stays source-aware.`
      : 'No chart/diagram plan is active for this edit.',
    items,
    toolsPlanned,
    globalRules: [
      'Charts and diagrams use controlled tool or Remotion planning for exact labels, arrows, data, and timelines.',
      'D3/ECharts/Vega-Lite are planning references only; no package is installed or executed.',
      'Remotion composes the final chart/diagram layer.',
      'AI video must not invent exact charts, numbers, labels, dates, claims, or diagram structure.',
      'Mock, fictional, claimed, approximate, or source-needed data must be labeled safely.',
      params.input.editLevel === 'premium' ? 'Premium Veo policy remains unrelated final fallback for AI video assets only.' : 'Basic/Pro cannot use Veo.',
    ],
    qaChecks: [
      'Data confidence and safe wording are present.',
      'Mock/fictional data is clearly marked.',
      'Labels, arrows, and axes are readable.',
      'Caption, face, product, and source-footage safe zones are respected.',
      'No chart/dataviz tool execution occurs before approval.',
    ],
    limitations: [
      'Mock-only chart/diagram plan; no D3/ECharts/Vega-Lite rendering has been run.',
      'No external data verification or real chart data processing has been run.',
      'Future worker/tool integration is required for actual chart rendering.',
      'No backend, provider, Remotion render, or export job is implemented here.',
    ],
    notes: [
      'Tool registry guides D3/ECharts/Vega-Lite/Remotion choices without limiting custom requests.',
      'Exact data visuals stay controlled and approval-gated.',
    ],
  }
}
