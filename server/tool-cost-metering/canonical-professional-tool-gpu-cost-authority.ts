import { z } from 'zod'

import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from './canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
} from '../edit-architecture/canonical-quality-first-professional-tool-gpu-placement'
import {
  CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS,
  assertCanonicalQualityFirstUserTriggeredGpuPolicy,
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  ALL_PROFESSIONAL_TOOL_CATALOG_IDS,
  type ProfessionalToolCatalogId,
} from '../tool-registry'

export const CANONICAL_PROFESSIONAL_TOOL_GPU_COST_ESTIMATE_VERSION =
  'canonical-professional-tool-gpu-cost-estimate-v1' as const
export const CANONICAL_PROFESSIONAL_TOOL_GPU_ATTEMPT_COST_RECEIPT_VERSION =
  'canonical-professional-tool-gpu-attempt-cost-receipt-v1' as const

const USD_NANOS_PER_CREDIT = 100_000_000
const BYTES_PER_GIB = 1024 ** 3
const THIRTY_DAY_MONTH_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
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

const estimateScopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  editPlanHash: sha256,
  outputId: safeId,
  operationId: safeId,
  plannedWorkItemRef: evidenceRefSchema,
  toolId: toolIdSchema,
  exactToolOrModelReleaseRef: evidenceRefSchema,
}).strict()

const usageSchema = z.object({
  coldStartMilliseconds: nonnegativeInteger,
  runtimeAndModelLoadMilliseconds: nonnegativeInteger,
  activeGpuMilliseconds: nonnegativeInteger,
  drainAndShutdownMilliseconds: nonnegativeInteger,
  totalBillableMilliseconds: positiveInteger,
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: positiveInteger,
  allocatedMemoryGiB: positiveInteger,
  allocatedLocalScratchGiB: nonnegativeInteger,
  privateArtifactBytes: nonnegativeInteger,
  privateArtifactRetentionMilliseconds: nonnegativeInteger,
  networkEgressBytes: nonnegativeInteger,
  classAOperationCount: nonnegativeInteger,
  classBOperationCount: nonnegativeInteger,
}).strict().superRefine((usage, context) => {
  if (usage.totalBillableMilliseconds !==
    usage.coldStartMilliseconds
      + usage.runtimeAndModelLoadMilliseconds
      + usage.activeGpuMilliseconds
      + usage.drainAndShutdownMilliseconds) {
    context.addIssue({
      code: 'custom',
      message: 'GPU usage must meter cold start, load, work, and shutdown.',
    })
  }
})

export const canonicalProfessionalToolGpuUsageSchema = usageSchema

export const canonicalProfessionalGpuInfrastructureCostSchema = z.object({
  acceleratorOrMachineUsdNanos: nonnegativeInteger,
  vcpuUsdNanos: nonnegativeInteger,
  memoryUsdNanos: nonnegativeInteger,
  privateStorageUsdNanos: nonnegativeInteger,
  networkEgressUsdNanos: nonnegativeInteger,
  classAOperationsUsdNanos: nonnegativeInteger,
  classBOperationsUsdNanos: nonnegativeInteger,
  totalInfrastructureCostUsdNanos: nonnegativeInteger,
}).strict().superRefine((cost, context) => {
  const total = cost.acceleratorOrMachineUsdNanos
    + cost.vcpuUsdNanos
    + cost.memoryUsdNanos
    + cost.privateStorageUsdNanos
    + cost.networkEgressUsdNanos
    + cost.classAOperationsUsdNanos
    + cost.classBOperationsUsdNanos
  if (total !== cost.totalInfrastructureCostUsdNanos) context.addIssue({
    code: 'custom',
    message: 'GPU infrastructure component costs do not reconcile.',
  })
})

const costBreakdownSchema = canonicalProfessionalGpuInfrastructureCostSchema

const estimatePointSchema = z.object({
  usage: usageSchema,
  cost: costBreakdownSchema,
}).strict()

const routeEstimateSchema = z.object({
  routeId: routeIdSchema,
  rateAuthorityRef: evidenceRefSchema,
  rateObservedAt: timestamp,
  rateExpiresAt: timestamp,
  low: estimatePointSchema,
  expected: estimatePointSchema,
  high: estimatePointSchema,
}).strict().superRefine((route, context) => {
  const totals = [
    route.low.cost.totalInfrastructureCostUsdNanos,
    route.expected.cost.totalInfrastructureCostUsdNanos,
    route.high.cost.totalInfrastructureCostUsdNanos,
  ]
  if (!ordered(totals)) context.addIssue({
    code: 'custom',
    message: 'GPU route estimate must be ordered low, expected, and high.',
  })
})

const estimateWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_TOOL_GPU_COST_ESTIMATE_VERSION,
  ),
  source: z.literal('canonical_server_professional_tool_gpu_cost_owner'),
  estimateId: safeId,
  scope: estimateScopeSchema,
  toolCostProfileId: safeId,
  modelOrOperationCostProfileId: z.enum(
    CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS,
  ),
  placementClass: z.enum([
    'l4_standard_gpu_primary',
    'a100_80gb_heavy_primary_l4_fallback',
  ]),
  gpuImplementationDisposition: z.enum([
    'declared_gpu_route_release_qualification_pending',
    'gpu_successor_implementation_required',
  ]),
  placementPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-professional-tool-gpu-placement-v1',
    ),
    policyHash: sha256,
    entryHash: sha256,
  }).strict(),
  gpuPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v2',
    ),
    policyHash: sha256,
  }).strict(),
  primary: routeEstimateSchema,
  fallback: routeEstimateSchema.nullable(),
  fallbackContingency: z.object({
    onlyServerClassifiedPreInferencePrimaryFailureMayStartFallback:
      z.literal(true),
    unknownPrimaryOutcomeMayStartFallback: z.literal(false),
    primaryFailureCostChargedToCustomer: z.literal(false),
    primaryPreInferenceFailureHighCostUsdNanos: nonnegativeInteger,
    fallbackHighCostUsdNanos: nonnegativeInteger,
    maximumCombinedPlatformRiskUsdNanos: nonnegativeInteger,
  }).strict().nullable(),
  maximumCustomerEligibleToolCostUsdNanos: nonnegativeInteger,
  maximumPlatformInfrastructureRiskUsdNanos: nonnegativeInteger,
  maximumReservedToolCostCredits: nonnegativeInteger,
  creditValueUsdNanos: z.literal(USD_NANOS_PER_CREDIT),
  serviceFeeIncluded: z.literal(false),
  currentSkuRegionCurrencyTierAndAccountPriceReread: z.literal(true),
  userApprovalRequired: z.literal(true),
  fundedReservationRequiredBeforeGpuJobCreation: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  terminalAttemptScaleBackToZeroRequired: z.literal(true),
  unapprovedOverageChargedToCustomer: z.literal(false),
  reeditproSystemFailureChargedToCustomer: z.literal(false),
  runtimeAdmissionGranted: z.literal(false),
  walletOrLedgerMutationPerformed: z.literal(false),
  createdAt: timestamp,
}).strict().superRefine((estimate, context) => {
  const heavy = estimate.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const primaryHigh = estimate.primary.high.cost
    .totalInfrastructureCostUsdNanos
  const fallbackHigh = estimate.fallback?.high.cost
    .totalInfrastructureCostUsdNanos ?? 0
  const platformRisk = heavy
    ? Math.max(
        primaryHigh,
        (estimate.fallbackContingency
          ?.primaryPreInferenceFailureHighCostUsdNanos ?? 0) + fallbackHigh,
      )
    : primaryHigh
  const customerCeiling = heavy
    ? Math.max(primaryHigh, fallbackHigh)
    : primaryHigh
  const exactHeavy = estimate.primary.routeId === 'a100_80gb_heavy_primary'
    && estimate.fallback?.routeId === 'l4_heavy_fallback'
    && estimate.fallbackContingency !== null
    && estimate.fallbackContingency.fallbackHighCostUsdNanos === fallbackHigh
    && estimate.fallbackContingency.maximumCombinedPlatformRiskUsdNanos ===
      (estimate.fallbackContingency
        .primaryPreInferenceFailureHighCostUsdNanos + fallbackHigh)
  const exactStandard = estimate.primary.routeId === 'l4_standard_primary'
    && estimate.fallback === null
    && estimate.fallbackContingency === null
  if (
    estimate.toolCostProfileId !== `gpu-tool-${estimate.scope.toolId}-v1`
    || estimate.modelOrOperationCostProfileId !==
      modelOrOperationCostProfileForTool(estimate.scope.toolId)
    || (heavy ? !exactHeavy : !exactStandard)
    || estimate.maximumCustomerEligibleToolCostUsdNanos !== customerCeiling
    || estimate.maximumPlatformInfrastructureRiskUsdNanos !== platformRisk
    || estimate.maximumReservedToolCostCredits !==
      creditsForUsdNanos(customerCeiling)
  ) context.addIssue({
    code: 'custom',
    message: 'GPU estimate lost its route, fallback, risk, or credit boundary.',
  })
})

export const canonicalProfessionalToolGpuCostEstimateSchema =
  estimateWithoutHashSchema.extend({ estimateHash: sha256 }).strict()
export type CanonicalProfessionalToolGpuCostEstimate = z.infer<
  typeof canonicalProfessionalToolGpuCostEstimateSchema
>

const safePrimaryFailureClassSchema = z.enum([
  'not_applicable',
  'a100_capacity_unavailable_before_attempt_start',
  'a100_job_boot_failed_before_private_media_read',
  'a100_runtime_qualification_blocked_before_dispatch',
  'a100_driver_or_cuda_incompatible_before_model_load',
])

const attemptReceiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_TOOL_GPU_ATTEMPT_COST_RECEIPT_VERSION,
  ),
  source: z.literal('canonical_server_professional_tool_gpu_attempt_cost_owner'),
  receiptId: safeId,
  estimateRef: evidenceRefSchema,
  scope: estimateScopeSchema,
  approvedSnapshotRef: evidenceRefSchema,
  approvalRecordRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  executionAttemptId: safeId,
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  routeId: routeIdSchema,
  rateAuthorityRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  platformUsageRereadRef: evidenceRefSchema,
  priorPrimaryFailureReceiptRef: evidenceRefSchema.nullable(),
  priorPrimaryFailureClass: safePrimaryFailureClassSchema,
  providerOrModelInferenceOutcome: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
  actualUsage: usageSchema,
  actualInfrastructureCost: costBreakdownSchema,
  terminalOutcome: z.enum([
    'completed',
    'reeditpro_failed',
    'user_canceled',
    'unknown_requires_reconciliation',
  ]),
  customerEligibleInfrastructureCostUsdNanos: nonnegativeInteger,
  reeditproAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  approvedReservedToolCostCredits: nonnegativeInteger,
  customerEligibleToolCostCredits: nonnegativeInteger,
  creditsRecommendedToReleaseOrRefund: nonnegativeInteger,
  creditsRecommendedToHoldPendingReconciliation: nonnegativeInteger,
  reservationResolution: z.enum([
    'charge_eligible_and_release_unused',
    'release_or_refund_full_reservation',
    'hold_without_charge_until_canonical_reconciliation',
  ]),
  unknownOutcomeBlocksRetry: z.boolean(),
  unapprovedOverageAbsorbedByReeditpro: z.literal(true),
  failedCanceledOrUnknownCostChargedToCustomer: z.literal(false),
  workerSuppliedPricingAccepted: z.literal(false),
  exactPlatformUsageAndCurrentRateReread: z.literal(true),
  cloudBillingInvoiceReconciliationRequired: z.literal(true),
  createOnlyPersistenceRequired: z.literal(true),
  terminalAttemptStoppedWorker: z.literal(true),
  minimumIdleGpuInstancesAfterTerminalAttempt: z.literal(0),
  walletOrLedgerMutationPerformed: z.literal(false),
  settlementOwnerMustReconcileBeforeMutation: z.literal(true),
  attemptStartedAt: timestamp,
  recordedAt: timestamp,
}).strict().superRefine((receipt, context) => {
  const actual = receipt.actualInfrastructureCost
    .totalInfrastructureCostUsdNanos
  const ceiling = receipt.approvedReservedToolCostCredits
    * USD_NANOS_PER_CREDIT
  const completed = receipt.terminalOutcome === 'completed'
  const unknown = receipt.terminalOutcome === 'unknown_requires_reconciliation'
    || receipt.providerOrModelInferenceOutcome === 'unknown'
  const eligible = completed && !unknown ? Math.min(actual, ceiling) : 0
  const eligibleCredits = creditsForUsdNanos(eligible)
  const release = completed && !unknown
    ? receipt.approvedReservedToolCostCredits - eligibleCredits
    : unknown ? 0 : receipt.approvedReservedToolCostCredits
  const hold = unknown ? receipt.approvedReservedToolCostCredits : 0
  const resolution = unknown
    ? 'hold_without_charge_until_canonical_reconciliation'
    : completed
      ? 'charge_eligible_and_release_unused'
      : 'release_or_refund_full_reservation'
  const fallback = receipt.routeId === 'l4_heavy_fallback'
  const exactFallback = fallback
    ? receipt.attemptOrdinal === 2
      && receipt.priorPrimaryFailureReceiptRef !== null
      && receipt.priorPrimaryFailureClass !== 'not_applicable'
    : receipt.attemptOrdinal === 1
      && receipt.priorPrimaryFailureReceiptRef === null
      && receipt.priorPrimaryFailureClass === 'not_applicable'
  const exactCompletedOutcome = !completed
    || receipt.providerOrModelInferenceOutcome === 'executed'
  if (
    !exactFallback
    || !exactCompletedOutcome
    || receipt.customerEligibleInfrastructureCostUsdNanos !== eligible
    || receipt.reeditproAbsorbedInfrastructureCostUsdNanos !== actual - eligible
    || receipt.customerEligibleToolCostCredits !== eligibleCredits
    || receipt.creditsRecommendedToReleaseOrRefund !== release
    || receipt.creditsRecommendedToHoldPendingReconciliation !== hold
    || receipt.reservationResolution !== resolution
    || receipt.unknownOutcomeBlocksRetry !== unknown
    || Date.parse(receipt.recordedAt) < Date.parse(receipt.attemptStartedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'GPU receipt lost cost, fallback, refund, or retry reconciliation.',
  })
})

export const canonicalProfessionalToolGpuAttemptCostReceiptSchema =
  attemptReceiptWithoutHashSchema.extend({ receiptHash: sha256 }).strict()
export type CanonicalProfessionalToolGpuAttemptCostReceipt = z.infer<
  typeof canonicalProfessionalToolGpuAttemptCostReceiptSchema
>

export type CanonicalProfessionalToolGpuUsage = z.input<typeof usageSchema>
export type CanonicalProfessionalGpuInfrastructureCost = z.infer<
  typeof canonicalProfessionalGpuInfrastructureCostSchema
>
export type CanonicalProfessionalToolGpuUsageRange = {
  readonly low: CanonicalProfessionalToolGpuUsage
  readonly expected: CanonicalProfessionalToolGpuUsage
  readonly high: CanonicalProfessionalToolGpuUsage
}

