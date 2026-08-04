import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalFasterWhisperLargeV3ModelArtifactSource,
} from '../model-artifacts/canonical-faster-whisper-large-v3-model-artifact-source'
import {
  CANONICAL_A100_SOURCE_TRANSCRIPT_MODEL_COST_PROFILE_ID,
  CANONICAL_A100_SOURCE_TRANSCRIPT_OPERATION_ID,
  CANONICAL_A100_SOURCE_TRANSCRIPT_PROFILE_ID,
  assertCanonicalA100BatchInvocationResult,
  assertCanonicalA100BatchReleaseObservation,
  type CanonicalA100BatchInvocationResult,
  type CanonicalA100BatchJobInvocationPort,
  type CanonicalA100BatchReleaseObservation,
} from './canonical-a100-batch-job-invocation-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSourceAnalysisRequestAuthorityReadPort,
} from './canonical-source-led-orchestra-planning-reconciliation'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisPlanningScope,
  verifyCanonicalSourceAnalysisPreparedRequestForPlanning,
  type CanonicalSourceAnalysisPlanningScope,
} from './canonical-source-led-orchestra-planning-reconciliation'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
  canonicalSourceLedTranscriptEvidenceSchema,
  createCanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from './canonical-source-led-professional-content-analysis-port'
import {
  CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisFinalizedAuthority,
  type CanonicalSourceAnalysisFinalizedAuthority,
  type CanonicalSourceAnalysisFinalizedAuthorityExpectation,
  type CanonicalSourceAnalysisFinalizedAuthorityReadPort,
} from './canonical-source-analysis-preparation-owner'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceTranscriptOrchestraRepository,
} from './canonical-source-transcript-orchestra-repository'
import {
  verifyCanonicalVisualIntelligenceSourceTranscriptResult,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  canonicalProfessionalGpuInfrastructureCostSchema,
  canonicalProfessionalToolGpuUsageSchema,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'

export const CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION =
  'canonical-source-transcript-a100-attempt-owner-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_TRIGGER_VERSION =
  'canonical-source-transcript-trigger-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_ADMISSION_VERSION =
  'canonical-source-transcript-admission-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_VERSION =
  'canonical-source-transcript-a100-worker-result-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_VERSION =
  'canonical-source-transcript-a100-usage-cost-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION =
  'canonical-source-transcript-a100-worker-result-read-port-v1' as const
export const CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION =
  'canonical-source-transcript-a100-usage-cost-read-port-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/source-transcript-a100-attempts'
const MAXIMUM_RECORD_BYTES = 64 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const triggerWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOURCE_TRANSCRIPT_TRIGGER_VERSION),
  source: z.literal('authenticated_server_source_transcript_trigger'),
  requestId: safeId,
  planningScope: z.unknown(),
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  triggeredAt: timestamp,
  serverPreparedRequestRequired: z.literal(true),
  browserSourceOrTranscriptAuthorityAccepted: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutationAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const triggerSchema = triggerWithoutHashSchema.extend({
  triggerHash: rawSha256,
}).strict()

export interface CanonicalSourceTranscriptTrigger extends Omit<
  z.infer<typeof triggerSchema>,
  'planningScope'
> {
  readonly planningScope: CanonicalSourceAnalysisPlanningScope
}

const sourceContextSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  analysisRunId: safeId,
  requestDigestSha256: rawSha256,
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  uploadedOrder: positiveInteger.max(8),
  checksumSha256: rawSha256,
  byteLength: positiveInteger,
  durationFrames: positiveInteger,
  storageGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  storageEtag: z.string().trim().min(1).max(1_024),
  hasAudio: z.boolean(),
  sourceFrameAuthority: canonicalSourceLedSourceFrameAuthoritySchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  sourceProbeAuthorityRef: evidenceRefSchema,
  sourceAnalysisConsentRef: evidenceRefSchema,
  platformAnalysisCostCapRef: evidenceRefSchema,
}).strict()
export type CanonicalSourceTranscriptSourceContext = z.infer<
  typeof sourceContextSchema
>

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOURCE_TRANSCRIPT_ADMISSION_VERSION),
  source: z.literal('canonical_server_source_transcript_admission_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  admissionId: safeId,
  triggerRef: evidenceRefSchema,
  sourceContext: sourceContextSchema,
  preparedRequestContentRef: evidenceRefSchema,
  platformEstimateRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  operationId: z.literal(CANONICAL_A100_SOURCE_TRANSCRIPT_OPERATION_ID),
  routeProfileId: z.literal(CANONICAL_A100_SOURCE_TRANSCRIPT_PROFILE_ID),
  modelCostProfileId: z.literal(
    CANONICAL_A100_SOURCE_TRANSCRIPT_MODEL_COST_PROFILE_ID,
  ),
  routeId: z.literal('a100_80gb_heavy_primary'),
  maximumAttempts: z.literal(1),
  attemptOrdinal: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  createOnlyConsumptionRequiredBeforeBatchCreate: z.literal(true),
  exactPreparedFinalizedProbeConsentCostRateAndReleaseReread:
    z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  platformFundedPreapprovalAnalysis: z.literal(true),
  maximumPlatformInternalCostUsdNanos: positiveInteger,
  customerCreditReservationRequired: z.literal(false),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  l4FallbackMayBeSelectedByThisAdmission: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.admittedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Source transcript admission expiry is invalid.',
    })
  }
})
const admissionSchema = admissionWithoutHashSchema.extend({
  admissionHash: rawSha256,
}).strict()
export type CanonicalSourceTranscriptAdmission = z.infer<
  typeof admissionSchema
>

const workerResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_VERSION,
  ),
  source: z.literal('canonical_a100_source_transcript_worker'),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  invocationResultRef: evidenceRefSchema,
  sourceContext: sourceContextSchema,
  workerRuntimeRecordRef: evidenceRefSchema,
  privateTranscriptArtifactRef: evidenceRefSchema,
  modelManifestRef: evidenceRefSchema,
  transcript: canonicalSourceLedTranscriptEvidenceSchema,
  execution: z.object({
    exactInvocationSourceGenerationAndProbeRereadVerified: z.literal(true),
    completeAudioTimelineProcessed: z.literal(true),
    cudaInferenceUsed: z.literal(true),
    a100DeviceVerified: z.literal(true),
    fp16Used: z.literal(true),
    wordTimestampsProduced: z.literal(true),
    modelBytesPinnedBeforeExecution: z.literal(true),
    runtimeNetworkDownloadPerformed: z.literal(false),
    cpuInferenceFallbackUsed: z.literal(false),
    rawAudioPersisted: z.literal(false),
    sourceBytesRead: positiveInteger,
    privateArtifactBytes: positiveInteger,
    workerActiveMilliseconds: positiveInteger.max(3_600_000),
    modelLoadMilliseconds: nonnegativeInteger.max(3_600_000),
    gpuActiveMilliseconds: positiveInteger.max(3_600_000),
    classAOperationCount: nonnegativeInteger,
    classBOperationCount: nonnegativeInteger,
  }).strict().superRefine((value, context) => {
    if (
      value.gpuActiveMilliseconds > value.workerActiveMilliseconds
      || value.modelLoadMilliseconds > value.workerActiveMilliseconds
      || value.modelLoadMilliseconds + value.gpuActiveMilliseconds !==
        value.workerActiveMilliseconds
    ) context.addIssue({
      code: 'custom',
      message: 'Source transcript worker timing is inconsistent.',
    })
  }),
  sourceBytesIncluded: z.literal(false),
  rawAudioBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const workerResultSchema = workerResultWithoutHashSchema.extend({
  workerResultHash: rawSha256,
}).strict()
export type CanonicalSourceTranscriptA100WorkerResult = z.infer<
  typeof workerResultSchema
>

const usageCostWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_VERSION,
  ),
  source: z.literal(
    'canonical_google_cloud_usage_and_account_effective_pricing_reread',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  invocationResultRef: evidenceRefSchema,
  cloudBatchTerminalObservationRef: evidenceRefSchema,
  cloudCapacityTeardownObservationRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  platformUsageRereadRef: evidenceRefSchema,
  attemptCostEvidenceRef: evidenceRefSchema,
  accountEffectiveRateAuthority: z.custom<
    CanonicalCurrentGoogleCloudGpuRateAuthority
  >(),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  actualUsage: canonicalProfessionalToolGpuUsageSchema,
  actualInfrastructureCost:
    canonicalProfessionalGpuInfrastructureCostSchema,
  exactPlatformUsageReread: z.literal(true),
  exactCurrentBillingAccountPriceReread: z.literal(true),
  accountEffectiveCostRecorded: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  platformFundedPreapprovalAnalysis: z.literal(true),
  customerEligibleToolCostUsdNanos: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  terminalGpuInstanceCount: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  observedAt: timestamp,
}).strict()
const usageCostSchema = usageCostWithoutHashSchema.extend({
  usageCostHash: rawSha256,
}).strict()
export type CanonicalSourceTranscriptA100UsageCost = z.infer<
  typeof usageCostSchema
>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal('canonical-source-transcript-a100-consumption-v1'),
  source: z.literal('canonical_source_transcript_a100_attempt_owner'),
  invocationId: safeId,
  triggerRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  sourceContext: sourceContextSchema,
  idempotencyKey: safeId,
  consumedBeforeBatchCreate: z.literal(true),
  maximumAttempts: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  consumedAt: timestamp,
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict()
type TranscriptConsumption = z.infer<typeof consumptionSchema>

export interface CanonicalSourceTranscriptAdmissionReadPort {
  readonly schemaVersion: 'canonical-source-transcript-admission-read-port-v1'
  rereadAdmittedTranscript(input: Readonly<{
    trigger: CanonicalSourceTranscriptTrigger
    sourceContext: CanonicalSourceTranscriptSourceContext
    finalizedAuthority: CanonicalSourceAnalysisFinalizedAuthority
  }>): Promise<unknown | null>
}

export interface CanonicalSourceTranscriptA100ReleaseReadPort {
  readonly schemaVersion:
    'canonical-source-transcript-a100-release-read-port-v1'
  rereadPrivateA100TranscriptRelease(input: Readonly<{
    admission: CanonicalSourceTranscriptAdmission
  }>): Promise<unknown | null>
}

export interface CanonicalSourceTranscriptA100WorkerResultReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION
  readCompletedWorkerResult(input: Readonly<{
    invocationId: string
    invocationResultRef: VisualIntelligenceEvidenceRef
  }>): Promise<unknown | null>
}

export interface CanonicalSourceTranscriptA100UsageCostReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION
  readCompletedUsageCost(input: Readonly<{
    invocationId: string
    invocationResultRef: VisualIntelligenceEvidenceRef
    terminalState: 'SUCCEEDED' | 'FAILED'
  }>): Promise<unknown | null>
}

export type CanonicalSourceTranscriptA100AttemptResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_source_analysis_request_not_ready'
        | 'canonical_finalized_source_authority_not_ready'
        | 'canonical_source_transcript_admission_not_ready'
        | 'canonical_source_transcript_a100_release_not_ready'
      gpuJobStarted: false
      automaticRetryAllowed: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'reconciliation_required'
      blockerCode:
        | 'source_transcript_a100_outcome_unknown'
        | 'source_transcript_a100_worker_result_not_ready'
        | 'source_transcript_a100_terminal_cost_not_ready'
      invocationId: string
      automaticRetryAllowed: false
      unknownOutcomeChargedToCustomer: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'failed'
      blockerCode: 'source_transcript_a100_attempt_failed'
      invocationId: string
      attemptCostEvidenceRef: VisualIntelligenceEvidenceRef
      automaticRetryAllowed: false
      l4FallbackAutomaticallyDispatched: false
      failureChargedToCustomer: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      invocationId: string | null
      transcriptAuthorityRef: VisualIntelligenceEvidenceRef
      attemptCostEvidenceRef: VisualIntelligenceEvidenceRef | null
      exactTranscriptRereadVerified: true
      scaleBackToZeroVerified: true
      platformFundedPreapprovalAnalysis: true
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceTranscriptA100AttemptOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION
  readonly operationId: typeof CANONICAL_A100_SOURCE_TRANSCRIPT_OPERATION_ID
  readonly routeProfileId: typeof CANONICAL_A100_SOURCE_TRANSCRIPT_PROFILE_ID
  readonly acceleratorClass: 'nvidia_a100_80gb'
  readonly userTriggeredScaleFromZero: true
  readonly minimumIdleInstances: 0
  readonly maximumAttempts: 1
  readonly automaticRetryAfterUncertainOutcomeAllowed: false
  readonly cpuInferenceFallbackAllowed: false
  readonly l4FallbackRequiresSeparateClassifiedAdmission: true
  readonly platformFundedPreapprovalAnalysis: true
  readonly customerCreditMutationAllowed: false
  executeOneShot(
    trigger: CanonicalSourceTranscriptTrigger,
  ): Promise<CanonicalSourceTranscriptA100AttemptResult>
}

