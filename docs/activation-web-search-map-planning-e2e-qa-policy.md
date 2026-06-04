# Phase 50F QA Policy

Mandatory QA gates:

- `web_search_evidence`
- `map_stack_evidence`
- `planning_source_integrity`
- `location_candidate_integrity`
- `turf_planning_calculations`
- `maplibre_planning_render`
- `deckgl_planning_overlay`
- `cesiumjs_3d_planning`
- `capture_artifacts`
- `artifact_privacy`
- `blocked_features`

Phase 50G readiness is `ready_for_map_geospatial_internal_readiness_gate` only when every mandatory gate passes.

Any external request, tile request, public OSM tile request, provider URL, geocoding/routing URL, Cesium ion request, live terrain/imagery request, missing screenshot, missing private artifact, or enabled production/beta/broad flag blocks Phase 50F completion.
