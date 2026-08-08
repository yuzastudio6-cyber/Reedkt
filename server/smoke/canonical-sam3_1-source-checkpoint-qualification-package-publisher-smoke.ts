import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31QualificationPackagePublisher,
  type CanonicalSam31QualificationPackageEvidenceReadPort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-publisher'
import type {
  CanonicalSam31QualificationPackageRepository,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import { candidate, canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'
import { release } from
  './canonical-sam3_1-qualification-image-supply-chain-build-phase-smoke'

const issuedAt = '2026-08-08T02:00:00.000Z'
const ingestReceiptRef = {
  id: canonicalIngest.ingestReceiptId,
  version: 1 as const,
  schemaVersion: canonicalIngest.schemaVersion,
  contentHash: `sha256:${canonicalIngest.ingestReceiptHash}` as const,
}
const artifactReviewBundleRef = {
  id: 'sam31-private-artifact-review-fixture',
  version: 1 as const,
  schemaVersion:
    'canonical-sam3_1-private-artifact-review-bundle-v1' as const,
  contentHash: `sha256:${digest('artifact-review')}` as const,
}
const imageSupplyChainReleaseRef = {
  id: release.releaseId,
  version: 1 as const,
  contentHash: `sha256:${release.releaseHash}` as const,
}
const request = {
  qualificationId: 'sam31-package-publisher-qualification-v1',
  ingestReceiptRef,
  artifactReviewBundleRef,
  imageSupplyChainReleaseRef,
  issuedAt,
}
const probeHash = digest('non-customer-person-probe-video')
const validEvidence = {
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-qualification-package-evidence-v1',
  evidenceClass: 'canonical_private_exact_reread_projection',
  ingestReceiptRef,
  artifactReviewBundleRef,
  imageSupplyChainReleaseRef,
  ingestReceipt: canonicalIngest,
  qualificationImage: {
    artifactRef: release.immutableImageRef,
    immutableImageDigest: release.immutableImageDigest,
    supplyChainReleaseRef: imageSupplyChainReleaseRef,
    dockerfileSourceRef: contentRef('dockerfile', digest('dockerfile')),
    entrypointSourceRef: contentRef('entrypoint', digest('entrypoint')),
    runnerSourceRef: contentRef('runner', digest('runner')),
  },
  patchedSourceArchiveRef: contentRef(
    'patched-source',
    candidate.runtimeClosure.deterministicPatchedSourceArchiveSha256,
  ),
  patchApplicationReceiptRef: contentRef(
    'patch-application',
    digest('patch-application'),
  ),
  checkpointWeightsOnlyRequirementRef: contentRef(
    'checkpoint-weights-only-requirement',
    digest('checkpoint-weights-only-requirement'),
  ),
  dependencyClosureRef: release.sourceAndDependencyClosureRef,
  dependencyLockSha256: digest('dependency-lock'),
  dependencyClosureReceiptSha256: digest('dependency-closure-receipt'),
  dependencyWheelManifestSha256: digest('dependency-wheel-manifest'),
  sourceCodeSecurityReviewRef: contentRef(
    'source-security-review',
    digest('source-security-review'),
  ),
  deterministicProbeFixture: {
    artifactRef: contentRef('probe-fixture', probeHash),
    byteLength: 1_024,
    sha256: probeHash,
    width: 128,
    height: 128,
    frameCount: 3,
  },
  exactIngestReviewImageAuthorityManifestReleaseAndProbeReread: true,
  checkpointWeightsOnlyExecutionStillRequiredInWorker: true,
  callerPathsUrlsBytesCredentialsHashesOrCommandsAccepted: false,
  customerMediaUsed: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
} as const

let evidence: unknown = structuredClone(validEvidence)
let persistedWorkerRequest: unknown = null
let forceChangedReread = false
const evidenceReadPort: CanonicalSam31QualificationPackageEvidenceReadPort = {
  schemaVersion: 'test-evidence-read-port-v1',
  async rereadExact() {
    return evidence === null ? null : structuredClone(evidence)
  },
}
const packageRepository = {
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-qualification-package-repository-v1',
  evidenceClass: 'private_create_only_exact_reread',
  async persistQualificationPackageCreateOnly(input: {
    workerRequest: unknown
  }) {
    persistedWorkerRequest =
      assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
        input.workerRequest,
      )
    const request =
      assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
        persistedWorkerRequest,
      )
    return {
      disposition: 'created' as const,
      workerRequestRef: {
        id: request.qualificationId,
        version: 1 as const,
        contentHash: `sha256:${request.requestHash}` as const,
      },
      packageRef: {
        id: `${request.qualificationId}-package`,
        version: 1 as const,
        contentHash: `sha256:${digest('package')}` as const,
      },
      modelOrGpuRuntimeStarted: false as const,
      customerCreditsMutated: false as const,
      productionAuthorityGranted: false as const,
    }
  },
  async rereadExactWorkerRequest() {
    if (!persistedWorkerRequest) return null
    const request =
      assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
        persistedWorkerRequest,
      )
    if (!forceChangedReread) return structuredClone(request)
    const changed = structuredClone(request)
    changed.qualificationId = 'changed-after-persist'
    return changed
  },
  async rereadExactSources() { return null },
  async rereadExactIngestReceipt() { return null },
} as unknown as CanonicalSam31QualificationPackageRepository
const publisher = createCanonicalSam31QualificationPackagePublisher({
  evidenceReadPort,
  packageRepository,
})

