import type {
  AudioStackDemucsConfig,
  AudioStackDemucsValidationInput,
  AudioStackDemucsValidationResult,
} from './audio-stack-demucs-types'

export const audioStackDemucsConfig: AudioStackDemucsConfig = {
  phase: '36G',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
  phase36ERunId: 'phase36e-20260530T152327',
  phase36FRunId: 'phase36f-20260530T161352',
  deepFilterNetScope: 'speech_cleanup',
  demucsScope: 'vocal_music_stem_separation',
  rnnoiseScope: 'removed_from_active_product_flow',
  demucsModelCandidate: 'htdemucs',
  demucsRepoUrl: 'https://github.com/facebookresearch/demucs',
  demucsModelLicenseIssueUrl: 'https://github.com/facebookresearch/demucs/issues/327',
  demucsTargetGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/demucs/htdemucs/',
  reportObjectPrefix: 'activation-audio-ai/phase36g',
}

export const audioStackDemucsDoesNotDo = [
  'no Demucs model download',
  'no Demucs runtime',
  'no RNNoise runtime or fallback routing',
  'no arbitrary media',
  'no IMG_6024.MOV processing',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no public URLs or public bucket access',
  'no external beta, paid production, broad media, or production-ready unlock',
]

export function validateAudioStackDemucsExecutionEnv(
  input: AudioStackDemucsValidationInput = {},
): AudioStackDemucsValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_AUDIO_STACK_DEMUCS_E2E

  if (projectId !== audioStackDemucsConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== audioStackDemucsConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== audioStackDemucsConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== audioStackDemucsConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_AUDIO_STACK_DEMUCS_E2E=true is required for execution.')
  if ((input.approvedInputVideo ?? audioStackDemucsConfig.approvedInputVideo) !== audioStackDemucsConfig.approvedInputVideo) blockers.push('Only the approved Phase 32 controlled export may be referenced.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.rnnoiseEnabled ?? process.env.RNNOISE_ENABLED ?? 'false') !== 'false') blockers.push('RNNoise must remain removed from active execution.')
  if ((input.demucsRuntimeEnabled ?? process.env.DEMUCS_RUNTIME_ENABLED ?? 'false') !== 'false') blockers.push('Demucs runtime must remain disabled until pretrained-model license/provenance is cleared.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 36G closes the audio stack decision but does not approve Demucs execution.')
  warnings.push('Demucs is a separation candidate only after model license/provenance evidence is cleared.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateAudioStackDemucsStaticPlan(
  input: Partial<AudioStackDemucsValidationInput> = {},
): AudioStackDemucsValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== audioStackDemucsConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== audioStackDemucsConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== audioStackDemucsConfig.env) blockers.push('Environment must be staging.')
  if (input.approvedInputVideo && input.approvedInputVideo !== audioStackDemucsConfig.approvedInputVideo) blockers.push('Input video must be the approved Phase 32 private export.')
  warnings.push('Static plan/report mode does not mutate GCS, process media, download Demucs models, run Docker, call providers, or enable beta/production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
