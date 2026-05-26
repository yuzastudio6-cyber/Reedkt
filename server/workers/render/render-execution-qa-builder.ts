import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import { renderIssue } from './render-execution-types'
import type { FinalRenderExecutionInput, RenderExecutionManifest, RenderExecutionValidationResult } from './render-execution-types'

export function buildRenderExecutionQAResults(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  validation: RenderExecutionValidationResult
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((issue): ProductionToolIssue => renderIssue(issue.code, issue.message, issue.severity))
  const gates: QualityGateResult[] = [
    buildGate(input.executionInput, 'render_asset_integrity', [
      ...validationIssues.filter((issue) => issue.code.includes('asset') || issue.code.includes('reference') || issue.code.includes('overwrite')),
      ...(input.executionManifest.resolvedAssets.length === 0 ? [renderIssue('render_assets_missing', 'No render assets were resolved.', 'blocking')] : []),
    ], input.outputArtifactIds),
    buildGate(input.executionInput, 'render_timeline_integrity', validationIssues.filter((issue) => issue.code.includes('duration') || issue.code.includes('fps') || issue.code.includes('canvas')), input.outputArtifactIds),
  ]
  if (input.executionManifest.captions.length > 0) {
    gates.push(buildGate(input.executionInput, 'caption_safe_zone', [], input.outputArtifactIds))
    gates.push(buildGate(input.executionInput, 'caption_readability', [], input.outputArtifactIds))
  }
  if (input.executionManifest.audio.length > 0) gates.push(buildGate(input.executionInput, 'audio_sync', [renderIssue('audio_sync_placeholder', 'Audio sync is preserved as metadata until final media probe verifies it.', 'warning')], input.outputArtifactIds))
  if (input.executionManifest.colorArtifactIds.length > 0) gates.push(buildGate(input.executionInput, 'color_export_space', [], input.outputArtifactIds))
  if (input.executionManifest.masks.length > 0) gates.push(buildGate(input.executionInput, 'mask_subject_coverage', [], input.outputArtifactIds))
  if (input.executionManifest.enhancementArtifactIds.length > 0) gates.push(buildGate(input.executionInput, 'enhancement_artifacts', [], input.outputArtifactIds))
  if (input.executionManifest.slowMotionArtifactIds.length > 0) gates.push(buildGate(input.executionInput, 'slow_motion_artifacts', [renderIssue('slow_motion_final_probe_pending', 'Slow-motion artifacts need final render probe before delivery.', 'warning')], input.outputArtifactIds))
  return gates
}

export function buildGate(
  input: FinalRenderExecutionInput,
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
  outputArtifactIds: string[] = [],
): QualityGateResult {
  const blocking = issues.some((issue) => issue.severity === 'blocking')
  const warning = issues.some((issue) => issue.severity === 'warning')
  return {
    id: `final-render-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'final-render-dry-run',
    recipeId: gateType === 'final_delivery' || gateType.startsWith('export_') ? 'final_export_recipe' : 'motion_graphics_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.76 : 0.95,
    threshold: 0.82,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds,
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_final_render_execution', reason: `Resolve ${gateType} issues before final delivery.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M16A deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking && gateType !== 'final_delivery',
    blocksFinalExport: gateType === 'final_delivery' || blocking,
    humanReviewRequired: blocking,
  }
}
