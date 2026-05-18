import type {
  RemotionCapability,
  RemotionCapabilityId,
  RenderStrategyType,
  SpeakerVisualLayoutMode,
  ToolInputType,
  VisualAssetType,
} from '../types/reeditpro'

const allAssetTypes: VisualAssetType[] = [
  'animated_scene',
  'still_scene',
  'fact_card',
  'name_card',
  'character_card',
  'list_card',
  'timeline_card',
  'graphic_design_frame',
  'motion_design_scene',
  'real_motion_scene',
  'still_with_editor_motion',
  'transition_scene',
]

const cardAssetTypes: VisualAssetType[] = [
  'fact_card',
  'name_card',
  'character_card',
  'list_card',
  'timeline_card',
  'graphic_design_frame',
]

const allLayoutModes: SpeakerVisualLayoutMode[] = [
  'full_speaker',
  'voiceover_visual_takeover',
  'picture_in_picture_speaker',
  'side_by_side_speaker_visual',
  'vertical_speaker_top_visual_bottom',
  'vertical_visual_top_speaker_bottom',
  'lower_visual_panel',
  'full_graphic_explainer',
  'full_stroke_motion_scene',
  'full_map_takeover',
  'full_evidence_board',
  'screen_capture_with_speaker_pip',
  'speaker_cutout_overlay',
  'b_roll_cutaway',
  'split_screen_comparison',
  'before_after_panel',
  'object_anchored_callout',
]

const visualTakeoverLayouts: SpeakerVisualLayoutMode[] = [
  'voiceover_visual_takeover',
  'full_graphic_explainer',
  'full_stroke_motion_scene',
  'full_map_takeover',
  'full_evidence_board',
  'screen_capture_with_speaker_pip',
]

type CapabilityInput = Omit<RemotionCapability, 'tierFit' | 'requiredInputs' | 'outputType' | 'compatibleAssetTypes' | 'compatibleLayouts' | 'defaultMotionPresets'> & {
  requiredInputs?: ToolInputType[]
  compatibleAssetTypes?: VisualAssetType[]
  compatibleLayouts?: SpeakerVisualLayoutMode[]
  defaultMotionPresets?: string[]
  tierFit?: RemotionCapability['tierFit']
  outputType?: RemotionCapability['outputType']
}

function capability(input: CapabilityInput): RemotionCapability {
  return {
    requiredInputs: input.requiredInputs ?? ['frame_layout'],
    outputType: input.outputType ?? 'renderer_layer',
    compatibleAssetTypes: input.compatibleAssetTypes ?? allAssetTypes,
    compatibleLayouts: input.compatibleLayouts ?? allLayoutModes,
    defaultMotionPresets: input.defaultMotionPresets ?? ['hold'],
    tierFit: input.tierFit ?? { basic: true, pro: true, premium: true },
    ...input,
  }
}

