import {
  MIRELO_SFX_FUTURE_MODEL_NAME,
  type SFXEventPlanRecord,
  type SFXPromptPlanRecord,
  type SFXPromptStyle,
} from '../../types'

type MireloPromptStyle = Extract<
  SFXPromptStyle,
  'simple_keyword' | 'short_phrase' | 'tag_list' | 'structured_sentence'
>

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

function baseSoundType(eventPlan: SFXEventPlanRecord): string {
  if (eventPlan.targetLayer === 'transition') return 'Soft premium transition whoosh'
  if (eventPlan.targetLayer === 'stroke_motion') {
    return eventPlan.anchorType === 'stroke_motion_morph'
      ? 'Soft line morph sound'
      : 'Gentle stroke drawing sound'
  }
  if (eventPlan.targetLayer === 'graphic_design') return 'Subtle graphic card reveal sound'
  if (eventPlan.targetLayer === 'real_motion') return 'Soft Real Motion object settle sound'
  if (eventPlan.targetLayer === 'title_card') return 'Premium title card accent'
  if (eventPlan.targetLayer === 'chapter_card') return 'Premium chapter title accent'
  if (eventPlan.targetLayer === 'cta_reveal') return 'Soft success chime'
  if (eventPlan.targetLayer === 'montage_hit') return 'Clean montage beat accent'
  if (eventPlan.targetLayer === 'ambient_bridge') return 'Soft ambient bridge'
  return eventPlan.useCase.replaceAll('_', ' ')
}

function textureForEvent(eventPlan: SFXEventPlanRecord): string {
  if (eventPlan.targetLayer === 'transition') return 'clean airy movement'
  if (eventPlan.targetLayer === 'stroke_motion') return 'soft pencil-like line trace'
  if (eventPlan.targetLayer === 'graphic_design') return 'clean digital polish, light pop'
  if (eventPlan.targetLayer === 'real_motion') return 'realistic small object movement, room-matched'
  if (eventPlan.targetLayer === 'cta_reveal') return 'clean warm resolve'
  if (eventPlan.targetLayer === 'ambient_bridge') return 'smooth room tone transition'
  return 'soft polished texture'
}

function toneForEvent(eventPlan: SFXEventPlanRecord): string {
  if (eventPlan.videoTone) return eventPlan.videoTone
  if (eventPlan.volumeProfile === 'premium_soft') return 'subtle premium tone'
  if (eventPlan.volumeProfile === 'whisper') return 'restrained whisper tone'
  return 'professional subtle tone'
}

export function buildMireloSimpleKeywordPrompt(eventPlan: SFXEventPlanRecord): string {
  return baseSoundType(eventPlan).toLowerCase()
}

export function buildMireloShortPhrasePrompt(eventPlan: SFXEventPlanRecord): string {
  return `${baseSoundType(eventPlan)}, ${textureForEvent(eventPlan)}.`
}

export function buildMireloTagListPrompt(eventPlan: SFXEventPlanRecord): string {
  return buildMireloPromptTags(eventPlan).join(', ')
}

export function buildMireloStructuredSentencePrompt(eventPlan: SFXEventPlanRecord): string {
  const soundType = baseSoundType(eventPlan)
  const texture = textureForEvent(eventPlan)
  const tone = toneForEvent(eventPlan)
  const energy = eventPlan.volumeProfile === 'impact' ? 'medium energy' : 'medium-low energy'
  const tail = eventPlan.targetLayer === 'ambient_bridge' ? 'smooth natural tail' : 'short smooth tail'
  const mixContext = eventPlan.mixPriority === 'voice_first'
    ? 'designed to sit under music without overpowering dialogue'
    : 'designed as subtle professional edit-layer polish'

  return `${soundType}, ${texture}, ${tone}, ${energy}, ${tail}, ${mixContext}, ${buildMireloNegativePrompt(eventPlan)}.`
}

export function buildMireloSFXPrompt(
  eventPlan: SFXEventPlanRecord,
  promptStyle: MireloPromptStyle = 'structured_sentence',
): string {
  if (promptStyle === 'simple_keyword') return buildMireloSimpleKeywordPrompt(eventPlan)
  if (promptStyle === 'short_phrase') return buildMireloShortPhrasePrompt(eventPlan)
  if (promptStyle === 'tag_list') return buildMireloTagListPrompt(eventPlan)
  return buildMireloStructuredSentencePrompt(eventPlan)
}

export function buildMireloPromptFromEvent(eventPlan: SFXEventPlanRecord): string {
  return buildMireloSFXPrompt(eventPlan, 'structured_sentence')
}

export function buildMireloNegativePrompt(eventPlan: SFXEventPlanRecord): string {
  const avoidWords = [
    'no cartoon',
    'no sci-fi',
    'no harsh riser',
    'no cheap viral whoosh',
    'no loud impact',
    'no distorted audio',
    'no vocals',
    'no music loop',
    'no long tail',
  ]

  if (eventPlan.mixPriority === 'voice_first') avoidWords.push('no overpowering dialogue')
  if (eventPlan.targetLayer === 'real_motion') avoidWords.push('no cinematic boom', 'no exaggerated hit')
  if (eventPlan.targetLayer === 'stroke_motion') avoidWords.push('no loud scratch')

  return Array.from(new Set(avoidWords)).join(', ')
}

export function buildMireloPromptTags(eventPlan: SFXEventPlanRecord): string[] {
  return Array.from(new Set([
    eventPlan.targetLayer,
    eventPlan.useCase,
    eventPlan.volumeProfile,
    eventPlan.anchorType,
    'production',
    'professional',
    ...eventPlan.videoTone.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4),
  ]))
}

export function createMireloPromptPlanFields(
  eventPlan: SFXEventPlanRecord,
  promptStyle: MireloPromptStyle = 'structured_sentence',
): SFXPromptPlanAdapterFields {
  const negativePrompt = buildMireloNegativePrompt(eventPlan)
  const tags = buildMireloPromptTags(eventPlan)

  return {
    modelName: MIRELO_SFX_FUTURE_MODEL_NAME,
    promptStyle,
    prompt: buildMireloSFXPrompt(eventPlan, promptStyle),
    negativePrompt,
    librarySearchTags: tags,
    textureWords: textureForEvent(eventPlan).replaceAll(',', '').split(/\s+/).filter(Boolean),
    energyWords: eventPlan.volumeProfile === 'impact' ? ['medium', 'impact'] : ['subtle', 'medium-low'],
    styleWords: toneForEvent(eventPlan).split(/\s+/).filter(Boolean),
    avoidWords: negativePrompt.replaceAll(',', '').split(/\s+/).filter((word) => word !== 'no'),
    timingInstructions: [
      `Design around ${eventPlan.anchorType}.`,
      'Generate extra duration so RP-SFX-06 can trim and hit-align the best region.',
    ],
    mixInstructions: [
      `Respect ${eventPlan.volumeProfile} volume profile.`,
      eventPlan.mixPriority === 'voice_first'
        ? 'Keep transient controlled and dialogue-safe.'
        : 'Keep final sound polished and subtle unless approved as an impact cue.',
    ],
    promptWarnings: ['Mirelo adapter is mock-only; exact provider behavior must be tested before real integration.'],
  }
}
