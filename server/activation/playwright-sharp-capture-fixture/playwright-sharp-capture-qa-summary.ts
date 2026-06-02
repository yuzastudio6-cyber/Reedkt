import { existsSync, readFileSync } from 'node:fs'
import { buildSearxngSearchFixtureReport } from '../searxng-search-fixture'
import {
  playwrightSharpCaptureConfig,
  playwrightSharpCaptureQaGateIds,
  playwrightSharpCaptureRequiredDocs,
  playwrightSharpCaptureRequiredScripts,
  playwrightSharpCaptureSafetyFlags,
} from './playwright-sharp-capture-policy'
import type {
  ApprovedPlaywrightSharpCapturePlanSnapshot,
  CaptureArtifactManifest,
  LocalHtmlFixtureResult,
  PlaywrightCaptureMetadata,
  PlaywrightSharpCaptureArtifact,
  PlaywrightSharpCaptureQaGate,
  PlaywrightSharpCaptureQaSummary,
  SharpPostprocessMetadata,
} from './playwright-sharp-capture-types'

export function buildPlaywrightSharpCaptureQaSummary(input: {
  planSnapshot: ApprovedPlaywrightSharpCapturePlanSnapshot
  localFixture?: LocalHtmlFixtureResult
  playwrightCapture?: PlaywrightCaptureMetadata
  sharpProcessing?: SharpPostprocessMetadata
  artifactManifest?: CaptureArtifactManifest
  artifacts?: PlaywrightSharpCaptureArtifact[]
  publicAccessBlocked?: boolean
  preflightBlockers?: string[]
}): PlaywrightSharpCaptureQaSummary {
  const phase49BReport = buildSearxngSearchFixtureReport()
  const scriptsPresent = requiredScriptsPresent()
  const docsPresent = requiredDocsPresent()
  const phase49BEvidence = phase49BReport.status === 'completed'
    && phase49BReport.approvedEvidence.runId === playwrightSharpCaptureConfig.approvedPhase49BRunId
    && phase49BReport.approvedEvidence.sourceManifestUri === playwrightSharpCaptureConfig.approvedPhase49BSourceManifestUri
    && phase49BReport.phase49CReadiness === 'ready_for_playwright_sharp_generated_capture_fixture'
    && !phase49BReport.liveSearchAllowed
  const localFixtureIntegrity = Boolean(input.localFixture)
    && input.localFixture?.title === playwrightSharpCaptureConfig.fixtureTitle
    && input.localFixture?.sourceCardCount === 3
    && input.localFixture?.externalAssetCount === 0
    && input.localFixture?.hasScriptTags === false
    && input.localFixture?.hasIframes === false
    && input.localFixture?.hasExternalImages === false
    && input.localFixture?.hasRemoteFonts === false
    && input.localFixture?.sizeBytes > 0
  const playwrightCapture = Boolean(input.playwrightCapture)
    && input.playwrightCapture?.browser === 'chromium'
    && input.playwrightCapture?.urlType === 'local_fixture'
    && input.playwrightCapture?.fixtureUrl.startsWith('file://')
    && input.playwrightCapture?.publicWebCaptureUsed === false
    && input.playwrightCapture?.publicNetworkRequests.length === 0
    && input.playwrightCapture?.screenshotDimensions.width > 0
    && input.playwrightCapture?.screenshotDimensions.height > 0
    && input.playwrightCapture?.dom.sourceCardCount === 3
  const sharpProcessing = Boolean(input.sharpProcessing)
    && input.sharpProcessing?.original.format === 'png'
    && input.sharpProcessing?.original.width > 0
    && input.sharpProcessing?.original.height > 0
    && input.sharpProcessing?.preview.width > 0
    && input.sharpProcessing?.thumbnail.width > 0
    && input.sharpProcessing?.remoteImagesFetched === false
  const artifactManifest = Boolean(input.artifactManifest)
    && input.artifactManifest?.fixtureMode === playwrightSharpCaptureConfig.fixtureMode
    && input.artifactManifest?.sourcePlan === 'generated_fixture'
    && input.artifactManifest?.publicWebCaptureUsed === false
    && input.artifactManifest?.liveSearchUsed === false
    && input.artifactManifest?.paidProviderUsed === false
    && input.artifactManifest?.readabilityExtractionUsed === false
    && input.artifactManifest?.blockers.length === 0
  const artifactsPrivate = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
  const artifactPrivacy = artifactsPrivate && (input.publicAccessBlocked ?? true)
  const blockedFeatures = playwrightSharpCaptureSafetyFlags.localOnlyCaptureAllowed
    && playwrightSharpCaptureSafetyFlags.browserCaptureLimitedToLocalFixture
    && !playwrightSharpCaptureSafetyFlags.publicWebCaptureAllowed
    && !playwrightSharpCaptureSafetyFlags.liveSearchAllowed
    && !playwrightSharpCaptureSafetyFlags.paidProvidersAllowed
    && !playwrightSharpCaptureSafetyFlags.readabilityExtractionAllowed
    && playwrightSharpCaptureSafetyFlags.sharpProcessingAllowedForGeneratedScreenshot
    && !playwrightSharpCaptureSafetyFlags.publicArtifactAllowed
    && !playwrightSharpCaptureSafetyFlags.productionReadyAllowed
    && !playwrightSharpCaptureSafetyFlags.externalBetaAllowed
    && !playwrightSharpCaptureSafetyFlags.broadRealMediaAllowed
    && scriptsPresent
    && docsPresent

  const gates: PlaywrightSharpCaptureQaGate[] = [
    gate('phase49b_evidence', phase49BEvidence, 'Phase 49B completed the SearXNG generated fixture and marked Phase 49C ready only for local capture fixtures.'),
    gate('local_fixture_integrity', localFixtureIntegrity, 'Generated local HTML fixture has no external assets, scripts, iframes, remote fonts, or external images.'),
    gate('playwright_capture', playwrightCapture, 'Playwright captured only the local fixture page with Chromium and recorded no public web capture.'),
    gate('sharp_processing', sharpProcessing, 'Sharp decoded and processed the local screenshot into preview and thumbnail PNG artifacts.'),
    gate('artifact_manifest', artifactManifest, 'Capture artifact manifest records local fixture source, no live search, no paid provider, and no Readability extraction.'),
    gate('artifact_privacy', artifactPrivacy, 'Phase 49C artifacts are private GCS objects and public access is blocked.'),
    gate('blocked_features', blockedFeatures, 'Live search, public web capture, paid providers, Readability extraction, production, beta, broad media, providers, Revideo, and public artifacts remain blocked.'),
  ]
  const blockers = [
    ...(input.preflightBlockers ?? []),
    ...(phase49BEvidence ? [] : ['Phase 49B evidence is missing or inconsistent.']),
    ...(localFixtureIntegrity ? [] : ['Generated local HTML fixture integrity failed.']),
    ...(playwrightCapture ? [] : ['Playwright local fixture capture has not passed.']),
    ...(sharpProcessing ? [] : ['Sharp screenshot post-processing has not passed.']),
    ...(artifactManifest ? [] : ['Capture artifact manifest is missing or inconsistent.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
    ...(scriptsPresent ? [] : ['Required Phase 49C package scripts are missing.']),
    ...(docsPresent ? [] : ['Required Phase 49C docs are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: [
      'Phase 49C proves only local generated Playwright capture and Sharp post-processing.',
      'No public pages were approved for capture.',
      'Phase 49D may begin only as a generated/local Readability extraction fixture.',
    ],
  }
}

function gate(gateId: typeof playwrightSharpCaptureQaGateIds[number], passed: boolean, summary: string): PlaywrightSharpCaptureQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return playwrightSharpCaptureRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return playwrightSharpCaptureRequiredDocs.every((doc) => existsSync(doc))
}
