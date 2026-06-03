import type { BraveLiveApiConfig, BraveLiveEnvValidation, BraveLiveQaGateId, BraveLiveSafetyFlags } from './brave-live-api-types'

export const braveLiveApiConfig: BraveLiveApiConfig = {
  phase: '49L',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  provider: 'brave_search',
  mode: 'controlled_live_api_validation',
  endpoint: 'https://api.search.brave.com/res/v1/web/search',
  query: 'ReeditPro AI video editing planning tools',
  maxResults: 5,
  maxQueriesPerRun: 1,
  timeoutMs: 8000,
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49l',
  secretName: 'BRAVE_SEARCH_API_KEY',
}

export const braveLiveSafetyFlags: BraveLiveSafetyFlags = {
  braveEnabledByDefault: false,
  searxngDefaultProvider: true,
  liveBraveApiAllowedInPhase49L: true,
  paidProviderAllowedOnlyForBrave: true,
  otherPaidProvidersAllowed: false,
  requiresSecret: true,
  secretFrontendExposureAllowed: false,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  normalizedMinimalMetadataAllowed: true,
  browserCaptureAllowed: false,
  readabilityExtractionAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const braveLiveQaGateIds: BraveLiveQaGateId[] = [
  'phase49k_evidence',
  'secret_safety',
  'budget_guard',
  'brave_live_api_call',
  'result_normalization',
  'storage_rights_enforcement',
  'paid_provider_scope',
  'artifact_privacy',
  'blocked_features',
]

export const braveLiveRequiredScripts = [
  'activation:brave-live-api-validation',
  'activation:brave-live-api-validation:report',
  'activation:brave-live-api-validation:iam-plan',
  'smoke:activation-brave-live-api-validation',
] as const

export const braveLiveRequiredDocs = [
  'docs/activation-brave-live-api-validation-runbook.md',
  'docs/activation-brave-live-api-validation-policy.md',
  'docs/activation-brave-live-api-validation-artifact-policy.md',
  'docs/activation-brave-live-api-validation-qa-policy.md',
  'docs/activation-phase-49l-brave-live-api-validation-results.md',
] as const

export function makeBraveLiveRunId(): string {
  return `phase49l-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function braveLiveArtifactPrefix(runId: string): string {
  if (!/^phase49l-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49L run id: ${runId}`)
  return `${braveLiveApiConfig.reportObjectPrefix}/${runId}`
}

export function validateBraveLiveApiValidationEnv(input: {
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
  browserCaptureAllowed?: string
  readabilityExtractionAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
} = {}): BraveLiveEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION
  const enabled = input.braveSearchEnabled ?? process.env.BRAVE_SEARCH_ENABLED
  const dailyLimit = Number(input.dailyLimit ?? process.env.BRAVE_SEARCH_DAILY_LIMIT ?? '0')
  const monthlyBudgetUsd = Number(input.monthlyBudgetUsd ?? process.env.BRAVE_SEARCH_MONTHLY_BUDGET_USD ?? '0')
  const maxResults = Number(input.maxResults ?? process.env.BRAVE_SEARCH_MAX_RESULTS ?? '0')
  const maxQueries = Number(input.maxQueriesPerRun ?? process.env.BRAVE_SEARCH_MAX_QUERIES_PER_RUN ?? '0')

  if (projectId !== braveLiveApiConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== braveLiveApiConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== braveLiveApiConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== braveLiveApiConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION=true is required for live execution.')
  if (enabled !== 'true') blockers.push('BRAVE_SEARCH_ENABLED=true is required for this controlled live validation.')
  if (!Number.isFinite(dailyLimit) || dailyLimit < 1) blockers.push('BRAVE_SEARCH_DAILY_LIMIT must be at least 1.')
  if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd <= 0) blockers.push('BRAVE_SEARCH_MONTHLY_BUDGET_USD must be greater than 0.')
  if (!Number.isFinite(maxResults) || maxResults < 1 || maxResults > braveLiveApiConfig.maxResults) blockers.push('BRAVE_SEARCH_MAX_RESULTS must be between 1 and 5.')
  if (!Number.isFinite(maxQueries) || maxQueries < 1 || maxQueries > braveLiveApiConfig.maxQueriesPerRun) blockers.push('BRAVE_SEARCH_MAX_QUERIES_PER_RUN must be exactly 1 or lower.')
  if ((input.storeRawResults ?? process.env.BRAVE_SEARCH_STORE_RAW_RESULTS ?? 'true') !== 'false') blockers.push('BRAVE_SEARCH_STORE_RAW_RESULTS=false is required.')
  if ((input.storeSnippets ?? process.env.BRAVE_SEARCH_STORE_SNIPPETS ?? 'true') !== 'false') blockers.push('BRAVE_SEARCH_STORE_SNIPPETS=false is required.')
  if (input.secretConfigured === false) blockers.push('BRAVE_SEARCH_API_KEY must be available from backend env or Google Secret Manager.')
  if ((input.otherPaidProvidersAllowed ?? process.env.OTHER_PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Other paid providers must remain disabled.')
  if ((input.browserCaptureAllowed ?? process.env.BROWSER_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Browser capture must remain disabled.')
  if ((input.readabilityExtractionAllowed ?? process.env.READABILITY_EXTRACTION_ALLOWED ?? 'false') !== 'false') blockers.push('Readability extraction must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad media flag must remain false.')

  warnings.push('Phase 49L permits exactly one budget-gated Brave Search web API call when all secret/config gates pass.')
  warnings.push('Raw Brave responses, snippets, request headers, browser capture, Readability extraction, production, beta, and broad media remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
