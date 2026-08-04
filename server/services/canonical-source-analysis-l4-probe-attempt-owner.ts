import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  type CanonicalProfessionalToolGpuRuntimeRelease,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSourceAnalysisProbeAuthorityRepository,
} from './canonical-source-analysis-probe-authority-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisFinalizedAuthority,
  verifyCanonicalSourceAnalysisProbeAuthority,
  type CanonicalSourceAnalysisFinalizedAuthority,
  type CanonicalSourceAnalysisFinalizedAuthorityExpectation,
  type CanonicalSourceAnalysisFinalizedAuthorityReadPort,
  type CanonicalSourceAnalysisProbeAuthority,
  type CanonicalSourceAnalysisProbeAuthorityScope,
} from './canonical-source-analysis-preparation-owner'
import {
  assertVisualIntelligenceSourceGpuEvidenceUsageCost,
  type VisualIntelligenceSourceGpuEvidenceUsageCost,
} from './canonical-visual-intelligence-source-gpu-evidence-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION =
  'canonical-source-analysis-l4-probe-attempt-owner-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_PROBE_TRIGGER_VERSION =
  'canonical-source-analysis-l4-probe-trigger-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ADMISSION_VERSION =
  'canonical-source-analysis-l4-probe-admission-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_PROBE_WORKER_RESULT_VERSION =
  'canonical-source-analysis-l4-probe-worker-result-v1' as const

const CLOUD_PROJECT_ID = 'reeditpro' as const
const CLOUD_RUN_JOB_NAME = 'reeditpro-professional-l4' as const
const OPERATION_ID =
  'internal.visual_intelligence.probe_source_timing.v1' as const
const ROUTE_PROFILE_ID =
  'quality_l4_user_triggered_standard_media_job_v1' as const
const MODEL_OR_OPERATION_COST_PROFILE_ID =
  'source-analysis-l4-probe-v1' as const
const DEFAULT_PREFIX = 'private/orchestra/v1/source-analysis-probe-attempts'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024

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
const storageBucket = z.string().min(3).max(222)
  .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u)
const storagePath = z.string().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/:-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const storageGeneration = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const storageEtag = z.string().trim().min(1).max(1_024)
  .refine((value) => !/[\0\r\n]/u.test(value))

const finalizedExpectationSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  uploadedOrder: positiveInteger,
  storageProvider: z.literal('google_cloud_storage'),
  storageBucket,
  storagePath,
  contentType: z.literal('video/mp4'),
  checksumSha256: rawSha256,
  byteLength: positiveInteger,
  storageGeneration,
  storageEtag,
}).strict()

const triggerWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_PROBE_TRIGGER_VERSION,
  ),
  source: z.literal('authenticated_server_source_analysis_trigger'),
  requestId: safeId,
  sourceIdentity: finalizedExpectationSchema,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  triggeredAt: timestamp,
  serverDerivedFinalizedSourceIdentity: z.literal(true),
  browserStorageIdentityAccepted: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutationAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const triggerSchema = triggerWithoutHashSchema.extend({
  triggerHash: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4ProbeTrigger = z.infer<
  typeof triggerSchema
>

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ADMISSION_VERSION,
  ),
  source: z.literal('canonical_server_source_analysis_probe_admission_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  admissionId: safeId,
  triggerRef: evidenceRefSchema,
  sourceIdentity: finalizedExpectationSchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  sourceAnalysisConsentRef: evidenceRefSchema,
  platformAnalysisCostCapRef: evidenceRefSchema,
  platformEstimateRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  operationId: z.literal(OPERATION_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  routeId: z.literal('l4_standard_primary'),
  maximumAttempts: z.literal(1),
  attemptOrdinal: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  createOnlyConsumptionRequiredBeforeCloudJob: z.literal(true),
  exactFinalizedSourceConsentCostRateAndReleaseReread: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  platformFundedPreapprovalAnalysis: z.literal(true),
  maximumPlatformInternalCostUsdNanos: positiveInteger,
  customerCreditReservationRequired: z.literal(false),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  workDispatched: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.admittedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Source probe admission expiry is invalid.',
    })
  }
})
const admissionSchema = admissionWithoutHashSchema.extend({
  admissionHash: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4ProbeAdmission = z.infer<
  typeof admissionSchema
>

const audioProbeSchema = z.discriminatedUnion('disposition', [
  z.object({
    disposition: z.literal('verified_no_audio_stream'),
  }).strict(),
  z.object({
    disposition: z.literal('verified_audio_stream'),
    videoStreamIndex: nonnegativeInteger,
    videoStartTimeBaseUnits: z.number().int().safe(),
    videoTimeBaseNumerator: positiveInteger,
    videoTimeBaseDenominator: positiveInteger,
    audioStreamIndex: nonnegativeInteger,
    audioStartTimeBaseUnits: z.number().int().safe(),
    audioDurationTimeBaseUnits: positiveInteger,
    audioTimeBaseNumerator: positiveInteger,
    audioTimeBaseDenominator: positiveInteger,
    audioSampleRateHertz: positiveInteger,
    audioChannelCount: positiveInteger.max(32),
  }).strict(),
])

const workerResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_PROBE_WORKER_RESULT_VERSION,
  ),
  source: z.literal('canonical_l4_source_analysis_probe_worker'),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  envelopeHash: rawSha256,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  cloudRunExecutionRef: evidenceRefSchema,
  sourceIdentity: finalizedExpectationSchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  workerRuntimeRecordRef: evidenceRefSchema,
  gpuFrameCountEvidenceRef: evidenceRefSchema,
  width: positiveInteger,
  height: positiveInteger,
  hasAudio: z.boolean(),
  audioProbe: audioProbeSchema,
  fpsNumerator: positiveInteger,
  fpsDenominator: positiveInteger,
  frameCount: positiveInteger,
  sourceTimeBaseNumerator: positiveInteger,
  sourceTimeBaseDenominator: positiveInteger,
  constantFrameRate: z.literal(true),
  execution: z.object({
    exactEnvelopeAndFinalizedSourceRereadVerified: z.literal(true),
    ffprobeUsedForMetadataOnly: z.literal(true),
    nvdecUsedForCompleteFrameCountVerification: z.literal(true),
    gpuFrameCountVerificationPassed: z.literal(true),
    substantiveCpuMediaProcessingUsed: z.literal(false),
    runtimeNetworkDownloadPerformed: z.literal(false),
    workerActiveMilliseconds: positiveInteger.max(900_000),
    gpuActiveMilliseconds: positiveInteger.max(900_000),
    sourceBytesRead: positiveInteger,
    persistedPrivateBytes: positiveInteger,
    privateArtifactRetentionMilliseconds: positiveInteger,
    classAOperationCount: positiveInteger,
    classBOperationCount: positiveInteger,
  }).strict().superRefine((value, context) => {
    if (value.gpuActiveMilliseconds > value.workerActiveMilliseconds) {
      context.addIssue({
        code: 'custom',
        message: 'Source probe GPU time exceeds worker time.',
      })
    }
  }),
}).strict().superRefine((value, context) => {
  const audioPresent = value.audioProbe.disposition ===
    'verified_audio_stream'
  if (value.hasAudio !== audioPresent) context.addIssue({
    code: 'custom',
    message: 'Source probe audio presence is inconsistent.',
  })
})
const workerResultSchema = workerResultWithoutHashSchema.extend({
  workerResultHash: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4ProbeWorkerResult = z.infer<
  typeof workerResultSchema
>

const cloudRunDispositionSchema = z.enum([
  'completed',
  'rejected_before_creation',
  'outcome_unknown_requires_reconciliation',
])
const substantiveWorkOutcomeSchema = z.enum([
  'executed',
  'not_executed',
  'unknown',
])

const cloudRunResultSchema = z.object({
  disposition: cloudRunDispositionSchema,
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema.nullable(),
  cloudRunExecutionRef: evidenceRefSchema.nullable(),
  cloudRunTerminalObservationRef: evidenceRefSchema.nullable(),
  providerInferenceOrSubstantiveWorkOutcome: substantiveWorkOutcomeSchema,
  runningTaskCount: z.literal(0).nullable(),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const complete = value.disposition === 'completed'
    ? value.cloudRunOperationRef !== null
      && value.cloudRunExecutionRef !== null
      && value.cloudRunTerminalObservationRef !== null
      && value.providerInferenceOrSubstantiveWorkOutcome === 'executed'
      && value.runningTaskCount === 0
    : value.disposition === 'rejected_before_creation'
      ? value.cloudRunOperationRef === null
        && value.cloudRunExecutionRef === null
        && value.cloudRunTerminalObservationRef === null
        && value.providerInferenceOrSubstantiveWorkOutcome === 'not_executed'
        && value.runningTaskCount === 0
      : value.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
        && value.runningTaskCount === null
  if (!complete) context.addIssue({
    code: 'custom',
    message: 'Source probe Cloud Run outcome is inconsistent.',
  })
  const refs = [
    value.cloudJobCreateRequestRef,
    value.cloudRunOperationRef,
    value.cloudRunExecutionRef,
    value.cloudRunTerminalObservationRef,
  ].filter((candidate): candidate is VisualIntelligenceEvidenceRef =>
    candidate !== null)
  if (new Set(refs.map(refKey)).size !== refs.length) context.addIssue({
    code: 'custom',
    message: 'Source probe Cloud Run evidence references are not unique.',
  })
})
export type CanonicalSourceAnalysisL4ProbeCloudRunResult = z.infer<
  typeof cloudRunResultSchema
>

const envelopeWithoutHashSchema = z.object({
  schemaVersion: z.literal('canonical-source-analysis-l4-probe-envelope-v1'),
  source: z.literal('canonical_source_analysis_l4_probe_attempt_owner'),
  invocationId: safeId,
  triggerRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  sourceIdentity: finalizedExpectationSchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  sourceAnalysisConsentRef: evidenceRefSchema,
  platformAnalysisCostCapRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  operationId: z.literal(OPERATION_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  algorithm: z.object({
    ffprobeMetadataOnly: z.literal(true),
    nvdecCompleteFrameCountRequired: z.literal(true),
    exactRationalFpsRequired: z.literal(true),
    exactSourceTimeBaseRequired: z.literal(true),
    constantFrameRateRequiredUntilCanonicalVfrMappingExists: z.literal(true),
    substantiveCpuMediaProcessingAllowed: z.literal(false),
  }).strict(),
  dispatchBoundary: z.object({
    cloudRunReceivesOnlyInvocationId: z.literal(true),
    privateWorkerRereadsEnvelopeByExactDigest: z.literal(true),
    callerPathUrlBytesCommandOrEnvironmentIncluded: z.literal(false),
    runtimeNetworkDownloadAllowed: z.literal(false),
    maximumAttempts: z.literal(1),
    uncertainOutcomeRetryAllowed: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAllowed: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict(),
}).strict()
const envelopeSchema = envelopeWithoutHashSchema.extend({
  envelopeHash: rawSha256,
}).strict()
type ProbeEnvelope = z.infer<typeof envelopeSchema>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-analysis-l4-probe-consumption-v1',
  ),
  source: z.literal('canonical_source_analysis_l4_probe_attempt_owner'),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  envelopeRef: evidenceRefSchema,
  idempotencyKey: safeId,
  consumedBeforeCloudRunCall: z.literal(true),
  maximumAttempts: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  consumedAt: timestamp,
}).strict()
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: rawSha256,
}).strict()

const launchWithoutHashSchema = z.object({
  schemaVersion: z.literal('canonical-source-analysis-l4-probe-launch-v1'),
  source: z.literal('canonical_source_analysis_l4_probe_attempt_owner'),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  envelopeRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema.nullable(),
  cloudRunExecutionRef: evidenceRefSchema.nullable(),
  cloudRunTerminalObservationRef: evidenceRefSchema.nullable(),
  disposition: cloudRunDispositionSchema,
  providerInferenceOrSubstantiveWorkOutcome:
    substantiveWorkOutcomeSchema,
  runningTaskCount: z.literal(0).nullable(),
  createOnlyConsumptionPersistedBeforeCloudRunCall: z.literal(true),
  duplicateDispatchAllowed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  observedAt: timestamp,
}).strict()
const launchSchema = launchWithoutHashSchema.extend({
  launchHash: rawSha256,
}).strict()
type ProbeLaunch = z.infer<typeof launchSchema>

