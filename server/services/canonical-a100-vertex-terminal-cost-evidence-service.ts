import { z } from 'zod'

import {
  assertCanonicalA100VertexCustomJobExecutionRecord,
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  type CanonicalA100VertexCustomJobExecutionRecord,
  type CanonicalA100VertexCustomJobLaunchAuthority,
} from './canonical-a100-vertex-custom-job-launch-port'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION,
  canonicalA100VertexCustomJobTerminalCostEvidenceSchema,
  type CanonicalA100VertexTerminalCostEvidenceReadPort,
} from './canonical-a100-vertex-custom-job-terminal-port'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalA100VertexProviderAllocationCostReceipt,
  createCanonicalA100VertexProviderAllocationCostReceipt,
  createCanonicalA100VertexProviderAllocationUsage,
  type CanonicalA100VertexProviderAllocationCostReceipt,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'

export const CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION =
  'canonical-a100-vertex-worker-usage-evidence-v2' as const
export const CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION =
  'canonical-a100-vertex-platform-usage-evidence-v2' as const
export const CANONICAL_A100_VERTEX_TERMINAL_COST_CONTEXT_VERSION =
  'canonical-a100-vertex-terminal-cost-context-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const providerTimesSchema = z.object({
  createTime: timestamp,
  startTime: timestamp,
  endTime: timestamp,
  providerStartTimeObserved: z.boolean(),
}).strict().superRefine((times, context) => {
  if (
    Date.parse(times.startTime) < Date.parse(times.createTime)
    || Date.parse(times.endTime) < Date.parse(times.startTime)
    || (!times.providerStartTimeObserved
      && times.startTime !== times.createTime)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 provider terminal times are invalid.',
  })
})

const contextWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_TERMINAL_COST_CONTEXT_VERSION,
  ),
  source: z.literal(
    'canonical_server_a100_vertex_terminal_cost_context_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  executionRef: evidenceRefSchema,
  authority: z.unknown(),
  releaseRef: evidenceRefSchema,
  exactApprovalSnapshotFrameTimingWorkLeaseReservationEstimateTriggerEnvelopeReleaseAndRateReread:
    z.literal(true),
  callerUsageOutcomePriceCostOrReceiptIdAccepted: z.literal(false),
  customerWalletOrLedgerMutationAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict()
export const canonicalA100VertexTerminalCostContextSchema =
  contextWithoutHashSchema.extend({ contextHash: sha256 }).strict()
export type CanonicalA100VertexTerminalCostContext = z.infer<
  typeof canonicalA100VertexTerminalCostContextSchema
> & { readonly authority: CanonicalA100VertexCustomJobLaunchAuthority }

const workerUsageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_WORKER_USAGE_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_a100_vertex_private_worker_usage_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  executionRef: evidenceRefSchema,
  authorityRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  providerTimes: providerTimesSchema,
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  runtimeResponseStatus: z.enum([
    'completed',
    'failed',
    'not_created_before_worker_start',
  ]),
  runtimeTerminalStage: z.enum([
    'not_started',
    'request_validation',
    'artifact_verification',
    'cuda_admission',
    'model_load',
    'session_start',
    'prompt',
    'propagation',
    'output_persistence',
    'artifact_reread',
    'completed',
  ]),
  workerWallTimeMilliseconds: nonnegativeInteger,
  modelLoadMilliseconds: nonnegativeInteger,
  promptMilliseconds: nonnegativeInteger,
  propagationMilliseconds: nonnegativeInteger,
  outputPersistenceMilliseconds: nonnegativeInteger,
  cudaEventInferenceMilliseconds: nonnegativeInteger,
  peakCudaAllocatedBytes: nonnegativeInteger,
  peakCudaReservedBytes: nonnegativeInteger,
  outputFileCount: nonnegativeInteger,
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: nonnegativeInteger,
  classBOperationCount: nonnegativeInteger,
  exactImmutableTaskWorkerMetricsReread: z.literal(true),
  workerWallTimeDoesNotDefineProviderAllocationOrBilling: z.literal(true),
  providerAllocationIncludesUnobservableWorkerStartupAndDrain: z.literal(true),
  workerSuppliedProviderTimesBillableDurationPriceOrCostAccepted:
    z.literal(false),
  runtimeNetworkDownloadObserved: z.literal(false),
  cpuOnlySubstantiveExecutionObserved: z.literal(false),
  rawMediaPathsUrlsSecretsOrCredentialsIncluded: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((usage, context) => {
  const available = Date.parse(usage.providerTimes.endTime)
    - Date.parse(usage.providerTimes.startTime)
  const measuredPhases = usage.modelLoadMilliseconds
    + usage.promptMilliseconds
    + usage.propagationMilliseconds
    + usage.outputPersistenceMilliseconds
  const completed = usage.runtimeResponseStatus === 'completed'
  const statusExact = completed
    ? usage.runtimeTerminalStage === 'completed'
      && usage.providerInferenceOrSubstantiveWorkOutcome === 'executed'
    : usage.runtimeResponseStatus === 'failed'
      ? usage.runtimeTerminalStage !== 'completed'
        && usage.runtimeTerminalStage !== 'not_started'
      : usage.runtimeTerminalStage === 'not_started'
        && usage.providerInferenceOrSubstantiveWorkOutcome === 'not_executed'
  if (
    !statusExact
    || usage.workerWallTimeMilliseconds > available
    || measuredPhases > usage.workerWallTimeMilliseconds
    || usage.cudaEventInferenceMilliseconds >
      usage.workerWallTimeMilliseconds
    || (completed && (usage.outputFileCount < 1
      || usage.privateArtifactBytes < 1))
    || Date.parse(usage.observedAt) < Date.parse(usage.providerTimes.endTime)
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex A100 worker evidence exceeds the provider allocation.',
  })
})
export const canonicalA100VertexWorkerUsageEvidenceSchema =
  workerUsageWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalA100VertexWorkerUsageEvidence = z.infer<
  typeof canonicalA100VertexWorkerUsageEvidenceSchema
