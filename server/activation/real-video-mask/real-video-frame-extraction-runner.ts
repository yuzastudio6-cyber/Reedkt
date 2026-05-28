import { realVideoMaskConfig } from './real-video-mask-policy'
import type { RealVideoMaskCommandPlan } from './real-video-mask-types'

export function buildFrameExtractionCommandPlans(runId = 'phase33d-pending', imageDigest = '<digest-pinned-render-image>'): RealVideoMaskCommandPlan[] {
  const sourceRead = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/")'
  const generatedCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/activation-real-video/phase33d/")'
  const qaCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-qa-artifacts/objects/activation-real-video/phase33d/")'
  const tempCreate = 'resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-worker-temp/objects/activation-real-video/phase33d/")'
  return [
    {
      commandId: 'preflight-render-frame-extraction',
      phase: 'preflight',
      commandString: `gcloud run jobs describe ${realVideoMaskConfig.renderJobName} --region us-central1 --project reeditpro && gcloud storage objects describe ${realVideoMaskConfig.sourceGcsUri}`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-render-source-read',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.sourceBucket} --member=serviceAccount:${realVideoMaskConfig.renderServiceAccountEmail} --role=roles/storage.objectViewer --condition=title=phase33d_render_source_read,expression='${sourceRead}',description='Read approved Phase 32 export only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Do not fall back to broad storage roles if conditional IAM fails.'],
    },
    {
      commandId: 'iam-render-generated-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.generatedAssetsBucket} --member=serviceAccount:${realVideoMaskConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_render_generated_create,expression='${generatedCreate}',description='Create Phase 33D representative frame artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-render-qa-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.qaBucket} --member=serviceAccount:${realVideoMaskConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_render_qa_create,expression='${qaCreate}',description='Create Phase 33D frame extraction reports only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'iam-render-temp-create',
      phase: 'iam',
      commandString: `gcloud storage buckets add-iam-policy-binding gs://${realVideoMaskConfig.workerTempBucket} --member=serviceAccount:${realVideoMaskConfig.renderServiceAccountEmail} --role=roles/storage.objectCreator --condition=title=phase33d_render_temp_create,expression='${tempCreate}',description='Create Phase 33D render temp artifacts only'`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'build-push-render-worker',
      phase: 'build',
      commandString: `npm run build:staging-real-video-export-worker && docker buildx build --platform linux/amd64 -f docker/prod/render-worker/Dockerfile -t ${realVideoMaskConfig.renderTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Build only linux/amd64 render worker; do not build GPU/provider/Revideo images.'],
    },
    {
      commandId: 'deploy-render-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoMaskConfig.renderJobName} --project reeditpro --region us-central1 --image ${imageDigest} --service-account ${realVideoMaskConfig.renderServiceAccountEmail} --command node --args dist-staging-real-video-export-worker/staging-real-video-export-worker-cli.js --cpu=2 --memory=4Gi --parallelism=1 --max-retries=0 --task-timeout=15m --set-env-vars GCP_PROJECT_ID=reeditpro,GCP_REGION=us-central1,REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK=true,REEDITPRO_PHASE33D_MODE=representative_frame_extract,REEDITPRO_PHASE32_RUN_ID=phase32-20260528T13330,REEDITPRO_PHASE33D_INPUT_GCS_URI=${realVideoMaskConfig.sourceGcsUri},REEDITPRO_PHASE33D_RUN_ID=${runId},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,REEDITPRO_PRODUCTION_READY=false`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['No GPU is used for frame extraction.'],
    },
    {
      commandId: 'execute-render-frame-extraction',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoMaskConfig.renderJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Extracts exactly one representative frame from the approved Phase 32 export.'],
    },
  ]
}
