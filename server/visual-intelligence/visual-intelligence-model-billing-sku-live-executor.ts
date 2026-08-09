import { createHash } from 'node:crypto'

import {
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type GenerateContentConfig,
} from '@google/genai'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  createVisualIntelligenceModelBillingContextEvidence,
  parseVisualIntelligenceModelBillingContextEvidence,
  visualIntelligenceModelBillingContextEvidenceRef,
  type VisualIntelligenceModelBillingContextEvidence,
  type VisualIntelligenceModelBillingContextEvidenceReadPort,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  visualIntelligenceProviderAuditCorrelationLabels,
} from './visual-intelligence-provider-audit-window-read-port'
import {
  visualIntelligenceProviderTrafficGuardReleaseReceiptRef,
  type VisualIntelligenceProviderTrafficGuardPort,
} from './visual-intelligence-provider-traffic-guard'
import type {
  VisualIntelligenceCanonicalProviderRouteRegistry,
} from './visual-intelligence-provider-traffic-isolation-authority-finalizer'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION =
  'visual-intelligence-model-billing-sku-live-executor-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION =
  'visual-intelligence-model-billing-sku-live-admission-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_RESULT_VERSION =
  'visual-intelligence-model-billing-sku-live-result-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ATTEMPT_STORE_VERSION =
  'visual-intelligence-model-billing-sku-live-attempt-store-v1' as const

const EXPECTED_PROVIDER_REQUEST_COUNT = 4
const MAXIMUM_TOTAL_PROMPT_TOKENS = 2_097_152
const MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS = 64
const MAXIMUM_INTERNAL_SPEND_USD_MICROS = 50_000_000
const STANDARD_CORPUS_BYTES = 32_000
const LONG_CORPUS_BYTES = 900_000
const MAXIMUM_CORPUS_BYTES = 1_000_000
const MAXIMUM_RESULT_BYTES = 512 * 1024
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1_000
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const admissionWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION,
  ),
  admissionId: safeId,
  admissionVersion: positiveInteger,
  qualificationId: safeId,
  qualificationVersion: positiveInteger,
  evidenceClass: z.literal(
    'explicit_single_use_internal_paid_provider_qualification_admission',
  ),
  projectId: z.literal('reeditpro'),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  internalSpendApprovalRef: evidenceRefSchema,
  approvedSourceReleaseRef: evidenceRefSchema,
  providerRouteRegistryRef: evidenceRefSchema,
  approvedAtIso: timestamp,
  expiresAtIso: timestamp,
  maximumProviderRequestCount: z.literal(EXPECTED_PROVIDER_REQUEST_COUNT),
  maximumTotalPromptTokens: z.literal(MAXIMUM_TOTAL_PROMPT_TOKENS),
  maximumTotalOutputAndThinkingTokens: z.literal(
    MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
  ),
  maximumInternalProviderSpendUsdMicros: positiveInteger
    .max(MAXIMUM_INTERNAL_SPEND_USD_MICROS),
  exactStandardAndLongImplicitCachePairsApproved: z.literal(true),
  operatorApprovedPaidProviderExecution: z.literal(true),
  singleUseAdmission: z.literal(true),
  automaticProviderRetryAllowed: z.literal(false),
  providerToolsAllowed: z.literal(false),
  groundingAllowed: z.literal(false),
  urlContextAllowed: z.literal(false),
  codeExecutionAllowed: z.literal(false),
  rawProviderPayloadPersistenceAllowed: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  captionEvidenceAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const approved = Date.parse(value.approvedAtIso)
  const expires = Date.parse(value.expiresAtIso)
  const refs = [
    value.internalSpendApprovalRef,
    value.approvedSourceReleaseRef,
    value.providerRouteRegistryRef,
  ]
  if (
    expires <= approved
    || expires - approved > 24 * 60 * 60 * 1_000
    || new Set(refs.map(refKey)).size !== refs.length
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence live qualification admission is invalid.',
  })
})

const admissionSchema = admissionWithoutDigestSchema.extend({
  admissionDigestSha256: prefixedSha256,
}).strict()

const sanitizedCallSchema = z.object({
  callOrdinal: z.number().int().min(1).max(4),
  contextClass: z.enum(['standard_le_200k', 'long_gt_200k']),
  callRole: z.enum(['implicit_cache_warmup', 'implicit_cache_measured']),
  providerRequestRef: evidenceRefSchema,
  providerUsageRef: evidenceRefSchema,
  providerResponseRef: evidenceRefSchema,
  providerResponseId: safeId,
  promptTokenCount: positiveInteger.max(1_048_576),
  cachedTokenCount: nonnegativeInteger.max(1_048_576),
  candidateTokenCount: positiveInteger.max(64),
  thinkingTokenCount: nonnegativeInteger.max(64),
  totalTokenCount: positiveInteger.max(1_048_640),
  exactModelIdReturned: z.literal(true),
  finishReasonStop: z.literal(true),
  candidateCountOne: z.literal(true),
  responseTextAcceptedAndNotPersisted: z.literal(true),
  automaticProviderRetryUsed: z.literal(false),
  providerToolsUsed: z.literal(false),
  rawProviderPayloadPersisted: z.literal(false),
}).strict()

