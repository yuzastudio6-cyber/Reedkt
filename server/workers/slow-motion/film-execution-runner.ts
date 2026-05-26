import { existsSync } from 'node:fs'
import { buildSlowMotionArtifactRecord } from './slow-motion-artifact-writer'
import type { SlowMotionExecutionInput, SlowMotionTaskPlan, SlowMotionToolCommandPlan, SlowMotionToolExecutionResult } from './slow-motion-execution-types'

export function buildFilmCommandPlan(input: {
  executionInput: SlowMotionExecutionInput
  taskPlan: SlowMotionTaskPlan
}): SlowMotionToolCommandPlan {
  return {
    tool: 'film',
    command: 'python',
    args: [
      '-m',
      'film',
      '--input',
      input.executionInput.proxyVideoLocalPath ?? input.executionInput.sourceVideoLocalPath ?? '[private-artifact-ref]',
      '--output',
      input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/film-interpolated-sample.mp4` : '[worker-temp-film-sample]',
      '--slow-motion-factor',
      String(input.taskPlan.slowMotionFactor),
      '--selected-ranges-json',
      JSON.stringify(input.taskPlan.selectedClipRanges.map((range) => ({ start: range.startSeconds, end: range.endSeconds }))),
      '--no-download',
    ],
    expectedOutputPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/film-interpolated-sample.mp4` : undefined,
    executes: false,
    summary: 'FILM selected-clip interpolation command plan; no checkpoint download and no execution by builder.',
  }
}

export async function runFilmInterpolation(input: {
  executionInput: SlowMotionExecutionInput
  taskPlan: SlowMotionTaskPlan
}): Promise<SlowMotionToolExecutionResult> {
  const commandPlan = buildFilmCommandPlan(input)
  const executionInput = input.executionInput
  if (input.taskPlan.primaryTool !== 'film') {
    return { status: 'skipped', tool: 'film', commandPlan, skipReason: { code: 'film_not_selected', message: 'FILM is not selected for this slow-motion plan.', tool: 'film' }, warnings: [] }
  }
  if (executionInput.mode !== 'local_dev' || executionInput.enableModelSlowMotionExecution !== true) {
    return { status: 'skipped', tool: 'film', commandPlan, skipReason: { code: 'film_disabled_or_not_local_dev', message: 'FILM runs only in explicit local-dev model execution.', tool: 'film' }, warnings: [] }
  }
  if (!executionInput.filmModelLocalPath || !existsSync(executionInput.filmModelLocalPath)) {
    return { status: 'skipped', tool: 'film', commandPlan, skipReason: { code: 'film_model_missing', message: 'FILM checkpoint is not available locally; no download attempted.', tool: 'film' }, warnings: [] }
  }
  const sourcePath = executionInput.proxyVideoLocalPath ?? executionInput.sourceVideoLocalPath
  if (!sourcePath || !existsSync(sourcePath)) {
    return { status: 'skipped', tool: 'film', commandPlan, skipReason: { code: 'film_source_missing', message: 'Safe local selected clip/proxy source is missing.', tool: 'film' }, warnings: [] }
  }
  return {
    status: 'planned',
    tool: 'film',
    commandPlan,
    artifact: buildSlowMotionArtifactRecord({
      workspaceId: executionInput.workspaceId,
      projectId: executionInput.projectId,
      mediaAssetId: executionInput.mediaAssetId,
      artifactType: 'interpolated_video',
      fileName: 'film-interpolated-sample.mp4',
      sourceOfTruth: true,
      metadata: { tool: 'film', plannedOnly: true, selectedClipOnly: true },
    }),
    warnings: ['FILM local-dev execution is scaffolded only; no interpolation is run by M15D smoke paths.'],
  }
}
