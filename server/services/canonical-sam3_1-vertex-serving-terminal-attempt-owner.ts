import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexServingMultiReplicaWindowAttempt,
  type CanonicalSam31VertexServingMultiReplicaWindowAttempt,
} from '../tool-cost-metering/canonical-sam3_1-vertex-serving-multi-replica-window-cost-authority'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import type {
  CanonicalProfessionalGpuFundedStartAuthorityStore,
} from './canonical-professional-gpu-funded-start-authority-store'
import type {
  CanonicalProfessionalGpuApprovedFundingObservation,
  CanonicalProfessionalGpuAttemptStartAuthority,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31CurrentVertexCustomerCallStart,
  assertCanonicalSam31CurrentVertexCustomerInvocationAttempt,
  assertCanonicalSam31CurrentVertexCustomerInvocationResult,
  type CanonicalSam31CurrentVertexCustomerInvocationRepository,
} from './canonical-sam3_1-current-vertex-serving-invocation-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_OWNER_VERSION =
  'canonical-sam3_1-vertex-serving-terminal-attempt-owner-v1' as const
export const CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_RECORD_VERSION =
  'canonical-sam3_1-vertex-serving-terminal-attempt-record-v1' as const

const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-serving-terminal-attempts'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type Ref = z.infer<typeof refSchema>

const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam31_vertex_serving_terminal_attempt_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_reread'),
  invocationId: safeId,
  executionAttemptRef: refSchema,
  endpointInvocationAttemptRef: refSchema,
  endpointCallStartRef: refSchema,
  endpointInvocationResultRef: refSchema,
  fundedStartRecordHash: sha256,
  fundedStartExecutionIndexHash: sha256,
  attempt: z.unknown(),
  exactFundingInvocationStartResultAndTerminalReread: z.literal(true),
  workerSuppliedBillableDurationReplicaCountOrPriceAccepted: z.literal(false),
  unresolvedProviderOutcomeAccepted: z.literal(false),
  servingWindowCostReceiptPending: z.literal(true),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()

export type CanonicalSam31VertexServingTerminalAttemptRecord = Omit<
  z.infer<typeof recordSchema>, 'attempt'
> & {
  readonly attempt: CanonicalSam31VertexServingMultiReplicaWindowAttempt
}

export interface CanonicalSam31VertexServingTerminalAttemptOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_OWNER_VERSION
  readonly exactCanonicalRereadBeforeUsageAdmission: true
  readonly customerCreditsMutated: false
  readonly productionAuthority: false
  recordTerminalAttempt(input: {
    readonly invocationId: string
    readonly executionAttemptRef: Ref
    readonly recordedAt: string
  }): Promise<CanonicalSam31VertexServingTerminalAttemptRecord>
  rereadTerminalAttempt(input: {
    readonly executionAttemptRef: Ref
  }): Promise<CanonicalSam31VertexServingTerminalAttemptRecord | null>
}

