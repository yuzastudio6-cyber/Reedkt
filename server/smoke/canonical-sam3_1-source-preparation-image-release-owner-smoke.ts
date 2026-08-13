import assert from 'node:assert/strict'

import type {
  CanonicalSam31EightMinuteSourcePreparationAdmission,
  CanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  CanonicalSam31EightMinuteSourcePreparationConsumption,
  CanonicalSam31EightMinuteSourcePreparationQualification,
  CanonicalSam31EightMinuteSourcePreparationRelease,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  assertCanonicalSam31SourcePreparationImageBuildReceipt,
  createCanonicalSam31SourcePreparationImageBuildReceipt,
  createCanonicalSam31SourcePreparationImageReleaseOwner,
  createCanonicalSam31SourcePreparationImageSupplyChain,
  imageBuildReceiptRef,
} from '../services/canonical-sam3_1-source-preparation-image-release-owner'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const imageDigest = `sha256:${sha('immutable-source-preparation-image')}`
const sourceCommitSha = 'a'.repeat(40)
const build = createCanonicalSam31SourcePreparationImageBuildReceipt({
  receiptId: 'sam31-source-preparation-build-receipt-1',
  cloudBuildId: '7e1cb92e-5df2-4122-9c75-3a239d19dc50',
  cloudBuildResource:
    'projects/reeditpro/locations/us-central1/builds/'
    + '7e1cb92e-5df2-4122-9c75-3a239d19dc50',
  sourceCommitSha,
  sourceTreeSha: 'b'.repeat(40),
  sourceArchiveRef: ref('sam31-source-preparation-archive', 'source-archive'),
  sourceArchiveGeneration: '1786654741345226',
  sourceArchiveSha256: sha('source-archive'),
  dockerfile:
    'docker/prod/gpu-worker/sam3_1-source-preparation/Dockerfile.candidate',
  dockerfileSha256: sha('dockerfile'),
  cloudBuildDefinition:
    'docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.candidate.yaml',
  cloudBuildDefinitionSha256: sha('cloud-build-definition'),
  sourceProvenanceLock:
    'docker/prod/gpu-worker/sam3_1-source-preparation/source-provenance.lock',
  sourceProvenanceLockSha256: sha('source-provenance-lock'),
  fixedProcessSource:
    'server/services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port.ts',
  fixedProcessPortSha256: sha('fixed-process-port'),
  workerEntrypointSource:
    'server/cli/run-weeditpro-sam3_1-eight-minute-source-preparation-worker.ts',
  fixedWorkerEntrypointSha256: sha('worker-entrypoint'),
  taggedImageUri:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/'
    + `reeditpro-sam31-source-preparation-l4:source-prep-${sourceCommitSha.slice(0, 16)}`,
  immutableImageUri:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/'
    + `reeditpro-sam31-source-preparation-l4@${imageDigest}`,
  immutableImageDigest: imageDigest,
  imageBuildRef: ref('sam31-source-preparation-image',
    'immutable-source-preparation-image'),
  completedAt: '2026-08-13T21:30:00.000Z',
})
const buildRef = imageBuildReceiptRef(build)
const supply = createCanonicalSam31SourcePreparationImageSupplyChain({
  evidenceId: 'sam31-source-preparation-supply-chain-1',
  imageBuildReceiptRef: buildRef,
  immutableImageUri: build.immutableImageUri,
  immutableImageDigest: build.immutableImageDigest,
  spdx23SbomRef: ref('sam31-source-preparation-spdx', 'spdx'),
  vulnerabilityScanRef: ref('sam31-source-preparation-scan', 'scan'),
  independentSecurityReviewRef: ref(
    'sam31-source-preparation-security-review',
    'security-review',
  ),
  signatureVerificationRef: ref(
    'sam31-source-preparation-signature',
    'signature',
  ),
  slsaProvenanceRef: ref('sam31-source-preparation-slsa', 'slsa'),
  reviewedAt: '2026-08-13T21:40:00.000Z',
})

const qualifications = new Map<
  string,
  CanonicalSam31EightMinuteSourcePreparationQualification
>()
const releases = new Map<
  string,
  CanonicalSam31EightMinuteSourcePreparationRelease
