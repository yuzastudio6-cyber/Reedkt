import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  createCanonicalSam31AuthorizedTermsAcceptance,
  prepareCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31CloudImageBuildAuthority,
  createCanonicalSam31ImageBuildArtifactBinding,
  createCanonicalSam31PrivateImageBuildCapsuleManifest,
  prepareCanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  prepareCanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  compileCanonicalSam31SourceCheckpointQualification,
  createCanonicalSam31SourceCheckpointQualificationObservation,
  type CanonicalSam31SourceCheckpointQualificationObservation,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  createCanonicalSam31QualificationWorkerEvidenceFixture,
} from './fixtures/canonical-sam3_1-qualification-worker-fixture'
import {
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  compileCanonicalSam31CloudBuildRequestBody,
  createCanonicalSam31CloudImageBuildService,
  type CanonicalSam31CloudImageBuildStatePort,
} from '../services/canonical-sam3_1-cloud-image-build-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { release as qualificationRelease } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'

const candidate = createCanonicalSam31SourceRuntimeCandidate()
const syntheticIngest = await createSyntheticIngest()
const canonicalIngest = canonicalizeIngest(syntheticIngest)
const syntheticQualification = createQualification(
  syntheticIngest,
  'synthetic_contract_fixture',
  false,
)
const canonicalQualification = createQualification(
  canonicalIngest,
  'canonical_private_reread',
  true,
)
const artifactBinding = createCanonicalSam31ImageBuildArtifactBinding({
  candidate,
  ingestReceipt: canonicalIngest,
  sourceCheckpointQualification: canonicalQualification,
})
const syntheticBinding = createCanonicalSam31ImageBuildArtifactBinding({
  candidate,
  ingestReceipt: syntheticIngest,
  sourceCheckpointQualification: syntheticQualification,
})
const { bindingHash: syntheticBindingHash, ...syntheticBindingPayload } =
  syntheticBinding
