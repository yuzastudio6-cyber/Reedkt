import type {
  RealVideoSam2TemporalMaskConfig,
  RealVideoSam2TemporalMaskEnvValidationInput,
  RealVideoSam2TemporalMaskValidationResult,
} from './real-video-sam2-temporal-mask-types'

export const realVideoSam2TemporalMaskConfig: RealVideoSam2TemporalMaskConfig = {
  phase: '35D',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'real_video_temporal_mask_sample',
  approvedInputVideoGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedAnchorFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
  approvedAnchorMaskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png',
  approvedAnchorCutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png',
  anchorTimestampSeconds: 7.7335,
  segmentStartSeconds: 6.9,
  segmentEndSeconds: 8.9,
  maxSegmentDurationSeconds: 2.0,
  preferredFrameCount: 10,
  maxFrames: 12,
  frameWidth: 768,
  frameHeight: 432,
  modelFamily: 'SAM2 / Segment Anything Model 2',
  modelId: 'sam2.1_hiera_tiny',
  checkpointFileName: 'sam2.1_hiera_tiny.pt',
  configFileName: 'sam2.1_hiera_t.yaml',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job',
  runtimeImageTag: 'staging-sam2-real-video-temporal-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime:staging-sam2-real-video-temporal-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime',
  approvedPhase35CImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9',
  approvedPhase35CExecutionId: 'reeditpro-staging-sam2-runtime-job-5smkz',
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  masksBucket: 'reeditpro-staging-reeditpro-masks',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
}

export const realVideoSam2TemporalMaskDoesNotDo = [
  'no arbitrary real user media',
  'no new source video',
  'no full-video mask tracking',
  'no full-video text-behind-subject',
  'no text-behind-subject video execution',
  'no final video export',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no external model-weight downloads at runtime',
  'no additional SAM2 checkpoints',
  'no public URLs or public buckets',
  'no RTX PRO 6000',
  'no production or external beta unlock',
]

export function validateRealVideoSam2TemporalMaskExecutionEnv(input: RealVideoSam2TemporalMaskEnvValidationInput = {}): RealVideoSam2TemporalMaskValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_SAM2_RUNTIME_MODE
  const inputVideoGcsUri = input.inputVideoGcsUri ?? process.env.REEDITPRO_PHASE35D_INPUT_VIDEO_GCS_URI
  const anchorFrameGcsUri = input.anchorFrameGcsUri ?? process.env.REEDITPRO_PHASE35D_ANCHOR_FRAME_GCS_URI
  const anchorMaskGcsUri = input.anchorMaskGcsUri ?? process.env.REEDITPRO_PHASE35D_ANCHOR_MASK_GCS_URI
  const anchorCutoutGcsUri = input.anchorCutoutGcsUri ?? process.env.REEDITPRO_PHASE35D_ANCHOR_CUTOUT_GCS_URI
  const modelGcsPath = input.modelGcsPath ?? process.env.REEDITPRO_SAM2_MODEL_GCS_PATH
  const segmentStartSeconds = input.segmentStartSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE35D_SEGMENT_START_SECONDS)
  const segmentEndSeconds = input.segmentEndSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE35D_SEGMENT_END_SECONDS)
  const segmentDurationSeconds = input.segmentDurationSeconds ?? numberFromEnv(process.env.REEDITPRO_PHASE35D_MAX_SEGMENT_SECONDS)
  const frameCount = input.frameCount ?? numberFromEnv(process.env.REEDITPRO_PHASE35D_MAX_FRAMES)

  if (projectId !== realVideoSam2TemporalMaskConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== realVideoSam2TemporalMaskConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== realVideoSam2TemporalMaskConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== realVideoSam2TemporalMaskConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true is required for execution.')
  if (runtimeMode !== realVideoSam2TemporalMaskConfig.runtimeMode) blockers.push('Runtime mode must be exactly real_video_temporal_mask_sample.')
  if (inputVideoGcsUri !== realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri) blockers.push('Only the approved Phase 32 private export is allowed.')
  if (anchorFrameGcsUri !== realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri) blockers.push('Only the approved Phase 33D representative frame is allowed.')
  if (anchorMaskGcsUri !== realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri) blockers.push('Only the approved Phase 33D mask is allowed.')
  if (anchorCutoutGcsUri !== realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri) blockers.push('Only the approved Phase 33D cutout is allowed.')
  if (modelGcsPath !== realVideoSam2TemporalMaskConfig.modelGcsPath) blockers.push('Only the approved private SAM2.1 tiny model GCS path may be used.')
  if ((input.checkpointSha256 ?? process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256) !== realVideoSam2TemporalMaskConfig.checkpointSha256) blockers.push('Checkpoint checksum must match Phase 35B evidence.')
  if ((input.configSha256 ?? process.env.REEDITPRO_SAM2_CONFIG_SHA256) !== realVideoSam2TemporalMaskConfig.configSha256) blockers.push('Config checksum must match Phase 35B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_SAM2_AGGREGATE_SHA256) !== realVideoSam2TemporalMaskConfig.aggregateSha256) blockers.push('Aggregate checksum must match Phase 35B evidence.')
  if (segmentStartSeconds !== undefined && Math.abs(segmentStartSeconds - realVideoSam2TemporalMaskConfig.segmentStartSeconds) > 0.0001) blockers.push('Segment start must be exactly 6.9s.')
  if (segmentEndSeconds !== undefined && Math.abs(segmentEndSeconds - realVideoSam2TemporalMaskConfig.segmentEndSeconds) > 0.0001) blockers.push('Segment end must be exactly 8.9s.')
  if (segmentDurationSeconds !== undefined && segmentDurationSeconds > realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds) blockers.push('Segment duration must be <= 2.0 seconds.')
  if (frameCount !== undefined && frameCount > realVideoSam2TemporalMaskConfig.maxFrames) blockers.push('Frame count must be <= 12.')
  if ((input.gpuType ?? realVideoSam2TemporalMaskConfig.gpuType) !== realVideoSam2TemporalMaskConfig.gpuType) blockers.push('Only nvidia-l4 is allowed for Phase 35D.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBeta ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.broadRealMedia ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media flag must remain false.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 35D execution orchestration.')

  warnings.push('Phase 35D executes one approved short real-video segment only.')
  warnings.push('Passing Phase 35D does not approve full-video masks, text-behind-subject video, production, external beta, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateRealVideoSam2TemporalMaskStaticPlan(input: Partial<RealVideoSam2TemporalMaskEnvValidationInput> = {}): RealVideoSam2TemporalMaskValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== realVideoSam2TemporalMaskConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== realVideoSam2TemporalMaskConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== realVideoSam2TemporalMaskConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== realVideoSam2TemporalMaskConfig.runtimeMode) blockers.push('Runtime mode must be real_video_temporal_mask_sample.')
  if (input.inputVideoGcsUri && input.inputVideoGcsUri !== realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri) blockers.push('Input video must be the approved Phase 32 private export.')
  if (input.modelGcsPath && input.modelGcsPath !== realVideoSam2TemporalMaskConfig.modelGcsPath) blockers.push('Model path must be the approved private SAM2.1 tiny GCS path.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute SAM2, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function realVideoSam2TemporalMaskArtifactPrefix(runId: string): string {
  if (!/^phase35d-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35D run id: ${runId}`)
  return `activation-real-video/phase35d/${runId}`
}

function numberFromEnv(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
