import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexServingQualificationResult,
  createCanonicalSam31VertexServingQualificationInvocationRepository,
} from './canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  assertCanonicalSam31VertexServingQualificationOutput,
  createCanonicalSam31VertexServingQualificationOutputRepository,
} from './canonical-sam3_1-vertex-serving-qualification-output-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  createCanonicalSam31GcsServingSemanticManifestRereadPort,
  type CanonicalSam31ServingSemanticManifestEvidence,
} from '../workers/masks/canonical-sam3_1-gcs-serving-semantic-manifest-reader'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_VERTEX_SERVING_THIRTY_RUN_QUALIFICATION_VERSION =
  'canonical-sam3_1-vertex-serving-thirty-run-qualification-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const RECORD_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-thirty-run-qualifications'
const MAXIMUM_P95_MILLISECONDS = 480_000 as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const deterministicRunSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationResultRef: refSchema,
  qualificationOutputRef: refSchema,
  taskRef: refSchema,
  runtimeResponseRef: refSchema,
  manifestRef: refSchema,
  privateOutputRereadEvidenceRef: refSchema,
  semanticMaskSetDigestSha256: sha256,
  providerRoundTripDurationMilliseconds:
    z.number().int().positive().safe().nullable(),
  terminalEvidenceMode: z.enum([
    'provider_prediction_and_private_response',
    'private_response_reconciliation',
  ]),
}).strict()
const performanceRunSchema = z.object({
  measurementOrdinal: z.number().int().min(1).max(30).safe(),
  sourceRunOrdinal: z.number().int().min(1).max(30).safe(),
  replacementForRecoveredRun: z.boolean(),
  invocationId: safeId,
  qualificationResultRef: refSchema,
  qualificationOutputRef: refSchema,
  durationMilliseconds: z.number().int().positive().safe(),
}).strict()

interface CanonicalSam31VertexServingThirtyRunDeterministicRun {
  readonly runOrdinal: number
  readonly invocationId: string
  readonly qualificationResultRef: AuthorityRef
  readonly qualificationOutputRef: AuthorityRef
  readonly taskRef: AuthorityRef
  readonly runtimeResponseRef: AuthorityRef
  readonly manifestRef: AuthorityRef
  readonly privateOutputRereadEvidenceRef: AuthorityRef
  readonly semanticMaskSetDigestSha256: string
  readonly providerRoundTripDurationMilliseconds: number | null
  readonly terminalEvidenceMode:
    | 'provider_prediction_and_private_response'
    | 'private_response_reconciliation'
}

interface CanonicalSam31VertexServingThirtyRunPerformanceRun {
  readonly measurementOrdinal: number
  readonly sourceRunOrdinal: number
  readonly replacementForRecoveredRun: boolean
  readonly invocationId: string
  readonly qualificationResultRef: AuthorityRef
  readonly qualificationOutputRef: AuthorityRef
  readonly durationMilliseconds: number
}

interface AuthorityRef {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}

interface CanonicalSam31VertexServingThirtyRunQualificationWithoutHash {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SERVING_THIRTY_RUN_QUALIFICATION_VERSION
  readonly source:
    'canonical_server_sam3_1_vertex_serving_thirty_run_qualification_owner'
  readonly evidenceClass: 'canonical_private_exact_reread'
  readonly status: 'qualified_for_l4_quality_and_performance_comparison'
  readonly qualificationSetId: string
  readonly deterministicQualificationId: string
  readonly latencyReplacementQualificationId: string
  readonly routeId: 'a100_80gb_heavy_primary'
  readonly accelerator: 'nvidia_a100_80gb'
  readonly immutableImageDigest: string
  readonly deterministicRuns:
    readonly CanonicalSam31VertexServingThirtyRunDeterministicRun[]
  readonly performanceRuns:
    readonly CanonicalSam31VertexServingThirtyRunPerformanceRun[]
  readonly semanticMaskSetDigestSha256: string
  readonly deterministicOutputRunCount: 30
  readonly measuredPerformanceRunCount: 30
  readonly recoveredOutputRunCount: 1
  readonly propagatedFrameCountPerRun: 200
  readonly maskFileCountPerRun: 400
  readonly exactMaskFileCountRereadAcrossDeterministicRuns: 12_000
  readonly nearestRankP95Milliseconds: number
  readonly minimumMeasuredMilliseconds: number
  readonly maximumMeasuredMilliseconds: number
  readonly maximumAllowedP95Milliseconds: typeof MAXIMUM_P95_MILLISECONDS
  readonly allThirtyDeterministicOutputsSemanticallyIdentical: true
  readonly allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true
  readonly recoveredRunExcludedFromLatencyAndReplacedExplicitly: true
  readonly exactTaskResponseOutputManifestAndMaskEvidenceReread: true
  readonly customerInvocationAuthorized: false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly l4FallbackQualified: false
  readonly runtimeReleaseGranted: false
  readonly publicDeliveryAuthorized: false
  readonly productionAuthorityGranted: false
  readonly compiledAt: string
}

