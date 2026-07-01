import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  approveCreditRevisionAction,
  cancelCreditRevisionAction,
  chooseLowerCostCreditRevisionOption,
  createCreditRevisionActionRecord,
  evaluateExportCreditGate,
  getCreditSettlement,
  getCreditSettlementForReservation,
  listCreditRevisionActionsForProject,
  listCreditSettlementsForProject,
  previewCreditSettlement,
  settleCreditReservation,
  upsertCreditRevisionActionByIdempotencyKey,
} from '../services/mock-credit-data-store'
import { sharedMockCreditDataStore, sharedMockCreditEstimateStore, sharedMockCreditReservationStore } from '../services/mock-credit-foundation-stores'
import { getCreditReservation } from '../services/mock-credit-reservation-store'
import {
  approveCreditRevisionActionSchema,
  cancelCreditRevisionActionSchema,
  chooseLowerCostCreditRevisionOptionSchema,
  createCreditRevisionActionSchema,
  evaluateExportCreditGateSchema,
  previewCreditSettlementSchema,
  settleCreditReservationSchema,
} from '../validation/credit-data-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendOk } from './route-helpers'
import type { ExportCreditGateResult, JSONObject } from '../../src/types'

const mockWarnings = [
  'RP-CREDITDATA-01 mock-only route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, or export unlock occurred.',
]

const revisionResolutionWarnings = [
  'RP-CREDITREVISION-01 mock-only route; only local in-memory revised-credit action and additional-hold reservation state may change.',
  'No live billing, Stripe/payment, Supabase write, production wallet mutation, production ledger write, settlement, spend/release/refund, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
]

const settlementWarnings = [
  'RP-SETTLEMENT-01 mock-only route; final settlement may mutate local in-memory mock wallet/reservation state only.',
  'No live billing, Stripe/payment, Supabase write, production wallet mutation, production ledger write, provider call, worker, render/export, checkout/top-up, or export unlock occurred.',
]

const exportGateWarnings = [
  'RP-EXPORTLOCK-01 mock-only route; export credit readiness is evaluated from local settlement state only.',
  'No live billing, Stripe/payment, checkout/top-up, Supabase write, production wallet mutation, production ledger write, provider call, worker, render/export, production persistence, or export unlock occurred.',
]

