import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31L4RuntimePrivateRunReceipt,
  createCanonicalSam31L4RuntimePrivateRunReceiptRepository,
  sealCanonicalSam31L4RuntimePrivateRunReceipt,
} from '../services/canonical-sam3_1-l4-runtime-qualification-run-receipt-service'

const objects = new Map<string, Buffer>()
const repository = createCanonicalSam31L4RuntimePrivateRunReceiptRepository({
  objectPort: {
    async createOnly({ objectPath, body }) {
      if (objects.has(objectPath)) return 'already_exists' as const
      objects.set(objectPath, Buffer.from(body))
      return 'created' as const
    },
    async readExact(objectPath) {
      const body = objects.get(objectPath)
      return body ? Buffer.from(body) : null
    },
  },
})

const receipt = sealCanonicalSam31L4RuntimePrivateRunReceipt({
  schemaVersion: 'canonical-sam3_1-l4-runtime-private-run-receipt-v3',
  source: 'canonical_server_sam3_1_l4_runtime_qualification_owner',
  evidenceClass: 'canonical_private_l4_cuda_execution_exact_reread',
  status: 'ready_for_terminal_cost_and_independent_mask_quality',
  qualificationId: 'sam31-l4-thirty-run-qualification-20260812-v1',
  runOrdinal: 1,
  admissionRef: ref('admission'),
  admissionConsumptionRef: ref('consumption'),
  executionEnvelopeRef: ref('envelope'),
  taskRef: ref('task'),
  launchRef: ref('launch'),
  cloudRunOperationName:
    'projects/reeditpro/locations/us-central1/operations/operation-1',
  cloudRunExecutionResource:
    'projects/reeditpro/locations/us-central1/jobs/'
      + 'reeditpro-sam31-l4-fallback/executions/execution-1',
  currentL4FallbackRateAuthorityRef: ref('l4-rate'),
  qualifiedA100ServingQualificationRef: ref('a100-qualification'),
  runtimeCandidateReleaseRef: ref('runtime-candidate'),
  checkpointPromotionRef: ref('checkpoint'),
  runtimeResponseRef: ref('response'),
  privateOutputRereadEvidenceRef: ref('output'),
  semanticManifestRef: ref('semantic-manifest'),
  crossAcceleratorMaskComparisonRef: ref('cross-accelerator-comparison'),
  semanticMaskSetDigestSha256: digest('semantic-mask-set'),
  immutableImageDigest: `sha256:${digest('immutable-image')}`,
  observedAccelerator: 'nvidia_l4',
  observedDriverVersion: '550.54.15',
  observedCudaRuntimeVersion: '12.8',
  wallTimeMilliseconds: 92_000,
  cudaEventInferenceMilliseconds: 81_000,
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
  completedAt: '2026-08-12T15:00:00.000Z',
})

const created = await repository.persistCreateOnly({ receipt })
const replay = await repository.persistCreateOnly({ receipt })
const reread = await repository.reread({
  qualificationId: receipt.qualificationId,
  runOrdinal: receipt.runOrdinal,
})
if (created !== 'created' || replay !== 'already_exists'
  || reread?.receiptHash !== receipt.receiptHash) {
  throw new Error('L4 run receipt create-only exact reread failed.')
}

const adversarial = [
  () => assertCanonicalSam31L4RuntimePrivateRunReceipt({
    ...receipt,
    receiptHash: digest('tampered'),
  }),
  () => sealCanonicalSam31L4RuntimePrivateRunReceipt({
    ...withoutHash(receipt),
    observedAccelerator: 'nvidia_a100_80gb',
  }),
  () => sealCanonicalSam31L4RuntimePrivateRunReceipt({
    ...withoutHash(receipt),
    terminalPlatformUsageAndCostReceiptPending: false,
  }),
  () => sealCanonicalSam31L4RuntimePrivateRunReceipt({
    ...withoutHash(receipt),
    wallTimeMilliseconds: 80_000,
    cudaEventInferenceMilliseconds: 81_000,
  }),
  () => sealCanonicalSam31L4RuntimePrivateRunReceipt({
    ...withoutHash(receipt),
    callerPriceUsd: '0.01',
  }),
]
for (const attack of adversarial) {
  let rejected = false
  try {
    attack()
  } catch {
    rejected = true
  }
  if (!rejected) throw new Error('L4 run receipt accepted adversarial input.')
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  checks: 8,
  receiptHash: receipt.receiptHash,
  indexedCreateOnlyExactReread: true,
  pendingCostAndIndependentQualityCannotBeRelabeled: true,
  callerPriceOrRuntimeAuthorityAccepted: false,
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

function withoutHash(value: typeof receipt) {
  const { receiptHash: _receiptHash, ...payload } = value
  void _receiptHash
  return payload
}
