import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'
import { INTERNAL_SERVICE_TOKEN_HEADER } from '../middleware/internal-service-auth'

const internalToken = 'edit-execution-boundary-internal-token'
const productionBase = {
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
} satisfies NodeJS.ProcessEnv

assert.throws(
  () => loadRuntimeEnv({ ...productionBase, NODE_ENV: 'Production' }),
  /invalid option/i,
  'Unknown or incorrectly cased runtime environments must fail closed instead of mounting non-production routes.',
)

assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({
    ...productionBase,
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  })),
  /forbidden in production/i,
  'Production startup must reject the internal-test execution escape hatch.',
)

for (const mode of ['local', 'mock'] as const) {
  assert.throws(
    () => assertRuntimeCanStart(loadRuntimeEnv({ ...productionBase, E2E_RUNTIME_MODE: mode })),
    /must not use local or mock execution/i,
    `Production startup must reject E2E_RUNTIME_MODE=${mode}.`,
  )
}

for (const workerMode of ['local', 'mock'] as const) {
  assert.throws(
    () => assertRuntimeCanStart(loadRuntimeEnv({ ...productionBase, WORKER_RUNTIME_MODE: workerMode })),
    /must not use local or mock execution/i,
    `Production startup must reject WORKER_RUNTIME_MODE=${workerMode}.`,
  )
}

assert.throws(
  () => assertRuntimeCanStart(loadRuntimeEnv({ ...productionBase, STORAGE_MODE: 'local' })),
  /must not use local storage/i,
  'Production startup must reject local artifact storage.',
)

const productionEnv = loadRuntimeEnv(productionBase)
assert.doesNotThrow(() => assertRuntimeCanStart(productionEnv))

const publicClient = {
  auth: {
    async getUser(token: string) {
      return token === 'verified-user-token'
        ? {
            data: {
              user: {
                id: 'user-edit-execution-security',
                email: 'execution-security@example.test',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date(0).toISOString(),
              },
            },
            error: null,
          }
        : { data: { user: null }, error: new Error('invalid token') }
    },
  },
} as unknown as SupabaseClient

const adminClient = {} as SupabaseClient
const productionServer = await listen(createReeditProApiApp(productionEnv, {
  clients: { admin: adminClient, public: publicClient },
}))

