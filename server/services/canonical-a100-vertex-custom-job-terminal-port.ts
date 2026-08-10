import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobExecutionRecord,
} from './canonical-a100-vertex-custom-job-launch-port'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION =
  'canonical-a100-vertex-custom-job-terminal-cost-evidence-v2' as const
export const CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION =
  'canonical-a100-vertex-custom-job-terminal-read-v2' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const pendingStateSchema = z.enum([
  'JOB_STATE_QUEUED',
  'JOB_STATE_PENDING',
  'JOB_STATE_RUNNING',
  'JOB_STATE_UPDATING',
  'JOB_STATE_CANCELLING',
  'JOB_STATE_PAUSED',
])
const terminalStateSchema = z.enum([
  'JOB_STATE_SUCCEEDED',
  'JOB_STATE_FAILED',
  'JOB_STATE_CANCELLED',
  'JOB_STATE_EXPIRED',
])
const providerStateSchema = z.union([pendingStateSchema, terminalStateSchema])

const costEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_a100_vertex_usage_account_price_and_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  executionRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  currentAccountPriceAuthorityRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  exactVertexPlatformUsageReread: z.literal(true),
  exactBillingAccountEffectivePriceReread: z.literal(true),
  attemptCostReceiptPersistedBeforeSettlement: z.literal(true),
  activeA100GpuInstancesAfterObservation: z.literal(0),
  zeroActiveA100ClaimScopedToThisOneShotAttempt: z.literal(true),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  callerWorkerPriceUsageOrCostClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict()
export const canonicalA100VertexCustomJobTerminalCostEvidenceSchema =
  costEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobTerminalCostEvidence = z.infer<
  typeof canonicalA100VertexCustomJobTerminalCostEvidenceSchema
>

const terminalReadWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
  ),
  source: z.literal('canonical_a100_vertex_custom_job_terminal_port'),
  executionRef: evidenceRefSchema,
  disposition: z.enum([
    'pending',
    'terminal',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerState: providerStateSchema.nullable(),
  terminalOutcome: z.enum([
    'completed',
    'failed',
    'canceled',
    'expired',
  ]).nullable(),
  cloudTerminalObservationRef: evidenceRefSchema.nullable(),
  workerUsageEvidenceRef: evidenceRefSchema.nullable(),
  currentAccountPriceAuthorityRef: evidenceRefSchema.nullable(),
  attemptCostReceiptRef: evidenceRefSchema.nullable(),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  createTime: timestamp.nullable(),
  startTime: timestamp.nullable(),
  endTime: timestamp.nullable(),
  providerJobTerminalStateReread: z.boolean(),
  workerStoppedVerified: z.boolean(),
  activeA100GpuInstancesAfterObservation: z.literal(0).nullable(),
  zeroActiveA100ClaimScopedToThisOneShotAttempt: z.boolean(),
  exactVertexPlatformUsageAndAccountEffectivePriceReread: z.boolean(),
  costReceiptPersistedBeforeSettlement: z.boolean(),
  checkbackAllowed: z.boolean(),
  retryAllowedWithoutCanonicalReconciliation: z.literal(false),
  minimumIdleInstances: z.literal(0),
  persistentEndpointPresent: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  customerWalletOrLedgerMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const terminalRefs = [
    result.cloudTerminalObservationRef,
    result.workerUsageEvidenceRef,
    result.currentAccountPriceAuthorityRef,
    result.attemptCostReceiptRef,
  ]
  const exact = result.disposition === 'terminal'
    ? result.providerState !== null
      && terminalStateSchema.safeParse(result.providerState).success
      && result.terminalOutcome !== null
      && terminalRefs.every((value) => value !== null)
      && result.endTime !== null
      && result.providerJobTerminalStateReread
      && result.workerStoppedVerified
      && result.activeA100GpuInstancesAfterObservation === 0
      && result.zeroActiveA100ClaimScopedToThisOneShotAttempt
      && result.exactVertexPlatformUsageAndAccountEffectivePriceReread
      && result.costReceiptPersistedBeforeSettlement
      && !result.checkbackAllowed
      && result.providerInferenceOrSubstantiveWorkOutcome !== 'unknown'
    : result.disposition === 'pending'
      ? result.providerState !== null
        && pendingStateSchema.safeParse(result.providerState).success
        && result.terminalOutcome === null
        && terminalRefs.every((value) => value === null)
        && result.endTime === null
        && !result.providerJobTerminalStateReread
        && !result.workerStoppedVerified
        && result.activeA100GpuInstancesAfterObservation === null
        && !result.zeroActiveA100ClaimScopedToThisOneShotAttempt
        && !result.exactVertexPlatformUsageAndAccountEffectivePriceReread
        && !result.costReceiptPersistedBeforeSettlement
        && result.checkbackAllowed
        && result.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
      : result.providerState === null
        && result.terminalOutcome === null
        && terminalRefs.every((value) => value === null)
        && !result.providerJobTerminalStateReread
        && !result.workerStoppedVerified
        && result.activeA100GpuInstancesAfterObservation === null
        && !result.zeroActiveA100ClaimScopedToThisOneShotAttempt
        && !result.exactVertexPlatformUsageAndAccountEffectivePriceReread
        && !result.costReceiptPersistedBeforeSettlement
        && !result.checkbackAllowed
        && result.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 terminal read lost pending, terminal, or unknown truth.',
  })
})
export const canonicalA100VertexCustomJobTerminalReadSchema =
  terminalReadWithoutHashSchema.extend({ terminalReadHash: sha256 }).strict()