export interface CanonicalSourceAnalysisL4ProbeAdmissionReadPort {
  readonly schemaVersion:
    'canonical-source-analysis-l4-probe-admission-read-port-v1'
  rereadAdmittedProbe(input: Readonly<{
    trigger: CanonicalSourceAnalysisL4ProbeTrigger
    finalizedAuthority: CanonicalSourceAnalysisFinalizedAuthority
  }>): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort {
  readonly schemaVersion:
    'canonical-source-analysis-l4-probe-runtime-release-read-port-v1'
  rereadPrivateL4ProbeRelease(input: Readonly<{
    admission: CanonicalSourceAnalysisL4ProbeAdmission
  }>): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisL4ProbeCloudRunPort {
  runOnce(input: Readonly<{
    cloudProjectId: typeof CLOUD_PROJECT_ID
    runtimeRegion: 'us-central1' | 'europe-west4'
    cloudRunJobName: typeof CLOUD_RUN_JOB_NAME
    invocationId: string
    maximumExecutionSeconds: 900
  }>): Promise<unknown>
}

export interface CanonicalSourceAnalysisL4ProbeWorkerResultReadPort {
  readCompletedWorkerResult(input: Readonly<{
    invocationId: string
    envelopeHash: string
  }>): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisL4ProbeUsageCostReadPort {
  readCompletedUsageCost(input: Readonly<{
    invocationId: string
    envelopeHash: string
  }>): Promise<unknown | null>
}

export type CanonicalSourceAnalysisL4ProbeAttemptResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_finalized_source_authority_not_ready'
        | 'canonical_source_probe_admission_not_ready'
        | 'canonical_source_probe_runtime_release_not_ready'
      cloudJobStarted: false
      automaticRetryAllowed: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'reconciliation_required'
      invocationId: string
      blockerCode:
        | 'source_probe_consumed_launch_not_observed'
        | 'source_probe_cloud_outcome_unknown'
        | 'source_probe_worker_result_not_ready'
        | 'source_probe_terminal_cost_not_ready'
      cloudJobStartState: 'known_started' | 'unknown'
      automaticRetryAllowed: false
      unknownOutcomeChargedToCustomer: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'failed_before_creation'
      invocationId: string
      cloudJobStarted: false
      substantiveWorkExecuted: false
      automaticRetryAllowed: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      invocationId: string
      sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
      usageCostEvidenceRef: VisualIntelligenceEvidenceRef
      persistedProbeAuthorityExactRereadVerified: true
      workerResultAndAccountEffectiveCostLineageBound: true
      scaleBackToZeroVerified: true
      platformFundedPreapprovalAnalysis: true
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceAnalysisL4ProbeAttemptOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION
  readonly operationId: typeof OPERATION_ID
  readonly routeProfileId: typeof ROUTE_PROFILE_ID
  readonly acceleratorClass: 'nvidia_l4'
  readonly userTriggeredScaleFromZero: true
  readonly minimumIdleInstances: 0
  readonly maximumAttempts: 1
  readonly automaticRetryAfterUncertainOutcomeAllowed: false
  readonly platformFundedPreapprovalAnalysis: true
  readonly customerCreditMutationAllowed: false
  executeOneShot(
    trigger: CanonicalSourceAnalysisL4ProbeTrigger,
  ): Promise<CanonicalSourceAnalysisL4ProbeAttemptResult>
}

export function assertCanonicalSourceAnalysisL4ProbeTrigger(
  value: unknown,
): CanonicalSourceAnalysisL4ProbeTrigger {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_trigger')
  const trigger = triggerSchema.parse(value)
  const { triggerHash, ...payload } = trigger
  if (triggerHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_probe_trigger_hash_invalid')
  }
  return Object.freeze(trigger)
}

export function assertCanonicalSourceAnalysisL4ProbeAdmission(
  value: unknown,
  at?: string,
): CanonicalSourceAnalysisL4ProbeAdmission {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_admission')
  const admission = admissionSchema.parse(value)
  const { admissionHash, ...payload } = admission
  if (
    admissionHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(admission.admittedAt)
      || Date.parse(at) >= Date.parse(admission.expiresAt)
    ))
  ) throw conflict('source_analysis_l4_probe_admission_invalid')
  return Object.freeze(admission)
}

export function assertCanonicalSourceAnalysisL4ProbeWorkerResult(
  value: unknown,
): CanonicalSourceAnalysisL4ProbeWorkerResult {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_worker_result')
  const result = workerResultSchema.parse(value)
  const { workerResultHash, ...payload } = result
  if (workerResultHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_probe_worker_result_hash_invalid')
  }
  return Object.freeze(result)
}

/**
 * The canonical pre-plan source probe owner. Only a digest-bound invocation ID
 * crosses the Cloud Run API. The worker rereads the private envelope, while a
 * separate usage/pricing owner supplies account-effective terminal cost and
 * zero-capacity evidence before final probe authority can be persisted.
 */
