import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildDefaultWebSearchUiApiRequest,
  buildWebSearchUiApiCommandPlan,
  buildWebSearchUiApiGatingReport,
  buildWebSearchUiApiIamPlan,
  buildWebSearchUiApiPlanSnapshot,
  buildWebSearchUiApiRouteAudit,
  buildWebSearchUiApiRunEnvelope,
  buildWebSearchUiApiUxState,
  validateWebSearchUiApiRequest,
  validateWebSearchUiApiStaticPolicy,
  webSearchUiApiGatingConfig,
  webSearchUiApiGatingSafetyFlags,
  webSearchUiApiQaGateIds,
} from '../activation/web-search-ui-api-gating'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const scripts = packageJson.scripts ?? {}

assert.equal(webSearchUiApiGatingConfig.phase, '49I')
assert.equal(webSearchUiApiGatingConfig.canonicalPhase49HRunId, 'phase49h-20260603T020009')
assert.equal(webSearchUiApiGatingConfig.serviceName, 'reeditpro-staging-private-searxng')
assert.equal(webSearchUiApiGatingSafetyFlags.internalApiRoutesAllowed, true)
assert.equal(webSearchUiApiGatingSafetyFlags.internalUxGateAllowed, true)
assert.equal(webSearchUiApiGatingSafetyFlags.liveSearchAllowed, false)
assert.equal(webSearchUiApiGatingSafetyFlags.browserCaptureAllowed, false)
assert.equal(webSearchUiApiGatingSafetyFlags.readabilityExtractionAllowed, false)
assert.equal(webSearchUiApiGatingSafetyFlags.paidProviderAllowed, false)
assert.equal(webSearchUiApiGatingSafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(webSearchUiApiGatingSafetyFlags.productionReadyAllowed, false)
assert.equal(validateWebSearchUiApiStaticPolicy().ok, true)

for (const script of [
  'activation:web-search-ui-api-gating',
  'activation:web-search-ui-api-gating:report',
  'activation:web-search-ui-api-gating:iam-plan',
  'smoke:activation-web-search-ui-api-gating',
]) {
  assert.ok(scripts[script], `${script} script must exist`)
}

const routeAudit = buildWebSearchUiApiRouteAudit()
assert.equal(routeAudit.routes.length, 4)
assert.equal(routeAudit.allRoutesGateOnly, true)
assert.ok(routeAudit.routes.every((route) => route.authenticated && route.internalOnly))
assert.ok(routeAudit.routes.every((route) => !route.liveSearchAllowed && !route.browserCaptureAllowed && !route.paidProvidersAllowed && !route.publicSearxngAllowed))

const request = buildDefaultWebSearchUiApiRequest()
assert.equal(request.providerMode, 'private_fixture_provider')
assert.equal(request.mockOnly, true)
assert.equal(request.maxCapturePages, 0)
assert.equal(validateWebSearchUiApiRequest(request).ok, true)
assert.equal(validateWebSearchUiApiRequest({ ...request, paidProvidersAllowed: true }).ok, false)
assert.equal(validateWebSearchUiApiRequest({ ...request, publicSearxngAllowed: true }).ok, false)
assert.equal(validateWebSearchUiApiRequest({ ...request, liveSearchRequested: true }).ok, false)
assert.equal(validateWebSearchUiApiRequest({ ...request, browserExecutionRequested: true }).ok, false)
assert.equal(validateWebSearchUiApiRequest({ ...request, maxResults: 4 }).ok, false)

const planSnapshot = buildWebSearchUiApiPlanSnapshot({ request })
assert.equal(planSnapshot.apiGateOnly, true)
assert.equal(planSnapshot.liveSearchAllowed, false)
assert.equal(planSnapshot.browserCaptureAllowed, false)
assert.equal(planSnapshot.paidProvidersAllowed, false)
assert.equal(planSnapshot.rawPromptExecution, false)

const runEnvelope = buildWebSearchUiApiRunEnvelope({ planSnapshot })
assert.equal(runEnvelope.status, 'accepted_gate_only')
assert.equal(runEnvelope.liveSearchExecuted, false)
assert.equal(runEnvelope.browserCaptureExecuted, false)
assert.equal(runEnvelope.readabilityExtractionExecuted, false)
assert.equal(runEnvelope.publicSearxngUsed, false)

const uxState = buildWebSearchUiApiUxState()
assert.equal(uxState.cardId, 'web_search_capture_gate')
assert.equal(uxState.defaultProvider, 'searxng')
assert.equal(uxState.providerMode, 'private_fixture_provider')
assert.equal(uxState.frontendSecretSafe, true)
assert.equal(uxState.frontendHeavyExecutionAllowed, false)
assert.ok(uxState.blockedControls.includes('Live search query'))
assert.ok(uxState.blockedControls.includes('Production, external beta, paid production, or broad media unlock'))

const commandPlan = buildWebSearchUiApiCommandPlan()
for (const blocked of ['live-search-query', 'browser-capture', 'sharp-processing', 'readability-extraction', 'paid-provider-call', 'public-searxng-instance', 'arbitrary-url-capture', 'production-beta-unlock']) {
  const command = commandPlan.find((entry) => entry.commandId === blocked)
  assert.ok(command, `${blocked} command plan must exist`)
  assert.equal(command?.allowedInPhase49I, false)
  assert.equal(command?.command, null)
  assert.ok(command?.blockedReason)
}

const iamPlan = buildWebSearchUiApiIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((entry) => entry.role === 'roles/storage.objectCreator' && !entry.broadAccess && entry.prefix === 'activation-web-search/phase49i/'))

const report = buildWebSearchUiApiGatingReport()
assert.equal(report.phase, '49I')
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), webSearchUiApiQaGateIds)
assert.equal(report.safetyFlags.liveSearchAllowed, false)
assert.equal(report.safetyFlags.paidProviderAllowed, false)
assert.equal(report.safetyFlags.productionReadyAllowed, false)

for (const doc of [
  'docs/activation-web-search-ui-api-gating-runbook.md',
  'docs/activation-web-search-ui-api-gating-policy.md',
  'docs/activation-web-search-ui-api-gating-qa-policy.md',
  'docs/activation-phase-49i-web-search-ui-api-gating-results.md',
]) {
  assert.ok(existsSync(doc), `${doc} must exist`)
}

console.log('Phase 49I web search/capture UI API gating smoke passed.')
