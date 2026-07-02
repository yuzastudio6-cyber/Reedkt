import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { evaluateModelWeightManifestForMode, getGpuModelWeightManifestTemplate } from '../../model-weights'
import type { MaskExecutionInput } from './mask-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

export function validateMaskExecutionPolicy(input: MaskExecutionInput): {
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

  if (input.allowModelDownload === true) blockingReasons.push('model_download_blocked_in_m15c')
  if (input.allowFinalRender === true) blockingReasons.push('final_render_blocked_in_m15c')
  if ((input.arbitraryModelArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_model_args_blocked')
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  if (input.mode === 'production_blocked') blockingReasons.push('production_mask_execution_blocked_in_m15c')

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    if (!input.sourceImageArtifactId && !input.sourceVideoArtifactId && !input.proxyVideoArtifactId && (input.representativeFrameArtifactIds?.length ?? 0) === 0) {
      blockingReasons.push('private_mask_input_artifact_required')
    }
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('mask_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('mask_readiness_blockers_present')
    }

    for (const manifestId of requiredManifestIds(input)) {
      if (!input.modelWeightManifestIds?.includes(manifestId)) {
        blockingReasons.push(`${manifestId}_modelWeightManifestId_required`)
        continue
      }
      const evaluation = evaluateModelWeightManifestForMode(getGpuModelWeightManifestTemplate(manifestId), 'production_ready')
      blockingReasons.push(...evaluation.blockingReasons.map((reason) => `${manifestId}: ${reason}`))
      warnings.push(...evaluation.warnings)
    }
  }

  if (input.mode === 'local_dev' && input.enableModelMaskExecution !== true) {
    warnings.push('local_dev_model_mask_execution_disabled')
  }
  if (input.mode === 'local_dev' && input.enableMaskPreview !== true) {
    warnings.push('local_dev_mask_preview_disabled')
  }
  if (input.maskIntent === 'text_behind_subject') {
    warnings.push('text_behind_subject_requires_strong_mask_or_safe_fallback')
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}

function requiredManifestIds(input: MaskExecutionInput): Array<'birefnet_model' | 'sam2_checkpoint'> {
  const ids: Array<'birefnet_model' | 'sam2_checkpoint'> = ['birefnet_model']
  if (input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject' || input.motionRequiresTracking) {
    ids.push('sam2_checkpoint')
  }
  return ids
}

function rejectForbiddenInputFields(input: MaskExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M15C mask execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: MaskExecutionInput): void {
  const stringFields = [
    ['sourceImageLocalPath', input.sourceImageLocalPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['birefnetModelLocalPath', input.birefnetModelLocalPath],
    ['sam2CheckpointLocalPath', input.sam2CheckpointLocalPath],
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
  for (const value of input.modelLocalPaths ?? []) {
    assertNoSignedUrlOrRawUrl(value, 'modelLocalPath')
    assertNoPathTraversal(value, 'modelLocalPath')
  }
}
