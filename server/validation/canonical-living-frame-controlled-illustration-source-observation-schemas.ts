import type {
  LivingFrameControlledIllustrationQualification,
} from '../../src/types/living-frame-controlled-illustration-qualification'
import type {
  LivingFrameControlledIllustrationSourceObservationPacket,
  LivingFrameControlledIllustrationSourceObservationValidationResult,
} from '../../src/types/living-frame-controlled-illustration-source-observation'
import {
  LivingFrameControlledIllustrationSourceObservationError,
  livingFrameControlledIllustrationSourceObservationPacketDraftSchema,
  livingFrameControlledIllustrationSourceObservationPacketSchema,
  validateLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'

export const canonicalLivingFrameControlledIllustrationSourceObservationDraftSchema =
  livingFrameControlledIllustrationSourceObservationPacketDraftSchema

export const canonicalLivingFrameControlledIllustrationSourceObservationSchema =
  livingFrameControlledIllustrationSourceObservationPacketSchema

export async function validateCanonicalLivingFrameControlledIllustrationSourceObservation(
  input: unknown,
  qualification: LivingFrameControlledIllustrationQualification,
): Promise<
  LivingFrameControlledIllustrationSourceObservationValidationResult
> {
  return validateLivingFrameControlledIllustrationSourceObservation(
    input,
    qualification,
  )
}

export async function parseCanonicalLivingFrameControlledIllustrationSourceObservation(
  input: unknown,
  qualification: LivingFrameControlledIllustrationQualification,
): Promise<LivingFrameControlledIllustrationSourceObservationPacket> {
  const result =
    await validateCanonicalLivingFrameControlledIllustrationSourceObservation(
      input,
      qualification,
    )
  if (!result.ok) {
    throw new LivingFrameControlledIllustrationSourceObservationError(
      result.issues,
    )
  }
  return result.packet
}
