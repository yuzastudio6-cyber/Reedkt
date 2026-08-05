import { z } from 'zod'

import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { brollAudioDispositionSchema } from '../b-roll-schemas'

export const brollCandidateVerdictSchema = z.enum([
  'accepted',
  'accepted_after_normalization',
  'needs_refinement',
  'fallback_to_existing_source',
  'use_no_broll',
  'needs_user_confirmation',
  'blocked',
  'failed',
])

export type BrollCandidateVerdict = z.infer<typeof brollCandidateVerdictSchema>

const semanticChecksSchema = z.object({
  semanticAlignment: z.boolean(),
  generatedVisualIntegrity: z.boolean(),
  subjectObjectConsistency: z.boolean(),
  plausibleMotion: z.boolean(),
  cameraIntent: z.boolean(),
  cropSafety: z.boolean(),
  noProofMisrepresentation: z.boolean(),
  contentSafety: z.boolean(),
}).strict()

const observationCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_semantic_visual_observation_v1'),
  candidateSha256: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  conceptKey: z.string().trim().min(1).max(180),
  authorizedRangeHash: skillSha256Schema,
  observationSource: z.literal('internal_injected_visual_observation_v1'),
  testOnly: z.literal(true),
  evidenceArtifactHash: skillSha256Schema,
  confidenceMillionths: z.number().int().min(0).max(1_000_000),
  checks: semanticChecksSchema,
  needsUserConfirmation: z.boolean(),
  generatedMediaTreatedAsVerifiedProof: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  productionQualified: z.literal(false),
}).strict()

export const brollSemanticVisualObservationSchema = observationCoreSchema.extend({
  observationHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { observationHash, ...core } = value
  if (hashSkillValue(core) !== observationHash) {
    context.addIssue({ code: 'custom', message: 'B-roll semantic visual observation hash is invalid.' })
  }
})

export type BrollSemanticVisualObservation = z.infer<
  typeof brollSemanticVisualObservationSchema
>

export function createBrollSemanticVisualObservation(
  input: z.input<typeof observationCoreSchema>,
): BrollSemanticVisualObservation {
  const core = observationCoreSchema.parse(input)
  return brollSemanticVisualObservationSchema.parse({
    ...core,
    observationHash: hashSkillValue(core),
  })
}

const technicalChecksSchema = z.object({
  validMp4Container: z.boolean(),
  decodableStreams: z.boolean(),
  durationMatches: z.boolean(),
  frameRateMatches: z.boolean(),
  resolutionMatches: z.boolean(),
  notTruncated: z.boolean(),
  notFrozenOrBlack: z.boolean(),
  privateArtifactIntegrity: z.boolean(),
  normalizationApplied: z.boolean(),
  technicalInfrastructureAvailable: z.boolean(),
}).strict()

const decisionInputSchema = z.object({
  versionNumber: z.union([z.literal(1), z.literal(2)]),
  maximumRefinements: z.literal(1),
  refinementCount: z.union([z.literal(0), z.literal(1)]),
  technical: technicalChecksSchema,
  semantic: brollSemanticVisualObservationSchema,
  audioDisposition: brollAudioDispositionSchema,
  generatedAudioFinalMixAllowed: z.literal(false),
  fallbackExistingSourceAvailable: z.boolean(),
}).strict()

export const brollCandidateQaDecisionSchema = z.object({
  verdict: brollCandidateVerdictSchema,
  refinementAllowed: z.boolean(),
  refinementReasonCodes: z.array(z.string().trim().min(1).max(180)).max(20),
  fallbackReason: z.string().trim().min(1).max(500).nullable(),
  automaticSelectionAllowed: z.literal(false),
  generatedAudioFinalMixAllowed: z.literal(false),
  soundHandoffRequired: z.boolean(),
}).strict()

export type BrollCandidateQaDecision = z.infer<
  typeof brollCandidateQaDecisionSchema
>

export function directBrollCandidateQa(
  input: z.input<typeof decisionInputSchema>,
): BrollCandidateQaDecision {
  const value = decisionInputSchema.parse(input)
  const soundHandoffRequired = [
    'retain_as_ambient_candidate',
    'extract_for_sound_skill_review',
  ].includes(value.audioDisposition)
  if (!value.technical.technicalInfrastructureAvailable) {
    return decision({ verdict: 'blocked', soundHandoffRequired })
  }
  if (!value.technical.validMp4Container ||
      !value.technical.decodableStreams ||
      !value.technical.privateArtifactIntegrity) {
    return decision({
      verdict: 'failed',
      fallbackReason: 'Candidate media or private checksum integrity failed.',
      soundHandoffRequired,
    })
  }
  if (value.semantic.needsUserConfirmation) {
    return decision({ verdict: 'needs_user_confirmation', soundHandoffRequired })
  }
  if (!value.semantic.checks.noProofMisrepresentation ||
      !value.semantic.checks.contentSafety) {
    return fallbackDecision(
      value.fallbackExistingSourceAvailable,
      'Candidate failed proof-safety or content-safety QA.',
      soundHandoffRequired,
    )
  }
  const reasons: string[] = []
  const technicalEntries = Object.entries(value.technical).filter(([key]) =>
    !['normalizationApplied', 'technicalInfrastructureAvailable'].includes(key))
  for (const [key, passed] of technicalEntries) {
    if (!passed) reasons.push(`technical:${key}`)
  }
  for (const [key, passed] of Object.entries(value.semantic.checks)) {
    if (!passed) reasons.push(`semantic:${key}`)
  }
  if (reasons.length > 0) {
    const refinementAllowed = value.versionNumber === 1 &&
      value.refinementCount === 0 && value.maximumRefinements === 1
    if (refinementAllowed) {
      return decision({
        verdict: 'needs_refinement',
        refinementAllowed: true,
        refinementReasonCodes: reasons,
        soundHandoffRequired,
      })
    }
    return fallbackDecision(
      value.fallbackExistingSourceAvailable,
      'Candidate failed QA after the approved refinement ceiling.',
      soundHandoffRequired,
    )
  }
  return decision({
    verdict: value.technical.normalizationApplied
      ? 'accepted_after_normalization'
      : 'accepted',
    soundHandoffRequired,
  })
}

function fallbackDecision(
  existingSourceAvailable: boolean,
  fallbackReason: string,
  soundHandoffRequired: boolean,
): BrollCandidateQaDecision {
  return decision({
    verdict: existingSourceAvailable
      ? 'fallback_to_existing_source'
      : 'use_no_broll',
    fallbackReason,
    soundHandoffRequired,
  })
}

function decision(input: {
  verdict: BrollCandidateVerdict
  refinementAllowed?: boolean
  refinementReasonCodes?: string[]
  fallbackReason?: string | null
  soundHandoffRequired: boolean
}): BrollCandidateQaDecision {
  return brollCandidateQaDecisionSchema.parse({
    verdict: input.verdict,
    refinementAllowed: input.refinementAllowed ?? false,
    refinementReasonCodes: input.refinementReasonCodes ?? [],
    fallbackReason: input.fallbackReason ?? null,
    automaticSelectionAllowed: false,
    generatedAudioFinalMixAllowed: false,
    soundHandoffRequired: input.soundHandoffRequired,
  })
}
