import type { FilmRuntimeConfig, FilmRuntimeEnvValidationInput, FilmRuntimeValidationResult } from './film-runtime-types'

export const filmRuntimeConfig: FilmRuntimeConfig = {
  phase: '38C',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'generated_frame_interpolation',
  toolFamily: 'FILM / frame interpolation / slow motion',
  toolId: 'film',
  artifactId: 'film_net_style_saved_model',
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/',
  artifactRuntimePath: '/tmp/reeditpro-model-weights/film/film-net-style-saved-model',
  kerasMetadataSha256: '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853',
  savedModelSha256: '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985',
  variablesDataSha256: '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9',
  variablesIndexSha256: 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5',
  aggregateSha256: '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b',
  runtimeJobName: 'reeditpro-staging-film-runtime-job',
  runtimeImageTag: 'staging-film-runtime-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime:staging-film-runtime-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  reportObjectPrefix: 'activation-film-runtime/phase38c',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  fixtureFrameCount: 2,
  fixtureWidth: 256,
  fixtureHeight: 256,
  interpolationTime: 0.5,
}

export const filmRuntimeDoesNotDo = [
  'no real video input',
  'no real user media',
  'no Phase 28/32 controlled video chain input',
  'no real-video slow motion',
  'no full-video interpolation',
  'no provider calls',
  'no Revideo',
  'no external model artifact downloads at runtime',
  'no alternate FILM model trees',
  'no public URLs or public buckets',
  'no production or external beta unlock',
  'no Track B audio/OCR work',
]

export function validateFilmRuntimeExecutionEnv(input: FilmRuntimeEnvValidationInput = {}): FilmRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_FILM_RUNTIME
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_FILM_RUNTIME_MODE

  if (projectId !== filmRuntimeConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== filmRuntimeConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== filmRuntimeConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== filmRuntimeConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FILM_RUNTIME=true is required for execution.')
  if (runtimeMode !== filmRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be exactly generated_frame_interpolation.')
  if ((input.artifactGcsPath ?? process.env.REEDITPRO_FILM_ARTIFACT_GCS_PATH) !== filmRuntimeConfig.artifactGcsPath) blockers.push('Only the approved private Phase 38B FILM artifact GCS path may be used.')
  if ((input.kerasMetadataSha256 ?? process.env.REEDITPRO_FILM_KERAS_METADATA_SHA256) !== filmRuntimeConfig.kerasMetadataSha256) blockers.push('keras_metadata.pb checksum must match Phase 38B evidence.')
  if ((input.savedModelSha256 ?? process.env.REEDITPRO_FILM_SAVED_MODEL_SHA256) !== filmRuntimeConfig.savedModelSha256) blockers.push('saved_model.pb checksum must match Phase 38B evidence.')
  if ((input.variablesDataSha256 ?? process.env.REEDITPRO_FILM_VARIABLES_DATA_SHA256) !== filmRuntimeConfig.variablesDataSha256) blockers.push('variables.data checksum must match Phase 38B evidence.')
  if ((input.variablesIndexSha256 ?? process.env.REEDITPRO_FILM_VARIABLES_INDEX_SHA256) !== filmRuntimeConfig.variablesIndexSha256) blockers.push('variables.index checksum must match Phase 38B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_FILM_AGGREGATE_SHA256) !== filmRuntimeConfig.aggregateSha256) blockers.push('Aggregate checksum must match Phase 38B evidence.')
  if ((input.generatedFramesOnly ?? process.env.GENERATED_FRAMES_ONLY ?? 'true') !== 'true') blockers.push('Phase 38C requires generated frames only.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.realMediaInputEnabled ?? process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false') !== 'false') blockers.push('Real media input must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 38C execution orchestration.')

  warnings.push('Phase 38C verifies FILM runtime on generated synthetic frames only.')
  warnings.push('Passing Phase 38C does not approve real-video slow motion, full-video interpolation, production, or beta.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateFilmRuntimeStaticPlan(input: Partial<FilmRuntimeEnvValidationInput> = {}): FilmRuntimeValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== filmRuntimeConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== filmRuntimeConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== filmRuntimeConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== filmRuntimeConfig.runtimeMode) blockers.push('Runtime mode must be generated_frame_interpolation.')
  if (input.artifactGcsPath && input.artifactGcsPath !== filmRuntimeConfig.artifactGcsPath) blockers.push('Artifact path must be the approved private Phase 38B FILM GCS path.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute FILM, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function filmRuntimeArtifactPrefix(runId: string): string {
  if (!/^phase38c-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 38C run id: ${runId}`)
  return `${filmRuntimeConfig.reportObjectPrefix}/${runId}`
}

export const filmRuntimeExpectedFiles = [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
] as const
