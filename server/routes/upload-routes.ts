import { Router, raw, type NextFunction, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import { LOCAL_RAW_UPLOAD_MAX_BYTES, assertLocalRawUploadByteLength } from '../storage/storage-validation'
import type { RuntimeRequest } from '../types'
import {
  createDownloadTargetSchema,
  createUploadIntentSchema,
  finalizeUploadIntentSchema,
  localUploadWorkspaceQuerySchema,
  signedUrlEventSchema,
} from '../validation/upload-schemas'
import { buildSourceBindingManifestCandidateSchema } from '../validation/source-media-authority-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { ApiError } from '../errors/api-error'

const LOCAL_RAW_UPLOAD_MIME_TYPES = [
  'application/octet-stream',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
  'video/x-matroska',
  'video/x-msvideo',
  'video/mp2t',
  'application/mxf',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/aac',
  'image/png',
  'image/jpeg',
  'image/webp',
]

const requireBoundedLocalRawUpload = createBoundedLocalRawUploadMiddleware()
const requireBoundedUploadMetadataWrite = createBoundedAuthenticatedUploadMiddleware({
  windowMs: 60_000,
  maxAttemptsPerWindow: 60,
  maxConcurrentPerUser: 8,
  routeLabel: 'upload metadata write',
})
const parseBoundedLocalRawUpload = raw({
  type: LOCAL_RAW_UPLOAD_MIME_TYPES,
  limit: LOCAL_RAW_UPLOAD_MAX_BYTES,
  inflate: false,
})

export function createUploadRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/upload-intents', requireAuth, requireBoundedUploadMetadataWrite, requireUploadIntentCreateAccess, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createUploadIntentSchema, request.body)
    const result = await createUploadService(getServiceContext(request)).createUploadIntent({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, {
      uploadIntent: result.uploadIntent,
      uploadTarget: result.uploadTarget,
      signedUrlEvent: result.signedUrlEvent,
    }, result.warnings, 201)
  }))

  router.put(
    '/v1/upload-intents/:uploadIntentId/local-object',
    requireAuth,
    requireBoundedLocalRawUpload,
    requireLocalUploadIntentAccess,
    parseBoundedLocalRawUpload,
    asyncRoute(async (request, response) => {
      if (!Buffer.isBuffer(request.body)) {
        throw new ApiError('VALIDATION_FAILED', 'Local object upload requires a raw request body.', 400)
      }

      const declaredContentLength = getRequiredLocalRawContentLength(request)
      const query = validateBody(localUploadWorkspaceQuerySchema, request.query)
      if (request.body.byteLength !== declaredContentLength) {
        throw new ApiError('VALIDATION_FAILED', 'Local raw upload body size does not match Content-Length.', 400, {
          declaredContentLength,
          actualSizeBytes: request.body.byteLength,
        })
      }

      const result = await createUploadService(getServiceContext(request)).uploadLocalObject(
        getRouteParam(request, 'uploadIntentId'),
        query.workspaceId,
        request.body,
        request.header('content-type')?.split(';')[0],
        declaredContentLength,
      )
      sendOk(response, { localObjectUpload: result.localObjectUpload }, result.warnings, 201)
    }),
  )

  router.post('/v1/upload-intents/:uploadIntentId/finalize', requireAuth, requireBoundedUploadMetadataWrite, requireUploadIntentFinalizeAccess, requireIdempotency, asyncRoute(async (request, response) => {
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

  router.post('/v1/upload-intents/:uploadIntentId/signed-url-events', requireAuth, requireBoundedUploadMetadataWrite, requireSignedUrlEventAccess, requireIdempotency, asyncRoute(async (request, response) => {
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

  router.post('/v1/storage-objects/:storageObjectRecordId/download-target', requireAuth, requireBoundedUploadMetadataWrite, requireStorageObjectDownloadAccess, requireIdempotency, asyncRoute(async (request, response) => {
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
    if (result.storageObjectRecord.sizeBytes !== undefined) {
      response.setHeader('content-length', String(result.storageObjectRecord.sizeBytes))
    }
    response.setHeader('cache-control', 'no-store')
    response.setHeader('content-disposition', `attachment; filename="${contentDispositionFileNameFromObjectPath(result.storageObjectRecord.objectPath)}"`)
    response.setHeader('x-content-type-options', 'nosniff')
    response.setHeader('x-reeditpro-storage-object-id', result.storageObjectRecord.id)
    result.stream.pipe(response)
  }))

  router.post(
    '/v1/internal/source-media-authority/manifest-candidates',
    requireAuth,
    requireInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(buildSourceBindingManifestCandidateSchema, request.body)
      const result = await createSourceMediaAuthorityService(getServiceContext(request))
        .buildManifestCandidate(body)
      sendOk(response, {
        sourceBindingManifestCandidate: result.sourceBindingManifestCandidate,
      }, result.warnings, 201)
    }),
  )

  return router
}

async function requireUploadIntentCreateAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(createUploadIntentSchema, request.body)
    await createUploadService(getServiceContext(request)).authorizeCreateUploadIntent({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
    })
    next()
  } catch (error) {
    next(error)
  }
}

async function requireLocalUploadIntentAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = validateBody(localUploadWorkspaceQuerySchema, request.query)
    await createUploadService(getServiceContext(request)).authorizeLocalObjectUpload(
      getRouteParam(request, 'uploadIntentId'),
      query.workspaceId,
      request.header('content-type')?.split(';')[0],
      getRequiredLocalRawContentLength(request),
    )
    next()
  } catch (error) {
    next(error)
  }
}

async function requireUploadIntentFinalizeAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(finalizeUploadIntentSchema, request.body)
    await createUploadService(getServiceContext(request)).authorizeUploadIntentWrite(
      getRouteParam(request, 'uploadIntentId'),
      body.workspaceId,
    )
    next()
  } catch (error) {
    next(error)
  }
}

async function requireSignedUrlEventAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(signedUrlEventSchema, request.body)
    await createUploadService(getServiceContext(request)).authorizeSignedUrlEvent({
      ...body,
      uploadIntentId: getRouteParam(request, 'uploadIntentId'),
    })
    next()
  } catch (error) {
    next(error)
  }
}

async function requireStorageObjectDownloadAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(createDownloadTargetSchema, request.body)
    await createUploadService(getServiceContext(request)).authorizeStorageObjectRead(
      getRouteParam(request, 'storageObjectRecordId'),
      body.workspaceId,
      body.urlPurpose,
    )
    next()
  } catch (error) {
    next(error)
  }
}

function createBoundedLocalRawUploadMiddleware() {
  const windows = new Map<string, { windowStartedAt: number; attempts: number; active: number }>()
  const windowMs = 60_000
  const maxAttemptsPerWindow = 12
  const maxConcurrentPerUser = 2

  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      const runtimeRequest = request as RuntimeRequest
      const env = runtimeRequest.runtime?.env
      const userId = runtimeRequest.context?.auth?.userId
      if (!env || !userId) {
        throw new ApiError('INTERNAL_ERROR', 'Authenticated runtime state is required for local upload protection.', 500)
      }
      if (
        env.nodeEnv === 'production' ||
        (env.mode !== 'local' && env.mode !== 'mock') ||
        env.storageMode !== 'local'
      ) {
        throw new ApiError(
          'MOCK_ONLY',
          'Direct backend byte uploads are disabled for this runtime. Use the temporary signed/direct object-storage target returned by the upload-intent endpoint, then finalize the upload.',
          409,
        )
      }

      assertSafeLocalRawHeaders(request)
      getRequiredLocalRawContentLength(request)

      const now = Date.now()
      if (windows.size > 1_000) {
        for (const [key, value] of windows) {
          if (now - value.windowStartedAt >= windowMs && value.active === 0) windows.delete(key)
        }
      }
      const existing = windows.get(userId)
      const window = !existing || now - existing.windowStartedAt >= windowMs
        ? { windowStartedAt: now, attempts: 0, active: existing?.active ?? 0 }
        : existing
      if (window.attempts >= maxAttemptsPerWindow) {
        throw new ApiError('VALIDATION_FAILED', 'Too many local raw upload attempts. Retry after the bounded upload window.', 429)
      }
      if (window.active >= maxConcurrentPerUser) {
        throw new ApiError('VALIDATION_FAILED', 'Too many concurrent local raw uploads for this user.', 429)
      }

      window.attempts += 1
      window.active += 1
      windows.set(userId, window)
      let released = false
      const release = () => {
        if (released) return
        released = true
        window.active = Math.max(0, window.active - 1)
      }
      response.once('finish', release)
      response.once('close', release)
      next()
    } catch (error) {
      next(error)
    }
  }
}

