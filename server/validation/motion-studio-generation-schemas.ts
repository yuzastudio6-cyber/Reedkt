import { z } from 'zod'

import type {
  CreateMotionStudioGenerationBindingRequest,
  ExecuteMotionStudioGenerationRequest,
  ReconcileMotionStudioGenerationRequest,
} from '../../src/types/motion-studio'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export const createMotionStudioGenerationBindingRequestSchema = z.object({
  approvedSnapshotId: uuid,
  sceneDocumentArtifactId: uuid,
  sceneDocumentVersionId: uuid,
  sceneDocumentContentDigest: digest,
  timelineProposalId: uuid,
  jobId: stableId,
  mediaKind: z.enum(['still_image', 'video_clip']),
}).strict() satisfies z.ZodType<CreateMotionStudioGenerationBindingRequest>

export const executeMotionStudioGenerationRequestSchema = z.object({
  bindingId: uuid,
  simulationScenario: z.enum([
    'success', 'failed', 'cancelled', 'outcome_unknown', 'qa_rejected', 'execution_error',
  ]).optional(),
}).strict() satisfies z.ZodType<ExecuteMotionStudioGenerationRequest>

export const reconcileMotionStudioGenerationRequestSchema = z.object({
  decision: z.enum(['no_side_effect', 'manual_review']),
  evidenceDigest: digest,
}).strict() satisfies z.ZodType<ReconcileMotionStudioGenerationRequest>
