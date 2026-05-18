import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  CompiledEditingIntent,
  DepthAwareOverlayPlan,
  DepthCompositingMode,
  FrameLayoutPlan,
  LocationClaimStatus,
  LocationConfidence,
  MapAnimationPlan,
  MapAnimationPlanItem,
  MapAnimationType,
  MapCameraPlan,
  MapCoordinate,
  MapDataSourceType,
  MapLayoutPlan,
  MapLocationPlan,
  MapRoutePlan,
  MapStyleFamily,
  MapStylePlan,
  MapVisualType,
  MaskStrategy,
  OpenSourceToolId,
  PlannerInput,
  RectZone,
  RemotionCapabilityId,
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
  getDefaultMapLayoutForAspectRatio,
  getDefaultMapStyleForCategory,
  getMapStylePreset,
  getMapVisualPreset,
} from './map-animation-presets'

type CreateMapAnimationPlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  toolStrategyPlan?: ToolStrategyPlan
  audioPipelinePlan?: AudioPipelinePlan
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'map'
}

function allText(params: CreateMapAnimationPlanParams) {
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
      strategy.recommendedVisualSupport,
      ...strategy.recommendedToolHints,
      ...strategy.reasons.map((reason) => reason.explanation),
    ]) ?? []),
    ...(params.visualAssetPlan?.flatMap((asset) => [asset.beatLabel, asset.storyPurpose, asset.reason]) ?? []),
    ...(params.depthAwareOverlayPlan?.items.flatMap((item) => [item.overlayLayerDescription, item.reason, ...item.workerNotes]) ?? []),
    ...(params.input.clips.flatMap((clip) => [clip.fileName, clip.detectedType, clip.notes ?? '']) ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function isMapText(text: string) {
  return /\b(map|route|location|city|country|neighborhood|real estate|property|place|address|distance|geography|travel|street|region|state|nearby|across places|multi-city)\b/.test(text)
}

function hasMapSignal(params: CreateMapAnimationPlanParams) {
  const text = allText(params)

  return isMapText(text) ||
    Boolean(params.videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'map_animation')) ||
    Boolean(params.adaptiveEditStrategyPlan?.segmentStrategies.some((strategy) => strategy.recommendedToolHints.includes('map_tool'))) ||
    Boolean(params.toolStrategyPlan?.items.some((item) => item.chainId === 'map_route_chain')) ||
    Boolean(params.speakerVisualLayoutPlan?.items.some((item) => item.layoutMode === 'full_map_takeover')) ||
    Boolean(params.depthAwareOverlayPlan?.items.some((item) => /map/i.test(`${item.overlayLayerDescription} ${item.reason}`)))
}

function assetText(asset: VisualAssetPlanItem) {
  return `${asset.beatLabel} ${asset.storyPurpose} ${asset.reason}`.toLowerCase()
}

function mapAssets(params: CreateMapAnimationPlanParams) {
  const assets = params.visualAssetPlan ?? []
  const filtered = assets.filter((asset) =>
    isMapText(assetText(asset)) ||
    asset.layoutMode === 'full_map_takeover' ||
    asset.toolStrategyItemIds?.some((id) => params.toolStrategyPlan?.items.find((item) => item.id === id)?.chainId === 'map_route_chain') ||
    asset.renderStrategyType === 'open_source_tool_then_remotion',
  )

  if (filtered.length > 0) {
    return filtered.slice(0, params.input.editLevel === 'premium' ? 4 : 2)
  }

  return assets.slice(0, 1)
}

function visualTypeFromText(text: string, input: PlannerInput): MapVisualType {
  if (/behind.*(person|speaker|subject)|map behind/.test(text) && /(pole|table|chair|microphone|mic|laptop|product|leaning|contact object)/.test(text)) {
    return 'map_behind_subject_and_contact_object'
  }

  if (/behind.*(person|speaker|subject)|map behind/.test(text)) return 'map_behind_subject'
  if (/real estate|property|listing|neighborhood/.test(text)) return 'real_estate_neighborhood'
  if (/money|scam|account|funds|payment|wire|movement/.test(text)) return 'money_movement_map'
  if (/documentary|case|fraud|investigation|evidence|alleged/.test(text) || input.editingCategory === 'documentary_case_study') return 'documentary_case_map'
  if (/travel|trip|route|from .* to |city to city/.test(text)) return 'travel_route'
  if (/multiple|multi-city|cities|several places|sequence/.test(text)) return 'multi_location_sequence'
  if (/region|country|state|area|approximate/.test(text)) return 'region_highlight'
  if (/full map|takeover/.test(text)) return 'full_map_takeover'
  if (/lower panel/.test(text)) return 'lower_panel_map'
  return 'location_pin'
}

