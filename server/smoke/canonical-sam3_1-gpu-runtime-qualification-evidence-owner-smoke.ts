import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationFinalizationOwner,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-finalization-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceOwner,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  assertCanonicalSam31QualificationRelease,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  canonicalSam31SourceCheckpointQualificationRef,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  candidate,
  canonicalIngest,
  canonicalQualification,
} from './canonical-sam3_1-cloud-image-build-smoke'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  canonicalDeterministic,
  canonicalDriver,
  canonicalEvidence,
  canonicalPerformance,
  canonicalQuality,
} from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import { release as sourceReleaseFixture } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'

const sourceRelease = canonicalSourceRelease()
const componentRecords = new Map([
  entry(canonicalDriver),
  entry(canonicalDeterministic),
  entry(canonicalPerformance),
  entry(canonicalQuality),
])
const store = objectPort()
const evidenceRepository =
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: store.port,
  })
const request = {
  candidateRef: {
    schemaVersion: candidate.schemaVersion,
    candidateHash: candidate.candidateHash,
  },
  privateArtifactIngestReceiptRef: {
    id: canonicalIngest.ingestReceiptId,
    version: canonicalIngest.ingestReceiptVersion,
    contentHash: `sha256:${canonicalIngest.ingestReceiptHash}` as const,
  },
  sourceCheckpointCompatibilityQualificationRef:
    canonicalSam31SourceCheckpointQualificationRef(canonicalQualification),
  imageSupplyChainReleaseRef: {
    id: qualifiedSupplyChain.releaseId,
    version: qualifiedSupplyChain.releaseVersion,
    contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
  },
  serviceIdentityRef: canonicalEvidence.serviceIdentityRef,
  immutableImageRef: qualifiedSupplyChain.immutableImageRef,
  scaleToZeroConfigurationRef:
    canonicalEvidence.scaleToZeroConfigurationRef,
  privateNetworkAndArtifactTransportRef:
    canonicalEvidence.privateNetworkAndArtifactTransportRef,
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
}
const owner = createOwner()
const evidence = await owner
  .compilePersistAndRereadQualificationEvidence(request)

assert.deepEqual(evidence, canonicalEvidence)
assert.deepEqual(
  canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
  canonicalSam31GpuRuntimeQualificationEvidenceRef(canonicalEvidence),
)
assert.equal(evidence.deterministicRuns.length, 30)
assert.equal(evidence.performanceEvidence.measurements.length, 30)
assert.equal(evidence.qualityEvidence.qualityRole, 'approved_a100_baseline')
assert.equal(evidence.authority.privateRuntimeQualificationEvidenceReady, true)
assert.equal(evidence.authority.gpuJobDispatchAuthorized, false)
assert.equal(evidence.authority.customerCreditsMutated, false)
assert.equal(evidence.authority.qaApprovalGranted, false)
assert.equal(evidence.authority.publicDeliveryAuthorized, false)
assert.equal(evidence.authority.productionAuthorityGranted, false)

const replay = await owner.compilePersistAndRereadQualificationEvidence(request)
assert.deepEqual(replay, evidence)

const compilationOwner =
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner({
    readPort: {
      rereadQualificationEvidence({ qualificationEvidenceRef }) {
        return evidenceRepository.rereadQualifiedEvidence({
          qualificationEvidenceRef,
        })
      },
      async rereadComponentEvidence({ componentEvidenceRef }) {
        const component = componentRecords.get(refKey(componentEvidenceRef))
        return component ? structuredClone(component) : null
      },
    },
    authorityObjectPort: store.port,
  })
const finalization = await
  createCanonicalSam31GpuRuntimeQualificationFinalizationOwner({
    evidenceOwner: createOwner(),
    compilationOwner,
  }).finalize({
    authorityId: 'sam31-canonical-a100-final-qualification-authority',
    evidenceRequest: request,
  })
assert.deepEqual(finalization.evidence, canonicalEvidence)
assert.deepEqual(
  finalization.evidenceRef,
  canonicalSam31GpuRuntimeQualificationEvidenceRef(canonicalEvidence),
)
assert.deepEqual(
  finalization.compilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
    finalization.compilationAuthority,
  ),
)
assert.equal(
  finalization.compilationAuthority
    .exactQualificationAndFourComponentRecordsReread,
  true,
)
assert.equal(
  finalization.compilationAuthority
    .callerSuppliedQualificationBooleansAccepted,
  false,
)

