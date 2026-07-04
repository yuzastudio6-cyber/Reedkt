import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
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
  const executionInput = input.executionInput
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelMaskExecution !== true) {
    return {
      status: 'skipped',
      tool: 'rembg',
      commandPlan,
      skipReason: { code: 'rembg_disabled_or_not_local_dev', message: 'rembg runs only in explicit local-dev model execution.', tool: 'rembg' },
      warnings: ['rembg model weights remain separate from package license review.'],
    }
  }
  if (!executionInput.rembgModelLocalPath || !existsSync(executionInput.rembgModelLocalPath)) {
    return { status: 'skipped', tool: 'rembg', commandPlan, skipReason: { code: 'rembg_model_missing', message: 'Approved local rembg ONNX model is missing; no download attempted.', tool: 'rembg' }, warnings: [] }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'rembg', commandPlan, skipReason: { code: 'rembg_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'rembg' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'rembg', commandPlan, skipReason: { code: 'rembg_output_directory_missing', message: 'rembg execution requires a private local worker output directory.', tool: 'rembg' }, warnings: [] }
  }

  const runtimeDir = path.join(executionInput.outputDirectory, 'rembg-runtime')
  const maskPath = path.join(runtimeDir, 'rembg-mask.png')
  const cutoutPath = path.join(runtimeDir, 'rembg-cutout.png')
  const outputJsonPath = path.join(runtimeDir, 'rembg-runtime-result.json')

  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/rembg-runtime/rembg_local.py',
      args: [
        '--model-path',
        executionInput.rembgModelLocalPath,
        ...(executionInput.rembgModelName ? ['--model-name', executionInput.rembgModelName] : []),
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
          executionInput.rembgModelLocalPath,
        ],
        readWritePaths: [executionInput.outputDirectory],
      }),
      proofExpectation: {
        expectedToolId: 'rembg',
        requireCudaExecutionProvider: true,
        requireNoModelDownload: true,
        requireNoProviderRuntime: true,
        requireNoPublicArtifact: true,
        requireNoSignedUrl: true,
      },
    })
    return {
      status: 'completed',
      tool: 'rembg',
      commandPlan: { ...commandPlan, executes: true, summary: 'rembg local runtime script executed with approved local ONNX model and private source frame; no model download.' },
      outputJsonPath: runtimeResult.outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_image',
          fileName: 'rembg-mask.png',
          sourceOfTruth: true,
          metadata: { tool: 'rembg', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'rgba_cutout',
          fileName: 'rembg-cutout.png',
          sourceOfTruth: true,
          metadata: { tool: 'rembg', runtimeExecuted: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'rembg-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'rembg', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes },
        }),
      ],
      warnings: ['rembg executed against a private local source frame with a local model cache; quality/production approval remains separate.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'rembg',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['rembg runtime script failed before producing accepted local proof output.'],
    }
  }
}
