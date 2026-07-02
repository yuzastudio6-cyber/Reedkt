import { z } from 'zod'

import {
  EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS,
} from '../../src/types/credits'
import {
  REEDITPRO_EDIT_LEVELS,
} from '../../src/types/credit-policy'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'
import { idSchema } from './common-schemas'
import { secretSafeJsonObjectSchema } from './credit-data-schemas'

// RP-ESTIMATE-01 keeps estimate previews mock-safe and rejects legacy/tool-level mixups.
const nonNegativeFiniteNumberSchema = z.number().nonnegative().finite()
const nonNegativeIntegerCreditSchema = z.number().int().nonnegative()
const positiveDurationSecondsSchema = z.number().positive().finite()

export const editCreditEstimateProductEditLevelSchema = z.enum(REEDITPRO_EDIT_LEVELS)
export const editCreditEstimateToolComputeLevelSchema = z.enum(EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS)
export const editCreditEstimateProductionToolIdSchema = z.enum(PRODUCTION_TOOL_IDS)

export const editCreditEstimateToolUsageInputSchema = z.object({
  toolId: editCreditEstimateProductionToolIdSchema,
  toolComputeLevel: editCreditEstimateToolComputeLevelSchema.nullish(),
  qualityLevel: editCreditEstimateToolComputeLevelSchema.nullish(),
  estimatedRuntimeSeconds: nonNegativeFiniteNumberSchema.optional(),
  renderDurationSeconds: nonNegativeFiniteNumberSchema.optional(),
  outputDurationSeconds: nonNegativeFiniteNumberSchema.optional(),
  megapixelFrames: nonNegativeFiniteNumberSchema.optional(),
  requestCount: z.number().int().nonnegative().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  inputVideoSeconds: nonNegativeFiniteNumberSchema.optional(),
  outputVideoSeconds: nonNegativeFiniteNumberSchema.optional(),
  inputAudioSeconds: nonNegativeFiniteNumberSchema.optional(),
  outputAudioSeconds: nonNegativeFiniteNumberSchema.optional(),
  imageCount: z.number().int().nonnegative().optional(),
  provider: z.string().min(1).nullable().optional(),
  model: z.string().min(1).nullable().optional(),
  vcpuCount: nonNegativeFiniteNumberSchema.optional(),
  memoryGib: nonNegativeFiniteNumberSchema.optional(),
  gpuCount: nonNegativeFiniteNumberSchema.optional(),
  tempStorageGibHours: nonNegativeFiniteNumberSchema.optional(),
  outputStorageGibHours: nonNegativeFiniteNumberSchema.optional(),
  networkEgressMib: nonNegativeFiniteNumberSchema.optional(),
  actualInternalCostCents: z.number().int().nonnegative().optional(),
  metadata: secretSafeJsonObjectSchema.default({}),
})

export const previewEditCreditEstimateSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  editPlanId: idSchema,
  productEditLevel: editCreditEstimateProductEditLevelSchema,
  finalVideoDurationSeconds: positiveDurationSecondsSchema,
  plannedToolIds: z.array(editCreditEstimateProductionToolIdSchema).min(1),
  toolUsageInputs: z.record(z.string(), editCreditEstimateToolUsageInputSchema).default({}),
  availableCreditsSnapshot: nonNegativeIntegerCreditSchema.optional(),
  reservedCreditsSnapshot: nonNegativeIntegerCreditSchema.optional(),
  purchasedCreditsSnapshot: nonNegativeIntegerCreditSchema.optional(),
  weeklyBonusCreditsSnapshot: nonNegativeIntegerCreditSchema.optional(),
  idempotencyKey: idSchema,
  metadata: secretSafeJsonObjectSchema.default({}),
}).superRefine((value, context) => {
  const seenToolIds = new Set<string>()
  value.plannedToolIds.forEach((toolId, index) => {
    if (seenToolIds.has(toolId)) {
      context.addIssue({
        code: 'custom',
        message: `plannedToolIds must not contain duplicates: ${toolId}`,
        path: ['plannedToolIds', index],
      })
    }
    seenToolIds.add(toolId)
  })
  const plannedTools = new Set<string>(value.plannedToolIds)
  for (const [toolId, usage] of Object.entries(value.toolUsageInputs)) {
    if (!plannedTools.has(toolId)) {
      context.addIssue({
        code: 'custom',
        message: `toolUsageInputs contains a tool not present in plannedToolIds: ${toolId}`,
        path: ['toolUsageInputs', toolId],
      })
    }
    if (usage.toolId !== toolId) {
      context.addIssue({
        code: 'custom',
        message: `toolUsageInputs.${toolId}.toolId must match its record key.`,
        path: ['toolUsageInputs', toolId, 'toolId'],
      })
    }
  }
})
