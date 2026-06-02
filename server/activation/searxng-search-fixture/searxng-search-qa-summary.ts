import { existsSync, readFileSync } from 'node:fs'
import { buildWebSearchCaptureApprovalReport } from '../web-search-capture-approval'
import {
  searxngSearchFixtureConfig,
  searxngSearchFixtureGateIds,
  searxngSearchFixtureRequiredDocs,
  searxngSearchFixtureRequiredScripts,
  searxngSearchFixtureSafetyFlags,
} from './searxng-search-fixture-policy'
import type {
  ApprovedSearxngSearchPlanSnapshot,
  SearxngFixtureResponse,
  SearxngSearchFixtureArtifact,
  SearxngSearchFixtureQaGate,
  SearxngSearchFixtureQaSummary,
  SearxngSourceManifest,
} from './searxng-search-fixture-types'

export function buildSearxngSearchFixtureQaSummary(input: {
  fixtureResponse: SearxngFixtureResponse
  normalizedSourceCount: number
  normalizationBlockers: string[]
  planSnapshot: ApprovedSearxngSearchPlanSnapshot
  sourceManifest: SearxngSourceManifest
  artifacts?: SearxngSearchFixtureArtifact[]
  publicAccessBlocked?: boolean
  preflightBlockers?: string[]
}): SearxngSearchFixtureQaSummary {
  const phase49AReport = buildWebSearchCaptureApprovalReport()
  const scriptsPresent = requiredScriptsPresent()
  const docsPresent = requiredDocsPresent()
  const artifactPrefixesPrivate = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
  const fixtureCountOk = input.fixtureResponse.results.length >= searxngSearchFixtureConfig.minResults
    && input.fixtureResponse.results.length <= searxngSearchFixtureConfig.maxResults
  const allSafetyFalse = Object.values(searxngSearchFixtureSafetyFlags).every((value) => value === false)
  const phase49AEvidence = phase49AReport.status === 'approval_review_complete'
    && phase49AReport.searxngPlanningAllowed
    && !phase49AReport.liveSearchAllowed
    && !phase49AReport.browserCaptureAllowed
    && !phase49AReport.paidProviderAllowed
  const fixtureIntegrity = input.fixtureResponse.generatedFixture
    && !input.fixtureResponse.liveSearchUsed
    && input.fixtureResponse.provider === 'searxng'
    && fixtureCountOk
  const normalizationIntegrity = input.normalizedSourceCount === input.fixtureResponse.results.length
    && input.normalizationBlockers.length === 0
    && input.sourceManifest.sources.every((source) => source.provider === 'searxng'
      && source.sourceId.startsWith('src_searxng_')
      && source.attributionRequired
      && !source.captureAllowed
      && !source.extractionAllowed
      && !source.paidProvider
      && source.generatedFixture)
  const planSnapshotIntegrity = input.planSnapshot.approvedPlanSnapshot
    && !input.planSnapshot.rawPromptExecution
    && input.planSnapshot.provider === 'searxng'
    && input.planSnapshot.mode === 'generated_private_fixture'
    && !input.planSnapshot.liveSearchAllowed
  const sourceManifestIntegrity = input.sourceManifest.generatedFixture
    && input.sourceManifest.sourceCount === input.normalizedSourceCount
    && !input.sourceManifest.liveSearchUsed
    && !input.sourceManifest.paidProviderUsed
    && input.sourceManifest.captureStatus === 'not_captured_phase49b'
    && input.sourceManifest.extractionStatus === 'not_extracted_phase49b'
  const paidProviderBlocking = input.planSnapshot.disabledProviderIds.length === 5
    && !input.planSnapshot.paidProviderAllowed
    && !searxngSearchFixtureSafetyFlags.paidProvidersAllowed
    && phase49AReport.tools.filter((tool) => tool.optionalPaidProvider).every((tool) => tool.disabledByDefault && !tool.providerAllowed)
  const browserCaptureBlocking = !searxngSearchFixtureSafetyFlags.browserCaptureAllowed
    && !searxngSearchFixtureSafetyFlags.playwrightAllowed
    && !searxngSearchFixtureSafetyFlags.sharpProcessingAllowed
    && !searxngSearchFixtureSafetyFlags.readabilityExtractionAllowed
  const artifactPrivacy = (input.artifacts?.length ? artifactPrefixesPrivate : true)
    && (input.publicAccessBlocked ?? true)
  const blockedFeatures = allSafetyFalse
    && !phase49AReport.productionReadyAllowed
    && !phase49AReport.externalBetaAllowed
    && !phase49AReport.broadRealMediaAllowed
    && scriptsPresent
    && docsPresent

  const gates: SearxngSearchFixtureQaGate[] = [
    gate('phase49a_evidence', phase49AEvidence, 'Phase 49A approved SearXNG planning only and kept live search/browser/paid providers blocked.'),
    gate('fixture_integrity', fixtureIntegrity, 'Generated SearXNG-style response has deterministic query, provider, mode, and 5-8 fixture results.'),
    gate('normalization_integrity', normalizationIntegrity, 'Fixture results normalize into source records with attribution, provider, domain, rank, generated flags, and capture/extraction blocked.'),
    gate('plan_snapshot_integrity', planSnapshotIntegrity, 'Approved search plan snapshot exists and blocks raw chat execution, live search, paid providers, and browser capture.'),
    gate('source_manifest_integrity', sourceManifestIntegrity, 'Source manifest records generated fixture status, no live search, no paid provider, no capture, and no extraction.'),
    gate('paid_provider_blocking', paidProviderBlocking, 'Brave, Tavily, Exa, Firecrawl, and hosted browser providers remain disabled.'),
    gate('browser_capture_blocking', browserCaptureBlocking, 'Playwright, Sharp, screenshot processing, and Readability extraction remain future-scoped and blocked.'),
    gate('artifact_privacy', artifactPrivacy, 'Phase 49B artifacts are private GCS JSON objects and public access is blocked.'),
    gate('blocked_features', blockedFeatures, 'Production, external beta, paid production, broad media, providers, Revideo, public artifacts, live search, and browser capture remain blocked.'),
  ]
  const blockers = [
    ...(input.preflightBlockers ?? []),
    ...(phase49AEvidence ? [] : ['Phase 49A web search/capture approval evidence is missing or inconsistent.']),
    ...(fixtureIntegrity ? [] : ['Generated SearXNG fixture response is invalid.']),
    ...(normalizationIntegrity ? [] : ['Search result normalization failed or rejected required fixture records.']),
    ...(planSnapshotIntegrity ? [] : ['Approved search plan snapshot is invalid.']),
    ...(sourceManifestIntegrity ? [] : ['Source manifest is invalid.']),
    ...(paidProviderBlocking ? [] : ['Paid provider blocking is inconsistent.']),
    ...(browserCaptureBlocking ? [] : ['Browser capture or extraction blocking is inconsistent.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
    ...(scriptsPresent ? [] : ['Required Phase 49B package scripts are missing.']),
    ...(docsPresent ? [] : ['Required Phase 49B docs are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: [
      'Phase 49B proves only the generated search-provider contract; live search remains blocked.',
      'Generated fixture URLs are example domains and were not fetched.',
      'Phase 49C may begin only as a Playwright + Sharp generated capture fixture.',
    ],
  }
}

function gate(gateId: typeof searxngSearchFixtureGateIds[number], passed: boolean, summary: string): SearxngSearchFixtureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return searxngSearchFixtureRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return searxngSearchFixtureRequiredDocs.every((doc) => existsSync(doc))
}
