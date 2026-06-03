import type { BraveSearchFallbackConfig, BraveSearchQaGateId } from './brave-search-fallback-types'

export const braveSearchFallbackConfig: BraveSearchFallbackConfig = {
  phase: '49J',
  env: 'staging',
  defaultProvider: 'searxng',
  optionalProvider: 'brave_search',
  defaultProviderMode: 'searxng_only',
  reportOnly: true,
}

export const braveSearchQaGateIds: BraveSearchQaGateId[] = [
  'brave_provider_evidence',
  'default_provider_integrity',
  'secret_safety',
  'cost_policy',
  'storage_rights_policy',
  'confidence_policy',
  'provider_router_policy',
  'paid_provider_blocked',
  'blocked_features',
]

export const braveSearchRequiredScripts = [
  'activation:brave-search-fallback-policy',
  'activation:brave-search-fallback-policy:report',
  'activation:brave-search-provider:summary',
  'smoke:activation-brave-search-fallback-policy',
] as const

export const braveSearchRequiredDocs = [
  'docs/activation-brave-search-fallback-policy-runbook.md',
  'docs/activation-brave-search-fallback-policy.md',
  'docs/activation-brave-search-cost-policy.md',
  'docs/activation-brave-search-storage-rights-policy.md',
  'docs/activation-phase-49j-brave-search-fallback-policy-results.md',
] as const

export function validateBraveSearchFallbackStaticPolicy(env: NodeJS.ProcessEnv = process.env) {
  const blockers = [
    env.BRAVE_SEARCH_ENABLED === 'true' ? 'BRAVE_SEARCH_ENABLED must remain false in Phase 49J.' : '',
    env.SEARCH_PROVIDER_MODE && env.SEARCH_PROVIDER_MODE !== 'searxng_only'
      ? 'SEARCH_PROVIDER_MODE must remain searxng_only in Phase 49J.'
      : '',
    env.REEDITPRO_PRODUCTION_READY === 'true' ? 'Production readiness must remain false.' : '',
    env.REEDITPRO_EXTERNAL_BETA_READY === 'true' ? 'External beta readiness must remain false.' : '',
    env.REEDITPRO_PAID_PRODUCTION_READY === 'true' ? 'Paid production readiness must remain false.' : '',
    env.REEDITPRO_BROAD_REAL_MEDIA_READY === 'true' ? 'Broad media readiness must remain false.' : '',
  ].filter(Boolean)

  return {
    ok: blockers.length === 0,
    blockers,
    warnings: [
      'Phase 49J is static policy only; Brave API execution, paid provider execution, live search, and storage of Brave responses remain blocked.',
    ],
  }
}
