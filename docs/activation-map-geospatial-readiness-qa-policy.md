# Phase 50G Map/Geospatial QA Policy

Mandatory gates:

- `phase_evidence_chain`
- `maplibre_ready`
- `turf_ready`
- `deckgl_ready`
- `cesiumjs_ready`
- `web_search_map_e2e_ready`
- `provider_data_policy`
- `network_artifact_privacy`
- `ownership_boundaries`
- `failure_policy`
- `readiness_docs_consistency`
- `blocked_features`

`mapGeospatialInternalTestingReady=true` only when every mandatory gate passes.

Phase 52A becomes ready only for shared agent and tool ownership architecture. Production, external beta, paid production, broad media, live tiles, geocoding/routing, paid map providers, public OSM tiles, Cesium ion, D3 runtime, and Three.js runtime remain blocked.
