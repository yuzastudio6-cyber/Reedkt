import type { LibassBurninValidationConfig } from './libass-burnin-validation-types'

export const libassBurninValidationConfig: LibassBurninValidationConfig = {
  phase: '45A',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'libass_caption_burnin_validation',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedCaptionAssGcsUri: 'gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass',
  approvedCaptionSha256: 'a103dd9a1252c48de27d1b4daf4e87180786bbdb781426fcc2888718cf8bc6de',
  sourceRunId: 'phase32-20260528T13330',
  captionRunId: 'phase28-20260528T01552',
  phase40DRunId: 'phase40d-20260531T12493',
  phase40DReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40d/phase40d-20260531T12493/reports/phase40d-report.json',
  runtimeJobName: 'reeditpro-staging-libass-burnin-validation-job',
  runtimeImageTag: 'staging-libass-burnin-validation-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '4Gi',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-render-hardening/phase45a',
  previewStartSeconds: 0,
  previewDurationSeconds: 5,
  maxPreviewDurationSeconds: 6,
  previewWidth: 432,
  previewHeight: 768,
}

export const libassBurninDoesNotDo = [
  'no arbitrary media',
  'no new transcript or caption generation',
  'no full final delivery',
  'no providers',
  'no Revideo',
  'no Track B tools',
  'no production or external beta unlock',
  'no public URLs or public bucket access',
]

export function makeLibassBurninRunId(): string {
  return `phase45a-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function libassBurninArtifactPrefix(runId: string): string {
  if (!/^phase45a-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45A run id: ${runId}`)
  return `${libassBurninValidationConfig.reportObjectPrefix}/${runId}`
}

export function validateLibassBurninExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  sourceVideo?: string
  captionSource?: string
  previewDurationSeconds?: number
  providerExecutionEnabled?: string
  revideoEnabled?: string
  trackBEnabled?: string
  publicAccessEnabled?: string
  finalDeliveryEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_LIBASS_RUNTIME_MODE
  const sourceVideo = input.sourceVideo ?? process.env.REEDITPRO_PHASE45A_INPUT_VIDEO_GCS_URI
  const captionSource = input.captionSource ?? process.env.REEDITPRO_PHASE45A_CAPTION_ASS_GCS_URI

  if (projectId !== libassBurninValidationConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== libassBurninValidationConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== libassBurninValidationConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== libassBurninValidationConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true is required for execution.')
  if (runtimeMode !== libassBurninValidationConfig.runtimeMode) blockers.push('Runtime mode must be exactly libass_caption_burnin_validation.')
  if (sourceVideo !== libassBurninValidationConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (captionSource !== libassBurninValidationConfig.approvedCaptionAssGcsUri) blockers.push('Only the approved Phase 28 ASS sidecar is allowed.')
  if (input.previewDurationSeconds !== undefined && input.previewDurationSeconds > libassBurninValidationConfig.maxPreviewDurationSeconds) blockers.push('Preview duration must remain bounded.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45A creates a bounded private caption burn-in preview only.')
  warnings.push('Passing Phase 45A does not approve final delivery, production, external beta, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
