import assert from 'node:assert/strict'

import type { Storage } from '@google-cloud/storage'

import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
  assertCanonicalSam31ImageSupplyChainBuildAdmission,
  compileCanonicalSam31ImageSupplyChainCloudBuildBody,
  imageSupplyChainBuildAdmissionReference,
  imageSupplyChainBuildObservationReference,
  imageSupplyChainBuildSubmissionReference,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  createCanonicalSam31GcpImageSupplyChainBuildRuntime,
  createCanonicalSam31ImageSupplyChainBuildRepository,
  createCanonicalSam31ImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-build-runtime'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

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

const admission = createAdmission()
const buildBody = compileCanonicalSam31ImageSupplyChainCloudBuildBody(
  admission,
)
const buildId = '33333333-3333-4333-8333-333333333333'
const transportRequests: Array<{
  method: 'GET' | 'POST'
  url: string
  body?: Readonly<Record<string, unknown>>
}> = []
let submittedBody: Readonly<Record<string, unknown>> | undefined
const transport = {
  async request(request: {
    method: 'GET' | 'POST'
    url: string
    body?: Readonly<Record<string, unknown>>
  }) {
    transportRequests.push(structuredClone(request))
    if (request.method === 'POST') {
      submittedBody = request.body
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
    }
    const body = submittedBody ?? buildBody
    return {
      status: 200,
      json: {
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
            `gs://${admission.evidenceBucket}/${admission.evidencePrefix}/artifacts-${buildId}.json#5101`,
          numArtifacts: '3',
        },
      },
    }
  },
}

const repository = createCanonicalSam31ImageSupplyChainBuildRepository({
  objectPort,
})
const runtime = createCanonicalSam31ImageSupplyChainBuildRuntime({
  repository,
  authenticatedTransport: transport,
  now: () => '2026-08-03T21:00:00.000Z',
})
assert.equal(runtime.cloudSupplyChainBuildOnly, true)
assert.equal(
  runtime.developerMachineModelCheckpointCudaOrGpuRuntimeInstallAllowed,
  false,
)

const admissionRef = await runtime.persistAdmissionCreateOnly({ admission })
assert.deepEqual(admissionRef, imageSupplyChainBuildAdmissionReference(
  admission,
))
assert.equal(
  (await repository.rereadAdmission({ admissionRef }))?.admissionHash,
  admission.admissionHash,
)

const submission = await runtime.startOneSupplyChainBuild({ admissionRef })
assert.equal(submission.disposition, 'submitted')
assert.equal(transportRequests.length, 1)
assert.equal(transportRequests[0].method, 'POST')
assert.equal(
  transportRequests[0].url,
  'https://cloudbuild.googleapis.com/v1/projects/reeditpro/locations/us-central1/builds',
)
assert.equal(
  JSON.stringify(transportRequests[0]).includes('sam3.1_multiplex.pt'),
  false,
)
assert.equal(
  JSON.stringify(transportRequests[0]).includes('reeditpro-image-signer-sa'),
  true,
)

const duplicate = await runtime.startOneSupplyChainBuild({ admissionRef })
assert.equal(duplicate.disposition, 'rejected_before_creation')
assert.equal(transportRequests.length, 1)

const submissionRef = imageSupplyChainBuildSubmissionReference(submission)
assert.equal(
  (await repository.rereadSubmission({ submissionRef }))?.submissionHash,
  submission.submissionHash,
)
const observation = await runtime.observeOnePersistedSupplyChainBuild({
  admissionRef,
  submissionRef,
})
assert.equal(
  observation.disposition,
  'supply_chain_artifacts_ready_pending_exact_reread',
)
assert.equal(observation.durableTerminalObservationCreated, true)
assert.equal(observation.evidenceArtifactCount, 3)
assert.equal(observation.evidenceArtifactsExactReread, false)
assert.equal(observation.imageSupplyChainReleaseGranted, false)
assert.equal(observation.gpuRuntimeAuthorized, false)
assert.equal(observation.productionReady, false)
assert.equal(transportRequests.length, 2)
assert.equal(transportRequests[1].method, 'GET')

const observationRef = imageSupplyChainBuildObservationReference(observation)
const rereadObservation = await repository
  .rereadTerminalObservationForSubmission({ submissionRef })
assert.equal(rereadObservation?.observationHash, observation.observationHash)
assert.deepEqual(
  rereadObservation
    ? imageSupplyChainBuildObservationReference(rereadObservation)
    : null,
  observationRef,
)

const requestCountBeforeTerminalReplay = transportRequests.length
assert.equal(
  (await runtime.observeOnePersistedSupplyChainBuild({
    admissionRef,
    submissionRef,
  })).observationHash,
  observation.observationHash,
)
assert.equal(transportRequests.length, requestCountBeforeTerminalReplay)

assert.equal(await repository.rereadAdmission({
  admissionRef: {
    ...admissionRef,
    contentHash: `sha256:${'f'.repeat(64)}`,
  },
}), null)

const admissionPath = [...objects.keys()].find((path) =>
  path.includes('/admissions/'))
assert(admissionPath)
const originalAdmissionBody = objects.get(admissionPath)
assert(originalAdmissionBody)
const tamperedAdmission = JSON.parse(originalAdmissionBody.toString('utf8'))
tamperedAdmission.admissionId = 'tampered-supply-chain-admission'
objects.set(admissionPath, Buffer.from(JSON.stringify(tamperedAdmission)))
await assert.rejects(() => repository.rereadAdmission({ admissionRef }))
objects.set(admissionPath, originalAdmissionBody)