export const remotionCapabilities: RemotionCapability[] = [
  capability({
    id: 'caption_layer',
    label: 'Caption layer',
    description: 'Places readable captions inside approved safe zones above visual and depth layers.',
    bestFor: ['captions', 'safe text', 'keyword emphasis'],
    avoidFor: ['transcript generation', 'audio analysis'],
    defaultMotionPresets: ['caption_pop', 'keyword_highlight'],
    qaChecks: ['Captions avoid faces, visual text, and foreground masks.', 'Captions stay above graphics and masks.'],
  }),
  capability({
    id: 'lower_third',
    label: 'Lower third',
    description: 'Builds controlled lower thirds, labels, and identity strips.',
    bestFor: ['speaker labels', 'source labels', 'simple context cards'],
    avoidFor: ['dense evidence boards'],
    compatibleAssetTypes: ['name_card', 'fact_card', 'graphic_design_frame'],
    defaultMotionPresets: ['lower_third_slide'],
    qaChecks: ['Lower third does not cover mouth, hands, product, or captions.'],
  }),
  capability({
    id: 'title_card',
    label: 'Title card',
    description: 'Creates exact title cards with controlled typography and timing.',
    bestFor: ['section openings', 'chapter cards', 'CTA cards'],
    avoidFor: ['organic story animation'],
    compatibleAssetTypes: cardAssetTypes,
    defaultMotionPresets: ['card_pop', 'fade_in'],
    qaChecks: ['Title text is exact, readable, and not overanimated.'],
  }),
  capability({
    id: 'fact_card',
    label: 'Fact card',
    description: 'Creates controlled factual cards with neutral claim treatment.',
    bestFor: ['documentary facts', 'source notes', 'proof cards'],
    avoidFor: ['unverified allegations framed as proven facts'],
    compatibleAssetTypes: ['fact_card', 'graphic_design_frame'],
    defaultMotionPresets: ['card_slide_in'],
    qaChecks: ['Claim wording remains neutral and source status is clear.'],
  }),
  capability({
    id: 'name_card',
    label: 'Name card',
    description: 'Creates exact person, organization, or source name cards.',
    bestFor: ['neutral real-person treatment', 'documentary identifiers'],
    avoidFor: ['likeness generation'],
    compatibleAssetTypes: ['name_card', 'character_card'],
    defaultMotionPresets: ['lower_third_slide'],
    qaChecks: ['Names are exact and do not imply guilt or verified status.'],
  }),
  capability({
    id: 'list_card',
    label: 'List card',
    description: 'Builds exact bullet/list cards with controlled hierarchy.',
    bestFor: ['steps', 'feature lists', 'summary cards'],
    avoidFor: ['dense paragraphs'],
    compatibleAssetTypes: ['list_card', 'graphic_design_frame'],
    defaultMotionPresets: ['staggered_list'],
    qaChecks: ['List text fits and remains readable on target aspect ratio.'],
  }),
  capability({
    id: 'timeline_card',
    label: 'Timeline card',
    description: 'Builds timeline cards with exact dates, stages, or chronology.',
    bestFor: ['case timelines', 'process timelines', 'before/after order'],
    avoidFor: ['organic movement scenes'],
    compatibleAssetTypes: ['timeline_card', 'graphic_design_frame'],
    defaultMotionPresets: ['timeline_reveal'],
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Timeline order and labels match approved plan.'],
  }),
  capability({
    id: 'evidence_board',
    label: 'Evidence board',
    description: 'Composes controlled evidence-board layouts from approved assets and labels.',
    bestFor: ['documentary proof boards', 'case-study evidence', 'neutral source boards'],
    avoidFor: ['unsupported allegations', 'busy visual clutter'],
    compatibleAssetTypes: ['fact_card', 'timeline_card', 'graphic_design_frame'],
    compatibleLayouts: ['full_evidence_board', 'voiceover_visual_takeover', 'side_by_side_speaker_visual'],
    defaultMotionPresets: ['evidence_pin_reveal'],
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Evidence board stays neutral and readable.', 'Basic uses simpler evidence-board density.'],
  }),
  capability({
    id: 'graphic_panel',
    label: 'Graphic panel',
    description: 'Places visual explainers, cards, and controlled graphic frames in approved panel zones.',
    bestFor: ['visual explainers', 'product panels', 'card overlays'],
    avoidFor: ['realistic generated video'],
    compatibleAssetTypes: ['graphic_design_frame', 'motion_design_scene', ...cardAssetTypes],
    compatibleLayouts: ['lower_visual_panel', 'side_by_side_speaker_visual', 'voiceover_visual_takeover', 'full_graphic_explainer'],
    defaultMotionPresets: ['card_slide_in', 'highlight'],
    qaChecks: ['Graphic panel preserves speaker and caption safe zones.'],
  }),
  capability({
    id: 'motion_design',
    label: 'Motion design',
    description: 'Animates controlled text, shapes, arrows, panels, highlights, and still assets.',
    bestFor: ['controlled explainers', 'simple motion graphics', 'editor motion'],
    avoidFor: ['organic character acting'],
    compatibleAssetTypes: ['motion_design_scene', 'graphic_design_frame', 'still_with_editor_motion', 'transition_scene'],
    defaultMotionPresets: ['diagram_build', 'highlight', 'slide_in'],
    qaChecks: ['Motion supports the spoken meaning and avoids random transitions.'],
  }),
  capability({
    id: 'diagram_build',
    label: 'Diagram build',
    description: 'Builds controlled diagrams from shapes, labels, lines, and tool outputs.',
    bestFor: ['money flows', 'process diagrams', 'education explainers'],
    avoidFor: ['photorealistic scenes'],
    compatibleAssetTypes: ['motion_design_scene', 'graphic_design_frame'],
    compatibleLayouts: visualTakeoverLayouts,
    defaultMotionPresets: ['diagram_build'],
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Exact labels and arrows remain controlled, not AI-video generated.'],
  }),
  capability({
    id: 'arrow_flow',
    label: 'Arrow flow',
    description: 'Animates controlled arrows and directional flows.',
    bestFor: ['money trails', 'routes', 'process steps'],
    avoidFor: ['random decorative arrows'],
    compatibleAssetTypes: ['motion_design_scene', 'graphic_design_frame', 'timeline_card'],
    defaultMotionPresets: ['arrow_flow'],
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Arrows point to approved labels and do not imply unsupported facts.'],
  }),
  capability({
    id: 'number_countup',
    label: 'Number countup',
    description: 'Animates controlled numbers, amounts, scores, or metric reveals.',
    bestFor: ['business metrics', 'case amounts', 'education examples'],
    avoidFor: ['unverified money amounts'],
    compatibleAssetTypes: ['fact_card', 'graphic_design_frame', 'motion_design_scene'],
    defaultMotionPresets: ['number_countup'],
    qaChecks: ['Numbers match approved claim/source status.'],
  }),
  capability({
    id: 'still_image_motion',
    label: 'Still image motion',
    description: 'Applies pan, zoom, parallax, or hold motion to still assets.',
    bestFor: ['still scenes', 'keyframes', 'editor motion'],
    avoidFor: ['motion that requires generated action'],
    compatibleAssetTypes: ['still_scene', 'still_with_editor_motion', 'character_card', 'fact_card'],
    defaultMotionPresets: ['slow_zoom', 'parallax_push', 'hold'],
    qaChecks: ['Still motion stays within safe margins and does not crop key content.'],
  }),
  capability({
    id: 'split_screen',
    label: 'Split screen',
    description: 'Creates controlled split-screen or comparison layouts.',
    bestFor: ['before/after', 'comparison', 'two sources'],
    avoidFor: ['crowding vertical mobile frames'],
    compatibleLayouts: ['split_screen_comparison', 'before_after_panel', 'side_by_side_speaker_visual'],
    defaultMotionPresets: ['split_reveal'],
    qaChecks: ['Both sides remain readable and aligned to the approved story point.'],
  }),
  capability({
    id: 'picture_in_picture',
    label: 'Picture-in-picture',
    description: 'Keeps the speaker or source footage visible while a visual takes the main frame.',
    bestFor: ['speaker trust during visual explanations', 'screen captures with speaker'],
    avoidFor: ['tiny faces or crowded captions'],
    compatibleLayouts: ['picture_in_picture_speaker', 'screen_capture_with_speaker_pip'],
    defaultMotionPresets: ['pip_hold', 'pip_slide'],
    qaChecks: ['PIP avoids captions, faces, and important visual labels.'],
  }),
  capability({
    id: 'side_by_side_layout',
    label: 'Side-by-side layout',
    description: 'Splits speaker/source and visual content into controlled side zones.',
    bestFor: ['balanced speaker plus visual explanation', 'desktop/youtube layouts'],
    avoidFor: ['dense vertical mobile layouts'],
    compatibleLayouts: ['side_by_side_speaker_visual', 'split_screen_comparison'],
    defaultMotionPresets: ['side_panel_reveal'],
    qaChecks: ['Both sides have enough room for readable content.'],
  }),
  capability({
    id: 'lower_visual_panel',
    label: 'Lower visual panel',
    description: 'Places compact visuals below or near the speaker/source footage.',
    bestFor: ['Basic-safe visual support', 'short-form talking-head overlays'],
    avoidFor: ['dense charts or full maps'],
    compatibleLayouts: ['lower_visual_panel', 'vertical_speaker_top_visual_bottom'],
    defaultMotionPresets: ['lower_panel_reveal'],
    qaChecks: ['Lower panel does not cover captions or speaker mouth.'],
  }),
  capability({
    id: 'full_visual_takeover_layout',
    label: 'Full visual takeover layout',
    description: 'Lets a graphic, map, chart, evidence board, or AI clip own the frame while voiceover continues.',
    bestFor: ['explanations that need space', 'maps', 'charts', 'evidence boards'],
    avoidFor: ['emotional trust beats where speaker should stay visible'],
    compatibleLayouts: visualTakeoverLayouts,
    defaultMotionPresets: ['takeover_reveal'],
    qaChecks: ['Full takeover preserves caption safe zone and clear hierarchy.'],
  }),
  capability({
    id: 'map_layer_placement',
    label: 'Map layer placement',
    description: 'Places MapLibre/Turf map outputs or map specs into the final frame.',
    bestFor: ['route reveals', 'location context', 'neighborhood maps'],
    avoidFor: ['AI-video-generated fake maps'],
    requiredInputs: ['geojson', 'json_data', 'frame_layout'],
    outputType: 'renderer_layer',
    compatibleAssetTypes: ['graphic_design_frame', 'motion_design_scene'],
    compatibleLayouts: ['full_map_takeover', 'lower_visual_panel', 'side_by_side_speaker_visual', 'voiceover_visual_takeover'],
    defaultMotionPresets: ['map_route_reveal'],
    qaChecks: ['Map labels, pins, and routes remain exact and readable.'],
  }),
  capability({
    id: 'chart_layer_placement',
    label: 'Chart layer placement',
    description: 'Places D3/ECharts chart outputs or specs into the final frame.',
    bestFor: ['exact charts', 'business metrics', 'money-flow diagrams'],
    avoidFor: ['AI-video-generated data visuals'],
    requiredInputs: ['json_data', 'frame_layout'],
    compatibleAssetTypes: ['graphic_design_frame', 'motion_design_scene', 'fact_card'],
    compatibleLayouts: ['full_graphic_explainer', 'lower_visual_panel', 'side_by_side_speaker_visual', 'voiceover_visual_takeover'],
    defaultMotionPresets: ['chart_reveal'],
    qaChecks: ['Chart labels and values remain exact.'],
  }),
  capability({
    id: 'screen_capture_placement',
    label: 'Screen capture placement',
    description: 'Places browser/app/dashboard screenshots or captures prepared by future workers.',
    bestFor: ['SaaS demos', 'website proof', 'dashboard feature callouts'],
    avoidFor: ['hallucinated UI screens'],
    requiredInputs: ['image', 'frame_layout'],
    compatibleAssetTypes: ['graphic_design_frame', 'motion_design_scene', 'still_scene'],
    compatibleLayouts: ['screen_capture_with_speaker_pip', 'voiceover_visual_takeover', 'side_by_side_speaker_visual'],
    defaultMotionPresets: ['screen_pan_zoom', 'callout_highlight'],
    qaChecks: ['Screen capture fits the frame and avoids leaking unapproved content.'],
  }),
  capability({
    id: 'ai_video_panel_placement',
    label: 'AI video panel placement',
    description: 'Places AI video clips inside approved panels with matching backgrounds.',
    bestFor: ['Stroke Motion clips', 'Real Motion clips', 'organic animation assets'],
    avoidFor: ['final canvas generation'],
    requiredInputs: ['ai_video_clip', 'frame_layout'],
    compatibleAssetTypes: ['animated_scene', 'real_motion_scene'],
    compatibleLayouts: ['full_stroke_motion_scene', 'voiceover_visual_takeover', 'lower_visual_panel', 'picture_in_picture_speaker'],
    defaultMotionPresets: ['panel_hold'],
    qaChecks: ['AI video clip stays asset-scoped and uses matching panel background.'],
  }),
  capability({
    id: 'transition_layer',
    label: 'Transition layer',
    description: 'Builds controlled transitions, wipes, reveals, and cross-panel motion.',
    bestFor: ['edit rhythm', 'section changes', 'map/chart reveals'],
    avoidFor: ['random decorative transitions'],
    compatibleAssetTypes: ['transition_scene', 'motion_design_scene'],
    defaultMotionPresets: ['transition_wipe', 'fade'],
    qaChecks: ['Transition supports pacing and does not obscure important text.'],
  }),
  capability({
    id: 'background_panel',
    label: 'Background panel',
    description: 'Creates matching visual panel backgrounds for generated or controlled assets.',
    bestFor: ['AI panel background matching', 'clean card surfaces'],
    avoidFor: ['transparent AI-video assumptions'],
    defaultMotionPresets: ['hold'],
    qaChecks: ['Panel background matches prompt and renderer planning.'],
  }),
  capability({
    id: 'safe_zone_layout',
    label: 'Safe-zone layout',
    description: 'Plans safe margins for speaker, captions, products, and visual text.',
    bestFor: ['caption-safe visuals', 'mobile exports', 'face/product protection'],
    avoidFor: ['ignoring platform UI overlays'],
    defaultMotionPresets: ['hold'],
    qaChecks: ['Safe zones protect captions, faces, products, and platform UI.'],
  }),
  capability({
    id: 'depth_layer_composition',
    label: 'Depth layer composition',
    description: 'Plans future layered composition with overlay, foreground mask, and caption layers.',
    bestFor: ['map/card behind subject', 'contact object preservation', 'premium overlays'],
    avoidFor: ['frontend mask execution', 'Basic complex masks'],
    compatibleLayouts: ['speaker_cutout_overlay', 'object_anchored_callout', 'lower_visual_panel', 'side_by_side_speaker_visual', 'voiceover_visual_takeover'],
    defaultMotionPresets: ['depth_panel_reveal'],
    tierFit: { basic: false, pro: true, premium: true },
    qaChecks: ['Future mask worker required; captions remain above graphics and masks.'],
  }),
]

