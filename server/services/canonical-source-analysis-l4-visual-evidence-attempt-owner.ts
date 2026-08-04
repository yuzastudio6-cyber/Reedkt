import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisPlanningScope,
  verifyCanonicalSourceAnalysisPreparedRequestForPlanning,
  type CanonicalSourceAnalysisPlanningScope,
  type CanonicalSourceAnalysisRequestAuthorityReadPort,
} from './canonical-source-led-orchestra-planning-reconciliation'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceResult,
  type CanonicalSourceAnalysisL4VisualEvidenceRepository,
  type CanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-attempt-owner-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TRIGGER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-trigger-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_VERSION =
  'canonical-source-analysis-l4-visual-evidence-admission-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RELEASE_VERSION =
  'canonical-source-analysis-l4-visual-evidence-release-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_EXECUTION_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-execution-port-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CLOUD_RUN_JOB_NAME = 'reeditpro-professional-l4' as const
const OPERATION_ID =
  'internal.visual_intelligence.prepare_source_visual_evidence.v1' as const
const ROUTE_PROFILE_ID =
  'quality_l4_user_triggered_standard_media_job_v1' as const
const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-attempts'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const CLOUD_RUN_API_ORIGIN = 'https://run.googleapis.com' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const region = z.enum(['us-central1', 'europe-west4'])

const triggerWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TRIGGER_VERSION,
  ),
  source: z.literal(
    'authenticated_server_source_visual_evidence_trigger',
  ),
  requestId: safeId,
  planningScope: z.unknown(),
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  userTriggerRecordRef: evidenceRefSchema,
  idempotencyKey: safeId,
  triggeredAt: timestamp,
  serverPreparedRequestRequired: z.literal(true),
  browserSourceOrEvidenceAuthorityAccepted: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutationAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const triggerSchema = triggerWithoutHashSchema.extend({
  triggerHash: rawSha256,
}).strict()

export interface CanonicalSourceAnalysisL4VisualEvidenceTrigger extends Omit<
  z.infer<typeof triggerSchema>,
  'planningScope'
> {
  readonly planningScope: CanonicalSourceAnalysisPlanningScope
}

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_source_visual_evidence_admission_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  admissionId: safeId,
  triggerRef: evidenceRefSchema,
  scopeDigestSha256: rawSha256,
  preparedRequestContentRef: evidenceRefSchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  sourceProbeAuthorityRef: evidenceRefSchema,
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
  createOnlyConsumptionRequiredBeforeCloudRunCall: z.literal(true),
  exactPreparedSourceProbeConsentCostRateAndReleaseReread: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  platformFundedPreapprovalAnalysis: z.literal(true),
  maximumPlatformInternalCostUsdNanos: positiveInteger,
  customerCreditReservationRequired: z.literal(false),
  customerCreditsMutated: z.literal(false),
  systemFailureOrUnknownCostChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.admittedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'L4 visual evidence admission expiry is invalid.',
    })
  }
})
const admissionSchema = admissionWithoutHashSchema.extend({
  admissionHash: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceAdmission = z.infer<
  typeof admissionSchema
>

const roles = [
  'media_probe',
  'private_media_transform',
  'scene_detection',
  'pixel_measurement',
  'exact_visible_text',
  'sampling_policy',
] as const
const releaseToolSchema = z.object({
  role: z.enum(roles),
  operationId: safeId,
  runtimeReleaseRef: evidenceRefSchema,
}).strict()
const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_source_visual_evidence_release_registry',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  releaseRef: evidenceRefSchema,
  operationId: z.literal(OPERATION_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  routeId: z.literal('l4_standard_primary'),
  projectId: z.literal(PROJECT_ID),
  runtimeRegion: region,
  cloudRunJobName: z.literal(CLOUD_RUN_JOB_NAME),
  cloudRunJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/reeditpro-professional-l4$/u,
  ),
  acceleratorClass: z.literal('nvidia_l4'),
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  toolReleases: z.array(releaseToolSchema).length(roles.length),
  maximumExecutionSeconds: z.literal(900),
  maximumAttempts: z.literal(1),
  minimumIdleInstances: z.literal(0),
  configuredGpuType: z.literal('nvidia-l4'),
  runtimeDownloadAllowed: z.literal(false),
  callerCommandImageModelPathUrlOrEnvironmentAccepted: z.literal(false),
  substantiveCpuMediaProcessingAllowed: z.literal(false),
  retryAfterUnknownOutcomeAllowed: z.literal(false),
  accountEffectivePricingRequired: z.literal(true),
  publicListPriceSettlementAllowed: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()
const releaseSchema = releaseWithoutHashSchema.extend({
  releaseHash: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceRelease = z.infer<
  typeof releaseSchema
>

const executionResultSchema = z.object({
  disposition: z.enum([
    'accepted', 'rejected_before_creation',
    'outcome_unknown_requires_reconciliation',
  ]),
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema.nullable(),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'not_executed', 'unknown',
  ]),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const valid = value.disposition === 'accepted'
    ? value.cloudRunOperationRef !== null
      && value.providerInferenceOrSubstantiveWorkOutcome === 'not_executed'
    : value.disposition === 'rejected_before_creation'
      ? value.cloudRunOperationRef === null
        && value.providerInferenceOrSubstantiveWorkOutcome === 'not_executed'
      : value.cloudRunOperationRef === null
        && value.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
  if (!valid) context.addIssue({
    code: 'custom',
    message: 'L4 visual evidence Cloud Run result is inconsistent.',
  })
})
export type CanonicalSourceAnalysisL4VisualEvidenceExecutionResult = z.infer<
  typeof executionResultSchema
>

const envelopeWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-analysis-l4-visual-evidence-envelope-v1',
  ),
  source: z.literal(
    'canonical_source_analysis_l4_visual_evidence_attempt_owner',
  ),
  invocationId: safeId,
  triggerRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  scope: z.unknown(),
  idempotencyKey: safeId,
  operationId: z.literal(OPERATION_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  cloudRunReceivesOnlyInvocationId: z.literal(true),
  privateWorkerRereadsEnvelopeByExactDigest: z.literal(true),
  callerPathUrlBytesCommandOrEnvironmentIncluded: z.literal(false),
  runtimeNetworkDownloadAllowed: z.literal(false),
  maximumAttempts: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  customerCreditMutationAllowed: z.literal(false),
  publicDeliveryAllowed: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const envelopeSchema = envelopeWithoutHashSchema.extend({
  envelopeHash: rawSha256,
}).strict()
type VisualEvidenceEnvelope = z.infer<typeof envelopeSchema>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-analysis-l4-visual-evidence-consumption-v1',
  ),
  source: z.literal(
    'canonical_source_analysis_l4_visual_evidence_attempt_owner',
  ),
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
type VisualEvidenceConsumption = z.infer<typeof consumptionSchema>

const launchWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-analysis-l4-visual-evidence-launch-v1',
  ),
  source: z.literal(
    'canonical_source_analysis_l4_visual_evidence_attempt_owner',
  ),
  invocationId: safeId,
  admissionRef: evidenceRefSchema,
  envelopeRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  cloudJobCreateRequestRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema.nullable(),
  disposition: executionResultSchema.shape.disposition,
  providerInferenceOrSubstantiveWorkOutcome:
    executionResultSchema.shape.providerInferenceOrSubstantiveWorkOutcome,
  createOnlyConsumptionPersistedBeforeCloudRunCall: z.literal(true),
  duplicateDispatchAllowed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  observedAt: timestamp,
}).strict()
const launchSchema = launchWithoutHashSchema.extend({
  launchHash: rawSha256,
}).strict()
type VisualEvidenceLaunch = z.infer<typeof launchSchema>

