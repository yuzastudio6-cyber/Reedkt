import type {
  AudioSystemReadinessConfig,
  AudioSystemReadinessValidationInput,
  AudioSystemReadinessValidationResult,
} from './audio-system-readiness-types'

export const audioSystemReadinessConfig: AudioSystemReadinessConfig = {
  phase: '36F',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
  phase31RunId: 'phase31-20260528T13060',
  phase36ERunId: 'phase36e-20260530T152327',
  phase36EExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-hk6jm',
  phase36EReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36e/phase36e-20260530T152327/reports/phase36e-report.json',
  phase36ERuntimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93',
  deepFilterNetToolVersion: 'v0.5.6',
  deepFilterNetArtifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/',
  deepFilterNetCliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da',
  deepFilterNetModelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616',
  deepFilterNetAggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  reportObjectPrefix: 'activation-audio-ai/phase36f',
}

export const audioSystemReadinessDoesNotDo = [
  'no new or arbitrary media',
  'no IMG_6024.MOV processing',
  'no DeepFilterNet artifact download',
  'no RNNoise runtime',
  'no Demucs runtime',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no public URLs or public bucket access',
  'no external beta, paid production, broad media, or production-ready unlock',
]

export function audioSystemReadinessPrefix(runId: string): string {
  if (!/^phase36f-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 36F run id: ${runId}`)
  return `${audioSystemReadinessConfig.reportObjectPrefix}/${runId}`
}

export function validateAudioSystemReadinessExecutionEnv(
  input: AudioSystemReadinessValidationInput = {},
): AudioSystemReadinessValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS

  if (projectId !== audioSystemReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== audioSystemReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== audioSystemReadinessConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== audioSystemReadinessConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS=true is required for execution.')
  if ((input.approvedInputVideo ?? audioSystemReadinessConfig.approvedInputVideo) !== audioSystemReadinessConfig.approvedInputVideo) blockers.push('Only the approved Phase 32 controlled export may be used.')
  if ((input.phase36ERunId ?? audioSystemReadinessConfig.phase36ERunId) !== audioSystemReadinessConfig.phase36ERunId) blockers.push('Phase 36E run ID must match the approved run.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.rnnoiseEnabled ?? process.env.RNNOISE_ENABLED ?? 'false') !== 'false') blockers.push('RNNoise runtime must remain disabled.')
  if ((input.demucsEnabled ?? process.env.DEMUCS_ENABLED ?? 'false') !== 'false') blockers.push('Demucs runtime must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 36F execution orchestration.')

  warnings.push('Phase 36F is an internal audio feature testing readiness gate, not external beta or production approval.')
  warnings.push('Subjective listening review remains recommended before broader internal testing.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateAudioSystemReadinessStaticPlan(
  input: Partial<AudioSystemReadinessValidationInput> = {},
): AudioSystemReadinessValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== audioSystemReadinessConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== audioSystemReadinessConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== audioSystemReadinessConfig.env) blockers.push('Environment must be staging.')
  if (input.approvedInputVideo && input.approvedInputVideo !== audioSystemReadinessConfig.approvedInputVideo) blockers.push('Input video must be the approved Phase 32 private export.')
  if (input.phase36ERunId && input.phase36ERunId !== audioSystemReadinessConfig.phase36ERunId) blockers.push('Phase 36E run ID must match the approved run.')
  warnings.push('Static plan/report mode does not mutate GCS, process media, run DeepFilterNet, call providers, or enable beta/production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