>

const platformUsageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_A100_VERTEX_PLATFORM_USAGE_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_server_vertex_platform_usage_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  executionRef: evidenceRefSchema,
  authorityRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  providerTimes: providerTimesSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  platformUsageRereadRef: evidenceRefSchema,
  providerJobTerminalStateReread: z.literal(true),
  providerCapacityAndQuotaReread: z.literal(true),
  workerStoppedVerified: z.literal(true),
  activeA100GpuInstancesAfterObservation: z.literal(0),
  persistentEndpointPresent: z.literal(false),
  minimumIdleInstances: z.literal(0),
  exactOneShotA2UltraAllocationReread: z.literal(true),
  zeroActiveWorkerClaimScopedToThisOneShotCustomJob: z.literal(true),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  callerCapacityStopUsageOrPriceClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((usage, context) => {
  if (Date.parse(usage.observedAt) < Date.parse(usage.providerTimes.endTime)) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex A100 platform observation predates terminal time.',
    })
  }
})
export const canonicalA100VertexPlatformUsageEvidenceSchema =
  platformUsageWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalA100VertexPlatformUsageEvidence = z.infer<
  typeof canonicalA100VertexPlatformUsageEvidenceSchema
>

export interface CanonicalA100VertexTerminalCostContextReadPort {
  rereadPrivateTerminalCostContext(input: {
    readonly execution: CanonicalA100VertexCustomJobExecutionRecord
    readonly executionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalA100VertexTerminalCostContext>
}

export interface CanonicalA100VertexWorkerUsageEvidenceReadPort {
  rereadPrivateWorkerUsage(input: {
    readonly execution: CanonicalA100VertexCustomJobExecutionRecord
    readonly executionRef: z.infer<typeof evidenceRefSchema>
    readonly cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
    readonly providerTimes: z.infer<typeof providerTimesSchema>
  }): Promise<unknown>
}

export interface CanonicalA100VertexPlatformUsageEvidenceReadPort {
  rereadPlatformUsageAndStoppedCapacity(input: {
    readonly execution: CanonicalA100VertexCustomJobExecutionRecord
    readonly executionRef: z.infer<typeof evidenceRefSchema>
    readonly cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
    readonly workerUsageEvidenceRef: z.infer<typeof evidenceRefSchema>
    readonly providerTimes: z.infer<typeof providerTimesSchema>
  }): Promise<unknown>
}

export interface CanonicalA100VertexCurrentRateAuthorityReadPort {
  reread(input: {
    readonly rateAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalA100VertexAttemptCostReceiptStore {
  rereadAttemptCostReceiptIfPresent(input: {
    readonly receiptId: string
  }): Promise<unknown | null>
  createAttemptCostReceiptOnly(input: {
    readonly receipt: CanonicalA100VertexProviderAllocationCostReceipt
  }): Promise<'created' | 'already_exists'>
  rereadAttemptCostReceipt(input: {
    readonly receiptId: string
  }): Promise<unknown>
}

export function createCanonicalA100VertexTerminalCostEvidenceReadPort(input: {
  readonly contextReadPort: CanonicalA100VertexTerminalCostContextReadPort
  readonly workerUsageReadPort:
    CanonicalA100VertexWorkerUsageEvidenceReadPort
  readonly platformUsageReadPort:
    CanonicalA100VertexPlatformUsageEvidenceReadPort
  readonly rateAuthorityReadPort:
    CanonicalA100VertexCurrentRateAuthorityReadPort
  readonly receiptStore: CanonicalA100VertexAttemptCostReceiptStore
  readonly now?: () => string
}): CanonicalA100VertexTerminalCostEvidenceReadPort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async rereadUsageAccountPriceAndCost(request: Parameters<
      CanonicalA100VertexTerminalCostEvidenceReadPort[
        'rereadUsageAccountPriceAndCost'
      ]
    >[0]) {
      const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
        request.execution,
      )
      const executionRef = evidenceRefSchema.parse(request.executionRef)
      const cloudTerminalObservationRef = evidenceRefSchema.parse(
        request.cloudTerminalObservationRef,
      )
      const providerTimes = providerTimesSchema.parse(request.providerTimes)
      const terminalOutcome = z.enum([
        'completed',
        'failed',
        'canceled',
        'expired',
      ]).parse(request.terminalOutcome)
      if (!sameRef(executionRef, ref(
        execution.executionRecordId,
        execution.executionRecordHash,
      ))) throw new Error('Vertex A100 execution reread differs.')

      const context = assertCanonicalA100VertexTerminalCostContext(
        await input.contextReadPort.rereadPrivateTerminalCostContext({
          execution,
          executionRef,
        }),
      )
      const authority = context.authority
      assertContext({ context, authority, execution, executionRef })

      const receiptId =
        `vertex-a100-cost.${execution.executionRecordHash.slice(0, 48)}`
      const existingReceiptValue =
        await input.receiptStore.rereadAttemptCostReceiptIfPresent({
          receiptId,
        })
      if (existingReceiptValue !== null) {
        const existingReceipt =
          assertCanonicalA100VertexProviderAllocationCostReceipt(
            existingReceiptValue,
          )
        assertExistingReceiptMatchesAttempt({
          receipt: existingReceipt,
          receiptId,
          authority,
          executionRef,
          cloudTerminalObservationRef,
          providerTimes,
          terminalOutcome,
        })
        return costEvidenceFromReceipt(existingReceipt)
      }

      const worker = assertCanonicalA100VertexWorkerUsageEvidence(
        await input.workerUsageReadPort.rereadPrivateWorkerUsage({
          execution,
          executionRef,
          cloudTerminalObservationRef,
          providerTimes,
        }),
      )
      assertWorker({
        worker,
        authority,
        executionRef,
        cloudTerminalObservationRef,
        providerTimes,
      })
      const workerUsageEvidenceRef = ref(
        `vertex-a100-worker-usage.${execution.executionRecordHash.slice(0, 32)}`,
        worker.evidenceHash,
      )

      const platform = assertCanonicalA100VertexPlatformUsageEvidence(
        await input.platformUsageReadPort
          .rereadPlatformUsageAndStoppedCapacity({
            execution,
            executionRef,
            cloudTerminalObservationRef,
            workerUsageEvidenceRef,
            providerTimes,
          }),
      )
      assertPlatform({
        platform,
        authority,
        executionRef,
        cloudTerminalObservationRef,
        workerUsageEvidenceRef,
        providerTimes,
      })

      const observedAt = timestamp.parse(now())
      if (Date.parse(observedAt) < Date.parse(platform.observedAt)) {
        throw new Error('Vertex A100 cost observation time is stale.')
      }
      const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
        await input.rateAuthorityReadPort.reread({
          rateAuthorityRef: authority.currentRateAuthorityRef,
          at: observedAt,
        }),
        observedAt,
      )
      if (!sameRef(authority.currentRateAuthorityRef, ref(
        rate.rateAuthorityId,
        rate.rateAuthorityHash,
        rate.rateAuthorityVersion,
      ))) throw new Error('Vertex A100 rate reread differs from launch.')

      if (
        worker.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
        || (terminalOutcome === 'completed'
          && worker.providerInferenceOrSubstantiveWorkOutcome !== 'executed')
      ) throw new Error(
        'Vertex A100 substantive-work outcome requires reconciliation.',
      )
      const usage = createCanonicalA100VertexProviderAllocationUsage({
        providerCreateTime: providerTimes.createTime,
        providerStartTime: providerTimes.startTime,
        providerEndTime: providerTimes.endTime,
        privateArtifactBytes: worker.privateArtifactBytes,
        privateArtifactRetentionMilliseconds:
          worker.privateArtifactRetentionMilliseconds,
        networkEgressBytes: worker.networkEgressBytes,
      })
      const receipt = createCanonicalA100VertexProviderAllocationCostReceipt({
        receiptId,
        authority,
        executionRef,
        cloudTerminalObservationRef,
        workerUsageEvidenceRef,
        platformUsageRereadRef: platform.platformUsageRereadRef,
        rateAuthority: rate,
        actualUsage: usage,
        terminalOutcome: terminalOutcome === 'completed'
          ? 'completed'
          : terminalOutcome === 'failed'
            ? 'weeditpro_failed'
            : terminalOutcome,
        providerInferenceOrSubstantiveWorkOutcome:
          worker.providerInferenceOrSubstantiveWorkOutcome,
        attemptStartedAt: authority.admittedAt,
        recordedAt: observedAt,
      })
      await persistAndRereadReceipt(receipt, input.receiptStore)
      return costEvidenceFromReceipt(receipt)
    },
  })
}

