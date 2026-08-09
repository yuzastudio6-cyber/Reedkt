import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createCanonicalSam31VertexQualificationLaunchPreflightService,
  parseCanonicalSam31VertexQualificationLaunchPreflightResult,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-preflight'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { authority as rateAuthority } from
  './canonical-current-google-cloud-vertex-a100-rate-authority-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'
import {
  historicalPackageRequest,
  quotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-smoke'

assert.ok(rateAuthority)
const observedAt = '2026-08-06T16:10:00.000Z'
const packageRef = {
  id: historicalPackageRequest.qualificationId,
  version: 1 as const,
  contentHash: `sha256:${historicalPackageRequest.requestHash}` as const,
}
const releaseRef = {
  id: release.releaseId,
  version: 1 as const,
  contentHash: `sha256:${release.releaseHash}` as const,
}
const rateRef = {
  id: rateAuthority.rateAuthorityId,
  version: 1 as const,
  contentHash: `sha256:${rateAuthority.rateAuthorityHash}` as const,
}
let packageReads = 0
let imageReads = 0
let rateReads = 0
let quotaReads = 0
const service = createCanonicalSam31VertexQualificationLaunchPreflightService({
  historicalPackageRepository: {
    async rereadExactWorkerRequest() {
      packageReads += 1
      return structuredClone(historicalPackageRequest)
    },
  } as never,
  imageReleaseRepository: {
    async rereadQualifiedQualificationImageRelease() {
      imageReads += 1
      return structuredClone(release)
    },
  } as never,
  rateRepository: {
    async reread() {
      rateReads += 1
      return structuredClone(rateAuthority)
    },
  } as never,
  quotaReadPort: {
    async rereadCurrent() {
      quotaReads += 1
      return structuredClone(quotaObservation)
    },
  },
  now: () => observedAt,
})

const ready = await service.inspect({
  historicalPackageRequestRef: packageRef,
  imageSupplyChainReleaseRef: releaseRef,
  currentAccountRateAuthorityRef: rateRef,
})
assert.deepEqual(parseCanonicalSam31VertexQualificationLaunchPreflightResult(
  ready), ready)
assert.equal(ready.disposition,
  'ready_for_explicit_paid_launch_authorization')
assert.deepEqual(ready.blockerCodes, [])
assert.equal(ready.exactCanonicalInputsReread, true)
assert.equal(ready.packageImageReleaseLineageMatched, true)
assert.equal(ready.maximumExecutionSeconds, 7_200)
assert.equal(ready.maximumComputeAndProratedBootDiskCostUsdNanos,
  11_672_325_712)
assert.equal(ready.variablePrivateObjectStorageAndOperationsCostIncluded, false)
assert.equal(ready.providerOrGpuJobStarted, false)
assert.equal(ready.packageOrStagingRecordCreated, false)
assert.equal(ready.customerCreditsMutated, false)
assert.equal(ready.billingSettlementPerformed, false)
assert.equal(ready.sourceCheckpointQualificationGranted, false)
assert.equal(ready.runtimeReleaseGranted, false)
assert.equal(ready.publicDeliveryAuthorized, false)
assert.equal(ready.productionAuthorityGranted, false)
assert.deepEqual(
  [packageReads, imageReads, rateReads, quotaReads],
  [1, 1, 1, 1],
)

const { releaseHash: ignoredReleaseHash, ...differentReleasePayload } =
  structuredClone(release)
void ignoredReleaseHash
const differentRelease = {
  ...differentReleasePayload,
  releaseId: 'sam31-qualification-image-newer-release',
}
const sealedDifferentRelease = {
  ...differentRelease,
  releaseHash: sha256AuthorityValue(differentRelease),
}
const stale = await createCanonicalSam31VertexQualificationLaunchPreflightService({
  historicalPackageRepository: {
    async rereadExactWorkerRequest() {
      return structuredClone(historicalPackageRequest)
    },
  } as never,
  imageReleaseRepository: {
    async rereadQualifiedQualificationImageRelease() {
      return structuredClone(sealedDifferentRelease)
    },
  } as never,
  rateRepository: {
    async reread() { return structuredClone(rateAuthority) },
  } as never,
  quotaReadPort: {
    async rereadCurrent() { return structuredClone(quotaObservation) },
  },
  now: () => observedAt,
}).inspect({
  historicalPackageRequestRef: packageRef,
  imageSupplyChainReleaseRef: {
    id: sealedDifferentRelease.releaseId,
    version: 1,
    contentHash: `sha256:${sealedDifferentRelease.releaseHash}`,
  },
  currentAccountRateAuthorityRef: rateRef,
})
assert.equal(stale.disposition, 'blocked_canonical_inputs_not_current')
assert.deepEqual(stale.blockerCodes,
  ['package_image_release_lineage_mismatch'])
assert.equal(stale.packageImageReleaseLineageMatched, false)
assert.equal(stale.exactCanonicalInputsReread, true)
assert.equal(stale.providerOrGpuJobStarted, false)

const missing = await createCanonicalSam31VertexQualificationLaunchPreflightService({
  historicalPackageRepository: {
    async rereadExactWorkerRequest() { return null },
  } as never,
  imageReleaseRepository: {
    async rereadQualifiedQualificationImageRelease() { return null },
  } as never,
  rateRepository: {
    async reread() { return null },
  } as never,
  quotaReadPort: {
    async rereadCurrent() { throw new Error('quota unavailable') },
  },
  now: () => observedAt,
}).inspect({
  historicalPackageRequestRef: packageRef,
  imageSupplyChainReleaseRef: releaseRef,
  currentAccountRateAuthorityRef: rateRef,
})
assert.equal(missing.disposition, 'blocked_canonical_inputs_not_current')
assert.deepEqual(missing.blockerCodes, [
  'vertex_a100_quota_missing_or_stale',
  'historical_package_missing',
  'qualification_image_release_missing',
  'current_rate_authority_missing_or_expired',
])
assert.equal(missing.quotaObservationRef, null)
assert.equal(missing.maximumComputeAndProratedBootDiskCostUsdNanos, null)
assert.equal(missing.providerOrGpuJobStarted, false)

await assert.rejects(service.inspect({
  historicalPackageRequestRef: packageRef,
  imageSupplyChainReleaseRef: releaseRef,
  currentAccountRateAuthorityRef: rateRef,
  extra: true,
} as never))
assert.throws(() => parseCanonicalSam31VertexQualificationLaunchPreflightResult({
  ...ready,
  providerOrGpuJobStarted: true,
}))
assert.throws(() => parseCanonicalSam31VertexQualificationLaunchPreflightResult({
  ...ready,
  preflightHash: '0'.repeat(64),
}))

const serviceSource = readFileSync(
  'server/services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-preflight.ts',
  'utf8',
)
const cliSource = readFileSync(
  'server/cli/inspect-canonical-sam3_1-source-checkpoint-qualification-vertex-launch.ts',
  'utf8',
)
assert.match(cliSource,
  /createCanonicalSam31GcpVertexQualificationLaunchPreflightService/u)
for (const source of [serviceSource, cliSource]) {
  assert.doesNotMatch(source,
    /startCanonicalSam31|stageCanonicalSam31|publishCanonicalSam31/u)
  assert.doesNotMatch(source,
    /createCanonicalSam31VertexQualificationRuntime/u)
  assert.doesNotMatch(source, /child_process|execFile|spawn\(/u)
  assert.doesNotMatch(source,
    /mutateCustomerCredits|walletMutation\(|performBillingSettlement/u)
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-vertex-launch-preflight',
  checks: 44,
  disposition: 'passed',
  providerOrGpuJobStarted: false,
  packageOrStagingRecordCreated: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
})}\n`)
