import type {
  ControlledLiveSearchConfig,
  ControlledLiveSearchQaGateId,
  ControlledLiveSearchSafety,
} from './controlled-live-search-capture-types'

export const controlledLiveSearchConfig: ControlledLiveSearchConfig = {
  phase: '49G',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'controlled_private_live_search_capture_e2e',
  provider: 'searxng_private_cloud_run',
  serviceName: 'reeditpro-staging-private-searxng',
  queries: [
    'site:docs.searxng.org searxng search api',
    'site:playwright.dev/docs screenshots playwright',
    'site:sharp.pixelplumbing.com sharp resize metadata',
  ],
  allowedDomains: [
    'docs.searxng.org',
    'playwright.dev',
    'sharp.pixelplumbing.com',
    'github.com',
    'developer.mozilla.org',
  ],
  maxQueries: 3,
  maxResultsPerQuery: 5,
  maxCapturePages: 2,
  maxScreenshotWidth: 1366,
  maxScreenshotHeight: 768,
  maxHtmlBytes: 2_000_000,
  maxSanitizedHtmlChars: 32_000,
  maxTextChars: 16_000,
  textPreviewChars: 420,
  viewport: { width: 1366, height: 768, deviceScaleFactor: 1 },
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49g',
  approvedPhase49FRunId: 'phase49f-20260602T204445',
  approvedPhase49FSourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/sources/source-manifest.json',
  approvedPhase49FReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/phase49f-20260602T204445/reports/phase49f-report.json',
}

export const controlledLiveSearchSafetyFlags: ControlledLiveSearchSafety = {
  paidProvidersAllowed: false,
  publicSearxngInstanceAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  publicWebCaptureAllowed: true,
  browserCaptureAllowed: true,
  sharpProcessingAllowed: true,
  readabilityExtractionAllowed: true,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const controlledLiveSearchQaGateIds: ControlledLiveSearchQaGateId[] = [
  'phase49f_evidence',
  'plan_snapshot_integrity',
  'private_searxng_query',
  'result_normalization',
  'allowlisted_capture_policy',
  'playwright_capture',
  'sharp_processing',
  'readability_extraction',
  'combined_manifest',
  'artifact_privacy',
  'blocked_features',
]

export const controlledLiveSearchRequiredScripts = [
  'activation:controlled-live-search-capture-e2e',
  'activation:controlled-live-search-capture-e2e:report',
  'activation:controlled-live-search-capture-e2e:iam-plan',
  'smoke:activation-controlled-live-search-capture-e2e',
] as const

export const controlledLiveSearchRequiredDocs = [
  'docs/activation-controlled-live-search-capture-e2e-runbook.md',
  'docs/activation-controlled-live-search-capture-e2e-policy.md',
  'docs/activation-controlled-live-search-capture-e2e-artifact-policy.md',
  'docs/activation-controlled-live-search-capture-e2e-qa-policy.md',
  'docs/activation-phase-49g-controlled-live-search-capture-e2e-results.md',
] as const

export function makeControlledLiveSearchRunId(now = new Date()): string {
  return `phase49g-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')}`
}

export function controlledLiveSearchArtifactPrefix(runId: string): string {
  return `${controlledLiveSearchConfig.artifactPrefixBase}/${runId}`
}

export function validateControlledLiveSearchCaptureE2EExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  paidProvidersAllowed?: string
  publicSearxngInstanceAllowed?: string
  arbitraryUrlCaptureAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadMediaReady?: string
}): { allowed: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId !== 'reeditpro') blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (input.activeProject && input.activeProject !== 'reeditpro') blockers.push('Active gcloud project must be reeditpro.')
  if (input.region !== 'us-central1') blockers.push('GCP_REGION must be us-central1.')
  if (input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E=true is required for Phase 49G execution.')
  if ((input.paidProvidersAllowed ?? 'false') !== 'false') blockers.push('Paid providers must remain disabled.')
  if ((input.publicSearxngInstanceAllowed ?? 'false') !== 'false') blockers.push('Public SearXNG instances must remain blocked.')
  if ((input.arbitraryUrlCaptureAllowed ?? 'false') !== 'false') blockers.push('Arbitrary URL capture must remain blocked.')
  if ((input.publicArtifactAllowed ?? 'false') !== 'false') blockers.push('Public artifacts must remain blocked.')
  if ((input.productionReady ?? 'false') !== 'false') blockers.push('Production readiness must remain false.')
  if ((input.externalBetaReady ?? 'false') !== 'false') blockers.push('External beta readiness must remain false.')
  if ((input.paidProductionReady ?? 'false') !== 'false') blockers.push('Paid production readiness must remain false.')
  if ((input.broadMediaReady ?? 'false') !== 'false') blockers.push('Broad media readiness must remain false.')
  if (!input.confirmation) warnings.push('Static report mode does not require confirmation; execution does.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
