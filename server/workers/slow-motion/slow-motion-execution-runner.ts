import { buildSlowMotionArtifact } from './slow-motion-artifact-writer'
import { validateSlowMotionExecutionInput, validateSlowMotionTaskPlan } from './slow-motion-execution-validator'
import { validateSlowMotionExecutionPolicy } from './slow-motion-execution-policy'
import { buildSlowMotionTaskPlan } from './slow-motion-task-plan-builder'
import { buildSlowMotionQAResults } from './slow-motion-qa-builder'
import { runFfmpegSpeedChange } from './ffmpeg-speed-change-runner'
import { runFilmInterpolation } from './film-execution-runner'
import type { SlowMotionExecutionInput, SlowMotionExecutionResult, SlowMotionToolSkipReason } from './slow-motion-execution-types'

export async function runSlowMotionExecution(input: SlowMotionExecutionInput): Promise<SlowMotionExecutionResult> {
  const policy = validateSlowMotionExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      interpolatedArtifacts: [],
      previewArtifacts: [],
      qaResults: [],
      fallbackDecisions: [],
      skippedReasons: policy.blockingReasons.map((reason): SlowMotionToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    }
  }

  const inputValidation = validateSlowMotionExecutionInput(input)
  const taskPlan = buildSlowMotionTaskPlan(input)
  const planValidation = validateSlowMotionTaskPlan(taskPlan)
  const combinedValidation = {
    valid: inputValidation.valid && planValidation.valid,
    issues: [...inputValidation.issues, ...planValidation.issues],
  }
  const toolResults = [
    await runFilmInterpolation({ executionInput: input, taskPlan }),
    await runFfmpegSpeedChange({ executionInput: input, taskPlan }),
  ]
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const plannedArtifacts = await Promise.all(taskPlan.expectedArtifacts
    .filter((artifactType) => artifactType !== 'preview_video')
    .map((artifactType) => buildSlowMotionArtifact({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      artifactType,
      fileName: fileNameForArtifact(artifactType),
      payload: artifactType === 'qa_report' ? undefined : { taskPlanId: taskPlan.taskPlanId, plannedOnly: true, artifactType },
      outputDirectory: input.outputDirectory,
      mode: artifactMode,
      sourceOfTruth: artifactType !== 'qa_report',
      metadata: { taskPlanId: taskPlan.taskPlanId, plannedOnly: true },
    })))
  const interpolatedArtifacts = [
    ...plannedArtifacts.map((record) => record.artifact),
    ...toolResults.flatMap((result) => [
      ...(result.artifact ? [result.artifact] : []),
      ...(result.artifacts ?? []),
    ]),
  ]
  const qaResults = buildSlowMotionQAResults({
    executionInput: input,
    taskPlan,
    validation: combinedValidation,
    toolResults,
    outputArtifactIds: interpolatedArtifacts.map((artifact) => artifact.id),
  })
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa || input.mode === 'production_ready'
  return {
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    slowMotionTaskPlan: taskPlan,
    interpolatedArtifacts,
    previewArtifacts: interpolatedArtifacts.filter((artifact) => artifact.artifactType === 'preview_video'),
    qaResults,
    fallbackDecisions: taskPlan.primaryTool === 'film' ? ['fallback_to_ffmpeg_native_speed_if_film_unavailable_or_qa_risk_high'] : ['selected_clip_only_native_speed_or_planning_path'],
    skippedReasons: toolResults.flatMap((result) => result.skipReason ? [result.skipReason] : []),
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...taskPlan.warnings,
      ...toolResults.flatMap((result) => result.warnings),
      'Milestone 15D does not final render/export slow-motion media.',
      ...(input.mode === 'production_ready' ? ['Production-ready slow-motion execution remains blocked until readiness/model-weight/QA gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking') || blockingQa,
    blocksFinalExport: true,
  }
}

function fileNameForArtifact(artifactType: 'interpolated_video' | 'preview_video' | 'qa_report'): string {
  switch (artifactType) {
    case 'interpolated_video':
      return 'm15d-interpolated-video.mp4'
    case 'preview_video':
      return 'm15d-slow-motion-preview.mp4'
    case 'qa_report':
      return 'm15d-slow-motion-qa.json'
  }
}
