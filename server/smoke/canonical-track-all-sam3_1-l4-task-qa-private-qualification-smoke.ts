import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture,
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  canonicalTrackAllSam31L4TaskQaResponseRef,
  canonicalTrackAllSam31L4TaskQaTaskRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-qualification'
import {
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const fixture = buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture({
  qualificationId: 'weeditpro-sam31-l4-private-qualification-smoke',
  sam31InvocationId: 'weeditpro-sam31-l4-private-fixture-source',
  l4InvocationId: 'weeditpro-sam31-l4-private-fixture-qa',
})
const replayFixture =
  buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationFixture({
    qualificationId: 'weeditpro-sam31-l4-private-qualification-smoke-replay',
    sam31InvocationId: 'weeditpro-sam31-l4-private-fixture-source-replay',
    l4InvocationId: 'weeditpro-sam31-l4-private-fixture-qa-replay',
  })

assert.equal(fixture.masks.length, 16)
assert.equal(fixture.fixtureDigestSha256, replayFixture.fixtureDigestSha256)
assert.notEqual(
  fixture.request.requestBindingSha256,
  replayFixture.request.requestBindingSha256,
)
for (const mask of fixture.masks) {
  assert.deepEqual(
    [...mask.body.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  )
  assert.ok(mask.body.byteLength > 100)
}
assert.equal(fixture.request.sourceWidth, 640)
assert.equal(fixture.request.sourceHeight, 360)
assert.equal(fixture.request.expectedMaskPngCount, 16)
assert.equal(fixture.request.executionPolicy.accelerator, 'nvidia_l4')
assert.equal(fixture.request.executionPolicy.cpuOnlySubstantiveMaskQaAllowed,
  false)
assert.equal(fixture.request.executionPolicy.runtimeDownloadAllowed, false)

const workerResponse = buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV2({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v2',
  operationId: 'tool.kornia.refine_mask.v1',
  l4InvocationId: fixture.l4InvocationId,
  sam31InvocationId: fixture.sam31InvocationId,
  requestBindingSha256: fixture.request.requestBindingSha256,
  status: 'completed',
  terminalStage: 'completed',
  gpuEvidence: {
    requestedAccelerator: 'nvidia_l4',
    observedDeviceNameDigestSha256: sha256AuthorityValue({ device: 'L4' }),
    observedNvidiaDriverVersion: '535.216.03',
    observedCudaRuntimeVersion: '12.8',
    observedTorchVersion: '2.10.0+cu128',
    observedKorniaVersion: '0.8.3',
    observedOpenCvVersion: '4.13.0',
    observedComputeCapabilityMajor: 8,
    observedComputeCapabilityMinor: 9,
    observedTotalDeviceMemoryBytes: 24 * 1024 ** 3,
    maximumObservedGpuUtilizationPercent: 50,
    cudaAvailable: true,
    exactL4DeviceObserved: true,
    korniaCudaTensorExecutionObserved: true,
    opencvCudaDeviceCount: 1,
    opencvCudaEveryMaskCrosschecked: true,
    torchCudaKernelCount: 10,
    opencvCudaKernelCount: 32,
    cpuOnlySubstantiveMaskQaUsed: false,
    cudaDriverLibraryMode: 'host_driver',
    observedCudaDriverLibraryPathDigestSha256:
      sha256AuthorityValue({ library: 'libcuda' }),
  },
  inputEvidence: {
    manifestByteLength: fixture.manifestBytes.byteLength,
    manifestSha256: fixture.request.expectedMaskManifestSha256,
    manifestRefExactMatch: true,
    manifestRequestBindingExactMatch: true,
    maskPngCount: 16,
    maskPngByteLength: fixture.masks.reduce(
      (total, mask) => total + mask.body.byteLength,
      0,
    ),
    everyManifestMaskPngRereadAndHashed: true,
    everyRequestedFrameAndSubjectPresentExactlyOnce: true,
    everyMaskMatchesSourceGeometry: true,
    everyMaskIsBinaryGrayscalePng: true,
    unrequestedManifestObjectOrFrameAccepted: false,
  },
  runtimeMeasurement: {
    wallTimeMilliseconds: 1_000,
    decodeAndUploadMilliseconds: 100,
    korniaCudaMilliseconds: 400,
    opencvCudaCrosscheckMilliseconds: 200,
    peakCudaAllocatedBytes: 1_000_000,
    peakCudaReservedBytes: 2_000_000,
  },
  outputSummary: {
    subjectMeasurements: [
      measurement('weeditpro-sam31-l4-qa-primary-request',
        'weeditpro-sam31-l4-qa-primary-evidence', 1),
      measurement('weeditpro-sam31-l4-qa-product-request',
        'weeditpro-sam31-l4-qa-product-evidence', 2),
    ],
    korniaCudaExecutionDigestSha256: sha256AuthorityValue({ kornia: true }),
    opencvCudaCrosscheckExecutionDigestSha256:
      sha256AuthorityValue({ opencv: true }),
    completeRequestedFrameAndSubjectCoverage: true,
    sampledOrRepresentativeOnlyMeasurementAccepted: false,
    exactMaskManifestAndEveryMaskPngReread: true,
  },
  failureCode: 'none',
  privateCreateOnlyWorkerOutput: true,
  runtimeDownloadPerformed: false,
  cpuOnlySubstantiveMaskQaUsed: false,
  serverCostReceiptIncluded: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})

const supplyRef = (id: string) => ({
  id,
  version: 1 as const,
  contentHash: `sha256:${sha256AuthorityValue({ id })}` as const,
})
const manifestRef = {
  id: String((fixture.manifest as { schemaVersion: string }).schemaVersion),
  version: 1 as const,
  contentHash: fixture.request.sam31MaskManifestRef.contentHash,
}
const responseRef = canonicalTrackAllSam31L4TaskQaResponseRef(workerResponse)
const receipt = buildCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
  schemaVersion:
    'canonical-track-all-sam3_1-l4-task-qa-private-qualification-receipt-v1',
  source:
    'canonical_server_track_all_sam3_1_l4_task_qa_private_qualification_owner',
  evidenceClass: 'canonical_private_l4_cuda_execution_and_terminal_reread',
  qualificationId: 'weeditpro-sam31-l4-private-qualification-smoke',
  qualificationVersion: 1,
  disposition: 'l4_task_qa_qualified_rate_blocked',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary',
  supplyChainEvidence: {
    imageBuildAuthorityRef: supplyRef('image-build-authority'),
    imageBuildSubmissionRef: supplyRef('image-build-submission'),
    imageBuildTerminalRef: supplyRef('image-build-terminal'),
    supplyChainAdmissionRef: supplyRef('supply-admission'),
    supplyChainSubmissionRef: supplyRef('supply-submission'),
    supplyChainTerminalRef: supplyRef('supply-terminal'),
    sbomRef: supplyRef('sbom'),
    vulnerabilityScanRef: supplyRef('vulnerability-scan'),
    signatureVerificationRef: supplyRef('signature-verification'),
    slsaProvenanceRef: supplyRef('slsa-provenance'),
    securityReviewRef: supplyRef('security-review'),
    exactSupplyChainRereadBeforeQualification: true,
  },
  deployment: {
    projectId: 'reeditpro',
    region: 'us-central1',
    jobResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4',
    jobUid: '6cde9050-a555-406f-8c8c-a6123d0ddc88',
    immutableImageDigest:
      'sha256:fb9ced131438f50c7273f11fd47febfb2b7d440e1ae3d18f78151d33ce4e83de',
    accelerator: 'nvidia_l4',
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    taskCount: 1,
    parallelism: 1,
    maximumRetries: 0,
    network: 'weeditpro-gpu-private',
    subnet: 'weeditpro-gpu-private-us-central1',
    networkTag: 'weeditpro-gpu-private-no-nat',
    vpcEgress: 'all-traffic',
    privateGoogleAccessEnabled: true,
    cloudNatPresent: false,
    publicNetworkEgressAllowed: false,
    minimumIdleInstances: 0,
  },
  deterministicFixture: {
    fixtureId: fixture.fixtureId,
    fixtureDigestSha256: fixture.fixtureDigestSha256,
    width: 640,
    height: 360,
    frameCount: 8,
    subjectCount: 2,
    maskPngCount: 16,
    sam31InvocationId: fixture.sam31InvocationId,
    l4InvocationId: fixture.l4InvocationId,
    manifestRef,
    requestRef: {
      id: fixture.request.l4InvocationId,
      version: 1,
      contentHash: `sha256:${fixture.request.requestBindingSha256}`,
    },
    taskObjectRef: canonicalTrackAllSam31L4TaskQaTaskRef(fixture.request),
  },
  execution: {
    cloudRunOperationName:
      'projects/reeditpro/locations/us-central1/operations/operation-smoke',
    cloudRunExecutionResource:
      'projects/reeditpro/locations/us-central1/jobs/reeditpro-track-all-mask-qa-l4/executions/execution-smoke',
    executionStartTime: '2026-08-05T20:00:00.000Z',
    executionCompletionTime: '2026-08-05T20:01:00.000Z',
    activeExecutionCountBeforeStart: 0,
    activeExecutionCountAfterTerminal: 0,
    executionSucceededCount: 1,
    executionFailedCount: 0,
    executionCancelledCount: 0,
    scaleFromZeroObserved: true,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    automaticRetryPerformed: false,
    responseObjectRef: responseRef,
  },
  workerResponse,
  pricing: {
    disposition: 'blocked_missing_billing_account_effective_price_authority',
    accountEffectiveRateAuthorityRef: null,
    attemptCostReceiptRef: null,
    customerCreditSettlementRef: null,
    publicCatalogListPriceSubstitutionAccepted: false,
    customerCreditsMutated: false,
  },
  actualL4GpuExecutionObserved: true,
  actualKorniaCudaKernelExecutionObserved: true,
  actualOpenCvCudaCrosscheckExecutionObserved: true,
  everyFixtureMaskRereadAndMeasured: true,
  runtimeDownloadPerformed: false,
  sam31CheckpointOrModelExecuted: false,
  cpuOnlySubstantiveMaskQaUsed: false,
  customerMediaUsed: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  qualifiedAt: '2026-08-05T20:01:00.000Z',
})

