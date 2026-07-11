import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'

type EnvSnapshot = Record<string, string | undefined>

const ENV_KEYS = [
  'VITE_REEDITPRO_API_MODE',
  'VITE_REEDITPRO_API_BASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const

const previousEnv = snapshotEnv()
let healthServer: Server | undefined

try {
  process.env.VITE_REEDITPRO_API_MODE = 'mock'
  process.env.VITE_REEDITPRO_API_BASE_URL = ''

  const { getBackendRuntimeStatus } = await import('../../src/backend/api/backend-runtime-config')
  const { getFrontendApiClientStatus } = await import('../../src/backend/api/frontend-api-client')
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')

  const mockStatus = getBackendRuntimeStatus()
  assert.equal(mockStatus.mockOnly, true, 'Mock mode must stay available for local/offline testing.')
  assert.match(mockStatus.message, /mock-safe/i, 'Mock mode should clearly report mock-safe behavior.')

  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = 'https://api.reeditpro.test'
  process.env.VITE_SUPABASE_URL = 'https://supabase.reeditpro.test'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

  const frontendSafeStatus = getBackendRuntimeStatus()
  assert.equal(frontendSafeStatus.mockOnly, false, 'frontend_safe mode with an API base URL should enable reviewed HTTP transport.')
  assert.equal(frontendSafeStatus.configuredApiBaseUrl, 'https://api.reeditpro.test')
  assert.match(frontendSafeStatus.message, /reviewed frontend-safe HTTP transport/i)
  assert.ok(
    frontendSafeStatus.warnings.every((warning) => !/future implementation gate|does not perform live HTTP transport/i.test(warning)),
    'Runtime warnings must not use stale future-only HTTP transport wording.',
  )

  const clientStatus = getFrontendApiClientStatus()
  assert.equal(clientStatus.mockOnly, false, 'Frontend API client should report HTTP transport when frontend_safe mode is configured.')
  assert.match(clientStatus.message, /reviewed backend HTTP routes/i)

  const {
    buildInternalTestingReadinessReport,
    createInitialInternalTestingSessionProbe,
    probeInternalTestingApiConnection,
  } = await import('../../src/lib/internal-testing-readiness')
  const testingReadiness = buildInternalTestingReadinessReport()
  assert.equal(testingReadiness.readyForSignedInUploadTesting, true, 'Internal testing readiness should pass when Supabase, API transport, and reviewed routes are configured.')
  assert.equal(testingReadiness.apiHostLabel, 'api.reeditpro.test', 'Readiness UI should expose only the sanitized API host.')
  assert.ok(
    testingReadiness.items.every((item) => item.state !== 'blocked'),
    'Configured internal testing readiness should not report route blockers.',
  )
  assert.ok(
    testingReadiness.blockedScopes.includes('public sharing') &&
      testingReadiness.blockedScopes.includes('paid production') &&
    testingReadiness.blockedScopes.includes('frontend tool execution'),
    'Testing readiness must keep public, billing, and frontend tool execution scopes blocked.',
  )
  const sessionProbe = createInitialInternalTestingSessionProbe(testingReadiness)
  assert.equal(sessionProbe.state, 'checking', 'Configured internal testing readiness should expose a safe browser session check.')
  assert.match(sessionProbe.detail, /only reads the current Supabase browser session/i)

  const { createReeditProApiApp } = await import('../app')
  const { loadRuntimeEnv } = await import('../config/env')
  healthServer = createServer(createReeditProApiApp(loadRuntimeEnv({
    ...process.env,
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    E2E_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
  })))
  await listen(healthServer)
  const address = healthServer.address()
  assert(address && typeof address === 'object', 'Health smoke server should expose a TCP address.')
  process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`

  const connectionProbe = await probeInternalTestingApiConnection()
  assert.equal(connectionProbe.state, 'reachable', 'Internal testing connection probe should reach the backend /health route.')
  assert.match(connectionProbe.summary, /Backend health responded/i, 'Connection probe should report backend health success.')

  const reviewedInternalTestingRouteIds = [
    'projects.list',
    'projects.get',
    'projects.create',
    'projects.internalEditState.save',
    'projects.internalEditState.get',
    'projects.internalEditState.list',
    'editPreferences.getCurrent',
    'editPreferences.upsertCurrent',
    'media.uploadIntent.create',
    'media.uploadIntent.localObject.put',
    'media.uploadIntent.finalize',
    'media.storageObject.get',
    'media.storageObject.downloadTarget.create',
    'media.storageObject.localObject.get',
    'planning.approvedSnapshot.create',
    'planning.approvedSnapshot.get',
    'credits.estimate.approve',
    'credits.reserve',
    'editExecution.package.create',
    'editExecution.package.get',
    'editExecution.boundedAdapterSourceTruthReview.create',
    'editExecution.boundedAdapterExecutionRun.create',
    'editExecution.registeredAdapterRunnerProbe.create',
    'editExecution.registeredAdapterPrivateMediaRunner.create',
    'editExecution.registeredAdapterPrivateMediaRunnerQa.review',
    'editExecution.adapterWorkerArtifactIntegration.create',
    'editExecution.privateInternalTestRun.create',
    'editExecution.privateInternalDownload.file.get',
    'editExecution.privateInternalDownload.manifest.get',
  ]

  for (const routeId of reviewedInternalTestingRouteIds) {
    const route = getApiRouteById(routeId)
    assert.ok(route, `${routeId} must exist in the frontend API route registry.`)
    assert.equal(route?.runtimeMode, 'frontend_safe', `${routeId} must be frontend-safe for signed-in internal testing.`)
    assert.equal(route?.status, 'frontend_safe_ready', `${routeId} must be marked ready for reviewed frontend HTTP transport.`)
    assert.match(route?.path ?? '', /^\/v1\//, `${routeId} must use a reviewed /v1 backend route.`)
    assert.notEqual(route?.securityLevel, 'public', `${routeId} must not be a public testing route.`)
    assert.equal(route?.requiresServiceRole, false, `${routeId} must not expose service-role access to the frontend.`)
    assert.equal(route?.requiresProviderSecret, false, `${routeId} must not expose provider secrets to the frontend.`)
    assert.equal(route?.requiresStripeSecret, false, `${routeId} must not expose Stripe secrets to the frontend.`)
  }

  for (const routeId of [
    'jobs.batch.create',
    'jobs.create',
    'worker.lease.claim',
    'worker.lease.complete',
  ]) {
    const route = getApiRouteById(routeId)
    assert.ok(route, `${routeId} must stay represented in the route registry.`)
    assert.notEqual(route?.status, 'frontend_safe_ready', `${routeId} must not become a direct frontend execution route.`)
  }

  const docsToCheck = [
    'docs/backend-api-mock-runtime.md',
    'docs/backend-api-runtime-boundary.md',
    'docs/backend-runtime-local-dev.md',
  ]

  for (const docPath of docsToCheck) {
    const text = readFileSync(docPath, 'utf8')
    assert.ok(
      !/reserved for a future deployed API|does not perform live HTTP transport yet|live HTTP transport remains intentionally gated|Until then, `VITE_REEDITPRO_API_MODE=mock`/i.test(text),
      `${docPath} must not keep stale future-only HTTP transport wording.`,
    )
  }

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'mock_mode_stays_available',
      'frontend_safe_api_base_url_enables_reviewed_http_transport',
      'frontend_api_client_reports_http_transport',
      'project_edit_upload_snapshot_credit_and_private_review_routes_frontend_safe_ready',
      'backend_required_worker_routes_remain_gated',
      'runtime_docs_do_not_use_stale_future_only_transport_wording',
      'preferences_readiness_report_passes_with_supabase_api_and_reviewed_routes',
      'preferences_readiness_exposes_non_mutating_session_check',
      'live_backend_health_probe_reaches_deployed_api_surface',
    ],
    reviewedInternalTestingRouteCount: reviewedInternalTestingRouteIds.length,
    apiBaseUrlConfigured: frontendSafeStatus.hasBackendUrl,
    mockOnly: frontendSafeStatus.mockOnly,
  }, null, 2))
} finally {
  if (healthServer) await closeServer(healthServer)
  restoreEnv(previousEnv)
}

function snapshotEnv(): EnvSnapshot {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
}

function restoreEnv(snapshot: EnvSnapshot): void {
  for (const key of ENV_KEYS) {
    const value = snapshot[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
