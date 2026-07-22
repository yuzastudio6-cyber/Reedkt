import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  getApiRouteById,
  getFrontendSafeRoutes,
  getMockReadyRoutes,
} from '../../src/backend/api/api-route-registry'

const canonicalBrowserRouteIds = [
  'editExecution.canonicalPackageRequest.create',
  'editExecution.canonicalPrivateEditPreparation.create',
  'editExecution.canonicalPrivateReviewMedia.read',
  'editExecution.canonicalPrivateReviewDecision.create',
] as const

const customerDeliveryBrowserRouteIds = [
  'editExecution.professionalLongFormCustomerDeliveryDiscovery.read',
  'editExecution.professionalLongFormCustomerDeliveryQualityReview.read',
  'editExecution.professionalLongFormCustomerDeliveryQualityReviewMedia.read',
  'editExecution.professionalLongFormCustomerDeliveryWatchCheckpoint.create',
  'editExecution.professionalLongFormCustomerDeliveryQualityDecision.create',
  'editExecution.professionalLongFormCustomerDeliveryPrivateDownload.read',
] as const

const legacyMockOnlyRouteIds = [
  'editExecution.package.create',
  'editExecution.boundedAdapterExecutionGate.get',
  'editExecution.boundedAdapterSourceTruthReview.create',
  'editExecution.boundedAdapterExecutionRun.create',
  'editExecution.registeredAdapterRunnerProbe.create',
  'editExecution.registeredAdapterPrivateMediaRunner.create',
  'editExecution.registeredAdapterPrivateMediaRunnerQa.review',
  'editExecution.adapterWorkerArtifactIntegration.create',
  'editExecution.privateInternalTestRun.create',
  'editExecution.jobBatchPlan.create',
  'editExecution.mockQueue.create',
  'editExecution.dispatchReadiness.check',
  'editExecution.mockWorkerClaims.create',
  'editExecution.handlerDryRun.create',
  'editExecution.resultReconciliation.create',
  'editExecution.localWorkerOutput.persist',
  'editExecution.localWorkerOutputQa.review',
  'editExecution.workflowRehearsal.run',
  'editExecution.uploadedMediaWorkerExecution.create',
  'editExecution.privateWorkerArtifactQa.review',
  'editExecution.localMediaProcessingExecution.create',
  'editExecution.privateMediaArtifactQa.review',
  'editExecution.renderPreviewAssembly.create',
  'editExecution.userPreviewReview.create',
  'editExecution.finalRenderReadinessReview.create',
  'editExecution.finalRenderExecution.create',
  'editExecution.finalDeliveryQa.review',
  'editExecution.privateInternalDownloadDelivery.create',
] as const

const legacyBackendRequiredReadRouteIds = [
  'editExecution.package.get',
  'editExecution.privateInternalDownload.file.get',
  'editExecution.privateInternalDownload.manifest.get',
] as const

const frontendSafeIds = new Set(getFrontendSafeRoutes().map((route) => route.id))
const mockReadyIds = new Set(getMockReadyRoutes().map((route) => route.id))

for (const routeId of canonicalBrowserRouteIds) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must remain registered.`)
  assert.equal(route.runtimeMode, 'frontend_safe')
  assert.equal(route.status, 'frontend_safe_ready')
  assert.equal(route.requiresServiceRole, false)
  assert.equal(route.requiresProviderSecret, false)
  assert.equal(route.requiresStripeSecret, false)
  assert.equal(frontendSafeIds.has(routeId), true)
  assert.equal(mockReadyIds.has(routeId), false)
}

for (const routeId of customerDeliveryBrowserRouteIds) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must remain registered.`)
  assert.equal(route.runtimeMode, 'frontend_safe')
  assert.equal(route.status, 'frontend_safe_ready')
  assert.equal(route.requiresServiceRole, false)
  assert.equal(route.requiresProviderSecret, false)
  assert.equal(route.requiresStripeSecret, false)
  assert.equal(frontendSafeIds.has(routeId), true)
  assert.equal(mockReadyIds.has(routeId), false)
}

