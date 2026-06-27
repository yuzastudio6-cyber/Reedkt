import type {
  EditLevelMarkerContextPolicy,
  EditLevelQwenContextPolicy,
  EditLevelSourceLayerRequiredness,
  EditLevelSourceLayerStatus,
  EditLevelSourceUnderstandingDepth,
  EditLevelSourceUnderstandingLayerId,
  EditLevelSourceUnderstandingLayerRoute,
  EditLevelSourceUnderstandingPolicyPackage,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelSourceUnderstandingPolicyPackage } from './edit-level-source-understanding-rules'

export function createEditLevelSourceUnderstandingUserSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return createEditLevelSourceUnderstandingPolicyPackage(level).userFacingSummary
}

export function createEditLevelSourceUnderstandingTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
): string {
  return createEditLevelSourceUnderstandingPolicyPackage(level).technicalSummary
}

export function createEditLevelSourceLayerSummary(route: EditLevelSourceUnderstandingLayerRoute): string {
  return `${route.displayName}: ${requirednessLabel(route.requiredness)}, ${statusLabel(route.status)}. ${route.userFacingSummary}`
}

export function createEditLevelMarkerContextSummary(policy: EditLevelMarkerContextPolicy): string {
  return `${policy.windowBeforeSeconds}s before / ${policy.windowAfterSeconds}s after marker window. ${policy.userFacingSummary}`
}

export function createEditLevelQwenContextSummary(policy: EditLevelQwenContextPolicy): string {
  return `${policy.qwenContextDepth} future Qwen context. ${policy.userFacingSummary}`
}

export function createEditLevelSourceFallbackSummary(
  level: ReEditProCanonicalEditLevel,
): string[] {
  return createEditLevelSourceUnderstandingPolicyPackage(level).fallbackPolicy
}

export function createEditLevelSourceFutureGatedSummary(
  routingPackage: EditLevelSourceUnderstandingPolicyPackage,
): string {
  const futureLayers = routingPackage.layers
    .filter((route) => ['provider_required', 'worker_required', 'storage_required', 'future_gated', 'runtime_disabled'].includes(route.status))
    .map((route) => route.displayName)

  if (futureLayers.length === 0) return 'No future-gated source context layers for this mock package.'

  return `Future-gated source context: ${futureLayers.slice(0, 6).join(', ')}${futureLayers.length > 6 ? ', and more' : ''}.`
}

export function findEditLevelSourceLayerRoute(
  routingPackage: EditLevelSourceUnderstandingPolicyPackage,
  layerId: EditLevelSourceUnderstandingLayerId,
): EditLevelSourceUnderstandingLayerRoute {
  const route = routingPackage.layers.find((item) => item.layerId === layerId)

  if (!route) {
    throw new Error(`Missing Edit Level source understanding layer route: ${layerId}`)
  }

  return route
}

export function depthLabel(depth: EditLevelSourceUnderstandingDepth): string {
  if (depth === 'metadata_and_targeted_context') return 'metadata + targeted context'
  if (depth === 'key_moments_and_marker_windows') return 'key moments + marker windows'
  return 'scene-level context'
}

export function statusLabel(status: EditLevelSourceLayerStatus): string {
  return status.replaceAll('_', ' ')
}

export function requirednessLabel(requiredness: EditLevelSourceLayerRequiredness): string {
  return requiredness.replaceAll('_', ' ')
}
