import type { StoryTimingPlanningSources } from '../contracts/storytiming-contracts'
import type { EditComplexity } from '../../types/planning'
import type { TargetPlatform } from '../../types/shared'
import {
  mockStoryTimingScenarios,
  type MockStoryTimingScenario,
} from './mock-storytiming-scenarios'

export interface MockMusicSFXTimingScenario {
  id: string
  label: string
  description: string
  projectId: string
  editPlanId: string
  targetPlatform?: TargetPlatform
  editComplexity?: EditComplexity
  userTimingInstructions: string[]
  avoidTimingInstructions: string[]
  inputTimingSources: StoryTimingPlanningSources
  expectedAnchors: string[]
  expectedEvents: string[]
  expectedBeatGrid: string[]
  expectedDependencies: string[]
  expectedConflicts: string[]
  expectedQAChecks: string[]
}

const cloneSources = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources =>
  JSON.parse(JSON.stringify(sources)) as StoryTimingPlanningSources

const base = (index = 0): MockStoryTimingScenario =>
  mockStoryTimingScenarios[index] ?? mockStoryTimingScenarios[0]

const withMusicDuckLate = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => {
  const next = cloneSources(sources)
  next.musicMixPlans = (next.musicMixPlans ?? []).map((mixPlan) => ({
    ...mixPlan,
    mixNotes: [...mixPlan.mixNotes, 'force_music_duck_late'],
  }))
  return next
}

const withSfxLate = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => {
  const next = cloneSources(sources)
  next.sfxTimingAlignments = (next.sfxTimingAlignments ?? []).map((alignment) => ({
    ...alignment,
    hitTimeSeconds: Number((alignment.hitTimeSeconds + 0.18).toFixed(3)),
    notes: [...alignment.notes, 'force_sfx_hit_late'],
  }))
  return next
}

const withSfxTailSpeech = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => {
  const next = cloneSources(sources)
  next.sfxTimingAlignments = (next.sfxTimingAlignments ?? []).map((alignment) => ({
    ...alignment,
    endTimeSeconds: Number((alignment.hitTimeSeconds + 1.2).toFixed(3)),
    tailMs: 900,
    notes: [...alignment.notes, 'force_sfx_tail_over_speech'],
  }))
  return next
}

const withDenseSfx = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => {
  const next = cloneSources(sources)
  const first = next.sfxTimingAlignments?.[0]
  if (first) {
    next.sfxTimingAlignments = [
      first,
      {
        ...first,
        id: `${first.id}-dense-2`,
        hitTimeSeconds: first.hitTimeSeconds + 0.08,
        startTimeSeconds: first.startTimeSeconds + 0.08,
        endTimeSeconds: first.endTimeSeconds + 0.08,
      },
      {
        ...first,
        id: `${first.id}-dense-3`,
        hitTimeSeconds: first.hitTimeSeconds + 0.16,
        startTimeSeconds: first.startTimeSeconds + 0.16,
        endTimeSeconds: first.endTimeSeconds + 0.16,
      },
    ]
  }
  return next
}

const withAmbienceMasked = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => {
  const next = withDenseSfx(sources)
  next.musicCues = (next.musicCues ?? []).map((cue) => ({
    ...cue,
    ambienceNotes: [...cue.ambienceNotes, 'force_ambience_masked'],
    adaptationNotes: [...cue.adaptationNotes, 'force_ambience_masked'],
  }))
  return next
}

const scenario = (input: {
  id: string
  label: string
  description: string
  baseScenario?: MockStoryTimingScenario
  sources?: StoryTimingPlanningSources
  instructions?: string[]
  avoid?: string[]
  conflicts?: string[]
  beatGrid?: string[]
}): MockMusicSFXTimingScenario => {
  const selectedBase = input.baseScenario ?? base(0)
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    projectId: selectedBase.projectId,
    editPlanId: selectedBase.editPlanId,
    targetPlatform: selectedBase.targetPlatform,
    editComplexity: selectedBase.editComplexity,
    userTimingInstructions: input.instructions ?? selectedBase.userTimingInstructions,
    avoidTimingInstructions: input.avoid ?? selectedBase.avoidTimingInstructions,
    inputTimingSources: input.sources ?? cloneSources(selectedBase.inputTimingSources),
    expectedAnchors: ['music_beat', 'music_downbeat', 'sfx_hit', 'sfx_tail'],
    expectedEvents: ['music_cue_start', 'music_cue_end', 'music_duck_start', 'music_duck_end', 'sfx_start', 'sfx_hit', 'sfx_end'],
    expectedBeatGrid: input.beatGrid ?? ['mock beat grid', 'downbeat anchors'],
    expectedDependencies: ['duck starts before speech', 'sfx hit syncs to anchor', 'transition can sync to downbeat'],
    expectedConflicts: input.conflicts ?? [],
    expectedQAChecks: ['music_beat_alignment', 'music_ducking_timing', 'sfx_hit_alignment', 'sfx_tail_safety', 'overall_rhythm'],
  }
}

