import type {
  FrameTimeRange,
  MasterTimingPlan,
  VisualAssetPlanItem,
  VisualCueTimingItem,
  VisualCueTriggerType,
  VisualCueType,
  VisualTimingItem,
} from '../types/reeditpro'
import { createFrameTimeRangeFromFrames, getMinimumReadFrames } from './timing-utils'

export const visualCueTimingRules = [
  'Visual cues trigger from speech meaning before beat support.',
  'Text-heavy visuals need longer hold time and simpler labels.',
  'Lower panels need extra read time and lower label density.',
  'Full takeovers should enter after a phrase boundary or planned anticipation lead-in.',
  'SFX must attach to a planned visual or transition cue.',
]

export function getVisualCueTypeForAsset(params: { asset?: VisualAssetPlanItem; label?: string }): VisualCueType {
  const assetType = params.asset?.assetType
  const label = `${params.asset?.beatLabel ?? params.label ?? ''}`.toLowerCase()

  if (label.includes('map') || label.includes('location')) return 'map_pin_drop'
  if (label.includes('route')) return 'map_route_start'
  if (label.includes('chart') || label.includes('graph') || label.includes('metric')) return 'chart_start'
  if (label.includes('browser') || label.includes('screen') || label.includes('dashboard')) return 'browser_zoom_start'
  if (assetType === 'name_card') return 'name_card_reveal'
  if (assetType === 'fact_card') return 'fact_card_reveal'
  if (assetType === 'timeline_card' || label.includes('evidence')) return 'evidence_card_reveal'
  if (assetType === 'animated_scene') return 'stroke_motion_start'
  if (assetType === 'real_motion_scene') return 'ai_video_panel_start'
  if (assetType === 'transition_scene') return 'transition_in'

  return assetType ? 'card_reveal' : 'custom'
}

export function getVisualCueTriggerType(params: {
  cueType: VisualCueType
  masterTimingPlan?: MasterTimingPlan
  prefersBeat?: boolean
}): VisualCueTriggerType {
  if (params.cueType === 'transition_in' || params.cueType === 'transition_out') return 'transition_boundary'
  if (params.cueType === 'map_pin_drop' || params.cueType === 'browser_zoom_start' || params.cueType === 'chart_start') return 'keyword_spoken'
  if (params.cueType === 'stroke_motion_start' || params.cueType === 'stroke_motion_emphasis') return 'visual_action'
  if (params.prefersBeat && (params.masterTimingPlan?.beatGridPlan.beatItems.length ?? 0) > 0) return 'beat'

  return 'speech_phrase_start'
}

export function estimateVisualReadTimeFrames(params: {
  label: string
  cueType: VisualCueType
  layoutMode?: string
  fps: number
}) {
  const base = getMinimumReadFrames(params.label, params.fps)
  const lowerPanelBoost = params.layoutMode === 'lower_visual_panel' ? Math.round(params.fps * 0.5) : 0
  const textHeavyBoost = ['evidence_card_reveal', 'chart_start', 'chart_step_reveal', 'browser_zoom_start'].includes(params.cueType)
    ? Math.round(params.fps * 0.75)
    : 0

  return Math.max(base, Math.round(params.fps * 1.2)) + lowerPanelBoost + textHeavyBoost
}

export function getFallbackCueTiming(params: {
  timeRange: FrameTimeRange
  totalFrames: number
  fps: number
}) {
  const delayFrames = Math.round(params.fps * 0.35)
  const startFrame = Math.min(params.timeRange.startFrame + delayFrames, params.totalFrames)
  const endFrame = Math.min(Math.max(startFrame + params.timeRange.durationFrames, params.timeRange.endFrame + delayFrames), params.totalFrames)

  return createFrameTimeRangeFromFrames(startFrame, endFrame, params.fps)
}

export function createVisualCueFromMasterTiming(params: {
  visualTimingItem: VisualTimingItem
  asset?: VisualAssetPlanItem
  masterTimingPlan: MasterTimingPlan
  linkedCaptionTimingItemId?: string
  linkedTranscriptLineId?: string
  linkedSoundSyncCueId?: string
}): VisualCueTimingItem {
  const cueType = getVisualCueTypeForAsset({ asset: params.asset, label: params.visualTimingItem.label })
  const triggerType = getVisualCueTriggerType({
    cueType,
    masterTimingPlan: params.masterTimingPlan,
    prefersBeat: params.asset?.actionIntensity === 'high' || params.asset?.actionIntensity === 'extreme',
  })
  const visualReadTimeFrames = estimateVisualReadTimeFrames({
    cueType,
    fps: params.visualTimingItem.timeRange.fps,
    label: params.visualTimingItem.label,
    layoutMode: params.asset?.layoutMode,
  })
  const fallbackTiming = params.visualTimingItem.holdFrames < visualReadTimeFrames
    ? getFallbackCueTiming({
        fps: params.visualTimingItem.timeRange.fps,
        timeRange: params.visualTimingItem.timeRange,
        totalFrames: params.masterTimingPlan.timingBase.totalFrames,
      })
    : undefined

  return {
    id: `caption-visual-cue-${params.visualTimingItem.id}`,
    cueType,
    triggerType,
    status: triggerType === 'beat' && params.masterTimingPlan.beatGridPlan.status === 'needs_audio_analysis'
      ? 'needs_audio_analysis'
      : params.masterTimingPlan.transcriptTimingPlan.status === 'needs_transcript_alignment'
        ? 'needs_transcript_alignment'
        : 'synced',
    label: params.visualTimingItem.label,
    timeRange: params.visualTimingItem.timeRange,
    linkedMasterVisualTimingItemId: params.visualTimingItem.id,
    linkedSegmentId: params.visualTimingItem.linkedSegmentId,
    linkedVisualAssetPlanItemId: params.visualTimingItem.linkedVisualAssetPlanItemId,
    linkedCaptionTimingItemId: params.linkedCaptionTimingItemId,
    linkedTranscriptLineId: params.linkedTranscriptLineId,
    linkedBeatId: triggerType === 'beat' ? params.masterTimingPlan.beatGridPlan.beatItems[0]?.id : undefined,
    linkedSoundSyncCueId: params.linkedSoundSyncCueId,
    visualReadTimeFrames,
    revealFrames: params.visualTimingItem.revealFrames,
    holdFrames: params.visualTimingItem.holdFrames,
    exitFrames: params.visualTimingItem.exitFrames,
    safeZoneNotes: [
      'Respect caption safe zone and avoid face/product/map/chart/browser focus areas.',
      params.asset?.layoutMode === 'lower_visual_panel'
        ? 'Lower panel cue needs lower label density and extra read time.'
        : 'Visual cue can use the planned visual zone.',
    ],
    reason: `${params.visualTimingItem.reason} Trigger uses ${triggerType.replaceAll('_', ' ')} so the cue appears when the viewer needs it.`,
    fallbackTiming,
    qaChecks: [
      'Visual cue is tied to speech meaning, planned action, or acceptable beat support.',
      'Visual hold is checked against read-time requirements.',
      'Cue timing must not force captions or cuts through important speech.',
    ],
  }
}
