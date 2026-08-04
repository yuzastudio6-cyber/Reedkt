import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CanonicalProviderWorkAuthorization } from
  '../edit-architecture/canonical-provider-work-authority'
import {
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
  resolveCanonicalProviderOperation,
  resolveCanonicalProviderOperationV2,
  resolveCanonicalProviderOperationV3,
  resolveCanonicalProviderOperationV4,
  type CanonicalProviderWorkAuthorizationV2,
  type CanonicalProviderWorkAuthorizationV3,
  type CanonicalProviderWorkAuthorizationV4,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'

export const PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION =
  'private-provider-attempt-cost-evidence-v1' as const
export const PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V2_VERSION =
  'private-provider-attempt-cost-evidence-v2' as const
export const PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V3_VERSION =
  'private-provider-attempt-cost-evidence-v3' as const
export const PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V4_VERSION =
  'private-provider-attempt-cost-evidence-v4' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeMicros = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

export const privateProviderAttemptCostEvidenceSchema = z.object({
  schemaVersion: z.literal(PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.enum([
    'private_injected_nonprovider_test',
    'canonical_backend_runtime_unreleased',
  ]),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchAttemptId: identity,
    providerOperationId: identity,
    providerRouteId: identity,
    providerModelId: identity,
  }).strict(),
  authorityHash: sha256,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  priorUnknownCostEvidenceHash: sha256.nullable(),
  canonicalSharedRateCardCompatibilityVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  provider: z.object({
    requestCount: z.union([z.literal(0), z.literal(1)]),
    usageEvidenceDigest: sha256.nullable(),
    rateCardDigest: sha256,
    unit: z.literal('request'),
    unitPriceMicros: z.literal(80_000),
    actualInternalCostMicros: safeMicros.nullable(),
    costReconciled: z.boolean(),
    failedAttemptBillingDocumented: z.literal(false),
  }).strict(),
  infrastructure: z.object({
    measurementClass: z.enum([
      'allocated_wall_time_provisional',
      'observed_cpu_time_unreleased',
    ]),
    allocatedVcpuCount: z.literal(1),
    allocatedMemoryGib: z.literal(1),
    wallTimeMicroseconds: z.number().int().positive().max(120_000_000),
    observedCpuMicroseconds: z.number().int().positive().max(20_000_000).nullable(),
    observedPeakMemoryBytes: z.number().int().positive().nullable(),
    rawUsageEvidenceDigest: sha256,
    rateCardDigest: sha256,
    unit: z.literal('cpu_second'),
    unitPriceMicros: z.literal(1_000),
    minimumChargeMicros: z.literal(1_000),
    billableCpuSeconds: z.number().int().positive().max(20),
    actualInternalCostMicros: safeMicros,
    invoiceReconciled: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  reconciliation: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerCostMicros: safeMicros.nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const providerCost = value.provider.actualInternalCostMicros
  const complete = value.reconciliation.state === 'complete'
  const expectedProviderCost = value.provider.requestCount * value.provider.unitPriceMicros
  if (
    value.reconciliation.providerCostMicros !== providerCost ||
    value.reconciliation.infrastructureCostMicros !==
      value.infrastructure.actualInternalCostMicros ||
    value.infrastructure.actualInternalCostMicros !==
      Math.max(
        value.infrastructure.minimumChargeMicros,
        value.infrastructure.billableCpuSeconds * value.infrastructure.unitPriceMicros,
      ) ||
    (value.infrastructure.measurementClass === 'observed_cpu_time_unreleased') !==
      (value.infrastructure.observedCpuMicroseconds !== null) ||
    (complete && (
      !value.provider.costReconciled || providerCost === null ||
      providerCost !== expectedProviderCost ||
      value.reconciliation.totalInternalProductionCostMicros !==
        providerCost + value.infrastructure.actualInternalCostMicros
    )) ||
    (!complete && (
      value.provider.costReconciled || providerCost !== null ||
      value.reconciliation.totalInternalProductionCostMicros !== null ||
      value.outcome.state !== 'unknown_reconciliation_required'
    )) ||
    (value.outcome.state.startsWith('unknown_reconciled_') !==
      (value.priorUnknownCostEvidenceHash !== null))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt cost reconciliation is inconsistent.',
    })
  }
})

export type PrivateProviderAttemptCostEvidence = z.infer<
  typeof privateProviderAttemptCostEvidenceSchema
>

