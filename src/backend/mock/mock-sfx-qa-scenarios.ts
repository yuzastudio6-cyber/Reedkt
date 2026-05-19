import type {
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXMixPlanRecord,
  SFXQAIssueType,
  SFXQARecommendedAction,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
} from '../../types'
import type { MockSFXMixScenario } from './mock-sfx-mix-scenarios'
import { getMockSFXMixScenarioById, mockSFXMixScenarios } from './mock-sfx-mix-scenarios'

export type MockSFXQAExpectedDecision =
  | 'use'
  | 'adjust'
  | 'regenerate'
  | 'remove'
  | 'replace'
  | 'ask_user'

export interface MockSFXQAScenario {
  id: string
  label: string
  mixScenarioId: string
  mockOutputSummary: string
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  eventOverrides?: Partial<SFXEventPlanRecord>
  generatedAssetOverrides?: Partial<SFXGeneratedAssetRecord>
  trimOverrides?: Partial<SFXTrimPlanRecord>
  timingOverrides?: Partial<SFXTimingAlignmentRecord>
  mixOverrides?: Partial<SFXMixPlanRecord>
  expectedIssues: SFXQAIssueType[]
  expectedScoreRange: {
    min: number
    max: number
  }
  expectedRecommendedAction: SFXQARecommendedAction
  expectedDecision: MockSFXQAExpectedDecision
}

