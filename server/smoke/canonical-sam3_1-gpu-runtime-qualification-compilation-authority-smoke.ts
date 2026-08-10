import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority,
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceDigest,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  prepareCanonicalSam31GpuRuntimeRelease,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-release'
import {
  canonicalSam31SourceCheckpointQualificationRef,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { qualificationEvidence } from
  './canonical-sam3_1-gpu-runtime-release-smoke'
import {
  candidate as canonicalCandidate,
  canonicalIngest,
  canonicalQualification,
} from './canonical-sam3_1-cloud-image-build-smoke'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'

const qualificationEvidenceRef =
  canonicalSam31GpuRuntimeQualificationEvidenceRef(qualificationEvidence)
export const driverComponent = component(
  'sam31-a100-driver-component',
  'driver_and_cuda',
  qualificationEvidence.driverEvidence,
)
export const deterministicComponent = component(
  'sam31-a100-deterministic-run-set',
  'deterministic_run_set',
  qualificationEvidence.deterministicRuns,
)
export const performanceComponent = component(
  'sam31-a100-eight-minute-performance',
  'eight_minute_performance',
  qualificationEvidence.performanceEvidence,
)
export const qualityComponent = component(
  'sam31-a100-independent-temporal-quality',
  'independent_temporal_quality',
  qualificationEvidence.qualityEvidence,
)
const components = new Map([
  entry(driverComponent),
  entry(deterministicComponent),
  entry(performanceComponent),
  entry(qualityComponent),
])
const authorityStore = objectPort()
export const compilationRequest = {
  authorityId: 'sam31-a100-runtime-qualification-compilation',
  qualificationEvidenceRef,
  componentEvidenceRefs: {
    driverAndCudaRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(driverComponent),
    deterministicRunSetRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(deterministicComponent),
    eightMinutePerformanceRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(performanceComponent),
    independentTemporalQualityRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(qualityComponent),
  },
}
const owner = createOwner({}, authorityStore.port)
export const compilationAuthority = await owner.compileAndPersist(
  compilationRequest,
)

assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(
  compilationAuthority,
)
assert.equal(
  compilationAuthority.status,
  'qualified_evidence_compilation_verified',
)
assert.equal(
  compilationAuthority.exactQualificationAndFourComponentRecordsReread,
  true,
)
assert.equal(
  compilationAuthority.exactComponentPayloadsMatchedQualificationEvidence,
  true,
)
assert.equal(
  compilationAuthority.callerSuppliedQualificationBooleansAccepted,
  false,
)
assert.equal(compilationAuthority.runtimeReleaseGranted, false)
assert.equal(compilationAuthority.gpuJobDispatched, false)
assert.equal(compilationAuthority.customerCreditsMutated, false)
assert.equal(compilationAuthority.productionAuthorityGranted, false)
assert.equal(authorityStore.records.size, 1)

const authorityRef =
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
    compilationAuthority,
  )
assert.equal(
  (await owner.rereadQualificationCompilationAuthority({ authorityRef }))
    ?.authorityHash,
  compilationAuthority.authorityHash,
)
assert.deepEqual(
  await owner.compileAndPersist(compilationRequest),
  compilationAuthority,
)
assert.equal(authorityStore.records.size, 1)

await assert.rejects(createOwner({ missingQualification: true })
  .compileAndPersist(compilationRequest))
await assert.rejects(createOwner({
  missingComponentRef:
    compilationRequest.componentEvidenceRefs.deterministicRunSetRef,
}).compileAndPersist(compilationRequest))

const crossedRoute = structuredClone(deterministicComponent)
crossedRoute.route = {
  routeId: 'l4_heavy_fallback',
  gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
  runtimeRegion: 'europe-west4',
  executionTarget: 'google_cloud_run_l4_job',
  machineType: 'cloud_run_nvidia_l4',
  accelerator: 'nvidia_l4',
}
crossedRoute.componentHash = componentDigest(crossedRoute)
await assert.rejects(createOwner({ replacementComponent: crossedRoute })
  .compileAndPersist({
    ...compilationRequest,
    componentEvidenceRefs: {
      ...compilationRequest.componentEvidenceRefs,
      deterministicRunSetRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(crossedRoute),
    },
  }))

