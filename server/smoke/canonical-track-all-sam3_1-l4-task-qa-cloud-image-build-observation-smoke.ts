import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import {
  canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef,
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository,
  createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildReadTransport,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const hash = (value: string): string => createHash('sha256')
  .update(value).digest('hex')
const ref = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${hash(id)}` as const,
})
const sourceSha = hash('observation-source')
const authorityPayload = {
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority-v1' as const,
  source:
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  status: 'authorized_for_private_cloud_build' as const,
  authorityId: 'track-all-l4-task-qa-observation-authority',
  authorityVersion: 1 as const,
  operationId: 'tool.kornia.refine_mask.v1' as const,
  capsuleRef: ref('track-all-l4-task-qa-observation-capsule'),
  buildSourceCoordinate: {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
    objectName:
      `private/image-build-inputs/track-all-l4-task-qa/${sourceSha}.tar.gz`,
    generation: '1785949915434978',
    etag: 'observation-source-etag',
    byteLength: 101_981_929,
    sha256: sourceSha,
  },
  sourceCommitSha: hash('observation-commit').slice(0, 40),
  sourceTreeSha: hash('observation-tree').slice(0, 40),
  imageDestination: {
    repository:
      'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
    imageName: 'reeditpro-track-all-l4-task-qa' as const,
    tag: `track-all-l4-qa-${sourceSha.slice(0, 16)}`,
    taggedUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa:track-all-l4-qa-${sourceSha.slice(0, 16)}`,
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
    cloudImageBuildAuthorized: true as const,
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
const request = compileCanonicalTrackAllSam31L4TaskQaCloudBuildRequest(
  authority,
)
const submissionPayload = {
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-submission-v1' as const,
  source:
    'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_owner' as const,
  disposition: 'outcome_unknown' as const,
  operationId: 'tool.kornia.refine_mask.v1' as const,
  authorityRef,
  buildRequestRef: {
    id: `track-all-l4-cloud-build-request-${request.requestHash.slice(0, 24)}`,
    version: 1 as const,
    contentHash: `sha256:${request.requestHash}` as const,
  },
  buildRequestHash: request.requestHash,
  providerHttpStatus: null,
  cloudBuildOperationName: null,
  cloudBuildId: null,
  cloudBuildResource: null,
  providerOutcome: 'unknown' as const,
  durableAuthorityConsumptionCreated: true,
  durableSubmissionObservationCreated: false,
  imageBuildKnownStarted: false,
  automaticRetryAllowed: false as const,
  developerMachineModelInstallAllowed: false as const,
  checkpointOrModelWeightsRead: false as const,
  imagePushKnownCompleted: false as const,
  runtimeReleaseGranted: false as const,
  gpuJobDispatched: false as const,
  customerCreditMutationCreated: false as const,
  qaApproved: false as const,
  productionReady: false as const,
  observedAt: '2026-08-05T13:21:00.000Z',
}
const submission: CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission = {
  ...submissionPayload,
  submissionHash: sha256AuthorityValue(submissionPayload),
}
const submissionRef =
  canonicalTrackAllSam31L4TaskQaCloudImageBuildSubmissionRef(submission)
const buildId = 'a684e235-df91-41a0-b144-732f062c2630'
const build = {
  ...request.body,
  id: buildId,
  name: `projects/reeditpro/locations/us-central1/builds/${buildId}`,
  projectId: 'reeditpro',
  createTime: '2026-08-05T13:22:00.000Z',
  startTime: '2026-08-05T13:22:10.000Z',
  finishTime: '2026-08-05T13:22:20.000Z',
  status: 'FAILURE',
  sourceProvenance: {
    resolvedStorageSource: (request.body.source as {
      storageSource: unknown
    }).storageSource,
  },
  artifacts: { images: request.body.images },
  steps: (request.body.steps as Record<string, unknown>[]).map((step) => ({
    ...step,
    status: 'QUEUED',
  })),
  results: { buildStepImages: [''], buildStepOutputs: [''] },
  warnings: [],
  failureInfo: {
    type: 'FETCH_SOURCE_FAILED',
    detail:
      'Error fetching source: failed to Fetch: open docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate: no such file or directory',
  },
}

let reconciliation: Awaited<ReturnType<ReturnType<
  typeof createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver
>['reconcileUnknownSubmission']>> | null = null
let response: unknown = { builds: [build] }
const observer = createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObserver({
  readPort: {
    async rereadBuildAuthority() { return structuredClone(authority) },
    async rereadSubmission() { return structuredClone(submission) },
    async rereadReconciliation() {
      return reconciliation ? structuredClone(reconciliation) : null
    },
  },
  transport: {
    async request() { return { status: 200, json: structuredClone(response) } },
  },
  now: () => '2026-08-05T13:23:00.000Z',
})

reconciliation = await observer.reconcileUnknownSubmission({
  reconciliationId: 'track-all-l4-observation-reconciliation',
  submissionRef,
})
assert.equal(reconciliation.disposition, 'matched_exact_build')
assert.equal(reconciliation.matchingBuildCount, 1)
assert.equal(reconciliation.cloudBuildId, buildId)
assert.equal(reconciliation.automaticRetryAllowed, false)

response = build
const terminal = await observer.observeTerminal({
  terminalId: 'track-all-l4-observation-terminal',
  reconciliationRef:
    canonicalTrackAllSam31L4TaskQaCloudImageBuildReconciliationRef(
      reconciliation,
    ),
})
assert.equal(terminal.disposition, 'terminal_failure')
assert.equal(terminal.cloudBuildStatus, 'FAILURE')
assert.equal(terminal.cloudBuildFailureType, 'FETCH_SOURCE_FAILED')
assert.equal(terminal.cloudBuildFailureReason,
  'source_fetch_missing_expected_dockerfile_path')
assert.equal(terminal.buildStepExecutionKnownStarted, false)
assert.equal(terminal.billableGpuExecutionKnownStarted, false)
assert.equal(terminal.imageBuiltAndPushed, false)
assert.equal(terminal.customerCreditsMutated, false)
assert.equal(terminal.runtimeReleaseGranted, false)

const bodies = new Map<string, Buffer>()
const repository =
  createCanonicalTrackAllSam31L4TaskQaCloudImageBuildObservationRepository({
    objectPort: {
      async createOnly({ objectPath, body }) {
        if (bodies.has(objectPath)) return 'already_exists' as const
        bodies.set(objectPath, Buffer.from(body))
        return 'created' as const
      },
      async readExact(objectPath) {
        const body = bodies.get(objectPath)
        return body ? Buffer.from(body) : null
      },
    },
  })
const reconciliationRef = await repository.persistReconciliationCreateOnly({
  reconciliation,
})
assert.deepEqual(await repository.rereadReconciliation({ reconciliationRef }),
  reconciliation)
const terminalRef = await repository.persistTerminalCreateOnly({ terminal })
assert.deepEqual(await repository.rereadTerminal({ terminalRef }), terminal)

let authRequests = 0
const transport = createCanonicalTrackAllSam31L4TaskQaGoogleCloudBuildReadTransport({
  auth: {
    async request() {
      authRequests += 1
      return { status: 200, data: { builds: [] } } as never
    },
  },
})
await transport.request({
  method: 'GET',
  url: 'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds?pageSize=100&filter=tags%3Dtrack-all-l4-task-qa%20AND%20tags%3Dprivate-image-build',
})
await assert.rejects(transport.request({
  method: 'GET',
  url: 'https://example.com/builds',
}))
assert.equal(authRequests, 1)

console.log(JSON.stringify({
  smoke:
    'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation',
  checks: 28,
  unknownSubmissionReconciledToOneExactBuild: true,
  providerAddedStepStatusIgnoredWithoutWeakeningFixedStepMatch: true,
  exactSourceGenerationProvenanceReread: true,
  sourceFetchFailureRecordedBeforeBuildStep: true,
  billableGpuExecutionKnownStarted: false,
  automaticRetryAllowed: false,
  immutableObservationPersistenceAndReread: true,
  readTransportAllowlisted: true,
  developerMachineModelInstallAllowed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
