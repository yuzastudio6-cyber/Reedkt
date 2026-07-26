import { createHash } from 'node:crypto'

import {
  REEDITPRO_REASONING_FALLBACK_TRIGGERS,
  REEDITPRO_REASONING_MODEL_ROUTE_IDS,
  type ReEditProReasoningFallbackTrigger,
  type ReEditProReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'
import {
  getReEditProReasoningModelRoute,
  REEDITPRO_REASONING_MODEL_ROUTE_CHAIN,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  calculateReasoningModelInternalCost,
} from './cost-math'
import {
  getReasoningModelRateCardEntry,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
} from './rate-card'
import type {
  ReasoningModelCostCurrency,
  ReasoningModelCostResult,
  ReasoningModelFxSnapshot,
  ReasoningModelInternalCostCalculation,
  ReasoningModelTokenUsage,
} from './types'

export const REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION =
  'reeditpro-reasoning-workload-authority-v2' as const

export const REEDITPRO_REASONING_ATTEMPT_COST_EVIDENCE_V2_VERSION =
  'reasoning-model-attempt-cost-evidence-v2' as const
export const LIVING_FRAME_CONTROLLED_INTERNAL_BUDGET_ADMISSION_VERSION =
  'living-frame-controlled-internal-budget-admission-v1' as const

export interface PrePlanEditReferenceStudyChatReasoningAuthority {
  readonly schemaVersion: typeof REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION
  readonly authorityClass: 'pre_plan_edit_reference_study_chat'
  readonly sourceAuthority: 'canonical_edit_reference_repository'
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly reasoningRequestDigestSha256: string
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly approvalAuthority: 'server_pre_plan_study_usage_approval'
  readonly approvedPlanSnapshotFabricated: false
  readonly creditReservationFabricated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly authorityDigestSha256: string
}

export interface CreatePrePlanEditReferenceStudyChatReasoningAuthorityInput {
  readonly workspaceId: string
  readonly actorUserId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly reasoningRequestDigestSha256: string
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
}

export interface LivingFrameControlledInternalBudgetAdmission {
  readonly schemaVersion:
    typeof LIVING_FRAME_CONTROLLED_INTERNAL_BUDGET_ADMISSION_VERSION
  readonly sourceAuthority:
    'canonical_living_frame_preapproval_reasoning_result_service'
  readonly evidenceClass:
    'controlled_non_promotable_internal_budget_admission'
  readonly budgetAdmissionId: string
  readonly budgetExpectationId: string
  readonly livingFramePreapprovalInputAuthorityDigestSha256: string
  readonly rateCardVersion:
    typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
  readonly rateCardIdentityDigestSha256: string
  readonly denomination: 'normalized_usd_micros'
  readonly maximumAuthorizedInternalCostMicros: string
  readonly internalBudgetAdmissionControlled: true
  readonly providerTransportAuthorized: false
  readonly actualAttemptReceiptProvided: false
  readonly actualAttemptCostKnown: false
  readonly providerInvoiceReconciled: false
  readonly customerPriceCalculated: false
  readonly customerCreditsCalculated: false
  readonly customerChargeCreated: false
  readonly walletMutationMade: false
  readonly serviceFeeIncluded: false
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly admissionDigestSha256: string
}

export interface CreateLivingFrameControlledInternalBudgetAdmissionInput {
  readonly budgetAdmissionId: string
  readonly budgetExpectationId: string
  readonly livingFramePreapprovalInputAuthorityDigestSha256: string
  readonly rateCardIdentityDigestSha256: string
  readonly maximumAuthorizedInternalCostMicros: string
}

export interface PrePlanLivingFrameSemanticReasoningAuthority {
  readonly schemaVersion: typeof REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION
  readonly authorityClass: 'pre_plan_living_frame_semantic_reasoning'
  readonly sourceAuthority:
    'canonical_living_frame_preapproval_reasoning_result_service'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
  readonly livingFramePreapprovalInputAuthorityDigestSha256: string
  readonly planningEvidenceBindingDigestSha256: string
  readonly reasoningRequestDigestSha256: string
  readonly reasoningResultSchemaDigestSha256: string
  readonly routeContractVersion:
    typeof REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
  readonly orderedRouteIds: readonly [
    'kimi_k3_primary',
    'qwen_3_7_fallback',
    'deepseek_v4_pro_fallback',
  ]
  readonly routeIdentityDigestSha256: string
  readonly rateCardVersion:
    typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
  readonly rateCardIdentityDigestSha256: string
  readonly internalCostBudgetExpectationId: string
  readonly internalCostBudgetAdmissionId: string
  readonly internalCostBudgetAdmissionDigestSha256: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly approvalAuthority:
    'server_controlled_internal_budget_admission'
  readonly providerTransportAuthorized: false
  readonly approvedPlanSnapshotFabricated: false
  readonly creditReservationFabricated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly promotionAllowed: false
  readonly productionReady: false
  readonly authorityDigestSha256: string
}

export interface CreatePrePlanLivingFrameSemanticReasoningAuthorityInput {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly handoffId: string
  readonly livingFramePreapprovalInputAuthorityDigestSha256: string
  readonly planningEvidenceBindingDigestSha256: string
  readonly reasoningRequestDigestSha256: string
  readonly reasoningResultSchemaDigestSha256: string
  readonly routeContractVersion:
    typeof REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
  readonly orderedRouteIds: readonly [
    'kimi_k3_primary',
    'qwen_3_7_fallback',
    'deepseek_v4_pro_fallback',
  ]
  readonly routeIdentityDigestSha256: string
  readonly rateCardIdentityDigestSha256: string
  readonly budgetAdmission: LivingFrameControlledInternalBudgetAdmission
}

export type PrePlanReasoningWorkloadAuthority =
  | PrePlanEditReferenceStudyChatReasoningAuthority
  | PrePlanLivingFrameSemanticReasoningAuthority

export type ReasoningModelAttemptTerminalOutcome =
  | 'completed'
  | 'failed'
  | 'unknown_reconciliation_required'

export interface ReasoningModelAttemptCostEvidenceV2Input<
  TAuthority extends PrePlanReasoningWorkloadAuthority =
    PrePlanEditReferenceStudyChatReasoningAuthority,
> {
  readonly workloadAuthority: TAuthority
  readonly reasoningRunId: string
  readonly attemptId: string
  readonly attemptOrdinal: 1 | 2 | 3
  readonly routeId: ReEditProReasoningModelRouteId
  readonly routeAuthorizationDigestSha256: string
  readonly idempotencyKeyDigestSha256: string
  readonly requestPayloadHashSha256: string
  readonly providerUsageEvidenceHashSha256: string
  readonly entryFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly terminalOutcome: ReasoningModelAttemptTerminalOutcome
  readonly terminalFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly usage: ReasoningModelTokenUsage | null
  readonly fxSnapshot?: ReasoningModelFxSnapshot
  readonly recordedAt: string
}

export interface ReasoningModelAttemptCostEvidenceV2<
  TAuthority extends PrePlanReasoningWorkloadAuthority =
    PrePlanEditReferenceStudyChatReasoningAuthority,
> {
  readonly schemaVersion: typeof REEDITPRO_REASONING_ATTEMPT_COST_EVIDENCE_V2_VERSION
  readonly boundary: 'internal_provider_cost_only'
  readonly evidenceClassification: 'provisional_metered_not_invoice_reconciled'
  readonly workloadAuthority: TAuthority
  readonly reasoningRunId: string
  readonly attemptId: string
  readonly attemptOrdinal: 1 | 2 | 3
  readonly routeId: ReEditProReasoningModelRouteId
  readonly routeAuthorizationDigestSha256: string
  readonly idempotencyKeyDigestSha256: string
  readonly requestPayloadHashSha256: string
  readonly providerUsageEvidenceHashSha256: string
  readonly entryFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly terminalOutcome: ReasoningModelAttemptTerminalOutcome
  readonly terminalFallbackTrigger: ReEditProReasoningFallbackTrigger | null
  readonly costStatus: 'metered_provisional' | 'unverified'
  readonly cost: ReasoningModelInternalCostCalculation | null
  readonly rateCardVersion: typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
  readonly rateCardDigestSha256: string
  readonly maximumUnverifiedExposureMicros: string | null
  readonly recordedAt: string
  readonly providerInvoiceReconciled: false
  readonly persistence: {
    readonly databaseBacked: false
    readonly productionDurability: false
    readonly invoiceReconciled: false
  }
  readonly commercialBoundary: {
    readonly customerPriceCalculated: false
    readonly customerCreditsCalculated: false
    readonly customerChargeCreated: false
    readonly walletMutationMade: false
    readonly serviceFeeIncluded: false
  }
  readonly evidenceHashSha256: string
}

export interface ReasoningModelAttemptCostAggregateV2<
  TAuthority extends PrePlanReasoningWorkloadAuthority =
    PrePlanEditReferenceStudyChatReasoningAuthority,
> {
  readonly schemaVersion: 'reasoning-model-attempt-cost-aggregate-v2'
  readonly boundary: 'internal_provider_cost_only'
  readonly workloadAuthority: TAuthority
  readonly reasoningRunId: string
  readonly routeIds: ReEditProReasoningModelRouteId[]
  readonly attemptIds: string[]
  readonly attemptCount: number
  readonly completedAttemptCount: number
  readonly failedAttemptCount: number
  readonly unknownAttemptCount: number
  readonly failedAttemptCostRetained: true
  readonly nativeCostMicrosByCurrency: Partial<Record<ReasoningModelCostCurrency, number>>
  readonly normalizedUsdCostMicros: number | null
  readonly allAttemptCostsVerifiedAndUsdNormalized: boolean
  readonly maximumUnverifiedExposureMicros: string | null
  readonly withinAuthorizedInternalCostCeiling: boolean
  readonly customerPriceCalculated: false
  readonly customerCreditsCalculated: false
  readonly customerChargeCreated: false
  readonly walletMutationMade: false
  readonly serviceFeeIncluded: false
  readonly aggregateDigestSha256: string
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/

export function createPrePlanEditReferenceStudyChatReasoningAuthority(
  input: CreatePrePlanEditReferenceStudyChatReasoningAuthorityInput,
): ReasoningModelCostResult<PrePlanEditReferenceStudyChatReasoningAuthority> {
  for (const [field, value] of Object.entries({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    approvedUsageEstimateId: input.approvedUsageEstimateId,
    internalCostBudgetId: input.internalCostBudgetId,
    immutableRateCardSnapshotId: input.immutableRateCardSnapshotId,
  })) {
    if (!ID_PATTERN.test(value)) {
      return failure('invalid_workload_identity', field, `${field} is not a bounded workload identity.`)
    }
  }
  if (!Number.isSafeInteger(input.studyRevision) || input.studyRevision < 1) {
    return failure('invalid_study_revision', 'studyRevision', 'Study Chat authority requires a positive exact study revision.')
  }
  if (!SHA256_PATTERN.test(input.reasoningRequestDigestSha256)) {
    return failure('invalid_request_digest', 'reasoningRequestDigestSha256', 'Study Chat authority requires the exact reasoning request digest.')
  }
  if (
    !MONEY_MICROS_PATTERN.test(input.maximumAuthorizedInternalCostMicros)
    || BigInt(input.maximumAuthorizedInternalCostMicros) <= 0n
  ) {
    return failure('invalid_internal_cost_ceiling', 'maximumAuthorizedInternalCostMicros', 'Study Chat authority requires a positive internal-cost ceiling.')
  }

  const withoutDigest = {
    schemaVersion: REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION,
    authorityClass: 'pre_plan_edit_reference_study_chat' as const,
    sourceAuthority: 'canonical_edit_reference_repository' as const,
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    studyRevision: input.studyRevision,
    reasoningRequestDigestSha256: input.reasoningRequestDigestSha256,
    approvedUsageEstimateId: input.approvedUsageEstimateId,
    internalCostBudgetId: input.internalCostBudgetId,
    immutableRateCardSnapshotId: input.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: input.maximumAuthorizedInternalCostMicros,
    approvalAuthority: 'server_pre_plan_study_usage_approval' as const,
    approvedPlanSnapshotFabricated: false as const,
    creditReservationFabricated: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      authorityDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function validatePrePlanEditReferenceStudyChatReasoningAuthority(
  authority: PrePlanEditReferenceStudyChatReasoningAuthority,
): ReasoningModelCostResult<PrePlanEditReferenceStudyChatReasoningAuthority> {
  if (!hasExactKeys(authority, [
    'schemaVersion', 'authorityClass', 'sourceAuthority', 'workspaceId', 'actorUserId',
    'editReferenceId', 'studySessionId', 'studyRevision', 'reasoningRequestDigestSha256',
    'approvedUsageEstimateId', 'internalCostBudgetId', 'immutableRateCardSnapshotId',
    'maximumAuthorizedInternalCostMicros', 'approvalAuthority',
    'approvedPlanSnapshotFabricated', 'creditReservationFabricated',
    'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
    'authorityDigestSha256',
  ])) {
    return failure('invalid_workload_authority_shape', 'workloadAuthority', 'The pre-plan reasoning authority has unexpected or missing fields.')
  }
  const recreated = createPrePlanEditReferenceStudyChatReasoningAuthority(authority)
  if (!recreated.ok) return recreated
  if (authority.authorityDigestSha256 !== recreated.data.authorityDigestSha256) {
    return failure('invalid_workload_authority_digest', 'authorityDigestSha256', 'The pre-plan reasoning authority failed integrity verification.')
  }
  if (
    authority.schemaVersion !== REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION
    || authority.authorityClass !== 'pre_plan_edit_reference_study_chat'
    || authority.sourceAuthority !== 'canonical_edit_reference_repository'
    || authority.approvalAuthority !== 'server_pre_plan_study_usage_approval'
    || authority.approvedPlanSnapshotFabricated !== false
    || authority.creditReservationFabricated !== false
    || authority.customerPriceCalculated !== false
    || authority.customerCreditsMutated !== false
    || authority.serviceFeeIncluded !== false
  ) {
    return failure('invalid_workload_authority_boundary', 'workloadAuthority', 'The pre-plan reasoning authority crosses a forbidden authority or commercial boundary.')
  }
  return { ok: true, data: { ...authority } }
}

export function createLivingFrameControlledInternalBudgetAdmission(
  input: CreateLivingFrameControlledInternalBudgetAdmissionInput,
): ReasoningModelCostResult<LivingFrameControlledInternalBudgetAdmission> {
  for (const [field, value] of Object.entries({
    budgetAdmissionId: input.budgetAdmissionId,
    budgetExpectationId: input.budgetExpectationId,
  })) {
    if (!ID_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_budget_identity',
        field,
        'Living Frame internal-budget admission requires bounded admission and expectation identities.',
      )
    }
  }
  for (const [field, value] of Object.entries({
    livingFramePreapprovalInputAuthorityDigestSha256:
      input.livingFramePreapprovalInputAuthorityDigestSha256,
    rateCardIdentityDigestSha256:
      input.rateCardIdentityDigestSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_budget_digest',
        field,
        `${field} must be lowercase SHA-256.`,
      )
    }
  }
  if (
    input.rateCardIdentityDigestSha256 !==
      reasoningModelRateCardIdentityDigest()
  ) {
    return failure(
      'living_frame_rate_card_identity_mismatch',
      'rateCardIdentityDigestSha256',
      'Living Frame internal-budget admission does not match the current immutable reasoning rate-card identity.',
    )
  }
  if (
    !MONEY_MICROS_PATTERN.test(
      input.maximumAuthorizedInternalCostMicros,
    )
    || BigInt(input.maximumAuthorizedInternalCostMicros) <= 0n
  ) {
    return failure(
      'invalid_living_frame_internal_cost_ceiling',
      'maximumAuthorizedInternalCostMicros',
      'Living Frame internal-budget admission requires a positive controlled ceiling.',
    )
  }

  const withoutDigest = {
    schemaVersion:
      LIVING_FRAME_CONTROLLED_INTERNAL_BUDGET_ADMISSION_VERSION,
    sourceAuthority: (
      'canonical_living_frame_preapproval_reasoning_result_service'
    ) as const,
    evidenceClass: (
      'controlled_non_promotable_internal_budget_admission'
    ) as const,
    budgetAdmissionId: input.budgetAdmissionId,
    budgetExpectationId: input.budgetExpectationId,
    livingFramePreapprovalInputAuthorityDigestSha256:
      input.livingFramePreapprovalInputAuthorityDigestSha256,
    rateCardVersion:
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION as
        typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    rateCardIdentityDigestSha256:
      input.rateCardIdentityDigestSha256,
    denomination: 'normalized_usd_micros' as const,
    maximumAuthorizedInternalCostMicros:
      input.maximumAuthorizedInternalCostMicros,
    internalBudgetAdmissionControlled: true as const,
    providerTransportAuthorized: false as const,
    actualAttemptReceiptProvided: false as const,
    actualAttemptCostKnown: false as const,
    providerInvoiceReconciled: false as const,
    customerPriceCalculated: false as const,
    customerCreditsCalculated: false as const,
    customerChargeCreated: false as const,
    walletMutationMade: false as const,
    serviceFeeIncluded: false as const,
    promotionAllowed: false as const,
    productionReady: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      admissionDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function validateLivingFrameControlledInternalBudgetAdmission(
  admission: LivingFrameControlledInternalBudgetAdmission,
): ReasoningModelCostResult<LivingFrameControlledInternalBudgetAdmission> {
  if (!hasExactKeys(admission, [
    'schemaVersion', 'sourceAuthority', 'evidenceClass',
    'budgetAdmissionId', 'budgetExpectationId',
    'livingFramePreapprovalInputAuthorityDigestSha256',
    'rateCardVersion', 'rateCardIdentityDigestSha256', 'denomination',
    'maximumAuthorizedInternalCostMicros',
    'internalBudgetAdmissionControlled', 'providerTransportAuthorized',
    'actualAttemptReceiptProvided', 'actualAttemptCostKnown',
    'providerInvoiceReconciled', 'customerPriceCalculated',
    'customerCreditsCalculated', 'customerChargeCreated',
    'walletMutationMade', 'serviceFeeIncluded', 'promotionAllowed',
    'productionReady', 'admissionDigestSha256',
  ])) {
    return failure(
      'invalid_living_frame_budget_admission_shape',
      'budgetAdmission',
      'Living Frame internal-budget admission has unexpected or missing fields.',
    )
  }
  if (
    admission.schemaVersion !==
      LIVING_FRAME_CONTROLLED_INTERNAL_BUDGET_ADMISSION_VERSION
    || admission.sourceAuthority !==
      'canonical_living_frame_preapproval_reasoning_result_service'
    || admission.evidenceClass !==
      'controlled_non_promotable_internal_budget_admission'
    || admission.rateCardVersion !==
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
    || admission.denomination !== 'normalized_usd_micros'
    || admission.internalBudgetAdmissionControlled !== true
    || admission.providerTransportAuthorized !== false
    || admission.actualAttemptReceiptProvided !== false
    || admission.actualAttemptCostKnown !== false
    || admission.providerInvoiceReconciled !== false
    || admission.customerPriceCalculated !== false
    || admission.customerCreditsCalculated !== false
    || admission.customerChargeCreated !== false
    || admission.walletMutationMade !== false
    || admission.serviceFeeIncluded !== false
    || admission.promotionAllowed !== false
    || admission.productionReady !== false
  ) {
    return failure(
      'invalid_living_frame_budget_admission_boundary',
      'budgetAdmission',
      'Living Frame internal-budget admission crosses a forbidden execution, promotion, or commercial boundary.',
    )
  }
  const recreated =
    createLivingFrameControlledInternalBudgetAdmission({
      budgetAdmissionId: admission.budgetAdmissionId,
      budgetExpectationId: admission.budgetExpectationId,
      livingFramePreapprovalInputAuthorityDigestSha256:
        admission.livingFramePreapprovalInputAuthorityDigestSha256,
      rateCardIdentityDigestSha256:
        admission.rateCardIdentityDigestSha256,
      maximumAuthorizedInternalCostMicros:
        admission.maximumAuthorizedInternalCostMicros,
    })
  if (!recreated.ok) return recreated
  if (
    stableStringify(recreated.data) !== stableStringify(admission)
  ) {
    return failure(
      'living_frame_budget_admission_reconstruction_mismatch',
      'budgetAdmission',
      'Living Frame internal-budget admission failed canonical reconstruction.',
    )
  }
  return { ok: true, data: admission }
}

export function createPrePlanLivingFrameSemanticReasoningAuthority(
  input: CreatePrePlanLivingFrameSemanticReasoningAuthorityInput,
): ReasoningModelCostResult<PrePlanLivingFrameSemanticReasoningAuthority> {
  const budget = validateLivingFrameControlledInternalBudgetAdmission(
    input.budgetAdmission,
  )
  if (!budget.ok) return budget
  for (const [field, value] of Object.entries({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    handoffId: input.handoffId,
  })) {
    if (!ID_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_workload_identity',
        field,
        `${field} is not a bounded Living Frame workload identity.`,
      )
    }
  }
  for (const [field, value] of Object.entries({
    livingFramePreapprovalInputAuthorityDigestSha256:
      input.livingFramePreapprovalInputAuthorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      input.planningEvidenceBindingDigestSha256,
    reasoningRequestDigestSha256:
      input.reasoningRequestDigestSha256,
    reasoningResultSchemaDigestSha256:
      input.reasoningResultSchemaDigestSha256,
    routeIdentityDigestSha256:
      input.routeIdentityDigestSha256,
    rateCardIdentityDigestSha256:
      input.rateCardIdentityDigestSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_workload_digest',
        field,
        `${field} must be lowercase SHA-256.`,
      )
    }
  }
  if (
    input.routeContractVersion !==
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
    || stableStringify(input.orderedRouteIds) !== stableStringify(
      REEDITPRO_REASONING_MODEL_ROUTE_IDS,
    )
    || input.routeIdentityDigestSha256 !==
      reasoningModelRouteIdentityDigest()
  ) {
    return failure(
      'invalid_living_frame_reasoning_route',
      'orderedRouteIds',
      'Living Frame semantic reasoning requires the exact canonical Kimi, Qwen, then DeepSeek route.',
    )
  }
  if (
    input.rateCardIdentityDigestSha256 !==
      reasoningModelRateCardIdentityDigest()
    || budget.data.rateCardIdentityDigestSha256 !==
      input.rateCardIdentityDigestSha256
  ) {
    return failure(
      'invalid_living_frame_rate_card_identity',
      'rateCardIdentityDigestSha256',
      'Living Frame semantic reasoning requires the exact current immutable rate-card identity.',
    )
  }
  if (
    budget.data.livingFramePreapprovalInputAuthorityDigestSha256 !==
      input.livingFramePreapprovalInputAuthorityDigestSha256
  ) {
    return failure(
      'living_frame_budget_authority_mismatch',
      'budgetAdmission',
      'Living Frame internal-budget admission belongs to another preapproval input authority.',
    )
  }

  const withoutDigest = {
    schemaVersion: REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION,
    authorityClass:
      'pre_plan_living_frame_semantic_reasoning' as const,
    sourceAuthority: (
      'canonical_living_frame_preapproval_reasoning_result_service'
    ) as const,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    handoffId: input.handoffId,
    livingFramePreapprovalInputAuthorityDigestSha256:
      input.livingFramePreapprovalInputAuthorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      input.planningEvidenceBindingDigestSha256,
    reasoningRequestDigestSha256:
      input.reasoningRequestDigestSha256,
    reasoningResultSchemaDigestSha256:
      input.reasoningResultSchemaDigestSha256,
    routeContractVersion: input.routeContractVersion,
    orderedRouteIds: [
      'kimi_k3_primary',
      'qwen_3_7_fallback',
      'deepseek_v4_pro_fallback',
    ] as const,
    routeIdentityDigestSha256:
      input.routeIdentityDigestSha256,
    rateCardVersion:
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION as
        typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    rateCardIdentityDigestSha256:
      input.rateCardIdentityDigestSha256,
    internalCostBudgetExpectationId:
      budget.data.budgetExpectationId,
    internalCostBudgetAdmissionId:
      budget.data.budgetAdmissionId,
    internalCostBudgetAdmissionDigestSha256:
      budget.data.admissionDigestSha256,
    maximumAuthorizedInternalCostMicros:
      budget.data.maximumAuthorizedInternalCostMicros,
    approvalAuthority:
      'server_controlled_internal_budget_admission' as const,
    providerTransportAuthorized: false as const,
    approvedPlanSnapshotFabricated: false as const,
    creditReservationFabricated: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    promotionAllowed: false as const,
    productionReady: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      authorityDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function validatePrePlanLivingFrameSemanticReasoningAuthority(
  authority: PrePlanLivingFrameSemanticReasoningAuthority,
): ReasoningModelCostResult<PrePlanLivingFrameSemanticReasoningAuthority> {
  if (!hasExactKeys(authority, [
    'schemaVersion', 'authorityClass', 'sourceAuthority', 'workspaceId',
    'projectId', 'editSessionId', 'handoffId',
    'livingFramePreapprovalInputAuthorityDigestSha256',
    'planningEvidenceBindingDigestSha256',
    'reasoningRequestDigestSha256', 'reasoningResultSchemaDigestSha256',
    'routeContractVersion', 'orderedRouteIds',
    'routeIdentityDigestSha256', 'rateCardVersion',
    'rateCardIdentityDigestSha256',
    'internalCostBudgetExpectationId', 'internalCostBudgetAdmissionId',
    'internalCostBudgetAdmissionDigestSha256',
    'maximumAuthorizedInternalCostMicros', 'approvalAuthority',
    'providerTransportAuthorized', 'approvedPlanSnapshotFabricated',
    'creditReservationFabricated', 'customerPriceCalculated',
    'customerCreditsMutated', 'serviceFeeIncluded', 'promotionAllowed',
    'productionReady', 'authorityDigestSha256',
  ])) {
    return failure(
      'invalid_living_frame_workload_authority_shape',
      'workloadAuthority',
      'Living Frame semantic reasoning authority has unexpected or missing fields.',
    )
  }
  if (
    authority.schemaVersion !==
      REEDITPRO_REASONING_WORKLOAD_AUTHORITY_VERSION
    || authority.authorityClass !==
      'pre_plan_living_frame_semantic_reasoning'
    || authority.sourceAuthority !==
      'canonical_living_frame_preapproval_reasoning_result_service'
    || authority.routeContractVersion !==
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
    || authority.rateCardVersion !==
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION
    || authority.approvalAuthority !==
      'server_controlled_internal_budget_admission'
    || authority.providerTransportAuthorized !== false
    || authority.approvedPlanSnapshotFabricated !== false
    || authority.creditReservationFabricated !== false
    || authority.customerPriceCalculated !== false
    || authority.customerCreditsMutated !== false
    || authority.serviceFeeIncluded !== false
    || authority.promotionAllowed !== false
    || authority.productionReady !== false
    || stableStringify(authority.orderedRouteIds) !== stableStringify(
      REEDITPRO_REASONING_MODEL_ROUTE_IDS,
    )
    || authority.routeIdentityDigestSha256 !==
      reasoningModelRouteIdentityDigest()
    || authority.rateCardIdentityDigestSha256 !==
      reasoningModelRateCardIdentityDigest()
  ) {
    return failure(
      'invalid_living_frame_workload_authority_boundary',
      'workloadAuthority',
      'Living Frame semantic reasoning authority crosses a forbidden route, execution, promotion, or commercial boundary.',
    )
  }
  for (const [field, value] of Object.entries({
    workspaceId: authority.workspaceId,
    projectId: authority.projectId,
    editSessionId: authority.editSessionId,
    handoffId: authority.handoffId,
    internalCostBudgetExpectationId:
      authority.internalCostBudgetExpectationId,
    internalCostBudgetAdmissionId:
      authority.internalCostBudgetAdmissionId,
  })) {
    if (!ID_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_workload_identity',
        field,
        `${field} is not a bounded Living Frame workload identity.`,
      )
    }
  }
  for (const [field, value] of Object.entries({
    livingFramePreapprovalInputAuthorityDigestSha256:
      authority.livingFramePreapprovalInputAuthorityDigestSha256,
    planningEvidenceBindingDigestSha256:
      authority.planningEvidenceBindingDigestSha256,
    reasoningRequestDigestSha256:
      authority.reasoningRequestDigestSha256,
    reasoningResultSchemaDigestSha256:
      authority.reasoningResultSchemaDigestSha256,
    internalCostBudgetAdmissionDigestSha256:
      authority.internalCostBudgetAdmissionDigestSha256,
    authorityDigestSha256: authority.authorityDigestSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) {
      return failure(
        'invalid_living_frame_workload_digest',
        field,
        `${field} must be lowercase SHA-256.`,
      )
    }
  }
  if (
    !MONEY_MICROS_PATTERN.test(
      authority.maximumAuthorizedInternalCostMicros,
    )
    || BigInt(authority.maximumAuthorizedInternalCostMicros) <= 0n
  ) {
    return failure(
      'invalid_living_frame_internal_cost_ceiling',
      'maximumAuthorizedInternalCostMicros',
      'Living Frame workload authority requires a positive internal-cost ceiling.',
    )
  }
  const withoutDigest = Object.fromEntries(
    Object.entries(authority).filter(
      ([key]) => key !== 'authorityDigestSha256',
    ),
  )
  if (
    authority.authorityDigestSha256 !==
      sha256(stableStringify(withoutDigest))
  ) {
    return failure(
      'invalid_living_frame_workload_authority_digest',
      'authorityDigestSha256',
      'Living Frame semantic reasoning authority failed integrity verification.',
    )
  }
  return { ok: true, data: { ...authority } }
}

export function validatePrePlanReasoningWorkloadAuthority<
  TAuthority extends PrePlanReasoningWorkloadAuthority,
>(
  authority: TAuthority,
): ReasoningModelCostResult<TAuthority> {
  if (
    !authority
    || typeof authority !== 'object'
    || !('authorityClass' in authority)
  ) {
    return failure(
      'invalid_workload_authority',
      'workloadAuthority',
      'Reasoning workload authority is missing its discriminant.',
    )
  }
  if (authority.authorityClass === 'pre_plan_edit_reference_study_chat') {
    const validated =
      validatePrePlanEditReferenceStudyChatReasoningAuthority(authority)
    return validated.ok
      ? { ok: true, data: validated.data as TAuthority }
      : validated
  }
  if (
    authority.authorityClass ===
      'pre_plan_living_frame_semantic_reasoning'
  ) {
    const validated =
      validatePrePlanLivingFrameSemanticReasoningAuthority(authority)
    return validated.ok
      ? { ok: true, data: validated.data as TAuthority }
      : validated
  }
  return failure(
    'unknown_workload_authority_class',
    'workloadAuthority',
    'Reasoning workload authority class is not admitted.',
  )
}

export function createReasoningModelAttemptCostEvidenceV2<
  TAuthority extends PrePlanReasoningWorkloadAuthority,
>(
  input: ReasoningModelAttemptCostEvidenceV2Input<TAuthority>,
): ReasoningModelCostResult<
  ReasoningModelAttemptCostEvidenceV2<TAuthority>
> {
  const authority =
    validatePrePlanReasoningWorkloadAuthority(input.workloadAuthority)
  if (!authority.ok) return authority
  for (const [field, value] of Object.entries({
    reasoningRunId: input.reasoningRunId,
    attemptId: input.attemptId,
  })) {
    if (!ID_PATTERN.test(value)) return failure('invalid_attempt_identity', field, `${field} is invalid.`)
  }
  for (const [field, value] of Object.entries({
    routeAuthorizationDigestSha256: input.routeAuthorizationDigestSha256,
    idempotencyKeyDigestSha256: input.idempotencyKeyDigestSha256,
    requestPayloadHashSha256: input.requestPayloadHashSha256,
    providerUsageEvidenceHashSha256: input.providerUsageEvidenceHashSha256,
  })) {
    if (!SHA256_PATTERN.test(value)) return failure('invalid_hash', field, `${field} must be lowercase SHA-256.`)
  }
  if (input.requestPayloadHashSha256 !== authority.data.reasoningRequestDigestSha256) {
    return failure('request_authority_mismatch', 'requestPayloadHashSha256', 'The route attempt is not bound to the exact pre-plan reasoning request.')
  }
  if (!Number.isFinite(Date.parse(input.recordedAt))) {
    return failure('invalid_timestamp', 'recordedAt', 'The route-attempt cost timestamp is invalid.')
  }

  const route = getReEditProReasoningModelRoute(input.routeId)
  if (input.attemptOrdinal !== route.priority) {
    return failure('invalid_attempt_order', 'attemptOrdinal', 'Attempt ordinal must match the immutable route priority.')
  }
  if (route.routeRole === 'primary' && input.entryFallbackTrigger !== null) {
    return failure('invalid_entry_trigger', 'entryFallbackTrigger', 'The Kimi primary attempt cannot claim a fallback entry trigger.')
  }
  if (
    route.routeRole === 'fallback'
    && (input.entryFallbackTrigger === null || !isFallbackTrigger(input.entryFallbackTrigger))
  ) {
    return failure('invalid_entry_trigger', 'entryFallbackTrigger', 'A fallback route requires the immediately preceding allowed terminal failure trigger.')
  }
  if (input.terminalOutcome === 'completed' && input.terminalFallbackTrigger !== null) {
    return failure('invalid_terminal_trigger', 'terminalFallbackTrigger', 'A completed route cannot authorize another fallback.')
  }
  if (
    input.terminalOutcome === 'failed'
    && (input.terminalFallbackTrigger === null || !isFallbackTrigger(input.terminalFallbackTrigger))
  ) {
    return failure('invalid_terminal_trigger', 'terminalFallbackTrigger', 'A failed route requires one sanitized allowed terminal failure trigger.')
  }
  if (
    input.terminalOutcome === 'unknown_reconciliation_required'
    && input.terminalFallbackTrigger !== null
  ) {
    return failure('unknown_outcome_fallback_forbidden', 'terminalFallbackTrigger', 'An unknown provider outcome must reconcile before any fallback can start.')
  }

  let cost: ReasoningModelInternalCostCalculation | null = null
  if (input.terminalOutcome === 'unknown_reconciliation_required') {
    if (input.usage !== null || input.fxSnapshot !== undefined) {
      return failure('unknown_outcome_usage_forbidden', 'usage', 'Unknown provider truth cannot claim metered token usage or FX normalization.')
    }
  } else {
    if (!input.usage) {
      return failure('missing_attempt_usage', 'usage', 'Completed and failed provider attempts must retain metered usage.')
    }
    const calculated = calculateReasoningModelInternalCost({
      routeId: input.routeId,
      usage: input.usage,
      ...(input.fxSnapshot ? { fxSnapshot: input.fxSnapshot } : {}),
    })
    if (!calculated.ok) return calculated
    if (calculated.data.normalizedUsdCostMicros === null) {
      return failure('missing_fx_normalization', 'fxSnapshot', 'A production pre-plan attempt must normalize native provider cost through a versioned FX snapshot.')
    }
    cost = calculated.data
  }

  const rateCardDigestSha256 = reasoningModelRateCardDigest(input.routeId)
  const withoutHash = {
    schemaVersion: REEDITPRO_REASONING_ATTEMPT_COST_EVIDENCE_V2_VERSION,
    boundary: 'internal_provider_cost_only' as const,
    evidenceClassification: 'provisional_metered_not_invoice_reconciled' as const,
    workloadAuthority: authority.data,
    reasoningRunId: input.reasoningRunId,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    routeId: input.routeId,
    routeAuthorizationDigestSha256: input.routeAuthorizationDigestSha256,
    idempotencyKeyDigestSha256: input.idempotencyKeyDigestSha256,
    requestPayloadHashSha256: input.requestPayloadHashSha256,
    providerUsageEvidenceHashSha256: input.providerUsageEvidenceHashSha256,
    entryFallbackTrigger: input.entryFallbackTrigger,
    terminalOutcome: input.terminalOutcome,
    terminalFallbackTrigger: input.terminalFallbackTrigger,
    costStatus: cost ? 'metered_provisional' as const : 'unverified' as const,
    cost,
    rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION as typeof REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    rateCardDigestSha256,
    maximumUnverifiedExposureMicros: cost
      ? null
      : authority.data.maximumAuthorizedInternalCostMicros,
    recordedAt: new Date(input.recordedAt).toISOString(),
    providerInvoiceReconciled: false as const,
    persistence: {
      databaseBacked: false as const,
      productionDurability: false as const,
      invoiceReconciled: false as const,
    },
    commercialBoundary: {
      customerPriceCalculated: false as const,
      customerCreditsCalculated: false as const,
      customerChargeCreated: false as const,
      walletMutationMade: false as const,
      serviceFeeIncluded: false as const,
    },
  }
  return {
    ok: true,
    data: {
      ...withoutHash,
      evidenceHashSha256: sha256(stableStringify(withoutHash)),
    },
  }
}

export function aggregateReasoningModelAttemptCostsV2<
  TAuthority extends PrePlanReasoningWorkloadAuthority,
>(
  attempts: readonly ReasoningModelAttemptCostEvidenceV2<TAuthority>[],
): ReasoningModelCostResult<
  ReasoningModelAttemptCostAggregateV2<TAuthority>
> {
  if (attempts.length < 1 || attempts.length > REEDITPRO_REASONING_MODEL_ROUTE_IDS.length) {
    return failure('invalid_attempt_count', 'attempts', 'A reasoning run requires one to three contiguous attempts.')
  }

  const first = attempts[0]
  const authority =
    validatePrePlanReasoningWorkloadAuthority(first.workloadAuthority)
  if (!authority.ok) return authority
  const attemptIds = new Set<string>()
  const nativeCostMicrosByCurrency: Partial<Record<ReasoningModelCostCurrency, number>> = {}
  let normalizedUsdCostMicros = 0
  let allAttemptCostsVerifiedAndUsdNormalized = true
  let maximumUnverifiedExposureMicros: string | null = null

  for (const [index, attempt] of attempts.entries()) {
    const validatedAttempt = validateReasoningModelAttemptCostEvidenceV2(attempt)
    if (!validatedAttempt.ok) return validatedAttempt
    if (attemptIds.has(attempt.attemptId)) {
      return failure('duplicate_attempt', 'attemptId', `Attempt ${attempt.attemptId} appears more than once.`)
    }
    attemptIds.add(attempt.attemptId)
    const expectedRouteId = REEDITPRO_REASONING_MODEL_ROUTE_IDS[index]
    if (attempt.attemptOrdinal !== index + 1 || attempt.routeId !== expectedRouteId) {
      return failure('non_contiguous_route_chain', 'attempts', 'Reasoning attempts must start with Kimi and follow the exact canonical route without skips or reordering.')
    }
    if (
      attempt.reasoningRunId !== first.reasoningRunId
      || attempt.workloadAuthority.authorityDigestSha256 !== authority.data.authorityDigestSha256
      || attempt.requestPayloadHashSha256 !== authority.data.reasoningRequestDigestSha256
    ) {
      return failure('mixed_attempt_authority', 'attempts', 'All reasoning attempts must share one exact run and pre-plan workload authority.')
    }
    if (index === 0 && attempt.entryFallbackTrigger !== null) {
      return failure('primary_entry_trigger', 'entryFallbackTrigger', 'The first Kimi attempt cannot enter through fallback.')
    }
    if (index > 0) {
      const previous = attempts[index - 1]
      if (
        previous.terminalOutcome !== 'failed'
        || previous.terminalFallbackTrigger === null
        || attempt.entryFallbackTrigger !== previous.terminalFallbackTrigger
      ) {
        return failure('invalid_fallback_lineage', 'attempts', 'Each fallback must follow the immediately preceding metered terminal failure and exact trigger.')
      }
    }
    if (index < attempts.length - 1 && attempt.terminalOutcome !== 'failed') {
      return failure('attempt_after_terminal_stop', 'attempts', 'No attempt may follow a completed or unknown provider outcome.')
    }

    if (!attempt.cost) {
      allAttemptCostsVerifiedAndUsdNormalized = false
      maximumUnverifiedExposureMicros = authority.data.maximumAuthorizedInternalCostMicros
      continue
    }
    const currency = attempt.cost.nativeCurrency
    nativeCostMicrosByCurrency[currency] =
      (nativeCostMicrosByCurrency[currency] ?? 0) + attempt.cost.nativeCostMicros
    if (attempt.cost.normalizedUsdCostMicros === null) {
      allAttemptCostsVerifiedAndUsdNormalized = false
    } else {
      normalizedUsdCostMicros += attempt.cost.normalizedUsdCostMicros
    }
  }

  const withinAuthorizedInternalCostCeiling = allAttemptCostsVerifiedAndUsdNormalized
    && BigInt(normalizedUsdCostMicros) <= BigInt(authority.data.maximumAuthorizedInternalCostMicros)
  if (allAttemptCostsVerifiedAndUsdNormalized && !withinAuthorizedInternalCostCeiling) {
    return failure('internal_cost_ceiling_exceeded', 'attempts', 'The retained route-attempt cost exceeds the approved pre-plan internal-cost ceiling.')
  }

  const withoutDigest = {
    schemaVersion: 'reasoning-model-attempt-cost-aggregate-v2' as const,
    boundary: 'internal_provider_cost_only' as const,
    workloadAuthority: authority.data,
    reasoningRunId: first.reasoningRunId,
    routeIds: attempts.map((attempt) => attempt.routeId),
    attemptIds: attempts.map((attempt) => attempt.attemptId),
    attemptCount: attempts.length,
    completedAttemptCount: attempts.filter((attempt) => attempt.terminalOutcome === 'completed').length,
    failedAttemptCount: attempts.filter((attempt) => attempt.terminalOutcome === 'failed').length,
    unknownAttemptCount: attempts.filter((attempt) => attempt.terminalOutcome === 'unknown_reconciliation_required').length,
    failedAttemptCostRetained: true as const,
    nativeCostMicrosByCurrency,
    normalizedUsdCostMicros: allAttemptCostsVerifiedAndUsdNormalized
      ? normalizedUsdCostMicros
      : null,
    allAttemptCostsVerifiedAndUsdNormalized,
    maximumUnverifiedExposureMicros,
    withinAuthorizedInternalCostCeiling,
    customerPriceCalculated: false as const,
    customerCreditsCalculated: false as const,
    customerChargeCreated: false as const,
    walletMutationMade: false as const,
    serviceFeeIncluded: false as const,
  }
  return {
    ok: true,
    data: {
      ...withoutDigest,
      aggregateDigestSha256: sha256(stableStringify(withoutDigest)),
    },
  }
}

export function validateReasoningModelAttemptCostEvidenceV2<
  TAuthority extends PrePlanReasoningWorkloadAuthority,
>(
  evidence: ReasoningModelAttemptCostEvidenceV2<TAuthority>,
): ReasoningModelCostResult<
  ReasoningModelAttemptCostEvidenceV2<TAuthority>
> {
  if (!hasExactKeys(evidence, [
    'schemaVersion', 'boundary', 'evidenceClassification', 'workloadAuthority',
    'reasoningRunId', 'attemptId', 'attemptOrdinal', 'routeId',
    'routeAuthorizationDigestSha256', 'idempotencyKeyDigestSha256',
    'requestPayloadHashSha256', 'providerUsageEvidenceHashSha256',
    'entryFallbackTrigger', 'terminalOutcome', 'terminalFallbackTrigger',
    'costStatus', 'cost', 'rateCardVersion', 'rateCardDigestSha256',
    'maximumUnverifiedExposureMicros', 'recordedAt', 'providerInvoiceReconciled',
    'persistence', 'commercialBoundary', 'evidenceHashSha256',
  ])) {
    return failure('invalid_attempt_evidence_shape', 'evidence', 'The route-attempt cost evidence has unexpected or missing fields.')
  }
  if (
    evidence.schemaVersion !== REEDITPRO_REASONING_ATTEMPT_COST_EVIDENCE_V2_VERSION
    || evidence.boundary !== 'internal_provider_cost_only'
    || evidence.evidenceClassification !== 'provisional_metered_not_invoice_reconciled'
    || evidence.providerInvoiceReconciled !== false
    || evidence.persistence.databaseBacked !== false
    || evidence.persistence.productionDurability !== false
    || evidence.persistence.invoiceReconciled !== false
    || evidence.commercialBoundary.customerPriceCalculated !== false
    || evidence.commercialBoundary.customerCreditsCalculated !== false
    || evidence.commercialBoundary.customerChargeCreated !== false
    || evidence.commercialBoundary.walletMutationMade !== false
    || evidence.commercialBoundary.serviceFeeIncluded !== false
  ) {
    return failure('invalid_attempt_evidence_boundary', 'evidence', 'The route-attempt cost evidence crosses a persistence or commercial boundary.')
  }
  const recreated = createReasoningModelAttemptCostEvidenceV2({
    workloadAuthority: evidence.workloadAuthority,
    reasoningRunId: evidence.reasoningRunId,
    attemptId: evidence.attemptId,
    attemptOrdinal: evidence.attemptOrdinal,
    routeId: evidence.routeId,
    routeAuthorizationDigestSha256: evidence.routeAuthorizationDigestSha256,
    idempotencyKeyDigestSha256: evidence.idempotencyKeyDigestSha256,
    requestPayloadHashSha256: evidence.requestPayloadHashSha256,
    providerUsageEvidenceHashSha256: evidence.providerUsageEvidenceHashSha256,
    entryFallbackTrigger: evidence.entryFallbackTrigger,
    terminalOutcome: evidence.terminalOutcome,
    terminalFallbackTrigger: evidence.terminalFallbackTrigger,
    usage: evidence.cost?.usage ?? null,
    ...(evidence.cost?.fxSnapshot ? { fxSnapshot: evidence.cost.fxSnapshot } : {}),
    recordedAt: evidence.recordedAt,
  })
  if (!recreated.ok) return recreated
  if (stableStringify(recreated.data) !== stableStringify(evidence)) {
    return failure('attempt_evidence_reconstruction_mismatch', 'evidence', 'The route-attempt cost evidence does not reconstruct from the canonical rate card and workload authority.')
  }
  return { ok: true, data: evidence }
}

export function reasoningModelRateCardDigest(
  routeId: ReEditProReasoningModelRouteId,
): string {
  return sha256(stableStringify({
    rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    entry: getReasoningModelRateCardEntry(routeId),
  }))
}

export function reasoningModelRouteIdentityDigest(): string {
  return sha256(stableStringify({
    contractVersion: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    routes: REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.map((route) => ({
      routeId: route.routeId,
      routeRole: route.routeRole,
      priority: route.priority,
      provider: route.provider,
      modelRoleId: route.modelRoleId,
      exactProviderModelId: route.exactProviderModelId,
      providerBoundary: route.providerBoundary,
      structuredOutputRequired: route.structuredOutputRequired,
      nextRouteId: route.nextRouteId,
      runtimeStatus: route.runtimeStatus,
    })),
  }))
}

export function reasoningModelRateCardIdentityDigest(): string {
  return sha256(stableStringify({
    rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    routeEntries: REEDITPRO_REASONING_MODEL_ROUTE_IDS.map((routeId) =>
      getReasoningModelRateCardEntry(routeId),
    ),
  }))
}

function isFallbackTrigger(value: string): value is ReEditProReasoningFallbackTrigger {
  return REEDITPRO_REASONING_FALLBACK_TRIGGERS.includes(
    value as ReEditProReasoningFallbackTrigger,
  )
}

function failure<T>(
  code: string,
  field: string,
  message: string,
): ReasoningModelCostResult<T> {
  return { ok: false, error: { code, field, message } }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function hasExactKeys(value: unknown, expected: readonly string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const actual = Object.keys(value as Record<string, unknown>).sort()
  const canonical = [...expected].sort()
  return actual.length === canonical.length
    && actual.every((key, index) => key === canonical[index])
}