export const privateProviderAttemptCostEvidenceV2Schema = z.object({
  schemaVersion: z.literal(PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V2_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.literal('private_injected_nonprovider_test'),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchAttemptId: identity,
    providerOperationId: identity,
    providerRouteId: identity,
    providerModelId: identity,
  }).strict(),
  authorityHash: sha256,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  priorUnknownCostEvidenceHash: sha256.nullable(),
  canonicalSharedRateCardCompatibilityVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  provider: z.object({
    requestCount: z.union([z.literal(0), z.literal(1)]),
    usageEvidenceDigest: sha256.nullable(),
    rateCardSnapshotId: identity,
    rateCardDigest: sha256,
    rateEvidenceClass: z.literal('private_local_fixture'),
    unit: z.literal('input_character'),
    billedUsageMicrocredits: z.literal(0).nullable(),
    actualInternalCostMicros: z.literal(0).nullable(),
    costReconciled: z.boolean(),
  }).strict(),
  infrastructure: z.object({
    measurementClass: z.literal('allocated_wall_time_provisional'),
    allocatedVcpuCount: z.literal(1),
    allocatedMemoryGib: z.literal(1),
    wallTimeMicroseconds: z.number().int().positive().max(60_000_000),
    rawUsageEvidenceDigest: sha256,
    rateCardDigest: sha256,
    unit: z.literal('cpu_second'),
    unitPriceMicros: z.literal(1_000),
    minimumChargeMicros: z.literal(1_000),
    billableCpuSeconds: z.number().int().positive().max(60),
    actualInternalCostMicros: safeMicros,
    invoiceReconciled: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  reconciliation: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerCostMicros: z.literal(0).nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const unknown = value.outcome.state === 'unknown_reconciliation_required'
  const reconciled = value.outcome.state.startsWith('unknown_reconciled_')
  if (
    value.infrastructure.actualInternalCostMicros !== Math.max(
      value.infrastructure.minimumChargeMicros,
      value.infrastructure.billableCpuSeconds *
        value.infrastructure.unitPriceMicros,
    ) ||
    value.reconciliation.infrastructureCostMicros !==
      value.infrastructure.actualInternalCostMicros ||
    unknown !== (value.reconciliation.state === 'reconciliation_required') ||
    (unknown && (
      value.provider.costReconciled ||
      value.provider.billedUsageMicrocredits !== null ||
      value.provider.actualInternalCostMicros !== null ||
      value.reconciliation.providerCostMicros !== null ||
      value.reconciliation.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      !value.provider.costReconciled ||
      value.provider.billedUsageMicrocredits !== 0 ||
      value.provider.actualInternalCostMicros !== 0 ||
      value.reconciliation.providerCostMicros !== 0 ||
      value.reconciliation.totalInternalProductionCostMicros !==
        value.infrastructure.actualInternalCostMicros
    )) ||
    reconciled !== (value.priorUnknownCostEvidenceHash !== null) ||
    (reconciled && (
      value.provider.requestCount !== 1 ||
      value.provider.usageEvidenceDigest === null
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt V2 cost reconciliation is inconsistent.',
    })
  }
})

export type PrivateProviderAttemptCostEvidenceV2 = z.infer<
  typeof privateProviderAttemptCostEvidenceV2Schema
>

export const privateProviderAttemptCostEvidenceV3Schema = z.object({
  schemaVersion: z.literal(PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V3_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.literal('private_injected_nonprovider_test'),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchAttemptId: identity,
    providerOperationId: z.literal(
      CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
    ),
    providerRouteId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID),
    providerModelId: z.literal(CANONICAL_FAL_SYNCHRONIZED_FOLEY_MODEL_ID),
  }).strict(),
  authorityHash: sha256,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  priorUnknownCostEvidenceHash: sha256.nullable(),
  canonicalSharedRateCardCompatibilityVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  provider: z.object({
    requestCount: z.union([z.literal(0), z.literal(1)]),
    usageEvidenceDigest: sha256.nullable(),
    rateCardSnapshotId: identity,
    rateCardDigest: sha256,
    rateEvidenceClass: z.literal('private_local_fixture'),
    unit: z.literal('generation_submission'),
    billedUsageMicrocredits: z.literal(0).nullable(),
    actualInternalCostMicros: z.literal(0).nullable(),
    costReconciled: z.boolean(),
  }).strict(),
  infrastructure: z.object({
    measurementClass: z.literal('allocated_wall_time_provisional'),
    allocatedVcpuCount: z.literal(1),
    allocatedMemoryGib: z.literal(1),
    wallTimeMicroseconds: z.number().int().positive().max(900_000_000),
    rawUsageEvidenceDigest: sha256,
    rateCardDigest: sha256,
    unit: z.literal('cpu_second'),
    unitPriceMicros: z.literal(1_000),
    minimumChargeMicros: z.literal(1_000),
    billableCpuSeconds: z.number().int().positive().max(900),
    actualInternalCostMicros: safeMicros,
    invoiceReconciled: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  reconciliation: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerCostMicros: z.literal(0).nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const unknown = value.outcome.state === 'unknown_reconciliation_required'
  const reconciled = value.outcome.state.startsWith('unknown_reconciled_')
  if (
    value.infrastructure.actualInternalCostMicros !== Math.max(
      value.infrastructure.minimumChargeMicros,
      value.infrastructure.billableCpuSeconds *
        value.infrastructure.unitPriceMicros,
    ) ||
    value.reconciliation.infrastructureCostMicros !==
      value.infrastructure.actualInternalCostMicros ||
    unknown !== (value.reconciliation.state === 'reconciliation_required') ||
    (unknown && (
      value.provider.costReconciled ||
      value.provider.billedUsageMicrocredits !== null ||
      value.provider.actualInternalCostMicros !== null ||
      value.reconciliation.providerCostMicros !== null ||
      value.reconciliation.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && (
      !value.provider.costReconciled ||
      value.provider.billedUsageMicrocredits !== 0 ||
      value.provider.actualInternalCostMicros !== 0 ||
      value.reconciliation.providerCostMicros !== 0 ||
      value.reconciliation.totalInternalProductionCostMicros !==
        value.infrastructure.actualInternalCostMicros
    )) ||
    reconciled !== (value.priorUnknownCostEvidenceHash !== null) ||
    (reconciled && (
      value.provider.requestCount !== 1 ||
      value.provider.usageEvidenceDigest === null
    ))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt V3 cost reconciliation is inconsistent.',
    })
  }
})

export type PrivateProviderAttemptCostEvidenceV3 = z.infer<
  typeof privateProviderAttemptCostEvidenceV3Schema
>

export const privateProviderAttemptCostEvidenceV4Schema = z.object({
  schemaVersion: z.literal(PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V4_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.literal('private_injected_nonprovider_test'),
  evidenceId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    packageRecordId: identity,
    approvedWorkItemId: identity,
    jobId: identity,
    claimId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchAttemptId: identity,
    providerOperationId: z.literal(
      CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
    ),
    providerRouteId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID),
    providerModelId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_MODEL_ID),
    visualCalibrationContextDigest: sha256,
  }).strict(),
  authorityHash: sha256,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  priorUnknownCostEvidenceHash: sha256.nullable(),
  canonicalSharedRateCardCompatibilityVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  provider: z.object({
    requestCount: z.union([z.literal(0), z.literal(1)]),
    usageEvidenceDigest: sha256.nullable(),
    rateCardSnapshotId: identity,
    rateCardDigest: sha256,
    rateEvidenceClass: z.literal(
      'official_public_pricing_snapshot_unreleased',
    ),
    sourceCode: z.literal('google_gemini_api_pricing_2026_07_21'),
    unit: z.literal('input_and_video_output_tokens'),
    inputMicrosPerMillionTokens: z.literal(1_500_000),
    videoOutputMicrosPerMillionTokens: z.literal(17_500_000),
    videoOutputTokensPerSecond: z.literal(5_792),
    inputTokenCount: z.number().int().nonnegative().max(1_000_000).nullable(),
    videoOutputSeconds: z.number().int().nonnegative().max(10).nullable(),
    videoOutputTokenCount: z.number().int().nonnegative().max(57_920).nullable(),
    calculationDigest: sha256.nullable(),
    usageClass: z.enum([
      'none_private_injected',
      'exact_reconciled_token_and_duration_usage',
      'unknown',
    ]),
    actualInternalCostMicros: safeMicros.nullable(),
    costReconciled: z.boolean(),
  }).strict(),
  infrastructure: z.object({
    measurementClass: z.literal('allocated_wall_time_provisional'),
    allocatedVcpuCount: z.literal(1),
    allocatedMemoryGib: z.literal(1),
    wallTimeMicroseconds: z.number().int().positive().max(900_000_000),
    rawUsageEvidenceDigest: sha256,
    rateCardDigest: sha256,
    unit: z.literal('cpu_second'),
    unitPriceMicros: z.literal(1_000),
    minimumChargeMicros: z.literal(1_000),
    billableCpuSeconds: z.number().int().positive().max(900),
    actualInternalCostMicros: safeMicros,
    invoiceReconciled: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  reconciliation: z.object({
    state: z.enum(['complete', 'reconciliation_required']),
    providerCostMicros: safeMicros.nullable(),
    infrastructureCostMicros: safeMicros,
    totalInternalProductionCostMicros: safeMicros.nullable(),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const unknown = value.outcome.state === 'unknown_reconciliation_required'
  const reconciled = value.outcome.state.startsWith('unknown_reconciled_')
  const noRequest = value.provider.requestCount === 0
  const exactUsage = value.provider.usageClass ===
    'exact_reconciled_token_and_duration_usage'
  const noUsage = value.provider.usageClass === 'none_private_injected'
  const expectedCalculation = value.provider.inputTokenCount === null ||
    value.provider.videoOutputSeconds === null
    ? null
    : calculateGeminiOmniVisualCalibrationProviderCostMicros({
        inputTokenCount: value.provider.inputTokenCount,
        videoOutputSeconds: value.provider.videoOutputSeconds,
      })
  const expectedVideoTokens = expectedCalculation?.videoOutputTokenCount ?? null
  const expectedCost = expectedCalculation?.totalCostMicros ?? null
  const expectedCalculationDigest = expectedCalculation?.calculationDigest ?? null
  if (
    value.infrastructure.actualInternalCostMicros !== Math.max(
      value.infrastructure.minimumChargeMicros,
      value.infrastructure.billableCpuSeconds *
        value.infrastructure.unitPriceMicros,
    ) ||
    value.reconciliation.infrastructureCostMicros !==
      value.infrastructure.actualInternalCostMicros ||
    unknown !== (value.reconciliation.state === 'reconciliation_required') ||
    expectedVideoTokens !== value.provider.videoOutputTokenCount ||
    expectedCalculationDigest !== value.provider.calculationDigest ||
    (unknown && (
      value.provider.usageClass !== 'unknown' ||
      value.provider.costReconciled ||
      value.provider.inputTokenCount !== null ||
      value.provider.videoOutputSeconds !== null ||
      value.provider.videoOutputTokenCount !== null ||
      value.provider.calculationDigest !== null ||
      value.provider.actualInternalCostMicros !== null ||
      value.reconciliation.providerCostMicros !== null ||
      value.reconciliation.totalInternalProductionCostMicros !== null
    )) ||
    (!unknown && noRequest && (
      !noUsage || !value.provider.costReconciled ||
      value.provider.usageEvidenceDigest !== null ||
      value.provider.inputTokenCount !== 0 ||
      value.provider.videoOutputSeconds !== 0 ||
      value.provider.actualInternalCostMicros !== 0 ||
      value.reconciliation.providerCostMicros !== 0
    )) ||
    (!unknown && !noRequest && (
      !exactUsage || !value.provider.costReconciled ||
      value.provider.usageEvidenceDigest === null || expectedCost === null ||
      value.provider.actualInternalCostMicros !== expectedCost ||
      value.reconciliation.providerCostMicros !== expectedCost
    )) ||
    (!unknown && value.reconciliation.totalInternalProductionCostMicros !==
      (value.provider.actualInternalCostMicros ?? 0) +
        value.infrastructure.actualInternalCostMicros) ||
    reconciled !== (value.priorUnknownCostEvidenceHash !== null) ||
    (reconciled && (!exactUsage || value.provider.requestCount !== 1))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Provider-attempt V4 cost reconciliation is inconsistent.',
    })
  }
})

