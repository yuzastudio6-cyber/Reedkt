import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import { validateBody } from '../validation/common-schemas'
import {
  exactEditPreferenceWorkspaceSchema,
  initializeExactEditPreferencesSchema,
  invalidateExactEditOutputFrameSchema,
  lockExactEditPreferencesSchema,
  setExactEditPlanningEvidenceSchema,
  updateExactEditPreferencesSchema,
} from '../validation/exact-edit-preference-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createExactEditPreferenceRoutes(): Router {
  const router = Router()

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(exactEditPreferenceWorkspaceSchema, request.query)
      const result = await createExactEditPreferenceService(getServiceContext(request)).getCurrent(
        query.workspaceId,
        getRouteParam(request, 'projectId'),
        getRouteParam(request, 'editSessionId'),
      )
      sendOk(response, { preferenceRecord: result.preferenceRecord }, result.warnings)
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/initialize',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(initializeExactEditPreferencesSchema, request.body)
      const result = await createExactEditPreferenceService(getServiceContext(request)).initialize({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(
        response,
        {
          preferenceRecord: result.preferenceRecord,
          created: result.created,
          replayed: result.replayed,
        },
        result.warnings,
        result.created ? 201 : 200,
      )
    }),
  )

  router.patch(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(updateExactEditPreferencesSchema, request.body)
      const result = await createExactEditPreferenceService(getServiceContext(request)).updateCurrent({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, {
        preferenceRecord: result.preferenceRecord,
        changedFields: result.changedFields,
        invalidation: result.invalidation,
        replayed: result.replayed,
      }, result.warnings)
    }),
  )

  router.put(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/planning-evidence',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(setExactEditPlanningEvidenceSchema, request.body)
      const result = await createExactEditPreferenceService(getServiceContext(request)).recordPlanningEvidence({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, {
        preferenceRecord: result.preferenceRecord,
        replayed: result.replayed,
      }, result.warnings)
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/invalidate-output-frame',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(invalidateExactEditOutputFrameSchema, request.body)
      const result = await createExactEditPreferenceService(getServiceContext(request)).invalidateForOutputFrameChange({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, {
        preferenceRecord: result.preferenceRecord,
        invalidation: result.invalidation,
        replayed: result.replayed,
      }, result.warnings)
    }),
  )

  router.put(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/lifecycle-lock',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(lockExactEditPreferencesSchema, request.body)
      const result = await createExactEditPreferenceService(getServiceContext(request)).lockForLifecycle({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, {
        preferenceRecord: result.preferenceRecord,
        replayed: result.replayed,
      }, result.warnings)
    }),
  )

  return router
}
