import { realVideoMaskConfig } from './real-video-mask-policy'
import { resolvePhase33DArtifactUris } from './real-video-mask-source-resolver'
import type { RealVideoMaskCommandPlan } from './real-video-mask-types'

export function buildBiRefNetFrameCommandPlans(runId = 'phase33d-pending', imageDigest = '<digest-pinned-birefnet-image>'): RealVideoMaskCommandPlan[] {
  const uris = resolvePhase33DArtifactUris(runId)
  const modelRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/birefnet/main/")'
  const frameRead = `resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/phase33d/${runId}/representative-frame/")`
  const generatedCreate = `resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/phase33d/${runId}/")`
  const qaCreate = `resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-real-video/phase33d/${runId}/")`
  const tempCreate = `resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-worker-temp/objects/activation-real-video/phase33d/${runId}/")`
  return [
    {
      commandId: 'preflight-birefnet-frame-runtime',
      phase: 'preflight',
      commandString: `gcloud run jobs describe ${realVideoMaskConfig.birefnetJobName} --region us-central1 --project reeditpro && gcloud storage objects describe ${uris.representativeFrame} && gcloud storage objects describe ${realVideoMaskConfig.modelGcsPath}model_tree_manifest.json`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-gpu-model-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.generatedAssetsBucket} --member=serviceAccount:${realVideoMaskConfig.gpuServiceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase33d_gpu_model_read,expression='${modelRead}',description='Read approved BiRefNet model objects only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['This may already exist from Phase 33C; keep it conditional if re-applied.'],
    },
    {
      commandId: 'iam-gpu-frame-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.generatedAssetsBucket} --member=serviceAccount:${realVideoMaskConfig.gpuServiceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase33d_gpu_frame_read,expression='${frameRead}',description='Read the Phase 33D representative frame only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-gpu-generated-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.generatedAssetsBucket} --member=serviceAccount:${realVideoMaskConfig.gpuServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_gpu_generated_create,expression='${generatedCreate}',description='Create Phase 33D mask and cutout artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-gpu-qa-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.qaBucket} --member=serviceAccount:${realVideoMaskConfig.gpuServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_gpu_qa_create,expression='${qaCreate}',description='Create Phase 33D QA reports only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-gpu-temp-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.workerTempBucket} --member=serviceAccount:${realVideoMaskConfig.gpuServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_gpu_temp_create,expression='${tempCreate}',description='Create Phase 33D GPU temp artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'build-push-birefnet-runtime',
      phase: 'build',
      commandString: `npm run build:staging-birefnet-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/birefnet-runtime/Dockerfile -t ${realVideoMaskConfig.birefnetTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Build only the dedicated BiRefNet runtime image; no SAM2 or all-model GPU image.'],
    },
    {
      commandId: 'deploy-birefnet-runtime-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoMaskConfig.birefnetJobName} --project reeditpro --region us-central1 --image ${imageDigest} --service-account ${realVideoMaskConfig.gpuServiceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_BIREFNET_RUNTIME=true,REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK=true,REEDITPRO_BIREFNET_RUNTIME_MODE=phase33d_real_video_frame,REEDITPRO_PHASE32_RUN_ID=phase32-20260528T13330,REEDITPRO_PHASE33D_RUN_ID=${runId},REEDITPRO_PHASE33D_INPUT_FRAME_GCS_URI=${uris.representativeFrame},REEDITPRO_APPROVED_MASK_MODEL_ID=birefnet_main_staging_v1,REEDITPRO_MODEL_GCS_PATH=${realVideoMaskConfig.modelGcsPath},REEDITPRO_MODEL_RUNTIME_PATH=${realVideoMaskConfig.modelRuntimePath},REEDITPRO_MODEL_EXPECTED_SHA256=${realVideoMaskConfig.modelAggregateSha256},REEDITPRO_MODEL_REVISION=${realVideoMaskConfig.modelRevision},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,HF_HUB_OFFLINE=1,TRANSFORMERS_OFFLINE=1`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['L4 only; do not fall back to CPU or RTX PRO 6000.'],
    },
    {
      commandId: 'execute-birefnet-frame-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoMaskConfig.birefnetJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Processes exactly one representative real-video frame; no full-video masking or text-behind-subject.'],
    },
  ]
}
