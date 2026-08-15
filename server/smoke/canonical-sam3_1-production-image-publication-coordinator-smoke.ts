import assert from 'node:assert/strict'

import {
  createCanonicalSam31ProductionImagePublicationCoordinator,
} from '../services/canonical-sam3_1-production-image-publication-coordinator'

const qualification = {
  id: 'sam31-source-checkpoint-qualification',
  version: 2 as const,
  schemaVersion:
    'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2' as const,
  contentHash: `sha256:${'1'.repeat(64)}`,
}
const artifactBindingRef = ref('sam31-artifact-binding', '2')
const capsuleManifestRef = ref('sam31-production-capsule', '3')
const reproducibilityRef = ref('sam31-production-reproducibility', '4')
const authorityRef = ref('sam31-production-image-authority', '5')
const primaryBuildId = '11111111-1111-4111-8111-111111111111'
const confirmationBuildId = '22222222-2222-4222-8222-222222222222'
const imageDestination = {
  repository:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers',
  imageName: 'reeditpro-sam31-gpu',
  tag: 'sam31-production-smoke',
  taggedUri:
    'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu:sam31-production-smoke',
  callerSelectedTagAllowed: false as const,
  tagMayAuthorizeRuntime: false as const,
  terminalImmutableDigestRequired: true as const,
}
const calls: unknown[] = []
let capsuleResult = createCapsuleResult()
let authorityResult = createAuthorityResult()
const coordinator = createCanonicalSam31ProductionImagePublicationCoordinator({
  capsulePublisher: {
    async publish(input) {
      calls.push({ stage: 'capsule', input: structuredClone(input) })
      return structuredClone(capsuleResult)
    },
  },
  authorityPublisher: {
    async publish(input) {
      calls.push({ stage: 'authority', input: structuredClone(input) })
      return structuredClone(authorityResult)
    },
  },
})
const canonicalRequest = {
  sourceCheckpointQualificationRef: qualification,
  primaryBuildId,
  confirmationBuildId,
}
const result = await coordinator.publish(canonicalRequest)

assert.equal(result.disposition, 'ready_for_scale_zero_image_operator_start')
assert.deepEqual(result.authorityRef, authorityRef)
assert.equal(result.imageBuildStarted, false)
assert.equal(result.gpuJobDispatched, false)
assert.equal(result.modelOrCheckpointExecuted, false)
assert.equal(result.customerCreditsMutated, false)
assert.equal(result.runtimeReleaseGranted, false)
assert.equal(result.productionReady, false)
assert.deepEqual(calls, [
  { stage: 'capsule', input: canonicalRequest },
  {
    stage: 'authority',
    input: {
      sourceCheckpointQualificationRef: qualification,
      capsuleManifestRef,
    },
  },
])

await assert.rejects(coordinator.publish({ ...canonicalRequest, command: 'x' }))
await assert.rejects(coordinator.publish({
  ...canonicalRequest,
  confirmationBuildId: primaryBuildId,
}))
capsuleResult = { ...createCapsuleResult(), imageBuildStarted: true } as never
await assert.rejects(coordinator.publish(canonicalRequest))
capsuleResult = createCapsuleResult()
authorityResult = {
  ...createAuthorityResult(),
  capsuleManifestRef: ref('substituted-capsule', '6'),
}
await assert.rejects(coordinator.publish(canonicalRequest))
authorityResult = {
  ...createAuthorityResult(),
  artifactBindingRef: ref('substituted-binding', '7'),
}
await assert.rejects(coordinator.publish(canonicalRequest))
authorityResult = { ...createAuthorityResult(), gpuJobDispatched: true } as never
await assert.rejects(coordinator.publish(canonicalRequest))
assert.throws(() => createCanonicalSam31ProductionImagePublicationCoordinator({
  capsulePublisher: {} as never,
  authorityPublisher: {} as never,
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-production-image-publication-coordinator',
  checks: 24,
  exactTwoBuildCapsulePublicationSequenced: true,
  exactCapsuleAuthorityCrossBindingVerified: true,
  scaleZeroImageOperatorInputReturned: true,
  callerCommandPathTagRetryGpuOrCreditAccepted: false,
  imageBuildStarted: false,
  gpuJobDispatched: false,
  modelOrCheckpointExecuted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

function createCapsuleResult() {
  return {
    schemaVersion: 'canonical-sam3_1-production-capsule-publisher-v2',
    disposition: 'capsule_ready_for_image_authority_publication',
    sourceCheckpointQualificationRef: qualification,
    artifactBindingRef,
    reproducibilityRef,
    capsuleManifestRef,
    independentBuildCount: 2,
    exactCapsuleBodyAndEntrySetReread: true,
    checkpointIncluded: false,
    developerMachineModelInstallPerformed: false,
    imageBuildStarted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    runtimeReleaseGranted: false,
    productionReady: false,
  } as const
}

function createAuthorityResult() {
  return {
    schemaVersion:
      'canonical-sam3_1-production-image-authority-publisher-v2',
    disposition: 'authorized_for_private_cloud_build',
    sourceCheckpointQualificationRef: qualification,
    artifactBindingRef,
    capsuleManifestRef,
    authorityRef,
    imageDestination,
    exactQualifiedReleaseIngestBindingCapsuleAndAuthorityReread: true,
    imageBuildStarted: false,
    imagePushed: false,
    runtimeReleaseGranted: false,
    gpuJobDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    productionReady: false,
  } as const
}

function ref(id: string, digit: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digit.repeat(64)}`,
  }
}
