import type {
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  MusicCueSheetRecord,
  ReferenceMusicDNARecord,
  ReferenceStyleAdaptationPlanRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

const universalNegativePrompt =
  'Do not imitate or copy any existing song, melody, lyrics, artist, track, exact cue timing, title-card sound, or copyrighted SFX.'

function promptForCue(params: {
  item: MusicCueSheetItemRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  adaptationPlan?: ReferenceStyleAdaptationPlanRecord
}) {
  const { adaptationPlan, item, referenceMusicDNA } = params
  const mood = item.mood.replaceAll('_', ' ')
  const genreHints = item.genreHints.map((hint) => hint.replaceAll('_', ' ')).join(', ')
  const referenceSummary = referenceMusicDNA
    ? `Reference influence: ${referenceMusicDNA.styleSummary}`
    : 'Reference influence: none.'

  return [
    'Create original ReeditPro music from style DNA only.',
    `Cue role: ${item.cueRole.replaceAll('_', ' ')}.`,
    `Mood: ${mood}. Energy: ${item.energyLevel.replaceAll('_', ' ')}.`,
    `Broad genre family hints: ${genreHints || 'cinematic lifestyle'}.`,
    `Vocal policy: ${item.vocalPolicy.replaceAll('_', ' ')}. Speech safety: ${item.speechSafety.replaceAll('_', ' ')}.`,
    referenceSummary,
    ...(adaptationPlan?.musicAdaptationRules ?? []),
    'Do not include exact reference track names, artist names, copyrighted lyrics, or copied timing.',
  ].join(' ')
}

export function createLyriaPromptPlan(input: {
  cueSheet: MusicCueSheetRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  adaptationPlan?: ReferenceStyleAdaptationPlanRecord
}): LyriaPromptPlanRecord[] {
  return input.cueSheet.items.map((item) => ({
    id: createMockId('lyria-prompt-plan'),
    cueSheetItemId: item.id,
    referenceDnaId: input.referenceMusicDNA?.id ?? input.adaptationPlan?.referenceDnaId,
    promptTitle: `${item.label} prompt`,
    prompt: promptForCue({
      item,
      referenceMusicDNA: input.referenceMusicDNA,
      adaptationPlan: input.adaptationPlan,
    }),
    negativePrompt: [
      universalNegativePrompt,
      ...item.doNotCopyNotes,
      ...(input.adaptationPlan?.doNotCopyRules ?? input.referenceMusicDNA?.doNotCopyRules ?? []),
    ].join(' '),
    styleDnaOnly: true,
    blockedReferenceContent: [
      'track names',
      'artist names',
      'lyrics',
      'melodies',
      'exact cue timing',
      'copyrighted sound effects',
    ],
    adaptationRules: [
      ...item.adaptationNotes,
      ...(input.adaptationPlan?.musicAdaptationRules ?? []),
    ],
    speechSafety: item.speechSafety,
    vocalPolicy: item.vocalPolicy,
    createdAt: nowIso(),
  }))
}