assert.equal(
  syntheticBindingHash,
  canonicalJsonDigest(syntheticBindingPayload),
)
const bindingFileBytes = Buffer.from(JSON.stringify(syntheticBinding))
const qualificationFileBytes = Buffer.from(
  stableAuthorityStringify(syntheticQualification),
  'utf8',
)
const capsuleFiles = createCapsuleFiles(
  bindingFileBytes,
  qualificationFileBytes,
)
const capsuleArchiveEntries = capsuleFiles.map(([path, bytes]) => ({
  path,
  byteLength: bytes.byteLength,
  sha256: sha(bytes),
}))
const capsuleBytes = createCanonicalTarGz(capsuleFiles)
const capsuleSha = sha(capsuleBytes)
const capsuleCoordinate = {
  projectId: 'reeditpro' as const,
  bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
  objectName:
    `private/image-build-inputs/sam3_1/${capsuleSha}.tar.gz`,
  generation: '3101',
  etag: 'sam31-build-capsule-etag-3101',
  byteLength: capsuleBytes.byteLength,
  sha256: capsuleSha,
}
const capsuleManifest = createCanonicalSam31PrivateImageBuildCapsuleManifest({
  evidenceClass: 'synthetic_contract_fixture',
  status: 'contract_only',
  manifestId: 'sam31-private-image-build-capsule-manifest-1',
  manifestVersion: 1,
  operationId: candidate.operationId,
  candidateRef: {
    schemaVersion: candidate.schemaVersion,
    candidateHash: candidate.candidateHash,
  },
  artifactBindingRef: contentRef(
    'sam31-private-artifact-build-binding',
    syntheticBinding.bindingHash,
  ),
  repositorySource: {
    commitSha: '1'.repeat(40),
    treeSha: '2'.repeat(40),
    sourceBundleRef: ref('sam31-frozen-repository-source-bundle'),
    sourcePublished: false,
    sourceClean: false,
    dockerfilePath: 'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    dockerfileSha256: entrySha(
      capsuleArchiveEntries,
      'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    ),
    runnerSha256: entrySha(
      capsuleArchiveEntries,
      'docker/prod/gpu-worker/sam3_1/runner.py',
    ),
    entrypointSha256: entrySha(
      capsuleArchiveEntries,
      'docker/prod/gpu-worker/sam3_1/entrypoint.sh',
    ),
    sourceProvenanceLockSha256: entrySha(
      capsuleArchiveEntries,
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
    patchApplicationReceiptSha256: entrySha(
      capsuleArchiveEntries,
      'sam31_private_build_input/source/source-patch-application-receipt.json',
    ),
    dependencyLockSha256: entrySha(
      capsuleArchiveEntries,
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
    ),
    dependencyClosureReceiptSha256: entrySha(
      capsuleArchiveEntries,
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
    ),
    dependencyWheelManifestSha256: sha256AuthorityValue(
      capsuleArchiveEntries.filter((entry) => entry.path.startsWith(
        'sam31_private_build_input/dependency-closure/wheelhouse/',
      )),
    ),
    dependencyWheelCount: 2,
    cudaForwardCompatPackageSha256:
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    cudaForwardCompatIngestReceiptSha256: entrySha(
      capsuleArchiveEntries,
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
    ),
    artifactBuildBindingRecordHash: syntheticBinding.bindingHash,
    artifactBuildBindingFileSha256: sha(bindingFileBytes),
    sourceCheckpointQualificationRecordHash:
      syntheticQualification.qualificationHash,
    sourceCheckpointCompatibilityReceiptSha256: entrySha(
      capsuleArchiveEntries,
      'sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json',
    ),
  },
  capsule: {
    coordinate: capsuleCoordinate,
    format: 'tar_gzip',
    contentType: 'application/gzip',
    capsuleArtifactRef: contentRef('sam31-build-capsule', capsuleSha),
    archiveEntries: capsuleArchiveEntries,
    archiveEntrySetSha256: sha256AuthorityValue(capsuleArchiveEntries),
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
    securityReviewRef: ref('sam31-build-capsule-security'),
    malwareScanRef: ref('sam31-build-capsule-malware'),
  },
  preparedAt: '2026-08-03T13:00:00.000Z',
})

const reorderedManifestInput = cloneCapsuleManifestInput(capsuleManifest)
reorderedManifestInput.capsule.archiveEntries = [
  ...reorderedManifestInput.capsule.archiveEntries,
].reverse()
reorderedManifestInput.capsule.archiveEntrySetSha256 = sha256AuthorityValue(
  reorderedManifestInput.capsule.archiveEntries,
)
assert.throws(() => createCanonicalSam31PrivateImageBuildCapsuleManifest(
  reorderedManifestInput,
))

const checkpointInjectedManifestInput = cloneCapsuleManifestInput(
  capsuleManifest,
)
checkpointInjectedManifestInput.capsule.archiveEntries = [
  ...checkpointInjectedManifestInput.capsule.archiveEntries,
  {
    path: 'sam31_private_build_input/checkpoint/sam3.1_multiplex.pt',
    byteLength: 16,
    sha256: sha(Buffer.from('checkpoint bytes')),
  },
].sort(({ path: left }, { path: right }) =>
  left < right ? -1 : left > right ? 1 : 0)
checkpointInjectedManifestInput.capsule.archiveEntrySetSha256 =
  sha256AuthorityValue(
    checkpointInjectedManifestInput.capsule.archiveEntries,
  )
assert.throws(() => createCanonicalSam31PrivateImageBuildCapsuleManifest(
  checkpointInjectedManifestInput,
))

const contractAuthority = await prepareCanonicalSam31CloudImageBuildAuthority({
  authorityId: 'sam31-cloud-image-build-authority-1',
  candidate,
  ingestReceipt: syntheticIngest,
  sourceCheckpointQualification: syntheticQualification,
  artifactBinding: syntheticBinding,
  capsuleManifest,
  privateCapsuleReadPort: {
    async readExact() {
      return {
        generationBeforeRead: capsuleCoordinate.generation,
        etagBeforeRead: capsuleCoordinate.etag,
        contentType: 'application/gzip',
        body: chunked(capsuleBytes),
        generationAfterRead: capsuleCoordinate.generation,
        etagAfterRead: capsuleCoordinate.etag,
      }
    },
  },
  preparedAt: '2026-08-03T13:01:00.000Z',
})
assert.equal(contractAuthority.status, 'contract_only')
assert.equal(contractAuthority.authority.cloudImageBuildAuthorized, false)

const corruptCapsuleBytes = Buffer.from(capsuleBytes)
corruptCapsuleBytes[Math.floor(corruptCapsuleBytes.byteLength / 2)] ^= 0xff
await assert.rejects(() => prepareCanonicalSam31CloudImageBuildAuthority({
  authorityId: 'sam31-corrupt-capsule-authority',
  candidate,
  ingestReceipt: syntheticIngest,
  sourceCheckpointQualification: syntheticQualification,
  artifactBinding: syntheticBinding,
  capsuleManifest,
  privateCapsuleReadPort: capsuleReadPort(
    corruptCapsuleBytes,
    capsuleCoordinate,
  ),
  preparedAt: '2026-08-03T13:01:00.000Z',
}))

const nonRegularCapsuleBytes = createCanonicalTarGz(capsuleFiles, {
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate': 50,
})
const nonRegularCapsuleSha = sha(nonRegularCapsuleBytes)
const nonRegularCoordinate = {
  ...capsuleCoordinate,
  objectName:
    `private/image-build-inputs/sam3_1/${nonRegularCapsuleSha}.tar.gz`,
  generation: '3102',
  etag: 'sam31-build-capsule-etag-3102',
  byteLength: nonRegularCapsuleBytes.byteLength,
  sha256: nonRegularCapsuleSha,
}
const nonRegularManifestInput = cloneCapsuleManifestInput(capsuleManifest)
nonRegularManifestInput.capsule.coordinate = nonRegularCoordinate
nonRegularManifestInput.capsule.capsuleArtifactRef = contentRef(
  'sam31-non-regular-build-capsule',
  nonRegularCapsuleSha,
)
const nonRegularManifest =
  createCanonicalSam31PrivateImageBuildCapsuleManifest(
    nonRegularManifestInput,
  )
await assert.rejects(() => prepareCanonicalSam31CloudImageBuildAuthority({
  authorityId: 'sam31-non-regular-capsule-authority',
  candidate,
  ingestReceipt: syntheticIngest,
  sourceCheckpointQualification: syntheticQualification,
  artifactBinding: syntheticBinding,
  capsuleManifest: nonRegularManifest,
  privateCapsuleReadPort: capsuleReadPort(
    nonRegularCapsuleBytes,
    nonRegularCoordinate,
  ),
  preparedAt: '2026-08-03T13:01:00.000Z',
}))

const authority = canonicalizeBuildAuthority(contractAuthority)
assert.equal(authority.status, 'authorized_for_private_cloud_build')
assert.equal(authority.authority.cloudImageBuildAuthorized, true)
assert.equal(authority.authority.checkpointIncludedInImage, false)
assert.equal(
  artifactBinding.privacyBoundary.sourceOrCheckpointStorageCoordinateIncluded,
  false,
)

const buildBody = compileCanonicalSam31CloudBuildRequestBody(authority)
const serializedBuildBody = JSON.stringify(buildBody)
assert(!serializedBuildBody.includes('sam3.1_multiplex.pt'))
assert(!serializedBuildBody.includes('HUGGINGFACE_TOKEN'))
assert(!serializedBuildBody.includes('MODEL_WEIGHT_ACCESS_TOKEN'))
assert(!serializedBuildBody.includes('secretEnv'))
assert(!serializedBuildBody.includes('availableSecrets'))
assert(serializedBuildBody.includes('--network=none'))
assert(serializedBuildBody.includes(
  'SAM31_PRIVATE_ARTIFACT_BUILD_BINDING_FILE_SHA256=',
))
assert(serializedBuildBody.includes(
  'SAM31_SOURCE_CHECKPOINT_QUALIFICATION_HASH=',
))
assert(serializedBuildBody.includes(capsuleCoordinate.generation))
assert(serializedBuildBody.includes(
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
))

const buildId = '11111111-1111-4111-8111-111111111111'
let cloudCalls = 0
let capturedPostBody: Readonly<Record<string, unknown>> | undefined
const state = createStatePort()
const qualificationReleaseReadPort = {
  async rereadQualificationRelease() {
    return structuredClone(qualificationRelease)
  },
}
const service = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return structuredClone(authority)
    },
  },
  qualificationReleaseReadPort,
  statePort: state.port,
  authenticatedTransport: {
    async request(request) {
      cloudCalls += 1
      if (request.method === 'POST') {
        capturedPostBody = request.body
        return {
          status: 200,
          json: {
            name: `operations/build/us-central1/${buildId}`,
            metadata: {
              build: {
                id: buildId,
                name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
                projectId: 'reeditpro',
              },
            },
          },
        }
      }
      return {
        status: 200,
        json: successfulBuildResource(
          buildId,
          capturedPostBody ?? buildBody,
          authority.imageDestination.taggedUri,
        ),
      }
    },
  },
  now: () => '2026-08-03T13:02:00.000Z',
})
const authorityRef = {
  id: authority.authorityId,
  version: authority.authorityVersion,
  contentHash: `sha256:${authority.authorityHash}` as const,
}
const submission = await service.startOneImageBuild({ authorityRef })
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.durableAuthorityConsumptionCreated, true)
assert.equal(submission.durableSubmissionObservationCreated, true)
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(submission.imageBuildKnownStarted, true)
assert.equal(submission.imagePushKnownCompleted, false)
assert.equal(cloudCalls, 1)
assert.equal(
  assertCanonicalSam31CloudImageBuildSubmission(submission).submissionHash,
  submission.submissionHash,
)

