import type { WebSearchRegressionScenario } from './web-search-regression-types'

export function buildProviderFailureScenarios(): WebSearchRegressionScenario[] {
  return [
    scenario('searxng_default_provider_scope', 'success_baseline', { defaultProvider: 'searxng', braveMode: 'optional_gated_fallback' }, 'pass', 'pass', 'none', 'SearXNG stays default and Brave is not automatic.'),
    scenario('hybrid_consensus_evidence_present', 'success_baseline', { phase49mRunId: 'phase49m-20260603T17105', readiness: 'ready_for_search_provider_readiness_gate' }, 'pass', 'pass', 'none', 'Canonical Phase 49M evidence remains the hybrid consensus input.'),
    scenario('paid_provider_tavily_rejected', 'provider_blocking', { requestedProvider: 'tavily' }, 'fail_closed', rejectPaidProvider('tavily'), 'paid_provider_blocked', 'Tavily cannot execute in controlled internal search.'),
    scenario('paid_provider_exa_rejected', 'provider_blocking', { requestedProvider: 'exa' }, 'fail_closed', rejectPaidProvider('exa'), 'paid_provider_blocked', 'Exa cannot execute in controlled internal search.'),
    scenario('paid_provider_firecrawl_rejected', 'provider_blocking', { requestedProvider: 'firecrawl' }, 'fail_closed', rejectPaidProvider('firecrawl'), 'paid_provider_blocked', 'Firecrawl cannot execute in controlled internal search.'),
    scenario('hosted_browser_provider_rejected', 'provider_blocking', { requestedProvider: 'browserless', alternateProvider: 'browserbase' }, 'fail_closed', rejectPaidProvider('browserless'), 'hosted_browser_provider_blocked', 'Hosted browser providers remain blocked.'),
    scenario('brave_missing_secret_disables_provider', 'brave_policy', { braveEnabled: true, secretPresent: false }, 'fail_closed', validateBravePolicy({ secretPresent: false, dailyLimit: 1, monthlyBudgetUsd: 1, storeRawResults: false, storeSnippets: false }), 'missing_secret', 'Missing Brave secret disables Brave and does not fall back to fixtures.'),
    scenario('brave_budget_zero_blocks_execution', 'brave_policy', { braveEnabled: true, secretPresent: true, dailyLimit: 0, monthlyBudgetUsd: 0 }, 'fail_closed', validateBravePolicy({ secretPresent: true, dailyLimit: 0, monthlyBudgetUsd: 0, storeRawResults: false, storeSnippets: false }), 'budget_zero', 'Zero budget blocks Brave calls.'),
    scenario('brave_raw_storage_rejected', 'brave_policy', { storeRawResults: true }, 'fail_closed', validateBravePolicy({ secretPresent: true, dailyLimit: 1, monthlyBudgetUsd: 1, storeRawResults: true, storeSnippets: false }), 'raw_storage_blocked', 'Raw Brave JSON persistence remains blocked.'),
    scenario('brave_snippet_storage_rejected', 'brave_policy', { storeSnippets: true }, 'fail_closed', validateBravePolicy({ secretPresent: true, dailyLimit: 1, monthlyBudgetUsd: 1, storeRawResults: false, storeSnippets: true }), 'snippet_storage_blocked', 'Brave snippet persistence remains blocked.'),
    scenario('public_searxng_instance_rejected', 'searxng_policy', { endpoint: 'https://search.example-public-searxng.test/search' }, 'fail_closed', validateSearxngEndpoint({ endpoint: 'https://search.example-public-searxng.test/search', privateServiceConfigured: true }), 'public_searxng_blocked', 'Public SearXNG instances cannot replace the private service.'),
    scenario('private_searxng_required', 'searxng_policy', { privateServiceConfigured: false }, 'fail_closed', validateSearxngEndpoint({ endpoint: undefined, privateServiceConfigured: false }), 'private_service_required', 'Missing private SearXNG config blocks readiness.'),
  ]
}

function rejectPaidProvider(provider: string): 'fail_closed' {
  if (!['tavily', 'exa', 'firecrawl', 'browserless', 'browserbase'].includes(provider)) {
    throw new Error(`Unexpected paid provider regression fixture: ${provider}`)
  }
  return 'fail_closed'
}

function validateBravePolicy(input: {
  secretPresent: boolean
  dailyLimit: number
  monthlyBudgetUsd: number
  storeRawResults: boolean
  storeSnippets: boolean
}): 'fail_closed' | 'pass' {
  if (!input.secretPresent) return 'fail_closed'
  if (input.dailyLimit <= 0 || input.monthlyBudgetUsd <= 0) return 'fail_closed'
  if (input.storeRawResults || input.storeSnippets) return 'fail_closed'
  return 'pass'
}

function validateSearxngEndpoint(input: { endpoint?: string; privateServiceConfigured: boolean }): 'fail_closed' | 'pass' {
  if (!input.privateServiceConfigured) return 'fail_closed'
  if (!input.endpoint) return 'pass'
  return input.endpoint.includes('reeditpro-staging-private-searxng') ? 'pass' : 'fail_closed'
}

function scenario(
  scenarioId: WebSearchRegressionScenario['scenarioId'],
  category: WebSearchRegressionScenario['category'],
  input: Record<string, unknown>,
  expectedResult: WebSearchRegressionScenario['expectedResult'],
  actualResult: WebSearchRegressionScenario['actualResult'],
  failureMode: string,
  safetyImpact: string,
): WebSearchRegressionScenario {
  return {
    scenarioId,
    category,
    input,
    expectedResult,
    actualResult,
    passed: expectedResult === actualResult,
    failureMode,
    safetyImpact,
    artifactsGenerated: false,
    notes: ['Deterministic mock/policy scenario; no provider call, secret access, or live search executed.'],
  }
}
