import assert from 'node:assert/strict'

import type { GoogleAuth } from 'google-auth-library'

import {
  assertCanonicalProfessionalGpuCloudTaskSpec,
  compileCanonicalProfessionalGpuCloudTaskSpec,
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  createGoogleCloudProfessionalGpuCloudTaskDispatchPort,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import {
  CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_CLAIM_VERSION,
} from '../services/canonical-professional-gpu-fair-queue-transaction-port'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const compiledAt = '2026-08-13T02:00:00.000Z'
const config = createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
  targetOrigin: 'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app',
})
const claim = durableClaim()
const spec = compileCanonicalProfessionalGpuCloudTaskSpec({
  claim,
  runtimeConfig: config,
  compiledAt,
})
const replay = compileCanonicalProfessionalGpuCloudTaskSpec({
  claim: structuredClone(claim),
  runtimeConfig: structuredClone(config),
  compiledAt,
})

assert.equal(spec.specDigestSha256, replay.specDigestSha256)
assert.equal(spec.cloudTaskName, replay.cloudTaskName)
assert.equal(spec.cloudTaskId.length, 'weeditpro-gpu-'.length + 48)
assert.equal(spec.targetUrl,
  'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app/internal/v1/professional-gpu-queue/claims/consume')
assert.equal(spec.oidcAudience,
  'https://reeditpro-api-4wkjiqvdqa-uc.a.run.app')
assert.equal(spec.oidcServiceAccountEmail,
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(spec.dispatchDeadline, '60s')
assert.equal(spec.cloudGpuDispatchStarted, false)
assert.equal(spec.customerCreditsMutated, false)
assert.equal(spec.automaticNewExecutionAttemptAllowed, false)
assert.deepEqual(
  JSON.parse(Buffer.from(spec.bodyBase64, 'base64').toString('utf8')),
  spec.body,
)
assert.doesNotMatch(
  Buffer.from(spec.bodyBase64, 'base64').toString('utf8'),
  /media|prompt|model|image|command|price|credit|secret|credential|token|url|path/iu,
)

const createCalls: RequestOptions[] = []
const createPort = createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig: config,
  auth: fakeAuth(async (request) => {
    createCalls.push(request)
    return { data: request.data?.task }
  }),
  now: () => '2026-08-13T02:00:01.000Z',
})
const created = await createPort.createOne(spec)
assert.equal(created.disposition, 'task_created')
assert.equal(created.providerOutcome, 'created')
assert.equal(created.cloudTaskRef?.id, spec.cloudTaskName)
assert.equal(created.automaticCreateRetryStarted, false)
assert.equal(createCalls.length, 1)
assert.equal(createCalls[0]?.retry, false)
assert.equal(createCalls[0]?.maxRedirects, 0)
assert.equal(createCalls[0]?.params?.responseView, 'FULL')
assert.equal(createCalls[0]?.data?.task.name, spec.cloudTaskName)

const reconciliationCalls: RequestOptions[] = []
const reconciliationPort = createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig: config,
  auth: fakeAuth(async (request) => {
    reconciliationCalls.push(request)
    if (request.method === 'POST') throw httpError(409)
    return { data: apiTask(spec) }
  }),
  now: () => '2026-08-13T02:00:02.000Z',
})
const reconciled = await reconciliationPort.createOne(spec)
assert.equal(reconciled.disposition, 'existing_task_exactly_reconciled')
assert.equal(reconciled.providerOutcome, 'created')
assert.equal(reconciled.exactTaskRereadAfterAlreadyExists, true)
assert.equal(reconciliationCalls.length, 2)
assert.equal(reconciliationCalls[1]?.method, 'GET')
assert.equal(reconciliationCalls[1]?.retry, false)

const rejectedPort = createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig: config,
  auth: fakeAuth(async () => { throw httpError(400) }),
  now: () => '2026-08-13T02:00:03.000Z',
})
const rejected = await rejectedPort.createOne(spec)
assert.equal(rejected.disposition, 'task_rejected_before_creation')
assert.equal(rejected.providerOutcome, 'not_created')
assert.equal(rejected.cloudTaskRef, null)

const unknownPort = createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
  runtimeConfig: config,
  auth: fakeAuth(async () => { throw new Error('network outcome unknown') }),
  now: () => '2026-08-13T02:00:04.000Z',
})
const unknown = await unknownPort.createOne(spec)
assert.equal(
  unknown.disposition,
  'task_create_outcome_unknown_requires_reconciliation',
)
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticCreateRetryStarted, false)

