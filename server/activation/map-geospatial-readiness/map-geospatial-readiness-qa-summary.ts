import { mapGeospatialReadinessQaGateIds, mapGeospatialReadinessRequiredDocs, mapGeospatialReadinessRequiredScripts, mapGeospatialReadinessSafetyFlags } from './map-geospatial-readiness-policy'
import type {
  MapGeospatialArtifactPrivacyAudit,
  MapGeospatialDependencyAudit,
  MapGeospatialEvidenceChain,
  MapGeospatialFailurePolicy,
  MapGeospatialOwnershipAudit,
  MapGeospatialProviderDataAudit,
  MapGeospatialReadinessQaGate,
  MapGeospatialReadinessQaGateId,
  MapGeospatialReadinessQaSummary,
} from './map-geospatial-readiness-types'

export function buildMapGeospatialReadinessQaSummary(input: {
  evidenceChain: MapGeospatialEvidenceChain
  providerDataAudit: MapGeospatialProviderDataAudit
  dependencyAudit: MapGeospatialDependencyAudit
  ownershipAudit: MapGeospatialOwnershipAudit
  artifactPrivacyAudit: MapGeospatialArtifactPrivacyAudit
  failurePolicy: MapGeospatialFailurePolicy
  docsPresent: boolean
  scriptsPresent: boolean
  executionBlockers?: string[]
  executionWarnings?: string[]
}): MapGeospatialReadinessQaSummary {
  const phase = (id: string) => input.evidenceChain.phases.find((entry) => entry.phase === id)
  const evidenceReady = input.evidenceChain.evidenceStatus === 'ready' && ['49P', '50A', '50B', '50C', '50D', '50E', '50F'].every((id) => Boolean(phase(id)))
  const blockedFeatures =
    !mapGeospatialReadinessSafetyFlags.liveTileProviderAllowed &&
    !mapGeospatialReadinessSafetyFlags.publicOsmTileAllowed &&
    !mapGeospatialReadinessSafetyFlags.tileDownloadAllowed &&
    !mapGeospatialReadinessSafetyFlags.liveGeocodingAllowed &&
    !mapGeospatialReadinessSafetyFlags.liveRoutingAllowed &&
    !mapGeospatialReadinessSafetyFlags.paidMapProviderAllowed &&
    !mapGeospatialReadinessSafetyFlags.cesiumIonAllowed &&
    !mapGeospatialReadinessSafetyFlags.d3RuntimeAllowed &&
    !mapGeospatialReadinessSafetyFlags.threeJsRuntimeAllowed &&
    !mapGeospatialReadinessSafetyFlags.productionReadyAllowed &&
    !mapGeospatialReadinessSafetyFlags.externalBetaAllowed &&
    !mapGeospatialReadinessSafetyFlags.broadMediaAllowed
  const gates: MapGeospatialReadinessQaGate[] = [
    gate('phase_evidence_chain', evidenceReady, 'Phase 49P and Phase 50A-50F canonical evidence is present and internally consistent.'),
    gate('maplibre_ready', phase('50C')?.status === 'completed' && phase('50F')?.status === 'completed', 'MapLibre local/offline render evidence passed in Phase 50C and was consumed in Phase 50F.'),
    gate('turf_ready', phase('50B')?.status === 'completed' && phase('50F')?.status === 'completed', 'Turf generated/local calculations passed in Phase 50B and Phase 50F planning data.'),
    gate('deckgl_ready', phase('50D')?.status === 'completed' && phase('50F')?.status === 'completed', 'deck.gl local/offline overlay evidence passed in Phase 50D and Phase 50F.'),
    gate('cesiumjs_ready', phase('50E')?.status === 'completed' && phase('50F')?.status === 'completed', 'CesiumJS local/offline 3D planning evidence passed in Phase 50E and Phase 50F.'),
    gate('web_search_map_e2e_ready', phase('50F')?.readiness === 'ready_for_map_geospatial_internal_readiness_gate', 'Phase 50F web-search + map planning private E2E reached Phase 50G readiness.'),
    gate('provider_data_policy', input.providerDataAudit.blockers.length === 0, 'Live tiles, public OSM tiles, geocoding/routing, paid providers, Cesium ion, live terrain/imagery, and 3D Tiles remain blocked.'),
    gate('network_artifact_privacy', input.artifactPrivacyAudit.blockers.length === 0, 'Canonical rendered phases recorded zero external requests and private GCS artifacts only.'),
    gate('ownership_boundaries', input.ownershipAudit.blockers.length === 0 && input.ownershipAudit.sharpOwnershipPreserved && input.ownershipAudit.d3ThreeOwnershipPreserved, 'Map/geospatial, AI Tools, Track B, and web-search ownership boundaries are preserved.'),
    gate('failure_policy', input.failurePolicy.blockers.length === 0 && input.failurePolicy.failClosed, 'Fail-closed policy is present for tile, provider, geocoding/routing, network, user-location, upload, and capture failures.'),
    gate('readiness_docs_consistency', input.docsPresent && input.scriptsPresent, 'Phase 50G docs and package scripts are present.'),
    gate('blocked_features', blockedFeatures, 'Production, external beta, broad media, live tiles, geocoding/routing, paid providers, D3, and Three.js remain blocked.'),
  ]
  for (const gateId of mapGeospatialReadinessQaGateIds) {
    if (!gates.some((entry) => entry.gateId === gateId)) throw new Error(`Missing Phase 50G QA gate ${gateId}`)
  }
  const blockers = [
    ...gates.filter((entry) => !entry.passed).map((entry) => `${entry.gateId} failed.`),
    ...input.evidenceChain.blockers,
    ...input.providerDataAudit.blockers,
    ...input.dependencyAudit.blockers,
    ...input.ownershipAudit.blockers,
    ...input.artifactPrivacyAudit.blockers,
    ...input.failurePolicy.blockers,
    ...(input.executionBlockers ?? []),
  ]
  const warnings = [
    ...input.evidenceChain.warnings,
    ...input.providerDataAudit.warnings,
    ...input.dependencyAudit.warnings,
    ...input.ownershipAudit.warnings,
    ...input.artifactPrivacyAudit.warnings,
    ...input.failurePolicy.warnings,
    ...(input.executionWarnings ?? []),
  ]
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

export function areMapGeospatialReadinessDocsPresent(existingPaths: Set<string>): boolean {
  return mapGeospatialReadinessRequiredDocs.every((doc) => existingPaths.has(doc))
}

export function areMapGeospatialReadinessScriptsPresent(scripts: Record<string, string>): boolean {
  return mapGeospatialReadinessRequiredScripts.every((script) => Boolean(scripts[script]))
}

function gate(gateId: MapGeospatialReadinessQaGateId, passed: boolean, summary: string): MapGeospatialReadinessQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
