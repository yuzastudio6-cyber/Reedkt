import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'

export type AiGraphicsFoundationRuntimeToolId = 'torch_torchvision' | 'transformers'

export interface AiGraphicsFoundationRuntimeInput {
  mode: 'dry_run' | 'local_dev' | 'container_ready' | 'production_blocked' | 'production_ready'
  toolId: AiGraphicsFoundationRuntimeToolId
  workspaceId?: string
  projectId?: string
  approvedSnapshotId?: string
  outputDirectory?: string
  enableFoundationRuntimeExecution?: boolean
  runtimeExecutionBackend?: 'host_python' | 'docker_container'
  runtimeContainerImage?: string
  runtimeContainerPlatform?: string
  runtimeContainerGpu?: boolean
  allowCpuFoundationRuntime?: boolean
  timeoutMs?: number
}

export interface AiGraphicsFoundationCommandPlan {
  tool: AiGraphicsFoundationRuntimeToolId
  command: 'python'
  args: string[]
  expectedOutputPath?: string
  executes: boolean
  summary: string
}

export interface AiGraphicsFoundationRuntimeResult {
  status: 'completed' | 'skipped' | 'failed'
  tool: AiGraphicsFoundationRuntimeToolId
  commandPlan: AiGraphicsFoundationCommandPlan
  outputJsonPath?: string
  outputJsonSizeBytes?: number
  outputJsonSha256?: string
  skipReason?: { code: string; message: string; tool: AiGraphicsFoundationRuntimeToolId }
  warnings: string[]
  errorMessage?: string
}

export async function runAiGraphicsFoundationRuntimeCheck(
  input: AiGraphicsFoundationRuntimeInput,
): Promise<AiGraphicsFoundationRuntimeResult> {
  const commandPlan: AiGraphicsFoundationCommandPlan = {
    tool: input.toolId,
    command: 'python',
    args: [
      'docker/prod/model-runtime-foundation/foundation_local.py',
      '--tool-id',
      input.toolId,
      '--output-json',
      input.outputDirectory ? `${input.outputDirectory}/model-runtime-foundation/${input.toolId}.json` : '[worker-private-output-json]',
      ...(input.allowCpuFoundationRuntime ? ['--allow-cpu'] : []),
    ],
    expectedOutputPath: input.outputDirectory ? `${input.outputDirectory}/model-runtime-foundation/${input.toolId}.json` : undefined,
    executes: false,
    summary: 'AI graphics model-runtime foundation probe; no model download, model inference, media processing, provider call, or public artifact.',
  }

  if (input.mode !== 'local_dev' || input.enableFoundationRuntimeExecution !== true) {
    return {
      status: 'skipped',
      tool: input.toolId,
      commandPlan,
      skipReason: {
        code: 'foundation_runtime_disabled_or_not_local_dev',
        message: 'Foundation GPU runtime probes run only in explicit local-dev worker execution.',
        tool: input.toolId,
      },
      warnings: ['Foundation runtime is on-demand only; GPU must not start while the tool is idle.'],
    }
  }

  if (!input.outputDirectory) {
    return {
      status: 'skipped',
      tool: input.toolId,
      commandPlan,
      skipReason: {
        code: 'foundation_runtime_output_directory_missing',
        message: 'Foundation runtime execution requires a private local worker output directory.',
        tool: input.toolId,
      },
      warnings: [],
    }
  }

  const outputJsonPath = path.join(input.outputDirectory, 'model-runtime-foundation', `${input.toolId}.json`)
  const runtimeArgs = [
    '--tool-id',
    input.toolId,
    '--output-json',
    outputJsonPath,
    ...(input.allowCpuFoundationRuntime ? ['--allow-cpu'] : []),
  ]
  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/model-runtime-foundation/foundation_local.py',
      args: runtimeArgs,
      outputJsonPath,
      timeoutMs: input.timeoutMs,
      runtimeBackend: input.runtimeExecutionBackend,
      containerImage: input.runtimeContainerImage,
      containerPlatform: input.runtimeContainerPlatform,
      containerGpu: input.runtimeContainerGpu,
      containerBindMounts: buildAiGraphicsRuntimeContainerBindMounts({
        readWritePaths: [input.outputDirectory],
      }),
      proofExpectation: {
        expectedToolId: input.toolId,
        requireCuda: input.allowCpuFoundationRuntime !== true,
        requireNoModelDownload: true,
        requireNoProviderRuntime: true,
        requireNoPublicArtifact: true,
        requireNoSignedUrl: true,
      },
    })
    return {
      status: 'completed',
      tool: input.toolId,
      commandPlan: {
        ...commandPlan,
        executes: true,
        expectedOutputPath: outputJsonPath,
        summary: input.allowCpuFoundationRuntime
          ? 'AI graphics foundation runtime probe executed on-demand with explicit CPU tensor/package checks and offline package imports only.'
          : 'AI graphics foundation runtime probe executed on-demand with CUDA visibility and offline package imports only.',
      },
      outputJsonPath: runtimeResult.outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
      outputJsonSha256: runtimeResult.outputJsonSha256,
      warnings: ['Foundation runtime probe produced private worker JSON only; it did not load models or create media artifacts.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: input.toolId,
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['Foundation runtime probe failed before producing accepted local proof output.'],
    }
  }
}
