import { z } from 'zod'

import {
  storytellingMotionStylePlanReviewInputSchema,
  storytellingStoryContinuityGrammarProposalSchema,
} from '../../src/lib/motion-studio/contracts'
import type {
  PrepareCanonicalStorytellingPlanningRequest,
  PrepareStorytellingMotionStylePlanRequest,
  PrepareStorytellingStoryContinuityRequest,
} from '../../src/types/motion-studio'

const safeDirection = z.string().trim().min(1).max(16_000)
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code === 9 || code === 10 || code === 13 || code > 31
  }))

export const prepareStorytellingMotionStylePlanRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  directionHistory: z.array(safeDirection).min(1).max(100).readonly(),
  modelTier: z.enum(['basic', 'pro', 'premium']),
}).strict() satisfies z.ZodType<PrepareStorytellingMotionStylePlanRequest>

export const prepareStorytellingStoryContinuityRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  proposal: storytellingStoryContinuityGrammarProposalSchema,
}).strict() satisfies z.ZodType<PrepareStorytellingStoryContinuityRequest>

export const prepareCanonicalStorytellingPlanningRequestSchema = z.object({
  storytellingStylePlan: storytellingMotionStylePlanReviewInputSchema,
}).strict() satisfies z.ZodType<PrepareCanonicalStorytellingPlanningRequest>
