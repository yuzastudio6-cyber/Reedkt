import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { MaskExecutionInput, MaskExecutionValidationResult, MaskTaskPlan } from './mask-execution-types'
import { isUnsafeTextContent } from '../text-behind-subject/text-behind-subject-policy'

const MAX_LOCAL_DEV_FRAMES = 300

export function validateMaskExecutionInput(input: MaskExecutionInput): MaskExecutionValidationResult {
  const issues: MaskExecutionValidationResult['issues'] = []

  if (input.allowModelDownload === true) issues.push(blocking('model_download_blocked', 'Model downloads are out of scope for M15C.'))
  if (input.allowFinalRender === true) issues.push(blocking('final_render_blocked', 'Final render is out of scope for M15C.'))
  if ((input.arbitraryModelArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_model_args', 'Arbitrary model args are blocked.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))

  for (const [label, value] of [
    ['sourceImageLocalPath', input.sourceImageLocalPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['birefnetModelLocalPath', input.birefnetModelLocalPath],
    ['sam2CheckpointLocalPath', input.sam2CheckpointLocalPath],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      issues.push(blocking('unsafe_mask_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
    }
  }

  for (const localPath of [...(input.representativeFrameLocalPaths ?? []), ...(input.modelLocalPaths ?? [])]) {
    try {
      assertNoSignedUrlOrRawUrl(localPath, 'maskLocalPath')
      assertNoPathTraversal(localPath, 'maskLocalPath')
    } catch (error) {
      issues.push(blocking('unsafe_local_or_model_path', error instanceof Error ? error.message : 'Local/model path is unsafe.'))
    }
  }

  const sourcePath = input.sourceImageLocalPath ?? input.proxyVideoLocalPath ?? input.sourceVideoLocalPath ?? input.representativeFrameLocalPaths?.[0]
  if (sourcePath && input.outputDirectory) {
    for (const fileName of ['mask-image.png', 'mask-sequence', 'rgba-cutout.png', 'm15c-mask-preview.mp4']) {
      try {
        const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, fileName), input.outputDirectory)
        assertSourceNotOverwritten(sourcePath, outputPath)
      } catch {
        issues.push(blocking('source_overwrite_risk', 'Mask outputs must not overwrite source/proxy media.'))
        break
      }
    }
  }

  if ((input.frameSamplingMaxFrames ?? 0) > MAX_LOCAL_DEV_FRAMES) {
    issues.push(blocking('frame_count_guard_exceeded', `Local-dev frame sampling is capped at ${MAX_LOCAL_DEV_FRAMES} frames in M15C.`))
  }

  if (requiresStructuredSubjectSelection(input) && !hasStructuredSubjectSelection(input)) {
    issues.push(blocking('structured_subject_selection_required', 'Promptable tracking requires bounding box, point prompts, or approved subject label.'))
  }

  if (input.textBehindSubject) {
    if (input.textBehindSubject.allowFinalRender === true) issues.push(blocking('text_final_render_blocked', 'Text-behind-subject final render is out of scope.'))
    if (isUnsafeTextContent(input.textBehindSubject.textContent)) {
      issues.push(blocking('unsafe_text_content', 'Text-behind-subject content must not contain HTML/script/ASS override injection.'))
    }
    if ((input.maskConfidenceHint ?? 0.72) < 0.82) {
      issues.push(warning('text_behind_subject_mask_confidence_low', 'Weak mask confidence should downgrade text-behind-subject to foreground/side/lower text.'))
    }
  }

  if (input.mode === 'production_ready') {
    const needsModelManifest = input.maskIntent !== 'custom'
    if (needsModelManifest && (input.modelWeightManifestIds?.length ?? 0) === 0) {
      issues.push(blocking('model_weight_manifest_required', 'Production mask model execution requires modelWeightManifestId approval.'))
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

export function validateMaskTaskPlan(plan: MaskTaskPlan): MaskExecutionValidationResult {
  const issues: MaskExecutionValidationResult['issues'] = []
  if (plan.finalRenderAllowed) issues.push(blocking('final_render_allowed', 'Mask task plan must keep finalRenderAllowed false.'))
  if (plan.videoFrameSamplingPolicy.fullResolutionEveryFrame) {
    issues.push(blocking('full_resolution_every_frame_blocked', 'M15C must not plan every frame at full resolution by default.'))
  }
  if (plan.videoFrameSamplingPolicy.maxFrames > MAX_LOCAL_DEV_FRAMES) {
    issues.push(blocking('frame_count_guard_exceeded', 'Mask task plan exceeds local-dev frame count guard.'))
  }
  if (plan.maskIntent === 'text_behind_subject' && !plan.expectedArtifacts.includes('render_manifest')) {
    issues.push(blocking('depth_manifest_missing', 'Text-behind-subject plans require metadata-only depth composition manifest artifact.'))
  }
  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

function requiresStructuredSubjectSelection(input: MaskExecutionInput): boolean {
  return input.maskIntent === 'background_removal_video' ||
    input.maskIntent === 'text_behind_subject' ||
    input.selectedPrimaryTool === 'sam2' ||
    input.motionRequiresTracking === true
}

function hasStructuredSubjectSelection(input: MaskExecutionInput): boolean {
  const selection = input.subjectSelection
  return Boolean(selection?.boundingBox || (selection?.pointPrompts?.length ?? 0) > 0 || selection?.approvedSubjectLabel)
}

function blocking(code: string, message: string): MaskExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): MaskExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
