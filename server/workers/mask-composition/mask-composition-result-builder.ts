import type { MaskExecutionResult } from './mask-composition-pipeline-types'

export function buildMaskCompositionResult(input: MaskExecutionResult): MaskExecutionResult {
  return {
    ...input,
    blocksFinalExport: true,
  }
}