export interface CanonicalSourceAnalysisL4VisualEvidenceAdmissionReadPort {
  readonly schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1'
  rereadAdmittedExecution(input: Readonly<{
    trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
    scope: CanonicalSourceTranscriptOrchestraReadScope
    preparedRequestContentRef: VisualIntelligenceEvidenceRef
  }>): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceReleaseReadPort {
  readonly schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-release-read-port-v1'
  rereadPrivateRelease(input: Readonly<{
    admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  }>): Promise<unknown | null>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceExecutionPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_EXECUTION_PORT_VERSION
  runOnce(input: Readonly<{
    release: CanonicalSourceAnalysisL4VisualEvidenceRelease
    invocationId: string
  }>): Promise<unknown>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceTerminalReadPort {
  readonly schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1'
  readCompleted(input: Readonly<{
    invocationId: string
    envelopeHash: string
    admissionRef: VisualIntelligenceEvidenceRef
    releaseRef: VisualIntelligenceEvidenceRef
  }>): Promise<unknown | null>
}

export type CanonicalSourceAnalysisL4VisualEvidenceAttemptResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_source_visual_evidence_prepared_request_not_ready'
        | 'canonical_source_visual_evidence_admission_not_ready'
        | 'canonical_source_visual_evidence_release_not_ready'
      cloudJobStarted: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'reconciliation_required'
      invocationId: string
      blockerCode:
        | 'source_visual_evidence_consumed_launch_not_observed'
        | 'source_visual_evidence_cloud_outcome_unknown'
        | 'source_visual_evidence_terminal_result_not_ready'
      cloudJobStartState: 'known_started' | 'unknown'
      automaticRetryAllowed: false
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
      resultDigestSha256: string
      attemptCostEvidenceRef: VisualIntelligenceEvidenceRef
      exactTerminalEvidencePersistedAndReread: true
      scaleBackToZeroVerified: true
      platformFundedPreapprovalAnalysis: true
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_OWNER_VERSION
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
    trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceAttemptResult>
}

export function createCanonicalSourceAnalysisL4VisualEvidenceTrigger(
  input: Omit<
    CanonicalSourceAnalysisL4VisualEvidenceTrigger,
    'schemaVersion' | 'source' | 'triggerHash'
  >,
): CanonicalSourceAnalysisL4VisualEvidenceTrigger {
  assertPlainSerializedData(input, 'source_visual_evidence_trigger_input')
  const planningScope = verifyCanonicalSourceAnalysisPlanningScope(
    input.planningScope,
  )
  const payload = triggerWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TRIGGER_VERSION,
    source: 'authenticated_server_source_visual_evidence_trigger',
    ...input,
    planningScope,
  })
  return Object.freeze({
    ...payload,
    planningScope,
    triggerHash: sha256AuthorityValue(payload),
  }) as CanonicalSourceAnalysisL4VisualEvidenceTrigger
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceTrigger(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceTrigger {
  assertPlainSerializedData(value, 'source_visual_evidence_trigger')
  const parsed = triggerSchema.parse(value)
  const planningScope = verifyCanonicalSourceAnalysisPlanningScope(
    parsed.planningScope,
  )
  const normalized = { ...parsed, planningScope }
  const { triggerHash, ...payload } = normalized
  if (triggerHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_trigger_hash_invalid')
  }
  return Object.freeze(normalized) as
    CanonicalSourceAnalysisL4VisualEvidenceTrigger
}

export function createCanonicalSourceAnalysisL4VisualEvidenceAdmission(
  input: Omit<
    CanonicalSourceAnalysisL4VisualEvidenceAdmission,
    'schemaVersion' | 'source' | 'evidenceClass' | 'admissionHash'
  >,
): CanonicalSourceAnalysisL4VisualEvidenceAdmission {
  assertPlainSerializedData(input, 'source_visual_evidence_admission_input')
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_VERSION,
    source: 'canonical_server_source_visual_evidence_admission_owner',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  return Object.freeze(admissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
  value: unknown,
  at?: string,
): CanonicalSourceAnalysisL4VisualEvidenceAdmission {
  assertPlainSerializedData(value, 'source_visual_evidence_admission')
  const parsed = admissionSchema.parse(value)
  const { admissionHash, ...payload } = parsed
  if (
    admissionHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(parsed.admittedAt)
      || Date.parse(at) >= Date.parse(parsed.expiresAt)
    ))
  ) throw conflict('source_visual_evidence_admission_invalid')
  return Object.freeze(parsed)
}