const costCalculationSchema = z.object({
  toolId: toolIdSchema,
  toolCostProfileId: safeId,
  modelOrOperationCostProfileId: z.enum(
    CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS,
  ),
  placementClass: z.enum([
    'l4_standard_gpu_primary',
    'a100_80gb_heavy_primary_l4_fallback',
  ]),
  gpuImplementationDisposition: z.enum([
    'declared_gpu_route_release_qualification_pending',
    'gpu_successor_implementation_required',
  ]),
  placementPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-professional-tool-gpu-placement-v1',
    ),
    policyHash: sha256,
    entryHash: sha256,
  }).strict(),
  gpuPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v2',
    ),
    policyHash: sha256,
  }).strict(),
  primary: routeEstimateSchema,
  fallback: routeEstimateSchema.nullable(),
  fallbackContingency: z.object({
    onlyServerClassifiedPreInferencePrimaryFailureMayStartFallback:
      z.literal(true),
    unknownPrimaryOutcomeMayStartFallback: z.literal(false),
    primaryFailureCostChargedToCustomer: z.literal(false),
    primaryPreInferenceFailureHighCostUsdNanos: nonnegativeInteger,
    fallbackHighCostUsdNanos: nonnegativeInteger,
    maximumCombinedPlatformRiskUsdNanos: nonnegativeInteger,
  }).strict().nullable(),
  maximumCustomerEligibleToolCostUsdNanos: nonnegativeInteger,
  maximumPlatformInfrastructureRiskUsdNanos: nonnegativeInteger,
  maximumReservedToolCostCredits: nonnegativeInteger,
  creditValueUsdNanos: z.literal(USD_NANOS_PER_CREDIT),
  serviceFeeIncluded: z.literal(false),
  currentSkuRegionCurrencyTierAndAccountPriceReread: z.literal(true),
  userApprovalRequired: z.literal(true),
  fundedReservationRequiredBeforeGpuJobCreation: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  terminalAttemptScaleBackToZeroRequired: z.literal(true),
  unapprovedOverageChargedToCustomer: z.literal(false),
  reeditproSystemFailureChargedToCustomer: z.literal(false),
  runtimeAdmissionGranted: z.literal(false),
  walletOrLedgerMutationPerformed: z.literal(false),
}).strict().superRefine((calculation, context) => {
  const heavy = calculation.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const primaryHigh = calculation.primary.high.cost
    .totalInfrastructureCostUsdNanos
  const fallbackHigh = calculation.fallback?.high.cost
    .totalInfrastructureCostUsdNanos ?? 0
  const customerCeiling = heavy
    ? Math.max(primaryHigh, fallbackHigh)
    : primaryHigh
  const platformRisk = heavy
    ? Math.max(
        primaryHigh,
        (calculation.fallbackContingency
          ?.primaryPreInferenceFailureHighCostUsdNanos ?? 0) + fallbackHigh,
      )
    : primaryHigh
  if (
    calculation.toolCostProfileId !==
      `gpu-tool-${calculation.toolId}-v1`
    || calculation.modelOrOperationCostProfileId !==
      modelOrOperationCostProfileForTool(calculation.toolId)
    || calculation.maximumCustomerEligibleToolCostUsdNanos !== customerCeiling
    || calculation.maximumPlatformInfrastructureRiskUsdNanos !== platformRisk
    || calculation.maximumReservedToolCostCredits !==
      creditsForUsdNanos(customerCeiling)
  ) context.addIssue({
    code: 'custom',
    message: 'GPU cost calculation lost its exact tool, ceiling, or risk.',
  })
})

export const canonicalProfessionalToolGpuCostCalculationSchema =
  costCalculationSchema
export type CanonicalProfessionalToolGpuCostCalculation = z.infer<
  typeof costCalculationSchema
>

