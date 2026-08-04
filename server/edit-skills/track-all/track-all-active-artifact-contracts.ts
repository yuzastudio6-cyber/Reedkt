import { z } from 'zod'

import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import { skillQaFindingSchema } from '../core/skill-qa-registry'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)
const normalizedBox = z.object({ x: unit, y: unit, width: unit, height: unit }).strict()
const point = z.object({ x: z.number(), y: z.number() }).strict()
const matrix3x3 = z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])
const typedRef = (artifactType: string) => editSkillArtifactReferenceSchema.extend({ artifactType: z.literal(artifactType) }).strict()

const lineageFields = {
  ownerUserId: safeId, workspaceId: safeId, projectId: safeId, editSessionId: safeId,
  assignmentId: safeId, assignmentHash: skillSha256Schema, planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema, sourceSha256: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
} as const

function addressed<T extends z.ZodRawShape>(core: z.ZodObject<T>) {
  return core.extend({ artifactHash: skillSha256Schema }).strict().superRefine((value, context) => {
    const record = value as Readonly<Record<string, unknown>>
    const artifactHash = record.artifactHash
    const content = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'artifactHash'))
    if (hashSkillValue(content) !== artifactHash) context.addIssue({ code: 'custom', message: 'Track All artifact hash is stale or forged.' })
  })
}

export const trackAllContextManifestSchema = addressed(z.object({
  schemaVersion: z.literal('track_all_context_manifest_v1'), ...lineageFields,
  assignmentRef: typedRef('track_all_assignment_v1'), targetRef: typedRef('track_all_target_specification_v1'),
  sourceInventoryRef: typedRef('source_inventory_v1'), timingRef: typedRef('master_timing_plan_v1'),
  sourceFrameAuthorityRef: typedRef('source_frame_authority_v1'), ownershipRef: typedRef('visual_ownership_manifest_v1'),
  sceneContextRef: typedRef('track_all_scene_context_v1'), readOnlyContext: z.literal(true),
}).strict())

export const trackAllWorkGraphArtifactSchema = addressed(z.object({
  schemaVersion: z.literal('track_all_work_graph_v1'), ...lineageFields,
  approvedSnapshotHash: skillSha256Schema, planningQaReportHash: skillSha256Schema,
  workItemHashes: z.array(skillSha256Schema).min(1).max(10_000),
  dependencyRequestHashes: z.array(skillSha256Schema).max(100),
  callerSelectedExecutableAllowed: z.literal(false), outsideAuthorizedRangeModified: z.literal(false),
}).strict())

export const trackSampleSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_sample_sequence_v1'), ...lineageFields, trackId: safeId,
  samples: z.array(z.object({ frameIndex: z.number().int().nonnegative(), confidence: unit, visibility: z.enum(['active', 'partially_occluded', 'fully_occluded', 'lost', 'reacquired', 'identity_uncertain']) }).strict()).min(1).max(100_000),
}).strict())

export const trackBoxSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_box_sequence_v1'), ...lineageFields, trackId: safeId,
  boxes: z.array(z.object({ frameIndex: z.number().int().nonnegative(), box: normalizedBox, confidence: unit }).strict()).min(1).max(100_000),
}).strict())

export const trackMaskChunkManifestSchema = addressed(z.object({
  schemaVersion: z.literal('track_mask_chunk_manifest_v1'), ...lineageFields,
  trackId: safeId, chunkId: safeId, chunkRange: skillFrameRangeSchema,
  privateObjectRef: editSkillArtifactReferenceSchema, frameCount: z.number().int().positive(),
  pixelFormat: z.enum(['gray8', 'gray16']), width: z.number().int().positive(), height: z.number().int().positive(),
  publicUrlPresent: z.literal(false),
}).strict())

export const trackMaskSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_mask_sequence_v1'), ...lineageFields, trackId: safeId,
  chunkRefs: z.array(typedRef('track_mask_chunk_manifest_v1')).min(1).max(10_000),
  privateBinaryOnly: z.literal(true), publicMaskPublished: z.literal(false),
}).strict())

export const trackLandmarkSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_landmark_sequence_v1'), ...lineageFields, trackId: safeId,
  landmarkKind: z.enum(['face', 'body', 'hand', 'planar_corners']),
  frames: z.array(z.object({ frameIndex: z.number().int().nonnegative(), points: z.array(point.extend({ confidence: unit }).strict()).min(1).max(1_000) }).strict()).min(1).max(100_000),
}).strict())

export const trackAnchorGraphSchema = addressed(z.object({
  schemaVersion: z.literal('track_anchor_graph_v1'), ...lineageFields,
  anchors: z.array(z.object({ anchorId: safeId, trackId: safeId, frameIndex: z.number().int().nonnegative(), point, visibility: z.enum(['visible', 'occluded', 'lost']), confidence: unit }).strict()).min(1).max(100_000),
}).strict())

