import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchCaptureTarget,
  ControlledLiveSearchCombinedManifest,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchSharpRecord,
  ControlledLiveSearchSkippedTarget,
  ControlledLiveSearchSourceManifest,
  ControlledLiveSearchSourceRecord,
} from './controlled-live-search-capture-types'

export function buildControlledLiveSearchSourceManifest(input: {
  runId: string
  sources: ControlledLiveSearchSourceRecord[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  warnings: string[]
  blockers: string[]
}): ControlledLiveSearchSourceManifest {
  return {
    runId: input.runId,
    provider: 'searxng',
    serviceName: controlledLiveSearchConfig.serviceName,
    queries: [...controlledLiveSearchConfig.queries],
    sourceCount: input.sources.length,
    maxResultsPerQuery: controlledLiveSearchConfig.maxResultsPerQuery,
    allowedDomains: [...controlledLiveSearchConfig.allowedDomains],
    sources: input.sources,
    attributionPolicy: 'Every search result, capture, extraction, and summary must cite its normalized source record; Phase 49G artifacts remain private.',
    privateSearxngUsed: true,
    publicSearxngInstanceUsed: false,
    paidProviderUsed: false,
    browserCaptureUsed: input.captureRecords.length > 0,
    readabilityExtractionUsed: input.extractionRecords.length > 0,
    captureStatus: 'allowlisted_capture_phase49g',
    extractionStatus: 'allowlisted_extraction_phase49g',
    warnings: input.warnings,
    blockers: input.blockers,
  }
}

export function buildControlledLiveSearchCombinedManifest(input: {
  runId: string
  sources: ControlledLiveSearchSourceRecord[]
  selectedCaptureTargets: ControlledLiveSearchCaptureTarget[]
  skippedCaptureTargets: ControlledLiveSearchSkippedTarget[]
  captureRecords: ControlledLiveSearchCaptureRecord[]
  sharpRecords: ControlledLiveSearchSharpRecord[]
  extractionRecords: ControlledLiveSearchExtractionRecord[]
  warnings: string[]
  blockers: string[]
}): ControlledLiveSearchCombinedManifest {
  return {
    runId: input.runId,
    provider: 'searxng',
    serviceName: controlledLiveSearchConfig.serviceName,
    queries: [...controlledLiveSearchConfig.queries],
    normalizedSources: input.sources,
    selectedCaptureTargets: input.selectedCaptureTargets,
    skippedCaptureTargets: input.skippedCaptureTargets,
    captureRecords: input.captureRecords,
    sharpRecords: input.sharpRecords,
    extractionRecords: input.extractionRecords,
    paidProviderUsed: false,
    publicSearxngUsed: false,
    arbitraryUrlCaptureUsed: false,
    publicArtifactAccess: false,
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
