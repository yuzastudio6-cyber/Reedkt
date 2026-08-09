import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  createCanonicalSam31VertexImageBuildBinding,
} from '../model-artifacts/canonical-sam3_1-vertex-production-build-binding'
import {
  canonicalSam31ProductionCapsuleBuilderResultRef,
  sealCanonicalSam31ProductionCapsuleBuilderResult,
  sealCanonicalSam31ProductionCapsuleSecurityReview,
} from '../model-artifacts/canonical-sam3_1-production-capsule-build-evidence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31CloudImageBuildRepository,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31ProductionCapsulePublisher,
  createCanonicalSam31ProductionCapsuleReproducibilityRepository,
} from '../services/canonical-sam3_1-production-capsule-publisher'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { release } from
  './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner-smoke'

const canonicalIngest = release.qualification.ingestReceipt
const binding = createCanonicalSam31VertexImageBuildBinding({
  release,
})
const bindingRef = ref(
  `sam31-vertex-build-binding-${binding.bindingHash.slice(0, 24)}`,
  binding.bindingHash,
)
const entries = createEntries()
const capsuleSha = sha(Buffer.from('production-capsule-double-build-smoke'))
const primaryId = '11111111-1111-4111-8111-111111111111'
const confirmationId = '22222222-2222-4222-8222-222222222222'
const primary = createBuild(primaryId, '3101', 'primary-etag',
  '2026-08-08T18:00:00.000Z')
const confirmation = createBuild(confirmationId, '3102', 'confirmation-etag',
  '2026-08-08T18:01:00.000Z')
const buildEvidence = new Map([
  [primaryId, primary],
  [confirmationId, confirmation],
])
const objectStore = createObjectPort()
const imageBuildRepository = createCanonicalSam31CloudImageBuildRepository({
  objectPort: objectStore.port,
  prefix: 'private/sam3_1/cloud-image-build/v2',
})
const reproducibilityRepository =
  createCanonicalSam31ProductionCapsuleReproducibilityRepository({
    objectPort: objectStore.port,
  })
let verificationCalls = 0
const publisher = createCanonicalSam31ProductionCapsulePublisher({
  qualificationReleaseReadPort: {
    async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
      return sourceCheckpointQualificationRef.contentHash ===
        release.sourceCheckpointQualificationRef.contentHash
        ? structuredClone(release)
        : null
    },
  },
  ingestReadPort: {
    async rereadPrivateArtifactIngest({ ingestReceiptRef }) {
      return ingestReceiptRef.contentHash ===
        `sha256:${canonicalIngest.ingestReceiptHash}`
        ? structuredClone(canonicalIngest)
        : null
    },
  },
  artifactBindingReadPort: {
    async rereadArtifactBinding({ bindingRef: requested }) {
      return requested.contentHash === bindingRef.contentHash
        ? structuredClone(binding)
        : null
    },
  },
  buildReadPort: {
    schemaVersion: 'canonical-sam3_1-production-capsule-build-read-port-v2',
    async rereadBuild({ buildId }) {
      return structuredClone(buildEvidence.get(buildId) ?? null)
    },
  },
  reproducibilityRepository,
  imageBuildRepository,
  privateCapsuleReadPort: { async readExact() { return null } },
  async verifyCapsule() {
    verificationCalls += 1
    return {
      archiveEntries: entries,
      archiveEntrySetSha256: sha256AuthorityValue(entries),
    }
  },
})
const request = {
  sourceCheckpointQualificationRef:
    release.sourceCheckpointQualificationRef,
  primaryBuildId: primaryId,
  confirmationBuildId: confirmationId,
}
const publication = await publisher.publish(request)
assert.equal(
  publication.disposition,
  'capsule_ready_for_image_authority_publication',
)
assert.equal(publication.independentBuildCount, 2)
assert.equal(publication.checkpointIncluded, false)
assert.equal(publication.imageBuildStarted, false)
assert.equal(publication.gpuJobDispatched, false)
assert.equal(publication.customerCreditsMutated, false)
assert.equal(publication.productionReady, false)
assert.equal(verificationCalls, 2)
assert.deepEqual(publication.artifactBindingRef, bindingRef)
assert.ok(await reproducibilityRepository.reread({
  receiptRef: publication.reproducibilityRef,
}))
assert.ok(await imageBuildRepository.rereadCapsuleManifest({
  manifestRef: publication.capsuleManifestRef,
}))

await assert.rejects(publisher.publish({ ...request, command: 'tar -czf' }))
await assert.rejects(publisher.publish({
  ...request,
  confirmationBuildId: primaryId,
}))
await assert.rejects(publisher.publish({
  ...request,
  primaryBuildId: '33333333-3333-4333-8333-333333333333',
}))

const mismatchedConfirmation = createBuild(
  confirmationId,
  '3102',
  'confirmation-etag',
  '2026-08-08T18:01:00.000Z',
  { repositoryTree: '3'.repeat(40) },
)
buildEvidence.set(confirmationId, mismatchedConfirmation)
await assert.rejects(publisher.publish(request))
buildEvidence.set(confirmationId, confirmation)

