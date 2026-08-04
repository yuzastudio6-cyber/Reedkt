import { z } from 'zod'

import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import { skillQaFindingSchema } from '../core/skill-qa-registry'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)
const normalizedBox = z.object({ x: unit, y: unit, width: unit, height: unit }).strict().superRefine((value, context) => {
  if (value.width <= 0 || value.height <= 0 || value.x + value.width > 1 || value.y + value.height > 1) {
    context.addIssue({ code: 'custom', message: 'Normalized Track All box exceeds the source frame.' })
  }
})
const point = z.object({ x: unit, y: unit }).strict()
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

function frameInside(frameIndex: number, range: z.infer<typeof skillFrameRangeSchema>): boolean {
  return frameIndex >= range.startFrameInclusive && frameIndex < range.endFrameExclusive
}

function strictlyIncreasingUnique(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || value > values[index - 1]!)
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
}).strict()).superRefine((value, context) => {
  const frames = value.samples.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Track sample sequence exceeds or reorders its authorized range.' })
  }
})

export const trackBoxSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_box_sequence_v1'), ...lineageFields, trackId: safeId,
  boxes: z.array(z.object({ frameIndex: z.number().int().nonnegative(), box: normalizedBox, confidence: unit }).strict()).min(1).max(100_000),
}).strict()).superRefine((value, context) => {
  const frames = value.boxes.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Track box sequence exceeds or reorders its authorized range.' })
  }
})

export const trackMaskChunkManifestSchema = addressed(z.object({
  schemaVersion: z.literal('track_mask_chunk_manifest_v1'), ...lineageFields,
  trackId: safeId, chunkId: safeId, chunkRange: skillFrameRangeSchema,
  privateObjectRef: editSkillArtifactReferenceSchema, frameCount: z.number().int().positive(),
  pixelFormat: z.enum(['gray8', 'gray16']), width: z.number().int().positive(), height: z.number().int().positive(),
  publicUrlPresent: z.literal(false),
}).strict()).superRefine((value, context) => {
  if (
    value.chunkRange.fps !== value.authorizedRange.fps ||
    value.chunkRange.startFrameInclusive < value.authorizedRange.startFrameInclusive ||
    value.chunkRange.endFrameExclusive > value.authorizedRange.endFrameExclusive ||
    value.frameCount !== value.chunkRange.endFrameExclusive - value.chunkRange.startFrameInclusive
  ) context.addIssue({ code: 'custom', message: 'Track mask chunk exceeds its authorized range or frame count.' })
})

export const trackMaskSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_mask_sequence_v1'), ...lineageFields, trackId: safeId,
  chunkRefs: z.array(typedRef('track_mask_chunk_manifest_v1')).min(1).max(10_000),
  privateBinaryOnly: z.literal(true), publicMaskPublished: z.literal(false),
}).strict())

export const trackLandmarkSequenceSchema = addressed(z.object({
  schemaVersion: z.literal('track_landmark_sequence_v1'), ...lineageFields, trackId: safeId,
  landmarkKind: z.enum(['face', 'body', 'hand', 'planar_corners']),
  frames: z.array(z.object({ frameIndex: z.number().int().nonnegative(), points: z.array(point.extend({ confidence: unit }).strict()).min(1).max(1_000) }).strict()).min(1).max(100_000),
}).strict()).superRefine((value, context) => {
  const frames = value.frames.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Track landmark sequence exceeds or reorders its authorized range.' })
  }
})