export function createCanonicalSourceAnalysisL4VisualEvidenceRelease(
  input: Omit<
    CanonicalSourceAnalysisL4VisualEvidenceRelease,
    'schemaVersion' | 'source' | 'evidenceClass' | 'releaseHash'
  >,
): CanonicalSourceAnalysisL4VisualEvidenceRelease {
  assertPlainSerializedData(input, 'source_visual_evidence_release_input')
  const payload = releaseWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RELEASE_VERSION,
    source: 'canonical_server_source_visual_evidence_release_registry',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  assertReleaseSemantics(payload)
  return Object.freeze(releaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceRelease(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceRelease {
  assertPlainSerializedData(value, 'source_visual_evidence_release')
  const parsed = releaseSchema.parse(value)
  const { releaseHash, ...payload } = parsed
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_release_hash_invalid')
  }
  assertReleaseSemantics(payload)
  return Object.freeze(parsed)
}

export function createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner(
  input: Readonly<{
    requestAuthorityReadPort: CanonicalSourceAnalysisRequestAuthorityReadPort
    admissionReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceAdmissionReadPort
    releaseReadPort: CanonicalSourceAnalysisL4VisualEvidenceReleaseReadPort
    executionPort: CanonicalSourceAnalysisL4VisualEvidenceExecutionPort
    terminalReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceTerminalReadPort
    evidenceRepository: CanonicalSourceAnalysisL4VisualEvidenceRepository
    lifecycleObjectPort: CanonicalCreateOnlyJsonObjectPort
    prefix?: string
    now?: () => Date
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceAttemptOwner {
  validateDependencies(input)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ATTEMPT_OWNER_VERSION,
    operationId: OPERATION_ID,
    routeProfileId: ROUTE_PROFILE_ID,
    acceleratorClass: 'nvidia_l4' as const,
    userTriggeredScaleFromZero: true as const,
    minimumIdleInstances: 0 as const,
    maximumAttempts: 1 as const,
    automaticRetryAfterUncertainOutcomeAllowed: false as const,
    platformFundedPreapprovalAnalysis: true as const,
    customerCreditMutationAllowed: false as const,
    async executeOneShot(
      untrustedTrigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
    ) {
      const trigger = assertCanonicalSourceAnalysisL4VisualEvidenceTrigger(
        untrustedTrigger,
      )
      const preparedRaw = await input.requestAuthorityReadPort
        .readExactPreparedRequest(trigger.planningScope)
      if (!preparedRaw) return notReady(
        'canonical_source_visual_evidence_prepared_request_not_ready',
      )
      const prepared = verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
        scope: trigger.planningScope,
        request: preparedRaw,
      })
      const source = prepared.request.sources.find((candidate) =>
        candidate.sourceSequenceItemId === trigger.sourceSequenceItemId
        && candidate.mediaAssetId === trigger.mediaAssetId)
      if (!source) throw conflict('source_visual_evidence_source_missing')
      const scope = resultScope({
        request: prepared.request,
        analysisRunId: prepared.analysisRunId,
        source,
      })
      const existing = await input.evidenceRepository.readCompleted(scope)
      if (existing) return readyResult({
        disposition: 'identical_replay',
        invocationId: existing.invocationId,
        result: existing,
      })
      const invocationId = invocationIdFor(trigger)
      const startedAt = now().toISOString()
      const existingConsumption = await readRecord({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'consumptions', invocationId),
        parse: assertConsumption,
      })
      const preparedRequestContentRef = ref(
        `prepared-source-analysis-${prepared.requestDigest.slice(0, 32)}`,
        prepared.requestDigest,
      )
      const admissionRaw = await input.admissionReadPort
        .rereadAdmittedExecution({
          trigger,
          scope,
          preparedRequestContentRef,
        })
      if (!admissionRaw) return notReady(
        'canonical_source_visual_evidence_admission_not_ready',
      )
      const admission =
        assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
          admissionRaw,
          existingConsumption ? undefined : startedAt,
        )
      assertAdmissionMatches({
        admission,
        trigger,
        scope,
        source,
        preparedRequestContentRef,
      })
      const releaseRaw = await input.releaseReadPort.rereadPrivateRelease({
        admission,
      })
      if (!releaseRaw) return notReady(
        'canonical_source_visual_evidence_release_not_ready',
      )
      const release =
        assertCanonicalSourceAnalysisL4VisualEvidenceRelease(releaseRaw)
      if (!sameRef(admission.runtimeReleaseRef, release.releaseRef)) {
        throw conflict('source_visual_evidence_release_mismatch')
      }
      const envelope = buildEnvelope({
        invocationId,
        trigger,
        admission,
        release,
        scope,
      })
      let consumptionDisposition: 'created' | 'already_exists'
      if (existingConsumption) {
        const existingEnvelope = await readRecord({
          port: input.lifecycleObjectPort,
          path: recordPath(prefix, 'envelopes', invocationId),
          parse: assertEnvelope,
        })
        if (
          !existingEnvelope
          || stableAuthorityStringify(existingEnvelope) !==
            stableAuthorityStringify(envelope)
        ) throw conflict('source_visual_evidence_envelope_mismatch')
        assertConsumptionMatches({
          existingConsumption,
          trigger,
          admission,
          envelope,
        })
        consumptionDisposition = 'already_exists'
      } else {
        await createAndReread({
          port: input.lifecycleObjectPort,
          path: recordPath(prefix, 'envelopes', invocationId),
          record: envelope,
          parse: assertEnvelope,
        })
        const consumption = buildConsumption({
          trigger,
          admission,
          envelope,
          consumedAt: startedAt,
        })
        consumptionDisposition = await createAndReread({
          port: input.lifecycleObjectPort,
          path: recordPath(prefix, 'consumptions', invocationId),
          record: consumption,
          parse: assertConsumption,
        })
      }
      if (consumptionDisposition === 'already_exists') {
        const existingLaunch = await readRecord({
          port: input.lifecycleObjectPort,
          path: recordPath(prefix, 'launches', invocationId),
          parse: assertLaunch,
        })
        if (!existingLaunch) return reconciliationRequired({
          invocationId,
          blockerCode: 'source_visual_evidence_consumed_launch_not_observed',
          cloudJobStartState: 'unknown',
        })
        assertLaunchMatches({ existingLaunch, admission, envelope, release })
        return reconcileLaunch({
          input,
          invocationId,
          envelope,
          admission,
          release,
          source,
          scope,
          launch: existingLaunch,
        })
      }
      let executionResult: CanonicalSourceAnalysisL4VisualEvidenceExecutionResult
      try {
        executionResult = executionResultSchema.parse(
          await input.executionPort.runOnce({ release, invocationId }),
        )
      } catch {
        executionResult = executionResultSchema.parse({
          disposition: 'outcome_unknown_requires_reconciliation',
          cloudJobCreateRequestRef: opaqueRef(
            `${invocationId}.cloud-create-unknown`,
            { invocationId, envelopeHash: envelope.envelopeHash },
          ),
          cloudRunOperationRef: null,
          providerInferenceOrSubstantiveWorkOutcome: 'unknown',
          observedAt: now().toISOString(),
        })
      }
      if (Date.parse(executionResult.observedAt) < Date.parse(startedAt)) {
        throw conflict('source_visual_evidence_cloud_time_invalid')
      }
      const launch = buildLaunch({
        admission,
        envelope,
        release,
        executionResult,
      })
      if (await createAndReread({
        port: input.lifecycleObjectPort,
        path: recordPath(prefix, 'launches', invocationId),
        record: launch,
        parse: assertLaunch,
      }) !== 'created') throw conflict(
        'source_visual_evidence_launch_collision',
      )
      return reconcileLaunch({
        input,
        invocationId,
        envelope,
        admission,
        release,
        source,
        scope,
        launch,
      })
    },
  })
}

