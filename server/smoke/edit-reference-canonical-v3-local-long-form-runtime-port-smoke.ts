import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  createCanonicalDistributedPrePlanStudyReadProjectionPort,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-read-projection'
import {
  createCanonicalDistributedPrePlanStudyLocalPostgresAdapter,
  createCanonicalDistributedPrePlanStudyLocalPostgresCapability,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-rpc-adapter'
import {
  createCanonicalDistributedPrePlanStudyStatePort,
  type CanonicalDistributedPrePlanStudyTransactionAdapter,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  prepareEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-binding'
import {
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-contract'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceCanonicalV3LocalLongFormRuntimePort,
} from '../services/edit-reference-canonical-v3-local-long-form-runtime-port'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const workspaceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const editReferenceId = 'aaaaaaaa-3000-4000-8000-000000000001'
const studySessionId = 'aaaaaaaa-4000-4000-8000-000000000001'
const sourceAssetId = 'aaaaaaaa-d000-4000-8000-000000000001'
const proofId = randomUUID()
const createdAt = new Date().toISOString()
const runId = `canonical-v3-local-six-hour-${proofId}`
const localStorageRoot = join(tmpdir(), 'reeditpro-canonical-v3-local-long-form-runtime-proof')
const scopeA = { localStorageRoot, ownerUserId: ownerA, workspaceId: workspaceA }
const scopeB = { localStorageRoot, ownerUserId: ownerB, workspaceId: workspaceB }

const ownerAPorts = createPorts(ownerA)
const runtimeA = createEditReferenceCanonicalV3LocalLongFormRuntimePort({
  statePort: ownerAPorts.statePort,
  readProjectionPort: ownerAPorts.readProjectionPort,
})
assert.equal(runtimeA.productionAuthority, false)
assert.equal(runtimeA.sourceAuthority, 'canonical_v3_loopback_postgres_pre_plan_study')
assert.equal(runtimeA.databaseTransactionAdapterVerified, true)
assert.equal(runtimeA.authenticatedWorkerDispatchVerified, false)
assert.equal(runtimeA.livePrivateObjectReadVerified, false)

const plan = createEditReferenceLongFormStudyPlan({
  workspaceId: workspaceA,
  editReferenceId,
  studySessionId,
  source: {
    privateMediaArtifactId: `canonical-v3-local-private-${proofId}`,
    mediaChecksumSha256: 'a'.repeat(64),
    durationSeconds: 6 * 60 * 60,
    sizeBytes: 250 * 1024 ** 3,
    mimeType: 'video/mp4',
    hasAudio: true,
  },
  includeCaptionOcr: true,
  createdAt,
})
const preparedRun = prepareEditReferenceLongFormStudyRun({
  plan,
  run: createEditReferenceLongFormStudyRun({ runId, plan, createdAt }),
  ingestIntegrityDigestSha256: '1'.repeat(64),
  mediaProbeDigestSha256: '2'.repeat(64),
  mediaProbeObservedWallClockMs: 8_500,
  now: createdAt,
})
assert.equal(plan.chunks.length, 36)
assert.equal(preparedRun.workItems.length, 292)
assert.equal(preparedRun.revision, 5)

const sourceBinding = {
  sourceAuthority: 'preference_asset' as const,
  sourceAssetId,
  sourceStorageObjectRecordId: 'storage-object-record-a',
  sourceMediaAssetId: 'media-asset-a',
  sourceStorageObjectId: 'tenant-a/reference/source.mp4',
  sourceStorageGeneration: '1',
  sourceStorageEtag: 'etag-a',
}
const interruptedRuntime = createEditReferenceCanonicalV3LocalLongFormRuntimePort({
  statePort: createLostClaimResponsePort(ownerAPorts.statePort),
  readProjectionPort: ownerAPorts.readProjectionPort,
})
await assert.rejects(
  () => interruptedRuntime.create({
    scope: scopeA,
    plan,
    run: preparedRun,
    sourceBinding,
  }),
  /simulated_preflight_claim_response_loss/u,
)
const created = await runtimeA.create({
  scope: scopeA,
  plan,
  run: preparedRun,
  sourceBinding,
})
assert.equal(created.disposition, 'idempotent_replay')
assert.equal(created.run.revision, preparedRun.revision)
assert.equal(created.run.state, 'running')
assert.equal(created.run.workItems.length, 292)
assert.equal(created.run.workItems.filter((item) => item.status === 'completed').length, 2)
assert.equal(created.run.workItems.find((item) => (
  item.stageId === 'ingest_integrity'
))?.attemptCount, 1)
assert.match(created.run.recordDigestSha256, /^[a-f0-9]{64}$/u)

const replayedCreate = await runtimeA.create({
  scope: scopeA,
  plan,
  run: preparedRun,
  sourceBinding,
})
assert.equal(replayedCreate.disposition, 'idempotent_replay')
assert.equal(replayedCreate.run.recordDigestSha256, created.run.recordDigestSha256)

const restartedRuntime = createEditReferenceCanonicalV3LocalLongFormRuntimePort({
  statePort: ownerAPorts.statePort,
  readProjectionPort: ownerAPorts.readProjectionPort,
})
const restartedRead = await restartedRuntime.read({
  scope: scopeA,
  runId,
})
assert.ok(restartedRead)
assert.equal(restartedRead.run.recordDigestSha256, created.run.recordDigestSha256)
assert.equal(restartedRead.plan.planDigestSha256, plan.planDigestSha256)

const schedule = restartedRuntime.schedule({} as never)
assert.deepEqual(schedule, {
  scheduled: false,
  alreadyActive: false,
  runtime: 'blocked',
  reason: 'canonical_worker_dispatch_not_verified',
})
assert.equal(await restartedRuntime.readWorkOutput({
  scope: scopeA,
  runId,
  workItemId: preparedRun.workItems[0]?.workItemId ?? '',
}), undefined)

const pauseKey = `pause-${randomUUID()}`
const paused = await restartedRuntime.applyControlCommand({
  scope: scopeA,
  runId,
  expectedRunRevision: created.run.revision,
  action: 'pause',
  idempotencyKey: pauseKey,
  now: plus(createdAt, 60_000),
})
assert.equal(paused.disposition, 'applied')
assert.equal(paused.run.state, 'paused')
assert.equal(paused.run.revision, created.run.revision + 1)
assert.equal(paused.receipt.activeWorkFinishesBeforePause, false)
const pausedReplay = await restartedRuntime.applyControlCommand({
  scope: scopeA,
  runId,
  expectedRunRevision: created.run.revision,
  action: 'pause',
  idempotencyKey: pauseKey,
  now: plus(createdAt, 60_000),
})
assert.equal(pausedReplay.disposition, 'idempotent_replay')
assert.deepEqual(pausedReplay.receipt, paused.receipt)
assert.equal(pausedReplay.run.recordDigestSha256, paused.run.recordDigestSha256)

const resumed = await restartedRuntime.applyControlCommand({
  scope: scopeA,
  runId,
  expectedRunRevision: paused.run.revision,
  action: 'resume',
  idempotencyKey: `resume-${randomUUID()}`,
  now: plus(createdAt, 120_000),
})
assert.equal(resumed.run.state, 'running')
assert.equal(resumed.run.revision, paused.run.revision + 1)

const cancelled = await restartedRuntime.applyControlCommand({
  scope: scopeA,
  runId,
  expectedRunRevision: resumed.run.revision,
  action: 'cancel',
  idempotencyKey: `cancel-${randomUUID()}`,
  now: plus(createdAt, 180_000),
})
assert.equal(cancelled.run.state, 'cancelled')
assert.equal(cancelled.run.workItems.filter((item) => item.status === 'completed').length, 2)
assert.equal(cancelled.run.workItems.filter((item) => item.status === 'cancelled').length, 290)

const ownerBPorts = createPorts(ownerB)
const runtimeB = createEditReferenceCanonicalV3LocalLongFormRuntimePort({
  statePort: ownerBPorts.statePort,
  readProjectionPort: ownerBPorts.readProjectionPort,
})
await assert.rejects(
  () => runtimeB.read({
    scope: scopeB,
    runId,
  }),
  isAtomicityError,
)
await assert.rejects(
  () => runtimeA.create({
    scope: scopeA,
    plan,
    run: createEditReferenceLongFormStudyRun({
      runId: `target-source-${randomUUID()}`,
      plan,
      createdAt,
    }),
    sourceBinding: { ...sourceBinding, sourceAuthority: 'target_source_media' },
  }),
  isDependencyBlock,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'edit-reference-canonical-v3-local-long-form-runtime-port-smoke-v1',
  durationSeconds: plan.source.durationSeconds,
  chunkCount: plan.chunks.length,
  workItemCount: preparedRun.workItems.length,
  preflightCheckpointCount: 2,
  persistedRevisionAfterCreate: created.run.revision,
  restartSafeReadVerified: true,
  lostPreflightClaimResponseRecovered: true,
  exactCreateReplayVerified: true,
  exactControlReplayVerified: true,
  pauseResumeCancelVerified: true,
  completedPreflightPreservedAfterCancel: true,
  crossWorkspaceReadDenied: true,
  targetSourceAuthorityFabricated: false,
  workerDispatchPerformed: false,
  privateObjectReadPerformed: false,
  providerCallPerformed: false,
  remoteMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function createPorts(subject: string) {
  const client = createCanonicalDistributedPrePlanStudyLocalHttpClient({
    endpointOrigin,
    anonKey,
    authenticatedAccessToken: createLocalAuthenticatedJwt(subject, jwtSecret),
    localInternalSigningSecret: jwtSecret,
  })
  const capability = createCanonicalDistributedPrePlanStudyLocalPostgresCapability({
    client,
    endpointOrigin,
  })
  const adapter = createCanonicalDistributedPrePlanStudyLocalPostgresAdapter({
    client,
    capability,
  })
  return {
    statePort: createCanonicalDistributedPrePlanStudyStatePort(adapter),
    readProjectionPort: createCanonicalDistributedPrePlanStudyReadProjectionPort({
      client,
      capability,
    }),
  }
}

function createLostClaimResponsePort(
  port: CanonicalDistributedPrePlanStudyTransactionAdapter,
): CanonicalDistributedPrePlanStudyTransactionAdapter {
  let responseLost = false
  return createCanonicalDistributedPrePlanStudyStatePort({
    descriptor: port.descriptor,
    enqueue: (input) => port.enqueue(input),
    async claimAndStart(input) {
      const result = await port.claimAndStart(input)
      if (!responseLost) {
        responseLost = true
        throw new Error('simulated_preflight_claim_response_loss')
      }
      return result
    },
    heartbeatAndCheckpoint: (input) => port.heartbeatAndCheckpoint(input),
    complete: (input) => port.complete(input),
    fail: (input) => port.fail(input),
    control: (input) => port.control(input),
    recoverExpiredLease: (input) => port.recoverExpiredLease(input),
  })
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1_000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: now + 900,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url')}`
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`canonical_v3_local_runtime_environment_missing:${name}`)
  return value
}

function plus(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString()
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}

function isDependencyBlock(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'JOB_DEPENDENCY_NOT_READY'
}
