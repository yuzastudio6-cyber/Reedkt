import { z } from 'zod'

import { canonicalMasterTimingAuthorityDigest } from
  '../../services/canonical-master-timing-authority'
import { sha256AuthorityValue } from
  '../../services/private-edit-authority-store'
import { skillFrameRangeSchema } from '../core/skill-assignment-schema'
import { skillSha256Schema } from '../core/skill-capability-manifest-schema'
import type { BrollSkillAssignment } from './b-roll-contracts'
import {
  brollMasterTimingPlanSchema,
  type BrollMasterTimingPlan,
} from './b-roll-input-authorities'

export const CANONICAL_BROLL_MASTER_TIMING_PROJECTION_BINDING_VERSION =
  'canonical-b-roll-master-timing-projection-binding-v1' as const

const safeIdentity = z.string().trim().min(1).max(180)
const timingSummarySchema = z.object({
  validationStatus: z.enum(['passed', 'warning']),
  approvalBlocked: z.literal(false),
  fps: z.number().int().min(1).max(120),
  totalFrames: z.number().int().positive().max(100_000_000),
}).strict()

const bindingCoreSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_BROLL_MASTER_TIMING_PROJECTION_BINDING_VERSION),
  ownerUserId: safeIdentity,
  workspaceId: safeIdentity,
  projectId: safeIdentity,
  editSessionId: safeIdentity,
  assignmentId: safeIdentity,
  canonicalMasterTimingDigestSha256: skillSha256Schema,
  canonicalTimingSummaryDigestSha256: skillSha256Schema,
  brollTimingProjectionDigestSha256: skillSha256Schema,
  timelineRange: skillFrameRangeSchema,
  assignmentRange: skillFrameRangeSchema,
  canonicalMasterTimingRemainsSoleClockAuthority: z.literal(true),
  brollProjectionPurpose: z.literal('skill_planning_projection'),
  brollProjectionCreatesParallelClock: z.literal(false),
  brollProjectionMayMutateTimeline: z.literal(false),
  brollProjectionMayResolveExecutableFrames: z.literal(false),
}).strict()

export const canonicalBrollMasterTimingProjectionBindingSchema =
  bindingCoreSchema.extend({
    bindingDigestSha256: skillSha256Schema,
  }).strict().superRefine((binding, context) => {
    const { bindingDigestSha256, ...core } = binding
    if (sha256AuthorityValue(core) !== bindingDigestSha256) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Canonical B-roll MasterTiming projection binding digest is stale or forged.',
      })
    }
  })

export type CanonicalBrollMasterTimingProjectionBinding = z.infer<
  typeof canonicalBrollMasterTimingProjectionBindingSchema
>

export interface CanonicalBrollTimingSummary {
  readonly validationStatus: 'passed' | 'warning'
  readonly approvalBlocked: false
  readonly fps: number
  readonly totalFrames: number
}

export function createCanonicalBrollMasterTimingProjectionBinding(input: {
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
  }
  canonicalMasterTimingPlan: Record<string, unknown>
  canonicalTimingSummary: CanonicalBrollTimingSummary
  brollTimingProjection: BrollMasterTimingPlan
}): CanonicalBrollMasterTimingProjectionBinding {
  const projection = brollMasterTimingPlanSchema.parse(
    input.brollTimingProjection)
  const summary = timingSummarySchema.parse(input.canonicalTimingSummary)
  if (
    projection.ownerUserId !== input.scope.ownerUserId ||
    projection.workspaceId !== input.scope.workspaceId ||
    projection.projectId !== input.scope.projectId ||
    projection.editSessionId !== input.scope.editSessionId ||
    projection.fps !== summary.fps ||
    projection.timelineRange.startFrameInclusive !== 0 ||
    projection.timelineRange.endFrameExclusive !== summary.totalFrames
  ) {
    throw new Error(
      'B-roll timing projection does not match the canonical scope and MasterTiming range.',
    )
  }
  const core = bindingCoreSchema.parse({
    schemaVersion:
      CANONICAL_BROLL_MASTER_TIMING_PROJECTION_BINDING_VERSION,
    ...input.scope,
    assignmentId: projection.assignmentId,
    canonicalMasterTimingDigestSha256:
      canonicalMasterTimingAuthorityDigest(input.canonicalMasterTimingPlan),
    canonicalTimingSummaryDigestSha256: sha256AuthorityValue(summary),
    brollTimingProjectionDigestSha256: projection.timingHash,
    timelineRange: projection.timelineRange,
    assignmentRange: projection.assignmentRange,
    canonicalMasterTimingRemainsSoleClockAuthority: true,
    brollProjectionPurpose: 'skill_planning_projection',
    brollProjectionCreatesParallelClock: false,
    brollProjectionMayMutateTimeline: false,
    brollProjectionMayResolveExecutableFrames: false,
  })
  return canonicalBrollMasterTimingProjectionBindingSchema.parse({
    ...core,
    bindingDigestSha256: sha256AuthorityValue(core),
  })
}

export function assertCanonicalBrollMasterTimingProjectionBinding(input: {
  binding: CanonicalBrollMasterTimingProjectionBinding
  canonicalMasterTimingPlan: Record<string, unknown>
  canonicalTimingSummary: CanonicalBrollTimingSummary
  assignment?: BrollSkillAssignment
}): CanonicalBrollMasterTimingProjectionBinding {
  const binding = canonicalBrollMasterTimingProjectionBindingSchema.parse(
    input.binding)
  const summary = timingSummarySchema.parse(input.canonicalTimingSummary)
  const assignment = input.assignment
  const invalid =
    binding.canonicalMasterTimingDigestSha256 !==
      canonicalMasterTimingAuthorityDigest(input.canonicalMasterTimingPlan) ||
    binding.canonicalTimingSummaryDigestSha256 !==
      sha256AuthorityValue(summary) ||
    binding.timelineRange.startFrameInclusive !== 0 ||
    binding.timelineRange.endFrameExclusive !== summary.totalFrames ||
    binding.timelineRange.fps !== summary.fps ||
    (assignment !== undefined && (
      binding.ownerUserId !== assignment.ownerUserId ||
      binding.workspaceId !== assignment.workspaceId ||
      binding.projectId !== assignment.projectId ||
      binding.editSessionId !== assignment.editSessionId ||
      binding.assignmentId !== assignment.assignmentId ||
      binding.brollTimingProjectionDigestSha256 !==
        assignment.masterTimingHash ||
      JSON.stringify(binding.timelineRange) !==
        JSON.stringify(assignment.masterTimingRange) ||
      JSON.stringify(binding.assignmentRange) !== JSON.stringify(
        assignment.writeRangeAuthority.authorizedRange)
    ))
  if (invalid) {
    throw new Error(
      'Canonical B-roll MasterTiming projection binding no longer matches its exact edit and assignment authorities.',
    )
  }
  return binding
}
