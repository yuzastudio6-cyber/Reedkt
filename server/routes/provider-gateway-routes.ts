import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendBackendRequired } from './route-helpers'

const providerRequestSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  providerRoute: z.string().min(1),
  providerModel: z.string().optional(),
  generationRequestId: idSchema.optional(),
  jobId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  requestPayload: z.record(z.string(), z.unknown()).optional(),
  mockOnly: z.boolean().optional(),
})

const webhookSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  providerEventId: z.string().min(1),
  generationRequestId: idSchema.optional(),
  jobId: idSchema.optional(),
  eventPayloadSummaryJson: z.record(z.string(), z.unknown()).optional(),
})

export function createProviderGatewayRoutes(): Router {
  const router = Router()

  router.post('/v1/provider-gateway/requests', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(providerRequestSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'providers.requests.create',
      routeGroup: 'providers',
      message: 'Provider gateway execution remains blocked until a dedicated provider gateway milestone.',
      blockers: ['Prompt 7 does not create provider attempts, call providers, read provider keys, or mutate generation state.'],
      nextAction: 'Use the provider gateway foundation milestone before enabling provider transport.',
    })
  }))

  router.post('/v1/provider-gateway/webhooks/:provider', requireAuth, asyncRoute(async (request, response) => {
    validateBody(webhookSchema, request.body)
    getRouteParam(request, 'provider')
    sendBackendRequired(response, {
      routeId: 'providers.webhooks.record',
      routeGroup: 'providers',
      message: 'Provider webhooks remain blocked until webhook verification and provider gateway runtime are implemented.',
      blockers: ['Prompt 7 does not verify webhooks, store provider events, or mutate generation state.'],
      nextAction: 'Use a future provider gateway/webhook milestone before enabling this route.',
    })
  }))

  return router
}
