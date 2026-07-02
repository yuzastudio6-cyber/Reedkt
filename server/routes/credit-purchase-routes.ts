import { Router } from 'express'

import type {
  CompleteMockCreditTopUpRequest,
  CreateMockCreditTopUpRequest,
  SuggestCreditTopUpRequest,
} from '../../src/types'
import { requireAuth } from '../middleware/auth'
import {
  completeMockCreditTopUp,
  createMockCreditTopUpIntent,
  listCreditGrantsForWallet,
  listCreditPacks,
  suggestCreditTopUp,
} from '../services/mock-credit-purchase-store'
import {
  sharedMockCreditDataStore,
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'
import { completeMockCreditTopUpSchema, createMockCreditTopUpSchema, suggestCreditTopUpSchema } from '../validation/credit-purchase-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'

const mockWarnings = [
  'RP-CREDITPURCHASE-01 mock-only route; only local in-memory mock wallet available credits may change.',
  'No live billing, Stripe/payment, real checkout session, Supabase write, production wallet mutation, production ledger write, provider call, worker, render/export, export unlock, or production persistence occurred.',
]

export function createCreditPurchaseRoutes(): Router {
  const router = Router()

  router.get('/v1/credit-packs', requireAuth, asyncRoute(async (_request, response) => {
    sendOk(response, { creditPacks: listCreditPacks() }, mockWarnings)
  }))

  router.post('/v1/credit-top-ups/mock/create', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createMockCreditTopUpSchema, request.body) as CreateMockCreditTopUpRequest
    const result = createMockCreditTopUpIntent(sharedMockCreditReservationStore, body)
    sendOk(response, { topUp: result }, [...mockWarnings, ...result.warnings], result.status === 'created' ? 201 : 200)
  }))

  router.post('/v1/credit-top-ups/mock/complete', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(completeMockCreditTopUpSchema, request.body) as CompleteMockCreditTopUpRequest
    const result = completeMockCreditTopUp(sharedMockCreditReservationStore, body)
    sendOk(response, { topUp: result }, [...mockWarnings, ...result.warnings], result.status === 'completed' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.get('/v1/credit-wallets/:creditWalletId/grants', requireAuth, asyncRoute(async (request, response) => {
    const grants = listCreditGrantsForWallet(sharedMockCreditReservationStore, getRouteParam(request, 'creditWalletId'))
    sendOk(response, { grants }, mockWarnings)
  }))

  router.post('/v1/credit-top-ups/suggest', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(suggestCreditTopUpSchema, request.body) as SuggestCreditTopUpRequest
    const result = suggestCreditTopUp(
      sharedMockCreditReservationStore,
      sharedMockCreditEstimateStore,
      sharedMockCreditDataStore,
      body,
    )
    sendOk(response, { topUpSuggestion: result }, [...mockWarnings, ...result.warnings])
  }))

  return router
}
