import type { ErrorRequestHandler } from 'express'
import { createApiErrorEnvelope, getRequestId, normalizeUnknownError } from '../errors/api-error'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  void _next
  const normalized = normalizeUnknownError(error)
  response.status(normalized.status).json(createApiErrorEnvelope(normalized, getRequestId(request)))
}
