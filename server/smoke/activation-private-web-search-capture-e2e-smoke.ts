import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  buildPrivateFixtureSearchResponse,
  buildPrivateWebE2ECommandPlan,
  buildPrivateWebE2EIamPlan,
  buildPrivateWebE2EManifest,
  buildPrivateWebE2EPlanSnapshot,
  buildPrivateWebE2EQaSummary,
  buildPrivateWebE2EReport,
  normalizePrivateSearchResults,
  privateWebE2EConfig,
  privateWebE2EQaGateIds,
  privateWebE2ERequiredDocs,
  privateWebE2ERequiredScripts,
  privateWebE2ESafetyFlags,
  resolvePrivateSearchProvider,
  validatePrivateSearxngContract,
  validatePrivateWebSearchCaptureE2EExecutionEnv,
  writePrivateFixturePages,
  type PrivateWebCaptureMetadata,
  type PrivateWebE2EArtifact,
  type PrivateWebExtractionRecord,
  type PrivateWebSharpMetadata,
} from '../activation/private-web-search-capture-e2e'

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'phase49e-smoke-'))
const pages = await writePrivateFixturePages(tempRoot)
const providerResolution = resolvePrivateSearchProvider({})
const planSnapshot = buildPrivateWebE2EPlanSnapshot({ runId: 'phase49e-smoke', providerMode: providerResolution.providerMode })
const searchResponse = buildPrivateFixtureSearchResponse({ providerMode: providerResolution.providerMode, pages })
const contractBlockers = validatePrivateSearxngContract(searchResponse)
const normalization = normalizePrivateSearchResults({ runId: 'phase49e-smoke', response: searchResponse })

const captures: PrivateWebCaptureMetadata[] = pages.map((page) => ({
  sourceId: page.sourceId,
  browser: 'chromium',
  urlType: 'phase_fixture_file_url',
  fixtureUrl: `file://${page.fixturePath}`,
  pageTitle: page.title,
  viewport: privateWebE2EConfig.viewport,
  screenshotPath: `${tempRoot}/${page.sourceId}-screenshot.png`,
  fullPage: true,
  publicWebCaptureUsed: false,
  publicNetworkRequests: [],
  capturedAt: new Date().toISOString(),
  dom: { h1: page.title, policyLabelCount: 4, articleParagraphCount: 4 },
  screenshotDimensions: { width: 1366, height: 1200 },
}))
const sharpProcessing: PrivateWebSharpMetadata[] = pages.map((page) => ({
  sourceId: page.sourceId,
  inputPath: `${tempRoot}/${page.sourceId}-screenshot.png`,
  original: { path: `${tempRoot}/${page.sourceId}-screenshot.png`, width: 1366, height: 1200, format: 'png', sizeBytes: 1000, sha256: 'a'.repeat(64) },
  preview: { path: `${tempRoot}/${page.sourceId}-preview.png`, width: 1280, height: 1124, sizeBytes: 800, sha256: 'b'.repeat(64) },
  thumbnail: { path: `${tempRoot}/${page.sourceId}-thumbnail.png`, width: 320, height: 281, sizeBytes: 300, sha256: 'c'.repeat(64) },
  processedAt: new Date().toISOString(),
  remoteImagesFetched: false,
}))
const extractions: PrivateWebExtractionRecord[] = pages.map((page) => ({
  sourceId: page.sourceId,
  extractionId: `${page.sourceId}-extract`,
  title: page.title,
  byline: page.byline,
  excerpt: page.excerpt,
  textContentPreview: 'Generated private fixture extraction preview with enough words to validate the smoke path and no public extraction behavior.',
  textLength: 800,
  wordCount: 120,
  sanitizedHtmlPath: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-smoke/extraction/${page.sourceId}/extracted-article-sanitized.json`,
  textPath: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-smoke/extraction/${page.sourceId}/extracted-article-text.txt`,
  displaySafe: true,
  generatedFixture: true,
  publicWebExtractionUsed: false,
  liveSearchUsed: false,
  paidProviderUsed: false,
}))
const artifacts: PrivateWebE2EArtifact[] = Array.from({ length: 24 }, (_, index) => ({
  id: `artifact-${index}`,
  kind: 'private_json',
  bucket: privateWebE2EConfig.generatedAssetsBucket,
  object: `activation-web-search/phase49e/phase49e-smoke/artifact-${index}.json`,
  gcsUri: `gs://${privateWebE2EConfig.generatedAssetsBucket}/activation-web-search/phase49e/phase49e-smoke/artifact-${index}.json`,
  sizeBytes: 100,
  sha256: 'd'.repeat(64),
}))
const manifest = buildPrivateWebE2EManifest({
  runId: 'phase49e-smoke',
  providerMode: providerResolution.providerMode,
  sources: normalization.sources,
  fixturePages: pages,
  captures,
  sharpProcessing,
  extractions,
  artifacts,
  warnings: [],
  blockers: [],
})
const qa = buildPrivateWebE2EQaSummary({
  planSnapshot,
  searchResponse,
  normalizedSources: normalization.sources,
  sourceManifest: normalization.manifest,
  fixturePages: pages,
  captures,
  sharpProcessing,
  extractions,
  manifest,
  artifacts,
  publicAccessBlocked: true,
})
const report = buildPrivateWebE2EReport()