export const trackAnchorGraphSchema = addressed(z.object({
  schemaVersion: z.literal('track_anchor_graph_v1'), ...lineageFields,
  anchors: z.array(z.object({ anchorId: safeId, trackId: safeId, frameIndex: z.number().int().nonnegative(), point, visibility: z.enum(['visible', 'occluded', 'lost']), confidence: unit }).strict()).min(1).max(100_000),
}).strict()).superRefine((value, context) => {
  if (value.anchors.some((anchor) => !frameInside(anchor.frameIndex, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Track anchor graph exceeds its authorized range.' })
  }
})

export const cameraMotionGraphSchema = addressed(z.object({
  schemaVersion: z.literal('camera_motion_graph_v1'), ...lineageFields,
  transforms: z.array(z.object({ frameIndex: z.number().int().nonnegative(), motion: z.enum(['static', 'pan', 'tilt', 'zoom', 'roll', 'handheld']), frameToFrameTransform: matrix3x3, stabilizedTransform: matrix3x3, confidence: unit, discontinuityWarning: z.boolean(), shotReset: z.boolean() }).strict()).min(1).max(100_000),
}).strict()).superRefine((value, context) => {
  const frames = value.transforms.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Camera motion graph exceeds or reorders its authorized range.' })
  }
})

export const planarTrackGraphSchema = addressed(z.object({
  schemaVersion: z.literal('planar_track_graph_v1'), ...lineageFields,
  surfaceId: safeId, surfaceClass: z.enum(['phone_screen', 'laptop_screen', 'television', 'sign', 'document', 'whiteboard', 'wall', 'window', 'picture_frame', 'billboard', 'selected_planar_area']),
  frames: z.array(z.object({ frameIndex: z.number().int().nonnegative(), corners: z.tuple([point, point, point, point]), homography: matrix3x3, reprojectionError: z.number().nonnegative(), visibility: unit, occlusion: unit, surfaceStability: unit, confidence: unit }).strict()).min(1).max(100_000),
  coordinateInterpretation: z.enum(['camera_relative', 'world_relative']),
}).strict()).superRefine((value, context) => {
  const frames = value.frames.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Planar track graph exceeds or reorders its authorized range.' })
  }
})

export const trackOcclusionEventLogSchema = addressed(z.object({
  schemaVersion: z.literal('track_occlusion_event_log_v1'), ...lineageFields,
  events: z.array(z.object({ eventId: safeId, trackId: safeId, startFrameInclusive: z.number().int().nonnegative(), endFrameExclusive: z.number().int().positive(), state: z.enum(['partial_occlusion', 'full_occlusion', 'left_frame', 'reentry_candidate', 'reacquired', 'lost', 'shot_reset']), confidence: unit, evidenceHashes: z.array(skillSha256Schema).min(1).max(100) }).strict()).max(100_000),
}).strict()).superRefine((value, context) => {
  if (value.events.some((event) =>
    event.endFrameExclusive <= event.startFrameInclusive ||
    event.startFrameInclusive < value.authorizedRange.startFrameInclusive ||
    event.endFrameExclusive > value.authorizedRange.endFrameExclusive
  )) context.addIssue({ code: 'custom', message: 'Track occlusion event exceeds its authorized range.' })
})

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
}).strict()).superRefine((value, context) => {
  if (value.handoffs.some((handoff) =>
    handoff.range.fps !== value.authorizedRange.fps ||
    handoff.range.startFrameInclusive < value.authorizedRange.startFrameInclusive ||
    handoff.range.endFrameExclusive > value.authorizedRange.endFrameExclusive
  )) context.addIssue({ code: 'custom', message: 'Tracked focus handoff exceeds its authorized range.' })
})

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
}).strict()).superRefine((value, context) => {
  const frames = value.frames.map((sample) => sample.frameIndex)
  if (!strictlyIncreasingUnique(frames) || frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Tracked reframe plan exceeds or reorders its authorized range.' })
  }
})

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

