import type { StoryTimingPlanningSources } from '../contracts/storytiming-contracts'
import {
  getMockStoryTimingScenarioById,
  mockStoryTimingScenarios,
} from './mock-storytiming-scenarios'

export interface MockCaptionCutTimingScenario {
  id: string
  label: string
  description: string
  projectId: string
  editPlanId: string
  userTimingInstructions: string[]
  avoidTimingInstructions: string[]
  inputTimingSources: StoryTimingPlanningSources
  expectedAnchors: string[]
  expectedCaptionEvents: string[]
  expectedCutEvents: string[]
  expectedConflicts: string[]
  expectedQAChecks: string[]
}

const cloneSources = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => ({
  ...sources,
  editPlanSegments: sources.editPlanSegments.map((segment) => ({ ...segment, metadata: { ...(segment.metadata ?? {}) } })),
  storyBeats: sources.storyBeats?.map((beat) => ({ ...beat, metadata: { ...(beat.metadata ?? {}) } })),
  pacingAnalysis: sources.pacingAnalysis?.map((analysis) => ({ ...analysis, metadata: { ...(analysis.metadata ?? {}) } })),
  cutDecisions: sources.cutDecisions?.map((cut) => ({ ...cut, metadata: { ...(cut.metadata ?? {}) } })),
  captionPlans: sources.captionPlans?.map((caption) => ({ ...caption, metadata: { ...(caption.metadata ?? {}) } })),
  signatureRoutes: sources.signatureRoutes?.map((route) => ({ ...route, metadata: { ...(route.metadata ?? {}) } })),
})

const baseSources = (baseId: string): StoryTimingPlanningSources =>
  cloneSources(
    getMockStoryTimingScenarioById(baseId)?.inputTimingSources ??
      mockStoryTimingScenarios[0].inputTimingSources,
  )

const withLongCaption = (sources: StoryTimingPlanningSources): StoryTimingPlanningSources => ({
  ...sources,
  editPlanSegments: sources.editPlanSegments.map((segment, index) =>
    index === 1
      ? {
          ...segment,
          transcriptText:
            'This is a very long caption line that explains the entire point at once and should clearly be split into smaller readable phrases for the viewer.',
        }
      : segment,
  ),
})

const makeScenario = (input: {
  id: string
  label: string
  description: string
  baseId: string
  instructions?: string[]
  avoid?: string[]
  sources?: (sources: StoryTimingPlanningSources) => StoryTimingPlanningSources
  expectedConflicts?: string[]
}): MockCaptionCutTimingScenario => {
  const base = getMockStoryTimingScenarioById(input.baseId) ?? mockStoryTimingScenarios[0]
  const sources = input.sources ? input.sources(baseSources(input.baseId)) : baseSources(input.baseId)

  return {
    id: input.id,
    label: input.label,
    description: input.description,
    projectId: base.projectId,
    editPlanId: base.editPlanId,
    userTimingInstructions: [
      ...base.userTimingInstructions,
      ...(input.instructions ?? []),
    ],
    avoidTimingInstructions: [
      ...base.avoidTimingInstructions,
      ...(input.avoid ?? []),
    ],
    inputTimingSources: sources,
    expectedAnchors: ['phrase', 'sentence', 'word emphasis', 'pause/breath when pacing requires it'],
    expectedCaptionEvents: ['caption_on', 'caption_off', 'caption_emphasis'],
    expectedCutEvents: ['cut'],
    expectedConflicts: input.expectedConflicts ?? [],
    expectedQAChecks: [
      'caption_sync',
      'caption_readability_duration',
      'caption_overlay_collision',
      'speech_cut_integrity',
      'emotional_pause_preservation',
      'platform_pacing',
    ],
  }
}

