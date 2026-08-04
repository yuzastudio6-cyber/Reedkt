import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  assertCanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  prepareCanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import { CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION } from
  '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import { CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  compileCanonicalSam31CloudBuildRequestBody,
} from '../services/canonical-sam3_1-cloud-image-build-service'
import {
  assertCanonicalSam31ImageSupplyChainBuildAdmission,
  assertCanonicalSam31ImageSupplyChainBuildObservation,
  assertCanonicalSam31ImageSupplyChainBuildSubmission,
  compileCanonicalSam31ImageSupplyChainCloudBuildBody,
  createCanonicalSam31ImageSupplyChainBuildAdmission,
  createCanonicalSam31ImageSupplyChainBuildService,
  imageSupplyChainBuildAdmissionReference,
  type CanonicalSam31ImageSupplyChainBuildStatePort,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  assertCanonicalSam31ImageSupplyChainGoogleReadUrl,
  assertCanonicalSam31ImageSecurityReview,
  createCanonicalSam31ImageSecurityReview,
  createCanonicalSam31ImageSupplyChainEvidenceReadPort,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
  prepareAndPersistCanonicalSam31CloudImageSupplyChainRelease,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import type { VisualIntelligencePrivateObjectReadPort } from
  '../visual-intelligence/visual-intelligence-private-object-read-port'

const authority = createAuthority()
const imageBuildSubmission = createImageBuildSubmission(authority)
const imageBuildTerminal = createImageBuildTerminal(
  authority,
  imageBuildSubmission,
)
const kmsKeyVersionResource =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/7'
const admission = createCanonicalSam31ImageSupplyChainBuildAdmission({
  admissionId: 'sam31-image-supply-chain-build-admission-smoke',
  authority,
  imageBuildSubmission,
  imageBuildTerminalObservation: imageBuildTerminal,
  kmsKeyVersionResource,
  admittedAt: '2026-08-03T20:00:00.000Z',
})

assert.equal(admission.evidenceClass, 'canonical_private_reread')
assert.equal(admission.status, 'authorized_for_private_supply_chain_build')
assert.equal(admission.kmsKeyVersionResource, kmsKeyVersionResource)
assert.equal(admission.kmsKeyUri, `gcpkms://${kmsKeyVersionResource}`)
assert.equal(admission.toolchain.syftRelease, 'v1.44.0')
assert.equal(admission.toolchain.cosignRelease, 'v3.0.6')
assert.equal(admission.toolchain.mutableToolTagUsed, false)
assert.equal(admission.authority.modelCheckpointIncluded, false)
assert.equal(admission.authority.customerMediaIncluded, false)
assert.equal(admission.authority.gpuRuntimeAuthorized, false)
assert.equal(admission.authority.productionReady, false)
assert.equal(
  assertCanonicalSam31ImageSupplyChainBuildAdmission(admission).admissionHash,
  admission.admissionHash,
)

const body = compileCanonicalSam31ImageSupplyChainCloudBuildBody(admission)
const serialized = JSON.stringify(body)
const steps = body.steps as Array<Record<string, unknown>>
assert.equal(steps.length, 5)
assert.deepEqual(steps.map(({ id }) => id), [
  'pull-immutable-sam31-image',
  'archive-immutable-sam31-image',
  'generate-spdx-2-3-sbom',
  'sign-immutable-sam31-image',
  'verify-immutable-sam31-image-signature',
])
assert(serialized.includes(admission.immutableImageUri))
assert(!serialized.includes(authority.imageDestination.taggedUri))
assert(serialized.includes('docker-archive:/workspace/sam31-image.tar'))
assert(serialized.includes('spdx-json=/workspace/sam31.spdx.json'))
assert(serialized.includes('--use-signing-config=false'))
assert(serialized.includes('--tlog-upload=false'))
assert(serialized.includes('--insecure-ignore-tlog=true'))
assert(serialized.includes(kmsKeyVersionResource))
assert(serialized.includes(
  'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
))
assert(serialized.includes(
  'docker.io/anchore/syft@sha256:2baa4d24d90599840c0100a8d30deaa533821fcd99f405ce6f90e3d225bd836d',
))
assert(serialized.includes(
  'gcr.io/projectsigstore/cosign@sha256:de9c65609e6bde17e6b48de485ee788407c9502fa08b8f4459f595b21f56cd00',
))
assert(!serialized.includes('sam3.1_multiplex.pt'))
assert(!serialized.includes('HUGGINGFACE_TOKEN'))
assert(!serialized.includes('MODEL_WEIGHT_ACCESS_TOKEN'))
assert(!serialized.includes('secretEnv'))
assert(!serialized.includes('availableSecrets'))
assert.equal('source' in body, false)
assert.equal('images' in body, false)
assert.equal(
  body.serviceAccount,
  'projects/reeditpro/serviceAccounts/reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com',
)
assert.deepEqual(
  (body.artifacts as { objects: { paths: string[] } }).objects.paths,
  [
    'sam31.spdx.json',
    'cosign-signature.bundle.json',
    'cosign-verification.json',
  ],
)

const buildId = '22222222-2222-4222-8222-222222222222'
let providerCalls = 0
let submittedBody: Readonly<Record<string, unknown>> | undefined
const state = createStatePort()
const service = createCanonicalSam31ImageSupplyChainBuildService({
  admissionReadPort: {
    async rereadAdmission() {
      return structuredClone(admission)
    },
  },
  statePort: state.port,
  authenticatedTransport: {
    async request(request) {
      providerCalls += 1
      if (request.method === 'POST') {
        submittedBody = request.body
        return {
          status: 200,
          json: buildCreateOperation(buildId),
        }
      }
      return {
        status: 200,
        json: successfulSupplyChainBuild(
          buildId,
          submittedBody ?? body,
          admission,
        ),
      }
    },
  },
  now: () => '2026-08-03T20:01:00.000Z',
})

const admissionRef = imageSupplyChainBuildAdmissionReference(admission)
const submission = await service.startOneSupplyChainBuild({ admissionRef })
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.durableAdmissionConsumptionCreated, true)
assert.equal(submission.durableSubmissionObservationCreated, true)
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(submission.supplyChainBuildKnownStarted, true)
assert.equal(submission.imageSignatureKnownCreated, false)
assert.equal(submission.sbomKnownCreated, false)
assert.equal(providerCalls, 1)
assert.equal(
  assertCanonicalSam31ImageSupplyChainBuildSubmission(submission)
    .submissionHash,
  submission.submissionHash,
)