export interface CanonicalSam31VertexServingThirtyRunQualification
  extends CanonicalSam31VertexServingThirtyRunQualificationWithoutHash {
  readonly receiptHash: string
}

const receiptWithoutHashBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_THIRTY_RUN_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_thirty_run_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  status: z.literal('qualified_for_l4_quality_and_performance_comparison'),
  qualificationSetId: safeId,
  deterministicQualificationId: safeId,
  latencyReplacementQualificationId: safeId,
  routeId: z.literal('a100_80gb_heavy_primary'),
  accelerator: z.literal('nvidia_a100_80gb'),
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  deterministicRuns: z.array(deterministicRunSchema).length(30),
  performanceRuns: z.array(performanceRunSchema).length(30),
  semanticMaskSetDigestSha256: sha256,
  deterministicOutputRunCount: z.literal(30),
  measuredPerformanceRunCount: z.literal(30),
  recoveredOutputRunCount: z.literal(1),
  propagatedFrameCountPerRun: z.literal(200),
  maskFileCountPerRun: z.literal(400),
  exactMaskFileCountRereadAcrossDeterministicRuns: z.literal(12_000),
  nearestRankP95Milliseconds: z.number().int().positive().safe()
    .max(MAXIMUM_P95_MILLISECONDS),
  minimumMeasuredMilliseconds: z.number().int().positive().safe(),
  maximumMeasuredMilliseconds: z.number().int().positive().safe(),
  maximumAllowedP95Milliseconds: z.literal(MAXIMUM_P95_MILLISECONDS),
  allThirtyDeterministicOutputsSemanticallyIdentical: z.literal(true),
  allThirtyPerformanceMeasurementsUseExactPredictionReceipts: z.literal(true),
  recoveredRunExcludedFromLatencyAndReplacedExplicitly: z.literal(true),
  exactTaskResponseOutputManifestAndMaskEvidenceReread: z.literal(true),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  l4FallbackQualified: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  compiledAt: timestamp,
}).strict()
const receiptWithoutHashSchema = (
  receiptWithoutHashBaseSchema as unknown as z.ZodType<
    CanonicalSam31VertexServingThirtyRunQualificationWithoutHash
  >
).superRefine((value, context) => {
  const deterministicOrder = value.deterministicRuns.every((run, index) =>
    run.runOrdinal === index + 1)
  const performanceOrder = value.performanceRuns.every((run, index) =>
    run.measurementOrdinal === index + 1)
  const deterministicIds = value.deterministicRuns.map((run, index) =>
    run.invocationId ===
      `sam31-a100-qualification:${value.deterministicQualificationId}`
      + `.run-${String(index + 1).padStart(2, '0')}.execution`)
  const replacementId =
    `sam31-a100-qualification:${value.latencyReplacementQualificationId}`
    + '.run-01.execution'
  const exactReplacement = value.performanceRuns[0]
    ?.replacementForRecoveredRun === true
    && value.performanceRuns[0]?.sourceRunOrdinal === 1
    && value.performanceRuns[0]?.invocationId === replacementId
    && value.performanceRuns.slice(1).every((run, index) =>
      !run.replacementForRecoveredRun && run.sourceRunOrdinal === index + 2)
  const exactMeasuredBindings = value.performanceRuns.slice(1).every(
    (run, index) => {
      const source = value.deterministicRuns[index + 1]
      return source !== undefined
        && run.invocationId === source.invocationId
        && run.durationMilliseconds ===
          source.providerRoundTripDurationMilliseconds
        && stableAuthorityStringify(run.qualificationResultRef) ===
          stableAuthorityStringify(source.qualificationResultRef)
        && stableAuthorityStringify(run.qualificationOutputRef) ===
          stableAuthorityStringify(source.qualificationOutputRef)
    },
  )
  const durations = value.performanceRuns.map((run) =>
    run.durationMilliseconds).sort((left, right) => left - right)
  const exactStatistics =
    value.nearestRankP95Milliseconds ===
      durations[Math.ceil(durations.length * 0.95) - 1]
    && value.minimumMeasuredMilliseconds === durations[0]
    && value.maximumMeasuredMilliseconds === durations.at(-1)
  const exactSemanticSet = value.deterministicRuns.every((run) =>
    run.semanticMaskSetDigestSha256 === value.semanticMaskSetDigestSha256)
  if (!deterministicOrder || !performanceOrder || !exactReplacement
    || deterministicIds.some((matches) => !matches)
    || !exactMeasuredBindings || !exactStatistics || !exactSemanticSet
    || value.deterministicRuns[0]?.terminalEvidenceMode !==
      'private_response_reconciliation'
    || value.deterministicRuns[0]
      ?.providerRoundTripDurationMilliseconds !== null
    || !value.deterministicRuns.slice(1).every((run) =>
      run.terminalEvidenceMode ===
        'provider_prediction_and_private_response'
      && run.providerRoundTripDurationMilliseconds !== null)
    || new Set(value.deterministicRuns.map((run) => run.invocationId)).size
      !== 30
    || new Set(value.performanceRuns.map((run) => run.invocationId)).size
      !== 30) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex thirty-run qualification set lost exact membership.',
    })
  }
})
const receiptHashEnvelopeSchema = z.object({
  receiptHash: sha256,
}).passthrough()
export const canonicalSam31VertexServingThirtyRunQualificationSchema =
  Object.freeze({
    parse(value: unknown): CanonicalSam31VertexServingThirtyRunQualification {
      const envelope = receiptHashEnvelopeSchema.parse(value)
      const payloadRecord = { ...envelope }
      delete (payloadRecord as { receiptHash?: string }).receiptHash
      const payload = receiptWithoutHashSchema.parse(payloadRecord)
      return { ...payload, receiptHash: envelope.receiptHash }
    },
  })