export function calculateCanonicalProfessionalToolGpuCost(input: {
  readonly toolId: ProfessionalToolCatalogId
  readonly primaryRateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly primaryUsageRange: CanonicalProfessionalToolGpuUsageRange
  readonly fallbackRateAuthority?: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly fallbackUsageRange?: CanonicalProfessionalToolGpuUsageRange
  readonly primaryPreInferenceFailureHighUsage?:
    CanonicalProfessionalToolGpuUsage
  readonly createdAt: string
}): CanonicalProfessionalToolGpuCostCalculation {
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const gpuPolicy = assertCanonicalQualityFirstUserTriggeredGpuPolicy(
    createCanonicalQualityFirstUserTriggeredGpuPolicy(),
  )
  const placement = placementPolicy.entries.find((entry) =>
    entry.toolId === input.toolId)
  if (!placement) throw new Error('GPU tool placement is missing.')
  if (placement.placementClass !== 'l4_standard_gpu_primary'
    && placement.placementClass !==
      'a100_80gb_heavy_primary_l4_fallback') {
    throw new Error('Only substantive GPU tools receive standalone estimates.')
  }
  const heavy = placement.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
  const primaryRate = assertRateForRoute(
    input.primaryRateAuthority,
    heavy ? 'a100_80gb_heavy_primary' : 'l4_standard_primary',
    input.createdAt,
  )
  const fallbackRate = heavy
    ? assertRateForRoute(
        required(input.fallbackRateAuthority, 'Heavy fallback rate'),
        'l4_heavy_fallback',
        input.createdAt,
      )
    : undefined
  if ((!heavy && (input.fallbackRateAuthority
    || input.fallbackUsageRange
    || input.primaryPreInferenceFailureHighUsage))
    || (heavy && (!input.fallbackUsageRange
      || !input.primaryPreInferenceFailureHighUsage))) {
    throw new Error('GPU estimate fallback inputs do not match tool placement.')
  }
  if (fallbackRate && (
    fallbackRate.region !== primaryRate.region
    || stableAuthorityStringify(
      fallbackRate.billingAccountPricingScopeRef,
    ) !== stableAuthorityStringify(
      primaryRate.billingAccountPricingScopeRef,
    )
    || stableAuthorityStringify(
      fallbackRate.pricingReaderConfigurationRef,
    ) !== stableAuthorityStringify(
      primaryRate.pricingReaderConfigurationRef,
    )
  )) {
    throw new Error(
      'Heavy primary and fallback rates must use one billing account, reader, and region.',
    )
  }
  const primary = createRouteEstimate(
    primaryRate,
    input.primaryUsageRange,
  )
  const fallback = heavy
    ? createRouteEstimate(
        fallbackRate as CanonicalCurrentGoogleCloudGpuRateAuthority,
        input.fallbackUsageRange as CanonicalProfessionalToolGpuUsageRange,
      )
    : null
  const primaryFailure = heavy
    ? usageForRoute(
        input.primaryPreInferenceFailureHighUsage as
          CanonicalProfessionalToolGpuUsage,
        'a100_80gb_heavy_primary',
      )
    : null
  if (primaryFailure && (
    primaryFailure.runtimeAndModelLoadMilliseconds !== 0
    || primaryFailure.activeGpuMilliseconds !== 0
    || primaryFailure.networkEgressBytes !== 0
  )) throw new Error(
    'Fallback contingency must stop before model load, inference, or egress.',
  )
  const primaryFailureCost = primaryFailure
    ? costFor(primaryRate, primaryFailure)
    : null
  const primaryHigh = primary.high.cost.totalInfrastructureCostUsdNanos
  const fallbackHigh = fallback?.high.cost.totalInfrastructureCostUsdNanos ?? 0
  const customerCeiling = heavy
    ? Math.max(primaryHigh, fallbackHigh)
    : primaryHigh
  const combinedRisk = (primaryFailureCost
    ?.totalInfrastructureCostUsdNanos ?? 0) + fallbackHigh
  const platformRisk = heavy
    ? Math.max(primaryHigh, combinedRisk)
    : primaryHigh
  return costCalculationSchema.parse({
    toolId: input.toolId,
    toolCostProfileId: placement.costProfileId,
    modelOrOperationCostProfileId:
      modelOrOperationCostProfileForTool(input.toolId),
    placementClass: placement.placementClass,
    gpuImplementationDisposition: placement.gpuImplementationDisposition,
    placementPolicyRef: {
      schemaVersion: placementPolicy.schemaVersion,
      policyHash: placementPolicy.policyHash,
      entryHash: placement.entryHash,
    },
    gpuPolicyRef: {
      schemaVersion: gpuPolicy.schemaVersion,
      policyHash: gpuPolicy.policyHash,
    },
    primary,
    fallback,
    fallbackContingency: heavy ? {
      onlyServerClassifiedPreInferencePrimaryFailureMayStartFallback: true,
      unknownPrimaryOutcomeMayStartFallback: false,
      primaryFailureCostChargedToCustomer: false,
      primaryPreInferenceFailureHighCostUsdNanos:
        primaryFailureCost?.totalInfrastructureCostUsdNanos,
      fallbackHighCostUsdNanos: fallbackHigh,
      maximumCombinedPlatformRiskUsdNanos: combinedRisk,
    } : null,
    maximumCustomerEligibleToolCostUsdNanos: customerCeiling,
    maximumPlatformInfrastructureRiskUsdNanos: platformRisk,
    maximumReservedToolCostCredits: creditsForUsdNanos(customerCeiling),
    creditValueUsdNanos: USD_NANOS_PER_CREDIT,
    serviceFeeIncluded: false,
    currentSkuRegionCurrencyTierAndAccountPriceReread: true,
    userApprovalRequired: true,
    fundedReservationRequiredBeforeGpuJobCreation: true,
    userTriggeredScaleFromZeroRequired: true,
    terminalAttemptScaleBackToZeroRequired: true,
    unapprovedOverageChargedToCustomer: false,
    reeditproSystemFailureChargedToCustomer: false,
    runtimeAdmissionGranted: false,
    walletOrLedgerMutationPerformed: false,
  })
}

export function createCanonicalProfessionalToolGpuCostEstimate(input: {
  readonly estimateId: string
  readonly scope: z.input<typeof estimateScopeSchema>
  readonly primaryRateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly primaryUsageRange: CanonicalProfessionalToolGpuUsageRange
  readonly fallbackRateAuthority?: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly fallbackUsageRange?: CanonicalProfessionalToolGpuUsageRange
  readonly primaryPreInferenceFailureHighUsage?:
    CanonicalProfessionalToolGpuUsage
  readonly createdAt: string
}): CanonicalProfessionalToolGpuCostEstimate {
  const scope = estimateScopeSchema.parse(input.scope)
  const calculation = calculateCanonicalProfessionalToolGpuCost({
    toolId: scope.toolId,
    primaryRateAuthority: input.primaryRateAuthority,
    primaryUsageRange: input.primaryUsageRange,
    fallbackRateAuthority: input.fallbackRateAuthority,
    fallbackUsageRange: input.fallbackUsageRange,
    primaryPreInferenceFailureHighUsage:
      input.primaryPreInferenceFailureHighUsage,
    createdAt: input.createdAt,
  })
  return createCanonicalProfessionalToolGpuCostEstimateFromCalculation({
    estimateId: input.estimateId,
    scope,
    calculation,
    createdAt: input.createdAt,
  })
}

