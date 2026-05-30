import { buildAudioAiApprovalReport } from '../audio-ai-approval'
import { getApprovedDeepFilterNetDownloadEvidence } from '../audio-ai-download'
import { getApprovedDeepFilterNetRuntimeEvidence } from '../deepfilternet-runtime'
import { getApprovedDeepFilterNetFeatureE2EEvidence } from '../deepfilternet-feature-e2e'
import { getApprovedRealVideoDeepFilterNetEvidence } from '../real-video-deepfilternet-audio-cleanup'
import { audioSystemReadinessConfig } from './audio-system-readiness-policy'
import type { AudioSystemEvidenceChainEntry } from './audio-system-readiness-types'

export function buildAudioSystemEvidenceChain(): AudioSystemEvidenceChainEntry[] {
  const approval = buildAudioAiApprovalReport()
  const download = getApprovedDeepFilterNetDownloadEvidence()
  const runtime = getApprovedDeepFilterNetRuntimeEvidence()
  const realVideo = getApprovedRealVideoDeepFilterNetEvidence()
  const feature = getApprovedDeepFilterNetFeatureE2EEvidence()

  return [
    {
      phase: '31',
      name: 'FFmpeg loudness-only audio cleanup',
      status: 'complete',
      runId: audioSystemReadinessConfig.phase31RunId,
      reportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase31/phase31-20260528T13060/reports/phase31-report.json',
      summary: 'Phase 31 completed private FFmpeg loudness measurement and loudnorm normalization for the approved chain.',
      blockers: [],
    },
    {
      phase: '36A',
      name: 'Audio AI approval workflow',
      status: 'complete',
      summary: `Phase 36A completed the non-mutating audio AI approval workflow with recommendation ${approval.futureScope.audioAiPlanningRecommendation}.`,
      blockers: [],
    },
    {
      phase: '36B',
      name: 'DeepFilterNet artifact download/load',
      status: download.status === 'verified' ? 'verified' : 'blocked',
      reportUri: download.gcsDownloadReportPath,
      summary: 'Phase 36B stored only the approved DeepFilterNet v0.5.6 CLI and ONNX archive in private GCS.',
      blockers: download.blockers,
    },
    {
      phase: '36C',
      name: 'DeepFilterNet generated-audio runtime verification',
      status: runtime.status === 'verified' ? 'verified' : 'blocked',
      runId: runtime.runId,
      reportUri: runtime.qaReportUri,
      summary: 'Phase 36C verified DeepFilterNet v0.5.6 on generated synthetic audio only.',
      blockers: runtime.blockers,
    },
    {
      phase: '36D',
      name: 'Controlled real-video DeepFilterNet audio cleanup sample',
      status: realVideo.status === 'completed' ? 'complete' : 'blocked',
      runId: realVideo.runId,
      reportUri: realVideo.qaReportUri,
      summary: 'Phase 36D completed one controlled real-video audio cleanup sample on the approved Phase 32 chain.',
      blockers: realVideo.blockers,
    },
    {
      phase: '36E',
      name: 'Private DeepFilterNet audio feature E2E',
      status: feature.status === 'completed' ? 'complete' : 'blocked',
      runId: feature.runId,
      reportUri: feature.qaReportUri,
      summary: 'Phase 36E completed the private DeepFilterNet audio feature E2E gate for internal testing only.',
      blockers: feature.blockers,
    },
  ]
}

export function audioSystemEvidenceChainBlockers(chain = buildAudioSystemEvidenceChain()): string[] {
  return chain.flatMap((entry) => entry.blockers.map((blocker) => `Phase ${entry.phase}: ${blocker}`))
}
