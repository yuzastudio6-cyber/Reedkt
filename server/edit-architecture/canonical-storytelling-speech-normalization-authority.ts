import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegPlanningPayload,
  type OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'

export const CANONICAL_STORYTELLING_SPEECH_NORMALIZATION_OUTPUT_ROLE =
  'normalized_storytelling_speech_take' as const
export const CANONICAL_STORYTELLING_SPEECH_NORMALIZATION_WORK_ITEM_OPERATION =
  'normalize_approved_storytelling_speech_take' as const

export interface CanonicalStorytellingSpeechNormalizationWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: readonly string[]
  sourceCleanupDecisionIds: readonly string[]
  dependencyKeys: readonly string[]
  approvedToolIds: readonly string[]
  expectedOutputs: ReadonlyArray<{
    outputKey: string
    artifactType?: string
    assetRole: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
    segmentIds?: readonly string[]
    timingIds?: readonly string[]
  }>
  providerExecutionMode?: string
}

export function deriveCanonicalStorytellingSpeechSourceAuthorityDigest(
  payload: Omit<
    OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload,
    'sourceAuthorityDigest'
  >,
): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-storytelling-speech-source-authority:v1',
    productionId: payload.productionId,
    productionAuthorityHash: payload.productionAuthorityHash,
    preparedScriptSegmentId: payload.preparedScriptSegmentId,
    sceneId: payload.sceneId,
    voiceBibleVersionId: payload.voiceBibleVersionId,
    voiceBibleContentDigest: payload.voiceBibleContentDigest,
    spokenTextDigest: payload.spokenTextDigest,
    timingAuthorityDigest: payload.timingAuthorityDigest,
    startFrame: payload.startFrame,
    endFrameExclusive: payload.endFrameExclusive,
    frameRate: payload.frameRate,
    sourceProviderOperationId: payload.sourceProviderOperationId,
    sourceAudioRole: payload.sourceAudioRole,
    sourceAlignmentRole: payload.sourceAlignmentRole,
  })
}

export function validateCanonicalStorytellingSpeechNormalizationPayload(
  value: unknown,
): OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload {
  const payload = validateOfflineFfmpegPlanningPayload(value)
  if (
    payload.recipeProfileId !==
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID
  ) throw invalid('Storytelling Speech normalization requires its exact fixed recipe.')
  const { sourceAuthorityDigest, ...sourceAuthority } = payload
  if (
    sourceAuthorityDigest !==
      deriveCanonicalStorytellingSpeechSourceAuthorityDigest(sourceAuthority)
  ) throw invalid('Storytelling Speech source authority digest is invalid.')
  return payload
}

export function assertCanonicalStorytellingSpeechNormalizationWorkItem(
  workItem: CanonicalStorytellingSpeechNormalizationWorkItem,
): OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload {
  const payload = validateCanonicalStorytellingSpeechNormalizationPayload(
    workItem.executionInput.structuredPayload,
  )
  const approvedOperationIds = workItem.executionInput.approvedToolOperationIds
  const expectedOutputKeys = workItem.executionInput.expectedOutputKeys
  const output = workItem.expectedOutputs[0]
  if (
    workItem.workItemType !== 'custom' ||
    workItem.workerClass !== 'audio_processing_worker' ||
    workItem.executionInput.operation !==
      CANONICAL_STORYTELLING_SPEECH_NORMALIZATION_WORK_ITEM_OPERATION ||
    !Array.isArray(approvedOperationIds) ||
    approvedOperationIds.length !== 1 ||
    approvedOperationIds[0] !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    !Array.isArray(expectedOutputKeys) || expectedOutputKeys.length !== 1 ||
    workItem.sourceSequenceItemIds.length !== 0 ||
    workItem.sourceCleanupDecisionIds.length !== 0 ||
    workItem.dependencyKeys.length !== 1 ||
    workItem.approvedToolIds.length !== 1 ||
    workItem.approvedToolIds[0] !== 'ffmpeg' ||
    workItem.expectedOutputs.length !== 1 || !output ||
    expectedOutputKeys[0] !== output.outputKey ||
    output.artifactType !==
      CANONICAL_STORYTELLING_SPEECH_NORMALIZATION_OUTPUT_ROLE ||
    output.assetRole !== 'processed' || output.contentType !== 'audio/wav' ||
    output.required !== true || output.previewPlaceholderAllowed !== false ||
    output.segmentIds?.length !== 1 ||
    output.segmentIds[0] !== payload.preparedScriptSegmentId ||
    !output.timingIds?.includes(payload.timingAuthorityDigest) ||
    workItem.providerExecutionMode !== 'none'
  ) throw invalid(
    'Storytelling Speech normalization work item lost its exact dependency, output, segment, or timing authority.',
  )
  return payload
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_storytelling_speech_normalization_authority',
  })
}
