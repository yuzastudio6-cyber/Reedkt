import { Router } from 'express'
import { createSafeRuntimeSummary } from '../config/env'
import { createApiRouteMapSummary, getRouteProductionReadiness, REEDITPRO_API_ROUTES } from '../../src/backend/api/api-route-registry'
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
      executionRoutesEnabled: false,
      routeCapabilityReportingEnabled: true,
    }, context.env.warnings)
  })

  router.get('/health/runtime-status', (request, response) => {
    const context = getServiceContext(request)
    sendOk(response, {
      runtime: createSafeRuntimeSummary(context.env),
      requestId: context.requestId,
      productionExecutionEnabled: false,
      blockedRouteGroups: ['jobs', 'workers', 'providers', 'generation', 'render', 'tools', 'stripe', 'media_analysis'],
      limitedFoundationRouteGroups: ['auth', 'projects', 'storage', 'planning', 'credits'],
      blockers: [
        'No deployed production backend runtime is enabled by Prompt 7.',
        'Provider, worker, render, tool, Stripe, job, media analysis, and generation routes remain blocked.',
        'Remote Supabase validation and migrations are intentionally not run in Prompt 7.',
      ],
    }, context.env.warnings)
  })

  router.get('/health/routes', (request, response) => {
    const context = getServiceContext(request)
    const summary = createApiRouteMapSummary()
    sendOk(response, {
      summary,
      routes: REEDITPRO_API_ROUTES.map((route) => ({
        id: route.id,
        domain: route.domain,
        method: route.method,
        path: route.path,
        status: route.status,
        runtimeMode: route.runtimeMode,
        securityLevel: route.securityLevel,
        requiresServiceRole: route.requiresServiceRole,
        requiresProviderSecret: route.requiresProviderSecret,
        requiresStripeSecret: route.requiresStripeSecret,
        idempotencyRequired: route.idempotencyRequired ?? route.method !== 'GET',
        failClosedBehavior: route.failClosedBehavior ?? (route.status === 'backend_required' || route.status === 'disabled'
          ? 'Returns backend_required/blocked and performs no production side effects.'
          : 'Must still use route-specific guards before side effects.'),
        productionReadiness: getRouteProductionReadiness(route),
      })),
      executionRoutesEnabled: false,
    }, context.env.warnings)
  })

  router.get('/health/tool-readiness', asyncRoute(async (_request, response) => {
    sendOk(response, {
      status: 'backend_required',
      checks: [],
      missingTools: ['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright'],
      executionAttempted: false,
      recordResults: false,
      blockers: [
        'Prompt 7 health routes report tool-readiness capability only.',
        'API-triggered tool checks and tool_runtime_checks writes remain blocked until Prompt 13.',
      ],
    }, ['Tool readiness execution is intentionally disabled from health routes in Prompt 7.'])
  }))

  return router
}
