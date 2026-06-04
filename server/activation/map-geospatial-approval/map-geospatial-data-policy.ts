import type { MapGeospatialDataPolicy } from './map-geospatial-approval-types'

export function buildMapGeospatialDataPolicy(): MapGeospatialDataPolicy {
  return {
    freeOpenSourceOpenDataFirst: true,
    privateSelfHostedGeneratedFixturesFirst: true,
    paidMapProvidersAllowed: false,
    publicTileHotlinkingForBetaProdAllowed: false,
    osmAttributionRequired: true,
    offlineStaticGeneratedBeforeLiveDependencies: true,
    mapboxPaidTilesAllowed: false,
    googleMapsApisAllowed: false,
    cesiumIonPaidAssetsAllowed: false,
    publicNominatimHeavyUseAllowed: false,
    publicOsmTileProdBetaHotlinkingAllowed: false,
    arbitraryTileEndpointsAllowed: false,
    frontendMapProviderSecretsAllowed: false,
    publicArtifactsAllowed: false,
    notes: [
      'Use free/open-source/open-data defaults first.',
      'Use generated, local, private, or self-hosted fixtures before live tile/geocoding/routing dependencies.',
      'OSM attribution is mandatory when OSM data appears in a future rendered output.',
      'Public tile services are not approved as beta/production dependencies.',
      'Mapbox, Google Maps, Cesium ion, and other paid providers require separate future provider/secret/cost/legal approval.',
    ],
  }
}
