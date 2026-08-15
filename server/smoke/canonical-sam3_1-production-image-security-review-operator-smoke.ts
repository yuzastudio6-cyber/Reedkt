import assert from 'node:assert/strict'

import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31ProductionImageSecurityReviewAuthorityRepository,
  createCanonicalSam31ProductionImageSecurityReviewOperator,
  SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
} from '../services/canonical-sam3_1-production-image-security-review-operator'
import {
  admission,
  authority,
  imageBuildSubmission,
  imageBuildTerminal,
  observation,
  submission,
} from './canonical-sam3_1-cloud-image-supply-chain-build-smoke'

const store = createObjectPort()
const authorityRepository =
  createCanonicalSam31ProductionImageSecurityReviewAuthorityRepository({
    objectPort: store.port,
  })
const releaseRepository = createCanonicalSam31ImageSupplyChainReleaseRepository({
  objectPort: store.port,
})
let severityCounts = {
  criticalCount: 0,
  highCount: 0,
  mediumCount: 1,
  lowCount: 1,
  unknownSeverityCount: 0,
}
const operator = createCanonicalSam31ProductionImageSecurityReviewOperator({
  authorityRepository,
  releaseRepository,
  scanReadPort: {
    async rereadExact() {
      return {
        scanRef: ref('sam31-production-vulnerability-scan', '6'),
        scanCompletedAt: '2026-08-03T20:03:00.000Z',
        occurrenceSnapshotUpdatedAt: '2026-08-03T20:04:00.000Z',
        severityCounts: structuredClone(severityCounts),
      }
    },
  },
  now: () => '2026-08-03T20:05:00.000Z',
})
const request = {
  confirmation: SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
  imageBuildAuthority: authority,
  imageBuildSubmission,
  imageBuildTerminal,
  supplyChainAdmission: admission,
  supplyChainSubmission: submission,
  supplyChainObservation: observation,
}
const result = await operator.review(request)

assert.equal(result.authority.evidenceClass, 'canonical_private_reread')
assert.equal(
  result.authority.status,
  'authorized_for_private_a100_l4_image_security_review',
)
assert.equal(result.authority.immutableImageDigest,
  imageBuildTerminal.immutableImageDigest)
assert.equal(result.authority.approvedForPrivateA100AndL4QualificationOnly,
  true)
assert.equal(result.securityReview.severityCounts.criticalCount, 0)
assert.equal(result.securityReview.severityCounts.highCount, 0)
assert.equal(result.securityReview.severityCounts.unknownSeverityCount, 0)
assert.equal(result.runtimeReleaseGranted, false)
assert.equal(result.gpuJobDispatched, false)
assert.equal(result.modelOrCheckpointExecuted, false)
assert.equal(result.customerCreditsMutated, false)
assert.equal(result.productionReady, false)
assert.deepEqual(await authorityRepository.reread({
  authorityRef: result.authorityRef,
}), result.authority)
assert.ok(await releaseRepository.rereadApprovedReview({
  immutableImageDigest: result.securityReview.immutableImageDigest,
  vulnerabilityScanRef: result.securityReview.vulnerabilityScanRef,
  scanCompletedAt: result.securityReview.scanCompletedAt,
  occurrenceSnapshotUpdatedAt:
    result.securityReview.occurrenceSnapshotUpdatedAt,
  severityCounts: result.securityReview.severityCounts,
}))

const replay = await operator.review(request)
assert.deepEqual(replay.authorityRef, result.authorityRef)
assert.deepEqual(replay.securityReviewRef, result.securityReviewRef)
await assert.rejects(operator.review({
  ...request,
  confirmation: 'wrong',
} as never))
await assert.rejects(operator.review({ ...request, command: 'approve' } as never))
severityCounts = { ...severityCounts, highCount: 1 }
await assert.rejects(operator.review(request))
severityCounts = { ...severityCounts, highCount: 0, unknownSeverityCount: 1 }
await assert.rejects(operator.review(request))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-image-security-review-operator',
  checks: 31,
  exactImageBuildAndSupplyChainLineageReread: true,
  exactArtifactAnalysisOccurrenceSnapshotReread: true,
  zeroCriticalHighAndUnknownRequired: true,
  authorityAndReviewCreateOnlyExactReread: true,
  approvedForPrivateA100AndL4QualificationOnly: true,
  callerCommandOrOpenedAuthorityAccepted: false,
  gpuJobDispatched: false,
  modelOrCheckpointExecuted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

function createObjectPort() {
  const objects = new Map<string, Buffer>()
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly({ objectPath, body }) {
      if (objects.has(objectPath)) return 'already_exists'
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
  return { objects, port }
}

function ref(id: string, digit: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digit.repeat(64)}` as const,
  }
}
