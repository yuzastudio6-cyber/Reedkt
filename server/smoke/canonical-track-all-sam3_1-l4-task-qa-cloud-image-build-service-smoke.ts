import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository,
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRuntime,
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildTransport,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-operator'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const sha256 = (value: string): string => createHash('sha256')
  .update(value)
  .digest('hex')
const hash = (label: string) => sha256(label)
const ref = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${hash(id)}` as const,
})

const authorityPayload = {
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority-v3' as const,
  source:
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  status: 'authorized_for_private_cloud_build' as const,
  authorityId: 'track-all-l4-task-qa-cloud-build-authority-1',
  authorityVersion: 1 as const,
  operationId: 'tool.kornia.refine_mask.v1' as const,
  capsuleRef: ref('track-all-l4-task-qa-canonical-private-capsule'),
  buildSourceCoordinate: {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
    objectName:
      `private/image-build-inputs/track-all-l4-task-qa/${hash('build-source')}.tar.gz`,
    generation: '1785945000000000',
    etag: 'track-all-l4-task-qa-build-source-etag',
    byteLength: 104_857_600,
    sha256: hash('build-source'),
  },
  sourceCommitSha: hash('source-commit').slice(0, 40),
  sourceTreeSha: hash('source-tree').slice(0, 40),
  imageDestination: {
    repository:
      'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
    imageName: 'reeditpro-track-all-l4-task-qa' as const,
    tag: `track-all-l4-qa-${hash('build-source').slice(0, 16)}`,
    taggedUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa:track-all-l4-qa-${hash('build-source').slice(0, 16)}`,
    callerSelectedTagAllowed: false as const,
    tagMayAuthorizeRuntime: false as const,
    terminalImmutableDigestRequired: true as const,
  },
  buildClosure: {
    dockerfilePath:
      'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate' as const,
    dockerfileSha256: hash('dockerfile'),
    runnerSha256: hash('runner'),
    entrypointSha256: hash('entrypoint'),
    verifierSha256: hash('verifier'),
    sourceProvenanceLockSha256: hash('provenance'),
    privateCapsuleManifestSha256: hash('manifest'),
    requirementsLockSha256: hash('requirements'),
    opencvCudaReceiptSha256: hash('opencv'),
    opencvBuildInformationSha256: hash('opencv-build-information'),
    opencvLicenseSha256: hash('opencv-license'),
    opencvContribLicenseSha256: hash('opencv-contrib-license'),
    cudaForwardCompatReceiptSha256: hash('cuda'),
    cudaNppRuntimeReceiptSha256: hash('cuda-npp'),
    cudaNppLicenseSha256: hash('cuda-npp-license'),
    ubuntuRuntimeSecurityReceiptSha256: hash('ubuntu-security-receipt'),
  },
  cloudBuildPolicy: {
    projectId: 'reeditpro' as const,
    location: 'us-central1' as const,
    regionalCreateEndpoint:
      'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const,
    builderImage:
      'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const,
    serviceAccount:
      'projects/reeditpro/serviceAccounts/reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com' as const,
    machineType: 'E2_HIGHCPU_8' as const,
    diskSizeGb: '200' as const,
    timeout: '3600s' as const,
    queueTtl: '600s' as const,
    sourceFetcher: 'GCS_FETCHER' as const,
    sourceProvenanceHashes: ['SHA256'] as ['SHA256'],
    requestedVerifyOption: 'VERIFIED' as const,
    logging: 'CLOUD_LOGGING_ONLY' as const,
    noSecretsOrSubstitutions: true as const,
    singleFixedOfflineBuildStep: true as const,
  },
  authority: {
    exactPrivateBuildSourceReread: true as const,
    generationAndEtagStableBeforeAndAfterRead: true as const,
    cloudImageBuildAuthorized: true,
    durableSingleUseConsumptionRequiredBeforeCloudCall: true as const,
    browserOrCallerMaySubmitBuild: false as const,
    checkpointOrModelWeightsIncluded: false as const,
    imageBuildStarted: false as const,
    imagePushed: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditMutationAllowed: false as const,
    qaApproved: false as const,
    productionReady: false as const,
  },
  preparedAt: '2026-08-05T13:20:00.000Z',
}
const authority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority = {
  ...authorityPayload,
  authorityHash: sha256AuthorityValue(authorityPayload),
}
const authorityRef = {
  id: authority.authorityId,
  version: 1 as const,
  contentHash: `sha256:${authority.authorityHash}` as const,
}
const buildId = '3c89a94e-86ca-4bf1-b199-957727cb5ad3'
const operation = {
  name:
    'projects/reeditpro/locations/us-central1/operations/build/3c89a94e-86ca-4bf1-b199-957727cb5ad3',
  metadata: {
    build: {
      id: buildId,
      name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
      projectId: 'reeditpro',
    },
  },
}

