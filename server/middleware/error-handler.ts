import type { ErrorRequestHandler } from 'express'
import {
  createApiErrorEnvelope,
  createApiErrorLogRecord,
  getRequestId,
  normalizeUnknownError,
  shouldExposeInternalErrorDetails,
} from '../errors/api-error'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  void _next
  const normalized = normalizeUnknownError(error)
  const requestId = getRequestId(request)
  const exposeInternalDetails = shouldExposeInternalErrorDetails(request)
  const envelope = createApiErrorEnvelope(normalized, requestId, { exposeInternalDetails })

  if (normalized.internal || normalized.status >= 500) {
    console.error(JSON.stringify(createApiErrorLogRecord(normalized, requestId, request)))
  }

  response.status(envelope.statusCode).json(envelope)
}
