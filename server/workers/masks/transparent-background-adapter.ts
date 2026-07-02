import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'

export function buildTransparentBackgroundCommandPlan(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  return {
    tool: 'transparent_background',
    command: 'transparent-background',
    args: ['--source', input.executionInput.sourceImageLocalPath ?? '[private-frame-ref]', '--dest', input.executionInput.outputDirectory ?? '[worker-temp]', '--no-download'],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/transparent-background-cutout.png` : undefined,
    executes: false,
    summary: 'transparent-background fallback plan; no automatic model download.',
  }
}

export async function runTransparentBackgroundFallback(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildTransparentBackgroundCommandPlan(input)
  return {
    status: 'skipped',
    tool: 'transparent_background',
    commandPlan,
    skipReason: { code: 'transparent_background_unavailable_or_unenabled', message: 'transparent-background fallback is skip-safe and not executed in M15C by default.', tool: 'transparent_background' },
    warnings: ['transparent-background remains evaluation/fallback only and model-license gated.'],
  }
}
