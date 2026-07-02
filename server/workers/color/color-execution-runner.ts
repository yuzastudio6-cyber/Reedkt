import { buildColorAnalysisSummary } from './color-analysis-summary-builder'
import { buildColorExecutionPlan } from './color-execution-plan-builder'
import { validateColorExecutionPolicy } from './color-execution-policy'
import { validateColorExecutionInput, validateColorExecutionPlan } from './color-execution-validator'
import { buildFFmpegColorPreviewCommandPlan } from './ffmpeg-color-command-builder'
import { runFFmpegColorPreview } from './ffmpeg-color-preview-runner'
import { runOpenColorIOTransform } from './opencolorio-adapter'
import { runOpenImageIOFrameTransform } from './openimageio-adapter'
import { buildColorArtifact } from './color-artifact-writer'
import { buildColorExecutionQAResults } from './color-execution-qa-builder'
import { buildColorExecutionResult } from './color-execution-result-builder'
import type { ColorExecutionInput, ColorExecutionResult, ColorToolSkipReason } from './color-execution-types'

export async function runColorExecution(input: ColorExecutionInput): Promise<ColorExecutionResult> {
  const policy = validateColorExecutionPolicy(input)
  if (!policy.allowed) {
    return buildColorExecutionResult({
      mode: input.mode,
      status: 'blocked',
      artifacts: [],
      qaResults: [],
      skippedReasons: policy.blockingReasons.map((reason): ColorToolSkipReason => ({ code: reason, message: reason })),
      warnings: policy.warnings,
      blocksPreview: true,
      blocksFinalExport: true,
    })
  }

  const analysis = buildColorAnalysisSummary(input)
  const inputValidation = validateColorExecutionInput(input)
  const executionPlan = buildColorExecutionPlan(input)
  const commandPlan = buildFFmpegColorPreviewCommandPlan({ executionInput: input, executionPlan })
  executionPlan.ffmpegOperationPlan.commandPlan = commandPlan
  const planValidation = validateColorExecutionPlan(executionPlan)
  const combinedValidation = {
    valid: inputValidation.valid && planValidation.valid,
    issues: [...inputValidation.issues, ...planValidation.issues],
  }
  const previewResult = await runFFmpegColorPreview({ executionInput: input, executionPlan })
  const ocioResult = await runOpenColorIOTransform({ executionInput: input })
  const oiioResult = await runOpenImageIOFrameTransform({
    executionInput: input,
    sourceFrameLocalPath: input.representativeFrameLocalPaths?.[0],
  })
  const artifactMode = input.mode === 'local_dev' ? 'local_dev' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'production_ready' ? 'production_ready' : 'dry_run'

  const analysisArtifactRecord = await buildColorArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'color_analysis_json',
    fileName: 'm15b-color-analysis.json',
    payload: analysis,
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
    contentType: 'application/json',
    sourceOfTruth: true,
    metadata: { executionPlanId: executionPlan.executionPlanId },
  })
  const recipeArtifactRecord = await buildColorArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'color_grade_recipe',
    fileName: 'm15b-color-grade-recipe.json',
    payload: { executionPlan, commandPlan, opencolorio: ocioResult.status, openimageio: oiioResult.status },
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
    contentType: 'application/json',
    sourceOfTruth: true,
    metadata: { executionPlanId: executionPlan.executionPlanId },
  })
  const qaResults = buildColorExecutionQAResults({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    analysis,
    executionPlan,
    validation: combinedValidation,
    previewResult,
  })
  const qaArtifactRecord = await buildColorArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'qa_report',
    fileName: 'm15b-color-qa.json',
    payload: qaResults,
    outputDirectory: input.outputDirectory,
    mode: artifactMode,
    contentType: 'application/json',
    sourceOfTruth: false,
    metadata: { executionPlanId: executionPlan.executionPlanId },
  })
  const artifacts = [
    analysisArtifactRecord.artifact,
    recipeArtifactRecord.artifact,
    qaArtifactRecord.artifact,
    ...(previewResult.gradedPreviewArtifact ? [previewResult.gradedPreviewArtifact] : []),
  ]
  const blockingQa = qaResults.some((gate) => gate.blocking)
  const blocked = !combinedValidation.valid || blockingQa || input.mode === 'production_ready'

  return buildColorExecutionResult({
    mode: input.mode,
    status: blocked ? 'blocked' : input.mode === 'container_ready' ? 'container_ready' : input.mode === 'dry_run' ? 'dry_run' : 'partial',
    executionPlan,
    colorAnalysisSummary: analysis,
    colorGradeRecipeArtifact: recipeArtifactRecord.artifact,
    gradedPreviewArtifact: previewResult.gradedPreviewArtifact,
    artifacts,
    qaResults,
    skippedReasons: [
      ...(previewResult.skipReason ? [previewResult.skipReason] : []),
      ...(ocioResult.skipReason ? [ocioResult.skipReason] : []),
      ...(oiioResult.skipReason ? [oiioResult.skipReason] : []),
    ],
    warnings: [
      ...policy.warnings,
      ...combinedValidation.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
      ...executionPlan.warnings,
      ...ocioResult.warnings,
      ...oiioResult.warnings,
      'Milestone 15B does not final export or full render.',
      ...(input.mode === 'production_ready' ? ['Production-ready color execution remains blocked until readiness/manual-review gates pass.'] : []),
    ],
    blocksPreview: combinedValidation.issues.some((issue) => issue.severity === 'blocking') || blockingQa,
    blocksFinalExport: true,
  })
}
