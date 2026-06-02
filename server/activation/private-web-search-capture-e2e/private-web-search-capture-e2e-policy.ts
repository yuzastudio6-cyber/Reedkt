import type {
  PrivateWebE2EConfig,
  PrivateWebE2EQaGateId,
  PrivateWebE2ESafetyFlags,
  PrivateWebSearchProviderMode,
} from './private-web-search-capture-e2e-types'

export const privateWebE2EConfig: PrivateWebE2EConfig = {
  phase: '49E',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'controlled_private_web_search_capture_e2e',
  defaultProvider: 'searxng',
  providerMode: 'private_fixture_provider',
  query: 'ReeditPro controlled private web search capture E2E fixture',
  approvedPhase49BRunId: 'phase49b-20260602T01332',
  approvedPhase49CRunId: 'phase49c-20260602T022008',
  approvedPhase49DRunId: 'phase49d-20260602T150908',
  approvedPhase49DReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49d/phase49d-20260602T150908/reports/phase49d-report.json',
  maxResults: 3,
  allowedResultDomains: ['fixture.local', 'example.invalid', 'private.test'],
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49e',
  viewport: {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  },
  previewMaxWidth: 1280,
  thumbnailWidth: 320,
  maxPageBytes: 128_000,
  maxSanitizedHtmlChars: 32_000,
  maxTextChars: 16_000,
  textPreviewChars: 420,
  readabilityVersion: '@mozilla/readability',
  domImplementation: 'jsdom',
  sanitizer: 'jsdom-dom-bounded-sanitizer',
}

export const privateWebE2ESafetyFlags: PrivateWebE2ESafetyFlags = {
  privateFixtureProviderAllowed: true,
  privateSearxngEndpointAllowed: true,
  publicSearxngInstanceAllowed: false,
  paidProvidersAllowed: false,
  livePublicSearchAllowed: false,
  publicWebCaptureAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  browserCaptureAllowedForFixturePages: true,
  sharpProcessingAllowedForPhaseScreenshots: true,
  readabilityExtractionAllowedForFixtureHtml: true,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const privateWebE2ERequiredScripts = [
  'activation:private-web-search-capture-e2e',
  'activation:private-web-search-capture-e2e:report',
  'activation:private-web-search-capture-e2e:iam-plan',
  'smoke:activation-private-web-search-capture-e2e',
] as const

export const privateWebE2ERequiredDocs = [
  'docs/activation-private-web-search-capture-e2e-runbook.md',
  'docs/activation-private-web-search-capture-e2e-policy.md',
  'docs/activation-private-web-search-capture-e2e-artifact-policy.md',
  'docs/activation-private-web-search-capture-e2e-qa-policy.md',
  'docs/activation-phase-49e-private-web-search-capture-e2e-results.md',
] as const

export const privateWebE2EQaGateIds: PrivateWebE2EQaGateId[] = [
  'phase49b_evidence',
  'phase49c_evidence',
  'phase49d_evidence',
  'plan_snapshot_integrity',
  'private_search_provider',
  'source_normalization',
  'private_fixture_pages',
  'playwright_capture',
  'sharp_processing',
  'readability_extraction',
  'combined_manifest',
  'artifact_privacy',
  'blocked_features',
]

export function makePrivateWebE2ERunId(date = new Date()): string {
  const compact = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
  return `phase49e-${compact}`
}

export function privateWebE2EArtifactPrefix(runId: string): string {
  return `${privateWebE2EConfig.reportObjectPrefix}/${runId}`
}

export function validatePrivateWebSearchCaptureE2EExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
  providerMode?: string
  paidProvidersAllowed?: string
  livePublicSearchAllowed?: string
  publicWebCaptureAllowed?: string
  arbitraryUrlCaptureAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
}) {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId !== privateWebE2EConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== privateWebE2EConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (input.region !== privateWebE2EConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (input.env !== privateWebE2EConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PRIVATE_WEB_SEARCH_CAPTURE_E2E=true is required for Phase 49E execution.')
  if (input.mode !== privateWebE2EConfig.mode) blockers.push('REEDITPRO_PRIVATE_WEB_SEARCH_CAPTURE_E2E_MODE must be controlled_private_web_search_capture_e2e.')
  if (!isValidProviderMode(input.providerMode)) blockers.push('Provider mode must be private_fixture_provider or validated private_searxng_endpoint.')
  if (input.paidProvidersAllowed !== 'false') blockers.push('Paid providers must remain disabled.')
  if (input.livePublicSearchAllowed !== 'false') blockers.push('Live public search must remain disabled.')
  if (input.publicWebCaptureAllowed !== 'false') blockers.push('Public web capture must remain disabled.')
  if (input.arbitraryUrlCaptureAllowed !== 'false') blockers.push('Arbitrary URL capture must remain disabled.')
  if (input.publicArtifactAllowed !== 'false') blockers.push('Public artifacts must remain disabled.')
  if (input.productionReady !== 'false') blockers.push('Production readiness must remain false.')
  if (input.externalBetaReady !== 'false') blockers.push('External beta readiness must remain false.')
  if (input.paidProductionReady !== 'false') blockers.push('Paid production readiness must remain false.')
  if (input.broadRealMediaReady !== 'false') blockers.push('Broad real media readiness must remain false.')
  warnings.push('Phase 49E is controlled/private fixture E2E only; it does not approve broad search, public capture, paid providers, beta, or production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isValidProviderMode(value: string | undefined): value is PrivateWebSearchProviderMode {
  return value === 'private_fixture_provider' || value === 'private_searxng_endpoint'
}
