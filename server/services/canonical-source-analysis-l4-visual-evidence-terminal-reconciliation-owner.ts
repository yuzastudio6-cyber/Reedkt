import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  canonicalProfessionalGpuInfrastructureCostSchema,
  canonicalProfessionalToolGpuUsageSchema,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort,
} from './canonical-source-analysis-l4-visual-evidence-admission-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
  CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord,
} from './canonical-source-analysis-l4-visual-evidence-authority-repository'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
} from './canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from './canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_RECONCILIATION_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-terminal-reconciliation-owner-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-terminal-observation-port-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_VERSION =
  'canonical-source-analysis-l4-visual-evidence-terminal-observation-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_COST_RECEIPT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-attempt-cost-receipt-v1' as const

const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-terminal-reconciliation'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const cloudRunJobResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/reeditpro-professional-l4$/u,
)
const cloudRunOperationResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
)
const cloudRunExecutionResourceSchema = z.string().regex(
  /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/reeditpro-professional-l4\/executions\/[A-Za-z0-9._-]+$/u,
)

const terminalObservationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_VERSION,
  ),
  source: z.literal('google_cloud_run_v2_terminal_execution_reread'),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  cloudRunOperationResource: cloudRunOperationResourceSchema,
  cloudRunJobResource: cloudRunJobResourceSchema,
  cloudRunExecutionResource: cloudRunExecutionResourceSchema,
  executionCreateTime: timestamp,
  executionStartTime: timestamp,
  executionCompletionTime: timestamp,
  taskCount: z.literal(1),
  runningCount: z.literal(0),
  succeededCount: z.literal(1),
  failedCount: z.literal(0),
  cancelledCount: z.literal(0),
  retriedCount: z.literal(0),
  reconciling: z.literal(false),
  cloudRunOperationDone: z.literal(true),
  terminalWorkerStopped: z.literal(true),
  terminalGpuInstanceCount: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  exactOperationAndExecutionRereadVerified: z.literal(true),
  providerRedirectFollowed: z.literal(false),
  callerTerminalFieldsAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.executionStartTime) < Date.parse(value.executionCreateTime)
    || Date.parse(value.executionCompletionTime) <
      Date.parse(value.executionStartTime)
    || Date.parse(value.observedAt) < Date.parse(value.executionCompletionTime)
  ) context.addIssue({
    code: 'custom',
    message: 'Cloud Run terminal execution timestamps are inconsistent.',
  })
})
const terminalObservationSchema = terminalObservationWithoutDigestSchema.extend({
  terminalObservationDigestSha256: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceTerminalObservation =
  z.infer<typeof terminalObservationSchema>

export interface CanonicalSourceAnalysisL4VisualEvidenceTerminalObservationPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_PORT_VERSION
  readTerminalExecution(input: Readonly<{
    invocationId: string
    cloudRunOperationResource: string
    cloudRunJobResource: string
  }>): Promise<unknown | null>
}

const costReceiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_COST_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_visual_evidence_terminal_usage_and_account_price_reconciliation',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  envelopeRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema,
  workerEvidenceRef: evidenceRefSchema,
  terminalObservationRef: evidenceRefSchema,
  admissionAccountEffectiveRateAuthorityRef: evidenceRefSchema,
  terminalAccountEffectiveRateAuthorityRef: evidenceRefSchema,
  terminalAccountEffectiveRateAuthority: z.custom<
    CanonicalCurrentGoogleCloudGpuRateAuthority
  >(),
  actualUsage: canonicalProfessionalToolGpuUsageSchema,
  actualInfrastructureCost:
    canonicalProfessionalGpuInfrastructureCostSchema,
  maximumPlatformInternalCostUsdNanos: positiveInteger,
  platformInternalCostWithinAdmittedCap: z.literal(true),
  platformFundedPreapprovalAnalysis: z.literal(true),
  customerEligibleInfrastructureCostUsdNanos: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  accountEffectivePricingRereadVerified: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  exactPlatformUsageAndCurrentRateReread: z.literal(true),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  terminalWorkerStopped: z.literal(true),
  terminalGpuInstanceCount: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()
const costReceiptSchema = costReceiptWithoutDigestSchema.extend({
  costReceiptDigestSha256: rawSha256,
}).strict()
type CanonicalSourceAnalysisL4VisualEvidenceAttemptCostReceipt = z.infer<
  typeof costReceiptSchema
>
const costRecordWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_RECONCILIATION_OWNER_VERSION,
  ),
  recordKind: z.literal('attempt_cost_receipt'),
  receipt: costReceiptSchema,
}).strict()
const costRecordSchema = costRecordWithoutDigestSchema.extend({
  recordDigestSha256: rawSha256,
}).strict()

