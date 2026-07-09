import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { MediaProbeResult } from '../media/media-worker-types'
import { renderIssue } from './render-execution-types'
import { buildGate } from './render-execution-qa-builder'
import type { FinalRenderExecutionInput, RenderExecutionManifest } from './render-execution-types'

export function buildExportDeliveryQAResults(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
  finalExportArtifact?: ToolArtifact
  outputProbe?: MediaProbeResult
  upstreamQaResults?: QualityGateResult[]
  outputArtifactIds?: string[]
}): QualityGateResult[] {
  const codecIssues = []
  if (input.executionManifest.exportSettings.container !== 'mp4') {
    codecIssues.push(renderIssue('unsupported_export_container', 'Final export must use mp4 in M16A.', 'blocking'))
  }
  if (input.outputProbe) {
    if (!input.outputProbe.formatName.toLowerCase().includes('mp4')) {
      codecIssues.push(renderIssue('output_container_mismatch', 'Rendered output is not an MP4-compatible container.', 'blocking'))
    }
    if (input.outputProbe.videoStreams[0]?.codecName !== 'h264') {
      codecIssues.push(renderIssue('output_video_codec_mismatch', 'Rendered output must contain H.264 video.', 'blocking'))
    }
    if (
      input.outputProbe.width !== input.executionManifest.canvas.width ||
      input.outputProbe.height !== input.executionManifest.canvas.height
    ) {
      codecIssues.push(renderIssue('output_canvas_mismatch', 'Rendered output dimensions do not match the approved canvas.', 'blocking'))
    }
  }

  const durationIssues = input.executionManifest.durationSeconds <= 0
    ? [renderIssue('invalid_duration', 'Export duration must be positive.', 'blocking')]
    : input.outputProbe
      ? Math.abs(input.outputProbe.durationSeconds - input.executionManifest.durationSeconds) <= Math.max(0.35, 3 / input.executionManifest.fps)
        ? []
        : [renderIssue('output_duration_mismatch', 'Rendered output duration does not match the approved timeline.', 'blocking')]
      : [renderIssue('duration_probe_pending', 'Export duration sync is command-planned until local-dev/future probe verifies media duration.', 'warning')]

  const audioIssues = input.outputProbe
    ? input.executionInput.sourceAudioRequired !== false && input.outputProbe.audioStreams.length === 0
      ? [renderIssue('output_audio_missing', 'Rendered output is missing the required source audio track.', 'blocking')]
      : []
    : [renderIssue('audio_sync_final_probe_pending', 'Audio/video sync needs final media probe before delivery.', 'warning')]
  const failedBlockingGates = (input.upstreamQaResults ?? []).filter((gate) => gate.blocking || gate.status === 'failed' || gate.status === 'blocked')
  const probedLocalOutputRequired = input.executionInput.mode === 'local_dev' && input.executionInput.enableLocalDevRender === true
  const finalDeliveryIssues = [
    ...(input.finalExportArtifact ? [] : [renderIssue('final_export_missing', 'final_delivery cannot pass without a final_export artifact.', 'blocking')]),
    ...(probedLocalOutputRequired && !input.outputProbe ? [renderIssue('local_render_output_probe_missing', 'Requested local execution cannot pass final delivery without a real probed output.', 'blocking')] : []),
    ...(failedBlockingGates.length > 0 ? [renderIssue('blocking_qa_gates_present', 'final_delivery cannot pass while blocking QA gates exist.', 'blocking')] : []),
    ...codecIssues.filter((issue) => issue.severity === 'blocking'),
    ...durationIssues.filter((issue) => issue.severity === 'blocking'),
    ...audioIssues.filter((issue) => issue.severity === 'blocking'),
  ]
  return [
    buildGate(input.executionInput, 'export_codec_format', codecIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'export_duration_sync', durationIssues, input.outputArtifactIds),
    buildGate(input.executionInput, 'audio_sync', audioIssues, input.outputArtifactIds),
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
