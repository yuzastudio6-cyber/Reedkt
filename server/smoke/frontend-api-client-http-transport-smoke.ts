import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'

type SeenRequest = {
  method: string
  url: string
  idempotencyKey?: string
  body?: unknown
}

type PackageSmokeResponseData = {
  canonicalExecutionPackageRequest?: {
    packageRecordId?: string
  }
}

type CreditGateSmokeResponseData = {
  creditApproval?: {
    id?: string
  }
  creditReservation?: {
    id?: string
  }
}

const seenRequests: SeenRequest[] = []

const executionApprovedSnapshotForHttpSmoke = {
  id: 'approved_snapshot_before_backend_rebind',
  projectId: 'project-http-smoke',
  editSessionId: 'edit-session-http-smoke',
  editPlanVersionId: 'mock-plan-version-1',
  creditEstimateId: 'credit-estimate-http-smoke',
  approvedAt: '2026-06-26T00:00:00.000Z',
  approvedBy: 'user-http-smoke',
  settingsSnapshot: {},
  sourceSequence: [],
  segments: [],
  operations: [],
  rendererLayers: [],
  sourcePlan: { goalSummary: 'HTTP transport smoke.' },
  creditEstimate: { total_credits: 1 },
  creditEstimateDomain: { total: 1 },
  tierConstraints: [],
  modelRoutingConstraints: [],
  frameBackgroundPolicy: [],
  mustFollowRules: [],
  avoidRules: [],
  fallbackPolicy: [],
  snapshotVersion: 'mock-v1',
}

const server = createServer(async (request, response) => {
  const bodyText = await readRequestBody(request)
  const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : undefined

  seenRequests.push({
    method: request.method ?? 'GET',
    url: request.url ?? '/',
    idempotencyKey: request.headers['idempotency-key']?.toString(),
    body,
  })

  if (
    request.method === 'POST' &&
    request.url === '/v1/approved-snapshots/snapshot-http-smoke/canonical-execution-package'
  ) {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalExecutionPackageRequest: {
          packageRecordId: 'http-package-smoke',
          approvedPlanSnapshotId: body?.approvedPlanSnapshotId,
          status: 'ready_for_mock_preview_review',
          agentCallReady: true,
          liveExecutionReady: false,
          resolvedAdapterToolCount: 0,
          privateArtifactRefCount: 0,
          userFacingSummary: 'HTTP transport smoke package created.',
          noRuntimeSideEffects: ['No worker dispatch, provider call, render, billing, Supabase, or GCS side effect ran.'],
        },
      },
      warnings: ['HTTP transport smoke response.'],
    }))
    return
  }

  if (request.method === 'POST' && request.url === '/v1/edit-plans/mock-plan-version-1/approved-snapshots') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        approvedPlanSnapshot: {
          id: 'approved_snapshot_http_smoke',
          snapshotStatus: 'approved',
          projectId: body?.projectId,
          creditEstimateId: body?.creditEstimateId,
        },
      },
      warnings: ['HTTP transport approved snapshot smoke response.'],
    }))
    return
  }

  if (request.method === 'GET' && request.url === '/v1/approved-snapshots/approved_snapshot_http_smoke') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        approvedPlanSnapshot: {
          id: 'approved_snapshot_http_smoke',
          snapshotStatus: 'approved',
          snapshotJson: {
            executionApprovedSnapshot: executionApprovedSnapshotForHttpSmoke,
          },
        },
      },
      warnings: ['HTTP transport approved snapshot read smoke response.'],
    }))
    return
  }

  if (request.method === 'POST' && request.url === '/v1/credit-estimates/credit-estimate-http-smoke/approve') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        creditApproval: {
          id: 'credit_approval_http_smoke',
          creditEstimateId: 'credit-estimate-http-smoke',
          status: 'approved',
        },
      },
      warnings: ['HTTP transport credit approval smoke response.'],
    }))
    return
  }

  if (request.method === 'POST' && request.url === '/v1/credit-estimates/credit-estimate-http-smoke/reserve') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        creditReservation: {
          id: 'credit_reservation_http_smoke',
          creditEstimateId: 'credit-estimate-http-smoke',
          status: 'reserved',
        },
      },
      warnings: ['HTTP transport credit reservation smoke response.'],
    }))
    return
  }

  if (
    request.method === 'GET'
    && request.url ===
      '/v1/edit-executions/private-internal-tool-runtime-readiness'
  ) {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        privateInternalToolRuntimeReadiness: {
          schemaVersion:
            'private-internal-tool-runtime-readiness-browser-v1',
          evidenceRevision: 'frontend-http-smoke',
          observedAt: '2026-07-30T00:00:00.000Z',
          status: 'ready_for_private_internal_execution',
          canonicalToolCount: 1,
          readyToolCount: 1,
          runnerClassCount: 1,
          runtimeAuthorityCount: 1,
          allCanonicalToolsReady: true,
          privateInternalExecutionReady: true,
          productReady: false,
          externalBetaReady: false,
          productionReady: false,
          tools: [{
            toolId: 'ffmpeg',
            displayName: 'FFmpeg',
            operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
            runtimeFamily: 'media_binary',
            status: 'ready_for_private_internal_execution',
          }],
          releaseBlockers: [
            'product_external_beta_and_production_promotion_not_verified',
          ],
        },
      },
      warnings: ['HTTP transport tool readiness smoke response.'],
    }))
    return
  }

  response.statusCode = 404
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({
    ok: false,
    error: { code: 'not_found', message: 'Unexpected smoke route.' },
    warnings: [],
  }))
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Smoke server should expose a TCP address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_SUPABASE_URL = ''
process.env.VITE_SUPABASE_ANON_KEY = ''
process.env.NODE_ENV = 'test'