const duplicate = await service.startOneImageBuild({ authorityRef })
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(duplicate.providerOutcome, 'not_executed')
assert.equal(cloudCalls, 1)

const terminal = await service.observeOneImageBuild({
  authority,
  submission,
})
assert.equal(
  terminal.disposition,
  'image_built_pending_scan_signature_and_gpu_qualification',
)
assert.equal(terminal.cloudBuildStatus, 'SUCCESS')
assert.equal(terminal.exactBuildConfigurationEchoVerified, true)
assert.equal(terminal.exactStorageGenerationProvenanceVerified, true)
assert.equal(terminal.imageBuiltAndPushed, true)
assert.equal(terminal.imageScanPassed, false)
assert.equal(terminal.imageSignatureVerified, false)
assert.equal(terminal.a100RuntimeQualified, false)
assert.equal(terminal.l4RuntimeQualified, false)
assert.equal(terminal.runtimeReleaseGranted, false)
assert.equal(terminal.productionReady, false)
assert.equal(
  assertCanonicalSam31CloudImageBuildTerminalObservation(terminal)
    .observationHash,
  terminal.observationHash,
)

const contractSubmission = rebindSubmissionAuthority(
  submission,
  contractAuthority,
)
const contractTerminal = rebindTerminalLineage(
  terminal,
  contractAuthority,
  contractSubmission,
)
const contractSupplyChain =
  await prepareCanonicalSam31CloudImageSupplyChainRelease({
    releaseId: 'sam31-image-supply-chain-contract-fixture',
    authority: contractAuthority,
    submission: contractSubmission,
    terminalObservation: contractTerminal,
    evidenceReadPort: {
      async rereadExact(request) {
        assert.equal(
          request.immutableImageDigest,
          contractTerminal.immutableImageDigest,
        )
        const imageDigest = contractTerminal.immutableImageDigest
        assert(imageDigest)
        const sbomSha = sha(Buffer.from('synthetic SPDX SBOM'))
        return {
          evidenceClass: 'synthetic_contract_fixture',
          imageMetadata: {
            projectId: 'reeditpro',
            region: 'us-central1',
            repository:
              'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers',
            packageResource: contractTerminal.artifactRegistryPackage,
            immutableImageUri: contractTerminal.immutableImageUri,
            immutableImageDigest: imageDigest,
            containerManifestMediaType:
              'application/vnd.oci.image.manifest.v1+json',
            exactDigestReread: false,
            mutableTagUsedAsAuthority: false,
          },
          sbom: {
            format: 'spdx_2_3_json',
            artifactRef: contentRef('sam31-contract-sbom', sbomSha),
            contentSha256: sbomSha,
            imageDigest,
            generatorImageRef: ref('sam31-contract-sbom-generator'),
            completeOsAndApplicationPackageInventory: false,
            exactArtifactReread: false,
          },
          vulnerabilityScan: {
            scanner: 'google_artifact_analysis',
            scanRef: ref('sam31-contract-vulnerability-scan'),
            imageDigest,
            scanCompletedAt: '2026-08-03T13:02:30.000Z',
            vulnerabilityDatabaseUpdatedAt: '2026-08-03T12:30:00.000Z',
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            unknownSeverityCount: 0,
            exactOccurrencesReread: false,
            securityReviewRef: ref('sam31-contract-security-review'),
            securityReviewApprovedForPrivateGpuQualification: false,
          },
          signature: {
            scheme: 'cosign_kms_sha256',
            signatureRef: ref('sam31-contract-signature'),
            imageDigest,
            kmsKeyVersionResource:
              'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/1',
            signerServiceAccount:
              'reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com',
            exactSignatureVerificationPassed: false,
          },
          provenance: {
            predicateType: 'https://slsa.dev/provenance/v1',
            attestationRef: ref('sam31-contract-slsa-provenance'),
            imageDigest,
            cloudBuildId: contractTerminal.cloudBuildId,
            cloudBuildResource: contractTerminal.cloudBuildResource,
            buildAuthorityRef: request.buildAuthorityRef,
            buildSubmissionRef: request.buildSubmissionRef,
            buildRequestHash: contractSubmission.buildRequestHash,
            sourceBucket: contractAuthority.capsuleCoordinate.bucketName,
            sourceObject: contractAuthority.capsuleCoordinate.objectName,
            sourceGeneration: contractAuthority.capsuleCoordinate.generation,
            sourceSha256: contractAuthority.capsuleCoordinate.sha256,
            exactAttestationRereadAndVerified: false,
          },
        }
      },
    },
    qualifiedAt: '2026-08-03T13:03:00.000Z',
  })
