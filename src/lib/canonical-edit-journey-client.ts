import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'
import {
  parseCanonicalEditJourney,
  type CanonicalEditJourney,
} from './canonical-edit-journey'

type CanonicalEditJourneyResponse = {
  canonicalEditJourney?: unknown
}

export type CanonicalEditJourneyClientResult =
  | {
      status: 'ready'
      journey: CanonicalEditJourney
      warnings: string[]
    }
  | {
      status: 'not_configured'
      retryable: false
      message: string
      warnings: string[]
    }
  | {
      status: 'not_found' | 'access_denied' | 'unavailable' | 'invalid_response'
      retryable: boolean
      message: string
      warnings: string[]
    }

const inFlightCanonicalJourneyReads = new Map<string, Promise<CanonicalEditJourneyClientResult>>()

export function readCanonicalEditJourney(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): Promise<CanonicalEditJourneyClientResult> {
  const requestKey = [
    scope.authMode,
    scope.userId,
    scope.backendUserId ?? '',
    scope.workspaceId,
    projectId,
    editSessionId,
  ].join('\u001f')
  const inFlight = inFlightCanonicalJourneyReads.get(requestKey)
  if (inFlight) return inFlight

  const request = performCanonicalEditJourneyRead(scope, projectId, editSessionId)
  inFlightCanonicalJourneyReads.set(requestKey, request)
  void request.then(
    () => clearInFlightRead(requestKey, request),
    () => clearInFlightRead(requestKey, request),
  )
  return request
}

async function performCanonicalEditJourneyRead(
  scope: ProjectPersistenceScope,
  projectId: string,
  editSessionId: string,
): Promise<CanonicalEditJourneyClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return {
      status: 'not_configured',
      retryable: false,
      message: 'Saved workflow recovery is available when the reviewed private backend is connected.',
      warnings: runtime.warnings,
    }
  }

  const response = await callReeditProApi<undefined, CanonicalEditJourneyResponse>(
    'planning.canonicalJourney.get',
    undefined,
    {
      params: { projectId, editSessionId },
      query: { workspaceId: scope.workspaceId },
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }

  const errorCode = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    errorCode === 'AUTH_REQUIRED' ||
    errorCode === 'AUTH_INVALID' ||
    errorCode === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return {
      status: 'access_denied',
      retryable: false,
      message: 'The saved workflow is not available to this signed-in workspace.',
      warnings: response.warnings,
    }
  }

  if (
    response.statusCode === 404 ||
    errorCode === 'PROJECT_NOT_FOUND' ||
    errorCode === 'CHAT_SESSION_NOT_FOUND' ||
    errorCode === 'PLAN_NOT_APPROVED'
  ) {
    return {
      status: 'not_found',
      retryable: false,
      message: 'No canonical saved workflow was found for this named edit.',
      warnings: response.warnings,
    }
  }

  if (invalidResponseCode(errorCode)) {
    return {
      status: 'invalid_response',
      retryable: false,
      message: 'The saved workflow response could not be safely matched to this edit.',
      warnings: response.warnings,
    }
  }

  if (!response.ok) {
    return {
      status: 'unavailable',
      retryable: true,
      message: 'The saved workflow could not be refreshed from the private backend.',
      warnings: response.warnings,
    }
  }

  const parsed = parseCanonicalEditJourney(response.data?.canonicalEditJourney, {
    workspaceId: scope.workspaceId,
    projectId,
    editSessionId,
  })
  if (!parsed.ok) {
    return {
      status: 'invalid_response',
      retryable: false,
      message: 'The saved workflow response was rejected because its identity or stage was inconsistent.',
      warnings: [...response.warnings, parsed.error],
    }
  }

  return {
    status: 'ready',
    journey: parsed.value,
    warnings: response.warnings,
  }
}

function clearInFlightRead(
  requestKey: string,
  request: Promise<CanonicalEditJourneyClientResult>,
) {
  if (inFlightCanonicalJourneyReads.get(requestKey) === request) {
    inFlightCanonicalJourneyReads.delete(requestKey)
  }
}

function invalidResponseCode(code: string | undefined): boolean {
  return [
    'VALIDATION_FAILED',
    'INVALID_STORED_STATE',
    'INTEGRITY_CHECK_FAILED',
    'TENANCY_SCOPE_INVALID',
    'invalid_backend_response',
  ].includes(code ?? '')
}
