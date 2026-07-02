import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefAttachmentKind,
  ProjectEditBriefAttachmentStatus,
  ProjectEditBriefAvailability,
  ProjectEditBriefBundleRecord,
  ProjectEditBriefCaptionBehavior,
  ProjectEditBriefFixtureBundle,
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerIntentStatus,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerRevisionRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
  ProjectEditBriefQAStatus,
  ProjectEditBriefRecord,
  ProjectEditBriefStatus,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditBriefVisualBehavior,
  ProjectEditBriefAudioBehavior,
  ProjectEditSessionExportPreset,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type { ProjectEditSessionPlatformTarget } from '../types/project-edit-session'
import { createProjectEditBriefTimelineMarkerModels } from './project-edit-brief-timeline-mappers'

const PROJECT_ID = 'mock-project-edit-chat-foundation'
const MOCK_NOW = '2026-06-24T14:00:00.000Z'

type MarkerSpec = {
  id: string
  markerType: ProjectEditBriefMarkerType
  status: ProjectEditBriefMarkerStatus
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  title: string
  userNote: string
  aiMode?: ProjectEditBriefMarkerAIMode
  qaStatus?: ProjectEditBriefQAStatus
  action: ProjectEditBriefMarkerIntentAction
  intentStatus: ProjectEditBriefMarkerIntentStatus
  instruction: string
  visualBehavior?: ProjectEditBriefVisualBehavior
  audioBehavior?: ProjectEditBriefAudioBehavior
  captionBehavior?: ProjectEditBriefCaptionBehavior
  assetRequirement?: string
  providedAssetIds?: string[]
  blockingNeeds?: string[]
  plannerHints?: string[]
  doNotCopyNotes?: string[]
  confidence?: 'low' | 'medium' | 'high'
  attachment?: {
    kind: ProjectEditBriefAttachmentKind
    status: ProjectEditBriefAttachmentStatus
    label: string
    mediaAssetId?: string
    referenceLabel?: string
    notes: string[]
    previewLabel?: string
    durationSeconds?: number
  }
  confirmation?: string
  conflict?: {
    relatedMarkerId?: string
    title: string
    summary: string
    recommendedResolution: string
    blocksPlan: boolean
  }
  revision?: {
    summary: string
    reason: string
  }
  appliedToPlan?: boolean
}

type BriefSpec = {
  id: string
  editSessionId: string
  title: string
  status: ProjectEditBriefStatus
  availability: ProjectEditBriefAvailability
  summary: string
  platformTarget: ProjectEditSessionPlatformTarget
  deliveryPreset: ProjectEditSessionExportPreset
  resolution: { width: number; height: number }
  aspectRatio: ProjectEditSessionExportSettingsRecord['aspectRatio']
  markers: MarkerSpec[]
}

