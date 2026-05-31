import { finalRenderHardeningConfig, finalRenderHardeningDoesNotDo } from './final-render-hardening-policy'

export function buildFinalRenderHardeningEnvVars(runId = 'phase45d-YYYYMMDDTHHMMSS', imageRef = 'IMAGE_REF', imageDigest = 'sha256:IMAGE_DIGEST'): string {
  return [
    `GCP_PROJECT_ID=${finalRenderHardeningConfig.projectId}`,
    `GCP_REGION=${finalRenderHardeningConfig.region}`,
    `REEDITPRO_ENV=${finalRenderHardeningConfig.env}`,
    'REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true',
    `REEDITPRO_FINAL_RENDER_HARDENING_RUNTIME_MODE=${finalRenderHardeningConfig.runtimeMode}`,
    `REEDITPRO_PHASE45D_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45D_INPUT_VIDEO_GCS_URI=${finalRenderHardeningConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45A_RUN_ID=${finalRenderHardeningConfig.approvedPhase45ARunId}`,
    `REEDITPRO_PHASE45D_PHASE45A_PREVIEW_GCS_URI=${finalRenderHardeningConfig.approvedPhase45APreviewGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45A_REPORT_GCS_URI=${finalRenderHardeningConfig.approvedPhase45AReportGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45B_RUN_ID=${finalRenderHardeningConfig.approvedPhase45BRunId}`,
    `REEDITPRO_PHASE45D_PHASE45B_PREVIEW_GCS_URI=${finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45B_REPORT_GCS_URI=${finalRenderHardeningConfig.approvedPhase45BReportGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45C_RUN_ID=${finalRenderHardeningConfig.approvedPhase45CRunId}`,
    `REEDITPRO_PHASE45D_PHASE45C_OTIO_GCS_URI=${finalRenderHardeningConfig.approvedPhase45COtioGcsUri}`,
    `REEDITPRO_PHASE45D_PHASE45C_REPORT_GCS_URI=${finalRenderHardeningConfig.approvedPhase45CReportGcsUri}`,
    `REEDITPRO_PHASE45D_FINAL_EXPORTS_BUCKET=${finalRenderHardeningConfig.finalExportsBucket}`,
    `REEDITPRO_PHASE45D_QA_BUCKET=${finalRenderHardeningConfig.qaBucket}`,
    `REEDITPRO_PHASE45D_ARTIFACT_PREFIX=${finalRenderHardeningConfig.reportObjectPrefix}/${runId}`,
    `REEDITPRO_PHASE45D_EXPORT_DURATION_SECONDS=${finalRenderHardeningConfig.exportDurationSeconds}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${imageDigest}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'TRACK_B_TOOLS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_PAID_PRODUCTION_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].join(',')
}

export function buildFinalRenderHardeningShellEnv(runId = 'phase45d-YYYYMMDDTHHMMSS'): string {
  return buildFinalRenderHardeningEnvVars(runId)
    .split(',')
    .filter((part) => !part.startsWith('REEDITPRO_IMAGE_REF=') && !part.startsWith('REEDITPRO_IMAGE_DIGEST='))
    .join(' ')
}

export function buildFinalRenderHardeningCommandPlans(input: { runId?: string } = {}) {
  const runId = input.runId ?? 'phase45d-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4 && gcloud storage objects describe gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: finalRenderHardeningDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'build-deploy-execute',
      phase: 'execute',
      commandString: `${buildFinalRenderHardeningShellEnv(runId)} npm run activation:final-render-hardening -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: finalRenderHardeningDoesNotDo,
      warnings: ['Execution creates one private hardened review export only; no public final delivery is created.'],
    },
  ] as const
}
