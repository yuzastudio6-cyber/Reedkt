import type {
  RealVideoFilmSlowmotionConfig,
  RealVideoFilmSlowmotionEnvValidationInput,
  RealVideoFilmSlowmotionValidationResult,
} from './real-video-film-slowmotion-types'

export const realVideoFilmSlowmotionConfig: RealVideoFilmSlowmotionConfig = {
  phase: '38D',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'real_video_slowmotion_sample',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedAnchorTimestampSeconds: 7.7335,
  segmentStartSeconds: 6.9835,
  segmentEndSeconds: 8.4835,
  segmentDurationSeconds: 1.5,
  sourceFrameFps: 6,
  sourceFrameCount: 9,
  maxSourceFrames: 12,
  frameWidth: 512,
  frameHeight: 288,
  fallbackFrameWidth: 384,
  fallbackFrameHeight: 216,
  outputFrameCount: 17,
  maxOutputFrames: 24,
  interpolationTime: 0.5,
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/',
  artifactRuntimePath: '/tmp/reeditpro-model-weights/film/film-net-style-saved-model',
  kerasMetadataSha256: '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853',
  savedModelSha256: '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985',
  variablesDataSha256: '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9',
  variablesIndexSha256: 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5',
  aggregateSha256: '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b',
  approvedPhase38CRunId: 'phase38c-20260530T23315',
  approvedPhase38CImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:5be105e4fe49b21bb2e4085eca8c7fc4f01de74234de742816267b04e6ca6c2a',
  approvedPhase38CExecutionId: 'reeditpro-staging-film-runtime-job-gbwhl',
  runtimeJobName: 'reeditpro-staging-film-runtime-job',
  runtimeImageTag: 'staging-film-real-video-slowmotion-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime:staging-film-real-video-slowmotion-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  computeMode: 'cpu',
  cpu: 4,
  memory: '8Gi',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  reportObjectPrefix: 'activation-film-runtime/phase38d',
}

export const realVideoFilmSlowmotionDoesNotDo = [
  'no arbitrary real user media',
  'no new video source',
  'no full-video extraction or interpolation',
  'no final delivery export',
  'no audio preservation or audio stretching',
  'no providers',
  'no Revideo',
  'no Track B audio/OCR tools',
  'no external model downloads at runtime',
  'no alternate FILM model trees',
  'no public URLs or public buckets',
  'no production or external beta unlock',
]