export type CanonicalA100VertexCustomJobTerminalRead = z.infer<
  typeof canonicalA100VertexCustomJobTerminalReadSchema
>

export interface CanonicalA100VertexCustomJobExecutionReadRepository {
  rereadExecution(input: {
    readonly executionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalA100VertexCustomJobExecutionRecord>
}

export interface CanonicalA100VertexTerminalCostEvidenceReadPort {
  rereadUsageAccountPriceAndCost(input: {
    readonly execution: CanonicalA100VertexCustomJobExecutionRecord
    readonly executionRef: z.infer<typeof evidenceRefSchema>
    readonly cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
    readonly terminalOutcome: 'completed' | 'failed' | 'canceled' | 'expired'
    readonly providerTimes: {
      readonly createTime: string
      readonly startTime: string
      readonly endTime: string
      readonly providerStartTimeObserved: boolean
    }
  }): Promise<CanonicalA100VertexCustomJobTerminalCostEvidence>
}

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalA100VertexCustomJobTerminalPort(input: {
  readonly executionRepository:
    CanonicalA100VertexCustomJobExecutionReadRepository
  readonly costEvidenceReadPort:
    CanonicalA100VertexTerminalCostEvidenceReadPort
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
}) {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('Vertex A100 terminal timeout is invalid.')
  }

  return Object.freeze({
    async reread(inputValue: {
      readonly executionRef: unknown
    }): Promise<CanonicalA100VertexCustomJobTerminalRead> {
      const observedAt = now()
      let executionRef: z.infer<typeof evidenceRefSchema> | null = null
      try {
        assertPlainSerializedData(inputValue.executionRef,
          'vertex_execution_ref')
        executionRef = evidenceRefSchema.parse(inputValue.executionRef)
        const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
          await input.executionRepository.rereadExecution({ executionRef }),
        )
        if (!sameRef(executionRef, ref(
          execution.executionRecordId,
          execution.executionRecordHash,
        ))) throw new Error('Vertex execution ref differs from its record.')
        const response = await auth.request({
          url: `${API_ORIGIN}/v1/${execution.customJobResourceName}`,
          method: 'GET',
          timeout,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
          maxContentLength: 2 * 1024 * 1024,
        })
        const provider = parseProviderJob(response.data, execution)
        if (pendingStateSchema.safeParse(provider.state).success) {
          return terminalRead({
            executionRef,
            disposition: 'pending',
            providerState: provider.state,
            terminalOutcome: null,
            costEvidence: null,
            createTime: provider.createTime,
            startTime: provider.startTime,
            endTime: null,
            observedAt,
          })
        }
        const terminalOutcome = provider.state === 'JOB_STATE_SUCCEEDED'
          ? 'completed' as const
          : provider.state === 'JOB_STATE_CANCELLED'
            ? 'canceled' as const
            : provider.state === 'JOB_STATE_EXPIRED'
              ? 'expired' as const
              : 'failed' as const
        const cloudTerminalObservationRef = opaqueRef(
          'vertex-a100-terminal',
          {
            executionRef,
            provider,
          },
        )
        if (provider.endTime === null) {
          throw new Error('Vertex terminal response omitted its end time.')
        }
        const costEvidence = assertCanonicalA100VertexTerminalCostEvidence(
          await input.costEvidenceReadPort.rereadUsageAccountPriceAndCost({
            execution,
            executionRef,
            cloudTerminalObservationRef,
            terminalOutcome,
            providerTimes: {
              createTime: provider.createTime,
              startTime: provider.startTime ?? provider.createTime,
              endTime: provider.endTime,
              providerStartTimeObserved: provider.startTime !== null,
            },
          }),
        )
        if (
          !sameRef(costEvidence.executionRef, executionRef)
          || !sameRef(
            costEvidence.cloudTerminalObservationRef,
            cloudTerminalObservationRef,
          )
          || provider.endTime === null
          || Date.parse(costEvidence.observedAt) < Date.parse(provider.endTime)
          || Date.parse(observedAt) < Date.parse(costEvidence.observedAt)
        ) throw new Error('Vertex terminal cost evidence differs or is stale.')
        return terminalRead({
          executionRef,
          disposition: 'terminal',
          providerState: provider.state,
          terminalOutcome,
          costEvidence,
          createTime: provider.createTime,
          startTime: provider.startTime,
          endTime: provider.endTime,
          observedAt,
        })
      } catch {
        return terminalRead({
          executionRef: executionRef ?? opaqueRef(
            'vertex-a100-unvalidated-execution',
            { observedAt },
          ),
          disposition: 'outcome_unknown_requires_reconciliation',
          providerState: null,
          terminalOutcome: null,
          costEvidence: null,
          createTime: null,
          startTime: null,
          endTime: null,
          observedAt,
        })
      }
    },
  })
}

