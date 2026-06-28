import { createHash } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProviderGatewayService } from '../services/provider-gateway-service'
import { createQwen25VlExternalBetaProductRouteHandlerSource } from '../services/qwen2-5-vl-external-beta-product-route-handler-source'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { ApiError } from '../errors/api-error'

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

const qwenStructuredVisualMetadataSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editSessionId: idSchema,
  requestId: z.string().min(1),
  workspaceMembershipRef: z.string().min(1),
  targetRef: z.string().min(1).optional(),
  workflowBindingId: z.string().min(1).optional(),
  adapterRequestId: z.string().min(1).optional(),
  approvedSnapshotReadbackRef: z.string().min(1),
  creditReservationReadbackRef: z.string().min(1),
  queueLeaseReadbackRef: z.string().min(1),
  privateInputManifestReadbackRef: z.string().min(1),
  privateArtifactManifestReadbackRef: z.string().min(1),
  privateArtifactChecksumReadbackRef: z.string().min(1),
  sourceSequenceMapReadbackRef: z.string().min(1),
  compiledIntentReadbackRef: z.string().min(1),
  editPlanVersionReadbackRef: z.string().min(1),
  modelRoutingPolicyReadbackRef: z.string().min(1),
  qaPolicyReadbackRef: z.string().min(1),
  routeReadbackExecutionRequested: z.boolean().optional(),
  providerModelCallRequested: z.boolean().optional(),
  workerDispatchRequested: z.boolean().optional(),
  mediaProcessingRequested: z.boolean().optional(),
  signedUrlCreationRequested: z.boolean().optional(),
  publicArtifactRequested: z.boolean().optional(),
  finalRenderExportRequested: z.boolean().optional(),
  externalBetaUnlockRequested: z.boolean().optional(),
})

export function createProviderGatewayRoutes(): Router {
  const router = Router()

  router.post('/api/providers/qwen2-5-vl/structured-visual-metadata', requireAuth, asyncRoute(async (request) => {
    const body = validateBody(qwenStructuredVisualMetadataSchema, request.body)
    const routeIdempotencyKey = request.header('idempotency-key')?.trim()
    if (!routeIdempotencyKey) {
      throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for this provider route.', 400)
    }
    createQwen25VlExternalBetaProductRouteHandlerSource(getServiceContext(request)).throwFailClosed({
      ...body,
      routeIdempotencyKey,
    })
  }))

  router.post('/v1/provider-gateway/requests', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(providerRequestSchema, request.body)
    const result = await createProviderGatewayService(getServiceContext(request)).createProviderRequestAttempt({
      ...body,
      requestPayloadHash: hashPayload(body.requestPayload ?? {}),
    })
    sendOk(response, { providerRequestAttempt: result.providerRequestAttempt }, result.warnings, 202)
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
