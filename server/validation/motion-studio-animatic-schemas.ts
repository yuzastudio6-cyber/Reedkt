import { z } from 'zod'

import type {
  AssembleMotionStudioAnimaticRequest,
  CreateMotionStudioAnimaticBindingRequest,
  ExecuteMotionStudioAnimaticRequest,
} from '../../src/types/motion-studio'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export const assembleMotionStudioAnimaticRequestSchema = z.object({
  approvedSnapshotId: uuid,
  preparedScriptArtifactId: uuid,
  preparedScriptVersionId: uuid,
  preparedScriptContentDigest: digest,
  narrationMediaAssetId: stableId,
  narrationChecksumSha256: digest,
  scenes: z.array(z.object({
    sceneDocumentArtifactId: uuid,
    sceneDocumentVersionId: uuid,
    sceneDocumentContentDigest: digest,
    timelineProposalId: uuid,
  }).strict()).min(1).max(8),
}).strict() satisfies z.ZodType<AssembleMotionStudioAnimaticRequest>

export const createMotionStudioAnimaticBindingRequestSchema = z.object({
  approvedSnapshotId: uuid,
  animaticArtifactId: uuid,
  animaticVersionId: uuid,
  animaticContentDigest: digest,
  jobId: stableId,
}).strict() satisfies z.ZodType<CreateMotionStudioAnimaticBindingRequest>

export const executeMotionStudioAnimaticRequestSchema = z.object({
  bindingId: uuid,
}).strict() satisfies z.ZodType<ExecuteMotionStudioAnimaticRequest>
