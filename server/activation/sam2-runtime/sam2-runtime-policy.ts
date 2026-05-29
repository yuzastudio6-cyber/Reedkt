import type { Sam2RuntimeConfig, Sam2RuntimeEnvValidationInput, Sam2RuntimeValidationResult } from './sam2-runtime-types'

export const sam2RuntimeConfig: Sam2RuntimeConfig = {
  phase: '35C',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_synthetic_sequence',
  modelFamily: 'SAM2 / Segment Anything Model 2',
  modelId: 'sam2.1_hiera_tiny',
  checkpointFileName: 'sam2.1_hiera_tiny.pt',
  configFileName: 'sam2.1_hiera_t.yaml',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job',
  runtimeImageTag: 'staging-sam2-runtime-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime:staging-sam2-runtime-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime',
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  reportObjectPrefix: 'activation-sam2-runtime/phase35c',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
  fixtureFrameCount: 5,
  fixtureWidth: 512,
  fixtureHeight: 512,
}

export const sam2RuntimeDoesNotDo = [
  'no real video input',
  'no real user media',
  'no Phase 28-35 real-video-chain input',
  'no full-video mask tracking',
  'no full-video text-behind-subject',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no external model-weight downloads at runtime',
  'no additional SAM2 checkpoints',
  'no public URLs or public buckets',
  'no RTX PRO 6000',
  'no production or external beta unlock',
]

export function validateSam2RuntimeExecutionEnv(input: Sam2RuntimeEnvValidationInput = {}): Sam2RuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SAM2_RUNTIME
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_SAM2_RUNTIME_MODE

  if (projectId !== sam2RuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== sam2RuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== sam2RuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== sam2RuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SAM2_RUNTIME=true is required for execution.')
  if (runtimeMode !== sam2RuntimeConfig.runtimeMode) blockers.push('Runtime mode must be exactly generated_synthetic_sequence.')
  if ((input.modelGcsPath ?? process.env.REEDITPRO_SAM2_MODEL_GCS_PATH) !== sam2RuntimeConfig.modelGcsPath) blockers.push('Only the approved private SAM2.1 tiny model GCS path may be used.')
  if ((input.checkpointSha256 ?? process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256) !== sam2RuntimeConfig.checkpointSha256) blockers.push('Checkpoint checksum must match Phase 35B evidence.')
  if ((input.configSha256 ?? process.env.REEDITPRO_SAM2_CONFIG_SHA256) !== sam2RuntimeConfig.configSha256) blockers.push('Config checksum must match Phase 35B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_SAM2_AGGREGATE_SHA256) !== sam2RuntimeConfig.aggregateSha256) blockers.push('Aggregate checksum must match Phase 35B evidence.')
  if ((input.gpuType ?? sam2RuntimeConfig.gpuType) !== sam2RuntimeConfig.gpuType) blockers.push('Only nvidia-l4 is allowed for Phase 35C.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 35C execution orchestration.')

  warnings.push('Phase 35C verifies SAM2 runtime on generated synthetic frames only.')
  warnings.push('Passing Phase 35C does not approve real-video temporal tracking, full-video masks, or text-behind-subject video.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSam2RuntimeStaticPlan(input: Partial<Sam2RuntimeEnvValidationInput> = {}): Sam2RuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== sam2RuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== sam2RuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== sam2RuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== sam2RuntimeConfig.runtimeMode) blockers.push('Runtime mode must be generated_synthetic_sequence.')
  if (input.modelGcsPath && input.modelGcsPath !== sam2RuntimeConfig.modelGcsPath) blockers.push('Model path must be the approved private SAM2.1 tiny GCS path.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute SAM2, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function sam2RuntimeArtifactPrefix(runId: string): string {
  if (!/^phase35c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35C run id: ${runId}`)
  return `${sam2RuntimeConfig.reportObjectPrefix}/${runId}`
}