export type PrivateProviderAttemptCostEvidenceV4 = z.infer<
  typeof privateProviderAttemptCostEvidenceV4Schema
>
export type PrivateProviderAttemptCostEvidenceAny =
  | PrivateProviderAttemptCostEvidence
  | PrivateProviderAttemptCostEvidenceV2
  | PrivateProviderAttemptCostEvidenceV3
  | PrivateProviderAttemptCostEvidenceV4

export interface CreatePrivateProviderAttemptCostEvidenceInput {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorization
  claim: {
    claimId: string
    claimHash: string
    deliveryAttempt: number
  }
  dispatchAttemptId: string
  attemptInputHash: string
  outcomeState: PrivateProviderAttemptCostEvidence['outcome']['state']
  providerRequestCount: 0 | 1
  providerUsageEvidenceDigest: string | null
  providerCostReconciled: boolean
  infrastructure: {
    measurementClass: PrivateProviderAttemptCostEvidence['infrastructure']['measurementClass']
    wallTimeMicroseconds: number
    observedCpuMicroseconds: number | null
    observedPeakMemoryBytes: number | null
    rawUsageEvidenceDigest: string
  }
  priorUnknownCostEvidenceHash?: string
  createdAt: string
}

export interface CreatePrivateProviderAttemptCostEvidenceV2Input {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV2
  claim: {
    claimId: string
    claimHash: string
    deliveryAttempt: number
  }
  dispatchAttemptId: string
  attemptInputHash: string
  outcomeState: PrivateProviderAttemptCostEvidenceV2['outcome']['state']
  providerRequestCount: 0 | 1
  providerUsageEvidenceDigest: string | null
  infrastructure: {
    wallTimeMicroseconds: number
    rawUsageEvidenceDigest: string
  }
  priorUnknownCostEvidenceHash?: string
  createdAt: string
}

export interface CreatePrivateProviderAttemptCostEvidenceV3Input {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV3
  claim: {
    claimId: string
    claimHash: string
    deliveryAttempt: number
  }
  dispatchAttemptId: string
  attemptInputHash: string
  outcomeState: PrivateProviderAttemptCostEvidenceV3['outcome']['state']
  providerRequestCount: 0 | 1
  providerUsageEvidenceDigest: string | null
  infrastructure: {
    wallTimeMicroseconds: number
    rawUsageEvidenceDigest: string
  }
  priorUnknownCostEvidenceHash?: string
  createdAt: string
}

export interface CreatePrivateProviderAttemptCostEvidenceV4Input {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV4
  claim: {
    claimId: string
    claimHash: string
    deliveryAttempt: number
  }
  dispatchAttemptId: string
  attemptInputHash: string
  outcomeState: PrivateProviderAttemptCostEvidenceV4['outcome']['state']
  providerRequestCount: 0 | 1
  providerUsageEvidenceDigest: string | null
  providerUsage: {
    inputTokenCount: number
    videoOutputSeconds: number
  } | null
  infrastructure: {
    wallTimeMicroseconds: number
    rawUsageEvidenceDigest: string
  }
  priorUnknownCostEvidenceHash?: string
  createdAt: string
}

export function calculateGeminiOmniVisualCalibrationProviderCostMicros(input: {
  inputTokenCount: number
  videoOutputSeconds: number
}): {
  inputCostMicros: number
  videoOutputTokenCount: number
  videoOutputCostMicros: number
  totalCostMicros: number
  calculationDigest: string
} {
  if (
    !Number.isSafeInteger(input.inputTokenCount) ||
    input.inputTokenCount < 0 || input.inputTokenCount > 1_000_000 ||
    !Number.isSafeInteger(input.videoOutputSeconds) ||
    input.videoOutputSeconds < 0 || input.videoOutputSeconds > 10
  ) throw invalid('Gemini Omni provider usage is outside frozen bounds.')
  const inputCostMicros = Math.ceil(
    input.inputTokenCount * 1_500_000 / 1_000_000,
  )
  const videoOutputTokenCount = input.videoOutputSeconds * 5_792
  const videoOutputCostMicros = Math.ceil(
    videoOutputTokenCount * 17_500_000 / 1_000_000,
  )
  const totalCostMicros = inputCostMicros + videoOutputCostMicros
  const calculation = {
    sourceCode: 'google_gemini_api_pricing_2026_07_21' as const,
    inputTokenCount: input.inputTokenCount,
    inputMicrosPerMillionTokens: 1_500_000 as const,
    inputCostMicros,
    videoOutputSeconds: input.videoOutputSeconds,
    videoOutputTokensPerSecond: 5_792 as const,
    videoOutputTokenCount,
    videoOutputMicrosPerMillionTokens: 17_500_000 as const,
    videoOutputCostMicros,
    totalCostMicros,
  }
  return {
    inputCostMicros,
    videoOutputTokenCount,
    videoOutputCostMicros,
    totalCostMicros,
    calculationDigest: sha256AuthorityValue(calculation),
  }
}

