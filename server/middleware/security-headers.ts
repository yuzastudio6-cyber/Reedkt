import type { RequestHandler } from 'express'
import type { RuntimeEnv } from '../config/env'

export function createSecurityHeadersMiddleware(env: RuntimeEnv): RequestHandler {
  return (_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')

    if (env.nodeEnv === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
    }

    next()
  }
}
