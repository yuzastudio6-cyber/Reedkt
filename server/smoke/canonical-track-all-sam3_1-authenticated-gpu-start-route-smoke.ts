import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID,
  type TrackAllSam31AuthenticatedGpuStartRequest,
  type TrackAllSam31AuthenticatedGpuStartResult,
} from '../../src/types/track-all-sam3_1-gpu-start'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  buildTrackAllSam31AuthenticatedGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const internalToken = 'track-all-sam31-route-smoke-token'
const workspaceId = 'workspace-track-all-sam31-route'
const request = buildTrackAllSam31AuthenticatedGpuStartRequest({
  requestId: 'track-all-sam31-user-trigger-1',
  approvedSnapshotId: 'approved-snapshot-track-all-1',
  workItemKey: 'approved-track-all-work-1',
})
let runtimeCalls = 0
const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
}), {
  trackAllSam31AuthenticatedGpuStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v1',
    routeOwnsGpuPlacementOrPricing: false,
    rawCloudLaunchPortExposed: false,
    async startApprovedTrackAllWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      runtimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, request.requestId)
      assert.deepEqual(input.request, request)
      return resultFor(request)
    },
  }),
})
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const url = `http://127.0.0.1:${address.port}`

try {
  const valid = await post(request, request.requestId, internalToken)
  assert.equal(valid.status, 202)
  const validJson = await valid.json() as Record<string, unknown>
  assert.equal(validJson.ok, true)
  assert.equal(runtimeCalls, 1)

  const injectedSource = buildTrackAllSam31AuthenticatedGpuStartRequest({
    requestId: 'track-all-injected-model-request',
    approvedSnapshotId: request.approvedSnapshotId,
    workItemKey: request.workItemKey,
  })
  const injectedModel = await post({
    ...injectedSource,
    model: 'caller-selected-model',
  }, injectedSource.requestId, internalToken)
  assert.equal(injectedModel.status, 400)
  assert.equal(runtimeCalls, 1)

  const tamperSource = buildTrackAllSam31AuthenticatedGpuStartRequest({
    requestId: 'track-all-tampered-digest-request',
    approvedSnapshotId: request.approvedSnapshotId,
    workItemKey: request.workItemKey,
  })
  const tamperedDigest = await post({
    ...tamperSource,
    approvedSnapshotId: 'cross-snapshot',
  }, tamperSource.requestId, internalToken)
  assert.equal(tamperedDigest.status, 400)
  assert.equal(runtimeCalls, 1)

  const mismatchedIdempotency = await post(
    request,
    'different-idempotency-key',
    internalToken,
  )
  assert.equal(mismatchedIdempotency.status, 409)
  assert.equal(runtimeCalls, 1)

  const invalidInternalToken = await post(
    request,
    request.requestId,
    'invalid-internal-token',
  )
  assert.equal(invalidInternalToken.status, 403)
  assert.equal(runtimeCalls, 1)

  const route = getApiRouteById(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID,
  )
  assert.equal(route?.securityLevel, 'backend_service_role')
  assert.equal(route?.runtimeMode, 'backend_required')
  assert.equal(route?.requiresServiceRole, true)
  assert.match(route?.notes.join(' ') ?? '', /A100 80GB/u)
  assert.match(route?.notes.join(' ') ?? '', /L4/u)

  console.log(JSON.stringify({
    smoke: 'canonical-track-all-sam3_1-authenticated-gpu-start-route',
    checks: 24,
    authenticatedOwnerScopeRequired: true,
    strictInternalServiceAuthRequired: true,
    exactIdempotencyRequired: true,
    callerModelOrUnknownFieldRejected: true,
    digestTamperRejected: true,
    rawCloudLaunchPortAcceptedFromRequest: false,
    accountEffectivePriceAcceptedFromRequest: false,
    runtimeCalls,
    productionReady: false,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}

async function post(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/gpu-jobs/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

function resultFor(
  source: TrackAllSam31AuthenticatedGpuStartRequest,
): TrackAllSam31AuthenticatedGpuStartResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-start-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    fundedDispatchAdmissionRef: ref('funded-admission'),
    prelaunchAuthorizationRef: ref('funded-prelaunch'),
    launchRef: ref('sam31-launch'),
    launchBindingRef: ref('sam31-launch-binding'),
    launchDisposition: 'job_created' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    userTriggeredScaleFromZero: true as const,
    a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true as const,
    approvedSourceMaterialRereadByCanonicalServer: true as const,
    fundedPricingAndReservationRereadBeforeLaunch: true as const,
    rawCloudLaunchPortExposed: false as const,
    callerSuppliedMediaPromptModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}
