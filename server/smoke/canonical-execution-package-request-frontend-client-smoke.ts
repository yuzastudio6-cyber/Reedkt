import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import type { CanonicalEditJourney } from '../../src/lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const identity = {
  workspaceId: 'workspace-canonical-package-client',
  projectId: 'project-canonical-package-client',
  editSessionId: 'edit-canonical-package-client',
}
const snapshotId = 'snapshot-canonical-package-client'
const snapshotHash = '3'.repeat(64)
const journey: CanonicalEditJourney = {
  identity,
  stage: 'approved_snapshot_available',
  executionPackageAuthority: {
    snapshotId,
    expectedSnapshotHash: snapshotHash,
  },
  plan: {
    version: 2,
    status: 'approved',
    estimateStatus: 'approved',
    maximumCredits: 52,
    workItemCount: 6,
  },
  approval: {
    reservedCredits: 52,
    reservationStatus: 'reserved',
    jobCount: 6,
  },
  inspectionOnly: true,
  testOnly: true,
}
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-canonical-package-client',
  workspaceId: identity.workspaceId,
}

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let mode: 'valid' | 'foreign' | 'stale' | 'unavailable' | 'access_denied' = 'valid'
const requests: Array<{
  authorization?: string
  internalToken?: string
  idempotencyKey?: string
  body: Record<string, unknown>
  method?: string
  url?: string
}> = []

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
    requests.push({
      authorization: request.headers.authorization,
      internalToken: request.headers['x-reeditpro-internal-token'] as string | undefined,
      idempotencyKey: request.headers['idempotency-key'] as string | undefined,
      body,
      method: request.method,
      url: request.url,
    })
    response.setHeader('content-type', 'application/json')
    if (mode !== 'valid' && mode !== 'foreign') {
      const failure = {
        stale: { status: 409, code: 'IDEMPOTENCY_CONFLICT' },
        unavailable: { status: 503, code: 'BACKEND_UNAVAILABLE' },
        access_denied: { status: 403, code: 'WORKSPACE_ACCESS_DENIED' },
      }[mode]
      response.statusCode = failure.status
      response.end(JSON.stringify({
        ok: false,
        error: { code: failure.code, message: 'Canonical package request client smoke failure.' },
        warnings: [],
      }))
      return
    }
    response.statusCode = 201
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalExecutionPackageRequest: receiptFixture(
          mode === 'foreign' ? { ...identity, workspaceId: 'workspace-foreign' } : identity,
        ),
      },
      warnings: [],
    }))
  })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'canonical-package-client-token'

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { requestCanonicalExecutionPackageForNamedEdit } = await import(
    '../../src/lib/canonical-execution-package-request-client'
  )
  const route = getApiRouteById('editExecution.canonicalPackageRequest.create')
  assert.equal(
    route?.path,
    '/v1/approved-snapshots/:snapshotId/canonical-execution-package',
  )
  assert.equal(route?.runtimeMode, 'frontend_safe')
  assert.equal(route?.status, 'frontend_safe_ready')
  assert.equal(route?.requiresServiceRole, false)
  assert.equal(route?.requiresProviderSecret, false)
  assert.equal(route?.requiresStripeSecret, false)

  const input = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    journey,
  }
  const first = requestCanonicalExecutionPackageForNamedEdit(input)
  const duplicate = requestCanonicalExecutionPackageForNamedEdit(input)
  assert.equal(duplicate, first, 'Exact concurrent browser handoff requests must share one request.')
  const ready = await first
  assert.equal(ready.status, 'ready')
  assert.equal(ready.packageState, 'confirmed')
  if (ready.status === 'ready') {
    assert.equal(ready.receipt.executionPackage.approvedPlanSnapshotId, snapshotId)
    assert.equal(ready.receipt.executionPackage.snapshotHash, snapshotHash)
  }
  assert.equal(requests.length, 1)
  assert.equal(requests[0]?.method, 'POST')
  assert.equal(
    requests[0]?.url,
    `/v1/approved-snapshots/${snapshotId}/canonical-execution-package`,
  )
  assert.equal(requests[0]?.authorization, 'Bearer canonical-package-client-token')
  assert.equal(requests[0]?.internalToken, undefined)
  assert.match(requests[0]?.idempotencyKey ?? '', /^canonical-execution-package:/)
  assert.deepEqual(requests[0]?.body, {
    workspaceId: identity.workspaceId,
    expectedProjectId: identity.projectId,
    expectedEditSessionId: identity.editSessionId,
    expectedSnapshotHash: snapshotHash,
    purpose: 'request_canonical_execution_package',
  })
  assert.doesNotMatch(
    JSON.stringify(requests[0]?.body),
    /path|credential|token|job|tool|componentRefs|authorityRevision/i,
  )

  mode = 'foreign'
  const foreign = await requestCanonicalExecutionPackageForNamedEdit(input)
  assert.equal(foreign.status, 'invalid_response')
  assert.equal(foreign.packageState, 'unknown')

  mode = 'stale'
  const stale = await requestCanonicalExecutionPackageForNamedEdit(input)
  assert.equal(stale.status, 'blocked')
  assert.equal(stale.packageState, 'unchanged')

  mode = 'access_denied'
  const accessDenied = await requestCanonicalExecutionPackageForNamedEdit(input)
  assert.equal(accessDenied.status, 'access_denied')
  assert.equal(accessDenied.packageState, 'unchanged')

  mode = 'unavailable'
  const unavailable = await requestCanonicalExecutionPackageForNamedEdit(input)
  assert.equal(unavailable.status, 'unavailable')
  assert.equal(unavailable.packageState, 'unknown')
  assert.equal(unavailable.retryable, true)

  const substitutedJourney: CanonicalEditJourney = {
    ...journey,
    identity: { ...journey.identity, editSessionId: 'foreign-edit' },
  }
  const beforeSubstitution = requests.length
  const substituted = await requestCanonicalExecutionPackageForNamedEdit({
    ...input,
    journey: substitutedJourney,
  })
  assert.equal(substituted.status, 'blocked')
  assert.equal(requests.length, beforeSubstitution)
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log('Canonical execution package request frontend client smoke passed.')

function receiptFixture(receiptIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-execution-package-request-receipt-v1',
    source: 'canonical_execution_package_request_coordinator_service',
    purpose: 'request_canonical_execution_package',
    disposition: 'package_available',
    identity: receiptIdentity,
    executionPackage: {
      packageRecordId: 'package-canonical-package-client',
      packageHash: '4'.repeat(64),
      approvedPlanSnapshotId: snapshotId,
      snapshotHash,
      status: 'canonical_authority_packaged_runtime_blocked',
      createdAt: '2026-07-13T16:00:00.000Z',
    },
    boundaries: {
      executionPackageAvailable: true,
      approvedSnapshotMutated: false,
      creditReservationMutated: false,
      workGraphStarted: false,
      workerDispatchStarted: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    jobOrToolDetailsReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
