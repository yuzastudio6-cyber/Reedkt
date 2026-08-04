import { z } from 'zod'

import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillIdentitySchema, skillManifestReferenceSchema, skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../../core/skill-assignment-schema'

/** Frozen model-neutral compatibility contract consumed by B-Roll. */
export const trackGraphV1Schema = z.object({
  schemaVersion: z.literal('track_graph_v1'),
  modelNeutral: z.literal(true),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  authorizedRangeHash: skillSha256Schema,
  sourceSha256: skillSha256Schema,
  fps: z.number().int().min(1).max(120),
  tracks: z.array(z.object({
    trackId: z.string().trim().min(1).max(180),
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    samplesArtifactHash: skillSha256Schema,
  }).strict()).max(10_000),
}).strict().superRefine((value, context) => {
  if (
    value.authorizedRange.endFrameExclusive <= value.authorizedRange.startFrameInclusive ||
    value.authorizedRangeHash !== hashSkillValue(value.authorizedRange) ||
    value.fps !== value.authorizedRange.fps ||
    value.tracks.some((track) => track.endFrameExclusive <= track.startFrameInclusive || track.startFrameInclusive < value.authorizedRange.startFrameInclusive || track.endFrameExclusive > value.authorizedRange.endFrameExclusive)
  ) context.addIssue({ code: 'custom', message: 'Track graph assignment range authority is invalid.' })
})

export type TrackGraphV1 = z.infer<typeof trackGraphV1Schema>

const anonymousTrackId = z.string().regex(/^(?:person|face|vehicle|license_plate|phone_screen|object|region|surface|target)_[0-9]{3,6}$/u)
const visibilitySpanSchema = z.object({ startFrameInclusive: z.number().int().nonnegative(), endFrameExclusive: z.number().int().positive(), state: z.enum(['active', 'partially_occluded', 'fully_occluded', 'lost', 'reacquisition_candidate', 'reacquired', 'identity_uncertain', 'terminated_at_shot_boundary', 'manually_reassigned']) }).strict()
const graphArtifactRefSchema = editSkillArtifactReferenceSchema

