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
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import type {
  SmartCutExecutionPolicyResult,
  SmartCutTimelineExecutionInput,
} from './smart-cut-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateSmartCutTimelineExecutionPolicy(
  input: SmartCutTimelineExecutionInput,
): SmartCutExecutionPolicyResult {
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

  if (input.allowFinalExport === true) {
    blockingReasons.push('allow_final_export_blocked_in_m14')
  }

  if (input.arbitraryFfmpegArgs && input.arbitraryFfmpegArgs.length > 0) {
    blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  }

  if (input.mode === 'production_blocked') {
    blockingReasons.push('production_cutting_rendering_blocked_in_m14')
  }

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }

    if (input.readinessReport?.overallStatus !== 'passed') {
      blockingReasons.push('production_readiness_report_not_passed')
    }

    if ((input.readinessReport?.blockerSummaries?.length ?? 0) > 0 || (input.readinessReport?.blockers?.length ?? 0) > 0) {
      blockingReasons.push('production_readiness_blockers_present')
    }
  }

  if (input.mode === 'local_dev' && input.enableProxyPreview !== true) {
    warnings.push('local_dev_proxy_preview_disabled')
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}

function rejectForbiddenInputFields(input: SmartCutTimelineExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M14 smart cut execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: SmartCutTimelineExecutionInput): void {
  const stringFields = [
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['sourceStorageObjectPath', input.sourceStorageObjectPath],
    ['outputDirectory', input.outputDirectory],
  ] as const

  for (const [label, value] of stringFields) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}
