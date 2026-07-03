import { existsSync } from 'node:fs'
import path from 'node:path'
import { runAiGraphicsPythonRuntimeScript } from '../ai-graphics-runtime-script-runner'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'

export async function runKorniaMaskRefinement(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = {
    tool: 'kornia' as const,
    command: 'python',
    args: ['docker/prod/kornia-runtime/kornia_local.py', '--input-image-path', input.executionInput.sourceImageLocalPath ?? '[private-frame-ref]'],
    executes: false,
    summary: 'Kornia refinement runtime plan; no model download or provider runtime.',
  }
  const executionInput = input.executionInput
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelMaskExecution !== true) {
    return {
      status: 'skipped',
      tool: 'kornia',
      commandPlan,
      skipReason: { code: 'kornia_disabled_or_not_local_dev', message: 'Kornia refinement runs only in explicit local-dev model execution.', tool: 'kornia' },
      warnings: input.taskPlan.temporalSmoothingPlan.required ? ['Kornia temporal smoothing planned but not executed because model execution is disabled.'] : [],
    }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'kornia', commandPlan, skipReason: { code: 'kornia_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'kornia' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'kornia', commandPlan, skipReason: { code: 'kornia_output_directory_missing', message: 'Kornia execution requires a private local worker output directory.', tool: 'kornia' }, warnings: [] }
  }

  const runtimeDir = path.join(executionInput.outputDirectory, 'kornia-runtime')
  const maskPath = path.join(runtimeDir, 'kornia-edge-mask.png')
  const outputJsonPath = path.join(runtimeDir, 'kornia-runtime-result.json')
  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/kornia-runtime/kornia_local.py',
      args: [
        '--input-image-path',
        sourcePath,
        '--mask-path',
        maskPath,
        '--output-json',
        outputJsonPath,
      ],
      outputJsonPath,
      timeoutMs: executionInput.timeoutMs,
    })
    return {
      status: 'completed',
      tool: 'kornia',
      commandPlan: { ...commandPlan, executes: true, summary: 'Kornia local runtime script executed bounded CUDA tensor/image operations on a private source frame.' },
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_image',
          fileName: 'kornia-edge-mask.png',
          sourceOfTruth: true,
          metadata: { tool: 'kornia', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'kornia-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'kornia', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes },
        }),
      ],
      warnings: ['Kornia executed bounded tensor/image operations only; no model inference or download was performed.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'kornia',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['Kornia runtime script failed before producing accepted local proof output.'],
    }
  }
}
