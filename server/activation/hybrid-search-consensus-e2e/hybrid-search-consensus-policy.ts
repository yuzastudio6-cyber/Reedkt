import type { HybridSearchConfig, HybridSearchEnvValidation, HybridSearchQaGateId, HybridSearchSafetyFlags } from './hybrid-search-consensus-types'

export const hybridSearchConfig: HybridSearchConfig = {
  phase: '49M',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'searxng_brave_hybrid_consensus_e2e',
  defaultProvider: 'searxng',
  braveRole: 'optional_paid_confidence_booster',
  serviceName: 'reeditpro-staging-private-searxng',
  braveEndpoint: 'https://api.search.brave.com/res/v1/web/search',
  query: 'site:docs.searxng.org searxng search api',
  allowedDomains: ['docs.searxng.org', 'playwright.dev', 'sharp.pixelplumbing.com', 'github.com', 'developer.mozilla.org'],
  maxQueries: 1,
  maxSearxngResults: 5,
  maxBraveResults: 5,
  maxMergedSources: 8,
  maxCapturePages: 2,
  maxExtractionPages: 2,
  timeoutMs: 8000,
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49m',
  approvedPhase49LRunId: 'phase49l-20260603T15002',
  approvedPhase49LReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49l/phase49l-20260603T15002/reports/phase49l-report.json',
}

export const hybridSearchSafetyFlags: HybridSearchSafetyFlags = {
  searxngRequired: true,
  searxngDefaultProvider: true,
  braveAllowedInPhase49M: true,
  braveOptionalFallback: true,
  otherPaidProvidersAllowed: false,
  publicSearxngInstanceAllowed: false,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  requestHeadersStored: false,
  browserCaptureAllowed: true,
  readabilityExtractionAllowed: true,
  arbitraryUrlCaptureAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const hybridSearchQaGateIds: HybridSearchQaGateId[] = [
  'phase49l_evidence',
  'secret_safety',
  'searxng_default_integrity',
  'brave_confidence_booster',
  'storage_rights_enforcement',
  'result_normalization',
  'dedupe_consensus',
  'allowlisted_capture',
  'playwright_capture',
  'sharp_processing',
  'readability_extraction',
  'artifact_privacy',
  'blocked_features',
]

export const hybridSearchRequiredScripts = [
  'activation:hybrid-search-consensus-e2e',
  'activation:hybrid-search-consensus-e2e:report',
  'activation:hybrid-search-consensus-e2e:iam-plan',
  'smoke:activation-hybrid-search-consensus-e2e',
] as const

export const hybridSearchRequiredDocs = [
  'docs/activation-hybrid-search-consensus-e2e-runbook.md',
  'docs/activation-hybrid-search-consensus-e2e-policy.md',
  'docs/activation-hybrid-search-consensus-e2e-artifact-policy.md',
  'docs/activation-hybrid-search-consensus-e2e-qa-policy.md',
  'docs/activation-phase-49m-hybrid-search-consensus-e2e-results.md',
] as const

export function makeHybridSearchRunId(): string {
  return `phase49m-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function hybridSearchArtifactPrefix(runId: string): string {
  if (!/^phase49m-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49M run id: ${runId}`)
  return `${hybridSearchConfig.artifactPrefixBase}/${runId}`
}

export function validateHybridSearchConsensusE2EEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  braveSearchEnabled?: string
  dailyLimit?: string
  monthlyBudgetUsd?: string
  maxResults?: string
  maxQueriesPerRun?: string
  storeRawResults?: string
  storeSnippets?: string
  secretConfigured?: boolean
  otherPaidProvidersAllowed?: string
  publicSearxngInstanceAllowed?: string
  arbitraryUrlCaptureAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
} = {}): HybridSearchEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E
  const enabled = input.braveSearchEnabled ?? process.env.BRAVE_SEARCH_ENABLED
  const dailyLimit = Number(input.dailyLimit ?? process.env.BRAVE_SEARCH_DAILY_LIMIT ?? '0')
  const monthlyBudgetUsd = Number(input.monthlyBudgetUsd ?? process.env.BRAVE_SEARCH_MONTHLY_BUDGET_USD ?? '0')
  const maxResults = Number(input.maxResults ?? process.env.BRAVE_SEARCH_MAX_RESULTS ?? '0')
  const maxQueries = Number(input.maxQueriesPerRun ?? process.env.BRAVE_SEARCH_MAX_QUERIES_PER_RUN ?? '0')

  if (projectId !== hybridSearchConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== hybridSearchConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== hybridSearchConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== hybridSearchConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E=true is required for Phase 49M execution.')
  if (enabled !== 'true') blockers.push('BRAVE_SEARCH_ENABLED=true is required for the Phase 49M confidence-booster call.')
  if (!Number.isFinite(dailyLimit) || dailyLimit < 1) blockers.push('BRAVE_SEARCH_DAILY_LIMIT must be at least 1.')
  if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd <= 0) blockers.push('BRAVE_SEARCH_MONTHLY_BUDGET_USD must be greater than 0.')
  if (!Number.isFinite(maxResults) || maxResults < 1 || maxResults > hybridSearchConfig.maxBraveResults) blockers.push('BRAVE_SEARCH_MAX_RESULTS must be between 1 and 5.')
  if (!Number.isFinite(maxQueries) || maxQueries < 1 || maxQueries > hybridSearchConfig.maxQueries) blockers.push('BRAVE_SEARCH_MAX_QUERIES_PER_RUN must be exactly 1 or lower.')
  if ((input.storeRawResults ?? process.env.BRAVE_SEARCH_STORE_RAW_RESULTS ?? 'true') !== 'false') blockers.push('BRAVE_SEARCH_STORE_RAW_RESULTS=false is required.')
  if ((input.storeSnippets ?? process.env.BRAVE_SEARCH_STORE_SNIPPETS ?? 'true') !== 'false') blockers.push('BRAVE_SEARCH_STORE_SNIPPETS=false is required.')
  if (input.secretConfigured === false) blockers.push('BRAVE_SEARCH_API_KEY must be available from backend env or Google Secret Manager.')
  if ((input.otherPaidProvidersAllowed ?? process.env.OTHER_PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Other paid providers must remain disabled.')
  if ((input.publicSearxngInstanceAllowed ?? process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED ?? 'false') !== 'false') blockers.push('Public SearXNG instances must remain disabled.')
  if ((input.arbitraryUrlCaptureAllowed ?? process.env.ARBITRARY_URL_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Arbitrary URL capture must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad media flag must remain false.')

  warnings.push('Phase 49M permits exactly one private SearXNG query and one budget-gated Brave Search web API call.')
  warnings.push('Raw Brave JSON, Brave snippets, request headers, public SearXNG, arbitrary URL capture, production, beta, and broad media remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