export function createGoogleCloudRunL4VisualEvidenceExecutionPort(input: {
  readonly auth?: Pick<GoogleAuth, 'request'>
  readonly now?: () => string
  readonly requestTimeoutMilliseconds?: number
} = {}): CanonicalSourceAnalysisL4VisualEvidenceExecutionPort {
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  const timeout = input.requestTimeoutMilliseconds ?? 15_000
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 30_000) {
    throw new TypeError('L4 visual evidence launch timeout is invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_EXECUTION_PORT_VERSION,
    async runOnce({
      release,
      invocationId,
    }: Parameters<
      CanonicalSourceAnalysisL4VisualEvidenceExecutionPort['runOnce']
    >[0]) {
      const exactRelease =
        assertCanonicalSourceAnalysisL4VisualEvidenceRelease(release)
      const createRequestRef = opaqueRef(
        `${invocationId}.cloud-create`,
        { invocationId, releaseHash: exactRelease.releaseHash },
      )
      let requestStarted = false
      try {
        requestStarted = true
        const response = await auth.request({
          url: `${CLOUD_RUN_API_ORIGIN}/v2/`
            + `${exactRelease.cloudRunJobResource}:run`,
          method: 'POST',
          data: {
            overrides: {
              taskCount: 1,
              timeout: `${exactRelease.maximumExecutionSeconds}s`,
              containerOverrides: [{
                env: [{
                  name: 'REEDITPRO_GPU_INVOCATION_ID',
                  value: invocationId,
                }],
              }],
            },
          },
          timeout,
          retry: false,
          maxRedirects: 0,
        })
        assertPlainSerializedData(response.data, 'l4_cloud_run_response')
        const operation = z.object({
          name: z.string().regex(
            /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
          ),
        }).passthrough().parse(response.data)
        return executionResultSchema.parse({
          disposition: 'accepted',
          cloudJobCreateRequestRef: createRequestRef,
          cloudRunOperationRef: opaqueRef(
            `${invocationId}.cloud-operation`,
            operation.name,
          ),
          providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
          observedAt: now(),
        })
      } catch {
        return executionResultSchema.parse({
          disposition: requestStarted
            ? 'outcome_unknown_requires_reconciliation'
            : 'rejected_before_creation',
          cloudJobCreateRequestRef: createRequestRef,
          cloudRunOperationRef: null,
          providerInferenceOrSubstantiveWorkOutcome: requestStarted
            ? 'unknown'
            : 'not_executed',
          observedAt: now(),
        })
      }
    },
  })
}

