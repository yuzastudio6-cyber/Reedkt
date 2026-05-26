import type { FinalRenderExecutionInput, FinalRenderExecutionResult, RenderCommandPlan, RenderExecutionManifest, RenderToolExecutionResult } from './render-execution-types'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'

export function buildRenderExecutionResult(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest?: RenderExecutionManifest
  commandPlans: RenderCommandPlan[]
  renderArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  toolResults: RenderToolExecutionResult[]
  warnings: string[]
  blocked: boolean
}): FinalRenderExecutionResult {
  const finalExportArtifact = input.renderArtifacts.find((artifact) => artifact.artifactType === 'final_export')
  const previewArtifact = input.renderArtifacts.find((artifact) => artifact.artifactType === 'preview_video')
  const finalDeliveryGate = input.qaResults.find((gate) => gate.gateType === 'final_delivery')
  const finalDeliveryAllowed = finalDeliveryGate?.status === 'passed' && Boolean(finalExportArtifact)
  return {
    mode: input.executionInput.mode,
    status: input.blocked
      ? 'blocked'
      : input.executionInput.mode === 'container_ready'
        ? 'container_ready'
        : input.executionInput.mode === 'dry_run'
          ? 'dry_run'
          : 'partial',
    executionManifest: input.executionManifest,
    commandPlans: input.commandPlans,
    renderArtifacts: input.renderArtifacts,
    previewArtifact,
    finalExportArtifact,
    qaResults: input.qaResults,
    skippedReasons: input.toolResults.flatMap((result) => result.skipReason ? [result.skipReason] : []),
    warnings: input.warnings,
    blocksPreview: input.qaResults.some((gate) => gate.blocksPreview),
    blocksFinalExport: !finalDeliveryAllowed || input.qaResults.some((gate) => gate.blocksFinalExport && gate.gateType !== 'final_delivery'),
    finalDeliveryAllowed,
  }
}
