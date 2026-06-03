import { existsSync, readFileSync } from 'node:fs'
import { buildPlaywrightSharpCaptureReport } from '../playwright-sharp-capture-fixture/playwright-sharp-capture-report-builder'
import {
  readabilityExtractionConfig,
  readabilityExtractionQaGateIds,
  readabilityExtractionRequiredDocs,
  readabilityExtractionRequiredScripts,
  readabilityExtractionSafetyFlags,
} from './readability-extraction-policy'
import type {
  ApprovedReadabilityExtractionPlanSnapshot,
  LocalArticleFixtureResult,
  NormalizedReadabilityExtractionRecord,
  RawReadabilityExtraction,
  ReadabilityExtractionArtifact,
  ReadabilityExtractionArtifactManifest,
  ReadabilityExtractionQaGate,
  ReadabilityExtractionQaSummary,
  SanitizedReadabilityExtraction,
} from './readability-extraction-types'

export function buildReadabilityExtractionQaSummary(input: {
  planSnapshot: ApprovedReadabilityExtractionPlanSnapshot
  localFixture?: LocalArticleFixtureResult
  rawExtraction?: RawReadabilityExtraction
  sanitizedExtraction?: SanitizedReadabilityExtraction
  normalizedRecord?: NormalizedReadabilityExtractionRecord
  artifactManifest?: ReadabilityExtractionArtifactManifest
  artifacts?: ReadabilityExtractionArtifact[]
  publicAccessBlocked?: boolean
  preflightBlockers?: string[]
}): ReadabilityExtractionQaSummary {
  const phase49CReport = buildPlaywrightSharpCaptureReport()
  const scriptsPresent = requiredScriptsPresent()
  const docsPresent = requiredDocsPresent()
  const phase49CEvidence = phase49CReport.status === 'completed'
    && phase49CReport.approvedEvidence.runId === readabilityExtractionConfig.approvedPhase49CRunId
    && phase49CReport.approvedEvidence.captureManifestUri === readabilityExtractionConfig.approvedPhase49CManifestUri
    && phase49CReport.approvedEvidence.phase49cReportUri === readabilityExtractionConfig.approvedPhase49CReportUri
    && phase49CReport.phase49DReadiness === 'ready_for_readability_extraction_fixture'
    && !phase49CReport.publicWebCaptureAllowed

  const localFixtureIntegrity = Boolean(input.localFixture)
    && input.localFixture?.title === readabilityExtractionConfig.fixtureTitle
    && input.localFixture?.sourceReferenceCount === 3
    && input.localFixture?.articleParagraphCount >= 5
    && input.localFixture?.clutterSections.includes('sidebar')
    && input.localFixture?.externalAssetCount === 0
    && input.localFixture?.hasScriptTags === false
    && input.localFixture?.hasIframes === false
    && input.localFixture?.hasExternalImages === false
    && input.localFixture?.hasRemoteFonts === false
    && input.localFixture?.sizeBytes > 0

  const readabilityExtraction = Boolean(input.rawExtraction
    && input.rawExtraction.title.includes('ReeditPro internal source extraction fixture')
    && input.rawExtraction.textContent.length > 600
    && input.rawExtraction.length > 600
    && input.rawExtraction.publicWebExtractionUsed === false
    && input.rawExtraction.liveSearchUsed === false
    && input.rawExtraction.paidProviderUsed === false
    && input.rawExtraction.browserCaptureUsed === false
    && !input.rawExtraction.textContent.includes('Fixture Nav'))

  const sanitizationIntegrity = Boolean(input.sanitizedExtraction)
    && input.sanitizedExtraction?.displaySafe === true
    && input.sanitizedExtraction?.rawExtractionDisplaySafe === false
    && input.sanitizedExtraction?.sanitizedText.length > 600
    && input.sanitizedExtraction?.sanitizedHtml.length > 0
    && !/<script|<iframe|on[a-z]+\s*=|javascript:|data:|file:/i.test(input.sanitizedExtraction?.sanitizedHtml ?? '')

  const normalizationIntegrity = Boolean(input.normalizedRecord
    && input.normalizedRecord.extractionId.startsWith(`phase49d-extraction-${input.planSnapshot.phase49DRunId}`)
    && input.normalizedRecord.sourceId === 'phase49d-generated-local-article-source'
    && input.normalizedRecord.generatedFixture === true
    && input.normalizedRecord.displaySafe === true
    && input.normalizedRecord.wordCount > 100
    && input.normalizedRecord.publicWebExtractionUsed === false
    && input.normalizedRecord.liveSearchUsed === false
    && input.normalizedRecord.paidProviderUsed === false)

  const artifactManifest = Boolean(input.artifactManifest)
    && input.artifactManifest?.fixtureMode === readabilityExtractionConfig.fixtureMode
    && input.artifactManifest?.sourcePlan === 'generated_local_article_fixture'
    && input.artifactManifest?.publicWebExtractionUsed === false
    && input.artifactManifest?.liveSearchUsed === false
    && input.artifactManifest?.paidProviderUsed === false
    && input.artifactManifest?.browserCaptureUsed === false
    && input.artifactManifest?.blockers.length === 0

  const artifactsPrivate = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
  const artifactPrivacy = artifactsPrivate && (input.publicAccessBlocked ?? true)
  const blockedFeatures = readabilityExtractionSafetyFlags.localOnlyExtractionAllowed
    && !readabilityExtractionSafetyFlags.publicWebExtractionAllowed
    && !readabilityExtractionSafetyFlags.liveSearchAllowed
    && !readabilityExtractionSafetyFlags.paidProvidersAllowed
    && !readabilityExtractionSafetyFlags.browserCaptureAllowed
    && !readabilityExtractionSafetyFlags.playwrightAllowed
    && !readabilityExtractionSafetyFlags.sharpProcessingAllowed
    && readabilityExtractionSafetyFlags.readabilityExtractionAllowedForGeneratedLocalFixture
    && !readabilityExtractionSafetyFlags.publicArtifactAllowed
    && !readabilityExtractionSafetyFlags.productionReadyAllowed
    && !readabilityExtractionSafetyFlags.externalBetaAllowed
    && !readabilityExtractionSafetyFlags.broadRealMediaAllowed
    && scriptsPresent
    && docsPresent

  const gates: ReadabilityExtractionQaGate[] = [
    gate('phase49c_evidence', phase49CEvidence, 'Phase 49C completed local Playwright + Sharp capture and marked Phase 49D ready only for generated/local Readability extraction.'),
    gate('local_article_fixture_integrity', localFixtureIntegrity, 'Generated local article fixture includes article body, source references, clutter sections, and no external assets/scripts.'),
    gate('readability_extraction', readabilityExtraction, 'Mozilla Readability extracted title, text, metadata, and reduced non-article clutter from local HTML only.'),
    gate('sanitization_integrity', sanitizationIntegrity, 'Sanitized extraction is display-safe, bounded, and contains no unsafe tags, handlers, or URL schemes.'),
    gate('normalization_integrity', normalizationIntegrity, 'Normalized extraction record has stable IDs, text preview, word count, generated flags, and false public/provider flags.'),
    gate('artifact_manifest', artifactManifest, 'Extraction artifact manifest records local fixture source, Readability/jsdom versions, no browser capture, no live search, and no paid provider.'),
    gate('artifact_privacy', artifactPrivacy, 'Phase 49D artifacts are private GCS objects and public access is blocked.'),
    gate('blocked_features', blockedFeatures, 'Live search, public extraction, browser capture, screenshots, paid providers, production, beta, broad media, providers, Revideo, and public artifacts remain blocked.'),
  ]
  const blockers = [
    ...(input.preflightBlockers ?? []),
    ...(phase49CEvidence ? [] : ['Phase 49C evidence is missing or inconsistent.']),
    ...(localFixtureIntegrity ? [] : ['Generated local article fixture integrity failed.']),
    ...(readabilityExtraction ? [] : ['Readability local fixture extraction has not passed.']),
    ...(sanitizationIntegrity ? [] : ['Sanitization integrity has not passed.']),
    ...(normalizationIntegrity ? [] : ['Normalized extraction record is missing or inconsistent.']),
    ...(artifactManifest ? [] : ['Extraction artifact manifest is missing or inconsistent.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
    ...(scriptsPresent ? [] : ['Required Phase 49D package scripts are missing.']),
    ...(docsPresent ? [] : ['Required Phase 49D docs are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: [
      'Phase 49D proves only generated/local Mozilla Readability extraction and sanitization.',
      'No public page extraction or browser capture was approved.',
      'Phase 49E may begin only as controlled private web search/capture E2E planning with explicit private endpoint policy.',
    ],
  }
}

function gate(gateId: typeof readabilityExtractionQaGateIds[number], passed: boolean, summary: string): ReadabilityExtractionQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return readabilityExtractionRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return readabilityExtractionRequiredDocs.every((doc) => existsSync(doc))
}
