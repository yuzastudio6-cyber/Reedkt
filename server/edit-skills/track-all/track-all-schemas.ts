import { z } from 'zod'

import type { EditSkillArtifactSchemaRegistry } from '../core/edit-skill-artifact-store'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../core/skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { skillQaFindingSchema } from '../core/skill-qa-registry'
import {
  captionReservedZonesV1Schema,
  masterTimingPlanSchema,
  sourceInventorySchema,
  visualOwnershipManifestSchema,
} from '../shared/assignment-authorities'
import { trackGraphV1Schema, trackGraphV2Schema } from '../shared/track-graph/track-graph-schemas'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
  trackAllAtomicExecutionEvidenceSchema,
  trackAllChunkSeamQaReportSchema,
  trackAllContextManifestSchema,
  trackAllCrossSkillHandoffSchema,
  trackAllIdentityQaReportSchema,
  trackAllIntegrationQaReportSchema,
  trackAllMaskQaReportSchema,
  trackAllPrivacyQaReportSchema,
  trackAllPublicWorkProjectionEvidenceSchema,
  trackAllRepairReceiptSchema,
  trackAllTargetQaReportSchema,
  trackAllTemporalQaReportSchema,
  trackAllWorkGraphArtifactSchema,
  trackAnchorGraphSchema,
  trackBoxSequenceSchema,
  trackedFocusPlanSchema,
  trackedFocusResultSchema,
  trackedRedactionPlanSchema,
  trackedRedactionResultSchema,
  trackedReframePlanSchema,
  trackedReframeResultSchema,
  trackIdentityLineageSchema,
  trackLandmarkSequenceSchema,
  trackMaskChunkManifestSchema,
  trackMaskSequenceSchema,
  trackOcclusionEventLogSchema,
  trackSampleSequenceSchema,
} from './track-all-active-artifact-contracts'
import {
  trackAllPreflightObservationSchema,
  trackAllSam31RuntimeProfileV2Schema,
} from './track-all-planning-authorities'

const safeId = z.string().trim().min(1).max(180)
const timestamp = z.string().datetime({ offset: true })
const unit = z.number().min(0).max(1)
const point = z.object({ x: unit, y: unit }).strict()
const box = z.object({ x: unit, y: unit, width: unit, height: unit }).strict().superRefine((value, context) => {
  if (value.width <= 0 || value.height <= 0 || value.x + value.width > 1 || value.y + value.height > 1) {
    context.addIssue({ code: 'custom', message: 'Normalized target box is outside the frame.' })
  }
})

/** Track All consumes the canonical shared caption-zone contract owned by Captions/B-Roll. */
export const trackAllCaptionReservedZonesSchema = captionReservedZonesV1Schema

function isRangeContained(
  child: z.infer<typeof skillFrameRangeSchema>,
  parent: z.infer<typeof skillFrameRangeSchema>,
): boolean {
  return child.fps === parent.fps &&
    child.startFrameInclusive >= parent.startFrameInclusive &&
    child.endFrameExclusive <= parent.endFrameExclusive
}

export const TRACK_ALL_TARGET_TYPES = [
  'selected_instance', 'concept_group', 'selected_group', 'planar_region',
  'freeform_region', 'camera_relative_region', 'world_relative_region',
  'existing_track', 'track_child_region', 'track_parent_region',
] as const

export const TRACK_ALL_DECISIONS = [
  'produce_track_graph', 'apply_privacy_redaction', 'apply_tracked_focus',
  'prepare_tracked_reframe', 'track_planar_region', 'repair_existing_track',
  'needs_visual_intelligence', 'needs_user_selection', 'needs_range_expansion',
  'needs_manual_keyframe', 'needs_user_confirmation', 'target_not_found',
  'multiple_targets_ambiguous', 'identity_uncertain', 'privacy_coverage_blocked',
  'needs_preflight_observation', 'needs_track_graph',
  'needs_route_qualification', 'blocked_external_sam_prerequisites',
  'use_no_tracking', 'blocked',
] as const

const approvedArtifactEvidenceSchema = z.object({
  kind: z.enum(['approved_brush_mask', 'approved_reference_image', 'visual_intelligence_grounding', 'existing_track_reference']),
  artifactRef: editSkillArtifactReferenceSchema,
}).strict()

export const trackAllGroundingEvidenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text_concept'), compiledConcept: z.string().trim().min(1).max(300), sourceEvidenceHash: skillSha256Schema }).strict(),
  z.object({ kind: z.literal('positive_points'), frameIndex: z.number().int().nonnegative(), points: z.array(point).min(1).max(32) }).strict(),
  z.object({ kind: z.literal('negative_points'), frameIndex: z.number().int().nonnegative(), points: z.array(point).min(1).max(32) }).strict(),
  z.object({ kind: z.literal('bounding_box'), frameIndex: z.number().int().nonnegative(), box }).strict(),
  approvedArtifactEvidenceSchema.extend({ kind: z.literal('approved_brush_mask') }).strict(),
  approvedArtifactEvidenceSchema.extend({ kind: z.literal('approved_reference_image') }).strict(),
  approvedArtifactEvidenceSchema.extend({ kind: z.literal('visual_intelligence_grounding') }).strict(),
  approvedArtifactEvidenceSchema.extend({ kind: z.literal('existing_track_reference') }).strict(),
])

