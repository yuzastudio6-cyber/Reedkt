import assert from 'node:assert/strict'

import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_AUTHORITY_VERSION,
  assertCanonicalSam31CloudImageBuildAuthority,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import { CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION } from
  '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import { CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  compileCanonicalSam31CloudBuildRequestBody,
} from '../services/canonical-sam3_1-cloud-image-build-service'
import {
  canonicalSam31CloudImageBuildSubmissionRef,
  canonicalSam31CloudImageBuildTerminalObservationRef,
  createCanonicalSam31CloudImageBuildRepository,
  createCanonicalSam31CloudImageBuildRuntime,
  createCanonicalSam31GcpCloudImageBuildRuntime,
  createCanonicalSam31GoogleCloudBuildAuthenticatedTransport,
} from '../services/canonical-sam3_1-cloud-image-build-runtime'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import { release as qualificationRelease } from
  './canonical-sam3_1-source-checkpoint-qualification-release-owner-smoke'

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    const existing = objects.get(input.objectPath)
    if (existing) {
      if (!existing.equals(input.body)) throw new Error('create-only collision')
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(objectPath) {
    const body = objects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}

const authority = createAuthority()
const buildBody = compileCanonicalSam31CloudBuildRequestBody(authority)
const buildId = '11111111-1111-4111-8111-111111111111'
const authRequests: Record<string, unknown>[] = []
let submittedBody: Readonly<Record<string, unknown>> | undefined
const fakeAuth = {
  async request(options: Record<string, unknown>) {
    authRequests.push({
      url: options.url,
      method: options.method,
      data: structuredClone(options.data),
      timeout: options.timeout,
      retry: options.retry,
      maxRedirects: options.maxRedirects,
      responseType: options.responseType,
      validateStatusProvided: typeof options.validateStatus === 'function',
    })
    if (options.method === 'POST') {
      submittedBody = options.data as Readonly<Record<string, unknown>>
      return {
        status: 200,
        data: {
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
    }
    return {
      status: 200,
      data: successfulBuildResource(
        buildId,
        submittedBody ?? buildBody,
        authority.imageDestination.taggedUri,
      ),
    }
  },
} as unknown as Pick<GoogleAuth, 'request'>

const transport = createCanonicalSam31GoogleCloudBuildAuthenticatedTransport({
  auth: fakeAuth,
  requestTimeoutMilliseconds: 12_000,
})
const repository = createCanonicalSam31CloudImageBuildRepository({
  objectPort,
})
const runtime = createCanonicalSam31CloudImageBuildRuntime({
  repository,
  qualificationReleaseReadPort: {
    async rereadQualificationRelease() {
      return structuredClone(qualificationRelease)
    },
  },
  authenticatedTransport: transport,
  now: () => '2026-08-03T18:00:00.000Z',
})

assert.equal(runtime.cloudGpuImageBuildOnly, true)
assert.equal(
  runtime.developerMachineModelCheckpointCudaOrGpuRuntimeInstallAllowed,
  false,
)
const authorityRef = await runtime.persistBuildAuthorityCreateOnly({
  authority,
})
assert.equal(
  (await repository.rereadBuildAuthority({ authorityRef }))?.authorityHash,
  authority.authorityHash,
)

const submission = await runtime.startOneImageBuild({ authorityRef })
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.providerOutcome, 'executed')
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(authRequests.length, 1)
assert.equal(authRequests[0].url,
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds?projectId=reeditpro')
assert.equal(authRequests[0].method, 'POST')
assert.equal(authRequests[0].retry, false)
assert.equal(authRequests[0].maxRedirects, 0)
assert.equal(authRequests[0].timeout, 12_000)
assert.equal(authRequests[0].responseType, 'json')
assert.equal(authRequests[0].validateStatusProvided, true)
assert.equal(
  JSON.stringify(authRequests[0]).includes('sam3.1_multiplex.pt'),
  false,
)

const duplicate = await runtime.startOneImageBuild({ authorityRef })
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(duplicate.providerOutcome, 'not_executed')
assert.equal(authRequests.length, 1)

const submissionRef = canonicalSam31CloudImageBuildSubmissionRef(submission)
assert.equal(
  (await repository.rereadSubmission({ submissionRef }))?.submissionHash,
  submission.submissionHash,
)
const terminal = await runtime.observeOnePersistedImageBuild({
  authorityRef,
  submissionRef,
})
assert.equal(
  terminal.disposition,
  'image_built_pending_scan_signature_and_gpu_qualification',
)
assert.equal(terminal.cloudBuildStatus, 'SUCCESS')
assert.equal(terminal.imageBuiltAndPushed, true)
assert.equal(terminal.imageScanPassed, false)
assert.equal(terminal.a100RuntimeQualified, false)
assert.equal(terminal.l4RuntimeQualified, false)
assert.equal(terminal.runtimeReleaseGranted, false)
assert.equal(terminal.productionReady, false)
assert.equal(authRequests.length, 2)
assert.equal(authRequests[1].method, 'GET')
assert.equal(authRequests[1].retry, false)
assert.equal(authRequests[1].maxRedirects, 0)
const terminalRef =
  canonicalSam31CloudImageBuildTerminalObservationRef(terminal)
assert.equal(
  (await repository.rereadTerminalObservation({
    observationRef: terminalRef,
  }))?.observationHash,
  terminal.observationHash,
)

const callCountBeforeRefusals = authRequests.length
await assert.rejects(() => transport.request({
  method: 'POST',
  url: 'https://example.com/v1/builds',
  body: buildBody,
}))
await assert.rejects(() => transport.request({
  method: 'GET',
  url:
    `https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds/${buildId}`,
  body: buildBody,
}))
await assert.rejects(() => transport.request({
  method: 'POST',
  url:
    'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
}))
assert.equal(authRequests.length, callCountBeforeRefusals)

assert.equal(await repository.rereadBuildAuthority({
  authorityRef: {
    ...authorityRef,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
}), null)

const authorityObjectPath = [...objects.keys()].find((path) =>
  path.includes('/authorities/'))
assert(authorityObjectPath)
const originalAuthorityBody = objects.get(authorityObjectPath)
assert(originalAuthorityBody)
const tamperedAuthority = JSON.parse(originalAuthorityBody.toString('utf8'))
tamperedAuthority.authorityId = 'tampered-authority'
objects.set(authorityObjectPath, Buffer.from(JSON.stringify(tamperedAuthority)))
await assert.rejects(() => repository.rereadBuildAuthority({ authorityRef }))
objects.set(authorityObjectPath, originalAuthorityBody)

const selectedBuckets: string[] = []
const fixedBucketRuntime = createCanonicalSam31GcpCloudImageBuildRuntime({
  storage: {
    bucket(name: string) {
      selectedBuckets.push(name)
      return {} as never
    },
  } as unknown as Storage,
  authenticatedTransport: transport,
})
assert.deepEqual(selectedBuckets, [
  'reeditpro-production-reeditpro-control-plane-state',
])
assert.equal(fixedBucketRuntime.projectId, 'reeditpro')
assert.equal(
  fixedBucketRuntime.controlPlaneStateBucketName,
  'reeditpro-production-reeditpro-control-plane-state',
)
assert.equal(fixedBucketRuntime.callerSelectedBucketAllowed, false)
assert.equal(
  fixedBucketRuntime.persistenceMode,
  'private_gcs_create_only_exact_reread',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-cloud-image-build-runtime',
  checks: 44,
  googleAdcTransportPresent: true,
  exactCloudBuildOriginAllowlisted: true,
  automaticHttpRetryAllowed: false,
  redirectAllowed: false,
  durableSingleUseConsumption: true,
  fixedPrivateControlPlaneStateBucket: true,
  exactAuthoritySubmissionAndTerminalReread: true,
  checkpointIncludedInBuildRequest: false,
  developerMachineModelInstallAllowed: false,
  imageBuildExecutedAgainstProvider: false,
  productionReady: false,
}))

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
    authorityId: 'sam31-cloud-runtime-smoke-authority',
    authorityVersion: 1 as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    candidateRef: {
      schemaVersion: CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
      candidateHash: '2'.repeat(64),
    },
    ingestReceiptRef: {
      id: 'sam31-private-ingest-runtime-smoke',
      version: 1 as const,
      schemaVersion: CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
      contentHash: `sha256:${'3'.repeat(64)}` as const,
    },
    sourceCheckpointQualificationRef: {
      ...qualificationRelease.sourceCheckpointQualificationRef,
    },
    artifactBindingRef: ref('sam31-build-binding-runtime-smoke', '4'.repeat(64)),
    capsuleManifestRef: ref('sam31-capsule-manifest-runtime-smoke', '5'.repeat(64)),
    capsuleCoordinate: {
      projectId: 'reeditpro' as const,
      bucketName:
        'reeditpro-production-reeditpro-image-build-inputs' as const,
      objectName:
        `private/image-build-inputs/sam3_1/${capsuleSha256}.tar.gz`,
      generation: '3101',
      etag: 'sam31-runtime-smoke-etag',
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
      sourceCheckpointQualificationRecordHash:
        qualificationRelease.qualification.qualificationHash,
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
    preparedAt: '2026-08-03T17:59:00.000Z',
  }
  return assertCanonicalSam31CloudImageBuildAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
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
    warnings: [],
    source,
    sourceProvenance: {
      resolvedStorageSource: structuredClone(source.storageSource),
    },
    steps: structuredClone(body.steps),
    images: structuredClone(body.images),
    options: structuredClone(body.options),
    serviceAccount: body.serviceAccount,
    results: {
      images: [{
        name: taggedImageUri,
        digest: `sha256:${'b'.repeat(64)}`,
        artifactRegistryPackage:
          'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu',
      }],
    },
  }
}
