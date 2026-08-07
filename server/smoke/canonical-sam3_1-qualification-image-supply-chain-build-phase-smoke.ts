import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageSupplyChainRelease,
  prepareCanonicalSam31QualificationImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-qualification-image-supply-chain-release'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
  compileCanonicalSam31QualificationImageBuildRequestBody,
} from '../services/canonical-sam3_1-qualification-image-build-phase'
import {
  assertCanonicalSam31QualificationImageSupplyChainAdmission,
  assertCanonicalSam31QualificationImageSupplyChainObservation,
  assertCanonicalSam31QualificationImageSupplyChainSubmission,
  compileCanonicalSam31QualificationImageSupplyChainBody,
  createCanonicalSam31QualificationImageSupplyChainAdmission,
  createCanonicalSam31QualificationImageSupplyChainBuildPhase,
  qualificationImageSupplyChainAdmissionReference,
  qualificationImageSupplyChainObservationReference,
  qualificationImageSupplyChainSubmissionReference,
  type CanonicalSam31QualificationImageSupplyChainStatePort,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  assertCanonicalSam31ImageSupplyChainGoogleReadUrl,
  createCanonicalSam31ImageSecurityReview,
  createCanonicalSam31QualificationImageSupplyChainEvidenceReadPort,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createCanonicalSam31QualificationImageSupplyChainReleaseRepository,
  prepareAndPersistCanonicalSam31QualificationImageSupplyChainRelease,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31QualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'
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
const kmsKey =
  'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/9'
const admission = createCanonicalSam31QualificationImageSupplyChainAdmission({
  admissionId: 'sam31-qualification-image-supply-chain-admission-1',
  authority,
  imageBuildSubmission,
  imageBuildTerminal,
  kmsKeyVersionResource: kmsKey,
  admittedAt: '2026-08-04T14:00:00.000Z',
})
assertCanonicalSam31QualificationImageSupplyChainAdmission(admission)
assert.equal(admission.source, 'canonical_sam3_1_image_supply_chain_build_owner')
assert.equal(admission.buildPurpose, 'source_checkpoint_qualification')
assert.equal(admission.imageRole, 'qualification_image')
assert.equal(admission.authority.modelCheckpointIncluded, false)
assert.equal(
  admission.authority.sourceCheckpointQualificationReceiptIncluded,
  false,
)
assert.equal(admission.authority.gpuQualificationJobAuthorized, false)
assert.equal(admission.authority.customerCreditMutationAllowed, false)

const body = compileCanonicalSam31QualificationImageSupplyChainBody(admission)
const serialized = JSON.stringify(body)
const steps = body.steps as Array<Record<string, unknown>>
assert.deepEqual(steps.map(({ id }) => id), [
  'pull-immutable-sam31-qualification-image',
  'archive-immutable-sam31-qualification-image',
  'generate-qualification-spdx-2-3-sbom',
  'sign-immutable-sam31-qualification-image',
  'verify-immutable-sam31-qualification-image-signature',
])
assert(serialized.includes(admission.immutableImageUri))
assert(serialized.includes('sam31-qualification-image.tar'))
assert(serialized.includes('sam31-qualification.spdx.json'))
assert(serialized.includes('--tlog-upload=false'))
assert(serialized.includes('--insecure-ignore-tlog=true'))
assert(serialized.includes(kmsKey))
assert(!serialized.includes(authority.imageDestination.taggedUri))
assert(!serialized.includes('sam3.1_multiplex.pt'))
assert(!serialized.includes('source-checkpoint-qualification-receipt'))
assert(!serialized.includes('secretEnv'))
assert(!serialized.includes('availableSecrets'))
assert.equal('source' in body, false)
assert.equal('images' in body, false)

const buildId = '55555555-5555-4555-8555-555555555555'
let providerCalls = 0
let submittedBody: Readonly<Record<string, unknown>> | undefined
const state = createStatePort()
const phase = createCanonicalSam31QualificationImageSupplyChainBuildPhase({
  admissionReadPort: {
    async rereadQualificationImageSupplyChainAdmission() {
      return structuredClone(admission)
    },
  },
  statePort: state.port,
  authenticatedTransport: {
    async request(request) {
      providerCalls += 1
      if (request.method === 'POST') {
        submittedBody = request.body
        return { status: 200, json: createOperation(buildId) }
      }
      return {
        status: 200,
        json: successfulBuild(
          buildId,
          submittedBody ?? body,
          admission.evidenceBucket,
          admission.evidencePrefix,
        ),
      }
    },
  },
  now: () => '2026-08-04T14:01:00.000Z',
})

const admissionRef = qualificationImageSupplyChainAdmissionReference(admission)
const submission = await phase.startOneSupplyChainBuild({ admissionRef })
assertCanonicalSam31QualificationImageSupplyChainSubmission(submission)
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(submission.sourceCheckpointQualificationGranted, false)
assert.equal(submission.gpuQualificationJobDispatched, false)
assert.equal(submission.customerCreditMutationCreated, false)
assert.deepEqual(submittedBody, body)
assert.equal(providerCalls, 1)

const duplicate = await phase.startOneSupplyChainBuild({ admissionRef })
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(providerCalls, 1)

const observation = await phase.observeOneSupplyChainBuild({
  admission,
  submission,
})
assertCanonicalSam31QualificationImageSupplyChainObservation(observation)
assert.equal(
  observation.disposition,
  'supply_chain_artifacts_ready_pending_exact_reread',
)
assert.equal(observation.allPinnedBuildStepsCompleted, true)
assert.equal(observation.sbomBuildArtifactCreated, true)
assert.equal(observation.digestSignatureCreatedAndVerified, true)
assert.equal(observation.evidenceArtifactsExactReread, false)
assert.equal(observation.vulnerabilityOccurrencesReread, false)
assert.equal(observation.originalBuildProvenanceReread, false)
assert.equal(observation.imageSupplyChainReleaseGranted, false)
assert.equal(observation.sourceCheckpointQualificationGranted, false)
assert.equal(observation.gpuQualificationJobDispatched, false)
assert.equal(observation.runtimeReleaseGranted, false)
assert.equal(observation.customerCreditMutationCreated, false)
assert.equal(observation.productionReady, false)

const runtimeObjects = createJsonObjectPort()
let runtimeProviderCalls = 0
let runtimeSubmittedBody: Readonly<Record<string, unknown>> | undefined
const runtime =
  createCanonicalSam31QualificationImageSupplyChainBuildRuntime({
    objectPort: runtimeObjects.port,
    authenticatedTransport: {
      async request(request) {
        runtimeProviderCalls += 1
        if (request.method === 'POST') {
          runtimeSubmittedBody = request.body
          return { status: 200, json: createOperation(buildId) }
        }
        return {
          status: 200,
          json: successfulBuild(
            buildId,
            runtimeSubmittedBody ?? body,
            admission.evidenceBucket,
            admission.evidencePrefix,
          ),
        }
      },
    },
    now: () => '2026-08-04T14:01:00.000Z',
  })
const runtimeAdmissionRef = await runtime.persistAdmissionCreateOnly({
  admission,
})
const runtimeSubmission = await runtime.startOneSupplyChainBuild({
  admissionRef: runtimeAdmissionRef,
})
const runtimeSubmissionRef =
  qualificationImageSupplyChainSubmissionReference(runtimeSubmission)
const runtimeObservation = await runtime.observeOnePersistedSupplyChainBuild({
  admissionRef: runtimeAdmissionRef,
  submissionRef: runtimeSubmissionRef,
})
assert.equal(
  runtimeObservation.disposition,
  'supply_chain_artifacts_ready_pending_exact_reread',
)
assert.equal(runtimeObservation.durableTerminalObservationCreated, true)
assert.deepEqual(
  await runtime.observeOnePersistedSupplyChainBuild({
    admissionRef: runtimeAdmissionRef,
    submissionRef: runtimeSubmissionRef,
  }),
  runtimeObservation,
)
assert.equal(runtimeProviderCalls, 2)
assert.equal(
  (await runtime.repository.rereadTerminalForSubmission({
    submissionRef: runtimeSubmissionRef,
  }))?.observationHash,
  runtimeObservation.observationHash,
)

const supplyChainEvidence = createSupplyChainEvidence({
  authority,
  imageBuildSubmission,
  imageBuildTerminal,
  admission,
  submission,
  observation,
})
const qualificationEvidenceObjects = createQualificationEvidenceObjects({
  admission,
  observation,
  imageDigest: imageBuildTerminal.immutableImageDigest ?? '',
})
const qualificationEvidenceUrls: string[] = []
let securityReviewReads = 0
const releaseObjects = createJsonObjectPort()
const releaseRepository =
  createCanonicalSam31QualificationImageSupplyChainReleaseRepository({
    objectPort: releaseObjects.port,
  })
const canonicalEvidenceReadPort =
  createCanonicalSam31QualificationImageSupplyChainEvidenceReadPort({
    imageBuildAuthority: authority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainBuildAdmission: admission,
    supplyChainBuildSubmission: submission,
    supplyChainBuildObservation: observation,
    privateObjectReadPort: qualificationEvidenceObjects.port,
    googleReadTransport: {
      async getJson(url) {
        qualificationEvidenceUrls.push(url)
        return qualificationGoogleEvidenceResponse({
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
          reviewId: 'sam31-qualification-image-security-review-1',
          immutableImageDigest: request.immutableImageDigest,
          vulnerabilityScanRef: request.vulnerabilityScanRef,
          scanCompletedAt: request.scanCompletedAt,
          occurrenceSnapshotUpdatedAt:
            request.occurrenceSnapshotUpdatedAt,
          severityCounts: request.severityCounts,
          reviewerAuthorityRef: ref(
            'sam31-qualification-image-security-reviewer',
          ),
          reviewedAt: '2026-08-04T14:02:45.000Z',
        })
        await releaseRepository.persistApprovedSecurityReviewCreateOnly({
          review,
        })
        return releaseRepository.rereadApprovedReview(request)
      },
    },
  })
export const release =
  await prepareAndPersistCanonicalSam31QualificationImageSupplyChainRelease({
  releaseId: 'sam31-qualification-image-supply-chain-release-1',
  authority,
  imageBuildSubmission,
  imageBuildTerminal,
  supplyChainBuildAdmission: admission,
  supplyChainBuildSubmission: submission,
  supplyChainBuildObservation: observation,
  evidenceReadPort: canonicalEvidenceReadPort,
  qualifiedAt: '2026-08-04T14:03:00.000Z',
  repository: releaseRepository,
  })
assertCanonicalSam31QualificationImageSupplyChainRelease(release)
assert.equal(release.status, 'image_supply_chain_qualified')
assert.equal(release.imageRole, 'qualification_image')
assert.equal(release.authority.qualificationImageSupplyChainQualified, true)
assert.equal(
  release.authority.sourceCheckpointQualificationImageAdmissible,
  true,
)
assert.equal(release.authority.sourceCheckpointQualificationGranted, false)
assert.equal(release.authority.gpuQualificationJobDispatched, false)
assert.equal(release.authority.customerCreditMutationAllowed, false)
assert.equal(release.authority.productionReady, false)
assert.equal(securityReviewReads, 1)
assert.equal(releaseObjects.records.size, 2)
assert.equal(qualificationEvidenceObjects.reads.length, 4)
assert.equal(qualificationEvidenceUrls.length, 6)
for (const url of qualificationEvidenceUrls) {
  assert.doesNotThrow(() =>
    assertCanonicalSam31ImageSupplyChainGoogleReadUrl(url))
}

await assert.rejects(() =>
  prepareCanonicalSam31QualificationImageSupplyChainRelease({
    releaseId: 'sam31-qualification-image-high-vulnerability-refusal',
    authority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainBuildAdmission: admission,
    supplyChainBuildSubmission: submission,
    supplyChainBuildObservation: observation,
    evidenceReadPort: {
      async rereadExactQualificationImageSupplyChain() {
        const crossed = structuredClone(supplyChainEvidence)
        crossed.vulnerabilityScan.highCount = 1
        return crossed
      },
    },
    qualifiedAt: '2026-08-04T14:03:00.000Z',
  }),
)

await assert.rejects(() =>
  prepareCanonicalSam31QualificationImageSupplyChainRelease({
    releaseId: 'sam31-qualification-image-crossed-provenance-refusal',
    authority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainBuildAdmission: admission,
    supplyChainBuildSubmission: submission,
    supplyChainBuildObservation: observation,
    evidenceReadPort: {
      async rereadExactQualificationImageSupplyChain() {
        const crossed = structuredClone(supplyChainEvidence)
        crossed.provenance.sourceGeneration = '9999'
        return crossed
      },
    },
    qualifiedAt: '2026-08-04T14:03:00.000Z',
  }),
)

const tamperedRelease = structuredClone(release) as Record<string, unknown>
tamperedRelease.releaseId = 'caller-relabelled-release'
assert.throws(() =>
  assertCanonicalSam31QualificationImageSupplyChainRelease(tamperedRelease),
)

const staleAdmission = structuredClone(admission) as Record<string, unknown>
staleAdmission.admissionHash = '0'.repeat(64)
let staleCalls = 0
const stalePhase = createCanonicalSam31QualificationImageSupplyChainBuildPhase({
  admissionReadPort: {
    async rereadQualificationImageSupplyChainAdmission() {
      return staleAdmission as never
    },
  },
  statePort: createStatePort().port,
  authenticatedTransport: {
    async request() {
      staleCalls += 1
      throw new Error('must not execute')
    },
  },
})
const staleRejected = await stalePhase.startOneSupplyChainBuild({
  admissionRef,
})
assert.equal(staleRejected.disposition, 'rejected_before_creation')
assert.equal(staleCalls, 0)

const thrown = await unknownSubmission('throw')
assert.equal(thrown.disposition, 'outcome_unknown')
assert.equal(thrown.providerOutcome, 'unknown')
assert.equal(thrown.automaticRetryAllowed, false)
const nonOk = await unknownSubmission('non_ok')
assert.equal(nonOk.disposition, 'outcome_unknown')
assert.equal(nonOk.providerHttpStatus, 503)
assert.equal(nonOk.automaticRetryAllowed, false)

const mismatchPhase =
  createCanonicalSam31QualificationImageSupplyChainBuildPhase({
    admissionReadPort: {
      async rereadQualificationImageSupplyChainAdmission() {
        return structuredClone(admission)
      },
    },
    statePort: createStatePort().port,
    authenticatedTransport: {
      async request() {
        const result = successfulBuild(
          buildId,
          body,
          admission.evidenceBucket,
          admission.evidencePrefix,
        )
        result.tags = ['weeditpro', 'sam3-1', 'injected-step']
        return { status: 200, json: result }
      },
    },
  })
const mismatch = await mismatchPhase.observeOneSupplyChainBuild({
  admission,
  submission,
})
assert.equal(mismatch.disposition, 'outcome_unknown')
assert.equal(mismatch.evidenceArtifactManifestUri, null)

const wrongTerminal = structuredClone(imageBuildTerminal) as Record<
  string,
  unknown
>
wrongTerminal.artifactRegistryPackage =
  'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu'
delete wrongTerminal.observationHash
const wrongTerminalPayload = wrongTerminal
assert.throws(() => createCanonicalSam31QualificationImageSupplyChainAdmission({
  admissionId: 'sam31-wrong-package-admission',
  authority,
  imageBuildSubmission,
  imageBuildTerminal: assertCanonicalSam31QualificationImageBuildTerminal({
    ...wrongTerminalPayload,
    observationHash: sha256AuthorityValue(wrongTerminalPayload),
  }),
  kmsKeyVersionResource: kmsKey,
  admittedAt: '2026-08-04T14:02:00.000Z',
}))

console.log(JSON.stringify({
  qualification:
    'canonical-sam3_1-qualification-image-supply-chain-build-smoke-v1',
  checks: {
    sameCanonicalSupplyChainOwner: true,
    qualificationImageRoleDiscriminated: true,
    exactImmutableDigestBound: true,
    pinnedSbomAndCosignToolchain: true,
    durableSingleUseBeforeCloudCall: true,
    noCheckpointReceiptMediaOrCallerSecrets: true,
    uncertainOutcomeNotAutomaticallyRetried: true,
    exactTerminalConfigurationRequired: true,
    evidenceRereadStillPending: true,
    exactSupplyChainReleaseReread: true,
    createOnlyReleasePersistenceAndExactReread: true,
    canonicalGoogleMetadataAndArtifactReread: true,
    qualificationImageReadUrlsStrictlyAllowlisted: true,
    highSeverityVulnerabilityRefused: true,
    crossedOriginalBuildProvenanceRefused: true,
    postDigestReleaseMutationRefused: true,
    sourceCheckpointQualificationGranted: false,
    gpuQualificationJobDispatched: false,
    customerCreditsMutated: false,
    developerMachineModelInstallOrExecution: false,
    productionReady: false,
  },
}, null, 2))

function createQualificationEvidenceObjects(input: {
  admission: typeof admission
  observation: typeof observation
  imageDigest: string
}) {
  const [sbomPath, bundlePath, verificationPath] =
    input.admission.evidenceArtifactPaths
  const spdx = Buffer.from(JSON.stringify({
    spdxVersion: 'SPDX-2.3',
    SPDXID: 'SPDXRef-DOCUMENT',
    dataLicense: 'CC0-1.0',
    name: `sam31-qualification-${input.imageDigest.slice(-12)}`,
    documentNamespace:
      `https://weeditpro.invalid/sbom/${input.imageDigest.slice(7)}`,
    creationInfo: {
      created: '2026-08-04T14:01:00Z',
      creators: ['Tool: syft-1.44.0'],
    },
    documentDescribes: ['SPDXRef-Package-sam31-qualification-runtime'],
    packages: [{
      SPDXID: 'SPDXRef-Package-sam31-qualification-runtime',
      name: 'sam31-qualification-runtime',
      versionInfo: '96914d2425f90a64f45ca977c2b5165418099543',
    }],
    relationships: [{
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: 'SPDXRef-Package-sam31-qualification-runtime',
    }],
  }))
  const bundle = Buffer.from(JSON.stringify({
    mediaType: 'application/vnd.dev.sigstore.bundle.v0.3+json',
    verificationMaterial: {
      publicKey: { hint: 'weeditpro-sam31-image-signing-key-version-9' },
    },
    messageSignature: {
      messageDigest: {
        algorithm: 'SHA2_256',
        digest: Buffer.from(input.imageDigest.slice(7), 'hex')
          .toString('base64'),
      },
      signature: Buffer.alloc(64, 9).toString('base64'),
    },
  }))
  const verification = Buffer.from(JSON.stringify([{
    critical: {
      identity: {
        'docker-reference':
          'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-qualification',
      },
      image: { 'docker-manifest-digest': input.imageDigest },
      type: 'cosign container image signature',
    },
    optional: null,
  }]))
  const bodies = new Map<string, Buffer>([
    [sbomPath, spdx],
    [bundlePath, bundle],
    [verificationPath, verification],
  ])
  const generations = new Map<string, string>([
    [sbomPath, '6201'],
    [bundlePath, '6202'],
    [verificationPath, '6203'],
  ])
  const manifestEntries = [...bodies.entries()].map(([path, value]) => ({
    location:
      `gs://${input.admission.evidenceBucket}/`
        + `${input.admission.evidencePrefix}/${path}#${generations.get(path)}`,
    file_hash: [{
      file_hash: [{
        type: 2,
        value: Buffer.from(
          createHash('md5').update(value).digest('base64'),
          'utf8',
        ).toString('base64'),
      }],
    }],
  }))
  const manifestBody = Buffer.from(
    manifestEntries.map((entry) => JSON.stringify(entry)).join('\n'),
  )
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
      if (request.objectName === manifestName && request.generation === '6101') {
        return {
          body: Buffer.from(manifestBody),
          generation: '6101',
          etag: 'sam31-qualification-artifact-manifest-etag',
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
        etag: `sam31-qualification-${path}-etag`,
        contentType: 'application/json',
      }
    },
  }
  return { port, reads }
}

