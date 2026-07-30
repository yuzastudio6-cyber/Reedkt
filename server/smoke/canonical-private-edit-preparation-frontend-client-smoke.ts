import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import type { CanonicalEditJourney } from '../../src/lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'
import {
  REEDITPRO_CANONICAL_PRIVATE_REVIEW_MAX_BYTES,
} from '../../src/types/large-media'
import {
  canonicalPrivateEditPreparationReceiptSchema,
} from '../validation/canonical-private-edit-preparation-schemas'

const identity = {
  workspaceId: 'workspace-private-edit-client',
  projectId: 'project-private-edit-client',
  editSessionId: 'edit-private-edit-client',
}
const packageRecordId = 'package-private-edit-client'
const packageHash = '4'.repeat(64)
const snapshotId = 'snapshot-private-edit-client'
const snapshotHash = '3'.repeat(64)
const longFormPrivateReviewBytes = 64 * 1024 * 1024
const journey: CanonicalEditJourney = {
  identity,
  stage: 'execution_in_progress',
  privateEditPreparationAuthority: {
    packageRecordId,
    expectedPackageHash: packageHash,
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
  userId: 'user-private-edit-client',
  workspaceId: identity.workspaceId,
}
const longFormReadyReceipt = receiptFixture({
  disposition: 'private_review_ready',
  workspaceId: identity.workspaceId,
})
assert.equal(
  canonicalPrivateEditPreparationReceiptSchema.parse(longFormReadyReceipt)
    .review?.finalArtifactByteLength,
  longFormPrivateReviewBytes,
)
assert.equal(
  canonicalPrivateEditPreparationReceiptSchema.safeParse({
    ...longFormReadyReceipt,
    review: {
      ...(longFormReadyReceipt.review as Record<string, unknown>),
      finalArtifactByteLength:
        REEDITPRO_CANONICAL_PRIVATE_REVIEW_MAX_BYTES + 1,
    },
  }).success,
  false,
)

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let mode:
  | 'valid'
  | 'in_progress'
  | 'blocked'
  | 'foreign'
  | 'stale'
  | 'unavailable'
  | 'access_denied' = 'valid'
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
    if (!['valid', 'in_progress', 'blocked', 'foreign'].includes(mode)) {
      const failure = {
        stale: { status: 409, code: 'IDEMPOTENCY_CONFLICT' },
        unavailable: { status: 503, code: 'BACKEND_UNAVAILABLE' },
        access_denied: { status: 403, code: 'WORKSPACE_ACCESS_DENIED' },
      }[mode as 'stale' | 'unavailable' | 'access_denied']
      response.statusCode = failure.status
      response.end(JSON.stringify({
        ok: false,
        error: { code: failure.code, message: 'Private edit client smoke failure.' },
        warnings: [],
      }))
      return
    }
    response.statusCode = mode === 'in_progress' ? 202 : 201
    response.end(JSON.stringify({
      ok: true,
      data: {
        canonicalPrivateEditPreparation: receiptFixture({
          disposition: mode === 'in_progress'
            ? 'in_progress'
            : mode === 'blocked'
              ? 'blocked'
              : 'private_review_ready',
          workspaceId: mode === 'foreign' ? 'workspace-foreign' : identity.workspaceId,
        }),
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
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'private-edit-client-token'

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { prepareCanonicalPrivateEditForNamedEdit } = await import(
    '../../src/lib/canonical-private-edit-preparation-client'
  )
  const route = getApiRouteById('editExecution.canonicalPrivateEditPreparation.create')
  assert.equal(
    route?.path,
    '/v1/edit-executions/packages/:packageRecordId/canonical-private-edit-preparation',
  )
  assert.equal(route?.runtimeMode, 'frontend_safe')
  assert.equal(route?.status, 'frontend_safe_ready')
  assert.equal(route?.requiresSupabase, false)
  assert.equal(route?.requiresServiceRole, false)
  assert.equal(route?.requiresProviderSecret, false)
  assert.equal(route?.requiresStripeSecret, false)

  const input = {
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    journey,
  }
  const first = prepareCanonicalPrivateEditForNamedEdit(input)
  const duplicate = prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(duplicate, first, 'Concurrent exact preparation requests must share one browser request.')
  const ready = await first
  assert.equal(ready.status, 'ready')
  if (ready.status === 'ready') {
    assert.equal(ready.receipt.identity.packageRecordId, packageRecordId)
    assert.equal(ready.receipt.authority.packageHash, packageHash)
    assert.equal(ready.receipt.progress.allRequiredJobsCompleted, true)
    assert.ok(ready.receipt.review)
    assert.equal(
      ready.receipt.review?.finalArtifactByteLength,
      longFormPrivateReviewBytes,
    )
  }
  assert.equal(requests.length, 1)
  assert.equal(requests[0]?.method, 'POST')
  assert.equal(
    requests[0]?.url,
    `/v1/edit-executions/packages/${packageRecordId}/canonical-private-edit-preparation`,
  )
  assert.equal(requests[0]?.authorization, 'Bearer private-edit-client-token')
  assert.equal(requests[0]?.internalToken, undefined)
  assert.match(requests[0]?.idempotencyKey ?? '', /^canonical-private-edit:[a-f0-9]{8}$/)
  assert.deepEqual(requests[0]?.body, {
    workspaceId: identity.workspaceId,
    expectedProjectId: identity.projectId,
    expectedEditSessionId: identity.editSessionId,
    expectedSnapshotId: snapshotId,
    expectedSnapshotHash: snapshotHash,
    expectedPackageHash: packageHash,
    purpose: 'prepare_canonical_private_edit_review',
  })
  assert.doesNotMatch(
    JSON.stringify(requests[0]?.body),
    /credential|token|jobs|tools|command|path|provider|price|componentRefs/i,
  )

  mode = 'in_progress'
  const inProgress = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(inProgress.status, 'in_progress')
  assert.equal(inProgress.retryable, true)
  if (inProgress.status === 'in_progress') {
    assert.equal(inProgress.receipt.progress.completedJobCount, 3)
    assert.equal(inProgress.receipt.progress.blockedJobCount, 0)
    assert.equal(inProgress.receipt.review, null)
  }

  mode = 'blocked'
  const blocked = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(blocked.status, 'blocked')
  assert.equal(blocked.retryable, true)
  if (blocked.status === 'blocked') {
    assert.equal(blocked.receipt?.progress.completedJobCount, 3)
    assert.equal(blocked.receipt?.progress.blockedJobCount, 3)
  }

  mode = 'foreign'
  const foreign = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(foreign.status, 'invalid_response')

  mode = 'stale'
  const stale = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(stale.status, 'blocked')
  assert.equal(stale.retryable, false)

  mode = 'access_denied'
  const accessDenied = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(accessDenied.status, 'access_denied')
  assert.equal(accessDenied.retryable, false)

  mode = 'unavailable'
  const unavailable = await prepareCanonicalPrivateEditForNamedEdit(input)
  assert.equal(unavailable.status, 'unavailable')
  assert.equal(unavailable.retryable, true)

  const substitutedJourney: CanonicalEditJourney = {
    ...journey,
    identity: { ...journey.identity, editSessionId: 'foreign-edit' },
  }
  const beforeSubstitution = requests.length
  const substituted = await prepareCanonicalPrivateEditForNamedEdit({
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

console.log('Canonical private edit preparation frontend client smoke passed.')

function receiptFixture(input: {
  disposition: 'private_review_ready' | 'in_progress' | 'blocked'
  workspaceId: string
}): Record<string, unknown> {
  const ready = input.disposition === 'private_review_ready'
  const inProgress = input.disposition === 'in_progress'
  return {
    schemaVersion: 'canonical-private-edit-preparation-receipt-v1',
    source: 'canonical_private_edit_preparation_coordinator_service',
    purpose: 'prepare_canonical_private_edit_review',
    disposition: input.disposition,
    identity: {
      ...identity,
      workspaceId: input.workspaceId,
      packageRecordId,
      approvedPlanSnapshotId: snapshotId,
    },
    authority: {
      packageHash,
      snapshotHash,
      exactApprovedAuthorityRevalidated: true,
      serverDerivedWorkGraphOnly: true,
    },
    progress: {
      totalJobCount: 6,
      completedJobCount: ready ? 6 : 3,
      blockedJobCount: ready || inProgress ? 0 : 3,
      allRequiredJobsCompleted: ready,
      retryAvailable: !ready && !inProgress,
      userReviewRequired: false,
    },
    review: ready ? {
      reviewAssemblyId: 'review-private-edit-client',
      manifestSha256: '5'.repeat(64),
      finalArtifactSha256: '6'.repeat(64),
      finalArtifactByteLength: longFormPrivateReviewBytes,
      readyForPrivateReview: true,
    } : null,
    readiness: {
      privateReviewReady: ready,
      nextRequiredGate: ready
        ? 'canonical_private_review_user_decision_or_revision'
        : inProgress
          ? 'canonical_private_work_graph_advancement'
          : 'canonical_job_capability_blockers',
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
    boundaries: {
      approvedPrivateExecutionRequested: true,
      browserSuppliedJobsAccepted: false,
      browserSuppliedToolsAccepted: false,
      rawExecutionAuthorityReturned: false,
      jobOrToolDetailsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      providerCallStarted: false,
      publicArtifactCreated: false,
      publicDeliveryStarted: false,
      productionRenderStarted: false,
      customerPriceMutation: false,
      customerCreditMutation: false,
      walletMutation: false,
      settlementStarted: false,
      billingStarted: false,
      deploymentStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    completedAt: '2026-07-13T16:00:00.000Z',
    testOnly: true,
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
