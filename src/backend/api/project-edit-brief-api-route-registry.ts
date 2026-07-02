import type { ApiMethod, ApiRouteDefinition, ApiRouteSecurityLevel } from './api-runtime-contracts'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
  REEDITPRO_API_ROUTE_MOCK_BOUNDARY_RULE,
  type ProjectEditBriefApiRouteId,
  type ReeditProApiRouteDefinition,
  type ReeditProApiRouteGroup,
  type ReeditProApiRouteMethod,
  type ReeditProApiRouteSafetyGate,
} from '../../types/api-routes'

export const PROJECT_EDIT_BRIEF_API_ROUTE_SAFETY_GATES: ReeditProApiRouteSafetyGate[] = [
  'mock_only',
  'no_provider_calls',
  'no_supabase_writes',
  'no_storage_writes',
  'no_signed_urls',
  'no_file_reads',
  'no_external_url_fetch',
  'no_media_processing',
  'no_generation_requests',
  'no_render_jobs',
  'no_worker_jobs',
  'no_credit_reservation',
  'frontend_safe_response',
]

export const PROJECT_EDIT_BRIEF_FULL_MOCK_HANDLER_ROUTE_IDS = [...PROJECT_EDIT_BRIEF_API_ROUTE_IDS] as const

function routeMethodFor(id: ProjectEditBriefApiRouteId): ReeditProApiRouteMethod {
  if (
    id.endsWith('.get') ||
    id.endsWith('.list') ||
    id.endsWith('.summary') ||
    id.endsWith('.bundle') ||
    id.endsWith('.models')
  ) {
    return 'GET'
  }
  if (id.endsWith('.update') || id.endsWith('.archive')) return 'PATCH'
  if (id.endsWith('.delete') || id.endsWith('.remove')) return 'DELETE'
  return 'POST'
}

function existingApiMethod(method: ReeditProApiRouteMethod): ApiMethod {
  if (method === 'GET') return 'GET'
  if (method === 'PATCH') return 'PATCH'
  if (method === 'DELETE') return 'DELETE'
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

function routePathFor(id: ProjectEditBriefApiRouteId): string {
  return `/api/mock/${id.replaceAll('.', '/')}`
}

function schemaNameFor(id: ProjectEditBriefApiRouteId, kind: 'Request' | 'Response'): string {
  const base = id
    .replace(/^project\.editBrief\./, 'Project Edit Brief ')
    .replaceAll('.', ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
  return `${base}${kind}`
}

function handlerNameFor(id: ProjectEditBriefApiRouteId): string {
  return `handle${schemaNameFor(id, 'Response').replace(/Response$/, '')}MockRoute`
}

function securityLevelFor(): ApiRouteSecurityLevel {
  return 'workspace_member'
}

function createRouteDefinition(id: ProjectEditBriefApiRouteId): ReeditProApiRouteDefinition<ProjectEditBriefApiRouteId> {
  const method = routeMethodFor(id)

  return {
    id,
    group: 'project_edit_brief',
    displayName: titleCaseSegment(id.replace(/^project\.editBrief\./, '')),
    description: `${titleCaseSegment(id.replace(/^project\.editBrief\./, ''))} Project Edit Brief mock API route.`,
    method,
    runtime: 'mock_local',
    status: 'mock_handler_ready',
    authRequirement: 'project_member_required',
    safetyGates: [
      ...PROJECT_EDIT_BRIEF_API_ROUTE_SAFETY_GATES,
      'backend_secret_boundary',
    ],
    mockOnly: true,
    productionReady: false,
    frontendCallableInMock: true,
    backendOnlyInProduction: true,
    requestSchemaName: schemaNameFor(id, 'Request'),
    responseSchemaName: schemaNameFor(id, 'Response'),
    notes: [
      'RP-EDITBRIEF-04 route is mock/local only.',
      'ProjectEditBrief route handlers must use the mock repository seam instead of mutating MockDatabase directly.',
      REEDITPRO_API_ROUTE_MOCK_BOUNDARY_RULE,
      'No production HTTP endpoint, Supabase read/write, storage write, signed URL, file-byte read, URL fetch, media processing, provider call, worker job, render job, generation request, or credit reservation is enabled.',
    ],
  }
}

export const PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY =
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS.map(createRouteDefinition)

export const PROJECT_EDIT_BRIEF_API_ROUTES: ApiRouteDefinition[] =
  PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.map((route) => ({
    id: route.id,
    domain: 'projects',
    method: existingApiMethod(route.method),
    path: routePathFor(route.id),
    description: route.description,
    securityLevel: securityLevelFor(),
    runtimeMode: 'mock',
    status: 'mock_ready',
    requiresSupabase: false,
    requiresServiceRole: false,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    mockHandlerName: handlerNameFor(route.id),
    futureHandlerName: handlerNameFor(route.id).replace('MockRoute', 'Route'),
    notes: route.notes,
  }))

export function listProjectEditBriefApiRoutes(): ReeditProApiRouteDefinition<ProjectEditBriefApiRouteId>[] {
  return PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY
}

export function getProjectEditBriefApiRoute(
  routeId: ProjectEditBriefApiRouteId | string | undefined,
): ReeditProApiRouteDefinition<ProjectEditBriefApiRouteId> | undefined {
  return PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.find((route) => route.id === routeId)
}

export function listProjectEditBriefApiRoutesByGroup(group: ReeditProApiRouteGroup) {
  return PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.group === group)
}

export function createProjectEditBriefApiRouteRegistrySummary() {
  return {
    totalRoutes: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.length,
    routeIds: PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
    mockHandlerReadyCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.status === 'mock_handler_ready').length,
    productionReadyCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.productionReady).length,
    frontendCallableInMockCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.frontendCallableInMock).length,
    backendOnlyInProductionCount: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.filter((route) => route.backendOnlyInProduction).length,
    routeGroups: ['project_edit_brief' as const],
    warnings: [
      'RP-EDITBRIEF-04 registers mock Project Edit Brief API routes only.',
      'Production HTTP, Supabase persistence, storage, media processing, providers, workers, render, generation, and credits remain disabled.',
    ],
  }
}
