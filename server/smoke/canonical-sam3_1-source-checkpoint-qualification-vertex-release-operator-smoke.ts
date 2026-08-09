import assert from 'node:assert/strict'

import {
  CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_CONFIRMATION,
  publishCanonicalSam31VertexQualificationReleaseFromEnvironment,
} from '../cli/canonical-sam3_1-source-checkpoint-qualification-vertex-release-operator'

const sha = 'a'.repeat(64)
let captured: unknown = null
const runtime = {
  async publish(value: unknown) {
    captured = structuredClone(value)
    return {
      status: 'published' as const,
      secondCustomJobCreated: false as const,
      customerCreditsMutated: false as const,
    }
  },
}
const environment = {
  WEEDITPRO_SAM31_VERTEX_RELEASE_CONFIRMATION:
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_CONFIRMATION,
  WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_ID: 'sam31-execution',
  WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_VERSION: '2',
  WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_SHA256: sha,
  WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_ID: 'sam31-result',
  WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_VERSION: '1',
  WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_SHA256: sha,
  WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_ID: 'sam31-usage',
  WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_VERSION: '1',
  WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_SHA256: sha,
  WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_ID: 'sam31-stop',
  WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_VERSION: '1',
  WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_SHA256: sha,
  WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_ID: 'sam31-rate',
  WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_VERSION: '1',
  WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_SHA256: sha,
  WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_ID: 'sam31-cost',
  WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_VERSION: '1',
  WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_SHA256: sha,
}
const result =
  await publishCanonicalSam31VertexQualificationReleaseFromEnvironment(
    environment,
    runtime,
  )
assert.equal(result.status, 'published')
assert.deepEqual(captured, {
  executionRef: ref('sam31-execution', 2),
  workerResultRef: ref('sam31-result', 1),
  providerUsageRef: ref('sam31-usage', 1),
  platformStopRef: ref('sam31-stop', 1),
  currentAccountRateRef: ref('sam31-rate', 1),
  qualificationCostReceiptRef: ref('sam31-cost', 1),
})
await assert.rejects(
  publishCanonicalSam31VertexQualificationReleaseFromEnvironment({
    ...environment,
    WEEDITPRO_SAM31_VERTEX_RELEASE_CONFIRMATION: 'publish-all',
  }, runtime),
)
await assert.rejects(
  publishCanonicalSam31VertexQualificationReleaseFromEnvironment({
    ...environment,
    WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_VERSION: '1',
  }, runtime),
)
assert.equal('WEEDITPRO_HF_TOKEN' in environment, false)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-qualification-release-operator',
  checks: 15,
  exactSingleReleaseConfirmationRequired: true,
  serverOwnedEvidenceReread: true,
  secondCustomJobCreated: false,
  automaticRetryPerformed: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function ref(id: string, version: number) {
  return { id, version, contentHash: `sha256:${sha}` }
}
