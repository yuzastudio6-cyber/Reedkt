import type { TrackIntegrationAuditConfig, TrackIntegrationAuditGateId } from './track-integration-audit-types'

export const trackIntegrationAuditConfig: TrackIntegrationAuditConfig = {
  phase: '47A',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'track_integration_audit',
  trackAClosureRunId: 'phase45f-20260601T01103',
  trackAEvidenceManifestGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45f/phase45f-20260601T01103/evidence/evidence-chain.json',
  trackAReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45f/phase45f-20260601T01103/reports/phase45f-report.json',
  trackBCanonicalBranch: 'codex/rp-activation-39c-generated-vlm-runtime-verification',
  trackBVlmRunId: 'phase39c-20260531T214216',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-track-integration/phase47a',
}

export const trackIntegrationAuditGateIds: TrackIntegrationAuditGateId[] = [
  'track_a_evidence_valid',
  'track_b_evidence_valid_or_blocked_with_reason',
  'ownership_boundaries_clear',
  'tool_registry_consistent',
  'package_scripts_consistent',
  'docs_consistent',
  'readiness_state_consistent',
  'no_stale_contradictory_status',
  'no_public_access',
  'production_beta_gates_blocked',
  'integration_readiness_decision',
]

export const trackIntegrationAuditRequiredScripts = [
  'smoke:activation-track-integration-audit',
  'activation:track-integration-audit',
  'activation:track-integration-audit:report',
  'activation:track-integration-audit:iam-plan',
  'activation:track-a-visual-readiness-closure:report',
  'activation:audio-system-readiness:report',
  'activation:audio-stack-demucs:report',
  'activation:deepfilternet-feature-e2e:report',
  'activation:ocr-caption-render-qa:report',
  'activation:ocr-runtime:report',
  'activation:ocr-model-download:report',
  'activation:vlm-runtime:report',
  'activation:vlm-runtime:cost-summary',
  'activation:vlm-model-download:report',
  'activation:vlm-model-approval:report',
  'prod:readiness:summary',
  'prod:beta:summary',
] as const

export const trackIntegrationAuditRequiredDocs = [
  'docs/activation-track-integration-audit-runbook.md',
  'docs/activation-track-integration-audit-policy.md',
  'docs/activation-track-integration-audit-qa-policy.md',
  'docs/activation-phase-47a-track-integration-audit-results.md',
  'docs/activation-readiness-state.md',
  'docs/activation-phase-roadmap.md',
  'docs/activation-next-phase-runbook.md',
] as const

export const trackIntegrationAuditBlockedScopes = [
  'media processing',
  'provider calls',
  'Docker build or push',
  'Cloud Run deploy or execute',
  'public URLs',
  'production',
  'external beta',
  'paid production',
  'broad real media',
  'final delivery',
  'Revideo execution',
]

export function makeTrackIntegrationAuditRunId(): string {
  return `phase47a-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function trackIntegrationAuditArtifactPrefix(runId: string): string {
  if (!/^phase47a-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 47A run id: ${runId}`)
  return `${trackIntegrationAuditConfig.reportObjectPrefix}/${runId}`
}

export function validateTrackIntegrationAuditExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  providerExecutionEnabled?: string
  revideoEnabled?: string
  publicAccessEnabled?: string
  finalDeliveryEnabled?: string
  mediaProcessingEnabled?: string
  dockerExecutionEnabled?: string
  cloudRunExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_TRACK_INTEGRATION_AUDIT_MODE ?? trackIntegrationAuditConfig.runtimeMode

  if (projectId !== trackIntegrationAuditConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== trackIntegrationAuditConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== trackIntegrationAuditConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== trackIntegrationAuditConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true is required for execution.')
  if (runtimeMode !== trackIntegrationAuditConfig.runtimeMode) blockers.push('Runtime mode must be exactly track_integration_audit.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.mediaProcessingEnabled ?? process.env.MEDIA_PROCESSING_ENABLED ?? 'false') !== 'false') blockers.push('Media processing must remain disabled.')
  if ((input.dockerExecutionEnabled ?? process.env.DOCKER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Docker execution must remain disabled.')
  if ((input.cloudRunExecutionEnabled ?? process.env.CLOUD_RUN_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Cloud Run execution must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 47A is an integration audit/readiness reconciliation phase only.')
  warnings.push('Passing Phase 47A does not approve product beta, production, public delivery, provider execution, Docker, Cloud Run, or media processing.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
