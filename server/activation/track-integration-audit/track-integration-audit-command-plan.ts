import type { TrackIntegrationAuditCommandPlan } from './track-integration-audit-types'

export function buildTrackIntegrationAuditCommandPlans(): TrackIntegrationAuditCommandPlan[] {
  return [
    {
      commandId: 'phase47a-preflight-report-only',
      phase: 'preflight',
      commandString: [
        'npm run smoke:activation-track-integration-audit',
        'npm run activation:track-integration-audit:report',
        'npm run activation:track-integration-audit:iam-plan',
        'npm run activation:track-a-visual-readiness-closure:report',
        'npm run prod:readiness:summary',
        'npm run prod:beta:summary',
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Report mode is static and non-mutating.'],
    },
    {
      commandId: 'phase47a-execute-json-audit',
      phase: 'execute',
      commandString: [
        'GCP_PROJECT_ID=reeditpro',
        'GCP_REGION=us-central1',
        'REEDITPRO_ENV=staging',
        'REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true',
        'PROVIDER_EXECUTION_ENABLED=false',
        'REVIDEO_ENABLED=false',
        'PUBLIC_ACCESS_ENABLED=false',
        'FINAL_DELIVERY_ENABLED=false',
        'MEDIA_PROCESSING_ENABLED=false',
        'DOCKER_EXECUTION_ENABLED=false',
        'CLOUD_RUN_EXECUTION_ENABLED=false',
        'REEDITPRO_PRODUCTION_READY=false',
        'REEDITPRO_EXTERNAL_BETA_READY=false',
        'REEDITPRO_PAID_PRODUCTION_READY=false',
        'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
        'npm run activation:track-integration-audit -- --execute',
      ].join(' '),
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: [
        'Uploads private JSON audit artifacts only.',
        'Does not run media processing, Docker, Cloud Run, providers, Revideo, or Track B model/runtime execution.',
      ],
    },
    {
      commandId: 'phase47a-post-validation',
      phase: 'validation',
      commandString: [
        'npm run activation:track-integration-audit:report',
        'npm run smoke:activation-track-integration-audit',
        'npm run prod:readiness:summary',
        'npm run prod:beta:summary',
        'npm run lint',
        'npm run build',
        'npm run build:server',
        'git diff --check',
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Build/lint validation only; no execution mutation.'],
    },
  ]
}
