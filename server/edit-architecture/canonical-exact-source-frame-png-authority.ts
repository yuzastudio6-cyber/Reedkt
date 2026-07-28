import { ApiError } from '../errors/api-error'
import {
  CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegPlanningPayload,
  type OfflineFfmpegExactSourceFramePngPlanningPayload,
} from '../tool-execution/media-binary-execution'

export {
  CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS,
}

interface CanonicalExactSourceFramePngWorkItem {
  readonly workItemType: string
  readonly workerClass: string
  readonly executionInput: Record<string, unknown>
  readonly sourceSequenceItemIds: readonly string[]
  readonly sourceCleanupDecisionIds: readonly string[]
  readonly dependencyKeys: readonly string[]
  readonly approvedToolIds: readonly string[]
  readonly expectedOutputs: ReadonlyArray<{
    readonly outputKey: string
    readonly artifactType?: string
    readonly assetRole: string
    readonly contentType?: string
    readonly required: boolean
    readonly previewPlaceholderAllowed?: boolean
  }>
  readonly providerExecutionMode?: string
}

export function assertCanonicalExactSourceFramePngWorkItem(
  workItem: CanonicalExactSourceFramePngWorkItem,
): OfflineFfmpegExactSourceFramePngPlanningPayload {
  const payload = validateOfflineFfmpegPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  const approvedOperationIds =
    workItem.executionInput.approvedToolOperationIds
  const expectedOutputKeys =
    workItem.executionInput.expectedOutputKeys
  const output = workItem.expectedOutputs[0]
  if (
    payload.recipeProfileId !==
      OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE ||
    workItem.workItemType !== 'process_image_asset' ||
    workItem.workerClass !==
      CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS ||
    workItem.executionInput.operation !==
      CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION ||
    !Array.isArray(approvedOperationIds) ||
    approvedOperationIds.length !== 1 ||
    approvedOperationIds[0] !==
      OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    !Array.isArray(expectedOutputKeys) ||
    expectedOutputKeys.length !== 1 ||
    workItem.sourceSequenceItemIds.length !== 1 ||
    workItem.sourceSequenceItemIds[0] !==
      payload.sourceSequenceItemId ||
    workItem.sourceCleanupDecisionIds.length !== 1 ||
    workItem.sourceCleanupDecisionIds[0] !==
      payload.sourceCleanupDecisionId ||
    workItem.dependencyKeys.length !== 0 ||
    workItem.approvedToolIds.length !== 1 ||
    workItem.approvedToolIds[0] !== 'ffmpeg' ||
    workItem.expectedOutputs.length !== 1 ||
    !output ||
    expectedOutputKeys[0] !== output.outputKey ||
    output.artifactType !==
      CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE ||
    output.assetRole !== 'processed' ||
    output.contentType !== 'image/png' ||
    output.required !== true ||
    output.previewPlaceholderAllowed !== false ||
    workItem.providerExecutionMode !== 'none'
  ) {
    throw invalid(
      'Exact source-frame PNG work item lost its source, frame, tool, or output authority.',
    )
  }
  return payload
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_exact_source_frame_png_authority',
  })
}
