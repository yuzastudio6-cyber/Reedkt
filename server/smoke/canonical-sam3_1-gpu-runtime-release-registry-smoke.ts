import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  canonicalSam31GpuRuntimeReleaseRef,
  createCanonicalSam31GpuRuntimeReleaseOwner,
  createCanonicalSam31GpuRuntimeReleaseRegistry,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  candidate,
  canonicalIngest,
  canonicalQualification,
} from './canonical-sam3_1-cloud-image-build-smoke'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  canonicalAuthority,
  canonicalAuthorityRef,
  canonicalEvidence,
  canonicalOwner,
  qualificationRepository,
  released,
} from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'

const store = objectPort()
const registry = createCanonicalSam31GpuRuntimeReleaseRegistry({
  objectPort: store.port,
  prefix: 'private/smoke/sam3_1/gpu-runtime-releases/v1',
})
const owner = createCanonicalSam31GpuRuntimeReleaseOwner({
  registry,
  now: () => '2026-08-04T18:23:00.000Z',
})
const imageSupplyChainReleaseRef = {
  id: qualifiedSupplyChain.releaseId,
  version: qualifiedSupplyChain.releaseVersion,
  contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
}
const ownerInput = {
  candidate,
  ingestReceipt: canonicalIngest,
  sourceCheckpointQualification: canonicalQualification,
  imageSupplyChainRelease: qualifiedSupplyChain,
  release: {
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: 'sam31-compiled-a100-runtime-release',
    releaseVersion: 1,
    route: {
      ...canonicalEvidence.route,
      allocatedVcpuCount: 12 as const,
      allocatedMemoryGiB: 170 as const,
      allocatedLocalScratchGiB: 0 as const,
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
  qualificationEvidenceRef:
    canonicalSam31GpuRuntimeQualificationEvidenceRef(canonicalEvidence),
  qualificationEvidenceReadPort: qualificationRepository,
  qualificationCompilationAuthorityRef: canonicalAuthorityRef,
  qualificationCompilationAuthorityReadPort: canonicalOwner,
}
export const record = await owner.preparePersistAndReread(ownerInput)

assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(record)
assert.deepEqual(record.specializedRelease, released.observation)
assert.deepEqual(record.runtimeRelease, released.runtimeRelease)
assert.equal(record.exactSpecializedAndGenericReleasePairPersisted, true)
assert.equal(record.exactQualifiedArtifactRouteAndExpiryBound, true)
assert.equal(record.runtimeDispatched, false)
assert.equal(record.customerCreditsMutated, false)
assert.equal(record.productionAuthorityGranted, false)
assert.equal(store.records.size, 33)

const releaseRef = canonicalSam31GpuRuntimeReleaseRef(record.runtimeRelease)
assert.deepEqual(
  (await registry.rereadReleasePair({ runtimeReleaseRef: releaseRef }))
    ?.recordHash,
  record.recordHash,
)
assert.deepEqual(
  await registry.rereadSpecializedRuntimeRelease({
    runtimeReleaseRef: releaseRef,
  }),
  record.specializedRelease,
)
assert.deepEqual(
  await registry.rereadQualifiedRuntimeRelease({
    toolId: record.runtimeRelease.toolId,
    operationId: record.runtimeRelease.operationId,
    routeId: 'a100_80gb_heavy_primary',
    exactToolOrModelReleaseRef:
      record.runtimeRelease.toolOrModelArtifactReleaseRef,
    at: '2026-08-05T00:00:00.000Z',
  }),
  record.runtimeRelease,
)
assert.equal(
  await registry.rereadQualifiedRuntimeRelease({
    toolId: record.runtimeRelease.toolId,
    operationId: record.runtimeRelease.operationId,
    routeId: 'l4_heavy_fallback',
    exactToolOrModelReleaseRef:
      record.runtimeRelease.toolOrModelArtifactReleaseRef,
    at: '2026-08-05T00:00:00.000Z',
  }),
  null,
)
await assert.rejects(registry.rereadQualifiedRuntimeRelease({
  toolId: record.runtimeRelease.toolId,
  operationId: record.runtimeRelease.operationId,
  routeId: 'a100_80gb_heavy_primary',
  exactToolOrModelReleaseRef:
    record.runtimeRelease.toolOrModelArtifactReleaseRef,
  at: record.runtimeRelease.expiresAt,
}))

const crossedSpecialized = structuredClone(record.specializedRelease)
crossedSpecialized.route.routeId = 'l4_heavy_fallback'
await assert.rejects(registry.persistQualifiedReleasePairCreateOnly({
  record: {
    ...record,
    specializedRelease: crossedSpecialized,
  },
}))
await assert.rejects(owner.preparePersistAndReread({
  ...ownerInput,
  qualificationCompilationAuthorityRef: {
    ...canonicalAuthorityRef,
    id: 'missing-sam31-compilation-authority',
  },
}))
assert.equal(canonicalAuthority.runtimeReleaseGranted, false)

const firstPath = [...store.records.keys()].find((path) =>
  path.includes('/records/'))
assert.ok(firstPath)
store.records.set(firstPath, Buffer.from('{}'))
await assert.rejects(registry.rereadReleasePair({
  runtimeReleaseRef: releaseRef,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-gpu-runtime-release-registry',
  canonicalPreparationAndQualificationReread: true,
  specializedAndGenericReleasePairPersistedCreateOnly: true,
  exactArtifactRouteLookupForFundedDispatch: true,
  expiredReleaseRejected: true,
  crossedSpecializedAndGenericPairRejected: true,
  compilationAuthorityRequired: true,
  runtimeDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

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
