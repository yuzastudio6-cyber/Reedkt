import { z } from 'zod'

import { ACTIVE_QUALIFICATION_RANK } from '../core/edit-skill-ids'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillSemverSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import type { SkillAssignment } from '../core/skill-assignment-types'
import type { EditSkillPublicPlan } from '../core/edit-skill-plugin'
import type { EditSkillDependencyRequest } from '../core/edit-skill-dependency-request'

export const BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE =
  'visual_intelligence_candidate_qa_v1' as const

const findingDispositionSchema = z.enum([
  'pass',
  'warning',
  'needs_review',
  'blocking',
])

const semanticFindingSchema = z.object({
  disposition: findingDispositionSchema,
  summary: z.string().trim().min(1).max(2_000),
  confidenceMillionths: z.number().int().min(0).max(1_000_000),
  evidenceArtifactHashes: z.array(skillSha256Schema).min(1).max(100),
}).strict()

const visualDefectFindingSchema = z.object({
  findingKey: skillIdentitySchema,
  disposition: findingDispositionSchema,
  summary: z.string().trim().min(1).max(2_000),
  evidenceArtifactHashes: z.array(skillSha256Schema).min(1).max(100),
}).strict()

const evidenceFrameTimeReferenceSchema = z.object({
  masterFrameIndex: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  timeMicroseconds: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  evidenceArtifactHash: skillSha256Schema,
}).strict()

const producerManifestReferenceSchema = z.object({
  schemaVersion: z.literal('external-skill-manifest-reference-v1'),
  skillKey: z.literal('visual_intelligence'),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  manifestHash: skillSha256Schema,
}).strict()

const candidateQaCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE),
  candidateArtifact: editSkillArtifactReferenceSchema,
  candidateArtifactId: skillIdentitySchema,
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  authorizedRangeHash: skillSha256Schema,
  semanticAlignment: semanticFindingSchema,
  subjectObjectConsistency: semanticFindingSchema,
  motionPlausibility: semanticFindingSchema,
  cameraIntentAlignment: semanticFindingSchema,
  cropSafety: semanticFindingSchema,
  contentSafety: semanticFindingSchema,
  proofMisrepresentationCheck: semanticFindingSchema,
  visualDefectFindings: z.array(visualDefectFindingSchema).max(500),
  confidenceMillionths: z.number().int().min(0).max(1_000_000),
  uncertainty: z.string().trim().min(1).max(2_000).nullable(),
  evidenceFrameTimeReferences: z.array(evidenceFrameTimeReferenceSchema).min(1).max(10_000),
  producerIdentity: z.object({
    producerKind: z.literal('model_neutral_edit_skill_plugin'),
    producerSkillKey: z.literal('visual_intelligence'),
    providerOrModelIdentityExposed: z.literal(false),
  }).strict(),
  producerSkillManifestRef: producerManifestReferenceSchema,
  productionQualificationStatus: z.enum([
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  disposition: z.enum([
    'accepted',
    'accepted_with_warnings',
    'needs_review',
    'blocked',
  ]),
  injectedTestOnly: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.authorizedRangeHash !== hashSkillValue(value.authorizedRange) ||
    value.candidateArtifact.artifactType !== 'provider_b_roll_candidate_video_mp4' ||
    value.candidateArtifact.ownerUserId !== value.ownerUserId ||
    value.candidateArtifact.workspaceId !== value.workspaceId ||
    value.candidateArtifact.projectId !== value.projectId
  ) context.addIssue({ code: 'custom', message: 'Visual Intelligence candidate QA lost range or tenant lineage.' })
  const findingDispositions = [
    value.semanticAlignment.disposition,
    value.subjectObjectConsistency.disposition,
    value.motionPlausibility.disposition,
    value.cameraIntentAlignment.disposition,
    value.cropSafety.disposition,
    value.contentSafety.disposition,
    value.proofMisrepresentationCheck.disposition,
    ...value.visualDefectFindings.map((finding) => finding.disposition),
  ]
  const expectedDisposition = findingDispositions.includes('blocking')
    ? 'blocked'
    : findingDispositions.includes('needs_review')
      ? 'needs_review'
      : findingDispositions.includes('warning')
        ? 'accepted_with_warnings'
        : 'accepted'
  if (value.disposition !== expectedDisposition) {
    context.addIssue({ code: 'custom', message: 'Visual Intelligence candidate QA disposition is not derived from findings.' })
  }
  if (
    ['accepted', 'accepted_with_warnings'].includes(value.disposition) &&
    (value.contentSafety.disposition !== 'pass' ||
      value.proofMisrepresentationCheck.disposition !== 'pass')
  ) context.addIssue({ code: 'custom', message: 'Semantic acceptance requires exact content and proof safety passes.' })
  if (value.evidenceFrameTimeReferences.some((reference) =>
    reference.masterFrameIndex < value.authorizedRange.startFrameInclusive ||
    reference.masterFrameIndex >= value.authorizedRange.endFrameExclusive)) {
    context.addIssue({ code: 'custom', message: 'Visual Intelligence evidence frame is outside the authorized range.' })
  }
})

