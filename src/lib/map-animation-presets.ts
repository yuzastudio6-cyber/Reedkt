import type {
  AspectRatio,
  EditLevel,
  EditingCategory,
  FrameTemplateType,
  MapAnimationType,
  MapStyleFamily,
  MapVisualType,
  OpenSourceToolId,
  SpeakerVisualLayoutMode,
} from '../types/reeditpro'

type MapStylePreset = {
  id: MapStyleFamily
  label: string
  description: string
  bestUseCases: string[]
  colorPalette: string[]
  routeColor: string
  markerColor: string
  highlightColor: string
  labelDensity: 'low' | 'medium' | 'high'
  avoidRules: string[]
  qaChecks: string[]
}

type MapVisualPreset = {
  id: MapVisualType
  label: string
  defaultAnimationType: MapAnimationType
  preferredLayoutModes: SpeakerVisualLayoutMode[]
  preferredTools: OpenSourceToolId[]
  tierBehavior: Record<EditLevel, string>
  fallback: string[]
  qaChecks: string[]
}

export const mapStylePresets: MapStylePreset[] = [
  {
    id: 'clean_social_map',
    label: 'Clean social map',
    description: 'Bright, readable map styling for quick social explainers and simple location context.',
    bestUseCases: ['creator explainers', 'simple pins', 'short-form map context'],
    colorPalette: ['brand_blue', 'brand_cyan', 'soft_white'],
    routeColor: 'brand_cyan',
    markerColor: 'brand_blue',
    highlightColor: 'brand_violet',
    labelDensity: 'low',
    avoidRules: ['Avoid dense labels.', 'Do not imply exactness without source confidence.'],
    qaChecks: ['Labels remain readable on mobile.', 'Pins stay clear of captions.'],
  },
  {
    id: 'documentary_evidence_map',
    label: 'Documentary evidence map',
    description: 'Restrained evidence-map look for documentary and case-study geography.',
    bestUseCases: ['case geography', 'reported locations', 'evidence boards'],
    colorPalette: ['muted_blue', 'slate', 'soft_cyan'],
    routeColor: 'muted_cyan',
    markerColor: 'warning_gold',
    highlightColor: 'soft_violet',
    labelDensity: 'medium',
    avoidRules: ['Avoid sensational red-alert styling.', 'Avoid fake exact pins for alleged locations.'],
    qaChecks: ['Source-needed locations are flagged.', 'Safe wording is visible in the plan.'],
  },
  {
    id: 'muted_case_study_map',
    label: 'Muted case-study map',
    description: 'Quiet map style for serious cases, scams, investigations, and neutral geography.',
    bestUseCases: ['scam timelines', 'case study maps', 'serious story geography'],
    colorPalette: ['muted_slate', 'soft_blue', 'off_white'],
    routeColor: 'soft_blue',
    markerColor: 'soft_cyan',
    highlightColor: 'muted_violet',
    labelDensity: 'low',
    avoidRules: ['Avoid dramatic exaggeration.', 'Use approximate regions when confidence is low.'],
    qaChecks: ['Neutral tone is preserved.', 'Location certainty is not overstated.'],
  },
  {
    id: 'warm_lifestyle_travel_map',
    label: 'Warm lifestyle travel map',
    description: 'Friendly travel/location style for lifestyle, vlog, route, and city movement visuals.',
    bestUseCases: ['travel route', 'city movement', 'warm lifestyle context'],
    colorPalette: ['warm_white', 'brand_cyan', 'soft_blue'],
    routeColor: 'brand_cyan',
    markerColor: 'brand_violet',
    highlightColor: 'warm_cyan',
    labelDensity: 'medium',
    avoidRules: ['Avoid cluttered tourist-map detail.', 'Keep route labels short.'],
    qaChecks: ['Route remains visible.', 'Pins do not cover the speaker.'],
  },
  {
    id: 'real_estate_neighborhood_map',
    label: 'Real estate neighborhood map',
    description: 'Neighborhood context for property, nearby areas, and local amenities.',
    bestUseCases: ['real estate neighborhood', 'property location', 'nearby amenities'],
    colorPalette: ['clean_white', 'luxury_blue', 'soft_cyan'],
    routeColor: 'luxury_blue',
    markerColor: 'brand_blue',
    highlightColor: 'soft_cyan',
    labelDensity: 'medium',
    avoidRules: ['Avoid traffic-like clutter.', 'Do not invent amenities.'],
    qaChecks: ['Neighborhood labels are clear.', 'Property context remains source-safe.'],
  },
  {
    id: 'business_location_map',
    label: 'Business location map',
    description: 'Clean location map for business, SaaS, operations, and market geography.',
    bestUseCases: ['business footprint', 'market coverage', 'office/location context'],
    colorPalette: ['brand_blue', 'slate', 'brand_cyan'],
    routeColor: 'brand_blue',
    markerColor: 'brand_cyan',
    highlightColor: 'brand_violet',
    labelDensity: 'low',
    avoidRules: ['Avoid decorative map noise.', 'Keep brand color use restrained.'],
    qaChecks: ['Business labels stay exact.', 'Brand colors remain readable.'],
  },
  {
    id: 'luxury_property_map',
    label: 'Luxury property map',
    description: 'Premium property map style with calm contrast and polished spacing.',
    bestUseCases: ['luxury property', 'premium real estate', 'destination property'],
    colorPalette: ['soft_white', 'luxury_blue', 'muted_gold'],
    routeColor: 'luxury_blue',
    markerColor: 'muted_gold',
    highlightColor: 'soft_cyan',
    labelDensity: 'medium',
    avoidRules: ['Avoid loud social styling.', 'Avoid over-dense labels.'],
    qaChecks: ['Map feels premium and calm.', 'Labels remain inspection-friendly.'],
  },
  {
    id: 'dark_cinematic_map',
    label: 'Dark cinematic map',
    description: 'Darker story map for cinematic but non-documentary moments.',
    bestUseCases: ['cinematic route', 'dramatic fictional movement', 'stylized story geography'],
    colorPalette: ['dark_slate', 'brand_cyan', 'brand_violet'],
    routeColor: 'brand_cyan',
    markerColor: 'brand_violet',
    highlightColor: 'brand_blue',
    labelDensity: 'low',
    avoidRules: ['Avoid documentary certainty exaggeration.', 'Do not reduce label readability.'],
    qaChecks: ['Contrast stays readable.', 'Captions remain above map layers.'],
  },
  {
    id: 'high_contrast_simple_map',
    label: 'High contrast simple map',
    description: 'Minimal high-readability map style for fast explanations.',
    bestUseCases: ['education', 'simple location pin', 'high-readability route card'],
    colorPalette: ['white', 'brand_blue', 'brand_cyan'],
    routeColor: 'brand_blue',
    markerColor: 'brand_cyan',
    highlightColor: 'brand_violet',
    labelDensity: 'low',
    avoidRules: ['Avoid low-contrast map tiles.', 'Avoid decorative terrain.'],
    qaChecks: ['Labels pass small-screen readability.', 'Route/pin contrast is strong.'],
  },
  {
    id: 'custom',
    label: 'Custom map',
    description: 'User-directed map style mapped to a safe known preset plus custom notes.',
    bestUseCases: ['user-defined map look'],
    colorPalette: ['brand_blue', 'brand_cyan', 'brand_violet'],
    routeColor: 'brand_cyan',
    markerColor: 'brand_blue',
    highlightColor: 'brand_violet',
    labelDensity: 'medium',
    avoidRules: ['Custom style must not reduce geography or label clarity.'],
    qaChecks: ['Custom style preserves safe wording and readability.'],
  },
]