export async function createPrivateProviderAttemptCostEvidenceV4(
  input: CreatePrivateProviderAttemptCostEvidenceV4Input,
): Promise<{
  evidence: PrivateProviderAttemptCostEvidenceV4
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const authorization = input.authorization
  const profile = resolveCanonicalProviderOperationV4(authorization.operationId)
  const usageDigestValid = input.providerUsageEvidenceDigest === null ||
    /^[a-f0-9]{64}$/u.test(input.providerUsageEvidenceDigest)
  const priorDigestValid = input.priorUnknownCostEvidenceHash === undefined ||
    /^[a-f0-9]{64}$/u.test(input.priorUnknownCostEvidenceHash)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    input.claim.deliveryAttempt < 1 || input.claim.deliveryAttempt > 10 ||
    !/^[a-f0-9]{64}$/u.test(input.claim.claimHash) ||
    !/^[a-f0-9]{64}$/u.test(input.attemptInputHash) ||
    !usageDigestValid || !priorDigestValid ||
    !/^[a-f0-9]{64}$/u.test(input.infrastructure.rawUsageEvidenceDigest) ||
    Date.parse(input.createdAt) < Date.parse(authorization.authorizedAt) ||
    Date.parse(input.createdAt) > Date.parse(authorization.expiresAt) ||
    Date.parse(input.createdAt) >
      Date.parse(authorization.providerRateAuthority.expiresAt) ||
    !Number.isSafeInteger(input.infrastructure.wallTimeMicroseconds) ||
    input.infrastructure.wallTimeMicroseconds <= 0 ||
    input.infrastructure.wallTimeMicroseconds >
      profile.requestPolicy.maximumElapsedMilliseconds * 1_000
  ) throw invalid('Provider-attempt V4 cost authority is invalid or stale.')
  const unknown = input.outcomeState === 'unknown_reconciliation_required'
  const reconciled = input.outcomeState.startsWith('unknown_reconciled_')
  if (
    unknown !== (input.providerRequestCount === 1 && input.providerUsage === null) ||
    (input.providerRequestCount === 0 && (
      input.providerUsage !== null || input.providerUsageEvidenceDigest !== null
    )) ||
    (input.providerRequestCount === 1 && !unknown && (
      input.providerUsage === null || input.providerUsageEvidenceDigest === null
    )) ||
    reconciled !== (input.priorUnknownCostEvidenceHash !== undefined)
  ) throw invalid('Provider-attempt V4 usage reconciliation is inconsistent.')
  const providerCalculation = input.providerUsage
    ? calculateGeminiOmniVisualCalibrationProviderCostMicros(input.providerUsage)
    : null
  const providerCostMicros = unknown
    ? null
    : providerCalculation?.totalCostMicros ?? 0
  if (
    providerCostMicros !== null &&
    providerCostMicros > authorization.maximumAuthorizedProviderCostMicros
  ) throw invalid('Provider-attempt V4 provider cost exceeds authority.')
  const billableCpuSeconds = Math.ceil(
    input.infrastructure.wallTimeMicroseconds / 1_000_000,
  )
  const infrastructureCostMicros = Math.max(1_000, billableCpuSeconds * 1_000)
  if (
    infrastructureCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros ||
    (providerCostMicros ?? 0) + infrastructureCostMicros >
      authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw invalid('Provider-attempt V4 infrastructure cost exceeds authority.')
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v4',
    authorizationHash: authorization.authorityHash,
    claimId: input.claim.claimId,
    claimHash: input.claim.claimHash,
    deliveryAttempt: input.claim.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v4_${attemptIdentityHash.slice(0, 45)}`
  const infrastructureRateCard = {
    source: 'private_local_placeholder_not_cloud_invoice' as const,
    unit: 'cpu_second' as const,
    unitPriceMicros: 1_000 as const,
    minimumChargeMicros: 1_000 as const,
  }
  const payload = {
    schemaVersion: PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V4_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: 'private_injected_nonprovider_test' as const,
    evidenceId,
    identity: {
      workspaceId: authorization.workspaceId,
      projectId: authorization.projectId,
      editSessionId: authorization.editSessionId,
      approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
      packageRecordId: authorization.packageRecordId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      jobId: authorization.queueJobId,
      claimId: input.claim.claimId,
      deliveryAttempt: input.claim.deliveryAttempt,
      dispatchAttemptId: input.dispatchAttemptId,
      providerOperationId: authorization.operationId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
      visualCalibrationContextDigest:
        authorization.visualCalibrationContextDigest,
    },
    authorityHash: authorization.authorityHash,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    priorUnknownCostEvidenceHash: input.priorUnknownCostEvidenceHash ?? null,
    canonicalSharedRateCardCompatibilityVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: {
      requestCount: input.providerRequestCount,
      usageEvidenceDigest: input.providerUsageEvidenceDigest,
      rateCardSnapshotId: authorization.providerRateAuthority.snapshotId,
      rateCardDigest: authorization.providerRateAuthority.snapshotDigest,
      rateEvidenceClass: authorization.providerRateAuthority.evidenceClass,
      sourceCode: authorization.providerRateAuthority.sourceCode,
      unit: 'input_and_video_output_tokens' as const,
      inputMicrosPerMillionTokens:
        authorization.providerRateAuthority.inputMicrosPerMillionTokens,
      videoOutputMicrosPerMillionTokens:
        authorization.providerRateAuthority.videoOutputMicrosPerMillionTokens,
      videoOutputTokensPerSecond:
        authorization.providerRateAuthority.videoOutputTokensPerSecond,
      inputTokenCount: input.providerUsage?.inputTokenCount ??
        (input.providerRequestCount === 0 ? 0 : null),
      videoOutputSeconds: input.providerUsage?.videoOutputSeconds ??
        (input.providerRequestCount === 0 ? 0 : null),
      videoOutputTokenCount: providerCalculation?.videoOutputTokenCount ??
        (input.providerRequestCount === 0 ? 0 : null),
      calculationDigest: providerCalculation?.calculationDigest ??
        (input.providerRequestCount === 0
          ? calculateGeminiOmniVisualCalibrationProviderCostMicros({
              inputTokenCount: 0,
              videoOutputSeconds: 0,
            }).calculationDigest
          : null),
      usageClass: unknown
        ? 'unknown' as const
        : input.providerRequestCount === 0
          ? 'none_private_injected' as const
          : 'exact_reconciled_token_and_duration_usage' as const,
      actualInternalCostMicros: providerCostMicros,
      costReconciled: !unknown,
    },
    infrastructure: {
      measurementClass: 'allocated_wall_time_provisional' as const,
      allocatedVcpuCount: 1 as const,
      allocatedMemoryGib: 1 as const,
      wallTimeMicroseconds: input.infrastructure.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.infrastructure.rawUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(infrastructureRateCard),
      unit: 'cpu_second' as const,
      unitPriceMicros: 1_000 as const,
      minimumChargeMicros: 1_000 as const,
      billableCpuSeconds,
      actualInternalCostMicros: infrastructureCostMicros,
      invoiceReconciled: false as const,
    },
    outcome: {
      state: input.outcomeState,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    reconciliation: {
      state: unknown
        ? 'reconciliation_required' as const
        : 'complete' as const,
      providerCostMicros,
      infrastructureCostMicros,
      totalInternalProductionCostMicros: providerCostMicros === null
        ? null
        : providerCostMicros + infrastructureCostMicros,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    createdAt: input.createdAt,
  }
  const evidence = privateProviderAttemptCostEvidenceV4Schema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
  assertNoCommercialFields(evidence)
  const relativePath = evidenceRelativePathV4(evidence)
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!persisted || !persisted.equals(bytes)) {
    throw invalid('Provider-attempt V4 cost evidence failed create-only readback.')
  }
  return {
    evidence,
    idempotencyStatus: result.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateProviderAttemptCostEvidenceV4ForAttempt(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV4
  claimId: string
  claimHash: string
  deliveryAttempt: number
  dispatchAttemptId: string
  evidenceHash: string
}): Promise<PrivateProviderAttemptCostEvidenceV4> {
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v4',
    authorizationHash: input.authorization.authorityHash,
    claimId: input.claimId,
    claimHash: input.claimHash,
    deliveryAttempt: input.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v4_${attemptIdentityHash.slice(0, 45)}`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: evidenceRelativePathV4({
      identity: {
        workspaceId: input.authorization.workspaceId,
        projectId: input.authorization.projectId,
        editSessionId: input.authorization.editSessionId,
      },
      evidenceId,
      evidenceHash: input.evidenceHash,
    }),
  })
  if (!bytes || bytes.byteLength > 64 * 1024) {
    throw invalid('Provider-attempt V4 cost evidence is missing or oversized.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Provider-attempt V4 cost evidence is not valid JSON.')
  }
  const evidence = privateProviderAttemptCostEvidenceV4Schema.parse(decoded)
  const { evidenceHash, ...payload } = evidence
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    evidenceHash !== input.evidenceHash ||
    evidence.evidenceId !== evidenceId ||
    evidence.authorityHash !== input.authorization.authorityHash ||
    evidence.attemptIdentityHash !== attemptIdentityHash ||
    evidence.identity.claimId !== input.claimId ||
    evidence.identity.deliveryAttempt !== input.deliveryAttempt ||
    evidence.identity.dispatchAttemptId !== input.dispatchAttemptId ||
    evidence.identity.workspaceId !== input.authorization.workspaceId ||
    evidence.identity.projectId !== input.authorization.projectId ||
    evidence.identity.editSessionId !== input.authorization.editSessionId ||
    evidence.identity.approvedPlanSnapshotId !==
      input.authorization.approvedPlanSnapshotId ||
    evidence.identity.packageRecordId !== input.authorization.packageRecordId ||
    evidence.identity.approvedWorkItemId !==
      input.authorization.approvedWorkItemId ||
    evidence.identity.jobId !== input.authorization.queueJobId ||
    evidence.identity.providerOperationId !== input.authorization.operationId ||
    evidence.identity.providerRouteId !== input.authorization.providerRouteId ||
    evidence.identity.providerModelId !== input.authorization.providerModelId ||
    evidence.identity.visualCalibrationContextDigest !==
      input.authorization.visualCalibrationContextDigest ||
    evidence.attemptInputHash !==
      input.authorization.providerRequestPayloadDigest ||
    evidence.provider.rateCardSnapshotId !==
      input.authorization.providerRateAuthority.snapshotId ||
    evidence.provider.rateCardDigest !==
      input.authorization.providerRateAuthority.snapshotDigest
  ) throw invalid('Provider-attempt V4 cost evidence changed exact attempt lineage.')
  assertNoCommercialFields(evidence)
  return evidence
}

