import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import { enhancementIssue } from './enhancement-execution-types'
import type { EnhancementExecutionInput, EnhancementExecutionValidationResult, EnhancementTaskPlan, EnhancementToolExecutionResult } from './enhancement-execution-types'

export function buildEnhancementQAResults(input: {
  executionInput: EnhancementExecutionInput
  taskPlan: EnhancementTaskPlan
  validation: EnhancementExecutionValidationResult
  toolResults: EnhancementToolExecutionResult[]
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => enhancementIssue(item.code, item.message, item.severity))
  const artifactIssues = [
    ...validationIssues.filter((item) => item.code.includes('target') || item.code.includes('sample')),
    ...(input.taskPlan.recommendedNoEnhancement ? [enhancementIssue('enhancement_not_recommended', 'No enhancement should run without source quality evidence or approved request.', 'warning')] : []),
    ...input.taskPlan.sampleFirstPolicy.rejectConditions.map((condition) => enhancementIssue(`reject_condition_${condition}`, `Sample QA must reject ${condition.replace(/_/g, ' ')}.`, 'warning')),
  ]
  const integrityIssues = [
    ...validationIssues.filter((item) => item.code.includes('final_render') || item.code.includes('model_download') || item.code.includes('arbitrary') || item.code.includes('overwrite')),
    ...(!input.taskPlan.sampleFirstPolicy.sampleFirst ? [enhancementIssue('sample_first_missing', 'Enhancement must be sample-first.', 'blocking')] : []),
    ...(input.outputArtifactIds?.length ? [] : [enhancementIssue('enhancement_artifact_plan_only', 'Enhancement artifacts are planned private refs unless local-dev tools actually run.', 'warning')]),
  ]
  return [
    buildGate(input.executionInput, 'enhancement_artifacts', artifactIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'render_asset_integrity', integrityIssues, input.outputArtifactIds),
  ]
}

function buildGate(
  input: EnhancementExecutionInput,
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
  outputArtifactIds: string[] = [],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `enhancement-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'enhancement-dry-run',
    recipeId: 'video_enhancement_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.74 : 0.94,
    threshold: 0.82,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds,
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_enhancement_execution', reason: `Resolve ${gateType} issues before preview/future render.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15D deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('hallucinated') || item.code.includes('plastic')),
  }
}
