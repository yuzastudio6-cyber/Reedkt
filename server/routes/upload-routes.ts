import { Router, raw } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createUploadService } from '../services/upload-service'
import {
  createDownloadTargetSchema,
  createUploadIntentSchema,
  finalizeUploadIntentSchema,
  signedUrlEventSchema,
} from '../validation/upload-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { ApiError } from '../errors/api-error'

export function createUploadRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/upload-intents', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createUploadIntentSchema, request.body)
    const result = await createUploadService(getServiceContext(request)).createUploadIntent({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, {
      uploadIntent: result.uploadIntent,
      uploadTarget: result.uploadTarget,
      signedUrlEvent: result.signedUrlEvent,
    }, result.warnings, 201)
  }))

  router.put('/v1/upload-intents/:uploadIntentId/local-object', requireAuth, raw({
    type: ['application/octet-stream', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/wav', 'audio/mpeg', 'audio/mp3', 'image/png', 'image/jpeg', 'image/webp'],
    limit: '2gb',
  }), asyncRoute(async (request, response) => {
    if (!Buffer.isBuffer(request.body)) {
      throw new ApiError('VALIDATION_FAILED', 'Local object upload requires a raw request body.', 400)
    }

    const result = await createUploadService(getServiceContext(request)).uploadLocalObject(
      getRouteParam(request, 'uploadIntentId'),
      request.body,
      request.header('content-type')?.split(';')[0],
    )
    sendOk(response, { localObjectUpload: result.localObjectUpload }, result.warnings, 201)
  }))

  router.post('/v1/upload-intents/:uploadIntentId/finalize', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(finalizeUploadIntentSchema, request.body)
    const result = await createUploadService(getServiceContext(request)).finalizeUploadIntent({
      ...body,
      uploadIntentId: getRouteParam(request, 'uploadIntentId'),
    })
    sendOk(response, {
      uploadIntent: result.uploadIntent,
      storageObjectRecord: result.storageObjectRecord,
      mediaAsset: result.mediaAsset,
    }, result.warnings, 201)
  }))

  router.post('/v1/upload-intents/:uploadIntentId/signed-url-events', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(signedUrlEventSchema, request.body)
    const result = await createUploadService(getServiceContext(request)).recordSignedUrlEvent({
      ...body,
      uploadIntentId: getRouteParam(request, 'uploadIntentId'),
    })
    sendOk(response, { signedUrlEvent: result.signedUrlEvent }, result.warnings, 201)
  }))

  router.get('/v1/storage-objects/:storageObjectRecordId', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createUploadService(getServiceContext(request)).getStorageObjectRecord(
      getRouteParam(request, 'storageObjectRecordId'),
      workspaceId,
    )
    sendOk(response, {
      storageObjectRecord: result.storageObjectRecord,
      canonicalOnly: result.canonicalOnly,
    }, result.warnings)
  }))

  router.post('/v1/storage-objects/:storageObjectRecordId/download-target', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createDownloadTargetSchema, request.body)
    const result = await createUploadService(getServiceContext(request)).createDownloadTarget(
      getRouteParam(request, 'storageObjectRecordId'),
      body.workspaceId,
      body.urlPurpose,
    )
    sendOk(response, {
      downloadTarget: result.downloadTarget,
      signedUrlEvent: result.signedUrlEvent,
    }, result.warnings, 201)
  }))

  router.get('/v1/storage-objects/:storageObjectRecordId/local-object', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? '')
    if (!workspaceId) throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)

    const result = await createUploadService(getServiceContext(request)).createLocalObjectStream(
      getRouteParam(request, 'storageObjectRecordId'),
      workspaceId,
    )
    if (result.storageObjectRecord.mimeType) response.type(result.storageObjectRecord.mimeType)
    response.setHeader('x-reeditpro-storage-object-id', result.storageObjectRecord.id)
    result.stream.pipe(response)
  }))

  return router
}
