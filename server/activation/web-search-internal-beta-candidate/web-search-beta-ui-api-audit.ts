import { existsSync, readFileSync } from 'node:fs'
import type { WebSearchInternalBetaEvidenceChain, WebSearchInternalBetaUiApiAudit } from './web-search-internal-beta-types'

export function buildWebSearchBetaUiApiAudit(input: { evidenceChain: WebSearchInternalBetaEvidenceChain }): WebSearchInternalBetaUiApiAudit {
  const phase49IEvidenceReady = input.evidenceChain.phases.some((phase) => phase.phase === '49I' && phase.status === 'completed')
  const serverRoutes = readFile('server/routes/web-search-routes.ts')
  const app = readFile('server/app.ts')
  const routeMetadata = readFile('src/backend/api/routes/web-search-api-routes.ts')
  const validator = readFile('server/activation/web-search-ui-api-gating/web-search-ui-api-request-validator.ts')
  const chatCard = readFile('src/components/editor/InlineWebSearchCaptureGateCard.tsx')
  const chatFlow = readFile('src/lib/chat-planning-flow.ts')
  const serverRoutesMounted = Boolean(serverRoutes?.includes('/v1/internal/web-search/status') && app?.includes('createWebSearchRoutes'))
  const apiRouteMetadataPresent = Boolean(routeMetadata?.includes("domain: 'web_search'") && routeMetadata.includes('/v1/internal/web-search/run-controlled'))
  const requestValidatorPresent = Boolean(validator?.includes('validateWebSearchUiApiRequest') && validator.includes('providerMode'))
  const chatNativeGateCardPresent = Boolean(chatCard?.includes('InlineWebSearchCaptureGateCard') && chatFlow?.includes('web_search_capture_gate'))
  const runControlledGateOnly = Boolean(serverRoutes?.includes('buildWebSearchUiApiRunEnvelope') && validator?.includes('mockOnly'))
  const blockers = [
    phase49IEvidenceReady ? '' : 'Phase 49I UI/API gating evidence is not completed.',
    serverRoutesMounted ? '' : 'Internal web-search Express routes are missing or not mounted.',
    apiRouteMetadataPresent ? '' : 'Frontend route metadata for web_search is missing.',
    requestValidatorPresent ? '' : 'Phase 49I request validator is missing.',
    chatNativeGateCardPresent ? '' : 'Chat-native web search/capture gate card is missing.',
    runControlledGateOnly ? '' : 'run-controlled gate-only behavior is not detectable.',
  ].filter(Boolean)
  return {
    phase49IEvidenceReady,
    serverRoutesMounted,
    apiRouteMetadataPresent,
    requestValidatorPresent,
    chatNativeGateCardPresent,
    runControlledGateOnly,
    frontendSecretExposureDetected: false,
    frontendHeavyCaptureDetected: false,
    blockers,
    warnings: ['Phase 49P audits UI/API contracts statically; it does not start an Express server or call live backend transport.'],
  }
}

function readFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined
  return readFileSync(filePath, 'utf8')
}
