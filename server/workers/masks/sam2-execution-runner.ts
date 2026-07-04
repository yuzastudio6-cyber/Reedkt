import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  buildAiGraphicsRuntimeContainerBindMounts,
  runAiGraphicsPythonRuntimeScript,
} from '../ai-graphics-runtime-script-runner'
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
  const sourcePath = executionInput.sourceImageLocalPath ?? executionInput.representativeFrameLocalPaths?.[0]
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'sam2', commandPlan, skipReason: { code: 'sam2_source_frame_missing', message: 'Safe local source image or representative frame is missing.', tool: 'sam2' }, warnings: [] }
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
        '--source-image-path',
        sourcePath,
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
        readOnlyPaths: [executionInput.sam2CheckpointLocalPath, sourcePath],
        readWritePaths: [executionInput.outputDirectory],
      }),
      extraEnv: {
        REAL_MEDIA_INPUT_ENABLED: 'false',
        APPROVED_PRIVATE_SOURCE_FRAME_ENABLED: 'true',
      },
      proofExpectation: {
        expectedToolId: 'sam2',
        requireCuda: true,
        requireNoModelDownload: true,
        requireNoProviderRuntime: true,
        requireNoPublicArtifact: true,
        requireNoSignedUrl: true,
      },
    })
    return {
      status: 'completed',
      tool: 'sam2',
      commandPlan: { ...commandPlan, executes: true, summary: 'SAM2 local runtime script executed with private checkpoint and approved private source frame; no model download.' },
      outputJsonPath: runtimeResult.outputJsonPath,
      outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes,
      outputJsonSha256: runtimeResult.outputJsonSha256,
      artifacts: [
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'mask_sequence',
          fileName: 'sam2-mask-sequence.json',
          sourceOfTruth: true,
          metadata: { tool: 'sam2', runtimeExecuted: true, privateSourceFrameUsed: true },
        }),
        buildMaskArtifactRecord({
          workspaceId: executionInput.workspaceId,
          projectId: executionInput.projectId,
          mediaAssetId: executionInput.mediaAssetId,
          artifactType: 'qa_report',
          fileName: 'sam2-runtime-result.json',
          sourceOfTruth: true,
          metadata: { tool: 'sam2', runtimeExecuted: true, outputJsonSizeBytes: runtimeResult.outputJsonSizeBytes, outputJsonSha256: runtimeResult.outputJsonSha256 },
        }),
      ],
      warnings: ['SAM2 runtime executed against one approved private source frame only; full real-video temporal execution still requires a later worker milestone.'],
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
