import { z } from 'zod'
import { REEDITPRO_EDIT_LEVELS } from '../../src/types'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'
import { TOOL_CREDIT_PREREQUISITE_STATUSES } from '../tool-cost-metering/production-tool-cost'
import {
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_RUNTIME_COMPUTE_LEVELS,
} from '../tool-cost-metering/rate-card'
import {
  TOOL_COST_FAILURE_CATEGORIES,
  TOOL_COST_RISK_LEVELS,
  TOOL_COST_SOURCE_KINDS,
  TOOL_COST_USAGE_CATEGORIES,
} from '../tool-cost-metering/types'
import { validateToolCostNoSecretLikeFields } from '../tool-cost-metering/secret-safety'
import { idSchema } from './common-schemas'

export const nonNegativeIntegerMicrosSchema = z.number().int().nonnegative()
export const nonNegativeIntegerCentsSchema = z.number().int().nonnegative()
export const nonNegativeIntegerCreditsSchema = z.number().int().nonnegative()
export const positiveBillableMillisecondsSchema = z.number().int().positive()
export const nonNegativeDurationSecondsSchema = z.number().nonnegative().finite()
export const positiveDurationSecondsSchema = z.number().positive().finite()

export const toolRuntimeComputeLevelSchema = z.enum(TOOL_RUNTIME_COMPUTE_LEVELS)
export const toolCostUsageCategorySchema = z.enum(TOOL_COST_USAGE_CATEGORIES)
export const toolCostSourceKindSchema = z.enum(TOOL_COST_SOURCE_KINDS)
export const toolCostRiskLevelSchema = z.enum(TOOL_COST_RISK_LEVELS)
export const toolCostFailureCategorySchema = z.enum(TOOL_COST_FAILURE_CATEGORIES)
export const toolCostRateCardVersionSchema = z.literal(TOOL_COST_RATE_CARD_VERSION)
export const toolCostProductEditLevelSchema = z.enum(REEDITPRO_EDIT_LEVELS)
export const productionToolIdSchema = z.enum(PRODUCTION_TOOL_IDS)
export const toolCreditPrerequisiteStatusSchema = z.enum(TOOL_CREDIT_PREREQUISITE_STATUSES)

export const secretSafeToolCostJsonObjectSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const secretSafety = validateToolCostNoSecretLikeFields(value)
  if (!secretSafety.ok) {
    context.addIssue({
      code: 'custom',
      message: `Tool-cost metadata contains secret-like fields: ${secretSafety.secretLikePaths.join(', ')}`,
      path: ['secretLikePaths'],
    })
  }
})

export const toolCostPricingSnapshotSchema = secretSafeToolCostJsonObjectSchema.and(z.object({
  mockOnly: z.literal(true),
  rateCardVersion: toolCostRateCardVersionSchema,
  creditValueCents: z.literal(TOOL_COST_RATE_CARD.creditValueCents),
  serviceFeeIncluded: z.literal(false),
  sourceKind: toolCostSourceKindSchema,
  provider: z.string().nullable(),
  model: z.string().nullable(),
  computeLevel: toolRuntimeComputeLevelSchema.nullable(),
  riskLevel: toolCostRiskLevelSchema.nullable(),
  pricingUnits: secretSafeToolCostJsonObjectSchema,
  notes: z.array(z.string()),
}))

export const productionToolCostProviderTypeSchema = z.enum([
  'api_boundary',
  'browser_preview',
  'deterministic_renderer',
  'gpu_model_runtime',
  'local_runtime',
  'planning_metadata',
  'qa_runtime',
  'readiness_metadata',
])

export const productionRegistryWorkerTypeSchema = z.enum([
  'api_service',
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
  'frontend_preview_only',
  'planning_only',
])

export const productionToolExecutionModeSchema = z.enum([
  'worker_recipe',
  'qa_only',
  'render_pipeline',
  'readiness_check',
  'preview_boundary',
  'planning_metadata',
  'evaluation_only',
])

