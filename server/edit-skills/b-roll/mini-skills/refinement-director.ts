import { z } from 'zod'

import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../../core/skill-assignment-schema'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { brollCandidateVerdictSchema } from './candidate-qa-director'

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const priorCandidateSchema = z.object({
  candidateSetId: skillSha256Schema,
  candidateVersionId: skillSha256Schema,
  versionNumber: z.literal(1),
  candidateVersionHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  conceptKey: z.string().trim().min(1).max(180),
  authorizedRange: skillFrameRangeSchema,
  attemptId: skillSha256Schema,
  requestPackageHash: skillSha256Schema,
  nativeAspectRatio: z.enum(['16:9', '9:16']),
  durationSeconds: z.number().int().min(3).max(10),
}).strict()

const priorQaSchema = z.object({
  qaReportHash: skillSha256Schema,
  qaReportRef: blobRefSchema,
  candidateVersionId: skillSha256Schema,
  verdict: brollCandidateVerdictSchema,
  refinementAllowed: z.boolean(),
  refinementReasonCodes: z.array(z.string().trim().min(1).max(180)).min(1).max(20),
}).strict()

const refinementCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_candidate_refinement_authority_v1'),
  candidateSetId: skillSha256Schema,
  priorCandidateVersionId: skillSha256Schema,
  priorCandidateVersionHash: skillSha256Schema,
  priorCandidateVersionRef: blobRefSchema,
  priorQaReportHash: skillSha256Schema,
  priorQaReportRef: blobRefSchema,
  priorAttemptId: skillSha256Schema,
  initialRequestPackageHash: skillSha256Schema,
  previousInteractionIdDigest: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  conceptKey: z.string().trim().min(1).max(180),
  authorizedRange: skillFrameRangeSchema,
  nativeAspectRatio: z.enum(['16:9', '9:16']),
  durationSeconds: z.number().int().min(3).max(10),
  providerRouteId: z.literal('gemini_omni_flash'),
  configuredModelAlias: z.literal('gemini-omni-flash-preview'),
  candidateVersionNumber: z.literal(2),
  refinementOrdinal: z.literal(1),
  maximumRefinements: z.literal(1),
  maximumSubmissionsThisAttempt: z.literal(1),
  automaticRetryAllowed: z.literal(false),
  alternateProviderFallbackAllowed: z.literal(false),
  newProviderAttemptRequired: z.literal(true),
  immutableCandidateVersionRequired: z.literal(true),
  maximumAuthorizedProviderCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  maximumAuthorizedInfrastructureCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  maximumAuthorizedTotalInternalCostMicros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  serviceFeeIncluded: z.literal(false),
  refinementInstruction: z.string().trim().min(1).max(4_000),
  refinementReasonCodes: z.array(z.string().trim().min(1).max(180)).min(1).max(20),
  routeChangeAllowed: z.literal(false),
  conceptChangeAllowed: z.literal(false),
  rangeChangeAllowed: z.literal(false),
  reestimateRequiredForAnyRouteChange: z.literal(true),
  replanRequiredForAnyConceptChange: z.literal(true),
  freshAssignmentRequiredForAnyRangeChange: z.literal(true),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
}).strict()

export const brollCandidateRefinementAuthoritySchema = refinementCoreSchema.extend({
  refinementAuthorityHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { refinementAuthorityHash, ...core } = value
  if (hashSkillValue(core) !== refinementAuthorityHash ||
      value.maximumAuthorizedProviderCostMicros +
        value.maximumAuthorizedInfrastructureCostMicros !==
        value.maximumAuthorizedTotalInternalCostMicros ||
      Date.parse(value.issuedAt) >= Date.parse(value.expiresAt)) {
    context.addIssue({ code: 'custom', message: 'B-roll refinement authority is invalid.' })
  }
})

export type BrollCandidateRefinementAuthority = z.infer<
  typeof brollCandidateRefinementAuthoritySchema
