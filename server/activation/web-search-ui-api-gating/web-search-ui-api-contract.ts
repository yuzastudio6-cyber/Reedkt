import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness'
import { webSearchUiApiGatingConfig } from './web-search-ui-api-gating-policy'
import type {
  WebSearchUiApiPlanSnapshot,
  WebSearchUiApiRequest,
  WebSearchUiApiRouteAudit,
  WebSearchUiApiRouteGate,
  WebSearchUiApiRunEnvelope,
} from './web-search-ui-api-gating-types'
import { validateWebSearchUiApiRequest } from './web-search-ui-api-request-validator'

export const webSearchUiApiRouteGates: WebSearchUiApiRouteGate[] = [
  route('webSearch.internal.status', 'GET', '/v1/internal/web-search/status'),
  route('webSearch.internal.plan', 'POST', '/v1/internal/web-search/plans'),
  route('webSearch.internal.runControlled', 'POST', '/v1/internal/web-search/run-controlled'),
  route('webSearch.internal.runStatus', 'GET', '/v1/internal/web-search/runs/:runId'),
]

export function buildWebSearchUiApiRouteAudit(): WebSearchUiApiRouteAudit {
  const blockers = webSearchUiApiRouteGates.flatMap((entry) => entry.blockers)
  const warnings = webSearchUiApiRouteGates.flatMap((entry) => entry.warnings)
  return {
    routes: webSearchUiApiRouteGates.map((entry) => ({ ...entry, blockers: [...entry.blockers], warnings: [...entry.warnings] })),
    allRoutesGateOnly: webSearchUiApiRouteGates.every((entry) =>
      entry.authenticated &&
      entry.internalOnly &&
      !entry.liveSearchAllowed &&
      !entry.browserCaptureAllowed &&
      !entry.paidProvidersAllowed &&
      !entry.publicSearxngAllowed &&
      entry.status === 'enabled_gate_only',
    ),
    blockers,
    warnings,
  }
}

export function buildDefaultWebSearchUiApiRequest(): WebSearchUiApiRequest {
  const validation = validateWebSearchUiApiRequest({})
  if (!validation.ok || !validation.request) {
    throw new Error(validation.blockers.join('\n'))
  }
  return validation.request
}

export function buildWebSearchUiApiPlanSnapshot(input: {
  request?: WebSearchUiApiRequest
  planId?: string
  createdAt?: string
} = {}): WebSearchUiApiPlanSnapshot {
  const request = input.request ?? buildDefaultWebSearchUiApiRequest()
  return {
    planId: input.planId ?? `phase49i-ui-api-plan-${request.providerMode}`,
    phase: '49I',
    provider: 'searxng',
    providerMode: request.providerMode,
    serviceName: webSearchUiApiGatingConfig.serviceName,
    query: request.query,
    maxResults: request.maxResults,
    maxCapturePages: 0,
    apiGateOnly: true,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionAllowed: false,
    paidProvidersAllowed: false,
    publicSearxngAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptExecution: false,
    approvedPlanSnapshot: true,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

export function buildWebSearchUiApiRunEnvelope(input: {
  runId?: string
  planSnapshot?: WebSearchUiApiPlanSnapshot
} = {}): WebSearchUiApiRunEnvelope {
  const planSnapshot = input.planSnapshot ?? buildWebSearchUiApiPlanSnapshot()
  return {
    runId: input.runId ?? 'phase49i-gate-only-run',
    status: 'accepted_gate_only',
    planSnapshot,
    apiExecuted: true,
    liveSearchExecuted: false,
    browserCaptureExecuted: false,
    readabilityExtractionExecuted: false,
    paidProviderUsed: false,
    publicSearxngUsed: false,
    arbitraryUrlCaptureUsed: false,
    artifactUploadPlannedOnly: true,
    warnings: [
      'Phase 49I run-controlled is an internal API gate contract only; it does not call SearXNG, Playwright, Sharp, Readability, providers, or storage.',
    ],
  }
}

export function buildWebSearchUiApiStatus() {
  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  const routeAudit = buildWebSearchUiApiRouteAudit()
  return {
    phase: '49I',
    status: phase49H.webSearchCaptureInternalTestingReady && routeAudit.allRoutesGateOnly ? 'ready_internal_gate_only' : 'blocked',
    phase49HRunId: phase49H.runId,
    privateSearxngService: webSearchUiApiGatingConfig.serviceName,
    defaultProvider: 'searxng',
    providerMode: 'private_fixture_provider',
    internalApiRoutesReady: routeAudit.allRoutesGateOnly,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionAllowed: false,
    paidProvidersAllowed: false,
    publicSearxngAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    warnings: [
      ...phase49H.warnings,
      'API routes are internal, authenticated, and gate-only in Phase 49I.',
    ],
    blockers: [...phase49H.blockers, ...routeAudit.blockers],
  }
}

function route(routeId: string, method: 'GET' | 'POST', path: string): WebSearchUiApiRouteGate {
  return {
    routeId,
    method,
    path,
    authenticated: true,
    internalOnly: true,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    paidProvidersAllowed: false,
    publicSearxngAllowed: false,
    status: 'enabled_gate_only',
    blockers: [],
    warnings: ['Phase 49I route is contract/gate-only and cannot execute live search/capture/extraction.'],
  }
}