const targetCoreSchema = z.object({
  schemaVersion: z.literal('track_all_target_specification_v1'),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  targetId: safeId,
  targetType: z.enum(TRACK_ALL_TARGET_TYPES),
  semanticClass: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(1_000),
  anonymousIdentityPolicy: z.literal('anonymous_stable_ids_only'),
  parentTargetId: safeId.optional(),
  childTargetIds: z.array(safeId).max(100).default([]),
  includeRules: z.array(z.string().trim().min(1).max(300)).max(100),
  excludeRules: z.array(z.string().trim().min(1).max(300)).max(100),
  expectedMinimumCount: z.number().int().nonnegative().max(1_000),
  expectedMaximumCount: z.number().int().positive().max(1_000),
  privacyClassification: z.enum(['none', 'personal', 'sensitive', 'child', 'high_assurance']),
  targetCriticality: z.enum(['normal', 'important', 'privacy_critical']),
  initializationFramePreference: z.number().int().nonnegative().optional(),
  occlusionPolicy: z.enum(['terminate', 'hold_and_reacquire', 'conservative_cover']),
  reentryPolicy: z.enum(['new_identity', 'confidence_qualified_reacquisition', 'manual_review']),
  crossShotPolicy: z.enum(['terminate', 'explicit_confidence_link', 'manual_only']),
  lostTrackBehavior: z.enum(['block', 'manual_review', 'conservative_cover', 'terminate']),
  ambiguityBehavior: z.enum(['request_visual_intelligence', 'request_user_selection', 'block']),
  treatmentIntent: z.enum(['geometry_only', 'privacy_redaction', 'tracked_focus', 'tracked_reframe', 'planar_geometry', 'repair']),
  groundingEvidence: z.array(trackAllGroundingEvidenceSchema).min(1).max(100),
}).strict().superRefine((value, context) => {
  if (value.expectedMaximumCount < value.expectedMinimumCount) {
    context.addIssue({ code: 'custom', message: 'Target maximum count is below its minimum.' })
  }
  if (value.targetCriticality === 'privacy_critical' && value.lostTrackBehavior !== 'conservative_cover') {
    context.addIssue({ code: 'custom', message: 'Privacy-critical targets must conservatively cover a lost track.' })
  }
  const frames = value.groundingEvidence.flatMap((evidence) => 'frameIndex' in evidence ? [evidence.frameIndex] : [])
  if (value.initializationFramePreference !== undefined && frames.length > 0 && !frames.includes(value.initializationFramePreference)) {
    context.addIssue({ code: 'custom', message: 'Initialization preference lacks exact grounding evidence.' })
  }
})

export const trackAllTargetSpecificationSchema = targetCoreSchema.extend({ targetHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { targetHash, ...core } = value
  if (hashSkillValue(core) !== targetHash) context.addIssue({ code: 'custom', message: 'Track All target hash is stale or forged.' })
})

export function createTrackAllTargetSpecification(input: z.input<typeof targetCoreSchema>) {
  const core = targetCoreSchema.parse(input)
  return trackAllTargetSpecificationSchema.parse({ ...core, targetHash: hashSkillValue(core) })
}

export function createTrackAllWriteAuthorityHash(input: {
  assignmentId: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  coordinateSpace: 'source_pixels' | 'normalized_source_frame'
  authorizedWriteRange: z.infer<typeof skillFrameRangeSchema>
}): string {
  return hashSkillValue(input)
}

