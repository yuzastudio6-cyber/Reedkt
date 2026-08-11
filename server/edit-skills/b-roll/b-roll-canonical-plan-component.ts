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
import {
  assertBrollPlanningQaReport,
  type BrollPlanningQaReport,
} from './b-roll-planning-qa'
import type { BrollCanonicalWorkGraph } from './b-roll-work-graph-compiler'

export const CANONICAL_BROLL_SKILL_COMPONENT_KEY = 'bRollSkill' as const
export const CANONICAL_BROLL_SKILL_COMPONENT_VERSION =
  'canonical-b-roll-skill-plan-component-v1' as const
export const CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION =
  'canonical-b-roll-skill-plan-component-v2' as const
export const CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION =
  'canonical-b-roll-skill-plan-component-v3' as const

const blobRefSchema = z.object({
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict()

const componentV1CoreSchema = z.object({
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
  planningQaReportArtifactRef: blobRefSchema,
  workGraphArtifactRef: blobRefSchema,
  qualificationReceiptArtifactRef: blobRefSchema,
  planHash: skillSha256Schema,
  planningQaPlanEvidenceHash: skillSha256Schema,
  planningQaReportHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  qualificationReceiptHash: skillSha256Schema,
  workItemCount: z.number().int().positive().max(32),
  providerWorkPlanned: z.boolean(),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const canonicalBrollSkillPlanComponentV1Schema =
componentV1CoreSchema.extend({
  componentHash: skillSha256Schema,
}).strict().superRefine((component, context) => {
  const { componentHash, ...core } = component
  if (hashSkillValue(core) !== componentHash) {
    context.addIssue({ code: 'custom', message: 'Canonical B-roll component hash is stale or forged.' })
  }
})

const executionSourceArtifactRefSchema = z.object({
  sourceId: z.string().trim().min(1).max(180),
  artifactRef: blobRefSchema,
}).strict()

const executionAuthorityRefFields = {
  sourceInventoryArtifactRef: blobRefSchema,
  masterTimingProjectionArtifactRef: blobRefSchema,
  visualOwnershipArtifactRef: blobRefSchema,
  publicContextManifestArtifactRef: blobRefSchema,
  sourceMediaArtifactRefs: z.array(executionSourceArtifactRefSchema).max(8),
  restartSafeExecutionInputsPersisted: z.literal(true),
} as const

function validateExecutionSourceRefs(
  component: {
    sourceMediaArtifactRefs: Array<{
      sourceId: string
      artifactRef: { sha256: string }
    }>
  },
  context: z.RefinementCtx,
): void {
  const sourceIds = component.sourceMediaArtifactRefs.map((item) =>
    item.sourceId)
  const sourceHashes = component.sourceMediaArtifactRefs.map((item) =>
    item.artifactRef.sha256)
  if (new Set(sourceIds).size !== sourceIds.length) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical B-roll execution inputs repeat a source ID.',
    })
  }
  if (new Set(sourceHashes).size !== sourceHashes.length) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical B-roll execution inputs repeat a source artifact.',
    })
  }
}

const componentV2CoreSchema = componentV1CoreSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION),
  ...executionAuthorityRefFields,
}).strict().superRefine(validateExecutionSourceRefs)

export const canonicalBrollSkillPlanComponentV2Schema =
componentV2CoreSchema.extend({
  componentHash: skillSha256Schema,
}).strict().superRefine((component, context) => {
  const { componentHash, ...core } = component
  if (hashSkillValue(core) !== componentHash) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical B-roll V2 component hash is stale or forged.',
    })
  }
})

const componentV3CoreSchema = componentV1CoreSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION),
  ...executionAuthorityRefFields,
  publicAssignmentArtifactRef: blobRefSchema,
  publicPlanArtifactRef: blobRefSchema,
  publicApprovalArtifactRef: blobRefSchema,
  approvedPublicWorkGraphArtifactRef: blobRefSchema,
  restartSafePublicLifecyclePersisted: z.literal(true),
}).strict().superRefine(validateExecutionSourceRefs)

export const canonicalBrollSkillPlanComponentV3Schema =
componentV3CoreSchema.extend({
  componentHash: skillSha256Schema,
}).strict().superRefine((component, context) => {
  const { componentHash, ...core } = component
  if (hashSkillValue(core) !== componentHash) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical B-roll V3 component hash is stale or forged.',
    })
  }
})

export const canonicalBrollSkillPlanComponentSchema = z.discriminatedUnion(
  'schemaVersion', [
    canonicalBrollSkillPlanComponentV1Schema,
    canonicalBrollSkillPlanComponentV2Schema,
    canonicalBrollSkillPlanComponentV3Schema,
  ],
)

export type CanonicalBrollSkillPlanComponent = z.infer<
  typeof canonicalBrollSkillPlanComponentSchema
>
export type CanonicalBrollSkillPlanComponentV2 = z.infer<
  typeof canonicalBrollSkillPlanComponentV2Schema
>
export type CanonicalBrollSkillPlanComponentV3 = z.infer<
  typeof canonicalBrollSkillPlanComponentV3Schema
>

