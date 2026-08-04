import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import {
  assertCanonicalSam31QualificationImageBuildSubmission,
  assertCanonicalSam31QualificationImageBuildTerminal,
} from '../services/canonical-sam3_1-qualification-image-build-phase'
import {
  assertCanonicalSam31QualificationImageSupplyChainAdmission,
  assertCanonicalSam31QualificationImageSupplyChainObservation,
  assertCanonicalSam31QualificationImageSupplyChainSubmission,
  compileCanonicalSam31QualificationImageSupplyChainBody,
  createCanonicalSam31QualificationImageSupplyChainAdmission,
  createCanonicalSam31QualificationImageSupplyChainBuildPhase,
  qualificationImageSupplyChainAdmissionReference,
  type CanonicalSam31QualificationImageSupplyChainStatePort,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

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
const { observationHash: _hash, ...wrongTerminalPayload } = wrongTerminal as {
  observationHash: string
}
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
    sourceCheckpointQualificationGranted: false,
    gpuQualificationJobDispatched: false,
    customerCreditsMutated: false,
    developerMachineModelInstallOrExecution: false,
    productionReady: false,
  },
}, null, 2))

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
      schemaVersion: 'canonical-sam3_1-source-runtime-candidate-v3',
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
  const requestHash = digest('qualification-image-build-request')
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
      'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-qualification',
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
      name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
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
  return {
    id: buildId,
    name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
    projectId: 'reeditpro',
    status: 'SUCCESS',
    warnings: [],
    steps: structuredClone(body.steps),
    artifacts: structuredClone(body.artifacts),
    timeout: body.timeout,
    queueTtl: body.queueTtl,
    options: structuredClone(body.options),
    serviceAccount: body.serviceAccount,
    tags: structuredClone(body.tags),
    results: {
      artifactManifest:
        `gs://${bucket}/${prefix}/artifact-manifest.json#6101`,
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