export function assertCanonicalA100VertexTerminalCostEvidence(
  value: unknown,
): CanonicalA100VertexCustomJobTerminalCostEvidence {
  assertPlainSerializedData(value, 'vertex_terminal_cost_evidence')
  const evidence = canonicalA100VertexCustomJobTerminalCostEvidenceSchema
    .parse(value)
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex terminal cost evidence hash is invalid.')
  }
  return evidence
}

export function assertCanonicalA100VertexCustomJobTerminalRead(
  value: unknown,
): CanonicalA100VertexCustomJobTerminalRead {
  assertPlainSerializedData(value, 'vertex_terminal_read')
  const result = canonicalA100VertexCustomJobTerminalReadSchema.parse(value)
  const { terminalReadHash, ...payload } = result
  if (terminalReadHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex terminal read hash is invalid.')
  }
  return result
}

function parseProviderJob(
  value: unknown,
  execution: CanonicalA100VertexCustomJobExecutionRecord,
) {
  assertPlainSerializedData(value, 'vertex_custom_job_terminal_response')
  const parsed = z.object({
    name: z.literal(execution.customJobResourceName),
    displayName: z.literal(execution.displayName),
    state: providerStateSchema,
    createTime: timestamp,
    startTime: timestamp.optional(),
    endTime: timestamp.optional(),
  }).passthrough().parse(value)
  const terminal = terminalStateSchema.safeParse(parsed.state).success
  if (
    terminal !== (parsed.endTime !== undefined)
    || (parsed.startTime !== undefined
      && Date.parse(parsed.startTime) < Date.parse(parsed.createTime))
    || (parsed.endTime !== undefined
      && Date.parse(parsed.endTime) < Date.parse(parsed.startTime ?? parsed.createTime))
  ) throw new Error('Vertex Custom Job time/state evidence is inconsistent.')
  return Object.freeze({
    name: parsed.name,
    displayName: parsed.displayName,
    state: parsed.state,
    createTime: parsed.createTime,
    startTime: parsed.startTime ?? null,
    endTime: parsed.endTime ?? null,
  })
}

function terminalRead(input: {
  executionRef: z.infer<typeof evidenceRefSchema>
  disposition: CanonicalA100VertexCustomJobTerminalRead['disposition']
  providerState: z.infer<typeof providerStateSchema> | null
  terminalOutcome: CanonicalA100VertexCustomJobTerminalRead['terminalOutcome']
  costEvidence: CanonicalA100VertexCustomJobTerminalCostEvidence | null
  createTime: string | null
  startTime: string | null
  endTime: string | null
  observedAt: string
}): CanonicalA100VertexCustomJobTerminalRead {
  const terminal = input.disposition === 'terminal'
  const pending = input.disposition === 'pending'
  const payload = terminalReadWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_READ_VERSION,
    source: 'canonical_a100_vertex_custom_job_terminal_port',
    executionRef: input.executionRef,
    disposition: input.disposition,
    providerState: input.providerState,
    terminalOutcome: input.terminalOutcome,
    cloudTerminalObservationRef:
      input.costEvidence?.cloudTerminalObservationRef ?? null,
    workerUsageEvidenceRef: input.costEvidence?.workerUsageEvidenceRef ?? null,
    currentAccountPriceAuthorityRef:
      input.costEvidence?.currentAccountPriceAuthorityRef ?? null,
    attemptCostReceiptRef: input.costEvidence?.attemptCostReceiptRef ?? null,
    providerInferenceOrSubstantiveWorkOutcome:
      input.costEvidence?.providerInferenceOrSubstantiveWorkOutcome ?? 'unknown',
    createTime: input.createTime,
    startTime: input.startTime,
    endTime: input.endTime,
    providerJobTerminalStateReread: terminal,
    workerStoppedVerified: terminal,
    activeA100GpuInstancesAfterObservation: terminal ? 0 : null,
    zeroActiveA100ClaimScopedToThisOneShotAttempt: terminal,
    exactVertexPlatformUsageAndAccountEffectivePriceReread: terminal,
    costReceiptPersistedBeforeSettlement: terminal,
    checkbackAllowed: pending,
    retryAllowedWithoutCanonicalReconciliation: false,
    minimumIdleInstances: 0,
    persistentEndpointPresent: false,
    systemFailureOrUnknownCostChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
    customerWalletOrLedgerMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.observedAt,
  })
  return Object.freeze(canonicalA100VertexCustomJobTerminalReadSchema.parse({
    ...payload,
    terminalReadHash: sha256AuthorityValue(payload),
  }))
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function opaqueRef(id: string, value: unknown) {
  const hash = sha256AuthorityValue(value)
  return ref(`${id}.${hash.slice(0, 32)}`, hash)
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
