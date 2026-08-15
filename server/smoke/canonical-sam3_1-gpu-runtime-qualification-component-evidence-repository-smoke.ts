import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  compilationRequest,
  deterministicComponent,
  driverComponent,
  performanceComponent,
  qualityComponent,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  qualificationEvidence,
} from './canonical-sam3_1-gpu-runtime-release-smoke'

const componentStore = objectPort()
const componentRepository =
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: componentStore.port,
    prefix: 'private/smoke/sam3_1/runtime-qualification/components/v1',
  })
const componentRecords = [
  driverComponent,
  deterministicComponent,
  performanceComponent,
  qualityComponent,
]

const componentRefs = await Promise.all(componentRecords.map(
  (componentEvidence) =>
    componentRepository.persistComponentEvidenceCreateOnly({
      componentEvidence,
    }),
))
assert.equal(componentStore.records.size, 4)
for (const [index, component] of componentRecords.entries()) {
  assert.deepEqual(
    componentRefs[index],
    canonicalSam31GpuRuntimeQualificationComponentRef(component),
  )
  assert.deepEqual(
    await componentRepository.rereadComponentEvidence({
      componentEvidenceRef: componentRefs[index],
    }),
    component,
  )
}

await Promise.all(componentRecords.map((componentEvidence) =>
  componentRepository.persistComponentEvidenceCreateOnly({
    componentEvidence,
  })))
assert.equal(componentStore.records.size, 4)

assert.equal(
  await componentRepository.rereadComponentEvidence({
    componentEvidenceRef: {
      id: 'missing-sam31-qualification-component',
      version: 1,
      contentHash: `sha256:${'a'.repeat(64)}`,
    },
  }),
  null,
)
await assert.rejects(componentRepository.rereadComponentEvidence({
  componentEvidenceRef: componentRefs[0],
  callerQualified: true,
} as never))

const cyclic: Record<string, unknown> = {
  componentEvidenceRef: componentRefs[0],
}
cyclic.self = cyclic
await assert.rejects(componentRepository.rereadComponentEvidence(
  cyclic as never,
))

let getterInvoked = false
const accessorRequest = {
  componentEvidenceRef: componentRefs[0],
}
Object.defineProperty(accessorRequest, 'hidden', {
  enumerable: true,
  get() {
    getterInvoked = true
    return true
  },
})
await assert.rejects(
  componentRepository.rereadComponentEvidence(accessorRequest),
)
assert.equal(getterInvoked, false)

const driverPath = [...componentStore.records.keys()].find((path) =>
  path.includes('/driver_and_cuda/'))
if (!driverPath) throw new Error('Driver component path is unavailable.')
const canonicalDriverBody = componentStore.records.get(driverPath)
if (!canonicalDriverBody) throw new Error('Driver component body is unavailable.')
componentStore.records.set(
  driverPath,
  Buffer.concat([canonicalDriverBody, Buffer.from(' ')]),
)
await assert.rejects(componentRepository.rereadComponentEvidence({
  componentEvidenceRef: componentRefs[0],
}))
componentStore.records.set(driverPath, canonicalDriverBody)

const qualificationStore = objectPort()
const qualificationRepository =
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: qualificationStore.port,
    prefix: 'private/smoke/sam3_1/runtime-qualification/evidence/v1',
  })
await qualificationRepository.persistQualifiedEvidenceCreateOnly({
  evidence: qualificationEvidence,
})
const authorityStore = objectPort()
const compilationOwner =
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner({
    readPort: {
      rereadQualificationEvidence({ qualificationEvidenceRef }) {
        return qualificationRepository.rereadQualifiedEvidence({
          qualificationEvidenceRef,
        })
      },
      rereadComponentEvidence({ componentEvidenceRef }) {
        return componentRepository.rereadComponentEvidence({
          componentEvidenceRef,
        })
      },
    },
    authorityObjectPort: authorityStore.port,
  })
const compiled = await compilationOwner.compileAndPersist({
  ...compilationRequest,
  authorityId: 'sam31-durable-component-compilation-authority',
})
const compiledRef =
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(compiled)
assert.deepEqual(
  compiled.qualificationEvidenceRef,
  canonicalSam31GpuRuntimeQualificationEvidenceRef(qualificationEvidence),
)
assert.deepEqual(
  await compilationOwner.rereadQualificationCompilationAuthority({
    authorityRef: compiledRef,
  }),
  compiled,
)
assert.equal(compiled.exactQualificationAndFourComponentRecordsReread, true)
assert.equal(compiled.exactComponentPayloadsMatchedQualificationEvidence, true)
assert.equal(compiled.callerSuppliedQualificationBooleansAccepted, false)
assert.equal(compiled.runtimeReleaseGranted, false)
assert.equal(compiled.gpuJobDispatched, false)
assert.equal(compiled.customerCreditsMutated, false)
assert.equal(compiled.productionAuthorityGranted, false)
assert.throws(() =>
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: {} as CanonicalCreateOnlyJsonObjectPort,
  }))

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository',
  checks: 28,
  componentRecordsPersistedCreateOnly: 4,
  exactComponentRecordsReread: 4,
  canonicalCompilationUsedDurableRepositories: true,
  callerSuppliedQualificationBooleansAccepted: false,
  liveGpuJobStarted: false,
  modelCheckpointDownloaded: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function objectPort(): {
  readonly port: CanonicalCreateOnlyJsonObjectPort
  readonly records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const previous = records.get(input.objectPath)
        if (previous) {
          if (!previous.equals(input.body)) {
            throw new Error('create-only component collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const value = records.get(objectPath)
        return value ? Buffer.from(value) : null
      },
    },
  }
}
