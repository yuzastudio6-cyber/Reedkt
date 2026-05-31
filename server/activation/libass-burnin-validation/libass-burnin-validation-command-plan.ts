import { libassBurninDoesNotDo, libassBurninValidationConfig } from './libass-burnin-validation-policy'

export function buildLibassBurninEnvVars(runId = 'phase45a-YYYYMMDDTHHMMSS', imageRef?: string, imageDigest?: string): string {
  return [
    `GCP_PROJECT_ID=${libassBurninValidationConfig.projectId}`,
    `GCP_REGION=${libassBurninValidationConfig.region}`,
    `REEDITPRO_ENV=${libassBurninValidationConfig.env}`,
    'REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true',
    `REEDITPRO_LIBASS_RUNTIME_MODE=${libassBurninValidationConfig.runtimeMode}`,
    `REEDITPRO_PHASE45A_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45A_INPUT_VIDEO_GCS_URI=${libassBurninValidationConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE45A_CAPTION_ASS_GCS_URI=${libassBurninValidationConfig.approvedCaptionAssGcsUri}`,
    `REEDITPRO_PHASE45A_CAPTION_SHA256=${libassBurninValidationConfig.approvedCaptionSha256}`,
    `REEDITPRO_PHASE45A_PREVIEWS_BUCKET=${libassBurninValidationConfig.previewsBucket}`,
    `REEDITPRO_PHASE45A_QA_BUCKET=${libassBurninValidationConfig.qaBucket}`,
    `REEDITPRO_PHASE45A_ARTIFACT_PREFIX=${libassBurninValidationConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE45A_PREVIEW_START_SECONDS=${libassBurninValidationConfig.previewStartSeconds}`,
    `REEDITPRO_PHASE45A_PREVIEW_DURATION_SECONDS=${libassBurninValidationConfig.previewDurationSeconds}`,
    `REEDITPRO_PHASE45A_PREVIEW_WIDTH=${libassBurninValidationConfig.previewWidth}`,
    `REEDITPRO_PHASE45A_PREVIEW_HEIGHT=${libassBurninValidationConfig.previewHeight}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'TRACK_B_TOOLS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    imageRef ? `REEDITPRO_IMAGE_REF=${imageRef}` : undefined,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
  ].filter(Boolean).join(',')
}

export function buildLibassBurninCommandPlans(input: { imageDigest?: string; runId?: string } = {}) {
  const imageRef = input.imageDigest
    ? `${libassBurninValidationConfig.runtimeImageRepository}@${input.imageDigest}`
    : libassBurninValidationConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase45a-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: libassBurninDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-libass-burnin-worker && docker buildx build --platform linux/amd64 -f docker/prod/libass-burnin-validation/Dockerfile -t ${libassBurninValidationConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: libassBurninDoesNotDo,
      warnings: ['Build only the dedicated Phase 45A FFmpeg/libass validation image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${libassBurninValidationConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${libassBurninValidationConfig.serviceAccountEmail} --cpu=${libassBurninValidationConfig.cpu} --memory=${libassBurninValidationConfig.memory} --parallelism=1 --max-retries=0 --set-env-vars ${buildLibassBurninEnvVars(runId, imageRef, input.imageDigest)}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: libassBurninDoesNotDo,
      warnings: ['CPU-only private preview sample. Do not add final delivery or provider env vars.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${libassBurninValidationConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: libassBurninDoesNotDo,
      warnings: ['Execution must use only the approved Phase 32 source and Phase 28 ASS sidecar.'],
    },
  ]
}