if (performanceComponent.componentKind !== 'eight_minute_performance') {
  throw new Error('Performance component kind changed.')
}
const changedPayload = structuredClone(performanceComponent)
changedPayload.payload.measurements[0].wallTimeMilliseconds += 1
changedPayload.componentHash = componentDigest(changedPayload)
await assert.rejects(createOwner({ replacementComponent: changedPayload })
  .compileAndPersist({
    ...compilationRequest,
    componentEvidenceRefs: {
      ...compilationRequest.componentEvidenceRefs,
      eightMinutePerformanceRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(changedPayload),
    },
  }))

const futureDriver = structuredClone(driverComponent)
futureDriver.recordedAt = '2026-08-04T18:22:01.000Z'
futureDriver.componentHash = componentDigest(futureDriver)
await assert.rejects(createOwner({ replacementComponent: futureDriver })
  .compileAndPersist({
    ...compilationRequest,
    componentEvidenceRefs: {
      ...compilationRequest.componentEvidenceRefs,
      driverAndCudaRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(futureDriver),
    },
  }))

await assert.rejects(owner.compileAndPersist({
  ...compilationRequest,
  callerQualified: true,
}))
const cyclic: Record<string, unknown> = { ...compilationRequest }
cyclic.self = cyclic
await assert.rejects(owner.compileAndPersist(cyclic))

let getterInvoked = false
const accessorRequest = { ...compilationRequest }
Object.defineProperty(accessorRequest, 'hidden', {
  enumerable: true,
  get() {
    getterInvoked = true
    return true
  },
})
await assert.rejects(owner.compileAndPersist(accessorRequest))
assert.equal(getterInvoked, false)

const tamperedAuthority = structuredClone(compilationAuthority)
tamperedAuthority.callerSuppliedQualificationBooleansAccepted = true as never
assert.throws(() =>
  assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(
    tamperedAuthority,
  ))
assert.equal(
  await owner.rereadQualificationCompilationAuthority({
    authorityRef: {
      ...authorityRef,
      id: 'missing-sam31-qualification-compilation-authority',
    },
  }),
  null,
)

export const canonicalEvidence = createCanonicalQualificationEvidence()
const canonicalEvidenceRef =
  canonicalSam31GpuRuntimeQualificationEvidenceRef(canonicalEvidence)
export const canonicalDriver = component(
  'sam31-canonical-a100-driver-component',
  'driver_and_cuda',
  canonicalEvidence.driverEvidence,
  canonicalEvidence,
)
export const canonicalDeterministic = component(
  'sam31-canonical-a100-deterministic-run-set',
  'deterministic_run_set',
  canonicalEvidence.deterministicRuns,
  canonicalEvidence,
)
export const canonicalPerformance = component(
  'sam31-canonical-a100-eight-minute-performance',
  'eight_minute_performance',
  canonicalEvidence.performanceEvidence,
  canonicalEvidence,
)
export const canonicalQuality = component(
  'sam31-canonical-a100-independent-temporal-quality',
  'independent_temporal_quality',
  canonicalEvidence.qualityEvidence,
  canonicalEvidence,
)
const canonicalComponents = new Map([
  entry(canonicalDriver),
  entry(canonicalDeterministic),
  entry(canonicalPerformance),
  entry(canonicalQuality),
])
const canonicalAuthorityStore = objectPort()
export const canonicalOwner = createOwner(
  {},
  canonicalAuthorityStore.port,
  canonicalEvidence,
  canonicalComponents,
)
export const canonicalAuthority = await canonicalOwner.compileAndPersist({
  authorityId: 'sam31-canonical-a100-runtime-qualification-compilation',
  qualificationEvidenceRef: canonicalEvidenceRef,
  componentEvidenceRefs: {
    driverAndCudaRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalDriver),
    deterministicRunSetRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(
        canonicalDeterministic,
      ),
    eightMinutePerformanceRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalPerformance),
    independentTemporalQualityRef:
      canonicalSam31GpuRuntimeQualificationComponentRef(canonicalQuality),
  },
})
export const canonicalAuthorityRef =
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
    canonicalAuthority,
  )
const qualificationStore = objectPort()
export const qualificationRepository =
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: qualificationStore.port,
    prefix: 'private/smoke/sam3_1/compiled-runtime-qualification/v1',
  })
