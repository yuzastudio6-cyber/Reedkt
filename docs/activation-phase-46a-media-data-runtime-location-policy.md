# Phase 46A Media/Data Runtime Location Policy

OpenCV, PyAV, and PySceneDetect belong in Python worker/runtime images only. They must not be imported by the browser frontend.

Sharp/libvips belongs in Node server/worker images only. It must not be imported by browser UI code.

DuckDB and Polars belong in QA/reporting workers or safe local CLIs. They must not expose private media/text metadata to frontend or committed reports.

Phase 46A does not build runtime images. Phase 46B must explicitly approve any package installation/runtime image work before generated fixture execution.
