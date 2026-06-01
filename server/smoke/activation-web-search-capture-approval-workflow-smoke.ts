import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildWebSearchCaptureApprovalReport,
  buildWebSearchCommandPlans,
  buildWebSearchLicenseReviews,
  buildWebSearchProviderScope,
  buildWebSearchRiskRegister,
  buildWebSearchToolEvidence,
  validateWebSearchCaptureApprovalStaticEnv,
  webSearchCaptureApprovalConfig,
  webSearchCaptureQaGateIds,
  webSearchCaptureRequiredDocs,
  webSearchCaptureRequiredScripts,
} from '../activation/web-search-capture-approval'

const tools = buildWebSearchToolEvidence()
const toolIds = new Set(tools.map((tool) => tool.toolId))
const providerScope = buildWebSearchProviderScope()
const risks = buildWebSearchRiskRegister()
const licenseReviews = buildWebSearchLicenseReviews()
const commandPlans = buildWebSearchCommandPlans()
const report = buildWebSearchCaptureApprovalReport()

assert.equal(webSearchCaptureApprovalConfig.phase, '49A')
assert.equal(webSearchCaptureApprovalConfig.projectId, 'reeditpro')
assert.equal(webSearchCaptureApprovalConfig.region, 'us-central1')
assert.equal(webSearchCaptureApprovalConfig.env, 'staging')
assert.equal(webSearchCaptureApprovalConfig.runtimeMode, 'web_search_capture_approval_static')

for (const toolId of ['searxng', 'playwright', 'sharp', 'mozilla-readability', 'brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase'] as const) {
  assert.ok(toolIds.has(toolId), `missing tool evidence ${toolId}`)
}

for (const toolId of ['searxng', 'playwright', 'sharp', 'mozilla-readability'] as const) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  assert.ok(tool?.defaultStack, `${toolId} must be in the free/open-source default planning stack`)
  assert.equal(tool.providerAllowed, false)
  assert.ok(tool.sourceUrls.length > 0)
}

for (const toolId of ['brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase'] as const) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  assert.ok(tool?.optionalPaidProvider, `${toolId} must be optional paid provider`)
  assert.equal(tool.disabledByDefault, true)
  assert.equal(tool.requiresSecret, true)
  assert.equal(tool.notOpenSourceDefault, true)
  assert.equal(tool.notRequiredForInitialInternalTesting, true)
  assert.equal(tool.providerAllowed, false)
  assert.equal(tool.futureApprovalRequired, true)
}

assert.equal(licenseReviews.length, tools.length)
assert.ok(licenseReviews.every((review) => review.runtimeDecision === 'blocked_in_phase49a'))
assert.equal(providerScope.searxngPlanningAllowed, true)
assert.equal(providerScope.playwrightPlanningAllowed, true)
assert.equal(providerScope.sharpPlanningAllowed, true)
assert.equal(providerScope.readabilityPlanningAllowed, true)
assert.equal(providerScope.liveSearchAllowed, false)
assert.equal(providerScope.browserCaptureAllowed, false)
assert.equal(providerScope.screenshotProcessingAllowed, false)
assert.equal(providerScope.readabilityExtractionAllowed, false)
assert.equal(providerScope.braveSearchAllowed, false)
assert.equal(providerScope.tavilyAllowed, false)
assert.equal(providerScope.exaAllowed, false)
assert.equal(providerScope.firecrawlAllowed, false)
assert.equal(providerScope.hostedBrowserAllowed, false)
assert.equal(providerScope.providerAllowed, false)
assert.equal(providerScope.frontendHoldsSearchSecrets, false)
assert.equal(providerScope.frontendRunsHeavyBrowserAutomation, false)
assert.equal(providerScope.workerExecutesRawChat, false)
assert.equal(providerScope.approvedPlanSnapshotsRequired, true)
assert.equal(providerScope.publicArtifactAllowed, false)
assert.equal(providerScope.signedUrlsAsSourceOfTruthAllowed, false)
assert.equal(providerScope.captchaBypassAllowed, false)
assert.equal(providerScope.loginBypassAllowed, false)
assert.equal(providerScope.paywallBypassAllowed, false)
assert.equal(providerScope.robotsTermsBypassAllowed, false)

for (const riskId of ['scraping_behind_login', 'captcha_bypass', 'paywall_bypass', 'robots_terms_violation', 'copyrighted_full_content_storage', 'unsafe_html_script_injection', 'api_key_or_provider_secret_leak', 'public_artifact_exposure', 'signed_url_source_of_truth', 'unbounded_crawling', 'missing_attribution_citation', 'hallucinated_source_summary', 'frontend_secret_exposure', 'browser_worker_runaway_cost_timeout', 'unmanaged_screenshot_storage', 'unsafe_user_supplied_url_capture']) {
  assert.ok(risks.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `missing blocker risk ${riskId}`)
}
assert.ok(risks.some((risk) => risk.severity === 'warning'))

assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => plan.allowedInPhase49A === false))
assert.ok(commandPlans.every((plan) => plan.executableCommand === null))
assert.ok(commandPlans.every((plan) => plan.blockedReason.length > 0))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))

assert.equal(validateWebSearchCaptureApprovalStaticEnv({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  revideoEnabled: 'false',
}).allowed, true)
assert.equal(validateWebSearchCaptureApprovalStaticEnv({ productionReady: 'true' }).allowed, false)

assert.equal(report.status, 'approval_review_complete')
assert.equal(report.codexDecision, 'staging_planning_approved_free_open_source_default')
assert.equal(report.phase49BReadiness, 'ready_for_private_generated_fixture_planning_only')
assert.equal(report.liveSearchAllowed, false)
assert.equal(report.browserCaptureAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), webSearchCaptureQaGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)

for (const doc of webSearchCaptureRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
for (const script of webSearchCaptureRequiredScripts) assert.ok(scripts[script], `missing package script ${script}`)
assert.equal(scripts['activation:web-search-capture-approval:plan'], 'tsx server/cli/activation-web-search-capture-approval-plan.ts')
assert.equal(scripts['activation:web-search-capture-approval:report'], 'tsx server/cli/activation-web-search-capture-approval-report.ts')
assert.equal(scripts['activation:web-search-tool:summary'], 'tsx server/cli/activation-web-search-tool-summary.ts')
assert.equal(scripts['smoke:activation-web-search-capture-approval-workflow'], 'tsx server/smoke/activation-web-search-capture-approval-workflow-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49a_policy',
    'tool_evidence',
    'license_review',
    'free_open_source_default',
    'paid_providers_disabled',
    'frontend_secret_safety',
    'no_live_search',
    'no_browser_execution',
    'risk_register',
    'future_scope',
    'blocked_features',
  ],
}))