export const productionToolStatusSchema = z.enum([
  'launch_core',
  'planned',
  'future',
  'evaluation_only',
  'needs_license_review',
  'blocked',
])

export const productionToolMeteringProfileSchema = z.object({
  toolId: productionToolIdSchema,
  toolName: z.string().min(1),
  owner: productionRegistryWorkerTypeSchema,
  usageCategory: toolCostUsageCategorySchema,
  providerBoundary: productionToolExecutionModeSchema,
  providerType: productionToolCostProviderTypeSchema,
  defaultProviderName: z.string().min(1).nullable(),
  defaultModelName: z.string().min(1).nullable(),
  defaultToolComputeLevel: toolRuntimeComputeLevelSchema,
  defaultQualityLevel: toolRuntimeComputeLevelSchema,
  defaultRiskLevel: toolCostRiskLevelSchema,
  requiresApprovedPlan: z.boolean(),
  requiresApprovedCreditEstimate: z.boolean(),
  requiresActiveCreditReservation: z.boolean(),
  requiresIdempotencyKey: z.boolean(),
  serviceFeeIncluded: z.literal(false),
  productionBlockerStatus: productionToolStatusSchema,
  canRunInExternalBeta: z.boolean(),
  estimateOnlyWhenBlocked: z.boolean(),
  runtimeAllowed: z.boolean(),
  runtimeWarnings: z.array(z.string()),
  runtimeBlockingReasons: z.array(z.string()),
})

export const toolCostEstimateRangeSchema = z.object({
  lowInternalCostCents: nonNegativeIntegerCentsSchema,
  expectedInternalCostCents: nonNegativeIntegerCentsSchema,
  highInternalCostCents: nonNegativeIntegerCentsSchema,
  lowCredits: nonNegativeIntegerCreditsSchema,
  expectedCredits: nonNegativeIntegerCreditsSchema,
  highCredits: nonNegativeIntegerCreditsSchema,
  riskLevel: toolCostRiskLevelSchema,
  rateCardVersion: toolCostRateCardVersionSchema,
  pricingSnapshot: toolCostPricingSnapshotSchema,
  canRunWithinApprovedReservation: z.boolean().nullable(),
  serviceFeeIncluded: z.literal(false),
})

export const productionToolCostEstimateSchema = z.object({
  profile: productionToolMeteringProfileSchema,
  productEditLevel: toolCostProductEditLevelSchema,
  toolComputeLevel: toolRuntimeComputeLevelSchema,
  qualityLevel: toolRuntimeComputeLevelSchema,
  sourceKind: toolCostSourceKindSchema,
  expectedInternalCostMicros: nonNegativeIntegerMicrosSchema,
  lowInternalCostMicros: nonNegativeIntegerMicrosSchema,
  highInternalCostMicros: nonNegativeIntegerMicrosSchema,
  range: toolCostEstimateRangeSchema,
  riskLevel: toolCostRiskLevelSchema,
  rateCardVersion: toolCostRateCardVersionSchema,
  pricingSnapshot: toolCostPricingSnapshotSchema,
  actualUsagePricingSnapshot: toolCostPricingSnapshotSchema,
  serviceFeeIncluded: z.literal(false),
  creditPrerequisiteStatus: toolCreditPrerequisiteStatusSchema,
  canRunWithinApprovedReservation: z.boolean().nullable(),
  warnings: z.array(z.string()),
}).superRefine((value, context) => {
  if (value.lowInternalCostMicros > value.expectedInternalCostMicros) {
    context.addIssue({
      code: 'custom',
      message: 'lowInternalCostMicros must be less than or equal to expectedInternalCostMicros.',
      path: ['lowInternalCostMicros'],
    })
  }
  if (value.expectedInternalCostMicros > value.highInternalCostMicros) {
    context.addIssue({
      code: 'custom',
      message: 'expectedInternalCostMicros must be less than or equal to highInternalCostMicros.',
      path: ['expectedInternalCostMicros'],
    })
  }
})