function qualificationGoogleEvidenceResponse(input: {
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
          + 'reeditpro-workers/dockerImages/'
          + `reeditpro-sam31-qualification@${imageDigest}`,
      uri: imageUri,
      tags: [input.authority.imageDestination.taggedUri],
      imageSizeBytes: '5368709120',
      uploadTime: '2026-08-04T13:59:30Z',
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      buildTime: '2026-08-04T13:59:00Z',
      updateTime: '2026-08-04T13:59:30Z',
    },
  }
  if (url.origin === 'https://cloudbuild.googleapis.com') {
    if (url.pathname.endsWith(`/${input.imageBuildTerminal.cloudBuildId}`)) {
      return {
        status: 200,
        json: successfulQualificationImageBuild(
          input.authority,
          input.imageBuildTerminal,
        ),
      }
    }
    if (url.pathname.endsWith(`/${input.observation.cloudBuildId}`)) return {
      status: 200,
      json: successfulBuild(
        input.observation.cloudBuildId,
        input.supplyChainBuildBody,
        input.admission.evidenceBucket,
        input.admission.evidencePrefix,
      ),
    }
  }
  if (url.origin === 'https://containeranalysis.googleapis.com') {
    const filter = url.searchParams.get('filter') ?? ''
    if (filter.includes('kind="DISCOVERY"')) return {
      status: 200,
      json: { occurrences: [qualificationDiscoveryOccurrence(imageUri)] },
    }
    if (filter.includes('kind="VULNERABILITY"')) return {
      status: 200,
      json: { occurrences: [] },
    }
    if (filter.includes('kind="BUILD"')) return {
      status: 200,
      json: {
        occurrences: [qualificationBuildProvenanceOccurrence(
          imageUri,
          imageDigest,
          input.authority.imageDestination.taggedUri,
          input.imageBuildTerminal.cloudBuildResource,
        )],
      },
    }
  }
  return { status: 404, json: { error: { code: 404 } } }
}

