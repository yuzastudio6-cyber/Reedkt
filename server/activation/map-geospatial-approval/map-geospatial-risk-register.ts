import type { MapGeospatialRisk } from './map-geospatial-approval-types'

export function buildMapGeospatialRiskRegister(): MapGeospatialRisk[] {
  return [
    blocker('unclear_license_provenance', 'all', 'Keep runtime blocked until license/source evidence is explicit for every runtime dependency.', 'Official license/source URLs and dependency review.'),
    blocker('osm_attribution_missing', 'openstreetmap-open-data', 'Require visible attribution planning before any rendered map output.', 'Attribution UI/caption policy and QA evidence.'),
    blocker('public_tile_hotlink_policy_violation', 'openstreetmap-open-data', 'Block public tile hotlinking for beta/production; prefer generated/local/self-hosted tiles.', 'Approved tile policy and self-host/private tile evidence.'),
    blocker('paid_map_api_enabled', 'map providers', 'Block Mapbox, Google Maps, Cesium ion, and paid map providers by default.', 'Separate provider approval, budget, secret, and legal policy.'),
    blocker('map_provider_secret_frontend_exposure', 'map providers', 'No frontend map provider secrets or API keys.', 'Frontend boundary audit.'),
    blocker('arbitrary_tile_endpoint_injection', 'tile endpoints', 'Allow only approved style/source endpoints in future plan snapshots.', 'Tile endpoint allowlist validator and fixture tests.'),
    blocker('arbitrary_geocoding_routing_calls', 'geocoding/routing', 'No live geocoding/routing API calls in Phase 50A.', 'Future private/self-hosted service policy and query limits.'),
    blocker('location_privacy_leakage', 'location data', 'Do not store or expose sensitive user/location data without retention and privacy policy.', 'Location privacy classification and retention policy.'),
    blocker('public_map_screenshots_artifacts', 'artifacts', 'Map screenshots and manifests must remain private in future fixture phases.', 'Private artifact/IAM evidence.'),
    blocker('cesium_ion_paid_dependency', 'cesium-js', 'Approve only OSS CesiumJS planning; keep Cesium ion blocked.', 'Separate Cesium ion provider approval if ever needed.'),
    blocker('heavy_map_cost_performance', 'deck-gl/cesium-js', 'Defer advanced runtime until generated fixture performance QA exists.', 'Browser/GPU performance fixture evidence.'),
    blocker('no_generated_fixture_qa', 'maplibre-gl-js/turf-js', 'Do not approve runtime before a generated/local fixture QA phase.', 'Phase 50B fixture report.'),
    warning('geocoding_ambiguity', 'geocoding', 'Use safe wording and human review when locations are ambiguous.', 'Geocoding confidence and review policy.'),
    warning('route_accuracy_variance', 'routing', 'Treat routes as approximate unless source/route evidence is verified.', 'Routing confidence policy.'),
    warning('map_data_staleness', 'open map data', 'Expose data freshness in future map QA metadata.', 'Freshness metadata and source date policy.'),
    warning('tile_style_consistency', 'map styles', 'Validate style consistency with ReeditPro visual system in later fixtures.', 'Style fixture QA.'),
    warning('attribution_ui_quality', 'attribution', 'Ensure attribution is readable and not hidden by captions or UI.', 'Attribution layout QA.'),
    warning('browser_gpu_variance', 'deck-gl/cesium-js', 'Record browser/GPU compatibility expectations before internal testing.', 'Browser compatibility fixture matrix.'),
    warning('mobile_responsiveness', 'maplibre-gl-js', 'Map labels and UI must remain readable on mobile viewports.', 'Responsive map fixture screenshots.'),
  ]
}

function blocker(riskId: string, tool: string, mitigation: string, evidenceRequiredToClear: string): MapGeospatialRisk {
  return { riskId, tool, severity: 'blocker', currentStatus: 'blocked_by_policy', mitigation, evidenceRequiredToClear }
}

function warning(riskId: string, tool: string, mitigation: string, evidenceRequiredToClear: string): MapGeospatialRisk {
  return { riskId, tool, severity: 'warning', currentStatus: 'warning_tracked', mitigation, evidenceRequiredToClear }
}
