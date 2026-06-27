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
