import { openTimelineIoDoesNotDo, openTimelineIoValidationConfig } from './opentimelineio-validation-policy'

export function buildOpenTimelineIoEnvVars(runId = 'phase45c-YYYYMMDDTHHMMSS'): string {
  return [
    `GCP_PROJECT_ID=${openTimelineIoValidationConfig.projectId}`,
    `GCP_REGION=${openTimelineIoValidationConfig.region}`,
    `REEDITPRO_ENV=${openTimelineIoValidationConfig.env}`,
    'REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION=true',
    `REEDITPRO_OTIO_TIMELINE_RUNTIME_MODE=${openTimelineIoValidationConfig.runtimeMode}`,
    `REEDITPRO_PHASE45C_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45C_INPUT_VIDEO_GCS_URI=${openTimelineIoValidationConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE45C_PHASE45A_RUN_ID=${openTimelineIoValidationConfig.approvedPhase45ARunId}`,
    `REEDITPRO_PHASE45C_PHASE45A_PREVIEW_GCS_URI=${openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri}`,
    `REEDITPRO_PHASE45C_PHASE45A_REPORT_GCS_URI=${openTimelineIoValidationConfig.approvedPhase45AReportGcsUri}`,
    `REEDITPRO_PHASE45C_PHASE45B_RUN_ID=${openTimelineIoValidationConfig.approvedPhase45BRunId}`,
    `REEDITPRO_PHASE45C_PHASE45B_PREVIEW_GCS_URI=${openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri}`,
    `REEDITPRO_PHASE45C_PHASE45B_REPORT_GCS_URI=${openTimelineIoValidationConfig.approvedPhase45BReportGcsUri}`,
    `REEDITPRO_PHASE45C_GENERATED_ASSETS_BUCKET=${openTimelineIoValidationConfig.generatedAssetsBucket}`,
    `REEDITPRO_PHASE45C_QA_BUCKET=${openTimelineIoValidationConfig.qaBucket}`,
    `REEDITPRO_PHASE45C_ARTIFACT_PREFIX=${openTimelineIoValidationConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE45C_TIMELINE_DURATION_SECONDS=${openTimelineIoValidationConfig.timelineDurationSeconds}`,
    `REEDITPRO_PHASE45C_TIMELINE_FPS=${openTimelineIoValidationConfig.timelineFps}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'TRACK_B_TOOLS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_PAID_PRODUCTION_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].join(' ')
}

export function buildOpenTimelineIoCommandPlans(input: { runId?: string } = {}) {
  const runId = input.runId ?? 'phase45c-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: openTimelineIoDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'execute-local-gcs-validation',
      phase: 'execute',
      commandString: `${buildOpenTimelineIoEnvVars(runId)} npm run activation:opentimelineio-validation -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: openTimelineIoDoesNotDo,
      warnings: ['Execution creates private metadata/QA artifacts only; no media processing, Docker, Cloud Run, or final delivery.'],
    },
  ] as const
}
