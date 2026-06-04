import type { MapGeospatialOwnershipAudit } from './map-geospatial-readiness-types'

export function buildMapGeospatialOwnershipAudit(): MapGeospatialOwnershipAudit {
  return {
    auditId: 'phase50g-ownership-boundary-audit',
    mapGeospatialOwns: [
      'MapLibre planning and local/offline fixture evidence',
      'Turf generated GeoJSON calculations',
      'deck.gl local/offline overlay fixture evidence',
      'CesiumJS OSS local/offline 3D planning fixture evidence',
      'OSM/open data policy, attribution caveats, and future tile/geocoder/router architecture',
    ],
    aiToolsOwns: [
      'D3.js',
      'Three.js',
      'PixiJS',
      'Anime.js',
      'Lottie-web',
      'SVG.js',
      'Apache ECharts',
      'Vega/Vega-Lite',
      'Viz.js/Graphviz',
      'Satori',
      '@resvg/resvg-js',
      'creative graphics and motion design runtime',
    ],
    trackBOwns: [
      'Sharp/libvips general image-processing capability',
      'OpenCV',
      'PyAV',
      'PySceneDetect',
      'PaddleOCR/PaddlePaddle',
      'DuckDB',
      'Polars',
      'audio/OCR/VLM/compute routing',
    ],
    webSearchOwns: [
      'web search provider policy',
      'browser capture policy',
      'Readability extraction policy',
      'search/capture/extraction internal readiness gates',
    ],
    sharpOwnershipPreserved: true,
    d3ThreeOwnershipPreserved: true,
    blockers: [],
    warnings: ['Phase 50G consumes web-search handoff and Sharp screenshot-derivative evidence without claiming broader ownership.'],
  }
}
