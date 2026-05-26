import { existsSync } from 'node:fs'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'

export function buildBiRefNetCommandPlan(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  return {
    tool: 'birefnet',
    command: 'python',
    args: [
      '-m',
      'birefnet',
      '--input',
      input.executionInput.sourceImageLocalPath ?? input.executionInput.proxyVideoLocalPath ?? '[private-artifact-ref]',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/mask-image.png` : '[worker-temp-mask]',
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/mask-image.png` : undefined,
    executes: false,
    summary: 'BiRefNet foreground mask command plan; no model download and no execution by builder.',
  }
}

export async function runBiRefNetMask(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildBiRefNetCommandPlan(input)
  const executionInput = input.executionInput
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelMaskExecution !== true) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_disabled_or_not_local_dev', message: 'BiRefNet runs only in explicit local-dev model execution.', tool: 'birefnet' }, warnings: [] }
  }
  if (!executionInput.birefnetModelLocalPath || !existsSync(executionInput.birefnetModelLocalPath)) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_model_missing', message: 'BiRefNet model/checkpoint is not available locally; no download attempted.', tool: 'birefnet' }, warnings: [] }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_source_missing', message: 'Safe local source media/frame is missing.', tool: 'birefnet' }, warnings: [] }
  }
  return {
    status: 'planned',
    tool: 'birefnet',
    commandPlan,
    artifact: buildMaskArtifactRecord({
      workspaceId: executionInput.workspaceId,
      projectId: executionInput.projectId,
      mediaAssetId: executionInput.mediaAssetId,
      artifactType: input.taskPlan.expectedArtifacts.includes('mask_sequence') ? 'mask_sequence' : 'mask_image',
      fileName: input.taskPlan.expectedArtifacts.includes('mask_sequence') ? 'birefnet-mask-sequence.json' : 'birefnet-mask-image.png',
      sourceOfTruth: true,
      metadata: { tool: 'birefnet', plannedOnly: true },
    }),
    warnings: ['BiRefNet local-dev execution is scaffolded only; no inference is run by M15C smoke paths.'],
  }
}