try {
  const productionBaseUrl = baseUrl(productionServer)
  const dualAuthHeaders = {
    authorization: 'Bearer verified-user-token',
    [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
    'content-type': 'application/json',
    'idempotency-key': 'production-hidden-edit-execution-route',
  }

  const hiddenPackageRoute = await fetch(`${productionBaseUrl}/v1/edit-executions/packages`, {
    method: 'POST',
    headers: dualAuthHeaders,
    body: '{}',
  })
  assert.equal(hiddenPackageRoute.status, 404, 'Production must not mount the internal execution package route.')

  const hiddenBrowserPackageRequest = await fetch(
    `${productionBaseUrl}/v1/approved-snapshots/hidden-snapshot/canonical-execution-package`,
    {
      method: 'POST',
      headers: dualAuthHeaders,
      body: '{}',
    },
  )
  assert.equal(
    hiddenBrowserPackageRequest.status,
    404,
    'Production must not mount the local/private browser package-request route.',
  )

  const hiddenBrowserPrivatePreparation = await fetch(
    `${productionBaseUrl}/v1/edit-executions/packages/hidden-package/canonical-private-edit-preparation`,
    {
      method: 'POST',
      headers: dualAuthHeaders,
      body: '{}',
    },
  )
  assert.equal(
    hiddenBrowserPrivatePreparation.status,
    404,
    'Production must not mount the local/private browser edit-preparation route.',
  )

  const hiddenBrowserPrivateReviewMedia = await fetch(
    `${productionBaseUrl}/v1/edit-executions/private-review-assemblies/hidden-review/media`,
    { headers: dualAuthHeaders },
  )
  assert.equal(
    hiddenBrowserPrivateReviewMedia.status,
    404,
    'Production must not mount the local/private browser review-media route.',
  )

  const hiddenBrowserPrivateReviewDecision = await fetch(
    `${productionBaseUrl}/v1/edit-executions/private-review-assemblies/hidden-review/canonical-decision`,
    {
      method: 'POST',
      headers: dualAuthHeaders,
      body: '{}',
    },
  )
  assert.equal(
    hiddenBrowserPrivateReviewDecision.status,
    404,
    'Production must not mount the local/private browser review-decision route.',
  )
  const hiddenBrowserDeliveryWatchCheckpoint = await fetch(
    `${productionBaseUrl}/v1/edit-executions/professional-long-form/customer-delivery-packages/hidden-delivery/quality-review/watch-checkpoints`,
    {
      method: 'POST',
      headers: dualAuthHeaders,
      body: JSON.stringify(deliveryWatchCheckpointBody()),
    },
  )
  assert.equal(
    hiddenBrowserDeliveryWatchCheckpoint.status,
    503,
    'Production may mount the delivery-watch contract but must fail closed before private persistence access.',
  )
  const hiddenBrowserDeliveryWatchCheckpointError =
    await hiddenBrowserDeliveryWatchCheckpoint.json() as {
      error?: { code?: string }
    }
  assert.equal(
    hiddenBrowserDeliveryWatchCheckpointError.error?.code,
    'TOOL_NOT_READY',
  )

  const hiddenInternalRunRoute = await fetch(`${productionBaseUrl}/v1/edit-executions/private-internal-test-runs`, {
    method: 'POST',
    headers: dualAuthHeaders,
    body: '{}',
  })
  assert.equal(hiddenInternalRunRoute.status, 404, 'Production must not mount the private internal test-run route.')

  const userPreviewReview = await fetch(
    `${productionBaseUrl}/v1/edit-executions/render-preview-assemblies/missing-preview/user-preview-review`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        'content-type': 'application/json',
        'idempotency-key': 'owner-review-route-remains-mounted',
      },
      body: JSON.stringify(deliveryWatchCheckpointBody()),
    },
  )
  assert.notEqual(userPreviewReview.status, 404, 'The authenticated user preview-review route should remain mounted.')

  const privateDownload = await fetch(
    `${productionBaseUrl}/v1/edit-executions/private-internal-downloads/missing-delivery/file`,
    { headers: { authorization: 'Bearer verified-user-token' } },
  )
  assert.equal(privateDownload.status, 404, 'The owner-authorized download route should remain mounted and fail closed for unknown records.')

  const blockedProductionDeliveryDiscovery = await fetch(
    `${productionBaseUrl}/v1/projects/strict-project/edit-sessions/strict-edit/professional-long-form-customer-delivery?workspaceId=strict-workspace&approvedPlanSnapshotId=strict-snapshot`,
    { headers: { authorization: 'Bearer verified-user-token' } },
  )
  assert.equal(
    blockedProductionDeliveryDiscovery.status,
    503,
    'Production may mount the authenticated delivery-discovery contract but must fail closed before persistence access.',
  )
  const blockedProductionDeliveryDiscoveryError =
    await blockedProductionDeliveryDiscovery.json() as {
      error?: { code?: string }
    }
  assert.equal(
    blockedProductionDeliveryDiscoveryError.error?.code,
    'TOOL_NOT_READY',
  )
} finally {
  await close(productionServer)
}

const internalTestEnv = loadRuntimeEnv({
  ...productionBase,
  NODE_ENV: 'test',
})
const internalTestServer = await listen(createReeditProApiApp(internalTestEnv, {
  clients: { admin: adminClient, public: publicClient },
}))

