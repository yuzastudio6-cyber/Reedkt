import type { ApiDomain, ApiRouteDefinition } from './api-runtime-contracts'
import { ADMIN_API_ROUTES } from './routes/admin-api-routes'
import { AUTH_BOOTSTRAP_API_ROUTES } from './routes/auth-bootstrap-api-routes'
import { CREDIT_API_ROUTES } from './routes/credit-api-routes'
import { EDIT_PLANNING_API_ROUTES } from './routes/edit-planning-api-routes'
import { GENERATION_API_ROUTES } from './routes/generation-api-routes'
import { JOB_API_ROUTES } from './routes/job-api-routes'
import { MEDIA_UPLOAD_API_ROUTES } from './routes/media-upload-api-routes'
import { MUSIC_API_ROUTES } from './routes/music-api-routes'
import { PROJECT_API_ROUTES } from './routes/project-api-routes'
import { PROVIDER_API_ROUTES } from './routes/provider-api-routes'
import { RENDER_API_ROUTES } from './routes/render-api-routes'
import { SFX_API_ROUTES } from './routes/sfx-api-routes'
import { STORAGE_API_ROUTES } from './routes/storage-api-routes'
import { STORYTIMING_API_ROUTES } from './routes/storytiming-api-routes'
import { STRIPE_API_ROUTES } from './routes/stripe-api-routes'

export interface ApiRouteMapSummary {
  totalRoutes: number
  mockReadyRoutes: number
  frontendSafeRoutes: number
  backendRequiredRoutes: number
  disabledRoutes: number
  domains: Record<ApiDomain, number>
  warnings: string[]
}

export const REEDITPRO_API_ROUTES: ApiRouteDefinition[] = [
  ...AUTH_BOOTSTRAP_API_ROUTES,
  ...PROJECT_API_ROUTES,
  ...MEDIA_UPLOAD_API_ROUTES,
  ...EDIT_PLANNING_API_ROUTES,
  ...CREDIT_API_ROUTES,
  ...JOB_API_ROUTES,
  ...GENERATION_API_ROUTES,
  ...RENDER_API_ROUTES,
  ...MUSIC_API_ROUTES,
  ...SFX_API_ROUTES,
  ...STORYTIMING_API_ROUTES,
  ...STORAGE_API_ROUTES,
  ...PROVIDER_API_ROUTES,
  ...ADMIN_API_ROUTES,
  ...STRIPE_API_ROUTES,
]

const API_DOMAINS: ApiDomain[] = [
  'auth',
  'projects',
  'media',
  'planning',
  'credits',
  'jobs',
  'generation',
  'render',
  'music',
  'sfx',
  'storytiming',
  'storage',
  'providers',
  'admin',
  'stripe',
]

export function getApiRouteById(routeId: string): ApiRouteDefinition | undefined {
  return REEDITPRO_API_ROUTES.find((route) => route.id === routeId)
}

export function getApiRoutesByDomain(domain: ApiDomain): ApiRouteDefinition[] {
  return REEDITPRO_API_ROUTES.filter((route) => route.domain === domain)
}

export function getBackendRequiredRoutes(): ApiRouteDefinition[] {
  return REEDITPRO_API_ROUTES.filter((route) =>
    route.runtimeMode === 'backend_required' ||
    route.requiresServiceRole ||
    route.requiresProviderSecret ||
    route.requiresStripeSecret ||
    route.status === 'backend_required',
  )
}

export function getFrontendSafeRoutes(): ApiRouteDefinition[] {
  return REEDITPRO_API_ROUTES.filter((route) =>
    !route.requiresServiceRole &&
    !route.requiresProviderSecret &&
    !route.requiresStripeSecret &&
    (route.runtimeMode === 'frontend_safe' || route.status === 'frontend_safe_ready'),
  )
}

export function getMockReadyRoutes(): ApiRouteDefinition[] {
  return REEDITPRO_API_ROUTES.filter((route) => route.status === 'mock_ready')
}

export function createApiRouteMapSummary(): ApiRouteMapSummary {
  const domains = API_DOMAINS.reduce<Record<ApiDomain, number>>((summary, domain) => {
    summary[domain] = getApiRoutesByDomain(domain).length
    return summary
  }, createEmptyDomainSummary())

  return {
    totalRoutes: REEDITPRO_API_ROUTES.length,
    mockReadyRoutes: getMockReadyRoutes().length,
    frontendSafeRoutes: getFrontendSafeRoutes().length,
    backendRequiredRoutes: getBackendRequiredRoutes().length,
    disabledRoutes: REEDITPRO_API_ROUTES.filter((route) => route.status === 'disabled').length,
    domains,
    warnings: [
      'Route registry is metadata and mock-handler wiring only; no HTTP server is deployed.',
      'Provider, payment, worker, render, admin, and sensitive database mutations remain backend-required.',
    ],
  }
}

function createEmptyDomainSummary(): Record<ApiDomain, number> {
  return {
    auth: 0,
    projects: 0,
    media: 0,
    planning: 0,
    credits: 0,
    jobs: 0,
    generation: 0,
    render: 0,
    music: 0,
    sfx: 0,
    storytiming: 0,
    storage: 0,
    providers: 0,
    admin: 0,
    stripe: 0,
  }
}
