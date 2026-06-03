# Phase 46B Dependency Execution Policy

Phase 46B may install approved generated-suite dependencies only into isolated
temporary directories. It must not change root dependency manifests or lockfiles.

Dependency caveats:

- PyAV exercises generated-only FFmpeg encode/decode paths. This does not approve broad codec use.
- Sharp exercises generated-only libvips metadata/resize paths. This does not complete LGPL/native binary review.
- OpenCV uses the headless package to avoid GUI runtime footprint.
- DuckDB must not load unapproved extensions or network sources.
- Polars must use deterministic generated metric schemas only.