try {
  const internalTestBaseUrl = baseUrl(internalTestServer)
  const packageUrl = `${internalTestBaseUrl}/v1/edit-executions/packages`
  const hiddenCloudTestRoute = await fetch(packageUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
      'content-type': 'application/json',
      'idempotency-key': 'cloud-test-hidden-edit-execution-route',
    },
    body: '{}',
  })
  assert.equal(hiddenCloudTestRoute.status, 404, 'A non-production cloud runtime must not mount legacy internal execution routes.')
  const hiddenCloudBrowserPackageRequest = await fetch(
    `${internalTestBaseUrl}/v1/approved-snapshots/hidden-snapshot/canonical-execution-package`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
        'content-type': 'application/json',
        'idempotency-key': 'cloud-test-hidden-browser-package-request',
      },
      body: '{}',
    },
  )
  assert.equal(
    hiddenCloudBrowserPackageRequest.status,
    404,
    'A non-production cloud runtime must not mount the browser package-request route.',
  )
  const hiddenCloudBrowserPrivatePreparation = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/packages/hidden-package/canonical-private-edit-preparation`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
        'content-type': 'application/json',
        'idempotency-key': 'cloud-test-hidden-browser-private-preparation',
      },
      body: '{}',
    },
  )
  assert.equal(
    hiddenCloudBrowserPrivatePreparation.status,
    404,
    'A non-production cloud runtime must not mount the browser edit-preparation route.',
  )
  const hiddenCloudBrowserPrivateReviewMedia = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/private-review-assemblies/hidden-review/media`,
    {
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
      },
    },
  )
  assert.equal(
    hiddenCloudBrowserPrivateReviewMedia.status,
    404,
    'A non-production cloud runtime must not mount the browser review-media route.',
  )
  const hiddenCloudBrowserPrivateReviewDecision = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/private-review-assemblies/hidden-review/canonical-decision`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
        'content-type': 'application/json',
        'idempotency-key': 'cloud-test-hidden-browser-private-review-decision',
      },
      body: '{}',
    },
  )
  assert.equal(
    hiddenCloudBrowserPrivateReviewDecision.status,
    404,
    'A non-production cloud runtime must not mount the browser review-decision route.',
  )
  const hiddenCloudBrowserDeliveryWatchCheckpoint = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/professional-long-form/customer-delivery-packages/hidden-delivery/quality-review/watch-checkpoints`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
        'content-type': 'application/json',
        'idempotency-key': 'cloud-test-hidden-delivery-watch',
      },
      body: JSON.stringify(deliveryWatchCheckpointBody()),
    },
  )
  assert.equal(
    hiddenCloudBrowserDeliveryWatchCheckpoint.status,
    503,
    'A cloud runtime must fail closed before delivery-watch persistence access.',
  )
  const hiddenCloudBrowserDeliveryWatchCheckpointError =
    await hiddenCloudBrowserDeliveryWatchCheckpoint.json() as {
      error?: { code?: string }
    }
  assert.equal(
    hiddenCloudBrowserDeliveryWatchCheckpointError.error?.code,
    'TOOL_NOT_READY',
  )
  const blockedCloudDeliveryDiscovery = await fetch(
    `${internalTestBaseUrl}/v1/projects/strict-project/edit-sessions/strict-edit/professional-long-form-customer-delivery?workspaceId=strict-workspace&approvedPlanSnapshotId=strict-snapshot`,
    { headers: { authorization: 'Bearer verified-user-token' } },
  )
  assert.equal(
    blockedCloudDeliveryDiscovery.status,
    503,
    'A cloud runtime must fail closed before delivery-discovery persistence access.',
  )
  const blockedCloudDeliveryDiscoveryError =
    await blockedCloudDeliveryDiscovery.json() as {
      error?: { code?: string }
    }
  assert.equal(blockedCloudDeliveryDiscoveryError.error?.code, 'TOOL_NOT_READY')
} finally {
  await close(internalTestServer)
}

