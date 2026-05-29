import type { CorsOptions } from 'cors'
import type { RuntimeEnv } from '../config/env'

export function createCorsOptions(env: RuntimeEnv): CorsOptions {
  const allowedOrigins = parseAllowedOrigins(env.frontendUrl)
  const shouldRestrictOrigins = env.nodeEnv === 'production' || allowedOrigins.length > 0

  return {
    credentials: true,
    origin(origin, callback) {
      if (!shouldRestrictOrigins) {
        callback(null, true)
        return
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
  }
}

function parseAllowedOrigins(frontendUrl: string | undefined): string[] {
  return (frontendUrl ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}