async function reconcileLaunch(input: Readonly<{
  input: Parameters<
    typeof createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner
  >[0]
  invocationId: string
  envelope: VisualEvidenceEnvelope
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  release: CanonicalSourceAnalysisL4VisualEvidenceRelease
  source: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']['sources'][number]
  scope: CanonicalSourceTranscriptOrchestraReadScope
  launch: VisualEvidenceLaunch
}>): Promise<CanonicalSourceAnalysisL4VisualEvidenceAttemptResult> {
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
  if (input.launch.disposition ===
    'outcome_unknown_requires_reconciliation') {
    return reconciliationRequired({
      invocationId: input.invocationId,
      blockerCode: 'source_visual_evidence_cloud_outcome_unknown',
      cloudJobStartState: 'unknown',
    })
  }
  const terminalRaw = await input.input.terminalReadPort.readCompleted({
    invocationId: input.invocationId,
    envelopeHash: input.envelope.envelopeHash,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    releaseRef: input.release.releaseRef,
  })
  if (!terminalRaw) return reconciliationRequired({
    invocationId: input.invocationId,
    blockerCode: 'source_visual_evidence_terminal_result_not_ready',
    cloudJobStartState: 'known_started',
  })
  const result = assertCanonicalSourceAnalysisL4VisualEvidenceResult(
    terminalRaw,
  )
  assertTerminalMatches(input, result)
  const persisted = await input.input.evidenceRepository.persistCreateOnly({
    scope: input.scope,
    result,
  })
  const reread = await input.input.evidenceRepository.readCompleted(
    input.scope,
  )
  if (!reread || reread.resultDigestSha256 !== result.resultDigestSha256) {
    throw conflict('source_visual_evidence_repository_reread_mismatch')
  }
  return readyResult({
    disposition: persisted.disposition,
    invocationId: input.invocationId,
    result: reread,
  })
}

function assertAdmissionMatches(input: Readonly<{
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
  scope: CanonicalSourceTranscriptOrchestraReadScope
  source: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']['sources'][number]
  preparedRequestContentRef: VisualIntelligenceEvidenceRef
}>): void {
  const authority = input.source.managedApiAuthority
  if (
    !authority
    || !sameRef(input.admission.triggerRef,
      ref(input.trigger.requestId, input.trigger.triggerHash))
    || input.admission.scopeDigestSha256 !==
      sha256AuthorityValue(input.scope)
    || !sameRef(input.admission.preparedRequestContentRef,
      input.preparedRequestContentRef)
    || !sameRef(input.admission.finalizedMediaAuthorityRef,
      authority.finalizedMediaAuthorityRef)
    || !sameRef(input.admission.finalizedStorageObjectAuthorityRef,
      authority.finalizedStorageObjectAuthorityRef)
    || !sameRef(input.admission.sourceProbeAuthorityRef,
      authority.sourceProbeAuthorityRef)
    || !sameRef(input.admission.sourceAnalysisConsentRef,
      authority.sourceAnalysisConsentRef)
    || !sameRef(input.admission.platformAnalysisCostCapRef,
      authority.platformAnalysisCostCapRef)
  ) throw conflict('source_visual_evidence_admission_mismatch')
}

