import { z } from 'zod'

import { motionStudioAudioReviewSummaryDtoSchema } from './audio-review'
import { motionStudioAudioCandidateReviewSummaryDtoSchema } from './audio-candidate-review'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const safeText = z.string().min(8).max(360).refine((value) =>
  [...value].every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }))

const requiredQualityGates = [
  'file_integrity', 'format', 'duration_sync', 'integrated_loudness', 'true_peak',
  'sample_clipping', 'cue_timing', 'speech_priority', 'rights_provenance',
] as const

export const motionStudioAudioMixStemRoleSchema = z.enum(['narration', 'music', 'foley', 'exact_sfx'])

export const motionStudioAudioMixInputSelectionSchema = z.object({
  role: motionStudioAudioMixStemRoleSchema,
  stemId: stableId,
  mediaAssetId: stableId,
  checksumSha256: digest,
  startFrame: safeInteger,
  endFrame: safeInteger.positive().max(3_600),
  cueAuthorityId: stableId,
  cueReason: safeText,
  rightsEvidenceId: stableId,
}).strict().superRefine((value, context) => {
  if (value.endFrame <= value.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Audio mix frame range must be positive.' })
  }
})

export const createMotionStudioAudioMixBindingRequestSchema = z.object({
  audioAuthorityId: uuid,
  sourceApprovedSnapshotId: uuid,
  executionApprovedSnapshotId: uuid,
  mixPlanVersionId: uuid,
  mixPlanContentDigest: digest,
  jobId: stableId,
  fps: z.union([z.literal(24), z.literal(30)]),
  durationFrames: z.number().int().min(24).max(3_600),
  inputs: z.array(motionStudioAudioMixInputSelectionSchema).length(4).superRefine((values, context) => {
    const roles = values.map((value) => value.role)
    if (new Set(roles).size !== 4) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Audio mix requires one exact input per stem role.' })
    }
  }),
}).strict()

export const executeMotionStudioAudioMixRequestSchema = z.object({ bindingId: uuid }).strict()

const inputSummarySchema = motionStudioAudioMixInputSelectionSchema.extend({
  mimeType: z.literal('audio/wav'),
  audioCodec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.union([z.literal(1), z.literal(2)]),
  sampleCountPerChannel: safeInteger.positive(),
}).strict()

const qualitySchema = z.object({
  integratedLufs: z.number().finite().min(-70).max(0),
  loudnessRangeLu: z.number().finite().min(0).max(100),
  truePeakDbfs: z.number().finite().min(-100).max(0),
  samplePeakDbfs: z.number().finite().min(-100).max(0),
  speechPriorityRatio: z.number().finite().min(1.25).max(1_000_000),
  gateResults: z.array(z.object({
    gate: z.enum(requiredQualityGates),
    result: z.literal('passed'),
    blocking: z.literal(true),
  }).strict()).length(9).superRefine((values, context) => {
    if (new Set(values.map((value) => value.gate)).size !== requiredQualityGates.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Audio mix QA requires all nine distinct blocking gates.' })
    }
  }),
  qaEvidenceDigest: digest,
}).strict()

const artifactSchema = z.object({
  artifactId: uuid,
  sha256: digest,
  byteLength: safeInteger.min(44).max(24 * 1024 * 1024),
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  sampleCountPerChannel: safeInteger.positive().max(48_000 * 120),
  durationFrames: z.number().int().min(24).max(3_600),
  fps: z.union([z.literal(24), z.literal(30)]),
  quality: qualitySchema,
  privateReviewOnly: z.literal(true),
  contentPath: z.string().regex(/^\/v1\/motion-studio\/audio-mix-artifacts\/[0-9a-f-]{36}\/content$/),
}).strict()

export const motionStudioAudioMixBindingDtoSchema = z.object({
  bindingId: uuid,
  productionId: uuid,
  audioAuthorityId: uuid,
  sourceApprovedSnapshotId: uuid,
  executionApprovedSnapshotId: uuid,
  mixPlanVersionId: uuid,
  mixPlanContentDigest: digest,
  jobId: stableId,
  profileId: z.literal('motion_studio_storytelling_speech_safe_mix_v1'),
  state: z.enum(['queued', 'in_progress', 'resumable', 'reconciliation_required', 'blocked', 'failed', 'cancelled', 'ready_for_private_review']),
  fps: z.union([z.literal(24), z.literal(30)]),
  durationFrames: z.number().int().min(24).max(3_600),
  sampleCountPerChannel: safeInteger.positive().max(48_000 * 120),
  inputs: z.array(inputSummarySchema).length(4),
  attemptCount: safeInteger,
  latestAttemptNumber: z.number().int().positive().optional(),
  providerCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  artifact: artifactSchema.optional(),
  createdAt: z.string().datetime(),
}).strict()

export const motionStudioAudioMixWorkspaceDtoSchema = z.object({
  productionId: uuid,
  state: z.enum(['empty', 'active', 'ready_for_private_review', 'attention_required']),
  bindings: z.array(motionStudioAudioMixBindingDtoSchema).max(50),
  candidateReviews: z.array(motionStudioAudioCandidateReviewSummaryDtoSchema).max(2)
    .superRefine((values, context) => {
      if (new Set(values.map((value) => value.role)).size !== values.length) {
        context.addIssue({
          code: 'custom',
          message: 'Audio candidate review projection may contain at most one current item per role.',
        })
      }
    })
    .optional(),
  acceptanceReview: motionStudioAudioReviewSummaryDtoSchema.optional(),
  warning: z.string().min(1).max(400),
}).strict()