const briefSpecs: BriefSpec[] = [
  {
    id: 'project-edit-brief-optional-not-opened',
    editSessionId: 'edit-session-vertical-dna',
    title: 'Optional Brief Not Opened',
    status: 'not_created',
    availability: 'optional_not_opened',
    summary: 'Edit Chat can continue without an Edit Brief.',
    platformTarget: 'instagram_reel',
    deliveryPreset: 'instagram_reel_1080x1920',
    resolution: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    markers: [],
  },
  {
    id: 'project-edit-brief-active-empty',
    editSessionId: 'edit-session-draft-no-approval',
    title: 'Active Empty Brief',
    status: 'active',
    availability: 'optional_opened',
    summary: 'Brief shell is open but no timeline markers have been added.',
    platformTarget: 'internal_review',
    deliveryPreset: 'custom',
    resolution: { width: 1080, height: 1350 },
    aspectRatio: 'custom',
    markers: [],
  },
  {
    id: 'project-edit-brief-broll-attached',
    editSessionId: 'edit-session-vertical-dna',
    title: 'B-roll Insert Brief',
    status: 'ready_for_plan',
    availability: 'ready_for_plan',
    summary: 'Confirmed b-roll marker with metadata-only mock clip.',
    platformTarget: 'tiktok_reel',
    deliveryPreset: 'tiktok_1080x1920',
    resolution: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    markers: [
      {
        id: 'marker-broll-city',
        markerType: 'broll',
        status: 'ready_for_plan',
        priority: 'must_follow',
        timeMode: 'range',
        startTimeSeconds: 12,
        endTimeSeconds: 18,
        title: 'Insert city arrival B-roll',
        userNote: 'Use the city arrival b-roll over the travel setup line.',
        action: 'add_broll',
        intentStatus: 'ready_for_plan',
        instruction: 'Insert metadata-only city b-roll as an adapted visual support shot.',
        visualBehavior: 'insert_broll',
        audioBehavior: 'keep_original_audio',
        captionBehavior: 'no_caption_change',
        providedAssetIds: ['mock-media-broll-city'],
        plannerHints: ['Use as support footage only; preserve source order.'],
        doNotCopyNotes: ['Do not copy reference timing shot-for-shot.'],
        attachment: {
          kind: 'broll_video',
          status: 'mock_attached',
          label: 'mock-broll-city.mp4',
          mediaAssetId: 'mock-media-broll-city',
          notes: ['Metadata-only fixture. No file bytes are read.'],
          previewLabel: 'city arrival placeholder',
          durationSeconds: 6,
        },
        confirmation: 'Confirmed: use this mock b-roll as support footage only.',
        appliedToPlan: true,
      },
    ],
  },
  {
    id: 'project-edit-brief-broll-needs-asset',
    editSessionId: 'edit-session-social-feed',
    title: 'B-roll Needs Asset',
    status: 'needs_review',
    availability: 'has_markers',
    summary: 'B-roll marker is blocked until a future upload or source choice exists.',
    platformTarget: 'instagram_feed',
    deliveryPreset: 'instagram_feed_4x5_1080x1350',
    resolution: { width: 1080, height: 1350 },
    aspectRatio: '4:5',
    markers: [
      {
        id: 'marker-broll-needed',
        markerType: 'broll',
        status: 'needs_asset',
        priority: 'should_follow',
        timeMode: 'range',
        startTimeSeconds: 24,
        endTimeSeconds: 30,
        title: 'Need cafe exterior B-roll',
        userNote: 'Add a cafe exterior here when assets exist.',
        action: 'add_broll',
        intentStatus: 'needs_asset',
        instruction: 'Future asset needed before planner can use this marker.',
        visualBehavior: 'insert_broll',
        audioBehavior: 'no_audio_change',
        captionBehavior: 'no_caption_change',
        assetRequirement: 'cafe exterior b-roll',
        blockingNeeds: ['metadata-only asset still missing'],
        plannerHints: ['Skip until asset is attached.'],
        attachment: {
          kind: 'reference_label',
          status: 'missing_required_asset',
          label: 'cafe exterior b-roll needed',
          referenceLabel: 'future cafe exterior clip',
          notes: ['No upload occurs in RP-EDITBRIEF-02.'],
        },
      },
    ],
  },
  {
    id: 'project-edit-brief-music-marker',
    editSessionId: 'edit-session-youtube-wide',
    title: 'Music Soundtrack Brief',
    status: 'active',
    availability: 'has_confirmed_markers',
    summary: 'Confirmed soundtrack guidance without provider or generation calls.',
    platformTarget: 'youtube_standard',
    deliveryPreset: 'youtube_standard_1920x1080',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    markers: [
      {
        id: 'marker-calm-soundtrack',
        markerType: 'music_soundtrack',
        status: 'confirmed',
        priority: 'should_follow',
        timeMode: 'range',
        startTimeSeconds: 0,
        endTimeSeconds: 45,
        title: 'Calm optimistic bed',
        userNote: 'Use calm music underneath; do not overpower voice.',
        action: 'add_music_or_soundtrack',
        intentStatus: 'confirmed',
        instruction: 'Use a calm soundtrack policy stub with voice-first ducking.',
        visualBehavior: 'no_visual_change',
        audioBehavior: 'add_music_under',
        captionBehavior: 'no_caption_change',
        attachment: {
          kind: 'music_track',
          status: 'metadata_only',
          label: 'calm-soundtrack.mp3',
          notes: ['Metadata label only; no music provider is called.'],
        },
        confirmation: 'Confirmed: music supports voice and stays adapted, not copied.',
      },
    ],
  },
  {
    id: 'project-edit-brief-caption-marker',
    editSessionId: 'edit-session-square-ad',
    title: 'Caption Text Brief',
    status: 'active',
    availability: 'has_confirmed_markers',
    summary: 'Caption marker preserves text guidance without rendering captions.',
    platformTarget: 'ad_creative',
    deliveryPreset: 'instagram_feed_square_1080x1080',
    resolution: { width: 1080, height: 1080 },
    aspectRatio: '1:1',
    markers: [
      {
        id: 'marker-caption-hook',
        markerType: 'caption_text',
        status: 'confirmed',
        priority: 'must_follow',
        timeMode: 'point',
        startTimeSeconds: 4,
        title: 'Caption hook text',
        userNote: 'Add short on-screen hook text at the opener.',
        action: 'add_caption_or_text',
        intentStatus: 'confirmed',
        instruction: 'Add a concise hook caption in the future caption layer.',
        visualBehavior: 'add_graphic_overlay',
        audioBehavior: 'no_audio_change',
        captionBehavior: 'add_caption',
        plannerHints: ['Keep caption inside safe area.'],
        attachment: {
          kind: 'image',
          status: 'metadata_only',
          label: 'product-image-placeholder.png',
          notes: ['Placeholder image label only.'],
        },
      },
    ],
  },
  {
    id: 'project-edit-brief-cut-remove-marker',
    editSessionId: 'edit-session-revision-requested',
    title: 'Cut Remove Brief',
    status: 'active',
    availability: 'has_markers',
    summary: 'Range marker asks future planner to remove a slow section.',
    platformTarget: 'linkedin',
    deliveryPreset: 'custom',
    resolution: { width: 1080, height: 1350 },
    aspectRatio: '4:5',
    markers: [
      {
        id: 'marker-remove-pause',
        markerType: 'cut_remove',
        status: 'draft',
        priority: 'should_follow',
        timeMode: 'range',
        startTimeSeconds: 31,
        endTimeSeconds: 36,
        title: 'Remove slow pause',
        userNote: 'Cut this pause if it makes the demo drag.',
        action: 'remove_or_cut',
        intentStatus: 'draft_intent',
        instruction: 'Candidate cut range for future planner review.',
        visualBehavior: 'remove_section',
        audioBehavior: 'mute_section',
        captionBehavior: 'no_caption_change',
        confidence: 'medium',
      },
    ],
  },
  {
    id: 'project-edit-brief-do-not-use-marker',
    editSessionId: 'edit-session-needs-review',
    title: 'Do Not Use Brief',
    status: 'needs_review',
    availability: 'has_markers',
    summary: 'Avoid marker protects a source section from planner use.',
    platformTarget: 'instagram_reel',
    deliveryPreset: 'instagram_reel_1080x1920',
    resolution: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    markers: [
      {
        id: 'marker-do-not-use-face',
        markerType: 'do_not_use',
        status: 'confirmed',
        priority: 'avoid',
        timeMode: 'range',
        startTimeSeconds: 42,
        endTimeSeconds: 49,
        title: 'Avoid private face region',
        userNote: 'Do not use this source section.',
        action: 'avoid_or_do_not_use',
        intentStatus: 'confirmed',
        instruction: 'Avoid this section in future planning.',
        visualBehavior: 'remove_section',
        audioBehavior: 'no_audio_change',
        captionBehavior: 'no_caption_change',
        doNotCopyNotes: ['Do not infer identity or use as reference footage.'],
      },
    ],
  },
  {
    id: 'project-edit-brief-chat-confirmation',
    editSessionId: 'edit-session-approved-preview',
    title: 'Marker Chat Confirmation Brief',
    status: 'ready_for_plan',
    availability: 'ready_for_plan',
    summary: 'Marker Chat stores scoped confirmation separate from main Edit Chat.',
    platformTarget: 'podcast_clip',
    deliveryPreset: 'youtube_standard_1920x1080',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    markers: [
      {
        id: 'marker-keep-quote',
        markerType: 'keep_emphasize',
        status: 'ready_for_plan',
        priority: 'must_follow',
        timeMode: 'range',
        startTimeSeconds: 8,
        endTimeSeconds: 16,
        title: 'Keep founder quote',
        userNote: 'This quote is the emotional spine.',
        aiMode: 'confirm_only',
        action: 'keep_or_emphasize',
        intentStatus: 'ready_for_plan',
        instruction: 'Keep and emphasize this quote without changing the meaning.',
        visualBehavior: 'keep_main_video',
        audioBehavior: 'keep_original_audio',
        captionBehavior: 'keep_caption_style',
        confirmation: 'Confirmed in Marker Chat: keep this exact idea, not exact source framing.',
        appliedToPlan: true,
      },
    ],
  },
  {
    id: 'project-edit-brief-needs-clarification',
    editSessionId: 'edit-session-previous-approved-derived',
    title: 'Needs Clarification Brief',
    status: 'needs_review',
    availability: 'has_markers',
    summary: 'Marker stores a scoped clarification question.',
    platformTarget: 'website',
    deliveryPreset: 'website_1920x1080',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    markers: [
      {
        id: 'marker-transition-question',
        markerType: 'transition',
        status: 'needs_clarification',
        priority: 'optional',
        timeMode: 'point',
        startTimeSeconds: 20,
        title: 'Clarify transition style',
        userNote: 'Maybe use a smoother transition here?',
        aiMode: 'ask_clarifying_questions',
        action: 'add_transition',
        intentStatus: 'needs_clarification',
        instruction: 'Ask whether the transition should be subtle or energetic.',
        visualBehavior: 'unspecified',
        audioBehavior: 'unspecified',
        captionBehavior: 'unspecified',
        blockingNeeds: ['user clarification needed'],
      },
    ],
  },
  {
    id: 'project-edit-brief-music-conflict',
    editSessionId: 'edit-session-youtube-wide',
    title: 'Conflicting Music Brief',
    status: 'needs_review',
    availability: 'has_conflicts',
    summary: 'Two markers disagree about whether music should appear.',
    platformTarget: 'youtube_standard',
    deliveryPreset: 'youtube_standard_1920x1080',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    markers: [
      {
        id: 'marker-add-music-conflict',
        markerType: 'music_soundtrack',
        status: 'conflict',
        priority: 'should_follow',
        timeMode: 'range',
        startTimeSeconds: 10,
        endTimeSeconds: 40,
        title: 'Add music',
        userNote: 'Add light music under the explanation.',
        action: 'add_music_or_soundtrack',
        intentStatus: 'conflict',
        instruction: 'Add light music if conflict is resolved.',
        visualBehavior: 'no_visual_change',
        audioBehavior: 'add_music_under',
        captionBehavior: 'no_caption_change',
        conflict: {
          relatedMarkerId: 'marker-no-music-conflict',
          title: 'Music policy conflict',
          summary: 'One marker requests music while another avoids music in the same range.',
          recommendedResolution: 'Ask owner whether voice-only or light music should win.',
          blocksPlan: true,
        },
      },
      {
        id: 'marker-no-music-conflict',
        markerType: 'do_not_use',
        status: 'conflict',
        priority: 'avoid',
        timeMode: 'range',
        startTimeSeconds: 10,
        endTimeSeconds: 40,
        title: 'Avoid music',
        userNote: 'Keep this section voice-only.',
        action: 'avoid_or_do_not_use',
        intentStatus: 'conflict',
        instruction: 'Avoid music until the owner resolves the conflict.',
        visualBehavior: 'no_visual_change',
        audioBehavior: 'no_audio_change',
        captionBehavior: 'no_caption_change',
        conflict: {
          relatedMarkerId: 'marker-add-music-conflict',
          title: 'Voice-only conflict',
          summary: 'Voice-only note conflicts with music request.',
          recommendedResolution: 'Prefer voice safety until clarified.',
          blocksPlan: true,
        },
      },
    ],
  },
  {
    id: 'project-edit-brief-changed-after-plan',
    editSessionId: 'edit-session-approved-preview',
    title: 'Changed After Plan Brief',
    status: 'changed_after_plan',
    availability: 'has_confirmed_markers',
    summary: 'Brief includes a marker revision after a mock plan application.',
    platformTarget: 'podcast_clip',
    deliveryPreset: 'youtube_standard_1920x1080',
    resolution: { width: 1920, height: 1080 },
    aspectRatio: '16:9',
    markers: [
      {
        id: 'marker-caption-revised',
        markerType: 'caption_text',
        status: 'changed_after_plan',
        priority: 'should_follow',
        timeMode: 'point',
        startTimeSeconds: 28,
        title: 'Revise caption size',
        userNote: 'Make the caption smaller after seeing the plan.',
        action: 'add_caption_or_text',
        intentStatus: 'draft_intent',
        instruction: 'Reduce future caption size for this moment.',
        visualBehavior: 'add_graphic_overlay',
        audioBehavior: 'no_audio_change',
        captionBehavior: 'make_smaller',
        revision: {
          summary: 'Caption size changed after mock plan application.',
          reason: 'Owner requested subtler text.',
        },
        appliedToPlan: true,
      },
    ],
  },
]

