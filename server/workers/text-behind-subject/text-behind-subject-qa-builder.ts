import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import { issue } from '../masks/mask-execution-types'
import type { DepthCompositionManifest, TextBehindSubjectExecutionInput, TextLayerPlan } from './text-behind-subject-types'

export function buildTextBehindSubjectQAResults(input: {
  executionInput: TextBehindSubjectExecutionInput
  textLayerPlan?: TextLayerPlan
  depthCompositionManifest?: DepthCompositionManifest
}): QualityGateResult[] {
  const confidence = input.executionInput.maskConfidence ?? 0.72
  const issues = [
    ...(confidence < 0.82 ? [issue('text_behind_subject_mask_confidence_low', 'Text-behind-subject is blocked or downgraded because mask confidence is low.', 'blocking')] : []),
    ...(!input.depthCompositionManifest ? [issue('depth_composition_manifest_missing', 'Depth composition metadata is required before preview.', 'blocking')] : []),
    ...(input.executionInput.allowFinalRender === true ? [issue('final_render_attempted', 'Final render is out of scope for M15C.', 'blocking')] : []),
  ]
  return [
    buildGate(input.executionInput, 'render_asset_integrity', issues),
    buildGate(input.executionInput, 'caption_safe_zone', input.textLayerPlan ? [] : [issue('text_layer_plan_missing', 'Text layer plan is required for safe-zone QA.', 'warning')]),
  ]
}

function buildGate(
  input: TextBehindSubjectExecutionInput,
  gateType: QualityGateResult['gateType'],
  issues: ReturnType<typeof issue>[],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `text-behind-subject-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'text-behind-subject-dry-run',
    recipeId: 'text_behind_subject_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.76 : 0.95,
    threshold: 0.82,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'fallback_text_placement', reason: `Resolve ${gateType} before text-behind-subject preview.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15C metadata checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking,
  }
}
