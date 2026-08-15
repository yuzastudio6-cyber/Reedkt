import { createHash } from 'node:crypto'

import {
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
  sealCanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  assertCanonicalSam31L4RuntimeThirtyRunQualification,
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository,
  createCanonicalSam31L4RuntimeThirtyRunQualificationService,
} from '../services/canonical-sam3_1-l4-runtime-thirty-run-qualification-service'

const objects = new Map<string, Buffer>()
const objectPort = {
  async createOnly({ objectPath, body }: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }) {
    if (objects.has(objectPath)) return 'already_exists' as const
    objects.set(objectPath, Buffer.from(body))
    return 'created' as const
  },
  async readExact(objectPath: string) {
    const body = objects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}
const qualificationId = 'sam31-l4-thirty-run-qualification-20260812-v1'
const runRepository =
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository({ objectPort })
const qualificationRepository =
  createCanonicalSam31L4RuntimeThirtyRunQualificationRepository({ objectPort })

for (let ordinal = 1; ordinal <= 30; ordinal += 1) {
  const receipt = sealCanonicalSam31L4RuntimePrivateRunReceipt({
    schemaVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v3',
    source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
    evidenceClass: 'canonical_private_l4_cuda_execution_exact_reread',
    status: 'ready_for_terminal_cost_and_independent_mask_quality',
    qualificationId,
    runOrdinal: ordinal,
    admissionRef: ref(`admission-${ordinal}`),
    admissionConsumptionRef: ref(`consumption-${ordinal}`),
    executionEnvelopeRef: ref(`envelope-${ordinal}`),
    taskRef: ref(`task-${ordinal}`),
    launchRef: ref(`launch-${ordinal}`),
    cloudRunOperationName:
      `projects/reeditpro/locations/us-central1/operations/operation-${ordinal}`,
    cloudRunExecutionResource:
      'projects/reeditpro/locations/us-central1/jobs/'
        + 'reeditpro-sam31-l4-fallback/executions/'
        + `execution-${ordinal}`,
    currentL4FallbackRateAuthorityRef: ref('l4-rate'),
    qualifiedA100ServingQualificationRef: ref('a100-qualification'),
    runtimeCandidateReleaseRef: ref(`runtime-candidate-${ordinal}`),
    checkpointPromotionRef: ref('checkpoint'),
    runtimeResponseRef: ref(`response-${ordinal}`),
    privateOutputRereadEvidenceRef: ref(`output-${ordinal}`),
    semanticManifestRef: ref(`semantic-manifest-${ordinal}`),
    crossAcceleratorMaskComparisonRef:
      ref(`cross-accelerator-comparison-${ordinal}`),
    semanticMaskSetDigestSha256: digest('semantic-mask-set'),
    immutableImageDigest: `sha256:${digest('immutable-image')}`,
    observedAccelerator: 'nvidia_l4',
    observedDriverVersion: '550.54.15',
    observedCudaRuntimeVersion: '12.8',
    wallTimeMilliseconds: 90_000 + ordinal,
    cudaEventInferenceMilliseconds: 80_000 + ordinal,
    privateInputByteLength: 1_024,
    workerOutputByteLength: 8_192,
    manifestByteLength: 2_048,
    combinedMaskByteLength: 6_144,
    propagatedFrameCount: 200,
    losslessMaskPngCount: 400,
    scaleFromZeroObserved: true,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    exactTaskResponseAndEveryOutputMaskReread: true,
    exactFrameObjectAndMaskDimensionsMatchA100ServingQualification: true,
    crossAcceleratorBoxGeometryCompatibilityPassed: true,
    crossAcceleratorPixelComparisonPassed: true,
    semanticMaskSetByteIdentityWithA100ServingBaseline: false,
    qualityEqualToOrBetterThanA100BaselineClaimed: false,
    accountEffectiveRateRereadBeforeDispatch: true,
    terminalPlatformUsageAndCostReceiptPending: true,
    independentTemporalMaskQualityPending: true,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    completedAt: `2026-08-12T15:${String(ordinal).padStart(2, '0')}:00.000Z`,
  })
  await runRepository.persistCreateOnly({ receipt })
}

const service = createCanonicalSam31L4RuntimeThirtyRunQualificationService({
  runReceiptRepository: runRepository,
  qualificationRepository,
  now: () => '2026-08-12T16:00:00.000Z',
})
const receipt = await service.compile({
  qualificationSetId: 'sam31-l4-thirty-run-release-candidate-20260812-v1',
  qualificationId,
})
const replay = await service.compile({
  qualificationSetId: receipt.qualificationSetId,
  qualificationId,
})
if (receipt.receiptHash !== replay.receiptHash
  || receipt.runs.length !== 30
  || receipt.nearestRankP95Milliseconds !== 90_029
  || receipt.terminalCostReceiptCountPending !== 30
  || receipt.l4FallbackQualified
  || receipt.runtimeReleaseGranted) {
  throw new Error('SAM 3.1 L4 thirty-run qualification is not fail-closed.')
}

let tamperRejected = false
try {
  assertCanonicalSam31L4RuntimeThirtyRunQualification({
    ...receipt,
    terminalCostReceiptCount: 30,
  })
} catch {
  tamperRejected = true
}
if (!tamperRejected) {
  throw new Error('SAM 3.1 L4 thirty-run qualification accepted cost relabel.')
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  checks: 36,
  receiptHash: receipt.receiptHash,
  runCount: receipt.runs.length,
  nearestRankP95Milliseconds: receipt.nearestRankP95Milliseconds,
  allThirtyL4OutputsByteIdenticalToOneAnother:
    receipt.allThirtyL4OutputsByteIdenticalToOneAnother,
  everyRunCrossAcceleratorPixelComparisonPassed:
    receipt.everyRunCrossAcceleratorPixelComparisonPassed,
  terminalCostReceiptCountPending: receipt.terminalCostReceiptCountPending,
  independentTemporalMaskQualityPending:
    receipt.independentTemporalMaskQualityPending,
  l4FallbackQualified: receipt.l4FallbackQualified,
  runtimeReleaseGranted: receipt.runtimeReleaseGranted,
})}\n`)

function ref(id: string) {
  return {
    id,
    version: 1 as const,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