function dataSourceForText(text: string): MapDataSourceType {
  if (/fictional|made up|imaginary/.test(text)) return 'fictional_location'
  if (/coordinate|longitude|latitude/.test(text)) return 'manual_coordinates'
  if (/address|city|country|neighborhood|route|location|place/.test(text)) return 'script_location'
  return 'unknown'
}

function claimStatusForText(text: string, input: PlannerInput): LocationClaimStatus {
  if (/fictional|made up|imaginary/.test(text)) return 'fictional'
  if (/alleged|claimed|reported|supposed/.test(text)) return 'alleged'
  if (input.editingCategory === 'documentary_case_study') return 'claimed_by_source'
  if (/approximate|near|around|region/.test(text)) return 'approximate'
  if (/verified|confirmed/.test(text)) return 'verified'
  return 'unknown'
}

function confidenceForStatus(status: LocationClaimStatus, dataSource: MapDataSourceType): LocationConfidence {
  if (status === 'fictional' || dataSource === 'fictional_location') return 'fictional'
  if (status === 'verified' && dataSource === 'manual_coordinates') return 'exact'
  if (status === 'approximate' || status === 'claimed_by_source' || status === 'alleged') return 'approximate'
  return 'unknown'
}

function safeWordingFor(status: LocationClaimStatus, confidence: LocationConfidence) {
  if (status === 'fictional') return 'fictional location'
  if (status === 'alleged') return 'alleged location'
  if (status === 'claimed_by_source') return 'reported location'
  if (confidence === 'approximate') return 'approximate location'
  if (confidence === 'exact') return 'approved exact location'
  return 'location mentioned in the story'
}

function extractLocationLabels(text: string, visualType: MapVisualType) {
  const matches = Array.from(text.matchAll(/\b(?:in|near|from|to|around|across)\s+([a-z][a-z\s]{2,24})(?=\.|,| while| with| and|$)/g))
    .map((match) => match[1].trim())
    .filter((value) => !/the|a |an |this|that|person|speaker|map|route/.test(value))

  if (matches.length > 0) {
    return unique(matches).slice(0, visualType === 'multi_location_sequence' || visualType === 'travel_route' ? 3 : 1)
  }

  if (visualType === 'travel_route' || visualType === 'route_reveal') return ['route start', 'route destination']
  if (visualType === 'real_estate_neighborhood') return ['property neighborhood']
  if (visualType === 'documentary_case_map' || visualType === 'evidence_location_map') return ['reported case location']
  if (visualType === 'money_movement_map') return ['reported movement location']
  return ['location mentioned in the story']
}

function createLocations(params: {
  input: PlannerInput
  visualType: MapVisualType
  text: string
}): MapLocationPlan[] {
  const dataSource = dataSourceForText(params.text)
  const claimStatus = claimStatusForText(params.text, params.input)
  const confidence = confidenceForStatus(claimStatus, dataSource)
  const sourceNeeded = confidence !== 'fictional' && confidence !== 'exact'

  return extractLocationLabels(params.text, params.visualType).map((locationLabel, index) => ({
    id: `map-location-${index + 1}`,
    label: label(locationLabel),
    dataSource,
    confidence,
    claimStatus,
    approximateRegion: confidence !== 'exact' ? label(locationLabel) : undefined,
    sourceNeeded,
    sourceLabel: sourceNeeded ? 'Source or user confirmation needed before exact pin usage.' : undefined,
    safeWording: safeWordingFor(claimStatus, confidence),
    notes: [
      'No geocoding has run.',
      sourceNeeded ? 'Use approximate/region treatment until source confidence improves.' : 'Location can be represented using the approved confidence level.',
    ],
  }))
}

function stylePlan(styleFamily: MapStyleFamily): MapStylePlan {
  const preset = getMapStylePreset(styleFamily)

  return {
    styleFamily,
    baseMapStyle: preset.id,
    labelDensity: preset.labelDensity,
    colorPalette: preset.colorPalette,
    routeColor: preset.routeColor,
    markerColor: preset.markerColor,
    highlightColor: preset.highlightColor,
    documentaryNeutrality: styleFamily === 'documentary_evidence_map' || styleFamily === 'muted_case_study_map',
    darkMode: styleFamily === 'dark_cinematic_map',
    notes: [
      preset.description,
      ...preset.avoidRules.slice(0, 2),
    ],
  }
}