export async function createPrivateProviderAttemptCostEvidenceV3(
  input: CreatePrivateProviderAttemptCostEvidenceV3Input,
): Promise<{
  evidence: PrivateProviderAttemptCostEvidenceV3
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const authorization = input.authorization
  const profile = resolveCanonicalProviderOperationV3(authorization.operationId)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    input.claim.deliveryAttempt < 1 || input.claim.deliveryAttempt > 10 ||
    !/^[a-f0-9]{64}$/u.test(input.claim.claimHash) ||
    !/^[a-f0-9]{64}$/u.test(input.attemptInputHash) ||
    (input.providerUsageEvidenceDigest !== null &&
      !/^[a-f0-9]{64}$/u.test(input.providerUsageEvidenceDigest)) ||
    (input.priorUnknownCostEvidenceHash !== undefined &&
      !/^[a-f0-9]{64}$/u.test(input.priorUnknownCostEvidenceHash)) ||
    !/^[a-f0-9]{64}$/u.test(input.infrastructure.rawUsageEvidenceDigest) ||
    Date.parse(input.createdAt) < Date.parse(authorization.authorizedAt) ||
    Date.parse(input.createdAt) > Date.parse(authorization.expiresAt) ||
    !Number.isSafeInteger(input.infrastructure.wallTimeMicroseconds) ||
    input.infrastructure.wallTimeMicroseconds <= 0 ||
    input.infrastructure.wallTimeMicroseconds >
      profile.requestPolicy.maximumElapsedMilliseconds * 1_000
  ) throw invalid('Provider-attempt V3 cost authority is invalid or stale.')
  const billableCpuSeconds = Math.ceil(
    input.infrastructure.wallTimeMicroseconds / 1_000_000,
  )
  const infrastructureCostMicros = Math.max(1_000, billableCpuSeconds * 1_000)
  if (
    infrastructureCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros ||
    infrastructureCostMicros > authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw invalid('Provider-attempt V3 infrastructure cost exceeds authority.')
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v3',
    authorizationHash: authorization.authorityHash,
    claimId: input.claim.claimId,
    claimHash: input.claim.claimHash,
    deliveryAttempt: input.claim.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v3_${attemptIdentityHash.slice(0, 45)}`
  const reconciliationRequired =
    input.outcomeState === 'unknown_reconciliation_required'
  const reconciled = input.outcomeState.startsWith('unknown_reconciled_')
  if (
    reconciled !== (input.priorUnknownCostEvidenceHash !== undefined) ||
    (reconciled && (
      input.providerRequestCount !== 1 ||
      input.providerUsageEvidenceDigest === null
    ))
  ) throw invalid('Provider-attempt V3 unknown reconciliation lineage is invalid.')
  const infrastructureRateCard = {
    source: 'private_local_placeholder_not_cloud_invoice' as const,
    unit: 'cpu_second' as const,
    unitPriceMicros: 1_000 as const,
    minimumChargeMicros: 1_000 as const,
  }
  const payload = {
    schemaVersion: PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V3_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: 'private_injected_nonprovider_test' as const,
    evidenceId,
    identity: {
      workspaceId: authorization.workspaceId,
      projectId: authorization.projectId,
      editSessionId: authorization.editSessionId,
      approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
      packageRecordId: authorization.packageRecordId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      jobId: authorization.queueJobId,
      claimId: input.claim.claimId,
      deliveryAttempt: input.claim.deliveryAttempt,
      dispatchAttemptId: input.dispatchAttemptId,
      providerOperationId: authorization.operationId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
    },
    authorityHash: authorization.authorityHash,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    priorUnknownCostEvidenceHash: input.priorUnknownCostEvidenceHash ?? null,
    canonicalSharedRateCardCompatibilityVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: {
      requestCount: input.providerRequestCount,
      usageEvidenceDigest: input.providerUsageEvidenceDigest,
      rateCardSnapshotId: authorization.providerRateAuthority.snapshotId,
      rateCardDigest: authorization.providerRateAuthority.snapshotDigest,
      rateEvidenceClass: 'private_local_fixture' as const,
      unit: 'generation_submission' as const,
      billedUsageMicrocredits: reconciliationRequired ? null : 0 as const,
      actualInternalCostMicros: reconciliationRequired ? null : 0 as const,
      costReconciled: !reconciliationRequired,
    },
    infrastructure: {
      measurementClass: 'allocated_wall_time_provisional' as const,
      allocatedVcpuCount: 1 as const,
      allocatedMemoryGib: 1 as const,
      wallTimeMicroseconds: input.infrastructure.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.infrastructure.rawUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(infrastructureRateCard),
      unit: 'cpu_second' as const,
      unitPriceMicros: 1_000 as const,
      minimumChargeMicros: 1_000 as const,
      billableCpuSeconds,
      actualInternalCostMicros: infrastructureCostMicros,
      invoiceReconciled: false as const,
    },
    outcome: {
      state: input.outcomeState,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    reconciliation: {
      state: reconciliationRequired
        ? 'reconciliation_required' as const
        : 'complete' as const,
      providerCostMicros: reconciliationRequired ? null : 0 as const,
      infrastructureCostMicros,
      totalInternalProductionCostMicros: reconciliationRequired
        ? null
        : infrastructureCostMicros,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    createdAt: input.createdAt,
  }
  const evidence = privateProviderAttemptCostEvidenceV3Schema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
  assertNoCommercialFields(evidence)
  const relativePath = evidenceRelativePathV3(evidence)
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!persisted || !persisted.equals(bytes)) {
    throw invalid('Provider-attempt V3 cost evidence failed create-only readback.')
  }
  return {
    evidence,
    idempotencyStatus: result.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateProviderAttemptCostEvidenceV3ForAttempt(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV3
  claimId: string
  claimHash: string
  deliveryAttempt: number
  dispatchAttemptId: string
  evidenceHash: string
}): Promise<PrivateProviderAttemptCostEvidenceV3> {
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v3',
    authorizationHash: input.authorization.authorityHash,
    claimId: input.claimId,
    claimHash: input.claimHash,
    deliveryAttempt: input.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v3_${attemptIdentityHash.slice(0, 45)}`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: evidenceRelativePathV3({
      identity: {
        workspaceId: input.authorization.workspaceId,
        projectId: input.authorization.projectId,
        editSessionId: input.authorization.editSessionId,
      },
      evidenceId,
      evidenceHash: input.evidenceHash,
    }),
  })
  if (!bytes || bytes.byteLength > 64 * 1024) {
    throw invalid('Provider-attempt V3 cost evidence is missing or oversized.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Provider-attempt V3 cost evidence is not valid JSON.')
  }
  const evidence = privateProviderAttemptCostEvidenceV3Schema.parse(decoded)
  const { evidenceHash, ...payload } = evidence
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    evidenceHash !== input.evidenceHash ||
    evidence.evidenceId !== evidenceId ||
    evidence.authorityHash !== input.authorization.authorityHash ||
    evidence.attemptIdentityHash !== attemptIdentityHash ||
    evidence.identity.claimId !== input.claimId ||
    evidence.identity.deliveryAttempt !== input.deliveryAttempt ||
    evidence.identity.dispatchAttemptId !== input.dispatchAttemptId
  ) throw invalid('Provider-attempt V3 cost evidence changed exact attempt lineage.')
  assertNoCommercialFields(evidence)
  return evidence
}

