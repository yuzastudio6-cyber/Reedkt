import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  assertCanonicalSam31VertexSourceCheckpointWorkerResult,
  type CanonicalSam31VertexSourceCheckpointWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  calculateCanonicalA100VertexInfrastructureCost,
  canonicalA100VertexProviderAllocationUsageSchema,
  canonicalA100VertexInfrastructureCostSchema,
  createCanonicalA100VertexProviderAllocationUsage,
} from '../tool-cost-metering/canonical-a100-vertex-attempt-cost-authority'
import {
  assertCanonicalSam31VertexQualificationAdmission,
  assertCanonicalSam31VertexQualificationExecution,
  type CanonicalSam31VertexQualificationAdmissionRepository,
  type CanonicalSam31VertexQualificationExecutionRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import { assertPlainSerializedData } from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_PROVIDER_USAGE_VERSION =
  'canonical-sam3_1-vertex-qualification-provider-usage-v3' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_PLATFORM_STOP_VERSION =
  'canonical-sam3_1-vertex-qualification-platform-stop-v1' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_COST_RECEIPT_VERSION =
  'canonical-sam3_1-vertex-qualification-cost-receipt-v2' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_TERMINAL_RESULT_VERSION =
  'canonical-sam3_1-vertex-qualification-terminal-result-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com' as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const providerTimesSchema = z.object({
  createTime: timestamp,
  startTime: timestamp,
  endTime: timestamp,
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.startTime) < Date.parse(value.createTime)
    || Date.parse(value.endTime) <= Date.parse(value.startTime)
  ) context.addIssue({
    code: 'custom', message: 'Vertex qualification times are invalid.',
  })
})
const pendingStateSchema = z.enum([
  'JOB_STATE_QUEUED', 'JOB_STATE_PENDING', 'JOB_STATE_RUNNING',
  'JOB_STATE_UPDATING', 'JOB_STATE_CANCELLING', 'JOB_STATE_PAUSED',
])
const terminalStateSchema = z.enum([
  'JOB_STATE_SUCCEEDED', 'JOB_STATE_FAILED', 'JOB_STATE_CANCELLED',
  'JOB_STATE_EXPIRED',
])
const providerStateSchema = z.union([pendingStateSchema, terminalStateSchema])

const providerUsageWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_PROVIDER_USAGE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_provider_allocation_usage_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  executionRef: evidenceRefSchema,
  workerRequestRef: evidenceRefSchema,
  workerResultRef: evidenceRefSchema.nullable(),
  providerTimes: providerTimesSchema,
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed', 'not_executed', 'unknown',
  ]),
  actualUsage: canonicalA100VertexProviderAllocationUsageSchema,
  exactProviderCreateStartEndTimesReread: z.literal(true),
  exactRequestAndResultByteCountsReread: z.literal(true),
  objectStorageOperationCountsInventedOrWorkerSupplied: z.literal(false),
  provisionalCostExcludesUnreconciledObjectStorageOperations: z.literal(true),
  workerPhaseBreakdownClaimed: z.literal(false),
  workerSuppliedUsagePriceOrCostAccepted: z.literal(false),
  runtimeNetworkDownloadObserved: z.literal(false),
  cpuOnlySubstantiveExecutionObserved: z.literal(false),
  rawMediaPathsUrlsSecretsCredentialsOrBillingAccountIncluded:
    z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.actualUsage.providerCreateTime !== value.providerTimes.createTime
    || value.actualUsage.providerStartTime !== value.providerTimes.startTime
    || value.actualUsage.providerEndTime !== value.providerTimes.endTime
    || Date.parse(value.observedAt) < Date.parse(value.providerTimes.endTime)
    || (value.workerResultRef !== null
      && value.providerInferenceOrSubstantiveWorkOutcome !== 'executed')
  ) context.addIssue({
    code: 'custom', message: 'Vertex qualification provider usage is invalid.',
  })
})
export const canonicalSam31VertexQualificationProviderUsageSchema =
  providerUsageWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationProviderUsage = z.infer<
  typeof canonicalSam31VertexQualificationProviderUsageSchema
>

const platformStopWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_PLATFORM_STOP_VERSION,
  ),
  source: z.literal('canonical_server_vertex_qualification_platform_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptId: safeId,
  executionRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  providerTimes: providerTimesSchema,
  providerJobTerminalStateReread: z.literal(true),
  providerCapacityAndQuotaReread: z.literal(true),
  workerStoppedVerified: z.literal(true),
  activeA100GpuInstancesAfterObservation: z.literal(0),
  persistentEndpointPresent: z.literal(false),
  minimumIdleInstances: z.literal(0),
  exactOneShotA2UltraAllocationReread: z.literal(true),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(12),
  allocatedMemoryGiB: z.literal(170),
  bootDiskType: z.literal('pd-ssd'),
  bootDiskSizeGb: z.literal(200),
  callerCapacityStopUsagePriceOrCostClaimAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.observedAt) < Date.parse(value.providerTimes.endTime)) {
    context.addIssue({
      code: 'custom', message: 'Vertex qualification stop evidence is stale.',
    })
  }
})
export const canonicalSam31VertexQualificationPlatformStopSchema =
  platformStopWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationPlatformStop = z.infer<
  typeof canonicalSam31VertexQualificationPlatformStopSchema
>

const costReceiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_cost_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  receiptId: safeId,
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  cloudTerminalObservationRef: evidenceRefSchema,
  providerUsageEvidenceRef: evidenceRefSchema,
  platformStopEvidenceRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  terminalOutcome: z.enum([
    'completed', 'weeditpro_failed', 'canceled', 'expired',
  ]),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed', 'not_executed', 'unknown',
  ]),
  actualUsage: canonicalA100VertexProviderAllocationUsageSchema,
  actualInfrastructureCost: canonicalA100VertexInfrastructureCostSchema,
  billingAccountEffectiveVertexUsageSkuSetUsed: z.literal(true),
  billingAccountIdentifierIncluded: z.literal(false),
  customerEligibleInfrastructureCostUsdNanos: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  weeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  internalQualificationCostOnly: z.literal(true),
  serviceFeeIncluded: z.literal(false),
  customerWalletLedgerReservationOrCreditMutationPerformed: z.literal(false),
  exactProviderAllocationArtifactBytesAndCurrentAccountRateReread:
    z.literal(true),
  objectStorageOperationCostDeferredToCloudBillingInvoiceReconciliation:
    z.literal(true),
  provisionalInternalQualificationCost: z.literal(true),
  finalCloudBillingInvoiceReconciledCostClaimed: z.literal(false),
  activeA100GpuInstancesAfterTerminalAttempt: z.literal(0),
  automaticRetryAllowed: z.literal(false),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  recordedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.weeditproAbsorbedInfrastructureCostUsdNanos !==
      value.actualInfrastructureCost.totalInfrastructureCostUsdNanos
    || value.actualInfrastructureCost.objectClassAOperationsUsdNanos !== 0
    || value.actualInfrastructureCost.objectClassBOperationsUsdNanos !== 0
    || Date.parse(value.recordedAt) <
      Date.parse(value.actualUsage.providerEndTime)
  ) context.addIssue({
    code: 'custom', message: 'Vertex qualification cost is not reconciled.',
  })
})
export const canonicalSam31VertexQualificationCostReceiptSchema =
  costReceiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationCostReceipt = z.infer<
  typeof canonicalSam31VertexQualificationCostReceiptSchema
>

const terminalResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_TERMINAL_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_qualification_terminal_reconciliation',
  ),
  attemptId: safeId,
  admissionRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  workerRequestRef: evidenceRefSchema,
  disposition: z.enum([
    'pending', 'terminal', 'outcome_unknown_requires_reconciliation',
  ]),
  providerState: providerStateSchema.nullable(),
  terminalOutcome: z.enum([
    'completed', 'failed', 'canceled', 'expired',
  ]).nullable(),
  workerResultRef: evidenceRefSchema.nullable(),
  cloudTerminalObservationRef: evidenceRefSchema.nullable(),
  providerUsageEvidenceRef: evidenceRefSchema.nullable(),
  platformStopEvidenceRef: evidenceRefSchema.nullable(),
  currentAccountRateAuthorityRef: evidenceRefSchema.nullable(),
  costReceiptRef: evidenceRefSchema.nullable(),
  exactWorkerResultGenerationReread: z.boolean(),
  providerJobTerminalStateReread: z.boolean(),
  activeA100GpuInstancesAfterObservation: z.literal(0).nullable(),
  sourceCheckpointQualificationEvidenceReady: z.boolean(),
  checkbackAllowed: z.boolean(),
  retryAllowedWithoutCanonicalReconciliation: z.literal(false),
  minimumIdleInstances: z.literal(0),
  persistentEndpointPresent: z.literal(false),
  customerWalletLedgerReservationOrCreditMutationPerformed: z.literal(false),
  sourceCheckpointQualificationGranted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const terminalRefs = [
    value.cloudTerminalObservationRef, value.providerUsageEvidenceRef,
    value.platformStopEvidenceRef, value.currentAccountRateAuthorityRef,
    value.costReceiptRef,
  ]
  const succeeded = value.providerState === 'JOB_STATE_SUCCEEDED'
  const exact = value.disposition === 'terminal'
    ? value.terminalOutcome !== null
      && terminalStateSchema.safeParse(value.providerState).success
      && terminalRefs.every((refValue) => refValue !== null)
      && value.providerJobTerminalStateReread
      && value.activeA100GpuInstancesAfterObservation === 0
      && !value.checkbackAllowed
      && (succeeded
        ? value.workerResultRef !== null
          && value.exactWorkerResultGenerationReread
          && value.sourceCheckpointQualificationEvidenceReady
        : value.workerResultRef === null
          && !value.exactWorkerResultGenerationReread
          && !value.sourceCheckpointQualificationEvidenceReady)
    : value.disposition === 'pending'
      ? pendingStateSchema.safeParse(value.providerState).success
        && value.terminalOutcome === null
        && value.workerResultRef === null
        && terminalRefs.every((refValue) => refValue === null)
        && !value.exactWorkerResultGenerationReread
        && !value.providerJobTerminalStateReread
        && value.activeA100GpuInstancesAfterObservation === null
        && !value.sourceCheckpointQualificationEvidenceReady
        && value.checkbackAllowed
      : value.providerState === null && value.terminalOutcome === null
        && value.workerResultRef === null
        && terminalRefs.every((refValue) => refValue === null)
        && !value.exactWorkerResultGenerationReread
        && !value.providerJobTerminalStateReread
        && value.activeA100GpuInstancesAfterObservation === null
        && !value.sourceCheckpointQualificationEvidenceReady
        && !value.checkbackAllowed
  if (!exact) context.addIssue({
    code: 'custom', message: 'Vertex qualification terminal truth is invalid.',
  })
})
export const canonicalSam31VertexQualificationTerminalResultSchema =
  terminalResultWithoutHashSchema.extend({ resultHash: sha256 }).strict()
export type CanonicalSam31VertexQualificationTerminalResult = z.infer<
  typeof canonicalSam31VertexQualificationTerminalResultSchema
>

