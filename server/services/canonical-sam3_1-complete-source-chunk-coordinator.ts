import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  TrackAllSam31AuthenticatedGpuInvocationResult,
} from '../../src/types/track-all-sam3_1-gpu-invocation'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  buildTrackAllSam31AuthenticatedGpuInvocationRequest,
  parseTrackAllSam31AuthenticatedGpuInvocationResult,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultStore,
  type CanonicalSam31PrivateOutputRereadEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_PLAN_VERSION =
  'canonical-sam3_1-complete-source-chunk-plan-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_RECEIPT_VERSION =
  'canonical-sam3_1-complete-source-chunk-receipt-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_COORDINATOR_VERSION =
  'canonical-sam3_1-complete-source-chunk-coordinator-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/complete-source-groups'
const CHUNK_FRAME_COUNT = 240
const CHUNK_OVERLAP_FRAME_COUNT = 1
const CHUNK_STRIDE_FRAME_COUNT = 239
const MAXIMUM_CHUNKS = 256
const MAXIMUM_SOURCE_FRAMES = CHUNK_FRAME_COUNT
  + (MAXIMUM_CHUNKS - 1) * CHUNK_STRIDE_FRAME_COUNT
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeRefId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const refSchema = z.object({
  id: safeRefId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const chunkSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(MAXIMUM_CHUNKS),
  canonicalStartFrameInclusive: nonnegativeInteger,
  canonicalEndFrameInclusive: nonnegativeInteger,
  overlapWithPreviousFrames: z.union([
    z.literal(0), z.literal(CHUNK_OVERLAP_FRAME_COUNT),
  ]),
  requestId: safeId,
  workItemKey: safeId,
}).strict()

const planWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_PLAN_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_complete_source_chunk_plan_owner',
  ),
  evidenceClass: z.literal('canonical_approved_complete_source_scope'),
  executionGroupId: safeId,
  ownerUserId: safeId,
  workspaceId: safeId,
  approvedSnapshotRef: refSchema,
  exactSourceRef: refSchema,
  sourceBindingRef: refSchema,
  masterTimingRef: refSchema,
  compiledSubjectIntentRef: refSchema,
  chunkPlanRef: refSchema,
  sourceFrameCount: positiveInteger.max(MAXIMUM_SOURCE_FRAMES),
  fpsNumerator: positiveInteger.max(240_000),
  fpsDenominator: positiveInteger.max(1_001_000),
  chunkFrameCount: z.literal(CHUNK_FRAME_COUNT),
  chunkOverlapFrameCount: z.literal(CHUNK_OVERLAP_FRAME_COUNT),
  chunkStrideFrameCount: z.literal(CHUNK_STRIDE_FRAME_COUNT),
  exactChunkCount: z.number().int().min(1).max(MAXIMUM_CHUNKS),
  chunks: z.array(chunkSchema).min(1).max(MAXIMUM_CHUNKS),
  userTriggeredAfterApprovedPlanRequired: z.literal(true),
  sequentialExactPrivateOutputRereadBeforeNextChunkRequired: z.literal(true),
  automaticProviderRetryAllowed: z.literal(false),
  callerChunkGeometryGpuRouteModelImageCommandOrPriceAccepted:
    z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  plannedAt: timestamp,
}).strict().superRefine((plan, context) => {
  if (!exactPlanGeometry(plan)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-source chunk geometry is inconsistent.',
  })
})
export const canonicalSam31CompleteSourceChunkPlanSchema =
  planWithoutHashSchema.extend({ planHash: sha256 }).strict()
    .superRefine((plan, context) => {
      if (!exactPlanGeometry(plan)) context.addIssue({
        code: 'custom',
        message: 'SAM 3.1 complete-source chunk geometry is inconsistent.',
      })
    })
export type CanonicalSam31CompleteSourceChunkPlan = z.infer<
  typeof canonicalSam31CompleteSourceChunkPlanSchema
