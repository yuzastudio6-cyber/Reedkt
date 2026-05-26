import type { MaskExecutionResult } from './mask-execution-types'

export function buildMaskExecutionResult(input: MaskExecutionResult): MaskExecutionResult {
  return {
    ...input,
    blocksFinalExport: true,
  }
}
