# MAP_GEOSPATIAL Tool Combination Map

This map defines review-only combinations. None of these combinations executes in TOOL-STUDY-0.

| Combination | Use When | Capabilities | Output Contract | Blocked Until |
| --- | --- | --- | --- | --- |
| `geojson_math_to_2d_scene` | exact route, bounds, distance, or fit-bounds planning is needed | `generated_local_geojson_fixtures`, `turf`, `maplibre`, `map_style_manifest`, `camera_manifest`, `timing_manifest`, `render_manifest` | approved GeoJSON plus style/camera/timing/render manifests | future approved worker/tool execution |
| `static_location_card` | a simple location cue is enough or exact map confidence is low | `map_style_manifest`, `camera_manifest`, `render_manifest` | non-rendering card/map manifest with safe wording | Track A final composition approval |
| `route_reveal_map` | a travel, documentary, case, or real estate route should be explained | `turf`, `maplibre`, `camera_manifest`, `timing_manifest`, `render_manifest` | route geometry and camera/timing manifests | live routing/geocoding remains blocked |
| `advanced_geospatial_overlay_future` | arcs, heatmaps, point clouds, or dense geospatial data would improve the edit | `deck_gl`, `maplibre`, `map_style_manifest`, `camera_manifest`, `render_manifest` | advanced layer manifest for review | future deck.gl approval and data QA |
| `globe_scene_future` | world-scale geography needs 3D context | `cesium_js`, `camera_manifest`, `timing_manifest`, `render_manifest` | 3D scene/camera manifest for review | Cesium ion, live terrain, live imagery, and 3D Tiles approval |
| `private_tile_source_future` | public tile hotlinking must be avoided and offline/private basemaps are needed | `openstreetmap_open_map_data_policy`, `pmtiles_tileserver_gl_martin_future`, `map_style_manifest` | tile source policy manifest | infra, license, attribution, and security approval |
| `geocoding_future` | user/source-approved locations need coordinates | `openstreetmap_open_map_data_policy`, `nominatim_photon_pelias_future`, `generated_local_geojson_fixtures` | geocoding policy and confidence manifest | privacy, consent, terms, and service approval |
| `routing_future` | source-approved coordinates need path geometry | `osrm_valhalla_future`, `turf`, `maplibre`, `timing_manifest` | route policy and geometry manifest | route service approval and privacy review |

## Combination Rules

- Use the simplest combination that explains the edit beat with source-safe geography.
- Prefer `static_location_card` or approximate region visuals when exact location confidence is low.
- Do not add deck.gl or CesiumJS when MapLibre and Turf can explain the geography clearly.
- Do not use AI_TOOLS_CREATIVE_GRAPHICS for factual map truth; use it only for illustrative, non-authoritative styling.
- Do not treat screenshots, previews, public artifacts, signed URLs, raw prompts, live tile responses, geocoding responses, or routing responses as source-of-truth.
