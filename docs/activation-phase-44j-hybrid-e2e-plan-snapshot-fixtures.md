# Phase 44J Plan Snapshot Fixtures

Phase 44J defines exactly 15 synthetic plan snapshot fixtures.

Eligible metadata-only fixtures:

- DeepFilterNet bounded speech cleanup.
- Signalsmith bounded timing/stretch.
- Sharp/libvips thumbnail metadata.
- DuckDB reporting.
- PaddleOCR safe-zone metadata.

Blocked fixtures:

- VLM.
- Demucs.
- Broad media.
- Public output.
- Provider calls.
- Raw chat execution.
- Missing artifact scope.
- Cost hard block.

Planning preference fixtures:

- Low-resource desktop prefers future server-worker planning.
- High desktop profile becomes a future local candidate only.

All fixtures require approved plan snapshot shape, route manifest version `track-b-route-manifest-v1`, private artifact scope references, confirmation phase metadata, audit report path, and fail-closed behavior. Route execution remains false for every fixture.
