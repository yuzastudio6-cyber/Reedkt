import assert from 'node:assert/strict'

import {
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody,
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService,
  imageSupplyChainAdmissionRef,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  type CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const digest = `sha256:${'a'.repeat(64)}` as const
const originalTerminalHash = 'b'.repeat(64)
const admissionPayload = {
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build-admission-v1' as const,
  source:
    'canonical_track_all_sam3_1_l4_task_qa_image_supply_chain_build_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  status: 'authorized_for_private_supply_chain_build' as const,
  admissionId: 'track-all-l4-supply-chain-smoke',
  admissionVersion: 1 as const,
  operationId: 'tool.kornia.refine_mask.v1' as const,
  accelerator: 'nvidia_l4' as const,
  routeId: 'l4_standard_primary' as const,
  imageBuildAuthorityRef: ref('track-all-l4-image-authority', 'c'),
  imageBuildSubmissionRef: ref('track-all-l4-image-submission', 'd'),
  imageBuildTerminalRef: ref('track-all-l4-image-terminal', 'b'),
  imageBuildId: '11111111-1111-4111-8111-111111111111',
  imageBuildResource:
    'projects/reeditpro/locations/us-central1/builds/11111111-1111-4111-8111-111111111111',
  buildSourceCoordinate: {
    projectId: 'reeditpro' as const,
    bucketName: 'reeditpro-production-reeditpro-image-build-inputs' as const,
    objectName:
      'private/image-build-inputs/track-all-l4-task-qa/reproducibility/smoke/source.tar.gz',
    generation: '123',
    etag: 'smoke-etag',
    byteLength: 123,
    sha256: 'e'.repeat(64),
  },
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${digest}` as const,
  immutableImageDigest: digest,
  artifactRegistryPackage:
    'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-track-all-l4-task-qa' as const,
  kmsKeyVersionResource:
    'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/1' as const,
  evidenceBucket:
    'reeditpro-production-reeditpro-image-supply-chain-evidence' as const,
  evidencePrefix:
    `private/track-all/sam3_1/l4-task-qa/image-supply-chain/v1/${originalTerminalHash}` as const,
  evidenceArtifactPaths: [
    'track-all-l4-task-qa.spdx.json',
    'cosign-signature.bundle.json',
    'cosign-verification.json',
  ] as const,
  buildPolicy: {
    endpoint:
      'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds' as const,
    serviceAccount:
      'projects/reeditpro/serviceAccounts/reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const,
    dockerBuilderImage:
      'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const,
    syftImage:
      'docker.io/anchore/syft@sha256:2baa4d24d90599840c0100a8d30deaa533821fcd99f405ce6f90e3d225bd836d' as const,
    syftRelease: 'v1.44.0' as const,
    cosignImage:
      'gcr.io/projectsigstore/cosign@sha256:de9c65609e6bde17e6b48de485ee788407c9502fa08b8f4459f595b21f56cd00' as const,
    cosignRelease: 'v3.0.6' as const,
    timeout: '3600s' as const,
    queueTtl: '600s' as const,
    machineType: 'E2_HIGHCPU_8' as const,
    diskSizeGb: 200 as const,
    requestedVerifyOption: 'VERIFIED' as const,
    logging: 'CLOUD_LOGGING_ONLY' as const,
    transparencyLogUploadAllowed: false as const,
    automaticRetryAllowed: false as const,
  },
  authority: {
    exactImageBuildLineageReread: true as const,
    exactImmutableDigestBound: true as const,
    exactNumericKmsVersionBound: true as const,
    callerImageCommandArtifactPathOrBuildStepAccepted: false as const,
    checkpointOrModelWeightsIncluded: false as const,
    customerMediaIncluded: false as const,
    gpuRuntimeAuthorized: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    productionReady: false as const,
  },
  admittedAt: '2026-08-05T22:40:00.000Z',
}
const admission = assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission({
  ...admissionPayload,
  admissionHash: sha256AuthorityValue(admissionPayload),
})

const body = compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody(
  admission,
)
const steps = body.steps as ReadonlyArray<Record<string, unknown>>
assert.equal(steps.length, 5)
assert.deepEqual(steps.map((step) => step.id), [
  'pull-immutable-track-all-l4-task-qa-image',
  'archive-immutable-track-all-l4-task-qa-image',
  'generate-spdx-2-3-sbom',
  'sign-immutable-track-all-l4-task-qa-image',
  'verify-immutable-track-all-l4-task-qa-image-signature',
])
assert.equal(JSON.stringify(body).includes('customer'), false)
assert.equal(JSON.stringify(body).includes('checkpoint'), false)
assert.equal(JSON.stringify(body).includes('gpu'), false)

const reconciledAdmission =
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission({
    admissionId: 'track-all-l4-reconciled-admission-smoke',
    authority: imageBuildAuthorityFixture(),
    imageBuildSubmission: imageBuildSubmissionFixture(),
    imageBuildTerminal: imageBuildTerminalFixture(),
    admittedAt: '2026-08-05T22:40:30.000Z',
  })
assert.equal(
  reconciledAdmission.immutableImageDigest,
  `sha256:${'9'.repeat(64)}`,
)

let consumed = false
let persistedSubmission: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission | null = null
let persistedTerminal: CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal | null = null
const cloudBuildId = '22222222-2222-4222-8222-222222222222'
const service = createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService({
  readPort: {
    async rereadAdmission() { return admission },
  },
  statePort: {
    async consumeAdmissionCreateOnly() {
      if (consumed) return false
      consumed = true
      return true
    },
    async persistSubmissionCreateOnly({ submission }) {
      persistedSubmission = submission
      return true
    },
    async persistTerminalCreateOnly({ terminal }) {
      persistedTerminal = terminal
      return true
    },
  },
  transport: {
    async request(request) {
      if (request.method === 'POST') return {
        status: 200,
        json: {
          name:
            `operations/build/reeditpro/us-central1/${cloudBuildId}`,
          metadata: { build: { id: cloudBuildId } },
        },
      }
      return {
        status: 200,
        json: {
          id: cloudBuildId,
          name:
            `projects/reeditpro/locations/us-central1/builds/${cloudBuildId}`,
          status: 'SUCCESS',
          warnings: [],
          steps: steps.map((step) => ({
            id: step.id,
            name: step.name,
            status: 'SUCCESS',
          })),
          serviceAccount: admission.buildPolicy.serviceAccount,
          timeout: admission.buildPolicy.timeout,
          queueTtl: admission.buildPolicy.queueTtl,
          options: {
            machineType: admission.buildPolicy.machineType,
            diskSizeGb: String(admission.buildPolicy.diskSizeGb),
            requestedVerifyOption:
              admission.buildPolicy.requestedVerifyOption,
            logging: admission.buildPolicy.logging,
          },
          artifacts: body.artifacts,
          results: {
            artifactManifest: 'gs://private/manifest.json',
            numArtifacts: '3',
          },
        },
      }
    },
  },
  now: () => '2026-08-05T22:41:00.000Z',
})

const submission = await service.start({
  admissionRef: imageSupplyChainAdmissionRef(admission),
})
assert.equal(submission.disposition, 'submitted')
assert.equal(submission.automaticRetryAllowed, false)
assert.equal(
  (persistedSubmission as
    CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission | null)
    ?.submissionHash,
  submission.submissionHash,
)

const duplicate = await service.start({
  admissionRef: imageSupplyChainAdmissionRef(admission),
})
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(duplicate.providerOutcome, 'not_executed')

const terminal = await service.observe({ admission, submission })
assert.equal(
  terminal.disposition,
  'supply_chain_artifacts_ready_pending_exact_reread',
)
assert.equal(terminal.evidenceArtifactCount, 3)
assert.equal(terminal.runtimeReleaseGranted, false)
assert.equal(
  (persistedTerminal as
    CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal | null)
    ?.terminalHash,
  terminal.terminalHash,
)

let persistedFailure = false
const failureService =
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildService({
    readPort: { async rereadAdmission() { return admission } },
    statePort: {
      async consumeAdmissionCreateOnly() { return false },
      async persistSubmissionCreateOnly() { return false },
      async persistTerminalCreateOnly({ terminal: failed }) {
        persistedFailure = failed.disposition === 'terminal_failure'
        return true
      },
    },
    transport: {
      async request() {
        return {
          status: 200,
          json: {
            id: cloudBuildId,
            name:
              `projects/390722338345/locations/us-central1/builds/${cloudBuildId}`,
            status: 'FAILURE',
            warnings: [],
            // A failed provider step may omit fields needed by the success
            // echo. The terminal outcome must still be recorded exactly.
            steps: [{ id: 'sign', name: 'cosign' }],
          },
        }
      },
    },
    now: () => '2026-08-05T22:42:00.000Z',
  })
const failedTerminal = await failureService.observe({ admission, submission })
assert.equal(failedTerminal.disposition, 'terminal_failure')
assert.equal(failedTerminal.cloudBuildStatus, 'FAILURE')
assert.equal(persistedFailure, true)

const tampered = structuredClone(admission) as Record<string, unknown>
tampered.immutableImageDigest = `sha256:${'f'.repeat(64)}`
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(tampered),
)

process.stdout.write(`${JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build',
  checks: 21,
  immutableDigestBound: true,
  pinnedSbomAndKmsToolchain: true,
  exactCloudBuildEchoRequired: true,
  automaticRetryAllowed: false,
  runtimeReleaseGranted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
})}\n`)

function ref(id: string, character: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${character.repeat(64)}` as const,
  }
}

