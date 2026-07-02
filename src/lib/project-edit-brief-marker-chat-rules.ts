import type {
  ProjectEditBriefAudioBehavior,
  ProjectEditBriefCaptionBehavior,
  ProjectEditBriefIntentConfidence,
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerIntentStatus,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefVisualBehavior,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefMarkerChatExtractionResult,
  ProjectEditBriefMarkerChatProcessingMode,
  ProjectEditBriefMarkerChatResponseKind,
  ProjectEditBriefMarkerChatSafetyFlags,
} from '../types/project-edit-brief-marker-chat'
import { formatProjectEditBriefTime } from './project-edit-brief-ui-adapter'

export const PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS: ProjectEditBriefMarkerChatSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  qwenCallMade: false,
  deepSeekCallMade: false,
  embeddingsUsed: false,
  vectorDbUsed: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
}

export function createProjectEditBriefMarkerChatId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

export function createProjectEditBriefMarkerTimeRangeLabel(marker: ProjectEditBriefMarkerRecord): string {
  if (marker.timeMode === 'range' && marker.endTimeSeconds !== undefined) {
    return `${formatProjectEditBriefTime(marker.startTimeSeconds)}-${formatProjectEditBriefTime(marker.endTimeSeconds)}`
  }
  return formatProjectEditBriefTime(marker.startTimeSeconds)
}