export const cameraMotionGraphSchema = addressed(z.object({
  schemaVersion: z.literal('camera_motion_graph_v1'), ...lineageFields,
  transforms: z.array(z.object({ frameIndex: z.number().int().nonnegative(), motion: z.enum(['static', 'pan', 'tilt', 'zoom', 'roll', 'handheld']), frameToFrameTransform: matrix3x3, stabilizedTransform: matrix3x3, confidence: unit, discontinuityWarning: z.boolean(), shotReset: z.boolean() }).strict()).min(1).max(100_000),
}).strict())

export const planarTrackGraphSchema = addressed(z.object({
  schemaVersion: z.literal('planar_track_graph_v1'), ...lineageFields,
  surfaceId: safeId, surfaceClass: z.enum(['phone_screen', 'laptop_screen', 'television', 'sign', 'document', 'whiteboard', 'wall', 'window', 'picture_frame', 'billboard', 'selected_planar_area']),
  frames: z.array(z.object({ frameIndex: z.number().int().nonnegative(), corners: z.tuple([point, point, point, point]), homography: matrix3x3, reprojectionError: z.number().nonnegative(), visibility: unit, occlusion: unit, surfaceStability: unit, confidence: unit }).strict()).min(1).max(100_000),
  coordinateInterpretation: z.enum(['camera_relative', 'world_relative']),
}).strict())

export const trackOcclusionEventLogSchema = addressed(z.object({
  schemaVersion: z.literal('track_occlusion_event_log_v1'), ...lineageFields,
  events: z.array(z.object({ eventId: safeId, trackId: safeId, startFrameInclusive: z.number().int().nonnegative(), endFrameExclusive: z.number().int().positive(), state: z.enum(['partial_occlusion', 'full_occlusion', 'left_frame', 'reentry_candidate', 'reacquired', 'lost', 'shot_reset']), confidence: unit, evidenceHashes: z.array(skillSha256Schema).min(1).max(100) }).strict()).max(100_000),
}).strict())

export const trackIdentityLineageSchema = addressed(z.object({
  schemaVersion: z.literal('track_identity_lineage_v1'), ...lineageFields,
  identities: z.array(z.object({ anonymousTrackId: safeId, parentTrackId: safeId.optional(), childTrackIds: z.array(safeId).max(1_000), state: z.enum(['active', 'partially_occluded', 'fully_occluded', 'lost', 'reacquisition_candidate', 'reacquired', 'identity_uncertain', 'terminated_at_shot_boundary', 'manually_reassigned']), evidenceHashes: z.array(skillSha256Schema).min(1).max(100), crossShotCertain: z.literal(false) }).strict()).min(1).max(10_000),
}).strict())

const treatmentLineage = { ...lineageFields, trackGraphRef: typedRef('track_graph_v2') } as const

export const trackedRedactionPlanSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_redaction_plan_v1'), ...treatmentLineage,
  treatment: z.enum(['gaussian_blur', 'pixelate', 'mosaic', 'solid_fill', 'conservative_region_cover', 'tracked_crop_exclusion']),
  targetTrackIds: z.array(safeId).min(1).max(10_000), uncertaintyBehavior: z.literal('conservative_cover_and_review'), flattenedPreviewRequired: z.literal(true),
}).strict())

export const trackedRedactionResultSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_redaction_result_v1'), ...treatmentLineage,
  planRef: typedRef('tracked_redaction_plan_v1'), privateMediaRef: editSkillArtifactReferenceSchema,
  privacyQaRef: typedRef('track_all_privacy_qa_report_v1'), noSensitiveExposure: z.literal(true), publicArtifact: z.literal(false),
}).strict())

export const trackedFocusPlanSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_focus_plan_v1'), ...treatmentLineage,
  treatment: z.enum(['subject_sharp_background_soft', 'subject_normal_background_dim', 'tracked_spotlight', 'tracked_vignette', 'tracked_magnification', 'foreground_softening', 'background_softening', 'simple_subject_outline']),
  handoffs: z.array(z.object({ trackId: safeId, range: skillFrameRangeSchema }).strict()).min(1).max(1_000),
}).strict())

export const trackedFocusResultSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_focus_result_v1'), ...treatmentLineage,
  planRef: typedRef('tracked_focus_plan_v1'), privatePreviewRef: editSkillArtifactReferenceSchema,
  integrationQaRef: typedRef('track_all_integration_qa_report_v1'), publicArtifact: z.literal(false),
}).strict())

export const trackedReframePlanSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_reframe_plan_v1'), ...treatmentLineage,
  outputAspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']), maximumZoom: z.number().min(1).max(4),
  frames: z.array(z.object({ frameIndex: z.number().int().nonnegative(), crop: normalizedBox, priorityTrackIds: z.array(safeId).min(1).max(100), headroom: unit, leadRoom: unit, safeZoneCollision: z.boolean(), confidence: unit }).strict()).min(1).max(100_000),
  lowConfidenceBehavior: z.enum(['hold_last_safe_crop', 'widen_crop', 'manual_review']),
}).strict())

