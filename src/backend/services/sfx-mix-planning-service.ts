import type {
  SFXMixPlanRecord,
  SFXVolumeProfile,
} from '../../types'
import type {
  CreateSFXMixPlanRequest,
  CreateSFXMixPlanResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import {
  chooseDuckingStrategy,
  chooseSFXDuckingIntensity,
  createAmbienceProtectionGuidance,
  createMusicDuckingGuidance,
  createVoiceFirstDuckingGuidance,
  shouldDuckSFXUnderMusic,
  shouldDuckSFXUnderVoice,
} from './sfx-ducking-service'
import {
  chooseSFXEQProfile,
  chooseSFXReverbProfile,
  chooseSFXStereoWidthProfile,
  createEQGuidance,
  createReverbMatchGuidance,
  createRoomMatchGuidance,
  createStereoWidthGuidance,
} from './sfx-eq-room-match-service'
import { createSFXLoudnessSummary } from './sfx-loudness-hint-service'
import {
  chooseSFXVolumeProfile,
  estimateTargetGainDb,
} from './sfx-volume-profile-service'

function fallbackFadeInMs(input: CreateSFXMixPlanRequest): number {
  if (input.sfxTrimPlan) return input.sfxTrimPlan.fadeInMs
  if (input.sfxEventPlan.targetLayer === 'ambient_bridge') return 500
  if (input.sfxEventPlan.targetLayer === 'transition') return 40
  if (input.sfxEventPlan.targetLayer === 'stroke_motion') return 35
  if (input.sfxEventPlan.targetLayer === 'real_motion') return 20
  return 15
}

function fallbackFadeOutMs(input: CreateSFXMixPlanRequest): number {
  if (input.sfxTrimPlan) return input.sfxTrimPlan.fadeOutMs
  if (input.sfxEventPlan.targetLayer === 'ambient_bridge') return 650
  if (input.sfxEventPlan.targetLayer === 'transition') return 180
  if (input.sfxEventPlan.targetLayer === 'stroke_motion') return 140
  if (input.sfxEventPlan.targetLayer === 'real_motion') return 180
  if (input.sfxEventPlan.targetLayer === 'cta_reveal') return 150
  return 90
}

function stereoWidthPercentage(profile: ReturnType<typeof chooseSFXStereoWidthProfile>): number {
  if (profile === 'mono_center') return 0
  if (profile === 'narrow') return 30
  if (profile === 'moderate') return 55
  if (profile === 'wide') return 75
  return 45
}

function mixPriority(input: CreateSFXMixPlanRequest, volumeProfile: SFXVolumeProfile): SFXMixPlanRecord['mixPriority'] {
  if (volumeProfile === 'none') return 'low_priority'
  if (input.speechPresent) return 'voice_first'
  if (input.ambienceImportant && input.sfxEventPlan.targetLayer === 'ambient_bridge') return 'ambience_first'
  if (input.musicPresent && input.sfxEventPlan.targetLayer === 'montage_hit') return 'music_support'
  if (input.sfxEventPlan.targetLayer === 'stroke_motion' || input.sfxEventPlan.targetLayer === 'real_motion') {
    return 'signature_sync'
  }

  return 'effect_moment'
}

export function createSFXMixPlanFromEvent(input: CreateSFXMixPlanRequest): SFXMixPlanRecord {
  const volumeProfile = chooseSFXVolumeProfile({
    sfxEventPlan: input.sfxEventPlan,
    videoTone: input.videoTone,
    editLevel: input.editLevel,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
    userSFXInstructions: input.userSFXInstructions,
    avoidSFXInstructions: input.avoidSFXInstructions,
  })
  const duckingInput = {
    sfxEventPlan: input.sfxEventPlan,
    volumeProfile,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
  }
  const toneInput = {
    sfxEventPlan: input.sfxEventPlan,
    volumeProfile,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
    videoTone: input.videoTone,
  }
  const eqProfile = chooseSFXEQProfile(toneInput)
  const stereoWidthProfile = chooseSFXStereoWidthProfile(toneInput)
  const reverbProfile = chooseSFXReverbProfile(toneInput)
  const now = nowIso()

  return {
    id: createMockId('sfx-mix-plan'),
    projectId: input.sfxEventPlan.projectId,
    editPlanId: input.sfxEventPlan.editPlanId,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxGeneratedAssetId: input.sfxGeneratedAsset?.id,
    volumeProfile,
    targetGainDb: estimateTargetGainDb(volumeProfile),
    duckUnderVoice: shouldDuckSFXUnderVoice(duckingInput),
    duckUnderMusic: shouldDuckSFXUnderMusic(duckingInput),
    duckingStrategy: chooseDuckingStrategy(duckingInput),
    duckingIntensity: chooseSFXDuckingIntensity(duckingInput),
    sidechainToVoice: shouldDuckSFXUnderVoice(duckingInput),
    sidechainToMusic: shouldDuckSFXUnderMusic(duckingInput),
    fadeInMs: fallbackFadeInMs(input),
    fadeOutMs: fallbackFadeOutMs(input),
    eqNotes: createEQGuidance(toneInput),
    eqProfile,
    stereoWidth: stereoWidthPercentage(stereoWidthProfile),
    stereoWidthProfile,
    reverbMatch: createReverbMatchGuidance(toneInput),
    reverbProfile,
    roomMatch: createRoomMatchGuidance(toneInput),
    mixPriority: mixPriority(input, volumeProfile),
    voicePresent: Boolean(input.speechPresent),
    musicPresent: Boolean(input.musicPresent),
    ambienceImportant: Boolean(input.ambienceImportant),
    notes: [
      ...createVoiceFirstDuckingGuidance(duckingInput),
      ...createMusicDuckingGuidance(duckingInput),
      ...createAmbienceProtectionGuidance(duckingInput),
      createStereoWidthGuidance(toneInput),
      ...createSFXLoudnessSummary(volumeProfile),
      'RP-SFX-07 creates mock mix planning metadata only; no audio mix is rendered.',
    ],
    status: 'mixed',
    createdAt: now,
    updatedAt: now,
    metadata: {
      mockOnly: true,
      noAudioProcessing: true,
      nextStep: 'run_sfx_qa',
    },
  }
}

export function createSFXMixPlanFromTimingAlignment(input: CreateSFXMixPlanRequest): SFXMixPlanRecord {
  return createSFXMixPlanFromEvent(input)
}

export function createSFXMixPlan(
  db: MockDatabase,
  input: CreateSFXMixPlanRequest,
): ServiceResult<CreateSFXMixPlanResponse> {
  return ok({
    sfxMixPlan: insertMockRecord(db, 'sfxMixPlans', createSFXMixPlanFromEvent(input)),
  })
}

export function createSFXMixPlansForEvents(
  db: MockDatabase,
  inputs: CreateSFXMixPlanRequest[],
): ServiceResult<CreateSFXMixPlanResponse[]> {
  return ok(inputs.map((input) => ({
    sfxMixPlan: insertMockRecord(db, 'sfxMixPlans', createSFXMixPlanFromEvent(input)),
  })))
}

export function createSFXMixPlanSummary(mixPlan: SFXMixPlanRecord): string[] {
  return [
    `Volume profile: ${mixPlan.volumeProfile}.`,
    `Target gain hint: ${mixPlan.targetGainDb}dB relative feel.`,
    mixPlan.duckUnderVoice ? 'Voice ducking: on.' : 'Voice ducking: off.',
    mixPlan.duckUnderMusic ? 'Music ducking: on for sustained parts.' : 'Music ducking: not required for the hit.',
    `Fade in/out: ${mixPlan.fadeInMs}ms / ${mixPlan.fadeOutMs}ms.`,
  ]
}

export function createSFXChatReadyMixSummary(mixPlan: SFXMixPlanRecord): string[] {
  return [
    `${mixPlan.volumeProfile} SFX mix planned with ${mixPlan.mixPriority} priority.`,
    mixPlan.voicePresent
      ? 'It stays voice-first and ducks under dialogue.'
      : 'No dialogue is present, so the cue can support the edit more clearly.',
    mixPlan.ambienceImportant
      ? 'Room and ambience matching are called out for the future mix worker.'
      : 'No special ambience repair is required.',
    'Next step: SFX QA.',
  ]
}