export async function createPrivateProviderAttemptCostEvidenceV2(
  input: CreatePrivateProviderAttemptCostEvidenceV2Input,
): Promise<{
  evidence: PrivateProviderAttemptCostEvidenceV2
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const authorization = input.authorization
  const profile = resolveCanonicalProviderOperationV2(authorization.operationId)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    input.claim.deliveryAttempt < 1 || input.claim.deliveryAttempt > 10 ||
    !/^[a-f0-9]{64}$/u.test(input.claim.claimHash) ||
    !/^[a-f0-9]{64}$/u.test(input.attemptInputHash) ||
    (input.providerUsageEvidenceDigest !== null &&
      !/^[a-f0-9]{64}$/u.test(input.providerUsageEvidenceDigest)) ||
    (input.priorUnknownCostEvidenceHash !== undefined &&
      !/^[a-f0-9]{64}$/u.test(input.priorUnknownCostEvidenceHash)) ||
    !/^[a-f0-9]{64}$/u.test(input.infrastructure.rawUsageEvidenceDigest) ||
    Date.parse(input.createdAt) < Date.parse(authorization.authorizedAt) ||
    Date.parse(input.createdAt) > Date.parse(authorization.expiresAt) ||
    !Number.isSafeInteger(input.infrastructure.wallTimeMicroseconds) ||
    input.infrastructure.wallTimeMicroseconds <= 0 ||
    input.infrastructure.wallTimeMicroseconds >
      profile.requestPolicy.maximumElapsedMilliseconds * 1_000
  ) throw invalid('Provider-attempt V2 cost authority is invalid or stale.')
  const billableCpuSeconds = Math.ceil(
    input.infrastructure.wallTimeMicroseconds / 1_000_000,
  )
  const infrastructureCostMicros = Math.max(1_000, billableCpuSeconds * 1_000)
  if (
    infrastructureCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros ||
    infrastructureCostMicros > authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw invalid('Provider-attempt V2 infrastructure cost exceeds authority.')
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v2',
    authorizationHash: authorization.authorityHash,
    claimId: input.claim.claimId,
    claimHash: input.claim.claimHash,
    deliveryAttempt: input.claim.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v2_${attemptIdentityHash.slice(0, 45)}`
  const infrastructureRateCard = {
    source: 'private_local_placeholder_not_cloud_invoice' as const,
    unit: 'cpu_second' as const,
    unitPriceMicros: 1_000 as const,
    minimumChargeMicros: 1_000 as const,
  }
  const reconciliationRequired =
    input.outcomeState === 'unknown_reconciliation_required'
  const reconciled = input.outcomeState.startsWith('unknown_reconciled_')
  if (
    (reconciled !== (input.priorUnknownCostEvidenceHash !== undefined)) ||
    (reconciled && (
      input.providerRequestCount !== 1 ||
      input.providerUsageEvidenceDigest === null
    ))
  ) throw invalid('Provider-attempt V2 unknown reconciliation lineage is invalid.')
  const payload = {
    schemaVersion: PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_V2_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: 'private_injected_nonprovider_test' as const,
    evidenceId,
    identity: {
      workspaceId: authorization.workspaceId,
      projectId: authorization.projectId,
      editSessionId: authorization.editSessionId,
      approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
      packageRecordId: authorization.packageRecordId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      jobId: authorization.queueJobId,
      claimId: input.claim.claimId,
      deliveryAttempt: input.claim.deliveryAttempt,
      dispatchAttemptId: input.dispatchAttemptId,
      providerOperationId: authorization.operationId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
    },
    authorityHash: authorization.authorityHash,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    priorUnknownCostEvidenceHash: input.priorUnknownCostEvidenceHash ?? null,
    canonicalSharedRateCardCompatibilityVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: {
      requestCount: input.providerRequestCount,
      usageEvidenceDigest: input.providerUsageEvidenceDigest,
      rateCardSnapshotId: authorization.providerRateAuthority.snapshotId,
      rateCardDigest: authorization.providerRateAuthority.snapshotDigest,
      rateEvidenceClass: 'private_local_fixture' as const,
      unit: 'input_character' as const,
      billedUsageMicrocredits: reconciliationRequired ? null : 0 as const,
      actualInternalCostMicros: reconciliationRequired ? null : 0 as const,
      costReconciled: !reconciliationRequired,
    },
    infrastructure: {
      measurementClass: 'allocated_wall_time_provisional' as const,
      allocatedVcpuCount: 1 as const,
      allocatedMemoryGib: 1 as const,
      wallTimeMicroseconds: input.infrastructure.wallTimeMicroseconds,
      rawUsageEvidenceDigest: input.infrastructure.rawUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(infrastructureRateCard),
      unit: 'cpu_second' as const,
      unitPriceMicros: 1_000 as const,
      minimumChargeMicros: 1_000 as const,
      billableCpuSeconds,
      actualInternalCostMicros: infrastructureCostMicros,
      invoiceReconciled: false as const,
    },
    outcome: {
      state: input.outcomeState,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    reconciliation: {
      state: reconciliationRequired
        ? 'reconciliation_required' as const
        : 'complete' as const,
      providerCostMicros: reconciliationRequired ? null : 0 as const,
      infrastructureCostMicros,
      totalInternalProductionCostMicros: reconciliationRequired
        ? null
        : infrastructureCostMicros,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    createdAt: input.createdAt,
  }
  const evidence = privateProviderAttemptCostEvidenceV2Schema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
  assertNoCommercialFields(evidence)
  const relativePath = evidenceRelativePathV2(evidence)
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!persisted || !persisted.equals(bytes)) {
    throw invalid('Provider-attempt V2 cost evidence failed create-only readback.')
  }
  return {
    evidence,
    idempotencyStatus: result.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateProviderAttemptCostEvidenceV2ForAttempt(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorizationV2
  claimId: string
  claimHash: string
  deliveryAttempt: number
  dispatchAttemptId: string
  evidenceHash: string
}): Promise<PrivateProviderAttemptCostEvidenceV2> {
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v2',
    authorizationHash: input.authorization.authorityHash,
    claimId: input.claimId,
    claimHash: input.claimHash,
    deliveryAttempt: input.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_v2_${attemptIdentityHash.slice(0, 45)}`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: evidenceRelativePathV2({
      identity: {
        workspaceId: input.authorization.workspaceId,
        projectId: input.authorization.projectId,
        editSessionId: input.authorization.editSessionId,
      },
      evidenceId,
      evidenceHash: input.evidenceHash,
    }),
  })
  if (!bytes || bytes.byteLength > 64 * 1024) {
    throw invalid('Provider-attempt V2 cost evidence is missing or oversized.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Provider-attempt V2 cost evidence is not valid JSON.')
  }
  const evidence = privateProviderAttemptCostEvidenceV2Schema.parse(decoded)
  const { evidenceHash, ...payload } = evidence
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    evidenceHash !== input.evidenceHash ||
    evidence.evidenceId !== evidenceId ||
    evidence.authorityHash !== input.authorization.authorityHash ||
    evidence.attemptIdentityHash !== attemptIdentityHash ||
    evidence.identity.claimId !== input.claimId ||
    evidence.identity.deliveryAttempt !== input.deliveryAttempt ||
    evidence.identity.dispatchAttemptId !== input.dispatchAttemptId
  ) throw invalid('Provider-attempt V2 cost evidence changed exact attempt lineage.')
  assertNoCommercialFields(evidence)
  return evidence
}

