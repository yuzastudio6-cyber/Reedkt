import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt,
  visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef,
  type VisualIntelligenceDetailedBillingExportObservationRepository,
} from './visual-intelligence-detailed-billing-export-observation-repository'
import {
  parseVisualIntelligenceDetailedBillingExportObservation,
  visualIntelligenceDetailedBillingExportObservationRef,
  type VisualIntelligenceDetailedBillingExportReadPort,
} from './visual-intelligence-detailed-billing-export-read-port'
import {
  parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult,
  type VisualIntelligenceModelBillingSkuQualificationFinalizationResult,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  parseVisualIntelligenceModelBillingSkuLiveAdmission,
  parseVisualIntelligenceModelBillingSkuLiveResult,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  visualIntelligenceModelBillingSkuLiveResultRef,
  type VisualIntelligenceModelBillingSkuLiveAdmissionReadPort,
  type VisualIntelligenceModelBillingSkuLiveResultRepository,
} from './visual-intelligence-model-billing-sku-live-executor'
import {
  parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef,
  type VisualIntelligenceProviderAuditWindowObservationRepository,
} from './visual-intelligence-provider-audit-window-observation-repository'
import {
  parseVisualIntelligenceProviderAuditWindowObservation,
  visualIntelligenceProviderAuditWindowObservationRef,
  type VisualIntelligenceProviderAuditWindowReadPort,
} from './visual-intelligence-provider-audit-window-read-port'
import {
  parseVisualIntelligenceProviderTrafficGuardReleaseReceipt,
  visualIntelligenceProviderTrafficGuardReleaseReceiptRef,
  type VisualIntelligenceProviderTrafficGuardEvidenceReadPort,
} from './visual-intelligence-provider-traffic-guard'
import {
  parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult,
  type VisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult,
} from './visual-intelligence-provider-traffic-isolation-authority-finalizer'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_SERVICE_VERSION =
  'visual-intelligence-model-billing-sku-reconciliation-service-v1' as const
export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_RESULT_VERSION =
  'visual-intelligence-model-billing-sku-reconciliation-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_RESULT_VERSION,
  ),
  serviceVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_SERVICE_VERSION,
  ),
  resultId: safeId,
  resultVersion: positiveInteger,
  evidenceClass: z.literal(
    'post_execution_cloud_audit_billing_spend_and_model_sku_reconciliation',
  ),
  admissionRef: evidenceRefSchema,
  liveExecutionResultRef: evidenceRefSchema,
  providerGuardReleaseReceiptRef: evidenceRefSchema,
  cloudAuditObservationRef: evidenceRefSchema,
  cloudAuditPublicationReceiptRef: evidenceRefSchema,
  providerTrafficIsolationAuthorityRef: evidenceRefSchema,
  billingObservationRef: evidenceRefSchema,
  billingObservationPublicationReceiptRef: evidenceRefSchema,
  modelBillingSkuQualificationRef: evidenceRefSchema,
  actualProviderSpendUsdMicros: nonnegativeInteger.max(50_000_000),
  admittedMaximumProviderSpendUsdMicros: positiveInteger.max(50_000_000),
  actualProviderSpendWithinAdmission: z.literal(true),
  exactLiveExecutionResultReread: z.literal(true),
  exactAdmissionReread: z.literal(true),
  exactGuardReleaseReread: z.literal(true),
  projectWideCloudAuditQueriedAndPersisted: z.literal(true),
  providerTrafficIsolationFinalizedAndReread: z.literal(true),
  detailedBillingExportQueriedAndPersisted: z.literal(true),
  modelBillingSkuQualificationFinalizedAndReread: z.literal(true),
  rawProviderPayloadPersisted: z.literal(false),
  automaticProviderRetryAllowed: z.literal(false),
  providerCallMadeByReconciliationService: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  captionEvidenceAuthorityGranted: z.literal(false),
  runtimeReleaseAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.actualProviderSpendUsdMicros
      > value.admittedMaximumProviderSpendUsdMicros
    || new Set([
      value.admissionRef,
      value.liveExecutionResultRef,
      value.providerGuardReleaseReceiptRef,
      value.cloudAuditObservationRef,
      value.cloudAuditPublicationReceiptRef,
      value.providerTrafficIsolationAuthorityRef,
      value.billingObservationRef,
      value.billingObservationPublicationReceiptRef,
      value.modelBillingSkuQualificationRef,
    ].map(refKey)).size !== 9
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence reconciliation result is inconsistent.',
  })
})

