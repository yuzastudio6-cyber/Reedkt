import type { SearchProviderReadinessConfig, SearchProviderReadinessEnvValidation, SearchProviderReadinessSafetyFlags } from './search-provider-readiness-types'

export const searchProviderReadinessConfig: SearchProviderReadinessConfig = {
  phase: '49N',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'search_provider_readiness_gate',
  serviceName: 'reeditpro-staging-private-searxng',
  braveSecretName: 'BRAVE_SEARCH_API_KEY',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49n',
  canonicalPhase49MRunId: 'phase49m-20260603T17105',
}

export const searchProviderReadinessSafetyFlags: SearchProviderReadinessSafetyFlags = {
  liveSearchDuringPhase49N: false,
  braveApiCallDuringPhase49N: false,
  browserCaptureDuringPhase49N: false,
  sharpProcessingDuringPhase49N: false,
  readabilityExtractionDuringPhase49N: false,
  publicSearxngInstanceAllowed: false,
  otherPaidProvidersAllowed: false,
  paidProviderExpansionAllowed: false,
  broadCrawlingAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const searchProviderReadinessRequiredScripts = [
  'activation:search-provider-readiness',
  'activation:search-provider-readiness:report',
  'activation:search-provider-readiness:iam-plan',
  'smoke:activation-search-provider-readiness',
] as const

export const searchProviderReadinessRequiredDocs = [
  'docs/activation-search-provider-readiness-runbook.md',
  'docs/activation-search-provider-readiness-policy.md',
  'docs/activation-search-provider-readiness-artifact-policy.md',
  'docs/activation-search-provider-readiness-qa-policy.md',
  'docs/activation-phase-49n-search-provider-readiness-results.md',
] as const

export function makeSearchProviderReadinessRunId(): string {
  return `phase49n-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function searchProviderReadinessArtifactPrefix(runId: string): string {
  if (!/^phase49n-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49N run id: ${runId}`)
  return `${searchProviderReadinessConfig.artifactPrefixBase}/${runId}`
}

export function validateSearchProviderReadinessExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  publicSearxngInstanceAllowed?: string
  arbitraryUrlCaptureAllowed?: string
  broadCrawlingAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
} = {}): SearchProviderReadinessEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SEARCH_PROVIDER_READINESS_GATE

  if (projectId !== searchProviderReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== searchProviderReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== searchProviderReadinessConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== searchProviderReadinessConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SEARCH_PROVIDER_READINESS_GATE=true is required for Phase 49N execution.')
  if ((input.publicSearxngInstanceAllowed ?? process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED ?? 'false') !== 'false') blockers.push('Public SearXNG instances must remain disabled.')
  if ((input.arbitraryUrlCaptureAllowed ?? process.env.ARBITRARY_URL_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Arbitrary URL capture must remain disabled.')
  if ((input.broadCrawlingAllowed ?? process.env.BROAD_CRAWLING_ALLOWED ?? 'false') !== 'false') blockers.push('Broad crawling must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifact access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad media flag must remain false.')

  warnings.push('Phase 49N is evidence-only; it must not issue a new SearXNG query, Brave API call, browser capture, Sharp run, or Readability extraction.')
  return { ok: blockers.length === 0, blockers, warnings }
}
