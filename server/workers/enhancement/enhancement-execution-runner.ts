import { buildEnhancementArtifact } from './enhancement-artifact-writer'
import { validateEnhancementExecutionInput, validateEnhancementTaskPlan } from './enhancement-execution-validator'
import { validateEnhancementExecutionPolicy } from './enhancement-execution-policy'
import { buildEnhancementTaskPlan } from './enhancement-task-plan-builder'
import { buildEnhancementQAResults } from './enhancement-qa-builder'
import { runFfmpegEnhancementPreview } from './ffmpeg-enhancement-preview-runner'
import { runOpenCvEnhancementQA } from './opencv-enhancement-qa-adapter'
import { runRealEsrganEnhancement } from './real-esrgan-execution-runner'
import { runSharpEnhancementAdapter } from './sharp-enhancement-adapter'
import type { EnhancementExecutionInput, EnhancementExecutionResult, EnhancementToolSkipReason } from './enhancement-execution-types'

export async function runEnhancementExecution(input: EnhancementExecutionInput): Promise<EnhancementExecutionResult> {
  const policy = validateEnhancementExecutionPolicy(input)
  if (!policy.allowed) {
    return {
      mode: input.mode,
      status: 'blocked',
      enhancedArtifacts: [],
      previewArtifacts: [],
      qaResults: [],
      fallbackDecisions: [],
      skippedReasons: policy.blockingReasons.map((reason): EnhancementToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    }
  }

  const inputValidation = validateEnhancementExecutionInput(input)
  const taskPlan = buildEnhancementTaskPlan(input)
  const planValidation = validateEnhancementTaskPlan(taskPlan)
  const combinedValidation = {
    valid: inputValidation.valid && planValidation.valid,
    issues: [...inputValidation.issues, ...planValidation.issues],
  }
  const toolResults = [
    await runRealEsrganEnhancement({ executionInput: input, taskPlan }),
    await runFfmpegEnhancementPreview({ executionInput: input, taskPlan }),
    await runOpenCvEnhancementQA({ executionInput: input, taskPlan }),
    await runSharpEnhancementAdapter({ executionInput: input, taskPlan }),
  ]
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const plannedArtifacts = await Promise.all(taskPlan.expectedArtifacts
    .filter((artifactType) => artifactType !== 'preview_video')
    .map((artifactType) => buildEnhancementArtifact({
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
  const enhancedArtifacts = [
    ...plannedArtifacts.map((record) => record.artifact),
    ...toolResults.flatMap((result) => [
      ...(result.artifact ? [result.artifact] : []),
      ...(result.artifacts ?? []),
    ]),
  ]
  const qaResults = buildEnhancementQAResults({
    executionInput: input,
    taskPlan,
    validation: combinedValidation,
    toolResults,
    outputArtifactIds: enhancedArtifacts.map((artifact) => artifact.id),
  })
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa || input.mode === 'production_ready'
  return {
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    enhancementTaskPlan: taskPlan,
    enhancedArtifacts,
    previewArtifacts: enhancedArtifacts.filter((artifact) => artifact.artifactType === 'preview_video'),
    qaResults,
    fallbackDecisions: taskPlan.recommendedNoEnhancement ? ['skip_enhancement_until_quality_issue_or_approved_request'] : ['sample_first_before_full_enhancement'],
    skippedReasons: toolResults.flatMap((result) => result.skipReason ? [result.skipReason] : []),
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...taskPlan.warnings,
      ...toolResults.flatMap((result) => result.warnings),
      'Milestone 15D does not final render/export enhanced media.',
      ...(input.mode === 'production_ready' ? ['Production-ready enhancement execution remains blocked until readiness/model-weight/QA gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking') || blockingQa,
    blocksFinalExport: true,
  }
}

function fileNameForArtifact(artifactType: 'enhanced_video' | 'representative_frame' | 'preview_video' | 'qa_report'): string {
  switch (artifactType) {
    case 'enhanced_video':
      return 'm15d-enhanced-video.mp4'
    case 'representative_frame':
      return 'm15d-enhancement-sample-frame.png'
    case 'preview_video':
      return 'm15d-enhancement-preview.mp4'
    case 'qa_report':
      return 'm15d-enhancement-qa.json'
  }
}
