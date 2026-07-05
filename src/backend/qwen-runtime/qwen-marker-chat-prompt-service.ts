import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  type ProjectEditBriefMarkerDrawerModel,
  type ProjectEditSessionExportSettingsRecord,
  type QwenMarkerChatPromptPackage,
  type QwenMarkerChatRuntimeRequest,
} from '../../types'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'

function safeList(values: string[]): string {
  return values.filter(Boolean).slice(0, 12).join('; ') || 'none'
}

function exportSummary(exportSettings?: ProjectEditSessionExportSettingsRecord): string {
  if (!exportSettings) return 'Export settings unavailable.'
  return `${exportSettings.platformTarget} ${exportSettings.aspectRatio} ${exportSettings.resolution} ${exportSettings.frameRate}fps ${exportSettings.format}.`
}

const allowedActionValues = [
  'add_broll',
  'remove_or_cut',
  'keep_or_emphasize',
  'add_caption_or_text',
  'add_graphic_or_ui_card',
  'add_music_or_soundtrack',
  'add_sfx',
  'add_voiceover',
  'add_transition',
  'adjust_speed_or_pacing',
  'adjust_color_or_tone',
  'avoid_or_do_not_use',
  'general_instruction',
]

const allowedStatusValues = [
  'draft_intent',
  'needs_clarification',
  'needs_asset',
  'confirmed',
  'blocked',
]

const allowedVisualBehaviorValues = [
  'replace_visual',
  'overlay_visual',
  'insert_broll',
  'add_graphic_overlay',
  'keep_main_video',
  'remove_section',
  'no_visual_change',
  'unspecified',
]

const allowedAudioBehaviorValues = [
  'keep_original_audio',
  'duck_original_audio',
  'replace_with_music',
  'add_music_under',
  'add_sfx_only',
  'mute_section',
  'no_audio_change',
  'unspecified',
]

const allowedCaptionBehaviorValues = [
  'add_caption',
  'edit_caption',
  'make_smaller',
  'make_larger',
  'remove_caption',
  'keep_caption_style',
  'no_caption_change',
  'unspecified',
]

export function createQwenMarkerChatPromptPackage(input: {
  request: QwenMarkerChatRuntimeRequest
  drawer: ProjectEditBriefMarkerDrawerModel
  exportSettings?: ProjectEditSessionExportSettingsRecord
}): QwenMarkerChatPromptPackage {
  const marker = input.drawer.marker
  const attachmentLabels = input.drawer.attachments.map((attachment) =>
    [
      attachment.attachmentKind,
      attachment.label,
      attachment.referenceLabel,
      attachment.mediaAssetId,
    ].filter(Boolean).join(': '),
  )
  const existingIntent = input.drawer.intent
    ? `${input.drawer.intent.action} ${input.drawer.intent.status} ${input.drawer.intent.instruction}`
    : 'none'
  const systemPrompt = [
    `You are ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} acting as ReEditPro backend-only Marker Chat reasoning.`,
    'Understand the marker-specific user message and return only valid JSON for QwenMarkerChatStructuredResponse.',
    'Return a single JSON object only. Do not wrap it in markdown, comments, prose, or code fences.',
    'Do not render video, run tools, fetch URLs, inspect files, start workers, spend credits, call DeepSeek, or create edit plans.',
    'Respect do-not-copy policy: adapt intent, never copy exact shots, creator identity, exact timing, layout, sound, or source footage.',
    `Allowed action values: ${allowedActionValues.join(', ')}.`,
    `Allowed status values: ${allowedStatusValues.join(', ')}.`,
    `Allowed visualBehavior values: ${allowedVisualBehaviorValues.join(', ')}.`,
    `Allowed audioBehavior values: ${allowedAudioBehaviorValues.join(', ')}.`,
    `Allowed captionBehavior values: ${allowedCaptionBehaviorValues.join(', ')}.`,
    'confidence must be exactly low, medium, or high.',
    'blockingNeeds, plannerHints, doNotCopyNotes, suggestions, and safetyWarnings must be arrays of strings.',
  ].join('\n')
  const userPrompt = [
    `Marker ID: ${marker.id}`,
    `Marker type: ${marker.markerType}`,
    `Priority: ${marker.priority}`,
    `AI mode: ${marker.aiMode}`,
    `Time: ${marker.startTimeSeconds}s${marker.endTimeSeconds !== undefined ? `-${marker.endTimeSeconds}s` : ''}`,
    `Current marker title: ${marker.title}`,
    `Current marker note: ${marker.userNote || 'none'}`,
    `Latest marker chat message: ${input.request.messageText}`,
    `Existing intent: ${existingIntent}`,
    `Attachment labels only: ${safeList(attachmentLabels)}`,
    `Export settings summary: ${exportSummary(input.exportSettings)}`,
    `QA status: ${marker.qaStatus}`,
    'Required JSON fields: assistantMessage, action, status, visualBehavior, audioBehavior, captionBehavior, assetRequirement, confidence, blockingNeeds, plannerHints, doNotCopyNotes, clarificationQuestion, suggestions, safetyWarnings.',
    'Example shape: {"assistantMessage":"Understood. I will treat this as marker-scoped guidance only.","action":"add_broll","status":"confirmed","visualBehavior":"insert_broll","audioBehavior":"keep_original_audio","captionBehavior":"unspecified","assetRequirement":"","confidence":"high","blockingNeeds":[],"plannerHints":["Metadata-only B-roll hint for this marker."],"doNotCopyNotes":["Adapt the reference; do not copy exact footage."],"clarificationQuestion":"","suggestions":[],"safetyWarnings":[]}',
  ].join('\n')

  return {
    ...createQwenRuntimeSafetyFlags(),
    id: `qwen-marker-chat-prompt-${marker.id}-${Date.now().toString(36)}`,
    markerId: marker.id,
    systemPrompt,
    userPrompt,
    schemaName: 'QwenMarkerChatStructuredResponse',
    includedContext: [
      'marker time range',
      'marker type and priority',
      'current marker note',
      'latest marker chat message',
      'existing marker intent',
      'attachment labels only',
      'export settings summary',
      'QA status',
      'do-not-copy policy',
      'required JSON schema',
    ],
    excludedContext: [
      'secret values',
      'provider headers',
      'raw file bytes',
      'external fetched content',
      'raw media',
      'full unrelated project history',
    ],
  }
}
