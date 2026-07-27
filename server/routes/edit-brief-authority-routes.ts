import { Router, type Request, type Response } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createEditBriefAuthorityService } from '../services/edit-brief-authority-service'
import { editBriefScopeIdSchema } from '../validation/edit-brief-authority-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

type ServiceResult = { warnings: string[] } & Record<string, unknown>

export function createEditBriefAuthorityRoutes(): Router {
  const router = Router()

  router.get(scopePath(), requireAuth, asyncRoute(async (request, response) => {
    const result = await service(request).get(
      workspaceQuery(request),
      getRouteParam(request, 'projectId'),
      getRouteParam(request, 'editSessionId'),
    )
    sendServiceResult(response, result)
  }))

  router.get(`${scopePath()}/publication-binding`, requireAuth, requireInternalServiceAuth, asyncRoute(async (request, response) => {
    const result = await service(request).getPublicationBinding(
      workspaceQuery(request),
      getRouteParam(request, 'projectId'),
      getRouteParam(request, 'editSessionId'),
    )
    sendServiceResult(response, result)
  }))

  router.post(scopePath(), requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).createBrief(scopedMutation(request)), 201)
  }))

  router.patch(scopePath(), requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).updateBrief(scopedMutation(request)))
  }))

  router.put(`${scopePath()}/export-settings`, requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).setExportSettings(scopedMutation(request)))
  }))

  router.post(`${scopePath()}/markers`, requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).createMarker(scopedMutation(request)), 201)
  }))

  router.patch(`${scopePath()}/markers/:markerId`, requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).updateMarker(scopedMarkerMutation(request)))
  }))

  for (const [action, method] of [
    ['confirm', 'confirmMarker'],
    ['archive', 'archiveMarker'],
    ['reopen', 'reopenMarker'],
  ] as const) {
    router.post(`${scopePath()}/markers/:markerId/${action}`, requireAuth, asyncRoute(async (request, response) => {
      sendServiceResult(response, await service(request)[method](scopedMarkerMutation(request)))
    }))
  }

  router.post(`${scopePath()}/markers/:markerId/messages`, requireAuth, asyncRoute(async (request, response) => {
    const body = mutationBody(request)
    rejectCallerFields(body, ['role', 'runtimeState'])
    sendServiceResult(response, await service(request).appendMarkerMessage(scopedMarkerMutation(request, {
      ...body,
      role: 'user',
      runtimeState: 'mock_local',
    })), 201)
  }))

  router.post(
    `${scopePath()}/markers/:markerId/internal-messages`,
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      sendServiceResult(response, await service(request).appendMarkerMessage(scopedMarkerMutation(request)), 201)
    }),
  )

  router.put(
    `${scopePath()}/markers/:markerId/structured-intent`,
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      sendServiceResult(response, await service(request).setMarkerIntent(scopedMarkerMutation(request)))
    }),
  )

  router.post(`${scopePath()}/markers/:markerId/audio-attachment`, requireAuth, asyncRoute(async (request, response) => {
    sendServiceResult(
      response,
      await service(request).addFinalizedAudioAttachment(scopedMarkerMutation(request)),
      201,
    )
  }))

  router.post(
    `${scopePath()}/markers/:markerId/context-package`,
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      sendServiceResult(response, await service(request).buildMarkerContext(scopedMarkerMutation(request)), 201)
    }),
  )

  router.post(`${scopePath()}/qa`, requireAuth, requireInternalServiceAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).runQa(scopedMutation(request)), 201)
  }))

  router.post(`${scopePath()}/plan-hints`, requireAuth, requireInternalServiceAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).createPlanHints(scopedMutation(request)), 201)
  }))

  router.put(`${scopePath()}/lifecycle-lock`, requireAuth, requireInternalServiceAuth, asyncRoute(async (request, response) => {
    sendServiceResult(response, await service(request).lockLifecycle(scopedMutation(request)))
  }))

  return router
}

function scopePath(): '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-brief' {
  return '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-brief'
}

function service(request: Request) {
  return createEditBriefAuthorityService(getServiceContext(request))
}

function workspaceQuery(request: Request): string {
  const parsed = editBriefScopeIdSchema.safeParse(request.query.workspaceId)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', 'A safe workspaceId query value is required.', 400)
  return parsed.data
}

function scopedMutation(request: Request, suppliedBody?: Record<string, unknown>): Record<string, unknown> {
  const body = suppliedBody ?? mutationBody(request)
  rejectCallerFields(body, ['workspaceId', 'projectId', 'editSessionId', 'markerId', 'idempotencyKey'])
  return {
    ...body,
    workspaceId: workspaceFromMutationBody(body),
    projectId: getRouteParam(request, 'projectId'),
    editSessionId: getRouteParam(request, 'editSessionId'),
    idempotencyKey: getIdempotencyKey(request),
  }
}

function scopedMarkerMutation(request: Request, suppliedBody?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...scopedMutation(request, suppliedBody),
    markerId: getRouteParam(request, 'markerId'),
  }
}

function mutationBody(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new ApiError('VALIDATION_FAILED', 'A JSON object request body is required.', 400)
  }
  return { ...(request.body as Record<string, unknown>) }
}

function workspaceFromMutationBody(body: Record<string, unknown>): string {
  const parsed = editBriefScopeIdSchema.safeParse(body.workspaceId)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'workspaceId must be supplied in the authenticated request body and match the authorized route scope.',
      400,
    )
  }
  return parsed.data
}

function rejectCallerFields(body: Record<string, unknown>, fields: string[]): void {
  const forbidden = fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field))
  const allowedWorkspaceField = forbidden.indexOf('workspaceId')
  if (allowedWorkspaceField >= 0) forbidden.splice(allowedWorkspaceField, 1)
  if (forbidden.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Route-owned authority fields must not be supplied by the caller.', 400, {
      forbiddenFields: forbidden,
    })
  }
}

function sendServiceResult(response: Response, result: ServiceResult, status = 200): void {
  const { warnings, ...data } = result
  sendOk(response, data, warnings, status)
}
