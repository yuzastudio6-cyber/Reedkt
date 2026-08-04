import { z } from 'zod'

import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { isFrameRangeContained } from '../core/skill-range-authority'
import {
  createSkillQaFinding,
  skillQaFindingSchema,
  type SkillQaFinding,
  type SkillQaRegistry,
} from '../core/skill-qa-registry'
import {
  brollAudioDispositionSchema,
  brollCoordinationPlanSchema,
  brollDecisionSchema,
  brollDisplayTreatmentSchema,
  brollEditorialRoleSchema,
  brollPlanningContextCoreSchema,
  brollPlanningContextSchema,
  brollShotSpecificationSchema,
  brollSkillAssignmentSchema,
  brollAssignmentCoreSchema,
} from './b-roll-schemas'
import type {
  BrollCoordinationPlan,
  BrollPlanningContext,
  BrollShotSpecification,
  BrollSkillAssignment,
} from './b-roll-contracts'

export const BROLL_PLANNING_QA_KEYS = [
  'b_roll.planning.range_authority',
  'b_roll.planning.editorial_purpose',
  'b_roll.planning.professional_restraint',
  'b_roll.planning.source_safety',
  'b_roll.planning.provenance_rights',
  'b_roll.planning.privacy',
  'b_roll.planning.proof_safety',
  'b_roll.planning.visual_density_budget',
  'b_roll.planning.repetition',
  'b_roll.planning.primary_visual_ownership',
  'b_roll.planning.caption_space',
  'b_roll.planning.dependency_completeness',
  'b_roll.planning.approval_readiness',
  'b_roll.planning.credit_ceiling',
  'b_roll.planning.provider_eligibility',
  'b_roll.planning.lower_cost_route_evaluation',
  'b_roll.planning.region_eligibility',
  'b_roll.planning.generated_media_classification',
] as const

export type BrollPlanningQaKey = (typeof BROLL_PLANNING_QA_KEYS)[number]

const refinementAuthoritySchema = z.object({
  previousCandidateVersionId: skillSha256Schema,
  previousCandidateVersionHash: skillSha256Schema,
  priorQaReportHash: skillSha256Schema,
  requestedCandidateVersion: z.literal(2),
  refinementCount: z.literal(1),
  maximumRefinements: z.literal(1),
}).strict()

const brollPlanningQaPlanEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_planning_qa_plan_evidence_v1'),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  decision: brollDecisionSchema,
  editorialRole: brollEditorialRoleSchema,
  reason: z.string().trim().min(1).max(4_000),
  sourceCandidateId: z.string().trim().min(1).max(180).optional(),
  sourceArtifactHash: skillSha256Schema.optional(),
  sourceScore: z.number().min(0).max(100).optional(),
  providerSourceArtifactHashes: z.array(skillSha256Schema).min(1).max(6).optional(),
  sourceTrim: skillFrameRangeSchema.optional(),
  shotSpecification: brollShotSpecificationSchema.optional(),
  displayTreatment: brollDisplayTreatmentSchema,
  cropSafeProviderAspectRatio: z.enum(['16:9', '9:16']).optional(),
  speakerVisibilityIntent: z.enum(['preserve', 'temporarily_hidden', 'not_applicable']),
  captionSafeBehavior: z.string().trim().min(1).max(2_000),
  audioDisposition: brollAudioDispositionSchema,
  entryIntent: z.string().trim().min(1).max(2_000),
  exitIntent: z.string().trim().min(1).max(2_000),
  coordination: brollCoordinationPlanSchema,
  providerRequestPlanned: z.boolean(),
  providerRequestPackageHash: skillSha256Schema.optional(),
  providerCreditEstimate: z.number().int().nonnegative(),
  dependencySkillKey: z.string().trim().min(1).max(180).optional(),
  requiredDependencyArtifactType: z.string().trim().min(1).max(180).optional(),
  requiredForPhase: z.string().trim().min(1).max(180).optional(),
  refinementAuthority: refinementAuthoritySchema.optional(),
  timeEstimateSeconds: z.number().int().nonnegative(),
  creditEstimate: z.number().int().nonnegative(),
  lowerCostDecision: z.enum(['use_existing_project_clip', 'use_no_broll']),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const brollPlanningQaPlanEvidenceSchema =
  brollPlanningQaPlanEvidenceCoreSchema.extend({
    planEvidenceHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    const { planEvidenceHash, ...core } = value
    if (hashSkillValue(core) !== planEvidenceHash) {
      context.addIssue({ code: 'custom', message: 'B-roll planning QA plan evidence is stale or forged.' })
    }
  })

