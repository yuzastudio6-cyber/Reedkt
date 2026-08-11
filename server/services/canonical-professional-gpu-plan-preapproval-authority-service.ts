import { z } from 'zod'

import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
} from '../edit-architecture/canonical-quality-first-professional-tool-gpu-placement'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  ALL_PROFESSIONAL_TOOL_CATALOG_IDS,
  getKnownProfessionalToolCatalogProfile,
} from '../tool-registry'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
  type CanonicalProfessionalGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import {
  assertCanonicalProfessionalToolGpuCostEstimate,
  calculateCanonicalProfessionalToolGpuCost,
  canonicalProfessionalToolGpuCostEstimateSchema,
  canonicalProfessionalToolGpuCostCalculationSchema,
  canonicalProfessionalToolGpuUsageSchema,
  createCanonicalProfessionalToolGpuCostEstimateFromCalculation,
  modelOrOperationCostProfileForTool,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalPlanComponentsSchema,
  canonicalWorkItemSchema,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_BASIS_VERSION =
  'canonical-professional-gpu-plan-pricing-basis-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLAN_USAGE_QUOTE_VERSION =
  'canonical-professional-gpu-plan-usage-quote-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLAN_PREAPPROVAL_MANIFEST_VERSION =
  'canonical-professional-gpu-plan-preapproval-manifest-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLAN_PUBLICATION_BINDING_VERSION =
  'canonical-professional-gpu-plan-publication-binding-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_PLAN_DISPATCH_ESTIMATE_SET_VERSION =
  'canonical-professional-gpu-plan-dispatch-estimate-set-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeText = z.string().trim().min(1).max(500)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const timestamp = z.string().datetime({ offset: true })
const toolIdSchema = z.enum(ALL_PROFESSIONAL_TOOL_CATALOG_IDS)
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])

const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const workloadWithoutDigestSchema = z.object({
  workloadClass: z.enum([
    'source_video',
    'source_audio',
    'frame_or_image_set',
    'render_or_transcode',
    'structured_gpu_operation',
  ]),
  inputByteLength: positiveInteger,
  sourceDurationMilliseconds: nonnegativeInteger,
  sourceFrameCount: nonnegativeInteger,
  sourcePixelCount: nonnegativeInteger,
  outputFrameCount: nonnegativeInteger,
  outputPixelCount: nonnegativeInteger,
  subjectAssetOrTrackCount: positiveInteger.max(4_096),
}).strict()

const workloadSchema = workloadWithoutDigestSchema.extend({
  workloadDigestSha256: sha256,
}).strict().superRefine((workload, context) => {
  const payload = { ...workload }
  Reflect.deleteProperty(payload, 'workloadDigestSha256')
  if (workload.workloadDigestSha256 !== sha256AuthorityValue(payload)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU plan-pricing workload digest is invalid.',
    })
  }
})

const usageRangeSchema = z.object({
  low: canonicalProfessionalToolGpuUsageSchema,
  expected: canonicalProfessionalToolGpuUsageSchema,
  high: canonicalProfessionalToolGpuUsageSchema,
}).strict().superRefine((range, context) => {
  const points = [range.low, range.expected, range.high]
  const ordered = points.every((point, index) => index === 0
    || point.totalBillableMilliseconds >=
      points[index - 1]!.totalBillableMilliseconds)
  const oneAllocation = points.every((point) =>
    point.allocatedGpuCount === range.low.allocatedGpuCount
    && point.allocatedVcpuCount === range.low.allocatedVcpuCount
    && point.allocatedMemoryGiB === range.low.allocatedMemoryGiB
    && point.allocatedLocalScratchGiB ===
      range.low.allocatedLocalScratchGiB)
  if (!ordered || !oneAllocation) context.addIssue({
    code: 'custom',
    message: 'GPU plan-pricing usage range is invalid.',
  })
})

const basisScopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  planningRequestId: safeId,
  outputId: safeId,
}).strict()

const confirmedOutputFrameBindingSchema = z.object({
  outputFrameRef: evidenceRefSchema,
  outputId: safeId,
  aspectRatio: z.string().trim().min(1).max(32),
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  fps: z.number().positive().finite().max(240),
}).strict()

const placementRefSchema = z.object({
  schemaVersion: z.literal(
    'canonical-quality-first-professional-tool-gpu-placement-v1',
  ),
  policyHash: sha256,
  entryHash: sha256,
}).strict()

const pricingUnitWithoutHashSchema = z.object({
  workItemKey: safeId,
  workItemType: safeId,
  workerClass: safeId,
  required: z.boolean(),
  toolId: toolIdSchema,
  operationId: safeId,
  operationAuthorityDisposition: z.enum([
    'canonical_production_operation_registered',
    'sam3_1_candidate_operation_release_qualification_pending',
  ]),
  workItemPricingStructureDigestSha256: sha256,
  expectedOutputsDigestSha256: sha256,
  dependencyKeys: z.array(safeId).max(128),
  maxAttempts: positiveInteger.max(10),
  attemptTimeoutSeconds: positiveInteger.max(14_400),
  exactToolOrModelReleaseRef: evidenceRefSchema,
  workload: workloadSchema,
  placementPolicyRef: placementRefSchema,
}).strict()

const pricingUnitSchema = pricingUnitWithoutHashSchema.extend({
  pricingUnitHash: sha256,
}).strict().superRefine((unit, context) => {
  const payload = { ...unit }
  Reflect.deleteProperty(payload, 'pricingUnitHash')
  if (unit.pricingUnitHash !== sha256AuthorityValue(payload)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU pricing-unit hash is invalid.',
    })
  }
})

const nonpricedToolUnitSchema = z.object({
  workItemKey: safeId,
  workItemType: safeId,
  workerClass: safeId,
  toolId: toolIdSchema,
  operationId: safeId,
  workItemPricingStructureDigestSha256: sha256,
  disposition: z.enum([
    'control_plane_only_no_tool_charge',
    'l4_colocated_helper_included_in_parent_attempt',
  ]),
  parentGpuWorkItemKey: safeId.nullable(),
}).strict()

const basisWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_BASIS_VERSION,
  ),
  source: z.literal(
    'canonical_server_preapproval_gpu_plan_pricing_basis_compiler',
  ),
  scope: basisScopeSchema,
  canonicalPlanSchemaVersion: z.literal('private-edit-authority-plan-v2'),
  canonicalPlanComponentsDigestSha256: sha256,
  confirmedSettingsDigestSha256: sha256,
  masterTimingDigestSha256: sha256,
  sourceSequenceDigestSha256: sha256,
  sourceCleanupPlanDigestSha256: sha256,
  toolStrategyPlanDigestSha256: sha256,
  rendererPlanDigestSha256: sha256,
  qaPlanDigestSha256: sha256,
  confirmedOutputFrame: confirmedOutputFrameBindingSchema,
  canonicalWorkGraphPricingStructureDigestSha256: sha256,
  pricingUnits: z.array(pricingUnitSchema).max(256),
  nonpricedToolUnits: z.array(nonpricedToolUnitSchema).max(256),
  toolFreeWorkItemKeys: z.array(safeId).max(256),
  totalCanonicalWorkItemCount: positiveInteger.max(256),
  exactAtomicToolOperationBindings: z.literal(true),
  maximumCreditBudgetExcludedFromPricingBasis: z.literal(true),
  callerRateUsageDurationOrPriceAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  customerEstimateMutated: z.literal(false),
  approvalGranted: z.literal(false),
  creditReservationCreated: z.literal(false),
  runtimeAdmissionGranted: z.literal(false),
}).strict().superRefine((basis, context) => {
  const ordered = <T extends { workItemKey: string }>(values: readonly T[]) =>
    values.every((value, index) => index === 0
      || values[index - 1]!.workItemKey < value.workItemKey)
  const allKeys = [
    ...basis.pricingUnits.map((unit) => unit.workItemKey),
    ...basis.nonpricedToolUnits.map((unit) => unit.workItemKey),
    ...basis.toolFreeWorkItemKeys,
  ]
  if (
    basis.confirmedOutputFrame.outputId !== basis.scope.outputId
    || basis.pricingUnits.length === 0
    || !ordered(basis.pricingUnits)
    || !ordered(basis.nonpricedToolUnits)
    || basis.toolFreeWorkItemKeys.some((key, index) =>
      index > 0 && basis.toolFreeWorkItemKeys[index - 1]! >= key)
    || new Set(allKeys).size !== allKeys.length
    || allKeys.length !== basis.totalCanonicalWorkItemCount
  ) context.addIssue({
    code: 'custom',
    message: 'GPU pricing basis lost output, ordering, or exact work coverage.',
  })
})