>

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_complete_source_chunk_coordinator',
  ),
  evidenceClass: z.literal('canonical_private_exact_output_reread'),
  executionGroupRef: refSchema,
  chunkOrdinal: z.number().int().min(1).max(MAXIMUM_CHUNKS),
  canonicalStartFrameInclusive: nonnegativeInteger,
  canonicalEndFrameInclusive: nonnegativeInteger,
  overlapWithPreviousFrames: z.union([
    z.literal(0), z.literal(CHUNK_OVERLAP_FRAME_COUNT),
  ]),
  requestRef: refSchema,
  endpointInvocationResultRef: refSchema,
  executionAttemptRef: refSchema,
  runtimeResponseRef: refSchema,
  taskRef: refSchema,
  privateOutputRereadEvidenceRef: refSchema,
  manifestRef: refSchema,
  maskSequenceArtifactRef: refSchema,
  sourceFrameMappingRef: refSchema,
  previousChunkReceiptRef: refSchema.nullable(),
  providerOutcome: z.literal('executed'),
  runtimeStatus: z.literal('completed'),
  exactApprovedTaskAndRuntimeResponseReread: z.literal(true),
  exactManifestAndEveryMaskByteReread: z.literal(true),
  exactCanonicalSourceRangeMappingVerified: z.literal(true),
  previousOverlapBoundarySourceRereadWhenRequired: z.literal(true),
  nextChunkMayStart: z.literal(true),
  automaticProviderRetryStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  assetManifestMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  completedAt: timestamp,
}).strict()
export const canonicalSam31CompleteSourceChunkReceiptSchema =
  receiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31CompleteSourceChunkReceipt = z.infer<
  typeof canonicalSam31CompleteSourceChunkReceiptSchema
>

export interface CanonicalSam31CompleteSourceChunkRepository {
  readonly schemaVersion:
    'canonical-sam3_1-complete-source-chunk-repository-v1'
  persistPlanCreateOnly(input: {
    readonly plan: CanonicalSam31CompleteSourceChunkPlan
  }): Promise<'created' | 'identical_replay'>
  rereadPlan(input: {
    readonly executionGroupRef: EvidenceRef
  }): Promise<CanonicalSam31CompleteSourceChunkPlan | null>
  persistChunkReceiptCreateOnly(input: {
    readonly receipt: CanonicalSam31CompleteSourceChunkReceipt
  }): Promise<'created' | 'identical_replay'>
  rereadChunkReceipt(input: {
    readonly executionGroupId: string
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31CompleteSourceChunkReceipt | null>
}

export interface CanonicalSam31CurrentServingPrivateOutputRereadPort {
  rereadExactCurrentServingPrivateOutput(input: {
    readonly task: CanonicalSam31GpuTaskRecord
    readonly response: CanonicalSam31GpuRuntimeResponse
    readonly invocationResult: TrackAllSam31AuthenticatedGpuInvocationResult
  }): Promise<CanonicalSam31PrivateOutputRereadEvidence>
}

export interface CanonicalSam31CompleteSourceChunkAdvanceResult {
  readonly schemaVersion:
    'canonical-sam3_1-complete-source-chunk-advance-result-v1'
  readonly executionGroupRef: EvidenceRef
  readonly disposition:
    | 'chunk_completed_more_pending'
    | 'complete_source_execution_ready'
    | 'blocked_attempt_failed'
    | 'blocked_not_executed_scale_from_zero'
    | 'blocked_unknown_requires_reconciliation'
  readonly completedChunkCount: number
  readonly exactChunkCount: number
  readonly nextChunkOrdinal: number | null
  readonly latestChunkReceiptRef: EvidenceRef | null
  readonly invocationRuntimeCalledByCoordinator: boolean
  readonly automaticProviderRetryStarted: false
  readonly customerCreditsMutated: false
  readonly qaApproved: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalSam31CompleteSourceChunkCoordinator {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_COORDINATOR_VERSION
  readonly exactOverlapFrames: 1
  readonly maximumChunkFrames: 240
  readonly oneChunkAdvancedPerCall: true
  readonly restartSafeCreateOnlyReplay: true
  readonly directGpuOrProviderPortExposed: false
  advance(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly executionGroupRef: EvidenceRef
  }): Promise<CanonicalSam31CompleteSourceChunkAdvanceResult>
}

export function buildCanonicalSam31CompleteSourceChunkPlan(input: {
  readonly executionGroupId: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly approvedSnapshotRef: EvidenceRef
  readonly exactSourceRef: EvidenceRef
  readonly sourceBindingRef: EvidenceRef
  readonly masterTimingRef: EvidenceRef
  readonly compiledSubjectIntentRef: EvidenceRef
  readonly sourceFrameCount: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly workItems: ReadonlyArray<{
    readonly requestId: string
    readonly workItemKey: string
  }>
  readonly plannedAt: string
}): CanonicalSam31CompleteSourceChunkPlan {
  assertPlainSerializedData(input, 'sam31_complete_source_chunk_plan_input')
  const sourceFrameCount = positiveInteger.max(MAXIMUM_SOURCE_FRAMES)
    .parse(input.sourceFrameCount)
  const exactChunkCount = deriveChunkCount(sourceFrameCount)
  if (input.workItems.length !== exactChunkCount) {
    throw new TypeError(
      'SAM 3.1 complete-source work set does not cover every chunk.',
    )
  }
  const chunks = input.workItems.map((workItem, index) => {
    const start = index * CHUNK_STRIDE_FRAME_COUNT
    return chunkSchema.parse({
      chunkOrdinal: index + 1,
      canonicalStartFrameInclusive: start,
      canonicalEndFrameInclusive: Math.min(
        sourceFrameCount - 1,
        start + CHUNK_FRAME_COUNT - 1,
      ),
      overlapWithPreviousFrames: index === 0
        ? 0 : CHUNK_OVERLAP_FRAME_COUNT,
      requestId: workItem.requestId,
      workItemKey: workItem.workItemKey,
    })
  })
  const chunkPlanRef = ref(
    `${input.executionGroupId}:chunk-plan`,
    sha256AuthorityValue({
      domain: 'canonical_sam3_1_complete_source_chunk_geometry_v1',
      exactSourceRef: input.exactSourceRef,
      sourceFrameCount,
      chunkFrameCount: CHUNK_FRAME_COUNT,
      chunkOverlapFrameCount: CHUNK_OVERLAP_FRAME_COUNT,
      chunkStrideFrameCount: CHUNK_STRIDE_FRAME_COUNT,
      chunks: chunks.map((chunk) => ({
        chunkOrdinal: chunk.chunkOrdinal,
        canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
        canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
        overlapWithPreviousFrames: chunk.overlapWithPreviousFrames,
      })),
    }),
  )
  const payload = planWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_PLAN_VERSION,
    source: 'canonical_server_sam3_1_complete_source_chunk_plan_owner',
    evidenceClass: 'canonical_approved_complete_source_scope',
    executionGroupId: input.executionGroupId,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    approvedSnapshotRef: input.approvedSnapshotRef,
    exactSourceRef: input.exactSourceRef,
    sourceBindingRef: input.sourceBindingRef,
    masterTimingRef: input.masterTimingRef,
    compiledSubjectIntentRef: input.compiledSubjectIntentRef,
    chunkPlanRef,
    sourceFrameCount,
    fpsNumerator: input.fpsNumerator,
    fpsDenominator: input.fpsDenominator,
    chunkFrameCount: CHUNK_FRAME_COUNT,
    chunkOverlapFrameCount: CHUNK_OVERLAP_FRAME_COUNT,
    chunkStrideFrameCount: CHUNK_STRIDE_FRAME_COUNT,
    exactChunkCount,
    chunks,
    userTriggeredAfterApprovedPlanRequired: true,
    sequentialExactPrivateOutputRereadBeforeNextChunkRequired: true,
    automaticProviderRetryAllowed: false,
    callerChunkGeometryGpuRouteModelImageCommandOrPriceAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    plannedAt: input.plannedAt,
  })
  return freeze(canonicalSam31CompleteSourceChunkPlanSchema.parse({
    ...payload,
    planHash: sha256AuthorityValue(payload),
  }))
}

