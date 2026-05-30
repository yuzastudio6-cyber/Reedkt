import { buildDeepFilterNetRuntimeIamPlan } from './deepfilternet-runtime-iam-plan'
import { deepFilterNetRuntimeConfig, deepFilterNetRuntimeDoesNotDo } from './deepfilternet-runtime-policy'
import type { DeepFilterNetRuntimeCommandPlan } from './deepfilternet-runtime-types'

export function buildDeepFilterNetRuntimeCommandPlans(input: { imageDigest?: string; runId?: string } = {}): DeepFilterNetRuntimeCommandPlan[] {
  const imageRef = input.imageDigest
    ? `${deepFilterNetRuntimeConfig.runtimeImageRepository}@${input.imageDigest}`
    : deepFilterNetRuntimeConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase36c-YYYYMMDDTHHMMSS'
  const envVars = [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=generated_audio',
    `REEDITPRO_PHASE36C_RUN_ID=${runId}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${deepFilterNetRuntimeConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${deepFilterNetRuntimeConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${deepFilterNetRuntimeConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${deepFilterNetRuntimeConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${deepFilterNetRuntimeConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    input.imageDigest ? `REEDITPRO_IMAGE_DIGEST=${input.imageDigest}` : undefined,
    'GENERATED_AUDIO_ONLY=true',
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'RNNOISE_ENABLED=false',
    'DEMUCS_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].filter(Boolean).join(',')

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-analysis-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `gcloud storage objects describe ${deepFilterNetRuntimeConfig.artifactGcsPath}${deepFilterNetRuntimeConfig.cliFileName}`,
        `gcloud storage objects describe ${deepFilterNetRuntimeConfig.artifactGcsPath}${deepFilterNetRuntimeConfig.modelArchiveFileName}`,
        `gcloud storage objects describe ${deepFilterNetRuntimeConfig.artifactGcsPath}model_tree_manifest.json`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Cloud Run job may not exist before Phase 36C; absence is expected before deploy.'],
    },
    ...buildDeepFilterNetRuntimeIamPlan().map((plan): DeepFilterNetRuntimeCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Use only if the exact conditional binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-deepfilternet-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/deepfilternet-runtime/Dockerfile -t ${deepFilterNetRuntimeConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Build only the dedicated DeepFilterNet runtime image; do not bake artifacts into the image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${deepFilterNetRuntimeConfig.runtimeTargetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${deepFilterNetRuntimeConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${deepFilterNetRuntimeConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Do not configure GPU or enable real-media input.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${deepFilterNetRuntimeConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetRuntimeDoesNotDo,
      warnings: ['Execution must use generated audio only.'],
    },
  ]
}
