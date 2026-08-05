import { z } from 'zod'

import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../../core/skill-assignment-schema'
import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../core/skill-capability-manifest-schema'
import type { SkillFrameRange } from '../../core/skill-assignment-types'

const scopedAuthorityFields = {
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  editPlanVersion: z.number().int().positive(),
  manifestRef: skillManifestReferenceSchema,
} as const

export const sourceInventoryCandidateSchema = z.object({
  sourceId: z.string().trim().min(1).max(180),
  sourceType: z.enum([
    'existing_project_clip',
    'approved_user_asset',
    'uploaded_video_for_edit',
    'reference_image',
  ]),
  providerImageRole: z.enum(['first_frame', 'reference']).optional(),
  artifactRef: editSkillArtifactReferenceSchema,
  sourceRange: skillFrameRangeSchema.optional(),
  semanticRelevance: z.number().min(0).max(1),
  visualQuality: z.number().min(0).max(1),
  temporalFit: z.number().min(0).max(1),
  storyContinuity: z.number().min(0).max(1),
  provenanceVerified: z.boolean(),
  rightsApproved: z.boolean(),
  privacyApproved: z.boolean(),
  proofSafe: z.boolean(),
  repetitionRisk: z.number().min(0).max(1),
  cropFeasibility: z.number().min(0).max(1),
  speakerActionProtection: z.number().min(0).max(1),
  audioUsefulness: z.number().min(0).max(1),
  costCredits: z.number().int().nonnegative(),
  approvedByUser: z.boolean(),
}).strict().superRefine((value, context) => {
  if ((value.sourceType === 'reference_image') !== Boolean(value.providerImageRole)) {
    context.addIssue({
      code: 'custom',
      message: 'Only reference-image candidates require an exact Gemini first-frame or reference role.',
    })
  }
})

export type SourceInventoryCandidate = z.infer<typeof sourceInventoryCandidateSchema>

const sourceInventoryCoreSchema = z.object({
  schemaVersion: z.literal('source_inventory_v1'),
  ...scopedAuthorityFields,
  candidates: z.array(sourceInventoryCandidateSchema).max(1_000),
}).strict().superRefine((value, context) => {
  const sourceIds = value.candidates.map((candidate) => candidate.sourceId)
  const sourceHashes = value.candidates.map((candidate) => candidate.artifactRef.sha256)
  if (new Set(sourceIds).size !== sourceIds.length) {
    context.addIssue({ code: 'custom', message: 'Source inventory contains duplicate source identities.' })
  }
  if (new Set(sourceHashes).size !== sourceHashes.length) {
    context.addIssue({ code: 'custom', message: 'Source inventory contains ambiguous duplicate source artifacts.' })
  }
  if (value.candidates.some((candidate) =>
    candidate.artifactRef.ownerUserId !== value.ownerUserId ||
    candidate.artifactRef.workspaceId !== value.workspaceId ||
    candidate.artifactRef.projectId !== value.projectId)) {
    context.addIssue({ code: 'custom', message: 'Source inventory contains a cross-tenant candidate.' })
  }
})

export const sourceInventorySchema = sourceInventoryCoreSchema.extend({
  inventoryHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { inventoryHash, ...core } = value
  if (hashSkillValue(core) !== inventoryHash) {
    context.addIssue({ code: 'custom', message: 'Source inventory hash is stale or forged.' })
  }
})

export type SourceInventory = z.infer<typeof sourceInventorySchema>

export function createSourceInventory(
  input: z.input<typeof sourceInventoryCoreSchema>,
): SourceInventory {
  const core = sourceInventoryCoreSchema.parse(input)
  return sourceInventorySchema.parse({ ...core, inventoryHash: hashSkillValue(core) })
}

const masterTimingPlanCoreSchema = z.object({
  schemaVersion: z.literal('master_timing_plan_v1'),
  ...scopedAuthorityFields,
  fps: z.number().int().min(1).max(120),
  timelineRange: skillFrameRangeSchema,
  assignmentRange: skillFrameRangeSchema,
}).strict().superRefine((value, context) => {
  if (
    value.fps !== value.timelineRange.fps ||
    value.fps !== value.assignmentRange.fps ||
    value.assignmentRange.startFrameInclusive < value.timelineRange.startFrameInclusive ||
    value.assignmentRange.endFrameExclusive > value.timelineRange.endFrameExclusive
  ) context.addIssue({
    code: 'custom',
    message: 'Master timing authority does not contain the assignment range at one FPS.',
  })
})

