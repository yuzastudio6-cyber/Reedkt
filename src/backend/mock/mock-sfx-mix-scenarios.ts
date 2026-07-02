import type {
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXMixValidationIssue,
  SFXTargetLayer,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
  SFXVolumeProfile,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'

const createdAt = '2026-05-19T12:00:00.000Z'
const projectId = 'mock-sfx-mix-project'
const editPlanId = 'mock-sfx-mix-edit-plan'

export interface MockSFXMixScenario {
  id: string
  label: string
  eventPlan: SFXEventPlanRecord
  generatedAsset: SFXGeneratedAssetRecord
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  speechPresent: boolean
  musicPresent: boolean
  ambienceImportant: boolean
  videoTone: string
  expectedVolumeProfile: SFXVolumeProfile
  expectedDuckUnderVoice: boolean
  expectedDuckUnderMusic: boolean
  expectedFade: {
    fadeInMs: number
    fadeOutMs: number
  }
  expectedToneNotes: string[]
  expectedValidationIssues: SFXMixValidationIssue[]
}

function eventPlan(input: {
  id: string
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  volumeProfile: SFXVolumeProfile
  sceneContext: string
  videoTone: string
}): SFXEventPlanRecord {
  return {
    id: `sfx_mix_event_${input.id}`,
    projectId,
    editPlanId,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    decisionState: input.volumeProfile === 'none' ? 'not_needed' : 'needed',
    sourceFootagePolicy: 'edit_layer_only_default',
    reason: `Mock mix scenario for ${input.targetLayer}.`,
    sceneContext: input.sceneContext,
    videoTone: input.videoTone,
    editLevel: input.videoTone.includes('fitness') ? 'pro' : 'signature',
    signatureSystem: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion'
      : input.targetLayer === 'graphic_design'
        ? 'graphic_design'
        : input.targetLayer === 'real_motion'
          ? 'real_motion'
          : 'sound_sync',
    anchorType: input.targetLayer === 'montage_hit'
      ? 'music_beat'
      : input.targetLayer === 'graphic_design'
        ? 'graphic_reveal'
        : input.targetLayer === 'real_motion'
          ? 'real_motion_object_settle'
          : input.targetLayer === 'cta_reveal'
            ? 'cta_reveal'
            : input.targetLayer === 'chapter_card'
              ? 'chapter_card_reveal'
              : input.targetLayer === 'stroke_motion'
                ? 'stroke_motion_completion'
                : input.targetLayer === 'ambient_bridge'
                  ? 'manual'
                  : 'cut',
    anchorTimeSeconds: 10,
    timingPriority: input.targetLayer === 'montage_hit' ? 'beat_aligned' : 'frame_accurate',
    volumeProfile: input.volumeProfile,
    mixPriority: 'voice_first',
    creditImpact: input.volumeProfile === 'none' ? 'none' : 'medium',
    requiresApproval: input.volumeProfile !== 'none',
    userVisibleSummary: input.sceneContext,
    avoidRules: ['SFX must not overpower voice.', 'No loud default SFX.'],
    mustFollowRules: ['Keep voice first.', 'Plan ducking before QA.'],
    status: 'planned',
    notes: ['Mock mix scenario only.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function generatedAsset(input: { id: string; eventPlan: SFXEventPlanRecord }): SFXGeneratedAssetRecord {
  return {
    id: `sfx_mix_asset_${input.id}`,
    projectId,
    editPlanId,
    sfxEventPlanId: input.eventPlan.id,
    sfxPromptPlanId: `sfx_mix_prompt_${input.id}`,
    provider: 'mirelo_sfx_v1_5',
    modelName: 'mirelo-sfx-v1.5',
    origin: 'mock_generated',
    storagePath: `mock://sfx-mix/${input.id}.wav`,
    fullGeneratedDurationSeconds: input.eventPlan.targetLayer === 'ambient_bridge' ? 7 : 2.5,
    reuseStatus: 'project_generated',
    qaStatus: 'pending',
    licenseScope: 'project_only',
    status: 'generated',
    notes: ['Mock generated asset metadata only.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true, noAudioProcessing: true },
  }
}

function trimPlan(input: { id: string; eventPlan: SFXEventPlanRecord; asset: SFXGeneratedAssetRecord }): SFXTrimPlanRecord {
  const isAmbient = input.eventPlan.targetLayer === 'ambient_bridge'
  const isStroke = input.eventPlan.targetLayer === 'stroke_motion'
  const isRealMotion = input.eventPlan.targetLayer === 'real_motion'

  return {
    id: `sfx_mix_trim_${input.id}`,
    projectId,
    editPlanId,
    sfxEventPlanId: input.eventPlan.id,
    sfxGeneratedAssetId: input.asset.id,
    generatedDurationSeconds: input.asset.fullGeneratedDurationSeconds,
    neededDurationSeconds: isAmbient ? 4 : isStroke || isRealMotion ? 1.2 : 0.5,
    trimStartSeconds: isAmbient ? 1 : 0.8,
    trimEndSeconds: isAmbient ? 5.2 : 1.35,
    hitOffsetInsideTrimMs: isAmbient ? 0 : 180,
    fadeInMs: isAmbient ? 500 : isStroke ? 35 : isRealMotion ? 20 : 15,
    fadeOutMs: isAmbient ? 650 : isStroke ? 140 : isRealMotion ? 180 : 90,
    tailMs: isAmbient ? 1200 : 320,
    reason: 'Mock trim for mix planning.',
    requiresManualReview: false,
    status: 'trimmed',
    notes: ['Mock trim only.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function timingAlignment(input: { id: string; eventPlan: SFXEventPlanRecord; trim: SFXTrimPlanRecord }): SFXTimingAlignmentRecord {
  return {
    id: `sfx_mix_timing_${input.id}`,
    projectId,
    editPlanId,
    sfxEventPlanId: input.eventPlan.id,
    sfxTrimPlanId: input.trim.id,
    anchorType: input.eventPlan.anchorType,
    anchorTimeSeconds: input.eventPlan.anchorTimeSeconds,
    startTimeSeconds: input.eventPlan.anchorTimeSeconds - input.trim.hitOffsetInsideTrimMs / 1000,
    hitTimeSeconds: input.eventPlan.anchorTimeSeconds,
    endTimeSeconds: input.eventPlan.anchorTimeSeconds + 0.35,
    preRollMs: input.trim.hitOffsetInsideTrimMs,
    tailMs: input.trim.tailMs,
    durationNeededMs: Math.round(input.trim.neededDurationSeconds * 1000),
    durationGeneratedMs: Math.round(input.trim.generatedDurationSeconds * 1000),
    hitOffsetInsideTrimMs: input.trim.hitOffsetInsideTrimMs,
    timingPriority: input.eventPlan.timingPriority,
    frameAccurateRequired: true,
    musicBeatAligned: input.eventPlan.anchorType === 'music_beat',
    speechSafePlacement: true,
    notes: ['Mock timing alignment for mix planning.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function mixScenario(input: Omit<MockSFXMixScenario, 'eventPlan' | 'generatedAsset' | 'trimPlan' | 'timingAlignment'> & {
  targetLayer: SFXTargetLayer
  useCase: SfxUseCase
  sceneContext: string
}): MockSFXMixScenario {
  const event = eventPlan({
    id: input.id,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    volumeProfile: input.expectedVolumeProfile,
    sceneContext: input.sceneContext,
    videoTone: input.videoTone,
  })
  const asset = generatedAsset({ id: input.id, eventPlan: event })
  const trim = trimPlan({ id: input.id, eventPlan: event, asset })

  return {
    ...input,
    eventPlan: event,
    generatedAsset: asset,
    trimPlan: trim,
    timingAlignment: timingAlignment({ id: input.id, eventPlan: event, trim }),
  }
}

export const mockSFXMixScenarios: MockSFXMixScenario[] = [
  mixScenario({
    id: 'dialogue-transition-whoosh',
    label: 'Soft transition whoosh under dialogue',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    videoTone: 'lifestyle travel with dialogue',
    sceneContext: 'Speaker continues through a soft transition.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: true,
    expectedDuckUnderMusic: true,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['voice_safe', 'room-match'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'no-speech-montage-whoosh',
    label: 'Soft transition whoosh in no-speech montage',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'vacation montage',
    sceneContext: 'Quick montage transition with no dialogue.',
    expectedVolumeProfile: 'premium_soft',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: true,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['premium_smooth'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'chapter-title-premium-hit',
    label: 'Chapter title premium hit',
    targetLayer: 'chapter_card',
    useCase: 'chapter_title',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'premium travel chapter',
    sceneContext: 'Elegant chapter card reveal.',
    expectedVolumeProfile: 'premium_soft',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['premium_smooth'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'graphic-card-reveal',
    label: 'Graphic card reveal',
    targetLayer: 'graphic_design',
    useCase: 'graphic_card_reveal',
    speechPresent: true,
    musicPresent: false,
    ambienceImportant: false,
    videoTone: 'corporate product demo',
    sceneContext: 'VisualExplain card appears beside speaker.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: true,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['voice_safe'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'stroke-line-draw',
    label: 'Stroke Motion line draw',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_trace',
    speechPresent: true,
    musicPresent: false,
    ambienceImportant: false,
    videoTone: 'educational explanation',
    sceneContext: 'Line drawing supports explanation.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: true,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 35, fadeOutMs: 140 },
    expectedToneNotes: ['avoid harsh scratch'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'stroke-circle-complete',
    label: 'Stroke Motion circle complete',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_circle_complete',
    speechPresent: false,
    musicPresent: false,
    ambienceImportant: false,
    videoTone: 'signature explanation',
    sceneContext: 'Circle closes around key object.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 35, fadeOutMs: 140 },
    expectedToneNotes: ['soften_harsh_highs'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'real-motion-object-settle',
    label: 'Real Motion object settle',
    targetLayer: 'real_motion',
    useCase: 'real_motion_object_settle',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: true,
    videoTone: 'luxury real estate room',
    sceneContext: 'Object settles into a room-matched scene.',
    expectedVolumeProfile: 'premium_soft',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: true,
    expectedFade: { fadeInMs: 20, fadeOutMs: 180 },
    expectedToneNotes: ['room_matched'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'cta-reveal-chime',
    label: 'CTA reveal chime',
    targetLayer: 'cta_reveal',
    useCase: 'cta_success_chime',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'clean social ending',
    sceneContext: 'CTA button resolves at the end.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['no childish bell'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'montage-beat-accent',
    label: 'Montage beat accent',
    targetLayer: 'montage_hit',
    useCase: 'montage_beat_accent',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'lifestyle vacation montage',
    sceneContext: 'Beat accent lands on a travel montage cut.',
    expectedVolumeProfile: 'standard_social',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['music_support'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'ambience-important-bridge',
    label: 'Ambient bridge with ambience important',
    targetLayer: 'ambient_bridge',
    useCase: 'ambient_soft_bridge',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: true,
    videoTone: 'restaurant lifestyle ambience',
    sceneContext: 'Restaurant ambience bridge under natural scene sound.',
    expectedVolumeProfile: 'whisper',
    expectedDuckUnderVoice: true,
    expectedDuckUnderMusic: true,
    expectedFade: { fadeInMs: 500, fadeOutMs: 650 },
    expectedToneNotes: ['room_matched'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'faith-teaching-whisper',
    label: 'Faith/serious teaching whisper SFX',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_trace',
    speechPresent: true,
    musicPresent: false,
    ambienceImportant: true,
    videoTone: 'faith teaching serious respectful',
    sceneContext: 'Very subtle line support under spoken teaching.',
    expectedVolumeProfile: 'whisper',
    expectedDuckUnderVoice: true,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 35, fadeOutMs: 140 },
    expectedToneNotes: ['warm_respectful'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'fitness-impact-hit',
    label: 'Fitness/social impact hit',
    targetLayer: 'montage_hit',
    useCase: 'montage_beat_accent',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'fitness high-energy transformation',
    sceneContext: 'Strong beat accent on transformation moment.',
    expectedVolumeProfile: 'impact',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['tight_social'],
    expectedValidationIssues: [],
  }),
  mixScenario({
    id: 'bad-impact-under-dialogue',
    label: 'Bad mix: impact hit under dialogue',
    targetLayer: 'montage_hit',
    useCase: 'montage_beat_accent',
    speechPresent: true,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'dialogue-heavy high-energy social',
    sceneContext: 'Intentional bad impact hit under dialogue.',
    expectedVolumeProfile: 'impact',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 5, fadeOutMs: 25 },
    expectedToneNotes: ['bad impact under dialogue'],
    expectedValidationIssues: ['too_loud_for_dialogue', 'ducking_missing', 'manual_review_needed'],
  }),
  mixScenario({
    id: 'bad-sfx-too-quiet',
    label: 'Bad mix: SFX too quiet',
    targetLayer: 'cta_reveal',
    useCase: 'cta_success_chime',
    speechPresent: false,
    musicPresent: true,
    ambienceImportant: false,
    videoTone: 'clean social ending',
    sceneContext: 'CTA chime planned below audible polish level.',
    expectedVolumeProfile: 'subtle_polish',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 15, fadeOutMs: 90 },
    expectedToneNotes: ['too quiet'],
    expectedValidationIssues: ['too_quiet_to_notice'],
  }),
  mixScenario({
    id: 'bad-indoor-reverb-mismatch',
    label: 'Bad mix: reverb mismatch for indoor scene',
    targetLayer: 'real_motion',
    useCase: 'real_motion_object_settle',
    speechPresent: false,
    musicPresent: false,
    ambienceImportant: true,
    videoTone: 'indoor room real motion',
    sceneContext: 'Object settle should match small indoor room.',
    expectedVolumeProfile: 'premium_soft',
    expectedDuckUnderVoice: false,
    expectedDuckUnderMusic: false,
    expectedFade: { fadeInMs: 20, fadeOutMs: 180 },
    expectedToneNotes: ['reverb mismatch'],
    expectedValidationIssues: ['reverb_mismatch', 'room_mismatch'],
  }),
]

export function getMockSFXMixScenarioById(id: string): MockSFXMixScenario | undefined {
  return mockSFXMixScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSFXMixScenario(): MockSFXMixScenario {
  return mockSFXMixScenarios[0]
}
