import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildApprovedReadabilityExtractionPlanSnapshot,
  buildGeneratedLocalArticleFixture,
  buildReadabilityExtractionCommandPlan,
  buildReadabilityExtractionIamPlan,
  buildReadabilityExtractionQaSummary,
  buildReadabilityExtractionReport,
  normalizeReadabilityExtraction,
  readabilityExtractionConfig,
  readabilityExtractionQaGateIds,
  readabilityExtractionRequiredDocs,
  readabilityExtractionRequiredScripts,
  readabilityExtractionSafetyFlags,
  runReadabilityExtractionFromHtml,
  sanitizeReadabilityExtraction,
  validateReadabilityExtractionFixtureExecutionEnv,
} from '../activation/readability-extraction-fixture'
import { buildPlaywrightSharpCaptureReport } from '../activation/playwright-sharp-capture-fixture'

const phase49C = buildPlaywrightSharpCaptureReport()
const planSnapshot = buildApprovedReadabilityExtractionPlanSnapshot('phase49d-smoke')
const html = buildGeneratedLocalArticleFixture()
const rawExtraction = runReadabilityExtractionFromHtml(html)
const sanitizedExtraction = sanitizeReadabilityExtraction(rawExtraction)
const normalizedRecord = normalizeReadabilityExtraction({
  runId: 'phase49d-smoke',
  rawExtraction,
  sanitizedExtraction,
  sanitizedHtmlPath: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-smoke/extraction/extracted-article-sanitized.json',
  textPath: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-smoke/extraction/extracted-article-text.txt',
})
const qa = buildReadabilityExtractionQaSummary({ planSnapshot })
const report = buildReadabilityExtractionReport()

assert.equal(readabilityExtractionConfig.phase, '49D')
assert.equal(readabilityExtractionConfig.projectId, 'reeditpro')
assert.equal(readabilityExtractionConfig.region, 'us-central1')
assert.equal(readabilityExtractionConfig.env, 'staging')
assert.equal(readabilityExtractionConfig.fixtureMode, 'generated_local_html_readability_extraction')
assert.equal(readabilityExtractionConfig.approvedPhase49CRunId, 'phase49c-20260602T022008')
assert.equal(phase49C.status, 'completed')
assert.equal(phase49C.phase49DReadiness, 'ready_for_readability_extraction_fixture')
assert.equal(phase49C.publicWebCaptureAllowed, false)

assert.ok(html.includes('ReeditPro internal source extraction fixture'))
assert.ok(html.includes('generated fixture'))
assert.ok(html.includes('no live web'))
assert.ok(html.includes('no paid providers'))
assert.ok(html.includes('no public extraction'))
assert.ok(html.includes('Sidebar clutter'))
assert.equal(/<script/i.test(html), false)
assert.equal(/<iframe/i.test(html), false)
assert.equal(/<img/i.test(html), false)
assert.equal(/fonts\\.googleapis|cdn\\.|analytics/i.test(html), false)

assert.equal(rawExtraction.fixtureMode, readabilityExtractionConfig.fixtureMode)
assert.ok(rawExtraction.title.includes('ReeditPro internal source extraction fixture'))
assert.ok(rawExtraction.textContent.length > 600)
assert.equal(rawExtraction.publicWebExtractionUsed, false)
assert.equal(rawExtraction.liveSearchUsed, false)
assert.equal(rawExtraction.paidProviderUsed, false)
assert.equal(rawExtraction.browserCaptureUsed, false)

assert.equal(sanitizedExtraction.displaySafe, true)
assert.equal(sanitizedExtraction.rawExtractionDisplaySafe, false)
assert.ok(sanitizedExtraction.wordCount > 100)
assert.equal(/<script|<iframe|on[a-z]+=|javascript:|data:|file:/i.test(sanitizedExtraction.sanitizedHtml), false)

