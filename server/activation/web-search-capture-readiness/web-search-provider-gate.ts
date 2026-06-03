import { webSearchCaptureReadinessConfig } from './web-search-capture-readiness-policy'
import type { WebSearchProviderGateAudit } from './web-search-capture-readiness-types'

export function buildWebSearchProviderGateAudit(): WebSearchProviderGateAudit {
  return {
    defaultProvider: 'searxng',
    privateSearxngServiceName: webSearchCaptureReadinessConfig.serviceName,
    privateSearxngRequired: true,
    publicSearxngInstancesAllowed: false,
    paidProvidersAllowed: false,
    paidProviders: [
      { providerId: 'brave-search-api', allowed: false, requiresFutureApproval: true },
      { providerId: 'tavily', allowed: false, requiresFutureApproval: true },
      { providerId: 'exa', allowed: false, requiresFutureApproval: true },
      { providerId: 'firecrawl', allowed: false, requiresFutureApproval: true },
      { providerId: 'browserless-browserbase', allowed: false, requiresFutureApproval: true },
    ],
    providerFallbackAllowed: false,
    frontendSecretsAllowed: false,
    workerOnlyRuntimeRequired: true,
    blockers: [],
    warnings: [
      'Phase 49H audits provider gates only; it does not issue a private SearXNG query or run capture/extraction.',
      'Paid providers require a separate future approval, secret policy, and cost-control phase.',
    ],
  }
}
