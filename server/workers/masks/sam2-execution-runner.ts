import { existsSync } from 'node:fs'
import path from 'node:path'
import { runAiGraphicsPythonRuntimeScript } from '../ai-graphics-runtime-script-runner'
import { buildMaskArtifactRecord } from './mask-artifact-writer'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolCommandPlan, MaskToolExecutionResult } from './mask-execution-types'

export function buildSam2CommandPlan(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): MaskToolCommandPlan {
  return {
    tool: 'sam2',
    command: 'python',
    args: [
      '-m',
      'sam2',
      '--video',
      input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? '[private-video-ref]',
      '--subject',
      input.executionInput.subjectSelection?.approvedSubjectLabel ?? 'approved_subject',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/sam2-mask-sequence` : '[worker-temp-mask-sequence]',
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/sam2-mask-sequence` : undefined,
    executes: false,
    summary: 'SAM2 segmentation/tracking command plan; no checkpoint download and no execution by builder.',
  }
}

export async function runSam2Tracking(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
}): Promise<MaskToolExecutionResult> {
  const commandPlan = buildSam2CommandPlan(input)
  const executionInput = input.executionInput
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelMaskExecution !== true) {
    return { status: 'skipped', tool: 'sam2', commandPlan, skipReason: { code: 'sam2_disabled_or_not_local_dev', message: 'SAM2 runs only in explicit local-dev model execution.', tool: 'sam2' }, warnings: [] }
  }
  if (!executionInput.sam2CheckpointLocalPath || !existsSync(executionInput.sam2CheckpointLocalPath)) {
    return { status: 'skipped', tool: 'sam2', commandPlan, skipReason: { code: 'sam2_checkpoint_missing', message: 'SAM2 checkpoint is not available locally; no download attempted.', tool: 'sam2' }, warnings: [] }
  }
  if (!executionInput.outputDirectory) {
    return { status: 'skipped', tool: 'sam2', commandPlan, skipReason: { code: 'sam2_output_directory_missing', message: 'SAM2 execution requires a private local worker output directory.', tool: 'sam2' }, warnings: [] }
  }
  const workDir = path.join(executionInput.outputDirectory, 'sam2-runtime')
  const outputJsonPath = path.join(workDir, 'sam2-runtime-result.json')
  try {
    const runtimeResult = await runAiGraphicsPythonRuntimeScript({
      scriptRelativePath: 'docker/prod/sam2-runtime/sam2_runtime_local.py',
      args: [
        '--work-dir',
        workDir,
        '--checkpoint-path',
        executionInput.sam2CheckpointLocalPath,
        '--output-json',
        outputJsonPath,
      ],
      outputJsonPath,
      timeoutMs: executionInput.timeoutMs,
      extraEnv: {
        REAL_MEDIA_INPUT_ENABLED: 'false',
      },
    })
    return {
      status: 'completed',
      tool: 'sam2',
      commandPlan: { ...commandPlan, executes: true, summary: 'SAM2 local runtime script executed with private checkpoint and generated fixture; no model download.' },
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_sequence',
          fileName: 'sam2-mask-sequence.json',
          sourceOfTruth: true,
          metadata: { tool: 'sam2', runtimeExecuted: true, generatedFixtureOnly: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'sam2-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'sam2', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes },
        }),
      ],
      warnings: ['SAM2 runtime executed against the approved generated fixture only; real-video temporal execution still requires a later real-media worker milestone.'],
    }
  } catch (error) {
    return {
      status: 'failed',
      tool: 'sam2',
      commandPlan,
      errorMessage: error instanceof Error ? error.message : String(error),
      warnings: ['SAM2 runtime script failed before producing accepted local proof output.'],
    }
  }
}