export function createCanonicalSourceAnalysisL4ProbeAttemptOwner(input: {
  readonly finalizedAuthorityReadPort:
    CanonicalSourceAnalysisFinalizedAuthorityReadPort
  readonly admissionReadPort:
    CanonicalSourceAnalysisL4ProbeAdmissionReadPort
  readonly runtimeReleaseReadPort:
    CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
  readonly cloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
  readonly workerResultReadPort:
    CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
  readonly usageCostReadPort:
    CanonicalSourceAnalysisL4ProbeUsageCostReadPort
  readonly probeAuthorityRepository:
    CanonicalSourceAnalysisProbeAuthorityRepository
  readonly lifecycleObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
  readonly now?: () => Date
}): CanonicalSourceAnalysisL4ProbeAttemptOwner {
  validateDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date())

  const owner: CanonicalSourceAnalysisL4ProbeAttemptOwner = {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_L4_PROBE_ATTEMPT_OWNER_VERSION,
    operationId: OPERATION_ID,
    routeProfileId: ROUTE_PROFILE_ID,
    acceleratorClass: 'nvidia_l4',
    userTriggeredScaleFromZero: true,
    minimumIdleInstances: 0,
    maximumAttempts: 1,
    automaticRetryAfterUncertainOutcomeAllowed: false,
    platformFundedPreapprovalAnalysis: true,
    customerCreditMutationAllowed: false,
    async executeOneShot(untrustedTrigger) {
      const trigger = assertCanonicalSourceAnalysisL4ProbeTrigger(
        untrustedTrigger,
      )
      const finalizedRaw = await input.finalizedAuthorityReadPort
        .readExactFinalizedSource(identityScope(trigger.sourceIdentity))
      if (!finalizedRaw) return notReady(
        'canonical_finalized_source_authority_not_ready',
      )
      const finalized = verifyCanonicalSourceAnalysisFinalizedAuthority({
        untrusted: finalizedRaw,
        expected: trigger.sourceIdentity,
      })
      const probeScope = probeScopeFor(finalized)
      const existing = await input.probeAuthorityRepository
        .readCompletedExactProbe(probeScope)
      if (existing) return readyResult({
        disposition: 'identical_replay',
        invocationId: invocationIdFor(trigger),
        probe: existing,
      })

      const startedAt = now().toISOString()
      const admissionRaw = await input.admissionReadPort.rereadAdmittedProbe({
        trigger,
        finalizedAuthority: finalized,
      })
      if (!admissionRaw) return notReady(
        'canonical_source_probe_admission_not_ready',
      )
      const admission = assertCanonicalSourceAnalysisL4ProbeAdmission(
        admissionRaw,
        startedAt,
      )
      assertAdmissionMatches({ admission, trigger, finalized })
      const releaseRaw = await input.runtimeReleaseReadPort
        .rereadPrivateL4ProbeRelease({ admission })
      if (!releaseRaw) return notReady(
        'canonical_source_probe_runtime_release_not_ready',
      )
      assertPlainSerializedData(releaseRaw, 'source_probe_runtime_release')
      const release = assertProbeRuntimeRelease(releaseRaw, startedAt)
      if (!sameRef(admission.runtimeReleaseRef, releaseRef(release))) {
        throw conflict('source_analysis_l4_probe_release_mismatch')
      }
      const invocationId = invocationIdFor(trigger)
      const envelope = buildEnvelope({
        invocationId,
        trigger,
        admission,
        finalized,
        release,
      })
      await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'envelopes', invocationId),
        record: envelope,
        parse: assertEnvelope,
      })
      const consumption = buildConsumption({ trigger, admission, envelope })
      const consumptionDisposition = await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'consumptions', invocationId),
        record: consumption,
        parse: assertConsumption,
      })
      if (consumptionDisposition === 'already_exists') {
        return reconcileExisting({
          input,
          prefix,
          invocationId,
          envelope,
          admission,
          release,
          finalized,
          probeScope,
        })
      }

      let cloudResult: CanonicalSourceAnalysisL4ProbeCloudRunResult
      try {
        const untrustedCloudResult = await input.cloudRunPort.runOnce({
          cloudProjectId: CLOUD_PROJECT_ID,
          runtimeRegion: release.runtimeRegion,
          cloudRunJobName: CLOUD_RUN_JOB_NAME,
          invocationId,
          maximumExecutionSeconds: 900,
        })
        assertPlainSerializedData(
          untrustedCloudResult,
          'source_analysis_l4_probe_cloud_result',
        )
        cloudResult = cloudRunResultSchema.parse(untrustedCloudResult)
      } catch {
        cloudResult = cloudRunResultSchema.parse({
          disposition: 'outcome_unknown_requires_reconciliation',
          cloudJobCreateRequestRef: opaqueRef(
            `${invocationId}.cloud-create-unknown`,
            { invocationId, envelopeHash: envelope.envelopeHash },
          ),
          cloudRunOperationRef: null,
          cloudRunExecutionRef: null,
          cloudRunTerminalObservationRef: null,
          providerInferenceOrSubstantiveWorkOutcome: 'unknown',
          runningTaskCount: null,
          observedAt: now().toISOString(),
        })
      }
      if (Date.parse(cloudResult.observedAt) < Date.parse(startedAt)) {
        throw conflict('source_analysis_l4_probe_cloud_time_invalid')
      }
      const launch = buildLaunch({ admission, envelope, release, cloudResult })
      const launchDisposition = await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'launches', invocationId),
        record: launch,
        parse: assertLaunch,
      })
      if (launchDisposition !== 'created') {
        throw conflict('source_analysis_l4_probe_launch_collision')
      }
      return reconcileLaunch({
        input,
        invocationId,
        envelope,
        admission,
        release,
        finalized,
        probeScope,
        launch,
      })
    },
  }
  return Object.freeze(owner)
}

async function reconcileExisting(input: {
  readonly input: Parameters<
    typeof createCanonicalSourceAnalysisL4ProbeAttemptOwner
  >[0]
  readonly prefix: string
  readonly invocationId: string
  readonly envelope: ProbeEnvelope
  readonly admission: CanonicalSourceAnalysisL4ProbeAdmission
  readonly release: CanonicalProfessionalToolGpuRuntimeRelease
  readonly finalized: CanonicalSourceAnalysisFinalizedAuthority
  readonly probeScope: CanonicalSourceAnalysisProbeAuthorityScope
}): Promise<CanonicalSourceAnalysisL4ProbeAttemptResult> {
  const launch = await readRecord({
    port: input.input.lifecycleObjectPort,
    path: recordPath(input.prefix, 'launches', input.invocationId),
    parse: assertLaunch,
  })
  if (!launch) return reconciliationRequired({
    invocationId: input.invocationId,
    blockerCode: 'source_probe_consumed_launch_not_observed',
    cloudJobStartState: 'unknown',
  })
  assertLaunchMatches({
    launch,
    admission: input.admission,
    envelope: input.envelope,
    release: input.release,
  })
  return reconcileLaunch({
    input: input.input,
    invocationId: input.invocationId,
    envelope: input.envelope,
    admission: input.admission,
    release: input.release,
    finalized: input.finalized,
    probeScope: input.probeScope,
    launch,
  })
}