export function createCanonicalSourceTranscriptTrigger(input: Omit<
  CanonicalSourceTranscriptTrigger,
  'schemaVersion' | 'source' | 'triggerHash'
>): CanonicalSourceTranscriptTrigger {
  assertPlainSerializedData(input, 'source_transcript_trigger_input')
  const planningScope = verifyCanonicalSourceAnalysisPlanningScope(
    input.planningScope,
  )
  const payload = triggerWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_TRIGGER_VERSION,
    source: 'authenticated_server_source_transcript_trigger',
    ...input,
    planningScope,
  })
  return Object.freeze({
    ...payload,
    planningScope,
    triggerHash: sha256AuthorityValue(payload),
  }) as CanonicalSourceTranscriptTrigger
}

export function assertCanonicalSourceTranscriptTrigger(
  value: unknown,
): CanonicalSourceTranscriptTrigger {
  assertPlainSerializedData(value, 'source_transcript_trigger')
  const parsed = triggerSchema.parse(value)
  const planningScope = verifyCanonicalSourceAnalysisPlanningScope(
    parsed.planningScope,
  )
  const normalized = { ...parsed, planningScope }
  const { triggerHash, ...payload } = normalized
  if (triggerHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_transcript_trigger_hash_invalid')
  }
  return Object.freeze(normalized) as CanonicalSourceTranscriptTrigger
}

