import {
  MMAUDIO_FUTURE_MODEL_NAME,
  type SFXEventPlanRecord,
  type SFXPromptPlanRecord,
} from '../../types'

type SFXPromptPlanAdapterFields = Pick<
  SFXPromptPlanRecord,
  | 'modelName'
  | 'promptStyle'
  | 'prompt'
  | 'negativePrompt'
  | 'librarySearchTags'
  | 'textureWords'
  | 'energyWords'
  | 'styleWords'
  | 'avoidWords'
  | 'timingInstructions'
  | 'mixInstructions'
  | 'promptWarnings'
>

function wordsFromText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function buildMMAudioSFXPrompt(soundSource: string, texture = 'soft', intensity = 'subtle'): string {
  return [texture, soundSource, intensity]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildMMAudioPromptFromEvent(eventPlan: SFXEventPlanRecord): string {
  if (eventPlan.targetLayer === 'transition') return 'soft transition whoosh'
  if (eventPlan.targetLayer === 'stroke_motion') return 'gentle line drawing sound'
  if (eventPlan.targetLayer === 'graphic_design') return 'subtle graphic reveal sound'
  if (eventPlan.targetLayer === 'real_motion') return 'quiet object movement'
  if (eventPlan.targetLayer === 'title_card') return 'light title card hit'
  if (eventPlan.targetLayer === 'chapter_card') return 'soft chapter reveal sound'
  if (eventPlan.targetLayer === 'cta_reveal') return 'soft success chime'
  if (eventPlan.targetLayer === 'montage_hit') return 'short beat accent'
  if (eventPlan.targetLayer === 'ambient_bridge') return 'soft ambient bridge'
  if (eventPlan.targetLayer === 'source_footage_repair') return 'soft ambient bridge'

  return buildMMAudioSFXPrompt(eventPlan.useCase.replaceAll('_', ' '))
}

export function buildMMAudioNegativePrompt(eventPlan: SFXEventPlanRecord): string {
  const base = ['no loud impact', 'no cartoon', 'no harsh noise', 'no vocals']

  if (eventPlan.mixPriority === 'voice_first' || eventPlan.volumeProfile === 'whisper') {
    base.push('do not overpower dialogue', 'no harsh transient')
  }

  if (eventPlan.targetLayer === 'source_footage_repair') {
    base.push('no footsteps unless requested', 'no fake action foley')
  }

  return Array.from(new Set(base)).join(', ')
}

export function buildMMAudioPromptTags(eventPlan: SFXEventPlanRecord): string[] {
  return Array.from(new Set([
    eventPlan.targetLayer,
    eventPlan.useCase,
    eventPlan.volumeProfile,
    eventPlan.anchorType,
    ...wordsFromText(eventPlan.videoTone).slice(0, 4),
  ]))
}

export function createMMAudioPromptPlanFields(eventPlan: SFXEventPlanRecord): SFXPromptPlanAdapterFields {
  const tags = buildMMAudioPromptTags(eventPlan)

  return {
    modelName: MMAUDIO_FUTURE_MODEL_NAME,
    promptStyle: 'video_conditioned_short_prompt',
    prompt: buildMMAudioPromptFromEvent(eventPlan),
    negativePrompt: buildMMAudioNegativePrompt(eventPlan),
    librarySearchTags: tags,
    textureWords: tags.filter((tag) => ['soft', 'gentle', 'quiet', 'subtle', 'airy', 'clean'].includes(tag)),
    energyWords: eventPlan.volumeProfile === 'impact' ? ['impact'] : ['low', 'subtle'],
    styleWords: wordsFromText(eventPlan.videoTone).slice(0, 5),
    avoidWords: buildMMAudioNegativePrompt(eventPlan).replaceAll(',', '').split(/\s+/).filter((word) => word !== 'no'),
    timingInstructions: [
      `Use the video-conditioned cue around ${eventPlan.anchorType}.`,
      'Keep prompt short; RP-SFX-06 will handle trim and hit alignment later.',
    ],
    mixInstructions: [
      `Target ${eventPlan.volumeProfile} volume profile.`,
      eventPlan.mixPriority === 'voice_first'
        ? 'Protect dialogue and keep the sound below speech.'
        : 'Keep the cue subtle unless the approved plan needs a beat accent.',
    ],
    promptWarnings: ['MMAudio mock prompt is intentionally short because it is treated as video-conditioned.'],
  }
}