export const mockSFXQAScenarios: MockSFXQAScenario[] = [
  {
    id: 'soft-transition-whoosh-passes',
    label: 'Soft transition whoosh passes QA',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Clean soft transition whoosh, timed correctly, low under dialogue, no artifacts.',
    expectedIssues: [],
    expectedScoreRange: { min: 88, max: 100 },
    expectedRecommendedAction: 'use',
    expectedDecision: 'use',
  },
  {
    id: 'transition-too-loud-under-dialogue',
    label: 'Transition whoosh too loud under dialogue',
    mixScenarioId: 'bad-impact-under-dialogue',
    mockOutputSummary: 'Impact transition is too loud and fights voice under important dialogue.',
    expectedIssues: ['too_loud', 'fights_voice'],
    expectedScoreRange: { min: 45, max: 75 },
    expectedRecommendedAction: 'lower_volume',
    expectedDecision: 'adjust',
  },
  {
    id: 'transition-hit-lands-late',
    label: 'Transition whoosh hit lands late',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Transition hit late by 180ms against the cut.',
    timingOverrides: { hitTimeSeconds: 10.18 },
    expectedIssues: ['late_hit'],
    expectedScoreRange: { min: 65, max: 85 },
    expectedRecommendedAction: 'trim_again',
    expectedDecision: 'adjust',
  },
  {
    id: 'luxury-title-hit-too-harsh',
    label: 'Chapter title hit too harsh for luxury',
    mixScenarioId: 'chapter-title-premium-hit',
    mockOutputSummary: 'Luxury premium title hit sounds too harsh, wrong style, not premium enough.',
    expectedIssues: ['wrong_style'],
    expectedScoreRange: { min: 45, max: 72 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'graphic-card-reveal-cheap-cartoon',
    label: 'Graphic card reveal sounds cheap/cartoonish',
    mixScenarioId: 'graphic-card-reveal',
    mockOutputSummary: 'Graphic reveal uses a cheap viral beep and cartoon pop instead of clean premium polish.',
    expectedIssues: ['wrong_style', 'cartoonish_when_should_be_premium'],
    expectedScoreRange: { min: 35, max: 70 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'stroke-motion-line-draw-passes',
    label: 'Stroke Motion line draw passes QA',
    mixScenarioId: 'stroke-line-draw',
    mockOutputSummary: 'Subtle stroke draw texture synced to the line, low volume, safe under speech, no artifacts.',
    expectedIssues: [],
    expectedScoreRange: { min: 88, max: 100 },
    expectedRecommendedAction: 'use',
    expectedDecision: 'use',
  },
  {
    id: 'stroke-motion-line-draw-scratchy',
    label: 'Stroke Motion line draw too scratchy/harsh',
    mixScenarioId: 'stroke-line-draw',
    mockOutputSummary: 'Stroke draw sound is scratchy, harsh highs, and provider output low quality.',
    expectedIssues: ['audio_artifact'],
    expectedScoreRange: { min: 35, max: 68 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'real-motion-object-settle-passes',
    label: 'Real Motion object settle passes QA',
    mixScenarioId: 'real-motion-object-settle',
    mockOutputSummary: 'Room-matched Real Motion object settle is soft, realistic, and aligned to settle frame.',
    expectedIssues: [],
    expectedScoreRange: { min: 86, max: 100 },
    expectedRecommendedAction: 'use',
    expectedDecision: 'use',
  },
  {
    id: 'real-motion-object-settle-cartoon-bounce',
    label: 'Real Motion object settle sounds like cartoon bounce',
    mixScenarioId: 'real-motion-object-settle',
    mockOutputSummary: 'Real Motion object settle has a cartoon bounce and cinematic boom that does not match the room.',
    expectedIssues: ['cartoonish_when_should_be_premium'],
    expectedScoreRange: { min: 35, max: 70 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'cta-reveal-childish-chime',
    label: 'CTA reveal chime too childish',
    mixScenarioId: 'cta-reveal-chime',
    mockOutputSummary: 'CTA reveal chime feels childish and cartoon instead of clean warm resolve.',
    expectedIssues: ['cartoonish_when_should_be_premium'],
    expectedScoreRange: { min: 50, max: 78 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'montage-beat-accent-passes',
    label: 'Montage beat accent passes QA',
    mixScenarioId: 'montage-beat-accent',
    mockOutputSummary: 'Beat accent lands on the music beat, controlled impact, no speech overlap, no artifacts.',
    expectedIssues: [],
    expectedScoreRange: { min: 86, max: 100 },
    expectedRecommendedAction: 'use',
    expectedDecision: 'use',
  },
  {
    id: 'ambient-bridge-fights-ambience',
    label: 'Ambient bridge fights ambience',
    mixScenarioId: 'ambience-important-bridge',
    mockOutputSummary: 'Ambient bridge fights ambience and does not room match the food/social scene.',
    expectedIssues: ['other'],
    expectedScoreRange: { min: 65, max: 86 },
    expectedRecommendedAction: 'use_with_mix_adjustment',
    expectedDecision: 'adjust',
  },
  {
    id: 'faith-teaching-sfx-removed',
    label: 'Faith teaching SFX should be removed',
    mixScenarioId: 'faith-teaching-whisper',
    mockOutputSummary: 'Faith teaching emotional pause has a whoosh under speech, serious teaching should avoid this SFX.',
    eventOverrides: { decisionState: 'avoid', targetLayer: 'none', volumeProfile: 'none' },
    avoidSFXInstructions: ['Do not add SFX under emotional pauses.'],
    expectedIssues: ['not_needed'],
    expectedScoreRange: { min: 30, max: 70 },
    expectedRecommendedAction: 'remove_sfx',
    expectedDecision: 'remove',
  },
  {
    id: 'simple-talking-head-no-sfx',
    label: 'Simple talking-head cut does not need SFX',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Simple talking-head cut does not need SFX; voice clarity and ambience are enough.',
    eventOverrides: { decisionState: 'not_needed', targetLayer: 'none', volumeProfile: 'none' },
    expectedIssues: [],
    expectedScoreRange: { min: 40, max: 80 },
    expectedRecommendedAction: 'remove_sfx',
    expectedDecision: 'remove',
  },
  {
    id: 'fitness-impact-hit-warning',
    label: 'Fitness impact hit passes with warning',
    mixScenarioId: 'fitness-impact-hit',
    mockOutputSummary: 'Fitness impact hit is strong and beat-aligned, controlled for no-speech social montage.',
    expectedIssues: [],
    expectedScoreRange: { min: 76, max: 96 },
    expectedRecommendedAction: 'use',
    expectedDecision: 'use',
  },
  {
    id: 'bad-trim-cuts-off-hit',
    label: 'Bad trim cuts off hit',
    mixScenarioId: 'chapter-title-premium-hit',
    mockOutputSummary: 'Bad trim cut off hit on chapter title reveal.',
    trimOverrides: { requiresManualReview: true, trimEndSeconds: 0.95 },
    expectedIssues: ['bad_trim'],
    expectedScoreRange: { min: 45, max: 75 },
    expectedRecommendedAction: 'trim_again',
    expectedDecision: 'adjust',
  },
  {
    id: 'long-tail-overlaps-speech',
    label: 'Long tail overlaps speech',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Long tail over speech covers dialogue after the transition.',
    trimOverrides: { tailMs: 2200 },
    timingOverrides: { tailMs: 2200 },
    expectedIssues: ['tail_too_long', 'fights_voice'],
    expectedScoreRange: { min: 50, max: 78 },
    expectedRecommendedAction: 'trim_again',
    expectedDecision: 'adjust',
  },
  {
    id: 'provider-output-artifact',
    label: 'Provider output has artifact',
    mixScenarioId: 'graphic-card-reveal',
    mockOutputSummary: 'Generated provider output has artifact, glitch, distortion, and bad AI texture.',
    generatedAssetOverrides: { qaStatus: 'failed' },
    expectedIssues: ['audio_artifact'],
    expectedScoreRange: { min: 25, max: 62 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'regenerate',
  },
  {
    id: 'fake-footsteps-source-policy-rejected',
    label: 'Source-footage fake footsteps rejected by policy',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Fake footsteps and clothing source-action SFX were added to normal footage without full sound design request.',
    eventOverrides: {
      decisionState: 'avoid',
      targetLayer: 'source_footage_repair',
      sourceFootagePolicy: 'edit_layer_only_default',
    },
    expectedIssues: ['does_not_match_edit_layer'],
    expectedScoreRange: { min: 20, max: 60 },
    expectedRecommendedAction: 'remove_sfx',
    expectedDecision: 'remove',
  },
  {
    id: 'library-replacement-soft-whoosh',
    label: 'Library replacement recommended for common soft whoosh',
    mixScenarioId: 'dialogue-transition-whoosh',
    mockOutputSummary: 'Common soft whoosh has wrong style but approved library match is available; library replacement recommended.',
    expectedIssues: ['wrong_style'],
    expectedScoreRange: { min: 45, max: 76 },
    expectedRecommendedAction: 'regenerate',
    expectedDecision: 'replace',
  },
]

export function getMockSFXQAScenarioById(id: string): MockSFXQAScenario | undefined {
  return mockSFXQAScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSFXQAScenario(): MockSFXQAScenario {
  return mockSFXQAScenarios[0]
}

export function getMockSFXQAMixScenario(scenario: MockSFXQAScenario): MockSFXMixScenario {
  return getMockSFXMixScenarioById(scenario.mixScenarioId) ?? mockSFXMixScenarios[0]
}
