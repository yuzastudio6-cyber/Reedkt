import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateWebSearchProviderMode } from './private-web-search-capture-e2e-types'

const knownPublicSearxngHostnames = new Set([
  'searx.be',
  'search.sapti.me',
  'searx.tiekoetter.com',
  'searx.work',
  'northboot.xyz',
])

export function resolvePrivateSearchProvider(input: { endpoint?: string | undefined }): {
  providerMode: PrivateWebSearchProviderMode
  endpoint?: string
  warnings: string[]
  blockers: string[]
} {
  const warnings: string[] = []
  const blockers: string[] = []
  if (!input.endpoint) {
    warnings.push('No REEDITPRO_SEARXNG_PRIVATE_ENDPOINT configured; using deterministic private fixture provider.')
    return { providerMode: 'private_fixture_provider', warnings, blockers }
  }

  try {
    const url = new URL(input.endpoint)
    if (!['http:', 'https:'].includes(url.protocol)) blockers.push('Private SearXNG endpoint must use http or https.')
    if (knownPublicSearxngHostnames.has(url.hostname)) blockers.push('Configured SearXNG endpoint matches a known public instance and is blocked.')
    if (!isPrivateOrExplicitFixtureHost(url.hostname)) blockers.push('Configured SearXNG endpoint must be private/internal or fixture-scoped.')
    if (blockers.length) {
      warnings.push('Configured endpoint failed Phase 49E private endpoint validation; falling back to private fixture provider.')
      return { providerMode: 'private_fixture_provider', warnings, blockers: [] }
    }
    warnings.push('Validated private SearXNG endpoint is configured, but this implementation still avoids public/paid providers.')
    return { providerMode: 'private_searxng_endpoint', endpoint: url.toString(), warnings, blockers }
  } catch {
    warnings.push('Configured endpoint is not a valid URL; using deterministic private fixture provider.')
    return { providerMode: privateWebE2EConfig.providerMode, warnings, blockers }
  }
}

function isPrivateOrExplicitFixtureHost(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.private')
    || hostname.endsWith('.test')
}
