import type { TrackAVisualReadinessConfig, TrackAVisualReadinessGateId } from './track-a-visual-readiness-closure-types'

export const trackAVisualReadinessConfig: TrackAVisualReadinessConfig = {
  phase: '45F',
  track: 'A visual/video',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'track_a_visual_readiness_closure',
  approvedPhase45ERunId: 'phase45e-20260531T23580',
  approvedPhase45EManifestGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json',
  approvedPhase45EReportGcsUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45e/phase45e-20260531T23580/reports/phase45e-report.json',
  canonicalPrivateReviewExportGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports',
  previewsBucket: 'reeditpro-staging-reeditpro-previews',
  masksBucket: 'reeditpro-staging-reeditpro-masks',
  reportObjectPrefix: 'activation-render-hardening/phase45f',
}

export const trackAVisualReadinessGateIds: TrackAVisualReadinessGateId[] = [
  'track_a_evidence_chain',
  'tool_scope_integrity',
  'report_consistency',
  'artifact_privacy',
  'private_e2e_review_integrity',
  'scripts_validation',
  'docs_consistency',
  'blocked_features',
  'no_public_access',
  'no_final_delivery',
]

export const trackAVisualReadinessRequiredScripts = [
  'smoke:activation-track-a-visual-readiness-closure',
  'activation:track-a-visual-readiness-closure',
  'activation:track-a-visual-readiness-closure:report',
  'activation:track-a-visual-readiness-closure:iam-plan',
  'activation:full-visual-video-private-e2e:report',
  'activation:final-render-hardening:report',
  'activation:opentimelineio-validation:report',
  'activation:remotion-render-validation:report',
  'activation:libass-burnin-validation:report',
  'activation:pro-color-image-feature-e2e:report',
  'activation:film-feature-e2e:report',
  'activation:sam2-feature-e2e:report',
  'activation:real-esrgan-policy-decision:report',
  'prod:readiness:summary',
  'prod:beta:summary',
] as const

export const trackAVisualReadinessRequiredDocs = [
  'docs/activation-track-a-visual-readiness-closure-runbook.md',
  'docs/activation-track-a-visual-readiness-closure-policy.md',
  'docs/activation-track-a-visual-readiness-closure-artifact-policy.md',
  'docs/activation-track-a-visual-readiness-closure-qa-policy.md',
  'docs/activation-phase-45f-track-a-visual-video-readiness-closure-results.md',
] as const

export const trackAVisualReadinessRemainingBlockedScopes = [
  'user final delivery',
  'production',
  'external beta',
  'paid production',
  'broad real media',
  'public delivery',
  'providers',
  'Revideo',
  'Track B tools',
  'arbitrary media',
  'full-video enhancement/interpolation/masks without later approval',
]

export function makeTrackAVisualReadinessRunId(): string {
  return `phase45f-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function trackAVisualReadinessArtifactPrefix(runId: string): string {
  if (!/^phase45f-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 45F run id: ${runId}`)
  return `${trackAVisualReadinessConfig.reportObjectPrefix}/${runId}`
}

export function validateTrackAVisualReadinessExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  providerExecutionEnabled?: string
  revideoEnabled?: string
  trackBEnabled?: string
  publicAccessEnabled?: string
  finalDeliveryEnabled?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_TRACK_A_VISUAL_READINESS_RUNTIME_MODE ?? trackAVisualReadinessConfig.runtimeMode

  if (projectId !== trackAVisualReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== trackAVisualReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== trackAVisualReadinessConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== trackAVisualReadinessConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE=true is required for execution.')
  if (runtimeMode !== trackAVisualReadinessConfig.runtimeMode) blockers.push('Runtime mode must be exactly track_a_visual_readiness_closure.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.trackBEnabled ?? process.env.TRACK_B_TOOLS_ENABLED ?? 'false') !== 'false') blockers.push('Track B tools must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 45F is an evidence-audit/readiness-closure phase only.')
  warnings.push('Passing Phase 45F does not approve final delivery, production, external beta, paid production, providers, Revideo, Track B, or broad media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
