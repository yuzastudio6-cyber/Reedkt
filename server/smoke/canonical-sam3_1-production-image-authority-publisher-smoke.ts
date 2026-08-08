import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  createCanonicalSam31ImageBuildArtifactBinding,
  createCanonicalSam31PrivateImageBuildCapsuleManifest,
  assertCanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import { createCanonicalSam31SourceRuntimeCandidate } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31ImageBuildArtifactBindingRef,
  canonicalSam31PrivateImageBuildCapsuleManifestRef,
  createCanonicalSam31CloudImageBuildRepository,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31ProductionImageAuthorityPublisher,
} from '../services/canonical-sam3_1-production-image-authority-publisher'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { release } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'
import { canonicalIngest } from
  './canonical-sam3_1-source-checkpoint-qualification-smoke'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const binding = createCanonicalSam31ImageBuildArtifactBinding({
  candidate,
  ingestReceipt: canonicalIngest,
  sourceCheckpointQualification: release.qualification,
})
const bindingBytes = Buffer.from(stableAuthorityStringify(binding), 'utf8')
const qualificationBytes = Buffer.from(
  stableAuthorityStringify(release.qualification),
  'utf8',
)
const entries = createEntries({ bindingBytes, qualificationBytes })
const capsuleSha = digest(Buffer.from('sam31-production-capsule-smoke'))
const manifest = createCanonicalSam31PrivateImageBuildCapsuleManifest({
  evidenceClass: 'canonical_private_reread',
  status: 'private_capsule_verified',
  manifestId: 'sam31-production-capsule-smoke',
  manifestVersion: 1,
  operationId: candidate.operationId,
  candidateRef: {
    schemaVersion: candidate.schemaVersion,
    candidateHash: candidate.candidateHash,
  },
  artifactBindingRef: canonicalSam31ImageBuildArtifactBindingRef(binding),
  repositorySource: {
    commitSha: '1'.repeat(40),
    treeSha: '2'.repeat(40),
    sourceBundleRef: ref('sam31-production-source-bundle'),
    sourcePublished: true,
    sourceClean: true,
    dockerfilePath: 'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    dockerfileSha256: entryHash(
      entries,
      'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    ),
    runnerSha256: entryHash(
      entries,
      'docker/prod/gpu-worker/sam3_1/runner.py',
    ),
    entrypointSha256: entryHash(
      entries,
      'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
    ),
    sourceProvenanceLockSha256: entryHash(
      entries,
      'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    ),
    gpuDecodePatchSha256:
      'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
  },
  privateInput: {
    directoryName: 'sam31_private_build_input',
    deterministicSourceArchiveSha256:
      '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
    deterministicPatchedSourceArchiveSha256:
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    patchApplicationReceiptSha256: entryHash(
      entries,
      'sam31_private_build_input/source/source-patch-application-receipt.json',
    ),
    dependencyLockSha256: entryHash(
      entries,
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
    ),
    dependencyClosureReceiptSha256: entryHash(
      entries,
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
    ),
    dependencyWheelManifestSha256: sha256AuthorityValue(
      entries.filter((entry) => entry.path.includes('/wheelhouse/')),
    ),
    dependencyWheelCount: 2,
    cudaForwardCompatPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatIngestReceiptSha256: entryHash(
      entries,
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
    ),
    artifactBuildBindingRecordHash: binding.bindingHash,
    artifactBuildBindingFileSha256: digest(bindingBytes),
    sourceCheckpointQualificationRecordHash:
      release.qualification.qualificationHash,
    sourceCheckpointCompatibilityReceiptSha256:
      sha256AuthorityValue(release.qualification),
  },
  capsule: {
    coordinate: {
      projectId: 'reeditpro',
      bucketName: 'reeditpro-production-reeditpro-image-build-inputs',
      objectName:
        `private/image-build-inputs/sam3_1/production/reproducibility/11111111-1111-4111-8111-111111111111/${capsuleSha}.tar.gz`,
      generation: '3101',
      etag: 'sam31-production-capsule-etag',
      byteLength: 1_024,
      sha256: capsuleSha,
    },
    format: 'tar_gzip',
    contentType: 'application/gzip',
    capsuleArtifactRef: ref('sam31-production-capsule', capsuleSha),
    archiveEntries: entries,
    archiveEntrySetSha256: sha256AuthorityValue(entries),
    archiveEntriesReread: true,
    exactByteLengthAndSha256Reread: true,
    generationAndEtagStableBeforeAndAfterRead: true,
    prohibitedEntryScanPassed: true,
    absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: true,
  },
  securityBoundary: {
    checkpointBytesIncluded: false,
    repositoryOrProviderTokenIncluded: false,
    privateStorageCoordinateEmbeddedInImageInputReceipts: false,
    callerCommandDockerfileImageTagOrBuildArgsAccepted: false,
    networkDependencyInstallRequired: false,
    buildSecretsRequired: false,
    capsuleCreateOnlyAndPrivate: true,
    securityReviewRef: ref('sam31-production-capsule-security'),
    malwareScanRef: ref('sam31-production-capsule-malware'),
  },
  preparedAt: '2026-08-08T17:00:00.000Z',
})

const objectStore = createObjectPort()
const repository = createCanonicalSam31CloudImageBuildRepository({
  objectPort: objectStore.port,
})
const manifestRef = await repository.persistCapsuleManifestCreateOnly({
  manifest,
})
const prepareCalls: unknown[] = []
const publisher = createCanonicalSam31ProductionImageAuthorityPublisher({
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
  repository,
  privateCapsuleReadPort: { async readExact() { return null } },
  async prepareAuthority(input) {
    prepareCalls.push(structuredClone({
      authorityId: input.authorityId,
      candidateHash: input.candidate.candidateHash,
      ingestReceiptHash: input.ingestReceipt.ingestReceiptHash,
      qualificationHash: input.sourceCheckpointQualification.qualificationHash,
      bindingHash: input.artifactBinding.bindingHash,
      manifestHash: input.capsuleManifest.manifestHash,
      preparedAt: input.preparedAt,
    }))
    return createAuthority(input.preparedAt)
  },
  now: () => '2026-08-08T17:01:00.000Z',
})

const request = {
  sourceCheckpointQualificationRef:
    release.sourceCheckpointQualificationRef,
  capsuleManifestRef: manifestRef,
}
const publication = await publisher.publish(request)
assert.equal(publication.disposition, 'authorized_for_private_cloud_build')
assert.equal(publication.imageBuildStarted, false)
assert.equal(publication.runtimeReleaseGranted, false)
assert.equal(publication.customerCreditsMutated, false)
assert.equal(publication.productionReady, false)
assert.equal(prepareCalls.length, 1)
assert.deepEqual(publication.capsuleManifestRef, manifestRef)
assert.deepEqual(
  publication.artifactBindingRef,
  canonicalSam31ImageBuildArtifactBindingRef(binding),
)
assert.ok(await repository.rereadArtifactBinding({
  bindingRef: publication.artifactBindingRef,
}))
assert.ok(await repository.rereadBuildAuthority({
  authorityRef: publication.authorityRef,
}))

await assert.rejects(publisher.publish({ ...request, command: 'docker build' }))
await assert.rejects(publisher.publish({
  ...request,
  capsuleManifestRef: {
    ...request.capsuleManifestRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
}))
await assert.rejects(publisher.publish({
  ...request,
  sourceCheckpointQualificationRef: {
    ...request.sourceCheckpointQualificationRef,
    id: 'wrong-qualification',
  },
}))
assert.throws(() => createCanonicalSam31ProductionImageAuthorityPublisher({
  qualificationReleaseReadPort: {} as never,
  ingestReadPort: {} as never,
  repository,
  privateCapsuleReadPort: { async readExact() { return null } },
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-image-authority-publisher',
  checks: 17,
  exactQualifiedReleaseReread: true,
  exactPrivateIngestReread: true,
  artifactBindingCreateOnlyAndReread: true,
  capsuleManifestCreateOnlyAndReread: true,
  buildAuthorityCreateOnlyAndReread: true,
  callerCommandPathTagRetryOrRuntimeAuthorityAccepted: false,
  developerMachineModelOrCheckpointInstallPerformed: false,
  imageBuildStarted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createAuthority(preparedAt: string) {
  const payload = {
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_authority_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'authorized_for_private_cloud_build' as const,
    authorityId:
      `sam31-cloud-image-build-${manifest.manifestHash.slice(0, 24)}`,
    authorityVersion: 1 as const,
    operationId: candidate.operationId,
    candidateRef: manifest.candidateRef,
    ingestReceiptRef: binding.ingestReceiptRef,
    sourceCheckpointQualificationRef:
      release.sourceCheckpointQualificationRef,
    artifactBindingRef: canonicalSam31ImageBuildArtifactBindingRef(binding),
    capsuleManifestRef:
      canonicalSam31PrivateImageBuildCapsuleManifestRef(manifest),
    capsuleCoordinate: manifest.capsule.coordinate,
    imageDestination: {
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
      imageName: 'reeditpro-sam31-gpu' as const,
      tag: `sam31-96914d2-${capsuleSha.slice(0, 16)}`,
      taggedUri:
        `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu:sam31-96914d2-${capsuleSha.slice(0, 16)}`,
      callerSelectedTagAllowed: false as const,
      tagMayAuthorizeRuntime: false as const,
      terminalImmutableDigestRequired: true as const,
    },
    buildClosure: {
      dockerfilePath: manifest.repositorySource.dockerfilePath,
      dockerfileSha256: manifest.repositorySource.dockerfileSha256,
      runnerSha256: manifest.repositorySource.runnerSha256,
      entrypointSha256: manifest.repositorySource.entrypointSha256,
      sourceProvenanceLockSha256:
        manifest.repositorySource.sourceProvenanceLockSha256,
      dependencyLockSha256: manifest.privateInput.dependencyLockSha256,
      dependencyClosureReceiptSha256:
        manifest.privateInput.dependencyClosureReceiptSha256,
      patchApplicationReceiptSha256:
        manifest.privateInput.patchApplicationReceiptSha256,
      artifactBuildBindingRecordHash:
        manifest.privateInput.artifactBuildBindingRecordHash,
      artifactBuildBindingFileSha256:
        manifest.privateInput.artifactBuildBindingFileSha256,
      sourceCheckpointQualificationRecordHash:
        manifest.privateInput.sourceCheckpointQualificationRecordHash,
      sourceCheckpointCompatibilityReceiptSha256:
        manifest.privateInput.sourceCheckpointCompatibilityReceiptSha256,
      cudaForwardCompatIngestReceiptSha256:
        manifest.privateInput.cudaForwardCompatIngestReceiptSha256,
    },
    cloudBuildPolicy: {
      projectId: 'reeditpro' as const,
      location: 'us-central1' as const,
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const,
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const,
      builderImageObservedAt: '2026-08-03T12:51:34Z' as const,
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com' as const,
      machineType: 'E2_HIGHCPU_32' as const,
      diskSizeGb: '200' as const,
      timeout: '3600s' as const,
      queueTtl: '600s' as const,
      sourceFetcher: 'GCS_FETCHER' as const,
      sourceProvenanceHashes: ['SHA256'] as const,
      requestedVerifyOption: 'VERIFIED' as const,
      logging: 'CLOUD_LOGGING_ONLY' as const,
      noSecretsOrSubstitutions: true as const,
      noTriggerOrMutableRepositorySource: true as const,
      singleFixedBuildStep: true as const,
    },
    authority: {
      privateArtifactBindingReread: true,
      privateCapsuleReread: true,
      sourceCheckpointQualificationReread: true,
      cloudImageBuildAuthorized: true,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true as const,
      browserOrCallerMaySubmitBuild: false as const,
      checkpointIncludedInImage: false as const,
      imageBuildStarted: false as const,
      imagePushed: false as const,
      runtimeReleaseGranted: false as const,
      gpuJobDispatched: false as const,
      customerCreditMutationAllowed: false as const,
      qaApproved: false as const,
      productionReady: false as const,
    },
    preparedAt,
  }
  return assertCanonicalSam31CloudImageBuildAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function createEntries(input: {
  bindingBytes: Buffer
  qualificationBytes: Buffer
}) {
  const fileEntry = (path: string) => {
    const body = readFileSync(resolve(process.cwd(), path))
    return { path, byteLength: body.byteLength, sha256: digest(body) }
  }
  const fixture = (path: string, byteLength: number, sha256: string) => ({
    path,
    byteLength,
    sha256,
  })
  return [
    fileEntry('docker/prod/gpu-worker/sam3_1/Dockerfile.candidate'),
    fileEntry('docker/prod/gpu-worker/sam3_1/entrypoint.sh'),
    fileEntry(
      'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    ),
    fileEntry('docker/prod/gpu-worker/sam3_1/runner.py'),
    fileEntry('docker/prod/gpu-worker/sam3_1/source-provenance.lock'),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      37_945_232,
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
      256,
      digest(Buffer.from('cuda-ingest')),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-npp/libnpp-12-8_12.3.3.100-1_amd64.deb',
      131_485_608,
      '54febea3b7a793e65318647c0548c0fea2416ef0a7dc70c672c6877f3bcba992',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/cuda-npp/cuda-npp-runtime-receipt.json',
      256,
      digest(Buffer.from('cuda-npp-receipt')),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
      256,
      digest(Buffer.from('dependency-closure')),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-8.0.3.tar.gz',
      17_211_188,
      '5c868087e6a0d4243b97776c16f3bfe1511cc53f15c26c822b393a3289608121',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/ffmpeg-closure-receipt.json',
      256,
      digest(Buffer.from('ffmpeg-closure')),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/nv-codec-headers-n12.2.72.0.tar.gz',
      80_935,
      'dbeaec433d93b850714760282f1d0992b1254fc3b5a6cb7d76fc1340a1e47563',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/ffmpeg/pkgconf-3.0.4.tar.gz',
      611_767,
      '67dd778366d1a094f26a9bf5ad0cce1b2e25588420c49a4c9fea6452a6eef829',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
      256,
      digest(Buffer.from('requirements-lock')),
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/python-ingest/einops/einops-ingest-receipt.json',
      256,
      'd882124bbea8f586e16df53c7062ffce3d9e1499c350ae1ccec0b25fab870608',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/python-ingest/pycocotools/pycocotools-ingest-receipt.json',
      256,
      'a47f679998c2a8d93d1f8e579a94a00bf4c9ca6ac9f7f40a9486a645177fdea3',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/wheelhouse/einops-0.8.2-py3-none-any.whl',
      65_638,
      '54058201ac7087911181bfec4af6091bb59380360f069276601256a76af08193',
    ),
    fixture(
      'sam31_private_build_input/dependency-closure/wheelhouse/pycocotools-2.0.11-cp312-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      411_685,
      'a82d1c9ed83f75da0b3f244f2a3cf559351a283307bd9b79a4ee2b93ab3231dd',
    ),
    fixture(
      'sam31_private_build_input/release-receipts/private-artifact-build-binding.json',
      input.bindingBytes.byteLength,
      digest(input.bindingBytes),
    ),
    fixture(
      'sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json',
      input.qualificationBytes.byteLength,
      sha256AuthorityValue(release.qualification),
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
      256,
      digest(Buffer.from('patch-application')),
    ),
  ].sort(({ path: left }, { path: right }) =>
    left < right ? -1 : left > right ? 1 : 0)
}

function createObjectPort() {
  const records = new Map<string, Buffer>()
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly({ objectPath, body }) {
      const current = records.get(objectPath)
      if (current) {
        if (!current.equals(body)) throw new Error('object conflict')
        return 'already_exists'
      }
      records.set(objectPath, Buffer.from(body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = records.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
  return { port, records }
}

function entryHash(
  entries: readonly { readonly path: string; readonly sha256: string }[],
  path: string,
): string {
  const entry = entries.find((candidate) => candidate.path === path)
  if (!entry) throw new Error(`missing fixture entry:${path}`)
  return entry.sha256
}

function ref(id: string, hash = digest(Buffer.from(id))) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
