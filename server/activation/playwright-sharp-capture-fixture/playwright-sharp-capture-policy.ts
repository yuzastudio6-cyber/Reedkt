import type {
  PlaywrightSharpCaptureConfig,
  PlaywrightSharpCaptureQaGateId,
  PlaywrightSharpCaptureSafetyFlags,
} from './playwright-sharp-capture-types'

export const playwrightSharpCaptureConfig: PlaywrightSharpCaptureConfig = {
  phase: '49C',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  fixtureMode: 'generated_local_html_capture',
  fixtureTitle: 'ReeditPro internal web search capture fixture',
  approvedPhase49BRunId: 'phase49b-20260602T01332',
  approvedPhase49BSourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/sources/source-manifest.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-web-search/phase49c',
  viewport: {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  },
  previewMaxWidth: 1280,
  thumbnailWidth: 320,
}

export const playwrightSharpCaptureSafetyFlags: PlaywrightSharpCaptureSafetyFlags = {
  localOnlyCaptureAllowed: true,
  browserCaptureLimitedToLocalFixture: true,
  publicWebCaptureAllowed: false,
  liveSearchAllowed: false,
  paidProvidersAllowed: false,
  readabilityExtractionAllowed: false,
  sharpProcessingAllowedForGeneratedScreenshot: true,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const playwrightSharpCaptureQaGateIds: PlaywrightSharpCaptureQaGateId[] = [
  'phase49b_evidence',
  'local_fixture_integrity',
  'playwright_capture',
  'sharp_processing',
  'artifact_manifest',
  'artifact_privacy',
  'blocked_features',
]

export const playwrightSharpCaptureRequiredScripts = [
  'activation:playwright-sharp-capture-fixture',
  'activation:playwright-sharp-capture-fixture:report',
  'activation:playwright-sharp-capture-fixture:iam-plan',
  'smoke:activation-playwright-sharp-capture-fixture',
] as const

export const playwrightSharpCaptureRequiredDocs = [
  'docs/activation-playwright-sharp-capture-fixture-runbook.md',
  'docs/activation-playwright-sharp-capture-fixture-policy.md',
  'docs/activation-playwright-sharp-capture-fixture-artifact-policy.md',
  'docs/activation-playwright-sharp-capture-fixture-qa-policy.md',
  'docs/activation-phase-49c-playwright-sharp-capture-fixture-results.md',
] as const

export function makePlaywrightSharpCaptureRunId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toISOString().slice(11, 19).replace(/:/g, '')
  return `phase49c-${date}T${time}`
}

export function playwrightSharpCaptureArtifactPrefix(runId: string): string {
  if (!/^phase49c-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 49C run id: ${runId}`)
  return `${playwrightSharpCaptureConfig.reportObjectPrefix}/${runId}`
}

export function validatePlaywrightSharpCaptureFixtureExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  fixtureMode?: string
  liveSearchAllowed?: string
  paidProvidersAllowed?: string
  publicWebCaptureAllowed?: string
  readabilityExtractionAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE
  const fixtureMode = input.fixtureMode ?? process.env.REEDITPRO_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE_MODE ?? playwrightSharpCaptureConfig.fixtureMode

  if (projectId !== playwrightSharpCaptureConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== playwrightSharpCaptureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== playwrightSharpCaptureConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== playwrightSharpCaptureConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE=true is required for execution.')
  if (fixtureMode !== playwrightSharpCaptureConfig.fixtureMode) blockers.push('Fixture mode must be exactly generated_local_html_capture.')
  if ((input.liveSearchAllowed ?? process.env.LIVE_SEARCH_ALLOWED ?? 'false') !== 'false') blockers.push('Live search must remain disabled.')
  if ((input.paidProvidersAllowed ?? process.env.PAID_PROVIDERS_ALLOWED ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.publicWebCaptureAllowed ?? process.env.PUBLIC_WEB_CAPTURE_ALLOWED ?? 'false') !== 'false') blockers.push('Public web capture must remain disabled.')
  if ((input.readabilityExtractionAllowed ?? process.env.READABILITY_EXTRACTION_ALLOWED ?? 'false') !== 'false') blockers.push('Readability extraction must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 49C executes only a generated/local HTML capture fixture.')
  warnings.push('No live search, public web request, paid provider, Readability extraction, Docker, Cloud Run deploy, or public artifact is allowed.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
