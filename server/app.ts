import cors from 'cors'
import express, { type Express } from 'express'
import type { RuntimeEnv } from './config/env'
import { createSupabaseAdminClient } from './supabase/admin-client'
import { createSupabasePublicClient } from './supabase/public-client'
import { requestIdMiddleware } from './middleware/request-id'
import { errorHandlerMiddleware } from './middleware/error-handler'
import { createApprovalRoutes } from './routes/approval-routes'
import { createBetaReadinessRoutes } from './routes/beta-readiness-routes'
import { createChatRoutes } from './routes/chat-routes'
import { createCreditDataRoutes } from './routes/credit-data-routes'
import { createCreditEstimateRoutes } from './routes/credit-estimate-routes'
import { createCreditPurchaseRoutes } from './routes/credit-purchase-routes'
import { createCreditReservationRoutes } from './routes/credit-reservation-routes'
import { createCreditRoutes } from './routes/credit-routes'
import { createHealthRoutes } from './routes/health-routes'
import { createJobRoutes } from './routes/job-routes'
import { createProjectRoutes } from './routes/project-routes'
import { createProviderGatewayRoutes } from './routes/provider-gateway-routes'
import { createRenderRoutes } from './routes/render-routes'
import { createToolCostRoutes } from './routes/tool-cost-routes'
import { createTrackBAgentToolRoutes } from './routes/trackb-agent-tool-routes'
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
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use((request, _response, next) => {
    ;(request as RuntimeRequest).runtime = runtime
    next()
  })
  app.use(requestIdMiddleware)

  app.use(createHealthRoutes())
  app.use(createBetaReadinessRoutes())
  app.use(createProjectRoutes())
  app.use(createChatRoutes())
  app.use(createUploadRoutes())
  app.use(createApprovalRoutes())
  app.use(createCreditRoutes())
  app.use(createCreditDataRoutes())
  app.use(createCreditEstimateRoutes())
  app.use(createCreditPurchaseRoutes())
  app.use(createCreditReservationRoutes())
  app.use(createJobRoutes())
  app.use(createWorkerRoutes())
  app.use(createRenderRoutes())
  app.use(createToolCostRoutes())
  app.use(createProviderGatewayRoutes())
  app.use(createTrackBAgentToolRoutes())

  app.use(errorHandlerMiddleware)
  return app
}
