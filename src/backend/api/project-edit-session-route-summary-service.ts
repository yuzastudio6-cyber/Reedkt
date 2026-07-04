import type { ApiResponseEnvelope } from './api-runtime-contracts'
import {
  PROJECT_EDIT_SESSION_API_ROUTE_IDS,
  type ProjectEditSessionApiRouteId,
} from '../../types/api-routes'
import { validateApiRouteDefinition } from './api-route-validation-service'
import {
  PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY,
  PROJECT_EDIT_SESSION_FULL_MOCK_HANDLER_ROUTE_IDS,
} from './project-edit-session-api-route-registry'
import { createProjectEditSessionRouteSafetyFlags } from './project-edit-session-mock-route-handlers'

export function createProjectEditSessionRouteSummary() {
  const invalidRouteIds = PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY
    .filter((route) => !validateApiRouteDefinition(route).ok)
    .map((route) => route.id)

  return {
    milestone: 'RP-EDITSESSION-04',
    totalRoutes: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.length,
    routeIds: PROJECT_EDIT_SESSION_API_ROUTE_IDS,
    mockHandlerReadyCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.status === 'mock_handler_ready').length,
    fullMockHandlerRouteIds: PROJECT_EDIT_SESSION_FULL_MOCK_HANDLER_ROUTE_IDS,
    productionReadyCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.productionReady).length,
    invalidRouteIds,
    summary: [
      'Project Edit Session mock API routes are registered for future Edit Chat UI use.',
      'All routes are mock/local and repository-backed.',
      'No production HTTP route, Supabase persistence, storage write, provider call, worker job, render job, generation request, or credit reservation is enabled.',
    ],
    warnings: [
      invalidRouteIds.length ? `${invalidRouteIds.length} Project Edit Session route definition(s) failed validation.` : 'All Project Edit Session route definitions validate.',
      'Frontend route/UI wiring remains future RP-EDITSESSION work.',
    ],
  }
}

export function createProjectEditSessionRouteSafetySummary(response?: ApiResponseEnvelope) {
  const safety = createProjectEditSessionRouteSafetyFlags()
  const data = response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as { safety?: Partial<typeof safety> }
    : {}
  const dataSafety = data.safety ?? {}
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
      ? ['Project Edit Session route response has unsafe side-effect flags.']
      : ['Project Edit Session route response proves no production side effects.'],
  }
}

export function createProjectEditSessionRouteReadinessSummary(routeId?: ProjectEditSessionApiRouteId | string) {
  const route = routeId
    ? PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.find((item) => item.id === routeId)
    : undefined

  return {
    milestone: 'RP-EDITSESSION-04',
    routeId,
    routeFound: routeId ? Boolean(route) : undefined,
    routeStatus: route?.status,
    readyForMockClient: routeId ? Boolean(route?.frontendCallableInMock && route.mockOnly) : true,
    readyForProduction: false,
    nextStep: 'RP-EDITSESSION-05 — Project Home UI with Edit Chat Cards',
    summary: [
      route
        ? `${route.id} is ready for mock/local client calls.`
        : 'Project Edit Session mock route registry is ready for future client calls.',
      'Production API, auth/RLS, Supabase persistence, workers, rendering, and credits remain future work.',
    ],
  }
}