assert.equal(contractSupplyChain.status, 'contract_only')
assert.equal(
  contractSupplyChain.authority.imageSupplyChainQualified,
  false,
)
assert.equal(contractSupplyChain.authority.runtimeReleaseGranted, false)
assert.equal(contractSupplyChain.authority.checkpointIncludedInImage, false)
assert.equal(
  assertCanonicalSam31CloudImageSupplyChainRelease(contractSupplyChain)
    .releaseHash,
  contractSupplyChain.releaseHash,
)

let missingReleaseCloudCalls = 0
const missingReleaseService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return structuredClone(authority)
    },
  },
  qualificationReleaseReadPort: {
    async rereadQualificationRelease() {
      return null
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      missingReleaseCloudCalls += 1
      throw new Error('Missing release must not reach Cloud Build.')
    },
  },
  now: () => '2026-08-03T13:03:00.000Z',
})
assert.equal(
  (await missingReleaseService.startOneImageBuild({ authorityRef }))
    .disposition,
  'rejected_before_creation',
)
assert.equal(missingReleaseCloudCalls, 0)

const tamperedAuthority = structuredClone(authority)
tamperedAuthority.imageDestination.tag =
  'sam31-96914d2-0000000000000000' as never
const tamperedService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return tamperedAuthority
    },
  },
  qualificationReleaseReadPort,
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      throw new Error('Tampered authority must not reach Cloud Build.')
    },
  },
  now: () => '2026-08-03T13:03:00.000Z',
})
assert.equal(
  (await tamperedService.startOneImageBuild({ authorityRef })).disposition,
  'rejected_before_creation',
)

let hostileGetterInvoked = false
const hostileAuthority = new Proxy({}, {
  ownKeys() {
    hostileGetterInvoked = true
    throw new Error('hostile authority')
  },
})
const hostileService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return hostileAuthority as never
    },
  },
  qualificationReleaseReadPort,
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      throw new Error('Hostile authority must not reach Cloud Build.')
    },
  },
  now: () => '2026-08-03T13:04:00.000Z',
})
assert.equal(
  (await hostileService.startOneImageBuild({ authorityRef })).disposition,
  'rejected_before_creation',
)
assert.equal(hostileGetterInvoked, true)

let unknownCalls = 0
const unknownState = createStatePort()
const unknownService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return structuredClone(authority)
    },
  },
  qualificationReleaseReadPort,
  statePort: unknownState.port,
  authenticatedTransport: {
    async request() {
      unknownCalls += 1
      throw new Error('network outcome unknown')
    },
  },
  now: () => '2026-08-03T13:05:00.000Z',
})
const unknown = await unknownService.startOneImageBuild({ authorityRef })
assert.equal(unknown.disposition, 'outcome_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(
  (await unknownService.startOneImageBuild({ authorityRef })).disposition,
  'rejected_before_creation',
)
assert.equal(unknownCalls, 1)

let knownBuildCalls = 0
const lostSubmissionBaseState = createStatePort()
const lostSubmissionService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return structuredClone(authority)
    },
  },
  qualificationReleaseReadPort,
  statePort: {
    ...lostSubmissionBaseState.port,
    async persistSubmissionCreateOnly() {
      return false
    },
  },
  authenticatedTransport: {
    async request(request) {
      knownBuildCalls += 1
      assert.equal(request.method, 'POST')
      return {
        status: 200,
        json: {
          name: `operations/build/us-central1/${buildId}`,
          metadata: {
            build: {
              id: buildId,
              name:
                `projects/reeditpro/locations/us-central1/builds/${buildId}`,
              projectId: 'reeditpro',
            },
          },
        },
      }
    },
  },
  now: () => '2026-08-03T13:05:30.000Z',
})
const knownStartedButNotDurable =
  await lostSubmissionService.startOneImageBuild({ authorityRef })
assert.equal(knownStartedButNotDurable.disposition, 'outcome_unknown')
assert.equal(knownStartedButNotDurable.providerOutcome, 'executed')
assert.equal(knownStartedButNotDurable.cloudBuildId, buildId)
assert.equal(knownStartedButNotDurable.imageBuildKnownStarted, true)
assert.equal(
  knownStartedButNotDurable.durableSubmissionObservationCreated,
  false,
)
assert.equal(knownStartedButNotDurable.automaticRetryAllowed, false)
assert.equal(knownBuildCalls, 1)

const wrongSourceState = createStatePort()
const wrongSourceService = createCanonicalSam31CloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() {
      return structuredClone(authority)
    },
  },
  qualificationReleaseReadPort,
  statePort: wrongSourceState.port,
  authenticatedTransport: {
    async request(request) {
      if (request.method === 'POST') {
        return {
          status: 200,
          json: {
            name: `operations/build/us-central1/${buildId}`,
            metadata: {
              build: {
                id: buildId,
                name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
                projectId: 'reeditpro',
              },
            },
          },
        }
      }
      const body = successfulBuildResource(
        buildId,
        buildBody,
        authority.imageDestination.taggedUri,
      )
      body.source.storageSource.generation = '9999'
      body.sourceProvenance.resolvedStorageSource.generation = '9999'
      return { status: 200, json: body }
    },
  },
  now: () => '2026-08-03T13:06:00.000Z',
})
const wrongSourceSubmission = await wrongSourceService.startOneImageBuild({
  authorityRef,
})
assert.equal(
  (await wrongSourceService.observeOneImageBuild({
    authority,
    submission: wrongSourceSubmission,
  })).disposition,
  'outcome_unknown',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-cloud-image-build',
  checks: 77,
  qualificationReleaseRereadRequired: true,
  cloudBuildSubmitted: submission.disposition === 'submitted',
  exactStorageGenerationProvenanceVerified:
    terminal.exactStorageGenerationProvenanceVerified,
  checkpointIncludedInImage: authority.authority.checkpointIncludedInImage,
  automaticRetryAllowed: submission.automaticRetryAllowed,
  imageScanPassed: terminal.imageScanPassed,
  a100RuntimeQualified: terminal.a100RuntimeQualified,
  l4RuntimeQualified: terminal.l4RuntimeQualified,
  productionReady: terminal.productionReady,
  authorityHash: authority.authorityHash,
  terminalObservationHash: terminal.observationHash,
}))

