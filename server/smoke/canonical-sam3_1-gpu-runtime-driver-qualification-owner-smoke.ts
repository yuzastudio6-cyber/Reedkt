import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
import {
  createCanonicalSam31GpuRuntimeDriverQualificationOwner,
  createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPort,
  type CanonicalSam31GpuRuntimeDriverQualificationReadPort,
} from '../services/canonical-sam3_1-gpu-runtime-driver-qualification-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import { stableAuthorityStringify } from '../services/private-edit-authority-store'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  canonicalSam31A100LaunchFixture,
  canonicalSam31A100ResultAdmissionFixture,
  canonicalSam31A100RuntimeResponseFixture,
  canonicalSam31A100TaskFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const taskRef = ref(
  canonicalSam31A100TaskFixture.taskId,
  canonicalSam31A100TaskFixture.taskRecordHash,
)
const launchRef = ref(
  canonicalSam31A100LaunchFixture.launchRecordId,
  canonicalSam31A100LaunchFixture.launchHash,
)
const resultAdmissionRef = ref(
  canonicalSam31A100ResultAdmissionFixture.resultAdmissionId,
  canonicalSam31A100ResultAdmissionFixture.resultAdmissionHash,
)
const runtimeResponseObjectRef =
  canonicalSam31A100ResultAdmissionFixture.runtimeResponseObjectRef
const request = {
  componentId: 'sam31-a100-driver-component',
  qualificationId: 'sam31-a100-runtime-qualification',
  invocationId: canonicalSam31A100TaskFixture.invocationId,
  taskRef,
  launchRef,
  resultAdmissionRef,
  runtimeResponseObjectRef,
}

const objects = new Map<string, Buffer>()
const componentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: memoryObjectPort(objects),
  })
const readPort = fixtureReadPort()
const owner = createCanonicalSam31GpuRuntimeDriverQualificationOwner({
  readPort,
  componentRepository,
  now: () => '2026-08-04T17:00:00.000Z',
})
const component = await owner.compileAndPersistDriverQualificationComponent(
  request,
)
assert.equal(component.componentKind, 'driver_and_cuda')
assert.equal(component.route.routeId, 'a100_80gb_heavy_primary')
assert.equal(component.route.accelerator, 'nvidia_a100_80gb')
assert.equal(component.route.machineType, 'a2-ultragpu-1g')
assert.equal(
  component.immutableImageDigest,
  canonicalSam31A100LaunchFixture.immutableImageDigest,
)
assert.equal(
  component.payload.observedNvidiaDriverVersion,
  canonicalSam31A100RuntimeResponseFixture.gpuEvidence
    ?.observedNvidiaDriverVersion,
)
assert.equal(
  component.payload.loadedCudaDriverLibraryPathDigestSha256,
  canonicalSam31A100RuntimeResponseFixture.gpuEvidence
    ?.observedCudaDriverLibraryPathDigestSha256,
)
assert.deepEqual(
  component.payload.cudaDriverRuntimeQualificationRef,
  resultAdmissionRef,
)
const replay = await owner.compileAndPersistDriverQualificationComponent(
  request,
)
assert.deepEqual(replay, component)
assert.equal(objects.size, 1)

const wiredObjects = new Map<string, Buffer>()
const wiredObjectPort = memoryObjectPort(wiredObjects)
const wiredTaskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: wiredObjectPort,
})
const wiredResultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort: wiredObjectPort,
})
const wiredLifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort: wiredObjectPort,
})
await wiredTaskStore.persistTaskCreateOnly(canonicalSam31A100TaskFixture)
await wiredLifecycleStore.createLaunchRecordOnly({
  record: canonicalSam31A100LaunchFixture,
})
await wiredResultStore.persistResultAdmissionCreateOnly(
  canonicalSam31A100ResultAdmissionFixture,
)
const responseBytes = Buffer.from(
  stableAuthorityStringify(canonicalSam31A100RuntimeResponseFixture),
  'utf8',
)
await wiredObjectPort.createOnly({
  objectPath:
    `private/canonical-professional-gpu/sam3_1/v1/invocations/${request.invocationId}/response.json`,
  body: responseBytes,
  contentSha256: createHash('sha256').update(responseBytes).digest('hex'),
})
const wiredOwner =
  createCanonicalSam31GpuRuntimeDriverQualificationOwnerFromObjectPort({
    objectPort: wiredObjectPort,
    now: () => '2026-08-04T17:01:00.000Z',
  })
