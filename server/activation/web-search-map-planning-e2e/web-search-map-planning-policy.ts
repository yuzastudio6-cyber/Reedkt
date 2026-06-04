import type { WebSearchMapPlanningConfig, WebSearchMapPlanningSafetyFlags } from './web-search-map-planning-types'

export const webSearchMapPlanningConfig: WebSearchMapPlanningConfig = {
  phase: '50F',
  mode: 'web_search_map_planning_private_e2e',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  canonicalPhase49PRunId: 'phase49p-20260603T21361',
  canonicalPhase50ERunId: 'phase50e-20260604T130326',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-map-geospatial/phase50f',
  viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  previewMaxWidth: 960,
  thumbnailWidth: 320,
  maxLocationCandidates: 6,
  maxMapCaptures: 2,
}

export const webSearchMapPlanningSafetyFlags: WebSearchMapPlanningSafetyFlags = {
  webSearchEvidenceAllowed: true,
  liveSearchAllowed: false,
  generatedPlanningSourcesAllowed: true,
  locationCandidatesGeneratedOnly: true,
  liveGeocodingAllowed: false,
  liveRoutingAllowed: false,
  tileDownloadAllowed: false,
  liveTileProviderAllowed: false,
  publicOsmTileAllowed: false,
  paidMapProviderAllowed: false,
  publicSearxngAllowed: false,
  broadCrawlingAllowed: false,
  arbitraryUrlCaptureAllowed: false,
  mapLibreRenderAllowed: true,
  mapLibreRenderScope: 'local_offline_fixture_only',
  deckGlOverlayAllowed: true,
  deckGlOverlayScope: 'local_offline_fixture_only',
  cesiumJsRenderAllowed: true,
  cesiumJsRenderScope: 'local_offline_fixture_only',
  cesiumIonAllowed: false,
  liveTerrainAllowed: false,
  liveImageryAllowed: false,
  threeDTilesAllowed: false,
  d3RuntimeAllowed: false,
  threeJsRuntimeAllowed: false,
  playwrightCaptureAllowed: true,
  sharpProcessingAllowed: true,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export const webSearchMapPlanningRequiredScripts = [
  'activation:web-search-map-planning-e2e',
  'activation:web-search-map-planning-e2e:report',
  'activation:web-search-map-planning-e2e:iam-plan',
  'smoke:activation-web-search-map-planning-e2e',
] as const

export const webSearchMapPlanningRequiredDocs = [
  'docs/activation-web-search-map-planning-e2e-runbook.md',
  'docs/activation-web-search-map-planning-e2e-policy.md',
  'docs/activation-web-search-map-planning-e2e-artifact-policy.md',
  'docs/activation-web-search-map-planning-e2e-qa-policy.md',
  'docs/activation-phase-50f-web-search-map-planning-e2e-results.md',
] as const

export const webSearchMapPlanningQaGateIds = [
  'web_search_evidence',
  'map_stack_evidence',
  'planning_source_integrity',
  'location_candidate_integrity',
  'turf_planning_calculations',
  'maplibre_planning_render',
  'deckgl_planning_overlay',
  'cesiumjs_3d_planning',
  'capture_artifacts',
  'artifact_privacy',
  'blocked_features',
] as const

export function makeWebSearchMapPlanningRunId(): string {
  const now = new Date().toISOString()
  return `phase50f-${now.slice(0, 10).replace(/-/g, '')}T${now.slice(11, 19).replace(/:/g, '')}`
}

export function webSearchMapPlanningArtifactPrefix(runId: string): string {
  if (!/^phase50f-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 50F run id: ${runId}`)
  return `${webSearchMapPlanningConfig.reportObjectPrefix}/${runId}`
}

export function validateWebSearchMapPlanningExecutionEnv(input: {
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_WEB_SEARCH_MAP_PLANNING_E2E
  const mode = input.mode ?? process.env.REEDITPRO_WEB_SEARCH_MAP_PLANNING_MODE ?? webSearchMapPlanningConfig.mode

  if (projectId !== webSearchMapPlanningConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== webSearchMapPlanningConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== webSearchMapPlanningConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== webSearchMapPlanningConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_WEB_SEARCH_MAP_PLANNING_E2E=true is required for Phase 50F execution.')
  if (mode !== webSearchMapPlanningConfig.mode) blockers.push('Mode must be exactly web_search_map_planning_private_e2e.')

  const falseFlags: Record<string, string | undefined> = {
    LIVE_SEARCH_ALLOWED: process.env.LIVE_SEARCH_ALLOWED,
    LIVE_GEOCODING_ALLOWED: process.env.LIVE_GEOCODING_ALLOWED ?? process.env.GEOCODING_ALLOWED,
    LIVE_ROUTING_ALLOWED: process.env.LIVE_ROUTING_ALLOWED ?? process.env.ROUTING_ALLOWED,
    TILE_DOWNLOAD_ALLOWED: process.env.TILE_DOWNLOAD_ALLOWED,
    LIVE_TILE_PROVIDER_ALLOWED: process.env.LIVE_TILE_PROVIDER_ALLOWED,
    PUBLIC_OSM_TILE_ALLOWED: process.env.PUBLIC_OSM_TILE_ALLOWED,
    PAID_MAP_PROVIDER_ALLOWED: process.env.PAID_MAP_PROVIDER_ALLOWED,
    PUBLIC_SEARXNG_INSTANCE_ALLOWED: process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED,
    BROAD_CRAWLING_ALLOWED: process.env.BROAD_CRAWLING_ALLOWED,
    ARBITRARY_URL_CAPTURE_ALLOWED: process.env.ARBITRARY_URL_CAPTURE_ALLOWED,
    CESIUM_ION_ALLOWED: process.env.CESIUM_ION_ALLOWED,
    LIVE_TERRAIN_ALLOWED: process.env.LIVE_TERRAIN_ALLOWED ?? process.env.LIVE_TERRAIN_PROVIDER_ALLOWED,
    LIVE_IMAGERY_ALLOWED: process.env.LIVE_IMAGERY_ALLOWED ?? process.env.LIVE_IMAGERY_PROVIDER_ALLOWED,
    THREE_D_TILES_ALLOWED: process.env.THREE_D_TILES_ALLOWED,
    D3_RUNTIME_ALLOWED: process.env.D3_RUNTIME_ALLOWED,
    THREE_JS_RUNTIME_ALLOWED: process.env.THREE_JS_RUNTIME_ALLOWED,
    PUBLIC_ARTIFACT_ALLOWED: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED,
    REEDITPRO_PRODUCTION_READY: process.env.REEDITPRO_PRODUCTION_READY,
    REEDITPRO_EXTERNAL_BETA_READY: process.env.REEDITPRO_EXTERNAL_BETA_READY,
    REEDITPRO_PAID_PRODUCTION_READY: process.env.REEDITPRO_PAID_PRODUCTION_READY,
    REEDITPRO_BROAD_REAL_MEDIA_READY: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY,
  }
  for (const [name, value] of Object.entries(falseFlags)) {
    if (value === 'true') blockers.push(`${name} must remain false or unset for Phase 50F.`)
  }

  warnings.push('Phase 50F may render/capture only generated local/offline map-planning fixtures and upload private artifacts.')
  warnings.push('Live search, geocoding, routing, tiles, paid map providers, public SearXNG, broad crawling, arbitrary URL capture, production, beta, and broad media remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
