import { remotionRenderDoesNotDo, remotionRenderValidationConfig } from './remotion-render-validation-policy'

export function buildRemotionRenderEnvVars(runId = 'phase45b-YYYYMMDDTHHMMSS', imageRef?: string, imageDigest?: string): string {
  return [
    `GCP_PROJECT_ID=${remotionRenderValidationConfig.projectId}`,
    `GCP_REGION=${remotionRenderValidationConfig.region}`,
    `REEDITPRO_ENV=${remotionRenderValidationConfig.env}`,
    'REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION=true',
    `REEDITPRO_REMOTION_RENDER_RUNTIME_MODE=${remotionRenderValidationConfig.runtimeMode}`,
    `REEDITPRO_PHASE45B_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45B_INPUT_VIDEO_GCS_URI=${remotionRenderValidationConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE45B_PHASE45A_RUN_ID=${remotionRenderValidationConfig.approvedPhase45ARunId}`,
    `REEDITPRO_PHASE45B_PHASE45A_PREVIEW_GCS_URI=${remotionRenderValidationConfig.approvedPhase45APreviewGcsUri}`,
    `REEDITPRO_PHASE45B_PHASE45A_REPORT_GCS_URI=${remotionRenderValidationConfig.approvedPhase45AReportGcsUri}`,
    `REEDITPRO_PHASE45B_PREVIEWS_BUCKET=${remotionRenderValidationConfig.previewsBucket}`,
    `REEDITPRO_PHASE45B_QA_BUCKET=${remotionRenderValidationConfig.qaBucket}`,
    `REEDITPRO_PHASE45B_ARTIFACT_PREFIX=${remotionRenderValidationConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE45B_PREVIEW_DURATION_SECONDS=${remotionRenderValidationConfig.previewDurationSeconds}`,
    `REEDITPRO_PHASE45B_PREVIEW_WIDTH=${remotionRenderValidationConfig.previewWidth}`,
    `REEDITPRO_PHASE45B_PREVIEW_HEIGHT=${remotionRenderValidationConfig.previewHeight}`,
    `REEDITPRO_PHASE45B_PREVIEW_FPS=${remotionRenderValidationConfig.previewFps}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'TRACK_B_TOOLS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_PAID_PRODUCTION_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    imageRef ? `REEDITPRO_IMAGE_REF=${imageRef}` : undefined,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
  ].filter(Boolean).join(',')
}

export function buildRemotionRenderCommandPlans(input: { imageDigest?: string; runId?: string } = {}) {
  const imageRef = input.imageDigest
    ? `${remotionRenderValidationConfig.runtimeImageRepository}@${input.imageDigest}`
    : remotionRenderValidationConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase45b-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: remotionRenderDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-remotion-render-validation-worker && docker buildx build --platform linux/amd64 -f docker/prod/remotion-render-validation/Dockerfile -t ${remotionRenderValidationConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: remotionRenderDoesNotDo,
      warnings: ['Build only the dedicated Phase 45B Remotion validation image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${remotionRenderValidationConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${remotionRenderValidationConfig.serviceAccountEmail} --cpu=${remotionRenderValidationConfig.cpu} --memory=${remotionRenderValidationConfig.memory} --parallelism=1 --max-retries=0 --set-env-vars ${buildRemotionRenderEnvVars(runId, imageRef, input.imageDigest)}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: remotionRenderDoesNotDo,
      warnings: ['CPU-only bounded private preview sample. Do not add final delivery or provider env vars.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${remotionRenderValidationConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: remotionRenderDoesNotDo,
      warnings: ['Execution must use only the approved Phase 32 source and Phase 45A private preview/report.'],
    },
  ] as const
}
