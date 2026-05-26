import { evaluateModelWeightManifestForMode, getGpuModelWeightManifestTemplate } from '../../model-weights'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import type { EnhancementExecutionInput } from './enhancement-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateEnhancementExecutionPolicy(input: EnhancementExecutionInput): {
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
  if (input.mode === 'production_blocked') blockingReasons.push('production_enhancement_execution_blocked_in_m15d')

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    if (!input.sourceImageArtifactId && !input.sourceVideoArtifactId && !input.proxyVideoArtifactId && (input.representativeFrameArtifactIds?.length ?? 0) === 0) {
      blockingReasons.push('private_enhancement_input_artifact_required')
    }
    if (!input.modelWeightManifestIds?.includes('real_esrgan_model')) {
      blockingReasons.push('real_esrgan_modelWeightManifestId_required')
    } else {
      const evaluation = evaluateModelWeightManifestForMode(getGpuModelWeightManifestTemplate('real_esrgan_model'), 'production_ready')
      blockingReasons.push(...evaluation.blockingReasons.map((reason) => `real_esrgan_model: ${reason}`))
      warnings.push(...evaluation.warnings)
    }
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('enhancement_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('enhancement_readiness_blockers_present')
    }
  }

  if (input.mode === 'local_dev' && input.enableModelEnhancementExecution !== true) warnings.push('local_dev_model_enhancement_execution_disabled')
  if (input.mode === 'local_dev' && input.enableFfmpegFallbackPreview !== true) warnings.push('local_dev_ffmpeg_enhancement_preview_disabled')

  return { allowed: blockingReasons.length === 0, blockingReasons, warnings }
}

function rejectForbiddenInputFields(input: EnhancementExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M15D enhancement execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: EnhancementExecutionInput): void {
  const stringFields = [
    ['sourceImageLocalPath', input.sourceImageLocalPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['realEsrganModelLocalPath', input.realEsrganModelLocalPath],
  ] as const
  for (const [label, value] of stringFields) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
  for (const value of input.representativeFrameLocalPaths ?? []) {
    assertNoSignedUrlOrRawUrl(value, 'representativeFrameLocalPath')
    assertNoPathTraversal(value, 'representativeFrameLocalPath')
  }
}
