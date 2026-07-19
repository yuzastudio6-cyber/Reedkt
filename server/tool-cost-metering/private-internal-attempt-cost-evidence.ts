import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { calculateToolActualCostMicros } from './cost-math'
import { TOOL_COST_RATE_CARD_VERSION } from './rate-card'
import type { ToolCostFailureCategory } from './types'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID,
} from '../edit-architecture/professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const failureCategory = z.enum([
  'none',
  'provider_error',
  'provider_variance_absorbed',
  'reeditpro_error_absorbed',
  'user_requested_retry',
  'validation_error',
  'timeout',
  'cancelled',
  'unknown',
])

export const PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS = {
  deepFilterNetVoiceCleanup: 'deepfilternet_cpu_4vcpu_4gib_v1',
  remotionFourKSourceSliceChunk: 'remotion_4k_source_slice_chunk_cpu_2vcpu_4gib_v1',
  ffmpegFourKMezzanineFinalization:
    'ffmpeg_4k_mezzanine_finalization_cpu_2vcpu_4gib_v1',
  ffmpegFinalMasterDecodedVideoQa:
    'ffmpeg_final_master_decoded_video_qa_cpu_2vcpu_2gib_v1',
  ffmpegFinalMasterDecodedAudioQa:
    'ffmpeg_final_master_decoded_audio_qa_cpu_2vcpu_2gib_v1',
  ffmpegFourKObjectMezzanineChunk:
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_COST_PROFILE_ID,
  ffprobeFourKObjectMezzanineChunkQa:
    PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_COST_PROFILE_ID,
  professionalLongFormSnapshotValidation:
    PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  professionalLongFormSourceAuthorityValidation:
    PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
  professionalLongFormMasterTimingValidation:
    PROFESSIONAL_LONG_FORM_MASTER_TIMING_COST_PROFILE_ID,
  ffmpegContinuousProgramAudio:
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_COST_PROFILE_ID,
  ffprobeContinuousProgramAudioQa:
    PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_COST_PROFILE_ID,
  ffmpegCrossChunkColorContinuity:
    PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_COST_PROFILE_ID,
  ffmpegLongFormMasterAssembly:
    PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_COST_PROFILE_ID,
  ffprobeLongFormPrivateMasterQa:
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_COST_PROFILE_ID,
} as const

export type PrivateInternalAttemptCostProfileId =
  (typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS)[keyof typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS]

const commonAttemptIdentityFields = {
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedWorkItemId: identity,
  jobId: identity,
  executionAttemptId: identity,
  retryAttempt: safeInteger,
}

export const privateInternalAttemptCostIdentitySchema = z.union([
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('deepfilternet'),
    operationId: z.literal('tool.deepfilternet.enhance_voice.v1'),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegContinuousProgramAudio,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeContinuousProgramAudioQa,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormSourceAuthorityValidation,
    ),
  }).strict(),
  z.object({
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormMasterTimingValidation,
    ),
  }).strict(),
])

const resourceUsageSchema = z.object({
  wallTimeMilliseconds: positiveSafeInteger,
  billableMilliseconds: positiveSafeInteger,
  vcpuCount: z.union([z.literal(2), z.literal(4)]),
  memoryGib: z.union([z.literal(2), z.literal(4)]),
  gpuCount: z.literal(0),
  outputByteLength: safeInteger.nullable(),
  networkEgressMib: z.literal(0),
}).strict()

