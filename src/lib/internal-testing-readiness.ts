import { getApiRouteById } from '../backend/api/api-route-registry'
import type { ApiRouteDefinition } from '../backend/api/api-runtime-contracts'
import { getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import {
  getAuthClientStatus,
  getCurrentSupabaseSession,
} from '../backend/auth/auth-client-service'
import { getSupabaseClientStatus } from '../backend/supabase/supabase-client'

export type InternalTestingReadinessState = 'ready' | 'waiting' | 'blocked'

export interface InternalTestingReadinessItem {
  id: string
  label: string
  state: InternalTestingReadinessState
  summary: string
  detail: string
}

export interface InternalTestingReadinessReport {
  readyForSignedInUploadTesting: boolean
  statusLabel: string
  headline: string
  summary: string
  apiMode: string
  apiHostLabel: string
  items: InternalTestingReadinessItem[]
  blockedScopes: string[]
}

export type InternalTestingConnectionProbeState =
  | 'not_configured'
  | 'checking'
  | 'reachable'
  | 'unreachable'

export interface InternalTestingConnectionProbe {
  state: InternalTestingConnectionProbeState
  statusLabel: string
  summary: string
  detail: string
  checkedAt?: string
  requestId?: string
}

export type InternalTestingSessionProbeState =
  | 'not_configured'
  | 'checking'
  | 'signed_out'
  | 'signed_in'
  | 'error'

export interface InternalTestingSessionProbe {
  state: InternalTestingSessionProbeState
  statusLabel: string
  summary: string
  detail: string
  checkedAt?: string
}

const REQUIRED_BROWSER_TESTING_ROUTE_IDS = [
  'projects.list',
  'projects.create',
  'projects.internalEditState.save',
  'projects.internalEditState.list',
  'media.uploadIntent.create',
  'media.uploadIntent.localObject.put',
  'media.uploadIntent.finalize',
] as const

type RequiredBrowserTestingRouteId = (typeof REQUIRED_BROWSER_TESTING_ROUTE_IDS)[number]

export function buildInternalTestingReadinessReport(): InternalTestingReadinessReport {
  const supabaseStatus = getSupabaseClientStatus()
  const apiStatus = getFrontendApiClientStatus()
  const routeSummaries = REQUIRED_BROWSER_TESTING_ROUTE_IDS.map((routeId) => ({
    routeId,
    route: getApiRouteById(routeId),
  }))
  const missingRoutes = routeSummaries.filter((summary) => !summary.route).map((summary) => summary.routeId)
  const unsafeRoutes = routeSummaries
    .filter((summary): summary is { routeId: RequiredBrowserTestingRouteId; route: ApiRouteDefinition } => Boolean(summary.route))
    .filter((summary) => !isReviewedBrowserTestingRoute(summary.route))
    .map((summary) => summary.routeId)
  const routesReady = missingRoutes.length === 0 && unsafeRoutes.length === 0
  const apiReady = apiStatus.mode === 'frontend_safe' && Boolean(apiStatus.apiBaseUrl) && !apiStatus.mockOnly
  const readyForSignedInUploadTesting = supabaseStatus.configured && apiReady && routesReady
  const apiHostLabel = sanitizeApiHostLabel(apiStatus.apiBaseUrl)

  return {
    readyForSignedInUploadTesting,
    statusLabel: readyForSignedInUploadTesting ? 'Ready' : 'Needs setup',
    headline: readyForSignedInUploadTesting
      ? 'Signed-in upload testing can use the reviewed backend path.'
      : 'Finish the connection setup before browser upload testing.',
    summary: readyForSignedInUploadTesting
      ? 'The browser has Supabase sign-in config, a frontend-safe backend API, and reviewed project/upload routes.'
      : readinessSummary({
          apiReady,
          routesReady,
          supabaseReady: supabaseStatus.configured,
        }),
    apiMode: apiStatus.mode,
    apiHostLabel,
    items: [
      {
        id: 'supabase-auth',
        label: 'Sign-in',
        state: supabaseStatus.configured ? 'ready' : 'waiting',
        summary: supabaseStatus.configured
          ? 'Supabase browser auth is configured.'
          : 'Add the public Supabase browser settings.',
        detail: supabaseStatus.configured
          ? 'The browser can create a session token for reviewed backend calls.'
          : 'Sign-in cannot start until the hosted frontend has the public auth configuration.',
      },
      {
        id: 'backend-api',
        label: 'API connection',
        state: apiReady ? 'ready' : 'waiting',
        summary: apiReady
          ? `Frontend-safe API transport is configured for ${apiHostLabel}.`
          : 'Set the frontend-safe API mode and deployed backend URL.',
        detail: apiReady
          ? 'Reviewed /v1 routes can use HTTP transport while unsafe routes stay gated.'
          : 'Configure the hosted frontend for frontend-safe mode with the deployed backend URL.',
      },
      {
        id: 'project-upload-routes',
        label: 'Project and upload routes',
        state: routesReady ? 'ready' : 'blocked',
        summary: routesReady
          ? `${REQUIRED_BROWSER_TESTING_ROUTE_IDS.length} reviewed routes are ready for signed-in internal testing.`
          : 'One or more project/upload routes are not reviewed for browser testing.',
        detail: routesReady
          ? 'Project creation, edit-state readback, upload intent, local object upload, and finalize are registered.'
          : routeBlockerDetail(missingRoutes, unsafeRoutes),
      },
      {
        id: 'safety-gates',
        label: 'Safety gates',
        state: 'ready',
        summary: 'Public sharing, billing, and heavy execution stay off.',
        detail: 'Testing readiness does not approve provider calls, production billing, public delivery, or frontend tool execution.',
      },
    ],
    blockedScopes: [
      'public sharing',
      'external beta',
      'paid production',
      'silent billing',
      'frontend tool execution',
      'service-role browser actions',
    ],
  }
}

export function createInitialInternalTestingConnectionProbe(
  report: InternalTestingReadinessReport = buildInternalTestingReadinessReport(),
): InternalTestingConnectionProbe {
  if (!report.readyForSignedInUploadTesting) {
    return {
      state: 'not_configured',
      statusLabel: 'Not ready',
      summary: 'Connection check is waiting for setup.',
      detail: 'Finish sign-in and API setup before checking the deployed backend.',
    }
  }

  return {
    state: 'checking',
    statusLabel: 'Checking',
    summary: 'Checking the deployed backend connection.',
    detail: 'This safe check only calls the backend health endpoint.',
  }
}

export function createInitialInternalTestingSessionProbe(
  report: InternalTestingReadinessReport = buildInternalTestingReadinessReport(),
): InternalTestingSessionProbe {
  const authStatus = getAuthClientStatus()

  if (!authStatus.configured || !report.items.some((item) => item.id === 'supabase-auth' && item.state === 'ready')) {
    return {
      state: 'not_configured',
      statusLabel: 'Not ready',
      summary: 'Session check is waiting for sign-in setup.',
      detail: 'Add the public browser sign-in configuration before checking a session.',
    }
  }

  return {
    state: 'checking',
    statusLabel: 'Checking',
    summary: 'Checking for a signed-in browser session.',
    detail: 'This safe check only reads the current Supabase browser session.',
  }
}

export async function probeInternalTestingSession(): Promise<InternalTestingSessionProbe> {
  const authStatus = getAuthClientStatus()
  const checkedAt = new Date().toISOString()

  if (!authStatus.configured) {
    return {
      state: 'not_configured',
      statusLabel: 'Not ready',
      summary: 'Session check is waiting for sign-in setup.',
      detail: 'Add the public browser sign-in configuration before checking a session.',
      checkedAt,
    }
  }

  try {
    const sessionResult = await getCurrentSupabaseSession()

    if (sessionResult.status === 'error') {
      return {
        state: 'error',
        statusLabel: 'Check failed',
        summary: 'The browser session check failed.',
        detail: sessionResult.message,
        checkedAt,
      }
    }

    if (!sessionResult.session) {
      return {
        state: 'signed_out',
        statusLabel: 'Signed out',
        summary: 'No signed-in browser session is active.',
        detail: 'Sign in before creating projects or uploading source video for testing.',
        checkedAt,
      }
    }

    return {
      state: 'signed_in',
      statusLabel: 'Signed in',
      summary: 'A signed-in browser session is active.',
      detail: 'Project and upload requests can attach the current user session token.',
      checkedAt,
    }
  } catch (error) {
    return {
      state: 'error',
      statusLabel: 'Check failed',
      summary: 'The browser session check failed.',
      detail: error instanceof Error ? error.message : 'Refresh the page and sign in again before testing uploads.',
      checkedAt,
    }
  }
}

export async function probeInternalTestingApiConnection(): Promise<InternalTestingConnectionProbe> {
  const report = buildInternalTestingReadinessReport()

  if (!report.readyForSignedInUploadTesting) {
    return createInitialInternalTestingConnectionProbe(report)
  }

  const apiStatus = getFrontendApiClientStatus()
  if (!apiStatus.apiBaseUrl) {
    return {
      state: 'not_configured',
      statusLabel: 'Not ready',
      summary: 'No backend URL is configured.',
      detail: 'Add the deployed backend URL before checking the connection.',
    }
  }

  const checkedAt = new Date().toISOString()

  try {
    const response = await fetch(buildHealthUrl(apiStatus.apiBaseUrl), {
      credentials: 'omit',
      headers: { accept: 'application/json' },
      method: 'GET',
    })
    const payload = await parseHealthPayload(response)

    if (!response.ok || payload?.ok !== true || payload.data?.service !== 'reeditpro-api') {
      return {
        state: 'unreachable',
        statusLabel: 'Check failed',
        summary: 'The backend answered, but not with the expected ReEditPro health response.',
        detail: `Received status ${response.status}. Check the API URL and deployment target.`,
        checkedAt,
      }
    }

    return {
      state: 'reachable',
      statusLabel: 'Reachable',
      summary: `Backend health responded from ${report.apiHostLabel}.`,
      detail: 'Browser-to-backend transport is reachable for the next signed-in upload test.',
      checkedAt,
      requestId: typeof payload.data.requestId === 'string' ? payload.data.requestId : undefined,
    }
  } catch (error) {
    return {
      state: 'unreachable',
      statusLabel: 'Check failed',
      summary: 'The browser could not reach the deployed backend.',
      detail: error instanceof Error ? error.message : 'Check the API URL, CORS, DNS, and backend deployment.',
      checkedAt,
    }
  }
}

function isReviewedBrowserTestingRoute(route: ApiRouteDefinition): boolean {
  return (
    route.runtimeMode === 'frontend_safe' &&
    route.status === 'frontend_safe_ready' &&
    route.path.startsWith('/v1/') &&
    route.securityLevel !== 'public' &&
    !route.requiresServiceRole &&
    !route.requiresProviderSecret &&
    !route.requiresStripeSecret
  )
}

function readinessSummary(input: {
  apiReady: boolean
  routesReady: boolean
  supabaseReady: boolean
}): string {
  const blockers = [
    !input.supabaseReady && 'Supabase sign-in config',
    !input.apiReady && 'frontend-safe backend API',
    !input.routesReady && 'reviewed project/upload routes',
  ].filter(Boolean)

  return `${blockers.join(', ')} ${blockers.length === 1 ? 'is' : 'are'} still needed for hosted browser testing.`
}

function routeBlockerDetail(missingRoutes: string[], unsafeRoutes: string[]): string {
  const details = [
    missingRoutes.length > 0 && `Missing route metadata: ${missingRoutes.join(', ')}.`,
    unsafeRoutes.length > 0 && `Route review needed: ${unsafeRoutes.join(', ')}.`,
  ].filter(Boolean)

  return details.join(' ')
}

function sanitizeApiHostLabel(apiBaseUrl: string | undefined): string {
  if (!apiBaseUrl) return 'no backend URL'

  try {
    const url = new URL(apiBaseUrl)
    return url.host
  } catch {
    return 'configured backend'
  }
}

function buildHealthUrl(apiBaseUrl: string): string {
  return new URL('/health', normalizeBaseUrl(apiBaseUrl)).toString()
}

function normalizeBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
}

async function parseHealthPayload(response: Response): Promise<{
  ok?: boolean
  data?: {
    service?: unknown
    requestId?: unknown
  }
}> {
  try {
    return await response.json() as {
      ok?: boolean
      data?: {
        service?: unknown
        requestId?: unknown
      }
    }
  } catch {
    return {}
  }
}
