import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CanonicalPostrenderVisualQaWorkRequestInput } from
  '../../src/types/canonical-postrender-visual-qa-work-request'
import {
  createCanonicalPostrenderVisualQaWorkRequest,
  digestCanonicalPostrenderVisualQaWorkRequest,
  parseCanonicalPostrenderVisualQaWorkRequest,
} from '../validation/canonical-postrender-visual-qa-work-request-schemas'

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')
const hash = (value: string) => `sha256:${sha256(value)}`
const ref = (id: string, version = 1) => ({
  id,
  version,
  contentHash: hash(id),
})

const input: CanonicalPostrenderVisualQaWorkRequestInput = {
  scope: {
    ownerUserId: 'user-qa-1',
    workspaceId: 'workspace-qa-1',
    projectId: 'project-qa-1',
    editSessionId: 'edit-qa-1',
    approvedSnapshotId: 'snapshot-qa-1',
  },
  approvedSnapshotRef: ref('snapshot-qa-1', 3),
  executionPackageRef: ref('execution-package-qa-1', 5),
  approvedWorkItemRef: ref('work-postrender-qa-1'),
  creditReservationRef: ref('reservation-qa-1'),
  privateRenderArtifactRef: {
    id: 'render-qa-1',
    version: 2,
    contentHash: hash('render-qa-1'),
  },
  deterministicQaRef: ref('deterministic-qa-1'),
  estimateCostBindingRef: ref('estimate-cost-qa-1'),
  sampleCollectionRef: ref('sample-collection-qa-1'),
  render: {
    artifactId: 'render-qa-1',
    artifactVersion: 2,
    contentHash: hash('render-qa-1'),
    width: 1_920,
    height: 1_080,
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 240,
    durationFrames: 240,
    privateCreateOnlyVerified: true,
    exactRereadVerified: true,
    deterministicQaPassed: true,
  },
  samplePlan: {
    schemaVersion: 'canonical-postrender-visual-qa-sample-plan-v1',
    coverageScope: 'bounded_representative',
    canonicalSegmentCount: 3,
    sampledSegmentIds: ['segment-opening', 'segment-close'],
    sampledSegmentCount: 2,
    unsampledSegmentCount: 1,
    modelInspectsOnlyProvidedSampleArtifacts: true,
    unsampledContentInspectionClaimAllowed: false,
    completeTimeCoverageClaimAllowed: false,
    samples: [{
      sampleId: 'sample-opening',
      segmentId: 'segment-opening',
      sourceRenderKind: 'full_motion',
      frameNumber: 24,
      startFrame: 0,
      endFrameExclusive: 96,
      width: 1_920,
      height: 1_080,
      pixelFormat: 'rgb24',
      frameArtifactRef: {
        id: 'sample-frame-opening',
        version: 1,
        contentHash: hash('sample-opening'),
      },
      frameSha256: sha256('sample-opening'),
      createOnlyPersistenceVerified: true,
      exactRereadVerified: true,
      independentArtifactQaPassed: true,
    }, {
      sampleId: 'sample-close',
      segmentId: 'segment-close',
      sourceRenderKind: 'full_motion',
      frameNumber: 216,
      startFrame: 192,
      endFrameExclusive: 240,
      width: 1_920,
      height: 1_080,
      pixelFormat: 'rgb24',
      frameArtifactRef: {
        id: 'sample-frame-close',
        version: 1,
        contentHash: hash('sample-close'),
      },
      frameSha256: sha256('sample-close'),
      createOnlyPersistenceVerified: true,
      exactRereadVerified: true,
      independentArtifactQaPassed: true,
    }],
  },
  inspectionProfile: {
    profileId: 'postrender-professional-visual-qa',
    profileVersion: 1,
    profileDigestSha256: sha256('inspection-profile'),
    normalizedResponseSchemaId: 'postrender-visual-qa-normalized-result-v1',
    normalizedResponseSchemaDigestSha256: sha256('normalized-result-schema'),
    serverOwnedInstructions: true,
    rawPromptSerialized: false,
    callerProvidedPromptAccepted: false,
  },
  replay: {
    idempotencyKey: 'postrender-qa-idempotency-1',
    requestOrdinal: 1,
    maximumAttempts: 2,
  },
}