export type BrollPlanningQaPlanEvidence = z.infer<
  typeof brollPlanningQaPlanEvidenceSchema
>

export interface BrollPlanningQaPlanEvidenceInput extends Omit<
  BrollPlanningQaPlanEvidence,
  'planEvidenceHash' | 'shotSpecification' | 'coordination'
> {
  shotSpecification?: BrollShotSpecification
  coordination: BrollCoordinationPlan
}

export function createBrollPlanningQaPlanEvidence(
  input: BrollPlanningQaPlanEvidenceInput,
): BrollPlanningQaPlanEvidence {
  const core = brollPlanningQaPlanEvidenceCoreSchema.parse(input)
  return brollPlanningQaPlanEvidenceSchema.parse({
    ...core,
    planEvidenceHash: hashSkillValue(core),
  })
}

const brollPlanningQaValidatorInputSchema = z.object({
  assignment: brollSkillAssignmentSchema,
  context: brollPlanningContextSchema,
  planEvidence: brollPlanningQaPlanEvidenceSchema,
}).strict().superRefine((value, context) => {
  const { assignmentHash, ...assignmentCore } = value.assignment
  const { contextHash, ...contextCore } = value.context
  if (hashSkillValue(brollAssignmentCoreSchema.parse(assignmentCore)) !== assignmentHash) {
    context.addIssue({ code: 'custom', message: 'Planning QA rejected forged assignment evidence.' })
  }
  if (hashSkillValue(brollPlanningContextCoreSchema.parse(contextCore)) !== contextHash) {
    context.addIssue({ code: 'custom', message: 'Planning QA rejected forged context evidence.' })
  }
})

export const brollRangeAuthorityQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollEditorialPurposeQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollProfessionalRestraintQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollSourceSafetyQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollProvenanceRightsQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollPrivacyQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollProofSafetyQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollVisualDensityBudgetQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollRepetitionQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollOwnershipQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollCaptionSpaceQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollDependencyCompletenessQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollApprovalReadinessQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollCreditCeilingQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollProviderEligibilityQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollLowerCostRouteQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollRegionEligibilityQaInputSchema = brollPlanningQaValidatorInputSchema
export const brollGeneratedClassificationQaInputSchema = brollPlanningQaValidatorInputSchema

export interface BrollPlanningQaValidatorInput {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  planEvidence: BrollPlanningQaPlanEvidence
}

const PROVIDER_DECISIONS = new Set([
  'generate_with_gemini_omni',
  'edit_uploaded_video_with_gemini_omni',
  'refine_generated_omni_candidate',
])
const SOURCE_DECISIONS = new Set(['use_existing_project_clip', 'use_uploaded_user_asset'])
const INERT_DECISIONS = new Set([
  'use_no_broll',
  'needs_other_skill',
  'needs_user_confirmation',
  'blocked',
])

function parseInput(input: unknown): BrollPlanningQaValidatorInput {
  return brollPlanningQaValidatorInputSchema.parse(input) as BrollPlanningQaValidatorInput
}

function selectedCandidate(input: BrollPlanningQaValidatorInput) {
  const id = input.planEvidence.sourceCandidateId
  return id ? input.context.sourceCandidates.find((candidate) => candidate.sourceId === id) : undefined
}

function exactProviderImageCandidates(input: BrollPlanningQaValidatorInput) {
  const hashes = input.planEvidence.providerSourceArtifactHashes ?? []
  return hashes.map((hash) => input.context.sourceCandidates.find((candidate) =>
    candidate.sourceType === 'reference_image' && candidate.artifactRef.sha256 === hash))
}

function exactScope(input: BrollPlanningQaValidatorInput): boolean {
  return input.context.ownerUserId === input.assignment.ownerUserId &&
    input.context.workspaceId === input.assignment.workspaceId &&
    input.context.projectId === input.assignment.projectId &&
    input.context.assignmentId === input.assignment.assignmentId
}

function isHashedAssignmentValid(input: BrollPlanningQaValidatorInput): boolean {
  const { assignmentHash, ...core } = input.assignment
  return hashSkillValue(brollAssignmentCoreSchema.parse(core)) === assignmentHash
}

function isHashedContextValid(input: BrollPlanningQaValidatorInput): boolean {
  const { contextHash, ...core } = input.context
  return hashSkillValue(brollPlanningContextCoreSchema.parse(core)) === contextHash
}

