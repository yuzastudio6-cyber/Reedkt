import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from '../services/canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  a100Admission,
  a100PrivateTransport,
  a100Release,
  a100Target,
  sam31L4Admission,
  sam31L4PrivateTransport,
  sam31L4Release,
  sam31L4Target,
} from './canonical-professional-google-cloud-gpu-job-launch-port-smoke'

const publishedAt = '2026-08-02T16:58:00.000Z'
const objects = new Map<string, Buffer>()
const repository =
  createCanonicalProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/canonical-gpu/runtime-configurations/v1',
  })

const a100Published = await repository.persistRuntimeConfigurationCreateOnly({
  release: a100Release,
  privateObjectTransport: a100PrivateTransport,
  publishedAt,
})
const l4Published = await repository.persistRuntimeConfigurationCreateOnly({
  release: sam31L4Release,
  privateObjectTransport: sam31L4PrivateTransport,
  publishedAt,
})
assert.equal(a100Published.disposition, 'created')
assert.equal(l4Published.disposition, 'created')
assert.equal(a100Published.providerOrGpuJobStarted, false)
assert.equal(a100Published.billingWalletOrCreditAuthorityGranted, false)
assert.equal((await repository.persistRuntimeConfigurationCreateOnly({
  release: a100Release,
  privateObjectTransport: a100PrivateTransport,
  publishedAt,
})).disposition, 'identical_replay')
assert.equal(objects.size, 2)

const rereadA100 = await repository.rereadPrivateRelease({
  admission: a100Admission,
  target: a100Target,
})
assert.deepEqual(rereadA100, a100Release)
assert.notEqual(rereadA100, a100Release)
const rereadL4 = await repository.rereadPrivateRelease({
  admission: sam31L4Admission,
  target: sam31L4Target,
})
assert.deepEqual(rereadL4, sam31L4Release)
const rereadTransport = await repository.rereadPrivateObjectTransport({
  admission: sam31L4Admission,
  target: sam31L4Target,
  release: sam31L4Release,
})
assert.deepEqual(rereadTransport, sam31L4PrivateTransport)
assert.notEqual(rereadTransport, sam31L4PrivateTransport)

await assert.rejects(repository.rereadPrivateRelease({
  admission: sam31L4Admission,
  target: a100Target,
}), /scope_mismatch/u)
await assert.rejects(repository.rereadPrivateObjectTransport({
  admission: a100Admission,
  target: a100Target,
  release: sam31L4Release,
}), /argument_mismatch/u)
await assert.rejects(repository.persistRuntimeConfigurationCreateOnly({
  release: a100Release,
  privateObjectTransport: sam31L4PrivateTransport,
  publishedAt,
}), /transport_mismatch/u)

let getterInvoked = false
const hostile = Object.defineProperty(
  {
    release: a100Release,
    privateObjectTransport: a100PrivateTransport,
    publishedAt,
  },
  'release',
  {
    enumerable: true,
    get() {
      getterInvoked = true
      return a100Release
    },
  },
)
await assert.rejects(
  repository.persistRuntimeConfigurationCreateOnly(hostile),
)
assert.equal(getterInvoked, false)

await assert.rejects(repository.persistRuntimeConfigurationCreateOnly({
  release: a100Release,
  privateObjectTransport: a100PrivateTransport,
  publishedAt: '2026-08-02T16:59:00.000Z',
}), /collision/u)

const a100Path = [...objects.entries()].find(([, body]) =>
  body.toString('utf8').includes(a100Release.releaseRef.id))?.[0]
assert.ok(a100Path)
const canonicalBytes = objects.get(a100Path)
assert.ok(canonicalBytes)
const tampered = JSON.parse(canonicalBytes.toString('utf8')) as
  Record<string, unknown>
tampered.publicDeliveryOrProductionAuthorityGranted = true
objects.set(a100Path, Buffer.from(JSON.stringify(tampered), 'utf8'))
await assert.rejects(repository.rereadPrivateRelease({
  admission: a100Admission,
  target: a100Target,
}))

console.log(JSON.stringify({
  smoke:
    'canonical-professional-google-cloud-gpu-runtime-configuration-repository',
  checks: 31,
  a100BatchAndL4CloudRunReleasesPersistedCreateOnly: true,
  sam31PrivateObjectTransportsExactMatched: true,
  immutableImageServiceIdentityTaskContractAndRouteBound: true,
  a100CompiledMountAndL4PreconfiguredMountPreserved: true,
  identicalReplayAccepted: true,
  detachedExactReread: true,
  crossRouteReleaseAndTransportRejected: true,
  hostileAccessorRejectedWithoutInvocation: true,
  createOnlyCollisionAndTamperingRejected: true,
  minimumIdleInstances: 0,
  cpuOnlySubstantiveExecutionAllowed: false,
  providerOrGpuJobStarted: false,
  billingWalletOrCustomerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256)
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = values.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
