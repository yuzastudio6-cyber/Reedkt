import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createRenderService } from '../services/render-service'
import {
  exportReadinessSchema,
  exportRequestSchema,
  previewReadinessSchema,
  previewRequestSchema,
  renderBlockersSchema,
  renderManifestBuildSchema,
  renderManifestReadinessSchema,
  renderProjectQuerySchema,
  renderReadinessSchema,
  renderRecordQuerySchema,
} from '../validation/render-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createRenderRoutes(): Router {
  const router = Router()

  router.post('/v1/render/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(renderReadinessSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).checkRenderReadiness(body)
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/render/manifest/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(renderManifestReadinessSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).checkManifestReadiness(body)
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/render/manifest/build', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(renderManifestBuildSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).buildManifestBoundary({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { renderReadiness: result }, result.warnings, 202)
  }))

  router.post('/v1/render/preview/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(previewReadinessSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).checkPreviewReadiness(body)
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/render/preview/request', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(previewRequestSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).requestPreview({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { renderReadiness: result }, result.warnings, 202)
  }))

  router.get('/v1/render/preview/:renderId/status', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderRecordQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).getPreviewStatus({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      renderId: getRouteParam(request, 'renderId'),
      readinessContext: 'status',
      renderType: 'preview',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.get('/v1/renders/:renderId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderRecordQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).getRender({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      renderId: getRouteParam(request, 'renderId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/renders', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderProjectQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).listRendersForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/render/blockers', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(renderBlockersSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).collectBlockers(body)
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.get('/v1/renders/:renderId/events', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderRecordQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).listRenderEvents({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      renderId: getRouteParam(request, 'renderId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/export/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(exportReadinessSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).checkExportReadiness(body)
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.post('/v1/export/request', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(exportRequestSchema, request.body)
    const result = await createRenderService(getServiceContext(request)).requestExport({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { renderReadiness: result }, result.warnings, 202)
  }))

  router.get('/v1/export/:exportId/status', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderRecordQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).getExportStatus({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      exportId: getRouteParam(request, 'exportId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.get('/v1/exports/:exportId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderRecordQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).getExport({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      exportId: getRouteParam(request, 'exportId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/exports', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(renderProjectQuerySchema, request.query)
    const result = await createRenderService(getServiceContext(request)).listExportsForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
      readinessContext: 'status',
    })
    sendOk(response, { renderReadiness: result }, result.warnings)
  }))

  return router
}