function exportSettings(spec: BriefSpec): ProjectEditSessionExportSettingsRecord {
  return {
    id: `${spec.id}-export-settings`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    source: 'auto_recommended_mock',
    platformTarget: spec.platformTarget,
    aspectRatio: spec.aspectRatio,
    customAspectRatio: spec.aspectRatio === 'custom'
      ? { width: spec.resolution.width, height: spec.resolution.height }
      : undefined,
    resolution: spec.resolution,
    frameRate: 30,
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    audioLoudnessTarget: '-14 LUFS mock target',
    captionSafeArea: true,
    safeZonePreset: 'mock-safe-zone-standard',
    deliveryPreset: spec.deliveryPreset,
    summary: `${spec.title} uses ${spec.deliveryPreset} export settings in mock metadata only.`,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      noRenderStarted: true,
      noUploadStarted: true,
    },
  }
}

function briefRecord(spec: BriefSpec): ProjectEditBriefRecord {
  const markerCount = spec.markers.length
  return {
    id: spec.id,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    status: spec.status,
    availability: spec.availability,
    title: spec.title,
    summary: spec.summary,
    markerCount,
    confirmedMarkerCount: spec.markers.filter((marker) =>
      marker.status === 'confirmed' || marker.status === 'ready_for_plan' || marker.status === 'applied_to_plan',
    ).length,
    conflictCount: spec.markers.filter((marker) => marker.status === 'conflict').length,
    needsAssetCount: spec.markers.filter((marker) => marker.status === 'needs_asset').length,
    needsClarificationCount: spec.markers.filter((marker) => marker.status === 'needs_clarification').length,
    exportSettingsId: `${spec.id}-export-settings`,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    lastOpenedAt: spec.status === 'not_created' ? undefined : MOCK_NOW,
    mockOnly: true,
    metadata: {
      userFacingObject: 'Edit Brief',
      parentObject: 'ProjectEditSession',
      optional: true,
    },
  }
}

