import type {
  GeneratedMusicTrackRecord,
  MusicCueSheetItemRecord,
  MusicMixPlanRecord,
  MusicQAReportRecord,
  MusicTrackAnalysisRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

type MusicMixPreset = Omit<
  MusicMixPlanRecord,
  'id' | 'projectId' | 'cueSheetItemId' | 'generatedMusicTrackId' | 'qaReportId' | 'createdAt'
>

export function createCueCrossfadePlan(cue?: MusicCueSheetItemRecord) {
  if (!cue) {
    return {
      crossfadeWithPreviousSeconds: 0.5,
      crossfadeWithNextSeconds: 0.5,
      notes: ['Use short neutral crossfades until cue context is known.'],
    }
  }

  if (cue.sectionType === 'dialogue') {
    return {
      crossfadeWithPreviousSeconds: 0.75,
      crossfadeWithNextSeconds: 0.75,
      notes: ['Crossfade gently so dialogue does not feel abruptly covered.'],
    }
  }

  if (cue.sectionType === 'outro') {
    return {
      crossfadeWithPreviousSeconds: 1,
      crossfadeWithNextSeconds: 0,
      notes: ['Let outro resolve instead of forcing a copied endpoint.'],
    }
  }

  return {
    crossfadeWithPreviousSeconds: 1,
    crossfadeWithNextSeconds: 1,
    notes: ['Use category-level crossfades only; do not copy reference cue timing.'],
  }
}

export function createVoiceFirstDuckingPlan(): MusicMixPreset {
  return {
    targetVolumeDb: -24,
    duckingStrategy: 'voice_first_ducking',
    duckingAmountDb: 10,
    duckUnderSpeech: true,
    introFadeSeconds: 0.4,
    outroFadeSeconds: 1.2,
    crossfadeWithPreviousSeconds: 0.75,
    crossfadeWithNextSeconds: 0.75,
    beatSyncPoints: [],
    silenceMoments: ['Leave micro-pauses around key spoken phrases.'],
    ambientBridgeNeeded: false,
    sfxRelationship: 'SFX must sit below voice and never cover words.',
    mixNotes: [
      'Voice is priority.',
      'Keep music low and instrumental.',
      'Avoid busy melodies under speech.',
    ],
    status: 'needs_adjustment',
  }
}

export function createDialogueBedMixPlan() {
  return createVoiceFirstDuckingPlan()
}

export function createMontageMixPlan(): MusicMixPreset {
  return {
    targetVolumeDb: -13,
    duckingStrategy: 'none',
    duckingAmountDb: 0,
    duckUnderSpeech: false,
    introFadeSeconds: 0.25,
    outroFadeSeconds: 1,
    crossfadeWithPreviousSeconds: 1,
    crossfadeWithNextSeconds: 1,
    beatSyncPoints: ['Sync key motion cuts to broad beat accents.'],
    silenceMoments: [],
    ambientBridgeNeeded: false,
    sfxRelationship: 'SFX can punctuate transitions but should not duplicate beat hits.',
    mixNotes: [
      'Montage can carry stronger music.',
      'Lyrics or vocal texture are allowed only if no speech is present.',
    ],
    status: 'ready',
  }
}

export function createOutroResolveMixPlan(): MusicMixPreset {
  return {
    targetVolumeDb: -16,
    duckingStrategy: 'manual_keyframe_ducking',
    duckingAmountDb: 4,
    duckUnderSpeech: false,
    introFadeSeconds: 0.5,
    outroFadeSeconds: 2,
    crossfadeWithPreviousSeconds: 1,
    crossfadeWithNextSeconds: 0,
    beatSyncPoints: [],
    silenceMoments: ['Let the final image breathe after the last music tail.'],
    ambientBridgeNeeded: true,
    sfxRelationship: 'Avoid heavy SFX at the ending.',
    mixNotes: [
      'Outro needs a clean soft resolve.',
      'Use fade if the generated ending is abrupt.',
    ],
    status: 'needs_adjustment',
  }
}

export function createAmbienceBridgePlan(): MusicMixPreset {
  return {
    targetVolumeDb: -18,
    duckingStrategy: 'manual_keyframe_ducking',
    duckingAmountDb: 3,
    duckUnderSpeech: false,
    introFadeSeconds: 0.75,
    outroFadeSeconds: 1.5,
    crossfadeWithPreviousSeconds: 1,
    crossfadeWithNextSeconds: 1,
    beatSyncPoints: [],
    silenceMoments: ['Let real ambience lead transitions where music is not needed.'],
    ambientBridgeNeeded: true,
    sfxRelationship: 'SFX should be minimal so natural ambience remains believable.',
    mixNotes: [
      'Preserve natural ambience.',
      'Use music as support rather than replacement.',
    ],
    status: 'needs_adjustment',
  }
}

export function createSfxRelationshipPlan(cue?: MusicCueSheetItemRecord) {
  if (cue?.sectionType === 'chapter_title') {
    return 'Use a small original chapter hit below music peak; do not copy the reference sound.'
  }

  if (cue?.sectionType === 'transition') {
    return 'Use subtle original whooshes only if they clarify the transition.'
  }

  return 'SFX must support edits without overpowering voice, ambience, or music.'
}

export function createSilenceMomentsPlan(cue?: MusicCueSheetItemRecord) {
  if (cue?.sectionType === 'dialogue') {
    return ['Leave silence around key dialogue beats and emotional pauses.']
  }

  if (cue?.sectionType === 'outro') {
    return ['Let the outro breathe after the final fade.']
  }

  return []
}

function createTeaserMixPlan(): MusicMixPreset {
  return {
    targetVolumeDb: -12,
    duckingStrategy: 'manual_keyframe_ducking',
    duckingAmountDb: 5,
    duckUnderSpeech: false,
    introFadeSeconds: 0.15,
    outroFadeSeconds: 0.75,
    crossfadeWithPreviousSeconds: 0,
    crossfadeWithNextSeconds: 1,
    beatSyncPoints: ['Let teaser hit broad energy accents, not exact reference timing.'],
    silenceMoments: [],
    ambientBridgeNeeded: false,
    sfxRelationship: 'Keep teaser SFX punchy but original and restrained.',
    mixNotes: [
      'Coming-up teaser can be stronger.',
      'Transition cleanly into the main story.',
    ],
    status: 'ready',
  }
}

function presetForCue(cue: MusicCueSheetItemRecord | undefined, track: GeneratedMusicTrackRecord): MusicMixPreset {
  if (track.userInstructionTags.includes('faith_teaching')) return createVoiceFirstDuckingPlan()
  if (cue?.sectionType === 'dialogue' || track.hasSpeechInScene) return createDialogueBedMixPlan()
  if (cue?.sectionType === 'movement' || cue?.sectionType === 'montage') return createMontageMixPlan()
  if (cue?.sectionType === 'coming_up_teaser') return createTeaserMixPlan()
  if (cue?.sectionType === 'food_social' || track.userInstructionTags.includes('preserve_ambience')) return createAmbienceBridgePlan()
  if (cue?.sectionType === 'outro' || track.endingHint === 'abrupt' || track.endingHint === 'fade_needed') return createOutroResolveMixPlan()
  return createMontageMixPlan()
}

export function createMusicMixPlan(input: {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  qaReport?: MusicQAReportRecord
  cue?: MusicCueSheetItemRecord
}): MusicMixPlanRecord {
  const preset = presetForCue(input.cue, input.track)
  const crossfade = createCueCrossfadePlan(input.cue)
  const status = input.qaReport?.recommendedAction === 'regenerate' || input.qaReport?.recommendedAction === 'regenerate_without_vocals'
    ? 'needs_regeneration'
    : input.qaReport?.recommendedAction === 'use_with_mix_adjustment' || preset.status === 'needs_adjustment'
      ? 'needs_adjustment'
      : 'ready'

  return {
    ...preset,
    id: createMockId('music-mix-plan'),
    projectId: input.track.projectId,
    cueSheetItemId: input.cue?.id ?? input.track.cueSheetItemId,
    generatedMusicTrackId: input.track.id,
    qaReportId: input.qaReport?.id,
    targetVolumeDb: input.analysis.loudnessLufs > -10 && input.track.hasSpeechInScene
      ? Math.min(preset.targetVolumeDb, -24)
      : preset.targetVolumeDb,
    crossfadeWithPreviousSeconds: crossfade.crossfadeWithPreviousSeconds,
    crossfadeWithNextSeconds: crossfade.crossfadeWithNextSeconds,
    silenceMoments: [
      ...preset.silenceMoments,
      ...createSilenceMomentsPlan(input.cue),
    ],
    sfxRelationship: createSfxRelationshipPlan(input.cue),
    mixNotes: [
      ...preset.mixNotes,
      ...crossfade.notes,
      ...input.analysis.warnings.map((warning) => `Analysis warning: ${warning}`),
    ],
    status,
    createdAt: nowIso(),
  }
}