async function reconcileLaunch(input: {
  readonly input: Parameters<
    typeof createCanonicalSourceAnalysisL4ProbeAttemptOwner
  >[0]
  readonly invocationId: string
  readonly envelope: ProbeEnvelope
  readonly admission: CanonicalSourceAnalysisL4ProbeAdmission
  readonly release: CanonicalProfessionalToolGpuRuntimeRelease
  readonly finalized: CanonicalSourceAnalysisFinalizedAuthority
  readonly probeScope: CanonicalSourceAnalysisProbeAuthorityScope
  readonly launch: ProbeLaunch
}): Promise<CanonicalSourceAnalysisL4ProbeAttemptResult> {
  if (input.launch.disposition === 'rejected_before_creation') {
    return Object.freeze({
      status: 'failed_before_creation' as const,
      invocationId: input.invocationId,
      cloudJobStarted: false as const,
      substantiveWorkExecuted: false as const,
      automaticRetryAllowed: false as const,
      customerCreditMutated: false as const,
    })
  }
  if (
    input.launch.disposition ===
      'outcome_unknown_requires_reconciliation'
  ) return reconciliationRequired({
    invocationId: input.invocationId,
    blockerCode: 'source_probe_cloud_outcome_unknown',
    cloudJobStartState: 'unknown',
  })
  const workerRaw = await input.input.workerResultReadPort
    .readCompletedWorkerResult({
      invocationId: input.invocationId,
      envelopeHash: input.envelope.envelopeHash,
    })
  if (!workerRaw) return reconciliationRequired({
    invocationId: input.invocationId,
    blockerCode: 'source_probe_worker_result_not_ready',
    cloudJobStartState: 'known_started',
  })
  const worker = assertCanonicalSourceAnalysisL4ProbeWorkerResult(workerRaw)
  assertWorkerMatches({
    worker,
    envelope: input.envelope,
    admission: input.admission,
    release: input.release,
    finalized: input.finalized,
    launch: input.launch,
  })
  const costRaw = await input.input.usageCostReadPort.readCompletedUsageCost({
    invocationId: input.invocationId,
    envelopeHash: input.envelope.envelopeHash,
  })
  if (!costRaw) return reconciliationRequired({
    invocationId: input.invocationId,
    blockerCode: 'source_probe_terminal_cost_not_ready',
    cloudJobStartState: 'known_started',
  })
  assertPlainSerializedData(costRaw, 'source_analysis_l4_probe_usage_cost')
  const cost = assertVisualIntelligenceSourceGpuEvidenceUsageCost(costRaw)
  assertCostMatches({
    cost,
    worker,
    admission: input.admission,
    release: input.release,
    envelope: input.envelope,
    launch: input.launch,
  })
  const probe = verifyCanonicalSourceAnalysisProbeAuthority({
    untrusted: {
      schemaVersion: 'canonical-source-analysis-probe-authority-v2',
      ownerUserId: input.finalized.ownerUserId,
      workspaceId: input.finalized.workspaceId,
      projectId: input.finalized.projectId,
      editSessionId: input.finalized.editSessionId,
      sourceSequenceItemId: input.finalized.sourceSequenceItemId,
      mediaAssetId: input.finalized.mediaAssetId,
      uploadedOrder: input.finalized.uploadedOrder,
      checksumSha256: input.finalized.checksumSha256,
      byteLength: input.finalized.byteLength,
      storageGeneration: input.finalized.storageGeneration,
      storageEtag: input.finalized.storageEtag,
      width: worker.width,
      height: worker.height,
      hasAudio: worker.hasAudio,
      audioProbe: worker.audioProbe,
      fpsNumerator: worker.fpsNumerator,
      fpsDenominator: worker.fpsDenominator,
      frameCount: worker.frameCount,
      sourceTimeBaseNumerator: worker.sourceTimeBaseNumerator,
      sourceTimeBaseDenominator: worker.sourceTimeBaseDenominator,
      constantFrameRate: true,
      finalizedMediaAuthorityRef:
        input.finalized.finalizedMediaAuthorityRef,
      finalizedStorageObjectAuthorityRef:
        input.finalized.finalizedStorageObjectAuthorityRef,
      sourceProbeAuthorityRef: worker.gpuFrameCountEvidenceRef,
      probeRuntimeReleaseRef: releaseRef(input.release),
      resultRuntimeRecordRef: worker.workerRuntimeRecordRef,
      usageCostEvidenceRef: cost.attemptCostReceiptRef,
      operationId: OPERATION_ID,
      routeProfileId: ROUTE_PROFILE_ID,
      acceleratorClass: 'nvidia_l4',
      userTriggeredOnly: true,
      minimumIdleInstances: 0,
      exactFinalizedSourceRereadVerified: true,
      exactProbeResultRereadVerified: true,
      ffprobeUsedForMetadataOnly: true,
      gpuDecodeUsedForFrameCountVerification: true,
      substantiveCpuMediaProcessingUsed: false,
      runtimeNetworkDownloadPerformed: false,
      customerCreditMutated: false,
      systemFailureChargedToCustomer: false,
      unapprovedOverageChargedToCustomer: false,
      scaleBackToZeroVerified: true,
      callerProbeFieldsAccepted: false,
      callerPathUrlBytesOrCommandAccepted: false,
      providerCalled: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    },
    expected: input.probeScope,
  })
  const persisted = await input.input.probeAuthorityRepository
    .persistCreateOnly({ scope: input.probeScope, authority: probe })
  return readyResult({
    disposition: persisted.disposition,
    invocationId: input.invocationId,
    probe,
  })
}

function assertAdmissionMatches(input: {
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  trigger: CanonicalSourceAnalysisL4ProbeTrigger
  finalized: CanonicalSourceAnalysisFinalizedAuthority
}): void {
  const expectedTriggerRef = ref(
    input.trigger.requestId,
    input.trigger.triggerHash,
  )
  if (
    !sameRef(input.admission.triggerRef, expectedTriggerRef)
    || stableAuthorityStringify(input.admission.sourceIdentity) !==
      stableAuthorityStringify(input.trigger.sourceIdentity)
    || !sameRef(
      input.admission.finalizedMediaAuthorityRef,
      input.finalized.finalizedMediaAuthorityRef,
    )
    || !sameRef(
      input.admission.finalizedStorageObjectAuthorityRef,
      input.finalized.finalizedStorageObjectAuthorityRef,
    )
    || !sameRef(
      input.admission.sourceAnalysisConsentRef,
      input.finalized.sourceAnalysisConsentRef,
    )
    || !sameRef(
      input.admission.platformAnalysisCostCapRef,
      input.finalized.platformAnalysisCostCapRef,
    )
  ) throw conflict('source_analysis_l4_probe_admission_scope_mismatch')
}