const trackAllAssignmentCoreSchema = z.object({
  schemaVersion: z.literal('track_all_assignment_v1'),
  assignmentId: safeId,
  orchestrationRunId: safeId.optional(),
  preOrchestraAssignmentAuthorityId: safeId.optional(),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: z.number().int().positive(),
  manifestRef: skillManifestReferenceSchema,
  coordinateSpace: z.enum(['source_pixels', 'normalized_source_frame']),
  authorizedWriteRange: skillFrameRangeSchema,
  analysisContextRange: skillFrameRangeSchema,
  sourceRangeMappingHash: skillSha256Schema,
  sceneIds: z.array(safeId).min(1).max(1_000),
  shotIds: z.array(safeId).max(1_000),
  writeAuthorityHash: skillSha256Schema,
  readContext: z.object({
    wholeVideoContextPermission: z.boolean(),
    transcriptEvidenceRefs: z.array(editSkillArtifactReferenceSchema).max(100),
    visualEvidenceRefs: z.array(editSkillArtifactReferenceSchema).max(100),
    priorTrackGraphRefs: z.array(editSkillArtifactReferenceSchema).max(100),
    sourceInventoryRef: editSkillArtifactReferenceSchema,
    masterTimingRef: editSkillArtifactReferenceSchema,
    visualOwnershipRef: editSkillArtifactReferenceSchema,
    editPreferenceRef: editSkillArtifactReferenceSchema.optional(),
    privacyPolicyRef: editSkillArtifactReferenceSchema.optional(),
    referenceDnaRef: editSkillArtifactReferenceSchema.optional(),
  }).strict(),
  editorialRequest: z.object({
    requestedJobType: skillIdentitySchema,
    reason: z.string().trim().min(1).max(2_000),
    targetDescription: z.string().trim().min(1).max(1_000),
    intendedTreatment: z.enum(['geometry_only', 'privacy_redaction', 'tracked_focus', 'tracked_reframe', 'planar_geometry', 'repair', 'no_action']),
    viewerBenefit: z.string().trim().min(1).max(1_000),
    privacyCriticality: z.enum(['none', 'normal', 'high']),
    forbiddenTargets: z.array(z.string().trim().min(1).max(300)).max(100),
    expectedCount: z.number().int().nonnegative().max(1_000),
    exclusions: z.array(z.string().trim().min(1).max(300)).max(100),
    uncertaintyBehavior: z.enum(['request_evidence', 'request_selection', 'block', 'conservative_cover']),
  }).strict(),
  permissions: z.object({
    analysisOnlyAllowed: z.boolean(),
    directTreatmentAllowed: z.boolean(),
    sam3_1Allowed: z.boolean(),
    deterministicToolsAllowed: z.boolean(),
    ocrAllowed: z.boolean(),
    landmarkSupportAllowed: z.boolean(),
    maximumObjects: z.number().int().min(1).max(128),
    maximumChunks: z.number().int().min(1).max(1_000),
    maximumAttempts: z.number().int().min(1).max(3),
    maximumCredits: z.number().int().nonnegative().max(100_000),
    maximumTimeSeconds: z.number().int().nonnegative().max(86_400),
    manualReviewPermitted: z.boolean(),
  }).strict(),
  requiredOutputs: z.array(z.enum([
    'track_graph', 'mask_sequence', 'anchors', 'camera_motion', 'treatment_preview',
    'redaction_audit', 'result_receipt',
  ])).min(1).max(7),
}).strict().superRefine((value, context) => {
  if (!value.orchestrationRunId && !value.preOrchestraAssignmentAuthorityId) {
    context.addIssue({ code: 'custom', message: 'Track All assignment needs orchestra or pre-orchestra authority.' })
  }
  if (value.manifestRef.skillKey !== 'track_all') context.addIssue({ code: 'custom', message: 'Track All assignment references another skill manifest.' })
  const sameFps = value.analysisContextRange.fps === value.authorizedWriteRange.fps
  const contains = value.analysisContextRange.startFrameInclusive <= value.authorizedWriteRange.startFrameInclusive && value.analysisContextRange.endFrameExclusive >= value.authorizedWriteRange.endFrameExclusive
  if (!sameFps || !contains) context.addIssue({ code: 'custom', message: 'Analysis context must contain the exact write range at the same FPS.' })
  const expectedWriteAuthorityHash = createTrackAllWriteAuthorityHash({
    assignmentId: value.assignmentId, ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId, projectId: value.projectId,
    editSessionId: value.editSessionId, coordinateSpace: value.coordinateSpace,
    authorizedWriteRange: value.authorizedWriteRange,
  })
  if (value.writeAuthorityHash !== expectedWriteAuthorityHash) {
    context.addIssue({ code: 'custom', message: 'Track All write authority hash is stale or forged.' })
  }
  const scopedRefs = [
    ...value.readContext.transcriptEvidenceRefs,
    ...value.readContext.visualEvidenceRefs,
    ...value.readContext.priorTrackGraphRefs,
    value.readContext.sourceInventoryRef, value.readContext.masterTimingRef,
    value.readContext.visualOwnershipRef, value.readContext.editPreferenceRef,
    value.readContext.privacyPolicyRef, value.readContext.referenceDnaRef,
  ].filter(Boolean) as z.infer<typeof editSkillArtifactReferenceSchema>[]
  if (scopedRefs.some((ref) => ref.ownerUserId !== value.ownerUserId || ref.workspaceId !== value.workspaceId || ref.projectId !== value.projectId)) {
    context.addIssue({ code: 'custom', message: 'Track All assignment contains a cross-tenant read authority.' })
  }
  for (const [ref, artifactType] of [
    [value.readContext.sourceInventoryRef, 'source_inventory_v1'],
    [value.readContext.masterTimingRef, 'master_timing_plan_v1'],
    [value.readContext.visualOwnershipRef, 'visual_ownership_manifest_v1'],
  ] as const) {
    if (ref.artifactType !== artifactType) context.addIssue({ code: 'custom', message: `Track All assignment has the wrong ${artifactType} role.` })
  }
})

export const trackAllAssignmentSchema = trackAllAssignmentCoreSchema.extend({ assignmentHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { assignmentHash, ...core } = value
  if (hashSkillValue(core) !== assignmentHash) context.addIssue({ code: 'custom', message: 'Track All assignment hash is stale or forged.' })
})

export function createTrackAllAssignment(input: z.input<typeof trackAllAssignmentCoreSchema>) {
  const core = trackAllAssignmentCoreSchema.parse(input)
  return trackAllAssignmentSchema.parse({ ...core, assignmentHash: hashSkillValue(core) })
}

export const trackAllSourceInventorySchema = sourceInventorySchema

export const trackAllMasterTimingSchema = masterTimingPlanSchema

const sourceFrameAuthorityCoreSchema = z.object({
  schemaVersion: z.literal('source_frame_authority_v1'), ownerUserId: safeId, workspaceId: safeId, projectId: safeId,
  sourceId: safeId, sourceChecksum: skillSha256Schema, range: skillFrameRangeSchema,
  width: z.number().int().positive(), height: z.number().int().positive(), pixelAspectRatio: z.number().positive(),
}).strict()

export const sourceFrameAuthoritySchema = sourceFrameAuthorityCoreSchema.extend({
  authorityHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { authorityHash, ...core } = value
  if (hashSkillValue(core) !== authorityHash) context.addIssue({ code: 'custom', message: 'Source frame authority hash is stale or forged.' })
})

