import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { EnhancementExecutionInput, EnhancementExecutionValidationResult, EnhancementTaskPlan } from './enhancement-execution-types'

const MAX_SAMPLE_COUNT = 12
const MAX_TARGET_SCALE = 4

export function validateEnhancementExecutionInput(input: EnhancementExecutionInput): EnhancementExecutionValidationResult {
  const issues: EnhancementExecutionValidationResult['issues'] = []

  if (input.allowModelDownload === true) issues.push(blocking('model_download_blocked', 'Model downloads are out of scope for M15D.'))
  if (input.allowFinalRender === true) issues.push(blocking('final_render_blocked', 'Final render is out of scope for M15D.'))
  if ((input.arbitraryModelArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_model_args', 'Arbitrary model args are blocked.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))

  for (const [label, value] of [
    ['sourceImageLocalPath', input.sourceImageLocalPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['realEsrganModelLocalPath', input.realEsrganModelLocalPath],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      issues.push(blocking('unsafe_enhancement_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
    }
  }

  for (const localPath of input.representativeFrameLocalPaths ?? []) {
    try {
      assertNoSignedUrlOrRawUrl(localPath, 'representativeFrameLocalPath')
      assertNoPathTraversal(localPath, 'representativeFrameLocalPath')
    } catch (error) {
      issues.push(blocking('unsafe_representative_frame_path', error instanceof Error ? error.message : 'Representative frame path is unsafe.'))
    }
  }

  const sourcePath = input.sourceImageLocalPath ?? input.proxyVideoLocalPath ?? input.sourceVideoLocalPath ?? input.representativeFrameLocalPaths?.[0]
  if (sourcePath && input.outputDirectory) {
    try {
      const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'enhanced-video.mp4'), input.outputDirectory)
      assertSourceNotOverwritten(sourcePath, outputPath)
    } catch {
      issues.push(blocking('source_overwrite_risk', 'Enhancement outputs must not overwrite source/proxy media.'))
    }
  }

  if ((input.sampleCount ?? 0) > MAX_SAMPLE_COUNT) issues.push(blocking('sample_count_guard_exceeded', `Enhancement samples are capped at ${MAX_SAMPLE_COUNT}.`))
  if ((input.targetScale ?? 2) <= 0 || (input.targetScale ?? 2) > MAX_TARGET_SCALE) issues.push(blocking('unsafe_target_scale', 'Enhancement targetScale must be greater than 0 and no more than 4.'))
  if ((input.targetScale ?? 2) > 2) issues.push(warning('target_scale_review', 'Target scale above 2x requires artifact QA.'))
  if (input.sourceResolution && input.targetResolution) {
    const sourceArea = input.sourceResolution.width * input.sourceResolution.height
    const targetArea = input.targetResolution.width * input.targetResolution.height
    if (sourceArea <= 0 || targetArea / sourceArea > 4) {
      issues.push(blocking('unsafe_target_resolution', 'Target resolution must not exceed a 4x pixel-area increase in M15D.'))
    }
  }
  if (input.mode === 'production_ready' && (input.modelWeightManifestIds?.length ?? 0) === 0) {
    issues.push(blocking('model_weight_manifest_required', 'Production Real-ESRGAN execution requires modelWeightManifestId approval.'))
  }

  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

export function validateEnhancementTaskPlan(plan: EnhancementTaskPlan): EnhancementExecutionValidationResult {
  const issues: EnhancementExecutionValidationResult['issues'] = []
  if (plan.finalRenderAllowed) issues.push(blocking('final_render_allowed', 'Enhancement task plan must keep finalRenderAllowed false.'))
  if (!plan.sampleFirstPolicy.sampleFirst) issues.push(blocking('sample_first_missing', 'Enhancement must be sample-first in M15D.'))
  if (plan.selectedSamples.length > plan.sampleFirstPolicy.maxSampleCount) issues.push(blocking('sample_count_guard_exceeded', 'Enhancement task plan exceeds sample guard.'))
  if (plan.targetScale <= 0 || plan.targetScale > MAX_TARGET_SCALE) issues.push(blocking('unsafe_target_scale', 'Enhancement task plan target scale is outside policy.'))
  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

function blocking(code: string, message: string): EnhancementExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): EnhancementExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
