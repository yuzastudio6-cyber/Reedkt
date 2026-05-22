import express from 'express'
import {
  loadStagingRenderInfrastructureCanaryEnv,
  runStagingRenderInfrastructureCanary,
} from '../services/staging-render-infrastructure-canary-service'

const DEFAULT_PORT = 8080

export function createStagingRenderCanaryApp(sourceEnv: Record<string, string | undefined> = process.env) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  app.post('/canary/render', async (request, response) => {
    const authHeader = request.header('authorization') ?? request.header('x-serverless-authorization') ?? ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      response.status(401).json({
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

    response.status(result.ok ? 200 : result.status === 'blocked' ? 400 : 500).json(result)
  })

  app.use((_request, response) => {
    response.status(404).json({
      ok: false,
      status: 'blocked',
      error: {
        code: 'canary_route_only',
        message: 'This staging canary service exposes only POST /canary/render.',
      },
    })
  })

  return app
}

export function startStagingRenderCanaryService(sourceEnv: Record<string, string | undefined> = process.env) {
  const port = Number(sourceEnv.PORT ?? sourceEnv.API_PORT ?? DEFAULT_PORT)
  const app = createStagingRenderCanaryApp(sourceEnv)
  return app.listen(port, () => {
    console.log(JSON.stringify({
      ok: true,
      status: 'listening',
      service: 'staging-render-infrastructure-canary',
      port,
    }))
  })
}

if (process.env.STAGING_RENDER_CANARY_DISABLE_AUTOSTART !== 'true') {
  startStagingRenderCanaryService()
}