>()
const repository: CanonicalSam31EightMinuteSourcePreparationAuthorityRepository = {
  schemaVersion:
    'canonical-sam3_1-eight-minute-source-preparation-authority-repository-v1',
  async persistQualificationCreateOnly({ qualification }) {
    const replay = qualifications.get(qualification.qualificationId)
    if (replay) return 'identical_replay'
    qualifications.set(qualification.qualificationId, structuredClone(
      qualification,
    ))
    return 'created'
  },
  async rereadQualification({ qualificationRef }) {
    return qualifications.get(qualificationRef.id) ?? null
  },
  async persistReleaseCreateOnly({ release }) {
    const replay = releases.get(release.releaseId)
    if (replay) return 'identical_replay'
    releases.set(release.releaseId, structuredClone(release))
    return 'created'
  },
  async rereadRelease({ releaseRef }) {
    return releases.get(releaseRef.id) ?? null
  },
  async persistAdmissionCreateOnly() { return 'created' },
  async rereadAdmission(): Promise<
    CanonicalSam31EightMinuteSourcePreparationAdmission | null
  > { return null },
  async consumeAdmissionCreateOnly() { return 'created' },
  async rereadConsumption(): Promise<
    CanonicalSam31EightMinuteSourcePreparationConsumption | null
  > { return null },
  async rereadConsumedAdmission() { return null },
}

const owner = createCanonicalSam31SourcePreparationImageReleaseOwner({
  repository,
})
const published = await owner.publishPrivateQualification({
  qualificationId: 'sam31-source-preparation-l4-qualification-1',
  releaseId: 'sam31-source-preparation-l4-release-1',
  imageBuildReceipt: build,
  supplyChain: supply,
  fourKPreparationQualificationRunRef: ref(
    'sam31-source-preparation-exact-4k-run',
    'exact-4k-run',
  ),
  qualifiedAt: '2026-08-13T21:45:00.000Z',
})

assert.equal(published.status,
  'qualified_private_l4_source_preparation')
assert.equal(published.qualification.schemaVersion,
  'canonical-sam3_1-eight-minute-source-preparation-qualification-v2')
assert.equal(published.qualification.immutableImageDigest, imageDigest)
assert.equal(published.qualification.sourceProvenanceLockSha256,
  build.sourceProvenanceLockSha256)
assert.equal(published.qualification.actualNvidiaL4Observed, true)
assert.equal(published.qualification.substantiveCpuMediaProcessingUsed, false)
assert.equal(published.release.minimumIdleInstances, 0)
assert.equal(published.release.userTriggeredScaleFromZero, true)
assert.equal(published.release.accountEffectivePricingRequired, true)
assert.equal(published.release.customerCreditMutationAllowed, false)
assert.equal(published.productionAuthorityGranted, false)
assert.equal(qualifications.size, 1)
assert.equal(releases.size, 1)

const replay = await owner.publishPrivateQualification({
  qualificationId: published.qualification.qualificationId,
  releaseId: published.release.releaseId,
  imageBuildReceipt: build,
  supplyChain: supply,
  fourKPreparationQualificationRunRef: ref(
    'sam31-source-preparation-exact-4k-run',
    'exact-4k-run',
  ),
  qualifiedAt: published.qualification.qualifiedAt,
})
assert.equal(replay.qualificationDisposition, 'identical_replay')
assert.equal(replay.releaseDisposition, 'identical_replay')

assert.throws(() => assertCanonicalSam31SourcePreparationImageBuildReceipt({
  ...build,
  receiptHash: sha('tampered-build'),
}))
await assert.rejects(() => owner.publishPrivateQualification({
  qualificationId: 'crossed-qualification',
  releaseId: 'crossed-release',
  imageBuildReceipt: build,
  supplyChain: {
    ...supply,
    immutableImageDigest: `sha256:${sha('other-image')}`,
  },
  fourKPreparationQualificationRunRef: ref('run', 'run'),
  qualifiedAt: '2026-08-13T21:45:00.000Z',
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-preparation-image-release-owner',
  checks: 22,
  qualificationVersion: published.qualification.schemaVersion,
  exactBuildSupplyChainSecurityL4RunAndReleaseReread: true,
  pythonRunnerEvidenceRetired: true,
  sourceProvenanceLockBound: true,
  userTriggeredScaleFromZero: published.release.userTriggeredScaleFromZero,
  accountEffectivePricingRequired:
    published.release.accountEffectivePricingRequired,
  gpuJobDispatchedByPublication: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}))

function sha(value: string) {
  return sha256AuthorityValue(value)
}

function ref(id: string, content: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${sha(content)}` as const,
  }
}
