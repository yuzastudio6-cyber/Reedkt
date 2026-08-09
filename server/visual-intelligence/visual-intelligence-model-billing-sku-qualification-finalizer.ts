import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  parseVisualIntelligenceDetailedBillingExportObservation,
  visualIntelligenceDetailedBillingExportObservationRef,
} from './visual-intelligence-detailed-billing-export-read-port'
import type {
  VisualIntelligenceDetailedBillingExportObservationPublicationReceipt,
  VisualIntelligenceDetailedBillingExportObservationRepository,
} from './visual-intelligence-detailed-billing-export-observation-repository'
import {
  parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt,
  visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef,
} from './visual-intelligence-detailed-billing-export-observation-repository'
import {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
  createVisualIntelligenceModelBillingSkuQualification,
  parseVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
  type VisualIntelligenceModelBillingSkuQualification,
} from './visual-intelligence-model-billing-sku-qualification'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_CONTEXT_EVIDENCE_VERSION =
  'visual-intelligence-model-billing-context-evidence-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_VERSION =
  'visual-intelligence-provider-traffic-isolation-authority-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZER_VERSION =
  'visual-intelligence-model-billing-sku-qualification-finalizer-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZATION_RESULT_VERSION =
  'visual-intelligence-model-billing-sku-qualification-finalization-result-v1' as const

const MAXIMUM_WINDOW_MS = 60 * 60 * 1_000
const MAXIMUM_GEMINI_CONTEXT_TOKENS = 1_048_576
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

const contextEvidenceWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_CONTEXT_EVIDENCE_VERSION,
  ),
  evidenceId: safeId,
  evidenceVersion: positiveInteger,
  evidenceClass: z.literal(
    'live_guarded_implicit_cache_warmup_and_measured_request_pair',
  ),
  contextClass: z.enum(['standard_le_200k', 'long_gt_200k']),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  requestSetRef: evidenceRefSchema,
  providerUsageSetRef: evidenceRefSchema,
  warmupProviderRequestRef: evidenceRefSchema,
  measuredProviderRequestRef: evidenceRefSchema,
  warmupProviderUsageRef: evidenceRefSchema,
  measuredProviderUsageRef: evidenceRefSchema,
  warmupProviderResponseRef: evidenceRefSchema,
  measuredProviderResponseRef: evidenceRefSchema,
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  warmupPromptTokenCount: positiveInteger,
  warmupCachedTokenCount: z.literal(0),
  warmupCandidateTokenCount: positiveInteger,
  warmupThinkingTokenCount: nonnegativeInteger,
  measuredPromptTokenCount: positiveInteger,
  measuredCachedTokenCount: positiveInteger,
  measuredUncachedPromptTokenCount: positiveInteger,
  measuredCandidateTokenCount: positiveInteger,
  measuredThinkingTokenCount: nonnegativeInteger,
  implicitCachingUsed: z.literal(true),
  explicitCacheCreated: z.literal(false),
  contextCacheStorageBillingExpected: z.literal(false),
  liveProviderRequestCount: z.literal(2),
  exactReturnedModelIdVerifiedForEveryRequest: z.literal(true),
  exactProviderUsageMetadataReread: z.literal(true),
  requestBodiesServerOwned: z.literal(true),
  rawProviderPayloadPersisted: z.literal(false),
  providerToolsUsed: z.literal(false),
  groundingUsed: z.literal(false),
  urlContextUsed: z.literal(false),
  codeExecutionUsed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const refs = [
    value.requestSetRef,
    value.providerUsageSetRef,
    value.warmupProviderRequestRef,
    value.measuredProviderRequestRef,
    value.warmupProviderUsageRef,
    value.measuredProviderUsageRef,
    value.warmupProviderResponseRef,
    value.measuredProviderResponseRef,
  ]
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  const threshold = VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS
  const contextTokensAreExact = value.contextClass === 'standard_le_200k'
    ? value.warmupPromptTokenCount <= threshold
      && value.measuredPromptTokenCount <= threshold
    : value.warmupPromptTokenCount > threshold
      && value.measuredPromptTokenCount > threshold
  if (
    new Set(refs.map(refKey)).size !== refs.length
    || finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || !contextTokensAreExact
    || value.warmupPromptTokenCount > MAXIMUM_GEMINI_CONTEXT_TOKENS
    || value.measuredPromptTokenCount > MAXIMUM_GEMINI_CONTEXT_TOKENS
    || value.warmupPromptTokenCount !== value.measuredPromptTokenCount
    || value.measuredCachedTokenCount
      + value.measuredUncachedPromptTokenCount
      !== value.measuredPromptTokenCount
    || value.measuredCachedTokenCount >= value.measuredPromptTokenCount
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence model billing context evidence is invalid.',
  })
})