function animationForVisualType(visualType: MapVisualType, input: PlannerInput): MapAnimationType {
  if (input.editLevel === 'basic') {
    if (visualType === 'route_reveal' || visualType === 'travel_route') return 'fit_bounds'
    return visualType === 'location_pin' || visualType === 'lower_panel_map' ? 'pin_drop' : 'static_hold'
  }

  return getMapVisualPreset(visualType).defaultAnimationType
}

function placeholderCoordinate(index: number, labelValue: string): MapCoordinate {
  return {
    longitude: 0,
    latitude: 0,
    label: `${labelValue} placeholder ${index + 1}`,
  }
}

function cameraPlan(params: {
  input: PlannerInput
  visualType: MapVisualType
  locations: MapLocationPlan[]
}): MapCameraPlan {
  const animationType = animationForVisualType(params.visualType, params.input)
  const coordinates = params.locations.map((location, index) => location.coordinates ?? placeholderCoordinate(index, location.label))

  return {
    animationType,
    center: params.locations[0]?.coordinates,
    zoom: params.input.editLevel === 'basic' ? 10 : params.input.editLevel === 'premium' ? 12 : 11,
    bearing: params.input.editLevel === 'basic' ? 0 : 12,
    pitch: params.input.editLevel === 'premium' ? 38 : params.input.editLevel === 'pro' ? 24 : 0,
    flyDurationMs: params.input.editLevel === 'basic' ? 1800 : params.input.editLevel === 'premium' ? 4200 : 3000,
    flySpeed: params.input.editLevel === 'basic' ? 0.8 : 1.1,
    curve: 1.2,
    easing: 'easeOutCubic',
    fitBounds: coordinates.length > 1 ? { coordinates, padding: params.input.editLevel === 'basic' ? 64 : 96 } : undefined,
    holdDurationMs: params.input.editLevel === 'basic' ? 1800 : 2400,
    notes: [
      'Camera values are planning placeholders only.',
      'Future MapLibre/Turf worker must resolve approved coordinates/bounds before rendering.',
    ],
  }
}

function routePlan(params: {
  visualType: MapVisualType
  locations: MapLocationPlan[]
  style: MapStylePlan
  input: PlannerInput
}): MapRoutePlan | undefined {
  if (!['route_reveal', 'travel_route', 'multi_location_sequence', 'money_movement_map'].includes(params.visualType)) {
    return undefined
  }

  const routeCoordinates = params.locations.length > 1
    ? params.locations.map((location, index) => location.coordinates ?? placeholderCoordinate(index, location.label))
    : [placeholderCoordinate(0, 'route start'), placeholderCoordinate(1, 'route destination')]

  return {
    id: 'map-route-1',
    routeCoordinates,
    routeLabel: params.visualType === 'money_movement_map' ? 'reported movement path' : 'planned route',
    routeRevealDurationMs: params.input.editLevel === 'premium' ? 3600 : params.input.editLevel === 'pro' ? 2800 : 1800,
    routeLineColor: params.style.routeColor,
    routeLineWidth: params.input.editLevel === 'basic' ? 4 : 5,
    routeLineDash: params.visualType === 'money_movement_map' ? 'source-aware-dash' : undefined,
    direction: 'start_to_end',
    notes: [
      'Route coordinates are placeholders until approved location data exists.',
      'Turf planning should calculate bounds and route geometry in a future worker.',
    ],
  }
}

function frameForLayout(layoutMode: SpeakerVisualLayoutMode, input: PlannerInput): FrameLayoutPlan {
  const defaultLayout = getDefaultMapLayoutForAspectRatio({
    aspectRatio: input.aspectRatio,
    editLevel: input.editLevel,
  })
  const layoutFallback = layoutMode === 'lower_visual_panel'
    ? 'vertical_talking_head_lower_panel'
    : layoutMode === 'full_map_takeover'
      ? 'vertical_full_panel'
      : defaultLayout.frameTemplateType
  const frameTemplateType = input.frameTemplateType && input.frameTemplateType !== 'let_ai_decide'
    ? input.frameTemplateType
    : layoutFallback

  return frameTemplateType === 'let_ai_decide'
    ? getDefaultFrameTemplateForAspectRatio(input.aspectRatio)
    : getFrameLayoutTemplate(frameTemplateType)
}

