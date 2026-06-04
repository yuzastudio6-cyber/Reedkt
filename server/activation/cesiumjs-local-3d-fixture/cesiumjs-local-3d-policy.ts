import type { CesiumJsLocal3DConfig, CesiumJsLocal3DQaGateId, CesiumJsLocal3DSafetyFlags } from './cesiumjs-local-3d-types'

export const cesiumJsLocal3DConfig: CesiumJsLocal3DConfig = {
  phase: '50E',
  mode: 'cesiumjs_local_offline_3d_planning_fixture',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedPhase50DRunId: 'phase50d-20260604T030406',
  approvedPhase50DReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50d/phase50d-20260604T030406/reports/phase50d-report.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-map-geospatial/phase50e',
  viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  previewMaxWidth: 960,
  thumbnailWidth: 320,
  maxCesiumEntities: 20,
}

export const cesiumJsLocal3DSafetyFlags: CesiumJsLocal3DSafetyFlags = {
  cesiumJsRuntimeAllowed: true,
  cesiumJsRuntimeScope: 'generated_local_offline_3d_planning_fixture_only',
  cesiumIonAllowed: false,
  cesiumIonTokenAllowed: false,
  liveImageryProviderAllowed: false,
  liveTerrainProviderAllowed: false,
  threeDTilesAllowed: false,
  externalNetworkRequestsAllowed: false,
  tileDownloadAllowed: false,
  liveTileProviderAllowed: false,
  publicOsmTileAllowed: false,
  mapboxProviderAllowed: false,
  googleMapsProviderAllowed: false,
  geocodingAllowed: false,
  routingAllowed: false,
  deckGlRuntimeAllowed: false,
  d3RuntimeAllowed: false,
  threeJsRuntimeAllowed: false,
  paidMapProviderAllowed: false,
  mapRenderingAllowed: true,
  playwrightCaptureAllowed: true,
  sharpProcessingAllowed: true,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const cesiumJsLocal3DQaGateIds: CesiumJsLocal3DQaGateId[] = [
  'phase50d_evidence',
  'generated_3d_data_integrity',
  'cesium_local_scene',
  'cesium_render',
  'network_guard',
  'playwright_capture',
  'optional_screenshot_processing',
  'artifact_privacy',
  'blocked_features',
]

export const cesiumJsLocal3DRequiredScripts = [
  'activation:cesiumjs-local-3d-fixture',
  'activation:cesiumjs-local-3d-fixture:report',
  'activation:cesiumjs-local-3d-fixture:iam-plan',
  'smoke:activation-cesiumjs-local-3d-fixture',
] as const

export const cesiumJsLocal3DRequiredDocs = [
  'docs/activation-cesiumjs-local-3d-fixture-runbook.md',
  'docs/activation-cesiumjs-local-3d-fixture-policy.md',
  'docs/activation-cesiumjs-local-3d-fixture-artifact-policy.md',
  'docs/activation-cesiumjs-local-3d-fixture-qa-policy.md',
  'docs/activation-phase-50e-cesiumjs-local-3d-fixture-results.md',
] as const

export function makeCesiumJsLocal3DRunId(): string {
  const now = new Date()
  return `phase50e-${now.toISOString().slice(0, 10).replace(/-/g, '')}T${now.toISOString().slice(11, 19).replace(/:/g, '')}`
}

export function cesiumJsLocal3DArtifactPrefix(runId: string): string {
  if (!/^phase50e-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 50E run id: ${runId}`)
  return `${cesiumJsLocal3DConfig.reportObjectPrefix}/${runId}`
}

export function validateCesiumJsLocal3DExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
  cesiumIonAllowed?: string
  cesiumIonTokenAllowed?: string
  liveImageryProviderAllowed?: string
  liveTerrainProviderAllowed?: string
  threeDTilesAllowed?: string
  externalNetworkRequestsAllowed?: string
  tileDownloadAllowed?: string
  liveTileProviderAllowed?: string
  publicOsmTileAllowed?: string
  mapboxProviderAllowed?: string
  googleMapsProviderAllowed?: string
  geocodingAllowed?: string
  routingAllowed?: string
  deckGlRuntimeAllowed?: string
  d3RuntimeAllowed?: string
  threeJsRuntimeAllowed?: string
  paidMapProviderAllowed?: string
  publicArtifactAllowed?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
} = {}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_CESIUMJS_LOCAL_3D_FIXTURE
  const mode = input.mode ?? process.env.REEDITPRO_CESIUMJS_LOCAL_3D_MODE ?? cesiumJsLocal3DConfig.mode

  if (projectId !== cesiumJsLocal3DConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== cesiumJsLocal3DConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== cesiumJsLocal3DConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== cesiumJsLocal3DConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_CESIUMJS_LOCAL_3D_FIXTURE=true is required for execution.')
  if (mode !== cesiumJsLocal3DConfig.mode) blockers.push('Mode must be exactly cesiumjs_local_offline_3d_planning_fixture.')
  if ((input.cesiumIonAllowed ?? process.env.CESIUM_ION_ALLOWED ?? 'false') !== 'false') blockers.push('Cesium ion must remain disabled.')
  if ((input.cesiumIonTokenAllowed ?? process.env.CESIUM_ION_TOKEN_ALLOWED ?? 'false') !== 'false') blockers.push('Cesium ion token use must remain disabled.')
  if ((input.liveImageryProviderAllowed ?? process.env.LIVE_IMAGERY_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live imagery providers must remain disabled.')
  if ((input.liveTerrainProviderAllowed ?? process.env.LIVE_TERRAIN_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live terrain providers must remain disabled.')
  if ((input.threeDTilesAllowed ?? process.env.THREE_D_TILES_ALLOWED ?? 'false') !== 'false') blockers.push('3D Tiles must remain disabled.')
  if ((input.externalNetworkRequestsAllowed ?? process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false') !== 'false') blockers.push('External network requests must remain disabled.')
  if ((input.tileDownloadAllowed ?? process.env.TILE_DOWNLOAD_ALLOWED ?? 'false') !== 'false') blockers.push('Tile download must remain disabled.')
  if ((input.liveTileProviderAllowed ?? process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live tile providers must remain disabled.')
  if ((input.publicOsmTileAllowed ?? process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false') !== 'false') blockers.push('Public OSM tiles must remain disabled.')
  if ((input.mapboxProviderAllowed ?? process.env.MAPBOX_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Mapbox provider access must remain disabled.')
  if ((input.googleMapsProviderAllowed ?? process.env.GOOGLE_MAPS_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Google Maps provider access must remain disabled.')
  if ((input.geocodingAllowed ?? process.env.GEOCODING_ALLOWED ?? 'false') !== 'false') blockers.push('Geocoding must remain disabled.')
  if ((input.routingAllowed ?? process.env.ROUTING_ALLOWED ?? 'false') !== 'false') blockers.push('Routing must remain disabled.')
  if ((input.deckGlRuntimeAllowed ?? process.env.DECK_GL_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('deck.gl runtime must remain disabled in Phase 50E.')
  if ((input.d3RuntimeAllowed ?? process.env.D3_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('D3 runtime must remain disabled.')
  if ((input.threeJsRuntimeAllowed ?? process.env.THREE_JS_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('Three.js runtime must remain disabled.')
  if ((input.paidMapProviderAllowed ?? process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Paid map providers must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 50E renders only generated/local/offline CesiumJS 3D planning fixtures.')
  warnings.push('Cesium ion, live imagery/terrain, 3D Tiles, live tiles, geocoding, routing, paid providers, deck.gl, D3, Three.js, public artifacts, and production/beta remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
