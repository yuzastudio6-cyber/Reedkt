import type {
  WebSearchInternalBetaConfig,
  WebSearchInternalBetaEnvValidation,
  WebSearchInternalBetaSafetyFlags,
} from './web-search-internal-beta-types'

export const webSearchInternalBetaConfig: WebSearchInternalBetaConfig = {
  phase: '49P',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'web_search_internal_beta_candidate_gate',
  serviceName: 'reeditpro-staging-private-searxng',
  braveSecretName: 'BRAVE_SEARCH_API_KEY',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49p',
  canonicalPhase49NRunId: 'phase49n-20260603T18331',
  canonicalPhase49ORunId: 'phase49o-20260603T20311',
}

export const webSearchInternalBetaSafetyFlags: WebSearchInternalBetaSafetyFlags = {
  liveSearchAllowed: false,
  braveApiCallAllowed: false,
  publicSearxngInstanceAllowed: false,
  paidProviderExpansionAllowed: false,
  broadCrawlingAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  browserCaptureAllowed: false,
  sharpProcessingAllowed: false,
  readabilityExtractionAllowed: false,
  dockerBuildAllowed: false,
  cloudRunDeployAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  secretValueAccessAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const webSearchInternalBetaRequiredScripts = [
  'activation:web-search-internal-beta-candidate',
  'activation:web-search-internal-beta-candidate:report',
  'activation:web-search-internal-beta-candidate:iam-plan',
  'smoke:activation-web-search-internal-beta-candidate',
] as const

export const webSearchInternalBetaRequiredDocs = [
  'docs/activation-web-search-internal-beta-candidate-runbook.md',
  'docs/activation-web-search-internal-beta-candidate-policy.md',
  'docs/activation-web-search-internal-beta-candidate-artifact-policy.md',
  'docs/activation-web-search-internal-beta-candidate-qa-policy.md',
  'docs/activation-phase-49p-web-search-internal-beta-candidate-results.md',
] as const

export function makeWebSearchInternalBetaRunId(): string {
  return `phase49p-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function webSearchInternalBetaArtifactPrefix(runId: string): string {
  if (!/^phase49p-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49P run id: ${runId}`)
  return `${webSearchInternalBetaConfig.artifactPrefixBase}/${runId}`
}

export function validateWebSearchInternalBetaExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
} = {}): WebSearchInternalBetaEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_WEB_SEARCH_INTERNAL_BETA_CANDIDATE

  if (projectId !== webSearchInternalBetaConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== webSearchInternalBetaConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== webSearchInternalBetaConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== webSearchInternalBetaConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_WEB_SEARCH_INTERNAL_BETA_CANDIDATE=true is required for Phase 49P execution.')

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
    if (value === 'true') blockers.push(`${name} must remain false or unset for Phase 49P.`)
  }

  warnings.push('Phase 49P is readiness closure only; it must not run live search, Brave API, browser capture, Sharp, Readability, Docker, Cloud Run deploy, or production/beta unlock work.')
  return { ok: blockers.length === 0, blockers, warnings }
}
