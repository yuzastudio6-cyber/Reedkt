import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  getToolIdentityRecord,
} from '../tool-execution/proven-tool-identity-catalog'
import type { ProfessionalToolOperationSpec } from '../tool-execution/professional-tool-operation-spec-types'
import {
  validateOfflineNodeStructuredExecutionRequest,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-protocol'
import { validateOfflineSharpPlanningPayload } from '../tool-execution/node-runner-execution'
import {
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobePlanningPayload,
  validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload,
} from '../tool-execution/media-binary-execution'
import {
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  isOfflinePythonAudioToolId,
  isOfflinePythonMediaToolId,
  validateOfflinePythonAudioPlanningPayload,
  validateOfflinePythonMediaPlanningPayload,
  validateOfflinePythonStructuredExecutionRequest,
} from '../tool-execution/python-runner-execution/offline-python-structured-execution-protocol'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
  validateOfflineRemotionRenderPlanningPayload,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import {
  assertCanonicalMotionStudioRemotionDependencyBindings,
  assertCanonicalMotionStudioRemotionWorkItem,
  resolveCanonicalMotionStudioRemotionProfile,
} from './canonical-motion-studio-remotion-preview-authority'
import {
  assertCanonicalStorytellingSpeechNormalizationWorkItem,
} from './canonical-storytelling-speech-normalization-authority'
import {
  assertCanonicalExactSourceFramePngWorkItem,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
} from './canonical-exact-source-frame-png-authority'
import {
  assertCanonicalLivingFrameRembgGpuMaskWorkItem,
} from './canonical-living-frame-rembg-gpu-mask-authority'
import {
  assertCanonicalLivingFrameSharpComponentWorkItem,
} from './canonical-living-frame-sharp-component-authority'
import {
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
  type CanonicalLivingFrameRembgGpuMaskWorkItem,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  assertCanonicalVisualCalibrationObjectiveQaWorkItem,
  CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
} from './canonical-visual-calibration-objective-qa-authority'
import {
  validateOfflineRemotionLongFormMergePlanningPayload,
} from '../tool-execution/remotion-render-execution/offline-remotion-long-form-merge-protocol'
import {
  OFFLINE_LIBASS_CAPTION_OPERATION,
  OFFLINE_LIBASS_CAPTION_PROTOCOL,
  validateOfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution/offline-libass-caption-protocol'
import {
  OFFLINE_BROWSER_GRAPHICS_TOOL_IDS,
  buildOfflineBrowserGraphicsApprovedRequest,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-protocol'
import {
  OFFLINE_AI_CAPABILITY_TOOL_IDS,
  buildOfflineAiCapabilityApprovedRequest,
} from '../tool-execution/ai-capability-execution/offline-ai-capability-protocol'
import {
  OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS,
  buildOfflineNativeImagePipelineApprovedRequest,
} from '../tool-execution/native-image-pipeline-execution/offline-native-image-pipeline-protocol'
import {
  OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS,
  buildOfflineNativeAudioProcessingApprovedRequest,
} from '../tool-execution/native-audio-processing-execution/offline-native-audio-processing-protocol'
import {
  OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS,
  buildOfflineContainerPackagingValidationApprovedRequest,
} from '../tool-execution/container-packaging-validation-execution/offline-container-packaging-validation-protocol'
import {
  OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS,
  buildOfflineVapourSynthFramePipelineApprovedRequest,
} from '../tool-execution/vapoursynth-frame-pipeline-execution/offline-vapoursynth-frame-pipeline-protocol'
import {
  OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS,
  buildOfflineAudioFluxAnalysisApprovedRequest,
} from '../tool-execution/audioflux-analysis-execution/offline-audioflux-analysis-protocol'
import {
  OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS,
  buildOfflineRembgBackgroundRemovalApprovedRequest,
} from '../tool-execution/rembg-background-removal-execution/offline-rembg-background-removal-protocol'
import {
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS,
  buildOfflineDeepFilterNetVoiceCleanupApprovedRequest,
} from '../tool-execution/deepfilternet-voice-cleanup-execution/offline-deepfilternet-voice-cleanup-protocol'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import { isProductionToolId, type ProductionToolId } from '../tool-registry'
import { sha256AuthorityValue, stableAuthorityStringify } from '../services/private-edit-authority-store'
import {
  CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS,
} from '../../src/types/canonical-private-composition-capacity'

export const CANONICAL_TOOL_PAYLOAD_AUTHORITY_VERSION =
  'canonical-tool-payload-authority-v1' as const
export const CANONICAL_TOOL_PAYLOAD_VALIDATION_VERSION =
  'canonical-tool-payload-validation-v1' as const

const DIRECT_FINAL_COMPOSITION_OPERATIONS = new Set([
  'render_approved_source_caption_final',
  'render_approved_source_sequence_caption_final',
  'render_approved_source_caption_track_final',
  'render_approved_source_sequence_caption_track_final',
])

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

const expectedOutputSchema = z.object({
  outputKey: safeKey,
  assetRole: z.enum(['processed', 'generated', 'qa', 'preview', 'final']),
  contentType: z.string().trim().min(1).max(160),
  required: z.boolean(),
}).strict()

const validationEntrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_TOOL_PAYLOAD_VALIDATION_VERSION),
  workItemKey: safeKey,
  canonicalToolId: safeKey,
  operationId: safeKey,
  validatorFamily: z.enum([
    'node_structured',
    'sharp',
    'sharp_living_frame_alpha_component',
    'python_structured',
    'python_source_media',
    'python_source_audio',
    'media_ffmpeg',
    'media_ffprobe',
    'remotion_preview',
    'remotion_motion_studio_preview',
    'remotion_final_composition',
    'libass_caption',
    'browser_graphics',
    'ai_capability',
    'native_image_pipeline',
    'native_audio_processing',
    'container_packaging_validation',
    'vapoursynth_frame_pipeline',
    'audioflux_analysis',
    'rembg_background_removal',
    'rembg_gpu_mask_planning',
    'deepfilternet_voice_cleanup',
  ]),
  structuredPayloadHash: sha256,
  sourceSequenceItemIds: z.array(safeKey).max(1_000),
  sourceCleanupDecisionIds: z.array(safeKey).max(10_000),
  dependencyKeys: z.array(safeKey).max(128),
  expectedOutputs: z.array(expectedOutputSchema).min(1).max(128),
  bindingHash: sha256,
  validationHash: sha256,
}).strict()

