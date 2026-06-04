# Phase 50B MapLibre + Turf QA Policy

Mandatory QA gates:

- `phase50a_evidence`
- `generated_geojson_integrity`
- `turf_calculations`
- `maplibre_manifest`
- `artifact_privacy`
- `blocked_features`

Passing Phase 50B requires:

- Phase 50A map/geospatial approval evidence is present.
- Generated GeoJSON is deterministic, synthetic, bounded, and marked `generated_fixture`.
- `captureAllowed=false` and `realWorldVerified=false` remain present on generated features.
- Turf validates bbox, centroid, distance, route length, buffer, area, point-in-polygon, nearest-point, feature count, and coordinate integrity.
- MapLibre-compatible manifest contains local GeoJSON sources/layers only, with no remote sprite, glyph, tile, paid-provider, or public URL dependency.
- Private GCS artifact paths are used.
- Runtime rendering, tile downloads, geocoding/routing, paid providers, public artifacts, production, external beta, paid production, and broad media remain blocked.

Failure policy: if any mandatory gate fails, Phase 50C remains blocked.
