import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createToolCallService } from '../services/tool-call-service'
import { validateBody, validateQuery } from '../validation/common-schemas'
import {
  toolCallBlockersSchema,
  toolCallIntentCreateSchema,
  toolCallIntentProjectListQuerySchema,
  toolCallIntentReadinessSchema,
  toolCallIntentReadQuerySchema,
  toolCallQaRequirementsSchema,
  toolCallValidateContextSchema,
  toolCatalogGetQuerySchema,
  toolCatalogListQuerySchema,
  toolCatalogReadinessQuerySchema,
  toolChainGetQuerySchema,
  toolChainListQuerySchema,
  toolDecisionPreviewSchema,
  toolDecisionReadinessSchema,
  toolExecutionBlockedSchema,
  toolExecutionReadinessSchema,
  toolLicenseReadinessSchema,
  toolRuntimeReadinessSchema,
} from '../validation/tool-call-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createToolCallRoutes(): Router {
  const router = Router()

  router.get('/v1/tools/catalog/readiness', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolCatalogReadinessQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).checkCatalogReadiness(query)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.get('/v1/tools/catalog', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolCatalogListQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).listCatalog(query)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.get('/v1/tools/catalog/:toolId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolCatalogGetQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).getCatalogTool({
      ...query,
      toolId: getRouteParam(request, 'toolId'),
    })
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.get('/v1/tools/chains', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolChainListQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).listChains(query)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.get('/v1/tools/chains/:toolChainId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolChainGetQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).getChain({
      ...query,
      toolChainId: getRouteParam(request, 'toolChainId'),
    })
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/decision/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolDecisionReadinessSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).checkDecisionReadiness(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/decision/preview', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolDecisionPreviewSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).previewDecision(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/call-intents/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolCallIntentReadinessSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).checkCallIntentReadiness(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/call-intents', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(toolCallIntentCreateSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).createToolCallIntentBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { toolCall: result }, result.warnings, 202)
  }))

  router.get('/v1/tools/call-intents/:toolCallIntentId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolCallIntentReadQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).getToolCallIntent({
      ...query,
      toolCallIntentId: getRouteParam(request, 'toolCallIntentId'),
    })
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/tool-call-intents', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(toolCallIntentProjectListQuerySchema, request.query)
    const result = await createToolCallService(getServiceContext(request)).listToolCallIntentsForProject({
      ...query,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/call-intents/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolCallBlockersSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).listToolCallBlockers(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/call-intents/validate-context', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolCallValidateContextSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).validateContextEnvelope(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/call-intents/qa-requirements', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolCallQaRequirementsSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).buildQaRequirements(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/execution/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolExecutionReadinessSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).checkExecutionReadiness(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/execution/blocked', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolExecutionBlockedSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).blockedExecution(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/runtime/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolRuntimeReadinessSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).checkRuntimeReadiness(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  router.post('/v1/tools/license/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolLicenseReadinessSchema, request.body)
    const result = await createToolCallService(getServiceContext(request)).checkLicenseReadiness(body)
    sendOk(response, { toolCall: result }, result.warnings)
  }))

  return router
}
