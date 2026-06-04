# Phase 50A Map/Geospatial Approval Policy

Phase 50A approves map/geospatial architecture for staging planning only.

## Defaults

- `mapLibrePlanningAllowed=true`
- `turfPlanningAllowed=true`
- `deckGlPlanningAllowed=true`
- `cesiumJsPlanningAllowed=true` for OSS CesiumJS only
- `mapRuntimeAllowed=false`
- `tileDownloadAllowed=false`
- `liveGeocodingAllowed=false`
- `liveRoutingAllowed=false`
- `paidMapProviderAllowed=false`
- `publicArtifactAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadMediaAllowed=false`

## Ownership

Map/geospatial owns MapLibre, Turf, deck.gl, CesiumJS planning, OSM/open data policy, and future tile/geocoding/routing architecture.

AI Tools retains D3, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, Apache ECharts, Vega/Vega-Lite, Viz.js/Graphviz, Satori, resvg, and creative graphics/motion design.

Track B retains Sharp/libvips, OpenCV, PyAV, PySceneDetect, DuckDB, Polars, audio, OCR, VLM, and compute routing.

Web search may later provide source and location evidence, but it does not become map rendering or geocoding runtime.

## Provider Policy

Free/open-source/open-data paths are preferred. Generated, local, private, or self-hosted fixtures must come before live map dependencies.

Blocked by default:

- Mapbox paid tiles/APIs
- Google Maps APIs
- Cesium ion paid assets/services
- public Nominatim heavy use
- public OSM tile hotlinking for beta/production
- arbitrary tile endpoints
- frontend map provider secrets
- public artifacts
