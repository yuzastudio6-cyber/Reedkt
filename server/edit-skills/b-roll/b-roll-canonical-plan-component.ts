import { z } from 'zod'

import type { AuthorityJsonBlobRef } from '../../services/private-edit-authority-store'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import type { SkillQualificationReceipt } from '../core/skill-qualification-receipt'
import type {
  BrollPlanArtifact,
  BrollPlanningContext,
  BrollSkillAssignment,
} from './b-roll-contracts'
import type { BrollCanonicalWorkGraph } from './b-roll-work-graph-compiler'

export const CANONICAL_BROLL_SKILL_COMPONENT_KEY = 'bRollSkill' as const
export const CANONICAL_BROLL_SKILL_COMPONENT_VERSION =
  'canonical-b-roll-skill-plan-component-v1' as const

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const componentCoreSchema = z.object({
  schemaVersion: z.literal(CANONICAL_BROLL_SKILL_COMPONENT_VERSION),
  ownerUserId: z.string().trim().min(1).max(180),
  workspaceId: z.string().trim().min(1).max(180),
  projectId: z.string().trim().min(1).max(180),
  editSessionId: z.string().trim().min(1).max(180),
  manifestRef: skillManifestReferenceSchema.superRefine((ref, context) => {
    if (ref.skillKey !== 'b_roll') context.addIssue({ code: 'custom', message: 'Canonical B-roll component requires skillKey b_roll.' })
  }),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  contextHash: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  assignmentArtifactRef: blobRefSchema,
  contextArtifactRef: blobRefSchema,
  planArtifactRef: blobRefSchema,
  workGraphArtifactRef: blobRefSchema,
  qualificationReceiptArtifactRef: blobRefSchema,
  planHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  qualificationReceiptHash: skillSha256Schema,
  workItemCount: z.number().int().positive().max(32),
  providerWorkPlanned: z.boolean(),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const canonicalBrollSkillPlanComponentSchema = componentCoreSchema.extend({
  componentHash: skillSha256Schema,
}).strict().superRefine((component, context) => {
  const { componentHash, ...core } = component
  if (hashSkillValue(core) !== componentHash) {
    context.addIssue({ code: 'custom', message: 'Canonical B-roll component hash is stale or forged.' })
  }
})

export type CanonicalBrollSkillPlanComponent = z.infer<
  typeof canonicalBrollSkillPlanComponentSchema
>

export function createCanonicalBrollSkillPlanComponent(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  workGraph: BrollCanonicalWorkGraph
  qualificationReceipt: SkillQualificationReceipt
  assignmentArtifactRef: AuthorityJsonBlobRef
  contextArtifactRef: AuthorityJsonBlobRef
  planArtifactRef: AuthorityJsonBlobRef
  workGraphArtifactRef: AuthorityJsonBlobRef
  qualificationReceiptArtifactRef: AuthorityJsonBlobRef
}): CanonicalBrollSkillPlanComponent {
  if (
    input.plan.assignmentId !== input.assignment.assignmentId ||
    input.plan.assignmentHash !== input.assignment.assignmentHash ||
    input.context.assignmentId !== input.assignment.assignmentId ||
    input.context.ownerUserId !== input.assignment.ownerUserId ||
    input.context.workspaceId !== input.assignment.workspaceId ||
    input.context.projectId !== input.assignment.projectId ||
    input.workGraph.assignmentId !== input.assignment.assignmentId ||
    input.workGraph.assignmentHash !== input.assignment.assignmentHash ||
    hashSkillValue(input.plan.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(input.workGraph.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(input.qualificationReceipt.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(input.plan.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange) ||
    hashSkillValue(input.workGraph.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange) ||
    !['planning_qualified', 'internal_execution_qualified', 'production_qualified']
      .includes(input.qualificationReceipt.qualificationStatus)
  ) throw new Error('Canonical B-roll component lineage is stale or under-qualified.')
  const core = componentCoreSchema.parse({
    schemaVersion: CANONICAL_BROLL_SKILL_COMPONENT_VERSION,
    ownerUserId: input.assignment.ownerUserId,
    workspaceId: input.assignment.workspaceId,
    projectId: input.assignment.projectId,
    editSessionId: input.assignment.editSessionId,
    manifestRef: input.assignment.manifestRef,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.assignment.assignmentHash,
    contextHash: input.context.contextHash,
    authorizedRange: input.assignment.writeRangeAuthority.authorizedRange,
    assignmentArtifactRef: input.assignmentArtifactRef,
    contextArtifactRef: input.contextArtifactRef,
    planArtifactRef: input.planArtifactRef,
    workGraphArtifactRef: input.workGraphArtifactRef,
    qualificationReceiptArtifactRef: input.qualificationReceiptArtifactRef,
    planHash: input.plan.planHash,
    workGraphHash: input.workGraph.workGraphHash,
    qualificationReceiptHash: input.qualificationReceipt.receiptHash,
    workItemCount: input.workGraph.workItems.length,
    providerWorkPlanned: input.plan.providerRequestPlanned,
    outsideAuthorizedRangeModified: false,
  })
  return canonicalBrollSkillPlanComponentSchema.parse({
    ...core,
    componentHash: hashSkillValue(core),
  })
}

export function assertCanonicalBrollSkillComponentScope(input: {
  component?: CanonicalBrollSkillPlanComponent
  expected: { ownerUserId?: string; workspaceId: string; projectId: string; editSessionId: string }
}): void {
  if (!input.component) return
  const component = canonicalBrollSkillPlanComponentSchema.parse(input.component)
  if (
    component.workspaceId !== input.expected.workspaceId ||
    component.projectId !== input.expected.projectId ||
    component.editSessionId !== input.expected.editSessionId ||
    (input.expected.ownerUserId && component.ownerUserId !== input.expected.ownerUserId)
  ) throw new Error('Canonical B-roll component scope does not match the plan authority.')
}

export function assertCanonicalBrollComponentRefPropagation(input: {
  planComponentRefs: Record<string, AuthorityJsonBlobRef>
  snapshotComponentRefs: Record<string, AuthorityJsonBlobRef>
  executionPackageComponentRefs?: Record<string, AuthorityJsonBlobRef>
}): void {
  const refs = [
    input.planComponentRefs[CANONICAL_BROLL_SKILL_COMPONENT_KEY],
    input.snapshotComponentRefs[CANONICAL_BROLL_SKILL_COMPONENT_KEY],
    input.executionPackageComponentRefs?.[CANONICAL_BROLL_SKILL_COMPONENT_KEY],
  ]
  if (refs.every((ref) => ref === undefined)) return
  const requiredRefs = input.executionPackageComponentRefs ? refs : refs.slice(0, 2)
  if (requiredRefs.some((ref) => ref === undefined)) {
    throw new Error('Canonical B-roll component reference was dropped from immutable lineage.')
  }
  const [expected, ...actual] = requiredRefs as AuthorityJsonBlobRef[]
  if (actual.some((ref) =>
    ref.sha256 !== expected.sha256 || ref.byteLength !== expected.byteLength)) {
    throw new Error('Canonical B-roll component reference changed across immutable lineage.')
  }
}