const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_RESULT_VERSION,
  ),
  executorVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
  ),
  resultId: safeId,
  resultVersion: positiveInteger,
  disposition: z.literal(
    'executed_pending_cloud_audit_and_billing_export_reconciliation',
  ),
  qualificationId: safeId,
  qualificationVersion: positiveInteger,
  admissionRef: evidenceRefSchema,
  attemptRef: evidenceRefSchema,
  providerRouteRegistryRef: evidenceRefSchema,
  providerGuardLeaseRef: evidenceRefSchema,
  providerGuardReleaseReceiptRef: evidenceRefSchema,
  standardContextEvidenceRef: evidenceRefSchema,
  longContextEvidenceRef: evidenceRefSchema,
  exactOrderedProviderRequestRefs: z.array(evidenceRefSchema).length(4),
  exactOrderedProviderUsageRefs: z.array(evidenceRefSchema).length(4),
  exactOrderedProviderResponseRefs: z.array(evidenceRefSchema).length(4),
  sanitizedCalls: z.array(sanitizedCallSchema).length(4),
  providerRequestCount: z.literal(EXPECTED_PROVIDER_REQUEST_COUNT),
  implicitCacheRequestPairCount: z.literal(2),
  totalPromptTokenCount: positiveInteger.max(MAXIMUM_TOTAL_PROMPT_TOKENS),
  totalOutputAndThinkingTokenCount: positiveInteger.max(
    MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
  ),
  standardContextThresholdVerified: z.literal(true),
  longContextThresholdVerified: z.literal(true),
  measuredImplicitCacheTokensObservedForBothContexts: z.literal(true),
  exactReturnedModelIdVerifiedForEveryRequest: z.literal(true),
  providerGuardHeldAcrossEveryProviderCall: z.literal(true),
  providerAuditCorrelationLabelsEmittedForEveryRequest: z.literal(true),
  contextEvidenceCreateOnlyPersistedAndReread: z.literal(true),
  resultCreateOnlyPersistedAndReread: z.literal(true),
  providerCallMade: z.literal(true),
  actualProviderSpendReconciliationPending: z.literal(true),
  cloudAuditWindowReconciliationPending: z.literal(true),
  detailedBillingExportReconciliationPending: z.literal(true),
  modelBillingSkuQualificationGranted: z.literal(false),
  providerDispatchAuthorityGrantedBeyondThisAdmission: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  captionEvidenceAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const requestRefs = value.sanitizedCalls.map((call) =>
    call.providerRequestRef)
  const usageRefs = value.sanitizedCalls.map((call) => call.providerUsageRef)
  const responseRefs = value.sanitizedCalls.map((call) =>
    call.providerResponseRef)
  if (
    visualIntelligenceCanonicalJson(value.sanitizedCalls.map((call) =>
      call.callOrdinal)) !== visualIntelligenceCanonicalJson([1, 2, 3, 4])
    || visualIntelligenceCanonicalJson(value.exactOrderedProviderRequestRefs)
      !== visualIntelligenceCanonicalJson(requestRefs)
    || visualIntelligenceCanonicalJson(value.exactOrderedProviderUsageRefs)
      !== visualIntelligenceCanonicalJson(usageRefs)
    || visualIntelligenceCanonicalJson(value.exactOrderedProviderResponseRefs)
      !== visualIntelligenceCanonicalJson(responseRefs)
    || new Set([
      ...requestRefs,
      ...usageRefs,
      ...responseRefs,
    ].map(refKey)).size !== 12
    || value.totalPromptTokenCount !== value.sanitizedCalls.reduce(
      (sum, call) => sum + call.promptTokenCount,
      0,
    )
    || value.totalOutputAndThinkingTokenCount !== value.sanitizedCalls.reduce(
      (sum, call) => sum + call.candidateTokenCount
        + call.thinkingTokenCount,
      0,
    )
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence live qualification result is not exact.',
  })
})

const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingSkuLiveAdmission =
  z.infer<typeof admissionSchema>
export type VisualIntelligenceModelBillingSkuLiveResult =
  z.infer<typeof resultSchema>

