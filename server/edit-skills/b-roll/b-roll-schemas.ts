import { z } from 'zod'

import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import { sourceInventoryCandidateSchema } from '../shared/assignment-authorities'

export const brollDecisionSchema = z.enum([
  'use_existing_project_clip', 'use_uploaded_user_asset', 'generate_with_gemini_omni',
  'edit_uploaded_video_with_gemini_omni', 'refine_generated_omni_candidate', 'use_no_broll',
  'needs_other_skill', 'needs_user_confirmation', 'blocked',
])

export const brollEditorialRoleSchema = z.enum([
  'proof_support', 'context', 'cut_cover', 'visual_break', 'product_detail', 'location_detail',
  'process_step', 'before_after', 'emotional_support', 'establishing', 'screen_or_app_support',
  'transition_bridge',
])

export const brollDisplayTreatmentSchema = z.enum([
  'full_frame_takeover', 'full_frame_cutaway', 'inset', 'picture_in_picture', 'split_screen',
  'partial_overlay', 'background_layer', 'no_display',
])

export const brollAudioDispositionSchema = z.enum([
  'discard', 'retain_as_ambient_candidate', 'extract_for_sound_skill_review', 'retain_source_audio',
])

const brollAssignmentCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_assignment_v1'),
  assignmentId: z.string().trim().min(1).max(180),
  orchestrationRunId: z.string().trim().min(1).max(180),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  editPlanVersion: z.number().int().positive(),
  masterTimingHash: skillSha256Schema,
  masterTimingRange: skillFrameRangeSchema,
  segmentIds: z.array(z.string().trim().min(1).max(180)).min(1).max(1_000),
  sourceSequenceIds: z.array(z.string().trim().min(1).max(180)).max(1_000),
  readContextAuthority: z.object({
    wholeVideoReadOnly: z.literal(true),
    adjacentScenesReadOnly: z.literal(true),
    contextArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(1_000),
  }).strict(),
  writeRangeAuthority: z.object({
    authorizedRange: skillFrameRangeSchema,
    outsideAuthorizedRangeModified: z.literal(false),
  }).strict(),
  reason: z.string().trim().min(1).max(4_000),
  pointToProveClarifyCoverOrSupport: z.string().trim().min(1).max(4_000),
  expectedViewerBenefit: z.string().trim().min(1).max(4_000),
  requestedVisualOwnership: z.enum(['primary', 'support']),
  forbiddenInterpretations: z.array(z.string().trim().min(1).max(1_000)).min(1).max(100),
  permittedSourceRoutes: z.array(brollDecisionSchema).min(1).max(9),
  providerPermission: z.enum(['forbidden', 'approved_within_ceiling']),
  maximumInitialCandidates: z.literal(1),
  maximumRefinements: z.literal(1),
  maximumTimeSeconds: z.number().int().positive().max(3_600),
  maximumCredits: z.number().int().nonnegative().max(100_000),
  requiredOutputTypes: z.array(z.string().trim().min(1).max(180)).min(1).max(100),
  manifestRef: skillManifestReferenceSchema,
}).strict()

export const brollSkillAssignmentSchema = brollAssignmentCoreSchema.extend({
  assignmentHash: skillSha256Schema,
}).strict()

export { brollAssignmentCoreSchema }

/** @deprecated Import `sourceInventoryCandidateSchema` from the shared authority owner. */
export const brollSourceCandidateSchema = sourceInventoryCandidateSchema

const brollPlanningContextCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_context_manifest_v1'),
  ownerUserId: z.string().trim().min(1).max(180), workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180), assignmentId: z.string().trim().min(1).max(180),
  baseFootageStrength: z.number().min(0).max(1), speakerEmotionImportance: z.number().min(0).max(1),
  meaningfulVisualNeed: z.number().min(0).max(1),
  userVisualPreference: z.enum(['no_extra_visuals', 'minimal', 'balanced', 'rich']),
  claimSensitivity: z.enum(['none', 'supporting', 'claim_sensitive', 'verified_proof_required']),
  generatedMediaWouldMislead: z.boolean(), primaryVisualOwner: z.string().trim().min(1).max(180).optional(),
  captionReservedZoneCount: z.number().int().nonnegative().max(100), trackingRequired: z.boolean(),
  trackGraphRef: editSkillArtifactReferenceSchema.optional(), sourceCandidates: z.array(brollSourceCandidateSchema).max(1_000),
  priorConceptKeys: z.array(z.string().trim().min(1).max(180)).max(1_000),
  confirmedAspectRatio: z.string().regex(/^\d{1,4}:\d{1,4}$/u), uploadedVideoEditRegionEligible: z.boolean(),
  referenceDnaDoNotCopyRules: z.array(z.string().trim().min(1).max(1_000)).max(100),
}).strict()

export const brollPlanningContextSchema = brollPlanningContextCoreSchema.extend({ contextHash: skillSha256Schema }).strict()
export { brollPlanningContextCoreSchema }

export const brollShotSpecificationSchema = z.object({
  conceptKey: z.string().trim().min(1).max(180), purpose: z.string().trim().min(1).max(2_000),
  singleContinuousShot: z.literal(true), noSceneCuts: z.literal(true),
  subject: z.string().trim().min(1).max(2_000), action: z.string().trim().min(1).max(2_000),
  environment: z.string().trim().min(1).max(2_000), cameraIntent: z.string().trim().min(1).max(2_000),
  framing: z.string().trim().min(1).max(1_000), cameraMovement: z.string().trim().min(1).max(1_000),
  lensDepthIntent: z.string().trim().min(1).max(1_000), lighting: z.string().trim().min(1).max(1_000),
  colorMood: z.string().trim().min(1).max(1_000),
  visualStyle: z.string().trim().min(1).max(2_000),
  durationFrames: z.number().int().positive().max(2_400),
  durationSeconds: z.number().positive().max(100),
  aspectRatio: z.string().regex(/^\d{1,4}:\d{1,4}$/u),
  audioIntent: z.literal('silent_visual_candidate'),
  continuityRequirements: z.array(z.string().trim().min(1).max(1_000)).min(1).max(20),
  cropSafeSubjectArea: z.string().trim().min(1).max(1_000),
  allowedTransformationClass: z.enum([
    'illustrative_generation', 'contextual_generation', 'approved_source_edit',
  ]),
  proofClassification: z.enum(['source_verified', 'illustrative', 'contextual', 'atmospheric', 'symbolic']),
  avoid: z.array(z.string().trim().min(1).max(1_000)).min(1).max(100),
}).strict()

export const brollCoordinationPlanSchema = z.object({
  visualOwnership: z.enum(['primary', 'support']), captionHandoffRequired: z.boolean(),
  soundHandoffRequired: z.boolean(), colorHandoffRequired: z.boolean(), transitionHandoffRequired: z.boolean(),
  renderHandoffRequired: z.literal(true), trackingDependency: z.enum(['not_required', 'satisfied', 'needs_other_skill']),
  trackGraphRef: editSkillArtifactReferenceSchema.optional(),
  finalOwners: z.tuple([z.literal('captions'), z.literal('sound'), z.literal('color'), z.literal('transition'), z.literal('track_all'), z.literal('render')]),
}).strict().superRefine((value, context) => {
  if ((value.trackingDependency === 'satisfied') !== Boolean(value.trackGraphRef)) {
    context.addIssue({ code: 'custom', message: 'A satisfied tracking dependency must bind exactly one track_graph_v1 reference.' })
  }
})

const brollPlanCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_plan_v1'), planId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180), assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema, authorizedRange: skillFrameRangeSchema,
  decision: brollDecisionSchema, editorialRole: brollEditorialRoleSchema,
  reason: z.string().trim().min(1).max(4_000), sourceCandidateId: z.string().trim().min(1).max(180).optional(),
  sourceArtifactRef: editSkillArtifactReferenceSchema.optional(), sourceScore: z.number().min(0).max(100).optional(),
  providerSourceArtifactRefs: z.array(editSkillArtifactReferenceSchema).min(1).max(6).optional(),
  shotSpecification: brollShotSpecificationSchema.optional(), displayTreatment: brollDisplayTreatmentSchema,
  sourceTrim: skillFrameRangeSchema.optional(), cropSafeProviderAspectRatio: z.enum(['16:9', '9:16']).optional(),
  speakerVisibilityIntent: z.enum(['preserve', 'temporarily_hidden', 'not_applicable']),
  captionSafeBehavior: z.string().trim().min(1).max(2_000), audioDisposition: brollAudioDispositionSchema,
  entryIntent: z.string().trim().min(1).max(2_000), exitIntent: z.string().trim().min(1).max(2_000),
  coordination: brollCoordinationPlanSchema, providerRequestPlanned: z.boolean(),
  providerRequestPackageHash: skillSha256Schema.optional(),
  providerCreditEstimate: z.number().int().nonnegative(),
  dependencySkillKey: z.string().trim().min(1).max(180).optional(),
  requiredDependencyArtifactType: z.string().trim().min(1).max(180).optional(),
  requiredForPhase: z.string().trim().min(1).max(180).optional(),
  refinementAuthority: z.object({
    previousCandidateVersionId: skillSha256Schema,
    previousCandidateVersionHash: skillSha256Schema,
    priorQaReportHash: skillSha256Schema,
    requestedCandidateVersion: z.literal(2),
    refinementCount: z.literal(1),
    maximumRefinements: z.literal(1),
  }).strict().optional(),
  timeEstimateSeconds: z.number().int().nonnegative(), creditEstimate: z.number().int().nonnegative(),
  lowerCostDecision: z.enum(['use_existing_project_clip', 'use_no_broll']),
  planningQaPlanEvidenceHash: skillSha256Schema,
  planningQaReportArtifactType: z.literal('b_roll_planning_qa_report_v1'),
  planningQaReportHash: skillSha256Schema,
  planningQaPassed: z.boolean(), outsideAuthorizedRangeModified: z.literal(false),
}).strict().superRefine((value, context) => {
  const providerDecisions = [
    'generate_with_gemini_omni',
    'edit_uploaded_video_with_gemini_omni',
    'refine_generated_omni_candidate',
  ]
  const inertDecisions = [
    'use_no_broll',
    'needs_other_skill',
    'needs_user_confirmation',
    'blocked',
  ]
  const sourceDecisions = ['use_existing_project_clip', 'use_uploaded_user_asset']
  const provider = providerDecisions.includes(value.decision)
  const inert = inertDecisions.includes(value.decision)
  const source = sourceDecisions.includes(value.decision)
  const hasSelectedSource = Boolean(
    value.sourceCandidateId || value.sourceArtifactRef || value.sourceScore !== undefined,
  )
  const completeSelectedSource = Boolean(
    value.sourceCandidateId && value.sourceArtifactRef && value.sourceScore !== undefined,
  )
  const dependencyFields = [
    value.dependencySkillKey,
    value.requiredDependencyArtifactType,
    value.requiredForPhase,
  ]
  const dependencyFieldCount = dependencyFields.filter(Boolean).length

  if (!value.planningQaPassed) {
    context.addIssue({ code: 'custom', message: 'Executable B-roll plan artifacts require a passed evidence-derived planning QA report.' })
  }
  if (value.providerRequestPlanned !== provider) {
    context.addIssue({ code: 'custom', message: 'B-roll provider request authority contradicts the final decision.' })
  }
  if (
    provider !== Boolean(value.providerRequestPackageHash) ||
    provider !== Boolean(value.cropSafeProviderAspectRatio) ||
    (provider && !value.shotSpecification)
  ) {
    context.addIssue({ code: 'custom', message: 'B-roll provider decisions require one exact request package, shot, and native aspect ratio.' })
  }
  if ((provider && value.providerCreditEstimate <= 0) || (!provider && value.providerCreditEstimate !== 0)) {
    context.addIssue({ code: 'custom', message: 'B-roll provider credit estimate contradicts provider execution authority.' })
  }
  if (hasSelectedSource !== completeSelectedSource) {
    context.addIssue({ code: 'custom', message: 'B-roll selected source identity, checksum reference, and score must be complete.' })
  }
  if (value.sourceTrim && !completeSelectedSource) {
    context.addIssue({ code: 'custom', message: 'B-roll source trim requires an exact selected source.' })
  }
  if (value.providerSourceArtifactRefs) {
    const hashes = value.providerSourceArtifactRefs.map((reference) => reference.sha256)
    if (
      !provider || !completeSelectedSource ||
      hashes.length !== new Set(hashes).size ||
      hashes[0] !== value.sourceArtifactRef?.sha256 ||
      value.sourceArtifactRef?.artifactType !== 'approved_user_asset_v1' ||
      value.providerSourceArtifactRefs.some((reference) =>
        reference.artifactType !== 'approved_user_asset_v1')
    ) context.addIssue({
      code: 'custom',
      message: 'Gemini provider image authority must contain one to six unique exact sources led by the selected source.',
    })
  }
  if (
    provider && value.sourceArtifactRef?.artifactType === 'approved_user_asset_v1' &&
    !value.providerSourceArtifactRefs
  ) context.addIssue({
    code: 'custom',
    message: 'Gemini image generation requires exact provider image source authority.',
  })
  if (source && !completeSelectedSource) {
    context.addIssue({ code: 'custom', message: 'Existing-source and user-asset decisions require an exact checksum-bound source.' })
  }
  if (source && (
    value.providerRequestPlanned || value.providerRequestPackageHash ||
    value.cropSafeProviderAspectRatio || value.providerSourceArtifactRefs ||
    value.providerCreditEstimate !== 0
  )) context.addIssue({ code: 'custom', message: 'Source decisions cannot carry provider execution authority.' })
  if (inert && (
    value.displayTreatment !== 'no_display' || completeSelectedSource || value.sourceTrim ||
    value.shotSpecification || value.cropSafeProviderAspectRatio || value.providerRequestPackageHash ||
    value.providerSourceArtifactRefs || value.providerRequestPlanned ||
    value.providerCreditEstimate !== 0 || value.creditEstimate !== 0 ||
    value.speakerVisibilityIntent !== 'not_applicable' || value.audioDisposition !== 'discard'
  )) context.addIssue({ code: 'custom', message: 'Non-executable B-roll decisions must be a coherent zero-cost no-display plan.' })
  if (!inert && value.displayTreatment === 'no_display') {
    context.addIssue({ code: 'custom', message: 'Executable B-roll decisions require a visible display treatment.' })
  }
  if (value.decision === 'needs_other_skill') {
    if (
      dependencyFieldCount !== 3 ||
      value.dependencySkillKey !== 'track_all' ||
      value.requiredDependencyArtifactType !== 'track_graph_v1' ||
      value.requiredForPhase !== 'skill_execution' ||
      value.coordination.trackingDependency !== 'needs_other_skill'
    ) context.addIssue({ code: 'custom', message: 'B-roll dependency plan must request the exact model-neutral Track All artifact.' })
  } else if (dependencyFieldCount !== 0) {
    context.addIssue({ code: 'custom', message: 'Only needs_other_skill plans may carry dependency request authority.' })
  }
  if ((value.decision === 'refine_generated_omni_candidate') !== Boolean(value.refinementAuthority)) {
    context.addIssue({ code: 'custom', message: 'B-roll refinement requires exact prior candidate and QA authority and permits only version two.' })
  }
  if (
    value.decision === 'edit_uploaded_video_with_gemini_omni' && !completeSelectedSource
  ) context.addIssue({ code: 'custom', message: 'Gemini uploaded-video editing requires one exact approved source artifact.' })
})

export const brollPlanArtifactSchema = brollPlanCoreSchema.extend({ planHash: skillSha256Schema }).strict()
  .superRefine((value, context) => {
    const { planHash, ...core } = value
    if (hashSkillValue(core) !== planHash) {
      context.addIssue({ code: 'custom', message: 'B-roll plan hash is stale or forged.' })
    }
  })
export { brollPlanCoreSchema }