function createBoundedAuthenticatedUploadMiddleware(input: {
  windowMs: number
  maxAttemptsPerWindow: number
  maxConcurrentPerUser: number
  routeLabel: string
}) {
  const windows = new Map<string, { windowStartedAt: number; attempts: number; active: number }>()

  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      const userId = (request as RuntimeRequest).context?.auth?.userId
      if (!userId) {
        throw new ApiError('INTERNAL_ERROR', `Authenticated runtime state is required for ${input.routeLabel} protection.`, 500)
      }
      const now = Date.now()
      if (windows.size > 2_000) {
        for (const [key, value] of windows) {
          if (now - value.windowStartedAt >= input.windowMs && value.active === 0) windows.delete(key)
        }
      }
      const existing = windows.get(userId)
      const window = !existing || now - existing.windowStartedAt >= input.windowMs
        ? { windowStartedAt: now, attempts: 0, active: existing?.active ?? 0 }
        : existing
      if (window.attempts >= input.maxAttemptsPerWindow) {
        throw new ApiError('VALIDATION_FAILED', `Too many ${input.routeLabel} attempts. Retry after the bounded request window.`, 429)
      }
      if (window.active >= input.maxConcurrentPerUser) {
        throw new ApiError('VALIDATION_FAILED', `Too many concurrent ${input.routeLabel} requests for this user.`, 429)
      }
      window.attempts += 1
      window.active += 1
      windows.set(userId, window)
      let released = false
      const release = () => {
        if (released) return
        released = true
        window.active = Math.max(0, window.active - 1)
      }
      response.once('finish', release)
      response.once('close', release)
      next()
    } catch (error) {
      next(error)
    }
  }
}

function assertSafeLocalRawHeaders(request: Request): void {
  const contentEncoding = request.header('content-encoding')?.trim().toLowerCase()
  if (contentEncoding && contentEncoding !== 'identity') {
    throw new ApiError('VALIDATION_FAILED', 'Compressed request bodies are not accepted by the local raw upload route.', 415)
  }
  if (request.header('transfer-encoding')) {
    throw new ApiError('VALIDATION_FAILED', 'Chunked transfer is not accepted by the local raw upload route; Content-Length is required.', 411)
  }
  const contentType = request.header('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (!contentType || !LOCAL_RAW_UPLOAD_MIME_TYPES.includes(contentType)) {
    throw new ApiError('VALIDATION_FAILED', 'A supported Content-Type is required for local raw upload.', 415)
  }
}

function getRequiredLocalRawContentLength(request: Request): number {
  const headerValue = request.header('content-length')?.trim()
  if (!headerValue || !/^\d+$/.test(headerValue)) {
    throw new ApiError('VALIDATION_FAILED', 'Content-Length is required for local raw upload.', 411)
  }
  const contentLength = Number(headerValue)
  assertLocalRawUploadByteLength(contentLength)
  return contentLength
}

function contentDispositionFileNameFromObjectPath(objectPath: string): string {
  const fallback = 'reeditpro-private-source'
  const fileName = objectPath.split('/').filter(Boolean).at(-1) ?? fallback
  const safeFileName = Array.from(fileName, (character) => {
    const codePoint = character.codePointAt(0) ?? -1
    const isUnsafeSeparator = character === '\\' || character === '/' || character === '"'
    const isUnsafeControl = codePoint <= 0x1f || codePoint === 0x7f
    return isUnsafeSeparator || isUnsafeControl ? '_' : character
  }).join('').trim()
  return safeFileName || fallback
}