const substitutedSourceCapsule = createBuild(
  confirmationId,
  '3102',
  'confirmation-etag',
  '2026-08-08T18:01:00.000Z',
  { sourceQualificationCapsuleRef: ref('substituted-source-capsule') },
)
buildEvidence.set(confirmationId, substitutedSourceCapsule)
await assert.rejects(publisher.publish(request))
buildEvidence.set(confirmationId, confirmation)

assert.throws(() => createCanonicalSam31ProductionCapsulePublisher({
  qualificationReleaseReadPort: {} as never,
  ingestReadPort: {} as never,
  artifactBindingReadPort: {} as never,
  buildReadPort: {} as never,
  reproducibilityRepository,
  imageBuildRepository,
  privateCapsuleReadPort: { async readExact() { return null } },
}))

assert.throws(() => sealCanonicalSam31ProductionCapsuleBuilderResult({
  ...structuredClone(primary.builderResult),
  builderResultHash: undefined,
  archiveEntries: [
    ...entries,
    {
      path: 'sam31_private_build_input/checkpoint/sam3.1_multiplex.pt',
      byteLength: 1,
      sha256: '0'.repeat(64),
    },
  ].sort(({ path: left }, { path: right }) => left < right ? -1 : 1),
} as never))

assert.throws(() => sealCanonicalSam31ProductionCapsuleSecurityReview({
  ...structuredClone(primary.securityReview),
  securityReviewHash: undefined,
  infectedFileCount: 1,
} as never))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-capsule-publisher',
  checks: 25,
  finalA100SourceCheckpointQualificationReread: true,
  independentBuildCount: 2,
  exactCapsuleBytesCrc32cMd5AndEntrySetMatched: true,
  bothCapsuleBodiesIndependentlyReread: true,
  independentSecurityReviewsPassed: true,
  vertexArtifactBindingReread: true,
  historicalBatchQualificationCastOrRelabelUsed: false,
  reproducibilityPersistedCreateOnlyAndReread: true,
  manifestPersistedCreateOnlyAndReread: true,
  checkpointIncluded: false,
  modelExecuted: false,
  developerMachineModelInstallPerformed: false,
  imageBuildStarted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createBuild(
  id: string,
  generation: string,
  etag: string,
  reviewedAt: string,
  overrides: {
    readonly repositoryTree?: string
    readonly sourceQualificationCapsuleRef?: ReturnType<typeof ref>
  } = {},
) {
  const builderResult = sealCanonicalSam31ProductionCapsuleBuilderResult({
    schemaVersion: 'weeditpro-sam3_1-production-capsule-builder-result-v2',
    source: 'weeditpro_sam3_1_production_capsule_builder',
    evidenceClass: 'canonical_private_cloud_build',
    buildId: id,
    repositoryCommit: '1'.repeat(40),
    repositoryTree: overrides.repositoryTree ?? '2'.repeat(40),
    sourceBundleRef: ref('sam31-production-source-bundle'),
    sourcePublished: true,
    sourceClean: true,
    sourceCheckpointQualificationRef:
      release.sourceCheckpointQualificationRef,
    artifactBindingRef: bindingRef,
    sourceQualificationCapsuleRef:
      overrides.sourceQualificationCapsuleRef
        ?? sourceQualificationCapsuleRef(),
    sourceQualificationCapsuleExactlyReread: true,
    dockerfileSha256: entryHash(
      'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    ),
    runnerSha256: entryHash(
      'docker/prod/gpu-worker/sam3_1/runner.py',
    ),
    entrypointSha256: entryHash(
      'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
    ),
    sourceProvenanceLockSha256: entryHash(
      'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    ),
    gpuDecodePatchSha256:
      'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    capsuleSha256: capsuleSha,
    capsuleByteLength: 1_024,
    archiveEntries: entries,
    archiveEntrySetSha256: sha256AuthorityValue(entries),
    dependencyWheelCount: 2,
    dependencyWheelManifestSha256: sha256AuthorityValue(entries.filter(
      (entry) => entry.path.startsWith(
        'sam31_private_build_input/dependency-closure/wheelhouse/',
      ),
    )),
    dependencyLockSha256: entryHash(
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
    ),
    dependencyClosureReceiptSha256: entryHash(
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
    ),
    patchApplicationReceiptSha256: entryHash(
      'sam31_private_build_input/source/source-patch-application-receipt.json',
    ),
    cudaForwardCompatIngestReceiptSha256: entryHash(
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
    ),
    artifactBuildBindingRecordHash: binding.bindingHash,
    artifactBuildBindingFileSha256: entryHash(
      'sam31_private_build_input/release-receipts/private-artifact-build-binding.json',
    ),
    sourceCheckpointQualificationRecordHash:
      release.qualification.qualificationHash,
    sourceCheckpointCompatibilityReceiptSha256: entryHash(
      'sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json',
    ),
    checkpointIncluded: false,
    sourceCheckpointQualificationReceiptIncluded: true,
    vertexQualificationEvidenceBound: true,
    historicalBatchQualificationCastOrRelabelUsed: false,
    containsCredentials: false,
    containsCustomerMedia: false,
    networkDependencyInstallRequired: false,
    callerPathUrlCommandImageTagOrBuildArgumentAccepted: false,
  })
  const securityReview = sealCanonicalSam31ProductionCapsuleSecurityReview({
    schemaVersion: 'weeditpro-sam3_1-production-capsule-security-review-v2',
    source: 'weeditpro_sam3_1_production_capsule_security_owner',
    evidenceClass: 'canonical_private_cloud_scan',
    buildId: id,
    builderResultRef:
      canonicalSam31ProductionCapsuleBuilderResultRef(builderResult),
    scannerImageDigest:
      'sha256:51c995ea5e6ef0ee43e2f011f45657acd4ce038dc5d6510852630fa1f5543a20',
    scannerVersion: 'ClamAV 1.4.3/27891/Fri Aug 8 2026',
    signatureCount: 9_000_000,
    scannedFileCount: entries.length,
    infectedFileCount: 0,
    capsuleSha256: capsuleSha,
    capsuleByteLength: 1_024,
    archiveEntrySetSha256: sha256AuthorityValue(entries),
    archiveRecursionEnabled: true,
    scanPassed: true,
    prohibitedEntryScanPassed: true,
    absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: true,
    checkpointIncluded: false,
    qualificationReceiptIncluded: true,
    modelExecuted: false,
    developerMachineInstallPerformed: false,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    productionAuthorityGranted: false,
    reviewedAt,
  })
  return {
    builderResult,
    securityReview,
    coordinate: {
      projectId: 'reeditpro' as const,
      bucketName:
        'reeditpro-production-reeditpro-image-build-inputs' as const,
      objectName:
        `private/image-build-inputs/sam3_1/production/reproducibility/${id}/${capsuleSha}.tar.gz`,
      generation,
      etag,
      byteLength: 1_024,
      sha256: capsuleSha,
      storageContentType: 'application/gzip' as const,
      crc32c: 'AAAAAA==',
      md5Hash: 'BBBBBB==',
    },
  }
}

function createEntries() {
  const repositoryFile = (path: string) => {
    const body = readFileSync(resolve(process.cwd(), path))
    return { path, byteLength: body.byteLength, sha256: sha(body) }
  }
  const fixture = (path: string, byteLength: number, digest: string) => ({
    path,
    byteLength,
    sha256: digest,
  })
  return [
    repositoryFile('docker/prod/gpu-worker/sam3_1/Dockerfile.candidate'),
    repositoryFile('docker/prod/gpu-worker/sam3_1/entrypoint.sh'),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    ),
    repositoryFile('docker/prod/gpu-worker/sam3_1/runner.py'),
    repositoryFile('docker/prod/gpu-worker/sam3_1/source-provenance.lock'),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      37_945_232,
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
      128,
      'a'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb',
      131_485_608,
      '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json',
      128,
      'b'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/python-ingest/einops/einops-ingest-receipt.json',
      1_778,
      'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json',
      1_782,
      'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
      128,
      'c'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz',
      17_211_188,
      '5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz',
      611_767,
      '67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz',
      80_935,
      'dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json',
      128,
      'd'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
      128,
      'e'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture-a.whl',
      128,
      'f'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture-b.whl',
      128,
      '1'.repeat(64),
    ),
    fixture(
      'sam31_private_build_input/release-receipts/private-artifact-build-binding.json',
      Buffer.byteLength(stableAuthorityStringify(binding)),
      sha(Buffer.from(stableAuthorityStringify(binding))),
    ),
    fixture(
      'sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json',
      Buffer.byteLength(stableAuthorityStringify(release.qualification)),
      sha(Buffer.from(stableAuthorityStringify(release.qualification))),
    ),
    fixture(
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar',
      73_605_120,
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    fixture(
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar',
      73_605_120,
      '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
    ),
    fixture(
      'sam31_private_build_input/source/source-patch-application-receipt.json',
      128,
      '2'.repeat(64),
    ),
  ].sort(({ path: left }, { path: right }) =>
    left < right ? -1 : left > right ? 1 : 0)
}

function entryHash(path: string): string {
  const entry = entries.find((item) => item.path === path)
  assert(entry, `Missing production capsule entry: ${path}`)
  return entry.sha256
}

function ref(id: string, digest = '9'.repeat(64)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest}` as const,
  }
}

function sourceQualificationCapsuleRef() {
  const source =
    release.qualification.workerRequest.dependencyClosure.artifactRef
  assert.equal(source.version, 1)
  return {
    id: source.id,
    version: 1 as const,
    contentHash: source.contentHash,
  }
}

function sha(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function createObjectPort() {
  const objects = new Map<string, Buffer>()
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly({ objectPath, body }) {
      const current = objects.get(objectPath)
      if (current) {
        if (!current.equals(body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      objects.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const body = objects.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  }
  return { port, objects }
}
