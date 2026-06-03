# Phase 46B Generated Media/Data Analysis Suite

Phase 46B executes deterministic generated fixtures for the Track B media/data
tool family after Phase 46A readiness evidence.

Tools in scope:

- OpenCV
- PyAV
- PySceneDetect
- Sharp / libvips
- DuckDB
- Polars

Execution is generated-only. The suite does not accept arbitrary media paths,
does not process real media, does not run OCR or VLM, does not call providers,
does not run Docker/Cloud Run, does not mutate IAM, and does not touch Track A.

Runtime dependencies are installed only into temporary execution directories for
this generated-fixture phase. `package-lock.json` remains unchanged.