export function createSourceFrameAuthority(input: z.input<typeof sourceFrameAuthorityCoreSchema>) {
  const core = sourceFrameAuthorityCoreSchema.parse(input)
  return sourceFrameAuthoritySchema.parse({ ...core, authorityHash: hashSkillValue(core) })
}

export const trackAllVisualOwnershipSchema = visualOwnershipManifestSchema

const trackAllSceneContextCoreSchema = z.object({
  schemaVersion: z.literal('track_all_scene_context_v1'), assignmentId: safeId,
  analysisContextRange: skillFrameRangeSchema, authorizedWriteRange: skillFrameRangeSchema,
  wholeVideoEvidenceReadOnly: z.literal(true), sceneIds: z.array(safeId).min(1), shotBoundaries: z.array(z.number().int().nonnegative()).max(10_000),
}).strict().superRefine((value, context) => {
  if (!isRangeContained(value.authorizedWriteRange, value.analysisContextRange)) context.addIssue({ code: 'custom', message: 'Scene analysis context does not contain the write range.' })
  if (value.shotBoundaries.some((frame) => frame <= value.authorizedWriteRange.startFrameInclusive || frame >= value.authorizedWriteRange.endFrameExclusive)) context.addIssue({ code: 'custom', message: 'Shot boundaries must be strictly inside the authorized write range.' })
  if (new Set(value.shotBoundaries).size !== value.shotBoundaries.length || value.shotBoundaries.some((frame, index) => index > 0 && frame <= value.shotBoundaries[index - 1]!)) context.addIssue({ code: 'custom', message: 'Shot boundaries must be unique and increasing.' })
})

export const trackAllSceneContextSchema = trackAllSceneContextCoreSchema.extend({
  contextHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { contextHash, ...core } = value
  if (hashSkillValue(core) !== contextHash) context.addIssue({ code: 'custom', message: 'Track All scene context hash is stale or forged.' })
})

export function createTrackAllSceneContext(input: z.input<typeof trackAllSceneContextCoreSchema>) {
  const core = trackAllSceneContextCoreSchema.parse(input)
  return trackAllSceneContextSchema.parse({ ...core, contextHash: hashSkillValue(core) })
}

const visualIntelligenceTargetEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('visual_intelligence_target_evidence_v1'), ownerUserId: safeId, workspaceId: safeId, projectId: safeId,
  assignmentHash: skillSha256Schema, targetHash: skillSha256Schema, authorizedRangeHash: skillSha256Schema,
  semanticClass: z.string().trim().min(1).max(180), candidateRegions: z.array(z.object({ frameIndex: z.number().int().nonnegative(), box, confidence: unit }).strict()).min(1).max(1_000),
  ambiguity: z.enum(['none', 'multiple_candidates', 'uncertain']), confidence: unit,
  producerSkillManifestRef: skillManifestReferenceSchema, qualificationStatus: z.enum(['planning_qualified', 'internal_execution_qualified', 'production_qualified']),
  testOnlyInjected: z.boolean(),
}).strict()

export const visualIntelligenceTargetEvidenceSchema = visualIntelligenceTargetEvidenceCoreSchema.extend({
  evidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { evidenceHash, ...core } = value
  if (hashSkillValue(core) !== evidenceHash) context.addIssue({ code: 'custom', message: 'Visual Intelligence target evidence hash is stale or forged.' })
  if (value.producerSkillManifestRef.skillKey !== 'visual_intelligence') context.addIssue({ code: 'custom', message: 'Visual Intelligence target evidence has the wrong producer skill.' })
  if (value.testOnlyInjected && value.qualificationStatus === 'production_qualified') context.addIssue({ code: 'custom', message: 'Injected target evidence cannot be production-qualified.' })
})

export function createVisualIntelligenceTargetEvidence(input: z.input<typeof visualIntelligenceTargetEvidenceCoreSchema>) {
  const core = visualIntelligenceTargetEvidenceCoreSchema.parse(input)
  return visualIntelligenceTargetEvidenceSchema.parse({ ...core, evidenceHash: hashSkillValue(core) })
}

const visualIntelligenceTrackingQaCoreSchema = z.object({
  schemaVersion: z.literal('visual_intelligence_tracking_qa_v1'), ownerUserId: safeId, workspaceId: safeId, projectId: safeId,
  assignmentHash: skillSha256Schema, planHash: skillSha256Schema, trackGraphHash: skillSha256Schema,
  targetAlignment: unit, temporalPlausibility: unit, privacyExposureDetected: z.boolean(), visualDefects: z.array(z.string().trim().min(1).max(300)).max(100),
  producerSkillManifestRef: skillManifestReferenceSchema, qualificationStatus: z.enum(['planning_qualified', 'internal_execution_qualified', 'production_qualified']), testOnlyInjected: z.boolean(),
}).strict()

export const visualIntelligenceTrackingQaSchema = visualIntelligenceTrackingQaCoreSchema.extend({
  qaHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { qaHash, ...core } = value
  if (hashSkillValue(core) !== qaHash) context.addIssue({ code: 'custom', message: 'Visual Intelligence tracking QA hash is stale or forged.' })
  if (value.producerSkillManifestRef.skillKey !== 'visual_intelligence') context.addIssue({ code: 'custom', message: 'Visual Intelligence tracking QA has the wrong producer skill.' })
  if (value.testOnlyInjected && value.qualificationStatus === 'production_qualified') context.addIssue({ code: 'custom', message: 'Injected tracking QA cannot be production-qualified.' })
})