assert.equal(privateWebE2EConfig.phase, '49E')
assert.equal(privateWebE2EConfig.mode, 'controlled_private_web_search_capture_e2e')
assert.equal(privateWebE2EConfig.maxResults, 3)
assert.equal(providerResolution.providerMode, 'private_fixture_provider')
assert.equal(resolvePrivateSearchProvider({ endpoint: 'https://searx.be/search' }).providerMode, 'private_fixture_provider')
assert.equal(privateWebE2ESafetyFlags.paidProvidersAllowed, false)
assert.equal(privateWebE2ESafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(privateWebE2ESafetyFlags.livePublicSearchAllowed, false)
assert.equal(privateWebE2ESafetyFlags.publicWebCaptureAllowed, false)
assert.equal(privateWebE2ESafetyFlags.arbitraryUrlCaptureAllowed, false)
assert.equal(privateWebE2ESafetyFlags.browserCaptureAllowedForFixturePages, true)
assert.equal(privateWebE2ESafetyFlags.sharpProcessingAllowedForPhaseScreenshots, true)
assert.equal(privateWebE2ESafetyFlags.readabilityExtractionAllowedForFixtureHtml, true)
assert.equal(privateWebE2ESafetyFlags.productionReadyAllowed, false)
assert.equal(privateWebE2ESafetyFlags.externalBetaAllowed, false)
assert.equal(privateWebE2ESafetyFlags.broadRealMediaAllowed, false)

assert.equal(pages.length, 3)
assert.ok(pages.every((page) => page.domain === 'fixture.local'))
assert.ok(pages.every((page) => !page.hasScriptTags && !page.hasIframes && !page.hasExternalImages && !page.hasRemoteFonts))
assert.equal(searchResponse.results.length, 3)
assert.equal(searchResponse.liveSearchUsed, false)
assert.equal(searchResponse.paidProviderUsed, false)
assert.deepEqual(contractBlockers, [])
assert.equal(normalization.sources.length, 3)
assert.ok(normalization.sources.every((source) => source.captureAllowed && source.extractionAllowed && source.attributionRequired))

assert.equal(planSnapshot.approvedPlanSnapshot, true)
assert.equal(planSnapshot.rawPromptExecution, false)
assert.equal(planSnapshot.publicWebCaptureAllowed, false)
assert.equal(planSnapshot.arbitraryUrlCaptureAllowed, false)
assert.equal(planSnapshot.paidProvidersAllowed, false)
assert.equal(planSnapshot.livePublicSearchAllowed, false)

assert.equal(manifest.sourceCount, 3)
assert.equal(manifest.captureCount, 3)
assert.equal(manifest.extractionCount, 3)
assert.equal(manifest.liveSearchUsed, false)
assert.equal(manifest.paidProviderUsed, false)
assert.equal(manifest.publicWebCaptureUsed, false)
assert.equal(manifest.publicWebExtractionUsed, false)

assert.deepEqual(qa.gates.map((gate) => gate.gateId), privateWebE2EQaGateIds)
assert.equal(qa.status, 'passed')
assert.equal(report.livePublicSearchAllowed, false)
assert.equal(report.publicWebCaptureAllowed, false)
assert.equal(report.arbitraryUrlCaptureAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)

assert.equal(validatePrivateWebSearchCaptureE2EExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  mode: 'controlled_private_web_search_capture_e2e',
  providerMode: 'private_fixture_provider',
  paidProvidersAllowed: 'false',
  livePublicSearchAllowed: 'false',
  publicWebCaptureAllowed: 'false',
  arbitraryUrlCaptureAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)
assert.equal(validatePrivateWebSearchCaptureE2EExecutionEnv({ confirmation: 'false' }).allowed, false)

const iamPlan = buildPrivateWebE2EIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.reportOnly))
assert.ok(iamPlan.every((plan) => plan.role === 'roles/storage.objectCreator'))
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('/objects/activation-web-search/phase49e/')))

const commandPlan = buildPrivateWebE2ECommandPlan()
assert.ok(commandPlan.some((plan) => plan.commandId === 'phase49e-execute-controlled-private-fixture-e2e' && plan.requiresConfirmation))
assert.ok(commandPlan.some((plan) => plan.commandId === 'blocked-live-public-search' && !plan.allowedInPhase49E))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PUBLIC_WEB_CAPTURE_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('ARBITRARY_URL_CAPTURE_ALLOWED=true'))

for (const doc of privateWebE2ERequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of privateWebE2ERequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49e_policy',
    'private_fixture_provider',
    'public_provider_blocking',
    'source_normalization',
    'fixture_pages',
    'capture_scope',
    'sharp_scope',
    'readability_scope',
    'combined_manifest',
    'qa_gates',
    'package_scripts',
    'blocked_features',
  ],
}))
