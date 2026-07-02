import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { MaskExecutionInput, MaskExecutionValidationResult, MaskTaskPlan, MaskToolExecutionResult } from './mask-execution-types'
import { issue } from './mask-execution-types'

export function buildMaskExecutionQAResults(input: {
  executionInput: MaskExecutionInput
  taskPlan: MaskTaskPlan
  validation: MaskExecutionValidationResult
  toolResults: MaskToolExecutionResult[]
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => issue(item.code, item.message, item.severity))
  const confidence = input.executionInput.maskConfidenceHint ?? 0.72
  const edgeIssues = [
    ...validationIssues.filter((item) => item.code.includes('unsafe') || item.code.includes('overwrite')),
    ...(confidence < 0.78 ? [issue('mask_edge_confidence_low', 'Mask edge confidence is low; preview should downgrade or request review.', 'warning')] : []),
    ...(input.taskPlan.refinementPlan.operations.includes('edge_cleanup') && noToolPlannedOrCompleted(input.toolResults, 'opencv') ? [issue('edge_refinement_not_run', 'Edge cleanup is planned but OpenCV refinement did not run.', 'warning')] : []),
  ]
  const temporalIssues = [
    ...(input.taskPlan.temporalSmoothingPlan.required ? [issue('temporal_smoothing_not_verified', input.taskPlan.temporalSmoothingPlan.warningIfNotRun, 'warning')] : []),
    ...(input.taskPlan.temporalSmoothingPlan.trackingRequired && noToolPlannedOrCompleted(input.toolResults, 'sam2') ? [issue('sam2_tracking_not_run', 'Tracking/propagation is required but SAM2 did not run.', 'warning')] : []),
  ]
  const coverageIssues = [
    ...validationIssues.filter((item) => item.code.includes('subject')),
    ...(confidence < 0.7 ? [issue('subject_coverage_low', 'Subject coverage risk is too high for text-behind-subject.', 'blocking')] : []),
  ]
  const integrityIssues = [
    ...validationIssues.filter((item) => item.code.includes('final_render') || item.code.includes('model_download') || item.code.includes('arbitrary')),
    ...(input.taskPlan.finalRenderAllowed ? [issue('final_render_attempted', 'Final render must not be attempted in M15C.', 'blocking')] : []),
    ...(input.outputArtifactIds?.length ? [] : [issue('mask_artifact_plan_only', 'Mask artifacts are private planned refs unless local-dev tools actually run.', 'warning')]),
  ]

  return [
    buildGate(input.executionInput, 'mask_edge_quality', edgeIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'mask_temporal_stability', temporalIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'mask_subject_coverage', coverageIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'render_asset_integrity', integrityIssues, input.outputArtifactIds),
  ]
}

function buildGate(
  input: MaskExecutionInput,
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
  outputArtifactIds: string[] = [],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `mask-execution-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'mask-execution-dry-run',
    recipeId: input.maskIntent === 'text_behind_subject' ? 'text_behind_subject_recipe' : 'background_removal_image_recipe',
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
      ? [{ action: 'review_mask_execution', reason: `Resolve ${gateType} issues before preview/future render.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15C deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('confidence') || item.code.includes('tracking')),
  }
}

function noToolPlannedOrCompleted(results: MaskToolExecutionResult[], tool: MaskToolExecutionResult['tool']): boolean {
  const result = results.find((item) => item.tool === tool)
  return !result || (result.status !== 'planned' && result.status !== 'completed')
}
