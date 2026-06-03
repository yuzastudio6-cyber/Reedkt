import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildHybridConsensusManifest,
  buildHybridSearchCommandPlan,
  buildHybridSearchConsensusReport,
  buildHybridSearchIamPlan,
  buildHybridSearchPlanSnapshot,
  buildHybridSearchQaSummary,
  hybridSearchConfig,
  hybridSearchQaGateIds,
  hybridSearchRequiredDocs,
  hybridSearchRequiredScripts,
  hybridSearchSafetyFlags,
  isSafeHybridCaptureUrl,
  mergeDedupeAndRankHybridSources,
  normalizeHybridBraveResults,
  normalizeHybridSearxngResults,
  selectHybridCaptureTargets,
  validateHybridSearchConsensusE2EEnv,
  type HybridConsensusReport,
} from '../activation/hybrid-search-consensus-e2e'
import type {
  BraveLiveApiCallSummary,
  BraveLiveBudgetGuardResult,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
} from '../activation/brave-live-api-validation'
import type { ControlledLiveSearchQueryResponse } from '../activation/controlled-live-search-capture-e2e'

assert.equal(hybridSearchConfig.phase, '49M')
assert.equal(hybridSearchConfig.mode, 'searxng_brave_hybrid_consensus_e2e')
assert.equal(hybridSearchConfig.defaultProvider, 'searxng')
assert.equal(hybridSearchConfig.braveRole, 'optional_paid_confidence_booster')
assert.equal(hybridSearchConfig.query, 'site:docs.searxng.org searxng search api')
assert.equal(hybridSearchConfig.maxQueries, 1)
assert.equal(hybridSearchConfig.maxSearxngResults, 5)
assert.equal(hybridSearchConfig.maxBraveResults, 5)
assert.equal(hybridSearchConfig.maxMergedSources, 8)
assert.equal(hybridSearchConfig.maxCapturePages, 2)
assert.ok(hybridSearchConfig.allowedDomains.includes('docs.searxng.org'))
assert.equal(hybridSearchSafetyFlags.searxngDefaultProvider, true)
assert.equal(hybridSearchSafetyFlags.braveOptionalFallback, true)
assert.equal(hybridSearchSafetyFlags.otherPaidProvidersAllowed, false)
assert.equal(hybridSearchSafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(hybridSearchSafetyFlags.rawBraveResponseStorageAllowed, false)
assert.equal(hybridSearchSafetyFlags.braveSnippetStorageAllowed, false)
assert.equal(hybridSearchSafetyFlags.arbitraryUrlCaptureAllowed, false)
assert.equal(hybridSearchSafetyFlags.productionReadyAllowed, false)
assert.equal(hybridSearchSafetyFlags.externalBetaAllowed, false)
assert.equal(hybridSearchSafetyFlags.broadMediaAllowed, false)

const defaultEnv = validateHybridSearchConsensusE2EEnv()
assert.equal(defaultEnv.allowed, false)
assert.ok(defaultEnv.blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E')))

const validEnv = validateHybridSearchConsensusE2EEnv({
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

const plan = buildHybridSearchPlanSnapshot('phase49m-smoke')
assert.equal(plan.approvedPlanSnapshot, true)
assert.equal(plan.rawPromptExecution, false)
assert.equal(plan.defaultProvider, 'searxng')
assert.equal(plan.storagePolicy.rawBraveResponseStored, false)
assert.equal(plan.storagePolicy.braveSnippetStored, false)
assert.equal(plan.paidProviderBudget.maxBraveQueries, 1)

const response: ControlledLiveSearchQueryResponse = {
  query: hybridSearchConfig.query,
  queriedAt: '2026-06-03T00:00:00.000Z',
  results: [
    { title: 'SearXNG search API', url: 'https://docs.searxng.org/dev/search_api.html', content: 'SearXNG JSON search API documentation.', engine: 'duckduckgo', category: 'general' },
    { title: 'Blocked local', url: 'http://127.0.0.1/private', content: 'Unsafe local URL.' },
  ],
}
const searxng = normalizeHybridSearxngResults({ responses: [response] })
const brave = normalizeHybridBraveResults({
  results: [
    { title: 'SearXNG search API', url: 'https://docs.searxng.org/dev/search_api.html' },
    { title: 'Unsafe local', url: 'http://127.0.0.1/private' },
  ],
  retrievedAt: '2026-06-03T00:00:00.000Z',
})
assert.equal(searxng.sources.length, 1)
assert.equal(brave.sources.length, 1)
assert.equal(brave.sources[0]?.snippetStored, false)
assert.equal(brave.sources[0]?.rawProviderResponseStored, false)

const merged = mergeDedupeAndRankHybridSources({ searxngSources: searxng.sources, braveSources: brave.sources })
assert.equal(merged.mergedSources.length, 1)
assert.equal(merged.duplicateGroups.length, 1)
assert.equal(merged.mergedSources[0]?.providers.includes('searxng'), true)
assert.equal(merged.mergedSources[0]?.providers.includes('brave_search'), true)
assert.equal(merged.consensusReport.searxngDefaultProvider, true)
assert.equal(merged.consensusReport.braveOptionalFallback, true)
assert.equal(merged.consensusReport.rawBraveResponseStored, false)
assert.equal(merged.consensusReport.braveSnippetStored, false)

assert.equal(isSafeHybridCaptureUrl('https://docs.searxng.org/dev/search_api.html'), true)
assert.equal(isSafeHybridCaptureUrl('https://example.com/not-allowed'), false)
assert.equal(isSafeHybridCaptureUrl('javascript:alert(1)'), false)
const selection = selectHybridCaptureTargets({ mergedSources: merged.mergedSources })
assert.equal(selection.selected.length, 1)
assert.equal(selection.selected[0]?.domain, 'docs.searxng.org')

const manifest = buildHybridConsensusManifest({
  runId: 'phase49m-smoke',
  searxngSources: searxng.sources,
  braveSources: brave.sources,
  mergedSources: merged.mergedSources,
  duplicateGroups: merged.duplicateGroups,
  selectedCaptureTargets: selection.selected,
  skippedCaptureTargets: selection.skipped,
  captureRecords: [],
  sharpRecords: [],
  extractionRecords: [],
  warnings: [],
  blockers: [],
})
assert.equal(manifest.defaultProvider, 'searxng')
assert.equal(manifest.braveRole, 'optional_paid_confidence_booster')
assert.equal(manifest.rawBraveResponseStored, false)
assert.equal(manifest.braveSnippetStored, false)
assert.equal(manifest.arbitraryUrlCaptureUsed, false)

const secret: Omit<BraveLiveSecretResolution, 'secretValue'> = {
  configured: true,
  source: 'google_secret_manager',
  secretName: 'BRAVE_SEARCH_API_KEY',
  secretVersion: 'latest',
  secretValuePrinted: false,
  secretValueStored: false,
  frontendExposure: false,
  blockers: [],
  warnings: [],
}
const secretMetadata: BraveLiveSecretMetadata = {
  secretConfigured: true,
  secretName: 'BRAVE_SEARCH_API_KEY',
  projectId: 'reeditpro',
  secretVersion: 'latest',
  versionEnabled: true,
  approvedServiceAccountsHaveAccess: true,
  approvedServiceAccounts: ['serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com'],
  missingServiceAccounts: [],
  publicAccessDetected: false,
  broadAccessDetected: false,
  iamChanges: [],
  blockers: [],
  warnings: [],
}
const budget: BraveLiveBudgetGuardResult = {
  passed: true,
  dailyLimit: 1,
  monthlyBudgetUsd: 1,
  maxResults: 5,
  maxQueriesPerRun: 1,
  estimatedCallCount: 1,
  retriesAllowed: 0,
  blockers: [],
  warnings: [],
}
const braveApiCall: BraveLiveApiCallSummary = {
  attempted: true,
  completed: true,
  endpoint: hybridSearchConfig.braveEndpoint,
  method: 'GET',
  statusCode: 200,
  resultCount: 1,
  callCount: 1,
  requestHeadersStored: false,
  secretValuePrinted: false,
  rawResponseStored: false,
  snippetsStored: false,
  disallowedEndpointUsed: false,
}
const consensusReport: HybridConsensusReport = merged.consensusReport
const qa = buildHybridSearchQaSummary({
  phase49LEvidenceOk: true,
  secret,
  secretMetadata,
  budget,
  braveApiCall,
  searxngSources: searxng.sources,
  braveSources: brave.sources,
  mergedSources: merged.mergedSources,
  consensusReport,
  captureRecords: [],
  sharpRecords: [],
  extractionRecords: [],
  manifest,
  blockers: [],
})
assert.ok(qa.gates.some((gate) => gate.gateId === 'dedupe_consensus'))
assert.equal(hybridSearchQaGateIds.length, 13)

const commandPlan = buildHybridSearchCommandPlan()
assert.ok(commandPlan.some((entry) => entry.commandId === 'phase49m-execute-hybrid-e2e' && entry.allowedInPhase49M))
assert.ok(commandPlan.some((entry) => entry.commandId === 'raw-brave-response-storage' && !entry.allowedInPhase49M))
assert.ok(buildHybridSearchIamPlan().every((entry) => entry.reportOnly))

const report = buildHybridSearchConsensusReport()
assert.equal(report.reportId, 'activation-phase-49m-hybrid-search-consensus-e2e')
assert.equal(report.searxngDefaultProvider, true)
assert.equal(report.braveOptionalFallback, true)
assert.equal(report.rawBraveStorageAllowed, false)
assert.equal(report.snippetsStored, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of hybridSearchRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing script ${script}`)
for (const doc of hybridSearchRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)

console.log('Phase 49M hybrid search consensus E2E smoke passed.')