await qualificationRepository.persistQualifiedEvidenceCreateOnly({
  evidence: canonicalEvidence,
})
const imageSupplyChainReleaseRef = ref(
  qualifiedSupplyChain.releaseId,
  qualifiedSupplyChain.releaseHash,
)
export const released = await prepareCanonicalSam31GpuRuntimeRelease({
  candidate: canonicalCandidate,
  ingestReceipt: canonicalIngest,
  sourceCheckpointQualification: canonicalQualification,
  imageSupplyChainRelease: qualifiedSupplyChain,
  release: {
    evidenceClass: 'canonical_private_reread',
    releaseId: 'sam31-compiled-a100-runtime-release',
    releaseVersion: 1,
    route: {
      ...canonicalEvidence.route,
      allocatedVcpuCount: 12,
      allocatedMemoryGiB: 170,
      allocatedLocalScratchGiB: 0,
    },
    serviceIdentityRef: canonicalEvidence.serviceIdentityRef,
    immutableImageRef: canonicalEvidence.immutableImageRef,
    immutableImageDigest: canonicalEvidence.immutableImageDigest,
    sourceAndDependencyClosureRef:
      qualifiedSupplyChain.sourceAndDependencyClosureRef,
    sbomRef: qualifiedSupplyChain.sbom.artifactRef,
    imageScanAndSignatureRef: imageSupplyChainReleaseRef,
    scaleToZeroConfigurationRef:
      canonicalEvidence.scaleToZeroConfigurationRef,
    privateNetworkAndArtifactTransportRef:
      canonicalEvidence.privateNetworkAndArtifactTransportRef,
    qualifiedAt: canonicalEvidence.qualifiedAt,
    expiresAt: '2026-09-04T18:22:00.000Z',
  },
  qualificationEvidenceRef: canonicalEvidenceRef,
  qualificationEvidenceReadPort: qualificationRepository,
  qualificationCompilationAuthorityRef: canonicalAuthorityRef,
  qualificationCompilationAuthorityReadPort: canonicalOwner,
})
assert.equal(released.observation.status, 'private_internal_qualified')
assert.deepEqual(
  released.observation.qualification.substantiveGpuExecutionQualificationRef,
  canonicalAuthorityRef,
)
assert.deepEqual(
  released.runtimeRelease.substantiveGpuExecutionQualificationRef,
  canonicalAuthorityRef,
)
await assert.rejects(prepareCanonicalSam31GpuRuntimeRelease({
  candidate: canonicalCandidate,
  ingestReceipt: canonicalIngest,
  sourceCheckpointQualification: canonicalQualification,
  imageSupplyChainRelease: qualifiedSupplyChain,
  release: {
    evidenceClass: 'canonical_private_reread',
    releaseId: 'sam31-missing-compilation-authority-release',
    releaseVersion: 1,
    route: {
      ...canonicalEvidence.route,
      allocatedVcpuCount: 12,
      allocatedMemoryGiB: 170,
      allocatedLocalScratchGiB: 0,
    },
    serviceIdentityRef: canonicalEvidence.serviceIdentityRef,
    immutableImageRef: canonicalEvidence.immutableImageRef,
    immutableImageDigest: canonicalEvidence.immutableImageDigest,
    sourceAndDependencyClosureRef:
      qualifiedSupplyChain.sourceAndDependencyClosureRef,
    sbomRef: qualifiedSupplyChain.sbom.artifactRef,
    imageScanAndSignatureRef: imageSupplyChainReleaseRef,
    scaleToZeroConfigurationRef:
      canonicalEvidence.scaleToZeroConfigurationRef,
    privateNetworkAndArtifactTransportRef:
      canonicalEvidence.privateNetworkAndArtifactTransportRef,
    qualifiedAt: canonicalEvidence.qualifiedAt,
    expiresAt: '2026-09-04T18:22:00.000Z',
  },
  qualificationEvidenceRef: canonicalEvidenceRef,
  qualificationEvidenceReadPort: qualificationRepository,
  qualificationCompilationAuthorityRef: {
    ...canonicalAuthorityRef,
    id: 'missing-sam31-compilation-authority',
  },
  qualificationCompilationAuthorityReadPort: canonicalOwner,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-qualification-compilation-authority',
  checks: 35,
  exactQualificationEvidenceReread: true,
  exactFourComponentEvidenceRereads: true,
  runtimeReleaseRequiresCompilationAuthority: true,
  callerSuppliedQualificationBooleansAccepted: false,
  sourceFixtureReleaseGatePassed: true,
  liveRuntimeReleaseGranted: false,
  runtimeExecuted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

type Overrides = {
  missingQualification?: boolean
  missingComponentRef?: { id: string; version: 1; contentHash: string }
  replacementComponent?: CanonicalSam31GpuRuntimeQualificationComponentEvidence
}

function createOwner(
  overrides: Overrides = {},
  store = objectPort().port,
  evidence = qualificationEvidence,
  componentRecords = components,
) {
  return createCanonicalSam31GpuRuntimeQualificationCompilationOwner({
    readPort: {
      async rereadQualificationEvidence() {
        return overrides.missingQualification
          ? null
          : structuredClone(evidence)
      },
      async rereadComponentEvidence({ componentEvidenceRef }) {
        if (overrides.missingComponentRef
          && refKey(overrides.missingComponentRef) === refKey(
            componentEvidenceRef,
          )) return null
        if (overrides.replacementComponent) {
          const replacementRef =
            canonicalSam31GpuRuntimeQualificationComponentRef(
              overrides.replacementComponent,
            )
          if (refKey(replacementRef) === refKey(componentEvidenceRef)) {
            return structuredClone(overrides.replacementComponent)
          }
        }
        const value = componentRecords.get(refKey(componentEvidenceRef))
        return value ? structuredClone(value) : null
      },
    },
    authorityObjectPort: store,
  })
}

function component(
  componentId: string,
  componentKind:
    CanonicalSam31GpuRuntimeQualificationComponentEvidence['componentKind'],
  payload: unknown,
  evidence = qualificationEvidence,
): CanonicalSam31GpuRuntimeQualificationComponentEvidence {
  const withoutHash = {
    schemaVersion:
      'canonical-sam3_1-gpu-runtime-qualification-component-evidence-v2' as const,
    source:
      'canonical_sam3_1_gpu_runtime_qualification_component_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'component_evidence_ready' as const,
    componentId,
    componentVersion: 1 as const,
    qualificationId: evidence.qualificationId,
    route: evidence.route,
    immutableImageDigest: evidence.immutableImageDigest,
    componentKind,
    payload,
    recordedAt: evidence.qualifiedAt,
  }
  return assertCanonicalSam31GpuRuntimeQualificationComponentEvidence({
    ...withoutHash,
    componentHash: sha256AuthorityValue(withoutHash),
  })
}

function componentDigest(
  value: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
): string {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone.componentHash
  return sha256AuthorityValue(clone)
}

function entry(
  value: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
) {
  return [refKey(canonicalSam31GpuRuntimeQualificationComponentRef(value)),
    value] as const
}

function createCanonicalQualificationEvidence() {
  const clone = structuredClone(qualificationEvidence)
  const payload = clone as Omit<typeof qualificationEvidence, 'evidenceHash'> & {
    evidenceHash?: string
  }
  delete payload.evidenceHash
  payload.qualificationId = 'sam31-canonical-a100-runtime-qualification'
  payload.candidateRef = {
    schemaVersion: canonicalCandidate.schemaVersion,
    candidateHash: canonicalCandidate.candidateHash,
  }
  payload.privateArtifactIngestReceiptRef = {
    id: canonicalIngest.ingestReceiptId,
    version: canonicalIngest.ingestReceiptVersion,
    contentHash: `sha256:${canonicalIngest.ingestReceiptHash}`,
  }
  payload.sourceCheckpointCompatibilityQualificationRef =
    canonicalSam31SourceCheckpointQualificationRef(canonicalQualification)
  payload.imageSupplyChainReleaseRef = ref(
    qualifiedSupplyChain.releaseId,
    qualifiedSupplyChain.releaseHash,
  )
  payload.serviceIdentityRef = ref('sam31-canonical-a100-service-identity')
  payload.immutableImageRef = qualifiedSupplyChain.immutableImageRef
  payload.immutableImageDigest = qualifiedSupplyChain.immutableImageDigest
  payload.scaleToZeroConfigurationRef =
    ref('sam31-canonical-a100-scale-to-zero')
  payload.privateNetworkAndArtifactTransportRef =
    ref('sam31-canonical-a100-private-network')
  payload.deterministicRuns = payload.deterministicRuns.map((run) => ({
    ...run,
    immutableImageDigest: payload.immutableImageDigest,
  }))
  payload.qualifiedAt = '2026-08-04T18:22:00.000Z'
  return assertCanonicalSam31GpuRuntimeQualificationEvidence({
    ...payload,
    evidenceHash: canonicalSam31GpuRuntimeQualificationEvidenceDigest(payload),
  })
}

function objectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (!prior.equals(input.body)) throw new Error('authority collision')
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(path) {
        const value = records.get(path)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function refKey(value: { id: string; version: number; contentHash: string }) {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function ref(id: string, hash = sha256AuthorityValue(id)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}