export function parseCanonicalSam31CompleteSourceChunkPlan(
  value: unknown,
): CanonicalSam31CompleteSourceChunkPlan {
  assertPlainSerializedData(value, 'sam31_complete_source_chunk_plan')
  rejectUnsafeText(value, 'SAM 3.1 complete-source chunk plan')
  const plan = canonicalSam31CompleteSourceChunkPlanSchema.parse(value)
  const { planHash, ...payload } = plan
  if (planHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 complete-source chunk plan digest changed.')
  }
  return freeze(plan)
}

export function parseCanonicalSam31CompleteSourceChunkReceipt(
  value: unknown,
): CanonicalSam31CompleteSourceChunkReceipt {
  assertPlainSerializedData(value, 'sam31_complete_source_chunk_receipt')
  rejectUnsafeText(value, 'SAM 3.1 complete-source chunk receipt')
  const receipt = canonicalSam31CompleteSourceChunkReceiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 complete-source chunk receipt digest changed.')
  }
  return freeze(receipt)
}

export function canonicalSam31CompleteSourceChunkPlanRef(
  plan: CanonicalSam31CompleteSourceChunkPlan,
): EvidenceRef {
  const parsed = parseCanonicalSam31CompleteSourceChunkPlan(plan)
  return ref(parsed.executionGroupId, parsed.planHash)
}

export function canonicalSam31CompleteSourceChunkReceiptRef(
  receipt: CanonicalSam31CompleteSourceChunkReceipt,
): EvidenceRef {
  const parsed = parseCanonicalSam31CompleteSourceChunkReceipt(receipt)
  return ref(
    `${parsed.executionGroupRef.id}:chunk:${String(parsed.chunkOrdinal)
      .padStart(3, '0')}`,
    parsed.receiptHash,
  )
}

