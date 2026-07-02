import type {
  ProjectEditBriefAudioBehavior,
  ProjectEditBriefCaptionBehavior,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefVisualBehavior,
  QwenMarkerChatStructuredResponse,
} from '../../types'

const visualValues: ProjectEditBriefVisualBehavior[] = [
  'replace_visual',
  'overlay_visual',
  'insert_broll',
  'add_graphic_overlay',
  'keep_main_video',
  'remove_section',
  'no_visual_change',
  'unspecified',
]

const audioValues: ProjectEditBriefAudioBehavior[] = [
  'keep_original_audio',
  'duck_original_audio',
  'replace_with_music',
  'add_music_under',
  'add_sfx_only',
  'mute_section',
  'no_audio_change',
  'unspecified',
]

const captionValues: ProjectEditBriefCaptionBehavior[] = [
  'add_caption',
  'edit_caption',
  'make_smaller',
  'make_larger',
  'remove_caption',
  'keep_caption_style',
  'no_caption_change',
  'unspecified',
]

function visualBehavior(value: string): ProjectEditBriefVisualBehavior {
  return visualValues.includes(value as ProjectEditBriefVisualBehavior) ? value as ProjectEditBriefVisualBehavior : 'unspecified'
}

function audioBehavior(value: string): ProjectEditBriefAudioBehavior {
  return audioValues.includes(value as ProjectEditBriefAudioBehavior) ? value as ProjectEditBriefAudioBehavior : 'unspecified'
}

function captionBehavior(value: string): ProjectEditBriefCaptionBehavior {
  return captionValues.includes(value as ProjectEditBriefCaptionBehavior) ? value as ProjectEditBriefCaptionBehavior : 'unspecified'
}

export function markerStatusFromQwenResponse(response: QwenMarkerChatStructuredResponse): ProjectEditBriefMarkerStatus {
  if (response.status === 'needs_asset') return 'needs_asset'
  if (response.status === 'needs_clarification') return 'needs_clarification'
  if (response.status === 'confirmed') return 'confirmed'
  return 'draft'
}

export function createQwenMarkerChatIntentDraft(input: {
  marker: ProjectEditBriefMarkerRecord
  response: QwenMarkerChatStructuredResponse
  userMessageId?: string
}): Omit<ProjectEditBriefMarkerIntentRecord, 'id' | 'projectId' | 'editSessionId' | 'briefId' | 'markerId' | 'createdAt' | 'updatedAt' | 'mockOnly'> {
  return {
    action: input.response.action,
    status: input.response.status,
    instruction: input.response.assistantMessage,
    timeRangeLabel: `${input.marker.startTimeSeconds}s${input.marker.endTimeSeconds !== undefined ? `-${input.marker.endTimeSeconds}s` : ''}`,
    startTimeSeconds: input.marker.startTimeSeconds,
    endTimeSeconds: input.marker.timeMode === 'range' ? input.marker.endTimeSeconds : undefined,
    visualBehavior: visualBehavior(input.response.visualBehavior),
    audioBehavior: audioBehavior(input.response.audioBehavior),
    captionBehavior: captionBehavior(input.response.captionBehavior),
    assetRequirement: input.response.assetRequirement,
    providedAssetIds: [],
    priority: input.marker.priority,
    confidence: input.response.confidence,
    blockingNeeds: input.response.blockingNeeds,
    doNotCopyNotes: input.response.doNotCopyNotes,
    plannerHints: input.response.plannerHints,
    latestUserMessageId: input.userMessageId,
    metadata: {
      source: 'rp_qwen_beta_01_marker_chat',
      qwenStructuredResponseValidated: true,
      noPlannerExecution: true,
    },
  }
}