function markerRecord(spec: BriefSpec, marker: MarkerSpec): ProjectEditBriefMarkerRecord {
  return {
    id: marker.id,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerType: marker.markerType,
    status: marker.status,
    priority: marker.priority,
    timeMode: marker.timeMode,
    startTimeSeconds: marker.startTimeSeconds,
    endTimeSeconds: marker.endTimeSeconds,
    title: marker.title,
    userNote: marker.userNote,
    aiMode: marker.aiMode ?? 'confirm_only',
    intentId: `${marker.id}-intent`,
    attachmentCount: marker.attachment ? 1 : 0,
    messageCount: marker.confirmation ? 3 : 2,
    qaStatus: marker.qaStatus ?? (marker.status === 'conflict' ? 'conflict' : marker.status === 'needs_asset'
      ? 'needs_asset'
      : marker.status === 'needs_clarification' ? 'needs_clarification' : 'not_checked'),
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      markerChatScoped: true,
      noPlannerExecution: true,
    },
  }
}

function intentRecord(spec: BriefSpec, marker: MarkerSpec): ProjectEditBriefMarkerIntentRecord {
  return {
    id: `${marker.id}-intent`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker.id,
    action: marker.action,
    status: marker.intentStatus,
    instruction: marker.instruction,
    timeRangeLabel: marker.timeMode === 'range' && marker.endTimeSeconds !== undefined
      ? `${marker.startTimeSeconds}s-${marker.endTimeSeconds}s`
      : `${marker.startTimeSeconds}s`,
    startTimeSeconds: marker.startTimeSeconds,
    endTimeSeconds: marker.endTimeSeconds,
    visualBehavior: marker.visualBehavior ?? 'unspecified',
    audioBehavior: marker.audioBehavior ?? 'unspecified',
    captionBehavior: marker.captionBehavior ?? 'unspecified',
    assetRequirement: marker.assetRequirement,
    providedAssetIds: marker.providedAssetIds ?? [],
    priority: marker.priority,
    confidence: marker.confidence ?? 'high',
    blockingNeeds: marker.blockingNeeds ?? [],
    doNotCopyNotes: marker.doNotCopyNotes ?? ['Adapt the instruction; do not copy reference timing or footage.'],
    plannerHints: marker.plannerHints ?? ['Future planner hint only. No planner execution in RP-EDITBRIEF-02.'],
    latestUserMessageId: `${marker.id}-message-user`,
    latestConfirmationId: marker.confirmation ? `${marker.id}-confirmation` : undefined,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      structuredIntentOnly: true,
      providerCallMade: false,
    },
  }
}

