import type {
  Sam2FeatureE2EConfig,
  Sam2FeatureE2EEnvValidationInput,
  Sam2FeatureE2EExecutionReport,
  Sam2FeatureE2EValidationResult,
} from './sam2-feature-e2e-types'

export const sam2FeatureE2EConfig: Sam2FeatureE2EConfig = {
  phase: '35F',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'sam2_feature_e2e_preview',
  approvedLocalSourceCandidates: [
    '/Users/macuser/Downloads/IMG_6005.MOV',
    '/Users/macuser/Downloads/IMG.6005.mov',
    '/Users/macuser/Downloads/IMG_6005.mov',
    '/Users/macuser/Downloads/IMG.6005.MOV',
  ],
  approvedGcsSource: 'gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
  approvedPreviewSource: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  approvedPhase35CExecutionId: 'phase35c-20260529T16082',
  approvedPhase35DRunId: 'phase35d-20260530T004442',
  approvedPhase35ERunId: 'phase35e-20260530T01355',
  approvedText: 'REEDITPRO',
  previewWidth: 768,
  previewHeight: 432,
  preferredFps: 5,
  maxFps: 8,
  maxFrames: 125,
  fallbackSegmentStartSeconds: 6.9,
  fallbackSegmentEndSeconds: 8.9,
  fallbackSegmentDurationSeconds: 2.0,
  fallbackFrameCount: 10,
  controlledPreviewDurationSeconds: 15.467,
  modelFamily: 'SAM2 / Segment Anything Model 2',
  modelId: 'sam2.1_hiera_tiny',
  checkpointFileName: 'sam2.1_hiera_tiny.pt',
  configFileName: 'sam2.1_hiera_t.yaml',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/',
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job',
  runtimeImageTag: 'staging-sam2-feature-e2e-001',
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime:staging-sam2-feature-e2e-001',
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime',
  approvedPhase35DImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:b67dbc6d7f4c0f3641363678a750caa7cad8b610dbef2f3e4cbc87375e45c591',
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com',
  qaServiceAccountEmail: 'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com',
  sourceMediaBucket: 'reeditpro-staging-reeditpro-source-media',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  masksBucket: 'reeditpro-staging-reeditpro-masks',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp',
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny',
  gpuType: 'nvidia-l4',
  gpuCount: 1,
  cpu: 4,
  memory: '16Gi',
}

export const sam2FeatureE2EDoesNotDo = [
  'no arbitrary real user media',
  'no unrelated or new video',
  'no public source or public preview',
  'no full 4K processing',
  'no production full-video mask export',
  'no final delivery export',
  'no provider calls',
  'no Revideo',
  'no FILM or slow motion',
  'no Real-ESRGAN',
  'no external model downloads',
  'no additional SAM2 checkpoints',
  'no public URLs or public buckets',
  'no production, external beta, paid production, or broad media unlock',
]

