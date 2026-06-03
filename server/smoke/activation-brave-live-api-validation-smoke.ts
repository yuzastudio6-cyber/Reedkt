import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  braveLiveApiConfig,
  braveLiveQaGateIds,
  braveLiveRequiredDocs,
  braveLiveRequiredScripts,
  braveLiveSafetyFlags,
  buildBraveLiveApiValidationReport,
  buildBraveLiveBudgetGuard,
  buildBraveLiveCommandPlan,
  buildBraveLiveIamPlan,
  buildBraveLiveQueryPlan,
  buildBraveLiveSourceManifest,
  buildBraveLiveStorageGuard,
  normalizeBraveLiveResults,
  validateBraveLiveApiValidationEnv,
} from '../activation/brave-live-api-validation'

assert.equal(braveLiveApiConfig.phase, '49L')
assert.equal(braveLiveApiConfig.provider, 'brave_search')
assert.equal(braveLiveApiConfig.mode, 'controlled_live_api_validation')
assert.equal(braveLiveApiConfig.endpoint, 'https://api.search.brave.com/res/v1/web/search')
assert.equal(braveLiveApiConfig.maxResults, 5)
assert.equal(braveLiveApiConfig.maxQueriesPerRun, 1)
assert.equal(braveLiveSafetyFlags.braveEnabledByDefault, false)
assert.equal(braveLiveSafetyFlags.searxngDefaultProvider, true)
assert.equal(braveLiveSafetyFlags.liveBraveApiAllowedInPhase49L, true)
assert.equal(braveLiveSafetyFlags.otherPaidProvidersAllowed, false)
assert.equal(braveLiveSafetyFlags.rawBraveResponseStorageAllowed, false)
assert.equal(braveLiveSafetyFlags.braveSnippetStorageAllowed, false)
assert.equal(braveLiveSafetyFlags.browserCaptureAllowed, false)
assert.equal(braveLiveSafetyFlags.readabilityExtractionAllowed, false)
assert.equal(braveLiveSafetyFlags.productionReadyAllowed, false)
assert.equal(braveLiveSafetyFlags.externalBetaAllowed, false)
assert.equal(braveLiveSafetyFlags.broadMediaAllowed, false)

const plannedValidation = validateBraveLiveApiValidationEnv()
assert.equal(plannedValidation.allowed, false)
assert.ok(plannedValidation.blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION')))
assert.ok(plannedValidation.blockers.some((blocker) => blocker.includes('BRAVE_SEARCH_ENABLED')))

const validEnv = validateBraveLiveApiValidationEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  braveSearchEnabled: 'true',
  dailyLimit: '1',
  monthlyBudgetUsd: '1',
  maxResults: '5',
  maxQueriesPerRun: '1',
  storeRawResults: 'false',
  storeSnippets: 'false',
  secretConfigured: true,
})
assert.equal(validEnv.allowed, true)

const budget = buildBraveLiveBudgetGuard({
  dailyLimit: '1',
  monthlyBudgetUsd: '1',
  maxResults: '5',
  maxQueriesPerRun: '1',
})
assert.equal(budget.passed, true)
assert.equal(budget.estimatedCallCount, 1)
assert.equal(budget.retriesAllowed, 0)

const defaultBudget = buildBraveLiveBudgetGuard()
assert.equal(defaultBudget.passed, false)

const plan = buildBraveLiveQueryPlan('phase49l-smoke')
assert.equal(plan.approvedPlanSnapshot, true)
assert.equal(plan.rawPromptExecution, false)
assert.equal(plan.rawBraveResponseStorageAllowed, false)
assert.equal(plan.braveSnippetStorageAllowed, false)
assert.equal(plan.browserCaptureAllowed, false)
assert.equal(plan.readabilityExtractionAllowed, false)

