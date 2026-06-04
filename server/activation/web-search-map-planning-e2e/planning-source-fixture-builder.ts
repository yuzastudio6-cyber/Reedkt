import type { PlanningSourceRecord } from './web-search-map-planning-types'

export function buildGeneratedPlanningSourceRecords(): PlanningSourceRecord[] {
  return [
    source('planning-source-001', 'Phase 49P web search internal beta candidate readiness', 'https://docs.example.test/reeditpro/web-search-internal-beta', 'docs.example.test', 'Search/capture stack is ready for controlled internal beta candidate scope only.'),
    source('planning-source-002', 'Map/geospatial approval architecture notes', 'https://source.example.test/reeditpro/map-geospatial-approval', 'source.example.test', 'MapLibre, Turf, deck.gl, and OSS CesiumJS are approved for generated/private planning fixtures.'),
    source('planning-source-003', 'Generated location planning source manifest', 'https://docs.example.test/reeditpro/generated-location-manifest', 'docs.example.test', 'Generated planning candidates can feed maps without geocoding, routing, or live tiles.'),
    source('planning-source-004', 'Private artifact policy for web-search map planning', 'https://source.example.test/reeditpro/private-map-artifacts', 'source.example.test', 'Screenshots, manifests, and QA artifacts stay private and never use signed URLs as source of truth.'),
    source('planning-source-005', 'Local render network guard policy', 'https://example.invalid/reeditpro/local-render-network-guard', 'example.invalid', 'Local/offline browser fixtures must fail on tile, geocoding, routing, provider, or public network requests.'),
    source('planning-source-006', 'Controlled beta blocked scope checklist', 'https://docs.example.test/reeditpro/blocked-map-provider-scope', 'docs.example.test', 'Production, external beta, broad media, paid map providers, public SearXNG, and broad crawling remain blocked.'),
  ]
}

function source(sourceId: string, title: string, url: string, domain: string, sourceSummary: string): PlanningSourceRecord {
  return {
    sourceId,
    sourcePhase: '49P',
    title,
    url,
    domain,
    sourceType: 'generated_planning_source',
    planningTopic: 'map_geospatial_planning',
    sourceSummary,
    attributionRequired: true,
    generatedFixture: true,
    liveSearchUsed: false,
    publicSearxngUsed: false,
    paidProviderUsed: false,
    captureAllowed: false,
    extractionAllowed: false,
  }
}