export function createCanonicalSam31VertexServingTerminalAttemptOwner(input: {
  readonly fundedStartAuthorityStore: Pick<
    CanonicalProfessionalGpuFundedStartAuthorityStore,
    'rereadFundedAttemptByExecutionAttemptRef'
  >
  readonly invocationRepository: Pick<
    CanonicalSam31CurrentVertexCustomerInvocationRepository,
    'rereadAttempt' | 'rereadCallStart' | 'rereadTerminal'
  >
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31VertexServingTerminalAttemptOwner {
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_OWNER_VERSION,
    exactCanonicalRereadBeforeUsageAdmission: true as const,
    customerCreditsMutated: false as const,
    productionAuthority: false as const,
    async recordTerminalAttempt(untrusted: {
      readonly invocationId: string
      readonly executionAttemptRef: Ref
      readonly recordedAt: string
    }) {
      assertPlainSerializedData(untrusted,
        'sam31_vertex_serving_terminal_attempt_record')
      const request = z.object({
        invocationId: safeId,
        executionAttemptRef: refSchema,
        recordedAt: timestamp,
      }).strict().parse(untrusted)
      const existing = await readRecord(
        input.objectPort,
        prefix,
        request.executionAttemptRef,
      )
      if (existing) {
        if (existing.invocationId !== request.invocationId) {
          throw new Error('SAM 3.1 terminal attempt replay crossed invocation.')
        }
        return existing
      }
      const funded = await input.fundedStartAuthorityStore
        .rereadFundedAttemptByExecutionAttemptRef({
          executionAttemptRef: request.executionAttemptRef,
          at: request.recordedAt,
        })
      if (!funded) throw new Error(
        'SAM 3.1 terminal attempt funding is unavailable.',
      )
      const [rawAttempt, rawCallStart, rawResult] = await Promise.all([
        input.invocationRepository.rereadAttempt({
          invocationId: request.invocationId,
        }),
        input.invocationRepository.rereadCallStart({
          invocationId: request.invocationId,
        }),
        input.invocationRepository.rereadTerminal({
          invocationId: request.invocationId,
        }),
      ])
      const endpointAttempt =
        assertCanonicalSam31CurrentVertexCustomerInvocationAttempt(rawAttempt)
      const callStart =
        assertCanonicalSam31CurrentVertexCustomerCallStart(rawCallStart)
      const result =
        assertCanonicalSam31CurrentVertexCustomerInvocationResult(rawResult)
      if (result.disposition ===
        'outcome_unknown_requires_reconciliation') throw new Error(
        'SAM 3.1 unresolved provider outcome cannot enter usage settlement.',
      )
      const funding = funded.approvedFunding
      const start = funded.attemptStart
      assertLineage({
        invocationId: request.invocationId,
        executionAttemptRef: request.executionAttemptRef,
        endpointAttempt,
        callStart,
        result,
        funding,
        start,
        recordedAt: request.recordedAt,
      })
      const attempt =
        assertCanonicalSam31VertexServingMultiReplicaWindowAttempt({
          workspaceId: funding.scope.workspaceId,
          projectId: funding.scope.projectId,
          editSessionId: funding.scope.editSessionId,
          editPlanId: funding.scope.editPlanId,
          editPlanVersion: funding.scope.editPlanVersion,
          executionAttemptRef: request.executionAttemptRef,
          approvedSnapshotRef: funding.approvedSnapshotRef,
          approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
          workerLeaseRef: start.workerLeaseRef,
          fundedReservationRef: funding.fundedReservationRef,
          approvedEstimateRef: funding.publishedCustomerEstimateRef,
          userApprovalRecordRef: funding.userApprovalRecordRef,
          userTriggerRecordRef: start.userTriggerRecordRef,
          requestStartedAt: callStart.startedAt,
          responseCompletedAt: result.observedAt,
          activeRequestMilliseconds:
            Date.parse(result.observedAt) - Date.parse(callStart.startedAt),
          terminalOutcome: result.disposition === 'completed'
            ? 'completed'
            : result.disposition === 'failed'
              ? 'weeditpro_failed'
              : 'canceled',
          providerInferenceOrSubstantiveWorkOutcome: result.providerOutcome,
          approvedReservedToolCostCredits:
            funding.approvedWorkItem.maximumCreditBudget,
          exactApprovedPlanReservationLeaseTriggerAndAttemptReread: true,
          callerSuppliedOutcomeUsageOrPricingAccepted: false,
        })
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_TERMINAL_ATTEMPT_RECORD_VERSION,
        source:
          'canonical_server_sam31_vertex_serving_terminal_attempt_owner',
        evidenceClass: 'canonical_private_exact_reread',
        invocationId: request.invocationId,
        executionAttemptRef: request.executionAttemptRef,
        endpointInvocationAttemptRef: ref(
          endpointAttempt.invocationId,
          endpointAttempt.attemptHash,
        ),
        endpointCallStartRef: ref(
          callStart.invocationId,
          callStart.callStartHash,
        ),
        endpointInvocationResultRef: ref(
          result.invocationId,
          result.resultHash,
        ),
        fundedStartRecordHash: funded.fundedStartRecordHash,
        fundedStartExecutionIndexHash: funded.executionIndexHash,
        attempt,
        exactFundingInvocationStartResultAndTerminalReread: true,
        workerSuppliedBillableDurationReplicaCountOrPriceAccepted: false,
        unresolvedProviderOutcomeAccepted: false,
        servingWindowCostReceiptPending: true,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        recordedAt: request.recordedAt,
      })
      const record = assertRecord({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) throw new Error(
        'SAM 3.1 terminal attempt record exceeds its byte bound.',
      )
      await input.objectPort.createOnly({
        objectPath: recordPath(prefix, request.executionAttemptRef),
        body,
        contentSha256: hash(body),
      })
      const reread = await readRecord(
        input.objectPort,
        prefix,
        request.executionAttemptRef,
      )
      if (!reread || reread.recordHash !== record.recordHash) {
        throw new Error('SAM 3.1 terminal attempt exact reread changed.')
      }
      return reread
    },
    rereadTerminalAttempt({ executionAttemptRef }: {
      readonly executionAttemptRef: Ref
    }) {
      return readRecord(
        input.objectPort,
        prefix,
        refSchema.parse(executionAttemptRef),
      )
    },
  })
}