const changedExistingPort =
  createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
    runtimeConfig: config,
    auth: fakeAuth(async (request) => {
      if (request.method === 'POST') throw httpError(409)
      return {
        data: {
          ...apiTask(spec),
          httpRequest: {
            ...apiTask(spec).httpRequest,
            body: Buffer.from('{"substitution":true}').toString('base64'),
          },
        },
      }
    }),
    now: () => '2026-08-13T02:00:05.000Z',
  })
const changedExisting = await changedExistingPort.createOne(spec)
assert.equal(
  changedExisting.disposition,
  'task_create_outcome_unknown_requires_reconciliation',
)
assert.equal(changedExisting.providerOutcome, 'unknown')

assert.throws(() => assertCanonicalProfessionalGpuCloudTaskSpec({
  ...spec,
  cloudTaskId: `weeditpro-gpu-${'f'.repeat(48)}`,
  cloudTaskName:
    `${spec.queueResourceName}/tasks/weeditpro-gpu-${'f'.repeat(48)}`,
  specDigestSha256: sha256AuthorityValue({
    ...without(spec, 'specDigestSha256'),
    cloudTaskId: `weeditpro-gpu-${'f'.repeat(48)}`,
    cloudTaskName:
      `${spec.queueResourceName}/tasks/weeditpro-gpu-${'f'.repeat(48)}`,
  }),
}))

let getterInvoked = false
const accessor: Record<string, unknown> = { ...claim }
Object.defineProperty(accessor, 'claimId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return claim.claimId
  },
})
assert.throws(() => compileCanonicalProfessionalGpuCloudTaskSpec({
  claim: accessor,
  runtimeConfig: config,
  compiledAt,
}))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  status: 'PASS',
  deterministicNamedTaskProven: true,
  opaqueIdentifierOnlyBodyProven: true,
  exactOidcTargetAndDeadlineProven: true,
  createTransportRetryDisabled: true,
  alreadyExistsExactGetReconciliationProven: true,
  knownPrecreationRejectionClassified: true,
  unknownCreateOutcomeBlocksAutomaticRetry: true,
  crossTaskSubstitutionRejected: true,
  callerSelectedGpuCapacityOrPriceAccepted: false,
  cloudGpuDispatchStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

interface RequestOptions {
  readonly url?: string
  readonly method?: string
  readonly timeout?: number
  readonly maxRedirects?: number
  readonly retry?: boolean
  readonly params?: Record<string, unknown>
  readonly data?: {
    readonly task: ReturnType<typeof apiTask>
  }
}

function fakeAuth(
  handler: (request: RequestOptions) => Promise<{ readonly data: unknown }>,
): Pick<GoogleAuth, 'request'> {
  return {
    request: handler,
  } as unknown as Pick<GoogleAuth, 'request'>
}

function apiTask(value: typeof spec) {
  return {
    name: value.cloudTaskName,
    httpRequest: {
      httpMethod: value.httpMethod,
      url: value.targetUrl,
      headers: { 'Content-Type': value.contentType },
      body: value.bodyBase64,
      oidcToken: {
        serviceAccountEmail: value.oidcServiceAccountEmail,
        audience: value.oidcAudience,
      },
    },
    dispatchDeadline: value.dispatchDeadline,
  }
}

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  })
}

function durableClaim() {
  const queueEntry = {
    queueEntryId: 'gpu-queue-entry-sam31-1',
    ownerUserId: '11111111-1111-4111-8111-111111111111',
    workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    routeId: 'a100_80gb_heavy_primary' as const,
    approvedSnapshotRef: ref('snapshot-1', 'a'),
    approvedWorkItemRef: ref('work-1', 'b'),
    fundedDispatchAdmissionRef: ref('funded-1', 'c'),
    executionAttemptRef: ref('attempt-1', 'd'),
    userTriggerRecordRef: ref('trigger-1', 'e'),
    enqueuedAt: '2026-08-13T01:59:00.000Z',
    enqueueOrdinal: 1,
    userTriggeredAfterApprovalAndFunding: true as const,
    callerSelectedPriorityCapacityOrRoute: false as const,
  }
  const payload = {
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_CLAIM_VERSION,
    source: 'canonical_postgres_professional_gpu_fair_queue_owner' as const,
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1' as const,
    queueEntry,
    scheduleRef: ref('schedule-1', 'f'),
    claimId: 'gpu-claim-sam31-1',
    claimedAt: '2026-08-13T02:00:00.000Z',
    dispatchLeaseExpiresAt: '2026-08-13T02:02:00.000Z',
    externalDispatchOutcome: 'not_started' as const,
    cloudGpuDispatchStarted: false as const,
    customerCreditsMutated: false as const,
    automaticRetryAllowed: false as const,
  }
  return Object.freeze({
    ...payload,
    claimHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, character: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${character.repeat(64)}`,
  }
}

function without<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const clone = { ...value }
  delete clone[key]
  return clone
}
