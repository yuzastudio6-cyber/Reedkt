import { proColorImageRuntimeConfig, proColorImageRuntimeDoesNotDo } from './pro-color-image-runtime-policy'
import type { ProColorImageRuntimeCommandPlan } from './pro-color-image-runtime-types'

export function buildProColorImageRuntimeEnvVars(runId = 'phase40b-YYYYMMDDTHHMMSS', imageRef?: string, imageDigest?: string): string {
  return [
    `GCP_PROJECT_ID=${proColorImageRuntimeConfig.projectId}`,
    `GCP_REGION=${proColorImageRuntimeConfig.region}`,
    `REEDITPRO_ENV=${proColorImageRuntimeConfig.env}`,
    'REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true',
    `REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE=${proColorImageRuntimeConfig.runtimeMode}`,
    `REEDITPRO_PHASE40B_RUN_ID=${runId}`,
    `REEDITPRO_PHASE40B_GENERATED_ASSETS_BUCKET=${proColorImageRuntimeConfig.generatedAssetsBucket}`,
    `REEDITPRO_PHASE40B_QA_BUCKET=${proColorImageRuntimeConfig.qaBucket}`,
    `REEDITPRO_PHASE40B_WORKER_TEMP_BUCKET=${proColorImageRuntimeConfig.workerTempBucket}`,
    `REEDITPRO_PHASE40B_ARTIFACT_PREFIX=${proColorImageRuntimeConfig.reportObjectPrefix}/${runId}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    imageRef ? `REEDITPRO_IMAGE_REF=${imageRef}` : undefined,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
  ].filter(Boolean).join(',')
}

export function buildProColorImageRuntimeCommandPlans(input: { imageDigest?: string; runId?: string } = {}): ProColorImageRuntimeCommandPlan[] {
  const imageRef = input.imageDigest
    ? `${proColorImageRuntimeConfig.runtimeImageRepository}@${input.imageDigest}`
    : proColorImageRuntimeConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase40b-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud iam service-accounts describe reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com --project reeditpro && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts && gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: proColorImageRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-pro-color-image-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/pro-color-image-runtime/Dockerfile -t ${proColorImageRuntimeConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageRuntimeDoesNotDo,
      warnings: ['Build only the dedicated Phase 40B pro color/image runtime image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${proColorImageRuntimeConfig.runtimeTargetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: proColorImageRuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${proColorImageRuntimeConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${proColorImageRuntimeConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${buildProColorImageRuntimeEnvVars(runId, imageRef, input.imageDigest)}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageRuntimeDoesNotDo,
      warnings: ['CPU-only generated fixture runtime. Do not add GPU or real-media env vars.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${proColorImageRuntimeConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: proColorImageRuntimeDoesNotDo,
      warnings: ['Execution must use generated fixtures only.'],
    },
  ]
}