const trackGraphV2CoreSchema = z.object({
  schemaVersion: z.literal('track_graph_v2'),
  modelNeutral: z.literal(true),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  sourceId: z.string().trim().min(1).max(180),
  sourceSha256: skillSha256Schema,
  timingHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  authorizedRangeHash: skillSha256Schema,
  shots: z.array(z.object({ shotId: z.string().trim().min(1).max(180), range: skillFrameRangeSchema, sceneCutResetsIdentity: z.literal(true) }).strict()).max(10_000),
  chunks: z.array(z.object({ chunkId: z.string().trim().min(1).max(180), range: skillFrameRangeSchema, overlapRange: skillFrameRangeSchema.optional(), bucketIndex: z.number().int().nonnegative(), attemptRefHash: skillSha256Schema.optional() }).strict()).max(10_000),
  cameraMotionRef: graphArtifactRefSchema.optional(),
  targets: z.array(z.object({
    targetId: z.string().trim().min(1).max(180), targetType: skillIdentitySchema,
    semanticClass: skillIdentitySchema, includeRules: z.array(z.string().trim().min(1).max(300)).max(100),
    excludeRules: z.array(z.string().trim().min(1).max(300)).max(100), privacyClass: skillIdentitySchema,
    groundingEvidenceHashes: z.array(skillSha256Schema).min(1).max(100), expectedMinimumCount: z.number().int().nonnegative(),
    expectedMaximumCount: z.number().int().positive(), ambiguityState: z.enum(['none', 'multiple_candidates', 'uncertain']),
  }).strict()).min(1).max(1_000),
  tracks: z.array(z.object({
    trackId: anonymousTrackId, targetId: z.string().trim().min(1).max(180), semanticClass: skillIdentitySchema,
    parentTrackId: anonymousTrackId.optional(), childTrackIds: z.array(anonymousTrackId).max(1_000),
    startFrameInclusive: z.number().int().nonnegative(), endFrameExclusive: z.number().int().positive(),
    visibilitySpans: z.array(visibilitySpanSchema).min(1).max(10_000),
    boxSequenceRef: graphArtifactRefSchema, maskSequenceRef: graphArtifactRefSchema.optional(),
    landmarkSequenceRef: graphArtifactRefSchema.optional(), anchorGraphRef: graphArtifactRefSchema.optional(),
    planarGeometryRef: graphArtifactRefSchema.optional(), confidenceSequenceHash: skillSha256Schema,
    occlusionEventLogRef: graphArtifactRefSchema.optional(), reentryEventHashes: z.array(skillSha256Schema).max(1_000),
    identitySwitchWarnings: z.array(z.object({ frameIndex: z.number().int().nonnegative(), confidence: z.number().min(0).max(1), evidenceHash: skillSha256Schema }).strict()).max(1_000),
    depthOrder: z.number().int(), qaRefs: z.array(graphArtifactRefSchema).max(100), repairRefs: z.array(graphArtifactRefSchema).max(10),
  }).strict()).max(10_000),
  stitchingEvidenceHashes: z.array(skillSha256Schema).max(10_000),
  cameraNormalizationEvidenceHash: skillSha256Schema,
  uncertaintyEventHashes: z.array(skillSha256Schema).max(10_000),
  objectBudget: z.object({ maximumObjects: z.number().int().positive().max(128), bucketSize: z.literal(16), bucketCount: z.number().int().positive().max(8), sessionCount: z.number().int().nonnegative() }).strict(),
  runtimeAttemptRefs: z.array(graphArtifactRefSchema).max(10_000),
  finalQaRefs: z.array(graphArtifactRefSchema).min(1).max(100),
  privateMaskDataPublished: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.authorizedRangeHash !== hashSkillValue(value.authorizedRange)) context.addIssue({ code: 'custom', message: 'Track Graph V2 range hash is invalid.' })
  const targetIds = new Set(value.targets.map((target) => target.targetId))
  const trackIds = new Set(value.tracks.map((track) => track.trackId))
  if (targetIds.size !== value.targets.length || trackIds.size !== value.tracks.length) context.addIssue({ code: 'custom', message: 'Track Graph V2 target and track IDs must be unique.' })
  for (const track of value.tracks) {
    if (!targetIds.has(track.targetId) || track.startFrameInclusive < value.authorizedRange.startFrameInclusive || track.endFrameExclusive > value.authorizedRange.endFrameExclusive || track.endFrameExclusive <= track.startFrameInclusive || (track.parentTrackId && !trackIds.has(track.parentTrackId)) || track.childTrackIds.some((id) => !trackIds.has(id))) context.addIssue({ code: 'custom', message: `Track ${track.trackId} has invalid range, target, or lineage.` })
    const refs = [track.boxSequenceRef, track.maskSequenceRef, track.landmarkSequenceRef, track.anchorGraphRef, track.planarGeometryRef, track.occlusionEventLogRef, ...track.qaRefs, ...track.repairRefs].filter(Boolean) as z.infer<typeof graphArtifactRefSchema>[]
    if (refs.some((ref) => ref.ownerUserId !== value.ownerUserId || ref.workspaceId !== value.workspaceId || ref.projectId !== value.projectId)) context.addIssue({ code: 'custom', message: `Track ${track.trackId} contains a cross-tenant reference.` })
  }
  if (value.objectBudget.bucketCount !== Math.max(1, Math.ceil(value.objectBudget.maximumObjects / 16))) context.addIssue({ code: 'custom', message: 'Track Graph V2 multiplex bucket budget is incoherent.' })
})

export const trackGraphV2Schema = trackGraphV2CoreSchema.extend({ graphHash: skillSha256Schema }).strict().superRefine((value, context) => {
  const { graphHash, ...core } = value
  if (hashSkillValue(core) !== graphHash) context.addIssue({ code: 'custom', message: 'Track Graph V2 hash is stale or forged.' })
})

export type TrackGraphV2 = z.infer<typeof trackGraphV2Schema>

export function createTrackGraphV2(input: z.input<typeof trackGraphV2CoreSchema>): TrackGraphV2 {
  const core = trackGraphV2CoreSchema.parse(input)
  return trackGraphV2Schema.parse({ ...core, graphHash: hashSkillValue(core) })
}

export function projectTrackGraphV1(input: TrackGraphV2): TrackGraphV1 {
  const graph = trackGraphV2Schema.parse(input)
  return trackGraphV1Schema.parse({
    schemaVersion: 'track_graph_v1', modelNeutral: true,
    ownerUserId: graph.ownerUserId, workspaceId: graph.workspaceId, projectId: graph.projectId,
    assignmentId: graph.assignmentId, assignmentHash: graph.assignmentHash,
    authorizedRange: graph.authorizedRange, authorizedRangeHash: graph.authorizedRangeHash,
    sourceSha256: graph.sourceSha256, fps: graph.authorizedRange.fps,
    tracks: graph.tracks.map((track) => ({
      trackId: track.trackId, startFrameInclusive: track.startFrameInclusive,
      endFrameExclusive: track.endFrameExclusive,
      samplesArtifactHash: track.boxSequenceRef.sha256,
    })),
  })
}
