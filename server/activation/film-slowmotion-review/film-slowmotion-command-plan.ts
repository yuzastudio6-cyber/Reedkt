import type { FilmSlowMotionFutureCommandPlan } from './film-slowmotion-review-types'

export const FILM_SLOWMOTION_FUTURE_COMMAND_PLANS: FilmSlowMotionFutureCommandPlan[] = [
  {
    planId: 'film-future-model-approval',
    category: 'future_model_approval',
    description: 'Future human approval would select the exact FILM source, checkpoint, license record, provenance record, and bounded test need.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'Phase 34E records review evidence only and does not approve FILM.',
  },
  {
    planId: 'film-future-model-download',
    category: 'future_model_download',
    description: 'Future download planning would be authored only after model approval and would target private reviewed storage.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'No FILM checkpoint, license, checksum, or storage path is approved in Phase 34E.',
  },
  {
    planId: 'film-future-checksum-verification',
    category: 'future_checksum_verification',
    description: 'Future checksum verification would compare the approved checkpoint against the approved checksum before runtime use.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'No approved checkpoint checksum exists in Phase 34E.',
  },
  {
    planId: 'film-future-runtime-image-build',
    category: 'future_runtime_image_build',
    description: 'Future runtime image planning would require a no-external-download image policy and pinned private model input.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'Phase 34E must not build or push runtime images.',
  },
  {
    planId: 'film-future-cloud-run-l4-job-deployment',
    category: 'future_cloud_run_l4_job_deployment',
    description: 'Future L4 job planning would require quota, timeout, budget, service-account, and private artifact policy approval.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'Phase 34E must not deploy, execute, or mutate Cloud Run or GCP resources.',
  },
  {
    planId: 'film-future-one-short-clip-test',
    category: 'future_one_short_clip_test',
    description: 'Future testing would be limited to one explicitly approved short clip or segment of two seconds or less.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'Phase 34E must not process media or execute slow motion.',
  },
  {
    planId: 'film-future-qa-review',
    category: 'future_qa_review',
    description: 'Future QA review would inspect motion artifacts, sync drift, flicker, subject deformation, and disclosure risk.',
    requiresHumanApproval: true,
    textOnlyByDefault: true,
    allowedInPhase34E: false,
    executableCommand: null,
    blockedReason: 'Phase 34E defines QA criteria only; it does not claim runtime proof.',
  },
]

export function listFilmSlowMotionFutureCommandPlans(): FilmSlowMotionFutureCommandPlan[] {
  return FILM_SLOWMOTION_FUTURE_COMMAND_PLANS.map((plan) => ({ ...plan }))
}
