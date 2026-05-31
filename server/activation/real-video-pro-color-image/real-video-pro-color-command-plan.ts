import { realVideoProColorImageConfig, realVideoProColorImageDoesNotDo } from './real-video-pro-color-image-policy'
import type { RealVideoProColorImageCommandPlan } from './real-video-pro-color-image-types'

export function buildRealVideoProColorImageEnvVars(runId = 'phase40c-YYYYMMDDTHHMMSS', imageRef?: string, imageDigest?: string): string {
  return [
    `GCP_PROJECT_ID=${realVideoProColorImageConfig.projectId}`,
    `GCP_REGION=${realVideoProColorImageConfig.region}`,
    `REEDITPRO_ENV=${realVideoProColorImageConfig.env}`,
    'REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE=true',
    `REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE=${realVideoProColorImageConfig.runtimeMode}`,
    `REEDITPRO_PHASE40C_RUN_ID=${runId}`,
    `REEDITPRO_PHASE40C_INPUT_VIDEO_GCS_URI=${realVideoProColorImageConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE40B_REPORT_GCS_URI=${realVideoProColorImageConfig.phase40BReportUri}`,
    `REEDITPRO_PHASE40C_GENERATED_ASSETS_BUCKET=${realVideoProColorImageConfig.generatedAssetsBucket}`,
    `REEDITPRO_PHASE40C_PREVIEWS_BUCKET=${realVideoProColorImageConfig.previewsBucket}`,
    `REEDITPRO_PHASE40C_QA_BUCKET=${realVideoProColorImageConfig.qaBucket}`,
    `REEDITPRO_PHASE40C_WORKER_TEMP_BUCKET=${realVideoProColorImageConfig.workerTempBucket}`,
    `REEDITPRO_PHASE40C_ARTIFACT_PREFIX=${realVideoProColorImageConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE40C_TIMESTAMPS_SECONDS=${realVideoProColorImageConfig.timestampsSeconds.join(';')}`,
    `REEDITPRO_PHASE40C_MAX_FRAME_COUNT=${realVideoProColorImageConfig.maxFrameCount}`,
    `REEDITPRO_PHASE40C_FRAME_WIDTH=${realVideoProColorImageConfig.maxFrameWidth}`,
    `REEDITPRO_PHASE40C_FRAME_HEIGHT=${realVideoProColorImageConfig.maxFrameHeight}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FULL_VIDEO_PROCESSING_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    imageRef ? `REEDITPRO_IMAGE_REF=${imageRef}` : undefined,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
  ].filter(Boolean).join(',')
}

export function buildRealVideoProColorImageCommandPlans(input: { imageDigest?: string; runId?: string } = {}): RealVideoProColorImageCommandPlan[] {
  const imageRef = input.imageDigest
    ? `${realVideoProColorImageConfig.runtimeImageRepository}@${input.imageDigest}`
    : realVideoProColorImageConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase40c-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-final-exports && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-previews && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realVideoProColorImageDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-pro-color-image-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/pro-color-image-runtime/Dockerfile -t ${realVideoProColorImageConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoProColorImageDoesNotDo,
      warnings: ['Build only the dedicated Track A pro color/image runtime image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoProColorImageConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realVideoProColorImageConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${buildRealVideoProColorImageEnvVars(runId, imageRef, input.imageDigest)}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoProColorImageDoesNotDo,
      warnings: ['CPU-only bounded real-video frame sample. Do not add full-video/final-delivery/provider env vars.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoProColorImageConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoProColorImageDoesNotDo,
      warnings: ['Execution must use only the approved Phase 32 source and bounded frame sample.'],
    },
  ]
}