export function createCanonicalSam31CompleteSourceChunkRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31CompleteSourceChunkRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31CompleteSourceChunkRepository = {
    schemaVersion:
      'canonical-sam3_1-complete-source-chunk-repository-v1' as const,
    persistPlanCreateOnly: ({ plan }) => persistExact({
      objectPort: input.objectPort,
      objectPath: planPath(prefix, plan.executionGroupId),
      value: parseCanonicalSam31CompleteSourceChunkPlan(plan),
      parser: parseCanonicalSam31CompleteSourceChunkPlan,
    }),
    async rereadPlan({ executionGroupRef }) {
      const parsedRef = refSchema.parse(executionGroupRef)
      const plan = await readExact({
        objectPort: input.objectPort,
        objectPath: planPath(prefix, parsedRef.id),
        parser: parseCanonicalSam31CompleteSourceChunkPlan,
      })
      if (plan && !sameRef(canonicalSam31CompleteSourceChunkPlanRef(plan),
        parsedRef)) throw new Error('SAM 3.1 execution-group plan ref changed.')
      return plan
    },
    persistChunkReceiptCreateOnly: ({ receipt }) => persistExact({
      objectPort: input.objectPort,
      objectPath: receiptPath(
        prefix,
        receipt.executionGroupRef.id,
        receipt.chunkOrdinal,
      ),
      value: parseCanonicalSam31CompleteSourceChunkReceipt(receipt),
      parser: parseCanonicalSam31CompleteSourceChunkReceipt,
    }),
    rereadChunkReceipt({ executionGroupId, chunkOrdinal }) {
      return readExact({
        objectPort: input.objectPort,
        objectPath: receiptPath(prefix, safeId.parse(executionGroupId),
          z.number().int().min(1).max(MAXIMUM_CHUNKS).parse(chunkOrdinal)),
        parser: parseCanonicalSam31CompleteSourceChunkReceipt,
      })
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31CompleteSourceChunkCoordinator(input: {
  readonly repository: CanonicalSam31CompleteSourceChunkRepository
  readonly invocationRuntime:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort
  readonly taskStore: Pick<
    CanonicalSam31GpuTaskStore, 'rereadTask' | 'rereadRuntimeResponse'
  >
  readonly resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore,
    'persistPrivateOutputRereadEvidenceCreateOnly'
      | 'rereadPrivateOutputRereadEvidenceForInvocation'
  >
  readonly privateOutputRereadPort:
    CanonicalSam31CurrentServingPrivateOutputRereadPort
  readonly now?: () => string
}): CanonicalSam31CompleteSourceChunkCoordinator {
  assertCoordinatorPorts(input)
  const now = input.now ?? (() => new Date().toISOString())
  const coordinator: CanonicalSam31CompleteSourceChunkCoordinator = {
    schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_COORDINATOR_VERSION,
    exactOverlapFrames: 1 as const,
    maximumChunkFrames: 240 as const,
    oneChunkAdvancedPerCall: true as const,
    restartSafeCreateOnlyReplay: true as const,
    directGpuOrProviderPortExposed: false as const,
    async advance(untrusted) {
      assertPlainSerializedData(untrusted,
        'sam31_complete_source_chunk_advance')
      const request = z.object({
        authenticatedOwnerUserId: safeId,
        workspaceId: safeId,
        executionGroupRef: refSchema,
      }).strict().parse(untrusted)
      const plan = await input.repository.rereadPlan({
        executionGroupRef: request.executionGroupRef,
      })
      if (!plan || plan.ownerUserId !== request.authenticatedOwnerUserId
        || plan.workspaceId !== request.workspaceId) {
        throw new Error('SAM 3.1 complete-source execution scope differs.')
      }
      const receipts = await rereadReceiptPrefix(input.repository, plan)
      if (receipts.length === plan.exactChunkCount) {
        return advanceResult(plan, receipts,
          'complete_source_execution_ready', false)
      }
      const chunk = plan.chunks[receipts.length]!
      const prior = receipts.at(-1) ?? null
      assertPriorBoundary(plan, chunk, prior)
      const invocationRequest =
        buildTrackAllSam31AuthenticatedGpuInvocationRequest({
          requestId: chunk.requestId,
          approvedSnapshotId: plan.approvedSnapshotRef.id,
          workItemKey: chunk.workItemKey,
        })
      const invocationResult =
        parseTrackAllSam31AuthenticatedGpuInvocationResult(
          await input.invocationRuntime.invokeApprovedTrackAllWork({
            authenticatedOwnerUserId: plan.ownerUserId,
            workspaceId: plan.workspaceId,
            idempotencyKey: chunk.requestId,
            request: invocationRequest,
          }),
        )
      assertInvocationScope(plan, chunk, invocationRequest, invocationResult)
      if (invocationResult.invocationDisposition !== 'completed') {
        return advanceResult(plan, receipts,
          blockedDisposition(invocationResult), true)
      }
      const invocationId = invocationResult.endpointInvocationResultRef.id
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(invocationId),
      )
      assertTaskScope(plan, chunk, invocationResult, task)
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: await input.taskStore.rereadRuntimeResponse(invocationId),
      })
      assertResponseScope(invocationResult, response)
      let output = await input.resultStore
        .rereadPrivateOutputRereadEvidenceForInvocation(invocationId)
      if (output === null) {
        const candidate = assertCanonicalSam31PrivateOutputRereadEvidence(
          await input.privateOutputRereadPort
            .rereadExactCurrentServingPrivateOutput({
              task,
              response,
              invocationResult,
            }),
        )
        await input.resultStore.persistPrivateOutputRereadEvidenceCreateOnly(
          invocationId,
          candidate,
        )
        output = await input.resultStore
          .rereadPrivateOutputRereadEvidenceForInvocation(invocationId)
      }
      const exactOutput = assertCanonicalSam31PrivateOutputRereadEvidence(
        output,
      )
      assertOutputScope(task, response, exactOutput)
      const completedAt = timestamp.parse(now())
      const receipt = buildReceipt({
        plan,
        chunk,
        prior,
        invocationResult,
        task,
        output: exactOutput,
        completedAt,
      })
      await input.repository.persistChunkReceiptCreateOnly({ receipt })
      const reread = await input.repository.rereadChunkReceipt({
        executionGroupId: plan.executionGroupId,
        chunkOrdinal: chunk.chunkOrdinal,
      })
      if (!reread || reread.receiptHash !== receipt.receiptHash) {
        throw new Error('SAM 3.1 chunk receipt exact reread changed.')
      }
      const nextReceipts = [...receipts, reread]
      return advanceResult(
        plan,
        nextReceipts,
        nextReceipts.length === plan.exactChunkCount
          ? 'complete_source_execution_ready'
          : 'chunk_completed_more_pending',
        true,
      )
    },
  }
  return Object.freeze(coordinator)
}