function attachmentRecord(
  spec: BriefSpec,
  marker: MarkerSpec,
): ProjectEditBriefMarkerAttachmentRecord | undefined {
  if (!marker.attachment) return undefined
  return {
    id: `${marker.id}-attachment`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker.id,
    attachmentKind: marker.attachment.kind,
    status: marker.attachment.status,
    label: marker.attachment.label,
    mediaAssetId: marker.attachment.mediaAssetId,
    referenceLabel: marker.attachment.referenceLabel,
    notes: marker.attachment.notes,
    previewLabel: marker.attachment.previewLabel,
    durationSeconds: marker.attachment.durationSeconds,
    mockOnly: true,
    metadata: {
      metadataOnly: true,
      fileBytesRead: false,
      storageWriteMade: false,
      signedUrlCreated: false,
    },
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
  }
}

function messageRecords(spec: BriefSpec, marker: MarkerSpec): ProjectEditBriefMarkerMessageRecord[] {
  const messages: ProjectEditBriefMarkerMessageRecord[] = [
    {
      id: `${marker.id}-message-user`,
      projectId: PROJECT_ID,
      editSessionId: spec.editSessionId,
      briefId: spec.id,
      markerId: marker.id,
      role: 'user',
      kind: 'note',
      text: marker.userNote,
      createdAt: MOCK_NOW,
      relatedIntentId: `${marker.id}-intent`,
      mockOnly: true,
    },
    {
      id: `${marker.id}-message-system`,
      projectId: PROJECT_ID,
      editSessionId: spec.editSessionId,
      briefId: spec.id,
      markerId: marker.id,
      role: 'system',
      kind: marker.status === 'needs_clarification' ? 'clarification_question' : 'intent_update',
      text: marker.status === 'needs_clarification'
        ? 'Marker Chat needs clarification before this marker can become planner-ready.'
        : 'Structured marker intent captured in mock/local mode.',
      createdAt: MOCK_NOW,
      relatedIntentId: `${marker.id}-intent`,
      relatedAttachmentId: marker.attachment ? `${marker.id}-attachment` : undefined,
      mockOnly: true,
    },
  ]

  if (marker.confirmation) {
    messages.push({
      id: `${marker.id}-message-confirmation`,
      projectId: PROJECT_ID,
      editSessionId: spec.editSessionId,
      briefId: spec.id,
      markerId: marker.id,
      role: 'assistant',
      kind: 'confirmation',
      text: marker.confirmation,
      createdAt: MOCK_NOW,
      relatedIntentId: `${marker.id}-intent`,
      mockOnly: true,
    })
  }

  return messages
}

