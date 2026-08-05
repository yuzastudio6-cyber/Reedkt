import assert from 'node:assert/strict'

import {
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  compileCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildBody,
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
assert.equal(persistedSubmission?.submissionHash, submission.submissionHash)

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
assert.equal(persistedTerminal?.terminalHash, terminal.terminalHash)

const tampered = structuredClone(admission) as Record<string, unknown>
tampered.immutableImageDigest = `sha256:${'f'.repeat(64)}`
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission(tampered),
)

process.stdout.write(`${JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build',
  checks: 18,
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