const normalization = normalizeBraveLiveResults({
  results: [
    { title: 'Brave Search API docs', url: 'https://brave.com/search/api/' },
    { title: 'Unsafe local', url: 'http://127.0.0.1/test' },
  ],
  retrievedAt: '2026-06-03T00:00:00.000Z',
})
assert.equal(normalization.sources.length, 1)
assert.equal(normalization.sources[0]?.provider, 'brave_search')
assert.equal(normalization.sources[0]?.providerMode, 'live_controlled_validation')
assert.equal(normalization.sources[0]?.snippetStored, false)
assert.equal(normalization.sources[0]?.captureAllowed, false)
assert.equal(normalization.sources[0]?.extractionAllowed, false)
assert.ok(normalization.warnings.some((warning) => warning.includes('Rejected Brave live result')))

const storageGuard = buildBraveLiveStorageGuard({
  rawResponseStorage: 'false',
  snippetStorage: 'false',
  normalizedSourceCount: 1,
})
assert.equal(storageGuard.passed, true)
assert.equal(storageGuard.rawResponseStored, false)
assert.equal(storageGuard.snippetsStored, false)
assert.equal(storageGuard.storageRightsApproved, false)

const manifest = buildBraveLiveSourceManifest({
  runId: 'phase49l-smoke',
  sources: normalization.sources,
  budget,
  secret: {
    configured: true,
    source: 'google_secret_manager',
    secretName: 'BRAVE_SEARCH_API_KEY',
    secretVersion: 'latest',
    secretValuePrinted: false,
    secretValueStored: false,
    frontendExposure: false,
    blockers: [],
    warnings: [],
  },
  actualCallCount: 1,
  warnings: [],
  blockers: [],
})
assert.equal(manifest.generatedFixture, false)
assert.equal(manifest.liveProviderCallUsed, true)
assert.equal(manifest.rawProviderResponseStored, false)
assert.equal(manifest.snippetStored, false)
assert.equal(manifest.storageRightsApproved, false)

const commandPlan = buildBraveLiveCommandPlan()
assert.ok(commandPlan.some((command) => command.commandId === 'phase49l-live-validation-execution' && command.requiresConfirmation))
assert.ok(commandPlan.some((command) => command.commandId === 'raw-brave-response-storage' && command.allowedInPhase49L === false))
assert.ok(commandPlan.every((command) => command.commandId !== 'other-paid-provider-call' || command.commandString === null))

const iamPlan = buildBraveLiveIamPlan()
assert.equal(iamPlan.length, 4)
assert.ok(iamPlan.some((binding) => binding.role === 'roles/storage.objectCreator' && binding.conditionExpression?.includes('/activation-web-search/phase49l/')))
assert.ok(iamPlan.some((binding) => binding.role === 'roles/secretmanager.secretAccessor'))
assert.ok(iamPlan.every((binding) => binding.reportOnly))

for (const doc of braveLiveRequiredDocs) assert.ok(existsSync(doc), `missing ${doc}`)
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>
for (const script of braveLiveRequiredScripts) assert.ok(scripts[script], `missing script ${script}`)

const policyText = [
  'server/activation/brave-live-api-validation/brave-live-secret-resolver.ts',
  'docs/activation-brave-live-api-validation-policy.md',
  'docs/activation-phase-49l-brave-live-api-validation-results.md',
].map((file) => existsSync(file) ? readFileSync(file, 'utf8') : '').join('\n')
assert.ok(!/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(policyText), 'must not contain a Brave API key value')
assert.ok(!/X-Subscription-Token:\s*(?!<|redacted)[A-Za-z0-9_-]{12,}/.test(policyText), 'must not contain a Brave API token value')

const report = buildBraveLiveApiValidationReport()
assert.equal(report.phase, '49L')
assert.equal(report.rawBraveStorageAllowed, false)
assert.equal(report.snippetsStored, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), braveLiveQaGateIds)
assert.ok(report.phase49MReadiness === 'ready_for_searxng_brave_hybrid_consensus_e2e' || report.phase49MReadiness === 'blocked')

console.log('Phase 49L Brave controlled live API validation smoke passed.')