export function createCanonicalGcsSam31VertexServingTerminalAttemptOwner(
  input: {
    readonly fundedStartAuthorityStore: Pick<
      CanonicalProfessionalGpuFundedStartAuthorityStore,
      'rereadFundedAttemptByExecutionAttemptRef'
    >
    readonly invocationRepository: Pick<
      CanonicalSam31CurrentVertexCustomerInvocationRepository,
      'rereadAttempt' | 'rereadCallStart' | 'rereadTerminal'
    >
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  },
): CanonicalSam31VertexServingTerminalAttemptOwner {
  const projectId = input.projectId ?? PROJECT_ID
  return createCanonicalSam31VertexServingTerminalAttemptOwner({
    fundedStartAuthorityStore: input.fundedStartAuthorityStore,
    invocationRepository: input.invocationRepository,
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

export function assertCanonicalSam31VertexServingTerminalAttemptRecord(
  value: unknown,
): CanonicalSam31VertexServingTerminalAttemptRecord {
  return assertRecord(value)
}

function assertRecord(
  value: unknown,
): CanonicalSam31VertexServingTerminalAttemptRecord {
  assertPlainSerializedData(value, 'sam31_vertex_serving_terminal_attempt')
  const parsed = recordSchema.parse(value)
  const { recordHash, ...payload } = parsed
  const attempt =
    assertCanonicalSam31VertexServingMultiReplicaWindowAttempt(parsed.attempt)
  if (recordHash !== sha256AuthorityValue(payload)
    || !sameRef(parsed.executionAttemptRef, attempt.executionAttemptRef)) {
    throw new Error('SAM 3.1 terminal attempt record digest changed.')
  }
  return { ...parsed, attempt }
}

async function readRecord(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  executionAttemptRef: Ref,
): Promise<CanonicalSam31VertexServingTerminalAttemptRecord | null> {
  const body = await objectPort.readExact(recordPath(prefix,
    executionAttemptRef))
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) throw new Error(
    'SAM 3.1 terminal attempt repository bytes are invalid.',
  )
  const record = assertRecord(JSON.parse(body.toString('utf8')))
  if (stableAuthorityStringify(record) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 terminal attempt repository bytes changed.')
  }
  return structuredClone(record)
}

function assertLineage(input: {
  invocationId: string
  executionAttemptRef: Ref
  endpointAttempt: ReturnType<
    typeof assertCanonicalSam31CurrentVertexCustomerInvocationAttempt
  >
  callStart: ReturnType<
    typeof assertCanonicalSam31CurrentVertexCustomerCallStart
  >
  result: ReturnType<
    typeof assertCanonicalSam31CurrentVertexCustomerInvocationResult
  >
  funding: CanonicalProfessionalGpuApprovedFundingObservation
  start: CanonicalProfessionalGpuAttemptStartAuthority
  recordedAt: string
}): void {
  const exact = input.start.idempotencyKey === input.invocationId
    && input.endpointAttempt.invocationId === input.invocationId
    && input.callStart.invocationId === input.invocationId
    && input.result.invocationId === input.invocationId
    && sameRef(input.start.executionAttemptRef, input.executionAttemptRef)
    && sameRef(input.endpointAttempt.executionAttemptRef,
      input.executionAttemptRef)
    && sameRef(input.callStart.attemptRef, ref(
      input.endpointAttempt.invocationId,
      input.endpointAttempt.attemptHash,
    ))
    && sameRef(input.result.attemptRef, input.callStart.attemptRef)
    && sameRef(input.result.callStartRef, ref(
      input.callStart.invocationId,
      input.callStart.callStartHash,
    ))
    && sameRef(input.result.executionAttemptRef,
      input.executionAttemptRef)
    && sameRef(input.endpointAttempt.fundedReservationRef,
      input.funding.fundedReservationRef)
    && Date.parse(input.callStart.startedAt) >=
      Date.parse(input.endpointAttempt.consumedAt)
    && Date.parse(input.result.observedAt) >
      Date.parse(input.callStart.startedAt)
    && Date.parse(input.recordedAt) >= Date.parse(input.result.observedAt)
  if (!exact) throw new Error(
    'SAM 3.1 terminal attempt funding and invocation lineage differ.',
  )
}

function recordPath(prefix: string, executionAttemptRef: Ref): string {
  return `${prefix}/${sha256AuthorityValue({
    domain: 'canonical_sam31_vertex_serving_terminal_attempt_v1',
    executionAttemptRef,
  })}.json`
}

function ref(id: string, digest: string): Ref {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${digest}`,
  })
}

function sameRef(left: Ref, right: Ref): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function hash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