export function createCreditDataRoutes(): Router {
  const router = Router()

  router.post('/v1/credit-settlements/preview', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(previewCreditSettlementSchema, request.body)
    const preview = previewCreditSettlement(sharedMockCreditDataStore, body)
    sendOk(response, preview, [...mockWarnings, ...preview.warnings])
  }))

  router.post('/v1/credit-settlements/settle', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(settleCreditReservationSchema, request.body)
    const result = settleCreditReservation(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      sharedMockCreditEstimateStore,
      {
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      },
    )
    sendOk(response, { settlement: result }, [...settlementWarnings, ...result.warnings], result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.get('/v1/projects/:projectId/credit-settlements', requireAuth, asyncRoute(async (request, response) => {
    const settlements = listCreditSettlementsForProject(sharedMockCreditDataStore, getRouteParam(request, 'projectId'))
    sendOk(response, { settlements }, mockWarnings)
  }))

  router.get('/v1/credit-reservations/:creditReservationId/settlement', requireAuth, asyncRoute(async (request, response) => {
    const settlement = getCreditSettlementForReservation(sharedMockCreditDataStore, getRouteParam(request, 'creditReservationId'))
    sendOk(response, { settlement }, mockWarnings)
  }))

  router.post('/v1/credit-export-gates/evaluate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(evaluateExportCreditGateSchema, request.body)
    const result = evaluateExportCreditGate(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      {
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      },
    )
    sendOk(response, { exportGate: result }, [...exportGateWarnings, ...result.warnings], result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.get('/v1/credit-settlements/:creditSettlementId/export-gate', requireAuth, asyncRoute(async (request, response) => {
    const creditSettlementId = getRouteParam(request, 'creditSettlementId')
    const settlement = getCreditSettlement(sharedMockCreditDataStore, creditSettlementId)
    if (!settlement) {
      const result = missingSettlementExportGate(creditSettlementId)
      sendOk(response, { exportGate: result }, [...exportGateWarnings, ...result.warnings])
      return
    }
    const result = evaluateExportCreditGate(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      {
        workspaceId: settlement.workspaceId,
        projectId: settlement.projectId,
        editPlanId: settlement.editPlanId ?? null,
        creditReservationId: settlement.creditReservationId,
        creditSettlementId: settlement.id,
        idempotencyKey: `read-export-gate-${settlement.id}`,
      },
      { createLock: false },
    )
    sendOk(response, { exportGate: result }, [...exportGateWarnings, ...result.warnings])
  }))

  router.get('/v1/credit-reservations/:creditReservationId/export-gate', requireAuth, asyncRoute(async (request, response) => {
    const creditReservationId = getRouteParam(request, 'creditReservationId')
    const reservation = getCreditReservation(sharedMockCreditReservationStore, creditReservationId)
    const result = evaluateExportCreditGate(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      {
        workspaceId: reservation?.workspaceId ?? 'workspace-unknown',
        projectId: reservation?.projectId ?? 'project-unknown',
        editPlanId: reservation?.editPlanId ?? null,
        creditReservationId,
        idempotencyKey: `read-export-gate-${creditReservationId}`,
      },
      { createLock: false },
    )
    sendOk(response, { exportGate: result }, [...exportGateWarnings, ...result.warnings])
  }))

  router.post('/v1/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(createCreditRevisionActionSchema, request.body)
    const action = upsertCreditRevisionActionByIdempotencyKey(
      sharedMockCreditDataStore,
      createCreditRevisionActionRecord({
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      }),
    )
    sendOk(response, { action }, mockWarnings, 201)
  }))

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/approve-and-continue', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(approveCreditRevisionActionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = approveCreditRevisionAction(
      sharedMockCreditDataStore,
      sharedMockCreditReservationStore,
      {
        ...body,
        metadata: body.metadata as JSONObject | undefined,
      },
    )
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'approved' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/choose-lower-cost-option', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(chooseLowerCostCreditRevisionOptionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = chooseLowerCostCreditRevisionOption(sharedMockCreditDataStore, {
      ...body,
      metadata: body.metadata as JSONObject | undefined,
    })
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'lower_cost_selected' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.post('/v1/credit-revision-actions/:creditRevisionActionId/cancel-extra-work', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(cancelCreditRevisionActionSchema, {
      ...request.body,
      creditRevisionActionId: getRouteParam(request, 'creditRevisionActionId'),
    })
    const result = cancelCreditRevisionAction(sharedMockCreditDataStore, {
      ...body,
      metadata: body.metadata as JSONObject | undefined,
    })
    sendOk(response, { resolution: result }, [...revisionResolutionWarnings, ...result.warnings], result.status === 'cancelled' && result.idempotencyStatus === 'created' ? 201 : 200)
  }))

  router.get('/v1/projects/:projectId/credit-revision-actions', requireAuth, asyncRoute(async (request, response) => {
    const actions = listCreditRevisionActionsForProject(sharedMockCreditDataStore, getRouteParam(request, 'projectId'))
    sendOk(response, { actions }, mockWarnings)
  }))

  return router
}

function missingSettlementExportGate(creditSettlementId: string): ExportCreditGateResult {
  return {
    status: 'settlement_not_found',
    canExport: false,
    creditReservationId: null,
    creditSettlementId,
    settlementStatus: null,
    reservedCredits: 0,
    finalChargeCredits: 0,
    outstandingCredits: 0,
    absorbedOverageCredits: 0,
    releasedCredits: 0,
    userFacingTitle: 'Settlement required before export',
    userFacingMessage: 'ReEditPro needs to calculate and settle the final credit charge before export can continue.',
    requiredAction: 'settle_edit_first',
    exportLock: null,
    idempotencyStatus: 'not_created',
    metadata: {
      mockOnly: true,
      milestone: 'RP-EXPORTLOCK-01',
      creditSettlementId,
    },
    safetyFlags: {
      mockOnly: true,
      readOnly: true,
      mockExportLockWritten: false,
      walletMutated: false,
      reservationMutated: false,
      creditsSpent: false,
      creditsReleased: false,
      creditsRefunded: false,
      ledgerWritten: false,
      productionWalletMutated: false,
      productionPersistenceWritten: false,
      providerCalled: false,
      workerRun: false,
      renderOrExportStarted: false,
      exportUnlocked: false,
      checkoutOrTopUpStarted: false,
      supabaseWritten: false,
      serviceFeeIncludedInToolCosts: false,
    },
    warnings: [
      'Credit settlement was not found.',
      'No wallet, reservation, ledger, export, provider, render, checkout, top-up, or Supabase mutation occurred.',
    ],
  }
}
