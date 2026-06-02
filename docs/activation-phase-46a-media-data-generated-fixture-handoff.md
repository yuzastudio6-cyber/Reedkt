# Phase 46A To Phase 46B Generated Fixture Handoff

Phase 46B should run generated synthetic fixtures only after explicit approval.

Recommended fixtures:

- `generated-image-opencv-basic`
- `generated-container-pyav-probe`
- `generated-scene-cut-pyscenedetect`
- `generated-thumbnail-sharp-libvips`
- `generated-report-duckdb`
- `generated-report-polars`
- `generated-cross-tool-manifest`

Constraints:

- No real media.
- No arbitrary media input.
- No public output.
- Private artifacts only.
- Package installation/runtime images only if explicitly approved in Phase 46B.
- No beta or production unlock.