function assertProbeRuntimeRelease(
  value: unknown,
  at: string,
): CanonicalProfessionalToolGpuRuntimeRelease {
  const release = assertCanonicalProfessionalToolGpuRuntimeRelease(value, at)
  if (
    release.evidenceClass !== 'canonical_private_reread'
    || release.status !== 'private_internal_qualified'
    || release.toolId !== 'ffmpeg'
    || release.gpuExecutionOwnerBindingMode !== 'native_gpu_implementation'
    || release.gpuExecutionOwnerToolId !== 'ffmpeg'
    || release.operationId !== OPERATION_ID
    || release.toolCostProfileId !== 'gpu-tool-ffmpeg-v1'
    || release.modelOrOperationCostProfileId !==
      MODEL_OR_OPERATION_COST_PROFILE_ID
    || release.routeId !== 'l4_standard_primary'
    || release.executionTarget !== 'google_cloud_run_l4_job'
    || release.machineType !== 'cloud_run_nvidia_l4'
    || release.accelerator !== 'nvidia_l4'
    || release.substantiveGpuEvidenceClass !==
      'nvenc_nvdec_hardware_codec_execution'
    || release.privateInternalQualified !== true
  ) throw conflict('source_analysis_l4_probe_runtime_release_invalid')
  return release
}

function buildEnvelope(input: {
  invocationId: string
  trigger: CanonicalSourceAnalysisL4ProbeTrigger
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  finalized: CanonicalSourceAnalysisFinalizedAuthority
  release: CanonicalProfessionalToolGpuRuntimeRelease
}): ProbeEnvelope {
  const payload = envelopeWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-analysis-l4-probe-envelope-v1',
    source: 'canonical_source_analysis_l4_probe_attempt_owner',
    invocationId: input.invocationId,
    triggerRef: input.admission.triggerRef,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    releaseRef: releaseRef(input.release),
    sourceIdentity: input.trigger.sourceIdentity,
    finalizedMediaAuthorityRef: input.finalized.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      input.finalized.finalizedStorageObjectAuthorityRef,
    sourceAnalysisConsentRef: input.finalized.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef: input.finalized.platformAnalysisCostCapRef,
    currentAccountRateAuthorityRef:
      input.admission.currentAccountRateAuthorityRef,
    immutableImageDigest: input.release.immutableImageDigest,
    operationId: OPERATION_ID,
    routeProfileId: ROUTE_PROFILE_ID,
    algorithm: {
      ffprobeMetadataOnly: true,
      nvdecCompleteFrameCountRequired: true,
      exactRationalFpsRequired: true,
      exactSourceTimeBaseRequired: true,
      constantFrameRateRequiredUntilCanonicalVfrMappingExists: true,
      substantiveCpuMediaProcessingAllowed: false,
    },
    dispatchBoundary: {
      cloudRunReceivesOnlyInvocationId: true,
      privateWorkerRereadsEnvelopeByExactDigest: true,
      callerPathUrlBytesCommandOrEnvironmentIncluded: false,
      runtimeNetworkDownloadAllowed: false,
      maximumAttempts: 1,
      uncertainOutcomeRetryAllowed: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAllowed: false,
      productionAuthorityGranted: false,
    },
  })
  return envelopeSchema.parse({
    ...payload,
    envelopeHash: sha256AuthorityValue(payload),
  })
}

function buildConsumption(input: {
  trigger: CanonicalSourceAnalysisL4ProbeTrigger
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  envelope: ProbeEnvelope
}) {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-analysis-l4-probe-consumption-v1',
    source: 'canonical_source_analysis_l4_probe_attempt_owner',
    invocationId: input.envelope.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    envelopeRef: ref(input.envelope.invocationId,
      input.envelope.envelopeHash),
    idempotencyKey: input.trigger.idempotencyKey,
    consumedBeforeCloudRunCall: true,
    maximumAttempts: 1,
    uncertainOutcomeRetryAllowed: false,
    customerCreditsMutated: false,
    consumedAt: input.trigger.triggeredAt,
  })
  return consumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  })
}

function buildLaunch(input: {
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  envelope: ProbeEnvelope
  release: CanonicalProfessionalToolGpuRuntimeRelease
  cloudResult: CanonicalSourceAnalysisL4ProbeCloudRunResult
}): ProbeLaunch {
  const payload = launchWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-analysis-l4-probe-launch-v1',
    source: 'canonical_source_analysis_l4_probe_attempt_owner',
    invocationId: input.envelope.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    envelopeRef: ref(input.envelope.invocationId,
      input.envelope.envelopeHash),
    releaseRef: releaseRef(input.release),
    cloudJobCreateRequestRef: input.cloudResult.cloudJobCreateRequestRef,
    cloudRunOperationRef: input.cloudResult.cloudRunOperationRef,
    cloudRunExecutionRef: input.cloudResult.cloudRunExecutionRef,
    cloudRunTerminalObservationRef:
      input.cloudResult.cloudRunTerminalObservationRef,
    disposition: input.cloudResult.disposition,
    providerInferenceOrSubstantiveWorkOutcome:
      input.cloudResult.providerInferenceOrSubstantiveWorkOutcome,
    runningTaskCount: input.cloudResult.runningTaskCount,
    createOnlyConsumptionPersistedBeforeCloudRunCall: true,
    duplicateDispatchAllowed: false,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    observedAt: input.cloudResult.observedAt,
  })
  return launchSchema.parse({
    ...payload,
    launchHash: sha256AuthorityValue(payload),
  })
}

