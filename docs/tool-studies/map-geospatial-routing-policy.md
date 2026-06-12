# MAP_GEOSPATIAL Routing Policy

## Route Selection

Use no map when:

- geography does not materially improve the edit;
- a text card, timeline, chart, or diagram communicates the idea more clearly;
- the location is too uncertain for exact pins or route lines;
- a map would create documentary/case-study certainty that the source material does not support.

Use `turf` when approved GeoJSON or coordinates need deterministic math: bounds, center, distance, buffers, simplification, interpolation, fit-bounds padding, or route geometry prep. Turf does not render and must not be used as location truth by itself.

Use `maplibre` when a 2D map scene needs planned style, labels, pins, route lines, layers, camera, or safe zones. MapLibre is planning-only in this phase and does not fetch live tiles or render output.

Use `deck_gl` only for future advanced geospatial overlays, such as arcs, heatmaps, point clouds, and dense data layers. It is not a launch default and should not replace simple MapLibre route or pin maps.

Use `cesium_js` only for future approved 3D globe or world-scale map scenes. Cesium ion, live terrain, live imagery, and 3D Tiles remain blocked unless a later phase explicitly approves them.

Request `AI_TOOLS_CREATIVE_GRAPHICS` only when the user needs a stylized, illustrative, non-authoritative graphic inspired by geography. AI Tools must not invent exact maps, roads, labels, pins, routes, coordinates, or map source truth.

Hand off to `TRACK_A_RENDER_EXPORT` only after approved GeoJSON, style, camera, timing, and render manifests exist. Track A owns final composition/export in a future phase; MAP_GEOSPATIAL owns map capability routing and manifest truth.

## Source-Of-Truth Policy

Source-of-truth evidence:

- approved GeoJSON manifests;
- map style manifests;
- camera manifests;
- timing manifests;
- render manifests;
- tile/geocoding/routing policy manifests when later approved.

Review artifacts only:

- map screenshots;
- preview images;
- local mock cards;
- dry-run fixture summaries.

Not source-of-truth:

- signed URLs;
- public artifacts;
- raw prompts;
- raw map provider payloads;
- live tile responses;
- live geocoding responses;
- live routing responses;
- Cesium ion or live terrain/imagery payloads.

## Blocked Provider And Service Policy

Public OSM tile hotlinking, live geocoding, live routing, paid map providers, Cesium ion, live terrain, live imagery, 3D Tiles, and production/external beta usage are blocked until a future phase approves service terms, privacy, cost controls, attribution, private artifact policy, worker/runtime boundaries, and QA.