function evidenceHashes(
  input: BrollPlanningQaValidatorInput,
  additional: readonly (string | undefined)[] = [],
): string[] {
  return [...new Set([
    input.assignment.assignmentHash,
    input.context.contextHash,
    input.planEvidence.planEvidenceHash,
    input.assignment.manifestRef.manifestHash,
    ...additional.filter((value): value is string => Boolean(value)),
  ])]
}

function finding(input: {
  qaKey: BrollPlanningQaKey
  validatorInput: BrollPlanningQaValidatorInput
  disposition: SkillQaFinding['disposition']
  summary: string
  observations: Readonly<Record<string, unknown>>
  additionalEvidenceHashes?: readonly (string | undefined)[]
}): SkillQaFinding {
  return createSkillQaFinding({
    qaKey: input.qaKey,
    validatorVersion: `${input.qaKey}.v1`,
    disposition: input.disposition,
    summary: input.summary,
    evidenceHashes: evidenceHashes(input.validatorInput, input.additionalEvidenceHashes),
    observations: input.observations,
  })
}

function derivedFinding(input: {
  qaKey: BrollPlanningQaKey
  validatorInput: BrollPlanningQaValidatorInput
  passed: boolean
  passSummary: string
  failSummary: string
  failDisposition?: SkillQaFinding['disposition']
  observations: Readonly<Record<string, unknown>>
  additionalEvidenceHashes?: readonly (string | undefined)[]
}): SkillQaFinding {
  return finding({
    qaKey: input.qaKey,
    validatorInput: input.validatorInput,
    disposition: input.passed ? 'pass' : input.failDisposition ?? 'blocking',
    summary: input.passed ? input.passSummary : input.failSummary,
    observations: input.observations,
    additionalEvidenceHashes: input.additionalEvidenceHashes,
  })
}

export function validateBrollRangeAuthority(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const exactRange = hashSkillValue(plan.authorizedRange) ===
    hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange)
  const passed = isHashedAssignmentValid(input) && isHashedContextValid(input) &&
    exactScope(input) && plan.assignmentId === input.assignment.assignmentId &&
    plan.assignmentHash === input.assignment.assignmentHash &&
    hashSkillValue(plan.manifestRef) === hashSkillValue(input.assignment.manifestRef) &&
    exactRange && isFrameRangeContained(plan.authorizedRange, input.assignment.masterTimingRange) &&
    plan.outsideAuthorizedRangeModified === false
  return derivedFinding({
    qaKey: 'b_roll.planning.range_authority', validatorInput: input, passed,
    passSummary: 'Assignment, context, manifest, and exact frame-range authority are coherent.',
    failSummary: 'Planning evidence is stale, cross-scope, or outside exact frame-range authority.',
    failDisposition: 'critical',
    observations: { exactRange, scopeMatched: exactScope(input), outsideRangeModified: false },
  })
}

export function validateBrollEditorialPurpose(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const passed = input.assignment.reason.trim().length >= 3 &&
    input.assignment.pointToProveClarifyCoverOrSupport.trim().length >= 3 &&
    input.assignment.expectedViewerBenefit.trim().length >= 3 &&
    input.planEvidence.reason.trim().length >= 3
  return derivedFinding({
    qaKey: 'b_roll.planning.editorial_purpose', validatorInput: input, passed,
    passSummary: 'B-roll has an explicit purpose, story point, and viewer benefit.',
    failSummary: 'B-roll lacks independently inspectable editorial purpose evidence.',
    observations: {
      reasonPresent: input.assignment.reason.trim().length >= 3,
      pointPresent: input.assignment.pointToProveClarifyCoverOrSupport.trim().length >= 3,
      viewerBenefitPresent: input.assignment.expectedViewerBenefit.trim().length >= 3,
      editorialRole: input.planEvidence.editorialRole,
    },
  })
}

export function validateBrollProfessionalRestraint(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const restraintRequired = input.context.userVisualPreference === 'no_extra_visuals' ||
    (input.context.speakerEmotionImportance >= 0.8 && input.context.baseFootageStrength >= 0.6) ||
    (input.context.meaningfulVisualNeed < 0.35 && input.context.baseFootageStrength >= 0.65)
  const passed = !restraintRequired || input.planEvidence.decision === 'use_no_broll'
  return derivedFinding({
    qaKey: 'b_roll.planning.professional_restraint', validatorInput: input, passed,
    passSummary: 'The plan independently evaluated and respected the no-action option.',
    failSummary: 'The plan creates visual work despite evidence that professional restraint is required.',
    observations: { restraintRequired, decision: input.planEvidence.decision },
  })
}

