import cors from 'cors'
import express, { type Express } from 'express'
import type { RuntimeEnv } from './config/env'
import { createSupabaseAdminClient } from './supabase/admin-client'
import { createSupabasePublicClient } from './supabase/public-client'
import { requestIdMiddleware } from './middleware/request-id'
import { errorHandlerMiddleware } from './middleware/error-handler'
import { isExplicitLocalInternalTestRuntime } from './middleware/canonical-worker-runtime'
import { REEDITPRO_USER_AUTHORIZATION_HEADER } from './middleware/browser-api-auth-transport'
import { createApprovalRoutes } from './routes/approval-routes'
import { createChatRoutes } from './routes/chat-routes'
import { createCreditDataRoutes } from './routes/credit-data-routes'
import { createCreditEstimateRoutes } from './routes/credit-estimate-routes'
import { createCreditRoutes } from './routes/credit-routes'
import { createEditExecutionRoutes } from './routes/edit-execution-routes'
import { createEditBriefAuthorityRoutes } from './routes/edit-brief-authority-routes'
import { createEditPlanningAuthorityRoutes } from './routes/edit-planning-authority-routes'
import { createEditPreferenceRoutes } from './routes/edit-preference-routes'
import { createEditReferenceRoutes } from './routes/edit-reference-routes'
import { createEditReferenceTargetVideoUnderstandingRoutes } from './routes/edit-reference-target-video-understanding-routes'
import { createExactEditPreferenceRoutes } from './routes/exact-edit-preference-routes'
import { createHealthRoutes } from './routes/health-routes'
import { createInternalEditStateRoutes } from './routes/internal-edit-state-routes'
import { createJobRoutes } from './routes/job-routes'
import { createProjectEditBriefLocalRoutes } from './routes/project-edit-brief-local-routes'
import { createProjectEditPlanRoutes } from './routes/project-edit-plan-routes'
import { createProjectEditSessionRoutes } from './routes/project-edit-session-routes'
import { createProjectRoutes } from './routes/project-routes'
import { createPreferenceIntelligenceRoutes } from './routes/preference-intelligence-routes'
import { createProviderGatewayRoutes } from './routes/provider-gateway-routes'
import { createRenderRoutes } from './routes/render-routes'
import { createToolCostRoutes } from './routes/tool-cost-routes'
import { createUploadRoutes } from './routes/upload-routes'
import { createWorkerRoutes } from './routes/worker-routes'
import type { EditReferenceStudyChatRuntimePort } from './services/edit-reference-study-chat-runtime-port'
import type { CanonicalMotionStudioStorytellingProductionAuthorityReaderPort } from './services/canonical-motion-studio-storytelling-production-authority-service'
import type { EditReferenceExactEditApplyRuntimePort } from './services/edit-reference-exact-edit-apply-runtime-port'
import type { StorageAdapter } from './storage/storage-types'
import type { RuntimeClients, RuntimeRequest, RuntimeState } from './types'

export interface ReeditProApiAppOptions {
  storageAdapter?: StorageAdapter
  clients?: RuntimeClients
  planningPreferenceApplicationAuthorityPort?: RuntimeState['planningPreferenceApplicationAuthorityPort']
  canonicalDurableUploadTargetStatePort?: RuntimeState['canonicalDurableUploadTargetStatePort']
  canonicalUploadTargetCredentialEscrow?: RuntimeState['canonicalUploadTargetCredentialEscrow']
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
}