export const canonicalProfessionalGpuPlanPricingBasisSchema =
  basisWithoutHashSchema.extend({ pricingBasisHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlanPricingBasis = z.infer<
  typeof canonicalProfessionalGpuPlanPricingBasisSchema
>
export type CanonicalProfessionalGpuPlanPricingWorkload = z.input<
  typeof workloadWithoutDigestSchema
>

const measuredRouteSchema = z.object({
  routeId: routeIdSchema,
  usageRange: usageRangeSchema,
  benchmarkRunCount: positiveInteger.min(30),
  benchmarkRunSetRef: evidenceRefSchema,
  toolOrModelArtifactReleaseRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
}).strict()

const usageQuoteWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_USAGE_QUOTE_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_plan_usage_quote_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  quoteId: safeId,
  quoteVersion: positiveInteger,
  pricingBasisRef: evidenceRefSchema,
  pricingUnitRef: evidenceRefSchema,
  scope: basisScopeSchema,
  workItemKey: safeId,
  toolId: toolIdSchema,
  operationId: safeId,
  exactToolOrModelReleaseRef: evidenceRefSchema,
  workloadDigestSha256: sha256,
  placementPolicyRef: placementRefSchema,
  modelOrOperationCostProfileId: safeId,
  primary: measuredRouteSchema,
  fallback: measuredRouteSchema.nullable(),
  primaryPreInferenceFailureHighUsage:
    canonicalProfessionalToolGpuUsageSchema.nullable(),
  calibrationMethod: z.literal(
    'qualified_private_runs_p10_p50_p95_bounded_high_v1',
  ),
  exactPricingBasisUnitReleaseAndWorkloadReread: z.literal(true),
  lowExpectedHighDerivedFromMeasuredRuns: z.literal(true),
  callerUsageDurationRateOrPriceAccepted: z.literal(false),
  privateInternalQualified: z.literal(true),
  customerPriceOrServiceFeeAuthorityGranted: z.literal(false),
  walletCreditOrLedgerMutationAuthorityGranted: z.literal(false),
  observedAt: timestamp,
  expiresAt: timestamp,
  maximumQuoteAgeSeconds: z.literal(86_400),
}).strict().superRefine((quote, context) => {
  const heavy = quote.primary.routeId === 'a100_80gb_heavy_primary'
  const exactHeavy = heavy
    && quote.fallback?.routeId === 'l4_heavy_fallback'
    && quote.primaryPreInferenceFailureHighUsage !== null
    && quote.primaryPreInferenceFailureHighUsage
      .runtimeAndModelLoadMilliseconds === 0
    && quote.primaryPreInferenceFailureHighUsage.activeGpuMilliseconds === 0
    && quote.primaryPreInferenceFailureHighUsage.networkEgressBytes === 0
  const exactStandard = quote.primary.routeId === 'l4_standard_primary'
    && quote.fallback === null
    && quote.primaryPreInferenceFailureHighUsage === null
  const exactArtifacts = stableAuthorityStringify(
    quote.primary.toolOrModelArtifactReleaseRef,
  ) === stableAuthorityStringify(quote.exactToolOrModelReleaseRef)
    && (quote.fallback === null || stableAuthorityStringify(
      quote.fallback.toolOrModelArtifactReleaseRef,
    ) === stableAuthorityStringify(quote.exactToolOrModelReleaseRef))
  const distinctHeavyEvidence = !heavy || (
    quote.primary.runtimeReleaseRef.contentHash !==
      quote.fallback?.runtimeReleaseRef.contentHash
    && quote.primary.benchmarkRunSetRef.contentHash !==
      quote.fallback?.benchmarkRunSetRef.contentHash
  )
  if (
    (!exactHeavy && !exactStandard)
    || !exactArtifacts
    || !distinctHeavyEvidence
    || Date.parse(quote.expiresAt) <= Date.parse(quote.observedAt)
    || Date.parse(quote.expiresAt) - Date.parse(quote.observedAt) >
      quote.maximumQuoteAgeSeconds * 1_000
  ) context.addIssue({
    code: 'custom',
    message: 'GPU plan usage quote lost route, release, or expiry.',
  })
})

export const canonicalProfessionalGpuPlanUsageQuoteSchema =
  usageQuoteWithoutHashSchema.extend({ quoteHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlanUsageQuote = z.infer<
  typeof canonicalProfessionalGpuPlanUsageQuoteSchema
>

const customerEstimateLineSchema = z.object({
  lineKey: safeId,
  label: safeText.max(160),
  category: z.literal('gpu_tool_infrastructure'),
  estimatedCredits: nonnegativeInteger.max(10_000_000),
  removable: z.literal(false),
  metadata: z.object({
    schemaVersion: z.literal(
      'canonical-professional-gpu-customer-estimate-line-v1',
    ),
    pricingBasisHash: sha256,
    pricingUnitHash: sha256,
    quoteHash: sha256,
    workItemKey: safeId,
    toolId: toolIdSchema,
    operationId: safeId,
    exactToolOrModelReleaseRef: evidenceRefSchema,
    primaryRouteId: routeIdSchema,
    fallbackRouteId: routeIdSchema.nullable(),
    maximumCustomerEligibleToolCostUsdNanos: nonnegativeInteger,
    maximumPlatformInfrastructureRiskUsdNanos: nonnegativeInteger,
    creditValueUsdNanos: z.literal(100_000_000),
    serviceFeeIncluded: z.literal(false),
    currentAccountEffectiveRatesReread: z.literal(true),
  }).strict(),
}).strict()

const manifestEntrySchema = z.object({
  workItemKey: safeId,
  toolId: toolIdSchema,
  operationId: safeId,
  pricingUnitRef: evidenceRefSchema,
  quoteRef: evidenceRefSchema,
  exactToolOrModelReleaseRef: evidenceRefSchema,
  costCalculation: canonicalProfessionalToolGpuCostCalculationSchema,
  customerEstimateLine: customerEstimateLineSchema,
}).strict()

const sourceEstimateLineSchema = z.object({
  lineKey: safeId,
  label: z.string().trim().min(1).max(160),
  category: safeId,
  estimatedCredits: nonnegativeInteger.max(10_000_000),
  removable: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
}).strict()

const sourceEstimateSchema = z.object({
  lineItems: z.array(sourceEstimateLineSchema).min(1).max(512),
  fallbackAllowanceCredits: nonnegativeInteger.max(10_000_000),
  validForSeconds: positiveInteger.min(300).max(86_400),
}).strict()

const manifestWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_PREAPPROVAL_MANIFEST_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_plan_preapproval_pricing_owner',
  ),
  manifestId: safeId,
  manifestVersion: positiveInteger,
  pricingBasisRef: evidenceRefSchema,
  scope: basisScopeSchema,
  confirmedOutputFrame: confirmedOutputFrameBindingSchema,
  region: z.enum(['us-central1', 'europe-west4']),
  entries: z.array(manifestEntrySchema).min(1).max(256),
  nonpricedToolUnits: z.array(nonpricedToolUnitSchema).max(256),
  totalMaximumReservedToolCostCredits: nonnegativeInteger.max(10_000_000),
  totalMaximumCustomerEligibleToolCostUsdNanos: nonnegativeInteger,
  totalMaximumPlatformInfrastructureRiskUsdNanos: nonnegativeInteger,
  customerEstimateLineCount: positiveInteger.max(256),
  currentBillingAccountEffectiveSkuRegionCurrencyTierRatesReread:
    z.literal(true),
  exactQualifiedUsageRangesReread: z.literal(true),
  serviceFeeIncluded: z.literal(false),
  estimateMustBePresentedBeforeApproval: z.literal(true),
  fundedReservationMustCoverExactGpuCeilingBeforeDispatch: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  terminalAttemptScaleBackToZeroRequired: z.literal(true),
  unapprovedOverageChargedToCustomer: z.literal(false),
  weeditproFailureChargedToCustomer: z.literal(false),
  callerUsageDurationRateOrPriceAccepted: z.literal(false),
  approvalGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeAdmissionGranted: z.literal(false),
  createdAt: timestamp,
  validUntil: timestamp,
}).strict().superRefine((manifest, context) => {
  const ordered = manifest.entries.every((entry, index) => index === 0
    || manifest.entries[index - 1]!.workItemKey < entry.workItemKey)
  const credits = manifest.entries.reduce((total, entry) =>
    total + entry.costCalculation.maximumReservedToolCostCredits, 0)
  const eligible = manifest.entries.reduce((total, entry) =>
    total + entry.costCalculation.maximumCustomerEligibleToolCostUsdNanos, 0)
  const risk = manifest.entries.reduce((total, entry) =>
    total + entry.costCalculation.maximumPlatformInfrastructureRiskUsdNanos, 0)
  const exactEntryBindings = manifest.entries.every((entry) => {
    const calculation = entry.costCalculation
    const line = entry.customerEstimateLine
    return entry.toolId === calculation.toolId
      && entry.toolId === line.metadata.toolId
      && entry.operationId === line.metadata.operationId
      && entry.workItemKey === line.metadata.workItemKey
      && entry.pricingUnitRef.contentHash ===
        `sha256:${line.metadata.pricingUnitHash}`
      && entry.quoteRef.contentHash ===
        `sha256:${line.metadata.quoteHash}`
      && stableAuthorityStringify(entry.exactToolOrModelReleaseRef) ===
        stableAuthorityStringify(line.metadata.exactToolOrModelReleaseRef)
      && line.lineKey === `gpu-tool-${entry.workItemKey}`
      && line.estimatedCredits ===
        calculation.maximumReservedToolCostCredits
      && line.metadata.pricingBasisHash ===
        manifest.pricingBasisRef.contentHash.slice('sha256:'.length)
      && line.metadata.primaryRouteId === calculation.primary.routeId
      && line.metadata.fallbackRouteId ===
        (calculation.fallback?.routeId ?? null)
      && line.metadata.maximumCustomerEligibleToolCostUsdNanos ===
        calculation.maximumCustomerEligibleToolCostUsdNanos
      && line.metadata.maximumPlatformInfrastructureRiskUsdNanos ===
        calculation.maximumPlatformInfrastructureRiskUsdNanos
      && line.metadata.creditValueUsdNanos === calculation.creditValueUsdNanos
  })
  if (
    !ordered
    || !exactEntryBindings
    || new Set(manifest.entries.map((entry) => entry.workItemKey)).size !==
      manifest.entries.length
    || manifest.customerEstimateLineCount !== manifest.entries.length
    || manifest.totalMaximumReservedToolCostCredits !== credits
    || manifest.totalMaximumCustomerEligibleToolCostUsdNanos !== eligible
    || manifest.totalMaximumPlatformInfrastructureRiskUsdNanos !== risk
    || Date.parse(manifest.validUntil) <= Date.parse(manifest.createdAt)
  ) context.addIssue({
    code: 'custom',
    message: 'GPU preapproval manifest lost ordering, totals, or expiry.',
  })
})

