import type {
  ProColorImageFeatureE2EConfig,
  ProColorImageFeatureE2EEnvValidationInput,
  ProColorImageFeatureE2EValidationResult,
} from './pro-color-image-feature-e2e-types'

export const proColorImageFeatureE2EConfig: ProColorImageFeatureE2EConfig = {
  phase: '40D',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'pro_color_image_feature_e2e',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceRunId: 'phase32-20260528T13330',
  phase40CRunId: 'phase40c-20260531T11504',
  phase40CReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/phase40c-20260531T11504/reports/phase40c-report.json',
  approvedPhase40CImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe',
  approvedPhase40CImageDigest: 'sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe',
  approvedPhase40CExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-xzz4f',
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  runtimeImageTag: 'staging-pro-color-image-feature-e2e-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-feature-e2e-001',
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
  reportObjectPrefix: 'activation-pro-color-image/phase40d',
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

export const proColorImageFeatureE2EDoesNotDo = [
  'no arbitrary real user media',
  'no new video source',
  'no full-video processing',
  'no full 4K frame processing',
  'no final delivery export',
  'no provider calls',
  'no Revideo',
  'no Track B audio/OCR/VLM/data/hybrid tools',
  'no public URLs or public buckets',
  'no production or external beta unlock',
]

export function validateProColorImageFeatureE2EExecutionEnv(input: ProColorImageFeatureE2EEnvValidationInput = {}): ProColorImageFeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE
  const inputVideoGcsUri = input.inputVideoGcsUri ?? process.env.REEDITPRO_PHASE40D_INPUT_VIDEO_GCS_URI

  if (projectId !== proColorImageFeatureE2EConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== proColorImageFeatureE2EConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== proColorImageFeatureE2EConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== proColorImageFeatureE2EConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E=true is required for execution.')
  if (runtimeMode !== proColorImageFeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be exactly pro_color_image_feature_e2e.')
  if (inputVideoGcsUri !== proColorImageFeatureE2EConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (input.frameCount !== undefined && input.frameCount > proColorImageFeatureE2EConfig.maxFrameCount) blockers.push('Frame count must be <= 5.')
  if (input.frameWidth !== undefined && input.frameWidth > proColorImageFeatureE2EConfig.maxFrameWidth) blockers.push('Frame width must be <= 768.')
  if (input.frameHeight !== undefined && input.frameHeight > proColorImageFeatureE2EConfig.maxFrameHeight) blockers.push('Frame height must be <= 432.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.fullVideoProcessingEnabled ?? process.env.FULL_VIDEO_PROCESSING_ENABLED ?? 'false') !== 'false') blockers.push('Full-video processing must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 40D orchestration.')

  warnings.push('Phase 40D executes one bounded private feature E2E sample only.')
  warnings.push('Passing Phase 40D does not approve full-video processing, final delivery, production, beta, broad media, providers, or Revideo.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateProColorImageFeatureE2EStaticPlan(input: Partial<ProColorImageFeatureE2EEnvValidationInput> = {}): ProColorImageFeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== proColorImageFeatureE2EConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== proColorImageFeatureE2EConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== proColorImageFeatureE2EConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== proColorImageFeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be pro_color_image_feature_e2e.')
  if (input.inputVideoGcsUri && input.inputVideoGcsUri !== proColorImageFeatureE2EConfig.approvedInputVideoGcsUri) blockers.push('Input video must be the approved Phase 32 private export.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, process media, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function proColorImageFeatureE2EArtifactPrefix(runId: string): string {
  if (!/^phase40d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 40D run id: ${runId}`)
  return `${proColorImageFeatureE2EConfig.reportObjectPrefix}/${runId}`
}

export function makeProColorImageFeatureE2ERunId(): string {
  return `phase40d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}