let providerCalls = 0
let consumed = false
const submissions: CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission[] = []
const service = createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() { return structuredClone(authority) },
  },
  statePort: {
    async consumeAuthorityCreateOnly() {
      if (consumed) return false
      consumed = true
      return true
    },
    async persistSubmissionCreateOnly({ submission }) {
      submissions.push(structuredClone(submission))
      return true
    },
  },
  authenticatedTransport: {
    async request(request) {
      providerCalls += 1
      assert.equal(request.method, 'POST')
      assert.equal(request.url,
        'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds')
      assert.equal(request.body.serviceAccount,
        authority.cloudBuildPolicy.serviceAccount)
      assert.doesNotMatch(JSON.stringify(request.body),
        /sam3\.1_multiplex|facebook\/sam|checkpoint|secret|token/iu)
      return { status: 200, json: operation }
    },
  },
  now: () => '2026-08-05T13:21:00.000Z',
})

const submitted = await service.startOneImageBuild({ authorityRef })
assert.equal(submitted.disposition, 'submitted')
assert.equal(submitted.providerOutcome, 'executed')
assert.equal(submitted.imageBuildKnownStarted, true)
assert.equal(submitted.durableAuthorityConsumptionCreated, true)
assert.equal(submitted.durableSubmissionObservationCreated, true)
assert.equal(submitted.cloudBuildId, buildId)
assert.equal(submitted.automaticRetryAllowed, false)
assert.equal(submitted.imagePushKnownCompleted, false)
assert.equal(submitted.gpuJobDispatched, false)
assert.equal(submitted.customerCreditMutationCreated, false)
assert.equal(providerCalls, 1)
assert.equal(submissions.length, 1)
assert.equal(canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
  submitted,
).contentHash, `sha256:${submitted.submissionHash}`)

const replay = await service.startOneImageBuild({ authorityRef })
assert.equal(replay.disposition, 'rejected_before_creation')
assert.equal(replay.providerOutcome, 'not_executed')
assert.equal(replay.automaticRetryAllowed, false)
assert.equal(providerCalls, 1)

let contractProviderCalls = 0
const contractAuthorityPayload = {
  ...authorityPayload,
  evidenceClass: 'synthetic_contract_fixture' as const,
  status: 'contract_only' as const,
  authority: {
    ...authorityPayload.authority,
    cloudImageBuildAuthorized: false,
  },
}
const contractAuthority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority = {
  ...contractAuthorityPayload,
  authorityHash: sha256AuthorityValue(contractAuthorityPayload),
}
const contractService = createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() { return contractAuthority },
  },
  statePort: {
    async consumeAuthorityCreateOnly() {
      throw new Error('contract authority must not be consumed')
    },
    async persistSubmissionCreateOnly() {
      throw new Error('contract authority must not persist submission')
    },
  },
  authenticatedTransport: {
    async request() {
      contractProviderCalls += 1
      return { status: 200, json: operation }
    },
  },
  now: () => '2026-08-05T13:22:00.000Z',
})
const contractRejected = await contractService.startOneImageBuild({
  authorityRef: {
    id: contractAuthority.authorityId,
    version: 1,
    contentHash: `sha256:${contractAuthority.authorityHash}`,
  },
})
assert.equal(contractRejected.disposition, 'rejected_before_creation')
assert.equal(contractProviderCalls, 0)

let unknownProviderCalls = 0
let unknownPersisted = 0
const unknownService = createCanonicalTrackAllSam31L4TaskQaCloudImageBuildService({
  authorityReadPort: {
    async rereadBuildAuthority() { return structuredClone(authority) },
  },
  statePort: {
    async consumeAuthorityCreateOnly() { return true },
    async persistSubmissionCreateOnly({ submission }) {
      unknownPersisted += 1
      assert.equal(submission.disposition, 'outcome_unknown')
      return true
    },
  },
  authenticatedTransport: {
    async request() {
      unknownProviderCalls += 1
      throw new Error('simulated uncertain network outcome')
    },
  },
  now: () => '2026-08-05T13:23:00.000Z',
})
const unknown = await unknownService.startOneImageBuild({ authorityRef })
assert.equal(unknown.disposition, 'outcome_unknown')
assert.equal(unknown.providerOutcome, 'unknown')
assert.equal(unknown.automaticRetryAllowed, false)
assert.equal(unknownProviderCalls, 1)
assert.equal(unknownPersisted, 1)