function createQualification(
  ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt,
  evidenceClass:
    | 'synthetic_contract_fixture'
    | 'canonical_private_reread',
  admitted: boolean,
) {
  const keySetHash = sha(Buffer.from('sam31-build-key-set'))
  const observation: CanonicalSam31SourceCheckpointQualificationObservation = {
    evidenceClass,
    qualificationId: `sam31-build-qualification-${evidenceClass}`,
    qualificationVersion: 1,
    qualificationJobRef: ref('sam31-build-qualification-job'),
    qualificationAttemptRef: ref('sam31-build-qualification-attempt'),
    qualificationResultRuntimeRef: ref('sam31-build-qualification-result'),
    qualificationLogRef: ref('sam31-build-qualification-log'),
    qualificationJobTerminalObservationRef:
      ref('sam31-build-qualification-job-terminal'),
    internalCostReceiptRef: ref('sam31-build-qualification-cost'),
    qualificationImageRef: ref('sam31-build-qualification-image'),
    qualificationImageSupplyChainReleaseRef:
      ref('sam31-build-qualification-image-release'),
    qualificationImageDigest:
      `sha256:${sha(Buffer.from('sam31-build-qualification-image'))}`,
    qualificationJobRuntimeImageDigest:
      `sha256:${sha(Buffer.from('sam31-build-qualification-image'))}`,
    qualificationJobSucceeded: admitted,
    qualificationJobNetworkEgressDisabled: admitted,
    qualificationJobAutomaticRetryCount: 0,
    qualificationRequestObjectReread: admitted,
    qualificationRequestCheckpointAndFixtureMountsReadOnly: admitted,
    qualificationResultMountCreateOnly: admitted,
    qualificationResultObjectCreateOnlyAndReread: admitted,
    dependencyClosureRef: ref('sam31-build-dependency-closure'),
    dependencyLockSha256: sha(Buffer.from('sam31-build-dependency-lock')),
    dependencyClosureReceiptSha256:
      sha(Buffer.from('sam31-build-dependency-receipt')),
    dependencyWheelManifestSha256:
      sha(Buffer.from('sam31-build-wheel-manifest')),
    patchApplicationReceiptRef: ref('sam31-build-patch-receipt'),
    patchedSourceArchiveRef: contentRef(
      'sam31-build-patched-source',
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    ),
    patchedSourceArchiveSha256:
      'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
    sourceCodeSecurityReviewRef: ref('sam31-build-source-review'),
    checkpointWeightsOnlyInspectionRef:
      ref('sam31-build-checkpoint-inspection'),
    deterministicProbeFixtureRef: ref('sam31-build-probe-fixture'),
    deterministicProbeResultRef: ref('sam31-build-probe-result'),
    securityAndCompliance: {
      sourceLicenseReviewedForApprovedUse: admitted,
      checkpointLicenseReviewedForApprovedUse: admitted,
      privacyReviewApprovedForPrivateQualification: admitted,
      tradeControlsReviewApprovedForPrivateQualification: admitted,
      sourceMalwareScanPassed: admitted,
      checkpointMalwareScanPassed: admitted,
      sourceStaticSecurityReviewPassed: admitted,
      checkpointWeightsOnlyLoadPassed: admitted,
      checkpointTensorAndMetadataAllowlistPassed: admitted,
      executablePickleTrustGranted: false,
      checkpointRedistributionAuthorized: false,
    },
    qualificationRuntime: {
      executionTarget: 'google_cloud_batch_a2_ultra_job',
      machineType: 'a2-ultragpu-1g',
      accelerator: 'nvidia_a100_80gb',
      allocatedGpuCount: 1,
      baseImageDigest:
        'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca',
      pythonVersion: '3.12',
      torchVersion: '2.10.0',
      torchvisionVersion: '0.25.0',
      torchcodecVersion: '0.10.0',
      cudaVersion: '12.8',
      fixedBuilder: 'build_sam3_multiplex_video_predictor',
      networkEgressAllowed: false,
      developerMachineExecutionAllowed: false,
      callerCommandModuleClassModelOrCheckpointAccepted: false,
      sourceCheckpointAndDependencyMountsReadOnly: true,
      automaticRetryAfterUnknownOutcomeAllowed: false,
    },
    compatibilityProbe: {
      exactSourceArchiveReread: admitted,
      exactPatchedSourceArchiveReread: admitted,
      exactCheckpointRereadBeforeAndAfter: admitted,
      exactDependencyWheelAndNativeClosureReread: admitted,
      sourcePatchApplicationReceiptReread: admitted,
      weightsOnlyCheckpointInspectionExecuted: admitted,
      fixedBuilderImportedFromPinnedSource: admitted,
      fixedBuilderCalledExactlyOnce: admitted,
      checkpointLoadedExactlyOnce: admitted,
      strictCheckpointLoadRequested: admitted,
      missingCheckpointKeyCount: 0,
      unexpectedCheckpointKeyCount: 0,
      checkpointKeyCount: admitted ? 257 : 0,
      modelStateKeyCount: admitted ? 257 : 0,
      checkpointKeySetSha256: admitted ? keySetHash : '0'.repeat(64),
      modelStateKeySetSha256: admitted ? keySetHash : '0'.repeat(64),
      checkpointAndModelKeySetsExact: admitted,
      startSessionAddPromptPropagateAndCloseExecuted: admitted,
      actualCudaModelInferenceExecuted: admitted,
      bfloat16AutocastExecuted: admitted,
      outputMaskShapeMatchedProbeFrames: admitted,
      outputObjectIdsMatchedProbePrompt: admitted,
      outputMasksWereCudaTensorsBeforeSerialization: admitted,
      deterministicRepeatedProbeRunCount: admitted ? 3 : 0,
      deterministicOutputDigestSha256: admitted
        ? sha(Buffer.from('sam31-build-deterministic-probe-output'))
        : '0'.repeat(64),
      deterministicOutputDigestMatchedEveryRun: admitted,
      cpuOnlyModelExecutionObserved: false,
      quantizationOrResolutionReductionUsed: false,
      providerInferenceExecuted: false,
    },
    qualifiedAt: '2026-08-03T12:45:00.000Z',
  }
  if (evidenceClass === 'canonical_private_reread') {
    const workerEvidence =
      createCanonicalSam31QualificationWorkerEvidenceFixture({
        candidate,
        ingestReceipt,
        qualificationId: observation.qualificationId,
        qualifiedAt: observation.qualifiedAt,
      })
    return compileCanonicalSam31SourceCheckpointQualification({
      candidate,
      ingestReceipt,
      observation:
        createCanonicalSam31SourceCheckpointQualificationObservation(
          workerEvidence,
        ),
      workerEvidence,
    })
  }
  return compileCanonicalSam31SourceCheckpointQualification({
    candidate,
    ingestReceipt,
    observation,
  })
}

