import { z } from 'zod'

import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import { editSkillArtifactReferenceSchema } from '../core/skill-assignment-schema'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import {
  createMasterTimingPlan,
  createSourceInventory,
  createVisualOwnershipManifest,
  frameRangesOverlap,
  masterTimingPlanSchema,
  sourceInventorySchema,
  visualOwnershipManifestSchema,
  visualOwnershipWindowSchema,
  type MasterTimingPlan,
  type SourceInventory,
  type VisualOwnershipManifest,
} from '../shared/assignment-authorities'
import type { BrollPlanningContext } from './b-roll-contracts'
import {
  brollPlanningContextCoreSchema,
  brollPlanningContextSchema,
} from './b-roll-schemas'

/** @deprecated Import `sourceInventorySchema` from the shared authority owner. */
export const brollSourceInventorySchema = sourceInventorySchema
/** @deprecated Import `SourceInventory` from the shared authority owner. */
export type BrollSourceInventory = SourceInventory
/** @deprecated Import `createSourceInventory` from the shared authority owner. */
export const createBrollSourceInventory = createSourceInventory

/** @deprecated Import `masterTimingPlanSchema` from the shared authority owner. */
export const brollMasterTimingPlanSchema = masterTimingPlanSchema
/** @deprecated Import `MasterTimingPlan` from the shared authority owner. */
export type BrollMasterTimingPlan = MasterTimingPlan
/** @deprecated Import `createMasterTimingPlan` from the shared authority owner. */
export const createBrollMasterTimingPlan = createMasterTimingPlan

/** @deprecated Import `visualOwnershipWindowSchema` from the shared authority owner. */
export const brollVisualOwnershipWindowSchema = visualOwnershipWindowSchema
/** @deprecated Import `visualOwnershipManifestSchema` from the shared authority owner. */
export const brollVisualOwnershipManifestSchema = visualOwnershipManifestSchema
/** @deprecated Import `VisualOwnershipManifest` from the shared authority owner. */
export type BrollVisualOwnershipManifest = VisualOwnershipManifest
/** @deprecated Import `createVisualOwnershipManifest` from the shared authority owner. */
export const createBrollVisualOwnershipManifest = createVisualOwnershipManifest
/** @deprecated Import `frameRangesOverlap` from the shared authority owner. */
export { frameRangesOverlap }

function typedArtifactReference(artifactType: string) {
  return editSkillArtifactReferenceSchema.extend({ artifactType: z.literal(artifactType) }).strict()
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