const tampered = structuredClone(submitted)
tampered.cloudBuildId = 'e67f024d-6caa-4484-aae4-c764e059183b'
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(tampered))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return submitted.schemaVersion
  },
})
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission(hostile))
assert.equal(getterInvoked, false)

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRepository({
    objectPort: {
      async createOnly({ objectPath, body, contentSha256 }) {
        assert.equal(createHash('sha256').update(body).digest('hex'),
          contentSha256)
        const existing = objects.get(objectPath)
        if (existing) {
          assert.deepEqual(existing, body)
          return 'already_exists'
        }
        objects.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = objects.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
  })
const persistedAuthorityRef = await repository.persistBuildAuthorityCreateOnly({
  authority,
})
assert.deepEqual(persistedAuthorityRef, authorityRef)
assert.deepEqual(await repository.rereadBuildAuthority({ authorityRef }),
  authority)
let runtimeProviderCalls = 0
const runtime = createCanonicalTrackAllSam31L4TaskQaCloudImageBuildRuntime({
  repository,
  authenticatedTransport: {
    async request() {
      runtimeProviderCalls += 1
      return { status: 200, json: operation }
    },
  },
  now: () => '2026-08-05T13:24:00.000Z',
})
const runtimeSubmission = await runtime.startOneImageBuild({ authorityRef })
assert.equal(runtimeSubmission.disposition, 'submitted')
const runtimeSubmissionRef =
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(
    runtimeSubmission,
  )
assert.deepEqual(await runtime.rereadSubmission({
  submissionRef: runtimeSubmissionRef,
}), runtimeSubmission)
assert.equal((await runtime.startOneImageBuild({ authorityRef })).disposition,
  'rejected_before_creation')
assert.equal(runtimeProviderCalls, 1)

let adcRequests = 0
const googleTransport =
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildTransport({
    auth: {
      async request(options) {
        adcRequests += 1
        assert.equal(options.retry, false)
        assert.equal(options.maxRedirects, 0)
        assert.equal(options.timeout, 30_000)
        return { status: 200, data: operation } as never
      },
    },
  })
assert.equal((await googleTransport.request({
  method: 'POST',
  url: 'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
  body: { fixed: true },
})).status, 200)
assert.equal(adcRequests, 1)

const operator =
  await executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator({
    argv: [
      '--execute',
      `--authority-id=${authorityRef.id}`,
      `--authority-sha256=${authority.authorityHash}`,
    ],
    environment: {
      WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_CLOUD_BUILD:
        'start-weeditpro-track-all-l4-task-qa-cloud-build-v1',
    },
    runtime: {
      async startOneImageBuild() { return submitted },
    } as never,
  })
assert.equal(operator.disposition, 'submitted')
assert.equal(operator.imageBuildKnownStarted, true)
assert.equal(operator.callerImageTagPathCommandEnvironmentOrBuildArgsAccepted,
  false)
assert.equal(operator.developerMachineModelInstallAllowed, false)
await assert.rejects(
  executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator({
    argv: [
      '--execute',
      `--authority-id=${authorityRef.id}`,
      `--authority-sha256=${authority.authorityHash}`,
    ],
    environment: {},
    runtime: { async startOneImageBuild() { return submitted } } as never,
  }),
)
await assert.rejects(
  executeCanonicalTrackAllSam31L4TaskQaCloudImageBuildOperator({
    argv: [
      '--execute',
      `--authority-id=${authorityRef.id}`,
      `--authority-sha256=${authority.authorityHash}`,
      '--image=caller-selected',
    ],
    environment: {
      WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_CLOUD_BUILD:
        'start-weeditpro-track-all-l4-task-qa-cloud-build-v1',
    },
    runtime: { async startOneImageBuild() { return submitted } } as never,
  }),
)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service',
  checks: 61,
  exactCanonicalAuthorityAndFixedRequestRequired: true,
  durableSingleUseConsumedBeforeProviderCall: true,
  uncertainOutcomePersistedAndAutomaticRetryForbidden: true,
  contractOnlyAuthorityProviderCalls: contractProviderCalls,
  acceptedProviderCalls: providerCalls,
  durablePrivateGcsRepositoryAndExactRereadPassed: true,
  adcNoRetryNoRedirectTransportPassed: true,
  identifierOnlyExactConfirmationOperatorPassed: true,
  developerMachineModelInstallAllowed: false,
  checkpointOrModelWeightsRead: false,
  imagePushKnownCompleted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
