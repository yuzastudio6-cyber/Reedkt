import path from 'node:path'
import { runAiGraphicsPythonRuntimeScript } from '../ai-graphics-runtime-script-runner'

export type AiGraphicsFoundationRuntimeToolId = 'torch_torchvision' | 'transformers'

export interface AiGraphicsFoundationRuntimeInput {
  mode: 'dry_run' | 'local_dev' | 'container_ready' | 'production_blocked' | 'production_ready'
  toolId: AiGraphicsFoundationRuntimeToolId
  workspaceId?: string
  projectId?: string
  approvedSnapshotId?: string
  outputDirectory?: string
  enableFoundationRuntimeExecution?: boolean
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
  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/model-runtime-foundation/foundation_local.py',
      args: ['--tool-id', input.toolId, '--output-json', outputJsonPath],
      outputJsonPath,
      timeoutMs: input.timeoutMs,
    })
    return {
      status: 'completed',
      tool: input.toolId,
      commandPlan: {
        ...commandPlan,
        executes: true,
        expectedOutputPath: outputJsonPath,
        summary: 'AI graphics foundation runtime probe executed on-demand with CUDA visibility and offline package imports only.',
      },
      outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
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