>

export function directBrollCandidateRefinement(input: {
  priorCandidate: z.input<typeof priorCandidateSchema>
  priorCandidateVersionRef: z.input<typeof blobRefSchema>
  priorQa: z.input<typeof priorQaSchema>
  previousInteractionIdDigest: string
  existingCandidateVersionCount: number
  existingRefinementCount: number
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedInfrastructureCostMicros: number
  issuedAt: string
  expiresAt: string
}): BrollCandidateRefinementAuthority {
  const prior = priorCandidateSchema.parse(input.priorCandidate)
  const priorRef = blobRefSchema.parse(input.priorCandidateVersionRef)
  const qa = priorQaSchema.parse(input.priorQa)
  if (
    input.existingCandidateVersionCount !== 1 ||
    input.existingRefinementCount !== 0 ||
    qa.verdict !== 'needs_refinement' || !qa.refinementAllowed ||
    qa.candidateVersionId !== prior.candidateVersionId
  ) throw new Error('B-roll refinement ceiling or prior candidate/QA lineage is invalid.')
  const reasonText = qa.refinementReasonCodes
    .map((reason) => reason.replaceAll(':', ' '))
    .join('; ')
  const core = refinementCoreSchema.parse({
    schemaVersion: 'b_roll_candidate_refinement_authority_v1',
    candidateSetId: prior.candidateSetId,
    priorCandidateVersionId: prior.candidateVersionId,
    priorCandidateVersionHash: prior.candidateVersionHash,
    priorCandidateVersionRef: priorRef,
    priorQaReportHash: qa.qaReportHash,
    priorQaReportRef: qa.qaReportRef,
    priorAttemptId: prior.attemptId,
    initialRequestPackageHash: prior.requestPackageHash,
    previousInteractionIdDigest: input.previousInteractionIdDigest,
    assignmentHash: prior.assignmentHash,
    planHash: prior.planHash,
    conceptKey: prior.conceptKey,
    authorizedRange: prior.authorizedRange,
    nativeAspectRatio: prior.nativeAspectRatio,
    durationSeconds: prior.durationSeconds,
    providerRouteId: 'gemini_omni_flash',
    configuredModelAlias: 'gemini-omni-flash-preview',
    candidateVersionNumber: 2,
    refinementOrdinal: 1,
    maximumRefinements: 1,
    maximumSubmissionsThisAttempt: 1,
    automaticRetryAllowed: false,
    alternateProviderFallbackAllowed: false,
    newProviderAttemptRequired: true,
    immutableCandidateVersionRequired: true,
    maximumAuthorizedProviderCostMicros:
      input.maximumAuthorizedProviderCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      input.maximumAuthorizedInfrastructureCostMicros,
    maximumAuthorizedTotalInternalCostMicros:
      input.maximumAuthorizedProviderCostMicros +
        input.maximumAuthorizedInfrastructureCostMicros,
    serviceFeeIncluded: false,
    refinementInstruction: [
      'Refine the prior B-roll candidate in one continuous shot.',
      `Correct only these QA findings: ${reasonText}.`,
      `Preserve the exact approved subject and concept in exactly ${prior.durationSeconds} seconds at ${prior.nativeAspectRatio}.`,
      'Preserve the exact approved timeline range; do not change the editorial assignment.',
      'Do not introduce scene cuts, montage changes, proof claims, private data, dialogue, music, or sound effects.',
    ].join(' '),
    refinementReasonCodes: qa.refinementReasonCodes,
    routeChangeAllowed: false,
    conceptChangeAllowed: false,
    rangeChangeAllowed: false,
    reestimateRequiredForAnyRouteChange: true,
    replanRequiredForAnyConceptChange: true,
    freshAssignmentRequiredForAnyRangeChange: true,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  })
  return brollCandidateRefinementAuthoritySchema.parse({
    ...core,
    refinementAuthorityHash: hashSkillValue(core),
  })
}
