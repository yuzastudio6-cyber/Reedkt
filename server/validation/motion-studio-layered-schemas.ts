import { z } from 'zod'

import type {
  CreateMotionStudioLayeredAssemblyRequest,
  ExecuteMotionStudioLayeredCutoutRequest,
  ExecuteMotionStudioLayeredPreviewRequest,
} from '../../src/types/motion-studio'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export const createMotionStudioLayeredAssemblyRequestSchema = z.object({
  approvedSnapshotId: uuid,
  sceneDocumentArtifactId: uuid,
  sceneDocumentVersionId: uuid,
  sceneDocumentContentDigest: digest,
  timelineProposalId: uuid,
  cutoutJobId: stableId,
  renderJobId: stableId,
}).strict() satisfies z.ZodType<CreateMotionStudioLayeredAssemblyRequest>

export const executeMotionStudioLayeredCutoutRequestSchema = z.object({
  assemblyId: uuid,
}).strict() satisfies z.ZodType<ExecuteMotionStudioLayeredCutoutRequest>

export const executeMotionStudioLayeredPreviewRequestSchema = z.object({
  bindingId: uuid,
}).strict() satisfies z.ZodType<ExecuteMotionStudioLayeredPreviewRequest>
