import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ColorAnalysisSummary, ColorExecutionPlan, ColorExecutionValidationResult, ColorPreviewExecutionResult } from './color-execution-types'

export function buildColorExecutionQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  analysis: ColorAnalysisSummary
  executionPlan: ColorExecutionPlan
  validation: ColorExecutionValidationResult
  previewResult?: ColorPreviewExecutionResult
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => ({
    code: item.code,
    message: item.message,
    severity: item.severity,
  }))
  const exposureIssues = [
    ...validationIssues.filter((item) => item.code.includes('color_intensity')),
    ...(input.analysis.highlightRisk === 'high' ? [issue('highlight_clipping_risk', 'Highlight clipping risk requires review.', 'blocking')] : []),
    ...(input.analysis.shadowRisk === 'high' ? [issue('crushed_shadow_risk', 'Shadow/crushed black risk requires review.', 'warning')] : []),
    ...(input.analysis.overexposed ? [issue('overexposed_source_warning', 'Source appears overexposed or washed out.', 'warning')] : []),
    ...(input.analysis.underexposed ? [issue('underexposed_source_warning', 'Source appears underexposed.', 'warning')] : []),
  ]
  const skinIssues = [
    ...(input.analysis.skinToneRisk === 'high' ? [issue('skin_tone_risk', 'Skin tone risk requires human review.', 'blocking')] : []),
    ...(input.analysis.skinToneRisk === 'unknown' ? [issue('skin_tone_evidence_missing', 'Skin tone evidence is missing; keep correction conservative.', 'warning')] : []),
  ]
  const exportIssues = [
    ...validationIssues.filter((item) => item.code.includes('final_export') || item.code.includes('lut')),
    ...(!input.executionPlan.selectedOperations.includes('output_color_transform') ? [issue('output_color_transform_missing', 'Output color transform metadata is required.', 'blocking')] : []),
    ...(input.analysis.hdrDetected ? [issue('hdr_source_transform_review', 'HDR source assumptions require color-space review.', 'warning')] : []),
    ...(input.previewResult?.status === 'failed' ? [issue('graded_preview_failed', input.previewResult.errorMessage ?? 'Graded preview failed.', 'warning')] : []),
  ]
  const shotIssues = [
    ...(input.analysis.shotMismatch && !input.executionPlan.shotMatchPlan.enabled ? [issue('shot_match_missing', 'Shot mismatch requires a shot match plan.', 'blocking')] : []),
    ...(input.executionPlan.shotMatchPlan.enabled ? [] : [issue('shot_match_not_needed_or_missing_evidence', 'Shot matching is not enabled because mismatch evidence is limited.', 'warning')]),
  ]

  return [
    buildGate(input, 'color_exposure', exposureIssues),
    buildGate(input, 'color_skin_tone', skinIssues),
    buildGate(input, 'color_export_space', exportIssues),
    buildGate(input, 'color_shot_match', shotIssues),
  ]
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
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `color-execution-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'color-execution-dry-run',
    recipeId: 'color_grade_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.76 : 0.95,
    threshold: 0.8,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_color_execution', reason: `Resolve ${gateType} issues before preview/future export.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15B deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('skin') || item.code.includes('lut')),
  }
}

function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