export const brollVisualIntelligenceCandidateQaSchema = candidateQaCoreSchema.extend({
  qaArtifactHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { qaArtifactHash, ...core } = value
  if (hashSkillValue(core) !== qaArtifactHash) {
    context.addIssue({ code: 'custom', message: 'Visual Intelligence candidate QA hash is stale or forged.' })
  }
})

export type BrollVisualIntelligenceCandidateQa = z.infer<
  typeof brollVisualIntelligenceCandidateQaSchema
>

export function createBrollVisualIntelligenceCandidateQa(
  input: z.input<typeof candidateQaCoreSchema>,
): BrollVisualIntelligenceCandidateQa {
  const core = candidateQaCoreSchema.parse(input)
  return brollVisualIntelligenceCandidateQaSchema.parse({
    ...core,
    qaArtifactHash: hashSkillValue(core),
  })
}

export function assertBrollVisualIntelligenceCandidateQa(input: {
  artifact: unknown
  assignment: Pick<
    SkillAssignment,
    'assignmentId' | 'assignmentHash' | 'ownerUserId' | 'workspaceId' | 'projectId' | 'authorizedRange'
  >
  plan: Pick<EditSkillPublicPlan, 'envelope'>
  request: Pick<
    EditSkillDependencyRequest,
    'dependencySkillKey' | 'requiredArtifactType' | 'requiredForPhase' | 'minimumQualificationStatus'
  >
  candidateArtifact: z.input<typeof editSkillArtifactReferenceSchema>
  requireProduction: boolean
}): BrollVisualIntelligenceCandidateQa {
  const artifact = brollVisualIntelligenceCandidateQaSchema.parse(input.artifact)
  const candidateArtifact = editSkillArtifactReferenceSchema.parse(input.candidateArtifact)
  const producerRank = ACTIVE_QUALIFICATION_RANK[artifact.productionQualificationStatus]
  const requiredRank = ACTIVE_QUALIFICATION_RANK[input.request.minimumQualificationStatus]
  if (
    input.request.dependencySkillKey !== 'visual_intelligence' ||
    input.request.requiredArtifactType !== BROLL_VISUAL_INTELLIGENCE_CANDIDATE_QA_ARTIFACT_TYPE ||
    input.request.requiredForPhase !== 'skill_output_qa' ||
    artifact.assignmentId !== input.assignment.assignmentId ||
    artifact.assignmentHash !== input.assignment.assignmentHash ||
    artifact.planId !== input.plan.envelope.planId ||
    artifact.planHash !== input.plan.envelope.planHash ||
    artifact.ownerUserId !== input.assignment.ownerUserId ||
    artifact.workspaceId !== input.assignment.workspaceId ||
    artifact.projectId !== input.assignment.projectId ||
    hashSkillValue(artifact.authorizedRange) !== hashSkillValue(input.assignment.authorizedRange) ||
    hashSkillValue(artifact.candidateArtifact) !== hashSkillValue(candidateArtifact) ||
    !['accepted', 'accepted_with_warnings'].includes(artifact.disposition) ||
    producerRank === undefined || requiredRank === undefined || producerRank < requiredRank ||
    (input.requireProduction && artifact.productionQualificationStatus !== 'production_qualified')
  ) throw new Error('B-roll rejected stale, cross-workspace, under-qualified, or candidate-mismatched Visual Intelligence QA.')
  return artifact
}

export function brollSemanticChecksFromVisualIntelligence(
  artifact: BrollVisualIntelligenceCandidateQa,
) {
  const passed = (disposition: z.infer<typeof findingDispositionSchema>): boolean =>
    disposition === 'pass' || disposition === 'warning'
  return {
    semanticAlignment: passed(artifact.semanticAlignment.disposition),
    generatedVisualIntegrity: artifact.visualDefectFindings.every((finding) =>
      passed(finding.disposition)),
    subjectObjectConsistency: passed(artifact.subjectObjectConsistency.disposition),
    plausibleMotion: passed(artifact.motionPlausibility.disposition),
    cameraIntent: passed(artifact.cameraIntentAlignment.disposition),
    cropSafety: passed(artifact.cropSafety.disposition),
    noProofMisrepresentation: artifact.proofMisrepresentationCheck.disposition === 'pass',
    contentSafety: artifact.contentSafety.disposition === 'pass',
  }
}