export function createCanonicalSourceTranscriptAdmission(input: Omit<
  CanonicalSourceTranscriptAdmission,
  'schemaVersion' | 'source' | 'evidenceClass' | 'admissionHash'
>): CanonicalSourceTranscriptAdmission {
  assertPlainSerializedData(input, 'source_transcript_admission_input')
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ADMISSION_VERSION,
    source: 'canonical_server_source_transcript_admission_owner',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  return Object.freeze(admissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceTranscriptAdmission(
  value: unknown,
  at?: string,
): CanonicalSourceTranscriptAdmission {
  assertPlainSerializedData(value, 'source_transcript_admission')
  const parsed = admissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (
    admissionHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.admittedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw conflict('source_transcript_admission_invalid')
  return Object.freeze(parsed)
}

export function createCanonicalSourceTranscriptA100WorkerResult(input: Omit<
  CanonicalSourceTranscriptA100WorkerResult,
  'schemaVersion' | 'source' | 'evidenceClass' | 'workerResultHash'
>): CanonicalSourceTranscriptA100WorkerResult {
  assertPlainSerializedData(input, 'source_transcript_worker_result_input')
  const payload = workerResultWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_VERSION,
    source: 'canonical_a100_source_transcript_worker',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  assertWorkerTranscript(payload)
  return Object.freeze(workerResultSchema.parse({
    ...payload,
    workerResultHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceTranscriptA100WorkerResult(
  value: unknown,
): CanonicalSourceTranscriptA100WorkerResult {
  assertPlainSerializedData(value, 'source_transcript_worker_result')
  const parsed = workerResultSchema.parse(value)
  const { workerResultHash, ...payload } = parsed
  if (workerResultHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_transcript_worker_result_hash_invalid')
  }
  assertWorkerTranscript(payload)
  return Object.freeze(parsed)
}

export function createCanonicalSourceTranscriptA100UsageCost(input: Omit<
  CanonicalSourceTranscriptA100UsageCost,
  'schemaVersion' | 'source' | 'evidenceClass' | 'actualInfrastructureCost'
    | 'usageCostHash'
>): CanonicalSourceTranscriptA100UsageCost {
  assertPlainSerializedData(input, 'source_transcript_usage_cost_input')
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.accountEffectiveRateAuthority,
    input.observedAt,
  )
  const actualInfrastructureCost =
    calculateCanonicalProfessionalGpuInfrastructureCost({
      rateAuthority: rate,
      usage: input.actualUsage,
      observedAt: input.observedAt,
    })
  const payload = usageCostWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_VERSION,
    source:
      'canonical_google_cloud_usage_and_account_effective_pricing_reread',
    evidenceClass: 'canonical_private_reread',
    ...input,
    accountEffectiveRateAuthority: rate,
    actualInfrastructureCost,
  })
  return Object.freeze(usageCostSchema.parse({
    ...payload,
    usageCostHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceTranscriptA100UsageCost(
  value: unknown,
): CanonicalSourceTranscriptA100UsageCost {
  assertPlainSerializedData(value, 'source_transcript_usage_cost')
  const parsed = usageCostSchema.parse(value)
  const { usageCostHash, ...payload } = parsed
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    parsed.accountEffectiveRateAuthority,
    parsed.observedAt,
  )
  const expectedCost = calculateCanonicalProfessionalGpuInfrastructureCost({
    rateAuthority: rate,
    usage: parsed.actualUsage,
    observedAt: parsed.observedAt,
  })
  if (
    usageCostHash !== sha256AuthorityValue(payload)
    || rate.routeId !== 'a100_80gb_heavy_primary'
    || stableAuthorityStringify(expectedCost) !==
      stableAuthorityStringify(parsed.actualInfrastructureCost)
  ) throw conflict('source_transcript_usage_cost_invalid')
  return Object.freeze(parsed)
}

/**
 * Owns one exact A100 source-transcript attempt. A create-only consumption is
 * persisted before Google Batch is called. A restart reconciles the same
 * deterministic Batch job and never issues a second create after an uncertain
 * outcome. Successful transcript evidence is published only after worker,
 * account-price, attempt-cost, and scale-to-zero rereads all agree.
 */
export function createCanonicalSourceTranscriptA100AttemptOwner(input: {
  readonly requestAuthorityReadPort:
    CanonicalSourceAnalysisRequestAuthorityReadPort
  readonly finalizedAuthorityReadPort:
    CanonicalSourceAnalysisFinalizedAuthorityReadPort
  readonly admissionReadPort: CanonicalSourceTranscriptAdmissionReadPort
  readonly releaseReadPort: CanonicalSourceTranscriptA100ReleaseReadPort
  readonly invocationPort: CanonicalA100BatchJobInvocationPort
  readonly workerResultReadPort:
    CanonicalSourceTranscriptA100WorkerResultReadPort
  readonly usageCostReadPort: CanonicalSourceTranscriptA100UsageCostReadPort
  readonly transcriptRepository: CanonicalSourceTranscriptOrchestraRepository
  readonly lifecycleObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
  readonly now?: () => Date
}): CanonicalSourceTranscriptA100AttemptOwner {
  validateDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_A100_ATTEMPT_OWNER_VERSION,
    operationId: CANONICAL_A100_SOURCE_TRANSCRIPT_OPERATION_ID,
    routeProfileId: CANONICAL_A100_SOURCE_TRANSCRIPT_PROFILE_ID,
    acceleratorClass: 'nvidia_a100_80gb' as const,
    userTriggeredScaleFromZero: true as const,
    minimumIdleInstances: 0 as const,
    maximumAttempts: 1 as const,
    automaticRetryAfterUncertainOutcomeAllowed: false as const,
    cpuInferenceFallbackAllowed: false as const,
    l4FallbackRequiresSeparateClassifiedAdmission: true as const,
    platformFundedPreapprovalAnalysis: true as const,
    customerCreditMutationAllowed: false as const,
    async executeOneShot(
      untrustedTrigger: CanonicalSourceTranscriptTrigger,
    ) {
      const trigger = assertCanonicalSourceTranscriptTrigger(untrustedTrigger)
      const prepared = await input.requestAuthorityReadPort
        .readExactPreparedRequest(trigger.planningScope)
      if (!prepared) return notReadyResult(
        'canonical_source_analysis_request_not_ready',
      )
      const identity = verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
        scope: trigger.planningScope,
        request: prepared,
      })
      const source = identity.request.sources.find((candidate) =>
        candidate.sourceSequenceItemId === trigger.sourceSequenceItemId
        && candidate.mediaAssetId === trigger.mediaAssetId)
      if (!source) throw conflict('source_transcript_trigger_source_missing')
      const expectation = finalizedExpectation(identity.request, source)
      const finalizedRaw = await input.finalizedAuthorityReadPort
        .readExactFinalizedSource(expectation)
      if (!finalizedRaw) return notReadyResult(
        'canonical_finalized_source_authority_not_ready',
      )
      const finalized = verifyCanonicalSourceAnalysisFinalizedAuthority({
        untrusted: finalizedRaw,
        expected: expectation,
      })
      const sourceContext = createSourceContext({
        request: identity.request,
        requestDigestSha256: identity.requestDigest,
        analysisRunId: identity.analysisRunId,
        source,
        finalized,
      })
      const repositoryScope = transcriptRepositoryScope(sourceContext)
      const existing = await input.transcriptRepository.readCompleted(
        repositoryScope,
      )
      if (existing) return readyResult({
        disposition: 'identical_replay',
        invocationId: existing.execution.completedAttemptReceiptRef
          ? invocationIdFor(trigger, sourceContext) : null,
        result: existing,
        attemptCostEvidenceRef:
          existing.execution.attemptCostEvidenceRefs[0] ?? null,
      })

      if (!sourceContext.hasAudio) {
        const noAudioResult = noAudioTranscriptResult(sourceContext)
        const persisted = await input.transcriptRepository.persistCreateOnly({
          scope: repositoryScope,
          source,
          result: noAudioResult,
        })
        return readyResult({
          disposition: persisted.disposition,
          invocationId: null,
          result: noAudioResult,
          attemptCostEvidenceRef: null,
        })
      }

      const startedAt = now().toISOString()
      const admissionRaw = await input.admissionReadPort
        .rereadAdmittedTranscript({ trigger, sourceContext, finalizedAuthority: finalized })
      if (!admissionRaw) return notReadyResult(
        'canonical_source_transcript_admission_not_ready',
      )
      const admission = assertCanonicalSourceTranscriptAdmission(
        admissionRaw,
        startedAt,
      )
      assertAdmissionMatches({
        admission,
        trigger,
        sourceContext,
      })
      const releaseRaw = await input.releaseReadPort
        .rereadPrivateA100TranscriptRelease({ admission })
      if (!releaseRaw) return notReadyResult(
        'canonical_source_transcript_a100_release_not_ready',
      )
      const release = assertCanonicalA100BatchReleaseObservation(releaseRaw)
      assertReleaseMatchesAdmission({ release, admission })
      const invocationId = invocationIdFor(trigger, sourceContext)
      const consumption = buildConsumption({
        trigger,
        admission,
        release,
        sourceContext,
        invocationId,
        consumedAt: startedAt,
      })
      const consumptionDisposition = await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'consumptions', invocationId),
        record: consumption,
        parse: assertConsumption,
      })
      const consumptionRef = ref(
        `source-transcript-a100-consumption-${consumption.consumptionHash.slice(0, 32)}`,
        consumption.consumptionHash,
      )

      let invocation: CanonicalA100BatchInvocationResult
      try {
        const untrustedInvocation = consumptionDisposition === 'created'
          ? await input.invocationPort.runOnce({
              invocationId,
              release,
              durableDispatchConsumptionRef: consumptionRef,
              durableDispatchConsumptionRereadVerified: true,
            })
          : await input.invocationPort.reconcileExisting({
              invocationId,
              release,
              durableDispatchConsumptionRef: consumptionRef,
              durableDispatchConsumptionRereadVerified: true,
            })
        invocation = assertCanonicalA100BatchInvocationResult({
          untrusted: untrustedInvocation,
          invocationId,
          release,
          durableDispatchConsumptionRef: consumptionRef,
        })
      } catch (error) {
        if (unknownAttemptOutcome(error)) return reconciliationResult(
          'source_transcript_a100_outcome_unknown',
          invocationId,
        )
        throw error
      }
      await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'invocations', invocationId),
        record: invocation,
        parse: (value) => assertCanonicalA100BatchInvocationResult({
          untrusted: value,
          invocationId,
          release,
          durableDispatchConsumptionRef: consumptionRef,
        }),
      })
      const invocationResultRef = invocationRef(invocation)
      const usageRaw = await input.usageCostReadPort.readCompletedUsageCost({
        invocationId,
        invocationResultRef,
        terminalState: invocation.terminalState,
      })
      if (!usageRaw) return reconciliationResult(
        'source_transcript_a100_terminal_cost_not_ready',
        invocationId,
      )
      const usage = assertCanonicalSourceTranscriptA100UsageCost(usageRaw)
      assertUsageMatches({
        usage,
        admission,
        release,
        invocation,
        invocationResultRef,
      })
      if (invocation.terminalState === 'FAILED') return Object.freeze({
        status: 'failed' as const,
        blockerCode: 'source_transcript_a100_attempt_failed' as const,
        invocationId,
        attemptCostEvidenceRef: cloneRef(usage.attemptCostEvidenceRef),
        automaticRetryAllowed: false as const,
        l4FallbackAutomaticallyDispatched: false as const,
        failureChargedToCustomer: false as const,
        customerCreditMutated: false as const,
      })

      const workerRaw = await input.workerResultReadPort
        .readCompletedWorkerResult({ invocationId, invocationResultRef })
      if (!workerRaw) return reconciliationResult(
        'source_transcript_a100_worker_result_not_ready',
        invocationId,
      )
      const worker = assertCanonicalSourceTranscriptA100WorkerResult(workerRaw)
      assertWorkerMatches({
        worker,
        invocationId,
        admission,
        release,
        invocationResultRef,
        sourceContext,
      })
      assertWorkerUsageMatches({ worker, usage })
      if (usage.providerInferenceOrSubstantiveWorkOutcome !== 'executed') {
        throw conflict('source_transcript_success_cost_outcome_invalid')
      }
      const result = verifyCanonicalVisualIntelligenceSourceTranscriptResult(
        source,
        buildCompletedTranscriptResult({ worker, invocation, release, usage }),
      )
      const persisted = await input.transcriptRepository.persistCreateOnly({
        scope: repositoryScope,
        source,
        result,
      })
      return readyResult({
        disposition: persisted.disposition,
        invocationId,
        result,
        attemptCostEvidenceRef: usage.attemptCostEvidenceRef,
      })
    },
  })
}

