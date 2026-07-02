import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { SmartCutExecutionPlan, SmartCutExecutionValidationResult, SmartCutPreviewResult } from './smart-cut-execution-types'

export function buildSmartCutExecutionQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  executionPlan: SmartCutExecutionPlan
  validation: SmartCutExecutionValidationResult
  previewResult?: SmartCutPreviewResult
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => ({
    code: item.code,
    message: item.message,
    severity: item.severity,
  }))
  const previewIssues = buildPreviewIssues(input)
  const finalDeliveryIssues: ProductionToolIssue[] = [{
    code: 'final_delivery_out_of_scope',
    message: 'Final delivery is not attempted or passed in Milestone 14.',
    severity: 'blocking',
  }]

  return [
    buildGate(input, 'cut_smoothness', validationIssues),
    buildGate(input, 'transcript_alignment', validationIssues.filter((issue) => issue.code.includes('word') || issue.code.includes('mid_word'))),
    buildGate(input, 'audio_sync', [], 'Audio sync is a placeholder gate in M14; final audio validation is deferred.'),
    buildGate(input, 'render_timeline_integrity', validationIssues.filter((issue) => issue.code.includes('timeline') || issue.code.includes('overlap') || issue.code.includes('duration'))),
    buildGate(input, 'export_duration_sync', previewIssues),
    buildGate(input, 'final_delivery', finalDeliveryIssues),
  ]
}

function buildPreviewIssues(input: {
  executionPlan: SmartCutExecutionPlan
  previewResult?: SmartCutPreviewResult
}): ProductionToolIssue[] {
  if (!input.previewResult || input.previewResult.status === 'skipped') {
    return [{
      code: 'preview_not_created',
      message: 'Proxy preview was not created; duration sync remains not checked.',
      severity: 'warning',
    }]
  }
  if (input.previewResult.status === 'failed') {
    return [{
      code: 'preview_failed',
      message: input.previewResult.errorMessage ?? 'Proxy preview failed.',
      severity: 'blocking',
    }]
  }
  if (input.executionPlan.targetDurationSeconds <= 0) {
    return [{
      code: 'preview_duration_zero',
      message: 'Preview duration cannot be checked against a zero-duration plan.',
      severity: 'blocking',
    }]
  }
  return []
}

function buildGate(
  input: {
    workspaceId: string
    projectId: string
    mediaAssetId: string
    toolExecutionPlanId?: string
  },
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
  placeholderNote?: string,
): QualityGateResult {
  const blocking = issues.some((issue) => issue.severity === 'blocking')
  const warning = issues.some((issue) => issue.severity === 'warning')
  return {
    id: `smart-cut-execution-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'smart-cut-execution-dry-run',
    recipeId: gateType === 'final_delivery' ? 'final_export_recipe' : 'smart_cut_recipe',
    gateType,
    status: gateType === 'final_delivery' ? 'blocked' : blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: gateType === 'final_delivery' || blocking ? 0.2 : warning ? 0.74 : 0.96,
    threshold: 0.8,
    required: gateType !== 'final_delivery',
    blocking: gateType === 'final_delivery' ? false : blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_smart_cut_execution', reason: `Resolve ${gateType} issues before preview or future export.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: placeholderNote ?? `${gateType} passed M14 deterministic execution checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: gateType !== 'final_delivery' && blocking,
    blocksFinalExport: true,
    humanReviewRequired: issues.some((issue) => issue.code.includes('protected') || issue.code.includes('meaning') || issue.code.includes('emotional')),
  }
}
