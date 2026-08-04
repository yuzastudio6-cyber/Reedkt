import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireSensitiveIdempotencyKey } from '../middleware/idempotency'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createEditReferenceExactEditApplyService } from '../services/edit-reference-exact-edit-apply-service'
import { createEditReferenceApplicationPreparationService } from '../services/edit-reference-application-preparation-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import { createPlanningExactEditPreferenceAuthorityService } from '../services/planning-exact-edit-preference-authority-service'
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
  editReferenceApplicationPreparationIntentSchema,
} from '../validation/edit-reference-application-preparation-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

const exactEditApplyAuthorityQuerySchema = z.object({
  workspaceId: z.string().min(1).max(160),
  selectedApplicationId: z.string().min(1).max(240).optional(),
}).strict()

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

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply-authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(exactEditApplyAuthorityQuerySchema, request.query)
      const authority = await createEditReferenceExactEditApplyService(
        getServiceContext(request),
      ).readAuthority({
        workspaceId: query.workspaceId,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        selectedApplicationId: query.selectedApplicationId ?? null,
      })
      sendOk(response, { authority })
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/planning-authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(exactEditPreferenceWorkspaceSchema, request.query)
      const authority = await createPlanningExactEditPreferenceAuthorityService(
        getServiceContext(request),
      ).read({
        workspaceId: query.workspaceId,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
      })
      sendOk(response, { authority })
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/reference-application/prepare',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const intent = validateBody(
        editReferenceApplicationPreparationIntentSchema,
        request.body,
      )
      const result = await createEditReferenceApplicationPreparationService(
        getServiceContext(request),
      ).prepare({
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        intent,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result, [], result.receipt.replayed ? 200 : 201)
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply',
    requireAuth,
    requireSensitiveIdempotencyKey,
    asyncRoute(async (request, response) => {
      const operation = request.body
      const authority = operation && typeof operation === 'object'
        ? (operation as { authority?: { workspaceId?: unknown } }).authority
        : undefined
      const workspaceId = typeof authority?.workspaceId === 'string'
        ? authority.workspaceId
        : ''
      const result = await createEditReferenceExactEditApplyService(
        getServiceContext(request),
      ).apply({
        workspaceId,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        operation,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result)
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