export function validateRealVideoFilmSlowmotionExecutionEnv(input: RealVideoFilmSlowmotionEnvValidationInput = {}): RealVideoFilmSlowmotionValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_FILM_RUNTIME_MODE
  const inputVideoGcsUri = input.inputVideoGcsUri ?? process.env.REEDITPRO_PHASE38D_INPUT_VIDEO_GCS_URI
  const artifactGcsPath = input.artifactGcsPath ?? process.env.REEDITPRO_FILM_ARTIFACT_GCS_PATH
  const segmentStartSeconds = input.segmentStartSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_SEGMENT_START_SECONDS)
  const segmentEndSeconds = input.segmentEndSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_SEGMENT_END_SECONDS)
  const segmentDurationSeconds = input.segmentDurationSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_SEGMENT_DURATION_SECONDS)
  const sourceFrameCount = input.sourceFrameCount ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_SOURCE_FRAME_COUNT)
  const outputFrameCount = input.outputFrameCount ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_OUTPUT_FRAME_COUNT)
  const frameWidth = input.frameWidth ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_FRAME_WIDTH)
  const frameHeight = input.frameHeight ?? numberFromEnv(process.env.REEDITPRO_PHASE38D_FRAME_HEIGHT)

  if (projectId !== realVideoFilmSlowmotionConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== realVideoFilmSlowmotionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== realVideoFilmSlowmotionConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== realVideoFilmSlowmotionConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true is required for execution.')
  if (runtimeMode !== realVideoFilmSlowmotionConfig.runtimeMode) blockers.push('Runtime mode must be exactly real_video_slowmotion_sample.')
  if (inputVideoGcsUri !== realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (artifactGcsPath !== realVideoFilmSlowmotionConfig.artifactGcsPath) blockers.push('Only the approved private Phase 38B FILM artifact path is allowed.')
  if ((input.kerasMetadataSha256 ?? process.env.REEDITPRO_FILM_KERAS_METADATA_SHA256) !== realVideoFilmSlowmotionConfig.kerasMetadataSha256) blockers.push('keras_metadata.pb checksum must match Phase 38B evidence.')
  if ((input.savedModelSha256 ?? process.env.REEDITPRO_FILM_SAVED_MODEL_SHA256) !== realVideoFilmSlowmotionConfig.savedModelSha256) blockers.push('saved_model.pb checksum must match Phase 38B evidence.')
  if ((input.variablesDataSha256 ?? process.env.REEDITPRO_FILM_VARIABLES_DATA_SHA256) !== realVideoFilmSlowmotionConfig.variablesDataSha256) blockers.push('variables.data checksum must match Phase 38B evidence.')
  if ((input.variablesIndexSha256 ?? process.env.REEDITPRO_FILM_VARIABLES_INDEX_SHA256) !== realVideoFilmSlowmotionConfig.variablesIndexSha256) blockers.push('variables.index checksum must match Phase 38B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_FILM_AGGREGATE_SHA256) !== realVideoFilmSlowmotionConfig.aggregateSha256) blockers.push('Aggregate checksum must match Phase 38B evidence.')
  if (segmentStartSeconds !== undefined && Math.abs(segmentStartSeconds - realVideoFilmSlowmotionConfig.segmentStartSeconds) > 0.0001) blockers.push('Segment start must be exactly 6.9835s.')
  if (segmentEndSeconds !== undefined && Math.abs(segmentEndSeconds - realVideoFilmSlowmotionConfig.segmentEndSeconds) > 0.0001) blockers.push('Segment end must be exactly 8.4835s.')
  if (segmentDurationSeconds !== undefined && segmentDurationSeconds > realVideoFilmSlowmotionConfig.segmentDurationSeconds) blockers.push('Segment duration must be <= 1.5 seconds.')
  if (sourceFrameCount !== undefined && sourceFrameCount > realVideoFilmSlowmotionConfig.maxSourceFrames) blockers.push('Source frame count must be <= 12.')
  if (outputFrameCount !== undefined && outputFrameCount > realVideoFilmSlowmotionConfig.maxOutputFrames) blockers.push('Output frame count must be <= 24.')
  if (frameWidth !== undefined && frameWidth > realVideoFilmSlowmotionConfig.frameWidth) blockers.push('Frame width must be <= 512.')
  if (frameHeight !== undefined && frameHeight > realVideoFilmSlowmotionConfig.frameHeight) blockers.push('Frame height must be <= 288.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.audioStretchEnabled ?? process.env.AUDIO_STRETCH_ENABLED ?? 'false') !== 'false') blockers.push('Audio stretch must remain disabled.')
  if ((input.fullVideoInterpolationEnabled ?? process.env.FULL_VIDEO_INTERPOLATION_ENABLED ?? 'false') !== 'false') blockers.push('Full-video interpolation must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery export must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBeta ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMedia ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 38D execution orchestration.')

  warnings.push('Phase 38D executes one approved short real-video segment only.')
  warnings.push('Passing Phase 38D does not approve full-video interpolation, final delivery, audio stretch, production, beta, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateRealVideoFilmSlowmotionStaticPlan(input: Partial<RealVideoFilmSlowmotionEnvValidationInput> = {}): RealVideoFilmSlowmotionValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== realVideoFilmSlowmotionConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== realVideoFilmSlowmotionConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== realVideoFilmSlowmotionConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== realVideoFilmSlowmotionConfig.runtimeMode) blockers.push('Runtime mode must be real_video_slowmotion_sample.')
  if (input.inputVideoGcsUri && input.inputVideoGcsUri !== realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri) blockers.push('Input video must be the approved Phase 32 private export.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, process media, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function realVideoFilmSlowmotionArtifactPrefix(runId: string): string {
  if (!/^phase38d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 38D run id: ${runId}`)
  return `${realVideoFilmSlowmotionConfig.reportObjectPrefix}/${runId}`
}

export const realVideoFilmSlowmotionExpectedModelFiles = [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
] as const

function numberFromEnv(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
