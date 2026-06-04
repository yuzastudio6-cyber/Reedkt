import type { MapGeospatialToolScope } from './map-geospatial-approval-types'

export function buildMapGeospatialToolScopes(): MapGeospatialToolScope[] {
  return [
    {
      owner: 'map_geospatial',
      ownedCapabilities: [
        'MapLibre render/interaction/style/layers/camera/view planning',
        'Turf calculations, GeoJSON, measurement, buffers, bounds, and spatial predicates',
        'deck.gl advanced overlays, large point layers, arcs, routes, flows, heatmaps, and GPU visual layers',
        'CesiumJS optional 3D globe, terrain, 3D Tiles, camera paths, and 3D previews',
        'OSM/open data attribution, licensing, tile policy, and future self-hosted geospatial architecture',
      ],
      retainedElsewhere: [],
      blockedInPhase50A: ['runtime rendering', 'tile downloads', 'geocoding/routing API calls', 'public artifacts'],
    },
    {
      owner: 'ai_tools',
      ownedCapabilities: [],
      retainedElsewhere: [
        'D3 charts, legends, diagrams, and infographics',
        'Three.js creative 3D visuals',
        'PixiJS, Anime.js, Lottie-web, SVG.js, ECharts, Vega/Vega-Lite, Viz.js/Graphviz, Satori, and resvg creative graphics/motion design',
      ],
      blockedInPhase50A: ['claiming D3 or AI Tools creative graphics as map/geospatial ownership'],
    },
    {
      owner: 'track_b',
      ownedCapabilities: [],
      retainedElsewhere: [
        'Sharp/libvips image processing',
        'OpenCV, PyAV, PySceneDetect',
        'DuckDB, Polars, audio, OCR, VLM, and hybrid compute routing',
      ],
      blockedInPhase50A: ['moving Track B runtime/data ownership into map/geospatial approval'],
    },
    {
      owner: 'web_search',
      ownedCapabilities: [],
      retainedElsewhere: [
        'source discovery, citation/capture manifests, controlled web search/capture evidence, and future location/source data feeds',
      ],
      blockedInPhase50A: ['treating web search as map rendering/runtime or geocoding execution'],
    },
  ]
}