export interface VisualIntelligenceModelBillingSkuLiveAdmissionReadPort {
  readExact(
    admissionRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceModelBillingSkuLiveAdmission | null>
}

export interface VisualIntelligenceModelBillingContextEvidenceRepository
extends VisualIntelligenceModelBillingContextEvidenceReadPort {
  persistCreateOnly(
    evidence: VisualIntelligenceModelBillingContextEvidence,
  ): Promise<{
    readonly evidenceRef: VisualIntelligenceEvidenceRef
    readonly persistenceReceiptRef: VisualIntelligenceEvidenceRef
    readonly createOnlyPersisted: true
    readonly exactRereadVerified: true
  }>
}

export interface VisualIntelligenceModelBillingSkuLiveAttemptStore {
  beginCreateOnly(input: {
    readonly admissionRef: VisualIntelligenceEvidenceRef
    readonly qualificationId: string
  }): Promise<
    | { readonly status: 'started'; readonly attemptRef: VisualIntelligenceEvidenceRef }
    | { readonly status: 'already_exists' }
  >
  markTerminal(input: {
    readonly attemptRef: VisualIntelligenceEvidenceRef
    readonly disposition: 'completed_pending_reconciliation' | 'failed_no_retry'
    readonly resultRef: VisualIntelligenceEvidenceRef | null
    readonly sanitizedFailureCode: string | null
  }): Promise<void>
}

export interface VisualIntelligenceModelBillingSkuLiveResultRepository {
  persistCreateOnly(
    result: VisualIntelligenceModelBillingSkuLiveResult,
  ): Promise<{
    readonly resultRef: VisualIntelligenceEvidenceRef
    readonly persistenceReceiptRef: VisualIntelligenceEvidenceRef
    readonly createOnlyPersisted: true
    readonly exactRereadVerified: true
  }>
  readExact(
    resultRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceModelBillingSkuLiveResult | null>
}

export interface VisualIntelligenceModelBillingSkuQualificationGeneratePort {
  generate(input: {
    readonly model: typeof VISUAL_INTELLIGENCE_MODEL_ID
    readonly contents: Content[]
    readonly config: GenerateContentConfig
  }): Promise<{
    readonly responseId: string
    readonly modelVersion: string
    readonly text: string
    readonly finishReason: string
    readonly candidateCount: number
    readonly promptTokenCount: number
    readonly candidateTokenCount: number
    readonly thinkingTokenCount: number
    readonly cachedTokenCount: number
    readonly totalTokenCount: number
  }>
}

export function createVisualIntelligenceModelBillingSkuLiveAdmission(
  input: z.input<typeof admissionWithoutDigestSchema>,
): VisualIntelligenceModelBillingSkuLiveAdmission {
  const payload = admissionWithoutDigestSchema.parse(input)
  return Object.freeze(admissionSchema.parse({
    ...payload,
    admissionDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceModelBillingSkuLiveAdmission(
  value: unknown,
): VisualIntelligenceModelBillingSkuLiveAdmission {
  const admission = admissionSchema.parse(value)
  const payload = { ...admission }
  Reflect.deleteProperty(payload, 'admissionDigestSha256')
  if (admission.admissionDigestSha256
    !== visualIntelligenceDigest(payload)) throw new Error(
    'Visual Intelligence live qualification admission digest is invalid.',
  )
  return Object.freeze(admission)
}

export function visualIntelligenceModelBillingSkuLiveAdmissionRef(
  value: VisualIntelligenceModelBillingSkuLiveAdmission,
): VisualIntelligenceEvidenceRef {
  const admission = parseVisualIntelligenceModelBillingSkuLiveAdmission(value)
  return Object.freeze({
    id: admission.admissionId,
    version: admission.admissionVersion,
    contentHash: admission.admissionDigestSha256,
  })
}

export function parseVisualIntelligenceModelBillingSkuLiveResult(
  value: unknown,
): VisualIntelligenceModelBillingSkuLiveResult {
  const result = resultSchema.parse(value)
  const payload = { ...result }
  Reflect.deleteProperty(payload, 'resultDigestSha256')
  if (result.resultDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence live qualification result digest is invalid.',
    )
  }
  return Object.freeze(result)
}

export function visualIntelligenceModelBillingSkuLiveResultRef(
  value: VisualIntelligenceModelBillingSkuLiveResult,
): VisualIntelligenceEvidenceRef {
  const result = parseVisualIntelligenceModelBillingSkuLiveResult(value)
  return Object.freeze({
    id: result.resultId,
    version: result.resultVersion,
    contentHash: result.resultDigestSha256,
  })
}

export function createGoogleVertexModelBillingSkuQualificationGeneratePort(
  input: {
    readonly projectId: 'reeditpro'
    readonly location: 'global'
    readonly timeoutMs?: number
  },
): VisualIntelligenceModelBillingSkuQualificationGeneratePort {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS
  if (
    input.projectId !== 'reeditpro'
    || input.location !== 'global'
    || !Number.isInteger(timeoutMs)
    || timeoutMs < 1_000
    || timeoutMs > DEFAULT_TIMEOUT_MS
  ) throw new Error(
    'Visual Intelligence live qualification provider is not configured.',
  )
  const client = new GoogleGenAI({
    vertexai: true,
    project: input.projectId,
    location: input.location,
    httpOptions: {
      apiVersion: 'v1alpha',
      timeout: timeoutMs,
      retryOptions: { attempts: 1 },
    },
  })
  return Object.freeze({
    async generate(request: {
      readonly model: typeof VISUAL_INTELLIGENCE_MODEL_ID
      readonly contents: Content[]
      readonly config: GenerateContentConfig
    }) {
      const response = await client.models.generateContent(request)
      const candidate = response.candidates?.[0]
      const usage = response.usageMetadata
      return Object.freeze({
        responseId: response.responseId ?? '',
        modelVersion: response.modelVersion ?? '',
        text: response.text ?? '',
        finishReason: candidate?.finishReason ?? '',
        candidateCount: response.candidates?.length ?? 0,
        promptTokenCount: usage?.promptTokenCount ?? -1,
        candidateTokenCount: usage?.candidatesTokenCount ?? -1,
        thinkingTokenCount: usage?.thoughtsTokenCount ?? 0,
        cachedTokenCount: usage?.cachedContentTokenCount ?? 0,
        totalTokenCount: usage?.totalTokenCount ?? -1,
      })
    },
  })
}

export function createVisualIntelligenceModelBillingSkuLiveExecutor(
  dependencies: {
    readonly admissionReadPort:
      VisualIntelligenceModelBillingSkuLiveAdmissionReadPort
    readonly providerTrafficGuardPort: VisualIntelligenceProviderTrafficGuardPort
    readonly generatePort:
      VisualIntelligenceModelBillingSkuQualificationGeneratePort
    readonly contextEvidenceRepository:
      VisualIntelligenceModelBillingContextEvidenceRepository
    readonly resultRepository:
      VisualIntelligenceModelBillingSkuLiveResultRepository
    readonly attemptStore: VisualIntelligenceModelBillingSkuLiveAttemptStore
    readonly routeRegistryReadPort: {
      readExact(
        registryRef: VisualIntelligenceEvidenceRef,
      ): Promise<VisualIntelligenceCanonicalProviderRouteRegistry | null>
    }
    readonly now?: () => Date
  },
) {
  validateDependencies(dependencies)
  const now = dependencies.now ?? (() => new Date())
  return Object.freeze({
    async execute(untrusted: {
      readonly admissionRef: VisualIntelligenceEvidenceRef
    }): Promise<VisualIntelligenceModelBillingSkuLiveResult> {
      const admissionRef = evidenceRefSchema.parse(untrusted.admissionRef)
      const admissionRaw = await dependencies.admissionReadPort.readExact(
        admissionRef,
      )
      if (!admissionRaw) throw new Error(
        'Visual Intelligence live qualification admission is missing.',
      )
      const admission = parseVisualIntelligenceModelBillingSkuLiveAdmission(
        admissionRaw,
      )
      const observedAt = now()
      const registry = await dependencies.routeRegistryReadPort.readExact(
        admission.providerRouteRegistryRef,
      )
      validateAdmission({ admission, admissionRef, registry, observedAt })
      const guard = await dependencies.providerTrafficGuardPort.acquire({
        mode: 'model_billing_sku_qualification',
        ownerId: admission.qualificationId,
        requestedLeaseTtlMs: 60 * 60 * 1_000,
      })
      if (guard.status !== 'acquired') throw new Error(
        'Visual Intelligence live qualification provider guard is occupied.',
      )
      const attempt = await dependencies.attemptStore.beginCreateOnly({
        admissionRef,
        qualificationId: admission.qualificationId,
      })
      if (attempt.status !== 'started') {
        await dependencies.providerTrafficGuardPort.release(guard.lease)
        throw new Error(
          'Visual Intelligence live qualification admission was already used.',
        )
      }
      try {
        const standard = await executePair({
          admission,
          contextClass: 'standard_le_200k',
          corpusByteLength: STANDARD_CORPUS_BYTES,
          startingOrdinal: 1,
          generatePort: dependencies.generatePort,
          now,
        })
        const long = await executePair({
          admission,
          contextClass: 'long_gt_200k',
          corpusByteLength: LONG_CORPUS_BYTES,
          startingOrdinal: 3,
          generatePort: dependencies.generatePort,
          now,
        })
        const standardPersisted = await dependencies.contextEvidenceRepository
          .persistCreateOnly(standard.evidence)
        const longPersisted = await dependencies.contextEvidenceRepository
          .persistCreateOnly(long.evidence)
        await validateContextPersistence({
          repository: dependencies.contextEvidenceRepository,
          evidence: standard.evidence,
          persisted: standardPersisted,
        })
        await validateContextPersistence({
          repository: dependencies.contextEvidenceRepository,
          evidence: long.evidence,
          persisted: longPersisted,
        })
        const release = await dependencies.providerTrafficGuardPort.release(
          guard.lease,
        )
        const calls = [...standard.calls, ...long.calls]
        const totalPromptTokenCount = calls.reduce((sum, call) =>
          sum + call.promptTokenCount, 0)
        const totalOutputAndThinkingTokenCount = calls.reduce((sum, call) =>
          sum + call.candidateTokenCount + call.thinkingTokenCount, 0)
        if (
          totalPromptTokenCount > admission.maximumTotalPromptTokens
          || totalOutputAndThinkingTokenCount
            > admission.maximumTotalOutputAndThinkingTokens
        ) throw new Error(
          'Visual Intelligence live qualification exceeded its token admission.',
        )
        const payload = resultWithoutDigestSchema.parse({
          schemaVersion: VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_RESULT_VERSION,
          executorVersion: VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
          resultId: `${admission.qualificationId}.live-execution`,
          resultVersion: admission.qualificationVersion,
          disposition:
            'executed_pending_cloud_audit_and_billing_export_reconciliation',
          qualificationId: admission.qualificationId,
          qualificationVersion: admission.qualificationVersion,
          admissionRef,
          attemptRef: attempt.attemptRef,
          providerRouteRegistryRef: admission.providerRouteRegistryRef,
          providerGuardLeaseRef: guard.lease.leaseRef,
          providerGuardReleaseReceiptRef:
            visualIntelligenceProviderTrafficGuardReleaseReceiptRef(release),
          standardContextEvidenceRef:
            standardPersisted.evidenceRef,
          longContextEvidenceRef: longPersisted.evidenceRef,
          exactOrderedProviderRequestRefs: calls.map((call) =>
            call.providerRequestRef),
          exactOrderedProviderUsageRefs: calls.map((call) =>
            call.providerUsageRef),
          exactOrderedProviderResponseRefs: calls.map((call) =>
            call.providerResponseRef),
          sanitizedCalls: calls,
          providerRequestCount: 4,
          implicitCacheRequestPairCount: 2,
          totalPromptTokenCount,
          totalOutputAndThinkingTokenCount,
          standardContextThresholdVerified: true,
          longContextThresholdVerified: true,
          measuredImplicitCacheTokensObservedForBothContexts: true,
          exactReturnedModelIdVerifiedForEveryRequest: true,
          providerGuardHeldAcrossEveryProviderCall: true,
          providerAuditCorrelationLabelsEmittedForEveryRequest: true,
          contextEvidenceCreateOnlyPersistedAndReread: true,
          resultCreateOnlyPersistedAndReread: true,
          providerCallMade: true,
          actualProviderSpendReconciliationPending: true,
          cloudAuditWindowReconciliationPending: true,
          detailedBillingExportReconciliationPending: true,
          modelBillingSkuQualificationGranted: false,
          providerDispatchAuthorityGrantedBeyondThisAdmission: false,
          customerPricingOrServiceFeeAuthorityGranted: false,
          customerCreditOrWalletMutationAuthorityGranted: false,
          captionEvidenceAuthorityGranted: false,
          productionReleaseAuthorityGranted: false,
        })
        const result = Object.freeze(resultSchema.parse({
          ...payload,
          resultDigestSha256: visualIntelligenceDigest(payload),
        }))
        const resultPersisted = await dependencies.resultRepository
          .persistCreateOnly(result)
        const resultRef = visualIntelligenceModelBillingSkuLiveResultRef(result)
        if (
          resultPersisted.createOnlyPersisted !== true
          || resultPersisted.exactRereadVerified !== true
          || !sameRef(resultPersisted.resultRef, resultRef)
        ) throw new Error(
          'Visual Intelligence live qualification result persistence failed.',
        )
        const resultReread = await dependencies.resultRepository.readExact(
          resultPersisted.resultRef,
        )
        if (
          !resultReread
          || visualIntelligenceCanonicalJson(
            parseVisualIntelligenceModelBillingSkuLiveResult(resultReread),
          ) !== visualIntelligenceCanonicalJson(result)
        ) throw new Error(
          'Visual Intelligence live qualification result exact reread failed.',
        )
        await dependencies.attemptStore.markTerminal({
          attemptRef: attempt.attemptRef,
          disposition: 'completed_pending_reconciliation',
          resultRef,
          sanitizedFailureCode: null,
        })
        return result
      } catch (error) {
        await bestEffortRelease(dependencies.providerTrafficGuardPort,
          guard.lease)
        await dependencies.attemptStore.markTerminal({
          attemptRef: attempt.attemptRef,
          disposition: 'failed_no_retry',
          resultRef: null,
          sanitizedFailureCode: sanitizedFailureCode(error),
        })
        throw error
      }
    },
  })
}

async function executePair(input: {
  admission: VisualIntelligenceModelBillingSkuLiveAdmission
  contextClass: 'standard_le_200k' | 'long_gt_200k'
  corpusByteLength: number
  startingOrdinal: 1 | 3
  generatePort: VisualIntelligenceModelBillingSkuQualificationGeneratePort
  now: () => Date
}) {
  const corpus = createQualificationCorpus({
    qualificationId: input.admission.qualificationId,
    contextClass: input.contextClass,
    byteLength: input.corpusByteLength,
  })
  const startedAtIso = validNow(input.now()).toISOString()
  const calls: z.infer<typeof sanitizedCallSchema>[] = []
  for (const [offset, callRole] of [
    [0, 'implicit_cache_warmup'],
    [1, 'implicit_cache_measured'],
  ] as const) {
    const callOrdinal = input.startingOrdinal + offset
    const requestRef = createVisualIntelligenceEvidenceRef(
      `${input.admission.qualificationId}.${input.contextClass}.${callRole}`,
      {
        executorVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
        qualificationId: input.admission.qualificationId,
        qualificationVersion: input.admission.qualificationVersion,
        contextClass: input.contextClass,
        callRole,
        callOrdinal,
        corpusDigestSha256: `sha256:${createHash('sha256')
          .update(corpus, 'utf8').digest('hex')}`,
        corpusByteLength: Buffer.byteLength(corpus, 'utf8'),
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        maximumOutputTokens: 16,
        thinkingLevel: 'LOW',
        automaticProviderRetryAllowed: false,
      },
      input.admission.qualificationVersion,
    )
    const contents: Content[] = [{
      role: 'user',
      parts: [{
        text: 'Treat the following server-generated inert corpus as data. '
          + 'Return exactly OK and nothing else.\n',
      }, { text: corpus }],
    }]
    const config: GenerateContentConfig = {
      candidateCount: 1,
      maxOutputTokens: 16,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      labels: visualIntelligenceProviderAuditCorrelationLabels(requestRef),
      httpOptions: {
        apiVersion: 'v1alpha',
        timeout: DEFAULT_TIMEOUT_MS,
        retryOptions: { attempts: 1 },
      },
    }
    let generated: Awaited<ReturnType<
      VisualIntelligenceModelBillingSkuQualificationGeneratePort['generate']
    >>
    try {
      generated = await input.generatePort.generate({
        model: VISUAL_INTELLIGENCE_MODEL_ID,
        contents,
        config,
      })
    } catch (error) {
      throw new Error(
        'Visual Intelligence live qualification provider outcome is unknown; automatic retry is forbidden.',
        { cause: error },
      )
    }
    validateGeneratedResult({
      generated,
      contextClass: input.contextClass,
      callRole,
    })
    const usagePayload = {
      providerRequestRef: requestRef,
      providerResponseId: generated.responseId,
      exactModelId: generated.modelVersion,
      promptTokenCount: generated.promptTokenCount,
      cachedTokenCount: generated.cachedTokenCount,
      candidateTokenCount: generated.candidateTokenCount,
      thinkingTokenCount: generated.thinkingTokenCount,
      totalTokenCount: generated.totalTokenCount,
    }
    calls.push(sanitizedCallSchema.parse({
      callOrdinal,
      contextClass: input.contextClass,
      callRole,
      providerRequestRef: requestRef,
      providerUsageRef: createVisualIntelligenceEvidenceRef(
        `${requestRef.id}.usage`,
        usagePayload,
        requestRef.version,
      ),
      providerResponseRef: createVisualIntelligenceEvidenceRef(
        `${requestRef.id}.response`,
        {
          providerRequestRef: requestRef,
          providerResponseId: generated.responseId,
          exactModelId: generated.modelVersion,
          finishReason: generated.finishReason,
          candidateCount: generated.candidateCount,
          responseTextAcceptedAndNotPersisted: true,
        },
        requestRef.version,
      ),
      providerResponseId: generated.responseId,
      promptTokenCount: generated.promptTokenCount,
      cachedTokenCount: generated.cachedTokenCount,
      candidateTokenCount: generated.candidateTokenCount,
      thinkingTokenCount: generated.thinkingTokenCount,
      totalTokenCount: generated.totalTokenCount,
      exactModelIdReturned: true,
      finishReasonStop: true,
      candidateCountOne: true,
      responseTextAcceptedAndNotPersisted: true,
      automaticProviderRetryUsed: false,
      providerToolsUsed: false,
      rawProviderPayloadPersisted: false,
    }))
  }
  const finishedAtIso = validNow(input.now()).toISOString()
  const [warmup, measured] = calls
  if (!warmup || !measured) throw new Error(
    'Visual Intelligence live qualification request pair is incomplete.',
  )
  const evidence = createVisualIntelligenceModelBillingContextEvidence({
    schemaVersion: 'visual-intelligence-model-billing-context-evidence-v1',
    evidenceId:
      `${input.admission.qualificationId}.${input.contextClass}.evidence`,
    evidenceVersion: input.admission.qualificationVersion,
    evidenceClass:
      'live_guarded_implicit_cache_warmup_and_measured_request_pair',
    contextClass: input.contextClass,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
    providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    vertexLocation: 'global',
    throughputClass: 'standard',
    requestSetRef: createVisualIntelligenceEvidenceRef(
      `${input.admission.qualificationId}.${input.contextClass}.request-set`,
      calls.map((call) => call.providerRequestRef),
      input.admission.qualificationVersion,
    ),
    providerUsageSetRef: createVisualIntelligenceEvidenceRef(
      `${input.admission.qualificationId}.${input.contextClass}.usage-set`,
      calls.map((call) => call.providerUsageRef),
      input.admission.qualificationVersion,
    ),
    warmupProviderRequestRef: warmup.providerRequestRef,
    measuredProviderRequestRef: measured.providerRequestRef,
    warmupProviderUsageRef: warmup.providerUsageRef,
    measuredProviderUsageRef: measured.providerUsageRef,
    warmupProviderResponseRef: warmup.providerResponseRef,
    measuredProviderResponseRef: measured.providerResponseRef,
    qualificationWindowStartedAtIso: startedAtIso,
    qualificationWindowFinishedAtIso: finishedAtIso,
    warmupPromptTokenCount: warmup.promptTokenCount,
    warmupCachedTokenCount: 0,
    warmupCandidateTokenCount: warmup.candidateTokenCount,
    warmupThinkingTokenCount: warmup.thinkingTokenCount,
    measuredPromptTokenCount: measured.promptTokenCount,
    measuredCachedTokenCount: measured.cachedTokenCount,
    measuredUncachedPromptTokenCount:
      measured.promptTokenCount - measured.cachedTokenCount,
    measuredCandidateTokenCount: measured.candidateTokenCount,
    measuredThinkingTokenCount: measured.thinkingTokenCount,
    implicitCachingUsed: true,
    explicitCacheCreated: false,
    contextCacheStorageBillingExpected: false,
    liveProviderRequestCount: 2,
    exactReturnedModelIdVerifiedForEveryRequest: true,
    exactProviderUsageMetadataReread: true,
    requestBodiesServerOwned: true,
    rawProviderPayloadPersisted: false,
    providerToolsUsed: false,
    groundingUsed: false,
    urlContextUsed: false,
    codeExecutionUsed: false,
    automaticRetryAllowed: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
  return { calls, evidence }
}

function validateGeneratedResult(input: {
  generated: Awaited<ReturnType<
    VisualIntelligenceModelBillingSkuQualificationGeneratePort['generate']
  >>
  contextClass: 'standard_le_200k' | 'long_gt_200k'
  callRole: 'implicit_cache_warmup' | 'implicit_cache_measured'
}): void {
  const generated = input.generated
  const promptClassExact = input.contextClass === 'standard_le_200k'
    ? generated.promptTokenCount <= 200_000
    : generated.promptTokenCount > 200_000
  const cacheExact = input.callRole === 'implicit_cache_warmup'
    ? generated.cachedTokenCount === 0
    : generated.cachedTokenCount > 0
      && generated.cachedTokenCount < generated.promptTokenCount
  if (
    !safeId.safeParse(generated.responseId).success
    || generated.modelVersion !== VISUAL_INTELLIGENCE_MODEL_ID
    || generated.text.trim() !== 'OK'
    || generated.finishReason !== FinishReason.STOP
    || generated.candidateCount !== 1
    || !Number.isSafeInteger(generated.promptTokenCount)
    || generated.promptTokenCount < 1
    || generated.promptTokenCount > 1_048_576
    || !Number.isSafeInteger(generated.candidateTokenCount)
    || generated.candidateTokenCount < 1
    || generated.candidateTokenCount > 16
    || !Number.isSafeInteger(generated.thinkingTokenCount)
    || generated.thinkingTokenCount < 0
    || generated.thinkingTokenCount > 16
    || !Number.isSafeInteger(generated.cachedTokenCount)
    || generated.cachedTokenCount < 0
    || !Number.isSafeInteger(generated.totalTokenCount)
    || generated.totalTokenCount < generated.promptTokenCount
      + generated.candidateTokenCount + generated.thinkingTokenCount
    || !promptClassExact
    || !cacheExact
  ) throw new Error(
    'Visual Intelligence live qualification provider evidence was rejected.',
  )
}

function validateAdmission(input: {
  admission: VisualIntelligenceModelBillingSkuLiveAdmission
  admissionRef: VisualIntelligenceEvidenceRef
  registry: VisualIntelligenceCanonicalProviderRouteRegistry | null
  observedAt: Date
}): void {
  const { admission, registry } = input
  const qualificationRoute = registry?.routes.find((route) =>
    route.routeClass === 'model_billing_sku_qualification')
  if (
    !Number.isFinite(input.observedAt.getTime())
    || !sameRef(
      visualIntelligenceModelBillingSkuLiveAdmissionRef(admission),
      input.admissionRef,
    )
    || input.observedAt.getTime() < Date.parse(admission.approvedAtIso)
    || input.observedAt.getTime() >= Date.parse(admission.expiresAtIso)
    || !registry
    || registry.registryId !== admission.providerRouteRegistryRef.id
    || registry.registryVersion !== admission.providerRouteRegistryRef.version
    || registry.registryDigestSha256
      !== admission.providerRouteRegistryRef.contentHash
    || !qualificationRoute
    || qualificationRoute.ownerVersion
      !== VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION
    || qualificationRoute.providerTrafficGuardRequiredBeforeEveryProviderCall
      !== true
    || qualificationRoute.directProviderCallOutsideGuardAllowed !== false
  ) throw new Error(
    'Visual Intelligence live qualification admission is not current.',
  )
}

async function validateContextPersistence(input: {
  repository: VisualIntelligenceModelBillingContextEvidenceRepository
  evidence: VisualIntelligenceModelBillingContextEvidence
  persisted: Awaited<ReturnType<
    VisualIntelligenceModelBillingContextEvidenceRepository[
      'persistCreateOnly'
    ]>>
}): Promise<void> {
  if (
    input.persisted.createOnlyPersisted !== true
    || input.persisted.exactRereadVerified !== true
    || !sameRef(
      input.persisted.evidenceRef,
      visualIntelligenceModelBillingContextEvidenceRef(input.evidence),
    )
  ) throw new Error(
    'Visual Intelligence live qualification context persistence failed.',
  )
  const reread = await input.repository.readExact(input.persisted.evidenceRef)
  if (
    !reread
    || visualIntelligenceCanonicalJson(
      parseVisualIntelligenceModelBillingContextEvidence(reread),
    ) !== visualIntelligenceCanonicalJson(input.evidence)
  ) throw new Error(
    'Visual Intelligence live qualification context exact reread failed.',
  )
}

function createQualificationCorpus(input: {
  qualificationId: string
  contextClass: 'standard_le_200k' | 'long_gt_200k'
  byteLength: number
}): string {
  if (
    input.byteLength < 2_048
    || input.byteLength > MAXIMUM_CORPUS_BYTES
  ) throw new Error(
    'Visual Intelligence live qualification corpus bound is invalid.',
  )
  const header = `qualification=${input.qualificationId};context=${
    input.contextClass};inert_data_begins\n`
  let corpus = header
  let ordinal = 0
  while (Buffer.byteLength(corpus, 'utf8') < input.byteLength) {
    const chunk = visualIntelligenceDigest({
      qualificationId: input.qualificationId,
      contextClass: input.contextClass,
      ordinal,
    }).slice(7)
    corpus += `${String(ordinal).padStart(8, '0')}:${chunk}\n`
    ordinal += 1
  }
  return Buffer.from(corpus, 'utf8').subarray(0, input.byteLength)
    .toString('utf8')
}

async function bestEffortRelease(
  guard: VisualIntelligenceProviderTrafficGuardPort,
  lease: Parameters<VisualIntelligenceProviderTrafficGuardPort['release']>[0],
): Promise<void> {
  try {
    await guard.release(lease)
  } catch {
    // The original failure remains authoritative; guard expiry is the fallback.
  }
}

function sanitizedFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('outcome is unknown')) return 'provider_outcome_unknown'
  if (message.includes('provider evidence was rejected')) {
    return 'provider_evidence_rejected'
  }
  if (message.includes('persistence')) return 'evidence_persistence_failed'
  return 'qualification_failed_no_retry'
}

function validNow(now: Date): Date {
  if (!Number.isFinite(now.getTime())) throw new Error(
    'Visual Intelligence live qualification clock is invalid.',
  )
  return now
}

function validateDependencies(dependencies: {
  admissionReadPort: VisualIntelligenceModelBillingSkuLiveAdmissionReadPort
  providerTrafficGuardPort: VisualIntelligenceProviderTrafficGuardPort
  generatePort: VisualIntelligenceModelBillingSkuQualificationGeneratePort
  contextEvidenceRepository:
    VisualIntelligenceModelBillingContextEvidenceRepository
  resultRepository: VisualIntelligenceModelBillingSkuLiveResultRepository
  attemptStore: VisualIntelligenceModelBillingSkuLiveAttemptStore
  routeRegistryReadPort: {
    readExact(
      registryRef: VisualIntelligenceEvidenceRef,
    ): Promise<VisualIntelligenceCanonicalProviderRouteRegistry | null>
  }
}): void {
  if (
    typeof dependencies.admissionReadPort?.readExact !== 'function'
    || typeof dependencies.providerTrafficGuardPort?.acquire !== 'function'
    || typeof dependencies.providerTrafficGuardPort?.release !== 'function'
    || typeof dependencies.generatePort?.generate !== 'function'
    || typeof dependencies.contextEvidenceRepository
      ?.persistCreateOnly !== 'function'
    || typeof dependencies.contextEvidenceRepository?.readExact !== 'function'
    || typeof dependencies.resultRepository?.persistCreateOnly !== 'function'
    || typeof dependencies.resultRepository?.readExact !== 'function'
    || typeof dependencies.attemptStore?.beginCreateOnly !== 'function'
    || typeof dependencies.attemptStore?.markTerminal !== 'function'
    || typeof dependencies.routeRegistryReadPort?.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence live qualification executor is not configured.',
  )
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

export function visualIntelligenceModelBillingSkuLiveResultByteLength(
  value: VisualIntelligenceModelBillingSkuLiveResult,
): number {
  const result = parseVisualIntelligenceModelBillingSkuLiveResult(value)
  const byteLength = Buffer.byteLength(
    visualIntelligenceCanonicalJson(result),
    'utf8',
  )
  if (byteLength > MAXIMUM_RESULT_BYTES) throw new Error(
    'Visual Intelligence live qualification result exceeded its bound.',
  )
  return byteLength
}
