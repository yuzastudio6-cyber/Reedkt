import { z } from 'zod'

import {
  livingFrameControlledIllustrationQualificationSchema,
  validateLivingFrameControlledIllustrationQualification,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-qualification-contract'
import type {
  LivingFrameControlledIllustrationQualification,
  LivingFrameControlledIllustrationValidationResult,
} from '../../src/types/living-frame-controlled-illustration-qualification'

export const CANONICAL_LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SCHEMA_VERSION =
  'canonical-living-frame-controlled-illustration-qualification-schema-v1' as const

export const canonicalLivingFrameControlledIllustrationQualificationSchema =
  livingFrameControlledIllustrationQualificationSchema

export type CanonicalLivingFrameControlledIllustrationQualification =
  z.infer<
    typeof canonicalLivingFrameControlledIllustrationQualificationSchema
  >

export async function validateCanonicalLivingFrameControlledIllustrationQualification(
  input: unknown,
): Promise<LivingFrameControlledIllustrationValidationResult> {
  return validateLivingFrameControlledIllustrationQualification(input)
}

export async function parseCanonicalLivingFrameControlledIllustrationQualification(
  input: unknown,
): Promise<LivingFrameControlledIllustrationQualification> {
  const validation =
    await validateCanonicalLivingFrameControlledIllustrationQualification(
      input,
    )
  if (!validation.ok) {
    throw new Error(
      'Canonical Living Frame controlled-illustration qualification is invalid.',
    )
  }
  return validation.qualification
}