function confirmationRecord(
  spec: BriefSpec,
  marker: MarkerSpec,
): ProjectEditBriefMarkerConfirmationRecord | undefined {
  if (!marker.confirmation) return undefined
  return {
    id: `${marker.id}-confirmation`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker.id,
    intentId: `${marker.id}-intent`,
    summary: marker.confirmation,
    confirmedByUser: true,
    aiMode: marker.aiMode ?? 'confirm_only',
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      markerChatScoped: true,
    },
  }
}

function conflictRecord(
  spec: BriefSpec,
  marker: MarkerSpec,
): ProjectEditBriefMarkerConflictRecord | undefined {
  if (!marker.conflict) return undefined
  return {
    id: `${marker.id}-conflict`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker.id,
    relatedMarkerId: marker.conflict.relatedMarkerId,
    qaStatus: 'conflict',
    title: marker.conflict.title,
    summary: marker.conflict.summary,
    recommendedResolution: marker.conflict.recommendedResolution,
    blocksPlan: marker.conflict.blocksPlan,
    requiresUserReview: true,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      ownerDecisionRequired: true,
    },
  }
}

function revisionRecord(
  spec: BriefSpec,
  marker: MarkerSpec,
): ProjectEditBriefMarkerRevisionRecord | undefined {
  if (!marker.revision) return undefined
  return {
    id: `${marker.id}-revision`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker.id,
    previousIntentId: `${marker.id}-intent-before-plan`,
    newIntentId: `${marker.id}-intent`,
    summary: marker.revision.summary,
    reason: marker.revision.reason,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      changedAfterPlan: true,
    },
  }
}

