import assert from 'node:assert/strict'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationComponentRef,
} from '../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeReleasePublicationCoordinator,
} from '../services/canonical-sam3_1-gpu-runtime-release-publication-coordinator'
import {
  createCanonicalSam31GpuRuntimeReleaseOwner,
  createCanonicalSam31GpuRuntimeReleaseRegistry,
} from '../services/canonical-sam3_1-gpu-runtime-release-registry'
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
  canonicalIngest,
  canonicalQualification,
} from './canonical-sam3_1-cloud-image-build-smoke'
import { qualifiedSupplyChain } from
  './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  canonicalAuthority,
  canonicalAuthorityRef,
  canonicalDeterministic,
  canonicalDriver,
  canonicalEvidence,
  canonicalOwner,
  canonicalPerformance,
  canonicalQuality,
  qualificationRepository,
} from
  './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import { release as sourceReleaseFixture } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'

const store = objectPort()
const registry = createCanonicalSam31GpuRuntimeReleaseRegistry({
  objectPort: store.port,
  prefix: 'private/smoke/sam3_1/publication-coordinator/v1',
})
const sourceRelease = canonicalSourceRelease()
const request = publicationRequest()
let finalizationCalls = 0
const coordinator = createCoordinator()
const published = await coordinator.publish(request)

assert.equal(finalizationCalls, 1)
assert.equal(
  published.receipt.disposition,
  'private_route_runtime_release_published',
)
assert.equal(published.receipt.routeId, 'a100_80gb_heavy_primary')
assert.equal(
  published.record.runtimeRelease.routeId,
  'a100_80gb_heavy_primary',
)
assert.equal(
  published.record.runtimeRelease.immutableImageDigest,
  qualifiedSupplyChain.immutableImageDigest,
)
assert.equal(
  published.record.runtimeRelease.qualifiedAt,
  canonicalEvidence.qualifiedAt,
)
assert.equal(
  published.record.runtimeRelease.expiresAt,
  '2026-09-03T18:22:00.000Z',
)
assert.deepEqual(
  published.receipt.qualificationEvidenceRef,
  canonicalSam31GpuRuntimeQualificationEvidenceRef(canonicalEvidence),
)
assert.deepEqual(
  published.receipt.qualificationCompilationAuthorityRef,
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
    canonicalAuthority,
  ),
)
assert.equal(
  published.receipt
    .exactSourceCheckpointIngestImageAndFourComponentsReread,
  true,
)
assert.equal(
  published.receipt
    .callerReleaseIdExpiryRouteShapeOrQualificationBooleansAccepted,
  false,
)
assert.equal(published.receipt.gpuJobDispatched, false)
assert.equal(published.receipt.customerCreditsMutated, false)
assert.equal(published.receipt.productionAuthorityGranted, false)
assert.equal(published.record.runtimeDispatched, false)
assert.equal(published.record.customerCreditsMutated, false)

const replay = await coordinator.publish(request)
assert.deepEqual(replay, published)
assert.equal(finalizationCalls, 2)

await assert.rejects(coordinator.publish({
  ...request,
  releaseId: 'caller-selected-release',
}))
await assert.rejects(coordinator.publish({
  ...request,
  expiresAt: '2099-01-01T00:00:00.000Z',
}))
await assert.rejects(coordinator.publish({
  ...request,
  qualificationPassed: true,
}))
await assert.rejects(coordinator.publish({
  ...request,
  routeId: 'l4_heavy_fallback',
}))
await assert.rejects(createCoordinator({ missingSource: true })
  .publish(request))
await assert.rejects(createCoordinator({ missingIngest: true })
  .publish(request))
await assert.rejects(createCoordinator({ missingImage: true })
  .publish(request))
await assert.rejects(coordinator.publish({
  ...request,
  imageSupplyChainReleaseRef: {
    ...request.imageSupplyChainReleaseRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}))

let getterInvoked = false
const accessorRequest = { ...request }
Object.defineProperty(accessorRequest, 'callerAuthority', {
  enumerable: true,
  get() {
    getterInvoked = true
    return true
  },
})
await assert.rejects(coordinator.publish(accessorRequest))
assert.equal(getterInvoked, false)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-gpu-runtime-release-publication-coordinator',
  checks: 31,
  exactSourceIngestImageAndComponentLineage: true,
  evidenceThenCompilationAuthorityFinalized: true,
  routeSpecificReleasePairCreateOnly: true,
  callerReleaseIdExpiryOrQualificationAccepted: false,
  a100AndL4CannotCross: true,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function createCoordinator(overrides: {
  missingSource?: boolean
  missingIngest?: boolean
  missingImage?: boolean
} = {}) {
  return createCanonicalSam31GpuRuntimeReleasePublicationCoordinator({
    sourceQualificationReadPort: {
      async rereadQualificationRelease() {
        return overrides.missingSource ? null : structuredClone(sourceRelease)
      },
    },
    ingestReadPort: {
      async rereadPrivateArtifactIngest() {
        return overrides.missingIngest
          ? null
          : structuredClone(canonicalIngest)
      },
    },
    imageSupplyChainReadPort: {
      async rereadQualifiedRelease() {
        return overrides.missingImage
          ? null
          : structuredClone(qualifiedSupplyChain)
      },
    },
    finalizationOwner: {
      schemaVersion:
        'canonical-sam3_1-gpu-runtime-qualification-finalization-owner-v1',
      evidenceClass:
        'canonical_evidence_then_compilation_authority_exact_reread',
      async finalize(untrusted) {
        finalizationCalls += 1
        const value = untrusted as {
          authorityId: string
          evidenceRequest: typeof request & {
            candidateRef: unknown
            privateArtifactIngestReceiptRef: unknown
            immutableImageRef: unknown
          }
        }
        assert.equal(
          value.evidenceRequest.imageSupplyChainReleaseRef.contentHash,
          request.imageSupplyChainReleaseRef.contentHash,
        )
        return {
          evidence: structuredClone(canonicalEvidence),
          evidenceRef:
            canonicalSam31GpuRuntimeQualificationEvidenceRef(
              canonicalEvidence,
            ),
          compilationAuthority: structuredClone(canonicalAuthority),
          compilationAuthorityRef: canonicalAuthorityRef,
        }
      },
    },
    releaseOwner: createCanonicalSam31GpuRuntimeReleaseOwner({
      registry,
      now: () => '2026-08-04T18:23:00.000Z',
    }),
    qualificationEvidenceReadPort: qualificationRepository,
    qualificationCompilationAuthorityReadPort: canonicalOwner,
  })
}

function publicationRequest() {
  return {
    routeId: 'a100_80gb_heavy_primary' as const,
    sourceCheckpointQualificationRef:
      canonicalSam31SourceCheckpointQualificationRef(canonicalQualification),
    imageSupplyChainReleaseRef: {
      id: qualifiedSupplyChain.releaseId,
      version: qualifiedSupplyChain.releaseVersion,
      contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
    },
    serviceIdentityRef: canonicalEvidence.serviceIdentityRef,
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
        canonicalSam31GpuRuntimeQualificationComponentRef(
          canonicalPerformance,
        ),
      independentTemporalQualityRef:
        canonicalSam31GpuRuntimeQualificationComponentRef(canonicalQuality),
    },
  }
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
