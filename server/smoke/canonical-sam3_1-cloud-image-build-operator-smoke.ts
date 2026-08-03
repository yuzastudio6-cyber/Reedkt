import assert from 'node:assert/strict'

import {
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
  CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
} from '../services/canonical-sam3_1-cloud-image-build-service'
import { executeCanonicalSam31CloudImageBuildOperator } from
  '../services/canonical-sam3_1-cloud-image-build-operator'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const authorityHash = 'a'.repeat(64)
const authorityRef = {
  id: 'sam31-cloud-build-authority-production-1',
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const buildId = '11111111-1111-4111-8111-111111111111'
const submissionPayload = {
  schemaVersion: CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_SUBMISSION_VERSION,
  source: 'canonical_sam3_1_cloud_image_build_submission_owner' as const,
  disposition: 'submitted' as const,
  authorityRef,
  operationId: 'tool.sam3_1.segment_and_track_subject.v1' as const,
  buildRequestHash: 'b'.repeat(64),
  buildRequestBodyRef: {
    id: 'sam31-build-request-body-1',
    version: 1 as const,
    contentHash: `sha256:${'b'.repeat(64)}` as const,
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
  observedAt: '2026-08-03T20:00:00.000Z',
}
const submission = {
  ...submissionPayload,
  submissionHash: sha256AuthorityValue(submissionPayload),
}
const submissionRef = {
  id: `sam31-cloud-build-submission-${submission.submissionHash.slice(0, 24)}`,
  version: 1 as const,
  contentHash: `sha256:${submission.submissionHash}` as const,
}
const observationPayload = {
  schemaVersion:
    CANONICAL_SAM3_1_CLOUD_IMAGE_BUILD_TERMINAL_OBSERVATION_VERSION,
  source: 'canonical_sam3_1_cloud_image_build_terminal_owner' as const,
  disposition: 'pending' as const,
  authorityRef,
  submissionRef,
  cloudBuildId: buildId,
  cloudBuildResource:
    `projects/reeditpro/locations/us-central1/builds/${buildId}`,
  providerHttpStatus: 200,
  cloudBuildStatus: 'WORKING' as const,
  exactBuildConfigurationEchoVerified: false,
  exactStorageGenerationProvenanceVerified: false,
  verifiedProvenanceAndAttestationRequested: true as const,
  warningsAbsent: true,
  taggedImageUri:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu:sam31-96914d2-aaaaaaaaaaaaaaaa',
  immutableImageDigest: null,
  immutableImageUri: null,
  artifactRegistryPackage: null,
  durableTerminalObservationCreated: false,
  imageBuiltAndPushed: false,
  imageScanPassed: false as const,
  imageSignatureVerified: false as const,
  sbomReread: false as const,
  a100RuntimeQualified: false as const,
  l4RuntimeQualified: false as const,
  runtimeReleaseGranted: false as const,
  gpuJobDispatched: false as const,
  customerCreditMutationCreated: false as const,
  productionReady: false as const,
  observedAt: '2026-08-03T20:01:00.000Z',
}
const observation = {
  ...observationPayload,
  observationHash: sha256AuthorityValue(observationPayload),
}

let startCalls = 0
let observeCalls = 0
const runtime = {
  async startOneImageBuild(input: { authorityRef: typeof authorityRef }) {
    startCalls += 1
    assert.deepEqual(input.authorityRef, authorityRef)
    return submission
  },
  async observeOnePersistedImageBuild(input: {
    authorityRef: typeof authorityRef
    submissionRef: typeof submissionRef
  }) {
    observeCalls += 1
    assert.deepEqual(input, { authorityRef, submissionRef })
    return observation
  },
} as never

const confirmedEnvironment = {
  WEEDITPRO_CONFIRM_SAM31_CLOUD_BUILD: 'true',
}
const start = await executeCanonicalSam31CloudImageBuildOperator({
  argv: [
    '--execute',
    '--action=start',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
  environment: confirmedEnvironment,
  runtime,
})
assert.equal(start.action, 'start')
assert.equal(start.disposition, 'submitted')
assert.equal(start.providerOutcome, 'executed')
assert.equal(start.imageBuildKnownStarted, true)
assert.equal(start.imageBuiltAndPushed, false)
assert.equal(start.developerMachineModelInstallAllowed, false)
assert.equal(start.modelOrCheckpointBytesReadLocally, false)
assert.equal(startCalls, 1)

const observe = await executeCanonicalSam31CloudImageBuildOperator({
  argv: [
    '--execute',
    '--action=observe',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
    `--submission-id=${submissionRef.id}`,
    `--submission-sha256=${submission.submissionHash}`,
  ],
  environment: confirmedEnvironment,
  runtime,
})
assert.equal(observe.action, 'observe')
assert.equal(observe.disposition, 'pending')
assert.equal(observe.providerOutcome, null)
assert.equal(observe.imageBuiltAndPushed, false)
assert.equal(observe.runtimeReleaseGranted, false)
assert.equal(observe.productionReady, false)
assert.equal(observeCalls, 1)

const invalidCommands: readonly (readonly string[])[] = [
  [
    '--action=start',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
  [
    '--execute', '--execute', '--action=start',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
  [
    '--execute', '--action=start', '--bucket=caller-bucket',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
  [
    '--execute', '--action=start', '--authority-id=https://example.com/a',
    `--authority-sha256=${authorityHash}`,
  ],
  [
    '--execute', '--action=start',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
    `--submission-id=${submissionRef.id}`,
    `--submission-sha256=${submission.submissionHash}`,
  ],
  [
    '--execute', '--action=observe',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
]
for (const argv of invalidCommands) {
  await assert.rejects(() => executeCanonicalSam31CloudImageBuildOperator({
    argv,
    environment: confirmedEnvironment,
    runtime,
  }))
}
await assert.rejects(() => executeCanonicalSam31CloudImageBuildOperator({
  argv: [
    '--execute', '--action=start',
    `--authority-id=${authorityRef.id}`,
    `--authority-sha256=${authorityHash}`,
  ],
  environment: {},
  runtime,
}))
assert.equal(startCalls, 1)
assert.equal(observeCalls, 1)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-cloud-image-build-operator',
  checks: 27,
  cloudOnly: true,
  callerSelectedBucketUrlModelCheckpointOrDockerfileAllowed: false,
  executeAndEnvironmentConfirmationRequired: true,
  automaticRetryAllowed: false,
  developerMachineModelInstallAllowed: false,
  modelOrCheckpointBytesReadLocally: false,
  providerExecuted: false,
  productionReady: false,
}))