function applicationLogRecord(
  spec: BriefSpec,
  marker?: MarkerSpec,
): ProjectEditBriefApplicationLogRecord {
  return {
    id: marker ? `${marker.id}-application-log` : `${spec.id}-application-log`,
    projectId: PROJECT_ID,
    editSessionId: spec.editSessionId,
    briefId: spec.id,
    markerId: marker?.id,
    summary: marker
      ? `${marker.title} is recorded as ${marker.appliedToPlan ? 'applied to' : 'available for'} future planning.`
      : `${spec.title} has no marker application yet.`,
    appliedToPlan: marker?.appliedToPlan ?? false,
    createdAt: MOCK_NOW,
    mockOnly: true,
    metadata: {
      noPlannerExecution: true,
    },
  }
}

function bundleRecord(
  brief: ProjectEditBriefRecord,
  exportSetting: ProjectEditSessionExportSettingsRecord,
  markers: ProjectEditBriefMarkerRecord[],
  attachments: ProjectEditBriefMarkerAttachmentRecord[],
  messages: ProjectEditBriefMarkerMessageRecord[],
  intents: ProjectEditBriefMarkerIntentRecord[],
  confirmations: ProjectEditBriefMarkerConfirmationRecord[],
  conflicts: ProjectEditBriefMarkerConflictRecord[],
  revisions: ProjectEditBriefMarkerRevisionRecord[],
  applicationLogs: ProjectEditBriefApplicationLogRecord[],
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[],
): ProjectEditBriefBundleRecord {
  return {
    brief,
    markers,
    attachments,
    messages,
    intents,
    confirmations,
    conflicts,
    revisions,
    applicationLogs,
    exportSettings: exportSetting,
    timelineMarkers,
    mockOnly: true,
    warnings: conflicts.length > 0
      ? conflicts.map((conflict) => conflict.summary)
      : [],
  }
}

