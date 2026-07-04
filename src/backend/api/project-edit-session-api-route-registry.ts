import type { ApiMethod, ApiRouteDefinition, ApiRouteSecurityLevel } from './api-runtime-contracts'
import {
  PROJECT_EDIT_SESSION_API_ROUTE_IDS,
  REEDITPRO_API_ROUTE_MOCK_BOUNDARY_RULE,
  type ProjectEditSessionApiRouteId,
  type ReeditProApiRouteDefinition,
  type ReeditProApiRouteGroup,
  type ReeditProApiRouteMethod,
  type ReeditProApiRouteSafetyGate,
} from '../../types/api-routes'

export const PROJECT_EDIT_SESSION_API_ROUTE_SAFETY_GATES: ReeditProApiRouteSafetyGate[] = [
  'mock_only',
  'no_provider_calls',
  'no_supabase_writes',
  'no_storage_writes',
  'no_generation_requests',
  'no_render_jobs',
  'no_worker_jobs',
  'no_credit_reservation',
  'frontend_safe_response',
]

export const PROJECT_EDIT_SESSION_FULL_MOCK_HANDLER_ROUTE_IDS = [...PROJECT_EDIT_SESSION_API_ROUTE_IDS] as const

function routeMethodFor(id: ProjectEditSessionApiRouteId): ReeditProApiRouteMethod {
  if (
    id.endsWith('.options') ||
    id.endsWith('.list') ||
    id.endsWith('.get') ||
    id.endsWith('.latest') ||
    id.endsWith('.getLayer') ||
    id.endsWith('.dnaSummary') ||
    id.endsWith('.applicationSummary')
  ) {
    return 'GET'
  }
  if (id.endsWith('.update') || id.endsWith('.archive') || id.endsWith('.clear')) return 'PATCH'
  return 'POST'
}

function existingApiMethod(method: ReeditProApiRouteMethod): ApiMethod {
  if (method === 'GET') return 'GET'
  if (method === 'PATCH') return 'PATCH'
  return 'POST'
}

function titleCaseSegment(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replaceAll('.', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function routePathFor(id: ProjectEditSessionApiRouteId): string {
  return `/api/mock/${id.replaceAll('.', '/')}`
}

function schemaNameFor(id: ProjectEditSessionApiRouteId, kind: 'Request' | 'Response'): string {
  const base = id
    .replace(/^project\.editSessions\./, 'Project Edit Session ')
    .replaceAll('.', ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
  return `${base}${kind}`
}

function handlerNameFor(id: ProjectEditSessionApiRouteId): string {
  return `handle${schemaNameFor(id, 'Response').replace(/Response$/, '')}MockRoute`
}

function securityLevelFor(id: ProjectEditSessionApiRouteId): ApiRouteSecurityLevel {
  if (id === 'project.editSessions.summary.get') return 'workspace_member'
  return 'workspace_member'
}

function createRouteDefinition(id: ProjectEditSessionApiRouteId): ReeditProApiRouteDefinition<ProjectEditSessionApiRouteId> {
  const method = routeMethodFor(id)
  const backendOnlyInProduction = true
  return {
    id,
    group: 'project_edit_sessions',
    displayName: titleCaseSegment(id.replace(/^project\.editSessions\./, '')),
    description: `${titleCaseSegment(id.replace(/^project\.editSessions\./, ''))} Project Edit Session mock API route.`,
    method,
    runtime: 'mock_local',
    status: 'mock_handler_ready',
    authRequirement: 'project_member_required',
    safetyGates: [
      ...PROJECT_EDIT_SESSION_API_ROUTE_SAFETY_GATES,
      'backend_secret_boundary',
    ],
    mockOnly: true,
    productionReady: false,
    frontendCallableInMock: true,
    backendOnlyInProduction,
    requestSchemaName: schemaNameFor(id, 'Request'),
    responseSchemaName: schemaNameFor(id, 'Response'),
    notes: [
      'RP-EDITSESSION-04 route is mock/local only.',
      'ProjectEditSession route handlers must use the mock repository seam instead of mutating MockDatabase directly.',
      REEDITPRO_API_ROUTE_MOCK_BOUNDARY_RULE,
      'No production HTTP endpoint, Supabase write, storage write, provider call, worker job, render job, generation request, or credit reservation is enabled.',
    ],
  }
}

export const PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY =
  PROJECT_EDIT_SESSION_API_ROUTE_IDS.map(createRouteDefinition)

export const PROJECT_EDIT_SESSION_API_ROUTES: ApiRouteDefinition[] =
  PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.map((route) => ({
    id: route.id,
    domain: 'projects',
    method: existingApiMethod(route.method),
    path: routePathFor(route.id),
    description: route.description,
    securityLevel: securityLevelFor(route.id),
    runtimeMode: 'mock',
    status: 'mock_ready',
    requiresSupabase: false,
    requiresServiceRole: false,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    mockHandlerName: handlerNameFor(route.id),
    futureHandlerName: route.backendOnlyInProduction ? handlerNameFor(route.id).replace('MockRoute', 'Route') : undefined,
    notes: route.notes,
  }))

export function listProjectEditSessionApiRoutes(): ReeditProApiRouteDefinition<ProjectEditSessionApiRouteId>[] {
  return PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY
}

export function getProjectEditSessionApiRoute(
  routeId: ProjectEditSessionApiRouteId | string | undefined,
): ReeditProApiRouteDefinition<ProjectEditSessionApiRouteId> | undefined {
  return PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.find((route) => route.id === routeId)
}

export function listProjectEditSessionApiRoutesByGroup(group: ReeditProApiRouteGroup) {
  return PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.group === group)
}

export function createProjectEditSessionApiRouteRegistrySummary() {
  return {
    totalRoutes: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.length,
    routeIds: PROJECT_EDIT_SESSION_API_ROUTE_IDS,
    mockHandlerReadyCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.status === 'mock_handler_ready').length,
    productionReadyCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.productionReady).length,
    frontendCallableInMockCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.frontendCallableInMock).length,
    backendOnlyInProductionCount: PROJECT_EDIT_SESSION_API_ROUTE_REGISTRY.filter((route) => route.backendOnlyInProduction).length,
    routeGroups: ['project_edit_sessions' as const],
    warnings: [
      'RP-EDITSESSION-04 registers mock Project Edit Session API routes only.',
      'Production HTTP, Supabase persistence, storage, providers, workers, render, generation, and credits remain disabled.',
    ],
  }
}
