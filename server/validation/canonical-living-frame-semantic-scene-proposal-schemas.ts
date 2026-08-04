import { z } from 'zod'

import {
  livingFrameSemanticSceneProposalBindingDraftSchema,
  livingFrameSemanticSceneProposalBindingSchema,
  livingFrameSemanticSceneProposalResultSchema,
  validateLivingFrameSemanticSceneProposalBinding,
} from '../../src/lib/living-frame'
import type {
  LivingFrameSemanticSceneProposalValidationResult,
} from '../../src/lib/living-frame'

export const CANONICAL_LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION =
  'canonical-living-frame-semantic-scene-proposal-schema-v1' as const

export const canonicalLivingFrameSemanticSceneProposalResultSchema =
  livingFrameSemanticSceneProposalResultSchema

export const canonicalLivingFrameSemanticSceneProposalBindingDraftSchema =
  livingFrameSemanticSceneProposalBindingDraftSchema

export const canonicalLivingFrameSemanticSceneProposalBindingSchema =
  livingFrameSemanticSceneProposalBindingSchema

export type CanonicalLivingFrameSemanticSceneProposalResult = z.infer<
  typeof canonicalLivingFrameSemanticSceneProposalResultSchema
>

export type CanonicalLivingFrameSemanticSceneProposalBindingDraft = z.infer<
  typeof canonicalLivingFrameSemanticSceneProposalBindingDraftSchema
>

export type CanonicalLivingFrameSemanticSceneProposalBinding = z.infer<
  typeof canonicalLivingFrameSemanticSceneProposalBindingSchema
>

export async function validateCanonicalLivingFrameSemanticSceneProposalBinding(
  input: unknown,
): Promise<LivingFrameSemanticSceneProposalValidationResult> {
  return validateLivingFrameSemanticSceneProposalBinding(input)
}
