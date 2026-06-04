import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildMapGeospatialApprovalReport,
  buildMapGeospatialCommandPlans,
  buildMapGeospatialDataPolicy,
  buildMapGeospatialLicenseReviews,
  buildMapGeospatialRiskRegister,
  buildMapGeospatialToolEvidence,
  buildMapGeospatialToolScopes,
  mapGeospatialApprovalConfig,
  mapGeospatialQaGateIds,
  mapGeospatialRequiredDocs,
  mapGeospatialRequiredScripts,
  validateMapGeospatialApprovalStaticEnv,
} from '../activation/map-geospatial-approval'

const tools = buildMapGeospatialToolEvidence()
const toolIds = new Set(tools.map((tool) => tool.toolId))
const reviews = buildMapGeospatialLicenseReviews()
const scopes = buildMapGeospatialToolScopes()
const dataPolicy = buildMapGeospatialDataPolicy()
const risks = buildMapGeospatialRiskRegister()
const commandPlans = buildMapGeospatialCommandPlans()
const report = buildMapGeospatialApprovalReport()

assert.equal(mapGeospatialApprovalConfig.phase, '50A')
assert.equal(mapGeospatialApprovalConfig.runtimeMode, 'map_geospatial_approval_static')

for (const toolId of ['maplibre-gl-js', 'turf-js', 'deck-gl', 'cesium-js', 'openstreetmap-open-data', 'pmtiles', 'tileserver-gl', 'martin', 'nominatim', 'photon', 'pelias', 'osrm', 'valhalla'] as const) {
  assert.ok(toolIds.has(toolId), `missing tool evidence ${toolId}`)
}

for (const toolId of ['maplibre-gl-js', 'turf-js', 'deck-gl', 'cesium-js', 'openstreetmap-open-data'] as const) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  assert.ok(tool?.defaultStack, `${toolId} must be default planning stack`)
  assert.equal(tool?.requiresApiKeyByDefault, false)
  assert.equal(tool?.paidProviderDependencyByDefault, false)
  assert.equal(tool?.runtimeAllowedInPhase50A, false)
  assert.ok(tool?.sourceUrls.length)
  assert.ok(reviews.some((review) => review.toolId === toolId && review.codexDecision === 'staging_planning_approved'))
}

for (const toolId of ['pmtiles', 'tileserver-gl', 'martin', 'nominatim', 'photon', 'pelias', 'osrm', 'valhalla'] as const) {
  assert.ok(reviews.some((review) => review.toolId === toolId && review.codexDecision === 'pending_evidence'), `${toolId} must remain future-scoped`)
}

assert.ok(scopes.some((scope) => scope.owner === 'map_geospatial' && scope.ownedCapabilities.some((entry) => entry.includes('MapLibre'))))
assert.ok(scopes.some((scope) => scope.owner === 'ai_tools' && scope.retainedElsewhere.some((entry) => entry.includes('D3'))))
assert.ok(scopes.some((scope) => scope.owner === 'track_b' && scope.retainedElsewhere.some((entry) => entry.includes('Sharp'))))
assert.ok(scopes.some((scope) => scope.owner === 'web_search' && scope.retainedElsewhere.some((entry) => entry.includes('source discovery'))))

assert.equal(dataPolicy.freeOpenSourceOpenDataFirst, true)
assert.equal(dataPolicy.privateSelfHostedGeneratedFixturesFirst, true)
assert.equal(dataPolicy.paidMapProvidersAllowed, false)
assert.equal(dataPolicy.publicTileHotlinkingForBetaProdAllowed, false)
assert.equal(dataPolicy.mapboxPaidTilesAllowed, false)
assert.equal(dataPolicy.googleMapsApisAllowed, false)
assert.equal(dataPolicy.cesiumIonPaidAssetsAllowed, false)
assert.equal(dataPolicy.publicNominatimHeavyUseAllowed, false)
assert.equal(dataPolicy.arbitraryTileEndpointsAllowed, false)
assert.equal(dataPolicy.frontendMapProviderSecretsAllowed, false)
assert.equal(dataPolicy.publicArtifactsAllowed, false)

for (const riskId of ['unclear_license_provenance', 'osm_attribution_missing', 'public_tile_hotlink_policy_violation', 'paid_map_api_enabled', 'map_provider_secret_frontend_exposure', 'arbitrary_tile_endpoint_injection', 'arbitrary_geocoding_routing_calls', 'location_privacy_leakage', 'public_map_screenshots_artifacts', 'cesium_ion_paid_dependency', 'no_generated_fixture_qa']) {
  assert.ok(risks.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `missing blocker risk ${riskId}`)
}
assert.ok(risks.some((risk) => risk.severity === 'warning'))

assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(commandPlans.every((plan) => plan.allowedInPhase50A === false))
assert.ok(commandPlans.every((plan) => plan.executableCommand === null))
assert.ok(commandPlans.every((plan) => plan.blockedReason.length > 0))
assert.ok(!JSON.stringify(commandPlans).includes('MAPBOX'))
assert.ok(!JSON.stringify(commandPlans).includes('GOOGLE_MAPS_API_KEY'))

assert.equal(validateMapGeospatialApprovalStaticEnv({
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
  providerExecutionEnabled: 'false',
  publicAccessEnabled: 'false',
  revideoEnabled: 'false',
}).allowed, true)
assert.equal(validateMapGeospatialApprovalStaticEnv({ productionReady: 'true' }).allowed, false)

assert.equal(report.status, 'approval_review_complete')
assert.equal(report.codexDecision, 'staging_planning_approved_free_open_source_map_stack')
assert.equal(report.phase50BReadiness, 'ready_for_generated_maplibre_turf_fixture_planning_only')
assert.equal(report.mapLibrePlanningAllowed, true)
assert.equal(report.turfPlanningAllowed, true)
assert.equal(report.deckGlPlanningAllowed, true)
assert.equal(report.cesiumJsPlanningAllowed, true)
assert.equal(report.mapRuntimeAllowed, false)
assert.equal(report.tileDownloadAllowed, false)
assert.equal(report.liveGeocodingAllowed, false)
assert.equal(report.liveRoutingAllowed, false)
assert.equal(report.paidMapProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadMediaAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), mapGeospatialQaGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)

for (const doc of mapGeospatialRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
for (const script of mapGeospatialRequiredScripts) assert.ok(scripts[script], `missing package script ${script}`)
assert.equal(scripts['activation:map-geospatial-approval:plan'], 'tsx server/cli/activation-map-geospatial-approval-plan.ts')
assert.equal(scripts['activation:map-geospatial-approval:report'], 'tsx server/cli/activation-map-geospatial-approval-report.ts')
assert.equal(scripts['activation:map-geospatial-tool:summary'], 'tsx server/cli/activation-map-geospatial-tool-summary.ts')
assert.equal(scripts['smoke:activation-map-geospatial-approval-workflow'], 'tsx server/smoke/activation-map-geospatial-approval-workflow-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase50a_policy',
    'tool_evidence',
    'license_review',
    'free_open_source_default',
    'ownership_boundaries',
    'data_provider_policy',
    'risk_register',
    'future_scope',
    'command_plan_blocked',
    'blocked_features',
  ],
}))