const duplicate = await service.startOneSupplyChainBuild({ admissionRef })
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(duplicate.providerOutcome, 'not_executed')
assert.equal(providerCalls, 1)

const observation = await service.observeOneSupplyChainBuild({
  admission,
  submission,
})
assert.equal(
  observation.disposition,
  'supply_chain_artifacts_ready_pending_exact_reread',
)
assert.equal(observation.cloudBuildStatus, 'SUCCESS')
assert.equal(observation.exactBuildConfigurationEchoVerified, true)
assert.equal(observation.evidenceArtifactCount, 3)
assert.equal(observation.allPinnedBuildStepsCompleted, true)
assert.equal(observation.sbomBuildArtifactCreated, true)
assert.equal(observation.digestSignatureCreatedAndVerified, true)
assert.equal(observation.evidenceArtifactsExactReread, false)
assert.equal(observation.vulnerabilityOccurrencesReread, false)
assert.equal(observation.originalBuildProvenanceReread, false)
assert.equal(observation.imageSupplyChainReleaseGranted, false)
assert.equal(observation.gpuRuntimeAuthorized, false)
assert.equal(observation.productionReady, false)
assert.equal(
  assertCanonicalSam31ImageSupplyChainBuildObservation(observation)
    .observationHash,
  observation.observationHash,
)

const imageDigest = imageBuildTerminal.immutableImageDigest
const imageUri = imageBuildTerminal.immutableImageUri
assert(imageDigest)
assert(imageUri)
const evidenceObjects = createEvidenceObjects({
  admission,
  observation,
  imageDigest,
})
const releaseObjects = createJsonObjectPort()
const releaseRepository =
  createCanonicalSam31ImageSupplyChainReleaseRepository({
    objectPort: releaseObjects.port,
  })
const evidenceReadRequests: string[] = []
let securityReviewReads = 0
const evidenceReadPort =
  createCanonicalSam31ImageSupplyChainEvidenceReadPort({
    imageBuildAuthority: authority,
    imageBuildSubmission,
    imageBuildTerminalObservation: imageBuildTerminal,
    supplyChainBuildAdmission: admission,
    supplyChainBuildSubmission: submission,
    supplyChainBuildObservation: observation,
    privateObjectReadPort: evidenceObjects.port,
    googleReadTransport: {
      async getJson(url) {
        evidenceReadRequests.push(url)
        return googleEvidenceResponse({
          url,
          authority,
          imageBuildTerminal,
          supplyChainBuildBody: body,
          admission,
          observation,
        })
      },
    },
    securityReviewReadPort: {
      async rereadApprovedReview(request) {
        securityReviewReads += 1
        const review = createCanonicalSam31ImageSecurityReview({
          reviewId: 'sam31-image-security-review-smoke',
          immutableImageDigest: request.immutableImageDigest,
          vulnerabilityScanRef: request.vulnerabilityScanRef,
          scanCompletedAt: request.scanCompletedAt,
          occurrenceSnapshotUpdatedAt:
            request.occurrenceSnapshotUpdatedAt,
          severityCounts: request.severityCounts,
          reviewerAuthorityRef: ref('sam31-security-reviewer-authority'),
          reviewedAt: '2026-08-03T20:05:00.000Z',
        })
        await releaseRepository.persistApprovedSecurityReviewCreateOnly({
          review,
        })
        return releaseRepository.rereadApprovedReview(request)
      },
    },
  })

const qualifiedSupplyChain =
  await prepareAndPersistCanonicalSam31CloudImageSupplyChainRelease({
    releaseId: 'sam31-image-supply-chain-release-smoke',
    authority,
    submission: imageBuildSubmission,
    terminalObservation: imageBuildTerminal,
    evidenceReadPort,
    qualifiedAt: '2026-08-03T20:06:00.000Z',
    repository: releaseRepository,
  })