export const privateInternalAttemptCostEvidenceSchema = z.object({
  schemaVersion: z.literal('private-internal-attempt-cost-evidence-v1'),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClassification: z.literal('provisional_local_metered'),
  evidenceId: identity,
  identity: privateInternalAttemptCostIdentitySchema,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  sourceKind: z.literal('infrastructure_runtime'),
  resourceUsage: resourceUsageSchema,
  breakdownMicros: z.record(z.string(), safeInteger),
  actualInternalCostMicros: safeInteger,
  outcome: z.object({
    status: z.enum(['completed', 'failed']),
    failureCategory,
  }).strict(),
  linkedCanonicalOutcomeHash: sha256.nullable(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
    invoiceReconciled: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const expectedResources = fixedResourceEnvelope(value.identity)
  if (
    value.resourceUsage.vcpuCount !== expectedResources.vcpuCount ||
    value.resourceUsage.memoryGib !== expectedResources.memoryGib ||
    value.resourceUsage.gpuCount !== expectedResources.gpuCount
  ) {
    context.addIssue({
      code: 'custom',
      path: ['resourceUsage'],
      message: 'Attempt-cost resources diverge from the immutable workload profile.',
    })
  }
  if (value.outcome.status === 'completed') {
    if (value.outcome.failureCategory !== 'none') {
      context.addIssue({ code: 'custom', path: ['outcome', 'failureCategory'], message: 'Completed attempts cannot have a failure category.' })
    }
    if (!value.linkedCanonicalOutcomeHash || value.resourceUsage.outputByteLength === null) {
      context.addIssue({ code: 'custom', path: ['linkedCanonicalOutcomeHash'], message: 'Completed attempts require an output and canonical outcome hash.' })
    }
  } else {
    if (value.outcome.failureCategory === 'none') {
      context.addIssue({ code: 'custom', path: ['outcome', 'failureCategory'], message: 'Failed attempts require a failure category.' })
    }
    if (value.linkedCanonicalOutcomeHash !== null) {
      context.addIssue({ code: 'custom', path: ['linkedCanonicalOutcomeHash'], message: 'Failed attempts cannot claim a canonical outcome.' })
    }
  }
})

export type PrivateInternalAttemptCostEvidence = z.infer<typeof privateInternalAttemptCostEvidenceSchema>

export interface PrivateInternalAttemptCostDescriptor {
  identity: z.infer<typeof privateInternalAttemptCostIdentitySchema>
  attemptIdentityHash: string
  attemptInputHash: string
  rateCardVersion: typeof TOOL_COST_RATE_CARD_VERSION
  resourceEnvelope: {
    vcpuCount: 2 | 4
    memoryGib: 2 | 4
    gpuCount: 0
  }
}

interface CommonBeginPrivateInternalAttemptCostEvidenceInput {
  localStorageRoot: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  executionAttemptId: string
  retryAttempt: number
}

export type BeginPrivateInternalAttemptCostEvidenceInput =
  CommonBeginPrivateInternalAttemptCostEvidenceInput & (
    | {
        toolId: 'deepfilternet'
        operationId: 'tool.deepfilternet.enhance_voice.v1'
      }
    | {
        toolId: 'remotion'
        operationId: 'tool.remotion.render_approved_composition.v1'
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk
      }
    | {
        toolId: 'ffmpeg'
        operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization
      }
    | {
        toolId: 'ffmpeg'
        operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa
      }
    | {
        toolId: 'ffmpeg'
        operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa
      }
    | {
        toolId: 'ffmpeg'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk
      }
    | {
        toolId: 'ffprobe'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa
      }
    | {
        toolId: 'ffmpeg'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegContinuousProgramAudio
      }
    | {
        toolId: 'ffprobe'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeContinuousProgramAudioQa
      }
    | {
        toolId: 'ffmpeg'
        operationId: typeof PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity
      }
    | {
        toolId: 'ffmpeg'
        operationId: typeof PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly
      }
    | {
        toolId: 'ffprobe'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa
      }
    | {
        toolId: 'reeditpro_internal'
        operationId: typeof PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation
      }
    | {
        toolId: 'reeditpro_internal'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSourceAuthorityValidation
      }
    | {
        toolId: 'reeditpro_internal'
        operationId:
          typeof PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID
        workloadProfileId:
          typeof PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormMasterTimingValidation
      }
  )

export interface FinalizePrivateInternalAttemptCostEvidenceInput {
  status: 'completed' | 'failed'
  failureCategory: ToolCostFailureCategory
  outputByteLength: number | null
  linkedCanonicalOutcomeHash: string | null
}

export const privateInternalAttemptCostEvidenceResultSchema = z.object({
  evidence: privateInternalAttemptCostEvidenceSchema,
  idempotencyStatus: z.enum(['inserted', 'duplicate_returned']),
}).strict()

export type PrivateInternalAttemptCostEvidenceResult = z.infer<
  typeof privateInternalAttemptCostEvidenceResultSchema
>

export interface PrivateInternalAttemptCostClock {
  nowIso(): string
  monotonicNanoseconds(): bigint
}

const beginInputSchema = z.union([
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('deepfilternet'),
    operationId: z.literal('tool.deepfilternet.enhance_voice.v1'),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegContinuousProgramAudio,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(
      PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_QA_OPERATION_ID,
    ),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeContinuousProgramAudioQa,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffmpeg'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('ffprobe'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormSourceAuthorityValidation,
    ),
  }).strict(),
  z.object({
    localStorageRoot: z.string().min(1),
    ...commonAttemptIdentityFields,
    toolId: z.literal('reeditpro_internal'),
    operationId: z.literal(PROFESSIONAL_LONG_FORM_MASTER_TIMING_OPERATION_ID),
    workloadProfileId: z.literal(
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormMasterTimingValidation,
    ),
  }).strict(),
]).superRefine((value, context) => {
  if (value.retryAttempt > 10) {
    context.addIssue({
      code: 'custom',
      path: ['retryAttempt'],
      message: 'Attempt-cost retry exceeds the bounded retry policy.',
    })
  }
})