try {
  const { callReeditProApi } = await import('../../src/backend/api/frontend-api-client')
  const {
    fetchApprovedPlanSnapshotFromBackend,
    persistApprovedPlanSnapshotToBackend,
  } = await import('../../src/lib/approved-snapshot-backend-sync')
  const {
    readPrivateInternalToolRuntimeReadiness,
  } = await import(
    '../../src/lib/private-internal-tool-runtime-readiness-client'
  )
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')

  for (const routeId of [
    'editExecution.canonicalPackageRequest.create',
    'editExecution.privateInternalToolRuntimeReadiness.read',
    'editExecution.canonicalPrivateEditPreparation.create',
    'editExecution.canonicalPrivateReviewMedia.read',
    'editExecution.canonicalPrivateReviewDecision.create',
    'planning.approvedSnapshot.create',
    'planning.approvedSnapshot.get',
    'credits.estimate.approve',
    'credits.reserve',
  ]) {
    const route = getApiRouteById(routeId)
    assert.equal(route?.runtimeMode, 'frontend_safe', `${routeId} should be registered as a reviewed backend HTTP route.`)
    assert.equal(route?.status, 'frontend_safe_ready', `${routeId} should be ready for signed-in internal testing.`)
    assert.equal(route?.requiresServiceRole, false, `${routeId} must not expose service-role access to the frontend.`)
    assert.equal(route?.requiresProviderSecret, false, `${routeId} must not expose provider secrets to the frontend.`)
    assert.equal(route?.requiresStripeSecret, false, `${routeId} must not expose Stripe secrets to the frontend.`)
  }

  const packageResponse = await callReeditProApi<unknown, PackageSmokeResponseData>(
    'editExecution.canonicalPackageRequest.create',
    {
      workspaceId: 'workspace-http-smoke',
      projectId: 'project-http-smoke',
      editSessionId: 'edit-session-http-smoke',
      approvedSnapshotHash: 'a'.repeat(64),
    },
    {
      params: { snapshotId: 'snapshot-http-smoke' },
      context: {
        workspaceId: 'workspace-http-smoke',
        projectId: 'project-http-smoke',
        userId: 'user-http-smoke',
      },
      idempotencyKey: 'frontend-api-http-transport-smoke',
    },
  )

  assert.equal(packageResponse.ok, true, 'Configured /v1 route should call backend HTTP transport.')
  assert.equal(packageResponse.mockOnly, false, 'HTTP transport response should not be marked mock-only.')
  assert.equal(
    packageResponse.data?.canonicalExecutionPackageRequest?.packageRecordId,
    'http-package-smoke',
    'HTTP transport should return backend response data.',
  )
  assert.equal(seenRequests.length, 1, 'Only the /v1 package route should have hit the smoke server so far.')
  assert.equal(seenRequests[0]?.idempotencyKey, 'frontend-api-http-transport-smoke', 'HTTP writes should send idempotency evidence.')

  const retiredExecutionResponse = await callReeditProApi(
    'editExecution.privateInternalTestRun.create',
    {},
  )
  assert.equal(retiredExecutionResponse.ok, false)
  assert.equal(retiredExecutionResponse.error?.code, 'backend_runtime_required')
  assert.equal(seenRequests.length, 1, 'Retired execution stages must fail before HTTP transport.')

  const approvedSnapshotResponse = await persistApprovedPlanSnapshotToBackend({
    snapshot: executionApprovedSnapshotForHttpSmoke as unknown as ApprovedPlanSnapshot,
    workspaceId: 'workspace-http-smoke',
    approvedByUserId: 'user-http-smoke',
    creditApprovalId: 'credit-approval-http-smoke',
    creditReservationId: 'credit-reservation-http-smoke',
  })

  assert.equal(approvedSnapshotResponse.ok, true, 'Configured approved-snapshot /v1 route should call backend HTTP transport.')
  assert.equal(
    approvedSnapshotResponse.approvedSnapshot.id,
    'approved_snapshot_http_smoke',
    'Approved-snapshot HTTP transport should return and rebind backend snapshot data.',
  )
  assert.equal(seenRequests.length, 2, 'Approved snapshot creation should add one backend HTTP request.')
  assert.equal(
    seenRequests[1]?.idempotencyKey,
    'approved-snapshot:project-http-smoke:edit-session-http-smoke:mock-plan-version-1:mock-v1',
    'Approved snapshot writes should send deterministic idempotency evidence.',
  )
  const approvedSnapshotBody = seenRequests[1]?.body as {
    snapshotJson?: {
      executionApprovedSnapshot?: {
        id?: string
      }
    }
  } | undefined
  assert.equal(
    approvedSnapshotBody?.snapshotJson?.executionApprovedSnapshot?.id,
    'approved_snapshot_before_backend_rebind',
    'Approved snapshot create payload should include executable snapshot JSON for backend recovery.',
  )

  const approvedSnapshotReadResponse = await fetchApprovedPlanSnapshotFromBackend(
    'approved_snapshot_http_smoke',
    {
      workspaceId: 'workspace-http-smoke',
      projectId: 'project-http-smoke',
      userId: 'user-http-smoke',
    },
  )
  assert.equal(approvedSnapshotReadResponse.ok, true, 'Configured approved-snapshot GET /v1 route should recover executable snapshot JSON.')
  assert.equal(
    approvedSnapshotReadResponse.approvedSnapshot?.id,
    'approved_snapshot_http_smoke',
    'Approved snapshot readback should rebind recovered executable snapshot to the backend snapshot id.',
  )
  assert.equal(seenRequests.length, 3, 'Approved snapshot read should add one backend HTTP request.')
  assert.equal(seenRequests[2]?.idempotencyKey, undefined, 'Approved snapshot reads should not send idempotency keys.')

  const creditApprovalResponse = await callReeditProApi<unknown, CreditGateSmokeResponseData>(
    'credits.estimate.approve',
    { workspaceId: 'workspace-http-smoke' },
    {
      params: { creditEstimateId: 'credit-estimate-http-smoke' },
      context: {
        workspaceId: 'workspace-http-smoke',
        projectId: 'project-http-smoke',
        userId: 'user-http-smoke',
      },
      idempotencyKey: 'frontend-api-credit-approval-http-smoke',
    },
  )
  assert.equal(creditApprovalResponse.ok, true, 'Configured credit approval /v1 route should call backend HTTP transport.')
  assert.equal(creditApprovalResponse.data?.creditApproval?.id, 'credit_approval_http_smoke')

  const creditReservationResponse = await callReeditProApi<unknown, CreditGateSmokeResponseData>(
    'credits.reserve',
    {
      workspaceId: 'workspace-http-smoke',
      projectId: 'project-http-smoke',
      editPlanId: 'mock-plan-version-1',
    },
    {
      params: { creditEstimateId: 'credit-estimate-http-smoke' },
      context: {
        workspaceId: 'workspace-http-smoke',
        projectId: 'project-http-smoke',
        userId: 'user-http-smoke',
      },
      idempotencyKey: 'frontend-api-credit-reservation-http-smoke',
    },
  )
  assert.equal(creditReservationResponse.ok, true, 'Configured credit reservation /v1 route should call backend HTTP transport.')
  assert.equal(creditReservationResponse.data?.creditReservation?.id, 'credit_reservation_http_smoke')
  assert.equal(seenRequests.length, 5, 'Credit approval and reservation should add two backend HTTP requests.')
  assert.equal(seenRequests[3]?.idempotencyKey, 'frontend-api-credit-approval-http-smoke', 'Credit approval writes should send idempotency evidence.')
  assert.equal(seenRequests[4]?.idempotencyKey, 'frontend-api-credit-reservation-http-smoke', 'Credit reservation writes should send idempotency evidence.')

  const sourceSequenceResponse = await callReeditProApi(
    'media.sourceSequence.create',
    {
      workspaceId: 'workspace-http-smoke',
      projectId: 'project-http-smoke',
      uploads: [],
    },
    {
      context: {
        workspaceId: 'workspace-http-smoke',
        projectId: 'project-http-smoke',
        userId: 'user-http-smoke',
      },
    },
  )

  assert.equal(sourceSequenceResponse.ok, true, 'Deterministic non-/v1 source metadata should retain its explicit mock fallback.')
  assert.equal(sourceSequenceResponse.mockOnly, true, 'Non-/v1 metadata routes should remain on the mock router.')
  assert.equal(seenRequests.length, 5, 'Mock-only metadata route should not call backend HTTP transport.')

  const backendRequiredResponse = await callReeditProApi(
    'jobs.batch.create',
    {
      workspaceId: 'workspace-http-smoke',
      projectId: 'project-http-smoke',
    },
    {
      context: {
        workspaceId: 'workspace-http-smoke',
        projectId: 'project-http-smoke',
        userId: 'user-http-smoke',
      },
    },
  )

  assert.equal(backendRequiredResponse.ok, false, 'Backend-required route should fail closed from frontend client.')
  assert.equal(backendRequiredResponse.error?.code, 'backend_runtime_required')
  assert.equal(seenRequests.length, 5, 'Backend-required route should not call backend HTTP transport.')

  const runtimeReadiness =
    await readPrivateInternalToolRuntimeReadiness()
  assert.equal(runtimeReadiness.readyToolCount, 1)
  assert.equal(runtimeReadiness.tools[0]?.toolId, 'ffmpeg')
  assert.equal(
    runtimeReadiness.tools[0]?.status,
    'ready_for_private_internal_execution',
  )
  assert.equal(seenRequests.length, 6)
  assert.equal(
    seenRequests[5]?.url,
    '/v1/edit-executions/private-internal-tool-runtime-readiness',
  )
  assert.equal(
    seenRequests[5]?.idempotencyKey,
    undefined,
    'Read-only runtime inspection must not send an idempotency key.',
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'configured_v1_route_uses_http_transport',
      'http_transport_sends_idempotency_key',
      'approved_snapshot_route_registered_frontend_safe_without_secrets',
      'approved_snapshot_http_transport_sends_idempotency_key',
      'approved_snapshot_get_recovers_executable_snapshot_without_idempotency_key',
      'credit_gate_routes_registered_frontend_safe_without_secrets',
      'credit_gate_http_transport_sends_idempotency_keys',
      'metadata_api_routes_stay_mock_only',
      'backend_required_routes_fail_closed_without_network',
      'canonical_edit_execution_routes_registered_frontend_safe_without_secrets',
      'private_internal_tool_runtime_readiness_uses_authenticated_get_transport',
      'retired_edit_execution_routes_fail_before_http_transport',
    ],
    requestCount: seenRequests.length,
  }))
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}
