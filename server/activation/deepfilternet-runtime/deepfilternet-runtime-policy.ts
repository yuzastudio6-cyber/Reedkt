import type {
  DeepFilterNetRuntimeConfig,
  DeepFilterNetRuntimeEnvValidationInput,
  DeepFilterNetRuntimeValidationResult,
} from './deepfilternet-runtime-types'

export const deepFilterNetRuntimeConfig: DeepFilterNetRuntimeConfig = {
  phase: '36C',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_audio',
  toolId: 'deepfilternet',
  toolVersion: 'v0.5.6',
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/',
  cliFileName: 'deep-filter-0.5.6-x86_64-unknown-linux-musl',
  modelArchiveFileName: 'DeepFilterNet3_onnx.tar.gz',
  cliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da',
  modelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616',
  aggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b',
  runtimeJobName: 'reeditpro-staging-deepfilternet-runtime-job',
  runtimeImageTag: 'staging-deepfilternet-runtime-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-runtime-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  artifactRuntimePath: '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6',
  reportObjectPrefix: 'activation-audio-ai/phase36c',
  cpu: 4,
  memory: '8Gi',
  fixtureSampleRate: 48000,
  fixtureChannels: 1,
  fixtureDurationSeconds: 10,
}

export const deepFilterNetRuntimeDoesNotDo = [
  'no real video input',
  'no real audio input',
  'no real user media',
  'no Phase 28/31/32 controlled real-video-chain input',
  'no RNNoise',
  'no Demucs',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no external model/tool artifact downloads at runtime',
  'no alternate DeepFilterNet versions or models',
  'no public URLs or public buckets',
  'no GPU configuration',
  'no production or external beta unlock',
]

export function validateDeepFilterNetRuntimeExecutionEnv(
  input: DeepFilterNetRuntimeEnvValidationInput = {},
): DeepFilterNetRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_DEEPFILTERNET_RUNTIME_MODE

  if (projectId !== deepFilterNetRuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== deepFilterNetRuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== deepFilterNetRuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== deepFilterNetRuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true is required for execution.')
  if (runtimeMode !== deepFilterNetRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be exactly generated_audio.')
  if ((input.artifactGcsPath ?? process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH) !== deepFilterNetRuntimeConfig.artifactGcsPath) blockers.push('Only the approved private DeepFilterNet v0.5.6 artifact GCS path may be used.')
  if ((input.cliSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_CLI_SHA256) !== deepFilterNetRuntimeConfig.cliSha256) blockers.push('DeepFilterNet CLI checksum must match Phase 36B evidence.')
  if ((input.modelArchiveSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256) !== deepFilterNetRuntimeConfig.modelArchiveSha256) blockers.push('DeepFilterNet model archive checksum must match Phase 36B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256) !== deepFilterNetRuntimeConfig.aggregateSha256) blockers.push('DeepFilterNet aggregate checksum must match Phase 36B evidence.')
  if ((input.generatedAudioOnly ?? process.env.GENERATED_AUDIO_ONLY ?? 'true') !== 'true') blockers.push('Generated-audio-only guard must be true.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.rnnoiseEnabled ?? process.env.RNNOISE_ENABLED ?? 'false') !== 'false') blockers.push('RNNoise must remain disabled.')
  if ((input.demucsEnabled ?? process.env.DEMUCS_ENABLED ?? 'false') !== 'false') blockers.push('Demucs must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 36C execution orchestration.')

  warnings.push('Phase 36C verifies DeepFilterNet runtime on generated synthetic audio only.')
  warnings.push('Passing Phase 36C does not approve real-video audio AI cleanup, RNNoise, Demucs, production, beta, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateDeepFilterNetRuntimeStaticPlan(
  input: Partial<DeepFilterNetRuntimeEnvValidationInput> = {},
): DeepFilterNetRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== deepFilterNetRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== deepFilterNetRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== deepFilterNetRuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== deepFilterNetRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be generated_audio.')
  if (input.artifactGcsPath && input.artifactGcsPath !== deepFilterNetRuntimeConfig.artifactGcsPath) blockers.push('Artifact path must be the approved private DeepFilterNet v0.5.6 GCS path.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute DeepFilterNet, mutate GCP, or process audio.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function deepFilterNetRuntimeArtifactPrefix(runId: string): string {
  if (!/^phase36c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 36C run id: ${runId}`)
  return `${deepFilterNetRuntimeConfig.reportObjectPrefix}/${runId}`
}
