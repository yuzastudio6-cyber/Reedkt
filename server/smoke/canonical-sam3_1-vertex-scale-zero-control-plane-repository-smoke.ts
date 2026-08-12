import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import type { GoogleAuth } from 'google-auth-library'

import {
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31VertexScaleZeroControlPlane,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane'
import {
  createCanonicalSam31VertexScaleZeroControlPlaneRepository,
} from '../services/canonical-sam3_1-vertex-scale-zero-control-plane-repository'
import {
  createCanonicalSam31VertexScaleZeroFoundationRequests,
} from '../services/canonical-sam3_1-vertex-scale-zero-deployment-request-compiler'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string, version: number) => ({
  id, version, contentHash: hash(character),
})
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a', 5),
  runtimeReleaseRef: ref('sam31-a100-runtime-release', 'f', 4),
  immutableImageRef: ref('sam31-image', 'b', 3),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('b')}`,
  immutableImageDigest: hash('b'),
  sourceCheckpointQualificationRef: ref('sam31-source-checkpoint', 'c', 8),
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd', 2),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e', 7),
  recordedAt: '2026-08-11T20:00:00.000Z',
})
const [upload] = createCanonicalSam31VertexScaleZeroFoundationRequests(profile)
const controlPlane = createCanonicalSam31VertexScaleZeroControlPlane({
  auth: {
    async request(value: { readonly method?: string }) {
      if (value.method === 'POST') return { data: {
        name: 'projects/reeditpro/locations/us-central1/operations/upload-2',
      } }
      return { data: {
        name: 'projects/reeditpro/locations/us-central1/operations/upload-2',
        done: true,
        response: {
          model:
            'projects/reeditpro/locations/us-central1/models/weeditpro-sam31-a100-scale-zero-v1',
        },
      } }
    },
  } as unknown as Pick<GoogleAuth, 'request'>,
  now: () => '2026-08-11T20:00:01.000Z',
})
const submission = await controlPlane.submitOne(upload)
const observation = await controlPlane.observeOne({ submission })

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256)
    const existing = objects.get(input.objectPath)
    if (existing) {
      assert.equal(existing.equals(input.body), true)
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
const repository = createCanonicalSam31VertexScaleZeroControlPlaneRepository({
  objectPort,
  prefix: 'private/smoke/sam31-scale-zero-control-plane',
})
const requestRef = await repository.persistRequest(upload)
assert.deepEqual(await repository.rereadRequest(requestRef), upload)
const submissionRef = await repository.persistSubmission({
  requestRef, submission,
})
assert.deepEqual(await repository.rereadSubmission(submissionRef), submission)
const observationRef = await repository.persistObservation({
  submissionRef, observation,
})
assert.deepEqual(await repository.rereadObservation(observationRef), observation)
assert.deepEqual(await repository.persistRequest(upload), requestRef)
assert.deepEqual(await repository.persistSubmission({ requestRef, submission }),
  submissionRef)
assert.deepEqual(await repository.persistObservation({
  submissionRef, observation,
}), observationRef)
assert.equal(objects.size, 3)

await assert.rejects(() => repository.persistSubmission({
  requestRef: { ...requestRef, contentHash: hash('f') },
  submission,
}))
await assert.rejects(() => repository.persistObservation({
  submissionRef: { ...submissionRef, contentHash: hash('f') },
  observation,
}))
const firstPath = [...objects.keys()][0]
if (!firstPath) throw new Error('fixture object path missing')
objects.set(firstPath, Buffer.from('{}'))
await assert.rejects(() => repository.rereadRequest(requestRef))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-control-plane-repository',
  checks: 18,
  createOnlyExactReread: true,
  requestSubmissionObservationLineage: true,
  restartSafe: true,
  crossLineageRejected: true,
  customerRequestOrGpuInferenceStarted: false,
  productionReady: false,
}, null, 2))
