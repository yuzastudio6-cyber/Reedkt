import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import type { CanonicalEditJourney } from '../../src/lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'

const identity = {
  workspaceId: 'workspace-canonical-approval-client',
  projectId: 'project-canonical-approval-client',
  editSessionId: 'edit-canonical-approval-client',
}
const planId = 'plan-canonical-approval-client'
const estimateId = 'estimate-canonical-approval-client'
const planHash = '1'.repeat(64)
const estimateHash = '2'.repeat(64)
const maximumCredits = 48

const journey: CanonicalEditJourney = {
  identity,
  stage: 'plan_approval_required',
  approvalAuthority: {
    planId,
    estimateId,
    expectedPlanHash: planHash,
    expectedEstimateHash: estimateHash,
  },
  plan: {
    version: 3,
    status: 'presented',
    estimateStatus: 'presented',
    maximumCredits,
    workItemCount: 5,
  },
  inspectionOnly: true,
  testOnly: true,
}
const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-canonical-approval-client',
  workspaceId: identity.workspaceId,
}

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let mode: 'valid' | 'foreign' | 'insufficient' | 'stale' | 'unavailable' | 'access_denied' = 'valid'
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
        insufficient: { status: 409, code: 'INSUFFICIENT_CREDITS' },
        stale: { status: 409, code: 'IDEMPOTENCY_CONFLICT' },
        unavailable: { status: 503, code: 'BACKEND_UNAVAILABLE' },
        access_denied: { status: 403, code: 'WORKSPACE_ACCESS_DENIED' },
      }[mode]
      response.statusCode = failure.status
      response.end(JSON.stringify({
        ok: false,
        error: { code: failure.code, message: 'Canonical approval client smoke failure.' },
        warnings: [],
      }))
      return
    }
    response.statusCode = 201
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalPlanApproval: receiptFixture(
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
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'canonical-approval-client-token'

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { approveCanonicalPlanForNamedEdit } = await import(
    '../../src/lib/canonical-plan-approval-client'
  )
  const route = getApiRouteById('planning.canonicalPlanApproval.create')
  assert.equal(route?.path, '/v1/edit-plans/:editPlanId/canonical-approval')
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
  const first = approveCanonicalPlanForNamedEdit(input)
  const duplicate = approveCanonicalPlanForNamedEdit(input)
  assert.equal(duplicate, first, 'Exact concurrent browser approvals must share one request.')
  const approved = await first
  assert.equal(approved.status, 'approved')
  assert.equal(approved.reservationState, 'confirmed')
  if (approved.status === 'approved') {
    assert.equal(approved.receipt.plan.planHash, planHash)
    assert.equal(approved.receipt.plan.estimateHash, estimateHash)
    assert.equal(approved.receipt.approval.reservedCredits, maximumCredits)
    assert.equal(approved.receipt.approval.jobCount, 5)
  }
  assert.equal(requests.length, 1)
  assert.equal(requests[0]?.method, 'POST')
  assert.equal(requests[0]?.url, `/v1/edit-plans/${planId}/canonical-approval`)
  assert.equal(requests[0]?.authorization, 'Bearer canonical-approval-client-token')
  assert.equal(requests[0]?.internalToken, undefined)
  assert.match(requests[0]?.idempotencyKey ?? '', /^canonical-plan-approval:/)
  assert.deepEqual(Object.keys(requests[0]!.body).sort(), [
    'expectedEditSessionId',
    'expectedEstimateHash',
    'expectedEstimateId',
    'expectedMaximumCredits',
    'expectedPlanHash',
    'expectedPlanVersion',
    'expectedProjectId',
    'workspaceId',
  ])
  assert.equal('expectedAuthorityRevision' in requests[0]!.body, false)
  assert.doesNotMatch(JSON.stringify(requests[0]!.body), /path|credential|token|job|componentRefs/i)

  mode = 'foreign'
  const foreign = await approveCanonicalPlanForNamedEdit(input)
  assert.equal(foreign.status, 'invalid_response')
  assert.equal(foreign.reservationState, 'unknown')

  mode = 'insufficient'
  const insufficient = await approveCanonicalPlanForNamedEdit(input)
  assert.equal(insufficient.status, 'insufficient_credits')
  assert.equal(insufficient.reservationState, 'unchanged')

  mode = 'stale'
  const stale = await approveCanonicalPlanForNamedEdit(input)
  assert.equal(stale.status, 'blocked')
  assert.equal(stale.reservationState, 'unchanged')

  mode = 'access_denied'
  const accessDenied = await approveCanonicalPlanForNamedEdit(input)
  assert.equal(accessDenied.status, 'access_denied')
  assert.equal(accessDenied.reservationState, 'unchanged')

  mode = 'unavailable'
  const unavailable = await approveCanonicalPlanForNamedEdit(input)
  assert.equal(unavailable.status, 'unavailable')
  assert.equal(unavailable.reservationState, 'unknown')

  const substitutedJourney: CanonicalEditJourney = {
    ...journey,
    identity: { ...journey.identity, editSessionId: 'foreign-edit' },
  }
  const beforeSubstitution = requests.length
  const substituted = await approveCanonicalPlanForNamedEdit({ ...input, journey: substitutedJourney })
  assert.equal(substituted.status, 'blocked')
  assert.equal(requests.length, beforeSubstitution, 'Foreign journey identity must fail before HTTP.')
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log('Canonical plan approval frontend client smoke passed.')

function receiptFixture(receiptIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-plan-approval-receipt-v1',
    source: 'canonical_plan_approval_coordinator_service',
    disposition: 'approved_now',
    identity: receiptIdentity,
    plan: {
      planId,
      planVersion: 3,
      status: 'approved',
      planHash,
      estimateId,
      estimateStatus: 'approved',
      estimateHash,
      approvedMaximumCredits: maximumCredits,
    },
    approval: {
      approvalId: 'approval-canonical-approval-client',
      snapshotId: 'snapshot-canonical-approval-client',
      snapshotHash: '3'.repeat(64),
      reservationId: 'reservation-canonical-approval-client',
      reservationStatus: 'reserved',
      reservedCredits: maximumCredits,
      jobCount: 5,
      readyJobCount: 2,
      blockedJobCount: 3,
    },
    boundaries: {
      approvedSnapshotAvailable: true,
      syntheticPrivateCreditReservation: true,
      jobRecordsDerived: true,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  }
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