export const mockCaptionCutTimingScenarios: MockCaptionCutTimingScenario[] = [
  makeScenario({
    id: 'talking_head_clean_edit_captions_cuts',
    label: 'Talking-head clean edit captions and cuts',
    description: 'Phrase captions, dead-space cleanup, useful breath preservation, and meaning-safe cuts.',
    baseId: 'simple_talking_head_clean_edit',
  }),
  makeScenario({
    id: 'faith_teaching_emotional_pause',
    label: 'Faith/Bible teaching with emotional pause',
    description: 'Readable captions and protected emotional pause with no aggressive cut timing.',
    baseId: 'faith_bible_teaching_timing',
    expectedConflicts: ['emotional_pause_removed'],
  }),
  makeScenario({
    id: 'social_short_fast_captions',
    label: 'Social short with fast captions',
    description: 'Tighter caption pacing and word emphasis without cutting phrase meaning.',
    baseId: 'fitness_high_energy_beat_timing',
    instructions: ['Use punchier captions but preserve meaning.'],
  }),
  makeScenario({
    id: 'lifestyle_vacation_dialogue',
    label: 'Lifestyle/vacation dialogue section',
    description: 'Lake Como dialogue with comfortable phrase captions and title-safe cut timing.',
    baseId: 'lake_como_lifestyle_timing',
  }),
  makeScenario({
    id: 'product_saas_explainer_captions',
    label: 'Product/SaaS explainer captions',
    description: 'Educational clear captions with visual-comprehension cut timing.',
    baseId: 'product_demo_saas_explanation_timing',
  }),
  makeScenario({
    id: 'real_estate_walkthrough_captions',
    label: 'Real estate walkthrough captions',
    description: 'Smooth pacing, readable captions, and luxury-safe cut timing.',
    baseId: 'real_estate_luxury_walkthrough_timing',
  }),
  makeScenario({
    id: 'podcast_clip_jump_cuts',
    label: 'Podcast clip jump cuts',
    description: 'Clean jump cuts preserve sentence meaning and audio continuity.',
    baseId: 'simple_talking_head_clean_edit',
    instructions: ['Use clean jump cuts only after complete phrases.'],
  }),
  makeScenario({
    id: 'caption_overlaps_graphic_overlay',
    label: 'Caption overlaps Graphic Design overlay',
    description: 'Deliberate caption/Graphic Design timing collision.',
    baseId: 'caption_conflict_with_overlay',
    expectedConflicts: ['caption_overlay_collision'],
  }),
  makeScenario({
    id: 'caption_overlaps_real_motion_object',
    label: 'Caption overlaps Real Motion object',
    description: 'Deliberate caption/Real Motion timing collision.',
    baseId: 'render_manifest_blocked_case',
    expectedConflicts: ['caption_overlay_collision', 'real_motion_blocks_face'],
  }),
  makeScenario({
    id: 'cut_before_phrase_completes',
    label: 'Cut before phrase completes',
    description: 'Cut lands inside inferred phrase timing and should require review.',
    baseId: 'emotional_pause_removed_conflict',
    expectedConflicts: ['cut_before_meaning_complete', 'emotional_pause_removed'],
  }),
  makeScenario({
    id: 'emotional_pause_removed_incorrectly',
    label: 'Emotional pause removed incorrectly',
    description: 'Cut removes a protected faith/serious teaching pause.',
    baseId: 'emotional_pause_removed_conflict',
    expectedConflicts: ['emotional_pause_removed'],
  }),
  makeScenario({
    id: 'dead_space_removed_correctly',
    label: 'Dead space removed correctly',
    description: 'Dead-space cleanup is allowed when it does not harm meaning.',
    baseId: 'simple_talking_head_clean_edit',
  }),
  makeScenario({
    id: 'j_cut_smooth_interview_transition',
    label: 'J-cut for smooth interview transition',
    description: 'Mock J-cut hint starts next audio slightly before the visual cut.',
    baseId: 'simple_talking_head_clean_edit',
    instructions: ['Use a J-cut for smoother interview flow.'],
  }),
  makeScenario({
    id: 'l_cut_documentary_transition',
    label: 'L-cut for documentary transition',
    description: 'Mock L-cut hint preserves previous audio after visual cut.',
    baseId: 'faith_bible_teaching_timing',
    instructions: ['Use an L-cut only if voice clarity remains safe.'],
  }),
  makeScenario({
    id: 'long_caption_needs_split',
    label: 'Long caption needs split',
    description: 'Long transcript line creates readability risk and split recommendation.',
    baseId: 'product_demo_saas_explanation_timing',
    sources: withLongCaption,
    expectedConflicts: ['caption_too_fast'],
  }),
  makeScenario({
    id: 'caption_lags_speech',
    label: 'Caption lags speech',
    description: 'Deliberate lagged caption reveal should be caught by caption QA.',
    baseId: 'simple_talking_head_clean_edit',
    instructions: ['force_caption_lag'],
    expectedConflicts: ['caption_too_late'],
  }),
]

export function getMockCaptionCutTimingScenarioById(id: string): MockCaptionCutTimingScenario | undefined {
  return mockCaptionCutTimingScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockCaptionCutTimingScenario(): MockCaptionCutTimingScenario {
  return mockCaptionCutTimingScenarios[0]
}
