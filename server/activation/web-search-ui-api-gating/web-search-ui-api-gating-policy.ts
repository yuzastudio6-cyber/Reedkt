import type {
  WebSearchUiApiEnvValidation,
  WebSearchUiApiGatingConfig,
  WebSearchUiApiGatingSafetyFlags,
  WebSearchUiApiQaGateId,
} from './web-search-ui-api-gating-types'

export const webSearchUiApiGatingConfig: WebSearchUiApiGatingConfig = {
  phase: '49I',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'web_search_capture_ui_api_gating',
  serviceName: 'reeditpro-staging-private-searxng',
  canonicalPhase49HRunId: 'phase49h-20260603T020009',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49i',
}

export const webSearchUiApiGatingSafetyFlags: WebSearchUiApiGatingSafetyFlags = {
  internalApiRoutesAllowed: true,
  internalUxGateAllowed: true,
  privateFixtureProviderModeAllowed: true,
  liveSearchAllowed: false,
  browserCaptureAllowed: false,
  readabilityExtractionAllowed: false,
  screenshotProcessingAllowed: false,
  paidProviderAllowed: false,
  publicSearxngInstanceAllowed: false,
  providerFallbackAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  broadCrawlingAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  frontendSecretsAllowed: false,
  frontendHeavyExecutionAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const webSearchUiApiQaGateIds: WebSearchUiApiQaGateId[] = [
  'phase49h_evidence',
  'api_route_gating',
  'request_validation',
  'provider_gate_integrity',
  'ui_scope_integrity',
  'frontend_secret_safety',
  'no_live_search_or_capture',
  'artifact_privacy',
  'docs_scripts_consistency',
  'blocked_features',
]

export const webSearchUiApiRequiredScripts = [
  'activation:web-search-ui-api-gating',
  'activation:web-search-ui-api-gating:report',
  'activation:web-search-ui-api-gating:iam-plan',
  'smoke:activation-web-search-ui-api-gating',
] as const

const falseFlagEnvVars = [
  'REEDITPRO_PAID_PROVIDER_ALLOWED',
  'REEDITPRO_PUBLIC_SEARXNG_INSTANCE_ALLOWED',
  'REEDITPRO_ARBITRARY_URL_CAPTURE_ALLOWED',
  'REEDITPRO_BROAD_CRAWLING_ALLOWED',
  'REEDITPRO_PUBLIC_ARTIFACT_ALLOWED',
  'REEDITPRO_SIGNED_URL_SOURCE_OF_TRUTH_ALLOWED',
  'REEDITPRO_FRONTEND_HEAVY_EXECUTION_ALLOWED',
  'REEDITPRO_PRODUCTION_READY',
  'REEDITPRO_EXTERNAL_BETA_READY',
  'REEDITPRO_PAID_PRODUCTION_READY',
  'REEDITPRO_BROAD_REAL_MEDIA_READY',
] as const

export function makeWebSearchUiApiGatingRunId(date = new Date()): string {
  const compact = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
  return `phase49i-${compact}`
}

export function validateWebSearchUiApiGatingExecutionEnv(env: Record<string, string | undefined> = process.env): WebSearchUiApiEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  if (env.GCP_PROJECT_ID !== webSearchUiApiGatingConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (env.GCP_REGION !== webSearchUiApiGatingConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (env.REEDITPRO_ENV !== webSearchUiApiGatingConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (env.REEDITPRO_CONFIRM_WEB_SEARCH_UI_API_GATING !== 'true') blockers.push('REEDITPRO_CONFIRM_WEB_SEARCH_UI_API_GATING=true is required for Phase 49I execution.')
  for (const flag of falseFlagEnvVars) {
    if (env[flag] === 'true') blockers.push(`${flag} must remain false or unset for Phase 49I.`)
  }
  if (env.REEDITPRO_SEARXNG_PRIVATE_ENDPOINT) {
    warnings.push('REEDITPRO_SEARXNG_PRIVATE_ENDPOINT is present, but Phase 49I does not issue a live SearXNG query.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}

export function validateWebSearchUiApiStaticPolicy(): WebSearchUiApiEnvValidation {
  const flags = webSearchUiApiGatingSafetyFlags
  const blockers = [
    flags.liveSearchAllowed ? 'Phase 49I live search is enabled.' : '',
    flags.browserCaptureAllowed ? 'Phase 49I browser capture is enabled.' : '',
    flags.readabilityExtractionAllowed ? 'Phase 49I Readability extraction is enabled.' : '',
    flags.screenshotProcessingAllowed ? 'Phase 49I screenshot processing is enabled.' : '',
    flags.paidProviderAllowed ? 'Paid providers are enabled.' : '',
    flags.publicSearxngInstanceAllowed ? 'Public SearXNG instances are enabled.' : '',
    flags.providerFallbackAllowed ? 'Provider fallback is enabled.' : '',
    flags.arbitraryUrlCaptureAllowed ? 'Arbitrary URL capture is enabled.' : '',
    flags.broadCrawlingAllowed ? 'Broad crawling is enabled.' : '',
    flags.publicArtifactAllowed ? 'Public artifacts are enabled.' : '',
    flags.signedUrlSourceOfTruthAllowed ? 'Signed URLs are enabled as source of truth.' : '',
    flags.frontendSecretsAllowed ? 'Frontend provider secrets are enabled.' : '',
    flags.frontendHeavyExecutionAllowed ? 'Frontend heavy execution is enabled.' : '',
    flags.productionReadyAllowed ? 'Production readiness is enabled.' : '',
    flags.externalBetaAllowed ? 'External beta readiness is enabled.' : '',
    flags.paidProductionAllowed ? 'Paid production readiness is enabled.' : '',
    flags.broadMediaAllowed ? 'Broad media readiness is enabled.' : '',
  ].filter(Boolean)
  return { ok: blockers.length === 0, blockers, warnings: [] }
}
