import { z } from 'zod'

import {
  LIVING_FRAME_PLANNING_EVIDENCE_LOCATOR_VERSION,
} from '../../src/types/living-frame-planning-evidence'
import {
  livingFramePlanningEvidenceBindingSchema,
} from '../../src/lib/living-frame/living-frame-planning-evidence-contract'

const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export const canonicalLivingFramePlanningEvidenceLocatorSchema = z.object({
  schemaVersion: z.literal(LIVING_FRAME_PLANNING_EVIDENCE_LOCATOR_VERSION),
  serverOwnedLocatorId: safeIdentitySchema.nullable(),
}).strict()

export const canonicalLivingFramePlanningEvidenceScopeSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
}).strict()

export const canonicalLivingFramePlanningEvidenceBindingSchema =
  livingFramePlanningEvidenceBindingSchema

export type CanonicalLivingFramePlanningEvidenceLocator = z.infer<
  typeof canonicalLivingFramePlanningEvidenceLocatorSchema
>
export type CanonicalLivingFramePlanningEvidenceScope = z.infer<
  typeof canonicalLivingFramePlanningEvidenceScopeSchema
>
export type CanonicalLivingFramePlanningEvidenceBinding = z.infer<
  typeof canonicalLivingFramePlanningEvidenceBindingSchema
>