function assertReleaseSemantics(
  release: z.infer<typeof releaseWithoutHashSchema>,
): void {
  const expectedOperations = [
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe,
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect,
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv,
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr,
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
  ]
  if (
    release.cloudRunJobResource !==
      `projects/${PROJECT_ID}/locations/${release.runtimeRegion}/jobs/`
        + CLOUD_RUN_JOB_NAME
    || release.immutableImageRef.contentHash !== release.immutableImageDigest
    || stableAuthorityStringify(release.toolReleases.map((item) => item.role))
      !== stableAuthorityStringify(roles)
    || release.toolReleases.some((item, index) =>
      item.operationId !== expectedOperations[index])
    || new Set(release.toolReleases.map((item) =>
      refKey(item.runtimeReleaseRef))).size !== roles.length
  ) throw conflict('source_visual_evidence_release_semantics_invalid')
}

function assertTerminalMatches(
  input: Readonly<{
    invocationId: string
    admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
    scope: CanonicalSourceTranscriptOrchestraReadScope
    release: CanonicalSourceAnalysisL4VisualEvidenceRelease
    source: ReturnType<
      typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
    >['request']['sources'][number]
    launch: VisualEvidenceLaunch
  }>,
  result: CanonicalSourceAnalysisL4VisualEvidenceResult,
): void {
  const sourceAuthority = input.source.managedApiAuthority
  if (
    !sourceAuthority
    || stableAuthorityStringify(result.scope) !==
      stableAuthorityStringify(input.scope)
    || result.operationId !== OPERATION_ID
    || result.routeProfileId !== ROUTE_PROFILE_ID
    || result.cloudRunJobName !== CLOUD_RUN_JOB_NAME
    || !input.launch.cloudRunOperationRef
    || !sameRef(result.cloudRunExecutionRef,
      input.launch.cloudRunOperationRef)
    || result.invocationId !== input.invocationId
    || !sameRef(result.admissionRef,
      ref(input.admission.admissionId, input.admission.admissionHash))
    || !sameRef(result.runtimeReleaseRef, input.release.releaseRef)
    || !sameRef(result.platformEstimateRef,
      input.admission.platformEstimateRef)
    || !sameRef(result.accountEffectivePricingAuthorityRef,
      input.admission.currentAccountRateAuthorityRef)
    || result.maximumPlatformInternalCostUsdNanos !==
      input.admission.maximumPlatformInternalCostUsdNanos
    || !result.accountEffectivePricingRereadVerified
    || result.publicListPriceUsedAsSettlementAuthority
    || !result.platformInternalCostWithinAdmittedCap
    || !result.userTriggeredScaleFromZero
    || result.minimumIdleInstances !== 0
    || !result.terminalCloudRunExecutionObserved
    || !result.terminalWorkerStopped
    || !result.scaleBackToZeroVerified
    || result.sourceObject.storageProvider !== input.source.storageProvider
    || result.sourceObject.storageBucket !== input.source.storageBucket
    || result.sourceObject.storagePath !== input.source.storagePath
    || result.sourceObject.storageGeneration !==
      sourceAuthority.storageGeneration
    || result.sourceObject.storageEtag !==
      sourceAuthority.storageEtag
    || result.sourceObject.contentType !==
      sourceAuthority.contentType
    || result.sourceObject.width !==
      sourceAuthority.width
    || result.sourceObject.height !==
      sourceAuthority.height
    || result.sourceObject.checksumSha256 !== input.source.checksumSha256
    || result.sourceObject.byteLength !== input.source.byteLength
    || !sameRef(result.sourceObject.finalizedMediaAuthorityRef,
      sourceAuthority.finalizedMediaAuthorityRef)
    || !sameRef(result.sourceObject.finalizedStorageObjectAuthorityRef,
      sourceAuthority.finalizedStorageObjectAuthorityRef)
    || result.maximumAttempts !== 1
    || result.uncertainOutcomeRetryAllowed
    || result.runtimeNetworkDownloadPerformed
    || result.customerCreditMutated
    || result.systemFailureChargedToCustomer
    || result.unapprovedOverageChargedToCustomer
    || result.toolEvidence.some((item, index) =>
      !sameRef(
        item.runtimeReleaseRef,
        input.release.toolReleases[index]!.runtimeReleaseRef,
      ))
  ) throw conflict('source_visual_evidence_terminal_mismatch')
}

function buildEnvelope(input: Readonly<{
  invocationId: string
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  release: CanonicalSourceAnalysisL4VisualEvidenceRelease
  scope: CanonicalSourceTranscriptOrchestraReadScope
}>): VisualEvidenceEnvelope {
  const payload = envelopeWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-analysis-l4-visual-evidence-envelope-v1',
    source: 'canonical_source_analysis_l4_visual_evidence_attempt_owner',
    invocationId: input.invocationId,
    triggerRef: ref(input.trigger.requestId, input.trigger.triggerHash),
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    releaseRef: input.release.releaseRef,
    scope: input.scope,
    idempotencyKey: input.trigger.idempotencyKey,
    operationId: OPERATION_ID,
    routeProfileId: ROUTE_PROFILE_ID,
    cloudRunReceivesOnlyInvocationId: true,
    privateWorkerRereadsEnvelopeByExactDigest: true,
    callerPathUrlBytesCommandOrEnvironmentIncluded: false,
    runtimeNetworkDownloadAllowed: false,
    maximumAttempts: 1,
    uncertainOutcomeRetryAllowed: false,
    customerCreditMutationAllowed: false,
    publicDeliveryAllowed: false,
    productionAuthorityGranted: false,
  })
  return Object.freeze(envelopeSchema.parse({
    ...payload,
    envelopeHash: sha256AuthorityValue(payload),
  }))
}