function costEvidenceFromReceipt(
  receipt: CanonicalA100VertexProviderAllocationCostReceipt,
) {
  const payload = {
    schemaVersion:
      CANONICAL_A100_VERTEX_CUSTOM_JOB_TERMINAL_COST_EVIDENCE_VERSION,
    source:
      'canonical_server_a100_vertex_usage_account_price_and_cost_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    executionRef: receipt.executionRef,
    cloudTerminalObservationRef: receipt.cloudTerminalObservationRef,
    cloudCapacityTeardownObservationRef: receipt.platformUsageRereadRef,
    workerUsageEvidenceRef: receipt.workerUsageEvidenceRef,
    currentAccountPriceAuthorityRef: receipt.rateAuthorityRef,
    attemptCostReceiptRef: ref(receipt.receiptId, receipt.receiptHash),
    providerInferenceOrSubstantiveWorkOutcome:
      receipt.providerInferenceOrSubstantiveWorkOutcome,
    exactVertexPlatformUsageReread: true as const,
    exactBillingAccountEffectivePriceReread: true as const,
    attemptCostReceiptPersistedBeforeSettlement: true as const,
    activeA100GpuInstancesAfterObservation: 0 as const,
    zeroActiveA100ClaimScopedToThisOneShotAttempt: true as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    customerWalletOrLedgerMutated: false as const,
    callerWorkerPriceUsageOrCostClaimAccepted: false as const,
    observedAt: receipt.recordedAt,
  }
  return Object.freeze(
    canonicalA100VertexCustomJobTerminalCostEvidenceSchema.parse({
      ...payload,
      evidenceHash: sha256AuthorityValue(payload),
    }),
  )
}

