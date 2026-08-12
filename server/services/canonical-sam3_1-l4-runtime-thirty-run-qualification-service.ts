import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31L4RuntimePrivateRunReceipt,
  type CanonicalSam31L4RuntimePrivateRunReceipt,
  type CanonicalSam31L4RuntimePrivateRunReceiptRepository,
} from './canonical-sam3_1-l4-runtime-qualification-run-receipt-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_QUALIFICATION_VERSION =
  'canonical-sam3_1-l4-runtime-thirty-run-qualification-v2' as const
export const CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_REPOSITORY_VERSION =
  'canonical-sam3_1-l4-runtime-thirty-run-qualification-repository-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/l4-runtime-qualification/v3/thirty-run-qualifications'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const MAXIMUM_P95_MILLISECONDS = 480_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const runSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30),
  runReceiptRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  runtimeResponseRef: evidenceRefSchema,
  privateOutputRereadEvidenceRef: evidenceRefSchema,
  semanticManifestRef: evidenceRefSchema,
  crossAcceleratorMaskComparisonRef: evidenceRefSchema,
  wallTimeMilliseconds: positiveInteger,
  cudaEventInferenceMilliseconds: positiveInteger,
  semanticMaskSetDigestSha256: sha256,
  exactRunReceiptReread: z.literal(true),
  terminalCostPending: z.literal(true),
}).strict()

const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_l4_runtime_thirty_run_qualification_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_indexed_run_receipt_exact_reread',
  ),
  status: z.literal(
    'ready_for_terminal_cost_and_independent_temporal_quality',
  ),
  qualificationSetId: safeId,
  qualificationId: safeId,
  routeId: z.literal('l4_heavy_fallback'),
  accelerator: z.literal('nvidia_l4'),
  immutableImageDigest: prefixedSha256,
  qualifiedA100ServingQualificationRef: evidenceRefSchema,
  currentL4FallbackRateAuthorityRef: evidenceRefSchema,
  runs: z.array(runSchema).length(30),
  semanticMaskSetDigestSha256: sha256,
  deterministicOutputRunCount: z.literal(30),
  measuredPerformanceRunCount: z.literal(30),
  propagatedFrameCountPerRun: z.literal(200),
  losslessMaskPngCountPerRun: z.literal(400),
  exactLosslessMaskPngCountAcrossRuns: z.literal(12_000),
  nearestRankP95Milliseconds: positiveInteger.max(MAXIMUM_P95_MILLISECONDS),
  minimumMeasuredMilliseconds: positiveInteger,
  maximumMeasuredMilliseconds: positiveInteger,
  maximumAllowedP95Milliseconds: z.literal(MAXIMUM_P95_MILLISECONDS),
  allThirtyL4OutputsByteIdenticalToOneAnother: z.literal(true),
  everyRunCrossAcceleratorPixelComparisonPassed: z.literal(true),
  semanticMaskSetByteIdentityWithA100ServingBaselineClaimed:
    z.literal(false),
  qualityEqualToOrBetterThanA100BaselinePending: z.literal(true),
  everyRunUsedDistinctLaunchResponseOutputAndManifestLineage: z.literal(true),
  everyRunStartedFromAndReturnedToScaleZero: z.literal(true),
  exactThirtyIndexedRunReceiptsReread: z.literal(true),
  terminalCostReceiptCount: z.literal(0),
  terminalCostReceiptCountPending: z.literal(30),
  independentTemporalMaskQualityPending: z.literal(true),
  l4FallbackQualified: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  compiledAt: timestamp,
}).strict().superRefine((value, context) => {
  const ordered = value.runs.every((run, index) =>
    run.runOrdinal === index + 1)
  const distinctRefs = new Set(value.runs.flatMap((run) => [
    refKey(run.runReceiptRef),
    refKey(run.launchRef),
    refKey(run.runtimeResponseRef),
    refKey(run.privateOutputRereadEvidenceRef),
    refKey(run.semanticManifestRef),
    refKey(run.crossAcceleratorMaskComparisonRef),
  ])).size === value.runs.length * 6
  const oneMaskSet = value.runs.every((run) =>
    run.semanticMaskSetDigestSha256 === value.semanticMaskSetDigestSha256)
  const durations = value.runs.map((run) => run.wallTimeMilliseconds)
  const p95 = nearestRankP95(durations)
  if (!ordered || !distinctRefs || !oneMaskSet
    || p95 !== value.nearestRankP95Milliseconds
    || Math.min(...durations) !== value.minimumMeasuredMilliseconds
    || Math.max(...durations) !== value.maximumMeasuredMilliseconds) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 L4 thirty-run evidence is inconsistent.',
    })
  }
})