function validateDependencies(input: Parameters<
  typeof createCanonicalSourceTranscriptA100AttemptOwner
>[0]): void {
  if (
    input.requestAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
    || typeof input.requestAuthorityReadPort.readExactPreparedRequest !==
      'function'
    || input.finalizedAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION
    || typeof input.finalizedAuthorityReadPort.readExactFinalizedSource !==
      'function'
    || input.admissionReadPort?.schemaVersion !==
      'canonical-source-transcript-admission-read-port-v1'
    || typeof input.admissionReadPort.rereadAdmittedTranscript !== 'function'
    || input.releaseReadPort?.schemaVersion !==
      'canonical-source-transcript-a100-release-read-port-v1'
    || typeof input.releaseReadPort.rereadPrivateA100TranscriptRelease !==
      'function'
    || typeof input.invocationPort?.runOnce !== 'function'
    || typeof input.invocationPort?.reconcileExisting !== 'function'
    || input.workerResultReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION
    || typeof input.workerResultReadPort?.readCompletedWorkerResult !==
      'function'
    || input.usageCostReadPort?.schemaVersion !==
      CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION
    || typeof input.usageCostReadPort?.readCompletedUsageCost !== 'function'
    || typeof input.transcriptRepository?.persistCreateOnly !== 'function'
    || typeof input.transcriptRepository?.readCompleted !== 'function'
    || typeof input.lifecycleObjectPort?.createOnly !== 'function'
    || typeof input.lifecycleObjectPort?.readExact !== 'function'
  ) throw notReady('source_transcript_a100_owner_dependencies_invalid')
}

function finalizedExpectation(
  request: Parameters<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >[0]['request'],
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
): CanonicalSourceAnalysisFinalizedAuthorityExpectation {
  const authority = source.managedApiAuthority!
  if (
    source.storageProvider !== 'google_cloud_storage'
    || authority.contentType !== 'video/mp4'
  ) throw conflict('source_transcript_finalized_source_kind_invalid')
  return Object.freeze({
    ownerUserId: authority.ownerUserId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    storageProvider: source.storageProvider,
    storageBucket: source.storageBucket,
    storagePath: source.storagePath,
    contentType: authority.contentType,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    storageGeneration: authority.storageGeneration,
    storageEtag: authority.storageEtag,
  })
}

function createSourceContext(input: {
  request: Parameters<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >[0]['request']
  requestDigestSha256: string
  analysisRunId: string
  source: CanonicalSourceLedProfessionalContentAnalysisSource
  finalized: CanonicalSourceAnalysisFinalizedAuthority
}): CanonicalSourceTranscriptSourceContext {
  const authority = input.source.managedApiAuthority!
  const context = sourceContextSchema.parse({
    ownerUserId: authority.ownerUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    requestDigestSha256: input.requestDigestSha256,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    checksumSha256: input.source.checksumSha256,
    byteLength: input.source.byteLength,
    durationFrames: input.source.durationFrames,
    storageGeneration: authority.storageGeneration,
    storageEtag: authority.storageEtag,
    hasAudio: authority.hasAudio,
    sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: authority.fpsNumerator,
      fpsDenominator: authority.fpsDenominator,
      frameCount: authority.frameCount,
      timeBaseNumerator: authority.sourceTimeBaseNumerator!,
      timeBaseDenominator: authority.sourceTimeBaseDenominator!,
    }),
    finalizedMediaAuthorityRef: authority.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      authority.finalizedStorageObjectAuthorityRef,
    sourceProbeAuthorityRef: authority.sourceProbeAuthorityRef,
    sourceAnalysisConsentRef: authority.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef: authority.platformAnalysisCostCapRef,
  })
  if (
    context.ownerUserId !== input.finalized.ownerUserId
    || !sameRef(
      context.finalizedMediaAuthorityRef,
      input.finalized.finalizedMediaAuthorityRef,
    )
    || !sameRef(
      context.finalizedStorageObjectAuthorityRef,
      input.finalized.finalizedStorageObjectAuthorityRef,
    )
    || !sameRef(
      context.sourceAnalysisConsentRef,
      input.finalized.sourceAnalysisConsentRef,
    )
    || !sameRef(
      context.platformAnalysisCostCapRef,
      input.finalized.platformAnalysisCostCapRef,
    )
  ) throw conflict('source_transcript_finalized_context_mismatch')
  return Object.freeze(context)
}

function transcriptRepositoryScope(
  context: CanonicalSourceTranscriptSourceContext,
): CanonicalSourceTranscriptOrchestraReadScope {
  return Object.freeze({
    ownerUserId: context.ownerUserId,
    workspaceId: context.workspaceId,
    projectId: context.projectId,
    editSessionId: context.editSessionId,
    analysisRunId: context.analysisRunId,
    sourceSequenceItemId: context.sourceSequenceItemId,
    mediaAssetId: context.mediaAssetId,
    uploadedOrder: context.uploadedOrder,
    checksumSha256: context.checksumSha256,
    byteLength: context.byteLength,
    durationFrames: context.durationFrames,
    sourceFrameAuthority: context.sourceFrameAuthority,
    finalizedMediaAuthorityRef: context.finalizedMediaAuthorityRef,
    sourceProbeAuthorityRef: context.sourceProbeAuthorityRef,
  })
}

