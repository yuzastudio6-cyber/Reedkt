import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import { slowMotionIssue } from './slow-motion-execution-types'
import type { SlowMotionExecutionInput, SlowMotionExecutionValidationResult, SlowMotionTaskPlan, SlowMotionToolExecutionResult } from './slow-motion-execution-types'

export function buildSlowMotionQAResults(input: {
  executionInput: SlowMotionExecutionInput
  taskPlan: SlowMotionTaskPlan
  validation: SlowMotionExecutionValidationResult
  toolResults: SlowMotionToolExecutionResult[]
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => slowMotionIssue(item.code, item.message, item.severity))
  const artifactIssues = [
    ...validationIssues.filter((item) => item.code.includes('clip') || item.code.includes('factor')),
    slowMotionIssue('ghosting_risk_placeholder', 'Slow-motion QA must inspect ghosting, trails, and duplicated objects before preview/future render.', 'warning'),
    slowMotionIssue('warped_face_risk_placeholder', 'FILM/native speed plans require face/person warping review.', 'warning'),
    ...(input.outputArtifactIds?.length ? [] : [slowMotionIssue('slow_motion_artifact_plan_only', 'Slow-motion artifacts are planned private refs unless local-dev tools actually run.', 'warning')]),
  ]
  const integrityIssues = [
    ...validationIssues.filter((item) => item.code.includes('final_render') || item.code.includes('model_download') || item.code.includes('arbitrary') || item.code.includes('overwrite')),
    ...(input.taskPlan.finalRenderAllowed ? [slowMotionIssue('final_render_attempted', 'Final render/export is not allowed in M15D.', 'blocking')] : []),
  ]
  return [
    buildGate(input.executionInput, 'slow_motion_artifacts', artifactIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'render_asset_integrity', integrityIssues, input.outputArtifactIds),
  ]
}

function buildGate(
  input: SlowMotionExecutionInput,
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
  outputArtifactIds: string[] = [],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `slow-motion-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'slow-motion-dry-run',
    recipeId: 'slow_motion_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.72 : 0.94,
    threshold: 0.82,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds,
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_slow_motion_execution', reason: `Resolve ${gateType} issues before preview/future render.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15D deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('ghosting') || item.code.includes('warped')),
  }
}
