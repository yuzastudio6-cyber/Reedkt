import assert from 'node:assert/strict'

import {
  createCanonicalGpuWorkerOperationRuntimePort,
  routeCanonicalGpuWorkerOperation,
} from '../model-artifacts/canonical-gpu-worker-operation-router'

let runtimeInvocations = 0
const runtimePort = createCanonicalGpuWorkerOperationRuntimePort({
  evidenceClass: 'controlled_source_fixture',
  async execute() {
    runtimeInvocations += 1
    throw new Error('Retired SAM2 work must never reach a runtime port.')
  },
})

await assert.rejects(
  () => routeCanonicalGpuWorkerOperation({
    request: {
      operationId: 'tool.sam2.segment_and_track_subject.v1',
    },
    runtimePort,
  }),
  (error: unknown) => Boolean(
    error
    && typeof error === 'object'
    && 'details' in error
    && (error as { details?: { requiredGate?: string } }).details
      ?.requiredGate === 'sam2_historical_only_new_dispatch_blocked',
  ),
)
assert.equal(runtimeInvocations, 0)

console.log(JSON.stringify({
  smoke: 'canonical-sam2-historical-rejection',
  retiredOperationRejectedBeforeRuntime: true,
  runtimeInvocations,
  activeRouterSam2Operations: 0,
}))