export function createReeditProApiApp(env: RuntimeEnv, options: ReeditProApiAppOptions = {}): Express {
  const runtime: RuntimeState = {
    env,
    ...(options.storageAdapter ? { storageAdapter: options.storageAdapter } : {}),
    ...(options.planningPreferenceApplicationAuthorityPort
      ? { planningPreferenceApplicationAuthorityPort: options.planningPreferenceApplicationAuthorityPort }
      : {}),
    ...(options.canonicalDurableUploadTargetStatePort
      ? { canonicalDurableUploadTargetStatePort: options.canonicalDurableUploadTargetStatePort }
      : {}),
    ...(options.canonicalUploadTargetCredentialEscrow
      ? { canonicalUploadTargetCredentialEscrow: options.canonicalUploadTargetCredentialEscrow }
      : {}),
    ...(options.editReferenceStudyChatRuntimePort
      ? { editReferenceStudyChatRuntimePort: options.editReferenceStudyChatRuntimePort }
      : {}),
    ...(options.canonicalMotionStudioStorytellingProductionAuthorityReaderPort
      ? {
          canonicalMotionStudioStorytellingProductionAuthorityReaderPort:
            options.canonicalMotionStudioStorytellingProductionAuthorityReaderPort,
        }
      : {}),
    ...(options.editReferenceExactEditApplyRuntimePort
      ? { editReferenceExactEditApplyRuntimePort: options.editReferenceExactEditApplyRuntimePort }
      : {}),
    clients: options.clients ?? {
      admin: createSupabaseAdminClient(env),
      public: createSupabasePublicClient(env),
    },
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(cors({
    origin: createCorsOriginPolicy(env),
    credentials: false,
    allowedHeaders: [
      'accept',
      'authorization',
      'content-type',
      'idempotency-key',
      'range',
      'x-request-id',
      REEDITPRO_USER_AUTHORIZATION_HEADER,
    ],
    exposedHeaders: [
      'accept-ranges',
      'cache-control',
      'content-disposition',
      'content-length',
      'content-range',
      'content-type',
      'x-reeditpro-artifact-sha256',
      'x-reeditpro-private-download-delivery-id',
      'x-reeditpro-quality-decision-sha256',
      'x-reeditpro-quality-review-packet-sha256',
      'x-reeditpro-review-assembly-id',
      'x-reeditpro-review-decision-manifest-sha256',
      'x-reeditpro-review-manifest-sha256',
    ],
  }))
  app.use((_request, response, next) => {
    response.setHeader('x-content-type-options', 'nosniff')
    response.setHeader('x-frame-options', 'DENY')
    response.setHeader('referrer-policy', 'no-referrer')
    response.setHeader('permissions-policy', 'camera=(), geolocation=(), microphone=()')
    response.setHeader('cross-origin-resource-policy', 'same-site')
    response.setHeader('cache-control', 'no-store')
    if (env.nodeEnv === 'production') {
      response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })
  app.use(express.json({ limit: env.jsonBodyLimit }))
  app.use((request, _response, next) => {
    ;(request as RuntimeRequest).runtime = runtime
    next()
  })
  app.use(requestIdMiddleware)

  app.use(createHealthRoutes())
  app.use(createProjectRoutes())
  if (isExplicitLocalInternalTestRuntime(env)) {
    app.use(createProjectEditSessionRoutes())
    app.use(createProjectEditBriefLocalRoutes())
    app.use(createProjectEditPlanRoutes())
  }
  app.use(createEditPreferenceRoutes())
  app.use(createExactEditPreferenceRoutes())
  app.use(createEditReferenceRoutes())
  app.use(createEditReferenceTargetVideoUnderstandingRoutes())
  app.use(createPreferenceIntelligenceRoutes())
  app.use(createEditBriefAuthorityRoutes())
  app.use(createInternalEditStateRoutes())
  app.use(createChatRoutes())
  app.use(createUploadRoutes())
  app.use(createEditPlanningAuthorityRoutes())
  app.use(createApprovalRoutes())
  app.use(createCreditRoutes())
  app.use(createCreditDataRoutes())
  app.use(createCreditEstimateRoutes())
  app.use(createToolCostRoutes())
  app.use(createEditExecutionRoutes({
    includeInternalTestRoutes: isExplicitLocalInternalTestRuntime(env),
  }))
  app.use(createJobRoutes())
  app.use(createWorkerRoutes())
  app.use(createRenderRoutes())
  app.use(createProviderGatewayRoutes())

  app.use(errorHandlerMiddleware)
  return app
}

function createCorsOriginPolicy(env: RuntimeEnv) {
  const configuredOrigins = new Set(env.allowedCorsOrigins)
  const localOriginsAllowed = env.nodeEnv !== 'production' && (env.mode === 'local' || env.mode === 'mock')

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || configuredOrigins.has(origin)) {
      callback(null, true)
      return
    }

    if (localOriginsAllowed) {
      try {
        const hostname = new URL(origin).hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          callback(null, true)
          return
        }
      } catch {
        // Invalid origins fail closed below.
      }
    }

    callback(null, false)
  }
}
