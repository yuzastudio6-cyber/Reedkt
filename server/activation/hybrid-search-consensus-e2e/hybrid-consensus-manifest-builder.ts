import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import type {
  HybridConsensusManifest,
  HybridMergedSourceRecord,
  HybridNormalizedBraveSource,
  HybridNormalizedSearxngSource,
  HybridDuplicateGroup,
  HybridCaptureTarget,
  HybridSkippedTarget,
} from './hybrid-search-consensus-types'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchSharpRecord,
} from '../controlled-live-search-capture-e2e'

export function buildHybridConsensusManifest(input: {
  runId: string
  searxngSources: HybridNormalizedSearxngSource[]
  braveSources: HybridNormalizedBraveSource[]
  mergedSources: HybridMergedSourceRecord[]
  duplicateGroups: HybridDuplicateGroup[]
  selectedCaptureTargets: HybridCaptureTarget[]
  skippedCaptureTargets: HybridSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  warnings: string[]
  blockers: string[]
}): HybridConsensusManifest {
  return {
    runId: input.runId,
    mode: hybridSearchConfig.mode,
    query: hybridSearchConfig.query,
    defaultProvider: 'searxng',
    braveRole: 'optional_paid_confidence_booster',
    normalizedSearxngSources: input.searxngSources,
    normalizedBraveSources: input.braveSources,
    mergedSources: input.mergedSources,
    duplicateGroups: input.duplicateGroups,
    selectedCaptureTargets: input.selectedCaptureTargets,
    skippedCaptureTargets: input.skippedCaptureTargets,
    captureRecords: input.captureRecords,
    sharpRecords: input.sharpRecords,
    extractionRecords: input.extractionRecords,
    paidProviderUsed: true,
    publicSearxngUsed: false,
    arbitraryUrlCaptureUsed: false,
    publicArtifactAccess: false,
    rawBraveResponseStored: false,
    braveSnippetStored: false,
    requestHeadersStored: false,
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
  }
}
