import { proColorImageFeatureE2EConfig, proColorImageFeatureE2EDoesNotDo } from './pro-color-image-feature-e2e-policy'
import type { ProColorImageFeatureE2ECommandPlan } from './pro-color-image-feature-e2e-types'

export function buildProColorImageFeatureE2EEnvVars(runId = 'phase40d-YYYYMMDDTHHMMSS', imageRef?: string, imageDigest?: string): string {
  return [
    `GCP_PROJECT_ID=${proColorImageFeatureE2EConfig.projectId}`,
    `GCP_REGION=${proColorImageFeatureE2EConfig.region}`,
    `REEDITPRO_ENV=${proColorImageFeatureE2EConfig.env}`,
    'REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E=true',
    `REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE=${proColorImageFeatureE2EConfig.runtimeMode}`,
    `REEDITPRO_PHASE40D_RUN_ID=${runId}`,
    `REEDITPRO_PHASE40D_INPUT_VIDEO_GCS_URI=${proColorImageFeatureE2EConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE40C_REPORT_GCS_URI=${proColorImageFeatureE2EConfig.phase40CReportUri}`,
    `REEDITPRO_PHASE40D_GENERATED_ASSETS_BUCKET=${proColorImageFeatureE2EConfig.generatedAssetsBucket}`,
    `REEDITPRO_PHASE40D_PREVIEWS_BUCKET=${proColorImageFeatureE2EConfig.previewsBucket}`,
    `REEDITPRO_PHASE40D_QA_BUCKET=${proColorImageFeatureE2EConfig.qaBucket}`,
    `REEDITPRO_PHASE40D_WORKER_TEMP_BUCKET=${proColorImageFeatureE2EConfig.workerTempBucket}`,
    `REEDITPRO_PHASE40D_ARTIFACT_PREFIX=${proColorImageFeatureE2EConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE40D_TIMESTAMPS_SECONDS=${proColorImageFeatureE2EConfig.timestampsSeconds.join(';')}`,
    `REEDITPRO_PHASE40D_MAX_FRAME_COUNT=${proColorImageFeatureE2EConfig.maxFrameCount}`,
    `REEDITPRO_PHASE40D_FRAME_WIDTH=${proColorImageFeatureE2EConfig.maxFrameWidth}`,
    `REEDITPRO_PHASE40D_FRAME_HEIGHT=${proColorImageFeatureE2EConfig.maxFrameHeight}`,
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

export function buildProColorImageFeatureE2ECommandPlans(input: { imageDigest?: string; runId?: string } = {}): ProColorImageFeatureE2ECommandPlan[] {
  const imageRef = input.imageDigest
    ? `${proColorImageFeatureE2EConfig.runtimeImageRepository}@${input.imageDigest}`
    : proColorImageFeatureE2EConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase40d-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-final-exports && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-previews && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/phase40c-20260531T11504/reports/phase40c-report.json',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: proColorImageFeatureE2EDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-pro-color-image-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/pro-color-image-runtime/Dockerfile -t ${proColorImageFeatureE2EConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageFeatureE2EDoesNotDo,
      warnings: ['Build only the dedicated Track A pro color/image runtime image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${proColorImageFeatureE2EConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${proColorImageFeatureE2EConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${buildProColorImageFeatureE2EEnvVars(runId, imageRef, input.imageDigest)}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageFeatureE2EDoesNotDo,
      warnings: ['CPU-only private feature E2E sample. Do not add full-video/final-delivery/provider env vars.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${proColorImageFeatureE2EConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageFeatureE2EDoesNotDo,
      warnings: ['Execution must use only the approved Phase 32 source, Phase 40C evidence, and bounded feature E2E sample.'],
    },
  ]
}