const request = createCanonicalPostrenderVisualQaWorkRequest(input)
const replay = createCanonicalPostrenderVisualQaWorkRequest(input)
assert.deepEqual(replay, request)
assert.equal(
  request.workRequestDigestSha256,
  digestCanonicalPostrenderVisualQaWorkRequest(request),
)
assert.equal(request.samplePlan.coverageScope, 'bounded_representative')
assert.equal(request.samplePlan.completeTimeCoverageClaimAllowed, false)
assert.equal(request.boundaries.providerDispatchGranted, false)
assert.equal(request.boundaries.providerCallMade, false)
assert.equal(request.boundaries.modelInferenceExecuted, false)
assert.equal(request.boundaries.customerChargeCreated, false)
assert.equal(request.boundaries.productionAuthority, false)
assert.doesNotMatch(
  JSON.stringify(request),
  /(?:https?:\/\/|file:\/\/|\/Users\/|\/Volumes\/|authorization|bearer|api.?key)/iu,
)

const complete = createCanonicalPostrenderVisualQaWorkRequest({
  ...input,
  samplePlan: {
    ...input.samplePlan,
    coverageScope: 'complete',
    canonicalSegmentCount: 2,
    unsampledSegmentCount: 0,
    completeTimeCoverageClaimAllowed: true,
  },
})
assert.equal(complete.samplePlan.coverageScope, 'complete')
assert.equal(complete.samplePlan.unsampledSegmentCount, 0)

let adversarialAssertions = 0
interface MutableRequestForgery {
  workRequestDigestSha256: string
  scope: { approvedSnapshotId: string }
  render: { contentHash: string; deterministicQaPassed: boolean }
  samplePlan: {
    sampledSegmentCount: number
    unsampledSegmentCount: number
    completeTimeCoverageClaimAllowed: boolean
    samples: Array<{
      sampleId: string
      frameNumber: number
      frameArtifactRef: { contentHash: string }
    }>
  }
  inspectionProfile: { callerProvidedPromptAccepted: boolean }
  boundaries: { providerCallMade: boolean }
}
const reject = (mutate: (value: MutableRequestForgery) => void) => {
  const candidate = structuredClone(request) as unknown as MutableRequestForgery
  mutate(candidate)
  candidate.workRequestDigestSha256 =
    digestCanonicalPostrenderVisualQaWorkRequest(
      candidate as unknown as typeof request,
    )
  assert.throws(() => parseCanonicalPostrenderVisualQaWorkRequest(candidate))
  adversarialAssertions += 1
}

reject((value) => { value.scope.approvedSnapshotId = 'snapshot-cross-edit' })
reject((value) => { value.render.contentHash = hash('different-render') })
reject((value) => { value.render.deterministicQaPassed = false })
reject((value) => { value.samplePlan.sampledSegmentCount = 1 })
reject((value) => { value.samplePlan.unsampledSegmentCount = 0 })
reject((value) => { value.samplePlan.completeTimeCoverageClaimAllowed = true })
reject((value) => { value.samplePlan.samples[1].sampleId = 'sample-opening' })
reject((value) => { value.samplePlan.samples[1].frameNumber = 24 })
reject((value) => { value.samplePlan.samples[0].frameNumber = 240 })
reject((value) => { value.samplePlan.samples[0].frameArtifactRef.contentHash = hash('forged') })
reject((value) => { value.inspectionProfile.callerProvidedPromptAccepted = true })
reject((value) => { value.boundaries.providerCallMade = true })

console.log(JSON.stringify({
  smoke: 'canonical-postrender-visual-qa-work-request-contract',
  operation: request.sharedProviderOperationId,
  modelRole: request.sharedProviderCapabilityId,
  coverageScope: request.samplePlan.coverageScope,
  sampledSegments: request.samplePlan.sampledSegmentCount,
  actualProviderCallMade: request.boundaries.providerCallMade,
  adversarialAssertions,
}))
