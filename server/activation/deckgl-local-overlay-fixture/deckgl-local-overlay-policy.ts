import type { DeckGlLocalOverlayConfig, DeckGlLocalOverlayQaGateId, DeckGlLocalOverlaySafetyFlags } from './deckgl-local-overlay-types'

export const deckGlLocalOverlayConfig: DeckGlLocalOverlayConfig = {
  phase: '50D',
  mode: 'deckgl_local_offline_overlay_fixture',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedPhase50CRunId: 'phase50c-20260604T020852',
  approvedPhase50CReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50c/phase50c-20260604T020852/reports/phase50c-report.json',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-map-geospatial/phase50d',
  viewport: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  previewMaxWidth: 960,
  thumbnailWidth: 320,
  maxDeckGlLayers: 4,
  maxGeneratedFlows: 4,
}

export const deckGlLocalOverlaySafetyFlags: DeckGlLocalOverlaySafetyFlags = {
  mapLibreBrowserRuntimeAllowed: true,
  deckGlRuntimeAllowed: true,
  deckGlRuntimeScope: 'generated_local_overlay_fixture_only',
  mapRenderingAllowed: true,
  playwrightCaptureAllowed: true,
  sharpProcessingAllowed: true,
  externalNetworkRequestsAllowed: false,
  tileDownloadAllowed: false,
  liveTileProviderAllowed: false,
  publicOsmTileAllowed: false,
  mapboxProviderAllowed: false,
  googleMapsProviderAllowed: false,
  cesiumIonAllowed: false,
  geocodingAllowed: false,
  routingAllowed: false,
  paidMapProviderAllowed: false,
  cesiumJsRuntimeAllowed: false,
  d3RuntimeAllowed: false,
  threeJsRuntimeAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const deckGlLocalOverlayQaGateIds: DeckGlLocalOverlayQaGateId[] = [
  'phase50c_evidence',
  'generated_overlay_data_integrity',
  'local_style_integrity',
  'deckgl_overlay_render',
  'maplibre_base_render',
  'network_guard',
  'playwright_capture',
  'optional_screenshot_processing',
  'artifact_privacy',
  'blocked_features',
]

export const deckGlLocalOverlayRequiredScripts = [
  'activation:deckgl-local-overlay-fixture',
  'activation:deckgl-local-overlay-fixture:report',
  'activation:deckgl-local-overlay-fixture:iam-plan',
  'smoke:activation-deckgl-local-overlay-fixture',
] as const

export const deckGlLocalOverlayRequiredDocs = [
  'docs/activation-deckgl-local-overlay-fixture-runbook.md',
  'docs/activation-deckgl-local-overlay-fixture-policy.md',
  'docs/activation-deckgl-local-overlay-fixture-artifact-policy.md',
  'docs/activation-deckgl-local-overlay-fixture-qa-policy.md',
  'docs/activation-phase-50d-deckgl-local-overlay-fixture-results.md',
] as const

export function makeDeckGlLocalOverlayRunId(): string {
  const now = new Date()
  return `phase50d-${now.toISOString().slice(0, 10).replace(/-/g, '')}T${now.toISOString().slice(11, 19).replace(/:/g, '')}`
}

export function deckGlLocalOverlayArtifactPrefix(runId: string): string {
  if (!/^phase50d-(?:[0-9]{8}T[0-9]{6}|planned|smoke)$/.test(runId)) throw new Error(`Unsafe Phase 50D run id: ${runId}`)
  return `${deckGlLocalOverlayConfig.reportObjectPrefix}/${runId}`
}

export function validateDeckGlLocalOverlayExecutionEnv(input: {
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
  mapboxProviderAllowed?: string
  googleMapsProviderAllowed?: string
  cesiumIonAllowed?: string
  geocodingAllowed?: string
  routingAllowed?: string
  paidMapProviderAllowed?: string
  publicArtifactAllowed?: string
  cesiumJsRuntimeAllowed?: string
  d3RuntimeAllowed?: string
  threeJsRuntimeAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_DECKGL_LOCAL_OVERLAY_FIXTURE
  const mode = input.mode ?? process.env.REEDITPRO_DECKGL_LOCAL_OVERLAY_MODE ?? deckGlLocalOverlayConfig.mode

  if (projectId !== deckGlLocalOverlayConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== deckGlLocalOverlayConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== deckGlLocalOverlayConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== deckGlLocalOverlayConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_DECKGL_LOCAL_OVERLAY_FIXTURE=true is required for execution.')
  if (mode !== deckGlLocalOverlayConfig.mode) blockers.push('Mode must be exactly deckgl_local_offline_overlay_fixture.')
  if ((input.externalNetworkRequestsAllowed ?? process.env.EXTERNAL_NETWORK_REQUESTS_ALLOWED ?? 'false') !== 'false') blockers.push('External network requests must remain disabled.')
  if ((input.tileDownloadAllowed ?? process.env.TILE_DOWNLOAD_ALLOWED ?? 'false') !== 'false') blockers.push('Tile download must remain disabled.')
  if ((input.liveTileProviderAllowed ?? process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live tile providers must remain disabled.')
  if ((input.publicOsmTileAllowed ?? process.env.PUBLIC_OSM_TILE_ALLOWED ?? 'false') !== 'false') blockers.push('Public OSM tiles must remain disabled.')
  if ((input.mapboxProviderAllowed ?? process.env.MAPBOX_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Mapbox provider access must remain disabled.')
  if ((input.googleMapsProviderAllowed ?? process.env.GOOGLE_MAPS_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Google Maps provider access must remain disabled.')
  if ((input.cesiumIonAllowed ?? process.env.CESIUM_ION_ALLOWED ?? 'false') !== 'false') blockers.push('Cesium ion must remain disabled.')
  if ((input.geocodingAllowed ?? process.env.GEOCODING_ALLOWED ?? 'false') !== 'false') blockers.push('Geocoding must remain disabled.')
  if ((input.routingAllowed ?? process.env.ROUTING_ALLOWED ?? 'false') !== 'false') blockers.push('Routing must remain disabled.')
  if ((input.paidMapProviderAllowed ?? process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Paid map providers must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.cesiumJsRuntimeAllowed ?? process.env.CESIUM_JS_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('CesiumJS runtime must remain disabled.')
  if ((input.d3RuntimeAllowed ?? process.env.D3_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('D3 runtime must remain disabled.')
  if ((input.threeJsRuntimeAllowed ?? process.env.THREE_JS_RUNTIME_ALLOWED ?? 'false') !== 'false') blockers.push('Three.js runtime must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 50D renders only generated/local/offline deck.gl overlays on the Phase 50C MapLibre fixture pattern.')
  warnings.push('Live tiles, public OSM tiles, geocoding, routing, paid providers, CesiumJS, D3, Three.js, public artifacts, and production/beta remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
