import type { ProColorImageCommandPlan, ProColorImagePlanningDecision } from './pro-color-image-approval-types'

export const proColorImageApprovalPolicy = {
  phase: '40A',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  preferredBaseBranch: 'origin/codex/rp-activation-38e-film-private-feature-e2e-readiness',
  actualBaseBranch: 'origin/codex/rp-activation-38d-real-video-film-slowmotion-sample',
  preferredBaseUnavailable: true,
  openColorIORepoUrl: 'https://github.com/AcademySoftwareFoundation/OpenColorIO',
  openColorIOReadmeUrl: 'https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenColorIO/main/README.md',
  openColorIOLicenseUrl: 'https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenColorIO/main/LICENSE',
  openImageIORepoUrl: 'https://github.com/AcademySoftwareFoundation/OpenImageIO',
  openImageIOReadmeUrl: 'https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenImageIO/master/README.md',
  openImageIOLicenseUrl: 'https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenImageIO/master/LICENSE.md',
  korniaRepoUrl: 'https://github.com/kornia/kornia',
  korniaReadmeUrl: 'https://raw.githubusercontent.com/kornia/kornia/master/README.md',
  korniaLicenseUrl: 'https://raw.githubusercontent.com/kornia/kornia/master/LICENSE',
  futurePrivateArtifactPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/pro-color-image/',
  proColorImagePlanningAllowed: true,
  openColorIOPlanningAllowed: true,
  openImageIOPlanningAllowed: true,
  korniaPlanningAllowed: true,
  planningDecision: 'staging_planning_approved' as ProColorImagePlanningDecision,
  runtimeInstallAllowed: false,
  proColorImageRuntimeAllowed: false,
  generatedFixtureRuntimeAllowed: false,
  realVideoProColorAllowed: false,
  finalDeliveryAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealUserMediaAllowed: false,
} as const

export const proColorImageCommandPlans: ProColorImageCommandPlan[] = [
  blockedFutureCommand('future-pro-color-runtime-dependency-lock', '40B', 'Future dependency/version lock for OpenColorIO, OpenImageIO, Kornia, and FFmpeg/FFprobe generated-fixture runtime verification.', true),
  blockedFutureCommand('future-pro-color-generated-fixture-runtime', '40B', 'Future generated fixture runtime verification for color transforms, image I/O metadata, and visual QA helpers.', true),
  blockedFutureCommand('future-pro-color-private-artifact-manifest', '40B', 'Future private generated fixture artifact and QA manifest creation after runtime verification is explicitly approved.', true),
  blockedFutureCommand('future-pro-color-controlled-real-video-sample', '40C', 'Future controlled real-video pro color/image sample on the approved Track A chain only.', true),
  blockedFutureCommand('future-pro-color-private-feature-e2e-gate', '40D', 'Future private feature E2E readiness gate after generated and controlled sample QA pass.', true),
]

function blockedFutureCommand(
  commandId: string,
  futurePhase: ProColorImageCommandPlan['futurePhase'],
  description: string,
  requiresApproval: boolean,
): ProColorImageCommandPlan {
  return {
    commandId,
    futurePhase,
    description,
    commandText: 'TEXT_ONLY future approval packet; no executable shell command is approved in Phase 40A.',
    executableCommand: null,
    requiresApproval,
    textOnlyByDefault: true,
    allowedInPhase40A: false,
    blockedReason: 'Phase 40A is a non-mutating Track A approval workflow and cannot install runtimes, process media, build images, mutate cloud/storage resources, call external model services, create public outputs, or enable launch gates.',
  }
}
