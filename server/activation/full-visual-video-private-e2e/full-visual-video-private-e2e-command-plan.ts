import { fullVisualVideoPrivateE2eConfig, fullVisualVideoPrivateE2eDoesNotDo } from './full-visual-video-private-e2e-policy'
import type { FullVisualVideoPrivateE2eCommandPlan } from './full-visual-video-private-e2e-types'

export function buildFullVisualVideoPrivateE2eShellEnv(runId = 'phase45e-YYYYMMDDTHHMMSS'): string {
  return [
    `GCP_PROJECT_ID=${fullVisualVideoPrivateE2eConfig.projectId}`,
    `GCP_REGION=${fullVisualVideoPrivateE2eConfig.region}`,
    `REEDITPRO_ENV=${fullVisualVideoPrivateE2eConfig.env}`,
    'REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E=true',
    `REEDITPRO_FULL_VISUAL_VIDEO_PRIVATE_E2E_RUNTIME_MODE=${fullVisualVideoPrivateE2eConfig.runtimeMode}`,
    `REEDITPRO_PHASE45E_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45E_INPUT_VIDEO_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45A_PREVIEW_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45APreviewGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45A_REPORT_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45AReportGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45B_PREVIEW_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45BPreviewGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45B_REPORT_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45BReportGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45C_OTIO_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45COtioGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45C_REPORT_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45CReportGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45D_REVIEW_EXPORT_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45DReviewExportGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45D_FFPROBE_VALIDATION_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45DFfprobeValidationGcsUri}`,
    `REEDITPRO_PHASE45E_PHASE45D_REPORT_GCS_URI=${fullVisualVideoPrivateE2eConfig.approvedPhase45DReportGcsUri}`,
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

export function buildFullVisualVideoPrivateE2eCommandPlans(input: { runId?: string } = {}): FullVisualVideoPrivateE2eCommandPlan[] {
  const runId = input.runId ?? 'phase45e-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud projects describe reeditpro && gcloud storage objects describe gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4 && ffprobe -version',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: fullVisualVideoPrivateE2eDoesNotDo,
      warnings: [],
    },
    {
      commandId: 'execute-private-e2e',
      phase: 'execute',
      commandString: `${buildFullVisualVideoPrivateE2eShellEnv(runId)} npm run activation:full-visual-video-private-e2e -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: fullVisualVideoPrivateE2eDoesNotDo,
      warnings: ['Execution creates private JSON evidence artifacts only; it does not create a new final delivery export.'],
    },
  ]
}
