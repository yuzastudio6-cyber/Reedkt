import type { MapGeospatialProviderDataAudit } from './map-geospatial-readiness-types'

export function buildMapGeospatialProviderDataAudit(): MapGeospatialProviderDataAudit {
  return {
    auditId: 'phase50g-provider-data-policy-audit',
    liveTileProviderAllowed: false,
    publicOsmTileAllowed: false,
    tileDownloadAllowed: false,
    mapboxPaidApiAllowed: false,
    googleMapsApiAllowed: false,
    cesiumIonAllowed: false,
    liveTerrainAllowed: false,
    liveImageryAllowed: false,
    threeDTilesAllowed: false,
    liveGeocodingAllowed: false,
    liveRoutingAllowed: false,
    arbitraryTileEndpointAllowed: false,
    paidMapProviderAllowed: false,
    publicArtifactPathAllowed: false,
    osmAttributionCaveatsDocumented: true,
    futureSelfHostedTilePathDocumented: true,
    futureScopedCandidates: ['PMTiles', 'TileServer GL', 'Martin', 'Nominatim', 'Photon', 'Pelias', 'OSRM', 'Valhalla'],
    blockers: [],
    warnings: [
      'OpenStreetMap/open map data remains planning-approved with attribution and tile-usage caveats only.',
      'Self-hosted/private tile, geocoding, and routing candidates remain future-scoped.',
    ],
  }
}
