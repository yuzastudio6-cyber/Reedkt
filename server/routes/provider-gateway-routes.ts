import { createHash } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import {
  assertProviderWebhookRuntimeDisabled,
  createProviderGatewayService,
} from '../services/provider-gateway-service'
import { idSchema, validateBody } from '../validation/common-schemas'
import { externalProviderToolCostInputSchema, productionToolIdSchema } from '../validation/tool-cost-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'
import { PROVIDER_ROUTES } from '../../src/backend/cloud/provider-gateway-contracts'
import { REEDITPRO_MODEL_ROLE_IDS, REEDITPRO_REQUESTED_MODEL_USES } from '../../src/types/model-role-routing'

const providerRequestSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  providerRoute: z.enum(PROVIDER_ROUTES),
  providerModel: z.string().optional(),
  modelRoleId: z.enum(REEDITPRO_MODEL_ROLE_IDS).optional(),
  requestedModelUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES).optional(),
  generationRequestId: idSchema.optional(),
  jobId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditEstimateId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  toolId: productionToolIdSchema.optional(),
  approvedReservationRemainingCredits: z.number().int().nonnegative().optional(),
  providerUsage: externalProviderToolCostInputSchema.optional(),
  requestPayload: z.record(z.string(), z.unknown()).optional(),
  mockOnly: z.boolean().optional(),
})

export function createProviderGatewayRoutes(): Router {
  const router = Router()

  router.post('/v1/provider-gateway/requests', requireAuth, requireInternalServiceAuth, requireIdempotency, asyncRoute(async (request, response) => {
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

  router.post('/v1/provider-gateway/webhooks/:provider', requireAuth, requireInternalServiceAuth, asyncRoute(async () => {
    // Fail before validating or persisting caller-controlled workspace/project
    // fields. The future signed webhook path must derive tenant scope from a
    // stored provider attempt rather than request JSON.
    assertProviderWebhookRuntimeDisabled()
  }))

  return router
}

function hashPayload(value: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
