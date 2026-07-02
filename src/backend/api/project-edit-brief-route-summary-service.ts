import type { ApiResponseEnvelope } from './api-runtime-contracts'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
  type ProjectEditBriefApiRouteId,
} from '../../types/api-routes'
import { validateApiRouteDefinition } from './api-route-validation-service'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY,
  PROJECT_EDIT_BRIEF_FULL_MOCK_HANDLER_ROUTE_IDS,
} from './project-edit-brief-api-route-registry'
import { createProjectEditBriefRouteSafetyFlags } from './project-edit-brief-mock-route-handlers'

export function createProjectEditBriefRouteSummary() {
  const invalidRouteIds = PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY
    .filter((route) => !validateApiRouteDefinition(route).ok)
    .map((route) => route.id)

  return {
    milestone: 'RP-EDITBRIEF-04',
    totalRoutes: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.length,
    routeIds: PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
    mockHandlerReadyCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.status === 'mock_handler_ready').length,
    fullMockHandlerRouteIds: PROJECT_EDIT_BRIEF_FULL_MOCK_HANDLER_ROUTE_IDS,
    productionReadyCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.productionReady).length,
    invalidRouteIds,
    summary: [
      'Project Edit Brief mock API routes are registered for future Brief UI use.',
      'All routes are mock/local and repository-backed.',
      'No production HTTP route, Supabase persistence, storage write, signed URL, file read, URL fetch, media processing, provider call, worker job, render job, generation request, or credit reservation is enabled.',
    ],
    warnings: [
      invalidRouteIds.length ? `${invalidRouteIds.length} Project Edit Brief route definition(s) failed validation.` : 'All Project Edit Brief route definitions validate.',
      'Edit Brief UI shell and /brief route remain future RP-EDITBRIEF work.',
    ],
  }
}

export function createProjectEditBriefRouteSafetySummary(response?: ApiResponseEnvelope) {
  const safety = createProjectEditBriefRouteSafetyFlags()
  const data = response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as { safety?: Partial<typeof safety> }
    : {}
  const errorDetails = response?.error?.details && typeof response.error.details === 'object' && !Array.isArray(response.error.details)
    ? response.error.details as { safety?: Partial<typeof safety> }
    : {}
  const dataSafety = data.safety ?? errorDetails.safety ?? {}
  const blockedReasons: string[] = []

  for (const [key, expected] of Object.entries(safety)) {
    const envelopeValue = key in (response ?? {}) ? (response as unknown as Record<string, unknown>)[key] : undefined
    const dataValue = (dataSafety as Record<string, unknown>)[key]
    if (envelopeValue !== undefined && envelopeValue !== expected) blockedReasons.push(`Envelope ${key} must be false.`)
    if (dataValue !== undefined && dataValue !== expected) blockedReasons.push(`Data safety ${key} must be false.`)
  }

  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    safety,
    summary: blockedReasons.length
      ? ['Project Edit Brief route response has unsafe side-effect flags.']
      : ['Project Edit Brief route response proves no production side effects.'],
  }
}

export function createProjectEditBriefRouteReadinessSummary(routeId?: ProjectEditBriefApiRouteId | string) {
  const route = routeId
    ? PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.find((item) => item.id === routeId)
    : undefined

  return {
    milestone: 'RP-EDITBRIEF-04',
    routeId,
    routeFound: routeId ? Boolean(route) : undefined,
    routeStatus: route?.status,
    readyForMockClient: routeId ? Boolean(route?.frontendCallableInMock && route.mockOnly) : true,
    readyForProduction: false,
    nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
    summary: [
      route
        ? `${route.id} is ready for mock/local client calls.`
        : 'Project Edit Brief mock route registry is ready for future client calls.',
      'Production API, auth/RLS, Supabase persistence, storage/media workers, rendering, and credits remain future work.',
    ],
  }
}
