import { createHash } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProviderGatewayService } from '../services/provider-gateway-service'
import { idSchema, validateBody } from '../validation/common-schemas'
import { productionToolIdSchema } from '../validation/tool-cost-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

const providerRequestSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  providerRoute: z.string().min(1),
  providerModel: z.string().optional(),
  generationRequestId: idSchema.optional(),
  jobId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  toolId: productionToolIdSchema.optional(),
  approvedReservationRemainingCredits: z.number().int().nonnegative().optional(),
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
    const body = validateBody(providerRequestSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).createProviderRequestAttempt({
      ...body,
      requestPayloadHash: hashPayload(body.requestPayload ?? {}),
    })
    sendOk(response, {
      providerRequestAttempt: result.providerRequestAttempt,
      toolCostEstimate: result.toolCostEstimate,
    }, result.warnings, 202)
  }))

  router.post('/v1/provider-gateway/webhooks/:provider', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(webhookSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).recordProviderWebhook({
      ...body,
      providerRoute: getRouteParam(request, 'provider'),
    })
    sendOk(response, { providerWebhookEvent: result.providerWebhookEvent }, result.warnings, 202)
  }))

  return router
}

function hashPayload(value: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