export const canonicalSam31L4RuntimeThirtyRunQualificationSchema =
  qualificationWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31L4RuntimeThirtyRunQualification = z.infer<
  typeof canonicalSam31L4RuntimeThirtyRunQualificationSchema
>

export function assertCanonicalSam31L4RuntimeThirtyRunQualification(
  value: unknown,
): CanonicalSam31L4RuntimeThirtyRunQualification {
  assertPlainSerializedData(value, 'sam31_l4_thirty_run_qualification')
  const receipt = canonicalSam31L4RuntimeThirtyRunQualificationSchema.parse(
    value,
  )
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 L4 thirty-run receipt hash changed.')
  }
  return receipt
}

export interface CanonicalSam31L4RuntimeThirtyRunQualificationRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31L4RuntimeThirtyRunQualification
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly qualificationSetId: string
  }): Promise<CanonicalSam31L4RuntimeThirtyRunQualification | null>
}

export function createCanonicalSam31L4RuntimeThirtyRunQualificationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31L4RuntimeThirtyRunQualificationRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (qualificationSetId: string) => {
    const id = safeId.parse(qualificationSetId)
    const body = await input.objectPort.readExact(recordPath(prefix, id))
    if (!body) return null
    const receipt = assertCanonicalSam31L4RuntimeThirtyRunQualification(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (receipt.qualificationSetId !== id
      || stableAuthorityStringify(receipt) !== body.toString('utf8')) {
      throw new Error('SAM 3.1 L4 thirty-run receipt exact bytes changed.')
    }
    return structuredClone(receipt)
  }
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_REPOSITORY_VERSION,
    async persistCreateOnly({ receipt: untrusted }: {
      readonly receipt: CanonicalSam31L4RuntimeThirtyRunQualification
    }) {
      const receipt = assertCanonicalSam31L4RuntimeThirtyRunQualification(
        untrusted,
      )
      const body = serialize(receipt)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, receipt.qualificationSetId),
        body,
        contentSha256: hashBytes(body),
      })
      const accepted = await reread(receipt.qualificationSetId)
      if (!accepted || accepted.receiptHash !== receipt.receiptHash) {
        throw new Error('SAM 3.1 L4 thirty-run receipt reread changed.')
      }
      return disposition
    },
    reread({ qualificationSetId }: { readonly qualificationSetId: string }) {
      return reread(qualificationSetId)
    },
  })
}