const wiredComponent = await wiredOwner
  .compileAndPersistDriverQualificationComponent({
    ...request,
    componentId: 'sam31-a100-driver-component-wired',
  })
assert.equal(wiredComponent.componentKind, 'driver_and_cuda')
assert.equal(wiredComponent.route.routeId, 'a100_80gb_heavy_primary')

await assert.rejects(() => ownerWith({
  ...readPort,
  async rereadLaunch() { return null },
}).compileAndPersistDriverQualificationComponent(request))

const tamperedResponse = structuredClone(
  canonicalSam31A100RuntimeResponseFixture,
)
assert(tamperedResponse.gpuEvidence)
tamperedResponse.gpuEvidence.observedNvidiaDriverVersion = '569.0'
await assert.rejects(() => ownerWith({
  ...readPort,
  async rereadRuntimeResponse() { return tamperedResponse },
}).compileAndPersistDriverQualificationComponent(request))

const crossedLaunch = structuredClone(canonicalSam31A100LaunchFixture)
crossedLaunch.runtimeRegion = 'europe-west4'
await assert.rejects(() => ownerWith({
  ...readPort,
  async rereadLaunch() { return crossedLaunch },
}).compileAndPersistDriverQualificationComponent(request))

await assert.rejects(() => owner.compileAndPersistDriverQualificationComponent({
  ...request,
  resultAdmissionRef: ref('other-result', '0'.repeat(64)),
}))
await assert.rejects(() => owner.compileAndPersistDriverQualificationComponent({
  ...request,
  callerQualified: true,
}))
let getterInvoked = false
const accessorRequest = Object.defineProperty({}, 'componentId', {
  enumerable: true,
  get() {
    getterInvoked = true
    return request.componentId
  },
})
await assert.rejects(() =>
  owner.compileAndPersistDriverQualificationComponent(accessorRequest))
assert.equal(getterInvoked, false)
const cyclic: Record<string, unknown> = { ...request }
cyclic.self = cyclic
await assert.rejects(() => owner.compileAndPersistDriverQualificationComponent(
  cyclic,
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-driver-qualification-owner',
  checks: 23,
  exactTaskLaunchResultAndResponseReread: true,
  exactDriverAndCudaLibraryEvidenceCompiled: true,
  immutableImageAndA100RouteBound: true,
  accountEffectiveCostAndScaleZeroResultRequired: true,
  createOnlyComponentPersistenceAndExactReread: true,
  durableCanonicalStoreFactoryWired: true,
  callerQualificationClaimsAccepted: false,
  liveGpuJobStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

function fixtureReadPort():
CanonicalSam31GpuRuntimeDriverQualificationReadPort {
  return {
    async rereadTask({ taskRef: received }) {
      return sameRef(received, taskRef)
        ? structuredClone(canonicalSam31A100TaskFixture)
        : null
    },
    async rereadLaunch({ launchRef: received }) {
      return sameRef(received, launchRef)
        ? structuredClone(canonicalSam31A100LaunchFixture)
        : null
    },
    async rereadResultAdmission({ resultAdmissionRef: received }) {
      return sameRef(received, resultAdmissionRef)
        ? structuredClone(canonicalSam31A100ResultAdmissionFixture)
        : null
    },
    async rereadRuntimeResponse({ runtimeResponseObjectRef: received }) {
      return sameRef(received, runtimeResponseObjectRef)
        ? structuredClone(canonicalSam31A100RuntimeResponseFixture)
        : null
    },
  }
}

function ownerWith(
  alteredReadPort: CanonicalSam31GpuRuntimeDriverQualificationReadPort,
) {
  return createCanonicalSam31GpuRuntimeDriverQualificationOwner({
    readPort: alteredReadPort,
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: memoryObjectPort(new Map()),
      }),
    now: () => '2026-08-04T17:00:00.000Z',
  })
}

function ref(id: string, hash: string) {
  return { id, version: 1 as const, contentHash: `sha256:${hash}` as const }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        input.contentSha256,
        createHash('sha256').update(input.body).digest('hex'),
      )
      if (storage.has(input.objectPath)) return 'already_exists'
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const body = storage.get(path)
      return body ? Buffer.from(body) : null
    },
  }
}