async function createSyntheticIngest() {
  const sourceBytes = Buffer.from('synthetic SAM 3.1 source')
  const checkpointBytes = Buffer.from('synthetic SAM 3.1 checkpoint')
  const sourceCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName: 'private/model-artifacts/sam3_1/source/source.tar',
    generation: '11',
    etag: 'source-etag',
    byteLength: sourceBytes.byteLength,
    sha256: sha(sourceBytes),
  }
  const checkpointCoordinate = {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-model-artifacts' as const,
    objectName:
      'private/model-artifacts/sam3_1/checkpoint/sam3.1_multiplex.pt',
    generation: '12',
    etag: 'checkpoint-etag',
    byteLength: checkpointBytes.byteLength,
    sha256: sha(checkpointBytes),
  }
  const terms = createCanonicalSam31AuthorizedTermsAcceptance({
    evidenceClass: 'synthetic_contract_fixture',
    acceptanceRecordId: 'sam31-synthetic-terms',
    acceptanceRecordVersion: 1,
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-03T12:00:00.000Z',
    acceptedByAuthorizedOrganizationRepresentative: true,
    authorizedRepresentativeAuthorityRereadVerified: true,
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    officialRepositoryAccessGrantedAndReread: true,
    automatedAcceptanceUsed: false,
    thirdPartyMirrorUsed: false,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-legal'),
    privacyReviewRef: ref('sam31-privacy'),
    tradeControlsReviewRef: ref('sam31-trade'),
    termsEvidenceRef: ref('sam31-terms'),
    browserOrWorkerSecretIncluded: false,
  })
  return prepareCanonicalSam31PrivateArtifactIngestReceipt({
    ingestReceiptId: 'sam31-synthetic-ingest',
    evidenceClass: 'synthetic_contract_fixture',
    candidate,
    termsAcceptance: terms,
    officialArtifactPublicationRef: {
      ...ref('sam31-official-artifact-publication'),
      schemaVersion:
        'canonical-sam3_1-official-artifact-publication-receipt-v1' as const,
    },
    sourceArchiveCoordinate: sourceCoordinate,
    sourceArchiveArtifactRef: contentRef('source', sourceCoordinate.sha256),
    sourceLicenseRef: ref('source-license'),
    sourceSecurityReviewRef: ref('source-security'),
    sourceMalwareScanRef: ref('source-malware'),
    sourceUnsignedRevisionAcceptanceRef: ref('source-unsigned-review'),
    checkpointCoordinate,
    checkpointArtifactRef: contentRef(
      'checkpoint', checkpointCoordinate.sha256,
    ),
    checkpointManifestRef: ref('checkpoint-manifest'),
    checkpointLicenseRef: ref('checkpoint-license'),
    checkpointSecurityReviewRef: ref('checkpoint-security'),
    checkpointMalwareScanRef: ref('checkpoint-malware'),
    privateObjectReadPort: {
      async readExact(coordinate) {
        const body = coordinate.objectName === sourceCoordinate.objectName
          ? sourceBytes
          : checkpointBytes
        return {
          generationBeforeRead: coordinate.generation,
          etagBeforeRead: coordinate.etag,
          contentType: coordinate.objectName.endsWith('.tar')
            ? 'application/x-tar'
            : 'application/octet-stream',
          body,
          generationAfterRead: coordinate.generation,
          etagAfterRead: coordinate.etag,
        }
      },
    },
    preparedAt: '2026-08-03T12:05:00.000Z',
  })
}

function canonicalizeIngest(
  value: Awaited<ReturnType<typeof createSyntheticIngest>>,
) {
  const clone = structuredClone(value) as Record<string, unknown> & {
    evidenceClass: string
    status: string
    sourceArchive: {
      coordinate: { byteLength: number; sha256: string }
      artifactRef: { contentHash: string }
    }
    checkpoint: {
      coordinate: { byteLength: number; sha256: string }
      artifactRef: { contentHash: string }
    }
    authority: {
      canonicalTermsAcceptanceObserved: boolean
      imageBuildReviewEligible: boolean
    }
    ingestReceiptHash?: string
  }
  delete clone.ingestReceiptHash
  clone.evidenceClass = 'canonical_private_reread'
  clone.status = 'ready_for_immutable_image_build_review'
  clone.sourceArchive.coordinate.byteLength = 73_605_120
  clone.sourceArchive.coordinate.sha256 =
    '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
  clone.sourceArchive.artifactRef.contentHash =
    `sha256:${clone.sourceArchive.coordinate.sha256}`
  clone.checkpoint.coordinate.byteLength = 3_500_000_000
  clone.checkpoint.coordinate.sha256 = sha(Buffer.from('canonical-checkpoint'))
  clone.checkpoint.artifactRef.contentHash =
    `sha256:${clone.checkpoint.coordinate.sha256}`
  clone.authority.canonicalTermsAcceptanceObserved = true
  clone.authority.imageBuildReviewEligible = true
  return assertCanonicalSam31PrivateArtifactIngestReceipt({
    ...clone,
    ingestReceiptHash: sha256AuthorityValue(clone),
  })
}