export type CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'source_visual_evidence_worker_envelope_not_ready'
        | 'source_visual_evidence_admission_not_ready'
        | 'source_visual_evidence_release_not_ready'
        | 'source_visual_evidence_cloud_operation_not_ready'
        | 'source_visual_evidence_worker_evidence_not_ready'
        | 'source_visual_evidence_cloud_terminal_not_ready'
        | 'source_visual_evidence_current_rate_not_ready'
      terminalEvidencePersisted: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      invocationId: string
      terminalObservationRef: VisualIntelligenceEvidenceRef
      attemptCostEvidenceRef: VisualIntelligenceEvidenceRef
      resultDigestSha256: string
      exactTerminalEvidencePersistedAndReread: true
      accountEffectivePricingRereadVerified: true
      scaleBackToZeroVerified: true
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_RECONCILIATION_OWNER_VERSION
  readonly customerCreditMutationAllowed: false
  readonly publicListPriceSettlementAllowed: false
  readonly workerMayClaimTerminalOrScaleToZero: false
  reconcileOneShot(invocationId: string): Promise<
    CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationResult
  >
}

export function createGoogleCloudRunL4VisualEvidenceTerminalObservationPort(
  input: Readonly<{
    auth?: Pick<GoogleAuth, 'request'>
    now?: () => string
    requestTimeoutMilliseconds?: number
  }> = {},
): CanonicalSourceAnalysisL4VisualEvidenceTerminalObservationPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new TypeError('L4 terminal observation timeout is invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_PORT_VERSION,
    async readTerminalExecution(untrusted: Readonly<{
      invocationId: string
      cloudRunOperationResource: string
      cloudRunJobResource: string
    }>) {
      assertPlainSerializedData(untrusted, 'l4_terminal_observation_input')
      const request = z.object({
        invocationId: safeId,
        cloudRunOperationResource: cloudRunOperationResourceSchema,
        cloudRunJobResource: cloudRunJobResourceSchema,
      }).strict().parse(untrusted)
      const response = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/${request.cloudRunOperationResource}`,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(response.data, 'l4_terminal_operation_response')
      const operation = z.object({
        name: cloudRunOperationResourceSchema,
        done: z.boolean().optional().default(false),
        error: z.unknown().optional(),
        response: z.unknown().optional(),
      }).passthrough().parse(response.data)
      if (operation.name !== request.cloudRunOperationResource) {
        throw conflict('source_visual_evidence_terminal_operation_mismatch')
      }
      if (!operation.done) return null
      if (operation.error !== undefined || operation.response === undefined) {
        throw conflict('source_visual_evidence_terminal_execution_failed')
      }
      assertPlainSerializedData(
        operation.response,
        'l4_terminal_execution_response',
      )
      const executionSchema = z.object({
        '@type': z.literal(
          'type.googleapis.com/google.cloud.run.v2.Execution',
        ).optional(),
        name: cloudRunExecutionResourceSchema,
        job: cloudRunJobResourceSchema,
        createTime: timestamp,
        startTime: timestamp,
        completionTime: timestamp,
        taskCount: z.literal(1),
        reconciling: z.literal(false),
        runningCount: z.literal(0),
        succeededCount: z.literal(1),
        failedCount: z.literal(0),
        cancelledCount: z.literal(0),
        retriedCount: z.literal(0),
      }).passthrough()
      const embeddedExecution = executionSchema.parse(operation.response)
      if (embeddedExecution.job !== request.cloudRunJobResource) {
        throw conflict('source_visual_evidence_terminal_job_mismatch')
      }
      const executionResponse = await auth.request({
        url: `${CLOUD_RUN_API_ORIGIN}/v2/${embeddedExecution.name}`,
        method: 'GET',
        timeout,
        retry: false,
        maxRedirects: 0,
      })
      assertPlainSerializedData(
        executionResponse.data,
        'l4_terminal_execution_exact_reread',
      )
      const execution = executionSchema.parse(executionResponse.data)
      if (
        execution.job !== request.cloudRunJobResource
        || stableAuthorityStringify(terminalExecutionFields(execution)) !==
          stableAuthorityStringify(terminalExecutionFields(embeddedExecution))
      ) throw conflict('source_visual_evidence_terminal_execution_mismatch')
      return createTerminalObservation({
        invocationId: request.invocationId,
        cloudRunOperationResource: request.cloudRunOperationResource,
        cloudRunJobResource: request.cloudRunJobResource,
        cloudRunExecutionResource: execution.name,
        executionCreateTime: execution.createTime,
        executionStartTime: execution.startTime,
        executionCompletionTime: execution.completionTime,
        taskCount: 1,
        runningCount: 0,
        succeededCount: 1,
        failedCount: 0,
        cancelledCount: 0,
        retriedCount: 0,
        reconciling: false,
        cloudRunOperationDone: true,
        terminalWorkerStopped: true,
        terminalGpuInstanceCount: 0,
        scaleBackToZeroVerified: true,
        exactOperationAndExecutionRereadVerified: true,
        providerRedirectFollowed: false,
        callerTerminalFieldsAccepted: false,
        observedAt: now(),
      })
    },
  })
}

function terminalExecutionFields(value: Readonly<{
  name: string
  job: string
  createTime: string
  startTime: string
  completionTime: string
  taskCount: 1
  reconciling: false
  runningCount: 0
  succeededCount: 1
  failedCount: 0
  cancelledCount: 0
  retriedCount: 0
}>) {
  return Object.freeze({
    name: value.name,
    job: value.job,
    createTime: value.createTime,
    startTime: value.startTime,
    completionTime: value.completionTime,
    taskCount: value.taskCount,
    reconciling: value.reconciling,
    runningCount: value.runningCount,
    succeededCount: value.succeededCount,
    failedCount: value.failedCount,
    cancelledCount: value.cancelledCount,
    retriedCount: value.retriedCount,
  })
}

export function createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner(
  input: Readonly<{
    workerEnvelopeReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort
    authorityRepository:
      CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
    workerEvidenceOwner:
      CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner
    terminalObservationPort:
      CanonicalSourceAnalysisL4VisualEvidenceTerminalObservationPort
    currentRateReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort
    objectPort: CanonicalCreateOnlyJsonObjectPort
    prefix?: string
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner {
  validateDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readCostReceipt = createCostReceiptReader(input.objectPort, prefix)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_RECONCILIATION_OWNER_VERSION,
    customerCreditMutationAllowed: false as const,
    publicListPriceSettlementAllowed: false as const,
    workerMayClaimTerminalOrScaleToZero: false as const,
    async reconcileOneShot(untrustedInvocationId: string) {
      const invocationId = safeId.parse(untrustedInvocationId)
      const consumed = await input.workerEnvelopeReadPort
        .readExactConsumedEnvelope(invocationId)
      if (!consumed) return notReady(
        'source_visual_evidence_worker_envelope_not_ready',
      )
      const admission = await input.authorityRepository.readExactAdmission({
        triggerRef: consumed.envelope.triggerRef,
        admissionRef: consumed.envelope.admissionRef,
      })
      if (!admission) return notReady(
        'source_visual_evidence_admission_not_ready',
      )
      const release = await input.authorityRepository.readExactRelease(
        consumed.envelope.releaseRef,
      )
      if (!release) return notReady(
        'source_visual_evidence_release_not_ready',
      )
      const operation = await input.authorityRepository
        .cloudRunOperationAuthorityPort.readExactAcceptedOperation({
          invocationId,
          releaseRef: release.releaseRef,
        })
      if (!operation) return notReady(
        'source_visual_evidence_cloud_operation_not_ready',
      )
      const workerRaw = await input.workerEvidenceOwner.readExact(invocationId)
      if (!workerRaw) return notReady(
        'source_visual_evidence_worker_evidence_not_ready',
      )
      const worker = assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence(
        workerRaw,
      )
      assertWorkerBindings({ worker, consumed, admission, release, operation })
      const observationRaw = await input.terminalObservationPort
        .readTerminalExecution({
          invocationId,
          cloudRunOperationResource: operation.operationResource,
          cloudRunJobResource: operation.cloudRunJobResource,
        })
      if (!observationRaw) return notReady(
        'source_visual_evidence_cloud_terminal_not_ready',
      )
      const observation = assertTerminalObservation(observationRaw)
      assertTerminalBindings({ observation, operation, worker })
      const rateRaw = await input.currentRateReadPort
        .rereadCurrentL4StandardRate({
          routeId: 'l4_standard_primary',
          region: 'us-central1',
          currency: 'USD',
          at: observation.observedAt,
        })
      if (!rateRaw) return notReady(
        'source_visual_evidence_current_rate_not_ready',
      )
      const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        rateRaw,
        observation.observedAt,
      )
      assertRateBindings(rate)
      const actualUsage = actualUsageFor({ worker, observation })
      const actualInfrastructureCost =
        calculateCanonicalProfessionalGpuInfrastructureCost({
          rateAuthority: rate,
          usage: actualUsage,
          observedAt: observation.observedAt,
        })
      if (actualInfrastructureCost.totalInfrastructureCostUsdNanos >
        admission.maximumPlatformInternalCostUsdNanos) {
        throw conflict('source_visual_evidence_actual_cost_exceeded_cap')
      }
      const terminalObservationRef = ref(
        `${invocationId}.cloud-run-terminal`,
        observation.terminalObservationDigestSha256,
      )
      const workerEvidenceRef = ref(
        `${invocationId}.worker-evidence`,
        worker.workerEvidenceDigestSha256,
      )
      const receipt = createCostReceipt({
        invocationId,
        envelopeRef: consumed.envelopeRef,
        consumptionRef: consumed.consumptionRef,
        admissionRef: consumed.envelope.admissionRef,
        releaseRef: release.releaseRef,
        cloudRunOperationRef: operation.cloudRunOperationRef,
        workerEvidenceRef,
        terminalObservationRef,
        admissionAccountEffectiveRateAuthorityRef:
          admission.currentAccountRateAuthorityRef,
        terminalAccountEffectiveRateAuthorityRef: rateAuthorityRef(rate),
        terminalAccountEffectiveRateAuthority: rate,
        actualUsage,
        actualInfrastructureCost,
        maximumPlatformInternalCostUsdNanos:
          admission.maximumPlatformInternalCostUsdNanos,
        platformInternalCostWithinAdmittedCap: true,
        platformFundedPreapprovalAnalysis: true,
        customerEligibleInfrastructureCostUsdNanos: 0,
        customerEligibleToolCostCredits: 0,
        serviceFeeIncluded: false,
        accountEffectivePricingRereadVerified: true,
        publicListPriceUsedAsSettlementAuthority: false,
        exactPlatformUsageAndCurrentRateReread: true,
        cloudBillingInvoiceReconciliationRequired: true,
        customerCreditsMutated: false,
        systemFailureOrUnknownCostChargedToCustomer: false,
        unapprovedOverageChargedToCustomer: false,
        terminalWorkerStopped: true,
        terminalGpuInstanceCount: 0,
        scaleBackToZeroVerified: true,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
        observedAt: observation.observedAt,
      })
      const persistedCost = await persistCostReceipt({
        objectPort: input.objectPort,
        prefix,
        receipt,
        readCostReceipt,
      })
      const attemptCostEvidenceRef = ref(
        `${invocationId}.account-effective-cost`,
        receipt.costReceiptDigestSha256,
      )
      const {
        exactGenerationEtagChecksumAndLengthRereadRequired:
          ignoredSourceRereadRequirement,
        ...terminalSourceObject
      } = consumed.envelope.sourceObject
      void ignoredSourceRereadRequirement
      const result = createCanonicalSourceAnalysisL4VisualEvidenceResult({
        scope: consumed.envelope.scope,
        sourceObject: {
          ...terminalSourceObject,
          exactGenerationEtagChecksumAndLengthRereadVerified: true,
        },
        operationId: consumed.envelope.operationId,
        routeProfileId: consumed.envelope.routeProfileId,
        acceleratorClass: 'nvidia_l4',
        cloudRunJobName: 'reeditpro-professional-l4',
        invocationId,
        admissionRef: consumed.envelope.admissionRef,
        runtimeReleaseRef: release.releaseRef,
        cloudRunExecutionRef: operation.cloudRunOperationRef,
        platformEstimateRef: admission.platformEstimateRef,
        admissionAccountEffectivePricingAuthorityRef:
          admission.currentAccountRateAuthorityRef,
        terminalAccountEffectivePricingAuthorityRef: rateAuthorityRef(rate),
        attemptCostEvidenceRef,
        maximumPlatformInternalCostUsdNanos:
          admission.maximumPlatformInternalCostUsdNanos,
        actualPlatformInternalCostUsdNanos:
          actualInfrastructureCost.totalInfrastructureCostUsdNanos,
        accountEffectivePricingRereadVerified: true,
        publicListPriceUsedAsSettlementAuthority: false,
        platformInternalCostWithinAdmittedCap: true,
        toolEvidence: worker.toolEvidence,
        userTriggeredScaleFromZero: true,
        minimumIdleInstances: 0,
        terminalCloudRunExecutionObserved: true,
        terminalWorkerStopped: true,
        scaleBackToZeroVerified: true,
        maximumAttempts: 1,
        uncertainOutcomeRetryAllowed: false,
        runtimeNetworkDownloadPerformed: false,
        exactSourceReleaseExecutionAndCostRereadVerified: true,
        privateEvidencePersistedAndReread: true,
        browserOrCallerEvidenceAccepted: false,
        callerPathUrlBytesCommandOrEnvironmentAccepted: false,
        customerCreditMutated: false,
        systemFailureChargedToCustomer: false,
        unapprovedOverageChargedToCustomer: false,
        directProviderCallMade: false,
        directTimelineMutationPerformed: false,
        qaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      })
      const persistedTerminal = await input.authorityRepository
        .persistTerminalCreateOnly({
          invocationId,
          envelopeHash: consumed.envelope.envelopeHash,
          admissionRef: consumed.envelope.admissionRef,
          releaseRef: release.releaseRef,
          result,
        })
      return Object.freeze({
        status: 'ready' as const,
        disposition: persistedTerminal.disposition === 'identical_replay'
          || persistedCost === 'identical_replay'
          ? 'identical_replay' as const
          : 'created' as const,
        invocationId,
        terminalObservationRef,
        attemptCostEvidenceRef,
        resultDigestSha256: result.resultDigestSha256,
        exactTerminalEvidencePersistedAndReread: true as const,
        accountEffectivePricingRereadVerified: true as const,
        scaleBackToZeroVerified: true as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function createTerminalObservation(
  input: Omit<z.input<typeof terminalObservationWithoutDigestSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSourceAnalysisL4VisualEvidenceTerminalObservation {
  const payload = terminalObservationWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_VERSION,
    source: 'google_cloud_run_v2_terminal_execution_reread',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  return assertTerminalObservation({
    ...payload,
    terminalObservationDigestSha256: sha256AuthorityValue(payload),
  })
}

function assertTerminalObservation(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceTerminalObservation {
  assertPlainSerializedData(value, 'source_visual_evidence_terminal_observation')
  const observation = terminalObservationSchema.parse(value)
  const { terminalObservationDigestSha256, ...payload } = observation
  if (terminalObservationDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_terminal_observation_invalid')
  }
  return Object.freeze(observation)
}

function createCostReceipt(
  input: Omit<z.input<typeof costReceiptWithoutDigestSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSourceAnalysisL4VisualEvidenceAttemptCostReceipt {
  const payload = costReceiptWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_COST_RECEIPT_VERSION,
    source:
      'canonical_visual_evidence_terminal_usage_and_account_price_reconciliation',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  return assertCostReceipt({
    ...payload,
    costReceiptDigestSha256: sha256AuthorityValue(payload),
  })
}

function assertCostReceipt(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceAttemptCostReceipt {
  assertPlainSerializedData(value, 'source_visual_evidence_cost_receipt')
  const receipt = costReceiptSchema.parse(value)
  const { costReceiptDigestSha256, ...payload } = receipt
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    receipt.terminalAccountEffectiveRateAuthority,
    receipt.observedAt,
  )
  const expectedCost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage: receipt.actualUsage,
    observedAt: receipt.observedAt,
  })
  if (
    costReceiptDigestSha256 !== sha256AuthorityValue(payload)
    || receipt.actualInfrastructureCost.totalInfrastructureCostUsdNanos >
      receipt.maximumPlatformInternalCostUsdNanos
    || !sameRef(
      receipt.terminalAccountEffectiveRateAuthorityRef,
      rateAuthorityRef(rate),
    )
    || stableAuthorityStringify(receipt.actualInfrastructureCost) !==
      stableAuthorityStringify(expectedCost)
  ) throw conflict('source_visual_evidence_cost_receipt_invalid')
  return Object.freeze(receipt)
}

function actualUsageFor(input: Readonly<{
  worker: CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence
  observation: CanonicalSourceAnalysisL4VisualEvidenceTerminalObservation
}>): CanonicalProfessionalToolGpuUsage {
  const createAt = Date.parse(input.observation.executionCreateTime)
  const startAt = Date.parse(input.observation.executionStartTime)
  const completeAt = Date.parse(input.observation.executionCompletionTime)
  const workerStartedAt = Date.parse(input.worker.workerStartedAt)
  const workerCompletedAt = Date.parse(input.worker.workerCompletedAt)
  if (
    workerStartedAt < startAt
    || workerCompletedAt > completeAt
    || workerCompletedAt < workerStartedAt
  ) throw conflict('source_visual_evidence_worker_timing_invalid')
  return canonicalProfessionalToolGpuUsageSchema.parse({
    coldStartMilliseconds: workerStartedAt - createAt,
    runtimeAndModelLoadMilliseconds: 0,
    activeGpuMilliseconds: input.worker.activeExecutionMilliseconds,
    drainAndShutdownMilliseconds: completeAt - workerCompletedAt,
    totalBillableMilliseconds: completeAt - createAt,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: input.worker.persistedPrivateArtifactBytes,
    privateArtifactRetentionMilliseconds:
      PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: input.worker.classAOperationCount,
    classBOperationCount: input.worker.classBOperationCount,
  })
}

function assertWorkerBindings(input: Readonly<{
  worker: CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence
  consumed: NonNullable<Awaited<ReturnType<
    CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort[
      'readExactConsumedEnvelope'
    ]
  >>>
  admission: NonNullable<Awaited<ReturnType<
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
      'readExactAdmission'
    ]
  >>>
  release: NonNullable<Awaited<ReturnType<
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
      'readExactRelease'
    ]
  >>>
  operation: CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord
}>): void {
  if (
    input.worker.invocationId !== input.consumed.envelope.invocationId
    || !sameRef(input.worker.envelopeRef, input.consumed.envelopeRef)
    || !sameRef(input.worker.consumptionRef, input.consumed.consumptionRef)
    || !sameRef(input.worker.admissionRef, input.consumed.envelope.admissionRef)
    || !sameRef(input.worker.releaseRef, input.release.releaseRef)
    || !sameRef(input.worker.cloudRunOperationRef,
      input.operation.cloudRunOperationRef)
    || input.worker.sourceObjectIdentityDigestSha256 !==
      sha256AuthorityValue(input.consumed.envelope.sourceObject)
    || !sameRef(input.admission.runtimeReleaseRef, input.release.releaseRef)
    || input.worker.terminalCloudRunExecutionClaimed
    || input.worker.scaleBackToZeroClaimedByWorker
    || input.worker.accountEffectiveCostClaimedByWorker
    || input.worker.customerCreditMutated
  ) throw conflict('source_visual_evidence_terminal_worker_binding_invalid')
}

function assertTerminalBindings(input: Readonly<{
  observation: CanonicalSourceAnalysisL4VisualEvidenceTerminalObservation
  operation: CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord
  worker: CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence
}>): void {
  if (
    input.observation.invocationId !== input.worker.invocationId
    || input.observation.cloudRunOperationResource !==
      input.operation.operationResource
    || input.observation.cloudRunJobResource !==
      input.operation.cloudRunJobResource
    || !input.observation.terminalWorkerStopped
    || input.observation.terminalGpuInstanceCount !== 0
    || !input.observation.scaleBackToZeroVerified
  ) throw conflict('source_visual_evidence_terminal_observation_mismatch')
}

function assertRateBindings(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
): void {
  if (
    rate.routeId !== 'l4_standard_primary'
    || rate.profileId !== 'quality_l4_user_triggered_standard_media_job_v1'
    || rate.routeRole !== 'standard_primary'
    || rate.executionTarget !== 'google_cloud_run_l4_job'
    || rate.machineType !== 'cloud_run_nvidia_l4'
    || rate.accelerator !== 'nvidia_l4'
    || rate.region !== 'us-central1'
    || rate.currency !== 'USD'
    || rate.customerPricingOrServiceFeeAuthorityGranted
    || rate.walletOrCreditMutationAuthorityGranted
  ) throw conflict('source_visual_evidence_terminal_rate_mismatch')
}

function createCostReceiptReader(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
) {
  return async (invocationId: string) => {
    const body = await objectPort.readExact(`${prefix}/${invocationId}.json`)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('source_visual_evidence_cost_record_bytes_invalid')
    }
    let parsed: unknown
    try { parsed = JSON.parse(body.toString('utf8')) } catch {
      throw conflict('source_visual_evidence_cost_record_json_invalid')
    }
    assertPlainSerializedData(parsed, 'source_visual_evidence_cost_record')
    const record = costRecordSchema.parse(parsed)
    const { recordDigestSha256, ...payload } = record
    if (
      record.receipt.invocationId !== invocationId
      || recordDigestSha256 !== sha256AuthorityValue(payload)
      || body.toString('utf8') !== stableAuthorityStringify(record)
    ) throw conflict('source_visual_evidence_cost_record_invalid')
    return structuredClone(assertCostReceipt(record.receipt))
  }
}

async function persistCostReceipt(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix: string
  receipt: CanonicalSourceAnalysisL4VisualEvidenceAttemptCostReceipt
  readCostReceipt: ReturnType<typeof createCostReceiptReader>
}>): Promise<'created' | 'identical_replay'> {
  const payload = costRecordWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_RECONCILIATION_OWNER_VERSION,
    recordKind: 'attempt_cost_receipt',
    receipt: input.receipt,
  })
  const record = costRecordSchema.parse({
    ...payload,
    recordDigestSha256: sha256AuthorityValue(payload),
  })
  const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
  const created = await input.objectPort.createOnly({
    objectPath: `${input.prefix}/${input.receipt.invocationId}.json`,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.readCostReceipt(input.receipt.invocationId)
  if (!reread || stableAuthorityStringify(reread) !==
    stableAuthorityStringify(input.receipt)) {
    throw conflict('source_visual_evidence_cost_record_reread_mismatch')
  }
  return created === 'created' ? 'created' : 'identical_replay'
}

function rateAuthorityRef(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  })
}

function ref(id: string, hash: string): VisualIntelligenceEvidenceRef {
  return Object.freeze({ id, version: 1, contentHash: `sha256:${hash}` })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u.test(prefix)) {
    throw new TypeError('L4 terminal reconciliation prefix is invalid.')
  }
  return prefix
}

function validateDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner
>[0]): void {
  if (
    typeof input.workerEnvelopeReadPort?.readExactConsumedEnvelope !==
      'function'
    || typeof input.authorityRepository?.readExactAdmission !== 'function'
    || typeof input.authorityRepository?.readExactRelease !== 'function'
    || typeof input.authorityRepository?.persistTerminalCreateOnly !==
      'function'
    || typeof input.workerEvidenceOwner?.readExact !== 'function'
    || input.terminalObservationPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TERMINAL_OBSERVATION_PORT_VERSION
    || typeof input.terminalObservationPort.readTerminalExecution !== 'function'
    || typeof input.currentRateReadPort?.rereadCurrentL4StandardRate !==
      'function'
    || typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw new TypeError('L4 terminal reconciliation dependencies are invalid.')
}

function notReady(
  blockerCode: Extract<
    CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationResult,
    { status: 'not_ready' }
  >['blockerCode'],
): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationResult,
  { status: 'not_ready' }
> {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    terminalEvidencePersisted: false as const,
    customerCreditMutated: false as const,
  })
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The L4 source visual-evidence terminal reconciliation conflicts with authority.',
    409,
    { requiredGate },
  )
}
