import type { FilmCommandPlan, FilmStagingPlanningDecision } from './film-slowmotion-approval-types'

export const filmSlowmotionApprovalPolicy = {
  phase: '38A',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  officialRepoUrl: 'https://github.com/google-research/frame-interpolation',
  officialProjectPageUrl: 'https://film-net.github.io/',
  officialLicenseUrl: 'https://raw.githubusercontent.com/google-research/frame-interpolation/main/LICENSE',
  officialReadmeUrl: 'https://raw.githubusercontent.com/google-research/frame-interpolation/main/README.md',
  officialCheckpointSourceUrl: 'https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy?usp=sharing',
  recommendedCheckpointCandidate: 'film_net/Style/saved_model',
  futurePrivateGcsPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/style/',
  filmPlanningAllowed: true,
  filmStagingPlanningDecision: 'staging_planning_approved' as FilmStagingPlanningDecision,
  filmDownloadAllowed: false,
  filmRuntimeAllowed: false,
  slowMotionAllowed: false,
  realVideoSlowMotionAllowed: false,
  fullVideoInterpolationAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealUserMediaAllowed: false,
} as const

export const filmSlowmotionCommandPlans: FilmCommandPlan[] = [
  blockedFutureCommand('future-film-model-download', '38B', 'Future download of the approved official FILM TF2 SavedModel artifacts into temp storage outside the repo.', false),
  blockedFutureCommand('future-film-checksum-verification', '38B', 'Future checksum calculation and manifest recording for the approved FILM artifact tree.', false),
  blockedFutureCommand('future-film-private-gcs-upload', '38B', 'Future upload of approved FILM artifacts to private staging model storage only.', false),
  blockedFutureCommand('future-film-runtime-image-build', '38C', 'Future dedicated FILM runtime image build after private artifact storage exists.', true),
  blockedFutureCommand('future-film-generated-frame-runtime-test', '38C', 'Future generated-frame-pair runtime verification with private QA artifacts only.', true),
  blockedFutureCommand('future-film-controlled-selected-real-video-sample', '38D', 'Future controlled selected real-video slow-motion sample on an approved short segment only.', true),
  blockedFutureCommand('future-film-private-feature-e2e-gate', '38E', 'Future private FILM slow-motion feature E2E readiness gate after generated and controlled QA pass.', true),
]

function blockedFutureCommand(
  commandId: string,
  futurePhase: FilmCommandPlan['futurePhase'],
  description: string,
  requiresApproval: boolean,
): FilmCommandPlan {
  return {
    commandId,
    futurePhase,
    description,
    commandText: 'TEXT_ONLY future approval packet; no executable shell command is approved in Phase 38A.',
    executableCommand: null,
    requiresApproval,
    textOnlyByDefault: true,
    allowedInPhase38A: false,
    blockedReason: 'Phase 38A is a non-mutating Track A approval workflow and cannot download FILM weights, build images, run Cloud Run jobs, process media, call providers, use Revideo, or mutate cloud/storage resources.',
  }
}