function imageBuildAuthorityFixture() {
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority-v3' as const,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_authority_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'authorized_for_private_cloud_build' as const,
    authorityId: 'track-all-l4-image-authority-fixture',
    authorityVersion: 1 as const,
    operationId: 'tool.kornia.refine_mask.v1' as const,
    capsuleRef: ref('capsule', '1'),
    buildSourceCoordinate: admission.buildSourceCoordinate,
    sourceCommitSha: '1'.repeat(40),
    sourceTreeSha: '2'.repeat(40),
    imageDestination: {
      repository:
        'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers' as const,
      imageName: 'reeditpro-track-all-l4-task-qa' as const,
      tag: `track-all-l4-qa-${admission.buildSourceCoordinate.sha256.slice(0, 16)}` as const,
      taggedUri:
        `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa:track-all-l4-qa-${admission.buildSourceCoordinate.sha256.slice(0, 16)}` as const,
      callerSelectedTagAllowed: false as const,
      tagMayAuthorizeRuntime: false as const,
      terminalImmutableDigestRequired: true as const,
    },
    buildClosure: {
      dockerfilePath:
        'docker/prod/gpu-worker/track-all-task-qa/Dockerfile.candidate' as const,
      dockerfileSha256: '3'.repeat(64),
      runnerSha256: '4'.repeat(64),
      entrypointSha256: '5'.repeat(64),
      verifierSha256: '6'.repeat(64),
      sourceProvenanceLockSha256: '7'.repeat(64),
      privateCapsuleManifestSha256: '8'.repeat(64),
      requirementsLockSha256: '9'.repeat(64),
      opencvCudaReceiptSha256: 'a'.repeat(64),
      opencvBuildInformationSha256: 'b'.repeat(64),
      opencvLicenseSha256: 'c'.repeat(64),
      opencvContribLicenseSha256: 'd'.repeat(64),
      cudaForwardCompatReceiptSha256: 'e'.repeat(64),
      cudaNppRuntimeReceiptSha256: 'f'.repeat(64),
      cudaNppLicenseSha256:
        'e4196076c5496c4bb5509be61e3d1cddf36b92a449a10ece1779afce3c65e684',
      ubuntuRuntimeSecurityReceiptSha256: '1'.repeat(64),
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
    preparedAt: '2026-08-05T22:00:00.000Z',
  }
  return { ...payload, authorityHash: sha256AuthorityValue(payload) }
}