function buildConsumption(input: Readonly<{
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  envelope: VisualEvidenceEnvelope
  consumedAt: string
}>): VisualEvidenceConsumption {
  const payload = consumptionWithoutHashSchema.parse({
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-consumption-v1',
    source: 'canonical_source_analysis_l4_visual_evidence_attempt_owner',
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
    consumedAt: input.consumedAt,
  })
  return Object.freeze(consumptionSchema.parse({
    ...payload,
    consumptionHash: sha256AuthorityValue(payload),
  }))
}

function buildLaunch(input: Readonly<{
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  envelope: VisualEvidenceEnvelope
  release: CanonicalSourceAnalysisL4VisualEvidenceRelease
  executionResult: CanonicalSourceAnalysisL4VisualEvidenceExecutionResult
}>): VisualEvidenceLaunch {
  const payload = launchWithoutHashSchema.parse({
    schemaVersion: 'canonical-source-analysis-l4-visual-evidence-launch-v1',
    source: 'canonical_source_analysis_l4_visual_evidence_attempt_owner',
    invocationId: input.envelope.invocationId,
    admissionRef: ref(input.admission.admissionId,
      input.admission.admissionHash),
    envelopeRef: ref(input.envelope.invocationId,
      input.envelope.envelopeHash),
    releaseRef: input.release.releaseRef,
    cloudJobCreateRequestRef: input.executionResult.cloudJobCreateRequestRef,
    cloudRunOperationRef: input.executionResult.cloudRunOperationRef,
    disposition: input.executionResult.disposition,
    providerInferenceOrSubstantiveWorkOutcome:
      input.executionResult.providerInferenceOrSubstantiveWorkOutcome,
    createOnlyConsumptionPersistedBeforeCloudRunCall: true,
    duplicateDispatchAllowed: false,
    automaticRetryAllowed: false,
    customerCreditsMutated: false,
    observedAt: input.executionResult.observedAt,
  })
  return Object.freeze(launchSchema.parse({
    ...payload,
    launchHash: sha256AuthorityValue(payload),
  }))
}

function assertEnvelope(value: unknown): VisualEvidenceEnvelope {
  assertPlainSerializedData(value, 'source_visual_evidence_envelope')
  const parsed = envelopeSchema.parse(value)
  const { envelopeHash, ...payload } = parsed
  if (envelopeHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_envelope_hash_invalid')
  }
  return Object.freeze(parsed)
}

function assertConsumption(value: unknown): VisualEvidenceConsumption {
  assertPlainSerializedData(value, 'source_visual_evidence_consumption')
  const parsed = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_consumption_hash_invalid')
  }
  return Object.freeze(parsed)
}

function assertLaunch(value: unknown): VisualEvidenceLaunch {
  assertPlainSerializedData(value, 'source_visual_evidence_launch')
  const parsed = launchSchema.parse(value)
  const { launchHash, ...payload } = parsed
  if (launchHash !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_launch_hash_invalid')
  }
  return Object.freeze(parsed)
}

function assertLaunchMatches(input: Readonly<{
  existingLaunch: VisualEvidenceLaunch
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  envelope: VisualEvidenceEnvelope
  release: CanonicalSourceAnalysisL4VisualEvidenceRelease
}>): void {
  if (
    input.existingLaunch.invocationId !== input.envelope.invocationId
    || !sameRef(input.existingLaunch.admissionRef,
      ref(input.admission.admissionId, input.admission.admissionHash))
    || !sameRef(input.existingLaunch.envelopeRef,
      ref(input.envelope.invocationId, input.envelope.envelopeHash))
    || !sameRef(input.existingLaunch.releaseRef, input.release.releaseRef)
  ) throw conflict('source_visual_evidence_launch_mismatch')
}

function assertConsumptionMatches(input: Readonly<{
  existingConsumption: VisualEvidenceConsumption
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger
  admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
  envelope: VisualEvidenceEnvelope
}>): void {
  if (
    input.existingConsumption.invocationId !== input.envelope.invocationId
    || input.existingConsumption.idempotencyKey !== input.trigger.idempotencyKey
    || !sameRef(input.existingConsumption.admissionRef,
      ref(input.admission.admissionId, input.admission.admissionHash))
    || !sameRef(input.existingConsumption.envelopeRef,
      ref(input.envelope.invocationId, input.envelope.envelopeHash))
  ) throw conflict('source_visual_evidence_consumption_mismatch')
}