const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingSkuReconciliationResult =
  z.infer<typeof resultSchema>

interface IsolationFinalizerPort {
  finalize(input: {
    readonly authorityId: string
    readonly authorityVersion: number
    readonly qualificationOwnerId: string
    readonly standardContextEvidenceRef: VisualIntelligenceEvidenceRef
    readonly longContextEvidenceRef: VisualIntelligenceEvidenceRef
    readonly providerGuardReleaseReceiptRef: VisualIntelligenceEvidenceRef
    readonly cloudAuditWindowObservationPublicationReceipt: unknown
    readonly cloudAuditWindowObservationPublicationReceiptRef:
      VisualIntelligenceEvidenceRef
    readonly canonicalProviderRouteRegistryRef: VisualIntelligenceEvidenceRef
  }): Promise<VisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult>
}

interface QualificationFinalizerPort {
  finalize(input: {
    readonly qualificationId: string
    readonly qualificationVersion: number
    readonly standardContextEvidenceRef: VisualIntelligenceEvidenceRef
    readonly longContextEvidenceRef: VisualIntelligenceEvidenceRef
    readonly billingObservationPublicationReceipt: unknown
    readonly billingObservationPublicationReceiptRef:
      VisualIntelligenceEvidenceRef
    readonly providerTrafficIsolationAuthorityRef:
      VisualIntelligenceEvidenceRef
  }): Promise<VisualIntelligenceModelBillingSkuQualificationFinalizationResult>
}

/**
 * Post-execution one-writer coordinator. It performs only canonical read and
 * reconciliation stages after the bounded live executor has already stopped.
 * It cannot call Gemini, retry provider work, mutate customer credits, or
 * release runtime/Caption/production authority.
 */
