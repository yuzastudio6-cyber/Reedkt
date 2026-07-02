import type {
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentStatus,
} from '../../types'
import type { QwenMarkerChatStructuredResponse, QwenStructuredResponseValidationResult } from '../../types'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'

const allowedActions: ProjectEditBriefMarkerIntentAction[] = [
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

const allowedStatuses: Array<QwenMarkerChatStructuredResponse['status']> = [
  'draft_intent',
  'needs_clarification',
  'needs_asset',
  'confirmed',
  'blocked',
]

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined
}

function parseJsonObjectText(value: string): unknown {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim()
  const candidate = fenced ?? trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return undefined
      }
    }
    return undefined
  }
}

function normalizeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.trim().toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function normalizeAction(value: unknown): ProjectEditBriefMarkerIntentAction | undefined {
  if (allowedActions.includes(value as ProjectEditBriefMarkerIntentAction)) return value as ProjectEditBriefMarkerIntentAction
  const token = normalizeToken(value)
  if (!token) return undefined
  if (/b_?roll|cutaway|city_broll|location_broll|add_city/.test(token)) return 'add_broll'
  if (/remove|cut|trim|delete/.test(token)) return 'remove_or_cut'
  if (/keep|emphasize|highlight/.test(token)) return 'keep_or_emphasize'
  if (/caption|subtitle|text/.test(token)) return 'add_caption_or_text'
  if (/graphic|ui|card|overlay/.test(token)) return 'add_graphic_or_ui_card'
  if (/music|soundtrack/.test(token)) return 'add_music_or_soundtrack'
  if (/sfx|sound_effect|sound_design/.test(token)) return 'add_sfx'
  if (/voiceover|voice_over|narration/.test(token)) return 'add_voiceover'
  if (/transition|fade/.test(token)) return 'add_transition'
  if (/speed|pacing|pace|faster|slower/.test(token)) return 'adjust_speed_or_pacing'
  if (/color|tone|grade/.test(token)) return 'adjust_color_or_tone'
  if (/avoid|do_not|dont_use|no_music|no_sfx/.test(token)) return 'avoid_or_do_not_use'
  if (/general|note|instruction|unspecified/.test(token)) return 'general_instruction'
  return undefined
}

function normalizeStatus(value: unknown): QwenMarkerChatStructuredResponse['status'] | undefined {
  if (allowedStatuses.includes(value as QwenMarkerChatStructuredResponse['status'])) return value as QwenMarkerChatStructuredResponse['status']
  const token = normalizeToken(value)
  if (!token) return undefined
  if (/draft|intent|proposed|suggested/.test(token)) return 'draft_intent'
  if (/clarif|question|unclear/.test(token)) return 'needs_clarification'
  if (/asset|media|attachment|missing/.test(token)) return 'needs_asset'
  if (/confirm|approved|clear|ready/.test(token)) return 'confirmed'
  if (/block|unsafe|conflict/.test(token)) return 'blocked'
  return undefined
}

function normalizeConfidence(value: unknown): 'low' | 'medium' | 'high' | undefined {
  if (value === 'low' || value === 'medium' || value === 'high') return value
  const token = normalizeToken(value)
  if (token === 'med' || token === 'moderate') return 'medium'
  if (token === 'certain' || token === 'strong') return 'high'
  if (token === 'weak') return 'low'
  return undefined
}

function hasUnsafeCopyInstruction(values: string[]): boolean {
  return values.some((value) => {
    const text = value.toLowerCase()
    if (/do not|don't|avoid|never/.test(text)) return false
    return /copy exactly|recreate exact shot|match exact reference|clone the source|copy the creator/.test(text)
  })
}

function validationResult(input: {
  ok: boolean
  status: QwenStructuredResponseValidationResult['status']
  response?: QwenMarkerChatStructuredResponse
  errors?: string[]
  warnings?: string[]
}): QwenStructuredResponseValidationResult {
  return {
    ...createQwenRuntimeSafetyFlags(),
    ok: input.ok,
    status: input.status,
    response: input.response,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
  }
}

export function normalizeQwenStructuredResponseCandidate(candidate: unknown): unknown {
  if (typeof candidate === 'string') {
    return parseJsonObjectText(candidate)
  }
  return candidate
}

export function validateQwenMarkerChatStructuredResponse(candidateInput: unknown): QwenStructuredResponseValidationResult {
  const candidate = normalizeQwenStructuredResponseCandidate(candidateInput)
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return validationResult({ ok: false, status: 'invalid_empty_response', errors: ['Qwen structured response must be an object.'] })
  }
  const record = candidate as Record<string, unknown>
  const assistantMessage = stringValue(record.assistantMessage)
  if (!assistantMessage) return validationResult({ ok: false, status: 'invalid_missing_field', errors: ['assistantMessage is required.'] })
  const action = normalizeAction(record.action)
  if (!action) {
    return validationResult({ ok: false, status: 'invalid_unsupported_action', errors: ['Unsupported Qwen Marker Chat action.'] })
  }
  const status = normalizeStatus(record.status)
  if (!status) {
    return validationResult({ ok: false, status: 'invalid_unsupported_status', errors: ['Unsupported Qwen Marker Chat status.'] })
  }
  const plannerHints = stringArray(record.plannerHints)
  const blockingNeeds = stringArray(record.blockingNeeds)
  const doNotCopyNotes = stringArray(record.doNotCopyNotes)
  const safetyWarnings = stringArray(record.safetyWarnings)
  if (!plannerHints || !blockingNeeds || !doNotCopyNotes || !safetyWarnings) {
    return validationResult({ ok: false, status: 'invalid_array_field', errors: ['plannerHints, blockingNeeds, doNotCopyNotes, and safetyWarnings must be string arrays.'] })
  }
  const suggestions = record.suggestions === undefined ? undefined : stringArray(record.suggestions)
  if (record.suggestions !== undefined && !suggestions) {
    return validationResult({ ok: false, status: 'invalid_array_field', errors: ['suggestions must be a string array when present.'] })
  }
  const confidence = normalizeConfidence(record.confidence)
  if (!confidence) return validationResult({ ok: false, status: 'invalid_missing_field', errors: ['confidence must be low, medium, or high.'] })
  const unsafeStrings = [
    assistantMessage,
    ...plannerHints,
    ...blockingNeeds,
    ...doNotCopyNotes,
    ...safetyWarnings,
    ...(suggestions ?? []),
  ]
  if (hasUnsafeCopyInstruction(unsafeStrings)) {
    return validationResult({ ok: false, status: 'invalid_unsafe_copy_instruction', errors: ['Qwen response contained unsafe exact-copy instruction.'] })
  }

  return validationResult({
    ok: true,
    status: 'valid',
    response: {
      assistantMessage,
      action,
      status: status as Extract<ProjectEditBriefMarkerIntentStatus, 'draft_intent' | 'needs_clarification' | 'needs_asset' | 'confirmed' | 'blocked'>,
      visualBehavior: stringValue(record.visualBehavior) ?? 'unspecified',
      audioBehavior: stringValue(record.audioBehavior) ?? 'unspecified',
      captionBehavior: stringValue(record.captionBehavior) ?? 'unspecified',
      assetRequirement: stringValue(record.assetRequirement),
      confidence,
      blockingNeeds,
      plannerHints,
      doNotCopyNotes,
      clarificationQuestion: stringValue(record.clarificationQuestion),
      suggestions,
      safetyWarnings,
    },
    warnings: ['Qwen Marker Chat structured response passed validation before persistence.'],
  })
}