export const mockMusicSFXTimingScenarios: MockMusicSFXTimingScenario[] = [
  scenario({
    id: 'lifestyle_vacation_multi_cue_music_timing',
    label: 'Lifestyle/vacation multi-cue music timing',
    description: 'Lake Como style timing with teaser, dialogue bed, montage, title hit, and outro resolve.',
  }),
  scenario({
    id: 'dialogue_bed_music_ducking',
    label: 'Dialogue bed music ducking',
    description: 'Music ducks before dialogue and releases after speech.',
    instructions: ['voice-first music ducking', 'keep SFX subtle under speech'],
  }),
  scenario({
    id: 'montage_beat_grid_and_sfx_hits',
    label: 'Montage beat grid and SFX hits',
    description: 'Montage section creates mock beat grid and aligns SFX hits to downbeats.',
    baseScenario: base(4),
    instructions: ['montage beat grid drives non-speech cuts and SFX'],
    beatGrid: ['128 BPM mock estimate', 'downbeats for montage'],
  }),
  scenario({
    id: 'chapter_title_hit_synced_to_music_cue',
    label: 'Chapter title hit synced to music cue',
    description: 'Title SFX hit lands on a music cue or drop anchor.',
  }),
  scenario({
    id: 'transition_whoosh_hit_on_cut',
    label: 'Transition whoosh hit on cut',
    description: 'Transition SFX uses cut/transition timing as the sync anchor.',
  }),
  scenario({
    id: 'sfx_hit_synced_to_downbeat',
    label: 'SFX hit synced to downbeat',
    description: 'SFX hit is allowed to follow downbeat timing in a montage-safe section.',
    baseScenario: base(4),
  }),
  scenario({
    id: 'food_social_ambience_preservation',
    label: 'Food/social ambience preservation',
    description: 'Music and SFX stay restrained so source ambience remains meaningful.',
    instructions: ['preserve food/social ambience', 'avoid dense SFX'],
  }),
  scenario({
    id: 'faith_serious_voice_first_music_timing',
    label: 'Faith/serious voice-first music timing',
    description: 'Subtle music, whisper/none SFX, and emotional pauses stay dominant.',
    baseScenario: base(2),
    instructions: ['faith teaching voice-first', 'SFX whisper only or none'],
  }),
  scenario({
    id: 'fitness_high_energy_beat_timing',
    label: 'Fitness high-energy beat timing',
    description: 'Beat timing can lead non-speech sections while voice remains protected.',
    baseScenario: base(4),
    instructions: ['fitness high-energy beat timing', 'keep key speech clear'],
  }),
  scenario({
    id: 'real_estate_luxury_subtle_transition_timing',
    label: 'Real estate/luxury subtle transition timing',
    description: 'Smooth cue changes and subtle SFX preserve premium ambience.',
    instructions: ['luxury subtle transitions', 'preserve spatial ambience'],
  }),
  scenario({
    id: 'music_ducking_starts_late_conflict',
    label: 'Music ducking starts late conflict',
    description: 'Speech begins before music ducks, creating a voice-safety conflict.',
    sources: withMusicDuckLate(base(0).inputTimingSources),
    conflicts: ['music_ducking_misses_speech'],
  }),
  scenario({
    id: 'sfx_hit_lands_late_conflict',
    label: 'SFX hit lands late conflict',
    description: 'SFX hit is 180ms late and should be shifted earlier.',
    sources: withSfxLate(base(0).inputTimingSources),
    conflicts: ['sfx_hit_late'],
  }),
  scenario({
    id: 'sfx_tail_overlaps_speech_conflict',
    label: 'SFX tail overlaps speech conflict',
    description: 'SFX tail spills into the next speech window.',
    sources: withSfxTailSpeech(base(0).inputTimingSources),
    conflicts: ['sfx_tail_over_speech'],
  }),
  scenario({
    id: 'too_many_sfx_hits_conflict',
    label: 'Too many SFX hits conflict',
    description: 'Multiple SFX hits crowd one timing moment.',
    sources: withDenseSfx(base(0).inputTimingSources),
    conflicts: ['too_many_events_same_moment'],
  }),
  scenario({
    id: 'ambience_masked_by_music_sfx_conflict',
    label: 'Ambience masked by music/SFX conflict',
    description: 'Dense music/SFX risks masking source ambience.',
    sources: withAmbienceMasked(base(0).inputTimingSources),
    conflicts: ['manual_review_needed'],
  }),
  scenario({
    id: 'music_cue_ends_before_outro_resolve_conflict',
    label: 'Music cue ends before outro resolve conflict',
    description: 'Cue timing should be reviewed because the outro resolve needs a clean finish.',
    instructions: ['review cue ending against outro resolve'],
    conflicts: ['manual_review_needed'],
  }),
]

export function getMockMusicSFXTimingScenarioById(id: string): MockMusicSFXTimingScenario | undefined {
  return mockMusicSFXTimingScenarios.find((scenarioItem) => scenarioItem.id === id)
}

export function getDefaultMockMusicSFXTimingScenario(): MockMusicSFXTimingScenario {
  return mockMusicSFXTimingScenarios[0]
}
