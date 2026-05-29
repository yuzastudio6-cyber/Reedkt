import { buildSam2RuntimeIamPlan } from './sam2-runtime-iam-plan'
import { sam2RuntimeConfig, sam2RuntimeDoesNotDo } from './sam2-runtime-policy'
import type { Sam2RuntimeCommandPlan } from './sam2-runtime-types'

export function buildSam2RuntimeCommandPlans(input: { imageDigest?: string; runId?: string } = {}): Sam2RuntimeCommandPlan[] {
  const imageRef = input.imageDigest
    ? `${sam2RuntimeConfig.runtimeImageRepository}@${input.imageDigest}`
    : sam2RuntimeConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase35c-YYYYMMDDTHHMMSS'
  const envVars = [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_SAM2_RUNTIME=true',
    'REEDITPRO_SAM2_RUNTIME_MODE=generated_synthetic_sequence',
    `REEDITPRO_PHASE35C_RUN_ID=${runId}`,
    `REEDITPRO_SAM2_MODEL_GCS_PATH=${sam2RuntimeConfig.modelGcsPath}`,
    `REEDITPRO_SAM2_MODEL_RUNTIME_PATH=${sam2RuntimeConfig.modelRuntimePath}`,
    `REEDITPRO_SAM2_CHECKPOINT_SHA256=${sam2RuntimeConfig.checkpointSha256}`,
    `REEDITPRO_SAM2_CONFIG_SHA256=${sam2RuntimeConfig.configSha256}`,
    `REEDITPRO_SAM2_AGGREGATE_SHA256=${sam2RuntimeConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    input.imageDigest ? `REEDITPRO_IMAGE_DIGEST=${input.imageDigest}` : undefined,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
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
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        'gcloud storage objects describe gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_tiny.pt',
        'gcloud storage objects describe gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/sam2.1_hiera_t.yaml',
        'gcloud storage objects describe gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/model_tree_manifest.json',
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Cloud Run job may not exist before Phase 35C; absence is expected before deploy.'],
    },
    ...buildSam2RuntimeIamPlan().map((plan): Sam2RuntimeCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Use only if the exact conditional binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-sam2-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/sam2-runtime/Dockerfile -t ${sam2RuntimeConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Build only the dedicated SAM2 runtime image; do not bake model weights into the image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${sam2RuntimeConfig.runtimeTargetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${sam2RuntimeConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${sam2RuntimeConfig.serviceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Do not replace nvidia-l4 with RTX PRO 6000 or enable real-media input.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${sam2RuntimeConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2RuntimeDoesNotDo,
      warnings: ['Execution must use generated synthetic sequence only.'],
    },
  ]
}