assert.equal(qualifiedSupplyChain.status, 'image_supply_chain_qualified')
assert.equal(qualifiedSupplyChain.evidenceClass, 'canonical_private_reread')
assert.equal(qualifiedSupplyChain.immutableImageDigest, imageDigest)
assert.equal(qualifiedSupplyChain.sbom.format, 'spdx_2_3_json')
assert.equal(qualifiedSupplyChain.sbom.exactArtifactReread, true)
assert.equal(qualifiedSupplyChain.vulnerabilityScan.criticalCount, 0)
assert.equal(qualifiedSupplyChain.vulnerabilityScan.highCount, 0)
assert.equal(qualifiedSupplyChain.vulnerabilityScan.mediumCount, 1)
assert.equal(qualifiedSupplyChain.vulnerabilityScan.lowCount, 1)
assert.equal(qualifiedSupplyChain.vulnerabilityScan.unknownSeverityCount, 0)
assert.equal(
  qualifiedSupplyChain.vulnerabilityScan
    .securityReviewApprovedForPrivateGpuQualification,
  true,
)
assert.equal(
  qualifiedSupplyChain.signature.exactSignatureVerificationPassed,
  true,
)
assert.equal(
  qualifiedSupplyChain.provenance.exactAttestationRereadAndVerified,
  true,
)
assert.equal(qualifiedSupplyChain.authority.imageSupplyChainQualified, true)
assert.equal(qualifiedSupplyChain.authority.a100RuntimeQualified, false)
assert.equal(qualifiedSupplyChain.authority.l4RuntimeQualified, false)
assert.equal(qualifiedSupplyChain.authority.runtimeReleaseGranted, false)
assert.equal(qualifiedSupplyChain.authority.customerCreditMutationAllowed, false)
assert.equal(qualifiedSupplyChain.authority.productionReady, false)
assert.equal(securityReviewReads, 1)
assert.equal(releaseObjects.records.size, 2)
assert.equal(evidenceObjects.reads.length, 4)
assert.equal(evidenceReadRequests.length, 6)
assert(evidenceReadRequests.some((url) =>
  url.startsWith('https://artifactregistry.googleapis.com/v1/')))
assert.equal(evidenceReadRequests.filter((url) =>
  url.startsWith('https://cloudbuild.googleapis.com/v1/')).length, 2)
assert.equal(evidenceReadRequests.filter((url) =>
  url.startsWith('https://containeranalysis.googleapis.com/v1/')).length, 3)
for (const url of evidenceReadRequests) {
  assert.doesNotThrow(() =>
    assertCanonicalSam31ImageSupplyChainGoogleReadUrl(url))
}
assert.throws(() => assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
  'https://example.com/v1/projects/reeditpro/occurrences',
))
assert.throws(() => assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/'
    + 'us-central1/builds/11111111-1111-4111-8111-111111111111?view=FULL',
))
assert.throws(() => assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
  'https://artifactregistry.googleapis.com/v1/projects/reeditpro/locations/'
    + 'us-central1/repositories/reeditpro-workers/dockerImages/'
    + `reeditpro-sam31-gpu%40${imageDigest}?pageToken=caller`,
))
assert.equal(
  assertCanonicalSam31CloudImageSupplyChainRelease(qualifiedSupplyChain)
    .releaseHash,
  qualifiedSupplyChain.releaseHash,
)
const qualifiedSupplyChainRef = {
  id: qualifiedSupplyChain.releaseId,
  version: 1 as const,
  contentHash: `sha256:${qualifiedSupplyChain.releaseHash}` as const,
}
assert.equal(
  (await releaseRepository.rereadQualifiedRelease({
    releaseRef: qualifiedSupplyChainRef,
  }))?.releaseHash,
  qualifiedSupplyChain.releaseHash,
)
assert.equal(
  await releaseRepository.rereadQualifiedRelease({
    releaseRef: ref('missing-supply-chain-release'),
  }),
  null,
)
await assert.rejects(() => releaseRepository.rereadApprovedReview({
  immutableImageDigest: imageDigest,
  vulnerabilityScanRef: {
    ...qualifiedSupplyChain.vulnerabilityScan.scanRef,
    version: 1 as const,
  },
  scanCompletedAt: qualifiedSupplyChain.vulnerabilityScan.scanCompletedAt,
  occurrenceSnapshotUpdatedAt:
    qualifiedSupplyChain.vulnerabilityScan.vulnerabilityDatabaseUpdatedAt,
  severityCounts: {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 1,
    unknownSeverityCount: 0,
  },
}))
await releaseRepository.persistQualifiedReleaseCreateOnly({
  release: qualifiedSupplyChain,
})

const securityReview = createCanonicalSam31ImageSecurityReview({
  reviewId: 'sam31-image-security-review-direct-smoke',
  immutableImageDigest: imageDigest,
  vulnerabilityScanRef: ref('sam31-vulnerability-scan-direct'),
  scanCompletedAt: '2026-08-03T20:02:00.000Z',
  occurrenceSnapshotUpdatedAt: '2026-08-03T20:03:00.000Z',
  severityCounts: {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 1,
    lowCount: 1,
    unknownSeverityCount: 0,
  },
  reviewerAuthorityRef: ref('sam31-security-reviewer-direct'),
  reviewedAt: '2026-08-03T20:04:00.000Z',
})
assert.equal(
  assertCanonicalSam31ImageSecurityReview(securityReview).reviewHash,
  securityReview.reviewHash,
)
assert.throws(() => createCanonicalSam31ImageSecurityReview({
  reviewId: 'sam31-image-security-review-high-severity-smoke',
  immutableImageDigest: imageDigest,
  vulnerabilityScanRef: ref('sam31-vulnerability-scan-high-severity'),
  scanCompletedAt: '2026-08-03T20:02:00.000Z',
  occurrenceSnapshotUpdatedAt: '2026-08-03T20:03:00.000Z',
  severityCounts: {
    criticalCount: 0,
    highCount: 1,
    mediumCount: 0,
    lowCount: 0,
    unknownSeverityCount: 0,
  },
  reviewerAuthorityRef: ref('sam31-security-reviewer-high-severity'),
  reviewedAt: '2026-08-03T20:04:00.000Z',
}))
const unknownFieldSecurityReviewInput = {
  reviewId: 'sam31-image-security-review-unknown-field-smoke',
  immutableImageDigest: imageDigest,
  vulnerabilityScanRef: ref('sam31-vulnerability-scan-unknown-field'),
  scanCompletedAt: '2026-08-03T20:02:00.000Z',
  occurrenceSnapshotUpdatedAt: '2026-08-03T20:03:00.000Z',
  severityCounts: {
    criticalCount: 0,
    highCount: 0,
    mediumCount: 1,
    lowCount: 1,
    unknownSeverityCount: 0,
  },
  reviewerAuthorityRef: ref('sam31-security-reviewer-unknown-field'),
  reviewedAt: '2026-08-03T20:04:00.000Z',
  callerApproval: true,
}
assert.throws(() => createCanonicalSam31ImageSecurityReview(
  unknownFieldSecurityReviewInput,
))

