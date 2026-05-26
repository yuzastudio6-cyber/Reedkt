import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import type { ColorExecutionInput } from './color-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateColorExecutionPolicy(input: ColorExecutionInput): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  rejectForbiddenInputFields(input)
  rejectUnsafeReferences(input)

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (input.allowFinalExport === true) blockingReasons.push('final_export_blocked_in_m15b')
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  if ((input.arbitraryLutArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_lut_args_blocked')
  if (input.mode === 'production_blocked') blockingReasons.push('production_color_execution_blocked_in_m15b')

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    if (!input.sourceVideoArtifactId && !input.proxyVideoArtifactId && (input.representativeFrameArtifactIds?.length ?? 0) === 0) {
      blockingReasons.push('private_color_input_artifact_required')
    }
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('color_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('color_readiness_blockers_present')
    }
  }

  if (input.mode === 'local_dev' && input.enableFfmpegColorPreview !== true) {
    warnings.push('local_dev_ffmpeg_color_preview_disabled')
  }
  if (input.enableOpenColorIOExecution === true) warnings.push('opencolorio_execution_is_skip_safe_and_readiness_gated')
  if (input.enableOpenImageIOExecution === true) warnings.push('openimageio_execution_is_skip_safe_and_readiness_gated')

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}

function rejectForbiddenInputFields(input: ColorExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M15B color execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: ColorExecutionInput): void {
  const stringFields = [
    ['sourceStorageObjectPath', input.sourceStorageObjectPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['lutLocalPath', input.lutLocalPath],
  ] as const
  for (const [label, value] of stringFields) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
  for (const framePath of input.representativeFrameLocalPaths ?? []) {
    assertNoSignedUrlOrRawUrl(framePath, 'representativeFrameLocalPath')
    assertNoPathTraversal(framePath, 'representativeFrameLocalPath')
  }
}
