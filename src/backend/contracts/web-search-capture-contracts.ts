export type WebSearchUiApiProviderMode = 'private_fixture_provider'

export interface WebSearchUiApiMockRequest {
  query?: string
  providerMode?: WebSearchUiApiProviderMode
  maxResults?: number
  maxCapturePages?: number
  mockOnly?: boolean
  rawPromptExecution?: boolean
  paidProvidersAllowed?: boolean
  publicSearxngAllowed?: boolean
  arbitraryUrlCaptureAllowed?: boolean
  broadCrawlingAllowed?: boolean
  publicArtifactAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  productionReadyAllowed?: boolean
  externalBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  broadMediaAllowed?: boolean
  frontendExecutionRequested?: boolean
  browserExecutionRequested?: boolean
  liveSearchRequested?: boolean
  captureRequested?: boolean
  extractionRequested?: boolean
}

export interface WebSearchUiApiGateState {
  phase: '49I'
  status: 'ready_internal_gate_only' | 'blocked'
  phase49HRunId: string
  privateSearxngService: string
  defaultProvider: 'searxng'
  providerMode: WebSearchUiApiProviderMode
  maxResults: number
  maxCapturePages: 0
  internalApiRoutesReady: boolean
  internalUxGateReady: boolean
  frontendSecretSafe: true
  frontendHeavyExecutionAllowed: false
  liveSearchAllowed: false
  browserCaptureAllowed: false
  readabilityExtractionAllowed: false
  paidProvidersAllowed: false
  publicSearxngAllowed: false
  arbitraryUrlCaptureAllowed: false
  broadCrawlingAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadMediaAllowed: false
  blockedScopes: string[]
  warnings: string[]
  blockers: string[]
}

export interface WebSearchUiApiMockPlan {
  planId: string
  phase: '49I'
  provider: 'searxng'
  providerMode: WebSearchUiApiProviderMode
  apiGateOnly: true
  query: string
  maxResults: number
  maxCapturePages: 0
  rawPromptExecution: false
  liveSearchAllowed: false
  browserCaptureAllowed: false
  paidProvidersAllowed: false
  publicSearxngAllowed: false
  arbitraryUrlCaptureAllowed: false
  approvedPlanSnapshot: true
}

export interface WebSearchUiApiMockRun {
  runId: string
  status: 'accepted_gate_only'
  plan: WebSearchUiApiMockPlan
  liveSearchExecuted: false
  browserCaptureExecuted: false
  readabilityExtractionExecuted: false
  paidProviderUsed: false
  publicSearxngUsed: false
  warnings: string[]
}

export function createMockWebSearchUiApiGateState(): WebSearchUiApiGateState {
  return {
    phase: '49I',
    status: 'ready_internal_gate_only',
    phase49HRunId: 'phase49h-20260603T020009',
    privateSearxngService: 'reeditpro-staging-private-searxng',
    defaultProvider: 'searxng',
    providerMode: 'private_fixture_provider',
    maxResults: 3,
    maxCapturePages: 0,
    internalApiRoutesReady: true,
    internalUxGateReady: true,
    frontendSecretSafe: true,
    frontendHeavyExecutionAllowed: false,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionAllowed: false,
    paidProvidersAllowed: false,
    publicSearxngAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    broadCrawlingAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    blockedScopes: [
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
    warnings: [
      'Internal UI/API gate only; no live search, capture, extraction, provider call, or storage upload is run from the frontend.',
    ],
    blockers: [],
  }
}

export function validateMockWebSearchUiApiRequest(input: WebSearchUiApiMockRequest = {}) {
  const blockers = [
    input.providerMode && input.providerMode !== 'private_fixture_provider' ? 'Only private_fixture_provider is allowed in Phase 49I.' : '',
    input.maxResults !== undefined && input.maxResults > 3 ? 'maxResults must be <= 3.' : '',
    input.maxCapturePages !== undefined && input.maxCapturePages !== 0 ? 'maxCapturePages must be 0.' : '',
    input.mockOnly === false ? 'mockOnly=false is not accepted.' : '',
    input.rawPromptExecution ? 'rawPromptExecution must be false.' : '',
    input.paidProvidersAllowed ? 'paidProvidersAllowed must be false.' : '',
    input.publicSearxngAllowed ? 'publicSearxngAllowed must be false.' : '',
    input.arbitraryUrlCaptureAllowed ? 'arbitraryUrlCaptureAllowed must be false.' : '',
    input.broadCrawlingAllowed ? 'broadCrawlingAllowed must be false.' : '',
    input.publicArtifactAllowed ? 'publicArtifactAllowed must be false.' : '',
    input.signedUrlSourceOfTruthAllowed ? 'signedUrlSourceOfTruthAllowed must be false.' : '',
    input.productionReadyAllowed ? 'productionReadyAllowed must be false.' : '',
    input.externalBetaAllowed ? 'externalBetaAllowed must be false.' : '',
    input.paidProductionAllowed ? 'paidProductionAllowed must be false.' : '',
    input.broadMediaAllowed ? 'broadMediaAllowed must be false.' : '',
    input.frontendExecutionRequested ? 'frontendExecutionRequested must be false.' : '',
    input.browserExecutionRequested ? 'browserExecutionRequested must be false.' : '',
    input.liveSearchRequested ? 'liveSearchRequested must be false.' : '',
    input.captureRequested ? 'captureRequested must be false.' : '',
    input.extractionRequested ? 'extractionRequested must be false.' : '',
  ].filter(Boolean)

  return {
    ok: blockers.length === 0,
    blockers,
    warnings: ['Mock validation only; no backend transport or web runtime is invoked.'],
  }
}

export function createMockWebSearchUiApiPlan(input: WebSearchUiApiMockRequest = {}): WebSearchUiApiMockPlan {
  return {
    planId: 'phase49i-mock-ui-api-gate-plan',
    phase: '49I',
    provider: 'searxng',
    providerMode: 'private_fixture_provider',
    apiGateOnly: true,
    query: input.query ?? 'ReeditPro web search/capture internal gating fixture',
    maxResults: input.maxResults ?? 3,
    maxCapturePages: 0,
    rawPromptExecution: false,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    paidProvidersAllowed: false,
    publicSearxngAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    approvedPlanSnapshot: true,
  }
}

export function createMockWebSearchUiApiRun(input: WebSearchUiApiMockRequest = {}): WebSearchUiApiMockRun {
  return {
    runId: 'phase49i-mock-gate-only-run',
    status: 'accepted_gate_only',
    plan: createMockWebSearchUiApiPlan(input),
    liveSearchExecuted: false,
    browserCaptureExecuted: false,
    readabilityExtractionExecuted: false,
    paidProviderUsed: false,
    publicSearxngUsed: false,
    warnings: ['Run-controlled is gate-only in Phase 49I; no live search/capture/extraction was attempted.'],
  }
}