export const masterTimingPlanSchema = masterTimingPlanCoreSchema.extend({
  timingHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { timingHash, ...core } = value
  if (hashSkillValue(core) !== timingHash) {
    context.addIssue({ code: 'custom', message: 'Master timing authority hash is stale or forged.' })
  }
})

export type MasterTimingPlan = z.infer<typeof masterTimingPlanSchema>

export function createMasterTimingPlan(
  input: z.input<typeof masterTimingPlanCoreSchema>,
): MasterTimingPlan {
  const core = masterTimingPlanCoreSchema.parse(input)
  return masterTimingPlanSchema.parse({ ...core, timingHash: hashSkillValue(core) })
}

export const visualOwnershipWindowSchema = z.object({
  ownerSkillKey: z.string().trim().min(1).max(180),
  ownership: z.enum(['primary', 'support']),
  exclusive: z.boolean(),
  frameRange: skillFrameRangeSchema,
  lockedEvidenceFootage: z.boolean(),
  deliberateHeroVisual: z.boolean(),
  captionSafeAreaReserved: z.boolean(),
  transitionBoundaryOwned: z.boolean(),
}).strict()

const visualOwnershipManifestCoreSchema = z.object({
  schemaVersion: z.literal('visual_ownership_manifest_v1'),
  ...scopedAuthorityFields,
  assignmentRange: skillFrameRangeSchema,
  requestedOwnership: z.enum(['primary', 'support']),
  ownershipWindows: z.array(visualOwnershipWindowSchema).max(10_000),
}).strict().superRefine((value, context) => {
  if (value.ownershipWindows.some((window) =>
    window.frameRange.fps !== value.assignmentRange.fps ||
    window.frameRange.endFrameExclusive <= window.frameRange.startFrameInclusive)) {
    context.addIssue({ code: 'custom', message: 'Visual ownership window has invalid frame authority.' })
  }
})

export const visualOwnershipManifestSchema = visualOwnershipManifestCoreSchema.extend({
  ownershipHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { ownershipHash, ...core } = value
  if (hashSkillValue(core) !== ownershipHash) {
    context.addIssue({ code: 'custom', message: 'Visual ownership manifest hash is stale or forged.' })
  }
})

export type VisualOwnershipManifest = z.infer<typeof visualOwnershipManifestSchema>

export function createVisualOwnershipManifest(
  input: z.input<typeof visualOwnershipManifestCoreSchema>,
): VisualOwnershipManifest {
  const core = visualOwnershipManifestCoreSchema.parse(input)
  return visualOwnershipManifestSchema.parse({ ...core, ownershipHash: hashSkillValue(core) })
}

const captionReservedZonesCoreSchema = z.object({
  schemaVersion: z.literal('caption_reserved_zones_v1'),
  ownerUserId: z.string().trim().min(1).max(240),
  workspaceId: z.string().trim().min(1).max(240),
  projectId: z.string().trim().min(1).max(240),
  editSessionId: z.string().trim().min(1).max(240),
  assignmentId: z.string().trim().min(1).max(240),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  zones: z.array(z.object({
    zoneId: z.string().trim().min(1).max(240),
    frameRange: skillFrameRangeSchema,
    xMillionths: z.number().int().min(0).max(1_000_000),
    yMillionths: z.number().int().min(0).max(1_000_000),
    widthMillionths: z.number().int().positive().max(1_000_000),
    heightMillionths: z.number().int().positive().max(1_000_000),
    finalOwner: z.literal('captions'),
  }).strict()).max(10_000),
  readOnly: z.literal(true),
}).strict()

export const captionReservedZonesV1Schema = captionReservedZonesCoreSchema.extend({
  zonesHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { zonesHash, ...core } = value
  if (hashSkillValue(core) !== zonesHash) {
    context.addIssue({ code: 'custom', message: 'Caption reserved zones hash is stale or forged.' })
  }
})

export type CaptionReservedZonesV1 = z.infer<typeof captionReservedZonesV1Schema>

export function createCaptionReservedZonesV1(
  input: z.input<typeof captionReservedZonesCoreSchema>,
): CaptionReservedZonesV1 {
  const core = captionReservedZonesCoreSchema.parse(input)
  return captionReservedZonesV1Schema.parse({ ...core, zonesHash: hashSkillValue(core) })
}

export function frameRangesOverlap(left: SkillFrameRange, right: SkillFrameRange): boolean {
  return left.fps === right.fps &&
    left.startFrameInclusive < right.endFrameExclusive &&
    right.startFrameInclusive < left.endFrameExclusive
}