export const canonicalProfessionalGpuPlanPreapprovalManifestSchema =
  manifestWithoutHashSchema.extend({ manifestHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlanPreapprovalManifest = z.infer<
  typeof canonicalProfessionalGpuPlanPreapprovalManifestSchema
>

const publicationBindingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_PUBLICATION_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_plan_publication_reconciliation',
  ),
  bindingId: safeId,
  pricingBasisRef: evidenceRefSchema,
  preapprovalManifestRef: evidenceRefSchema,
  publishedPlanRef: evidenceRefSchema,
  publishedCustomerEstimateRef: evidenceRefSchema,
  publishedCanonicalWorkGraphDigestSha256: sha256,
  publishedCustomerEstimateDigestSha256: sha256,
  exactStructuralWorkGraphReread: z.literal(true),
  exactGpuBudgetsAppliedToWorkItems: z.literal(true),
  exactGpuLinesIncludedInCustomerEstimate: z.literal(true),
  estimatePresentedBeforeApproval: z.literal(true),
  approvalMayReferenceOnlyThisPlanAndEstimate: z.literal(true),
  fundedReservationMustCoverGpuManifestCeiling: z.literal(true),
  callerPriceAccepted: z.literal(false),
  approvalGranted: z.literal(false),
  creditReservationCreated: z.literal(false),
  dispatchAuthorized: z.literal(false),
  walletOrLedgerMutated: z.literal(false),
  boundAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPlanPublicationBindingSchema =
  publicationBindingWithoutHashSchema.extend({ bindingHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlanPublicationBinding = z.infer<
  typeof canonicalProfessionalGpuPlanPublicationBindingSchema
>

const dispatchEstimateEntrySchema = z.object({
  workItemKey: safeId,
  approvedWorkItemRef: evidenceRefSchema,
  pricingUnitRef: evidenceRefSchema,
  preapprovalManifestEntryDigestSha256: sha256,
  estimate: canonicalProfessionalToolGpuCostEstimateSchema,
}).strict()

const dispatchEstimateSetWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_DISPATCH_ESTIMATE_SET_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_plan_dispatch_estimate_materializer',
  ),
  estimateSetId: safeId,
  pricingBasisRef: evidenceRefSchema,
  preapprovalManifestRef: evidenceRefSchema,
  publicationBindingRef: evidenceRefSchema,
  publishedPlanRef: evidenceRefSchema,
  publishedCustomerEstimateRef: evidenceRefSchema,
  entries: z.array(dispatchEstimateEntrySchema).min(1).max(256),
  totalMaximumReservedToolCostCredits: nonnegativeInteger.max(10_000_000),
  exactPreapprovalCalculationsReusedWithoutRepricing: z.literal(true),
  exactPublishedPlanWorkAndEstimateBound: z.literal(true),
  fundedReservationRequiredBeforeGpuJobCreation: z.literal(true),
  approvalRequiredBeforeGpuJobCreation: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  terminalAttemptScaleBackToZeroRequired: z.literal(true),
  dispatchAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  createdAt: timestamp,
}).strict().superRefine((set, context) => {
  const ordered = set.entries.every((entry, index) => index === 0
    || set.entries[index - 1]!.workItemKey < entry.workItemKey)
  const total = set.entries.reduce((sum, entry) =>
    sum + entry.estimate.maximumReservedToolCostCredits, 0)
  if (
    !ordered
    || new Set(set.entries.map((entry) => entry.workItemKey)).size !==
      set.entries.length
    || total !== set.totalMaximumReservedToolCostCredits
  ) context.addIssue({
    code: 'custom',
    message: 'GPU dispatch-estimate set lost ordering or credit totals.',
  })
})

export const canonicalProfessionalGpuPlanDispatchEstimateSetSchema =
  dispatchEstimateSetWithoutHashSchema.extend({ estimateSetHash: sha256 })
    .strict()
export type CanonicalProfessionalGpuPlanDispatchEstimateSet = z.infer<
  typeof canonicalProfessionalGpuPlanDispatchEstimateSetSchema
>

