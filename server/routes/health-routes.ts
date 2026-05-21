import { Router } from 'express'
import { createSafeRuntimeSummary } from '../config/env'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export function createHealthRoutes(): Router {
  const router = Router()

  router.get('/health', (request, response) => {
    const context = getServiceContext(request)
    sendOk(response, {
      service: 'reeditpro-api',
      status: 'ok',
      requestId: context.requestId,
      runtime: {
        mode: context.env.mode,
        mockOnly: context.env.mockOnly,
      },
    })
  })

  router.get('/health/readiness', (request, response) => {
    const context = getServiceContext(request)
    sendOk(response, {
      envLoaded: true,
      runtime: createSafeRuntimeSummary(context.env),
      requiredRuntimeTablesKnown: [
        'approved_plan_snapshots',
        'api_idempotency_keys',
        'upload_intents',
        'storage_object_records',
        'signed_url_events',
        'worker_job_claims',
        'tool_runtime_checks',
        'provider_request_attempts',
        'provider_webhook_events',
      ],
      providerRealCallsEnabled: false,
    }, context.env.warnings)
  })

  router.get('/health/tool-readiness', asyncRoute(async (request, response) => {
    const context = getServiceContext(request)
    const shouldRun = request.query.run === 'true'
    if (shouldRun) {
      const result = await runToolReadinessChecks(context, {
        workspaceId: typeof request.query.workspaceId === 'string' ? request.query.workspaceId : undefined,
        workerType: 'health_tool_readiness',
        recordResults: Boolean(context.clients.admin && !context.env.mockOnly && request.query.record === 'true'),
      })
      sendOk(response, {
        checks: result.checks,
        missingTools: result.missingRequiredTools,
        runtimeMode: result.runtimeMode,
        mockOnly: context.env.mockOnly,
      }, result.warnings)
      return
    }

    if (!context.clients.admin || context.env.mockOnly) {
      sendOk(response, {
        missingTools: ['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright'],
        checks: [],
        mockOnly: true,
      }, ['Tool readiness reads are mock-only without Supabase admin runtime.'])
      return
    }

    const { data, error } = await context.clients.admin
      .from('tool_runtime_checks')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(50)

    if (error) throw error

    sendOk(response, {
      checks: data ?? [],
      missingTools: [],
    })
  }))

  return router
}