function buildReceipt(input: {
  plan: CanonicalSam31CompleteSourceChunkPlan
  chunk: z.infer<typeof chunkSchema>
  prior: CanonicalSam31CompleteSourceChunkReceipt | null
  invocationResult: TrackAllSam31AuthenticatedGpuInvocationResult
  task: CanonicalSam31GpuTaskRecord
  output: CanonicalSam31PrivateOutputRereadEvidence
  completedAt: string
}): CanonicalSam31CompleteSourceChunkReceipt {
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_CHUNK_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_complete_source_chunk_coordinator',
    evidenceClass: 'canonical_private_exact_output_reread',
    executionGroupRef: canonicalSam31CompleteSourceChunkPlanRef(input.plan),
    chunkOrdinal: input.chunk.chunkOrdinal,
    canonicalStartFrameInclusive: input.chunk.canonicalStartFrameInclusive,
    canonicalEndFrameInclusive: input.chunk.canonicalEndFrameInclusive,
    overlapWithPreviousFrames: input.chunk.overlapWithPreviousFrames,
    requestRef: input.invocationResult.requestRef,
    endpointInvocationResultRef:
      input.invocationResult.endpointInvocationResultRef,
    executionAttemptRef: input.invocationResult.executionAttemptRef,
    runtimeResponseRef: input.invocationResult.runtimeResponseRef,
    taskRef: ref(input.task.taskId, input.task.taskRecordHash),
    privateOutputRereadEvidenceRef: privateOutputRef(input.output),
    manifestRef: input.output.manifestRef,
    maskSequenceArtifactRef: input.output.maskSequenceArtifactRef,
    sourceFrameMappingRef:
      input.task.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
    previousChunkReceiptRef: input.prior
      ? canonicalSam31CompleteSourceChunkReceiptRef(input.prior) : null,
    providerOutcome: 'executed',
    runtimeStatus: 'completed',
    exactApprovedTaskAndRuntimeResponseReread: true,
    exactManifestAndEveryMaskByteReread: true,
    exactCanonicalSourceRangeMappingVerified: true,
    previousOverlapBoundarySourceRereadWhenRequired: true,
    nextChunkMayStart: true,
    automaticProviderRetryStarted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    assetManifestMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    completedAt: input.completedAt,
  })
  return freeze(canonicalSam31CompleteSourceChunkReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  }))
}

