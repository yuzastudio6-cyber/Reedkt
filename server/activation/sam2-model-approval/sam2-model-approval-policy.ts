import type { Sam2CommandPlan } from './sam2-model-approval-types'

export const sam2ModelApprovalPolicy = {
  phase: '35A',
  approvalDecision: 'pending_human_review',
  sam2PlanningRecommendationAllowed: true,
  sam2DownloadAllowed: false,
  sam2RuntimeAllowed: false,
  sam2TemporalTrackingAllowed: false,
  sam2FullVideoMaskAllowed: false,
  fullVideoTextBehindSubjectAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
} as const

export const sam2ModelApprovalCommandPlans: Sam2CommandPlan[] = [
  blockedFutureCommand('future-sam2-checkpoint-download', '35B', 'Future download of the exact human-approved SAM2 checkpoint into temp storage outside the repo.'),
  blockedFutureCommand('future-sam2-checksum-verification', '35B', 'Future checksum calculation and manifest recording for the approved SAM2 checkpoint.'),
  blockedFutureCommand('future-sam2-private-gcs-upload', '35B', 'Future upload of approved SAM2 weights to private staging model storage only.'),
  blockedFutureCommand('future-sam2-runtime-image-build', '35C', 'Future dedicated SAM2 runtime image build after checkpoint approval.'),
  blockedFutureCommand('future-sam2-cloud-run-l4-job', '35C', 'Future dedicated Cloud Run L4 job deployment and generated-fixture runtime verification.'),
  blockedFutureCommand('future-sam2-controlled-short-video-test', '35D', 'Future <= 2 second controlled real-video temporal mask tracking test.'),
  blockedFutureCommand('future-sam2-text-behind-subject-preview', '35E', 'Future private text-behind-subject preview only if temporal mask QA passes.'),
]

function blockedFutureCommand(commandId: string, futurePhase: Sam2CommandPlan['futurePhase'], description: string): Sam2CommandPlan {
  return {
    commandId,
    futurePhase,
    description,
    commandText: 'TEXT_ONLY future approval packet; no executable shell command is approved in Phase 35A.',
    executableCommand: null,
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase35A: false,
    blockedReason: 'Phase 35A is a non-mutating approval workflow and cannot download models, build images, run Cloud Run jobs, process media, or mutate cloud/storage resources.',
  }
}