function mapLayoutPlan(params: {
  input: PlannerInput
  visualType: MapVisualType
  layoutItem?: SpeakerVisualLayoutPlanItem
  depthItemId?: string
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
}): MapLayoutPlan {
  const defaultLayout = getDefaultMapLayoutForAspectRatio({
    aspectRatio: params.input.aspectRatio,
    editLevel: params.input.editLevel,
    mapVisualType: params.visualType,
  })
  const layoutMode = params.layoutItem?.layoutMode ?? defaultLayout.layoutMode
  const frameTemplate = frameForLayout(layoutMode, params.input)
  const foregroundMaskAware = params.visualType === 'map_behind_subject' || params.visualType === 'map_behind_subject_and_contact_object'
  const mapZone = params.layoutItem?.visualZone ?? frameTemplate.animationZone
  const captionSafeZone = params.layoutItem?.captionZone ?? frameTemplate.captionSafeZone
  const expectedForegroundZone = params.layoutItem?.speakerZone ?? frameTemplate.speakerZone

  return {
    layoutMode,
    frameTemplateType: params.layoutItem?.frameTemplateType ?? defaultLayout.frameTemplateType,
    mapZone,
    speakerZone: params.layoutItem?.speakerZone,
    captionSafeZone,
    safeMargins: params.layoutItem?.safeMargin ?? frameTemplate.safeMargin,
    panelBackgroundColor: params.layoutItem?.panelBackgroundColor ?? frameTemplate.panelBackgroundColor,
    foregroundMaskAware,
    expectedForegroundZone: foregroundMaskAware ? expectedForegroundZone : undefined,
    labelAvoidZones: [captionSafeZone, foregroundMaskAware ? expectedForegroundZone : undefined].filter(Boolean) as RectZone[],
    depthCompositingMode: foregroundMaskAware ? params.depthCompositingMode ?? 'graphic_behind_subject_and_contact_objects' : params.depthCompositingMode,
    maskStrategy: foregroundMaskAware ? params.maskStrategy ?? 'subject_plus_contact_object_mask' : params.maskStrategy,
    fallbackLayoutMode: foregroundMaskAware ? (params.input.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'lower_visual_panel') : params.layoutItem?.fallbackLayoutMode,
    notes: [
      foregroundMaskAware
        ? 'Map is planned behind foreground subject/contact object; no mask is generated in this milestone.'
        : 'Map layer uses controlled layout and caption-safe zones.',
      'Captions remain above map layers.',
    ],
  }
}

function capabilitiesForVisualType(visualType: MapVisualType, layoutMode: SpeakerVisualLayoutMode): RemotionCapabilityId[] {
  return unique([
    'map_layer_placement',
    'safe_zone_layout',
    layoutMode === 'picture_in_picture_speaker' ? 'picture_in_picture' : undefined,
    layoutMode === 'side_by_side_speaker_visual' ? 'side_by_side_layout' : undefined,
    layoutMode === 'lower_visual_panel' ? 'lower_visual_panel' : undefined,
    layoutMode === 'full_map_takeover' ? 'full_visual_takeover_layout' : undefined,
    visualType === 'map_behind_subject' || visualType === 'map_behind_subject_and_contact_object' ? 'depth_layer_composition' : undefined,
    visualType === 'route_reveal' || visualType === 'travel_route' ? 'transition_layer' : undefined,
  ].filter(Boolean) as RemotionCapabilityId[])
}

function creditImpactFor(input: PlannerInput, visualType: MapVisualType): MapAnimationPlanItem['creditImpact'] {
  if (input.editLevel === 'basic') return 'low'
  if (visualType === 'map_behind_subject_and_contact_object') return input.editLevel === 'premium' ? 'premium' : 'high'
  if (visualType === 'map_behind_subject') return 'high'
  if (visualType.includes('future')) return 'premium'
  if (visualType === 'route_reveal' || visualType === 'travel_route' || visualType === 'multi_location_sequence') return 'medium'
  return input.editLevel === 'premium' ? 'medium' : 'low'
}

function tierAllowedFor(visualType: MapVisualType) {
  const advanced = visualType === 'map_behind_subject_and_contact_object' ||
    visualType === 'globe_reveal_future' ||
    visualType === 'heatmap_future' ||
    visualType === 'arc_flow_future'

  return {
    basic: !advanced && visualType !== 'map_behind_subject',
    pro: !visualType.includes('future'),
    premium: true,
  }
}

