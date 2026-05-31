import type {
  RealVideoProColorImageConfig,
  RealVideoProColorImageEnvValidationInput,
  RealVideoProColorImageValidationResult,
} from './real-video-pro-color-image-types'

export const realVideoProColorImageConfig: RealVideoProColorImageConfig = {
  phase: '40C',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'real_video_sample',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceRunId: 'phase32-20260528T13330',
  phase40BRunId: 'phase40b-20260531T10390',
  phase40BReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json',
  approvedPhase40BImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf',
  approvedPhase40BImageDigest: 'sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf',
  approvedPhase40BExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-s25z7',
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  runtimeImageTag: 'staging-pro-color-image-real-video-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-real-video-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  reportObjectPrefix: 'activation-pro-color-image/phase40c',
  timestampsSeconds: [0.5, 7.7335, 14.5],
  preferredFrameCount: 3,
  maxFrameCount: 5,
  maxFrameWidth: 768,
  maxFrameHeight: 432,
  expectedDurationSeconds: 15.467,
  openColorIOVersion: '2.4.2',
  openImageIOVersion: '3.0.18.1',
  torchVersion: '2.7.1+cpu',
  korniaVersion: '0.8.1',
}

export const realVideoProColorImageDoesNotDo = [
  'no arbitrary real user media',
  'no new video source',
  'no full-video processing',
  'no full 4K frame processing',
  'no final delivery export',
  'no provider calls',
  'no Revideo',
  'no Track B audio/OCR/VLM/hybrid tools',
  'no public URLs or public buckets',
  'no production or external beta unlock',
]

export function validateRealVideoProColorImageExecutionEnv(input: RealVideoProColorImageEnvValidationInput = {}): RealVideoProColorImageValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE
  const inputVideoGcsUri = input.inputVideoGcsUri ?? process.env.REEDITPRO_PHASE40C_INPUT_VIDEO_GCS_URI

  if (projectId !== realVideoProColorImageConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== realVideoProColorImageConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== realVideoProColorImageConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== realVideoProColorImageConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE=true is required for execution.')
  if (runtimeMode !== realVideoProColorImageConfig.runtimeMode) blockers.push('Runtime mode must be exactly real_video_sample.')
  if (inputVideoGcsUri !== realVideoProColorImageConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (input.frameCount !== undefined && input.frameCount > realVideoProColorImageConfig.maxFrameCount) blockers.push('Frame count must be <= 5.')
  if (input.frameWidth !== undefined && input.frameWidth > realVideoProColorImageConfig.maxFrameWidth) blockers.push('Frame width must be <= 768.')
  if (input.frameHeight !== undefined && input.frameHeight > realVideoProColorImageConfig.maxFrameHeight) blockers.push('Frame height must be <= 432.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.fullVideoProcessingEnabled ?? process.env.FULL_VIDEO_PROCESSING_ENABLED ?? 'false') !== 'false') blockers.push('Full-video processing must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 40C orchestration.')

  warnings.push('Phase 40C executes one bounded real-video-derived frame sample only.')
  warnings.push('Passing Phase 40C does not approve full-video processing, final delivery, production, beta, broad media, providers, or Revideo.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateRealVideoProColorImageStaticPlan(input: Partial<RealVideoProColorImageEnvValidationInput> = {}): RealVideoProColorImageValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== realVideoProColorImageConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== realVideoProColorImageConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== realVideoProColorImageConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== realVideoProColorImageConfig.runtimeMode) blockers.push('Runtime mode must be real_video_sample.')
  if (input.inputVideoGcsUri && input.inputVideoGcsUri !== realVideoProColorImageConfig.approvedInputVideoGcsUri) blockers.push('Input video must be the approved Phase 32 private export.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, process media, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function realVideoProColorImageArtifactPrefix(runId: string): string {
  if (!/^phase40c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 40C run id: ${runId}`)
  return `${realVideoProColorImageConfig.reportObjectPrefix}/${runId}`
}

export function makeRealVideoProColorImageRunId(): string {
  return `phase40c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

