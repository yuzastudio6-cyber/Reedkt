import type { ProColorImageRuntimeConfig, ProColorImageRuntimeEnvValidationInput, ProColorImageRuntimeValidationResult } from './pro-color-image-runtime-types'

export const proColorImageRuntimeConfig: ProColorImageRuntimeConfig = {
  phase: '40B',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_fixture_color_image',
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job',
  runtimeImageTag: 'staging-pro-color-image-runtime-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-runtime-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  reportObjectPrefix: 'activation-pro-color-image/phase40b',
  fixtureWidth: 256,
  fixtureHeight: 256,
  fixtureFrameCount: 3,
}

export const proColorImageRuntimeDoesNotDo = [
  'no real video input',
  'no real user media',
  'no arbitrary media',
  'no final delivery export',
  'no provider calls',
  'no Revideo',
  'no public URLs or public buckets',
  'no Track B audio/OCR/VLM/hybrid tools',
  'no production or external beta unlock',
]

export function validateProColorImageRuntimeExecutionEnv(input: ProColorImageRuntimeEnvValidationInput = {}): ProColorImageRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE

  if (projectId !== proColorImageRuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== proColorImageRuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== proColorImageRuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== proColorImageRuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true is required for execution.')
  if (runtimeMode !== proColorImageRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be exactly generated_fixture_color_image.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 40B orchestration.')

  warnings.push('Phase 40B verifies OpenColorIO, OpenImageIO, and Kornia on generated fixtures only.')
  warnings.push('Passing Phase 40B does not approve controlled real-video processing, final delivery, production, or beta.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateProColorImageRuntimeStaticPlan(input: Partial<ProColorImageRuntimeEnvValidationInput> = {}): ProColorImageRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== proColorImageRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== proColorImageRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== proColorImageRuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== proColorImageRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be generated_fixture_color_image.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, process media, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function proColorImageRuntimeArtifactPrefix(runId: string): string {
  if (!/^phase40b-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 40B run id: ${runId}`)
  return `${proColorImageRuntimeConfig.reportObjectPrefix}/${runId}`
}

export function makeProColorImageRunId(): string {
  return `phase40b-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}
