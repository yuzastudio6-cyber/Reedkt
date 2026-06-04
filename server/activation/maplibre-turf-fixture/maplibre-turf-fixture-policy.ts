import type { MapLibreTurfFixtureConfig, MapLibreTurfFixtureQaGateId, MapLibreTurfFixtureSafetyFlags } from './maplibre-turf-fixture-types'

export const mapLibreTurfFixtureConfig: MapLibreTurfFixtureConfig = {
  phase: '50B',
  mode: 'maplibre_turf_generated_local_fixture',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  coordinateFixtureMode: 'synthetic_planning_city',
  maxGeneratedPoints: 8,
  maxGeneratedRoutes: 2,
  maxGeneratedPolygons: 2,
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
  reportObjectPrefix: 'activation-map-geospatial/phase50b',
}

export const mapLibreTurfFixtureSafetyFlags: MapLibreTurfFixtureSafetyFlags = {
  turfCalculationsAllowed: true,
  mapLibreManifestAllowed: true,
  mapLibreBrowserRuntimeAllowed: false,
  mapRenderingAllowed: false,
  tileDownloadAllowed: false,
  liveTileProviderAllowed: false,
  geocodingAllowed: false,
  routingAllowed: false,
  paidMapProviderAllowed: false,
  publicArtifactAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}

export const mapLibreTurfFixtureGateIds: MapLibreTurfFixtureQaGateId[] = [
  'phase50a_evidence',
  'generated_geojson_integrity',
  'turf_calculations',
  'maplibre_manifest',
  'artifact_privacy',
  'blocked_features',
]

export const mapLibreTurfFixtureRequiredScripts = [
  'activation:maplibre-turf-fixture',
  'activation:maplibre-turf-fixture:report',
  'activation:maplibre-turf-fixture:iam-plan',
  'smoke:activation-maplibre-turf-fixture',
] as const

export const mapLibreTurfFixtureRequiredDocs = [
  'docs/activation-maplibre-turf-fixture-runbook.md',
  'docs/activation-maplibre-turf-fixture-policy.md',
  'docs/activation-maplibre-turf-fixture-artifact-policy.md',
  'docs/activation-maplibre-turf-fixture-qa-policy.md',
  'docs/activation-phase-50b-maplibre-turf-fixture-results.md',
] as const

export function makeMapLibreTurfFixtureRunId(): string {
  return `phase50b-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
}

export function mapLibreTurfFixtureArtifactPrefix(runId: string): string {
  if (!/^phase50b-[0-9A-Za-z]+$/.test(runId)) throw new Error(`Unsafe Phase 50B run id: ${runId}`)
  return `${mapLibreTurfFixtureConfig.reportObjectPrefix}/${runId}`
}

export function validateMapLibreTurfFixtureExecutionEnv(input: {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  mode?: string
  tileDownloadAllowed?: string
  liveTileProviderAllowed?: string
  geocodingAllowed?: string
  routingAllowed?: string
  paidMapProviderAllowed?: string
  publicArtifactAllowed?: string
  mapRenderingAllowed?: string
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
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE
  const mode = input.mode ?? process.env.REEDITPRO_MAPLIBRE_TURF_FIXTURE_MODE ?? mapLibreTurfFixtureConfig.mode

  if (projectId !== mapLibreTurfFixtureConfig.projectId) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== mapLibreTurfFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== mapLibreTurfFixtureConfig.region) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== mapLibreTurfFixtureConfig.env) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE=true is required for execution.')
  if (mode !== mapLibreTurfFixtureConfig.mode) blockers.push('Mode must be exactly maplibre_turf_generated_local_fixture.')
  if ((input.tileDownloadAllowed ?? process.env.TILE_DOWNLOAD_ALLOWED ?? 'false') !== 'false') blockers.push('Tile download must remain disabled.')
  if ((input.liveTileProviderAllowed ?? process.env.LIVE_TILE_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Live tile providers must remain disabled.')
  if ((input.geocodingAllowed ?? process.env.GEOCODING_ALLOWED ?? 'false') !== 'false') blockers.push('Geocoding must remain disabled.')
  if ((input.routingAllowed ?? process.env.ROUTING_ALLOWED ?? 'false') !== 'false') blockers.push('Routing must remain disabled.')
  if ((input.paidMapProviderAllowed ?? process.env.PAID_MAP_PROVIDER_ALLOWED ?? 'false') !== 'false') blockers.push('Paid map providers must remain disabled.')
  if ((input.publicArtifactAllowed ?? process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false') !== 'false') blockers.push('Public artifacts/access must remain disabled.')
  if ((input.mapRenderingAllowed ?? process.env.MAP_RENDERING_ALLOWED ?? 'false') !== 'false') blockers.push('Map rendering must remain disabled.')
  if ((input.productionReady ?? process.env.REEDITPRO_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Production-ready flag must remain false.')
  if ((input.externalBetaReady ?? process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false') !== 'false') blockers.push('External beta flag must remain false.')
  if ((input.paidProductionReady ?? process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false') !== 'false') blockers.push('Paid production flag must remain false.')
  if ((input.broadRealMediaReady ?? process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false') !== 'false') blockers.push('Broad real-media flag must remain false.')
  warnings.push('Phase 50B executes generated/local GeoJSON and Turf calculations only.')
  warnings.push('Map rendering, live tiles, geocoding, routing, Playwright, screenshots, paid providers, public artifacts, and production/beta remain blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