async function rereadReceiptPrefix(
  repository: CanonicalSam31CompleteSourceChunkRepository,
  plan: CanonicalSam31CompleteSourceChunkPlan,
): Promise<CanonicalSam31CompleteSourceChunkReceipt[]> {
  const values = await Promise.all(plan.chunks.map((chunk) =>
    repository.rereadChunkReceipt({
      executionGroupId: plan.executionGroupId,
      chunkOrdinal: chunk.chunkOrdinal,
    })))
  const firstMissing = values.findIndex((value) => value === null)
  const prefixLength = firstMissing < 0 ? values.length : firstMissing
  if (values.slice(prefixLength).some((value) => value !== null)) {
    throw new Error('SAM 3.1 chunk receipt sequence contains a gap.')
  }
  const receipts = values.slice(0, prefixLength).map((value, index) => {
    const receipt = parseCanonicalSam31CompleteSourceChunkReceipt(value)
    const chunk = plan.chunks[index]!
    const previous = index === 0 ? null : values[index - 1]!
    if (!sameRef(receipt.executionGroupRef,
      canonicalSam31CompleteSourceChunkPlanRef(plan))
      || receipt.chunkOrdinal !== chunk.chunkOrdinal
      || receipt.canonicalStartFrameInclusive !==
        chunk.canonicalStartFrameInclusive
      || receipt.canonicalEndFrameInclusive !==
        chunk.canonicalEndFrameInclusive
      || receipt.overlapWithPreviousFrames !==
        chunk.overlapWithPreviousFrames
      || !sameNullableRef(receipt.previousChunkReceiptRef,
        previous
          ? canonicalSam31CompleteSourceChunkReceiptRef(previous) : null)) {
      throw new Error('SAM 3.1 chunk receipt crossed execution lineage.')
    }
    return receipt
  })
  return receipts
}

function assertPriorBoundary(
  plan: CanonicalSam31CompleteSourceChunkPlan,
  chunk: z.infer<typeof chunkSchema>,
  prior: CanonicalSam31CompleteSourceChunkReceipt | null,
): void {
  const exact = chunk.chunkOrdinal === 1
    ? prior === null && chunk.overlapWithPreviousFrames === 0
    : prior !== null
      && prior.chunkOrdinal === chunk.chunkOrdinal - 1
      && chunk.overlapWithPreviousFrames === CHUNK_OVERLAP_FRAME_COUNT
      && prior.canonicalEndFrameInclusive ===
        chunk.canonicalStartFrameInclusive
      && sameRef(prior.executionGroupRef,
        canonicalSam31CompleteSourceChunkPlanRef(plan))
  if (!exact) throw new Error('SAM 3.1 prior chunk boundary is incomplete.')
}

function assertInvocationScope(
  plan: CanonicalSam31CompleteSourceChunkPlan,
  chunk: z.infer<typeof chunkSchema>,
  request: ReturnType<
    typeof buildTrackAllSam31AuthenticatedGpuInvocationRequest
  >,
  result: TrackAllSam31AuthenticatedGpuInvocationResult,
): void {
  const exact = result.workspaceId === plan.workspaceId
    && result.approvedSnapshotId === plan.approvedSnapshotRef.id
    && result.workItemKey === chunk.workItemKey
    && sameRef(result.requestRef,
      ref(request.requestId, request.requestDigestSha256))
    && result.routeId === 'a100_80gb_heavy_primary'
    && result.accelerator === 'nvidia_a100_80gb'
    && result.userTriggeredScaleFromZero
    && result.currentDedicatedEndpointInvocation
    && !result.historicalCloudJobCustomerDispatchUsed
    && result.currentEndpointReadinessRereadBeforeInvocation
    && result.approvedSourceMaterialRereadByCanonicalServer
    && result.fundedPricingReservationAndAttemptRereadBeforeInvocation
    && result.accountEffectiveServingRateRereadBeforeInvocation
    && !result.automaticRetryAllowed
    && result.canonicalServingWindowUsageCostAndCreditSettlementPending
    && !result.customerCreditsMutated
    && !result.qaApproved
    && !result.productionAuthorityGranted
  if (!exact) throw new Error('SAM 3.1 chunk invocation scope changed.')
}

