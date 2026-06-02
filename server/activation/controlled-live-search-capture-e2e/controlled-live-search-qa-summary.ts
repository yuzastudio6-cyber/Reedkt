import { controlledLiveSearchQaGateIds } from './controlled-live-search-capture-policy'
import type {
  ControlledLiveSearchArtifact,
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchCombinedManifest,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchPlanSnapshot,
  ControlledLiveSearchQa,
  ControlledLiveSearchQaGate,
  ControlledLiveSearchQueryResponse,
  ControlledLiveSearchSharpRecord,
  ControlledLiveSearchSourceManifest,
  ControlledLiveSearchSourceRecord,
} from './controlled-live-search-capture-types'

export function buildControlledLiveSearchQaSummary(input: {
  phase49FEvidenceOk: boolean
  planSnapshot: ControlledLiveSearchPlanSnapshot
  queryResponses: ControlledLiveSearchQueryResponse[]
  normalizedSources: ControlledLiveSearchSourceRecord[]
  sourceManifest: ControlledLiveSearchSourceManifest
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  combinedManifest: ControlledLiveSearchCombinedManifest
  artifacts: ControlledLiveSearchArtifact[]
  preflightBlockers: string[]
  warnings: string[]
}): ControlledLiveSearchQa {
  const gates: ControlledLiveSearchQaGate[] = [
    gate('phase49f_evidence', input.phase49FEvidenceOk, input.phase49FEvidenceOk ? 'Phase 49F private SearXNG service evidence is approved.' : 'Phase 49F private SearXNG service evidence is missing or blocked.'),
    gate('plan_snapshot_integrity', input.planSnapshot.approvedPlanSnapshot && !input.planSnapshot.rawPromptExecution, 'Approved plan snapshot is present and raw prompt execution is disabled.'),
    gate('private_searxng_query', input.queryResponses.length > 0 && input.queryResponses.every((response) => response.results.length <= input.planSnapshot.maxResultsPerQuery), 'Private SearXNG query responses are present and bounded.'),
    gate('result_normalization', input.normalizedSources.length > 0 && input.normalizedSources.every((source) => source.provider === 'searxng' && source.privateSearxngUsed && !source.paidProvider), 'Normalized private SearXNG source records are present.'),
    gate('allowlisted_capture_policy', input.captureRecords.length > 0 && input.captureRecords.every((capture) => capture.allowlistedDomain && capture.finalUrl.startsWith('https://')), 'Capture records are limited to allowlisted HTTPS search results.'),
    gate('playwright_capture', input.captureRecords.length > 0 && input.captureRecords.every((capture) => !capture.loginBypassUsed && !capture.captchaBypassUsed && !capture.paywallBypassUsed && !capture.linkClickUsed), 'Playwright captured at least one allowlisted page without bypass behavior.'),
    gate('sharp_processing', input.sharpRecords.length > 0 && input.sharpRecords.length === input.captureRecords.length, 'Sharp produced screenshot derivatives for successful captures.'),
    gate('readability_extraction', input.extractionRecords.length > 0 && input.extractionRecords.length === input.captureRecords.length && input.extractionRecords.every((record) => record.displaySafe && record.sourceAllowlisted), 'Readability extracted and sanitized at least one allowlisted captured page.'),
    gate('combined_manifest', input.combinedManifest.captureRecords.length === input.captureRecords.length && input.combinedManifest.extractionRecords.length === input.extractionRecords.length && !input.combinedManifest.paidProviderUsed && !input.combinedManifest.arbitraryUrlCaptureUsed, 'Combined source/capture/extraction manifest links the private records.'),
    gate('artifact_privacy', input.artifacts.length > 0 && input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://') && !artifact.gcsUri.includes('signed')), 'Artifacts are stored as private GCS objects without signed URLs as source of truth.'),
    gate('blocked_features', input.sourceManifest.paidProviderUsed === false && input.sourceManifest.publicSearxngInstanceUsed === false && input.combinedManifest.publicArtifactAccess === false, 'Paid providers, public SearXNG, public artifacts, arbitrary URL capture, and production/beta gates remain blocked.'),
  ]
  const blockers = [
    ...input.preflightBlockers,
    ...gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId}: ${entry.summary}`),
  ]
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates: controlledLiveSearchQaGateIds.map((gateId) => gates.find((entry) => entry.gateId === gateId) ?? gate(gateId, false, `${gateId} was not evaluated.`)),
    blockers,
    warnings: input.warnings,
  }
}

function gate(gateId: ControlledLiveSearchQaGate['gateId'], passed: boolean, summary: string): ControlledLiveSearchQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