export function createCanonicalSam31L4RuntimeThirtyRunQualificationService(
  input: {
    readonly runReceiptRepository:
      CanonicalSam31L4RuntimePrivateRunReceiptRepository
    readonly qualificationRepository:
      CanonicalSam31L4RuntimeThirtyRunQualificationRepository
    readonly now?: () => string
  },
) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async compile(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_l4_thirty_run_compile')
      const request = z.object({
        qualificationSetId: safeId,
        qualificationId: safeId,
      }).strict().parse(untrusted)
      const existing = await input.qualificationRepository.reread({
        qualificationSetId: request.qualificationSetId,
      })
      if (existing) return existing
      const receipts: CanonicalSam31L4RuntimePrivateRunReceipt[] = []
      for (let ordinal = 1; ordinal <= 30; ordinal += 1) {
        const receipt = await input.runReceiptRepository.reread({
          qualificationId: request.qualificationId,
          runOrdinal: ordinal,
        })
        if (!receipt) throw new Error(`SAM 3.1 L4 run ${ordinal} is missing.`)
        receipts.push(assertCanonicalSam31L4RuntimePrivateRunReceipt(receipt))
      }
      assertExactSet(request.qualificationId, receipts)
      const durations = receipts.map((receipt) => receipt.wallTimeMilliseconds)
      const first = receipts[0]!
      const runs = receipts.map((receipt) => ({
        runOrdinal: receipt.runOrdinal,
        runReceiptRef: ref(
          `sam31-l4-run-receipt:${receipt.qualificationId}:`
            + String(receipt.runOrdinal).padStart(2, '0'),
          receipt.receiptHash,
        ),
        launchRef: receipt.launchRef,
        runtimeResponseRef: receipt.runtimeResponseRef,
        privateOutputRereadEvidenceRef:
          receipt.privateOutputRereadEvidenceRef,
        semanticManifestRef: receipt.semanticManifestRef,
        crossAcceleratorMaskComparisonRef:
          receipt.crossAcceleratorMaskComparisonRef,
        wallTimeMilliseconds: receipt.wallTimeMilliseconds,
        cudaEventInferenceMilliseconds:
          receipt.cudaEventInferenceMilliseconds,
        semanticMaskSetDigestSha256:
          receipt.semanticMaskSetDigestSha256,
        exactRunReceiptReread: true as const,
        terminalCostPending: true as const,
      }))
      const payload = qualificationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_L4_RUNTIME_THIRTY_RUN_QUALIFICATION_VERSION,
        source:
          'canonical_server_sam3_1_l4_runtime_thirty_run_qualification_owner',
        evidenceClass: 'canonical_private_indexed_run_receipt_exact_reread',
        status: 'ready_for_terminal_cost_and_independent_temporal_quality',
        qualificationSetId: request.qualificationSetId,
        qualificationId: request.qualificationId,
        routeId: 'l4_heavy_fallback',
        accelerator: 'nvidia_l4',
        immutableImageDigest: first.immutableImageDigest,
        qualifiedA100ServingQualificationRef:
          first.qualifiedA100ServingQualificationRef,
        currentL4FallbackRateAuthorityRef:
          first.currentL4FallbackRateAuthorityRef,
        runs,
        semanticMaskSetDigestSha256:
          first.semanticMaskSetDigestSha256,
        deterministicOutputRunCount: 30,
        measuredPerformanceRunCount: 30,
        propagatedFrameCountPerRun: 200,
        losslessMaskPngCountPerRun: 400,
        exactLosslessMaskPngCountAcrossRuns: 12_000,
        nearestRankP95Milliseconds: nearestRankP95(durations),
        minimumMeasuredMilliseconds: Math.min(...durations),
        maximumMeasuredMilliseconds: Math.max(...durations),
        maximumAllowedP95Milliseconds: MAXIMUM_P95_MILLISECONDS,
        allThirtyL4OutputsByteIdenticalToOneAnother: true,
        everyRunCrossAcceleratorPixelComparisonPassed: true,
        semanticMaskSetByteIdentityWithA100ServingBaselineClaimed: false,
        qualityEqualToOrBetterThanA100BaselinePending: true,
        everyRunUsedDistinctLaunchResponseOutputAndManifestLineage: true,
        everyRunStartedFromAndReturnedToScaleZero: true,
        exactThirtyIndexedRunReceiptsReread: true,
        terminalCostReceiptCount: 0,
        terminalCostReceiptCountPending: 30,
        independentTemporalMaskQualityPending: true,
        l4FallbackQualified: false,
        runtimeReleaseGranted: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        compiledAt: timestamp.parse(now()),
      })
      const receipt = assertCanonicalSam31L4RuntimeThirtyRunQualification({
        ...payload,
        receiptHash: sha256AuthorityValue(payload),
      })
      await input.qualificationRepository.persistCreateOnly({ receipt })
      return receipt
    },
  })
}

function assertExactSet(
  qualificationId: string,
  receipts: readonly CanonicalSam31L4RuntimePrivateRunReceipt[],
): void {
  const first = receipts[0]
  const exact = receipts.length === 30 && first !== undefined
    && receipts.every((receipt, index) =>
      receipt.qualificationId === qualificationId
      && receipt.runOrdinal === index + 1
      && receipt.immutableImageDigest === first.immutableImageDigest
      && sameRef(receipt.qualifiedA100ServingQualificationRef,
        first.qualifiedA100ServingQualificationRef)
      && sameRef(receipt.currentL4FallbackRateAuthorityRef,
        first.currentL4FallbackRateAuthorityRef)
      && receipt.semanticMaskSetDigestSha256 ===
        first.semanticMaskSetDigestSha256)
    && unique(receipts.map((receipt) => receipt.receiptHash))
    && unique(receipts.map((receipt) => refKey(receipt.launchRef)))
    && unique(receipts.map((receipt) => refKey(receipt.runtimeResponseRef)))
    && unique(receipts.map((receipt) =>
      refKey(receipt.privateOutputRereadEvidenceRef)))
    && unique(receipts.map((receipt) => refKey(receipt.semanticManifestRef)))
    && unique(receipts.map((receipt) =>
      refKey(receipt.crossAcceleratorMaskComparisonRef)))
  if (!exact) throw new Error('SAM 3.1 L4 thirty-run set is not exact.')
}

function nearestRankP95(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[Math.ceil(ordered.length * 0.95) - 1]!
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: z.infer<typeof evidenceRefSchema>): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function recordPath(prefix: string, qualificationSetId: string) {
  return `${prefix}/${createHash('sha256')
    .update(qualificationSetId, 'utf8').digest('hex')}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 L4 thirty-run receipt bytes are invalid.')
  }
  return body
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('SAM 3.1 L4 thirty-run object port is unavailable.')
  }
}
