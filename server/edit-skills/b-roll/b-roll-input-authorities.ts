import { z } from 'zod'

import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import type { SkillFrameRange } from '../core/skill-assignment-types'
import type { BrollPlanningContext } from './b-roll-contracts'
import {
  brollPlanningContextCoreSchema,
  brollPlanningContextSchema,
  brollSourceCandidateSchema,
} from './b-roll-schemas'

const scopedAuthorityFields = {
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  assignmentId: z.string().trim().min(1).max(180),
  editPlanVersion: z.number().int().positive(),
  manifestRef: skillManifestReferenceSchema,
} as const

function typedArtifactReference(artifactType: string) {
  return editSkillArtifactReferenceSchema.extend({ artifactType: z.literal(artifactType) }).strict()
}

const sourceInventoryCoreSchema = z.object({
  schemaVersion: z.literal('source_inventory_v1'),
  ...scopedAuthorityFields,
  candidates: z.array(brollSourceCandidateSchema).max(1_000),
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

export const brollSourceInventorySchema = sourceInventoryCoreSchema.extend({
  inventoryHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { inventoryHash, ...core } = value
  if (hashSkillValue(core) !== inventoryHash) {
    context.addIssue({ code: 'custom', message: 'Source inventory hash is stale or forged.' })
  }
})

export type BrollSourceInventory = z.infer<typeof brollSourceInventorySchema>

export function createBrollSourceInventory(
  input: z.input<typeof sourceInventoryCoreSchema>,
): BrollSourceInventory {
  const core = sourceInventoryCoreSchema.parse(input)
  return brollSourceInventorySchema.parse({ ...core, inventoryHash: hashSkillValue(core) })
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
  ) context.addIssue({ code: 'custom', message: 'Master timing authority does not contain the assignment range at one FPS.' })
})

export const brollMasterTimingPlanSchema = masterTimingPlanCoreSchema.extend({
  timingHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { timingHash, ...core } = value
  if (hashSkillValue(core) !== timingHash) {
    context.addIssue({ code: 'custom', message: 'Master timing authority hash is stale or forged.' })
  }
})

export type BrollMasterTimingPlan = z.infer<typeof brollMasterTimingPlanSchema>

export function createBrollMasterTimingPlan(
  input: z.input<typeof masterTimingPlanCoreSchema>,
): BrollMasterTimingPlan {
  const core = masterTimingPlanCoreSchema.parse(input)
  return brollMasterTimingPlanSchema.parse({ ...core, timingHash: hashSkillValue(core) })
}

export const brollVisualOwnershipWindowSchema = z.object({
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
  ownershipWindows: z.array(brollVisualOwnershipWindowSchema).max(10_000),
}).strict().superRefine((value, context) => {
  if (value.ownershipWindows.some((window) =>
    window.frameRange.fps !== value.assignmentRange.fps ||
    window.frameRange.endFrameExclusive <= window.frameRange.startFrameInclusive)) {
    context.addIssue({ code: 'custom', message: 'Visual ownership window has invalid frame authority.' })
  }
})

export const brollVisualOwnershipManifestSchema = visualOwnershipManifestCoreSchema.extend({
  ownershipHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { ownershipHash, ...core } = value
  if (hashSkillValue(core) !== ownershipHash) {
    context.addIssue({ code: 'custom', message: 'Visual ownership manifest hash is stale or forged.' })
  }
})

export type BrollVisualOwnershipManifest = z.infer<typeof brollVisualOwnershipManifestSchema>

export function createBrollVisualOwnershipManifest(
  input: z.input<typeof visualOwnershipManifestCoreSchema>,
): BrollVisualOwnershipManifest {
  const core = visualOwnershipManifestCoreSchema.parse(input)
  return brollVisualOwnershipManifestSchema.parse({ ...core, ownershipHash: hashSkillValue(core) })
}

const publicContextManifestCoreSchema = brollPlanningContextCoreSchema.extend({
  contextHash: skillSha256Schema,
  editSessionId: z.string().trim().min(1).max(180),
  editPlanVersion: z.number().int().positive(),
  manifestRef: skillManifestReferenceSchema,
  readOnly: z.literal(true),
  assignmentRef: typedArtifactReference('b_roll_assignment_v1'),
  sourceInventoryRef: typedArtifactReference('source_inventory_v1'),
  masterTimingRef: typedArtifactReference('master_timing_plan_v1'),
  visualOwnershipRef: typedArtifactReference('visual_ownership_manifest_v1'),
}).strict().superRefine((value, context) => {
  const planningCore = Object.fromEntries(
    Object.keys(brollPlanningContextCoreSchema.shape)
      .map((key) => [key, value[key as keyof typeof value]] as const)
      .filter((entry) => entry[1] !== undefined),
  )
  if (hashSkillValue(planningCore) !== value.contextHash) {
    context.addIssue({ code: 'custom', message: 'B-roll context planning payload hash is stale or forged.' })
  }
})

export const brollPublicContextManifestSchema = publicContextManifestCoreSchema.extend({
  contextManifestHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { contextManifestHash, ...core } = value
  if (hashSkillValue(core) !== contextManifestHash) {
    context.addIssue({ code: 'custom', message: 'B-roll context authority manifest hash is stale or forged.' })
  }
})

export type BrollPublicContextManifest = z.infer<typeof brollPublicContextManifestSchema>

export function createBrollPublicContextManifest(input: {
  context: BrollPlanningContext
  editSessionId: string
  editPlanVersion: number
  manifestRef: z.input<typeof skillManifestReferenceSchema>
  assignmentRef: EditSkillArtifactReference
  sourceInventoryRef: EditSkillArtifactReference
  masterTimingRef: EditSkillArtifactReference
  visualOwnershipRef: EditSkillArtifactReference
}): BrollPublicContextManifest {
  const context = brollPlanningContextSchema.parse(input.context)
  const core = publicContextManifestCoreSchema.parse({
    ...context,
    editSessionId: input.editSessionId,
    editPlanVersion: input.editPlanVersion,
    manifestRef: input.manifestRef,
    readOnly: true,
    assignmentRef: input.assignmentRef,
    sourceInventoryRef: input.sourceInventoryRef,
    masterTimingRef: input.masterTimingRef,
    visualOwnershipRef: input.visualOwnershipRef,
  })
  return brollPublicContextManifestSchema.parse({
    ...core,
    contextManifestHash: hashSkillValue(core),
  })
}

export function planningContextFromPublicManifest(
  input: BrollPublicContextManifest,
): BrollPlanningContext {
  const parsed = brollPublicContextManifestSchema.parse(input)
  const {
    readOnly: _readOnly,
    editSessionId: _editSessionId,
    editPlanVersion: _editPlanVersion,
    manifestRef: _manifestRef,
    assignmentRef: _assignmentRef,
    sourceInventoryRef: _sourceInventoryRef,
    masterTimingRef: _masterTimingRef,
    visualOwnershipRef: _visualOwnershipRef,
    contextManifestHash: _contextManifestHash,
    ...context
  } = parsed
  void _readOnly
  void _editSessionId
  void _editPlanVersion
  void _manifestRef
  void _assignmentRef
  void _sourceInventoryRef
  void _masterTimingRef
  void _visualOwnershipRef
  void _contextManifestHash
  return brollPlanningContextSchema.parse(context)
}

export function frameRangesOverlap(left: SkillFrameRange, right: SkillFrameRange): boolean {
  return left.fps === right.fps &&
    left.startFrameInclusive < right.endFrameExclusive &&
    right.startFrameInclusive < left.endFrameExclusive
}
