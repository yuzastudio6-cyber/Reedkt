import type { ProjectEditBriefMarkerChatScenario } from '../../types/project-edit-brief-marker-chat'

const baseCases = [
  ['broll_needs_asset_confirm', 'Add city B-roll here but keep the speaker audio', 'extract_and_confirm', 'mock_confirmation', 'processed_needs_asset'],
  ['broll_attached_confirm', 'Use this attached B-roll clip here and keep original audio', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['caption_confirm', 'Add captions with smaller text', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['cut_confirm', 'Cut this section and remove the pause', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['keep_confirm', 'Keep and emphasize this travel reveal', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['graphic_confirm', 'Add a subtle graphic card overlay', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['music_confirm', 'Add music under the voice', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['sfx_confirm', 'Add a soft whoosh sound effect', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['voiceover_confirm', 'Add voiceover narration note', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['transition_confirm', 'Use a fade transition', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['speed_confirm', 'Make the pacing faster', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['color_confirm', 'Make the color warmer and cinematic', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['avoid_confirm', 'Do not use fake sounds here', 'extract_and_confirm', 'mock_confirmation', 'processed_confirmed'],
  ['vague_clarify', 'Make this better', 'extract_and_clarify', 'mock_clarifying_question', 'processed_needs_clarification'],
  ['suggest_options', 'Suggest options for this marker', 'extract_and_suggest', 'mock_suggestions', 'processed_intent_draft'],
  ['ai_off_note', 'Add captions here', 'extract_intent', 'none', 'processed_intent_draft'],
] as const

const modeSuffixes = [
  ['confirm_only', true],
  ['ask_clarifying_questions', true],
  ['suggest_options', true],
  ['off', true],
] as const

function scenarioFrom(index: number, base: typeof baseCases[number], suffix: typeof modeSuffixes[number]): ProjectEditBriefMarkerChatScenario {
  const [baseId, input, expectedMode, expectedKind, expectedStatus] = base
  const [mode] = suffix
  const adjustedMode = mode === 'off'
    ? 'extract_intent'
    : mode === 'suggest_options'
      ? 'extract_and_suggest'
      : mode === 'ask_clarifying_questions' && baseId === 'vague_clarify'
        ? 'extract_and_clarify'
        : expectedMode
  const adjustedKind = mode === 'off'
    ? 'none'
    : mode === 'suggest_options'
      ? 'mock_suggestions'
      : mode === 'ask_clarifying_questions' && baseId === 'vague_clarify'
        ? 'mock_clarifying_question'
        : expectedKind
  const adjustedStatus = mode === 'ask_clarifying_questions' && baseId === 'vague_clarify'
    ? 'processed_needs_clarification'
    : mode === 'suggest_options'
      ? 'processed_intent_draft'
      : mode === 'off'
        ? 'processed_intent_draft'
        : expectedStatus
  return {
    id: `rp_editbrief_07_marker_chat_${index}_${baseId}_${mode}`,
    title: `Marker Chat ${baseId.replace(/_/g, ' ')} with ${mode.replace(/_/g, ' ')}`,
    input: `${input} (${mode})`,
    expectedOk: true,
    expectedProcessingMode: adjustedMode,
    expectedResponseKind: adjustedKind,
    expectedExtractionStatus: adjustedStatus,
    mockOnly: true,
  }
}

export const MOCK_PROJECT_EDIT_BRIEF_MARKER_CHAT_SCENARIOS: ProjectEditBriefMarkerChatScenario[] = baseCases.flatMap((base, baseIndex) => (
  modeSuffixes.map((suffix, suffixIndex) => scenarioFrom((baseIndex * modeSuffixes.length) + suffixIndex + 1, base, suffix))
))

export function listMockProjectEditBriefMarkerChatScenarios(): ProjectEditBriefMarkerChatScenario[] {
  return [...MOCK_PROJECT_EDIT_BRIEF_MARKER_CHAT_SCENARIOS]
}
