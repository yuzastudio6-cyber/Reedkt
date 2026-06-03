import type { WebSearchUiApiRouteGate } from './web-search-ui-api-gating-types'
import { webSearchUiApiRouteGates } from './web-search-ui-api-contract'

export function getWebSearchUiApiRouteGate(routeId: string): WebSearchUiApiRouteGate | undefined {
  const gate = webSearchUiApiRouteGates.find((entry) => entry.routeId === routeId)
  return gate ? { ...gate, blockers: [...gate.blockers], warnings: [...gate.warnings] } : undefined
}

export function assertWebSearchUiApiRouteGate(routeId: string): WebSearchUiApiRouteGate {
  const gate = getWebSearchUiApiRouteGate(routeId)
  if (!gate) throw new Error(`Unknown Phase 49I web search route gate: ${routeId}`)
  if (gate.blockers.length > 0) throw new Error(gate.blockers.join('\n'))
  if (gate.liveSearchAllowed || gate.browserCaptureAllowed || gate.paidProvidersAllowed || gate.publicSearxngAllowed) {
    throw new Error(`Phase 49I route gate ${routeId} is not fail-closed.`)
  }
  return gate
}
