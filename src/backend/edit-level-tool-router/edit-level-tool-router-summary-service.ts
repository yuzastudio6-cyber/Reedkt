import type { ReEditProCanonicalEditLevel } from '../../types'
import {
  createEditLevelFutureGatedToolSummary,
  createEditLevelQwenToolRoutingSummary,
  createEditLevelToolFallbackSummary,
  createEditLevelToolRouterTechnicalSummary,
  createEditLevelToolRouterUserSummary,
  createEditLevelTranscriptAudioGraphicSummary,
} from '../../lib/edit-level-tool-router-summaries'

export function createEditLevelToolRouterSummary(input: {
  level: ReEditProCanonicalEditLevel
}): string[] {
  return [
    createEditLevelToolRouterUserSummary(input.level),
    createEditLevelQwenToolRoutingSummary(input.level),
    createEditLevelTranscriptAudioGraphicSummary(input.level),
    createEditLevelFutureGatedToolSummary(input.level),
    createEditLevelToolRouterTechnicalSummary(input.level),
    ...createEditLevelToolFallbackSummary(input.level).slice(0, 3),
  ]
}