export function createCanonicalProfessionalToolGpuCostEstimateFromCalculation(
  input: {
    readonly estimateId: string
    readonly scope: z.input<typeof estimateScopeSchema>
    readonly calculation: CanonicalProfessionalToolGpuCostCalculation
    readonly createdAt: string
  },
): CanonicalProfessionalToolGpuCostEstimate {
  const scope = estimateScopeSchema.parse(input.scope)
  const calculation = canonicalProfessionalToolGpuCostCalculationSchema
    .parse(input.calculation)
  const { toolId: calculatedToolId, ...costFields } = calculation
  if (calculatedToolId !== scope.toolId) {
    throw new Error('GPU cost calculation changed its exact tool identity.')
  }
  const payload = estimateWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_TOOL_GPU_COST_ESTIMATE_VERSION,
    source: 'canonical_server_professional_tool_gpu_cost_owner',
    estimateId: input.estimateId,
    scope,
    ...costFields,
    createdAt: input.createdAt,
  })
  return canonicalProfessionalToolGpuCostEstimateSchema.parse({
    ...payload,
    estimateHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalToolGpuCostEstimate(
  value: unknown,
): CanonicalProfessionalToolGpuCostEstimate {
  const parsed = canonicalProfessionalToolGpuCostEstimateSchema.parse(value)
  const { estimateHash, ...payload } = parsed
  if (estimateHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU tool cost estimate hash is invalid.')
  }
  return parsed
}

export function createCanonicalProfessionalToolGpuAttemptCostReceipt(input: {
  readonly receiptId: string
  readonly estimate: CanonicalProfessionalToolGpuCostEstimate
  readonly approvedSnapshotRef: z.input<typeof evidenceRefSchema>
  readonly approvalRecordRef: z.input<typeof evidenceRefSchema>
  readonly fundedReservationRef: z.input<typeof evidenceRefSchema>
  readonly executionAttemptId: string
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly rateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly workerUsageEvidenceRef: z.input<typeof evidenceRefSchema>
  readonly platformUsageRereadRef: z.input<typeof evidenceRefSchema>
  readonly priorPrimaryFailureReceiptRef?: z.input<typeof evidenceRefSchema>
  readonly priorPrimaryFailureClass?: z.infer<
    typeof safePrimaryFailureClassSchema
  >
  readonly providerOrModelInferenceOutcome:
    'executed' | 'not_executed' | 'unknown'
  readonly actualUsage: CanonicalProfessionalToolGpuUsage
  readonly terminalOutcome:
    | 'completed'
    | 'reeditpro_failed'
    | 'user_canceled'
    | 'unknown_requires_reconciliation'
  readonly attemptStartedAt: string
  readonly recordedAt: string
}): CanonicalProfessionalToolGpuAttemptCostReceipt {
  const estimate = assertCanonicalProfessionalToolGpuCostEstimate(
    input.estimate,
  )
  const allowedRoutes = estimate.placementClass ===
    'a100_80gb_heavy_primary_l4_fallback'
    ? ['a100_80gb_heavy_primary', 'l4_heavy_fallback'] as const
    : ['l4_standard_primary'] as const
  if (!(allowedRoutes as readonly string[]).includes(input.routeId)) {
    throw new Error('GPU attempt route is outside the approved estimate.')
  }
  const rate = assertRateForRoute(
    input.rateAuthority,
    input.routeId,
    input.attemptStartedAt,
  )
  const approvedRoute = input.routeId === 'l4_heavy_fallback'
    ? estimate.fallback
    : estimate.primary
  if (!approvedRoute
    || approvedRoute.rateAuthorityRef.contentHash !==
      `sha256:${rate.rateAuthorityHash}`) {
    throw new Error('GPU attempt rate is not the approved route rate.')
  }
  const usage = usageForRoute(input.actualUsage, input.routeId)
  if (
    input.terminalOutcome === 'completed'
    && input.providerOrModelInferenceOutcome !== 'executed'
  ) throw new Error(
    'A completed GPU attempt requires verified substantive execution.',
  )
  const cost = costFor(rate, usage)
  const unknown = input.terminalOutcome === 'unknown_requires_reconciliation'
    || input.providerOrModelInferenceOutcome === 'unknown'
  const completed = input.terminalOutcome === 'completed' && !unknown
  const ceiling = estimate.maximumReservedToolCostCredits
    * USD_NANOS_PER_CREDIT
  const eligible = completed
    ? Math.min(cost.totalInfrastructureCostUsdNanos, ceiling)
    : 0
  const eligibleCredits = creditsForUsdNanos(eligible)
  const release = completed
    ? estimate.maximumReservedToolCostCredits - eligibleCredits
    : unknown ? 0 : estimate.maximumReservedToolCostCredits
  const payload = attemptReceiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_TOOL_GPU_ATTEMPT_COST_RECEIPT_VERSION,
    source: 'canonical_server_professional_tool_gpu_attempt_cost_owner',
    receiptId: input.receiptId,
    estimateRef: ref(estimate.estimateId, estimate.estimateHash),
    scope: estimate.scope,
    approvedSnapshotRef: input.approvedSnapshotRef,
    approvalRecordRef: input.approvalRecordRef,
    fundedReservationRef: input.fundedReservationRef,
    executionAttemptId: input.executionAttemptId,
    attemptOrdinal: input.routeId === 'l4_heavy_fallback' ? 2 : 1,
    routeId: input.routeId,
    rateAuthorityRef: ref(
      rate.rateAuthorityId,
      rate.rateAuthorityHash,
      rate.rateAuthorityVersion,
    ),
    workerUsageEvidenceRef: input.workerUsageEvidenceRef,
    platformUsageRereadRef: input.platformUsageRereadRef,
    priorPrimaryFailureReceiptRef:
      input.priorPrimaryFailureReceiptRef ?? null,
    priorPrimaryFailureClass:
      input.priorPrimaryFailureClass ?? 'not_applicable',
    providerOrModelInferenceOutcome: input.providerOrModelInferenceOutcome,
    actualUsage: usage,
    actualInfrastructureCost: cost,
    terminalOutcome: input.terminalOutcome,
    customerEligibleInfrastructureCostUsdNanos: eligible,
    reeditproAbsorbedInfrastructureCostUsdNanos:
      cost.totalInfrastructureCostUsdNanos - eligible,
    approvedReservedToolCostCredits:
      estimate.maximumReservedToolCostCredits,
    customerEligibleToolCostCredits: eligibleCredits,
    creditsRecommendedToReleaseOrRefund: release,
    creditsRecommendedToHoldPendingReconciliation: unknown
      ? estimate.maximumReservedToolCostCredits
      : 0,
    reservationResolution: unknown
      ? 'hold_without_charge_until_canonical_reconciliation'
      : completed
        ? 'charge_eligible_and_release_unused'
        : 'release_or_refund_full_reservation',
    unknownOutcomeBlocksRetry: unknown,
    unapprovedOverageAbsorbedByReeditpro: true,
    failedCanceledOrUnknownCostChargedToCustomer: false,
    workerSuppliedPricingAccepted: false,
    exactPlatformUsageAndCurrentRateReread: true,
    cloudBillingInvoiceReconciliationRequired: true,
    createOnlyPersistenceRequired: true,
    terminalAttemptStoppedWorker: true,
    minimumIdleGpuInstancesAfterTerminalAttempt: 0,
    walletOrLedgerMutationPerformed: false,
    settlementOwnerMustReconcileBeforeMutation: true,
    attemptStartedAt: input.attemptStartedAt,
    recordedAt: input.recordedAt,
  })
  return canonicalProfessionalToolGpuAttemptCostReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalToolGpuAttemptCostReceipt(
  value: unknown,
): CanonicalProfessionalToolGpuAttemptCostReceipt {
  const parsed = canonicalProfessionalToolGpuAttemptCostReceiptSchema
    .parse(value)
  const { receiptHash, ...payload } = parsed
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU tool attempt receipt hash is invalid.')
  }
  return parsed
}

