import { z } from 'zod'

import {
  calculateLivingFrameSemanticSceneProposalSchemaDigest,
  createLivingFrameSemanticSceneProposalJsonSchema,
  livingFrameSemanticReasoningRequestSchema,
  livingFrameSemanticSceneProposalResultSchema,
  validateLivingFrameSemanticReasoningRequest,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import type {
  LivingFrameSemanticReasoningRequest,
  LivingFrameSemanticRequestValidationResult,
} from '../../src/types/living-frame-semantic-reasoning-request'

export const CANONICAL_LIVING_FRAME_SEMANTIC_REASONING_REQUEST_SCHEMA_VERSION =
  'canonical-living-frame-semantic-reasoning-request-schema-v1' as const
export const CANONICAL_LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_SCHEMA_VERSION =
  'canonical-living-frame-semantic-scene-proposal-schema-v1' as const

export const canonicalLivingFrameSemanticReasoningRequestSchema =
  livingFrameSemanticReasoningRequestSchema

export const canonicalLivingFrameSemanticSceneProposalResultSchema =
  livingFrameSemanticSceneProposalResultSchema

export type CanonicalLivingFrameSemanticReasoningRequest = z.infer<
  typeof canonicalLivingFrameSemanticReasoningRequestSchema
>

export type CanonicalLivingFrameSemanticSceneProposalResult = z.infer<
  typeof canonicalLivingFrameSemanticSceneProposalResultSchema
>

export async function validateCanonicalLivingFrameSemanticReasoningRequest(
  input: unknown,
): Promise<LivingFrameSemanticRequestValidationResult> {
  return validateLivingFrameSemanticReasoningRequest(input)
}

export async function parseCanonicalLivingFrameSemanticReasoningRequest(
  input: unknown,
): Promise<LivingFrameSemanticReasoningRequest> {
  const validation =
    await validateCanonicalLivingFrameSemanticReasoningRequest(input)
  if (!validation.ok) {
    throw new Error(
      'Canonical Living Frame semantic reasoning request is invalid.',
    )
  }
  return validation.request
}

export async function canonicalLivingFrameSemanticSceneProposalJsonSchema():
Promise<Record<string, unknown>> {
  const schema = createLivingFrameSemanticSceneProposalJsonSchema()
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error(
      'Canonical Living Frame semantic proposal JSON Schema is invalid.',
    )
  }
  return schema as Record<string, unknown>
}

export async function canonicalLivingFrameSemanticSceneProposalSchemaDigest():
Promise<string> {
  return calculateLivingFrameSemanticSceneProposalSchemaDigest()
}
