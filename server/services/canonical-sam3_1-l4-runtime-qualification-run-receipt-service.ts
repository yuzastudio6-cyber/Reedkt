import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_L4_RUNTIME_PRIVATE_RUN_RECEIPT_VERSION =
  'canonical-sam3_1-l4-runtime-private-run-receipt-v2' as const
export const CANONICAL_SAM3_1_L4_RUNTIME_PRIVATE_RUN_RECEIPT_REPOSITORY_VERSION =
  'canonical-sam3_1-l4-runtime-private-run-receipt-repository-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v2/indexed-run-receipts'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeResource = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const runOrdinal = z.number().int().min(1).max(30)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_RUNTIME_PRIVATE_RUN_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_l4_runtime_qualification_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_l4_cuda_execution_exact_reread',
  ),
  status: z.literal(
    'ready_for_terminal_cost_and_independent_mask_quality',
  ),
  qualificationId: safeId,
  runOrdinal,
  admissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  taskRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  cloudRunOperationName: safeResource.regex(
    /^projects\/reeditpro\/locations\/us-central1\/operations\/[A-Za-z0-9._-]+$/u,
  ),
  cloudRunExecutionResource: safeResource.regex(
    /^projects\/reeditpro\/locations\/us-central1\/jobs\/reeditpro-sam31-l4-fallback\/executions\/[a-z0-9-]+$/u,
  ),
  currentL4FallbackRateAuthorityRef: evidenceRefSchema,
  qualifiedA100ServingQualificationRef: evidenceRefSchema,
  runtimeCandidateReleaseRef: evidenceRefSchema,
  checkpointPromotionRef: evidenceRefSchema,
  runtimeResponseRef: evidenceRefSchema,
  privateOutputRereadEvidenceRef: evidenceRefSchema,
  semanticManifestRef: evidenceRefSchema,
  semanticMaskSetDigestSha256: sha256,
  immutableImageDigest: prefixedSha256,
  observedAccelerator: z.literal('nvidia_l4'),
  observedDriverVersion: z.string().regex(/^[0-9]+(?:\.[0-9]+){1,3}$/u),
  observedCudaRuntimeVersion: z.string().regex(/^[0-9]+(?:\.[0-9]+){1,2}$/u),
  wallTimeMilliseconds: positiveInteger,
  cudaEventInferenceMilliseconds: positiveInteger,
  privateInputByteLength: positiveInteger,
  workerOutputByteLength: positiveInteger,
  manifestByteLength: positiveInteger,
  combinedMaskByteLength: positiveInteger,
  propagatedFrameCount: z.literal(200),
  losslessMaskPngCount: z.literal(400),
  scaleFromZeroObserved: z.literal(true),
  terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
  exactTaskResponseAndEveryOutputMaskReread: z.literal(true),
  exactDeterministicProbeMaskSetMatchesA100ServingQualification:
    z.literal(true),
  accountEffectiveRateRereadBeforeDispatch: z.literal(true),
  terminalPlatformUsageAndCostReceiptPending: z.literal(true),
  independentTemporalMaskQualityPending: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  completedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const exactScope = receipt.cloudRunExecutionResource.startsWith(
    'projects/reeditpro/locations/us-central1/jobs/'
      + 'reeditpro-sam31-l4-fallback/executions/',
  )
    && receipt.wallTimeMilliseconds >=
      receipt.cudaEventInferenceMilliseconds
    && receipt.workerOutputByteLength >= receipt.combinedMaskByteLength
  if (!exactScope) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 L4 run receipt lost execution or timing scope.',
  })
})

export const canonicalSam31L4RuntimePrivateRunReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31L4RuntimePrivateRunReceipt = z.infer<
  typeof canonicalSam31L4RuntimePrivateRunReceiptSchema
>

export function sealCanonicalSam31L4RuntimePrivateRunReceipt(
  value: unknown,
): CanonicalSam31L4RuntimePrivateRunReceipt {
  assertPlainSerializedData(value, 'sam31_l4_runtime_run_receipt_build')
  const payload = receiptWithoutHashSchema.parse(value)
  return assertCanonicalSam31L4RuntimePrivateRunReceipt({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31L4RuntimePrivateRunReceipt(
  value: unknown,
): CanonicalSam31L4RuntimePrivateRunReceipt {
  assertPlainSerializedData(value, 'sam31_l4_runtime_run_receipt')
  const receipt = canonicalSam31L4RuntimePrivateRunReceiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 L4 run receipt hash changed.')
  }
  return receipt
}

export interface CanonicalSam31L4RuntimePrivateRunReceiptRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_L4_RUNTIME_PRIVATE_RUN_RECEIPT_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31L4RuntimePrivateRunReceipt
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly qualificationId: string
    readonly runOrdinal: number
  }): Promise<CanonicalSam31L4RuntimePrivateRunReceipt | null>
}

export function createCanonicalSam31L4RuntimePrivateRunReceiptRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31L4RuntimePrivateRunReceiptRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_L4_RUNTIME_PRIVATE_RUN_RECEIPT_REPOSITORY_VERSION,
    async persistCreateOnly({ receipt: untrusted }) {
      const receipt = assertCanonicalSam31L4RuntimePrivateRunReceipt(
        untrusted,
      )
      const body = serialize(receipt)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(
          prefix,
          receipt.qualificationId,
          receipt.runOrdinal,
        ),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await this.reread({
        qualificationId: receipt.qualificationId,
        runOrdinal: receipt.runOrdinal,
      })
      if (!reread || reread.receiptHash !== receipt.receiptHash) {
        throw new Error('SAM 3.1 L4 run receipt exact reread changed.')
      }
      return disposition
    },
    async reread({ qualificationId, runOrdinal: ordinal }) {
      const id = safeId.parse(qualificationId)
      const run = runOrdinal.parse(ordinal)
      const body = await input.objectPort.readExact(
        recordPath(prefix, id, run),
      )
      if (!body) return null
      const receipt = assertCanonicalSam31L4RuntimePrivateRunReceipt(
        JSON.parse(body.toString('utf8')) as unknown,
      )
      if (receipt.qualificationId !== id || receipt.runOrdinal !== run
        || stableAuthorityStringify(receipt) !== body.toString('utf8')) {
        throw new Error('SAM 3.1 L4 indexed run receipt changed.')
      }
      return structuredClone(receipt)
    },
  })
}

function recordPath(prefix: string, qualificationId: string, ordinal: number) {
  const idHash = createHash('sha256')
    .update(qualificationId, 'utf8').digest('hex')
  return `${prefix}/${idHash}/run-${String(ordinal).padStart(2, '0')}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 L4 run receipt bytes are invalid.')
  }
  return body
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('SAM 3.1 L4 run receipt object port is unavailable.')
  }
}
