import type {
  MapGeospatialReadinessConfig,
  MapGeospatialReadinessQaGateId,
  MapGeospatialReadinessSafetyFlags,
} from './map-geospatial-readiness-types'

export const mapGeospatialReadinessConfig: MapGeospatialReadinessConfig = {
  phase: '50G',
  mode: 'map_geospatial_internal_readiness_gate',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  artifactPrefixBase: 'activation-map-geospatial/phase50g',
  canonicalPhase49PRunId: 'phase49p-20260603T21361',
  canonicalPhase50BRunId: 'phase50b-20260604T01114',
  canonicalPhase50CRunId: 'phase50c-20260604T020852',
  canonicalPhase50DRunId: 'phase50d-20260604T030406',
  canonicalPhase50ERunId: 'phase50e-20260604T130326',
  canonicalPhase50FRunId: 'phase50f-20260604T141223',
}

export const mapGeospatialReadinessSafetyFlags: MapGeospatialReadinessSafetyFlags = {
  readinessAuditOnly: true,
  newMapRenderingAllowed: false,
  newPlaywrightCaptureAllowed: false,
  liveTileProviderAllowed: false,
  publicOsmTileAllowed: false,
  tileDownloadAllowed: false,
  liveGeocodingAllowed: false,
  liveRoutingAllowed: false,
  paidMapProviderAllowed: false,
  mapboxPaidApiAllowed: false,
  googleMapsApiAllowed: false,
  cesiumIonAllowed: false,
  liveTerrainAllowed: false,
  liveImageryAllowed: false,
  threeDTilesAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  arbitraryUserLocationAllowed: false,
  d3RuntimeAllowed: false,
  threeJsRuntimeAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const mapGeospatialReadinessRequiredScripts = [
  'activation:map-geospatial-readiness',
  'activation:map-geospatial-readiness:report',
  'activation:map-geospatial-readiness:iam-plan',
  'smoke:activation-map-geospatial-readiness',
] as const

export const mapGeospatialReadinessRequiredDocs = [
  'docs/activation-map-geospatial-readiness-runbook.md',
  'docs/activation-map-geospatial-readiness-policy.md',
  'docs/activation-map-geospatial-readiness-artifact-policy.md',
  'docs/activation-map-geospatial-readiness-qa-policy.md',
  'docs/activation-phase-50g-map-geospatial-readiness-results.md',
] as const

export const mapGeospatialReadinessQaGateIds: MapGeospatialReadinessQaGateId[] = [
  'phase_evidence_chain',
  'maplibre_ready',
  'turf_ready',
  'deckgl_ready',
  'cesiumjs_ready',
  'web_search_map_e2e_ready',
  'provider_data_policy',
  'network_artifact_privacy',
  'ownership_boundaries',
  'failure_policy',
  'readiness_docs_consistency',
  'blocked_features',
]

export function makeMapGeospatialReadinessRunId(): string {
  const now = new Date().toISOString()
  return `phase50g-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function mapGeospatialReadinessArtifactPrefix(runId: string): string {
  if (!/^phase50g-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 50G run id: ${runId}`)
  return `${mapGeospatialReadinessConfig.artifactPrefixBase}/${runId}`
}

export function validateMapGeospatialReadinessExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_MAP_GEOSPATIAL_INTERNAL_READINESS
  const mode = input.mode ?? process.env.REEDITPRO_MAP_GEOSPATIAL_READINESS_MODE ?? mapGeospatialReadinessConfig.mode

  if (projectId !== mapGeospatialReadinessConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== mapGeospatialReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== mapGeospatialReadinessConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== mapGeospatialReadinessConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_MAP_GEOSPATIAL_INTERNAL_READINESS=true is required for Phase 50G execution.')
  if (mode !== mapGeospatialReadinessConfig.mode) blockers.push('Mode must be exactly map_geospatial_internal_readiness_gate.')

  const falseFlags: Record<string, string | undefined> = {
    NEW_MAP_RENDERING_ALLOWED: process.env.NEW_MAP_RENDERING_ALLOWED,
    PLAYWRIGHT_CAPTURE_ALLOWED: process.env.PLAYWRIGHT_CAPTURE_ALLOWED ?? process.env.NEW_PLAYWRIGHT_CAPTURE_ALLOWED,
    LIVE_TILE_PROVIDER_ALLOWED: process.env.LIVE_TILE_PROVIDER_ALLOWED,
    PUBLIC_OSM_TILE_ALLOWED: process.env.PUBLIC_OSM_TILE_ALLOWED,
    TILE_DOWNLOAD_ALLOWED: process.env.TILE_DOWNLOAD_ALLOWED,
    LIVE_GEOCODING_ALLOWED: process.env.LIVE_GEOCODING_ALLOWED ?? process.env.GEOCODING_ALLOWED,
    LIVE_ROUTING_ALLOWED: process.env.LIVE_ROUTING_ALLOWED ?? process.env.ROUTING_ALLOWED,
    PAID_MAP_PROVIDER_ALLOWED: process.env.PAID_MAP_PROVIDER_ALLOWED,
    MAPBOX_PAID_API_ALLOWED: process.env.MAPBOX_PAID_API_ALLOWED,
    GOOGLE_MAPS_API_ALLOWED: process.env.GOOGLE_MAPS_API_ALLOWED,
    CESIUM_ION_ALLOWED: process.env.CESIUM_ION_ALLOWED,
    LIVE_TERRAIN_ALLOWED: process.env.LIVE_TERRAIN_ALLOWED ?? process.env.LIVE_TERRAIN_PROVIDER_ALLOWED,
    LIVE_IMAGERY_ALLOWED: process.env.LIVE_IMAGERY_ALLOWED ?? process.env.LIVE_IMAGERY_PROVIDER_ALLOWED,
    THREE_D_TILES_ALLOWED: process.env.THREE_D_TILES_ALLOWED,
    PUBLIC_ARTIFACT_ALLOWED: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED,
    SIGNED_URL_SOURCE_OF_TRUTH_ALLOWED: process.env.SIGNED_URL_SOURCE_OF_TRUTH_ALLOWED,
    ARBITRARY_USER_LOCATION_ALLOWED: process.env.ARBITRARY_USER_LOCATION_ALLOWED,
    D3_RUNTIME_ALLOWED: process.env.D3_RUNTIME_ALLOWED,
    THREE_JS_RUNTIME_ALLOWED: process.env.THREE_JS_RUNTIME_ALLOWED,
    REEDITPRO_PRODUCTION_READY: process.env.REEDITPRO_PRODUCTION_READY,
    REEDITPRO_EXTERNAL_BETA_READY: process.env.REEDITPRO_EXTERNAL_BETA_READY,
    REEDITPRO_PAID_PRODUCTION_READY: process.env.REEDITPRO_PAID_PRODUCTION_READY,
    REEDITPRO_BROAD_REAL_MEDIA_READY: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY,
  }

  for (const [name, value] of Object.entries(falseFlags)) {
    if (value === 'true') blockers.push(`${name} must remain false or unset for Phase 50G.`)
  }

  warnings.push('Phase 50G is evidence-only; it must not render maps, launch Playwright, call tiles, geocoding, routing, map providers, Docker, Cloud Run, or production/beta paths.')
  return { ok: blockers.length === 0, blockers, warnings }
}
