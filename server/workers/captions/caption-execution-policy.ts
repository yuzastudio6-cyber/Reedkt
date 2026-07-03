import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../media/media-path-safety'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields, findForbiddenWorkerPayloadEntries } from '../production/production-worker-artifact-policy'
import type { CaptionExecutionInput } from '../speech-caption/speech-caption-pipeline-types'

export interface CaptionExecutionPolicyResult {
  allowed: boolean
  warnings: string[]
  blockingReasons: string[]
}

export function validateCaptionExecutionPolicy(input: CaptionExecutionInput): CaptionExecutionPolicyResult {
  const findings = findForbiddenWorkerPayloadEntries(input)
  if (findings.length > 0) {
    throw new Error(`Caption execution input contains forbidden raw prompt, signed URL, or secret fields: ${findings.join(', ')}`)
  }

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  for (const [label, value] of [
    ['outputDirectory', input.outputDirectory],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
  ] as const) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }

  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (input.mode === 'production_blocked') {
    blockingReasons.push('production_blocked mode refuses caption render/preview execution.')
  }

  if (input.mode === 'production_ready') {
    const transcriptSegmentCount = input.transcriptSegments?.length ??
      input.transcript?.segments.length ??
      0
    const wordTimestampCount = Array.isArray(input.wordTimestamps)
      ? input.wordTimestamps.length
      : input.wordTimestamps?.words.length ?? 0

    if (transcriptSegmentCount === 0 && wordTimestampCount === 0) {
      blockingReasons.push('production_ready caption metadata requires approved transcript segments or word timestamps; mock caption text is not allowed.')
    }

    if (input.buildPreview || input.enableCaptionPreview) {
      blockingReasons.push('production_ready caption metadata cannot render previews or burn captions.')
    }

    if (input.sourceVideoLocalPath) {
      blockingReasons.push('production_ready caption metadata cannot consume local source video paths.')
    }

    if (input.outputDirectory) {
      blockingReasons.push('production_ready caption metadata cannot write local caption files; it may only record private artifact metadata.')
    }

    if (blockingReasons.length === 0) {
      warnings.push('production_ready caption metadata is limited to private caption text artifacts and QA; final render/export remains blocked.')
    }
  }

  if (input.buildPreview && !input.enableCaptionPreview) {
    warnings.push('Caption preview requested but enableCaptionPreview is false; preview will skip.')
  }

  return {
    allowed: blockingReasons.length === 0,
    warnings,
    blockingReasons,
  }
}
