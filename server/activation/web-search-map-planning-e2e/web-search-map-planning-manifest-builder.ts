import { webSearchMapPlanningConfig } from './web-search-map-planning-policy'
import type {
  LocationCandidate,
  PlanningSourceRecord,
  WebSearchMap2DRenderResult,
  WebSearchMap3DRenderResult,
  WebSearchMapPlanningArtifact,
  WebSearchMapPlanningManifest,
} from './web-search-map-planning-types'
import type { TurfCalculationResult } from '../maplibre-turf-fixture'

export function buildWebSearchMapPlanningManifest(input: {
  runId: string
  planningSources: PlanningSourceRecord[]
  locationCandidates: LocationCandidate[]
  turfCalculations: TurfCalculationResult
  map2D: WebSearchMap2DRenderResult
  map3D: WebSearchMap3DRenderResult
  artifacts: WebSearchMapPlanningArtifact[]
  warnings: string[]
  blockers: string[]
}): WebSearchMapPlanningManifest {
  return {
    runId: input.runId,
    phase: '50F',
    mode: webSearchMapPlanningConfig.mode,
    webSearchEvidenceRunId: webSearchMapPlanningConfig.canonicalPhase49PRunId,
    mapEvidenceRunId: webSearchMapPlanningConfig.canonicalPhase50ERunId,
    generatedFixture: true,
    liveSearchUsed: false,
    liveGeocodingUsed: false,
    liveRoutingUsed: false,
    liveTilesUsed: false,
    paidMapProviderUsed: false,
    publicSearxngUsed: false,
    publicArtifactAccess: false,
    planningSources: input.planningSources,
    locationCandidates: input.locationCandidates,
    turfSummary: input.turfCalculations.summary,
    map2D: {
      screenshotPath: input.map2D.renderMetadata?.screenshotPath,
      dimensions: input.map2D.renderMetadata?.screenshotDimensions,
      externalNetworkRequestsObserved: input.map2D.externalNetworkRequestsObserved.length,
    },
    map3D: {
      screenshotPath: input.map3D.renderMetadata?.screenshotPath,
      dimensions: input.map3D.renderMetadata?.screenshotDimensions,
      externalNetworkRequestsObserved: input.map3D.externalNetworkRequestsObserved.length,
    },
    artifacts: input.artifacts,
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
