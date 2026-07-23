import { z } from 'zod'

import type {
  MotionStudioNarratorPlanningSelectionReceiptDto,
  MotionStudioVoiceCastingCandidateDto,
  MotionStudioVoiceCastingWorkspaceDto,
  SelectMotionStudioNarratorForPlanningRequest,
} from '../../../types/motion-studio'
import { motionStudioVersionReferenceSchema } from './schemas'

const nonEmpty = z.string().trim().min(1)
const stableId = nonEmpty.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const motionStudioVoiceCastingCandidateDtoSchema: z.ZodType<MotionStudioVoiceCastingCandidateDto> = z.object({
  candidateReference: stableId,
  displayName: nonEmpty.max(160),
  description: nonEmpty.max(1_000).optional(),
  traits: z.object({
    accent: nonEmpty.max(96).optional(),
    age: nonEmpty.max(96).optional(),
    gender: nonEmpty.max(96).optional(),
    language: nonEmpty.max(96).optional(),
    useCase: nonEmpty.max(96).optional(),
    character: nonEmpty.max(96).optional(),
  }).strict(),
  auditionState: z.literal('unavailable'),
}).strict()

export const motionStudioVoiceCastingWorkspaceDtoSchema: z.ZodType<MotionStudioVoiceCastingWorkspaceDto> = z.object({
  productionId: z.string().uuid(),
  projectId: stableId,
  editSessionId: stableId,
  state: z.enum([
    'not_prepared',
    'ready',
    'selected_for_planning',
    'locked_read_only',
    'uploaded_narration',
    'catalog_unavailable',
  ]),
  catalogVersion: digest.optional(),
  candidates: z.array(motionStudioVoiceCastingCandidateDtoSchema).max(100).readonly(),
  selectedCandidateReference: stableId.optional(),
  voiceBible: z.object({
    artifactId: z.string().uuid(),
    providerCapability: z.enum(['speech_generation', 'uploaded_narration']),
    currentDraftVersion: motionStudioVersionReferenceSchema.optional(),
    currentApprovedVersion: motionStudioVersionReferenceSchema.optional(),
  }).strict().optional(),
  selectionAllowed: z.boolean(),
  notice: nonEmpty.max(1_000),
  localCandidateOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const hasCatalog = Boolean(value.catalogVersion && value.candidates.length > 0)
  if (value.selectionAllowed && (
    !hasCatalog || value.state === 'locked_read_only' || value.state === 'uploaded_narration' || value.state === 'not_prepared' ||
    value.state === 'catalog_unavailable' || !value.voiceBible?.currentDraftVersion ||
    value.voiceBible.providerCapability !== 'speech_generation'
  )) {
    context.addIssue({ code: 'custom', path: ['selectionAllowed'], message: 'Narrator selection requires one generated-speech Voice Bible draft and a safe catalog.' })
  }
  if (value.state === 'selected_for_planning' && !value.selectedCandidateReference) {
    context.addIssue({ code: 'custom', path: ['selectedCandidateReference'], message: 'Selected narrator state requires one candidate reference.' })
  }
  if (value.selectedCandidateReference && !value.candidates.some((candidate) =>
    candidate.candidateReference === value.selectedCandidateReference)) {
    context.addIssue({ code: 'custom', path: ['selectedCandidateReference'], message: 'Selected narrator must belong to this exact safe catalog projection.' })
  }
})

export const selectMotionStudioNarratorForPlanningRequestSchema: z.ZodType<SelectMotionStudioNarratorForPlanningRequest> = z.object({
  candidateReference: stableId,
  catalogVersion: digest,
  voiceBibleBaseVersionId: z.string().uuid(),
  voiceBibleBaseVersionDigest: digest,
}).strict()

export const motionStudioNarratorPlanningSelectionReceiptDtoSchema: z.ZodType<MotionStudioNarratorPlanningSelectionReceiptDto> = z.object({
  updatedVoiceBibleVersion: motionStudioVersionReferenceSchema,
  workspace: motionStudioVoiceCastingWorkspaceDtoSchema,
  planApproved: z.literal(false),
  providerCallMade: z.literal(false),
  speechGenerated: z.literal(false),
  customerCreditsChanged: z.literal(false),
}).strict()
