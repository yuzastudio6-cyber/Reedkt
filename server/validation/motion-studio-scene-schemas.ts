import { z } from 'zod'

import { MOTION_STUDIO_PRODUCTION_MODES } from '../../src/lib/motion-studio/contracts'
import type {
  CreateMotionStudioSceneDraftRequest,
  CreateMotionStudioTimelineProposalRequest,
} from '../../src/types/motion-studio'

const nonEmpty = z.string().trim().min(1)
const stableId = nonEmpty.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const createMotionStudioSceneDraftRequestSchema = z.object({
  approvedSnapshotId: uuid,
  title: nonEmpty.max(200),
  semanticPurpose: nonEmpty.max(2_000),
  productionMode: z.enum(MOTION_STUDIO_PRODUCTION_MODES),
  startAnchorId: stableId,
  endAnchorId: stableId,
  layerType: z.enum([
    'source_footage', 'image', 'generated_video', 'text', 'caption',
    'map', 'chart', 'mask', 'audio', 'effect',
  ]),
  assetIds: z.array(stableId).max(128).readonly(),
  zIndex: z.number().int().refine(Number.isSafeInteger),
  motionLanguageVersionId: uuid,
  narrativeFunctionVersionId: uuid,
}).strict().superRefine((value, context) => {
  if (value.startAnchorId === value.endAnchorId) {
    context.addIssue({
      code: 'custom',
      path: ['endAnchorId'],
      message: 'Scene start and end anchors must be different.',
    })
  }
}) satisfies z.ZodType<CreateMotionStudioSceneDraftRequest>

export const createMotionStudioTimelineProposalRequestSchema = z.object({
  approvedSnapshotId: uuid,
  sceneDocumentArtifactId: uuid,
  sceneDocumentVersionId: uuid,
  sceneDocumentContentDigest: digest,
  targetTimelineManifestId: stableId,
}).strict() satisfies z.ZodType<CreateMotionStudioTimelineProposalRequest>
