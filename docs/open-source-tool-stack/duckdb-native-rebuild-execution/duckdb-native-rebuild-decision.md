# DuckDB Native Rebuild Decision

- Decision: `duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing`
- Readiness: true
- Command: `npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund`
- DuckDB package: duckdb@1.4.4
- Polars package: nodejs-polars@0.25.1
- Next prompt: `OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW`
- Package JSON changed: false
- Package lock changed: false
- Native artifacts committed: false
- Supabase update: no write

Blocked scopes remain blocked: workers, routes, providers, media, Supabase, SQL, GCS, public artifacts, signed URLs, raw prompts, beta, and production.