export async function createPrivateProviderAttemptCostEvidence(
  input: CreatePrivateProviderAttemptCostEvidenceInput,
): Promise<{
  evidence: PrivateProviderAttemptCostEvidence
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const authorization = input.authorization
  const profile = resolveCanonicalProviderOperation(authorization.operationId)
  if (
    authorization.operationProfileHash !== profile.profileHash ||
    input.claim.deliveryAttempt < 1 || input.claim.deliveryAttempt > 10 ||
    !/^[a-f0-9]{64}$/u.test(input.claim.claimHash) ||
    !/^[a-f0-9]{64}$/u.test(input.attemptInputHash) ||
    Date.parse(input.createdAt) < Date.parse(authorization.authorizedAt) ||
    Date.parse(input.createdAt) > Date.parse(authorization.expiresAt)
  ) throw invalid('Provider-attempt cost authority is invalid or stale.')

  const measuredMicroseconds = input.infrastructure.observedCpuMicroseconds ??
    input.infrastructure.wallTimeMicroseconds
  if (!Number.isSafeInteger(measuredMicroseconds) || measuredMicroseconds <= 0) {
    throw invalid('Provider-attempt infrastructure duration is invalid.')
  }
  const billableCpuSeconds = Math.ceil(measuredMicroseconds / 1_000_000)
  const infrastructureCostMicros = Math.max(
    profile.costPolicy.infrastructureRate.minimumChargeMicros,
    billableCpuSeconds * profile.costPolicy.infrastructureRate.unitPriceMicros,
  )
  if (
    billableCpuSeconds > profile.costPolicy.infrastructureRate.maximumAuthorizedCpuSeconds ||
    infrastructureCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros
  ) throw invalid('Provider-attempt infrastructure cost exceeds immutable authority.')

  const providerCostMicros = input.providerCostReconciled
    ? input.providerRequestCount * profile.costPolicy.providerRate.unitPriceMicros
    : null
  if (
    providerCostMicros !== null &&
    providerCostMicros > authorization.maximumAuthorizedProviderCostMicros
  ) throw invalid('Provider-attempt provider cost exceeds immutable authority.')
  const totalInternalProductionCostMicros = providerCostMicros === null
    ? null
    : providerCostMicros + infrastructureCostMicros
  if (
    totalInternalProductionCostMicros !== null &&
    totalInternalProductionCostMicros >
      authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw invalid('Provider-attempt total internal cost exceeds immutable authority.')

  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v1',
    authorizationHash: authorization.authorityHash,
    claimId: input.claim.claimId,
    claimHash: input.claim.claimHash,
    deliveryAttempt: input.claim.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidenceId = `provider_cost_${attemptIdentityHash.slice(0, 48)}`
  const payload = {
    schemaVersion: PRIVATE_PROVIDER_ATTEMPT_COST_EVIDENCE_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: authorization.authorityClass === 'private_injected_nonprovider_test'
      ? 'private_injected_nonprovider_test' as const
      : 'canonical_backend_runtime_unreleased' as const,
    evidenceId,
    identity: {
      workspaceId: authorization.workspaceId,
      projectId: authorization.projectId,
      editSessionId: authorization.editSessionId,
      approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
      packageRecordId: authorization.packageRecordId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      jobId: authorization.queueJobId,
      claimId: input.claim.claimId,
      deliveryAttempt: input.claim.deliveryAttempt,
      dispatchAttemptId: input.dispatchAttemptId,
      providerOperationId: authorization.operationId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
    },
    authorityHash: authorization.authorityHash,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    priorUnknownCostEvidenceHash: input.priorUnknownCostEvidenceHash ?? null,
    canonicalSharedRateCardCompatibilityVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: {
      requestCount: input.providerRequestCount,
      usageEvidenceDigest: input.providerUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(profile.costPolicy.providerRate),
      unit: 'request' as const,
      unitPriceMicros: profile.costPolicy.providerRate.unitPriceMicros,
      actualInternalCostMicros: providerCostMicros,
      costReconciled: input.providerCostReconciled,
      failedAttemptBillingDocumented: false as const,
    },
    infrastructure: {
      measurementClass: input.infrastructure.measurementClass,
      allocatedVcpuCount: 1 as const,
      allocatedMemoryGib: 1 as const,
      wallTimeMicroseconds: input.infrastructure.wallTimeMicroseconds,
      observedCpuMicroseconds: input.infrastructure.observedCpuMicroseconds,
      observedPeakMemoryBytes: input.infrastructure.observedPeakMemoryBytes,
      rawUsageEvidenceDigest: input.infrastructure.rawUsageEvidenceDigest,
      rateCardDigest: sha256AuthorityValue(profile.costPolicy.infrastructureRate),
      unit: 'cpu_second' as const,
      unitPriceMicros: profile.costPolicy.infrastructureRate.unitPriceMicros,
      minimumChargeMicros: profile.costPolicy.infrastructureRate.minimumChargeMicros,
      billableCpuSeconds,
      actualInternalCostMicros: infrastructureCostMicros,
      invoiceReconciled: false as const,
    },
    outcome: {
      state: input.outcomeState,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    reconciliation: {
      state: input.providerCostReconciled
        ? 'complete' as const
        : 'reconciliation_required' as const,
      providerCostMicros,
      infrastructureCostMicros,
      totalInternalProductionCostMicros,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    createdAt: input.createdAt,
  }
  const evidence = privateProviderAttemptCostEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
  assertNoCommercialFields(evidence)
  const relativePath = evidenceRelativePath(evidence)
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const result = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!persisted || !persisted.equals(bytes)) {
    throw invalid('Provider-attempt cost evidence failed create-only readback.')
  }
  return {
    evidence,
    idempotencyStatus: result.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateProviderAttemptCostEvidence(input: {
  localStorageRoot: string
  evidence: Pick<PrivateProviderAttemptCostEvidence, 'identity' | 'evidenceId' | 'evidenceHash'>
}): Promise<PrivateProviderAttemptCostEvidence> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: evidenceRelativePath(input.evidence),
  })
  if (!bytes || bytes.byteLength > 64 * 1024) {
    throw invalid('Provider-attempt cost evidence is missing or oversized.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Provider-attempt cost evidence is not valid JSON.')
  }
  const parsed = privateProviderAttemptCostEvidenceSchema.parse(decoded)
  const { evidenceHash, ...payload } = parsed
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    parsed.evidenceId !== input.evidence.evidenceId ||
    parsed.evidenceHash !== input.evidence.evidenceHash
  ) throw invalid('Provider-attempt cost evidence integrity changed.')
  assertNoCommercialFields(parsed)
  return parsed
}

