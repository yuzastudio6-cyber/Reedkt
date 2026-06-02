import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildApprovedPlaywrightSharpCapturePlanSnapshot,
  buildGeneratedLocalHtmlFixture,
  buildPlaywrightSharpCaptureCommandPlan,
  buildPlaywrightSharpCaptureIamPlan,
  buildPlaywrightSharpCaptureQaSummary,
  buildPlaywrightSharpCaptureReport,
  playwrightSharpCaptureConfig,
  playwrightSharpCaptureQaGateIds,
  playwrightSharpCaptureRequiredDocs,
  playwrightSharpCaptureRequiredScripts,
  playwrightSharpCaptureSafetyFlags,
  validatePlaywrightSharpCaptureFixtureExecutionEnv,
} from '../activation/playwright-sharp-capture-fixture'
import { buildSearxngSearchFixtureReport } from '../activation/searxng-search-fixture'

const phase49B = buildSearxngSearchFixtureReport()
const planSnapshot = buildApprovedPlaywrightSharpCapturePlanSnapshot('phase49c-smoke')
const html = buildGeneratedLocalHtmlFixture()
const qa = buildPlaywrightSharpCaptureQaSummary({ planSnapshot })
const report = buildPlaywrightSharpCaptureReport()

assert.equal(playwrightSharpCaptureConfig.phase, '49C')
assert.equal(playwrightSharpCaptureConfig.projectId, 'reeditpro')
assert.equal(playwrightSharpCaptureConfig.region, 'us-central1')
assert.equal(playwrightSharpCaptureConfig.env, 'staging')
assert.equal(playwrightSharpCaptureConfig.fixtureMode, 'generated_local_html_capture')
assert.equal(playwrightSharpCaptureConfig.approvedPhase49BRunId, 'phase49b-20260602T01332')
assert.equal(phase49B.status, 'completed')
assert.equal(phase49B.phase49CReadiness, 'ready_for_playwright_sharp_generated_capture_fixture')
assert.equal(phase49B.liveSearchAllowed, false)

assert.ok(html.includes('ReeditPro internal web search capture fixture'))
assert.ok(html.includes('generated fixture'))
assert.ok(html.includes('no live search'))
assert.ok(html.includes('no paid providers'))
assert.ok(html.includes('no public web capture'))
assert.equal(/<script/i.test(html), false)
assert.equal(/<iframe/i.test(html), false)
assert.equal(/https?:\/\//i.test(html), false)
assert.equal(/<img/i.test(html), false)

assert.equal(planSnapshot.approvedPlanSnapshot, true)
assert.equal(planSnapshot.rawPromptExecution, false)
assert.equal(planSnapshot.captureUrlType, 'local_fixture_file_url')
assert.equal(planSnapshot.liveSearchAllowed, false)
assert.equal(planSnapshot.publicWebCaptureAllowed, false)
assert.equal(planSnapshot.paidProviderAllowed, false)
assert.equal(planSnapshot.readabilityExtractionAllowed, false)
assert.equal(planSnapshot.publicArtifactAllowed, false)
assert.ok(planSnapshot.outputPrefixes.generatedAssets.includes('/activation-web-search/phase49c/'))
assert.ok(planSnapshot.outputPrefixes.qaArtifacts.includes('/activation-web-search/phase49c/'))

assert.equal(playwrightSharpCaptureSafetyFlags.localOnlyCaptureAllowed, true)
assert.equal(playwrightSharpCaptureSafetyFlags.browserCaptureLimitedToLocalFixture, true)
assert.equal(playwrightSharpCaptureSafetyFlags.publicWebCaptureAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.liveSearchAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.paidProvidersAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.readabilityExtractionAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.sharpProcessingAllowedForGeneratedScreenshot, true)
assert.equal(playwrightSharpCaptureSafetyFlags.productionReadyAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.externalBetaAllowed, false)
assert.equal(playwrightSharpCaptureSafetyFlags.broadRealMediaAllowed, false)

assert.equal(validatePlaywrightSharpCaptureFixtureExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  fixtureMode: 'generated_local_html_capture',
  liveSearchAllowed: 'false',
  paidProvidersAllowed: 'false',
  publicWebCaptureAllowed: 'false',
  readabilityExtractionAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)
assert.equal(validatePlaywrightSharpCaptureFixtureExecutionEnv({ confirmation: 'false' }).allowed, false)

const iamPlan = buildPlaywrightSharpCaptureIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.reportOnly))
assert.ok(iamPlan.every((plan) => plan.role === 'roles/storage.objectCreator'))
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('/objects/activation-web-search/phase49c/')))
assert.ok(iamPlan.every((plan) => !plan.commandString.includes('allUsers') && !plan.commandString.includes('storage.admin') && !plan.commandString.includes('storage.objectAdmin')))

const commandPlan = buildPlaywrightSharpCaptureCommandPlan()
assert.ok(commandPlan.some((plan) => plan.commandId === 'phase49c-generated-local-capture-execution' && plan.requiresConfirmation))
assert.ok(!JSON.stringify(commandPlan).includes('LIVE_SEARCH_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PUBLIC_WEB_CAPTURE_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))

assert.deepEqual(qa.gates.map((gate) => gate.gateId), playwrightSharpCaptureQaGateIds)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), playwrightSharpCaptureQaGateIds)
assert.ok(['blocked_pending_phase49c_execution', 'ready_for_readability_extraction_fixture'].includes(report.phase49DReadiness))
assert.equal(report.liveSearchAllowed, false)
assert.equal(report.publicWebCaptureAllowed, false)
assert.equal(report.browserCaptureLimitedToLocalFixture, true)
assert.equal(report.readabilityExtractionAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)

for (const doc of playwrightSharpCaptureRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string>; dependencies?: Record<string, string> }
for (const script of playwrightSharpCaptureRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)
assert.ok(packageJson.dependencies?.playwright, 'playwright dependency must be present')
assert.ok(packageJson.dependencies?.sharp, 'sharp dependency must be present')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49b_evidence',
    'fixture_mode',
    'local_html_safety',
    'command_plan_blocking',
    'private_artifact_prefixes',
    'qa_gates',
    'phase49d_readiness',
    'package_scripts',
  ],
}))