function assertAdmissionMatches(input: {
  admission: CanonicalSourceTranscriptAdmission
  trigger: CanonicalSourceTranscriptTrigger
  sourceContext: CanonicalSourceTranscriptSourceContext
}): void {
  const expectedPreparedRef = preparedRequestContentRef(input.sourceContext)
  if (
    !sameRef(input.admission.triggerRef, triggerRef(input.trigger))
    || stableAuthorityStringify(input.admission.sourceContext) !==
      stableAuthorityStringify(input.sourceContext)
    || !sameRef(
      input.admission.preparedRequestContentRef,
      expectedPreparedRef,
    )
    || !sameRef(
      input.admission.sourceContext.platformAnalysisCostCapRef,
      input.sourceContext.platformAnalysisCostCapRef,
    )
    || refKey(input.admission.platformEstimateRef) ===
      refKey(input.admission.currentAccountRateAuthorityRef)
    || refKey(input.admission.currentAccountRateAuthorityRef) ===
      refKey(input.admission.runtimeReleaseRef)
  ) throw conflict('source_transcript_admission_scope_mismatch')
}

function assertReleaseMatchesAdmission(input: {
  release: CanonicalA100BatchReleaseObservation
  admission: CanonicalSourceTranscriptAdmission
}): void {
  if (
    !sameRef(input.release.releaseRef, input.admission.runtimeReleaseRef)
    || input.release.operationId !== input.admission.operationId
    || input.release.profileId !== input.admission.routeProfileId
    || input.release.modelCostProfileId !== input.admission.modelCostProfileId
    || !input.release.userTriggeredScaleToZero
    || input.release.minimumIdleJobCount !== 0
    || input.release.maximumTaskRetries !== 0
    || input.release.customerCreditMutationAllowed
  ) throw conflict('source_transcript_release_admission_mismatch')
}

function buildConsumption(input: {
  trigger: CanonicalSourceTranscriptTrigger
  admission: CanonicalSourceTranscriptAdmission
  release: CanonicalA100BatchReleaseObservation
  sourceContext: CanonicalSourceTranscriptSourceContext
  invocationId: string
  consumedAt: string
}): TranscriptConsumption {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-transcript-a100-consumption-v1',
    source: 'canonical_source_transcript_a100_attempt_owner',
    invocationId: input.invocationId,
    triggerRef: triggerRef(input.trigger),
    admissionRef: admissionRef(input.admission),
    releaseRef: input.release.releaseRef,
    sourceContext: input.sourceContext,
    idempotencyKey: input.trigger.idempotencyKey,
    consumedBeforeBatchCreate: true,
    maximumAttempts: 1,
    uncertainOutcomeRetryAllowed: false,
    customerCreditsMutated: false,
    consumedAt: input.consumedAt,
  })
  return Object.freeze(consumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  }))
}

function assertConsumption(value: unknown): TranscriptConsumption {
  assertPlainSerializedData(value, 'source_transcript_a100_consumption')
  const parsed = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_transcript_a100_consumption_hash_invalid')
  }
  return Object.freeze(parsed)
}

function assertWorkerTranscript(
  value: z.infer<typeof workerResultWithoutHashSchema>,
): void {
  const transcript = value.transcript
  const coverage = { ...transcript.coverage }
  Reflect.deleteProperty(coverage, 'coverageDigestSha256')
  const segmentIds = new Set<string>()
  const segmentsOrderedAndBounded = transcript.segments.every(
    (segment, index) => {
      const previous = transcript.segments[index - 1]
      const valid = !segmentIds.has(segment.segmentId)
        && segment.endFrameExclusive <= value.sourceContext.durationFrames
        && (previous === undefined
          || segment.startFrame >= previous.endFrameExclusive)
        && segment.wordsVerified
      segmentIds.add(segment.segmentId)
      return valid
    },
  )
  if (
    transcript.modelId !== 'faster-whisper-large-v3'
    || (transcript.status === 'completed') !==
      (transcript.segments.length > 0)
    || !segmentsOrderedAndBounded
    || transcript.transcriptDigestSha256 !==
      sha256AuthorityValue(transcript.segments)
    || transcript.coverage.coveredStartFrame !== 0
    || transcript.coverage.coveredEndFrameExclusive !==
      value.sourceContext.durationFrames
    || !transcript.coverage.completeAudioTimelineProcessed
    || !transcript.coverage.embeddedInstructionDetectionRequired
    || transcript.coverage.coverageDigestSha256 !==
      sha256AuthorityValue(coverage)
  ) throw conflict('source_transcript_worker_transcript_invalid')
}

function assertWorkerUsageMatches(input: {
  worker: CanonicalSourceTranscriptA100WorkerResult
  usage: CanonicalSourceTranscriptA100UsageCost
}): void {
  const worker = input.worker.execution
  const usage = input.usage.actualUsage
  if (
    usage.runtimeAndModelLoadMilliseconds !== worker.modelLoadMilliseconds
    || usage.activeGpuMilliseconds !== worker.gpuActiveMilliseconds
    || usage.privateArtifactBytes !== worker.privateArtifactBytes
    || usage.classAOperationCount !== worker.classAOperationCount
    || usage.classBOperationCount !== worker.classBOperationCount
  ) throw conflict('source_transcript_worker_usage_mismatch')
}

function assertWorkerMatches(input: {
  worker: CanonicalSourceTranscriptA100WorkerResult
  invocationId: string
  admission: CanonicalSourceTranscriptAdmission
  release: CanonicalA100BatchReleaseObservation
  invocationResultRef: VisualIntelligenceEvidenceRef
  sourceContext: CanonicalSourceTranscriptSourceContext
}): void {
  if (
    input.worker.invocationId !== input.invocationId
    || !sameRef(input.worker.admissionRef, admissionRef(input.admission))
    || !sameRef(input.worker.releaseRef, input.release.releaseRef)
    || !sameRef(
      input.worker.invocationResultRef,
      input.invocationResultRef,
    )
    || stableAuthorityStringify(input.worker.sourceContext) !==
      stableAuthorityStringify(input.sourceContext)
    || input.worker.modelManifestRef.contentHash !==
      input.release.modelDigestSha256
    || `sha256:${input.worker.transcript.modelDigestSha256}` !==
      input.release.modelDigestSha256
  ) throw conflict('source_transcript_worker_lineage_mismatch')
}