const contextEvidenceSchema = contextEvidenceWithoutDigestSchema.extend({
  evidenceDigestSha256: prefixedSha256,
}).strict()

const isolationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_VERSION,
  ),
  authorityId: safeId,
  authorityVersion: positiveInteger,
  evidenceClass: z.literal(
    'exclusive_provider_guard_plus_exact_cloud_audit_window_reread',
  ),
  projectId: z.literal('reeditpro'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  standardContextEvidenceRef: evidenceRefSchema,
  longContextEvidenceRef: evidenceRefSchema,
  exactOrderedProviderRequestRefs: z.array(evidenceRefSchema).length(4),
  providerGuardLeaseRef: evidenceRefSchema,
  providerGuardReleaseReceiptRef: evidenceRefSchema,
  cloudAuditWindowObservationRef: evidenceRefSchema,
  canonicalProviderRouteRegistryRef: evidenceRefSchema,
  observedProviderRequestCount: z.literal(4),
  guardHeldForWholeQualificationWindow: z.literal(true),
  allCanonicalVisualIntelligenceProviderRoutesRequireGuard: z.literal(true),
  nonCanonicalDirectProviderRouteAllowedByServiceAccount: z.literal(false),
  exactCloudAuditWindowReread: z.literal(true),
  sameSkuConcurrentTrafficObserved: z.literal(false),
  noOtherModelOrSkuTrafficInObservationWindow: z.literal(true),
  callerAuthoredIsolationClaimAccepted: z.literal(false),
  providerCallMadeByAuthorityReader: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  const refs = [
    value.standardContextEvidenceRef,
    value.longContextEvidenceRef,
    ...value.exactOrderedProviderRequestRefs,
    value.providerGuardLeaseRef,
    value.providerGuardReleaseReceiptRef,
    value.cloudAuditWindowObservationRef,
    value.canonicalProviderRouteRegistryRef,
  ]
  if (
    finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || new Set(refs.map(refKey)).size !== refs.length
    || new Set(value.exactOrderedProviderRequestRefs.map(refKey)).size !== 4
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider isolation authority is invalid.',
  })
})

const isolationSchema = isolationWithoutDigestSchema.extend({
  authorityDigestSha256: prefixedSha256,
}).strict()

const finalizationResultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZATION_RESULT_VERSION,
  ),
  finalizerVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZER_VERSION,
  ),
  resultId: safeId,
  resultVersion: positiveInteger,
  evidenceClass: z.literal(
    'canonical_exact_reread_model_sku_qualification_finalization',
  ),
  qualificationRef: evidenceRefSchema,
  standardContextEvidenceRef: evidenceRefSchema,
  longContextEvidenceRef: evidenceRefSchema,
  billingObservationRef: evidenceRefSchema,
  billingObservationPublicationReceiptRef: evidenceRefSchema,
  providerTrafficIsolationAuthorityRef: evidenceRefSchema,
  qualificationPersistenceReceiptRef: evidenceRefSchema,
  exactContextEvidenceReread: z.literal(true),
  exactBillingObservationReread: z.literal(true),
  exactIsolationAuthorityReread: z.literal(true),
  exactQualificationCreateOnlyPersistedAndReread: z.literal(true),
  noOtherModelOrSkuTrafficVerified: z.literal(true),
  providerCallMadeByFinalizer: z.literal(false),
  billingExportQueriedByFinalizer: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  runtimeReleaseAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const refs = [
    value.qualificationRef,
    value.standardContextEvidenceRef,
    value.longContextEvidenceRef,
    value.billingObservationRef,
    value.billingObservationPublicationReceiptRef,
    value.providerTrafficIsolationAuthorityRef,
    value.qualificationPersistenceReceiptRef,
  ]
  if (new Set(refs.map(refKey)).size !== refs.length) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence qualification result lineage is invalid.',
  })
})