assert.ok(normalizedRecord.extractionId.startsWith('phase49d-extraction-phase49d-smoke'))
assert.equal(normalizedRecord.sourceId, 'phase49d-generated-local-article-source')
assert.equal(normalizedRecord.generatedFixture, true)
assert.equal(normalizedRecord.publicWebExtractionUsed, false)
assert.equal(normalizedRecord.liveSearchUsed, false)
assert.equal(normalizedRecord.paidProviderUsed, false)
assert.ok(normalizedRecord.textContentPreview.length > 100)

assert.equal(planSnapshot.approvedPlanSnapshot, true)
assert.equal(planSnapshot.rawPromptExecution, false)
assert.equal(planSnapshot.liveSearchAllowed, false)
assert.equal(planSnapshot.publicWebExtractionAllowed, false)
assert.equal(planSnapshot.browserCaptureAllowed, false)
assert.equal(planSnapshot.paidProviderAllowed, false)
assert.equal(planSnapshot.publicArtifactAllowed, false)
assert.ok(planSnapshot.outputPrefixes.generatedAssets.includes('/activation-web-search/phase49d/'))
assert.ok(planSnapshot.outputPrefixes.qaArtifacts.includes('/activation-web-search/phase49d/'))

assert.equal(readabilityExtractionSafetyFlags.localOnlyExtractionAllowed, true)
assert.equal(readabilityExtractionSafetyFlags.publicWebExtractionAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.liveSearchAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.paidProvidersAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.browserCaptureAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.playwrightAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.sharpProcessingAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.readabilityExtractionAllowedForGeneratedLocalFixture, true)
assert.equal(readabilityExtractionSafetyFlags.productionReadyAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.externalBetaAllowed, false)
assert.equal(readabilityExtractionSafetyFlags.broadRealMediaAllowed, false)

assert.equal(validateReadabilityExtractionFixtureExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  fixtureMode: 'generated_local_html_readability_extraction',
  liveSearchAllowed: 'false',
  paidProvidersAllowed: 'false',
  publicWebExtractionAllowed: 'false',
  browserCaptureAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)
assert.equal(validateReadabilityExtractionFixtureExecutionEnv({ confirmation: 'false' }).allowed, false)

const iamPlan = buildReadabilityExtractionIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.reportOnly))
assert.ok(iamPlan.every((plan) => plan.role === 'roles/storage.objectCreator'))
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('/objects/activation-web-search/phase49d/')))
assert.ok(iamPlan.every((plan) => !plan.commandString.includes('allUsers') && !plan.commandString.includes('storage.admin') && !plan.commandString.includes('storage.objectAdmin')))

const commandPlan = buildReadabilityExtractionCommandPlan()
assert.ok(commandPlan.some((plan) => plan.commandId === 'phase49d-generated-local-extraction-execution' && plan.requiresConfirmation))
assert.ok(!JSON.stringify(commandPlan).includes('LIVE_SEARCH_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PUBLIC_WEB_EXTRACTION_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('BROWSER_CAPTURE_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))

assert.deepEqual(qa.gates.map((gate) => gate.gateId), readabilityExtractionQaGateIds)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), readabilityExtractionQaGateIds)
assert.ok(['blocked_pending_phase49d_execution', 'ready_for_controlled_private_web_search_capture_e2e', 'blocked'].includes(report.phase49EReadiness))
assert.equal(report.liveSearchAllowed, false)
assert.equal(report.publicWebExtractionAllowed, false)
assert.equal(report.browserCaptureAllowed, false)
assert.equal(report.readabilityExtractionLimitedToLocalFixture, true)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)

for (const doc of readabilityExtractionRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
for (const script of readabilityExtractionRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)
assert.ok(packageJson.dependencies?.['@mozilla/readability'], '@mozilla/readability dependency must be present')
assert.ok(packageJson.dependencies?.jsdom, 'jsdom dependency must be present')
assert.ok(packageJson.devDependencies?.['@types/jsdom'], '@types/jsdom dependency must be present')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49c_evidence',
    'fixture_mode',
    'local_article_fixture_safety',
    'readability_extraction',
    'sanitization',
    'normalization',
    'command_plan_blocking',
    'private_artifact_prefixes',
    'qa_gates',
    'phase49e_readiness',
    'package_scripts',
  ],
}))