export function createCanonicalBrollSkillPlanComponent(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  planningQaReport: BrollPlanningQaReport
  workGraph: BrollCanonicalWorkGraph
  qualificationReceipt: SkillQualificationReceipt
  assignmentArtifactRef: AuthorityJsonBlobRef
  contextArtifactRef: AuthorityJsonBlobRef
  planArtifactRef: AuthorityJsonBlobRef
  planningQaReportArtifactRef: AuthorityJsonBlobRef
  workGraphArtifactRef: AuthorityJsonBlobRef
  qualificationReceiptArtifactRef: AuthorityJsonBlobRef
  executionAuthorityRefs?: {
    sourceInventoryArtifactRef: AuthorityJsonBlobRef
    masterTimingProjectionArtifactRef: AuthorityJsonBlobRef
    visualOwnershipArtifactRef: AuthorityJsonBlobRef
    publicContextManifestArtifactRef: AuthorityJsonBlobRef
    sourceMediaArtifactRefs: Array<{
      sourceId: string
      artifactRef: AuthorityJsonBlobRef
    }>
  }
  publicLifecycleRefs?: {
    publicAssignmentArtifactRef: AuthorityJsonBlobRef
    publicPlanArtifactRef: AuthorityJsonBlobRef
    publicApprovalArtifactRef: AuthorityJsonBlobRef
    approvedPublicWorkGraphArtifactRef: AuthorityJsonBlobRef
  }
}): CanonicalBrollSkillPlanComponent {
  const planningQaReport = assertBrollPlanningQaReport({
    report: input.planningQaReport,
    assignment: input.assignment,
    contextHash: input.context.contextHash,
    planEvidenceHash: input.plan.planningQaPlanEvidenceHash,
  })
  const reportArtifactHash = hashSkillValue(planningQaReport)
  const lineageViolations = [
    input.plan.assignmentId !== input.assignment.assignmentId && 'plan_assignment_id',
    input.plan.assignmentHash !== input.assignment.assignmentHash && 'plan_assignment_hash',
    input.context.assignmentId !== input.assignment.assignmentId && 'context_assignment_id',
    input.context.ownerUserId !== input.assignment.ownerUserId && 'context_owner',
    input.context.workspaceId !== input.assignment.workspaceId && 'context_workspace',
    input.context.projectId !== input.assignment.projectId && 'context_project',
    input.workGraph.assignmentId !== input.assignment.assignmentId && 'graph_assignment_id',
    input.workGraph.assignmentHash !== input.assignment.assignmentHash && 'graph_assignment_hash',
    hashSkillValue(input.plan.manifestRef) !== hashSkillValue(input.assignment.manifestRef) && 'plan_manifest',
    hashSkillValue(input.workGraph.manifestRef) !== hashSkillValue(input.assignment.manifestRef) && 'graph_manifest',
    hashSkillValue(input.qualificationReceipt.manifestRef) !== hashSkillValue(input.assignment.manifestRef) && 'qualification_manifest',
    hashSkillValue(input.plan.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange) && 'plan_range',
    hashSkillValue(input.workGraph.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange) && 'graph_range',
    input.workGraph.planningQaReportHash !== reportArtifactHash && 'graph_planning_qa',
    reportArtifactHash !== input.plan.planningQaReportHash && 'plan_planning_qa',
    planningQaReport.schemaVersion !== input.plan.planningQaReportArtifactType && 'planning_qa_artifact_type',
    !planningQaReport.planningQaPassed && 'planning_qa_failed',
    !['planning_qualified', 'internal_execution_qualified', 'production_qualified']
      .includes(input.qualificationReceipt.qualificationStatus) && 'qualification_status',
  ].filter((value): value is string => typeof value === 'string')
  if (lineageViolations.length > 0) {
    throw new Error(`Canonical B-roll component lineage is stale or under-qualified: ${lineageViolations.join(', ')}.`)
  }
  const common = {
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
    planningQaReportArtifactRef: input.planningQaReportArtifactRef,
    workGraphArtifactRef: input.workGraphArtifactRef,
    qualificationReceiptArtifactRef: input.qualificationReceiptArtifactRef,
    planHash: input.plan.planHash,
    planningQaPlanEvidenceHash: input.plan.planningQaPlanEvidenceHash,
    planningQaReportHash: reportArtifactHash,
    workGraphHash: input.workGraph.workGraphHash,
    qualificationReceiptHash: input.qualificationReceipt.receiptHash,
    workItemCount: input.workGraph.workItems.length,
    providerWorkPlanned: input.plan.providerRequestPlanned,
    outsideAuthorizedRangeModified: false,
  }
  if (!input.executionAuthorityRefs) {
    if (input.publicLifecycleRefs) {
      throw new Error(
        'Canonical B-roll public lifecycle refs require execution authority refs.',
      )
    }
    const core = componentV1CoreSchema.parse(common)
    return canonicalBrollSkillPlanComponentV1Schema.parse({
      ...core,
      componentHash: hashSkillValue(core),
    })
  }
  if (input.publicLifecycleRefs) {
    const core = componentV3CoreSchema.parse({
      ...common,
      schemaVersion: CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION,
      ...input.executionAuthorityRefs,
      ...input.publicLifecycleRefs,
      restartSafeExecutionInputsPersisted: true,
      restartSafePublicLifecyclePersisted: true,
    })
    return canonicalBrollSkillPlanComponentV3Schema.parse({
      ...core,
      componentHash: hashSkillValue(core),
    })
  }
  const core = componentV2CoreSchema.parse({
    ...common,
    schemaVersion: CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION,
    ...input.executionAuthorityRefs,
    restartSafeExecutionInputsPersisted: true,
  })
  return canonicalBrollSkillPlanComponentV2Schema.parse({
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