export function detectProjectEditBriefMarkerIntentAction(messageText: string): ProjectEditBriefMarkerIntentAction {
  const text = messageText.toLowerCase()
  if (includesAny(text, [/\b(add|insert|show|use)\b.*\b(b-?roll|city|clip|cutaway|lifestyle|location)\b/, /\bb-?roll\b/])) return 'add_broll'
  if (includesAny(text, [/\b(cut|remove|take out|delete|trim out)\b/])) return 'remove_or_cut'
  if (includesAny(text, [/\b(keep|emphasize|highlight|stand out|preserve)\b/])) return 'keep_or_emphasize'
  if (includesAny(text, [/\b(caption|captions|subtitle|subtitles|text)\b/])) return 'add_caption_or_text'
  if (includesAny(text, [/\b(graphic|card|overlay|ui)\b/])) return 'add_graphic_or_ui_card'
  if (includesAny(text, [/\b(no music|no fake sounds|avoid sfx|avoid sound|do not use|don't use)\b/])) return 'avoid_or_do_not_use'
  if (includesAny(text, [/\b(add music|music|soundtrack|keep music under)\b/])) return 'add_music_or_soundtrack'
  if (includesAny(text, [/\b(whoosh|sfx|sound effect|sound design)\b/])) return 'add_sfx'
  if (includesAny(text, [/\b(voiceover|voice over|narration)\b/])) return 'add_voiceover'
  if (includesAny(text, [/\b(transition|fade|cut to)\b/])) return 'add_transition'
  if (includesAny(text, [/\b(faster|slower|speed|pacing|pace)\b/])) return 'adjust_speed_or_pacing'
  if (includesAny(text, [/\b(color|warm|cinematic|tone|grade)\b/])) return 'adjust_color_or_tone'
  return 'general_instruction'
}

export function detectProjectEditBriefMarkerVisualBehavior(action: ProjectEditBriefMarkerIntentAction): ProjectEditBriefVisualBehavior {
  if (action === 'add_broll') return 'insert_broll'
  if (action === 'remove_or_cut') return 'remove_section'
  if (action === 'keep_or_emphasize') return 'keep_main_video'
  if (action === 'add_graphic_or_ui_card' || action === 'add_caption_or_text') return 'add_graphic_overlay'
  return 'unspecified'
}

export function detectProjectEditBriefMarkerAudioBehavior(messageText: string, action: ProjectEditBriefMarkerIntentAction): ProjectEditBriefAudioBehavior {
  const text = messageText.toLowerCase()
  if (includesAny(text, [/\bkeep (the )?(speaker|original) audio\b/, /\bkeep .* audio\b/])) return 'keep_original_audio'
  if (action === 'add_music_or_soundtrack') return 'add_music_under'
  if (action === 'add_sfx') return 'add_sfx_only'
  if (action === 'avoid_or_do_not_use') return 'no_audio_change'
  return 'unspecified'
}

export function detectProjectEditBriefMarkerCaptionBehavior(messageText: string, action: ProjectEditBriefMarkerIntentAction): ProjectEditBriefCaptionBehavior {
  const text = messageText.toLowerCase()
  if (action !== 'add_caption_or_text') return 'unspecified'
  if (includesAny(text, [/\bsmaller\b/])) return 'make_smaller'
  if (includesAny(text, [/\blarger|bigger\b/])) return 'make_larger'
  if (includesAny(text, [/\bedit|change\b/])) return 'edit_caption'
  return 'add_caption'
}

export function detectProjectEditBriefMarkerAssetRequirement(messageText: string, action: ProjectEditBriefMarkerIntentAction): string | undefined {
  const text = messageText.toLowerCase()
  if (action !== 'add_broll') return undefined
  if (includesAny(text, [/\bprovided\b/, /\bthis clip\b/, /\battached\b/])) return undefined
  if (includesAny(text, [/\bcity\b/])) return 'Needs metadata-only city or location B-roll reference in a future attachment milestone.'
  if (includesAny(text, [/\bproduct\b/])) return 'Needs metadata-only product B-roll reference in a future attachment milestone.'
  return 'Needs B-roll asset selection in RP-EDITBRIEF-08.'
}

function confidenceFor(action: ProjectEditBriefMarkerIntentAction, messageText: string): ProjectEditBriefIntentConfidence {
  if (action === 'general_instruction') return 'low'
  return messageText.trim().split(/\s+/).length > 3 ? 'high' : 'medium'
}

function statusFor(input: {
  action: ProjectEditBriefMarkerIntentAction
  aiMode: ProjectEditBriefMarkerAIMode
  assetRequirement?: string
  confidence: ProjectEditBriefIntentConfidence
  messageText: string
}): ProjectEditBriefMarkerIntentStatus {
  const text = input.messageText.toLowerCase()
  if (input.assetRequirement) return 'needs_asset'
  if (input.aiMode === 'ask_clarifying_questions' && (input.action === 'general_instruction' || input.confidence === 'low')) return 'needs_clarification'
  if (includesAny(text, [/\b(yes|confirm|confirmed|looks good|approve)\b/])) return 'confirmed'
  if (input.aiMode === 'confirm_only' && input.action !== 'general_instruction') return 'confirmed'
  return 'draft_intent'
}

export function classifyProjectEditBriefMarkerChatProcessingMode(
  aiMode: ProjectEditBriefMarkerAIMode,
  status: ProjectEditBriefMarkerIntentStatus,
): ProjectEditBriefMarkerChatProcessingMode {
  if (aiMode === 'off') return 'extract_intent'
  if (aiMode === 'confirm_only') return 'extract_and_confirm'
  if (aiMode === 'ask_clarifying_questions' && status === 'needs_clarification') return 'extract_and_clarify'
  if (aiMode === 'suggest_options') return 'extract_and_suggest'
  return 'extract_intent'
}

export function responseKindForMode(mode: ProjectEditBriefMarkerChatProcessingMode): ProjectEditBriefMarkerChatResponseKind {
  if (mode === 'extract_and_confirm') return 'mock_confirmation'
  if (mode === 'extract_and_clarify') return 'mock_clarifying_question'
  if (mode === 'extract_and_suggest') return 'mock_suggestions'
  return 'none'
}

export function deriveProjectEditBriefMarkerStatusFromIntentStatus(
  status: ProjectEditBriefMarkerIntentStatus,
  confidence: ProjectEditBriefIntentConfidence,
): ProjectEditBriefMarkerStatus {
  if (status === 'needs_asset') return 'needs_asset'
  if (status === 'needs_clarification') return 'needs_clarification'
  if (status === 'confirmed') return 'confirmed'
  if (confidence === 'low') return 'draft'
  return 'draft'
}

export function createProjectEditBriefMarkerMockResponse(
  marker: ProjectEditBriefMarkerRecord,
  action: ProjectEditBriefMarkerIntentAction,
  responseKind: ProjectEditBriefMarkerChatResponseKind,
): string | undefined {
  if (responseKind === 'mock_confirmation') {
    if (action === 'add_broll') return 'Understood. This marker will be treated as B-roll guidance while preserving the existing edit safety boundaries.'
    if (action === 'remove_or_cut') return 'Understood. This marker will be treated as a mock/local cut or removal instruction for future planning.'
    return `Understood. "${marker.title}" now has structured mock intent for future planning.`
  }
  if (responseKind === 'mock_clarifying_question') {
    return 'What should this marker focus on: product, lifestyle, location, text, music, or a cut/removal?'
  }
  if (responseKind === 'mock_suggestions') {
    return 'Options: add slow B-roll, reduce cuts, use softer music, add a subtle title card, or leave the main footage untouched.'
  }
  if (responseKind === 'mock_boundary_notice') {
    return 'Marker Chat is mock/local and does not call Qwen, DeepSeek, providers, workers, render, Supabase, or credits.'
  }
  return undefined
}

export function extractProjectEditBriefMarkerIntentFromMessage(input: {
  marker: ProjectEditBriefMarkerRecord
  messageText: string
  userMessageId?: string
}): ProjectEditBriefMarkerChatExtractionResult {
  const action = detectProjectEditBriefMarkerIntentAction(input.messageText)
  const confidence = confidenceFor(action, input.messageText)
  const assetRequirement = detectProjectEditBriefMarkerAssetRequirement(input.messageText, action)
  const status = statusFor({
    action,
    aiMode: input.marker.aiMode,
    assetRequirement,
    confidence,
    messageText: input.messageText,
  })
  const processingMode = classifyProjectEditBriefMarkerChatProcessingMode(input.marker.aiMode, status)
  const responseKind = responseKindForMode(processingMode)
  const responseText = createProjectEditBriefMarkerMockResponse(input.marker, action, responseKind)
  const blockingNeeds = [
    ...(assetRequirement ? [assetRequirement] : []),
    ...(status === 'needs_clarification' ? ['Needs one more marker-specific clarification before planner use.'] : []),
  ]
  const doNotCopyNotes = action === 'avoid_or_do_not_use'
    ? ['Respect this avoid/do-not-use instruction; do not infer exact copied timing, sound, layout, or source footage.']
    : ['Adapt the marker intent; do not copy source footage or creator identity.']
  const plannerHints = [
    `Future planner hint: ${action.replace(/_/g, ' ')} at ${createProjectEditBriefMarkerTimeRangeLabel(input.marker)}.`,
    'Marker Chat intent is planning metadata only.',
  ]
  const intentDraft: Partial<ProjectEditBriefMarkerIntentRecord> = {
    action,
    status,
    instruction: input.messageText.trim(),
    timeRangeLabel: createProjectEditBriefMarkerTimeRangeLabel(input.marker),
    startTimeSeconds: input.marker.startTimeSeconds,
    endTimeSeconds: input.marker.timeMode === 'range' ? input.marker.endTimeSeconds : undefined,
    visualBehavior: detectProjectEditBriefMarkerVisualBehavior(action),
    audioBehavior: detectProjectEditBriefMarkerAudioBehavior(input.messageText, action),
    captionBehavior: detectProjectEditBriefMarkerCaptionBehavior(input.messageText, action),
    assetRequirement,
    providedAssetIds: [],
    priority: input.marker.priority,
    confidence,
    blockingNeeds,
    doNotCopyNotes,
    plannerHints,
    latestUserMessageId: input.userMessageId,
    metadata: {
      source: 'rp_editbrief_07_marker_chat',
      deterministicExtraction: true,
      noModelCall: true,
    },
  }

  return {
    id: createProjectEditBriefMarkerChatId('project-edit-brief-marker-chat-extraction'),
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    userMessageId: input.userMessageId,
    processingMode,
    extractionStatus: status === 'needs_asset'
      ? 'processed_needs_asset'
      : status === 'needs_clarification'
        ? 'processed_needs_clarification'
        : status === 'confirmed'
          ? 'processed_confirmed'
          : 'processed_intent_draft',
    intentDraft,
    responseKind,
    responseText,
    markerStatusSuggestion: deriveProjectEditBriefMarkerStatusFromIntentStatus(status, confidence),
    blockingNeeds,
    plannerHints,
    confidence,
    warnings: [
      'Deterministic mock extraction only; no model/provider call was made.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefMarkerChatExtractionSummary(extraction: ProjectEditBriefMarkerChatExtractionResult): string {
  return `${extraction.intentDraft?.action ?? 'general_instruction'} -> ${extraction.extractionStatus} (${extraction.confidence})`
}

