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
    blockingReasons.push('M13 production_ready caption render/export remains blocked until final render milestones.')
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
