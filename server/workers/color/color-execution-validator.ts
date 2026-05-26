import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { ColorExecutionInput, ColorExecutionPlan, ColorExecutionValidationResult } from './color-execution-types'

export function validateColorExecutionInput(input: ColorExecutionInput): ColorExecutionValidationResult {
  const issues: ColorExecutionValidationResult['issues'] = []

  if (input.allowFinalExport === true) issues.push(blocking('final_export_blocked', 'Final export is out of scope for M15B.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))
  if ((input.arbitraryLutArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_lut_args', 'Arbitrary LUT args are blocked.'))

  for (const [label, value] of [
    ['sourceStorageObjectPath', input.sourceStorageObjectPath],
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['lutLocalPath', input.lutLocalPath],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      issues.push(blocking('unsafe_color_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
    }
  }

  for (const framePath of input.representativeFrameLocalPaths ?? []) {
    try {
      assertNoSignedUrlOrRawUrl(framePath, 'representativeFrameLocalPath')
      assertNoPathTraversal(framePath, 'representativeFrameLocalPath')
    } catch (error) {
      issues.push(blocking('unsafe_representative_frame_path', error instanceof Error ? error.message : 'Representative frame path is unsafe.'))
    }
  }

  const sourcePath = input.proxyVideoLocalPath ?? input.sourceVideoLocalPath
  if (sourcePath && input.outputDirectory) {
    try {
      const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'graded-preview.mp4'), input.outputDirectory)
      assertSourceNotOverwritten(sourcePath, outputPath)
    } catch {
      issues.push(blocking('source_overwrite_risk', 'Color preview output must not overwrite source/proxy media.'))
    }
  }

  if (input.colorIntensity !== undefined && (input.colorIntensity < 0 || input.colorIntensity > 1)) {
    issues.push(blocking('unsafe_color_intensity', 'Color intensity must stay within 0 to 1.'))
  }
  if (input.lutStrength !== undefined && (input.lutStrength < 0 || input.lutStrength > 0.6)) {
    issues.push(blocking('unsafe_lut_strength', 'LUT strength must stay within 0 to 0.6.'))
  }
  if (input.lutStrength !== undefined && input.lutStrength > 0.45) {
    issues.push(warning('high_lut_strength_review', 'LUT strength above 0.45 requires review and may be reduced by QA.'))
  }
  if (input.lutLocalPath) {
    try {
      assertNoSignedUrlOrRawUrl(input.lutLocalPath, 'lutLocalPath')
      assertNoPathTraversal(input.lutLocalPath, 'lutLocalPath')
    } catch (error) {
      issues.push(blocking('unsafe_lut_path', error instanceof Error ? error.message : 'LUT path is unsafe.'))
    }
  }
  if (input.mode === 'production_ready' && (input.enableOpenColorIOExecution || input.enableOpenImageIOExecution)) {
    if (input.readinessReport?.overallStatus !== 'passed') {
      issues.push(blocking('color_tool_readiness_required', 'OpenColorIO/OpenImageIO production execution requires passed readiness.'))
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

export function validateColorExecutionPlan(input: ColorExecutionPlan): ColorExecutionValidationResult {
  const issues: ColorExecutionValidationResult['issues'] = []
  if (input.finalExportAllowed) issues.push(blocking('final_export_allowed', 'Color execution plan must keep finalExportAllowed false.'))
  if (input.correctionPlan.intensity < 0 || input.correctionPlan.intensity > 1) {
    issues.push(blocking('unsafe_color_intensity', 'Execution plan color intensity is outside M15B policy.'))
  }
  if (input.lookTransformPlan.lutStrength < 0 || input.lookTransformPlan.lutStrength > 0.6) {
    issues.push(blocking('unsafe_lut_strength', 'Execution plan LUT strength is outside M15B policy.'))
  }
  if (!input.selectedOperations.includes('skin_tone_protection')) {
    issues.push(blocking('skin_tone_protection_missing', 'Color execution plan must include skin tone protection.'))
  }
  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

function blocking(code: string, message: string): ColorExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): ColorExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