export interface CanonicalSam31VertexServingThirtyRunReadPort {
  rereadOne(input: { readonly invocationId: string }): Promise<{
    readonly result: unknown
    readonly output: unknown
    readonly task: unknown
    readonly response: unknown
    readonly outputEvidence: unknown
    readonly semanticManifestEvidence:
      CanonicalSam31ServingSemanticManifestEvidence
  } | null>
}

export interface CanonicalSam31VertexServingThirtyRunRepository {
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31VertexServingThirtyRunQualification
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly qualificationSetId: string }): Promise<unknown>
}

export interface CanonicalSam31VertexServingThirtyRunQualificationService {
  compile(input: unknown): Promise<
    CanonicalSam31VertexServingThirtyRunQualification
  >
}

export function createCanonicalSam31VertexServingThirtyRunQualificationService(
  input: {
    readonly readPort: CanonicalSam31VertexServingThirtyRunReadPort
    readonly repository: CanonicalSam31VertexServingThirtyRunRepository
    readonly now?: () => string
  },
): CanonicalSam31VertexServingThirtyRunQualificationService {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async compile(untrusted: unknown) {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_serving_thirty_run_qualification')
      const request = z.object({
        qualificationSetId: safeId,
        deterministicQualificationId: safeId,
        latencyReplacementQualificationId: safeId,
      }).strict().parse(untrusted)
      const existing = await input.repository.reread({
        qualificationSetId: request.qualificationSetId,
      })
      if (existing !== null) {
        return assertCanonicalSam31VertexServingThirtyRunQualification(existing)
      }
      const deterministicRuns = []
      for (let ordinal = 1; ordinal <= 30; ordinal += 1) {
        deterministicRuns.push(await readAndCompileRun({
          readPort: input.readPort,
          qualificationId: request.deterministicQualificationId,
          runOrdinal: ordinal,
        }))
      }
      const replacement = await readAndCompileRun({
        readPort: input.readPort,
        qualificationId: request.latencyReplacementQualificationId,
        runOrdinal: 1,
      })
      assertDeterministicSet(deterministicRuns, replacement)
      const performanceSources = [replacement, ...deterministicRuns.slice(1)]
      const performanceRuns = performanceSources.map((run, index) => ({
        measurementOrdinal: index + 1,
        sourceRunOrdinal: index === 0 ? 1 : run.runOrdinal,
        replacementForRecoveredRun: index === 0,
        invocationId: run.invocationId,
        qualificationResultRef: run.qualificationResultRef,
        qualificationOutputRef: run.qualificationOutputRef,
        durationMilliseconds: run.providerRoundTripDurationMilliseconds!,
      }))
      const durations = performanceRuns.map((run) =>
        run.durationMilliseconds).sort((left, right) => left - right)
      const p95 = durations[Math.ceil(durations.length * 0.95) - 1]!
      if (p95 > MAXIMUM_P95_MILLISECONDS) {
        throw new Error('Vertex A100 serving p95 exceeded release policy.')
      }
      const payload = receiptWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_THIRTY_RUN_QUALIFICATION_VERSION,
        source:
          'canonical_server_sam3_1_vertex_serving_thirty_run_qualification_owner',
        evidenceClass: 'canonical_private_exact_reread',
        status: 'qualified_for_l4_quality_and_performance_comparison',
        qualificationSetId: request.qualificationSetId,
        deterministicQualificationId: request.deterministicQualificationId,
        latencyReplacementQualificationId:
          request.latencyReplacementQualificationId,
        routeId: 'a100_80gb_heavy_primary',
        accelerator: 'nvidia_a100_80gb',
        immutableImageDigest: deterministicRuns[0]!.immutableImageDigest,
        deterministicRuns: deterministicRuns.map(stripInternal),
        performanceRuns,
        semanticMaskSetDigestSha256:
          deterministicRuns[0]!.semanticMaskSetDigestSha256,
        deterministicOutputRunCount: 30,
        measuredPerformanceRunCount: 30,
        recoveredOutputRunCount: 1,
        propagatedFrameCountPerRun: 200,
        maskFileCountPerRun: 400,
        exactMaskFileCountRereadAcrossDeterministicRuns: 12_000,
        nearestRankP95Milliseconds: p95,
        minimumMeasuredMilliseconds: durations[0],
        maximumMeasuredMilliseconds: durations.at(-1),
        maximumAllowedP95Milliseconds: MAXIMUM_P95_MILLISECONDS,
        allThirtyDeterministicOutputsSemanticallyIdentical: true,
        allThirtyPerformanceMeasurementsUseExactPredictionReceipts: true,
        recoveredRunExcludedFromLatencyAndReplacedExplicitly: true,
        exactTaskResponseOutputManifestAndMaskEvidenceReread: true,
        customerInvocationAuthorized: false,
        customerCreditsMutated: false,
        qaApproved: false,
        l4FallbackQualified: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        compiledAt: timestamp.parse(now()),
      })
      const receipt =
        assertCanonicalSam31VertexServingThirtyRunQualification({
          ...payload,
          receiptHash: sha256AuthorityValue(payload),
        })
      if (await input.repository.persistCreateOnly({ receipt }) !== 'created') {
        throw new Error('Vertex thirty-run qualification receipt collided.')
      }
      const reread =
        assertCanonicalSam31VertexServingThirtyRunQualification(
          await input.repository.reread({
            qualificationSetId: request.qualificationSetId,
          }),
        )
      if (reread.receiptHash !== receipt.receiptHash) {
        throw new Error('Vertex thirty-run qualification receipt changed.')
      }
      return reread
    },
  })
}