export interface CanonicalSam31VertexQualificationWorkerRequestReadPort {
  rereadExact(requestRef: z.infer<typeof evidenceRefSchema>): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationWorkerResultReadPort {
  rereadExact(input: {
    request: CanonicalSam31VertexSourceCheckpointWorkerRequest
    executionRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationProviderUsageReadPort {
  rereadExact(input: {
    request: CanonicalSam31VertexSourceCheckpointWorkerRequest
    executionRef: z.infer<typeof evidenceRefSchema>
    workerResultRef: z.infer<typeof evidenceRefSchema> | null
    workerResult: ReturnType<
      typeof assertCanonicalSam31VertexSourceCheckpointWorkerResult
    > | null
    providerTimes: z.infer<typeof providerTimesSchema>
    providerInferenceOrSubstantiveWorkOutcome:
      'executed' | 'not_executed' | 'unknown'
  }): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationPlatformStopReadPort {
  rereadExact(input: {
    attemptId: string
    executionRef: z.infer<typeof evidenceRefSchema>
    cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
    providerTimes: z.infer<typeof providerTimesSchema>
  }): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationRateReadPort {
  reread(input: {
    rateAuthorityRef: z.infer<typeof evidenceRefSchema>
    at: string
  }): Promise<unknown>
}
export interface CanonicalSam31VertexQualificationCostReceiptStore {
  createOnlyAndReread(
    value: CanonicalSam31VertexQualificationCostReceipt,
  ): Promise<unknown>
}
type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export function createCanonicalSam31VertexQualificationProviderUsage(
  input: {
    readonly attemptId: string
    readonly executionRef: z.input<typeof evidenceRefSchema>
    readonly workerRequestRef: z.input<typeof evidenceRefSchema>
    readonly workerResultRef: z.input<typeof evidenceRefSchema> | null
    readonly providerTimes: z.input<typeof providerTimesSchema>
    readonly providerInferenceOrSubstantiveWorkOutcome:
      'executed' | 'not_executed' | 'unknown'
    readonly privateArtifactBytes: number
    readonly privateArtifactRetentionMilliseconds: number
    readonly networkEgressBytes: number
    readonly observedAt: string
  },
): CanonicalSam31VertexQualificationProviderUsage {
  assertPlainSerializedData(input, 'sam31_vertex_provider_usage_input')
  const providerTimes = providerTimesSchema.parse(input.providerTimes)
  const actualUsage = createCanonicalA100VertexProviderAllocationUsage({
    providerCreateTime: providerTimes.createTime,
    providerStartTime: providerTimes.startTime,
    providerEndTime: providerTimes.endTime,
    privateArtifactBytes: input.privateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      input.privateArtifactRetentionMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
  })
  const payload = providerUsageWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_QUALIFICATION_PROVIDER_USAGE_VERSION,
    source:
      'canonical_server_sam3_1_vertex_provider_allocation_usage_owner',
    evidenceClass: 'canonical_private_reread',
    attemptId: input.attemptId,
    executionRef: input.executionRef,
    workerRequestRef: input.workerRequestRef,
    workerResultRef: input.workerResultRef,
    providerTimes,
    providerInferenceOrSubstantiveWorkOutcome:
      input.providerInferenceOrSubstantiveWorkOutcome,
    actualUsage,
    exactProviderCreateStartEndTimesReread: true,
    exactRequestAndResultByteCountsReread: true,
    objectStorageOperationCountsInventedOrWorkerSupplied: false,
    provisionalCostExcludesUnreconciledObjectStorageOperations: true,
    workerPhaseBreakdownClaimed: false,
    workerSuppliedUsagePriceOrCostAccepted: false,
    runtimeNetworkDownloadObserved: false,
    cpuOnlySubstantiveExecutionObserved: false,
    rawMediaPathsUrlsSecretsCredentialsOrBillingAccountIncluded: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexQualificationProviderUsageSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalSam31VertexQualificationTerminalReconciler(
  input: {
    admissionRepository: CanonicalSam31VertexQualificationAdmissionRepository
    executionRepository: CanonicalSam31VertexQualificationExecutionRepository
    requestReadPort: CanonicalSam31VertexQualificationWorkerRequestReadPort
    resultReadPort: CanonicalSam31VertexQualificationWorkerResultReadPort
    providerUsageReadPort:
      CanonicalSam31VertexQualificationProviderUsageReadPort
    platformStopReadPort:
      CanonicalSam31VertexQualificationPlatformStopReadPort
    rateReadPort: CanonicalSam31VertexQualificationRateReadPort
    costReceiptStore: CanonicalSam31VertexQualificationCostReceiptStore
    auth?: GoogleAuthRequest
    now?: () => string
    requestTimeoutMilliseconds?: number
  },
) {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new Error('Vertex qualification terminal timeout is invalid.')
  }
  return Object.freeze({
    async reconcileOne(value: { executionRef: unknown }):
    Promise<CanonicalSam31VertexQualificationTerminalResult> {
      const observedAt = now()
      let executionRef: z.infer<typeof evidenceRefSchema> | null = null
      let admissionRef: z.infer<typeof evidenceRefSchema> | null = null
      let workerRequestRef: z.infer<typeof evidenceRefSchema> | null = null
      let attemptId = 'sam31-vertex-unvalidated'
      try {
        assertPlainSerializedData(value, 'sam31_vertex_terminal_input')
        executionRef = evidenceRefSchema.parse(value.executionRef)
        const execution = assertCanonicalSam31VertexQualificationExecution(
          await input.executionRepository.reread(executionRef),
        )
        if (!sameRef(executionRef, ref(
          execution.executionId, execution.executionHash, 2,
        ))) throw new Error('Vertex qualification execution reread differs.')
        attemptId = execution.attemptId
        admissionRef = execution.admissionRef
        const admission = assertCanonicalSam31VertexQualificationAdmission(
          await input.admissionRepository.reread(admissionRef),
        )
        workerRequestRef = admission.workerRequestRef
        if (
          !sameRef(admissionRef, ref(admission.attemptId,
            admission.admissionHash))
          || admission.attemptId !== execution.attemptId
          || !sameRef(execution.admissionRef, admissionRef)
        ) throw new Error('Vertex qualification admission differs.')
        const request =
          assertCanonicalSam31VertexSourceCheckpointWorkerRequest(
            await input.requestReadPort.rereadExact(workerRequestRef),
          )
        if (
          request.attemptId !== attemptId
          || !sameRef(workerRequestRef, ref(
            request.qualificationId, request.requestHash, 2,
          ))
          || request.qualificationImage.immutableImageDigest !==
            admission.immutableImageDigest
        ) throw new Error('Vertex qualification request differs.')
        const response = await auth.request({
          url: `${API_ORIGIN}/v1/${execution.customJobResourceName}`,
          method: 'GET', timeout, retry: false, maxRedirects: 0,
          responseType: 'json', maxContentLength: 2 * 1024 * 1024,
        })
        const provider = parseProviderJob(response.data, execution)
        if (pendingStateSchema.safeParse(provider.state).success) {
          return terminalResult({
            attemptId, admissionRef, executionRef, workerRequestRef,
            disposition: 'pending', providerState: provider.state,
            terminalOutcome: null, workerResultRef: null,
            cloudTerminalObservationRef: null, providerUsageEvidenceRef: null,
            platformStopEvidenceRef: null, currentRateAuthorityRef: null,
            costReceiptRef: null, exactWorkerResultGenerationReread: false,
            observedAt,
          })
        }
        if (!provider.endTime) throw new Error(
          'Vertex qualification terminal response omitted end time.',
        )
        const providerTimes = providerTimesSchema.parse({
          createTime: provider.createTime,
          startTime: provider.startTime ?? provider.createTime,
          endTime: provider.endTime,
        })
        const terminalOutcome = provider.state === 'JOB_STATE_SUCCEEDED'
          ? 'completed' as const
          : provider.state === 'JOB_STATE_CANCELLED'
            ? 'canceled' as const
            : provider.state === 'JOB_STATE_EXPIRED'
              ? 'expired' as const : 'failed' as const
        const cloudTerminalObservationRef = opaqueRef(
          'sam31-vertex-terminal', { executionRef, provider },
        )
        let workerResultRef: z.infer<typeof evidenceRefSchema> | null = null
        let workerResult: ReturnType<
          typeof assertCanonicalSam31VertexSourceCheckpointWorkerResult
        > | null = null
        if (terminalOutcome === 'completed') {
          workerResult =
            assertCanonicalSam31VertexSourceCheckpointWorkerResult(
              await input.resultReadPort.rereadExact({ request, executionRef }),
            )
          assertWorkerResultMatchesRequest(workerResult, request, providerTimes)
          workerResultRef = ref(
            `sam31-vertex-worker-result-${workerResult.resultHash.slice(0, 32)}`,
            workerResult.resultHash,
          )
        }
        const providerUsage = assertProviderUsage(
          await input.providerUsageReadPort.rereadExact({
            request, executionRef, workerResultRef, workerResult,
            providerTimes,
            providerInferenceOrSubstantiveWorkOutcome:
              terminalOutcome === 'completed'
                ? 'executed'
                : provider.startTime === undefined
                  ? 'not_executed'
                  : 'unknown',
          }),
        )
        assertProviderUsageLineage({
          value: providerUsage, request, executionRef, workerResultRef,
          providerTimes, terminalOutcome,
        })
        const providerUsageEvidenceRef = ref(
          `sam31-vertex-provider-usage-${providerUsage.evidenceHash.slice(0, 32)}`,
          providerUsage.evidenceHash,
        )
        const platformStop = assertPlatformStop(
          await input.platformStopReadPort.rereadExact({
            attemptId, executionRef, cloudTerminalObservationRef,
            providerTimes,
          }),
        )
        assertPlatformStopLineage({
          value: platformStop, attemptId, executionRef,
          cloudTerminalObservationRef, providerTimes,
        })
        const platformStopEvidenceRef = ref(
          `sam31-vertex-platform-stop-${platformStop.evidenceHash.slice(0, 32)}`,
          platformStop.evidenceHash,
        )
        const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
          await input.rateReadPort.reread({
            rateAuthorityRef: admission.currentAccountRateAuthorityRef,
            at: observedAt,
          }),
          observedAt,
        )
        if (!sameRef(admission.currentAccountRateAuthorityRef, ref(
          rate.rateAuthorityId, rate.rateAuthorityHash,
          rate.rateAuthorityVersion,
        ))) throw new Error('Vertex qualification rate authority differs.')
        const usage = providerUsage.actualUsage
        const cost = calculateCanonicalA100VertexInfrastructureCost({
          rateAuthority: rate, usage, at: observedAt,
        })
        const costReceipt = createCostReceipt({
          attemptId, admissionRef, executionRef, cloudTerminalObservationRef,
          providerUsageEvidenceRef, platformStopEvidenceRef,
          currentAccountRateAuthorityRef: admission.currentAccountRateAuthorityRef,
          terminalOutcome, outcome:
            providerUsage.providerInferenceOrSubstantiveWorkOutcome,
          usage, cost, recordedAt: observedAt,
        })
        const persistedCost = assertCostReceipt(
          await input.costReceiptStore.createOnlyAndReread(costReceipt),
        )
        if (stableAuthorityStringify(persistedCost) !==
          stableAuthorityStringify(costReceipt)) {
          throw new Error('Vertex qualification cost reread changed.')
        }
        return terminalResult({
          attemptId, admissionRef, executionRef, workerRequestRef,
          disposition: 'terminal', providerState: provider.state,
          terminalOutcome, workerResultRef, cloudTerminalObservationRef,
          providerUsageEvidenceRef, platformStopEvidenceRef,
          currentRateAuthorityRef: admission.currentAccountRateAuthorityRef,
          costReceiptRef: ref(costReceipt.receiptId, costReceipt.receiptHash),
          exactWorkerResultGenerationReread: terminalOutcome === 'completed',
          observedAt,
        })
      } catch {
        const fallback = opaqueRef('sam31-vertex-unvalidated-terminal', {
          observedAt, attemptId,
        })
        return terminalResult({
          attemptId, admissionRef: admissionRef ?? fallback,
          executionRef: executionRef ?? fallback,
          workerRequestRef: workerRequestRef ?? fallback,
          disposition: 'outcome_unknown_requires_reconciliation',
          providerState: null, terminalOutcome: null, workerResultRef: null,
          cloudTerminalObservationRef: null, providerUsageEvidenceRef: null,
          platformStopEvidenceRef: null, currentRateAuthorityRef: null,
          costReceiptRef: null, exactWorkerResultGenerationReread: false,
          observedAt,
        })
      }
    },
  })
}

function parseProviderJob(value: unknown, execution: {
  customJobResourceName: string
  displayName: string
}) {
  assertPlainSerializedData(value, 'sam31_vertex_terminal_response')
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
    || (parsed.startTime && Date.parse(parsed.startTime) <
      Date.parse(parsed.createTime))
    || (parsed.endTime && Date.parse(parsed.endTime) <
      Date.parse(parsed.startTime ?? parsed.createTime))
  ) throw new Error('Vertex qualification provider state/time differs.')
  return parsed
}

function assertWorkerResultMatchesRequest(
  result: ReturnType<
    typeof assertCanonicalSam31VertexSourceCheckpointWorkerResult
  >,
  request: CanonicalSam31VertexSourceCheckpointWorkerRequest,
  times: z.infer<typeof providerTimesSchema>,
) {
  if (
    result.attemptId !== request.attemptId
    || result.qualificationId !== request.qualificationId
    || !sameRef(result.requestRef, ref(
      request.qualificationId, request.requestHash, 2,
    ))
    || result.qualificationImage.immutableImageDigest !==
      request.qualificationImage.immutableImageDigest
    || Date.parse(result.completedAt) < Date.parse(times.startTime)
    || Date.parse(result.completedAt) > Date.parse(times.endTime)
  ) throw new Error('Vertex qualification worker result differs.')
}

function assertProviderUsage(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_provider_usage')
  const parsed = canonicalSam31VertexQualificationProviderUsageSchema
    .parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification provider usage hash differs.')
  }
  return parsed
}

function assertPlatformStop(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_platform_stop')
  const parsed = canonicalSam31VertexQualificationPlatformStopSchema
    .parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification platform stop hash differs.')
  }
  return parsed
}

function assertProviderUsageLineage(input: {
  value: CanonicalSam31VertexQualificationProviderUsage
  request: CanonicalSam31VertexSourceCheckpointWorkerRequest
  executionRef: z.infer<typeof evidenceRefSchema>
  workerResultRef: z.infer<typeof evidenceRefSchema> | null
  providerTimes: z.infer<typeof providerTimesSchema>
  terminalOutcome: 'completed' | 'failed' | 'canceled' | 'expired'
}) {
  if (
    input.value.attemptId !== input.request.attemptId
    || !sameRef(input.value.executionRef, input.executionRef)
    || !sameRef(input.value.workerRequestRef, ref(
      input.request.qualificationId, input.request.requestHash, 2,
    ))
    || !sameNullableRef(input.value.workerResultRef, input.workerResultRef)
    || stableAuthorityStringify(input.value.providerTimes) !==
      stableAuthorityStringify(input.providerTimes)
    || (input.terminalOutcome === 'completed'
      && input.value.providerInferenceOrSubstantiveWorkOutcome !== 'executed')
    || (input.terminalOutcome !== 'completed'
      && input.value.providerInferenceOrSubstantiveWorkOutcome === 'executed')
  ) throw new Error('Vertex qualification provider usage lineage differs.')
}

function assertPlatformStopLineage(input: {
  value: CanonicalSam31VertexQualificationPlatformStop
  attemptId: string
  executionRef: z.infer<typeof evidenceRefSchema>
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
  providerTimes: z.infer<typeof providerTimesSchema>
}) {
  if (
    input.value.attemptId !== input.attemptId
    || !sameRef(input.value.executionRef, input.executionRef)
    || !sameRef(input.value.cloudTerminalObservationRef,
      input.cloudTerminalObservationRef)
    || stableAuthorityStringify(input.value.providerTimes) !==
      stableAuthorityStringify(input.providerTimes)
  ) throw new Error('Vertex qualification platform stop lineage differs.')
}

function createCostReceipt(input: {
  attemptId: string
  admissionRef: z.infer<typeof evidenceRefSchema>
  executionRef: z.infer<typeof evidenceRefSchema>
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema>
  providerUsageEvidenceRef: z.infer<typeof evidenceRefSchema>
  platformStopEvidenceRef: z.infer<typeof evidenceRefSchema>
  currentAccountRateAuthorityRef: z.infer<typeof evidenceRefSchema>
  terminalOutcome: 'completed' | 'failed' | 'canceled' | 'expired'
  outcome: 'executed' | 'not_executed' | 'unknown'
  usage: z.infer<typeof canonicalA100VertexProviderAllocationUsageSchema>
  cost: z.infer<typeof canonicalA100VertexInfrastructureCostSchema>
  recordedAt: string
}) {
  const payload = costReceiptWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_COST_RECEIPT_VERSION,
    source: 'canonical_server_sam3_1_vertex_qualification_cost_owner',
    evidenceClass: 'canonical_private_reread',
    receiptId: `sam31-vertex-qualification-cost-${sha256AuthorityValue({
      attemptId: input.attemptId, executionRef: input.executionRef,
    }).slice(0, 40)}`,
    attemptId: input.attemptId,
    admissionRef: input.admissionRef,
    executionRef: input.executionRef,
    cloudTerminalObservationRef: input.cloudTerminalObservationRef,
    providerUsageEvidenceRef: input.providerUsageEvidenceRef,
    platformStopEvidenceRef: input.platformStopEvidenceRef,
    currentAccountRateAuthorityRef: input.currentAccountRateAuthorityRef,
    terminalOutcome: input.terminalOutcome === 'failed'
      ? 'weeditpro_failed' : input.terminalOutcome,
    providerInferenceOrSubstantiveWorkOutcome: input.outcome,
    actualUsage: input.usage,
    actualInfrastructureCost: input.cost,
    billingAccountEffectiveVertexUsageSkuSetUsed: true,
    billingAccountIdentifierIncluded: false,
    customerEligibleInfrastructureCostUsdNanos: 0,
    customerEligibleToolCostCredits: 0,
    weeditproAbsorbedInfrastructureCostUsdNanos:
      input.cost.totalInfrastructureCostUsdNanos,
    internalQualificationCostOnly: true,
    serviceFeeIncluded: false,
    customerWalletLedgerReservationOrCreditMutationPerformed: false,
    exactProviderAllocationArtifactBytesAndCurrentAccountRateReread: true,
    objectStorageOperationCostDeferredToCloudBillingInvoiceReconciliation:
      true,
    provisionalInternalQualificationCost: true,
    finalCloudBillingInvoiceReconciledCostClaimed: false,
    activeA100GpuInstancesAfterTerminalAttempt: 0,
    automaticRetryAllowed: false,
    cloudBillingInvoiceReconciliationRequired: true,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    recordedAt: input.recordedAt,
  })
  return canonicalSam31VertexQualificationCostReceiptSchema.parse({
    ...payload, receiptHash: sha256AuthorityValue(payload),
  })
}

