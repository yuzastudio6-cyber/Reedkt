import type {
  EditLevelToolCapabilityListModel,
  EditLevelToolCapabilitySummaryModel,
  EditLevelToolFallbackNoticeModel,
  EditLevelToolRoute,
  EditLevelToolRouterBoundaryNoticeModel,
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../types'
import {
  createEditLevelToolRouterBoundarySummary,
  createEditLevelToolRouterSideEffectFlags,
  createEditLevelToolRoutingPackage,
} from './edit-level-tool-router-rules'
import {
  createEditLevelFutureGatedToolSummary,
  createEditLevelQwenToolRoutingSummary,
  createEditLevelToolFallbackSummary,
  createEditLevelTranscriptAudioGraphicSummary,
} from './edit-level-tool-router-summaries'

export function loadEditLevelToolRoutingForUI(
  level: ReEditProCanonicalEditLevel,
): EditLevelToolRoutingPackage {
  return createEditLevelToolRoutingPackage(level)
}

export function createEditLevelToolCapabilitySummaryModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelToolRoutingPackage = createEditLevelToolRoutingPackage(level),
): EditLevelToolCapabilitySummaryModel {
  return {
    level,
    displayName: routingPackage.displayName,
    reasoningDepth: routeSummary(routingPackage, 'qwen_3_reasoning'),
    visualUnderstandingDepth: routeSummary(routingPackage, 'qwen25vl_visual_understanding'),
    transcriptAudioGraphicsDepth: createEditLevelTranscriptAudioGraphicSummary(level),
    editBriefGuidance: routeSummary(routingPackage, 'edit_brief'),
    qaStrictness: `${routingPackage.qaProfile} QA profile from the selected Edit Level.`,
    futureGatedSummary: createEditLevelFutureGatedToolSummary(level),
    estimateOnlyNotice: routeSummary(routingPackage, 'credit_gate'),
    highlights: [
      routingPackage.userFacingSummary,
      createEditLevelQwenToolRoutingSummary(level),
      'Rendering and credits remain future-gated; no progress starts.',
    ],
    mockOnly: true,
  }
}

export function createEditLevelToolCapabilityListModel(
  level: ReEditProCanonicalEditLevel,
  routingPackage: EditLevelToolRoutingPackage = createEditLevelToolRoutingPackage(level),
): EditLevelToolCapabilityListModel {
  return {
    level,
    displayName: routingPackage.displayName,
    availableNow: routingPackage.routes.filter((route) => route.status === 'available_mock'),
    betaReady: routingPackage.routes.filter((route) => route.status === 'available_beta'),
    futureGated: routingPackage.routes.filter((route) =>
      ['runtime_disabled', 'provider_required', 'worker_required', 'storage_required', 'future_gated'].includes(route.status),
    ),
    degradedOrFallback: routingPackage.routes.filter((route) =>
      route.fallback.length > 0 && route.status !== 'available_mock' && route.status !== 'available_beta',
    ),
    notUsed: routingPackage.routes.filter((route) => route.requiredness === 'not_used' || route.status === 'not_required'),
    mockOnly: true,
  }
}

export function createEditLevelToolFallbackNoticeModel(
  level: ReEditProCanonicalEditLevel,
): EditLevelToolFallbackNoticeModel {
  return {
    level,
    displayName: createEditLevelToolRoutingPackage(level).displayName,
    notices: createEditLevelToolFallbackSummary(level).slice(0, 8),
    boundary: 'Fallbacks are degraded planning notices only; they do not execute tools, providers, workers, render, or credits.',
    mockOnly: true,
  }
}

export function createEditLevelToolRouterBoundaryNoticeModel(): EditLevelToolRouterBoundaryNoticeModel {
  const sideEffectFlags = createEditLevelToolRouterSideEffectFlags()

  return {
    title: 'Mock/local tool capability router',
    summary: createEditLevelToolRouterBoundarySummary(),
    sideEffectFlags,
    mockOnly: true,
  }
}

function routeSummary(
  routingPackage: EditLevelToolRoutingPackage,
  capabilityId: EditLevelToolRoute['capabilityId'],
): string {
  const route = routingPackage.routes.find((item) => item.capabilityId === capabilityId)
  return route?.userFacingSummary ?? 'Route unavailable in this mock package.'
}
