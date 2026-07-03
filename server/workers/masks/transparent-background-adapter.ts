import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
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
  const executionInput = input.executionInput
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelMaskExecution !== true) {
    return {
      status: 'skipped',
      tool: 'transparent_background',
      commandPlan,
      skipReason: { code: 'transparent_background_disabled_or_not_local_dev', message: 'transparent-background runs only in explicit local-dev model execution.', tool: 'transparent_background' },
      warnings: ['transparent-background remains evaluation/fallback only and model-license gated.'],
    }
  }
  if (!executionInput.transparentBackgroundCheckpointLocalPath || !existsSync(executionInput.transparentBackgroundCheckpointLocalPath)) {
    return { status: 'skipped', tool: 'transparent_background', commandPlan, skipReason: { code: 'transparent_background_checkpoint_missing', message: 'Approved local transparent-background checkpoint is missing; no download attempted.', tool: 'transparent_background' }, warnings: [] }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'transparent_background', commandPlan, skipReason: { code: 'transparent_background_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'transparent_background' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'transparent_background', commandPlan, skipReason: { code: 'transparent_background_output_directory_missing', message: 'transparent-background execution requires a private local worker output directory.', tool: 'transparent_background' }, warnings: [] }
  }

  const runtimeDir = path.join(executionInput.outputDirectory, 'transparent-background-runtime')
  const maskPath = path.join(runtimeDir, 'transparent-background-mask.png')
  const cutoutPath = path.join(runtimeDir, 'transparent-background-cutout.png')
  const outputJsonPath = path.join(runtimeDir, 'transparent-background-runtime-result.json')

  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/transparent-background-runtime/transparent_background_local.py',
      args: [
        '--checkpoint-path',
        executionInput.transparentBackgroundCheckpointLocalPath,
        '--mode',
        executionInput.transparentBackgroundMode ?? 'base',
        '--input-image-path',
        sourcePath,
        '--cutout-path',
        cutoutPath,
        '--mask-path',
        maskPath,
        '--output-json',
        outputJsonPath,
      ],
      outputJsonPath,
      timeoutMs: executionInput.timeoutMs,
      runtimeBackend: executionInput.runtimeExecutionBackend,
      containerImage: executionInput.runtimeContainerImage,
      containerPlatform: executionInput.runtimeContainerPlatform,
      containerGpu: executionInput.runtimeContainerGpu,
      containerBindMounts: buildAiGraphicsRuntimeContainerBindMounts({
        readOnlyPaths: [
          sourcePath,
          executionInput.transparentBackgroundCheckpointLocalPath,
        ],
        readWritePaths: [executionInput.outputDirectory],
      }),
    })
    return {
      status: 'completed',
      tool: 'transparent_background',
      commandPlan: { ...commandPlan, executes: true, summary: 'transparent-background local runtime script executed with approved local checkpoint and private source frame; no checkpoint download.' },
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_image',
          fileName: 'transparent-background-mask.png',
          sourceOfTruth: true,
          metadata: { tool: 'transparent_background', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'rgba_cutout',
          fileName: 'transparent-background-cutout.png',
          sourceOfTruth: true,
          metadata: { tool: 'transparent_background', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'transparent-background-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'transparent_background', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes },
        }),
      ],
      warnings: ['transparent-background executed against a private local source frame with a local checkpoint; quality/production approval remains separate.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'transparent_background',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['transparent-background runtime script failed before producing accepted local proof output.'],
    }
  }
}