export function validateBrollSourceSafety(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const candidate = selectedCandidate(input)
  const sourceRequired = SOURCE_DECISIONS.has(input.planEvidence.decision) ||
    input.planEvidence.decision === 'edit_uploaded_video_with_gemini_omni' ||
    Boolean(input.planEvidence.sourceCandidateId)
  const exactArtifact = Boolean(candidate) && candidate?.artifactRef.sha256 ===
    input.planEvidence.sourceArtifactHash
  const safe = !sourceRequired || Boolean(candidate && exactArtifact && candidate.approvedByUser &&
    candidate.cropFeasibility >= 0.5 && candidate.speakerActionProtection >= 0.5 &&
    candidate.artifactRef.ownerUserId === input.assignment.ownerUserId &&
    candidate.artifactRef.workspaceId === input.assignment.workspaceId &&
    candidate.artifactRef.projectId === input.assignment.projectId)
  return derivedFinding({
    qaKey: 'b_roll.planning.source_safety', validatorInput: input, passed: safe,
    passSummary: 'Any selected source is exact, approved, tenant-bound, and composition-safe.',
    failSummary: 'The selected source is missing, stale, unapproved, cross-scope, or unsafe to compose.',
    observations: { sourceRequired, selectedCandidateFound: Boolean(candidate), exactArtifact },
    additionalEvidenceHashes: [candidate?.artifactRef.sha256],
  })
}

export function validateBrollProvenanceRights(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const candidate = selectedCandidate(input)
  const sourceSelected = Boolean(input.planEvidence.sourceCandidateId)
  const passed = !sourceSelected || Boolean(candidate?.provenanceVerified && candidate.rightsApproved)
  return derivedFinding({
    qaKey: 'b_roll.planning.provenance_rights', validatorInput: input, passed,
    passSummary: 'Selected source provenance and rights are approved.',
    failSummary: 'Selected source lacks approved provenance or rights evidence.',
    observations: {
      sourceSelected,
      provenanceVerified: candidate?.provenanceVerified === true,
      rightsApproved: candidate?.rightsApproved === true,
    },
    additionalEvidenceHashes: [candidate?.artifactRef.sha256],
  })
}

export function validateBrollPrivacy(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const candidate = selectedCandidate(input)
  const sourceSelected = Boolean(input.planEvidence.sourceCandidateId)
  const passed = !sourceSelected || candidate?.privacyApproved === true
  return derivedFinding({
    qaKey: 'b_roll.planning.privacy', validatorInput: input, passed,
    passSummary: 'Selected-source privacy authority is approved.',
    failSummary: 'Selected source lacks explicit privacy approval.',
    observations: { sourceSelected, privacyApproved: candidate?.privacyApproved === true },
    additionalEvidenceHashes: [candidate?.artifactRef.sha256],
  })
}

export function validateBrollProofSafety(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const candidate = selectedCandidate(input)
  const provider = PROVIDER_DECISIONS.has(input.planEvidence.decision)
  const generatedForbidden = input.context.generatedMediaWouldMislead ||
    input.context.claimSensitivity === 'verified_proof_required'
  const safeFailClosed = ['needs_user_confirmation', 'use_no_broll', 'blocked']
    .includes(input.planEvidence.decision)
  const selectedSourceSafe = !candidate || candidate.proofSafe
  const generatedClassificationSafe = !provider || Boolean(
    input.planEvidence.shotSpecification &&
    input.planEvidence.shotSpecification.proofClassification !== 'source_verified' &&
    input.planEvidence.shotSpecification.avoid.includes('fabricated proof'),
  )
  const passed = selectedSourceSafe && generatedClassificationSafe &&
    (!generatedForbidden || safeFailClosed)
  return derivedFinding({
    qaKey: 'b_roll.planning.proof_safety', validatorInput: input, passed,
    passSummary: 'Proof-sensitive evidence is source-safe or generation is fail-closed and illustrative.',
    failSummary: 'The plan could present unsafe or generated material as proof.',
    failDisposition: 'critical',
    observations: { provider, generatedForbidden, safeFailClosed, selectedSourceSafe, generatedClassificationSafe },
    additionalEvidenceHashes: [candidate?.artifactRef.sha256],
  })
}

export function validateBrollVisualDensityBudget(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const noVisualRequested = input.context.userVisualPreference === 'no_extra_visuals'
  const ownershipConflict = Boolean(input.context.primaryVisualOwner) &&
    input.assignment.requestedVisualOwnership === 'primary'
  const passed = (!noVisualRequested || plan.decision === 'use_no_broll') &&
    (!ownershipConflict || plan.decision === 'blocked') &&
    (plan.displayTreatment === 'no_display' || plan.coordination.visualOwnership ===
      input.assignment.requestedVisualOwnership)
  return derivedFinding({
    qaKey: 'b_roll.planning.visual_density_budget', validatorInput: input, passed,
    passSummary: 'Visual density respects preference, ownership, and no-display authority.',
    failSummary: 'The planned treatment exceeds the available visual-density or ownership budget.',
    observations: { noVisualRequested, ownershipConflict, displayTreatment: plan.displayTreatment },
  })
}