assert.equal(
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(receipt)
    .disposition,
  'l4_task_qa_qualified_rate_blocked',
)
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
    ...structuredClone(receipt),
    runtimeReleaseGranted: true,
  }))
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
    ...structuredClone(receipt),
    pricing: {
      ...structuredClone(receipt.pricing),
      customerCreditsMutated: true,
    },
  }))
assert.throws(() =>
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt({
    ...structuredClone(receipt),
    workerResponse: {
      ...structuredClone(receipt.workerResponse),
      responseBindingSha256: '0'.repeat(64),
    },
  }))

const source = readFileSync(
  'server/services/canonical-track-all-sam3_1-l4-task-qa-private-qualification.ts',
  'utf8',
)
for (const forbidden of [
  /child_process/u,
  /execFile/u,
  /spawn\(/u,
  /gcloud/u,
  /docker/u,
  /(?:https?|file|data|blob):\/\//u,
] as const) assert.doesNotMatch(source, forbidden)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-l4-task-qa-private-qualification',
  deterministicFixtureMasks: fixture.masks.length,
  exactL4CudaResponseRequired: true,
  scaleFromZeroTerminalStopRequired: true,
  accountEffectivePricingRemainsBlocked: true,
  sam31ModelExecutedByThisQualification: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

function measurement(
  subjectRequestId: string,
  subjectEvidenceId: string,
  maskObjectId: number,
) {
  return {
    subjectRequestId,
    subjectEvidenceId,
    maskObjectId,
    measuredFrameCount: 8,
    expectedFrameCount: 8,
    emptyMaskFrameCount: 0,
    fullFrameMaskCount: 0,
    minimumBinaryIntersectionOverUnionBasisPoints: 9_000,
    maximumNormalizedCentroidShiftBasisPoints: 100,
    maximumBoundaryDisagreementBasisPoints: 100,
    maximumAlphaFlickerBasisPoints: 100,
    minimumEdgeQualityBasisPoints: 9_900,
    minimumSubjectCoverageBasisPoints: 9_000,
    identitySwapCount: 0,
    lostAnchorFrameCount: 0,
    firstMaskFrameIndex: 0,
    lastMaskFrameIndex: 7,
    maskPngCount: 8,
    maskPngByteLength: 8_000,
    orderedMaskSetDigestSha256: sha256AuthorityValue({ subjectEvidenceId }),
    completeRequestedRangeCoverage: true as const,
  }
}