export function createVisualIntelligenceTrackingQa(input: z.input<typeof visualIntelligenceTrackingQaCoreSchema>) {
  const core = visualIntelligenceTrackingQaCoreSchema.parse(input)
  return visualIntelligenceTrackingQaSchema.parse({ ...core, qaHash: hashSkillValue(core) })
}

const privacyPolicySnapshotCoreSchema = z.object({
  schemaVersion: z.literal('privacy_policy_snapshot_v1'), ownerUserId: safeId, workspaceId: safeId, projectId: safeId,
  policyVersion: z.number().int().positive(), failClosed: z.literal(true), allowedTreatments: z.array(z.enum(['gaussian_blur', 'pixelate', 'mosaic', 'solid_fill', 'conservative_region_cover', 'tracked_crop_exclusion'])).min(1),
}).strict()

export const privacyPolicySnapshotSchema = privacyPolicySnapshotCoreSchema.extend({
  policyHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { policyHash, ...core } = value
  if (hashSkillValue(core) !== policyHash) context.addIssue({ code: 'custom', message: 'Privacy policy hash is stale or forged.' })
})

export function createPrivacyPolicySnapshot(input: z.input<typeof privacyPolicySnapshotCoreSchema>) {
  const core = privacyPolicySnapshotCoreSchema.parse(input)
  return privacyPolicySnapshotSchema.parse({ ...core, policyHash: hashSkillValue(core) })
}

const approvedSelectionCoreSchema = z.object({
  schemaVersion: z.literal('approved_user_selection_v1'), ownerUserId: safeId,
  workspaceId: safeId, projectId: safeId, editSessionId: safeId,
  assignmentId: safeId, targetId: safeId, frameIndex: z.number().int().nonnegative(),
  selection: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('positive_points'), points: z.array(point).min(1).max(32) }).strict(),
    z.object({ kind: z.literal('positive_and_negative_points'), positivePoints: z.array(point).min(1).max(32), negativePoints: z.array(point).min(1).max(32) }).strict(),
    z.object({ kind: z.literal('bounding_box'), box }).strict(),
  ]),
  approvedAt: timestamp,
}).strict()

export const approvedUserSelectionSchema = approvedSelectionCoreSchema.extend({
  selectionHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { selectionHash, ...core } = value
  if (hashSkillValue(core) !== selectionHash) context.addIssue({ code: 'custom', message: 'Approved user selection hash is stale or forged.' })
})

const approvedReferenceImageCoreSchema = z.object({
  schemaVersion: z.literal('approved_reference_image_v1'), ownerUserId: safeId,
  workspaceId: safeId, projectId: safeId, editSessionId: safeId,
  assignmentId: safeId, targetId: safeId, imageArtifactRef: editSkillArtifactReferenceSchema,
  imageSha256: skillSha256Schema, rightsApproved: z.literal(true), privacyApproved: z.literal(true),
  useAuthorizedForTargetGrounding: z.literal(true), approvedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.imageArtifactRef.sha256 !== value.imageSha256 || value.imageArtifactRef.ownerUserId !== value.ownerUserId || value.imageArtifactRef.workspaceId !== value.workspaceId || value.imageArtifactRef.projectId !== value.projectId) {
    context.addIssue({ code: 'custom', message: 'Reference image lacks exact checksum-bound tenant authority.' })
  }
})

export const approvedReferenceImageSchema = approvedReferenceImageCoreSchema.extend({
  approvalHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { approvalHash, ...core } = value
  if (hashSkillValue(core) !== approvalHash) context.addIssue({ code: 'custom', message: 'Approved reference image hash is stale or forged.' })
})

const approvedBrushMaskCoreSchema = z.object({
  schemaVersion: z.literal('approved_brush_mask_v1'), ownerUserId: safeId,
  workspaceId: safeId, projectId: safeId, editSessionId: safeId,
  assignmentId: safeId, targetId: safeId, frameIndex: z.number().int().nonnegative(),
  maskArtifactRef: editSkillArtifactReferenceSchema, maskSha256: skillSha256Schema,
  width: z.number().int().positive(), height: z.number().int().positive(),
  coordinateSpace: z.literal('source_pixels'), approvedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (value.maskArtifactRef.sha256 !== value.maskSha256 || value.maskArtifactRef.ownerUserId !== value.ownerUserId || value.maskArtifactRef.workspaceId !== value.workspaceId || value.maskArtifactRef.projectId !== value.projectId) {
    context.addIssue({ code: 'custom', message: 'Brush mask lacks exact checksum-bound tenant authority.' })
  }
})

export const approvedBrushMaskSchema = approvedBrushMaskCoreSchema.extend({
  approvalHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { approvalHash, ...core } = value
  if (hashSkillValue(core) !== approvalHash) context.addIssue({ code: 'custom', message: 'Approved brush mask hash is stale or forged.' })
})

const priorTrackRepairEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('prior_track_repair_evidence_v1'), ownerUserId: safeId,
  workspaceId: safeId, projectId: safeId, editSessionId: safeId,
  assignmentHash: skillSha256Schema, planHash: skillSha256Schema,
  trackGraphRef: editSkillArtifactReferenceSchema, trackId: safeId,
  repairCount: z.number().int().min(0).max(2),
  priorRepairReceiptRefs: z.array(editSkillArtifactReferenceSchema).max(2),
  failureEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
}).strict()

