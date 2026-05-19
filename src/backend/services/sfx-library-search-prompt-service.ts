import type {
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
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

function splitTags(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function buildSFXLibrarySearchTags(eventPlan: SFXEventPlanRecord): string[] {
  const tags = [
    eventPlan.targetLayer,
    eventPlan.useCase,
    eventPlan.signatureSystem ?? 'none',
    eventPlan.anchorType,
    eventPlan.volumeProfile,
    eventPlan.mixPriority,
    ...splitTags(eventPlan.videoTone),
    ...splitTags(eventPlan.sceneContext).slice(0, 5),
  ]

  if (eventPlan.targetLayer === 'transition') tags.push('whoosh', 'soft', 'short-tail')
  if (eventPlan.targetLayer === 'stroke_motion') tags.push('line-draw', 'pencil', 'short-tail')
  if (eventPlan.targetLayer === 'graphic_design') tags.push('card-reveal', 'clean', 'digital', 'soft-pop')
  if (eventPlan.targetLayer === 'real_motion') tags.push('object-settle', 'room-matched', 'realistic')
  if (eventPlan.targetLayer === 'ambient_bridge') tags.push('ambience', 'bridge', 'natural')

  return Array.from(new Set(tags.filter(Boolean)))
}

export function buildSFXLibrarySearchQuery(eventPlan: SFXEventPlanRecord): string {
  return buildSFXLibrarySearchTags(eventPlan).join(', ')
}

export function buildSFXLibraryFallbackReason(eventPlan: SFXEventPlanRecord): string {
  return `Search internal library first for ${eventPlan.targetLayer}; if no approved reusable match exists, route to the planned fallback provider.`
}

export function createLibrarySearchPromptPlanFields(eventPlan: SFXEventPlanRecord): SFXPromptPlanAdapterFields {
  const tags = buildSFXLibrarySearchTags(eventPlan)

  return {
    modelName: 'reeditpro-internal-library',
    promptStyle: 'library_search_tags',
    prompt: buildSFXLibrarySearchQuery(eventPlan),
    negativePrompt: 'exclude private, branded, restricted, loud, cartoon, or license-unclear sounds',
    librarySearchTags: tags,
    textureWords: tags.filter((tag) => ['soft', 'airy', 'clean', 'digital', 'room-matched', 'realistic'].includes(tag)),
    energyWords: eventPlan.volumeProfile === 'impact' ? ['impact'] : ['subtle', 'low'],
    styleWords: tags.filter((tag) => ['premium', 'luxury', 'professional', 'travel', 'corporate'].includes(tag)),
    avoidWords: ['private', 'branded', 'restricted', 'loud', 'cartoon', 'license-unclear'],
    timingInstructions: [
      `Find a reusable sound that can align to ${eventPlan.anchorType}.`,
      'Library search does not generate new audio.',
    ],
    mixInstructions: [
      `Prefer sounds already suitable for ${eventPlan.volumeProfile} volume.`,
      'Reject matches that would overpower speech or music.',
    ],
    promptWarnings: [
      buildSFXLibraryFallbackReason(eventPlan),
      'Internal library search is mock-only and may return no match at launch.',
    ],
  }
}