function assertTaskScope(
  plan: CanonicalSam31CompleteSourceChunkPlan,
  chunk: z.infer<typeof chunkSchema>,
  result: TrackAllSam31AuthenticatedGpuInvocationResult,
  task: CanonicalSam31GpuTaskRecord,
): void {
  const runtime = task.runtimeRequest
  const source = runtime.sourceMedia
  const exact = task.invocationId === result.endpointInvocationResultRef.id
    && task.executionEnvelopeRef.id === task.invocationId
    && runtime.scope.ownerUserId === plan.ownerUserId
    && runtime.scope.workspaceId === plan.workspaceId
    && runtime.scope.approvedPlanSnapshotId === plan.approvedSnapshotRef.id
    && runtime.scope.approvedPlanSnapshotHash ===
      stripSha(plan.approvedSnapshotRef.contentHash)
    && sameRef(runtime.scope.executionAttemptRef,
      result.executionAttemptRef)
    && sameRef(runtime.scope.masterTimingRef, plan.masterTimingRef)
    && sameRef(runtime.scope.sourceBindingRef, plan.sourceBindingRef)
    && sameRef(runtime.approvedPrompt.compiledIntentRef,
      plan.compiledSubjectIntentRef)
    && sameRef(source.finalizedSourceArtifactRef, plan.exactSourceRef)
    && sameRef(source.boundedChunkOverlapAndStitchPlanRef,
      plan.chunkPlanRef)
    && source.canonicalSourceStartFrameInclusive ===
      chunk.canonicalStartFrameInclusive
    && source.canonicalSourceEndFrameInclusive ===
      chunk.canonicalEndFrameInclusive
    && source.decodedFrameCount ===
      chunk.canonicalEndFrameInclusive - chunk.canonicalStartFrameInclusive + 1
    && source.selectedStartFrameInclusive === 0
    && source.selectedEndFrameInclusive === source.decodedFrameCount - 1
    && source.fpsNumerator === plan.fpsNumerator
    && source.fpsDenominator === plan.fpsDenominator
  if (!exact) throw new Error('SAM 3.1 chunk task differs from its plan.')
}

function assertResponseScope(
  result: TrackAllSam31AuthenticatedGpuInvocationResult,
  response: CanonicalSam31GpuRuntimeResponse,
): void {
  const hash = createHash('sha256')
    .update(canonicalSam31GpuWireStringify(response)).digest('hex')
  if (result.runtimeStatus !== 'completed'
    || result.providerOutcome !== 'executed'
    || result.runtimeResponseRef === null
    || result.runtimeResponseRef.contentHash !== `sha256:${hash}`
    || response.status !== 'completed') {
    throw new Error('SAM 3.1 completed endpoint response is not exact.')
  }
}

function assertOutputScope(
  task: CanonicalSam31GpuTaskRecord,
  response: CanonicalSam31GpuRuntimeResponse,
  output: CanonicalSam31PrivateOutputRereadEvidence,
): void {
  const source = task.runtimeRequest.sourceMedia
  const exact = sameRef(output.taskRef,
    ref(task.taskId, task.taskRecordHash))
    && output.runtimeResponseBindingSha256 === response.responseBindingSha256
    && sameRef(output.manifestRef, response.outputSummary!.manifestRef)
    && output.firstFrameIndex === source.selectedStartFrameInclusive
    && output.lastFrameIndex === source.selectedEndFrameInclusive
    && output.propagatedFrameCount === source.decodedFrameCount
    && output.width === source.width
    && output.height === source.height
    && output.exactResponseBytesReread
    && output.exactManifestBytesRereadAndParsed
    && output.everyMaskPngByteHashReread
    && output.everyMaskPngDecodedDimensionsMatchSource
    && output.completeApprovedFrameIntervalCoverageVerified
    && output.noUnexpectedFilesOrCrossInvocationArtifacts
  if (!exact) throw new Error('SAM 3.1 chunk private output differs.')
}

function advanceResult(
  plan: CanonicalSam31CompleteSourceChunkPlan,
  receipts: readonly CanonicalSam31CompleteSourceChunkReceipt[],
  disposition: CanonicalSam31CompleteSourceChunkAdvanceResult['disposition'],
  invocationRuntimeCalledByCoordinator: boolean,
): CanonicalSam31CompleteSourceChunkAdvanceResult {
  const complete = receipts.length === plan.exactChunkCount
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-complete-source-chunk-advance-result-v1' as const,
    executionGroupRef: canonicalSam31CompleteSourceChunkPlanRef(plan),
    disposition,
    completedChunkCount: receipts.length,
    exactChunkCount: plan.exactChunkCount,
    nextChunkOrdinal: complete ? null : receipts.length + 1,
    latestChunkReceiptRef: receipts.length === 0 ? null
      : canonicalSam31CompleteSourceChunkReceiptRef(receipts.at(-1)!),
    invocationRuntimeCalledByCoordinator,
    automaticProviderRetryStarted: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    productionAuthorityGranted: false as const,
  })
}

function blockedDisposition(
  result: TrackAllSam31AuthenticatedGpuInvocationResult,
): CanonicalSam31CompleteSourceChunkAdvanceResult['disposition'] {
  if (result.invocationDisposition === 'failed') {
    return 'blocked_attempt_failed'
  }
  if (result.invocationDisposition ===
    'not_executed_scale_from_zero_trigger') {
    return 'blocked_not_executed_scale_from_zero'
  }
  return 'blocked_unknown_requires_reconciliation'
}

