import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { ColorAdapterResult, ColorExecutionInput, ColorToolSkipReason } from './color-execution-types'

export interface OpenColorIOInput {
  executionInput: ColorExecutionInput
  configLocalPath?: string
  inputColorSpace?: string
  outputColorSpace?: string
}

export function validateOpenColorIOInput(input: OpenColorIOInput): void {
  for (const [label, value] of Object.entries({
    configLocalPath: input.configLocalPath,
    lutLocalPath: input.executionInput.lutLocalPath,
  })) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}

export function buildOpenColorIOTransformPlan(input: OpenColorIOInput): {
  tool: 'opencolorio'
  enabled: boolean
  inputColorSpace: string
  outputColorSpace: string
  configLocalPath?: string
  summary: string
} {
  validateOpenColorIOInput(input)
  return {
    tool: 'opencolorio',
    enabled: input.executionInput.enableOpenColorIOExecution === true,
    inputColorSpace: input.inputColorSpace ?? 'Utility - Rec.709 - Texture',
    outputColorSpace: input.outputColorSpace ?? 'Output - Rec.709',
    configLocalPath: input.configLocalPath,
    summary: 'OpenColorIO color management transform plan; skip-safe unless tool/config readiness passes.',
  }
}

export async function runOpenColorIOTransform(input: OpenColorIOInput): Promise<ColorAdapterResult> {
  validateOpenColorIOInput(input)
  const skipReason = buildOpenColorIOSkipReason(input)
  return {
    status: skipReason ? 'skipped' : 'planned',
    skipReason,
    warnings: ['OpenColorIO execution remains command/import-plan only in M15B unless explicitly available and enabled.'],
  }
}

export function buildOpenColorIOSkipReason(input: OpenColorIOInput): ColorToolSkipReason | undefined {
  if (!input.executionInput.enableOpenColorIOExecution) return { code: 'opencolorio_not_enabled', message: 'OpenColorIO execution was not explicitly enabled.', tool: 'opencolorio' }
  if (input.configLocalPath && !existsSync(input.configLocalPath)) return { code: 'opencolorio_config_missing', message: 'OpenColorIO config is not available locally.', tool: 'opencolorio' }
  return { code: 'opencolorio_unavailable', message: 'OpenColorIO is optional/readiness-gated and not executed by default in M15B.', tool: 'opencolorio' }
}