await assert.rejects(owner.compilePersistAndRereadQualificationEvidence({
  ...request,
  authority: { privateRuntimeQualificationEvidenceReady: true },
}))
await assert.rejects(owner.compilePersistAndRereadQualificationEvidence({
  ...request,
  driverEvidence: canonicalEvidence.driverEvidence,
}))
await assert.rejects(owner.compilePersistAndRereadQualificationEvidence({
  ...request,
  candidateRef: {
    ...request.candidateRef,
    candidateHash: '0'.repeat(64),
  },
}))
await assert.rejects(createOwner({ missingImage: true })
  .compilePersistAndRereadQualificationEvidence(request))
await assert.rejects(createOwner({
  missingComponentRef: request.componentEvidenceRefs.eightMinutePerformanceRef,
}).compilePersistAndRereadQualificationEvidence(request))

const crossedQuality =
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
    ...withoutHash(canonicalQuality),
    route: {
      routeId: 'l4_heavy_fallback',
      gpuProfileId: 'quality_l4_user_triggered_heavy_fallback_job_v1',
      runtimeRegion: 'us-central1',
      executionTarget: 'google_cloud_run_l4_job',
      machineType: 'cloud_run_nvidia_l4',
      accelerator: 'nvidia_l4',
    },
  })
await assert.rejects(createOwner({ replacementComponent: crossedQuality })
  .compilePersistAndRereadQualificationEvidence({
    ...request,
    componentEvidenceRefs: {
      ...request.componentEvidenceRefs,
      independentTemporalQualityRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(crossedQuality),
    },
  }))

const futureDriver =
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
    ...withoutHash(canonicalDriver),
    componentId: 'sam31-canonical-a100-driver-component-future',
    recordedAt: '2026-08-04T18:22:00.001Z',
  })
await assert.rejects(createOwner({ replacementComponent: futureDriver })
  .compilePersistAndRereadQualificationEvidence({
    ...request,
    componentEvidenceRefs: {
      ...request.componentEvidenceRefs,
      driverAndCudaRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(futureDriver),
    },
  }))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-qualification-evidence-owner',
  ownerConstructedFinalEvidenceFromCanonicalComponents: true,
  canonicalSourceCheckpointReleaseReread: true,
  canonicalImageSupplyChainReleaseReread: true,
  exactFourComponentRecordsReread: true,
  callerQualificationPayloadAccepted: false,
  createOnlyPersistAndExactReread: true,
  oneWriterEvidenceThenCompilationFinalization: true,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createOwner(overrides: {
  missingImage?: boolean
  missingComponentRef?: { id: string; version: number; contentHash: string }
  replacementComponent?:
    CanonicalSam31GpuRuntimeQualificationComponentEvidence
} = {}) {
  return createCanonicalSam31GpuRuntimeQualificationEvidenceOwner({
    readPort: {
      async rereadSourceCheckpointQualificationRelease() {
        return structuredClone(sourceRelease)
      },
      async rereadImageSupplyChainRelease() {
        return overrides.missingImage
          ? null
          : structuredClone(qualifiedSupplyChain)
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
        const component = componentRecords.get(refKey(componentEvidenceRef))
        return component ? structuredClone(component) : null
      },
    },
    evidenceRepository,
    now: () => canonicalEvidence.qualifiedAt,
  })
}

function canonicalSourceRelease() {
  const release = structuredClone(sourceReleaseFixture)
  const payload = release as Omit<typeof release, 'releaseHash'> & {
    releaseHash?: string
  }
  delete payload.releaseHash
  payload.qualificationId = canonicalQualification.qualificationId
  payload.sourceCheckpointQualificationRef =
    canonicalSam31SourceCheckpointQualificationRef(canonicalQualification)
  payload.qualification = canonicalQualification
  return assertCanonicalSam31QualificationRelease({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

function withoutHash(
  component: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
) {
  const clone = structuredClone(component) as
    Omit<typeof component, 'componentHash'> & { componentHash?: string }
  delete clone.componentHash
  return clone
}

function entry(
  component: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
) {
  return [
    refKey(canonicalSam31GpuRuntimeQualificationComponentRef(component)),
    component,
  ] as const
}

function refKey(value: {
  id: string
  version: number
  contentHash: string
}) {
  return `${value.id}:${value.version}:${value.contentHash}`
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
          if (!prior.equals(input.body)) throw new Error('object collision')
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
