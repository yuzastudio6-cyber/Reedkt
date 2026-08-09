import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceCostPreflight,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION,
} from './visual-intelligence-account-effective-cost-owner'
import {
  createVisualIntelligenceModelBillingSkuLiveAdmission,
  parseVisualIntelligenceModelBillingSkuLiveAdmission,
  VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION,
  VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  type VisualIntelligenceModelBillingSkuLiveAdmission,
  type VisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort,
} from './visual-intelligence-model-billing-sku-live-executor'
import type {
  VisualIntelligenceModelBillingSkuLiveGcsStore,
} from './visual-intelligence-model-billing-sku-live-gcs-store'
import {
  createControlledVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
  type VisualIntelligenceCanonicalProviderRouteRegistry,
} from './visual-intelligence-provider-traffic-isolation-authority-finalizer'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from './visual-intelligence-runtime-release'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_VERSION =
  'visual-intelligence-model-billing-sku-live-admission-owner-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_INTERNAL_SPEND_APPROVAL_VERSION =
  'visual-intelligence-model-billing-sku-internal-spend-approval-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_ADMISSION_PUBLICATION_RESULT_VERSION =
  'visual-intelligence-model-billing-sku-admission-publication-result-v1' as const

const MAXIMUM_PROVIDER_REQUEST_COUNT = 4
const MAXIMUM_TOTAL_PROMPT_TOKENS = 2_097_152
const MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS = 64
const MAXIMUM_INTERNAL_SPEND_USD_MICROS = 50_000_000
const MAXIMUM_ADMISSION_AGE_MS = 60 * 60 * 1_000
const MAXIMUM_ISSUED_AT_SKEW_MS = 5 * 60 * 1_000
const DEFAULT_APPROVAL_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/internal-spend-approvals'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const approvalWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_INTERNAL_SPEND_APPROVAL_VERSION,
  ),
  approvalId: safeId,
  approvalVersion: positiveInteger,
  evidenceClass: z.literal(
    'explicit_single_use_internal_provider_spend_approval',
  ),
  projectId: z.literal('reeditpro'),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  qualificationId: safeId,
  qualificationVersion: positiveInteger,
  approvedSourceReleaseRef: evidenceRefSchema,
  accountEffectiveRateAuthorityRef: evidenceRefSchema,
  providerRouteRegistryRef: evidenceRefSchema,
  costPreflightRef: evidenceRefSchema,
  approvedAtIso: timestamp,
  expiresAtIso: timestamp,
  maximumProviderRequestCount: z.literal(MAXIMUM_PROVIDER_REQUEST_COUNT),
  maximumTotalPromptTokens: z.literal(MAXIMUM_TOTAL_PROMPT_TOKENS),
  maximumTotalOutputAndThinkingTokens: z.literal(
    MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
  ),
  rateDerivedMaximumCostUsdMicros: positiveInteger
    .max(MAXIMUM_INTERNAL_SPEND_USD_MICROS),
  operatorApprovedMaximumSpendUsdMicros: positiveInteger
    .max(MAXIMUM_INTERNAL_SPEND_USD_MICROS),
  exactStandardAndLongImplicitCachePairsApproved: z.literal(true),
  currentProcessExplicitConfirmationObserved: z.literal(true),
  canonicalServicePrincipalEmail: z.literal(
    'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
  ),
  canonicalServiceIdentityVerified: z.literal(true),
  singleUseAdmissionOnly: z.literal(true),
  automaticProviderRetryAllowed: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  captionEvidenceAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const approved = Date.parse(value.approvedAtIso)
  const expires = Date.parse(value.expiresAtIso)
  if (
    expires <= approved
    || expires - approved > MAXIMUM_ADMISSION_AGE_MS
    || value.rateDerivedMaximumCostUsdMicros
      > value.operatorApprovedMaximumSpendUsdMicros
    || new Set([
      value.approvedSourceReleaseRef,
      value.accountEffectiveRateAuthorityRef,
      value.providerRouteRegistryRef,
      value.costPreflightRef,
    ].map(refKey)).size !== 4
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence internal spend approval is invalid.',
  })
})

const approvalSchema = approvalWithoutDigestSchema.extend({
  approvalDigestSha256: prefixedSha256,
}).strict()

const publicationResultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_ADMISSION_PUBLICATION_RESULT_VERSION,
  ),
  ownerVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_VERSION,
  ),
  evidenceClass: z.literal(
    'exact_release_rate_cost_route_approval_admission_publication',
  ),
  approvedSourceReleaseRef: evidenceRefSchema,
  accountEffectiveRateAuthorityRef: evidenceRefSchema,
  costPreflightRef: evidenceRefSchema,
  providerRouteRegistryRef: evidenceRefSchema,
  internalSpendApprovalRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  exactAdmittedRuntimeReleaseReread: z.literal(true),
  currentAccountEffectiveRateRereadAndCostPreflightCreated: z.literal(true),
  exactProviderRouteRegistryCreateOnlyPersistedAndReread: z.literal(true),
  internalSpendApprovalCreateOnlyPersistedAndReread: z.literal(true),
  admissionCreateOnlyPersistedAndReread: z.literal(true),
  providerCallMade: z.literal(false),
  providerDispatchGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  captionEvidenceAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict()

const publicationResultSchema = publicationResultWithoutDigestSchema.extend({
  resultDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingSkuInternalSpendApproval =
  z.infer<typeof approvalSchema>
export type VisualIntelligenceModelBillingSkuAdmissionPublicationResult =
  z.infer<typeof publicationResultSchema>

export interface VisualIntelligenceModelBillingSkuInternalSpendApprovalRepository {
  persistCreateOnly(
    approval: VisualIntelligenceModelBillingSkuInternalSpendApproval,
  ): Promise<VisualIntelligenceEvidenceRef>
  readExact(
    approvalRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceModelBillingSkuInternalSpendApproval | null>
}

interface VisualIntelligenceModelBillingSkuCostPreflightOwner {
  readonly rateAuthorityRef: VisualIntelligenceEvidenceRef
  createPreflight(input: {
    readonly requestId: string
    readonly maximumInputTokenCount: number
    readonly maximumOutputAndThinkingTokenCount: number
    readonly estimatedInputTokenCount: number
    readonly estimatedOutputAndThinkingTokenCount: number
  }): Promise<VisualIntelligenceCostPreflight>
}

export function createVisualIntelligenceModelBillingSkuInternalSpendApproval(
  input: z.input<typeof approvalWithoutDigestSchema>,
): VisualIntelligenceModelBillingSkuInternalSpendApproval {
  const payload = approvalWithoutDigestSchema.parse(input)
  return Object.freeze(approvalSchema.parse({
    ...payload,
    approvalDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function parseVisualIntelligenceModelBillingSkuInternalSpendApproval(
  value: unknown,
): VisualIntelligenceModelBillingSkuInternalSpendApproval {
  const approval = approvalSchema.parse(value)
  const payload = { ...approval }
  Reflect.deleteProperty(payload, 'approvalDigestSha256')
  if (approval.approvalDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence internal spend approval digest is invalid.',
    )
  }
  return Object.freeze(approval)
}

export function visualIntelligenceModelBillingSkuInternalSpendApprovalRef(
  value: VisualIntelligenceModelBillingSkuInternalSpendApproval,
): VisualIntelligenceEvidenceRef {
  const approval =
    parseVisualIntelligenceModelBillingSkuInternalSpendApproval(value)
  return Object.freeze({
    id: approval.approvalId,
    version: approval.approvalVersion,
    contentHash: approval.approvalDigestSha256,
  })
}

export function parseVisualIntelligenceModelBillingSkuAdmissionPublicationResult(
  value: unknown,
): VisualIntelligenceModelBillingSkuAdmissionPublicationResult {
  const result = publicationResultSchema.parse(value)
  const payload = { ...result }
  Reflect.deleteProperty(payload, 'resultDigestSha256')
  if (result.resultDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence admission publication result digest is invalid.',
    )
  }
  return Object.freeze(result)
}

export function createVisualIntelligenceModelBillingSkuInternalSpendApprovalRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): VisualIntelligenceModelBillingSkuInternalSpendApprovalRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_APPROVAL_PREFIX)
  return Object.freeze({
    async persistCreateOnly(
      untrusted: VisualIntelligenceModelBillingSkuInternalSpendApproval,
    ) {
      const approval =
        parseVisualIntelligenceModelBillingSkuInternalSpendApproval(untrusted)
      const approvalRef =
        visualIntelligenceModelBillingSkuInternalSpendApprovalRef(approval)
      const path = objectPath(prefix, approvalRef)
      const body = Buffer.from(visualIntelligenceCanonicalJson(approval), 'utf8')
      await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await input.objectPort.readExact(path)
      if (!reread || !reread.equals(body)) throw new Error(
        'Visual Intelligence internal spend approval exact reread failed.',
      )
      return approvalRef
    },
    async readExact(untrustedRef: VisualIntelligenceEvidenceRef) {
      const approvalRef = evidenceRefSchema.parse(untrustedRef)
      const body = await input.objectPort.readExact(
        objectPath(prefix, approvalRef),
      )
      if (!body) return null
      let decoded: unknown
      try {
        decoded = JSON.parse(body.toString('utf8')) as unknown
      } catch (error) {
        throw new Error(
          'Visual Intelligence internal spend approval is not JSON.',
          { cause: error },
        )
      }
      const approval =
        parseVisualIntelligenceModelBillingSkuInternalSpendApproval(decoded)
      if (
        !sameRef(
          visualIntelligenceModelBillingSkuInternalSpendApprovalRef(approval),
          approvalRef,
        )
        || visualIntelligenceCanonicalJson(approval) !== body.toString('utf8')
      ) throw new Error(
        'Visual Intelligence internal spend approval identity changed.',
      )
      return approval
    },
  })
}

export function createVisualIntelligenceModelBillingSkuLiveAdmissionOwner(
  dependencies: {
    readonly costPreflightOwner:
      VisualIntelligenceModelBillingSkuCostPreflightOwner
    readonly approvalRepository:
      VisualIntelligenceModelBillingSkuInternalSpendApprovalRepository
    readonly liveStore: VisualIntelligenceModelBillingSkuLiveGcsStore
    readonly now?: () => Date
  },
) {
  assertDependencies(dependencies)
  const now = dependencies.now ?? (() => new Date())
  return Object.freeze({
    async publish(input: {
      readonly authorizationId: string
      readonly authorizationVersion: number
      readonly qualificationId: string
      readonly qualificationVersion: number
      readonly issuedAtIso: string
      readonly expiresAtIso: string
      readonly maximumInternalProviderSpendUsdMicros: number
      readonly providerPrincipalEmail:
        'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
      readonly currentProcessExplicitConfirmationObserved: true
      readonly runtimeRelease: VisualIntelligenceRuntimeRelease
    }): Promise<VisualIntelligenceModelBillingSkuAdmissionPublicationResult> {
      const requested = publicationInputSchema.parse(input)
      validateTimeWindow(requested, now())
      const runtimeRelease = assertAdmittedVisualIntelligenceRuntimeRelease(
        requested.runtimeRelease,
      )
      if (
        runtimeRelease.projectId !== 'reeditpro'
        || runtimeRelease.vertexLocation !== 'global'
        || runtimeRelease.exactModelId !== VISUAL_INTELLIGENCE_MODEL_ID
        || !sameRef(
          runtimeRelease.accountEffectivePricingAuthorityRef,
          dependencies.costPreflightOwner.rateAuthorityRef,
        )
        || runtimeRelease.productionAuthorityGranted
      ) throw new Error(
        'Visual Intelligence runtime release cannot authorize qualification.',
      )
      const approvedSourceReleaseRef =
        visualIntelligenceRuntimeReleaseRef(runtimeRelease)
      const providerRouteRegistry = routeRegistry(approvedSourceReleaseRef)
      const providerRouteRegistryRef =
        visualIntelligenceCanonicalProviderRouteRegistryRef(
          providerRouteRegistry,
        )
      const costPreflight = await dependencies.costPreflightOwner
        .createPreflight({
          requestId: `${requested.authorizationId}.model-sku-cost-preflight`,
          maximumInputTokenCount: MAXIMUM_TOTAL_PROMPT_TOKENS,
          maximumOutputAndThinkingTokenCount:
            MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
          estimatedInputTokenCount: MAXIMUM_TOTAL_PROMPT_TOKENS,
          estimatedOutputAndThinkingTokenCount:
            MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
        })
      validateCostPreflight({
        costPreflight,
        configuredRateRef: dependencies.costPreflightOwner.rateAuthorityRef,
        operatorCap: requested.maximumInternalProviderSpendUsdMicros,
      })
      const persistedRegistryRef =
        await dependencies.liveStore.persistRouteRegistryCreateOnly(
          providerRouteRegistry,
        )
      const rereadRegistry =
        await dependencies.liveStore.routeRegistryReadPort.readExact(
          providerRouteRegistryRef,
        )
      if (
        !sameRef(persistedRegistryRef, providerRouteRegistryRef)
        || !rereadRegistry
        || visualIntelligenceCanonicalJson(rereadRegistry)
          !== visualIntelligenceCanonicalJson(providerRouteRegistry)
      ) throw new Error(
        'Visual Intelligence provider route registry publication failed.',
      )
      const approval = createVisualIntelligenceModelBillingSkuInternalSpendApproval({
        schemaVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_INTERNAL_SPEND_APPROVAL_VERSION,
        approvalId: requested.authorizationId,
        approvalVersion: requested.authorizationVersion,
        evidenceClass:
          'explicit_single_use_internal_provider_spend_approval',
        projectId: 'reeditpro',
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        vertexLocation: 'global',
        throughputClass: 'standard',
        providerServiceId: 'services/C7E2-9256-1C43',
        qualificationId: requested.qualificationId,
        qualificationVersion: requested.qualificationVersion,
        approvedSourceReleaseRef,
        accountEffectiveRateAuthorityRef:
          costPreflight.accountEffectiveRateAuthorityRef,
        providerRouteRegistryRef,
        costPreflightRef: costPreflight.pricingSnapshotRef,
        approvedAtIso: requested.issuedAtIso,
        expiresAtIso: requested.expiresAtIso,
        maximumProviderRequestCount: MAXIMUM_PROVIDER_REQUEST_COUNT,
        maximumTotalPromptTokens: MAXIMUM_TOTAL_PROMPT_TOKENS,
        maximumTotalOutputAndThinkingTokens:
          MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
        rateDerivedMaximumCostUsdMicros:
          costPreflight.maximumAuthorizedCostMicros,
        operatorApprovedMaximumSpendUsdMicros:
          requested.maximumInternalProviderSpendUsdMicros,
        exactStandardAndLongImplicitCachePairsApproved: true,
        currentProcessExplicitConfirmationObserved: true,
        canonicalServicePrincipalEmail: requested.providerPrincipalEmail,
        canonicalServiceIdentityVerified: true,
        singleUseAdmissionOnly: true,
        automaticProviderRetryAllowed: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        customerCreditOrWalletMutationAuthorityGranted: false,
        captionEvidenceAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      const internalSpendApprovalRef =
        visualIntelligenceModelBillingSkuInternalSpendApprovalRef(approval)
      const persistedApprovalRef =
        await dependencies.approvalRepository.persistCreateOnly(approval)
      const rereadApproval =
        await dependencies.approvalRepository.readExact(
          internalSpendApprovalRef,
        )
      if (
        !sameRef(persistedApprovalRef, internalSpendApprovalRef)
        || !rereadApproval
        || visualIntelligenceCanonicalJson(rereadApproval)
          !== visualIntelligenceCanonicalJson(approval)
      ) throw new Error(
        'Visual Intelligence internal spend approval publication failed.',
      )
      const admission = buildAdmission({
        requested,
        approvedSourceReleaseRef,
        internalSpendApprovalRef,
        providerRouteRegistryRef,
      })
      const admissionRef =
        visualIntelligenceModelBillingSkuLiveAdmissionRef(admission)
      const persistedAdmissionRef =
        await dependencies.liveStore.persistAdmissionCreateOnly(admission)
      const rereadAdmission =
        await dependencies.liveStore.admissionReadPort.readExact(admissionRef)
      if (
        !sameRef(persistedAdmissionRef, admissionRef)
        || !rereadAdmission
        || visualIntelligenceCanonicalJson(rereadAdmission)
          !== visualIntelligenceCanonicalJson(admission)
      ) throw new Error(
        'Visual Intelligence live qualification admission publication failed.',
      )
      const payload = publicationResultWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_ADMISSION_PUBLICATION_RESULT_VERSION,
        ownerVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_VERSION,
        evidenceClass:
          'exact_release_rate_cost_route_approval_admission_publication',
        approvedSourceReleaseRef,
        accountEffectiveRateAuthorityRef:
          costPreflight.accountEffectiveRateAuthorityRef,
        costPreflightRef: costPreflight.pricingSnapshotRef,
        providerRouteRegistryRef,
        internalSpendApprovalRef,
        admissionRef,
        exactAdmittedRuntimeReleaseReread: true,
        currentAccountEffectiveRateRereadAndCostPreflightCreated: true,
        exactProviderRouteRegistryCreateOnlyPersistedAndReread: true,
        internalSpendApprovalCreateOnlyPersistedAndReread: true,
        admissionCreateOnlyPersistedAndReread: true,
        providerCallMade: false,
        providerDispatchGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        customerCreditOrWalletMutationAuthorityGranted: false,
        captionEvidenceAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(publicationResultSchema.parse({
        ...payload,
        resultDigestSha256: visualIntelligenceDigest(payload),
      }))
    },
  })
}

export function createVisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort(
  input: {
    readonly approvalRepository:
      VisualIntelligenceModelBillingSkuInternalSpendApprovalRepository
    readonly now?: () => Date
  },
): VisualIntelligenceModelBillingSkuLiveAdmissionAuthorityVerificationPort {
  if (
    !input.approvalRepository
    || typeof input.approvalRepository.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence admission authority verifier is not configured.',
  )
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async verifyAndRereadExact(
      untrustedAdmission: VisualIntelligenceModelBillingSkuLiveAdmission,
    ) {
      const admission = parseVisualIntelligenceModelBillingSkuLiveAdmission(
        untrustedAdmission,
      )
      const approvalRaw = await input.approvalRepository.readExact(
        admission.internalSpendApprovalRef,
      )
      if (!approvalRaw) return false
      const approval =
        parseVisualIntelligenceModelBillingSkuInternalSpendApproval(
          approvalRaw,
        )
      const observedAt = now().getTime()
      return (
        Number.isFinite(observedAt)
        && observedAt >= Date.parse(approval.approvedAtIso)
        && observedAt < Date.parse(approval.expiresAtIso)
        && approval.qualificationId === admission.qualificationId
        && approval.qualificationVersion === admission.qualificationVersion
        && sameRef(
          visualIntelligenceModelBillingSkuInternalSpendApprovalRef(approval),
          admission.internalSpendApprovalRef,
        )
        && sameRef(
          approval.approvedSourceReleaseRef,
          admission.approvedSourceReleaseRef,
        )
        && sameRef(
          approval.providerRouteRegistryRef,
          admission.providerRouteRegistryRef,
        )
        && approval.approvedAtIso === admission.approvedAtIso
        && approval.expiresAtIso === admission.expiresAtIso
        && approval.maximumProviderRequestCount
          === admission.maximumProviderRequestCount
        && approval.maximumTotalPromptTokens
          === admission.maximumTotalPromptTokens
        && approval.maximumTotalOutputAndThinkingTokens
          === admission.maximumTotalOutputAndThinkingTokens
        && approval.operatorApprovedMaximumSpendUsdMicros
          === admission.maximumInternalProviderSpendUsdMicros
        && approval.currentProcessExplicitConfirmationObserved
        && approval.canonicalServicePrincipalEmail
          === 'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
        && approval.canonicalServiceIdentityVerified
        && approval.singleUseAdmissionOnly
        && !approval.automaticProviderRetryAllowed
        && !approval.customerPricingOrServiceFeeAuthorityGranted
        && !approval.customerCreditOrWalletMutationAuthorityGranted
        && !approval.captionEvidenceAuthorityGranted
        && !approval.productionReleaseAuthorityGranted
      )
    },
  })
}

const publicationInputSchema = z.object({
  authorizationId: safeId,
  authorizationVersion: positiveInteger,
  qualificationId: safeId,
  qualificationVersion: positiveInteger,
  issuedAtIso: timestamp,
  expiresAtIso: timestamp,
  maximumInternalProviderSpendUsdMicros: positiveInteger
    .max(MAXIMUM_INTERNAL_SPEND_USD_MICROS),
  providerPrincipalEmail: z.literal(
    'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
  ),
  currentProcessExplicitConfirmationObserved: z.literal(true),
  runtimeRelease: z.custom<VisualIntelligenceRuntimeRelease>(
    (value) => Boolean(value && typeof value === 'object'),
  ),
}).strict()

function routeRegistry(
  approvedSourceReleaseRef: VisualIntelligenceEvidenceRef,
): VisualIntelligenceCanonicalProviderRouteRegistry {
  return createControlledVisualIntelligenceCanonicalProviderRouteRegistry({
    schemaVersion: 'visual-intelligence-canonical-provider-route-registry-v1',
    registryId: `vi-provider-route-registry-${
      visualIntelligenceDigest({
        approvedSourceReleaseRef,
        qualificationOwnerVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
      }).slice(7, 31)}`,
    registryVersion: 1,
    evidenceClass:
      'exact_shared_visual_intelligence_provider_route_and_guard_registry',
    projectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    vertexLocation: 'global',
    throughputClass: 'standard',
    routes: [
      {
        routeClass: 'ordinary_visual_intelligence_request',
        ownerVersion: 'visual-intelligence-production-runtime-v19',
        providerAdapterVersion:
          'vertex-gemini-pro-visual-intelligence-adapter-v4',
        providerTrafficGuardVersion:
          'visual-intelligence-provider-traffic-guard-v1',
        providerTrafficGuardRequiredBeforeEveryProviderCall: true,
        directProviderCallOutsideGuardAllowed: false,
      },
      {
        routeClass: 'model_billing_sku_qualification',
        ownerVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTOR_VERSION,
        providerAdapterVersion:
          'vertex-gemini-pro-visual-intelligence-adapter-v4',
        providerTrafficGuardVersion:
          'visual-intelligence-provider-traffic-guard-v1',
        providerTrafficGuardRequiredBeforeEveryProviderCall: true,
        directProviderCallOutsideGuardAllowed: false,
      },
    ],
    allCanonicalProviderRoutesEnumerated: true,
    allCanonicalProviderRoutesUseOneSharedGuard: true,
    nonCanonicalProviderCredentialMountPresent: false,
    exactSourceAndDeploymentBindingsReread: true,
    callerAuthoredRouteClaimAccepted: false,
    providerCallMadeByRegistryReader: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

function buildAdmission(input: {
  requested: z.infer<typeof publicationInputSchema>
  approvedSourceReleaseRef: VisualIntelligenceEvidenceRef
  internalSpendApprovalRef: VisualIntelligenceEvidenceRef
  providerRouteRegistryRef: VisualIntelligenceEvidenceRef
}): VisualIntelligenceModelBillingSkuLiveAdmission {
  return createVisualIntelligenceModelBillingSkuLiveAdmission({
    schemaVersion: VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION,
    admissionId: `vi-model-sku-live-admission-${
      visualIntelligenceDigest({
        authorizationId: input.requested.authorizationId,
        authorizationVersion: input.requested.authorizationVersion,
        qualificationId: input.requested.qualificationId,
        qualificationVersion: input.requested.qualificationVersion,
      }).slice(7, 31)}`,
    admissionVersion: 1,
    qualificationId: input.requested.qualificationId,
    qualificationVersion: input.requested.qualificationVersion,
    evidenceClass:
      'explicit_single_use_internal_paid_provider_qualification_admission',
    projectId: 'reeditpro',
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    vertexLocation: 'global',
    throughputClass: 'standard',
    providerServiceId: 'services/C7E2-9256-1C43',
    internalSpendApprovalRef: input.internalSpendApprovalRef,
    approvedSourceReleaseRef: input.approvedSourceReleaseRef,
    providerRouteRegistryRef: input.providerRouteRegistryRef,
    approvedAtIso: input.requested.issuedAtIso,
    expiresAtIso: input.requested.expiresAtIso,
    maximumProviderRequestCount: MAXIMUM_PROVIDER_REQUEST_COUNT,
    maximumTotalPromptTokens: MAXIMUM_TOTAL_PROMPT_TOKENS,
    maximumTotalOutputAndThinkingTokens:
      MAXIMUM_TOTAL_OUTPUT_AND_THINKING_TOKENS,
    maximumInternalProviderSpendUsdMicros:
      input.requested.maximumInternalProviderSpendUsdMicros,
    exactStandardAndLongImplicitCachePairsApproved: true,
    operatorApprovedPaidProviderExecution: true,
    singleUseAdmission: true,
    automaticProviderRetryAllowed: false,
    providerToolsAllowed: false,
    groundingAllowed: false,
    urlContextAllowed: false,
    codeExecutionAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    customerCreditOrWalletMutationAuthorityGranted: false,
    captionEvidenceAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
}

function validateTimeWindow(
  value: z.infer<typeof publicationInputSchema>,
  observedAt: Date,
): void {
  const nowMs = observedAt.getTime()
  const issuedAt = Date.parse(value.issuedAtIso)
  const expiresAt = Date.parse(value.expiresAtIso)
  if (
    !Number.isFinite(nowMs)
    || issuedAt > nowMs
    || nowMs - issuedAt > MAXIMUM_ISSUED_AT_SKEW_MS
    || expiresAt <= nowMs
    || expiresAt - issuedAt > MAXIMUM_ADMISSION_AGE_MS
  ) throw new Error(
    'Visual Intelligence live qualification authorization is stale.',
  )
}

function validateCostPreflight(input: {
  costPreflight: VisualIntelligenceCostPreflight
  configuredRateRef: VisualIntelligenceEvidenceRef
  operatorCap: number
}): void {
  const preflight = input.costPreflight
  if (
    preflight.currency !== 'USD'
    || !preflight.preflightPassed
    || preflight.serviceFeeIncluded
    || preflight.publicListPriceUsedAsSettlementAuthority
    || preflight.maximumAuthorizedCostMicros < 1
    || preflight.maximumAuthorizedCostMicros > input.operatorCap
    || preflight.estimatedMaximumCostMicros
      > preflight.maximumAuthorizedCostMicros
    || !sameRef(
      preflight.accountEffectiveRateAuthorityRef,
      input.configuredRateRef,
    )
  ) throw new Error(
    'Visual Intelligence live qualification cost preflight is invalid.',
  )
}

function assertDependencies(dependencies: {
  costPreflightOwner: VisualIntelligenceModelBillingSkuCostPreflightOwner
  approvalRepository:
    VisualIntelligenceModelBillingSkuInternalSpendApprovalRepository
  liveStore: VisualIntelligenceModelBillingSkuLiveGcsStore
}): void {
  if (
    !dependencies.costPreflightOwner
    || typeof dependencies.costPreflightOwner.createPreflight !== 'function'
    || !dependencies.approvalRepository
    || typeof dependencies.approvalRepository.persistCreateOnly !== 'function'
    || typeof dependencies.approvalRepository.readExact !== 'function'
    || !dependencies.liveStore
    || typeof dependencies.liveStore.persistAdmissionCreateOnly !== 'function'
    || typeof dependencies.liveStore.persistRouteRegistryCreateOnly !== 'function'
    || typeof dependencies.liveStore.admissionReadPort?.readExact !== 'function'
    || typeof dependencies.liveStore.routeRegistryReadPort?.readExact
      !== 'function'
  ) throw new Error(
    'Visual Intelligence live qualification admission owner is not configured.',
  )
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw new Error(
    'Visual Intelligence internal spend approval repository is not configured.',
  )
}

function objectPath(
  prefix: string,
  reference: VisualIntelligenceEvidenceRef,
): string {
  return `${prefix}/${reference.contentHash.slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (
    !prefix
    || prefix.length > 700
    || prefix.includes('..')
    || prefix.includes('\\')
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(prefix)
  ) throw new Error(
    'Visual Intelligence internal spend approval prefix is invalid.',
  )
  return prefix
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(reference: VisualIntelligenceEvidenceRef): string {
  const parsed = evidenceRefSchema.parse(reference)
  return `${parsed.id}:${parsed.version}:${parsed.contentHash}`
}

function rawDigest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_SOURCE_RECEIPT =
  Object.freeze({
    ownerVersion:
      VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_VERSION,
    approvalVersion:
      VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_INTERNAL_SPEND_APPROVAL_VERSION,
    admissionVersion:
      VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION,
    rateAuthorityVersion:
      VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION,
    providerCallMade: false as const,
    providerDispatchGranted: false as const,
    customerCreditOrWalletMutationAuthorityGranted: false as const,
    productionReleaseAuthorityGranted: false as const,
    receiptRef: createVisualIntelligenceEvidenceRef(
      'visual-intelligence-model-billing-sku-live-admission-owner-source-receipt',
      {
        ownerVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_OWNER_VERSION,
        approvalVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_INTERNAL_SPEND_APPROVAL_VERSION,
        admissionVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_ADMISSION_VERSION,
        rateAuthorityVersion:
          VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION,
      },
    ),
  })
