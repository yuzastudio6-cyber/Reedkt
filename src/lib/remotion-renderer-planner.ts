import type {
  AspectRatio,
  EditLevel,
  FrameLayoutPlan,
  LayerFitMode,
  RectZone,
  RendererCompositionPlan,
  RendererLayerPlan,
  RendererLayerType,
  TargetPlatform,
  VisualAssetPlanItem,
  VisualAssetType,
} from '../types/reeditpro'

type CreateRendererCompositionPlanParams = {
  visualAssetPlan: VisualAssetPlanItem[]
  frameTemplate: FrameLayoutPlan
  aspectRatio: AspectRatio
  targetPlatform: TargetPlatform
  editLevel: EditLevel
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

export function buildRendererNotes(asset: VisualAssetPlanItem, frameTemplate: FrameLayoutPlan) {
  const notes = [
    'Remotion places this asset inside the approved frame template.',
    'AI models generate assets/clips only; they do not own the final canvas.',
  ]

  if (asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene') {
    notes.push(`AI clip is generated on matching panel background ${frameTemplate.panelBackgroundColor}.`)
  }

  if (asset.assetType === 'motion_design_scene' || asset.assetType === 'graphic_design_frame') {
    notes.push('Graphic Design / VisualExplain motion stays controlled by ReeditPro.')
  }

  return notes
}

function layerZoneForAsset(asset: VisualAssetPlanItem, frameTemplate: FrameLayoutPlan): RectZone {
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

  if (layerType === 'transition') {
    return 100
  }

  return 50
}

function sourceLayer(frameTemplate: FrameLayoutPlan, totalDuration: number): RendererLayerPlan {
  const zone = frameTemplate.speakerZone ?? {
    x: 0,
    y: 0,
    width: frameTemplate.canvasWidth,
    height: frameTemplate.canvasHeight,
    label: 'Source video zone',
    notes: 'Source footage may act as background or primary footage for full-panel layouts.',
  }
  const layerType: RendererLayerType = frameTemplate.templateType === 'vertical_talking_head_lower_panel' || frameTemplate.speakerZone ? 'speaker_video' : 'source_video'

  return {
    id: 'renderer-layer-source-video',
    layerType,
    label: layerType === 'speaker_video' ? 'Speaker/source video' : 'Source video base',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer(layerType),
    zone,
    fitMode: fitModeForLayer(layerType),
    notes: ['User/source footage remains under ReeditPro layout control.'],
  }
}

function backgroundPanelLayer(frameTemplate: FrameLayoutPlan, totalDuration: number): RendererLayerPlan {
  return {
    id: 'renderer-layer-background-panel',
    layerType: 'background_panel',
    label: 'Matching AI visual panel background',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer('background_panel'),
    zone: frameTemplate.animationZone,
    fitMode: 'fill',
    backgroundColor: frameTemplate.panelBackgroundColor,
    notes: ['Panel color matches the default AI video generation background.'],
  }
}

function captionLayer(frameTemplate: FrameLayoutPlan, totalDuration: number): RendererLayerPlan | undefined {
  if (!frameTemplate.captionSafeZone) {
    return undefined
  }

  return {
    id: 'renderer-layer-captions',
    layerType: 'caption',
    label: 'Caption safe zone',
    startTimeSeconds: 0,
    endTimeSeconds: totalDuration,
    zIndex: zIndexForLayer('caption'),
    zone: frameTemplate.captionSafeZone,
    fitMode: 'safe_contain',
    notes: ['Captions stay inside ReeditPro safe zones and avoid faces/panel text.'],
  }
}

function visualLayer(asset: VisualAssetPlanItem, frameTemplate: FrameLayoutPlan, startTimeSeconds: number): RendererLayerPlan {
  const layerType = getLayerTypeForAssetType(asset.assetType)
  const duration = getDisplayDurationForAsset(asset)

  return {
    id: `renderer-layer-${asset.id}`,
    assetPlanItemId: asset.id,
    layerType,
    label: asset.beatLabel,
    startTimeSeconds,
    endTimeSeconds: startTimeSeconds + duration,
    zIndex: zIndexForLayer(layerType),
    zone: layerZoneForAsset(asset, frameTemplate),
    fitMode: fitModeForLayer(layerType),
    backgroundColor: layerType === 'ai_video_panel' ? frameTemplate.panelBackgroundColor : undefined,
    motionPreset: getMotionPresetForAsset(asset),
    notes: buildRendererNotes(asset, frameTemplate),
  }
}

export function createRendererCompositionPlan({
  visualAssetPlan,
  frameTemplate,
  aspectRatio,
  targetPlatform,
  editLevel,
}: CreateRendererCompositionPlanParams): RendererCompositionPlan {
  const visualLayers: RendererLayerPlan[] = []
  let cursor = 0

  visualAssetPlan.forEach((asset) => {
    const layer = visualLayer(asset, frameTemplate, cursor)
    visualLayers.push(layer)
    cursor = layer.endTimeSeconds
  })

  const durationSeconds = Math.max(cursor, 3)
  const caption = captionLayer(frameTemplate, durationSeconds)
  const layers = [
    sourceLayer(frameTemplate, durationSeconds),
    backgroundPanelLayer(frameTemplate, durationSeconds),
    ...visualLayers,
    ...(caption ? [caption] : []),
  ].sort((a, b) => a.zIndex - b.zIndex)

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
      'Do not render before plan and credit estimate approval.',
      `Planning context: ${targetPlatform}, ${aspectRatio}, ${editLevel}.`,
    ],
    approvalRequired: true,
    renderReady: false,
  }
}