export interface CanonicalProfessionalGpuPlanUsageQuoteReadPort {
  rereadCurrentQualifiedPlanUsageQuote(input: {
    readonly pricingBasisRef: z.infer<typeof evidenceRefSchema>
    readonly pricingUnit: z.infer<typeof pricingUnitSchema>
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuPlanCurrentRateReadPort {
  rereadCurrentAccountEffectiveRateAuthority(input: {
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly region: 'us-central1' | 'europe-west4'
    readonly at: string
  }): Promise<unknown>
}

export function createCanonicalProfessionalGpuPlanPricingBasis(input: {
  readonly scope: z.input<typeof basisScopeSchema>
  readonly components: CanonicalPlanComponentsInput
  readonly workItems: readonly CanonicalWorkItemInput[]
  readonly confirmedOutputFrameRef: z.input<typeof evidenceRefSchema>
  readonly workloads: readonly {
    readonly workItemKey: string
    readonly exactToolOrModelReleaseRef: z.input<typeof evidenceRefSchema>
    readonly workload: CanonicalProfessionalGpuPlanPricingWorkload
  }[]
  readonly helperParentBindings?: readonly {
    readonly helperWorkItemKey: string
    readonly parentGpuWorkItemKey: string
  }[]
}): CanonicalProfessionalGpuPlanPricingBasis {
  assertClosedPlainSerializedData(input, 'gpu_plan_pricing_basis_input')
  const scope = basisScopeSchema.parse(input.scope)
  const components = canonicalPlanComponentsSchema.parse(input.components)
  const workItems = z.array(canonicalWorkItemSchema).min(1).max(256)
    .parse(input.workItems)
  if (new Set(workItems.map((item) => item.workItemKey)).size !==
      workItems.length) {
    throw new Error('GPU pricing basis requires unique canonical work items.')
  }
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const workloads = new Map(input.workloads.map((binding) => [
    binding.workItemKey,
    binding,
  ]))
  if (workloads.size !== input.workloads.length) {
    throw new Error('GPU pricing workloads must be unique by work item.')
  }
  const helperParents = new Map((input.helperParentBindings ?? []).map(
    (binding) => [binding.helperWorkItemKey, binding.parentGpuWorkItemKey],
  ))
  if (helperParents.size !== (input.helperParentBindings ?? []).length) {
    throw new Error('GPU helper-parent bindings must be unique.')
  }
  const pricingUnits: z.infer<typeof pricingUnitSchema>[] = []
  const nonpricedToolUnits: z.infer<typeof nonpricedToolUnitSchema>[] = []
  const toolFreeWorkItemKeys: string[] = []
  const workByKey = new Map(workItems.map((item) =>
    [item.workItemKey, item]))

  for (const workItem of workItems) {
    const structuralDigest =
      canonicalProfessionalGpuWorkItemPricingStructureDigest(workItem)
    if (workItem.approvedToolIds.length === 0) {
      const operationIds = workItem.executionInput.approvedToolOperationIds
      if (operationIds !== undefined && (
        !Array.isArray(operationIds) || operationIds.length !== 0
      )) throw new Error('Tool-free work cannot retain a tool operation.')
      toolFreeWorkItemKeys.push(workItem.workItemKey)
      continue
    }
    if (workItem.approvedToolIds.length !== 1) {
      throw new Error(
        'GPU pricing requires the canonical atomic work-item compiler first.',
      )
    }
    const toolId = toolIdSchema.parse(workItem.approvedToolIds[0])
    const placement = placementPolicy.entries.find((entry) =>
      entry.toolId === toolId)
    if (!placement) throw new Error('GPU pricing placement is missing.')
    if (placement.placementClass === 'historical_read_only') {
      throw new Error('Historical or replaced tools cannot enter a new plan.')
    }
    if (placement.gpuImplementationDisposition ===
      'gpu_successor_implementation_required') {
      throw new Error('Tool GPU successor implementation is not qualified.')
    }
    const operationIds = workItem.executionInput.approvedToolOperationIds
    const operationAuthority = pricingOperationAuthority(toolId)
    if (!operationAuthority
      || !Array.isArray(operationIds) || operationIds.length !== 1
      || operationIds[0] !== operationAuthority.operationId) {
      throw new Error('GPU pricing requires one exact tool-operation identity.')
    }
    const operationId = operationIds[0]
    if (placement.placementClass === 'non_gpu_control_plane_only') {
      if (workloads.has(workItem.workItemKey)
        || helperParents.has(workItem.workItemKey)) {
        throw new Error('Control-plane work cannot receive GPU pricing.')
      }
      nonpricedToolUnits.push(nonpricedUnit({
        workItem,
        toolId,
        operationId,
        structuralDigest,
        disposition: 'control_plane_only_no_tool_charge',
        parentGpuWorkItemKey: null,
      }))
      continue
    }
    if (placement.placementClass ===
      'l4_colocated_io_container_metadata_helper') {
      const parentGpuWorkItemKey = helperParents.get(workItem.workItemKey)
      if (!parentGpuWorkItemKey || workloads.has(workItem.workItemKey)) {
        throw new Error('L4 helper requires one non-billable parent binding.')
      }
      nonpricedToolUnits.push(nonpricedUnit({
        workItem,
        toolId,
        operationId,
        structuralDigest,
        disposition: 'l4_colocated_helper_included_in_parent_attempt',
        parentGpuWorkItemKey,
      }))
      helperParents.delete(workItem.workItemKey)
      continue
    }
    if (helperParents.has(workItem.workItemKey)) {
      throw new Error('Only L4 helper work may carry a parent binding.')
    }
    const workloadBinding = workloads.get(workItem.workItemKey)
    if (!workloadBinding) {
      throw new Error('Every substantive GPU work item requires a workload.')
    }
    const workloadPayload = workloadWithoutDigestSchema.parse(
      workloadBinding.workload,
    )
    const workload = workloadSchema.parse({
      ...workloadPayload,
      workloadDigestSha256: sha256AuthorityValue(workloadPayload),
    })
    const releaseRef = evidenceRefSchema.parse(
      workloadBinding.exactToolOrModelReleaseRef,
    )
    const unitPayload = pricingUnitWithoutHashSchema.parse({
      workItemKey: workItem.workItemKey,
      workItemType: workItem.workItemType,
      workerClass: workItem.workerClass,
      required: workItem.required,
      toolId,
      operationId,
      operationAuthorityDisposition:
        operationAuthority.operationAuthorityDisposition,
      workItemPricingStructureDigestSha256: structuralDigest,
      expectedOutputsDigestSha256: sha256AuthorityValue(
        workItem.expectedOutputs,
      ),
      dependencyKeys: [...workItem.dependencyKeys].sort(utf16Compare),
      maxAttempts: workItem.maxAttempts,
      attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
      exactToolOrModelReleaseRef: releaseRef,
      workload,
      placementPolicyRef: {
        schemaVersion: placementPolicy.schemaVersion,
        policyHash: placementPolicy.policyHash,
        entryHash: placement.entryHash,
      },
    })
    pricingUnits.push(pricingUnitSchema.parse({
      ...unitPayload,
      pricingUnitHash: sha256AuthorityValue(unitPayload),
    }))
    workloads.delete(workItem.workItemKey)
  }

  if (workloads.size > 0) {
    throw new Error('GPU pricing contains a workload for unknown/nonpriced work.')
  }
  if (helperParents.size > 0) {
    throw new Error('GPU pricing contains an unknown helper-parent binding.')
  }
  for (const unit of nonpricedToolUnits) {
    if (unit.disposition !==
      'l4_colocated_helper_included_in_parent_attempt') continue
    const parent = pricingUnits.find((candidate) =>
      candidate.workItemKey === unit.parentGpuWorkItemKey)
    const parentPlacement = parent && placementPolicy.entries.find((entry) =>
      entry.toolId === parent.toolId)
    const helperWork = workByKey.get(unit.workItemKey)!
    const parentWork = parent && workByKey.get(parent.workItemKey)
    const linked = parentWork && (
      helperWork.dependencyKeys.includes(parentWork.workItemKey)
      || parentWork.dependencyKeys.includes(helperWork.workItemKey)
    )
    if (!parent || parentPlacement?.placementClass !==
      'l4_standard_gpu_primary' || !linked) {
      throw new Error(
        'L4 helper must be dependency-linked to one priced L4 parent attempt.',
      )
    }
  }

  const confirmed = components.confirmedSettings
  const confirmedOutputFrame = confirmedOutputFrameBindingSchema.parse({
    outputFrameRef: input.confirmedOutputFrameRef,
    outputId: scope.outputId,
    aspectRatio: confirmed.aspectRatio,
    width: confirmed.outputFrame.width,
    height: confirmed.outputFrame.height,
    fps: confirmed.outputFrame.fps,
  })
  pricingUnits.sort((left, right) => utf16Compare(
    left.workItemKey,
    right.workItemKey,
  ))
  nonpricedToolUnits.sort((left, right) => utf16Compare(
    left.workItemKey,
    right.workItemKey,
  ))
  toolFreeWorkItemKeys.sort(utf16Compare)
  const payload = basisWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_BASIS_VERSION,
    source: 'canonical_server_preapproval_gpu_plan_pricing_basis_compiler',
    scope,
    canonicalPlanSchemaVersion: 'private-edit-authority-plan-v2',
    canonicalPlanComponentsDigestSha256: sha256AuthorityValue(components),
    confirmedSettingsDigestSha256: sha256AuthorityValue(confirmed),
    masterTimingDigestSha256: sha256AuthorityValue(
      components.masterTimingPlan,
    ),
    sourceSequenceDigestSha256: sha256AuthorityValue(
      components.sourceSequence,
    ),
    sourceCleanupPlanDigestSha256: sha256AuthorityValue(
      components.sourceCleanupPlan,
    ),
    toolStrategyPlanDigestSha256: sha256AuthorityValue(
      components.toolStrategyPlan,
    ),
    rendererPlanDigestSha256: sha256AuthorityValue(
      components.rendererPlan,
    ),
    qaPlanDigestSha256: sha256AuthorityValue(components.qaPlan),
    confirmedOutputFrame,
    canonicalWorkGraphPricingStructureDigestSha256:
      canonicalProfessionalGpuWorkGraphPricingStructureDigest(workItems),
    pricingUnits,
    nonpricedToolUnits,
    toolFreeWorkItemKeys,
    totalCanonicalWorkItemCount: workItems.length,
    exactAtomicToolOperationBindings: true,
    maximumCreditBudgetExcludedFromPricingBasis: true,
    callerRateUsageDurationOrPriceAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerEstimateMutated: false,
    approvalGranted: false,
    creditReservationCreated: false,
    runtimeAdmissionGranted: false,
  })
  return assertCanonicalProfessionalGpuPlanPricingBasis({
    ...payload,
    pricingBasisHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalProfessionalGpuPlanUsageQuote(input: {
  readonly quoteId: string
  readonly quoteVersion: number
  readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
  readonly workItemKey: string
  readonly primary: z.input<typeof measuredRouteSchema>
  readonly fallback?: z.input<typeof measuredRouteSchema>
  readonly primaryPreInferenceFailureHighUsage?:
    CanonicalProfessionalToolGpuUsage
  readonly observedAt: string
  readonly expiresAt: string
}): CanonicalProfessionalGpuPlanUsageQuote {
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const unit = basis.pricingUnits.find((candidate) =>
    candidate.workItemKey === input.workItemKey)
  if (!unit) throw new Error('GPU usage quote pricing unit is missing.')
  const payload = usageQuoteWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_PLAN_USAGE_QUOTE_VERSION,
    source: 'canonical_server_professional_gpu_plan_usage_quote_repository',
    evidenceClass: 'canonical_private_reread',
    quoteId: input.quoteId,
    quoteVersion: input.quoteVersion,
    pricingBasisRef: ref(
      `gpu-pricing-basis:${basis.scope.planningRequestId}`,
      basis.pricingBasisHash,
    ),
    pricingUnitRef: ref(
      `gpu-pricing-unit:${unit.workItemKey}`,
      unit.pricingUnitHash,
    ),
    scope: basis.scope,
    workItemKey: unit.workItemKey,
    toolId: unit.toolId,
    operationId: unit.operationId,
    exactToolOrModelReleaseRef: unit.exactToolOrModelReleaseRef,
    workloadDigestSha256: unit.workload.workloadDigestSha256,
    placementPolicyRef: unit.placementPolicyRef,
    modelOrOperationCostProfileId:
      modelOrOperationCostProfileForTool(unit.toolId),
    primary: input.primary,
    fallback: input.fallback ?? null,
    primaryPreInferenceFailureHighUsage:
      input.primaryPreInferenceFailureHighUsage ?? null,
    calibrationMethod:
      'qualified_private_runs_p10_p50_p95_bounded_high_v1',
    exactPricingBasisUnitReleaseAndWorkloadReread: true,
    lowExpectedHighDerivedFromMeasuredRuns: true,
    callerUsageDurationRateOrPriceAccepted: false,
    privateInternalQualified: true,
    customerPriceOrServiceFeeAuthorityGranted: false,
    walletCreditOrLedgerMutationAuthorityGranted: false,
    observedAt: input.observedAt,
    expiresAt: input.expiresAt,
    maximumQuoteAgeSeconds: 86_400,
  })
  return assertCanonicalProfessionalGpuPlanUsageQuote({
    ...payload,
    quoteHash: sha256AuthorityValue(payload),
  }, basis)
}

export async function createCanonicalProfessionalGpuPlanPreapprovalManifest(
  input: {
    readonly manifestId: string
    readonly manifestVersion: number
    readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
    readonly region: 'us-central1' | 'europe-west4'
    readonly usageQuoteReadPort:
      CanonicalProfessionalGpuPlanUsageQuoteReadPort
    readonly currentRateReadPort:
      CanonicalProfessionalGpuPlanCurrentRateReadPort
    readonly createdAt: string
  },
): Promise<CanonicalProfessionalGpuPlanPreapprovalManifest> {
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const pricingBasisRef = ref(
    `gpu-pricing-basis:${basis.scope.planningRequestId}`,
    basis.pricingBasisHash,
  )
  const rateCache = new Map<string, Promise<
    CanonicalProfessionalGoogleCloudGpuRateAuthority
  >>()
  const admittedQuoteExpiryByHash = new Map<string, string>()
  const readRate = (routeId: z.infer<typeof routeIdSchema>) => {
    const key = `${input.region}:${routeId}`
    let pending = rateCache.get(key)
    if (!pending) {
      pending = readCurrentRate({
        port: input.currentRateReadPort,
        routeId,
        region: input.region,
        at: input.createdAt,
      })
      rateCache.set(key, pending)
    }
    return pending
  }
  const entries = await Promise.all(basis.pricingUnits.map(async (unit) => {
    const untrustedQuote = await input.usageQuoteReadPort
      .rereadCurrentQualifiedPlanUsageQuote({
        pricingBasisRef,
        pricingUnit: unit,
        at: input.createdAt,
      })
    assertClosedPlainSerializedData(untrustedQuote, 'gpu_plan_usage_quote')
    const quote = assertCanonicalProfessionalGpuPlanUsageQuote(
      untrustedQuote,
      basis,
      input.createdAt,
    )
    admittedQuoteExpiryByHash.set(quote.quoteHash, quote.expiresAt)
    const primaryRate = await readRate(quote.primary.routeId)
    const fallbackRate = quote.fallback
      ? await readRate(quote.fallback.routeId)
      : undefined
    const calculation = calculateCanonicalProfessionalToolGpuCost({
      toolId: unit.toolId,
      primaryRateAuthority: primaryRate,
      primaryUsageRange: quote.primary.usageRange,
      fallbackRateAuthority: fallbackRate,
      fallbackUsageRange: quote.fallback?.usageRange,
      primaryPreInferenceFailureHighUsage:
        quote.primaryPreInferenceFailureHighUsage ?? undefined,
      createdAt: input.createdAt,
    })
    const profile = getKnownProfessionalToolCatalogProfile(unit.toolId)
    if (!profile) throw new Error('GPU price line tool profile is missing.')
    const line = customerEstimateLineSchema.parse({
      lineKey: `gpu-tool-${unit.workItemKey}`,
      label: `${profile.displayName} GPU execution ceiling`,
      category: 'gpu_tool_infrastructure',
      estimatedCredits: calculation.maximumReservedToolCostCredits,
      removable: false,
      metadata: {
        schemaVersion:
          'canonical-professional-gpu-customer-estimate-line-v1',
        pricingBasisHash: basis.pricingBasisHash,
        pricingUnitHash: unit.pricingUnitHash,
        quoteHash: quote.quoteHash,
        workItemKey: unit.workItemKey,
        toolId: unit.toolId,
        operationId: unit.operationId,
        exactToolOrModelReleaseRef: unit.exactToolOrModelReleaseRef,
        primaryRouteId: calculation.primary.routeId,
        fallbackRouteId: calculation.fallback?.routeId ?? null,
        maximumCustomerEligibleToolCostUsdNanos:
          calculation.maximumCustomerEligibleToolCostUsdNanos,
        maximumPlatformInfrastructureRiskUsdNanos:
          calculation.maximumPlatformInfrastructureRiskUsdNanos,
        creditValueUsdNanos: calculation.creditValueUsdNanos,
        serviceFeeIncluded: false,
        currentAccountEffectiveRatesReread: true,
      },
    })
    return manifestEntrySchema.parse({
      workItemKey: unit.workItemKey,
      toolId: unit.toolId,
      operationId: unit.operationId,
      pricingUnitRef: ref(
        `gpu-pricing-unit:${unit.workItemKey}`,
        unit.pricingUnitHash,
      ),
      quoteRef: ref(quote.quoteId, quote.quoteHash, quote.quoteVersion),
      exactToolOrModelReleaseRef: unit.exactToolOrModelReleaseRef,
      costCalculation: calculation,
      customerEstimateLine: line,
    })
  }))
  entries.sort((left, right) => utf16Compare(
    left.workItemKey,
    right.workItemKey,
  ))
  const allRateExpiries = (await Promise.all([...rateCache.values()]))
    .map((rate) => rate.expiresAt)
  const validUntil = [
    ...allRateExpiries,
    ...admittedQuoteExpiryByHash.values(),
  ]
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0]
  if (!validUntil) throw new Error('GPU pricing expiry is missing.')
  const payload = manifestWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PLAN_PREAPPROVAL_MANIFEST_VERSION,
    source:
      'canonical_server_professional_gpu_plan_preapproval_pricing_owner',
    manifestId: input.manifestId,
    manifestVersion: input.manifestVersion,
    pricingBasisRef,
    scope: basis.scope,
    confirmedOutputFrame: basis.confirmedOutputFrame,
    region: input.region,
    entries,
    nonpricedToolUnits: basis.nonpricedToolUnits,
    totalMaximumReservedToolCostCredits: entries.reduce((total, entry) =>
      total + entry.costCalculation.maximumReservedToolCostCredits, 0),
    totalMaximumCustomerEligibleToolCostUsdNanos:
      entries.reduce((total, entry) => total +
        entry.costCalculation.maximumCustomerEligibleToolCostUsdNanos, 0),
    totalMaximumPlatformInfrastructureRiskUsdNanos:
      entries.reduce((total, entry) => total +
        entry.costCalculation.maximumPlatformInfrastructureRiskUsdNanos, 0),
    customerEstimateLineCount: entries.length,
    currentBillingAccountEffectiveSkuRegionCurrencyTierRatesReread: true,
    exactQualifiedUsageRangesReread: true,
    serviceFeeIncluded: false,
    estimateMustBePresentedBeforeApproval: true,
    fundedReservationMustCoverExactGpuCeilingBeforeDispatch: true,
    userTriggeredScaleFromZeroRequired: true,
    terminalAttemptScaleBackToZeroRequired: true,
    unapprovedOverageChargedToCustomer: false,
    weeditproFailureChargedToCustomer: false,
    callerUsageDurationRateOrPriceAccepted: false,
    approvalGranted: false,
    customerCreditsMutated: false,
    runtimeAdmissionGranted: false,
    createdAt: input.createdAt,
    validUntil,
  })
  return assertCanonicalProfessionalGpuPlanPreapprovalManifest({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  }, basis, input.createdAt)
}