export function validateBrollRepetition(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const conceptKey = input.planEvidence.shotSpecification?.conceptKey
  const repeated = Boolean(conceptKey && input.context.priorConceptKeys.includes(conceptKey))
  const candidate = selectedCandidate(input)
  const excessiveCandidateRepetition = Boolean(candidate && candidate.repetitionRisk > 0.75)
  const passed = (!repeated && !excessiveCandidateRepetition) ||
    input.planEvidence.decision === 'use_no_broll'
  return derivedFinding({
    qaKey: 'b_roll.planning.repetition', validatorInput: input, passed,
    passSummary: 'The selected visual does not repeat a prior treatment above the accepted risk.',
    failSummary: 'The selected concept or source repeats an existing B-roll treatment.',
    observations: { repeated, excessiveCandidateRepetition },
    additionalEvidenceHashes: [candidate?.artifactRef.sha256],
  })
}

export function validateBrollOwnership(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const conflict = Boolean(input.context.primaryVisualOwner) &&
    input.assignment.requestedVisualOwnership === 'primary'
  const passed = input.planEvidence.coordination.visualOwnership ===
    input.assignment.requestedVisualOwnership && (!conflict || input.planEvidence.decision === 'blocked')
  return derivedFinding({
    qaKey: 'b_roll.planning.primary_visual_ownership', validatorInput: input, passed,
    passSummary: 'Primary/support ownership is exact and any exclusive-owner conflict fails closed.',
    failSummary: 'B-roll attempts to overlap another exclusive primary visual owner.',
    failDisposition: 'critical',
    observations: {
      requestedOwnership: input.assignment.requestedVisualOwnership,
      plannedOwnership: input.planEvidence.coordination.visualOwnership,
      conflict,
    },
  })
}

export function validateBrollCaptionSpace(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const reserved = input.context.captionReservedZoneCount > 0
  const preservesZones = input.planEvidence.captionSafeBehavior.toLowerCase().includes('caption') &&
    (!reserved || input.planEvidence.captionSafeBehavior.toLowerCase().includes('reserved'))
  const handoffExact = input.planEvidence.coordination.captionHandoffRequired === reserved
  const passed = preservesZones && handoffExact
  return derivedFinding({
    qaKey: 'b_roll.planning.caption_space', validatorInput: input, passed,
    passSummary: 'Caption-safe space and Captions ownership are explicitly preserved.',
    failSummary: 'The planned composition does not preserve exact caption-space authority.',
    observations: { reservedZoneCount: input.context.captionReservedZoneCount, preservesZones, handoffExact },
  })
}

export function validateBrollDependencyCompleteness(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const track = input.context.trackGraphRef
  const trackScoped = !track || (
    track.artifactType === 'track_graph_v1' &&
    track.ownerUserId === input.assignment.ownerUserId &&
    track.workspaceId === input.assignment.workspaceId &&
    track.projectId === input.assignment.projectId
  )
  const valid = !input.context.trackingRequired
    ? plan.coordination.trackingDependency === 'not_required'
    : track
      ? plan.coordination.trackingDependency === 'satisfied' &&
        plan.coordination.trackGraphRef?.sha256 === track.sha256 && trackScoped
      : plan.decision === 'needs_other_skill' &&
        plan.coordination.trackingDependency === 'needs_other_skill' &&
        plan.dependencySkillKey === 'track_all' &&
        plan.requiredDependencyArtifactType === 'track_graph_v1' &&
        plan.requiredForPhase === 'skill_execution'
  return derivedFinding({
    qaKey: 'b_roll.planning.dependency_completeness', validatorInput: input, passed: valid,
    passSummary: 'Tracking dependency authority is absent, exact, or represented by a typed fail-closed request.',
    failSummary: 'The B-roll plan has an incomplete, stale, or cross-scope tracking dependency.',
    observations: { trackingRequired: input.context.trackingRequired, trackGraphPresent: Boolean(track), trackScoped },
    additionalEvidenceHashes: [track?.sha256],
  })
}