export function createCanonicalGcpSam31VertexServingThirtyRunQualificationService(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31VertexServingThirtyRunQualificationService {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
    acceptedReadContentTypes: ['application/json', 'application/octet-stream'],
  })
  const invocationRepository =
    createCanonicalSam31VertexServingQualificationInvocationRepository({
      objectPort: control,
    })
  const outputRepository =
    createCanonicalSam31VertexServingQualificationOutputRepository({
      objectPort: control,
    })
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: privateGpu,
    prefix: TASK_PREFIX,
  })
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: privateGpu,
    prefix: TASK_PREFIX,
  })
  const semanticPort = createCanonicalSam31GcsServingSemanticManifestRereadPort({
    storage,
    projectId: PROJECT_ID,
    bucketName: PRIVATE_GPU_BUCKET,
  })
  return createCanonicalSam31VertexServingThirtyRunQualificationService({
    readPort: {
      async rereadOne({ invocationId }) {
        const [result, output, taskRaw] = await Promise.all([
          invocationRepository.rereadTerminal({ invocationId }),
          outputRepository.reread({ invocationId }),
          taskStore.rereadTask(invocationId),
        ])
        if (!result || !output || !taskRaw) return null
        const task = assertCanonicalSam31GpuTaskRecord(taskRaw)
        const response = assertCanonicalSam31GpuRuntimeResponse({
          request: task.runtimeRequest,
          response: await taskStore.rereadRuntimeResponse(invocationId),
        })
        const acceptedResult =
          assertCanonicalSam31VertexServingQualificationResult(result)
        const acceptedOutput =
          assertCanonicalSam31VertexServingQualificationOutput(output)
        const outputEvidence =
          assertCanonicalSam31PrivateOutputRereadEvidence(
            await resultStore.rereadPrivateOutputRereadEvidence(
              invocationId,
              acceptedOutput.privateOutputRereadEvidenceRef,
            ),
          )
        const semanticManifestEvidence =
          await semanticPort.rereadExactServingSemanticManifest({
            task,
            response,
            outputEvidence,
          })
        return { result: acceptedResult, output: acceptedOutput, task,
          response, outputEvidence, semanticManifestEvidence }
      },
    },
    repository:
      createCanonicalSam31VertexServingThirtyRunQualificationRepository({
        objectPort: control,
      }),
    now: input.now,
  })
}

