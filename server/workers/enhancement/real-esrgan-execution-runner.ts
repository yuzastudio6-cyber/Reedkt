import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'
import { buildEnhancementArtifactRecord } from './enhancement-artifact-writer'
import type { EnhancementExecutionInput, EnhancementTaskPlan, EnhancementToolCommandPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export function buildRealEsrganCommandPlan(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): EnhancementToolCommandPlan {
  return {
    tool: 'real_esrgan',
    command: 'python',
    args: [
      '-m',
      'realesrgan',
      '--input',
      input.executionInput.sourceImageLocalPath ?? input.executionInput.proxyVideoLocalPath ?? '[private-artifact-ref]',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/enhanced-sample` : '[worker-temp-enhanced-sample]',
      '--scale',
      String(input.taskPlan.targetScale),
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/enhanced-sample` : undefined,
    executes: false,
    summary: 'Real-ESRGAN sample-first enhancement command plan; no model download and no execution by builder.',
  }
}

export async function runRealEsrganEnhancement(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
}): Promise<EnhancementToolExecutionResult> {
  const commandPlan = buildRealEsrganCommandPlan(input)
  const executionInput = input.executionInput
  if (input.taskPlan.primaryTool === 'none') {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'enhancement_not_recommended', message: 'No source quality issue or approved enhancement request exists.', tool: 'real_esrgan' }, warnings: [] }
  }
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelEnhancementExecution !== true) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_disabled_or_not_local_dev', message: 'Real-ESRGAN runs only in explicit local-dev model execution.', tool: 'real_esrgan' }, warnings: [] }
  }
  if (!executionInput.realEsrganModelLocalPath || !existsSync(executionInput.realEsrganModelLocalPath)) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_model_missing', message: 'Real-ESRGAN model is not available locally; no download attempted.', tool: 'real_esrgan' }, warnings: [] }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'real_esrgan' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'real_esrgan', commandPlan, skipReason: { code: 'real_esrgan_output_directory_missing', message: 'Real-ESRGAN execution requires a private local worker output directory.', tool: 'real_esrgan' }, warnings: [] }
  }

  const runtimeDir = path.join(executionInput.outputDirectory, 'real-esrgan-runtime')
  const samplePath = path.join(runtimeDir, 'real-esrgan-sample.png')
  const enhancedPath = path.join(runtimeDir, 'real-esrgan-enhanced.png')
  const outputJsonPath = path.join(runtimeDir, 'real-esrgan-runtime-result.json')
  const allowCpuModelRuntime = executionInput.allowCpuModelRuntime === true

  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/real-esrgan-runtime/real_esrgan_local.py',
      args: [
        '--mode',
        'real_video_sample',
        '--model-path',
        executionInput.realEsrganModelLocalPath,
        '--input-image-path',
        sourcePath,
        '--sample-path',
        samplePath,
        '--enhanced-path',
        enhancedPath,
        '--output-json',
        outputJsonPath,
        ...(allowCpuModelRuntime ? ['--allow-cpu-model-runtime'] : []),
      ],
      outputJsonPath,
      timeoutMs: executionInput.timeoutMs,
      runtimeBackend: executionInput.runtimeExecutionBackend,
      containerImage: executionInput.runtimeContainerImage,
      containerPlatform: executionInput.runtimeContainerPlatform,
      containerGpu: allowCpuModelRuntime
        ? false
        : executionInput.runtimeContainerGpu,
      containerBindMounts: buildAiGraphicsRuntimeContainerBindMounts({
        readOnlyPaths: [
          sourcePath,
          executionInput.realEsrganModelLocalPath,
        ],
        readWritePaths: [executionInput.outputDirectory],
      }),
      proofExpectation: {
        expectedToolId: 'real_esrgan',
        requireCuda: allowCpuModelRuntime ? false : true,
        requireNoModelDownload: true,
        requireNoProviderRuntime: true,
        requireNoPublicArtifact: true,
        requireNoSignedUrl: true,
      },
    })
    return {
      status: 'completed',
      tool: 'real_esrgan',
      commandPlan: {
        ...commandPlan,
        executes: true,
        summary: allowCpuModelRuntime
          ? 'Real-ESRGAN local CPU model runtime script executed with private model path and bounded private source sample; no model download and no GPU attachment.'
          : 'Real-ESRGAN local runtime script executed with private model path and bounded private source sample; no model download.',
      },
      outputJsonPath: runtimeResult.outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
      outputJsonSha256: runtimeResult.outputJsonSha256,
      artifacts: [
        buildEnhancementArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'representative_frame',
          fileName: 'real-esrgan-enhanced.png',
          sourceOfTruth: true,
          metadata: { tool: 'real_esrgan', runtimeExecuted: true, sampleFirst: true },
        }),
        buildEnhancementArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'real-esrgan-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'real_esrgan', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes, outputJsonSha256: runtimeResult.outputJsonSha256 },
        }),
      ],
      warnings: ['Real-ESRGAN executed against a bounded private local sample; full-video/frame-batch upscaling remains a later worker milestone.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'real_esrgan',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['Real-ESRGAN runtime script failed before producing accepted local proof output.'],
    }
  }
}
