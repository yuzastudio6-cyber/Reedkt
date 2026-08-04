import { z } from 'zod'

import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../core/skill-capability-manifest-schema'

export const trackGraphV1Schema = z.object({
  schemaVersion: z.literal('track_graph_v1'),
  modelNeutral: z.literal(true),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  authorizedRange: z.object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    fps: z.number().int().min(1).max(120),
  }).strict(),
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
    value.tracks.some((track) =>
      track.endFrameExclusive <= track.startFrameInclusive ||
      track.startFrameInclusive < value.authorizedRange.startFrameInclusive ||
      track.endFrameExclusive > value.authorizedRange.endFrameExclusive)
  ) context.addIssue({ code: 'custom', message: 'Track graph assignment range authority is invalid.' })
})

export type TrackGraphV1 = z.infer<typeof trackGraphV1Schema>
