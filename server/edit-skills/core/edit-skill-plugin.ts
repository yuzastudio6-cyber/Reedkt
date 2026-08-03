import { z } from 'zod'

import type { EditSkillArtifactReference } from './edit-skill-artifact-store'
import {
  editSkillDependencyRequestSchema,
  type EditSkillDependencyAcceptance,
  type EditSkillDependencyRequest,
} from './edit-skill-dependency-request'
import type { EditSkillWorkResult } from './edit-skill-work-result'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import type { SkillCapabilityManifest } from './skill-capability-manifest-types'
import { editSkillArtifactReferenceSchema, skillFrameRangeSchema } from './skill-assignment-schema'
import type { SkillAssignment } from './skill-assignment-types'
import { skillPlanEnvelopeSchema } from './skill-plan-envelope'
import { skillResultEnvelopeSchema } from './skill-result-envelope'

const editSkillPublicPlanCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-public-plan-v1'),
  envelope: skillPlanEnvelopeSchema,
  payloadRef: editSkillArtifactReferenceSchema,
  dependencyRequests: z.array(editSkillDependencyRequestSchema).max(100),
}).strict().superRefine((value, context) => {
  if (
    value.envelope.payloadArtifactType !== value.payloadRef.artifactType ||
    value.envelope.payloadHash !== value.payloadRef.sha256
  ) {
    context.addIssue({ code: 'custom', message: 'Public skill plan does not bind its exact payload artifact.' })
  }
  if (
    value.envelope.disposition === 'needs_other_skill' &&
    value.dependencyRequests.length === 0
  ) {
    context.addIssue({ code: 'custom', message: 'A needs_other_skill plan must carry a typed dependency request.' })
  }
  if (
    value.envelope.disposition !== 'needs_other_skill' &&
    value.dependencyRequests.length !== 0
  ) {
    context.addIssue({ code: 'custom', message: 'Only needs_other_skill plans may carry blocking dependency requests.' })
  }
})

export const editSkillPublicPlanSchema = editSkillPublicPlanCoreSchema.extend({
  publicPlanHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { publicPlanHash, ...core } = value
  if (hashSkillValue(core) !== publicPlanHash) {
    context.addIssue({ code: 'custom', message: 'Public skill plan hash is stale or forged.' })
  }
})

export type EditSkillPublicPlan = z.infer<typeof editSkillPublicPlanSchema>

export function createEditSkillPublicPlan(
  input: z.input<typeof editSkillPublicPlanCoreSchema>,
): EditSkillPublicPlan {
  const core = editSkillPublicPlanCoreSchema.parse(input)
  return editSkillPublicPlanSchema.parse({ ...core, publicPlanHash: hashSkillValue(core) })
}

const editSkillPlanApprovalCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-plan-approval-v1'),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  approved: z.literal(true),
  approvedAt: z.string().datetime({ offset: true }),
}).strict()

export const editSkillPlanApprovalSchema = editSkillPlanApprovalCoreSchema.extend({
  approvalHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { approvalHash, ...core } = value
  if (hashSkillValue(core) !== approvalHash) {
    context.addIssue({ code: 'custom', message: 'Edit-skill plan approval hash is stale or forged.' })
  }
})

export type EditSkillPlanApproval = z.infer<typeof editSkillPlanApprovalSchema>

export function createEditSkillPlanApproval(
  input: z.input<typeof editSkillPlanApprovalCoreSchema>,
): EditSkillPlanApproval {
  const core = editSkillPlanApprovalCoreSchema.parse(input)
  return editSkillPlanApprovalSchema.parse({ ...core, approvalHash: hashSkillValue(core) })
}