export async function readPrivateProviderAttemptCostEvidenceForAttempt(input: {
  localStorageRoot: string
  authorization: CanonicalProviderWorkAuthorization
  claimId: string
  claimHash: string
  deliveryAttempt: number
  dispatchAttemptId: string
  evidenceHash: string
}): Promise<PrivateProviderAttemptCostEvidence> {
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:private-provider-attempt-cost-identity:v1',
    authorizationHash: input.authorization.authorityHash,
    claimId: input.claimId,
    claimHash: input.claimHash,
    deliveryAttempt: input.deliveryAttempt,
    dispatchAttemptId: input.dispatchAttemptId,
  })
  const evidence = await readPrivateProviderAttemptCostEvidence({
    localStorageRoot: input.localStorageRoot,
    evidence: {
      identity: {
        workspaceId: input.authorization.workspaceId,
        projectId: input.authorization.projectId,
        editSessionId: input.authorization.editSessionId,
        approvedPlanSnapshotId: input.authorization.approvedPlanSnapshotId,
        packageRecordId: input.authorization.packageRecordId,
        approvedWorkItemId: input.authorization.approvedWorkItemId,
        jobId: input.authorization.queueJobId,
        claimId: input.claimId,
        deliveryAttempt: input.deliveryAttempt,
        dispatchAttemptId: input.dispatchAttemptId,
        providerOperationId: input.authorization.operationId,
        providerRouteId: input.authorization.providerRouteId,
        providerModelId: input.authorization.providerModelId,
      },
      evidenceId: `provider_cost_${attemptIdentityHash.slice(0, 48)}`,
      evidenceHash: input.evidenceHash,
    },
  })
  if (
    evidence.authorityHash !== input.authorization.authorityHash ||
    evidence.attemptIdentityHash !== attemptIdentityHash ||
    evidence.identity.claimId !== input.claimId ||
    evidence.identity.deliveryAttempt !== input.deliveryAttempt ||
    evidence.identity.dispatchAttemptId !== input.dispatchAttemptId ||
    evidence.evidenceHash !== input.evidenceHash
  ) throw invalid('Provider-attempt cost evidence changed exact attempt lineage.')
  return evidence
}

function evidenceRelativePath(input: Pick<
  PrivateProviderAttemptCostEvidence,
  'identity' | 'evidenceId' | 'evidenceHash'
>): string {
  const tenantHash = sha256Text(
    `${input.identity.workspaceId}\u0000${input.identity.projectId}\u0000${input.identity.editSessionId}`,
  ).slice(0, 32)
  return `private-internal/provider-attempt-cost/v1/${tenantHash}/${input.evidenceId}-${input.evidenceHash}.json`
}

function evidenceRelativePathV2(input: {
  identity: Pick<PrivateProviderAttemptCostEvidenceV2['identity'],
    'workspaceId' | 'projectId' | 'editSessionId'>
  evidenceId: string
  evidenceHash: string
}): string {
  const tenantHash = sha256Text(
    `${input.identity.workspaceId}\u0000${input.identity.projectId}\u0000${input.identity.editSessionId}`,
  ).slice(0, 32)
  return `private-internal/provider-attempt-cost/v2/${tenantHash}/${input.evidenceId}-${input.evidenceHash}.json`
}

function evidenceRelativePathV3(input: {
  identity: Pick<PrivateProviderAttemptCostEvidenceV3['identity'],
    'workspaceId' | 'projectId' | 'editSessionId'>
  evidenceId: string
  evidenceHash: string
}): string {
  const tenantHash = sha256Text(
    `${input.identity.workspaceId}\u0000${input.identity.projectId}\u0000${input.identity.editSessionId}`,
  ).slice(0, 32)
  return `private-internal/provider-attempt-cost/v3/${tenantHash}/${input.evidenceId}-${input.evidenceHash}.json`
}

function evidenceRelativePathV4(input: {
  identity: Pick<PrivateProviderAttemptCostEvidenceV4['identity'],
    'workspaceId' | 'projectId' | 'editSessionId'>
  evidenceId: string
  evidenceHash: string
}): string {
  const tenantHash = sha256Text(
    `${input.identity.workspaceId}\u0000${input.identity.projectId}\u0000${input.identity.editSessionId}`,
  ).slice(0, 32)
  return `private-internal/provider-attempt-cost/v4/${tenantHash}/${input.evidenceId}-${input.evidenceHash}.json`
}

function assertNoCommercialFields(value: unknown): void {
  const forbidden = /(^|\.)(price|customerPrice|credits|serviceFee|wallet|billing|charge|invoice)(\.|$)/iu
  walk(value, '', (path) => {
    if (forbidden.test(path) && ![
      'commercialBoundary.customerPriceIncluded',
      'commercialBoundary.customerCreditsIncluded',
      'commercialBoundary.serviceFeeIncluded',
      'commercialBoundary.walletMutationPerformed',
      'commercialBoundary.billingMutationPerformed',
      'infrastructure.invoiceReconciled',
    ].includes(path)) {
      throw invalid(`Provider-attempt cost evidence contains commercial field ${path}.`)
    }
  })
}

function walk(value: unknown, path: string, visit: (path: string) => void): void {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = path ? `${path}.${key}` : key
    visit(next)
    walk(child, next, visit)
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_provider_attempt_internal_cost_integrity',
  })
}