export function validateBrollApprovalReadiness(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const executable = !INERT_DECISIONS.has(plan.decision)
  const outputDeclared = input.assignment.requiredOutputTypes.some((artifactType) =>
    artifactType.startsWith('b_roll_') || artifactType === 'provider_b_roll_candidate_video_mp4')
  const passed = outputDeclared &&
    input.context.confirmedAspectRatio.length > 0 &&
    input.assignment.maximumInitialCandidates === 1 && input.assignment.maximumRefinements === 1 &&
    plan.timeEstimateSeconds <= input.assignment.maximumTimeSeconds &&
    plan.creditEstimate <= input.assignment.maximumCredits &&
    (!executable || plan.displayTreatment !== 'no_display')
  return derivedFinding({
    qaKey: 'b_roll.planning.approval_readiness', validatorInput: input, passed,
    passSummary: 'The plan is complete, bounded, estimated, and ready for an external approval decision.',
    failSummary: 'The plan is incomplete or exceeds assignment authority and is not approval-ready.',
    observations: {
      executable,
      outputDeclared,
      confirmedAspectRatio: input.context.confirmedAspectRatio,
      maximumInitialCandidates: input.assignment.maximumInitialCandidates,
      maximumRefinements: input.assignment.maximumRefinements,
    },
  })
}

export function validateBrollCreditCeiling(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const passed = plan.creditEstimate <= input.assignment.maximumCredits &&
    plan.timeEstimateSeconds <= input.assignment.maximumTimeSeconds &&
    plan.providerCreditEstimate <= plan.creditEstimate &&
    (!PROVIDER_DECISIONS.has(plan.decision) || plan.providerCreditEstimate > 0) &&
    (PROVIDER_DECISIONS.has(plan.decision) || plan.providerCreditEstimate === 0)
  return derivedFinding({
    qaKey: 'b_roll.planning.credit_ceiling', validatorInput: input, passed,
    passSummary: 'Time, total-credit, and provider-credit estimates are within exact assignment ceilings.',
    failSummary: 'The route exceeds or contradicts its approved time or credit ceiling.',
    observations: {
      estimatedSeconds: plan.timeEstimateSeconds,
      maximumSeconds: input.assignment.maximumTimeSeconds,
      estimatedCredits: plan.creditEstimate,
      providerCredits: plan.providerCreditEstimate,
      maximumCredits: input.assignment.maximumCredits,
    },
  })
}

export function validateBrollProviderEligibility(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const plan = input.planEvidence
  const provider = PROVIDER_DECISIONS.has(plan.decision)
  const providerImageCandidates = exactProviderImageCandidates(input)
  const providerSourceArtifactHashes = plan.providerSourceArtifactHashes ?? []
  const providerImageAuthorityPresent = providerSourceArtifactHashes.length > 0
  const providerImageAuthorityValid = !providerImageAuthorityPresent || (
    providerImageCandidates.length >= 1 && providerImageCandidates.length <= 6 &&
    providerImageCandidates.every((candidate) => Boolean(
      candidate?.approvedByUser && candidate.provenanceVerified && candidate.rightsApproved &&
      candidate.privacyApproved && candidate.proofSafe && candidate.providerImageRole,
    )) &&
    new Set(providerSourceArtifactHashes).size === providerSourceArtifactHashes.length &&
    providerSourceArtifactHashes[0] === plan.sourceArtifactHash
  )
  const passed = !provider || (
    plan.providerRequestPlanned &&
    input.assignment.providerPermission === 'approved_within_ceiling' &&
    input.assignment.permittedSourceRoutes.includes(plan.decision) &&
    Boolean(plan.providerRequestPackageHash && plan.shotSpecification && plan.cropSafeProviderAspectRatio) &&
    input.assignment.maximumInitialCandidates === 1 &&
    input.assignment.maximumRefinements === 1 &&
    providerImageAuthorityValid
  )
  return derivedFinding({
    qaKey: 'b_roll.planning.provider_eligibility', validatorInput: input, passed,
    passSummary: 'Any provider route has exact permission, request, shot, ratio, and attempt authority.',
    failSummary: 'The provider route lacks exact assignment permission or executable request authority.',
    failDisposition: 'critical',
    observations: {
      provider,
      providerPermission: input.assignment.providerPermission,
      routePermitted: input.assignment.permittedSourceRoutes.includes(plan.decision),
      requestPackagePresent: Boolean(plan.providerRequestPackageHash),
      providerImageCount: plan.providerSourceArtifactHashes?.length ?? 0,
      providerImageAuthorityValid,
    },
    additionalEvidenceHashes: [
      plan.providerRequestPackageHash,
      ...(plan.providerSourceArtifactHashes ?? []),
    ],
  })
}