function successfulQualificationImageBuild(
  value: typeof authority,
  terminal: typeof imageBuildTerminal,
) {
  const expected = compileCanonicalSam31QualificationImageBuildRequestBody(
    value,
  )
  const source = structuredClone(expected.source) as {
    storageSource: Record<string, unknown>
  }
  source.storageSource.sourceFetcher = 'GCS_FETCHER'
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

function qualificationDiscoveryOccurrence(imageUri: string) {
  return {
    name:
      'projects/reeditpro/occurrences/61111111-1111-4111-8111-111111111111',
    resourceUri: `https://${imageUri}`,
    noteName: 'projects/goog-analysis/notes/discovery-sam31-qualification',
    kind: 'DISCOVERY',
    createTime: '2026-08-04T14:01:00Z',
    updateTime: '2026-08-04T14:02:00Z',
    discovery: {
      analysisStatus: 'FINISHED_SUCCESS',
      continuousAnalysis: 'ACTIVE',
      analysisCompleted: {
        analysisType: ['OS_VULNERABILITY', 'PACKAGE_VULNERABILITY'],
      },
    },
  }
}

function qualificationBuildProvenanceOccurrence(
  imageUri: string,
  imageDigest: string,
  taggedImageUri: string,
  cloudBuildResource: string,
) {
  const statement = {
    _type: 'https://in-toto.io/Statement/v1',
    predicateType: 'https://slsa.dev/provenance/v1',
    subject: [{
      name: `https://${taggedImageUri}`,
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
          startedOn: '2026-08-04T13:58:30Z',
          finishedOn: '2026-08-04T13:59:30Z',
        },
      },
    },
  }
  return {
    name:
      'projects/reeditpro/occurrences/64444444-4444-4444-8444-444444444444',
    resourceUri: `https://${imageUri}`,
    noteName: 'projects/verified-builder/notes/slsa-v1-sam31-qualification',
    kind: 'BUILD',
    createTime: '2026-08-04T13:59:31Z',
    updateTime: '2026-08-04T13:59:31Z',
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

function createSupplyChainEvidence(input: {
  authority: typeof authority
  imageBuildSubmission: typeof imageBuildSubmission
  imageBuildTerminal: typeof imageBuildTerminal
  admission: typeof admission
  submission: typeof submission
  observation: typeof observation
}) {
  const imageDigest = input.imageBuildTerminal.immutableImageDigest
  const imageUri = input.imageBuildTerminal.immutableImageUri
  assert(imageDigest)
  assert(imageUri)
  const sbomSha256 = digest('qualification-image-spdx-sbom')
  return {
    evidenceClass: 'canonical_private_reread' as const,
    imageMetadata: {
      projectId: 'reeditpro' as const,
      region: 'us-central1' as const,
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
      packageResource:
        'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification' as const,
      immutableImageUri: imageUri,
      immutableImageDigest: imageDigest,
      containerManifestMediaType:
        'application/vnd.oci.image.manifest.v1+json' as const,
      exactDigestReread: true,
      mutableTagUsedAsAuthority: false as const,
    },
    supplyChainArtifacts: {
      admissionRef: qualificationImageSupplyChainAdmissionReference(
        input.admission,
      ),
      submissionRef: qualificationImageSupplyChainSubmissionReference(
        input.submission,
      ),
      observationRef: qualificationImageSupplyChainObservationReference(
        input.observation,
      ),
      cloudBuildId: input.observation.cloudBuildId,
      cloudBuildResource: input.observation.cloudBuildResource,
      exactCloudBuildReread: true,
      exactArtifactManifestReread: true,
      exactThreeArtifactSetReread: true,
    },
    sbom: {
      format: 'spdx_2_3_json' as const,
      artifactRef: {
        id: 'sam31-qualification-image-spdx-sbom',
        version: 1 as const,
        contentHash: `sha256:${sbomSha256}` as const,
      },
      contentSha256: sbomSha256,
      imageDigest,
      generatorImageRef: ref('pinned-syft-generator-image'),
      completeOsAndApplicationPackageInventory: true,
      exactArtifactReread: true,
    },
    vulnerabilityScan: {
      scanner: 'google_artifact_analysis' as const,
      scanRef: ref('sam31-qualification-image-artifact-analysis-scan'),
      imageDigest,
      scanCompletedAt: '2026-08-04T14:02:30.000Z',
      vulnerabilityDatabaseUpdatedAt: '2026-08-04T13:50:00.000Z',
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      unknownSeverityCount: 0,
      exactOccurrencesReread: true,
      securityReviewRef: ref('sam31-qualification-image-security-review'),
      securityReviewApprovedForPrivateGpuQualification: true,
    },
    signature: {
      scheme: 'cosign_kms_sha256' as const,
      signatureRef: ref('sam31-qualification-image-cosign-signature'),
      imageDigest,
      kmsKeyVersionResource: input.admission.kmsKeyVersionResource,
      signerServiceAccount:
        'reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const,
      exactSignatureVerificationPassed: true,
    },
    provenance: {
      predicateType: 'https://slsa.dev/provenance/v1' as const,
      attestationRef: ref('sam31-qualification-image-slsa-provenance'),
      imageDigest,
      cloudBuildId: input.imageBuildTerminal.cloudBuildId,
      cloudBuildResource: input.imageBuildTerminal.cloudBuildResource,
      buildAuthorityRef: input.imageBuildSubmission.authorityRef,
      buildSubmissionRef: {
        id:
          `sam31-qualification-image-submission-${input.imageBuildSubmission.submissionHash.slice(0, 20)}`,
        version: 1 as const,
        contentHash:
          `sha256:${input.imageBuildSubmission.submissionHash}` as const,
      },
      buildRequestHash: input.imageBuildSubmission.buildRequestHash,
      sourceBucket: input.authority.capsuleCoordinate.bucketName,
      sourceObject: input.authority.capsuleCoordinate.objectName,
      sourceGeneration: input.authority.capsuleCoordinate.generation,
      sourceSha256: input.authority.capsuleCoordinate.sha256,
      exactAttestationRereadAndVerified: true,
    },
  }
}

async function unknownSubmission(mode: 'throw' | 'non_ok') {
  const unknownPhase =
    createCanonicalSam31QualificationImageSupplyChainBuildPhase({
      admissionReadPort: {
        async rereadQualificationImageSupplyChainAdmission() {
          return structuredClone(admission)
        },
      },
      statePort: createStatePort().port,
      authenticatedTransport: {
        async request() {
          if (mode === 'throw') throw new Error('provider outcome unknown')
          return { status: 503, json: { error: 'unavailable' } }
        },
      },
    })
  return unknownPhase.startOneSupplyChainBuild({ admissionRef })
}

function createAuthority() {
  const capsuleSha = digest('sam31-qualification-capsule')
  const tag = `sam31-qual-96914d2-${capsuleSha.slice(0, 16)}`
  const payload = {
    schemaVersion: 'canonical-sam3_1-qualification-image-build-authority-v1',
    source: 'canonical_sam3_1_cloud_image_build_authority_owner',
    buildPurpose: 'source_checkpoint_qualification',
    evidenceClass: 'canonical_private_reread',
    status: 'authorized_for_private_cloud_build',
    authorityId: 'sam31-qualification-image-build-authority-fixture',
    authorityVersion: 1,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    candidateRef: {
      schemaVersion: 'canonical-sam3_1-source-runtime-candidate-v4',
      candidateHash: digest('candidate'),
    },
    ingestReceiptRef: {
      ...ref('sam31-ingest'),
      schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    },
    capsuleManifestRef: ref('sam31-qualification-capsule-manifest'),
    capsuleCoordinate: {
      projectId: 'reeditpro',
      bucketName: 'reeditpro-production-reeditpro-image-build-inputs',
      objectName:
        `private/image-build-inputs/sam3_1/qualification/${capsuleSha}.tar.gz`,
      generation: '4101',
      etag: 'qualification-capsule-etag',
      byteLength: 4096,
      sha256: capsuleSha,
    },
    imageDestination: {
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers',
      imageName: 'reeditpro-sam31-qualification',
      tag,
      taggedUri:
        `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-qualification:${tag}`,
      callerSelectedTagAllowed: false,
      tagMayAuthorizeQualificationOrRuntime: false,
      terminalImmutableDigestRequired: true,
    },
    buildClosure: {
      dockerfilePath:
        'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
      dockerfileSha256: digest('dockerfile'),
      runnerSha256: digest('runner'),
      entrypointSha256: digest('entrypoint'),
      sourceProvenanceLockSha256: digest('provenance'),
      dependencyLockSha256: digest('lock'),
      dependencyClosureReceiptSha256: digest('closure'),
      dependencyWheelManifestSha256: digest('wheel-manifest'),
      patchApplicationReceiptSha256: digest('patch-receipt'),
      cudaForwardCompatIngestReceiptSha256: digest('cuda-receipt'),
    },
    cloudBuildPolicy: {
      projectId: 'reeditpro',
      location: 'us-central1',
      regionalCreateEndpoint:
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
      builderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147',
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com',
      machineType: 'E2_HIGHCPU_32',
      diskSizeGb: '200',
      timeout: '3600s',
      queueTtl: '600s',
      sourceFetcher: 'GCS_FETCHER',
      sourceProvenanceHashes: ['SHA256'],
      requestedVerifyOption: 'VERIFIED',
      logging: 'CLOUD_LOGGING_ONLY',
      noSecretsOrSubstitutions: true,
      noTriggerOrMutableRepositorySource: true,
      singleFixedBuildStep: true,
    },
    authority: {
      canonicalPrivateIngestReread: true,
      privateCapsuleReread: true,
      qualificationImageBuildAuthorized: true,
      sourceCheckpointQualificationRequiredBeforeBuild: false,
      durableSingleUseConsumptionRequiredBeforeCloudCall: true,
      browserOrCallerMaySubmitBuild: false,
      checkpointIncludedInImage: false,
      qualificationReceiptIncludedInImage: false,
      imageBuildStarted: false,
      imagePushed: false,
      sourceCheckpointQualificationGranted: false,
      runtimeReleaseGranted: false,
      gpuJobDispatched: false,
      customerCreditMutationAllowed: false,
      qaApproved: false,
      productionReady: false,
    },
    preparedAt: '2026-08-04T13:00:00.000Z',
  } as const
  return assertCanonicalSam31QualificationImageBuildAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function createImageBuildSubmission(authority: ReturnType<
  typeof createAuthority
>) {
  const requestHash = sha256AuthorityValue(
    compileCanonicalSam31QualificationImageBuildRequestBody(authority),
  )
  const payload = {
    schemaVersion:
      'canonical-sam3_1-qualification-image-build-submission-v1',
    source: 'canonical_sam3_1_cloud_image_build_submission_owner',
    buildPurpose: 'source_checkpoint_qualification',
    disposition: 'submitted',
    authorityRef: {
      id: authority.authorityId,
      version: 1,
      contentHash: `sha256:${authority.authorityHash}`,
    },
    operationId: authority.operationId,
    buildRequestHash: requestHash,
    buildRequestBodyRef: {
      id: 'sam31-qualification-image-build-request-fixture',
      version: 1,
      contentHash: `sha256:${requestHash}`,
    },
    providerHttpStatus: 200,
    cloudBuildOperationName: 'operations/qualification-image-build-fixture',
    cloudBuildId: '44444444-4444-4444-8444-444444444444',
    cloudBuildResource:
      'projects/reeditpro/locations/us-central1/builds/44444444-4444-4444-8444-444444444444',
    providerOutcome: 'executed',
    durableAuthorityConsumptionCreated: true,
    durableSubmissionObservationCreated: true,
    automaticRetryAllowed: false,
    imageBuildKnownStarted: true,
    imagePushKnownCompleted: false,
    immutableImageDigestKnown: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    observedAt: '2026-08-04T13:01:00.000Z',
  } as const
  return assertCanonicalSam31QualificationImageBuildSubmission({
    ...payload,
    submissionHash: sha256AuthorityValue(payload),
  })
}

function createImageBuildTerminal(
  authority: ReturnType<typeof createAuthority>,
  submission: ReturnType<typeof createImageBuildSubmission>,
) {
  const imageDigest = `sha256:${digest('qualification-image')}` as const
  const payload = {
    schemaVersion:
      'canonical-sam3_1-qualification-image-build-terminal-observation-v1',
    source: 'canonical_sam3_1_cloud_image_build_terminal_owner',
    buildPurpose: 'source_checkpoint_qualification',
    disposition: 'qualification_image_built_pending_supply_chain_release',
    authorityRef: submission.authorityRef,
    submissionRef: {
      id: `sam31-qualification-image-submission-${submission.submissionHash.slice(0, 20)}`,
      version: 1,
      contentHash: `sha256:${submission.submissionHash}`,
    },
    cloudBuildId: submission.cloudBuildId,
    cloudBuildResource: submission.cloudBuildResource,
    providerHttpStatus: 200,
    cloudBuildStatus: 'SUCCESS',
    exactBuildConfigurationEchoVerified: true,
    exactStorageGenerationProvenanceVerified: true,
    verifiedProvenanceAndAttestationRequested: true,
    warningsAbsent: true,
    taggedImageUri: authority.imageDestination.taggedUri,
    immutableImageDigest: imageDigest,
    immutableImageUri:
      `${authority.imageDestination.repository}/${authority.imageDestination.imageName}@${imageDigest}`,
    artifactRegistryPackage:
      `projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification/versions/${imageDigest}`,
    durableTerminalObservationCreated: true,
    imageBuiltAndPushed: true,
    sbomReread: false,
    imageScanPassed: false,
    imageSignatureVerified: false,
    provenanceVerified: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditMutationCreated: false,
    productionReady: false,
    observedAt: '2026-08-04T13:02:00.000Z',
  } as const
  return assertCanonicalSam31QualificationImageBuildTerminal({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

function createOperation(buildId: string) {
  return {
    name: 'operations/sam31-qualification-supply-chain-1',
    metadata: { build: {
      id: buildId,
      name: `projects/390722338345/locations/us-central1/builds/${buildId}`,
      projectId: 'reeditpro',
    } },
  }
}

function successfulBuild(
  buildId: string,
  body: Readonly<Record<string, unknown>>,
  bucket: string,
  prefix: string,
) {
  const artifacts = structuredClone(body.artifacts) as {
    objects: Record<string, unknown>
  }
  artifacts.objects.timing = {
    startTime: '2026-08-04T20:00:30Z',
    endTime: '2026-08-04T20:00:40Z',
  }
  return {
    id: buildId,
    name: `projects/390722338345/locations/us-central1/builds/${buildId}`,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    warnings: [],
    steps: structuredClone(body.steps),
    artifacts,
    timeout: body.timeout,
    queueTtl: body.queueTtl,
    options: structuredClone(body.options),
    serviceAccount: body.serviceAccount,
    tags: structuredClone(body.tags),
    results: {
      artifactManifest:
        `gs://${bucket}/${prefix}/artifacts-${buildId}.json#6101`,
      numArtifacts: 3,
    },
  }
}

function createStatePort() {
  const consumed = new Set<string>()
  const submissions = new Set<string>()
  const observations = new Set<string>()
  const port: CanonicalSam31QualificationImageSupplyChainStatePort = {
    async consumeQualificationImageSupplyChainAdmissionCreateOnly(input) {
      const key = `${input.admissionRef.contentHash}:${input.buildRequestHash}`
      if (consumed.has(key)) return false
      consumed.add(key)
      return true
    },
    async persistQualificationImageSupplyChainSubmissionCreateOnly(input) {
      if (submissions.has(input.submission.submissionHash)) return false
      submissions.add(input.submission.submissionHash)
      return true
    },
    async persistQualificationImageSupplyChainObservationCreateOnly(input) {
      if (observations.has(input.observation.observationHash)) return false
      observations.add(input.observation.observationHash)
      return true
    },
  }
  return { port, consumed, submissions, observations }
}

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
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