export const mapAnimationPresets: MapVisualPreset[] = [
  {
    id: 'location_pin',
    label: 'Location pin',
    defaultAnimationType: 'pin_drop',
    preferredLayoutModes: ['lower_visual_panel', 'voiceover_visual_takeover'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Simple static or pin-drop map.', pro: 'Pin with light camera motion.', premium: 'Pin with richer style and QA.' },
    fallback: ['Use a static location card.', 'Use an approximate region highlight if exact location is unknown.'],
    qaChecks: ['Pin source confidence is stated.', 'Label does not collide with captions.'],
  },
  {
    id: 'route_reveal',
    label: 'Route reveal',
    defaultAnimationType: 'route_draw',
    preferredLayoutModes: ['full_map_takeover', 'side_by_side_speaker_visual', 'lower_visual_panel'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use simple fit-bounds route.', pro: 'Use route draw and moderate camera motion.', premium: 'Use richer multi-beat route sequence.' },
    fallback: ['Use static route card.', 'Use lower panel if full map is too dense.'],
    qaChecks: ['Route line is visible.', 'Route does not imply unverified exact travel.'],
  },
  {
    id: 'multi_location_sequence',
    label: 'Multi-location sequence',
    defaultAnimationType: 'multi_stop_sequence',
    preferredLayoutModes: ['full_map_takeover', 'side_by_side_speaker_visual'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use two simple locations max.', pro: 'Use ordered pins and camera moves.', premium: 'Use sequence timing and stronger QA.' },
    fallback: ['Use timeline cards.', 'Use region highlights.'],
    qaChecks: ['Location order is clear.', 'Labels remain legible.'],
  },
  {
    id: 'region_highlight',
    label: 'Region highlight',
    defaultAnimationType: 'region_pulse',
    preferredLayoutModes: ['full_map_takeover', 'voiceover_visual_takeover', 'lower_visual_panel'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use static approximate region.', pro: 'Use subtle region pulse.', premium: 'Use source-aware evidence map styling.' },
    fallback: ['Use text location card.', 'Avoid exact pin.'],
    qaChecks: ['Approximate wording is visible.', 'Highlight does not overstate certainty.'],
  },
  {
    id: 'real_estate_neighborhood',
    label: 'Real estate neighborhood',
    defaultAnimationType: 'fit_bounds',
    preferredLayoutModes: ['full_map_takeover', 'side_by_side_speaker_visual'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Simple neighborhood card.', pro: 'Neighborhood context with pins.', premium: 'Premium property context and styling.' },
    fallback: ['Use static neighborhood card.', 'Use property/location title card.'],
    qaChecks: ['No invented amenities.', 'Property context stays source-safe.'],
  },
  {
    id: 'travel_route',
    label: 'Travel route',
    defaultAnimationType: 'route_draw',
    preferredLayoutModes: ['full_map_takeover', 'picture_in_picture_speaker', 'lower_visual_panel'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Simple pin or route card.', pro: 'Route reveal with PIP or full map.', premium: 'Richer story route sequence. ' },
    fallback: ['Use static travel card.', 'Use simple pins.'],
    qaChecks: ['Route remains readable.', 'Map supports story pacing.'],
  },
  {
    id: 'documentary_case_map',
    label: 'Documentary case map',
    defaultAnimationType: 'region_pulse',
    preferredLayoutModes: ['full_map_takeover', 'full_evidence_board'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Neutral location card.', pro: 'Muted source-aware map.', premium: 'Evidence sequence with stronger QA.' },
    fallback: ['Use approximate region card.', 'Use evidence board without exact pin.'],
    qaChecks: ['Location claims are source-aware.', 'Alleged locations use safe wording.'],
  },
  {
    id: 'evidence_location_map',
    label: 'Evidence location map',
    defaultAnimationType: 'static_hold',
    preferredLayoutModes: ['full_evidence_board', 'full_map_takeover'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use simple evidence card.', pro: 'Controlled evidence map.', premium: 'Documentary sequence with QA. ' },
    fallback: ['Use neutral text card.', 'Use broad region highlight.'],
    qaChecks: ['Evidence wording stays neutral.', 'No fake exact pin.'],
  },
  {
    id: 'money_movement_map',
    label: 'Money movement map',
    defaultAnimationType: 'multi_stop_sequence',
    preferredLayoutModes: ['full_graphic_explainer', 'full_map_takeover'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use simple money/location card.', pro: 'Map plus controlled flow.', premium: 'Sequence with evidence style and QA.' },
    fallback: ['Use D3 money-flow diagram.', 'Use timeline/evidence board.'],
    qaChecks: ['Do not imply verified money movement without source.', 'Labels remain exact.'],
  },
  {
    id: 'map_behind_subject',
    label: 'Map behind subject',
    defaultAnimationType: 'static_hold',
    preferredLayoutModes: ['speaker_cutout_overlay', 'side_by_side_speaker_visual', 'lower_visual_panel'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Prefer lower panel fallback.', pro: 'Plan low/medium risk overlay with fallback.', premium: 'Plan stronger depth-aware overlay.' },
    fallback: ['Use lower visual panel.', 'Use side-by-side map.'],
    qaChecks: ['Foreground mask risk is checked.', 'Labels avoid subject zone.'],
  },
  {
    id: 'map_behind_subject_and_contact_object',
    label: 'Map behind subject and contact object',
    defaultAnimationType: 'static_hold',
    preferredLayoutModes: ['speaker_cutout_overlay', 'side_by_side_speaker_visual', 'lower_visual_panel'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use safer fallback.', pro: 'Plan only with fallback and contact object notes.', premium: 'Plan foreground/contact-object preservation.' },
    fallback: ['Use side-by-side map.', 'Use lower visual panel if mask risk is high.'],
    qaChecks: ['Contact object stays in foreground group.', 'Captions stay above map and masks.'],
  },
  {
    id: 'lower_panel_map',
    label: 'Lower panel map',
    defaultAnimationType: 'pin_drop',
    preferredLayoutModes: ['lower_visual_panel', 'vertical_speaker_top_visual_bottom'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Default simple map layout.', pro: 'Add light route/pin motion.', premium: 'Use if safer than depth overlay.' },
    fallback: ['Use static location card.'],
    qaChecks: ['Panel does not cover face/captions.', 'Labels are large enough.'],
  },
  {
    id: 'full_map_takeover',
    label: 'Full map takeover',
    defaultAnimationType: 'fly_to',
    preferredLayoutModes: ['full_map_takeover', 'voiceover_visual_takeover'],
    preferredTools: ['maplibre', 'turf', 'remotion'],
    tierBehavior: { basic: 'Use short static/fly-to moment.', pro: 'Use controlled camera move.', premium: 'Use richer route/region sequence.' },
    fallback: ['Use side-by-side or lower panel.'],
    qaChecks: ['Captions remain above map.', 'Map style matches category.'],
  },
]

export function getMapStylePreset(styleFamily: MapStyleFamily) {
  return mapStylePresets.find((preset) => preset.id === styleFamily) ?? mapStylePresets[0]
}

export function getMapVisualPreset(mapVisualType: MapVisualType) {
  return mapAnimationPresets.find((preset) => preset.id === mapVisualType) ?? mapAnimationPresets[0]
}

export function getDefaultMapStyleForCategory(params: {
  editingCategory: EditingCategory
  customInstructions?: string
  editLevel?: EditLevel
}): MapStyleFamily {
  const text = params.customInstructions?.toLowerCase() ?? ''

  if (/real estate|property|neighborhood|listing/.test(text)) return params.editLevel === 'premium' ? 'luxury_property_map' : 'real_estate_neighborhood_map'
  if (/documentary|case|scam|fraud|investigation|evidence/.test(text) || params.editingCategory === 'documentary_case_study') return 'documentary_evidence_map'
  if (/travel|trip|route|city|country/.test(text) || params.editingCategory === 'lifestyle') return 'warm_lifestyle_travel_map'
  if (params.editingCategory === 'business_brand') return 'business_location_map'
  if (params.editingCategory === 'education_explainer') return 'high_contrast_simple_map'
  if (params.editingCategory === 'storytelling') return 'muted_case_study_map'
  return 'clean_social_map'
}

export function getDefaultMapLayoutForAspectRatio(params: {
  aspectRatio: AspectRatio
  mapVisualType?: MapVisualType
  editLevel?: EditLevel
}): {
  layoutMode: SpeakerVisualLayoutMode
  frameTemplateType: FrameTemplateType
} {
  const depthMap = params.mapVisualType === 'map_behind_subject' || params.mapVisualType === 'map_behind_subject_and_contact_object'

  if (depthMap && params.editLevel !== 'basic') {
    return {
      layoutMode: params.aspectRatio === '16:9' ? 'side_by_side_speaker_visual' : 'lower_visual_panel',
      frameTemplateType: params.aspectRatio === '16:9' ? 'youtube_side_panel' : 'vertical_talking_head_lower_panel',
    }
  }

  if (params.aspectRatio === '16:9') {
    return {
      layoutMode: params.mapVisualType === 'location_pin' ? 'side_by_side_speaker_visual' : 'full_map_takeover',
      frameTemplateType: 'youtube_side_panel',
    }
  }

  if (params.aspectRatio === '1:1') {
    return {
      layoutMode: 'full_map_takeover',
      frameTemplateType: 'square_center_panel',
    }
  }

  return {
    layoutMode: params.editLevel === 'basic' ? 'lower_visual_panel' : 'full_map_takeover',
    frameTemplateType: params.editLevel === 'basic' ? 'vertical_talking_head_lower_panel' : 'vertical_full_panel',
  }
}