function assertWorkerMatches(input: {
  worker: CanonicalSourceAnalysisL4ProbeWorkerResult
  envelope: ProbeEnvelope
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  release: CanonicalProfessionalToolGpuRuntimeRelease
  finalized: CanonicalSourceAnalysisFinalizedAuthority
  launch: ProbeLaunch
}): void {
  const refs = [
    input.worker.workerRuntimeRecordRef,
    input.worker.gpuFrameCountEvidenceRef,
    input.worker.cloudRunExecutionRef,
  ]
  if (
    input.worker.invocationId !== input.envelope.invocationId
    || input.worker.envelopeHash !== input.envelope.envelopeHash
    || !sameRef(input.worker.admissionRef,
      ref(input.admission.admissionId, input.admission.admissionHash))
    || !sameRef(input.worker.releaseRef, releaseRef(input.release))
    || input.launch.cloudRunExecutionRef === null
    || !sameRef(input.worker.cloudRunExecutionRef,
      input.launch.cloudRunExecutionRef)
    || stableAuthorityStringify(input.worker.sourceIdentity) !==
      stableAuthorityStringify(input.envelope.sourceIdentity)
    || !sameRef(input.worker.finalizedMediaAuthorityRef,
      input.finalized.finalizedMediaAuthorityRef)
    || !sameRef(input.worker.finalizedStorageObjectAuthorityRef,
      input.finalized.finalizedStorageObjectAuthorityRef)
    || input.worker.execution.sourceBytesRead !== input.finalized.byteLength
    || new Set(refs.map(refKey)).size !== refs.length
  ) throw conflict('source_analysis_l4_probe_worker_result_mismatch')
}

function assertCostMatches(input: {
  cost: VisualIntelligenceSourceGpuEvidenceUsageCost
  worker: CanonicalSourceAnalysisL4ProbeWorkerResult
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  release: CanonicalProfessionalToolGpuRuntimeRelease
  envelope: ProbeEnvelope
  launch: ProbeLaunch
}): void {
  const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.cost.accountEffectiveRateAuthority,
    input.cost.observedAt,
  )
  const authorityRef = ref(
    authority.rateAuthorityId,
    authority.rateAuthorityHash,
    authority.rateAuthorityVersion,
  )
  if (
    input.cost.invocationId !== input.envelope.invocationId
    || input.cost.envelopeDigestSha256 !==
      `sha256:${input.envelope.envelopeHash}`
    || !sameRef(input.cost.releaseRef, releaseRef(input.release))
    || input.launch.cloudRunExecutionRef === null
    || input.launch.cloudRunTerminalObservationRef === null
    || !sameRef(input.cost.cloudRunExecutionRef,
      input.launch.cloudRunExecutionRef)
    || !sameRef(input.cost.cloudRunTerminalObservationRef,
      input.launch.cloudRunTerminalObservationRef)
    || !sameRef(authorityRef,
      input.admission.currentAccountRateAuthorityRef)
    || authority.region !== input.release.runtimeRegion
    || input.cost.actualUsage.activeExecutionMilliseconds <
      input.worker.execution.workerActiveMilliseconds
    || input.cost.actualUsage.persistedPrivateBytes <
      input.worker.execution.persistedPrivateBytes
    || input.cost.actualUsage.privateArtifactRetentionMilliseconds !==
      input.worker.execution.privateArtifactRetentionMilliseconds
    || input.cost.actualUsage.classAOperationCount <
      input.worker.execution.classAOperationCount
    || input.cost.actualUsage.classBOperationCount <
      input.worker.execution.classBOperationCount
    || input.cost.actualCost.totalInternalCostUsdNanos >
      input.admission.maximumPlatformInternalCostUsdNanos
  ) throw conflict('source_analysis_l4_probe_usage_cost_mismatch')
}

function assertLaunchMatches(input: {
  launch: ProbeLaunch
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  envelope: ProbeEnvelope
  release: CanonicalProfessionalToolGpuRuntimeRelease
}): void {
  if (
    input.launch.invocationId !== input.envelope.invocationId
    || !sameRef(input.launch.admissionRef,
      ref(input.admission.admissionId, input.admission.admissionHash))
    || !sameRef(input.launch.envelopeRef,
      ref(input.envelope.invocationId, input.envelope.envelopeHash))
    || !sameRef(input.launch.releaseRef, releaseRef(input.release))
    || Date.parse(input.launch.observedAt) <
      Date.parse(input.admission.admittedAt)
  ) throw conflict('source_analysis_l4_probe_launch_mismatch')
}

function assertEnvelope(value: unknown): ProbeEnvelope {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_envelope')
  const envelope = envelopeSchema.parse(value)
  const { envelopeHash, ...payload } = envelope
  if (envelopeHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_probe_envelope_hash_invalid')
  }
  return envelope
}

function assertConsumption(value: unknown) {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_consumption')
  const consumption = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = consumption
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_probe_consumption_hash_invalid')
  }
  return consumption
}

function assertLaunch(value: unknown): ProbeLaunch {
  assertPlainSerializedData(value, 'source_analysis_l4_probe_launch')
  const launch = launchSchema.parse(value)
  const { launchHash, ...payload } = launch
  if (launchHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_probe_launch_hash_invalid')
  }
  return launch
}

async function createAndReread<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  record: T
  parse: (value: unknown) => T
}): Promise<'created' | 'already_exists'> {
  const body = serialize(input.record)
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: sha256Buffer(body),
  })
  const reread = await readRecord({
    port: input.port,
    path: input.path,
    parse: input.parse,
  })
  if (
    !reread
    || stableAuthorityStringify(reread) !==
      stableAuthorityStringify(input.record)
  ) throw conflict('source_analysis_l4_probe_create_reread_mismatch')
  return disposition
}

async function readRecord<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (
    !Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES
  ) throw conflict('source_analysis_l4_probe_record_bytes_invalid')
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('source_analysis_l4_probe_record_json_invalid')
  }
  const parsed = input.parse(untrusted)
  if (body.toString('utf8') !== stableAuthorityStringify(parsed)) {
    throw conflict('source_analysis_l4_probe_record_not_canonical')
  }
  return parsed
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('source_analysis_l4_probe_record_size_invalid')
  }
  return body
}

