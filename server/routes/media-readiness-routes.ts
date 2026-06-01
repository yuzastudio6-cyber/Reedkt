import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createMediaReadinessService } from '../services/media-readiness-service'
import {
  mediaProbeReadinessSchema,
  mediaProbeRequestSchema,
  mediaProbeResultQuerySchema,
  mediaReadinessSchema,
  mediaSourceQuerySchema,
  mediaSourceReadQuerySchema,
  observationReadinessSchema,
  sourceSequenceReadinessSchema,
  timingSeedPlaceholderQuerySchema,
  timingSeedReadinessSchema,
  timingValidationReadinessSchema,
  transcriptReadinessSchema,
} from '../validation/media-readiness-schemas'
import { validateBody, validateQuery } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export function createMediaReadinessRoutes(): Router {
  const router = Router()

  router.post('/v1/media/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(mediaReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkMediaReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.get('/v1/projects/:projectId/media-sources', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(mediaSourceQuerySchema, request.query)
    const result = await createMediaReadinessService(getServiceContext(request)).listSourcesForProject({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.get('/v1/media-sources/:mediaAssetId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(mediaSourceReadQuerySchema, request.query)
    const result = await createMediaReadinessService(getServiceContext(request)).getSource({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      mediaAssetId: getRouteParam(request, 'mediaAssetId'),
    })
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/projects/:projectId/source-sequence/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(sourceSequenceReadinessSchema, {
      ...request.body,
      projectId: getRouteParam(request, 'projectId'),
    })
    const result = await createMediaReadinessService(getServiceContext(request)).checkSourceSequenceReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/media/probe/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(mediaProbeReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkProbeReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/media/probe/request', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(mediaProbeRequestSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).requestProbe({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { mediaReadiness: result }, result.warnings, 202)
  }))

  router.get('/v1/media/probe-results/:mediaAssetId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(mediaProbeResultQuerySchema, request.query)
    const result = await createMediaReadinessService(getServiceContext(request)).getProbeResult({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      mediaAssetId: getRouteParam(request, 'mediaAssetId'),
      storageObjectRecordId: query.storageObjectRecordId,
    })
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/media/transcript/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(transcriptReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkTranscriptReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.get('/v1/media/transcript-placeholder/:mediaAssetId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(mediaSourceReadQuerySchema, request.query)
    const result = await createMediaReadinessService(getServiceContext(request)).getTranscriptPlaceholder({
      workspaceId: query.workspaceId,
      projectId: query.projectId,
      mediaAssetId: getRouteParam(request, 'mediaAssetId'),
    })
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/media/visual-observation/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(observationReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkVisualObservationReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/media/audio-observation/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(observationReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkAudioObservationReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/timing/seed/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(timingSeedReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkTimingSeedReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.get('/v1/timing/seed-placeholder/:projectId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateQuery(timingSeedPlaceholderQuerySchema, request.query)
    const result = await createMediaReadinessService(getServiceContext(request)).getTimingSeedPlaceholder({
      workspaceId: query.workspaceId,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  router.post('/v1/timing/validation/readiness', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(timingValidationReadinessSchema, request.body)
    const result = await createMediaReadinessService(getServiceContext(request)).checkTimingValidationReadiness(body)
    sendOk(response, { mediaReadiness: result }, result.warnings)
  }))

  return router
}
