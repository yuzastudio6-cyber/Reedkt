import { buildRealVideoEnhancementIamCommandPlans } from './real-video-enhancement-iam-plan'
import { realVideoEnhancementSampleConfig } from './real-video-enhancement-sample-policy'
import type { RealVideoEnhancementSampleCommandPlan } from './real-video-enhancement-sample-types'

const blockedBehaviors = [
  'no full-frame enhancement',
  'no full-video enhancement',
  'no FILM download or execution',
  'no slow motion',
  'no alternate Real-ESRGAN model weights',
  'no GFPGAN/facexlib weights or face enhancement',
  'no runtime model downloads',
  'no provider calls',
  'no public URLs or public buckets',
  'no RTX PRO 6000',
  'no Revideo',
  'no production or external beta unlock',
]

export function buildRealVideoEnhancementSampleCommandPlans(runId = 'phase34d-<runId>', imageDigest?: string): RealVideoEnhancementSampleCommandPlan[] {
  const imageRef = imageDigest
    ? `${realVideoEnhancementSampleConfig.runtimeTargetImage.split(':')[0]}@${imageDigest}`
    : realVideoEnhancementSampleConfig.runtimeTargetImage
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        `gcloud run jobs describe ${realVideoEnhancementSampleConfig.runtimeJobName} --region us-central1 --project reeditpro`,
        `gcloud storage objects describe ${realVideoEnhancementSampleConfig.sourceFrameGcsUri}`,
        `gcloud storage objects describe ${realVideoEnhancementSampleConfig.modelGcsPath}${realVideoEnhancementSampleConfig.modelFileName}`,
        `gcloud storage objects describe ${realVideoEnhancementSampleConfig.modelGcsPath}model_tree_manifest.json`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: blockedBehaviors,
    },
    ...buildRealVideoEnhancementIamCommandPlans(),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-real-esrgan-runtime-worker && docker buildx build --platform linux/amd64 -f docker/prod/real-esrgan-runtime/Dockerfile -t ${realVideoEnhancementSampleConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Build only the dedicated Real-ESRGAN runtime image; do not build FILM or all-model GPU images.'],
    },
    {
      commandId: 'inspect-image',
      phase: 'build',
      commandString: `docker buildx imagetools inspect ${realVideoEnhancementSampleConfig.runtimeTargetImage}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Manifest must include linux/amd64.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoEnhancementSampleConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realVideoEnhancementSampleConfig.gpuServiceAccountEmail} --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --parallelism=1 --max-retries=0 --no-gpu-zonal-redundancy --set-env-vars REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_REAL_VIDEO_ENHANCEMENT_SAMPLE=true,REEDITPRO_REAL_ESRGAN_RUNTIME_MODE=phase34d_real_video_sample,REEDITPRO_PHASE33D_RUN_ID=phase33d-20260528T161056,REEDITPRO_PHASE34D_RUN_ID=${runId},REEDITPRO_PHASE34D_INPUT_FRAME_GCS_URI=${realVideoEnhancementSampleConfig.sourceFrameGcsUri},REEDITPRO_APPROVED_ENHANCEMENT_MODEL_ID=real_esrgan_x4plus_staging_v1,REEDITPRO_MODEL_GCS_PATH=${realVideoEnhancementSampleConfig.modelGcsPath},REEDITPRO_MODEL_RUNTIME_PATH=${realVideoEnhancementSampleConfig.modelRuntimePath},REEDITPRO_MODEL_EXPECTED_FILE_SHA256=${realVideoEnhancementSampleConfig.modelFileSha256},REEDITPRO_MODEL_EXPECTED_AGGREGATE_SHA256=${realVideoEnhancementSampleConfig.modelAggregateSha256},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,REAL_ESRGAN_FACE_ENHANCE=false,REEDITPRO_PRODUCTION_READY=false`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Pin deployment to a digest before final execution; do not use RTX PRO 6000 or CPU fallback.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoEnhancementSampleConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Execution must create exactly one bounded sample crop from the approved Phase 33D frame.'],
    },
  ]
}
