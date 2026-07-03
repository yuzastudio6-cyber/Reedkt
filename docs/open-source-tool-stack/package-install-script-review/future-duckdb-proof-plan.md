# Future DuckDB Proof Plan

Future native repair command: `npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund`

After repair, proof is limited to DuckDB import/API-shape or version and a tiny in-memory `select 1 as ok` metadata query. No files, media, network data, Supabase, or GCS are allowed.
