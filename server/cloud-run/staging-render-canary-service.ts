import express, { type Response } from 'express'
import { stringifyCanaryJson, summarizeCanaryError } from './canary-safe-json'
import {
  loadStagingRenderInfrastructureCanaryEnv,
  runStagingRenderInfrastructureCanary,
} from '../services/staging-render-infrastructure-canary-service'

const DEFAULT_PORT = 8080

export function createStagingRenderCanaryApp(sourceEnv: Record<string, string | undefined> = process.env) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  app.get('/canary/health', (_request, response) => {
    sendCanaryJson(response, 200, createStagingRenderCanaryRuntimeSummary(sourceEnv))
  })

  app.post('/canary/render', async (request, response) => {
    try {
      const authHeader = request.header('authorization') ?? request.header('x-serverless-authorization') ?? ''
      if (!authHeader.toLowerCase().startsWith('bearer ')) {
        sendCanaryJson(response, 401, {
          ok: false,
          status: 'blocked',
          error: {
            code: 'missing_cloud_run_id_token',
            message: 'A Google-signed ID token is required before the staging render canary can run.',
          },
        })
        return
      }

      const result = await runStagingRenderInfrastructureCanary(
        request.body && typeof request.body === 'object' ? request.body : {},
        loadStagingRenderInfrastructureCanaryEnv(sourceEnv),
      )

      sendCanaryJson(response, result.ok ? 200 : result.status === 'blocked' ? 400 : 500, result)
    } catch (error) {
      const summary = summarizeCanaryError(error)
      console.error(stringifyCanaryJson({
        ok: false,
        status: 'failed',
        service: 'staging-render-infrastructure-canary',
        error: summary,
      }))
      sendCanaryJson(response, 500, {
        ok: false,
        status: 'failed',
        error: {
          code: 'staging_render_canary_service_failed',
          message: summary.message,
        },
      })
    }
  })

  app.use((_request, response) => {
    sendCanaryJson(response, 404, {
      ok: false,
      status: 'blocked',
      error: {
        code: 'canary_route_only',
        message: 'This staging canary service exposes only POST /canary/render and GET /canary/health.',
      },
    })
  })

  return app
}

export function startStagingRenderCanaryService(sourceEnv: Record<string, string | undefined> = process.env) {
  const port = Number(sourceEnv.PORT ?? sourceEnv.API_PORT ?? DEFAULT_PORT)
  const app = createStagingRenderCanaryApp(sourceEnv)
  return app.listen(port, () => {
    console.log(stringifyCanaryJson({
      ...createStagingRenderCanaryRuntimeSummary(sourceEnv),
      ok: true,
      status: 'listening',
      port,
    }))
  })
}

if (process.env.STAGING_RENDER_CANARY_DISABLE_AUTOSTART !== 'true') {
  startStagingRenderCanaryService()
}

function sendCanaryJson(response: Response, statusCode: number, value: unknown): void {
  response.status(statusCode).type('application/json').send(stringifyCanaryJson(value))
}

export function createStagingRenderCanaryRuntimeSummary(
  sourceEnv: Record<string, string | undefined> = process.env,
) {
  const env = loadStagingRenderInfrastructureCanaryEnv(sourceEnv)
  return {
    ok: true,
    status: 'ready',
    service: 'staging-render-infrastructure-canary',
    mode: env.serviceMode,
    runtime: {
      nodeOptionsPresent: Boolean(env.nodeOptions),
      nodeOptions: env.nodeOptions ? env.nodeOptions : 'missing',
      memory: env.memory || 'missing',
      cpu: Number.isFinite(env.cpu) ? env.cpu : 'missing',
      concurrency: Number.isFinite(env.concurrency) ? env.concurrency : 'missing',
      timeoutSeconds: env.renderTimeoutSeconds,
      maxArtifactBytes: env.maxArtifactBytes,
    },
    stagingOnly: env.serviceMode === 'staging_cloud_run_remotion_canary',
    noProviderCallsConfigured: env.forbiddenEnvNames.length === 0,
    noSecretsReported: true,
  }
}
