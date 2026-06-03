import { existsSync, readFileSync } from 'node:fs'
import { buildBraveLiveApiValidationReport } from '../brave-live-api-validation'
import { hybridSearchQaGateIds, hybridSearchRequiredDocs, hybridSearchRequiredScripts, hybridSearchSafetyFlags } from './hybrid-search-consensus-policy'
import type {
  HybridConsensusManifest,
  HybridConsensusReport,
  HybridMergedSourceRecord,
  HybridNormalizedBraveSource,
  HybridNormalizedSearxngSource,
  HybridSearchArtifact,
  HybridSearchQaGate,
  HybridSearchQaSummary,
} from './hybrid-search-consensus-types'
import type {
  BraveLiveApiCallSummary,
  BraveLiveBudgetGuardResult,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
} from '../brave-live-api-validation'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchSharpRecord,
} from '../controlled-live-search-capture-e2e'

export function buildHybridSearchQaSummary(input: {
  phase49LEvidenceOk: boolean
  secret: Omit<BraveLiveSecretResolution, 'secretValue'>
  secretMetadata: BraveLiveSecretMetadata
  budget: BraveLiveBudgetGuardResult
  braveApiCall: BraveLiveApiCallSummary
  searxngSources: HybridNormalizedSearxngSource[]
  braveSources: HybridNormalizedBraveSource[]
  mergedSources: HybridMergedSourceRecord[]
  consensusReport: HybridConsensusReport
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  manifest: HybridConsensusManifest
  artifacts?: HybridSearchArtifact[]
  publicAccessBlocked?: boolean
  blockers?: string[]
  warnings?: string[]
}): HybridSearchQaSummary {
  const phase49LReport = buildBraveLiveApiValidationReport()
  const phase49LLocalEvidence = phase49LReport.status === 'completed'
    && phase49LReport.executionReport?.runId === 'phase49l-20260603T15002'
    && phase49LReport.phase49MReadiness === 'ready_for_searxng_brave_hybrid_consensus_e2e'
    && phase49LReport.rawBraveStorageAllowed === false
    && phase49LReport.snippetsStored === false
  const phase49LEvidence = input.phase49LEvidenceOk || phase49LLocalEvidence
  const secretSafety = input.secret.configured
    && input.secret.secretValuePrinted === false
    && input.secret.secretValueStored === false
    && input.secret.frontendExposure === false
    && input.secretMetadata.secretConfigured
    && input.secretMetadata.versionEnabled
    && input.secretMetadata.approvedServiceAccountsHaveAccess
    && !input.secretMetadata.publicAccessDetected
    && !input.secretMetadata.broadAccessDetected
  const searxngDefault = input.searxngSources.length > 0
    && input.searxngSources.every((source) => source.provider === 'searxng' && source.privateSearxngUsed && !source.paidProvider && source.hybridProviderRole === 'default_provider')
    && hybridSearchSafetyFlags.searxngDefaultProvider
    && !hybridSearchSafetyFlags.publicSearxngInstanceAllowed
  const braveConfidence = input.braveApiCall.attempted
    && input.braveApiCall.completed
    && input.braveApiCall.callCount === 1
    && input.braveApiCall.resultCount > 0
    && input.budget.passed
    && input.budget.maxQueriesPerRun <= 1
    && input.budget.maxResults <= 5
    && input.braveSources.length > 0
    && input.braveSources.every((source) => source.provider === 'brave_search' && source.paidProvider && source.liveProviderCallUsed && source.hybridProviderRole === 'confidence_booster')
  const storageRights = !input.manifest.rawBraveResponseStored
    && !input.manifest.braveSnippetStored
    && !input.manifest.requestHeadersStored
    && input.braveSources.every((source) => !source.rawProviderResponseStored && !source.snippetStored)
    && !input.braveApiCall.rawResponseStored
    && !input.braveApiCall.snippetsStored
    && !input.braveApiCall.requestHeadersStored
  const normalization = input.searxngSources.length > 0
    && input.braveSources.length > 0
    && input.mergedSources.length > 0
    && input.mergedSources.length <= 8
  const dedupeConsensus = input.consensusReport.mergedSourceCount === input.mergedSources.length
    && input.consensusReport.searxngDefaultProvider
    && input.consensusReport.braveOptionalFallback
    && !input.consensusReport.rawBraveResponseStored
    && !input.consensusReport.braveSnippetStored
  const allowlistedCapture = input.manifest.selectedCaptureTargets.length > 0
    && input.manifest.selectedCaptureTargets.length <= 2
    && input.manifest.selectedCaptureTargets.every((target) => input.mergedSources.some((source) => source.sourceId === target.sourceId && source.captureAllowed))
    && !input.manifest.arbitraryUrlCaptureUsed
  const playwrightCapture = input.captureRecords.length > 0
    && input.captureRecords.every((record) => record.allowlistedDomain && !record.loginBypassUsed && !record.captchaBypassUsed && !record.paywallBypassUsed && !record.linkClickUsed)
  const sharpProcessing = input.sharpRecords.length >= input.captureRecords.length && input.sharpRecords.length > 0
  const readabilityExtraction = input.extractionRecords.length > 0
    && input.extractionRecords.length <= 2
    && input.extractionRecords.every((record) => record.displaySafe && record.sourceAllowlisted && !record.paidProviderUsed && !record.publicSearxngUsed)
  const artifactPrivacy = (input.artifacts ?? []).every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !artifact.gcsUri.includes('public'))
    && (input.publicAccessBlocked ?? true)
  const blockedFeatures = requiredScriptsPresent()
    && requiredDocsPresent()
    && !hybridSearchSafetyFlags.otherPaidProvidersAllowed
    && !hybridSearchSafetyFlags.publicSearxngInstanceAllowed
    && !hybridSearchSafetyFlags.arbitraryUrlCaptureAllowed
    && !hybridSearchSafetyFlags.publicArtifactAllowed
    && !hybridSearchSafetyFlags.productionReadyAllowed
    && !hybridSearchSafetyFlags.externalBetaAllowed
    && !hybridSearchSafetyFlags.paidProductionAllowed
    && !hybridSearchSafetyFlags.broadMediaAllowed

  const gates: HybridSearchQaGate[] = [
    gate('phase49l_evidence', phase49LEvidence, 'Phase 49L live Brave validation evidence exists and marks Phase 49M ready.'),
    gate('secret_safety', secretSafety, 'Brave key is resolved backend-side only and is not logged, stored, printed, committed, or exposed.'),
    gate('searxng_default_integrity', searxngDefault, 'Private SearXNG remains the default provider and public SearXNG remains blocked.'),
    gate('brave_confidence_booster', braveConfidence, 'Brave is used once only as a budgeted optional confidence booster.'),
    gate('storage_rights_enforcement', storageRights, 'Raw Brave response, snippets, request headers, and key material are not persisted.'),
    gate('result_normalization', normalization, 'SearXNG and Brave sources normalize into a shared bounded source set.'),
    gate('dedupe_consensus', dedupeConsensus, 'Merged source, dedupe, and consensus metrics are recorded.'),
    gate('allowlisted_capture', allowlistedCapture, 'Capture targets are selected only from allowlisted merged sources.'),
    gate('playwright_capture', playwrightCapture, 'At least one allowlisted page is captured without login, CAPTCHA, paywall, or click bypass.'),
    gate('sharp_processing', sharpProcessing, 'Sharp derivatives and metadata are created for captured screenshots.'),
    gate('readability_extraction', readabilityExtraction, 'At least one sanitized Readability extraction is produced.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts use private staging GCS paths with no signed URLs as source of truth.'),
    gate('blocked_features', blockedFeatures, 'Other paid providers, public SearXNG, broad crawling, public artifacts, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...(input.blockers ?? []),
    ...(phase49LEvidence ? [] : ['Phase 49L evidence is missing or inconsistent.']),
    ...(secretSafety ? [] : ['Brave Search secret safety gate failed.']),
    ...(searxngDefault ? [] : ['SearXNG default-provider integrity failed.']),
    ...(braveConfidence ? [] : ['Brave confidence-booster gate failed.']),
    ...(storageRights ? [] : ['Brave storage-rights enforcement failed.']),
    ...(normalization ? [] : ['Hybrid result normalization failed.']),
    ...(dedupeConsensus ? [] : ['Hybrid dedupe/consensus gate failed.']),
    ...(allowlistedCapture ? [] : ['Allowlisted capture selection failed.']),
    ...(playwrightCapture ? [] : ['Playwright allowlisted capture failed.']),
    ...(sharpProcessing ? [] : ['Sharp processing failed.']),
    ...(readabilityExtraction ? [] : ['Readability extraction failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy check failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature gates are inconsistent.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set([
      ...(input.warnings ?? []),
      'Phase 49M validates hybrid consensus only; SearXNG remains the default provider.',
      'Brave remains optional paid confidence booster only.',
      'Phase 49N may proceed only as a search provider readiness gate.',
    ])),
  }
}

function gate(gateId: typeof hybridSearchQaGateIds[number], passed: boolean, summary: string): HybridSearchQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function requiredScriptsPresent(): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return hybridSearchRequiredScripts.every((script) => Boolean(packageJson.scripts?.[script]))
}

function requiredDocsPresent(): boolean {
  return hybridSearchRequiredDocs.every((doc) => existsSync(doc))
}
