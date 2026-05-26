import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { renderIssue } from './render-execution-types'
import { buildGate } from './render-execution-qa-builder'
import type { FinalRenderExecutionInput, RenderExecutionManifest } from './render-execution-types'

export function buildExportDeliveryQAResults(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  finalExportArtifact?: ToolArtifact
  upstreamQaResults?: QualityGateResult[]
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const codecIssues = []
  if (input.executionManifest.exportSettings.container !== 'mp4') codecIssues.push(renderIssue('unsupported_export_container', 'Final export must use mp4 in M16A.', 'blocking'))
  const durationIssues = input.executionManifest.durationSeconds > 0
    ? [renderIssue('duration_probe_pending', 'Export duration sync is command-planned until local-dev/future probe verifies media duration.', 'warning')]
    : [renderIssue('invalid_duration', 'Export duration must be positive.', 'blocking')]
  const failedBlockingGates = (input.upstreamQaResults ?? []).filter((gate) => gate.blocking || gate.status === 'failed' || gate.status === 'blocked')
  const finalDeliveryIssues = [
    ...(input.finalExportArtifact ? [] : [renderIssue('final_export_missing', 'final_delivery cannot pass without a final_export artifact.', 'blocking')]),
    ...(failedBlockingGates.length > 0 ? [renderIssue('blocking_qa_gates_present', 'final_delivery cannot pass while blocking QA gates exist.', 'blocking')] : []),
  ]
  return [
    buildGate(input.executionInput, 'export_codec_format', codecIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'export_duration_sync', durationIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'audio_sync', [renderIssue('audio_sync_final_probe_pending', 'Audio/video sync needs final media probe before delivery.', 'warning')], input.outputArtifactIds),
    buildFinalDeliveryGate(input, finalDeliveryIssues, input.outputArtifactIds),
  ]
}

function buildFinalDeliveryGate(
  input: {
    executionInput: FinalRenderExecutionInput
    finalExportArtifact?: ToolArtifact
    upstreamQaResults?: QualityGateResult[]
  },
  issues: ReturnType<typeof renderIssue>[],
  outputArtifactIds: string[] = [],
): QualityGateResult {
  const gate = buildGate(input.executionInput, 'final_delivery', issues, outputArtifactIds)
  const passed = Boolean(input.finalExportArtifact) && issues.length === 0 && !(input.upstreamQaResults ?? []).some((item) => item.blocking || item.status === 'failed' || item.status === 'blocked')
  return {
    ...gate,
    status: passed ? 'passed' : gate.status,
    score: passed ? 0.96 : gate.score,
    blocking: !passed,
    blocksPreview: false,
    blocksFinalExport: !passed,
    fallbackRequired: !passed,
    humanReviewRequired: !passed,
  }
}