export const trackedReframeResultSchema = addressed(z.object({
  schemaVersion: z.literal('tracked_reframe_result_v1'), ...treatmentLineage,
  planRef: typedRef('tracked_reframe_plan_v1'), trajectoryHash: skillSha256Schema,
  integrationQaRef: typedRef('track_all_integration_qa_report_v1'), finalRenderOwnedByTrackAll: z.literal(false),
}).strict())

function qaReportSchema<const V extends string, T extends z.ZodRawShape>(schemaVersion: V, metrics: T) {
  return addressed(z.object({
    schemaVersion: z.literal(schemaVersion), ...lineageFields,
    findings: z.array(skillQaFindingSchema).min(1).max(1_000),
    disposition: z.enum(['pass', 'warning', 'needs_review', 'blocking', 'critical']),
    ...metrics,
  }).strict())
}

export const trackAllTargetQaReportSchema = qaReportSchema('track_all_target_qa_report_v1', { correctTarget: z.boolean(), exclusionsPreserved: z.boolean(), expectedCountRespected: z.boolean() })
export const trackAllTemporalQaReportSchema = qaReportSchema('track_all_temporal_qa_report_v1', { missingSpanCount: z.number().int().nonnegative(), jumpCount: z.number().int().nonnegative(), shotResetsValid: z.boolean() })
export const trackAllMaskQaReportSchema = qaReportSchema('track_all_mask_qa_report_v1', { coverageMinimum: unit, leakageMaximum: unit, flickerMaximum: unit, motionBlurCovered: z.boolean() })
export const trackAllPrivacyQaReportSchema = qaReportSchema('track_all_privacy_qa_report_v1', { sensitiveExposureDetected: z.literal(false), lostTrackWindowsCovered: z.literal(true), reflectionsInspected: z.literal(true), flattenedPreviewRef: editSkillArtifactReferenceSchema })
export const trackAllChunkSeamQaReportSchema = qaReportSchema('track_all_chunk_seam_qa_report_v1', { seamCount: z.number().int().nonnegative(), uncertainSeamCount: z.number().int().nonnegative(), maximumSeamError: z.number().nonnegative() })
export const trackAllIdentityQaReportSchema = qaReportSchema('track_all_identity_qa_report_v1', { silentIdentitySwitchDetected: z.literal(false), uncertainIdentityCount: z.number().int().nonnegative(), shotResetCount: z.number().int().nonnegative() })
export const trackAllIntegrationQaReportSchema = qaReportSchema('track_all_integration_qa_report_v1', { outsideAuthorizedRangeModified: z.literal(false), sourceAndTimingExact: z.literal(true), privateOutput: z.literal(true), publicUrlPresent: z.literal(false), layerOrderValid: z.boolean() })

export const trackAllRepairReceiptSchema = addressed(z.object({
  schemaVersion: z.literal('track_all_repair_receipt_v1'), ...lineageFields,
  priorTrackGraphRef: typedRef('track_graph_v2'), repairIndex: z.number().int().min(1).max(2),
  action: z.enum(['add_positive_point', 'add_negative_point', 'add_box', 'change_initialization_frame', 'split_target', 'merge_track', 'reassign_identity', 'expand_privacy_mask', 'local_segment_retrack', 'reacquire_after_occlusion', 'increase_overlap', 'recalculate_homography', 'request_manual_keyframe', 'request_user_selection']),
  repairedRange: skillFrameRangeSchema, evidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  result: z.enum(['accepted', 'accepted_with_conservative_mask', 'needs_refinement', 'needs_manual_keyframe', 'needs_user_selection', 'identity_uncertain', 'privacy_coverage_blocked', 'blocked']),
}).strict())

export const trackAllCrossSkillHandoffSchema = addressed(z.object({
  schemaVersion: z.literal('track_all_cross_skill_handoff_v1'), ...lineageFields,
  consumerSkillKey: z.enum(['b_roll', 'captions', 'graphic_design', 'real_motion', 'color', 'sound', 'transition', 'render']),
  trackGraphV1Ref: typedRef('track_graph_v1').optional(), trackGraphV2Ref: typedRef('track_graph_v2'),
  maskRefs: z.array(typedRef('track_mask_sequence_v1')).max(1_000), anchorGraphRefs: z.array(typedRef('track_anchor_graph_v1')).max(1_000),
  cameraMotionRef: typedRef('camera_motion_graph_v1').optional(), planarTrackRefs: z.array(typedRef('planar_track_graph_v1')).max(1_000),
  geometryOnly: z.literal(true), finalPeerDesignOwnedByTrackAll: z.literal(false),
}).strict())