export const externalProviderToolCostInputSchema = z.object({
  requestCount: z.number().int().nonnegative().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  inputVideoSeconds: nonNegativeDurationSecondsSchema.optional(),
  outputVideoSeconds: nonNegativeDurationSecondsSchema.optional(),
  inputAudioSeconds: nonNegativeDurationSecondsSchema.optional(),
  outputAudioSeconds: nonNegativeDurationSecondsSchema.optional(),
  imageCount: z.number().int().nonnegative().optional(),
  provider: z.string().min(1).nullish(),
  model: z.string().min(1).nullish(),
})

export const infrastructureRuntimeToolCostInputSchema = z.object({
  wallTimeMilliseconds: positiveBillableMillisecondsSchema,
  renderSeconds: nonNegativeDurationSecondsSchema.optional(),
  vcpuCount: z.number().nonnegative().finite().optional(),
  memoryGib: z.number().nonnegative().finite().optional(),
  gpuCount: z.number().nonnegative().finite().optional(),
  tempStorageGibHours: z.number().nonnegative().finite().optional(),
  outputStorageGibHours: z.number().nonnegative().finite().optional(),
  networkEgressMib: z.number().nonnegative().finite().optional(),
  computeLevel: toolRuntimeComputeLevelSchema.optional(),
})

export const deterministicRendererToolCostInputSchema = z.object({
  requestCount: z.number().int().nonnegative().optional(),
  outputSeconds: nonNegativeDurationSecondsSchema.optional(),
  megapixelFrames: z.number().nonnegative().finite().optional(),
  computeLevel: toolRuntimeComputeLevelSchema.optional(),
})

export const calculateToolActualCostMicrosInputSchema = z.discriminatedUnion('sourceKind', [
  z.object({
    sourceKind: z.literal('external_provider'),
    provider: externalProviderToolCostInputSchema,
    riskLevel: toolCostRiskLevelSchema.optional(),
  }),
  z.object({
    sourceKind: z.literal('infrastructure_runtime'),
    runtime: infrastructureRuntimeToolCostInputSchema,
    riskLevel: toolCostRiskLevelSchema.optional(),
  }),
  z.object({
    sourceKind: z.literal('deterministic_renderer'),
    deterministicRenderer: deterministicRendererToolCostInputSchema,
    riskLevel: toolCostRiskLevelSchema.optional(),
  }),
  z.object({
    sourceKind: z.literal('human_manual'),
    humanManual: z.object({ hours: z.number().positive().finite().optional() }),
    riskLevel: toolCostRiskLevelSchema.optional(),
  }),
  z.object({
    sourceKind: z.literal('mock_manual_entry'),
    actualInternalCostCents: nonNegativeIntegerCentsSchema,
    riskLevel: toolCostRiskLevelSchema.optional(),
  }),
])

const productionToolCostBaseRouteSchema = z.object({
  toolId: productionToolIdSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema.nullish(),
  approvedPlanSnapshotId: idSchema.nullish(),
  jobId: idSchema.nullish(),
  jobBatchId: idSchema.nullish(),
  generationRequestId: idSchema.nullish(),
  renderJobId: idSchema.nullish(),
  creditEstimateId: idSchema.nullish(),
  creditReservationId: idSchema.nullish(),
  productEditLevel: toolCostProductEditLevelSchema,
  toolComputeLevel: toolRuntimeComputeLevelSchema.nullish(),
  qualityLevel: toolRuntimeComputeLevelSchema.nullish(),
  usage: calculateToolActualCostMicrosInputSchema.optional(),
  approvedReservationRemainingCredits: nonNegativeIntegerCreditsSchema.nullish(),
  idempotencyKey: idSchema.nullish(),
  metadata: secretSafeToolCostJsonObjectSchema.default({}),
})