function soundSyncCueIdsFor(params: {
  audioPipelinePlan?: AudioPipelinePlan
  visualType: MapVisualType
}) {
  const cueTypes = params.visualType === 'location_pin' || params.visualType === 'map_behind_subject'
    ? ['map_pin_drop', 'visual_reveal']
    : ['map_pin_drop', 'visual_reveal', 'count_up']

  return params.audioPipelinePlan?.soundSyncCues
    .filter((cue) => cueTypes.includes(cue.cueType))
    .map((cue) => cue.id)
    .slice(0, 3) ?? []
}

function matchingLayoutItem(params: {
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

function matchingDepth(params: {
  asset?: VisualAssetPlanItem
  segment?: SegmentEditPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
}) {
  return params.depthAwareOverlayPlan?.items.find((item) =>
    item.assetPlanItemId === params.asset?.id ||
    item.segmentId === params.segment?.id ||
    item.id === params.asset?.depthAwareOverlayItemId ||
    item.id === params.segment?.depthAwareOverlayItemId,
  )
}

function createMapItem(params: {
  input: PlannerInput
  index: number
  asset?: VisualAssetPlanItem
  segment?: SegmentEditPlan
  text: string
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  audioPipelinePlan?: AudioPipelinePlan
}): MapAnimationPlanItem {
  const visualType = visualTypeFromText(params.text, params.input)
  const styleFamily = getDefaultMapStyleForCategory({
    customInstructions: params.input.customInstructions,
    editLevel: params.input.editLevel,
    editingCategory: params.input.editingCategory,
  })
  const locations = createLocations({ input: params.input, text: params.text, visualType })
  const style = stylePlan(styleFamily)
  const camera = cameraPlan({ input: params.input, locations, visualType })
  const route = routePlan({ input: params.input, locations, style, visualType })
  const layoutItem = matchingLayoutItem({
    asset: params.asset,
    segment: params.segment,
    speakerVisualLayoutPlan: params.speakerVisualLayoutPlan,
  })
  const depthItem = matchingDepth({
    asset: params.asset,
    depthAwareOverlayPlan: params.depthAwareOverlayPlan,
    segment: params.segment,
  })
  const layout = mapLayoutPlan({
    depthCompositingMode: depthItem?.depthCompositingMode,
    depthItemId: depthItem?.id,
    input: params.input,
    layoutItem,
    maskStrategy: depthItem?.maskStrategy,
    visualType,
  })
  const futureTools: OpenSourceToolId[] = visualType === 'globe_reveal_future'
    ? ['cesium_js']
    : visualType === 'heatmap_future' || visualType === 'arc_flow_future'
      ? ['deck_gl']
      : []
  const toolIds = unique(['maplibre', 'turf', 'remotion', ...futureTools] as OpenSourceToolId[])
  const sourceNeeded = locations.some((location) => location.sourceNeeded)
  const sourceSafe = locations.map((location) => location.safeWording).join(', ')

  return {
    id: `map-plan-item-${params.index + 1}`,
    segmentId: params.segment?.id,
    assetPlanItemId: params.asset?.id,
    visualAssetPlanItemId: params.asset?.id,
    speakerVisualLayoutItemId: layoutItem?.id,
    depthAwareOverlayItemId: depthItem?.id,
    mapVisualType: visualType,
    title: params.asset?.beatLabel ?? params.segment?.label ?? getMapVisualPreset(visualType).label,
    purpose: params.asset?.storyPurpose ?? params.segment?.storyPurpose ?? 'Clarify location, route, or geography with controlled map planning.',
    locations,
    style,
    camera,
    route,
    layout,
    toolChain: 'map_route_chain',
    toolIds,
    remotionCapabilities: capabilitiesForVisualType(visualType, layout.layoutMode),
    soundSyncCueIds: soundSyncCueIdsFor({ audioPipelinePlan: params.audioPipelinePlan, visualType }),
    creditImpact: creditImpactFor(params.input, visualType),
    tierAllowed: tierAllowedFor(visualType),
    reason: `Map visual uses controlled MapLibre/Turf/Remotion planning because ${sourceSafe} should not be invented by AI video.`,
    fallbackStrategy: [
      layout.fallbackLayoutMode ? `Use ${label(layout.fallbackLayoutMode)} if map overlay is too risky.` : 'Use a static location card if animation is too complex.',
      sourceNeeded ? 'Use approximate region or reported-location wording until source confidence improves.' : 'Keep exact labels tied to approved location data.',
      'Use Remotion-only title/location card if future map worker is unavailable.',
    ],
    qaChecks: [
      'Map labels remain readable and caption-safe.',
      'Map does not cover faces, products, foreground contact objects, or captions.',
      'Location confidence and claim status are represented safely.',
      'Controlled map tools are planned instead of AI video for exact geography.',
      visualType === 'map_behind_subject_and_contact_object'
        ? 'Contact object preservation and fallback layout are planned.'
        : 'Layout fallback exists for map readability.',
    ],
    workerNotes: [
      'Planning only: no MapLibre/Turf package is installed or executed.',
      'No geocoding, tile API, Mapbox API, or real map rendering is run in this frontend demo.',
      'Future workers must use approved plan snapshots and source-confirmed locations.',
      visualType === 'map_behind_subject_and_contact_object'
        ? 'Future mask/segmentation worker required for subject plus contact object preservation.'
        : 'Remotion composes the planned map output into the final canvas.',
    ],
  }
}

function createItems(params: CreateMapAnimationPlanParams) {
  const assets = mapAssets(params)
  const text = allText(params)
  const segments = params.segmentEditPlans ?? []

  if (assets.length === 0) {
    return [
      createMapItem({
        audioPipelinePlan: params.audioPipelinePlan,
        depthAwareOverlayPlan: params.depthAwareOverlayPlan,
        index: 0,
        input: params.input,
        segment: segments[0],
        speakerVisualLayoutPlan: params.speakerVisualLayoutPlan,
        text,
      }),
    ]
  }

  return assets.map((asset, index) => {
    const segment = segments.find((candidate) => candidate.visualAssetPlanItemIds.includes(asset.id))

    return createMapItem({
      asset,
      audioPipelinePlan: params.audioPipelinePlan,
      depthAwareOverlayPlan: params.depthAwareOverlayPlan,
      index,
      input: params.input,
      segment,
      speakerVisualLayoutPlan: params.speakerVisualLayoutPlan,
      text: `${text} ${assetText(asset)} ${segment?.label ?? ''} ${segment?.storyPurpose ?? ''}`,
    })
  })
}

export function createMapAnimationPlan(params: CreateMapAnimationPlanParams): MapAnimationPlan {
  const active = hasMapSignal(params)
  const items = active ? createItems(params) : []
  const mapToolsPlanned = unique(items.flatMap((item) => item.toolIds))

  return {
    id: `map-animation-${params.input.editingCategory}-${params.input.editLevel}`,
    active,
    summary: active
      ? `${items.length} map/location plan item${items.length === 1 ? '' : 's'} prepared with controlled MapLibre/Turf/Remotion planning.`
      : 'No map/location animation plan is active for this edit.',
    items,
    mapToolsPlanned,
    globalRules: [
      'Use controlled map planning for geographic truth instead of AI video.',
      'Map tools create map assets/specs; Remotion owns final composition and captions.',
      'Do not invent exact pins, routes, labels, roads, or geography.',
      'Documentary/case-study locations use safe wording when confidence is unclear.',
      'Map behind subject/contact object is a depth-aware composition plan, not mask execution.',
      params.input.editLevel === 'premium' ? 'Premium Veo remains final fallback only for AI video assets, not maps.' : 'Basic/Pro cannot use Veo.',
    ],
    qaChecks: [
      'Map labels are readable.',
      'Map does not cover face, product, captions, foreground subject, or contact object.',
      'Location confidence, claim status, and source-needed state are represented.',
      'Unknown/alleged locations use approximate or reported wording.',
      'No real map render, geocoding, tile call, or map tool execution is implied.',
    ],
    limitations: [
      'Mock-only map plan; no geocoding or location verification has been run.',
      'No MapLibre, Turf, deck.gl, CesiumJS, Mapbox, tile API, or map rendering executes in this frontend demo.',
      'Future worker/tool integration is required for actual MapLibre/Turf rendering.',
    ],
    notes: [
      params.toolStrategyPlan?.chainIdsUsed.includes('map_route_chain')
        ? 'Tool strategy already includes a map route chain.'
        : 'Map plan can create a map route chain requirement for future tool strategy.',
      params.audioPipelinePlan?.soundSyncCues.length
        ? 'SoundSync cues may align map pins, route reveals, and visual transitions.'
        : 'No SoundSync cue link is required for this map plan.',
    ],
  }
}