export function createMockProjectEditBriefFixtureBundle(): ProjectEditBriefFixtureBundle {
  const briefs: ProjectEditBriefRecord[] = []
  const markers: ProjectEditBriefMarkerRecord[] = []
  const attachments: ProjectEditBriefMarkerAttachmentRecord[] = []
  const messages: ProjectEditBriefMarkerMessageRecord[] = []
  const intents: ProjectEditBriefMarkerIntentRecord[] = []
  const confirmations: ProjectEditBriefMarkerConfirmationRecord[] = []
  const conflicts: ProjectEditBriefMarkerConflictRecord[] = []
  const revisions: ProjectEditBriefMarkerRevisionRecord[] = []
  const applicationLogs: ProjectEditBriefApplicationLogRecord[] = []
  const exportSettingsRecords: ProjectEditSessionExportSettingsRecord[] = []
  const timelineMarkers: ProjectEditBriefTimelineMarkerModel[] = []
  const bundles: ProjectEditBriefBundleRecord[] = []

  for (const spec of briefSpecs) {
    const brief = briefRecord(spec)
    const exportSetting = exportSettings(spec)
    const specMarkers = spec.markers.map((marker) => markerRecord(spec, marker))
    const specAttachments = spec.markers
      .map((marker) => attachmentRecord(spec, marker))
      .filter((attachment): attachment is ProjectEditBriefMarkerAttachmentRecord => Boolean(attachment))
    const specMessages = spec.markers.flatMap((marker) => messageRecords(spec, marker))
    const specIntents = spec.markers.map((marker) => intentRecord(spec, marker))
    const specConfirmations = spec.markers
      .map((marker) => confirmationRecord(spec, marker))
      .filter((confirmation): confirmation is ProjectEditBriefMarkerConfirmationRecord => Boolean(confirmation))
    const specConflicts = spec.markers
      .map((marker) => conflictRecord(spec, marker))
      .filter((conflict): conflict is ProjectEditBriefMarkerConflictRecord => Boolean(conflict))
    const specRevisions = spec.markers
      .map((marker) => revisionRecord(spec, marker))
      .filter((revision): revision is ProjectEditBriefMarkerRevisionRecord => Boolean(revision))
    const specApplicationLogs = spec.markers.length > 0
      ? spec.markers.map((marker) => applicationLogRecord(spec, marker))
      : [applicationLogRecord(spec)]
    const specTimelineMarkers = createProjectEditBriefTimelineMarkerModels(specMarkers)

    briefs.push(brief)
    exportSettingsRecords.push(exportSetting)
    markers.push(...specMarkers)
    attachments.push(...specAttachments)
    messages.push(...specMessages)
    intents.push(...specIntents)
    confirmations.push(...specConfirmations)
    conflicts.push(...specConflicts)
    revisions.push(...specRevisions)
    applicationLogs.push(...specApplicationLogs)
    timelineMarkers.push(...specTimelineMarkers)
    bundles.push(bundleRecord(
      brief,
      exportSetting,
      specMarkers,
      specAttachments,
      specMessages,
      specIntents,
      specConfirmations,
      specConflicts,
      specRevisions,
      specApplicationLogs,
      specTimelineMarkers,
    ))
  }

  return {
    briefs,
    markers,
    attachments,
    messages,
    intents,
    confirmations,
    conflicts,
    revisions,
    applicationLogs,
    exportSettings: exportSettingsRecords,
    timelineMarkers,
    bundles,
  }
}

export const MOCK_PROJECT_EDIT_BRIEF_FIXTURE_BUNDLE =
  createMockProjectEditBriefFixtureBundle()