function assertCostReceipt(value: unknown) {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_cost')
  const parsed = canonicalSam31VertexQualificationCostReceiptSchema.parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification cost receipt hash differs.')
  }
  return parsed
}

function terminalResult(input: {
  attemptId: string
  admissionRef: z.infer<typeof evidenceRefSchema>
  executionRef: z.infer<typeof evidenceRefSchema>
  workerRequestRef: z.infer<typeof evidenceRefSchema>
  disposition: CanonicalSam31VertexQualificationTerminalResult['disposition']
  providerState: z.infer<typeof providerStateSchema> | null
  terminalOutcome: CanonicalSam31VertexQualificationTerminalResult[
    'terminalOutcome'
  ]
  workerResultRef: z.infer<typeof evidenceRefSchema> | null
  cloudTerminalObservationRef: z.infer<typeof evidenceRefSchema> | null
  providerUsageEvidenceRef: z.infer<typeof evidenceRefSchema> | null
  platformStopEvidenceRef: z.infer<typeof evidenceRefSchema> | null
  currentRateAuthorityRef: z.infer<typeof evidenceRefSchema> | null
  costReceiptRef: z.infer<typeof evidenceRefSchema> | null
  exactWorkerResultGenerationReread: boolean
  observedAt: string
}) {
  const terminal = input.disposition === 'terminal'
  const pending = input.disposition === 'pending'
  const ready = terminal && input.terminalOutcome === 'completed'
  const payload = terminalResultWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_TERMINAL_RESULT_VERSION,
    source:
      'canonical_server_sam3_1_vertex_qualification_terminal_reconciliation',
    attemptId: input.attemptId,
    admissionRef: input.admissionRef,
    executionRef: input.executionRef,
    workerRequestRef: input.workerRequestRef,
    disposition: input.disposition,
    providerState: input.providerState,
    terminalOutcome: input.terminalOutcome,
    workerResultRef: input.workerResultRef,
    cloudTerminalObservationRef: input.cloudTerminalObservationRef,
    providerUsageEvidenceRef: input.providerUsageEvidenceRef,
    platformStopEvidenceRef: input.platformStopEvidenceRef,
    currentAccountRateAuthorityRef: input.currentRateAuthorityRef,
    costReceiptRef: input.costReceiptRef,
    exactWorkerResultGenerationReread:
      input.exactWorkerResultGenerationReread,
    providerJobTerminalStateReread: terminal,
    activeA100GpuInstancesAfterObservation: terminal ? 0 : null,
    sourceCheckpointQualificationEvidenceReady: ready,
    checkbackAllowed: pending,
    retryAllowedWithoutCanonicalReconciliation: false,
    minimumIdleInstances: 0,
    persistentEndpointPresent: false,
    customerWalletLedgerReservationOrCreditMutationPerformed: false,
    sourceCheckpointQualificationGranted: false,
    runtimeReleaseGranted: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionReady: false,
    observedAt: input.observedAt,
  })
  return canonicalSam31VertexQualificationTerminalResultSchema.parse({
    ...payload, resultHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id, version, contentHash: `sha256:${hash}`,
  })
}

function opaqueRef(id: string, value: unknown) {
  const hash = sha256AuthorityValue(value)
  return ref(`${id}.${hash.slice(0, 32)}`, hash)
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameNullableRef(
  left: z.infer<typeof evidenceRefSchema> | null,
  right: z.infer<typeof evidenceRefSchema> | null,
) {
  return left === null || right === null ? left === right : sameRef(left, right)
}