export function applyCanonicalProfessionalGpuPlanPricing(input: {
  readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
  readonly manifest: CanonicalProfessionalGpuPlanPreapprovalManifest
  readonly sourceEstimate: CanonicalEstimateInput
  readonly workItems: readonly CanonicalWorkItemInput[]
  readonly at: string
}): {
  readonly estimate: CanonicalEstimateInput
  readonly workItems: CanonicalWorkItemInput[]
} {
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    input.manifest,
    basis,
    input.at,
  )
  assertClosedPlainSerializedData(input.sourceEstimate, 'source_estimate')
  assertClosedPlainSerializedData(input.workItems, 'source_work_items')
  const sourceEstimate = sourceEstimateSchema.parse(input.sourceEstimate)
  const sourceWorkItems = z.array(canonicalWorkItemSchema).min(1).max(256)
    .parse(input.workItems)
  const pendingOperationUnits = basis.pricingUnits.filter((unit) =>
    unit.operationAuthorityDisposition !==
      'canonical_production_operation_registered')
  if (pendingOperationUnits.length > 0) {
    throw new Error(
      'GPU candidate operation must be qualified and promoted before approval.',
    )
  }
  if (canonicalProfessionalGpuWorkGraphPricingStructureDigest(sourceWorkItems) !==
    basis.canonicalWorkGraphPricingStructureDigestSha256) {
    throw new Error('GPU pricing cannot apply to a changed work graph.')
  }
  if (input.sourceEstimate.lineItems.some((line) =>
    line.category === 'gpu_tool_infrastructure'
    || line.lineKey.startsWith('gpu-tool-'))) {
    throw new Error('Caller cannot pre-populate server-owned GPU cost lines.')
  }
  const remainingSeconds = Math.floor(
    (Date.parse(manifest.validUntil) - Date.parse(input.at)) / 1_000,
  )
  if (remainingSeconds < 300
    || sourceEstimate.validForSeconds > remainingSeconds) {
    throw new Error('Customer estimate validity exceeds current GPU pricing.')
  }
  const entryByWork = new Map(manifest.entries.map((entry) =>
    [entry.workItemKey, entry]))
  const nonpricedByWork = new Map(manifest.nonpricedToolUnits.map((entry) =>
    [entry.workItemKey, entry]))
  const workItems = sourceWorkItems.map((workItem) => {
    const priced = entryByWork.get(workItem.workItemKey)
    const nonpriced = nonpricedByWork.get(workItem.workItemKey)
    return {
      ...structuredClone(workItem),
      maximumCreditBudget: priced
        ? priced.customerEstimateLine.estimatedCredits
        : nonpriced ? 0 : workItem.maximumCreditBudget,
    }
  })
  return {
    estimate: {
      lineItems: [
        ...structuredClone(sourceEstimate.lineItems),
        ...manifest.entries.map((entry) =>
          structuredClone(entry.customerEstimateLine)),
      ],
      fallbackAllowanceCredits: sourceEstimate.fallbackAllowanceCredits,
      validForSeconds: sourceEstimate.validForSeconds,
    },
    workItems,
  }
}

