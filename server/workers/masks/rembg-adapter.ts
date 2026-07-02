import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'

export function buildRembgCommandPlan(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  return {
    tool: 'rembg',
    command: 'rembg',
    args: ['i', input.executionInput.sourceImageLocalPath ?? '[private-frame-ref]', input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/rembg-cutout.png` : '[worker-temp-cutout]'],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/rembg-cutout.png` : undefined,
    executes: false,
    summary: 'rembg fallback plan; no automatic model download.',
  }
}

export async function runRembgFallback(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildRembgCommandPlan(input)
  return {
    status: 'skipped',
    tool: 'rembg',
    commandPlan,
    skipReason: { code: 'rembg_unavailable_or_unenabled', message: 'rembg fallback is skip-safe and not executed in M15C by default.', tool: 'rembg' },
    warnings: ['rembg model weights remain separate from package license review.'],
  }
}
