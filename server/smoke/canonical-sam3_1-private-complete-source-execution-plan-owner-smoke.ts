import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31PrivateCompleteSourceExecutionPlan,
  canonicalSam31PrivateCompleteSourceExecutionPlanRef,
  createCanonicalSam31PrivateCompleteSourceExecutionPlanOwner,
  createCanonicalSam31PrivateCompleteSourceExecutionPlanRepository,
} from '../services/canonical-sam3_1-private-complete-source-execution-plan-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  exact as sourcePreparationTerminal,
  plan as sourcePlan,
  preparation as sourcePreparation,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner-smoke'
import {
  dispatchReadiness as priorDispatchReadiness,
} from './canonical-sam3_1-private-internal-dispatch-readiness-owner-smoke'

if (!sourcePreparationTerminal) {
  throw new Error('source preparation terminal fixture is absent')
}

const plannedAt = '2026-08-13T16:11:00.000Z'
const expiresAt = '2026-08-13T16:25:00.000Z'
const { readinessHash: _priorHash, ...priorReadinessPayload } =
  priorDispatchReadiness
void _priorHash
const readinessPayload = {
  ...priorReadinessPayload,
  observedAt: '2026-08-13T16:10:30.000Z',
  expiresAt: '2026-08-13T16:30:00.000Z',
}
const privateInternalDispatchReadiness = {
  ...readinessPayload,
  readinessHash: sha256AuthorityValue(readinessPayload),
}

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(hash(input.body), input.contentSha256)
    const prior = objects.get(input.objectPath)
    if (prior) {
      assert.deepEqual(prior, input.body)
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(path) {
    const value = objects.get(path)
    return value ? Buffer.from(value) : null
  },
}

const owner = createCanonicalSam31PrivateCompleteSourceExecutionPlanOwner()
const common = {
  qualificationId: 'sam31-eight-minute-private-complete-source-v1',
  runOrdinal: 1,
  approvedSubjectText: 'basketball player',
  compiledSubjectIntentRef: ref('sam31-full-source-subject-intent', 'a'),
  promptApprovalRef: ref('sam31-full-source-prompt-approval', 'b'),
  sourcePlan,
  sourcePreparation,
  sourcePreparationTerminal,
  privateInternalDispatchReadiness,
  plannedAt,
  expiresAt,
}
const a100Plan = owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-a100-run-01',
  routeId: 'a100_80gb_heavy_primary',
})
const l4Plan = owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-l4-run-01',
  routeId: 'l4_heavy_fallback',
})

assert.equal(owner.privateInternalOnly, true)
assert.equal(owner.customerOrPublicDispatchAuthorized, false)
assert.equal(a100Plan.status,
  'ready_for_private_complete_source_task_materialization')
assert.equal(a100Plan.sourceDurationMilliseconds, 480_000)
assert.equal(a100Plan.sourceFrameCount, 11_520)
assert.equal(a100Plan.sourceWidth, 3_840)
assert.equal(a100Plan.sourceHeight, 2_160)
assert.equal(a100Plan.exactChunkCount, 49)
assert.equal(a100Plan.chunks.length, 49)
assert.equal(a100Plan.chunks[0]?.canonicalStartFrameInclusive, 0)
assert.equal(a100Plan.chunks[0]?.canonicalEndFrameInclusive, 239)
assert.equal(a100Plan.chunks[48]?.canonicalStartFrameInclusive, 11_472)
assert.equal(a100Plan.chunks[48]?.canonicalEndFrameInclusive, 11_519)
assert.equal(a100Plan.chunks[48]?.decodedFrameCount, 48)
assert.equal(a100Plan.maximumSimultaneousRouteAttempts, 1)
assert.equal(a100Plan.chunksMustExecuteSequentially, true)
assert.equal(a100Plan.otherGpuRouteMayStartBeforeThisRunTerminates, false)
assert.equal(a100Plan.capacityMustReturnToZeroBeforeOtherRoute, true)
assert.equal(a100Plan.publicConcurrencyCapacityRequiredForThisPrivateRun,
  false)
assert.equal(a100Plan.futurePublicA100ConcurrencyTarget, 16)
assert.equal(a100Plan.futurePublicL4ConcurrencyTarget, 16)
assert.equal(a100Plan.gpuJobDispatched, false)
assert.equal(a100Plan.customerOrPublicDispatchAuthorized, false)
assert.equal(l4Plan.routeId, 'l4_heavy_fallback')
assert.deepEqual(l4Plan.runtimeReleaseRef,
  privateInternalDispatchReadiness.l4RuntimeReleaseRef)
assert.deepEqual(l4Plan.accountEffectiveRateAuthorityRef,
  privateInternalDispatchReadiness.currentL4RateAuthorityRef)
assert.deepEqual(
  assertCanonicalSam31PrivateCompleteSourceExecutionPlan(a100Plan, plannedAt),
  a100Plan,
)

const repository =
  createCanonicalSam31PrivateCompleteSourceExecutionPlanRepository({
    objectPort,
    prefix: 'private/smoke/sam31-private-complete-source-plans',
  })
assert.equal(await repository.persistCreateOnly({ plan: a100Plan }), 'created')
assert.equal(await repository.persistCreateOnly({ plan: a100Plan }),
  'identical_replay')
assert.deepEqual(await repository.reread({
  executionPlanRef:
    canonicalSam31PrivateCompleteSourceExecutionPlanRef(a100Plan),
}), a100Plan)

assert.throws(() => owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-stale-readiness',
  routeId: 'a100_80gb_heavy_primary',
  plannedAt: privateInternalDispatchReadiness.expiresAt,
}))
assert.throws(() => owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-partial-preparation',
  routeId: 'a100_80gb_heavy_primary',
  sourcePreparation: {
    ...sourcePreparation,
    preparedChunks: sourcePreparation.preparedChunks.slice(0, -1),
  },
}))
assert.throws(() => owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-terminal-not-zero',
  routeId: 'a100_80gb_heavy_primary',
  sourcePreparationTerminal: {
    ...sourcePreparationTerminal,
    activeGpuExecutionsAfterObservation: 1,
  },
}))
assert.throws(() => owner.build({
  ...common,
  executionPlanId: 'sam31-full-source-public-input',
  routeId: 'a100_80gb_heavy_primary',
  publicConcurrencyCapacityRequiredForThisPrivateRun: true,
}))
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceExecutionPlan({
  ...a100Plan,
  planHash: '0'.repeat(64),
}))
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
  a100Plan,
  expiresAt,
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-complete-source-execution-plan-owner',
  checks: 49,
  privateA100AndL4PlansBuilt: true,
  exactEightMinuteFrameCount: a100Plan.sourceFrameCount,
  exactPreparedChunkCount: a100Plan.exactChunkCount,
  maximumSimultaneousPrivateRouteAttempts:
    a100Plan.maximumSimultaneousRouteAttempts,
  publicSixteenGpuCapacityRequiredForPrivateRun:
    a100Plan.publicConcurrencyCapacityRequiredForThisPrivateRun,
  gpuJobDispatched: a100Plan.gpuJobDispatched,
  customerOrPublicDispatchAuthorized:
    a100Plan.customerOrPublicDispatchAuthorized,
}))

function ref(id: string, character: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${character.repeat(64)}` as const,
  }
}

function hash(value: Buffer) {
  return createHash('sha256').update(value).digest('hex')
}