export function validateBrollLowerCostRoute(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const eligibleExisting = input.context.sourceCandidates.some((candidate) =>
    candidate.sourceType === 'existing_project_clip' && candidate.provenanceVerified &&
    candidate.rightsApproved && candidate.privacyApproved && candidate.proofSafe &&
    candidate.semanticRelevance >= 0.5 && candidate.approvedByUser)
  const provider = PROVIDER_DECISIONS.has(input.planEvidence.decision)
  const passed = !(provider && eligibleExisting) &&
    ['use_existing_project_clip', 'use_no_broll'].includes(input.planEvidence.lowerCostDecision)
  return derivedFinding({
    qaKey: 'b_roll.planning.lower_cost_route_evaluation', validatorInput: input, passed,
    passSummary: 'Existing-source and no-action routes were evaluated before provider work.',
    failSummary: 'A provider route was selected despite an eligible lower-cost project source.',
    observations: { eligibleExisting, provider, lowerCostDecision: input.planEvidence.lowerCostDecision },
  })
}

export function validateBrollRegionEligibility(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const uploadedEdit = input.planEvidence.decision === 'edit_uploaded_video_with_gemini_omni'
  const passed = !uploadedEdit || input.context.uploadedVideoEditRegionEligible
  return derivedFinding({
    qaKey: 'b_roll.planning.region_eligibility', validatorInput: input, passed,
    passSummary: 'Uploaded-video editing is absent or explicitly region-eligible.',
    failSummary: 'Uploaded-video editing was planned without current region eligibility.',
    failDisposition: 'critical',
    observations: { uploadedEdit, uploadedVideoEditRegionEligible: input.context.uploadedVideoEditRegionEligible },
  })
}

export function validateBrollGeneratedClassification(rawInput: unknown): SkillQaFinding {
  const input = parseInput(rawInput)
  const provider = PROVIDER_DECISIONS.has(input.planEvidence.decision)
  const source = SOURCE_DECISIONS.has(input.planEvidence.decision)
  const classification = input.planEvidence.shotSpecification?.proofClassification
  const providerSafe = !provider || Boolean(classification && classification !== 'source_verified')
  const sourceSafe = !source || classification === 'source_verified'
  const passed = providerSafe && sourceSafe
  return derivedFinding({
    qaKey: 'b_roll.planning.generated_media_classification', validatorInput: input, passed,
    passSummary: 'Generated media is explicitly non-proof and selected source is classified as source-verified.',
    failSummary: 'Generated/source media classification could misstate proof authority.',
    failDisposition: 'critical',
    observations: { provider, source, classification: classification ?? 'not_applicable' },
  })
}

const BROLL_PLANNING_VALIDATORS: Readonly<Record<
  BrollPlanningQaKey,
  (input: unknown) => SkillQaFinding
>> = {
  'b_roll.planning.range_authority': validateBrollRangeAuthority,
  'b_roll.planning.editorial_purpose': validateBrollEditorialPurpose,
  'b_roll.planning.professional_restraint': validateBrollProfessionalRestraint,
  'b_roll.planning.source_safety': validateBrollSourceSafety,
  'b_roll.planning.provenance_rights': validateBrollProvenanceRights,
  'b_roll.planning.privacy': validateBrollPrivacy,
  'b_roll.planning.proof_safety': validateBrollProofSafety,
  'b_roll.planning.visual_density_budget': validateBrollVisualDensityBudget,
  'b_roll.planning.repetition': validateBrollRepetition,
  'b_roll.planning.primary_visual_ownership': validateBrollOwnership,
  'b_roll.planning.caption_space': validateBrollCaptionSpace,
  'b_roll.planning.dependency_completeness': validateBrollDependencyCompleteness,
  'b_roll.planning.approval_readiness': validateBrollApprovalReadiness,
  'b_roll.planning.credit_ceiling': validateBrollCreditCeiling,
  'b_roll.planning.provider_eligibility': validateBrollProviderEligibility,
  'b_roll.planning.lower_cost_route_evaluation': validateBrollLowerCostRoute,
  'b_roll.planning.region_eligibility': validateBrollRegionEligibility,
  'b_roll.planning.generated_media_classification': validateBrollGeneratedClassification,
}

export function registerBrollPlanningQaPolicies(registry: SkillQaRegistry): void {
  for (const qaKey of BROLL_PLANNING_QA_KEYS) {
    registry.register(qaKey, BROLL_PLANNING_VALIDATORS[qaKey])
  }
}

const brollPlanningQaReportCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_planning_qa_report_v1'),
  skillKey: z.literal('b_roll'),
  skillVersion: z.literal('1.0.0'),
  contractVersion: z.literal('b_roll.skill_contract.v1'),
  manifestRef: skillManifestReferenceSchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  contextHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  planEvidenceHash: skillSha256Schema,
  validatorSetVersion: z.literal('b_roll.planning.validator_set.v1'),
  findings: z.array(skillQaFindingSchema).length(BROLL_PLANNING_QA_KEYS.length),
  evidenceHashes: z.array(skillSha256Schema).min(4).max(100),
  blockingFindingKeys: z.array(z.enum(BROLL_PLANNING_QA_KEYS)).max(BROLL_PLANNING_QA_KEYS.length),
  planningQaPassed: z.boolean(),
}).strict().superRefine((value, context) => {
  const findingKeys = value.findings.map((entry) => entry.qaKey)
  if (findingKeys.length !== new Set(findingKeys).size ||
    findingKeys.some((key, index) => key !== BROLL_PLANNING_QA_KEYS[index])) {
    context.addIssue({ code: 'custom', message: 'Planning QA report must contain every validator exactly once in canonical order.' })
  }
  if (new Set(value.evidenceHashes).size !== value.evidenceHashes.length) {
    context.addIssue({ code: 'custom', message: 'Planning QA report evidence hashes must be unique.' })
  }
  const derivedBlocking = value.findings
    .filter((entry) => ['needs_review', 'blocking', 'critical'].includes(entry.disposition))
    .map((entry) => entry.qaKey)
  if (hashSkillValue(derivedBlocking) !== hashSkillValue(value.blockingFindingKeys) ||
    value.planningQaPassed !== (derivedBlocking.length === 0)) {
    context.addIssue({ code: 'custom', message: 'Planning QA verdict does not match independently derived findings.' })
  }
})

export const brollPlanningQaReportSchema = brollPlanningQaReportCoreSchema.extend({
  reportHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { reportHash, ...core } = value
  if (hashSkillValue(core) !== reportHash) {
    context.addIssue({ code: 'custom', message: 'B-roll planning QA report hash is stale or forged.' })
  }
})

export type BrollPlanningQaReport = z.infer<typeof brollPlanningQaReportSchema>

export function createBrollPlanningQaReport(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  planEvidence: BrollPlanningQaPlanEvidence
  qa: SkillQaRegistry
}): BrollPlanningQaReport {
  const validatorInput = brollPlanningQaValidatorInputSchema.parse({
    assignment: input.assignment,
    context: input.context,
    planEvidence: input.planEvidence,
  }) as BrollPlanningQaValidatorInput
  const findings = BROLL_PLANNING_QA_KEYS.map((qaKey) =>
    input.qa.evaluate(qaKey, validatorInput as unknown as Readonly<Record<string, unknown>>))
  const blockingFindingKeys = findings
    .filter((entry) => ['needs_review', 'blocking', 'critical'].includes(entry.disposition))
    .map((entry) => entry.qaKey as BrollPlanningQaKey)
  const core = brollPlanningQaReportCoreSchema.parse({
    schemaVersion: 'b_roll_planning_qa_report_v1',
    skillKey: 'b_roll',
    skillVersion: '1.0.0',
    contractVersion: 'b_roll.skill_contract.v1',
    manifestRef: input.assignment.manifestRef,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    contextHash: input.context.contextHash,
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    planEvidenceHash: input.planEvidence.planEvidenceHash,
    validatorSetVersion: 'b_roll.planning.validator_set.v1',
    findings,
    evidenceHashes: [...new Set([
      input.assignment.assignmentHash,
      input.context.contextHash,
      input.planEvidence.planEvidenceHash,
      input.assignment.manifestRef.manifestHash,
      ...findings.map((entry) => entry.findingHash),
    ])],
    blockingFindingKeys,
    planningQaPassed: blockingFindingKeys.length === 0,
  })
  return brollPlanningQaReportSchema.parse({ ...core, reportHash: hashSkillValue(core) })
}

export function assertBrollPlanningQaReport(input: {
  report: BrollPlanningQaReport
  assignment: BrollSkillAssignment
  contextHash: string
  planEvidenceHash: string
}): BrollPlanningQaReport {
  const report = brollPlanningQaReportSchema.parse(input.report)
  if (
    report.assignmentId !== input.assignment.assignmentId ||
    report.assignmentHash !== input.assignment.assignmentHash ||
    report.contextHash !== input.contextHash ||
    report.planEvidenceHash !== input.planEvidenceHash ||
    hashSkillValue(report.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(report.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange)
  ) throw new Error('B-roll planning QA report is stale or belongs to different authority.')
  return report
}
