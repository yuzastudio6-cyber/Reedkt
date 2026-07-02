import { evaluateModelWeightManifestForMode, getGpuModelWeightManifestTemplate } from '../../model-weights'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import type { SlowMotionExecutionInput } from './slow-motion-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateSlowMotionExecutionPolicy(input: SlowMotionExecutionInput): {
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

  if (input.allowModelDownload === true) blockingReasons.push('model_download_blocked_in_m15d')
  if (input.allowFinalRender === true) blockingReasons.push('final_render_blocked_in_m15d')
  if ((input.arbitraryModelArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_model_args_blocked')
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  if (input.mode === 'production_blocked') blockingReasons.push('production_slow_motion_execution_blocked_in_m15d')

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    if (!input.sourceVideoArtifactId && !input.proxyVideoArtifactId) {
      blockingReasons.push('private_slow_motion_input_artifact_required')
    }
    if (input.interpolationMode === 'film') {
      if (!input.modelWeightManifestIds?.includes('film_model')) {
        blockingReasons.push('film_modelWeightManifestId_required')
      } else {
        const evaluation = evaluateModelWeightManifestForMode(getGpuModelWeightManifestTemplate('film_model'), 'production_ready')
        blockingReasons.push(...evaluation.blockingReasons.map((reason) => `film_model: ${reason}`))
        warnings.push(...evaluation.warnings)
      }
    }
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('slow_motion_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('slow_motion_readiness_blockers_present')
    }
  }

  if (input.mode === 'local_dev' && input.enableModelSlowMotionExecution !== true) warnings.push('local_dev_model_slow_motion_execution_disabled')
  if (input.mode === 'local_dev' && input.enableFfmpegFallbackPreview !== true) warnings.push('local_dev_ffmpeg_slow_motion_preview_disabled')

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

function rejectForbiddenInputFields(input: SlowMotionExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M15D slow-motion execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: SlowMotionExecutionInput): void {
  const stringFields = [
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['filmModelLocalPath', input.filmModelLocalPath],
  ] as const
  for (const [label, value] of stringFields) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}
