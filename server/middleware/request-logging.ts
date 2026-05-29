import type { RequestHandler } from 'express'
import type { RuntimeEnv } from '../config/env'
import type { RuntimeRequest } from '../types'

export function createRequestLoggingMiddleware(env: RuntimeEnv): RequestHandler {
  return (request, response, next) => {
    if (env.nodeEnv === 'test') {
      next()
      return
    }

    const startedAt = Date.now()
    response.on('finish', () => {
      const requestId = (request as RuntimeRequest).context?.requestId ?? 'request-unknown'
      const durationMs = Date.now() - startedAt
      console.info(JSON.stringify({
        event: 'http_request',
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs,
      }))
    })
    next()
  }
}