function createRouteEstimate(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
  range: CanonicalProfessionalToolGpuUsageRange,
): z.infer<typeof routeEstimateSchema> {
  const point = (usageInput: CanonicalProfessionalToolGpuUsage) => {
    const usage = usageForRoute(usageInput, rate.routeId)
    return { usage, cost: costFor(rate, usage) }
  }
  return routeEstimateSchema.parse({
    routeId: rate.routeId,
    rateAuthorityRef: ref(
      rate.rateAuthorityId,
      rate.rateAuthorityHash,
      rate.rateAuthorityVersion,
    ),
    rateObservedAt: rate.observedAt,
    rateExpiresAt: rate.expiresAt,
    low: point(range.low),
    expected: point(range.expected),
    high: point(range.high),
  })
}

function usageForRoute(
  input: CanonicalProfessionalToolGpuUsage,
  routeId: z.infer<typeof routeIdSchema>,
): z.infer<typeof usageSchema> {
  const usage = usageSchema.parse(input)
  const a100 = routeId === 'a100_80gb_heavy_primary'
  const exactAllocation = a100
    ? usage.allocatedVcpuCount === 12
      && usage.allocatedMemoryGiB === 170
      && usage.allocatedLocalScratchGiB === 375
    : usage.allocatedVcpuCount === 8
      && usage.allocatedMemoryGiB === 32
      && usage.allocatedLocalScratchGiB === 0
  if (!exactAllocation) throw new Error(
    'GPU usage does not match the canonical route allocation.',
  )
  return usage
}

