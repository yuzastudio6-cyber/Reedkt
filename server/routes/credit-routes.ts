import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createCreditService } from '../services/credit-service'
import {
  approveCreditEstimateSchema,
  creditEstimateCreateSchema,
  creditEstimateQuerySchema,
  creditEstimateReadinessSchema,
  creditGateCheckSchema,
  creditReservationMutationSchema,
  creditReservationQuerySchema,
  projectLedgerQuerySchema,
  reserveCreditsSchema,
} from '../validation/credit-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createCreditRoutes(): Router {
  const router = Router()

  router.get('/v1/workspaces/:workspaceId/credit-wallet', requireAuth, asyncRoute(async (request, response) => {
    const result = await createCreditService(getServiceContext(request)).getCreditWallet(getRouteParam(request, 'workspaceId'))
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.get('/v1/workspaces/:workspaceId/credit-balance', requireAuth, asyncRoute(async (request, response) => {
    const result = await createCreditService(getServiceContext(request)).getCreditWallet(getRouteParam(request, 'workspaceId'))
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/projects/:projectId/credit-estimates/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(creditEstimateReadinessSchema, request.body)
    const requestedCredits = (body.lineItems ?? []).reduce((total, item) => total + item.credits, 0)
    const result = await createCreditService(getServiceContext(request)).checkCreditReadiness({
      workspaceId: body.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
      editPlanVersionId: body.editPlanVersionId,
      approvedSnapshotId: body.approvedSnapshotId,
      executionType: 'snapshot',
      requestedCredits,
      requiresApprovedSnapshot: Boolean(body.approvedSnapshotId),
      metadata: body.metadata,
    })
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/projects/:projectId/credit-estimates', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(creditEstimateCreateSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).createCreditEstimate({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  }))

  router.get('/v1/credit-estimates/:creditEstimateId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(creditEstimateQuerySchema, request.query)
    const result = await createCreditService(getServiceContext(request)).getCreditEstimate(
      getRouteParam(request, 'creditEstimateId'),
      query.workspaceId,
    )
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/credit-estimates/:creditEstimateId/approve', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(approveCreditEstimateSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).approveCreditEstimate({
      ...body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  }))

  router.post('/v1/credits/gate/check', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(creditGateCheckSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).checkCreditGate(body)
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/credit-estimates/:creditEstimateId/reservations/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(reserveCreditsSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).checkCreditReadiness({
      ...body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
      requiresApprovedSnapshot: true,
    })
    sendOk(response, { credit: result }, result.warnings)
  }))

  const createReservation = asyncRoute(async (request, response) => {
    const body = validateBody(reserveCreditsSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).createCreditReservation({
      ...body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  })

  router.post('/v1/credit-estimates/:creditEstimateId/reservations', requireAuth, requireIdempotency, createReservation)
  router.post('/v1/credit-estimates/:creditEstimateId/reserve', requireAuth, requireIdempotency, createReservation)

  router.get('/v1/credit-reservations/:creditReservationId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(creditReservationQuerySchema, request.query)
    const result = await createCreditService(getServiceContext(request)).getCreditReservation(
      getRouteParam(request, 'creditReservationId'),
      query.workspaceId,
      query.projectId,
    )
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/credit-reservations/:creditReservationId/release', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(creditReservationMutationSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).releaseCreditReservation({
      ...body,
      creditReservationId: getRouteParam(request, 'creditReservationId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  }))

  router.post('/v1/credit-reservations/:creditReservationId/spend', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(creditReservationMutationSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).spendCreditReservation({
      ...body,
      creditReservationId: getRouteParam(request, 'creditReservationId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  }))

  router.post('/v1/credit-reservations/:creditReservationId/refund', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(creditReservationMutationSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).refundCreditReservation({
      ...body,
      creditReservationId: getRouteParam(request, 'creditReservationId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { credit: result }, result.warnings, 202)
  }))

  router.get('/v1/projects/:projectId/credit-ledger', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(projectLedgerQuerySchema, request.query)
    const result = await createCreditService(getServiceContext(request)).listLedgerForProject(
      getRouteParam(request, 'projectId'),
      query.workspaceId,
    )
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/credits/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(creditGateCheckSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).getCreditBlockers(body)
    sendOk(response, { credit: result }, result.warnings)
  }))

  router.post('/v1/credits/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(creditGateCheckSchema, request.body)
    const result = await createCreditService(getServiceContext(request)).checkCreditReadiness(body)
    sendOk(response, { credit: result }, result.warnings)
  }))

  return router
}
