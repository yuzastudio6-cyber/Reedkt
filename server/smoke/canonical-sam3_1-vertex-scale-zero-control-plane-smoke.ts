import assert from 'node:assert/strict'
import type { GoogleAuth } from 'google-auth-library'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import {
  assertCanonicalSam31VertexScaleZeroControlPlaneObservation,
  assertCanonicalSam31VertexScaleZeroControlPlaneSubmission,
  createCanonicalSam31VertexScaleZeroControlPlane,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  createCanonicalSam31VertexScaleZeroFoundationRequests,
  createCanonicalSam31VertexScaleZeroModelDeployRequest,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string, version: number) => ({
  id,
  version,
  contentHash: hash(character),
})
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 5),
  immutableImageRef: ref('sam31-image', 'b', 3),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('b')}`,
  immutableImageDigest: hash('b'),
  sourceCheckpointQualificationRef: ref('sam31-source-checkpoint', 'c', 8),
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 2),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e', 7),
  recordedAt: '2026-08-11T19:00:00.000Z',
})
const [upload, endpoint] =
  createCanonicalSam31VertexScaleZeroFoundationRequests(profile)
const deploy = createCanonicalSam31VertexScaleZeroModelDeployRequest({
  profile,
  modelResourceName:
    'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
})
const requests: unknown[] = []
const responses: unknown[] = [
  { name: 'projects/reeditpro/locations/us-central1/operations/upload-1' },
  { name: 'projects/reeditpro/locations/us-central1/operations/upload-1' },
  {
    name: 'projects/reeditpro/locations/us-central1/operations/upload-1',
    done: true,
    response: {
      model:
        'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
    },
  },
]
const auth = {
  async request(value: unknown) {
    requests.push(value)
    return { data: responses.shift() }
  },
} as unknown as Pick<GoogleAuth, 'request'>
const controlPlane = createCanonicalSam31VertexScaleZeroControlPlane({
  auth,
  now: () => '2026-08-11T19:00:01.000Z',
})
const uploadSubmission = await controlPlane.submitOne(upload)
assert.equal(assertCanonicalSam31VertexScaleZeroControlPlaneSubmission(
  uploadSubmission).disposition, 'submitted')
const pending = await controlPlane.observeOne({
  submission: uploadSubmission,
})
assert.equal(assertCanonicalSam31VertexScaleZeroControlPlaneObservation(
  pending).disposition, 'pending')
const completed = await controlPlane.observeOne({
  submission: uploadSubmission,
})
assert.equal(completed.disposition, 'completed')
assert.equal(completed.modelResourceName,
  'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1')
assert.equal(requests.length, 3)
for (const value of requests as Array<Record<string, unknown>>) {
  assert.equal(value.retry, false)
  assert.equal(value.maxRedirects, 0)
}

let failedCalls = 0
const unknownControlPlane = createCanonicalSam31VertexScaleZeroControlPlane({
  auth: {
    async request() {
      failedCalls += 1
      throw new Error('network outcome unknown')
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  now: () => '2026-08-11T19:00:02.000Z',
})
const unknown = await unknownControlPlane.submitOne(endpoint)
assert.equal(unknown.disposition,
  'outcome_unknown_requires_reconciliation')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(failedCalls, 1)
await assert.rejects(() => unknownControlPlane.observeOne({
  submission: unknown,
}))

let invalidCalls = 0
const invalidControlPlane = createCanonicalSam31VertexScaleZeroControlPlane({
  auth: {
    async request() {
      invalidCalls += 1
      return { data: {} }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
})
await assert.rejects(() => invalidControlPlane.submitOne({
  ...deploy,
  requestDigestSha256: '0'.repeat(64),
}))
assert.equal(invalidCalls, 0)
assert.throws(() => assertCanonicalSam31VertexScaleZeroControlPlaneSubmission({
  ...uploadSubmission,
  submissionHash: '0'.repeat(64),
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroControlPlaneObservation({
  ...completed,
  productionAuthorityGranted: true,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-control-plane',
  checks: 22,
  exactCompiledRequestOnly: true,
  redirectsAndRetriesDisabled: true,
  unknownOutcomeRequiresReconciliation: true,
  invalidRequestProviderCalls: invalidCalls,
  customerRequestOrGpuInferenceStarted: false,
  productionReady: false,
}, null, 2))
