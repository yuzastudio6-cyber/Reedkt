import type { AudioAiCommandPlan } from './audio-ai-approval-types'

export const audioAiApprovalPolicy = {
  phase: '36A',
  approvalDecision: 'blocked_missing_artifact_evidence',
  audioAiPlanningRecommendation: 'deepfilternet_first',
  deepFilterNetPlanningAllowed: true,
  rnnoiseFallbackPlanningAllowed: true,
  demucsRestrictedPlanningAllowed: true,
  audioAiDownloadAllowed: false,
  audioAiRuntimeAllowed: false,
  realVideoAudioAiCleanupAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
} as const

export const audioAiApprovalCommandPlans: AudioAiCommandPlan[] = [
  blockedFutureCommand('future-deepfilternet-artifact-source-review', '36B', 'Future selection of one official DeepFilterNet model/tool artifact source for private staging download planning.'),
  blockedFutureCommand('future-audio-ai-checksum-manifest', '36B', 'Future checksum calculation and manifest creation for the first approved audio AI artifact.'),
  blockedFutureCommand('future-audio-ai-private-gcs-upload', '36B', 'Future upload of only the approved audio AI artifact into private staging model storage.'),
  blockedFutureCommand('future-audio-ai-generated-runtime', '36C', 'Future generated-audio runtime verification for the first approved audio AI tool.'),
  blockedFutureCommand('future-controlled-real-video-audio-ai-sample', '36D', 'Future controlled real-video audio AI cleanup sample using the approved controlled chain only.'),
  blockedFutureCommand('future-private-audio-ai-feature-e2e', '36E', 'Future private audio AI feature E2E gate after generated and controlled real-video QA pass.'),
]

function blockedFutureCommand(commandId: string, futurePhase: AudioAiCommandPlan['futurePhase'], description: string): AudioAiCommandPlan {
  return {
    commandId,
    futurePhase,
    description,
    commandText: 'TEXT_ONLY future approval packet; no executable shell command is approved in Phase 36A.',
    executableCommand: null,
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase36A: false,
    blockedReason: 'Phase 36A is a non-mutating approval workflow and cannot download models, build images, run GCP jobs, process audio/media, call providers, or mutate storage/cloud resources.',
  }
}