function assertUsageMatches(input: {
  usage: CanonicalSourceTranscriptA100UsageCost
  admission: CanonicalSourceTranscriptAdmission
  release: CanonicalA100BatchReleaseObservation
  invocation: CanonicalA100BatchInvocationResult
  invocationResultRef: VisualIntelligenceEvidenceRef
}): void {
  const rate = input.usage.accountEffectiveRateAuthority
  if (
    input.usage.invocationId !== input.invocation.invocationId
    || !sameRef(input.usage.admissionRef, admissionRef(input.admission))
    || !sameRef(input.usage.releaseRef, input.release.releaseRef)
    || !sameRef(
      input.usage.invocationResultRef,
      input.invocationResultRef,
    )
    || input.usage.actualInfrastructureCost
      .totalInfrastructureCostUsdNanos >
        input.admission.maximumPlatformInternalCostUsdNanos
    || !sameRef(
      input.admission.currentAccountRateAuthorityRef,
      ref(rate.rateAuthorityId, rate.rateAuthorityHash,
        rate.rateAuthorityVersion),
    )
    || input.usage.actualUsage.allocatedGpuCount !== 1
    || input.usage.actualUsage.allocatedVcpuCount !== 12
    || input.usage.actualUsage.allocatedMemoryGiB !== 170
    || input.usage.actualUsage.allocatedLocalScratchGiB !== 375
  ) throw conflict('source_transcript_usage_lineage_mismatch')
}

function buildCompletedTranscriptResult(input: {
  worker: CanonicalSourceTranscriptA100WorkerResult
  invocation: CanonicalA100BatchInvocationResult
  release: CanonicalA100BatchReleaseObservation
  usage: CanonicalSourceTranscriptA100UsageCost
}): CanonicalVisualIntelligenceSourceTranscriptResult {
  const transcriptAuthorityRef = ref(
    `source-transcript-${input.worker.transcript.transcriptDigestSha256.slice(0, 32)}`,
    input.worker.transcript.transcriptDigestSha256,
  )
  const attemptRef = invocationRef(input.invocation)
  const result: CanonicalVisualIntelligenceSourceTranscriptResult = {
    schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
    transcriptAuthorityRef,
    transcript: structuredClone(input.worker.transcript),
    execution: {
      executionOwner: 'canonical_quality_first_source_transcript_router',
      sourceAudioDisposition: 'transcribed_on_nvidia_a100_80gb_primary',
      routeProfileId: CANONICAL_A100_SOURCE_TRANSCRIPT_PROFILE_ID,
      acceleratorClass: 'nvidia_a100_80gb',
      primaryAttemptOutcome: 'completed',
      fallbackAttemptOutcome: 'not_attempted',
      primaryAttemptTerminalFailureClass: null,
      primaryAttemptReceiptRef: attemptRef,
      completedAttemptReceiptRef: attemptRef,
      completedRuntimeReleaseRef: cloneRef(input.release.releaseRef),
      fallbackAdmissionRef: null,
      attemptCostEvidenceRefs: [cloneRef(input.usage.attemptCostEvidenceRef)],
      routePolicyDigestSha256:
        `sha256:${createCanonicalQualityFirstUserTriggeredGpuPolicy().policyHash}`,
      gpuAccelerationUsed: true,
      cpuInferenceFallbackUsed: false,
      completeAudioTimelineProcessed: true,
      modelBytesPinnedBeforeExecution: true,
      runtimeDownloadPerformed: false,
      rawAudioPersisted: false,
      transcriptRereadVerified: true,
      customerCreditMutated: false,
      systemFailureChargedToCustomer: false,
      unapprovedOverageChargedToCustomer: false,
    },
  }
  return Object.freeze(result)
}

function noAudioTranscriptResult(
  context: CanonicalSourceTranscriptSourceContext,
): CanonicalVisualIntelligenceSourceTranscriptResult {
  const segments: [] = []
  const coveragePayload = {
    schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: context.durationFrames,
    completeAudioTimelineProcessed: true as const,
    speechSegmentsMayOmitSilence: true as const,
    embeddedInstructionDetectionRequired: true as const,
  }
  const transcriptDigestSha256 = sha256AuthorityValue(segments)
  const sourceModel = createCanonicalFasterWhisperLargeV3ModelArtifactSource()
  const result: CanonicalVisualIntelligenceSourceTranscriptResult = {
    schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
    transcriptAuthorityRef: ref(
      `source-transcript-no-audio-${sha256AuthorityValue({
        analysisRunId: context.analysisRunId,
        sourceSequenceItemId: context.sourceSequenceItemId,
        mediaAssetId: context.mediaAssetId,
        checksumSha256: context.checksumSha256,
        sourceFrameAuthorityDigestSha256:
          context.sourceFrameAuthority.sourceFrameAuthorityDigestSha256,
      }).slice(0, 32)}`,
      transcriptDigestSha256,
    ),
    transcript: {
      status: 'no_speech',
      modelId: 'faster-whisper-large-v3',
      modelDigestSha256: sourceModel.sourceDigestSha256.slice(7),
      runtimeVersion: 'faster-whisper-1.2.1',
      transcriptDigestSha256,
      segments,
      coverage: {
        ...coveragePayload,
        coverageDigestSha256: sha256AuthorityValue(coveragePayload),
      },
      rawAudioPersisted: false,
      modelDownloadPerformed: false,
      networkAttempted: false,
    },
    execution: {
      executionOwner: 'canonical_quality_first_source_transcript_router',
      sourceAudioDisposition: 'verified_no_audio_stream',
      routeProfileId: null,
      acceleratorClass: null,
      primaryAttemptOutcome: 'not_required_no_audio',
      fallbackAttemptOutcome: 'not_attempted',
      primaryAttemptTerminalFailureClass: null,
      primaryAttemptReceiptRef: null,
      completedAttemptReceiptRef: null,
      completedRuntimeReleaseRef: null,
      fallbackAdmissionRef: null,
      attemptCostEvidenceRefs: [],
      routePolicyDigestSha256:
        `sha256:${createCanonicalQualityFirstUserTriggeredGpuPolicy().policyHash}`,
      gpuAccelerationUsed: false,
      cpuInferenceFallbackUsed: false,
      completeAudioTimelineProcessed: true,
      modelBytesPinnedBeforeExecution: false,
      runtimeDownloadPerformed: false,
      rawAudioPersisted: false,
      transcriptRereadVerified: true,
      customerCreditMutated: false,
      systemFailureChargedToCustomer: false,
      unapprovedOverageChargedToCustomer: false,
    },
  }
  return Object.freeze(result)
}

