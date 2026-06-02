import type {
  SearxngSearchFixtureConfig,
  SearxngSearchFixtureQaGateId,
  SearxngSearchFixtureSafetyFlags,
} from './searxng-search-fixture-types'

export const searxngSearchFixtureConfig: SearxngSearchFixtureConfig = {
  phase: '49B',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  defaultProvider: 'searxng',
  fixtureMode: 'generated_private_fixture',
  query: 'ReeditPro open source video editing toolchain documentation',
  minResults: 5,
  maxResults: 8,
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49b',
}

export const searxngSearchFixtureSafetyFlags: SearxngSearchFixtureSafetyFlags = {
  liveSearchAllowed: false,
  publicSearxngInstanceAllowed: false,
  paidProvidersAllowed: false,
  browserCaptureAllowed: false,
  playwrightAllowed: false,
  sharpProcessingAllowed: false,
  readabilityExtractionAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const searxngSearchFixtureGateIds: SearxngSearchFixtureQaGateId[] = [
  'phase49a_evidence',
  'fixture_integrity',
  'normalization_integrity',
  'plan_snapshot_integrity',
  'source_manifest_integrity',
  'paid_provider_blocking',
  'browser_capture_blocking',
  'artifact_privacy',
  'blocked_features',
]

export const searxngSearchFixtureRequiredScripts = [
  'activation:searxng-search-fixture',
  'activation:searxng-search-fixture:report',
  'activation:searxng-search-fixture:iam-plan',
  'smoke:activation-searxng-search-fixture',
] as const

export const searxngSearchFixtureRequiredDocs = [
  'docs/activation-searxng-search-fixture-runbook.md',
  'docs/activation-searxng-search-fixture-policy.md',
  'docs/activation-searxng-search-fixture-artifact-policy.md',
  'docs/activation-searxng-search-fixture-qa-policy.md',
  'docs/activation-phase-49b-searxng-search-fixture-results.md',
] as const

export function makeSearxngSearchFixtureRunId(): string {
  return `phase49b-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function searxngSearchFixtureArtifactPrefix(runId: string): string {
  if (!/^phase49b-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 49B run id: ${runId}`)
  return `${searxngSearchFixtureConfig.reportObjectPrefix}/${runId}`
}

export function validateSearxngSearchFixtureExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  fixtureMode?: string
  liveSearchAllowed?: string
  paidProvidersAllowed?: string
  browserCaptureAllowed?: string
  publicArtifactAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE
  const fixtureMode = input.fixtureMode ?? process.env.REEDITPRO_SEARXNG_SEARCH_FIXTURE_MODE ?? searxngSearchFixtureConfig.fixtureMode

  if (projectId !== searxngSearchFixtureConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== searxngSearchFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== searxngSearchFixtureConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== searxngSearchFixtureConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE=true is required for execution.')
  if (fixtureMode !== searxngSearchFixtureConfig.fixtureMode) blockers.push('Fixture mode must be exactly generated_private_fixture.')
  if ((input.liveSearchAllowed ?? process.env.LIVE_SEARCH_ALLOWED ?? 'false') !== 'false') blockers.push('Live search must remain disabled.')
  if ((input.paidProvidersAllowed ?? process.env.PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.browserCaptureAllowed ?? process.env.BROWSER_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Browser capture must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 49B executes a generated/private search fixture only.')
  warnings.push('No live search, public web request, browser capture, paid provider, Docker, Cloud Run, or public artifact is allowed.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