export function createCanonicalSam31VertexServingThirtyRunQualificationRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexServingThirtyRunRepository {
  const prefix = (input.prefix ?? RECORD_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex thirty-run qualification prefix changed.')
  }
  return Object.freeze({
    async persistCreateOnly({ receipt }: {
      readonly receipt: CanonicalSam31VertexServingThirtyRunQualification
    }) {
      const accepted =
        assertCanonicalSam31VertexServingThirtyRunQualification(receipt)
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${accepted.qualificationSetId}/receipt.json`,
        body,
        contentSha256: rawSha256(body),
      })
    },
    async reread({ qualificationSetId }: {
      readonly qualificationSetId: string
    }) {
      const id = safeId.parse(qualificationSetId)
      const body = await input.objectPort.readExact(
        `${prefix}/${id}/receipt.json`,
      )
      if (!body) return null
      const accepted =
        assertCanonicalSam31VertexServingThirtyRunQualification(
          JSON.parse(body.toString('utf8')) as unknown,
        )
      if (accepted.qualificationSetId !== id
        || stableAuthorityStringify(accepted) !== body.toString('utf8')) {
        throw new Error('Vertex thirty-run qualification bytes changed.')
      }
      return structuredClone(accepted)
    },
  })
}

export function assertCanonicalSam31VertexServingThirtyRunQualification(
  value: unknown,
): CanonicalSam31VertexServingThirtyRunQualification {
  assertPlainSerializedData(value, 'sam31_vertex_serving_thirty_run_receipt')
  const parsed = canonicalSam31VertexServingThirtyRunQualificationSchema.parse(
    value,
  )
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex thirty-run qualification hash changed.')
  }
  return parsed
}

async function readAndCompileRun(input: {
  readPort: CanonicalSam31VertexServingThirtyRunReadPort
  qualificationId: string
  runOrdinal: number
}) {
  const invocationId = `sam31-a100-qualification:${input.qualificationId}`
    + `.run-${String(input.runOrdinal).padStart(2, '0')}.execution`
  const record = await input.readPort.rereadOne({ invocationId })
  if (!record) throw new Error(`Vertex serving run ${input.runOrdinal} missing.`)
  const result = assertCanonicalSam31VertexServingQualificationResult(
    record.result,
  )
  const output = assertCanonicalSam31VertexServingQualificationOutput(
    record.output,
  )
  const task = assertCanonicalSam31GpuTaskRecord(record.task)
  const response = assertCanonicalSam31GpuRuntimeResponse({
    request: task.runtimeRequest,
    response: record.response,
  })
  const evidence = assertCanonicalSam31PrivateOutputRereadEvidence(
    record.outputEvidence,
  )
  const semantic = record.semanticManifestEvidence
  const resultRef = ref(
    `sam31-vertex-qualification-result:${invocationId}`,
    result.resultHash,
  )
  const outputRef = ref(
    `sam31-vertex-qualification-output:${invocationId}`,
    output.outputHash,
  )
  if (result.qualificationId !== input.qualificationId
    || result.runOrdinal !== input.runOrdinal
    || result.invocationId !== invocationId
    || result.disposition !== 'completed'
    || result.runtimeStatus !== 'completed'
    || result.providerOutcome !== 'executed'
    || !result.exactPrivateRuntimeResponseReread
    || output.invocationId !== invocationId
    || stableAuthorityStringify(output.qualificationResultRef) !==
      stableAuthorityStringify(resultRef)
    || stableAuthorityStringify(output.taskRef) !==
      stableAuthorityStringify(ref(task.taskId, task.taskRecordHash))
    || stableAuthorityStringify(output.privateOutputRereadEvidenceRef) !==
      stableAuthorityStringify(ref(
        `sam31-private-output-reread:${evidence.runtimeResponseObjectRef.id}`,
        evidence.evidenceHash,
      ))
    || stableAuthorityStringify(output.manifestRef) !==
      stableAuthorityStringify(response.outputSummary!.manifestRef)
    || semantic.semanticMaskSetDigestSha256.length !== 64
    || semantic.propagatedFrameCount !== 200
    || semantic.maskFileCount !== 400
    || output.propagatedFrameCount !== 200
    || output.maskFileCount !== 400
    || task.runtimeRequest.dispatch.routeRole !== 'a100_80gb_heavy_primary'
    || task.runtimeRequest.dispatch.accelerator !== 'nvidia_a100_80gb'
    || response.gpuEvidence?.cpuOnlyInferenceUsed !== false
    || !response.gpuEvidence.cudaKernelExecutionMeasured
    || !response.gpuEvidence.nvdecHardwareDecodeMeasured
    || !response.gpuEvidence.bfloat16AutocastUsed) {
    throw new Error(`Vertex serving run ${input.runOrdinal} lineage changed.`)
  }
  return {
    runOrdinal: input.runOrdinal,
    invocationId,
    qualificationResultRef: resultRef,
    qualificationOutputRef: outputRef,
    taskRef: output.taskRef,
    runtimeResponseRef: output.runtimeResponseRef,
    manifestRef: output.manifestRef,
    privateOutputRereadEvidenceRef: output.privateOutputRereadEvidenceRef,
    semanticMaskSetDigestSha256: semantic.semanticMaskSetDigestSha256,
    providerRoundTripDurationMilliseconds:
      result.providerRoundTripDurationMilliseconds,
    terminalEvidenceMode: result.terminalEvidenceMode,
    immutableImageDigest:
      task.runtimeRequest.modelArtifacts.immutableImageDigest,
  }
}

function assertDeterministicSet(
  runs: ReadonlyArray<Awaited<ReturnType<typeof readAndCompileRun>>>,
  replacement: Awaited<ReturnType<typeof readAndCompileRun>>,
): void {
  const first = runs[0]!
  if (runs.length !== 30
    || first.terminalEvidenceMode !== 'private_response_reconciliation'
    || first.providerRoundTripDurationMilliseconds !== null
    || runs.slice(1).some((run) =>
      run.terminalEvidenceMode !==
        'provider_prediction_and_private_response'
      || run.providerRoundTripDurationMilliseconds === null)
    || runs.some((run, index) => run.runOrdinal !== index + 1
      || run.semanticMaskSetDigestSha256 !==
        first.semanticMaskSetDigestSha256
      || run.immutableImageDigest !== first.immutableImageDigest)
    || replacement.semanticMaskSetDigestSha256 !==
      first.semanticMaskSetDigestSha256
    || replacement.immutableImageDigest !== first.immutableImageDigest
    || replacement.terminalEvidenceMode !==
      'provider_prediction_and_private_response'
    || replacement.providerRoundTripDurationMilliseconds === null) {
    throw new Error('Vertex serving deterministic or replacement set changed.')
  }
}

function stripInternal(run: Awaited<ReturnType<typeof readAndCompileRun>>) {
  const record = { ...run }
  delete (record as { immutableImageDigest?: string }).immutableImageDigest
  return record
}

function ref(id: string, hash: string) {
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
