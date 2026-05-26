import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { ColorAdapterResult, ColorExecutionInput, ColorToolSkipReason } from './color-execution-types'

export interface OpenImageIOInput {
  executionInput: ColorExecutionInput
  sourceFrameLocalPath?: string
  outputFrameLocalPath?: string
}

export function validateOpenImageIOInput(input: OpenImageIOInput): void {
  for (const [label, value] of Object.entries({
    sourceFrameLocalPath: input.sourceFrameLocalPath,
    outputFrameLocalPath: input.outputFrameLocalPath,
  })) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}

export function buildOpenImageIOFrameTransformPlan(input: OpenImageIOInput): {
  tool: 'openimageio'
  enabled: boolean
  summary: string
} {
  validateOpenImageIOInput(input)
  return {
    tool: 'openimageio',
    enabled: input.executionInput.enableOpenImageIOExecution === true,
    summary: 'OpenImageIO frame transform plan; skip-safe unless tool readiness passes.',
  }
}

export async function runOpenImageIOFrameTransform(input: OpenImageIOInput): Promise<ColorAdapterResult> {
  validateOpenImageIOInput(input)
  const skipReason = buildOpenImageIOSkipReason(input)
  return {
    status: skipReason ? 'skipped' : 'planned',
    skipReason,
    warnings: ['OpenImageIO execution remains optional/readiness-gated in M15B.'],
  }
}

export function buildOpenImageIOSkipReason(input: OpenImageIOInput): ColorToolSkipReason | undefined {
  if (!input.executionInput.enableOpenImageIOExecution) return { code: 'openimageio_not_enabled', message: 'OpenImageIO execution was not explicitly enabled.', tool: 'openimageio' }
  if (!input.sourceFrameLocalPath || !existsSync(input.sourceFrameLocalPath)) return { code: 'openimageio_frame_missing', message: 'OpenImageIO skipped because a safe local frame is unavailable.', tool: 'openimageio' }
  return { code: 'openimageio_unavailable', message: 'OpenImageIO is optional/readiness-gated and not executed by default in M15B.', tool: 'openimageio' }
}
