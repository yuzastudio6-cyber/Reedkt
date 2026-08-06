import type {
  EditLevelToolCapabilityId,
  EditLevelToolCapabilityStatus,
  EditLevelToolRequiredness,
  EditLevelToolRoute,
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelToolRoutingPackage } from './edit-level-tool-router-rules'
import { hideInternalToolNamesInCopy } from './tool-display-labels'

export function createEditLevelToolRouterUserSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return hideInternalToolNamesInCopy(createEditLevelToolRoutingPackage(level).userFacingSummary)
}

export function createEditLevelToolRouterTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return createEditLevelToolRoutingPackage(level).technicalSummary
}

export function createEditLevelToolRouteSummary(route: EditLevelToolRoute): string {
  return hideInternalToolNamesInCopy(`${route.displayName}: ${requirednessLabel(route.requiredness)}, ${statusLabel(route.status)}. ${route.userFacingSummary}`)
}

export function createEditLevelToolFallbackSummary(
  level: ReEditProCanonicalEditLevel,
): string[] {
  return createEditLevelToolRoutingPackage(level).fallbacks.map(hideInternalToolNamesInCopy)
}

export function createEditLevelQwenToolRoutingSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  const routingPackage = createEditLevelToolRoutingPackage(level)
  const qwen = routeFor(routingPackage, 'qwen_3_reasoning')
  const visual = routeFor(routingPackage, 'qwen25vl_visual_understanding')
  const deepseek = routeFor(routingPackage, 'deepseek_tool_code')

  return hideInternalToolNamesInCopy(`${qwen.displayName}: ${qwen.userFacingSummary} ${visual.displayName}: ${visual.userFacingSummary} ${deepseek.displayName}: ${deepseek.userFacingSummary}`)
}

export function createEditLevelTranscriptAudioGraphicSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  const routingPackage = createEditLevelToolRoutingPackage(level)
  const transcript = routeFor(routingPackage, 'speech_transcript')
  const audio = routeFor(routingPackage, 'audio_soundsync')
  const graphics = routeFor(routingPackage, 'graphic_design_understanding')

  return hideInternalToolNamesInCopy(`${transcript.userFacingSummary} ${audio.userFacingSummary} ${graphics.userFacingSummary}`)
}

export function createEditLevelFutureGatedToolSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  const routingPackage = createEditLevelToolRoutingPackage(level)
  const labels = routingPackage.routes
    .filter((route) => route.requiredness === 'future_only' || route.status === 'future_gated' || route.status === 'storage_required')
    .map((route) => route.displayName)

  return labels.length > 0
    ? hideInternalToolNamesInCopy(`Future-gated: ${labels.join(', ')}.`)
    : 'No future-gated activity routes in this package.'
}

export function statusLabel(status: EditLevelToolCapabilityStatus): string {
  if (status === 'available_mock') return 'local ready'
  if (status === 'available_beta') return 'beta ready'
  if (status === 'provider_required') return 'AI service approval required'
  if (status === 'worker_required') return 'private processing required'
  if (status === 'runtime_disabled') return 'runtime gated'
  if (status === 'storage_required') return 'storage required'
  if (status === 'future_gated') return 'future gated'
  if (status === 'not_required') return 'not required'
  if (status === 'degraded_fallback') return 'degraded fallback'
  return status
}

export function requirednessLabel(requiredness: EditLevelToolRequiredness): string {
  return requiredness.replaceAll('_', ' ')
}

function routeFor(
  routingPackage: EditLevelToolRoutingPackage,
  capabilityId: EditLevelToolCapabilityId,
): EditLevelToolRoute {
  const route = routingPackage.routes.find((item) => item.capabilityId === capabilityId)

  if (!route) {
    throw new Error(`Missing capability route: ${capabilityId}`)
  }

  return route
}
