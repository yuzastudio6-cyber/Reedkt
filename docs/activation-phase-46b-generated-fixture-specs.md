# Phase 46B Generated Fixture Specs

Required generated fixtures:

- `generated-image-opencv-basic`: synthetic PNG with red rectangle, blue circle, and green line.
- `generated-container-pyav-probe`: synthetic short video/container for stream metadata and generated frame decode.
- `generated-scene-cut-pyscenedetect`: synthetic three-scene color-block video for scene boundary detection.
- `generated-thumbnail-sharp-libvips`: synthetic image metadata and thumbnail resize through Sharp/libvips.
- `generated-report-duckdb`: generated metric rows aggregated in an in-memory DuckDB database.
- `generated-report-polars`: generated metric rows transformed and grouped with Polars.
- `generated-cross-tool-manifest`: combined private QA manifest with tool status, versions, and artifact hashes.

All fixtures are created in local temp storage. Binary generated fixture payloads
must not be committed.