const crossSkillGeometryPayloadSchema = z.discriminatedUnion('handoffKind', [
  z.object({
    handoffKind: z.literal('b_roll'),
    speakerSafeTrackIds: z.array(safeId).max(100),
    insetSafeRegionStrategy: z.literal('avoid_active_primary_subject_bounds'),
    cropGuidance: z.literal('use_track_graph_v1_or_v2_authorized_geometry'),
  }).strict(),
  z.object({
    handoffKind: z.literal('captions'),
    foregroundTrackIds: z.array(safeId).max(1_000),
    behindSubjectTrackIds: z.array(safeId).max(1_000),
    faceSafeTrackIds: z.array(safeId).max(1_000),
    occlusionOrderPolicy: z.literal('captions_resolve_design_track_all_supplies_geometry'),
  }).strict(),
  z.object({
    handoffKind: z.literal('graphic_design'),
    stableAnchorIds: z.array(safeId).max(10_000),
    leaderLinePolicy: z.literal('anchor_to_visible_track_only'),
    objectTrajectoryAvailable: z.boolean(),
  }).strict(),
  z.object({
    handoffKind: z.literal('living_frame'),
    subjectTrackIds: z.array(safeId).max(1_000),
    depthOrderTrackIds: z.array(safeId).max(1_000),
    foregroundOccluderTrackIds: z.array(safeId).max(1_000),
    cameraTransformAvailable: z.boolean(),
  }).strict(),
  z.object({
    handoffKind: z.literal('three_d'),
    planarSurfaceIds: z.array(safeId).max(1_000),
    occlusionTrackIds: z.array(safeId).max(1_000),
    cameraTransformAvailable: z.boolean(),
    scaleCuePolicy: z.literal('derive_from_planar_and_camera_geometry'),
  }).strict(),
  z.object({
    handoffKind: z.literal('color'),
    selectiveColorTrackIds: z.array(safeId).max(1_000),
    skinProtectionTrackIds: z.array(safeId).max(1_000),
    finalSelectiveColorOwnedByTrackAll: z.literal(false),
  }).strict(),
  z.object({
    handoffKind: z.literal('sound'),
    interactionFrames: z.array(z.number().int().nonnegative()).max(100_000),
    enterExitFrames: z.array(z.number().int().nonnegative()).max(100_000),
    movementCueFrames: z.array(z.number().int().nonnegative()).max(100_000),
    finalSoundOwnedByTrackAll: z.literal(false),
  }).strict(),
  z.object({
    handoffKind: z.literal('transition'),
    foregroundOccluderTrackIds: z.array(safeId).max(1_000),
    naturalWipeCandidateFrames: z.array(z.number().int().nonnegative()).max(100_000),
    sceneBoundaryFrames: z.array(z.number().int().nonnegative()).max(10_000),
    finalTransitionOwnedByTrackAll: z.literal(false),
  }).strict(),
  z.object({
    handoffKind: z.literal('render'),
    layerOrder: z.tuple([
      z.literal('source'), z.literal('track_all_treatment'),
      z.literal('peer_visuals'), z.literal('captions'),
    ]),
    exactFrameRangeRequired: z.literal(true),
    privateMaskResolutionRequired: z.literal(true),
    finalRenderOwnedByTrackAll: z.literal(false),
  }).strict(),
])

export const trackAllCrossSkillHandoffSchema = addressed(z.object({
  schemaVersion: z.literal('track_all_cross_skill_handoff_v1'), ...lineageFields,
  consumerSkillKey: z.enum(['b_roll', 'captions', 'graphic_design', 'living_frame', 'three_d', 'color', 'sound', 'transition', 'render']),
  trackGraphV1Ref: typedRef('track_graph_v1').optional(), trackGraphV2Ref: typedRef('track_graph_v2'),
  maskRefs: z.array(typedRef('track_mask_sequence_v1')).max(1_000), anchorGraphRefs: z.array(typedRef('track_anchor_graph_v1')).max(1_000),
  cameraMotionRef: typedRef('camera_motion_graph_v1').optional(), planarTrackRefs: z.array(typedRef('planar_track_graph_v1')).max(1_000),
  geometryPayload: crossSkillGeometryPayloadSchema,
  geometryOnly: z.literal(true), finalPeerDesignOwnedByTrackAll: z.literal(false),
}).strict()).superRefine((value, context) => {
  if (value.consumerSkillKey !== value.geometryPayload.handoffKind) {
    context.addIssue({ code: 'custom', message: 'Cross-skill handoff consumer and geometry payload differ.' })
  }
  const refs = [
    value.trackGraphV1Ref, value.trackGraphV2Ref, value.cameraMotionRef,
    ...value.maskRefs, ...value.anchorGraphRefs, ...value.planarTrackRefs,
  ].filter(Boolean) as z.infer<typeof editSkillArtifactReferenceSchema>[]
  if (refs.some((ref) =>
    ref.ownerUserId !== value.ownerUserId || ref.workspaceId !== value.workspaceId ||
    ref.projectId !== value.projectId)) {
    context.addIssue({ code: 'custom', message: 'Cross-skill handoff contains a cross-tenant reference.' })
  }
  const frames = value.geometryPayload.handoffKind === 'sound'
    ? [
        ...value.geometryPayload.interactionFrames,
        ...value.geometryPayload.enterExitFrames,
        ...value.geometryPayload.movementCueFrames,
      ]
    : value.geometryPayload.handoffKind === 'transition'
      ? [
          ...value.geometryPayload.naturalWipeCandidateFrames,
          ...value.geometryPayload.sceneBoundaryFrames,
        ]
      : []
  if (frames.some((frame) => !frameInside(frame, value.authorizedRange))) {
    context.addIssue({ code: 'custom', message: 'Cross-skill handoff frame exceeds its authorized range.' })
  }
})
