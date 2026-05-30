import { buildFilmRuntimeIamPlan } from './film-runtime-iam-plan'
import { filmRuntimeConfig, filmRuntimeDoesNotDo } from './film-runtime-policy'
import type { FilmRuntimeCommandPlan } from './film-runtime-types'

export function buildFilmRuntimeCommandPlans(input: { imageDigest?: string; runId?: string } = {}): FilmRuntimeCommandPlan[] {
  const imageRef = input.imageDigest ? `${filmRuntimeConfig.runtimeImageRepository}@${input.imageDigest}` : filmRuntimeConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase38c-YYYYMMDDTHHMMSS'
  const envVars = buildFilmRuntimeEnvVars(runId, imageRef, input.imageDigest)

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `${filmRuntimeExpectedObjectDescribe('model_tree_manifest.json')}`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['Cloud Run FILM runtime job may not exist before Phase 38C deploy.'],
    },
    ...buildFilmRuntimeIamPlan().map((plan): FilmRuntimeCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['Use only if the exact conditional binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-film-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/film-runtime/Dockerfile -t ${filmRuntimeConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['Build only the dedicated CPU FILM runtime image; do not bake model artifacts into the image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${filmRuntimeConfig.runtimeTargetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${filmRuntimeConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${filmRuntimeConfig.serviceAccountEmail} --cpu=${filmRuntimeConfig.cpu} --memory=${filmRuntimeConfig.memory} --parallelism=1 --max-retries=0 --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['CPU-only generated-frame verification; do not enable GPU or real-media input.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${filmRuntimeConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: filmRuntimeDoesNotDo,
      warnings: ['Execution must use generated_frame_interpolation only.'],
    },
  ]
}

export function buildFilmRuntimeEnvVars(runId: string, imageRef: string, imageDigest?: string): string {
  return [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_FILM_RUNTIME=true',
    'REEDITPRO_FILM_RUNTIME_MODE=generated_frame_interpolation',
    `REEDITPRO_PHASE38C_RUN_ID=${runId}`,
    `REEDITPRO_FILM_ARTIFACT_GCS_PATH=${filmRuntimeConfig.artifactGcsPath}`,
    `REEDITPRO_FILM_ARTIFACT_RUNTIME_PATH=${filmRuntimeConfig.artifactRuntimePath}`,
    `REEDITPRO_FILM_KERAS_METADATA_SHA256=${filmRuntimeConfig.kerasMetadataSha256}`,
    `REEDITPRO_FILM_SAVED_MODEL_SHA256=${filmRuntimeConfig.savedModelSha256}`,
    `REEDITPRO_FILM_VARIABLES_DATA_SHA256=${filmRuntimeConfig.variablesDataSha256}`,
    `REEDITPRO_FILM_VARIABLES_INDEX_SHA256=${filmRuntimeConfig.variablesIndexSha256}`,
    `REEDITPRO_FILM_AGGREGATE_SHA256=${filmRuntimeConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
    'GENERATED_FRAMES_ONLY=true',
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].filter(Boolean).join(',')
}

function filmRuntimeExpectedObjectDescribe(relativePath: string): string {
  return `gcloud storage objects describe ${filmRuntimeConfig.artifactGcsPath}${relativePath}`
}
