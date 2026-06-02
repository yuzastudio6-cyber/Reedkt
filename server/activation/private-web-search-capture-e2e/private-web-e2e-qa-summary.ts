import { getApprovedPlaywrightSharpCaptureEvidence } from '../playwright-sharp-capture-fixture'
import { getApprovedReadabilityExtractionEvidence } from '../readability-extraction-fixture'
import { getApprovedSearxngSearchFixtureEvidence } from '../searxng-search-fixture'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type {
  PrivateFixturePage,
  PrivateSearxngResponse,
  PrivateWebCaptureMetadata,
  PrivateWebE2EArtifact,
  PrivateWebE2EManifest,
  PrivateWebE2EPlanSnapshot,
  PrivateWebE2EQaGate,
  PrivateWebE2EQaSummary,
  PrivateWebExtractionRecord,
  PrivateWebSharpMetadata,
  PrivateWebSourceManifest,
  PrivateWebSourceRecord,
} from './private-web-search-capture-e2e-types'

export function buildPrivateWebE2EQaSummary(input: {
  planSnapshot?: PrivateWebE2EPlanSnapshot
  searchResponse?: PrivateSearxngResponse
  normalizedSources?: PrivateWebSourceRecord[]
  sourceManifest?: PrivateWebSourceManifest
  fixturePages?: PrivateFixturePage[]
  captures?: PrivateWebCaptureMetadata[]
  sharpProcessing?: PrivateWebSharpMetadata[]
  extractions?: PrivateWebExtractionRecord[]
  manifest?: PrivateWebE2EManifest
  artifacts?: PrivateWebE2EArtifact[]
  publicAccessBlocked?: boolean
  preflightBlockers?: string[]
}): PrivateWebE2EQaSummary {
  const phase49B = getApprovedSearxngSearchFixtureEvidence()
  const phase49C = getApprovedPlaywrightSharpCaptureEvidence()
  const phase49D = getApprovedReadabilityExtractionEvidence()
  const preflightBlockers = input.preflightBlockers ?? []
  const gates: PrivateWebE2EQaGate[] = [
    gate('phase49b_evidence', phase49B.status === 'completed' && phase49B.runId === privateWebE2EConfig.approvedPhase49BRunId, 'Phase 49B SearXNG fixture evidence is completed and matches the approved run.'),
    gate('phase49c_evidence', phase49C.status === 'completed' && phase49C.runId === privateWebE2EConfig.approvedPhase49CRunId, 'Phase 49C Playwright + Sharp capture evidence is completed and matches the approved run.'),
    gate('phase49d_evidence', phase49D.status === 'completed' && phase49D.runId === privateWebE2EConfig.approvedPhase49DRunId && phase49D.phase49EReadiness === 'ready_for_controlled_private_web_search_capture_e2e', 'Phase 49D Readability extraction evidence is completed and marks Phase 49E ready.'),
    gate('plan_snapshot_integrity', Boolean(input.planSnapshot?.approvedPlanSnapshot && input.planSnapshot.rawPromptExecution === false), 'Approved Phase 49E plan snapshot exists and raw prompt execution is false.'),
    gate('private_search_provider', Boolean(input.searchResponse && input.searchResponse.provider === 'searxng' && !input.searchResponse.liveSearchUsed && !input.searchResponse.paidProviderUsed), 'Search provider is SearXNG-compatible private fixture or validated private endpoint with no public/paid search.'),
    gate('source_normalization', Boolean(input.normalizedSources?.length === 3 && input.sourceManifest?.sourceCount === 3 && input.normalizedSources.every((source) => source.attributionRequired && source.captureAllowed && source.extractionAllowed)), 'Exactly 3 normalized source records exist with attribution and capture/extraction linkage.'),
    gate('private_fixture_pages', Boolean(input.fixturePages?.length === 3 && input.fixturePages.every((page) => page.domain === 'fixture.local' && !page.hasScriptTags && !page.hasIframes && !page.hasExternalImages && !page.hasRemoteFonts)), 'Three private/local fixture pages exist with no external assets, scripts, iframes, images, or fonts.'),
    gate('playwright_capture', Boolean(input.captures?.length === 3 && input.captures.every((capture) => !capture.publicWebCaptureUsed && capture.publicNetworkRequests.length === 0 && capture.fixtureUrl.startsWith('file://'))), 'Playwright captured only phase-created file:// fixture pages with no public network requests.'),
    gate('sharp_processing', Boolean(input.sharpProcessing?.length === 3 && input.sharpProcessing.every((item) => item.preview.sizeBytes > 0 && item.thumbnail.sizeBytes > 0 && !item.remoteImagesFetched)), 'Sharp produced preview and thumbnail screenshots from Phase 49E screenshots only.'),
    gate('readability_extraction', Boolean(input.extractions?.length === 3 && input.extractions.every((item) => item.displaySafe && !item.publicWebExtractionUsed && item.wordCount > 20)), 'Readability extracted and sanitized content from phase-created fixture HTML only.'),
    gate('combined_manifest', Boolean(input.manifest?.sourceCount === 3 && input.manifest.captureCount === 3 && input.manifest.extractionCount === 3 && !input.manifest.liveSearchUsed && !input.manifest.paidProviderUsed), 'Combined source/capture/extraction manifest links all 3 sources without public or paid usage.'),
    gate('artifact_privacy', Boolean((input.artifacts?.length ?? 0) >= 20 && input.publicAccessBlocked !== false), 'Phase 49E artifacts are private GCS objects and public access is blocked.'),
    gate('blocked_features', true, 'Live public search, public capture, arbitrary URL capture, paid providers, production, beta, broad media, public artifacts, providers, and Revideo remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...gates.filter((item) => !item.passed).map((item) => `${item.gateId} failed: ${item.summary}`),
  ]
  const warnings = [
    'Phase 49E validates only controlled/private fixture E2E plumbing.',
    'Phase 49F readiness is internal web search/capture readiness gate only, not production or external beta.',
  ]
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateId: PrivateWebE2EQaGate['gateId'], passed: boolean, summary: string): PrivateWebE2EQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
