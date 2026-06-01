import type {
  DeepFilterNetFeatureE2EConfig,
  DeepFilterNetFeatureE2EValidationInput,
  DeepFilterNetFeatureE2EValidationResult,
} from './deepfilternet-feature-e2e-types'

export const deepFilterNetFeatureE2EConfig: DeepFilterNetFeatureE2EConfig = {
  phase: '36E',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'audio_feature_e2e',
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
  expectedInputDurationSeconds: 15.467,
  maxInputDurationSeconds: 20,
  toolId: 'deepfilternet',
  toolVersion: 'v0.5.6',
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/',
  cliFileName: 'deep-filter-0.5.6-x86_64-unknown-linux-musl',
  modelArchiveFileName: 'DeepFilterNet3_onnx.tar.gz',
  cliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da',
  modelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616',
  aggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b',
  phase36CRunId: 'phase36c-20260530T133009',
  phase36CExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-pxjbq',
  phase36CImageDigest: 'sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce',
  phase36DRunId: 'phase36d-20260530T141724',
  phase36DExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-gqbkz',
  phase36DImageDigest: 'sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4',
  phase36DReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36d/phase36d-20260530T141724/reports/phase36d-report.json',
  runtimeJobName: 'reeditpro-staging-deepfilternet-runtime-job',
  runtimeImageTag: 'staging-deepfilternet-audio-feature-e2e-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-audio-feature-e2e-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  artifactRuntimePath: '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6',
  reportObjectPrefix: 'activation-audio-ai/phase36e',
  cpu: 4,
  memory: '8Gi',
}

export const deepFilterNetFeatureE2EDoesNotDo = [
  'no arbitrary real user media',
  'no new source video',
  'no provider calls',
  'no RNNoise',
  'no Demucs',
  'no Revideo',
  'no FILM or slow motion',
  'no external model/tool artifact downloads at runtime',
  'no alternate DeepFilterNet versions or models',
  'no public URLs or public buckets',
  'no final delivery export',
  'no production or external beta unlock',
]

export function deepFilterNetFeatureE2EPrefix(runId: string): string {
  if (!/^phase36e-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 36E run id: ${runId}`)
  return `${deepFilterNetFeatureE2EConfig.reportObjectPrefix}/${runId}`
}

export function validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv(
  input: DeepFilterNetFeatureE2EValidationInput = {},
): DeepFilterNetFeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_DEEPFILTERNET_RUNTIME_MODE

  if (projectId !== deepFilterNetFeatureE2EConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== deepFilterNetFeatureE2EConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== deepFilterNetFeatureE2EConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== deepFilterNetFeatureE2EConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true is required for execution.')
  if (runtimeMode !== deepFilterNetFeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be exactly audio_feature_e2e.')
  if ((input.inputVideo ?? process.env.REEDITPRO_PHASE36E_INPUT_VIDEO_GCS_URI) !== deepFilterNetFeatureE2EConfig.approvedInputVideo) blockers.push('Only the approved Phase 32 controlled export may be used.')
  if ((input.referencePhase31Audio ?? process.env.REEDITPRO_PHASE36E_REFERENCE_AUDIO_GCS_URI) !== deepFilterNetFeatureE2EConfig.referencePhase31Audio) blockers.push('Only the approved Phase 31 normalized-audio reference may be used.')
  if ((input.artifactGcsPath ?? process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH) !== deepFilterNetFeatureE2EConfig.artifactGcsPath) blockers.push('Only the approved private DeepFilterNet v0.5.6 artifact GCS path may be used.')
  if ((input.cliSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_CLI_SHA256) !== deepFilterNetFeatureE2EConfig.cliSha256) blockers.push('DeepFilterNet CLI checksum must match Phase 36B evidence.')
  if ((input.modelArchiveSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256) !== deepFilterNetFeatureE2EConfig.modelArchiveSha256) blockers.push('DeepFilterNet model archive checksum must match Phase 36B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256) !== deepFilterNetFeatureE2EConfig.aggregateSha256) blockers.push('DeepFilterNet aggregate checksum must match Phase 36B evidence.')
  if (input.inputDurationSeconds !== undefined && input.inputDurationSeconds > deepFilterNetFeatureE2EConfig.maxInputDurationSeconds) blockers.push('Input duration exceeds the Phase 36E maximum controlled-sample duration.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.rnnoiseEnabled ?? process.env.RNNOISE_ENABLED ?? 'false') !== 'false') blockers.push('RNNoise must remain disabled.')
  if ((input.demucsEnabled ?? process.env.DEMUCS_ENABLED ?? 'false') !== 'false') blockers.push('Demucs must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 36E execution orchestration.')

  warnings.push('Phase 36E is limited to one controlled DeepFilterNet feature E2E audio cleanup sample.')
  warnings.push('Passing Phase 36E does not approve arbitrary media, RNNoise, Demucs, providers, production, external beta, broad media, or final delivery.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateDeepFilterNetFeatureE2EAudioCleanupStaticPlan(
  input: Partial<DeepFilterNetFeatureE2EValidationInput> = {},
): DeepFilterNetFeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== deepFilterNetFeatureE2EConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== deepFilterNetFeatureE2EConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== deepFilterNetFeatureE2EConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== deepFilterNetFeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be audio_feature_e2e.')
  if (input.inputVideo && input.inputVideo !== deepFilterNetFeatureE2EConfig.approvedInputVideo) blockers.push('Input video must be the approved Phase 32 private export.')
  if (input.artifactGcsPath && input.artifactGcsPath !== deepFilterNetFeatureE2EConfig.artifactGcsPath) blockers.push('Artifact path must be the approved private DeepFilterNet v0.5.6 GCS path.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute DeepFilterNet, mutate GCP, or process media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