const finalizationResultSchema = finalizationResultWithoutDigestSchema.extend({
  resultDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingContextEvidence =
  z.infer<typeof contextEvidenceSchema>
export type VisualIntelligenceProviderTrafficIsolationAuthority =
  z.infer<typeof isolationSchema>
export type VisualIntelligenceModelBillingSkuQualificationFinalizationResult =
  z.infer<typeof finalizationResultSchema>

export interface VisualIntelligenceModelBillingContextEvidenceReadPort {
  readExact(
    evidenceRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceModelBillingContextEvidence | null>
}

export interface VisualIntelligenceProviderTrafficIsolationAuthorityReadPort {
  readExact(
    authorityRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceProviderTrafficIsolationAuthority | null>
}

export interface VisualIntelligenceModelBillingSkuQualificationRepository {
  persistCreateOnly(
    qualification: VisualIntelligenceModelBillingSkuQualification,
  ): Promise<{
    readonly qualificationRef: VisualIntelligenceEvidenceRef
    readonly persistenceReceiptRef: VisualIntelligenceEvidenceRef
    readonly createOnlyPersisted: true
    readonly exactRereadVerified: true
  }>
  readExact(
    qualificationRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceModelBillingSkuQualification | null>
}

export function createVisualIntelligenceModelBillingContextEvidence(
  input: z.input<typeof contextEvidenceWithoutDigestSchema>,
): VisualIntelligenceModelBillingContextEvidence {
  const payload = contextEvidenceWithoutDigestSchema.parse(input)
  return Object.freeze(contextEvidenceSchema.parse({
    ...payload,
    evidenceDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceModelBillingContextEvidence(
  value: unknown,
): VisualIntelligenceModelBillingContextEvidence {
  const evidence = contextEvidenceSchema.parse(value)
  const payload = { ...evidence }
  Reflect.deleteProperty(payload, 'evidenceDigestSha256')
  if (evidence.evidenceDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence model billing context evidence digest is invalid.',
    )
  }
  return Object.freeze(evidence)
}

export function visualIntelligenceModelBillingContextEvidenceRef(
  value: VisualIntelligenceModelBillingContextEvidence,
): VisualIntelligenceEvidenceRef {
  const evidence = parseVisualIntelligenceModelBillingContextEvidence(value)
  return Object.freeze({
    id: evidence.evidenceId,
    version: evidence.evidenceVersion,
    contentHash: evidence.evidenceDigestSha256,
  })
}

export function createControlledVisualIntelligenceProviderTrafficIsolationAuthority(
  input: z.input<typeof isolationWithoutDigestSchema>,
): VisualIntelligenceProviderTrafficIsolationAuthority {
  const payload = isolationWithoutDigestSchema.parse(input)
  return Object.freeze(isolationSchema.parse({
    ...payload,
    authorityDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceProviderTrafficIsolationAuthority(
  value: unknown,
): VisualIntelligenceProviderTrafficIsolationAuthority {
  const authority = isolationSchema.parse(value)
  const payload = { ...authority }
  Reflect.deleteProperty(payload, 'authorityDigestSha256')
  if (authority.authorityDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence provider isolation authority digest is invalid.',
    )
  }
  return Object.freeze(authority)
}

export function visualIntelligenceProviderTrafficIsolationAuthorityRef(
  value: VisualIntelligenceProviderTrafficIsolationAuthority,
): VisualIntelligenceEvidenceRef {
  const authority =
    parseVisualIntelligenceProviderTrafficIsolationAuthority(value)
  return Object.freeze({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: authority.authorityDigestSha256,
  })
}

export function parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult(
  value: unknown,
): VisualIntelligenceModelBillingSkuQualificationFinalizationResult {
  const result = finalizationResultSchema.parse(value)
  const payload = { ...result }
  Reflect.deleteProperty(payload, 'resultDigestSha256')
  if (result.resultDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence qualification finalization result is invalid.',
    )
  }
  return Object.freeze(result)
}

export function createVisualIntelligenceModelBillingSkuQualificationFinalizer(
  dependencies: {
    readonly contextEvidenceReadPort:
      VisualIntelligenceModelBillingContextEvidenceReadPort
    readonly billingObservationRepository:
      VisualIntelligenceDetailedBillingExportObservationRepository
    readonly isolationAuthorityReadPort:
      VisualIntelligenceProviderTrafficIsolationAuthorityReadPort
    readonly qualificationRepository:
      VisualIntelligenceModelBillingSkuQualificationRepository
  },
) {
  validateDependencies(dependencies)
  return Object.freeze({
    async finalize(untrusted: {
      readonly qualificationId: string
      readonly qualificationVersion: number
      readonly standardContextEvidenceRef: VisualIntelligenceEvidenceRef
      readonly longContextEvidenceRef: VisualIntelligenceEvidenceRef
      readonly billingObservationPublicationReceipt:
        VisualIntelligenceDetailedBillingExportObservationPublicationReceipt
      readonly billingObservationPublicationReceiptRef:
        VisualIntelligenceEvidenceRef
      readonly providerTrafficIsolationAuthorityRef:
        VisualIntelligenceEvidenceRef
    }): Promise<
      VisualIntelligenceModelBillingSkuQualificationFinalizationResult
    > {
      const input = parseFinalizationInput(untrusted)
      const [standardRaw, longRaw, billingObservation, isolationRaw] =
        await Promise.all([
          dependencies.contextEvidenceReadPort.readExact(
            input.standardContextEvidenceRef,
          ),
          dependencies.contextEvidenceReadPort.readExact(
            input.longContextEvidenceRef,
          ),
          dependencies.billingObservationRepository.readExact(
            input.billingObservationPublicationReceipt,
          ),
          dependencies.isolationAuthorityReadPort.readExact(
            input.providerTrafficIsolationAuthorityRef,
          ),
        ])
      if (!standardRaw || !longRaw || !isolationRaw) {
        throw new Error(
          'Visual Intelligence qualification evidence is missing.',
        )
      }
      const standard =
        parseVisualIntelligenceModelBillingContextEvidence(standardRaw)
      const long = parseVisualIntelligenceModelBillingContextEvidence(longRaw)
      const parsedBillingObservation =
        parseVisualIntelligenceDetailedBillingExportObservation(
          billingObservation,
        )
      const isolation =
        parseVisualIntelligenceProviderTrafficIsolationAuthority(isolationRaw)
      validateFinalizationLineage({
        input,
        standard,
        long,
        billingObservation: parsedBillingObservation,
        isolation,
      })
      const qualification =
        createVisualIntelligenceModelBillingSkuQualification({
          schemaVersion:
            'visual-intelligence-model-billing-sku-qualification-v1',
          evidenceClass:
            'live_isolated_vertex_usage_and_billing_export_reconciliation',
          qualificationId: input.qualificationId,
          qualificationVersion: input.qualificationVersion,
          exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
          vertexLocation: 'global',
          throughputClass: 'standard',
          providerServiceId: 'services/C7E2-9256-1C43',
          billingSkuFamily: 'gemini_3_0_pro_shared_billing_family',
          billingSkuCatalogVersion:
            'weeditpro-gemini-3_1-pro-standard-global-sku-catalog-v1',
          contextThresholdInputTokens:
            VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
          wholeRequestLongContextRatesRequired: true,
          qualifiedRateClasses: [
            ...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
          ],
          exactSkuIds:
            WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
              (term) => term.skuId,
            ),
          standardContextProviderRequestRef: standard.requestSetRef,
          longContextProviderRequestRef: long.requestSetRef,
          standardContextProviderUsageRef: standard.providerUsageSetRef,
          longContextProviderUsageRef: long.providerUsageSetRef,
          detailedBillingExportRef:
            parsedBillingObservation.detailedBillingExportRef,
          billingSkuMetadataSetRef:
            parsedBillingObservation.billingSkuMetadataSetRef,
          isolatedUsageReconciliationReportRef:
            parsedBillingObservation.isolatedUsageReconciliationReportRef,
          qualificationWindowStartedAtIso:
            isolation.qualificationWindowStartedAtIso,
          qualificationWindowFinishedAtIso:
            isolation.qualificationWindowFinishedAtIso,
          billingExportFreshThroughIso:
            parsedBillingObservation.billingExportFreshThroughIso,
          liveGeminiStandardContextRequestExecuted: true,
          liveGeminiLongContextRequestExecuted: true,
          exactReturnedModelIdVerified: true,
          exactProviderUsageMetadataReread: true,
          isolatedBillingWindowVerified: true,
          noOtherModelOrSkuTrafficInObservationWindow: true,
          detailedBillingExportExactReread: true,
          exactStandardAndLongSkuMappingVerified: true,
          publicListPriceUsed: false,
          providerDispatchAuthorityGranted: false,
          customerPricingOrServiceFeeAuthorityGranted: false,
          walletOrCreditMutationAuthorityGranted: false,
          productionReleaseAuthorityGranted: false,
        })
      const persisted = await dependencies.qualificationRepository
        .persistCreateOnly(qualification)
      const qualificationRef =
        visualIntelligenceModelBillingSkuQualificationRef(qualification)
      if (
        persisted.createOnlyPersisted !== true
        || persisted.exactRereadVerified !== true
        || !sameRef(persisted.qualificationRef, qualificationRef)
      ) throw new Error(
        'Visual Intelligence qualification persistence was not reconciled.',
      )
      const reread = await dependencies.qualificationRepository.readExact(
        persisted.qualificationRef,
      )
      if (
        !reread
        || visualIntelligenceCanonicalJson(
          parseVisualIntelligenceModelBillingSkuQualification(reread),
        ) !== visualIntelligenceCanonicalJson(qualification)
      ) throw new Error(
        'Visual Intelligence qualification exact reread failed.',
      )
      const resultPayload = finalizationResultWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZATION_RESULT_VERSION,
        finalizerVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_FINALIZER_VERSION,
        resultId: `${input.qualificationId}.finalization`,
        resultVersion: input.qualificationVersion,
        evidenceClass:
          'canonical_exact_reread_model_sku_qualification_finalization',
        qualificationRef,
        standardContextEvidenceRef: input.standardContextEvidenceRef,
        longContextEvidenceRef: input.longContextEvidenceRef,
        billingObservationRef:
          input.billingObservationPublicationReceipt.observationRef,
        billingObservationPublicationReceiptRef:
          input.billingObservationPublicationReceiptRef,
        providerTrafficIsolationAuthorityRef:
          input.providerTrafficIsolationAuthorityRef,
        qualificationPersistenceReceiptRef:
          persisted.persistenceReceiptRef,
        exactContextEvidenceReread: true,
        exactBillingObservationReread: true,
        exactIsolationAuthorityReread: true,
        exactQualificationCreateOnlyPersistedAndReread: true,
        noOtherModelOrSkuTrafficVerified: true,
        providerCallMadeByFinalizer: false,
        billingExportQueriedByFinalizer: false,
        providerDispatchAuthorityGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        walletOrCreditMutationAuthorityGranted: false,
        runtimeReleaseAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(finalizationResultSchema.parse({
        ...resultPayload,
        resultDigestSha256: visualIntelligenceDigest(resultPayload),
      }))
    },
  })
}

function parseFinalizationInput(value: unknown) {
  return z.object({
    qualificationId: safeId,
    qualificationVersion: positiveInteger,
    standardContextEvidenceRef: evidenceRefSchema,
    longContextEvidenceRef: evidenceRefSchema,
    billingObservationPublicationReceipt: z.unknown(),
    billingObservationPublicationReceiptRef: evidenceRefSchema,
    providerTrafficIsolationAuthorityRef: evidenceRefSchema,
  }).strict().transform((input) => ({
    ...input,
    billingObservationPublicationReceipt:
      parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt(
        input.billingObservationPublicationReceipt,
      ),
  })).parse(value)
}

function validateFinalizationLineage(input: {
  input: ReturnType<typeof parseFinalizationInput>
  standard: VisualIntelligenceModelBillingContextEvidence
  long: VisualIntelligenceModelBillingContextEvidence
  billingObservation: Awaited<ReturnType<
    VisualIntelligenceDetailedBillingExportObservationRepository['readExact']
  >>
  isolation: VisualIntelligenceProviderTrafficIsolationAuthority
}): void {
  const { standard, long, billingObservation, isolation } = input
  const orderedRequestRefs = [
    standard.warmupProviderRequestRef,
    standard.measuredProviderRequestRef,
    long.warmupProviderRequestRef,
    long.measuredProviderRequestRef,
  ]
  const withinIsolation = (startedAtIso: string, finishedAtIso: string) =>
    Date.parse(startedAtIso)
      >= Date.parse(isolation.qualificationWindowStartedAtIso)
    && Date.parse(finishedAtIso)
      <= Date.parse(isolation.qualificationWindowFinishedAtIso)
  if (
    standard.contextClass !== 'standard_le_200k'
    || long.contextClass !== 'long_gt_200k'
    || !sameRef(
      visualIntelligenceModelBillingContextEvidenceRef(standard),
      input.input.standardContextEvidenceRef,
    )
    || !sameRef(
      visualIntelligenceModelBillingContextEvidenceRef(long),
      input.input.longContextEvidenceRef,
    )
    || !sameRef(
      visualIntelligenceProviderTrafficIsolationAuthorityRef(isolation),
      input.input.providerTrafficIsolationAuthorityRef,
    )
    || !sameRef(isolation.standardContextEvidenceRef,
      input.input.standardContextEvidenceRef)
    || !sameRef(isolation.longContextEvidenceRef,
      input.input.longContextEvidenceRef)
    || visualIntelligenceCanonicalJson(isolation.exactOrderedProviderRequestRefs)
      !== visualIntelligenceCanonicalJson(orderedRequestRefs)
    || !withinIsolation(
      standard.qualificationWindowStartedAtIso,
      standard.qualificationWindowFinishedAtIso,
    )
    || !withinIsolation(
      long.qualificationWindowStartedAtIso,
      long.qualificationWindowFinishedAtIso,
    )
    || Date.parse(standard.qualificationWindowFinishedAtIso)
      > Date.parse(long.qualificationWindowStartedAtIso)
    || billingObservation.qualificationWindowStartedAtIso
      !== isolation.qualificationWindowStartedAtIso
    || billingObservation.qualificationWindowFinishedAtIso
      !== isolation.qualificationWindowFinishedAtIso
    || !sameRef(
      billingObservation.queryConfigurationRef,
      input.input.billingObservationPublicationReceipt.queryConfigurationRef,
    )
    || !sameRef(
      visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef(
        input.input.billingObservationPublicationReceipt,
      ),
      input.input.billingObservationPublicationReceiptRef,
    )
    || !sameRef(
      input.input.billingObservationPublicationReceipt.observationRef,
      visualIntelligenceDetailedBillingExportObservationRef(
        billingObservation,
      ),
    )
    || isolation.noOtherModelOrSkuTrafficInObservationWindow !== true
  ) throw new Error(
    'Visual Intelligence qualification lineage is inconsistent.',
  )
}

function validateDependencies(dependencies: {
  contextEvidenceReadPort: VisualIntelligenceModelBillingContextEvidenceReadPort
  billingObservationRepository:
    VisualIntelligenceDetailedBillingExportObservationRepository
  isolationAuthorityReadPort:
    VisualIntelligenceProviderTrafficIsolationAuthorityReadPort
  qualificationRepository:
    VisualIntelligenceModelBillingSkuQualificationRepository
}): void {
  if (
    !dependencies.contextEvidenceReadPort
    || typeof dependencies.contextEvidenceReadPort.readExact !== 'function'
    || !dependencies.billingObservationRepository
    || typeof dependencies.billingObservationRepository.readExact !== 'function'
    || !dependencies.isolationAuthorityReadPort
    || typeof dependencies.isolationAuthorityReadPort.readExact !== 'function'
    || !dependencies.qualificationRepository
    || typeof dependencies.qualificationRepository.persistCreateOnly
      !== 'function'
    || typeof dependencies.qualificationRepository.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence qualification finalizer is not configured.',
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
