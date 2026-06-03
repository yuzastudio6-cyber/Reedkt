# Phase 46D Media/Data Reporting QA Worker

This worker is activation-only and consumes normalized metadata rows prepared by the TypeScript Phase 46D activation runner.

It must not read media, frames, thumbnails, OCR payloads, VLM payloads, arbitrary paths, public URLs, or signed URLs. DuckDB runs in-memory and Polars operates on metadata tables only. Runtime dependencies are installed only into temporary execution directories.
