import type { MapGeospatialLicenseReview } from './map-geospatial-approval-types'

export function buildMapGeospatialLicenseReviews(): MapGeospatialLicenseReview[] {
  return [
    approved('maplibre-gl-js', 'BSD-3-Clause', 'https://github.com/maplibre/maplibre-gl-js', 'https://maplibre.org/maplibre-gl-js/docs/', 'Permissive OSS library planning approved; runtime still requires dependency/security review.'),
    approved('turf-js', 'MIT', 'https://github.com/Turfjs/turf', 'https://turfjs.org/', 'Permissive OSS geospatial calculation planning approved; runtime still requires dependency/security review.'),
    approved('deck-gl', 'MIT', 'https://github.com/visgl/deck.gl', 'https://deck.gl/', 'Permissive OSS advanced overlay planning approved; WebGL performance and browser support need fixture QA.'),
    approved('cesium-js', 'Apache-2.0', 'https://github.com/CesiumGS/cesium', 'https://cesium.com/platform/cesiumjs/', 'OSS CesiumJS planning approved only; Cesium ion paid assets and services remain blocked.'),
    {
      toolId: 'openstreetmap-open-data',
      licenseIdentified: true,
      licenseName: 'ODbL-1.0 for OSM data; separate tile service usage policies',
      officialSourceUrl: 'https://www.openstreetmap.org/copyright',
      officialDocsUrl: 'https://operations.osmfoundation.org/policies/tiles/',
      commercialUseStatus: 'Open data can be planned with attribution and ODbL compliance; public tile services are not a production/beta dependency.',
      redistributionStatus: 'Redistribution/adaptation requires OSM attribution and ODbL compliance.',
      selfHostingStatus: 'Self-hosted/open tile strategy preferred for later beta/production paths.',
      requiresApiKeyByDefault: false,
      paidProviderDependencyByDefault: false,
      codexDecision: 'staging_planning_approved',
      decisionReason: 'Open map-data planning is approved with attribution/license caveats and no public tile hotlinking approval.',
    },
    pending('pmtiles', 'Static map archive candidate pending future evidence/runtime review.'),
    pending('tileserver-gl', 'Self-hosted tile service candidate pending future evidence/runtime review.'),
    pending('martin', 'Self-hosted tile service candidate pending future evidence/runtime review.'),
    pending('nominatim', 'Geocoding candidate pending future self-host/private policy review; public heavy use remains blocked.'),
    pending('photon', 'Geocoding candidate pending future self-host/private policy review.'),
    pending('pelias', 'Geocoding candidate pending future self-host/private policy review.'),
    pending('osrm', 'Routing candidate pending future self-host/private policy review.'),
    pending('valhalla', 'Routing candidate pending future self-host/private policy review.'),
  ]
}

function approved(toolId: MapGeospatialLicenseReview['toolId'], licenseName: string, officialSourceUrl: string, officialDocsUrl: string, decisionReason: string): MapGeospatialLicenseReview {
  return {
    toolId,
    licenseIdentified: true,
    licenseName,
    officialSourceUrl,
    officialDocsUrl,
    commercialUseStatus: 'Planning approved; production/runtime use requires later dependency, security, and legal review.',
    redistributionStatus: 'Planning metadata only; no package, rendered output, or redistributed artifact is created in Phase 50A.',
    selfHostingStatus: 'No hosted runtime in Phase 50A.',
    requiresApiKeyByDefault: false,
    paidProviderDependencyByDefault: false,
    codexDecision: 'staging_planning_approved',
    decisionReason,
  }
}

function pending(toolId: MapGeospatialLicenseReview['toolId'], decisionReason: string): MapGeospatialLicenseReview {
  return {
    toolId,
    licenseIdentified: false,
    licenseName: 'future_review_required',
    officialSourceUrl: '',
    officialDocsUrl: '',
    commercialUseStatus: 'Pending future evidence.',
    redistributionStatus: 'Pending future evidence.',
    selfHostingStatus: 'Future-scoped; no public hosted dependency is approved.',
    requiresApiKeyByDefault: false,
    paidProviderDependencyByDefault: false,
    codexDecision: 'pending_evidence',
    decisionReason,
  }
}
