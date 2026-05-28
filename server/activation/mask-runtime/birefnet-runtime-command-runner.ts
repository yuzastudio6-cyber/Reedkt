import { birefnetRuntimeConfig, birefnetRuntimeDoesNotDo } from './birefnet-runtime-policy'
import type { BiRefNetRuntimeCommandPlan } from './birefnet-runtime-types'

export function buildBiRefNetRuntimeCommandPlans(imageDigest?: string): BiRefNetRuntimeCommandPlan[] {
  const imageRef = imageDigest
    ? `${birefnetRuntimeConfig.targetImage.split(':')[0]}@${imageDigest}`
    : birefnetRuntimeConfig.targetImage
  const conditionModelRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/birefnet/main/")'
  const conditionGeneratedCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-mask-runtime/phase33c/")'
  const conditionQaCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-mask-runtime/phase33c/")'
  const conditionTempCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-worker-temp/objects/activation-mask-runtime/phase33c/")'

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud iam service-accounts describe reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com --project reeditpro',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'iam-model-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-generated-assets --member=serviceAccount:${birefnetRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase33c_birefnet_model_read,expression='${conditionModelRead}',description='Read approved BiRefNet model objects only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: ['Do not replace this with broad storage.admin/objectAdmin/objectUser grants.'],
    },
    {
      commandId: 'iam-generated-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-generated-assets --member=serviceAccount:${birefnetRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33c_birefnet_generated_create,expression='${conditionGeneratedCreate}',description='Create Phase 33C mask runtime generated artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'iam-qa-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-qa-artifacts --member=serviceAccount:${birefnetRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33c_birefnet_qa_create,expression='${conditionQaCreate}',description='Create Phase 33C mask runtime QA artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'iam-worker-temp-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-worker-temp --member=serviceAccount:${birefnetRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33c_birefnet_worker_temp_create,expression='${conditionTempCreate}',description='Create Phase 33C mask runtime temp artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-birefnet-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/birefnet-runtime/Dockerfile -t ${birefnetRuntimeConfig.targetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: ['Build only the dedicated BiRefNet runtime image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${birefnetRuntimeConfig.targetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${birefnetRuntimeConfig.jobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${birefnetRuntimeConfig.serviceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_BIREFNET_RUNTIME=true,REEDITPRO_BIREFNET_RUNTIME_MODE=phase33c_generated_image,REEDITPRO_APPROVED_MASK_MODEL_ID=birefnet_main_staging_v1,REEDITPRO_MODEL_GCS_PATH=${birefnetRuntimeConfig.modelGcsPath},REEDITPRO_MODEL_RUNTIME_PATH=${birefnetRuntimeConfig.modelRuntimePath},REEDITPRO_MODEL_EXPECTED_SHA256=${birefnetRuntimeConfig.modelAggregateSha256},REEDITPRO_MODEL_REVISION=${birefnetRuntimeConfig.modelRevision},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,HF_HUB_OFFLINE=1,TRANSFORMERS_OFFLINE=1`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: ['Do not deploy RTX PRO 6000 or a non-digest image for final execution.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${birefnetRuntimeConfig.jobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: birefnetRuntimeDoesNotDo,
      warnings: ['Execution must use generated synthetic image only.'],
    },
  ]
}
