import { existsSync, readFileSync } from 'node:fs'
import type {
  MapGeospatialCommandPlan,
  MapGeospatialDataPolicy,
  MapGeospatialFuturePhase,
  MapGeospatialLicenseReview,
  MapGeospatialQaGate,
  MapGeospatialQaGateId,
  MapGeospatialQaSummary,
  MapGeospatialRisk,
  MapGeospatialToolEvidence,
  MapGeospatialToolScope,
} from './map-geospatial-approval-types'

export function buildMapGeospatialQaSummary(input: {
  tools: MapGeospatialToolEvidence[]
  licenseReviews: MapGeospatialLicenseReview[]
  toolScopes: MapGeospatialToolScope[]
  dataPolicy: MapGeospatialDataPolicy
  risks: MapGeospatialRisk[]
  futureScope: MapGeospatialFuturePhase[]
  commandPlans: MapGeospatialCommandPlan[]
  requiredScripts: readonly string[]
  envBlockers: string[]
  envWarnings: string[]
}): MapGeospatialQaSummary {
  const toolIds = new Set(input.tools.map((tool) => tool.toolId))
  const requiredTools = ['maplibre-gl-js', 'turf-js', 'deck-gl', 'cesium-js', 'openstreetmap-open-data'] as const
  const futureTools = ['pmtiles', 'tileserver-gl', 'martin', 'nominatim', 'photon', 'pelias', 'osrm', 'valhalla'] as const
  const toolEvidence = requiredTools.every((toolId) => toolIds.has(toolId)) && futureTools.every((toolId) => toolIds.has(toolId))
  const planningApproved = requiredTools.every((toolId) => input.licenseReviews.some((review) => review.toolId === toolId && review.codexDecision === 'staging_planning_approved'))
  const futurePending = futureTools.every((toolId) => input.licenseReviews.some((review) => review.toolId === toolId && review.codexDecision === 'pending_evidence'))
  const freeDefault = requiredTools.every((toolId) => {
    const tool = input.tools.find((entry) => entry.toolId === toolId)
    return !!tool && tool.defaultStack && !tool.requiresApiKeyByDefault && !tool.paidProviderDependencyByDefault && !tool.runtimeAllowedInPhase50A
  })
  const ownershipBoundaries = ['map_geospatial', 'ai_tools', 'track_b', 'web_search'].every((owner) => input.toolScopes.some((scope) => scope.owner === owner))
    && input.toolScopes.some((scope) => scope.owner === 'ai_tools' && scope.retainedElsewhere.some((entry) => entry.includes('D3')))
    && input.toolScopes.some((scope) => scope.owner === 'track_b' && scope.retainedElsewhere.some((entry) => entry.includes('Sharp')))
  const dataPolicyPassed = input.dataPolicy.freeOpenSourceOpenDataFirst
    && input.dataPolicy.privateSelfHostedGeneratedFixturesFirst
    && input.dataPolicy.osmAttributionRequired
    && input.dataPolicy.paidMapProvidersAllowed === false
    && input.dataPolicy.publicTileHotlinkingForBetaProdAllowed === false
    && input.dataPolicy.mapboxPaidTilesAllowed === false
    && input.dataPolicy.googleMapsApisAllowed === false
    && input.dataPolicy.cesiumIonPaidAssetsAllowed === false
    && input.dataPolicy.frontendMapProviderSecretsAllowed === false
    && input.dataPolicy.publicArtifactsAllowed === false
  const riskRegisterComplete = input.risks.some((risk) => risk.severity === 'blocker')
    && input.risks.some((risk) => risk.severity === 'warning')
    && ['unclear_license_provenance', 'osm_attribution_missing', 'public_tile_hotlink_policy_violation', 'paid_map_api_enabled', 'map_provider_secret_frontend_exposure', 'arbitrary_tile_endpoint_injection', 'arbitrary_geocoding_routing_calls', 'location_privacy_leakage', 'public_map_screenshots_artifacts', 'cesium_ion_paid_dependency', 'no_generated_fixture_qa'].every((riskId) => input.risks.some((risk) => risk.riskId === riskId))
  const futureScopeDefined = ['50B', '50C', '50D', '50E', '50F', '50G'].every((phaseId) => input.futureScope.some((phase) => phase.phaseId === phaseId))
  const commandPlanBlocked = input.commandPlans.length >= 6
    && input.commandPlans.every((plan) => plan.textOnlyByDefault && plan.allowedInPhase50A === false && plan.executableCommand === null && plan.blockedReason.length > 0)
  const scriptsPresent = packageScriptsPresent(input.requiredScripts)
  const blockedFeatures = input.envBlockers.length === 0
    && input.tools.every((tool) => tool.runtimeAllowedInPhase50A === false)
    && dataPolicyPassed
    && commandPlanBlocked

  const gates: MapGeospatialQaGate[] = [
    gate('tool_evidence', toolEvidence, 'Core and future-scoped map/geospatial tool evidence records are present.'),
    gate('license_review', planningApproved && futurePending, 'Core stack license/source evidence is planning-approved and future candidates stay pending evidence.'),
    gate('free_open_source_default', freeDefault, 'MapLibre, Turf, deck.gl, CesiumJS OSS, and OSM/open data are the free/open-source planning default.'),
    gate('ownership_boundaries', ownershipBoundaries, 'Map/geospatial boundaries do not claim AI Tools creative graphics, Track B runtime tools, or web-search ownership.'),
    gate('data_provider_policy', dataPolicyPassed, 'Paid map providers, public tile hotlinking, arbitrary tile endpoints, frontend secrets, and public artifacts remain blocked.'),
    gate('risk_register_complete', riskRegisterComplete, 'Blocker and warning risks are documented with mitigation and evidence required to clear.'),
    gate('future_scope_defined', futureScopeDefined, 'Phases 50B-50G are defined and blocked in Phase 50A.'),
    gate('command_plan_blocked', commandPlanBlocked, 'Future command plans are text-only and non-executable in Phase 50A.'),
    gate('package_scripts_present', scriptsPresent, 'Phase 50A package scripts are present.'),
    gate('blocked_features', blockedFeatures, 'Map runtime, tile downloads, live geocoding/routing, paid providers, public artifacts, production, beta, broad media, providers, and Revideo remain blocked.'),
  ]
  const blockers = [
    ...input.envBlockers,
    ...(toolEvidence ? [] : ['Missing map/geospatial tool evidence.']),
    ...(planningApproved && futurePending ? [] : ['License/source review decisions are incomplete.']),
    ...(freeDefault ? [] : ['Free/open-source default stack is incomplete or runtime-enabled.']),
    ...(ownershipBoundaries ? [] : ['Ownership boundaries are incomplete.']),
    ...(dataPolicyPassed ? [] : ['Data/provider policy leaves a blocked provider or artifact path enabled.']),
    ...(riskRegisterComplete ? [] : ['Risk register is incomplete.']),
    ...(futureScopeDefined ? [] : ['Future scope is incomplete.']),
    ...(commandPlanBlocked ? [] : ['Command plan is executable or incomplete.']),
    ...(scriptsPresent ? [] : ['Required Phase 50A package scripts are missing.']),
  ]
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set([
      ...input.envWarnings,
      'Phase 50A approves architecture/planning only; runtime dependencies and map rendering require later fixture phases.',
      'OSM/open-data output requires attribution and tile-service policy review before any rendered artifact.',
    ])),
  }
}

function gate(gateId: MapGeospatialQaGateId, passed: boolean, summary: string): MapGeospatialQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}

function packageScriptsPresent(scripts: readonly string[]): boolean {
  if (!existsSync('package.json')) return false
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  return scripts.every((script) => Boolean(packageJson.scripts?.[script]))
}
