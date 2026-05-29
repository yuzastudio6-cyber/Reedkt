import cors from 'cors'
import express, { type Express } from 'express'
import type { RuntimeEnv } from './config/env'
import { createSupabaseAdminClient } from './supabase/admin-client'
import { createSupabasePublicClient } from './supabase/public-client'
import { createCorsOptions } from './middleware/cors-policy'
import { requestIdMiddleware } from './middleware/request-id'
import { createRequestLoggingMiddleware } from './middleware/request-logging'
import { createSecurityHeadersMiddleware } from './middleware/security-headers'
import { notFoundMiddleware } from './middleware/not-found'
import { errorHandlerMiddleware } from './middleware/error-handler'
import { createApprovalRoutes } from './routes/approval-routes'
import { createChatRoutes } from './routes/chat-routes'
import { createCreditRoutes } from './routes/credit-routes'
import { createHealthRoutes } from './routes/health-routes'
import { createJobRoutes } from './routes/job-routes'
import { createProjectRoutes } from './routes/project-routes'
import { createProviderGatewayRoutes } from './routes/provider-gateway-routes'
import { createRenderRoutes } from './routes/render-routes'
import { createUploadRoutes } from './routes/upload-routes'
import { createWorkerRoutes } from './routes/worker-routes'
import type { RuntimeRequest, RuntimeState } from './types'

export function createReeditProApiApp(env: RuntimeEnv): Express {
  const runtime: RuntimeState = {
    env,
    clients: {
      admin: createSupabaseAdminClient(env),
      public: createSupabasePublicClient(env),
    },
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(createSecurityHeadersMiddleware(env))
  app.use(cors(createCorsOptions(env)))
  app.use(express.json({ limit: '1mb' }))
  app.use((request, _response, next) => {
    ;(request as RuntimeRequest).runtime = runtime
    next()
  })
  app.use(requestIdMiddleware)
  app.use(createRequestLoggingMiddleware(env))

  app.use(createHealthRoutes())
  app.use(createProjectRoutes())
  app.use(createChatRoutes())
  app.use(createUploadRoutes())
  app.use(createApprovalRoutes())
  app.use(createCreditRoutes())
  app.use(createJobRoutes())
  app.use(createWorkerRoutes())
  app.use(createRenderRoutes())
  app.use(createProviderGatewayRoutes())

  app.use(notFoundMiddleware)
  app.use(errorHandlerMiddleware)
  return app
}