const finalizeInputSchema = z.object({
  status: z.enum(['completed', 'failed']),
  failureCategory,
  outputByteLength: safeInteger.nullable(),
  linkedCanonicalOutcomeHash: sha256.nullable(),
}).strict()

const defaultClock: PrivateInternalAttemptCostClock = {
  nowIso: () => new Date().toISOString(),
  monotonicNanoseconds: () => process.hrtime.bigint(),
}

export async function beginPrivateInternalAttemptCostEvidence(
  rawInput: BeginPrivateInternalAttemptCostEvidenceInput,
  clock: PrivateInternalAttemptCostClock = defaultClock,
) {
  const input = parse(beginInputSchema, rawInput, 'Internal attempt-cost identity is invalid.')
  const descriptor = describeParsedAttempt(input)
  const { attemptIdentityHash, attemptInputHash } = descriptor
  const existing = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.localStorageRoot,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  if (existing && existing.attemptInputHash !== attemptInputHash) {
    throw conflict('Execution-attempt cost identity conflicts with existing evidence.')
  }
  const startedAtNanoseconds = clock.monotonicNanoseconds()

  return {
    async finalize(
      rawFinal: FinalizePrivateInternalAttemptCostEvidenceInput,
    ): Promise<PrivateInternalAttemptCostEvidenceResult> {
      const final = parse(finalizeInputSchema, rawFinal, 'Internal attempt-cost outcome is invalid.')
      assertOutcome(final)
      if (existing) {
        assertReplay(existing, final)
        return { evidence: existing, idempotencyStatus: 'duplicate_returned' }
      }

      const finishedAtNanoseconds = clock.monotonicNanoseconds()
      const wallTimeMilliseconds = elapsedMilliseconds(startedAtNanoseconds, finishedAtNanoseconds)
      const resourceEnvelope = fixedResourceEnvelope(input)
      const calculated = calculateToolActualCostMicros({
        sourceKind: 'infrastructure_runtime',
        runtime: {
          wallTimeMilliseconds,
          renderSeconds: 0,
          ...resourceEnvelope,
          tempStorageGibHours: 0,
          outputStorageGibHours: 0,
          networkEgressMib: 0,
          computeLevel: 'standard',
        },
      })
      if (!calculated.ok) {
        throw new ApiError('VALIDATION_FAILED', `Internal attempt-cost calculation failed: ${calculated.error.code}.`, 400)
      }
      if (
        calculated.data.rateCardVersion !== TOOL_COST_RATE_CARD_VERSION ||
        !Number.isSafeInteger(calculated.data.actualInternalCostMicros) ||
        calculated.data.actualInternalCostMicros < 0 ||
        !Number.isSafeInteger(calculated.data.billableMilliseconds) ||
        (calculated.data.billableMilliseconds ?? 0) <= 0
      ) throw invalid('Internal attempt-cost calculation lost integer-micro precision.')

      const recordWithoutHash = {
        schemaVersion: 'private-internal-attempt-cost-evidence-v1' as const,
        boundary: 'internal_production_cost_only' as const,
        evidenceClassification: 'provisional_local_metered' as const,
        evidenceId: `internalcost_${attemptIdentityHash.slice(0, 48)}`,
        identity: costIdentity(input),
        attemptIdentityHash,
        attemptInputHash,
        rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
        sourceKind: 'infrastructure_runtime' as const,
        resourceUsage: {
          wallTimeMilliseconds,
          billableMilliseconds: calculated.data.billableMilliseconds!,
          ...resourceEnvelope,
          outputByteLength: final.outputByteLength,
          networkEgressMib: 0 as const,
        },
        breakdownMicros: numericBreakdown(calculated.data.breakdownMicros),
        actualInternalCostMicros: calculated.data.actualInternalCostMicros,
        outcome: { status: final.status, failureCategory: final.failureCategory },
        linkedCanonicalOutcomeHash: final.linkedCanonicalOutcomeHash,
        persistence: {
          privateLocalCreateOnly: true as const,
          databaseBacked: false as const,
          productionDurability: false as const,
          invoiceReconciled: false as const,
        },
        createdAt: clock.nowIso(),
      }
      assertNoCommercialFields(recordWithoutHash)
      const evidence = parse(privateInternalAttemptCostEvidenceSchema, {
        ...recordWithoutHash,
        evidenceHash: sha256AuthorityValue(recordWithoutHash),
      }, 'Internal attempt-cost evidence is invalid.')
      const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`)
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativePath(attemptIdentityHash),
        content: bytes,
      })
      const persisted = await readPrivateInternalAttemptCostEvidence({
        localStorageRoot: input.localStorageRoot,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        executionAttemptId: input.executionAttemptId,
      })
      if (!persisted || persisted.evidenceHash !== evidence.evidenceHash) {
        throw invalid('Internal attempt-cost evidence changed during create-only persistence.')
      }
      return { evidence: persisted, idempotencyStatus: 'inserted' }
    },
  }
}

/**
 * Returns the immutable identity and fixed infrastructure envelope used by the
 * private attempt-cost meter. The descriptor contains no timer, terminal
 * outcome, customer price, credits, service fee, wallet, or billing authority.
 */
export function describePrivateInternalAttemptCostEvidence(
  rawInput: BeginPrivateInternalAttemptCostEvidenceInput,
): PrivateInternalAttemptCostDescriptor {
  const input = parse(beginInputSchema, rawInput, 'Internal attempt-cost identity is invalid.')
  return describeParsedAttempt(input)
}

/**
 * Finalizes a metered attempt from a server-persisted start and a bounded
 * server-owned finish time. This is used only when an in-memory monotonic timer
 * cannot survive worker death. The caller must first verify the durable start
 * record against the exact accepted worker attempt.
 */
export async function finalizePrivateInternalAttemptCostEvidenceForBoundedDuration(
  rawInput: BeginPrivateInternalAttemptCostEvidenceInput,
  input: FinalizePrivateInternalAttemptCostEvidenceInput & {
    startedAt: string
    finishedAt: string
  },
): Promise<PrivateInternalAttemptCostEvidenceResult> {
  const startedAt = parse(timestamp, input.startedAt, 'Internal attempt-cost start time is invalid.')
  const finishedAt = parse(timestamp, input.finishedAt, 'Internal attempt-cost finish time is invalid.')
  const elapsed = Date.parse(finishedAt) - Date.parse(startedAt)
  if (!Number.isSafeInteger(elapsed) || elapsed <= 0 || elapsed > 604_800_000) {
    throw invalid('Durable internal attempt-cost duration is outside the bounded worker window.')
  }
  let clockReadCount = 0
  const elapsedNanoseconds = BigInt(elapsed) * 1_000_000n
  const meter = await beginPrivateInternalAttemptCostEvidence(rawInput, {
    nowIso: () => finishedAt,
    monotonicNanoseconds: () => {
      clockReadCount += 1
      return clockReadCount === 1 ? 0n : elapsedNanoseconds
    },
  })
  return meter.finalize({
    status: input.status,
    failureCategory: input.failureCategory,
    outputByteLength: input.outputByteLength,
    linkedCanonicalOutcomeHash: input.linkedCanonicalOutcomeHash,
  })
}

export async function readPrivateInternalAttemptCostEvidence(input: {
  localStorageRoot: string
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): Promise<PrivateInternalAttemptCostEvidence | undefined> {
  const attemptIdentityHash = attemptIdentity(input)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativePath(attemptIdentityHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > 64 * 1024) throw invalid('Stored internal attempt-cost evidence exceeds its byte boundary.')
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Stored internal attempt-cost evidence is not valid JSON.')
  }
  const evidence = parse(privateInternalAttemptCostEvidenceSchema, decoded, 'Stored internal attempt-cost evidence is invalid.')
  if (
    evidence.identity.workspaceId !== input.workspaceId ||
    evidence.identity.projectId !== input.projectId ||
    evidence.identity.executionAttemptId !== input.executionAttemptId ||
    evidence.attemptIdentityHash !== attemptIdentityHash
  ) throw conflict('Stored internal attempt-cost evidence has conflicting identity.')
  const { evidenceHash, ...withoutHash } = evidence
  if (sha256AuthorityValue(withoutHash) !== evidenceHash) throw invalid('Stored internal attempt-cost checksum is invalid.')
  assertNoCommercialFields(evidence)
  return evidence
}

export function privateInternalAttemptCostEvidenceRelativePath(input: {
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): string {
  return relativePath(attemptIdentity(input))
}

function attemptIdentity(input: {
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): string {
  return createHash('sha256').update(stableAuthorityStringify({
    domain: 'private_internal_attempt_cost_identity_v1',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })).digest('hex')
}

function costIdentity(input: BeginPrivateInternalAttemptCostEvidenceInput) {
  const common = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedWorkItemId: input.approvedWorkItemId,
    jobId: input.jobId,
    executionAttemptId: input.executionAttemptId,
    retryAttempt: input.retryAttempt,
    toolId: input.toolId,
    operationId: input.operationId,
  }
  return privateInternalAttemptCostIdentitySchema.parse(
    'workloadProfileId' in input
      ? { ...common, workloadProfileId: input.workloadProfileId }
      : common,
  )
}

function describeParsedAttempt(
  input: BeginPrivateInternalAttemptCostEvidenceInput,
): PrivateInternalAttemptCostDescriptor {
  const identity = costIdentity(input)
  const resourceEnvelope = fixedResourceEnvelope(input)
  return {
    identity,
    attemptIdentityHash: attemptIdentity(input),
    attemptInputHash: sha256AuthorityValue({
      domain: 'private_internal_attempt_cost_input_v1',
      identity,
      rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
      resourceEnvelope,
    }),
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    resourceEnvelope,
  }
}

function fixedResourceEnvelope(
  input: Pick<PrivateInternalAttemptCostEvidence['identity'], 'toolId'> &
    Partial<Pick<Extract<PrivateInternalAttemptCostEvidence['identity'], {
      toolId: 'remotion' | 'ffmpeg' | 'ffprobe' | 'reeditpro_internal'
    }>, 'workloadProfileId'>>,
) {
  const profileId = resolvePrivateInternalAttemptCostProfileId(input)
  if (profileId === PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.deepFilterNetVoiceCleanup) {
    return { vcpuCount: 4 as const, memoryGib: 4 as const, gpuCount: 0 as const }
  }
  if (
    profileId === PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa ||
    profileId === PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa
  ) return { vcpuCount: 2 as const, memoryGib: 2 as const, gpuCount: 0 as const }
  return { vcpuCount: 2 as const, memoryGib: 4 as const, gpuCount: 0 as const }
}

export function resolvePrivateInternalAttemptCostProfileId(
  input: Pick<PrivateInternalAttemptCostEvidence['identity'], 'toolId'> & {
    workloadProfileId?: unknown
  },
): PrivateInternalAttemptCostProfileId {
  if (input.toolId === 'deepfilternet') {
    return PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.deepFilterNetVoiceCleanup
  }
  if (
    input.toolId === 'remotion' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKObjectMezzanineChunk
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffprobe' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeFourKObjectMezzanineChunkQa
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegContinuousProgramAudio
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffprobe' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeContinuousProgramAudioQa
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegCrossChunkColorContinuity
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffmpeg' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegLongFormMasterAssembly
  ) return input.workloadProfileId
  if (
    input.toolId === 'ffprobe' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffprobeLongFormPrivateMasterQa
  ) return input.workloadProfileId
  if (
    input.toolId === 'reeditpro_internal' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.professionalLongFormSnapshotValidation
  ) return input.workloadProfileId
  if (
    input.toolId === 'reeditpro_internal' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormSourceAuthorityValidation
  ) return input.workloadProfileId
  if (
    input.toolId === 'reeditpro_internal' &&
    input.workloadProfileId ===
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS
        .professionalLongFormMasterTimingValidation
  ) return input.workloadProfileId
  throw invalid('Internal attempt-cost workload profile is unsupported.')
}

export function classifyPrivateInternalAttemptCostFailure(
  error: unknown,
): ToolCostFailureCategory {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_FAILED') return 'validation_error'
    if (error.status === 408 || /timeout/i.test(error.message)) return 'timeout'
    return 'reeditpro_error_absorbed'
  }
  if (error instanceof Error && /timeout/i.test(error.message)) return 'timeout'
  return 'unknown'
}

function assertOutcome(input: FinalizePrivateInternalAttemptCostEvidenceInput): void {
  if (input.status === 'completed') {
    if (input.failureCategory !== 'none' || input.outputByteLength === null || !input.linkedCanonicalOutcomeHash) {
      throw invalid('Completed internal attempts require output identity and no failure category.')
    }
    return
  }
  if (input.failureCategory === 'none' || input.linkedCanonicalOutcomeHash !== null) {
    throw invalid('Failed internal attempts require a failure category and no canonical outcome claim.')
  }
}

function assertReplay(
  existing: PrivateInternalAttemptCostEvidence,
  input: FinalizePrivateInternalAttemptCostEvidenceInput,
): void {
  if (
    existing.outcome.status !== input.status ||
    existing.outcome.failureCategory !== input.failureCategory ||
    existing.resourceUsage.outputByteLength !== input.outputByteLength ||
    existing.linkedCanonicalOutcomeHash !== input.linkedCanonicalOutcomeHash
  ) throw conflict('Execution-attempt replay conflicts with immutable internal cost evidence.')
}

function elapsedMilliseconds(start: bigint, finish: bigint): number {
  if (finish < start) throw invalid('Monotonic attempt-cost clock moved backwards.')
  const elapsed = (finish - start + 999_999n) / 1_000_000n
  const milliseconds = Number(elapsed > 0n ? elapsed : 1n)
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) throw invalid('Attempt duration exceeds the integer boundary.')
  return milliseconds
}

function numericBreakdown(value: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry < 0) {
      throw invalid(`Internal attempt-cost breakdown field ${key} is not a safe integer.`)
    }
    result[key] = entry
  }
  return result
}

function assertNoCommercialFields(value: unknown, path = '$'): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoCommercialFields(entry, `${path}[${index}]`))
    return
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
    if (
      normalized.includes('customerprice') || normalized.includes('customercredit') ||
      normalized.includes('servicefee') || normalized.includes('markup') ||
      normalized.includes('margin') || normalized.includes('discount') ||
      normalized.includes('wallet') || normalized.includes('settlement') ||
      normalized.includes('billabletouser') || normalized.includes('toolcostcredit') ||
      normalized === 'credits' || normalized === 'tax' || normalized.startsWith('tax')
    ) throw invalid(`Internal attempt-cost evidence contains forbidden commercial field ${path}.${key}.`)
    assertNoCommercialFields(entry, `${path}.${key}`)
  }
}

function relativePath(attemptIdentityHash: string): string {
  return `canonical-internal-cost-evidence/private-v1/${attemptIdentityHash.slice(0, 2)}/${attemptIdentityHash}.json`
}

function parse<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_internal_attempt_cost_evidence_integrity',
  })
}

function conflict(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate: 'private_internal_attempt_cost_evidence_idempotency',
  })
}