function probeScopeFor(
  finalized: CanonicalSourceAnalysisFinalizedAuthority,
): CanonicalSourceAnalysisProbeAuthorityScope {
  return Object.freeze({
    ownerUserId: finalized.ownerUserId,
    workspaceId: finalized.workspaceId,
    projectId: finalized.projectId,
    editSessionId: finalized.editSessionId,
    sourceSequenceItemId: finalized.sourceSequenceItemId,
    mediaAssetId: finalized.mediaAssetId,
    uploadedOrder: finalized.uploadedOrder,
    checksumSha256: finalized.checksumSha256,
    byteLength: finalized.byteLength,
    storageGeneration: finalized.storageGeneration,
    storageEtag: finalized.storageEtag,
    finalizedMediaAuthorityRef: finalized.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      finalized.finalizedStorageObjectAuthorityRef,
  })
}

function identityScope(
  source: CanonicalSourceAnalysisFinalizedAuthorityExpectation,
) {
  return Object.freeze({
    ownerUserId: source.ownerUserId,
    workspaceId: source.workspaceId,
    projectId: source.projectId,
    editSessionId: source.editSessionId,
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
  })
}

function invocationIdFor(
  trigger: CanonicalSourceAnalysisL4ProbeTrigger,
): string {
  return `source-probe-${sha256AuthorityValue({
    triggerHash: trigger.triggerHash,
    idempotencyKey: trigger.idempotencyKey,
    operationId: OPERATION_ID,
  }).slice(0, 40)}`
}

function releaseRef(
  release: CanonicalProfessionalToolGpuRuntimeRelease,
): VisualIntelligenceEvidenceRef {
  return ref(release.releaseId, release.releaseHash, release.releaseVersion)
}

function ref(
  id: string,
  rawHash: string,
  version = 1,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id,
    version,
    contentHash: `sha256:${rawHash}`,
  })
}

function opaqueRef(id: string, value: unknown): VisualIntelligenceEvidenceRef {
  return ref(id, sha256AuthorityValue(value))
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

function recordPath(prefix: string, kind: string, invocationId: string) {
  if (!safeId.safeParse(invocationId).success || !safeId.safeParse(kind).success) {
    throw conflict('source_analysis_l4_probe_record_path_invalid')
  }
  return `${prefix}/${kind}/${sha256AuthorityValue(invocationId)}.json`
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
  ) throw conflict('source_analysis_l4_probe_prefix_invalid')
  return normalized
}

function readyResult(input: {
  disposition: 'created' | 'identical_replay'
  invocationId: string
  probe: CanonicalSourceAnalysisProbeAuthority
}): CanonicalSourceAnalysisL4ProbeAttemptResult {
  return Object.freeze({
    status: 'ready' as const,
    disposition: input.disposition,
    invocationId: input.invocationId,
    sourceProbeAuthorityRef: Object.freeze({
      ...input.probe.sourceProbeAuthorityRef,
    }),
    usageCostEvidenceRef: Object.freeze({
      ...input.probe.usageCostEvidenceRef,
    }),
    persistedProbeAuthorityExactRereadVerified: true as const,
    workerResultAndAccountEffectiveCostLineageBound: true as const,
    scaleBackToZeroVerified: true as const,
    platformFundedPreapprovalAnalysis: true as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function notReady(
  blockerCode: Extract<
    CanonicalSourceAnalysisL4ProbeAttemptResult,
    { status: 'not_ready' }
  >['blockerCode'],
): CanonicalSourceAnalysisL4ProbeAttemptResult {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    cloudJobStarted: false as const,
    automaticRetryAllowed: false as const,
    customerCreditMutated: false as const,
  })
}

function reconciliationRequired(input: {
  invocationId: string
  blockerCode: Extract<
    CanonicalSourceAnalysisL4ProbeAttemptResult,
    { status: 'reconciliation_required' }
  >['blockerCode']
  cloudJobStartState: 'known_started' | 'unknown'
}): CanonicalSourceAnalysisL4ProbeAttemptResult {
  return Object.freeze({
    status: 'reconciliation_required' as const,
    invocationId: input.invocationId,
    blockerCode: input.blockerCode,
    cloudJobStartState: input.cloudJobStartState,
    automaticRetryAllowed: false as const,
    unknownOutcomeChargedToCustomer: false as const,
    customerCreditMutated: false as const,
  })
}

function validateDependencies(input: {
  finalizedAuthorityReadPort: CanonicalSourceAnalysisFinalizedAuthorityReadPort
  admissionReadPort: CanonicalSourceAnalysisL4ProbeAdmissionReadPort
  runtimeReleaseReadPort:
    CanonicalSourceAnalysisL4ProbeRuntimeReleaseReadPort
  cloudRunPort: CanonicalSourceAnalysisL4ProbeCloudRunPort
  workerResultReadPort: CanonicalSourceAnalysisL4ProbeWorkerResultReadPort
  usageCostReadPort: CanonicalSourceAnalysisL4ProbeUsageCostReadPort
  probeAuthorityRepository: CanonicalSourceAnalysisProbeAuthorityRepository
  lifecycleObjectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    input.finalizedAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION
    || typeof input.finalizedAuthorityReadPort.readExactFinalizedSource !==
      'function'
    || input.admissionReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-probe-admission-read-port-v1'
    || typeof input.admissionReadPort.rereadAdmittedProbe !== 'function'
    || input.runtimeReleaseReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-probe-runtime-release-read-port-v1'
    || typeof input.runtimeReleaseReadPort.rereadPrivateL4ProbeRelease !==
      'function'
    || typeof input.cloudRunPort?.runOnce !== 'function'
    || typeof input.workerResultReadPort?.readCompletedWorkerResult !==
      'function'
    || typeof input.usageCostReadPort?.readCompletedUsageCost !== 'function'
    || typeof input.probeAuthorityRepository?.persistCreateOnly !== 'function'
    || typeof input.probeAuthorityRepository?.readCompletedExactProbe !==
      'function'
    || typeof input.lifecycleObjectPort?.createOnly !== 'function'
    || typeof input.lifecycleObjectPort?.readExact !== 'function'
  ) throw notReadyError('source_analysis_l4_probe_dependencies_invalid')
}

function sha256Buffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-analysis L4 probe attempt is stale or inconsistent.',
    409,
    { reason },
  )
}

function notReadyError(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source-analysis L4 probe attempt is not ready.',
    503,
    { reason },
  )
}
