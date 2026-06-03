import type { WebSearchReadinessConfig, WebSearchReadinessEnvValidation, WebSearchReadinessQaGateId, WebSearchReadinessSafetyFlags } from './web-search-capture-readiness-types'

export const webSearchCaptureReadinessConfig: WebSearchReadinessConfig = {
  phase: '49H',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  mode: 'web_search_capture_internal_readiness',
  serviceName: 'reeditpro-staging-private-searxng',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-web-search/phase49h',
  canonicalPhase49GRunId: 'phase49g-20260602T222646',
}

export const webSearchCaptureReadinessSafetyFlags: WebSearchReadinessSafetyFlags = {
  liveSearchDuringPhase49H: false,
  browserCaptureDuringPhase49H: false,
  readabilityExtractionDuringPhase49H: false,
  publicSearxngInstanceAllowed: false,
  paidProviderAllowed: false,
  providerFallbackAllowed: false,
  broadCrawlingAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const webSearchCaptureReadinessQaGateIds: WebSearchReadinessQaGateId[] = [
  'phase_evidence_chain',
  'private_searxng_ready',
  'provider_scope_integrity',
  'controlled_search_scope',
  'capture_scope_integrity',
  'extraction_scope_integrity',
  'artifact_privacy',
  'frontend_secret_safety',
  'failure_policy',
  'readiness_docs_consistency',
  'blocked_features',
]

export const webSearchCaptureReadinessRequiredScripts = [
  'activation:web-search-capture-readiness',
  'activation:web-search-capture-readiness:report',
  'activation:web-search-capture-readiness:iam-plan',
  'smoke:activation-web-search-capture-readiness',
] as const

const falseFlagEnvVars = [
  'REEDITPRO_PAID_PROVIDER_ALLOWED',
  'REEDITPRO_PUBLIC_SEARXNG_INSTANCE_ALLOWED',
  'REEDITPRO_ARBITRARY_URL_CAPTURE_ALLOWED',
  'REEDITPRO_PUBLIC_ARTIFACT_ALLOWED',
  'REEDITPRO_PRODUCTION_READY',
  'REEDITPRO_EXTERNAL_BETA_READY',
  'REEDITPRO_PAID_PRODUCTION_READY',
  'REEDITPRO_BROAD_REAL_MEDIA_READY',
] as const

export function makeWebSearchCaptureReadinessRunId(date = new Date()): string {
  const compact = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', 'T')
  return `phase49h-${compact}`
}

export function validateWebSearchCaptureReadinessExecutionEnv(env: Record<string, string | undefined> = process.env): WebSearchReadinessEnvValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  if (env.GCP_PROJECT_ID !== webSearchCaptureReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be reeditpro.')
  if (env.GCP_REGION !== webSearchCaptureReadinessConfig.region) blockers.push('GCP_REGION must be us-central1.')
  if (env.REEDITPRO_ENV !== webSearchCaptureReadinessConfig.env) blockers.push('REEDITPRO_ENV must be staging.')
  if (env.REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS !== 'true') blockers.push('REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS=true is required for Phase 49H execution.')
  for (const flag of falseFlagEnvVars) {
    if (env[flag] === 'true') blockers.push(`${flag} must remain false or unset for Phase 49H.`)
  }
  if (env.REEDITPRO_SEARXNG_PRIVATE_ENDPOINT) {
    warnings.push('REEDITPRO_SEARXNG_PRIVATE_ENDPOINT is present but Phase 49H does not issue a live query; service readiness is audited from Cloud Run metadata and existing evidence only.')
  }
  return { ok: blockers.length === 0, blockers, warnings }
}

export function validateWebSearchCaptureReadinessStaticPolicy(): WebSearchReadinessEnvValidation {
  const flags = webSearchCaptureReadinessSafetyFlags
  const blockers = [
    flags.liveSearchDuringPhase49H ? 'Phase 49H live search is enabled.' : '',
    flags.browserCaptureDuringPhase49H ? 'Phase 49H browser capture is enabled.' : '',
    flags.readabilityExtractionDuringPhase49H ? 'Phase 49H Readability extraction is enabled.' : '',
    flags.publicSearxngInstanceAllowed ? 'Public SearXNG instances are enabled.' : '',
    flags.paidProviderAllowed ? 'Paid providers are enabled.' : '',
    flags.providerFallbackAllowed ? 'Provider fallback is enabled.' : '',
    flags.broadCrawlingAllowed ? 'Broad crawling is enabled.' : '',
    flags.arbitraryUrlCaptureAllowed ? 'Arbitrary URL capture is enabled.' : '',
    flags.publicArtifactAllowed ? 'Public artifacts are enabled.' : '',
    flags.signedUrlSourceOfTruthAllowed ? 'Signed URLs are enabled as source of truth.' : '',
    flags.productionReadyAllowed ? 'Production readiness is enabled.' : '',
    flags.externalBetaAllowed ? 'External beta readiness is enabled.' : '',
    flags.paidProductionAllowed ? 'Paid production readiness is enabled.' : '',
    flags.broadMediaAllowed ? 'Broad media readiness is enabled.' : '',
  ].filter(Boolean)
  return { ok: blockers.length === 0, blockers, warnings: [] }
}