async function createAndReread<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  record: T
  parse(value: unknown): T
}): Promise<'created' | 'already_exists'> {
  const body = Buffer.from(stableAuthorityStringify(input.record), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('source_transcript_attempt_record_bytes_invalid')
  }
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const rereadBytes = await input.port.readExact(input.path)
  if (!rereadBytes || !Buffer.isBuffer(rereadBytes)) {
    throw conflict('source_transcript_attempt_record_reread_missing')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(rereadBytes.toString('utf8'))
  } catch {
    throw conflict('source_transcript_attempt_record_json_invalid')
  }
  const reread = input.parse(untrusted)
  if (
    rereadBytes.toString('utf8') !== stableAuthorityStringify(reread)
    || stableAuthorityStringify(reread) !==
      stableAuthorityStringify(input.record)
  ) throw conflict('source_transcript_attempt_record_conflict')
  return disposition
}

function invocationIdFor(
  trigger: CanonicalSourceTranscriptTrigger,
  context: CanonicalSourceTranscriptSourceContext,
): string {
  return `source-transcript-a100-${sha256AuthorityValue({
    triggerHash: trigger.triggerHash,
    requestDigestSha256: context.requestDigestSha256,
    sourceSequenceItemId: context.sourceSequenceItemId,
    checksumSha256: context.checksumSha256,
    sourceFrameAuthorityDigestSha256:
      context.sourceFrameAuthority.sourceFrameAuthorityDigestSha256,
  }).slice(0, 32)}`
}

function preparedRequestContentRef(
  context: CanonicalSourceTranscriptSourceContext,
): VisualIntelligenceEvidenceRef {
  return ref(
    `source-analysis-request-content-${context.requestDigestSha256.slice(0, 32)}`,
    context.requestDigestSha256,
  )
}

function triggerRef(
  trigger: CanonicalSourceTranscriptTrigger,
): VisualIntelligenceEvidenceRef {
  return ref(
    `source-transcript-trigger-${trigger.triggerHash.slice(0, 32)}`,
    trigger.triggerHash,
  )
}

function admissionRef(
  admission: CanonicalSourceTranscriptAdmission,
): VisualIntelligenceEvidenceRef {
  return ref(
    `source-transcript-admission-${admission.admissionHash.slice(0, 32)}`,
    admission.admissionHash,
  )
}

function invocationRef(
  invocation: CanonicalA100BatchInvocationResult,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: `source-transcript-attempt-${invocation.resultDigestSha256.slice(7, 39)}`,
    version: 1,
    contentHash: invocation.resultDigestSha256,
  })
}

function ref(
  id: string,
  hash: string,
  version = 1,
): VisualIntelligenceEvidenceRef {
  return Object.freeze(evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  }))
}

function cloneRef(
  value: VisualIntelligenceEvidenceRef,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({ ...value })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function recordPath(
  prefix: string,
  kind: 'consumptions' | 'invocations',
  invocationId: string,
): string {
  return `${prefix}/${kind}/${invocationId}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 600
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.includes('//')
    || normalized.split('/').some((part) => !safeId.safeParse(part).success)
  ) throw conflict('source_transcript_attempt_prefix_invalid')
  return normalized
}

function notReadyResult(
  blockerCode: Extract<
    CanonicalSourceTranscriptA100AttemptResult,
    { status: 'not_ready' }
  >['blockerCode'],
): Extract<
  CanonicalSourceTranscriptA100AttemptResult,
  { status: 'not_ready' }
> {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    gpuJobStarted: false as const,
    automaticRetryAllowed: false as const,
    customerCreditMutated: false as const,
  })
}

function reconciliationResult(
  blockerCode: Extract<
    CanonicalSourceTranscriptA100AttemptResult,
    { status: 'reconciliation_required' }
  >['blockerCode'],
  invocationId: string,
): Extract<
  CanonicalSourceTranscriptA100AttemptResult,
  { status: 'reconciliation_required' }
> {
  return Object.freeze({
    status: 'reconciliation_required' as const,
    blockerCode,
    invocationId,
    automaticRetryAllowed: false as const,
    unknownOutcomeChargedToCustomer: false as const,
    customerCreditMutated: false as const,
  })
}

function readyResult(input: {
  disposition: 'created' | 'identical_replay'
  invocationId: string | null
  result: CanonicalVisualIntelligenceSourceTranscriptResult
  attemptCostEvidenceRef: VisualIntelligenceEvidenceRef | null
}): Extract<
  CanonicalSourceTranscriptA100AttemptResult,
  { status: 'ready' }
> {
  return Object.freeze({
    status: 'ready' as const,
    disposition: input.disposition,
    invocationId: input.invocationId,
    transcriptAuthorityRef: cloneRef(input.result.transcriptAuthorityRef),
    attemptCostEvidenceRef: input.attemptCostEvidenceRef
      ? cloneRef(input.attemptCostEvidenceRef) : null,
    exactTranscriptRereadVerified: true as const,
    scaleBackToZeroVerified: true as const,
    platformFundedPreapprovalAnalysis: true as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function unknownAttemptOutcome(error: unknown): boolean {
  if (
    !(error instanceof ApiError)
    || error.code !== 'JOB_DEPENDENCY_NOT_READY'
    || error.status !== 503
    || !error.details
    || typeof error.details !== 'object'
    || Array.isArray(error.details)
  ) return false
  const requiredGate = Object.getOwnPropertyDescriptor(
    error.details,
    'requiredGate',
  )?.value
  const retryAllowed = Object.getOwnPropertyDescriptor(
    error.details,
    'retryAllowed',
  )?.value
  const fallbackAllowed = Object.getOwnPropertyDescriptor(
    error.details,
    'fallbackAllowed',
  )?.value
  return typeof requiredGate === 'string'
    && requiredGate.startsWith('a100_batch_')
    && retryAllowed === false
    && fallbackAllowed === false
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical A100 source transcript authority conflicts with its exact scope.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical A100 source transcript execution is not ready.',
    503,
    { requiredGate },
  )
}
