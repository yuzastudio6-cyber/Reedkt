import type { VlmBlockerResolutionConfig, VlmBlockerResolutionGateId } from './vlm-blocker-resolution-types'

export const vlmBlockerResolutionConfig: VlmBlockerResolutionConfig = {
  phase: '47B',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'vlm_blocker_resolution_exclusion_gate',
  phase47aRunId: 'phase47a-20260601T02252',
  phase47aReportGcsUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47a/phase47a-20260601T02252/reports/phase47a-report.json',
  phase39cRunId: 'phase39c-20260531T214216',
  phase39cReportGcsUri:
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/phase_39c_generated_vlm_runtime_report.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-track-integration/phase47b',
}

export const vlmBlockerResolutionGateIds: VlmBlockerResolutionGateId[] = [
  'phase47a_evidence',
  'vlm_blocker_evidence',
  'decision_integrity',
  'runtime_resolution',
  'exclusion_integrity',
  'system_readiness_impact',
  'blocked_features',
]

export const vlmBlockerResolutionRequiredScripts = [
  'smoke:activation-vlm-blocker-resolution',
  'activation:vlm-blocker-resolution',
  'activation:vlm-blocker-resolution:report',
  'activation:vlm-blocker-resolution:iam-plan',
  'activation:track-integration-audit:report',
  'activation:track-a-visual-readiness-closure:report',
  'activation:vlm-runtime:report',
  'prod:readiness:summary',
  'prod:beta:summary',
] as const

export const vlmBlockerResolutionRequiredDocs = [
  'docs/activation-vlm-blocker-resolution-runbook.md',
  'docs/activation-vlm-blocker-resolution-policy.md',
  'docs/activation-vlm-blocker-resolution-qa-policy.md',
  'docs/activation-phase-47b-vlm-blocker-resolution-results.md',
  'docs/activation-readiness-state.md',
  'docs/activation-phase-roadmap.md',
  'docs/activation-next-phase-runbook.md',
] as const

export const vlmBlockerResolutionBlockedScopes = [
  'VLM included in initial internal testing',
  'VLM user-facing enablement',
  'VLM runtime execution',
  'new model downloads',
  'smaller or quantized model substitution without approval',
  'larger or different GPU class without approval',
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

export function makeVlmBlockerResolutionRunId(): string {
  return `phase47b-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function vlmBlockerResolutionArtifactPrefix(runId: string): string {
  if (!/^phase47b-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 47B run id: ${runId}`)
  return `${vlmBlockerResolutionConfig.reportObjectPrefix}/${runId}`
}

export function validateVlmBlockerResolutionExecutionEnv(input: {
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
  modelDownloadEnabled?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_VLM_BLOCKER_RESOLUTION
  const runtimeMode = input.runtimeMode ?? process.env.REEDITPRO_VLM_BLOCKER_RESOLUTION_MODE ?? vlmBlockerResolutionConfig.runtimeMode

  if (projectId !== vlmBlockerResolutionConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== vlmBlockerResolutionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== vlmBlockerResolutionConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== vlmBlockerResolutionConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_VLM_BLOCKER_RESOLUTION=true is required for execution.')
  if (runtimeMode !== vlmBlockerResolutionConfig.runtimeMode) blockers.push('Runtime mode must be exactly vlm_blocker_resolution_exclusion_gate.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.finalDeliveryEnabled ?? process.env.FINAL_DELIVERY_ENABLED ?? 'false') !== 'false') blockers.push('Final delivery must remain disabled.')
  if ((input.mediaProcessingEnabled ?? process.env.MEDIA_PROCESSING_ENABLED ?? 'false') !== 'false') blockers.push('Media processing must remain disabled.')
  if ((input.dockerExecutionEnabled ?? process.env.DOCKER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Docker execution must remain disabled.')
  if ((input.cloudRunExecutionEnabled ?? process.env.CLOUD_RUN_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Cloud Run execution must remain disabled.')
  if ((input.modelDownloadEnabled ?? process.env.MODEL_DOWNLOAD_ENABLED ?? 'false') !== 'false') blockers.push('Model download must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')

  warnings.push('Phase 47B is a VLM blocker resolution/exclusion gate only.')
  warnings.push('Phase 47B does not approve VLM runtime, model downloads, real media, beta, production, providers, Revideo, Docker, or Cloud Run.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
