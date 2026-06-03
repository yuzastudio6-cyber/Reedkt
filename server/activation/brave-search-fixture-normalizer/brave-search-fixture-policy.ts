import type { BraveSearchFixtureConfig, BraveSearchFixtureQaGateId, BraveSearchFixtureSafetyFlags } from './brave-search-fixture-types'

export const braveSearchFixtureConfig: BraveSearchFixtureConfig = {
  phase: '49K',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  provider: 'brave_search',
  mode: 'brave_shaped_fixture_normalizer',
  query: 'ReeditPro AI video editing planning tools',
  minResults: 5,
  maxResults: 8,
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49k',
}

export const braveSearchFixtureSafetyFlags: BraveSearchFixtureSafetyFlags = {
  braveEnabledByDefault: false,
  liveBraveApiAllowed: false,
  paidProviderAllowed: false,
  requiresSecretForLiveUse: true,
  rawBraveResponseStorageAllowed: false,
  braveSnippetStorageAllowed: false,
  normalizedMinimalMetadataAllowed: true,
  searxngDefaultProvider: true,
  searxngOnlyDefaultMode: true,
  fallbackPolicyOnly: true,
  providerExecutionAllowed: false,
  liveSearchAllowed: false,
  browserCaptureAllowed: false,
  readabilityExtractionAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const braveSearchFixtureQaGateIds: BraveSearchFixtureQaGateId[] = [
  'phase49j_evidence',
  'brave_fixture_integrity',
  'brave_normalizer',
  'storage_rights_enforcement',
  'secret_safety',
  'searxng_confidence_policy',
  'provider_router_policy',
  'dedupe_policy',
  'paid_provider_blocked',
  'artifact_privacy',
  'blocked_features',
]

export const braveSearchFixtureRequiredScripts = [
  'activation:brave-search-fixture-normalizer',
  'activation:brave-search-fixture-normalizer:report',
  'activation:brave-search-fixture-normalizer:iam-plan',
  'smoke:activation-brave-search-fixture-normalizer',
] as const

export const braveSearchFixtureRequiredDocs = [
  'docs/activation-brave-search-fixture-normalizer-runbook.md',
  'docs/activation-brave-search-fixture-normalizer-policy.md',
  'docs/activation-brave-search-fixture-normalizer-artifact-policy.md',
  'docs/activation-brave-search-fixture-normalizer-qa-policy.md',
  'docs/activation-phase-49k-brave-search-fixture-normalizer-results.md',
] as const

export function makeBraveSearchFixtureRunId(): string {
  return `phase49k-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function braveSearchFixtureArtifactPrefix(runId: string): string {
  if (!/^phase49k-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49K run id: ${runId}`)
  return `${braveSearchFixtureConfig.reportObjectPrefix}/${runId}`
}

export function buildBraveFixturePlanSnapshot(runId: string) {
  const prefix = braveSearchFixtureArtifactPrefix(runId)
  return {
    planId: 'phase49k-brave-fixture-normalizer-plan' as const,
    phase49KRunId: runId,
    provider: 'brave_search' as const,
    providerMode: 'fixture' as const,
    query: braveSearchFixtureConfig.query,
    maxResults: braveSearchFixtureConfig.maxResults,
    braveEnabledByDefault: false as const,
    liveBraveApiAllowed: false as const,
    paidProviderAllowed: false as const,
    rawBraveResponseStorageAllowed: false as const,
    rawPromptExecution: false as const,
    approvedPlanSnapshot: true as const,
    outputPrefixes: {
      generatedAssets: `gs://${braveSearchFixtureConfig.generatedAssetsBucket}/${prefix}`,
      qaArtifacts: `gs://${braveSearchFixtureConfig.qaBucket}/${prefix}`,
    },
    safety: braveSearchFixtureSafetyFlags,
  }
}

export function validateBraveFixtureNormalizerExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
  liveBraveApiAllowed?: string
  paidProviderAllowed?: string
  rawBraveResponseStorageAllowed?: string
  braveSnippetStorageAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER
  const mode = input.mode ?? process.env.REEDITPRO_BRAVE_FIXTURE_NORMALIZER_MODE ?? braveSearchFixtureConfig.mode

  if (projectId !== braveSearchFixtureConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== braveSearchFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== braveSearchFixtureConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== braveSearchFixtureConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER=true is required for execution.')
  if (mode !== braveSearchFixtureConfig.mode) blockers.push('Mode must be exactly brave_shaped_fixture_normalizer.')
  if ((input.liveBraveApiAllowed ?? process.env.LIVE_BRAVE_API_ALLOWED ?? 'false') !== 'false') blockers.push('Live Brave API must remain disabled.')
  if ((input.paidProviderAllowed ?? process.env.PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.rawBraveResponseStorageAllowed ?? process.env.RAW_BRAVE_RESPONSE_STORAGE_ALLOWED ?? 'false') !== 'false') blockers.push('Raw Brave response storage must remain disabled.')
  if ((input.braveSnippetStorageAllowed ?? process.env.BRAVE_SNIPPET_STORAGE_ALLOWED ?? 'false') !== 'false') blockers.push('Brave snippet storage must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad media flag must remain false.')

  warnings.push('Phase 49K executes generated Brave-shaped fixtures only.')
  warnings.push('No live Brave API, paid provider, live search, browser capture, Readability extraction, Docker, Cloud Run, or public artifact is allowed.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