function assertExistingReceiptMatchesAttempt(input: {
  receipt: CanonicalA100VertexProviderAllocationCostReceipt
  receiptId: string
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  executionRef: z.infer<typeof evidenceRefSchema>
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
  providerTimes: z.infer<typeof providerTimesSchema>
  terminalOutcome: 'completed' | 'failed' | 'canceled' | 'expired'
}): void {
  const expectedTerminalOutcome = input.terminalOutcome === 'failed'
    ? 'weeditpro_failed'
    : input.terminalOutcome
  const authorityRefs = [
    ['approvedSnapshotRef', input.authority.approvedSnapshotRef],
    ['confirmedOutputFrameRef', input.authority.confirmedOutputFrameRef],
    ['masterTimingRef', input.authority.masterTimingRef],
    ['approvedWorkItemRef', input.authority.approvedWorkItemRef],
    ['workerLeaseRef', input.authority.workerLeaseRef],
    ['fundedReservationRef', input.authority.fundedReservationRef],
    ['approvedEstimateRef', input.authority.approvedEstimateRef],
    ['userApprovalRecordRef', input.authority.userApprovalRecordRef],
    ['userTriggerRecordRef', input.authority.userTriggerRecordRef],
    ['executionAttemptRef', input.authority.executionAttemptRef],
    ['executionEnvelopeRef', input.authority.executionEnvelopeRef],
  ] as const
  const refsMatch = authorityRefs.every(([field, expected]) =>
    sameRef(input.receipt[field], expected))
  if (
    input.receipt.receiptId !== input.receiptId
    || !sameRef(input.receipt.authorityRef, ref(
      input.authority.authorityId,
      input.authority.authorityHash,
    ))
    || !sameRef(input.receipt.releaseRef, input.authority.releaseRef)
    || !sameRef(input.receipt.executionRef, input.executionRef)
    || !sameRef(input.receipt.cloudTerminalObservationRef,
      input.cloudTerminalObservationRef)
    || !sameRef(input.receipt.rateAuthorityRef,
      input.authority.currentRateAuthorityRef)
    || !refsMatch
    || input.receipt.terminalOutcome !== expectedTerminalOutcome
    || input.receipt.actualUsage.providerCreateTime !==
      input.providerTimes.createTime
    || input.receipt.actualUsage.providerStartTime !==
      input.providerTimes.startTime
    || input.receipt.actualUsage.providerEndTime !== input.providerTimes.endTime
    || input.receipt.attemptStartedAt !== input.authority.admittedAt
  ) throw new Error('Vertex A100 existing cost receipt lineage differs.')
}

