import { buildAudioAiApprovalReport } from './audio-ai-approval-report-builder'

export function buildAudioAiToolSummary(): string {
  const report = buildAudioAiApprovalReport()
  return [
    'Audio AI tool summary',
    `Planning recommendation: ${report.futureScope.audioAiPlanningRecommendation}`,
    `Phase 36B ready: ${report.phase36BReadiness.ready}`,
    `Phase 36B status: ${report.phase36BReadiness.status}`,
    '',
    ...report.evidenceReview.tools.flatMap((tool) => [
      `${tool.toolName}`,
      `- toolId: ${tool.toolId}`,
      `- role: ${tool.role}`,
      `- status: ${tool.currentStatus}`,
      `- license: ${tool.licenseName}`,
      `- approved artifact source: ${tool.approvedArtifactSource ?? 'none'}`,
      `- approved checksum: ${tool.approvedChecksum ?? 'none'}`,
      `- approved storage path: ${tool.approvedStoragePath ?? 'none'}`,
    ]),
    '',
    `Audio AI download allowed: ${report.audioAiDownloadAllowed}`,
    `Audio AI runtime allowed: ${report.audioAiRuntimeAllowed}`,
    `Real-video audio AI cleanup allowed: ${report.realVideoAudioAiCleanupAllowed}`,
    'Phase 31 FFmpeg loudness baseline remains the only proven controlled real-video audio processing path.',
  ].join('\n')
}
