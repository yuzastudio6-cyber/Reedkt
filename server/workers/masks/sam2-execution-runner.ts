import { existsSync } from 'node:fs'
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
  const sourcePath = executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'sam2', commandPlan, skipReason: { code: 'sam2_video_source_missing', message: 'Safe local video/proxy source is missing.', tool: 'sam2' }, warnings: [] }
  }
  return {
    status: 'planned',
    tool: 'sam2',
    commandPlan,
    artifact: buildMaskArtifactRecord({
      workspaceId: executionInput.workspaceId,
      projectId: executionInput.projectId,
      mediaAssetId: executionInput.mediaAssetId,
      artifactType: 'mask_sequence',
      fileName: 'sam2-tracking-mask-sequence.json',
      sourceOfTruth: true,
      metadata: { tool: 'sam2', trackingPlan: true, plannedOnly: true },
    }),
    warnings: ['SAM2 local-dev execution is scaffolded only; no tracking inference is run by M15C smoke paths.'],
  }
}