export function assertCanonicalA100VertexTerminalCostContext(
  value: unknown,
): CanonicalA100VertexTerminalCostContext {
  assertPlainSerializedData(value, 'vertex_a100_terminal_cost_context')
  const parsed = canonicalA100VertexTerminalCostContextSchema.parse(value)
  const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
    parsed.authority,
  )
  const { contextHash, ...payload } = parsed
  if (contextHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 terminal cost context digest is invalid.')
  }
  return { ...parsed, authority }
}

export function createCanonicalA100VertexTerminalCostContext(input: {
  readonly execution: CanonicalA100VertexCustomJobExecutionRecord
  readonly authority: CanonicalA100VertexCustomJobLaunchAuthority
}): CanonicalA100VertexTerminalCostContext {
  const execution = assertCanonicalA100VertexCustomJobExecutionRecord(
    input.execution,
  )
  const authority = assertCanonicalA100VertexCustomJobLaunchAuthority(
    input.authority,
  )
  const executionRef = ref(
    execution.executionRecordId,
    execution.executionRecordHash,
  )
  if (!sameRef(execution.authorityRef, ref(
    authority.authorityId,
    authority.authorityHash,
  )) || !sameRef(execution.releaseRef, authority.releaseRef)) {
    throw new Error('Vertex A100 terminal context authority differs.')
  }
  const payload = contextWithoutHashSchema.parse({
    schemaVersion: CANONICAL_A100_VERTEX_TERMINAL_COST_CONTEXT_VERSION,
    source:
      'canonical_server_a100_vertex_terminal_cost_context_repository',
    evidenceClass: 'canonical_private_reread',
    executionRef,
    authority,
    releaseRef: execution.releaseRef,
    exactApprovalSnapshotFrameTimingWorkLeaseReservationEstimateTriggerEnvelopeReleaseAndRateReread:
      true,
    callerUsageOutcomePriceCostOrReceiptIdAccepted: false,
    customerWalletOrLedgerMutationAuthorityGranted: false,
    preparedAt: execution.persistedAt,
  })
  return Object.freeze(assertCanonicalA100VertexTerminalCostContext({
    ...payload,
    contextHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalA100VertexWorkerUsageEvidence(
  value: unknown,
): CanonicalA100VertexWorkerUsageEvidence {
  assertPlainSerializedData(value, 'vertex_a100_worker_usage_evidence')
  const parsed = canonicalA100VertexWorkerUsageEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 worker usage digest is invalid.')
  }
  return parsed
}

export function assertCanonicalA100VertexPlatformUsageEvidence(
  value: unknown,
): CanonicalA100VertexPlatformUsageEvidence {
  assertPlainSerializedData(value, 'vertex_a100_platform_usage_evidence')
  const parsed = canonicalA100VertexPlatformUsageEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 platform usage digest is invalid.')
  }
  return parsed
}

async function persistAndRereadReceipt(
  receipt: CanonicalA100VertexProviderAllocationCostReceipt,
  store: CanonicalA100VertexAttemptCostReceiptStore,
): Promise<void> {
  const disposition = await store.createAttemptCostReceiptOnly({ receipt })
  if (disposition !== 'created' && disposition !== 'already_exists') {
    throw new Error('Vertex A100 cost receipt persistence failed.')
  }
  const reread = assertCanonicalA100VertexProviderAllocationCostReceipt(
    await store.rereadAttemptCostReceipt({ receiptId: receipt.receiptId }),
  )
  if (stableAuthorityStringify(reread) !== stableAuthorityStringify(receipt)) {
    throw new Error('Vertex A100 cost receipt exact reread changed.')
  }
}

function assertContext(input: {
  context: CanonicalA100VertexTerminalCostContext
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  execution: CanonicalA100VertexCustomJobExecutionRecord
  executionRef: z.infer<typeof evidenceRefSchema>
}): void {
  if (
    !sameRef(input.context.executionRef, input.executionRef)
    || !sameRef(input.context.releaseRef, input.execution.releaseRef)
    || !sameRef(input.execution.authorityRef, ref(
      input.authority.authorityId,
      input.authority.authorityHash,
    ))
    || !sameRef(input.execution.releaseRef, input.authority.releaseRef)
  ) throw new Error('Vertex A100 terminal cost context lineage differs.')
}

function assertWorker(input: {
  worker: CanonicalA100VertexWorkerUsageEvidence
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  executionRef: z.infer<typeof evidenceRefSchema>
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
  providerTimes: z.infer<typeof providerTimesSchema>
}): void {
  if (
    !sameRef(input.worker.executionRef, input.executionRef)
    || !sameRef(input.worker.authorityRef, ref(
      input.authority.authorityId,
      input.authority.authorityHash,
    ))
    || !sameRef(input.worker.cloudTerminalObservationRef,
      input.cloudTerminalObservationRef)
    || stableAuthorityStringify(input.worker.providerTimes) !==
      stableAuthorityStringify(input.providerTimes)
  ) throw new Error('Vertex A100 worker usage lineage differs.')
}

function assertPlatform(input: {
  platform: CanonicalA100VertexPlatformUsageEvidence
  authority: CanonicalA100VertexCustomJobLaunchAuthority
  executionRef: z.infer<typeof evidenceRefSchema>
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
  workerUsageEvidenceRef: z.infer<typeof evidenceRefSchema>
  providerTimes: z.infer<typeof providerTimesSchema>
}): void {
  if (
    !sameRef(input.platform.executionRef, input.executionRef)
    || !sameRef(input.platform.authorityRef, ref(
      input.authority.authorityId,
      input.authority.authorityHash,
    ))
    || !sameRef(input.platform.cloudTerminalObservationRef,
      input.cloudTerminalObservationRef)
    || !sameRef(input.platform.workerUsageEvidenceRef,
      input.workerUsageEvidenceRef)
    || stableAuthorityStringify(input.platform.providerTimes) !==
      stableAuthorityStringify(input.providerTimes)
  ) throw new Error('Vertex A100 platform usage lineage differs.')
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
