import type {
  WebSearchRegressionConfig,
  WebSearchRegressionEnvValidation,
  WebSearchRegressionQaGateId,
  WebSearchRegressionSafetyFlags,
  WebSearchRegressionScenarioId,
} from './web-search-regression-types'

export const webSearchRegressionConfig: WebSearchRegressionConfig = {
  phase: '49O',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'web_search_regression_failure_suite',
  canonicalPhase49NRunId: 'phase49n-20260603T18331',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49o',
}

export const webSearchRegressionSafetyFlags: WebSearchRegressionSafetyFlags = {
  liveSearchAllowed: false,
  braveApiCallAllowed: false,
  publicSearxngInstanceAllowed: false,
  otherPaidProvidersAllowed: false,
  browserLaunchAllowed: false,
  publicBrowserCaptureAllowed: false,
  readabilityLiveExtractionAllowed: false,
  broadCrawlingAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  secretValueAccessAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const webSearchRegressionRequiredScenarioIds: WebSearchRegressionScenarioId[] = [
  'searxng_default_provider_scope',
  'hybrid_consensus_evidence_present',
  'paid_provider_tavily_rejected',
  'paid_provider_exa_rejected',
  'paid_provider_firecrawl_rejected',
  'hosted_browser_provider_rejected',
  'brave_missing_secret_disables_provider',
  'brave_budget_zero_blocks_execution',
  'brave_raw_storage_rejected',
  'brave_snippet_storage_rejected',
  'public_searxng_instance_rejected',
  'private_searxng_required',
  'arbitrary_url_capture_rejected',
  'non_allowlisted_capture_domain_rejected',
  'unsafe_url_scheme_rejected',
  'redirect_to_non_allowlisted_domain_rejected',
  'playwright_timeout_records_failure',
  'playwright_no_login_captcha_bypass',
  'sharp_invalid_image_failure',
  'readability_empty_article_failure',
  'public_artifact_request_rejected',
  'signed_url_source_of_truth_rejected',
  'production_ready_flag_rejected',
  'external_beta_flag_rejected',
  'internal_api_rejects_blocked_provider',
  'internal_api_rejects_arbitrary_capture',
]

export const webSearchRegressionQaGateIds: WebSearchRegressionQaGateId[] = [
  'phase49n_evidence',
  'provider_failure_modes',
  'capture_failure_modes',
  'browser_processing_failure_modes',
  'artifact_privacy_failures',
  'api_ui_gating_regression',
  'production_beta_blocking',
  'fail_closed_integrity',
  'artifact_privacy',
]

export const webSearchRegressionRequiredScripts = [
  'activation:web-search-regression-suite',
  'activation:web-search-regression-suite:report',
  'activation:web-search-regression-suite:iam-plan',
  'smoke:activation-web-search-regression-suite',
] as const

export const webSearchRegressionRequiredDocs = [
  'docs/activation-web-search-regression-suite-runbook.md',
  'docs/activation-web-search-regression-suite-policy.md',
  'docs/activation-web-search-regression-suite-artifact-policy.md',
  'docs/activation-web-search-regression-suite-qa-policy.md',
  'docs/activation-phase-49o-web-search-regression-suite-results.md',
] as const

export function makeWebSearchRegressionRunId(): string {
  return `phase49o-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function webSearchRegressionArtifactPrefix(runId: string): string {
  if (!/^phase49o-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49O run id: ${runId}`)
  return `${webSearchRegressionConfig.artifactPrefixBase}/${runId}`
}

export function validateWebSearchRegressionExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
} = {}): WebSearchRegressionEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_WEB_SEARCH_REGRESSION_FAILURE_SUITE

  if (projectId !== webSearchRegressionConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== webSearchRegressionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== webSearchRegressionConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== webSearchRegressionConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_WEB_SEARCH_REGRESSION_FAILURE_SUITE=true is required for Phase 49O execution.')

  const falseFlags: Record<string, string | undefined> = {
    PUBLIC_SEARXNG_INSTANCE_ALLOWED: process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED,
    ARBITRARY_URL_CAPTURE_ALLOWED: process.env.ARBITRARY_URL_CAPTURE_ALLOWED,
    BROAD_CRAWLING_ALLOWED: process.env.BROAD_CRAWLING_ALLOWED,
    PUBLIC_ARTIFACT_ALLOWED: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED,
    BRAVE_SEARCH_STORE_RAW_RESULTS: process.env.BRAVE_SEARCH_STORE_RAW_RESULTS,
    BRAVE_SEARCH_STORE_SNIPPETS: process.env.BRAVE_SEARCH_STORE_SNIPPETS,
    REEDITPRO_PRODUCTION_READY: process.env.REEDITPRO_PRODUCTION_READY,
    REEDITPRO_EXTERNAL_BETA_READY: process.env.REEDITPRO_EXTERNAL_BETA_READY,
    REEDITPRO_PAID_PRODUCTION_READY: process.env.REEDITPRO_PAID_PRODUCTION_READY,
    REEDITPRO_BROAD_REAL_MEDIA_READY: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY,
  }
  for (const [name, value] of Object.entries(falseFlags)) {
    if (value === 'true') blockers.push(`${name} must remain false or unset for Phase 49O.`)
  }

  warnings.push('Phase 49O is deterministic regression only; it must not issue live search, Brave API, browser capture, Sharp, or Readability work.')
  return { ok: blockers.length === 0, blockers, warnings }
}