function canonicalizeBuildAuthority(
  value: Awaited<ReturnType<
    typeof prepareCanonicalSam31CloudImageBuildAuthority
  >>,
) {
  const clone = structuredClone(value) as Record<string, unknown> & {
    evidenceClass: string
    status: string
    sourceCheckpointQualificationRef: {
      id: string
      version: 1
      schemaVersion: string
      contentHash: string
    }
    buildClosure: {
      sourceCheckpointQualificationRecordHash: string
    }
    authority: {
      privateArtifactBindingReread: boolean
      privateCapsuleReread: boolean
      sourceCheckpointQualificationReread: boolean
      cloudImageBuildAuthorized: boolean
    }
    authorityHash?: string
  }
  delete clone.authorityHash
  clone.evidenceClass = 'canonical_private_reread'
  clone.status = 'authorized_for_private_cloud_build'
  clone.authority.privateArtifactBindingReread = true
  clone.authority.privateCapsuleReread = true
  clone.authority.sourceCheckpointQualificationReread = true
  clone.authority.cloudImageBuildAuthorized = true
  clone.sourceCheckpointQualificationRef = structuredClone(
    qualificationRelease.sourceCheckpointQualificationRef,
  )
  clone.buildClosure.sourceCheckpointQualificationRecordHash =
    qualificationRelease.qualification.qualificationHash
  return assertCanonicalSam31CloudImageBuildAuthority({
    ...clone,
    authorityHash: sha256AuthorityValue(clone),
  })
}

function rebindSubmissionAuthority(
  value: typeof submission,
  buildAuthority: typeof contractAuthority,
) {
  const clone = structuredClone(value) as Record<string, unknown> & {
    authorityRef: ReturnType<typeof buildAuthorityRef>
    submissionHash?: string
  }
  delete clone.submissionHash
  clone.authorityRef = buildAuthorityRef(buildAuthority)
  return assertCanonicalSam31CloudImageBuildSubmission({
    ...clone,
    submissionHash: sha256AuthorityValue(clone),
  })
}

function rebindTerminalLineage(
  value: typeof terminal,
  buildAuthority: typeof contractAuthority,
  buildSubmission: typeof submission,
) {
  const clone = structuredClone(value) as Record<string, unknown> & {
    authorityRef: ReturnType<typeof buildAuthorityRef>
    submissionRef: ReturnType<typeof ref>
    observationHash?: string
  }
  delete clone.observationHash
  clone.authorityRef = buildAuthorityRef(buildAuthority)
  clone.submissionRef = contentRef(
    `sam31-cloud-build-submission-${buildSubmission.submissionHash.slice(0, 24)}`,
    buildSubmission.submissionHash,
  )
  return assertCanonicalSam31CloudImageBuildTerminalObservation({
    ...clone,
    observationHash: sha256AuthorityValue(clone),
  })
}

function buildAuthorityRef(
  value: typeof contractAuthority,
) {
  return {
    id: value.authorityId,
    version: value.authorityVersion,
    contentHash: `sha256:${value.authorityHash}` as const,
  }
}

function successfulBuildResource(
  id: string,
  body: Readonly<Record<string, unknown>>,
  taggedImageUri: string,
) {
  const source = structuredClone(body.source) as {
    storageSource: Record<string, string>
  }
  return {
    id,
    name: `projects/reeditpro/locations/us-central1/builds/${id}`,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    source,
    steps: structuredClone(body.steps),
    images: structuredClone(body.images),
    timeout: body.timeout,
    queueTtl: body.queueTtl,
    options: structuredClone(body.options),
    serviceAccount: body.serviceAccount,
    tags: structuredClone(body.tags),
    warnings: [],
    sourceProvenance: {
      resolvedStorageSource: structuredClone(source.storageSource),
    },
    results: {
      images: [{
        name: taggedImageUri,
        digest:
          `sha256:${sha(Buffer.from('sam31-built-immutable-image'))}`,
        artifactRegistryPackage:
          'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu',
      }],
    },
  }
}

function createStatePort() {
  const consumed = new Set<string>()
  const submissions = new Set<string>()
  const terminals = new Set<string>()
  const port: CanonicalSam31CloudImageBuildStatePort = {
    async consumeAuthorityCreateOnly(input) {
      const key = `${input.authorityRef.contentHash}:${input.buildRequestHash}`
      if (consumed.has(key)) return false
      consumed.add(key)
      return true
    },
    async persistSubmissionCreateOnly({ submission }) {
      if (submissions.has(submission.submissionHash)) return false
      submissions.add(submission.submissionHash)
      return true
    },
    async persistTerminalObservationCreateOnly({ observation }) {
      if (terminals.has(observation.observationHash)) return false
      terminals.add(observation.observationHash)
      return true
    },
  }
  return { port, consumed, submissions, terminals }
}

function createCapsuleFiles(
  bindingFileBytes: Buffer,
  qualificationFileBytes: Buffer,
): Array<
  readonly [string, Buffer]