const publication = await publisher.publish(request)
assert.equal(publication.disposition, 'created')
assert.equal(publication.qualificationId, request.qualificationId)
assert.equal(publication.exactCanonicalInputsRereadBeforePublication, true)
assert.equal(
  publication.checkpointWeightsOnlyExecutionStillRequiredInWorker,
  true,
)
assert.equal(publication.gpuOrModelRuntimeStarted, false)
assert.equal(publication.customerCreditsMutated, false)
assert.equal(publication.productionAuthorityGranted, false)
const { publicationHash, ...publicationPayload } = publication
assert.equal(publicationHash, sha256AuthorityValue(publicationPayload))
const capturedWorkerRequest =
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
    persistedWorkerRequest,
  )
assert.equal(
  capturedWorkerRequest.checkpoint.weightsOnlyInspectionRef.id,
  validEvidence.checkpointWeightsOnlyRequirementRef.id,
)
assert.equal(
  capturedWorkerRequest.deterministicProbeFixture.sha256,
  probeHash,
)
assert.equal(capturedWorkerRequest.authority.customerCreditsMutated, false)
assert.equal(capturedWorkerRequest.authority.productionReady, false)

await rejectWithEvidence(null)
await rejectWithEvidence({
  ...validEvidence,
  unknownField: true,
})
await rejectWithEvidence({
  ...validEvidence,
  gpuOrModelRuntimeStarted: true,
})
await rejectWithEvidence({
  ...validEvidence,
  checkpointWeightsOnlyExecutionStillRequiredInWorker: false,
})
await rejectWithEvidence({
  ...validEvidence,
  customerMediaUsed: true,
})
await rejectWithEvidence({
  ...validEvidence,
  ingestReceiptRef: {
    ...ingestReceiptRef,
    contentHash: `sha256:${digest('crossed-ingest')}`,
  },
})
await rejectWithEvidence({
  ...validEvidence,
  artifactReviewBundleRef: {
    ...artifactReviewBundleRef,
    contentHash: `sha256:${digest('crossed-review')}`,
  },
})
await rejectWithEvidence({
  ...validEvidence,
  imageSupplyChainReleaseRef: {
    ...imageSupplyChainReleaseRef,
    contentHash: `sha256:${digest('crossed-release')}`,
  },
})
await rejectWithEvidence({
  ...validEvidence,
  qualificationImage: {
    ...validEvidence.qualificationImage,
    artifactRef: contentRef('changed-image', digest('changed-image')),
  },
})
await rejectWithEvidence({
  ...validEvidence,
  patchedSourceArchiveRef: contentRef(
    'changed-patched-source',
    digest('changed-patched-source'),
  ),
})
await rejectWithEvidence({
  ...validEvidence,
  deterministicProbeFixture: {
    ...validEvidence.deterministicProbeFixture,
    artifactRef: contentRef('changed-probe', digest('changed-probe')),
  },
})
evidence = structuredClone(validEvidence)
forceChangedReread = true
await assert.rejects(publisher.publish(request))
forceChangedReread = false
await assert.rejects(publisher.publish({ ...request, unknownField: true }))
await assert.rejects(publisher.publish({
  ...request,
  issuedAt: 'not-a-timestamp',
}))
const cyclic = { ...request } as Record<string, unknown>
cyclic.self = cyclic
await assert.rejects(publisher.publish(cyclic))
await assert.rejects(publisher.publish(new Proxy({}, {
  ownKeys() { throw new Error('hostile proxy') },
})))

const publisherSource = readFileSync(
  'server/services/canonical-sam3_1-source-checkpoint-qualification-package-publisher.ts',
  'utf8',
)
assert.match(publisherSource, /rereadPrivateArtifactIngest/u)
assert.match(publisherSource, /rereadAuthenticatedArtifactReview/u)
assert.match(publisherSource, /rereadQualifiedQualificationImageRelease/u)
assert.match(publisherSource, /rereadBuildAuthority/u)
assert.match(publisherSource, /rereadCapsuleManifest/u)
assert.match(publisherSource, /rereadCurrentProbeFixtureAuthority/u)
assert.doesNotMatch(publisherSource, /child_process|execSync|spawnSync/u)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-source-checkpoint-qualification-package-publisher',
  validPublication: true,
  adversarialChecks: 16,
  exactCanonicalReadStages: 6,
  callerMediaPathHashOrCommandAccepted: false,
  gpuOrModelRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

async function rejectWithEvidence(value: unknown) {
  evidence = value
  await assert.rejects(publisher.publish(request))
  evidence = structuredClone(validEvidence)
}

function contentRef(id: string, hash: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