export function getRemotionCapability(id: RemotionCapabilityId) {
  return remotionCapabilities.find((capabilityItem) => capabilityItem.id === id)
}

export function getCapabilitiesForAssetType(assetType: VisualAssetType) {
  return remotionCapabilities.filter((capabilityItem) => capabilityItem.compatibleAssetTypes.includes(assetType))
}

export function getCapabilitiesForLayout(layoutMode: SpeakerVisualLayoutMode) {
  return remotionCapabilities.filter((capabilityItem) => capabilityItem.compatibleLayouts.includes(layoutMode))
}

export function getDefaultCapabilitiesForStrategy(strategyType: RenderStrategyType): RemotionCapability[] {
  const strategyCapabilityIds: Record<RenderStrategyType, RemotionCapabilityId[]> = {
    ai_video_then_remotion: ['ai_video_panel_placement', 'safe_zone_layout', 'background_panel'],
    gpt_image_then_remotion: ['still_image_motion', 'safe_zone_layout', 'background_panel'],
    hybrid_generation_then_remotion: ['still_image_motion', 'ai_video_panel_placement', 'safe_zone_layout', 'background_panel'],
    none: [],
    open_source_tool_then_remotion: ['graphic_panel', 'safe_zone_layout'],
    qa_tool_only: ['safe_zone_layout'],
    remotion_only: ['motion_design', 'safe_zone_layout', 'background_panel'],
    remotion_then_worker_postprocess: ['safe_zone_layout', 'background_panel'],
    worker_preprocess_then_remotion: ['graphic_panel', 'safe_zone_layout', 'background_panel'],
  }
  const ids = strategyCapabilityIds[strategyType]

  return ids.flatMap((id) => {
    const capabilityItem = getRemotionCapability(id)
    return capabilityItem ? [capabilityItem] : []
  })
}

export function getRemotionCapabilitySummary() {
  const basicCount = remotionCapabilities.filter((capabilityItem) => capabilityItem.tierFit.basic).length
  const proCount = remotionCapabilities.filter((capabilityItem) => capabilityItem.tierFit.pro).length
  const premiumCount = remotionCapabilities.filter((capabilityItem) => capabilityItem.tierFit.premium).length

  return {
    total: remotionCapabilities.length,
    basicCount,
    proCount,
    premiumCount,
    notes: [
      'Remotion owns final canvas, timing, layout, captions, and composition.',
      'Remotion capabilities are planning metadata only; no Remotion package or render is executed here.',
      'Controlled tools and Remotion are preferred for exact charts, maps, labels, captions, and screen captures.',
    ],
  }
}
