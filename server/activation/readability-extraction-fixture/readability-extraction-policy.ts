import type {
  ReadabilityExtractionConfig,
  ReadabilityExtractionQaGateId,
  ReadabilityExtractionSafetyFlags,
} from './readability-extraction-types'

export const readabilityExtractionConfig: ReadabilityExtractionConfig = {
  phase: '49D',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  fixtureMode: 'generated_local_html_readability_extraction',
  fixtureTitle: 'ReeditPro internal source extraction fixture',
  approvedPhase49CRunId: 'phase49c-20260602T022008',
  approvedPhase49CManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/phase49c-20260602T022008/manifest/capture-artifact-manifest.json',
  approvedPhase49CReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49c/phase49c-20260602T022008/reports/phase49c-report.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49d',
  readabilityVersion: '0.6.0',
  domImplementation: 'jsdom',
  sanitizer: 'jsdom-dom-bounded-sanitizer',
  maxSanitizedHtmlChars: 12000,
  maxTextChars: 8000,
  textPreviewChars: 500,
}

export const readabilityExtractionSafetyFlags: ReadabilityExtractionSafetyFlags = {
  localOnlyExtractionAllowed: true,
  publicWebExtractionAllowed: false,
  liveSearchAllowed: false,
  paidProvidersAllowed: false,
  browserCaptureAllowed: false,
  playwrightAllowed: false,
  sharpProcessingAllowed: false,
  readabilityExtractionAllowedForGeneratedLocalFixture: true,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const readabilityExtractionQaGateIds: ReadabilityExtractionQaGateId[] = [
  'phase49c_evidence',
  'local_article_fixture_integrity',
  'readability_extraction',
  'sanitization_integrity',
  'normalization_integrity',
  'artifact_manifest',
  'artifact_privacy',
  'blocked_features',
]

export const readabilityExtractionRequiredScripts = [
  'activation:readability-extraction-fixture',
  'activation:readability-extraction-fixture:report',
  'activation:readability-extraction-fixture:iam-plan',
  'smoke:activation-readability-extraction-fixture',
] as const

export const readabilityExtractionRequiredDocs = [
  'docs/activation-readability-extraction-fixture-runbook.md',
  'docs/activation-readability-extraction-fixture-policy.md',
  'docs/activation-readability-extraction-fixture-artifact-policy.md',
  'docs/activation-readability-extraction-fixture-qa-policy.md',
  'docs/activation-phase-49d-readability-extraction-fixture-results.md',
] as const

export function makeReadabilityExtractionRunId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toISOString().slice(11, 19).replace(/:/g, '')
  return `phase49d-${date}T${time}`
}

export function readabilityExtractionArtifactPrefix(runId: string): string {
  if (!/^phase49d-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 49D run id: ${runId}`)
  return `${readabilityExtractionConfig.reportObjectPrefix}/${runId}`
}

export function validateReadabilityExtractionFixtureExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  fixtureMode?: string
  liveSearchAllowed?: string
  paidProvidersAllowed?: string
  publicWebExtractionAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_READABILITY_EXTRACTION_FIXTURE
  const fixtureMode = input.fixtureMode ?? process.env.REEDITPRO_READABILITY_EXTRACTION_FIXTURE_MODE ?? readabilityExtractionConfig.fixtureMode

  if (projectId !== readabilityExtractionConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== readabilityExtractionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== readabilityExtractionConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== readabilityExtractionConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_READABILITY_EXTRACTION_FIXTURE=true is required for execution.')
  if (fixtureMode !== readabilityExtractionConfig.fixtureMode) blockers.push('Fixture mode must be exactly generated_local_html_readability_extraction.')
  if ((input.liveSearchAllowed ?? process.env.LIVE_SEARCH_ALLOWED ?? 'false') !== 'false') blockers.push('Live search must remain disabled.')
  if ((input.paidProvidersAllowed ?? process.env.PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.publicWebExtractionAllowed ?? process.env.PUBLIC_WEB_EXTRACTION_ALLOWED ?? 'false') !== 'false') blockers.push('Public web extraction must remain disabled.')
  if ((input.browserCaptureAllowed ?? process.env.BROWSER_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Browser capture must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 49D executes only generated/local Readability extraction.')
  warnings.push('No live search, public web request, browser launch, screenshot capture, paid provider, Docker, Cloud Run deploy, or public artifact is allowed.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