export const editSkillPublicWorkItemSchema = z.object({
  workItemKey: z.string().trim().min(1).max(180),
  workItemHash: skillSha256Schema,
  jobType: skillIdentitySchema,
  operationId: skillIdentitySchema,
  workerClass: skillIdentitySchema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  dependencyKeys: z.array(z.string().trim().min(1).max(180)).max(100),
  expectedOutputType: skillIdentitySchema,
  maximumCreditBudget: z.number().int().nonnegative().max(100_000),
  maximumAttempts: z.number().int().positive().max(10),
  required: z.boolean(),
  qaLineageKeys: z.array(skillIdentitySchema).min(1).max(100),
  providerRouteId: skillIdentitySchema.optional(),
  callerSelectedExecutableAllowed: z.literal(false),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export type EditSkillPublicWorkItem = z.infer<typeof editSkillPublicWorkItemSchema>

const editSkillApprovedWorkGraphCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-approved-work-graph-v1'),
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  planId: z.string().trim().min(1).max(180),
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  authorizedRange: skillFrameRangeSchema,
  approval: editSkillPlanApprovalSchema,
  pluginWorkGraphType: skillIdentitySchema,
  pluginWorkGraphHash: skillSha256Schema,
  workItems: z.array(editSkillPublicWorkItemSchema).min(1).max(1_000),
  dependencyRequests: z.array(editSkillDependencyRequestSchema).max(100),
  outsideAuthorizedRangeModified: z.literal(false),
}).strict()

export const editSkillApprovedWorkGraphSchema = editSkillApprovedWorkGraphCoreSchema.extend({
  approvedWorkGraphHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { approvedWorkGraphHash, ...core } = value
  if (hashSkillValue(core) !== approvedWorkGraphHash) {
    context.addIssue({ code: 'custom', message: 'Approved edit-skill work graph hash is stale or forged.' })
  }
  const workItemKeys = new Set(value.workItems.map((item) => item.workItemKey))
  if (workItemKeys.size !== value.workItems.length) {
    context.addIssue({ code: 'custom', message: 'Approved work graph contains duplicate work item keys.' })
  }
  for (const item of value.workItems) {
    if (item.dependencyKeys.some((dependencyKey) => !workItemKeys.has(dependencyKey))) {
      context.addIssue({ code: 'custom', message: `Work item ${item.workItemKey} has an unknown dependency.` })
    }
  }
})

export type EditSkillApprovedWorkGraph = z.infer<typeof editSkillApprovedWorkGraphSchema>

export function createEditSkillApprovedWorkGraph(
  input: z.input<typeof editSkillApprovedWorkGraphCoreSchema>,
): EditSkillApprovedWorkGraph {
  const core = editSkillApprovedWorkGraphCoreSchema.parse(input)
  return editSkillApprovedWorkGraphSchema.parse({
    ...core,
    approvedWorkGraphHash: hashSkillValue(core),
  })
}

const editSkillResultReceiptCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-result-receipt-v1'),
  envelope: skillResultEnvelopeSchema,
  approvedWorkGraphHash: skillSha256Schema,
  workItemResultHashes: z.array(skillSha256Schema).max(1_000),
  dependencyAcceptanceHashes: z.array(skillSha256Schema).max(100),
}).strict()

export const editSkillResultReceiptSchema = editSkillResultReceiptCoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { receiptHash, ...core } = value
  if (hashSkillValue(core) !== receiptHash) {
    context.addIssue({ code: 'custom', message: 'Public edit-skill result receipt hash is stale or forged.' })
  }
})

export type EditSkillResultReceipt = z.infer<typeof editSkillResultReceiptSchema>

export function createEditSkillResultReceipt(
  input: z.input<typeof editSkillResultReceiptCoreSchema>,
): EditSkillResultReceipt {
  const core = editSkillResultReceiptCoreSchema.parse(input)
  return editSkillResultReceiptSchema.parse({ ...core, receiptHash: hashSkillValue(core) })
}

export interface EditSkillPlugin {
  readonly manifest: Readonly<SkillCapabilityManifest>

  planAssignment(input: {
    assignment: SkillAssignment
  }): Promise<EditSkillPublicPlan>

  compileApprovedWorkGraph(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    approval: EditSkillPlanApproval
  }): Promise<EditSkillApprovedWorkGraph>

  acceptDependencyArtifact(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    request: EditSkillDependencyRequest
    artifactRef: EditSkillArtifactReference
  }): Promise<EditSkillDependencyAcceptance>

  validateWorkItemResult(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    workGraph: EditSkillApprovedWorkGraph
    result: EditSkillWorkResult
  }): Promise<EditSkillWorkResult>

  finalizeSkillResult(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    workGraph: EditSkillApprovedWorkGraph
    dependencyAcceptances: readonly EditSkillDependencyAcceptance[]
    workItemResults: readonly EditSkillWorkResult[]
  }): Promise<EditSkillResultReceipt>
}