export const priorTrackRepairEvidenceSchema = priorTrackRepairEvidenceCoreSchema.extend({
  evidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { evidenceHash, ...core } = value
  if (hashSkillValue(core) !== evidenceHash) context.addIssue({ code: 'custom', message: 'Prior repair evidence hash is stale or forged.' })
})

const planCoreSchema = z.object({
  schemaVersion: z.literal('track_all_plan_v1'), planId: safeId, assignmentId: safeId, assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema, targetHash: skillSha256Schema, authorizedRange: skillFrameRangeSchema,
  decision: z.enum(TRACK_ALL_DECISIONS), requestedJobType: skillIdentitySchema,
  dependencySkillKey: skillIdentitySchema.optional(), requiredDependencyArtifactType: skillIdentitySchema.optional(), requiredForPhase: skillIdentitySchema.optional(),
  selectedRouteKey: skillIdentitySchema,
  routeQualificationReceiptHash: skillSha256Schema,
  blockedRouteKey: skillIdentitySchema.optional(),
  blockedRouteReceiptHash: skillSha256Schema.optional(),
  missingRouteGateKeys: z.array(skillIdentitySchema).max(100),
  preflightObservationHash: skillSha256Schema.optional(),
  samRuntimeProfileHash: skillSha256Schema,
  preflightDerivedRisks: z.object({
    targetSpeed: unit,
    targetSizeRisk: unit,
    occlusionRisk: unit,
    cameraMotionRisk: unit,
    expectedRepairRisk: unit,
    expectedRepairAttempts: z.number().int().min(0).max(1),
    expectedRepairCredits: z.number().int().nonnegative(),
  }).strict().optional(),
  shotPlan: z.object({ shotBoundaries: z.array(z.number().int().nonnegative()).max(10_000), shotResetRequired: z.boolean() }).strict(),
  chunkPlan: z.object({ maximumFramesPerChunk: z.number().int().positive(), chunks: z.array(z.object({ chunkId: safeId, range: skillFrameRangeSchema, overlapFramesBefore: z.number().int().nonnegative(), overlapFramesAfter: z.number().int().nonnegative() }).strict()).max(1_000) }).strict(),
  objectBudget: z.object({ expectedObjects: z.number().int().nonnegative(), maximumObjects: z.number().int().positive(), bucketSize: z.number().int().positive().max(128), bucketCount: z.number().int().nonnegative(), sessionCount: z.number().int().nonnegative() }).strict(),
  initializationFrame: z.number().int().nonnegative().optional(), propagationDirection: z.enum(['none', 'forward', 'backward', 'both']),
  samWorkPlanned: z.boolean(), visibleTreatmentPlanned: z.boolean(), privateOutputRequired: z.literal(true), outsideAuthorizedRangeModified: z.literal(false),
  maximumAttempts: z.number().int().min(1).max(3), maximumRepairs: z.number().int().min(0).max(2),
  timeEstimate: z.object({ minimumSeconds: z.number().int().nonnegative(), expectedSeconds: z.number().int().nonnegative(), maximumSeconds: z.number().int().nonnegative() }).strict(),
  creditEstimate: z.object({ minimumCredits: z.number().int().nonnegative(), expectedCredits: z.number().int().nonnegative(), maximumCredits: z.number().int().nonnegative(), internalToolCostOnly: z.literal(true) }).strict(),
  routeDisposition: z.enum(['selected', 'time_ceiling', 'credit_ceiling', 'dependency', 'authority', 'ambiguity', 'route_blocked', 'no_action']),
  planningQaReportHash: skillSha256Schema, planningQaPassed: z.boolean(),
}).strict().superRefine((value, context) => {
  const dependencyDecision = ['needs_visual_intelligence', 'needs_preflight_observation', 'needs_track_graph'].includes(value.decision)
  if (dependencyDecision !== Boolean(value.dependencySkillKey && value.requiredDependencyArtifactType && value.requiredForPhase)) context.addIssue({ code: 'custom', message: 'Track All dependency decision is incoherent.' })
  const nonExecutable = ['use_no_tracking', 'needs_visual_intelligence', 'needs_preflight_observation', 'needs_track_graph', 'needs_route_qualification', 'blocked_external_sam_prerequisites', 'needs_user_selection', 'needs_range_expansion', 'needs_manual_keyframe', 'needs_user_confirmation', 'target_not_found', 'multiple_targets_ambiguous', 'identity_uncertain', 'privacy_coverage_blocked', 'blocked'].includes(value.decision)
  if (nonExecutable) {
    if (
      value.samWorkPlanned || value.visibleTreatmentPlanned ||
      value.chunkPlan.chunks.length !== 0 || value.objectBudget.expectedObjects !== 0 ||
      value.objectBudget.bucketCount !== 0 || value.objectBudget.sessionCount !== 0 ||
      value.initializationFrame !== undefined || value.propagationDirection !== 'none' ||
      Object.values(value.timeEstimate).some((estimate) => estimate !== 0) ||
      value.creditEstimate.minimumCredits !== 0 || value.creditEstimate.expectedCredits !== 0 ||
      value.creditEstimate.maximumCredits !== 0
    ) context.addIssue({ code: 'custom', message: 'Non-executable Track All decision contains work, timing, or cost.' })
  }
  if (value.samWorkPlanned && (value.objectBudget.sessionCount < 1 || value.propagationDirection === 'none' || value.initializationFrame === undefined)) context.addIssue({ code: 'custom', message: 'SAM plan lacks exact session authority.' })
  if (value.samWorkPlanned && (!value.preflightObservationHash || !value.preflightDerivedRisks)) context.addIssue({ code: 'custom', message: 'SAM plan lacks measured preflight authority.' })
  const routeBlocked = value.decision === 'needs_route_qualification' || value.decision === 'blocked_external_sam_prerequisites'
  if (routeBlocked !== Boolean(value.blockedRouteKey && value.blockedRouteReceiptHash && value.missingRouteGateKeys.length > 0)) context.addIssue({ code: 'custom', message: 'Track All blocked-route lineage is incoherent.' })
  if (value.routeDisposition === 'route_blocked' !== routeBlocked) context.addIssue({ code: 'custom', message: 'Track All route-blocked disposition is incoherent.' })
  const chunkedDecision = value.samWorkPlanned || value.decision === 'track_planar_region' ||
    value.decision === 'produce_track_graph'
  if (!nonExecutable && chunkedDecision && value.chunkPlan.chunks.length === 0) context.addIssue({ code: 'custom', message: 'Chunked Track All plan lacks bounded chunks.' })
  if (value.objectBudget.expectedObjects === 0 ? value.objectBudget.bucketCount !== 0 : value.objectBudget.bucketCount !== Math.ceil(value.objectBudget.expectedObjects / value.objectBudget.bucketSize)) context.addIssue({ code: 'custom', message: 'Track All multiplex bucket count is incoherent.' })
  if (value.samWorkPlanned && value.objectBudget.sessionCount !== value.chunkPlan.chunks.length * value.objectBudget.bucketCount) context.addIssue({ code: 'custom', message: 'Track All SAM session count is incoherent.' })
  if (!value.samWorkPlanned && value.objectBudget.sessionCount !== 0) context.addIssue({ code: 'custom', message: 'Non-SAM plan cannot reserve SAM sessions.' })
  if (value.visibleTreatmentPlanned !== ['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(value.decision)) context.addIssue({ code: 'custom', message: 'Visible-treatment authority contradicts the plan decision.' })
  if (value.timeEstimate.minimumSeconds > value.timeEstimate.expectedSeconds || value.timeEstimate.expectedSeconds > value.timeEstimate.maximumSeconds || value.creditEstimate.minimumCredits > value.creditEstimate.expectedCredits || value.creditEstimate.expectedCredits > value.creditEstimate.maximumCredits) context.addIssue({ code: 'custom', message: 'Track All estimate bounds are incoherent.' })
  for (const chunk of value.chunkPlan.chunks) {
    if (!isRangeContained(chunk.range, value.authorizedRange)) context.addIssue({ code: 'custom', message: `Track All chunk ${chunk.chunkId} exceeds write authority.` })
  }
  if (value.decision === 'use_no_tracking' && value.routeDisposition !== 'no_action') context.addIssue({ code: 'custom', message: 'No-action decision lacks a no-action disposition.' })
  if (value.routeDisposition === 'time_ceiling' || value.routeDisposition === 'credit_ceiling') {
    if (!['needs_user_confirmation', 'blocked'].includes(value.decision)) context.addIssue({ code: 'custom', message: 'Ceiling fallback did not produce a fail-closed decision.' })
  }
})

export const trackAllPlanSchema = planCoreSchema.extend({ planHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { planHash, ...core } = value
  if (hashSkillValue(core) !== planHash) context.addIssue({ code: 'custom', message: 'Track All plan hash is stale or forged.' })
})

export function createTrackAllPlan(input: z.input<typeof planCoreSchema>) {
  const core = planCoreSchema.parse(input)
  return trackAllPlanSchema.parse({ ...core, planHash: hashSkillValue(core) })
}

const planningQaCoreSchema = z.object({
  schemaVersion: z.literal('track_all_planning_qa_report_v1'), assignmentHash: skillSha256Schema,
  targetHash: skillSha256Schema, manifestRef: skillManifestReferenceSchema,
  findings: z.array(skillQaFindingSchema).min(1).max(100), passed: z.boolean(), createdAt: timestamp,
}).strict().superRefine((value, context) => {
  const derived = !value.findings.some((finding) => finding.disposition === 'blocking' || finding.disposition === 'critical')
  if (value.passed !== derived) context.addIssue({ code: 'custom', message: 'Planning QA verdict is not derived from findings.' })
})

export const trackAllPlanningQaReportSchema = planningQaCoreSchema.extend({ reportHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { reportHash, ...core } = value
  if (hashSkillValue(core) !== reportHash) context.addIssue({ code: 'custom', message: 'Planning QA report hash is stale or forged.' })
})

export function createTrackAllPlanningQaReport(input: z.input<typeof planningQaCoreSchema>) {
  const core = planningQaCoreSchema.parse(input)
  return trackAllPlanningQaReportSchema.parse({ ...core, reportHash: hashSkillValue(core) })
}

const resultCoreSchema = z.object({
  schemaVersion: z.literal('track_all_result_receipt_v1'), resultId: safeId, assignmentId: safeId,
  assignmentHash: skillSha256Schema, planHash: skillSha256Schema, manifestRef: skillManifestReferenceSchema,
  decision: z.enum(TRACK_ALL_DECISIONS), authorizedRange: skillFrameRangeSchema,
  acceptedArtifactRefs: z.array(editSkillArtifactReferenceSchema).max(100), qaEvidenceHashes: z.array(skillSha256Schema).max(100),
  outsideAuthorizedRangeModified: z.literal(false), anonymousIdentitiesOnly: z.literal(true), privateArtifactsOnly: z.literal(true),
  status: z.enum(['accepted', 'accepted_with_conservative_mask', 'needs_refinement', 'needs_manual_keyframe', 'needs_visual_intelligence', 'needs_user_selection', 'needs_user_confirmation', 'needs_range_expansion', 'target_not_found', 'multiple_targets_ambiguous', 'identity_uncertain', 'privacy_coverage_blocked', 'unsupported_target', 'blocked', 'failed', 'use_no_tracking']),
}).strict()

export const trackAllResultReceiptSchema = resultCoreSchema.extend({ receiptHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { receiptHash, ...core } = value
  if (hashSkillValue(core) !== receiptHash) context.addIssue({ code: 'custom', message: 'Track All result receipt hash is stale or forged.' })
})

export function createTrackAllResultReceipt(input: z.input<typeof resultCoreSchema>) {
  const core = resultCoreSchema.parse(input)
  return trackAllResultReceiptSchema.parse({ ...core, receiptHash: hashSkillValue(core) })
}

export type TrackAllAssignment = z.infer<typeof trackAllAssignmentSchema>
export type TrackAllTargetSpecification = z.infer<typeof trackAllTargetSpecificationSchema>
export type TrackAllPlan = z.infer<typeof trackAllPlanSchema>
export type TrackAllPlanningQaReport = z.infer<typeof trackAllPlanningQaReportSchema>

export function registerTrackAllArtifactSchemas(registry: EditSkillArtifactSchemaRegistry): void {
  const schemas: Record<string, z.ZodType> = {
    track_all_assignment_v1: trackAllAssignmentSchema,
    track_all_target_specification_v1: trackAllTargetSpecificationSchema,
    track_all_preflight_observation_v1: trackAllPreflightObservationSchema,
    track_all_sam3_1_runtime_profile_v2: trackAllSam31RuntimeProfileV2Schema,
    track_all_scene_context_v1: trackAllSceneContextSchema,
    source_frame_authority_v1: sourceFrameAuthoritySchema,
    visual_intelligence_target_evidence_v1: visualIntelligenceTargetEvidenceSchema,
    visual_intelligence_tracking_qa_v1: visualIntelligenceTrackingQaSchema,
    privacy_policy_snapshot_v1: privacyPolicySnapshotSchema,
    approved_user_selection_v1: approvedUserSelectionSchema,
    approved_reference_image_v1: approvedReferenceImageSchema,
    approved_brush_mask_v1: approvedBrushMaskSchema,
    prior_track_repair_evidence_v1: priorTrackRepairEvidenceSchema,
    caption_reserved_zones_v1: trackAllCaptionReservedZonesSchema,
    track_all_plan_v1: trackAllPlanSchema,
    track_all_planning_qa_report_v1: trackAllPlanningQaReportSchema,
    track_all_result_receipt_v1: trackAllResultReceiptSchema,
    track_graph_v1: trackGraphV1Schema,
    track_graph_v2: trackGraphV2Schema,
    track_all_context_manifest_v1: trackAllContextManifestSchema,
    track_all_work_graph_v1: trackAllWorkGraphArtifactSchema,
    track_sample_sequence_v1: trackSampleSequenceSchema,
    track_box_sequence_v1: trackBoxSequenceSchema,
    track_mask_sequence_v1: trackMaskSequenceSchema,
    track_mask_chunk_manifest_v1: trackMaskChunkManifestSchema,
    track_landmark_sequence_v1: trackLandmarkSequenceSchema,
    track_anchor_graph_v1: trackAnchorGraphSchema,
    camera_motion_graph_v1: cameraMotionGraphSchema,
    planar_track_graph_v1: planarTrackGraphSchema,
    track_occlusion_event_log_v1: trackOcclusionEventLogSchema,
    track_identity_lineage_v1: trackIdentityLineageSchema,
    tracked_redaction_plan_v1: trackedRedactionPlanSchema,
    tracked_redaction_result_v1: trackedRedactionResultSchema,
    tracked_focus_plan_v1: trackedFocusPlanSchema,
    tracked_focus_result_v1: trackedFocusResultSchema,
    tracked_reframe_plan_v1: trackedReframePlanSchema,
    tracked_reframe_result_v1: trackedReframeResultSchema,
    track_all_target_qa_report_v1: trackAllTargetQaReportSchema,
    track_all_temporal_qa_report_v1: trackAllTemporalQaReportSchema,
    track_all_mask_qa_report_v1: trackAllMaskQaReportSchema,
    track_all_privacy_qa_report_v1: trackAllPrivacyQaReportSchema,
    track_all_chunk_seam_qa_report_v1: trackAllChunkSeamQaReportSchema,
    track_all_identity_qa_report_v1: trackAllIdentityQaReportSchema,
    track_all_integration_qa_report_v1: trackAllIntegrationQaReportSchema,
    track_all_repair_receipt_v1: trackAllRepairReceiptSchema,
    track_all_cross_skill_handoff_v1: trackAllCrossSkillHandoffSchema,
    track_all_atomic_execution_evidence_v1: trackAllAtomicExecutionEvidenceSchema,
    track_all_public_work_projection_evidence_v1:
      trackAllPublicWorkProjectionEvidenceSchema,
  }
  for (const [artifactType, schema] of Object.entries(schemas)) {
    if (!registry.has(artifactType)) registry.register(artifactType, schema)
  }
}
