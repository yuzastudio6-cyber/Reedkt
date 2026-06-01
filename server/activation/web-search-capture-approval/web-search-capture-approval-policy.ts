import type { WebSearchCaptureApprovalConfig, WebSearchCaptureQaGateId } from './web-search-capture-approval-types'

export const webSearchCaptureApprovalConfig: WebSearchCaptureApprovalConfig = {
  phase: '49A',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  runtimeMode: 'web_search_capture_approval_static',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search-capture/phase49a',
}

export const webSearchCaptureQaGateIds: WebSearchCaptureQaGateId[] = [
  'tool_evidence',
  'license_review',
  'free_open_source_default',
  'paid_provider_disabled',
  'frontend_secret_safety',
  'no_live_search',
  'no_browser_execution',
  'no_public_artifacts',
  'risk_register_complete',
  'future_scope_defined',
  'package_scripts_present',
  'blocked_features',
]

export const webSearchCaptureRequiredScripts = [
  'activation:web-search-capture-approval:plan',
  'activation:web-search-capture-approval:report',
  'activation:web-search-tool:summary',
  'smoke:activation-web-search-capture-approval-workflow',
] as const

export const webSearchCaptureRequiredDocs = [
  'docs/activation-web-search-capture-approval-runbook.md',
  'docs/activation-web-search-capture-approval-policy.md',
  'docs/activation-web-search-capture-approval-artifact-policy.md',
  'docs/activation-web-search-capture-approval-qa-policy.md',
  'docs/activation-phase-49a-web-search-capture-approval-results.md',
  'docs/activation-phase-roadmap.md',
  'docs/activation-next-phase-runbook.md',
  'docs/activation-readiness-state.md',
] as const

export const webSearchCaptureBlockedScopes = [
  'live web search',
  'public crawling',
  'public scraping',
  'browser capture',
  'screenshot capture',
  'Readability extraction runtime',
  'SearXNG runtime',
  'Playwright public-internet launch',
  'Sharp screenshot processing runtime',
  'paid provider calls',
  'API keys or provider secrets',
  'CAPTCHA bypass',
  'login bypass',
  'paywall bypass',
  'robots or terms bypass',
  'Docker build or push',
  'GCP mutation',
  'Cloud Run deploy or execution',
  'public artifacts',
  'signed URLs as source of truth',
  'production',
  'external beta',
  'paid production',
  'broad real media',
  'providers',
  'Revideo',
]

export function validateWebSearchCaptureApprovalStaticEnv(input: {
  projectId?: string
  region?: string
  env?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  revideoEnabled?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID ?? webSearchCaptureApprovalConfig.projectId
  const region = input.region ?? process.env.GCP_REGION ?? webSearchCaptureApprovalConfig.region
  const env = input.env ?? process.env.REEDITPRO_ENV ?? webSearchCaptureApprovalConfig.env
  if (projectId !== webSearchCaptureApprovalConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro for future Phase 49 execution phases.')
  if (region !== webSearchCaptureApprovalConfig.region) blockers.push('GCP_REGION must be exactly us-central1 for future Phase 49 execution phases.')
  if (env !== webSearchCaptureApprovalConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging for future Phase 49 execution phases.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  if ((input.providerExecutionEnabled ?? process.env.PROVIDER_EXECUTION_ENABLED ?? 'false') !== 'false') blockers.push('Provider execution must remain disabled.')
  if ((input.publicAccessEnabled ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public access must remain disabled.')
  if ((input.revideoEnabled ?? process.env.REVIDEO_ENABLED ?? 'false') !== 'false') blockers.push('Revideo must remain disabled.')
  warnings.push('Phase 49A is static/report-only and does not require execution confirmation.')
  warnings.push('Future execution phases must use approved plan snapshots, private artifacts, and server/worker boundaries.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
