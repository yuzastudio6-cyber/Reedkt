import { buildRealVideoSam2IamPlan } from './real-video-sam2-iam-plan'
import { realVideoSam2TemporalMaskConfig, realVideoSam2TemporalMaskDoesNotDo } from './real-video-sam2-temporal-mask-policy'
import type { RealVideoSam2CommandPlan } from './real-video-sam2-temporal-mask-types'

export function buildRealVideoSam2CommandPlans(input: { imageDigest?: string; runId?: string } = {}): RealVideoSam2CommandPlan[] {
  const imageRef = input.imageDigest
    ? `${realVideoSam2TemporalMaskConfig.runtimeImageRepository}@${input.imageDigest}`
    : realVideoSam2TemporalMaskConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase35d-YYYYMMDDTHHMMSS'
  const envVars = [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true',
    'REEDITPRO_SAM2_RUNTIME_MODE=real_video_temporal_mask_sample',
    `REEDITPRO_PHASE35D_RUN_ID=${runId}`,
    `REEDITPRO_SAM2_MODEL_GCS_PATH=${realVideoSam2TemporalMaskConfig.modelGcsPath}`,
    `REEDITPRO_SAM2_MODEL_RUNTIME_PATH=${realVideoSam2TemporalMaskConfig.modelRuntimePath}`,
    `REEDITPRO_SAM2_CHECKPOINT_SHA256=${realVideoSam2TemporalMaskConfig.checkpointSha256}`,
    `REEDITPRO_SAM2_CONFIG_SHA256=${realVideoSam2TemporalMaskConfig.configSha256}`,
    `REEDITPRO_SAM2_AGGREGATE_SHA256=${realVideoSam2TemporalMaskConfig.aggregateSha256}`,
    `REEDITPRO_PHASE35D_INPUT_VIDEO_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_FRAME_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_MASK_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_CUTOUT_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_TIMESTAMP_SECONDS=${realVideoSam2TemporalMaskConfig.anchorTimestampSeconds}`,
    `REEDITPRO_PHASE35D_SEGMENT_START_SECONDS=${realVideoSam2TemporalMaskConfig.segmentStartSeconds}`,
    `REEDITPRO_PHASE35D_SEGMENT_END_SECONDS=${realVideoSam2TemporalMaskConfig.segmentEndSeconds}`,
    `REEDITPRO_PHASE35D_MAX_SEGMENT_SECONDS=${realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds}`,
    `REEDITPRO_PHASE35D_FRAME_COUNT=${realVideoSam2TemporalMaskConfig.preferredFrameCount}`,
    `REEDITPRO_PHASE35D_MAX_FRAMES=${realVideoSam2TemporalMaskConfig.maxFrames}`,
    `REEDITPRO_PHASE35D_FRAME_WIDTH=${realVideoSam2TemporalMaskConfig.frameWidth}`,
    `REEDITPRO_PHASE35D_FRAME_HEIGHT=${realVideoSam2TemporalMaskConfig.frameHeight}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    input.imageDigest ? `REEDITPRO_IMAGE_DIGEST=${input.imageDigest}` : undefined,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_SCOPE=approved_phase35d_short_segment_only',
    'FULL_VIDEO_MASK_ENABLED=false',
    'TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'HF_HUB_OFFLINE=1',
  ].filter(Boolean).join(',')

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-final-exports',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-masks',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.modelGcsPath}${realVideoSam2TemporalMaskConfig.checkpointFileName}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.modelGcsPath}${realVideoSam2TemporalMaskConfig.configFileName}`,
        `gcloud storage objects describe ${realVideoSam2TemporalMaskConfig.modelGcsPath}model_tree_manifest.json`,
        `gcloud run jobs describe ${realVideoSam2TemporalMaskConfig.runtimeJobName} --region us-central1 --project reeditpro`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realVideoSam2TemporalMaskDoesNotDo,
      warnings: ['Preflight is read-only and must confirm the exact approved private source artifacts.'],
    },
    ...buildRealVideoSam2IamPlan().map((plan): RealVideoSam2CommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoSam2TemporalMaskDoesNotDo,
      warnings: ['Use only if the exact conditional binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-sam2-runtime-worker && docker buildx build --platform linux/amd64 --provenance=false --sbom=false -f docker/prod/sam2-runtime/Dockerfile -t ${realVideoSam2TemporalMaskConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoSam2TemporalMaskDoesNotDo,
      warnings: ['Build only the dedicated SAM2 runtime image; do not bake model weights or media into the image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoSam2TemporalMaskConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realVideoSam2TemporalMaskConfig.serviceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoSam2TemporalMaskDoesNotDo,
      warnings: ['Do not enable arbitrary media, full-video masks, providers, public access, or production flags.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoSam2TemporalMaskConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoSam2TemporalMaskDoesNotDo,
      warnings: ['Execution must process exactly one bounded approved Phase 35D segment.'],
    },
  ]
}
