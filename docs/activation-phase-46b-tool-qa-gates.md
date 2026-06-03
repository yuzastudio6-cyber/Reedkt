# Phase 46B Tool QA Gates

Global gates:

- Generated synthetic fixtures only.
- No real media.
- No arbitrary media paths.
- No public output.
- No provider calls.
- No OCR or VLM execution.
- Tool versions and dependency caveats recorded.
- Private artifact policy honored.

Tool gates:

- OpenCV: generated image loads, dimensions match, expected color/shape regions are detected.
- PyAV: generated container opens, video stream metadata is present, decoded frame count is within tolerance.
- PySceneDetect: generated color-block video yields expected scene boundaries within tolerance.
- Sharp/libvips: generated image metadata reads and thumbnail dimensions match.
- DuckDB: generated metrics load and aggregate counts match without network/extension use.
- Polars: generated metrics load and grouped status counts match.
