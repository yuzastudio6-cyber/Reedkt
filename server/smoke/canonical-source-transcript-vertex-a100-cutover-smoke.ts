import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const runtime = readFileSync(
  'server/visual-intelligence/visual-intelligence-production-runtime.ts',
  'utf8',
)
const attemptOwner = readFileSync(
  'server/services/canonical-source-transcript-a100-attempt-owner.ts',
  'utf8',
)

assert.doesNotMatch(
  runtime,
  /canonical-a100-batch-job-invocation-service|createGoogleBatchA100JobInvocationPort/u,
)
assert.match(runtime, /sourceTranscriptVertexA100InvocationPort/u)
assert.match(
  runtime,
  /source_transcript_vertex_a100_invocation_port_not_ready/u,
)
assert.match(
  runtime,
  /google_cloud_vertex_custom_job_a2_ultra/u,
)
assert.match(
  attemptOwner,
  /canonical-source-transcript-vertex-a100-invocation-port-v1/u,
)
assert.match(attemptOwner, /historicalBatchExecutionAllowed: false/u)

console.log(JSON.stringify({
  qualification: 'canonical-source-transcript-vertex-a100-cutover-v1',
  activeBatchLaunchMounted: false,
  unqualifiedVertexPortFailsClosed: true,
  vertexPortContractFrozen: true,
  vertexPortImplementationMounted: false,
  sourceTranscriptPrivateInternalReady: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2))