export function createCanonicalProfessionalGpuPlanPublicationBinding(input: {
  readonly bindingId: string
  readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
  readonly manifest: CanonicalProfessionalGpuPlanPreapprovalManifest
  readonly publishedPlanRef: z.input<typeof evidenceRefSchema>
  readonly publishedCustomerEstimateRef: z.input<typeof evidenceRefSchema>
  readonly publishedWorkItems: readonly CanonicalWorkItemInput[]
  readonly publishedCustomerEstimate: CanonicalEstimateInput
  readonly boundAt: string
}): CanonicalProfessionalGpuPlanPublicationBinding {
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    input.manifest,
    basis,
    input.boundAt,
  )
  if (basis.pricingUnits.some((unit) =>
    unit.operationAuthorityDisposition !==
      'canonical_production_operation_registered')) {
    throw new Error(
      'GPU candidate operation cannot bind to an approvable published plan.',
    )
  }
  assertClosedPlainSerializedData(input.publishedWorkItems, 'published_work')
  assertClosedPlainSerializedData(
    input.publishedCustomerEstimate,
    'published_estimate',
  )
  const publishedWorkItems = z.array(canonicalWorkItemSchema).min(1).max(256)
    .parse(input.publishedWorkItems)
  const publishedCustomerEstimate = sourceEstimateSchema.parse(
    input.publishedCustomerEstimate,
  )
  if (canonicalProfessionalGpuWorkGraphPricingStructureDigest(publishedWorkItems) !==
    basis.canonicalWorkGraphPricingStructureDigestSha256) {
    throw new Error('Published work graph differs from the pricing basis.')
  }
  const workByKey = new Map(publishedWorkItems.map((item) =>
    [item.workItemKey, item]))
  for (const entry of manifest.entries) {
    if (workByKey.get(entry.workItemKey)?.maximumCreditBudget !==
      entry.customerEstimateLine.estimatedCredits) {
      throw new Error('Published GPU work budget differs from its ceiling.')
    }
  }
  for (const unit of manifest.nonpricedToolUnits) {
    if (workByKey.get(unit.workItemKey)?.maximumCreditBudget !== 0) {
      throw new Error('Nonpriced GPU helper/control work must have zero budget.')
    }
  }
  const publishedGpuLines = publishedCustomerEstimate.lineItems
    .filter((line) => line.category === 'gpu_tool_infrastructure'
      || line.lineKey.startsWith('gpu-tool-'))
  const expectedGpuLines = manifest.entries.map((entry) =>
    entry.customerEstimateLine)
  if (stableAuthorityStringify(publishedGpuLines) !==
    stableAuthorityStringify(expectedGpuLines)) {
    throw new Error('Published customer estimate lost exact GPU price lines.')
  }
  const publishedCustomerEstimateRef = evidenceRefSchema.parse(
    input.publishedCustomerEstimateRef,
  )
  if (publishedCustomerEstimateRef.contentHash !==
    `sha256:${sha256AuthorityValue(publishedCustomerEstimate)}`) {
    throw new Error(
      'Published customer estimate ref differs from the exact estimate.',
    )
  }
  const payload = publicationBindingWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PLAN_PUBLICATION_BINDING_VERSION,
    source:
      'canonical_server_professional_gpu_plan_publication_reconciliation',
    bindingId: input.bindingId,
    pricingBasisRef: ref(
      `gpu-pricing-basis:${basis.scope.planningRequestId}`,
      basis.pricingBasisHash,
    ),
    preapprovalManifestRef: ref(
      manifest.manifestId,
      manifest.manifestHash,
      manifest.manifestVersion,
    ),
    publishedPlanRef: input.publishedPlanRef,
    publishedCustomerEstimateRef,
    publishedCanonicalWorkGraphDigestSha256:
      sha256AuthorityValue(publishedWorkItems),
    publishedCustomerEstimateDigestSha256:
      sha256AuthorityValue(publishedCustomerEstimate),
    exactStructuralWorkGraphReread: true,
    exactGpuBudgetsAppliedToWorkItems: true,
    exactGpuLinesIncludedInCustomerEstimate: true,
    estimatePresentedBeforeApproval: true,
    approvalMayReferenceOnlyThisPlanAndEstimate: true,
    fundedReservationMustCoverGpuManifestCeiling: true,
    callerPriceAccepted: false,
    approvalGranted: false,
    creditReservationCreated: false,
    dispatchAuthorized: false,
    walletOrLedgerMutated: false,
    boundAt: input.boundAt,
  })
  return assertCanonicalProfessionalGpuPlanPublicationBinding({
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalProfessionalGpuPlanDispatchEstimateSet(input: {
  readonly estimateSetId: string
  readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
  readonly manifest: CanonicalProfessionalGpuPlanPreapprovalManifest
  readonly publicationBinding: CanonicalProfessionalGpuPlanPublicationBinding
  readonly approvedWorkItemRefs: readonly {
    readonly workItemKey: string
    readonly approvedWorkItemRef: z.input<typeof evidenceRefSchema>
  }[]
  readonly createdAt: string
}): CanonicalProfessionalGpuPlanDispatchEstimateSet {
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    input.manifest,
    basis,
    input.createdAt,
  )
  const binding = assertCanonicalProfessionalGpuPlanPublicationBinding(
    input.publicationBinding,
  )
  const exactBinding = binding.pricingBasisRef.contentHash ===
      `sha256:${basis.pricingBasisHash}`
    && binding.preapprovalManifestRef.contentHash ===
      `sha256:${manifest.manifestHash}`
  if (!exactBinding) {
    throw new Error('GPU dispatch estimates require the exact publication binding.')
  }
  const workRefs = new Map(input.approvedWorkItemRefs.map((entry) => [
    entry.workItemKey,
    evidenceRefSchema.parse(entry.approvedWorkItemRef),
  ]))
  if (workRefs.size !== input.approvedWorkItemRefs.length
    || workRefs.size !== manifest.entries.length) {
    throw new Error('GPU dispatch estimates require one exact approved work ref.')
  }
  const entries = manifest.entries.map((manifestEntry) => {
    const approvedWorkItemRef = workRefs.get(manifestEntry.workItemKey)
    if (!approvedWorkItemRef) {
      throw new Error('GPU dispatch estimate approved work ref is missing.')
    }
    workRefs.delete(manifestEntry.workItemKey)
    const estimate =
      createCanonicalProfessionalToolGpuCostEstimateFromCalculation({
        estimateId:
          `gpu-estimate-${manifestEntry.workItemKey}-v${
            binding.publishedPlanRef.version}`,
        scope: {
          ownerUserId: basis.scope.ownerUserId,
          workspaceId: basis.scope.workspaceId,
          projectId: basis.scope.projectId,
          editSessionId: basis.scope.editSessionId,
          editPlanId: binding.publishedPlanRef.id,
          editPlanVersion: binding.publishedPlanRef.version,
          editPlanHash: binding.publishedPlanRef.contentHash.slice(
            'sha256:'.length,
          ),
          outputId: basis.scope.outputId,
          operationId: manifestEntry.operationId,
          plannedWorkItemRef: approvedWorkItemRef,
          toolId: manifestEntry.toolId,
          exactToolOrModelReleaseRef:
            manifestEntry.exactToolOrModelReleaseRef,
        },
        calculation: manifestEntry.costCalculation,
        createdAt: input.createdAt,
      })
    if (estimate.maximumReservedToolCostCredits !==
      manifestEntry.customerEstimateLine.estimatedCredits) {
      throw new Error('GPU dispatch estimate changed its approved ceiling.')
    }
    return dispatchEstimateEntrySchema.parse({
      workItemKey: manifestEntry.workItemKey,
      approvedWorkItemRef,
      pricingUnitRef: manifestEntry.pricingUnitRef,
      preapprovalManifestEntryDigestSha256:
        sha256AuthorityValue(manifestEntry),
      estimate,
    })
  })
  if (workRefs.size > 0) {
    throw new Error('GPU dispatch estimate has an extra approved work ref.')
  }
  entries.sort((left, right) => utf16Compare(
    left.workItemKey,
    right.workItemKey,
  ))
  const payload = dispatchEstimateSetWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PLAN_DISPATCH_ESTIMATE_SET_VERSION,
    source:
      'canonical_server_professional_gpu_plan_dispatch_estimate_materializer',
    estimateSetId: input.estimateSetId,
    pricingBasisRef: binding.pricingBasisRef,
    preapprovalManifestRef: binding.preapprovalManifestRef,
    publicationBindingRef: ref(binding.bindingId, binding.bindingHash),
    publishedPlanRef: binding.publishedPlanRef,
    publishedCustomerEstimateRef: binding.publishedCustomerEstimateRef,
    entries,
    totalMaximumReservedToolCostCredits: entries.reduce((sum, entry) =>
      sum + entry.estimate.maximumReservedToolCostCredits, 0),
    exactPreapprovalCalculationsReusedWithoutRepricing: true,
    exactPublishedPlanWorkAndEstimateBound: true,
    fundedReservationRequiredBeforeGpuJobCreation: true,
    approvalRequiredBeforeGpuJobCreation: true,
    userTriggeredScaleFromZeroRequired: true,
    terminalAttemptScaleBackToZeroRequired: true,
    dispatchAuthorized: false,
    customerCreditsMutated: false,
    createdAt: input.createdAt,
  })
  return assertCanonicalProfessionalGpuPlanDispatchEstimateSet({
    ...payload,
    estimateSetHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalGpuPlanPricingBasis(
  value: unknown,
): CanonicalProfessionalGpuPlanPricingBasis {
  assertClosedPlainSerializedData(value, 'gpu_plan_pricing_basis')
  const basis = canonicalProfessionalGpuPlanPricingBasisSchema.parse(value)
  const { pricingBasisHash, ...payload } = basis
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const exactPricedUnits = basis.pricingUnits.every((unit) => {
    const placement = placementPolicy.entries.find((entry) =>
      entry.toolId === unit.toolId)
    const operation = pricingOperationAuthority(unit.toolId)
    return Boolean(
      placement
      && (placement.placementClass === 'l4_standard_gpu_primary'
        || placement.placementClass ===
          'a100_80gb_heavy_primary_l4_fallback')
      && placement.gpuImplementationDisposition ===
        'declared_gpu_route_release_qualification_pending'
      && unit.placementPolicyRef.policyHash === placementPolicy.policyHash
      && unit.placementPolicyRef.entryHash === placement.entryHash
      && operation?.operationId === unit.operationId
      && operation.operationAuthorityDisposition ===
        unit.operationAuthorityDisposition,
    )
  })
  const exactNonpricedUnits = basis.nonpricedToolUnits.every((unit) => {
    const placement = placementPolicy.entries.find((entry) =>
      entry.toolId === unit.toolId)
    const operation = pricingOperationAuthority(unit.toolId)
    const expectedDisposition = placement?.placementClass ===
      'non_gpu_control_plane_only'
      ? 'control_plane_only_no_tool_charge'
      : placement?.placementClass ===
          'l4_colocated_io_container_metadata_helper'
        ? 'l4_colocated_helper_included_in_parent_attempt'
        : null
    return Boolean(
      placement
      && operation?.operationId === unit.operationId
      && expectedDisposition === unit.disposition
      && (unit.disposition === 'control_plane_only_no_tool_charge'
        ? unit.parentGpuWorkItemKey === null
        : unit.parentGpuWorkItemKey !== null),
    )
  })
  if (
    pricingBasisHash !== sha256AuthorityValue(payload)
    || !exactPricedUnits
    || !exactNonpricedUnits
  ) {
    throw new Error('GPU plan pricing-basis hash is invalid.')
  }
  return basis
}

export function assertCanonicalProfessionalGpuPlanUsageQuote(
  value: unknown,
  pricingBasis: CanonicalProfessionalGpuPlanPricingBasis,
  at?: string,
): CanonicalProfessionalGpuPlanUsageQuote {
  assertClosedPlainSerializedData(value, 'gpu_plan_usage_quote')
  const quote = canonicalProfessionalGpuPlanUsageQuoteSchema.parse(value)
  const { quoteHash, ...payload } = quote
  const unit = pricingBasis.pricingUnits.find((candidate) =>
    candidate.workItemKey === quote.workItemKey)
  const heavy = unit && pricingClassFor(unit) ===
    'a100_80gb_heavy_primary_l4_fallback'
  const exactRoute = heavy
    ? quote.primary.routeId === 'a100_80gb_heavy_primary'
      && quote.fallback?.routeId === 'l4_heavy_fallback'
    : quote.primary.routeId === 'l4_standard_primary'
      && quote.fallback === null
  if (
    quoteHash !== sha256AuthorityValue(payload)
    || !unit
    || stableAuthorityStringify(quote.pricingBasisRef) !==
      stableAuthorityStringify(ref(
        `gpu-pricing-basis:${pricingBasis.scope.planningRequestId}`,
        pricingBasis.pricingBasisHash,
      ))
    || stableAuthorityStringify(quote.pricingUnitRef) !==
      stableAuthorityStringify(ref(
        `gpu-pricing-unit:${unit.workItemKey}`,
        unit.pricingUnitHash,
      ))
    || stableAuthorityStringify(quote.scope) !==
      stableAuthorityStringify(pricingBasis.scope)
    || quote.toolId !== unit.toolId
    || quote.operationId !== unit.operationId
    || quote.workloadDigestSha256 !== unit.workload.workloadDigestSha256
    || stableAuthorityStringify(quote.exactToolOrModelReleaseRef) !==
      stableAuthorityStringify(unit.exactToolOrModelReleaseRef)
    || stableAuthorityStringify(quote.placementPolicyRef) !==
      stableAuthorityStringify(unit.placementPolicyRef)
    || quote.modelOrOperationCostProfileId !==
      modelOrOperationCostProfileForTool(unit.toolId)
    || !exactRoute
    || (at !== undefined && (
      Date.parse(at) < Date.parse(quote.observedAt)
      || Date.parse(at) >= Date.parse(quote.expiresAt)
    ))
  ) throw new Error('GPU plan usage quote is invalid, stale, or cross-scope.')
  return quote
}

export function assertCanonicalProfessionalGpuPlanPreapprovalManifest(
  value: unknown,
  pricingBasis: CanonicalProfessionalGpuPlanPricingBasis,
  at?: string,
): CanonicalProfessionalGpuPlanPreapprovalManifest {
  assertClosedPlainSerializedData(value, 'gpu_plan_preapproval_manifest')
  const manifest = canonicalProfessionalGpuPlanPreapprovalManifestSchema
    .parse(value)
  const { manifestHash, ...payload } = manifest
  if (
    manifestHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(manifest.scope) !==
      stableAuthorityStringify(pricingBasis.scope)
    || stableAuthorityStringify(manifest.pricingBasisRef) !==
      stableAuthorityStringify(ref(
        `gpu-pricing-basis:${pricingBasis.scope.planningRequestId}`,
        pricingBasis.pricingBasisHash,
      ))
    || stableAuthorityStringify(manifest.confirmedOutputFrame) !==
      stableAuthorityStringify(pricingBasis.confirmedOutputFrame)
    || stableAuthorityStringify(manifest.nonpricedToolUnits) !==
      stableAuthorityStringify(pricingBasis.nonpricedToolUnits)
    || manifest.entries.length !== pricingBasis.pricingUnits.length
    || manifest.entries.some((entry, index) => {
      const unit = pricingBasis.pricingUnits[index]
      return !unit
        || entry.workItemKey !== unit.workItemKey
        || entry.toolId !== unit.toolId
        || entry.operationId !== unit.operationId
        || entry.pricingUnitRef.contentHash !==
          `sha256:${unit.pricingUnitHash}`
        || entry.costCalculation.toolId !== unit.toolId
        || stableAuthorityStringify(
          entry.costCalculation.placementPolicyRef,
        ) !== stableAuthorityStringify(unit.placementPolicyRef)
        || stableAuthorityStringify(
          entry.exactToolOrModelReleaseRef,
        ) !== stableAuthorityStringify(
          unit.exactToolOrModelReleaseRef,
        )
        || entry.customerEstimateLine.metadata.pricingBasisHash !==
          pricingBasis.pricingBasisHash
    })
    || (at !== undefined && (
      Date.parse(at) < Date.parse(manifest.createdAt)
      || Date.parse(at) >= Date.parse(manifest.validUntil)
    ))
  ) throw new Error('GPU preapproval manifest is invalid, stale, or cross-plan.')
  return manifest
}

export function assertCanonicalProfessionalGpuPlanPublicationBinding(
  value: unknown,
): CanonicalProfessionalGpuPlanPublicationBinding {
  assertClosedPlainSerializedData(value, 'gpu_plan_publication_binding')
  const binding = canonicalProfessionalGpuPlanPublicationBindingSchema
    .parse(value)
  const { bindingHash, ...payload } = binding
  if (bindingHash !== sha256AuthorityValue(payload)) {
    throw new Error('GPU plan publication-binding hash is invalid.')
  }
  return binding
}

export function assertCanonicalProfessionalGpuPlanDispatchEstimateSet(
  value: unknown,
): CanonicalProfessionalGpuPlanDispatchEstimateSet {
  assertClosedPlainSerializedData(value, 'gpu_plan_dispatch_estimate_set')
  const set = canonicalProfessionalGpuPlanDispatchEstimateSetSchema.parse(value)
  const { estimateSetHash, ...payload } = set
  const exactEntries = set.entries.every((entry) => {
    const estimate = assertCanonicalProfessionalToolGpuCostEstimate(
      entry.estimate,
    )
    return estimate.scope.plannedWorkItemRef.contentHash ===
      entry.approvedWorkItemRef.contentHash
      && estimate.scope.plannedWorkItemRef.id === entry.approvedWorkItemRef.id
      && estimate.scope.plannedWorkItemRef.version ===
        entry.approvedWorkItemRef.version
      && estimate.scope.editPlanId === set.publishedPlanRef.id
      && estimate.scope.editPlanVersion === set.publishedPlanRef.version
      && `sha256:${estimate.scope.editPlanHash}` ===
        set.publishedPlanRef.contentHash
  })
  if (estimateSetHash !== sha256AuthorityValue(payload) || !exactEntries) {
    throw new Error('GPU plan dispatch-estimate set is invalid.')
  }
  return set
}

async function readCurrentRate(input: {
  readonly port: CanonicalProfessionalGpuPlanCurrentRateReadPort
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly region: 'us-central1' | 'europe-west4'
  readonly at: string
}): Promise<CanonicalProfessionalGoogleCloudGpuRateAuthority> {
  const untrusted = await input.port
    .rereadCurrentAccountEffectiveRateAuthority({
      routeId: input.routeId,
      region: input.region,
      at: input.at,
    })
  assertClosedPlainSerializedData(untrusted, 'gpu_current_rate')
  const rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
    untrusted,
    input.at,
  )
  if (rate.routeId !== input.routeId || rate.region !== input.region) {
    throw new Error('Current GPU rate differs from the requested route.')
  }
  return rate
}

function pricingClassFor(unit: z.infer<typeof pricingUnitSchema>) {
  const policy = assertCanonicalQualityFirstProfessionalToolGpuPlacement(
    createCanonicalQualityFirstProfessionalToolGpuPlacement(),
  )
  return policy.entries.find((entry) => entry.toolId === unit.toolId)
    ?.placementClass
}

function pricingOperationAuthority(toolId: z.infer<typeof toolIdSchema>): {
  operationId: string
  operationAuthorityDisposition:
    z.infer<typeof pricingUnitSchema>['operationAuthorityDisposition']
} | undefined {
  const operation = resolveCompleteProfessionalToolOperationSpec(toolId)
  if (operation?.allowedOperationIds.length === 1) {
    return {
      operationId: operation.allowedOperationIds[0],
      operationAuthorityDisposition:
        'canonical_production_operation_registered',
    }
  }
  if (toolId === 'sam3_1') {
    return {
      operationId: 'tool.sam3_1.segment_and_track_subject.v1',
      operationAuthorityDisposition:
        'sam3_1_candidate_operation_release_qualification_pending',
    }
  }
  return undefined
}

function nonpricedUnit(input: {
  workItem: CanonicalWorkItemInput
  toolId: z.infer<typeof toolIdSchema>
  operationId: string
  structuralDigest: string
  disposition: z.infer<typeof nonpricedToolUnitSchema>['disposition']
  parentGpuWorkItemKey: string | null
}): z.infer<typeof nonpricedToolUnitSchema> {
  return nonpricedToolUnitSchema.parse({
    workItemKey: input.workItem.workItemKey,
    workItemType: input.workItem.workItemType,
    workerClass: input.workItem.workerClass,
    toolId: input.toolId,
    operationId: input.operationId,
    workItemPricingStructureDigestSha256: input.structuralDigest,
    disposition: input.disposition,
    parentGpuWorkItemKey: input.parentGpuWorkItemKey,
  })
}

function workItemPricingStructure(workItem: CanonicalWorkItemInput) {
  const clone = structuredClone(workItem)
  return {
    ...clone,
    maximumCreditBudget: undefined,
  }
}

export function canonicalProfessionalGpuWorkItemPricingStructureDigest(
  workItem: CanonicalWorkItemInput,
) {
  return sha256AuthorityValue(workItemPricingStructure(workItem))
}

export function canonicalProfessionalGpuWorkGraphPricingStructureDigest(
  workItems: readonly CanonicalWorkItemInput[],
) {
  return sha256AuthorityValue([...workItems]
    .sort((left, right) => utf16Compare(left.workItemKey, right.workItemKey))
    .map(workItemPricingStructure))
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function utf16Compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function assertClosedPlainSerializedData(
  value: unknown,
  label: string,
  state: {
    readonly seen: Set<object>
    entries: number
    characters: number
  } = { seen: new Set<object>(), entries: 0, characters: 0 },
  depth = 0,
): void {
  if (depth > 18) throw new Error(`${label} nesting is too deep.`)
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`${label} contains a non-finite number.`)
    }
    if (typeof value === 'string') {
      state.characters += value.length
      if (value.length > 16_384 || state.characters > 4_000_000) {
        throw new Error(`${label} string data is too large.`)
      }
    }
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${label} is not closed serialized data.`)
  }
  const object = value as object
  if (state.seen.has(object)) throw new Error(`${label} contains a cycle.`)
  state.seen.add(object)
  let prototype: object | null
  let keys: (string | symbol)[]
  try {
    prototype = Object.getPrototypeOf(object)
    keys = Reflect.ownKeys(object)
  } catch {
    throw new Error(`${label} cannot be inspected as plain data.`)
  }
  if (prototype !== Object.prototype && prototype !== Array.prototype) {
    throw new Error(`${label} is not a plain record or array.`)
  }
  if (keys.length > 1_024) throw new Error(`${label} has too many entries.`)
  state.entries += keys.length
  if (state.entries > 16_384) {
    throw new Error(`${label} serialized tree is too large.`)
  }
  for (const key of keys) {
    if (typeof key !== 'string') throw new Error(`${label} contains a symbol.`)
    let descriptor: PropertyDescriptor | undefined
    try {
      descriptor = Object.getOwnPropertyDescriptor(object, key)
    } catch {
      throw new Error(`${label} cannot inspect a property.`)
    }
    if (!descriptor || !('value' in descriptor)) {
      throw new Error(`${label} contains an accessor.`)
    }
    assertClosedPlainSerializedData(
      descriptor.value,
      `${label}.${key}`,
      state,
      depth + 1,
    )
  }
  state.seen.delete(object)
}
