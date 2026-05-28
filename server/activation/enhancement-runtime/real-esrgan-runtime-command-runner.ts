import { realEsrganRuntimeConfig, realEsrganRuntimeDoesNotDo } from './real-esrgan-runtime-policy'
import type { RealEsrganRuntimeCommandPlan } from './real-esrgan-runtime-types'

export function buildRealEsrganRuntimeCommandPlans(imageDigest?: string): RealEsrganRuntimeCommandPlan[] {
  const imageRef = imageDigest
    ? `${realEsrganRuntimeConfig.targetImage.split(':')[0]}@${imageDigest}`
    : realEsrganRuntimeConfig.targetImage
  const conditionModelRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/real-esrgan/x4plus/")'
  const conditionGeneratedCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-enhancement-runtime/phase34c/")'
  const conditionQaCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-enhancement-runtime/phase34c/")'
  const conditionTempCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-worker-temp/objects/activation-enhancement-runtime/phase34c/")'

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud iam service-accounts describe reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com --project reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/RealESRGAN_x4plus.pth',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'iam-model-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-generated-assets --member=serviceAccount:${realEsrganRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase34c_real_esrgan_model_read,expression='${conditionModelRead}',description='Read approved RealESRGAN_x4plus model objects only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['Do not replace this with broad storage.admin/objectAdmin/objectUser grants.'],
    },
    {
      commandId: 'iam-generated-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-generated-assets --member=serviceAccount:${realEsrganRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase34c_real_esrgan_generated_create,expression='${conditionGeneratedCreate}',description='Create Phase 34C enhancement runtime generated artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['A pre-existing broader generated-assets objectCreator binding for the GPU worker may be present; record it as warning only.'],
    },
    {
      commandId: 'iam-qa-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-qa-artifacts --member=serviceAccount:${realEsrganRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase34c_real_esrgan_qa_create,expression='${conditionQaCreate}',description='Create Phase 34C enhancement runtime QA artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'iam-worker-temp-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-worker-temp --member=serviceAccount:${realEsrganRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase34c_real_esrgan_worker_temp_create,expression='${conditionTempCreate}',description='Create Phase 34C enhancement runtime temp artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-real-esrgan-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/real-esrgan-runtime/Dockerfile -t ${realEsrganRuntimeConfig.targetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['Build only the dedicated Real-ESRGAN runtime image.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${realEsrganRuntimeConfig.targetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realEsrganRuntimeConfig.jobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realEsrganRuntimeConfig.serviceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_REAL_ESRGAN_RUNTIME=true,REEDITPRO_REAL_ESRGAN_RUNTIME_MODE=phase34c_generated_image,REEDITPRO_APPROVED_ENHANCEMENT_MODEL_ID=real_esrgan_x4plus_staging_v1,REEDITPRO_MODEL_GCS_PATH=${realEsrganRuntimeConfig.modelGcsPath},REEDITPRO_MODEL_RUNTIME_PATH=${realEsrganRuntimeConfig.modelRuntimePath},REEDITPRO_MODEL_EXPECTED_FILE_SHA256=${realEsrganRuntimeConfig.modelFileSha256},REEDITPRO_MODEL_EXPECTED_AGGREGATE_SHA256=${realEsrganRuntimeConfig.modelAggregateSha256},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,REAL_ESRGAN_FACE_ENHANCE=false`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['Do not deploy RTX PRO 6000 or a non-digest image for final execution.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realEsrganRuntimeConfig.jobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realEsrganRuntimeDoesNotDo,
      warnings: ['Execution must use generated synthetic image only.'],
    },
  ]
}