export function createVisualIntelligenceModelBillingSkuReconciliationService(
  dependencies: {
    readonly admissionReadPort:
      VisualIntelligenceModelBillingSkuLiveAdmissionReadPort
    readonly liveResultRepository:
      VisualIntelligenceModelBillingSkuLiveResultRepository
    readonly providerGuardEvidenceReadPort:
      VisualIntelligenceProviderTrafficGuardEvidenceReadPort
    readonly providerAuditReadPort:
      VisualIntelligenceProviderAuditWindowReadPort
    readonly providerAuditObservationRepository:
      VisualIntelligenceProviderAuditWindowObservationRepository
    readonly isolationFinalizer: IsolationFinalizerPort
    readonly billingExportReadPort:
      VisualIntelligenceDetailedBillingExportReadPort
    readonly billingObservationRepository:
      VisualIntelligenceDetailedBillingExportObservationRepository
    readonly qualificationFinalizer: QualificationFinalizerPort
  },
) {
  validateDependencies(dependencies)
  return Object.freeze({
    async reconcile(untrusted: {
      readonly admissionRef: VisualIntelligenceEvidenceRef
      readonly liveExecutionResultRef: VisualIntelligenceEvidenceRef
    }): Promise<VisualIntelligenceModelBillingSkuReconciliationResult> {
      const input = z.object({
        admissionRef: evidenceRefSchema,
        liveExecutionResultRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      const [admissionRaw, liveResultRaw] = await Promise.all([
        dependencies.admissionReadPort.readExact(input.admissionRef),
        dependencies.liveResultRepository.readExact(
          input.liveExecutionResultRef,
        ),
      ])
      if (!admissionRaw || !liveResultRaw) throw new Error(
        'Visual Intelligence reconciliation source evidence is missing.',
      )
      const admission = parseVisualIntelligenceModelBillingSkuLiveAdmission(
        admissionRaw,
      )
      const liveResult = parseVisualIntelligenceModelBillingSkuLiveResult(
        liveResultRaw,
      )
      validateLiveLineage({ input, admission, liveResult })
      const releaseRaw = await dependencies.providerGuardEvidenceReadPort
        .readExactReleaseReceipt(liveResult.providerGuardReleaseReceiptRef)
      if (!releaseRaw) throw new Error(
        'Visual Intelligence reconciliation guard release is missing.',
      )
      const release = parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(
        releaseRaw,
      )
      if (
        release.mode !== 'model_billing_sku_qualification'
        || release.ownerId !== liveResult.qualificationId
        || !sameRef(
          visualIntelligenceProviderTrafficGuardReleaseReceiptRef(release),
          liveResult.providerGuardReleaseReceiptRef,
        )
        || !sameRef(release.leaseRef, liveResult.providerGuardLeaseRef)
      ) throw new Error(
        'Visual Intelligence reconciliation guard lineage changed.',
      )

      const auditObservation =
        parseVisualIntelligenceProviderAuditWindowObservation(
          await dependencies.providerAuditReadPort.readExact({
            observationId: `${liveResult.qualificationId}.audit-window`,
            observationVersion: liveResult.qualificationVersion,
            qualificationWindowStartedAtIso: release.acquiredAtIso,
            qualificationWindowFinishedAtIso: release.releasedAtIso,
            exactOrderedProviderRequestRefs: exactFour(
              liveResult.exactOrderedProviderRequestRefs,
            ),
          }),
        )
      const auditReceipt =
        parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
          await dependencies.providerAuditObservationRepository
            .persistCreateOnly(auditObservation),
        )
      const auditObservationRef =
        visualIntelligenceProviderAuditWindowObservationRef(auditObservation)
      const auditReceiptRef =
        visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef(
          auditReceipt,
        )
      if (!sameRef(auditReceipt.observationRef, auditObservationRef)) {
        throw new Error(
          'Visual Intelligence reconciliation audit persistence changed.',
        )
      }

      const isolationResult =
        parseVisualIntelligenceProviderTrafficIsolationAuthorityFinalizationResult(
          await dependencies.isolationFinalizer.finalize({
            authorityId: `${liveResult.qualificationId}.isolation-authority`,
            authorityVersion: liveResult.qualificationVersion,
            qualificationOwnerId: liveResult.qualificationId,
            standardContextEvidenceRef:
              liveResult.standardContextEvidenceRef,
            longContextEvidenceRef: liveResult.longContextEvidenceRef,
            providerGuardReleaseReceiptRef:
              liveResult.providerGuardReleaseReceiptRef,
            cloudAuditWindowObservationPublicationReceipt: auditReceipt,
            cloudAuditWindowObservationPublicationReceiptRef: auditReceiptRef,
            canonicalProviderRouteRegistryRef:
              liveResult.providerRouteRegistryRef,
          }),
        )
      if (
        isolationResult.noOtherModelOrSkuTrafficVerified !== true
        || isolationResult.providerCallMadeByFinalizer !== false
      ) throw new Error(
        'Visual Intelligence reconciliation isolation was not admitted.',
      )

      const billingObservation =
        parseVisualIntelligenceDetailedBillingExportObservation(
          await dependencies.billingExportReadPort.readExact({
            observationId: `${liveResult.qualificationId}.billing-window`,
            observationVersion: liveResult.qualificationVersion,
            qualificationWindowStartedAtIso: release.acquiredAtIso,
            qualificationWindowFinishedAtIso: release.releasedAtIso,
          }),
        )
      const billingReceipt =
        parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt(
          await dependencies.billingObservationRepository.persistCreateOnly(
            billingObservation,
          ),
        )
      const billingObservationRef =
        visualIntelligenceDetailedBillingExportObservationRef(
          billingObservation,
        )
      const billingReceiptRef =
        visualIntelligenceDetailedBillingExportObservationPublicationReceiptRef(
          billingReceipt,
        )
      if (!sameRef(billingReceipt.observationRef, billingObservationRef)) {
        throw new Error(
          'Visual Intelligence reconciliation billing persistence changed.',
        )
      }
      const actualProviderSpendUsdMicros = conservativeUsdMicros(
        billingObservation.skuLines,
      )
      if (
        actualProviderSpendUsdMicros
          > admission.maximumInternalProviderSpendUsdMicros
      ) throw new Error(
        'Visual Intelligence reconciliation exceeded admitted internal spend.',
      )

      const qualificationResult =
        parseVisualIntelligenceModelBillingSkuQualificationFinalizationResult(
          await dependencies.qualificationFinalizer.finalize({
            qualificationId: liveResult.qualificationId,
            qualificationVersion: liveResult.qualificationVersion,
            standardContextEvidenceRef:
              liveResult.standardContextEvidenceRef,
            longContextEvidenceRef: liveResult.longContextEvidenceRef,
            billingObservationPublicationReceipt: billingReceipt,
            billingObservationPublicationReceiptRef: billingReceiptRef,
            providerTrafficIsolationAuthorityRef:
              isolationResult.isolationAuthorityRef,
          }),
        )
      if (
        qualificationResult.providerCallMadeByFinalizer !== false
        || qualificationResult.billingExportQueriedByFinalizer !== false
        || qualificationResult.runtimeReleaseAuthorityGranted !== false
      ) throw new Error(
        'Visual Intelligence reconciliation qualification was not admitted.',
      )

      const payload = resultWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_RESULT_VERSION,
        serviceVersion:
          VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_RECONCILIATION_SERVICE_VERSION,
        resultId: `${liveResult.qualificationId}.reconciliation`,
        resultVersion: liveResult.qualificationVersion,
        evidenceClass:
          'post_execution_cloud_audit_billing_spend_and_model_sku_reconciliation',
        admissionRef: input.admissionRef,
        liveExecutionResultRef: input.liveExecutionResultRef,
        providerGuardReleaseReceiptRef:
          liveResult.providerGuardReleaseReceiptRef,
        cloudAuditObservationRef: auditObservationRef,
        cloudAuditPublicationReceiptRef: auditReceiptRef,
        providerTrafficIsolationAuthorityRef:
          isolationResult.isolationAuthorityRef,
        billingObservationRef,
        billingObservationPublicationReceiptRef: billingReceiptRef,
        modelBillingSkuQualificationRef: qualificationResult.qualificationRef,
        actualProviderSpendUsdMicros,
        admittedMaximumProviderSpendUsdMicros:
          admission.maximumInternalProviderSpendUsdMicros,
        actualProviderSpendWithinAdmission: true,
        exactLiveExecutionResultReread: true,
        exactAdmissionReread: true,
        exactGuardReleaseReread: true,
        projectWideCloudAuditQueriedAndPersisted: true,
        providerTrafficIsolationFinalizedAndReread: true,
        detailedBillingExportQueriedAndPersisted: true,
        modelBillingSkuQualificationFinalizedAndReread: true,
        rawProviderPayloadPersisted: false,
        automaticProviderRetryAllowed: false,
        providerCallMadeByReconciliationService: false,
        providerDispatchAuthorityGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        customerCreditOrWalletMutationAuthorityGranted: false,
        captionEvidenceAuthorityGranted: false,
        runtimeReleaseAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(resultSchema.parse({
        ...payload,
        resultDigestSha256: visualIntelligenceDigest(payload),
      }))
    },
  })
}

export function parseVisualIntelligenceModelBillingSkuReconciliationResult(
  value: unknown,
): VisualIntelligenceModelBillingSkuReconciliationResult {
  const result = resultSchema.parse(value)
  const payload = { ...result }
  Reflect.deleteProperty(payload, 'resultDigestSha256')
  if (result.resultDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error('Visual Intelligence reconciliation result is invalid.')
  }
  return Object.freeze(result)
}

function validateLiveLineage(input: {
  input: {
    admissionRef: VisualIntelligenceEvidenceRef
    liveExecutionResultRef: VisualIntelligenceEvidenceRef
  }
  admission: ReturnType<
    typeof parseVisualIntelligenceModelBillingSkuLiveAdmission
  >
  liveResult: ReturnType<
    typeof parseVisualIntelligenceModelBillingSkuLiveResult
  >
}): void {
  if (
    !sameRef(
      visualIntelligenceModelBillingSkuLiveAdmissionRef(input.admission),
      input.input.admissionRef,
    )
    || !sameRef(
      visualIntelligenceModelBillingSkuLiveResultRef(input.liveResult),
      input.input.liveExecutionResultRef,
    )
    || !sameRef(input.liveResult.admissionRef, input.input.admissionRef)
    || input.liveResult.qualificationId !== input.admission.qualificationId
    || input.liveResult.qualificationVersion
      !== input.admission.qualificationVersion
    || !sameRef(
      input.liveResult.providerRouteRegistryRef,
      input.admission.providerRouteRegistryRef,
    )
    || input.liveResult.providerRequestCount !== 4
    || input.liveResult.actualProviderSpendReconciliationPending !== true
    || input.liveResult.cloudAuditWindowReconciliationPending !== true
    || input.liveResult.detailedBillingExportReconciliationPending !== true
    || input.liveResult.modelBillingSkuQualificationGranted !== false
  ) throw new Error(
    'Visual Intelligence reconciliation live lineage changed.',
  )
}

function exactFour(
  value: readonly VisualIntelligenceEvidenceRef[],
): readonly [
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceEvidenceRef,
] {
  if (value.length !== 4) throw new Error(
    'Visual Intelligence reconciliation request set is incomplete.',
  )
  return [value[0]!, value[1]!, value[2]!, value[3]!]
}

function conservativeUsdMicros(
  lines: readonly { cost: string; currency: string }[],
): number {
  let total = 0n
  for (const line of lines) {
    if (line.currency !== 'USD' || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u
      .test(line.cost)) throw new Error(
      'Visual Intelligence reconciliation billing currency or cost is invalid.',
    )
    const [whole = '0', fraction = ''] = line.cost.split('.')
    const padded = `${fraction}000000`.slice(0, 6)
    const remainder = fraction.slice(6)
    total += BigInt(whole) * 1_000_000n + BigInt(padded)
      + (/[1-9]/u.test(remainder) ? 1n : 0n)
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(
    'Visual Intelligence reconciliation billing cost exceeded its bound.',
  )
  return Number(total)
}

function validateDependencies(dependencies: {
  admissionReadPort: VisualIntelligenceModelBillingSkuLiveAdmissionReadPort
  liveResultRepository: VisualIntelligenceModelBillingSkuLiveResultRepository
  providerGuardEvidenceReadPort:
    VisualIntelligenceProviderTrafficGuardEvidenceReadPort
  providerAuditReadPort: VisualIntelligenceProviderAuditWindowReadPort
  providerAuditObservationRepository:
    VisualIntelligenceProviderAuditWindowObservationRepository
  isolationFinalizer: IsolationFinalizerPort
  billingExportReadPort: VisualIntelligenceDetailedBillingExportReadPort
  billingObservationRepository:
    VisualIntelligenceDetailedBillingExportObservationRepository
  qualificationFinalizer: QualificationFinalizerPort
}): void {
  const required = [
    dependencies.admissionReadPort?.readExact,
    dependencies.liveResultRepository?.readExact,
    dependencies.providerGuardEvidenceReadPort?.readExactReleaseReceipt,
    dependencies.providerAuditReadPort?.readExact,
    dependencies.providerAuditObservationRepository?.persistCreateOnly,
    dependencies.isolationFinalizer?.finalize,
    dependencies.billingExportReadPort?.readExact,
    dependencies.billingObservationRepository?.persistCreateOnly,
    dependencies.qualificationFinalizer?.finalize,
  ]
  if (required.some((candidate) => typeof candidate !== 'function')) {
    throw new Error(
      'Visual Intelligence reconciliation service is not configured.',
    )
  }
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

export function visualIntelligenceModelBillingSkuReconciliationResultJson(
  value: VisualIntelligenceModelBillingSkuReconciliationResult,
): string {
  return visualIntelligenceCanonicalJson(
    parseVisualIntelligenceModelBillingSkuReconciliationResult(value),
  )
}