export const canonicalToolPayloadAuthoritySchema = z.object({
  schemaVersion: z.literal(CANONICAL_TOOL_PAYLOAD_AUTHORITY_VERSION),
  source: z.literal('server_exact_runner_payload_reconciliation'),
  validatedWorkItems: z.array(validationEntrySchema).max(256),
  optionalUnprovenWorkItemKeys: z.array(safeKey).max(256),
  summary: z.object({
    toolBackedWorkItemCount: z.number().int().nonnegative(),
    validatedWorkItemCount: z.number().int().nonnegative(),
    optionalUnprovenWorkItemCount: z.number().int().nonnegative(),
    allRequiredToolPayloadsValidated: z.literal(true),
    validationRunsBeforeApproval: z.literal(true),
    frontendExecutionAllowed: z.literal(false),
    providerExecutionAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  authorityHash: sha256,
}).strict()

export type CanonicalToolPayloadAuthority = z.infer<typeof canonicalToolPayloadAuthoritySchema>
export type CanonicalToolPayloadValidation = z.infer<typeof validationEntrySchema>

export interface CanonicalToolPayloadWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  providerExecutionMode?: string
  maxAttempts?: number
  expectedOutputs: Array<{
    outputKey: string
    artifactType?: string
    assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
  }>
  required: boolean
}

export function createCanonicalToolPayloadAuthority(input: {
  workItems: CanonicalToolPayloadWorkItem[]
}): CanonicalToolPayloadAuthority {
  const toolBacked = input.workItems.filter((workItem) => workItem.approvedToolIds.length > 0)
  const validatedWorkItems: CanonicalToolPayloadValidation[] = []
  const optionalUnprovenWorkItemKeys: string[] = []
  for (const workItem of toolBacked) {
    if (workItem.approvedToolIds.length !== 1) {
      throw invalidPayload(
        'Canonical payload authority requires atomic one-tool work items.',
        workItem.workItemKey,
        'canonical_atomic_tool_work_item',
      )
    }
    const rawToolId = workItem.approvedToolIds[0]!
    if (!isProductionToolId(rawToolId)) {
      throw invalidPayload(
        'Canonical payload authority cannot resolve a production tool identity.',
        workItem.workItemKey,
        'canonical_tool_identity',
      )
    }
    const record = getToolIdentityRecord(rawToolId)
    if (!record.readiness.privateInternalJobAdapterReady) {
      if (workItem.required) {
        throw invalidPayload(
          'A required tool work item has no proven canonical job adapter.',
          workItem.workItemKey,
          'canonical_tool_identity_e2e_and_job_adapter_evidence',
        )
      }
      optionalUnprovenWorkItemKeys.push(workItem.workItemKey)
      continue
    }
    const spec = resolveCompleteProfessionalToolOperationSpec(rawToolId)
    if (!spec || spec.allowedOperationIds.length !== 1) {
      throw invalidPayload(
        'Canonical payload authority cannot resolve one exact operation contract.',
        workItem.workItemKey,
        'canonical_tool_operation_contract',
      )
    }
    validatedWorkItems.push(validateCanonicalToolWorkItemPayload({ spec, workItem }))
  }
  assertCanonicalMotionStudioRemotionDependencyBindings(input.workItems)
  validatedWorkItems.sort((left, right) => left.workItemKey.localeCompare(right.workItemKey))
  optionalUnprovenWorkItemKeys.sort()
  const payload = {
    schemaVersion: CANONICAL_TOOL_PAYLOAD_AUTHORITY_VERSION,
    source: 'server_exact_runner_payload_reconciliation' as const,
    validatedWorkItems,
    optionalUnprovenWorkItemKeys,
    summary: {
      toolBackedWorkItemCount: toolBacked.length,
      validatedWorkItemCount: validatedWorkItems.length,
      optionalUnprovenWorkItemCount: optionalUnprovenWorkItemKeys.length,
      allRequiredToolPayloadsValidated: true as const,
      validationRunsBeforeApproval: true as const,
      frontendExecutionAllowed: false as const,
      providerExecutionAuthorized: false as const,
      customerBillingAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalToolPayloadAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalToolPayloadAuthority(input: {
  value: unknown
  workItems: CanonicalToolPayloadWorkItem[]
}): CanonicalToolPayloadAuthority {
  const parsed = canonicalToolPayloadAuthoritySchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalidPersisted('Canonical tool payload authority is invalid.', {
      validation: parsed.error.flatten(),
    })
  }
  const authority = parsed.data
  const { authorityHash, ...payload } = authority
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw invalidPersisted('Canonical tool payload authority hash is invalid.')
  }
  const current = createCanonicalToolPayloadAuthority({ workItems: input.workItems })
  if (stableAuthorityStringify(current) !== stableAuthorityStringify(authority)) {
    throw invalidPersisted(
      'Canonical tool payload authority no longer matches immutable work-item execution inputs.',
    )
  }
  return authority
}

export function validateCanonicalToolWorkItemPayload(input: {
  spec: ProfessionalToolOperationSpec
  workItem: CanonicalToolPayloadWorkItem
}): CanonicalToolPayloadValidation {
  const { spec, workItem } = input
  const operationIds = workItem.executionInput.approvedToolOperationIds
  const operationId = spec.allowedOperationIds[0]
  if (
    workItem.approvedToolIds.length !== 1 ||
    workItem.approvedToolIds[0] !== spec.canonicalToolId ||
    !Array.isArray(operationIds) || operationIds.length !== 1 ||
    operationIds[0] !== operationId
  ) {
    throw invalidPayload(
      'Canonical tool payload does not match exact tool and operation authority.',
      workItem.workItemKey,
      'approved_work_item_exact_tool_operation_id',
    )
  }
  const structuredPayload = workItem.executionInput.structuredPayload
  let validatorFamily: CanonicalToolPayloadValidation['validatorFamily']
  try {
    validatorFamily = validateByRunnerFamily(spec, workItem, structuredPayload)
    validateArtifactAndNetworkPolicy(spec, workItem)
  } catch (error) {
    if (
      error instanceof ApiError &&
      typeof error.details === 'object' &&
      error.details !== null &&
      'requiredGate' in error.details
    ) throw error
    throw invalidPayload(
      'Canonical work item does not contain a runner-valid bounded structured payload and binding.',
      workItem.workItemKey,
      'canonical_runner_structured_payload',
      { canonicalToolId: spec.canonicalToolId, validatorFamily: familyHint(spec.canonicalToolId) },
    )
  }
  const expectedOutputs = workItem.expectedOutputs.map((output) => {
    if (!output.contentType) {
      throw invalidPayload(
        'Tool-backed canonical outputs require an exact content type before approval.',
        workItem.workItemKey,
        'canonical_tool_output_content_type',
      )
    }
    return {
      outputKey: output.outputKey,
      assetRole: output.assetRole,
      contentType: output.contentType,
      required: output.required,
    }
  })
  const binding = {
    workItemKey: workItem.workItemKey,
    canonicalToolId: spec.canonicalToolId,
    operationId,
    validatorFamily,
    structuredPayloadHash: sha256AuthorityValue(structuredPayload),
    sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
    sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
    dependencyKeys: [...workItem.dependencyKeys],
    expectedOutputs,
  }
  const bindingHash = sha256AuthorityValue(binding)
  const withoutValidationHash = {
    schemaVersion: CANONICAL_TOOL_PAYLOAD_VALIDATION_VERSION,
    ...binding,
    bindingHash,
  }
  return validationEntrySchema.parse({
    ...withoutValidationHash,
    validationHash: sha256AuthorityValue(withoutValidationHash),
  })
}

function validateByRunnerFamily(
  spec: ProfessionalToolOperationSpec,
  workItem: CanonicalToolPayloadWorkItem,
  structuredPayload: unknown,
): CanonicalToolPayloadValidation['validatorFamily'] {
  const toolId = spec.canonicalToolId
  const operationId = spec.allowedOperationIds[0]
  if (toolId === 'sharp') {
    validateOfflineSharpPlanningPayload(structuredPayload)
    if (
      workItem.executionInput.operation ===
        CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION
    ) {
      assertCanonicalLivingFrameSharpComponentWorkItem(
        workItem,
      )
      const generatedSourceBranch =
        workItem.sourceSequenceItemIds.length === 0
        && workItem.sourceCleanupDecisionIds.length === 0
      requireBinding(workItem, {
        source: generatedSourceBranch ? 0 : 1,
        cleanup: generatedSourceBranch ? 0 : 1,
        dependencies: 2,
      })
      return 'sharp_living_frame_alpha_component'
    }
    requireBinding(workItem, {
      source: 0,
      cleanup: 0,
      dependencies: 1,
    })
    return 'sharp'
  }
  if (toolId === 'ffmpeg') {
    if (
      workItem.executionInput.operation ===
        CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION
    ) {
      assertCanonicalVisualCalibrationObjectiveQaWorkItem(workItem)
      requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 1 })
      return 'media_ffmpeg'
    }
    if (
      workItem.executionInput.operation ===
        'normalize_approved_storytelling_speech_take'
    ) {
      assertCanonicalStorytellingSpeechNormalizationWorkItem(workItem)
      requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 1 })
      return 'media_ffmpeg'
    }
    if (
      workItem.executionInput.operation ===
        CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION
    ) {
      assertCanonicalExactSourceFramePngWorkItem(
        workItem,
      )
      requireBinding(workItem, {
        source: 1,
        cleanup: 1,
        dependencies: 0,
      })
      return 'media_ffmpeg'
    }
    if (
      workItem.workItemType === 'render_final_export' &&
      workItem.workerClass === 'render_worker' &&
      workItem.executionInput.operation ===
        'finalize_approved_4k_mezzanine_chunks'
    ) {
      const payload =
        validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
          structuredPayload,
        )
      requireBinding(workItem, {
        source: 1,
        cleanup: 1,
        dependencies: payload.chunks.length + 1,
      })
      if (
        payload.capacityProfileId !==
          CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID ||
        payload.chunks.length < 2 ||
        payload.chunks.length >
          CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS ||
        workItem.dependencyKeys[0] !== 'source-trim-validation' ||
        workItem.expectedOutputs.length !== 1 ||
        workItem.expectedOutputs[0]?.assetRole !== 'final' ||
        workItem.expectedOutputs[0]?.contentType !== 'video/mp4' ||
        workItem.sourceSequenceItemIds[0] !== payload.sourceSequenceItemId ||
        workItem.sourceCleanupDecisionIds[0] !==
          payload.sourceCleanupDecisionId
      ) throw invalidPayload(
        'FFmpeg mezzanine finalization lost its exact source, chunk, or final-output authority.',
        workItem.workItemKey,
        'canonical_ffmpeg_mezzanine_finalization_authority',
      )
      return 'media_ffmpeg'
    }
    const payload = validateOfflineFfmpegPlanningPayload(structuredPayload)
    if (
      payload.recipeProfileId === 'approved_edit_brief_music_bed_wav_v1' ||
      payload.recipeProfileId === 'approved_edit_brief_sfx_wav_v1'
    ) {
      requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
      if (
        workItem.workItemType !== 'process_audio_asset' ||
        workItem.workerClass !== 'audio_processing_worker' ||
        workItem.executionInput.operation !==
          'process_approved_edit_brief_audio_attachment' ||
        workItem.expectedOutputs.length !== 1 ||
        workItem.expectedOutputs[0]?.assetRole !== 'processed' ||
        workItem.expectedOutputs[0]?.contentType !== 'audio/wav'
      ) {
        throw invalidPayload(
          'Edit Brief audio processing lost its exact work-item or WAV-output authority.',
          workItem.workItemKey,
          'canonical_edit_brief_audio_processing_authority',
        )
      }
      return 'media_ffmpeg'
    }
    requireBinding(workItem, {
      source: 1,
      cleanup: 1,
      dependencies: payload.recipeProfileId ===
        'approved_source_color_match_delivery_matroska_v1'
        ? 1
        : 0,
    })
    return 'media_ffmpeg'
  }
  if (toolId === 'ffprobe') {
    const payload = validateOfflineFfprobePlanningPayload(structuredPayload)
    const finalQa = workItem.workItemType === 'run_final_qa' && workItem.workerClass === 'qa_worker' &&
      workItem.sourceSequenceItemIds.length === 0 && workItem.sourceCleanupDecisionIds.length === 0 &&
      workItem.dependencyKeys.length === 1 &&
      payload.inspectionProfileId === 'final_export_v1' && payload.countFrames === true
    if (finalQa) return 'media_ffprobe'
    requireBinding(workItem, { source: 1, cleanup: 1, dependencies: 0 })
    return 'media_ffprobe'
  }
  if (toolId === 'remotion') {
    const motionStudioProfile = resolveCanonicalMotionStudioRemotionProfile(structuredPayload)
    if (motionStudioProfile) {
      assertCanonicalMotionStudioRemotionWorkItem(workItem, motionStudioProfile)
      return 'remotion_motion_studio_preview'
    }
    if (
      workItem.workItemType === 'render_final_export' &&
      workItem.executionInput.operation === 'merge_approved_4k_composition_chunks'
    ) {
      const payload = validateOfflineRemotionLongFormMergePlanningPayload(structuredPayload)
      const sourceBindingCount = new Set(payload.chunks.flatMap((chunk) =>
        chunk.sourceSequenceItemIds)).size
      const cleanupBindingCount = new Set(payload.chunks.flatMap((chunk) =>
        chunk.sourceCleanupDecisionIds)).size
      requireBinding(workItem, {
        source: sourceBindingCount,
        cleanup: cleanupBindingCount,
        dependencies: payload.chunks.length,
      })
      return 'remotion_final_composition'
    }
    const compositionChunk = workItem.workItemType === 'custom' &&
      workItem.executionInput.operation === 'render_approved_4k_composition_chunk'
    const directFinalComposition = workItem.workItemType === 'render_final_export' &&
      typeof workItem.executionInput.operation === 'string' &&
      DIRECT_FINAL_COMPOSITION_OPERATIONS.has(workItem.executionInput.operation)
    if (workItem.workItemType === 'render_final_export' && !directFinalComposition) {
      throw invalidPayload(
        'Remotion final composition has an unsupported operation identity.',
        workItem.workItemKey,
        'canonical_remotion_final_composition_operation',
      )
    }
    if (directFinalComposition || compositionChunk) {
      const payload = validateOfflineRemotionFinalCompositionPlanningPayload(structuredPayload)
      const sourceCount = 'sourceSegments' in payload
        ? payload.sourceSegments.length
        : 1
      const captionCount = 'captionOverlayCues' in payload
        ? payload.captionOverlayCues.length
        : 1
      const voiceTrackCount = payload.audioPolicy === 'replace_with_approved_voice_tracks'
        ? (payload.voiceTracks?.length ?? 0)
        : 0
      const supplementalAudioTrackCount =
        payload.supplementalAudioPolicy ===
          'approved_edit_brief_audio_tracks_v1'
          ? (payload.supplementalAudioTracks?.length ?? 0)
          : 0
      const colorSourceCount = 'sourceMediaPolicy' in payload &&
        payload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
        ? sourceCount
        : 0
      const livingFrameDependencyCount =
        payload.livingFrameOverlayPolicy ===
          'approved_rgba_over_source_below_captions_v1'
          ? (payload.livingFrameOverlayLayers?.length ?? 0) * 2
          : 0
      requireBinding(workItem, {
        source: sourceCount,
        cleanup: sourceCount,
        dependencies:
          1 + captionCount + voiceTrackCount + supplementalAudioTrackCount +
          colorSourceCount + livingFrameDependencyCount,
      })
      if (compositionChunk) {
        const chunkAuthority = workItem.executionInput.chunkAuthority
        const chunk = chunkAuthority && typeof chunkAuthority === 'object' &&
          !Array.isArray(chunkAuthority)
          ? chunkAuthority as Record<string, unknown>
          : undefined
        const sourceSliceProfile = chunk?.profileId ===
          CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID ||
          chunk?.profileId ===
            CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
        const sourceBoundaryProfile = chunk?.profileId ===
          CANONICAL_PRIVATE_LONG_FORM_CAPACITY_PROFILE_ID
        if (
          (!sourceBoundaryProfile && !sourceSliceProfile) ||
          supplementalAudioTrackCount !== 0 ||
          !Number.isSafeInteger(chunk.chunkIndex) || !Number.isSafeInteger(chunk.chunkCount) ||
          Number(chunk.chunkIndex) < 1 || Number(chunk.chunkIndex) > Number(chunk.chunkCount) ||
          Number(chunk.chunkCount) < 2 ||
          Number(chunk.chunkCount) > (sourceSliceProfile
            ? CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS
            : 8) ||
          (sourceSliceProfile && (
            !Number.isSafeInteger(chunk.sourceStartFrame) ||
            !Number.isSafeInteger(chunk.sourceEndFrameExclusive) ||
            Number(chunk.sourceStartFrame) < 0 ||
            Number(chunk.sourceEndFrameExclusive) - Number(chunk.sourceStartFrame) !==
              Number(chunk.durationFrames) ||
            chunk.sourceSliceKey !==
              `source-slice-${String(chunk.chunkIndex)}-of-${String(chunk.chunkCount)}`
          )) ||
          chunk.durationFrames !== payload.durationFrames ||
          workItem.expectedOutputs.length !== 1 ||
          workItem.expectedOutputs[0]?.assetRole !== 'processed' ||
          workItem.expectedOutputs[0]?.contentType !== 'video/mp4' ||
          chunk.outputKey !== workItem.expectedOutputs[0]?.outputKey
        ) throw invalidPayload(
          'Remotion composition chunk lost its exact approved long-form authority.',
          workItem.workItemKey,
          'canonical_remotion_composition_chunk_authority',
        )
      }
      return 'remotion_final_composition'
    }
    validateOfflineRemotionRenderPlanningPayload(structuredPayload)
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'remotion_preview'
  }
  if (toolId === 'libass') {
    validateOfflineLibassCaptionRequest({
      schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL,
      toolId: 'libass',
      operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
      payload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'libass_caption'
  }
  if ((OFFLINE_BROWSER_GRAPHICS_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineBrowserGraphicsApprovedRequest({
      toolId,
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'browser_graphics'
  }
  if ((OFFLINE_AI_CAPABILITY_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineAiCapabilityApprovedRequest({
      toolId: toolId as (typeof OFFLINE_AI_CAPABILITY_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'ai_capability'
  }
  if ((OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineNativeImagePipelineApprovedRequest({
      toolId: toolId as (typeof OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'native_image_pipeline'
  }
  if ((OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineNativeAudioProcessingApprovedRequest({
      toolId: toolId as (typeof OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'native_audio_processing'
  }
  if ((OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineContainerPackagingValidationApprovedRequest({
      toolId: toolId as (typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'container_packaging_validation'
  }
  if ((OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineVapourSynthFramePipelineApprovedRequest({
      toolId: toolId as (typeof OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'vapoursynth_frame_pipeline'
  }
  if ((OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineAudioFluxAnalysisApprovedRequest({
      toolId: toolId as (typeof OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'audioflux_analysis'
  }
  if ((OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS as readonly string[]).includes(toolId)) {
    if (
      workItem.executionInput.operation ===
        CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION
    ) {
      assertCanonicalLivingFrameRembgGpuMaskWorkItem(
        workItem,
      )
      const sourceDependency =
        (workItem as unknown as
          CanonicalLivingFrameRembgGpuMaskWorkItem)
          .executionInput.structuredPayload
          .sourceDependency
      const generatedSourceBranch =
        sourceDependency.sourceVariant ===
          'living_frame_generated_opaque_still'
      requireBinding(workItem, {
        source: generatedSourceBranch ? 0 : 1,
        cleanup: generatedSourceBranch ? 0 : 1,
        dependencies: 1,
      })
      return 'rembg_gpu_mask_planning'
    }
    buildOfflineRembgBackgroundRemovalApprovedRequest({
      toolId: toolId as (typeof OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'rembg_background_removal'
  }
  if ((OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS as readonly string[]).includes(toolId)) {
    buildOfflineDeepFilterNetVoiceCleanupApprovedRequest({
      toolId: toolId as (typeof OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS)[number],
      operationId,
      planningPayload: structuredPayload,
    })
    requireBinding(workItem, { source: 0, cleanup: 0, dependencies: 0 })
    return 'deepfilternet_voice_cleanup'
  }
  if (isOfflinePythonMediaToolId(toolId)) {
    validateOfflinePythonMediaPlanningPayload(toolId, structuredPayload)
    requireBinding(workItem, { source: 1, cleanup: 1, dependencies: 0 })
    return 'python_source_media'
  }
  if (isOfflinePythonAudioToolId(toolId)) {
    validateOfflinePythonAudioPlanningPayload(toolId, structuredPayload)
    requireBinding(workItem, { source: 1, cleanup: 1, dependencies: 0 })
    return 'python_source_audio'
  }
  if (['duckdb', 'polars', 'opentimelineio'].includes(toolId)) {
    validateOfflinePythonStructuredExecutionRequest({
      schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
      toolId,
      operationId,
      payload: structuredPayload,
    })
    return 'python_structured'
  }
  validateOfflineNodeStructuredExecutionRequest({
    toolId,
    operationId,
    payload: structuredPayload,
  })
  return 'node_structured'
}

function validateArtifactAndNetworkPolicy(
  spec: ProfessionalToolOperationSpec,
  workItem: CanonicalToolPayloadWorkItem,
): void {
  const record = getToolIdentityRecord(spec.canonicalToolId)
  const allowedContentTypes = record.artifactContract.verifiedOutputContentTypes
  const exactFfmpegMezzanineFinalization = spec.canonicalToolId === 'ffmpeg' &&
    workItem.workItemType === 'render_final_export' &&
    workItem.workerClass === 'render_worker' &&
    workItem.executionInput.operation ===
      'finalize_approved_4k_mezzanine_chunks' &&
    workItem.expectedOutputs.length === 1 &&
    workItem.expectedOutputs[0]?.assetRole === 'final' &&
    workItem.expectedOutputs[0]?.contentType === 'video/mp4'
  const exactVisualCalibrationObjectiveQa = spec.canonicalToolId === 'ffmpeg' &&
    workItem.workItemType === 'run_asset_qa' &&
    workItem.workerClass === 'qa_worker' &&
    workItem.executionInput.operation ===
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION &&
    workItem.expectedOutputs.length === 1 &&
    workItem.expectedOutputs[0]?.assetRole === 'qa' &&
    workItem.expectedOutputs[0]?.contentType === 'application/json'
  const exactSourceFramePng = spec.canonicalToolId === 'ffmpeg' &&
    workItem.executionInput.operation ===
      CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION &&
    workItem.expectedOutputs.length === 1 &&
    workItem.expectedOutputs[0]?.assetRole === 'processed' &&
    workItem.expectedOutputs[0]?.contentType === 'image/png'
  for (const output of workItem.expectedOutputs) {
    if (
      !output.contentType ||
      (!allowedContentTypes.includes(output.contentType) &&
        !(exactFfmpegMezzanineFinalization && output.contentType === 'video/mp4') &&
        !(exactVisualCalibrationObjectiveQa && output.contentType === 'application/json') &&
        !(exactSourceFramePng && output.contentType === 'image/png'))
    ) {
      throw invalidPayload(
        'Canonical tool output content type is not covered by exact private artifact evidence.',
        workItem.workItemKey,
        'canonical_tool_verified_output_content_type',
        { canonicalToolId: spec.canonicalToolId, outputKey: output.outputKey },
      )
    }
  }
  const exactFinalComposition = exactFfmpegMezzanineFinalization || (
    spec.canonicalToolId === 'remotion' &&
    workItem.workItemType === 'render_final_export' &&
    workItem.workerClass === 'render_worker' &&
    workItem.expectedOutputs.every((output) =>
      output.assetRole === 'final' && output.contentType === 'video/mp4')
  )
  const exactPlaywrightCapture = spec.canonicalToolId === 'playwright' &&
    (workItem.executionInput.structuredPayload as Record<string, unknown>)?.capturePolicyConfirmed === true &&
    workItem.expectedOutputs.every((output) => output.assetRole !== 'final' && output.contentType === 'image/png')
  if (
    spec.networkPolicy.mode !== 'offline_required' ||
    spec.networkPolicy.networkGrantRequired ||
    spec.credentialGate.providerCredentialsAllowed ||
    (spec.credentialGate.captureAuthorizationRequired && !exactPlaywrightCapture) ||
    spec.declaredPrivateOutputArtifactKinds.length === 0 ||
    (workItem.expectedOutputs.some((output) => output.assetRole === 'final') && !exactFinalComposition)
  ) {
    throw invalidPayload(
      'Canonical payload authority supports offline non-provider work plus the exact private Remotion final-composition profile.',
      workItem.workItemKey,
      'canonical_private_offline_tool_policy',
      { canonicalToolId: spec.canonicalToolId },
    )
  }
}

function requireBinding(
  workItem: CanonicalToolPayloadWorkItem,
  expected: { source: number; cleanup: number; dependencies: number },
): void {
  if (
    workItem.sourceSequenceItemIds.length !== expected.source ||
    workItem.sourceCleanupDecisionIds.length !== expected.cleanup ||
    workItem.dependencyKeys.length !== expected.dependencies
  ) throw new Error('Canonical work-item binding shape is unsupported by its exact runner family.')
}

function familyHint(toolId: ProductionToolId): string {
  if (toolId === 'sharp') return 'sharp'
  if (toolId === 'ffmpeg' || toolId === 'ffprobe') return 'media_binary'
  if (toolId === 'remotion') return 'remotion'
  if (toolId === 'libass') return 'libass_caption'
  if ((OFFLINE_BROWSER_GRAPHICS_TOOL_IDS as readonly string[]).includes(toolId)) return 'browser_graphics'
  if ((OFFLINE_AI_CAPABILITY_TOOL_IDS as readonly string[]).includes(toolId)) return 'ai_capability'
  if ((OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS as readonly string[]).includes(toolId)) return 'native_image_pipeline'
  if ((OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS as readonly string[]).includes(toolId)) return 'native_audio_processing'
  if ((OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS as readonly string[]).includes(toolId)) return 'container_packaging_validation'
  if ((OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS as readonly string[]).includes(toolId)) return 'vapoursynth'
  if ((OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS as readonly string[]).includes(toolId)) return 'audioflux'
  if ((OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS as readonly string[]).includes(toolId)) return 'rembg'
  if ((OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS as readonly string[]).includes(toolId)) return 'deepfilternet'
  if (isOfflinePythonMediaToolId(toolId) || isOfflinePythonAudioToolId(toolId)) return 'python_source'
  if (['duckdb', 'polars', 'opentimelineio'].includes(toolId)) return 'python_structured'
  return 'node_structured'
}

function invalidPayload(
  message: string,
  workItemKey: string,
  requiredGate: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate,
    workItemKey,
    ...details,
  })
}

function invalidPersisted(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}
