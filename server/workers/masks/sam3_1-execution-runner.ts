import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type {
  MaskExecutionInput,
  MaskTaskPlan,
  MaskToolCommandPlan,
  MaskToolExecutionResult,
} from './mask-execution-types'

/**
 * Produces byte-free planning evidence only. Actual SAM 3.1 execution belongs
 * to the future canonical A100/L4 admission and runtime owner; this legacy
 * mask pipeline may never load a checkpoint or invoke Python itself.
 */
export function buildSam31CommandPlan(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  if (
    input.taskPlan.primaryTool !== 'sam3_1' &&
    !input.taskPlan.fallbackTools.includes('sam3_1') &&
    !input.taskPlan.temporalSmoothingPlan.trackingRequired
  ) {
    throw new Error('SAM 3.1 planning requires an exact selected/fallback/tracking dependency.')
  }
  return {
    tool: 'sam3_1',
    args: [
      '--operation-id',
      CANONICAL_SAM3_1_OPERATION_ID,
      '--canonical-release-required',
      '--no-download',
      '--gpu-only',
    ],
    executes: false,
    summary: 'Canonical SAM 3.1 A100/L4 dispatch plan only; no local checkpoint, download, CPU fallback, or inference is permitted here.',
  }
}

export async function runSam31Tracking(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildSam31CommandPlan(input)
  return {
    status: 'skipped',
    tool: 'sam3_1',
    commandPlan,
    skipReason: {
      code: 'sam3_1_canonical_runtime_release_required',
      message: 'SAM 3.1 remains fail-closed until the gated checkpoint, immutable A100/L4 images, dispatch admission, cost authority, and temporal-quality qualification are canonically released.',
      tool: 'sam3_1',
    },
    warnings: [
      'No SAM 3.1 model bytes were loaded and no local, CPU, provider, or GPU inference was started.',
    ],
  }
}