const selectedBuckets: string[] = []
const fixedRuntime = createCanonicalSam31GcpImageSupplyChainBuildRuntime({
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
assert.equal(fixedRuntime.projectId, 'reeditpro')
assert.equal(
  fixedRuntime.controlPlaneStateBucketName,
  'reeditpro-production-reeditpro-control-plane-state',
)
assert.equal(
  fixedRuntime.imageSupplyChainEvidenceBucketName,
  'reeditpro-production-reeditpro-image-supply-chain-evidence',
)
assert.equal(fixedRuntime.callerSelectedBucketAllowed, false)
assert.equal(
  fixedRuntime.persistenceMode,
  'private_gcs_create_only_exact_reread',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-cloud-image-supply-chain-build-runtime',
  checks: 37,
  fixedPrivateControlPlaneStateBucket: true,
  fixedPrivateSupplyChainEvidenceBucket: true,
  durableAdmissionSubmissionAndTerminalReread: true,
  durableSingleUseAdmissionConsumption: true,
  callerSelectedBucketAllowed: fixedRuntime.callerSelectedBucketAllowed,
  developerMachineModelInstallAllowed: false,
  cloudBuildExecuted: false,
  gpuRuntimeAuthorized: observation.gpuRuntimeAuthorized,
  productionReady: observation.productionReady,
}, null, 2))

function createAdmission() {
  const terminalHash = 'b'.repeat(64)
  const imageDigest = `sha256:${'c'.repeat(64)}` as const
  const ref = (id: string, hash: string) => ({
    id,
    version: 1 as const,
    contentHash: `sha256:${hash}` as const,
  })
  const payload = {
    schemaVersion:
      CANONICAL_SAM3_1_IMAGE_SUPPLY_CHAIN_BUILD_ADMISSION_VERSION,
    source: 'canonical_sam3_1_image_supply_chain_build_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    status: 'authorized_for_private_supply_chain_build' as const,
    admissionId: 'sam31-supply-chain-runtime-smoke-admission',
    admissionVersion: 1 as const,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
    buildAuthorityRef: ref('sam31-runtime-build-authority', '1'.repeat(64)),
    imageBuildSubmissionRef: ref(
      'sam31-runtime-image-build-submission',
      '2'.repeat(64),
    ),
    imageBuildTerminalObservationRef: ref(
      'sam31-runtime-image-build-terminal',
      terminalHash,
    ),
    cloudImageBuildId: '11111111-1111-4111-8111-111111111111',
    cloudImageBuildResource:
      'projects/reeditpro/locations/us-central1/builds/11111111-1111-4111-8111-111111111111',
    immutableImageUri:
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${imageDigest}`,
    immutableImageDigest: imageDigest,
    artifactRegistryPackage:
      'projects/reeditpro/locations/us-central1/repositories/reeditpro-workers/packages/reeditpro-sam31-gpu' as const,
    kmsKeyVersionResource:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/9',
    kmsKeyUri:
      'gcpkms://projects/reeditpro/locations/us-central1/keyRings/weeditpro-image-signing/cryptoKeys/sam31-image-signing/cryptoKeyVersions/9',
    evidenceBucket:
      'reeditpro-production-reeditpro-image-supply-chain-evidence' as const,
    evidencePrefix:
      `private/sam3_1/image-supply-chain/v1/${terminalHash}`,
    evidenceArtifactPaths: [
      'sam31.spdx.json',
      'cosign-signature.bundle.json',
      'cosign-verification.json',
    ] as const,
    toolchain: {
      dockerBuilderImage:
        'gcr.io/cloud-builders/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147' as const,
      dockerBuilderRelease: 'cloud-builders-docker-2026-08-03' as const,
      syftImage:
        'docker.io/anchore/syft@sha256:2baa4d24d90599840c0100a8d30deaa533821fcd99f405ce6f90e3d225bd836d' as const,
      syftRelease: 'v1.44.0' as const,
      syftLicense: 'Apache-2.0' as const,
      cosignImage:
        'gcr.io/projectsigstore/cosign@sha256:de9c65609e6bde17e6b48de485ee788407c9502fa08b8f4459f595b21f56cd00' as const,
      cosignRelease: 'v3.0.6' as const,
      cosignLicense: 'Apache-2.0' as const,
      mutableToolTagUsed: false as const,
    },
    buildPolicy: {
      serviceAccount:
        'projects/reeditpro/serviceAccounts/reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com' as const,
      timeout: '3600s' as const,
      queueTtl: '600s' as const,
      machineType: 'E2_HIGHCPU_8' as const,
      diskSizeGb: 200 as const,
      requestedVerifyOption: 'VERIFIED' as const,
      logging: 'CLOUD_LOGGING_ONLY' as const,
      sbomFormat: 'spdx_2_3_json' as const,
      transparencyLogUploadAllowed: false as const,
      publicSigstoreServiceRequired: false as const,
      automaticRetryAllowed: false as const,
    },
    admittedAt: '2026-08-03T20:59:00.000Z',
    authority: {
      exactCanonicalImageBuildReread: true as const,
      exactImmutableImageDigestBound: true as const,
      exactNumericKmsKeyVersionBound: true as const,
      supplyChainBuildAuthorized: true as const,
      callerSelectedImageAllowed: false as const,
      callerSelectedBuildStepsAllowed: false as const,
      callerSelectedArtifactLocationAllowed: false as const,
      callerPromptCommandOrSecretAllowed: false as const,
      modelCheckpointIncluded: false as const,
      customerMediaIncluded: false as const,
      gpuRuntimeAuthorized: false as const,
      customerCreditMutationAllowed: false as const,
      publicDeliveryAuthorized: false as const,
      productionReady: false as const,
    },
  }
  return assertCanonicalSam31ImageSupplyChainBuildAdmission({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}
