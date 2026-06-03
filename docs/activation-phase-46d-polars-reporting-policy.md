# Phase 46D Polars Reporting Policy

Polars transforms the same normalized metadata rows used by DuckDB.

Polars must not read cloud/object-store paths, media files, frames, thumbnails, OCR payloads, VLM payloads, or arbitrary user paths. Polars output is used for consistency checks and internal QA summaries only.
