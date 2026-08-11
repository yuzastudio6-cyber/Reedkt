import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../../backend/api/frontend-api-client'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE_ID,
  type CaptionRenderedVisualReviewAuthenticatedReadRequest,
  type CaptionRenderedVisualReviewAuthenticatedReadResult,
} from '../../types/caption-direction-visual-review-authenticated-read'
import type { ProjectPersistenceScope } from '../project-persistence-scope'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
} from '../project-persistence-scope'
import {
  acceptCaptionRenderedVisualReviewAuthenticatedReadResult,
  validateCaptionRenderedVisualReviewAuthenticatedReadRequest,
} from './caption-rendered-visual-review-authenticated-read'

export type CaptionRenderedVisualReviewAuthenticatedReadClientResult =
  | {
      ok: true
      authenticatedRead: CaptionRenderedVisualReviewAuthenticatedReadResult
      warnings: readonly string[]
    }
  | {
      ok: false
      status:
        | 'not_configured'
        | 'access_denied'
        | 'blocked'
        | 'unavailable'
        | 'invalid_response'
      retryable: boolean
      message: string
      warnings: readonly string[]
    }

/**
 * Calls only the shared authenticated read owner. It cannot create lifecycle
 * work, invoke Qwen, persist a result, approve QA, or accept browser state.
 */
export async function readCaptionRenderedVisualReviewAuthenticated(input: {
  scope: ProjectPersistenceScope
  request: CaptionRenderedVisualReviewAuthenticatedReadRequest
}): Promise<CaptionRenderedVisualReviewAuthenticatedReadClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Verified Caption visual review waits for the signed-in private backend.',
      false,
      runtime.warnings,
    )
  }
  if (!validateCaptionRenderedVisualReviewAuthenticatedReadRequest(
    input.request).ok
    || input.request.scope.workspaceId !== input.scope.workspaceId) {
    return failure(
      'blocked',
      'Caption visual review could not be read for this exact edit and output.',
      false,
    )
  }
  const response = await callReeditProApi<
    CaptionRenderedVisualReviewAuthenticatedReadRequest,
    { authenticatedRead?: unknown }
  >(
    CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_ROUTE_ID,
    input.request,
    {
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.request.scope.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyFailure(response)
  const accepted = acceptCaptionRenderedVisualReviewAuthenticatedReadResult(
    input.request, response.data?.authenticatedRead)
  if (!accepted) {
    return failure(
      'invalid_response',
      'The Caption visual-review response did not match this exact snapshot and output set.',
      false,
      response.warnings,
    )
  }
  return {
    ok: true,
    authenticatedRead: accepted,
    warnings: response.warnings,
  }
}

function classifyFailure(response: {
  statusCode: number
  error?: { code: string; message: string }
  warnings: readonly string[]
}): CaptionRenderedVisualReviewAuthenticatedReadClientResult {
  if (response.statusCode === 401 || response.statusCode === 403) {
    return failure(
      'access_denied',
      'This signed-in workspace cannot read Caption visual-review evidence for this edit.',
      false,
      response.warnings,
    )
  }
  if ([400, 404, 409, 422].includes(response.statusCode)) {
    return failure(
      'blocked',
      response.error?.message
        ?? 'Caption visual-review evidence is not available for this exact output set.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    response.error?.message
      ?? 'Caption visual review could not be refreshed. It is safe to retry.',
    true,
    response.warnings,
  )
}

function failure(
  status: Exclude<
    CaptionRenderedVisualReviewAuthenticatedReadClientResult,
    { ok: true }
  >['status'],
  message: string,
  retryable: boolean,
  warnings: readonly string[] = [],
): CaptionRenderedVisualReviewAuthenticatedReadClientResult {
  return { ok: false, status, retryable, message, warnings }
}