const tamperedEvidenceObjects = createEvidenceObjects({
  admission,
  observation,
  imageDigest,
  tamperArtifactPath: 'sam31.spdx.json',
})
const tamperedEvidencePort =
  createCanonicalSam31ImageSupplyChainEvidenceReadPort({
    imageBuildAuthority: authority,
    imageBuildSubmission,
    imageBuildTerminalObservation: imageBuildTerminal,
    supplyChainBuildAdmission: admission,
    supplyChainBuildSubmission: submission,
    supplyChainBuildObservation: observation,
    privateObjectReadPort: tamperedEvidenceObjects.port,
    googleReadTransport: {
      async getJson(url) {
        return googleEvidenceResponse({
          url,
          authority,
          imageBuildTerminal,
          supplyChainBuildBody: body,
          admission,
          observation,
        })
      },
    },
    securityReviewReadPort: {
      async rereadApprovedReview() {
        throw new Error('security review must not run after artifact tamper')
      },
    },
  })
await assert.rejects(() => prepareCanonicalSam31CloudImageSupplyChainRelease({
  releaseId: 'sam31-tampered-evidence-release-smoke',
  authority,
  submission: imageBuildSubmission,
  terminalObservation: imageBuildTerminal,
  evidenceReadPort: tamperedEvidencePort,
  qualifiedAt: '2026-08-03T20:06:00.000Z',
}))

assert.throws(() => createCanonicalSam31ImageSupplyChainBuildAdmission({
  admissionId: 'sam31-invalid-primary-key-admission',
  authority,
  imageBuildSubmission,
  imageBuildTerminalObservation: imageBuildTerminal,
  kmsKeyVersionResource: kmsKeyVersionResource.replace('/7', '/primary'),
  admittedAt: '2026-08-03T20:00:00.000Z',
}))

const digestTamperedAdmission = structuredClone(admission)
digestTamperedAdmission.immutableImageDigest = `sha256:${'c'.repeat(64)}`
assert.throws(() => assertCanonicalSam31ImageSupplyChainBuildAdmission(
  digestTamperedAdmission,
))

const cyclicAdmission = structuredClone(admission) as Record<string, unknown>
cyclicAdmission.cycle = cyclicAdmission
assert.throws(() => assertCanonicalSam31ImageSupplyChainBuildAdmission(
  cyclicAdmission,
))

const badStepService = createCanonicalSam31ImageSupplyChainBuildService({
  admissionReadPort: { async rereadAdmission() { return admission } },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request(request) {
      if (request.method === 'POST') return {
        status: 200,
        json: buildCreateOperation(buildId),
      }
      const result = successfulSupplyChainBuild(
        buildId,
        body,
        admission,
      )
      ;(result.steps[2].args as string[])[0] = 'packages'
      return { status: 200, json: result }
    },
  },
  now: () => '2026-08-03T20:02:00.000Z',
})
const badStepSubmission = await badStepService.startOneSupplyChainBuild({
  admissionRef,
})
assert.equal((await badStepService.observeOneSupplyChainBuild({
  admission,
  submission: badStepSubmission,
})).disposition, 'outcome_unknown')

const wrongArtifactService = createCanonicalSam31ImageSupplyChainBuildService({
  admissionReadPort: { async rereadAdmission() { return admission } },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request(request) {
      if (request.method === 'POST') return {
        status: 200,
        json: buildCreateOperation(buildId),
      }
      const result = successfulSupplyChainBuild(
        buildId,
        body,
        admission,
      )
      result.results.artifactManifest = result.results.artifactManifest.replace(
        admission.evidencePrefix,
        `private/sam3_1/image-supply-chain/v1/${'f'.repeat(64)}`,
      )
      return { status: 200, json: result }
    },
  },
  now: () => '2026-08-03T20:03:00.000Z',
})
const wrongArtifactSubmission =
  await wrongArtifactService.startOneSupplyChainBuild({ admissionRef })
assert.equal((await wrongArtifactService.observeOneSupplyChainBuild({
  admission,
  submission: wrongArtifactSubmission,
})).disposition, 'outcome_unknown')