const explicitLocalTestEnv = loadRuntimeEnv({
  ...productionBase,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
const explicitLocalTestServer = await listen(createReeditProApiApp(explicitLocalTestEnv, {
  clients: { admin: adminClient, public: publicClient },
}))

try {
  const internalTestBaseUrl = baseUrl(explicitLocalTestServer)
  const packageUrl = `${internalTestBaseUrl}/v1/edit-executions/packages`
  const userOnly = await fetch(packageUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      origin: 'https://app.reeditpro.test',
      'content-type': 'application/json',
      'idempotency-key': 'user-only-edit-execution-route',
    },
    body: '{}',
  })
  assert.equal(userOnly.status, 401, 'Verified user auth alone must not reach private edit-execution routes.')

  const internalOnly = await fetch(packageUrl, {
    method: 'POST',
    headers: {
      [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
      'content-type': 'application/json',
      'idempotency-key': 'internal-only-edit-execution-route',
    },
    body: '{}',
  })
  assert.equal(internalOnly.status, 401, 'Internal service auth alone must not replace verified user auth.')

  const dualAuth = await fetch(packageUrl, {
    method: 'POST',
    headers: {
      authorization: 'Bearer verified-user-token',
      [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
      'content-type': 'application/json',
      'idempotency-key': 'dual-auth-edit-execution-route',
    },
    body: '{}',
  })
  assert.equal(dualAuth.status, 400, 'Dual auth should reach the strict canonical identity-only package schema.')
  const dualAuthError = await dualAuth.json() as { error?: { code?: string } }
  assert.equal(dualAuthError.error?.code, 'VALIDATION_FAILED')

  const browserPackageRequest = await fetch(
    `${internalTestBaseUrl}/v1/approved-snapshots/strict-snapshot/canonical-execution-package`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
        'content-type': 'application/json',
        'idempotency-key': 'strict-browser-package-request',
      },
      body: '{}',
    },
  )
  assert.equal(
    browserPackageRequest.status,
    400,
    'The local/private browser package-request route should require user auth and reach its strict body schema without internal credentials.',
  )
  const browserPackageRequestError = await browserPackageRequest.json() as {
    error?: { code?: string }
  }
  assert.equal(browserPackageRequestError.error?.code, 'VALIDATION_FAILED')

  const browserPrivatePreparation = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/packages/strict-package/canonical-private-edit-preparation`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
        'content-type': 'application/json',
        'idempotency-key': 'strict-browser-private-preparation',
      },
      body: '{}',
    },
  )
  assert.equal(
    browserPrivatePreparation.status,
    400,
    'The local/private browser edit-preparation route should require user auth and strict identity without an internal credential.',
  )
  const browserPrivatePreparationError = await browserPrivatePreparation.json() as {
    error?: { code?: string }
  }
  assert.equal(browserPrivatePreparationError.error?.code, 'VALIDATION_FAILED')

  const browserPrivateReviewMedia = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/private-review-assemblies/strict-review/media`,
    {
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
      },
    },
  )
  assert.equal(
    browserPrivateReviewMedia.status,
    400,
    'The local/private review-media route should require user auth and strict exact-review query identity without an internal credential.',
  )
  const browserPrivateReviewMediaError = await browserPrivateReviewMedia.json() as {
    error?: { code?: string }
  }
  assert.equal(browserPrivateReviewMediaError.error?.code, 'VALIDATION_FAILED')

  const browserPrivateReviewDecision = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/private-review-assemblies/strict-review/canonical-decision`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
        'content-type': 'application/json',
        'idempotency-key': 'strict-browser-private-review-decision',
      },
      body: '{}',
    },
  )
  assert.equal(
    browserPrivateReviewDecision.status,
    400,
    'The local/private review-decision route should require user auth and strict exact-review authority without an internal credential.',
  )
  const browserPrivateReviewDecisionError = await browserPrivateReviewDecision.json() as {
    error?: { code?: string }
  }
  assert.equal(browserPrivateReviewDecisionError.error?.code, 'VALIDATION_FAILED')

  const browserDeliveryDiscovery = await fetch(
    `${internalTestBaseUrl}/v1/projects/strict-project/edit-sessions/strict-edit/professional-long-form-customer-delivery`,
    {
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
      },
    },
  )
  assert.equal(
    browserDeliveryDiscovery.status,
    400,
    'The local/private delivery-discovery route should require exact workspace and approved-snapshot query identity.',
  )
  const browserDeliveryDiscoveryError = await browserDeliveryDiscovery.json() as {
    error?: { code?: string }
  }
  assert.equal(browserDeliveryDiscoveryError.error?.code, 'VALIDATION_FAILED')

  const browserDeliveryWatchCheckpoint = await fetch(
    `${internalTestBaseUrl}/v1/edit-executions/professional-long-form/customer-delivery-packages/strict-delivery/quality-review/watch-checkpoints`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        origin: 'https://app.reeditpro.test',
        'content-type': 'application/json',
        'idempotency-key': 'strict-browser-delivery-watch',
      },
      body: '{}',
    },
  )
  assert.equal(
    browserDeliveryWatchCheckpoint.status,
    400,
    'The local/private delivery-watch route should require user auth, idempotency, and strict exact-review authority.',
  )
  const browserDeliveryWatchCheckpointError =
    await browserDeliveryWatchCheckpoint.json() as {
      error?: { code?: string }
    }
  assert.equal(
    browserDeliveryWatchCheckpointError.error?.code,
    'VALIDATION_FAILED',
  )

  for (const [path, body] of [
    ['/v1/jobs/caller-job/claim', {
      workspaceId: 'caller-workspace',
      workerType: 'caller-worker',
      workerInstanceId: 'caller-instance',
      leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    }],
    ['/v1/workers/jobs/caller-job/run', {
      workspaceId: 'caller-workspace',
      workerType: 'caller-worker',
      idempotencyKey: 'caller-worker-run',
      approvedPlanSnapshotId: 'caller-snapshot',
      creditReservationId: 'caller-reservation',
      mediaAssetId: 'caller-media',
      storageObjectRecordId: 'caller-storage',
      payloadJson: { callerAuthored: true },
    }],
    ['/v1/tool-runtime-checks', {
      workspaceId: 'caller-workspace',
      workerType: 'caller-worker',
      toolName: 'ffmpeg',
      checkStatus: 'passed',
      checkSummary: 'caller says ready',
    }],
    ['/v1/render-jobs', {
      workspaceId: 'caller-workspace',
      projectId: 'caller-project',
      approvedPlanSnapshotId: 'caller-snapshot',
      creditEstimateId: 'caller-estimate',
      creditReservationId: 'caller-reservation',
      renderType: 'export',
    }],
  ] as const) {
    const blockedWorkerMutation = await fetch(`${internalTestBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer verified-user-token',
        [INTERNAL_SERVICE_TOKEN_HEADER]: internalToken,
        'content-type': 'application/json',
        'idempotency-key': `blocked-worker-${path.replace(/[^a-z0-9]/gi, '-')}`,
      },
      body: JSON.stringify(body),
    })
    assert.equal(blockedWorkerMutation.status, 503)
    const blockedWorkerBody = await blockedWorkerMutation.json() as { error?: { code?: string } }
    assert.equal(blockedWorkerBody.error?.code, 'TOOL_NOT_READY')
  }
} finally {
  await close(explicitLocalTestServer)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'production_internal_test_flag_rejected',
    'unknown_runtime_environment_rejected',
    'production_local_and_mock_execution_rejected',
    'production_local_and_mock_worker_rejected',
    'production_local_storage_rejected',
    'production_internal_execution_routes_unmounted',
    'production_and_cloud_browser_package_preparation_review_media_and_decision_routes_unmounted',
    'production_user_review_and_download_routes_preserved',
    'production_and_cloud_delivery_discovery_fail_closed_before_persistence',
    'production_and_cloud_delivery_watch_fail_closed_before_persistence',
    'private_execution_routes_require_dual_auth',
    'local_private_browser_package_request_requires_user_auth_and_strict_identity_body',
    'local_private_browser_edit_preparation_requires_user_auth_and_strict_identity_body',
    'local_private_browser_review_media_requires_user_auth_and_strict_exact_review_query',
    'local_private_browser_review_decision_requires_user_auth_and_strict_exact_review_body',
    'local_private_browser_delivery_watch_requires_user_auth_idempotency_and_strict_exact_review_body',
    'local_private_delivery_discovery_requires_exact_query_identity',
    'canonical_identity_only_execution_package_schema',
    'caller_authored_worker_claim_and_run_routes_disabled',
    'caller_authored_tool_runtime_evidence_write_disabled',
    'caller_authored_render_job_creation_disabled',
  ],
}))

async function listen(app: ReturnType<typeof createReeditProApiApp>) {
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return server
}

function baseUrl(server: ReturnType<typeof createServer>): string {
  const address = server.address() as AddressInfo
  return `http://127.0.0.1:${address.port}`
}

async function close(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

function deliveryWatchCheckpointBody() {
  return {
    workspaceId: 'strict-workspace',
    approvedPlanSnapshotId: 'strict-snapshot',
    expectedReviewPacketHash: 'a'.repeat(64),
    expectedMasterSha256: 'b'.repeat(64),
    expectedPreviousWatchEvidenceHash: null,
    sequence: 1,
    coveredIntervals: [{ startFrame: 0, endFrameExclusive: 1 }],
  }
}