export function phase35fPrefix(runId: string): string {
  if (!/^phase35f-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 35F run id: ${runId}`)
  return `activation-real-video/phase35f/${runId}`
}

export function validateSam2FeatureE2EExecutionEnv(input: Sam2FeatureE2EEnvValidationInput = {}): Sam2FeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SAM2_FEATURE_E2E
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_SAM2_RUNTIME_MODE
  const selectedSource = input.selectedSource ?? process.env.REEDITPRO_PHASE35F_SOURCE_GCS_URI ?? sam2FeatureE2EConfig.approvedPreviewSource
  const fps = input.fps ?? numberFromEnv(process.env.REEDITPRO_PHASE35F_FPS)
  const frameCount = input.frameCount ?? numberFromEnv(process.env.REEDITPRO_PHASE35F_FRAME_COUNT)
  const maxFrames = input.maxFrames ?? numberFromEnv(process.env.REEDITPRO_PHASE35F_MAX_FRAMES)

  if (projectId !== sam2FeatureE2EConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== sam2FeatureE2EConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== sam2FeatureE2EConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== sam2FeatureE2EConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true is required for execution.')
  if (runtimeMode !== undefined && runtimeMode !== sam2FeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be exactly sam2_feature_e2e_preview.')
  if (selectedSource !== sam2FeatureE2EConfig.approvedPreviewSource && selectedSource !== sam2FeatureE2EConfig.approvedGcsSource && !sam2FeatureE2EConfig.approvedLocalSourceCandidates.includes(selectedSource)) blockers.push('Only the approved Phase 32 export, approved Phase 28 GCS source, or verified approved local source candidate may be selected.')
  if ((input.modelGcsPath ?? process.env.REEDITPRO_SAM2_MODEL_GCS_PATH ?? sam2FeatureE2EConfig.modelGcsPath) !== sam2FeatureE2EConfig.modelGcsPath) blockers.push('Only the approved private SAM2.1 tiny model GCS path may be used.')
  if ((input.checkpointSha256 ?? process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256 ?? sam2FeatureE2EConfig.checkpointSha256) !== sam2FeatureE2EConfig.checkpointSha256) blockers.push('Checkpoint checksum must match Phase 35B evidence.')
  if ((input.configSha256 ?? process.env.REEDITPRO_SAM2_CONFIG_SHA256 ?? sam2FeatureE2EConfig.configSha256) !== sam2FeatureE2EConfig.configSha256) blockers.push('Config checksum must match Phase 35B evidence.')
  if ((input.aggregateSha256 ?? process.env.REEDITPRO_SAM2_AGGREGATE_SHA256 ?? sam2FeatureE2EConfig.aggregateSha256) !== sam2FeatureE2EConfig.aggregateSha256) blockers.push('Aggregate checksum must match Phase 35B evidence.')
  if ((input.text ?? process.env.REEDITPRO_PHASE35F_TEXT ?? sam2FeatureE2EConfig.approvedText) !== sam2FeatureE2EConfig.approvedText) blockers.push('Phase 35F text must be exactly REEDITPRO.')
  if ((input.previewWidth ?? numberFromEnv(process.env.REEDITPRO_PHASE35F_FRAME_WIDTH) ?? sam2FeatureE2EConfig.previewWidth) !== sam2FeatureE2EConfig.previewWidth) blockers.push('Preview width must be exactly 768.')
  if ((input.previewHeight ?? numberFromEnv(process.env.REEDITPRO_PHASE35F_FRAME_HEIGHT) ?? sam2FeatureE2EConfig.previewHeight) !== sam2FeatureE2EConfig.previewHeight) blockers.push('Preview height must be exactly 432.')
  if (fps !== undefined && fps > sam2FeatureE2EConfig.maxFps) blockers.push('Preview FPS must be <= 8.')
  if (frameCount !== undefined && frameCount > sam2FeatureE2EConfig.maxFrames) blockers.push('Preview frame count must be <= 125.')
  if (maxFrames !== undefined && maxFrames !== sam2FeatureE2EConfig.maxFrames) blockers.push('Max frame count must be exactly 125.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBeta ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProduction ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMedia ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real media flag must remain false.')
  if ((input.fullVideoMaskEnabled ?? process.env.FULL_VIDEO_MASK_ENABLED ?? 'false') !== 'false') blockers.push('Production full-video masks must remain disabled.')
  if ((input.fullVideoTextBehindSubjectEnabled ?? process.env.FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED ?? 'false') !== 'false') blockers.push('Full-video text-behind-subject must remain disabled.')
  if ((input.finalExportEnabled ?? process.env.FINAL_EXPORT_ENABLED ?? 'false') !== 'false') blockers.push('Final export must remain disabled.')
  if ((input.realEsrganEnabled ?? process.env.REAL_ESRGAN_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Real-ESRGAN execution must remain disabled.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 35F execution orchestration.')

  warnings.push('Phase 35F is a private bounded SAM2 feature E2E gate only.')
  warnings.push('Passing Phase 35F does not approve external beta, paid production, broad media, providers, Revideo, FILM, slow motion, Real-ESRGAN, final export, or arbitrary media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSam2FeatureE2EStaticPlan(input: Partial<Sam2FeatureE2EEnvValidationInput> = {}): Sam2FeatureE2EValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== sam2FeatureE2EConfig.projectId) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== sam2FeatureE2EConfig.region) blockers.push('Region must be us-central1.')
  if (input.env && input.env !== sam2FeatureE2EConfig.env) blockers.push('Environment must be staging.')
  if (input.runtimeMode && input.runtimeMode !== sam2FeatureE2EConfig.runtimeMode) blockers.push('Runtime mode must be sam2_feature_e2e_preview.')
  if (input.selectedSource && input.selectedSource !== sam2FeatureE2EConfig.approvedPreviewSource) blockers.push('Static report source defaults to the approved Phase 32 private export.')
  warnings.push('Static plan/report mode does not build images, deploy jobs, execute SAM2, process media, or mutate GCP.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSam2FeatureE2EReport(report?: Sam2FeatureE2EExecutionReport): string[] {
  if (!report) return ['Phase 35F execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('Phase 35F execution report did not return ok=true.')
  if (report.source.inputVideoGcsUri !== sam2FeatureE2EConfig.approvedPreviewSource) blockers.push('Phase 35F did not use the approved Phase 32 private preview source.')
  if (!report.planSnapshot.approvedPlanSnapshot || report.planSnapshot.rawPromptExecution) blockers.push('Approved plan snapshot integrity failed.')
  if (report.textLayerPlan.text !== sam2FeatureE2EConfig.approvedText) blockers.push('Unexpected text was composed.')
  if (report.previewScope.width !== sam2FeatureE2EConfig.previewWidth || report.previewScope.height !== sam2FeatureE2EConfig.previewHeight) blockers.push('Preview dimensions do not match Phase 35F policy.')
  if (report.previewScope.fps > sam2FeatureE2EConfig.maxFps) blockers.push('Preview FPS exceeds Phase 35F cap.')
  if (report.previewScope.frameCount > sam2FeatureE2EConfig.maxFrames) blockers.push('Preview frame count exceeds Phase 35F cap.')
  if (report.frames.frameCount !== report.previewScope.frameCount) blockers.push('Extracted frame count does not match preview scope.')
  if (report.masks.frameCount !== report.previewScope.frameCount) blockers.push('Mask count does not match preview scope.')
  if (report.composition.previewFrameUris.length !== report.previewScope.frameCount) blockers.push('Preview frame count does not match preview scope.')
  if (!report.composition.previewFrameUris.every((uri) => uri.startsWith(`gs://${sam2FeatureE2EConfig.previewsBucket}/activation-real-video/phase35f/`))) blockers.push('Preview frames are not under the approved private Phase 35F preview prefix.')
  if (report.qa.status === 'blocked') blockers.push(...report.qa.blockers)
  if (report.safety.arbitraryRealUserMediaUsed || report.safety.full4KProcessingUsed || report.safety.fullResolutionVideoProcessed) blockers.push('Forbidden arbitrary/full-resolution media path was reported.')
  if (report.safety.finalDeliveryExportCreated || report.safety.providerExecuted || report.safety.revideoUsed) blockers.push('Forbidden final export/provider/Revideo path was reported.')
  if (report.safety.realEsrganUsed || report.safety.filmUsed || report.safety.slowMotionExecuted) blockers.push('Forbidden Real-ESRGAN/FILM/slow-motion path was reported.')
  if (report.safety.publicAccessEnabled || report.safety.secretValuesUsed) blockers.push('Forbidden public access or secret value use was reported.')
  return Array.from(new Set([...blockers, ...report.blockers]))
}

function numberFromEnv(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