for (const routeId of legacyMockOnlyRouteIds) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must remain registered for historical mock fixtures.`)
  assert.equal(route.runtimeMode, 'mock')
  assert.equal(route.status, 'mock_ready')
  assert.ok(route.mockHandlerName, `${routeId} must retain its deterministic mock handler.`)
  assert.equal(frontendSafeIds.has(routeId), false)
  assert.equal(mockReadyIds.has(routeId), true)
}

for (const routeId of legacyBackendRequiredReadRouteIds) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must remain represented as historical metadata.`)
  assert.equal(route.runtimeMode, 'backend_required')
  assert.equal(route.status, 'backend_required')
  assert.equal(route.mockHandlerName, undefined)
  assert.equal(frontendSafeIds.has(routeId), false)
  assert.equal(mockReadyIds.has(routeId), false)
}

const previousMode = process.env.VITE_REEDITPRO_API_MODE
const previousBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const previousNodeEnv = process.env.NODE_ENV
const originalFetch = globalThis.fetch
let fetchCallCount = 0

try {
  process.env.NODE_ENV = 'test'
  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = 'https://api.reeditpro.invalid'
  globalThis.fetch = async () => {
    fetchCallCount += 1
    throw new Error('Legacy mock-only routes must be rejected before HTTP transport.')
  }

  const { callReeditProApi } = await import('../../src/backend/api/frontend-api-client')
  for (const routeId of [
    'editExecution.package.create',
    'editExecution.privateInternalTestRun.create',
    'editExecution.privateInternalDownload.file.get',
  ]) {
    const response = await callReeditProApi(routeId, {})
    assert.equal(response.ok, false)
    assert.equal(response.statusCode, 424)
    assert.equal(response.error?.code, 'backend_runtime_required')
  }

  const sourceSequenceResponse = await callReeditProApi(
    'media.sourceSequence.create',
    {
      workspaceId: 'workspace-route-selection-smoke',
      projectId: 'project-route-selection-smoke',
      uploads: [],
    },
  )
  assert.equal(sourceSequenceResponse.ok, true)
  assert.equal(sourceSequenceResponse.mockOnly, true)

  process.env.NODE_ENV = 'production'
  const deployedSourceSequenceResponse = await callReeditProApi(
    'media.sourceSequence.create',
    {
      workspaceId: 'workspace-route-selection-smoke',
      projectId: 'project-route-selection-smoke',
      uploads: [],
    },
  )
  assert.equal(deployedSourceSequenceResponse.ok, false)
  assert.equal(deployedSourceSequenceResponse.error?.code, 'backend_runtime_required')
  assert.equal(fetchCallCount, 0)
} finally {
  globalThis.fetch = originalFetch
  restoreEnv('NODE_ENV', previousNodeEnv)
  restoreEnv('VITE_REEDITPRO_API_MODE', previousMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', previousBaseUrl)
}

const serverRouteSource = readFileSync('server/routes/edit-execution-routes.ts', 'utf8')
const canonicalPackageIndex = serverRouteSource.indexOf(
  "'/v1/approved-snapshots/:snapshotId/canonical-execution-package'",
)
const internalServiceGateIndex = serverRouteSource.indexOf(
  "router.use('/v1/edit-executions', requireInternalServiceAuth)",
)
const legacyPackageIndex = serverRouteSource.indexOf(
  "router.post('/v1/edit-executions/packages',",
)
const legacyCatchAllIndex = serverRouteSource.indexOf(
  "router.use('/v1/edit-executions', requireAuth, asyncRoute(async () => {",
)
const legacyTestRunIndex = serverRouteSource.indexOf(
  "router.post('/v1/edit-executions/private-internal-test-runs',",
)
assert.ok(canonicalPackageIndex >= 0 && canonicalPackageIndex < internalServiceGateIndex)
assert.ok(internalServiceGateIndex >= 0 && internalServiceGateIndex < legacyPackageIndex)
assert.ok(legacyPackageIndex < legacyCatchAllIndex)
assert.ok(legacyCatchAllIndex < legacyTestRunIndex)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'canonical-browser-execution-route-selection-smoke-v1',
  canonicalBrowserRouteCount: canonicalBrowserRouteIds.length,
  customerDeliveryBrowserRouteCount: customerDeliveryBrowserRouteIds.length,
  legacyMockOnlyRouteCount: legacyMockOnlyRouteIds.length,
  legacyBackendRequiredReadRouteCount: legacyBackendRequiredReadRouteIds.length,
  deterministicLocalMetadataFallbackCount: 1,
  deployedMockMetadataFallbackAllowed: false,
  legacyHttpRequestCount: fetchCallCount,
  browserCanSelectWorkerToolOrLegacyExecutionStage: false,
  providerCallMade: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
