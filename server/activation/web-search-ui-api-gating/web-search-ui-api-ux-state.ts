import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness'
import { webSearchUiApiGatingConfig } from './web-search-ui-api-gating-policy'
import type { WebSearchUiApiUxState } from './web-search-ui-api-gating-types'

export function buildWebSearchUiApiUxState(): WebSearchUiApiUxState {
  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  const ready = phase49H.webSearchCaptureInternalTestingReady && phase49H.phase49IReadiness === 'ready_for_ui_api_integration_internal_ux_gating'
  return {
    cardId: 'web_search_capture_gate',
    title: 'Web search/capture gate',
    phase: '49I',
    internalUxReady: ready,
    status: ready ? 'ready_internal_gate_only' : 'blocked',
    defaultProvider: 'searxng',
    providerMode: 'private_fixture_provider',
    privateSearxngService: webSearchUiApiGatingConfig.serviceName,
    allowedControls: [
      'View internal readiness status',
      'Create validated private-fixture provider plan snapshot',
      'Run gate-only mock API envelope',
    ],
    blockedControls: [
      'Live search query',
      'Public SearXNG instance',
      'Paid provider fallback',
      'Arbitrary URL capture',
      'Browser capture',
      'Sharp screenshot processing',
      'Readability extraction',
      'Public artifacts',
      'Signed URL source of truth',
      'Production, external beta, paid production, or broad media unlock',
    ],
    boundedLimits: {
      maxResults: 3,
      maxCapturePages: 0,
    },
    frontendSecretSafe: true,
    frontendHeavyExecutionAllowed: false,
    warnings: [
      'This UX state is for internal gate display only; frontend code does not hold search/provider secrets and does not run browser automation.',
      ...phase49H.warnings,
    ],
    blockers: [...phase49H.blockers],
  }
}
