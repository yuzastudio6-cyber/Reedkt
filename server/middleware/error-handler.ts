import type { ErrorRequestHandler } from 'express'
import { createApiErrorEnvelope, getRequestId, normalizeUnknownError } from '../errors/api-error'
import type { RuntimeRequest } from '../types'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  void _next
  const nodeEnv = (request as RuntimeRequest).runtime?.env.nodeEnv ?? process.env.NODE_ENV
  const normalized = normalizeUnknownError(error, {
    exposeUnexpectedErrorMessages: nodeEnv !== 'production',
  })
  response.status(normalized.status).json(createApiErrorEnvelope(normalized, getRequestId(request)))
}