function costFor(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
  usage: z.infer<typeof usageSchema>,
): z.infer<typeof costBreakdownSchema> {
  const component = (
    name: CanonicalCurrentGoogleCloudGpuRateAuthority['components'][number]['componentClass'],
  ) => {
    const found = rate.components.find((item) => item.componentClass === name)
    if (!found) throw new Error(`GPU rate component is missing: ${name}`)
    return found.maximumUsdNanosPerBillingUnit
  }
  const a100 = rate.routeId === 'a100_80gb_heavy_primary'
  const acceleratorOrMachineUsdNanos = a100
    ? ceilProductDivision(
        component('a2_ultragpu_1g_machine_bundle'),
        usage.totalBillableMilliseconds,
        1,
        60 * 60 * 1_000,
      )
    : ceilProductDivision(
        component('cloud_run_l4_gpu_second'),
        usage.totalBillableMilliseconds,
        usage.allocatedGpuCount,
        1_000,
      )
  const vcpuUsdNanos = a100 ? 0 : ceilProductDivision(
    component('cloud_run_vcpu_second'),
    usage.totalBillableMilliseconds,
    usage.allocatedVcpuCount,
    1_000,
  )
  const memoryUsdNanos = a100 ? 0 : ceilProductDivision(
    component('cloud_run_memory_gib_second'),
    usage.totalBillableMilliseconds,
    usage.allocatedMemoryGiB,
    1_000,
  )
  const privateStorageUsdNanos = ceilProductDivision(
    component('private_object_storage_gib_month'),
    usage.privateArtifactBytes,
    usage.privateArtifactRetentionMilliseconds,
    BYTES_PER_GIB * THIRTY_DAY_MONTH_MILLISECONDS,
  )
  const networkEgressUsdNanos = ceilProductDivision(
    component('network_egress_gib'),
    usage.networkEgressBytes,
    1,
    BYTES_PER_GIB,
  )
  const classAOperationsUsdNanos = ceilProductDivision(
    component('object_class_a_per_1000'),
    usage.classAOperationCount,
    1,
    1_000,
  )
  const classBOperationsUsdNanos = ceilProductDivision(
    component('object_class_b_per_1000'),
    usage.classBOperationCount,
    1,
    1_000,
  )
  return costBreakdownSchema.parse({
    acceleratorOrMachineUsdNanos,
    vcpuUsdNanos,
    memoryUsdNanos,
    privateStorageUsdNanos,
    networkEgressUsdNanos,
    classAOperationsUsdNanos,
    classBOperationsUsdNanos,
    totalInfrastructureCostUsdNanos:
      acceleratorOrMachineUsdNanos
      + vcpuUsdNanos
      + memoryUsdNanos
      + privateStorageUsdNanos
      + networkEgressUsdNanos
      + classAOperationsUsdNanos
      + classBOperationsUsdNanos,
  })
}

/**
 * Shared exact infrastructure-cost calculation for canonical GPU attempt
 * owners, including platform-funded preapproval analysis. This function does
 * not create a customer settlement or mutate credits.
 */
export function calculateCanonicalProfessionalGpuInfrastructureCost(input: {
  readonly rateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly usage: CanonicalProfessionalToolGpuUsage
  readonly observedAt: string
}): CanonicalProfessionalGpuInfrastructureCost {
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.rateAuthority,
    input.observedAt,
  )
  return costFor(rate, usageForRoute(input.usage, rate.routeId))
}

function assertRateForRoute(
  value: CanonicalCurrentGoogleCloudGpuRateAuthority,
  routeId: z.infer<typeof routeIdSchema>,
  at: string,
): CanonicalCurrentGoogleCloudGpuRateAuthority {
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(value, at)
  if (rate.routeId !== routeId) throw new Error(
    'Current cloud rate does not match the required GPU route.',
  )
  return rate
}

function ceilProductDivision(
  left: number,
  middle: number,
  right: number,
  divisor: number,
): number {
  const numerator = BigInt(left) * BigInt(middle) * BigInt(right)
  const quotient = (numerator + BigInt(divisor) - 1n) / BigInt(divisor)
  const result = Number(quotient)
  if (!Number.isSafeInteger(result) || result < 0) throw new Error(
    'GPU cost calculation exceeded safe integer bounds.',
  )
  return result
}

function creditsForUsdNanos(usdNanos: number): number {
  return usdNanos === 0 ? 0 : Math.ceil(usdNanos / USD_NANOS_PER_CREDIT)
}

function ordered(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0
    || value >= values[index - 1])
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`${label} is required.`)
  return value
}

export function canonicalProfessionalToolGpuCostAuthorityEqual(
  left: unknown,
  right: unknown,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

export function professionalGpuToolCostProfileId(
  toolId: ProfessionalToolCatalogId,
): string {
  return `gpu-tool-${toolId}-v1`
}

export function modelOrOperationCostProfileForTool(
  toolId: ProfessionalToolCatalogId,
): (typeof CANONICAL_QUALITY_FIRST_MODEL_COST_PROFILE_IDS)[number] {
  if (toolId === 'sam3_1') {
    return 'sam3_1_multiplex_video_segmentation_v1'
  }
  if (toolId === 'faster_whisper') {
    return 'faster_whisper_large_v3_source_transcription_v2'
  }
  if (toolId === 'stable_audio_3_small_sfx') {
    return 'stable_audio_3_small_sfx_generation_v1'
  }
  if (toolId === 'comfyui') return 'comfyui_controlled_image_v1'
  if (toolId === 'birefnet') return 'birefnet_foreground_extraction_v1'
  if (toolId === 'real_esrgan') return 'real_esrgan_enhancement_v1'
  if (toolId === 'film') return 'film_frame_interpolation_v1'
  return 'l4_standard_media_render_and_qa_v1'
}