function exactPlanGeometry(plan: z.infer<typeof planWithoutHashSchema>
  | CanonicalSam31CompleteSourceChunkPlan): boolean {
  if (plan.exactChunkCount !== deriveChunkCount(plan.sourceFrameCount)
    || plan.chunks.length !== plan.exactChunkCount
    || new Set(plan.chunks.map((chunk) => chunk.requestId)).size !==
      plan.chunks.length
    || new Set(plan.chunks.map((chunk) => chunk.workItemKey)).size !==
      plan.chunks.length) return false
  return plan.chunks.every((chunk, index) => {
    const start = index * CHUNK_STRIDE_FRAME_COUNT
    return chunk.chunkOrdinal === index + 1
      && chunk.canonicalStartFrameInclusive === start
      && chunk.canonicalEndFrameInclusive === Math.min(
        plan.sourceFrameCount - 1,
        start + CHUNK_FRAME_COUNT - 1,
      )
      && chunk.overlapWithPreviousFrames === (index === 0 ? 0 : 1)
  })
}

function deriveChunkCount(sourceFrameCount: number): number {
  return sourceFrameCount <= CHUNK_FRAME_COUNT ? 1 : Math.ceil(
    (sourceFrameCount - CHUNK_FRAME_COUNT) / CHUNK_STRIDE_FRAME_COUNT,
  ) + 1
}

function privateOutputRef(
  output: CanonicalSam31PrivateOutputRereadEvidence,
): EvidenceRef {
  return ref(
    `sam31-private-output-reread:${output.runtimeResponseObjectRef.id}`,
    output.evidenceHash,
  )
}

async function persistExact<T>(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  value: T
  parser(value: unknown): T
}): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 complete-source record byte bound changed.')
  }
  const disposition = await input.objectPort.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: rawSha256(body),
  })
  const reread = await readExact(input)
  if (stableAuthorityStringify(reread) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 complete-source record exact reread changed.')
  }
  if (disposition === 'created') return 'created'
  return 'identical_replay'
}

async function readExact<T>(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  parser(value: unknown): T
}): Promise<T | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 complete-source record byte bound changed.')
  }
  let value: unknown
  try { value = JSON.parse(body.toString('utf8')) as unknown } catch (error) {
    throw new Error('SAM 3.1 complete-source record JSON is invalid.', {
      cause: error,
    })
  }
  const parsed = input.parser(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 complete-source record bytes changed.')
  }
  return parsed
}

function assertCoordinatorPorts(input: {
  repository: CanonicalSam31CompleteSourceChunkRepository
  invocationRuntime:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort
  taskStore: Pick<
    CanonicalSam31GpuTaskStore, 'rereadTask' | 'rereadRuntimeResponse'
  >
  resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore,
    'persistPrivateOutputRereadEvidenceCreateOnly'
      | 'rereadPrivateOutputRereadEvidenceForInvocation'
  >
  privateOutputRereadPort:
    CanonicalSam31CurrentServingPrivateOutputRereadPort
}): void {
  if (typeof input.repository?.rereadPlan !== 'function'
    || typeof input.repository?.rereadChunkReceipt !== 'function'
    || typeof input.repository?.persistChunkReceiptCreateOnly !== 'function'
    || typeof input.invocationRuntime?.invokeApprovedTrackAllWork !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || typeof input.taskStore?.rereadRuntimeResponse !== 'function'
    || typeof input.resultStore
      ?.persistPrivateOutputRereadEvidenceCreateOnly !== 'function'
    || typeof input.resultStore
      ?.rereadPrivateOutputRereadEvidenceForInvocation !== 'function'
    || typeof input.privateOutputRereadPort
      ?.rereadExactCurrentServingPrivateOutput !== 'function') {
    throw new Error('SAM 3.1 complete-source coordinator ports are incomplete.')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (typeof port?.createOnly !== 'function'
    || typeof port?.readExact !== 'function') {
    throw new Error('SAM 3.1 complete-source object port is unavailable.')
  }
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
    } else if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}

function planPath(prefix: string, executionGroupId: string): string {
  return `${prefix}/${safeId.parse(executionGroupId)}/plan.json`
}

function receiptPath(
  prefix: string,
  executionGroupId: string,
  chunkOrdinal: number,
): string {
  return `${prefix}/${safeId.parse(executionGroupId)}/chunks/`
    + `${String(chunkOrdinal).padStart(3, '0')}.json`
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameNullableRef(
  left: EvidenceRef | null,
  right: EvidenceRef | null,
): boolean {
  return left === null ? right === null : right !== null && sameRef(left, right)
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value))
}
