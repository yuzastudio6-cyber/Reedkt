import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'
import {
  hasReadableSafetensorsHeader,
  minimumPrivateModelFileBytes,
  probePrivateSourceImage,
} from './private-runtime-input-preflight'

const requiredBirefNetRuntimeFiles = [
  'model.safetensors',
  'config.json',
  'BiRefNet_config.py',
  'birefnet.py',
]

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
  const modelStats = statSync(executionInput.birefnetModelLocalPath)
  const missingRuntimeFiles = modelStats.isDirectory()
    ? requiredBirefNetRuntimeFiles.filter((fileName) => {
        const filePath = path.join(executionInput.birefnetModelLocalPath as string, fileName)
        return !existsSync(filePath) || !statSync(filePath).isFile()
      })
    : requiredBirefNetRuntimeFiles
  if (!modelStats.isDirectory() || missingRuntimeFiles.length > 0) {
    return {
      status: 'skipped',
      tool: 'birefnet',
      commandPlan,
      skipReason: {
        code: 'birefnet_model_directory_missing_runtime_files',
        message:
          'BiRefNet local runtime proof requires the reviewed private model directory containing ' +
          `${requiredBirefNetRuntimeFiles.join(', ')}. Missing: ${missingRuntimeFiles.join(', ') || 'model directory'}. ` +
          'No network fetch or model download is allowed.',
        tool: 'birefnet',
      },
      warnings: ['BiRefNet runtime did not start because the private model directory failed local sanity checks.'],
    }
  }
  const modelFilePath = path.join(executionInput.birefnetModelLocalPath, 'model.safetensors')
  const modelFileStats = statSync(modelFilePath)
  if (modelFileStats.size < minimumPrivateModelFileBytes) {
    return {
      status: 'skipped',
      tool: 'birefnet',
      commandPlan,
      skipReason: {
        code: 'birefnet_model_too_small_for_runtime',
        message:
          `BiRefNet model.safetensors is too small (${modelFileStats.size} bytes) for accepted private runtime proof; ` +
          `expected at least ${minimumPrivateModelFileBytes} bytes before CUDA runtime starts.`,
        tool: 'birefnet',
      },
      warnings: ['BiRefNet runtime did not start because the private model file looked like a placeholder.'],
    }
  }
  if (!hasReadableSafetensorsHeader(modelFilePath)) {
    return {
      status: 'skipped',
      tool: 'birefnet',
      commandPlan,
      skipReason: {
        code: 'birefnet_model_invalid_safetensors_header',
        message:
          'BiRefNet model.safetensors must contain a readable safetensors header before CUDA runtime starts.',
        tool: 'birefnet',
      },
      warnings: ['BiRefNet runtime did not start because the private model file failed safetensors header checks.'],
    }
  }
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  const sourceProbe = probePrivateSourceImage(sourcePath)
  if (!sourcePath || !sourceProbe.exists) {
    return { status: 'skipped', tool: 'birefnet', commandPlan, skipReason: { code: 'birefnet_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'birefnet' }, warnings: [] }
  }
  if (!sourceProbe.accepted) {
    return {
      status: 'skipped',
      tool: 'birefnet',
      commandPlan,
      skipReason: {
        code: 'birefnet_source_frame_invalid_image_type',
        message:
          sourceProbe.blocker ??
          'BiRefNet private source image/frame must be PNG, JPEG, WebP, or PPM before CUDA runtime starts.',
        tool: 'birefnet',
      },
      warnings: ['BiRefNet runtime did not start because the private source frame failed image sanity checks.'],
    }
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
      runtimeBackend: executionInput.runtimeExecutionBackend,
      containerImage: executionInput.runtimeContainerImage,
      containerPlatform: executionInput.runtimeContainerPlatform,
      containerGpu: executionInput.runtimeContainerGpu,
      containerBindMounts: buildAiGraphicsRuntimeContainerBindMounts({
        readOnlyPaths: [
          sourcePath,
          executionInput.birefnetModelLocalPath,
        ],
        readWritePaths: [executionInput.outputDirectory],
      }),
      proofExpectation: {
        expectedToolId: 'birefnet',
        requireCuda: true,
        requiredCudaDeviceNamePattern: 'L4',
        requireNoModelDownload: true,
        requireNoProviderRuntime: true,
        requireNoPublicArtifact: true,
        requireNoSignedUrl: true,
      },
    })
    return {
      status: 'completed',
      tool: 'birefnet',
      commandPlan: { ...commandPlan, executes: true, summary: 'BiRefNet local runtime script executed with private model path and private source frame; no model download.' },
      outputJsonPath: runtimeResult.outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
      outputJsonSha256: runtimeResult.outputJsonSha256,
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
          metadata: { tool: 'birefnet', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes, outputJsonSha256: runtimeResult.outputJsonSha256 },
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
