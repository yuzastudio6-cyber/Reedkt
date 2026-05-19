import type {
  SFXAnchorType,
  SFXEventPlanRecord,
  SFXGeneratedDurationPolicy,
  SFXPromptPlanRecord,
  SFXProvider,
  SFXTargetLayer,
  SFXTimingValidationIssue,
  SFXVolumeProfile,
  SFXWaveformShape,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'

const createdAt = '2026-05-19T12:00:00.000Z'
const projectId = 'mock-sfx-timing-project'
const editPlanId = 'mock-sfx-timing-edit-plan'

export interface MockSFXTimingScenario {
  id: string
  label: string
  eventPlan: SFXEventPlanRecord
  promptPlan: SFXPromptPlanRecord
  mockGeneratedDurationSeconds: number
  mockWaveformShape: SFXWaveformShape
  expectedTrimWindow: {
    startSeconds: number
    endSeconds: number
  }
  expectedHitAlignment: {
    anchorTimeSeconds: number
    hitOffsetInsideTrimMs: number
  }
  expectedFinalPlacement: {
    startTimeSeconds: number
    hitTimeSeconds: number
    endTimeSeconds: number
  }
  expectedValidationIssues: SFXTimingValidationIssue[]
  speechPresent?: boolean
  musicBeatTimeSeconds?: number
}

function eventPlan(input: {
  id: string
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  anchorType: SFXAnchorType
  anchorTimeSeconds: number
  volumeProfile?: SFXVolumeProfile
  sceneContext: string
  videoTone?: string
}): SFXEventPlanRecord {
  return {
    id: `sfx_timing_event_${input.id}`,
    projectId,
    editPlanId,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    decisionState: 'needed',
    sourceFootagePolicy: input.targetLayer === 'source_footage_repair' ? 'allow_source_repair' : 'edit_layer_only_default',
    reason: `Mock timing scenario for ${input.targetLayer}.`,
    sceneContext: input.sceneContext,
    videoTone: input.videoTone ?? 'professional subtle',
    editLevel: 'signature',
    signatureSystem: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion'
      : input.targetLayer === 'graphic_design'
        ? 'graphic_design'
        : input.targetLayer === 'real_motion'
          ? 'real_motion'
          : 'sound_sync',
    anchorType: input.anchorType,
    anchorTimeSeconds: input.anchorTimeSeconds,
    timingPriority: input.anchorType === 'music_beat' ? 'beat_aligned' : 'frame_accurate',
    volumeProfile: input.volumeProfile ?? 'subtle_polish',
    mixPriority: 'voice_first',
    creditImpact: 'medium',
    requiresApproval: true,
    userVisibleSummary: input.sceneContext,
    avoidRules: ['Do not place generated SFX blindly.', 'Do not overpower dialogue.'],
    mustFollowRules: ['Trim before alignment.', 'Align the hit point to the timing anchor.'],
    status: 'planned',
    notes: ['Mock timing scenario only.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true, noAudioProcessing: true },
  }
}

function generatedDurationPolicy(durationToGenerateSeconds: number): SFXGeneratedDurationPolicy {
  if (durationToGenerateSeconds >= 6) return 'generate_6_to_8_seconds'
  if (durationToGenerateSeconds >= 3) return 'generate_3_to_5_seconds'
  return 'generate_2_to_3_seconds'
}

function promptPlan(input: {
  id: string
  eventPlan: SFXEventPlanRecord
  provider?: SFXProvider
  neededDurationSeconds: number
  durationToGenerateSeconds: number
  prompt: string
}): SFXPromptPlanRecord {
  return {
    id: `sfx_timing_prompt_${input.id}`,
    projectId,
    editPlanId,
    sfxEventPlanId: input.eventPlan.id,
    providerRouteId: `sfx_timing_route_${input.id}`,
    provider: input.provider ?? 'mirelo_sfx_v1_5',
    modelName: input.provider === 'mmaudio_v' ? 'mmaudio-v' : 'mirelo-sfx-v1.5',
    promptStyle: input.provider === 'mmaudio_v' ? 'video_conditioned_short_prompt' : 'structured_sentence',
    prompt: input.prompt,
    negativePrompt: 'no loud impact, no cartoon, no harsh noise, no vocals',
    librarySearchTags: [],
    durationNeededSeconds: input.neededDurationSeconds,
    durationToGenerateSeconds: input.durationToGenerateSeconds,
    generatedDurationPolicy: generatedDurationPolicy(input.durationToGenerateSeconds),
    textureWords: ['soft', 'clean'],
    energyWords: ['low'],
    styleWords: ['professional'],
    avoidWords: ['loud', 'cartoon'],
    timingInstructions: ['Generate longer than needed, then trim and align the hit.'],
    mixInstructions: ['Keep voice-first and subtle.'],
    promptWarnings: ['Mock prompt only; no provider call was made.'],
    status: 'planned',
    notes: ['Mock timing scenario prompt.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true, noProviderCall: true },
  }
}

function timingScenario(input: Omit<MockSFXTimingScenario, 'eventPlan' | 'promptPlan'> & {
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  anchorType: SFXAnchorType
  anchorTimeSeconds: number
  volumeProfile?: SFXVolumeProfile
  sceneContext: string
  prompt: string
  neededDurationSeconds: number
  provider?: SFXProvider
}): MockSFXTimingScenario {
  const event = eventPlan(input)
  return {
    ...input,
    eventPlan: event,
    promptPlan: promptPlan({
      id: input.id,
      eventPlan: event,
      provider: input.provider,
      neededDurationSeconds: input.neededDurationSeconds,
      durationToGenerateSeconds: input.mockGeneratedDurationSeconds,
      prompt: input.prompt,
    }),
  }
}

export const mockSFXTimingScenarios: MockSFXTimingScenario[] = [
  timingScenario({
    id: 'transition-whoosh-hit-on-cut',
    label: 'Soft transition whoosh hit on cut',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    anchorType: 'cut',
    anchorTimeSeconds: 12.42,
    sceneContext: 'Lake Como cut from boat movement to hotel reveal.',
    prompt: 'Soft premium transition whoosh',
    neededDurationSeconds: 0.55,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'whoosh_rise_hit_tail',
    expectedTrimWindow: { startSeconds: 0.78, endSeconds: 1.38 },
    expectedHitAlignment: { anchorTimeSeconds: 12.42, hitOffsetInsideTrimMs: 220 },
    expectedFinalPlacement: { startTimeSeconds: 12.2, hitTimeSeconds: 12.42, endTimeSeconds: 12.8 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'chapter-title-hit-on-reveal',
    label: 'Chapter title hit on reveal',
    targetLayer: 'chapter_card',
    useCase: 'chapter_title',
    anchorType: 'chapter_card_reveal',
    anchorTimeSeconds: 4,
    sceneContext: 'Chapter card introduces the travel day.',
    prompt: 'Premium chapter title accent',
    neededDurationSeconds: 0.45,
    mockGeneratedDurationSeconds: 2,
    mockWaveformShape: 'single_hit',
    expectedTrimWindow: { startSeconds: 0.78, endSeconds: 1.25 },
    expectedHitAlignment: { anchorTimeSeconds: 4, hitOffsetInsideTrimMs: 160 },
    expectedFinalPlacement: { startTimeSeconds: 3.84, hitTimeSeconds: 4, endTimeSeconds: 4.31 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'graphic-card-reveal-soft-pop',
    label: 'Graphic card reveal soft pop',
    targetLayer: 'graphic_design',
    useCase: 'graphic_card_reveal',
    anchorType: 'graphic_reveal',
    anchorTimeSeconds: 7.2,
    sceneContext: 'VisualExplain card reveals beside speaker.',
    prompt: 'Subtle graphic card reveal sound',
    neededDurationSeconds: 0.45,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'soft_pop',
    expectedTrimWindow: { startSeconds: 0.82, endSeconds: 1.3 },
    expectedHitAlignment: { anchorTimeSeconds: 7.2, hitOffsetInsideTrimMs: 180 },
    expectedFinalPlacement: { startTimeSeconds: 7.02, hitTimeSeconds: 7.2, endTimeSeconds: 7.5 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'stroke-line-draw-texture',
    label: 'Stroke Motion line draw texture',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_trace',
    anchorType: 'stroke_motion_start',
    anchorTimeSeconds: 8.2,
    sceneContext: 'Animated line starts tracing the explanation path.',
    prompt: 'Gentle stroke drawing sound',
    neededDurationSeconds: 1.2,
    mockGeneratedDurationSeconds: 3,
    mockWaveformShape: 'draw_texture',
    expectedTrimWindow: { startSeconds: 0.39, endSeconds: 1.56 },
    expectedHitAlignment: { anchorTimeSeconds: 8.2, hitOffsetInsideTrimMs: 0 },
    expectedFinalPlacement: { startTimeSeconds: 8.2, hitTimeSeconds: 8.2, endTimeSeconds: 9.37 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'stroke-line-crack-hit',
    label: 'Stroke Motion line crack hit',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_crack',
    anchorType: 'stroke_motion_completion',
    anchorTimeSeconds: 9.1,
    sceneContext: 'Line cracks at the key contrast beat.',
    prompt: 'Soft line crack accent',
    neededDurationSeconds: 0.45,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'single_hit',
    expectedTrimWindow: { startSeconds: 0.82, endSeconds: 1.3 },
    expectedHitAlignment: { anchorTimeSeconds: 9.1, hitOffsetInsideTrimMs: 180 },
    expectedFinalPlacement: { startTimeSeconds: 8.92, hitTimeSeconds: 9.1, endTimeSeconds: 9.4 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'stroke-circle-complete',
    label: 'Stroke Motion circle complete',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_circle_complete',
    anchorType: 'stroke_motion_completion',
    anchorTimeSeconds: 10.3,
    sceneContext: 'Circle closes around the key object.',
    prompt: 'Soft circle complete sound',
    neededDurationSeconds: 0.5,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'single_hit',
    expectedTrimWindow: { startSeconds: 0.82, endSeconds: 1.3 },
    expectedHitAlignment: { anchorTimeSeconds: 10.3, hitOffsetInsideTrimMs: 180 },
    expectedFinalPlacement: { startTimeSeconds: 10.12, hitTimeSeconds: 10.3, endTimeSeconds: 10.6 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'real-motion-object-settle',
    label: 'Real Motion object settle',
    targetLayer: 'real_motion',
    useCase: 'real_motion_object_settle',
    anchorType: 'real_motion_object_settle',
    anchorTimeSeconds: 15.6,
    sceneContext: 'Generated product card settles onto the table.',
    prompt: 'Soft Real Motion object settle sound',
    neededDurationSeconds: 0.6,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'object_movement',
    expectedTrimWindow: { startSeconds: 0.9, endSeconds: 1.45 },
    expectedHitAlignment: { anchorTimeSeconds: 15.6, hitOffsetInsideTrimMs: 200 },
    expectedFinalPlacement: { startTimeSeconds: 15.4, hitTimeSeconds: 15.6, endTimeSeconds: 15.95 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'cta-reveal-chime',
    label: 'CTA reveal chime',
    targetLayer: 'cta_reveal',
    useCase: 'cta_success_chime',
    anchorType: 'cta_reveal',
    anchorTimeSeconds: 28,
    sceneContext: 'CTA button resolves at the end of the edit.',
    prompt: 'Soft success chime',
    neededDurationSeconds: 0.6,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'soft_pop',
    expectedTrimWindow: { startSeconds: 0.82, endSeconds: 1.3 },
    expectedHitAlignment: { anchorTimeSeconds: 28, hitOffsetInsideTrimMs: 180 },
    expectedFinalPlacement: { startTimeSeconds: 27.82, hitTimeSeconds: 28, endTimeSeconds: 28.3 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'montage-beat-accent',
    label: 'Montage beat accent on music beat',
    targetLayer: 'montage_hit',
    useCase: 'montage_beat_accent',
    anchorType: 'music_beat',
    anchorTimeSeconds: 18.5,
    musicBeatTimeSeconds: 18.5,
    sceneContext: 'Quick travel montage lands on the music beat.',
    prompt: 'Clean montage beat accent',
    neededDurationSeconds: 0.4,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'single_hit',
    expectedTrimWindow: { startSeconds: 0.82, endSeconds: 1.3 },
    expectedHitAlignment: { anchorTimeSeconds: 18.5, hitOffsetInsideTrimMs: 180 },
    expectedFinalPlacement: { startTimeSeconds: 18.32, hitTimeSeconds: 18.5, endTimeSeconds: 18.8 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'ambient-bridge-no-transient',
    label: 'Ambient bridge with no sharp transient',
    targetLayer: 'ambient_bridge',
    useCase: 'ambient_soft_bridge',
    anchorType: 'manual',
    anchorTimeSeconds: 22,
    sceneContext: 'Soft ambient bridge carries a scene transition.',
    prompt: 'Soft ambient bridge',
    neededDurationSeconds: 4,
    mockGeneratedDurationSeconds: 8,
    mockWaveformShape: 'ambient_swell',
    expectedTrimWindow: { startSeconds: 1.12, endSeconds: 5.92 },
    expectedHitAlignment: { anchorTimeSeconds: 22, hitOffsetInsideTrimMs: 0 },
    expectedFinalPlacement: { startTimeSeconds: 21.5, hitTimeSeconds: 22, endTimeSeconds: 26.3 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'food-social-ambience-bridge',
    label: 'Food/social ambience bridge',
    targetLayer: 'ambient_bridge',
    useCase: 'lifestyle_restaurant_ambience_bridge',
    anchorType: 'manual',
    anchorTimeSeconds: 24.2,
    sceneContext: 'Restaurant social scene needs a restrained ambience bridge.',
    prompt: 'Restaurant ambience bridge',
    neededDurationSeconds: 4,
    mockGeneratedDurationSeconds: 7,
    mockWaveformShape: 'ambient_swell',
    expectedTrimWindow: { startSeconds: 0.98, endSeconds: 5.18 },
    expectedHitAlignment: { anchorTimeSeconds: 24.2, hitOffsetInsideTrimMs: 0 },
    expectedFinalPlacement: { startTimeSeconds: 23.7, hitTimeSeconds: 24.2, endTimeSeconds: 27.9 },
    expectedValidationIssues: [],
  }),
  timingScenario({
    id: 'bad-timing-hit-late',
    label: 'Bad timing: hit lands late',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    anchorType: 'cut',
    anchorTimeSeconds: 12.42,
    sceneContext: 'Intentional bad timing case.',
    prompt: 'Soft transition whoosh',
    neededDurationSeconds: 0.5,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'whoosh_rise_hit_tail',
    expectedTrimWindow: { startSeconds: 0.78, endSeconds: 1.38 },
    expectedHitAlignment: { anchorTimeSeconds: 12.42, hitOffsetInsideTrimMs: 0 },
    expectedFinalPlacement: { startTimeSeconds: 12.42, hitTimeSeconds: 12.62, endTimeSeconds: 13.02 },
    expectedValidationIssues: ['hit_late'],
  }),
  timingScenario({
    id: 'bad-timing-tail-too-long',
    label: 'Bad timing: tail too long',
    targetLayer: 'ambient_bridge',
    useCase: 'ambient_soft_bridge',
    anchorType: 'manual',
    anchorTimeSeconds: 30,
    sceneContext: 'Intentional long-tail timing case.',
    prompt: 'Soft ambient bridge',
    neededDurationSeconds: 4,
    mockGeneratedDurationSeconds: 8,
    mockWaveformShape: 'ambient_swell',
    expectedTrimWindow: { startSeconds: 0.8, endSeconds: 6.9 },
    expectedHitAlignment: { anchorTimeSeconds: 30, hitOffsetInsideTrimMs: 0 },
    expectedFinalPlacement: { startTimeSeconds: 29.5, hitTimeSeconds: 30, endTimeSeconds: 36.4 },
    expectedValidationIssues: ['tail_too_long'],
  }),
  timingScenario({
    id: 'bad-trim-hit-cut-off',
    label: 'Bad trim: hit cut off',
    targetLayer: 'graphic_design',
    useCase: 'graphic_card_reveal',
    anchorType: 'graphic_reveal',
    anchorTimeSeconds: 6,
    sceneContext: 'Intentional trim case where hit offset is outside the trim.',
    prompt: 'Subtle graphic card reveal sound',
    neededDurationSeconds: 0.4,
    mockGeneratedDurationSeconds: 2.5,
    mockWaveformShape: 'soft_pop',
    expectedTrimWindow: { startSeconds: 1.1, endSeconds: 1.2 },
    expectedHitAlignment: { anchorTimeSeconds: 6, hitOffsetInsideTrimMs: 600 },
    expectedFinalPlacement: { startTimeSeconds: 5.4, hitTimeSeconds: 6, endTimeSeconds: 5.5 },
    expectedValidationIssues: ['trim_too_short', 'bad_hit_offset'],
  }),
]

export function getMockSFXTimingScenarioById(id: string): MockSFXTimingScenario | undefined {
  return mockSFXTimingScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSFXTimingScenario(): MockSFXTimingScenario {
  return mockSFXTimingScenarios[0]
}
