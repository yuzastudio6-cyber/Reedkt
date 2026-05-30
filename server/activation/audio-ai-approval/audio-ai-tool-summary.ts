import { buildAudioAiApprovalReport } from './audio-ai-approval-report-builder'
import { getApprovedDeepFilterNetDownloadEvidence } from '../audio-ai-download'

export function buildAudioAiToolSummary(): string {
  const report = buildAudioAiApprovalReport()
  const deepFilterNetDownload = getApprovedDeepFilterNetDownloadEvidence()
  const deepFilterNetDownloadVerified = deepFilterNetDownload.status === 'verified'
  return [
    'Audio AI tool summary',
    `Planning recommendation: ${report.futureScope.audioAiPlanningRecommendation}`,
    `Phase 36A report Phase 36B readiness: ${report.phase36BReadiness.ready}`,
    `Phase 36A report Phase 36B status: ${report.phase36BReadiness.status}`,
    `Phase 36B DeepFilterNet private artifacts verified: ${deepFilterNetDownloadVerified}`,
    `Phase 36B DeepFilterNet storage: ${deepFilterNetDownload.targetGcsPath}`,
    `Phase 36C generated-audio runtime verification candidate: ${deepFilterNetDownloadVerified}`,
    '',
    ...report.evidenceReview.tools.flatMap((tool) => [
      `${tool.toolName}`,
      `- toolId: ${tool.toolId}`,
      `- role: ${tool.role}`,
      `- status: ${tool.currentStatus}`,
      `- license: ${tool.licenseName}`,
      `- approved artifact source: ${tool.toolId === 'deepfilternet' && deepFilterNetDownloadVerified ? deepFilterNetDownload.selectedArtifacts.map((artifact) => artifact.sourceUrl).join(', ') : tool.approvedArtifactSource ?? 'none'}`,
      `- approved checksum: ${tool.toolId === 'deepfilternet' && deepFilterNetDownloadVerified ? deepFilterNetDownload.aggregateSha256 : tool.approvedChecksum ?? 'none'}`,
      `- approved storage path: ${tool.toolId === 'deepfilternet' && deepFilterNetDownloadVerified ? deepFilterNetDownload.targetGcsPath : tool.approvedStoragePath ?? 'none'}`,
    ]),
    '',
    `Audio AI download allowed: ${report.audioAiDownloadAllowed}`,
    `Audio AI runtime allowed: ${report.audioAiRuntimeAllowed}`,
    `Real-video audio AI cleanup allowed: ${report.realVideoAudioAiCleanupAllowed}`,
    'Phase 31 FFmpeg loudness baseline remains the only proven controlled real-video audio processing path.',
  ].join('\n')
}
