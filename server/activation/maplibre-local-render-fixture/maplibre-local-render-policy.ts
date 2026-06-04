import type { MapLibreLocalRenderConfig, MapLibreLocalRenderQaGateId, MapLibreLocalRenderSafetyFlags } from './maplibre-local-render-types'

export const mapLibreLocalRenderConfig: MapLibreLocalRenderConfig = {
  phase: '50C',
  mode: 'maplibre_local_offline_render_capture_fixture',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedPhase50BRunId: 'phase50b-20260604T01114',
  approvedPhase50BReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50b/phase50b-20260604T01114/reports/phase50b-report.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-map-geospatial/phase50c',
  viewport: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  previewMaxWidth: 960,
  thumbnailWidth: 320,
  maxGeneratedPoints: 8,
  maxGeneratedRoutes: 2,
  maxGeneratedPolygons: 2,
}

export const mapLibreLocalRenderSafetyFlags: MapLibreLocalRenderSafetyFlags = {
  mapLibreBrowserRuntimeAllowed: true,
  mapRenderingAllowed: true,
  playwrightCaptureAllowed: true,
  externalNetworkRequestsAllowed: false,
  tileDownloadAllowed: false,
  liveTileProviderAllowed: false,
  publicOsmTileAllowed: false,
  mapboxProviderAllowed: false,
  googleMapsProviderAllowed: false,
  cesiumIonAllowed: false,
  geocodingAllowed: false,
  routingAllowed: false,
  deckGlRuntimeAllowed: false,
  cesiumJsRuntimeAllowed: false,
  paidMapProviderAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const mapLibreLocalRenderQaGateIds: MapLibreLocalRenderQaGateId[] = [
  'phase50b_evidence',
  'generated_geojson_integrity',
  'local_style_integrity',
  'maplibre_local_render',
  'network_guard',
  'playwright_capture',
  'optional_screenshot_processing',
  'artifact_privacy',
  'blocked_features',
]

export const mapLibreLocalRenderRequiredScripts = [
  'activation:maplibre-local-render-fixture',
  'activation:maplibre-local-render-fixture:report',
  'activation:maplibre-local-render-fixture:iam-plan',
  'smoke:activation-maplibre-local-render-fixture',
] as const

export const mapLibreLocalRenderRequiredDocs = [
  'docs/activation-maplibre-local-render-fixture-runbook.md',
  'docs/activation-maplibre-local-render-fixture-policy.md',
  'docs/activation-maplibre-local-render-fixture-artifact-policy.md',
  'docs/activation-maplibre-local-render-fixture-qa-policy.md',
  'docs/activation-phase-50c-maplibre-local-render-fixture-results.md',
] as const

export function makeMapLibreLocalRenderRunId(): string {
  const now = new Date()
  return `phase50c-${now.toISOString().slice(0, 10).replace(/-/g, '')}T${now.toISOString().slice(11, 19).replace(/:/g, '')}`
}

export function mapLibreLocalRenderArtifactPrefix(runId: string): string {
  if (!/^phase50c-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 50C run id: ${runId}`)
  return `${mapLibreLocalRenderConfig.reportObjectPrefix}/${runId}`
}

export function validateMapLibreLocalRenderExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
  externalNetworkRequestsAllowed?: string
  tileDownloadAllowed?: string
  liveTileProviderAllowed?: string
  publicOsmTileAllowed?: string
  geocodingAllowed?: string
  routingAllowed?: string
  paidMapProviderAllowed?: string
  publicArtifactAllowed?: string
  deckGlRuntimeAllowed?: string
  cesiumJsRuntimeAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_MAPLIBRE_LOCAL_RENDER_CAPTURE
  const mode = input.mode ?? process.env.REEDITPRO_MAPLIBRE_LOCAL_RENDER_MODE ?? mapLibreLocalRenderConfig.mode

  if (projectId !== mapLibreLocalRenderConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== mapLibreLocalRenderConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== mapLibreLocalRenderConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== mapLibreLocalRenderConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_MAPLIBRE_LOCAL_RENDER_CAPTURE=true is required for execution.')
  if (mode !== mapLibreLocalRenderConfig.mode) blockers.push('Mode must be exactly maplibre_local_offline_render_capture_fixture.')
  if ((input.externalNetworkRequestsAllowed ?? process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false') !== 'false') blockers.push('External network requests must remain disabled.')
  if ((input.tileDownloadAllowed ?? process.env.TILE_DOWNLOAD_ALLOWED ?? 'false') !== 'false') blockers.push('Tile download must remain disabled.')
  if ((input.liveTileProviderAllowed ?? process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live tile providers must remain disabled.')
  if ((input.publicOsmTileAllowed ?? process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false') !== 'false') blockers.push('Public OSM tiles must remain disabled.')
  if ((input.geocodingAllowed ?? process.env.GEOCODING_ALLOWED ?? 'false') !== 'false') blockers.push('Geocoding must remain disabled.')
  if ((input.routingAllowed ?? process.env.ROUTING_ALLOWED ?? 'false') !== 'false') blockers.push('Routing must remain disabled.')
  if ((input.paidMapProviderAllowed ?? process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Paid map providers must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.deckGlRuntimeAllowed ?? process.env.DECK_GL_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('deck.gl runtime must remain disabled.')
  if ((input.cesiumJsRuntimeAllowed ?? process.env.CESIUM_JS_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('CesiumJS runtime must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 50C renders only a generated/local/offline MapLibre fixture.')
  warnings.push('Live tiles, public OSM tiles, geocoding, routing, paid providers, deck.gl, CesiumJS, public artifacts, and production/beta remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