export const estimateProductionToolCostRouteSchema = productionToolCostBaseRouteSchema.extend({
  estimateOnlyWhenBlocked: z.boolean().optional(),
})

export const emitProductionToolCostEventRouteSchema = productionToolCostBaseRouteSchema.extend({
  runtime: secretSafeToolCostJsonObjectSchema.optional(),
  providerResult: secretSafeToolCostJsonObjectSchema.optional(),
  retryAttempt: z.number().int().nonnegative().optional(),
  retryReason: z.string().min(1).nullish(),
  failureCategory: toolCostFailureCategorySchema.optional(),
  billableToUser: z.boolean().optional(),
  nonBillableReason: z.string().min(1).optional(),
})

export const createToolCostEventSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  creditEstimateId: idSchema.nullish(),
  creditReservationId: idSchema.nullish(),
  label: z.string().min(1),
  usageCategory: toolCostUsageCategorySchema,
  lineItemType: z.string().min(1).optional(),
  computeLevel: toolRuntimeComputeLevelSchema.default('standard'),
  billableToUser: z.boolean().default(true),
  actualInternalCostMicros: nonNegativeIntegerMicrosSchema.optional(),
  actualInternalCostCents: nonNegativeIntegerCentsSchema.optional(),
  pricingSnapshot: toolCostPricingSnapshotSchema.optional(),
  failureCategory: toolCostFailureCategorySchema.default('none'),
  retryAttempt: z.number().int().nonnegative().default(0),
  idempotencyKey: idSchema.nullish(),
  nonBillableReason: z.string().min(1).optional(),
  metadata: secretSafeToolCostJsonObjectSchema.default({}),
}).superRefine((value, context) => {
  if (value.actualInternalCostMicros === undefined && value.actualInternalCostCents === undefined) {
    context.addIssue({
      code: 'custom',
      message: 'actualInternalCostMicros or actualInternalCostCents is required for mock route/storage validation.',
      path: ['actualInternalCostCents'],
    })
  }
})

export const mockToolCostEventSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  projectId: idSchema,
  creditEstimateId: idSchema.nullish(),
  creditReservationId: idSchema.nullish(),
  label: z.string().min(1),
  usageCategory: toolCostUsageCategorySchema,
  lineItemType: z.string().min(1).optional(),
  computeLevel: toolRuntimeComputeLevelSchema,
  billableToUser: z.boolean(),
  serviceFeeIncluded: z.literal(false),
  sourceKind: toolCostSourceKindSchema,
  actualInternalCostMicros: nonNegativeIntegerMicrosSchema,
  actualInternalCostCents: nonNegativeIntegerCentsSchema,
  toolCostCredits: nonNegativeIntegerCreditsSchema,
  credits: nonNegativeIntegerCreditsSchema,
  rateCardVersion: toolCostRateCardVersionSchema,
  pricingSnapshot: toolCostPricingSnapshotSchema,
  failureCategory: toolCostFailureCategorySchema,
  retryAttempt: z.number().int().nonnegative(),
  idempotencyKey: idSchema.nullish(),
  nonBillableReason: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  metadata: secretSafeToolCostJsonObjectSchema.and(z.object({
    serviceFeeIncluded: z.literal(false),
  }).passthrough()),
}).superRefine((value, context) => {
  if (value.toolCostCredits !== value.credits) {
    context.addIssue({
      code: 'custom',
      message: 'toolCostCredits and credits must match for tool-owner cost events.',
      path: ['credits'],
    })
  }
})

export const productionToolCostEventEmissionSchema = z.object({
  profile: productionToolMeteringProfileSchema,
  estimate: productionToolCostEstimateSchema,
  event: mockToolCostEventSchema,
  idempotencyStatus: z.enum(['inserted', 'duplicate_returned']),
  serviceFeeIncluded: z.literal(false),
  warnings: z.array(z.string()),
})
