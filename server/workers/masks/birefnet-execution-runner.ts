import { existsSync } from 'node:fs'
import path from 'node:path'
import { runAiGraphicsPythonRuntimeScript } from '../ai-graphics-runtime-script-runner'
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
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'birefnet' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_output_directory_missing', message: 'BiRefNet execution requires a private local worker output directory.', tool: 'birefnet' }, warnings: [] }
  }

  const runtimeDir = path.join(executionInput.outputDirectory, 'birefnet-runtime')
  const fixturePath = path.join(runtimeDir, 'birefnet-fixture.png')
  const maskPath = path.join(runtimeDir, 'birefnet-mask.png')
  const cutoutPath = path.join(runtimeDir, 'birefnet-cutout.png')
  const outputJsonPath = path.join(runtimeDir, 'birefnet-runtime-result.json')

  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/birefnet-runtime/birefnet_local.py',
      args: [
        '--model-path',
        executionInput.birefnetModelLocalPath,
        '--fixture-path',
        fixturePath,
        '--input-image-path',
        sourcePath,
        '--input-kind',
        'real_video_frame',
        '--mask-path',
        maskPath,
        '--cutout-path',
        cutoutPath,
        '--output-json',
        outputJsonPath,
      ],
      outputJsonPath,
      timeoutMs: executionInput.timeoutMs,
    })
    return {
      status: 'completed',
      tool: 'birefnet',
      commandPlan: { ...commandPlan, executes: true, summary: 'BiRefNet local runtime script executed with private model path and private source frame; no model download.' },
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_image',
          fileName: 'birefnet-mask.png',
          sourceOfTruth: true,
          metadata: { tool: 'birefnet', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'rgba_cutout',
          fileName: 'birefnet-cutout.png',
          sourceOfTruth: true,
          metadata: { tool: 'birefnet', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'birefnet-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'birefnet', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes },
        }),
      ],
      warnings: ['BiRefNet executed against a private local source frame; full-video temporal masking remains a later worker milestone.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'birefnet',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['BiRefNet runtime script failed before producing accepted local proof output.'],
    }
  }
}
