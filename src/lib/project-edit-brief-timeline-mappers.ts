import type {
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerType,
  ProjectEditBriefTimelineMarkerModel,
} from '../types/project-edit-brief'

function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(wholeSeconds / 60)
  const remainder = wholeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function getProjectEditBriefMarkerLane(markerType: ProjectEditBriefMarkerType): string {
  if (markerType === 'broll' || markerType === 'keep_emphasize' || markerType === 'do_not_use') return 'visual'
  if (markerType === 'caption_text' || markerType === 'graphic_card_ui') return 'text_graphics'
  if (markerType === 'music_soundtrack' || markerType === 'sfx_sound_design' || markerType === 'voiceover') return 'audio'
  if (markerType === 'cut_remove' || markerType === 'transition' || markerType === 'speed_pacing') return 'timeline'
  if (markerType === 'color_tone') return 'look'
  return 'notes'
}

export function getProjectEditBriefMarkerIconLabel(markerType: ProjectEditBriefMarkerType): string {
  const labels: Record<ProjectEditBriefMarkerType, string> = {
    broll: 'BR',
    cut_remove: 'CUT',
    keep_emphasize: 'KEEP',
    caption_text: 'TXT',
    graphic_card_ui: 'CARD',
    music_soundtrack: 'MUS',
    sfx_sound_design: 'SFX',
    voiceover: 'VO',
    transition: 'TR',
    speed_pacing: 'SPD',
    color_tone: 'CLR',
    do_not_use: 'NO',
    general_note: 'NOTE',
  }
  return labels[markerType]
}

export function getProjectEditBriefMarkerColorToken(
  status: ProjectEditBriefMarkerStatus,
  priority: ProjectEditBriefMarkerPriority = 'should_follow',
): string {
  if (status === 'conflict') return 'edit-brief-marker-danger'
  if (status === 'needs_asset' || status === 'needs_clarification') return 'edit-brief-marker-warning'
  if (status === 'confirmed' || status === 'ready_for_plan' || status === 'applied_to_plan') {
    return priority === 'must_follow' ? 'edit-brief-marker-primary' : 'edit-brief-marker-success'
  }
  if (priority === 'avoid') return 'edit-brief-marker-avoid'
  return 'edit-brief-marker-neutral'
}

export function createProjectEditBriefTimelineMarkerModel(
  marker: ProjectEditBriefMarkerRecord,
): ProjectEditBriefTimelineMarkerModel {
  const timeLabel = marker.timeMode === 'range' && marker.endTimeSeconds !== undefined
    ? `${formatTime(marker.startTimeSeconds)}-${formatTime(marker.endTimeSeconds)}`
    : formatTime(marker.startTimeSeconds)

  return {
    markerId: marker.id,
    markerType: marker.markerType,
    status: marker.status,
    qaStatus: marker.qaStatus,
    priority: marker.priority,
    timeMode: marker.timeMode,
    startTimeSeconds: marker.startTimeSeconds,
    endTimeSeconds: marker.endTimeSeconds,
    label: `${timeLabel} ${marker.title}`,
    iconLabel: getProjectEditBriefMarkerIconLabel(marker.markerType),
    lane: getProjectEditBriefMarkerLane(marker.markerType),
    colorToken: getProjectEditBriefMarkerColorToken(marker.status, marker.priority),
    mockOnly: marker.mockOnly,
  }
}

export function createProjectEditBriefTimelineMarkerModels(
  markers: ProjectEditBriefMarkerRecord[],
): ProjectEditBriefTimelineMarkerModel[] {
  return markers
    .map(createProjectEditBriefTimelineMarkerModel)
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.markerId.localeCompare(b.markerId))
}

export function createProjectEditBriefTimelineSummary(
  markers: ProjectEditBriefTimelineMarkerModel[],
): string {
  const lanes = Array.from(new Set(markers.map((marker) => marker.lane))).sort()
  const conflicts = markers.filter((marker) => marker.status === 'conflict').length
  const ranges = markers.filter((marker) => marker.timeMode === 'range').length
  return `${markers.length} timeline markers across ${lanes.length} lanes; ${ranges} ranges; ${conflicts} conflicts.`
}