function resultScope(input: Readonly<{
  request: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']
  analysisRunId: string
  source: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']['sources'][number]
}>): CanonicalSourceTranscriptOrchestraReadScope {
  const authority = input.source.managedApiAuthority
  if (!authority) throw conflict('source_visual_evidence_authority_missing')
  return Object.freeze({
    ownerUserId: authority.ownerUserId,
    workspaceId: input.request.workspaceId,
    projectId: input.request.projectId,
    editSessionId: input.request.editSessionId,
    analysisRunId: input.analysisRunId,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    checksumSha256: input.source.checksumSha256,
    byteLength: input.source.byteLength,
    durationFrames: input.source.durationFrames,
    sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: authority.fpsNumerator,
      fpsDenominator: authority.fpsDenominator,
      frameCount: authority.frameCount,
      timeBaseNumerator: authority.sourceTimeBaseNumerator!,
      timeBaseDenominator: authority.sourceTimeBaseDenominator!,
    }),
    finalizedMediaAuthorityRef: { ...authority.finalizedMediaAuthorityRef },
    sourceProbeAuthorityRef: { ...authority.sourceProbeAuthorityRef },
  })
}

function readyResult(input: Readonly<{
  disposition: 'created' | 'identical_replay'
  invocationId: string
  result: CanonicalSourceAnalysisL4VisualEvidenceResult
}>): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceAttemptResult,
  { status: 'ready' }
> {
  return Object.freeze({
    status: 'ready' as const,
    disposition: input.disposition,
    invocationId: input.invocationId,
    resultDigestSha256: input.result.resultDigestSha256,
    attemptCostEvidenceRef: { ...input.result.attemptCostEvidenceRef },
    exactTerminalEvidencePersistedAndReread: true as const,
    scaleBackToZeroVerified: true as const,
    platformFundedPreapprovalAnalysis: true as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function notReady(blockerCode: Extract<
  CanonicalSourceAnalysisL4VisualEvidenceAttemptResult,
  { status: 'not_ready' }
>['blockerCode']): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceAttemptResult,
  { status: 'not_ready' }
> {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    cloudJobStarted: false as const,
    customerCreditMutated: false as const,
  })
}

function reconciliationRequired(input: Readonly<{
  invocationId: string
  blockerCode: Extract<
    CanonicalSourceAnalysisL4VisualEvidenceAttemptResult,
    { status: 'reconciliation_required' }
  >['blockerCode']
  cloudJobStartState: 'known_started' | 'unknown'
}>): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceAttemptResult,
  { status: 'reconciliation_required' }
> {
  return Object.freeze({
    status: 'reconciliation_required' as const,
    ...input,
    automaticRetryAllowed: false as const,
    customerCreditMutated: false as const,
  })
}

async function createAndReread<T>(input: Readonly<{
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  record: T
  parse: (value: unknown) => T
}>): Promise<'created' | 'already_exists'> {
  const body = Buffer.from(stableAuthorityStringify(input.record), 'utf8')
  if (body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('source_visual_evidence_record_too_large')
  }
  const disposition = await input.port.createOnly({
    objectPath: input.path,
    body,
    contentSha256: rawBufferSha256(body),
  })
  const reread = await input.port.readExact(input.path)
  if (!reread || !Buffer.isBuffer(reread)) {
    throw conflict('source_visual_evidence_record_reread_missing')
  }
  const parsed = input.parse(JSON.parse(reread.toString('utf8')))
  if (stableAuthorityStringify(parsed) !==
    stableAuthorityStringify(input.record)) {
    throw conflict('source_visual_evidence_record_reread_mismatch')
  }
  return disposition
}

async function readRecord<T>(input: Readonly<{
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
}>): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('source_visual_evidence_record_bytes_invalid')
  }
  return input.parse(JSON.parse(body.toString('utf8')))
}

function validateDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner
>[0]): void {
  if (
    input.requestAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
    || typeof input.requestAuthorityReadPort.readExactPreparedRequest !==
      'function'
    || input.admissionReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1'
    || typeof input.admissionReadPort.rereadAdmittedExecution !== 'function'
    || input.releaseReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-visual-evidence-release-read-port-v1'
    || typeof input.releaseReadPort.rereadPrivateRelease !== 'function'
    || input.executionPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_EXECUTION_PORT_VERSION
    || typeof input.executionPort.runOnce !== 'function'
    || input.terminalReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1'
    || typeof input.terminalReadPort.readCompleted !== 'function'
    || typeof input.evidenceRepository?.persistCreateOnly !== 'function'
    || typeof input.evidenceRepository.readCompleted !== 'function'
    || typeof input.lifecycleObjectPort?.createOnly !== 'function'
    || typeof input.lifecycleObjectPort.readExact !== 'function'
  ) throw new TypeError('L4 visual evidence owner dependencies are invalid.')
}

function invocationIdFor(
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
): string {
  return `source-visual-evidence-${sha256AuthorityValue({
    triggerHash: trigger.triggerHash,
    idempotencyKey: trigger.idempotencyKey,
  }).slice(0, 40)}`
}

function recordPath(prefix: string, kind: string, id: string): string {
  return `${prefix}/${kind}/${id}.json`
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || !/^[A-Za-z0-9._/-]+$/u.test(prefix)) {
    throw new TypeError('L4 visual evidence prefix is invalid.')
  }
  return prefix
}

function ref(id: string, rawHash: string): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id,
    version: 1,
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
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function rawBufferSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical L4 source visual evidence conflicts with its authority.',
    409,
    { requiredGate },
  )
}
