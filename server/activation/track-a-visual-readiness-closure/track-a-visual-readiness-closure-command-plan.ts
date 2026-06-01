import { trackAVisualReadinessConfig } from './track-a-visual-readiness-closure-policy'
import type { TrackAVisualReadinessCommandPlan } from './track-a-visual-readiness-closure-types'

export const trackAVisualReadinessDoesNotDo = [
  'process new media',
  'create render/export',
  'create final delivery',
  'run Docker',
  'run Cloud Run',
  'call providers',
  'use Revideo',
  'use Track B tools',
  'create public URLs',
  'enable production, beta, paid production, or broad real media',
] as const

export function buildTrackAVisualReadinessShellEnv(runId = 'phase45f-YYYYMMDDTHHMMSS'): string {
  return [
    `GCP_PROJECT_ID=${trackAVisualReadinessConfig.projectId}`,
    `GCP_REGION=${trackAVisualReadinessConfig.region}`,
    `REEDITPRO_ENV=${trackAVisualReadinessConfig.env}`,
    'REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE=true',
    `REEDITPRO_TRACK_A_VISUAL_READINESS_RUNTIME_MODE=${trackAVisualReadinessConfig.runtimeMode}`,
    `REEDITPRO_PHASE45F_RUN_ID=${runId}`,
    `REEDITPRO_PHASE45F_PHASE45E_MANIFEST_GCS_URI=${trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri}`,
    `REEDITPRO_PHASE45F_PHASE45E_REPORT_GCS_URI=${trackAVisualReadinessConfig.approvedPhase45EReportGcsUri}`,
    `REEDITPRO_PHASE45F_PRIVATE_REVIEW_EXPORT_GCS_URI=${trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri}`,
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

export function buildTrackAVisualReadinessClosureCommandPlans(input: { runId?: string } = {}): TrackAVisualReadinessCommandPlan[] {
  const runId = input.runId ?? 'phase45f-YYYYMMDDTHHMMSS'
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        `gcloud storage objects describe ${trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri}`,
        `gcloud storage objects describe ${trackAVisualReadinessConfig.approvedPhase45EReportGcsUri}`,
        `gcloud storage objects describe ${trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri}`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: [],
    },
    {
      commandId: 'execute-readiness-closure',
      phase: 'execute',
      commandString: `${buildTrackAVisualReadinessShellEnv(runId)} npm run activation:track-a-visual-readiness-closure -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [
        'Execution uploads private JSON evidence/QA artifacts only.',
        `Does not do: ${trackAVisualReadinessDoesNotDo.join(', ')}.`,
      ],
    },
  ]
}