> {
  const repositoryFile = (path: string): readonly [string, Buffer] => [
    path,
    readFileSync(resolve(process.cwd(), path)),
  ]
  const files: Array<readonly [string, Buffer]> = [
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
    ),
    repositoryFile('docker/prod/gpu-worker/sam3_1/entrypoint.sh'),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/patches/0001-reeditpro-gpu-decode.patch',
    ),
    repositoryFile('docker/prod/gpu-worker/sam3_1/runner.py'),
    repositoryFile(
      'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
    ),
    [
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-compat-12-8_570.211.01-0ubuntu1_amd64.deb',
      Buffer.from('synthetic cuda forward compatibility package'),
    ],
    [
      'sam31_private_build_input/dependency-closure/cuda-forward-compat/cuda-forward-compat-ingest-receipt.json',
      Buffer.from('{"fixture":"cuda-ingest"}'),
    ],
    [
      'sam31_private_build_input/dependency-closure/dependency-closure-receipt.json',
      Buffer.from('{"fixture":"dependency-closure"}'),
    ],
    [
      'sam31_private_build_input/dependency-closure/requirements.lock.txt',
      Buffer.from('fixture==1.0 --hash=sha256:fixture'),
    ],
    [
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture_a-1.0-py3-none-any.whl',
      Buffer.from('synthetic wheel a'),
    ],
    [
      'sam31_private_build_input/dependency-closure/wheelhouse/fixture_b-1.0-py3-none-any.whl',
      Buffer.from('synthetic wheel b'),
    ],
    [
      'sam31_private_build_input/release-receipts/private-artifact-build-binding.json',
      bindingFileBytes,
    ],
    [
      'sam31_private_build_input/release-receipts/source-checkpoint-compatibility-receipt.json',
      qualificationFileBytes,
    ],
    [
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543-reeditpro-gpu-decode.tar',
      Buffer.from('synthetic patched source archive'),
    ],
    [
      'sam31_private_build_input/source/sam3-96914d2425f90a64f45ca977c2b5165418099543.tar',
      Buffer.from('synthetic source archive'),
    ],
    [
      'sam31_private_build_input/source/source-patch-application-receipt.json',
      Buffer.from('{"fixture":"patch-application"}'),
    ],
  ]
  return files.sort(
    ([left], [right]) => left < right ? -1 : left > right ? 1 : 0,
  )
}

function createCanonicalTarGz(
  entries: readonly (readonly [string, Buffer])[],
  entryTypeByPath: Readonly<Record<string, number>> = {},
): Buffer {
  const blocks: Buffer[] = []
  for (const [path, content] of entries) {
    const header = Buffer.alloc(512)
    const { name, prefix } = splitTarPath(path)
    writeTarText(header, 0, 100, name)
    writeTarOctal(header, 100, 8, 0o444)
    writeTarOctal(header, 108, 8, 0)
    writeTarOctal(header, 116, 8, 0)
    writeTarOctal(header, 124, 12, content.byteLength)
    writeTarOctal(header, 136, 12, 0)
    header.fill(32, 148, 156)
    header[156] = entryTypeByPath[path] ?? 48
    writeTarText(header, 257, 6, 'ustar')
    writeTarText(header, 263, 2, '00')
    if (prefix) writeTarText(header, 345, 155, prefix)
    let checksum = 0
    for (const byte of header) checksum += byte
    const checksumField = `${checksum.toString(8).padStart(6, '0')}\0 `
    header.write(checksumField, 148, 8, 'ascii')
    blocks.push(header, content)
    const padding = (512 - (content.byteLength % 512)) % 512
    if (padding > 0) blocks.push(Buffer.alloc(padding))
  }
  blocks.push(Buffer.alloc(1_024))
  return gzipSync(Buffer.concat(blocks), { level: 9 })
}

function cloneCapsuleManifestInput(
  value: ReturnType<
    typeof createCanonicalSam31PrivateImageBuildCapsuleManifest
  >,
): Parameters<
  typeof createCanonicalSam31PrivateImageBuildCapsuleManifest
>[0] {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone.schemaVersion
  delete clone.source
  delete clone.manifestHash
  return clone as Parameters<
    typeof createCanonicalSam31PrivateImageBuildCapsuleManifest
  >[0]
}

function capsuleReadPort(
  bytes: Buffer,
  coordinate: typeof capsuleCoordinate,
) {
  return {
    async readExact() {
      return {
        generationBeforeRead: coordinate.generation,
        etagBeforeRead: coordinate.etag,
        contentType: 'application/gzip',
        body: chunked(bytes),
        generationAfterRead: coordinate.generation,
        etagAfterRead: coordinate.etag,
      }
    },
  }
}

function splitTarPath(path: string): { name: string; prefix: string } {
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' }
  for (let index = path.lastIndexOf('/'); index > 0;
    index = path.lastIndexOf('/', index - 1)) {
    const prefix = path.slice(0, index)
    const name = path.slice(index + 1)
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix }
    }
  }
  throw new Error(`Capsule fixture path cannot be represented in ustar: ${path}`)
}

function writeTarText(
  header: Buffer,
  offset: number,
  length: number,
  value: string,
): void {
  const bytes = Buffer.from(value, 'utf8')
  assert(bytes.byteLength <= length)
  bytes.copy(header, offset)
}

function writeTarOctal(
  header: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  const field = `${value.toString(8).padStart(length - 1, '0')}\0`
  header.write(field, offset, length, 'ascii')
}

function entrySha(
  entries: readonly { path: string; sha256: string }[],
  path: string,
): string {
  const entry = entries.find((item) => item.path === path)
  assert(entry, `Missing capsule fixture entry: ${path}`)
  return entry.sha256
}

async function* chunked(bytes: Buffer) {
  yield bytes.subarray(0, 11)
  yield bytes.subarray(11)
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${sha(Buffer.from(id))}`,
  }
}

function contentRef(id: string, digest: string) {
  return { id, version: 1 as const, contentHash: `sha256:${digest}` }
}

function sha(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJsonDigest(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
          .map(([key, nested]) => [key, normalize(nested)]),
      )
    }
    return item
  }
  return sha(Buffer.from(JSON.stringify(normalize(value))))
}