let unknownCalls = 0
const unknownService = createCanonicalSam31ImageSupplyChainBuildService({
  admissionReadPort: { async rereadAdmission() { return admission } },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      unknownCalls += 1
      throw new Error('network outcome unavailable')
    },
  },
  now: () => '2026-08-03T20:04:00.000Z',
})
const unknown = await unknownService.startOneSupplyChainBuild({ admissionRef })
assert.equal(unknown.disposition, 'outcome_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(unknownCalls, 1)
const afterUnknown = await unknownService.startOneSupplyChainBuild({
  admissionRef,
})
assert.equal(afterUnknown.disposition, 'rejected_before_creation')
assert.equal(unknownCalls, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-cloud-image-supply-chain-build',
  checks: 105,
  exactImmutableImageDigestBound: true,
  exactNumericHsmKeyVersionBound: true,
  pinnedSbomAndSignatureToolImages: true,
  spdx23SbomBuildStepPresent: true,
  signatureCreatedAndVerifiedInDedicatedBuild: true,
  durableSingleUseConsumption: true,
  automaticRetryAllowed: false,
  exactEvidenceArtifactsReread:
    qualifiedSupplyChain.authority.exactSbomReread,
  exactArtifactRegistryDigestReread:
    qualifiedSupplyChain.authority.exactImmutableImageReread,
  vulnerabilityOccurrencesAndSecurityReviewPassed:
    qualifiedSupplyChain.authority.vulnerabilityScanPassed,
  exactKmsSignatureVerificationPassed:
    qualifiedSupplyChain.authority.imageSignatureVerified,
  exactSlsaV1ProvenanceVerified:
    qualifiedSupplyChain.authority.buildProvenanceVerified,
  imageSupplyChainReleaseGranted:
    qualifiedSupplyChain.authority.imageSupplyChainQualified,
  gpuRuntimeAuthorized: observation.gpuRuntimeAuthorized,
  developerMachineModelInstallAllowed: false,
  providerBuildExecuted: false,
  productionReady: false,
  admissionHash: admission.admissionHash,
  observationHash: observation.observationHash,
}, null, 2))

