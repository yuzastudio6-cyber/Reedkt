import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { ColorExecutionInput, ColorExecutionPlan, ColorFfmpegCommandPlan } from './color-execution-types'

export function buildFFmpegColorPreviewCommandPlan(input: {
  executionInput: ColorExecutionInput
  executionPlan: ColorExecutionPlan
}): ColorFfmpegCommandPlan {
  if (input.executionInput.allowFinalExport) throw new Error('M15B FFmpeg color command builder refuses final export.')
  if ((input.executionInput.arbitraryFfmpegArgs?.length ?? 0) > 0) throw new Error('M15B rejects arbitrary FFmpeg color args.')
  if ((input.executionInput.arbitraryLutArgs?.length ?? 0) > 0) throw new Error('M15B rejects arbitrary LUT args.')

  const sourcePath = input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? '__SOURCE_OR_PROXY_LOCAL_PATH_REQUIRED__'
  assertNoSignedUrlOrRawUrl(sourcePath, 'sourceVideoLocalPath')
  assertNoPathTraversal(sourcePath, 'sourceVideoLocalPath')

  const outputPath = resolvePreviewOutputPath(input.executionInput)
  if (outputPath && !outputPath.includes('__')) assertSourceNotOverwritten(sourcePath, outputPath)

  const eqFilter = buildEqFilter(input.executionPlan)
  const filters = [eqFilter]
  if (input.executionInput.lutLocalPath && input.executionPlan.lookTransformPlan.lutStrength > 0) {
    assertNoSignedUrlOrRawUrl(input.executionInput.lutLocalPath, 'lutLocalPath')
    assertNoPathTraversal(input.executionInput.lutLocalPath, 'lutLocalPath')
    filters.push(`lut3d=file='${input.executionInput.lutLocalPath.replace(/\\/g, '/')}':interp=tetrahedral`)
  }

  return {
    command: input.executionInput.ffmpegBin ?? 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-n',
      '-i',
      sourcePath,
      '-vf',
      `${filters.join(',')},format=yuv420p`,
      '-an',
      '-t',
      '3',
      outputPath ?? '__SAFE_OUTPUT_ROOT_REQUIRED__/graded-preview.mp4',
    ],
    expectedOutputPath: outputPath,
    operation: 'color_preview',
    executes: false,
    summary: 'FFmpeg preview-only color correction command with allowlisted eq/lut3d filters.',
  }
}

function buildEqFilter(plan: ColorExecutionPlan): string {
  const intensity = plan.correctionPlan.intensity
  const exposure = plan.correctionPlan.operations.find((operation) => operation.operationType === 'exposure_correction')?.amount ?? 0
  const contrast = 1 + Math.min(0.22, intensity * 0.35)
  const saturation = 1 + Math.max(-0.12, Math.min(0.16, plan.correctionPlan.operations.find((operation) => operation.operationType === 'saturation_vibrance_control')?.amount ?? 0))
  const gamma = 1 + Math.max(-0.06, Math.min(0.06, exposure))
  const brightness = Math.max(-0.12, Math.min(0.12, exposure))
  return `eq=brightness=${round(brightness)}:contrast=${round(contrast)}:saturation=${round(saturation)}:gamma=${round(gamma)}`
}

function resolvePreviewOutputPath(input: ColorExecutionInput): string | undefined {
  if (!input.outputDirectory) return undefined
  assertNoSignedUrlOrRawUrl(input.outputDirectory, 'outputDirectory')
  assertNoPathTraversal(input.outputDirectory, 'outputDirectory')
  return assertOutputPathInsideRoot(path.join(input.outputDirectory, 'graded-preview.mp4'), input.outputDirectory)
}

function round(value: number): string {
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}
