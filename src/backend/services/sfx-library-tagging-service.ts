import type {
  SFXEventPlanRecord,
  SFXMixPlanRecord,
  SFXPromptPlanRecord,
  SFXQAReportRecord,
  SFXTrimPlanRecord,
} from '../../types'

function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uniqueSFXTags(tags: Array<string | undefined>): string[] {
  return Array.from(new Set(
    tags
      .filter((tag): tag is string => Boolean(tag))
      .map(normalizeTag)
      .filter(Boolean),
  ))
}

export function createSFXLibrarySearchTagsFromEvent(eventPlan: SFXEventPlanRecord): string[] {
  return uniqueSFXTags([
    eventPlan.targetLayer,
    eventPlan.useCase,
    eventPlan.volumeProfile,
    eventPlan.anchorType,
    eventPlan.timingPriority,
    eventPlan.signatureSystem,
    eventPlan.videoTone,
    eventPlan.targetLayer === 'transition' ? 'whoosh' : undefined,
    eventPlan.targetLayer === 'stroke_motion' ? 'line-draw' : undefined,
    eventPlan.targetLayer === 'graphic_design' ? 'card-reveal' : undefined,
    eventPlan.targetLayer === 'real_motion' ? 'object-settle' : undefined,
    eventPlan.targetLayer === 'ambient_bridge' ? 'ambient-bridge' : undefined,
    eventPlan.targetLayer === 'cta_reveal' ? 'resolve-hit' : undefined,
  ])
}

export function createSFXLibraryCandidateTags(input: {
  eventPlan: SFXEventPlanRecord
  promptPlan?: SFXPromptPlanRecord
  trimPlan?: SFXTrimPlanRecord
  mixPlan?: SFXMixPlanRecord
  qaReport?: SFXQAReportRecord
}): string[] {
  return uniqueSFXTags([
    ...createSFXLibrarySearchTagsFromEvent(input.eventPlan),
    ...(input.promptPlan?.librarySearchTags ?? []),
    ...(input.promptPlan?.styleWords ?? []),
    ...(input.promptPlan?.textureWords ?? []),
    input.trimPlan && input.trimPlan.tailMs <= 500 ? 'short-tail' : undefined,
    input.trimPlan && input.trimPlan.tailMs > 1200 ? 'long-tail' : undefined,
    input.mixPlan?.duckUnderVoice ? 'voice-safe' : undefined,
    input.mixPlan?.reverbProfile,
    input.mixPlan?.eqProfile,
    input.qaReport?.status === 'passed' ? 'qa-passed' : undefined,
  ])
}

export function createSFXLibraryAvoidTags(eventPlan: SFXEventPlanRecord): string[] {
  return uniqueSFXTags([
    eventPlan.videoTone.includes('faith') || eventPlan.videoTone.includes('serious') ? 'hype' : undefined,
    eventPlan.videoTone.includes('luxury') ? 'cartoon' : undefined,
    eventPlan.sourceFootagePolicy === 'edit_layer_only_default' ? 'source-action-foley' : undefined,
  ])
}