function createAuthority() {
  const capsuleSha256 = 'a'.repeat(64)
  const ref = (id: string, hash = '1'.repeat(64)) => ({
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  })
  const payload = {
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_authority_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'authorized_for_private_cloud_build' as const,
    authorityId: 'sam31-supply-chain-smoke-image-build-authority',
    authorityVersion: 1 as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    candidateRef: {
      schemaVersion: CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
      candidateHash: '2'.repeat(64),
    },
    ingestReceiptRef: {
      id: 'sam31-private-ingest-supply-chain-smoke',
      version: 1 as const,
      schemaVersion: CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
      contentHash: `sha256:${'3'.repeat(64)}` as const,
    },
    sourceCheckpointQualificationRef: {
      id: 'sam31-source-checkpoint-supply-chain-smoke',
      version: 1 as const,
      schemaVersion:
        'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1' as const,
      contentHash: `sha256:${'0'.repeat(64)}` as const,
    },
    artifactBindingRef: ref('sam31-build-binding-supply-chain-smoke', '4'.repeat(64)),
    capsuleManifestRef: ref('sam31-capsule-manifest-supply-chain-smoke', '5'.repeat(64)),
    capsuleCoordinate: {
      projectId: 'reeditpro' as const,
      bucketName:
        'reeditpro-production-reeditpro-image-build-inputs' as const,
      objectName:
        `private/image-build-inputs/sam3_1/${capsuleSha256}.tar.gz`,
      generation: '3101',
      etag: 'sam31-supply-chain-smoke-etag',
      byteLength: 1_024,
      sha256: capsuleSha256,
    },
    imageDestination: {
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
      imageName: 'reeditpro-sam31-gpu' as const,
      tag: 'sam31-96914d2-aaaaaaaaaaaaaaaa',
      taggedUri:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu:sam31-96914d2-aaaaaaaaaaaaaaaa',
      callerSelectedTagAllowed: false as const,
      tagMayAuthorizeRuntime: false as const,
      terminalImmutableDigestRequired: true as const,
    },
    buildClosure: {
      dockerfilePath:
        'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate' as const,
      dockerfileSha256: '6'.repeat(64),
      runnerSha256: '7'.repeat(64),
      entrypointSha256: '8'.repeat(64),
      sourceProvenanceLockSha256: '9'.repeat(64),
      dependencyLockSha256: 'a'.repeat(64),
      dependencyClosureReceiptSha256: 'b'.repeat(64),
      patchApplicationReceiptSha256: 'c'.repeat(64),
      artifactBuildBindingRecordHash: '4'.repeat(64),
      artifactBuildBindingFileSha256: 'd'.repeat(64),
      sourceCheckpointQualificationRecordHash: '0'.repeat(64),
      sourceCheckpointCompatibilityReceiptSha256: 'e'.repeat(64),
      cudaForwardCompatIngestReceiptSha256: 'f'.repeat(64),
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
    preparedAt: '2026-08-03T19:58:00.000Z',
  }
  return assertCanonicalSam31CloudImageBuildAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function createImageBuildSubmission(value: ReturnType<typeof createAuthority>) {
  const authorityRef = {
    id: value.authorityId,
    version: value.authorityVersion,
    contentHash: `sha256:${value.authorityHash}` as const,
  }
  const buildRequestHash = sha256AuthorityValue(
    compileCanonicalSam31CloudBuildRequestBody(value),
  )
  const buildId = '11111111-1111-4111-8111-111111111111'
  const payload = {
    schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_submission_owner' as const,
    disposition: 'submitted' as const,
    authorityRef,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    buildRequestHash,
    buildRequestBodyRef: {
      id: `sam31-cloud-build-request-${buildRequestHash.slice(0, 24)}`,
      version: 1 as const,
      contentHash: `sha256:${buildRequestHash}` as const,
    },
    providerHttpStatus: 200,
    cloudBuildOperationName: `operations/build/us-central1/${buildId}`,
    cloudBuildId: buildId,
    cloudBuildResource:
      `projects/reeditpro/locations/us-central1/builds/${buildId}`,
    providerOutcome: 'executed' as const,
    durableAuthorityConsumptionCreated: true,
    durableSubmissionObservationCreated: true,
    automaticRetryAllowed: false as const,
    imageBuildKnownStarted: true,
    imagePushKnownCompleted: false as const,
    immutableImageDigestKnown: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditMutationCreated: false as const,
    productionReady: false as const,
    observedAt: '2026-08-03T19:59:00.000Z',
  }
  return assertCanonicalSam31CloudImageBuildSubmission({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function createImageBuildTerminal(
  value: ReturnType<typeof createAuthority>,
  submission: ReturnType<typeof createImageBuildSubmission>,
) {
  const digest = `sha256:${'b'.repeat(64)}` as const
  const payload = {
    schemaVersion:
      CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
    source: 'canonical_sam3_1_cloud_image_build_terminal_owner' as const,
    disposition:
      'image_built_pending_scan_signature_and_gpu_qualification' as const,
    authorityRef: submission.authorityRef,
    submissionRef: {
      id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
      version: 1 as const,
      contentHash: `sha256:${submission.submissionHash}` as const,
    },
    cloudBuildId: submission.cloudBuildId,
    cloudBuildResource: submission.cloudBuildResource,
    providerHttpStatus: 200,
    cloudBuildStatus: 'SUCCESS' as const,
    exactBuildConfigurationEchoVerified: true,
    exactStorageGenerationProvenanceVerified: true,
    verifiedProvenanceAndAttestationRequested: true as const,
    warningsAbsent: true,
    taggedImageUri: value.imageDestination.taggedUri,
    immutableImageDigest: digest,
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${digest}`,
    artifactRegistryPackage:
      'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu',
    durableTerminalObservationCreated: true,
    imageBuiltAndPushed: true,
    imageScanPassed: false as const,
    imageSignatureVerified: false as const,
    sbomReread: false as const,
    a100RuntimeQualified: false as const,
    l4RuntimeQualified: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditMutationCreated: false as const,
    productionReady: false as const,
    observedAt: '2026-08-03T19:59:30.000Z',
  }
  return assertCanonicalSam31CloudImageBuildTerminalObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function buildCreateOperation(id: string) {
  return {
    name: `operations/build/us-central1/${id}`,
    metadata: {
      build: {
        id,
        name: `projects/reeditpro/locations/us-central1/builds/${id}`,
        projectId: 'reeditpro',
      },
    },
  }
}

function successfulSupplyChainBuild(
  id: string,
  value: Readonly<Record<string, unknown>>,
  buildAdmission: typeof admission,
) {
  return {
    id,
    name: `projects/reeditpro/locations/us-central1/builds/${id}`,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    warnings: [],
    steps: structuredClone(value.steps) as Array<Record<string, unknown>>,
    artifacts: structuredClone(value.artifacts),
    timeout: value.timeout,
    queueTtl: value.queueTtl,
    options: structuredClone(value.options),
    serviceAccount: value.serviceAccount,
    tags: structuredClone(value.tags),
    results: {
      artifactManifest:
        `gs://${buildAdmission.evidenceBucket}/${buildAdmission.evidencePrefix}/artifacts-${id}.json#4101`,
      numArtifacts: '3',
    },
  }
}

function createEvidenceObjects(input: {
  admission: typeof admission
  observation: typeof observation
  imageDigest: string
  tamperArtifactPath?:
    | 'sam31.spdx.json'
    | 'cosign-signature.bundle.json'
    | 'cosign-verification.json'
}) {
  const spdx = Buffer.from(JSON.stringify({
    spdxVersion: 'SPDX-2.3',
    SPDXID: 'SPDXRef-DOCUMENT',
    dataLicense: 'CC0-1.0',
    name: `sam31-image-${input.imageDigest.slice(-12)}`,
    documentNamespace:
      `https://weeditpro.invalid/sbom/${input.imageDigest.slice(7)}`,
    creationInfo: {
      created: '2026-08-03T20:01:00Z',
      creators: ['Tool: syft-1.44.0'],
    },
    documentDescribes: ['SPDXRef-Package-sam31-runtime'],
    packages: [{
      SPDXID: 'SPDXRef-Package-sam31-runtime',
      name: 'sam31-runtime',
      versionInfo: '96914d2425f90a64f45ca977c2b5165418099543',
    }],
    relationships: [{
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: 'SPDXRef-Package-sam31-runtime',
    }],
  }))
  const bundle = Buffer.from(JSON.stringify({
    mediaType: 'application/vnd.dev.sigstore.bundle.v0.3+json',
    verificationMaterial: {
      publicKey: { hint: 'weeditpro-sam31-image-signing-key-version-7' },
    },
    messageSignature: {
      messageDigest: {
        algorithm: 'SHA2_256',
        digest: Buffer.from(input.imageDigest.slice(7), 'hex')
          .toString('base64'),
      },
      signature: Buffer.alloc(64, 7).toString('base64'),
    },
  }))
  const verification = Buffer.from(JSON.stringify([{
    critical: {
      identity: {
        'docker-reference':
          'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu',
      },
      image: { 'docker-manifest-digest': input.imageDigest },
      type: 'cosign container image signature',
    },
    optional: null,
  }]))
  const bodies = new Map<string, Buffer>([
    ['sam31.spdx.json', spdx],
    ['cosign-signature.bundle.json', bundle],
    ['cosign-verification.json', verification],
  ])
  const generations = new Map<string, string>([
    ['sam31.spdx.json', '4201'],
    ['cosign-signature.bundle.json', '4202'],
    ['cosign-verification.json', '4203'],
  ])
  const manifestEntries = [...bodies.entries()].map(([path, value]) => ({
    location:
      `gs://${input.admission.evidenceBucket}/`
        + `${input.admission.evidencePrefix}/${path}#${generations.get(path)}`,
    file_hash: [{
      type: 2,
      value: createHash('md5').update(value).digest('base64'),
    }],
  }))
  const manifestBody = Buffer.from(JSON.stringify(manifestEntries))
  if (input.tamperArtifactPath) {
    const current = bodies.get(input.tamperArtifactPath)
    assert(current)
    bodies.set(
      input.tamperArtifactPath,
      Buffer.concat([current, Buffer.from('\n')]),
    )
  }
  const manifestUri = input.observation.evidenceArtifactManifestUri
  assert(manifestUri)
  const manifestName = manifestUri
    .replace(`gs://${input.admission.evidenceBucket}/`, '')
    .replace(/#[1-9][0-9]*$/u, '')
  const reads: string[] = []
  const port: VisualIntelligencePrivateObjectReadPort = {
    async readExact(request) {
      reads.push(
        `${request.bucketName}/${request.objectName}#${request.generation ?? ''}`,
      )
      if (
        request.bucketName !== input.admission.evidenceBucket
        || !request.generation
      ) return null
      if (request.objectName === manifestName && request.generation === '4101') {
        return {
          body: Buffer.from(manifestBody),
          generation: '4101',
          etag: 'sam31-artifact-manifest-etag',
          contentType: 'application/json',
        }
      }
      const prefix = `${input.admission.evidencePrefix}/`
      if (!request.objectName.startsWith(prefix)) return null
      const path = request.objectName.slice(prefix.length)
      const body = bodies.get(path)
      const generation = generations.get(path)
      if (!body || request.generation !== generation) return null
      return {
        body: Buffer.from(body),
        generation,
        etag: `sam31-${path}-etag`,
        contentType: 'application/json',
      }
    },
  }
  return { port, reads }
}

function googleEvidenceResponse(input: {
  url: string
  authority: typeof authority
  imageBuildTerminal: typeof imageBuildTerminal
  supplyChainBuildBody: Readonly<Record<string, unknown>>
  admission: typeof admission
  observation: typeof observation
}) {
  const url = new URL(input.url)
  const imageDigest = input.imageBuildTerminal.immutableImageDigest
  const imageUri = input.imageBuildTerminal.immutableImageUri
  assert(imageDigest)
  assert(imageUri)
  if (url.origin === 'https://artifactregistry.googleapis.com') return {
    status: 200,
    json: {
      name:
        'projects/reeditpro/locations/us-central1/repositories/'
          + `reeditpro-workers/dockerImages/reeditpro-sam31-gpu@${imageDigest}`,
      uri: imageUri,
      tags: [input.authority.imageDestination.taggedUri],
      imageSizeBytes: '5368709120',
      uploadTime: '2026-08-03T19:59:30Z',
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      buildTime: '2026-08-03T19:59:00Z',
      updateTime: '2026-08-03T19:59:30Z',
    },
  }
  if (url.origin === 'https://cloudbuild.googleapis.com') {
    if (url.pathname.endsWith(`/${input.imageBuildTerminal.cloudBuildId}`)) {
      return {
        status: 200,
        json: successfulImageBuild(
          input.authority,
          input.imageBuildTerminal,
        ),
      }
    }
    if (url.pathname.endsWith(`/${input.observation.cloudBuildId}`)) return {
      status: 200,
      json: successfulSupplyChainBuild(
        input.observation.cloudBuildId,
        input.supplyChainBuildBody,
        input.admission,
      ),
    }
  }
  if (url.origin === 'https://containeranalysis.googleapis.com') {
    const filter = url.searchParams.get('filter') ?? ''
    if (filter.includes('kind="DISCOVERY"')) return {
      status: 200,
      json: { occurrences: [discoveryOccurrence(imageUri)] },
    }
    if (filter.includes('kind="VULNERABILITY"')) return {
      status: 200,
      json: { occurrences: vulnerabilityOccurrences(imageUri) },
    }
    if (filter.includes('kind="BUILD"')) return {
      status: 200,
      json: {
        occurrences: [buildProvenanceOccurrence(
          imageUri,
          imageDigest,
          input.imageBuildTerminal.cloudBuildResource,
        )],
      },
    }
  }
  return { status: 404, json: { error: { code: 404 } } }
}

function successfulImageBuild(
  value: typeof authority,
  terminal: typeof imageBuildTerminal,
) {
  const expected = compileCanonicalSam31CloudBuildRequestBody(value)
  const source = structuredClone(expected.source) as {
    storageSource: Record<string, unknown>
  }
  return {
    id: terminal.cloudBuildId,
    name: terminal.cloudBuildResource,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    warnings: [],
    source,
    steps: structuredClone(expected.steps),
    images: structuredClone(expected.images),
    timeout: expected.timeout,
    queueTtl: expected.queueTtl,
    options: structuredClone(expected.options),
    serviceAccount: expected.serviceAccount,
    tags: structuredClone(expected.tags),
    sourceProvenance: {
      resolvedStorageSource: structuredClone(source.storageSource),
      fileHashes: {
        [value.capsuleCoordinate.objectName]: {
          fileHash: [{
            type: 'SHA256',
            value: Buffer.from(value.capsuleCoordinate.sha256, 'hex')
              .toString('base64'),
          }],
        },
      },
    },
    results: {
      images: [{
        name: value.imageDestination.taggedUri,
        digest: terminal.immutableImageDigest,
        artifactRegistryPackage: terminal.artifactRegistryPackage,
      }],
    },
  }
}

function discoveryOccurrence(imageUri: string) {
  return {
    name: 'projects/reeditpro/occurrences/31111111-1111-4111-8111-111111111111',
    resourceUri: `https://${imageUri}`,
    noteName: 'projects/goog-analysis/notes/discovery-sam31-smoke',
    kind: 'DISCOVERY',
    createTime: '2026-08-03T20:01:00Z',
    updateTime: '2026-08-03T20:02:00Z',
    discovery: {
      analysisStatus: 'FINISHED_SUCCESS',
      continuousAnalysis: 'ACTIVE',
      analysisCompleted: {
        analysisType: ['OS_VULNERABILITY', 'PACKAGE_VULNERABILITY'],
      },
    },
  }
}

function vulnerabilityOccurrences(imageUri: string) {
  return [
    vulnerabilityOccurrence({
      id: '32222222-2222-4222-8222-222222222222',
      imageUri,
      severity: 'MEDIUM',
      updatedAt: '2026-08-03T20:03:00Z',
    }),
    vulnerabilityOccurrence({
      id: '33333333-3333-4333-8333-333333333333',
      imageUri,
      severity: 'LOW',
      updatedAt: '2026-08-03T20:03:10Z',
    }),
  ]
}

function vulnerabilityOccurrence(input: {
  id: string
  imageUri: string
  severity: 'LOW' | 'MEDIUM'
  updatedAt: string
}) {
  return {
    name: `projects/reeditpro/occurrences/${input.id}`,
    resourceUri: `https://${input.imageUri}`,
    noteName: `projects/goog-vulnz/notes/CVE-SAM31-${input.id.slice(0, 8)}`,
    kind: 'VULNERABILITY',
    createTime: input.updatedAt,
    updateTime: input.updatedAt,
    vulnerability: {
      severity: input.severity,
      effectiveSeverity: input.severity,
      packageIssue: [{
        affectedPackage: 'sam31-runtime-package',
        effectiveSeverity: input.severity,
      }],
    },
  }
}

function buildProvenanceOccurrence(
  imageUri: string,
  imageDigest: string,
  cloudBuildResource: string,
) {
  const repository = imageUri.replace(/@sha256:[a-f0-9]{64}$/u, '')
  const statement = {
    _type: 'https://in-toto.io/Statement/v1',
    predicateType: 'https://slsa.dev/provenance/v1',
    subject: [{
      name: `https://${repository}`,
      digest: { sha256: imageDigest.slice(7) },
    }],
    predicate: {
      buildDefinition: {
        buildType:
          'https://cloud.google.com/build/gcb-buildtypes/google-worker/v1',
      },
      runDetails: {
        builder: {
          id: 'https://cloudbuild.googleapis.com/GoogleHostedWorker',
        },
        metadata: {
          invocationId:
            `https://cloudbuild.googleapis.com/v1/${cloudBuildResource}`,
          startedOn: '2026-08-03T19:58:30Z',
          finishedOn: '2026-08-03T19:59:30Z',
        },
      },
    },
  }
  return {
    name: 'projects/reeditpro/occurrences/34444444-4444-4444-8444-444444444444',
    resourceUri: `https://${imageUri}`,
    noteName: 'projects/verified-builder/notes/slsa-v1-sam31-smoke',
    kind: 'BUILD',
    createTime: '2026-08-03T19:59:31Z',
    updateTime: '2026-08-03T19:59:31Z',
    build: { inTotoSlsaProvenanceV1: statement },
    envelope: {
      payloadType: 'application/vnd.in-toto+json',
      payload: Buffer.from(JSON.stringify(statement)).toString('base64'),
      signatures: [{
        keyid:
          'projects/verified-builder/locations/global/keyRings/attestor/'
            + 'cryptoKeys/google-hosted-worker/cryptoKeyVersions/1',
        sig: Buffer.alloc(64, 9).toString('base64'),
      }],
    },
  }
}

function ref(id: string, hash = '1'.repeat(64)) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  }
}

function createStatePort() {
  const consumed = new Set<string>()
  const submissions = new Set<string>()
  const observations = new Set<string>()
  const port: CanonicalSam31ImageSupplyChainBuildStatePort = {
    async consumeAdmissionCreateOnly(input) {
      const key = `${input.admissionRef.contentHash}:${input.buildRequestHash}`
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
      if (observations.has(observation.observationHash)) return false
      observations.add(observation.observationHash)
      return true
    },
  }
  return { port, consumed, submissions, observations }
}

function createJsonObjectPort() {
  const records = new Map<string, Buffer>()
  const port: CanonicalCreateOnlyJsonObjectPort = {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      if (records.has(input.objectPath)) return 'already_exists'
      records.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = records.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
  return { port, records }
}
