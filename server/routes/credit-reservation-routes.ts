import { Router } from 'express'

import type { ReserveMaxEstimateCreditsRequest } from '../../src/types'
import { requireAuth } from '../middleware/auth'
import {
  listCreditReservationLineItems,
  listCreditReservationsForEstimate,
  listCreditReservationsForProject,
  reserveMaxEstimateCredits,
} from '../services/mock-credit-reservation-store'
import {
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'
import { validateBody } from '../validation/common-schemas'
import { reserveMaxEstimateCreditsSchema } from '../validation/credit-reservation-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

const mockWarnings = [
  'RP-RESERVATION-01 mock-only route; only local in-memory wallet/reservation state may change.',
  'No live billing, Stripe/payment, Supabase write, production wallet mutation, production ledger write, settlement, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
]

export function createCreditReservationRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-estimates/:creditEstimateId/reservations/max', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(reserveMaxEstimateCreditsSchema, {
      ...request.body,
      creditEstimateId: getRouteParam(request, 'creditEstimateId'),
    }) as ReserveMaxEstimateCreditsRequest
    const result = reserveMaxEstimateCredits(
      sharedMockCreditReservationStore,
      sharedMockCreditEstimateStore,
      body,
    )
    const status = result.status === 'reserved' && result.idempotencyStatus === 'created' ? 201 : 200
    sendOk(response, { reservationResult: result }, [...mockWarnings, ...result.warnings], status)
  }))

  router.get('/v1/projects/:projectId/credit-reservations', requireAuth, asyncRoute(async (request, response) => {
    const reservations = listCreditReservationsForProject(
      sharedMockCreditReservationStore,
      getRouteParam(request, 'projectId'),
    )
    sendOk(response, {
      reservations,
      reservationLineItems: reservations.flatMap((reservation) =>
        listCreditReservationLineItems(sharedMockCreditReservationStore, reservation.id)),
    }, mockWarnings)
  }))

  router.get('/v1/credit-estimates/:creditEstimateId/credit-reservations', requireAuth, asyncRoute(async (request, response) => {
    const reservations = listCreditReservationsForEstimate(
      sharedMockCreditReservationStore,
      getRouteParam(request, 'creditEstimateId'),
    )
    sendOk(response, {
      reservations,
      reservationLineItems: reservations.flatMap((reservation) =>
        listCreditReservationLineItems(sharedMockCreditReservationStore, reservation.id)),
    }, mockWarnings)
  }))

  return router
}
