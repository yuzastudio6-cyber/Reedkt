import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION,
  CANONICAL_SAM3_1_VERTEX_QUALIFICATION_START_CONFIRMATION,
  reconcileCanonicalSam31VertexQualificationFromEnvironment,
  startCanonicalSam31VertexQualificationFromEnvironment,
} from '../cli/canonical-sam3_1-source-checkpoint-qualification-vertex-operator'

const digestA = 'a'.repeat(64)
const digestB = 'b'.repeat(64)
const digestC = 'c'.repeat(64)
const digestD = 'd'.repeat(64)
const events: string[] = []
const runtime = {
  async prepareAndStage(value: Record<string, unknown>) {
    events.push('prepare')
    assert.equal(value.attemptId, 'sam31-vertex-live-qualification-001')
    assert.equal(value.issuedAt, '2026-08-08T02:00:00.000Z')
    assert.deepEqual(value.historicalPackageRequestRef, {
      id: 'sam31-historical-package-request',
      version: 1,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-qualification-worker-request-v1',
      contentHash: `sha256:${digestA}`,
    })
    return {
      status: 'staged_not_dispatched' as const,
      attemptId: value.attemptId as string,
      workerRequestRef: {
        id: 'sam31-vertex-worker-request',
        version: 2,
        contentHash: `sha256:${digestD}` as const,
      },
      stagingObservation: { exact: true },
      providerOrGpuJobStarted: false as const,
      customerCreditsMutated: false as const,
      sourceCheckpointQualificationGranted: false as const,
      productionReady: false as const,
    }
  },
  async admitAndStart(value: Record<string, unknown>) {
    events.push('start')
    assert.deepEqual(value, {
      workerRequestRef: {
        id: 'sam31-vertex-worker-request',
        version: 2,
        contentHash: `sha256:${digestD}`,
      },
      imageSupplyChainReleaseRef: {
        id: 'sam31-image-release',
        version: 1,
        contentHash: `sha256:${digestB}`,
      },
      currentAccountRateAuthorityRef: {
        id: 'sam31-a100-rate',
        version: 3,
        contentHash: `sha256:${digestC}`,
      },
    })
    return {
      disposition: 'accepted' as const,
      executionRef: {
        id: 'sam31-vertex-execution',
        version: 1,
        contentHash: `sha256:${digestD}` as const,
      },
    }
  },
  async reconcileOne(value: Record<string, unknown>) {
    events.push('reconcile')
    assert.deepEqual(value, {
      executionRef: {
        id: 'sam31-vertex-execution',
        version: 1,
        contentHash: `sha256:${digestD}`,
      },
    })
    return {
      disposition: 'pending' as const,
      checkbackAllowed: true as const,
      retryAllowedWithoutCanonicalReconciliation: false as const,
    }
  },
}

const startEnvironment = {
  WEEDITPRO_SAM31_VERTEX_QUALIFICATION_CONFIRMATION:
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_START_CONFIRMATION,
  WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ATTEMPT_ID:
    'sam31-vertex-live-qualification-001',
  WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ISSUED_AT:
    '2026-08-08T02:00:00.000Z',
  WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_ID:
    'sam31-historical-package-request',
  WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_SHA256: digestA,
  WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_ID:
    'sam31-image-release',
  WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256: digestB,
  WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_ID: 'sam31-a100-rate',
  WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_VERSION: '3',
  WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_SHA256: digestC,
}
const started = await startCanonicalSam31VertexQualificationFromEnvironment(
  startEnvironment,
  runtime as never,
)
assert.deepEqual(events, ['prepare', 'start'])
assert.equal(started.action, 'start_one')
assert.equal(started.launch.disposition, 'accepted')
assert.equal(started.automaticRetryAllowed, false)
assert.equal(started.customerCreditsMutated, false)
assert.equal(started.productionReady, false)

await assert.rejects(
  startCanonicalSam31VertexQualificationFromEnvironment({
    ...startEnvironment,
    WEEDITPRO_SAM31_VERTEX_QUALIFICATION_CONFIRMATION: 'wrong',
  }, runtime as never),
)
assert.deepEqual(events, ['prepare', 'start'])

const reconciled =
  await reconcileCanonicalSam31VertexQualificationFromEnvironment({
    WEEDITPRO_SAM31_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION:
      CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION,
    WEEDITPRO_SAM31_VERTEX_EXECUTION_ID: 'sam31-vertex-execution',
    WEEDITPRO_SAM31_VERTEX_EXECUTION_VERSION: '1',
    WEEDITPRO_SAM31_VERTEX_EXECUTION_SHA256: digestD,
  }, runtime as never)
assert.deepEqual(events, ['prepare', 'start', 'reconcile'])
assert.equal(reconciled.action, 'reconcile_one')
assert.equal(reconciled.terminal.disposition, 'pending')
assert.equal(reconciled.automaticRetryAllowed, false)

for (const path of [
  'server/cli/start-canonical-sam3_1-source-checkpoint-qualification-vertex.ts',
  'server/cli/reconcile-canonical-sam3_1-source-checkpoint-qualification-vertex.ts',
]) {
  const source = readFileSync(path, 'utf8')
  assert.doesNotMatch(
    source,
    /checkpointPath|imageUri|machineType|accelerator|billingAccount|customerCredit|child_process|execFile|spawn\(/u,
  )
}

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-qualification-operator',
  checks: 30,
  exactPrepareThenStartOrder: true,
  exactHistoricalImageAndRateRefs: true,
  restartSafeReconcileByExecutionRef: true,
  invalidConfirmationCallsRuntime: false,
  callerModelCheckpointImageGpuClassPriceOrCommandAccepted: false,
  automaticRetryAllowed: false,
  customerCreditsMutated: false,
  sourceCheckpointQualificationGranted: false,
  productionReady: false,
}, null, 2))