function imageBuildSubmissionFixture() {
  const authority = imageBuildAuthorityFixture()
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-submission-v1' as const,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_owner' as const,
    disposition: 'outcome_unknown' as const,
    operationId: 'tool.kornia.refine_mask.v1' as const,
    authorityRef: {
      id: authority.authorityId,
      version: 1 as const,
      contentHash: `sha256:${authority.authorityHash}` as const,
    },
    buildRequestRef: ref('image-build-request', '2'),
    buildRequestHash: '2'.repeat(64),
    providerHttpStatus: 200,
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
    observedAt: '2026-08-05T22:01:00.000Z',
  }
  return { ...payload, submissionHash: sha256AuthorityValue(payload) }
}

function imageBuildTerminalFixture() {
  const authority = imageBuildAuthorityFixture()
  const submission = imageBuildSubmissionFixture()
  const payload = {
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-terminal-v1' as const,
    source:
      'canonical_track_all_sam3_1_l4_task_qa_cloud_image_build_terminal_owner' as const,
    disposition: 'image_built_pending_supply_chain_release' as const,
    terminalId: 'track-all-l4-image-terminal-fixture',
    terminalVersion: 1 as const,
    operationId: 'tool.kornia.refine_mask.v1' as const,
    authorityRef: {
      id: authority.authorityId,
      version: 1 as const,
      contentHash: `sha256:${authority.authorityHash}` as const,
    },
    submissionRef: {
      id: `track-all-l4-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
      version: 1 as const,
      contentHash: `sha256:${submission.submissionHash}` as const,
    },
    reconciliationRef: ref('image-build-reconciliation', '3'),
    cloudBuildId: '33333333-3333-4333-8333-333333333333',
    cloudBuildResource:
      'projects/reeditpro/locations/us-central1/builds/33333333-3333-4333-8333-333333333333',
    cloudBuildStatus: 'SUCCESS' as const,
    cloudBuildCreateTime: '2026-08-05T22:02:00.000Z',
    cloudBuildStartTime: '2026-08-05T22:02:01.000Z',
    cloudBuildFinishTime: '2026-08-05T22:03:00.000Z',
    exactFixedRequestEchoVerified: true as const,
    exactStorageGenerationProvenanceVerified: true as const,
    verifiedBuildRequested: true as const,
    warningsAbsent: true,
    taggedImageUri: authority.imageDestination.taggedUri,
    immutableImageDigest: `sha256:${'9'.repeat(64)}` as const,
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@sha256:${'9'.repeat(64)}`,
    imageBuiltAndPushed: true,
    cloudBuildFailureType: null,
    cloudBuildFailureReason: null,
    buildStepExecutionKnownStarted: true,
    billableGpuExecutionKnownStarted: false as const,
    spdxSbomReread: false as const,
    artifactAnalysisScanPassed: false as const,
    kmsSignatureVerified: false as const,
    slsaProvenanceVerified: false as const,
    runtimeReleaseGranted: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    productionReady: false as const,
    observedAt: '2026-08-05T22:04:00.000Z',
  }
  return { ...payload, terminalHash: sha256AuthorityValue(payload) }
}
