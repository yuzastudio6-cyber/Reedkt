import { z } from 'zod'

import type {
  CreateMotionStudioPreviewBindingRequest,
  ExecuteMotionStudioPreviewRequest,
} from '../../src/types/motion-studio'

const uuid = z.string().uuid()
const stableId = z.string().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const createMotionStudioPreviewBindingRequestSchema = z.object({
  approvedSnapshotId: uuid,
  sceneDocumentArtifactId: uuid,
  sceneDocumentVersionId: uuid,
  sceneDocumentContentDigest: digest,
  timelineProposalId: uuid,
  jobId: stableId,
}).strict() satisfies z.ZodType<CreateMotionStudioPreviewBindingRequest>

export const executeMotionStudioPreviewRequestSchema = z.object({
  bindingId: uuid,
}).strict() satisfies z.ZodType<ExecuteMotionStudioPreviewRequest>
