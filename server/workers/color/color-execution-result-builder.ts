import type { ColorExecutionResult } from './color-execution-types'

export function buildColorExecutionResult(input: ColorExecutionResult): ColorExecutionResult {
  return {
    ...input,
    blocksFinalExport: true,
  }
}
